// Takes the intro's pictures (src/assets/intro/) from the real app. Run: npm run intro-shots
// Needs a Chromium: Playwright's own, or set CHROMIUM to its path.
// The QCF4 fonts are served from node_modules in place of jsDelivr, so the pages show the exact font. The fonts
// themselves never go into the app (ADR-0009); only these pictures of pages set in them do.
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'
import { createServer } from 'vite'

const root = fileURLToPath(new URL('..', import.meta.url))
const out = join(root, 'src/assets/intro')
const raw = join(tmpdir(), 'hifz-intro-shots')
const fonts = join(root, 'node_modules/quran-qcf4/fonts-woff2')
mkdirSync(out, { recursive: true })
mkdirSync(raw, { recursive: true })

const server = await createServer({ root, server: { port: 5188, strictPort: true }, logLevel: 'error' })
await server.listen()
const url = `http://localhost:5188${server.config.base}`
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM })

const PHONE = { width: 375, height: 760 }

// A phone that has finished setup with Juz 29 and 30 memorised, and some Surahs rated.
// Every Surah on the pictured pages is rated, so no rating reminder opens over them.
const RATINGS = { 114: 'strong', 113: 'strong', 112: 'holes', 111: 'holes', 110: 'holes', 109: 'lastPage', 108: 'weak' }
const newPhone = async (colorScheme = 'light', deviceScaleFactor = 2) => {
  const context = await browser.newContext({ viewport: PHONE, deviceScaleFactor, colorScheme })
  await context.route('https://cdn.jsdelivr.net/npm/quran-qcf4@*/fonts-woff2/*', (route) =>
    route.fulfill({
      body: readFileSync(join(fonts, route.request().url().split('/').pop())),
      headers: { 'content-type': 'font/woff2', 'access-control-allow-origin': '*' },
    }),
  )
  const page = await context.newPage()
  await page.goto(url)
  await page.getByRole('button', { name: 'Skip' }).click()
  await page.getByText('Juz 30', { exact: true }).click()
  await page.getByText('Juz 29', { exact: true }).click()
  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('button', { name: 'Start' }).click()
  await page.evaluate((ratings) => {
    const saved = JSON.parse(localStorage.getItem('hifz-tracker'))
    localStorage.setItem('hifz-tracker', JSON.stringify({ ...saved, ratings }))
  }, RATINGS)
  await page.reload()
  return page
}

// The page in the exact font: downloaded the way a phone does it, unless this phone already has it.
const exactFont = async (page) => {
  const glyph = page.locator('.qcf-glyph').first()
  const download = page.getByRole('button', { name: /Download exact mushaf font/ })
  await glyph.or(download).first().waitFor()
  if (await download.isVisible()) await download.click()
  await glyph.waitFor({ state: 'attached', timeout: 120000 })
}

// Open a Mushaf page in the exact font.
const openPage = async (page, n) => {
  await page.goto(`${url}#/page/${n}`)
  await exactFont(page)
  const rate = page.locator('.mushaf .rate[aria-expanded="true"]')
  if (await rate.isVisible()) await rate.click()
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(600)
}

const webp = (png, name, width) =>
  execFileSync('convert', [png, '-resize', `${width}x`, '-quality', '82', join(out, `${name}.webp`)])

const shot = async (page, name, width, clip) => {
  const png = join(raw, `${name}.png`)
  await page.screenshot({ path: png, clip })
  webp(png, name, width)
}

// 3: a whole surah in the mushaf, in the exact font.
{
  const page = await newPhone('light', 3)
  await openPage(page, 604)
  // From al-Ikhlas's banner to just before al-Falaq's.
  const [ikhlas, falaq] = await Promise.all([0, 1].map((i) => page.locator('.surah-badge').nth(i).boundingBox()))
  await shot(page, 'mushaf', 1000, { x: 0, y: ikhlas.y - 8, width: PHONE.width, height: falaq.y - ikhlas.y })
}

// 4: the page's tools. Ayah by ayah (opened from Hifz, three ayahs in), and hide mode with the pen.
{
  const page = await newPhone()
  await page.locator('section.hifz').click()
  await exactFont(page)
  await page.getByRole('button', { name: '+ ayah' }).click()
  await page.getByRole('button', { name: '+ ayah' }).click()
  await page.waitForTimeout(800)
  await shot(page, 'ayah-by-ayah', 440)

  await openPage(page, 603)
  await page.getByRole('button', { name: 'Hide the text' }).click()
  const words = page.locator('.qcf-glyph.word')
  for (const i of [0, 5, 9]) await words.nth(i).click()
  await page.getByRole('button', { name: 'Draw on the page' }).click()
  // Underline a shown ayah, as a weak spot.
  const ayah = await words.nth(5).getAttribute('data-ayah')
  const boxes = await Promise.all((await page.locator(`.qcf-glyph.word[data-ayah="${ayah}"]`).all()).map((w) => w.boundingBox()))
  const right = Math.max(...boxes.map((b) => b.x + b.width))
  const left = Math.min(...boxes.map((b) => b.x))
  const y = Math.max(...boxes.map((b) => b.y + b.height)) - 2
  await page.mouse.move(right, y)
  await page.mouse.down()
  for (let i = 1; i <= 16; i++) await page.mouse.move(right - ((right - left) * i) / 16, y + Math.sin(i / 2) * 2)
  await page.mouse.up()
  await page.waitForTimeout(400)
  await shot(page, 'hide-and-pen', 440)
}

// 5: the Surahs screen's first rating groups, in each theme.
for (const scheme of ['light', 'dark']) {
  const page = await newPhone(scheme, 3)
  await page.getByRole('button', { name: 'Surahs' }).click()
  const top = await page.locator('.rating-group').first().boundingBox()
  await shot(page, `surahs-${scheme}`, 940, { x: 0, y: top.y - 12, width: PHONE.width, height: 250 })
}

await browser.close()
await server.close()
rmSync(raw, { recursive: true, force: true })
