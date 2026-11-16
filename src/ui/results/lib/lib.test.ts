import { describe, expect, it } from 'vitest'
import type { Capture, GeoWatcher, Pass } from '@/types'
import { byClarity, isClouded, pickBestLook } from './bestLook'
import { captureFor, cropSpec, displayUrl, isDailyMosaic, productLabel, scaleBarKm, slug } from './captures'
import { ARCHIVE_DOWN_LINE, archiveDown, compassAbbr, compassWord, darkSentences, fieldAngles, geoImageCount, headline, passSentences, photosLine, placeInProse, placeParts, plain, radarSentence, shareHeadline, trackKm, watchedPhrase } from './copy'
import { cardUrl, filterCounts, filterPhotos, hiResHelps, hiResUrl, orderPhotos, photoHeadingDeg, placeOffset, thumbUrl } from './photos'
import { isMagnifiedView, placeInCrop, tonePlanForUrl } from '../../../../api/_lib/toneRender'
import { pcCropUrl, type CropOpts } from '@/imagery'
import { panApiPath, parsePanSharpUrl } from '@/imagery/panUrl'
import { parsePanQuery } from '../../../../api/_lib/pan'
import { groupPasses, visibleCount } from './groups'
import { glyphForPass, markColorVar, VERDICT_META, VERDICT_TAG, VERDICT_TITLE, verdictUnit, type SatMeta } from './meta'
import { frontLine, motionVector, revealProgress, scannedPolygon, sweepRange } from './pushbroom'
import { groundRangeAtOffNadirKm, planGeometry } from './plan'
import { replayWindow, windowFraction } from './replay'
import { fmtDayMonth, fmtDuration, fmtLocalDay, fmtLocalStamp, fmtLocalTime, fmtRelative, fmtSpokenDay, fmtTMinus, localParts, partsAtOffset, spokenRelative, utcLabel, utcOffsetMin, windowOffset, zoneAbbr, zoneLabel } from './time'
import { dayBoundaries, daylight, hitTest, hourMarks, indexLanes, nearestIndex, stepPass, sunSamples } from './timeline'

const TZ = 'America/Toronto'
const WATERLOO = { lat: 43.4723, lon: -80.5449 }

let seq = 0
function pass(over: Partial<Pass> = {}): Pass {
  const t = over.tClosest ?? Date.parse('2026-11-01T16:21:13Z')
  return {
    id: `x-${seq++}`,
    norad: 60989,
    tClosest: t,
    tStart: t - 19_000,
    tEnd: t + 19_000,
    groundDistanceKm: 61.2,
    offNadirDeg: 5.26,
    elevationDeg: 84,
    azimuthDeg: 268,
    altitudeKm: 786.4,
    groundSpeedKmS: 6.823,
    headingDeg: 194.6,
    node: 'descending',
    sunElevationDeg: 28.4,
    inSwath: true,
    inFieldOfRegard: true,
    verdict: 'imaged',
    track: [],
    ...over,
  }
}

const META: Record<number, SatMeta> = {
  60989: { norad: 60989, name: 'Sentinel-2C', category: 'open-optical', operator: 'ESA / Copernicus', profile: { operator: 'ESA', category: 'open-optical', swathKm: 290, blurb: '' } },
  43013: { norad: 43013, name: 'NOAA-20', category: 'weather-leo', operator: 'NOAA', profile: { operator: 'NOAA', category: 'weather-leo', swathKm: 3000, blurb: '', gibs: { collection: 'gibs-viirs-noaa20', layer: 'L', kind: 'daily' } } },
  59625: { norad: 59625, name: 'Legion 1', category: 'commercial-optical', operator: 'Maxar' },
  40697: { norad: 40697, name: 'Sentinel-1A', category: 'radar' },
  25544: { norad: 25544, name: 'ISS', category: 'crewed' },
}
const meta = (n: number): SatMeta => META[n] ?? { norad: n, name: `NORAD ${n}`, category: 'other' }

const s2: Capture = {
  id: 'S2C_X',
  provider: 'planetary-computer',
  collection: 'sentinel-2-l2a',
  itemId: 'S2C_X',
  platform: 'sentinel-2c',
  datetime: Date.parse('2026-11-01T16:14:21Z'),
  cloudCoverPct: 25.46,
  gsdM: 10,
  cropUrl: ({ halfSizeKm, px }) =>
    `https://planetarycomputer.microsoft.com/api/data/v1/item/bbox/1,2,3,4/${px}x${px}.png?collection=sentinel-2-l2a&item=S2C_X&h=${halfSizeKm}`,
}
const viirs: Capture = {
  id: 'VIIRS@2026-11-01',
  provider: 'gibs',
  collection: 'gibs-viirs-noaa20',
  itemId: 'VIIRS@2026-11-01',
  platform: 'noaa-20',
  datetime: 0,
  gsdM: 375,
  cropUrl: () => 'https://gibs.earthdata.nasa.gov/wms?x=1',
}

describe('time', () => {
  it('formats in the place time zone across the DST change', () => {
    // 1 Nov 2026: Ontario leaves daylight time at 02:00 local.
    const before = Date.parse('2026-11-01T05:30:00Z')
    const after = Date.parse('2026-11-01T16:21:13Z')
    expect(zoneAbbr(before, TZ)).toBe('EDT')
    expect(zoneAbbr(after, TZ)).toBe('EST')
    expect(fmtLocalTime(after, TZ, true)).toBe('11:21:13')
    expect(fmtLocalDay(after, TZ)).toBe('Sun 1 Nov')
    expect(fmtLocalStamp(after, TZ)).toBe('Sun 1 Nov · 11:21 EST')
    expect(utcOffsetMin(after, TZ)).toBe(-300)
    expect(utcOffsetMin(before, TZ)).toBe(-240)
  })
  it('falls back to UTC+N labels where there is no abbreviation', () => {
    expect(zoneAbbr(Date.parse('2026-11-01T00:00:00Z'), 'Asia/Kolkata')).toMatch(/^(IST|UTC\+5:30)$/)
    expect(zoneAbbr(0, 'UTC')).toBe('UTC')
  })
  it('relative times read like an instrument', () => {
    const now = Date.parse('2026-11-08T12:00:00Z')
    expect(fmtRelative(now - 20_000, now)).toBe('just now')
    expect(fmtRelative(now - 12 * 60_000, now)).toBe('12 min ago')
    expect(fmtRelative(now - 30 * 3_600_000, now)).toBe('30 h ago')
    expect(fmtRelative(now - 3 * 86_400_000, now)).toBe('3 days ago')
    expect(fmtRelative(now + 3 * 3_600_000, now)).toBe('in 3 h')
  })
  it('T-minus and durations', () => {
    expect(fmtTMinus(1000, 43_000)).toBe('T−00:42')
    expect(fmtTMinus(66_000, 1_000)).toBe('T+01:05')
    expect(fmtTMinus(3_700_000, 0)).toBe('T+1:01:40')
    expect(fmtDuration(38_400)).toBe('38 s')
    expect(fmtDuration(252_000)).toBe('4 min 12 s')
  })
})

