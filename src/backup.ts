// A Backup is the whole saved state as one JSON file, handed to the phone's share sheet (ADR-0004).
import type { Saved } from './day'

export const backupFile = (saved: Saved, date: string): File =>
  new File([JSON.stringify(saved, null, 1)], `hifz-tracker-backup-${date}.json`, { type: 'application/json' })

// Share sheet on phones (pick "Save to Drive"); a plain download where sharing files isn't supported.
export const shareBackup = async (file: File): Promise<void> => {
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: file.name })
      return
    } catch (e) {
      if ((e as Error).name === 'AbortError') return // the person closed the share sheet
    }
  }
  const url = URL.createObjectURL(file)
  const a = Object.assign(document.createElement('a'), { href: url, download: file.name })
  a.click()
  URL.revokeObjectURL(url)
}

export const readBackup = async (file: File): Promise<Saved> => {
  const saved = JSON.parse(await file.text()) as Saved
  if (saved?.version !== 1 || !Array.isArray(saved.progress?.memorised) || !Array.isArray(saved.history)) {
    throw new Error('This file is not a Hifz Tracker backup.')
  }
  return { ...saved, today: saved.today ?? null }
}
