/**
 * Real Sentinel-2 and Landsat scenes over a place, from public STAC archives, and Sentinel-1's radar images
 * (searchRadar: Planetary Computer only, a search of its own that never holds the photos' one).
 *
 * Primary: Microsoft Planetary Computer (search + server-side rendered crops).
 * Fallback (Sentinel-2 only): Element 84 Earth Search, used when PC search is down. Earth Search
 * items carry the ESA product URI, from which we rebuild the PC item id so crops and the spot
 * cloud check still go through PC's renderer. If that id can't be derived, the capture degrades
 * to E84's full-scene thumbnail (cropUrl then returns the thumbnail, not a crop).
 *
 * Time caveat (measured, not assumed): PC's Sentinel-2 `datetime` is the *datatake* start, which
 * can precede the actual overflight of the place by several minutes (Waterloo, 2026-11-01:
 * archive 16:14:21, SGP4 closest approach 16:21:14). Match captures to passes by NORAD id and
 * orbit (|Δt| ≲ 15 min) and display the pass time, not `Capture.datetime`.
 */
import type { Capture, LatLon } from '@/types'
import { ES_STAC_SEARCH, PC_STAC_SEARCH, type CropOpts, type StacCollection } from './endpoints'
import { pcCropUrl } from './pcCrop'
import { fetchJson, HttpError, isAbortError, throwIfAborted, type RetryOptions } from './net'
import { CROP_HALF_KM, s2EpsgFromItemId, sceneEpsgFromStac, sceneOnPlaceGrid } from '../../api/_lib/toneRender'
import { RADAR_COLLECTION, RADAR_GSD_M, RADAR_HALF_KM, radarCropUrl, type RadarPol } from './radar'

// ── STAC wire types (only what we read) ────────────────────────────────────────────────────

export interface StacLink {
  rel: string
  href: string
  type?: string
  method?: string
  body?: Record<string, unknown>
  merge?: boolean
}

export type StacGeometry =
  | { type: 'Polygon'; coordinates: number[][][] }
  | { type: 'MultiPolygon'; coordinates: number[][][][] }
  | { type: string; coordinates?: unknown }

export interface StacItem {
  id: string
  collection?: string
  geometry?: StacGeometry | null
  properties: Record<string, unknown>
  assets?: Record<string, { href: string; type?: string }>
  links?: StacLink[]
}

export interface StacItemCollection {
  features: StacItem[]
  links?: StacLink[]
}

// ── Platforms ──────────────────────────────────────────────────────────────────────────────

/** NORAD catalog numbers for the platforms whose archives we search. */
export const PLATFORM_NORAD: Readonly<Record<string, number>> = {
  'sentinel-2a': 40697,
  'sentinel-2b': 42063,
  'sentinel-2c': 60989,
  'landsat-8': 39084,
  'landsat-9': 49260,
  'sentinel-1a': 39634,
  'sentinel-1c': 62261,
  'sentinel-1d': 66315,
}

/** Landsat platforms we accept. Landsat 7 (scan-line-corrector failure, decommissioned) is excluded. */
export const LANDSAT_PLATFORMS = ['landsat-8', 'landsat-9'] as const

/** "Sentinel-2C" → "sentinel-2c", "LANDSAT_9" → "landsat-9", "landsat8" → "landsat-8". */
export function normalizePlatform(platform: string): string {
  const p = platform.trim().toLowerCase().replace(/[\s_]+/g, '-')
  const ls = /^landsat-?(\d+)$/.exec(p)
  if (ls) return `landsat-${ls[1]}`
  const s2 = /^sentinel-?2-?([a-z])$/.exec(p)
  if (s2) return `sentinel-2${s2[1]}`
  return p
}

export function noradForPlatform(platform: string): number | undefined {
  return PLATFORM_NORAD[normalizePlatform(platform)]
}

const GSD_M: Record<StacCollection, number> = { 'sentinel-2-l2a': 10, 'landsat-c2-l2': 30 }

// ── Item → Capture ─────────────────────────────────────────────────────────────────────────

/**
 * A capture plus the archive bookkeeping needed to deduplicate it. `processing` sorts
 * lexicographically: a larger value is a newer processing of the same acquisition.
 */
