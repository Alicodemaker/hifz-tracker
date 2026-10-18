import { useState } from 'react'
import type { Saved } from './day'
import { DEFAULT_MURAJA_PAGES, suggestedHifzStart, type Progress } from './plan'
import Intro from './Intro'
import { MemorisedSurahs, MurajaPagesChoice, NextHifzFields } from './ProgressFields'
import { surahName, type AyahRef } from './quran'
import RestoreButton from './RestoreButton'

type Props = { onStart: (progress: Progress) => void; onRestore: (saved: Saved) => void }

type Step = 'intro' | 'memorised' | 'start'

// The first run: five intro cards on what the app does, then what is memorised and where Hifz starts. Nothing is ticked to begin with.
export default function Setup({ onStart, onRestore }: Props) {
  const [step, setStep] = useState<Step>('intro')
  const [card, setCard] = useState(0) // which of the intro's cards shows
  const [message, setMessage] = useState('')
  const [memorised, setMemorised] = useState<Set<number>>(() => new Set())
  const [next, setNext] = useState<AyahRef>({ surah: 114, ayah: 1 })
  const [suggestedFor, setSuggestedFor] = useState('') // the memorised surahs `next` was last suggested from
  const [murajaPages, setMurajaPages] = useState(DEFAULT_MURAJA_PAGES)

  const go = (to: Step) => {
    // Suggest where Hifz starts from what is ticked, unless that hasn't changed since the last suggestion.
    const key = [...memorised].sort((a, b) => a - b).join(',')
    if (to === 'start' && key !== suggestedFor) {
      setNext(suggestedHifzStart([...memorised]) ?? { surah: 1, ayah: 1 })
      setSuggestedFor(key)
    }
    setStep(to)
    window.scrollTo(0, 0)
  }

  const toggle = (surahs: number[], on: boolean) =>
    setMemorised((prev) => {
      const updated = new Set(prev)
      surahs.forEach((s) => (on ? updated.add(s) : updated.delete(s)))
      return updated
    })

  const nextIsMemorised = memorised.has(next.surah)
  const start = () =>
    onStart({ memorised: [...memorised].sort((a, b) => a - b), hifzNext: next, murajaNext: null, murajaPages })

  if (step === 'intro')
    return (
      <Intro
        card={card}
        onCard={(to) => {
          setCard(to)
          window.scrollTo(0, 0)
        }}
        onDone={() => go('memorised')}
        doneLabel="Set up"
        notice={message && <p className="notice">{message}</p>}
        restore={<RestoreButton className="link" onRestore={onRestore} onMessage={setMessage} />}
      />
    )

  if (step === 'memorised')
    return (
      <main className="screen setup">
        <header className="screen-head">
          <h1>What have you memorised?</h1>
        </header>
        <p className="faded small">Tick the surahs you know by heart. Nothing yet? Just tap Next.</p>
        <MemorisedSurahs memorised={memorised} next={next} onToggle={toggle} />

        <div className="action-bar">
          <div className="row">
            <button className="button quiet" onClick={() => go('intro')}>
              Back
            </button>
            <button className="button primary" onClick={() => go('start')}>
              Next
            </button>
          </div>
        </div>
      </main>
    )

  return (
    <main className="screen setup">
      <header className="screen-head">
        <h1>Where does your Hifz start?</h1>
      </header>
      <p className="faded small">The first ayah you don't know yet.</p>
      <NextHifzFields next={next} onChange={setNext} />
      {nextIsMemorised && <p className="notice alert">{surahName(next.surah)} is ticked as memorised. Choose another surah, or go back.</p>}

      <h2 className="section-title">Muraja'a per day</h2>
      <p className="faded small">How many pages of old surahs to go over each day. You can change it later.</p>
      <MurajaPagesChoice value={murajaPages} onChange={setMurajaPages} />

      <div className="action-bar">
        <div className="row">
          <button className="button quiet" onClick={() => go('memorised')}>
            Back
          </button>
          <button className="button primary" onClick={start} disabled={nextIsMemorised}>
            Start
          </button>
        </div>
      </div>
    </main>
  )
}
