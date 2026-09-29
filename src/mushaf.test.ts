// This test reads the shipped font file from disk, so it needs Node types.
/// <reference types="node" />
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import mushaf from './data/mushaf.json'
import { AYAH_COUNT, ayahAt, pageOf } from './quran'

type Piece = [number, number, string, number]
type Line = string | Piece[]
const pages = mushaf.pages as Line[][]

// "h40" header, "b" bismillah, or the ayah keys on the line, e.g. "40:1 40:2 40:3".
const shape = (line: Line) => (typeof line === 'string' ? line : line.map(([s, a]) => `${s}:${a}`).join(' '))

describe('Mushaf data (KFGQPC 15-line Madani layout)', () => {
  it('has 604 pages of 15 lines, and 8 lines on the first two pages', () => {
    expect(pages).toHaveLength(604)
    pages.forEach((lines, i) => expect(lines).toHaveLength(i < 2 ? 8 : 15))
  })

  it('lays out page 1 like the printed mushaf', () => {
    expect(pages[0].map(shape)).toEqual(['h1', '1:1', '1:2', '1:3 1:4', '1:5 1:6', '1:6 1:7', '1:7', '1:7'])
  })

  it('lays out page 467, the start of Ghafir, like the printed mushaf', () => {
    const lines = pages[466].map(shape)
    expect(lines[1]).toBe('39:75')
    expect(lines[2]).toBe('h40')
    expect(lines[3]).toBe('b')
    expect(lines[4]).toBe('40:1 40:2 40:3')
    expect(lines[14]).toBe('40:7')
    // Line 5 ends with غَافِرِ ٱلذَّنۢبِ, the start of ayah 3.
    const line5 = pages[466][4] as Piece[]
    expect(line5[2][2]).toMatch(/^غَافِرِ/)
  })

  it('lays out page 604 with al-Ikhlas, al-Falaq and an-Nas like the printed mushaf', () => {
    expect(pages[603].map(shape)).toEqual([
      'h112', 'b', '112:1 112:2 112:3', '112:4',
      'h113', 'b', '113:1 113:2 113:3', '113:3 113:4', '113:5',
      'h114', 'b', '114:1 114:2 114:3', '114:3 114:4 114:5', '114:5', '114:6',
    ])
  })

  it('marks the end of each ayah exactly once, with its number', () => {
    const ends = pages.flat().flatMap((line) => (typeof line === 'string' ? [] : line.filter((p) => p[3] === 1)))
    expect(ends).toHaveLength(AYAH_COUNT)
    const lastOfFatiha = ends.find(([s, a]) => s === 1 && a === 7)!
    expect(lastOfFatiha[2]).toMatch(/۝٧$/)
  })

  it('puts every ayah on the same page the plan uses', () => {
    const firstPage = new Map<string, number>()
    pages.forEach((lines, i) =>
      lines.forEach((line) => {
        if (typeof line !== 'string') for (const [s, a] of line) if (!firstPage.has(`${s}:${a}`)) firstPage.set(`${s}:${a}`, i + 1)
      }),
    )
    const mismatches = []
    for (let i = 0; i < AYAH_COUNT; i++) {
      const ref = ayahAt(i)
      if (firstPage.get(`${ref.surah}:${ref.ayah}`) !== pageOf(ref)) mismatches.push(`${ref.surah}:${ref.ayah}`)
    }
    expect(mismatches).toEqual([])
  })

  it('ships the KFGQPC font unmodified', () => {
    const font = readFileSync(new URL('../public/fonts/UthmanicHafs-v-3.0.ttf', import.meta.url))
    expect(createHash('sha256').update(font).digest('hex')).toBe('5c47602425fb4190327ab9e1a2e8ed2f53dceaf595d8ccc29ac32b8b209ad398')
  })
})
