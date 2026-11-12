/**
 * Geostationary weather imagers that see the place continuously.
 * Sub-satellite longitudes always come from propagating the current elements, never from a table.
 *
 * `rim` marks a watcher whose picture of the place is the edge of its disc. The map services draw each disc as seen
 * from the satellite's nominal seat on the equator and stop it short of the true horizon: an 800 km square around a
 * place starts losing data once that seat stands under 8–10° (measured 2026-11-11 on tracks north, north-east and
 * east of each sub-satellite point: GOES-East from 8°, Meteosat-12 from 7°, Meteosat-9 from 9°; whole everywhere at
 * 10°), and what is left is smeared six times over or more. Such a frame still shows in the watcher's row, small,
 * where it says truthfully how far out the place sits; it never leads the summary (results lib/bestLook.ts).
 * The seat on the equator matters: Meteosat-9 swings several degrees north and south of it each day, which lifts
 * its true elevation at a far-northern place without moving the edge of its picture.
 */
import { bearingDeg, DEG, EARTH_RADIUS_KM, haversineKm } from '@/lib/geo'
import type { GeoWatcher, LatLon, Pass, SatProfile, TrackPoint } from '@/types'
import { featuredSats, getSatInfo, type LoadedCatalog } from './catalog'
import { satrecFor } from './sgp4'
import { elevationDeg, offNadirDeg, sunElevationAtDeg } from './geometry'
import { stateAt } from './propagate'

/** A full-disk imager this low on the horizon still includes the place, but only at grazing view. */
export const GEO_MIN_ELEVATION_DEG = 5
/** From this elevation of the satellite's nominal seat, the frame's whole 800 km square lies on the disc as the services draw it. */
export const GEO_FRAME_MIN_ELEVATION_DEG = 10

/**
 * Operational weather-geo satellites standing ≥ 5° above the place's horizon, sorted by elevation.
 * `imagesInWindow` = full-disk images taken during the window that included the place.
 */
export function geoWatchers(cat: LoadedCatalog, place: LatLon, windowStart: number, windowEnd: number): GeoWatcher[] {
  const out: GeoWatcher[] = []
  // Only profiled satellites can be weather-geo imagers: the featured rows, never the whole catalog.
  for (const sat of featuredSats(cat)) {
    const p = sat.profile
    if (sat.category !== 'weather-geo' || !p?.operational || !p.cadenceMin) continue
    const satrec = satrecFor(sat.norad)
    const s = satrec && stateAt(satrec, windowEnd)
    if (!s) continue
    const el = elevationDeg(haversineKm(place, s), s.altKm)
    if (el < GEO_MIN_ELEVATION_DEG) continue
    const rim = elevationDeg(haversineKm(place, { lat: 0, lon: s.lon }), s.altKm) < GEO_FRAME_MIN_ELEVATION_DEG
    out.push({
      norad: sat.norad,
      name: sat.displayName,
      operator: p.operator,
      subLon: s.lon,
      elevationDeg: el,
      cadenceMin: p.cadenceMin,
      imagesInWindow: Math.floor((windowEnd - windowStart) / (p.cadenceMin * 60_000)),
      frames: p.frames,
      rim: rim || undefined,
    })
  }
  return out.sort((a, b) => b.elevationDeg - a.elevationDeg)
}

// ───────────────────────────── the scan that took a frame ─────────────────────────────

/**
 * How a full-disc scan moves over the ground.
 *
 * The mirror steps evenly in its north-south angle ε (± asin(1/r) from limb to limb, r the orbit's radius in Earth
 * radii), and at each step sweeps east-west. So the scan line at ε is every point seen at that angle: where the
 * plane through the spacecraft that holds its east-west axis, tipped ε from the line to the Earth's centre, cuts the
 * globe. That is a circle on the sphere, not a great circle: seen from the spacecraft it is a straight line across
 * the disc. On the meridian under the spacecraft it stands at central angle c = asin(r sin ε) − ε from the point
 * below it (slowest there, 18 km/s for a 10-minute disc), and away from that meridian it stays near the same
 * latitude instead of climbing toward the pole as a great circle would.
 *
 * Until 2026-11-12 the line was taken as the great circle across that meridian. For a place under the spacecraft
 * the two agree; for Abidjan, 71° of longitude from GOES-19, that drew the line 1,300 km too far north over the
 * Americas at the moment it "crossed" the place, and timed the crossing 69 s early.
 *
 * (GOES sweeps exactly this way. Himawari and the Meteosats hold the other axis fixed, which makes each line a
 * shallow cone instead of a plane: within 1.2% of the same angle everywhere on the disc.)
 *
 * Vectors here are unit vectors on a spherical Earth: x to 0°N 0°E, y to 0°N 90°E, z north.
 */
type V3 = readonly [number, number, number]
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const unitOf = (p: LatLon): V3 => [Math.cos(p.lat * DEG) * Math.cos(p.lon * DEG), Math.cos(p.lat * DEG) * Math.sin(p.lon * DEG), Math.sin(p.lat * DEG)]

