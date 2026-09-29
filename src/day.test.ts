import { describe, expect, it } from 'vitest'
import { countRep, startDay, toggleDone, type Saved } from './day'
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

describe('toggleDone', () => {
  const day = startDay(fresh, '2026-09-29').today!

  it("ticks Hifz as done up to the end of today's Hifz, and back", () => {
    const done = toggleDone(day, 'hifz')
    expect(done.hifzEnd).toEqual({ surah: 40, ayah: day.plan.hifz.at(-1)!.to })
    expect(toggleDone(done, 'hifz').hifzEnd).toBeNull()
  })

  it("ticks Rabt and Muraja'a, and back", () => {
    expect(toggleDone(day, 'rabt').rabtDone).toBe(true)
    expect(toggleDone(toggleDone(day, 'rabt'), 'rabt').rabtDone).toBe(false)
    expect(toggleDone(day, 'muraja').murajaDone).toBe(true)
  })
})

describe('countRep', () => {
  const day = startDay(fresh, '2026-09-29').today!

  it('counts Hifz repetitions up and down from none, never below none', () => {
    expect(day.hifzReps ?? 0).toBe(0)
    const twice = countRep(countRep(day, 1), 1)
    expect(twice.hifzReps).toBe(2)
    expect(countRep(twice, -1).hifzReps).toBe(1)
    expect(countRep(day, -1).hifzReps).toBe(0)
  })

  it('starts each new day at none', () => {
    const counted = { ...fresh, today: countRep(day, 1) }
    expect(startDay(counted, '2026-09-30').today!.hifzReps ?? 0).toBe(0)
  })
})
