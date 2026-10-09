import { describe, expect, it } from 'vitest'
import {
  addDays,
  buildMonthGrid,
  diffDays,
  fromKey,
  greeting,
  MONTHS,
  pluralizeDays,
  startOfWeek,
  toKey,
  todayKey,
  WEEKDAYS,
} from '../src/lib/date'
import {
  activeDaysInMonth,
  bestStreak,
  bestStreakOverall,
  buildActivityMap,
  currentStreak,
  isDone,
  topStreakHabit,
  weeklyRate,
  weeklySeries,
} from '../src/lib/stats'

const today = todayKey()
const daysAgo = (n) => toKey(addDays(new Date(), -n))

const habit = (offsets, extra = {}) => ({
  id: 'h',
  title: 't',
  goal: '',
  category: 'health',
  color: 'orange',
  createdAt: daysAgo(30),
  completions: Object.fromEntries(offsets.map((o) => [daysAgo(o), true])),
  ...extra,
})

describe('streak', () => {
  it('считает непрерывную серию', () => {
    expect(currentStreak(habit([0, 1, 2, 3]))).toBe(4)
  })

  it('не обнуляет серию, пока сегодня не отмечено', () => {
    expect(currentStreak(habit([1, 2, 3]))).toBe(3)
  })

  it('обнуляется при пропуске вчерашнего дня', () => {
    expect(currentStreak(habit([2, 3, 5, 6]))).toBe(0)
  })

  it('равен нулю без отметок', () => {
    expect(currentStreak(habit([]))).toBe(0)
  })

  it('считает одну отметку за серию в 1 день', () => {
    expect(currentStreak(habit([0]))).toBe(1)
  })

  it('учитывает только последние подряд идущие дни', () => {
    expect(currentStreak(habit([0, 1, 4, 5, 6]))).toBe(2)
  })

  it('находит привычку с максимальным текущим streak', () => {
    const list = [habit([0], { id: 'a' }), habit([0, 1, 2, 3], { id: 'b' })]
    expect(topStreakHabit(list).habit.id).toBe('b')
    expect(topStreakHabit(list).streak).toBe(4)
  })

  it('возвращает нулевой streak для пустого списка', () => {
    expect(topStreakHabit([])).toEqual({ habit: null, streak: 0 })
  })
})

describe('best streak', () => {
  it('находит самую длинную серию', () => {
    expect(bestStreak(habit([0, 1, 2, 3, 6, 7, 8]))).toBe(4)
  })

  it('считает серию без пропусков целиком', () => {
    expect(bestStreak(habit([10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]))).toBe(11)
  })

  it('не считает серией дни через день', () => {
    expect(bestStreak(habit([0, 2, 4]))).toBe(1)
  })

  it('берёт максимум по всем привычкам', () => {
    expect(bestStreakOverall([habit([0, 1]), habit([0, 1, 2, 3, 4])])).toBe(5)
  })

  it('равен нулю без привычек', () => {
    expect(bestStreakOverall([])).toBe(0)
  })
})

describe('isDone', () => {
  it('видит отметку за сегодня', () => {
    expect(isDone(habit([0]), today)).toBe(true)
  })

  it('не видит отметку за другой день', () => {
    expect(isDone(habit([1]), today)).toBe(false)
  })

  it('безопасно работает с пустыми данными', () => {
    expect(isDone(null, today)).toBe(false)
    expect(isDone({ completions: null }, today)).toBe(false)
  })
})

describe('процент за неделю', () => {
  const elapsed = diffDays(startOfWeek(fromKey(today)), fromKey(today)) + 1
  const allElapsed = Array.from({ length: elapsed }, (_, i) => i)

  it('равен 100%, если отмечены все прошедшие дни', () => {
    expect(weeklyRate([habit(allElapsed)], today)).toBe(100)
  })

  it('считает долю отмеченных дней', () => {
    expect(weeklyRate([habit([0, 1, 2])], today)).toBe(Math.round((3 / elapsed) * 100))
  })

  it('равен нулю без привычек', () => {
    expect(weeklyRate([], today)).toBe(0)
  })

  it('учитывает только дни начиная с даты создания', () => {
    expect(weeklyRate([habit([0], { createdAt: today })], today)).toBe(100)
    expect(weeklyRate([habit([], { createdAt: today })], today)).toBe(0)
  })

  it('подставляет сегодняшнюю дату по умолчанию', () => {
    expect(weeklyRate([habit([0], { createdAt: today })])).toBe(100)
  })
})

describe('карта активности', () => {
  it('считает число выполнений и цвета по дням', () => {
    const activity = buildActivityMap([habit([0, 1]), habit([0], { color: 'amber' })])
    expect(activity[daysAgo(0)].count).toBe(2)
    expect(activity[daysAgo(0)].accents).toEqual(['orange', 'amber'])
    expect(activity[daysAgo(1)].count).toBe(1)
  })

  it('считает активные дни месяца', () => {
    const activity = buildActivityMap([habit([0, 40])])
    const now = new Date()
    expect(activeDaysInMonth(activity, now.getFullYear(), now.getMonth())).toBe(1)
  })
})

describe('график недели', () => {
  it('возвращает 7 дней с процентом и меткой сегодня', () => {
    const series = weeklySeries([habit([0, 1, 2])], today)
    expect(series).toHaveLength(7)
    expect(series[6].isToday).toBe(true)
    expect(series[6].rate).toBe(1)
    expect(series[0].rate).toBe(0)
    expect(series.map((d) => d.label)).toHaveLength(7)
  })
})

describe('календарь', () => {
  const grid = buildMonthGrid(2026, 1)

  it('строит только полные недели', () => {
    expect(grid.flat().length % 7).toBe(0)
  })

  it('начинает неделю с понедельника', () => {
    expect(grid[0][0].date.getDay()).toBe(1)
  })

  it('содержит все дни месяца', () => {
    expect(grid.flat().filter((c) => c.inMonth).length).toBe(28)
  })

  it('помечает сегодняшний день ровно один раз', () => {
    const gridAll = buildMonthGrid(new Date().getFullYear(), new Date().getMonth())
    expect(gridAll.flat().filter((c) => c.isToday)).toHaveLength(1)
  })

  it('покрывает месяцы с 28 и 31 днём', () => {
    expect(buildMonthGrid(2026, 1).flat().filter((c) => c.inMonth).length).toBe(28)
    expect(buildMonthGrid(2026, 0).flat().filter((c) => c.inMonth).length).toBe(31)
  })
})

describe('утилиты дат', () => {
  it('считает разницу в днях', () => {
    expect(diffDays(fromKey(daysAgo(3)), fromKey(daysAgo(0)))).toBe(3)
  })

  it('не считает выходные дни днями недели', () => {
    expect(diffDays(fromKey('2026-03-28'), fromKey('2026-03-30'))).toBe(2)
  })

  it('склоняет дни', () => {
    expect(pluralizeDays(1)).toBe('1 день')
    expect(pluralizeDays(3)).toBe('3 дня')
    expect(pluralizeDays(5)).toBe('5 дней')
    expect(pluralizeDays(11)).toBe('11 дней')
    expect(pluralizeDays(21)).toBe('21 день')
  })

  it('возвращает приветствие по времени суток', () => {
    expect(greeting()).toMatch(/^Добр/)
  })

  it('экспортирует 7 заголовков дней и 12 месяцев', () => {
    expect(WEEKDAYS).toHaveLength(7)
    expect(MONTHS).toHaveLength(12)
  })

  it('корректно формирует ключ даты', () => {
    expect(toKey(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(toKey(fromKey('2026-12-31'))).toBe('2026-12-31')
  })
})
