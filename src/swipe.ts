import { useRef } from 'react'

const SWIPE_MIN = 50 // px of mostly horizontal travel, as on the Mushaf page

// Swiping through cards (the intro, the tips): left for the next card, right for the one before. A mostly vertical
// drag is left to scroll the screen.
export function useSwipe(onNext: () => void, onPrev: () => void) {
  const start = useRef<{ x: number; y: number } | null>(null)
  return {
    onTouchStart: (e: React.TouchEvent) => (start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }),
    onTouchEnd: (e: React.TouchEvent) => {
      const from = start.current
      start.current = null
      if (!from) return
      const dx = e.changedTouches[0].clientX - from.x
      const dy = e.changedTouches[0].clientY - from.y
      if (Math.abs(dx) >= SWIPE_MIN && Math.abs(dx) > Math.abs(dy) * 1.5) (dx < 0 ? onNext : onPrev)()
    },
  }
}
