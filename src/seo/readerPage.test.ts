import { describe, expect, it } from 'vitest'
import indexHtml from '../../index.html?raw'
import { directoryPage, homePage, placePage } from './pages'
import type { SeoPlace } from './places'
import { isReaderPage, readerPage } from './readerPage'

const ORIGIN = 'https://www.watched.earth'
const PARIS: SeoPlace = { slug: 'paris', label: 'Paris', sublabel: 'Île-de-France, France', lat: 48.853, lon: 2.349, cc: 'fr', kind: 'city', p: 127 }
const EIFFEL: SeoPlace = { slug: 'eiffel-tower', label: 'Eiffel Tower', sublabel: 'Paris, France', lat: 48.8584, lon: 2.2945, cc: 'fr', kind: 'landmark', p: 0 }
const SOCIAL = { title: 'What watched Paris this week', description: 'Every satellite…', image: `${ORIGIN}/api/og?kind=place&place=Paris&lat=48.85&lon=2.35&v=5`, imageAlt: 'A real Sentinel-2 satellite photograph of Palm Jumeirah, Dubai' }

/** index.html as the build leaves it: the entry script and its preloads in the head, the boot words in the body. */
const BUILT = indexHtml
  .replaceAll('__SITE_ORIGIN__', ORIGIN)
  .replace('    <script type="module" src="/src/main.tsx"></script>\n', '')
  .replace('  </head>', '    <script type="module" crossorigin src="/assets/index-C-nl-f3m.js"></script>\n    <link rel="modulepreload" crossorigin href="/assets/react-C3cWAN_r.js">\n    <link rel="stylesheet" crossorigin href="/assets/index-BRa1EhII.css">\n  </head>')
  .replace('<!-- boot-text -->', '<script>(function(t){document.title=t.title})({"title":"x"})</script>')

const place = placePage(BUILT, ORIGIN, PARIS, [EIFFEL], SOCIAL)
const home = homePage(BUILT, ORIGIN, [PARIS, EIFFEL])

describe('a reader\'s page', () => {
  it('is the place page with its text shown and nothing of the app', () => {
    const page = readerPage(place)!
    expect(isReaderPage(page)).toBe(true)
    expect(page).toMatch(/^<!doctype html>\n<html lang="en">/)
    expect(page).toContain('<body class="doc-page">')
    expect(page).not.toContain('boot-static"')
    expect(page).not.toContain('Slow connection, still loading')
    expect(page).not.toContain('/assets/index-C-nl-f3m.js')
    expect(page).not.toMatch(/rel="(modulepreload|preload|preconnect)"/)
    expect(page).not.toContain('id="place-page"')
    // The text, whole, and the stylesheet that sets it.
    expect(page).toContain('<h1>Paris: this week’s satellite images and passes</h1>')
    expect(page).toContain('<a href="/place/eiffel-tower">Eiffel Tower</a>')
    expect(page).toContain('Every place with a page</a> · <a href="/">Search any other place</a></p>\n</div></main></div>')
    expect(page).toContain('<link rel="stylesheet" crossorigin href="/assets/index-BRa1EhII.css">')
  })

  it('keeps the head a search engine and a link preview read, byte for byte', () => {
    const head = (html: string) => html.slice(html.indexOf('<!-- seo:head -->'), html.indexOf('<!-- /seo:head -->'))
    expect(head(readerPage(place)!)).toBe(head(place))
    expect(head(place)).toContain('<script type="application/ld+json">')
    expect(head(place)).toContain(`<link rel="canonical" href="${ORIGIN}/place/paris" />`)
  })

  it('is made of the landing too', () => {
    const page = readerPage(home)!
    expect(isReaderPage(page)).toBe(true)
    expect(page).toContain('<h1>Something watched you this week.</h1>')
    expect(page).toContain(`<link rel="canonical" href="${ORIGIN}/" />`)
  })

  it('is made once: a reader\'s page is not a page with its text under the app', () => {
    expect(readerPage(readerPage(place)!)).toBeNull()
  })
})

describe('a page that is left as it is', () => {
  it('has no text under the app, so the app must start (a dev build)', () => {
    expect(readerPage(BUILT)).toBeNull()
    expect(readerPage(indexHtml)).toBeNull()
  })

  it('is the list of places, a document already', () => {
    expect(readerPage(directoryPage({ origin: ORIGIN, places: [PARIS, EIFFEL], stylesheets: ['/assets/index-BRa1EhII.css'], countryName: (cc) => cc }))).toBeNull()
  })

  it('is anything else: not a page, or a loading screen that never closes', () => {
    expect(readerPage('')).toBeNull()
    expect(readerPage('Not found')).toBeNull()
    expect(readerPage(place.replace('</div>\n    <script>(function(t)', '<script>(function(t)').replaceAll('</div>', ''))).toBeNull()
  })
})

describe('isReaderPage', () => {
  it('refuses a page that still has something of the app', () => {
    const page = readerPage(place)!
    expect(isReaderPage(null)).toBe(false)
    expect(isReaderPage(place)).toBe(false)
    expect(isReaderPage(page.replace('</head>', '<script type="module" src="/assets/index.js"></script></head>'))).toBe(false)
    expect(isReaderPage(page.replace('</head>', '<link rel="modulepreload" href="/assets/react.js"></head>'))).toBe(false)
    expect(isReaderPage(page.replace('<html lang="en">', '<html lang="en" data-boot>'))).toBe(false)
    expect(isReaderPage(page.replace('<body class="doc-page">', '<body>'))).toBe(false)
  })
})
