// A Day's plan stays fixed until the date changes; taps are only ticks until then, so they can be undone.
import { planToday, recordDay, type Progress, type TodaysPlan } from './plan'
import type { AyahRef } from './quran'

export type Day = {
  date: string // local date, YYYY-MM-DD
  plan: TodaysPlan
  hifzEnd: AyahRef | null // last Ayah actually memorised; null if Hifz not done
  rabtDone: boolean
  murajaDone: boolean
}

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

export const localDate = (now = new Date()): string =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
