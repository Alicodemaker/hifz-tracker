// Today's plan and how a logged day moves progress forward. Terms follow CONTEXT.md.
import { type AyahRef, SURAH_COUNT, ayahCount, ayahIndex, juzOfAyah, juzOfSurah, pageOf, sizeInPages, surahSize } from './quran'

export type Progress = {
  memorised: number[] // Surahs memorised in full
  hifzNext: AyahRef | null // next Ayah to memorise; earlier Ayahs of its Surah are memorised
  murajaNext: AyahRef | null // where the next Muraja'a slice starts
  rabtNext?: AyahRef | null // where the next Rabt starts; the start of the rotation when absent
  hifzAmount?: number // chosen daily Hifz size in Pages; ½ when absent (older saves)
  murajaPages?: number // chosen most Pages in a Muraja'a slice; 10 when absent (older saves)
}

export type Range = { surah: number; from: number; to: number } // Ayahs, inclusive

export type TodaysPlan = { hifz: Range[]; rabt: Range[]; muraja: Range[] }

export const DEFAULT_HIFZ_AMOUNT = 0.5
export const DEFAULT_MURAJA_PAGES = 10
const RABT_PIECE_PAGES = 10 // a Surah longer than this is revised in pieces of about this size

const ayahSize = (ref: AyahRef) => sizeInPages(ref, ref)

export const rangesSize = (ranges: Range[]): number =>
  ranges.reduce((t, r) => t + sizeInPages({ surah: r.surah, ayah: r.from }, { surah: r.surah, ayah: r.to }), 0)

const planHifz = (next: AyahRef | null, amount: number): Range[] => {
  if (!next) return []
  const { surah } = next
  let to = next.ayah
  let total = ayahSize(next)
  // Take the Ayah that brings the total closest to the Hifz amount.
  while (to < ayahCount(surah)) {
    const extra = ayahSize({ surah, ayah: to + 1 })
    if (Math.abs(total + extra - amount) > Math.abs(total - amount)) break
    total += extra
    to++
  }
  // Finish the Surah rather than leave less than one Hifz amount of it.
  if (to < ayahCount(surah) && sizeInPages({ surah, ayah: to + 1 }, { surah, ayah: ayahCount(surah) }) < amount) {
    to = ayahCount(surah)
  }
  const hifz = [{ surah, from: next.ayah, to }]
  // After a finished Surah, add whole following Surahs while that gets closer to the Hifz amount.
  total = rangesSize(hifz)
  for (let s = surah - 1; to === ayahCount(hifz[hifz.length - 1].surah) && s >= 1; s--) {
    const whole = { surah: s, from: 1, to: ayahCount(s) }
    const withIt = total + rangesSize([whole])
    if (Math.abs(withIt - amount) >= Math.abs(total - amount)) break
    hifz.push(whole)
    total = withIt
  }
  return hifz
}

// Where Hifz starts for someone setting up: memorisation runs back from an-Nas (ADR-0003), so it is the first
// Surah, counting back from an-Nas, not yet memorised. Nothing when every Surah is.
export const suggestedHifzStart = (memorised: number[]): AyahRef | null => {
  for (let surah = SURAH_COUNT; surah >= 1; surah--) if (!memorised.includes(surah)) return { surah, ayah: 1 }
  return null
}

export const isMemorised = (ref: AyahRef, progress: Progress): boolean =>
  progress.memorised.includes(ref.surah) ||
  (progress.hifzNext?.surah === ref.surah && ref.ayah < progress.hifzNext.ayah)

const wholeSurah = (surah: number): Range => ({ surah, from: 1, to: ayahCount(surah) })
const startIndex = (r: Range) => ayahIndex({ surah: r.surah, ayah: r.from })

// A slice is built from units: a single Surah, or a fixed group that is always revised alone.
type Unit = { ranges: Range[]; alone: boolean }

const JUZ_30_HALVES = [
  [78, 92], // an-Naba to al-Layl
  [93, 114], // ad-Duha to an-Nas
]

// Split a Surah longer than a slice into equal-ish pieces, cutting only between Pages.
const splitLongSurah = (surah: number, limit: number): Range[] => {
  const pieces = Math.ceil(surahSize(surah) / limit)
  const target = surahSize(surah) / pieces
  const count = ayahCount(surah)
  const pageSize = (page: number, fromAyah: number) => {
    let total = 0
    for (let a = fromAyah; a <= count && pageOf({ surah, ayah: a }) === page; a++) total += ayahSize({ surah, ayah: a })
    return total
  }
  const ranges: Range[] = []
  let from = 1
  let done = 0
  for (let a = 2; a <= count && ranges.length < pieces - 1; a++) {
    done += ayahSize({ surah, ayah: a - 1 })
    const page = pageOf({ surah, ayah: a })
    if (page === pageOf({ surah, ayah: a - 1 })) continue
    // Cut at the Page boundary nearest to the next target.
    if (done + pageSize(page, a) / 2 >= target * (ranges.length + 1)) {
      ranges.push({ surah, from, to: a - 1 })
      from = a
    }
  }
  ranges.push({ surah, from, to: count })
  return ranges
}

