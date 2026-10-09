import { useCallback, useEffect, useMemo, useState } from 'react'
import { BarChart3, ListChecks, Plus, Sparkles, Target, X } from 'lucide-react'
import AddHabitModal from './components/AddHabitModal'
import HabitList from './components/HabitList'
import StatsView from './components/StatsView'
import Widgets from './components/Widgets'
import { useHabits } from './hooks/useHabits'
import { formatLongDate, greeting } from './lib/date'
import { haptic, initTelegram, notify } from './lib/telegram'
import { isDone } from './lib/stats'

const TABS = [
  { id: 'today', label: 'Today', Icon: ListChecks },
  { id: 'stats', label: 'Stats', Icon: BarChart3 },
]

export default function App() {
  const [tab, setTab] = useState('today')
  const [modalOpen, setModalOpen] = useState(false)
  const [hintVisible, setHintVisible] = useState(true)
  const { habits, today, isFirstRun, addHabit, removeHabit, toggleHabit } = useHabits()

  useEffect(() => {
    initTelegram()
  }, [])

  const doneCount = useMemo(
    () => habits.filter((habit) => isDone(habit, today)).length,
    [habits, today],
  )

  const openModal = useCallback(() => {
    haptic('light')
    setModalOpen(true)
  }, [])

  const handleToggle = useCallback(
    (id) => {
      const habit = habits.find((item) => item.id === id)
      toggleHabit(id)

      if (habit && !isDone(habit, today)) {
        haptic('light')
        const rest = habits.filter((item) => item.id !== id && !isDone(item, today))
        if (rest.length === 0) notify('success')
      }
    },
    [habits, today, toggleHabit],
  )

  const handleDelete = useCallback(
    (id) => {
      removeHabit(id)
      notify('warning')
    },
    [removeHabit],
  )

  const handleAdd = useCallback(
    (draft) => {
      addHabit(draft)
      notify('success')
    },
    [addHabit],
  )

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        {/* ---------- Шапка ---------- */}
        <header className="animate-fade-slide-up flex flex-wrap items-center justify-between gap-4 py-8">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-200">
              <Target size={24} strokeWidth={2.4} />
            </span>
            <div>
              <p className="text-sm font-medium text-gray-600">{greeting()}</p>
              <h1 className="text-3xl font-bold text-gray-900">Трекер привычек</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold capitalize text-gray-600 shadow-sm">
              {formatLongDate(today)}
            </div>
          </div>
        </header>

        {/* ---------- Табы ---------- */}
        <nav className="animate-fade-slide-up mb-6 flex w-fit gap-1 rounded-2xl bg-white p-1.5 shadow-lg shadow-orange-100">
          {TABS.map(({ id, label, Icon }) => {
            const active = tab === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  haptic('light')
                  setTab(id)
                }}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all duration-200 ${
                  active
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-300/60'
                    : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'
                }`}
              >
                <Icon size={17} strokeWidth={2.4} />
                {label}
              </button>
            )
          })}
        </nav>

        {isFirstRun && hintVisible && (
          <div className="animate-fade-slide-up relative mb-6 flex items-start gap-3 rounded-2xl border border-orange-100 bg-white/70 px-5 py-4 pr-12 text-sm text-gray-600 shadow-sm">
            <Sparkles size={17} className="mt-0.5 shrink-0 text-orange-500" strokeWidth={2.4} />
            <p>
              Это демо-привычки — они хранятся только в вашем браузере. Нажмите на карточку, чтобы
              отметить выполнение, и добавьте свои привычки.
            </p>
            <button
              type="button"
              onClick={() => setHintVisible(false)}
              aria-label="Скрыть подсказку"
              className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-orange-600 transition-colors hover:bg-orange-200"
            >
              <X size={13} strokeWidth={3} />
            </button>
          </div>
        )}

        {/* ---------- Контент ---------- */}
        <main className="animate-fade-in">
          {tab === 'today' ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <section className="lg:col-span-2">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Сегодня</h2>
                    <p className="mt-0.5 text-sm text-gray-600">
                      Выполнено {doneCount} из {habits.length} — нажмите на карточку, чтобы отметить
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={openModal}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-200 transition-all duration-200 hover:shadow-2xl hover:shadow-orange-300 active:scale-95"
                  >
                    <Plus size={18} strokeWidth={2.6} />
                    Добавить привычку
                  </button>
                </div>

                <HabitList
                  habits={habits}
                  today={today}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  onAdd={openModal}
                />
              </section>

              <Widgets habits={habits} today={today} doneCount={doneCount} />
            </div>
          ) : (
            <StatsView habits={habits} today={today} />
          )}
        </main>
      </div>

      <AddHabitModal open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleAdd} />
    </div>
  )
}
