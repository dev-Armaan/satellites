/**
 * Image → RGBA pixels, for the checks that read pixels back: GIBS "no data" probes (24 px: a window of a map tile,
 * ./gibsTiles.ts, or a small render) and the Sentinel-2 SCL box at the place (10 px). Worker-safe: OffscreenCanvas
 * when available, DOM canvas otherwise.
 *
 * pixels.worker.ts runs `fetchPixelsHere` off the main thread (K8: a report reads ~40 probes during the
 * camera flight; fetch → blob → decode → draw → read back was ~200 ms of main-thread work on a 4×-throttled
 * phone). pixelsClient.ts talks to it and falls back to this module in the calling thread.
 *
 * `fetchCheckedImageHere` (I-1) does the same for the NASA GIBS photos the panel SHOWS: fetch, measure the no-data
 * share on a 32 px decode, and hand back the image bytes, so the caller shows a picture known to have pixels
 * without ever drawing the full image on the main thread (createImageBitmap(HTMLImageElement) there cost 2–27 ms
 * per GIBS image on a phone).
 *
 * A NASA infrared frame is redrawn in grey on the way, and Himawari's visible band brightened (./infrared.ts), so no
 * view ever holds the raw layer.
 *
 * `fetchTonedHere` does the same for every Sentinel-2 / Landsat photo (owner rules a, b, d): fetch the encoded
 * render (api/_lib/tone.ts), decode it, apply the photo's one global curve + light sharpening, encode it again
 * (JPEG for display, PNG for "Download image") and hand back the bytes. The curve is measured once per capture and
 * place (on the first crop close to native resolution) and reused by its other sizes, so the card, the lightbox's
 * sharper layer and the download match exactly; that layer (a magnified view) takes the curve the photo was shown
 * with even when none was shared (the photo toned before its mask came), so its crossfade changes sharpness only.
 * `fetchMaskHere` reads the cloud mask both the curve and the spot check use (one request per capture and place,
 * shared). A Sentinel-1 radar crop (./radar.ts) goes the same way with its own tone (./radarTone.ts: its contrast,
 * measured on the image itself; no mask, no curve to share).
 */
import { PHOTO_PX, canShareCurve, isMagnifiedView, maskFromResponse, toneCropAsync, tonePlanForUrl, type ToneMask, type ToneParams, type TonePlan } from '../../api/_lib/tone'
import { tileWindowOf, type TileWindow } from './gibsTiles'
import { frameRedrawFor } from './infrared'
import { HttpError } from './net'
import { panSharpen } from './panSharpen'
import { panApiPath, parsePanSharpUrl } from './panUrl'
import { isRadarUrl } from './radar'
import { toneRadar } from './radarTone'

export interface Pixels {
  data: Uint8ClampedArray
  width: number
  height: number
}

/** The outcome of fetching an image for its pixels (an HTTP error is a value here, not a throw). */
export interface PixelFetch {
  status: number
  contentType: string
  /** Response text of a non-2xx answer (PC explains "outside dataset bounds" there) */
  body?: string
  /** Decoded pixels, for a 2xx image response */
  pixels?: Pixels
}

type Readback = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D
/** Read-back contexts by size, reused: a report reads ~40 tiny probes, and context creation dominated. */
const readbacks = /* @__PURE__ */ new Map<string, Readback | null>()

/**
 * A 2D context of `w`×`h` for reading pixels back: OffscreenCanvas when available (workers too). Shared per
 * size, in 'copy' mode, so each draw replaces the previous pixels (alpha included) without a clear.
 */
export function readbackContext(w: number, h: number): Readback | null {
  const key = `${w}x${h}`
  if (readbacks.has(key)) return readbacks.get(key)!
  let ctx: Readback | null = null
  if (typeof OffscreenCanvas !== 'undefined') ctx = new OffscreenCanvas(w, h).getContext('2d', { willReadFrequently: true })
  else if (typeof document !== 'undefined') {
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    ctx = c.getContext('2d', { willReadFrequently: true })
  }
  if (ctx) ctx.globalCompositeOperation = 'copy'
  if (readbacks.size > 16) readbacks.clear()
  readbacks.set(key, ctx)
  return ctx
}

/**
 * Decode an image blob to RGBA. With `size`, the decoder scales it (createImageBitmap resize) and only the
 * small bitmap is drawn for read-back. With `win` as well, only that rectangle of the image is read, drawn to
 * `size`×`size` (a plain drawImage of the source rectangle: every engine has it, where createImageBitmap's own crop
 * with options is uneven). Colour management and premultiplication are off, so class rasters (SCL) read back their
 * exact values.
 */
