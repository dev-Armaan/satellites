/**
 * Pass overlay geometry: the ground track and the swath ribbon, built from real great-circle offsets.
 *
 * For every (densified) track point P with ground-track direction T, the swath edge points are
 *   Q(s) = P·cos(δ) + R̂·sin(δ),  δ = s · halfWidthKm / R,  R̂ = T × P (to the right of the motion)
 * i.e. they lie on the great circle through P perpendicular to the heading, exactly where a pushbroom
 * sensor's scan line falls on a spherical Earth. The ribbon is subdivided across-track so wide swaths
 * (3,000 km for VIIRS) follow the curvature instead of cutting through the globe.
 */
import { Vector3 } from 'three'
import { DEG, EARTH_RADIUS_KM, latLonToWorld } from '@/lib/geo'
import type { SatInfo, TrackPoint } from '@/types'

const R = EARTH_RADIUS_KM

// ───────────────────────────── field model (mirrors src/engine/passes.ts) ─────────────────────────────

/** Ground range (km) from the sub-satellite point to where a line of sight at `offNadirDeg` meets the surface. */
export function groundRangeAtOffNadirKm(offNadirDeg: number, altKm: number): number {
  const r = R + altKm
  const s = (r / R) * Math.sin(offNadirDeg * DEG)
  const horizon = Math.acos(R / r)
  if (s >= 1) return horizon * R
  return Math.min(horizon, Math.asin(s) - offNadirDeg * DEG) * R
}

export type FieldMode = 'swath' | 'regard' | 'none'

export interface FieldModel {
  /** swath: fixed nadir-centred sensor footprint; regard: where an agile imager could point */
  mode: FieldMode
  halfWidthKm: (altKm: number) => number
}

/**
 * What to draw around the ground track, matching how the engine decides inSwath / inFieldOfRegard
 * (engine passTargetFor + fieldRadiusKm). Crewed and ambient objects get no ribbon.
 */
export function fieldModelFor(info: SatInfo | undefined): FieldModel {
  const p = info?.profile
  switch (info?.category) {
    case 'open-optical':
    case 'weather-leo':
      if (p?.swathKm) {
        const half = p.swathKm / 2
        return { mode: 'swath', halfWidthKm: () => half }
      }
      break
    case 'commercial-optical':
    case 'radar':
      if (p?.maxOffNadirDeg) {
        const eta = p.maxOffNadirDeg
        return { mode: 'regard', halfWidthKm: (alt) => groundRangeAtOffNadirKm(eta, alt) }
      }
      if (p?.swathKm) {
        const half = p.swathKm / 2
        return { mode: 'swath', halfWidthKm: () => half }
      }
      break
  }
  return { mode: 'none', halfWidthKm: () => 0 }
}

/**
 * A geostationary scan (a pass with `geostationary`): a swath in kind, though its ribbon and curtain are not built
 * around a ground track at all (`buildScanRibbon`): the line reaches right across the disc.
 */
export const GEO_SCAN_FIELD: FieldModel = { mode: 'swath', halfWidthKm: () => 5000 }

// ───────────────────────────── track ─────────────────────────────

/**
 * Subdivide a sampled ground track along great circles so no step exceeds `maxStepDeg`.
 * Times and altitudes are interpolated linearly.
 */
export function densifyTrack(track: TrackPoint[], maxStepDeg = 0.5): TrackPoint[] {
  if (track.length < 2) return track.slice()
  const out: TrackPoint[] = []
  const a = new Vector3()
  const b = new Vector3()
  const m = new Vector3()
  for (let i = 0; i < track.length - 1; i++) {
    const p = track[i]
    const q = track[i + 1]
    latLonToWorld(p.lat, p.lon, 1, a)
    latLonToWorld(q.lat, q.lon, 1, b)
    const ang = a.angleTo(b)
    const n = Math.max(1, Math.ceil(ang / (maxStepDeg * DEG)))
    for (let k = 0; k < n; k++) {
      const f = k / n
      slerpUnit(a, b, ang, f, m)
      out.push({
        t: p.t + (q.t - p.t) * f,
        lat: Math.asin(Math.max(-1, Math.min(1, m.y))) / DEG,
        lon: Math.atan2(-m.z, m.x) / DEG,
        altKm: p.altKm + (q.altKm - p.altKm) * f,
      })
    }
  }
  out.push({ ...track[track.length - 1] })
  return out
}

