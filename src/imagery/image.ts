/**
 * Image loading for the imagery module.
 *
 *  - `preloadImage(url)` fetches + decodes off the main thread (`img.decode()`), so the UI can
 *    swap a fully decoded picture in without a paint stall. Results are kept in an in-memory
 *    LRU keyed by URL, and concurrent callers share one load. NASA GIBS photos (I-1) are fetched in
 *    the pixels worker, which also measures their no-data share on a 32 px decode; the element shows
 *    the very bytes it checked (a blob: URL), so nothing is drawn or read back on the main thread.
 *  - `probeImage(url)` decodes a (tiny) image and measures how much of it is no-data
 *    (transparent or pure black). GIBS answers "no data yet" with a black JPEG instead of an
 *    error, so this is the only reliable way to tell an empty frame from a real one. The fetch
 *    and decode run in a worker (pixelsClient.ts) when the browser allows. A daily mosaic is probed
 *    on its pre-cut tile (./gibsTiles.ts), where a day with no image at all is a 404: empty too.
 *
 *  - Sentinel-2 / Landsat photos (the encoded render, api/_lib/tone.ts) are never shown as they come: the pixels
 *    worker fetches them, applies the photo's one global curve + light sharpening and hands back the bytes, and
 *    the element shows those (a blob: URL), exactly as for GIBS. Every view, the share card and the download use
 *    the same toned pixels (owner rules a, b, d). Sentinel-1 radar crops (radar.ts) are toned there too (radarTone.ts).
 *
 * All images are requested with `crossOrigin="anonymous"`: every archive we use sends
 * `Access-Control-Allow-Origin: *`, and CORS-clean pixels can be read back (probe, canvas
 * reveal) or uploaded as WebGL textures. Consumers rendering `<img>` should set the same
 * `crossOrigin` so the browser reuses the decoded image instead of fetching it again.
 */
import { EUMETSAT_WMS, GIBS_WMS } from './endpoints'
import { isTonedUrl } from './pcCrop'
import { Lru, memoAsync } from './lru'
import { HttpError, raceAbort, sleep, withRetry } from './net'
import { measureNoData } from './pixels'
import { isGibsTileUrl } from './gibsTiles'
import { frameRedrawFor } from './infrared'
import { fetchCheckedImage, fetchPanSharp, fetchPixels, fetchToned } from './pixelsClient'
import { isPanSharpUrl, parsePanSharpUrl } from './panUrl'
import { isRadarUrl } from './radar'

export { decodeImagePixels, measureNoData } from './pixels'

const IMAGE_TIMEOUT_MS = 45_000 // PC renders crops on demand: 1–3 s typical, much longer on a cold cache
const imageCache = /* @__PURE__ */ new Lru<string, Promise<HTMLImageElement>>(96)

/**
 * NASA GIBS answered with an all-black image: "no data" in GIBS's dialect (not processed yet, a
 * swath gap, a missing frame, or a young frame on a lagging backend). Not retried: Chromium keeps
 * a loaded image for its URL for the life of the document, `no-store` or not (measured: a second
 * `new Image()` or `<img>` with the same URL made no request), so a retry would only see the same
 * black pixels. Callers should move on (e.g. to an older frame), as `latestGeoImage` does.
 * EUMETSAT's map service is asked to speak the same dialect (./eumetsat.ts: off the disc, or a
 * daylight product at night), so its frames are checked the same way.
 */
export class EmptyImageError extends Error {
  constructor(url: string) {
    super(`${isGibsUrl(url) ? 'NASA GIBS' : 'EUMETSAT'} returned an empty frame for ${url.slice(0, 120)}…`)
    this.name = 'EmptyImageError'
  }
}

/**
 * A weather picture did not arrive in time. Not retried either: NASA GIBS renders each one on demand, so one that
 * takes this long means the service is overloaded, and a second request adds to that for a picture nobody is still
 * waiting for (2026-11-12). Callers move on, as they do from an empty frame.
 */
