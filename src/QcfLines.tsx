import { useLayoutEffect, useRef, useState } from 'react'
import type { Range } from './plan'
import { ayahCount, surahArabic } from './quran'
import SurahBadge from './SurahBadge'

// [glyph code, surah, ayah, kind: 0 word, 1 ayah end, 2 quarter mark]
export type Glyph = [number, number, number, number]
// "h<surah>" surah header, "b<code>" the bismillah glyph (in the bismillah font), or the glyphs of one printed line.
export type QcfLine = string | Glyph[]

type Props = {
  lines: QcfLine[]
  fontFamily: string
  bismillahFont: string // QCF4_Hafs_01, which holds every printed bismillah glyph
  portion: Range[] | null
  hiding: boolean
  revealed: Set<string>
  onToggleAyah: (key: string) => void
  className: string
}

const BASE_SIZE = 20 // px, used only to measure

// Which lines hold the start and the end of today's portion, for the margin marks.
const portionMarks = (lines: QcfLine[], portion: Range[] | null) => {
  let start = -1
  let end = -1
  if (!portion?.length) return { start, end }
  const first = portion[0]
  const last = portion[portion.length - 1]
  lines.forEach((line, i) => {
    if (typeof line === 'string') return
    if (start < 0 && line.some(([, s, a]) => s === first.surah && a === first.from)) start = i
    if (line.some(([, s, a, kind]) => s === last.surah && a === last.to && kind === 1)) end = i
  })
  return { start, end }
}

// As printed, a short line that ends a surah sits centred; every other line fills the width.
const endsSurah = (line: QcfLine) => {
  if (typeof line === 'string') return false
  const [, surah, ayah, kind] = line[line.length - 1]
  return kind === 1 && ayah === ayahCount(surah)
}

// A page in the exact QCF4 font: every glyph is one word or sign, and each printed line is spread to full width.
export default function QcfLines({ lines, fontFamily, bismillahFont, portion, hiding, revealed, onToggleAyah, className }: Props) {
  const boxRef = useRef<HTMLDivElement>(null)
  const [fontSize, setFontSize] = useState<number | null>(null)
  const [centered, setCentered] = useState<Set<number>>(new Set())

  // Size the font so the widest printed line exactly fills the page width.
  useLayoutEffect(() => {
    const box = boxRef.current
    if (!box) return
    const fit = () => {
      box.classList.add('measuring')
      box.style.setProperty('--quran-size', `${BASE_SIZE}px`)
      const widths = [...box.children].map((el) => (el.classList.contains('qcf-text') ? (el.firstElementChild as HTMLElement).offsetWidth : 0))
      const style = getComputedStyle(box)
      const available = box.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) // the text area, inside the padding
      const widest = Math.max(...widths)
      box.classList.remove('measuring')
      if (widest <= 0) return
      const size = Math.floor(((BASE_SIZE * available) / widest) * 10) / 10
      setFontSize(size)
      setCentered(new Set(widths.flatMap((w, i) => (w > 0 && w < widest * 0.75 && endsSurah(lines[i]) ? [i] : []))))
    }
    document.fonts.ready.then(fit)
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [lines, fontFamily])

  const { start, end } = portionMarks(lines, portion)

  return (
    <div
      ref={boxRef}
      className={`m-lines qcf ${fontSize ? 'fitted' : ''} ${lines.length < 15 ? 'short' : ''} ${hiding ? 'hiding' : ''} ${className}`}
      style={
        {
          '--quran-size': fontSize ? `${fontSize}px` : undefined,
          '--qcf-font': `'${fontFamily}'`,
        } as React.CSSProperties
      }
      lang="ar"
      dir="rtl"
    >
      {lines.map((line, i) => {
        const mark = `${i === start ? 'mark-start' : ''} ${i === end ? 'mark-end' : ''}`
        if (typeof line === 'string' && line.startsWith('b'))
          return (
            <div key={i} className={`m-line bismillah ${mark}`}>
              <span className="basmala qcf-basmala" style={{ fontFamily: `'${bismillahFont}'` }}>
                {String.fromCodePoint(Number(line.slice(1)))}
              </span>
            </div>
          )
        if (typeof line === 'string')
          return (
            <div key={i} className={`m-line surah-band ${mark}`}>
              <SurahBadge name={surahArabic(Number(line.slice(1)))} />
            </div>
          )
        return (
          <div key={i} className={`m-line qcf-text ${mark} ${centered.has(i) ? 'center' : ''}`}>
            <span className="qcf-row">
              {line.map(([code, surah, ayah, kind], k) => {
                const key = `${surah}:${ayah}`
                const isWord = kind === 0
                return (
                  <span
                    key={k}
                    className={`qcf-glyph ${isWord ? 'word' : 'sign'} ${isWord && revealed.has(key) ? 'revealed' : ''}`}
                    data-ayah={key}
                    onClick={hiding && isWord ? () => onToggleAyah(key) : undefined}
                  >
                    {String.fromCodePoint(code)}
                  </span>
                )
              })}
            </span>
          </div>
        )
      })}
    </div>
  )
}
