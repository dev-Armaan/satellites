/**
 * Pass prediction: every time a satellite's field of interest swept over the place.
 *
 * ── Definitions ──────────────────────────────────────────────────────────────────────────────────────
 *  d(t)   ground distance (km, haversine on R = 6371) between the place and the satellite's geodetic
 *         sub-satellite point. The pass's closest approach is the local minimum of d.
 *  R_f    field-of-interest radius around the sub-satellite point (km):
 *           'swath'      swathKm / 2                         (fixed pushbroom: open-optical, weather, Flock)
 *           'regard'     ground range at maxOffNadirDeg      (agile commercial imagers, SAR)
 *           'elevation'  ground range where elevation ≥ 10°  (crewed stations, "overhead")
 *  A pass is a contiguous interval with d(t) ≤ R_f.
 *  A side-looking radar also has a blind strip: it cannot image a place whose off-nadir angle at closest approach is
 *  below its minOffNadirDeg (the place stays that far across track for the whole pass), so such a pass is found but
 *  is not in its field of regard, and gets no verdict.
 *
 * ── Search (two stages, provably complete) ───────────────────────────────────────────────────────────
 *  1. Coarse: θ(t) is the angle at Earth's centre between the satellite and the place (cheap: one SGP4
 *     call, one GMST rotation, one dot product). θ changes no faster than ω_max = the satellite's peak
 *     orbital angular rate (at perigee) + Earth's rotation, with a 10% allowance for perturbations.
 *     We march with conservative advancement: step = |θ − θ_f| / ω_max (clamped to [5 s, 30 min]),
 *     where θ_f is the field angle at apogee altitude plus a margin covering geocentric/geodetic
 *     latitude differences. Between two samples the Lipschitz bound gives
 *         min θ ≥ (θ_a + θ_b − ω_max·Δt) / 2,
 *     and every interval whose bound reaches θ_f is a candidate. Far from the place a single step spans
 *     tens of minutes, so a 7-day window costs ~2–3k SGP4 calls per satellite instead of 60k at 10 s.
 *  2. Refine each cluster of candidate intervals with the exact d(t): golden-section search for the
 *     closest approach (±0.5 s), then bisection for entry and exit (±0.5 s). The geometry at closest
 *     approach decides the verdict; rejected clusters cost ~20 SGP4 calls.
 *
 * Pure functions only: this module runs inside the pass workers and in tests.
 */
import { sgp4, type SatRec } from 'satellite.js'
import { bearingDeg, DEG, EARTH_EQ_RADIUS_KM, EARTH_RADIUS_KM, gmst, haversineKm, MU_KM3_S2 } from '@/lib/geo'
import type { CatalogRow, LatLon, Pass, SatInfo } from '@/types'
import { isPassCategory, type PassCategory } from './categories'
import { ROW } from './catalog'
import { satrecFromRow } from './sgp4'
import { elevationDeg, groundRangeAtElevationKm, groundRangeAtOffNadirKm, offNadirDeg, sunElevationAtDeg } from './geometry'
import { subPointAt, trackFor, tsinceMin, type SubPoint } from './propagate'

export type FieldMode = 'swath' | 'regard' | 'elevation'

/** Everything a worker needs to search one satellite (structured-clone friendly). */
export interface PassTarget {
  norad: number
  row: CatalogRow
  category: PassCategory
  mode: FieldMode
  swathKm?: number
  maxOffNadirDeg?: number
  /** Side-looking radars: the blind strip under the track (see the definitions above) */
  minOffNadirDeg?: number
  minElevationDeg?: number
}

export interface PassQuery {
  place: LatLon
  t0: number
  t1: number
}

/** Daylight threshold for optical verdicts (degrees of sun elevation at the place). */
export const DAYLIGHT_SUN_ELEVATION_DEG = 5
/** "Overhead" threshold for crewed stations. */
export const CREWED_MIN_ELEVATION_DEG = 10
/** Objects slower than this (rev/day) are not searched for passes (MEO/GEO/HEO). */
export const MIN_REVS_PER_DAY = 6
/** Half-length of the drawable track around closest approach, and its sampling. */
export const TRACK_HALF_MS = 8 * 60_000
export const TRACK_STEP_S = 20