export interface Candidate {
  capture: Capture
  processing: string
  /** MGRS tile (S2) or WRS path/row (Landsat), when known */
  tile?: string
  /** The scene's own CRS (UTM EPSG), when known: an overflight's scenes prefer the one on the place's grid */
  epsg?: number
}

const num = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined)
const str = (v: unknown): string | undefined => (typeof v === 'string' && v ? v : undefined)

/** Outer ring of the footprint polygon that contains the place (or the first one). */
export function footprintRing(geometry: StacGeometry | null | undefined, place: LatLon): [number, number][] | undefined {
  if (!geometry || !('coordinates' in geometry) || !Array.isArray(geometry.coordinates)) return undefined
  const toRing = (r: number[][]) => r.filter((p) => p.length >= 2).map((p) => [p[0], p[1]] as [number, number])
  if (geometry.type === 'Polygon') {
    const rings = geometry.coordinates as number[][][]
    return rings[0] ? toRing(rings[0]) : undefined
  }
  if (geometry.type === 'MultiPolygon') {
    const polys = (geometry.coordinates as number[][][][]).map((p) => toRing(p[0] ?? []))
    return polys.find((r) => pointInRing(r, place)) ?? polys[0]
  }
  return undefined
}

/** Self link of a STAC item (or a constructed one). */
function selfLink(item: StacItem): string | undefined {
  return item.links?.find((l) => l.rel === 'self')?.href
}

/** S2 product "generation" stamp: the trailing YYYYMMDDTHHMMSS of the PC item id / product URI. */
function s2GenerationStamp(idOrUri: string): string {
  const m = /_(\d{8}T\d{6})(?:\.SAFE)?$/.exec(idOrUri)
  return m ? m[1] : ''
}

/**
 * Planetary Computer item id from an ESA product URI, e.g.
 *   S2B_MSIL2A_20261106T161449_N0513_R140_T17TNJ_20261106T195148.SAFE
 *   → S2B_MSIL2A_20261106T161449_R140_T17TNJ_20261106T195148
 */
export function pcItemIdFromProductUri(uri: string | undefined): string | undefined {
  if (!uri) return undefined
  const m = /^(S2[A-Z]_MSIL2A_\d{8}T\d{6})_N\d{4}_(R\d{3}_T\d{2}[A-Z]{3}_\d{8}T\d{6})(?:\.SAFE)?$/.exec(uri.trim())
  return m ? `${m[1]}_${m[2]}` : undefined
}

/** True if `id` is a Planetary Computer Sentinel-2 L2A item id (as opposed to an E84 id). */
export function isPcS2ItemId(id: string): boolean {
  return /^S2[A-Z]_MSIL2A_\d{8}T\d{6}_R\d{3}_T\d{2}[A-Z]{3}_\d{8}T\d{6}$/.test(id)
}

/** Convert a Planetary Computer item. Returns undefined for items we don't show (e.g. Landsat 7). */
export function pcItemToCandidate(item: StacItem, place: LatLon): Candidate | undefined {
  const p = item.properties
  const collection = (item.collection ?? str(p['collection'])) as StacCollection | undefined
  if (collection !== 'sentinel-2-l2a' && collection !== 'landsat-c2-l2') return undefined
  const datetime = Date.parse(str(p['datetime']) ?? '')
  const platform = normalizePlatform(str(p['platform']) ?? '')
  if (!Number.isFinite(datetime) || !platform) return undefined
  if (collection === 'landsat-c2-l2' && !(LANDSAT_PLATFORMS as readonly string[]).includes(platform)) return undefined

  const zenith = num(p['s2:mean_solar_zenith'])
  const sunElevationDeg = num(p['view:sun_elevation']) ?? (zenith !== undefined ? 90 - zenith : undefined)
  const itemId = item.id
  // The scene's own CRS (Sentinel-2's also follows from its tile id): dedupe prefers the scene on the place's grid.
  const epsg = sceneEpsgFromStac(collection, p, item.assets as Record<string, Record<string, unknown>> | undefined) ?? (collection === 'sentinel-2-l2a' ? s2EpsgFromItemId(itemId) : null) ?? undefined
  const capture: Capture = {
    id: itemId,
    provider: 'planetary-computer',
    collection,
    itemId,
    platform,
    norad: PLATFORM_NORAD[platform],
    datetime,
    cloudCoverPct: num(p['eo:cloud_cover']),
    gsdM: GSD_M[collection],
    sunElevationDeg,
    footprint: footprintRing(item.geometry, place),
    cropUrl: (opts: CropOpts) => pcCropUrl(collection, itemId, place, opts),
    previewUrl: item.assets?.['rendered_preview']?.href,
    sourceUrl: selfLink(item),
  }
  if (collection === 'sentinel-2-l2a') {
    return {
      capture,
      processing: `${str(p['s2:processing_baseline']) ?? ''}|${s2GenerationStamp(itemId) || (str(p['s2:generation_time']) ?? '')}`,
      tile: str(p['s2:mgrs_tile']),
      epsg,
    }
  }
  const path = str(p['landsat:wrs_path'])
  const row = str(p['landsat:wrs_row'])
  return {
    capture,
    processing: `${str(p['landsat:collection_number']) ?? ''}|${str(p['created']) ?? ''}`,
    tile: path && row ? `${path}/${row}` : undefined,
    epsg,
  }
}

