import type { Day } from './day'
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
  onEditSetup: () => void
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

function RevisionRow({ name, ranges, done, empty }: { name: string; ranges: Range[]; done: boolean; empty: string }) {
  return (
    <li className={done ? 'done' : ''}>
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

export default function Today({ day, hifzAmount, estimates, onChange, onChangeAmount, onEditSetup, onHistory }: Props) {
  const { plan } = day
  const hifzDone = day.hifzEnd !== null
  const planEnd = plan.hifz.length ? { surah: plan.hifz.at(-1)!.surah, ayah: plan.hifz.at(-1)!.to } : null

  const toggleHifz = () => onChange({ ...day, hifzEnd: hifzDone ? null : planEnd })
  const toggleRabt = () => onChange({ ...day, rabtDone: !day.rabtDone })
  const toggleMuraja = () => onChange({ ...day, murajaDone: !day.murajaDone })

  return (
    <main className="screen">
      <header className="screen-head">
        <h1 className="date">{longDate(day.date)}</h1>
        <nav>
          <button className="link" onClick={onHistory}>
            History
          </button>
          <button className="link" onClick={onEditSetup}>
            Setup
          </button>
        </nav>
      </header>

      <section className={`hifz ${hifzDone ? 'done' : ''}`}>
        <KindLabel name="Hifz" done={hifzDone} />
        {plan.hifz.length ? (
          <>
            <div className="band">
              <p lang="ar" className="arabic">
                {arabicNames(plan.hifz)}
              </p>
            </div>
            <p className="range">{describeRanges(plan.hifz)}</p>
            <p className="faded small">{describeSize(plan.hifz)}</p>
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
        <RevisionRow name="Rabt" ranges={plan.rabt} done={day.rabtDone} empty="Nothing recent to revise yet." />
        <RevisionRow name="Muraja'a" ranges={plan.muraja} done={day.murajaDone} empty="Nothing in the rotation yet." />
      </ul>

      <div className="action-bar">
        <div className="row done-buttons">
          <button onClick={toggleHifz} disabled={!plan.hifz.length} aria-pressed={hifzDone}>
            Hifz
          </button>
          <button onClick={toggleRabt} disabled={!plan.rabt.length} aria-pressed={day.rabtDone}>
            Rabt
          </button>
          <button onClick={toggleMuraja} disabled={!plan.muraja.length} aria-pressed={day.murajaDone}>
            Muraja'a
          </button>
        </div>
        <p className="faded small hint">Tap when done. Tap again to undo.</p>
      </div>
    </main>
  )
}
