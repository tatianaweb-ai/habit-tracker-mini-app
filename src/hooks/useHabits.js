import { useCallback, useEffect, useMemo, useState } from 'react'
import { addDays, toKey, todayKey } from '../lib/date'
import { STORAGE_KEY, loadState, saveState } from '../lib/storage'

/** Отметки демо-привычек: список смещений в днях назад (0 = сегодня). */
function seedCompletions(offsets) {
  const completions = {}
  const today = new Date()
  for (const offset of offsets) {
    completions[toKey(addDays(today, -offset))] = true
  }
  return completions
}

function createDemoHabits() {
  const created = toKey(addDays(new Date(), -13))

  return [
    {
      id: 'demo-water',
      title: 'Пить воду',
      goal: '8 стаканов в течение дня',
      category: 'health',
      color: 'orange',
      createdAt: created,
      completions: seedCompletions([0, 1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13]),
    },
    {
      id: 'demo-english',
      title: 'Английский язык',
      goal: '30 минут занятий',
      category: 'study',
      color: 'amber',
      createdAt: created,
      completions: seedCompletions([0, 1, 2, 4, 5, 6, 7, 10, 11]),
    },
    {
      id: 'demo-review',
      title: 'Итоги дня',
      goal: 'Записать 3 задачи на завтра',
      category: 'work',
      color: 'red',
      createdAt: created,
      completions: seedCompletions([2, 3, 5, 6, 8, 9, 12]),
    },
  ]
}

function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `habit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function normalizeHabit(habit) {
  return {
    id: habit.id ?? createId(),
    title: String(habit.title ?? '').trim() || 'Без названия',
    goal: String(habit.goal ?? '').trim(),
    category: habit.category ?? 'health',
    color: habit.color ?? 'orange',
    createdAt: habit.createdAt ?? todayKey(),
    completions: habit.completions && typeof habit.completions === 'object' ? habit.completions : {},
  }
}

function readInitialHabits() {
  const state = loadState()
  if (state) return state.habits.map(normalizeHabit)
  return createDemoHabits()
}

export function useHabits() {
  const [habits, setHabits] = useState(readInitialHabits)
  const [today, setToday] = useState(todayKey)
  const [isFirstRun] = useState(() => loadState() === null)

  useEffect(() => {
    saveState({ habits, version: 1 })
  }, [habits])

  // Смена суток, пока вкладка открыта
  useEffect(() => {
    const timer = window.setInterval(() => {
      const current = todayKey()
      setToday((previous) => (previous === current ? previous : current))
    }, 60_000)
    return () => window.clearInterval(timer)
  }, [])

  // Синхронизация между вкладками
  useEffect(() => {
    function onStorage(event) {
      if (event.key !== STORAGE_KEY || !event.newValue) return
      try {
        const parsed = JSON.parse(event.newValue)
        if (Array.isArray(parsed.habits)) setHabits(parsed.habits.map(normalizeHabit))
      } catch {
        /* noop */
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const addHabit = useCallback((draft) => {
    const habit = normalizeHabit({ ...draft, id: createId(), createdAt: todayKey() })
    setHabits((previous) => [...previous, habit])
    return habit
  }, [])

  const removeHabit = useCallback((id) => {
    setHabits((previous) => previous.filter((habit) => habit.id !== id))
  }, [])

  const toggleHabit = useCallback((id, key = todayKey()) => {
    setHabits((previous) =>
      previous.map((habit) => {
        if (habit.id !== id) return habit
        const completions = { ...habit.completions }
        if (completions[key]) delete completions[key]
        else completions[key] = true
        return { ...habit, completions }
      }),
    )
  }, [])

  const resetToDemo = useCallback(() => {
    setHabits(createDemoHabits())
  }, [])

  return useMemo(
    () => ({ habits, today, isFirstRun, addHabit, removeHabit, toggleHabit, resetToDemo }),
    [habits, today, addHabit, removeHabit, toggleHabit, resetToDemo],
  )
}
