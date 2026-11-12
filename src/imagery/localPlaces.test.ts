import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { reversePlace, searchPlaces } from './geocode'
import { nearestLocal, parsePlaces, reachKm, searchLocal } from './localPlaces'
import { placeKey, shardFor, shardOf, tileAt, tileFile, tileIndex } from './placeKey'
import { PLACE_TILES_SPLIT } from './localPlaces.gen'

/** The committed place files (public/places), loaded on demand by path. */
const FILES = import.meta.glob<string>('/public/places/**/*.txt', { query: '?raw', import: 'default' })

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

  it('names the quarters of a split tile by half', () => {
    const { row, col } = tileAt(40.7, -73.9)
    const i = tileIndex(row, col)
    expect(tileFile(40.7, -73.9, false)).toBe(String(i))
    expect(tileFile(44.9, -70.1, true)).toBe(`${i}-3`) // north-east quarter
    expect(tileFile(40.1, -74.9, true)).toBe(`${i}-0`) // south-west
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

  it('finds landmarks by name, another name or a later word', async () => {
    const first = async (q: string) => (await searchLocal(q))[0]?.name
    expect(await first('central park')).toBe('Central Park')
    expect((await searchLocal('central park'))[0]).toMatchObject({ kind: 'l', where: 'New York, United States' })
    expect(await first('pyramids')).toBe('Pyramids of Giza')
    expect(await first('area 51')).toBe('Area 51')
    expect(await first('groom lake')).toBe('Area 51')
    expect(await first('everest')).toBe('Mount Everest')
    expect(await first('ghent')).toBe('Ghent')
    // "Giza" is also the example chip's name for the pyramids: they lead, the city follows.
    expect((await searchLocal('giza')).map((r) => r.name).slice(0, 2)).toEqual(['Pyramids of Giza', 'Giza'])
  })

  it('finds notable features and buildings under their English names', async () => {
    expect((await searchLocal('lake titicaca'))[0]).toMatchObject({ name: 'Lake Titicaca', kind: 'f' })
    expect((await searchLocal('golden gate bridge'))[0]).toMatchObject({ name: 'Golden Gate Bridge' })
    expect((await searchLocal('krakatoa'))[0]).toMatchObject({ name: 'Krakatoa', cc: 'ID' })
    expect((await searchLocal('hoover dam'))[0]).toMatchObject({ name: 'Hoover Dam and Lake Mead', kind: 'l' }) // the curated one leads
    expect((await searchLocal('hoover dam')).map((r) => r.name)).toContain('Hoover Dam')
  })

  it('names a spot in a split tile from its quarter', async () => {
    expect(PLACE_TILES_SPLIT.split(',').length).toBeGreaterThan(0)
    const { row, col } = tileAt(40.6782, -73.9442)
    expect(PLACE_TILES_SPLIT.split(',')).toContain(String(tileIndex(row, col))) // the US north-east is split
    expect((await nearestLocal(40.6782, -73.9442))?.name).toBe('Brooklyn')
    expect((await nearestLocal(28.6139, 77.209))?.name).toBe('New Delhi')
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

  it('answers from the offline list alone when it has enough', async () => {
    const f = serveFiles()
    const r = await searchPlaces('Toronto')
    expect(r[0]).toMatchObject({ label: 'Toronto', sublabel: 'Ontario, Canada' })
    expect(f.mock.calls.every((c) => String(c[0]).startsWith('/places/'))).toBe(true)
  })

  it('does not ask the network when a landmark is named exactly', async () => {
    const f = serveFiles()
    expect((await searchPlaces('Eiffel Tower')).map((p) => p.label)).toEqual(['Eiffel Tower'])
    expect(f.mock.calls.every((c) => String(c[0]).startsWith('/places/'))).toBe(true)
  })

  it('asks Open-Meteo when the list has too few, offline rows first and kept in place', async () => {
    const om = { results: [{ name: 'Eiffel Towers', latitude: 45.1, longitude: 5.5, country_code: 'FR', country: 'France', admin1: 'Auvergne-Rhône-Alpes', population: 50 }] }
    const f = serveFiles((url) => (url.includes('open-meteo') ? Response.json(om) : (new Promise(() => undefined) as unknown as Response)))
    const early = vi.fn()
    const r = await searchPlaces('eiffel tow', undefined, early)
    expect(early).toHaveBeenCalledWith([expect.objectContaining({ label: 'Eiffel Tower', sublabel: 'Paris, France' })])
    expect(r.map((p) => p.label)).toEqual(['Eiffel Tower', 'Eiffel Towers'])
    expect(f.mock.calls.some((c) => String(c[0]).startsWith('https://photon.komoot.io/'))).toBe(false)
  })
})
