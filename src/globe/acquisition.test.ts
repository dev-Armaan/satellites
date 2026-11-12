import { describe, expect, it } from 'vitest'
import { Vector3 } from 'three'
import { EARTH_RADIUS_KM, latLonToWorld } from '@/lib/geo'
import type { Pass, Report } from '@/types'
import {
  approachStart,
  coverPass,
  decalSpecFor,
  DIVE_KM,
  diveAt,
  geoDiveAt,
  needsNoSun,
  decalLitFor,
  imageFocus,
  fmtCountdown,
  MIN_APPROACH_S,
  PAINT_REAL_S,
  scanAt,
  scanFrame,
  slowFactor,
  slowWindowS,
} from './acquisition'
import { acquiredPose, chasePose, DIVE_TILT, freeRect, rangeForGroundKm } from './framing'
import { pickBestLook } from '@/ui/results/lib/bestLook'

const TC = 1_800_000_000_000

/** Real seconds a replay at `rate` takes from `from` to `to` (sim ms), slow motion included. */
function realSeconds(from: number, to: number, halfKm: number, speed: number, rate: number) {
  let t = from
  let real = 0
  const dt = 1 / 240
  while (t < to) {
    t += rate * slowFactor(t, TC, halfKm, speed, rate) * dt * 1000
    real += dt
  }
  return real
}

describe('acquisition timing', () => {
  it('slows the replay around closest approach so a Sentinel-2 decal paints over ~PAINT_REAL_S', () => {
    expect(slowFactor(TC - 120_000, TC, 40, 6.8, 30)).toBe(1)
    const floor = slowFactor(TC, TC, 40, 6.8, 30)
    expect(floor).toBeGreaterThan(0.15)
    expect(floor).toBeLessThan(0.4)
    const paint = realSeconds(TC - (40 / 6.8) * 1000, TC + (40 / 6.8) * 1000, 40, 6.8, 30)
    expect(paint).toBeGreaterThan(PAINT_REAL_S * 0.85)
    expect(paint).toBeLessThan(PAINT_REAL_S * 1.15)
  })

  it('does not slow a wide daily mosaic (it already paints slowly enough) nor a pass without an image', () => {
    expect(slowFactor(TC, TC, 300, 6.6, 30)).toBe(1)
    expect(slowFactor(TC, TC, 0, 6.8, 30)).toBe(1)
  })

  it('rewinds a short lead so the approach takes at least MIN_APPROACH_S, and keeps a long one', () => {
    const seeded = TC - 36_000 // results: 1.2 s at 30×
    const start = approachStart(seeded, TC, 40, 6.8, 30)
    expect(start).toBeLessThan(seeded)
    expect(realSeconds(start, TC, 40, 6.8, 30)).toBeGreaterThanOrEqual(MIN_APPROACH_S - 0.05)
    expect(TC - start).toBeLessThanOrEqual(88_000)
    expect(approachStart(TC - 300_000, TC, 40, 6.8, 30)).toBe(TC - 300_000)
    expect(approachStart(TC + 1000, TC, 40, 6.8, 30)).toBe(TC + 1000)
  })

  it('the full sequence (2.4–3.6 s flight + approach + 1.2 s settle) lands in 6–8 s at the default rate', () => {
    const approach = realSeconds(approachStart(TC - 36_000, TC, 40, 6.8, 30), TC, 40, 6.8, 30)
    const settle = 0.22 + 1.2
    for (const flight of [2.4, 3.6]) {
      const total = flight + approach + settle
      expect(total).toBeGreaterThanOrEqual(6)
      expect(total).toBeLessThanOrEqual(8)
    }
  })

  it('formats the countdown in sim time', () => {
    expect(fmtCountdown(TC - 72_000, TC)).toBe('T−00:01:12')
    expect(fmtCountdown(TC, TC)).toBe('T+00:00:00')
    expect(fmtCountdown(TC + 3_400, TC)).toBe('T+00:00:03')
  })

  it('the slow-motion window covers the decal', () => {
    expect(slowWindowS(40, 6.8) * 6.8).toBeGreaterThan(40)
  })

  it('dives onto the place as the scan line closes in: a wide chase first, on the place before the image paints', () => {
    const at = (km: number) => diveAt(TC - (km / 6.8) * 1000, TC, 6.8, 40)
    expect(at(DIVE_KM.far + 5)).toBe(0)
    expect(at(DIVE_KM.near)).toBeCloseTo(1, 9)
    expect(at(40)).toBe(1) // the image's leading edge
    expect(diveAt(TC + 3_000, TC, 6.8, 40)).toBe(1) // just after the capture (the chase holds ~0.2 s), still on the place
    let prev = 0
    for (let km = DIVE_KM.far; km >= DIVE_KM.near; km -= 5) {
      const v = at(km)
      expect(v).toBeGreaterThanOrEqual(prev)
      prev = v
    }
    // No dive for wide daily mosaics or passes without an image.
    expect(diveAt(TC, TC, 6.6, 300)).toBe(0)
    expect(diveAt(TC, TC, 6.8, 0)).toBe(0)
    // In real time: at least ~0.7 s of wide chase, a ~1 s dive, and the dive done before the image starts painting.
    const start = approachStart(TC - 36_000, TC, 40, 6.8, 30)
    const tFar = TC - (DIVE_KM.far / 6.8) * 1000
    const tNear = TC - (DIVE_KM.near / 6.8) * 1000
    expect(realSeconds(start, tFar, 40, 6.8, 30)).toBeGreaterThan(0.7)
    const dive = realSeconds(tFar, tNear, 40, 6.8, 30)
    expect(dive).toBeGreaterThan(0.8)
    expect(dive).toBeLessThan(1.4)
  })
})