export async function decodeImagePixels(blob: Blob, size?: number, win?: TileWindow): Promise<Pixels> {
  const opts: ImageBitmapOptions = { colorSpaceConversion: 'none', premultiplyAlpha: 'none' }
  if (size && !win) Object.assign(opts, { resizeWidth: size, resizeHeight: size, resizeQuality: 'low' })
  const bmp = await createImageBitmap(blob, opts)
  try {
    const width = win && size ? size : bmp.width
    const height = win && size ? size : bmp.height
    const ctx = readbackContext(width, height)
    if (!ctx) throw new Error('2D canvas unavailable')
    if (win && size) ctx.drawImage(bmp, win.x, win.y, win.w, win.h, 0, 0, size, size)
    else ctx.drawImage(bmp, 0, 0)
    return { data: ctx.getImageData(0, 0, width, height).data, width, height }
  } finally {
    bmp.close()
  }
}

/** Side of the read-back of a probe tile's window: what the WMS probe rendered. */
export const WINDOW_PX = 24

/**
 * Fetch `url` and decode it to pixels in this thread (the worker's job, and the fallback without one). A probe
 * tile's URL names the window to read (./gibsTiles.ts): only that comes back, at `WINDOW_PX`.
 */
export async function fetchPixelsHere(url: string, signal?: AbortSignal): Promise<PixelFetch> {
  const win = tileWindowOf(url)
  const res = await fetch(win ? url.slice(0, url.indexOf('#')) : url, { signal })
  const contentType = res.headers.get('content-type') ?? ''
  if (!res.ok) return { status: res.status, contentType, body: await res.text().catch(() => undefined) }
  // WMS reports errors as 200 + XML: no pixels then.
  if (!contentType.startsWith('image/')) return { status: res.status, contentType }
  const blob = await res.blob()
  return { status: res.status, contentType, pixels: await (win ? decodeImagePixels(blob, WINDOW_PX, win) : decodeImagePixels(blob)) }
}

/** Pixel counts as no-data when it's transparent or every channel is within JPEG noise of 0. */
const NO_DATA_MAX_CHANNEL = 6
const NO_DATA_MIN_ALPHA = 16

