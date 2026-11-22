/**
 * The photos of a report, in the one order every view uses (owner requests B1 + D1, final):
 *
 *   #1  the COVER ("Closest look"): the most zoomed-in CLEAR photo of the window (Sentinel-2 10 m beats Landsat
 *       30 m beats VIIRS 375 m). What counts as clear, and how equally zoomed-in photos are ranked, is
 *       src/lib/clearness.ts (shared with the globe's cover prefetch): not clouded over (spot ≠ cloud and scene
 *       cloud < 70 %) and, where the archive's per-pixel mask was read, at least 60 % of the photo's square
 *       showing the ground; ties go to the clear spot, the clearer square, the higher sun, the straighter view,
 *       then the newest. With no clear photo, a partly clear one leads the same way.
 *       · no clear DETAILED photo in the window → `report.clearCover` (the last clear Sentinel-2 / Landsat
 *         look from before the window; no pass, never counted), labelled "Last clear look";
 *       · no clear image at all → the least cloudy detailed capture, labelled "Clouded over";
 *       · no detailed capture at all → the sharpest weather mosaic (lit well, then newest).
 *   then every other photo of the window, NEWEST FIRST (by the pass's closest approach). Clouded ones stay,
 *   honestly labelled.
 *   last the geostationary frames (GOES, Himawari, Meteosat: the newest full-disc frame of each watcher, 2–5 km),
 *   under the Weather filter with the mosaics.
 *
 * Weather mosaics (250–375 m daily) are photos too. Sentinel-1's radar images are in the same order (newest first)
 * but never lead: a radar image is not a photograph, and the cover is what the results wait for. A week with only
 * radar images lists them with no cover. The gallery filter narrows the same order to Detailed (10–30 m), Weather
 * (250 m+) or Radar.
 *
 * Pure: unit-tested in lib.test.ts.
 */
import type { Capture, Pass, Report, SpotCloud } from '@/types'
import { pickLead, SPOT_RANK as CLARITY_SPOT_RANK, type Ranked } from '@/lib/clearness'
import { isClouded } from './bestLook'
import { northInCropDeg, placeInCrop } from '../../../../api/_lib/toneRender'
import { panSharpUrl } from '@/imagery/panUrl'
import { captureFor, cropSpec, displayUrl, isDetailed, isGeoFrame, isRadar, type CropSpec } from './captures'

export interface Photo {
  /** Stable key: the capture id (one capture per pass) */
  key: string
  capture: Capture
  /** The pass that took it; undefined for the clear cover from before the window */
  pass?: Pass
  /**
   * Sentinel-2 / Landsat (10–30 m) vs a daily weather mosaic (250–375 m) vs a Sentinel-1 radar image (20 m) vs a
   * geostationary imager's newest full-disc frame (2–5 km)
   */
  kind: 'detailed' | 'mosaic' | 'radar' | 'geo'
  /** Clouded over (detailed only): scene ≥ 70 % or cloud at the spot */
  clouded: boolean
}

/** Why the cover is the cover (drives its label). */
export type CoverKind = 'closest' | 'lastClear' | 'clouded'

export interface PhotoSet {
  /** Every photo, cover first, then newest first */
  photos: Photo[]
  /** The cover (photos[0]) and why, or undefined when there is no photo at all */
  cover?: { photo: Photo; why: CoverKind }
  /** Photos of the window only (the clear cover from before it excluded): what "K photos" counts */
  windowCount: number
}

export type PhotoFilter = 'all' | 'detailed' | 'weather' | 'radar'

/** Spot clarity rank (owner B1): clear > cirrus > unknown > shadow > cloud. */
export const SPOT_RANK: Record<SpotCloud, number> = CLARITY_SPOT_RANK

/** Sun high enough that a daily true-colour mosaic shows the ground, not twilight. */
const MOSAIC_MIN_SUN_DEG = 10

const tOf = (p: Photo) => p.pass?.tClosest ?? p.capture.datetime

function toPhoto(capture: Capture, pass?: Pass): Photo {
  const kind = isRadar(capture) ? 'radar' : isGeoFrame(capture) ? 'geo' : isDetailed(capture) ? 'detailed' : 'mosaic'
  return { key: capture.id, capture, pass, kind, clouded: kind === 'detailed' && isClouded(capture) }
}

