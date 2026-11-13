import { describe, expect, it, vi } from 'vitest'
import type { Capture, Pass } from '@/types'
import { dailyCaptureTarget } from './match'
import { mosaicGroups } from './weather'

// The grouping asks the catalog which satellites have a daily mosaic; no catalog is loaded here.
vi.mock('./catalog', () => ({ getSatInfo: () => ({ profile: { gibs: { kind: 'daily', collection: 'gibs-viirs-noaa20' } } }) }))

const HONOLULU_LON = -157.8583
const NOAA20 = 43013

const pass = (id: string, iso: string, over: Partial<Pass> = {}) =>
  ({ id, norad: NOAA20, tClosest: Date.parse(iso), groundDistanceKm: 300, sunElevationDeg: 40, inSwath: true, verdict: 'likely', ...over }) as Pass

const mosaic = (iso: string) =>
  ({ id: 'm', provider: 'gibs', collection: 'gibs-viirs-noaa20', platform: 'noaa-20', norad: NOAA20, datetime: Date.parse(iso) }) as Capture

describe('daily mosaics and the day on the ground', () => {
  // One Honolulu afternoon (the 11th there) runs across midnight UTC; the next afternoon is the 12th there.
  const passes = [
    pass('early', '2026-11-11T23:20:00Z', { groundDistanceKm: 900 }),
    pass('late', '2026-11-12T01:00:00Z'),
    pass('next', '2026-11-12T23:40:00Z', { groundDistanceKm: 100 }),
  ]

  it('groups passes by the mosaic they are in, across midnight UTC', () => {
    expect(mosaicGroups(passes, HONOLULU_LON).map((g) => g.map((p) => p.id))).toEqual([['early', 'late'], ['next']])
    // The same instants over London are two UTC days, split at midnight.
    expect(mosaicGroups(passes, -0.1).map((g) => g.map((p) => p.id))).toEqual([['early'], ['late', 'next']])
  })

  it('gives a mosaic with no exact pass time to a pass of its own day there, never the next afternoon', () => {
    // 00:05Z on the 12th is still the afternoon of the 11th in Honolulu: 'next' shares its UTC day, not its mosaic.
    expect(dailyCaptureTarget(passes, mosaic('2026-11-12T00:05:00Z'), HONOLULU_LON)?.id).toBe('late')
  })
})
