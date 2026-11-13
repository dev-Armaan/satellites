/**
 * Regional imagery painted onto the planet (owner request C3), through the Earth and cloud shaders (chunks.ts PAINT):
 *
 *  - CONTEXT: a sharp regional basemap around the searched place (NASA GIBS Blue Marble Next Generation, 500 m
 *    native, ±360 km at ~0.5 km/px on desktops), fetched once results are in and feathered into the global map. It keeps the
 *    close pass views (the chase and the acquired view, both below the global map's texture floor) crisp.
 *  - DECAL: the selected pass's REAL captured image (a Planetary Computer crop of the Sentinel-2 / Landsat item, or the
 *    GIBS daily mosaic), ±40–300 km around the place, developed exactly at the scan line during a live acquisition
 *    sequence and simply there otherwise (rt.acq.full). The cover's capture (the photo the results panel leads with:
 *    acquisition.ts coverPass, the same pick as results' windowCover) is fetched ahead (R3-17).
 *
 * Every image is fetched once per session (CORS; these crops are the globe's own, the panel never asks for them),
 * decoded and cut into 128-row strips in the texture worker (textures.ts decodeImageUrl: none of it on the main
 * thread), and uploaded strip by strip (phones: one strip a frame, ≤ 8 ms of upload work; desktops in one go) at
 * chosen frames: prefetches and the context patch only through the texture upload gate (textures.ts canUpload:
 * nothing choreographed moving); the selected pass's image as soon as no camera flight is past its first few
 * percent and no UI entrance runs (store.motionBusyUntil), or at once while the replay stands still waiting for it
 * on arrival (it must be on the GPU before its scan line arrives). Patches fade in and out (never pop). With no replay
 * running (a gallery step), the image on the ground stays until the next one is ready, and that one develops over it
 * in one sweep (acquisition.ts, "a quiet arrival"); a replay fades the old image out and paints the new one at its
 * scan line. Uploaded images stay cached (a few), so swiping back and forth never re-fetches or re-uploads.
 */
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import { DataTexture, LinearFilter, LinearMipmapLinearFilter, RGBAFormat, SRGBColorSpace, UnsignedByteType, Vector4, type Texture, type WebGLRenderer } from 'three'
import { gibsWmsUrl } from '@/imagery'
import { EARTH_RADIUS_KM } from '@/lib/geo'
import { selectSelectedPass, useApp } from '@/state/store'
import { ARRIVAL_HOLD_MS, ARRIVAL_SWEEP_MS, arrivalSweep, captureOf, coverPass, decalLitFor, decalSpecFor, decalUrl } from './acquisition'
import { kmPerTexel } from './framing'
import { panelHalfKm, panelPhotoUrl, panelTurn, patchUv } from './panel'
import { FRAME, useRuntime, type GlobeRuntime } from './runtime'
import { canUpload, decodeImageBlob, decodeImageUrl, uploadStrip, type TexStrip } from './textures'

/** The context basemap: half size (km) and the GIBS layer (static; any TIME answers the same composite). */
const CTX_HALF_KM = 360
const CTX_LAYER = 'BlueMarble_NextGeneration'
const CTX_TIME = '2004-08-01'
/** Fades (ms). */
const CTX_FADE_IN = 900
const CTX_FADE_OUT = 400
const DECAL_FADE_IN = 260
const DECAL_FADE_OUT = 280
/** Uploaded decal textures kept (LRU). */
const DECAL_CACHE = 5
/** Results must have been on screen this long before prefetches start (they follow the panel's own images). */
const PREFETCH_DELAY_MS = 1500
/** Fresh-exposure band: this much REAL time of scan behind the line, never thinner than FRESH_MIN_KM. */
const FRESH_S = 0.4
const FRESH_MIN_KM = 3
/** The context patch keeps the global map's tone at this scale (km) and adds its own detail below it. */
const TONE_KM = 60

interface Entry {
  url: string
  /** loading → decoded (strips cut, off the main thread) → uploading (strip by strip) → ready */
  state: 'loading' | 'decoded' | 'uploading' | 'ready' | 'error'
  /** Rows of the image, north first, in upload order (row 0 = north: the shader samples accordingly) */
  strips?: TexStrip[]
  rows?: number
  next: number
  tex?: Texture
  uv: Vector4
  panelHalf: number
  /**
   * (cos, sin) of the panel photo's turn on the map, counter-clockwise from north up: a Sentinel-2 / Landsat photo is
   * grid-north-up, true north the meridian convergence away (api/_lib/toneRender.ts northInCropDeg); (1, 0) otherwise.
   */
  panelTurn: [number, number]
  usedAt: number
}

