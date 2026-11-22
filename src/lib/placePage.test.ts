import { describe, expect, it } from 'vitest'
import { addressOf, homePath, isPagePlace, isPlacePath, opensOnResults, pageTitle, parsePagePlace, type PagePlace } from './placePage'

const PARIS: PagePlace = { path: '/place/paris', label: 'Paris', sublabel: 'Île-de-France, France', lat: 48.8566, lon: 2.3522, cc: 'fr' }

describe('parsePagePlace', () => {
  it('reads the place a page carries', () => {
    expect(parsePagePlace(JSON.stringify(PARIS))).toEqual(PARIS)
    expect(parsePagePlace(JSON.stringify({ path: '/place/area-51', label: 'Area 51', lat: 37.235, lon: -115.8111 }))).toEqual({
      path: '/place/area-51',
      label: 'Area 51',
      sublabel: undefined,
      lat: 37.235,
      lon: -115.8111,
      cc: undefined,
    })
  })

  it('refuses anything that is not a whole, valid place', () => {
    for (const bad of [
      undefined,
      null,
      '',
      'not json',
      '[]',
      '"/place/paris"',
      JSON.stringify({ ...PARIS, path: '/paris' }),
      JSON.stringify({ ...PARIS, path: '/place/' }),
      JSON.stringify({ ...PARIS, path: '/place/Paris' }),
      JSON.stringify({ ...PARIS, path: '/place/a/b' }),
      JSON.stringify({ ...PARIS, path: '/place/a?q=1,2' }),
      JSON.stringify({ ...PARIS, label: ' ' }),
      JSON.stringify({ ...PARIS, lat: '48.8566' }),
      JSON.stringify({ ...PARIS, lat: 91 }),
      JSON.stringify({ ...PARIS, lon: -181 }),
      JSON.stringify({ ...PARIS, lon: null }),
    ]) {
      expect(parsePagePlace(bad), String(bad)).toBeUndefined()
    }
  })

  it('drops a field it cannot use and keeps the place', () => {
    expect(parsePagePlace(JSON.stringify({ ...PARIS, cc: 'FRA', sublabel: '' }))).toEqual({ ...PARIS, cc: undefined, sublabel: undefined })
  })
})

describe('the address for what is on screen', () => {
  it('keeps a place page on its own path while its place is the one shown', () => {
    expect(addressOf(PARIS, undefined, PARIS, '/place/paris')).toBe('/place/paris')
    expect(addressOf(PARIS, '60989-29892501', PARIS, '/place/paris')).toBe('/place/paris?p=60989-29892501')
    // The same place searched again from anywhere in the tab is still the page's.
    expect(addressOf({ label: 'Paris', lat: 48.8566, lon: 2.3522 }, undefined, PARIS, '/')).toBe('/place/paris')
  })

  it('writes any other place as a ?q= link on the landing, rounded to ~110 m', () => {
    const waterloo = { label: 'Waterloo', lat: 43.47234, lon: -80.54491 }
    expect(addressOf(waterloo, undefined, PARIS, '/place/paris')).toBe('/?q=43.472%2C-80.545&n=Waterloo')
    expect(addressOf(waterloo, 'x-1', undefined, '/')).toBe('/?q=43.472%2C-80.545&n=Waterloo&p=x-1')
    // Same name, another spot: not the page's place.
    expect(addressOf({ label: 'Paris', lat: 33.661, lon: -95.556 }, undefined, PARIS, '/place/paris')).toBe('/?q=33.661%2C-95.556&n=Paris')
    expect(isPagePlace({ label: 'Paris', lat: 33.661, lon: -95.556 }, PARIS)).toBe(false)
  })

  it('leaves every other path as the visitor has it', () => {
    expect(addressOf({ label: 'Waterloo', lat: 43.47, lon: -80.54 }, undefined, undefined, '/about')).toBe('/about?q=43.470%2C-80.540&n=Waterloo')
    expect(homePath('/')).toBe('/')
    expect(homePath('/about')).toBe('/about')
    expect(homePath('/place/paris')).toBe('/')
    expect(homePath('/place')).toBe('/')
  })

  it('knows a place path from the offline place list\'s', () => {
    expect(isPlacePath('/place')).toBe(true)
    expect(isPlacePath('/place/paris')).toBe(true)
    expect(isPlacePath('/places/202611121945/l.txt')).toBe(false)
    expect(isPlacePath('/placebo')).toBe(false)
  })
})

describe('opensOnResults', () => {
  it('is true for a ?q= or ?s= link on the landing or a place page, and false elsewhere', () => {
    expect(opensOnResults('/', '?q=43.47,-80.54&n=Waterloo')).toBe(true)
    expect(opensOnResults('/', '?utm_source=x&s=abcd2345')).toBe(true)
    expect(opensOnResults('/place/paris', '?q=43.47,-80.54')).toBe(true)
    expect(opensOnResults('/', '')).toBe(false)
    expect(opensOnResults('/', '?tl=1')).toBe(false)
    expect(opensOnResults('/about', '?q=43.47,-80.54')).toBe(false)
    // No document under Node: a place path alone is not a page.
    expect(opensOnResults('/place/paris', '')).toBe(false)
  })
})

describe('pageTitle', () => {
  it('leads with the place', () => {
    expect(pageTitle('Paris')).toBe('Paris: this week’s satellite images and passes · Watched')
  })
})
