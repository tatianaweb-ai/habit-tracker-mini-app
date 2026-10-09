import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useHabits } from '../src/hooks/useHabits'
import { STORAGE_KEY } from '../src/lib/storage'
import { addDays, toKey, todayKey } from '../src/lib/date'

const read = () => JSON.parse(window.localStorage.getItem(STORAGE_KEY))

const daysAgo = (n) => toKey(addDays(new Date(), -n))

function seed(habits) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ habits, version: 1 }))
}

const baseHabit = {
  title: 'Пить воду',
  goal: '8 стаканов',
  category: 'health',
  color: 'orange',
  createdAt: daysAgo(5),
  completions: {},
}

describe('useHabits — инициализация', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('при пустом localStorage создаёт 3 демо-привычки', () => {
    const { result } = renderHook(() => useHabits())
    expect(result.current.habits).toHaveLength(3)
    expect(result.current.isFirstRun).toBe(true)
    expect(result.current.habits.map((h) => h.title)).toEqual([
      'Пить воду',
      'Английский язык',
      'Итоги дня',
    ])
  })

  it('демо-привычки сохраняются сразу при первом рендере', () => {
    renderHook(() => useHabits())
    expect(read().habits).toHaveLength(3)
  })

  it('читает существующие данные из localStorage', () => {
    seed([{ ...baseHabit, id: 'saved-1' }])
    const { result } = renderHook(() => useHabits())
    expect(result.current.habits).toHaveLength(1)
    expect(result.current.habits[0].id).toBe('saved-1')
    expect(result.current.isFirstRun).toBe(false)
  })

  it('игнорирует мусор в localStorage и откатывается к демо-данным', () => {
    window.localStorage.setItem(STORAGE_KEY, '{ это не json')
    const { result } = renderHook(() => useHabits())
    expect(result.current.habits).toHaveLength(3)
  })

  it('не падает на структуре без completions', () => {
    seed([{ id: 'x', title: 'Без отметок' }])
    const { result } = renderHook(() => useHabits())
    expect(result.current.habits[0].completions).toEqual({})
    expect(result.current.habits[0].color).toBe('orange')
  })
})

describe('useHabits — мутации', () => {
  beforeEach(() => {
    seed([{ ...baseHabit, id: 'h1' }])
  })

  it('добавляет привычку и сохраняет её', () => {
    const { result } = renderHook(() => useHabits())
    let created
    act(() => {
      created = result.current.addHabit({
        title: '  Бег  ',
        goal: '  5 км ',
        category: 'work',
        color: 'red',
      })
    })

    expect(result.current.habits).toHaveLength(2)
    expect(created.title).toBe('Бег')
    expect(created.goal).toBe('5 км')
    expect(created.createdAt).toBe(todayKey())
    expect(read().habits).toHaveLength(2)
  })

  it('переключает выполнение за сегодня', () => {
    const { result } = renderHook(() => useHabits())
    act(() => result.current.toggleHabit('h1'))
    expect(result.current.habits[0].completions[todayKey()]).toBe(true)
    expect(read().habits[0].completions[todayKey()]).toBe(true)

    act(() => result.current.toggleHabit('h1'))
    expect(result.current.habits[0].completions[todayKey()]).toBeUndefined()
    expect(read().habits[0].completions[todayKey()]).toBeUndefined()
  })

  it('не трогает отметки за другие дни при переключении', () => {
    seed([{ ...baseHabit, id: 'h1', completions: { [daysAgo(1)]: true } }])
    const { result } = renderHook(() => useHabits())
    act(() => result.current.toggleHabit('h1'))
    expect(result.current.habits[0].completions[daysAgo(1)]).toBe(true)
    expect(result.current.habits[0].completions[todayKey()]).toBe(true)
  })

  it('переключает отметку за произвольный день', () => {
    const { result } = renderHook(() => useHabits())
    act(() => result.current.toggleHabit('h1', daysAgo(2)))
    expect(result.current.habits[0].completions[daysAgo(2)]).toBe(true)
  })

  it('удаляет привычку', () => {
    const { result } = renderHook(() => useHabits())
    act(() => result.current.removeHabit('h1'))
    expect(result.current.habits).toHaveLength(0)
    expect(read().habits).toHaveLength(0)
  })

  it('удаление неизвестного id ничего не делает', () => {
    const { result } = renderHook(() => useHabits())
    act(() => result.current.removeHabit('нет-такого'))
    expect(result.current.habits).toHaveLength(1)
  })
})

describe('useHabits — синхронизация и смена суток', () => {
  it('применяет изменения из другой вкладки', () => {
    seed([{ ...baseHabit, id: 'h1' }])
    const { result } = renderHook(() => useHabits())

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: STORAGE_KEY,
          newValue: JSON.stringify({ habits: [{ ...baseHabit, id: 'h2', title: 'Из вкладки' }] }),
        }),
      )
    })

    expect(result.current.habits).toHaveLength(1)
    expect(result.current.habits[0].title).toBe('Из вкладки')
  })

  it('игнорирует чужие ключи и битый payload', () => {
    seed([{ ...baseHabit, id: 'h1' }])
    const { result } = renderHook(() => useHabits())

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'other', newValue: 'null' }))
      window.dispatchEvent(
        new StorageEvent('storage', { key: STORAGE_KEY, newValue: '{{{ не json' }),
      )
    })

    expect(result.current.habits).toHaveLength(1)
    expect(result.current.habits[0].id).toBe('h1')
  })

  it('обновляет дату при наступлении новых суток', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useHabits())
    const today = result.current.today

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    vi.setSystemTime(tomorrow)
    act(() => {
      vi.advanceTimersByTime(61_000)
    })

    expect(result.current.today).not.toBe(today)
    expect(result.current.today).toBe(toKey(new Date()))
  })
})
