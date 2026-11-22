import { afterEach, describe, expect, it } from 'vitest'
import { LOCALES } from '../../../api/_lib/i18n/locales'
import { plain } from '../../../api/_lib/i18n/parts'
import enLanding from '@/i18n/en/landing'
import enPlaces from '@/i18n/en/places'
import { setBundleForTests } from '@/i18n/runtime'
import type { Place } from '@/types'
import { balancePad } from './balance'
import { localizedPlace } from './curated'
import { canSubmitQuery, clampActive, enterTarget, isTypingTarget, stepActive } from './listNav'
import { CURATED_NAMES, EXAMPLE_PLACES, SURPRISE_PLACES, curatedId, englishPlace, surprisePlace } from './places'
import type { LocateFailure } from './useLocate'
import { windowLabel } from './windowLabel'

describe('combobox keyboard model', () => {
  it('steps down and up with wrap through "none"', () => {
    expect(stepActive(-1, 3, 1)).toBe(0)
    expect(stepActive(0, 3, 1)).toBe(1)
    expect(stepActive(2, 3, 1)).toBe(-1)
    expect(stepActive(-1, 3, -1)).toBe(2)
    expect(stepActive(0, 3, -1)).toBe(-1)
    expect(stepActive(-1, 0, 1)).toBe(-1)
  })
  it('enter picks the highlight, else the first result', () => {
    expect(enterTarget(-1, 4)).toBe(0)
    expect(enterTarget(2, 4)).toBe(2)
    expect(enterTarget(9, 4)).toBe(0)
    expect(enterTarget(-1, 0)).toBe(-1)
  })
  it('drops a highlight that fell off the end of a new list', () => {
    expect(clampActive(3, 2)).toBe(-1)
    expect(clampActive(1, 2)).toBe(1)
  })
  it('detects typing targets without a DOM', () => {
    expect(isTypingTarget(null)).toBe(false)
    expect(isTypingTarget({ closest: () => ({}) } as unknown as EventTarget)).toBe(true)
    expect(isTypingTarget({ closest: () => null } as unknown as EventTarget)).toBe(false)
  })
})

describe('example places', () => {
  it('are three real places with distinct chips', () => {
    expect(EXAMPLE_PLACES).toHaveLength(3)
    expect(new Set(EXAMPLE_PLACES.map((p) => p.chip)).size).toBe(3)
    for (const p of EXAMPLE_PLACES) {
      expect(Math.abs(p.lat)).toBeLessThanOrEqual(90)
      expect(Math.abs(p.lon)).toBeLessThanOrEqual(180)
      expect(p.label.length).toBeGreaterThan(2)
      expect(p.source).toBe('demo')
      expect(p.countryCode).toMatch(/^[a-z]{2}$/)
    }
  })
})

describe('surprise me', () => {
  it('draws from real, distinct places on every side of the world', () => {
    expect(SURPRISE_PLACES.length).toBeGreaterThanOrEqual(20)
    expect(new Set(SURPRISE_PLACES.map((p) => p.label)).size).toBe(SURPRISE_PLACES.length)
    for (const p of SURPRISE_PLACES) {
      expect(Math.abs(p.lat)).toBeLessThanOrEqual(70)
      expect(Math.abs(p.lon)).toBeLessThanOrEqual(180)
      // Its own source, so a Surprise me search isn't counted as an example chip.
      expect(p.source).toBe('surprise')
      expect(p.countryCode).toMatch(/^[a-z]{2}$/)
      // Not one of the chips: the surprise is somewhere they don't already show.
      expect(EXAMPLE_PLACES.some((e) => e.label === p.label)).toBe(false)
    }
    expect(SURPRISE_PLACES.some((p) => p.lat < 0)).toBe(true)
    expect(SURPRISE_PLACES.some((p) => p.lon > 90)).toBe(true)
    expect(SURPRISE_PLACES.some((p) => p.lon < -60)).toBe(true)
  })
  it('never repeats the place it just picked', () => {
    for (let i = 0; i < 200; i++) {
      const a = surprisePlace()
      expect(surprisePlace(a).label).not.toBe(a.label)
    }
    expect(surprisePlace(undefined, () => 0.9999)).toBe(SURPRISE_PLACES[SURPRISE_PLACES.length - 1])
  })
})

