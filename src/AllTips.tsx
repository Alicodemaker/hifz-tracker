import { useState } from 'react'
import BackButton from './BackButton'
import CardNav from './CardNav'
import TipPicture from './TipPicture'
import TipText from './TipText'
import { useSwipe } from './swipe'
import { TIPS, resetTips } from './tips'

// Every tip as a card to swipe through, opened from Settings, with a way to have them pop up again.
export default function AllTips({ onBack }: { onBack: () => void }) {
  const [index, setIndex] = useState(0)
  const [reset, setReset] = useState(false)
  const go = (to: number) => {
    setIndex(to)
    window.scrollTo(0, 0)
  }
  const swipe = useSwipe(
    () => index < TIPS.length - 1 && go(index + 1),
    () => index > 0 && go(index - 1),
  )
  const tip = TIPS[index]
  return (
    <main className="screen" {...swipe}>
      <header className="screen-head">
        <div className="title-row">
          <BackButton onClick={onBack} label="Back to Settings" />
          <h1>Tips</h1>
        </div>
      </header>
      <section key={index} className="tip-card card-in">
        <TipPicture id={tip.id} />
        <p className="tip-kicker">
          Tip {index + 1} of {TIPS.length}
        </p>
        <h2>{tip.title}</h2>
        <TipText text={tip.text} />
      </section>

      <CardNav
        count={TIPS.length}
        index={index}
        onIndex={go}
        doneLabel="Done"
        onDone={onBack}
        hint={
          reset ? (
            'Tips will pop up again as you go.'
          ) : (
            <button
              className="link"
              onClick={() => {
                resetTips()
                setReset(true)
              }}
            >
              Pop up again as I go
            </button>
          )
        }
      />
    </main>
  )
}
