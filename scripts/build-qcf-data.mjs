// Generates src/data/qcf.json from the quran-qcf4 package's page data (MIT). Run: npm run data
// Only the data is bundled. The QCF4 fonts it pairs with are downloaded by the phone on request (ADR-0009).
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// The package doesn't export its files, so read them from node_modules directly.
const dir = fileURLToPath(new URL('../node_modules/quran-qcf4/', import.meta.url))
const version = JSON.parse(readFileSync(`${dir}package.json`, 'utf8')).version

const KIND = { word: 0, end: 1, quarter: 2 }
const BISMILLAH_FONT = 'QCF4_Hafs_01' // every bismillah glyph lives in the first page's font
const NAME_FONT = 'QCF4_QBSML' // surah names, as one calligraphic glyph each (with سورة)
const NAME_GLYPH_BASE = 0xf100 // al-Fatihah; each later surah is the next code
if (!existsSync(`${dir}fonts-woff2/${NAME_FONT}.woff2`)) throw new Error(`No ${NAME_FONT}.woff2 in the package`)
const fonts = []
const pages = []
for (let n = 1; n <= 604; n++) {
  const page = JSON.parse(readFileSync(`${dir}pages/${String(n).padStart(3, '0')}.json`, 'utf8'))
  if (!fonts.includes(page.font)) fonts.push(page.font)
  // Each line is "h<surah>" (surah header), "b<code>" (the bismillah glyph, in QCF4_Hafs_01), or glyphs [code, surah, ayah, kind].
  const lines = page.lines.map((line) => {
    const first = line.words[0]
    if (first.type === 'surah_header') {
      // The app draws each surah's name from the surah-name font by code alone, so check the codes follow the surahs.
      if (first.font !== NAME_FONT || first.code !== NAME_GLYPH_BASE + first.sura - 1) throw new Error(`Page ${n}: surah ${first.sura} header glyph`)
      return `h${first.sura}`
    }
    if (first.type === 'bismillah') {
      if (first.font !== BISMILLAH_FONT) throw new Error(`Page ${n}: bismillah in ${first.font}`)
      return `b${first.code}`
    }
    let last = null
    const glyphs = line.words.map((w) => {
      if (w.font !== page.font) throw new Error(`Page ${n}: glyph in ${w.font}, page font is ${page.font}`)
      // A quarter mark (۞) has no ayah of its own; it belongs to the ayah that follows it.
      const key = w.verse_key ?? line.words.find((o) => o.verse_key && o.position)?.verse_key ?? last
      last = key
      const [surah, ayah] = key.split(':').map(Number)
      return [w.code, surah, ayah, KIND[w.type]]
    })
    return glyphs
  })
  pages.push({ f: fonts.indexOf(page.font), lines })
}

writeFileSync(
  new URL('../src/data/qcf.json', import.meta.url),
  JSON.stringify({ source: `quran-qcf4@${version} page data (MIT, Mohamad Hajj Rabee)`, pages }) + '\n',
)
// The small font list is separate, so the app can offer the download without loading all the page data.
writeFileSync(
  new URL('../src/data/qcf-fonts.json', import.meta.url),
  JSON.stringify({ version, fonts, names: { font: NAME_FONT, file: `${NAME_FONT}.woff2`, firstGlyph: NAME_GLYPH_BASE } }) + '\n',
)
console.log(`Wrote ${pages.length} pages using ${fonts.length} fonts (quran-qcf4@${version})`)
