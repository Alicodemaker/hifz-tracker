import { useRef } from 'react'

type Thumb = 'first' | 'last'

type Props = {
  labels: string[] // one per ayah, in reading order, for screen readers
  first: number // index of the first ayah shown
  last: number // index of the last ayah shown
  onChange: (first: number, last: number) => void
}

// Ayah by ayah's range: one tick per ayah, running right to left like the page. The right thumb is the first ayah
// shown and the left thumb the last. A drag anywhere on it moves the nearer thumb, snapping to whole ayahs; when
// both sit on one ayah, the way the finger moves picks the thumb.
export default function StepSlider({ labels, first, last, onChange }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const dragging = useRef<{ thumb: Thumb | null } | null>(null)
  const count = labels.length
  const span = Math.max(count - 1, 1)
  const fromRight = (i: number) => `${(i / span) * 100}%`

  const indexAt = (x: number) => {
    const box = trackRef.current!.getBoundingClientRect()
    return Math.round(Math.min(Math.max((box.right - x) / box.width, 0), 1) * (count - 1))
  }
  const move = (thumb: Thumb, i: number) => {
    const next = thumb === 'first' ? ([Math.min(i, last), last] as const) : ([first, Math.max(i, first)] as const)
    if (next[0] !== first || next[1] !== last) onChange(...next)
  }
  // With both thumbs on one ayah, wait for the finger to move off it to know which one it holds.
  const pick = (i: number): Thumb | null => {
    if (i < first) return 'first'
    if (i > last) return 'last'
    if (first === last) return null
    return i - first < last - i ? 'first' : 'last'
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (count < 2) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const i = indexAt(e.clientX)
    const thumb = pick(i)
    dragging.current = { thumb }
    if (thumb) move(thumb, i)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragging.current
    if (!drag) return
    const i = indexAt(e.clientX)
    drag.thumb ??= i < first ? 'first' : i > last ? 'last' : null
    if (drag.thumb) move(drag.thumb, i)
  }
  const onPointerEnd = () => (dragging.current = null)

  // Arrow keys follow the page: ← moves on to later ayahs, → back to earlier ones.
  const onKeyDown = (thumb: Thumb) => (e: React.KeyboardEvent) => {
    const step = e.key === 'ArrowLeft' ? 1 : e.key === 'ArrowRight' ? -1 : 0
    if (!step) return
    e.preventDefault()
    e.stopPropagation() // not a page turn
    move(thumb, Math.min(Math.max((thumb === 'first' ? first : last) + step, 0), count - 1))
  }

  const thumb = (which: Thumb, i: number) => (
    <span
      className={`thumb ${which}`}
      style={{ right: fromRight(i) }}
      role="slider"
      tabIndex={0}
      aria-label={which === 'first' ? 'First ayah shown' : 'Last ayah shown'}
      aria-valuemin={1}
      aria-valuemax={count}
      aria-valuenow={i + 1}
      aria-valuetext={labels[i]}
      onKeyDown={onKeyDown(which)}
    />
  )

  return (
    <div
      className="step-slider"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onTouchStart={(e) => e.stopPropagation()} // a drag here never turns the page
      onTouchEnd={(e) => e.stopPropagation()}
    >
      <div ref={trackRef} className="track">
        {labels.map((label, i) => (
          <span key={label} className={`tick ${i >= first && i <= last ? 'in' : ''}`} style={{ right: fromRight(i) }} />
        ))}
        <span className="fill" style={{ right: fromRight(first), width: `${((last - first) / span) * 100}%` }} />
        {thumb('last', last)}
        {thumb('first', first)}
      </div>
    </div>
  )
}
