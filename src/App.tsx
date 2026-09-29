import { useEffect, useState } from 'react'
import { localDate, startDay, type Day, type Saved } from './day'
import History from './History'
import { changeHifzAmount, finishEstimates } from './pace'
import { DEFAULT_HIFZ_AMOUNT, type Progress } from './plan'
import Setup from './Setup'
import { load, save } from './storage'
import Today from './Today'

// Start today's Day if the date has changed, and remember it. Saving the same state twice is harmless.
const openToday = (saved: Saved | null) => {
  const next = saved ? startDay(saved, localDate()) : null
  if (next && next !== saved) save(next)
  return next
}

export default function App() {
  const [saved, setSaved] = useState<Saved | null>(() => openToday(load()))
  const [screen, setScreen] = useState<'today' | 'setup' | 'history'>('today')

  const update = (next: Saved) => {
    save(next)
    setSaved(next)
  }

  // Coming back to the app on a new date starts a new Day.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      setSaved(openToday)
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  const saveSetup = (progress: Progress) => {
    // New setup replaces today's plan; ticks made today under the old setup are dropped.
    // Setup doesn't show the Hifz amount, so keep the one already chosen.
    const withAmount = { ...progress, hifzAmount: saved?.progress.hifzAmount }
    update(startDay({ version: 1, progress: withAmount, today: null, history: saved?.history ?? [] }, localDate()))
    setScreen('today')
  }

  // A restored Backup may be from an earlier date; start today's Day from it.
  const restore = (backup: Saved) => {
    update(startDay(backup, localDate()))
    setScreen('history')
  }

  if (!saved || screen === 'setup') return <Setup initial={saved?.progress ?? null} onSave={saveSetup} onRestore={restore} />

  if (screen === 'history') {
    return <History saved={saved} onRestore={restore} onBack={() => setScreen('today')} />
  }

  const changeDay = (day: Day) => update({ ...saved, today: day })

  return (
    <Today
      key={saved.today!.date}
      day={saved.today!}
      hifzAmount={saved.progress.hifzAmount ?? DEFAULT_HIFZ_AMOUNT}
      estimates={finishEstimates(saved)}
      onChange={changeDay}
      onChangeAmount={(direction) => update(changeHifzAmount(saved, direction))}
      onEditSetup={() => setScreen('setup')}
      onHistory={() => setScreen('history')}
    />
  )
}
