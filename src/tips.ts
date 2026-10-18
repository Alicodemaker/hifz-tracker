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

// In the order Settings lists them: Today, then the Mushaf page, then the other screens.
export const TIPS: { id: TipId; title: string; text: string }[] = [
  {
    id: 'hifz-amount',
    title: 'How much Hifz',
    text: '− and + change how much new Hifz you take each day, a quarter of a page at a time. The line between them shows when you would finish at that pace.',
  },
  {
    id: 'next-day',
    title: 'Day done',
    text: "All done, so the day is in History and tomorrow's plan is showing. Ticked one by mistake? \"Undo\" brings the day back.",
  },
  {
    id: 'hifz-page',
    title: "Today's Hifz",
    text: "The page opens ayah by ayah: tap \"+\u00a0ayah\" to add the next one. Small olive pins mark where today's Hifz starts and ends. Tap the page to show or hide the buttons.",
  },
  {
    id: 'rabt-page',
    title: 'Rabt on the page',
    text: "Olive pins mark where today's Rabt starts and ends. Tap the page to show the buttons: hide the text to test yourself, the pen for weak spots, and ayah by ayah in the corner. The star at the top rates the Surah. Swipe to turn the page.",
  },
  {
    id: 'muraja-page',
    title: "Muraja'a on the page",
    text: "Olive pins mark where today's Muraja'a starts and ends. Tap the page to show the buttons: hide the text to test yourself, the pen for weak spots, and ayah by ayah in the corner. The star at the top rates the Surah. Swipe to turn the page.",
  },
  {
    id: 'ayah-by-ayah',
    title: 'Ayah by ayah',
    text: 'Only the ayahs you have added show, zoomed in. "+\u00a0ayah" adds the next one, and on a long page "2.\u00a0half" starts from its middle. × shows the whole page again.',
  },
  {
    id: 'hide',
    title: 'Hide the text',
    text: 'Every ayah is hidden, to test yourself. Tap an ayah to show it, and tap it again to hide it. The eye button shows the whole text again.',
  },
  {
    id: 'pen',
    title: 'The pen',
    text: 'Draw with your finger to mark weak spots in red. Drawings stay on the page until you tap the bin to clear it. While the pen is on, the ‹ › buttons turn the page.',
  },
  {
    id: 'rate',
    title: 'Rate a Surah',
    text: 'From Weak to Strong. Ratings group your Surahs on the Surahs screen, so a strong one for salah is quick to find. They never change your plan.',
  },
  {
    id: 'surahs',
    title: 'Surahs',
    text: 'Your memorised Surahs, grouped by how well you hold them. Tap a Surah to rate it, or its book to open it in the Mushaf.',
  },
  {
    id: 'history',
    title: 'History',
    text: 'Every finished day is logged here. Everything stays on this phone, so Back up now and then (to Drive or email, say), and Restore on a new phone.',
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

// For `npm run intro-shots`, whose screenshots must not have tips over them.
export const seeAllTips = () => writeSeen(new Set(TIPS.map((tip) => tip.id)))
