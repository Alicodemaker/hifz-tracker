import { describe, expect, it } from 'vitest'
import { backupDue, describeLastBackup } from './backup'
import { startDay, type Saved } from './day'

const progress = { memorised: [114], hifzNext: { surah: 113, ayah: 1 }, murajaNext: null }
const fresh = startDay({ version: 1, progress, today: null, history: [] }, '2026-10-01')
const logged: Saved = { ...fresh, history: [{ ...fresh.today!, rabtDone: true }] }

describe('backupDue', () => {
  it('waits until something has been logged', () => {
    expect(backupDue(fresh, '2026-10-30')).toBe(false)
  })

  it('without a backup, is due once the app has been used for two weeks', () => {
    expect(backupDue(logged, '2026-10-14')).toBe(false) // first logged day 13 days ago
    expect(backupDue(logged, '2026-10-15')).toBe(true) // 14 days
  })

  it('is due two weeks after the last backup', () => {
    expect(backupDue({ ...logged, lastBackup: '2026-09-29' }, '2026-10-12')).toBe(false) // 13 days
    expect(backupDue({ ...logged, lastBackup: '2026-09-28' }, '2026-10-12')).toBe(true) // 14 days
  })
})

describe('describeLastBackup', () => {
  it('says when the last backup was', () => {
    expect(describeLastBackup(undefined, '2026-10-12')).toBe('Not backed up yet')
    expect(describeLastBackup('2026-10-12', '2026-10-12')).toBe('Last backup today')
    expect(describeLastBackup('2026-10-11', '2026-10-12')).toBe('Last backup yesterday')
    expect(describeLastBackup('2026-09-28', '2026-10-12')).toBe('Last backup 14 days ago')
  })
})