describe('copy', () => {
  it('compass words and abbreviations', () => {
    expect(compassWord(194.6)).toBe('south')
    expect(compassWord(345)).toBe('north')
    expect(compassWord(268)).toBe('west')
    expect(compassAbbr(194.6)).toBe('SSW')
    expect(compassAbbr(-10)).toBe('N')
  })

  it('headline counts distinct satellites and splits detailed images from mosaics', () => {
    const report = {
      captures: [s2, viirs],
      notes: [],
      passes: [
        pass({ norad: 60989, captureId: 'S2C_X' }),
        pass({ norad: 43013, captureId: 'VIIRS@2026-11-01' }),
        pass({ norad: 43013, verdict: 'likely', captureId: undefined }), // same sat: not "more"
        pass({ norad: 59625, verdict: 'could' }),
        pass({ norad: 59625, verdict: 'could' }),
        pass({ norad: 25544, verdict: 'overhead' }),
      ],
    }
    const h = headline(report, meta)
    expect(h).toMatchObject({ flewOver: 4, photographed: 2, detailedSats: 1, mosaicSats: 1, more: 2, images: 2, detailed: 1, mosaics: 1 })
    expect(h.zeroReason).toBeUndefined()
  })

  it('owner F: "N satellites watched" counts every distinct satellite with a pass, never a geostationary one', () => {
    const geoMeta = (n: number): SatMeta => (n === 99999 ? { norad: n, name: 'GOES-19', category: 'weather-geo' } : meta(n))
    const report = {
      captures: [s2],
      notes: [],
      passes: [
        pass({ norad: 60989, captureId: 'S2C_X' }),
        pass({ norad: 60989, verdict: 'likely' }),
        pass({ norad: 59625, verdict: 'could' }),
        pass({ norad: 99999, verdict: 'overhead' }),
      ],
    }
    expect(headline(report, geoMeta).flewOver).toBe(2)
    expect(watchedPhrase(1)).toBe('1 satellite watched')
    expect(watchedPhrase(256)).toBe('256 satellites watched')
  })

  it('owner F: the photos line, exact strings', () => {
    expect(photosLine(31)).toBe('31 images were made public.')
    expect(photosLine(1)).toBe('1 image was made public.')
    expect(photosLine(0)).toBe('No images were made public this week.')
    expect(photosLine(0, { week: 'that week' })).toBe('No images were made public that week.')
    expect(photosLine(4, { partial: true })).toBe('At least 4 images were made public.')
    expect(photosLine(1234)).toBe('1,234 images were made public.')
    expect(ARCHIVE_DOWN_LINE).not.toContain('—')
  })

  it('the partial and final reports of one search give the same headline integer', () => {
    const passes = [pass({ norad: 60989, captureId: 'S2C_X' }), pass({ norad: 43013, verdict: 'likely' }), pass({ norad: 59625, verdict: 'could' })]
    const partial = headline({ captures: [s2], notes: [], passes }, meta)
    // The final report verifies NOAA-20's mosaic: one more photo, the same satellites.
    const final = headline({ captures: [s2, viirs], notes: [], passes: [passes[0], { ...passes[1], verdict: 'imaged', captureId: viirs.id }, passes[2]] }, meta)
    expect(final.flewOver).toBe(partial.flewOver)
    expect(final.images).toBe(partial.images + 1)
  })

  it('states a plain reason when nothing photographed the place', () => {
    const likelyS2 = { captures: [], notes: [], passes: [pass({ verdict: 'likely' }), pass({ verdict: 'likely' })] }
    expect(headline(likelyS2, meta).zeroReason).toBe('Sentinel-2 or Landsat crossed it 2 times in daylight, but no scene has been published yet')
    const outage = { captures: [], notes: ['The Sentinel-2 and Landsat archives could not be reached; passes are shown from orbital geometry only.'], passes: [] }
    expect(headline(outage, meta).zeroReason).toBe('the image archives did not answer in time')
    const dark = { captures: [], notes: [], passes: [pass({ norad: 25544, verdict: 'overhead', sunElevationDeg: -20 })] }
    expect(headline(dark, meta).zeroReason).toBe('the sun barely rose there')
  })

  it('writes the pass sentence from real numbers (tClosest, never the scene time)', () => {
    const p = pass({ captureId: 'S2C_X' })
    const text = plain(passSentences({ pass: p, meta: meta(60989), capture: s2, timeZone: TZ, placeLabel: 'Waterloo' }))
    expect(text).toBe(
      'Sentinel-2C crossed 786 km up, 61 km to the west at 11:21:13 EST, moving south at 6.82 km/s. It was looking 5.3° off straight down. Cloud cover across the scene: 25%.',
    )
    expect(text).not.toContain('11:14') // the archive's datatake-start time
  })

  it('says "overhead" and "straight down" when it was', () => {
    const p = pass({ groundDistanceKm: 3, offNadirDeg: 0.2 })
    const text = plain(passSentences({ pass: p, meta: meta(60989), capture: s2, timeZone: TZ, placeLabel: 'Waterloo' }))
    expect(text).toContain('786 km overhead')
    expect(text).toContain('It was looking straight down.')
  })

  it('labels weather mosaics honestly and hedges "could" passes', () => {
    const w = plain(passSentences({ pass: pass({ norad: 43013 }), meta: meta(43013), capture: viirs, timeZone: TZ, placeLabel: 'Waterloo' }))
    expect(w).toContain('VIIRS imager')
    expect(w).toContain('daily true-colour mosaic at 375 m per pixel')
    const c = plain(passSentences({ pass: pass({ norad: 59625, verdict: 'could', offNadirDeg: 22.4 }), meta: meta(59625), timeZone: TZ, placeLabel: 'Waterloo' }))
    expect(c).toContain('Legion 1 passed within view at 11:21 EST, 786 km up, 61 km to the west.')
    expect(c).toContain('We can’t know whether it did.')
    const r = plain(passSentences({ pass: pass({ norad: 40697, verdict: 'could' }), meta: meta(40697), timeZone: TZ, placeLabel: 'Waterloo' }))
    expect(r).toContain('Radar sees through cloud and darkness')
    const iss = plain(passSentences({ pass: pass({ norad: 25544, verdict: 'overhead', elevationDeg: 58, sunElevationDeg: -14 }), meta: meta(25544), timeZone: TZ, placeLabel: 'Waterloo' }))
    expect(iss).toContain('ISS passed 786 km up at 11:21 EST, 58° above your horizon')
    expect(iss).toContain('It was dark where you are.')
  })

  it('share headline per verdict', () => {
    expect(shareHeadline('imaged', 'Sentinel-2C', 'Waterloo')).toEqual({ lead: 'Sentinel-2C watched', place: 'Waterloo' })
    expect(shareHeadline('could', 'Legion 1', 'Waterloo').lead).toBe('Legion 1 passed within view of')
  })
})

describe('captures', () => {
  it('finds the capture and sizes the crop per collection', () => {
    expect(captureFor({ captures: [s2, viirs] }, { captureId: 'S2C_X' })).toBe(s2)
    expect(captureFor({ captures: [s2] }, {})).toBeUndefined()
    // Sentinel-2: 1000 px = exactly the scene's 10 m pixels over 10 km; Landsat: an exact 2× of 500 native 30 m pixels.
    expect(cropSpec('sentinel-2-l2a')).toEqual({ halfSizeKm: 5, px: 1000 })
    expect(cropSpec('landsat-c2-l2')).toEqual({ halfSizeKm: 7.5, px: 1000 })
    expect(cropSpec('gibs-viirs-noaa20')).toEqual({ halfSizeKm: 120, px: 1024 })
    expect(cropSpec('sentinel-2-l2a', 112).px).toBe(112)
  })
  it('asks Planetary Computer for JPEG (≈7× smaller) and leaves other providers alone', () => {
    expect(displayUrl(s2, { halfSizeKm: 5, px: 1024 })).toMatch(/\/1024x1024\.jpg\?collection=/)
    expect(displayUrl(viirs, { halfSizeKm: 5, px: 1024 })).toBe('https://gibs.earthdata.nasa.gov/wms?x=1')
  })
  it('labels', () => {
    expect(isDailyMosaic(viirs)).toBe(true)
    expect(isDailyMosaic(s2)).toBe(false)
    expect(productLabel(viirs)).toBe('Daily mosaic · 375 m')
    expect(productLabel(s2)).toBe('Sentinel-2 L2A · 10 m')
    expect(scaleBarKm(10)).toBe(2)
    expect(scaleBarKm(240)).toBe(20)
    expect(slug('Sentinel-2C — Montréal, QC')).toBe('sentinel-2c-montreal-qc')
  })
})

describe('groups', () => {
  it('detailed images are rows; everything else is summarised per satellite', () => {
    const report = {
      captures: [s2, viirs],
      passes: [
        pass({ norad: 60989, captureId: 'S2C_X', tClosest: 3 }),
        pass({ norad: 43013, captureId: 'VIIRS@2026-11-01', tClosest: 2 }),
        pass({ norad: 59625, verdict: 'could', tClosest: 10, offNadirDeg: 30 }),
        pass({ norad: 59625, verdict: 'could', tClosest: 20, offNadirDeg: 12 }),
        pass({ norad: 40697, verdict: 'could', tClosest: 30 }),
      ],
    }
    const groups = groupPasses(report, meta)
    expect(groups.map((g) => g.verdict)).toEqual(['imaged', 'could'])
    const [imaged, could] = groups
    expect(imaged.items.map((i) => i.kind)).toEqual(['pass', 'sat'])
    expect(could).toMatchObject({ passCount: 3, satCount: 2 })
    const legion = could.items[0]
    expect(legion.kind).toBe('sat')
    if (legion.kind === 'sat') {
      expect(legion.passes.map((p) => p.tClosest)).toEqual([20, 10]) // newest first
      expect(legion.closest.offNadirDeg).toBe(12)
    }
  })
  it('caps and pages', () => {
    expect(visibleCount(236, 'could', 0)).toBe(6)
    expect(visibleCount(236, 'could', 1)).toBe(46)
    expect(visibleCount(5, 'imaged', 0)).toBe(5)
  })
})

