/**
 * NASA GIBS imagery: daily true-colour mosaics from polar weather imagers (VIIRS, MODIS) and
 * 10-minute GeoColor / visible frames from geostationary imagers (GOES-East/West, Himawari).
 *
 * GIBS never says "no data": a day that hasn't been processed yet, a swath gap or a missing
 * frame all come back as HTTP 200 with a black JPEG. So every weather capture is verified with a
 * tiny pixel probe (24×24 px) before it is returned, and empty ones are dropped. A daily mosaic's
 * probe is read from the pre-cut tile that holds the place, not rendered: ./gibsTiles.ts says why.
 *
 * Geostationary frames, measured 2026-11-08 06:00–06:10Z:
 *  - GIBS publishes which frames exist (WMTS DescribeDomains). The newest listed frame was 34 min
 *    old for GOES-East, 44 min for GOES-West / Himawari; Himawari's list had a gap (02:40).
 *  - A TIME that isn't a listed frame is black: no snapping to the previous frame (05:25 → black,
 *    05:21:13 → the 05:20 frame), nothing after the newest frame, nothing inside a gap.
 *  - Listed frames younger than ~70 min are served inconsistently: identical URLs alternate
 *    between real and black (every response is a CDN miss with `no-store`); from ~75 min old they
 *    were stable. Hence the 70-minute hold-back, on top of the published list.
 */
import { sunElevationDeg } from '@/lib/geo'
import type { Capture, CaptureCollection, LatLon, Pass } from '@/types'
import { gibsDomainsUrl, gibsWmsUrl, worldviewUrl, type CropOpts } from './endpoints'
import { gibsProbeTileUrl } from './gibsTiles'
import { preloadImage, probeImage } from './image'
import { Lru } from './lru'
import { isAbortError, mapLimit, raceAbort, throwIfAborted, withRetry } from './net'

export type GibsCollection = Extract<CaptureCollection, `gibs-${string}`>

export interface GibsLayer {
  collection: GibsCollection
  layer: string
  /** Lowercase platform id, like STAC platforms ("noaa-20", "goes-east") */
  platform: string
  /** Effective ground sample distance of the GIBS product, metres */
  gsdM: number
  kind: 'daily' | 'subdaily'
  /** Frame cadence for sub-daily layers, minutes */
  cadenceMin?: number
  /** A reflectance-only band: black at night, so frames with the place in darkness are skipped */
  visibleOnly?: boolean
  /** A WMTS tile matrix set GIBS accepts for this layer (only used to ask for its time domain) */
  tileMatrixSet: string
}

export const GIBS_LAYERS: Readonly<Record<GibsCollection, GibsLayer>> = {
  'gibs-viirs-noaa20': { collection: 'gibs-viirs-noaa20', layer: 'VIIRS_NOAA20_CorrectedReflectance_TrueColor', platform: 'noaa-20', gsdM: 375, kind: 'daily', tileMatrixSet: '250m' },
  'gibs-viirs-noaa21': { collection: 'gibs-viirs-noaa21', layer: 'VIIRS_NOAA21_CorrectedReflectance_TrueColor', platform: 'noaa-21', gsdM: 375, kind: 'daily', tileMatrixSet: '250m' },
  'gibs-viirs-snpp': { collection: 'gibs-viirs-snpp', layer: 'VIIRS_SNPP_CorrectedReflectance_TrueColor', platform: 'suomi-npp', gsdM: 375, kind: 'daily', tileMatrixSet: '250m' },
  'gibs-modis-terra': { collection: 'gibs-modis-terra', layer: 'MODIS_Terra_CorrectedReflectance_TrueColor', platform: 'terra', gsdM: 250, kind: 'daily', tileMatrixSet: '250m' },
  'gibs-modis-aqua': { collection: 'gibs-modis-aqua', layer: 'MODIS_Aqua_CorrectedReflectance_TrueColor', platform: 'aqua', gsdM: 250, kind: 'daily', tileMatrixSet: '250m' },
  'gibs-goes-east': { collection: 'gibs-goes-east', layer: 'GOES-East_ABI_GeoColor', platform: 'goes-east', gsdM: 1000, kind: 'subdaily', cadenceMin: 10, tileMatrixSet: '2km' },
  'gibs-goes-west': { collection: 'gibs-goes-west', layer: 'GOES-West_ABI_GeoColor', platform: 'goes-west', gsdM: 1000, kind: 'subdaily', cadenceMin: 10, tileMatrixSet: '2km' },
  'gibs-himawari': { collection: 'gibs-himawari', layer: 'Himawari_AHI_Band3_Red_Visible_1km', platform: 'himawari', gsdM: 1000, kind: 'subdaily', cadenceMin: 10, visibleOnly: true, tileMatrixSet: '1km' },
}

