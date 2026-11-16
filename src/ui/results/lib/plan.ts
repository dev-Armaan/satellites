/**
 * Plan-view geometry for a pass (pure): local equirectangular projection around the place (km, x east,
 * y south so it maps straight to screen space), the ground track, and the band the instrument could see, less the
 * strip under the track that a side-looking radar cannot (profile minOffNadirDeg, as the engine's verdicts use it).
 */
import { DEG, EARTH_RADIUS_KM } from '@/lib/geo'
import type { Pass } from '@/types'
import type { SatMeta } from './meta'

export interface Pt {
  x: number
  y: number
}

/** Ground range (km) at which a satellite at `altKm` sees the ground `offNadirDeg` off nadir (spherical Earth). */
export function groundRangeAtOffNadirKm(offNadirDeg: number, altKm: number): number {
  const R = EARTH_RADIUS_KM
  const eta = offNadirDeg * DEG
  const s = ((R + altKm) / R) * Math.sin(eta)
  if (s >= 1) return R * (Math.PI / 2 - eta) // beyond the limb: cap at the horizon
  return R * (Math.asin(s) - eta)
}

/** Half-width (km) of the band the instrument could see across track, if known. */
export function fieldHalfWidthKm(p: Pick<Pass, 'altitudeKm'>, meta: Pick<SatMeta, 'profile'>): number | undefined {
  const prof = meta.profile
  if (prof?.maxOffNadirDeg) return groundRangeAtOffNadirKm(prof.maxOffNadirDeg, p.altitudeKm)
  if (prof?.swathKm) return prof.swathKm / 2
  return undefined
}

/** Half-width (km) of the strip under the track that a side-looking radar cannot see, if it has one. */
export function blindHalfWidthKm(p: Pick<Pass, 'altitudeKm'>, meta: Pick<SatMeta, 'profile'>): number | undefined {
  const prof = meta.profile
  return prof?.maxOffNadirDeg && prof.minOffNadirDeg ? groundRangeAtOffNadirKm(prof.minOffNadirDeg, p.altitudeKm) : undefined
}

export function projector(lat0: number, lon0: number) {
  const kx = Math.cos(lat0 * DEG) * EARTH_RADIUS_KM * DEG
  const ky = EARTH_RADIUS_KM * DEG
  return (lat: number, lon: number): Pt => {
    let dl = lon - lon0
    if (dl > 180) dl -= 360
    if (dl < -180) dl += 360
    return { x: dl * kx, y: -(lat - lat0) * ky }
  }
}

export interface PlanGeometry {
  /** sub-satellite point at closest approach */
  sub: Pt
  /** unit direction of motion */
  dir: Pt
  /** unit normal (left of motion) */
  n: Pt
  half?: number
  /** half-size of the view, km */
  extent: number
  track: Pt[]
  /** band polygon (4 points) when the field is known */
  band?: Pt[]
  /** the blind strip's polygon (4 points) inside the band, for a side-looking radar */
  blind?: Pt[]
}

export function planGeometry(p: Pass, meta: Pick<SatMeta, 'profile'>, lat: number, lon: number): PlanGeometry {
  const proj = projector(lat, lon)
  const az = p.azimuthDeg * DEG
  const sub: Pt = { x: p.groundDistanceKm * Math.sin(az), y: -p.groundDistanceKm * Math.cos(az) }
  const h = p.headingDeg * DEG
  const dir: Pt = { x: Math.sin(h), y: -Math.cos(h) }
  const n: Pt = { x: -dir.y, y: dir.x }
  const half = fieldHalfWidthKm(p, meta)
  // At least ±200 km, so the satellite is visible for ~1 min of the replay around closest approach.
  const extent = Math.max(200, p.groundDistanceKm * 1.6, (half ?? 0) * 1.25)
  // Prefer the sampled track; synthesize a straight segment through the sub-point when it is missing
  // (locally, a few hundred km either side, the ground track is very nearly straight).
  const track: Pt[] =
    p.track.length >= 2 ? p.track.map((t) => proj(t.lat, t.lon)) : [-1, 1].map((k) => ({ x: sub.x + dir.x * extent * 2 * k, y: sub.y + dir.y * extent * 2 * k }))
  const L = extent * 3
  const strip = (w: number): Pt[] => [
    { x: sub.x - dir.x * L + n.x * w, y: sub.y - dir.y * L + n.y * w },
    { x: sub.x + dir.x * L + n.x * w, y: sub.y + dir.y * L + n.y * w },
    { x: sub.x + dir.x * L - n.x * w, y: sub.y + dir.y * L - n.y * w },
    { x: sub.x - dir.x * L - n.x * w, y: sub.y - dir.y * L - n.y * w },
  ]
  const inner = half ? blindHalfWidthKm(p, meta) : undefined
  return { sub, dir, n, half, extent, track, band: half ? strip(half) : undefined, blind: inner ? strip(inner) : undefined }
}

/** Satellite position at time t: along the sampled track, or along the synthesized line. */
export function satPosition(p: Pass, g: PlanGeometry, t: number): Pt {
  const tr = p.track
  if (tr.length >= 2 && g.track.length === tr.length) {
    if (t <= tr[0].t) return g.track[0]
    for (let i = 1; i < tr.length; i++) {
      if (t <= tr[i].t) {
        const f = (t - tr[i - 1].t) / (tr[i].t - tr[i - 1].t)
        const a = g.track[i - 1]
        const b = g.track[i]
        return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f }
      }
    }
    return g.track[g.track.length - 1]
  }
  const d = ((t - p.tClosest) / 1000) * p.groundSpeedKmS
  return { x: g.sub.x + g.dir.x * d, y: g.sub.y + g.dir.y * d }
}