describe('timeline', () => {
  const t0 = Date.parse('2026-10-27T04:00:00Z')
  const t1 = Date.parse('2026-11-03T04:00:00Z')
  it('samples the sun every 10 min and shades twilight smoothly', () => {
    const s = sunSamples(WATERLOO.lat, WATERLOO.lon, t0, t1)
    expect(s.length).toBe(7 * 144 + 1)
    expect(Math.max(...s)).toBeGreaterThan(25)
    expect(Math.min(...s)).toBeLessThan(-50)
    expect(daylight(-10)).toBe(0)
    expect(daylight(10)).toBe(1)
    expect(daylight(0)).toBeCloseTo(0.5)
  })
  it('finds local midnights, DST included', () => {
    const days = dayBoundaries(t0, t1, TZ)
    // t0 is itself local midnight (27 Oct 00:00 EDT); 3 Nov 00:00 EST is 05:00Z, just past t1.
    expect(days.length).toBe(6)
    expect(new Date(days[0].t).toISOString()).toBe('2026-10-28T04:00:00.000Z') // EDT midnight
    expect(new Date(days[4].t).toISOString()).toBe('2026-11-01T04:00:00.000Z') // the DST night
    expect(new Date(days[5].t).toISOString()).toBe('2026-11-02T05:00:00.000Z') // EST midnight
    expect(days[4].label).toBe('Sun 1 Nov')
  })
  it('handles half-hour zones', () => {
    const days = dayBoundaries(t0, t1, 'Asia/Kolkata')
    expect(new Date(days[0].t).toISOString()).toBe('2026-10-27T18:30:00.000Z')
  })
  it('window offsets match Intl at every 15 minutes, across DST changes and odd zones (PERF-03)', () => {
    const cases: [string, string][] = [
      [TZ, '2026-10-27T04:00:00Z'], // US DST ends 1 Nov
      ['Europe/Paris', '2026-10-21T00:00:00Z'], // EU DST ends 25 Oct
      ['Australia/Lord_Howe', '2026-09-30T00:00:00Z'], // a 30-minute DST change, 4 Oct
      ['Asia/Kathmandu', '2026-11-01T00:00:00Z'], // +5:45, no DST
      ['Etc/GMT+9', '2026-11-01T00:00:00Z'],
    ]
    for (const [zone, start] of cases) {
      const a = Date.parse(start)
      const b = a + 7 * 86_400_000
      const off = windowOffset(a, b, zone)
      for (let t = a; t <= b; t += 15 * 60_000) {
        expect(off(t)).toBe(utcOffsetMin(t, zone))
        expect(partsAtOffset(t, off(t))).toEqual(localParts(t, zone))
      }
    }
  })
  it('hour marks skip midnight', () => {
    const h = hourMarks(t0, t0 + 86_400_000, TZ, 6)
    expect(h.map((x) => x.hour)).toEqual([6, 12, 18])
  })
  it('hit-tests and steps within a verdict', () => {
    const ps = [pass({ tClosest: 100, verdict: 'imaged' }), pass({ tClosest: 300, verdict: 'imaged' }), pass({ tClosest: 200, verdict: 'could' })]
    const lanes = indexLanes(ps)
    expect(nearestIndex(lanes.imaged.times, 210)).toBe(1)
    expect(nearestIndex([], 5)).toBe(-1)
    expect(hitTest(lanes, 205, 10)?.verdict).toBe('could')
    expect(hitTest(lanes, 205, 10, 'imaged')).toMatchObject({ verdict: 'could' }) // nothing imaged within 10
    expect(hitTest(lanes, 290, 20, 'could')?.tClosest).toBe(300)
    expect(stepPass(lanes, undefined, 1)?.tClosest).toBe(100)
    expect(stepPass(lanes, undefined, -1)?.tClosest).toBe(300)
    expect(stepPass(lanes, lanes.imaged.passes[0], 1)?.tClosest).toBe(300)
    expect(stepPass(lanes, lanes.imaged.passes[1], 1)?.tClosest).toBe(300) // clamps at the end
  })
})

describe('replay', () => {
  it('pads short in-swath windows to ±90 s', () => {
    const p = pass()
    const w = replayWindow(p)
    expect(w[1] - w[0]).toBe(180_000)
    expect(windowFraction(p.tClosest, w)).toBeCloseTo(0.5)
    const long = { tStart: 0, tEnd: 600_000, tClosest: 300_000 }
    expect(replayWindow(long)).toEqual([0, 600_000])
  })
})

describe('pushbroom', () => {
  it('moves along the heading in screen space', () => {
    const south = motionVector(180)
    expect(south.x).toBeCloseTo(0)
    expect(south.y).toBeCloseTo(1)
    const east = motionVector(90)
    expect(east.x).toBeCloseTo(1)
    const [a, b] = sweepRange(100, 100, south)
    expect(a).toBeCloseTo(0)
    expect(b).toBeCloseTo(100)
    const ne = sweepRange(100, 100, motionVector(45))
    expect(ne[0]).toBeCloseTo(-70.71, 1)
    expect(ne[1]).toBeCloseTo(70.71, 1)
  })
  it('scanned polygon covers what is behind the front', () => {
    const d = motionVector(180)
    const poly = scannedPolygon(100, 100, d, 40)
    // every vertex is behind or on the front (p·d ≤ s)
    for (const v of poly) expect(v.x * d.x + v.y * d.y).toBeLessThanOrEqual(40 + 1e-9)
    const [a, b] = frontLine(100, 100, d, 40)
    expect(a.y).toBeCloseTo(40)
    expect(b.y).toBeCloseTo(40)
    expect(revealProgress(800)).toBe(0.5)
    expect(revealProgress(5000)).toBe(1)
  })
})

describe('copy: fixed-swath commercial', () => {
  it('says the place was inside the swath and that the archive is private', () => {
    const dove: SatMeta = { norad: 1, name: 'Flock 4Q-13', category: 'commercial-optical', profile: { operator: 'Planet', category: 'commercial-optical', swathKm: 32, blurb: '' } }
    const text = plain(passSentences({ pass: pass({ norad: 1, verdict: 'could', inSwath: true }), meta: dove, timeZone: TZ, placeLabel: 'Waterloo' }))
    expect(text).toContain('Waterloo was inside its 32 km swath.')
    expect(text).toContain('we can’t know whether it did')
  })
})

// ── reviewer additions ──────────────────────────────────────────────────────────────────────

describe('timeline: day/night is the real sun at the place, in its own time zone', () => {
  /** Local clock time of the first sample in [a, b) where the sun crosses 0° in the given direction. */
  const crossing = (a: number, b: number, rising: boolean) => {
    const s = sunSamples(WATERLOO.lat, WATERLOO.lon, a, b)
    for (let i = 1; i < s.length; i++) if (rising ? s[i - 1] < 0 && s[i] >= 0 : s[i - 1] >= 0 && s[i] < 0) return fmtLocalTime(a + i * 600_000, TZ)
    return undefined
  }
  it('Waterloo, Sun 1 Nov 2026 (first day of EST): sunrise ≈ 06:59, sunset ≈ 17:13 local', () => {
    const day = Date.parse('2026-11-01T05:00:00Z') // 00:00 EST
    const rise = crossing(day, day + 86_400_000, true)!
    const set = crossing(day, day + 86_400_000, false)!
    expect(rise >= '06:50' && rise <= '07:10').toBe(true)
    expect(set >= '17:05' && set <= '17:25').toBe(true)
  })
  it('Waterloo, Tue 27 Oct 2026 (EDT): sunrise ≈ 07:53, sunset ≈ 18:20 local', () => {
    const day = Date.parse('2026-10-27T04:00:00Z') // 00:00 EDT
    const rise = crossing(day, day + 86_400_000, true)!
    const set = crossing(day, day + 86_400_000, false)!
    expect(rise >= '07:45' && rise <= '08:05').toBe(true)
    expect(set >= '18:10' && set <= '18:30').toBe(true)
  })
  it('shades local noon fully and local midnight not at all', () => {
    const noon = Date.parse('2026-11-01T17:00:00Z') // 12:00 EST
    const midnight = Date.parse('2026-11-02T05:00:00Z') // 00:00 EST
    const s = sunSamples(WATERLOO.lat, WATERLOO.lon, noon, midnight)
    expect(daylight(s[0])).toBe(1)
    expect(daylight(s[s.length - 1])).toBe(0)
  })
})

