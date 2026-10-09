/**
 * E2E-проверки в настоящем браузере (Chrome DevTools Protocol, без зависимостей).
 * Запуск: node tests/e2e.mjs  (нужен запущенный dev-сервер на 5173)
 */
import { spawn } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const URL_APP = process.env.APP_URL ?? 'http://localhost:5173/'
const CHROME =
  process.env.CHROME_PATH ??
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const PORT = 9333

let passed = 0
const failures = []

function check(name, condition, detail = '') {
  if (condition) {
    passed += 1
    console.log(`ok   ${name}`)
  } else {
    failures.push(`${name}${detail ? ` — ${detail}` : ''}`)
    console.error(`FAIL ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** Ошибки страницы: необработанные исключения и error-уровень консоли/сети. */
function collectErrors(cdp) {
  return cdp.events
    .filter((e) => {
      if (e.method === 'Runtime.exceptionThrown') return true
      if (e.method !== 'Log.entryAdded' || e.params.entry.level !== 'error') return false
      return !/favicon|telegram-web-app/.test(e.params.entry.url ?? '')
    })
    .map((e) =>
      e.method === 'Runtime.exceptionThrown'
        ? e.params.exceptionDetails.exception?.description ?? 'exception'
        : `${e.params.entry.text} ${e.params.entry.url ?? ''}`,
    )
}

class Cdp {
  constructor(url) {
    this.url = url
    this.id = 0
    this.pending = new Map()
    this.events = []
  }

  static async connect(url) {
    const cdp = new Cdp(url)
    cdp.ws = new WebSocket(url)
    await new Promise((resolve, reject) => {
      cdp.ws.addEventListener('open', resolve, { once: true })
      cdp.ws.addEventListener('error', reject, { once: true })
    })
    cdp.ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data)
      if (message.id && cdp.pending.has(message.id)) {
        const { resolve, reject } = cdp.pending.get(message.id)
        cdp.pending.delete(message.id)
        if (message.error) reject(new Error(JSON.stringify(message.error)))
        else resolve(message.result)
      } else if (message.method) {
        cdp.events.push(message)
      }
    })
    return cdp
  }

  send(method, params = {}) {
    this.id += 1
    const id = this.id
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.ws.send(JSON.stringify({ id, method, params }))
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id)
          reject(new Error(`timeout: ${method}`))
        }
      }, 15000)
    })
  }

  async eval(expression) {
    const result = await this.send('Runtime.evaluate', {
      expression: `(async () => { ${expression} })()`,
      awaitPromise: true,
      returnByValue: true,
    })
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.exception?.description ?? 'eval failed')
    }
    return result.result.value
  }

  close() {
    this.ws.close()
  }
}

async function launchChrome(profileDir) {
  const child = spawn(
    CHROME,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--hide-scrollbars',
      '--window-size=1440,1000',
      `--user-data-dir=${profileDir}`,
      `--remote-debugging-port=${PORT}`,
      URL_APP,
    ],
    { stdio: 'ignore' },
  )

  for (let i = 0; i < 80; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`)
      const targets = await res.json()
      const page = targets.find(
        (t) => t.type === 'page' && t.url.includes(new URL(URL_APP).host),
      )
      if (page?.webSocketDebuggerUrl) return { child, target: page.webSocketDebuggerUrl }
    } catch {
      /* ещё не поднялся */
    }
    await sleep(250)
  }
  throw new Error('Chrome не запустился')
}

async function waitForLoad(cdp) {
  for (let i = 0; i < 40; i += 1) {
    const ready = await cdp.eval('return document.readyState')
    if (ready === 'complete') return
    await sleep(200)
  }
}

/** Ждём, пока React смонтирует нужный элемент. */
async function waitForSelector(cdp, selector, timeout = 8000) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    const found = await cdp.eval(
      `return Boolean(document.querySelector(${JSON.stringify(selector)}))`,
    )
    if (found) return true
    await sleep(150)
  }
  throw new Error(`не дождались элемента: ${selector}`)
}

