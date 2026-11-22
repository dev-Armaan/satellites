/**
 * <GlobeCanvas/>: the full-bleed 3D scene. Reads the store; writes only `globeReady`, `hoveredNorad`, the
 * throttled `simTime` of the clock it owns (see Clock.tsx) and `cameraFlight` (CameraDirector, on transitions).
 * See docs/ARCHITECTURE.md ("globe") and docs/DESIGN.md §6.
 *
 * Failure modes are handled here so the app never hangs on the globe:
 *  - no WebGL 2 → a static hairline globe figure with a plain note; globeReady is set.
 *  - a render-time error inside the scene → the same fallback (error boundary); globeReady is set.
 *  - textures fail → an ink graticule sphere (see Earth.tsx); catalog fails → the scene runs without points.
 *  - the browser takes the GPU context away and gives it back (a phone's background tab) → the stage is mounted
 *    again on a new canvas (contextLoss.ts): the restored context's textures would be empty.
 */
import { Canvas } from '@react-three/fiber'
import { Component, lazy, Suspense, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Color, WebGLRenderer } from 'three'
import enGlobe from '@/i18n/en/globe'
import { useMsgs } from '@/i18n/runtime'
import { STACKED_QUERY } from '@/lib/layout'
import type { Place } from '@/types'
import { useApp } from '@/state/store'
import { useMediaQuery } from '@/ui/system/media'
import { palette } from '@/ui/system/palette'
import { onContextRestored } from './contextLoss'
import { activeGlSwitches, GL_DEBUG, GL_SWITCHES, glFixedDpr, glProbe, urlWithSwitches } from './debugGl'
import { GlobeOverlay } from './GlobeOverlay'
import { PinOverlay } from './PinOverlay'
import { detectMobile, dprLevels, prefersReducedMotion, provisionalTier } from './quality'
import { createRuntime } from './runtime'
import { GlobeScene } from './Scene'
import s from './GlobeCanvas.module.css'

/** The `?debug=gl` panel: its own chunk, never fetched outside debug mode. */
const DebugGl = lazy(() => import('./DebugGl'))
const GL_ACTIVE = activeGlSwitches()

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ')

/** Starting DPR: phones 1.5 (they earn 2.0 by holding 58 fps), desktops min(2, device); never above 2 (G-M2). */
function initialDpr(mobile: boolean): number {
  const fixed = glFixedDpr()
  if (fixed) return fixed
  return dprLevels(mobile, typeof window === 'undefined' ? 1 : window.devicePixelRatio).start
}

/** The context the globe needs. Everything renders through the composer, which owns its depth and MSAA. */
const CONTEXT: WebGLContextAttributes = {
  alpha: false, // opaque canvas: cheaper to composite, and no premultiplied edge against the page
  antialias: false, // MSAA happens in the post-processing target
  depth: false, // the composer owns its depth buffer
  stencil: false,
  premultipliedAlpha: true,
  preserveDrawingBuffer: false,
  powerPreference: 'high-performance',
}

/**
 * The renderer, on a WebGL 2 context created HERE: three r187 always asks for `alpha: true` when it creates the
 * context itself, so the `alpha: false` above only holds if the context is ours.
 */
function createRenderer({ canvas }: { canvas: unknown }): WebGLRenderer {
  const context = (canvas as HTMLCanvasElement).getContext('webgl2', CONTEXT) ?? undefined
  return new WebGLRenderer({ canvas: canvas as HTMLCanvasElement, context, ...CONTEXT })
}

function webgl2Available(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!c.getContext('webgl2')
  } catch {
    return false
  }
}

export function GlobeCanvas({ className, onPinSearch }: { className?: string; onPinSearch?: (place: Place) => void }) {
  const [supported] = useState(webgl2Available)
  const [failed, setFailed] = useState(false)
  // Counts the contexts the browser has given back: each one mounts the stage afresh (contextLoss.ts).
  const [restores, setRestores] = useState(0)
  const unavailable = !supported || failed

  useEffect(() => {
    // No WebGL: no globe is coming, and no sharp day map either (INT-01 / PH-13: deep and share links held the logo
    // the full sharp-map wait for one that never comes).
    if (unavailable) {
      useApp.getState().setGlobeReady(true)
      useApp.getState().setDayMapSharp(true)
    }
  }, [unavailable])

  return (
    <div className={cx(s.root, className)}>
      {unavailable ? (
        <GlobeFallback />
      ) : (
        <SceneBoundary onError={() => setFailed(true)}>
          <GlobeStage key={restores} onPinSearch={onPinSearch} onRestored={() => setRestores((n) => n + 1)} />
          {GL_DEBUG && (
            <Suspense fallback={null}>
              <DebugGl probe={glProbe} switches={GL_SWITCHES} active={GL_ACTIVE} urlWith={urlWithSwitches} />
            </Suspense>
          )}
        </SceneBoundary>
      )}
    </div>
  )
}

/**
 * One canvas with everything that belongs to it: its runtime, the scene and the DOM overlays that follow the scene.
 * Keyed by GlobeCanvas, so a context the browser restored gets all of it new; the store (the place, the pass, the
 * phase) is untouched, and the camera flies to where the app already is, as it does on a place page.
 */