describe('pushbroom: a descending Sentinel-2 pass (heading 194.6°, SSW)', () => {
  const d = motionVector(194.6)
  const W = 400
  const H = 400
  it('starts at the top-right (NNE) corner and finishes at the bottom-left', () => {
    const corners = { tl: 0, tr: W * d.x, bl: H * d.y, br: W * d.x + H * d.y }
    const [a, b] = sweepRange(W, H, d)
    expect(a).toBeCloseTo(corners.tr) // the first line the satellite records is the one furthest north-north-east
    expect(b).toBeCloseTo(corners.bl)
  })
  it('sweeps top to bottom with the front tilted ~14.6° (right side ahead)', () => {
    const [a, b] = sweepRange(W, H, d)
    const front = a + (b - a) * 0.5
    // y of the front at the left and right edges: p·d = s → y = (s − x·dx) / dy
    const yAt = (x: number) => (front - x * d.x) / d.y
    expect(yAt(W)).toBeGreaterThan(yAt(0))
    expect((Math.atan2(yAt(W) - yAt(0), W) * 180) / Math.PI).toBeCloseTo(14.6, 1)
    expect(yAt(W / 2)).toBeCloseTo(H / 2) // the centre (the place) is reached exactly halfway
  })
})

describe('copy: degenerate geometry reads like a person wrote it', () => {
  it('a track under a kilometre away is "< 1 km" in the lists, never "1 km" beside the pass\'s 0.6', () => {
    expect(trackKm(0.57)).toBe('< 1')
    expect(trackKm(0)).toBe('< 1')
    expect(trackKm(1)).toBe('1')
    expect(trackKm(61.2)).toBe('61')
  })
  it('a radar\'s field of regard starts outside its blind strip', () => {
    expect(fieldAngles({ maxOffNadirDeg: 30 })).toBe('±30°')
    expect(fieldAngles({ minOffNadirDeg: 4.5, maxOffNadirDeg: 35 })).toBe('4.5–35°')
  })
  it('a commercial pass straight over the place says "786 km overhead", not "0 km to the west"', () => {
    const text = plain(passSentences({ pass: pass({ norad: 59625, verdict: 'could', inSwath: false, groundDistanceKm: 0.4, offNadirDeg: 0.04 }), meta: meta(59625), timeZone: TZ, placeLabel: 'Waterloo' }))
    expect(text).toContain('passed within view at 11:21 EST, 786 km overhead.')
    expect(text).toContain('Looking straight down, it could have watched Waterloo.')
    expect(text).not.toMatch(/\b0 km|0\.0°/)
  })
  it('radar at nadir drops the 0.0° pointing clause', () => {
    const text = plain(passSentences({ pass: pass({ norad: 40697, verdict: 'could', inSwath: false, groundDistanceKm: 3, offNadirDeg: 0.3 }), meta: meta(40697), timeZone: TZ, placeLabel: 'Waterloo' }))
    expect(text).toContain('Radar sees through cloud and darkness. It could have mapped Waterloo.')
    expect(text).not.toContain('0.3°')
  })
  it('a crewed pass near the zenith gives no meaningless bearing', () => {
    const text = plain(passSentences({ pass: pass({ norad: 25544, verdict: 'overhead', elevationDeg: 89.2, azimuthDeg: 41, altitudeKm: 428 }), meta: meta(25544), timeZone: TZ, placeLabel: 'Waterloo' }))
    expect(text).toContain('89° above your horizon, almost straight up.')
    expect(text).not.toContain('northeast')
  })
  it('user-facing copy says "watched", never "photographed" (owner, latest)', () => {
    for (const verdict of ['imaged', 'likely', 'could', 'overhead'] as const) {
      for (const n of [60989, 43013, 59625, 40697, 25544]) {
        const text = plain(passSentences({ pass: pass({ norad: n, verdict, captureId: undefined }), meta: meta(n), timeZone: TZ, placeLabel: 'Waterloo' }))
        expect(text).not.toMatch(/photographed/i)
      }
      expect(shareHeadline(verdict, 'X', 'Waterloo').lead).not.toMatch(/photographed/i)
      expect(VERDICT_META[verdict].title + VERDICT_META[verdict].verb).not.toMatch(/photographed/i)
    }
    // Only an imaged pass "watched" the place outright; the others keep their own verbs.
    expect(shareHeadline('likely', 'X', 'Waterloo').lead).toBe('X swept over')
  })
})

// ── polish round 1 ──────────────────────────────────────────────────────────────────────────

