// The chevron at the top left of Settings and History that returns to Today.
export default function BackButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button className="back-button" onClick={onClick} aria-label={label}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M15.5 5l-7 7 7 7" />
      </svg>
    </button>
  )
}