/** Where a geostationary spacecraft stood for a scan. */
export interface ScanSeat {
  lat: number
  lon: number
  altKm: number
}

interface SeatFrame {
  /** The orbit's radius, Earth radii */
  r: number
  /** To the spacecraft, and east and north across its line of sight */
  s: V3
  e: V3
  n: V3
}

function seatFrame(seat: ScanSeat): SeatFrame {
  const s = unitOf(seat)
  const e: V3 = [-Math.sin(seat.lon * DEG), Math.cos(seat.lon * DEG), 0]
  // s × e: north at the point under the spacecraft.
  const n: V3 = [s[1] * e[2] - s[2] * e[1], s[2] * e[0] - s[0] * e[2], s[0] * e[1] - s[1] * e[0]]
  return { r: 1 + seat.altKm / EARTH_RADIUS_KM, s, e, n }
}

const centralAngle = (eps: number, r: number) => Math.asin(Math.max(-1, Math.min(1, r * Math.sin(eps)))) - eps

/** The scan's north-south angle (rad, north positive) at which the spacecraft sees `p`. */
export function scanAngleOf(seat: ScanSeat, p: LatLon): number {
  const f = seatFrame(seat)
  const u = unitOf(p)
  return Math.atan2(dot(u, f.n), f.r - dot(u, f.s))
}

/** How far inside the limb a drawn scan line stops, as a factor on the limb's cos(central angle) = 1/r. */
const LINE_LIMB_MARGIN = 1.25

/** One scan line on the ground: a circle on the sphere, walked by the angle φ around its centre. */
export interface ScanLine {
  /** The point of the line at φ (rad): 0 on the meridian under the spacecraft, east positive */
  at(phi: number): LatLon
  /** The line runs from −reach to +reach before it nears the limb; 0 when it does not touch the disc */
  reach: number
}

/** The scan line at north-south angle `eps` (rad). */
export function scanLine(seat: ScanSeat, eps: number): ScanLine {
  const f = seatFrame(seat)
  const sinE = Math.sin(eps)
  const cosE = Math.cos(eps)
  const h = f.r * sinE // the plane's distance from the Earth's centre
  const rho = Math.sqrt(Math.max(0, 1 - h * h))
  // Centre of the circle, and the unit vector from it toward the spacecraft's side (the other in-plane axis is east).
  const c: V3 = [h * (cosE * f.n[0] + sinE * f.s[0]), h * (cosE * f.n[1] + sinE * f.s[1]), h * (cosE * f.n[2] + sinE * f.s[2])]
  const u: V3 = [cosE * f.s[0] - sinE * f.n[0], cosE * f.s[1] - sinE * f.n[1], cosE * f.s[2] - sinE * f.n[2]]
  // A point of the line is in view while its cos(central angle) from the point under the spacecraft is over 1/r.
  const edge = rho * cosE > 1e-9 ? (LINE_LIMB_MARGIN / f.r - f.r * sinE * sinE) / (rho * cosE) : 2
  return {
    reach: edge < 1 ? Math.acos(Math.max(-1, edge)) : 0,
    at(phi) {
      const a = rho * Math.cos(phi)
      const b = rho * Math.sin(phi)
      const x = c[0] + a * u[0] + b * f.e[0]
      const y = c[1] + a * u[1] + b * f.e[1]
      const z = c[2] + a * u[2] + b * f.e[2]
      return { lat: Math.asin(Math.max(-1, Math.min(1, z))) / DEG, lon: Math.atan2(y, x) / DEG }
    },
  }
}

/** The scan's limits in ε are held this far (as a share of the scan) inside the limbs, where the line has no length. */
const SCAN_EDGE = 0.01

/**
 * The north-south angle of a scan pass's line at time `t` (rad): even steps from limb to limb between the pass's
 * start and end, from the north when the pass is `descending`.
 */
export function scanAngleAt(pass: Pick<Pass, 'tStart' | 'tEnd' | 'altitudeKm' | 'node'>, t: number): number {
  const epsMax = Math.asin(1 / (1 + pass.altitudeKm / EARTH_RADIUS_KM))
  const dir = pass.node === 'descending' ? -1 : 1
  const f = Math.max(SCAN_EDGE, Math.min(1 - SCAN_EDGE, (t - pass.tStart) / Math.max(1, pass.tEnd - pass.tStart)))
  return dir * epsMax * (2 * f - 1)
}

/** Where the spacecraft of a scan pass stood, read back from the pass (its track is the line's path under it). */
export function scanSeatOf(pass: Pick<Pass, 'tStart' | 'tEnd' | 'altitudeKm' | 'node' | 'track'>): ScanSeat | undefined {
  const p = pass.track[0]
  if (!p) return undefined
  const r = 1 + pass.altitudeKm / EARTH_RADIUS_KM
  return { lat: p.lat - centralAngle(scanAngleAt(pass, p.t), r) / DEG, lon: p.lon, altKm: pass.altitudeKm }
}

