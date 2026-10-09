import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

// Telegram WebApp отсутствует в тестовой среде — проверяем, что код это переживает.
if (!window.Telegram) window.Telegram = { WebApp: null }
