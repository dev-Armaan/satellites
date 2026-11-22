import { describe, expect, it } from 'vitest'
import indexHtml from '../../index.html?raw'
import { parsePagePlace } from '@/lib/placePage'
import { HEAD_CLOSE, HEAD_OPEN, coordinates, directoryPage, headTags, homeFallback, homeMeta, homePage, placeDescription, placeMeta, placePage, robotsTxt, sitemapXml, toPagePlace, withHead, withRoot } from './pages'
import type { SeoPlace } from './places'

const ORIGIN = 'https://www.watched.earth'
const PARIS: SeoPlace = { slug: 'paris', label: 'Paris', sublabel: 'Île-de-France, France', lat: 48.853, lon: 2.349, cc: 'fr', kind: 'city', p: 127 }
const EIFFEL: SeoPlace = { slug: 'eiffel-tower', label: 'Eiffel Tower', sublabel: 'Paris, France', lat: 48.8584, lon: 2.2945, cc: 'fr', kind: 'landmark', p: 0 }
const LONDON: SeoPlace = { slug: 'london', label: 'London', sublabel: 'England, United Kingdom', lat: 51.509, lon: -0.126, cc: 'gb', kind: 'city', p: 139 }
const LONDON_ON: SeoPlace = { slug: 'london-ontario', label: 'London', sublabel: 'Ontario, Canada', lat: 42.983, lon: -81.233, cc: 'ca', kind: 'city', p: 113 }
const SOCIAL = { title: 'What watched Paris this week', description: 'Every satellite…', image: `${ORIGIN}/api/og?kind=place&place=Paris&lat=48.85&lon=2.35&v=5`, imageAlt: 'A real Sentinel-2 satellite photograph of Palm Jumeirah, Dubai' }
const TEMPLATE = indexHtml.replaceAll('__SITE_ORIGIN__', ORIGIN)

/** What is between the head markers. */
const headOf = (html: string) => html.slice(html.indexOf(HEAD_OPEN) + HEAD_OPEN.length, html.indexOf(HEAD_CLOSE)).trim()

describe('index.html', () => {
  it('carries the landing\'s head exactly as the generator writes it', () => {
    expect(headOf(indexHtml)).toBe(headTags(homeMeta('__SITE_ORIGIN__')).trim())
  })

  it('has one empty #root for the text to go under, hidden while the loading screen is up', () => {
    expect(indexHtml.split('<div id="root"></div>')).toHaveLength(2)
    expect(indexHtml).toContain('html[data-boot] #root > .doc { display: none; }')
  })
})

describe('a place page', () => {
  const html = placePage(TEMPLATE, ORIGIN, PARIS, [EIFFEL, LONDON], SOCIAL)

  it('is the app\'s own page with the place\'s title, description and canonical link', () => {
    const head = headOf(html)
    expect(head).toContain('<title>Paris: this week’s satellite images and passes · Watched</title>')
    expect(head).toContain(`<meta name="description" content="${placeDescription(PARIS)}" />`)
    expect(head).toContain(`<link rel="canonical" href="${ORIGIN}/place/paris" />`)
    expect(head).toContain(`<meta property="og:url" content="${ORIGIN}/place/paris" />`)
    expect(head).toContain('<meta property="og:title" content="What watched Paris this week" />')
    expect(head).toContain('<meta property="og:image:type" content="image/jpeg" />')
    // The card is the default one: its description says what it shows, not the place's name.
    expect(head).toContain('<meta property="og:image:alt" content="A real Sentinel-2 satellite photograph of Palm Jumeirah, Dubai" />')
    // Everything outside the markers and #root is the template's, byte for byte.
    expect(html.slice(0, html.indexOf(HEAD_OPEN))).toBe(TEMPLATE.slice(0, TEMPLATE.indexOf(HEAD_OPEN)))
    expect(html.split(HEAD_CLOSE)[1].split('<script type="application/json"')[0]).toBe(TEMPLATE.split(HEAD_CLOSE)[1].split('<div id="root">')[0])
    expect(html.endsWith(TEMPLATE.split('<div id="root"></div>')[1])).toBe(true)
  })

  it('carries its place for the app, exactly as the app reads it', () => {
    const json = /<script type="application\/json" id="place-page">(.*?)<\/script>/.exec(html)?.[1]
    expect(parsePagePlace(json)).toEqual({ path: '/place/paris', label: 'Paris', sublabel: 'Île-de-France, France', lat: 48.853, lon: 2.349, cc: 'fr' })
    expect(toPagePlace({ ...PARIS, cc: '', sublabel: undefined })).toEqual({ path: '/place/paris', label: 'Paris', sublabel: undefined, lat: 48.853, lon: 2.349, cc: undefined })
  })

  it('says in plain text what the page shows, and links on', () => {
    const text = html.slice(html.indexOf('<div id="root">'))
    expect(text).toContain('<h1>Paris: this week’s satellite images and passes</h1>')
    expect(text).toContain('Every satellite that passed over Paris, Île-de-France, France in the last 7 days')
    expect(text).toContain('48.853°N 2.349°E')
    expect(text).toContain('<a href="/place/eiffel-tower">Eiffel Tower</a>')
    expect(text).toContain('<a href="/place">Every place with a page</a>')
    expect(text).toContain('<a href="/">Search any other place</a>')
    // The week's numbers exist only once the browser has computed them: the static text states none.
    expect(text.replace(/<[^>]+>/g, ' ')).not.toMatch(/\b\d+ (satellites|images|photos|passes)\b/)
  })

  it('describes the page and the place for search engines', () => {
    const graph = (JSON.parse(/<script type="application\/ld\+json">(.*?)<\/script>/.exec(html)![1]) as { '@graph': Record<string, unknown>[] })['@graph']
    expect(graph.map((n) => n['@type'])).toEqual(['WebSite', 'WebPage', 'Place', 'BreadcrumbList'])
    expect(graph[2]).toMatchObject({ name: 'Paris', geo: { latitude: 48.853, longitude: 2.349 }, address: { addressCountry: 'FR' } })
    expect(placeMeta(ORIGIN, { ...PARIS, cc: '' }, SOCIAL).graph[2]).not.toHaveProperty('address')
  })

  it('escapes a name wherever it is written', () => {
    const odd: SeoPlace = { ...PARIS, slug: 'x', label: 'A&B <"Rock"> </script>', sublabel: 'O’Brien’s <b>' }
    const page = placePage(TEMPLATE, ORIGIN, odd, [odd], { ...SOCIAL, title: odd.label })
    expect(page).not.toContain('<"Rock">')
    expect(page).not.toContain('<b>')
    expect(page.split('</script>').length).toBe(TEMPLATE.split('</script>').length + 1) // only the place's own script is added
    expect(headOf(page)).toContain('<title>A&#38;B &#60;&#34;Rock&#34;&#62; &#60;/script&#62;: this week’s satellite images and passes · Watched</title>')
    expect(parsePagePlace(/id="place-page">(.*?)<\/script>/.exec(page)?.[1])?.label).toBe(odd.label)
  })
})

