/**
 * Arabic and Persian decide "is this label already right to left" the same way, over the whole Arabic script: a
 * Persian name written with a letter outside U+0600–06FF (the Arabic Supplement, Extended-A, a presentation form) was
 * isolated as if it were Latin, and drawn left to right inside the sentence.
 */
import { describe, expect, it } from 'vitest'
import arPass from './ar/pass'
import arResults from './ar/results'
import { isoUnlessRtl, ltr } from './bidi'
import faPass from './fa/pass'
import faResults from './fa/results'

const LRI = '⁦'
const PDI = '⁩'
const flat = (x: unknown): string =>
  typeof x === 'string' ? x : Array.isArray(x) ? x.map(flat).join('') : x && typeof x === 'object' ? Object.values(x).map(flat).join('') : ''

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
})
