import { useLayoutEffect, useRef, useState } from 'react'

type Props = {
  fitKey: string // changes whenever the ayahs shown change, to fit again
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
}

const MIN_SIZE = 14 // px
const MAX_SIZE = 72

// Ayah by ayah, zoomed in: only the ayahs shown so far, as large as fits the page.
export default function AyahFocus({ fitKey, className = '', style, children }: Props) {
  const boxRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const [fitted, setFitted] = useState<string | null>(null)

  useLayoutEffect(() => {
    const box = boxRef.current
    const text = textRef.current
    if (!box || !text) return
    // The largest size at which the text fits the page, found by halving.
    const fit = () => {
      let lo = MIN_SIZE
      let hi = MAX_SIZE
      for (let i = 0; i < 12; i++) {
        const mid = (lo + hi) / 2
        text.style.fontSize = `${mid}px`
        if (text.scrollHeight <= box.clientHeight && text.scrollWidth <= box.clientWidth) lo = mid
        else hi = mid
      }
      text.style.fontSize = `${Math.floor(lo)}px`
      setFitted(fitKey)
    }
    fit()
    document.fonts.ready.then(fit)
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [fitKey])

  return (
    <div ref={boxRef} className={`m-focus ${fitted === fitKey ? 'fitted' : ''} ${className}`} style={style}>
      <div ref={textRef} className="m-focus-text" lang="ar" dir="rtl">
        {children}
      </div>
    </div>
  )
}
