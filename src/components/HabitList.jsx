import { ListTodo, Plus } from 'lucide-react'
import HabitCard from './HabitCard'
import { currentStreak, isDone } from '../lib/stats'

export default function HabitList({ habits, today, onToggle, onDelete, onAdd }) {
  if (habits.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-orange-200 bg-white/70 px-6 py-14 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
          <ListTodo size={24} strokeWidth={2} />
        </span>
        <div>
          <p className="text-lg font-bold text-gray-900">Пока нет привычек</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-gray-600">
            Добавьте первую привычку — и начните отмечать дни, следить за прогрессом и streak.
          </p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200 transition-all duration-200 hover:shadow-2xl hover:shadow-orange-300 active:scale-95"
        >
          <Plus size={18} strokeWidth={2.6} />
          Добавить привычку
        </button>
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-4">
      {habits.map((habit, index) => (
        <li key={habit.id}>
          <HabitCard
            habit={habit}
            index={index}
            done={isDone(habit, today)}
            streak={currentStreak(habit, today)}
            onToggle={() => onToggle(habit.id)}
            onDelete={() => onDelete(habit.id)}
          />
        </li>
      ))}

      <li>
        <button
          type="button"
          onClick={onAdd}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50/40 py-4 text-sm font-semibold text-orange-600 transition-all duration-200 hover:border-orange-300 hover:bg-orange-50 active:scale-[0.99]"
        >
          <Plus size={18} strokeWidth={2.6} />
          Добавить ещё одну привычку
        </button>
      </li>
    </ul>
  )
}
