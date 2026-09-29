import { useState } from 'react'
import type { Saved } from './day'
import type { Progress } from './plan'
import RestoreButton from './RestoreButton'
import { SURAH_COUNT, ayahCount, juzOfSurah, surahName, surahSize } from './quran'

// The builder's real state: an-Nas back to Fussilat memorised, next Hifz Ghafir 1.
const DEFAULT_MEMORISED = Array.from({ length: SURAH_COUNT - 40 }, (_, i) => 41 + i)
const DEFAULT_NEXT = { surah: 40, ayah: 1 }

const ALL_SURAHS = Array.from({ length: SURAH_COUNT }, (_, i) => i + 1)
// Juz 30 first, since memorisation runs backwards from an-Nas.
const JUZ_GROUPS = Array.from({ length: 30 }, (_, i) => 30 - i).map((juz) => ({
  juz,
  surahs: ALL_SURAHS.filter((s) => juzOfSurah(s) === juz),
}))

type Props = { initial: Progress | null; onSave: (progress: Progress) => void; onRestore: (saved: Saved) => void }

export default function Setup({ initial, onSave, onRestore }: Props) {
  const [memorised, setMemorised] = useState(() => new Set(initial?.memorised ?? DEFAULT_MEMORISED))
  const [next, setNext] = useState(initial?.hifzNext ?? DEFAULT_NEXT)
  const [message, setMessage] = useState('')

  const toggle = (surahs: number[], on: boolean) =>
    setMemorised((prev) => {
      const updated = new Set(prev)
      surahs.forEach((s) => (on ? updated.add(s) : updated.delete(s)))
      return updated
    })

  const nextIsMemorised = memorised.has(next.surah)

  const submit = () =>
    onSave({ memorised: [...memorised].sort((a, b) => a - b), hifzNext: next, murajaNext: initial?.murajaNext ?? null })

  return (
    <main className="screen with-action-bar">
      <header className="top">
        <h1>Set up</h1>
        {!initial && <RestoreButton className="link" onRestore={onRestore} onMessage={setMessage} />}
      </header>
      {message && <p className="notice">{message}</p>}

      <section className="card">
        <h2>Next Hifz</h2>
        <p className="muted">The first ayah you have not memorised yet.</p>
        <div className="field-row">
          <label className="field grow">
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
        {nextIsMemorised && <p className="warning">{surahName(next.surah)} is also ticked as memorised below.</p>}
      </section>

      <h2>Memorised surahs</h2>
      <p className="muted">Tick whole surahs, or a whole juz at once.</p>
      {JUZ_GROUPS.map(({ juz, surahs }) => {
        const allOn = surahs.length > 0 && surahs.every((s) => memorised.has(s))
        return (
          <section className="card" key={juz}>
            <label className="check juz">
              <input type="checkbox" checked={allOn} disabled={surahs.length === 0} onChange={(e) => toggle(surahs, e.target.checked)} />
              <span>Juz {juz}</span>
            </label>
            {surahs.map((s) => (
              <label className="check" key={s}>
                <input type="checkbox" checked={memorised.has(s)} onChange={(e) => toggle([s], e.target.checked)} />
                <span>
                  {s}. {surahName(s)}
                </span>
                <span className="muted small">{surahSize(s).toFixed(1)} p</span>
              </label>
            ))}
            {surahs.length === 0 && <p className="muted small">No surah starts in this juz.</p>}
          </section>
        )
      })}

      <div className="action-bar">
        <button className="primary" onClick={submit} disabled={nextIsMemorised}>
          Save
        </button>
      </div>
    </main>
  )
}
