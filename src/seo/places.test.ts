import { beforeAll, describe, expect, it } from 'vitest'
import { sublabelOf } from '@/imagery/geocode'
import { CITY_NAMES as CITY_NAME_ROWS } from '../../scripts/landmarks'
import { PLACES_VERSION } from '@/imagery/localPlaces.gen'
import { citySublabel, nearest, parseCityRows, parseLandmarkRows, pickCities, selectPlaces, slugOf, type CityRow, type LandmarkRow, type SeoPlace } from './places'

/** The offline place list as shipped (read as text, as localPlaces.test.ts does). */
const FILES = import.meta.glob<string>('/public/places/**/*.txt', { query: '?raw', import: 'default' })

const NAMES: Record<string, string> = { US: 'United States', GB: 'United Kingdom', CA: 'Canada', ES: 'Spain', VE: 'Venezuela', FR: 'France', SG: 'Singapore', DE: 'Germany', SC: 'Seychelles' }
const countryName = (cc: string) => NAMES[cc] ?? cc
const city = (name: string, cc: string, admin1: string, p: number, lat = 10, lon = 10): CityRow => ({ name, lat, lon, cc, admin1, p })
const mark = (name: string, where: string, lat = 50, lon = 50, cc = 'US'): LandmarkRow => ({ name, lat, lon, cc, where })

describe('slugOf', () => {
  it('is the name as someone would type it', () => {
    expect(slugOf('São Paulo')).toBe('sao-paulo')
    expect(slugOf("St. John's")).toBe('st-johns')
    expect(slugOf('Washington, D.C.')).toBe('washington-d-c')
    expect(slugOf('Łódź')).toBe('lodz')
    expect(slugOf('Rivière-des-Prairies–Pointe-aux-Trembles')).toBe('riviere-des-prairies-pointe-aux-trembles')
    expect(slugOf('東京')).toBe('') // no Latin key: no page under that name
  })
})

describe('citySublabel', () => {
  it('says where a city is exactly as the search box does', () => {
    const cases: [string, string, string][] = [
      ['Paris', 'Île-de-France', 'France'],
      ['Berlin', 'State of Berlin', 'Germany'],
      ['Singapore', '', 'Singapore'],
      ['New York City', 'New York', 'United States'],
      ['Luxembourg', 'Luxembourg', 'Luxembourg'],
    ]
    for (const [name, admin1, country] of cases) {
      const echoes = ` ${admin1.toLowerCase()} `.includes(` ${name.toLowerCase()} `)
      expect(citySublabel(name, admin1, country), name).toBe(sublabelOf(name, [echoes ? undefined : admin1, country]))
    }
    expect(citySublabel('Paris', 'Île-de-France', 'France')).toBe('Île-de-France, France')
    expect(citySublabel('Berlin', 'State of Berlin', 'Germany')).toBe('Germany')
    expect(citySublabel('Singapore', '', 'Singapore')).toBeUndefined()
  })
})

describe('pickCities', () => {
  it('takes every city of half a million, smaller ones where English is searched, and each country\'s two largest', () => {
    const rows = [
      city('Big', 'FR', 'A', 114),
      city('Mid', 'FR', 'A', 113),
      city('Small', 'FR', 'A', 100),
      city('Town', 'US', 'Ohio', 100),
      city('Village', 'US', 'Ohio', 99),
      city('Hamlet', 'US', 'Ohio', 60),
      city('Only', 'SC', 'X', 85),
      city('Tiny', 'SC', 'X', 79),
    ]
    // Mid and Village are in as their country's second largest; Small and Hamlet are third, Tiny under 10,000.
    expect(pickCities(rows).map((r) => r.name)).toEqual(['Big', 'Mid', 'Town', 'Village', 'Only'])
  })

  it('orders by size, then by name and position, whatever order the files came in', () => {
    const rows = [city('B', 'US', 'x', 120, 2), city('A', 'US', 'x', 120, 9), city('A', 'US', 'x', 120, 1), city('C', 'US', 'x', 130)]
    const picked = pickCities(rows).map((r) => `${r.name}${r.lat}`)
    expect(picked).toEqual(['C10', 'A1', 'A9', 'B2'])
    expect(pickCities([...rows].reverse()).map((r) => `${r.name}${r.lat}`)).toEqual(picked)
  })
})