/** Measure no-data (transparent or near-black pixels) in RGBA pixels. */
export function measureNoData(rgba: Uint8ClampedArray | Uint8Array): { noDataFraction: number; meanLuma: number } {
  const n = rgba.length >> 2
  if (n === 0) return { noDataFraction: 1, meanLuma: 0 }
  let empty = 0
  let luma = 0
  for (let i = 0; i < rgba.length; i += 4) {
    const r = rgba[i]
    const g = rgba[i + 1]
    const b = rgba[i + 2]
    const a = rgba[i + 3]
    if (a < NO_DATA_MIN_ALPHA || (r <= NO_DATA_MAX_CHANNEL && g <= NO_DATA_MAX_CHANNEL && b <= NO_DATA_MAX_CHANNEL)) empty++
    else luma += 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  const full = n - empty
  return { noDataFraction: empty / n, meanLuma: full ? luma / full : 0 }
}

/** Side of the decode the no-data check reads: averaging keeps it honest, 32² keeps it cheap. */
export const CHECK_PX = 32

/** An image fetched for display, with its no-data share measured (a non-2xx or non-image answer has no blob). */
export interface CheckedImage {
  status: number
  contentType: string
  /** The image bytes (2xx image responses) */
  blob?: Blob
  /** 0..1 share of no-data pixels, or undefined if they couldn't be read (the picture is trusted then) */
  noData?: number
}

/** Fetch `url` for display and measure its no-data share in this thread (the worker's job, and the fallback). */
export async function fetchCheckedImageHere(url: string, signal?: AbortSignal): Promise<CheckedImage> {
  const res = await fetch(url, { signal })
  const contentType = res.headers.get('content-type') ?? ''
  if (!res.ok || !contentType.startsWith('image/')) {
    await res.body?.cancel().catch(() => undefined)
    return { status: res.status, contentType }
  }
  // Two NASA layers are redrawn before anything shows them (./infrared.ts): the colour-coded infrared on one grey
  // scale, Himawari's linear visible band on a square-root curve.
  const redraw = frameRedrawFor(url)
  const blob = redraw ? await redrawnBlob(await res.blob(), redraw) : await res.blob()
  let noData: number | undefined
  try {
    noData = measureNoData((await decodeImagePixels(blob, CHECK_PX)).data).noDataFraction
  } catch {
    noData = undefined // no decoder or 2D context here: trust the picture
  }
  return { status: res.status, contentType, blob, noData }
}

// ── Cloud masks and toned photos (Sentinel-2 / Landsat) ───────────────────────────────────────

/** The outcome of fetching a cloud mask (an HTTP error is a value here, not a throw). */
export interface MaskFetch {
  status: number
  body?: string
  mask?: ToneMask
}

/**
 * Masks by URL, shared by the spot check and the photos' curve (one request each per session). One URL per capture and
 * rounded place whatever the crop's size or geometry (toneRender maskUrl, always lon/lat), so a crop finds its
 * capture's mask by `TonePlan.maskUrl` alone.
 */
const masks = /* @__PURE__ */ new Map<string, Promise<MaskFetch>>()
const MASKS_MAX = 96

/**
 * An answer worth asking again: the archive's server trouble (5xx, e.g. PC's 504 "upstream request timeout" on a cold
 * scene), a timeout or rate limit. Any other status (a 404 off the scene) is the archive's final word.
 */
export const isTransientStatus = (status: number) => status >= 500 || status === 408 || status === 429

/**
 * Fetch and parse a cloud mask (tone.ts maskUrl), once per session. Rejects on network failure; neither that nor a
 * transient HTTP answer is kept, so the spot check's retry and later callers ask again.
 */
export function fetchMaskHere(url: string): Promise<MaskFetch> {
  let p = masks.get(url)
  if (!p) {
    const req = (async (): Promise<MaskFetch> => {
      const res = await fetch(url)
      if (!res.ok) return { status: res.status, body: await res.text().catch(() => undefined) }
      return { status: res.status, mask: maskFromResponse(url, await res.arrayBuffer()) }
    })()
    p = req
    const forget = () => {
      if (masks.get(url) === req) masks.delete(url)
    }
    req.then((r) => {
      if (isTransientStatus(r.status)) forget()
    }, forget)
    masks.set(url, req)
    if (masks.size > MASKS_MAX) masks.delete(masks.keys().next().value as string)
  }
  return p
}

/** A photo's mask for its curve: whatever the archive answers within `ms`, else none (the curve then uses every pixel). */
function maskWithin(p: Promise<MaskFetch>, ms: number): Promise<ToneMask | null> {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(null), ms)
    p.then(
      (r) => {
        clearTimeout(t)
        resolve(r.mask ?? null)
      },
      () => {
        clearTimeout(t)
        resolve(null)
      },
    )
  })
}

/**
 * One macrotask: the tone step pauses here every ~12 ms, so the worker answers other requests mid-photo (a message
 * channel, not setTimeout: nested timers are clamped to 4 ms).
 */
function pause(): Promise<void> {
  if (typeof MessageChannel === 'undefined') return new Promise((r) => setTimeout(r, 0))
  return new Promise((resolve) => {
    const ch = new MessageChannel()
    ch.port1.onmessage = () => {
      ch.port1.close()
      resolve()
    }
    ch.port2.postMessage(0)
  })
}

/** Curves by capture and place (tone.ts TonePlan.key), measured on the first crop close to native resolution. */
const curves = /* @__PURE__ */ new Map<string, ToneParams>()
/**
 * The curve each capture's photo (the PHOTO_PX crop) was toned with at a place, shared or not (a photo toned before its
 * mask arrived measures its own): what a magnified view of that photo (tone.ts isMagnifiedView) must match.
 */
const shown = /* @__PURE__ */ new Map<string, ToneParams>()
/** The curve a crop must use, if any: a magnified view the photo's own, any other the shared one. */
const knownCurve = (plan: TonePlan) => (isMagnifiedView(plan) ? (shown.get(plan.key) ?? curves.get(plan.key)) : curves.get(plan.key))
const CURVES_MAX = 128
const MASK_WAIT_MS = 8_000
const JPEG_QUALITY = 0.92

/** The curve a capture's photos share at a place, once one has been measured (tests, diagnostics). */
export const sharedCurve = (key: string): ToneParams | undefined => curves.get(key)

type Canvas2D = { canvas: OffscreenCanvas | HTMLCanvasElement; ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D }

function canvas2d(w: number, h: number): Canvas2D | null {
  if (typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(w, h)
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    return ctx ? { canvas, ctx } : null
  }
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  return ctx ? { canvas, ctx } : null
}

