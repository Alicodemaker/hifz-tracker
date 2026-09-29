// Generates src/data/quran.json from npm data packages. Run: npm run data
// Page and juz data: quran-meta (MIT), Hafs riwaya, 15-line Madani mushaf.
// Ayah lengths: counted from the Uthmani text in quran-json (CC BY-SA 4.0, Risan Bagja Pradana).
import { writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { findPage, getJuzMeta, getSurahMeta, meta } from 'quran-meta/hafs'

const require = createRequire(import.meta.url)
const text = require('quran-json/dist/quran.json')

// Letters only: drop diacritics (combining marks), spaces and pause marks.
const letterCount = (s) => s.normalize('NFC').replace(/[\p{M}\sۖ-ۭ]/gu, '').length

const surahs = []
const ayahPage = []
const ayahLetters = []
for (let s = 1; s <= meta.numSurahs; s++) {
  const m = getSurahMeta(s)
  const t = text[s - 1]
  if (t.verses.length !== m.ayahCount) throw new Error(`Ayah count mismatch in surah ${s}`)
  surahs.push({ name: t.transliteration, ayahs: m.ayahCount })
  for (let a = 1; a <= m.ayahCount; a++) {
    ayahPage.push(findPage(s, a))
    ayahLetters.push(letterCount(t.verses[a - 1].text))
  }
}

// Each ayah's share of its page, so every page sums to 1.
const pageLetters = new Array(meta.numPages + 1).fill(0)
ayahPage.forEach((p, i) => (pageLetters[p] += ayahLetters[i]))
const ayahSize = ayahLetters.map((n, i) => Math.round((n / pageLetters[ayahPage[i]]) * 10000) / 10000)

const juzStarts = []
for (let j = 1; j <= meta.numJuzs; j++) juzStarts.push(getJuzMeta(j).first)

const data = {
  source: 'quran-meta (MIT) for pages and juz; quran-json (CC BY-SA 4.0, Risan Bagja Pradana) for ayah lengths',
  surahs,
  juzStarts,
  ayahPage,
  ayahSize,
}
writeFileSync(new URL('../src/data/quran.json', import.meta.url), JSON.stringify(data) + '\n')
console.log(`Wrote ${surahs.length} surahs, ${ayahPage.length} ayahs, ${juzStarts.length} juz`)