export class ImageTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Image timed out after ${Math.round(timeoutMs / 1000)} s`)
    this.name = 'ImageTimeoutError'
  }
}

/** Share of no-data pixels at which a weather image counts as empty (a real frame is never this black). */
const EMPTY_NO_DATA = 0.98

const isGibsUrl = (url: string) => url.startsWith(GIBS_WMS)
/** Weather imagery (NASA GIBS, EUMETSAT): shown from bytes the pixels worker has checked for "no data". */
const isCheckedUrl = (url: string) => isGibsUrl(url) || url.startsWith(EUMETSAT_WMS)

/**
 * A NASA GIBS photo or a EUMETSAT frame for display (I-1): fetched and checked for "no data" in the pixels worker (its 32 px decode),
 * then shown from the very bytes that were checked (a blob: URL, decoded off the main thread by `img.decode()`).
 * The object URL is never revoked: the decoded element and its clones (one per view, results/images.ts) load
 * from it for the whole session.
 */
async function loadGibs(url: string, timeoutMs: number): Promise<HTMLImageElement> {
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), timeoutMs)
  let checked
  try {
    checked = await fetchCheckedImage(url, ctl.signal)
  } catch (err) {
    throw ctl.signal.aborted ? new ImageTimeoutError(timeoutMs) : err
  } finally {
    clearTimeout(timer)
  }
  if (!checked.blob) throw new Error('Image failed to load') // an HTTP error, or WMS's 200 + XML error
  if ((checked.noData ?? 0) >= EMPTY_NO_DATA) throw new EmptyImageError(url)
  const img = await loadOnce(URL.createObjectURL(checked.blob), timeoutMs)
  // How much of the picture has no data, for callers that hold a part-empty one back (a frame at the rim of a disc).
  img.dataset.nodata = (checked.noData ?? 0).toFixed(2)
  return img
}

/** True for a weather frame that is redrawn before it is shown (./infrared.ts): the globe asks before it paints one. */
export const isRedrawnUrl = (url: string) => !!frameRedrawFor(url)

/**
 * A redrawn weather frame's bytes (pixels worker), for the globe: it paints the frame the panel shows, never the raw
 * layer (NASA's infrared rainbow, or Himawari's near-black linear visible band). Rejects on HTTP or network failure.
 */
export async function redrawnImageBlob(url: string, timeoutMs = IMAGE_TIMEOUT_MS): Promise<Blob> {
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), timeoutMs)
  try {
    const checked = await fetchCheckedImage(url, ctl.signal)
    if (!checked.blob) throw new HttpError(checked.status, url)
    return checked.blob
  } finally {
    clearTimeout(timer)
  }
}

/**
 * The toned bytes of a Sentinel-2 / Landsat crop (pixels worker): JPEG for display, PNG for a lossless download.
 * Rejects on HTTP or network failure and on timeout.
 */
export async function tonedImageBlob(url: string, opts: { signal?: AbortSignal; timeoutMs?: number; fmt?: 'jpeg' | 'png' } = {}): Promise<Blob> {
  const timeoutMs = opts.timeoutMs ?? IMAGE_TIMEOUT_MS
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), timeoutMs)
  const onAbort = () => ctl.abort()
  opts.signal?.addEventListener('abort', onAbort, { once: true })
  try {
    const r = await fetchToned(url, ctl.signal, opts.fmt ?? 'jpeg')
    if (!r.blob) throw new HttpError(r.status, url)
    return r.blob
  } catch (err) {
    if (ctl.signal.aborted && !opts.signal?.aborted) throw new Error(`Image timed out after ${Math.round(timeoutMs / 1000)} s`)
    throw err
  } finally {
    clearTimeout(timer)
    opts.signal?.removeEventListener('abort', onAbort)
  }
}

/**
 * A Sentinel-2 / Landsat photo for display: toned in the pixels worker, then decoded from those bytes (a blob: URL,
 * `img.decode()` off the main thread). The object URL is never revoked: the element and its clones use it all session.
 */
async function loadToned(url: string, timeoutMs: number): Promise<HTMLImageElement> {
  const blob = await tonedImageBlob(url, { timeoutMs })
  return loadOnce(URL.createObjectURL(blob), timeoutMs)
}

/**
 * A Landsat 8/9 photo's pan-sharpened lightbox layer (panUrl.ts), decoded from the worker's bytes. Whatever stops it
 * (no pan for that capture yet, the free quota spent, CDSE down, a timeout) gives the 30 m sharper layer instead, so the
 * lightbox is never worse off than without it.
 */
async function loadPanSharp(url: string, timeoutMs: number): Promise<HTMLImageElement> {
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), PAN_TIMEOUT_MS)
  try {
    const r = await fetchPanSharp(url, ctl.signal)
    if (r.blob) {
      const img = await loadOnce(URL.createObjectURL(r.blob), timeoutMs)
      // Says what it shows (15 m detail), so the lightbox's labels can say so too; the 30 m fallback is not marked.
      img.dataset.pan = '15'
      return img
    }
  } catch {
    /* the 30 m layer below */
  } finally {
    clearTimeout(timer)
  }
  const fallback = parsePanSharpUrl(url)?.fallbackUrl
  if (!fallback) throw new Error('Image failed to load')
  return loadToned(fallback, timeoutMs)
}
/** How long the pan-sharpened layer may take before the 30 m one is fetched instead (CDSE: ~1–3 s cold). */
const PAN_TIMEOUT_MS = 6_000

function loadOnce(url: string, timeoutMs: number): Promise<HTMLImageElement> {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.decoding = 'async'
    let settled = false
    const done = (err?: Error) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      img.onload = img.onerror = null
      if (err) {
        img.src = '' // stop the download
        reject(err)
      } else resolve(img)
    }
    const timer = setTimeout(() => done(new Error(`Image timed out after ${Math.round(timeoutMs / 1000)} s`)), timeoutMs)
    img.onerror = () => done(new Error('Image failed to load'))
    img.onload = () => {
      // decode() can reject for images that loaded fine on some engines (e.g. very large PNGs
      // under memory pressure); the pixels are still usable then, so fall back to onload.
      if (typeof img.decode === 'function') img.decode().then(() => done(), () => done())
      else done()
    }
    img.src = url
  })
}

/**
 * Load and decode an image, with one retry for transient failures (PC's tiler occasionally
 * 5xxs on a cold scene). Cached by URL; failures are not cached.
 *
 * Sentinel-2 / Landsat crops are toned first (see the header), so the element's `src` is a blob: URL too.
 * NASA GIBS images are also checked (in the pixels worker, I-1): an all-black response is GIBS saying
 * "no data" with a 200, so it rejects with `EmptyImageError` (no retry, see there) rather than resolving a
 * black square; one that times out rejects with `ImageTimeoutError`, not retried either. Show the resolved element (or a clone: same `src`), never a fresh `<img src={url}>`: a
 * Sentinel-2 / Landsat crop would be a cache hit (Chromium reuses the document's loaded image for the same URL
 * and CORS mode), but a GIBS element's `src` is the blob: URL of the bytes that were checked, so `url` itself
 * was never loaded as an image (GIBS sends `no-store`: a fresh `<img>` would download it again).
 */
export function preloadImage(url: string, opts: { signal?: AbortSignal; timeoutMs?: number } = {}): Promise<HTMLImageElement> {
  const timeoutMs = opts.timeoutMs ?? IMAGE_TIMEOUT_MS
  const blobs = typeof URL.createObjectURL === 'function'
  const load = () =>
    blobs && isCheckedUrl(url)
      ? loadGibs(url, timeoutMs)
      : blobs && isPanSharpUrl(url)
        ? loadPanSharp(url, timeoutMs)
        : blobs && (isTonedUrl(url) || isRadarUrl(url))
          ? loadToned(url, timeoutMs)
          : loadOnce(url, timeoutMs)
  const p = memoAsync(imageCache, url, async () => {
    try {
      return await load()
    } catch (err) {
      if (err instanceof EmptyImageError || err instanceof ImageTimeoutError) throw err
      await sleep(700 + Math.random() * 500)
      return load()
    }
  })
  return raceAbort(p, opts.signal)
}

/** True if `url` has already been decoded and is still in the cache (for instant swaps). */
export function isImageCached(url: string): boolean {
  return imageCache.has(url)
}

export interface ImageProbe {
  /** 0..1 share of pixels that are transparent or (near) pure black */
  noDataFraction: number
  /** 0..255 mean luma of the pixels that do carry data */
  meanLuma: number
  width: number
  height: number
}


/**
 * When each mostly-empty probe was measured. Those expire: today's daily mosaic fills in over the
 * day, and a young geostationary frame can be empty on one GIBS backend and complete on the next.
 * Probes that found data are kept (archived pixels don't disappear).
 */
const emptyProbeAt = /* @__PURE__ */ new Map<string, number>()
const EMPTY_PROBE_TTL_MS = 5 * 60_000
const probeCache = /* @__PURE__ */ new Lru<string, Promise<ImageProbe>>(256, (url) => emptyProbeAt.delete(url))

/**
 * Fetch an image (keep it small: a 16–32 px render is plenty) and measure its no-data share.
 * Cached by URL; concurrent callers share one request. A 200 response that isn't an image
 * (WMS reports errors as 200 + XML) counts as fully empty. Rejects on network/HTTP failure.
 */
export function probeImage(url: string, signal?: AbortSignal): Promise<ImageProbe> {
  const emptyAt = emptyProbeAt.get(url)
  if (emptyAt !== undefined && Date.now() - emptyAt > EMPTY_PROBE_TTL_MS) {
    emptyProbeAt.delete(url)
    probeCache.delete(url)
  }
  const p = memoAsync(probeCache, url, async () => {
    const probe = await withRetry(
      async (s): Promise<ImageProbe> => {
        // Fetched and decoded in the pixels worker (K8); only the tiny RGBA buffer comes back.
        const r = await fetchPixels(url, s)
        // The tile service has no image for that day (not processed yet, an instrument outage): an answer, not a failure.
        if (r.status === 404 && isGibsTileUrl(url)) return { noDataFraction: 1, meanLuma: 0, width: 0, height: 0 }
        if (r.status < 200 || r.status >= 300) throw new HttpError(r.status, url)
        if (!r.pixels) return { noDataFraction: 1, meanLuma: 0, width: 0, height: 0 }
        const { data, width, height } = r.pixels
        return { ...measureNoData(data), width, height }
      },
      { timeoutMs: 15_000, retries: 1, retryTimeouts: false, label: url },
    )
    if (probe.noDataFraction > 0.5) emptyProbeAt.set(url, Date.now())
    return probe
  })
  return raceAbort(p, signal)
}
