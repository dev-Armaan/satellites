/**
 * Captures the proof the video shows: screenshots of the articles, the Show HN thread, each comment in the flood and
 * the posts on X, all listed in src/data/proof.json.
 *
 * Why screenshots (owner): a quote set in the video's own type is a claim, a screenshot is the thing itself. So the
 * pages are captured as they are served and are only ever cropped: nothing in a capture is rewritten. What the script
 * does change is layout, so that a capture reads at video size: a narrow viewport (pages give their phone layout, with
 * larger type for the width), comments set to a fixed measure, and page furniture hidden (cookie banners, ad slots,
 * HN's vote arrows and reply links).
 *
 *   node scripts/capture-proof.cjs
 *
 * The captures and their sizes (public/proof/sizes.json, which the flood's layout reads) are generated, never
 * committed: they are other people's pages and words, and megabytes. CBC's pages refuse cloud addresses, so their two
 * cards have no screenshot until one is added by hand as public/proof/press-cbc.png / press-cbc-radio.png.
 * X is read through its public embed (platform.twitter.com), which needs no account.
 * Playwright is not a dependency of this folder (see capture-product.cjs).
 */
const { chromium } = require('playwright')
const fs = require('node:fs')
const path = require('node:path')
const proof = require('../src/data/proof.json')

const OUT = path.join(__dirname, '..', 'public', 'proof')
const SCALE = 3
/** Times on a post are shown in the viewer's zone; the maker's is used. */
const ZONE = 'America/Toronto'
const sizes = {}

async function save(name, shot) {
  const file = path.join(OUT, `${name}.png`)
  const buffer = await shot(file)
  // PNG: width and height are the two big-endian words after the IHDR tag.
  sizes[name] = [buffer.readUInt32BE(16), buffer.readUInt32BE(20)]
  console.log('captured', name, sizes[name].join('×'))
}

/** An article's top: masthead, headline, the first lines. `prepare` clears whatever covers it. */
async function article(browser, name, url, prepare, clip) {
  const ctx = await browser.newContext({ viewport: { width: 600, height: 1000 }, deviceScaleFactor: SCALE, locale: 'en-CA', timezoneId: ZONE })
  const page = await ctx.newPage()
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForTimeout(4000)
    if (prepare) await prepare(page)
    await page.waitForTimeout(800)
    await page.evaluate(() => window.scrollTo(0, 0))
    const box = typeof clip === 'function' ? await clip(page) : clip
    await save(name, (file) => page.screenshot({ path: file, clip: box }))
  } catch (e) {
    console.error('FAILED', name, String(e.message).split('\n')[0])
  }
  await ctx.close()
}

/** The thread's head as a phone shows it: the orange bar and the title, cropped above the line that names the submitter. */
async function threadHead(browser) {
  const ctx = await browser.newContext({ viewport: { width: 400, height: 800 }, deviceScaleFactor: 4, isMobile: true, hasTouch: true, timezoneId: ZONE })
  const page = await ctx.newPage()
  try {
    // 'load', not 'domcontentloaded': the bar's logo is an image.
    await page.goto(`https://news.ycombinator.com/item?id=${proof.thread}`, { waitUntil: 'load', timeout: 60000 })
    await page.waitForTimeout(1000)
    await page.addStyleTag({ content: `tr[id="${proof.thread}"] td { padding-bottom: 12px !important; }` })
    const title = await page.locator(`tr[id="${proof.thread}"]`).boundingBox()
    const main = await page.locator('#hnmain').boundingBox()
    await save('press-hn', (file) => page.screenshot({ path: file, clip: { x: main.x, y: main.y, width: main.width, height: title.y + title.height - main.y } }))
  } catch (e) {
    console.error('FAILED', 'press-hn', String(e.message).split('\n')[0])
  }
  await ctx.close()
}

async function comments(browser) {
  // 4×: the first cards of the flood are shown wider than three times their CSS width.
  const ctx = await browser.newContext({ viewport: { width: 900, height: 1200 }, deviceScaleFactor: 4, timezoneId: ZONE })
  const page = await ctx.newPage()
  await page.goto(`https://news.ycombinator.com/item?id=${proof.thread}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  // Each comment as a card: its own cell, at one narrow measure (so its type is large for its width), on HN's own paper.
  await page.addStyleTag({
    content: `
      td.ind, td.votelinks, td.default .navs, td.default .reply { display: none !important; }
      td.default { display: block !important; box-sizing: border-box; width: 336px !important; padding: 14px 18px 16px !important; background: #f6f6ef !important; }
    `,
  })
  const ids = [proof.hero.id, ...proof.flood.filter((c) => c.hn).map((c) => c.hn)]
  for (const id of ids) {
    try {
      await save(`hn-${id}`, (file) => page.locator(`tr[id="${id}"] td.default`).first().screenshot({ path: file }))
    } catch (e) {
      console.error('FAILED', `hn-${id}`, String(e.message).split('\n')[0])
    }
  }
  await ctx.close()
}

async function posts(browser) {
  const ids = [proof.hook.id, ...proof.flood.filter((c) => c.x).map((c) => c.x)]
  for (const id of ids) {
    const ctx = await browser.newContext({ viewport: { width: 560, height: 1000 }, deviceScaleFactor: SCALE, locale: 'en-CA', timezoneId: ZONE })
    const page = await ctx.newPage()
    try {
      await page.goto(`https://platform.twitter.com/embed/Tweet.html?id=${id}&theme=dark&dnt=true`, { waitUntil: 'domcontentloaded', timeout: 60000 })
      await page.waitForSelector('article', { timeout: 30000 })
      await page.waitForTimeout(3000)
      await page.addStyleTag({ content: 'html, body { background: transparent !important; }' })
      await save(`x-${id}`, (file) => page.locator('article').first().screenshot({ path: file, omitBackground: true }))
    } catch (e) {
      console.error('FAILED', `x-${id}`, String(e.message).split('\n')[0])
    }
    await ctx.close()
  }
}

;(async () => {
  fs.mkdirSync(OUT, { recursive: true })
  // Captures added by hand (CBC) keep their sizes across runs.
  for (const file of fs.readdirSync(OUT)) {
    if (!file.endsWith('.png')) continue
    const b = fs.readFileSync(path.join(OUT, file))
    sizes[file.slice(0, -4)] = [b.readUInt32BE(16), b.readUInt32BE(20)]
  }
  const browser = await chromium.launch(process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY } } : {})
  await article(
    browser,
    'press-waterloo',
    'https://cs.uwaterloo.ca/news/waterloo-computer-science-students-satellite-platform',
    async (page) => {
      const accept = page.getByRole('button', { name: /accept all/i })
      if (await accept.count()) await accept.first().click()
    },
    { x: 0, y: 0, width: 600, height: 500 },
  )
  await article(
    browser,
    'press-sapo',
    'https://tek.sapo.pt/extras/site-do-dia/artigos/watched-earth-mostra-que-satelites-passaram-sobre-qualquer-local-e-as-imagens-que-captaram/',
    null,
    // From SAPO's own bar down: above it is an ad slot. The headline sits about 226 px under that bar.
    async (page) => {
      const h1 = await page.locator('h1').first().boundingBox()
      return { x: 0, y: Math.max(0, h1.y - 226), width: 600, height: 500 }
    },
  )
  await threadHead(browser)
  await comments(browser)
  await posts(browser)
  await browser.close()
  fs.writeFileSync(path.join(OUT, 'sizes.json'), JSON.stringify(sizes, null, 1))
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
