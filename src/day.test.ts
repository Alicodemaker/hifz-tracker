import { describe, expect, it } from 'vitest'
import { startDay, type Saved } from './day'
import { planToday, type Progress } from './plan'

const progress: Progress = {
  memorised: Array.from({ length: 74 }, (_, i) => 41 + i), // an-Nas back to Fussilat
  hifzNext: { surah: 40, ayah: 1 },
  murajaNext: null,
}
const fresh: Saved = { version: 1, progress, today: null, history: [] }

describe('startDay', () => {
  it("opens a new day with today's plan and nothing done", () => {
    const saved = startDay(fresh, '2026-09-29')
    expect(saved.today).toEqual({
      date: '2026-09-29',
      plan: planToday(progress),
      hifzEnd: null,
      rabtDone: false,
      murajaDone: false,
    })
  })

  it('keeps the same day, and its taps, when opened again on the same date', () => {
    const opened = startDay(fresh, '2026-09-29')
    const tapped = { ...opened, today: { ...opened.today!, rabtDone: true } }
    expect(startDay(tapped, '2026-09-29')).toBe(tapped)
  })

  it("moves progress on from yesterday's taps and keeps yesterday in the history", () => {
    const opened = startDay(fresh, '2026-09-29')
    const yesterday = { ...opened.today!, hifzEnd: { surah: 40, ayah: 5 }, rabtDone: true, murajaDone: true }
    const saved = startDay({ ...opened, today: yesterday }, '2026-09-30')
    expect(saved.progress.hifzNext).toEqual({ surah: 40, ayah: 6 })
    expect(saved.today!.plan.hifz[0]).toMatchObject({ surah: 40, from: 6 })
    expect(saved.today!.plan.muraja[0].surah).toBe(43) // ash-Shura was revised, az-Zukhruf is next
    expect(saved.history).toEqual([yesterday])
  })

  it('repeats the same plan after days with nothing done, without adding them to the history', () => {
    const opened = startDay(fresh, '2026-09-29')
    const saved = startDay(opened, '2026-10-03')
    expect(saved.today!.plan).toEqual(opened.today!.plan)
    expect(saved.history).toEqual([])
  })

  it("repeats the Muraja'a slice when it was not ticked, even if Hifz was", () => {
    const opened = startDay(fresh, '2026-09-29')
    const yesterday = { ...opened.today!, hifzEnd: { surah: 40, ayah: 5 } }
    const saved = startDay({ ...opened, today: yesterday }, '2026-09-30')
    expect(saved.today!.plan.muraja).toEqual(opened.today!.plan.muraja)
  })
})
