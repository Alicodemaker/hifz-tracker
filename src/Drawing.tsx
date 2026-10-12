import { useEffect, useRef } from 'react'
import type { Stroke } from './drawings'
import { resetCanvas, watchLinesBox } from './linesBox'

type Props = {
  rootRef: React.RefObject<HTMLElement | null> // the Mushaf page
  strokes: Stroke[] // this page's saved drawing
  penOn: boolean
  draggedRef: React.RefObject<boolean> // set once a drag draws, so that drag isn't also a tap
  onStroke: (stroke: Stroke) => void
}

const DRAW_MIN = 4 // px a finger must travel before it starts drawing, so a tap leaves no mark
const POINT_MIN = 2 // px between kept points

// Red pen marks over the page, for weak spots. Points are kept as shares of the lines box (its width, and
// its full scrolling height), so a drawing stays on its words when the page is shown again.
export default function Drawing({ rootRef, strokes, penOn, draggedRef, onStroke }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const boxRef = useRef<HTMLElement | null>(null)
  const strokesRef = useRef(strokes)
  const penRef = useRef(penOn)
  const onStrokeRef = useRef(onStroke)
  const paintRef = useRef<() => void>(() => {})
  useEffect(() => {
    strokesRef.current = strokes
    penRef.current = penOn
    onStrokeRef.current = onStroke
    paintRef.current()
  }, [strokes, penOn, onStroke])

  useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!root || !canvas || !ctx) return

    const toScreen = (box: HTMLElement, x: number, y: number) => {
      const area = box.getBoundingClientRect()
      return [area.left + x * box.clientWidth, area.top + y * box.scrollHeight - box.scrollTop]
    }
    const toShare = (box: HTMLElement, x: number, y: number) => {
      const area = box.getBoundingClientRect()
      return [(x - area.left) / box.clientWidth, (y - area.top + box.scrollTop) / box.scrollHeight]
    }
    const pen = (box: HTMLElement) => {
      ctx.strokeStyle = getComputedStyle(root).getPropertyValue('--mushaf-pen')
      ctx.lineWidth = Math.max(2, parseFloat(getComputedStyle(box).fontSize) * 0.15)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }

    const paint = () => {
      const box = boxRef.current
      resetCanvas(canvas, ctx)
      if (!box?.classList.contains('fitted')) return // not laid out yet
      const area = box.getBoundingClientRect()
      ctx.save()
      ctx.beginPath()
      ctx.rect(area.left, area.top, area.width, area.height)
      ctx.clip()
      pen(box)
      for (const stroke of strokesRef.current) {
        ctx.beginPath()
        for (let i = 0; i < stroke.length; i += 2) {
          const [x, y] = toScreen(box, stroke[i], stroke[i + 1])
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }
      ctx.restore()
    }
    paintRef.current = paint
    const stopWatching = watchLinesBox(root, (box) => {
      boxRef.current = box
      paint()
    })

    let start: { x: number; y: number } | null = null
    let last: { x: number; y: number } | null = null
    let points: number[] = []
    const down = (e: PointerEvent) => {
      const box = boxRef.current
      if (!penRef.current || !box) return
      draggedRef.current = false
      start = box.contains(e.target as Node) ? { x: e.clientX, y: e.clientY } : null
      last = null
      points = []
    }
    const move = (e: PointerEvent) => {
      const box = boxRef.current
      if (!start || !box) return
      const at = { x: e.clientX, y: e.clientY }
      if (!last) {
        if (Math.hypot(at.x - start.x, at.y - start.y) < DRAW_MIN) return
        last = start
        points.push(...toShare(box, start.x, start.y))
      } else if (Math.hypot(at.x - last.x, at.y - last.y) < POINT_MIN) return
      ctx.save()
      pen(box)
      ctx.beginPath()
      ctx.moveTo(last.x, last.y)
      ctx.lineTo(at.x, at.y)
      ctx.stroke()
      ctx.restore()
      points.push(...toShare(box, at.x, at.y))
      last = at
      draggedRef.current = true
    }
    const up = () => {
      if (points.length >= 4) onStrokeRef.current(points.map((n) => Math.round(n * 10000) / 10000))
      start = null
      last = null
      points = []
    }
    root.addEventListener('pointerdown', down)
    root.addEventListener('pointermove', move)
    root.addEventListener('pointerup', up)
    root.addEventListener('pointercancel', up)

    return () => {
      stopWatching()
      paintRef.current = () => {}
      root.removeEventListener('pointerdown', down)
      root.removeEventListener('pointermove', move)
      root.removeEventListener('pointerup', up)
      root.removeEventListener('pointercancel', up)
    }
  }, [rootRef, draggedRef])

  return <canvas ref={canvasRef} className="drawing-ink" aria-hidden="true" />
}
