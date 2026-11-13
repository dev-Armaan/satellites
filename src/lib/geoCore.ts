/**
 * Scalar geometry (no three.js): the shell, the engine and the workers use only these. src/lib/geo.ts is the
 * public module (it re-exports this and the Vector3 helpers of geo3.ts); see its header for the conventions.
 */
export const EARTH_RADIUS_KM = 6371.0
/** WGS-84 equatorial radius used by SGP4 */
export const EARTH_EQ_RADIUS_KM = 6378.137
export const MU_KM3_S2 = 398600.4418
export const J2 = 1.08262668e-3
export const DEG = Math.PI / 180
export const RAD = 180 / Math.PI
export const MS_PER_DAY = 86_400_000

/** Julian date from epoch ms */
export function julianDate(ms: number): number {
  return ms / MS_PER_DAY + 2440587.5
}

/** Greenwich Mean Sidereal Time in radians (IAU 1982), adequate for visualisation + pass geometry. */
export function gmst(ms: number): number {
  const jd = julianDate(ms)
  const t = (jd - 2451545.0) / 36525
  let g =
    -6.2e-6 * t * t * t + 0.093104 * t * t + (876600 * 3600 + 8640184.812866) * t + 67310.54841 // seconds
  g = ((g * DEG) / 240) % (2 * Math.PI)
  return g < 0 ? g + 2 * Math.PI : g
}

/** Rotate an ECI (TEME-ish) vector into ECEF by GMST. */
export function eciToEcef(x: number, y: number, z: number, ms: number): [number, number, number] {
  const g = gmst(ms)
  const c = Math.cos(g)
  const s = Math.sin(g)
  return [c * x + s * y, -s * x + c * y, z]
}

/**
 * Unit vector from Earth centre to the Sun in ECI (low precision, ~0.01°), per the Astronomical Almanac.
 */
export function sunEci(ms: number): [number, number, number] {
  const n = julianDate(ms) - 2451545.0
  const L = (280.46 + 0.9856474 * n) % 360
  const g = ((357.528 + 0.9856003 * n) % 360) * DEG
  const lambda = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * DEG
  const eps = (23.439 - 0.0000004 * n) * DEG
  return [Math.cos(lambda), Math.cos(eps) * Math.sin(lambda), Math.sin(eps) * Math.sin(lambda)]
}

/** Unit vector from Earth centre to the Sun in ECEF (plain numbers; no three.js on the shell's path). */
export function sunEcefUnit(ms: number): [number, number, number] {
  const [x, y, z] = sunEci(ms)
  const [ex, ey, ez] = eciToEcef(x, y, z, ms)
  const r = Math.hypot(ex, ey, ez) || 1
  return [ex / r, ey / r, ez / r]
}

/**
 * Sub-solar point. Scalar maths (same result as worldToLatLon(sunDirectionWorld(ms))): the HUD and the boot
 * log call this, and it must not pull three's Vector3/Quaternion into the first bundle.
 */
export function subsolarPoint(ms: number): { lat: number; lon: number } {
  const [ex, ey, ez] = sunEcefUnit(ms)
  return { lat: Math.asin(clamp(ez, -1, 1)) * RAD, lon: Math.atan2(ey, ex) * RAD }
}

/** Sun elevation (degrees) at a place — positive = above horizon. */
export function sunElevationDeg(lat: number, lon: number, ms: number): number {
  const [ex, ey, ez] = sunEcefUnit(ms)
  const c = Math.cos(lat * DEG)
  // ECEF unit vector of the place · sun direction
  const dot = c * Math.cos(lon * DEG) * ex + c * Math.sin(lon * DEG) * ey + Math.sin(lat * DEG) * ez
  return Math.asin(clamp(dot, -1, 1)) * RAD
}

/** Great-circle distance in km (haversine) */
export function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const dLat = (b.lat - a.lat) * DEG
  const dLon = (b.lon - a.lon) * DEG
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * DEG) * Math.cos(b.lat * DEG) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(s)))
}

/** Initial bearing from a to b, degrees from north */
export function bearingDeg(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const φ1 = a.lat * DEG
  const φ2 = b.lat * DEG
  const Δλ = (b.lon - a.lon) * DEG
  const y = Math.sin(Δλ) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
  return (Math.atan2(y, x) * RAD + 360) % 360
}

/** Square bbox (lon/lat) of half-size km around a point: [minLon, minLat, maxLon, maxLat] */
export function bboxAround(lat: number, lon: number, halfKm: number): [number, number, number, number] {
  const dLat = (halfKm / EARTH_RADIUS_KM) * RAD
  const dLon = dLat / Math.max(0.01, Math.cos(lat * DEG))
  return [lon - dLon, lat - dLat, lon + dLon, lat + dLat]
}

/**
 * The date ("YYYY-MM-DD") a daily mosaic files a daytime look at longitude `lon` under. NASA's daily layers start
 * each day at the antimeridian and fill westward with the daylight, so a mosaic's day is the local solar date on
 * the ground, not the UTC date of the pass: Terra over Tokyo at 23:27Z on the 12th is in the mosaic of the 13th,
 * and NOAA-20 over Honolulu at 00:17Z on the 12th is in the mosaic of the 11th (checked against GIBS, 2026-11-13).
 * Daytime passes are hours from local midnight, so mean solar time is exact enough.
 */
export function mosaicDate(ms: number, lon: number): string {
  return new Date(ms + (lon / 15) * 3_600_000).toISOString().slice(0, 10)
}

export const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
