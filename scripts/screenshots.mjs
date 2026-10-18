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
  execFileSync('convert', [png, '-resize', `${width}x>`, '-quality', '82', join(dir, `${name}.webp`)])

// A whole phone screen (the intro shows two side by side) or a crop across the screen's width.
const shot = async (page, dir, name, width, clip) => {
  const png = join(raw, `${name}.png`)
  await page.screenshot({ path: png, clip })
  webp(png, dir, name, width)
}
const PHONE_WIDTH = 440
const CROP_WIDTH = 940
const across = (y, height) => ({ x: 0, y: Math.max(0, y), width: PHONE.width, height })
// Ayah by ayah on a short screen, so the zoomed ayahs and their buttons fit in one tip picture.
const SHORT = { width: PHONE.width, height: 270 }

// Tip pictures zoom in on what the tip is about, with a gold ring around each thing to tap or look at: a circle round
// a round button, a pill round the rest. Every ring is something the tip's words name, and the words name nothing the
// picture doesn't show. The crop is a small area around the rings (shown larger in the tip), unless the rings need
// more room or `area` gives it outright; `pad` is the gap between a pill and what it rings.
const RING = '#f0b429'
const box = async (locator) => locator.first().boundingBox()
const focus = async (page, name, targets, { width = 260, height = 170, at, area, pad = 7 } = {}) => {
  const rects = targets.filter(Boolean)
  const left = Math.min(...rects.map((r) => r.x))
  const top = Math.min(...rects.map((r) => r.y))
  const right = Math.max(...rects.map((r) => r.x + r.width))
  const bottom = Math.max(...rects.map((r) => r.y + r.height))
  const view = page.viewportSize()
  const w = Math.min(view.width, Math.max(width, right - left + 48))
  const h = Math.min(view.height, Math.max(height, bottom - top + 48))
  const centre = at ?? { x: (left + right) / 2, y: (top + bottom) / 2 }
  // Around the centre, but always with room for the rings, and within the screen.
  const keep = 16
  const x = Math.min(Math.max(0, Math.min(Math.max(centre.x - w / 2, right + keep - w), left - keep)), view.width - w)
  const y = Math.min(Math.max(0, Math.min(Math.max(centre.y - h / 2, bottom + keep - h), top - keep)), view.height - h)
  await page.evaluate(
    ({ rects, colour, pad }) =>
      rects.forEach((r) => {
        const round = Math.abs(r.width - r.height) < 8
        const side = Math.max(r.width, r.height) + 12
        const ring = document.createElement('div')
        ring.className = 'shot-ring'
        Object.assign(ring.style, {
          position: 'fixed',
          zIndex: 99999,
          pointerEvents: 'none',
          left: `${round ? r.x + r.width / 2 - side / 2 : r.x - pad}px`,
          top: `${round ? r.y + r.height / 2 - side / 2 : r.y - pad}px`,
          width: `${round ? side : r.width + pad * 2}px`,
          height: `${round ? side : r.height + pad * 2}px`,
          borderRadius: '999px',
          border: `3px solid ${colour}`,
          boxShadow: '0 0 0 2px rgb(255 255 255 / 70%), 0 0 14px rgb(240 180 41 / 55%)',
        })
        document.body.append(ring)
      }),
    { rects, colour: RING, pad },
  )
  await shot(page, tips, name, CROP_WIDTH, area ?? { x, y, width: w, height: h })
  await page.evaluate(() => document.querySelectorAll('.shot-ring').forEach((ring) => ring.remove()))
}

// The green triangle that marks the start of today's portion: drawn before its first glyph, so measured from there.
const triangle = (page) =>
  page.locator('.qcf-glyph.pin').first().evaluate((glyph) => {
    const at = glyph.getBoundingClientRect()
    const mark = getComputedStyle(glyph, '::before')
    return { x: at.x + parseFloat(mark.left), y: at.y + parseFloat(mark.top), width: parseFloat(mark.width), height: parseFloat(mark.height) }
  })

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

// Intro 5: the Surahs screen's first rating groups, in each theme.
for (const scheme of ['light', 'dark']) {
  const page = await newPhone(scheme, 3)
  await page.getByRole('button', { name: 'Surahs' }).click()
  const top = await page.locator('.rating-group').first().boundingBox()
  await shot(page, intro, `surahs-${scheme}`, CROP_WIDTH, across(top.y - 12, 250))
}

