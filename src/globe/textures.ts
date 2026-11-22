/**
 * Progressive Earth textures.
 *
 *   1k set (day, night, clouds, data; ~0.2 MB) → first frame → globeReady
 *   → phones:   the 2k day + night maps, built together and swapped in ONE frame (one sharpening at most); their
 *               download starts when this module evaluates, on every page. That is the final set on phones (G-M1):
 *               never a 4k map; the cloud map stays 1k unless the camera rests zoomed in close enough for its texels
 *               to show (then one 2k cloud step); the elevation / ocean mask stays 1k.
 *   → desktops: day 4k first, then night / clouds / data 4k at landing idle; day 8k (capable desktops) once the first
 *               results have settled with no pass open
 *
 * The FIRST day step (on phones: the whole first batch) sets the zoom floor a regional view needs (decision 6), so it
 * is on the critical path of the first flight: it skips the idle wait, and on a deep link or share link (?q= / ?s=)
 * its download starts when this module evaluates (one request, one decode, handed to the upgrade through
 * decodedMap). A desktop deep link to a place that is in darkness right now adds the first NIGHT step to that
 * critical path (on the night side the floor is the coarser of the two maps: CameraDirector). Once the critical steps
 * are on the GPU, store.dayMapSharp turns true (once per page; at first light if the plan has none).
 *
 * Nothing is uploaded while anything choreographed is moving (decision 9, PERF-01). Fetch happens off the main
 * thread; the decode and the strip cuts (crop + flip) run in a worker (textureDecode.worker.ts; the main thread only
 * as a fallback). The UPLOAD waits for canUpload():
 *   boot        allowed: the curtain covers the globe;
 *   computing   once the place flight has been parked for 300 ms, or (desktops only) while it has barely started
 *               (eased progress < 0.04, the camera has hardly moved), so a sharper map lands before the flight's
 *               range matters and the flight carries the new floor (CameraDirector folds it into the landing);
 *               phones never upload during a flight;
 *   otherwise   no camera flight, ≥ 600 ms since arrival, ≥ 2 s into the phase;
 *   always      past store.motionBusyUntil (UI entrances; in computing, a hold left over from the previous phase's
 *               UI does not count), not in the first 10 s of a replay sweep nor while an acquisition sequence runs
 *               (armed, or < 2.5 s after its capture), not while a finger or pointer is down anywhere or a scroll is
 *               moving (a sheet drag, a gallery swipe, a pinch; 450 ms after the last), tab visible.
 * Uploads are sliced: the destination is allocated once (texStorage only), then strips (128 rows on phones, 256 on
 * desktops) are uploaded straight into it with texSubImage2D (no intermediate texture and no GL state queries), one
 * per frame, or several within a small time budget under the boot curtain and in computing's windows
 * (uploadBudgetMs; phones: up to 8 ms of upload work in any open frame, never more); mips are generated once after the last
 * strip, and only then is the finished texture swapped in (a batch's maps all in the same frame). The texture it
 * replaces is disposed a few frames later. Colour maps are sRGB; the cloud and data maps are data (no conversion).
 */
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useState } from 'react'
import {
  ClampToEdgeWrapping,
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  NoColorSpace,
  RepeatWrapping,
  RGBAFormat,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  UnsignedByteType,
  type WebGLRenderer,
} from 'three'
import { latLonToWorld, sunDirectionWorld } from '@/lib/geo'
import { bootPlace } from '@/lib/placePage'
import { useApp } from '@/state/store'
import { kmPerTexel, type TextureLevel } from './framing'
import { glx } from './debugGl'
import { detectMobile, provisionalTier, type QualityTier } from './quality'
import { FRAME, type GlobeRuntime } from './runtime'

export type EarthMap = 'day' | 'night' | 'clouds' | 'data'
export type EarthTextures = Record<EarthMap, Texture>

export type TextureStatus =
  | { state: 'loading' }
  | { state: 'ready'; textures: EarthTextures }
  | { state: 'error'; error: Error }

const BASE = '/textures/'
export const textureUrl = (map: EarthMap, res: TextureLevel) => `${BASE}earth-${map}-${res}.webp`
const SIZE: Record<TextureLevel, [number, number]> = { '1k': [1024, 512], '2k': [2048, 1024], '4k': [4096, 2048], '8k': [8192, 4096] }
/** Rows per uploaded strip: 2 MB per 2k strip on desktops; half that on phones (≤ 8 ms of upload work per frame). */
export const STRIP_ROWS = 256
export const STRIP_ROWS_MOBILE = 128
export const stripRowsFor = (tier: Pick<QualityTier, 'mobile'>) => (tier.mobile ? STRIP_ROWS_MOBILE : STRIP_ROWS)

/**
 * Whether the sliced (ImageBitmap-decoded) upload path is trusted on this user agent. WebKit before 17 and Firefox
 * before 98 are not. Every iOS browser is WebKit; in-app WKWebViews (Instagram, Facebook…) carry no Safari or
 * Version token, so iOS is recognised by device + AppleWebKit and versioned by its OS when Version/ is absent.
 */
