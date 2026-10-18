import type { ReactNode } from 'react'

type Props = {
  count: number
  index: number
  onIndex: (index: number) => void
  doneLabel: string // the last card's button
  onDone: () => void
  hint?: ReactNode // a line under the buttons
}

// The thumb bar under a run of cards (the intro, the tips): dots for where you are, then Back and Next.
export default function CardNav({ count, index, onIndex, doneLabel, onDone, hint }: Props) {
  const last = index === count - 1
  return (
    <div className="action-bar">
      <div className="intro-dots" role="img" aria-label={`${index + 1} of ${count}`}>
        {Array.from({ length: count }, (_, i) => (
          <span key={i} className={i === index ? 'on' : ''} />
        ))}
      </div>
      <div className="row">
        {index > 0 && (
          <button className="button quiet" onClick={() => onIndex(index - 1)}>
            Back
          </button>
        )}
        <button className="button primary" onClick={last ? onDone : () => onIndex(index + 1)}>
          {last ? doneLabel : 'Next'}
        </button>
      </div>
      {hint && <p className="faded small hint">{hint}</p>}
    </div>
  )
}
