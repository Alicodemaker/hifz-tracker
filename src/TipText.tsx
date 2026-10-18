import type { Tip } from './tips'

// A × in a tip's words is drawn larger and red, like the button it stands for.
const withSymbols = (line: string) =>
  line.split('×').map((part, i) => (
    <span key={i}>
      {i > 0 && <span className="tip-symbol">×</span>}
      {part}
    </span>
  ))

// A tip's words, in the popup and in the tips from Settings: a short paragraph for each line.
export default function TipText({ tip }: { tip: Tip }) {
  return (
    <div className="tip-text">
      {tip.lines.map((line) => (
        <p key={line}>{withSymbols(line)}</p>
      ))}
      {tip.after && <p className="tip-after">{tip.after}</p>}
    </div>
  )
}
