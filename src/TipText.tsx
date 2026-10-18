// A tip's words, in the popup and in the tips from Settings: a paragraph for each line.
export default function TipText({ text }: { text: string }) {
  return (
    <div className="tip-text">
      {text.split('\n').map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
  )
}
