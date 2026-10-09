const STORAGE_KEY = 'habit-tracker:v1'

const MAX_TITLE = 60
const MAX_GOAL = 80

/** Защита от порчи/подделки данных в localStorage: управляющие символы + длина. */
function cleanText(value, max) {
  const text = String(value ?? '')
  let out = ''
  for (const ch of text) {
    const code = ch.codePointAt(0)
    if (code < 32 || code === 127) continue
    out += ch
    if (out.length >= max) break
  }
  return out
}

function sanitizeHabit(habit) {
  if (!habit || typeof habit !== 'object') return null
  return {
    ...habit,
    id: typeof habit.id === 'string' ? habit.id.slice(0, 64) : habit.id,
    title: cleanText(habit.title, MAX_TITLE),
    goal: cleanText(habit.goal, MAX_GOAL),
  }
}

export function loadState() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.habits)) return null
    return { ...parsed, habits: parsed.habits.map(sanitizeHabit).filter(Boolean) }
  } catch {
    return null
  }
}

export function saveState(state) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* квота или приватный режим — молча игнорируем */
  }
}

export function clearState() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* noop */
  }
}

export { STORAGE_KEY }
