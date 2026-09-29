import { useEffect, useMemo } from 'react'

// Anime-style "kira-kira": sparkles and sakura petals. Small bursts from the tap when one kind is done;
// big adds manga focus lines, a rain of petals and a "ma sha' Allah" when the whole day is done.
type Props = { size: 'small' | 'big'; origin: { x: number; y: number }; onEnd: () => void }

const DURATION = { small: 1100, big: 3200 }
const random = (min: number, max: number) => min + Math.random() * (max - min)

function Sparkle() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 0C11 7 13 9 20 10 13 11 11 13 10 20 9 13 7 11 0 10 7 9 9 7 10 0Z" />
    </svg>
  )
}

export default function Celebration({ size, origin, onEnd }: Props) {
  useEffect(() => {
    const timer = window.setTimeout(onEnd, DURATION[size])
    return () => window.clearTimeout(timer)
  }, [size, onEnd])

  const burst = useMemo(
    () =>
      Array.from({ length: size === 'big' ? 26 : 18 }, (_, i) => {
        const angle = random(0, Math.PI * 2)
        const distance = size === 'big' ? random(90, 220) : random(50, 130)
        return {
          petal: i % 3 === 0,
          style: {
            '--dx': `${Math.cos(angle) * distance}px`,
            '--dy': `${Math.sin(angle) * distance}px`,
            '--spin': `${random(-270, 270)}deg`,
            '--scale': random(0.6, 1.2),
            animationDelay: `${random(0, 120)}ms`,
          } as React.CSSProperties,
        }
      }),
    [size],
  )
  const rain = useMemo(
    () =>
      size === 'big'
        ? Array.from({ length: 34 }, (_, i) => ({
            sparkle: i % 4 === 0,
            style: {
              left: `${random(0, 100)}%`,
              '--sway': `${random(-40, 40)}px`,
              '--spin': `${random(180, 720)}deg`,
              '--scale': random(0.7, 1.3),
              animationDuration: `${random(2000, 2900)}ms`,
              animationDelay: `${random(0, 700)}ms`,
            } as React.CSSProperties,
          }))
        : [],
    [size],
  )

  const at = size === 'big' ? { left: '50%', top: '45%' } : { left: origin.x, top: origin.y }
  return (
    <div className={`celebration ${size}`} aria-hidden="true">
      {size === 'big' && <div className="focus-lines" />}
      <div className="burst" style={at}>
        <span className="flash" />
        {burst.map((p, i) => (
          <span key={i} className={p.petal ? 'petal' : 'sparkle'} style={p.style}>
            {!p.petal && <Sparkle />}
          </span>
        ))}
      </div>
      {rain.map((p, i) => (
        <span key={i} className={`falling ${p.sparkle ? 'sparkle' : 'petal'}`} style={p.style}>
          {p.sparkle && <Sparkle />}
        </span>
      ))}
      {size === 'big' && (
        <p className="cheer" lang="ar">
          ما شاء الله
        </p>
      )}
    </div>
  )
}
