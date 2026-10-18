// Takes the pictures of the intro (src/assets/intro/) and the tips (src/assets/tips/) from the real app.
// Run: npm run screenshots
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
const intro = join(root, 'src/assets/intro')
const tips = join(root, 'src/assets/tips')
const raw = join(tmpdir(), 'hifz-screenshots')
const fonts = join(root, 'node_modules/quran-qcf4/fonts-woff2')
for (const dir of [intro, tips, raw]) mkdirSync(dir, { recursive: true })

const server = await createServer({ root, server: { port: 5188, strictPort: true }, logLevel: 'error' })
await server.listen()
const url = `http://localhost:5188${server.config.base}`
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM })

const PHONE = { width: 375, height: 760 }

// A phone that has finished setup with Juz 29 and 30 memorised, and some Surahs rated.
// Every Surah on the pictured pages is rated, so no rating reminder opens over them, and every tip has been seen.
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
  await page.evaluate(async (tips) => (await import(tips)).seeAllTips(), `${server.config.base}src/tips.ts`)
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
  await closeRating(page)
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(600)
}

const webp = (png, dir, name, width) =>
  execFileSync('convert', [png, '-resize', `${width}x`, '-quality', '82', join(dir, `${name}.webp`)])

// A whole phone screen (the intro shows two side by side) or a crop across the screen's width. Tip pictures are all
// crops, at most TIP_HEIGHT tall, so they stay readable and leave the tip's words in view.
const shot = async (page, dir, name, width, clip) => {
  const png = join(raw, `${name}.png`)
  await page.screenshot({ path: png, clip })
  webp(png, dir, name, width)
}
const PHONE_WIDTH = 440
const CROP_WIDTH = 940
const TIP_HEIGHT = 270
const across = (y, height) => ({ x: 0, y: Math.max(0, y), width: PHONE.width, height: Math.min(height, TIP_HEIGHT * 2) })
const tipCrop = (y, height) => across(y, Math.min(height, TIP_HEIGHT))
// Ayah by ayah on a short screen: the zoomed ayahs and the buttons under them, in a tip picture's height.
const SHORT = { width: PHONE.width, height: TIP_HEIGHT }

// Close the rating panel, if it opened by itself as a reminder.
const closeRating = async (page) => {
  const rate = page.locator('.mushaf .rate[aria-expanded="true"]')
  if (await rate.isVisible()) await rate.click()
}

// Intro 3: a whole surah in the mushaf, in the exact font.
{
  const page = await newPhone('light', 3)
  await openPage(page, 604)
  // From al-Ikhlas's banner to just before al-Falaq's.
  const [ikhlas, falaq] = await Promise.all([0, 1].map((i) => page.locator('.surah-badge').nth(i).boundingBox()))
  await shot(page, intro, 'mushaf', 1000, across(ikhlas.y - 8, falaq.y - ikhlas.y))
}

// Intro 4: the page's tools. Ayah by ayah (opened from Hifz, three ayahs in), and hide mode with the pen.
{
  const page = await newPhone()
  await page.locator('section.hifz').click()
  await exactFont(page)
  await page.getByRole('button', { name: '+ ayah' }).click()
  await page.getByRole('button', { name: '+ ayah' }).click()
  await page.waitForTimeout(800)
  await shot(page, intro, 'ayah-by-ayah', PHONE_WIDTH)

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
  await shot(page, intro, 'hide-and-pen', PHONE_WIDTH)
}

// Intro 5: the Surahs screen's first rating groups, in each theme. The Surahs tip shows them too.
for (const scheme of ['light', 'dark']) {
  const page = await newPhone(scheme, 3)
  await page.getByRole('button', { name: 'Surahs' }).click()
  const top = await page.locator('.rating-group').first().boundingBox()
  await shot(page, intro, `surahs-${scheme}`, CROP_WIDTH, across(top.y - 12, 250))
}

// Tips on Today and History, in each theme: the Hifz amount, a finished day with its Undo, and History with that day.
for (const scheme of ['light', 'dark']) {
  const page = await newPhone(scheme, 3)
  const range = await page.locator('.hifz .range').boundingBox()
  const stepper = await page.locator('.hifz .stepper').boundingBox()
  await shot(page, tips, `hifz-amount-${scheme}`, CROP_WIDTH, tipCrop(range.y - 12, stepper.y + stepper.height - range.y + 24))
  for (const kind of ['Hifz', 'Rabt', "Muraja'a"]) {
    const done = page.locator('.done-buttons').getByRole('button', { name: kind, exact: true })
    if (await done.isEnabled()) await done.click()
  }
  await page.locator('.celebration').waitFor({ state: 'detached', timeout: 10000 })
  const buttons = await page.locator('.done-buttons').boundingBox()
  const bar = await page.locator('.action-bar').boundingBox()
  await shot(page, tips, `next-day-${scheme}`, CROP_WIDTH, tipCrop(buttons.y - 4, bar.y + bar.height - buttons.y + 4))
  await page.getByRole('button', { name: 'History' }).click()
  const heading = await page.getByRole('heading', { name: 'Backup' }).boundingBox()
  const backup = await page.locator('.backup-buttons').boundingBox()
  await shot(page, tips, `history-${scheme}`, CROP_WIDTH, tipCrop(heading.y - 16, backup.y + backup.height - heading.y + 20))
}

