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

describe('Hifz amount', () => {
  it('is half a page when none has been chosen', () => {
    expect(planToday(real).hifz).toEqual(planToday({ ...real, hifzAmount: 0.5 }).hifz)
  })

  it('makes the Hifz about the chosen amount', () => {
    const three = size(planToday({ ...real, hifzAmount: 0.75 }).hifz)
    const one = size(planToday({ ...real, hifzAmount: 1 }).hifz)
    expect(three).toBeGreaterThan(size(planToday(real).hifz))
    expect(three).toBeCloseTo(0.75, 0)
    expect(one).toBeGreaterThan(0.8)
    expect(one).toBeLessThan(1.2)
  })

  it('finishes the surah when less than one amount of it would be left', () => {
    // al-Mulk is about 2.4 pages, so after two pages less than one amount is left.
    const { hifz } = planToday({ ...real, hifzNext: { surah: 67, ayah: 1 }, hifzAmount: 2 })
    expect(hifz[0]).toEqual({ surah: 67, from: 1, to: 30 })
  })
})

// The Rabt rotation for a run of days: each day's Rabt, ticked done.
const rabtDays = (start: Progress, days: number): Range[][] => {
  const seen: Range[][] = []
  let progress = start
  for (let i = 0; i < days; i++) {
    seen.push(planToday(progress).rabt)
    progress = recordDay(progress, { rabtDone: true })
  }
  return seen
}

// Hifz in al-Mulk, the first surah of Juz 29 (al-Mulk to al-Mursalat); everything after it memorised.
const mulk: Progress = { memorised: surahs(68, 114), hifzNext: { surah: 67, ayah: 5 }, murajaNext: null }

describe('Rabt', () => {
  it('is one whole surah, starting at the surah after the one being memorised', () => {
    expect(planToday(mulk).rabt).toEqual([{ surah: 68, from: 1, to: 52 }]) // al-Qalam
    // Ghafir is in Juz 24; Fussilat starts there too, so it is all of it (even its end in Juz 25).
    expect(planToday(real).rabt).toEqual([{ surah: 41, from: 1, to: 54 }])
  })

  it('moves one surah on each day it is ticked, and loops at the end of the juz', () => {
    const days = rabtDays(mulk, 12).map((rabt) => rabt.map((r) => r.surah))
    expect(days).toEqual([[68], [69], [70], [71], [72], [73], [74], [75], [76], [77], [68], [69]])
  })

  it('stays on the same surah when it is not ticked', () => {
    expect(planToday(recordDay(mulk, {})).rabt).toEqual(planToday(mulk).rabt)
  })

  it('starts again after the new surah when Hifz moves to the next surah', () => {
    const later = recordDay(recordDay(mulk, { rabtDone: true }), { rabtDone: true }) // Rabt now at al-Ma'arij
    // Finishing al-Mulk: Hifz moves to at-Tahrim (Juz 28). No memorised surah starts in Juz 28 after it,
    // so the Rabt is the surah just finished.
    const next = recordDay(later, { hifzEnd: { surah: 67, ayah: 30 }, rabtDone: true })
    expect(next.hifzNext).toEqual({ surah: 66, ayah: 1 })
    expect(planToday(next).rabt).toEqual([{ surah: 67, from: 1, to: 30 }])
  })

  it('takes a surah longer than ten pages in pieces of about ten pages, cut at page boundaries', () => {
    // Hifz in al-Isra (Juz 15); al-Kahf (about 11.5 pages) starts in Juz 15 and is memorised.
    const isra: Progress = { memorised: [18, ...surahs(41, 114)], hifzNext: { surah: 17, ayah: 50 }, murajaNext: null }
    const [first, second, third] = rabtDays(isra, 3)
    expect(first).toHaveLength(1)
    expect(first[0]).toMatchObject({ surah: 18, from: 1 })
    expect(size(first)).toBeLessThanOrEqual(10.5)
    expect(pageOf({ surah: 18, ayah: first[0].to + 1 })).not.toBe(pageOf({ surah: 18, ayah: first[0].to }))
    expect(second).toEqual([{ surah: 18, from: first[0].to + 1, to: 110 }])
    expect(third).toEqual(first) // al-Kahf is the only surah in the rotation
  })

  it('is empty when nothing is memorised yet', () => {
    expect(planToday({ memorised: [], hifzNext: { surah: 114, ayah: 1 }, murajaNext: null }).rabt).toEqual([])
  })
})

const isWhole = (r: Range) => r.from === 1 && r.to === ayahCount(r.surah)

describe("Muraja'a", () => {
  it('leaves out every surah in the Rabt rotation, not only today\'s', () => {
    const { muraja } = planToday(mulk)
    expect(muraja[0].surah).toBe(78) // al-Qalam to al-Mursalat (Juz 29) are all Rabt
    for (let day = 0, progress = mulk; day < 6; day++) {
      expect(planToday(progress).muraja.some((r) => r.surah >= 68 && r.surah <= 77)).toBe(false)
      progress = recordDay(progress, { murajaDone: true })
    }
  })

  it('starts with the first surah fully out of the Rabt, in whole surahs up to ten pages', () => {
    const { muraja } = planToday(real)
    // Fussilat is in the Rabt rotation, so the Muraja'a starts at ash-Shura.
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

describe("Muraja'a pages", () => {
  it('is up to ten pages when none has been chosen', () => {
    expect(planToday({ ...real, murajaPages: 10 }).muraja).toEqual(planToday(real).muraja)
  })

  it('fills the chosen number of pages with whole surahs', () => {
    // Starting at short surahs (al-Mulk, Qaf), so none needs splitting.
    for (const [pages, from] of [[5, 67], [15, 50], [20, 50]]) {
      const { muraja } = planToday({ ...real, murajaPages: pages, murajaNext: { surah: from, ayah: 1 } })
      expect(muraja[0].surah).toBe(from)
      expect(muraja.every(isWhole)).toBe(true)
      expect(size(muraja)).toBeLessThanOrEqual(pages)
      const nextSurah = muraja[muraja.length - 1].surah + 1
      expect(size(muraja) + surahSize(nextSurah)).toBeGreaterThan(pages)
    }
  })

  it('splits a surah longer than the chosen pages into pieces of about that size', () => {
    const withKahf: Progress = { ...real, memorised: [18, ...real.memorised], murajaPages: 5 }
    const first = planToday({ ...withKahf, murajaNext: { surah: 18, ayah: 1 } }).muraja
    expect(first).toHaveLength(1)
    expect(size(first)).toBeLessThan(4.5) // al-Kahf (about 11.5 pages) in three pieces, not two
  })

  it('still revises Juz 30 in its two fixed halves', () => {
    const half = planToday({ ...real, murajaPages: 5, murajaNext: { surah: 78, ayah: 1 } }).muraja
    expect(half.map((r) => r.surah)).toEqual(surahs(78, 92))
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

