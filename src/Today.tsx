import { useState } from 'react'
import type { Day } from './day'
import { describeRanges, describeSize } from './format'
import type { Range } from './plan'
import { type AyahRef, ayahCount } from './quran'

type Props = { day: Day; onChange: (day: Day) => void; onEditSetup: () => void }

// Every Ayah the Hifz could end on: through today's suggestion, up to the end of its last Surah.
const hifzEndChoices = (hifz: Range[]): AyahRef[] => {
  const choices: AyahRef[] = []
  hifz.forEach((r, i) => {
    const to = i === hifz.length - 1 ? ayahCount(r.surah) : r.to
    for (let ayah = r.from; ayah <= to; ayah++) choices.push({ surah: r.surah, ayah })
  })
  return choices
}

// The Hifz ranges cut off at a chosen end Ayah.
const hifzUpTo = (hifz: Range[], end: AyahRef): Range[] => {
  const cut: Range[] = []
  for (const r of hifz) {
    if (r.surah === end.surah) return [...cut, { ...r, to: end.ayah }]
    cut.push(r)
  }
  const last = hifz[hifz.length - 1]
  return [...cut.slice(0, -1), { ...last, to: end.ayah }]
}

export default function Today({ day, onChange, onEditSetup }: Props) {
  const { plan } = day
  const suggestedEnd = plan.hifz.length ? { surah: plan.hifz.at(-1)!.surah, ayah: plan.hifz.at(-1)!.to } : null
  const choices = hifzEndChoices(plan.hifz)
  const hifzDone = day.hifzEnd !== null
  const [draftEnd, setDraft] = useState(suggestedEnd)
  const end = day.hifzEnd ?? draftEnd
  const endIndex = end ? choices.findIndex((c) => c.surah === end.surah && c.ayah === end.ayah) : -1
  const hifzShown = end ? hifzUpTo(plan.hifz, end) : []

  const setDraftEnd = (index: number) => setDraft(choices[index])

  const toggleHifz = () => onChange({ ...day, hifzEnd: hifzDone ? null : end })
  const toggleRabt = () => onChange({ ...day, rabtDone: !day.rabtDone })
  const toggleMuraja = () => onChange({ ...day, murajaDone: !day.murajaDone })

  return (
    <main className="screen with-action-bar tall">
      <header className="top">
        <h1>Today</h1>
        <button className="link" onClick={onEditSetup}>
          Edit setup
        </button>
      </header>

      <section className={`card kind ${hifzDone ? 'done' : ''}`}>
        <h2>Hifz</h2>
        {plan.hifz.length ? (
          <>
            <p className="range">{describeRanges(hifzShown)}</p>
            <p className="muted small">{describeSize(hifzShown)}</p>
            {!hifzDone && (
              <div className="stepper" aria-label="Adjust where today's Hifz ends">
                <button className="secondary" disabled={endIndex <= 0} onClick={() => setDraftEnd(endIndex - 1)} aria-label="One ayah less">
                  −
                </button>
                <span className="muted small">End ayah</span>
                <button
                  className="secondary"
                  disabled={endIndex >= choices.length - 1}
                  onClick={() => setDraftEnd(endIndex + 1)}
                  aria-label="One ayah more"
                >
                  +
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="muted">Nothing new to memorise.</p>
        )}
      </section>

      <section className={`card kind ${day.rabtDone ? 'done' : ''}`}>
        <h2>Rabt</h2>
        {plan.rabt.length ? (
          <>
            <p className="range">{describeRanges(plan.rabt)}</p>
            <p className="muted small">{describeSize(plan.rabt)}</p>
          </>
        ) : (
          <p className="muted">Nothing recent to revise yet.</p>
        )}
      </section>

      <section className={`card kind ${day.murajaDone ? 'done' : ''}`}>
        <h2>Muraja'a</h2>
        {plan.muraja.length ? (
          <>
            <p className="range">{describeRanges(plan.muraja)}</p>
            <p className="muted small">{describeSize(plan.muraja)}</p>
          </>
        ) : (
          <p className="muted">Nothing in the rotation yet.</p>
        )}
      </section>

      <div className="action-bar">
        <div className="done-buttons">
          <button className={hifzDone ? 'primary' : 'secondary'} onClick={toggleHifz} disabled={!plan.hifz.length} aria-pressed={hifzDone}>
            Hifz
          </button>
          <button className={day.rabtDone ? 'primary' : 'secondary'} onClick={toggleRabt} disabled={!plan.rabt.length} aria-pressed={day.rabtDone}>
            Rabt
          </button>
          <button className={day.murajaDone ? 'primary' : 'secondary'} onClick={toggleMuraja} disabled={!plan.muraja.length} aria-pressed={day.murajaDone}>
            Muraja'a
          </button>
        </div>
        <p className="muted small hint">Tap when done. Tap again to undo.</p>
      </div>
    </main>
  )
}