const EARTH_ROT_RAD_S = 7.2921159e-5
const MIN_STEP_S = 5
const MAX_STEP_S = 1800
/** Window padding so passes straddling the edges still resolve their closest approach. */
const PAD_MS = 20 * 60_000
/** Coarse-stage margin: geocentric vs geodetic latitude (≤ 0.19°) for both ends, plus slack. */
const COARSE_MARGIN_RAD = 0.5 * DEG
const GOLDEN_TOL_MS = 100
const EDGE_TOL_MS = 500
const EDGE_STEP_MS = 15_000
const EDGE_MAX_MS = 45 * 60_000

// ───────────────────────────── targets ─────────────────────────────

/** Decide how to search a satellite, or null if we don't predict passes for it. */
export function passTargetFor(info: SatInfo, row: CatalogRow): PassTarget | null {
  if (!isPassCategory(info.category)) return null
  if (!(row[ROW.meanMotion] >= MIN_REVS_PER_DAY)) return null
  const p = info.profile
  const base = { norad: info.norad, row, category: info.category }
  switch (info.category) {
    case 'crewed':
      return { ...base, mode: 'elevation', minElevationDeg: CREWED_MIN_ELEVATION_DEG }
    case 'open-optical':
    case 'weather-leo':
      return p?.swathKm ? { ...base, mode: 'swath', swathKm: p.swathKm } : null
    case 'commercial-optical':
    case 'radar':
      if (p?.maxOffNadirDeg)
        return { ...base, mode: 'regard', maxOffNadirDeg: p.maxOffNadirDeg, minOffNadirDeg: p.minOffNadirDeg, swathKm: p.swathKm }
      if (p?.swathKm) return { ...base, mode: 'swath', swathKm: p.swathKm }
      return null
  }
}

/** Field-of-interest radius (km) for a target at a given altitude. */
export function fieldRadiusKm(t: PassTarget, altKm: number): number {
  switch (t.mode) {
    case 'swath':
      return (t.swathKm ?? 0) / 2
    case 'regard':
      return groundRangeAtOffNadirKm(t.maxOffNadirDeg ?? 0, altKm)
    case 'elevation':
      return groundRangeAtElevationKm(t.minElevationDeg ?? CREWED_MIN_ELEVATION_DEG, altKm)
  }
}

/** Mean-element bounds used by the coarse stage. */
function orbitBounds(row: CatalogRow): { omegaMax: number; apogeeAltKm: number } {
  const n = (row[ROW.meanMotion] * 2 * Math.PI) / 86_400 // rad/s
  const e = Math.min(0.99, Math.max(0, row[ROW.ecc]))
  const a = Math.cbrt(MU_KM3_S2 / (n * n))
  // Peak true-anomaly rate (at perigee) bounds the angular rate of the radius vector.
  const nuDotMax = (n * (1 + e) ** 2) / (1 - e * e) ** 1.5
  return { omegaMax: nuDotMax * 1.1 + EARTH_ROT_RAD_S, apogeeAltKm: a * (1 + e) - EARTH_EQ_RADIUS_KM + 30 }
}

// ───────────────────────────── exact distance ─────────────────────────────

function distanceKm(satrec: SatRec, place: LatLon, ms: number): number {
  const p = subPointAt(satrec, ms)
  return p ? haversineKm(place, p) : Number.POSITIVE_INFINITY
}

/** Golden-section search for the minimum of d on [a, b]. */
function goldenMin(f: (t: number) => number, a: number, b: number, tol = GOLDEN_TOL_MS): number {
  const g = (Math.sqrt(5) - 1) / 2
  let x1 = b - g * (b - a)
  let x2 = a + g * (b - a)
  let f1 = f(x1)
  let f2 = f(x2)
  while (b - a > tol) {
    if (f1 <= f2) {
      b = x2
      x2 = x1
      f2 = f1
      x1 = b - g * (b - a)
      f1 = f(x1)
    } else {
      a = x1
      x1 = x2
      f1 = f2
      x2 = a + g * (b - a)
      f2 = f(x2)
    }
  }
  // Compare the interior estimate against the bracket ends (minimum may sit on an end).
  const mid = (a + b) / 2
  let best = mid
  let fb = f(mid)
  for (const t of [a, b]) {
    const v = f(t)
    if (v < fb) {
      fb = v
      best = t
    }
  }
  return best
}

