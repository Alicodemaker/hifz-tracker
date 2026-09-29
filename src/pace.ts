// Hifz amount changes and the finish estimates they drive (ADR-0008).
import type { Saved } from './day'
import { DEFAULT_HIFZ_AMOUNT, isMemorised, planToday, type Progress } from './plan'
import { AYAH_COUNT, ayahAt, ayahCount, ayahSizeAt, sizeInPages } from './quran'

const STEP = 0.25
const MIN_AMOUNT = 0.25
const MAX_AMOUNT = 5
const WINDOW_DAYS = 28 // four weeks of history

// One quarter-Page step up or down. The new amount is kept for the days after, and today's Hifz is re-planned.
export const changeHifzAmount = (saved: Saved, direction: 1 | -1): Saved => {
  const current = saved.progress.hifzAmount ?? DEFAULT_HIFZ_AMOUNT
  const hifzAmount = Math.min(MAX_AMOUNT, Math.max(MIN_AMOUNT, current + direction * STEP))
  const progress = { ...saved.progress, hifzAmount }
  const today = saved.today && { ...saved.today, plan: { ...saved.today.plan, hifz: planToday(progress).hifz } }
  return { ...saved, progress, today }
}

const pagesNotMemorised = (progress: Progress): number => {
  let pages = 0
  for (let i = 0; i < AYAH_COUNT; i++) if (!isMemorised(ayahAt(i), progress)) pages += ayahSizeAt(i)
  return pages
}

const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T12:00:00`) - Date.parse(`${from}T12:00:00`)) / 86_400_000)

// Hifz days per week over the last four weeks, or every day until four weeks of history exist.
const hifzDaysPerWeek = (saved: Saved, date: string): { perWeek: number; fromHistory: boolean } => {
  const oldest = saved.history[saved.history.length - 1]
  if (!oldest || daysBetween(oldest.date, date) < WINDOW_DAYS) return { perWeek: 7, fromHistory: false }
  const recent = saved.history.filter((d) => d.hifzEnd !== null && daysBetween(d.date, date) <= WINDOW_DAYS)
  return { perWeek: (recent.length / WINDOW_DAYS) * 7, fromHistory: true }
}

export type FinishEstimates = { surahDays: number; quranDays: number; hifzDaysPerWeek: number; fromHistory: boolean }

// Calendar days until the current Surah and the whole Quran are memorised, at the current Pace.
export const finishEstimates = (saved: Saved): FinishEstimates | null => {
  const { progress, today } = saved
  const next = progress.hifzNext
  if (!next || !today) return null
  const { perWeek, fromHistory } = hifzDaysPerWeek(saved, today.date)
  if (perWeek === 0) return null
  const amount = progress.hifzAmount ?? DEFAULT_HIFZ_AMOUNT
  const calendarDays = (pages: number) => Math.ceil(Math.ceil(pages / amount) * (7 / perWeek))
  const surahLeft = sizeInPages(next, { surah: next.surah, ayah: ayahCount(next.surah) })
  return {
    surahDays: calendarDays(surahLeft),
    quranDays: calendarDays(pagesNotMemorised(progress)),
    hifzDaysPerWeek: perWeek,
    fromHistory,
  }
}

// "about a day", "about 5 days", "about 3 weeks", "about 3 months", "about 2½ years" (years to the nearest half).
export const describeDuration = (days: number): string => {
  if (days <= 1) return 'about a day'
  if (days < 14) return `about ${days} days`
  if (days < 60) return `about ${Math.round(days / 7)} weeks`
  const months = Math.round(days / 30.44)
  if (months < 12) return `about ${months} months`
  const halfYears = Math.round(days / 182.6)
  const whole = Math.floor(halfYears / 2)
  const label = `${whole}${halfYears % 2 ? '½' : ''}`
  return `about ${label} ${halfYears === 2 ? 'year' : 'years'}`
}
