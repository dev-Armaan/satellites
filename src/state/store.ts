/**
 * Global app state (zustand). This is the integration contract between UI, engine and globe.
 * - UI writes intents (place, selection, time controls).
 * - Engine results land in `report`.
 * - Globe READS everything here and writes only `globeReady`, `hoveredNorad` (hovers it started),
 *   `simTime` (its frame loop owns the clock: throttled ~10 Hz in live/replay; per-frame time lives in
 *   src/state/sceneClock.ts), `cameraFlight` (on flight start/arrival only) and `dayMapSharp` (set once,
 *   when the first day-map upgrade above the boot level — 2k on the phone tier, 4k on the desktop tier —
 *   has been fully uploaded and swapped in, or at first light when the tier plan has no such step).
 * - UI layout owners write `uiInsets` (measured, from layout effects); the globe reads it with getState()
 *   inside its frame loop, never through a React subscription.
 */
import { create } from 'zustand'
import type { MessageRef, Pass, Place, ProgressEvent, Report } from '@/types'
import type { Share } from '@/lib/backend'

/** CSS px of the viewport covered by UI on each edge. The camera frames the globe inside what's left. */
export interface UiInsets {
  top: number
  right: number
  bottom: number
  left: number
}

/** Camera flight status. Times are performance.now() ms. Written by the globe's CameraDirector only. */
/** A pin on the globe (see AppState.pin). */
export interface DroppedPin {
  id: number
  lat: number
  lon: number
  /** 'chip': the landing's "Drop a pin" chip put it at the middle of the globe (its card says how to move it) */
  via?: 'globe' | 'chip'
}

export interface CameraFlight {
  id: number
  flying: boolean
  eta: number
  arrivedAt: number
}

export type Phase =
  | 'boot' // loading textures + catalog
  | 'idle' // landing: globe spinning, search visible
  | 'locating' // geocoding / geolocation
  | 'computing' // engine running; progress shown
  | 'results' // report available
  | 'error'

export type CameraIntent =
  | { kind: 'overview' } // slow orbit, whole Earth, slightly offset so the HUD breathes
  | { kind: 'place'; lat: number; lon: number } // fly to place, regional altitude
  | { kind: 'pass'; passId: string } // frame the pass: ground track + place, looking along-track
  | { kind: 'satellite'; norad: number } // chase cam near a satellite

export interface AppState {
  phase: Phase
  /**
   * The fault notice's message (phase 'error'): a ref into the 'app' namespace (src/app/messageRefs.ts: CATALOG_FAULT,
   * COMPUTE_FAULT), never a sentence. ErrorNotice shows it in the visitor's language; the usage stats log its English.
   */
  error?: MessageRef
  /** What failed, in the code's words (an error's name and message): for the usage stats, never shown. */
  errorCause?: string
  place?: Place
  report?: Report
  /** The [start, end] window of the report being computed (ms). Set by the controller before computing. */
  pendingWindow?: [number, number]
  progress?: ProgressEvent
  /**
   * What this search's engine said before the search was on screen (a link's search starts under the loading screen:
   * src/app/engineRun.ts): each step's first and newest line, with its time. The readout folds these first, so a step
   * that ran early shows how long it took. Undefined for a search that started when it was asked for.
   */
  progressBefore?: ProgressEvent[]
  selectedPassId?: string
  hoveredNorad?: number
  /** Simulation clock. When `live`, the globe advances simTime with wall time. */
  timeMode: 'live' | 'scrub' | 'replay'
  simTime: number
  /** Playback rate for 'replay' (sim seconds per real second) */
  replayRate: number
  camera: CameraIntent
  /** Measured UI coverage of the viewport; the camera frames around it. Survives reset(). */
  uiInsets: UiInsets
  cameraFlight: CameraFlight
  /** performance.now() ms until which UI entrances are animating; the globe defers heavy GPU work until then. */
  motionBusyUntil: number
  /** A shared pass opened via /?s=<id> (or /s/<id>) */
  shared?: Share
  aboutOpen: boolean
  /** Toggles */
  showAmbient: boolean
  globeReady: boolean
  /** The day map is sharper than the boot level (see header). Written once by the globe; survives reset(). */
  dayMapSharp: boolean
  catalogReady: boolean
  /**
   * A pin dropped on the globe (PinMarker): where "Search here" would search. `id` changes with every drop, so a pin
   * dropped on the same spot again still replays its drop.
   */
  pin?: DroppedPin
  /** The globe can take a dropped pin (WebGL scene mounted): the landing mentions it only then. */
  pinReady: boolean
  /** Bumped by the landing's "Drop a pin" chip: the globe drops a pin at the middle of the planet's disc. */
  pinAtCentre: number