function slerpUnit(a: Vector3, b: Vector3, ang: number, f: number, out: Vector3): Vector3 {
  if (ang < 1e-9) return out.copy(a)
  const s = Math.sin(ang)
  const wa = Math.sin((1 - f) * ang) / s
  const wb = Math.sin(f * ang) / s
  return out.set(a.x * wa + b.x * wb, a.y * wa + b.y * wb, a.z * wa + b.z * wb)
}

// ───────────────────────────── ribbon ─────────────────────────────

export interface Ribbon {
  /** xyz per vertex, world units at `lift` radius */
  positions: Float32Array
  /** seconds relative to tRef, per vertex */
  along: Float32Array
  /** −1 (left edge) … 0 (ground track) … +1 (right edge), per vertex */
  side: Float32Array
  /** 0 … 1 along the ribbon, per vertex (for end fades) */
  u: Float32Array
  index: Uint32Array
  rows: number
  cols: number
  /** Half width at tRef (km); 0 for a track-only ribbon */
  halfWidthKm: number
}

/**
 * Build the swath ribbon around a ground track. `halfWidthKm` may vary with altitude (field of regard).
 * A zero half width still yields a thin ribbon (`minHalfWidthKm`) so the ground track itself can be drawn
 * by the same shader.
 */
export function buildRibbon(
  track: TrackPoint[],
  tRef: number,
  halfWidthKm: (altKm: number) => number,
  opts: { lift?: number; minHalfWidthKm?: number; maxStepDeg?: number; crossStepKm?: number; clipKm?: number } = {},
): Ribbon {
  const lift = opts.lift ?? 1.0006
  const minHalf = opts.minHalfWidthKm ?? 25
  let pts = densifyTrack(track, opts.maxStepDeg ?? 0.5)
  if (opts.clipKm !== undefined) pts = clipAlongTrack(pts, tRef, opts.clipKm)
  const rows = pts.length
  const halfAt = (alt: number) => Math.max(minHalf, halfWidthKm(alt))
  const maxHalf = pts.reduce((m, p) => Math.max(m, halfAt(p.altKm)), 0)
  // Even number of columns so there is always a centre column (s = 0) for the ground track line.
  let cols = Math.ceil((2 * maxHalf) / (opts.crossStepKm ?? 110))
  cols = Math.min(64, Math.max(2, cols + (cols % 2)))
  const vpr = cols + 1
  const n = rows * vpr
  const positions = new Float32Array(n * 3)
  const along = new Float32Array(n)
  const side = new Float32Array(n)
  const u = new Float32Array(n)

  const P = pts.map((p) => latLonToWorld(p.lat, p.lon, 1))
  const T = new Vector3()
  const right = new Vector3()
  const q = new Vector3()
  const t0 = pts[0]?.t ?? tRef
  const span = Math.max(1, (pts[rows - 1]?.t ?? tRef) - t0)

  for (let i = 0; i < rows; i++) {
    const prev = P[Math.max(0, i - 1)]
    const next = P[Math.min(rows - 1, i + 1)]
    T.subVectors(next, prev)
    T.addScaledVector(P[i], -T.dot(P[i]))
    if (T.lengthSq() < 1e-18) T.set(0, 1, 0)
    T.normalize()
    right.crossVectors(T, P[i]).normalize()
    const delta = halfAt(pts[i].altKm) / R
    for (let j = 0; j <= cols; j++) {
      const s = (j / cols) * 2 - 1
      const a = s * delta
      q.copy(P[i]).multiplyScalar(Math.cos(a)).addScaledVector(right, Math.sin(a)).multiplyScalar(lift)
      const k = i * vpr + j
      positions[k * 3] = q.x
      positions[k * 3 + 1] = q.y
      positions[k * 3 + 2] = q.z
      along[k] = (pts[i].t - tRef) / 1000
      side[k] = s
      u[k] = (pts[i].t - t0) / span
    }
  }

  const index = new Uint32Array(Math.max(0, rows - 1) * cols * 6)
  let w = 0
  for (let i = 0; i < rows - 1; i++) {
    for (let j = 0; j < cols; j++) {
      const a = i * vpr + j
      const b = a + 1
      const c = a + vpr
      const d = c + 1
      // Counter-clockwise seen from outside the globe (rows run along-track, columns left → right).
      index[w++] = a
      index[w++] = b
      index[w++] = c
      index[w++] = b
      index[w++] = d
      index[w++] = c
    }
  }
  const mid = pts.reduce((best, p) => (Math.abs(p.t - tRef) < Math.abs(best.t - tRef) ? p : best), pts[0])
  return { positions, along, side, u, index, rows, cols, halfWidthKm: mid ? halfWidthKm(mid.altKm) : 0 }
}

