import type { Range } from './plan'
import { pageOf } from './quran'

// Where the small triangle pins of today's portion sit on a page: on the ayah-end sign just before its first
// ayah (or, with no such sign on the page, above that ayah's first word) and on its own last ayah-end sign.
// Keys are "<surah>:<ayah>"; `signsOnPage` holds the ayahs whose end sign is printed on the page.
export const portionPins = (
  portion: Range[] | null,
  page: number,
  signsOnPage: Set<string>,
): { signs: Set<string>; startWord: string | null } => {
  const signs = new Set<string>()
  let startWord: string | null = null
  if (!portion?.length) return { signs, startWord }
  const first = portion[0]
  const last = portion[portion.length - 1]
  if (pageOf({ surah: first.surah, ayah: first.from }) === page) {
    const before = `${first.surah}:${first.from - 1}`
    if (first.from > 1 && signsOnPage.has(before)) signs.add(before)
    else startWord = `${first.surah}:${first.from}`
  }
  const end = `${last.surah}:${last.to}`
  if (signsOnPage.has(end)) signs.add(end)
  return { signs, startWord }
}