async function main() {
  const profileDir = mkdtempSync(join(tmpdir(), 'habit-e2e-'))
  const { child, target } = await launchChrome(profileDir)
  const cdp = await Cdp.connect(target)

  try {
    await cdp.send('Runtime.enable')
    await cdp.send('Log.enable')
    await cdp.send('Page.enable')

    // ждём, пока в документе появится доступ к origin (localStorage)
    for (let i = 0; i < 60; i += 1) {
      const ready = await cdp.eval(
        'try { localStorage.getItem("x"); return location.origin } catch { return "" }',
      )
      if (ready) break
      await sleep(250)
    }

    await waitForLoad(cdp)
    await cdp.eval('localStorage.clear(); return true')
    await cdp.send('Page.reload', { ignoreCache: true })
    await waitForLoad(cdp)
    await waitForSelector(cdp, 'article')

    // ---- загрузка и данные ----
    check(
      'приложение смонтировано',
      await cdp.eval('return document.querySelectorAll("article").length === 3'),
      `карточек: ${await cdp.eval('return document.querySelectorAll("article").length')}`,
    )
    check(
      'нет ошибок в консоли',
      collectErrors(cdp).length === 0,
      JSON.stringify(collectErrors(cdp).slice(0, 3)),
    )
    check(
      'фон — тёплый градиент',
      await cdp.eval('return getComputedStyle(document.body).backgroundImage.includes("gradient")'),
    )
    check(
      'демо-привычки созданы и сохранены',
      await cdp.eval(
        'const h = JSON.parse(localStorage.getItem("habit-tracker:v1")).habits; return h.length === 3',
      ),
    )

    // ---- десктопный layout ----
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
    })
    await sleep(300)

    const columns = await cdp.eval(
      'return getComputedStyle(document.querySelector("main .grid")).gridTemplateColumns.split(" ").length',
    )
    check('на десктопе 3 колонки', columns === 3, `колонок: ${columns}`)
    check(
      'виджеты в правой колонке',
      await cdp.eval('return Boolean(document.querySelector("main aside"))'),
    )
    check(
      'кольцевой прогресс показывает 67%',
      await cdp.eval(
        'return document.querySelector(\'[data-testid="progress-ring"]\').textContent.includes("67%")',
      ),
    )
    check(
      'нет горизонтального скролла',
      await cdp.eval(
        'return document.documentElement.scrollWidth <= window.innerWidth + 1',
      ),
    )

    // ---- отметка выполнения ----
    const before = await cdp.eval(
      'return document.querySelector(\'[data-testid="progress-ring"]\').textContent',
    )
    await cdp.eval(`
      const cards = [...document.querySelectorAll('article')];
      const pending = cards.find((c) => c.textContent.includes('Ожидает'));
      pending.click();
      return true
    `)
    await waitForSelector(cdp, 'article.bg-emerald-50')
    const after = await cdp.eval(
      'return document.querySelector(\'[data-testid="progress-ring"]\').textContent',
    )
    check('клик по карточке меняет прогресс', before.includes('67%') && after.includes('100%'), `${before.trim()} -> ${after.trim()}`)
    check(
      'выполненная карточка перекрашивается в emerald',
      await cdp.eval(`
        const cards = [...document.querySelectorAll('article')];
        return cards.some((c) => c.className.includes('bg-emerald-50'));
      `),
    )

    // ---- персистентность в реальном браузере ----
    await cdp.send('Page.reload', { ignoreCache: false })
    await waitForLoad(cdp)
    await waitForSelector(cdp, '[data-testid="progress-ring"]')
    check(
      'отметка переживает перезагрузку',
      await cdp.eval(
        'return document.querySelector(\'[data-testid="progress-ring"]\').textContent.includes("100%")',
      ),
    )
    check(
      'демо-подсказка не возвращается',
      await cdp.eval('return !document.body.textContent.includes("демо-привычки")'),
    )

    // ---- модалка ----
    await cdp.eval(`
      const btn = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Добавить привычку');
      btn.click();
      return true
    `)
    await sleep(400)
    check(
      'модалка открывается',
      await cdp.eval('return Boolean(document.querySelector(\'[role="dialog"]\'))'),
    )
    check(
      'кнопка отправки заблокирована без названия',
      await cdp.eval('return document.querySelector(\'[role="dialog"] button[type="submit"]\').disabled'),
    )
    await cdp.eval(`
      const input = document.querySelector('[role="dialog"] input');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, 'Чтение книг');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return true
    `)
    await sleep(200)
    await cdp.eval('document.querySelector(\'[role="dialog"] button[type="submit"]\').click(); return true')
    await sleep(600)
    check(
      'новая привычка появляется в списке',
      await cdp.eval('return document.body.textContent.includes("Чтение книг")'),
    )
    check(
      'модалка закрылась после сохранения',
      await cdp.eval('return !document.querySelector(\'[role="dialog"]\')'),
    )
    check(
      'новая привычка сохранена в localStorage',
      await cdp.eval(
        'const h = JSON.parse(localStorage.getItem("habit-tracker:v1")).habits; return h.length === 4 && h[3].title === "Чтение книг"',
      ),
    )

    // ---- вкладка Stats ----
    await cdp.eval(`
      const tab = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Stats');
      tab.click();
      return true
    `)
    await sleep(500)
    check(
      'вкладка Stats открывается',
      await cdp.eval('return document.body.textContent.includes("Лучший streak")'),
    )
    check(
      'календарь отрисован (7 заголовков дней)',
      await cdp.eval(`
        const days = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
        return days.every((d) => document.body.textContent.includes(d));
      `),
    )
    check(
      'на Stats календарь на всю ширину',
      await cdp.eval(`
        const grid = document.querySelector('main .grid');
        return getComputedStyle(grid).gridTemplateColumns.split(' ').length === 3;
      `),
    )

    // ---- мобильная ширина ----
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 812,
      deviceScaleFactor: 2,
      mobile: true,
    })
    await cdp.eval(`
      const tab = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Today');
      tab.click();
      return true
    `)
    await sleep(500)
    const mobileColumns = await cdp.eval(
      'return getComputedStyle(document.querySelector("main .grid")).gridTemplateColumns.split(" ").length',
    )
    check('на мобильном 1 колонка', mobileColumns === 1, `колонок: ${mobileColumns}`)
    check(
      'на мобильном нет горизонтального скролла',
      await cdp.eval('return document.documentElement.scrollWidth <= window.innerWidth + 1'),
    )

    // ---- итог: ошибок не накопилось ----
    const errors = collectErrors(cdp)
    check('за весь прогон нет ошибок в консоли', errors.length === 0, errors.join(' | '))
  } finally {
    try {
      cdp.close()
    } catch {
      /* ignore */
    }
    child.kill()
    await sleep(500)
    for (let i = 0; i < 5; i += 1) {
      try {
        rmSync(profileDir, { recursive: true, force: true })
        break
      } catch {
        await sleep(400)
      }
    }
  }

  console.log(`\nПройдено: ${passed}, провалено: ${failures.length}`)
  if (failures.length > 0) {
    failures.forEach((f) => console.error(`  - ${f}`))
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('E2E не удался:', error)
  process.exit(1)
})
