import { describe, expect, it } from 'vitest'
import { startDay, type Saved } from './day'
import { ratingGroups, setRating } from './ratings'

const base: Saved = {
  version: 1,
  progress: { memorised: [114, 113, 112, 67], hifzNext: { surah: 66, ayah: 1 }, murajaNext: null },
  today: null,
  history: [],
}

describe('setRating', () => {
  it('rates a Surah, and the same rating again clears it', () => {
    const rated = setRating(base, 67, 'strong')
    expect(rated.ratings).toEqual({ 67: 'strong' })
    expect(setRating(rated, 67, 'holes').ratings).toEqual({ 67: 'holes' })
    expect(setRating(rated, 67, 'strong').ratings).toEqual({})
  })

  it('keeps ratings when a new Day starts', () => {
    const rated = setRating(base, 67, 'weak')
    expect(startDay(rated, '2026-10-12').ratings).toEqual({ 67: 'weak' })
  })
})

describe('ratingGroups', () => {
  it('groups memorised Surahs strongest first, unrated last, each in Mushaf order', () => {
    let saved = setRating(base, 114, 'weak')
    saved = setRating(saved, 67, 'strong')
    saved = setRating(saved, 113, 'strong')
    saved = setRating(saved, 2, 'holes') // not memorised: not listed
    expect(ratingGroups(saved)).toEqual([
      { rating: 'strong', surahs: [67, 113] },
      { rating: 'weak', surahs: [114] },
      { rating: null, surahs: [112] },
    ])
  })
})