function encode(c: Canvas2D, type: string): Promise<Blob> {
  if ('convertToBlob' in c.canvas) return c.canvas.convertToBlob({ type, quality: JPEG_QUALITY })
  const el = c.canvas as HTMLCanvasElement
  return new Promise((resolve, reject) => el.toBlob((b) => (b ? resolve(b) : reject(new Error('encode failed'))), type, JPEG_QUALITY))
}

/** A weather frame redrawn (./infrared.ts) and encoded again. Rejects where no canvas can do it. */
async function redrawnBlob(src: Blob, redraw: (rgba: Uint8ClampedArray) => void): Promise<Blob> {
  const bmp = await createImageBitmap(src, { colorSpaceConversion: 'none', premultiplyAlpha: 'none' })
  const { width, height } = bmp
  const c = canvas2d(width, height)
  if (!c) {
    bmp.close()
    throw new Error('2D canvas unavailable')
  }
  c.ctx.drawImage(bmp, 0, 0)
  bmp.close()
  const img = c.ctx.getImageData(0, 0, width, height)
  redraw(img.data)
  c.ctx.putImageData(img, 0, 0)
  return encode(c, 'image/jpeg')
}

/**
 * Fetch a Sentinel-2 / Landsat crop (the encoded render) and tone it in this thread: the capture's shared curve, or a
 * new one measured with its mask (shared, ≤ 8 s); the curve + sharpening; then the bytes, as JPEG (`fmt` 'jpeg', for
 * display) or PNG (the lossless download). A URL that is not an encoded render is returned as fetched.
 *
 * Only a crop close to native resolution measured WITH its mask sets the shared curve (a curve measured without one
 * counts cloud in its white point: the next size measures again). A coarse crop (thumbnail, globe decal) never asks
 * for a mask of its own: it uses the shared curve when there is one, else measures its own with whatever mask is
 * already fetched or on its way (the spot check's). A magnified view (the lightbox's sharper layer) uses the curve its
 * photo was toned with.
 */
export async function fetchTonedHere(url: string, signal?: AbortSignal, fmt: 'jpeg' | 'png' = 'jpeg'): Promise<CheckedImage> {
  const plan = tonePlanForUrl(url)
  const shares = plan ? canShareCurve(plan) : false
  const pending = plan ? (shares ? fetchMaskHere(plan.maskUrl) : masks.get(plan.maskUrl)) : undefined
  pending?.catch(() => undefined)
  const res = await fetch(url, { signal })
  const contentType = res.headers.get('content-type') ?? ''
  if (!res.ok || !contentType.startsWith('image/')) {
    await res.body?.cancel().catch(() => undefined)
    return { status: res.status, contentType }
  }
  const src = await res.blob()
  if (!plan) return isRadarUrl(url) ? toneRadarBlob(src, res.status, fmt) : { status: res.status, contentType, blob: src }
  const bmp = await createImageBitmap(src, { colorSpaceConversion: 'none', premultiplyAlpha: 'none' })
  const { width, height } = bmp
  const c = canvas2d(width, height)
  if (!c) {
    bmp.close()
    throw new Error('2D canvas unavailable')
  }
  c.ctx.drawImage(bmp, 0, 0)
  bmp.close()
  const img = c.ctx.getImageData(0, 0, width, height)
  let known = knownCurve(plan)
  const mask = known || !pending ? null : await maskWithin(pending, MASK_WAIT_MS)
  known ??= knownCurve(plan) // measured by another size while this one waited for the mask
  const used = await toneCropAsync(img.data, width, height, plan, mask, known, pause)
  // The first curve measured with its mask wins: a size toned at the same time keeps what it showed, later ones reuse it.
  if (!known && shares && mask && !curves.has(plan.key)) {
    curves.set(plan.key, used)
    if (curves.size > CURVES_MAX) curves.delete(curves.keys().next().value as string)
  }
  // The curve of the card most recently toned for display (not a PNG download): a magnified view takes the curve
  // of the card on screen, even after that card was evicted and toned again with the shared curve.
  if (plan.px === PHOTO_PX && fmt !== 'png') {
    shown.delete(plan.key)
    shown.set(plan.key, used)
    if (shown.size > CURVES_MAX) shown.delete(shown.keys().next().value as string)
  }
  c.ctx.putImageData(img, 0, 0)
  const type = fmt === 'png' ? 'image/png' : 'image/jpeg'
  return { status: res.status, contentType: type, blob: await encode(c, type) }
}

