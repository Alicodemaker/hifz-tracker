import { useMemo, useState } from 'react'
import BackButton from './BackButton'
import { describeLastBackup } from './backup'
import { localDate, type Day, type Saved } from './day'
import { hifzUpTo } from './format'
import RangeText from './RangeText'
import JuzRing from './JuzRing'
import { juzProgress } from './progress'
import RestoreButton from './RestoreButton'

type Props = { saved: Saved; onBackUp: () => void; onRestore: (saved: Saved) => void; onBack: () => void }

const dateLabel = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

function DayRow({ day }: { day: Day }) {
  return (
    <li>
      <p className="date">{dateLabel(day.date)}</p>
      {day.hifzEnd && (
        <p>
          <strong>Hifz</strong> <RangeText ranges={hifzUpTo(day.plan.hifz, day.hifzEnd)} />
        </p>
      )}
      {day.rabtDone && (
        <p>
          <strong>Rabt</strong> <RangeText ranges={day.plan.rabt} />
        </p>
      )}
      {day.murajaDone && (
        <p>
          <strong>Muraja'a</strong> <RangeText ranges={day.plan.muraja} />
        </p>
      )}
    </li>
  )
}

export default function History({ saved, onBackUp, onRestore, onBack }: Props) {
  const [message, setMessage] = useState('')
  const today = saved.today
  const days = today && (today.hifzEnd || today.rabtDone || today.murajaDone) ? [today, ...saved.history] : saved.history
  const shares = useMemo(() => juzProgress(saved.progress), [saved.progress])
  const complete = shares.filter((s) => s >= 0.995).length

  return (
    <main className="screen">
      <header className="screen-head">
        <div className="title-row">
          <BackButton onClick={onBack} label="Back to Today" />
          <h1>History</h1>
        </div>
      </header>
      {message && <p className="notice">{message}</p>}

      <h2 className="section-title">Backup</h2>
      <p className="faded small backup-why">
        Your progress is saved only on this phone, inside the browser you installed this app from. Clearing that
        browser's data, or losing or replacing the phone, deletes it. A backup file in Google Drive lets you restore
        everything.
      </p>
      <div className="row backup-buttons">
        <button className="button primary" onClick={onBackUp}>
          Back up
        </button>
        <RestoreButton className="button quiet" onRestore={onRestore} onMessage={setMessage} />
      </div>
      <p className="faded small backup-hint">
        {describeLastBackup(saved.lastBackup, localDate())}. In the share menu, pick Save to Drive.
      </p>

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
          {days.map((day, i) => (
            <DayRow key={`${day.date}-${days.length - i}`} day={day} />
          ))}
        </ul>
      )}
    </main>
  )
}
