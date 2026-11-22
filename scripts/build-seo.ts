/**
 * Write what search engines read into dist/, after the app is built (`npm run build` runs this last):
 *
 *   dist/index.html          the landing, with its text under the app
 *   dist/place/<slug>.html   a page per well-known place: the app's index.html with that place's head, place and text
 *   dist/place.html          the list of those pages (/place)
 *   dist/sitemap.xml         every one of them
 *   dist/robots.txt          where the sitemap is
 *
 * The rules are in src/seo/ (which places, what each page says); this only reads the files and writes the results.
 * Cloudflare serves `place/<slug>.html` at /place/<slug> and `place.html` at /place (wrangler.jsonc's default HTML
 * handling), through the Worker, so a preview host marks them noindex (worker/router.ts).
 *
 * The origin is read back from the built index.html (vite.config.ts wrote it there from VITE_SITE_ORIGIN), so the
 * pages can never name another origin than the app does.
 *
 * Usage: npx tsx scripts/build-seo.ts [dist dir]
 */
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { DEFAULT_CARD_ALT } from '../api/_lib/cardSpec.ts'
import { placeDescription, placeTitle } from '../api/_lib/share.ts'
import { placeCardUrl } from '../api/s.ts'
import { PLACES_VERSION } from '../src/imagery/localPlaces.gen.ts'
import { PLACE_PREFIX } from '../src/lib/placePage.ts'
import { directoryPage, homePage, placePage, robotsTxt, sitemapXml } from '../src/seo/pages.ts'
import { nearest, parseCityRows, parseLandmarkRows, selectPlaces, type SeoPlace } from '../src/seo/places.ts'
import { CITY_NAMES } from './landmarks.ts'

const DIST = process.argv[2] ?? 'dist'
const PLACES = join('public', 'places', PLACES_VERSION)
/** Pages each place page links to, nearest first. */
const NEAR = 12
/** Places the landing's text names: the landmarks people search for most come first in the list (scripts/landmarks.ts). */
const FEATURED = 40

const regions = new Intl.DisplayNames(['en'], { type: 'region' })
function countryName(cc: string): string {
  try {
    return regions.of(cc) ?? cc
  } catch {
    return cc
  }
}

const template = readFileSync(join(DIST, 'index.html'), 'utf8')
const origin = /<link rel="canonical" href="(https?:\/\/[^"/]+)\/" \/>/.exec(template)?.[1]
if (!origin) throw new Error(`${DIST}/index.html has no canonical link to read the site's origin from`)

const cities = readdirSync(join(PLACES, 't')).flatMap((f) => parseCityRows(readFileSync(join(PLACES, 't', f), 'utf8')))
const landmarks = parseLandmarkRows(readFileSync(join(PLACES, 'l.txt'), 'utf8'))
const places = selectPlaces(cities, landmarks, countryName, new Set(CITY_NAMES.map(([name]) => name)))

/** The same words and card an address-bar link to the place unfurls into (api/s.ts). */
const social = (p: SeoPlace) => ({ title: placeTitle(p), description: placeDescription(p), image: placeCardUrl(origin, p), imageAlt: DEFAULT_CARD_ALT })

const dir = join(DIST, PLACE_PREFIX.slice(1))
rmSync(dir, { recursive: true, force: true })
mkdirSync(dir, { recursive: true })
for (const p of places) writeFileSync(join(dir, `${p.slug}.html`), placePage(template, origin, p, nearest(p, places, NEAR), social(p)))

// The built app's stylesheets carry the tokens, the fonts and the text pages' own rules (src/styles/static.css).
const stylesheets = [...template.matchAll(/<link rel="stylesheet"[^>]*href="([^"]+)"/g)].map((m) => m[1])
writeFileSync(`${dir}.html`, directoryPage({ origin, places, stylesheets, countryName }))
writeFileSync(join(DIST, 'index.html'), homePage(template, origin, places.slice(0, FEATURED)))
writeFileSync(join(DIST, 'sitemap.xml'), sitemapXml(origin, places))
writeFileSync(join(DIST, 'robots.txt'), robotsTxt(origin))

const kinds = (k: SeoPlace['kind']) => places.filter((p) => p.kind === k).length
console.log(`seo: ${places.length} place pages (${kinds('landmark')} landmarks, ${kinds('city')} cities) for ${origin}`)
