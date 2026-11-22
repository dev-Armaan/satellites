import { afterEach, describe, expect, it } from 'vitest'
import enPlaces from '@/i18n/en/places'
import { msgs, setBundleForTests } from '@/i18n/runtime'
import type { PagePlace } from '@/lib/placePage'
import type { Pass, Place } from '@/types'
import { localizedPlace } from '@/ui/landing/curated'
import { EXAMPLE_PLACES } from '@/ui/landing/places'
import { headFor } from './head'
import { linkPlaceIn, passLinkOpts, pickPreselect, placeSearch, readUrlTarget } from './links'
import { isSettled, raceTimeout, settleWaitMs } from './timing'

const DAY = 86_400_000
const NOW = Date.parse('2026-11-08T18:00:00Z')

describe('raceTimeout (R2K1)', () => {
  it('lets an already-settled promise win a 0 ms (or negative) race', async () => {
    await expect(raceTimeout(Promise.resolve(1), 0)).resolves.toBe(1)
    await expect(raceTimeout(Promise.resolve('share'), -1500)).resolves.toBe('share')
  })
  it('resolves null for a pending promise, and for a rejection', async () => {
    await expect(raceTimeout(new Promise(() => undefined), 0)).resolves.toBeNull()
    await expect(raceTimeout(Promise.reject(new Error('x')), 50)).resolves.toBeNull()
  })
  it('waits up to ms for a slower promise', async () => {
    const slow = new Promise<number>((r) => setTimeout(() => r(7), 20))
    await expect(raceTimeout(slow, 200)).resolves.toBe(7)
  })
})

const pass = (id: string, norad: number, tClosest: number) => ({ id, norad, tClosest }) as Pass

describe('readUrlTarget', () => {
  it('reads share links, plain deep links and the landing', () => {
    expect(readUrlTarget('?s=abcd2345', NOW)).toEqual({ kind: 'share', id: 'abcd2345' })
    expect(readUrlTarget('', NOW)).toBeNull()
    expect(readUrlTarget('?q=200,1&n=x', NOW)).toBeNull()
    expect(readUrlTarget('?sandbox=globe&q=43,-80', NOW)).toBeNull()
    expect(readUrlTarget('?q=43.4723,-80.5449&n=Waterloo&p=60989-29892501', NOW)).toEqual({
      kind: 'q',
      place: { label: 'Waterloo', lat: 43.4723, lon: -80.5449, source: 'url' },
      opts: { selectPassId: '60989-29892501' },
    })
  })

  it("opens an old fallback share link on its pass: the window centred on t (R2K5)", () => {
    const t = NOW - 10 * DAY
    const target = readUrlTarget(`?q=43.47,-80.54&n=Waterloo&p=x&sat=Sentinel-2C&norad=60989&verdict=imaged&t=${t}`, NOW)
    expect(target).toMatchObject({ kind: 'q', place: { lat: 43.47, lon: -80.54, label: 'Waterloo' } })
    const opts = target?.kind === 'q' ? target.opts : {}
    expect(opts).toEqual({ now: t + 3.5 * DAY, selectNorad: 60989, selectNear: t })
    // The window [now − 7 d, now] contains t, centred on it.
    const end = opts.now!
    expect(end - 7 * DAY < t && t < end).toBe(true)
    // …and the pass it opens is that satellite's pass nearest t, whatever ?p= said.
    const passes = [pass('60989-a', 60989, t - 5 * DAY), pass('60989-b', 60989, t + 60_000), pass('42063-c', 42063, t), pass('60989-d', 60989, t + 2 * DAY)]
    expect(pickPreselect({ passes, windowEnd: end }, opts)).toBe('60989-b')
  })

  it('keeps a recent fallback link on the default window', () => {
    const t = NOW - 2 * DAY
    const target = readUrlTarget(`?q=43.47,-80.54&n=Waterloo&p=x&norad=60989&t=${t}`, NOW)
    expect(target?.kind === 'q' && target.opts).toEqual({ now: NOW, selectNorad: 60989, selectNear: t })
  })

  it('opens a place page on the place it was built for, unless the link names something else', () => {
    const page: PagePlace = { path: '/place/paris', label: 'Paris', sublabel: 'Île-de-France, France', lat: 48.8566, lon: 2.3522, cc: 'fr' }
    const place = { label: 'Paris', sublabel: 'Île-de-France, France', lat: 48.8566, lon: 2.3522, countryCode: 'fr', source: 'url' }
    expect(readUrlTarget('', NOW, page)).toEqual({ kind: 'q', place, opts: { selectPassId: undefined } })
    expect(readUrlTarget('?p=60989-29892501&utm_source=x', NOW, page)).toEqual({ kind: 'q', place, opts: { selectPassId: '60989-29892501' } })
    expect(readUrlTarget('?s=abcd2345', NOW, page)).toEqual({ kind: 'share', id: 'abcd2345' })
    expect(readUrlTarget('?q=43.47,-80.54&n=Waterloo', NOW, page)).toMatchObject({ kind: 'q', place: { label: 'Waterloo' } })
    expect(readUrlTarget('?sandbox=globe', NOW, page)).toBeNull()
  })

  it('falls back to the pass id when t or norad is missing or invalid', () => {
    for (const bad of ['&norad=60989', `&t=${NOW - DAY}`, '&norad=60989&t=-5', '&norad=60989&t=abc', '&norad=0&t=1793549661025', '&norad=1.5&t=1793549661025', '&norad=60989&t=', '&norad=x&t=1793549661025']) {
      const target = readUrlTarget(`?q=43.47,-80.54&n=Waterloo&p=60989-29892501${bad}`, NOW)
      expect(target?.kind === 'q' && target.opts, bad).toEqual({ selectPassId: '60989-29892501' })
    }
  })
})

