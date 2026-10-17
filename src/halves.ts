import { sizeInPages } from './quran'

const MOST_UNSPLIT = 5 // ayahs; a page with this many or fewer stays whole

// Where ayah by ayah splits a page's ayahs ("surah:ayah", in reading order) into a first and second half: the index
// the second half starts at, cut where the text is nearest half way. Nothing when there are too few to split.
export const pageHalves = (keys: string[]): number | null => {
  if (keys.length <= MOST_UNSPLIT) return null
  const sizes = keys.map((key) => {
    const [surah, ayah] = key.split(':').map(Number)
    return sizeInPages({ surah, ayah }, { surah, ayah })
  })
  const half = sizes.reduce((t, s) => t + s, 0) / 2
  let best = { at: 1, off: Infinity }
  for (let at = 1, before = 0; at < keys.length; at++) {
    before += sizes[at - 1]
    const off = Math.abs(before - half)
    if (off < best.off) best = { at, off }
  }
  return best.at
}
