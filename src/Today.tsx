import { toggleDone, type Day, type Kind } from './day'
import { arabicNames, describeRanges, describeSize } from './format'
import { describeDuration, type FinishEstimates } from './pace'
import type { Range } from './plan'
import { surahName } from './quran'
import Tick from './Tick'

type Props = {
  day: Day
  hifzAmount: number
  estimates: FinishEstimates | null
  onChange: (day: Day) => void
  onChangeAmount: (direction: 1 | -1) => void
  onOpenPage: (kind: Kind, portion: Range[]) => void
  onSettings: () => void
  onHistory: () => void
}

const longDate = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })

function KindLabel({ name, done }: { name: string; done: boolean }) {
  return (
    <h2 className={`kind-label ${done ? 'done' : ''}`}>
      {done && <Tick />}
      {name}
    </h2>
  )
}

type RowProps = { name: string; ranges: Range[]; done: boolean; empty: string; onOpen: (e: React.MouseEvent) => void }

function RevisionRow({ name, ranges, done, empty, onOpen }: RowProps) {
  return (
    <li className={`${ranges.length ? 'opens-page' : ''} ${done ? 'done' : ''}`} onClick={onOpen}>
      <KindLabel name={name} done={done} />
      {ranges.length ? (
        <>
          <p lang="ar" className="arabic">
            {arabicNames(ranges)}
          </p>
          <p className="range">{describeRanges(ranges)}</p>
          <p className="faded small">{describeSize(ranges)}</p>
        </>
      ) : (
        <p className="faded small">{empty}</p>
      )}
    </li>
  )
}

export default function Today({
  day,
  hifzAmount,
  estimates,
  onChange,
  onChangeAmount,
  onOpenPage,
  onSettings,
  onHistory,
}: Props) {
  const { plan } = day
  const hifzDone = day.hifzEnd !== null
  const reps = day.hifzReps ?? 0

  // Tapping an area opens its Mushaf page; its own buttons keep their jobs.
  const openFrom = (kind: Kind, portion: Range[]) => (event: React.MouseEvent) => {
    if (portion.length && !(event.target as Element).closest('button')) onOpenPage(kind, portion)
  }

  const toggle = (kind: Kind) => () => onChange(toggleDone(day, kind))

  return (
    <main className="screen">
      <header className="screen-head">
        <h1 className="date">{longDate(day.date)}</h1>
        <nav>
          <button className="link" onClick={onHistory}>
            History
          </button>
          <button className="link" onClick={onSettings}>
            Settings
          </button>
        </nav>
      </header>

      <section className={`hifz opens-page ${hifzDone ? 'done' : ''}`} onClick={openFrom('hifz', plan.hifz)}>
        <KindLabel name="Hifz" done={hifzDone} />
        {plan.hifz.length ? (
          <>
            <div className="band">
              <p lang="ar" className="arabic">
                {arabicNames(plan.hifz)}
              </p>
            </div>
            <p className="range">{describeRanges(plan.hifz)}</p>
            <p className="faded small">
              {describeSize(plan.hifz)}
              {reps > 0 && `, read ${reps}×`}
            </p>
            {!hifzDone && (
              <div className="stepper">
                <button disabled={hifzAmount <= 0.25} onClick={() => onChangeAmount(-1)} aria-label="Quarter of a page less each day">
                  −
                </button>
                <p className="faded small estimates">
                  {estimates ? (
                    <>
                      {surahName(plan.hifz[0].surah)} in {describeDuration(estimates.surahDays)}
                      <br />
                      Quran in {describeDuration(estimates.quranDays)}
                    </>
                  ) : (
                    'Log a few Hifz days to see your pace'
                  )}
                </p>
                <button disabled={hifzAmount >= 5} onClick={() => onChangeAmount(1)} aria-label="Quarter of a page more each day">
                  +
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="faded empty">Nothing new to memorise.</p>
        )}
      </section>

      <ul className="revision">
        <RevisionRow
          name="Rabt"
          ranges={plan.rabt}
          done={day.rabtDone}
          empty="Nothing recent to revise yet."
          onOpen={openFrom('rabt', plan.rabt)}
        />
        <RevisionRow
          name="Muraja'a"
          ranges={plan.muraja}
          done={day.murajaDone}
          empty="Nothing in the rotation yet."
          onOpen={openFrom('muraja', plan.muraja)}
        />
      </ul>

      <div className="action-bar">
        <div className="row done-buttons">
          <button onClick={toggle('hifz')} disabled={!plan.hifz.length} aria-pressed={hifzDone}>
            Hifz
          </button>
          <button onClick={toggle('rabt')} disabled={!plan.rabt.length} aria-pressed={day.rabtDone}>
            Rabt
          </button>
          <button onClick={toggle('muraja')} disabled={!plan.muraja.length} aria-pressed={day.murajaDone}>
            Muraja'a
          </button>
        </div>
        <p className="faded small hint">Tap when done. Tap again to undo.</p>
      </div>
    </main>
  )
}
