/**
 * What search engines and link previews read: the head of every page, the text under the app, the place pages, the
 * list of them, the sitemap and robots.txt. scripts/build-seo.ts writes them into dist/ after the app is built.
 *
 * Why at build time, as files: both hosts serve them with no code of their own, a page is the app's own index.html
 * (so it can never fall behind a deploy), and nothing a visitor types can make one (src/seo/places.ts).
 *
 * Every page is honest about itself (the product rule):
 *  - A place page IS the app, opened on that place: nobody is sent on to "the real page". Its title and text say
 *    what the visitor is about to see and promise no number: the week's counts exist only once the browser has
 *    computed them, and the app's headline says them then.
 *  - The text under the app (the `#root` it replaces) is the page for a reader that runs no JavaScript: a crawler,
 *    an assistant, a browser with scripts off. It says what the app says and links where the app goes. With scripts
 *    on, React replaces it before the loading screen lifts, so it is never drawn (index.html keeps it `display: none`
 *    until then: it must not count as the page's first content in the speed numbers either).
 *  - The copy is the README's and the About page's, shortened. A change there belongs here too.
 *
 * Pure: strings in, strings out.
 */
import { esc, jsonForScript } from '../../api/_lib/html'
import { HOME_DESCRIPTION, HOME_TITLE, PLACE_PAGE_ID, PLACE_PREFIX, pageTitle, type PagePlace } from '../lib/placePage'
import type { SeoPlace } from './places'

export const HEAD_OPEN = '<!-- seo:head -->'
export const HEAD_CLOSE = '<!-- /seo:head -->'
const ROOT = '<div id="root"></div>'

export interface HeadMeta {
  title: string
  description: string
  /** Absolute URL of this page */
  canonical: string
  /** The link preview: its own words (a card is read apart from the page) and its picture */
  social: { title: string; description: string; image: string; imageType: 'image/png' | 'image/jpeg'; imageAlt: string }
  /** schema.org, as one JSON-LD graph */
  graph: object[]
}

/** The landing's link preview, as it has always read (docs/DESIGN.md §7). */
const HOME_SOCIAL = {
  title: 'Something watched you this week.',
  description: 'Enter any place on Earth. See every satellite that passed over it this week, and the actual pictures they took.',
  imageAlt: 'A real Sentinel-2 satellite photograph of Palm Jumeirah, Dubai, beside the line: Something watched you this week. Enter any place on Earth.',
}

const siteNode = (origin: string) => ({ '@type': 'WebSite', '@id': `${origin}/#site`, url: `${origin}/`, name: 'Watched', description: HOME_DESCRIPTION, inLanguage: 'en' })

export function homeMeta(origin: string): HeadMeta {
  return {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    canonical: `${origin}/`,
    social: { ...HOME_SOCIAL, image: `${origin}/og-default.png`, imageType: 'image/png' },
    graph: [
      siteNode(origin),
      {
        '@type': 'WebApplication',
        '@id': `${origin}/#app`,
        name: 'Watched',
        url: `${origin}/`,
        description: HOME_DESCRIPTION,
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Any',
        browserRequirements: 'Requires JavaScript',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      },
    ],
  }
}

export const placeUrl = (origin: string, place: Pick<SeoPlace, 'slug'>) => `${origin}${PLACE_PREFIX}/${place.slug}`

/** "Paris, Île-de-France, France" */
const fullName = (p: Pick<SeoPlace, 'label' | 'sublabel'>) => (p.sublabel ? `${p.label}, ${p.sublabel}` : p.label)

export const placeDescription = (p: Pick<SeoPlace, 'label' | 'sublabel'>) =>
  `Every satellite that passed over ${fullName(p)} in the last 7 days, and the actual pictures they took: Sentinel-2, Landsat, radar and weather satellites. Free, no sign-up.`

/** A place page's link preview: the words and the card an address-bar link to the same place unfurls into (api/s.ts). */
export interface PlaceSocial {
  title: string
  description: string
  image: string
  /** What the card shows. It is the default card (a photo of Palm Jumeirah), not a picture of the place: say so. */
  imageAlt: string
}

