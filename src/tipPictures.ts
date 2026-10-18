// The picture with each tip: what it explains, in use, taken from the real app by `npm run screenshots` as a crop across
// the screen. Screens that follow the theme have a dark one too; the Mushaf page stays light.
import surahsDark from './assets/intro/surahs-dark.webp'
import surahsLight from './assets/intro/surahs-light.webp'
import ayahByAyah from './assets/tips/ayah-by-ayah.webp'
import hide from './assets/tips/hide.webp'
import hifzAmountDark from './assets/tips/hifz-amount-dark.webp'
import hifzAmountLight from './assets/tips/hifz-amount-light.webp'
import hifzPage from './assets/tips/hifz-page.webp'
import historyDark from './assets/tips/history-dark.webp'
import historyLight from './assets/tips/history-light.webp'
import murajaPage from './assets/tips/muraja-page.webp'
import nextDayDark from './assets/tips/next-day-dark.webp'
import nextDayLight from './assets/tips/next-day-light.webp'
import pen from './assets/tips/pen.webp'
import rabtPage from './assets/tips/rabt-page.webp'
import rate from './assets/tips/rate.webp'
import type { TipId } from './tips'

export type TipPictureSource = { light: string; dark?: string }

export const TIP_PICTURES: Record<TipId, TipPictureSource> = {
  'hifz-amount': { light: hifzAmountLight, dark: hifzAmountDark },
  'next-day': { light: nextDayLight, dark: nextDayDark },
  'hifz-page': { light: hifzPage },
  'rabt-page': { light: rabtPage },
  'muraja-page': { light: murajaPage },
  'ayah-by-ayah': { light: ayahByAyah },
  hide: { light: hide },
  pen: { light: pen },
  rate: { light: rate },
  surahs: { light: surahsLight, dark: surahsDark },
  history: { light: historyLight, dark: historyDark },
}
