// Generates src/data/mushaf.json and copies the KFGQPC font. Run: npm run data
// Text and line breaks: @quran.ws/text (CC BY 4.0), KFGQPC Hafs Unicode text, 15-line Madani layout (ADR-0007).
// Font: KFGQPC HAFS Uthmanic Script, King Fahd Glorious Quran Printing Complex. Shipped unmodified, per its licence.
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { Mushaf, ayahMark } from '@quran.ws/text'

const m = await Mushaf.hafs()
const bismillah = m.surah(1).ayah(1).text

// Each page is a list of lines. A line is "h<surah>" (surah header), "b" (bismillah),
// or a list of ayah pieces [surah, ayah, text, 1 if the ayah ends on this line].
const pages = []
for (let n = 1; n <= m.pageCount; n++) {
  const lines = []
  for (const line of m.page(n).lines) {
    const pieces = []
    for (const word of line.wordList) {
      const { surah, number } = word.ayah
      if (number === 1 && word.index === 1) {
        lines.push(`h${surah.number}`)
        if (surah.number !== 1 && surah.number !== 9) lines.push('b')
      }
      const last = pieces[pieces.length - 1]
      if (last && last[0] === surah.number && last[1] === number) last[2] += ` ${word.render(true)}`
      else pieces.push([surah.number, number, word.render(true), 0])
      if (word.index === word.ayah.length) {
        const piece = pieces[pieces.length - 1]
        piece[2] += ` ${ayahMark(number)}`
        piece[3] = 1
      }
    }
    lines.push(pieces)
  }
  pages.push(lines)
}

const out = (path) => fileURLToPath(new URL(path, import.meta.url))
writeFileSync(
  out('../src/data/mushaf.json'),
  JSON.stringify({ source: 'KFGQPC Hafs text and 15-line layout via @quran.ws/text 0.1.0 (CC BY 4.0)', bismillah, pages }) + '\n',
)
mkdirSync(out('../public/fonts'), { recursive: true })
copyFileSync(fileURLToPath(m.font.url), out(`../public/fonts/${m.font.file}`))
console.log(`Wrote ${pages.length} pages; copied ${m.font.file}`)
