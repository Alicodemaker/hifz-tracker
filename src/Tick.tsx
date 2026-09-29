// A small circled check, drawn in when something is marked done.
export default function Tick() {
  return (
    <svg className="tick" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="9" />
      <path d="M6 10.5l2.8 2.8L14.2 7.5" />
    </svg>
  )
}
