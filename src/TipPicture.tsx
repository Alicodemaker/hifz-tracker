import { loadTheme } from './theme'
import { TIP_PICTURES } from './tipPictures'
import type { TipId } from './tips'

// A tip's picture, in the popup and in the tips from Settings. The tip's own words say what it shows, so the picture
// is left out for screen readers. A theme chosen in Settings picks its picture; following the phone, the phone does.
export default function TipPicture({ id }: { id: TipId }) {
  const { light, dark } = TIP_PICTURES[id]
  const theme = loadTheme()
  return (
    <div className="tip-picture" aria-hidden="true">
      {dark && theme !== 'system' ? (
        <img src={theme === 'dark' ? dark : light} alt="" />
      ) : (
        <picture>
          {dark && <source srcSet={dark} media="(prefers-color-scheme: dark)" />}
          <img src={light} alt="" />
        </picture>
      )}
    </div>
  )
}
