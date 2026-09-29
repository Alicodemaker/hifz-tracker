// How much of each Juz is memorised, for the Juz rings. Display only; planning never reads it.
import { isMemorised, type Progress } from './plan'
import { AYAH_COUNT, ayahAt, ayahSizeAt, juzOfAyah } from './quran'

export const juzProgress = (progress: Progress): number[] => {
  const total = new Array(30).fill(0)
  const done = new Array(30).fill(0)
  for (let i = 0; i < AYAH_COUNT; i++) {
    const juz = juzOfAyah(i) - 1
    total[juz] += ayahSizeAt(i)
    if (isMemorised(ayahAt(i), progress)) done[juz] += ayahSizeAt(i)
  }
  return done.map((d, j) => d / total[j])
}
