import { describe, expect, it } from 'vitest'
import { planToday, recordDay, type Progress, type Range } from './plan'
import { ayahCount, pageOf, sizeInPages, surahSize } from './quran'

// Memorised an-Nas back to Fussilat; next Hifz is Ghafir 1 (the builder's real state).
const surahs = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i)
const real: Progress = { memorised: surahs(41, 114), hifzNext: { surah: 40, ayah: 1 }, murajaNext: null }

const size = (ranges: Range[]) =>
  ranges.reduce((t, r) => t + sizeInPages({ surah: r.surah, ayah: r.from }, { surah: r.surah, ayah: r.to }), 0)

describe('Hifz', () => {
  it('starts at the next ayah and is about half a page', () => {
    const { hifz } = planToday(real)
    expect(hifz[0]).toMatchObject({ surah: 40, from: 1 })
    expect(hifz).toHaveLength(1)
    expect(size(hifz)).toBeGreaterThan(0.35)
    expect(size(hifz)).toBeLessThan(0.65)
  })

  it('finishes the surah when less than half a page of it would be left', () => {
    // al-Mulk is 30 ayahs over about 2.4 pages; from ayah 20, half a page leaves only a few ayahs.
    const { hifz } = planToday({ ...real, hifzNext: { surah: 67, ayah: 20 } })
    expect(hifz).toEqual([{ surah: 67, from: 20, to: 30 }])
  })

  it('combines short surahs to get close to half a page', () => {
    const { hifz } = planToday({ memorised: surahs(113, 114), hifzNext: { surah: 112, ayah: 1 }, murajaNext: null })
    expect(hifz).toEqual([
      { surah: 112, from: 1, to: 4 }, // al-Ikhlas
      { surah: 111, from: 1, to: 5 }, // al-Masad
    ])
  })
})

describe('Rabt', () => {
  it('is the most recently memorised five pages, ending where memorisation stopped', () => {
    const { rabt } = planToday(real)
    expect(rabt).toHaveLength(1)
    expect(rabt[0]).toMatchObject({ surah: 41, to: 54 }) // the end of Fussilat
    expect(rabt[0].from).toBeGreaterThan(1) // Fussilat is 6 pages, so not all of it
    expect(size(rabt)).toBeCloseTo(5, 0)
  })

  it('includes today-so-far of a surah being memorised, listed in mushaf order', () => {
    const { rabt } = planToday({ ...real, hifzNext: { surah: 40, ayah: 7 } })
    expect(rabt[0]).toEqual({ surah: 40, from: 1, to: 6 }) // Ghafir comes before Fussilat in the mushaf
    expect(rabt[1]).toMatchObject({ surah: 41, to: 54 })
    expect(size(rabt)).toBeCloseTo(5, 0)
  })
})

const isWhole = (r: Range) => r.from === 1 && r.to === ayahCount(r.surah)

describe("Muraja'a", () => {
  it('starts with the first surah fully out of the Rabt, in whole surahs up to ten pages', () => {
    const { muraja } = planToday(real)
    // Fussilat is still partly in the Rabt, so the rotation starts at ash-Shura.
    expect(muraja[0]).toEqual({ surah: 42, from: 1, to: 53 })
    expect(muraja.every(isWhole)).toBe(true)
    expect(size(muraja)).toBeLessThanOrEqual(10)
    const nextSurah = muraja[muraja.length - 1].surah + 1
    expect(size(muraja) + surahSize(nextSurah)).toBeGreaterThan(10)
  })

  it('revises Juz 30 as two fixed halves: an-Naba to al-Layl, then ad-Duha to an-Nas', () => {
    const first = planToday({ ...real, murajaNext: { surah: 78, ayah: 1 } }).muraja
    expect(first.map((r) => r.surah)).toEqual(surahs(78, 92))
    expect(first.every(isWhole)).toBe(true)

    const second = planToday({ ...real, murajaNext: { surah: 93, ayah: 1 } }).muraja
    expect(second.map((r) => r.surah)).toEqual(surahs(93, 114))
  })

  it('splits a surah longer than ten pages into pieces of about ten pages at page boundaries', () => {
    const withKahf: Progress = { ...real, memorised: [18, ...real.memorised] } // al-Kahf: 110 ayahs, over 11 pages
    const first = planToday({ ...withKahf, murajaNext: { surah: 18, ayah: 1 } }).muraja
    expect(first).toHaveLength(1)
    expect(first[0]).toMatchObject({ surah: 18, from: 1 })
    const cut = first[0].to
    expect(cut).toBeLessThan(110)
    expect(pageOf({ surah: 18, ayah: cut + 1 })).not.toBe(pageOf({ surah: 18, ayah: cut })) // cut between pages

    const second = planToday({ ...withKahf, murajaNext: { surah: 18, ayah: cut + 1 } }).muraja
    expect(second[0]).toEqual({ surah: 18, from: cut + 1, to: 110 })
    for (const piece of [first, second]) expect(size(piece)).toBeLessThanOrEqual(10.5)
  })
})


describe('Recording a day', () => {
  it('moves Hifz on to the ayah after where you actually stopped', () => {
    const next = recordDay(real, { hifzEnd: { surah: 40, ayah: 4 } })
    expect(next.hifzNext).toEqual({ surah: 40, ayah: 5 })
    expect(planToday(next).hifz[0]).toMatchObject({ surah: 40, from: 5 })
  })

  it('counts a surah as memorised once its last ayah is done, and moves to the surah before it', () => {
    const start: Progress = { memorised: surahs(113, 114), hifzNext: { surah: 112, ayah: 1 }, murajaNext: null }
    const next = recordDay(start, { hifzEnd: { surah: 111, ayah: 5 } }) // al-Ikhlas and al-Masad
    expect(next.memorised).toEqual(expect.arrayContaining([111, 112, 113, 114]))
    expect(next.hifzNext).toEqual({ surah: 110, ayah: 1 })
  })

  it("starts the next Muraja'a slice right after a fully revised one", () => {
    const today = planToday(real).muraja
    const tomorrow = planToday(recordDay(real, { murajaDone: true })).muraja
    expect(tomorrow[0]).toEqual({ surah: today[today.length - 1].surah + 1, from: 1, to: expect.any(Number) })
  })

  it("repeats the whole Muraja'a slice when it was only partly done", () => {
    const tomorrow = planToday(recordDay(real, { murajaDone: false }))
    expect(tomorrow.muraja).toEqual(planToday(real).muraja)
  })

  it("wraps the Muraja'a round to the start after the last slice", () => {
    const lastSlice: Progress = { ...real, murajaNext: { surah: 93, ayah: 1 } } // ad-Duha to an-Nas
    const next = recordDay(lastSlice, { murajaDone: true })
    expect(planToday(next).muraja[0]).toEqual({ surah: 42, from: 1, to: 53 }) // back to ash-Shura
  })

  it('picks up exactly where it stopped after days with nothing logged (a Gap)', () => {
    const afterGap = recordDay(recordDay(real, {}), {})
    expect(planToday(afterGap)).toEqual(planToday(real))
  })
})

