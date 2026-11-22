/**
 * Arabic and Persian decide "is this label already right to left" the same way, over the whole Arabic script: a
 * Persian name written with a letter outside U+0600–06FF (the Arabic Supplement, Extended-A, a presentation form) was
 * isolated as if it were Latin, and drawn left to right inside the sentence.
 */
import { describe, expect, it } from 'vitest'
import arPass from './ar/pass'
import arResults from './ar/results'
import { isoUnlessRtl, ltr, queryDir, whole } from './bidi'
import faPass from './fa/pass'
import faResults from './fa/results'

const LRI = '\u2066'
const PDI = '\u2069'
const flat = (x: unknown): string =>
  typeof x === 'string'
    ? x
    : Array.isArray(x)
      ? x.map(flat).join('')
      : x && typeof x === 'object'
        ? Object.values(x).map(flat).join('')
        : ''

// Arabic Supplement (U+0750), Extended-A (U+08A0), a presentation form (U+FB8E: KEHEH) and the base block (U+0628).
const OUTSIDE = ['ݐبل', 'ࢠبل', 'ﮎرج', 'بلخ']

describe('isoUnlessRtl', () => {
  it('isolates Latin and coordinates, not Arabic-script names or isolates', () => {
    expect(isoUnlessRtl('Asia/Bangkok')).toBe(`${LRI}Asia/Bangkok${PDI}`)
    expect(isoUnlessRtl('23.500, 12.500')).toBe(`${LRI}23.500, 12.500${PDI}`)
    for (const s of OUTSIDE) expect(isoUnlessRtl(s)).toBe(s)
    expect(isoUnlessRtl(ltr('UTC+7'))).toBe(ltr('UTC+7'))
  })
  it('is what both catalogs use for a place', () => {
    for (const [results, pass] of [
      [arResults, arPass],
      [faResults, faPass],
    ] as const) {
      for (const place of OUTSIDE) {
        const s = results.notes.passTimes(place, undefined, 'UTC') + flat(pass.could.camera({ place }))
        expect(s).toContain(place)
        expect(s).not.toContain(LRI + place)
      }
      expect(results.notes.passTimes('Paris', undefined, 'UTC')).toContain(`${LRI}Paris${PDI}`)
      expect(flat(pass.could.camera({ place: 'Paris' }))).toContain(`${LRI}Paris${PDI}`)
    }
  })

  it('keeps the pass-times stamp and zone whole and isolated in both catalogs', () => {
    expect(whole('2026-11-19 07:34Z')).toBe('2026-\u206011-\u206019\u00a007:34Z')
    for (const results of [arResults, faResults]) {
      const s = results.notes.passTimes('Niamey', '2026-11-19 07:34Z', 'Africa/Niamey')
      expect(s).toContain(ltr(whole('2026-11-19 07:34Z')))
      expect(s).toContain(ltr(whole('Africa/Niamey')))
      expect(results.notes.passTimes('Niamey', undefined, 'UTC+1')).toContain(ltr('UTC+1'))
    }
  })

  it('reads a query typed on a right-to-left page in its own direction', () => {
    expect(queryDir('')).toBe('rtl')
    expect(queryDir('12.500, 23.500')).toBe('ltr')
    expect(queryDir('-33.4, 151.2')).toBe('ltr')
    expect(queryDir('Paris')).toBe('ltr')
    expect(queryDir('12 Main St')).toBe('ltr')
    // Arabic and Persian words, and a number before them, as dir="auto" reads them
    expect(queryDir('\u0627\u0644\u0642\u0627\u0647\u0631\u0629')).toBe('rtl')
    expect(queryDir('12 \u062e\u06cc\u0627\u0628\u0627\u0646')).toBe('rtl')
    // Persian and Arabic-Indic digits with no letter: right to left (dir="auto" would say left to right)
    expect(queryDir('\u06f4\u06f3\u066b\u06f4\u06f7\u060c \u06f8\u06f0\u066b\u06f5\u06f4')).toBe('rtl')
    expect(queryDir('\u0664\u0663\u066b\u0664\u0667\u060c -\u0668\u0660')).toBe('rtl')
  })
})
