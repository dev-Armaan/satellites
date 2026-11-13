/**
 * Scene composition. Order of work each frame is fixed by useFrame priorities (runtime.ts FRAME):
 *   AdaptiveDpr → Clock (sim time, sun, GMST, texture-upload slices) → CameraDirector → scene components → post
 *   composer.
 *
 * Also owns the frame-rate policy: adaptive DPR that only changes while nothing choreographed is moving
 * (PERF-08), no rendering at all under a full-screen overlay (the lightbox, About, the phone share sheet: R3-16) or
 * in a hidden tab (PERF-10), and the boot-time shader warm-up so no overlay program links on frame 1 of a flight
 * (PERF-02).
 */
import { useFrame, useThree } from '@react-three/fiber'
import type { EffectComposer } from 'postprocessing'
import { useEffect, useMemo, useRef } from 'react'
import { BufferAttribute, BufferGeometry, Group, Mesh, PlaneGeometry, Points, type Material } from 'three'
import { useApp } from '@/state/store'
import { CameraDirector } from './CameraDirector'
import { Clock } from './Clock'
import { useCatalogBuffers } from './data'
import { Atmosphere, Clouds, Earth, EarthFallback, useSphere } from './Earth'
import { Hairline } from './hairline'
import {
  createCurtainMaterial,
  createFadeMaterial,
  createGlyphMaterial,
  createReticleMaterial,
  createRibbonMaterial,
  createSatellitesMaterial,
  createSpacecraftMaterial,
  lin,
} from './materials'
import { buildSpacecraftGeometry } from './spacecraft'
import { Imagery } from './Imagery'
import { PassOverlay } from './PassOverlay'
import { PinMarker } from './PinMarker'
import { PlaceMarker } from './PlaceMarker'
import { usePost } from './Post'
import { GL_DEBUG, glFixedDpr, glProbe, glx } from './debugGl'
import { declineLevel, detectTier, dprLevels } from './quality'
import { FRAME, RuntimeContext, useRuntime, type GlobeRuntime } from './runtime'
import { SatelliteField } from './SatelliteField'
import { Stars } from './Stars'
import { inputBusy, REPLAY_QUIET_MS, useEarthTextures } from './textures'

export function GlobeScene({ runtime }: { runtime: GlobeRuntime }) {
  const gl = useThree((s) => s.gl)
  // Refine the device tier from the real context before any child reads it.
  useMemo(() => {
    runtime.tier = detectTier(gl)
  }, [gl, runtime])
  const textures = useEarthTextures(gl, runtime)
  const catalog = useCatalogBuffers()
  // One sphere for the planet and its cloud shell (scaled).
  const sphere = useSphere(runtime.tier.sphereSegments)

  // Hook for screenshot scripts and perf probes: dev and `vite build --mode inspect` only, never in production.
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  useEffect(() => {
    if (!import.meta.env.DEV && import.meta.env.MODE !== 'inspect') return
    ;(window as unknown as { __globe?: unknown }).__globe = { rt: runtime, gl, scene, camera, useApp }
  }, [gl, runtime, scene, camera])
  useEffect(() => {
    if (!GL_DEBUG) return
    glProbe.gl = gl
    glProbe.camera = camera
    glProbe.rt = runtime
  }, [gl, runtime, camera])

  return (
    <RuntimeContext.Provider value={runtime}>
      <Clock />
      <CameraDirector />
      <AdaptiveDpr />
      <FrameloopControl />
      {!glx('nostars') && <Stars />}
      {textures.state === 'ready' && (
        <>
          <Earth textures={textures.textures} geometry={sphere} />
          {!glx('noclouds') && <Clouds textures={textures.textures} geometry={sphere} />}
        </>
      )}
      {textures.state === 'error' && <EarthFallback />}
      {textures.state !== 'loading' && !glx('noatmo') && <Atmosphere />}
      {textures.state === 'ready' && !glx('noimagery') && <Imagery />}
      {catalog.state === 'ready' && !glx('nosats') && <SatelliteField data={catalog.data} />}
      <PlaceMarker />
      <PinMarker />
      {catalog.state === 'ready' && <PassOverlay />}
      <ReadySignal ready={textures.state !== 'loading'} />
      <AnchorFlush />
      <PostAndWarmup />
    </RuntimeContext.Provider>
  )
}

