import { addDays, diffDays, fromKey, SHORT_WEEKDAYS, startOfWeek, toKey, todayKey } from './date'

export function isDone(habit, key) {
  return Boolean(habit?.completions?.[key])
}

function doneKeys(habit) {
  return Object.keys(habit?.completions ?? {})
    .filter((key) => habit.completions[key])
    .sort()
}

/**
 * Текущий streak: считаем подряд идущие дни назад от сегодня.
 * Если сегодня привычка ещё не отмечена, streak не обнуляется —
 * день ведь не закончился.
 */
export function currentStreak(habit, today = todayKey()) {
  const keys = doneKeys(habit)
  if (keys.length === 0) return 0

  const done = new Set(keys)
  let cursor = fromKey(today)
  if (!done.has(toKey(cursor))) cursor = addDays(cursor, -1)

  let streak = 0
  while (done.has(toKey(cursor))) {
    streak += 1
    cursor = addDays(cursor, -1)
  }
  return streak
}

export function bestStreak(habit) {
  const keys = doneKeys(habit)
  let best = 0
  let run = 0
  let previous = null

  for (const key of keys) {
    run = previous && diffDays(fromKey(previous), fromKey(key)) === 1 ? run + 1 : 1
    best = Math.max(best, run)
    previous = key
  }
  return best
}

export function totalCompletions(habit) {
  return doneKeys(habit).length
}

/** Лучший streak среди всех привычек. */
export function bestStreakOverall(habits) {
  return habits.reduce((max, habit) => Math.max(max, bestStreak(habit)), 0)
}

/** Карта активности: { 'YYYY-MM-DD': { count, accents: string[] } } по всем привычкам. */
export function buildActivityMap(habits) {
  const map = {}

  for (const habit of habits) {
    for (const key of doneKeys(habit)) {
      if (!map[key]) map[key] = { count: 0, accents: [] }
      map[key].count += 1
      if (!map[key].accents.includes(habit.color)) map[key].accents.push(habit.color)
    }
  }

  return map
}

/** Процент выполнения за последние 7 дней (включая сегодня). */
export function weeklyRate(habits, today = todayKey()) {
  if (habits.length === 0) return 0

  const start = startOfWeek(fromKey(today))
  const sunday = addDays(start, 6)
  const todayDate = fromKey(today)
  // Считаем только прошедшую часть недели: будущие дни не должны портить процент.
  const lastDay = diffDays(todayDate, sunday) > 0 ? todayDate : sunday

  let planned = 0
  let done = 0

  for (const habit of habits) {
    const from = habit.createdAt && habit.createdAt > toKey(start) ? fromKey(habit.createdAt) : start
    if (diffDays(from, lastDay) < 0) continue

    for (let date = from; diffDays(date, lastDay) >= 0; date = addDays(date, 1)) {
      planned += 1
      if (isDone(habit, toKey(date))) done += 1
    }
  }

  if (planned === 0) return 0
  return Math.round((done / planned) * 100)
}

/** Сколько дней в текущем месяце отмечены хотя бы одной привычкой. */
export function activeDaysInMonth(activity, year, month) {
  return Object.keys(activity).filter((key) => {
    const date = fromKey(key)
    return date.getFullYear() === year && date.getMonth() === month
  }).length
}

/** Ряд из последних N дней для мини-графика в виджете недели. */
export function weeklySeries(habits, today = todayKey(), days = 7) {
  const end = fromKey(today)
  const total = habits.length

  return Array.from({ length: days }, (_, index) => {
    const date = addDays(end, index - days + 1)
    const key = toKey(date)
    const count = habits.filter((habit) => isDone(habit, key)).length

    return {
      key,
      label: SHORT_WEEKDAYS[date.getDay()],
      day: date.getDate(),
      count,
      rate: total > 0 ? count / total : 0,
      isToday: key === today,
    }
  })
}

/** Самая «длинная» привычка прямо сейчас — для виджета текущего streak. */
export function topStreakHabit(habits, today = todayKey()) {
  return habits.reduce(
    (best, habit) => {
      const streak = currentStreak(habit, today)
      return streak > best.streak ? { habit, streak } : best
    },
    { habit: null, streak: 0 },
  )
}