describe('best look (decision #1)', () => {
  const cap = (id: string, over: Partial<Capture> = {}): Capture => ({ ...s2, id, itemId: id, ...over })
  const geo: GeoWatcher[] = [{ norad: 60133, name: 'GOES-19', operator: 'NOAA', subLon: -75.2, elevationDeg: 39.6, cadenceMin: 10, imagesInWindow: 1008, frames: 'goes-east' }]
  const report = (captures: Capture[], passes: Pass[], g = geo) => ({ captures, passes, geo: g })

  it('a clear spot beats a cloudier spot even with less scene cloud', () => {
    const a = cap('A', { spot: 'clear', cloudCoverPct: 40 })
    const b = cap('B', { spot: 'cloud', cloudCoverPct: 5 })
    const best = pickBestLook(report([a, b], [pass({ captureId: 'A', tClosest: 1 }), pass({ captureId: 'B', tClosest: 2 })]))
    expect(best?.kind).toBe('detailed')
    expect(best?.capture.id).toBe('A')
  })
  it('owner B1/D1: most zoomed-in clear first: smaller pixels beat a clearer spot, then the clearer spot, then newer', () => {
    const clear = cap('C', { spot: 'clear', cloudCoverPct: 35 })
    const cirrus = cap('I', { spot: 'cirrus', cloudCoverPct: 12 })
    const r1 = pickBestLook(report([clear, cirrus], [pass({ captureId: 'C', tClosest: 1 }), pass({ captureId: 'I', tClosest: 2 })]))
    expect(r1?.capture.id).toBe('C') // same 10 m: clear beats cirrus, even though older
    const landsat = cap('L', { collection: 'landsat-c2-l2', gsdM: 30, spot: 'clear', cloudCoverPct: 2 })
    const r2 = pickBestLook(report([landsat, cirrus], [pass({ captureId: 'L', tClosest: 3 }), pass({ captureId: 'I', tClosest: 1 })]))
    expect(r2?.capture.id).toBe('I') // 10 m (cirrus, not clouded) beats 30 m
  })
  it('owner D1: a clouded capture never leads while a clear one exists; if all are clouded, the least cloudy', () => {
    const white = cap('W', { spot: 'cloud', cloudCoverPct: 99, gsdM: 10 })
    const grey = cap('G', { cloudCoverPct: 86, gsdM: 10 })
    const landsat = cap('L', { collection: 'landsat-c2-l2', gsdM: 30, spot: 'clear', cloudCoverPct: 20 })
    const r1 = pickBestLook(report([white, landsat], [pass({ captureId: 'W', tClosest: 9 }), pass({ captureId: 'L', tClosest: 1 })]))
    expect(r1?.capture.id).toBe('L')
    const r2 = pickBestLook(report([white, grey], [pass({ captureId: 'W', tClosest: 9 }), pass({ captureId: 'G', tClosest: 1 })]))
    expect(r2?.capture.id).toBe('G')
  })
  it('then the more recent one', () => {
    const a = cap('A', { cloudCoverPct: 21 })
    const b = cap('B', { cloudCoverPct: 24 })
    const best = pickBestLook(report([a, b], [pass({ captureId: 'A', tClosest: 1 }), pass({ captureId: 'B', tClosest: 2 })]))
    expect(best?.capture.id).toBe('B')
  })
  it('falls back to a daylight weather mosaic, then nothing (a geostationary frame is in the gallery, never the lead)', () => {
    const m = pickBestLook(report([viirs], [pass({ norad: 43013, captureId: viirs.id })]))
    expect(m?.kind).toBe('mosaic')
    expect(pickBestLook(report([], [pass({ verdict: 'likely' })]))).toBeNull()
    const frame = cap('G', { provider: 'gibs', collection: 'gibs-goes-east', gsdM: 2000, band: 'colour' })
    expect(pickBestLook(report([frame], [pass({ norad: 60133, captureId: 'G', geostationary: true })]))).toBeNull()
  })
  it('geostationary frames close the gallery, under Weather, and never lead', () => {
    const a = cap('A', { spot: 'clear', cloudCoverPct: 5 })
    const g1 = cap('G1', { provider: 'gibs', collection: 'gibs-goes-east', gsdM: 2000, band: 'colour' })
    const g2 = cap('G2', { provider: 'eumetsat', collection: 'eumetsat-meteosat-iodc', gsdM: 5000, band: 'infrared' })
    const passes = [
      pass({ captureId: 'A', tClosest: 100 }),
      pass({ norad: 43013, captureId: viirs.id, tClosest: 200 }),
      pass({ norad: 60133, captureId: 'G1', tClosest: 900, geostationary: true }),
      pass({ norad: 28912, captureId: 'G2', tClosest: 950, geostationary: true }),
    ]
    const set = orderPhotos({ captures: [g1, a, g2, viirs], passes })
    expect(set.photos.map((p) => p.key)).toEqual(['A', viirs.id, 'G2', 'G1'])
    expect(set.photos.slice(2).map((p) => p.kind)).toEqual(['geo', 'geo'])
    expect(set.cover?.photo.key).toBe('A')
    expect(filterCounts(set.photos)).toEqual({ all: 4, detailed: 1, weather: 3, radar: 0 })
    expect(filterPhotos(set.photos, 'weather').map((p) => p.key)).toEqual([viirs.id, 'G2', 'G1'])
    // Alone, they are listed with no cover.
    const alone = orderPhotos({ captures: [g1], passes: [passes[2]] })
    expect(alone.cover).toBeUndefined()
    expect(alone.photos.map((p) => p.key)).toEqual(['G1'])
    expect(productLabel(g1)).toBe('Full disc · 2 km')
    expect(productLabel(g2)).toBe('Infrared · 5 km')
  })
  it("the image count takes in every frame the public geostationary watchers took, and their scans are not passes", () => {
    const watchers: GeoWatcher[] = [
      { ...geo[0] },
      { ...geo[0], norad: 28912, name: 'Meteosat-9', cadenceMin: 15, imagesInWindow: 672, frames: 'meteosat-iodc', rim: true },
      { ...geo[0], norad: 44903, name: 'Elektro-L 3', cadenceMin: 30, imagesInWindow: 336, frames: undefined },
    ]
    expect(geoImageCount(watchers)).toBe(1008)
    const a = cap('A', { spot: 'clear' })
    const g1 = cap('G1', { provider: 'gibs', collection: 'gibs-goes-east', gsdM: 2000 })
    const passes = [pass({ captureId: 'A', tClosest: 100 }), pass({ norad: 60133, captureId: 'G1', tClosest: 900, geostationary: true })]
    const h = headline({ passes, captures: [a, g1], geo: watchers }, meta)
    expect(h).toMatchObject({ images: 1009, geoImages: 1008, detailed: 1, flewOver: 1, photographed: 1 })
    // The same before the frame itself has arrived: the count never waits for it.
    expect(headline({ passes: [passes[0]], captures: [a], geo: watchers }, meta).images).toBe(1009)
    expect(headline({ passes: [passes[0]], captures: [a] }, meta).images).toBe(1)
  })
  it('clouded: cloud at the spot or ≥ 70 % of the scene', () => {
    expect(isClouded({ cloudCoverPct: 86 })).toBe(true)
    expect(isClouded({ cloudCoverPct: 30, spot: 'cloud' })).toBe(true)
    expect(isClouded({ cloudCoverPct: 30, spot: 'cirrus' })).toBe(false)
    expect(isClouded({})).toBe(false)
    expect(byClarity({ pass: pass({ tClosest: 1 }), capture: cap('x', { cloudCoverPct: 90 }) }, { pass: pass({ tClosest: 2 }), capture: cap('y', { cloudCoverPct: 10 }) })).toBeGreaterThan(0)
  })
})

describe('groups: photographs in the gallery order (owner B1)', () => {
  it('the closest clear look first, then newest first', () => {
    const white = { ...s2, id: 'W', itemId: 'W', cloudCoverPct: 100 }
    const clear = { ...s2, id: 'K', itemId: 'K', cloudCoverPct: 3 }
    const groups = groupPasses({ captures: [white, clear], passes: [pass({ captureId: 'W', tClosest: 9 }), pass({ captureId: 'K', tClosest: 1 })] }, meta)
    const ids = groups[0].items.map((i) => (i.kind === 'pass' ? i.pass.captureId : '')).filter(Boolean)
    expect(ids).toEqual(['K', 'W'])
  })
  it('an archive outage puts the daylight Sentinel-2 / Landsat satellites first among the likely', () => {
    const passes = [
      pass({ norad: 43013, verdict: 'likely' }),
      pass({ norad: 43013, verdict: 'likely' }),
      pass({ norad: 43013, verdict: 'likely' }),
      pass({ norad: 60989, verdict: 'likely', sunElevationDeg: 30 }),
    ]
    const normal = groupPasses({ captures: [], passes }, meta)
    const outage = groupPasses({ captures: [], passes }, meta, { archiveFailed: true })
    expect(normal[0].items[0].meta.name).toBe('NOAA-20')
    expect(outage[0].items[0].meta.name).toBe('Sentinel-2C')
  })
})

describe('one vocabulary for verdicts (R9)', () => {
  it('derives titles, lane words and units from the single table', () => {
    expect(VERDICT_TITLE.likely).toBe(VERDICT_META.likely.title)
    expect(VERDICT_META.likely.title).toBe('Likely watched')
    expect(VERDICT_META.imaged.title).toBe('Watched')
    expect(VERDICT_META.imaged.verb).toBe('watched')
    expect(VERDICT_TAG.imaged).toBe('Photo')
    expect(verdictUnit('imaged', 1)).toBe('pass')
    expect(verdictUnit('imaged', 31)).toBe('passes')
    expect(verdictUnit('could', 1)).toBe('pass')
    expect(verdictUnit('could', 2)).toBe('passes')
    expect(shareHeadline('likely', 'Sentinel-2C', 'Waterloo').lead).toBe('Sentinel-2C swept over')
  })
  it('signal marks only for detailed captures: an imaged weather satellite is a bone mosaic mark', () => {
    expect(glyphForPass('imaged', 'open-optical')).toBe('imaged')
    expect(markColorVar('imaged', 'open-optical')).toBe('var(--signal)')
    expect(glyphForPass('imaged', 'weather-leo')).toBe('mosaic')
    expect(markColorVar('imaged', 'weather-leo')).toBe('var(--bone)')
  })
})