// Tips on Today, Surahs and History, in each theme.
for (const scheme of ['light', 'dark']) {
  const page = await newPhone(scheme, 3)
  // The Hifz amount: − and +, with the finish estimate between them.
  const stepper = page.locator('.hifz .stepper')
  const steps = await box(stepper)
  await focus(page, `hifz-amount-${scheme}`, [await box(stepper.locator('button').first()), await box(stepper.locator('button').last())], {
    area: across(steps.y - 16, steps.height + 32),
  })
  // A finished day: its Undo, with a ring round the word itself (its button is wider), clear of the words beside it.
  for (const kind of ['Hifz', 'Rabt', "Muraja'a"]) {
    const done = page.locator('.done-buttons').getByRole('button', { name: kind, exact: true })
    if (await done.isEnabled()) await done.click()
  }
  await page.locator('.celebration').waitFor({ state: 'detached', timeout: 10000 })
  const undo = await box(page.getByRole('button', { name: 'Undo' }))
  await focus(page, `next-day-${scheme}`, [undo], { width: PHONE.width, height: 110, at: { x: PHONE.width / 2, y: undo.y - 10 }, pad: -3 })
  // Surahs: the group's heading, a Surah tapped to rate it, and its book to open it.
  await page.getByRole('button', { name: 'Surahs' }).click()
  const row = page.locator('.surah-list li').first()
  await row.locator('.surah-row').click()
  const group = await box(page.locator('.rating-title'))
  const choices = await box(row.locator('.rating-choices'))
  await focus(page, `surahs-${scheme}`, [choices, await box(row.locator('.surah-open'))], {
    area: across(group.y - 12, choices.y + choices.height + 18 - (group.y - 12)),
  })
  await page.getByRole('button', { name: 'Back to Today' }).click()
  // History: the Backup section, with Back up and Restore.
  await page.getByRole('button', { name: 'History' }).click()
  const backup = page.locator('.backup-buttons')
  await page.addStyleTag({ content: '.backup-hint { visibility: hidden; }' }) // the line under the buttons, cut by the crop
  const heading = await box(page.getByRole('heading', { name: 'Backup' }))
  const buttons = await box(backup)
  const section = { y: heading.y - 14, height: buttons.y + buttons.height + 18 - (heading.y - 14) }
  await focus(page, `history-${scheme}`, [await box(backup.locator('button').first()), await box(backup.locator('button').last())], {
    width: PHONE.width,
    height: section.height,
    at: { x: PHONE.width / 2, y: section.y + section.height / 2 },
  })
}

// The buttons on a Mushaf page fade away after a few seconds; a tap on the page brings them back.
const showButtons = async (page) => {
  if (await page.locator('.mushaf .faded-out').count()) await page.locator('.m-head .m-page').click()
  await page.waitForTimeout(400)
}
const pageButtons = (page) =>
  Promise.all(['.step-toggle', '.hide-toggle', '.pen-toggle'].map((button) => box(page.locator(`.mushaf ${button}`))))
// The page below its header, down to the bottom of the screen.
const belowHead = async (page) => {
  const head = await box(page.locator('.m-head'))
  const y = head.y + head.height + 4
  return across(y, page.viewportSize().height - y)
}
// A screen short enough that the top of a page (its Surah's banner and the first ayahs) and the buttons at the bottom
// fit in one tip picture.
const PAGE_TOP = { width: PHONE.width, height: 330 }

