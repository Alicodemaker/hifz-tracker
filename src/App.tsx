import { useCallback, useEffect, useRef, useState } from 'react'
import { backupDue, backupFile, describeLastBackup, shareBackup } from './backup'
import Celebration from './Celebration'
import { applySettings, celebrationFor, localDate, startDay, undoNextDay, updateToday, type Day, type Kind, type Saved } from './day'
import History from './History'
import MushafPage, { type PageSteps } from './MushafPage'
import { changeHifzAmount, finishEstimates } from './pace'
import { addStroke, clearDrawing } from './drawings'
import { DEFAULT_HIFZ_AMOUNT, type Progress, type Range } from './plan'
import { pageOf, surahPages } from './quran'
import { setRating } from './ratings'
import Settings from './Settings'
import Setup from './Setup'
import { load, save } from './storage'
import Surahs from './Surahs'
import Today from './Today'
import { useWakeLock } from './wakeLock'

// Start today's Day if the date has changed, and remember it. Saving the same state twice is harmless.
const openToday = (saved: Saved | null) => {
  const next = saved ? startDay(saved, localDate()) : null
  if (next && next !== saved) save(next)
  return next
}

type Cheer = { size: 'small' | 'big'; origin: { x: number; y: number }; id: number }

const pageFromHash = (): number | null => {
  const match = /^#\/page\/(\d+)$/.exec(window.location.hash)
  const page = match ? Number(match[1]) : null
  return page && page >= 1 && page <= 604 ? page : null
}