/** Rows per upload strip of a regional image: phones upload one strip a frame (≤ 8 ms of upload work, G-M1). */
const PATCH_STRIP_ROWS = 128

function createStore(gl: WebGLRenderer, rt: GlobeRuntime) {
  const entries = new Map<string, Entry>()
  let alive = true
  const log = (what: string, url: string, extra?: unknown) => {
    if (!import.meta.env.DEV && import.meta.env.MODE !== 'inspect') return
    const w = window as unknown as { __imageryLog?: unknown[] }
    ;(w.__imageryLog ??= []).push({ t: Math.round(performance.now()), what, url: url.slice(0, 140), extra })
  }
  const closeStrips = (e: Entry) => {
    e.strips?.forEach((b) => b.close())
    e.strips = undefined
  }
  /**
   * The entry for an image, starting its fetch + decode the first time (`uv` is built only then). `panelUrl`: the panel's
   * photo of the same capture, whose turn the hairline square follows.
   */
  const load = (url: string, uv: () => Vector4, panelHalf: number, panelUrl?: () => string): Entry => {
    let e = entries.get(url)
    if (e) return e
    e = { url, state: 'loading', next: 0, uv: uv(), panelHalf, panelTurn: [1, 0], usedAt: performance.now() }
    entries.set(url, e)
    const entry = e
    log('load', url)
    // One CORS request per URL for the session (globe-only crops: the panel never asks for these sizes); decoded and
    // cut into strips in the texture worker, so the main thread only ever uploads. Sentinel-2 / Landsat crops are toned
    // first in the imagery module's pixels worker (the same global curve the panel's photo of that capture uses); that
    // loader is imported when the first decal needs it, so the globe's first-screen download never carries it; so is
    // the crops' grid arithmetic (pcCrop: which URL is toned, the panel photo's turn). One retry after a short pause, as
    // decodeImageUrl and the panel's preloadImage do (PC's tiler 5xxs on a cold scene).
    const toned = () => import('@/imagery/image').then((m) => m.tonedImageBlob(url))
    const retried = (load: () => Promise<Blob>) => load().catch(() => new Promise<void>((r) => setTimeout(r, 700 + Math.random() * 500)).then(load))
    const decoded = Promise.all([import('@/imagery/pcCrop'), import('@/imagery/radar'), import('@/imagery/image')]).then(([crops, radar, images]) => {
      // Set before the image can be ready (the square is only drawn over a ready decal).
      entry.panelTurn = panelTurn(panelUrl ? crops.northInCropDeg(panelUrl()) : 0)
      // A Sentinel-1 radar crop is toned there too (its own contrast), never painted as the encoded decibels.
      if (crops.isTonedUrl(url) || radar.isRadarUrl(url)) return retried(toned).then(decodeImageBlob)
      // A weather frame the panel redraws (infrared in grey, Himawari's visible band brightened) is painted the same.
      if (images.isRedrawnUrl(url)) return retried(() => images.redrawnImageBlob(url)).then(decodeImageBlob)
      return decodeImageUrl(url)
    })
    decoded
      .then(async (img) => {
        try {
          const n = Math.ceil(img.height / PATCH_STRIP_ROWS)
          const strips = await Promise.all(
            Array.from({ length: n }, (_, i) => img.strip(i * PATCH_STRIP_ROWS, Math.min(PATCH_STRIP_ROWS, img.height - i * PATCH_STRIP_ROWS), false)),
          )
          return { strips, w: img.width, h: img.height }
        } finally {
          img.close()
        }
      })
      .then(
        ({ strips, w, h }) => {
          if (!alive || entries.get(url) !== entry) return strips.forEach((b) => b.close())
          entry.strips = strips
          entry.rows = PATCH_STRIP_ROWS
          entry.state = 'decoded'
          log('decoded', url, [w, h])
        },
        (err: unknown) => {
          entry.state = 'error'
          log('error', url, String(err))
        },
      )
    return e
  }
  /**
   * Upload a decoded entry: allocate the texture (all mip levels), then its strips straight into it, then the mips.
   * Phones take one strip per call (one call per frame), desktops all of them at once. Returns true once ready.
   */
  const upload = (e: Entry): boolean => {
    if (e.state === 'ready') return true
    if ((e.state !== 'decoded' && e.state !== 'uploading') || !e.strips?.length) return false
    const first = e.strips[0]
    if (e.state === 'decoded') {
      const H = e.strips.reduce((a, b) => a + b.height, 0)
      const tex = new DataTexture(null, first.width, H, RGBAFormat, UnsignedByteType)
      tex.flipY = false // row 0 = north (the shader samples accordingly)
      tex.colorSpace = SRGBColorSpace
      tex.generateMipmaps = true
      tex.minFilter = LinearMipmapLinearFilter
      tex.magFilter = LinearFilter
      tex.anisotropy = rt.tier.maxAnisotropy
      tex.unpackAlignment = 4
      tex.mipmapsAutoUpdate = false
      tex.source.dataReady = false
      tex.needsUpdate = true
      e.tex = tex
      e.next = 0
      e.state = 'uploading'
    }
    const tex = e.tex!
    const n = e.strips.length
    const perCall = rt.tier.mobile ? 1 : n
    for (let k = 0; k < perCall && e.next < n; k++, e.next++) {
      uploadStrip(gl, tex, e.strips[e.next], e.next * (e.rows ?? PATCH_STRIP_ROWS), e.next === n - 1)
    }
    if (e.next < n) return false
    tex.source.dataReady = true
    closeStrips(e)
    e.state = 'ready'
    log('upload', e.url, { flying: rt.camera.flying, acq: rt.acq.armed })
    return true
  }
  /** Keep at most `max` decals that are not in use; dispose the least recently used. */
  const prune = (keep: Set<string>, max: number) => {
    const old = [...entries.values()].filter((e) => !keep.has(e.url)).sort((a, b) => a.usedAt - b.usedAt)
    while (old.length > max) {
      const e = old.shift()!
      e.tex?.dispose()
      closeStrips(e)
      entries.delete(e.url)
    }
  }
  /** (Re)activate: StrictMode runs effect cleanups once on mount in development, and the store outlives them. */
  const revive = () => {
    alive = true
  }
  const dispose = () => {
    alive = false
    for (const e of entries.values()) {
      e.tex?.dispose()
      closeStrips(e)
    }
    entries.clear()
  }
  return { entries, load, upload, prune, revive, dispose }
}

