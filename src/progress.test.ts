import { describe, expect, it } from 'vitest'
import { juzProgress } from './progress'

const real = {
  memorised: Array.from({ length: 74 }, (_, i) => 41 + i), // an-Nas back to Fussilat
  hifzNext: { surah: 40, ayah: 1 },
  murajaNext: null,
}

describe('juzProgress', () => {
  it('gives each of the 30 juz the share of it that is memorised', () => {
    const shares = juzProgress(real)
    expect(shares).toHaveLength(30)
    expect(shares[29]).toBeCloseTo(1, 2) // Juz 30
    expect(shares[24]).toBeCloseTo(1, 2) // Juz 25 starts inside Fussilat
    expect(shares[0]).toBe(0)
    expect(shares[23]).toBeGreaterThan(0.15) // Juz 24 ends with the first pages of Fussilat
    expect(shares[23]).toBeLessThan(0.4)
  })

  it('counts the memorised part of the surah being learnt', () => {
    const shares = juzProgress({ ...real, hifzNext: { surah: 40, ayah: 30 } })
    expect(shares[23]).toBeGreaterThan(juzProgress(real)[23])
  })
})