describe('decal and scan geometry', () => {
  it("crops per collection, smaller on phones; a geostationary frame is the gallery card's own image on every screen", () => {
    expect(decalSpecFor('sentinel-2-l2a', false)).toEqual({ halfSizeKm: 40, px: 1024 })
    expect(decalSpecFor('landsat-c2-l2', true)).toEqual({ halfSizeKm: 45, px: 768 })
    expect(decalSpecFor('gibs-viirs-noaa20', false)?.halfSizeKm).toBe(300)
    expect(decalSpecFor('sentinel-1-rtc', false)).toEqual({ halfSizeKm: 40, px: 1024 })
    for (const mobile of [false, true]) {
      expect(decalSpecFor('gibs-goes-east', mobile)).toEqual({ halfSizeKm: 400, px: 1024 })
      expect(decalSpecFor('eumetsat-meteosat-iodc', mobile)).toEqual({ halfSizeKm: 400, px: 1024 })
    }
  })

  it('radar images and geostationary frames show on the night side; photos and daily mosaics only by day', () => {
    expect(needsNoSun('https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&LAYERS=GOES-West_ABI_GeoColor&STYLES=&TIME=2026-11-11T07:10:00Z')).toBe(true)
    expect(needsNoSun('https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&LAYERS=Himawari_AHI_Band13_Clean_Infrared&TIME=x')).toBe(true)
    expect(needsNoSun('https://view.eumetsat.int/geoserver/ows?service=WMS&layers=msg_iodc%3Air108&time=x')).toBe(true)
    expect(needsNoSun('https://planetarycomputer.microsoft.com/api/data/v1/item/bbox/1,2,3,4/1024x1024.jpg?collection=sentinel-1-rtc&item=x')).toBe(true)
    expect(needsNoSun('https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&LAYERS=VIIRS_NOAA20_CorrectedReflectance_TrueColor&TIME=2026-11-10')).toBe(false)
    expect(needsNoSun('https://planetarycomputer.microsoft.com/api/data/v1/item/bbox/1,2,3,4/1024x1024.jpg?collection=sentinel-2-l2a&item=x')).toBe(false)
  })

  it('a geostationary frame is painted whole (its dark pixels are night or sea, not no-data); radar and photos keep the black key', () => {
    expect(decalLitFor('https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&LAYERS=Himawari_AHI_Band3_Red_Visible_1km&TIME=x')).toBe(2)
    expect(decalLitFor('https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&LAYERS=GOES-West_ABI_GeoColor&TIME=x')).toBe(2)
    expect(decalLitFor('https://view.eumetsat.int/geoserver/ows?service=WMS&layers=mtg_fd%3Argb_geocolour&time=x')).toBe(2)
    expect(decalLitFor('https://planetarycomputer.microsoft.com/api/data/v1/item/bbox/1,2,3,4/1024x1024.jpg?collection=sentinel-1-rtc&item=x')).toBe(1)
    expect(decalLitFor('https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&LAYERS=VIIRS_NOAA20_CorrectedReflectance_TrueColor&TIME=2026-11-10')).toBe(0)
    expect(decalLitFor('https://planetarycomputer.microsoft.com/api/data/v1/item/bbox/1,2,3,4/1024x1024.jpg?collection=sentinel-2-l2a&item=x')).toBe(0)
  })

  it('a geostationary scan holds behind the spacecraft, then dives in the last seconds before the line arrives', () => {
    expect(geoDiveAt(TC - 80_000, TC)).toBe(0) // the opening shot from 35,786 km
    expect(geoDiveAt(TC - 42_000, TC)).toBe(0)
    expect(geoDiveAt(TC - 27_000, TC)).toBeGreaterThan(0.3)
    expect(geoDiveAt(TC - 13_000, TC)).toBe(1) // on the frame before it paints
    expect(geoDiveAt(TC, TC)).toBe(1)
  })

  it('the scan frame sits on the track at closest approach and points along the motion', () => {
    // A descending track along lon −80, through lat 44 at TC.
    const track = [-60, -30, 0, 30, 60].map((s) => ({ t: TC + s * 1000, lat: 44 - (s * 6.8) / 111.2, lon: -80, altKm: 786 }))
    const p0 = new Vector3()
    const t0 = new Vector3()
    scanFrame({ track, tClosest: TC, headingDeg: 180 }, p0, t0)
    expect(p0.distanceTo(latLonToWorld(44, -80, 1))).toBeLessThan(1e-6)
    expect(Math.abs(t0.dot(p0))).toBeLessThan(1e-9)
    // Moving south: t0 points to lower latitudes.
    expect(t0.dot(latLonToWorld(43, -80, 1).sub(latLonToWorld(44, -80, 1)))).toBeGreaterThan(0)
    // The scan line moves at ground speed.
    expect(scanAt(TC + 10_000, TC, 6.8) * EARTH_RADIUS_KM).toBeCloseTo(68, 6)
  })

  it('a geostationary scan’s frame sits on the place, pointing the way its line travels there, not on the meridian under the spacecraft', () => {
    // GOES-19's line through Abidjan: its path on the spacecraft's meridian is 71° of longitude away.
    const abidjan = { lat: 5.38, lon: -3.94 }
    const track = [-60, 0, 60].map((s) => ({ t: TC + s * 1000, lat: 4.8 - s * 0.16, lon: -75.2, altKm: 35_786 }))
    const p0 = new Vector3()
    const t0 = new Vector3()
    scanFrame({ track, tClosest: TC, headingDeg: 180.7, geostationary: true }, p0, t0, abidjan)
    expect(p0.distanceTo(latLonToWorld(abidjan.lat, abidjan.lon, 1))).toBeLessThan(1e-9)
    expect(Math.abs(t0.dot(p0))).toBeLessThan(1e-9)
    expect(t0.length()).toBeCloseTo(1, 9)
    // South, and a touch west of it: the place 100 km on along heading 180.7° is the furthest along t0.
    const south = latLonToWorld(abidjan.lat - 0.9, abidjan.lon, 1).sub(p0)
    const east = latLonToWorld(abidjan.lat, abidjan.lon + 0.9, 1).sub(p0)
    expect(t0.dot(south)).toBeGreaterThan(0.015)
    expect(t0.dot(east)).toBeLessThan(0)
    expect(Math.abs(t0.dot(east))).toBeLessThan(t0.dot(south) * 0.02)
    // At tc the image's development front (the points with N · t0 = 0) is on the place, so it paints as the line arrives.
    expect(scanAt(TC, TC, 20)).toBe(0)
    // Without a place (a pass that is not a scan, or none known) the track decides, as before.
    scanFrame({ track, tClosest: TC, headingDeg: 180.7, geostationary: true }, p0, t0)
    expect(p0.distanceTo(latLonToWorld(4.8, -75.2, 1))).toBeLessThan(1e-6)
  })

  it('prefetches the cover the panel leads with: the most zoomed-in CLEAR capture, not the sharpest clouded one (R3-17)', () => {
    const pass = (id: string, t: number, captureId: string): Pass => ({ id, tClosest: t, verdict: 'imaged', captureId }) as unknown as Pass
    const cap = (id: string, collection: string, gsdM: number, spot?: string, cloudCoverPct?: number) => ({
      id,
      provider: collection.startsWith('gibs') ? 'gibs' : 'planetary-computer',
      collection,
      gsdM,
      spot,
      cloudCoverPct,
    })
    const report = (captures: ReturnType<typeof cap>[], partial = false) =>
      ({ partial, passes: captures.map((c, i) => pass(`p${c.id}`, i + 1, c.id)), captures, geo: [] }) as unknown as Report
    // A clouded Sentinel-2 frame (10 m) loses to a clear Landsat one (30 m): the cover is clear first.
    expect(coverPass(report([cap('s2cloud', 'sentinel-2-l2a', 10, 'cloud', 95), cap('ls', 'landsat-c2-l2', 30, 'clear', 5)]))?.id).toBe('pls')
    // Scene cloud ≥ 70 % is clouded even with an unknown spot.
    expect(coverPass(report([cap('s2', 'sentinel-2-l2a', 10, 'unknown', 80), cap('ls', 'landsat-c2-l2', 30, 'unknown', 20)]))?.id).toBe('pls')
    // Among clear ones: smallest gsd, then clearest spot, then newest.
    expect(coverPass(report([cap('a', 'sentinel-2-l2a', 10, 'cirrus'), cap('b', 'sentinel-2-l2a', 10, 'clear'), cap('c', 'landsat-c2-l2', 30, 'clear')]))?.id).toBe('pb')
    // Everything clouded: the least cloudy detailed capture; no detailed one: the sharpest mosaic.
    expect(coverPass(report([cap('a', 'sentinel-2-l2a', 10, 'cloud', 99), cap('b', 'landsat-c2-l2', 30, 'cloud', 75)]))?.id).toBe('pb')
    expect(coverPass(report([cap('m1', 'gibs-modis-terra', 250, undefined), cap('m2', 'gibs-viirs-noaa20', 375, undefined)]))?.id).toBe('pm1')
    // A partial report waits for the final one.
    expect(coverPass(report([cap('ls', 'landsat-c2-l2', 30, 'clear')], true))).toBeUndefined()
  })

  it('agrees with the results panel (lib/bestLook pickBestLook) on random reports', () => {
    let seed = 7
    const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
    const collections = ['sentinel-2-l2a', 'landsat-c2-l2', 'gibs-viirs-noaa20', 'gibs-modis-terra'] as const
    const gsd: Record<string, number> = { 'sentinel-2-l2a': 10, 'landsat-c2-l2': 30, 'gibs-viirs-noaa20': 375, 'gibs-modis-terra': 250 }
    const spots = ['clear', 'cirrus', 'unknown', 'shadow', 'cloud', undefined]
    for (let k = 0; k < 400; k++) {
      const n = 1 + Math.floor(rnd() * 8)
      const captures = Array.from({ length: n }, (_, i) => {
        const collection = collections[Math.floor(rnd() * collections.length)]
        return {
          id: `c${i}`,
          provider: collection.startsWith('gibs') ? 'gibs' : 'planetary-computer',
          collection,
          gsdM: gsd[collection],
          spot: collection.startsWith('gibs') ? undefined : spots[Math.floor(rnd() * spots.length)],
          cloudCoverPct: rnd() < 0.2 ? undefined : Math.round(rnd() * 100),
          clearFraction: collection.startsWith('gibs') || rnd() < 0.4 ? undefined : Math.round(rnd() * 100) / 100,
          sunElevationDeg: Math.round(rnd() * 50),
          datetime: 0,
        }
      })
      const passes = captures.map((c, i) => ({
        id: `p${i}`,
        tClosest: Math.floor(rnd() * 1e6),
        verdict: rnd() < 0.85 ? 'imaged' : 'likely',
        captureId: c.id,
        sunElevationDeg: Math.round(rnd() * 60) - 5,
        offNadirDeg: Math.round(rnd() * 150) / 10,
      }))
      const r = { partial: false, passes, captures, geo: [] } as unknown as Report
      const look = pickBestLook(r)
      const want = look ? look.pass.id : undefined
      expect(coverPass(r)?.id).toBe(want)
    }
  })
})