describe('window label', () => {
  it('formats the trailing 7-day window in UTC, in the one date style', () => {
    // same month: written once; days never zero-padded
    expect(windowLabel(Date.UTC(2026, 10, 8, 4, 0))).toBe('1 → 8 NOV 2026 UTC')
    // across a month
    expect(windowLabel(Date.UTC(2026, 10, 5, 12, 0))).toBe('29 OCT → 5 NOV 2026 UTC')
    // across a year: the year on both ends
    expect(windowLabel(Date.UTC(2027, 0, 5, 12, 0))).toBe('29 DEC 2026 → 5 JAN 2027 UTC')
    expect(windowLabel(Date.UTC(2027, 0, 3, 12, 0))).toBe('27 DEC 2026 → 3 JAN 2027 UTC')
  })
  it('uses the UTC day, whatever the hour', () => {
    expect(windowLabel(Date.UTC(2026, 10, 8, 23, 59))).toBe('1 → 8 NOV 2026 UTC')
    expect(windowLabel(Date.UTC(2026, 10, 9, 0, 0))).toBe('2 → 9 NOV 2026 UTC')
  })
})

describe('primary action availability', () => {
  it('needs a query of the minimum length', () => {
    expect(canSubmitQuery('', 2, null)).toBe(false)
    expect(canSubmitQuery(' a ', 2, null)).toBe(false)
    expect(canSubmitQuery('Wa', 2, null)).toBe(true)
  })
  it('is withheld only when the answer for exactly this query was empty', () => {
    expect(canSubmitQuery('qqqzzxv', 2, { q: 'qqqzzxv', count: 0 })).toBe(false)
    expect(canSubmitQuery('qqqzzxv ', 2, { q: 'qqqzzxv', count: 0 })).toBe(false)
    expect(canSubmitQuery('Waterloo', 2, { q: 'Waterloo', count: 6 })).toBe(true)
    // typing on after an empty answer: offer it again (Enter searches the new text)
    expect(canSubmitQuery('qqqzzxva', 2, { q: 'qqqzzxv', count: 0 })).toBe(true)
  })
})

describe('hero balance', () => {
  // column 740 px tall, idle content 640 px
  it('absorbs a note that fits by padding the top by its height', () => {
    expect(balancePad(740, 688, 640, 48)).toBe(48)
  })
  it('absorbs only as much as the free space below allows', () => {
    expect(balancePad(740, 715, 640, 75)).toBe(25)
    expect(balancePad(560, 600, 525, 75)).toBe(0)
  })
  it('pads the bottom when the note replaces something taller (content shrank)', () => {
    expect(balancePad(560, 510, 525, 75)).toBe(-15)
  })
  it('does nothing without a note, and assumes pure growth before the first idle measurement', () => {
    expect(balancePad(740, 640, 640, 0)).toBe(0)
    expect(balancePad(740, 688, null, 48)).toBe(48)
  })
})

