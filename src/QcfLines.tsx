import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Range } from './plan'
import { ayahCount, surahArabic } from './quran'
import { bandSurah } from './bandSurah'
import { portionPins } from './pins'
import { loadQcfNameFont, qcfNameGlyph } from './qcfFonts'
import SurahBadge from './SurahBadge'

// [glyph code, surah, ayah, kind: 0 word, 1 ayah end, 2 quarter mark]
export type Glyph = [number, number, number, number]
// "h<surah>" surah header, "b<code>" the bismillah glyph (in the bismillah font), or the glyphs of one printed line.
export type QcfLine = string | Glyph[]

type Props = {
  page: number
  lines: QcfLine[]
  fontFamily: string
  bismillahFont: string // QCF4_Hafs_01, which holds every printed bismillah glyph
  portion: Range[] | null
  hiding: boolean
  hidden: (key: string) => boolean // whether an ayah shows as a blank shape (hide mode)
  away: (key: string) => boolean // whether an ayah is left blank in its place (ayah by ayah, not reached yet)
  leadSign: string | null // the ayah whose end sign still shows, just before the first ayah shown
  onFontSize?: (size: number) => void // the text size the page fitted, in px; keep it stable
  className: string
}

const BASE_SIZE = 20 // px, used only to measure

// As printed, a short line that ends a surah sits centred; every other line fills the width.
const endsSurah = (line: QcfLine) => {
  if (typeof line === 'string') return false
  const [, surah, ayah, kind] = line[line.length - 1]
  return kind === 1 && ayah === ayahCount(surah)
}

// A page in the exact QCF4 font: every glyph is one word or sign, and each printed line is spread to full width.
export default function QcfLines({ page, lines, fontFamily, bismillahFont, portion, hiding, hidden, away, leadSign, onFontSize, className }: Props) {
  const boxRef = useRef<HTMLDivElement>(null)
  const [fontSize, setFontSize] = useState<number | null>(null)
  const [centered, setCentered] = useState<Set<number>>(new Set())
  const [namesReady, setNamesReady] = useState(false) // the surah-name font, for the banners
  useEffect(() => {
    if (lines.some((line) => typeof line === 'string' && line.startsWith('h'))) loadQcfNameFont().then(setNamesReady)
  }, [lines])

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
      onFontSize?.(size)
      setCentered(new Set(widths.flatMap((w, i) => (w > 0 && w < widest * 0.75 && endsSurah(lines[i]) ? [i] : []))))
    }
    document.fonts.ready.then(fit)
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [lines, fontFamily, onFontSize])

  // Today's portion: pins on the ayah sign before it (or above its first word) and on its last ayah sign.
  const pins = portionPins(
    portion,
    page,
    new Set(lines.flatMap((line) => (typeof line === 'string' ? [] : line.filter(([, , , kind]) => kind === 1).map(([, s, a]) => `${s}:${a}`)))),
  )
  // The first glyph of the portion's first ayah, when the pin goes above it: [line, glyph].
  const startLine = lines.findIndex((line) => typeof line !== 'string' && line.some(([, s, a]) => `${s}:${a}` === pins.startWord))
  const startGlyph = startLine < 0 ? -1 : (lines[startLine] as Glyph[]).findIndex(([, s, a]) => `${s}:${a}` === pins.startWord)

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
        const band = typeof line === 'string' ? bandSurah(lines, i) : null
        const bandAway = band !== null && away(`${band}:1`) ? 'away' : ''
        if (typeof line === 'string' && line.startsWith('b'))
          return (
            <div key={i} className={`m-line bismillah ${bandAway}`}>
              <span className="basmala qcf-basmala" style={{ fontFamily: `'${bismillahFont}'` }}>
                {String.fromCodePoint(Number(line.slice(1)))}
              </span>
            </div>
          )
        if (typeof line === 'string')
          return (
            <div key={i} className={`m-line surah-band ${bandAway}`}>
              <SurahBadge
                surah={Number(line.slice(1))}
                name={surahArabic(Number(line.slice(1)))}
                glyph={namesReady ? qcfNameGlyph(Number(line.slice(1))) : null}
              />
            </div>
          )
        return (
          <div key={i} className={`m-line qcf-text ${centered.has(i) ? 'center' : ''}`}>
            <span className="qcf-row">
              {line.map(([code, surah, ayah, kind], k) => {
                const key = `${surah}:${ayah}`
                const isWord = kind === 0
                const pinned = (kind === 1 && pins.signs.has(key)) || (i === startLine && k === startGlyph)
                return (
                  <span
                    key={k}
                    className={`qcf-glyph ${isWord ? 'word' : 'sign'} ${isWord && hidden(key) ? 'hidden' : ''} ${pinned ? 'pin' : ''} ${away(key) ? 'away' : ''} ${kind === 1 && key === leadSign ? 'lead' : ''}`}
                    data-ayah={key}
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
