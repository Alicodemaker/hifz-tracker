// The exact QCF4 mushaf fonts (ADR-0009): never bundled, downloaded once on request from jsDelivr's copy of the
// same pinned package the page data comes from, kept in the browser's Cache Storage, then loaded from there offline.
import qcf from './data/qcf-fonts.json'

const CDN = `https://cdn.jsdelivr.net/npm/quran-qcf4@${qcf.version}/fonts-woff2/`
const CACHE = `qcf4-fonts-${qcf.version}`
const READY_KEY = `qcf4-fonts-ready-${qcf.version}`
const PARALLEL = 4

export const QCF_FONT_COUNT = qcf.fonts.length
const fontUrl = (name: string) => `${CDN}${name}_W.woff2`

const markReady = (ready: boolean) => {
  try {
    if (ready) localStorage.setItem(READY_KEY, '1')
    else localStorage.removeItem(READY_KEY)
  } catch {
    // Storage can be unavailable; the Cache Storage check below still works.
  }
}

// True once every font is in Cache Storage.
export const qcfFontsReady = async (): Promise<boolean> => {
  if (!('caches' in window)) return false
  const cache = await caches.open(CACHE)
  const stored = await cache.keys()
  const ready = stored.length >= QCF_FONT_COUNT
  markReady(ready)
  return ready
}

// Download every font once (about 36 MB). Reports progress as fonts finish; resumes where it left off.
export const downloadQcfFonts = async (onProgress: (done: number) => void): Promise<void> => {
  const cache = await caches.open(CACHE)
  const queue = [...qcf.fonts]
  let done = 0
  const worker = async () => {
    for (let name = queue.shift(); name; name = queue.shift()) {
      const url = fontUrl(name)
      if (!(await cache.match(url))) {
        const response = await fetch(url, { mode: 'cors' })
        if (!response.ok) throw new Error(`Font ${name}: HTTP ${response.status}`)
        await cache.put(url, response)
      }
      onProgress(++done)
    }
  }
  await Promise.all(Array.from({ length: PARALLEL }, worker))
  markReady(true)
}

const loaded = new Map<string, Promise<boolean>>()

// Make a page's font usable, from Cache Storage only (no network). Resolves false if it isn't downloaded.
export const loadQcfFont = (fontIndex: number): Promise<boolean> => {
  const name = qcf.fonts[fontIndex]
  if (!loaded.has(name)) {
    loaded.set(
      name,
      (async () => {
        if (!('caches' in window)) return false
        const response = await caches.match(fontUrl(name))
        if (!response) {
          loaded.delete(name) // not downloaded yet: try again next time
          return false
        }
        const face = new FontFace(name, await response.arrayBuffer())
        await face.load()
        document.fonts.add(face)
        return true
      })().catch(() => {
        loaded.delete(name)
        return false
      }),
    )
  }
  return loaded.get(name)!
}
