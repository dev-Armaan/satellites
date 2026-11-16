import { beforeAll, describe, expect, it } from 'vitest'
import { haversineKm } from '@/lib/geo'
import type { LatLon } from '@/types'
import { getRow, getSatInfo, type LoadedCatalog } from './catalog'
import { satrecFor } from './sgp4'
import { fieldRadiusKm, findApproaches, findPassesForSat, passTargetFor, type PassTarget } from './passes'
import { subPointAt } from './propagate'
import { loadTestCatalog, TOKYO, WATERLOO } from './testing'

let cat: LoadedCatalog
let tEnd: number
beforeAll(() => {
  cat = loadTestCatalog()
  tEnd = Date.parse(cat.fetchedAt)
})

function targetFor(norad: number): PassTarget {
  const t = passTargetFor(getSatInfo(norad)!, getRow(norad)!)
  if (!t) throw new Error(`no target for ${norad}`)
  return t
}

/**
 * Brute-force reference: sample the exact ground distance every second and report every local minimum
 * that lies inside the field (radius evaluated at the altitude of that minimum).
 */
function bruteForce(norad: number, place: LatLon, t0: number, t1: number): number[] {
  const satrec = satrecFor(norad)!
  const target = targetFor(norad)
  const pad = 20 * 60_000
  const out: number[] = []
  let d0 = Number.POSITIVE_INFINITY
  let d1 = Number.POSITIVE_INFINITY
  for (let t = t0 - pad; t <= t1 + pad; t += 1000) {
    const p = subPointAt(satrec, t)
    const d2 = p ? haversineKm(place, p) : Number.POSITIVE_INFINITY
    const tm = t - 1000
    if (d1 < d0 && d1 <= d2 && tm >= t0 && tm <= t1) {
      const pm = subPointAt(satrec, tm)!
      if (d1 <= fieldRadiusKm(target, pm.altKm)) out.push(tm)
    }
    d0 = d1
    d1 = d2
  }
  return out
}

const CASES: { name: string; norad: number; place: LatLon; days: number }[] = [
  { name: 'Sentinel-2A (290 km swath)', norad: 40697, place: WATERLOO, days: 3 },
  { name: 'Landsat 9 (185 km swath)', norad: 49260, place: TOKYO, days: 7 },
  { name: 'Flock 4BE-18 (32 km swath)', norad: 60480, place: TOKYO, days: 7 },
  { name: 'Tiangong (elevation ≥ 10°)', norad: 48274, place: TOKYO, days: 1 },
  { name: 'Aqua at 69.6°N (turning latitude)', norad: 27424, place: { lat: 69.65, lon: 18.96 }, days: 1 },
  { name: 'SkySat-C1 near the equator', norad: 41601, place: { lat: 1.29, lon: 103.85 }, days: 2 },
  { name: 'NOAA-20 (3,040 km swath)', norad: 43013, place: WATERLOO, days: 1 },
  { name: 'ISS (elevation ≥ 10°)', norad: 25544, place: WATERLOO, days: 1 },
  { name: 'WorldView-3 (40° off-nadir)', norad: 40115, place: TOKYO, days: 1 },
  { name: 'ICEYE-X2 (35° off-nadir)', norad: 43800, place: WATERLOO, days: 1 },
]

describe('findApproaches vs 1-second brute force', () => {
  for (const c of CASES) {
    it(c.name, () => {
      const t0 = tEnd - c.days * 86_400_000
      const satrec = satrecFor(c.norad)!
      const target = targetFor(c.norad)
      const ref = bruteForce(c.norad, c.place, t0, tEnd)
      const found = findApproaches(satrec, target, { place: c.place, t0, t1: tEnd }).map((a) => a.tClosest)
      const worst = ref.reduce((m, r) => Math.max(m, Math.min(...found.map((f) => Math.abs(f - r)))), 0)
      console.log(`${c.name}: reference ${ref.length}, found ${found.length}, worst |Δt| ${(worst / 1000).toFixed(2)} s`)
      expect(found.length).toBe(ref.length)
      for (const r of ref) {
        const nearest = Math.min(...found.map((f) => Math.abs(f - r)))
        expect(nearest).toBeLessThan(2000)
      }
    })
  }

  // Narrow swaths are where a coarse search would miss passes. Validate the first members of the
  // narrow-swath families that actually have passes this week, against the brute force over 7 days.
  for (const [label, re] of [
    ['Flock (32 km swath)', /^FLOCK /],
    ['Landsat (185 km swath)', /^LANDSAT/],
    ['Gaofen-1 (60 km swath)', /^GAOFEN-1( 0[2-4])?$/],
  ] as const) {
    it(`${label}: no missed passes over 7 days`, () => {
      const t0 = tEnd - 7 * 86_400_000
      let checked = 0
      for (const s of cat.sats.filter((x) => re.test(x.name))) {
        const found = findApproaches(satrecFor(s.norad)!, targetFor(s.norad), { place: TOKYO, t0, t1: tEnd })
        if (!found.length) continue
        const ref = bruteForce(s.norad, TOKYO, t0, tEnd)
        console.log(`${s.name}: reference ${ref.length}, found ${found.length}`)
        expect(found.length).toBe(ref.length)
        for (const r of ref) expect(Math.min(...found.map((f) => Math.abs(f.tClosest - r)))).toBeLessThan(2000)
        if (++checked >= 2) break
      }
      if (!checked) {
        // Nobody in the family passed: the brute force must agree for its first member.
        const first = cat.sats.find((x) => re.test(x.name))!
        expect(bruteForce(first.norad, TOKYO, t0, tEnd)).toHaveLength(0)
      }
    })
  }
})