/**
 * Convert an Earth Search `sentinel-2-c1-l2a` item. Crops and spot checks go through PC when
 * the PC item id can be rebuilt from the product URI; otherwise we fall back to E84's
 * full-scene thumbnail and `itemId` stays the E84 id.
 */
export function earthSearchItemToCandidate(item: StacItem, place: LatLon): Candidate | undefined {
  const p = item.properties
  const datetime = Date.parse(str(p['datetime']) ?? '')
  const platform = normalizePlatform(str(p['platform']) ?? '')
  if (!Number.isFinite(datetime) || !platform.startsWith('sentinel-2')) return undefined
  const productUri = str(p['s2:product_uri'])
  const pcId = pcItemIdFromProductUri(productUri)
  const thumb = item.assets?.['thumbnail']?.href
  const itemId = pcId ?? item.id
  const capture: Capture = {
    id: itemId,
    provider: 'earth-search',
    collection: 'sentinel-2-l2a',
    itemId,
    platform,
    norad: PLATFORM_NORAD[platform],
    datetime,
    cloudCoverPct: num(p['eo:cloud_cover']),
    gsdM: GSD_M['sentinel-2-l2a'],
    sunElevationDeg: num(p['view:sun_elevation']),
    footprint: footprintRing(item.geometry, place),
    // Degraded mode: without a PC id there is no server-side cropper, so hand back the
    // full-scene thumbnail. Callers can detect this via provider === 'earth-search' && !isPcS2ItemId(itemId).
    cropUrl: pcId ? (opts: CropOpts) => pcCropUrl('sentinel-2-l2a', pcId, place, opts) : () => thumb ?? '',
    previewUrl: thumb,
    sourceUrl: selfLink(item),
  }
  const grid = [p['mgrs:utm_zone'], p['mgrs:latitude_band'], p['mgrs:grid_square']]
  const zone = num(p['mgrs:utm_zone'])
  const band = str(p['mgrs:latitude_band'])
  return {
    capture,
    processing: `${str(p['s2:processing_baseline']) ?? ''}|${productUri ? s2GenerationStamp(productUri) : ''}`,
    tile: grid.every((g) => g !== undefined) ? grid.join('') : undefined,
    // Its zone as Planetary Computer's copy is gridded (the tile id), else as Earth Search's properties say.
    epsg: (pcId ? s2EpsgFromItemId(pcId) : null) ?? (zone && band ? (band >= 'N' ? 32600 : 32700) + zone : undefined),
  }
}

/**
 * Convert a Planetary Computer `sentinel-1-rtc` item (radar: no cloud, no sun). Its polarisation is VV where it has one
 * (nearly everywhere), else HH; a scene with neither is not shown.
 */
