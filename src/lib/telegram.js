/** Обёртки над Telegram Mini App API: безопасно работают и вне Telegram. */

export function getWebApp() {
  return typeof window !== 'undefined' ? (window.Telegram?.WebApp ?? null) : null
}

export function initTelegram() {
  const tg = getWebApp()
  if (!tg) return null

  try {
    tg.ready?.()
    tg.expand?.()
    tg.setHeaderColor?.('#f8fafc')
    tg.setBackgroundColor?.('#e2e8f0')
  } catch {
    /* noop */
  }

  return tg
}

export function haptic(style = 'light') {
  try {
    getWebApp()?.HapticFeedback?.impactOccurred?.(style)
  } catch {
    /* noop */
  }
}

export function notify(type = 'success') {
  try {
    getWebApp()?.HapticFeedback?.notificationOccurred?.(type)
  } catch {
    /* noop */
  }
}
