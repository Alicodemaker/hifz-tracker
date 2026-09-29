import { describe, expect, it } from 'vitest'
import data from './data/quran.json'
import { AYAH_COUNT, PAGE_COUNT, ayahCount, juzStartPage, pageOf, sizeInPages, surahName, surahSize } from './quran'

describe('Quran data (15-line Madani mushaf)', () => {
  it('has 114 surahs, 6236 ayahs and 604 pages', () => {
    expect(data.surahs).toHaveLength(114)
    expect(AYAH_COUNT).toBe(6236)
    expect(new Set(data.ayahPage).size).toBe(PAGE_COUNT)
    expect(Math.max(...data.ayahPage)).toBe(604)
  })

  it('places known surahs and juz on the right pages', () => {
    expect(juzStartPage(30)).toBe(582)
    expect(pageOf({ surah: 41, ayah: 1 })).toBe(477) // Fussilat
    expect(pageOf({ surah: 40, ayah: 1 })).toBe(467) // Ghafir
    expect(pageOf({ surah: 92, ayah: 21 })).toBe(596) // end of al-Layl shares a page with ad-Duha
    expect(pageOf({ surah: 93, ayah: 1 })).toBe(596) // ad-Duha
    expect(pageOf({ surah: 2, ayah: 255 })).toBe(42)
  })

  it('names surahs and counts their ayahs', () => {
    expect(surahName(40)).toBe('Ghafir')
    expect(ayahCount(40)).toBe(85)
    expect(ayahCount(114)).toBe(6)
  })

  it('makes every page add up to one page', () => {
    const totals = new Map<number, number>()
    data.ayahPage.forEach((p, i) => totals.set(p, (totals.get(p) ?? 0) + data.ayahSize[i]))
    for (const total of totals.values()) expect(total).toBeCloseTo(1, 2)
  })

  it('measures sizes in pages', () => {
    expect(surahSize(2)).toBeCloseTo(48, 1) // al-Baqarah: pages 2–49
    expect(sizeInPages({ surah: 112, ayah: 1 }, { surah: 114, ayah: 6 })).toBeCloseTo(1, 2) // last page
    expect(surahSize(114)).toBeLessThan(0.5)
  })
})