/** Hands this frame's screen anchors to the DOM overlay, after every scene component has written them. */
function AnchorFlush() {
  const rt = useRuntime()
  useFrame(() => {
    for (const l of rt.anchorListeners) l()
  }, FRAME.anchors)
  return null
}

/**
 * Phones: how long first light may wait for the 2k day + night pair (already downloading since the module loaded,
 * decoded in the worker, uploading under the curtain), so the landing usually opens on the final maps and nobody
 * sees the globe sharpen (G-M1). Never longer than this.
 */
export const SHARP_BOOT_WAIT_MS = 350

/**
 * Sets store.globeReady once the first textures have actually been on screen for a couple of frames (on phones, once
 * the 2k pair is in too, or SHARP_BOOT_WAIT_MS later).
 */
function ReadySignal({ ready }: { ready: boolean }) {
  const rt = useRuntime()
  const frames = useRef(0)
  const done = useRef(false)
  const lightAt = useRef(-1)
  useFrame(() => {
    if (!ready || done.current) return
    if (++frames.current < 3) return
    const now = performance.now()
    if (lightAt.current < 0) lightAt.current = now
    const st = useApp.getState()
    if (rt.tier.mobile && !st.dayMapSharp && now - lightAt.current < SHARP_BOOT_WAIT_MS) return
    done.current = true
    st.setGlobeReady(true)
  }, FRAME.scene)
  return null
}

function PostAndWarmup() {
  const composer = usePost()
  return <ShaderWarmup composer={composer} />
}

// ───────────────────────────── shader warm-up (PERF-02) ─────────────────────────────

/**
 * One instance of every overlay material (from the same factories the real components use), each on a
 * single-vertex geometry so nothing rasterises, rendered through the composer for two real frames under the boot
 * curtain. three caches programs by source + parameters (including the composer target's colour space, which is
 * why this goes through the composer and not a bare gl.compile against the canvas). Where the browser can
 * compile in parallel (KHR_parallel_shader_compile), compileAsync starts the work against the composer's input
 * buffer first. Afterwards the objects are hidden but the materials stay alive, so the programs stay cached.
 */
function ShaderWarmup({ composer }: { composer: EffectComposer }) {
  const rt = useRuntime()
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  const group = useRef<Group>(null)

  const kit = useMemo(() => {
    const one = () => {
      const g = new BufferGeometry()
      g.setAttribute('position', new BufferAttribute(new Float32Array(3), 3))
      return g
    }
    const ribbonGeo = one()
    for (const a of ['aAlong', 'aSide', 'aU']) ribbonGeo.setAttribute(a, new BufferAttribute(new Float32Array(1), 1))
    const curtainGeo = one()
    for (const a of ['aV', 'aS']) curtainGeo.setAttribute(a, new BufferAttribute(new Float32Array(1), 1))
    const satGeo = one()
    for (const a of ['aEl0', 'aEl1', 'aEl2']) satGeo.setAttribute(a, new BufferAttribute(new Float32Array(4), 4))
    satGeo.setAttribute('aMark', new BufferAttribute(new Float32Array(1), 1))
    const hairline = new Hairline({ capacity: 1, color: lin('#ffffff'), opacity: 0, uPx: rt.uniforms.uPx })
    const shared = { uPx: rt.uniforms.uPx, uSunDir: rt.uniforms.uSunDir, uCloudMap: rt.uniforms.uCloudMap, uCloudOffset: rt.uniforms.uCloudOffset }
    // Geometry attribute sets matter (e.g. normals are part of the program key), so each stand-in uses the same
    // geometry type as the real object: planes for the reticle and the fade quad, bare buffers for the rest.
    const objects: (Mesh | Points)[] = [
      new Mesh(new PlaneGeometry(1, 1), createReticleMaterial(rt.uniforms.uPx, 15, 112)),
      new Mesh(ribbonGeo, createRibbonMaterial(shared, { kind: 0, color: lin('#ffffff'), fill: 0 }, { speedKmS: 7 })),
      new Mesh(hairline.geometry, hairline.material),
      new Points(one(), createGlyphMaterial(rt.uniforms.uPx, { size: 13, shape: 0, filled: true })),
      new Mesh(new PlaneGeometry(2, 2), createFadeMaterial()),
      new Points(satGeo, createSatellitesMaterial(rt.uniforms.uPx)),
      // The acquisition sequence's spacecraft (its real geometry: normals and uv are part of the program key) and curtain.
      new Mesh(buildSpacecraftGeometry(), createSpacecraftMaterial(rt.uniforms.uSunDir)),
      new Mesh(curtainGeo, createCurtainMaterial(lin('#ffffff'))),
    ]
    for (const o of objects) {
      o.frustumCulled = false
      o.scale.setScalar(1e-6) // compile and draw, but never cover a pixel
      const m = o.material as Material & { uniforms?: Record<string, { value: unknown }> }
      if (m.uniforms?.uOpacity) m.uniforms.uOpacity.value = 0
      if (m.uniforms?.uReveal) m.uniforms.uReveal.value = 0
    }
    return { objects }
  }, [rt])
  useEffect(
    () => () => {
      for (const o of kit.objects) {
        o.geometry.dispose()
        ;(o.material as Material).dispose()
      }
    },
    [kit],
  )

  const st = useRef({ frames: 0, compiled: false, started: false })
  useEffect(() => {
    const g = group.current
    if (!g || st.current.started) return
    st.current.started = true
    const parallel = gl.extensions.get('KHR_parallel_shader_compile') !== null
    if (!parallel) {
      st.current.compiled = true
      return
    }
    const prev = gl.getRenderTarget()
    gl.setRenderTarget(composer.inputBuffer)
    const done = gl.compileAsync(g, camera, scene)
    gl.setRenderTarget(prev)
    done.then(
      () => (st.current.compiled = true),
      () => (st.current.compiled = true),
    )
  }, [gl, camera, scene, composer])

  useFrame(() => {
    const g = group.current
    if (!g || !g.visible) return
    // Two real frames through the composer once compiled, then hide (materials stay alive).
    if (st.current.compiled && ++st.current.frames > 2) g.visible = false
  }, FRAME.scene)

  return (
    <group ref={group}>
      {kit.objects.map((o, i) => (
        <primitive key={i} object={o} />
      ))}
    </group>
  )
}

