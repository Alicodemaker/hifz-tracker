import { describe, expect, it } from 'vitest'
import { portionPins } from './pins'

// The ayah-end signs printed on page 500 (al-Jathiyah 14–22) and page 499 (1–13).
const page500 = new Set(['45:14', '45:15', '45:16', '45:17', '45:18', '45:19', '45:20', '45:21', '45:22'])
const page499 = new Set(Array.from({ length: 13 }, (_, i) => `45:${i + 1}`))

describe('portionPins', () => {
  it('pins the sign just before the portion and its own last sign', () => {
    expect(portionPins([{ surah: 45, from: 15, to: 18 }], 500, page500)).toEqual({ signs: new Set(['45:14', '45:18']), startWord: null })
  })

  it('pins the first word when the sign before is on the previous page', () => {
    expect(portionPins([{ surah: 45, from: 14, to: 17 }], 500, page500)).toEqual({ signs: new Set(['45:17']), startWord: '45:14' })
  })

  it('pins the first word of a surah', () => {
    expect(portionPins([{ surah: 45, from: 1, to: 5 }], 499, page499)).toEqual({ signs: new Set(['45:5']), startWord: '45:1' })
  })

  it('shows only the pins that fall on the page', () => {
    const portion = [{ surah: 45, from: 10, to: 16 }]
    expect(portionPins(portion, 499, page499)).toEqual({ signs: new Set(['45:9']), startWord: null })
    expect(portionPins(portion, 500, page500)).toEqual({ signs: new Set(['45:16']), startWord: null })
  })

  it('uses the first and last ranges of a portion over several surahs', () => {
    const portion = [
      { surah: 112, from: 1, to: 4 },
      { surah: 113, from: 1, to: 5 },
    ]
    expect(portionPins(portion, 604, new Set(['112:4', '113:5']))).toEqual({ signs: new Set(['113:5']), startWord: '112:1' })
  })

  it('has no pins without a portion', () => {
    expect(portionPins(null, 500, page500)).toEqual({ signs: new Set(), startWord: null })
  })
})
