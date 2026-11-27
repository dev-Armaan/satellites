/**
 * SGP4 wrappers (satellite.js 7) in the conventions of src/lib/geo.ts.
 *
 *  - Inertial frame: TEME, as output by SGP4.
 *  - Earth-fixed: TEME rotated by GMST (geo.ts `gmst`, identical to satellite.js `gstime`), i.e. the
 *    same pseudo-ECEF the globe uses (`ecefToWorld`).
 *  - lat / lon / altKm are WGS-84 geodetic, which is what maps and geocoders use. When drawing a
 *    satellite next to its ground track, place it with `latLonToWorld(lat, lon, 1 + altKm / R)` so that
 *    it sits exactly above its own track; `ecef` is the true Earth-fixed position (geocentric).
 */
import { sgp4, type SatRec } from 'satellite.js'
import { gmst, julianDate, RAD } from '@/lib/geo'
import type { TrackPoint } from '@/types'
import { satrecFor } from './sgp4'

export interface SatState {
  lat: number
  lon: number
  altKm: number
  /** Earth-fixed position, km (x toward lon 0, z toward the north pole) */
  ecef: [number, number, number]
  /** Inertial speed, km/s */
  velKmS: number
}

/** Minutes since the element set's epoch, as SGP4 wants them. */
export function tsinceMin(satrec: SatRec, ms: number): number {
  return (julianDate(ms) - satrec.jdsatepoch) * 1440
}

/** Epoch of an SGP4 record as epoch ms. */
export function satrecEpochMs(satrec: SatRec): number {
  return (satrec.jdsatepoch - 2440587.5) * 86_400_000
}

export interface Eci {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
}

/** TEME position (km) and velocity (km/s) at `ms`, or null if SGP4 fails (decayed, bad elements). */
export function eciAt(satrec: SatRec, ms: number): Eci | null {
  const pv = sgp4(satrec, tsinceMin(satrec, ms))
  if (!pv) return null
  const p = pv.position
  const v = pv.velocity
  if (!Number.isFinite(p.x) || !Number.isFinite(p.y) || !Number.isFinite(p.z)) return null
  return { x: p.x, y: p.y, z: p.z, vx: v.x, vy: v.y, vz: v.z }
}

const WGS84_A_KM = 6378.137
const WGS84_B_KM = 6356.7523142
const WGS84_F = (WGS84_A_KM - WGS84_B_KM) / WGS84_A_KM
const WGS84_E2 = 2 * WGS84_F - WGS84_F * WGS84_F
const TWO_PI = 2 * Math.PI

/**
 * TEME position → WGS-84 geodetic (radians, km): satellite.js's `eciToGeodetic`, the same arithmetic in the same
 * order, stopped once the latitude no longer changes. The library always runs its 20 rounds, and the iteration is at
 * its fixed point after 3 or 4: this conversion was a quarter of a pass search (871 → 639 ms for a week of every
 * satellite over one place, 2026-11-27), which a phone's two workers feel most. A fixed point repeats itself, so the
 * answer is the library's to the last bit (propagate.test.ts compares them), and pass ids and tracks do not move.
 */
export function geodeticOf(eci: { x: number; y: number; z: number }, theta: number): { longitude: number; latitude: number; height: number } {
  const R = Math.sqrt(eci.x * eci.x + eci.y * eci.y)
  const longitude = ((((Math.atan2(eci.y, eci.x) - theta + Math.PI) % TWO_PI) + TWO_PI) % TWO_PI) - Math.PI
  let latitude = Math.atan2(eci.z, Math.sqrt(eci.x * eci.x + eci.y * eci.y))
  let C = 0
  for (let k = 0; k < 20; k++) {
    C = 1 / Math.sqrt(1 - WGS84_E2 * (Math.sin(latitude) * Math.sin(latitude)))
    const next = Math.atan2(eci.z + WGS84_A_KM * C * WGS84_E2 * Math.sin(latitude), R)
    if (next === latitude) break
    latitude = next
  }
  return { longitude, latitude, height: R / Math.cos(latitude) - WGS84_A_KM * C }
}

/** Geodetic sub-satellite point. */
export interface SubPoint {
  lat: number
  lon: number
  altKm: number
}

export function subPointAt(satrec: SatRec, ms: number): SubPoint | null {
  const e = eciAt(satrec, ms)
  if (!e) return null
  const g = geodeticOf(e, gmst(ms))
  return { lat: g.latitude * RAD, lon: g.longitude * RAD, altKm: g.height }
}

export function stateAt(satrec: SatRec, ms: number): SatState | null {
  const e = eciAt(satrec, ms)
  if (!e) return null
  const theta = gmst(ms)
  const c = Math.cos(theta)
  const s = Math.sin(theta)
  const g = geodeticOf(e, theta)
  return {
    lat: g.latitude * RAD,
    lon: g.longitude * RAD,
    altKm: g.height,
    ecef: [c * e.x + s * e.y, -s * e.x + c * e.y, e.z],
    velKmS: Math.hypot(e.vx, e.vy, e.vz),
  }
}

/**
 * Sampled geodetic track at t0, t0 + step, … ≤ t1 (both ends included when (t1 − t0) is a whole number
 * of steps). Times are computed as t0 + k·step, never accumulated, so they are exact for integer
 * inputs. Points where SGP4 fails are skipped.
 */
export function trackFor(satrec: SatRec, t0: number, t1: number, stepS = 20): TrackPoint[] {
  const out: TrackPoint[] = []
  if (!(t1 >= t0)) return out
  const step = Math.max(1, stepS) * 1000
  const n = Math.floor((t1 - t0) / step + 1e-9)
  for (let k = 0; k <= n; k++) {
    const t = t0 + k * step
    const p = subPointAt(satrec, t)
    if (p) out.push({ t, lat: p.lat, lon: p.lon, altKm: p.altKm })
  }
  return out
}

/** Main-thread SGP4 for one catalog object. Requires loadCatalog() to have resolved. */
export function propagate(norad: number, ms: number): SatState | null {
  const s = satrecFor(norad)
  return s ? stateAt(s, ms) : null
}

/** Ground track of one catalog object over [t0, t1]. Requires loadCatalog() to have resolved. */
export function groundTrack(norad: number, t0: number, t1: number, stepS = 20): TrackPoint[] {
  const s = satrecFor(norad)
  return s ? trackFor(s, t0, t1, stepS) : []
}
