import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import App from '../src/App.jsx'

/**
 * Дымовой рендер: ловит ошибки времени выполнения в компонентах без браузера.
 * Vite собирает этот файл в .check/ssr.js, дальше его запускает node.
 */
const html = renderToStaticMarkup(createElement(App))

const checks = [
  ['заголовок', 'Трекер привычек'],
  ['кнопка добавления', 'Добавить привычку'],
  ['демо-привычка', 'Пить воду'],
  ['вкладка Stats', 'Stats'],
  ['виджет прогресса', 'Выполнено'],
  ['виджет streak', 'Текущий streak'],
  ['лучший streak', 'Лучший streak, дней'],
  ['недельный график', 'Неделя'],
]

const missing = checks.filter(([, needle]) => !html.includes(needle)).map(([name]) => name)

if (missing.length > 0) {
  console.error(`SSR check failed, не найдено: ${missing.join(', ')}`)
  process.exit(1)
}

console.log('SSR OK, длина HTML:', html.length)
