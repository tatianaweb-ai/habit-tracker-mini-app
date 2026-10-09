import { useMemo, useState } from 'react'
import { Award, CalendarDays, ChevronLeft, ChevronRight, Flame, Target, TrendingUp } from 'lucide-react'
import { ACCENTS, getAccent } from '../lib/constants'
import { MONTHS, MONTHS_SHORT, WEEKDAYS, buildMonthGrid, fromKey, pluralizeDays } from '../lib/date'
import {
  activeDaysInMonth,
  bestStreak,
  bestStreakOverall,
  buildActivityMap,
  currentStreak,
  weeklyRate,
} from '../lib/stats'

function formatShortDate(key) {
  const date = fromKey(key)
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`
}

function Tile({ icon: Icon, iconClass, value, label }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-orange-50/70 p-4">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
        <Icon size={18} strokeWidth={2.4} />
      </span>
      <div className="min-w-0">
        <p className="text-xl font-bold leading-6 text-gray-900">{value}</p>
        <p className="truncate text-[12px] text-gray-600">{label}</p>
      </div>
    </div>
  )
}

export default function StatsView({ habits, today }) {
  const now = useMemo(() => {
    const date = new Date()
    return { year: date.getFullYear(), month: date.getMonth() }
  }, [])

  const [cursor, setCursor] = useState(now)

  const activity = useMemo(() => buildActivityMap(habits), [habits])
  const weeks = useMemo(() => buildMonthGrid(cursor.year, cursor.month), [cursor])

  const overallBest = useMemo(() => bestStreakOverall(habits), [habits])
  const weekPercent = useMemo(() => weeklyRate(habits, today), [habits, today])
  const activeDays = activeDaysInMonth(activity, cursor.year, cursor.month)

  function shiftMonth(delta) {
    setCursor((previous) => {
      const date = new Date(previous.year, previous.month + delta, 1)
      return { year: date.getFullYear(), month: date.getMonth() }
    })
  }

  const isCurrentMonth = cursor.year === now.year && cursor.month === now.month

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        <section className="animate-fade-slide-up flex flex-wrap items-center justify-between gap-5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 p-6 text-white shadow-xl shadow-orange-200/60">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-white/85">
              <Flame size={16} strokeWidth={2.4} />
              Лучший streak
            </p>
            <p className="mt-1 text-4xl font-bold leading-tight">
              {overallBest} {overallBest === 1 ? 'день' : 'дней'}
            </p>
            <p className="mt-1.5 text-sm text-white/85">
              {habits.length > 0
                ? `Привычек: ${habits.length} · активных дней в этом месяце: ${activeDays}`
                : 'Добавьте привычки, чтобы следить за статистикой'}
            </p>
          </div>

          <div className="rounded-2xl bg-white/15 px-5 py-4 backdrop-blur-sm">
            <p className="text-3xl font-bold">{weekPercent}%</p>
            <p className="text-[12px] font-medium text-white/85">выполнение за неделю</p>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="animate-fade-slide-up" style={{ animationDelay: '60ms' }}>
            <Tile
              icon={TrendingUp}
              iconClass="bg-emerald-100 text-emerald-600"
              value={`${weekPercent}%`}
              label="Неделя"
            />
          </div>
          <div className="animate-fade-slide-up" style={{ animationDelay: '120ms' }}>
            <Tile
              icon={Target}
              iconClass="bg-orange-100 text-orange-600"
              value={activeDays}
              label="Активных дней"
            />
          </div>
          <div className="animate-fade-slide-up" style={{ animationDelay: '180ms' }}>
            <Tile
              icon={CalendarDays}
              iconClass="bg-amber-100 text-amber-600"
              value={habits.length}
              label="Привычек всего"
            />
          </div>
        </div>
      </div>

      <section className="animate-fade-slide-up rounded-2xl bg-white p-6 shadow-lg shadow-orange-100">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            aria-label="Предыдущий месяц"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-orange-50 hover:text-orange-600"
          >
            <ChevronLeft size={19} strokeWidth={2.4} />
          </button>

          <p className="text-base font-bold text-gray-900">
            {MONTHS[cursor.month]} {cursor.year}
          </p>

          <button
            type="button"
            onClick={() => shiftMonth(1)}
            disabled={isCurrentMonth}
            aria-label="Следующий месяц"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-orange-50 hover:text-orange-600 disabled:text-gray-300 disabled:hover:bg-transparent"
          >
            <ChevronRight size={19} strokeWidth={2.4} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {WEEKDAYS.map((day) => (
            <span
              key={day}
              className="pb-1 text-center text-[11px] font-bold uppercase text-gray-500"
            >
              {day}
            </span>
          ))}

          {weeks.flat().map((cell) => {
            const marks = activity[cell.key]
            const future = cell.key > today
            const hasMarks = Boolean(marks) && !future

            return (
              <div
                key={cell.key}
                className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-xl text-sm transition-colors duration-200 ${
                  hasMarks ? 'bg-orange-50' : 'hover:bg-gray-50'
                } ${cell.isToday ? 'ring-2 ring-orange-400' : ''}`}
              >
                <span
                  className={`font-semibold ${
                    cell.isToday ? 'text-orange-600' : cell.inMonth ? 'text-gray-700' : 'text-gray-300'
                  }`}
                >
                  {cell.day}
                </span>
                <span className="flex h-1.5 items-center gap-0.5">
                  {hasMarks &&
                    marks.accents.slice(0, 3).map((color) => (
                      <span
                        key={color}
                        className={`h-1.5 w-1.5 rounded-full ${(ACCENTS[color] ?? ACCENTS.orange).swatch}`}
                      />
                    ))}
                </span>
              </div>
            )
          })}
        </div>

        <p className="mt-4 text-[12px] leading-4 text-gray-600">
          Точки — дни, когда выполнены привычки. Цвет точки соответствует акценту привычки.
        </p>
      </section>

      <section className="animate-fade-slide-up rounded-2xl bg-white p-6 shadow-lg shadow-orange-100 lg:col-span-3">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
          <Award size={19} className="text-orange-500" strokeWidth={2.4} />
          Привычки
        </h2>

        {habits.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-600">
            Пока нет привычек — создайте первую на вкладке Today.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {habits.map((habit) => {
              const accent = getAccent(habit)
              const current = currentStreak(habit, today)
              const best = bestStreak(habit)

              return (
                <div
                  key={habit.id}
                  data-testid="habit-stats-row"
                  className="flex items-center gap-3 rounded-xl bg-orange-50/50 p-4 transition-colors hover:bg-orange-50"
                >
                  <span className={`h-10 w-1.5 shrink-0 rounded-full ${accent.swatch}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-bold text-gray-900">{habit.title}</p>
                    <p className="truncate text-[12px] text-gray-600">
                      создана {habit.createdAt ? formatShortDate(habit.createdAt) : '—'}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="flex items-center justify-end gap-1 text-base font-bold text-amber-600">
                      <Flame size={14} strokeWidth={2.4} />
                      {current}
                    </p>
                    <p className="text-[11px] text-gray-600">
                      {best > 0 ? `рекорд ${pluralizeDays(best)}` : 'нет отметок'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