function GlobeStage({ onPinSearch, onRestored }: { onPinSearch?: (place: Place) => void; onRestored: () => void }) {
  // Per-canvas runtime, shared by the scene (inside the R3F tree) and the DOM overlay (outside it). The tier is
  // refined from the GL context's capabilities when the scene mounts.
  const [runtime] = useState(() => {
    const rt = createRuntime(provisionalTier(detectMobile()), prefersReducedMotion(), Date.now())
    // One stable [d, d] tuple for the Canvas' dpr prop (see runtime.dprProp): AdaptiveDpr updates it in place.
    const d = initialDpr(rt.tier.mobile)
    rt.dprProp = [d, d]
    return rt
  })

  // Follow the OS setting live: camera cuts, frozen cloud drift and instant reveals switch with it.
  useEffect(() => {
    const mql = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mql) return
    const sync = () => {
      runtime.reducedMotion = mql.matches
    }
    sync()
    mql.addEventListener('change', sync)
    return () => mql.removeEventListener('change', sync)
  }, [runtime])

  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)
  const restored = useRef(onRestored)
  restored.current = onRestored
  useEffect(() => (canvas ? onContextRestored(canvas, () => restored.current()) : undefined), [canvas])

  return (
    <>
      <Canvas
        // DPR is managed by the scene (Scene.tsx AdaptiveDpr): phones start at 1.5, desktops at min(2, device).
        dpr={runtime.dprProp}
        gl={createRenderer}
        camera={{ fov: 30, near: 0.01, far: 400, position: [0, 0, 6] }}
        // Tone mapping happens in the post chain (Post.tsx); the renderer itself stays linear.
        flat
        onCreated={({ gl, camera }) => {
          // The CameraDirector owns the projection (aspect + an off-axis lens shift) and rewrites it every frame.
          // Without `manual`, R3F recomputes the projection synchronously whenever size or DPR changes, and an
          // adaptive-DPR step taken mid-frame then renders ONE frame without the lens shift: the globe flashes
          // to the centre of the screen and back. Manual cameras are never touched by R3F.
          ;(camera as typeof camera & { manual?: boolean }).manual = true
          gl.setClearColor(new Color(palette.ink0), 1)
          // Program info-log round trips on every link are a development aid, not a production cost.
          gl.debug.checkShaderErrors = import.meta.env.DEV || GL_DEBUG
          if (GL_DEBUG) {
            gl.domElement.addEventListener('webglcontextlost', () => glProbe.contextLost++)
            gl.domElement.addEventListener('webglcontextrestored', () => glProbe.contextRestored++)
          }
          setCanvas(gl.domElement)
        }}
        aria-hidden
      >
        <GlobeScene runtime={runtime} />
      </Canvas>
      <GlobeOverlay runtime={runtime} />
      <PinOverlay runtime={runtime} onSearch={onPinSearch} />
    </>
  )
}

class SceneBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: unknown) {
    console.error('[globe] scene failed, showing the static fallback', error)
    this.props.onError()
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

/** Static hairline globe for browsers without WebGL 2. Honest and quiet: the rest of the app still works. */
/** The fallback note: centred lines that never run past a phone's edges (GL-1). */
const NOTE: CSSProperties = { whiteSpace: 'normal', textAlign: 'center', lineHeight: 1.7, maxWidth: 'calc(100% - 32px)' }
/**
 * Stacked layouts (phones): the bottom of the screen belongs to the sheet / landing column, which covered the note
 * entirely. There it sits in the clear band under the HUD's top lines instead.
 */
const NOTE_TOP: CSSProperties = { ...NOTE, top: 'calc(var(--bezel-inset) + 64px)', bottom: 'auto' }
const NOTE_LINE: CSSProperties = { display: 'block', whiteSpace: 'nowrap' }

function GlobeFallback() {
  const m = useMsgs(enGlobe).noGl
  const top = useMediaQuery(STACKED_QUERY)
  // Meridians at 0°, ±30°, ±60° from the central one project to a line and two ellipses.
  const meridians = [30, 60]
  const parallels = [-60, -30, 0, 30, 60]
  return (
    <div className={s.fallback}>
      <svg className={s.fallbackFigure} viewBox="-101 -101 202 202" aria-hidden>
        <g fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke">
          <circle r="100" />
          <line x1="0" x2="0" y1="-100" y2="100" />
          {meridians.map((m) => (
            <ellipse key={`m${m}`} rx={Math.abs(Math.sin((m * Math.PI) / 180)) * 100} ry="100" />
          ))}
          {parallels.map((p) => {
            const y = -Math.sin((p * Math.PI) / 180) * 100
            const w = Math.cos((p * Math.PI) / 180) * 100
            return <line key={`p${p}`} x1={-w} x2={w} y1={y} y2={y} />
          })}
        </g>
      </svg>
      {/* GL-1: two centred lines, each short enough for a 375 px phone (one line ran off both edges at 390 px). */}
      <p className={cx('t-label', s.fallbackNote)} style={top ? NOTE_TOP : NOTE}>
        <span style={NOTE_LINE}>{m.title}</span>
        <span style={NOTE_LINE}>{m.reason}</span>
      </p>
    </div>
  )
}
