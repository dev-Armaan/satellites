import { describe, expect, it } from 'vitest'
import { Vector3 } from 'three'
import { DEG, EARTH_RADIUS_KM, haversineKm, latLonToWorld, worldToLatLon } from '@/lib/geo'
import type { SatInfo, TrackPoint } from '@/types'
import { scanAngleAt, scanAngleOf, scanLine } from '@/engine/geostationary'
import { buildRibbon, buildScanRibbon, clipAlongTrack, densifyTrack, fieldModelFor, groundRangeAtOffNadirKm, sweptAcross, trackPointAt } from './swath'

/** A straight southbound track along lon −80.5°, 20 s steps, ~7 km/s ground speed (≈ 0.063° per s). */
function southbound(n = 49, t0 = 1_000_000): TrackPoint[] {
  return Array.from({ length: n }, (_, i) => ({ t: t0 + i * 20_000, lat: 70 - i * 1.26, lon: -80.5, altKm: 786 }))
}

describe('densifyTrack', () => {
  it('keeps endpoints and never steps more than the limit', () => {
    const tr = southbound(5)
    const d = densifyTrack(tr, 0.25)
    expect(d[0]).toMatchObject({ lat: tr[0].lat, lon: tr[0].lon })
    expect(d[d.length - 1]).toMatchObject({ lat: tr[4].lat, lon: tr[4].lon })
    for (let i = 1; i < d.length; i++) expect(haversineKm(d[i - 1], d[i])).toBeLessThan(0.2501 * DEG * EARTH_RADIUS_KM)
  })

  it('crosses the antimeridian along the short way', () => {
    const tr: TrackPoint[] = [
      { t: 0, lat: 10, lon: 179, altKm: 700 },
      { t: 20_000, lat: 11, lon: -179, altKm: 700 },
    ]
    const d = densifyTrack(tr, 0.5)
    for (const p of d) expect(Math.abs(p.lon)).toBeGreaterThan(178.9)
  })
})

describe('buildRibbon', () => {
  const track = southbound()
  const tRef = track[24].t
  const r = buildRibbon(track, tRef, () => 145, { lift: 1 })

  it('puts the edges at the swath half-width, perpendicular to the heading', () => {
    const vpr = r.cols + 1
    const mid = Math.floor(r.rows / 2)
    const p = (k: number) => new Vector3(r.positions[k * 3], r.positions[k * 3 + 1], r.positions[k * 3 + 2])
    const centre = worldToLatLon(p(mid * vpr + r.cols / 2))
    const left = worldToLatLon(p(mid * vpr))
    const right = worldToLatLon(p(mid * vpr + r.cols))
    expect(haversineKm(centre, left)).toBeCloseTo(145, 0)
    expect(haversineKm(centre, right)).toBeCloseTo(145, 0)
    // Southbound: left of the motion is east, right is west; both on the centre's parallel (to first order).
    expect(left.lon).toBeGreaterThan(centre.lon)
    expect(right.lon).toBeLessThan(centre.lon)
    expect(Math.abs(left.lat - centre.lat)).toBeLessThan(0.05)
  })

  it('winds every triangle counter-clockwise seen from outside (front faces render)', () => {
    const a = new Vector3()
    const b = new Vector3()
    const c = new Vector3()
    const n = new Vector3()
    for (let t = 0; t < r.index.length; t += 3) {
      a.fromArray(r.positions, r.index[t] * 3)
      b.fromArray(r.positions, r.index[t + 1] * 3)
      c.fromArray(r.positions, r.index[t + 2] * 3)
      n.subVectors(b, a).cross(c.clone().sub(a))
      expect(n.dot(a)).toBeGreaterThan(0)
    }
  })

  it('carries time relative to tRef and side in [−1, 1]', () => {
    expect(Math.min(...r.along)).toBeCloseTo(-480, 6)
    expect(Math.max(...r.along)).toBeCloseTo(480, 6)
    expect(Math.min(...r.side)).toBe(-1)
    expect(Math.max(...r.side)).toBe(1)
    expect(r.halfWidthKm).toBe(145)
  })
})

