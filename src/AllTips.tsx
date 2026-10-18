import { useState } from 'react'
import BackButton from './BackButton'
import { TIPS, resetTips } from './tips'

// Every tip in one list, opened from Settings, with a way to have them pop up again.
export default function AllTips({ onBack }: { onBack: () => void }) {
  const [reset, setReset] = useState(false)
  return (
    <main className="screen">
      <header className="screen-head">
        <div className="title-row">
          <BackButton onClick={onBack} label="Back to Settings" />
          <h1>Tips</h1>
        </div>
      </header>
      <p className="faded small tips-intro">Each one pops up once, the first time you use what it explains.</p>
      <ul className="tip-list">
        {TIPS.map((tip) => (
          <li key={tip.id}>
            <h2>{tip.title}</h2>
            <p className="faded">{tip.text}</p>
          </li>
        ))}
      </ul>

      <div className="action-bar">
        <button
          className="button quiet"
          onClick={() => {
            resetTips()
            setReset(true)
          }}
          disabled={reset}
        >
          {reset ? 'Tips will pop up again' : 'Pop up again as I go'}
        </button>
      </div>
    </main>
  )
}