describe('the painted image focus', () => {
  const place = { lat: 25.1124, lon: 55.139 }
  const deg = (km: number) => km / 111.32
  const kx = Math.cos((place.lat * Math.PI) / 180)

  it('stays on the place when the image covers the whole crop, or without a footprint', () => {
    const all: [number, number][] = [
      [54, 24],
      [57, 24],
      [57, 26.5],
      [54, 26.5],
    ]
    const f = imageFocus(place, 40, all)
    expect(f.lat).toBeCloseTo(place.lat, 6)
    expect(f.lon).toBeCloseTo(place.lon, 6)
    expect(imageFocus(place, 40, undefined)).toEqual({ lat: place.lat, lon: place.lon })
  })

  it('leans toward the data when a tile edge cuts the crop, keeping the place near the middle', () => {
    // Data only east of a meridian 10 km west of the place: the valid part's centre is ~15 km east.
    const edge = place.lon - deg(10) / kx
    const east: [number, number][] = [
      [edge, 24],
      [57, 24],
      [57, 26.5],
      [edge, 26.5],
    ]
    const f = imageFocus(place, 40, east)
    const dxKm = (f.lon - place.lon) * kx * 111.32
    expect(dxKm).toBeGreaterThan(8)
    expect(dxKm).toBeLessThanOrEqual(0.45 * 40 + 1e-6)
    expect(Math.abs(f.lat - place.lat)).toBeLessThan(1e-6)
    // A corner: data only north-east of the place; the shift is capped.
    const ne: [number, number][] = [
      [place.lon, place.lat],
      [57, place.lat],
      [57, 26.5],
      [place.lon, 26.5],
    ]
    const g = imageFocus(place, 40, ne)
    const d = Math.hypot((g.lon - place.lon) * kx, g.lat - place.lat) * 111.32
    expect(g.lat).toBeGreaterThan(place.lat)
    expect(g.lon).toBeGreaterThan(place.lon)
    expect(d).toBeLessThanOrEqual(0.45 * 40 + 1e-6)
  })

  it('ignores a sliver of data', () => {
    const edge = place.lon + deg(38) / kx
    const sliver: [number, number][] = [
      [edge, 24],
      [57, 24],
      [57, 26.5],
      [edge, 26.5],
    ]
    expect(imageFocus(place, 40, sliver)).toEqual({ lat: place.lat, lon: place.lon })
  })
})