describe('curated places in the visitor’s language', () => {
  afterEach(() => setBundleForTests('en', null))
  const french = {
    ...CURATED_NAMES,
    area51: { chip: 'Zone 51', label: 'Zone 51', sublabel: 'Groom Lake, Nevada, États-Unis' },
    uluru: { label: 'Uluru', sublabel: 'Territoire du Nord, Australie' },
  }

  it('is the very same object in English, so nothing about an English search changes', () => {
    for (const p of [...EXAMPLE_PLACES, ...SURPRISE_PLACES]) {
      expect(localizedPlace(p)).toBe(p)
      expect(englishPlace(p)).toBe(p)
      expect(p.canonicalLabel).toBeUndefined()
    }
    expect(enPlaces).toBe(CURATED_NAMES)
  })

  it('translates the chip, label and sublabel, and keeps the English for the stats', () => {
    setBundleForTests('fr', { places: french })
    const p = localizedPlace(EXAMPLE_PLACES[0])
    expect(p).toEqual({ ...EXAMPLE_PLACES[0], chip: 'Zone 51', label: 'Zone 51', sublabel: 'Groom Lake, Nevada, États-Unis', canonicalLabel: 'Area 51' })
    expect(curatedId(p)).toBe('area51')
    expect(englishPlace(p)).toBe(EXAMPLE_PLACES[0])
    const u = localizedPlace(SURPRISE_PLACES[0])
    expect(u).toMatchObject({ label: 'Uluru', sublabel: 'Territoire du Nord, Australie', canonicalLabel: 'Uluru', source: 'surprise' })
    expect(englishPlace(u)).toBe(SURPRISE_PLACES[0])
    // Back in English, a place picked in French is the curated object again.
    setBundleForTests('en', null)
    expect(localizedPlace(p)).toBe(EXAMPLE_PLACES[0])
  })

  it('leaves every other place as it came (geocoder names are data)', () => {
    setBundleForTests('fr', { places: { ...french, paris: { label: 'Paris', sublabel: 'Île-de-France, France (FR)' } } })
    const searched: Place = { label: 'Paris', sublabel: 'Île-de-France, France', lat: 48.85, lon: 2.35, source: 'search' }
    expect(localizedPlace(searched)).toBe(searched)
    expect(englishPlace(searched)).toBe(searched)
    expect(curatedId(searched)).toBeUndefined()
  })

  it('never repeats the place it just picked, whatever language it was shown in', () => {
    setBundleForTests('fr', { places: { ...french, uluru: { label: 'Rocher Uluru', sublabel: 'Australie' } } })
    const shown = localizedPlace(SURPRISE_PLACES[0])
    expect(shown.label).toBe('Rocher Uluru')
    for (let i = 0; i < 50; i++) expect(surprisePlace(shown).label).not.toBe('Uluru')
  })
})

describe('landing copy', () => {
  afterEach(() => setBundleForTests('en', null))

  it('counts in English as the page always has', () => {
    expect(enLanding.lastDays(7)).toBe('Last 7 days')
    expect(enLanding.lastDays(1)).toBe('Last 1 day')
    expect(plain(enLanding.sub(7))).toBe('Enter any place on Earth. See every satellite that passed over it in the last 7\u00a0days, and the actual pictures they took.')
    expect(enLanding.matches(1)).toBe('1 match')
    expect(enLanding.matches(6)).toBe('6 matches')
    expect(enLanding.elapsed(4.4)).toBe('04 S')
    expect(enLanding.nothingMatches('qqq')).toBe('Nothing matches “qqq”. Try a city, a landmark, or coordinates.')
    expect(enLanding.chipName('Area 51', 'Groom Lake, Nevada, United States')).toBe('Area 51, Groom Lake, Nevada, United States')
  })

  it('words every way locating can fail', () => {
    const codes: LocateFailure[] = ['denied', 'unavailable', 'timeout', 'unsupported', 'insecure', 'other']
    for (const c of codes) expect(enLanding.locateErrors[c]).toMatch(/\.$/)
    expect(enLanding.locateErrors.other).toBe('Your position isn’t available right now. Search for a place instead.')
  })

  it('dates the window in the visitor’s language, read at call time', () => {
    const t = Date.UTC(2026, 10, 8, 4, 0)
    setBundleForTests('de', { landing: { ...enLanding, windowRange: (a: number, b: number) => `${new Date(a).getUTCDate()}.–${new Date(b).getUTCDate()}. Nov. 2026 UTC` } })
    expect(windowLabel(t)).toBe('1.–8. Nov. 2026 UTC')
    setBundleForTests('en', null)
    expect(windowLabel(t)).toBe('1 → 8 NOV 2026 UTC')
  })

  it('names the link to the code by its visible words, then where it goes, in every language', () => {
    // WCAG 2.5.3 (label in name): a voice user says what they see ("Open source"), so the accessible name starts with it.
    const catalogs = import.meta.glob<typeof enLanding>('../../i18n/*/landing.ts', { import: 'default', eager: true })
    expect(Object.keys(catalogs)).toHaveLength(LOCALES.length)
    for (const [file, c] of Object.entries(catalogs)) {
      expect(c.sourceLink.trim(), file).not.toBe('')
      expect(c.sourceLinkLabel.startsWith(c.sourceLink), file).toBe(true)
      expect(c.sourceLinkLabel, file).toContain('GitHub')
    }
  })
})
