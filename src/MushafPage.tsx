import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { Range } from './plan'
import { ayahCount, ayahIndex, juzOfAyah, surahArabic, surahName } from './quran'
import { bandSurah } from './bandSurah'
import QcfLines, { type QcfLine } from './QcfLines'
import { QCF_FONT_COUNT, downloadQcfFonts, loadQcfFont, qcfFontsReady } from './qcfFonts'
import qcfFonts from './data/qcf-fonts.json'
import AyahFocus from './AyahFocus'
import Drawing from './Drawing'
import { drawingKey, type Stroke } from './drawings'
import { pageHalves } from './halves'
import PageRating from './PageRating'
import { portionPins } from './pins'
import { tipOnce } from './tips'
import { RATINGS, type Rating } from './ratings'
import Stars from './Stars'
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

// Ayah by ayah on one page: whether it starts from the second half, and the "+ ayah" taps from each start.
export type PageSteps = { half: 0 | 1; taken: [number, number] }
const FRESH_STEPS: PageSteps = { half: 0, taken: [0, 0] }

type Props = {
  page: number
  arrivedFrom: 'next' | 'prev' | null // which way the last page turn went, for the slide
  pageBounds: { first: number; last: number } // the pages it may turn to (opened from Hifz: the Hifz Surah's)
  portion: Range[] | null
  steps: PageSteps | null | undefined // ayah by ayah on this page: off (null), or not switched either way yet
  stepsByDefault: boolean // opened from Hifz: pages holding part of today's Hifz start ayah by ayah
  onSteps: (steps: PageSteps | null) => void
  hiding: boolean
  onToggleHiding: () => void
  penOn: boolean
  onTogglePen: () => void
  drawings: Record<string, Stroke[]> | undefined // pen strokes by drawingKey
  onStroke: (key: string, stroke: Stroke) => void
  onClearDrawing: (key: string) => void
  // Opened from Rabt or Muraja'a. `reminded`: Surahs whose rating already opened by itself since opening from Today.
  rating: {
    memorised: number[]
    ratings: Partial<Record<number, Rating>> | undefined
    onRate: (surah: number, rating: Rating) => void
    reminded: number[]
    onReminded: (surahs: number[]) => void
  } | null
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


// Split a piece into its words and the end-of-ayah sign, so the sign can be tinted.
const splitMarker = (piece: Piece): [string, string] => {
  if (!piece[3]) return [piece[2], '']
  const at = piece[2].lastIndexOf(' ')
  return [piece[2].slice(0, at), piece[2].slice(at + 1)]
}

const BASE_SIZE = 20 // px, used only to measure
// At 20px (tighter word spacing, the font's own ayah signs), 19 pages in 20 have no line wider than this. Sizing to
// it keeps one text size on every page; the few wider lines are narrowed slightly to fit (at most about 10%).
const TYPICAL_WIDEST_AT_BASE = 366
const NO_LINES: Line[] = []
const NO_STROKES: Stroke[] = []

const BISMILLAH_FONT = 0 // QCF4_Hafs_01, the first font in qcf-fonts.json
const SWIPE_MIN = 50 // px of mostly horizontal travel
const BUTTON_FADE_MS = 5_000
// Ayah by ayah zooms in on the ayahs shown, until zooming would make them at most this much bigger than the page.
const NEAR_PAGE = 1.2

export default function MushafPage({
  page,
  arrivedFrom,
  pageBounds,
  portion,
  steps,
  stepsByDefault,
  onSteps,
  hiding: hideMode,
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
  // With the pen on, a drag draws instead, and the ‹ › buttons turn the page.
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

  // Ayah by ayah: only the ayahs reached so far show, zoomed in to fill the page; one more for each "+ ayah". With
  // the page's last ayah in, or once zooming would barely enlarge them, they show in the page's own layout and size
  // instead, with the rest blank in its place, so it finishes looking like the page. It starts at the first ayah of
  // today's portion on the page (or the page's first ayah) and keeps to the portion's Surahs, so another Surah on the
  // page never shows. With more than five ayahs, "2. half" starts it from the second half instead, leaving out the
  // first; each start keeps its own count. When the page holds nothing else, the whole page shows once all of it is
  // in. It is switched for each page, and each page stays as it was left until going back to Today.
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
  const surahOf = (key: string) => Number(key.split(':')[0])
  const inPortion = (key: string) => {
    const [surah, ayah] = key.split(':').map(Number)
    return Boolean(portion?.some((r) => r.surah === surah && ayah >= r.from && ayah <= r.to))
  }
  const portionStart = pageAyahs.findIndex(inPortion)
  const portionSurahs = new Set(portion?.map((r) => r.surah))
  const inStepSurahs = (key: string) => portionStart < 0 || portionSurahs.has(surahOf(key))
  const pageSteps = steps === undefined ? (stepsByDefault && portionStart >= 0 ? FRESH_STEPS : null) : steps
  const stepping = pageSteps !== null
  const stepKeys = stepping ? pageAyahs.slice(Math.max(portionStart, 0)).filter(inStepSurahs) : []
  const split = pageHalves(stepKeys)
  const half = split === null ? 0 : (pageSteps?.half ?? 0)
  const halfFrom = half === 1 ? split! : 0
  const shownTo = Math.min(halfFrom + (pageSteps?.taken[half] ?? 0) + 1, stepKeys.length)
  const stepActive = shownTo < stepKeys.length
  const wholePage = halfFrom === 0 && shownTo === stepKeys.length && pageAyahs.every(inStepSurahs)
  const shownKeys = stepping && !wholePage ? new Set(stepKeys.slice(halfFrom, shownTo)) : null
  const away = (key: string) => Boolean(shownKeys && !shownKeys.has(key)) // not reached yet: blank, in its place
  // As printed, the ayah shown first starts after the end sign of the one before it (of the same Surah), so that
  // sign still shows; above all from "2. half".
  const before = pageAyahs[pageAyahs.indexOf(stepKeys[halfFrom]) - 1]
  const leadSign = shownKeys && before && surahOf(before) === surahOf(stepKeys[halfFrom]) ? before : null
  const fitKey = `${qcfPage ? 'qcf' : 'bundled'}:${halfFrom}-${shownTo}`
  const [zoomFit, setZoomFit] = useState<{ key: string; size: number } | null>(null)
  const [qcfSize, setQcfSize] = useState<number | null>(null)
  const pageSize = qcfPage ? qcfSize : fontSize
  const nearPage = !stepActive || (zoomFit?.key === fitKey && pageSize !== null && zoomFit.size <= pageSize * NEAR_PAGE)
  const zoomed = shownKeys !== null && !nearPage
  const step = () => {
    const taken: [number, number] = [...pageSteps!.taken]
    taken[half]++
    onSteps({ ...pageSteps!, taken })
  }

  const focusText = () => {
    if (!shownKeys) return null
    if (qcfPage)
      return qcfPage.lines.flatMap((line) =>
        typeof line === 'string'
          ? []
          : line
              .filter(([, s, a]) => shownKeys.has(`${s}:${a}`))
              // The space after each glyph is inside its span, so neighbouring hidden words make one strip.
              .map(([code, s, a, kind], k) => (
                <span
                  key={`${code}-${k}`}
                  className={`qcf-glyph ${kind === 0 ? 'word' : 'sign'} ${kind === 0 && hidden(`${s}:${a}`) ? 'hidden' : ''}`}
                  data-ayah={`${s}:${a}`}
                >
                  {String.fromCodePoint(code)}{' '}
                </span>
              )),
      )
    // The bundled font: each ayah's pieces from its lines joined, then its marker.
    const ayahs = new Map<string, { words: string[]; sign: string }>()
    for (const line of lines) {
      if (typeof line === 'string') continue
      for (const piece of line) {
        const key = `${piece[0]}:${piece[1]}`
        if (!shownKeys.has(key)) continue
        const [words, marker] = splitMarker(piece)
        const entry = ayahs.get(key) ?? { words: [], sign: '' }
        entry.words.push(words)
        entry.sign ||= marker
        ayahs.set(key, entry)
      }
    }
    return [...ayahs].map(([key, { words, sign }]) => (
      <span key={key} className={`m-ayah ${hidden(key) ? 'hidden' : ''}`} data-ayah={key}>
        <span className="m-words">{words.join(' ')}</span>
        {sign && (
          <span className="m-marker">
            {' '}
            <span className="m-sign">{sign}</span>
          </span>
        )}{' '}
      </span>
    ))
  }

  // Hide mode and the pen step aside for ayah by ayah, whose buttons take their place; they come back after it.
  const hiding = hideMode && !stepping

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
  const hidden = (key: string) => hiding && !revealed.has(key)

  // The pen draws over the page (Drawing); each page keeps its drawing for each font look.
  const mainRef = useRef<HTMLElement>(null)
  const draggedRef = useRef(false)
  const freeDrag = penOn && !stepping
  const inkKey = drawingKey(qcfPage ? 'qcf' : 'bundled', page)
  const strokes = drawings?.[inkKey] ?? NO_STROKES

  // Rating, when opened from Rabt or Muraja'a: the stars at the top right rate the memorised Surahs on this page.
  const [ratingChoice, setRatingOpen] = useState<boolean | null>(null) // null until opened or closed on this page
  const pageSurahs = [...new Set(pageAyahs.map((key) => Number(key.split(':')[0])))]
  const ratableSurahs = rating ? pageSurahs.filter((s) => rating.memorised.includes(s)) : []
  // A memorised Surah on the page with no rating yet opens the rating by itself, as a reminder: once for each Surah
  // after opening from Today, not again on its every page.
  // The stars button shows the rating of the page's main memorised Surah (most ayahs here) once it is rated.
  const ayahsHere = (surah: number) => pageAyahs.filter((key) => surahOf(key) === surah).length
  const mainSurah = ratableSurahs.reduce<number | null>((best, s) => (best === null || ayahsHere(s) > ayahsHere(best) ? s : best), null)
  const mainRating = RATINGS.find((r) => mainSurah !== null && r.rating === rating?.ratings?.[mainSurah])
  const [remindedBefore] = useState(rating?.reminded ?? []) // as this page opened; the page remounts on every visit
  const toRemind = rating ? ratableSurahs.filter((s) => !rating.ratings?.[s] && !remindedBefore.includes(s)) : []
  const ratingOpen = ratingChoice ?? toRemind.length > 0
  const remindKey = toRemind.join(',')
  const onReminded = rating?.onReminded
  useEffect(() => {
    if (remindKey) onReminded?.(remindKey.split(',').map(Number))
  }, [remindKey, onReminded])

  // The floating buttons show and hide together: a tap on the page (not a swipe)
  // shows them and the next tap hides them; they also fade on their own after five seconds.
  // They show when the page is opened, but not after a page turn (unless the pen is on, for the ‹ › buttons).
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
    if (draggedRef.current) return // the end of a pen stroke, not a tap
    const ayah = hiding ? target.closest<HTMLElement>('.m-ayah, .qcf-glyph.word') : null
    if (ayah?.dataset.ayah) return toggleAyah(ayah.dataset.ayah) // that tap reveals or hides an ayah
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

  // Today's portion: pins on the ayah sign before it (or above its first word) and on its last ayah sign.
  const pins = portionPins(
    portion,
    page,
    new Set(lines.flatMap((line) => (typeof line === 'string' ? [] : line.filter((p) => p[3] === 1).map((p) => `${p[0]}:${p[1]}`)))),
  )
  // The first piece of the portion's first ayah, when the pin goes above it: [line, piece].
  const startLine = lines.findIndex((line) => typeof line !== 'string' && line.some((p) => `${p[0]}:${p[1]}` === pins.startWord))
  const startPiece = startLine < 0 ? -1 : (lines[startLine] as Piece[]).findIndex((p) => `${p[0]}:${p[1]}` === pins.startWord)
  const top = qcfPage ? firstQcfAyah(qcfPage.lines) : lines.length ? firstAyah(lines) : null

  return (
    <main
      ref={mainRef}
      className={`mushaf ${freeDrag ? 'free-drag' : ''}`}
      onPointerDown={() => (draggedRef.current = false)} // each touch starts as a tap, until the pen draws
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
              className={`rate ${ratingOpen ? 'on' : ''} ${mainRating ? 'rated' : ''}`}
              onClick={() => {
                if (!ratingOpen) tipOnce('rate')
                setRatingOpen(!ratingOpen)
              }}
              aria-expanded={ratingOpen}
              aria-label={
                mainRating ? `Rate surahs on this page (${surahName(mainSurah!)}: ${mainRating.label})` : 'Rate surahs on this page'
              }
            >
              {mainRating ? (
                <Stars count={mainRating.stars} />
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z" />
                </svg>
              )}
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
          page={page}
          lines={qcfPage.lines}
          fontFamily={qcfFonts.fonts[qcfPage.f]}
          bismillahFont={qcfFonts.fonts[BISMILLAH_FONT]}
          portion={portion}
          hiding={hiding}
          hidden={hidden}
          away={away}
          leadSign={leadSign}
          onFontSize={setQcfSize}
          className={`${arrivedFrom ? `enter-${arrivedFrom}` : ''} ${zoomed ? 'behind-focus' : ''}`}
        />
      ) : (
        <div
          ref={linesRef}
          className={`m-lines ${fontSize ? 'fitted' : ''} ${lines.length < 15 ? 'short' : ''} ${hiding ? 'hiding' : ''} ${arrivedFrom ? `enter-${arrivedFrom}` : ''} ${zoomed ? 'behind-focus' : ''}`}
          style={
            fontSize
              ? ({ '--quran-size': `${fontSize}px` } as React.CSSProperties)
              : undefined
          }
          lang="ar"
          dir="rtl"
        >
          {lines.map((line, i) => {
            const band = typeof line === 'string' ? bandSurah(lines, i) : null
            const bandAway = band !== null && away(`${band}:1`) ? 'away' : ''
            if (line === 'b')
              return (
                <div key={i} className={`m-line bismillah ${bandAway}`}>
                  <span className="basmala" lang="ar">
                    {data?.bismillah}
                  </span>
                </div>
              )
            if (typeof line === 'string')
              return (
                <div key={i} className={`m-line surah-band ${bandAway}`}>
                  <SurahBadge surah={Number(line.slice(1))} name={surahArabic(Number(line.slice(1)))} glyph={null} />
                </div>
              )
            return (
              <div key={i} className={`m-line ${centered.has(i) ? 'center' : ''} ${squeezed.has(i) ? 'squeezed' : ''}`}>
                <span className="m-text" style={squeezed.has(i) ? ({ '--squeeze': squeezed.get(i) } as React.CSSProperties) : undefined}>
                  {line.map((piece, j) => {
                    const [words, marker] = splitMarker(piece)
                    const key = `${piece[0]}:${piece[1]}`
                    return (
                      <span
                        key={key}
                        className={`m-ayah ${hidden(key) ? 'hidden' : ''} ${away(key) ? 'away' : ''}`}
                        data-ayah={key}
                      >
                        <span className={`m-words ${i === startLine && j === startPiece ? 'pin' : ''}`}>{words}</span>
                        {marker && (
                          <span className="m-marker">
                            {' '}
                            <span className={`m-sign ${pins.signs.has(key) ? 'pin' : ''} ${key === leadSign ? 'lead' : ''}`}>
                              {marker}
                            </span>
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

      {/* Also laid out while the page shows instead, to measure whether zooming still enlarges the ayahs. */}
      {shownKeys && (
        <AyahFocus
          fitKey={fitKey}
          onFitted={setZoomFit}
          className={`${qcfPage ? 'qcf' : ''} ${zoomed ? '' : 'measure-only'}`}
          style={qcfPage ? ({ '--qcf-font': `'${qcfFonts.fonts[qcfPage.f]}'` } as React.CSSProperties) : undefined}
        >
          {focusText()}
        </AyahFocus>
      )}

      {!shownKeys && (freeDrag || strokes.length > 0) && (
        <Drawing
          key={inkKey}
          rootRef={mainRef}
          strokes={strokes}
          penOn={freeDrag}
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
          <button onClick={() => onTurn(page + 1)} disabled={page >= pageBounds.last} aria-label="Next page" tabIndex={buttonVisible ? 0 : -1}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15.5 5l-7 7 7 7" />
            </svg>
          </button>
          <button onClick={() => onTurn(page - 1)} disabled={page <= pageBounds.first} aria-label="Previous page" tabIndex={buttonVisible ? 0 : -1}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8.5 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Ayah by ayah: off, a toggle in the bottom left corner; on, one row of "+ ayah" (holding the count), the halves
          and a button to leave it. */}
      {pageSteps ? (
        <div className={`step-tools ${buttonVisible ? '' : 'faded-out'}`}>
          <button
            className="step-tool"
            onClick={step}
            disabled={!stepActive}
            tabIndex={buttonVisible ? 0 : -1}
          >
            + ayah
            {/* Counted across the whole page, also when starting from the second half. */}
            <span className="step-count">
              {shownTo} / {stepKeys.length}
            </span>
          </button>
          {split !== null && (
            <button
              className={`step-half ${half === 1 ? 'on' : ''}`}
              onClick={() => onSteps({ ...pageSteps, half: half === 1 ? 0 : 1 })}
              aria-pressed={half === 1}
              aria-label="Start from the second half"
              tabIndex={buttonVisible ? 0 : -1}
            >
              2. half
            </button>
          )}
          <button className="step-exit" onClick={() => onSteps(null)} aria-label="Show the whole page" tabIndex={buttonVisible ? 0 : -1}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      ) : (
        <button
          className={`step-toggle ${buttonVisible ? '' : 'faded-out'}`}
          onClick={() => {
            onSteps(FRESH_STEPS)
            tipOnce('ayah-by-ayah')
          }}
          aria-label="Ayah by ayah"
          tabIndex={buttonVisible ? 0 : -1}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 7h14" />
            <path className="faint" d="M5 12h14M5 17h9" />
          </svg>
        </button>
      )}

      {freeDrag && strokes.length > 0 && (
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

      {!stepping && (
        <button
          className={`pen-toggle ${buttonVisible ? '' : 'faded-out'} ${penOn ? 'on' : ''}`}
          onClick={() => {
            if (!penOn) tipOnce('pen')
            onTogglePen()
          }}
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

      {!stepping && (
        <button
          className={`hide-toggle ${buttonVisible ? '' : 'faded-out'} ${hiding ? 'on' : ''}`}
          onClick={() => {
            if (!hiding) tipOnce('hide')
            onToggleHiding()
          }}
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
      )}
    </main>
  )
}
