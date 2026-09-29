import { useMemo, useState } from 'react'
import BackButton from './BackButton'
import type { Saved } from './day'
import { DEFAULT_MURAJA_PAGES, type Progress } from './plan'
import JuzRing from './JuzRing'
import { juzProgress } from './progress'
import RestoreButton from './RestoreButton'
import { SURAH_COUNT, ayahCount, juzOfSurah, surahArabic, surahName } from './quran'
import { loadTheme, saveTheme, type Theme } from './theme'

// The builder's real state: an-Nas back to Fussilat memorised, next Hifz Ghafir 1.
const DEFAULT_MEMORISED = Array.from({ length: SURAH_COUNT - 40 }, (_, i) => 41 + i)
const DEFAULT_NEXT = { surah: 40, ayah: 1 }

const ALL_SURAHS = Array.from({ length: SURAH_COUNT }, (_, i) => i + 1)
// Juz 30 first, since memorisation runs backwards from an-Nas.
const JUZ_GROUPS = Array.from({ length: 30 }, (_, i) => 30 - i).map((juz) => ({
  juz,
  surahs: ALL_SURAHS.filter((s) => juzOfSurah(s) === juz),
}))

const MURAJA_PAGES = [5, 10, 15, 20]

const THEMES: { value: Theme; label: string }[] = [
  { value: 'system', label: 'Phone' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

type Props = {
  initial: Progress | null
  onSave: (progress: Progress) => void
  onRestore: (saved: Saved) => void
  onBack: (() => void) | null // back to Today without saving; none on the first run
}

export default function Settings({ initial, onSave, onRestore, onBack }: Props) {
  const [memorised, setMemorised] = useState(() => new Set(initial?.memorised ?? DEFAULT_MEMORISED))
  const [next, setNext] = useState(initial?.hifzNext ?? DEFAULT_NEXT)
  const [message, setMessage] = useState('')
  const [theme, setTheme] = useState(loadTheme)
  const [murajaPages, setMurajaPages] = useState(initial?.murajaPages ?? DEFAULT_MURAJA_PAGES)

  // The theme applies straight away; progress changes wait for Save.
  const chooseTheme = (choice: Theme) => {
    saveTheme(choice)
    setTheme(choice)
  }

  const toggle = (surahs: number[], on: boolean) =>
    setMemorised((prev) => {
      const updated = new Set(prev)
      surahs.forEach((s) => (on ? updated.add(s) : updated.delete(s)))
      return updated
    })

  const nextIsMemorised = memorised.has(next.surah)
  const shares = useMemo(() => juzProgress({ memorised: [...memorised], hifzNext: next, murajaNext: null }), [memorised, next])

  const submit = () =>
    onSave({
      memorised: [...memorised].sort((a, b) => a - b),
      hifzNext: next,
      murajaNext: initial?.murajaNext ?? null,
      murajaPages,
    })

  return (
    <main className="screen">
      <header className="screen-head">
        <div className="title-row">
          {onBack && <BackButton onClick={onBack} label="Back to Today without saving" />}
          <h1>Settings</h1>
        </div>
        {!initial && <RestoreButton className="link" onRestore={onRestore} onMessage={setMessage} />}
      </header>
      {message && <p className="notice">{message}</p>}

      <h2 className="section-title">Theme</h2>
      <div className="segmented" role="group" aria-label="Theme">
        {THEMES.map(({ value, label }) => (
          <button key={value} aria-pressed={theme === value} onClick={() => chooseTheme(value)}>
            {label}
          </button>
        ))}
      </div>

      <h2 className="section-title">Next Hifz</h2>
      <p className="faded small">The first ayah you have not memorised yet.</p>
      <div className="field-row">
        <label className="field">
          <span>Surah</span>
          <select value={next.surah} onChange={(e) => setNext({ surah: Number(e.target.value), ayah: 1 })}>
            {ALL_SURAHS.map((s) => (
              <option key={s} value={s}>
                {s}. {surahName(s)}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Ayah</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={ayahCount(next.surah)}
            value={next.ayah}
            onChange={(e) =>
              setNext({ ...next, ayah: Math.min(Math.max(1, Number(e.target.value) || 1), ayahCount(next.surah)) })
            }
          />
        </label>
      </div>
      {nextIsMemorised && <p className="notice alert">{surahName(next.surah)} is also ticked as memorised below. Untick it to save.</p>}

      <h2 className="section-title">Muraja'a per day</h2>
      <p className="faded small">Whole surahs, up to this many pages. A longer surah is split across days.</p>
      <div className="segmented" role="group" aria-label="Muraja'a pages per day">
        {MURAJA_PAGES.map((pages) => (
          <button key={pages} aria-pressed={murajaPages === pages} onClick={() => setMurajaPages(pages)}>
            {pages} pages
          </button>
        ))}
      </div>

      <h2 className="section-title">Memorised surahs</h2>
      <p className="faded small">Tick whole surahs, or a whole juz at once.</p>
      {JUZ_GROUPS.map(({ juz, surahs }) => {
        const allOn = surahs.length > 0 && surahs.every((s) => memorised.has(s))
        return (
          <section className="juz-group" key={juz}>
            <label className="check juz">
              <input type="checkbox" checked={allOn} disabled={surahs.length === 0} onChange={(e) => toggle(surahs, e.target.checked)} />
              <span className="name">Juz {juz}</span>
              <JuzRing juz={juz} share={shares[juz - 1]} size={36} />
            </label>
            {surahs.map((s) => (
              <label className="check" key={s}>
                <input type="checkbox" checked={memorised.has(s)} onChange={(e) => toggle([s], e.target.checked)} />
                <span className="name">{surahName(s)}</span>
                <span lang="ar" className="arabic">
                  {surahArabic(s)}
                </span>
              </label>
            ))}
            {surahs.length === 0 && <p className="faded small">This juz lies inside a longer surah.</p>}
          </section>
        )
      })}

      <div className="action-bar">
        <button className="button primary" onClick={submit} disabled={nextIsMemorised}>
          Save
        </button>
      </div>
    </main>
  )
}
