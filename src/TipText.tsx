// A tip's words, in the popup and in the tips from Settings: a paragraph for each line, with × drawn larger and red,
// like the button it stands for.
export default function TipText({ text }: { text: string }) {
  return (
    <div className="tip-text">
      {text.split('\n').map((line) => (
        <p key={line}>
          {line.split('×').map((part, i) => (
            <span key={i}>
              {i > 0 && <span className="tip-symbol">×</span>}
              {part}
            </span>
          ))}
        </p>
      ))}
    </div>
  )
}
