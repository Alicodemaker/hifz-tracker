import { describe, expect, it } from 'vitest'
import { pageHalves } from './halves'

const keys = (surah: number, from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => `${surah}:${from + i}`)

describe('pageHalves', () => {
  it('does not split five ayahs or fewer', () => {
    expect(pageHalves(keys(45, 33, 37))).toBeNull()
    expect(pageHalves(keys(45, 33, 33))).toBeNull()
  })

  it('splits six or more where the text is nearest half way, so both halves have ayahs', () => {
    const page501 = keys(45, 23, 32) // al-Jathiyah 23–32
    const at = pageHalves(page501)!
    expect(at).toBeGreaterThan(0)
    expect(at).toBeLessThan(page501.length)
  })

  it('weighs the ayahs by length, not by count', () => {
    // al-Baqarah 282, the longest ayah, against five short ones: it is a half on its own.
    expect(pageHalves(['2:282', '2:283', '2:284', '2:285', '2:286', '3:1'])).toBe(1)
  })
})
