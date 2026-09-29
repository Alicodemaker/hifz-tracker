// Quran structure for the 15-line Madani mushaf (ADR-0001), from src/data/quran.json.
import data from './data/quran.json'

export type AyahRef = { surah: number; ayah: number }

export const SURAH_COUNT = 114
export const PAGE_COUNT = 604

// Global index (0-based, mushaf order) of each surah's first ayah.
const firstIndex: number[] = []
let running = 0
for (const s of data.surahs) {
  firstIndex.push(running)
  running += s.ayahs
}
export const AYAH_COUNT = running

export const surahName = (surah: number): string => data.surahs[surah - 1].name
export const ayahCount = (surah: number): number => data.surahs[surah - 1].ayahs

export const ayahIndex = ({ surah, ayah }: AyahRef): number => firstIndex[surah - 1] + ayah - 1

export const pageOf = (ref: AyahRef): number => data.ayahPage[ayahIndex(ref)]

export const juzStartPage = (juz: number): number => {
  const [surah, ayah] = data.juzStarts[juz - 1]
  return pageOf({ surah, ayah })
}

// Size in pages of the ayahs from..to (inclusive, same surah or across surahs in mushaf order).
export const sizeInPages = (from: AyahRef, to: AyahRef): number => {
  let total = 0
  for (let i = ayahIndex(from); i <= ayahIndex(to); i++) total += data.ayahSize[i]
  return total
}

export const surahSize = (surah: number): number =>
  sizeInPages({ surah, ayah: 1 }, { surah, ayah: ayahCount(surah) })

// The Juz a Surah's first Ayah falls in.
export const juzOfSurah = (surah: number): number => {
  const start = ayahIndex({ surah, ayah: 1 })
  let juz = 1
  data.juzStarts.forEach(([s, a], i) => {
    if (ayahIndex({ surah: s, ayah: a }) <= start) juz = i + 1
  })
  return juz
}
