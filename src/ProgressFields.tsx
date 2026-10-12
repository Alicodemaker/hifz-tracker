// The progress fields shared by Settings and the first-run setup.
import { useMemo } from 'react'
import JuzRing from './JuzRing'
import { juzProgress } from './progress'
import { SURAH_COUNT, ayahCount, juzOfSurah, surahArabic, surahName, type AyahRef } from './quran'

const ALL_SURAHS = Array.from({ length: SURAH_COUNT }, (_, i) => i + 1)
// Juz 30 first, since memorisation runs backwards from an-Nas.
const JUZ_GROUPS = Array.from({ length: 30 }, (_, i) => 30 - i).map((juz) => ({
  juz,
  surahs: ALL_SURAHS.filter((s) => juzOfSurah(s) === juz),
}))

const MURAJA_PAGES = [5, 10, 15, 20]

export function NextHifzFields({ next, onChange }: { next: AyahRef; onChange: (next: AyahRef) => void }) {
  return (
    <div className="field-row">
      <label className="field">
        <span>Surah</span>
        <select value={next.surah} onChange={(e) => onChange({ surah: Number(e.target.value), ayah: 1 })}>
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
          onChange={(e) => onChange({ ...next, ayah: Math.min(Math.max(1, Number(e.target.value) || 1), ayahCount(next.surah)) })}
        />
      </label>
    </div>
  )
}

export function MurajaPagesChoice({ value, onChange }: { value: number; onChange: (pages: number) => void }) {
  return (
    <div className="segmented" role="group" aria-label="Muraja'a pages per day">
      {MURAJA_PAGES.map((pages) => (
        <button key={pages} aria-pressed={value === pages} onClick={() => onChange(pages)}>
          {pages} pages
        </button>
      ))}
    </div>
  )
}

type MemorisedProps = { memorised: Set<number>; next: AyahRef; onToggle: (surahs: number[], on: boolean) => void }

// Every surah by juz, with a ring showing how much of each juz is memorised.
export function MemorisedSurahs({ memorised, next, onToggle }: MemorisedProps) {
  const shares = useMemo(() => juzProgress({ memorised: [...memorised], hifzNext: next, murajaNext: null }), [memorised, next])
  return JUZ_GROUPS.map(({ juz, surahs }) => {
    const allOn = surahs.length > 0 && surahs.every((s) => memorised.has(s))
    return (
      <section className="juz-group" key={juz}>
        <label className="check juz">
          <input type="checkbox" checked={allOn} disabled={surahs.length === 0} onChange={(e) => onToggle(surahs, e.target.checked)} />
          <span className="name">Juz {juz}</span>
          <JuzRing juz={juz} share={shares[juz - 1]} size={36} />
        </label>
        {surahs.map((s) => (
          <label className="check" key={s}>
            <input type="checkbox" checked={memorised.has(s)} onChange={(e) => onToggle([s], e.target.checked)} />
            <span className="name">{surahName(s)}</span>
            <span lang="ar" className="arabic">
              {surahArabic(s)}
            </span>
          </label>
        ))}
        {surahs.length === 0 && <p className="faded small">This juz lies inside a longer surah.</p>}
      </section>
    )
  })
}
