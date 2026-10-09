import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../src/App'
import { STORAGE_KEY } from '../src/lib/storage'
import { MONTHS, addDays, toKey, todayKey } from '../src/lib/date'

const daysAgo = (n) => toKey(addDays(new Date(), -n))

const makeHabit = (overrides = {}) => ({
  id: 'h1',
  title: 'Пить воду',
  goal: '8 стаканов',
  category: 'health',
  color: 'orange',
  createdAt: daysAgo(10),
  completions: {},
  ...overrides,
})

function seed(habits) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ habits, version: 1 }))
}

const readHabits = () => JSON.parse(window.localStorage.getItem(STORAGE_KEY)).habits

const cardFor = (title) => screen.getByText(title).closest('article')
const progressText = () => within(screen.getByTestId('progress-ring')).getByText(/^\d+%$/).textContent
const addButton = () => screen.getAllByRole('button', { name: /^Добавить привычку$/ })[0]

async function openAddModal(user) {
  await user.click(addButton())
  return screen.findByRole('dialog')
}

const fillTitle = (user, text) =>
  user.type(within(screen.getByRole('dialog')).getByPlaceholderText('Например, пробежка'), text)

const submitModal = (user) =>
  user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /Добавить привычку/ }))

describe('Today — рендер', () => {
  beforeEach(() => {
    seed([makeHabit()])
  })

  it('показывает заголовок, приветствие и список привычек', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Трекер привычек' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Сегодня' })).toBeInTheDocument()
    expect(screen.getByText('Пить воду')).toBeInTheDocument()
    expect(screen.getByText('8 стаканов')).toBeInTheDocument()
    expect(screen.getByText('Здоровье')).toBeInTheDocument()
  })

  it('при пустом хранилище показывает 3 демо-привычки и подсказку', () => {
    window.localStorage.clear()
    render(<App />)
    expect(screen.getByText('Пить воду')).toBeInTheDocument()
    expect(screen.getByText('Английский язык')).toBeInTheDocument()
    expect(screen.getByText('Итоги дня')).toBeInTheDocument()
    expect(screen.getByText(/демо-привычки/i)).toBeInTheDocument()
    expect(progressText()).toBe('67%')
  })

  it('подсказку можно скрыть', async () => {
    const user = userEvent.setup()
    window.localStorage.clear()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Скрыть подсказку' }))
    expect(screen.queryByText(/демо-привычки/i)).not.toBeInTheDocument()
  })

  it('показывает пустое состояние без привычек', () => {
    seed([])
    render(<App />)
    expect(screen.getByText('Пока нет привычек')).toBeInTheDocument()
    expect(progressText()).toBe('0%')
    expect(screen.getByText('Добавьте первую привычку, чтобы начать')).toBeInTheDocument()
  })

  it('показывает 100% и отметку «День закрыт», когда всё выполнено', () => {
    seed([makeHabit({ completions: { [todayKey()]: true } })])
    render(<App />)
    expect(progressText()).toBe('100%')
    expect(screen.getByText('День закрыт')).toBeInTheDocument()
  })
})

describe('Today — отметка выполнения', () => {
  beforeEach(() => {
    seed([
      makeHabit({ id: 'h1', title: 'Пить воду' }),
      makeHabit({ id: 'h2', title: 'Бег', completions: { [todayKey()]: true } }),
    ])
  })

  it('обновляет прогресс при клике по карточке', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(progressText()).toBe('50%')

    await user.click(cardFor('Пить воду'))

    expect(progressText()).toBe('100%')
    expect(within(cardFor('Пить воду')).getByText('Выполнено')).toBeInTheDocument()
    expect(readHabits()[0].completions[todayKey()]).toBe(true)
  })

  it('повторный клик снимает отметку', async () => {
    const user = userEvent.setup()
    render(<App />)
    const card = cardFor('Пить воду')

    await user.click(card)
    expect(progressText()).toBe('100%')

    await user.click(card)
    expect(progressText()).toBe('50%')
    expect(readHabits()[0].completions[todayKey()]).toBeUndefined()
  })

  it('переключает отметку с клавиатуры', async () => {
    const user = userEvent.setup()
    render(<App />)
    const card = cardFor('Пить воду')

    card.focus()
    await user.keyboard('{Enter}')
    expect(readHabits()[0].completions[todayKey()]).toBe(true)

    await user.keyboard(' ')
    expect(readHabits()[0].completions[todayKey()]).toBeUndefined()
  })

  it('пересчитывает streak после отметки', async () => {
    const user = userEvent.setup()
    seed([makeHabit({ completions: { [daysAgo(1)]: true, [daysAgo(2)]: true } })])
    render(<App />)

    expect(within(cardFor('Пить воду')).getByText('2 дня')).toBeInTheDocument()
    await user.click(cardFor('Пить воду'))
    expect(within(cardFor('Пить воду')).getByText('3 дня')).toBeInTheDocument()
  })

  it('снимает отметку у выполненной карточки', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(within(cardFor('Бег')).getByText('Выполнено')).toBeInTheDocument()
    await user.click(cardFor('Бег'))
    expect(within(cardFor('Бег')).queryByText('Выполнено')).not.toBeInTheDocument()
  })
})

