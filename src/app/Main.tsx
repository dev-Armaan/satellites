/**
 * The production app: composition of the shell, the globe and the results panel.
 *
 * Loading (K3): this module and the shell (HUD, boot log, landing) are in the first bundle; the heavy parts
 * are separate chunks:
 *   globe     three.js + R3F + post: requested as soon as this module evaluates (and modulepreloaded by
 *             index.html in production), so it downloads while the boot log runs
 *   results   the results panel, pass detail and share sheet: prefetched at landing idle, on the first focus
 *             of the search field, and at once for deep links / share links
 *   about     prefetched at landing idle, and after a deep or share link's results entrance; opening About waits
 *             for its chunk before setting aboutOpen (the globe pauses on aboutOpen), so the globe never freezes
 *             on an empty frame while the chunk downloads (R2K4)
 */
import { memo, useEffect, useLayoutEffect, useRef, useState, type ComponentType } from 'react'
import { createPortal } from 'react-dom'
import { backStack, onBackSettled, watchLayer } from '@/lib/backStack'
import { bootPlace, homePath } from '@/lib/placePage'
import { useApp, type Phase } from '@/state/store'
import type { Place } from '@/types'
import type { ResultsViewProps } from '@/ui/results'
import { Hud } from '@/ui/hud'
import { Landing } from '@/ui/landing'
import { prefersReducedMotion } from '@/ui/system'
import { exitBootCurtain } from './bootCurtain'
import { chunk, requestChunk, type Chunk } from './chunks'
import { afterLandingEntrance, boot, failPanel, isShareUnresolved, loadEngine, noteGlobeCode, resetToLanding, retryReport, runReport, writeUrl } from './controller'
import { ErrorNotice } from './ErrorNotice'
import s from './App.module.css'

// ── code-split chunks (./chunks.ts) ──────────────────────────────────────────────────────────────
const loadGlobe = chunk(() => import('@/globe'))
const loadResults = chunk(() => import('@/ui/results'))
const loadAbout = chunk(() => import('@/ui/pages'))

/**
 * The module of `c` once loaded; undefined until then. It is asked for while `wanted` (again after a failure:
 * requestChunk), `onFail` hears when no attempt worked, and an arrival re-renders the caller whoever asked for it.
 */
function useChunk<T>(c: Chunk<T>, wanted: boolean, onFail?: (err: unknown) => void): T | undefined {
  const [, setTick] = useState(0)
  const loaded = c.loaded
  useEffect(() => {
    if (loaded) return
    const arrived = () => setTick((n) => n + 1)
    // It may have arrived between this render and this effect.
    if (c.loaded) return arrived()
    return c.onLoad(arrived)
  }, [c, loaded])
  useEffect(() => (wanted && !loaded ? requestChunk(c, { onFail }) : undefined), [c, wanted, loaded, onFail])
  return loaded
}

// Dev sandboxes import this module too (App.tsx imports it statically for production): no side effects there.
const isApp = typeof location !== 'undefined' && !(import.meta.env.DEV && /[?&]sandbox=/.test(location.search))
// The globe is on the critical path to first light: start it now, in parallel with the shell's first render.
// The controller hears when it is in: a link's search starts then, under the loading screen (controller.ts startAhead).
if (isApp) loadGlobe.onLoad(noteGlobeCode)
if (isApp) void loadGlobe()
// A deep link or share link goes from boot straight to computing: its panel must be ready by then. A place page
// (/place/<slug>) is such a link with nothing in its query: it asked for the panel only once the curtain had lifted.
if (isApp && (/[?&](q|s)=/.test(location.search) || bootPlace())) void loadResults()

// Instrumentation for timing scripts: only in a `vite build --mode inspect` bundle (and dev), never in production.
if (isApp && (import.meta.env.DEV || import.meta.env.MODE === 'inspect')) Object.assign(window, { __app: useApp })


/** Warm the panels the user is about to need (idle time after the landing's entrance). */
function prefetchChunks() {
  void loadEngine().catch(() => undefined)
  void loadResults()
  void loadAbout()
}

/**
 * R2K4: About opens once its chunk is in. The globe pauses its frame loop on aboutOpen, so setting it before the
 * page can mount would freeze the globe on a frame with no About over it for as long as the chunk takes (a cold
 * chunk on 4G: ~1 s). Repeat calls while the load is pending are ignored; a failed load leaves About closed.
 */
let aboutPending = false
function openAbout() {
  if (aboutPending || useApp.getState().aboutOpen) return
  // Already in (prefetched): open in this very event, so the page commits in the tap's own task.
  if (loadAbout.loaded) {
    useApp.getState().setAboutOpen(true)
    return
  }
  aboutPending = true
  void loadAbout().then(
    () => {
      aboutPending = false
      useApp.getState().setAboutOpen(true)
    },
    () => {
      aboutPending = false
    },
  )
}