/**
 * A sub-daily GIBS layer as the frame search needs it: its name, a tile matrix set it accepts (only used to ask for
 * its time domain) and whether it is black in the dark. The geostationary collections above are these, and so is a
 * layer that is no capture collection: Himawari's infrared band (./geoFrames.ts shows it when the visible band is dark).
 */
export interface GibsFrameLayer {
  layer: string
  tileMatrixSet: string
  visibleOnly?: boolean
  /** For a visible-only band: how high the sun must stand at the place for a frame to be tried (default: above the horizon) */
  minSunDeg?: number
}

/** Himawari's 10.4 µm window band: cloud tops by temperature, so it reads the same day and night. Measured 2026-11-11. */
export const HIMAWARI_INFRARED: GibsFrameLayer = { layer: 'Himawari_AHI_Band13_Clean_Infrared', tileMatrixSet: '2km' }

function frameLayer(collection: GibsCollection): GibsFrameLayer {
  const info = GIBS_LAYERS[collection]
  if (info.kind !== 'subdaily') throw new TypeError(`${collection} is a daily layer`)
  return info
}

/** Polar weather imagers whose daily mosaics GIBS serves, by NORAD id. */
export const GIBS_DAILY_BY_NORAD: Readonly<Record<number, GibsCollection>> = {
  43013: 'gibs-viirs-noaa20', // NOAA 20 (JPSS-1)
  54234: 'gibs-viirs-noaa21', // NOAA 21 (JPSS-2)
  37849: 'gibs-viirs-snpp', // Suomi NPP
  25994: 'gibs-modis-terra', // Terra
  27424: 'gibs-modis-aqua', // Aqua
}

export function isGibsCollection(c: string): c is GibsCollection {
  return Object.prototype.hasOwnProperty.call(GIBS_LAYERS, c)
}

const pad = (n: number) => String(n).padStart(2, '0')

