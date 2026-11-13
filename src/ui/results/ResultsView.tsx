/**
 * <ResultsView/>: the ONE results panel, from computing through results to a pass (decision #10).
 * Mounted for phase 'computing' and 'results'; it keys off the phase, not off the report.
 *
 *   desktop  right-docked panel (Sheet). While computing it is as tall as its readout; when results
 *            land it grows to the full dock above the timeline strip (beside it on short screens).
 *   phones   bottom sheet with content-measured snaps: computing = the readout; overview = header +
 *            the gallery's first card (the peek); a pass = flight (header + footer), then image.
 *
 * Contents swap in two beats (old out 160 ms, new in 240 ms), never as a page cut. Overview:
 * 01 / SUMMARY (headline, the photo gallery, readouts) · 02 / PASSES · 03 / WATCHED CONTINUOUSLY, and the
 * 04 / TIMELINE strip. A pass with a photo ('photo'): the gallery (persistent while you swipe, owner B), then
 * its readouts, 01 / GEOMETRY, 02 / REPLAY, with Share / Replay in the footer; a quiet selection from the
 * gallery changes the words in place, never the panel. A pass with no photo: its plan view.
 *
 * Keys: ←/→ walk the photos (the gallery) or, on a pass without one, step through passes of its verdict;
 * F opens the photo large (the lightbox); Space plays/pauses the replay. Esc is NOT handled here (except
 * inside the inline search field and the lightbox): the app shell owns it.
 */
