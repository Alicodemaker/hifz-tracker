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

// A tip, in words a child could follow: a short title and a few short lines, each naming what it is about, which
// has a gold ring round it in the tip's picture (src/tipPictures.ts). A tip's words name only what its picture shows.
// `after` is a quieter last line.
export type Tip = { id: TipId; title: string; lines: string[]; after?: string }

// In the order Settings lists them: Today, then the Mushaf page, then the other screens.
export const TIPS: Tip[] = [
  {
    id: 'hifz-amount',
    title: 'How much new Hifz?',
    lines: ['Tap − or + for less or more each day.'],
    after: 'The middle shows when you will finish.',
  },
  {
    id: 'next-day',
    title: 'All done today!',
    lines: ["Here is tomorrow's plan.", 'Tapped one by mistake? Tap Undo.'],
  },
  {
    id: 'hifz-page',
    title: 'Hifz, ayah by ayah',
    lines: [
      'Learn one ayah at a time.',
      'Know it? Tap "+\u00a0ayah" for the next one.',
      '"2.\u00a0Half" starts from the middle of the page.',
      '× leaves ayah by ayah, and shows the whole page.',
    ],
    after: 'Buttons gone? Tap the screen.',
  },
  {
    id: 'rabt-page',
    title: 'Rabt on the page',
    lines: [
      'Green triangles show where to start and stop.',
      '"Ayah by ayah" shows one ayah at a time.',
      'The eye hides the ayahs, to test yourself.',
      'The pen marks weak spots in red.',
    ],
    after: 'Buttons gone? Tap the screen.',
  },
  {
    id: 'muraja-page',
    title: "Muraja'a on the page",
    lines: [
      'Green triangles show where to start and stop.',
      '"Ayah by ayah" shows one ayah at a time.',
      'The eye hides the ayahs, to test yourself.',
      'The pen marks weak spots in red.',
    ],
    after: 'Buttons gone? Tap the screen.',
  },
  {
    id: 'ayah-by-ayah',
    title: 'Ayah by ayah',
    lines: [
      'Only the ayahs you add show, nice and big.',
      'Know it? Tap "+\u00a0ayah" for the next one.',
      '"2.\u00a0Half" starts from the middle of the page.',
      '× leaves ayah by ayah, and shows the whole page.',
    ],
  },
  {
    id: 'hide',
    title: 'Test yourself',
    lines: ['All the ayahs are hidden.', 'Tap an ayah to peek. Tap again to hide it.', 'The eye shows them all again.'],
  },
  {
    id: 'pen',
    title: 'The red pen',
    lines: ['Draw with your finger on weak spots.', 'The bin rubs it all out.', '‹ and › turn the page.'],
  },
  {
    id: 'rate',
    title: 'How well do you know it?',
    lines: ['Tap the star, then pick from Weak to Strong.'],
    after: 'It never changes your plan.',
  },
  {
    id: 'surahs',
    title: 'Your Surahs',
    lines: ['Grouped from strong to weak.', 'Tap a Surah to rate it.', 'The book opens it in the Mushaf.'],
  },
  {
    id: 'history',
    title: 'Keep your progress safe',
    lines: ['It lives only on this phone.', 'Back up now and then, to save a copy.', 'Restore gets it back on a new phone.'],
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