export function placeMeta(origin: string, place: SeoPlace, social: PlaceSocial): HeadMeta {
  const url = placeUrl(origin, place)
  return {
    title: pageTitle(place.label),
    description: placeDescription(place),
    canonical: url,
    social: { ...social, imageType: 'image/jpeg' },
    graph: [
      siteNode(origin),
      { '@type': 'WebPage', '@id': `${url}#page`, url, name: pageTitle(place.label), description: placeDescription(place), inLanguage: 'en', isPartOf: { '@id': `${origin}/#site` }, about: { '@id': `${url}#place` } },
      {
        '@type': 'Place',
        '@id': `${url}#place`,
        name: place.label,
        geo: { '@type': 'GeoCoordinates', latitude: place.lat, longitude: place.lon },
        ...(place.cc ? { address: { '@type': 'PostalAddress', addressCountry: place.cc.toUpperCase() } } : {}),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Watched', item: `${origin}/` },
          { '@type': 'ListItem', position: 2, name: 'Places', item: `${origin}${PLACE_PREFIX}` },
          { '@type': 'ListItem', position: 3, name: place.label },
        ],
      },
    ],
  }
}

/** The tags between the head markers, indented as index.html is (its own copy is this for the landing: pages.test.ts). */
export function headTags(m: HeadMeta): string {
  const lines = [
    `<title>${esc(m.title)}</title>`,
    `<meta name="description" content="${esc(m.description)}" />`,
    `<link rel="canonical" href="${esc(m.canonical)}" />`,
    // A search result may show the card or a photo at full width (a preview host is still noindex, by its header).
    `<meta name="robots" content="max-image-preview:large" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="Watched" />`,
    `<meta property="og:title" content="${esc(m.social.title)}" />`,
    `<meta property="og:description" content="${esc(m.social.description)}" />`,
    `<meta property="og:url" content="${esc(m.canonical)}" />`,
    `<meta property="og:image" content="${esc(m.social.image)}" />`,
    `<meta property="og:image:type" content="${m.social.imageType}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${esc(m.social.imageAlt)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(m.social.title)}" />`,
    `<meta name="twitter:description" content="${esc(m.social.description)}" />`,
    `<meta name="twitter:image" content="${esc(m.social.image)}" />`,
    `<meta name="twitter:image:alt" content="${esc(m.social.imageAlt)}" />`,
    `<script type="application/ld+json">${jsonForScript({ '@context': 'https://schema.org', '@graph': m.graph })}</script>`,
  ]
  return lines.map((l) => `    ${l}`).join('\n')
}

/** `html` with the tags between its head markers replaced. Throws if the markers are gone: a page with the landing's title would be wrong silently. */
export function withHead(html: string, m: HeadMeta): string {
  const a = html.indexOf(HEAD_OPEN)
  const b = html.indexOf(HEAD_CLOSE)
  if (a < 0 || b < a) throw new Error('index.html has lost its <!-- seo:head --> markers')
  return `${html.slice(0, a + HEAD_OPEN.length)}\n${headTags(m)}\n    ${html.slice(b)}`
}

/** `html` with `inner` as the text under the app and, on a place page, the place the app opens on. */
export function withRoot(html: string, inner: string, page?: PagePlace): string {
  if (!html.includes(ROOT)) throw new Error('index.html has lost its empty #root')
  const place = page ? `<script type="application/json" id="${PLACE_PAGE_ID}">${jsonForScript(page)}</script>\n    ` : ''
  return html.replace(ROOT, () => `${place}<div id="root">${inner}</div>`)
}

// ── The text under the app ──────────────────────────────────────────────────────────────────

const link = (href: string, text: string) => `<a href="${esc(href)}">${esc(text)}</a>`
const placeLink = (p: SeoPlace) => link(`${PLACE_PREFIX}/${p.slug}`, p.label)
const linkList = (places: readonly SeoPlace[]) => `<ul class="doc-links">${places.map((p) => `<li>${placeLink(p)}</li>`).join('')}</ul>`

/** The four labels, in the About page's words (src/ui/results/lib/meta.ts names them). */
const LABELS: readonly [string, string][] = [
  ['Watched', 'A real image of this place from this pass is in a public archive.'],
  ['Likely watched', 'A camera that is always on (Sentinel-2, Landsat, polar weather) covered the place, but no image of it was published.'],
  ['Could have pointed here', 'A steerable or commercial camera was in range. Its operator does not say whether it looked.'],
  ['Passed overhead', 'It crossed the sky here with no camera known to be recording: the ISS, Tiangong.'],
]
const labelsHtml = `<dl class="doc-terms">${LABELS.map(([t, d]) => `<dt>${esc(t)}</dt><dd>${esc(d)}</dd>`).join('')}</dl>`

