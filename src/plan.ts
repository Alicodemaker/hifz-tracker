// Today's plan and how a logged day moves progress forward. Terms follow CONTEXT.md.
import { type AyahRef, SURAH_COUNT, ayahCount, ayahIndex, pageOf, sizeInPages, surahSize } from './quran'

export type Progress = {
  memorised: number[] // Surahs memorised in full
  hifzNext: AyahRef | null // next Ayah to memorise; earlier Ayahs of its Surah are memorised
  murajaNext: AyahRef | null // where the next Muraja'a slice starts
  hifzAmount?: number // chosen daily Hifz size in Pages; ½ when absent (older saves)
}

export type Range = { surah: number; from: number; to: number } // Ayahs, inclusive

export type TodaysPlan = { hifz: Range[]; rabt: Range[]; muraja: Range[] }

export const DEFAULT_HIFZ_AMOUNT = 0.5
const RABT_PAGES = 5
const SLICE_PAGES = 10

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

export const isMemorised = (ref: AyahRef, progress: Progress): boolean =>
  progress.memorised.includes(ref.surah) ||
  (progress.hifzNext?.surah === ref.surah && ref.ayah < progress.hifzNext.ayah)

// The Ayah memorised just before this one: earlier in the Surah, or the end of the next Surah.
const previousInMemorisationOrder = ({ surah, ayah }: AyahRef): AyahRef | null => {
  if (ayah > 1) return { surah, ayah: ayah - 1 }
  if (surah < SURAH_COUNT) return { surah: surah + 1, ayah: ayahCount(surah + 1) }
  return null
}

const planRabt = (progress: Progress): Range[] => {
  let ref: AyahRef | null = progress.hifzNext
    ? previousInMemorisationOrder(progress.hifzNext)
    : { surah: 1, ayah: ayahCount(1) }
  const bySurah = new Map<number, Range>()
  let total = 0
  // Walk back through recent memorisation until the total is as close to five Pages as it gets.
  while (ref && isMemorised(ref, progress)) {
    const extra = ayahSize(ref)
    if (total > 0 && Math.abs(total + extra - RABT_PAGES) > Math.abs(total - RABT_PAGES)) break
    total += extra
    const range = bySurah.get(ref.surah)
    if (range) range.from = ref.ayah
    else bySurah.set(ref.surah, { surah: ref.surah, from: ref.ayah, to: ref.ayah })
    ref = previousInMemorisationOrder(ref)
  }
  return [...bySurah.values()].sort((a, b) => a.surah - b.surah)
}

const wholeSurah = (surah: number): Range => ({ surah, from: 1, to: ayahCount(surah) })
const startIndex = (r: Range) => ayahIndex({ surah: r.surah, ayah: r.from })

// A slice is built from units: a single Surah, or a fixed group that is always revised alone.
type Unit = { ranges: Range[]; alone: boolean }

const JUZ_30_HALVES = [
  [78, 92], // an-Naba to al-Layl
  [93, 114], // ad-Duha to an-Nas
]

// Split a Surah longer than a slice into equal-ish pieces, cutting only between Pages.
const splitLongSurah = (surah: number): Range[] => {
  const pieces = Math.ceil(surahSize(surah) / SLICE_PAGES)
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

// The Muraja'a as units, in Mushaf order.
const murajaUnits = (progress: Progress, rabt: Range[]): Unit[] => {
  const inRabt = new Set(rabt.map((r) => r.surah))
  const pool = progress.memorised.filter((s) => !inRabt.has(s)).sort((a, b) => a - b)
  const units: Unit[] = []
  for (const surah of pool) {
    if (surahSize(surah) > SLICE_PAGES) {
      units.push(...splitLongSurah(surah).map((piece) => ({ ranges: [piece], alone: true })))
      continue
    }
    const half = JUZ_30_HALVES.find(([from, to]) => surah >= from && surah <= to)
    const last = units[units.length - 1]
    if (half && last?.alone && last.ranges[0].surah >= half[0]) last.ranges.push(wholeSurah(surah))
    else units.push({ ranges: [wholeSurah(surah)], alone: Boolean(half) })
  }
  return units
}

const planMuraja = (progress: Progress, rabt: Range[]): Range[] => {
  const units = murajaUnits(progress, rabt)
  if (units.length === 0) return []
  const pointer = progress.murajaNext ? ayahIndex(progress.murajaNext) : 0
  let i = units.findIndex((u) => startIndex(u.ranges[0]) >= pointer)
  if (i === -1) i = 0 // past the last Surah: wrap around
  const slice = [...units[i].ranges]
  if (units[i].alone) return slice
  let total = rangesSize(slice)
  // Add whole following Surahs while the slice stays within ten Pages; never wrap mid-slice.
  for (i++; i < units.length && !units[i].alone; i++) {
    const extra = rangesSize(units[i].ranges)
    if (total + extra > SLICE_PAGES) break
    slice.push(...units[i].ranges)
    total += extra
  }
  return slice
}

export const planToday = (progress: Progress): TodaysPlan => {
  const rabt = planRabt(progress)
  return { hifz: planHifz(progress.hifzNext, progress.hifzAmount ?? DEFAULT_HIFZ_AMOUNT), rabt, muraja: planMuraja(progress, rabt) }
}

export type DayLog = {
  hifzEnd?: AyahRef // the last Ayah actually memorised today; absent if no Hifz was done
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
export const recordDay = (progress: Progress, log: DayLog): Progress => {
  let next = progress
  if (log.murajaDone) {
    const slice = planToday(progress).muraja
    if (slice.length > 0) next = { ...next, murajaNext: afterSlice(slice) }
  }
  return log.hifzEnd ? recordHifz(next, log.hifzEnd) : next
}