describe('Today — добавление привычки', () => {
  beforeEach(() => {
    seed([makeHabit()])
  })

  it('открывает и закрывает модалку', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await openAddModal(user)
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Закрыть' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('закрывается по Escape и по клику на фон', async () => {
    const user = userEvent.setup()
    render(<App />)

    await openAddModal(user)
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    await openAddModal(user)
    await user.click(document.querySelector('.fixed.inset-0 > div'))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('блокирует кнопку, пока не введено название', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openAddModal(user)
    const dialog = screen.getByRole('dialog')

    expect(within(dialog).getByRole('button', { name: /Добавить привычку/ })).toBeDisabled()

    await fillTitle(user, 'Б')
    expect(within(dialog).getByRole('button', { name: /Добавить привычку/ })).toBeEnabled()
  })

  it('создаёт привычку со всеми полями', async () => {
    const user = userEvent.setup()
    render(<App />)
    const dialog = await openAddModal(user)

    await fillTitle(user, 'Йога')
    await user.type(
      within(dialog).getByPlaceholderText('5 км по парку'),
      '20 минут',
    )
    await user.selectOptions(within(dialog).getByRole('combobox'), 'study')
    await user.click(within(dialog).getByRole('button', { name: 'Янтарный' }))
    await submitModal(user)

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    const card = cardFor('Йога')
    expect(within(card).getByText('20 минут')).toBeInTheDocument()
    expect(within(card).getByText('Обучение')).toBeInTheDocument()

    const saved = readHabits().at(-1)
    expect(saved).toMatchObject({
      title: 'Йога',
      goal: '20 минут',
      category: 'study',
      color: 'amber',
      createdAt: todayKey(),
    })
    expect(saved.completions).toEqual({})
    expect(within(card).getByText('Ожидает')).toBeInTheDocument()
    expect(progressText()).toBe('0%')
  })

  it('обрезает пробелы и принимает привычку без цели', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openAddModal(user)

    await fillTitle(user, '  Медитация  ')
    await submitModal(user)

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    const saved = readHabits().at(-1)
    expect(saved.title).toBe('Медитация')
    expect(saved.goal).toBe('')
    expect(within(cardFor('Медитация')).queryByText('8 стаканов')).not.toBeInTheDocument()
  })

  it('можно добавить привычку из пустого состояния', async () => {
    seed([])
    const user = userEvent.setup()
    render(<App />)

    await openAddModal(user)
    await fillTitle(user, 'Чтение')
    await submitModal(user)

    await waitFor(() => expect(screen.getByText('Чтение')).toBeInTheDocument())
  })

  it('закрывает модалку по «Отмена» без сохранения', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openAddModal(user)
    await fillTitle(user, 'Не сохранится')
    await user.click(screen.getByRole('button', { name: 'Отмена' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(readHabits()).toHaveLength(1)
  })
})

describe('Today — удаление', () => {
  beforeEach(() => {
    seed([makeHabit()])
  })

  it('требует подтверждения вторым нажатием', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Удалить привычку/ }))
    expect(readHabits()).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: /Подтвердите удаление/ }))
    await waitFor(() => expect(screen.queryByText('Пить воду')).not.toBeInTheDocument())
    expect(readHabits()).toHaveLength(0)
  })

  it('не удаляет при клике на саму карточку', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(cardFor('Пить воду'))
    expect(screen.getByText('Пить воду')).toBeInTheDocument()
  })
})