export function pcRadarItemToCandidate(item: StacItem, place: LatLon): Candidate | undefined {
  const p = item.properties
  const datetime = Date.parse(str(p['datetime']) ?? '')
  const platform = normalizePlatform(str(p['platform']) ?? '')
  if (!Number.isFinite(datetime) || !platform.startsWith('sentinel-1')) return undefined
  const pols = Array.isArray(p['sar:polarizations']) ? (p['sar:polarizations'] as unknown[]).map((v) => String(v).toLowerCase()) : []
  const pol: RadarPol | undefined = pols.includes('vv') && item.assets?.vv ? 'vv' : pols.includes('hh') && item.assets?.hh ? 'hh' : undefined
  if (!pol) return undefined
  const itemId = item.id
  const code = p['proj:code']
  const epsg = typeof code === 'string' && /^EPSG:\d+$/.test(code) ? Number(code.slice(5)) : num(p['proj:epsg'])
  const capture: Capture = {
    id: itemId,
    provider: 'planetary-computer',
    collection: RADAR_COLLECTION,
    itemId,
    platform,
    norad: PLATFORM_NORAD[platform],
    datetime,
    gsdM: RADAR_GSD_M,
    footprint: footprintRing(item.geometry, place),
    cropUrl: (opts: CropOpts) => radarCropUrl(itemId, pol, place, opts),
    previewUrl: item.assets?.['rendered_preview']?.href,
    sourceUrl: selfLink(item),
  }
  return { capture, processing: str(p['s1:processing_datetime']) ?? str(p['created']) ?? '', epsg }
}

// ── Geometry helpers for dedupe ────────────────────────────────────────────────────────────

/** Ray-casting point-in-polygon on a lon/lat ring (fine at scene scale). */
export function pointInRing(ring: [number, number][], p: LatLon): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > p.lat !== yj > p.lat && p.lon < ((xj - xi) * (p.lat - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

/**
 * Signed distance (km) from the place to the footprint edge: positive inside, negative outside.
 * Local equirectangular projection around the place; scenes are ≤ 200 km so this is plenty.
 */
export function footprintMarginKm(ring: [number, number][] | undefined, p: LatLon): number {
  if (!ring || ring.length < 3) return 0
  const kx = 111.32 * Math.cos((p.lat * Math.PI) / 180)
  const ky = 110.57
  const pt = ring.map(([lon, lat]) => {
    const dLon = ((((lon - p.lon) % 360) + 540) % 360) - 180
    return [dLon * kx, (lat - p.lat) * ky] as const
  })
  let best = Infinity
  for (let i = 0, j = pt.length - 1; i < pt.length; j = i++) {
    const [ax, ay] = pt[j]
    const [bx, by] = pt[i]
    const dx = bx - ax
    const dy = by - ay
    const len2 = dx * dx + dy * dy
    const t = len2 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2)) : 0
    best = Math.min(best, Math.hypot(ax + t * dx, ay + t * dy))
  }
  return pointInRing(ring, p) ? best : -best
}

/** Acquisitions of one platform closer than this are the same overflight (adjacent tiles / WRS rows). */
const SAME_PASS_MS = 120_000

/**
 * Collapse archive duplicates into one capture per overflight:
 *  1. Same platform + datetime + tile, processed more than once (S2 processing baselines):
 *     keep the newest processing.
 *  2. Same platform within 2 min (overlapping MGRS tiles of one datatake, adjacent Landsat rows): keep the scene
 *     on the place's grid (toneRender placeGrid: the UTM zone of the place) when the whole photo lies inside it, so
 *     its photo is the archive's own pixels, copied with no warp; else the scene the place sits deepest inside
 *     (its photo is warped onto the place's grid, so it still turns like every other photo of the place); then the
 *     newest processing, then the clearest.
 * Output is sorted newest first.
 */
