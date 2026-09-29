import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Kind } from './day'
import type { Range } from './plan'
import { ayahCount, ayahIndex, juzOfAyah, surahArabic, surahName } from './quran'
import QcfLines, { type QcfLine } from './QcfLines'
import { QCF_FONT_COUNT, downloadQcfFonts, loadQcfFont, qcfFontsReady } from './qcfFonts'
import qcfFonts from './data/qcf-fonts.json'
import Rosette from './Rosette'
import SurahBadge from './SurahBadge'

// [surah, ayah, text, 1 if the ayah ends on this line]
type Piece = [number, number, string, number]
// "h<surah>" surah header, "b" bismillah, or the ayah pieces of one printed line.
type Line = string | Piece[]
type MushafData = { bismillah: string; pages: Line[][] }

// The page data is large, so it loads the first time a page opens, then stays in memory.
let cached: MushafData | null = null
const loadMushaf = async (): Promise<MushafData> =>
  (cached ??= (await import('./data/mushaf.json')).default as MushafData)

// The QCF4 page data (ADR-0009) likewise loads only once the exact fonts are on the phone.
type QcfData = { pages: { f: number; lines: QcfLine[] }[] }
let qcfCached: QcfData | null = null
const loadQcf = async (): Promise<QcfData> => (qcfCached ??= (await import('./data/qcf.json')).default as QcfData)

type FontState = 'checking' | 'absent' | 'downloading' | 'failed' | 'ready'
// Remembered across page turns, so the check happens once per app start.
let knownFontState: FontState = 'checking'

type Props = {
  page: number
  arrivedFrom: 'next' | 'prev' | null // which way the last page turn went, for the slide
  portion: Range[] | null
  hiding: boolean
  onToggleHiding: () => void
  onBack: () => void
  onTurn: (page: number) => void
  task: { kind: Kind; done: boolean; onToggle: () => void } | null // the area of Today that opened the page
  reps: { count: number; onCount: (change: 1 | -1) => void } | null // Hifz read-throughs, when opened from Hifz
}

const KIND_NAMES: Record<Kind, string> = { hifz: 'Hifz', rabt: 'Rabt', muraja: "Muraja'a" }

const firstAyah = (lines: Line[]): { surah: number; ayah: number } => {
  for (const line of lines) {
    if (typeof line === 'string') {
      if (line.startsWith('h')) return { surah: Number(line.slice(1)), ayah: 1 }
    } else return { surah: line[0][0], ayah: line[0][1] }
  }
  return { surah: 1, ayah: 1 }
}

