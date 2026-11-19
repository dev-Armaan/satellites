/**
 * Captures the product shots the video's last beat cuts through: the real landing page, once per language, at the
 * video's own frame (1280 × 720 CSS px at 1.5×, so 1920 × 1080 with nothing scaled, and the page's desktop layout).
 *
 * Why captures and not a rebuild of the page in Remotion: the beat says "this is the product, and it now speaks your
 * language", so every pixel of it has to be the app's own (its copy, its line breaks, its right-to-left layout). The
 * shots are generated, never committed: they go stale whenever a translation changes, and they would add megabytes to
 * git history on every re-run.
 *
 *   node scripts/capture-product.cjs [app URL]      # default http://127.0.0.1:5173
 *
 * The app at that URL must have the languages (`?hl=<locale>` picks one; `npm run dev` in a checkout that has
 * src/i18n). Nothing but that host is reachable from the page, so a capture never touches analytics or the archives.
 * Playwright is not a dependency of this folder: the script uses whichever one the machine has (cloud sessions ship
 * one with its own Chromium; elsewhere `npm i -g playwright && npx playwright install chromium`).
 * The globe needs WebGL; in a container without a GPU the flags below give it a software one (slow, fine for a still).
 */
const { chromium } = require('playwright')
const fs = require('node:fs')
const path = require('node:path')

const APP = process.argv[2] || 'http://127.0.0.1:5173'
const OUT = path.join(__dirname, '..', 'public', 'product')
// Kept in step with src/data/languages.ts (the order they are cut in does not matter here).
const LOCALES = ['en', 'es', 'fr', 'de', 'pt-BR', 'it', 'nl', 'pl', 'tr', 'id', 'uk', 'ja', 'ko', 'zh-Hans', 'zh-Hant', 'ar']
const VIEW = { width: 1280, height: 720 }

;(async () => {
  fs.mkdirSync(OUT, { recursive: true })
  const host = new URL(APP).hostname
  const browser = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  })
  for (const locale of LOCALES) {
    const ctx = await browser.newContext({ viewport: VIEW, deviceScaleFactor: 1.5 })
    const page = await ctx.newPage()
    await page.route('**/*', (r) => (new URL(r.request().url()).hostname === host ? r.continue() : r.abort()))
    await page.goto(`${APP}/?hl=${locale}&noanalytics=1`, { waitUntil: 'load' })
    // The boot curtain leaves once the globe has its first light; the hero's lines then wipe in.
    await page.waitForSelector('#boot-static', { state: 'detached', timeout: 120000 })
    await page.waitForTimeout(6000)
    const shown = await page.evaluate(() => document.documentElement.getAttribute('data-locale'))
    if (shown !== locale) throw new Error(`asked for ${locale}, the page shows ${shown}: does this app have that language?`)
    await page.screenshot({ path: path.join(OUT, `${locale}.png`) })
    console.log('captured', locale)
    await ctx.close()
  }
  await browser.close()
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