// Tips on the Mushaf page, which stays light in any theme.
{
  const page = await newPhone('light', 3)
  const back = () => page.getByRole('button', { name: 'Back to Today' }).click()
  const stepButtons = () => Promise.all(['.step-tool', '.step-half', '.step-exit'].map((button) => box(page.locator(button))))

  // On a short screen: opened from Hifz, ayah by ayah, one ayah in, with "+ ayah", "2. Half" and ×. Then al-Ikhlas
  // three ayahs in (they are short enough to stay zoomed in at that height).
  await page.locator('section.hifz').click()
  await exactFont(page)
  await page.setViewportSize(SHORT)
  await page.waitForTimeout(800)
  await focus(page, 'hifz-page', await stepButtons(), { area: await belowHead(page) })
  await back()
  await openPage(page, 604)
  await page.getByRole('button', { name: 'Ayah by ayah' }).click()
  await page.getByRole('button', { name: '+ ayah' }).click()
  await page.getByRole('button', { name: '+ ayah' }).click()
  await page.waitForTimeout(800)
  await focus(page, 'ayah-by-ayah', await stepButtons(), { area: await belowHead(page) })
  await page.getByRole('button', { name: 'Show the whole page' }).click()
  await page.setViewportSize(PHONE)
  await back()

  // Opened from Rabt, on a short screen: the triangle at the start of today's Rabt, and the buttons at the bottom.
  await page.locator('.revision li').nth(0).click()
  await exactFont(page)
  await closeRating(page)
  await page.setViewportSize(PAGE_TOP)
  await page.waitForTimeout(600)
  await showButtons(page)
  await focus(page, 'rabt-page', [await triangle(page), ...(await pageButtons(page))], { area: await belowHead(page) })
  await page.setViewportSize(PHONE)
  await page.waitForTimeout(400)

  // The rating panel, opened from the star: the star and the choices, down to the panel's edge (the page's triangle
  // peeks out under it).
  await page.locator('.mushaf .rate').click()
  const panel = await box(page.locator('.page-rating'))
  await focus(page, 'rate', [await box(page.locator('.mushaf .rate')), await box(page.locator('.page-rating-choices'))], {
    area: across(0, panel.y + panel.height + 1),
  })
  await closeRating(page)

  // Hide mode: an ayah near the bottom tapped to show it, and the eye button that shows them all.
  await page.getByRole('button', { name: 'Hide the text' }).click()
  const bottom = across(PHONE.height - 200, 200)
  const shown = await page.locator('.qcf-glyph.word').evaluateAll((words, top) => {
    // The first ayah wholly on one line in the area.
    const lines = new Map()
    for (const w of words) {
      const r = w.getBoundingClientRect()
      const ayah = lines.get(w.dataset.ayah) ?? { ayah: w.dataset.ayah, tops: new Set(), left: r.x, right: r.x + r.width, top: r.y, bottom: r.y + r.height }
      ayah.tops.add(Math.round(r.y))
      Object.assign(ayah, {
        left: Math.min(ayah.left, r.x),
        right: Math.max(ayah.right, r.x + r.width),
        top: Math.min(ayah.top, r.y),
        bottom: Math.max(ayah.bottom, r.y + r.height),
      })
      lines.set(w.dataset.ayah, ayah)
    }
    const ayah = [...lines.values()].find((a) => a.tops.size === 1 && a.top > top + 20 && a.bottom < top + 160)
    return ayah && { ayah: ayah.ayah, x: ayah.left, y: ayah.top, width: ayah.right - ayah.left, height: ayah.bottom - ayah.top }
  }, bottom.y)
  await page.locator(`.qcf-glyph.word[data-ayah="${shown.ayah}"]`).first().click()
  await page.waitForTimeout(400)
  await showButtons(page)
  // From the top of the line two above it, so no ayah sign is cut.
  const from = shown.y - 100
  await focus(page, 'hide', [shown, await box(page.getByRole('button', { name: 'Show the text' }))], { area: across(from, PHONE.height - from), pad: 4 })
  await page.getByRole('button', { name: 'Show the text' }).click()

  // The pen: a weak spot underlined in red near it, the pen, its bin, and ‹ › to turn the page.
  const penButton = await box(page.getByRole('button', { name: 'Draw on the page' }))
  await page.getByRole('button', { name: 'Draw on the page' }).click()
  const zone = { x: penButton.x + penButton.width + 12 - 300, y: penButton.y + penButton.height + 12 - 220 }
  const line = await page.locator('.qcf-glyph.word').evaluateAll(
    (words, { x, y }) =>
      words
        .map((w) => w.getBoundingClientRect())
        .filter((r) => r.x > x + 30 && r.y > y + 20 && r.y + r.height < y + 110)
        .map((r) => ({ left: r.x, right: r.x + r.width, bottom: r.y + r.height })),
    zone,
  )
  const lineBottom = Math.max(...line.filter((r) => Math.abs(r.bottom - line[0].bottom) < 5).map((r) => r.bottom)) - 2
  const right = Math.min(PHONE.width - 16, Math.max(...line.map((r) => r.right)))
  const left = right - 170
  await page.mouse.move(right, lineBottom)
  await page.mouse.down()
  for (let i = 1; i <= 16; i++) await page.mouse.move(right - ((right - left) * i) / 16, lineBottom + Math.sin(i / 2) * 2)
  await page.mouse.up()
  await page.waitForTimeout(400)
  await showButtons(page)
  const pen = ['Stop drawing', 'Clear page', 'Previous page', 'Next page'].map((name) => box(page.getByRole('button', { name })))
  await focus(page, 'pen', await Promise.all(pen), { width: 300, height: 220, at: { x: zone.x + 150, y: zone.y + 110 } })
  await page.getByRole('button', { name: 'Clear page' }).click()
  await page.getByRole('button', { name: 'Stop drawing' }).click()
  await back()

  // Opened from Muraja'a, on a short screen: the triangle at the start of today's Muraja'a, and the buttons.
  await page.locator('.revision li').nth(1).click()
  await exactFont(page)
  await closeRating(page)
  await page.setViewportSize(PAGE_TOP)
  await page.waitForTimeout(600)
  await showButtons(page)
  await focus(page, 'muraja-page', [await triangle(page), ...(await pageButtons(page))], { area: await belowHead(page) })
}

await browser.close()
await server.close()
rmSync(raw, { recursive: true, force: true })
