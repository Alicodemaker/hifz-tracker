import { useEffect } from 'react'

// Keep the screen on while `active`. The phone drops the lock whenever the app is hidden, so it is asked
// for again on return. Where the browser can't (no support, battery saver), the screen simply dims as usual.
export const useWakeLock = (active: boolean) => {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    let stopped = false
    const request = async () => {
      if (document.visibilityState !== 'visible') return
      try {
        const next = await navigator.wakeLock.request('screen')
        if (stopped) next.release()
        else lock = next
      } catch {
        // Refused: the screen dims as usual.
      }
    }
    request()
    document.addEventListener('visibilitychange', request)
    return () => {
      stopped = true
      document.removeEventListener('visibilitychange', request)
      lock?.release()
    }
  }, [active])
}