export function bitmapsSupportedFor(ua: string, hasCreateImageBitmap: boolean): boolean {
  if (!hasCreateImageBitmap) return false
  const ios = /iPhone|iPad|iPod/.test(ua) && /AppleWebKit/.test(ua) && !/CriOS|FxiOS/.test(ua)
  const safari = ios || /^((?!chrome|android).)*safari/i.test(ua)
  const version = Number(ua.match(/Version\/(\d+)/)?.[1] ?? (ios ? (ua.match(/OS (\d+)_/)?.[1] ?? 0) : 0))
  const firefox = ua.includes('Firefox')
  const firefoxVersion = firefox ? Number(ua.match(/Firefox\/(\d+)/)?.[1] ?? 0) : -1
  return !((safari && version < 17) || (firefox && firefoxVersion < 98))
}

function bitmapsSupported(): boolean {
  if (typeof navigator === 'undefined') return false
  return bitmapsSupportedFor(navigator.userAgent, typeof createImageBitmap !== 'undefined')
}

function configure(tex: Texture, map: EarthMap, anisotropy: number) {
  tex.colorSpace = map === 'day' || map === 'night' ? SRGBColorSpace : NoColorSpace
  // Clouds drift in longitude, so they wrap horizontally; the others clamp to avoid a seam bleed at the poles.
  tex.wrapS = map === 'clouds' ? RepeatWrapping : ClampToEdgeWrapping
  tex.wrapT = ClampToEdgeWrapping
  tex.minFilter = LinearMipmapLinearFilter
  tex.magFilter = LinearFilter
  tex.generateMipmaps = true
  tex.anisotropy = map === 'data' ? 1 : anisotropy
}

/** Load one map as an image-backed texture (the 1k set, and the upgrade path for browsers without bitmaps). */
export function loadMap(map: EarthMap, res: TextureLevel, anisotropy: number, signal?: AbortSignal): Promise<Texture> {
  return new Promise<Texture>((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException('Aborted', 'AbortError'))
    // Image elements without a crossOrigin attribute (same-origin) reuse index.html's <link rel=preload>.
    const loader = new TextureLoader()
    loader.setCrossOrigin(undefined as unknown as string)
    loader.load(
      textureUrl(map, res),
      (tex) => {
        if (signal?.aborted) {
          tex.dispose()
          return reject(new DOMException('Aborted', 'AbortError'))
        }
        configure(tex, map, anisotropy)
        resolve(tex)
      },
      undefined,
      (e: unknown) => reject(e instanceof Error ? e : new Error(`Texture ${textureUrl(map, res)} failed to load`)),
    )
  })
}

/** Free GPU + decoded image memory. */
function disposeTexture(tex: Texture) {
  const img = tex.image as { close?: () => void } | undefined
  tex.dispose()
  img?.close?.()
}

const MAPS: EarthMap[] = ['day', 'night', 'clouds', 'data']

/**
 * When a step may start:
 *  idle    — at once (the upload itself still waits for canUpload, i.e. landing idle)
 *  place   — after the camera has first arrived at a place or pass (regional views need it, the landing doesn't)
 *  results — after the first results view has settled
 *  zoom    — once the camera has rested (CLOUD_ZOOM_REST_MS) close enough for the 1k cloud map's texels to show
 *            (phones' clouds)
 */
export type StepWhen = 'idle' | 'place' | 'results' | 'zoom'
export interface UpgradeStep {
  map: EarthMap
  res: Exclude<TextureLevel, '1k'>
  when: StepWhen
  /** Steps sharing a batch are built together and swapped in on the same frame (one visible sharpening). */
  batch?: string
}

/**
 * Which maps get upgraded, in order, for a device tier (PERF-09, decision 9, G-M1).
 *  - Phones: the 2k day + night maps as ONE batch at landing idle (≈ 8 MB each on the GPU, display resolution for a
 *    ~330 px globe), and that is the final set: never a 4k map. Clouds go to 2k only when zoomed in; the elevation /
 *    ocean mask stays 1k.
 *  - Desktops: the 4k set at landing idle; the 8k day map only after the first results, never on the landing.
 */
export function upgradePlan(tier: QualityTier): UpgradeStep[] {
  if (tier.mobile) {
    return [
      { map: 'day', res: '2k', when: 'idle', batch: 'base' },
      { map: 'night', res: '2k', when: 'idle', batch: 'base' },
      { map: 'clouds', res: '2k', when: 'zoom' },
    ]
  }
  if (!tier.allow4k) {
    return [
      { map: 'day', res: '2k', when: 'idle' },
      { map: 'night', res: '2k', when: 'idle' },
      { map: 'clouds', res: '2k', when: 'idle' },
    ]
  }
  const plan: UpgradeStep[] = [
    { map: 'day', res: '4k', when: 'idle' },
    { map: 'night', res: '4k', when: 'idle' },
    { map: 'clouds', res: '4k', when: 'idle' },
    { map: 'data', res: '4k', when: 'idle' },
  ]
  if (tier.allow8k) plan.push({ map: 'day', res: '8k', when: 'results' })
  return plan
}

/** The plan as the swaps it makes: consecutive steps of one batch together, every other step alone. */
export function planBatches(plan: UpgradeStep[]): UpgradeStep[][] {
  const out: UpgradeStep[][] = []
  for (const st of plan) {
    const last = out.at(-1)
    if (last && st.batch && last[0].batch === st.batch) last.push(st)
    else out.push([st])
  }
  return out
}

/**
 * Phones' cloud step ('zoom'): the camera has settled so close that a 1k cloud texel (39 km) spans more than
 * CLOUD_ZOOM_TEXEL_PX CSS px (the regional view at the 2k floor shows it at ~5 px; only a closer pass view or a
 * zoom gets there), while the cloud layer still shows (above the altitude where it fades out for the close views:
 * Imagery uCloudFade).
 */
