import { useEffect, useRef, useState } from 'react'
import { localDate, startDay, type Day, type Saved } from './day'
import History from './History'
import MushafPage from './MushafPage'
import { changeHifzAmount, finishEstimates } from './pace'
import { DEFAULT_HIFZ_AMOUNT, type Progress, type Range } from './plan'
import { pageOf } from './quran'
import Setup from './Setup'
import { load, save } from './storage'
import Today from './Today'

// Start today's Day if the date has changed, and remember it. Saving the same state twice is harmless.
const openToday = (saved: Saved | null) => {
  const next = saved ? startDay(saved, localDate()) : null
  if (next && next !== saved) save(next)
  return next
}

const pageFromHash = (): number | null => {
  const match = /^#\/page\/(\d+)$/.exec(window.location.hash)
  const page = match ? Number(match[1]) : null
  return page && page >= 1 && page <= 604 ? page : null
}

export default function App() {
  const [saved, setSaved] = useState<Saved | null>(() => openToday(load()))
  const [screen, setScreen] = useState<'today' | 'setup' | 'history'>('today')
  const [mushafPage, setMushafPage] = useState(pageFromHash)
  const [portion, setPortion] = useState<Range[] | null>(null)
  const openedFromToday = useRef(false)
  const [arrivedFrom, setArrivedFrom] = useState<'next' | 'prev' | null>(null)
  const [hiding, setHiding] = useState(false) // hide mode stays on across pages until switched off

  // The Mushaf page lives at #/page/<n>, so the phone's back gesture leaves it.
  useEffect(() => {
    const onHash = () => {
      const page = pageFromHash()
      setMushafPage(page)
      if (!page) openedFromToday.current = false
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const update = (next: Saved) => {
    save(next)
    setSaved(next)
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

  const saveSetup = (progress: Progress) => {
    // New setup replaces today's plan; ticks made today under the old setup are dropped.
    // Setup doesn't show the Hifz amount, so keep the one already chosen.
    const withAmount = { ...progress, hifzAmount: saved?.progress.hifzAmount }
    update(startDay({ version: 1, progress: withAmount, today: null, history: saved?.history ?? [] }, localDate()))
    setScreen('today')
  }

  // A restored Backup may be from an earlier date; start today's Day from it.
  const restore = (backup: Saved) => {
    update(startDay(backup, localDate()))
    setScreen('history')
  }

  // Opening adds a history entry, so the phone's back gesture returns to Today.
  const openPage = (ranges: Range[]) => {
    setPortion(ranges)
    setArrivedFrom(null)
    openedFromToday.current = true
    window.location.hash = `#/page/${pageOf({ surah: ranges[0].surah, ayah: ranges[0].from })}`
  }
  // Turning pages replaces that entry, so one back always leaves the Mushaf page.
  const turnTo = (page: number) => {
    if (page < 1 || page > 604) return
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

  if (saved && mushafPage) {
    return (
      <MushafPage
        key={mushafPage} // a fresh page on every visit, so hide mode starts fully hidden each time
        page={mushafPage}
        arrivedFrom={arrivedFrom}
        portion={portion}
        hiding={hiding}
        onToggleHiding={() => setHiding((on) => !on)}
        onBack={leavePage}
        onTurn={turnTo}
      />
    )
  }

  if (!saved || screen === 'setup') return <Setup initial={saved?.progress ?? null} onSave={saveSetup} onRestore={restore} />

  if (screen === 'history') {
    return <History saved={saved} onRestore={restore} onBack={() => setScreen('today')} />
  }

  const changeDay = (day: Day) => update({ ...saved, today: day })

  return (
    <Today
      key={saved.today!.date}
      day={saved.today!}
      hifzAmount={saved.progress.hifzAmount ?? DEFAULT_HIFZ_AMOUNT}
      estimates={finishEstimates(saved)}
      onChange={changeDay}
      onChangeAmount={(direction) => update(changeHifzAmount(saved, direction))}
      onOpenPage={openPage}
      onEditSetup={() => setScreen('setup')}
      onHistory={() => setScreen('history')}
    />
  )
}
