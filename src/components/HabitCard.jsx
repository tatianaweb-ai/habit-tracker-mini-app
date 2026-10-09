import { useEffect, useState } from 'react'
import { Check, Flame, Trash2 } from 'lucide-react'
import { getAccent, getCategory } from '../lib/constants'
import { currentStreak } from '../lib/stats'
import { pluralizeDays } from '../lib/date'

export default function HabitCard({ habit, done, streak, onToggle, onDelete, index = 0 }) {
  const [confirming, setConfirming] = useState(false)
  const accent = getAccent(habit)
  const { label, Icon, tint } = getCategory(habit)

  useEffect(() => {
    if (!confirming) return
    const timer = window.setTimeout(() => setConfirming(false), 3000)
    return () => window.clearTimeout(timer)
  }, [confirming])

  return (
    <article
      style={{ animationDelay: `${Math.min(index, 6) * 70}ms` }}
      role="button"
      tabIndex={0}
      aria-pressed={done}
      onClick={onToggle}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onToggle()
        }
      }}
      className={`animate-fade-slide-up group relative cursor-pointer overflow-hidden rounded-2xl border border-transparent p-5 pl-7 shadow-lg shadow-orange-100 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-200/70 ${
        done ? 'bg-emerald-50' : 'bg-white'
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 w-1.5 transition-opacity duration-300 ${accent.swatch} ${
          done ? 'opacity-30' : 'opacity-100'
        }`}
      />

      <div className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 transition-all duration-200 ${
            done
              ? 'animate-pop border-emerald-500 bg-emerald-500 text-white'
              : 'border-gray-300 bg-white text-transparent group-hover:border-orange-400 group-hover:bg-orange-50'
          }`}
        >
          <Check size={22} strokeWidth={3.2} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <h3
                className={`truncate text-lg font-bold transition-colors duration-300 ${
                  done ? 'text-gray-400 line-through' : 'text-gray-900'
                }`}
              >
                {habit.title}
              </h3>
              {habit.goal && <p className="mt-0.5 truncate text-sm text-gray-600">{habit.goal}</p>}
            </div>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                if (confirming) {
                  setConfirming(false)
                  onDelete()
                } else {
                  setConfirming(true)
                }
              }}
              title={confirming ? 'Нажмите ещё раз для удаления' : 'Удалить привычку'}
              aria-label={
                confirming
                  ? `Подтвердите удаление привычки «${habit.title}»`
                  : `Удалить привычку «${habit.title}»`
              }
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
                confirming
                  ? 'animate-pop bg-red-500 text-white'
                  : 'text-gray-300 hover:bg-red-50 hover:text-red-500'
              }`}
            >
              {confirming ? <Check size={15} strokeWidth={3} /> : <Trash2 size={16} strokeWidth={2} />}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-orange-50 px-2.5 py-1 text-xs font-semibold text-gray-700">
              <Icon size={13} className={tint} strokeWidth={2.5} />
              {label}
            </span>

            <span
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-colors duration-200 ${
                streak > 0 ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-400'
              }`}
            >
              <Flame size={13} strokeWidth={2.5} className={streak > 0 ? 'animate-flame' : ''} />
              {streak > 0 ? pluralizeDays(streak) : 'нет серии'}
            </span>

            <span
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                done ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${done ? 'bg-emerald-500' : 'bg-gray-300'}`} />
              {done ? 'Выполнено' : 'Ожидает'}
            </span>
          </div>
        </div>
      </div>
    </article>
  )
}
