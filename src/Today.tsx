import { useState } from 'react'
import type { Day } from './day'
import { arabicNames, describeRanges, describeSize, hifzUpTo } from './format'
import type { Range } from './plan'
import { type AyahRef, ayahCount } from './quran'
import Tick from './Tick'

type Props = { day: Day; onChange: (day: Day) => void; onEditSetup: () => void; onHistory: () => void }

// Every Ayah the Hifz could end on: through today's suggestion, up to the end of its last Surah.
const hifzEndChoices = (hifz: Range[]): AyahRef[] => {
  const choices: AyahRef[] = []
  hifz.forEach((r, i) => {
    const to = i === hifz.length - 1 ? ayahCount(r.surah) : r.to
    for (let ayah = r.from; ayah <= to; ayah++) choices.push({ surah: r.surah, ayah })
  })
  return choices
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

export default function Today({ day, onChange, onEditSetup, onHistory }: Props) {
  const { plan } = day
  const suggestedEnd = plan.hifz.length ? { surah: plan.hifz.at(-1)!.surah, ayah: plan.hifz.at(-1)!.to } : null
  const choices = hifzEndChoices(plan.hifz)
  const hifzDone = day.hifzEnd !== null
  const [draftEnd, setDraft] = useState(suggestedEnd)
  const end = day.hifzEnd ?? draftEnd
  const endIndex = end ? choices.findIndex((c) => c.surah === end.surah && c.ayah === end.ayah) : -1
  const hifzShown = end ? hifzUpTo(plan.hifz, end) : []

  const toggleHifz = () => onChange({ ...day, hifzEnd: hifzDone ? null : end })
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
                {arabicNames(hifzShown)}
              </p>
            </div>
            <p className="range">{describeRanges(hifzShown)}</p>
            <p className="faded small">{describeSize(hifzShown)}</p>
            {!hifzDone && (
              <div className="stepper">
                <button disabled={endIndex <= 0} onClick={() => setDraft(choices[endIndex - 1])} aria-label="End one ayah earlier">
                  −
                </button>
                <span className="faded small">End ayah</span>
                <button
                  disabled={endIndex >= choices.length - 1}
                  onClick={() => setDraft(choices[endIndex + 1])}
                  aria-label="End one ayah later"
                >
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