const LIMITS =
  'Photos are 10 m a pixel at best, so no one can be made out in them. Commercial satellites that see down to 30 cm do not publish where they pointed, and military ones mostly are not in public catalogs. Archives publish hours to days after capture, so the newest passes may not have an image yet.'

/** "48.857°N 2.352°E" */
export function coordinates(lat: number, lon: number): string {
  return `${Math.abs(lat).toFixed(3)}°${lat < 0 ? 'S' : 'N'} ${Math.abs(lon).toFixed(3)}°${lon < 0 ? 'W' : 'E'}`
}

/** The landing, for a reader that runs no JavaScript. `featured` are the places it links to by name. */
export function homeFallback(featured: readonly SeoPlace[]): string {
  return `<main class="doc"><div class="doc-col">
<noscript><p class="doc-note">Watched computes satellite passes in your browser, so it needs JavaScript. This page says what it does.</p></noscript>
<h1>Something watched you this week.</h1>
<p>Enter any place on Earth. Watched shows every satellite that passed over it in the last 7 days, and the actual pictures they took. Free, no sign-up. The orbit maths runs in your browser.</p>
<h2>What it does</h2>
<ul>
<li>Finds the passes. Your browser replays the week’s orbits for about 400 imaging, weather, radar and crewed satellites and notes every time one could see your spot.</li>
<li>Finds the images. It searches the Sentinel-2, Landsat and Sentinel-1 radar archives and NASA’s and EUMETSAT’s weather imagery, matches each image to the pass that took it, and checks whether your spot was under cloud.</li>
<li>Replays a pass. The satellite flies its real track while its swath sweeps the place, then the photo develops line by line in the direction of flight.</li>
<li>Plays a time-lapse. One clear Sentinel-2 look a year since 2015, the same 10 km square every time.</li>
</ul>
<h2>What “watched” means</h2>
${labelsHtml}
<h2>What it cannot see</h2>
<p>${esc(LIMITS)}</p>
<h2>Places</h2>
${linkList(featured)}
<p>${link(PLACE_PREFIX, 'Every place with a page')}</p>
</div></main>`
}

/** A place page, for a reader that runs no JavaScript. `near` are the pages nearest it. */
export function placeFallback(place: SeoPlace, near: readonly SeoPlace[]): string {
  return `<main class="doc"><div class="doc-col">
<noscript><p class="doc-note">Watched computes satellite passes in your browser, so it needs JavaScript. This page says what it shows for this place.</p></noscript>
<p class="doc-crumbs">${link('/', 'Watched')} / ${link(PLACE_PREFIX, 'Places')}</p>
<h1>${esc(place.label)}: this week’s satellite images and passes</h1>
<p>Every satellite that passed over ${esc(fullName(place))} in the last 7 days, and the actual pictures they took. The page computes the week’s passes in your browser when it opens, then finds the images in the public archives: Sentinel-2 and Landsat photos, Sentinel-1 radar, and NASA’s and EUMETSAT’s weather imagery.</p>
<p class="doc-meta">${esc(coordinates(place.lat, place.lon))}</p>
<h2>What each pass is called</h2>
${labelsHtml}
<h2>Also here</h2>
<ul>
<li>A replay of any pass: the satellite on its real track, its swath crossing ${esc(place.label)}, then the image it took.</li>
<li>A time-lapse of ${esc(place.label)}: one clear Sentinel-2 look a year since 2015, the same 10 km square every time.</li>
</ul>
<h2>What it cannot see</h2>
<p>${esc(LIMITS)}</p>
<h2>Nearby</h2>
${linkList(near)}
<p>${link(PLACE_PREFIX, 'Every place with a page')} · ${link('/', 'Search any other place')}</p>
</div></main>`
}

export const toPagePlace = (p: SeoPlace): PagePlace => ({ path: `${PLACE_PREFIX}/${p.slug}`, label: p.label, sublabel: p.sublabel, lat: p.lat, lon: p.lon, cc: p.cc || undefined })

/** A place's page: the built index.html (`template`) with its head, its place and its text. */
export function placePage(template: string, origin: string, place: SeoPlace, near: readonly SeoPlace[], social: PlaceSocial): string {
  return withRoot(withHead(template, placeMeta(origin, place, social)), placeFallback(place, near), toPagePlace(place))
}

/** The landing: the built index.html with its text. Its head is already the landing's. */
export function homePage(template: string, origin: string, featured: readonly SeoPlace[]): string {
  return withRoot(withHead(template, homeMeta(origin)), homeFallback(featured))
}