/** Samples of the scan line's path (the track of a geostationary scan pass). */
const SCAN_SAMPLES = 72

/**
 * One full-disc scan as a pass: the scan that took the frame of `frameTime` (taken as the scan's start; the services
 * label frames by their slot, so the crossing below is good to about a minute, and the UI says "about").
 *
 * The satellite does not move, the scan line does. So the pass's track is the line's own path down (or up) the
 * meridian under the satellite, its heading and speed the line's where it crosses the place, and its closest approach
 * the moment the line (the one at the angle the spacecraft sees the place at) reached the place. Everything that
 * replays a pass (the scan line on the globe, the image developing behind it, the reveal in the panel) then shows
 * what the imager did, with no second machinery.
 * Distance, elevation and azimuth are the real ones, to the satellite where it stood.
 * Undefined when the satellite has no scan pattern on file or its orbit cannot be propagated.
 */
export function geoScanPass(norad: number, place: LatLon, frameTime: number, captureId: string, profile: Pick<SatProfile, 'scan'> | undefined = getSatInfo(norad)?.profile): Pass | undefined {
  const scan = profile?.scan
  const satrec = satrecFor(norad)
  const at = satrec && stateAt(satrec, frameTime)
  if (!scan || !at) return undefined
  const seat: ScanSeat = { lat: at.lat, lon: at.lon, altKm: at.altKm }
  const f = seatFrame(seat)
  const r = f.r
  const epsMax = Math.asin(1 / r)
  const durMs = scan.minutes * 60_000
  const dir = scan.from === 'north' ? -1 : 1 // the sign of dε/dt, north positive
  // The angle the spacecraft sees the place at: the line at that angle is the one that crosses it.
  const p = unitOf(place)
  const a = r - dot(p, f.s)
  const b = dot(p, f.n)
  const epsPlace = Math.max(-epsMax, Math.min(epsMax, Math.atan2(b, a)))
  const u = (dir * epsPlace + epsMax) / (2 * epsMax)
  const tClosest = Math.round(frameTime + u * durMs)
  // How fast the line moves over the ground at the place, and which way: ε changes by |∇ε| per radian of ground
  // along its gradient there, ∇ε = the part of (a·north + b·toSpacecraft) along the ground, over a² + b².
  const g: [number, number, number] = [a * f.n[0] + b * f.s[0], a * f.n[1] + b * f.s[1], a * f.n[2] + b * f.s[2]]
  const gp = dot(g, p)
  for (let i = 0; i < 3; i++) g[i] -= gp * p[i]
  const gLen = Math.hypot(g[0], g[1], g[2])
  const epsRate = (2 * epsMax) / (durMs / 1000) // rad / s
  const speedKmS = gLen > 1e-9 ? ((epsRate * (a * a + b * b)) / gLen) * EARTH_RADIUS_KM : 400
  const east: V3 = [-Math.sin(place.lon * DEG), Math.cos(place.lon * DEG), 0]
  const north: V3 = [p[1] * east[2] - p[2] * east[1], p[2] * east[0] - p[0] * east[2], p[0] * east[1] - p[1] * east[0]]
  const headingDeg = gLen > 1e-9 ? (Math.atan2(dir * dot(g, east), dir * dot(g, north)) / DEG + 360) % 360 : dir < 0 ? 180 : 0
  const node = dir < 0 ? 'descending' : 'ascending'
  const tEnd = frameTime + durMs
  const track: TrackPoint[] = []
  for (let i = 0; i <= SCAN_SAMPLES; i++) {
    // Short of the limbs themselves, where the line's speed has no bound.
    const t = Math.round(frameTime + (SCAN_EDGE + ((1 - 2 * SCAN_EDGE) * i) / SCAN_SAMPLES) * durMs)
    const eps = scanAngleAt({ tStart: frameTime, tEnd, altitudeKm: at.altKm, node }, t)
    track.push({ t, lat: at.lat + centralAngle(eps, r) / DEG, lon: at.lon, altKm: at.altKm })
  }
  const d = haversineKm(place, at)
  return {
    id: `geo-${norad}-${Math.round(frameTime / 60_000)}`,
    norad,
    tClosest,
    tStart: frameTime,
    tEnd,
    groundDistanceKm: d,
    offNadirDeg: offNadirDeg(d, at.altKm),
    elevationDeg: elevationDeg(d, at.altKm),
    azimuthDeg: bearingDeg(place, at),
    altitudeKm: at.altKm,
    groundSpeedKmS: Math.min(400, speedKmS),
    headingDeg,
    node,
    sunElevationDeg: sunElevationAtDeg(place.lat, place.lon, tClosest),
    inSwath: true,
    inFieldOfRegard: true,
    verdict: 'imaged',
    track,
    captureId,
    geostationary: true,
  }
}