/** A geostationary scan line on the ground at one moment (engine geostationary.ts scanLine). */
export interface GroundLine {
  at(phi: number): { lat: number; lon: number }
  reach: number
}

/**
 * The ribbon of a geostationary scan: each row is the scan line itself at one moment, from one end of its drawn
 * length to the other, for the moments between `tFrom` and `tTo`. Nothing here is a great circle around a ground
 * track: a scan line is the cut of a plane through the spacecraft (a circle on the sphere), and it runs the width of
 * the disc, so a place at the disc's edge is on it too. Built around a track (as `buildRibbon` does) the line was
 * 5,000 km of a great circle either side of the meridian under the spacecraft: it never reached such a place, and
 * crossed the middle of the disc up to 1,300 km from where the imager was looking (2026-11-12, Abidjan from GOES-19).
 *
 * `dir` is the line's travel: −1 southward (a scan from the north), +1 northward. Columns run left to right of that
 * travel, as in `buildRibbon`, so the faces look outward. `side` stays inside ±0.45: the shader draws a swath's
 * edges from |side| = 0.5 out, and a scan line has no edges to draw (it ends where the disc does, and the shader
 * thins it out over its last 7%: uEndFade).
 */
export function buildScanRibbon(
  lineAt: (t: number) => GroundLine,
  o: { tRef: number; tFrom: number; tTo: number; dir: 1 | -1; lift?: number; rows?: number; cols?: number },
): Ribbon {
  const lift = o.lift ?? 1.0006
  const rows = Math.max(2, o.rows ?? 51)
  // 96 columns of a line at most 17,500 km long: 180 km a step, which sags 0.6 km under the sphere (the lift is 3.8).
  const cols = Math.max(2, o.cols ?? 96)
  const vpr = cols + 1
  const n = rows * vpr
  const positions = new Float32Array(n * 3)
  const along = new Float32Array(n)
  const side = new Float32Array(n)
  const u = new Float32Array(n)
  const q = new Vector3()
  const span = Math.max(1, o.tTo - o.tFrom)
  for (let i = 0; i < rows; i++) {
    const t = o.tFrom + (span * i) / (rows - 1)
    const line = lineAt(t)
    for (let j = 0; j <= cols; j++) {
      const s = (j / cols) * 2 - 1
      // East is to the right of a northward travel, to the left of a southward one.
      const p = line.at(o.dir * s * line.reach)
      latLonToWorld(p.lat, p.lon, lift, q)
      const k = i * vpr + j
      positions[k * 3] = q.x
      positions[k * 3 + 1] = q.y
      positions[k * 3 + 2] = q.z
      along[k] = (t - o.tRef) / 1000
      side[k] = s * 0.45
      u[k] = i / (rows - 1)
    }
  }
  const index = new Uint32Array((rows - 1) * cols * 6)
  let w = 0
  for (let i = 0; i < rows - 1; i++) {
    for (let j = 0; j < cols; j++) {
      const a = i * vpr + j
      const b = a + 1
      const c = a + vpr
      const d = c + 1
      index[w++] = a
      index[w++] = b
      index[w++] = c
      index[w++] = b
      index[w++] = d
      index[w++] = c
    }
  }
  return { positions, along, side, u, index, rows, cols, halfWidthKm: 0 }
}