describe('buildScanRibbon (a geostationary scan: the line itself, the width of the disc)', () => {
  // GOES-19 scanning from the north in 10 minutes; Abidjan is 71° of longitude east of it, near the disc's edge.
  const seat = { lat: 0, lon: -75.2, altKm: 35_786 }
  const abidjan = { lat: 5.38, lon: -3.94 }
  const scan = { tStart: 2_000_000, tEnd: 2_600_000, altitudeKm: seat.altKm, node: 'descending' as const }
  const lineAt = (t: number) => scanLine(seat, scanAngleAt(scan, t))
  // The moment the line is at the angle the spacecraft sees Abidjan at.
  const limb = Math.asin(1 / (1 + seat.altKm / EARTH_RADIUS_KM))
  const tc = scan.tStart + ((limb - scanAngleOf(seat, abidjan)) / (2 * limb)) * 600_000
  const r = buildScanRibbon(lineAt, { tRef: tc, tFrom: tc - 36_000, tTo: tc + 36_000, dir: -1 })
  const vpr = r.cols + 1
  const vertex = (i: number, j: number) => new Vector3().fromArray(r.positions, (i * vpr + j) * 3)

  it('lays one row per moment, all at the lifted radius, with time relative to the crossing', () => {
    expect(r.positions.length).toBe(r.rows * vpr * 3)
    for (let k = 0; k < r.rows * vpr; k++) expect(new Vector3().fromArray(r.positions, k * 3).length()).toBeCloseTo(1.0006, 5)
    expect(r.along[0]).toBeCloseTo(-36, 9)
    expect(r.along[r.along.length - 1]).toBeCloseTo(36, 9)
    const mid = (r.rows - 1) / 2
    for (let j = 0; j <= r.cols; j++) expect(r.along[mid * vpr + j]).toBeCloseTo(0, 9)
    expect(r.u[0]).toBe(0)
    expect(r.u[r.u.length - 1]).toBe(1)
  })

  it('passes over the place at the crossing, though the place is 7,900 km from the point under the spacecraft', () => {
    const mid = (r.rows - 1) / 2
    let best = Infinity
    for (let j = 0; j < r.cols; j++) {
      const a = vertex(mid, j)
      const b = vertex(mid, j + 1)
      for (let k = 0; k <= 20; k++) best = Math.min(best, haversineKm(worldToLatLon(a.clone().lerp(b, k / 20)), abidjan))
    }
    expect(best).toBeLessThan(8)
    expect(haversineKm(abidjan, seat)).toBeGreaterThan(7900)
    // Earlier rows are north of it, later ones south: the line travels south.
    expect(worldToLatLon(vertex(0, r.cols / 2)).lat).toBeGreaterThan(worldToLatLon(vertex(r.rows - 1, r.cols / 2)).lat)
  })

  it('reaches from one side of the disc to the other, and no step along it is long enough to cut under the globe', () => {
    const mid = (r.rows - 1) / 2
    const west = worldToLatLon(vertex(mid, r.cols))
    const east = worldToLatLon(vertex(mid, 0))
    // Southward travel: the first column is on the left of the motion, the east.
    expect(east.lon).toBeGreaterThan(0)
    expect(west.lon).toBeLessThan(-150)
    for (const end of [east, west]) expect(haversineKm(end, seat) / EARTH_RADIUS_KM / DEG).toBeCloseTo(79.1, 0)
    for (let j = 0; j < r.cols; j++) expect(haversineKm(worldToLatLon(vertex(mid, j)), worldToLatLon(vertex(mid, j + 1)))).toBeLessThan(200)
  })

  it('has no swath edges to draw: side stays inside the band where the shader draws none', () => {
    expect(Math.max(...r.side)).toBeLessThanOrEqual(0.45)
    expect(Math.min(...r.side)).toBeGreaterThanOrEqual(-0.45)
  })

  it('winds every triangle outward, for a scan from the north and one from the south', () => {
    const up = { ...scan, node: 'ascending' as const }
    const north = buildScanRibbon((t) => scanLine(seat, scanAngleAt(up, t)), { tRef: tc, tFrom: tc - 36_000, tTo: tc + 36_000, dir: 1, rows: 9, cols: 24 })
    const a = new Vector3()
    const b = new Vector3()
    const c = new Vector3()
    const n = new Vector3()
    for (const ribbon of [r, north]) {
      for (let t = 0; t < ribbon.index.length; t += 3) {
        a.fromArray(ribbon.positions, ribbon.index[t] * 3)
        b.fromArray(ribbon.positions, ribbon.index[t + 1] * 3)
        c.fromArray(ribbon.positions, ribbon.index[t + 2] * 3)
        n.subVectors(b, a).cross(c.clone().sub(a))
        expect(n.dot(a)).toBeGreaterThan(0)
      }
    }
  })
})