export function dedupeCandidates(cands: Candidate[], place: LatLon): Candidate[] {
  const byAcq = new Map<string, Candidate>()
  for (const c of cands) {
    const k = `${c.capture.platform}|${c.capture.datetime}|${c.tile ?? c.capture.itemId}`
    const prev = byAcq.get(k)
    if (!prev || c.processing > prev.processing) byAcq.set(k, c)
  }
  const sorted = [...byAcq.values()].sort(
    (a, b) => a.capture.platform.localeCompare(b.capture.platform) || a.capture.datetime - b.capture.datetime,
  )
  const margin = new Map(sorted.map((c) => [c, footprintMarginKm(c.capture.footprint, place)]))
  const onGrid = (c: Candidate) => sceneOnPlaceGrid(c.epsg, place.lat, place.lon)
  // The photo's square lies inside the footprint: the place is at least its half-diagonal from the edge.
  const holdsPhoto = (c: Candidate) => margin.get(c)! >= ((CROP_HALF_KM as Record<string, number>)[c.capture.collection] ?? (c.capture.collection === RADAR_COLLECTION ? RADAR_HALF_KM : 5)) * Math.SQRT2
  const better = (a: Candidate, b: Candidate) => {
    const ga = onGrid(a)
    if (ga !== onGrid(b) && holdsPhoto(ga ? a : b)) return ga
    const dm = margin.get(a)! - margin.get(b)!
    if (Math.abs(dm) > 0.05) return dm > 0
    if (a.processing !== b.processing) return a.processing > b.processing
    return (a.capture.cloudCoverPct ?? 101) < (b.capture.cloudCoverPct ?? 101)
  }
  const out: Candidate[] = []
  let anchor: Candidate | undefined // first capture of the current cluster (clusters don't chain forever)
  for (const c of sorted) {
    const last = out[out.length - 1]
    if (last && anchor && c.capture.platform === anchor.capture.platform && c.capture.datetime - anchor.capture.datetime <= SAME_PASS_MS) {
      if (better(c, last)) out[out.length - 1] = c
    } else {
      out.push(c)
      anchor = c
    }
  }
  return out.sort((a, b) => b.capture.datetime - a.capture.datetime)
}

// ── Search ─────────────────────────────────────────────────────────────────────────────────

const SEARCH_TIMEOUT_MS = 12_000
/**
 * The week's photo searches (searchCapturesDetailed) get one attempt of this long when the archive is silent. The
 * report gives the whole leg 20 s (report.ts ARCHIVE_TIMEOUT_MS) and throws everything away at that point, so a
 * search has to give up early enough for what did answer to be used: with 12 s and a second try, one stalled
 * collection (24.7 s) cost the report the other collection's scenes, and Earth Search was first asked after the
 * cap. Now a stalled collection is given up at 8 s and Earth Search has answered or failed by 16 s. Planetary
 * Computer answers a week's search in about a second; errors that come back quickly are still retried once.
 */
const WEEK_SEARCH_TIMEOUT_MS = 8_000
const WEEK_SEARCH: SearchOptions = { timeoutMs: WEEK_SEARCH_TIMEOUT_MS, retryTimeouts: false }

/** Per-request limits of a search: `timeoutMs` for each page, and whether a page that timed out is asked again. */
type SearchOptions = Pick<RetryOptions, 'timeoutMs' | 'retryTimeouts'>
const MAX_PAGES = 10

