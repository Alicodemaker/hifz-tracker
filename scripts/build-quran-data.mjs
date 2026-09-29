// Generates src/data/quran.json from npm data packages. Run: npm run data
// Page numbers: KFGQPC 1441H 15-line Madani layout via @quran.ws/text (CC BY 4.0), the same edition the Mushaf page shows.
// Surah and juz data: quran-meta (MIT), Hafs riwaya.
// Ayah lengths: counted from the Uthmani text in quran-json (CC BY-SA 4.0, Risan Bagja Pradana).
import { writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { Mushaf } from '@quran.ws/text'
import { getJuzMeta, getRubAlHizbMeta, getSurahMeta, meta } from 'quran-meta/hafs'

const require = createRequire(import.meta.url)
const text = require('quran-json/dist/quran.json')
const kfgqpc = await Mushaf.hafs()

// Letters only: drop diacritics (combining marks), spaces and pause marks.
const letterCount = (s) => s.normalize('NFC').replace(/[\p{M}\sۖ-ۭ]/gu, '').length

const surahs = []
const ayahPage = []
const ayahLetters = []
for (let s = 1; s <= meta.numSurahs; s++) {
  const m = getSurahMeta(s)
  const t = text[s - 1]
  if (t.verses.length !== m.ayahCount) throw new Error(`Ayah count mismatch in surah ${s}`)
  surahs.push({ name: t.transliteration, arabic: m.name, ayahs: m.ayahCount })
  for (let a = 1; a <= m.ayahCount; a++) {
    ayahPage.push(kfgqpc.surah(s).ayah(a).page.number)
    ayahLetters.push(letterCount(t.verses[a - 1].text))
  }
}

// Each ayah's share of its page, so every page sums to 1.
const pageLetters = new Array(meta.numPages + 1).fill(0)
ayahPage.forEach((p, i) => (pageLetters[p] += ayahLetters[i]))
const ayahSize = ayahLetters.map((n, i) => Math.round((n / pageLetters[ayahPage[i]]) * 10000) / 10000)

const juzStarts = []
for (let j = 1; j <= meta.numJuzs; j++) juzStarts.push(getJuzMeta(j).first)

// The 240 quarters (rub' al-hizb); each juz has 8.
const rubStarts = []
for (let r = 1; r <= meta.numRubAlHizbs; r++) rubStarts.push(getRubAlHizbMeta(r).first)

const data = {
  source: 'KFGQPC 1441H pages via @quran.ws/text (CC BY 4.0); quran-meta (MIT) for surahs and juz; quran-json (CC BY-SA 4.0, Risan Bagja Pradana) for ayah lengths',
  surahs,
  juzStarts,
  rubStarts,
  ayahPage,
  ayahSize,
}
writeFileSync(new URL('../src/data/quran.json', import.meta.url), JSON.stringify(data) + '\n')
console.log(`Wrote ${surahs.length} surahs, ${ayahPage.length} ayahs, ${juzStarts.length} juz`)
