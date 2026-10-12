import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { Range } from './plan'
import { ayahCount, ayahIndex, juzOfAyah, surahArabic, surahName } from './quran'
import QcfLines, { type QcfLine } from './QcfLines'
import { QCF_FONT_COUNT, downloadQcfFonts, loadQcfFont, qcfFontsReady } from './qcfFonts'
import qcfFonts from './data/qcf-fonts.json'
import AyahFocus from './AyahFocus'
import Drawing from './Drawing'
import { drawingKey, type Stroke } from './drawings'
import PageRating from './PageRating'
import type { Rating } from './ratings'
import Rosette from './Rosette'
import Scratch from './Scratch'
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
  stepping: boolean // opened from Hifz: today's Hifz shows ayah by ayah
  hiding: boolean
  onToggleHiding: () => void
  penOn: boolean
  onTogglePen: () => void
  drawings: Record<string, Stroke[]> | undefined // pen strokes by drawingKey
  onStroke: (key: string, stroke: Stroke) => void
  onClearDrawing: (key: string) => void
  rating: { memorised: number[]; ratings: Partial<Record<number, Rating>> | undefined; onRate: (surah: number, rating: Rating) => void } | null // opened from Muraja'a
  onBack: () => void
  onTurn: (page: number) => void
}

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
const NO_STROKES: Stroke[] = []

const BISMILLAH_FONT = 0 // QCF4_Hafs_01, the first font in qcf-fonts.json
const SWIPE_MIN = 50 // px of mostly horizontal travel
const BUTTON_FADE_MS = 5_000