export const CLOUD_ZOOM_TEXEL_PX = 10
export const CLOUD_ZOOM_MIN_KM = 600
export const cloudZoomWanted = (kmPerPx: number, altitudeKm: number) =>
  altitudeKm > CLOUD_ZOOM_MIN_KM && kmPerTexel('1k') / Math.max(1e-6, kmPerPx) > CLOUD_ZOOM_TEXEL_PX
/**
 * ... and the view has RESTED there this long. Moves that are not flights pass through the window on their way
 * elsewhere: the acquisition's settle and the re-frame when the phone sheet rises at the capture swing the camera
 * from a ~400 km dive out to the regional range in ~0.6 s. Latching on such a frame cost phones the 458 KB cloud map
 * and a visible cloud re-sharpening after every replay (verifier, G-M1).
 */
export const CLOUD_ZOOM_REST_MS = 1500

/** A latch that turns true once `on` has held for `restMs` without a break (a view the camera rests on). */
export function restLatch(restMs: number): (on: boolean, now: number) => boolean {
  let since = -1
  let latched = false
  return (on, now) => {
    if (latched) return true
    if (!on) {
      since = -1
      return false
    }
    if (since < 0) since = now
    latched = now - since >= restMs
    return latched
  }
}

/** Number of strips a map of this level is uploaded in. */
export const stripCount = (res: TextureLevel, rows = STRIP_ROWS) => Math.max(1, Math.ceil(SIZE[res][1] / rows))

/** Uploads hold off for this long after a replay sweep starts (capped, so an endless replay can't starve them). */
export const REPLAY_QUIET_MS = 10_000
/** ... and while an acquisition sequence is armed, and this long after its capture (the settle, the last strokes). */
export const ACQ_QUIET_MS = 2500
/** ... and while a finger or pointer is down anywhere, and this long after the last pointer-up or scroll event. */
export const INPUT_QUIET_MS = 450

/**
 * Page-wide input activity (any element, not only the canvas): a sheet drag, a gallery swipe, a pinch, a scroll.
 * Uploads wait for it to settle. Installed once per page (trackInput).
 */
export const pageInput = { down: new Set<number>(), lastAt: -Infinity }

let inputTracked = false
export function trackInput() {
  if (inputTracked || typeof window === 'undefined') return
  inputTracked = true
  const opts = { capture: true, passive: true } as const
  const at = () => (pageInput.lastAt = performance.now())
  window.addEventListener('pointerdown', (e) => (pageInput.down.add(e.pointerId), at()), opts)
  // A finger still moving (a long sheet drag, a slow pan of the globe) keeps the gate shut: only a pointer that has
  // gone silent counts as lost (inputBusy's 8 s expiry), never one that is still dragging.
  window.addEventListener(
    'pointermove',
    (e) => {
      if (!pageInput.down.has(e.pointerId)) return
      // Moving with no button pressed: its pointer-up was lost (released outside the window), so it is no longer down.
      if (e.buttons === 0) pageInput.down.delete(e.pointerId)
      at()
    },
    opts,
  )
  const up = (e: PointerEvent) => (pageInput.down.delete(e.pointerId), at())
  window.addEventListener('pointerup', up, opts)
  window.addEventListener('pointercancel', up, opts)
  window.addEventListener('scroll', at, opts)
  window.addEventListener('wheel', at, opts)
}

/**
 * A finger or pointer is down, or a scroll moved, within the quiet window. A pointer that is down but has sent no
 * event (no move) for 8 s is taken as a lost pointer-up and expires.
 */
export function inputBusy(now: number): boolean {
  if (pageInput.down.size && now - pageInput.lastAt > 8000) pageInput.down.clear()
  return pageInput.down.size > 0 || now - pageInput.lastAt < INPUT_QUIET_MS
}

/** True when a GPU upload can't hitch anything the user is watching (see the header). */
export function canUpload(rt: GlobeRuntime, now: number): boolean {
  const st = useApp.getState()
  if (st.phase === 'computing') {
    // First part of an ease-in-out flight (the camera has barely moved): desktops only; phones never upload mid-flight.
    const early = !rt.tier.mobile && rt.camera.flying && rt.camera.progress < 0.04
    const parked = !rt.camera.flying && now - rt.camera.arrivedAt > 300
    if (!early && !parked) return false
  } else if (st.phase !== 'boot') {
    // boot: the curtain covers the globe
    if (rt.camera.flying || now - rt.camera.arrivedAt <= 600) return false
    if (now - rt.phaseEnteredAt <= 2000) return false
  }
  // In computing, a hold set before the phase began belongs to UI that has already gone (the landing's entrance).
  const inherited = st.phase === 'computing' && st.motionBusyUntil <= rt.phaseBusyFloor
  if (now <= st.motionBusyUntil && !inherited) return false
  if (st.timeMode === 'replay' && now - rt.replayStartedAt < REPLAY_QUIET_MS) return false
  if (rt.acq.armed || now - rt.acq.capturedAt < ACQ_QUIET_MS) return false
  if (st.phase !== 'boot' && inputBusy(now)) return false
  return typeof document === 'undefined' || !document.hidden
}

// ───────────────────────────── decode (off the main thread), memoised ─────────────────────────────