/** Bisection for the boundary between inside (f ≤ 0) at tIn and outside (f > 0) at tOut. */
function bisectEdge(f: (t: number) => number, tIn: number, tOut: number): number {
  while (Math.abs(tOut - tIn) > EDGE_TOL_MS) {
    const m = (tIn + tOut) / 2
    if (f(m) <= 0) tIn = m
    else tOut = m
  }
  return (tIn + tOut) / 2
}

// ───────────────────────────── verdicts ─────────────────────────────

/** Verdict rules (see docs/ARCHITECTURE.md). `null` = not worth reporting. */
export function verdictFor(
  category: PassCategory,
  g: { inSwath: boolean; inFieldOfRegard: boolean; elevationDeg: number; sunElevationDeg: number },
): Pass['verdict'] | null {
  const day = g.sunElevationDeg >= DAYLIGHT_SUN_ELEVATION_DEG
  switch (category) {
    case 'open-optical':
      return g.inSwath && day ? 'likely' : null
    case 'weather-leo':
      return g.inSwath ? 'likely' : null
    case 'commercial-optical':
      return (g.inSwath || g.inFieldOfRegard) && day ? 'could' : null
    case 'radar':
      return g.inSwath || g.inFieldOfRegard ? 'could' : null
    case 'crewed':
      return g.elevationDeg >= CREWED_MIN_ELEVATION_DEG ? 'overhead' : null
  }
}

// ───────────────────────────── pass assembly ─────────────────────────────

/**
 * Stable pass id for URLs and shares: NORAD id + closest-approach minute. Recomputing the report later
 * reproduces tClosest to ~0.1 s, and one satellite cannot pass the same place twice within a minute.
 */
export function passId(norad: number, tClosest: number): string {
  return `${norad}-${Math.round(tClosest / 60_000)}`
}

export interface Geometry {
  sub: SubPoint
  groundDistanceKm: number
  offNadirDeg: number
  elevationDeg: number
  azimuthDeg: number
  headingDeg: number
  groundSpeedKmS: number
  node: 'ascending' | 'descending'
  sunElevationDeg: number
  inSwath: boolean
  inFieldOfRegard: boolean
  fieldKm: number
}

function geometryAt(satrec: SatRec, target: PassTarget, place: LatLon, t: number): Geometry | null {
  const sub = subPointAt(satrec, t)
  const before = subPointAt(satrec, t - 1000)
  const after = subPointAt(satrec, t + 1000)
  if (!sub || !before || !after) return null
  const d = haversineKm(place, sub)
  const fieldKm = fieldRadiusKm(target, sub.altKm)
  const off = offNadirDeg(d, sub.altKm)
  // inSwath is only meaningful for fixed nadir-centred sensors; for those the swath IS the field of regard.
  // Side-looking radars carry a swath width in their profile, but it never contains the ground track.
  const inSwath = target.mode === 'swath' && d <= fieldKm
  const inFieldOfRegard = target.mode === 'regard' ? d <= fieldKm && off >= (target.minOffNadirDeg ?? 0) : inSwath
  return {
    sub,
    groundDistanceKm: d,
    offNadirDeg: off,
    elevationDeg: elevationDeg(d, sub.altKm),
    azimuthDeg: bearingDeg(place, sub),
    headingDeg: bearingDeg(before, after),
    groundSpeedKmS: haversineKm(before, after) / 2,
    node: after.lat >= before.lat ? 'ascending' : 'descending',
    sunElevationDeg: sunElevationAtDeg(place.lat, place.lon, t),
    inSwath,
    inFieldOfRegard,
    fieldKm,
  }
}

