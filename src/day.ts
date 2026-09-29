// A Day's plan stays fixed until the date changes; taps are only ticks until then, so they can be undone.
import { planToday, recordDay, type Progress, type TodaysPlan } from './plan'
import type { AyahRef } from './quran'

export type Day = {
  date: string // local date, YYYY-MM-DD
  plan: TodaysPlan
  hifzEnd: AyahRef | null // last Ayah actually memorised; null if Hifz not done
  rabtDone: boolean
  murajaDone: boolean
  hifzReps?: number // times today's Hifz was read through, counted on the Mushaf page
}

export type Kind = 'hifz' | 'rabt' | 'muraja'

export type Saved = {
  version: 1
  progress: Progress // as of the start of `today`
  today: Day | null
  history: Day[] // most recent first; only Days with something done
}

const somethingDone = (day: Day) => day.hifzEnd !== null || day.rabtDone || day.murajaDone

export const startDay = (saved: Saved, date: string): Saved => {
  if (saved.today?.date === date) return saved
  let { progress, history } = saved
  if (saved.today && somethingDone(saved.today)) {
    progress = recordDay(progress, { hifzEnd: saved.today.hifzEnd ?? undefined, murajaDone: saved.today.murajaDone })
    history = [saved.today, ...history]
  }
  const today: Day = { date, plan: planToday(progress), hifzEnd: null, rabtDone: false, murajaDone: false }
  return { ...saved, progress, history, today }
}

// Tick a kind of work done, or undo the tick. Hifz counts as done up to the end of today's Hifz.
export const toggleDone = (day: Day, kind: Kind): Day => {
  if (kind === 'rabt') return { ...day, rabtDone: !day.rabtDone }
  if (kind === 'muraja') return { ...day, murajaDone: !day.murajaDone }
  const last = day.plan.hifz.at(-1)
  return { ...day, hifzEnd: day.hifzEnd || !last ? null : { surah: last.surah, ayah: last.to } }
}

// One more (or one fewer) read-through of today's Hifz, never below none.
export const countRep = (day: Day, change: 1 | -1): Day => ({ ...day, hifzReps: Math.max(0, (day.hifzReps ?? 0) + change) })

export const localDate = (now = new Date()): string =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