describe('selectPlaces', () => {
  it('gives the largest place of a name the bare slug, and says where its namesakes are', () => {
    const places = selectPlaces(
      [city('London', 'GB', 'England', 139), city('London', 'CA', 'Ontario', 113), city('Valencia', 'VE', 'Carabobo', 123), city('Valencia', 'ES', 'Valencia', 119), city('Victoria', 'SC', 'La Rivière Anglaise', 88)],
      [],
      countryName,
    )
    expect(places.map((p) => p.slug)).toEqual(['london', 'valencia', 'valencia-spain', 'london-ontario', 'victoria'])
    expect(places.find((p) => p.slug === 'london-ontario')).toMatchObject({ label: 'London', sublabel: 'Ontario, Canada', cc: 'ca', kind: 'city' })
  })

  it('keeps a landmark as curated, and one page for a landmark and a city that are the same place', () => {
    const places = selectPlaces([city('Venice', 'IT', 'Veneto', 108, 45.44, 12.33), city('Venice', 'US', 'Florida', 100, 27.1, -82.45)], [mark('Venice', 'Veneto, Italy', 45.4341, 12.3388, 'IT'), mark('Area 51', 'Groom Lake, Nevada, United States')], countryName)
    expect(places.map((p) => [p.slug, p.kind, p.sublabel])).toEqual([
      ['venice', 'landmark', 'Veneto, Italy'],
      ['area-51', 'landmark', 'Groom Lake, Nevada, United States'],
      ['venice-florida', 'city', 'Florida, United States'],
    ])
  })

  it('gives a city listed under the name people type one page: the city\'s own where it has one', () => {
    const names = new Set(['Kiev', 'Ghent'])
    const places = selectPlaces(
      [city('Kyiv', 'UA', 'Kyiv City', 129, 50.455, 30.524), city('Gent', 'BE', 'Flanders', 60, 51.05, 3.717)],
      [mark('Kiev', 'Kyiv, Ukraine', 50.4501, 30.5234, 'UA'), mark('Ghent', 'East Flanders, Belgium', 51.0543, 3.7174, 'BE'), mark('Kremlin', 'Moscow, Russia', 50.46, 30.52, 'RU')],
      countryName,
      names,
    )
    // Kyiv has its page, so "Kiev" adds none; Gent is too small for one, so "Ghent" is the city's page; a sight
    // in a city is always its own page.
    expect(places.map((p) => p.slug)).toEqual(['ghent', 'kremlin', 'kyiv'])
  })

  it('makes one page for a point the list names twice: the first name\'s, or the place\'s own name today', () => {
    const places = selectPlaces(
      [],
      [
        mark('Golden Gate Bridge', 'San Francisco, United States', 37.8199, -122.4783),
        mark('Ayers Rock', 'Northern Territory, Australia', -25.3444, 131.0369, 'AU'),
        mark('Golden Gate Park', 'San Francisco, United States', 37.7694, -122.4862),
        mark('Uluru', 'Northern Territory, Australia', -25.3444, 131.0369, 'AU'),
        mark('Golden Gate', 'San Francisco, United States', 37.8199, -122.4783),
      ],
      countryName,
    )
    // A sight a walk away is another place; only the very same point is one.
    expect(places.map((p) => p.slug)).toEqual(['golden-gate-bridge', 'golden-gate-park', 'uluru'])
  })

  it('refuses to build when two places cannot be told apart', () => {
    // same, same-ohio, same-united-states, same-ohio-united-states: a fifth has nowhere to go.
    const five = [1, 2, 3, 4, 5].map((i) => city('Same', 'US', 'Ohio', 125 - i, i))
    expect(selectPlaces(five.slice(0, 4), [], countryName).map((p) => p.slug)).toEqual(['same', 'same-ohio', 'same-united-states', 'same-ohio-united-states'])
    expect(() => selectPlaces(five, [], countryName)).toThrow(/no free slug/)
  })
})

