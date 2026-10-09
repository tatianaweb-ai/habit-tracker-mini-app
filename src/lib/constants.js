import { BookOpen, Briefcase, HeartPulse } from 'lucide-react'

/** Категории намеренно выделены из оранжевой гаммы, чтобы различаться на карточках. */
export const CATEGORIES = {
  health: { id: 'health', label: 'Здоровье', Icon: HeartPulse, tint: 'text-red-500' },
  work: { id: 'work', label: 'Работа', Icon: Briefcase, tint: 'text-blue-600' },
  study: { id: 'study', label: 'Обучение', Icon: BookOpen, tint: 'text-violet-600' },
}

export const CATEGORY_LIST = Object.values(CATEGORIES)

/**
 * Акцент карточки. Тёплая палитра в рамках общей оранжевой темы.
 * Классы записаны литералами, чтобы Tailwind включил их в сборку.
 */
export const ACCENTS = {
  orange: {
    id: 'orange',
    label: 'Оранжевый',
    swatch: 'bg-orange-500',
    solid: 'bg-orange-500',
    soft: 'bg-orange-50',
    text: 'text-orange-600',
  },
  amber: {
    id: 'amber',
    label: 'Янтарный',
    swatch: 'bg-amber-400',
    solid: 'bg-amber-400',
    soft: 'bg-amber-50',
    text: 'text-amber-600',
  },
  red: {
    id: 'red',
    label: 'Красный',
    swatch: 'bg-red-500',
    solid: 'bg-red-500',
    soft: 'bg-red-50',
    text: 'text-red-600',
  },
  rose: {
    id: 'rose',
    label: 'Розовый',
    swatch: 'bg-rose-400',
    solid: 'bg-rose-400',
    soft: 'bg-rose-50',
    text: 'text-rose-600',
  },
}

export const ACCENT_LIST = Object.values(ACCENTS)

export function getAccent(habit) {
  return ACCENTS[habit?.color] ?? ACCENTS.orange
}

export function getCategory(habit) {
  return CATEGORIES[habit?.category] ?? CATEGORIES.health
}