/** A photo as the lead ranking (src/lib/clearness.ts) sees it. */
const ranked = (p: Photo): Ranked & { photo: Photo } => ({
  photo: p,
  capture: p.capture,
  t: tOf(p),
  sunDeg: p.pass?.sunElevationDeg,
  offNadirDeg: p.pass?.offNadirDeg,
})

/** Weather mosaics carry no per-pixel cloud: the sharpest, then a well-lit day, then the newest. */
function byMosaic(a: Photo, b: Photo): number {
  const lit = (p: Photo) => Number((p.pass?.sunElevationDeg ?? 0) >= MOSAIC_MIN_SUN_DEG)
  return a.capture.gsdM - b.capture.gsdM || lit(b) - lit(a) || tOf(b) - tOf(a)
}

/** The window's photos: imaged passes with their capture (one row per capture). */
function windowPhotos(report: Pick<Report, 'passes' | 'captures'>): Photo[] {
  const out: Photo[] = []
  const seen = new Set<string>()
  for (const pass of report.passes) {
    if (pass.verdict !== 'imaged') continue
    const c = captureFor(report, pass)
    if (!c || seen.has(c.id)) continue
    seen.add(c.id)
    out.push(toPhoto(c, pass))
  }
  return out
}

/** The cover among the window's photos only (no clear cover): what pickBestLook returns. */
export function windowCover(photos: Photo[]): { photo: Photo; why: CoverKind } | undefined {
  const lead = pickLead(photos.filter((p) => p.kind === 'detailed').map(ranked))
  if (lead) return { photo: lead.item.photo, why: lead.tier === 2 ? 'clouded' : 'closest' }
  const mosaics = photos.filter((p) => p.kind === 'mosaic')
  if (mosaics.length) return { photo: [...mosaics].sort(byMosaic)[0], why: 'closest' }
  return undefined
}

export function orderPhotos(report: Pick<Report, 'passes' | 'captures' | 'clearCover'>): PhotoSet {
  const inWindow = windowPhotos(report)
  const newest = [...inWindow].sort((a, b) => tOf(b) - tOf(a))
  let cover = windowCover(inWindow)
  const hasClearDetailed = inWindow.some((p) => p.kind === 'detailed' && !p.clouded)
  const cc = report.clearCover
  // No clear detailed photo this week: the last clear look from before the window leads (owner D1).
  if (!hasClearDetailed && cc && !inWindow.some((p) => p.key === cc.id)) cover = { photo: { ...toPhoto(cc), clouded: false }, why: 'lastClear' }
  // Geostationary frames close the gallery (owner): the coarsest pictures, and the one kind that is only a sample
  // of what its satellite took (the newest of a thousand). Never the cover.
  const geo = newest.filter((p) => p.kind === 'geo')
  const rest = newest.filter((p) => p.kind !== 'geo')
  // Radar images and geostationary frames only: listed with no cover (none of them is a photo to lead with).
  if (!cover) return { photos: [...rest.filter((p) => p.kind === 'radar'), ...geo], windowCount: newest.length }
  const lead = cover.photo
  return { photos: [lead, ...rest.filter((p) => p.key !== lead.key), ...geo], cover, windowCount: inWindow.length }
}

/** The filter a photo sits under: weather is the daily mosaics and the geostationary frames. */
const filterOf = (p: Photo): Exclude<PhotoFilter, 'all'> => (p.kind === 'mosaic' || p.kind === 'geo' ? 'weather' : p.kind)

export function filterPhotos(photos: Photo[], filter: PhotoFilter): Photo[] {
  if (filter === 'all') return photos
  return photos.filter((p) => filterOf(p) === filter)
}

/** Which filters have anything in them (the control disables the empty ones). */
export function filterCounts(photos: Photo[], windowOnly = false): Record<PhotoFilter, number> {
  const list = windowOnly ? photos.filter((p) => !!p.pass) : photos
  const out = { all: list.length, detailed: 0, weather: 0, radar: 0 }
  for (const p of list) out[filterOf(p)]++
  return out
}

// ── one canonical URL per (capture, size) ─────────────────────────────────────────────────

/** The card / pass-view image: the crop the hero, the gallery and the pass all share (preload = cache hit). */
export const cardSpec = (c: Pick<Capture, 'collection'>): CropSpec => cropSpec(c.collection)
export const cardUrl = (c: Capture) => displayUrl(c, cardSpec(c))

/** List rows and the lightbox filmstrip. */
export const THUMB_PX = 112
export const thumbUrl = (c: Capture) => displayUrl(c, { ...cardSpec(c), px: THUMB_PX })