describe('honest copy (R7, R17)', () => {
  it('an archive outage is a fact about the archives, not the place', () => {
    expect(archiveDown({ archiveFailed: true })).toBe(true)
    expect(archiveDown({ archiveFailed: false, notes: ['The Sentinel-2 and Landsat archives could not be reached'] })).toBe(false)
    expect(archiveDown({ notes: ['The Sentinel-2 and Landsat archives could not be reached; passes are shown from orbital geometry only.'] })).toBe(true)
    const t = plain(passSentences({ pass: pass({ verdict: 'likely' }), meta: meta(60989), timeZone: TZ, placeLabel: 'Waterloo', archiveFailed: true }))
    expect(t).toContain('The archive could not be searched just now.')
    expect(t).not.toContain('archives can lag')
  })
  it('an old pass with no scene has no scene (no "almost certainly recorded")', () => {
    const p = pass({ verdict: 'likely' })
    const old = plain(passSentences({ pass: p, meta: meta(60989), timeZone: TZ, placeLabel: 'Waterloo', now: p.tClosest + 5 * 86_400_000 }))
    expect(old).toContain('No scene exists for this pass.')
    expect(old).not.toContain('almost certainly')
    const fresh = plain(passSentences({ pass: p, meta: meta(60989), timeZone: TZ, placeLabel: 'Waterloo', now: p.tClosest + 6 * 3_600_000 }))
    expect(fresh).toContain('archives can lag')
  })
  it('polar night: the sun never rose, and radar needs no light', () => {
    const passes = [pass({ norad: 40697, verdict: 'could' }), pass({ norad: 40697, verdict: 'could' }), pass({ norad: 25544, verdict: 'overhead' })]
    const h = headline({ captures: [], notes: [], passes }, meta, -4)
    expect(h.zeroKind).toBe('dark')
    expect(h.sunNeverRose).toBe(true)
    expect(plain(radarSentence(h.radar!))).toBe('Radar doesn’t need light. Sentinel-1A passed within range 2 times.')
    expect(plain(radarSentence({ names: ['Umbra-08', 'Capella-14'], sats: 9, passes: 1204 }))).toBe(
      'Radar doesn’t need light. Umbra-08, Capella-14 and 7 other radar satellites passed within range 1,204 times.',
    )
  })
  it('water and deserts take an article', () => {
    expect(placeInProse('Pacific Ocean')).toBe('the Pacific Ocean')
    expect(placeInProse('Sahara Desert')).toBe('the Sahara Desert')
    expect(placeInProse('Waterloo')).toBe('Waterloo')
    expect(placeParts('Pacific Ocean')).toEqual(['the ', 'Pacific Ocean'])
    const t = plain(passSentences({ pass: pass({ norad: 59625, verdict: 'could', offNadirDeg: 12 }), meta: meta(59625), timeZone: TZ, placeLabel: 'Pacific Ocean' }))
    expect(t).toContain('it could have watched the Pacific Ocean.')
  })
})

describe('familiar time zones (R22) and spoken labels (R19)', () => {
  const nov = Date.parse('2026-11-01T12:00:00Z')
  const jul = Date.parse('2026-07-01T12:00:00Z')
  it('maps the big zones the en-US locale leaves as GMT offsets', () => {
    expect(zoneAbbr(nov, 'Asia/Tokyo')).toBe('JST')
    expect(zoneAbbr(nov, 'Asia/Seoul')).toBe('KST')
    expect(zoneAbbr(nov, 'Asia/Kolkata')).toBe('IST')
    expect(zoneAbbr(nov, 'Europe/Paris')).toBe('CET')
    expect(zoneAbbr(jul, 'Europe/Berlin')).toBe('CEST')
    expect(zoneAbbr(jul, 'Europe/Athens')).toBe('EEST')
    expect(zoneAbbr(nov, 'Europe/London')).toBe('GMT')
    expect(zoneAbbr(jul, 'Europe/London')).toBe('BST')
    expect(zoneAbbr(nov, 'Australia/Sydney')).toBe('AEDT')
    expect(zoneAbbr(jul, 'Australia/Sydney')).toBe('AEST')
    expect(zoneAbbr(nov, 'Australia/Perth')).toBe('AWST')
    expect(zoneAbbr(nov, 'America/Sao_Paulo')).toBe('UTC−3')
  })
  it('nautical zones read as offsets at sea, never "Etc/GMT+9"', () => {
    expect(zoneAbbr(nov, 'Etc/GMT+9')).toBe('UTC−9')
    expect(zoneLabel(nov, 'Etc/GMT+9')).toBe('UTC−9 · at sea')
    expect(zoneLabel(nov, 'America/New_York')).toBe('America/New York')
    expect(utcLabel(330)).toBe('UTC+5:30')
  })
  it('spells dates and ages out for screen readers', () => {
    const t = Date.parse('2026-11-06T16:21:00Z')
    expect(fmtSpokenDay(t, TZ)).toBe('Friday 6 November')
    expect(spokenRelative(t, t + 41 * 3_600_000)).toBe('41 hours ago')
    expect(fmtDayMonth(t, TZ)).toBe('6 Nov')
  })
})

// ── polish round 2: the photo order (owner B1 + D1) and the headline (owner F) ─────────────────