const BITMAP_OPTS: ImageBitmapOptions = { premultiplyAlpha: 'none', colorSpaceConversion: 'none' }

/**
 * One upload strip: RGBA bytes the strip owns (never an ImageBitmap: see textureDecode.worker.ts, the iPhone globe
 * bug). `close()` drops the reference (kept so callers release strips the same way whatever backs them).
 */
export interface TexStrip {
  width: number
  height: number
  data: Uint8Array | null
  close(): void
}

const makeStrip = (width: number, height: number, data: Uint8Array): TexStrip => {
  const s: TexStrip = {
    width,
    height,
    data,
    close: () => {
      s.data = null
    },
  }
  return s
}

/** Main-thread fallback of the worker's strip cut (same bytes, same flip). */
let fallbackSurface: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null
function stripBytesHere(img: ImageBitmap, y: number, rows: number, flip: boolean): Uint8Array {
  const w = img.width
  const c0 = fallbackSurface
  if (!c0 || c0.canvas.width !== w || c0.canvas.height !== rows) {
    const canvas: HTMLCanvasElement | OffscreenCanvas =
      typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(w, rows) : Object.assign(document.createElement('canvas'), { width: w, height: rows })
    fallbackSurface = canvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null
    if (!fallbackSurface) throw new Error('texture strip: no 2D context')
  }
  const c = fallbackSurface!
  c.imageSmoothingEnabled = false
  c.setTransform(1, 0, 0, 1, 0, 0)
  c.clearRect(0, 0, w, rows)
  if (flip) c.setTransform(1, 0, 0, -1, 0, rows)
  c.drawImage(img, 0, y, w, rows, 0, 0, w, rows)
  const px = c.getImageData(0, 0, w, rows).data
  return new Uint8Array(px.buffer, px.byteOffset, px.byteLength)
}

/** A decoded map, ready to be cut into upload strips. */
export interface DecodedMap {
  width: number
  height: number
  /** True when strips are cut in the worker (free for the main thread), false on the main-thread fallback. */
  offThread: boolean
  /** Source rows [y, y + rows), flipped vertically unless `flip` is false (Earth maps: GL rows run south → north). */
  strip(y: number, rows: number, flip?: boolean): Promise<TexStrip>
  close(): void
}

type WorkerReply =
  | { op: 'decoded'; req: number; width: number; height: number; strips: boolean }
  | { op: 'strip'; req: number; width: number; height: number; data: Uint8Array }
  | { op: 'error'; req: number; message: string; unavailable?: boolean }

class WorkerGone extends Error {
  constructor() {
    super('texture decode worker unavailable')
  }
}

/** The decode worker: undefined until first asked for, null when unavailable (then decoding falls back to here). */
let decodeWorker: Worker | null | undefined
const replies = new Map<number, { resolve: (m: WorkerReply) => void; reject: (e: Error) => void }>()
let nextReq = 1
let nextImage = 1
/** False once the worker has said it can't cut strips: later maps decode on this thread straight away. */
let workerStrips = true

function worker(): Worker | null {
  if (decodeWorker !== undefined) return decodeWorker
  try {
    const w = new Worker(new URL('./textureDecode.worker.ts', import.meta.url), { type: 'module', name: 'textures' })
    w.onmessage = (ev: MessageEvent<WorkerReply>) => {
      const m = ev.data
      const r = replies.get(m.req)
      if (!r) return // an unclaimed strip's bytes are simply dropped
      replies.delete(m.req)
      // A worker that can't cut strips (no OffscreenCanvas 2D) is "gone" for that job: the caller falls back here.
      if (m.op === 'error') r.reject(m.unavailable ? new WorkerGone() : new Error(m.message))
      else r.resolve(m)
    }
    // The module failed to load or crashed: everything in flight (and everything after) decodes on this thread.
    w.onerror = (ev) => {
      ev.preventDefault?.()
      decodeWorker = null
      w.terminate()
      const lost = [...replies.values()]
      replies.clear()
      for (const r of lost) r.reject(new WorkerGone())
    }
    decodeWorker = w
  } catch {
    decodeWorker = null
  }
  return decodeWorker
}

function ask(w: Worker, msg: Record<string, unknown>): Promise<WorkerReply> {
  const req = nextReq++
  return new Promise((resolve, reject) => {
    replies.set(req, { resolve, reject })
    w.postMessage({ ...msg, req })
  })
}

