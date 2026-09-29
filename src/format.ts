import { rangesSize, type Range } from './plan'
import { type AyahRef, ayahCount, pageOf, surahName } from './quran'

const isWhole = (r: Range) => r.from === 1 && r.to === ayahCount(r.surah)

// "Ghafir 1–5", "Ash-Shuraa", or "An-Naba → Al-Layl (15 surahs)" for long runs of whole surahs.
export const describeRanges = (ranges: Range[]): string => {
  if (ranges.length > 3 && ranges.every(isWhole)) {
    const [first, last] = [ranges[0], ranges[ranges.length - 1]]
    return `${surahName(first.surah)} → ${surahName(last.surah)} (${ranges.length} surahs)`
  }
  return ranges.map((r) => (isWhole(r) ? surahName(r.surah) : `${surahName(r.surah)} ${r.from}–${r.to}`)).join(' · ')
}

export const describeSize = (ranges: Range[]): string => {
  const pages = rangesSize(ranges)
  const first = pageOf({ surah: ranges[0].surah, ayah: ranges[0].from })
  const lastRange = ranges[ranges.length - 1]
  const last = pageOf({ surah: lastRange.surah, ayah: lastRange.to })
  const where = first === last ? `p. ${first}` : `pp. ${Math.min(first, last)}–${Math.max(first, last)}`
  return `${pages.toFixed(1)} pages · ${where}`
}

// The Hifz ranges cut off at the Ayah where memorisation actually ended.
export const hifzUpTo = (hifz: Range[], end: AyahRef): Range[] => {
  const i = hifz.findIndex((r) => r.surah === end.surah)
  return [...hifz.slice(0, i), { ...hifz[i], to: end.ayah }]
}
