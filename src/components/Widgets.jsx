import { Award, CalendarDays, Flame, Target, TrendingUp } from 'lucide-react'
import ProgressBar, { LinearProgress } from './ProgressBar'
import { getAccent } from '../lib/constants'
import { pluralizeDays } from '../lib/date'
import { bestStreakOverall, topStreakHabit, weeklyRate, weeklySeries } from '../lib/stats'

function Card({ children, className = '', style }) {
  return (
    <section
      style={style}
      className={`animate-fade-slide-up rounded-2xl bg-white p-5 shadow-lg shadow-orange-100 ${className}`}
    >
      {children}
    </section>
  )
}

function Tile({ icon: Icon, iconClass, value, label }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-orange-50/70 p-3">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
        <Icon size={17} strokeWidth={2.4} />
      </span>
      <div className="min-w-0">
        <p className="text-lg font-bold leading-5 text-gray-900">{value}</p>
        <p className="truncate text-[11px] text-gray-600">{label}</p>
      </div>
    </div>
  )
}

export default function Widgets({ habits, today, doneCount }) {
  const { habit: topHabit, streak: topStreak } = topStreakHabit(habits, today)
  const overallBest = bestStreakOverall(habits)
  const weekPercent = weeklyRate(habits, today)
  const series = weeklySeries(habits, today)
  const total = habits.length

  return (
    <aside className="flex flex-col gap-5">
      <Card className="animate-fade-in">
        <ProgressBar done={doneCount} total={total} size="lg" caption="привычек выполнено сегодня" />
        <LinearProgress done={doneCount} total={total} className="mt-5" />
      </Card>

      <Card style={{ animationDelay: '80ms' }}>
        <div className="flex items-center gap-4">
          <span className="animate-flame flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-200">
            <Flame size={26} strokeWidth={2.2} />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-gray-600">Текущий streak</p>
            <p className="text-3xl font-bold leading-8 text-gray-900">
              {topStreak > 0 ? (
                <>
                  {topStreak} <span className="text-lg">{topStreak === 1 ? 'день' : 'дней'}</span>
                </>
              ) : (
                0
              )}
            </p>
            <p className="truncate text-[12px] text-gray-600">
              {topStreak > 0 && topHabit ? `🔥 ${topHabit.title}` : 'Отметьте привычку сегодня'}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Tile
            icon={Award}
            iconClass="bg-orange-100 text-orange-600"
            value={overallBest}
            label="Лучший streak, дней"
          />
          <Tile
            icon={TrendingUp}
            iconClass="bg-emerald-100 text-emerald-600"
            value={`${weekPercent}%`}
            label="Выполнение за неделю"
          />
        </div>
      </Card>

      <Card style={{ animationDelay: '160ms' }}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">Неделя</h2>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-600">
            <CalendarDays size={12} strokeWidth={2.4} />
            {pluralizeDays(total ? 7 : 0)}
          </span>
        </div>

        <div className="flex h-24 items-end gap-1.5">
          {series.map((day) => (
            <div key={day.key} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className={`w-full rounded-t-lg transition-all duration-500 ease-out ${
                  day.rate === 0
                    ? 'bg-gray-200'
                    : 'bg-gradient-to-t from-orange-500 to-amber-400'
                } ${day.isToday ? 'ring-2 ring-orange-300 ring-offset-1' : ''}`}
                style={{ height: `${Math.max(day.rate * 100, 6)}%` }}
                title={`${day.key}: ${day.count} из ${total}`}
              />
            </div>
          ))}
        </div>

        <div className="mt-1.5 flex gap-1.5">
          {series.map((day) => (
            <span
              key={day.key}
              className={`flex-1 text-center text-[10px] ${
                day.isToday ? 'font-bold text-orange-600' : 'text-gray-500'
              }`}
            >
              {day.label}
            </span>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2 border-t border-orange-100 pt-3 text-[12px] text-gray-600">
          <Target size={14} className="text-orange-500" strokeWidth={2.4} />
          Сегодня: {doneCount} из {total} выполнено
        </div>
      </Card>
    </aside>
  )
}