import { createPortal, flushSync } from 'react-dom'
import { startTransition, useCallback, useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { timeZoneAt } from '@/imagery'
import { useBackLayer } from '@/lib/backStack'
import { SHORT_LANDSCAPE_QUERY } from '@/lib/layout'
import { announceUiEntrance } from '@/lib/uiEvents'
import type { ShareFrom } from '@/lib/telemetry'
import { useApp } from '@/state/store'
import { useTimelapseUi } from '@/state/timelapse'
import type { Pass, Place } from '@/types'
import { ShareSheet } from '@/ui/share'
import { Button, Glyph, Rule, Sheet, cx, safeAreaTop, useIsMobile, useMediaQuery, useReducedMotion, useViewportHeight } from '@/ui/system'
import { ComputingBody } from './ComputingBody'
import { Gallery, galleryCtl } from './Gallery'
import { Lightbox } from './Lightbox'
import { GeoWatchers } from './GeoWatchers'
import { DetailHeader, OverviewHeader, rememberPlace } from './Headers'
import { PassDetail, PhotoPassView } from './PassDetail'
import { PassList } from './PassList'
import { Headline, MoreLine, Notes, Verdicts, enterStyle } from './Summary'
import { Timeline } from './Timeline'
import { TimelapseLayer, TimelapseRow } from './TimelapseEntry'
import { clearPass, focusPass, quiet, startReplay, togglePlay } from './actions'
import { crossed, onSceneFrame } from './capture'
import { useGallery } from './gallery'
import { isClouded } from './lib/bestLook'
import { captureFor } from './lib/captures'
import { replayWindow } from './lib/replay'
import { stepPass } from './lib/timeline'
import { useResultsModel, type ResultsModel } from './model'
import { useOnce } from './once'
import { SHORT_DESK_QUERY, exitTimeline, headHeight, lastShellUnmount, publishSheetInset, rememberComputingSnap, lastComputingSnapPx, useAnimatedHeight, useInsets, useSheetGeometry, useShellExit, useStagedKey } from './shell'
import s from './results.module.css'

export interface ResultsViewProps {
  /** Back to search. Defaults to store.reset(); the app passes its controller's reset (aborts work, clears the URL). */
  onBack?: () => void
  /** Re-run the same place (e.g. after an archive outage) */
  onRetry?: () => void
  /** Search another place inline from the results header */
  onSearch?: (place: Place) => void
}

/** R3-5, phones: the clock not replaying this long (paused, scrubbed) once the camera is there raises the sheet. */
const SHEET_QUIET_MS = 600
/** Sim time frozen this long with no camera flight, the globe never having taken up the replay: no globe is drawing, raise. */
const SHEET_STALL_MS = 1500
/**
 * The same while the globe IS replaying (U-4): on arrival it holds the clock up to 1.5 s for the pass's image to reach
 * the GPU (acquisition.ts DECAL_WAIT_MS), longer on a slow phone. That hold is the approach, not a stall: raising on
 * it put the sheet at full height before the dive.
 */
const SHEET_REPLAY_STALL_MS = 4500
/** Phones: the globe band (px, below the HUD band) the capture snap keeps when the pass photo can stay ≥ 240 px (U-4). */
const PHONE_CAPTURE_BAND = 150
/** …else at least this band with a pass photo of at least PHONE_MIN_SQUARE px; shorter than that, the top snap (R2R3). */
const PHONE_MIN_BAND = 120
const PHONE_MIN_SQUARE = 200
/** Never hold the sheet low longer than this (a real approach + dive takes 6–8 s). */
const SHEET_CAP_MS = 14_000
/** Phone snaps that are fractions of the viewport (the measured ones are px). */
const MID = 0.62
const TOP = 0.92
/** Desktop dock height the computing panel starts from when the panel is remounted at results. */
let lastComputingH = 0

/**
 * Phones (PH-03): the snaps each kind of view was last given (px, for one viewport height), so the sheet can go to a
 * view's snap in the beat its content swaps in, before that content is measured.
 */
const sheetMemo: Partial<Record<'overview' | 'photo' | 'plan', { key: string; vh: number; snaps: number[] }>> = {}
/**
 * A pass view's flight snap before any was measured: the grip, the one-line pass header with its reserved replay
 * strip, and the footer (236 px at every phone width measured, 375 to 430), plus the bottom safe area.
 */
/** Phones: the overview's globe snap never goes below this visible height (px): the grip and the search bar. */
const MIN_GLOBE_SNAP_PX = 150
const FLIGHT_EST_PX = 236
let safeBottomPx = 0
/** The bottom safe-area inset, read once off the critical path (an idle probe after the panel mounts). */
function measureSafeBottom() {
  if (typeof document === 'undefined' || safeBottomPx) return
  const el = document.createElement('div')
  el.style.cssText = 'position:fixed;left:0;bottom:0;width:0;height:env(safe-area-inset-bottom,0px);visibility:hidden;pointer-events:none'
  document.body.appendChild(el)
  safeBottomPx = el.offsetHeight
  el.remove()
}

function predictSnaps(key: string, reportKey: string, vh: number, reduced: boolean, overviewIndex: number): { snaps: number[]; index: number } | undefined {
  if (key === 'computing') return { snaps: [lastComputingSnapPx() ?? vh * 0.4, TOP], index: 0 }
  if (key === 'overview') {
    const o = sheetMemo.overview
    return o && o.key === reportKey && o.vh === vh ? { snaps: o.snaps, index: Math.min(overviewIndex, o.snaps.length - 1) } : undefined
  }
  const kind = key === 'photo' ? 'photo' : 'plan'
  const m = sheetMemo[kind] ?? sheetMemo.photo ?? sheetMemo.plan
  // A pass opens at its flight snap (reduced motion: the image snap at once), as the selection effect below sets.
  const index = reduced ? 1 : 0
  if (m && m.vh === vh) return { snaps: sheetMemo[kind]?.vh === vh ? m.snaps : [m.snaps[0], vh * 0.7, TOP], index }
  return { snaps: [Math.min(Math.max(vh * 0.4, vh - 232), FLIGHT_EST_PX + safeBottomPx), vh * 0.7, TOP], index }
}


export function ResultsView({ onBack, onRetry, onSearch }: ResultsViewProps) {
  const phase = useApp((st) => st.phase)
  const place = useApp((st) => st.place)
  const shared = useApp((st) => st.shared)
  // PERF-03: the report lands in a deferred render, so the arrival never blocks a frame of the flight.
  const report = useDeferredValue(useApp((st) => st.report))
  const selectedId = useApp((st) => st.selectedPassId)
  const mobile = useIsMobile()
  const shortLandscape = useMediaQuery(SHORT_LANDSCAPE_QUERY) && !mobile
  const shortDesk = useMediaQuery(SHORT_DESK_QUERY) && !mobile && !shortLandscape
  const reduced = useReducedMotion()
  const computing = phase !== 'results' || !report
  const liveModel = useResultsModel(computing ? undefined : report)
  // While the old overview fades out for a new computing run, it keeps rendering its last model.
  const lastModel = useRef(liveModel)
  if (liveModel) lastModel.current = liveModel
  const model = liveModel
  const back = onBack ?? (() => useApp.getState().reset())

  const bodyRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLElement | null>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const listScroll = useRef(0)
  // The open share sheet: a pass's, or (no pass) the week's summary; `from` is the Share that opened it.
  const [sharing, setSharing] = useState<{ pass?: Pass; from: ShareFrom } | null>(null)
  const [searching, setSearching] = useState(false)
  const [inviteClosed, setInviteClosed] = useState(false)
  const [snap, setSnap] = useState(0)
  const overviewSnap = useRef(0)
  /**
   * Phones, the overview: pulled down to its globe snap, below the peek (only the header shows, the globe has the
   * screen). Kept apart from `snap` so the overview's other snaps keep their indices (0 peek, 1 mid, 2 top) for every
   * caller; the globe snap is the overview list's first entry, and `snap` is shifted past it while this is false.
   */
  const [collapsed, setCollapsed] = useState(false)
  /** The snap list on screen is the overview's (with its globe snap first): onSnapChange maps indices back. */
  const overviewListRef = useRef(false)
  // When computing started (T+ readout): reset in the render that shows a new place, or a re-run of the same one
  // (LAP-02: a passive effect reset it after the first paint, so a New search first showed the last search's
  // elapsed time, 'T+50.93 S', for a few frames).
  const placeKey = place ? `${place.lat},${place.lon}` : ''
  const runStart = useRef({ key: placeKey, computing, t: performance.now() })
  if (runStart.current.key !== placeKey || (computing && !runStart.current.computing)) runStart.current = { key: placeKey, computing, t: performance.now() }
  else runStart.current.computing = computing
  const t0 = runStart.current.t
  const placeTz = useMemo(() => (place ? timeZoneAt(place.lat, place.lon) : undefined), [placeKey])

  // Continuity across a remount (the current app mounts a fresh view at the computing → results
  // switch): no second entrance for the panel.
  const [continued] = useState(() => performance.now() - lastShellUnmount.at < 400 && lastShellUnmount.phase === 'results')

  useLayoutEffect(() => {
    sectionRef.current = (bodyRef.current?.parentElement as HTMLElement | null) ?? null
  })

  // ── what is shown ──────────────────────────────────────────────────────────────────────
  const selectedValid = !!selectedId && !!model?.passById.has(selectedId)
  // A pass with a photo is the 'photo' view: the gallery persists while the selection moves (owner B).
  const selectedIsPhoto = selectedValid && !!model?.photoByPass.has(selectedId!)
  const viewKey = computing ? 'computing' : selectedValid ? (selectedIsPhoto ? 'photo' : `pass:${selectedId}`) : 'overview'
  // Remember where the list was before leaving it.
  useEffect(() => {
    if (viewKey !== 'overview' && viewKey !== 'computing' && bodyRef.current && !bodyRef.current.querySelector('[data-detail-root]')) listScroll.current = bodyRef.current.scrollTop
  }, [viewKey])
  const staged = useStagedKey(viewKey)
  const shownModel = lastModel.current
  const livePhotoPass = selectedIsPhoto && model ? model.passById.get(selectedId!) : undefined
  const lastPhotoPass = useRef<Pass | undefined>(undefined)
  if (livePhotoPass) lastPhotoPass.current = livePhotoPass
  const shownPass =
    staged.shown === 'photo' ? (livePhotoPass ?? lastPhotoPass.current) : staged.shown.startsWith('pass:') ? shownModel?.passById.get(staged.shown.slice(5)) : undefined
  const isDetailKey = (k: string) => k === 'photo' || k.startsWith('pass:')
  const shownKey = shownPass ? staged.shown : staged.shown === 'computing' && !computing ? 'computing' : isDetailKey(staged.shown) ? 'overview' : staged.shown
  const headerKeyOf = (k: string) => (isDetailKey(k) ? k : 'overview')
  const headerChanging = headerKeyOf(viewKey) !== headerKeyOf(staged.shown)
  const headerEntering = staged.stage === 'in' && headerKeyOf(staged.prev) !== headerKeyOf(staged.shown)
  const prevPass = staged.prev.startsWith('pass:') ? shownModel?.passById.get(staged.prev.slice(5)) : undefined
  const dir = !shownPass ? -1 : prevPass && prevPass.tClosest > shownPass.tClosest ? -1 : 1
  const handoff = staged.prev === 'computing' && shownKey === 'overview'

  // Scroll: a pass opens at the top (while its content is still at opacity ~0, so the jump is never seen).
  // The overview's list position comes back once its sections have mounted (below).
  useLayoutEffect(() => {
    const body = bodyRef.current
    if (!body || shownKey === 'overview') return
    const id = requestAnimationFrame(() => {
      body.scrollTop = 0
    })
    return () => cancelAnimationFrame(id)
  }, [shownKey])

  useEffect(() => {
    if (!mobile) return
    const ric = (window as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback
    const id = ric ? ric(measureSafeBottom, { timeout: 3000 }) : window.setTimeout(measureSafeBottom, 1500)
    return () => {
      const cic = (window as { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback
      if (ric && cic) cic(id)
      else window.clearTimeout(id)
    }
  }, [mobile])

  // The results handoff: let the globe keep its GPU work for after the entrance. In the commit itself (a layout effect),
  // so the hold and the phone's one skipped globe frame (INT-04) apply to the very next frame, the one that lays the
  // new panel out.
  useLayoutEffect(() => {
    if (!handoff) return
    useApp.getState().holdMotion(900)
    announceUiEntrance()
  }, [handoff])

  // Staging (PERF-03, R2R7): the list, the geostationary frames and the compact timeline mount one frame
  // after the summary, in a transition, on EVERY overview entrance (back from a pass costs one short task).
  // Keyed on the report SHOWN (R2R8): the outgoing overview keeps its sections through a New search swap-out.
  const keyOf = (r: { windowEnd: number; place: { lat: number; lon: number } }) => `${r.windowEnd}:${r.place.lat},${r.place.lon}`
  const reportKey = model ? keyOf(model.report) : ''
  const shownReportKey = lastModel.current ? keyOf(lastModel.current.report) : ''
  const entries = useRef({ key: '', n: 0 })
  if (entries.current.key !== shownKey) {
    if (shownKey === 'overview') entries.current.n++
    entries.current.key = shownKey
  }
  const fullKey = shownReportKey ? `${shownReportKey}:${entries.current.n}` : ''
  const [fullFor, setFullFor] = useState('')
  const full = !!fullKey && fullFor === fullKey
  useEffect(() => {
    if (!fullKey || fullFor === fullKey) return
    const id = requestAnimationFrame(() => startTransition(() => setFullFor(fullKey)))
    return () => cancelAnimationFrame(id)
  }, [fullKey, fullFor])
  // A new place (or a re-run) opens at the top of its own overview, never at the last place's list position (U-2:
  // that opened the new results scrolled past the hero, with the sheet below its top snap where the body can't scroll).
  const scrollFor = useRef('')
  useLayoutEffect(() => {
    if (!reportKey || scrollFor.current === reportKey) return
    scrollFor.current = reportKey
    listScroll.current = 0
  }, [reportKey])
  // Back to the overview: the list comes back where the user left it, once its sections are there. Read and written
  // from an observer's callback (after layout, before paint): reading scrollTop in the commit that mounts the list
  // forced a layout of all of it, 131 ms at 4× CPU (U-1). Done once the content is tall enough (the list may mount a
  // beat later, on the final report), or given up after 2 s.
  useLayoutEffect(() => {
    const body = bodyRef.current
    const inner = innerRef.current
    if (!full || shownKey !== 'overview' || !body || !inner || typeof ResizeObserver === 'undefined') return
    const want = listScroll.current
    const until = performance.now() + 2000
    const ro = new ResizeObserver(() => {
      const fits = body.scrollHeight - body.clientHeight >= want - 1
      if (fits && Math.abs(body.scrollTop - want) > 1) body.scrollTop = want
      if (fits || performance.now() > until) ro.disconnect()
    })
    ro.observe(inner)
    return () => ro.disconnect()
  }, [full, shownKey])
  // The desktop timeline strip mounts once per report (it persists across a pass and back).
  const [dockFor, setDockFor] = useState('')
  useEffect(() => {
    if (full && reportKey && dockFor !== reportKey) setDockFor(reportKey)
  }, [full, reportKey, dockFor])
  const dockFull = !!reportKey && dockFor === reportKey

  // A new report (a new place) starts its gallery on the cover again.
  useEffect(() => {
    if (reportKey) useGallery.getState().reset(reportKey)
  }, [reportKey])

  useEffect(() => {
    if (model) rememberPlace(model.report.place)
  }, [model?.report.place])

  // ── selection ──────────────────────────────────────────────────────────────────────────
  const select = useCallback((p: Pass) => {
    focusPass(p)
  }, [])
  const selected = selectedValid && model ? model.passById.get(selectedId!) : undefined
  useExternalFocus(selectedId, model)
  useReplayGuard(selected, () => mobile && setSnap(1))
  useDeselectCleanup()
  useKeys(model, selected, select, !!sharing || searching)
  const timelapseOpen = useTimelapseUi((t) => !!t.open)
  const closeShare = useCallback(() => setSharing(null), [])
  const shareWeek = useCallback(() => setSharing({ from: 'headline' }), [])
  const shareHero = useCallback((pass: Pass) => setSharing({ pass, from: 'hero' }), [])
  const sharePass = useCallback((pass: Pass) => setSharing({ pass, from: 'pass' }), [])
  const shareViewed = useCallback((pass: Pass) => setSharing({ pass, from: 'viewer' }), [])
  // A selection that vanished (report replaced by the final one) falls back to the overview.
  useEffect(() => {
    if (selectedId && model && !model.passById.has(selectedId)) clearPass()
  }, [selectedId, model])

  // ── phone sheet: content-measured snaps and the two-beat pass choreography ─────────────
  const geo = useSheetGeometry(bodyRef, innerRef, mobile, shownKey, [shownKey, full])
  // The cached viewport height: reading window.innerHeight in a render forced a synchronous layout of whatever the
  // last commit mounted (114 ms at 4× CPU on a phone, right after the results landed: U-1).
  const vh = useViewportHeight()
  if (geo && geo.key === 'computing') rememberComputingSnap(Math.min(vh * 0.8, geo.top + geo.pad + geo.content + 18))
  // The snaps (and index) the sheet was last given: a view whose content is not measured yet holds the sheet there.
  const lastShown = useRef<{ snaps: number[]; index: number } | null>(null)
  let heldIndex: number | undefined
  /** heldIndex is an index into the list on screen already (held from lastShown), not a logical overview snap. */
  let heldPhysical = false
  let overviewList = false
  // PH-03: the sheet moves in the same beat as the content swap. While the outgoing view fades out (and until the
  // incoming one is measured) it goes to the incoming view's snaps when they are known: the computing readout's last
  // measure, this report's overview as last measured, a pass view as last measured (the first time, its flight snap
  // estimated from the one-line pass header and the footer). It no longer holds the old view's height over an empty
  // body and moves only once the new content is in (a blank sheet, then a second beat).
  const predicted = mobile && viewKey !== shownKey && shownKey !== 'computing' ? predictSnaps(viewKey, shownReportKey, vh, reduced, overviewSnap.current) : undefined
  const snaps = (() => {
    if (predicted) {
      heldIndex = predicted.index
      overviewList = viewKey === 'overview'
      return predicted.snaps
    }
    if (shownKey === 'computing') {
      // R2R8: the computing snap is measured from the readout; while the outgoing overview is still mounted,
      // use the readout's last measure, so the sheet glides down once, in one direction.
      const c = geo && geo.key === 'computing' ? Math.min(vh * 0.8, geo.top + geo.pad + geo.content + 18) : (lastComputingSnapPx() ?? vh * 0.4)
      return [c, TOP]
    }
    if (!geo) return [0.42, MID, TOP]
    // The content changed (a pass opened, back to the overview, results landed) but its geometry is the previous
    // view's for a frame: hold the sheet where it is (the same snap list, so the same sheet height, and the same
    // index), so it glides once, to the measured target, never first toward a stale one (A1: one move per element
    // per action).
    if (geo.key !== shownKey && lastShown.current) {
      heldIndex = lastShown.current.index
      heldPhysical = true
      return lastShown.current.snaps
    }
    const pad = geo.pad
    if (shownKey === 'overview') {
      const peek = geo.peekEnd !== undefined ? geo.top + pad + geo.peekEnd + 12 : vh * 0.36
      // The peek ends under the hero's caption. A short phone (375×667) may go past 60 % for it, as long as a
      // 232 px band (HUD + globe) stays above the sheet (U-6: the caption was cut in half there); the mid snap
      // stays above the peek.
      const p0 = Math.min(peek, Math.max(vh * (MID - 0.02), vh - 232))
      // The globe snap: the header alone (the place, the window and the search bar), the globe above it on most of the
      // screen. Pulled down to from the peek; results never open on it.
      const globe = Math.max(MIN_GLOBE_SNAP_PX, Math.min(geo.top + 4, p0 - 80))
      const list = [globe, p0, Math.max(vh * MID, p0 + 60), TOP]
      overviewList = true
      if (mobile && shownReportKey) sheetMemo.overview = { key: shownReportKey, vh, snaps: list }
      return list
    }
    // The flight snap shows the whole pass header (title, date, scrubber) over the footer. On a short phone (375×667)
    // the header wraps taller than 40 % of the screen and the scrubber went under the footer: like the overview's
    // peek, it may rise past 40 % as long as a 232 px band (HUD + globe) stays above the sheet.
    const flight = Math.min(geo.top + geo.foot + 2, Math.max(vh * 0.4, vh - 232))
    const imageSnap = geo.imageEnd !== undefined ? geo.top + pad + geo.imageEnd + 8 + geo.foot : vh * 0.7
    // R2R3: on a short phone the globe band above the sheet would be under ~120 px: the image step goes to
    // the top snap (the sheet meets the HUD band; the globe is simply out of view).
    const band = vh - imageSnap - useApp.getState().uiInsets.top
    const image = band < PHONE_MIN_BAND - 8 ? vh * TOP - 1 : Math.max(Math.min(imageSnap, vh * (TOP - 0.02)), flight + 40)
    const list = [flight, image, TOP]
    if (mobile) sheetMemo[shownKey === 'photo' ? 'photo' : 'plan'] = { key: '', vh, snaps: list }
    return list
  })()

  const logicalSnap = heldIndex ?? snap
  const sheetSnap = overviewList && !heldPhysical ? (collapsed && heldIndex === undefined ? 0 : logicalSnap + 1) : logicalSnap
  overviewListRef.current = overviewList
  lastShown.current = { snaps, index: Math.min(sheetSnap, snaps.length - 1) }

  // Phase / view changes pick the snap. A new search drops to the computing snap at once (R2R8: one glide down);
  // the overview's snap applies when the overview is the content shown, so Back never first drops the sheet to the
  // outgoing pass's lowest snap.
  useEffect(() => {
    if (mobile && viewKey === 'computing') setSnap(0)
  }, [viewKey, mobile])
  // Back to a known overview (PH-03): its snap applies as the pass starts to leave, so the sheet rises in that beat.
  const overviewKnown = mobile && viewKey === 'overview' && sheetMemo.overview?.key === shownReportKey
  // (Not while the inline search is open: a search started from a pass returns to the overview at the top snap, where
  // the field and its suggestions sit above the keyboard, as from the overview's own search bar.)
  useEffect(() => {
    if (mobile && viewKey === 'overview' && (shownKey === 'overview' || overviewKnown)) setSnap(searching ? 2 : overviewSnap.current)
  }, [viewKey, shownKey, mobile, overviewKnown, searching])
  // A new place opens on the peek again.
  useEffect(() => {
    overviewSnap.current = 0
  }, [placeKey])

  // A pass on phones (R3-5): the sheet stays at its low flight snap through the approach and the dive (the globe's
  // sequence is the show), and rises at the capture moment: the replay clock carrying sim time across the pass's
  // closest approach, the frame the globe's scan line crosses the place (read after the globe's frame, as the HUD
  // readout). It also rises when the clock is not replaying (paused or scrubbed) once the camera is there, when a
  // replay resumed past the capture, when no globe is drawing, and at a cap. Reduced motion: at once. A quiet
  // selection (a gallery swipe) never moves the sheet; a finger on the sheet keeps it where the user put it.
  const [replayNonce, setReplayNonce] = useState(0)
  const passOf = useRef<(id: string) => Pass | undefined>(() => undefined)
  passOf.current = (id) => lastModel.current?.passById.get(id)
  useEffect(() => {
    if (!mobile || !selectedId) return
    if (quiet.id === selectedId) return
    if (reduced) {
      setSnap(1)
      return
    }
    setSnap(0)
    const tc = passOf.current(selectedId)?.tClosest
    let done = false
    let touched = false
    const sec = sectionRef.current
    const onDown = () => (touched = true)
    sec?.addEventListener('pointerdown', onDown)
    const raise = () => {
      if (done) return
      done = true
      if (!touched) setSnap(1)
    }
    const startedAt = performance.now()
    let prev: number | null = null
    let late = false
    let quietSince = 0
    let lastT = NaN
    let lastTAt = startedAt
    const off = onSceneFrame((t, mode) => {
      if (done) return
      const now = performance.now()
      const st = useApp.getState()
      const flying = st.cameraFlight.flying
      // Sim time held still while the camera flies (the replay waits for it) is not a stall.
      if (t !== lastT || flying) {
        lastT = t
        lastTAt = now
      }
      if (mode === 'replay' && tc !== undefined) {
        quietSince = 0
        if (crossed(prev, t, tc)) return raise()
        // The first replay frame already past the capture (a replay resumed late): rise once the camera is there.
        if (prev === null && t >= tc) late = true
        prev = t
        if (late && !flying) return raise()
      } else {
        prev = null
        // The store asks for a replay the globe has not taken up yet: not quiet.
        if (st.timeMode === 'replay') quietSince = 0
        else if (!quietSince) quietSince = now
        if (quietSince && !flying && now - quietSince >= SHEET_QUIET_MS && now - startedAt >= SHEET_QUIET_MS) return raise()
      }
      // No globe drawing (sim time frozen with nothing flying), or a sequence that never gets there.
      const stall = mode === 'replay' ? SHEET_REPLAY_STALL_MS : SHEET_STALL_MS
      if ((!flying && now - lastTAt >= stall) || now - startedAt >= SHEET_CAP_MS) raise()
    })
    return () => {
      done = true
      off()
      sec?.removeEventListener('pointerdown', onDown)
    }
  }, [selectedId, replayNonce, mobile, reduced])

  const onSnapChange = useCallback(
    (i: number) => {
      if (overviewListRef.current) {
        // The overview's list starts with its globe snap: the others are `snap` + 1.
        setCollapsed(i === 0)
        if (i === 0) return
        setSnap(i - 1)
        if (viewKey === 'overview') overviewSnap.current = i - 1
        return
      }
      setSnap(i)
      if (viewKey === 'overview') overviewSnap.current = i
    },
    [viewKey],
  )
  // The globe snap is a place the user pulled the overview to: any other view, a new place or a search leaves it.
  useEffect(() => {
    setCollapsed(false)
  }, [viewKey, placeKey, searching])

  // Inline search on phones: the sheet rises while typing.
  useEffect(() => {
    if (mobile && searching) setSnap(2)
  }, [mobile, searching])
  useEffect(() => {
    if (computing) setSearching(false)
  }, [computing])
  // The back gesture closes the inline search (src/lib/backStack.ts), as on the landing.
  useBackLayer('search', searching, () => setSearching(false))

  // ── desktop dock height: content while computing, full at results (CSS transition) ──────
  useLayoutEffect(() => {
    const sec = sectionRef.current
    const body = bodyRef.current
    const inner = innerRef.current
    if (mobile || !sec || !body || !inner || typeof ResizeObserver === 'undefined') return
    if (!computing) {
      if (continued && lastComputingH) {
        // Remounted at the handoff: start from the readout's height and grow.
        sec.style.height = `${lastComputingH}px`
        const id = requestAnimationFrame(() => requestAnimationFrame(() => (sec.style.height = '')))
        return () => cancelAnimationFrame(id)
      }
      return
    }
    if (shownKey !== 'computing') {
      // A new place from the header search: the old overview is still leaving. Shrink toward the
      // readout's last height now (it is the same readout), never toward the outgoing overview's.
      if (lastComputingH) sec.style.setProperty('--computing-h', `${lastComputingH}px`)
      return
    }
    const measure = () => {
      const chrome = sec.offsetHeight - body.offsetHeight
      const h = Math.round(chrome + 20 + inner.offsetHeight + 22)
      // A 1-2 px difference must not restart the height transition already gliding there.
      const cur = parseFloat(sec.style.getPropertyValue('--computing-h'))
      if (!(Math.abs(cur - h) < 3)) sec.style.setProperty('--computing-h', `${h}px`)
      // The next search starts from the readout itself, without this run's slow-archive note (which appears
      // late, and only sometimes): the panel shrinks to it in one glide (A1).
      const readout = inner.querySelector<HTMLElement>('[data-readout]')
      lastComputingH = readout ? Math.round(chrome + 20 + readout.offsetTop + readout.offsetHeight + 22) : h
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(inner)
    return () => ro.disconnect()
  }, [computing, mobile, continued, shownKey])

  // Pass frame: measure what sits above and below it so the square always fits (R8, R2R5): above it the header and the
  // gallery's bar; below it the caption and credit, the body's end fade, the footer. The square shrinks instead of
  // pushing the credit into the fade. Phones (U-3) measure against the sheet's top snap, so on a short phone (375×667)
  // the caption never sits under the footer.
  const leaving = useRef(false)
  // Leaving: fading out, or about to (the selection cleared, so the header already lost its replay strip).
  leaving.current = staged.stage === 'out' || viewKey !== staged.shown
  useLayoutEffect(() => {
    const sec = sectionRef.current
    const body = bodyRef.current
    const inner = innerRef.current
    if (!sec || !body || !inner || !shownPass) return
    const measure = () => {
      // A view on its way out (Back) keeps its size while it fades: the header changing under it is the next view's.
      if (leaving.current) return
      const frame = inner.querySelector<HTMLElement>('[data-gallery="detail"] [data-current] [data-photo-frame]') ?? inner.querySelector<HTMLElement>('[data-detail-frame]')
      if (!frame) return
      const foot = body.nextElementSibling as HTMLElement | null
      const cap = frame.parentElement?.querySelector('figcaption') as HTMLElement | null
      // A plate set beside the square (short landscape phones, U-3) takes no height under it.
      const capBeside = !!cap && cap.offsetLeft > frame.offsetLeft + 1
      const caption = cap && !capBeside ? cap.offsetHeight + 8 : 0
      const offset = frame.getBoundingClientRect().top - inner.getBoundingClientRect().top
      const vh = window.innerHeight
      if (mobile) {
        // Everything in the sheet but the square: header (grip included), body padding, the gallery's bar, the caption,
        // the footer. The square takes what the capture snap leaves while a globe band of PHONE_CAPTURE_BAND stays
        // above the sheet (U-4: the photo and the painted globe together); a phone too short for that and a ≥ 240 px
        // square gets the top snap instead (then the square fits under the HUD band, caption above the footer).
        const pad = parseFloat(getComputedStyle(body).paddingTop) || 20
        const chrome = headHeight(body) + pad + offset + caption + (foot?.offsetHeight ?? 0) + 6
        const top = useApp.getState().uiInsets.top
        const withBand = vh - top - PHONE_CAPTURE_BAND - chrome
        // PH-16: a short phone (390×664, or 844 minus a notch) keeps a smaller band and a smaller square before it gives
        // the globe up: the capture's settle (the globe photo lining up with the panel's) stays in view.
        const withMinBand = vh - top - PHONE_MIN_BAND - chrome
        const room = withBand >= 240 ? withBand : withMinBand >= PHONE_MIN_SQUARE ? withMinBand : Math.min(vh * TOP, vh - 64 - safeAreaTop()) - chrome
        sec.style.setProperty('--detail-chrome', `${Math.round(vh - room)}px`)
        return
      }
      const sr = sec.getBoundingClientRect()
      const above = sr.top + headHeight(body) + 20 + offset
      const below = (foot?.offsetHeight ?? 0) + Math.max(0, vh - sr.bottom) + caption + 24 + 4
      sec.style.setProperty('--detail-chrome', `${Math.round(above + below)}px`)
    }
    // The observer's first callback (after layout) does the first measure: no forced layout in the
    // commit that opens the pass. The header too: its replay strip appearing makes it taller.
    if (typeof ResizeObserver === 'undefined') measure()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    ro?.observe(sec)
    const head = body.previousElementSibling
    if (head) ro?.observe(head)
    window.addEventListener('resize', measure)
    return () => {
      ro?.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [mobile, shownPass, shownKey])

  // Scroll edges (R2R5): a long body ends on a 24 px fade, never on a clipped baseline, and once scrolled it
  // starts on a 16 px fade, so no row is ever hard-cut at the header hairline (desktop: the body's own box).
  useLayoutEffect(() => {
    const body = bodyRef.current
    if (!body || mobile) return
    let raf = 0
    const update = () => {
      raf = 0
      const more = body.scrollHeight - body.scrollTop - body.clientHeight > 2
      const scrolled = body.scrollTop > 0
      if (body.dataset.more !== String(more)) body.dataset.more = String(more)
      if (body.dataset.scrolled !== String(scrolled)) body.dataset.scrolled = String(scrolled)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    if (typeof ResizeObserver === 'undefined') update()
    body.addEventListener('scroll', onScroll, { passive: true })
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onScroll) : null
    ro?.observe(body)
    if (innerRef.current) ro?.observe(innerRef.current)
    return () => {
      body.removeEventListener('scroll', onScroll)
      ro?.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [mobile, shownKey, full])

  useInsets(sectionRef, timelineRef, mobile, [shownKey, computing, full, shortLandscape])
  useShellExit(sectionRef, timelineRef, mobile)

  // ── render ─────────────────────────────────────────────────────────────────────────────
  // Inline search lives in the overview header: from a pass, go back to the overview first. On a phone the keyboard
  // must open from the tap itself (iOS only raises it for a focus inside the gesture): a stand-in field takes focus
  // in the tap, and the real one takes it over when it mounts (focus moving between fields keeps the keyboard up).
  const openSearch = onSearch
    ? () => {
        if (mobile) holdKeyboard()
        if (useApp.getState().selectedPassId) clearPass()
        flushSync(() => setSearching(true))
      }
    : undefined
  const enterKey = `enter:${reportKey || shownReportKey}`
  const dockEnter = useOnce(`${enterKey}:dock`)
  // R2R10: a share recipient looking at the shared pass is pointed to their own place.
  const sharedPass = !!shared && !!shownPass && shared.norad === shownPass.norad && shared.tClosest !== undefined && Math.abs(shared.tClosest - shownPass.tClosest) <= 60_000

  const header = shownPass && shownModel ? (
    <DetailHeader
      model={shownModel}
      pass={shownPass}
      mobile={mobile}
      onSelect={select}
      photo={shownKey === 'photo'}
      shared={shared ? { sat: shared.satName ?? shownModel.meta(shownPass.norad).name, place: shared.placeLabel } : undefined}
      strip={mobile && !!selected && selected.id === shownPass.id}
      onSearch={mobile ? openSearch : undefined}
    />
  ) : (
    <OverviewHeader
      place={place}
      model={model}
      // PH-01: the header keeps its computing form while the computing readout is still the body (its 160 ms fade-out
      // at the results handoff): the phone's headline mounted there in full, then vanished and wiped in again when the
      // overview swapped in, and the sheet glided twice. It changes in the commit that swaps the overview in, so the
      // headline enters once and the sheet makes one move, from the computing snap to the peek.
      computing={computing || shownKey === 'computing'}
      t0={t0}
      mobile={mobile}
      enter={handoff}
      searching={searching}
      onBack={back}
      onCancel={back}
      onOpenSearch={openSearch}
      onCloseSearch={() => setSearching(false)}
      onSearch={onSearch}
      onRetry={onRetry}
      onShareWeek={shareWeek}
    />
  )

  const replayShown = useCallback(
    (p: Pass) => {
      if (mobile) {
        setSnap(0)
        // The same pass replayed again: the sheet waits for its capture moment again (R3-5).
        setReplayNonce((n) => n + 1)
      }
      focusPass(p)
    },
    [mobile],
  )
  // Short landscape phones (U-3): a 390 px tall screen has no height for a footer under the pass photo; its actions ride
  // at the end of the pass header's single line instead, and the photo gets the height.
  const headActions = shortLandscape && !!shownPass
  const footer = shownPass && shownModel ? (
    <DetailFooter
      model={shownModel}
      pass={shownPass}
      mobile={mobile}
      compact={headActions}
      sharedPass={sharedPass}
      onShare={sharePass}
      onCheckPlace={openSearch}
      onReplay={() => replayShown(shownPass)}
    />
  ) : undefined

  const swapClass = staged.stage === 'out' ? s.swapOut : staged.stage === 'in' && !handoff ? s.swapIn : undefined
  const headSwapClass = staged.stage === 'out' && headerChanging ? s.swapOut : headerEntering ? s.swapIn : undefined
  const dirStyle = { '--dir': dir } as CSSProperties

  return (
    <>
      <Sheet
        label={place ? `Satellites over ${place.label}` : 'Computing passes'}
        header={
          <GlideHeight swapKey={headerKeyOf(staged.shown)}>
            <div key={headerKeyOf(staged.shown)} className={cx(headSwapClass, headActions && s.headActions)} style={dirStyle}>
              {header}
              {headActions ? footer : null}
            </div>
          </GlideHeight>
        }
        // LAP-01: the footer is part of the view: it fades out and in with the header and the body, never pops.
        footer={
          headActions || !footer ? undefined : (
            <div className={headSwapClass} style={dirStyle}>
              {footer}
            </div>
          )
        }
        snaps={snaps}
        snap={sheetSnap}
        onSnapChange={onSnapChange}
        onVisibleChange={mobile ? publishSheetInset : undefined}
        className={cx(
          s.vars,
          s.panel,
          !mobile && s.desk,
          !mobile && (computing ? s.isComputing : s.isResults),
          shortLandscape && s.shortLandscape,
          continued && s.noEnter,
        )}
        bodyClassName={s.body}
        bodyRef={bodyRef}
      >
        <div ref={innerRef} key={shownKey} className={cx(s.stage, swapClass)} style={dirStyle} data-detail-root={shownPass ? '' : undefined}>
          {shownKey === 'computing' || !lastModel.current ? (
            <ComputingBody t0={t0} tz={placeTz} />
          ) : shownPass && shownKey === 'photo' ? (
            <PhotoPassView model={lastModel.current} pass={shownPass} mobile={mobile} />
          ) : shownPass ? (
            <PassDetail key={shownPass.id} model={lastModel.current} pass={shownPass} />
          ) : (
            <Overview
              model={lastModel.current}
              mobile={mobile}
              compactTimeline={mobile || shortLandscape}
              noSummaryRule={shortDesk || shortLandscape}
              wide={shortLandscape}
              full={full}
              enterKey={enterKey}
              selectedId={selectedId}
              onSelect={select}
              onShare={shareHero}
              onShareWeek={shareWeek}
              onRetry={onRetry}
              invite={!!shared && !inviteClosed && !searching}
              onCheckPlace={openSearch}
              onCloseInvite={() => setInviteClosed(true)}
            />
          )}
        </div>
      </Sheet>

      {!mobile && !shortLandscape && model && dockFull ? (
        <TimelineDock dockRef={timelineRef} className={cx(s.vars, s.timelineDock, dockEnter && s.dockEnter)}>
          <Timeline model={model} selectedId={selectedId} onSelect={select} index={shortDesk ? '03' : '04'} />
        </TimelineDock>
      ) : null}

      {model ? <Lightbox model={model} mobile={mobile} onReplay={replayShown} onShare={shareViewed} covered={!!sharing || timelapseOpen} /> : null}
      <TimelapseLayer model={model} mobile={mobile} />
      {/* On <body>, beside the photo viewer (itself a portal there): the app root is position: fixed, a stacking
          context of its own, so a sheet inside it could never paint over the viewer its Share was pressed in. */}
      {sharing && model ? createPortal(<ShareFor pass={sharing.pass} from={sharing.from} model={model} onClose={closeShare} />, document.body) : null}
    </>
  )
}

/**
 * The desktop timeline strip. When it leaves while the panel stays (a second place searched from the
 * header: the panel turns back into the computing readout), it clips away to the right instead of
 * vanishing in one frame. When the whole shell leaves, useShellExit takes both out together.
 */
function TimelineDock({ dockRef, className, children }: { dockRef: React.RefObject<HTMLDivElement | null>; className?: string; children: React.ReactNode }) {
  useLayoutEffect(() => {
    const node = dockRef.current
    // An unmount's layout cleanup runs while the node is still in the document, so it can be cloned.
    return () => {
      if (useApp.getState().phase === 'computing') exitTimeline(node)
    }
  }, [dockRef])
  return (
    <div ref={dockRef} className={className}>
      {children}
    </div>
  )
}

const FLOW_ROOT: CSSProperties = { display: 'flow-root' }

/**
 * The sheet header's box. R3-8: its height changes in ONE step, swaps and in-place changes alike (results arrival,
 * Back, New search): the Sheet draws the body below the header with a transform set in the same frame (R3-9), so
 * nothing is pushed in layout and no height is animated (a 240 ms height glide re-laid the header out every frame).
 * The outer/inner pair stays as the geometry's markers (useSheetGeometry reads the header at its natural height).
 */
function GlideHeight({ swapKey, children }: { swapKey: string; children: React.ReactNode }) {
  const outer = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  useAnimatedHeight(outer, inner, false, swapKey)
  return (
    <div ref={outer} data-anim-outer>
      {/* flow-root: the swapped content's own margins stay inside (a header whose first row has a negative margin
          must not pull this box's top with it: that moved the whole header 6 px on every swap, R3-8). */}
      <div ref={inner} data-anim-inner style={FLOW_ROOT}>
        {children}
      </div>
    </div>
  )
}

// ── overview body ─────────────────────────────────────────────────────────────────────────

interface OverviewProps {
  model: ResultsModel
  mobile: boolean
  compactTimeline: boolean
  /** Short laptops: no 01 / SUMMARY notch (the passes are 01, as on phones) */
  noSummaryRule?: boolean
  /** Short landscape phones: the summary in two columns (the photo beside the words, U-3) */
  wide?: boolean
  full: boolean
  enterKey: string
  selectedId?: string
  onSelect: (p: Pass) => void
  onShare: (p: Pass) => void
  onShareWeek: () => void
  onRetry?: () => void
  invite: boolean
  onCheckPlace?: () => void
  onCloseInvite: () => void
}

function Overview({ model, mobile, compactTimeline, noSummaryRule = false, wide = false, full, enterKey, selectedId, onSelect, onShare, onShareWeek, onRetry, invite, onCheckPlace, onCloseInvite }: OverviewProps) {
  const { report } = model
  // Notch indices in reading order (V22): phones have no SUMMARY rule (the summary is the sheet's
  // header and hero), so their first rule is 01 / PASSES; short laptops likewise (R2R1).
  const idx = (n: number) => String(mobile || noSummaryRule ? n - 1 : n).padStart(2, '0')
  const enter = useOnce(`${enterKey}:body`)
  const listReady = useListReady(model)
  // The summary leads with the photos (owner B): the gallery, photo #1 being the closest look (with no photo
  // at all it holds the radar images and the geostationary frames, if there are any).
  const hero = model.photos.length ? (
    <div data-peek-end className={cx(enter && s.enter)} style={enterStyle(1)}>
      <Gallery model={model} context="hero" mobile={mobile} onReplay={onSelect} onShare={onShare} />
    </div>
  ) : null
  const timelapse = hero ? <TimelapseRow model={model} /> : null
  const inviteBar = invite ? (
    <div className={s.invite}>
      <p className={s.inviteText}>Something watched you this week too.</p>
      {onCheckPlace ? (
        <Button variant="primary" size="sm" onClick={onCheckPlace}>
          Check your place
        </Button>
      ) : null}
      <button type="button" className={s.inviteClose} onClick={onCloseInvite} aria-label="Dismiss">
        <Glyph name="close" size={12} />
      </button>
    </div>
  ) : null

  return (
    <>
      {inviteBar}
      {mobile ? (
        <section className={s.section} aria-label="Summary">
          {hero}
          {timelapse}
          <div data-peek-end={hero ? undefined : ''}>
            <Verdicts model={model} enter={enter} />
          </div>
          {full ? (
            <div className={s.mTimeline}>
              <Timeline model={model} selectedId={selectedId} onSelect={onSelect} compact />
            </div>
          ) : (
            <div className={s.mTimeline} />
          )}
        </section>
      ) : (
        <section className={cx(s.section, wide && s.summaryWide)} aria-label="Summary">
          {noSummaryRule ? null : (
            <Rule index="01" className={s.rule}>
              Summary
            </Rule>
          )}
          <div className={s.headBlock}>
            <Headline model={model} enter={enter} />
            <MoreLine model={model} enter={enter} onRetry={onRetry} onShare={onShareWeek} />
          </div>
          {hero}
          {timelapse}
          <Verdicts model={model} enter={enter} />
          {compactTimeline ? (
            <div className={s.mTimeline}>{full ? <Timeline model={model} selectedId={selectedId} onSelect={onSelect} compact /> : null}</div>
          ) : null}
        </section>
      )}
      {full && listReady ? (
        <>
          <section className={s.section} aria-label="Passes">
            <Rule index={idx(2)} className={s.rule}>
              Passes
            </Rule>
            <PassList model={model} selectedId={selectedId} onSelect={onSelect} />
          </section>
          <section className={s.section} aria-label="Watched continuously">
            <Rule index={idx(3)} className={s.rule}>
              Watched continuously
            </Rule>
            <GeoWatchers watchers={report.geo} place={report.place} days={model.windowDays} scans={model.geoScans} selectedId={selectedId} onSelect={onSelect} />
          </section>
          <section className={s.section}>
            {/* The caveats close the overview (R2R1; phones too, U-2): the passes notch comes up the first screen, and
                the counts line that grows when the archives answer moves nothing under it. */}
            <Notes model={model} />
            <p className={s.footnote}>
              Pass times are when each satellite was closest to {report.place.label}, computed from public orbital elements
              {report.catalogFetchedAt ? ` (fetched ${report.catalogFetchedAt.slice(0, 16).replace('T', ' ')}Z)` : ''}. Local times are {model.tzLabel}.
            </p>
          </section>
        </>
      ) : (
        // Reserve the passes notch while the sections stage in, so the summary never shifts (A1). While the archives
        // are still being checked (a partial report), the list waits: verified weather mosaics move from 'likely' to
        // 'watched', and re-sorting rows under the reader is a layout shift (U-2). It mounts once, final.
        <section className={s.section} aria-hidden={full ? undefined : true}>
          <Rule index={idx(2)} className={s.rule}>
            Passes
          </Rule>
          {full ? (
            <p className={s.listWait} role="status">
              Checking the archives<span className={s.listCaret} aria-hidden />
            </p>
          ) : null}
        </section>
      )}
    </>
  )
}

/** A partial report never holds the list back longer than this (a slow archive): it mounts, and may re-sort once. */
const LIST_PARTIAL_CAP_MS = 8000
/** When each report (by key) was first shown partial, so a remount (Back from a pass) keeps the same cap. */
const partialSince = new Map<string, number>()

/** The pass list mounts on the final report (or a partial one shown for LIST_PARTIAL_CAP_MS, or an archive outage). */
function useListReady(model: ResultsModel): boolean {
  const r = model.report
  const key = `${r.windowEnd}:${r.place.lat},${r.place.lon}`
  const waiting = !!r.partial && !model.archiveFailed
  const [, wake] = useState(0)
  let since = partialSince.get(key)
  if (waiting && since === undefined) partialSince.set(key, (since = performance.now()))
  const left = since === undefined ? 0 : LIST_PARTIAL_CAP_MS - (performance.now() - since)
  const ready = !waiting || left <= 0
  useEffect(() => {
    if (ready) return
    const id = window.setTimeout(() => wake((n) => n + 1), Math.max(0, left) + 16)
    return () => window.clearTimeout(id)
  }, [ready, left])
  return ready
}

/** What Share shares: a pass, or (a geostationary scan, which is no pass) its image. */
const shareNoun = (p: Pass) => (p.geostationary ? 'image' : 'pass')

// ── pass footer ───────────────────────────────────────────────────────────────────────────

function DetailFooter({
  model,
  pass,
  mobile,
  compact = false,
  sharedPass,
  onShare,
  onReplay,
  onCheckPlace,
}: {
  model: ResultsModel
  pass: Pass
  mobile: boolean
  /** In the header's line (short landscape phones): short words, no back button (the header has it) */
  compact?: boolean
  /** A share recipient looking at the shared pass (R2R10) */
  sharedPass: boolean
  onShare: (p: Pass) => void
  onReplay: () => void
  onCheckPlace?: () => void
}) {
  const capture = captureFor(model.report, pass)
  const cover = model.cover?.photo
  // A clouded picture: the primary action is the clearest one, not sharing a white square.
  const clearer = !sharedPass && !!capture && isClouded(capture) && cover?.pass && !cover.clouded && cover.pass.id !== pass.id ? cover.pass : undefined
  // R2R10: the recipient's primary is their own place; Share and Replay become icons.
  const iconOnly = compact || !!clearer || (sharedPass && !!onCheckPlace)
  const replay = (
    <Button onClick={onReplay} title="Replay the pass on the globe" aria-label="Replay the pass" className={cx(iconOnly && s.iconBtn)}>
      <Glyph name="play" size={12} />
      {iconOnly ? null : 'Replay'}
    </Button>
  )
  const shareIcon = (
    <Button onClick={() => onShare(pass)} aria-label={`Share this ${shareNoun(pass)}`} title={`Share this ${shareNoun(pass)}`} className={s.iconBtn}>
      <Glyph name="share" size={13} />
    </Button>
  )
  return (
    <div className={cx(s.actions, iconOnly && s.actionsThree, compact && s.actionsCompact)}>
      {mobile ? (
        <Button onClick={clearPass} aria-label="All passes" className={s.iconBtn}>
          <Glyph name="arrow-left" size={13} />
        </Button>
      ) : null}
      {sharedPass && onCheckPlace ? (
        <>
          <Button variant="primary" onClick={onCheckPlace} className={s.primary} aria-label="Check your place">
            <Glyph name="search" size={13} />
            {/* "Your place" on narrow phones (V2: "Check your place" ran into the padding at 376 px). */}
            <span>
              <span className={s.ctaLead}>Check </span>your place
            </span>
          </Button>
          {shareIcon}
        </>
      ) : clearer ? (
        <>
          <Button variant="primary" onClick={() => focusPass(clearer)} className={s.primary} aria-label="See the clearest look">
            <span className={s.ctaLead}>See the </span>clearest look
          </Button>
          {shareIcon}
        </>
      ) : (
        <Button variant="primary" onClick={() => onShare(pass)} className={s.primary} aria-label={`Share this ${shareNoun(pass)}`}>
          <Glyph name="share" size={14} />
          {/* "Share this pass" where it fits; "Share" on narrow phones (≤ 400 px: it was cut to "SHARE THIS PAS"). */}
          {compact ? 'Share' : (
            // One inline run: as separate flex items "Share" and " this pass" got the button's gap between them.
            <span>
              Share<span className={s.ctaTail}> this {shareNoun(pass)}</span>
            </span>
          )}
        </Button>
      )}
      {replay}
    </div>
  )
}

/**
 * The share sheet: a pass's, told when the picture is mostly cloud (share SH2 renders the clouded card), or with no
 * pass the week's summary (the headline's Share).
 */
function ShareFor({ pass, from, model, onClose }: { pass?: Pass; from: ShareFrom; model: ResultsModel; onClose: () => void }) {
  if (!pass) return <ShareSheet kind="summary" report={model.report} onClose={onClose} from={from} />
  const c = captureFor(model.report, pass)
  return <ShareSheet pass={pass} report={model.report} onClose={onClose} clouded={!!c && isClouded(c)} cloudPct={c?.cloudCoverPct} from={from} />
}

// ── behaviour ─────────────────────────────────────────────────────────────────────────────

/**
 * A selection made outside this view (the controller's `?p=` deep link or `/s/<id>` share preselect,
 * or any bare `selectPass(id)`) gets the same treatment as a click: frame the pass, replay its sweep,
 * start decoding its image. Once per selected id, so a report swap (partial → final) never restarts
 * a replay the user has since paused or scrubbed.
 */
function useExternalFocus(selectedId: string | undefined, model: ResultsModel | undefined) {
  const handled = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (!selectedId) {
      handled.current = undefined
      return
    }
    if (!model || handled.current === selectedId) return
    const pass = model.passById.get(selectedId)
    if (!pass) return
    handled.current = selectedId
    const cam = useApp.getState().camera
    if (cam.kind !== 'pass' || cam.passId !== selectedId) focusPass(pass)
  }, [selectedId, model])
}

/**
 * Whoever clears the selection (our back button, the app shell's Esc, a new report), the scene goes
 * back to the overview: live time, camera on the place.
 */
function useDeselectCleanup() {
  useEffect(
    () =>
      useApp.subscribe((st, prev) => {
        if (!prev.selectedPassId || st.selectedPassId) return
        if (st.timeMode !== 'live') {
          st.setTimeMode('live')
          st.setSimTime(Date.now())
        }
        if (st.camera.kind === 'pass' && st.place) st.setCamera({ kind: 'place', lat: st.place.lat, lon: st.place.lon })
      }),
    [],
  )
}

/** Stop the replay at the end of the pass window and hold that frame. */
function useReplayGuard(pass: Pass | undefined, onEnd?: () => void) {
  const endRef = useRef(onEnd)
  endRef.current = onEnd
  useEffect(() => {
    if (!pass) return
    const [, end] = replayWindow(pass)
    return useApp.subscribe((st) => {
      if (st.timeMode === 'replay' && st.simTime >= end) {
        st.setTimeMode('scrub')
        st.setSimTime(end)
        endRef.current?.()
      }
    })
  }, [pass])
}

const isTyping = (t: EventTarget | null) => {
  const el = t as HTMLElement | null
  return !!el?.closest?.('input, textarea, select, [contenteditable="true"]')
}

function useKeys(model: ResultsModel | undefined, selected: Pass | undefined, select: (p: Pass) => void, suspended: boolean) {
  const ref = useRef({ model, selected, select, suspended })
  ref.current = { model, selected, select, suspended }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const { model: m, selected: sel, select: pick, suspended: off } = ref.current
      if (!m || off || e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        if (isTyping(e.target)) return
        const dir = e.key === 'ArrowRight' ? 1 : -1
        // The photos first (owner B): the gallery on screen walks them (the summary, or a pass with a photo).
        if (galleryCtl.current && (!sel || m.photoByPass.has(sel.id))) {
          e.preventDefault()
          galleryCtl.current.step(dir)
          return
        }
        const next = stepPass(m.lanes, sel, dir)
        if (next && next.id !== sel?.id) {
          e.preventDefault()
          pick(next)
        }
      } else if ((e.key === 'f' || e.key === 'F') && !isTyping(e.target)) {
        if (galleryCtl.current?.expand()) e.preventDefault()
      } else if (e.key === ' ' || e.code === 'Space') {
        if (!sel || isTyping(e.target)) return
        // Let focused controls (other than pass rows) keep their native Space.
        const el = e.target as HTMLElement | null
        const control = el?.closest?.('button, a, [role="radio"], [role="button"]')
        if (control && !control.hasAttribute('data-pass-row')) return
        e.preventDefault()
        const st = useApp.getState()
        if (st.timeMode === 'live') startReplay(sel, st.replayRate)
        else togglePlay(sel)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}

/**
 * Raise the phone keyboard inside a tap, before the field it is for exists: a 16 px (no zoom), invisible, fixed field
 * takes focus now and goes away as soon as focus moves on (to the real field's autofocus) or after 1.5 s.
 */
function holdKeyboard() {
  if (typeof document === 'undefined') return
  const proxy = document.createElement('input')
  proxy.type = 'text'
  proxy.setAttribute('aria-label', 'Search another place')
  proxy.tabIndex = -1
  proxy.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;font-size:16px;border:0;padding:0;pointer-events:none'
  document.body.appendChild(proxy)
  const done = () => {
    window.clearTimeout(timer)
    proxy.remove()
  }
  const timer = window.setTimeout(done, 1500)
  proxy.addEventListener('blur', done, { once: true })
  proxy.focus({ preventScroll: true })
}