/** Entry/exit of the field around a closest approach. Falls back to tClosest when already outside. */
function fieldEdges(satrec: SatRec, place: LatLon, tClosest: number, fieldKm: number): [number, number] {
  const f = (t: number) => distanceKm(satrec, place, t) - fieldKm
  if (f(tClosest) > 0) return [tClosest, tClosest]
  const edge = (dir: 1 | -1) => {
    let tIn = tClosest
    for (let dt = EDGE_STEP_MS; dt <= EDGE_MAX_MS; dt += EDGE_STEP_MS) {
      const t = tClosest + dir * dt
      if (f(t) > 0) return bisectEdge(f, tIn, t)
      tIn = t
    }
    return tIn
  }
  return [edge(-1), edge(1)]
}

function assemblePass(
  satrec: SatRec,
  target: PassTarget,
  place: LatLon,
  tClosest: number,
  g: Geometry,
  verdict: Pass['verdict'],
): Pass {
  const [tStart, tEnd] = fieldEdges(satrec, place, tClosest, g.fieldKm).map(Math.round)
  return {
    id: passId(target.norad, tClosest),
    norad: target.norad,
    tClosest,
    tStart,
    tEnd,
    groundDistanceKm: g.groundDistanceKm,
    offNadirDeg: g.offNadirDeg,
    elevationDeg: g.elevationDeg,
    azimuthDeg: g.azimuthDeg,
    altitudeKm: g.sub.altKm,
    groundSpeedKmS: g.groundSpeedKmS,
    headingDeg: g.headingDeg,
    node: g.node,
    sunElevationDeg: g.sunElevationDeg,
    inSwath: g.inSwath,
    inFieldOfRegard: g.inFieldOfRegard,
    verdict,
    track: trackFor(satrec, tClosest - TRACK_HALF_MS, tClosest + TRACK_HALF_MS, TRACK_STEP_S),
  }
}

// ───────────────────────────── search ─────────────────────────────

/** Candidate time intervals [a, b] (ms) where the field may have touched the place. */
export function coarseClusters(satrec: SatRec, target: PassTarget, query: PassQuery): [number, number][] {
  const { omegaMax, apogeeAltKm } = orbitBounds(target.row)
  const thetaF = fieldRadiusKm(target, apogeeAltKm) / EARTH_RADIUS_KM + COARSE_MARGIN_RAD
  const lat = query.place.lat * DEG
  const lon = query.place.lon * DEG
  const ux = Math.cos(lat) * Math.cos(lon)
  const uy = Math.cos(lat) * Math.sin(lon)
  const uz = Math.sin(lat)

  /** Angle at Earth's centre between satellite and place, NaN if SGP4 fails. */
  const theta = (ms: number): number => {
    const pv = sgp4(satrec, tsinceMin(satrec, ms))
    if (!pv) return Number.NaN
    const { x, y, z } = pv.position
    const g = gmst(ms)
    const c = Math.cos(g)
    const s = Math.sin(g)
    // Place direction rotated from Earth-fixed into TEME.
    const dot = (x * (c * ux - s * uy) + y * (s * ux + c * uy) + z * uz) / Math.sqrt(x * x + y * y + z * z)
    return Math.acos(dot > 1 ? 1 : dot < -1 ? -1 : dot)
  }

  const tA = query.t0 - PAD_MS
  const tB = query.t1 + PAD_MS
  const out: [number, number][] = []
  let cA = Number.NaN
  let cB = Number.NaN
  let prevT = Number.NaN
  let prevTh = Number.NaN
  let failures = 0
  let t = tA
  for (;;) {
    const th = theta(t)
    if (!Number.isFinite(th)) {
      // Decayed / invalid at this time: close any open cluster and skip ahead.
      if (++failures > 50) break
      if (!Number.isNaN(cA)) out.push([cA, cB])
      cA = Number.NaN
      prevT = Number.NaN
      if (t >= tB) break
      t = Math.min(tB, t + 600_000)
      continue
    }
    if (!Number.isNaN(prevT)) {
      const lowerBound = (prevTh + th - omegaMax * ((t - prevT) / 1000)) / 2
      if (lowerBound <= thetaF || th <= thetaF || prevTh <= thetaF) {
        if (Number.isNaN(cA)) cA = prevT
        cB = t
      } else if (!Number.isNaN(cA)) {
        out.push([cA, cB])
        cA = Number.NaN
      }
    }
    prevT = t
    prevTh = th
    if (t >= tB) break
    const step = Math.min(MAX_STEP_S, Math.max(MIN_STEP_S, Math.abs(th - thetaF) / omegaMax))
    t = Math.min(tB, t + step * 1000)
  }
  if (!Number.isNaN(cA)) out.push([cA, cB])
  return out
}

