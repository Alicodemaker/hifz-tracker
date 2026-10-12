// A Backup is the whole saved state as one JSON file, handed to the phone's share sheet (ADR-0004).
import { daysBetween, type Saved } from './day'

const BACKUP_DUE_DAYS = 14

// Everything lives on this one phone, so once something is logged, a Backup older than two weeks (or none) is due.
export const backupDue = (saved: Saved, date: string): boolean =>
  saved.history.length > 0 && (!saved.lastBackup || daysBetween(saved.lastBackup, date) >= BACKUP_DUE_DAYS)

// "Not backed up yet", "Last backup today", "Last backup yesterday" or "Last backup 14 days ago".
export const describeLastBackup = (lastBackup: string | undefined, date: string): string => {
  if (!lastBackup) return 'Not backed up yet'
  const days = daysBetween(lastBackup, date)
  return `Last backup ${days <= 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`}`
}

export const backupFile = (saved: Saved, date: string): File =>
  new File([JSON.stringify(saved, null, 1)], `hifz-tracker-backup-${date}.json`, { type: 'application/json' })

// Share sheet on phones (pick "Save to Drive"); a plain download where sharing files isn't supported.
// False when the person closed the share sheet without saving.
export const shareBackup = async (file: File): Promise<boolean> => {
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: file.name })
      return true
    } catch (e) {
      if ((e as Error).name === 'AbortError') return false // the person closed the share sheet
    }
  }
  const url = URL.createObjectURL(file)
  const a = Object.assign(document.createElement('a'), { href: url, download: file.name })
  a.click()
  URL.revokeObjectURL(url)
  return true
}

export const readBackup = async (file: File): Promise<Saved> => {
  const saved = JSON.parse(await file.text()) as Saved
  if (saved?.version !== 1 || !Array.isArray(saved.progress?.memorised) || !Array.isArray(saved.history)) {
    throw new Error('This file is not a Hifz Tracker backup.')
  }
  return { ...saved, today: saved.today ?? null }
}