describe('field model', () => {
  const sat = (category: SatInfo['category'], profile: Partial<NonNullable<SatInfo['profile']>>): SatInfo => ({
    norad: 1,
    name: 'X',
    displayName: 'X',
    category,
    profile: { operator: 'x', category, blurb: '', ...profile },
  })

  it('uses the fixed swath for pushbroom imagers', () => {
    const m = fieldModelFor(sat('open-optical', { swathKm: 290 }))
    expect(m.mode).toBe('swath')
    expect(m.halfWidthKm(786)).toBe(145)
  })

  it('uses the field of regard for agile imagers', () => {
    const m = fieldModelFor(sat('commercial-optical', { maxOffNadirDeg: 30, swathKm: 13 }))
    expect(m.mode).toBe('regard')
    expect(m.halfWidthKm(500)).toBeCloseTo(groundRangeAtOffNadirKm(30, 500), 9)
    // 30° off nadir from 500 km is a little under 300 km of ground range.
    expect(m.halfWidthKm(500)).toBeGreaterThan(280)
    expect(m.halfWidthKm(500)).toBeLessThan(300)
  })

  it('draws no ribbon for crewed stations', () => {
    expect(fieldModelFor(sat('crewed', {})).mode).toBe('none')
  })
})

describe('sweptAcross', () => {
  const t = 1_000_000
  it('fires once when playback crosses the closest approach', () => {
    expect(sweptAcross(t - 500, t + 500, t)).toBe(true)
    expect(sweptAcross(t - 500, t, t)).toBe(true)
    expect(sweptAcross(t, t + 500, t)).toBe(false) // already past on the previous frame
  })
  it('ignores pauses, rewinds and seeks', () => {
    expect(sweptAcross(t - 500, t - 500, t)).toBe(false)
    expect(sweptAcross(t + 500, t - 500, t)).toBe(false)
    expect(sweptAcross(t - 3_600_000, t + 1, t)).toBe(false)
  })
})

describe('trackPointAt', () => {
  it('interpolates along the great circle and returns null outside the track', () => {
    const tr = southbound(3)
    const mid = trackPointAt(tr, tr[0].t + 10_000)!
    expect(mid.lat).toBeCloseTo((tr[0].lat + tr[1].lat) / 2, 2)
    expect(trackPointAt(tr, tr[0].t - 1)).toBeNull()
    const w = latLonToWorld(mid.lat, mid.lon)
    expect(w.length()).toBeCloseTo(1, 12)
  })
})

describe('clipAlongTrack (G6: ±700 km around the place)', () => {
  const track = densifyTrack(southbound(), 0.5)
  const tRef = 1_000_000 + 24 * 20_000 + 7_000 // between samples
  const clipped = clipAlongTrack(track, tRef, 700)
  const ref = trackPointAt(track, tRef)!

  it('keeps exactly ±700 km of ground track around closest approach', () => {
    expect(haversineKm(clipped[0], ref)).toBeCloseTo(700, -1)
    expect(haversineKm(clipped[clipped.length - 1], ref)).toBeCloseTo(700, -1)
    for (const p of clipped) expect(haversineKm(p, ref)).toBeLessThan(701)
  })

  it('keeps times monotonic and the ribbon builds from it', () => {
    for (let i = 1; i < clipped.length; i++) expect(clipped[i].t).toBeGreaterThan(clipped[i - 1].t)
    const r = buildRibbon(southbound(), tRef, () => 145, { clipKm: 700 })
    const lats: number[] = []
    for (let k = 0; k < r.positions.length / 3; k++) lats.push(worldToLatLon(new Vector3(r.positions[k * 3], r.positions[k * 3 + 1], r.positions[k * 3 + 2])).lat)
    // ~1400 km of track ≈ 12.6° of latitude on a north–south track (plus nothing beyond)
    expect(Math.max(...lats) - Math.min(...lats)).toBeLessThan(13)
    expect(Math.max(...lats) - Math.min(...lats)).toBeGreaterThan(12)
  })

  it('returns the track unchanged when it is shorter than the clip', () => {
    const short = densifyTrack(southbound(5), 0.5)
    expect(clipAlongTrack(short, short[2].t, 5000).length).toBe(short.length)
  })
})
