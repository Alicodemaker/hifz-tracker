// A Day's plan stays fixed until the date changes; taps are only ticks until then, so they can be undone.
import { planToday, recordDay, type Progress, type TodaysPlan } from './plan'
import type { AyahRef } from './quran'
import type { Stroke } from './drawings'
import type { Rating } from './ratings'

export type Day = {
  date: string // local date, YYYY-MM-DD
  plan: TodaysPlan
  hifzEnd: AyahRef | null // last Ayah actually memorised; null if Hifz not done
  rabtDone: boolean
  murajaDone: boolean
}

export type Kind = 'hifz' | 'rabt' | 'muraja'

export type Saved = {
  version: 1
  progress: Progress // as of the start of `today`
  today: Day | null
  history: Day[] // most recent first; only Days with something done
  ratings?: Partial<Record<number, Rating>> // by Surah number; absent in older saves
  beforeNextDay?: { progress: Progress; today: Day } // the moment before the last tick moved on to the next Day, for undo
  drawings?: Record<string, Stroke[]> // pen strokes by drawingKey; absent in older saves
}

const somethingDone = (day: Day) => day.hifzEnd !== null || day.rabtDone || day.murajaDone
const logOf = (day: Day) => ({ hifzEnd: day.hifzEnd ?? undefined, rabtDone: day.rabtDone, murajaDone: day.murajaDone })

export const startDay = (saved: Saved, date: string): Saved => {
  if (saved.today?.date === date) return saved
  let { progress, history } = saved
  const { beforeNextDay: _, ...rest } = saved // a new date ends the chance to undo
  if (saved.today && somethingDone(saved.today)) {
    progress = recordDay(progress, logOf(saved.today))
    history = [saved.today, ...history]
  }
  const today: Day = { date, plan: planToday(progress), hifzEnd: null, rabtDone: false, murajaDone: false }
  return { ...rest, progress, history, today }
}

// Tick a kind of work done, or undo the tick. Hifz counts as done up to the end of today's Hifz.
export const toggleDone = (day: Day, kind: Kind): Day => {
  if (kind === 'rabt') return { ...day, rabtDone: !day.rabtDone }
  if (kind === 'muraja') return { ...day, murajaDone: !day.murajaDone }
  const last = day.plan.hifz.at(-1)
  return { ...day, hifzEnd: day.hifzEnd || !last ? null : { surah: last.surah, ayah: last.to } }
}

const doneKinds = (day: Day): number => Number(day.hifzEnd !== null) + Number(day.rabtDone) + Number(day.murajaDone)
// Everything planned today is ticked; a kind with nothing planned counts as done.
const allDone = (day: Day): boolean =>
  (day.hifzEnd !== null || !day.plan.hifz.length) &&
  (day.rabtDone || !day.plan.rabt.length) &&
  (day.murajaDone || !day.plan.muraja.length)

// Record a tick. The tick that finishes everything planned logs the Day and moves straight on to the
// next Day's plan, on the same date, keeping the moment before it so it can be undone.
export const updateToday = (saved: Saved, day: Day): Saved => {
  const { beforeNextDay: _, ...rest } = saved // any other tick ends the chance to undo
  if (!allDone(day) || !somethingDone(day)) return { ...rest, today: day }
  const progress = recordDay(saved.progress, logOf(day))
  const next: Day = { date: day.date, plan: planToday(progress), hifzEnd: null, rabtDone: false, murajaDone: false }
  const before = saved.today && { progress: saved.progress, today: saved.today }
  return { ...rest, progress, history: [day, ...saved.history], today: next, ...(before && { beforeNextDay: before }) }
}

// Back to the Day as it was before the tick that moved on, with that tick undone.
export const undoNextDay = (saved: Saved): Saved => {
  const { beforeNextDay: before, ...rest } = saved
  if (!before) return saved
  return { ...rest, progress: before.progress, today: before.today, history: saved.history.slice(1) }
}

// A small celebration when a kind is ticked done, a big one when that finishes the day; none for undoing.
export const celebrationFor = (before: Day, after: Day): 'small' | 'big' | null => {
  if (doneKinds(after) <= doneKinds(before)) return null
  return allDone(after) ? 'big' : 'small'
}

export const localDate = (now = new Date()): string =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