  // actions
  setPhase: (p: Phase, error?: MessageRef, errorCause?: string) => void
  setPlace: (p?: Place) => void
  setPendingWindow: (w?: [number, number]) => void
  setReport: (r?: Report) => void
  setProgress: (e?: ProgressEvent) => void
  setProgressBefore: (lines?: ProgressEvent[]) => void
  selectPass: (id?: string) => void
  setHoveredNorad: (n?: number) => void
  setTimeMode: (m: AppState['timeMode']) => void
  setSimTime: (t: number) => void
  setReplayRate: (r: number) => void
  setCamera: (c: CameraIntent) => void
  /** Shallow merge; no-op when every provided value is within 1px of the current one. */
  setUiInsets: (p: Partial<UiInsets>) => void
  setCameraFlight: (f: CameraFlight) => void
  /** Extend motionBusyUntil to at least now + ms */
  holdMotion: (ms: number) => void
  setShared: (s?: Share) => void
  setAboutOpen: (v: boolean) => void
  setGlobeReady: (v: boolean) => void
  setDayMapSharp: (v: boolean) => void
  setCatalogReady: (v: boolean) => void
  setPin: (p?: DroppedPin) => void
  setPinReady: (v: boolean) => void
  dropPinAtCentre: () => void
  reset: () => void
}

export const useApp = create<AppState>((set) => ({
  phase: 'boot',
  timeMode: 'live',
  simTime: Date.now(),
  replayRate: 60,
  camera: { kind: 'overview' },
  uiInsets: { top: 0, right: 0, bottom: 0, left: 0 },
  cameraFlight: { id: 0, flying: false, eta: 0, arrivedAt: 0 },
  motionBusyUntil: 0,
  aboutOpen: false,
  showAmbient: true,
  globeReady: false,
  dayMapSharp: false,
  catalogReady: false,
  pinReady: false,
  pinAtCentre: 0,

  setPhase: (phase, error, errorCause) => set({ phase, error, errorCause }),
  setPlace: (place) => set({ place }),
  setPendingWindow: (pendingWindow) => set({ pendingWindow }),
  setReport: (report) => set({ report }),
  setProgress: (progress) => set({ progress }),
  setProgressBefore: (progressBefore) => set({ progressBefore }),
  selectPass: (selectedPassId) => set({ selectedPassId }),
  setHoveredNorad: (hoveredNorad) => set({ hoveredNorad }),
  setTimeMode: (timeMode) => set({ timeMode }),
  setSimTime: (simTime) => set({ simTime }),
  setReplayRate: (replayRate) => set({ replayRate }),
  setCamera: (camera) => set({ camera }),
  setUiInsets: (p) =>
    set((st) => {
      const cur = st.uiInsets
      const changed = (Object.keys(p) as (keyof UiInsets)[]).some((k) => Math.abs((p[k] ?? cur[k]) - cur[k]) > 1)
      return changed ? { uiInsets: { ...cur, ...p } } : {}
    }),
  setCameraFlight: (cameraFlight) => set({ cameraFlight }),
  holdMotion: (ms) => set((st) => ({ motionBusyUntil: Math.max(st.motionBusyUntil, performance.now() + ms) })),
  setShared: (shared) => set({ shared }),
  setAboutOpen: (aboutOpen) => set({ aboutOpen }),
  setGlobeReady: (globeReady) => set({ globeReady }),
  setDayMapSharp: (dayMapSharp) => set({ dayMapSharp }),
  setCatalogReady: (catalogReady) => set({ catalogReady }),
  setPin: (pin) => set({ pin }),
  setPinReady: (pinReady) => set({ pinReady }),
  dropPinAtCentre: () => set((st) => ({ pinAtCentre: st.pinAtCentre + 1 })),
  reset: () =>
    set({
      phase: 'idle',
      place: undefined,
      report: undefined,
      shared: undefined,
      pendingWindow: undefined,
      progress: undefined,
      progressBefore: undefined,
      selectedPassId: undefined,
      timeMode: 'live',
      simTime: Date.now(),
      camera: { kind: 'overview' },
      pin: undefined,
    }),
}))

export const selectSelectedPass = (s: AppState): Pass | undefined =>
  s.report?.passes.find((p) => p.id === s.selectedPassId)