export default function MushafPage({
  page,
  arrivedFrom,
  portion,
  stepping,
  hiding,
  onToggleHiding,
  penOn,
  onTogglePen,
  drawings,
  onStroke,
  onClearDrawing,
  rating,
  onBack,
  onTurn,
}: Props) {
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
  // In hide mode or with the pen, a drag scratches or draws instead, and the ‹ › buttons turn the page.
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const onTouchStart = (e: React.TouchEvent) => (touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })
  const onTouchEnd = (e: React.TouchEvent) => {
    const from = touchStart.current
    touchStart.current = null
    if (!from || freeDrag) return
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

  // Hide mode is a scratch card over the page (Scratch): every page starts fully covered each time it is shown.
  // The pen draws over the page (Drawing); each page keeps its drawing for each font look.
  const mainRef = useRef<HTMLElement>(null)
  const draggedRef = useRef(false)
  const freeDrag = hiding || penOn
  const inkKey = drawingKey(qcfPage ? 'qcf' : 'bundled', page)
  const strokes = drawings?.[inkKey] ?? NO_STROKES

  // Ayah by ayah, on a page that holds part of today's Hifz: only its first Hifz ayah shows, zoomed in to fill
  // the page, then one more for each "+1 ayah", until the page's last ayah; then the whole page shows as usual.
  // Each visit starts again.
  const pageAyahs = useMemo(() => {
    const keys: string[] = []
    const add = (surah: number, ayah: number) => {
      const key = `${surah}:${ayah}`
      if (keys[keys.length - 1] !== key) keys.push(key)
    }
    if (qcfPage) qcfPage.lines.forEach((line) => typeof line !== 'string' && line.forEach(([, s, a]) => add(s, a)))
    else lines.forEach((line) => typeof line !== 'string' && line.forEach(([s, a]) => add(s, a)))
    return keys
  }, [qcfPage, lines])
  const inHifz = (key: string) => {
    const [surah, ayah] = key.split(':').map(Number)
    return Boolean(portion?.some((r) => r.surah === surah && ayah >= r.from && ayah <= r.to))
  }
  const stepStart = stepping ? pageAyahs.findIndex(inHifz) : -1
  const [stepsTaken, setStepsTaken] = useState(0)
  const stepEnd = stepStart + stepsTaken
  const stepActive = stepStart >= 0 && stepEnd < pageAyahs.length - 1
  const focusKeys = stepActive ? new Set(pageAyahs.slice(stepStart, stepEnd + 1)) : null
  const focusText = () => {
    if (!focusKeys) return null
    if (qcfPage)
      return qcfPage.lines.flatMap((line) =>
        typeof line === 'string'
          ? []
          : line
              .filter(([, s, a]) => focusKeys.has(`${s}:${a}`))
              .flatMap(([code, , , kind], k) => [
                <span key={`${code}-${k}`} className={`qcf-glyph ${kind === 0 ? 'word' : 'sign'}`}>
                  {String.fromCodePoint(code)}
                </span>,
                ' ',
              ]),
      )
    // The bundled font: each ayah's pieces from its lines joined, then its marker.
    const ayahs = new Map<string, { words: string[]; ayah: number; ends: boolean }>()
    for (const line of lines) {
      if (typeof line === 'string') continue
      for (const piece of line) {
        const key = `${piece[0]}:${piece[1]}`
        if (!focusKeys.has(key)) continue
        const [words] = splitMarker(piece)
        const entry = ayahs.get(key) ?? { words: [], ayah: piece[1], ends: false }
        entry.words.push(words)
        entry.ends ||= piece[3] === 1
        ayahs.set(key, entry)
      }
    }
    return [...ayahs].map(([key, { words, ayah, ends }]) => (
      <span key={key} className="m-ayah">
        <span className="m-words">{words.join(' ')}</span>
        {ends && (
          <span className="m-marker">
            {' '}
            <Rosette ayah={ayah} />
          </span>
        )}{' '}
      </span>
    ))
  }

  // Rating, when opened from Muraja'a: the stars at the top right rate the memorised Surahs on this page.
  const [ratingOpen, setRatingOpen] = useState(false)
  const pageSurahs = [...new Set(pageAyahs.map((key) => Number(key.split(':')[0])))]
  const ratableSurahs = rating ? pageSurahs.filter((s) => rating.memorised.includes(s)) : []

  // The floating buttons show and hide together: a tap on the page (not a swipe)
  // shows them and the next tap hides them; they also fade on their own after five seconds.
  // They show when the page is opened, but not after a page turn (unless in hide mode, for the ‹ › buttons).
  const [buttonVisible, setButtonVisible] = useState(arrivedFrom === null || freeDrag)
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
    if (draggedRef.current) return // the end of a scratch or a pen stroke, not a tap
    if (ratingOpen) {
      if (!target.closest('.page-rating')) setRatingOpen(false) // a tap elsewhere closes the rating
      return
    }
    if (!buttonVisible) return wake()
    window.clearTimeout(fadeTimer.current)
    setButtonVisible(false)
  }
  useEffect(() => {
    startFadeTimer() // harmless when they start hidden
    return () => window.clearTimeout(fadeTimer.current)
  }, []) // once per visit, since the page remounts every time

  const { start, end } = portionMarks(lines, portion)
  const top = qcfPage ? firstQcfAyah(qcfPage.lines) : lines.length ? firstAyah(lines) : null

  return (
    <main
      ref={mainRef}
      className={`mushaf ${freeDrag ? 'free-drag' : ''}`}
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
        <span className="m-right">
          {top && (
            <span className="m-where m-label">
              {surahName(top.surah)} – Juz {juzOfAyah(ayahIndex(top))}
            </span>
          )}
          {rating && (
            <button
              className={`rate ${ratingOpen ? 'on' : ''}`}
              onClick={() => setRatingOpen((open) => !open)}
              aria-expanded={ratingOpen}
              aria-label="Rate surahs on this page"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z" />
              </svg>
            </button>
          )}
        </span>
      </header>
      {rating && ratingOpen && (
        <PageRating
          surahs={ratableSurahs}
          ratings={rating.ratings}
          onRate={(surah, choice) => {
            rating.onRate(surah, choice)
            if (ratableSurahs.length === 1) setRatingOpen(false)
          }}
        />
      )}

      {qcfPage ? (
        <QcfLines
          lines={qcfPage.lines}
          fontFamily={qcfFonts.fonts[qcfPage.f]}
          bismillahFont={qcfFonts.fonts[BISMILLAH_FONT]}
          portion={portion}
          hiding={hiding}
          className={`${arrivedFrom ? `enter-${arrivedFrom}` : ''} ${focusKeys ? 'behind-focus' : ''}`}
        />
      ) : (
        <div
          ref={linesRef}
          className={`m-lines ${fontSize ? 'fitted' : ''} ${lines.length < 15 ? 'short' : ''} ${hiding ? 'hiding' : ''} ${arrivedFrom ? `enter-${arrivedFrom}` : ''} ${focusKeys ? 'behind-focus' : ''}`}
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
                        className="m-ayah"
                        data-ayah={key}
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

      {focusKeys && (
        <AyahFocus
          fitKey={`${qcfPage ? 'qcf' : 'bundled'}:${stepEnd}`}
          className={`${qcfPage ? 'qcf' : ''} ${hiding ? 'hiding' : ''}`}
          style={qcfPage ? ({ '--qcf-font': `'${qcfFonts.fonts[qcfPage.f]}'` } as React.CSSProperties) : undefined}
        >
          {focusText()}
        </AyahFocus>
      )}

      {hiding && <Scratch key={`${qcfPage ? 'qcf' : 'bundled'}:${focusKeys ? 'focus' : 'page'}`} rootRef={mainRef} draggedRef={draggedRef} paused={penOn} />}
      {!focusKeys && (penOn || strokes.length > 0) && (
        <Drawing
          key={inkKey}
          rootRef={mainRef}
          strokes={strokes}
          penOn={penOn}
          draggedRef={draggedRef}
          onStroke={(stroke) => onStroke(inkKey, stroke)}
        />
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

      {freeDrag && (
        <div className={`page-turns ${buttonVisible ? '' : 'faded-out'}`}>
          <button onClick={() => onTurn(page + 1)} disabled={page >= 604} aria-label="Next page" tabIndex={buttonVisible ? 0 : -1}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15.5 5l-7 7 7 7" />
            </svg>
          </button>
          <button onClick={() => onTurn(page - 1)} disabled={page <= 1} aria-label="Previous page" tabIndex={buttonVisible ? 0 : -1}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8.5 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {stepActive && (
        <button className={`step-tool ${buttonVisible ? '' : 'faded-out'}`} onClick={() => setStepsTaken((n) => n + 1)} tabIndex={buttonVisible ? 0 : -1}>
          +1 ayah
        </button>
      )}

      {!focusKeys && penOn && strokes.length > 0 && (
        <button
          className={`clear-tool ${buttonVisible ? '' : 'faded-out'}`}
          onClick={() => onClearDrawing(inkKey)}
          aria-label="Clear page"
          tabIndex={buttonVisible ? 0 : -1}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" />
          </svg>
        </button>
      )}

      {!focusKeys && (
        <button
          className={`pen-toggle ${buttonVisible ? '' : 'faded-out'} ${penOn ? 'on' : ''}`}
          onClick={onTogglePen}
          aria-pressed={penOn}
          aria-label={penOn ? 'Stop drawing' : 'Draw on the page'}
          tabIndex={buttonVisible ? 0 : -1}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4.5 19.5l1-4.2L16 4.8a2 2 0 0 1 2.8 0l.4.4a2 2 0 0 1 0 2.8L8.7 18.5z" />
            <path d="M14.2 6.6l3.2 3.2" />
          </svg>
        </button>
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