/** Decode a map file: in the worker when there is one, else here (createImageBitmap, strips cut lazily). */
async function decodeBlob(blob: Blob): Promise<DecodedMap> {
  const w = workerStrips ? worker() : null
  if (w) {
    try {
      const id = nextImage++
      const r = await ask(w, { op: 'decode', id, blob })
      if (r.op !== 'decoded') throw new Error('texture decode: unexpected reply')
      if (!r.strips) {
        // That worker has no 2D surface to cut strips with (WebKit before 16.4): every map decodes here.
        workerStrips = false
        throw new WorkerGone()
      }
      // If the worker goes away (or turns out unable to cut) mid-map, the rest of the strips are cut here.
      let local: Promise<ImageBitmap> | null = null
      const here = () => (local ??= createImageBitmap(blob, BITMAP_OPTS))
      return {
        width: r.width,
        height: r.height,
        offThread: true,
        strip: async (y, rows, flip = true) => {
          const live = decodeWorker
          try {
            if (!live || local) throw new WorkerGone()
            const m = await ask(live, { op: 'strip', id, y, rows, flip })
            if (m.op !== 'strip') throw new Error('texture strip: unexpected reply')
            return makeStrip(m.width, m.height, m.data)
          } catch (e) {
            if (!(e instanceof WorkerGone)) throw e
            const full = await here()
            return makeStrip(full.width, rows, stripBytesHere(full, y, rows, flip))
          }
        },
        close: () => {
          decodeWorker?.postMessage({ op: 'close', id })
          local?.then((b) => b.close(), () => undefined)
        },
      }
    } catch (e) {
      if (!(e instanceof WorkerGone)) throw e
    }
  }
  const full = await createImageBitmap(blob, BITMAP_OPTS)
  return {
    width: full.width,
    height: full.height,
    offThread: false,
    strip: async (y, rows, flip = true) => makeStrip(full.width, rows, stripBytesHere(full, y, rows, flip)),
    close: () => full.close(),
  }
}

async function fetchDecode(url: string, signal?: AbortSignal): Promise<DecodedMap> {
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`Texture ${url}: HTTP ${res.status}`)
  return decodeBlob(await res.blob())
}

/** An archive whose pictures are asked for once and never again, whatever the answer (CLAUDE.md: EUMETSAT's map service). */
export const askedOnce = (url: string) => url.startsWith('https://view.eumetsat.int/')

/**
 * Fetch (CORS) and decode any image for the GPU, off the main thread (Imagery's regional patches: globe-only URLs,
 * one request each per session). One retry after a short pause, as the panel's image loader does, and like it never
 * for a Meteosat picture (imagery/image.ts preloadImage): a failed one stays failed.
 */
export async function decodeImageUrl(url: string, signal?: AbortSignal): Promise<DecodedMap> {
  try {
    return await fetchDecode(url, signal)
  } catch (e) {
    if (signal?.aborted || askedOnce(url)) throw e
    await new Promise((r) => setTimeout(r, 700 + Math.random() * 500))
    return fetchDecode(url, signal)
  }
}

/** Decode image bytes fetched elsewhere (a Sentinel-2 / Landsat decal toned by the imagery module), off the main thread. */
export function decodeImageBlob(blob: Blob): Promise<DecodedMap> {
  return decodeBlob(blob)
}

/** Maps whose download + decode started early (a deep link; every phone page), by URL. Each is handed over once. */
const decoded = new Map<string, Promise<DecodedMap>>()

/** Start the download + decode of a map now (idempotent); the upgrade picks it up instead of fetching again. */
export function prefetchMap(map: EarthMap, res: Exclude<TextureLevel, '1k'>): void {
  const url = textureUrl(map, res)
  if (decoded.has(url)) return
  const p = fetchDecode(url)
  p.catch(() => undefined) // a failed prefetch is retried by whoever takes it
  decoded.set(url, p)
}

/** The decoded map: the prefetched one when there is one (taken, so it is never reused), else a fresh load. */
function decodedMap(map: EarthMap, res: TextureLevel, signal: AbortSignal): Promise<DecodedMap> {
  const url = textureUrl(map, res)
  const p = decoded.get(url)
  if (!p) return fetchDecode(url, signal)
  decoded.delete(url)
  return p.catch(() => fetchDecode(url, signal))
}

/** Release prefetched maps the real tier's plan has no use for (the provisional tier guessed differently). */
function dropUnplanned(plan: UpgradeStep[]) {
  const keep = new Set(plan.map((st) => textureUrl(st.map, st.res)))
  for (const [url, p] of decoded) {
    if (keep.has(url)) continue
    decoded.delete(url)
    p.then((d) => d.close(), () => undefined)
  }
}

/** The step that sharpens the day map first (the regional zoom floor), if the plan has one. */
export const firstDayStep = (plan: UpgradeStep[]) => plan.find((st) => st.map === 'day')

/** A deep link's place (`?q=lat,lon`), when the URL names one. */
export function deepLinkPlace(search: string): { lat: number; lon: number } | undefined {
  const q = new URLSearchParams(search).get('q')
  const m = q?.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/)
  if (!m) return undefined
  const lat = Number(m[1])
  const lon = Number(m[2])
  return Math.abs(lat) <= 90 && Math.abs(lon) <= 180 ? { lat, lon } : undefined
}

/** On the night side at `t`, by the camera's own rule (CameraDirector: the floor follows the night map there). */
export function inDarkAt(place: { lat: number; lon: number }, t: number): boolean {
  return latLonToWorld(place.lat, place.lon, 1).dot(sunDirectionWorld(t)) <= 0.1
}

/**
 * The steps the first regional view waits on (the zoom floor): the first day step, and on a deep link to a place
 * that is in darkness right now, the first night step too (there the floor is the coarser of the two maps), plus
 * every step batched with those (phones: the 2k day + night pair, always). They skip the idle wait, cut every strip
 * up front, and store.dayMapSharp turns true once they have all landed.
 */
export function criticalSteps(plan: UpgradeStep[], dark: boolean): UpgradeStep[] {
  const day = firstDayStep(plan)
  const night = dark ? plan.find((st) => st.map === 'night') : undefined
  const core = [day, night].filter((st): st is UpgradeStep => !!st)
  const batches = new Set(core.map((st) => st.batch).filter(Boolean))
  return plan.filter((st) => core.includes(st) || (!!st.batch && batches.has(st.batch)))
}

