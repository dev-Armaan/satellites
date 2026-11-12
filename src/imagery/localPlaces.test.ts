import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { reversePlace, searchPlaces, SEARCH_GRACE_MS } from './geocode'
import { nearestLocal, parsePlaces, reachKm, searchLocal } from './localPlaces'
import { placeKey, shardFor, shardOf, tileAt, tileIndex } from './placeKey'

/** The committed place files (public/places), loaded on demand by path. */
const FILES = import.meta.glob<string>('/public/places/*/*/*.txt', { query: '?raw', import: 'default' })

/** Serves the committed place files from public/ (the real data), and stalls every network geocoder. */
function serveFiles(network?: (url: string) => Response) {
  const f = vi.fn(async (input: string, init?: RequestInit) => {
    const url = String(input)
    if (url.startsWith('/places/')) {
      const file = FILES[`/public${url}`]
      return file ? new Response(await file()) : new Response('', { status: 404 })
    }
    if (network) return network(url)
    return new Promise<Response>((_, rej) => init?.signal?.addEventListener('abort', () => rej(new DOMException('aborted', 'AbortError'))))
  })
  vi.stubGlobal('fetch', f)
  return f
}

describe('placeKey', () => {
  it('keys a name the way it is typed', () => {
    expect(placeKey('Zürich')).toBe('zurich')
    expect(placeKey('Łódź')).toBe('lodz')
    expect(placeKey("St. John's")).toBe('st johns')
    expect(placeKey('Stratford-upon-Avon')).toBe('stratford upon avon')
    expect(placeKey('  São   Paulo ')).toBe('sao paulo')
  })

  it('files a key under its first two Latin letters or digits', () => {
    expect(shardOf('a coruna')).toBe('ac')
    expect(shardOf('t')).toBeUndefined()
    expect(shardOf('東京')).toBeUndefined()
  })

  it('finds the one file a query can match in, through split groups', () => {
    const groups = new Set(['sa', 'to'])
    const split = new Set(['sa', 'san'])
    expect(shardFor('toronto', groups, split)).toEqual({ file: 'to', head: undefined })
    expect(shardFor('sa', groups, split)).toEqual({ file: 'sa_' })
    expect(shardFor('san', groups, split)).toEqual({ file: 'san_' })
    expect(shardFor('san francisco', groups, split)).toEqual({ file: 'sanf', head: 'san_' })
    expect(shardFor('sao paulo', groups, split)).toEqual({ file: 'sao', head: 'sa_' })
    expect(shardFor('zz top', groups, split)).toBeUndefined()
  })

  it('wraps tile columns across the antimeridian', () => {
    const { row, col } = tileAt(-17.7, 179.9)
    expect(tileIndex(row, col + 1)).toBe(tileIndex(row, 0))
  })
})

describe('parsePlaces', () => {
  it('reads lines and skips junk', () => {
    const r = parsePlaces('Texas|31.250|-99.251|US||147|r\nWaterloo|43.467|-80.516|CA|Ontario|100\n{"features":[]}\n\n')
    expect(r).toHaveLength(2)
    expect(r[0]).toMatchObject({ name: 'Texas', kind: 'r', cc: 'US', key: 'texas' })
    expect(r[1]).toMatchObject({ name: 'Waterloo', admin1: 'Ontario', kind: '', p: 100 })
  })

  it('gives a village a couple of km and a big city a few tens', () => {
    expect(reachKm(60)).toBeCloseTo(2, 0)
    expect(reachKm(120)).toBeGreaterThan(10)
    expect(reachKm(150)).toBeLessThanOrEqual(30)
  })
})

