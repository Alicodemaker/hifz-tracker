// The Mushaf page's lines box (or the zoomed-in ayahs, while they show), for the pen's canvas drawn over it.
// Calls `paint` now and whenever the box is replaced (the exact font taking over), resized, re-fitted,
// scrolled (landscape) or slid in after a page turn. Returns a function that stops watching.
export const watchLinesBox = (root: HTMLElement, paint: (box: HTMLElement | null) => void): (() => void) => {
  let box: HTMLElement | null = null
  const repaint = () => paint(box)
  const resized = new ResizeObserver(repaint)
  const changed = new MutationObserver(repaint)
  const detach = () => {
    box?.removeEventListener('scroll', repaint)
    box?.removeEventListener('animationend', repaint)
    resized.disconnect()
    changed.disconnect()
  }
  const attach = () => {
    const next = root.querySelector<HTMLElement>('.m-focus') ?? root.querySelector<HTMLElement>('.m-lines')
    if (next === box) return
    detach()
    box = next
    if (box) {
      resized.observe(box)
      changed.observe(box, { attributes: true, attributeFilter: ['class', 'style'] })
      box.addEventListener('scroll', repaint)
      box.addEventListener('animationend', repaint)
    }
    repaint()
  }
  const children = new MutationObserver(attach)
  children.observe(root, { childList: true })
  attach()
  document.fonts.ready.then(repaint)
  window.addEventListener('resize', repaint)
  return () => {
    detach()
    children.disconnect()
    window.removeEventListener('resize', repaint)
  }
}

// Size a full-screen canvas to the screen's pixels and clear it.
export const resetCanvas = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
  const dpr = window.devicePixelRatio || 1
  canvas.width = canvas.clientWidth * dpr
  canvas.height = canvas.clientHeight * dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}