describe('acquisition camera poses', () => {
  const vp = { width: 1440, height: 900 }
  const insets = { top: 80, right: 480, bottom: 220, left: 0 }

  it('the acquired view is near top-down, north-up and frames the image at a fixed share of the free rect', () => {
    const spec = acquiredPose(vp, insets, { lat: 43.47, lon: -80.54 }, 40)
    expect(spec.headingDeg).toBe(0)
    expect(spec.tilt!).toBeLessThan(0.1)
    const fill = rangeForGroundKm(vp, freeRect(vp, insets), 80) / spec.range
    expect(fill).toBeGreaterThan(0.45)
    expect(fill).toBeLessThan(0.55)
  })

  it('the dive ends on the place, less oblique, with the painted image at a readable size', () => {
    const sat = latLonToWorld(44.2, -81.6, 1 + 786 / EARTH_RADIUS_KM)
    const place = { lat: 43.47, lon: -80.54 }
    const wide = chasePose(vp, insets, sat, place, 0, 40)
    const close = chasePose(vp, insets, sat, place, 1, 40)
    expect(close.lat).toBeCloseTo(place.lat, 6)
    expect(close.lon).toBeCloseTo(place.lon, 6)
    expect(close.r!).toBeCloseTo(1, 6)
    expect(close.tilt!).toBeCloseTo(DIVE_TILT.desktop, 6)
    expect(close.range).toBeLessThan(wide.range / 4)
    const fill = rangeForGroundKm(vp, freeRect(vp, insets), 80) / close.range
    expect(fill).toBeGreaterThan(0.46)
    expect(fill).toBeLessThan(0.54)
    // Half way is between the two, and never closer than the end.
    const mid = chasePose(vp, insets, sat, place, 0.5, 40)
    expect(mid.range).toBeLessThan(wide.range)
    expect(mid.range).toBeGreaterThan(close.range)
    // Without an image there is nothing to dive onto.
    expect(chasePose(vp, insets, sat, place, 1, 0).range).toBeCloseTo(wide.range, 9)
  })

  it('the chase looks at the midpoint between the place and the spacecraft, oblique and north-up', () => {
    const sat = latLonToWorld(46, -81, 1 + 786 / EARTH_RADIUS_KM)
    const spec = chasePose(vp, insets, sat, { lat: 43.47, lon: -80.54 })
    expect(spec.headingDeg).toBe(0)
    expect(spec.tilt!).toBeGreaterThan(0.7)
    expect(spec.r!).toBeGreaterThan(1)
    expect(spec.lat).toBeGreaterThan(43.47)
    expect(spec.lat).toBeLessThan(46)
  })
})
