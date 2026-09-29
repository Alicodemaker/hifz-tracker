import { useRef } from 'react'
import { readBackup } from './backup'
import type { Saved } from './day'

type Props = { className: string; onRestore: (saved: Saved) => void; onMessage: (message: string) => void }

// Pick a Backup file (e.g. from Google Drive) and, after confirming, replace everything with it.
export default function RestoreButton({ className, onRestore, onMessage }: Props) {
  const fileInput = useRef<HTMLInputElement>(null)

  const restore = async (file: File | undefined) => {
    if (!file) return
    try {
      const backup = await readBackup(file)
      if (confirm(`Replace everything on this phone with the backup (${backup.history.length} logged day${backup.history.length === 1 ? "" : "s"})?`)) {
        onRestore(backup)
        onMessage('Backup restored.')
      }
    } catch (e) {
      onMessage(e instanceof SyntaxError ? 'This file is not a Hifz Tracker backup.' : (e as Error).message)
    }
    if (fileInput.current) fileInput.current.value = ''
  }

  return (
    <>
      <button className={className} onClick={() => fileInput.current?.click()}>
        Restore
      </button>
      <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={(e) => restore(e.target.files?.[0])} />
    </>
  )
}
