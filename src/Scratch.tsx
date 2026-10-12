import { useEffect, useRef } from 'react'
import { resetCanvas, watchLinesBox } from './linesBox'

type Props = {
  rootRef: React.RefObject<HTMLElement | null> // the Mushaf page
  draggedRef: React.RefObject<boolean> // set once a drag rubs something away, so that drag isn't also a tap
  paused: boolean // while the pen is on, a drag draws instead
}

const SCRATCH_MIN = 4 // px a finger must travel before it starts rubbing, so a tap reveals nothing

// Hide mode as a scratch card: a canvas over the page covers every word with a blank bar, and dragging
// a finger over it rubs the cover away where the finger passes. It is painted fresh on every visit, and
// again whenever the page's layout changes.
export default function Scratch({ rootRef, draggedRef, paused }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pausedRef = useRef(paused)
  useEffect(() => {
    pausedRef.current = paused
  }, [paused])

  useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!root || !canvas || !ctx) return
    let box: HTMLElement | null = null

    const paint = (current: HTMLElement | null) => {
      box = current
      resetCanvas(canvas, ctx)
      if (!box?.classList.contains('fitted')) return // not laid out yet
      const style = getComputedStyle(root)
      const area = box.getBoundingClientRect()
      const rects = [...box.querySelectorAll('.m-words, .qcf-glyph.word')].flatMap((el) => [...el.getClientRects()])
      ctx.save()
      ctx.beginPath()
      ctx.rect(area.left, area.top, area.width, area.height)
      ctx.clip()
      // Paper over each word, reaching a little beyond it for the vowel marks, then a soft bar through it.
      ctx.fillStyle = style.getPropertyValue('--mushaf-paper')
      for (const r of rects) {
        const [dx, dy] = [r.height * 0.1, r.height * 0.25]
        ctx.fillRect(r.left - dx, r.top - dy, r.width + 2 * dx, r.height + 2 * dy)
      }
      ctx.fillStyle = style.getPropertyValue('--mushaf-blank')
      for (const r of rects) {
        ctx.beginPath()
        ctx.roundRect(r.left, r.top + r.height * 0.32, r.width, r.height * 0.4, r.height * 0.2)
        ctx.fill()
      }
      ctx.restore()
    }
    const stopWatching = watchLinesBox(root, paint)

    let start: { x: number; y: number } | null = null
    let last: { x: number; y: number } | null = null
    const down = (e: PointerEvent) => {
      if (pausedRef.current) return
      draggedRef.current = false
      start = box?.contains(e.target as Node) ? { x: e.clientX, y: e.clientY } : null
      last = null
    }
    const move = (e: PointerEvent) => {
      if (!start || !box) return
      const at = { x: e.clientX, y: e.clientY }
      if (!last) {
        if (Math.hypot(at.x - start.x, at.y - start.y) < SCRATCH_MIN) return
        last = start
      }
      ctx.save()
      ctx.globalCompositeOperation = 'destination-out'
      ctx.lineWidth = parseFloat(getComputedStyle(box).fontSize) * 1.8 // about one printed line
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(last.x, last.y)
      ctx.lineTo(at.x, at.y)
      ctx.stroke()
      ctx.restore()
      last = at
      draggedRef.current = true
    }
    const up = () => {
      start = null
      last = null
    }
    root.addEventListener('pointerdown', down)
    root.addEventListener('pointermove', move)
    root.addEventListener('pointerup', up)
    root.addEventListener('pointercancel', up)

    return () => {
      stopWatching()
      root.removeEventListener('pointerdown', down)
      root.removeEventListener('pointermove', move)
      root.removeEventListener('pointerup', up)
      root.removeEventListener('pointercancel', up)
    }
  }, [rootRef, draggedRef])

  return <canvas ref={canvasRef} className="scratch-cover" aria-hidden="true" />
}