/** A radar crop's encoded decibels, decoded, toned (radarTone.ts) and encoded again. An image with no data is a 404. */
async function toneRadarBlob(src: Blob, status: number, fmt: 'jpeg' | 'png'): Promise<CheckedImage> {
  const bmp = await createImageBitmap(src, { colorSpaceConversion: 'none', premultiplyAlpha: 'none' })
  const { width, height } = bmp
  const c = canvas2d(width, height)
  if (!c) {
    bmp.close()
    throw new Error('2D canvas unavailable')
  }
  c.ctx.drawImage(bmp, 0, 0)
  bmp.close()
  const img = c.ctx.getImageData(0, 0, width, height)
  if (!toneRadar(img.data, width, height)) return { status: 404, contentType: '' }
  c.ctx.putImageData(img, 0, 0)
  const type = fmt === 'png' ? 'image/png' : 'image/jpeg'
  return { status, contentType: type, blob: await encode(c, type) }
}

/**
 * The lightbox's sharper layer of a Landsat 8/9 photo (panUrl.ts): the card's own crop, toned exactly as the card was
 * (the curve it was shown with; measured with its mask if the card was never toned here), then pan-sharpened with the
 * same capture's 15 m band (api/pan; panSharpen.ts). Its crop is usually still in the HTTP cache from the card. Rejects
 * when the pan can't be had or is mostly no data: the caller falls back to the 30 m sharper layer.
 */
export async function fetchPanSharpHere(url: string, signal?: AbortSignal): Promise<CheckedImage> {
  const parsed = parsePanSharpUrl(url)
  const plan = parsed && tonePlanForUrl(parsed.cardUrl)
  const api = parsed && panApiPath(parsed.cardUrl, parsed.t)
  if (!parsed || !plan || !api) throw new Error('not a pan-sharpened layer')
  const origin = typeof location !== 'undefined' ? location.origin : ''
  // Both downloads at once; the mask only if no curve is known for this capture yet.
  const panP = fetch(origin + api, { signal })
  const colourP = fetch(parsed.cardUrl, { signal })
  panP.catch(() => undefined)
  colourP.catch(() => undefined)
  let known = shown.get(plan.key) ?? curves.get(plan.key)
  const pending = known ? undefined : fetchMaskHere(plan.maskUrl)
  pending?.catch(() => undefined)
  const colourRes = await colourP
  if (!colourRes.ok) {
    await colourRes.body?.cancel().catch(() => undefined)
    throw new HttpError(colourRes.status, parsed.cardUrl)
  }
  const bmp = await createImageBitmap(await colourRes.blob(), { colorSpaceConversion: 'none', premultiplyAlpha: 'none' })
  const { width, height } = bmp
  const c = canvas2d(width, height)
  if (!c) {
    bmp.close()
    throw new Error('2D canvas unavailable')
  }
  c.ctx.drawImage(bmp, 0, 0)
  bmp.close()
  const img = c.ctx.getImageData(0, 0, width, height)
  const mask = known || !pending ? null : await maskWithin(pending, MASK_WAIT_MS)
  known ??= shown.get(plan.key) ?? curves.get(plan.key)
  await toneCropAsync(img.data, width, height, plan, mask, known, pause)

  const panRes = await panP
  if (!panRes.ok || !(panRes.headers.get('content-type') ?? '').startsWith('image/')) {
    await panRes.body?.cancel().catch(() => undefined)
    throw new HttpError(panRes.status, api)
  }
  const pbmp = await createImageBitmap(await panRes.blob(), { colorSpaceConversion: 'none', premultiplyAlpha: 'none' })
  if (pbmp.width !== width || pbmp.height !== height) {
    pbmp.close()
    throw new Error('pan size')
  }
  const pc = canvas2d(width, height)
  if (!pc) {
    pbmp.close()
    throw new Error('2D canvas unavailable')
  }
  pc.ctx.drawImage(pbmp, 0, 0)
  pbmp.close()
  const covered = panSharpen(img.data, pc.ctx.getImageData(0, 0, width, height).data, width, height)
  if (covered < PAN_MIN_COVER) throw new Error('pan mostly no data')
  c.ctx.putImageData(img, 0, 0)
  return { status: 200, contentType: 'image/jpeg', blob: await encode(c, 'image/jpeg') }
}

/** A pan band covering less of the crop than this is not used (the 30 m layer is shown instead). */
const PAN_MIN_COVER = 0.9