// ───────────────────────────── frame-rate policy ─────────────────────────────

/**
 * Full-screen overlays that cover the globe (R3-16). Contract: while one is open it sets
 * `document.documentElement.dataset.overlay` to its name, and deletes it as it starts closing (results: the
 * lightbox; shell: About; share: the share sheet on stacked layouts). The globe owns the reader.
 */
const COVERING_OVERLAYS = new Set(['lightbox', 'about', 'share', 'timelapse'])
export const overlayCovers = (doc: Document | undefined = typeof document === 'undefined' ? undefined : document) =>
  !!doc && COVERING_OVERLAYS.has(doc.documentElement.dataset.overlay ?? '')
/**
 * With something moving on the globe when an overlay opens (a flight, a replay, the acquisition settle), it keeps
 * rendering this long, until the overlay's backdrop is up (the scrims fade in over 240 ms), so motion never visibly
 * freezes under a half-transparent scrim. A still globe pauses at once.
 */
export const OVERLAY_GRACE_MS = 280

/**
 * Frame-loop policy (PERF-10, R3-16):
 *  - under a covering overlay (the lightbox, About, the phone share sheet) or in a hidden tab: no rendering at all
 *    ('never'); when it goes, the loop resumes at once with a fresh frame (Clock and CameraDirector clamp the gap,
 *    so nothing jumps), drawn before the overlay's exit has uncovered anything;
 *  - phones idling on the landing (no flight, no touch for 1.5 s, no replay): every 2nd animation frame, since
 *    the only motion is the 0.6°/s drift. A touch on the canvas restores full rate at once.
 */
