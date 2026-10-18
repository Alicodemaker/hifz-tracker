// The Mushaf page's tool icons, shared with the intro so it shows the very buttons found on the page.

// Ayah by ayah: a magnifying glass on the letter ب, since the mode zooms in on the ayahs.
export function AyahByAyahIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="9.6" cy="9.6" r="8.6" />
      <path className="handle" d="M15.8 15.8L22 22" />
      <text className="letter" x="9.6" y="12.8" textAnchor="middle">
        ب
      </text>
    </svg>
  )
}

export function PenIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4.5 19.5l1-4.2L16 4.8a2 2 0 0 1 2.8 0l.4.4a2 2 0 0 1 0 2.8L8.7 18.5z" />
      <path d="M14.2 6.6l3.2 3.2" />
    </svg>
  )
}

// An eye, struck through while the text shows (the button hides it).
export function EyeIcon({ struck }: { struck: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      {struck && <path d="M4 4l16 16" />}
    </svg>
  )
}
