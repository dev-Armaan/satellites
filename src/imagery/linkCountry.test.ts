/**
 * A linked place's name in the visitor's language: the link carries a name and a point, and the offline list at that
 * point says which country (and which kind of place) the name is. The real offline list (public/places) and tables.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { setBundleForTests } from '@/i18n/runtime'
import deNames from '@/i18n/de/exonyms.gen'
import hiNames from '@/i18n/hi/exonyms.gen'
import itNames from '@/i18n/it/exonyms.gen'
import koExonyms from '@/i18n/ko/exonyms'
import ruNames from '@/i18n/ru/exonyms.gen'
import ukNames from '@/i18n/uk/exonyms.gen'
import type { Place } from '@/types'
import { displayLabel } from './geocode'
import { ensureExonyms, EXONYM_WAIT_MS } from './exonyms'
import { shownCountryName } from './localPlaces'
import { linkedForName, needsLinkCountry, resolveLinkCountry, waitForLinkCountry } from './linkCountry'

const FILES = import.meta.glob<string>('/public/places/**/*.txt', { query: '?raw', import: 'default' })

function serveFiles() {
  const f = vi.fn(async (input: string) => {
    const file = FILES[`/public${String(input)}`]
    return file ? new Response(await file()) : new Response('', { status: 404 })
  })
  vi.stubGlobal('fetch', f)
  return f
}

const link = (label: string, lat: number, lon: number): Place => ({ label, lat, lon, source: 'url' })
const shown = async (p: Place) => {
  if (needsLinkCountry(p)) await resolveLinkCountry(p)
  return displayLabel(linkedForName(p))
}

