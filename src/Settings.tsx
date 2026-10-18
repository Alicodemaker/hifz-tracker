import { useState } from 'react'
import BackButton from './BackButton'
import { DEFAULT_MURAJA_PAGES, type Progress } from './plan'
import { MemorisedSurahs, MurajaPagesChoice, NextHifzFields } from './ProgressFields'
import { surahName } from './quran'
import { loadTheme, saveTheme, type Theme } from './theme'
import { appVersion, builtAt, checkForUpdate, installUpdate } from './update'

const THEMES: { value: Theme; label: string }[] = [
  { value: 'system', label: 'Phone' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

// The update button names what it's doing, or what it found.
const UPDATE_LABELS = {
  idle: 'Check for updates',
  checking: 'Checking…',
  updating: 'Updating…',
  latest: 'Up to date',
  offline: "Can't check offline",
}
type UpdateStatus = keyof typeof UPDATE_LABELS

type Props = {
  initial: Progress
  onSave: (progress: Progress) => void
  onBack: () => void // back to Today without saving
}

export default function Settings({ initial, onSave, onBack }: Props) {
  const [memorised, setMemorised] = useState(() => new Set(initial.memorised))
  const [next, setNext] = useState(initial.hifzNext ?? { surah: 1, ayah: 1 })
  const [theme, setTheme] = useState(loadTheme)
  const [murajaPages, setMurajaPages] = useState(initial.murajaPages ?? DEFAULT_MURAJA_PAGES)
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>('idle')

  // The theme applies straight away; progress changes wait for Save.
  const chooseTheme = (choice: Theme) => {
    saveTheme(choice)
    setTheme(choice)
  }

  const update = async () => {
    setUpdateStatus('checking')
    const found = await checkForUpdate()
    if (found !== 'available') return setUpdateStatus(found)
    setUpdateStatus('updating')
    await installUpdate()
  }

  const toggle = (surahs: number[], on: boolean) =>
    setMemorised((prev) => {
      const updated = new Set(prev)
      surahs.forEach((s) => (on ? updated.add(s) : updated.delete(s)))
      return updated
    })

  const nextIsMemorised = memorised.has(next.surah)

  const submit = () =>
    onSave({
      memorised: [...memorised].sort((a, b) => a - b),
      hifzNext: next,
      murajaNext: initial.murajaNext,
      murajaPages,
    })

  return (
    <main className="screen">
      <header className="screen-head with-version">
        <div className="title-row">
          <BackButton onClick={onBack} label="Back to Today without saving" />
          <h1>Settings</h1>
        </div>
        <div className="app-version">
          <p className="faded small">
            Version {appVersion}
            <br />
            {builtAt}
          </p>
          <button className="link" onClick={update} disabled={updateStatus === 'checking' || updateStatus === 'updating'}>
            {UPDATE_LABELS[updateStatus]}
          </button>
        </div>
      </header>

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
      <NextHifzFields next={next} onChange={setNext} />
      {nextIsMemorised && <p className="notice alert">{surahName(next.surah)} is also ticked as memorised below. Untick it to save.</p>}

      <h2 className="section-title">Muraja'a per day</h2>
      <p className="faded small">Whole surahs, up to this many pages. A longer surah is split across days.</p>
      <MurajaPagesChoice value={murajaPages} onChange={setMurajaPages} />

      <h2 className="section-title">Memorised surahs</h2>
      <p className="faded small">Tick whole surahs, or a whole juz at once.</p>
      <MemorisedSurahs memorised={memorised} next={next} onToggle={toggle} />

      <h2 className="section-title credits-title">Credits</h2>
      <ul className="faded small credits">
        <li>
          Quran text and page layout: King Fahd Glorious Quran Printing Complex (KFGQPC), via quran.ws (CC BY 4.0).
        </li>
        <li>Mushaf font: KFGQPC HAFS Uthmanic Script, unmodified.</li>
        <li>
          Exact mushaf font: KFGQPC QCF4 (calligraphy by Uthman Taha), downloaded from quran-qcf4 by Mohamad Hajj Rabee,
          whose page data is used under the MIT licence.
        </li>
        <li>Interface fonts: Amiri and Figtree (SIL Open Font License).</li>
      </ul>

      <div className="action-bar">
        <button className="button primary" onClick={submit} disabled={nextIsMemorised}>
          Save
        </button>
      </div>
    </main>
  )
}