const uploadable = (e: Entry) => e.state === 'decoded' || e.state === 'uploading'

export function Imagery() {
  const rt = useRuntime()
  const gl = useThree((s) => s.gl)
  const store = useMemo(() => createStore(gl, rt), [gl, rt])
  useEffect(() => {
    store.revive()
    return () => store.dispose()
  }, [store])

  const state = useMemo(
    () => ({
      ctx: null as Entry | null, // bound context patch
      ctxKey: '',
      decal: null as Entry | null, // bound decal (slot A, on top)
      prev: null as Entry | null, // the previous one (slot B), held under A while A fades in
      wantDecal: null as Entry | null,
      // A quiet arrival (acquisition.ts): when the bound image's sweep began, and since when the one before it has
      // been held for an image still on its way (−1: not held).
      sweepAt: -Infinity,
      heldSince: -1,
      prefetch: null as Entry | null,
      prefetchKey: '',
      // The cover pass of the last final report seen (computed once per report, not per frame).
      coverReport: undefined as unknown,
      cover: undefined as ReturnType<typeof coverPass>,
      resultsAt: -1,
      reportSeen: undefined as unknown,
      last: performance.now(),
      // Per-frame lookups, recomputed only when their inputs change (no per-frame allocation).
      placeRef: undefined as unknown,
      placeKey: '',
      ctxEntry: null as Entry | null,
      passRef: undefined as unknown,
      passEntry: null as Entry | null,
    }),
    [],
  )

  useFrame(() => {
    const now = performance.now()
    const dt = Math.min(0.1, Math.max(0, (now - state.last) / 1000))
    state.last = now
    const st = useApp.getState()
    const p = rt.paint
    const acq = rt.acq
    const report = st.report
    const place = report?.place ?? st.place
    const mobile = rt.tier.mobile
    const quiet = canUpload(rt, now)
    const midFlight = rt.camera.flying && rt.camera.progress >= 0.06
    // Phones advance one image's upload per frame (one strip: ≤ 8 ms of upload work), desktops any number.
    let slot = mobile ? 1 : Infinity
    if (st.phase === 'results' && report !== state.reportSeen) {
      state.reportSeen = report
      state.resultsAt = now
    }
    if (st.phase !== 'results') state.resultsAt = -1
    const settledResults = state.resultsAt >= 0 && now - state.resultsAt > PREFETCH_DELAY_MS

    if (place !== state.placeRef) {
      state.placeRef = place
      state.placeKey = place ? `${place.lat.toFixed(4)},${place.lon.toFixed(4)}` : ''
      state.ctxEntry = null
    }
    // ── context basemap: one per place, once results have settled (or a pass is open)
    if (place && (settledResults || st.selectedPassId)) {
      const key = state.placeKey
      if (key !== state.ctxKey) {
        if (!state.ctxEntry) {
          const url = gibsWmsUrl(CTX_LAYER, CTX_TIME, place, { halfSizeKm: CTX_HALF_KM, px: mobile ? 1024 : 1536 })
          state.ctxEntry = store.load(url, () => patchUv(place.lat, place.lon, CTX_HALF_KM, new Vector4()), 0)
        }
        const e = state.ctxEntry
        if (uploadable(e) && quiet && slot > 0) {
          slot--
          store.upload(e)
        }
        // Bind once the old patch has faded out (below).
        if (e.state === 'ready' && p.uCtxOn.value <= 0) {
          state.ctx = e
          state.ctxKey = key
          p.uCtxMap.value = e.tex!
          p.uCtxUv.value.copy(e.uv)
        }
      }
    }
    const ctxWanted = !!place && !!state.ctx && state.ctxKey === state.placeKey
    if (ctxWanted) p.uCtxOn.value = rt.reducedMotion ? 1 : Math.min(1, p.uCtxOn.value + (dt * 1000) / CTX_FADE_IN)
    else if (p.uCtxOn.value > 0) p.uCtxOn.value = Math.max(0, p.uCtxOn.value - (dt * 1000) / CTX_FADE_OUT)

    // ── decal: the selected pass's capture
    const pass = st.selectedPassId && report ? selectSelectedPass(st) : undefined
    if (pass !== state.passRef) {
      state.passRef = pass
      state.passEntry = null
      const cap = pass && place ? captureOf(report, pass) : undefined
      const spec = cap ? decalSpecFor(cap.collection, mobile) : null
      if (cap && spec && place) {
        state.passEntry = store.load(
          decalUrl(cap, spec),
          () => patchUv(place.lat, place.lon, spec.halfSizeKm, new Vector4()),
          panelHalfKm(cap.collection) / (2 * spec.halfSizeKm),
          () => panelPhotoUrl(cap),
        )
      }
    }
    let want: Entry | null = null
    if (pass && acq.imaged && acq.passId === pass.id && state.passEntry) {
      want = state.passEntry
      want.usedAt = now
      // The selected image uploads as soon as no flight is mid-way and no UI entrance is running (its scan line may
      // be seconds away), or at once when the replay stands still waiting for it (Clock: the decal hold on arrival).
      const waiting = acq.armed && !rt.camera.flying
      if (uploadable(want) && !midFlight && (waiting || now > st.motionBusyUntil) && slot > 0) {
        slot--
        store.upload(want)
      }
    }
    // Prefetch the cover's capture once results have settled (network + decode now, upload when quiet).
    if (settledResults && report) {
      if (report !== state.coverReport) {
        state.coverReport = report
        state.cover = coverPass(report)
      }
      const hero = state.cover
      const key = hero ? `${report.generatedAt}:${hero.id}` : ''
      if (hero && key !== state.prefetchKey && place) {
        state.prefetchKey = key
        const cap = captureOf(report, hero)
        const spec = cap ? decalSpecFor(cap.collection, mobile) : null
        if (cap && spec)
          state.prefetch = store.load(
            decalUrl(cap, spec),
            () => patchUv(place.lat, place.lon, spec.halfSizeKm, new Vector4()),
            panelHalfKm(cap.collection) / (2 * spec.halfSizeKm),
            () => panelPhotoUrl(cap),
          )
      }
    }
    if (state.prefetch && uploadable(state.prefetch) && quiet && slot > 0) {
      slot--
      store.upload(state.prefetch)
    }
    acq.decalReady = !!want && want.state === 'ready'

    // Crossfade between passes: the bound image moves to slot B (fully developed, underneath) and the new one comes
    // in on top; B leaves once A is in. With nothing to show, A fades out.
    const target = want && want.state === 'ready' ? want : null
    const step = (ms: number) => (rt.reducedMotion ? 1 : (dt * 1000) / ms)
    // No replay is running or armed: the selection is a quiet one (a gallery step, a scrub, a parked link).
    const quietNow = !acq.armed && st.timeMode !== 'replay'
    if (target && state.decal !== target) {
      if (state.decal && p.uDecalOn.value > 0.02) {
        state.prev = state.decal
        p.uDecal2Map.value = state.decal.tex!
        p.uDecal2Uv.value.copy(state.decal.uv)
        p.uDecal2On.value = p.uDecalOn.value * (1 - 0) // keeps its current weight
        p.uDecal2Lit.value = p.uDecalLit.value
      }
      state.decal = target
      p.uDecalLit.value = decalLitFor(target.url)
      // A quiet arrival develops in under its own sweep, at full weight; in a replay the scan line develops it.
      const sweep = quietNow && !rt.reducedMotion
      state.sweepAt = sweep ? now : -Infinity
      p.uDecalOn.value = sweep ? 1 : 0
      p.uDecalMap.value = target.tex!
      p.uDecalUv.value.copy(target.uv)
      p.uPanelHalf.value = target.panelHalf
      p.uPanelTurn.value.set(target.panelTurn[0], target.panelTurn[1])
    }
    // A replay that starts mid-sweep takes the image over: its scan line develops it from here.
    if (!quietNow) state.sweepAt = -Infinity
    const sweepK = target && target === state.decal ? (now - state.sweepAt) / ARRIVAL_SWEEP_MS : 1
    const sweeping = sweepK < 1
    // The image on the ground waits for a quiet selection's image that is still on its way (never for long).
    const coming = !!want && want.state !== 'ready' && want.state !== 'error'
    if (!target && coming && quietNow && state.decal) {
      if (state.heldSince < 0) state.heldSince = now
    } else state.heldSince = -1
    const held = state.heldSince >= 0 && now - state.heldSince < ARRIVAL_HOLD_MS
    if (target) {
      p.uDecalOn.value = Math.min(1, p.uDecalOn.value + step(DECAL_FADE_IN))
      // The image underneath leaves once this one is in: after its sweep has crossed it, on a quiet arrival.
      if (p.uDecalOn.value >= 1 && !sweeping && p.uDecal2On.value > 0) p.uDecal2On.value = Math.max(0, p.uDecal2On.value - step(DECAL_FADE_OUT))
    } else if (!held) {
      p.uDecalOn.value = Math.max(0, p.uDecalOn.value - step(DECAL_FADE_OUT))
      p.uDecal2On.value = Math.max(0, p.uDecal2On.value - step(DECAL_FADE_OUT))
      if (p.uDecalOn.value <= 0) {
        state.decal = null
        p.uDecalMap.value = null
      }
    }
    if (p.uDecal2On.value <= 0 && state.prev) {
      state.prev = null
      p.uDecal2Map.value = null
    }

    // Tone matching scale, in each map's own mip levels.
    p.uDayLod.value = Math.max(0, Math.log2(TONE_KM / kmPerTexel(rt.textureLevel)))
    p.uCtxLod.value = Math.max(0, Math.log2(TONE_KM / ((2 * CTX_HALF_KM) / (mobile ? 1024 : 1536))))

    // Scan line and development.
    p.uScanT0.value.copy(acq.t0)
    if (sweeping && acq.halfKm > 0) {
      // A quiet arrival: the image develops under a line of its own, along the pass's direction (the clock is parked).
      const a = arrivalSweep(sweepK, acq.halfKm)
      p.uScanS.value = a.s
      p.uFull.value = 0
      p.uFreshRad.value = a.fresh
    } else {
      p.uScanS.value = acq.scanS
      p.uFull.value = acq.full
      p.uFreshRad.value = Math.max(FRESH_MIN_KM, FRESH_S * acq.speedKmS * acq.rate) / EARTH_RADIUS_KM
    }
    // The global weather layer steps aside for the close views (its texels would be blobs there).
    const altR = rt.camera.altitudeKm / EARTH_RADIUS_KM
    const x = Math.min(1, Math.max(0, (altR - 0.05) / 0.13))
    p.uCloudFade.value = x * x * (3 - 2 * x)

    // Keep a few decals around (the bound one, the wanted one, the hero's).
    if (store.entries.size > DECAL_CACHE + 2) {
      const keep = new Set<string>()
      for (const e of [state.ctx, state.ctxEntry, state.decal, state.prev, state.passEntry, state.prefetch]) if (e) keep.add(e.url)
      store.prune(keep, DECAL_CACHE)
    }
  }, FRAME.scene - 1)

  return null
}
