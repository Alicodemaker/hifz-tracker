import { describe, expect, it } from 'vitest'
import { startDay, type Day, type Saved } from './day'
import { changeHifzAmount, describeDuration, finishEstimates } from './pace'
import { rangesSize, type Progress } from './plan'

// Memorised an-Nas back to Fussilat; next Hifz is Ghafir 1 (the builder's real state).
const progress: Progress = {
  memorised: Array.from({ length: 74 }, (_, i) => 41 + i),
  hifzNext: { surah: 40, ayah: 1 },
  murajaNext: null,
}
const today = '2026-09-29'
const opened = startDay({ version: 1, progress, today: null, history: [] }, today)

// `count` days of history before today, with Hifz done on the days `didHifz` picks.
const withHistory = (count: number, didHifz: (daysAgo: number) => boolean): Saved => {
  const history: Day[] = []
  for (let daysAgo = 1; daysAgo <= count; daysAgo++) {
    const date = new Date(`${today}T12:00:00`)
    date.setDate(date.getDate() - daysAgo)
    const day = startDay(opened, date.toISOString().slice(0, 10)).today!
    history.push({ ...day, rabtDone: true, hifzEnd: didHifz(daysAgo) ? { surah: 40, ayah: 1 } : null })
  }
  return { ...opened, history }
}

describe('changeHifzAmount', () => {
  it("steps the amount by a quarter page and re-plans today's Hifz", () => {
    const bigger = changeHifzAmount(opened, 1)
    expect(bigger.progress.hifzAmount).toBe(0.75)
    expect(rangesSize(bigger.today!.plan.hifz)).toBeGreaterThan(rangesSize(opened.today!.plan.hifz))
    expect(changeHifzAmount(opened, -1).progress.hifzAmount).toBe(0.25)
  })

  it('keeps the amount between a quarter page and five pages', () => {
    expect(changeHifzAmount(changeHifzAmount(opened, -1), -1).progress.hifzAmount).toBe(0.25)
    let saved = opened
    for (let i = 0; i < 30; i++) saved = changeHifzAmount(saved, 1)
    expect(saved.progress.hifzAmount).toBe(5)
  })

  it('keeps the chosen amount for the next day', () => {
    const tomorrow = startDay(changeHifzAmount(opened, 1), '2026-09-30')
    expect(tomorrow.progress.hifzAmount).toBe(0.75)
  })
})

describe('finishEstimates', () => {
  it('assumes Hifz every day until there are four weeks of history', () => {
    const estimate = finishEstimates(withHistory(10, (d) => d % 2 === 0))!
    expect(estimate.fromHistory).toBe(false)
    expect(estimate.hifzDaysPerWeek).toBe(7)
    // Ghafir runs over pages 467–476, about 9.7 pages: about 19 days at half a page a day.
    expect(estimate.surahDays).toBeGreaterThanOrEqual(18)
    expect(estimate.surahDays).toBeLessThanOrEqual(21)
    // About 476 pages are not memorised yet: about 952 days at half a page a day.
    expect(estimate.quranDays).toBeGreaterThan(930)
    expect(estimate.quranDays).toBeLessThan(970)
  })

  it('uses the Hifz days per week from the last four weeks once they exist', () => {
    // Hifz on 5 of every 7 days for five weeks.
    const estimate = finishEstimates(withHistory(35, (d) => d % 7 !== 0 && d % 7 !== 1))!
    const everyDay = finishEstimates(opened)!
    expect(estimate.fromHistory).toBe(true)
    expect(estimate.hifzDaysPerWeek).toBe(5)
    expect(estimate.quranDays / everyDay.quranDays).toBeCloseTo(7 / 5, 1)
  })

  it('shrinks when the Hifz amount grows', () => {
    const half = finishEstimates(opened)!
    const one = finishEstimates(changeHifzAmount(changeHifzAmount(opened, 1), 1))!
    expect(one.quranDays / half.quranDays).toBeCloseTo(0.5, 1)
  })
})

describe('describeDuration', () => {
  it('reads as a friendly duration', () => {
    expect(describeDuration(1)).toBe('about a day')
    expect(describeDuration(5)).toBe('about 5 days')
    expect(describeDuration(21)).toBe('about 3 weeks')
    expect(describeDuration(90)).toBe('about 3 months')
    expect(describeDuration(365)).toBe('about 1 year')
    expect(describeDuration(560)).toBe('about 1½ years') // 1.53 years
    expect(describeDuration(952)).toBe('about 2½ years') // 2.61 years
    expect(describeDuration(1340)).toBe('about 3½ years') // 3.67 years
  })
})