// A place page (/place/<slug>) opens on its place exactly as a `?q=` link does.
const PAGE_PLACE = typeof location !== 'undefined' ? bootPlace() : undefined
const DEEP_LINK = typeof location !== 'undefined' ? (deepLinkPlace(location.search) ?? PAGE_PLACE) : undefined
const DEEP_DARK = !!DEEP_LINK && inDarkAt(DEEP_LINK, Date.now())

// A deep link or share link goes from boot straight to a regional view: fetch the maps it needs now, while the boot
// runs (the provisional tier: the GL context does not exist yet; dropUnplanned undoes a wrong guess). Phones always
// do: their whole upgrade is this one batch, and the earlier it lands the likelier it lands under the boot curtain.
if (typeof location !== 'undefined' && bitmapsSupported()) {
  const mobile = detectMobile()
  const linked = /[?&](q|s)=/.test(location.search) || /^\/s\//.test(location.pathname) || !!PAGE_PLACE
  if (mobile || linked) for (const st of criticalSteps(upgradePlan(provisionalTier(mobile)), DEEP_DARK)) prefetchMap(st.map, st.res)
}

// ───────────────────────────── upload ─────────────────────────────

/**
 * Upload one strip straight into the destination texture (bound through three's state cache, unpack state set
 * through it too, so three's own later uploads see what is really set). The strip's bytes were cut already flipped
 * where needed (GL rows run south → north) and are copied by the call itself, so the strip may be dropped at once.
 * The last strip generates the mip chain.
 */