describe('Stats — вкладка', () => {
  beforeEach(() => {
    seed([
      makeHabit({
        id: 'h1',
        completions: {
          [todayKey()]: true,
          [daysAgo(1)]: true,
          [daysAgo(2)]: true,
          [daysAgo(3)]: true,
        },
      }),
      makeHabit({ id: 'h2', title: 'Бег', category: 'work', color: 'red' }),
    ])
  })

  it('переключается на Stats и обратно', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Stats' }))
    expect(screen.getByText('Лучший streak')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Привычки' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Сегодня' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Stats' })).toHaveAttribute('aria-current', 'page')

    await user.click(screen.getByRole('button', { name: 'Today' }))
    expect(screen.getByRole('heading', { name: 'Сегодня' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Today' })).toHaveAttribute('aria-current', 'page')
  })

  it('показывает текущий месяц и календарную сетку', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Stats' }))

    const now = new Date()
    expect(
      screen.getByText(`${MONTHS[now.getMonth()]} ${now.getFullYear()}`, { exact: true }),
    ).toBeInTheDocument()

    for (const day of ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']) {
      expect(screen.getByText(day)).toBeInTheDocument()
    }
    expect(screen.getByText(String(now.getDate()))).toBeInTheDocument()
  })

  it('листает месяцы назад, но не вперёд за текущий', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Stats' }))

    expect(screen.getByRole('button', { name: 'Следующий месяц' })).toBeDisabled()

    const now = new Date()
    const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    await user.click(screen.getByRole('button', { name: 'Предыдущий месяц' }))

    expect(
      screen.getByText(`${MONTHS[previous.getMonth()]} ${previous.getFullYear()}`, { exact: true }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Следующий месяц' })).toBeEnabled()

    await user.click(screen.getByRole('button', { name: 'Следующий месяц' }))
    expect(
      screen.getByText(`${MONTHS[now.getMonth()]} ${now.getFullYear()}`, { exact: true }),
    ).toBeInTheDocument()
  })

  it('показывает streak и рекорд по каждой привычке', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Stats' }))

    const rows = screen.getAllByTestId('habit-stats-row')
    const water = rows.find((row) => within(row).queryByText('Пить воду'))
    const run = rows.find((row) => within(row).queryByText('Бег'))

    expect(within(water).getByText('4')).toBeInTheDocument()
    expect(within(water).getByText('рекорд 4 дня')).toBeInTheDocument()
    expect(within(run).getByText('0')).toBeInTheDocument()
    expect(within(run).getByText('нет отметок')).toBeInTheDocument()
  })
})

describe('Виджеты', () => {
  it('показывает прогресс, streak, лучший streak и неделю', () => {
    seed([
      makeHabit({
        completions: { [todayKey()]: true, [daysAgo(1)]: true, [daysAgo(2)]: true },
      }),
    ])
    render(<App />)

    expect(progressText()).toBe('100%')
    expect(screen.getByText('Текущий streak')).toBeInTheDocument()
    expect(screen.getByText('Неделя')).toBeInTheDocument()

    const bestTile = screen.getByText('Лучший streak, дней').parentElement
    expect(bestTile).toHaveTextContent('3')

    const streak = screen.getByText('Текущий streak').parentElement
    expect(streak).toHaveTextContent('3')
    expect(streak).toHaveTextContent('Пить воду')
  })

  it('не падает без привычек', () => {
    seed([])
    render(<App />)
    expect(screen.getByText('Текущий streak')).toBeInTheDocument()
    expect(screen.getByText('Отметьте привычку сегодня')).toBeInTheDocument()
  })
})

describe('Сохранение между перезагрузками', () => {
  beforeEach(() => {
    seed([makeHabit()])
  })

  it('восстанавливает привычки, отметки и порядок', async () => {
    const user = userEvent.setup()
    const first = render(<App />)
    expect(screen.getByText('Пить воду')).toBeInTheDocument()

    await user.click(cardFor('Пить воду'))
    await openAddModal(user)
    await fillTitle(user, 'Йога')
    await submitModal(user)
    await waitFor(() => expect(screen.getByText('Йога')).toBeInTheDocument())

    first.unmount()

    render(<App />)
    expect(screen.getByText('Пить воду')).toBeInTheDocument()
    expect(screen.getByText('Йога')).toBeInTheDocument()
    expect(within(cardFor('Пить воду')).getByText('Выполнено')).toBeInTheDocument()
    expect(progressText()).toBe('50%')
    expect(screen.queryByText(/демо-привычки/i)).not.toBeInTheDocument()
  })
})