// Tips on the Mushaf page, which stays light in any theme.
{
  const page = await newPhone('light', 3)
  const back = () => page.getByRole('button', { name: 'Back to Today' }).click()
  // The first triangle that marks today's portion, and what is around it.
  const aroundPin = async () => (await page.locator('.qcf-glyph.pin').first().boundingBox()).y

  // On a short screen: opened from Hifz, ayah by ayah, one ayah in. Then, for the ayah by ayah tip, al-Ikhlas three
  // ayahs in: its ayahs are short enough to stay zoomed in at that height.
  await page.locator('section.hifz').click()
  await exactFont(page)
  await page.setViewportSize(SHORT)
  await page.waitForTimeout(800)
  await shot(page, tips, 'hifz-page', CROP_WIDTH)
  await back()
  await openPage(page, 604)
  await page.getByRole('button', { name: 'Ayah by ayah' }).click()
  await page.getByRole('button', { name: '+ ayah' }).click()
  await page.getByRole('button', { name: '+ ayah' }).click()
  await page.waitForTimeout(800)
  await shot(page, tips, 'ayah-by-ayah', CROP_WIDTH)
  await page.setViewportSize(PHONE)
  await back()

  // Opened from Rabt: the triangle at the start of today's Rabt, under the page's header with its star.
  await page.locator('.revision li').nth(0).click()
  await exactFont(page)
  await closeRating(page)
  await page.waitForTimeout(600)
  await shot(page, tips, 'rabt-page', CROP_WIDTH, tipCrop(0, (await aroundPin()) + 110))

  // The rating panel, opened from the star.
  await page.locator('.mushaf .rate').click()
  const panel = await page.locator('.page-rating').boundingBox()
  await shot(page, tips, 'rate', CROP_WIDTH, tipCrop(0, panel.y + panel.height + 16))
  await closeRating(page)

  // Hide mode, with the second ayah tapped to show it.
  await page.getByRole('button', { name: 'Hide the text' }).click()
  const words = page.locator('.qcf-glyph.word')
  const second = await words.nth(0).evaluate((first) => {
    const [surah, ayah] = first.dataset.ayah.split(':')
    return `${surah}:${Number(ayah) + 1}`
  })
  await page.locator(`.qcf-glyph.word[data-ayah="${second}"]`).first().click()
  const lines = await page.locator('.surah-badge').first().boundingBox()
  await page.waitForTimeout(400)
  await shot(page, tips, 'hide', CROP_WIDTH, tipCrop(lines.y - 8, TIP_HEIGHT))
  await page.getByRole('button', { name: 'Show the text' }).click()

  // The pen: a weak spot underlined in red near the foot of the page, with the bin and the page-turn buttons it brings.
  await page.getByRole('button', { name: 'Draw on the page' }).click()
  const foot = PHONE.height - TIP_HEIGHT
  const low = await page.locator('.qcf-glyph.word').evaluateAll(
    (words, top) => words.filter((w) => w.getBoundingClientRect().top > top + 30).map((w) => w.dataset.ayah)[0],
    foot,
  )
  const boxes = (await Promise.all((await page.locator(`.qcf-glyph.word[data-ayah="${low}"]`).all()).map((w) => w.boundingBox())))
    .filter((b) => b.y > foot + 30)
    .filter((b, _, all) => Math.abs(b.y - all[0].y) < 5) // its words on one line
  const right = Math.max(...boxes.map((b) => b.x + b.width))
  const left = Math.max(Math.min(...boxes.map((b) => b.x)), right - 220)
  const y = Math.max(...boxes.map((b) => b.y + b.height)) - 2
  await page.mouse.move(right, y)
  await page.mouse.down()
  for (let i = 1; i <= 16; i++) await page.mouse.move(right - ((right - left) * i) / 16, y + Math.sin(i / 2) * 2)
  await page.mouse.up()
  await page.waitForTimeout(400)
  await shot(page, tips, 'pen', CROP_WIDTH, tipCrop(foot, TIP_HEIGHT))
  await page.getByRole('button', { name: 'Clear page' }).click()
  await page.getByRole('button', { name: 'Stop drawing' }).click()
  await back()

  // Opened from Muraja'a: the triangle at the start of today's Muraja'a.
  await page.locator('.revision li').nth(1).click()
  await exactFont(page)
  await closeRating(page)
  await page.waitForTimeout(600)
  const pin = await aroundPin()
  await shot(page, tips, 'muraja-page', CROP_WIDTH, tipCrop(pin - 100, 240)) // below the header's buttons
}

await browser.close()
await server.close()
rmSync(raw, { recursive: true, force: true })
