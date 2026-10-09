import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Plus, X } from 'lucide-react'
import { ACCENT_LIST, CATEGORY_LIST } from '../lib/constants'

const EMPTY_DRAFT = { title: '', goal: '', category: 'health', color: 'orange' }

const fieldClass =
  'w-full rounded-xl border border-orange-100 bg-orange-50/50 px-4 py-3 text-[15px] text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-200 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-200/60'

const labelClass = 'mb-2 block text-xs font-bold uppercase tracking-wide text-gray-600'

export default function AddHabitModal({ open, onClose, onSubmit }) {
  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const titleRef = useRef(null)

  useEffect(() => {
    if (!open) return

    setDraft(EMPTY_DRAFT)
    const timer = window.setTimeout(() => titleRef.current?.focus(), 80)

    function onKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const canSubmit = draft.title.trim().length > 0

  function update(field, value) {
    setDraft((previous) => ({ ...previous, [field]: value }))
  }

  function submit(event) {
    event.preventDefault()
    if (!canSubmit) return
    onSubmit({ ...draft, title: draft.title.trim(), goal: draft.goal.trim() })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="animate-fade-in absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-habit-title"
        className="animate-scale-in relative flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl shadow-orange-200/50"
      >
        <div className="flex items-center justify-between border-b border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50 px-6 py-4">
          <div>
            <h2 id="add-habit-title" className="text-xl font-bold text-gray-900">
              Новая привычка
            </h2>
            <p className="mt-0.5 text-[13px] text-gray-600">
              Что и зачем вы будете делать каждый день
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm transition-colors hover:bg-gray-100 active:scale-90"
          >
            <X size={17} strokeWidth={2.6} />
          </button>
        </div>

        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <label className="block">
              <span className={labelClass}>Название</span>
              <input
                ref={titleRef}
                value={draft.title}
                onChange={(event) => update('title', event.target.value)}
                placeholder="Например, пробежка"
                maxLength={60}
                className={fieldClass}
              />
            </label>

            <label className="mt-5 block">
              <span className={labelClass}>
                Цель <span className="font-medium normal-case text-gray-400">(необязательно)</span>
              </span>
              <input
                value={draft.goal}
                onChange={(event) => update('goal', event.target.value)}
                placeholder="5 км по парку"
                maxLength={80}
                className={fieldClass}
              />
            </label>

            <label className="mt-5 block">
              <span className={labelClass}>Категория</span>
              <div className="relative">
                <select
                  value={draft.category}
                  onChange={(event) => update('category', event.target.value)}
                  className={`${fieldClass} cursor-pointer pr-11`}
                >
                  {CATEGORY_LIST.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={18}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-orange-500"
                />
              </div>
            </label>

            <fieldset className="mt-5">
              <legend className={labelClass}>Цвет акцента</legend>
              <div className="grid grid-cols-4 gap-3">
                {ACCENT_LIST.map((accent) => {
                  const active = draft.color === accent.id
                  return (
                    <button
                      key={accent.id}
                      type="button"
                      onClick={() => update('color', accent.id)}
                      aria-label={accent.label}
                      aria-pressed={active}
                      className={`flex h-12 items-center justify-center gap-2 rounded-xl border-2 text-xs font-bold transition-all duration-200 active:scale-95 ${
                        active
                          ? 'border-orange-400 bg-orange-50 text-gray-900 shadow-sm'
                          : 'border-orange-100 bg-white text-gray-500 hover:border-orange-300'
                      }`}
                    >
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full ${accent.swatch} ${
                          active ? 'text-white' : ''
                        }`}
                      >
                        {active && <Check size={14} strokeWidth={3.2} />}
                      </span>
                      {accent.label}
                    </button>
                  )
                })}
              </div>
            </fieldset>
          </div>

          <div className="flex items-center gap-3 border-t border-orange-100 bg-orange-50/40 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-5 py-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-white hover:text-gray-900"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-200 transition-all duration-200 hover:shadow-2xl hover:shadow-orange-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400 disabled:shadow-none"
            >
              <Plus size={18} strokeWidth={2.6} />
              Добавить привычку
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