/** A closest approach that put the place inside the field, before any verdict rule is applied. */
export interface Approach {
  tClosest: number
  geometry: Geometry
}

/** Every closest approach in [t0, t1] with d ≤ R_f (geometry only, no daylight / verdict rules). */
export function findApproaches(satrec: SatRec, target: PassTarget, query: PassQuery): Approach[] {
  const { place, t0, t1 } = query
  const out: Approach[] = []
  const f = (t: number) => distanceKm(satrec, place, t)
  for (const [a, b] of coarseClusters(satrec, target, query)) {
    // Integer milliseconds: the refinement is good to ±0.1 s, and whole-ms times keep the track
    // samples (tClosest ± k·20 s) and pass ids exact.
    const tMin = Math.round(goldenMin(f, a, b))
    if (tMin < t0 || tMin > t1) continue
    if (out.length && Math.abs(out[out.length - 1].tClosest - tMin) < 60_000) continue
    const g = geometryAt(satrec, target, place, tMin)
    if (!g || g.groundDistanceKm > g.fieldKm) continue
    out.push({ tClosest: tMin, geometry: g })
  }
  return out
}

/** Every reportable pass of one satellite over the place in [t0, t1] (by closest-approach time). */
export function findPassesForSat(satrec: SatRec, target: PassTarget, query: PassQuery): Pass[] {
  const passes: Pass[] = []
  for (const { tClosest, geometry } of findApproaches(satrec, target, query)) {
    const verdict = verdictFor(target.category, geometry)
    if (verdict) passes.push(assemblePass(satrec, target, query.place, tClosest, geometry, verdict))
  }
  return passes
}

/**
 * The closest approach of a satellite to the place within [from, to], as a Pass with the given verdict,
 * regardless of the field rules. Used when an archive scene exists but no predicted pass matched it
 * (e.g. low sun, place at the scene edge). Returns null if SGP4 fails throughout.
 */
export function passNear(
  satrec: SatRec,
  target: PassTarget,
  place: LatLon,
  from: number,
  to: number,
  verdict: Pass['verdict'],
): Pass | null {
  const f = (t: number) => distanceKm(satrec, place, t)
  const step = 30_000
  let best = Number.NaN
  let bestD = Number.POSITIVE_INFINITY
  for (let t = from; t <= to; t += step) {
    const d = f(t)
    if (d < bestD) {
      bestD = d
      best = t
    }
  }
  if (!Number.isFinite(bestD)) return null
  const tMin = Math.round(goldenMin(f, best - step, best + step))
  const g = geometryAt(satrec, target, place, tMin)
  return g ? assemblePass(satrec, target, place, tMin, g, verdict) : null
}

/** Search a batch of targets (worker entry point). `onSat` fires after each satellite. */
export function findPasses(targets: PassTarget[], query: PassQuery, onSat?: (done: number) => void): Pass[] {
  const out: Pass[] = []
  let done = 0
  for (const target of targets) {
    try {
      const satrec = satrecFromRow(target.row)
      if (satrec) for (const p of findPassesForSat(satrec, target, query)) out.push(p)
    } catch (err) {
      // One pathological element set must never cost every other satellite in the chunk its passes.
      console.warn(`Pass search skipped NORAD ${target.norad}:`, err)
    }
    onSat?.(++done)
  }
  return out
}