describe('a linked place’s name', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    setBundleForTests('en', null)
  })

  it('takes the country the offline list gives that name at the link’s point', async () => {
    serveFiles()
    setBundleForTests('de', { exonyms: { names: deNames, countries: true } })
    await ensureExonyms()
    expect(await shown(link('Munich', 48.137, 11.575))).toBe('München')
    setBundleForTests('it', { exonyms: { names: itNames, countries: true } })
    expect(await shown(link('London', 51.509, -0.126))).toBe('Londra')
    expect(await shown(link('London', 42.984, -81.246))).toBe('London') // Ontario
    expect(await shown(link('Corso Buenos Aires 12', 45.48, 9.21))).toBe('Corso Buenos Aires 12') // unknown there
  })

  it('names a link to a country, a region or a feature as a search for it does: no tile holds them', async () => {
    serveFiles()
    // Each at the point a search for it writes in the address (the list's row): reloaded, or opened by a friend.
    setBundleForTests('de', { exonyms: { names: deNames, countries: true } })
    await ensureExonyms()
    expect(await shown(link('Germany', 51.5, 10.5))).toBe('Deutschland')
    expect(await shown(link('Palestinian Territory', 31.922, 35.203))).toBe('Palästinensische Autonomiegebiete')
    expect(await shown(link('Falkland Islands', -51.75, -59.167))).toBe(shownCountryName('FK', 'de'))
    expect(await shown(link('Bavaria', 49, 11.5))).toBe('Bayern')
    expect(await shown(link('Gaza Strip', 31.417, 34.333))).toBe('Gazastreifen')
    expect(await shown(link('Lake Starnberg', 47.903, 11.312))).toBe('Starnberger See')
    // The point decides which: Georgia, the US state, is not the country (Georgien).
    expect(await shown(link('Georgia', 32.75, -83.5))).not.toBe('Georgien')
    setBundleForTests('ru', { exonyms: { names: ruNames, countries: true } })
    await ensureExonyms()
    expect(await shown(link('Kharkiv Oblast', 49.617, 36.5))).toBe('Харьковская область')
    expect(await shown(link('Turkey', 39, 35))).toBe('Турция')
    setBundleForTests('hi', { exonyms: { names: hiNames, countries: true } })
    await ensureExonyms()
    expect(await shown(link('Gaza Strip', 31.417, 34.333))).toBe('गाज़ा पट्टी')
  })

  it('lets the towns and landmarks decide first, and never waits for the search file when they match', async () => {
    // The search file never answers: a town the tiles name is named at once, as before it was read at all.
    vi.stubGlobal('fetch', async (input: string) => {
      if (String(input).includes('/s/')) return new Promise<Response>(() => {})
      const file = FILES[`/public${String(input)}`]
      return file ? new Response(await file()) : new Response('', { status: 404 })
    })
    setBundleForTests('de', { exonyms: { names: deNames, countries: true } })
    await ensureExonyms()
    const nuremberg = link('Nuremberg', 49.454, 11.078) // no test before this one reads its search file (s/nur.txt)
    let named = false
    void resolveLinkCountry(nuremberg).then(() => (named = true))
    await vi.waitFor(() => expect(named).toBe(true), { timeout: 1000 })
    expect(displayLabel(linkedForName(nuremberg))).toBe('Nürnberg')
    // And a town beats a region of its name nearer the point: Mexico City, the city, not the state 16 km off.
    serveFiles()
    setBundleForTests('ru', { exonyms: { names: ruNames, countries: true } })
    await ensureExonyms()
    expect(await shown(link('Mexico City', 19.29, -99.295))).toBe('Мехико')
    // A town a GeoNames edit recoded as a city's section is a town still, in the tiles (Kadiyivka, 73,000 people).
    setBundleForTests('uk', { exonyms: { names: ukNames, countries: true } })
    await ensureExonyms()
    expect(await shown(link('Kadiyivka', 48.568, 38.644))).toBe('Кадіївка')
  })

  it('fetches nothing in English, and leaves the place itself as it came', async () => {
    const f = serveFiles()
    const p = link('Munich', 48.137, 11.575)
    expect(needsLinkCountry(p)).toBe(false)
    expect(f).not.toHaveBeenCalled()
    setBundleForTests('de', { exonyms: { names: deNames, countries: true } })
    await resolveLinkCountry(p)
    expect(p).toEqual(link('Munich', 48.137, 11.575))
  })

  it('is found, on an English page, for a switch to a language with names (the place on screen is named in it)', async () => {
    serveFiles()
    const p = link('Kyiv', 50.454, 30.524)
    expect([needsLinkCountry(p), needsLinkCountry(p, 'de')]).toEqual([false, true])
    await resolveLinkCountry(p)
    setBundleForTests('de', { exonyms: { names: deNames, countries: true } })
    await ensureExonyms()
    expect(displayLabel(linkedForName(p))).toBe('Kyjiw')
  })

  it('keeps the name a link was shown under: an answer after it was shown countryless is not applied', async () => {
    const held: (() => void)[] = []
    vi.stubGlobal('fetch', async (input: string) => {
      const file = FILES[`/public${String(input)}`]
      await new Promise<void>((done) => held.push(done))
      return file ? new Response(await file()) : new Response('', { status: 404 })
    })
    const p = link('Moscow', 55.756, 37.617)
    expect(displayLabel(linkedForName(p))).toBe('Moscow') // on screen in English
    expect(needsLinkCountry(p, 'de')).toBe(true) // a switch still looks its country up
    const lookup = resolveLinkCountry(p) // the switch's, stalled
    // The switch stopped waiting and shows the page in German: the name, without its country.
    setBundleForTests('de', { exonyms: { names: deNames, countries: true } })
    expect(displayLabel(linkedForName(p))).toBe('Moscow')
    await vi.waitFor(() => expect(held.length).toBeGreaterThan(0))
    for (const done of held) done()
    await lookup
    expect(displayLabel(linkedForName(p))).toBe('Moscow') // not Moskau
    // A language that has not shown it yet names it as opening the link there would; German keeps its own.
    setBundleForTests('it', { exonyms: { names: itNames, countries: true } })
    expect([needsLinkCountry(p, 'it'), displayLabel(linkedForName(p))]).toEqual([false, 'Mosca'])
    setBundleForTests('de', { exonyms: { names: deNames, countries: true } })
    expect(displayLabel(linkedForName(p))).toBe('Moscow')
  })

  it('is still found for a switch after Korean showed it (its names need no country: none looked up)', async () => {
    serveFiles()
    const p = link('Moscow', 55.751, 37.618)
    setBundleForTests('ko', { exonyms: koExonyms })
    expect(displayLabel(linkedForName(p))).toBe('Moscow') // a switch from English to Korean waits for nothing
    expect(needsLinkCountry(p, 'ru')).toBe(true) // then one to Russian looks its country up
    await resolveLinkCountry(p)
    setBundleForTests('ru', { exonyms: { names: ruNames, countries: true } })
    expect(displayLabel(linkedForName(p))).toBe('Москва')
  })

  it('is not waited for by a switch back to a language that showed it without its country', async () => {
    vi.stubGlobal('fetch', () => new Promise<Response>(() => {}))
    const p = link('Kharkiv', 49.993, 36.231)
    setBundleForTests('ru', { exonyms: { names: ruNames, countries: true } })
    expect(displayLabel(linkedForName(p))).toBe('Kharkiv') // shown before its lookup answered (it never does)
    setBundleForTests('en', null)
    expect([needsLinkCountry(p, 'ru'), needsLinkCountry(p, 'uk')]).toEqual([false, true])
  })

  it('is waited for once: after a wait for a stalled lookup ran out, a switch does not wait for it again', async () => {
    vi.stubGlobal('fetch', () => new Promise<Response>(() => {}))
    const p = link('Odesa', 46.482, 30.723)
    setBundleForTests('ru', { exonyms: { names: ruNames, countries: true } })
    vi.useFakeTimers()
    try {
      let report = false
      void waitForLinkCountry(p).then(() => (report = true))
      await vi.advanceTimersByTimeAsync(EXONYM_WAIT_MS + 100)
      expect(report).toBe(true)
      expect(needsLinkCountry(p, 'de')).toBe(false) // a switch to German shows the page at once
      let again = false
      void waitForLinkCountry(p).then(() => (again = true))
      await vi.advanceTimersByTimeAsync(0)
      expect(again).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })
})