function FrameloopControl() {
  const rt = useRuntime()
  const gl = useThree((s) => s.gl)
  const setFrameloop = useThree((s) => s.setFrameloop)
  const invalidate = useThree((s) => s.invalidate)
  const mode = useRef<'always' | 'never' | 'half'>('always')
  const applyRef = useRef<((m: 'always' | 'never' | 'half') => void) | null>(null)

  useEffect(() => {
    let raf = 0
    let odd = false
    const tick = () => {
      odd = !odd
      if (odd) invalidate()
      raf = requestAnimationFrame(tick)
    }
    const apply = (next: 'always' | 'never' | 'half') => {
      if (next === mode.current) return
      if (mode.current === 'never') rt.resumedAt = performance.now()
      mode.current = next
      cancelAnimationFrame(raf)
      raf = 0
      rt.throttled = next === 'half'
      if (next === 'never') setFrameloop('never')
      else if (next === 'always') {
        setFrameloop('always')
        invalidate()
      } else {
        setFrameloop('demand')
        raf = requestAnimationFrame(tick)
      }
      if (import.meta.env.DEV || import.meta.env.MODE === 'inspect') {
        const w = window as unknown as { __loopLog?: unknown[] }
        ;(w.__loopLog ??= []).push({ t: Math.round(performance.now()), mode: next, overlay: document.documentElement.dataset.overlay ?? '' })
      }
    }
    // When the current cover appeared (NaN: none up).
    let coveredAt = NaN
    let grace = 0
    const moving = () => {
      const now = performance.now()
      return rt.camera.flying || rt.acq.armed || now - rt.acq.capturedAt < 2500 || useApp.getState().timeMode === 'replay'
    }
    const sync = () => {
      window.clearTimeout(grace)
      const covered = useApp.getState().aboutOpen || overlayCovers()
      if (!covered) coveredAt = NaN
      else if (Number.isNaN(coveredAt)) coveredAt = performance.now()
      let pause = typeof document !== 'undefined' && document.hidden
      if (covered && !pause) {
        const wait = mode.current === 'never' || !moving() ? 0 : OVERLAY_GRACE_MS - (performance.now() - coveredAt)
        if (wait > 0) grace = window.setTimeout(sync, wait)
        else pause = true
      }
      apply(pause ? 'never' : mode.current === 'never' ? 'always' : mode.current)
    }
    sync()
    const unsub = useApp.subscribe((s, prev) => {
      if (s.aboutOpen !== prev.aboutOpen) sync()
      // Anything that starts motion wakes the loop before the next frame.
      if (mode.current === 'half' && (s.phase !== prev.phase || s.camera !== prev.camera || s.timeMode !== prev.timeMode)) apply('always')
    })
    // The overlay contract: <html data-overlay>, written by the overlays themselves.
    const overlays = new MutationObserver(sync)
    overlays.observe(document.documentElement, { attributes: true, attributeFilter: ['data-overlay'] })
    const wake = () => {
      if (mode.current === 'half') apply('always')
    }
    document.addEventListener('visibilitychange', sync)
    gl.domElement.addEventListener('pointerdown', wake)
    gl.domElement.addEventListener('wheel', wake, { passive: true })
    applyRef.current = apply
    return () => {
      unsub()
      overlays.disconnect()
      window.clearTimeout(grace)
      cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', sync)
      gl.domElement.removeEventListener('pointerdown', wake)
      gl.domElement.removeEventListener('wheel', wake)
      rt.throttled = false
    }
  }, [gl, rt, setFrameloop, invalidate])

  // Decide the phone idle policy on rendered frames (cheap checks only).
  useFrame(() => {
    if (!rt.tier.mobile || mode.current === 'never') return
    const st = useApp.getState()
    const now = performance.now()
    const idle =
      !glx('nohalf') &&
      st.phase === 'idle' &&
      !rt.camera.flying &&
      st.timeMode !== 'replay' &&
      st.hoveredNorad === undefined &&
      now - rt.inputAt > 1500 &&
      now - rt.phaseEnteredAt > 3000 &&
      now > st.motionBusyUntil
    const want = idle ? 'half' : 'always'
    if (want !== mode.current) applyRef.current?.(want)
  })
  return null
}

/** Frame-time sampling window (ms) and how many windows a decision needs. */
const FPS_WINDOW_MS = 500
const DECLINE_WINDOWS = 4 // 2 s of bad frames
const INCLINE_MS = 3000 // ≥ 58 fps for 3 s before going up
const INCLINE_FPS = 58
/** Direction reversals allowed before the DPR freezes (settles instead of oscillating). */
const FLIPFLOPS = 2
/** No DPR change this long after an acquisition's capture (its settle and the image's last strokes). */
const ACQ_QUIET_MS = 2500
/**
 * Before a DPR change the composer holds its frames (the canvas keeps the last image; the page stays live) until the
 * GPU has finished everything queued: a drawing-buffer resize waits for that queue synchronously, and on a slow GPU
 * that blocked the main thread for 0.4–0.6 s (G-M1). A fence says when. Holding a still view is invisible, a blocked
 * main thread is not, so the hold may run long (capped), and any input or motion ends it at once (the change waits
 * for the next quiet moment). Without fences: 2 frames.
 */
