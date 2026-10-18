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

// In the order Settings lists them: Today, then the Mushaf page, then the other screens. Each one's words name only
// what its picture shows (src/tipPictures.ts), so nothing in a tip has to be looked for elsewhere. A tip with several
// buttons to explain gives each its own line.
export const TIPS: { id: TipId; title: string; text: string }[] = [
  {
    id: 'hifz-amount',
    title: 'How much Hifz',
    text: 'Tap − or + for a quarter of a page less or more new Hifz each day. The lines between them show when you would finish at that pace.',
  },
  {
    id: 'next-day',
    title: 'Day done',
    text: 'All three are done, so your next plan is showing. Ticked one by mistake? Tap Undo.',
  },
  {
    id: 'hifz-page',
    title: 'Hifz, ayah by ayah',
    text: [
      "Today's new ayahs show one at a time, zoomed in, so you can focus on each.",
      '+\u00a0ayah: add the next ayah once you know this one. 1\u00a0/\u00a07 is how many of the page\'s ayahs are showing.',
      '2.\u00a0half: start from the middle of the page.',
      '×: leave ayah by ayah and see the normal Mushaf page.',
      'If the buttons fade, tap the screen to show them again.',
    ].join('\n'),
  },
  {
    id: 'rabt-page',
    title: 'Rabt on the page',
    text: "Green triangles like this one mark where today's Rabt starts and ends. If the buttons fade, tap the screen to show them again.",
  },
  {
    id: 'muraja-page',
    title: "Muraja'a on the page",
    text: "Green triangles like this one mark where today's Muraja'a starts and ends. If the buttons fade, tap the screen to show them again.",
  },
  {
    id: 'ayah-by-ayah',
    title: 'Ayah by ayah',
    text: 'Only the ayahs you have added show, zoomed in. "+\u00a0ayah" adds the next one, "2.\u00a0half" starts from the middle of the page, and × leaves ayah by ayah for the normal Mushaf page.',
  },
  {
    id: 'hide',
    title: 'Hide the text',
    text: 'Every ayah is hidden, to test yourself. Tap an ayah to show it, and tap it again to hide it. The eye shows the whole text again.',
  },
  {
    id: 'pen',
    title: 'The pen',
    text: 'Draw with your finger to mark weak spots in red. The bin clears the page. While the pen is on, ‹ and › turn the page.',
  },
  {
    id: 'rate',
    title: 'Rate a Surah',
    text: 'How well do you hold this Surah? Pick from Weak to Strong. A rating never changes your plan.',
  },
  {
    id: 'surahs',
    title: 'Surahs',
    text: 'Your Surahs, grouped by how well you hold them. Tap a Surah to rate it, or the book to open it in the Mushaf.',
  },
  {
    id: 'history',
    title: 'Back up your progress',
    text: 'Your progress is kept only on this phone. Tap Back up now and then to save a copy, and Restore it on a new phone.',
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