describe('the landing', () => {
  it('keeps its head and gains its text, with the places it names and the way to the rest', () => {
    const html = homePage(TEMPLATE, ORIGIN, [PARIS, EIFFEL])
    expect(headOf(html)).toBe(headOf(TEMPLATE))
    expect(html).not.toContain('id="place-page"')
    const text = homeFallback([PARIS, EIFFEL])
    expect(html).toContain(text)
    expect(text).toContain('<h1>Something watched you this week.</h1>')
    expect(text).toContain('<a href="/place/paris">Paris</a>')
    expect(text).toContain('<a href="/place">Every place with a page</a>')
  })
})

describe('withHead / withRoot', () => {
  it('fail loudly when index.html has lost what they replace', () => {
    expect(() => withHead('<html></html>', homeMeta(ORIGIN))).toThrow(/markers/)
    expect(() => withRoot('<html></html>', 'x')).toThrow(/#root/)
  })

  it('write text with a $ in it as it is', () => {
    expect(withRoot('<div id="root"></div>', 'costs $1 and $& more')).toBe('<div id="root">costs $1 and $& more</div>')
  })
})

describe('the list of places', () => {
  const names: Record<string, string> = { FR: 'France', GB: 'United Kingdom', CA: 'Canada' }
  const html = directoryPage({ origin: ORIGIN, places: [EIFFEL, PARIS, LONDON, LONDON_ON], stylesheets: ['/assets/index-abc.css'], countryName: (cc) => names[cc] ?? cc })

  it('links every page once, landmarks first, then cities by country', () => {
    for (const slug of ['eiffel-tower', 'paris', 'london', 'london-ontario']) expect(html.split(`href="/place/${slug}"`), slug).toHaveLength(2)
    const order = ['<h2>Landmarks</h2>', '<h2>Canada</h2>', '<h2>France</h2>', '<h2>United Kingdom</h2>'].map((h) => html.indexOf(h))
    expect(order.every((i) => i > 0)).toBe(true)
    expect([...order].sort((a, b) => a - b)).toEqual(order)
  })

  it('tells namesakes apart by where they are', () => {
    expect(html).toContain('<a href="/place/london">London</a> <span>England</span>')
    expect(html).toContain('<a href="/place/london-ontario">London</a> <span>Ontario</span>')
    expect(html).toContain('<li><a href="/place/paris">Paris</a></li>')
  })

  it('is a page of its own: its own canonical link, the app\'s stylesheet, no app', () => {
    expect(html).toContain(`<link rel="canonical" href="${ORIGIN}/place" />`)
    expect(html).toContain('<link rel="stylesheet" href="/assets/index-abc.css" />')
    expect(html).not.toContain('<script type="module"')
    expect(html).not.toContain('id="root"')
  })
})

describe('for crawlers', () => {
  it('lists the landing, the list and every place in the sitemap', () => {
    const xml = sitemapXml(ORIGIN, [PARIS, EIFFEL])
    expect([...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1])).toEqual([`${ORIGIN}/`, `${ORIGIN}/place`, `${ORIGIN}/place/paris`, `${ORIGIN}/place/eiffel-tower`])
  })

  it('closes nothing in robots.txt (link previews fetch /api/og) and names the sitemap', () => {
    const txt = robotsTxt(ORIGIN)
    expect(txt).not.toMatch(/^Disallow: \S/m)
    expect(txt).toContain(`Sitemap: ${ORIGIN}/sitemap.xml`)
  })
})

describe('coordinates', () => {
  it('names the hemispheres', () => {
    expect(coordinates(48.853, 2.349)).toBe('48.853°N 2.349°E')
    expect(coordinates(-33.8568, -70.6483)).toBe('33.857°S 70.648°W')
  })
})