describe('photos: one order everywhere (owner B1 + D1)', () => {
  const cap = (id: string, over: Partial<Capture> = {}): Capture => ({ ...s2, id, itemId: id, ...over })
  const mos = (id: string, gsdM: number): Capture => ({ ...viirs, id, itemId: id, gsdM })

  it('what counts as clear comes from the photo square: a partly clear Sentinel-2 photo yields to a clear Landsat one', () => {
    const s2 = cap('S', { spot: 'clear', cloudCoverPct: 30, clearFraction: 0.42 })
    const ls = cap('L', { collection: 'landsat-c2-l2', gsdM: 30, spot: 'clear', cloudCoverPct: 10, clearFraction: 0.97 })
    const passes = [pass({ captureId: 'S', tClosest: 200 }), pass({ captureId: 'L', tClosest: 100 })]
    const set = orderPhotos({ captures: [s2, ls], passes })
    expect(set.photos.map((p) => p.key)).toEqual(['L', 'S'])
    expect(set.cover?.why).toBe('closest')
    expect(set.photos[1].clouded).toBe(false) // still listed, not labelled clouded
    // Two clear Sentinel-2 photos: the clearer square wins over the newer one, the higher sun over the newer one.
    const a = cap('A', { spot: 'clear', clearFraction: 0.99 })
    const b = cap('B', { spot: 'clear', clearFraction: 0.72 })
    expect(orderPhotos({ captures: [a, b], passes: [pass({ captureId: 'A', tClosest: 1 }), pass({ captureId: 'B', tClosest: 2 })] }).photos[0].key).toBe('A')
    const lowSun = pass({ captureId: 'A', tClosest: 5, sunElevationDeg: 18 })
    const highSun = pass({ captureId: 'B', tClosest: 1, sunElevationDeg: 31 })
    const even = [cap('A', { spot: 'clear', clearFraction: 1 }), cap('B', { spot: 'clear', clearFraction: 1 })]
    expect(orderPhotos({ captures: even, passes: [lowSun, highSun] }).photos[0].key).toBe('B')
  })
  it('the cover is the most zoomed-in clear photo, then every other photo newest first', () => {
    const a = cap('A', { spot: 'clear', cloudCoverPct: 10 })
    const b = cap('B', { spot: 'cloud', cloudCoverPct: 90 })
    const l = cap('L', { collection: 'landsat-c2-l2', gsdM: 30, spot: 'clear', cloudCoverPct: 1 })
    const m1 = mos('M1', 250)
    const m2 = mos('M2', 375)
    const passes = [
      pass({ captureId: 'A', tClosest: 100 }),
      pass({ captureId: 'B', tClosest: 500 }),
      pass({ captureId: 'L', tClosest: 300 }),
      pass({ norad: 43013, captureId: 'M1', tClosest: 400 }),
      pass({ norad: 43013, captureId: 'M2', tClosest: 200 }),
    ]
    const set = orderPhotos({ captures: [a, b, l, m1, m2], passes })
    expect(set.photos.map((p) => p.key)).toEqual(['A', 'B', 'M1', 'L', 'M2'])
    expect(set.cover?.why).toBe('closest')
    expect(set.windowCount).toBe(5)
    expect(set.photos[1].clouded).toBe(true)
    expect(filterPhotos(set.photos, 'detailed').map((p) => p.key)).toEqual(['A', 'B', 'L'])
    expect(filterPhotos(set.photos, 'weather').map((p) => p.key)).toEqual(['M1', 'M2'])
    expect(filterCounts(set.photos)).toEqual({ all: 5, detailed: 3, weather: 2, radar: 0 })
  })

  it('no clear detailed photo this week: the last clear look from before the window leads, and is not counted', () => {
    const b = cap('B', { spot: 'cloud', cloudCoverPct: 99 })
    const clearCover = cap('OLD', { spot: 'clear', cloudCoverPct: 3, datetime: 5 })
    const set = orderPhotos({ captures: [b, viirs], passes: [pass({ captureId: 'B', tClosest: 50 }), pass({ norad: 43013, captureId: viirs.id, tClosest: 60 })], clearCover })
    expect(set.cover?.why).toBe('lastClear')
    expect(set.photos[0].key).toBe('OLD')
    expect(set.photos[0].pass).toBeUndefined()
    expect(set.photos.map((p) => p.key)).toEqual(['OLD', viirs.id, 'B'])
    expect(set.windowCount).toBe(2)
    // pickBestLook stays within the window (it needs a pass): the least cloudy capture.
    const best = pickBestLook({ captures: [b, viirs], passes: [pass({ captureId: 'B', tClosest: 50 })] })
    expect(best?.capture.id).toBe('B')
  })

  it('no clear image anywhere: the least cloudy capture leads, honestly flagged', () => {
    const b = cap('B', { spot: 'cloud', cloudCoverPct: 99 })
    const c = cap('C', { cloudCoverPct: 80 })
    const set = orderPhotos({ captures: [b, c], passes: [pass({ captureId: 'B', tClosest: 50 }), pass({ captureId: 'C', tClosest: 10 })] })
    expect(set.cover?.why).toBe('clouded')
    expect(set.photos.map((p) => p.key)).toEqual(['C', 'B'])
  })

  it('weather mosaics only: the sharpest (MODIS 250 m beats VIIRS 375 m), lit, then newest', () => {
    const set = orderPhotos({
      captures: [mos('V', 375), mos('T', 250), mos('T2', 250)],
      passes: [
        pass({ norad: 43013, captureId: 'V', tClosest: 30 }),
        pass({ norad: 43013, captureId: 'T', tClosest: 10, sunElevationDeg: 2 }),
        pass({ norad: 43013, captureId: 'T2', tClosest: 5, sunElevationDeg: 30 }),
      ],
    })
    expect(set.photos.map((p) => p.key)).toEqual(['T2', 'V', 'T'])
  })

  it('one canonical URL per (capture, size); the lightbox’s sharper layer is the card’s box at 2000 px', () => {
    expect(cardUrl(s2)).toBe(displayUrl(s2, cropSpec('sentinel-2-l2a')))
    expect(cardUrl(s2)).toContain('/1000x1000.jpg?')
    expect(thumbUrl(s2)).toContain('/112x112.jpg?')
    expect(hiResUrl(s2)).toBe(displayUrl(s2, { ...cropSpec('sentinel-2-l2a'), px: 2000 }))
    expect(hiResUrl(viirs)).toBeUndefined()
    // An Earth Search capture with no Planetary Computer id has one picture (its thumbnail): nothing sharper.
    const thumbOnly = { ...s2, provider: 'earth-search' as const, cropUrl: () => 'https://earth-search.example/thumb.jpg' }
    expect(hiResUrl(thumbOnly)).toBeUndefined()
  })

  it('the sharper layer is the very box of the card on the place’s grid: Sentinel-2 2×, Landsat 4×, the card’s curve', () => {
    const at = { lat: 52.517, lon: 13.3889 }
    for (const [coll, id, scale] of [
      ['sentinel-2-l2a', 'S2A_MSIL2A_20261105T101121_R022_T33UUU_20261105T164009', 2],
      ['landsat-c2-l2', 'LC09_L2SP_193023_20261101_02_T1', 4],
    ] as const) {
      const c = { ...s2, collection: coll, itemId: id, cropUrl: (o: CropOpts) => pcCropUrl(coll, id, at, o) }
      const card = cardUrl(c)
      const hi = hiResUrl(c)!
      const box = (u: string) => /\/item\/bbox\/([^/]+)\//.exec(u)![1]
      expect(box(hi)).toBe(box(card)) // the same native box: registers over the card pixel for pixel
      expect(hi).toContain('/2000x2000.jpg?')
      expect(hi).toContain('&coord_crs=EPSG:32633&dst_crs=EPSG:32633&')
      expect(hi).toContain('&resampling=lanczos')
      const pc = tonePlanForUrl(card)!
      const ph = tonePlanForUrl(hi)!
      expect(ph.key).toBe(pc.key) // one curve per capture and place
      expect(ph.maskUrl).toBe(pc.maskUrl) // the mask already fetched
      expect(pc.metresPerPx / ph.metresPerPx).toBe(2)
      expect((ph.box[2] - ph.box[0]) / ph.metresPerPx / ((ph.box[2] - ph.box[0]) / (coll === 'sentinel-2-l2a' ? 10 : 30))).toBe(scale)
      expect(isMagnifiedView(ph)).toBe(true) // toned with the curve the card was shown with
      expect(isMagnifiedView(pc)).toBe(false)
      expect(placeOffset(c, at)).toEqual(((): { dx: number; dy: number } => {
        const o = placeInCrop(hi, at.lat, at.lon)!
        return { dx: o.fx - 0.5, dy: o.fy - 0.5 }
      })()) // the reticle sits on the same ground in both
    }
  })

  it('Landsat 8 / 9: the sharper layer is the card pan-sharpened with its 15 m band, the 30 m layer its fallback', () => {
    const at = { lat: 25.1124, lon: 55.139 }
    const id = 'LC09_L2SP_160043_20261103_02_T1'
    const t = Date.UTC(2026, 10, 3, 6, 46)
    const ls = (platform: string) => ({ ...s2, collection: 'landsat-c2-l2' as const, itemId: id, platform, datetime: t, cropUrl: (o: CropOpts) => pcCropUrl('landsat-c2-l2', id, at, o) })
    const l9 = ls('landsat-9')
    const p = parsePanSharpUrl(hiResUrl(l9)!)!
    expect(p.cardUrl).toBe(cardUrl(l9))
    expect(p.fallbackUrl).toBe(displayUrl(l9, { ...cropSpec('landsat-c2-l2'), px: 2000 }))
    expect(p.t).toBe(t)
    // The pan request is one api/pan accepts: the card's very box on its grid (EPSG:32640), at 1000 px.
    const q = new URLSearchParams(panApiPath(p.cardUrl, p.t)!.split('?')[1])
    const r = parsePanQuery(q, t + 86_400_000)
    expect(typeof r).toBe('object')
    expect(r).toMatchObject({ crs: 32640, box: tonePlanForUrl(cardUrl(l9))!.box, t })
    // Landsat 7 has no Level-1 pan on CDSE here: its layer stays the 30 m one.
    expect(hiResUrl(ls('landsat-7'))).toBe(p.fallbackUrl)
  })

  it('asks for the sharper layer only where it shows more than the card', () => {
    expect(hiResHelps(393, 3)).toBe(true) // iPhone 15 Pro: 1179 device px
    expect(hiResHelps(688, 2)).toBe(true) // 1440×900 at 2×: 1376
    expect(hiResHelps(688, 1)).toBe(false) // a 1× laptop at 1×
    expect(hiResHelps(868, 1)).toBe(false) // 1920×1080 at 1×
    expect(hiResHelps(688, 1, 1.25)).toBe(false)
    expect(hiResHelps(688, 1, 1.31)).toBe(true) // the first zoom past 1.3×
  })

  it('turns a heading drawn on a grid-cut photo by the meridian convergence (grid north up), not on others', () => {
    const at = { lat: 59.33, lon: 17.9 } // zone 33's eastern edge: grid north ≈ 2.5° east of true north
    const native = { ...s2, cropUrl: (o: CropOpts) => pcCropUrl('sentinel-2-l2a', 'S2A_MSIL2A_20261105T101121_R022_T33VXF_20261105T145605', at, o) }
    expect(photoHeadingDeg(native, 190)).toBeCloseTo(190 - 2.49, 1)
    expect(photoHeadingDeg(native, 10)).toBeCloseTo(10 - 2.49, 1)
    // The same place's photo from a zone-34 tile is cut on zone 33's grid too: turned the same way (GEO-1).
    const other = { ...s2, cropUrl: (o: CropOpts) => pcCropUrl('sentinel-2-l2a', 'S2A_MSIL2A_20261105T101121_R022_T34VCL_20261105T145605', at, o) }
    expect(photoHeadingDeg(other, 190)).toBeCloseTo(photoHeadingDeg(native, 190), 9)
    const geographic = { ...s2, cropUrl: (o: CropOpts) => pcCropUrl('sentinel-2-l2a', 'S2A_MSIL2A_20261105T101121_R022_T33VXF_20261105T145605', at, { ...o, geographic: true }) }
    expect(photoHeadingDeg(geographic, 190)).toBe(190)
    expect(photoHeadingDeg(viirs, 190)).toBe(190)
  })

  it('finds the place in the photo within a native pixel of its centre, for the lightbox’s reticle', () => {
    const at = { lat: 52.5186, lon: 13.4083 }
    const c = { ...s2, cropUrl: (o: CropOpts) => pcCropUrl('sentinel-2-l2a', 'S2A_MSIL2A_20261105T101121_R022_T33UUU_20261105T164009', at, o) }
    const o = placeOffset(c, at)
    expect(Math.abs(o.dx) * 1000).toBeLessThanOrEqual(0.5)
    expect(Math.abs(o.dy) * 1000).toBeLessThanOrEqual(0.5)
    expect(o.dx !== 0 || o.dy !== 0).toBe(true) // the real offset, not an assumed centre
    // 1 m south of a 0.01° line: the photo steps a pixel over to keep its rounded point; the offset says where.
    const edge = { lat: 52.525 - 1 / 111_200, lon: 13.4083 }
    const ce = { ...s2, cropUrl: (o2: CropOpts) => pcCropUrl('sentinel-2-l2a', 'S2A_MSIL2A_20261105T101121_R022_T33UUU_20261105T164009', edge, o2) }
    const oe = placeOffset(ce, edge)
    expect(Math.abs(oe.dy) * 1000).toBeLessThanOrEqual(1.5)
    expect(placeOffset(viirs, at)).toEqual({ dx: 0, dy: 0 })
  })
})

