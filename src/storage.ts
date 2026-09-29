// Everything the app remembers lives in one localStorage entry on this device.
import type { Saved } from './day'

const KEY = 'hifz-tracker'

export const load = (): Saved | null => {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const saved = JSON.parse(raw) as Saved
    return { ...saved, today: saved.today ?? null, history: saved.history ?? [] }
  } catch {
    return null
  }
}

export const save = (saved: Saved): void => {
  localStorage.setItem(KEY, JSON.stringify(saved))
  // Ask the browser not to clear our data when the phone runs low on space.
  navigator.storage?.persist?.().catch(() => {})
}