export function uploadStrip(gl: WebGLRenderer, dst: Texture, strip: TexStrip, y: number, last: boolean) {
  if (!strip.data) throw new Error('texture strip already released')
  const g = gl.getContext() as WebGL2RenderingContext
  const props = gl.properties.get(dst) as { __webglTexture?: WebGLTexture }
  if (!props.__webglTexture) gl.initTexture(dst)
  const tex = (gl.properties.get(dst) as { __webglTexture: WebGLTexture }).__webglTexture
  const state = gl.state
  state.activeTexture(g.TEXTURE0)
  state.bindTexture(g.TEXTURE_2D, tex)
  state.pixelStorei(g.UNPACK_FLIP_Y_WEBGL, false)
  state.pixelStorei(g.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
  state.pixelStorei(g.UNPACK_ALIGNMENT, 4)
  state.pixelStorei(g.UNPACK_ROW_LENGTH, 0)
  state.pixelStorei(g.UNPACK_SKIP_PIXELS, 0)
  state.pixelStorei(g.UNPACK_SKIP_ROWS, 0)
  g.texSubImage2D(g.TEXTURE_2D, 0, 0, y, strip.width, strip.height, g.RGBA, g.UNSIGNED_BYTE, strip.data)
  if (last) g.generateMipmap(g.TEXTURE_2D)
  if (import.meta.env.DEV) {
    const err = g.getError()
    if (err !== g.NO_ERROR) console.error(`[globe] texture strip upload at row ${y}: GL error 0x${err.toString(16)}`)
  }
}

const idle = (fn: () => void, timeout = 4000): (() => void) => {
  const w = window as Window & {
    requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number
    cancelIdleCallback?: (id: number) => void
  }
  if (w.requestIdleCallback) {
    const id = w.requestIdleCallback(fn, { timeout })
    return () => w.cancelIdleCallback?.(id)
  }
  const id = window.setTimeout(fn, 200)
  return () => window.clearTimeout(id)
}

/**
 * Time budget (ms) for upload jobs in one frame: on desktops normally one job per frame (0 = just the first); while
 * the boot curtain covers the globe, or in computing's windows (the camera has barely moved, or is parked), a frame
 * may take several, so the critical maps land even on a slow device. Phones spend up to 8 ms of upload work in any
 * frame the gate allows, never more (G-M1): a further job runs only if the last one's cost still fits.
 */
export const MOBILE_FRAME_UPLOAD_MS = 8
export function uploadBudgetMs(phase: string, mobile = false): number {
  // Phones' strips are small (128 rows): the 8 ms budget everywhere lands the 2k pair in a few frames.
  if (mobile) return MOBILE_FRAME_UPLOAD_MS
  return phase === 'boot' ? 24 : phase === 'computing' ? 12 : 0
}

/**
 * Frame-synchronous scheduler: conditions are checked once per frame, and upload jobs run only while the upload
 * gate is open: the first queued job, then more while the frame's budget lasts (the next job is assumed to cost
 * what the last one did, so a frame never knowingly overruns its budget).
 */
export function createScheduler() {
  const waits: { pred: () => boolean; resolve: () => void }[] = []
  const jobs: { fn: () => void; resolve: () => void; reject: (e: unknown) => void }[] = []
  return {
    waitUntil(pred: () => boolean): Promise<void> {
      return new Promise((resolve) => waits.push({ pred, resolve }))
    },
    upload(fn: () => void): Promise<void> {
      return new Promise((resolve, reject) => jobs.push({ fn, resolve, reject }))
    },
    tick(gateOpen: boolean, budgetMs = 0) {
      for (let i = waits.length - 1; i >= 0; i--) {
        if (waits[i].pred()) waits.splice(i, 1)[0].resolve()
      }
      if (!gateOpen) return
      const t0 = performance.now()
      let last = 0
      while (jobs.length) {
        const j = jobs.shift()!
        const tj = performance.now()
        try {
          j.fn()
          j.resolve()
        } catch (e) {
          j.reject(e)
        }
        const end = performance.now()
        last = end - tj
        if (end - t0 + last > budgetMs) break
      }
    },
    get queued() {
      return jobs.length
    },
    clear() {
      waits.length = 0
      jobs.length = 0
    },
  }
}

/**
 * React binding (inside the Canvas). Returns the current texture set. Upgrades mutate it in place (same object,
 * a new Texture per key); materials re-bind by identity in their frame callback, so a replaced texture is never
 * referenced by the time it is disposed (three frames later). Writes rt.textureLevel / rt.nightLevel when the day
 * or night map changes.
 */
export function useEarthTextures(gl: WebGLRenderer, rt: GlobeRuntime, onFirstReady?: () => void): TextureStatus {
  const [status, setStatus] = useState<TextureStatus>({ state: 'loading' })
  const sched = useMemo(createScheduler, [])

  // Poll conditions and run upload slices (one per frame, more only where the budget allows), before the scene renders.
  useFrame(() => sched.tick(canUpload(rt, performance.now()), uploadBudgetMs(useApp.getState().phase, rt.tier.mobile)), FRAME.clock)

  useEffect(() => {
    trackInput()
    const ctl = new AbortController()
    const tier = rt.tier
    let cancelIdle: (() => void) | undefined
    let current: EarthTextures | undefined
    const pending = new Set<{ close?: () => void }>()

    const loadFirst = async (attempt: number): Promise<EarthTextures> => {
      try {
        const list = await Promise.all(MAPS.map((m) => loadMap(m, '1k', tier.maxAnisotropy, ctl.signal)))
        return { day: list[0], night: list[1], clouds: list[2], data: list[3] }
      } catch (e) {
        if (ctl.signal.aborted || attempt >= 2) throw e
        await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)))
        return loadFirst(attempt + 1)
      }
    }

    // Step conditions, from what the camera last settled on (CameraDirector records the arrived intent's kind,
    // so this holds however late the scheduler polls: a deep link's place arrival can happen while an earlier
    // step is still uploading). All are latches: once seen, the step may start.
    let placeSeen = false
    let resultsSeen = false
    let zoomSeen = false
    const settledAtPlace = (now: number) =>
      !rt.camera.flying &&
      (rt.camera.arrivedKind === 'place' || rt.camera.arrivedKind === 'pass') &&
      now - rt.camera.arrivedAt > 600
    // Zoomed in with the cloud layer still showing, outside flights and acquisition sequences, and RESTING there
    // (CLOUD_ZOOM_REST_MS without a break: a settle or re-frame passing through does not count): phones' cloud step.
    const zoomRest = restLatch(CLOUD_ZOOM_REST_MS)
    const settledZoomedIn = (now: number) =>
      zoomRest(
        !rt.camera.flying && !rt.acq.armed && now - rt.camera.arrivedAt > 600 && cloudZoomWanted(rt.camera.kmPerPx, rt.camera.altitudeKm),
        now,
      )
    const ready = (when: StepWhen) => () => {
      const now = performance.now()
      if (!placeSeen && settledAtPlace(now)) placeSeen = true
      if (!resultsSeen && useApp.getState().phase === 'results' && now - rt.phaseEnteredAt > 600 && settledAtPlace(now)) resultsSeen = true
      if (!zoomSeen && when === 'zoom' && settledZoomedIn(now)) zoomSeen = true
      // The big step (8k day) never starts while a pass is open: it waits for the user to come back to the list.
      return (
        when === 'idle' ||
        (when === 'place' && placeSeen) ||
        (when === 'zoom' && zoomSeen) ||
        (when === 'results' && resultsSeen && !useApp.getState().selectedPassId)
      )
    }

    const rowsPerStrip = stripRowsFor(tier)
    /**
     * Fetch + decode off-thread (or take the prefetch), then upload strip by strip; resolves with the finished
     * texture. `eager` (the critical steps): every strip is cut up front (in the worker), so a frame with upload
     * budget can take several; otherwise each strip is cut just before its upload (less memory).
     */
    const buildSliced = async (step: UpgradeStep, eager: boolean): Promise<Texture> => {
      const full = await decodedMap(step.map, step.res, ctl.signal)
      if (ctl.signal.aborted) {
        full.close()
        throw new DOMException('Aborted', 'AbortError')
      }
      pending.add(full)
      const W = full.width
      const H = full.height
      const dst = new DataTexture(null, W, H, RGBAFormat, UnsignedByteType)
      configure(dst, step.map, tier.maxAnisotropy)
      dst.flipY = false
      dst.unpackAlignment = 4
      // Allocate storage (all mip levels) without uploading or generating anything yet.
      dst.mipmapsAutoUpdate = false
      dst.source.dataReady = false
      dst.needsUpdate = true
      const n = Math.ceil(H / rowsPerStrip)
      // GL rows [y, y + rows) count from the bottom (south) up; image rows run north → south, so they are image
      // rows [H − y − rows, H − y), flipped.
      const cut = async (i: number) => {
        const y = i * rowsPerStrip
        const rows = Math.min(rowsPerStrip, H - y)
        const strip = await full.strip(H - y - rows, rows)
        pending.add(strip)
        return strip
      }
      const done = (strip: TexStrip) => {
        pending.delete(strip)
        strip.close()
      }
      const abortIfNeeded = () => {
        if (ctl.signal.aborted) throw new DOMException('Aborted', 'AbortError')
      }
      try {
        // Cutting up front only pays where it is free for this thread (the worker); the fallback cuts one at a time.
        if (eager && full.offThread) {
          const cuts = await Promise.allSettled(Array.from({ length: n }, (_, i) => cut(i)))
          const strips = cuts.flatMap((c) => (c.status === 'fulfilled' ? [c.value] : []))
          pending.delete(full)
          full.close() // the strips hold the pixels now
          if (strips.length < n) {
            strips.forEach(done)
            throw new Error(`Texture ${textureUrl(step.map, step.res)}: strip decode failed`)
          }
          abortIfNeeded()
          // The first job allocates the storage (uploadStrip inits the texture), the last generates the mips.
          await Promise.all(
            strips.map((strip, i) => sched.upload(() => uploadStrip(gl, dst, strip, i * rowsPerStrip, i === n - 1)).finally(() => done(strip))),
          )
        } else {
          await sched.upload(() => gl.initTexture(dst))
          for (let i = 0; i < n; i++) {
            abortIfNeeded()
            const strip = await cut(i)
            try {
              await sched.upload(() => uploadStrip(gl, dst, strip, i * rowsPerStrip, i === n - 1))
            } finally {
              done(strip)
            }
          }
        }
      } catch (e) {
        dst.dispose()
        throw e
      } finally {
        pending.delete(full)
        full.close()
      }
      dst.source.dataReady = true
      return dst
    }

    /** Old browsers without reliable ImageBitmap: one image texture, uploaded in a single (gated) call. */
    const buildWhole = async (step: UpgradeStep): Promise<Texture> => {
      const tex = await loadMap(step.map, step.res, tier.maxAnisotropy, ctl.signal)
      await sched.upload(() => gl.initTexture(tex))
      return tex
    }

    const plan = glx('noupgrade') ? [] : upgradePlan(tier)
    const critical = criticalSteps(plan, DEEP_DARK)
    /** store.dayMapSharp: once per page, when the maps the first regional view needs are sharper than the boot level. */
    const markSharp = () => {
      const st = useApp.getState()
      if (!st.dayMapSharp) st.setDayMapSharp(true)
    }
    const waiting = new Set(critical)
    const landed = (step: UpgradeStep) => {
      if (waiting.delete(step) && waiting.size === 0) markSharp()
    }

    const upgrade = async () => {
      const bitmaps = bitmapsSupported() && !glx('whole')
      dropUnplanned(plan)
      for (const batch of planBatches(plan)) {
        if (ctl.signal.aborted || !current) return
        await sched.waitUntil(ready(batch[0].when))
        // Start fetching in an idle slot (the upload is gated separately), except the critical steps: the first
        // regional view waits on them.
        const isCritical = batch.some((st) => critical.includes(st))
        if (!isCritical) {
          await new Promise<void>((r) => {
            cancelIdle = idle(r)
          })
        }
        // A batch's maps build side by side (their strips interleave in the upload queue) and swap in together.
        const built = await Promise.allSettled(batch.map((st) => (bitmaps ? buildSliced(st, isCritical) : buildWhole(st))))
        if (ctl.signal.aborted || !current) {
          for (const b of built) if (b.status === 'fulfilled') disposeTexture(b.value)
          return
        }
        const swapped: string[] = []
        const retired: Texture[] = []
        batch.forEach((step, i) => {
          const b = built[i]
          // A failed map keeps its lower resolution (nothing else depends on it) and never holds the first view.
          if (b.status === 'fulfilled') {
            retired.push(current![step.map])
            current![step.map] = b.value
            if (step.map === 'day') rt.textureLevel = step.res
            if (step.map === 'night') rt.nightLevel = step.res
            swapped.push(`${step.map}-${step.res}`)
          }
          landed(step)
        })
        if (swapped.length) gl.domElement.dataset.textures = swapped.join('+')
        // Materials re-bind on their next frame (all of a batch on the same one); dispose once a few frames have
        // rendered without the old maps.
        if (retired.length) afterFrames(3, () => retired.forEach(disposeTexture))
      }
    }

    loadFirst(0).then(
      (tex) => {
        current = tex
        for (const t of MAPS) gl.initTexture(tex[t])
        rt.textureLevel = '1k'
        rt.nightLevel = '1k'
        setStatus({ state: 'ready', textures: tex })
        gl.domElement.dataset.textures = '1k'
        if (!critical.length) markSharp() // nothing sharper will come: first light is as sharp as it gets
        onFirstReady?.()
        void upgrade()
      },
      (err: unknown) => {
        if (ctl.signal.aborted) return
        setStatus({ state: 'error', error: err instanceof Error ? err : new Error(String(err)) })
        onFirstReady?.()
      },
    )

    return () => {
      ctl.abort()
      cancelIdle?.()
      sched.clear()
      for (const b of pending) b.close?.()
      if (current) for (const t of MAPS) disposeTexture(current[t])
      current = undefined
    }
    // The tier is decided once per canvas; gl is stable for the canvas' lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl])

  return status
}

function afterFrames(n: number, fn: () => void) {
  if (n <= 0) return fn()
  requestAnimationFrame(() => afterFrames(n - 1, fn))
}