export default function App() {
  const [saved, setSaved] = useState<Saved | null>(() => openToday(load()))
  const [screen, setScreen] = useState<'today' | 'settings' | 'history' | 'surahs'>('today')
  const [mushafPage, setMushafPage] = useState(pageFromHash)
  const [portion, setPortion] = useState<Range[] | null>(null)
  const openedFromToday = useRef(false)
  const [arrivedFrom, setArrivedFrom] = useState<'next' | 'prev' | null>(null)
  const [hiding, setHiding] = useState(false) // hide mode stays on across pages until switched off
  const [penOn, setPenOn] = useState(false) // the drawing pen, like hide mode, stays on across pages
  const [openedKind, setOpenedKind] = useState<Kind | null>(null) // which of today's areas opened the page
  const [reminded, setReminded] = useState<number[]>([]) // Surahs whose rating opened by itself since opening from Today
  const remind = useCallback((surahs: number[]) => setReminded((all) => [...new Set([...all, ...surahs])]), [])
  const [steps, setSteps] = useState<Record<number, PageSteps | null>>({}) // ayah by ayah, switched for each page, kept across page turns

  // The Mushaf page lives at #/page/<n>, so the phone's back gesture leaves it.
  useEffect(() => {
    const onHash = () => {
      const page = pageFromHash()
      setMushafPage(page)
      if (!page) {
        openedFromToday.current = false
        setOpenedKind(null)
      }
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const update = (next: Saved) => {
    save(next)
    setSaved(next)
  }

  // Ticking something done celebrates from where the screen was tapped (small), or across it when the day is done (big).
  const lastTap = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
  useEffect(() => {
    const onTap = (e: PointerEvent) => (lastTap.current = { x: e.clientX, y: e.clientY })
    window.addEventListener('pointerdown', onTap, true)
    return () => window.removeEventListener('pointerdown', onTap, true)
  }, [])
  const [celebration, setCelebration] = useState<Cheer | null>(null)
  const endCelebration = useCallback(() => setCelebration(null), [])
  const changeToday = (day: Day) => {
    if (!saved) return
    const size = saved.today && celebrationFor(saved.today, day)
    if (size) setCelebration((last) => ({ size, origin: lastTap.current, id: (last?.id ?? 0) + 1 })) // a new id restarts a running one
    update(updateToday(saved, day))
  }

  // Coming back to the app on a new date starts a new Day.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      setSaved(openToday)
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])
  // So does midnight while the app stays open, so a tick just after it counts for the new date.
  const todayDate = saved?.today?.date
  useEffect(() => {
    if (!todayDate) return
    const now = new Date()
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1)
    const timer = window.setTimeout(() => setSaved(openToday), midnight.getTime() - now.getTime())
    return () => window.clearTimeout(timer)
  }, [todayDate])

  // The screen stays on while a Mushaf page is open, for memorising from it.
  useWakeLock(Boolean(saved && mushafPage))

  // Saved Settings re-plan today, keeping any tick whose part of the plan is unchanged.
  const saveSettings = (progress: Progress) => {
    update(saved ? applySettings(saved, progress, localDate()) : startDay({ version: 1, progress, today: null, history: [] }, localDate()))
    setScreen('today')
  }

  // A Backup carries its own date, and once handed over (not cancelled) it is remembered for the reminder.
  const backUp = async () => {
    if (!saved) return
    const date = localDate()
    if (!(await shareBackup(backupFile({ ...saved, lastBackup: date }, date)))) return
    setSaved((current) => {
      if (!current) return current
      const next = { ...current, lastBackup: date }
      save(next)
      return next
    })
  }

  // A restored Backup may be from an earlier date; start today's Day from it.
  const restore = (backup: Saved) => {
    update(startDay(backup, localDate()))
    setScreen('history')
  }

  // Opening adds a history entry, so the phone's back gesture returns to Today.
  const openPage = (kind: Kind, ranges: Range[]) => {
    setOpenedKind(kind)
    setPortion(ranges)
    setSteps({}) // every page starts again from Today
    setReminded([])
    setArrivedFrom(null)
    openedFromToday.current = true
    window.location.hash = `#/page/${pageOf({ surah: ranges[0].surah, ayah: ranges[0].from })}`
  }
  // Opened from Hifz, pages turn only within the Hifz Surah; otherwise through the whole Mushaf.
  const pageBounds =
    openedKind === 'hifz' && portion?.length
      ? { first: surahPages(portion[0].surah).first, last: surahPages(portion[portion.length - 1].surah).last }
      : { first: 1, last: 604 }
  // Turning pages replaces that entry, so one back always leaves the Mushaf page.
  const turnTo = (page: number) => {
    if (page < pageBounds.first || page > pageBounds.last) return
    history.replaceState(null, '', `#/page/${page}`)
    setArrivedFrom(mushafPage && page > mushafPage ? 'next' : 'prev')
    setMushafPage(page)
  }
  const leavePage = () => {
    if (openedFromToday.current) history.back()
    else {
      // The app was opened straight onto a page: there is no Today entry behind it to go back to.
      history.replaceState(null, '', window.location.pathname)
      setMushafPage(null)
    }
    openedFromToday.current = false
  }

  const screenContent = () => {
    if (saved && mushafPage) {
      return (
        <MushafPage
          key={mushafPage} // a fresh page on every visit, so hide mode starts fully hidden each time
          page={mushafPage}
          arrivedFrom={arrivedFrom}
          pageBounds={pageBounds}
          portion={portion}
          steps={steps[mushafPage]}
          stepsByDefault={openedKind === 'hifz'}
          onSteps={(pageSteps) => setSteps((all) => ({ ...all, [mushafPage]: pageSteps }))}
          hiding={hiding}
          onToggleHiding={() => setHiding((on) => !on)}
          penOn={penOn}
          onTogglePen={() => setPenOn((on) => !on)}
          drawings={saved.drawings}
          onStroke={(key, stroke) => update(addStroke(saved, key, stroke))}
          onClearDrawing={(key) => update(clearDrawing(saved, key))}
          rating={
            openedKind === 'muraja' || openedKind === 'rabt'
              ? {
                  memorised: saved.progress.memorised,
                  ratings: saved.ratings,
                  onRate: (surah, rating) => update(setRating(saved, surah, rating)),
                  reminded,
                  onReminded: remind,
                }
              : null
          }
          onBack={leavePage}
          onTurn={turnTo}
        />
      )
    }

    if (!saved) return <Setup onStart={saveSettings} onRestore={restore} />

    if (screen === 'settings') return <Settings initial={saved.progress} onSave={saveSettings} onBack={() => setScreen('today')} />

    if (screen === 'history') {
      return <History saved={saved} onBackUp={backUp} onRestore={restore} onBack={() => setScreen('today')} />
    }

    if (screen === 'surahs') {
      return (
        <Surahs saved={saved} onRate={(surah, rating) => update(setRating(saved, surah, rating))} onBack={() => setScreen('today')} />
      )
    }

    return (
      <Today
        key={saved.today!.date}
        day={saved.today!}
        hifzAmount={saved.progress.hifzAmount ?? DEFAULT_HIFZ_AMOUNT}
        estimates={finishEstimates(saved)}
        onChange={changeToday}
        onUndoNextDay={saved.beforeNextDay ? () => update(undoNextDay(saved)) : null}
        backupReminder={backupDue(saved, saved.today!.date) ? describeLastBackup(saved.lastBackup, saved.today!.date) : null}
        onBackUp={backUp}
        onChangeAmount={(direction) => update(changeHifzAmount(saved, direction))}
        onOpenPage={openPage}
        onSettings={() => setScreen('settings')}
        onHistory={() => setScreen('history')}
        onSurahs={() => setScreen('surahs')}
      />
    )
  }

  return (
    <>
      {screenContent()}
      {celebration && (
        <Celebration key={celebration.id} size={celebration.size} origin={celebration.origin} onEnd={endCelebration} />
      )}
    </>
  )
}
