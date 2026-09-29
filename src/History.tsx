import { useMemo, useState } from 'react'
import { backupFile, shareBackup } from './backup'
import { localDate, type Day, type Saved } from './day'
import { describeRanges, hifzUpTo } from './format'
import JuzRing from './JuzRing'
import { juzProgress } from './progress'
import RestoreButton from './RestoreButton'

type Props = { saved: Saved; onRestore: (saved: Saved) => void; onBack: () => void }

const dateLabel = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

function DayRow({ day }: { day: Day }) {
  return (
    <li>
      <p className="date">{dateLabel(day.date)}</p>
      {day.hifzEnd && (
        <p>
          <strong>Hifz</strong> {describeRanges(hifzUpTo(day.plan.hifz, day.hifzEnd))}
        </p>
      )}
      {day.rabtDone && (
        <p>
          <strong>Rabt</strong> {describeRanges(day.plan.rabt)}
        </p>
      )}
      {day.murajaDone && (
        <p>
          <strong>Muraja'a</strong> {describeRanges(day.plan.muraja)}
        </p>
      )}
    </li>
  )
}

export default function History({ saved, onRestore, onBack }: Props) {
  const [message, setMessage] = useState('')
  const today = saved.today
  const days = today && (today.hifzEnd || today.rabtDone || today.murajaDone) ? [today, ...saved.history] : saved.history
  const shares = useMemo(() => juzProgress(saved.progress), [saved.progress])
  const complete = shares.filter((s) => s >= 0.995).length

  return (
    <main className="screen">
      <header className="screen-head">
        <h1>History</h1>
        <button className="link" onClick={onBack}>
          Today
        </button>
      </header>
      {message && <p className="notice">{message}</p>}

      <h2 className="section-title">Juz memorised</h2>
      <p className="faded small juz-summary">
        {complete} of 30 complete. Each ring fills as you memorise; Juz 1 is on the right, as the mushaf opens.
      </p>
      <div className="juz-grid">
        {shares.map((share, i) => (
          <JuzRing key={i} juz={i + 1} share={share} />
        ))}
      </div>

      <h2 className="section-title">Logged days</h2>
      {days.length === 0 ? (
        <p className="faded">Days appear here once you tap Done on the Today screen.</p>
      ) : (
        <ul className="days">
          {days.map((day) => (
            <DayRow key={day.date} day={day} />
          ))}
        </ul>
      )}

      <div className="action-bar">
        <div className="row">
          <button className="button primary" onClick={() => shareBackup(backupFile(saved, localDate()))}>
            Back up
          </button>
          <RestoreButton className="button quiet" onRestore={onRestore} onMessage={setMessage} />
        </div>
        <p className="faded small hint">In the share menu, pick Save to Drive.</p>
      </div>
    </main>
  )
}
