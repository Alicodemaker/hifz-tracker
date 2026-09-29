// The exact QCF4 mushaf fonts (ADR-0009): never bundled, downloaded once on request from jsDelivr's copy of the
// same pinned package the page data comes from, kept in the browser's Cache Storage, then loaded from there offline.
import qcf from './data/qcf-fonts.json'

const CDN = `https://cdn.jsdelivr.net/npm/quran-qcf4@${qcf.version}/fonts-woff2/`
const CACHE = `qcf4-fonts-${qcf.version}`
const READY_KEY = `qcf4-fonts-ready-${qcf.version}`
const PARALLEL = 4

export const QCF_FONT_COUNT = qcf.fonts.length
// Page fonts are named <font>_W.woff2 in the package; the surah-name font's file is listed with it.
const fontUrl = (name: string) => `${CDN}${name === qcf.names.font ? qcf.names.file : `${name}_W.woff2`}`

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

const fetchInto = async (cache: Cache, name: string) => {
  const url = fontUrl(name)
  if (await cache.match(url)) return
  const response = await fetch(url, { mode: 'cors' })
  if (!response.ok) throw new Error(`Font ${name}: HTTP ${response.status}`)
  await cache.put(url, response)
}

// Download every font once (about 36 MB). Reports progress as fonts finish; resumes where it left off.
// The surah-name font comes too, though it isn't counted: phones that downloaded before it existed fetch it on use.
export const downloadQcfFonts = async (onProgress: (done: number) => void): Promise<void> => {
  const cache = await caches.open(CACHE)
  const queue = [...qcf.fonts]
  let done = 0
  const worker = async () => {
    for (let name = queue.shift(); name; name = queue.shift()) {
      await fetchInto(cache, name)
      onProgress(++done)
    }
  }
  await Promise.all(Array.from({ length: PARALLEL }, worker))
  await fetchInto(cache, qcf.names.font)
  markReady(true)
}

const loaded = new Map<string, Promise<boolean>>()

// Make a page's font usable, from Cache Storage only (no network). Resolves false if it isn't downloaded.
export const loadQcfFont = (fontIndex: number): Promise<boolean> => loadCached(qcf.fonts[fontIndex])

// The surah-name font: from Cache Storage, or fetched once in the background when the page fonts are already here.
export const QCF_NAME_FONT = qcf.names.font
export const qcfNameGlyph = (surah: number) => String.fromCodePoint(qcf.names.firstGlyph + surah - 1)
let nameFont: Promise<boolean> | null = null // one load shared by every banner on the page
export const loadQcfNameFont = (): Promise<boolean> => {
  nameFont ??= (async () => {
    if (await loadCached(QCF_NAME_FONT)) return true
    try {
      await fetchInto(await caches.open(CACHE), QCF_NAME_FONT)
    } catch {
      return false // offline: the bundled font writes the names until next time
    }
    return loadCached(QCF_NAME_FONT)
  })().then((ready) => {
    if (!ready) nameFont = null // try again on a later page
    return ready
  })
  return nameFont
}

const loadCached = (name: string): Promise<boolean> => {
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
