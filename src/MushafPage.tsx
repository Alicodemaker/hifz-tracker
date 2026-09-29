import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Range } from './plan'
import { ayahCount, ayahIndex, juzOfAyah, surahArabic, surahName } from './quran'

// [surah, ayah, text, 1 if the ayah ends on this line]
type Piece = [number, number, string, number]
// "h<surah>" surah header, "b" bismillah, or the ayah pieces of one printed line.
type Line = string | Piece[]
type MushafData = { bismillah: string; pages: Line[][] }

// The page data is large, so it loads the first time a page opens, then stays in memory.
let cached: MushafData | null = null
const loadMushaf = async (): Promise<MushafData> =>
  (cached ??= (await import('./data/mushaf.json')).default as MushafData)

type Props = { page: number; portion: Range[] | null; onBack: () => void }

const firstAyah = (lines: Line[]): { surah: number; ayah: number } => {
  for (const line of lines) {
    if (typeof line === 'string') {
      if (line.startsWith('h')) return { surah: Number(line.slice(1)), ayah: 1 }
    } else return { surah: line[0][0], ayah: line[0][1] }
  }
  return { surah: 1, ayah: 1 }
}

const sameAyah = (piece: Piece, surah: number, ayah: number) => piece[0] === surah && piece[1] === ayah

// Which lines hold the start and the end of today's portion, for the margin marks.
const portionMarks = (lines: Line[], portion: Range[] | null): { start: number; end: number } => {
  let start = -1
  let end = -1
  if (!portion?.length) return { start, end }
  const first = portion[0]
  const last = portion[portion.length - 1]
  lines.forEach((line, i) => {
    if (typeof line === 'string') return
    if (start < 0 && line.some((p) => sameAyah(p, first.surah, first.from))) start = i
    if (line.some((p) => sameAyah(p, last.surah, last.to) && p[3] === 1)) end = i
  })
  return { start, end }
}

// Split a piece into its words and the end-of-ayah sign, so the sign can be tinted.
const splitMarker = (piece: Piece): [string, string] => {
  if (!piece[3]) return [piece[2], '']
  const at = piece[2].lastIndexOf(' ')
  return [piece[2].slice(0, at), piece[2].slice(at + 1)]
}

const BASE_SIZE = 20 // px, used only to measure
// At 20px, 95% of pages have no line wider than this. Sizing to it keeps one text size on every page;
// the few wider lines are narrowed slightly to fit (at most about 10%).
const TYPICAL_WIDEST_AT_BASE = 412
const NO_LINES: Line[] = []

export default function MushafPage({ page, portion, onBack }: Props) {
  const [data, setData] = useState<MushafData | null>(cached)
  const [fontSize, setFontSize] = useState<number | null>(null)
  const [centered, setCentered] = useState<Set<number>>(new Set())
  const [squeezed, setSqueezed] = useState<Map<number, number>>(new Map())
  const linesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!data) loadMushaf().then(setData)
  }, [data])

  const lines = data ? data.pages[page - 1] : NO_LINES

  // Fit the font so the widest printed line fills the page width without wrapping.
  useLayoutEffect(() => {
    const box = linesRef.current
    if (!box || !lines.length) return
    const fit = () => {
      const available = box.clientWidth * 0.97
      const size = Math.floor(((BASE_SIZE * available) / TYPICAL_WIDEST_AT_BASE) * 10) / 10
      // Measure each line's natural width at that size.
      box.classList.add('measuring')
      box.style.setProperty('--quran-size', `${size}px`)
      const widths = [...box.children].map((el) =>
        el.classList.contains('surah-band') ? 0 : (el.querySelector<HTMLElement>('.m-text')?.offsetWidth ?? 0),
      )
      box.classList.remove('measuring')
      setFontSize(size)
      // As printed, a short line that ends a surah sits centred; every other line is justified edge to edge.
      const endsSurah = (i: number) => {
        const line = lines[i]
        if (typeof line === 'string') return false
        const [surah, ayah, , ends] = line[line.length - 1]
        return ends === 1 && ayah === ayahCount(surah)
      }
      setCentered(new Set(widths.flatMap((w, i) => (w > 0 && w < available * 0.75 && endsSurah(i) ? [i] : []))))
      setSqueezed(new Map(widths.flatMap((w, i) => (w > available ? [[i, available / w] as [number, number]] : []))))
    }
    document.fonts.ready.then(fit)
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [lines])

  const { start, end } = portionMarks(lines, portion)
  const top = firstAyah(lines)

  return (
    <main className="mushaf">
      <header className="m-head">
        <button className="back" onClick={onBack} aria-label="Back to Today">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <span className="m-surah">{surahName(top.surah)}</span>
        <span className="m-page">{page}</span>
        <span className="m-juz">Juz {juzOfAyah(ayahIndex(top))}</span>
      </header>

      <div
        ref={linesRef}
        className={`m-lines ${fontSize ? 'fitted' : ''} ${lines.length < 15 ? 'short' : ''}`}
        style={fontSize ? ({ '--quran-size': `${fontSize}px` } as React.CSSProperties) : undefined}
        lang="ar"
        dir="rtl"
      >
        {lines.map((line, i) => {
          const mark = `${i === start ? 'mark-start' : ''} ${i === end ? 'mark-end' : ''} ${centered.has(i) ? 'center' : ''}`
          if (line === 'b')
            return (
              <div key={i} className={`m-line bismillah ${mark}`}>
                <span className="m-text">{data!.bismillah}</span>
              </div>
            )
          if (typeof line === 'string')
            return (
              <div key={i} className={`m-line surah-band ${mark}`}>
                <span className="m-text">سُورَةُ {surahArabic(Number(line.slice(1)))}</span>
              </div>
            )
          return (
            <div key={i} className={`m-line ${mark} ${squeezed.has(i) ? 'squeezed' : ''}`}>
              <span className="m-text" style={squeezed.has(i) ? ({ '--squeeze': squeezed.get(i) } as React.CSSProperties) : undefined}>
                {line.map((piece) => {
                  const [words, marker] = splitMarker(piece)
                  return (
                    <span key={`${piece[0]}:${piece[1]}`} className="m-ayah" data-ayah={`${piece[0]}:${piece[1]}`}>
                      {words}
                      {marker && <span className="m-marker"> {marker}</span>}{' '}
                    </span>
                  )
                })}
              </span>
            </div>
          )
        })}
      </div>

      <p className="m-source">Line layout: KFGQPC 1441H edition</p>
    </main>
  )
}
