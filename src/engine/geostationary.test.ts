import { describe, expect, it } from 'vitest'
import { EARTH_RADIUS_KM, haversineKm } from '@/lib/geo'
import { scanAngleAt, scanAngleOf, scanLine, scanSeatOf } from './geostationary'

const DEG = Math.PI / 180
/** GOES-19's seat, on the equator. */
const GOES_EAST = { lat: 0, lon: -75.2, altKm: 35_786 }
const ABIDJAN = { lat: 5.38, lon: -3.94 }
const R = 1 + GOES_EAST.altKm / EARTH_RADIUS_KM
const LIMB = Math.asin(1 / R)

describe('a geostationary scan line', () => {
  it('is seen at angle 0 under the spacecraft, and at ±8.7° at the limbs', () => {
    expect(scanAngleOf(GOES_EAST, { lat: 0, lon: -75.2 })).toBeCloseTo(0, 12)
    // On the meridian under it, central angle c is seen at atan(sin c / (r − cos c)).
    expect(scanAngleOf(GOES_EAST, { lat: 40, lon: -75.2 })).toBeCloseTo(Math.atan2(Math.sin(40 * DEG), R - Math.cos(40 * DEG)), 12)
    expect(scanAngleOf(GOES_EAST, { lat: -40, lon: -75.2 })).toBeCloseTo(-scanAngleOf(GOES_EAST, { lat: 40, lon: -75.2 }), 12)
    expect(LIMB / DEG).toBeCloseTo(8.7, 1)
  })

  it('holds one angle along its whole length: every point of it is seen at that angle', () => {
    for (const eps of [-6, -1.5, 0, 0.85, 4, 7.5].map((d) => d * DEG)) {
      const line = scanLine(GOES_EAST, eps)
      expect(line.reach).toBeGreaterThan(0.5)
      for (const k of [-1, -0.6, -0.2, 0, 0.3, 0.8, 1]) expect(scanAngleOf(GOES_EAST, line.at(k * line.reach))).toBeCloseTo(eps, 9)
    }
  })

  it('crosses the meridian under the spacecraft at φ = 0 and runs east for φ > 0, evenly over the ground', () => {
    const line = scanLine(GOES_EAST, 5 * DEG)
    const mid = line.at(0)
    expect(mid.lon).toBeCloseTo(-75.2, 9)
    expect(mid.lat).toBeCloseTo((Math.asin(R * Math.sin(5 * DEG)) - 5 * DEG) / DEG, 9)
    expect(line.at(0.4).lon).toBeGreaterThan(-75.2)
    expect(line.at(-0.4).lon).toBeLessThan(-75.2)
    // φ is an angle around the line's own circle, so equal steps of it are equal distances on the ground.
    const step = haversineKm(line.at(0), line.at(0.1))
    expect(haversineKm(line.at(0.5), line.at(0.6))).toBeCloseTo(step, 6)
    expect(haversineKm(line.at(-0.9), line.at(-0.8))).toBeCloseTo(step, 6)
  })

  it('stops short of the limb, where the spacecraft sees the ground edge-on', () => {
    for (const eps of [0, 3 * DEG, -7 * DEG]) {
      const line = scanLine(GOES_EAST, eps)
      // cos(central angle from the point under the spacecraft) = 1.25 / r at both ends: 79°, the limb being 81°.
      for (const end of [line.at(line.reach), line.at(-line.reach)]) expect(Math.cos(haversineKm(end, GOES_EAST) / EARTH_RADIUS_KM)).toBeCloseTo(1.25 / R, 9)
    }
    // Near the limb the line is a short arc of a small circle; at the limb itself it has no length.
    expect(scanLine(GOES_EAST, LIMB * 0.98).reach).toBeGreaterThan(1)
    expect(haversineKm(scanLine(GOES_EAST, LIMB * 0.98).at(0), scanLine(GOES_EAST, LIMB * 0.98).at(1))).toBeLessThan(1300)
    expect(scanLine(GOES_EAST, LIMB).reach).toBe(0)
  })

  it('stays near the place’s latitude far from the meridian: the line through Abidjan crosses the Americas at 5°N, not 16°N', () => {
    const eps = scanAngleOf(GOES_EAST, ABIDJAN)
    expect(eps / DEG).toBeCloseTo(0.854, 2)
    const line = scanLine(GOES_EAST, eps)
    expect(line.at(0).lat).toBeCloseTo(4.8, 1)
    // The great circle across the meridian that the line used to be taken for stands at atan(tan φ / cos Δλ) there.
    expect(Math.atan2(Math.tan(ABIDJAN.lat * DEG), Math.cos((ABIDJAN.lon - GOES_EAST.lon) * DEG)) / DEG).toBeCloseTo(16.3, 1)
    // Abidjan is on the line, inside its drawn length (71° of 79°).
    let best = Infinity
    for (let i = 0; i <= 2000; i++) best = Math.min(best, haversineKm(line.at((i / 2000) * line.reach), ABIDJAN))
    expect(best).toBeLessThan(5)
  })
})

describe('a scan pass’s line in time', () => {
  const pass = (node: 'ascending' | 'descending') => {
    const base = { tStart: 1_000_000, tEnd: 1_600_000, altitudeKm: GOES_EAST.altKm, node }
    // The track as geoScanPass lays it: the line's path on the meridian under the spacecraft.
    const track = [0.01, 0.5, 0.99].map((f) => {
      const t = base.tStart + f * 600_000
      const eps = scanAngleAt(base, t)
      return { t, lat: GOES_EAST.lat + (Math.asin(R * Math.sin(eps)) - eps) / DEG, lon: GOES_EAST.lon, altKm: GOES_EAST.altKm }
    })
    return { ...base, track }
  }

  it('steps evenly from the northern limb to the southern for a scan from the north, and the other way from the south', () => {
    const down = pass('descending')
    expect(scanAngleAt(down, down.tStart + 300_000)).toBeCloseTo(0, 12)
    expect(scanAngleAt(down, down.tStart + 150_000)).toBeCloseTo(LIMB / 2, 12)
    expect(scanAngleAt(down, down.tStart + 450_000)).toBeCloseTo(-LIMB / 2, 12)
    expect(scanAngleAt(pass('ascending'), down.tStart + 150_000)).toBeCloseTo(-LIMB / 2, 12)
    // Held just inside the limbs before the scan starts and after it ends.
    expect(scanAngleAt(down, down.tStart - 60_000)).toBeCloseTo(LIMB * 0.98, 12)
    expect(scanAngleAt(down, down.tEnd + 60_000)).toBeCloseTo(-LIMB * 0.98, 12)
  })

  it('gives back where the spacecraft stood', () => {
    const seat = scanSeatOf(pass('descending'))!
    expect(seat.lat).toBeCloseTo(GOES_EAST.lat, 9)
    expect(seat.lon).toBe(GOES_EAST.lon)
    expect(seat.altKm).toBe(GOES_EAST.altKm)
    expect(scanSeatOf({ ...pass('ascending'), track: [] })).toBeUndefined()
  })
})
