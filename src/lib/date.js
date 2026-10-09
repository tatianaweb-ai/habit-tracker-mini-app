const MS_DAY = 24 * 60 * 60 * 1000

export function toKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function fromKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayKey() {
  return toKey(new Date())
}

export function addDays(date, count) {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  next.setDate(next.getDate() + count)
  return next
}

/** Целое число дней между двумя датами (b - a), устойчиво к переходу на летнее время. */
export function diffDays(a, b) {
  const from = new Date(a.getFullYear(), a.getMonth(), a.getDate())
  const to = new Date(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.round((to - from) / MS_DAY)
}

export function startOfWeek(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const weekday = (d.getDay() + 6) % 7
  return addDays(d, -weekday)
}

export function buildMonthGrid(year, month) {
  const first = new Date(year, month, 1)
  const gridStart = startOfWeek(first)
  const lastDay = new Date(year, month + 1, 0).getDate()
  const totalCells = Math.ceil((diffDays(gridStart, first) + lastDay) / 7) * 7

  const cells = []
  for (let i = 0; i < totalCells; i += 1) {
    const date = addDays(gridStart, i)
    cells.push({
      date,
      key: toKey(date),
      day: date.getDate(),
      inMonth: date.getMonth() === month,
      isToday: toKey(date) === todayKey(),
    })
  }

  const weeks = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

export const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

/** Короткие дни недели в порядке getDay(): 0 = воскресенье. */
export const SHORT_WEEKDAYS = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']

export const MONTHS_SHORT = [
  'янв',
  'фев',
  'мар',
  'апр',
  'май',
  'июн',
  'июл',
  'авг',
  'сен',
  'окт',
  'ноя',
  'дек',
]

export const MONTHS = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
]

export function formatLongDate(key) {
  const d = fromKey(key)
  const weekday = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'][d.getDay()]
  return `${d.getDate()} ${MONTHS[d.getMonth()].toLowerCase()}, ${weekday}`
}

export function greeting() {
  const hour = new Date().getHours()
  if (hour < 5) return 'Доброй ночи'
  if (hour < 12) return 'Доброе утро'
  if (hour < 18) return 'Добрый день'
  return 'Добрый вечер'
}

export function pluralizeDays(count) {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return `${count} день`
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} дня`
  return `${count} дней`
}