/** ISO-8601 without milliseconds (what every STAC server accepts). */
export function stacIso(ms: number): string {
  return new Date(Math.floor(ms / 1000) * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z')
}

export function searchBody(collection: string, place: LatLon, start: number, end: number): Record<string, unknown> {
  const body: Record<string, unknown> = {
    collections: [collection],
    intersects: { type: 'Point', coordinates: [round6(place.lon), round6(place.lat)] },
    datetime: `${stacIso(start)}/${stacIso(Math.ceil(end / 1000) * 1000)}`,
    limit: 100,
  }
  if (collection === 'landsat-c2-l2') body.query = { platform: { in: [...LANDSAT_PLATFORMS] } }
  return body
}
const round6 = (n: number) => Math.round(n * 1e6) / 1e6

/**
 * A search body as the query string of a GET search (STAC API "Item Search": the same fields, `collections` and
 * `sortby` as comma lists with `-field` for descending, objects as JSON). Undefined when the body holds anything
 * this does not know how to write, so the caller keeps the POST.
 */
export function searchGetUrl(url: string, body: Record<string, unknown>): string | undefined {
  const q = new URLSearchParams()
  for (const [key, v] of Object.entries(body)) {
    if (v === undefined) continue
    if (key === 'collections' && Array.isArray(v) && v.every((c) => typeof c === 'string' && !c.includes(','))) q.set(key, v.join(','))
    else if (key === 'sortby' && Array.isArray(v) && v.every(isSortField)) q.set(key, v.map((f) => (f.direction === 'desc' ? '-' : '+') + f.field).join(','))
    else if ((key === 'intersects' || key === 'query') && typeof v === 'object' && v !== null) q.set(key, JSON.stringify(v))
    else if (key === 'datetime' && typeof v === 'string') q.set(key, v)
    else if (key === 'limit' && typeof v === 'number' && Number.isInteger(v)) q.set(key, String(v))
    else return undefined
  }
  const out = `${url}?${q}`
  return out.length <= MAX_GET_URL ? out : undefined
}
const isSortField = (f: unknown): f is { field: string; direction: 'asc' | 'desc' } =>
  typeof f === 'object' && f !== null && typeof (f as { field?: unknown }).field === 'string' && !(f as { field: string }).field.includes(',') && ['asc', 'desc'].includes((f as { direction?: string }).direction ?? '')
/** The app's longest search is ~400 characters; anything far beyond that is not one of ours. */
const MAX_GET_URL = 1800

/** Endpoints that refused the GET form in this tab: later searches there go straight to POST. */
const getRefused = new Set<string>()

/**
 * One page of a search, asked for with GET.
 *
 * Why not POST, which is what a search body is written for: a cross-origin POST of JSON is not a "simple" request,
 * so the browser first sends an OPTIONS preflight and waits for its answer. Planetary Computer's preflight answer
 * carries no Access-Control-Max-Age, so it is never remembered for longer than a few seconds: every search paid a
 * round trip before the archive even heard the question, on the path to the first photo (measured in Chromium on a
 * datacentre link, the same query 14 times each way: 370 ms by POST, 220 ms by GET; the difference is one round trip
 * plus the preflight's handling, so it grows with a phone's latency). A GET with no custom headers needs no
 * preflight. Both archives answer it with the very same features as the POST (compared live for every body this
 * module builds: week, Landsat platform filter, clear scenes with `query` + `sortby`, limit 1, and paging).
 *
 * POST stays as the fallback for one case only: the server refuses the GET form (a 4xx that is not worth a retry).
 * A timeout, a network failure or a 5xx is the archive being down, and is reported as before: asking again by POST
 * would only double the wait before the Earth Search fallback or the "unreachable" note.
 */
async function searchPage(url: string, body: Record<string, unknown>, opts: { signal?: AbortSignal; timeoutMs: number; retries: number }): Promise<StacItemCollection> {
  const get = getRefused.has(url) ? undefined : searchGetUrl(url, body)
  if (get) {
    try {
      return await fetchJson<StacItemCollection>(get, opts)
    } catch (err) {
      if (!(err instanceof HttpError) || err.retryable || opts.signal?.aborted) throw err
      getRefused.add(url)
    }
  }
  return fetchJson<StacItemCollection>(url, { ...opts, body })
}

/** Test hook: forget which endpoints refused GET. */
export function _resetSearchTransport(): void {
  getRefused.clear()
}

/** Run a STAC search (GET, see searchPage) and follow `next` links (plain GET, or POST with body/merge). */
export async function stacSearchAll(url: string, body: Record<string, unknown>, signal?: AbortSignal, limits: SearchOptions = {}): Promise<StacItem[]> {
  const items = new Map<string, StacItem>()
  const opts = { signal, timeoutMs: SEARCH_TIMEOUT_MS, retries: 1, ...limits }
  let page = await searchPage(url, body, opts)
  let lastBody = body
  for (let i = 0; ; i++) {
    for (const f of page.features ?? []) items.set(f.id, f)
    const next = page.links?.find((l) => l.rel === 'next')
    if (!next || i >= MAX_PAGES - 1 || !(page.features?.length > 0)) break
    if ((next.method ?? 'GET').toUpperCase() === 'POST') {
      const nextBody = next.merge ? { ...lastBody, ...next.body } : (next.body ?? lastBody)
      if (JSON.stringify(nextBody) === JSON.stringify(lastBody)) break // no progress token: stop
      page = await fetchJson<StacItemCollection>(next.href, { ...opts, body: nextBody })
      lastBody = nextBody
    } else {
      page = await fetchJson<StacItemCollection>(next.href, opts)
    }
  }
  return [...items.values()]
}

async function searchPcCollection(collection: StacCollection, place: LatLon, start: number, end: number, signal?: AbortSignal) {
  const items = await stacSearchAll(PC_STAC_SEARCH, searchBody(collection, place, start, end), signal, WEEK_SEARCH)
  return items.map((it) => pcItemToCandidate({ ...it, collection: it.collection ?? collection }, place)).filter((c): c is Candidate => !!c)
}

async function searchEarthSearchS2(place: LatLon, start: number, end: number, signal?: AbortSignal) {
  const items = await stacSearchAll(ES_STAC_SEARCH, searchBody('sentinel-2-c1-l2a', place, start, end), signal, WEEK_SEARCH)
  return items.map((it) => earthSearchItemToCandidate(it, place)).filter((c): c is Candidate => !!c)
}

export interface CaptureSearchResult {
  captures: Capture[]
  /**
   * Plain-language notes on anything that went wrong but didn't stop the search, e.g. an archive
   * that was unreachable. Empty when every archive answered. Show these as footnotes: an absent
   * Landsat image means something different when Landsat's archive didn't answer.
   */
  degraded: string[]
}

/**
 * Like `searchCaptures`, but also reports partial failures. Throws only if every archive failed. `onSentinel2`, when
 * given, hears Sentinel-2's scenes (one per overflight, newest first) the moment that archive answers, before
 * Landsat's: a clear Sentinel-2 scene outranks any Landsat one for the lead photo, so its crop can start then.
 */
export async function searchCapturesDetailed(
  place: LatLon,
  start: number,
  end: number,
  signal?: AbortSignal,
  onSentinel2?: (captures: Capture[]) => void,
): Promise<CaptureSearchResult> {
  throwIfAborted(signal)
  if (!(end > start) || !Number.isFinite(place.lat) || !Number.isFinite(place.lon)) return { captures: [], degraded: [] }
  const degraded: string[] = []
  const early = (cands: Candidate[]) => {
    if (!onSentinel2 || !cands.length || signal?.aborted) return
    try {
      onSentinel2(dedupeCandidates(cands, place).map((c) => c.capture))
    } catch (err) {
      console.error(err)
    }
  }

  const s2 = (async () => {
    try {
      const found = await searchPcCollection('sentinel-2-l2a', place, start, end, signal)
      early(found)
      return found
    } catch (err) {
      if (isAbortError(err) || signal?.aborted) throw err
      const es = await searchEarthSearchS2(place, start, end, signal)
      early(es)
      degraded.push(
        es.some((c) => c.capture.provider === 'earth-search' && !isPcS2ItemId(c.capture.itemId))
          ? 'Sentinel-2 listed via Earth Search; some scenes show a full-scene thumbnail, not a crop.'
          : 'Sentinel-2 listed via Earth Search (Planetary Computer search unavailable).',
      )
      return es
    }
  })()
  const landsat = searchPcCollection('landsat-c2-l2', place, start, end, signal)

  const [a, b] = await Promise.allSettled([s2, landsat])
  throwIfAborted(signal)
  if (a.status === 'rejected' && b.status === 'rejected') {
    throw new Error('Sentinel-2 and Landsat archives are unreachable right now.', { cause: a.reason })
  }
  if (a.status === 'rejected') degraded.push('Sentinel-2 archive unreachable; Sentinel-2 images may be missing.')
  if (b.status === 'rejected') degraded.push('Landsat archive unreachable; Landsat images may be missing.')
  const cands = [...(a.status === 'fulfilled' ? a.value : []), ...(b.status === 'fulfilled' ? b.value : [])]
  return { captures: dedupeCandidates(cands, place).map((c) => c.capture), degraded }
}

/**
 * Every Sentinel-2 (A/B/C) and Landsat 8/9 scene that covers `place` in [start, end], newest
 * first, one per overflight. Abortable. Throws only if no archive could be reached.
 */
export async function searchCaptures(place: LatLon, start: number, end: number, signal?: AbortSignal): Promise<Capture[]> {
  return (await searchCapturesDetailed(place, start, end, signal)).captures
}

/**
 * Sentinel-1's radar images of `place` in [start, end] (Planetary Computer `sentinel-1-rtc`), one per overflight, newest
 * first. A search of its own, never part of searchCapturesDetailed: the engine asks for it alongside and takes what has
 * answered by the time its report is built, so radar never makes the photos wait. Abortable; rejects when the archive
 * can't be reached (the radar passes then stay as geometry says).
 */
export async function searchRadar(place: LatLon, start: number, end: number, signal?: AbortSignal): Promise<Capture[]> {
  throwIfAborted(signal)
  if (!(end > start) || !Number.isFinite(place.lat) || !Number.isFinite(place.lon)) return []
  const items = await stacSearchAll(PC_STAC_SEARCH, searchBody(RADAR_COLLECTION, place, start, end), signal)
  const cands = items.map((it) => pcRadarItemToCandidate(it, place)).filter((c): c is Candidate => !!c)
  return dedupeCandidates(cands, place).map((c) => c.capture)
}

/** Scene cloud below which an archive scene is a clear-cover candidate (server-side filter). */
export const CLEAR_SCENE_MAX_CLOUD = 20
/** Candidates per collection for the clear cover (newest first; one page, no paging). */
const CLEAR_SCENE_LIMIT = 12

/**
 * The STAC body for "the newest nearly cloud-free scenes over the place": the usual search plus a server-side
 * scene-cloud filter (`query` extension, eo:cloud_cover < 20) and newest-first sorting, one page.
 */
export function clearSceneBody(collection: StacCollection, place: LatLon, start: number, end: number, limit = CLEAR_SCENE_LIMIT): Record<string, unknown> {
  const body = searchBody(collection, place, start, end)
  const query = { ...((body.query as Record<string, unknown> | undefined) ?? {}), 'eo:cloud_cover': { lt: CLEAR_SCENE_MAX_CLOUD } }
  return { ...body, limit, query, sortby: [{ field: 'datetime', direction: 'desc' }] }
}

/**
 * Nearly cloud-free Sentinel-2 and Landsat 8/9 scenes over `place` in [start, end] (Planetary Computer, one page
 * per collection), one per overflight, newest first. For the clear cover (owner D): the last clear look from
 * before a cloudy week. Resolves [] when neither collection answers; rejects only on abort.
 */
export async function searchClearScenes(place: LatLon, start: number, end: number, signal?: AbortSignal): Promise<Capture[]> {
  throwIfAborted(signal)
  if (!(end > start) || !Number.isFinite(place.lat) || !Number.isFinite(place.lon)) return []
  const one = async (collection: StacCollection) => {
    const page = await searchPage(PC_STAC_SEARCH, clearSceneBody(collection, place, start, end), { signal, timeoutMs: SEARCH_TIMEOUT_MS, retries: 1 })
    return (page.features ?? [])
      .map((it) => pcItemToCandidate({ ...it, collection: it.collection ?? collection }, place))
      .filter((c): c is Candidate => !!c && (c.capture.cloudCoverPct ?? 100) < CLEAR_SCENE_MAX_CLOUD)
  }
  const settled = await Promise.allSettled([one('sentinel-2-l2a'), one('landsat-c2-l2')])
  throwIfAborted(signal)
  const cands = settled.flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
  return dedupeCandidates(cands, place).map((c) => c.capture)
}

/** How far back the acquisition-plan check looks: Sentinel-2 revisits land every 5 days, so 90 days is decisive. */
const PLAN_LOOKBACK_MS = 90 * 86_400_000

/**
 * Does Sentinel-2 image this place at all? One search for any scene over the last 90 days (limit 1).
 * Sentinel-2 records land and coastal water only, so the open ocean answers false: geometry alone would
 * otherwise call those overflights "likely photographed". Resolves undefined when the archive can't say
 * (unreachable, timeout); rejects only on abort.
 */
export async function sentinel2PlanCovers(place: LatLon, end: number, signal?: AbortSignal): Promise<boolean | undefined> {
  throwIfAborted(signal)
  const body = { ...searchBody('sentinel-2-l2a', place, end - PLAN_LOOKBACK_MS, end), limit: 1 }
  try {
    const page = await searchPage(PC_STAC_SEARCH, body, { signal, timeoutMs: 6_000, retries: 1 })
    return Array.isArray(page.features) ? page.features.length > 0 : undefined
  } catch (err) {
    if (isAbortError(err) || signal?.aborted) throw err
    return undefined
  }
}