describe('nearest', () => {
  it('lists the other pages, nearest first', () => {
    const places = selectPlaces([city('A', 'US', 'x', 120, 0, 0), city('B', 'US', 'x', 119, 0, 1), city('C', 'US', 'x', 118, 0, 5), city('D', 'US', 'x', 117, 0, -2)], [], countryName)
    const a = places.find((p) => p.slug === 'a')!
    expect(nearest(a, places, 2).map((p) => p.slug)).toEqual(['b', 'd'])
  })
})

describe('the shipped place list', () => {
  const dir = `/public/places/${PLACES_VERSION}`
  /** As scripts/build-seo.ts passes it. */
  const CITY_NAMES = new Set(CITY_NAME_ROWS.map(([name]) => name))
  let landmarks: LandmarkRow[] = []
  let places: SeoPlace[] = []
  beforeAll(async () => {
    const tiles = Object.keys(FILES).filter((f) => f.startsWith(`${dir}/t/`))
    const cities = (await Promise.all(tiles.map((f) => FILES[f]()))).flatMap(parseCityRows)
    landmarks = parseLandmarkRows(await FILES[`${dir}/l.txt`]())
    const regions = new Intl.DisplayNames(['en'], { type: 'region' })
    places = selectPlaces(cities, landmarks, (cc) => regions.of(cc) ?? cc, CITY_NAMES)
  })

  it('makes a page for every sight and about two thousand cities, each under its own slug', () => {
    const sights = landmarks.filter((l) => !CITY_NAMES.has(l.name))
    const pages = places.filter((p) => p.kind === 'landmark')
    // Every sight has a page at its point (under one name, where the list has two for it), and no point has two.
    for (const s of sights) expect(pages.filter((p) => p.lat === s.lat && p.lon === s.lon).length, s.name).toBe(1)
    const n = places.filter((p) => p.kind === 'city').length
    expect(n).toBeGreaterThan(1500)
    expect(n).toBeLessThan(3000)
    expect(new Set(places.map((p) => p.slug)).size).toBe(places.length)
    for (const p of places) expect(p.slug, p.label).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  })

  it('names the pages people will look for', () => {
    const at = (slug: string) => places.find((p) => p.slug === slug)
    expect(at('area-51')).toMatchObject({ label: 'Area 51', kind: 'landmark' })
    expect(at('london')).toMatchObject({ label: 'London', sublabel: 'England, United Kingdom' })
    expect(at('london-ontario')).toMatchObject({ label: 'London', sublabel: 'Ontario, Canada' })
    expect(at('new-york-city')).toMatchObject({ sublabel: 'New York, United States' })
    expect(at('singapore')?.sublabel).toBeUndefined()
    expect(at('tokyo')).toBeDefined()
    // One page a city: its own name where GeoNames has it, the name people type where it does not.
    expect(at('kyiv')).toMatchObject({ kind: 'city' })
    expect(at('kiev')).toBeUndefined()
    expect(at('mumbai')).toBeDefined()
    expect(at('bombay')).toBeUndefined()
    expect(at('nyc')).toBeUndefined()
    expect(at('ghent')).toMatchObject({ kind: 'landmark', sublabel: 'East Flanders, Belgium' })
    // One page a point: the name people type, or the place's own name today.
    expect([at('golden-gate-bridge'), at('sydney-opera-house'), at('mount-kilimanjaro'), at('eye-of-the-sahara'), at('uluru')].every(Boolean)).toBe(true)
    expect([at('golden-gate'), at('sydney-harbour'), at('kilimanjaro'), at('richat-structure'), at('ayers-rock')].some(Boolean)).toBe(false)
  })
})