// The Surahs the Rabt rotates through: memorised Surahs after the one being memorised (in Mushaf order)
// that start in the juz the next Hifz is in. With none, it is the Surah memorised just before.
const rabtSurahs = (progress: Progress): number[] => {
  const hifzSurah = progress.hifzNext?.surah ?? 0
  const juz = progress.hifzNext ? juzOfAyah(ayahIndex(progress.hifzNext)) : 1
  const memorised = new Set(progress.memorised)
  const inJuz = [...memorised].filter((s) => s > hifzSurah && juzOfSurah(s) === juz).sort((a, b) => a - b)
  if (inJuz.length) return inJuz
  return memorised.has(hifzSurah + 1) ? [hifzSurah + 1] : []
}

// One Surah a day, or one piece of a long Surah, taken from where the last Rabt ended; wraps at the end.
const planRabt = (progress: Progress, surahs: number[]): Range[] => {
  const units = surahs.flatMap((s) => (surahSize(s) > RABT_PIECE_PAGES ? splitLongSurah(s, RABT_PIECE_PAGES) : [wholeSurah(s)]))
  if (units.length === 0) return []
  const pointer = progress.rabtNext ? ayahIndex(progress.rabtNext) : 0
  const i = units.findIndex((u) => startIndex(u) >= pointer)
  return [units[i === -1 ? 0 : i]]
}

// The Muraja'a as units, in Mushaf order.
const murajaUnits = (progress: Progress, inRabt: Set<number>, limit: number): Unit[] => {
  const pool = progress.memorised.filter((s) => !inRabt.has(s)).sort((a, b) => a - b)
  const units: Unit[] = []
  for (const surah of pool) {
    if (surahSize(surah) > limit) {
      units.push(...splitLongSurah(surah, limit).map((piece) => ({ ranges: [piece], alone: true })))
      continue
    }
    const half = JUZ_30_HALVES.find(([from, to]) => surah >= from && surah <= to)
    const last = units[units.length - 1]
    if (half && last?.alone && last.ranges[0].surah >= half[0]) last.ranges.push(wholeSurah(surah))
    else units.push({ ranges: [wholeSurah(surah)], alone: Boolean(half) })
  }
  return units
}

const planMuraja = (progress: Progress, inRabt: Set<number>): Range[] => {
  const limit = progress.murajaPages ?? DEFAULT_MURAJA_PAGES
  const units = murajaUnits(progress, inRabt, limit)
  if (units.length === 0) return []
  const pointer = progress.murajaNext ? ayahIndex(progress.murajaNext) : 0
  let i = units.findIndex((u) => startIndex(u.ranges[0]) >= pointer)
  if (i === -1) i = 0 // past the last Surah: wrap around
  const slice = [...units[i].ranges]
  if (units[i].alone) return slice
  let total = rangesSize(slice)
  // Add whole following Surahs while the slice stays within the chosen Pages; never wrap mid-slice.
  for (i++; i < units.length && !units[i].alone; i++) {
    const extra = rangesSize(units[i].ranges)
    if (total + extra > limit) break
    slice.push(...units[i].ranges)
    total += extra
  }
  return slice
}

export const planToday = (progress: Progress): TodaysPlan => {
  const inRabt = rabtSurahs(progress)
  return {
    hifz: planHifz(progress.hifzNext, progress.hifzAmount ?? DEFAULT_HIFZ_AMOUNT),
    rabt: planRabt(progress, inRabt),
    muraja: planMuraja(progress, new Set(inRabt)),
  }
}

export type DayLog = {
  hifzEnd?: AyahRef // the last Ayah actually memorised today; absent if no Hifz was done
  rabtDone?: boolean
  murajaDone?: boolean // true only if the whole Muraja'a slice was revised
}

// The Ayah memorised after this one: later in the Surah, or the start of the Surah before it.
const nextInMemorisationOrder = ({ surah, ayah }: AyahRef): AyahRef | null => {
  if (ayah < ayahCount(surah)) return { surah, ayah: ayah + 1 }
  if (surah > 1) return { surah: surah - 1, ayah: 1 }
  return null
}

const recordHifz = (progress: Progress, end: AyahRef): Progress => {
  const memorised = new Set(progress.memorised)
  // Every Surah whose last Ayah falls between the old position and the end is now complete.
  for (let s = progress.hifzNext?.surah ?? end.surah; s > end.surah; s--) memorised.add(s)
  if (end.ayah === ayahCount(end.surah)) memorised.add(end.surah)
  return { ...progress, memorised: [...memorised], hifzNext: nextInMemorisationOrder(end) }
}

// The next slice starts right after today's; after an-Nas the rotation wraps to the start.
const afterSlice = (slice: Range[]): AyahRef | null => {
  const last = slice[slice.length - 1]
  if (last.to < ayahCount(last.surah)) return { surah: last.surah, ayah: last.to + 1 }
  return last.surah < SURAH_COUNT ? { surah: last.surah + 1, ayah: 1 } : null
}

// A Gap or a partly revised slice leaves progress untouched, so tomorrow's plan repeats (ADR-0002).
// When Hifz moves on to another Surah, the Rabt starts again from the Surah after it.
export const recordDay = (progress: Progress, log: DayLog): Progress => {
  const plan = planToday(progress)
  let next = progress
  if (log.rabtDone && plan.rabt.length > 0) next = { ...next, rabtNext: afterSlice(plan.rabt) }
  if (log.murajaDone && plan.muraja.length > 0) next = { ...next, murajaNext: afterSlice(plan.muraja) }
  if (!log.hifzEnd) return next
  next = recordHifz(next, log.hifzEnd)
  return next.hifzNext?.surah === progress.hifzNext?.surah ? next : { ...next, rabtNext: null }
}