describe('the offline list (real data)', () => {
  afterEach(() => vi.unstubAllGlobals())
  beforeEach(() => void serveFiles())

  it('finds towns, states and countries by prefix, exact and larger first', async () => {
    const waterloo = await searchLocal('waterloo')
    expect(waterloo[0]).toMatchObject({ name: 'Waterloo', admin1: 'Ontario', cc: 'CA' })
    expect((await searchLocal('toro'))[0]).toMatchObject({ name: 'Toronto', cc: 'CA' })
    expect((await searchLocal('paris'))[0]).toMatchObject({ name: 'Paris', cc: 'FR' })
    expect((await searchLocal('texas'))[0]).toMatchObject({ name: 'Texas', kind: 'r' })
    expect((await searchLocal('japan'))[0]).toMatchObject({ name: 'Japan', kind: 'c' })
    expect((await searchLocal('sao paulo'))[0]).toMatchObject({ name: 'São Paulo', cc: 'BR' })
    expect((await searchLocal('san francisco'))[0]).toMatchObject({ name: 'San Francisco', admin1: 'California' })
    expect((await searchLocal('sa'))[0]).toMatchObject({ name: 'São Paulo' }) // a split group's head: its largest
    expect(await searchLocal('qqqx')).toEqual([])
  })

  it('narrows by state or country after the name', async () => {
    expect((await searchLocal('paris, texas'))[0]).toMatchObject({ name: 'Paris', admin1: 'Texas' })
    expect((await searchLocal('waterloo belgium'))[0]).toMatchObject({ name: 'Waterloo', cc: 'BE' })
  })

  it('names the town a spot is in, and nothing at sea', async () => {
    expect((await nearestLocal(43.4723, -80.5449))?.name).toBe('Waterloo')
    expect((await nearestLocal(48.8584, 2.2945))?.name).toBe('Paris')
    expect(await nearestLocal(30, -40)).toBeUndefined()
  })
})

describe('searchPlaces and reversePlace with the offline list', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('names a pin from the list with no network at all', async () => {
    const f = serveFiles()
    const place = await reversePlace(43.4723, -80.5449)
    expect(place).toEqual({ lat: 43.4723, lon: -80.5449, label: 'Waterloo', sublabel: 'Ontario, Canada', countryCode: 'ca', source: 'geolocation' })
    expect(f.mock.calls.every((c) => String(c[0]).startsWith('/places/'))).toBe(true)
    expect((await reversePlace(52.52, 13.405)).sublabel).toBe('Germany') // not "State of Berlin, Germany"
    expect((await reversePlace(35.6595, 139.7005)).sublabel).toBe('Japan') // Tokyo, not "Tokyo, Tokyo"
  })

  it('shows offline rows after the grace while Photon stalls, and only ever adds below them', async () => {
    const om = { results: [{ name: 'Toronto Islands', latitude: 43.62, longitude: -79.38, country_code: 'CA', country: 'Canada', admin1: 'Ontario', population: 900 }] }
    serveFiles((url) =>
      url.includes('open-meteo')
        ? (new Promise((r) => setTimeout(() => r(Response.json(om)), 50)) as unknown as Response)
        : (new Promise(() => undefined) as unknown as Response), // Photon: never answers
    )
    const early: string[][] = []
    const t0 = Date.now()
    const r = await searchPlaces('Toronto', undefined, (p) => early.push(p.map((x) => `${x.label} · ${x.sublabel}`)))
    expect(Date.now() - t0).toBeGreaterThanOrEqual(SEARCH_GRACE_MS)
    expect(early).toHaveLength(1)
    expect(early[0][0]).toBe('Toronto · Ontario, Canada')
    const labels = r.map((x) => `${x.label} · ${x.sublabel}`)
    expect(labels.slice(0, early[0].length)).toEqual(early[0])
    expect(labels).toContain('Toronto Islands · Ontario, Canada')
  })

  it('lets a quick Photon answer lead', async () => {
    serveFiles((url) =>
      url.startsWith('https://photon.komoot.io/')
        ? Response.json({ features: [{ geometry: { type: 'Point', coordinates: [-79.38, 43.65] }, properties: { name: 'Toronto', osm_key: 'place', osm_value: 'city', state: 'Ontario', country: 'Canada', countrycode: 'CA' } }] })
        : new Response('', { status: 404 }),
    )
    const early = vi.fn()
    const r = await searchPlaces('toronto quick', undefined, early)
    expect(early).not.toHaveBeenCalled()
    expect(r[0]).toMatchObject({ label: 'Toronto', lat: 43.65 })
  })
})
