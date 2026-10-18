import TipPicture from './TipPicture'
import TipText from './TipText'
import { TIPS, dismissTip, useTip } from './tips'

// The tip showing now, as a sheet at the bottom of the screen, within thumb reach, with a picture of what it explains.
// A tap outside it closes it too.
export default function TipPopup() {
  const id = useTip()
  const tip = TIPS.find((t) => t.id === id)
  if (!tip) return null
  return (
    <div className="tip-backdrop" onClick={dismissTip}>
      <section
        key={tip.id} // each tip slides in afresh
        className="tip"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tip-title"
        onClick={(e) => e.stopPropagation()}
      >
        <TipPicture id={tip.id} />
        <p className="tip-kicker">Tip</p>
        <h2 id="tip-title">{tip.title}</h2>
        <TipText text={tip.text} />
        <button className="button primary" onClick={dismissTip} autoFocus>
          Got it
        </button>
      </section>
    </div>
  )
}