/**
 * The globe and the results panel render through memoised slots with stable props: Main re-renders on phase,
 * error, About and chunk arrivals, and none of those may re-render the 3D scene's React tree or the whole
 * results panel (opening About re-rendered the panel: ~1.2 s on a 4× throttled phone before its dialog could
 * commit, with the globe already paused).
 */
type GlobeView = ComponentType<{ className?: string; onPinSearch?: (place: Place) => void }>
const GlobeSlot = memo(function GlobeSlot({ View }: { View: GlobeView }) {
  return <View className={s.scene} onPinSearch={searchFromPin} />
})
/** "Search here" on a pin dropped on the globe (globe/PinOverlay.tsx). */
const searchFromPin = (p: Place) => void runReport(p)
const searchFromPanel = (p: Place) => void runReport(p)
const searchFromLanding = (p: Place) => void runReport(p)
const ResultsSlot = memo(function ResultsSlot({ View }: { View: ComponentType<ResultsViewProps> }) {
  return <View onBack={resetToLanding} onRetry={retryReport} onSearch={searchFromPanel} />
})
const closeAbout = () => useApp.getState().setAboutOpen(false)
/** The HUD's wordmark: back to the landing from a search (as "New search" / Esc do); on the landing it clears a pin. */
function goHome() {
  const st = useApp.getState()
  if (st.phase === 'boot') return
  if (st.aboutOpen) st.setAboutOpen(false)
  if (st.phase === 'results' || st.phase === 'computing' || st.phase === 'error') resetToLanding()
  else if (st.pin) st.setPin(undefined)
}
/** The address bar for what is on screen now (the back stack calls it when its own history move lands). */
function writeUrlNow() {
  const st = useApp.getState()
  if (st.place && (st.phase === 'results' || st.phase === 'computing' || st.phase === 'error')) writeUrl(st.place, st.phase === 'results' ? st.selectedPassId : undefined)
  // The landing: a clean address, except a share link the visitor hasn't moved on from (?s=: it may still open, or a
  // reload may find it). From the controller's state, not the address: after their own search the landing is clean.
  else if (st.phase === 'idle' && !isShareUnresolved()) history.replaceState(history.state, '', homePath(location.pathname))
}
/** Back out of a pass to the list (as the panel's "All passes"): live time, the camera back on the place. */
function closePass() {
  const st = useApp.getState()
  st.selectPass(undefined)
  st.setTimeMode('live')
  st.setSimTime(Date.now())
  if (st.place) st.setCamera({ kind: 'place', lat: st.place.lat, lon: st.place.lon })
}

/**
 * Landing entrance delay after `prev` (K5). After boot the kicker starts at 200 ms and the headline's first line
 * (delay + 140 ms) at 340 ms, with the loading screen's ink about half gone (bootCurtain: the ink fades 120 → 680 ms),
 * so the landing wipes in under the fading ink (DESIGN §10; the wipes are CSS-timed from the curtain's first frame,
 * PH-05). By then the gliding wordmark has risen above the headline (measured at 1440×900 and the phones: no visible
 * overlap). Quickly after a results exit.
 */
function enterDelayAfter(prev: Phase): number {
  if (prefersReducedMotion()) return 0
  if (prev === 'boot') return 200
  return 160
}

