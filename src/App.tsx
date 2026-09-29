import { useState } from 'react'
import type { Progress } from './plan'
import Setup from './Setup'
import { load, save } from './storage'

export default function App() {
  const [progress, setProgress] = useState<Progress | null>(() => load()?.progress ?? null)
  const [editing, setEditing] = useState(false)

  const saveProgress = (next: Progress) => {
    save({ version: 1, progress: next })
    setProgress(next)
    setEditing(false)
  }

  if (!progress || editing) return <Setup initial={progress} onSave={saveProgress} />

  return (
    <main className="screen">
      <h1>Hifz Tracker</h1>
      <p className="muted">Setup saved. The Today screen arrives in the next step.</p>
      <button className="secondary" onClick={() => setEditing(true)}>
        Edit setup
      </button>
    </main>
  )
}
