// Light, dark, or following the phone. Kept on this phone only, apart from the saved progress.
export type Theme = 'system' | 'light' | 'dark'

const KEY = 'hifz-theme'

export const loadTheme = (): Theme => {
  try {
    const theme = localStorage.getItem(KEY)
    return theme === 'light' || theme === 'dark' ? theme : 'system'
  } catch {
    return 'system'
  }
}

// The phone's status and navigation bars follow the page colour: by media query when following the phone,
// or fixed to the chosen theme's page colour.
const barColours = new Map<HTMLMetaElement, string>()
export const applyTheme = (theme: Theme) => {
  const root = document.documentElement
  if (theme === 'system') delete root.dataset.theme
  else root.dataset.theme = theme
  const paper = getComputedStyle(root).getPropertyValue('--paper').trim()
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
    if (!barColours.has(meta)) barColours.set(meta, meta.content)
    meta.content = theme === 'system' ? barColours.get(meta)! : paper
  })
}

export const saveTheme = (theme: Theme) => {
  try {
    if (theme === 'system') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, theme)
  } catch {
    // Storage can be unavailable; the choice still applies until the app closes.
  }
  applyTheme(theme)
}
