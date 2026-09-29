import { describe, expect, it } from 'vitest'
import mushaf from './data/mushaf.json'
import qcf from './data/qcf.json'
import qcfFonts from './data/qcf-fonts.json'
import { AYAH_COUNT, ayahAt, pageOf } from './quran'

type Glyph = [number, number, number, number] // code, surah, ayah, kind (0 word, 1 ayah end, 2 quarter)
type QcfLine = string | Glyph[]
const pages = qcf.pages as { f: number; lines: QcfLine[] }[]

// "h40", "b", or "text" — the part of a line's shape both layouts must agree on.
const kind = (line: string | unknown[]) => (typeof line === 'string' ? line : 'text')

describe('QCF4 page data', () => {
  it('names a font for every page, from the pinned package version', () => {
    expect(qcfFonts.version).toBe('1.1.0')
    expect(new Set(pages.map((p) => qcfFonts.fonts[p.f]).filter(Boolean)).size).toBe(qcfFonts.fonts.length)
  })

  it('has 604 pages of 15 lines, and 8 on the first two', () => {
    expect(pages).toHaveLength(604)
    pages.forEach((p, i) => expect(p.lines).toHaveLength(i < 2 ? 8 : 15))
  })

  it('puts surah headers and the bismillah on the same lines as the bundled layout', () => {
    const differ = pages.flatMap((p, i) =>
      p.lines.map(kind).join() === (mushaf.pages[i] as (string | unknown[])[]).map(kind).join() ? [] : [i + 1],
    )
    expect(differ).toEqual([])
  })

  it('lays out page 282, the start of al-Isra, like the reference', () => {
    const lines = pages[281].lines
    expect(lines[0]).toBe('h17')
    expect(lines[1]).toBe('b')
    const line3 = lines[2] as Glyph[]
    expect(line3[0].slice(1, 3)).toEqual([17, 1])
  })

  it('ends every ayah exactly once', () => {
    const ends = pages.flatMap((p) => p.lines.flatMap((l) => (typeof l === 'string' ? [] : l.filter((g) => g[3] === 1))))
    expect(ends).toHaveLength(AYAH_COUNT)
  })

  it('puts every ayah on the same page the plan uses', () => {
    const firstPage = new Map<string, number>()
    pages.forEach((p, i) =>
      p.lines.forEach((l) => {
        if (typeof l !== 'string') for (const [, s, a] of l) if (!firstPage.has(`${s}:${a}`)) firstPage.set(`${s}:${a}`, i + 1)
      }),
    )
    const mismatches = []
    for (let i = 0; i < AYAH_COUNT; i++) {
      const ref = ayahAt(i)
      if (firstPage.get(`${ref.surah}:${ref.ayah}`) !== pageOf(ref)) mismatches.push(`${ref.surah}:${ref.ayah}`)
    }
    expect(mismatches).toEqual([])
  })
})
