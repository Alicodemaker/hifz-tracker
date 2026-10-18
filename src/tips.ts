// One-time tips: a short popup the first time something is used, saying what it does. Which tips have shown is kept
// on this phone only, apart from the saved progress (like the theme), so a restored Backup shows them again.
import { useSyncExternalStore } from 'react'

export type TipId =
  | 'hifz-page'
  | 'rabt-page'
  | 'muraja-page'
  | 'ayah-by-ayah'
  | 'hide'
  | 'pen'
  | 'rate'
  | 'hifz-amount'
  | 'next-day'
  | 'surahs'
  | 'history'

// A tip, in words a child could follow: a short title, a line or two, and (`steps`) one line for each gold ring in its
// picture (src/tipPictures.ts), in the rings' order. With two rings or more, the rings and the lines carry the same
// numbers, so a glance from a number to its ring is enough. A tip's words name only what its picture shows.
export type Tip = { id: TipId; title: string; text?: string; steps: string[]; after?: string }

// In the order Settings lists them: Today, then the Mushaf page, then the other screens.
export const TIPS: Tip[] = [
  {
    id: 'hifz-amount',
    title: 'How much new Hifz?',
    steps: ['Less each day.', 'More each day.'],
    after: 'The middle shows when you will finish.',
  },
  {
    id: 'next-day',
    title: 'All done today!',
    text: "Here is tomorrow's plan.",
    steps: ['Tapped one by mistake? Tap Undo.'],
  },
  {
    id: 'hifz-page',
    title: 'Hifz, ayah by ayah',
    text: 'Learn one ayah at a time.',
    steps: ['Know it? Tap for the next ayah.', 'Start from the middle of the page.', '× Leave ayah by ayah, and see the whole page.'],
    after: 'Buttons gone? Tap the screen.',
  },
  {
    id: 'rabt-page',
    title: 'Rabt on the page',
    steps: ['Green triangles show where to start and stop.', 'One ayah at a time.', 'Hide the ayahs, to test yourself.', 'Mark weak spots in red.'],
    after: 'Buttons gone? Tap the screen.',
  },
  {
    id: 'muraja-page',
    title: "Muraja'a on the page",
    steps: ['Green triangles show where to start and stop.', 'One ayah at a time.', 'Hide the ayahs, to test yourself.', 'Mark weak spots in red.'],
    after: 'Buttons gone? Tap the screen.',
  },
  {
    id: 'ayah-by-ayah',
    title: 'Ayah by ayah',
    text: 'Only the ayahs you add show, nice and big.',
    steps: ['Know it? Tap for the next ayah.', 'Start from the middle of the page.', '× Leave ayah by ayah, and see the whole page.'],
  },
  {
    id: 'hide',
    title: 'Test yourself',
    text: 'All the ayahs are hidden.',
    steps: ['Tap an ayah to peek. Tap again to hide it.', 'Show all the ayahs again.'],
  },
  {
    id: 'pen',
    title: 'The red pen',
    steps: ['Draw with your finger on weak spots.', 'Rub it all out.', 'Turn the page.'],
  },
  {
    id: 'rate',
    title: 'How well do you know it?',
    steps: ['Tap the star.', 'Pick from Weak to Strong.'],
    after: 'It never changes your plan.',
  },
  {
    id: 'surahs',
    title: 'Your Surahs',
    text: 'Grouped from strong to weak.',
    steps: ['Tap a Surah to rate it.', 'Open it in the Mushaf.'],
  },
  {
    id: 'history',
    title: 'Keep your progress safe',
    text: 'It lives only on this phone.',
    steps: ['Save a copy now and then.', 'Get it back on a new phone.'],
  },
]

const KEY = 'hifz-tips-seen'

const readSeen = (): Set<string> => {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[])
  } catch {
    return new Set()
  }
}
const writeSeen = (seen: Set<string>) => {
  try {
    localStorage.setItem(KEY, JSON.stringify([...seen]))
  } catch {
    // Storage can be unavailable; the tip may then show again next time.
  }
}

// Tips waiting to show, one at a time, so two never stack.
let queue: TipId[] = []
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((listener) => listener())

// Show a tip, unless it has shown on this phone before. It counts as seen from now on.
export const tipOnce = (id: TipId) => {
  const seen = readSeen()
  if (seen.has(id) || queue.includes(id)) return
  writeSeen(seen.add(id))
  queue = [...queue, id]
  emit()
}

export const dismissTip = () => {
  queue = queue.slice(1)
  emit()
}

// The tip showing now, if any.
export const currentTip = (): TipId | null => queue[0] ?? null
export const useTip = () =>
  useSyncExternalStore((listener) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }, currentTip)

// From Settings: every tip shows again the next time its tool is used.
export const resetTips = () => {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // Nothing was kept, so nothing to clear.
  }
}

// For `npm run screenshots`, whose screenshots must not have tips over them.
export const seeAllTips = () => writeSeen(new Set(TIPS.map((tip) => tip.id)))
