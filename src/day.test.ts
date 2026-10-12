import { describe, expect, it } from 'vitest'
import { celebrationFor, startDay, toggleDone, undoNextDay, updateToday, type Saved } from './day'
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

describe('celebrationFor', () => {
  const day = startDay(fresh, '2026-09-29').today!

  it('is small when one kind becomes done and others are left', () => {
    expect(celebrationFor(day, toggleDone(day, 'rabt'))).toBe('small')
  })

  it('is big when the last kind of the day becomes done', () => {
    const two = toggleDone(toggleDone(day, 'hifz'), 'rabt')
    expect(celebrationFor(two, toggleDone(two, 'muraja'))).toBe('big')
  })

  it('counts a kind with nothing planned as done', () => {
    const noMuraja = { ...day, plan: { ...day.plan, muraja: [] } }
    const hifz = toggleDone(noMuraja, 'hifz')
    expect(celebrationFor(hifz, toggleDone(hifz, 'rabt'))).toBe('big')
  })

  it('is nothing for an undo, or for a change that ticks nothing', () => {
    const rabt = toggleDone(day, 'rabt')
    expect(celebrationFor(rabt, toggleDone(rabt, 'rabt'))).toBeNull()
    expect(celebrationFor(day, { ...day })).toBeNull()
  })
})

describe('updateToday', () => {
  const opened = startDay(fresh, '2026-09-29')
  const tick = (saved: Saved, kind: 'hifz' | 'rabt' | 'muraja') => updateToday(saved, toggleDone(saved.today!, kind))
  const two = tick(tick(opened, 'hifz'), 'rabt')

  it('only records the tick while something is left', () => {
    expect(two.today).toEqual(toggleDone(toggleDone(opened.today!, 'hifz'), 'rabt'))
    expect(two.history).toEqual([])
    expect(two.progress).toBe(opened.progress)
  })

  it('logs the day and moves straight on to the next plan once all three are ticked', () => {
    const done = tick(two, 'muraja')
    expect(done.history).toEqual([toggleDone(two.today!, 'muraja')])
    expect(done.progress.hifzNext!.ayah).toBeGreaterThan(1) // past today's Hifz
    expect(done.today).toEqual({
      date: '2026-09-29', // still the same date
      plan: planToday(done.progress),
      hifzEnd: null,
      rabtDone: false,
      murajaDone: false,
    })
    expect(done.today!.plan.hifz[0].from).toBe(done.progress.hifzNext!.ayah)
    expect(done.today!.plan.muraja).not.toEqual(opened.today!.plan.muraja)
  })

  it('counts a kind with nothing planned as done', () => {
    const noMuraja = { ...opened, today: { ...opened.today!, plan: { ...opened.today!.plan, muraja: [] } } }
    const done = tick(tick(noMuraja, 'hifz'), 'rabt')
    expect(done.history).toHaveLength(1)
  })

  it('logs each round on the same date separately', () => {
    const first = tick(two, 'muraja')
    const second = tick(tick(tick(first, 'hifz'), 'rabt'), 'muraja')
    expect(second.history.map((d) => d.date)).toEqual(['2026-09-29', '2026-09-29'])
  })
})

describe('undoNextDay', () => {
  const opened = startDay(fresh, '2026-09-29')
  const tick = (saved: Saved, kind: 'hifz' | 'rabt' | 'muraja') => updateToday(saved, toggleDone(saved.today!, kind))
  const two = tick(tick(opened, 'hifz'), 'rabt')
  const done = tick(two, 'muraja')

  it('brings back the day as it was before the last tick', () => {
    const undone = undoNextDay(done)
    expect(undone.today).toEqual(two.today)
    expect(undone.progress).toEqual(two.progress)
    expect(undone.history).toEqual([])
    expect(undoNextDay(undone)).toBe(undone) // nothing more to undo
  })

  it('is no longer possible once something else is ticked, or the date changes', () => {
    expect(undoNextDay(tick(done, 'rabt'))).toEqual(tick(done, 'rabt'))
    const tomorrow = startDay(done, '2026-09-30')
    expect(undoNextDay(tomorrow)).toBe(tomorrow)
  })
})