describe('a place link in any language', () => {
  afterEach(() => setBundleForTests('en', null))
  const giza = EXAMPLE_PLACES.find((p) => p.label === 'Pyramids of Giza')!
  const FRENCH = { places: { ...enPlaces, giza: { chip: 'Gizeh', label: 'Pyramides de Gizeh', sublabel: 'Gizeh, Égypte' } } }
  const opened = (search: string) => {
    const t = readUrlTarget(`?${search}`, NOW)
    return t?.kind === 'q' ? linkPlaceIn(t.place, msgs(enPlaces)) : undefined
  }

  it('writes what the address bar always held', () => {
    expect(placeSearch({ label: 'Waterloo', lat: 43.47234, lon: -80.54491, source: 'search' }, '60989-29892501')).toBe('q=43.472%2C-80.545&n=Waterloo&p=60989-29892501')
    expect(placeSearch(giza)).toBe('q=29.979%2C31.134&n=Pyramids+of+Giza')
  })

  it("names a curated place in English whatever language it was shown in, and shows it in the reader's", () => {
    setBundleForTests('fr', FRENCH)
    const shown = localizedPlace(giza)
    expect(shown.label).toBe('Pyramides de Gizeh')
    const search = placeSearch(shown)
    expect(search).toBe(placeSearch(giza))
    // A French reader sees it in French, still a link's place (what the stats record does not change)…
    const french = opened(search)
    expect(french).toEqual({ label: 'Pyramides de Gizeh', canonicalLabel: 'Pyramids of Giza', lat: 29.979, lon: 31.134, source: 'url' })
    // …and the next address-bar write is the same link.
    expect(placeSearch(french!)).toBe(search)
    // An English reader gets exactly the place a link always gave.
    setBundleForTests('en', null)
    expect(opened(search)).toEqual({ label: 'Pyramids of Giza', lat: 29.979, lon: 31.134, source: 'url' })
  })

  it('leaves every other link as it came', () => {
    setBundleForTests('fr', FRENCH)
    // The curated name somewhere else, or another name at the curated spot.
    expect(opened('q=48.858,2.294&n=Pyramids+of+Giza')?.label).toBe('Pyramids of Giza')
    expect(opened('q=29.979,31.134&n=Giza')?.label).toBe('Giza')
    // A translation that lacks the place shows the English name.
    setBundleForTests('fr', { places: { ...enPlaces, giza: undefined } } as unknown as Record<string, object>)
    expect(opened('q=29.979,31.134&n=Pyramids+of+Giza')?.label).toBe('Pyramids of Giza')
    // Only a link's place: a geocoded search keeps its own name.
    const typed: Place = { label: 'Pyramids of Giza', lat: 29.979, lon: 31.134, source: 'search' }
    expect(linkPlaceIn(typed, FRENCH.places)).toBe(typed)
  })
})

describe('passLinkOpts / pickPreselect', () => {
  it('centres the window only for passes older than six days', () => {
    expect(passLinkOpts(NOW - 6.5 * DAY, 1, NOW).now).toBe(NOW - 3 * DAY)
    expect(passLinkOpts(NOW - 5 * DAY, 1, NOW).now).toBe(NOW)
  })
  it('prefers the named pass, then the norad nearest the time, else nothing', () => {
    const passes = [pass('a', 1, 100), pass('b', 1, 300), pass('c', 2, 200)]
    expect(pickPreselect({ passes, windowEnd: 1000 }, { selectPassId: 'c', selectNorad: 1 })).toBe('c')
    expect(pickPreselect({ passes, windowEnd: 1000 }, { selectPassId: 'zz', selectNorad: 1, selectNear: 260 })).toBe('b')
    expect(pickPreselect({ passes, windowEnd: 1000 }, { selectNorad: 1 })).toBe('b')
    expect(pickPreselect({ passes, windowEnd: 1000 }, { selectNorad: 9 })).toBeUndefined()
    expect(pickPreselect({ passes, windowEnd: 1000 }, {})).toBeUndefined()
  })
})