const DPR_DRAIN_FRAMES = 2
const DPR_DRAIN_MAX_FRAMES = 40
const DPR_DRAIN_MAX_MS = 2000

/**
 * DPR policy (PERF-08, G-M2: never above 2). Phones start at 1.5 (floor 1.0) and only reach 2.0 after ≥ 58 fps for
 * 3 s; desktops start at min(2, device). A decline goes straight to the level the measured rate calls for
 * (declineLevel), so a slow device reallocates once. A change reallocates the composer's targets, so changes are QUEUED and applied only
 * when no camera flight is running (and ≥ 1 s after one lands, past the reticle lock-in), more than 2 s after a
 * phase change and after store.motionBusyUntil.
 */
function AdaptiveDpr() {
  const rt = useRuntime()
  const gl = useThree((s) => s.gl)
  const setDpr = useThree((s) => s.setDpr)
  const ctl = useMemo(() => {
    const { levels, start } = dprLevels(rt.tier.mobile, typeof window === 'undefined' ? 1 : window.devicePixelRatio)
    return {
      levels,
      index: Math.max(0, levels.indexOf(start)),
      want: -1,
      frames: 0,
      windowStart: -1,
      low: 0, // consecutive low windows
      highSince: -1,
      refresh: 0,
      flips: 0,
      lastDir: 0,
      /** Sum of the fps of the current run of low windows (the decline target uses their mean) */
      lowSum: 0,
      resumeSeen: rt.resumedAt,
      /** Frames held so far in the drain before the queued change applies (-1: not draining) */
      drain: -1,
      drainAt: 0,
      fence: null as WebGLSync | null,
      /** Canvas CSS size last seen (a change ends a drain) */
      sizeW: -1,
      sizeH: -1,
    }
  }, [rt])

  const fixedDpr = glFixedDpr()
  useEffect(() => {
    const d0 = fixedDpr ?? ctl.levels[ctl.index]
    rt.dprProp[0] = rt.dprProp[1] = d0
    setDpr(d0)
    if (fixedDpr) ctl.flips = Infinity // `?debug=gl` fixed DPR: the adaptive policy never moves it
    // Probe hook (dev / inspect builds only): queue a DPR step through the real policy, as a frame-rate change would.
    if (!import.meta.env.DEV && import.meta.env.MODE !== 'inspect') return
    ;(window as unknown as { __forceDpr?: (dpr: number) => void }).__forceDpr = (dpr: number) => {
      let best = 0
      ctl.levels.forEach((v, i) => {
        if (Math.abs(v - dpr) < Math.abs(ctl.levels[best] - dpr)) best = i
      })
      ctl.want = best
      ctl.flips = 0
    }
  }, [ctl, setDpr, fixedDpr, rt])

  useFrame((state) => {
    const now = performance.now()
    const c = ctl
    // The canvas was resized (a toolbar, the keyboard, a rotation): the drawing buffer was just reallocated and
    // cleared, so a drain holding frames would leave it blank. End the hold; a queued change waits for the next quiet.
    if (state.size.width !== c.sizeW || state.size.height !== c.sizeH) {
      c.sizeW = state.size.width
      c.sizeH = state.size.height
      if (c.drain >= 0) {
        if (c.fence) (gl.getContext() as WebGL2RenderingContext).deleteSync(c.fence)
        c.fence = null
        c.drain = -1
        rt.skipRender = 0
      }
    }
    // Half-rate idle frames say nothing about the device, nor does the gap of a pause: restart the window.
    if (rt.throttled || rt.resumedAt !== c.resumeSeen) {
      c.resumeSeen = rt.resumedAt
      c.windowStart = -1
      c.frames = 0
      c.highSince = -1
      if (rt.throttled) return
    }
    if (c.windowStart < 0) c.windowStart = now
    c.frames++
    const span = now - c.windowStart
    if (span >= FPS_WINDOW_MS) {
      const fps = (c.frames * 1000) / span
      c.frames = 0
      c.windowStart = now
      c.refresh = Math.max(c.refresh, fps)
      const lower = c.refresh > 90 ? 50 : 40
      if (fps < lower) {
        c.low++
        c.lowSum += fps
      } else {
        c.low = 0
        c.lowSum = 0
      }
      if (fps >= INCLINE_FPS) {
        if (c.highSince < 0) c.highSince = now
      } else c.highSince = -1
      if (c.flips <= FLIPFLOPS) {
        if (c.low >= DECLINE_WINDOWS && c.index > 0) {
          // Straight to the level the measured rate calls for: one reallocation, not a staircase (G-M1). A change
          // still queued from earlier only ever goes further down.
          const to = declineLevel(c.levels, c.index, c.lowSum / c.low, lower)
          c.want = c.want >= 0 ? Math.min(c.want, to) : to
          c.low = 0
          c.lowSum = 0
        } else if (c.highSince >= 0 && now - c.highSince >= INCLINE_MS && c.index < c.levels.length - 1) {
          c.want = c.index + 1
          c.highSince = -1
        }
      }
    }
    // Apply a queued change only while nothing choreographed is moving (the acquisition sequence included: its chase
    // and settle are not flights, and a reallocation there would hitch the signature moment).
    if (c.want >= 0 && c.want !== c.index) {
      const st = useApp.getState()
      const sequence =
        rt.acq.armed || now - rt.acq.capturedAt < ACQ_QUIET_MS || (st.timeMode === 'replay' && now - rt.replayStartedAt < REPLAY_QUIET_MS)
      const quiet =
        !sequence &&
        !rt.camera.flying &&
        now - rt.camera.arrivedAt > 1000 &&
        now - rt.phaseEnteredAt > 2000 &&
        now > st.motionBusyUntil &&
        now - rt.inputAt > 1000 &&
        !inputBusy(now)
      const g = gl.getContext() as WebGL2RenderingContext
      const fences = typeof g.fenceSync === 'function'
      const endDrain = () => {
        if (c.fence) g.deleteSync(c.fence)
        c.fence = null
        c.drain = -1
        rt.skipRender = 0
      }
      let go = false
      if (!quiet) {
        if (c.drain >= 0) endDrain()
      } else if (c.drain < 0) {
        // Hold the next frames so the GPU drains, then resize on a frame with nothing queued.
        c.drain = 0
        c.drainAt = now
        if (fences) {
          c.fence = g.fenceSync(g.SYNC_GPU_COMMANDS_COMPLETE, 0)
          g.flush()
        }
        rt.skipRender = 1
      } else {
        c.drain++
        // Non-blocking (a zero timeout only asks).
        const done = c.fence ? g.clientWaitSync(c.fence, 0, 0) !== g.TIMEOUT_EXPIRED : c.drain >= DPR_DRAIN_FRAMES
        go = done || c.drain >= DPR_DRAIN_MAX_FRAMES || now - c.drainAt > DPR_DRAIN_MAX_MS
        if (go) {
          c.drain = Math.max(0, c.drain)
          if (c.fence) g.deleteSync(c.fence)
          c.fence = null
          rt.skipRender = 0
        } else rt.skipRender = 1
      }
      if (go) {
        const held = { frames: c.drain, ms: Math.round(now - c.drainAt) }
        const dir = Math.sign(c.want - c.index)
        if (c.lastDir !== 0 && dir !== c.lastDir) c.flips++
        c.lastDir = dir
        c.index = c.want
        c.want = -1
        c.drain = -1
        rt.dprProp[0] = rt.dprProp[1] = c.levels[c.index]
        setDpr(c.levels[c.index])
        if (import.meta.env.DEV || import.meta.env.MODE === 'inspect') {
          const w = window as unknown as { __dprLog?: unknown[] }
          ;(w.__dprLog ??= []).push({ t: Math.round(now), dpr: c.levels[c.index], held, flying: rt.camera.flying, sincePhase: Math.round(now - rt.phaseEnteredAt), phase: rt.phase })
        }
      }
    }
    // Before the clock and the camera: the drawing buffer resizes first, then this frame's pose and lens shift are
    // applied to it (the camera is manual, so R3F's resize never resets the projection).
  }, FRAME.dpr)
  return null
}
