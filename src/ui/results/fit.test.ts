/**
 * The fitting rules three result rows rely on, checked without a browser: where a computing row may break (its
 * counter never does), where an operator list may break (only after a slash), and the timeline's lane heights when a
 * script asks the label lanes for a least height (English's must stay exactly the shares they always were).
 */
import { describe, expect, it } from 'vitest'
import { rowText } from './ComputingBody'
import { operatorText } from './PassList'
import { layoutFor } from './Timeline'

const WJ = '\u2060'
/** Where a line may break: after a space not followed by a word joiner. */
const breaks = (s: string) => [...s.matchAll(/ (?!\u2060)/g)].map((m) => s.slice(0, m.index).replaceAll(WJ, ''))

describe('computing rows', () => {
  it('keeps the counter whole and its dot off the start of a line', () => {
    const t = rowText('PROPAGATING ORBITS · 288 / 403')
    expect(t.replaceAll(WJ, '')).toBe('PROPAGATING ORBITS · 288 / 403')
    expect(breaks(t)).toEqual(['PROPAGATING'])
  })
  it('splits at the last dot only', () => {
    expect(breaks(rowText('Bahnberechnung · 403 Bahnen · 7 Tage'))).toEqual(['Bahnberechnung', 'Bahnberechnung ·', 'Bahnberechnung · 403'])
  })
  it('lets a long tail wrap as words, and leaves a line with no dot alone', () => {
    const phrase = 'Abgleich · 120 Szenen mit 2.410 Überflügen'
    expect(rowText(phrase)).toBe(phrase)
    expect(rowText('LOADING ORBITAL CATALOG')).toBe('LOADING ORBITAL CATALOG')
  })
})

describe('operator lists', () => {
  it('break only after a slash, each name whole', () => {
    const t = operatorText('NASA / Roscosmos / ESA / JAXA / CSA')
    expect(t.replaceAll(WJ, '')).toBe('NASA / Roscosmos / ESA / JAXA / CSA')
    expect(breaks(t)).toEqual(['NASA /', 'NASA / Roscosmos /', 'NASA / Roscosmos / ESA /', 'NASA / Roscosmos / ESA / JAXA /'])
    expect(breaks(operatorText('Capella Space'))).toEqual([])
    expect(operatorText('NOAA')).toBe('NOAA')
  })
})

describe('timeline lanes', () => {
  it('are the shares, exactly, without a least height', () => {
    const L = layoutFor(800, 69, false, true)
    expect(L.heights).toEqual([0.4, 0.2, 0.2, 0.2].map((s) => 59 * s))
    expect(layoutFor(800, 69, false, true, 10).heights).toEqual(L.heights)
  })
  it('give the label lanes their least height from the photographs\' lane', () => {
    const L = layoutFor(800, 69, false, true, 14)
    expect(L.heights).toEqual([17, 14, 14, 14])
    expect(L.tops).toEqual([10, 27, 41, 55])
    expect(L.laneOf(L.laneY('could'))).toBe('could')
  })
  it('never make the photographs\' lane smaller than the others', () => {
    expect(layoutFor(800, 69, false, true, 20).heights).toEqual([17, 14, 14, 14])
    expect(layoutFor(800, 110, false, true, 30).heights).toEqual([25, 25, 25, 25])
  })
  it('keep the photographs\' lane at 17 px at least, and the label lanes at their share at least', () => {
    // A 50 px plot (shorter than any desktop strip): 20 / 10 / 10 / 10 by the shares; the label lanes take only what leaves 17.
    expect(layoutFor(800, 60, false, true, 14).heights).toEqual([17, 11, 11, 11])
    expect(layoutFor(800, 40, false, true, 14).heights).toEqual(layoutFor(800, 40, false, true).heights)
  })
  it('leave the compact strip alone', () => {
    expect(layoutFor(300, 60, true, true, 14).heights).toEqual([54 * 0.55, 54 * 0.45])
  })
})