describe('owner F: polar night never contradicts itself', () => {
  it('the dark sentences name the sun and the infrared sweeps, never "in daylight"', () => {
    const passes = [pass({ norad: 43013, verdict: 'likely', sunElevationDeg: -10 }), pass({ norad: 43013, verdict: 'likely', sunElevationDeg: -12 }), pass({ norad: 25544, verdict: 'overhead' })]
    const h = headline({ captures: [], notes: [], passes }, meta, -4)
    expect(h.zeroKind).toBe('dark')
    expect(h.flewOver).toBe(2)
    expect(h.infraredSweeps).toBe(2)
    const text = plain(darkSentences(h))
    expect(text).toBe('The sun never rose, so no daylight camera could see it. Weather satellites still swept it in infrared, 2 times.')
    expect(text).not.toContain('in daylight')
  })
})

describe('Sentinel-1 radar images: real images, never photographs', () => {
  const radar = (id: string, over: Partial<Capture> = {}): Capture => ({
    id,
    provider: 'planetary-computer',
    collection: 'sentinel-1-rtc',
    itemId: id,
    platform: 'sentinel-1c',
    norad: 62261,
    datetime: 0,
    gsdM: 20,
    cropUrl: ({ halfSizeKm, px }) =>
      `https://planetarycomputer.microsoft.com/api/data/v1/item/bbox/1,2,3,4/${px}x${px}.png?collection=sentinel-1-rtc&item=${id}&assets=vv&expression=x&h=${halfSizeKm}`,
    ...over,
  })
  const S1: SatMeta = { norad: 62261, name: 'Sentinel-1C', category: 'radar', profile: { operator: 'ESA / Copernicus', category: 'radar', blurb: '', openArchive: true } }
  const metaS1 = (n: number): SatMeta => (n === 62261 ? S1 : meta(n))
  const opt = (id: string, over: Partial<Capture> = {}): Capture => ({ ...s2, id, itemId: id, spot: 'clear', cloudCoverPct: 5, ...over })

  it('is labelled as radar at its own 20 m, on a 20 km square, with no sharper layer', () => {
    const r = radar('R')
    expect(productLabel(r)).toBe('Sentinel-1 radar · 20 m')
    expect(cropSpec('sentinel-1-rtc')).toEqual({ halfSizeKm: 10, px: 1000 })
    expect(cardUrl(r)).toContain('/1000x1000.jpg?')
    expect(hiResUrl(r)).toBeUndefined()
  })

  it('never leads: the cover is a photo, radar images sit in the newest-first order, and have their own filter', () => {
    const passes = [pass({ captureId: 'A', tClosest: 100 }), pass({ norad: 62261, captureId: 'R1', tClosest: 300 }), pass({ norad: 62261, captureId: 'R2', tClosest: 50 })]
    const set = orderPhotos({ captures: [opt('A'), radar('R1'), radar('R2')], passes })
    expect(set.cover?.photo.key).toBe('A')
    expect(set.photos.map((p) => [p.key, p.kind])).toEqual([
      ['A', 'detailed'],
      ['R1', 'radar'],
      ['R2', 'radar'],
    ])
    expect(set.photos[1].clouded).toBe(false)
    expect(filterPhotos(set.photos, 'radar').map((p) => p.key)).toEqual(['R1', 'R2'])
    expect(filterPhotos(set.photos, 'detailed').map((p) => p.key)).toEqual(['A'])
    expect(filterCounts(set.photos)).toEqual({ all: 3, detailed: 1, weather: 0, radar: 2 })
    const best = pickBestLook({ captures: [opt('A'), radar('R1')], passes })
    expect(best?.capture.id).toBe('A')
  })

  it('a week with radar images only lists them, with no cover (nothing for the results to wait on)', () => {
    const passes = [pass({ norad: 62261, captureId: 'R1', tClosest: 100 }), pass({ norad: 62261, captureId: 'R2', tClosest: 300 })]
    const set = orderPhotos({ captures: [radar('R1'), radar('R2')], passes })
    expect(set.cover).toBeUndefined()
    expect(set.photos.map((p) => p.key)).toEqual(['R2', 'R1'])
    expect(pickBestLook({ captures: [radar('R1')], passes })).toBeNull()
  })

  it('is counted with the photos in the one line, and broken down in the footnote', () => {
    const passes = [pass({ captureId: 'A' }), pass({ norad: 62261, captureId: 'R1' }), pass({ norad: 62261, captureId: 'R2', sunElevationDeg: -30 })]
    const h = headline({ passes, captures: [opt('A'), radar('R1'), radar('R2')], notes: [] }, metaS1)
    expect(h.images).toBe(3)
    expect(h.detailed).toBe(1)
    expect(h.radarImages).toBe(2)
    expect(h.radar).toBeUndefined()
    expect(photosLine(h.images)).toBe('3 images were made public.')
  })

  it('its pass reads as radar: to the side, at 20 m, in the dark when it was', () => {
    const p = pass({ norad: 62261, captureId: 'R1', offNadirDeg: 33.4, sunElevationDeg: -40 })
    const text = plain(passSentences({ pass: p, meta: S1, capture: radar('R1'), timeZone: TZ, placeLabel: 'Waterloo' }))
    expect(text).toContain('Its radar, looking 33.4° to the side, imaged Waterloo at 20 m per pixel, in the dark.')
    expect(text).not.toMatch(/cloud/i)
    // A Sentinel-1 pass with no image: we looked, and say so (a private operator: we can't know).
    const could = plain(passSentences({ pass: { ...p, verdict: 'could', captureId: undefined }, meta: S1, timeZone: TZ, placeLabel: 'Waterloo' }))
    expect(could).toContain('We found no published image of it from this pass.')
    expect(plain(passSentences({ pass: { ...p, norad: 40697, verdict: 'could', captureId: undefined }, meta: meta(40697), timeZone: TZ, placeLabel: 'Waterloo' }))).toContain('We can’t know whether it did.')
  })
})

describe('plan view', () => {
  const radar = (min?: number): SatMeta => ({ norad: 1, name: 'R', category: 'radar', profile: { operator: 'X', category: 'radar', maxOffNadirDeg: 35, minOffNadirDeg: min, blurb: '' } })
  it('splits a radar\'s field of regard around the strip under its track that it cannot see', () => {
    const p = pass({ verdict: 'could', inSwath: false, altitudeKm: 590, headingDeg: 0, azimuthDeg: 270, groundDistanceKm: 100 })
    const g = planGeometry(p, radar(4.5), 0, 0)
    const half = groundRangeAtOffNadirKm(35, 590)
    const blind = groundRangeAtOffNadirKm(4.5, 590)
    expect(blind).toBeGreaterThan(40)
    expect(blind).toBeLessThan(55)
    // Heading north: the band's and the strip's edges sit their half-widths either side of the track (x = −100 km).
    const xs = (q: { x: number }[]) => [Math.min(...q.map((v) => v.x)), Math.max(...q.map((v) => v.x))]
    expect(xs(g.band!)[0]).toBeCloseTo(-100 - half, 6)
    expect(xs(g.band!)[1]).toBeCloseTo(-100 + half, 6)
    expect(xs(g.blind!)[0]).toBeCloseTo(-100 - blind, 6)
    expect(xs(g.blind!)[1]).toBeCloseTo(-100 + blind, 6)
    expect(planGeometry(p, radar(undefined), 0, 0).blind).toBeUndefined()
  })
})
