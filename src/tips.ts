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

// A tip: a short title and a few concise lines, each naming what it is about, which has a gold ring round it in the
// tip's picture (src/tipPictures.ts). A tip's words name only what its picture shows. `after` is a quieter last line.
export type Tip = { id: TipId; title: string; lines: string[]; after?: string }

// In the order Settings lists them: Today, then the Mushaf page, then the other screens.
export const TIPS: Tip[] = [
  {
    id: 'hifz-amount',
    title: 'How much Hifz',
    lines: ['− and + change how much new Hifz you take each day.'],
    after: 'Between them: when you would finish the Surah and the Quran at that pace.',
  },
  {
    id: 'next-day',
    title: 'Day done',
    lines: ['Your next plan is showing.', 'Ticked one by mistake? Tap Undo.'],
  },
  {
    id: 'hifz-page',
    title: 'Hifz, ayah by ayah',
    lines: [
      "Today's Hifz shows one ayah at a time.",
      '"+\u00a0ayah" adds the next one.',
      '"2.\u00a0Half" starts from the middle of the page.',
      '× leaves ayah by ayah and shows the whole page.',
    ],
    after: 'If the buttons fade, tap the screen.',
  },
  {
    id: 'rabt-page',
    title: 'Rabt on the page',
    lines: [
      "Green triangles mark where today's Rabt starts and ends.",
      '"Ayah by ayah" shows one ayah at a time.',
      'The eye hides the text, to test yourself.',
      'The pen lets you mark weak spots.',
    ],
    after: 'If the buttons fade, tap the screen.',
  },
  {
    id: 'muraja-page',
    title: "Muraja'a on the page",
    lines: [
      "Green triangles mark where today's Muraja'a starts and ends.",
      '"Ayah by ayah" shows one ayah at a time.',
      'The eye hides the text, to test yourself.',
      'The pen lets you mark weak spots.',
    ],
    after: 'If the buttons fade, tap the screen.',
  },
  {
    id: 'ayah-by-ayah',
    title: 'Ayah by ayah',
    lines: [
      'The ayahs appear one at a time, zoomed in.',
      '"+\u00a0ayah" adds the next one.',
      '"2.\u00a0Half" starts from the middle of the page.',
      '× leaves ayah by ayah and shows the whole page.',
    ],
  },
  {
    id: 'hide',
    title: 'Hide the text',
    lines: ['Every ayah is hidden, to test yourself.', 'Tap an ayah to show or hide it.', 'The eye shows the whole text again.'],
  },
  {
    id: 'pen',
    title: 'The pen',
    lines: [
      'Draw with your finger to mark weak spots.',
      'The bin clears your drawing on this page.',
      'While the pen is on, swiping draws, so ‹ and › turn the page.',
    ],
  },
  {
    id: 'rate',
    title: 'Rate a Surah',
    lines: ['Choose how well you know this Surah, from Weak to Strong.'],
    after: 'Ratings never change your daily plan.',
  },
  {
    id: 'surahs',
    title: 'Surahs',
    lines: ['Your memorised Surahs, grouped by rating.', 'Tap a Surah to rate it.', 'The book opens it in the Mushaf.'],
  },
  {
    id: 'history',
    title: 'Back up your progress',
    lines: ['Your progress is stored only on this phone.', 'Back up saves a copy, to Google Drive for example.', 'Restore brings it back on a new phone.'],
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
