import type { Tip } from './tips'

// A × in a tip's words is drawn larger and red, like the button it stands for.
const withSymbols = (line: string) =>
  line.split('×').map((part, i) => (
    <span key={i}>
      {i > 0 && <span className="tip-symbol">×</span>}
      {part}
    </span>
  ))

// A tip's words, in the popup and in the tips from Settings. With two steps or more, each starts with a gold number
// like the one on its ring in the picture.
export default function TipText({ tip }: { tip: Tip }) {
  const numbered = tip.steps.length > 1
  return (
    <div className="tip-text">
      {tip.text && <p>{tip.text}</p>}
      {numbered ? (
        <ol className="tip-steps">
          {tip.steps.map((step, i) => (
            <li key={step}>
              <span className="tip-number" aria-hidden="true">
                {i + 1}
              </span>
              <span>{withSymbols(step)}</span>
            </li>
          ))}
        </ol>
      ) : (
        tip.steps.map((step) => <p key={step}>{withSymbols(step)}</p>)
      )}
      {tip.after && <p className="tip-after">{tip.after}</p>}
    </div>
  )
}