/**
 * The part of a (densified) track within ±clipKm of ground distance, measured along the track, from the point
 * at tRef (closest approach: abeam of the place). Ends are interpolated, so the cut is exact.
 */
export function clipAlongTrack(pts: TrackPoint[], tRef: number, clipKm: number): TrackPoint[] {
  if (pts.length < 2) return pts.slice()
  const P = pts.map((p) => latLonToWorld(p.lat, p.lon, 1))
  const cum = new Float64Array(pts.length)
  for (let i = 1; i < pts.length; i++) cum[i] = cum[i - 1] + P[i - 1].angleTo(P[i]) * R
  // Along-track distance of tRef (interpolated between the samples around it).
  let d0 = cum[0]
  if (tRef <= pts[0].t) d0 = cum[0]
  else if (tRef >= pts[pts.length - 1].t) d0 = cum[pts.length - 1]
  else {
    for (let i = 0; i < pts.length - 1; i++) {
      if (pts[i + 1].t >= tRef) {
        const f = (tRef - pts[i].t) / Math.max(1e-9, pts[i + 1].t - pts[i].t)
        d0 = cum[i] + (cum[i + 1] - cum[i]) * f
        break
      }
    }
  }
  const lo = d0 - clipKm
  const hi = d0 + clipKm
  const at = (d: number): TrackPoint => {
    let i = 0
    while (i < pts.length - 2 && cum[i + 1] < d) i++
    const seg = Math.max(1e-9, cum[i + 1] - cum[i])
    const f = Math.min(1, Math.max(0, (d - cum[i]) / seg))
    const m = slerpUnit(P[i], P[i + 1], P[i].angleTo(P[i + 1]), f, new Vector3())
    return {
      t: pts[i].t + (pts[i + 1].t - pts[i].t) * f,
      lat: Math.asin(Math.max(-1, Math.min(1, m.y))) / DEG,
      lon: Math.atan2(-m.z, m.x) / DEG,
      altKm: pts[i].altKm + (pts[i + 1].altKm - pts[i].altKm) * f,
    }
  }
  const out: TrackPoint[] = []
  if (lo > cum[0]) out.push(at(lo))
  for (let i = 0; i < pts.length; i++) if (cum[i] > lo && cum[i] < hi) out.push(pts[i])
  if (hi < cum[pts.length - 1]) out.push(at(hi))
  return out.length >= 2 ? out : pts.slice()
}

/**
 * True when playback carried sim time across `tCross` this frame (prev < tCross ≤ now), moving forward by less
 * than `maxStepMs`. Larger jumps are seeks, not playback, and must not fire the crossing flash.
 */
export function sweptAcross(prev: number, now: number, tCross: number, maxStepMs = 5 * 60_000): boolean {
  const step = now - prev
  return step > 0 && step < maxStepMs && prev < tCross && now >= tCross
}

/** Position on the track at time `ms` (great-circle interpolation between samples), or null outside it. */
export function trackPointAt(track: TrackPoint[], ms: number): TrackPoint | null {
  if (track.length === 0 || ms < track[0].t || ms > track[track.length - 1].t) return null
  let lo = 0
  let hi = track.length - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (track[mid].t <= ms) lo = mid
    else hi = mid
  }
  const p = track[lo]
  const q = track[hi]
  const f = q.t === p.t ? 0 : (ms - p.t) / (q.t - p.t)
  const a = latLonToWorld(p.lat, p.lon)
  const b = latLonToWorld(q.lat, q.lon)
  const m = slerpUnit(a, b, a.angleTo(b), f, new Vector3())
  return { t: ms, lat: Math.asin(Math.max(-1, Math.min(1, m.y))) / DEG, lon: Math.atan2(-m.z, m.x) / DEG, altKm: p.altKm + (q.altKm - p.altKm) * f }
}