/** "YYYY-MM-DD" of an instant, in UTC (GIBS daily layers are UTC days). */
export function utcDate(ms: number): string {
  const d = new Date(ms)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

/** ISO-8601 to the second, "Z" suffix, no milliseconds. */
export function isoSeconds(ms: number): string {
  return new Date(Math.floor(ms / 1000) * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z')
}

const TEN_MIN = 10 * 60_000
/** Frames younger than this are not reliably served yet (see header). */
export const GEO_SAFE_LAG_MS = 70 * 60_000

/**
 * The geostationary frame to request for instant `ms` when nothing better is known: never newer
 * than now − 70 min, rounded DOWN to the 10-minute mark (frames sit exactly on the marks, and an
 * off-mark TIME is answered with a black image).
 */
export function geoFrameTime(ms: number, now = Date.now()): number {
  return Math.floor(Math.min(ms, now - GEO_SAFE_LAG_MS) / TEN_MIN) * TEN_MIN
}

// ── Published time domains (which frames exist) ────────────────────────────────────────────

/** ISO-8601 duration ("PT10M", "P1D") → ms. Undefined for anything we don't expect from GIBS. */
export function parseIsoDuration(s: string): number | undefined {
  const m = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(s.trim())
  if (!m || s.trim() === 'P' || s.trim() === 'PT') return undefined
  const [, d, h, min, sec] = m.map((x) => Number(x ?? 0))
  const ms = ((d * 24 + h) * 60 + min) * 60_000 + sec * 1000
  return ms > 0 ? ms : undefined
}

/**
 * Expand a WMTS time domain ("start/end/period" intervals and single instants, comma-separated)
 * into frame instants within [from, to], ascending. `maxFrames` bounds a malformed or huge domain.
 */
export function parseTimeDomain(domain: string, from: number, to: number, maxFrames = 2000): number[] {
  const out: number[] = []
  for (const part of domain.split(',')) {
    const [a, b, period] = part.trim().split('/')
    const start = Date.parse(a ?? '')
    if (!Number.isFinite(start)) continue
    if (b === undefined) {
      if (start >= from && start <= to) out.push(start)
      continue
    }
    const end = Date.parse(b)
    const step = period ? parseIsoDuration(period) : undefined
    if (!Number.isFinite(end) || !step) continue
    // Jump straight to the first frame ≥ from (intervals can start long before the window).
    let t = start + Math.max(0, Math.ceil((from - start) / step)) * step
    for (; t <= Math.min(end, to) && out.length < maxFrames; t += step) out.push(t)
  }
  return [...new Set(out)].sort((x, y) => x - y)
}

/** How far back a domain request looks, and how long its answer is trusted. */
const DOMAIN_WINDOW_MS = 6 * 3_600_000
const DOMAIN_TTL_MS = 5 * 60_000

interface DomainEntry {
  at: number
  /** Listed frames in the window, newest first */
  frames: number[]
}
/** Last successful domain per layer name; read synchronously by `geoImageUrl`. */
const knownDomains = /* @__PURE__ */ new Map<string, DomainEntry>()
const domainLoads = /* @__PURE__ */ new Lru<string, Promise<number[]>>(16)

/**
 * The frames GIBS lists for a geostationary layer over the last 6 hours, newest first (gaps left
 * out). One small XML request, cached for 5 minutes. Rejects on network failure and on abort.
 */
export async function geoFrames(collection: GibsCollection, o: { signal?: AbortSignal; now?: number } = {}): Promise<number[]> {
  return gibsFrames(frameLayer(collection), o)
}

/** `geoFrames` for any sub-daily layer. */
export async function gibsFrames(info: GibsFrameLayer, { signal, now = Date.now() }: { signal?: AbortSignal; now?: number } = {}): Promise<number[]> {
  const known = knownDomains.get(info.layer)
  if (known && Math.abs(now - known.at) < DOMAIN_TTL_MS) return known.frames
  // Hour-aligned bounds keep the URL (and GIBS's 30-minute cache of it) stable within the hour.
  const to = Math.ceil(now / 3_600_000) * 3_600_000
  const from = to - DOMAIN_WINDOW_MS - 3_600_000
  const url = gibsDomainsUrl(info.layer, info.tileMatrixSet, isoSeconds(from), isoSeconds(to))
  let p = domainLoads.get(url)
  if (!p) {
    p = withRetry(
      async (s) => {
        const res = await fetch(url, { signal: s })
        const text = await res.text()
        const domain = /<Domain>([^<]+)<\/Domain>/.exec(text)?.[1]
        if (!res.ok || !domain) throw new Error(`GIBS has no time domain for ${info.layer}`)
        return parseTimeDomain(domain, from, to).reverse()
      },
      { timeoutMs: 6_000, retries: 1, label: url },
    )
    domainLoads.set(url, p)
    p.then(
      (frames) => knownDomains.set(info.layer, { at: now, frames }),
      () => domainLoads.delete(url),
    )
  }
  // A shared load: stop waiting on abort without cancelling it for other callers.
  return raceAbort(p, signal)
}

/**
 * Snap a requested frame time to a frame GIBS actually lists, when its domain is known: the newest
 * listed frame at or before `t`. Instants older than the known window pass through unchanged
 * (older frames are published; gaps there are rare).
 */
function snapToKnownFrame(collection: GibsCollection, t: number, now: number): number {
  const known = knownDomains.get(GIBS_LAYERS[collection].layer)
  if (!known || known.frames.length === 0 || now - known.at > 30 * 60_000) return t
  const oldest = known.frames[known.frames.length - 1]
  if (t < oldest) return t
  return known.frames.find((f) => f <= t) ?? t
}

/** WMS TIME value for a collection: a UTC date for daily mosaics, an ISO instant for frames. */
export function gibsTime(collection: GibsCollection, ms: number, now = Date.now()): string {
  if (GIBS_LAYERS[collection].kind === 'daily') return utcDate(ms)
  return isoSeconds(snapToKnownFrame(collection, geoFrameTime(ms, now), now))
}

/**
 * A square GIBS image centred on `place` at instant `ms`. For GOES-East/West and Himawari this is
 * the 10-minute frame at (or just before) `ms`, held back 70 min from now, and, once
 * `geoFrames`/`latestGeoImage` has fetched the layer's published frame list, snapped to a frame
 * that is actually listed (gaps skipped). For the daily layers, that UTC day's mosaic.
 * Synchronous and unverified: prefer `latestGeoImage` for "the newest frame".
 */
export function geoImageUrl(collection: CaptureCollection, place: LatLon, ms: number, opts: CropOpts): string {
  if (!isGibsCollection(collection)) throw new TypeError(`${collection} is not served by NASA GIBS`)
  return gibsWmsUrl(GIBS_LAYERS[collection].layer, gibsTime(collection, ms), place, opts)
}

// ── Pixel probe ────────────────────────────────────────────────────────────────────────────

const PROBE_PX = 24
const PROBE_HALF_KM = 30
/**
 * Probes in flight at once. GIBS sits behind CloudFront over HTTP/2, so parallel probes share one
 * connection. Measured on the tiles (2026-11-12, 12 at a time): 640 probes in 18 s, median 0.29 s each.
 */
const PROBE_CONCURRENCY = 12
/** A capture whose probe is more than half empty is dropped. */
export const MAX_NO_DATA = 0.5
/**
 * Probe URL for "is there data at this place on this daily layer on this day": the window of the place's map tile
 * within 30 km of it (./gibsTiles.ts). Past 85° of latitude, where the tile grid ends, the same square as a small
 * WMS render.
 */
export function dailyProbeUrl(layer: string, date: string, place: LatLon): string {
  return (
    gibsProbeTileUrl(layer, date, place, PROBE_HALF_KM, (2 * PROBE_HALF_KM) / PROBE_PX) ??
    gibsWmsUrl(layer, date, place, { halfSizeKm: PROBE_HALF_KM, px: PROBE_PX })
  )
}

// ── Weather captures from passes ───────────────────────────────────────────────────────────

/** Minimum sun elevation at the place for a true-colour daily mosaic to be worth showing. */
export const MIN_SUN_ELEVATION_DEG = 5

/** Pure part of `weatherCaptures`: which passes qualify, one per (layer, UTC day), as Captures. */
export function weatherCandidates(place: LatLon, passes: readonly Pass[]): Capture[] {
  const best = new Map<string, Pass>()
  for (const p of passes) {
    const collection = GIBS_DAILY_BY_NORAD[p.norad]
    if (!collection || !p.inSwath || !(p.sunElevationDeg >= MIN_SUN_ELEVATION_DEG)) continue
    // A daily mosaic is one image per UTC day: keep the pass closest to nadir (the one most
    // likely to have been used for that pixel), so two daytime passes don't produce two copies.
    const key = `${collection}@${utcDate(p.tClosest)}`
    const prev = best.get(key)
    if (!prev || p.groundDistanceKm < prev.groundDistanceKm) best.set(key, p)
  }
  const out: Capture[] = []
  for (const p of best.values()) {
    const info = GIBS_LAYERS[GIBS_DAILY_BY_NORAD[p.norad]]
    const date = utcDate(p.tClosest)
    const itemId = `${info.layer}@${date}`
    out.push({
      id: itemId,
      provider: 'gibs',
      collection: info.collection,
      itemId,
      platform: info.platform,
      norad: p.norad,
      datetime: p.tClosest,
      gsdM: info.gsdM,
      sunElevationDeg: p.sunElevationDeg,
      cropUrl: (o: CropOpts) => gibsWmsUrl(info.layer, date, place, o),
      previewUrl: gibsWmsUrl(info.layer, date, place, { halfSizeKm: 600, px: 1024 }),
      sourceUrl: worldviewUrl(info.layer, date, place),
    })
  }
  return out.sort((a, b) => b.datetime - a.datetime)
}

/**
 * True if GIBS has pixels at the place for this daily capture (probe is cached per URL).
 * For lazy use: show `weatherCandidates(...)` at once and verify each as it scrolls into view.
 * Resolves false when it can't be verified; rejects only on abort.
 */
export async function verifyWeatherCapture(capture: Capture, place: LatLon, signal?: AbortSignal): Promise<boolean> {
  const [layer, date] = capture.itemId.split('@')
  if (capture.provider !== 'gibs' || !layer || !date) return false
  try {
    const probe = await probeImage(dailyProbeUrl(layer, date, place), signal)
    return probe.noDataFraction <= MAX_NO_DATA
  } catch {
    throwIfAborted(signal)
    return false // unverifiable → drop: a black square is worse than no square
  }
}

/**
 * Real daily VIIRS / MODIS true-colour images for the daytime, in-swath passes of NOAA-20,
 * NOAA-21, Suomi NPP, Terra and Aqua. Each candidate is verified with a tiny pixel probe and
 * dropped if the place is mostly no-data (not processed yet, swath gap, instrument outage).
 * Newest first. Abortable. Never throws for an individual image; throws only on abort.
 */
export async function weatherCaptures(place: LatLon, passes: Pass[], signal?: AbortSignal): Promise<Capture[]> {
  throwIfAborted(signal)
  const cands = weatherCandidates(place, passes)
  const verdicts = await mapLimit(cands, PROBE_CONCURRENCY, (c) => verifyWeatherCapture(c, place, signal))
  throwIfAborted(signal)
  return cands.filter((_, i) => verdicts[i])
}

/**
 * Which frames `latestGeoImage` tries, newest first: the published frames (when known) that are at
 * least `GEO_SAFE_LAG_MS` old, else the 10-minute marks from now − 70 min back, limited to
 * `maxSteps`; for a visible-only band, frames with the place in darkness are skipped (they're black).
 */
export function geoFrameCandidates(collection: GibsCollection, place: LatLon, now: number, listed: readonly number[] | null, maxSteps = 12): number[] {
  return frameCandidates(GIBS_LAYERS[collection], place, now, listed, maxSteps)
}

function frameCandidates(info: Pick<GibsFrameLayer, 'visibleOnly' | 'minSunDeg'>, place: LatLon, now: number, listed: readonly number[] | null, maxSteps: number): number[] {
  const floor = now - GEO_SAFE_LAG_MS
  const times = listed && listed.length ? listed.filter((t) => t <= floor) : Array.from({ length: maxSteps }, (_, i) => geoFrameTime(now, now) - i * TEN_MIN)
  const window = times.slice(0, maxSteps)
  return info.visibleOnly ? window.filter((t) => sunElevationDeg(place.lat, place.lon, t) > (info.minSunDeg ?? 0)) : window
}

/**
 * The newest geostationary frame that GIBS actually serves for the place, as a URL at `opts` size.
 * Reads the layer's published frame list (skipping gaps and frames under 70 min old), then loads
 * the real display image with `preloadImage`, which rejects GIBS's all-black "no data" answers;
 * the first frame that decodes with pixels wins. The verified image stays loaded, so
 * `preloadImage(url)` resolves at once with the decoded element, which is what to show (GIBS sends
 * `no-store`, and the element's `src` is the blob: URL of the checked bytes: see preloadImage).
 * Resolves null when nothing qualifies within `maxSteps` frames (e.g. Himawari's visible band at
 * night: no network at all then). Rejects only on abort. Browser only (uses `Image`).
 */
export async function latestGeoImage(
  collection: GibsCollection,
  place: LatLon,
  opts: CropOpts,
  o: { signal?: AbortSignal; now?: number; maxSteps?: number } = {},
): Promise<{ url: string; time: number } | null> {
  return latestGibsFrame(frameLayer(collection), place, opts, o)
}

/** `latestGeoImage` for any sub-daily layer. */
export async function latestGibsFrame(
  info: GibsFrameLayer,
  place: LatLon,
  opts: CropOpts,
  { signal, now = Date.now(), maxSteps = 12 }: { signal?: AbortSignal; now?: number; maxSteps?: number } = {},
): Promise<{ url: string; time: number } | null> {
  // A visible-only band with the place in the dark at every frame it could list: nothing to ask for.
  if (info.visibleOnly && frameCandidates(info, place, now, null, maxSteps).length === 0) return null
  let listed: number[] | null = null
  try {
    listed = await gibsFrames(info, { signal, now })
  } catch (err) {
    if (isAbortError(err) || signal?.aborted) throw err
    // Domain unavailable: fall back to the fixed hold-back and let the image check decide.
  }
  for (const t of frameCandidates(info, place, now, listed, maxSteps)) {
    throwIfAborted(signal)
    const url = gibsWmsUrl(info.layer, isoSeconds(t), place, opts)
    try {
      await preloadImage(url, { signal })
      return { url, time: t }
    } catch {
      throwIfAborted(signal)
    }
  }
  return null
}
