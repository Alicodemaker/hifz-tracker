import { useState } from 'react'
import { backupFile, shareBackup } from './backup'
import { localDate, type Day, type Saved } from './day'
import { describeRanges, hifzUpTo } from './format'
import RestoreButton from './RestoreButton'

type Props = { saved: Saved; onRestore: (saved: Saved) => void; onBack: () => void }

const dateLabel = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

function DayRow({ day }: { day: Day }) {
  return (
    <li className="card">
      <p className="range">{dateLabel(day.date)}</p>
      {day.hifzEnd && <p className="small">Hifz · {describeRanges(hifzUpTo(day.plan.hifz, day.hifzEnd))}</p>}
      {day.rabtDone && <p className="small">Rabt · {describeRanges(day.plan.rabt)}</p>}
      {day.murajaDone && <p className="small">Muraja'a · {describeRanges(day.plan.muraja)}</p>}
    </li>
  )
}

export default function History({ saved, onRestore, onBack }: Props) {
  const [message, setMessage] = useState('')
  const today = saved.today
  const days = today && (today.hifzEnd || today.rabtDone || today.murajaDone) ? [today, ...saved.history] : saved.history

  return (
    <main className="screen with-action-bar tall">
      <header className="top">
        <h1>History</h1>
        <button className="link" onClick={onBack}>
          Today
        </button>
      </header>
      {message && <p className="notice">{message}</p>}
      {days.length === 0 ? (
        <p className="muted">Nothing logged yet. Days appear here once you tap Done.</p>
      ) : (
        <ul className="days">
          {days.map((day) => (
            <DayRow key={day.date} day={day} />
          ))}
        </ul>
      )}

      <div className="action-bar">
        <div className="two-buttons">
          <button className="primary" onClick={() => shareBackup(backupFile(saved, localDate()))}>
            Back up
          </button>
          <RestoreButton className="secondary" onRestore={onRestore} onMessage={setMessage} />
        </div>
        <p className="muted small hint">Back up opens your share menu: pick Save to Drive.</p>
      </div>
    </main>
  )
}