describe('pass records', () => {
  it('fills geometry consistently for a Sentinel-2 week over Waterloo', () => {
    const t0 = tEnd - 7 * 86_400_000
    const passes = findPassesForSat(satrecFor(60989)!, targetFor(60989), { place: WATERLOO, t0, t1: tEnd })
    expect(passes.length).toBeGreaterThan(0)
    for (const p of passes) {
      expect(p.verdict).toBe('likely')
      expect(p.inSwath).toBe(true)
      expect(p.groundDistanceKm).toBeLessThanOrEqual(145)
      expect(p.sunElevationDeg).toBeGreaterThanOrEqual(5)
      expect(p.tStart).toBeLessThanOrEqual(p.tClosest)
      expect(p.tEnd).toBeGreaterThanOrEqual(p.tClosest)
      expect(p.altitudeKm).toBeGreaterThan(770)
      expect(p.altitudeKm).toBeLessThan(810)
      expect(p.offNadirDeg).toBeLessThan(11)
      expect(p.elevationDeg).toBeGreaterThan(70)
      expect(p.groundSpeedKmS).toBeGreaterThan(6.5)
      expect(p.groundSpeedKmS).toBeLessThan(7.2)
      expect(p.track.length).toBe(49)
      expect(p.track[24].t).toBe(p.tClosest)
      // Sentinel-2 is sun-synchronous with a ~10:30 descending node: daytime passes move south.
      expect(p.node).toBe('descending')
    }
  })

  it('keeps a side-looking radar out of the strip under its track', () => {
    // Every ICEYE approach over Jayanagar, Bengaluru in a week: with a 10° blind strip, exactly those closer to the
    // track than 10° off nadir lose their verdict; with none, every approach in the field of regard is a 'could'.
    const q = { place: { lat: 12.928, lon: 77.589 }, t0: tEnd - 7 * 86_400_000, t1: tEnd }
    let seen = 0
    let blind = 0
    for (const s of cat.sats.filter((x) => /^ICEYE-/.test(x.name))) {
      const satrec = satrecFor(s.norad)!
      const open = { ...targetFor(s.norad), minOffNadirDeg: 0 }
      const strip = { ...open, minOffNadirDeg: 10 }
      const approaches = findApproaches(satrec, open, q)
      expect(findPassesForSat(satrec, open, q).map((p) => p.tClosest)).toEqual(approaches.map((a) => a.tClosest))
      const passes = findPassesForSat(satrec, strip, q)
      expect(passes.map((p) => p.tClosest)).toEqual(approaches.filter((a) => a.geometry.offNadirDeg >= 10).map((a) => a.tClosest))
      for (const p of passes) {
        expect(p.verdict).toBe('could')
        expect(p.inFieldOfRegard).toBe(true)
      }
      seen += approaches.length
      blind += approaches.length - passes.length
    }
    expect(blind).toBeGreaterThan(0)
    expect(blind).toBeLessThan(seen)
  })

  it('reports ISS passes as overhead only at ≥ 10° elevation', () => {
    const t0 = tEnd - 7 * 86_400_000
    const passes = findPassesForSat(satrecFor(25544)!, targetFor(25544), { place: WATERLOO, t0, t1: tEnd })
    expect(passes.length).toBeGreaterThan(5)
    for (const p of passes) {
      expect(p.verdict).toBe('overhead')
      expect(p.elevationDeg).toBeGreaterThanOrEqual(9.9)
    }
  })
})

describe('awkward places', () => {
  const PLACES: [string, LatLon][] = [
    ['North Pole', { lat: 90, lon: 0 }],
    ['South Pole station', { lat: -89.99, lon: 139.27 }],
    ['Antimeridian, equator', { lat: 0, lon: 180 }],
    ['Antimeridian, west side', { lat: -17.7, lon: -179.99 }],
    ['Null Island', { lat: 0, lon: 0 }],
  ]
  for (const [name, place] of PLACES) {
    it(`${name}: finite geometry for every pass and agreement with brute force`, () => {
      const t0 = tEnd - 86_400_000
      for (const norad of [43013, 25544, 40115]) {
        const passes = findPassesForSat(satrecFor(norad)!, targetFor(norad), { place, t0, t1: tEnd })
        for (const p of passes) {
          for (const v of [p.tClosest, p.tStart, p.tEnd, p.groundDistanceKm, p.offNadirDeg, p.elevationDeg, p.azimuthDeg, p.headingDeg, p.groundSpeedKmS, p.sunElevationDeg]) {
            expect(Number.isFinite(v)).toBe(true)
          }
        }
        const ref = bruteForce(norad, place, t0, tEnd)
        const found = findApproaches(satrecFor(norad)!, targetFor(norad), { place, t0, t1: tEnd })
        expect(found.length).toBe(ref.length)
      }
    })
  }
})