describe('first results paint (R-M1)', () => {
  it('waits for the final report, and for its clear cover when the cover leads', () => {
    expect(isSettled({ partial: true, coverPending: false })).toBe(false)
    expect(isSettled({ partial: false, coverPending: true })).toBe(false)
    expect(isSettled({ partial: false, coverPending: false })).toBe(true)
    // A share / pass link opens on its pass's photo: a pending cover doesn't hold it.
    expect(isSettled({ partial: false, coverPending: true }, true)).toBe(true)
    expect(isSettled({ partial: true, coverPending: false }, true)).toBe(false)
  })

  it('stretches the wait (by at most the grace) for a final report due just after it', () => {
    // Due 1.75 s from now: worth 1.9 s (150 ms slack) instead of 1.5 s.
    expect(settleWaitMs(1000, 1500, 600, 2750)).toBe(1900)
    // Due within the race anyway: the race.
    expect(settleWaitMs(1000, 1500, 600, 1800)).toBe(1500)
    // Due too late (beyond the grace), or unknown: the race.
    expect(settleWaitMs(1000, 1500, 600, 4000)).toBe(1500)
    expect(settleWaitMs(1000, 1500, 600)).toBe(1500)
  })
})

describe('headFor: the tab title and the canonical link', () => {
  const page: PagePlace = { path: '/place/paris', label: 'Paris', lat: 48.8566, lon: 2.3522 }
  const paris = { label: 'Paris', lat: 48.8566, lon: 2.3522 }
  const tokyo = { label: 'Tokyo', lat: 35.6812, lon: 139.7671 }
  const EN = { home: 'Watched · See every satellite that passed over you this week', english: true }
  const DE = { home: 'Watched · Etwas hat dich diese Woche beobachtet', english: false }
  const HOME = { title: EN.home, canonical: '/' }

  it('names the place from the moment its search starts', () => {
    for (const phase of ['computing', 'results', 'error'] as const) {
      expect(headFor(phase, tokyo, undefined, EN)).toEqual({ title: 'Tokyo: this week’s satellite images and passes · Watched', canonical: '/' })
    }
  })

  it('is the landing\'s everywhere else', () => {
    expect(headFor('idle', undefined, undefined, EN)).toEqual(HOME)
    expect(headFor('locating', undefined, page, EN)).toEqual(HOME)
    expect(headFor('idle', paris, page, EN)).toEqual(HOME) // a place left in the store is not on screen
    expect(headFor('error', undefined, undefined, EN)).toEqual(HOME) // the catalog failed: no place
    expect(headFor('boot', undefined, undefined, EN)).toEqual(HOME)
  })

  it('calls a place page canonical only while its own place is on screen', () => {
    expect(headFor('results', paris, page, EN).canonical).toBe('/place/paris')
    expect(headFor('results', tokyo, page, EN).canonical).toBe('/')
    expect(headFor('results', { ...paris, lat: 48.85 }, page, EN).canonical).toBe('/') // another Paris, or another spot in it
    expect(headFor('results', paris, undefined, EN).canonical).toBe('/')
  })

  it('keeps a place page\'s own head while the app boots on it', () => {
    expect(headFor('boot', undefined, page, EN, page)).toEqual({ title: 'Paris: this week’s satellite images and passes · Watched', canonical: '/place/paris' })
    // A ?q= link opened on a place page's address asks for another place: the landing's head until its search starts.
    expect(headFor('boot', undefined, page, EN, undefined)).toEqual(HOME)
  })

  it('speaks the page\'s language: the landing\'s own title, and a place by its name alone', () => {
    expect(headFor('idle', undefined, undefined, DE)).toEqual({ title: DE.home, canonical: '/' })
    expect(headFor('results', tokyo, undefined, DE)).toEqual({ title: 'Tokyo · Watched', canonical: '/' })
    expect(headFor('boot', undefined, page, DE, page)).toEqual({ title: 'Paris · Watched', canonical: '/place/paris' })
  })

  it('knows a place page\'s place under the name another language gives it', () => {
    const giza: PagePlace = { path: '/place/pyramids-of-giza', label: 'Pyramids of Giza', lat: 29.979, lon: 31.134 }
    const shown = { label: 'Pyramides de Gizeh', canonicalLabel: 'Pyramids of Giza', lat: 29.979, lon: 31.134 }
    expect(headFor('results', shown, giza, { home: 'x', english: false })).toEqual({ title: 'Pyramides de Gizeh · Watched', canonical: '/place/pyramids-of-giza' })
  })
})