export default function Main() {
  const phase = useApp((st) => st.phase)
  const error = useApp((st) => st.error)
  const about = useApp((st) => st.aboutOpen)

  // The loading screen (index.html) leaves in the commit that mounts what boot led to, before its first paint.
  useLayoutEffect(() => {
    if (phase !== 'boot') exitBootCurtain()
  }, [phase])

  useEffect(() => {
    void boot()
  }, [])

  // Landing entrance delay: decided when the landing (re)appears, from the phase it follows.
  const prevPhase = useRef<Phase>(phase)
  const enterDelay = useRef(0)
  if (phase !== prevPhase.current) {
    const landing = (p: Phase) => p === 'idle' || p === 'locating'
    if (landing(phase) && !landing(prevPhase.current)) enterDelay.current = enterDelayAfter(prevPhase.current)
    prevPhase.current = phase
  }

  // Warm the results and About chunks once the landing has finished its entrance, once a deep or share link's
  // results have landed (those never idle on the landing), and on the first focus of a text field (someone
  // about to search). prefetchChunks is idempotent.
  useEffect(() => {
    if (phase === 'idle' || phase === 'results') afterLandingEntrance(prefetchChunks)
  }, [phase])
  useEffect(() => {
    const onFocus = (e: FocusEvent) => {
      if ((e.target as HTMLElement | null)?.closest?.('input')) prefetchChunks()
    }
    document.addEventListener('focusin', onFocus)
    return () => document.removeEventListener('focusin', onFocus)
  }, [])

  // The back gesture / browser Back closes the top layer (src/lib/backStack.ts): the results of a search (back to the
  // landing) and an open pass (back to the list) are store layers; the photo viewer, the share sheet, About and the
  // phone's search mode register themselves.
  // Subscribed before the ?p= writer below (zustand calls listeners in subscription order). When one of the stack's own
  // history moves lands (a close from the UI), the address bar is rewritten for what is on screen.
  useEffect(() => {
    if (!backStack()) return
    onBackSettled(writeUrlNow)
    const sub = useApp.subscribe
    const get = useApp.getState
    const offResults = watchLayer(sub, get, 'results', (st) => st.phase === 'computing' || st.phase === 'results' || st.phase === 'error', resetToLanding)
    const offPass = watchLayer(sub, get, 'pass', (st) => st.phase === 'results' && !!st.selectedPassId, closePass)
    // A reload (or a return the back-forward cache didn't keep) restores layers from the address and adopts the entries
    // it finds; once what comes back has landed, line the history up with it: the results (a pass from ?p= is selected
    // in the same tick), or a boot that settles on the landing or an error, which restores no layer of its own (N1: a
    // reload with About or search mode open over the landing would otherwise leave a dead Back).
    let reconcileTimer = 0
    const offReconcile = sub((st, prev) => {
      const settled =
        (st.phase === 'results' && prev.phase !== 'results') ||
        (prev.phase === 'boot' && (st.phase === 'idle' || st.phase === 'error'))
      if (settled) {
        window.clearTimeout(reconcileTimer)
        reconcileTimer = window.setTimeout(() => backStack()?.reconcile(), 0)
      }
    })
    return () => {
      offResults()
      offPass()
      offReconcile()
      window.clearTimeout(reconcileTimer)
    }
  }, [])

  // Keep ?p=<passId> in sync with the selection so links are always shareable (including a pass preselected by
  // a share or deep link, which is selected in the same tick as the phase turns to results).
  useEffect(
    () =>
      useApp.subscribe((st, prev) => {
        if (!st.place || st.phase !== 'results') return
        if (st.selectedPassId !== prev.selectedPassId || (prev.phase !== 'results' && st.selectedPassId)) writeUrl(st.place, st.selectedPassId)
      }),
    [],
  )

  // Global keys: Esc backs out, "?" opens About ("؟" is the same key on an Arabic layout).
  useEffect(() => {
    // Overlays (About, ShareSheet, search suggestions) handle their own keys first and stop/prevent them.
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || useApp.getState().aboutOpen) return
      const typing = (e.target as HTMLElement)?.closest?.('input, textarea, [contenteditable="true"]')
      if (e.key === 'Escape') {
        if (typing) return
        const st = useApp.getState()
        if (st.selectedPassId) return st.selectPass(undefined)
        if (st.phase === 'results' || st.phase === 'computing' || st.phase === 'error') resetToLanding()
      } else if (!typing && (e.key === '?' || e.key === '\u061f')) {
        openAbout()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const panel = phase === 'computing' || phase === 'results'
  // R2K3: the results panel mounts one frame after the phase change, so the submit task carries only the
  // landing's exit and the camera's new intent; the panel's mount commit runs in the next frame's task (one
  // frame under the lifting boot curtain on a deep link).
  const [panelReady, setPanelReady] = useState(false)
  useEffect(() => {
    if (!panel) {
      setPanelReady(false)
      return
    }
    const raf = requestAnimationFrame(() => setPanelReady(true))
    return () => cancelAnimationFrame(raf)
  }, [panel])
  const GlobeCanvas: GlobeView | undefined = useChunk(loadGlobe, true)?.GlobeCanvas
  // The panel's own code could not be had: the fault notice, whose "Try again" runs the search and asks again.
  const ResultsView = useChunk(loadResults, panel, failPanel)?.ResultsView
  const AboutPage = useChunk(loadAbout, about)?.AboutPage

  return (
    <div className={s.root}>
      {GlobeCanvas ? <GlobeSlot View={GlobeCanvas} /> : null}
      <div className={s.layer}>
        {(phase === 'idle' || phase === 'locating') && <Landing onSubmit={searchFromLanding} enterDelay={enterDelay.current} />}
        {/* One persistent panel from computing through results (decision #10): the same instance survives the phase change. */}
        {panel && panelReady && ResultsView ? <ResultsSlot key="results" View={ResultsView} /> : null}
        {phase === 'error' && <ErrorNotice message={error} onRetry={retryReport} onBack={resetToLanding} />}
      </div>
      <Hud onAbout={openAbout} onHome={goHome} />
      {/* On <body>, beside the photo viewer: About ("?") opened over the viewer paints over it (CR-7). The root is
          position: fixed, a stacking context of its own, so a z-index inside it never reaches above the viewer. */}
      {about && AboutPage ? createPortal(<AboutPage onClose={closeAbout} />, document.body) : null}
    </div>
  )
}