// ── The list of places (/place): a page of its own, no app ──────────────────────────────────

export interface Directory {
  origin: string
  places: readonly SeoPlace[]
  /** The built app's stylesheets (paths), for the tokens, the fonts and the .doc styles */
  stylesheets: readonly string[]
  /** "US" → "United States" */
  countryName: (cc: string) => string
}

export const DIRECTORY_TITLE = 'Places · Watched'
export const DIRECTORY_DESCRIPTION = 'Cities and landmarks with a page on Watched: every satellite that passed over each one in the last 7 days, and the actual pictures they took.'

export function directoryPage(d: Directory): string {
  const url = `${d.origin}${PLACE_PREFIX}`
  const byName = (a: SeoPlace, b: SeoPlace) => a.label.localeCompare(b.label, 'en') || a.slug.localeCompare(b.slug)
  const landmarks = d.places.filter((p) => p.kind === 'landmark').sort(byName)
  const countries = new Map<string, SeoPlace[]>()
  for (const p of d.places) {
    if (p.kind !== 'city') continue
    const name = p.cc ? d.countryName(p.cc.toUpperCase()) : 'Elsewhere'
    countries.set(name, [...(countries.get(name) ?? []), p])
  }
  // A namesake is told apart by where it is, as in the search box.
  const names = new Map<string, number>()
  for (const p of d.places) names.set(p.label, (names.get(p.label) ?? 0) + 1)
  const item = (p: SeoPlace) => `<li>${link(`${PLACE_PREFIX}/${p.slug}`, p.label)}${(names.get(p.label) ?? 0) > 1 && p.sublabel ? ` <span>${esc(p.sublabel.split(', ')[0])}</span>` : ''}</li>`
  const section = (title: string, places: SeoPlace[]) => `<h2>${esc(title)}</h2>\n<ul class="doc-links">${places.map(item).join('')}</ul>`
  const sections = [...countries.entries()].sort(([a], [b]) => a.localeCompare(b, 'en')).map(([name, places]) => section(name, places.sort(byName)))
  const graph = [
    siteNode(d.origin),
    { '@type': 'CollectionPage', '@id': `${url}#page`, url, name: DIRECTORY_TITLE, description: DIRECTORY_DESCRIPTION, inLanguage: 'en', isPartOf: { '@id': `${d.origin}/#site` } },
  ]
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#07080A" />
    <title>${esc(DIRECTORY_TITLE)}</title>
    <meta name="description" content="${esc(DIRECTORY_DESCRIPTION)}" />
    <link rel="canonical" href="${esc(url)}" />
    <meta name="robots" content="max-image-preview:large" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Watched" />
    <meta property="og:title" content="${esc(DIRECTORY_TITLE)}" />
    <meta property="og:description" content="${esc(DIRECTORY_DESCRIPTION)}" />
    <meta property="og:url" content="${esc(url)}" />
    <meta property="og:image" content="${esc(d.origin)}/og-default.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <script type="application/ld+json">${jsonForScript({ '@context': 'https://schema.org', '@graph': graph })}</script>
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
${d.stylesheets.map((href) => `    <link rel="stylesheet" href="${esc(href)}" />`).join('\n')}
  </head>
  <body class="doc-page">
    <main class="doc"><div class="doc-col doc-wide">
<p class="doc-crumbs">${link('/', 'Watched')}</p>
<h1>Places</h1>
<p>Each of these has a page that opens straight on it: every satellite that passed over it in the last 7 days, and the actual pictures they took. Anywhere else on Earth, ${link('/', 'search for it')} or drop a pin on the globe.</p>
${section('Landmarks', landmarks)}
${sections.join('\n')}
</div></main>
  </body>
</html>
`
}

// ── For crawlers ────────────────────────────────────────────────────────────────────────────

/** Every page worth indexing. No dates: a page's content is the last 7 days, whenever it is read. */
export function sitemapXml(origin: string, places: readonly SeoPlace[]): string {
  const urls = [`${origin}/`, `${origin}${PLACE_PREFIX}`, ...places.map((p) => placeUrl(origin, p))]
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `<url><loc>${esc(u)}</loc></url>`).join('\n')}\n</urlset>\n`
}

/**
 * Nothing is closed to crawlers: the cards under /api/og are what link previews fetch (X's and Facebook's fetchers
 * obey this file), and a page that runs the app needs /api/geo. /admin is kept out of indexes by its own header.
 */
export function robotsTxt(origin: string): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`
}
