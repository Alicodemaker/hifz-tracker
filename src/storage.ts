// Everything the app remembers lives in one localStorage entry on this device.
import type { Progress } from './plan'

const KEY = 'hifz-tracker'

export type Saved = { version: 1; progress: Progress }

export const load = (): Saved | null => {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Saved) : null
  } catch {
    return null
  }
}

export const save = (saved: Saved): void => {
  localStorage.setItem(KEY, JSON.stringify(saved))
  // Ask the browser not to clear our data when the phone runs low on space.
  navigator.storage?.persist?.().catch(() => {})
}
