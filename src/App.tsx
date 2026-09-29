import { useEffect, useState } from 'react'
import { localDate, startDay, type Day, type Saved } from './day'
import type { Progress } from './plan'
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
  const [editing, setEditing] = useState(false)

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
    update(startDay({ version: 1, progress, today: null, history: saved?.history ?? [] }, localDate()))
    setEditing(false)
  }

  if (!saved || editing) return <Setup initial={saved?.progress ?? null} onSave={saveSetup} />

  const changeDay = (day: Day) => update({ ...saved, today: day })

  return <Today key={saved.today!.date} day={saved.today!} onChange={changeDay} onEditSetup={() => setEditing(true)} />
}