// The same, from the QCF4 page data.
const firstQcfAyah = (lines: QcfLine[]): { surah: number; ayah: number } => {
  for (const line of lines) {
    if (typeof line === 'string') {
      if (line.startsWith('h')) return { surah: Number(line.slice(1)), ayah: 1 }
    } else return { surah: line[0][1], ayah: line[0][2] }
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
// At 20px (tighter word spacing, rosettes, heavier ink), most pages have no line wider than this. Sizing to it
// keeps one text size on every page; the few wider lines are narrowed slightly to fit (at most about 12%).
const TYPICAL_WIDEST_AT_BASE = 385
const NO_LINES: Line[] = []

const BISMILLAH_FONT = 0 // QCF4_Hafs_01, the first font in qcf-fonts.json
const SWIPE_MIN = 50 // px of mostly horizontal travel
const BUTTON_FADE_MS = 5_000

export default function MushafPage({ page, arrivedFrom, portion, hiding, onToggleHiding, onBack, onTurn, task, reps }: Props) {
  const [data, setData] = useState<MushafData | null>(cached)
  const [fontSize, setFontSize] = useState<number | null>(null)
  const [centered, setCentered] = useState<Set<number>>(new Set())
  const [squeezed, setSqueezed] = useState<Map<number, number>>(new Map())
  const linesRef = useRef<HTMLDivElement>(null)

  // The exact QCF4 look, once its fonts are downloaded; the bundled font until then (ADR-0009).
  const [fontState, setFontState] = useState<FontState>(knownFontState)
  const [downloaded, setDownloaded] = useState(0)
  const [qcf, setQcf] = useState<QcfData | null>(qcfCached)
  const [pageFontReady, setPageFontReady] = useState(false)
  const setState = (state: FontState) => {
    knownFontState = state
    setFontState(state)
  }
  useEffect(() => {
    if (knownFontState === 'checking') qcfFontsReady().then((ready) => setState(ready ? 'ready' : 'absent'))
  }, [])
  useEffect(() => {
    if (fontState === 'ready' && !qcf) loadQcf().then(setQcf)
  }, [fontState, qcf])
  useEffect(() => {
    if (fontState === 'ready' && qcf)
      // The page's own font, and the first page's, which holds the bismillah glyphs.
      Promise.all([loadQcfFont(qcf.pages[page - 1].f), loadQcfFont(BISMILLAH_FONT)]).then((loaded) => {
        const ready = loaded.every(Boolean)
        setPageFontReady(ready)
        if (!ready) setState('absent') // the downloaded fonts are gone (e.g. storage cleared): offer the download again
      })
  }, [fontState, qcf, page])
  // The bundled layout is only needed while the exact font isn't in use; it is as large as the QCF data.
  const needsBundled = fontState === 'absent' || fontState === 'downloading' || fontState === 'failed'
  useEffect(() => {
    if (needsBundled && !data) loadMushaf().then(setData)
  }, [needsBundled, data])
  const download = () => {
    setState('downloading')
    setDownloaded(0)
    downloadQcfFonts(setDownloaded).then(
      () => setState('ready'),
      () => setState('failed'),
    )
  }
  const qcfPage = fontState === 'ready' && qcf && pageFontReady ? qcf.pages[page - 1] : null

  const lines = data ? data.pages[page - 1] : NO_LINES

  // Fit the font so the widest printed line fills the page width without wrapping.
  useLayoutEffect(() => {
    const box = linesRef.current
    if (!box || !lines.length) return
    const fit = () => {
      const style = getComputedStyle(box)
      const available = box.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) // the text area, inside the padding
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

  // As in a printed mushaf, the next page lies to the left: swipe right (or press ←) to reach it.
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const onTouchStart = (e: React.TouchEvent) => (touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })
  const onTouchEnd = (e: React.TouchEvent) => {
    const from = touchStart.current
    touchStart.current = null
    if (!from) return
    const dx = e.changedTouches[0].clientX - from.x
    const dy = e.changedTouches[0].clientY - from.y
    if (Math.abs(dx) >= SWIPE_MIN && Math.abs(dx) > Math.abs(dy) * 1.5) onTurn(dx > 0 ? page + 1 : page - 1)
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') onTurn(page + 1)
      if (e.key === 'ArrowRight') onTurn(page - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [page, onTurn])

  // Hide mode: every page starts fully hidden each time it is shown; tapping an ayah reveals or hides it.
  // The page remounts on every visit; revealed ayahs also reset when hide mode is switched.
  const scope = String(hiding)
  const [reveals, setReveals] = useState<{ scope: string; keys: Set<string> }>({ scope, keys: new Set() })
  const revealed = reveals.scope === scope ? reveals.keys : new Set<string>()
  const toggleAyah = (key: string) => {
    const keys = new Set(revealed)
    if (!keys.delete(key)) keys.add(key)
    setReveals({ scope, keys })
  }

  // The floating buttons (hide, Done, counter) show and hide together: a tap on the page (not a swipe)
  // shows them and the next tap hides them; they also fade on their own after five seconds.
  // They show when the page is opened, but not after a page turn.
  const [buttonVisible, setButtonVisible] = useState(arrivedFrom === null)
  const fadeTimer = useRef<number | undefined>(undefined)
  const startFadeTimer = () => {
    window.clearTimeout(fadeTimer.current)
    fadeTimer.current = window.setTimeout(() => setButtonVisible(false), BUTTON_FADE_MS)
  }
  const wake = () => {
    setButtonVisible(true)
    startFadeTimer()
  }
  const onPageTap = (e: React.MouseEvent) => {
    const target = e.target as Element
    if (target.closest('button')) return wake() // using a button keeps them all showing
    if (hiding && target.closest('.m-ayah, .qcf-glyph.word')) return // that tap reveals or hides an ayah
    if (!buttonVisible) return wake()
    window.clearTimeout(fadeTimer.current)
    setButtonVisible(false)
  }
  useEffect(() => {
    if (arrivedFrom === null) startFadeTimer()
    return () => window.clearTimeout(fadeTimer.current)
  }, [arrivedFrom]) // fixed for each visit, since the page remounts every time

  const { start, end } = portionMarks(lines, portion)
  const top = qcfPage ? firstQcfAyah(qcfPage.lines) : lines.length ? firstAyah(lines) : null

  return (
    <main
      className="mushaf"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onClick={onPageTap}
    >
      <header className="m-head">
        <button className="back" onClick={onBack} aria-label="Back to Today">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15.5 5l-7 7 7 7" />
          </svg>
        </button>
        <span className="m-page m-label">{page}</span>
        {top && (
          <span className="m-where m-label">
            {surahName(top.surah)} – Juz {juzOfAyah(ayahIndex(top))}
          </span>
        )}
      </header>

      {qcfPage ? (
        <QcfLines
          lines={qcfPage.lines}
          fontFamily={qcfFonts.fonts[qcfPage.f]}
          bismillahFont={qcfFonts.fonts[BISMILLAH_FONT]}
          portion={portion}
          hiding={hiding}
          revealed={revealed}
          onToggleAyah={toggleAyah}
          className={arrivedFrom ? `enter-${arrivedFrom}` : ''}
        />
      ) : (
        <div
          ref={linesRef}
          className={`m-lines ${fontSize ? 'fitted' : ''} ${lines.length < 15 ? 'short' : ''} ${hiding ? 'hiding' : ''} ${arrivedFrom ? `enter-${arrivedFrom}` : ''}`}
          style={
            fontSize
              ? ({ '--quran-size': `${fontSize}px` } as React.CSSProperties)
              : undefined
          }
          lang="ar"
          dir="rtl"
        >
          {lines.map((line, i) => {
            const mark = `${i === start ? 'mark-start' : ''} ${i === end ? 'mark-end' : ''} ${centered.has(i) ? 'center' : ''}`
            if (line === 'b')
              return (
                <div key={i} className={`m-line bismillah ${mark}`}>
                  <span className="basmala" lang="ar">
                    {data?.bismillah}
                  </span>
                </div>
              )
            if (typeof line === 'string')
              return (
                <div key={i} className={`m-line surah-band ${mark}`}>
                  <SurahBadge surah={Number(line.slice(1))} name={surahArabic(Number(line.slice(1)))} glyph={null} />
                </div>
              )
            return (
              <div key={i} className={`m-line ${mark} ${squeezed.has(i) ? 'squeezed' : ''}`}>
                <span className="m-text" style={squeezed.has(i) ? ({ '--squeeze': squeezed.get(i) } as React.CSSProperties) : undefined}>
                  {line.map((piece) => {
                    const [words, marker] = splitMarker(piece)
                    const key = `${piece[0]}:${piece[1]}`
                    return (
                      <span
                        key={key}
                        className={`m-ayah ${revealed.has(key) ? 'revealed' : ''}`}
                        data-ayah={key}
                        onClick={hiding ? () => toggleAyah(key) : undefined}
                      >
                        <span className="m-words">{words}</span>
                        {marker && (
                          <span className="m-marker">
                            {' '}
                            <Rosette ayah={piece[1]} />
                          </span>
                        )}{' '}
                      </span>
                    )
                  })}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Only while the exact font isn't in place; otherwise the text runs to the bottom under the floating button. */}
      {(fontState === 'absent' || fontState === 'downloading' || fontState === 'failed') && (
        <div className="m-foot">
          {fontState === 'absent' && (
            <button className="font-download" onClick={download}>
              Download exact mushaf font (36 MB)
            </button>
          )}
          {fontState === 'downloading' && (
            <p className="font-status">
              Downloading font {downloaded} of {QCF_FONT_COUNT}…
            </p>
          )}
          {fontState === 'failed' && (
            <button className="font-download" onClick={download}>
              Download stopped. Check your connection and tap to resume
            </button>
          )}
        </div>
      )}

      {task && (
        <div className={`page-tools ${buttonVisible ? '' : 'faded-out'}`}>
          <button className={`tool done-tool ${task.done ? 'on' : ''}`} onClick={task.onToggle} aria-pressed={task.done} tabIndex={buttonVisible ? 0 : -1}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
            {KIND_NAMES[task.kind]} done
          </button>
          {reps && (
            <div className="tool rep-tool">
              <button className="rep-less" onClick={() => reps.onCount(-1)} disabled={reps.count === 0} aria-label="One read-through fewer" tabIndex={buttonVisible ? 0 : -1}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 12h12" />
                </svg>
              </button>
              <button className="rep-count" onClick={() => reps.onCount(1)} aria-label={`Read ${reps.count} times. Tap to count one more`} tabIndex={buttonVisible ? 0 : -1}>
                {reps.count}×
              </button>
            </div>
          )}
        </div>
      )}

      <button
        className={`hide-toggle ${buttonVisible ? '' : 'faded-out'} ${hiding ? 'on' : ''}`}
        onClick={onToggleHiding}
        aria-pressed={hiding}
        aria-label={hiding ? 'Show the text' : 'Hide the text'}
        tabIndex={buttonVisible ? 0 : -1}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
          {!hiding && <path d="M4 4l16 16" />}
        </svg>
      </button>
    </main>
  )
}