/**
 * The lightbox's sharper layer: the card's very box on the place's grid (the same native pixels, so it registers over
 * the card exactly), rendered at HIRES_PX: Sentinel-2's 10 m pixels at 2×, Landsat's 30 m at 4×, resampled on the
 * grid with Lanczos (no warp for a scene on it), then toned and sharpened by the same pipeline at that scale with the
 * curve the card was shown with (pixels.ts: a magnified view). It holds no ground detail the card lacks; it spares
 * the browser's own upscaling of the 1000 px card where the photo is shown larger than that in device pixels (a
 * phone at 3×, a Retina laptop) or zoomed in (hiResHelps). Only the lightbox asks for it, once per photo (the
 * gallery and the hero never do). Weather mosaics, geostationary frames and an archive thumbnail (no crop): none.
 *
 * Landsat 8 and 9 do better: their layer is the card itself pan-sharpened with the capture's 15 m band (imagery
 * panUrl.ts, api/pan), real ground detail twice as fine as the colour's 30 m, with the 30 m layer above as its
 * fallback whenever the pan can't be had.
 */
export const HIRES_PX = 2000
export function hiResUrl(c: Capture): string | undefined {
  if (!isDetailed(c)) return undefined
  const url = displayUrl(c, { ...cardSpec(c), px: HIRES_PX })
  if (url === cardUrl(c)) return undefined
  if (c.collection === 'landsat-c2-l2' && /^landsat-[89]$/.test(c.platform)) return panSharpUrl(cardUrl(c), c.datetime, url) ?? url
  return url
}

/** Device pixels across the shown photo past which the 1000 px card is magnified on screen (iPhone 15 Pro: 1179). */
export const HIRES_DEVICE_PX = 1100
/** Zoom past which the sharper layer is asked for on any screen (once per photo). */
export const HIRES_ZOOM = 1.3
/** A zoom this small already means the user is zooming in: the lightbox starts the sharper layer then, ahead of HIRES_ZOOM. */
export const HIRES_INTENT_ZOOM = 1.05

/**
 * Whether the lightbox's sharper layer shows more than the card: the photo's side in device pixels already past
 * HIRES_DEVICE_PX at 1× (a phone at 3×, a Retina laptop; never a 1× laptop, 688–900 px), or a zoom past HIRES_ZOOM.
 */
export const hiResHelps = (sideCssPx: number, dpr: number, zoom = 1) => sideCssPx * dpr > HIRES_DEVICE_PX || zoom > HIRES_ZOOM

/** Crop width in km (the card and the lightbox show the same area). */
export const cropWidthKm = (c: Pick<Capture, 'collection'>) => cardSpec(c).halfSizeKm * 2

/**
 * A compass bearing (the satellite's heading at closest approach) as drawn on the capture's photo, degrees clockwise
 * from the photo's up. Sentinel-2 / Landsat photos are cut on the place's UTM grid, whose up is grid north: true
 * north is turned from it by the meridian convergence (under 3° in a standard 6° zone; up to 5.4° in south-west
 * Norway's zone 32 and 6.0° in Svalbard's 12°-wide zones, api/_lib/utm.ts), and so is every heading overlaid on the photo.
 */
export function photoHeadingDeg(c: Capture, headingDeg: number): number {
  let url: string
  try {
    url = cardUrl(c)
  } catch {
    return headingDeg
  }
  return headingDeg + northInCropDeg(url)
}

/**
 * Where the searched place sits in a capture's photo: offsets from the centre as fractions of the photo's side (x to
 * the right, y down). A photo on the place's grid is centred on it within half a native pixel (toneRender nativeBox),
 * up to about one pixel (0.1 % of the side) when the place lies within metres of a 0.01° line; the lightbox, whose
 * zoom magnifies that, draws its reticle here. Zero for any other photo (centred exactly), or one not around it.
 */
export function placeOffset(c: Capture, place: { lat: number; lon: number }): { dx: number; dy: number } {
  let at: { fx: number; fy: number } | null = null
  try {
    at = placeInCrop(cardUrl(c), place.lat, place.lon)
  } catch {
    at = null
  }
  const dx = at ? at.fx - 0.5 : 0
  const dy = at ? at.fy - 0.5 : 0
  // A photo cut around another point (never, today) keeps the reticle at its centre rather than off in the picture.
  return Math.abs(dx) < 0.005 && Math.abs(dy) < 0.005 ? { dx, dy } : { dx: 0, dy: 0 }
}
