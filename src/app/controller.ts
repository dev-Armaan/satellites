/**
 * App flow controller — the only place that sequences phases.
 *   boot → idle → (locating) → computing → results
 *   boot → computing → results            (share links and ?q deep links: the landing never mounts)
 * URL state (src/app/links.ts):
 *   /?q=<lat>,<lon>&n=<label>[&p=<passId>]   deep link straight to a report
 *   /?q=…&norad=<id>&t=<ms>                  share's fallback deep link: that satellite's pass nearest t
 *   /?s=<shareId>                            open a shared pass
 *
 * Timing contract (decision #10, one continuous instrument):
 *  - Boot waits only for the globe's first light and the fonts. The catalog loads in parallel (its points
 *    fade in on their own) and the share lookup starts at t=0, so a share link resolves while the boot log
 *    is still up and the curtain lifts straight onto the computing panel.
 *  - Share links get at least 2.5 s after first light (a slow globe chunk must not eat their budget), and a
 *    share that answers later still opens if the landing is untouched (R2K1). Deep and share links wait up to
 *    1.2 s after first light for the sharp day map, so their flight is planned once, at the sharp range (R2K2).
 *  - Results land in rhythm with the camera: no sooner than 1.8 s after the search, and ~1 s before the
 *    camera arrives, so the headline has settled just before the reticle locks.
 *  - R-M1, one coherent arrival: the first paint waits up to 1.5 s more for the settled report (the final one,
 *    with its clear cover when the week needs one; up to 1 s more while that cover is still being checked), and
 *    up to 1.2 s for its hero to be decoded, so the hero is chosen once and never mounts on an empty frame. The engine finds the clear cover while the passes are
 *    computed and says so (onCover), and its photo starts downloading then. After the first paint the hero is
 *    never swapped without a user action (results pins the first-painted photo).
 *  - The submit and handoff frames carry only what they must (R2K3): the address bar and the lookup count
 *    are written in idle time, and the results model is built in idle time before the report lands.
 */
import { timelapseParam, useTimelapseUi } from '@/state/timelapse'
import { useApp } from '@/state/store'
import type { Capture, Place, ProgressEvent, Report } from '@/types'
import type { EngineReport } from '@/engine/report'
import { currentCatalog, loadCatalog, loadCatalogNames } from '@/engine/catalog'
import { ensureTz } from '@/imagery'
import { getShare, recordLookup, type Share } from '@/lib/backend'
import { createLateShareGate } from './lateShare'
import { passLinkOpts, sharedGeoItem, pickPreselect, readUrlTarget, type RunOpts } from './links'
import { isSettled, raceTimeout, settleWaitMs, sleep } from './timing'

export type { RunOpts } from './links'

/**
 * The report engine (pass search, archives, matching, satellite.js) is its own chunk: the landing doesn't
 * need it. Prefetched at landing idle, on search focus, and at boot for deep links.
 */
export const loadEngine = (() => {
  let p: Promise<typeof import('@/engine/report')> | undefined
  return () => {
    p ??= import('@/engine/report')
    p.catch(() => (p = undefined))
    return p
  }
})()
const warmPassWorkers = () => void import('@/engine/pool').then((m) => m.warmPassWorkers(), () => undefined)

let inflight: AbortController | null = null
const DAY = 86_400_000

/** Share lookups that take longer than this (from the start of boot) fall back to the landing… */
const SHARE_CAP_MS = 4000
/** …but never sooner than this after first light: a slow boot must not use up the share's budget (R2K1). */
const SHARE_MIN_AFTER_LIGHT_MS = 2500
/** A share that answers after the landing appeared still opens, if the landing is untouched, until this long after boot. */
const LATE_SHARE_MS = 15_000
/** Deep and share links wait at most this long (from first light) for the sharp day map before flying (R2K2). */
const SHARP_MAP_WAIT_MS = 1200
/**
 * The loading screen (index.html's wordmark) stays at least until this long after navigation start, so a fast,
 * cached boot reads as the logo settling into place, not a flash. Measured from performance.timeOrigin.
 */
const LOGO_MIN_MS = 650
/** The three faces the first screens use; loading them explicitly makes fonts.ready wait for them (no fallback flash). */
const FIRST_FONTS = ['500 16px "Instrument Sans Variable"', '400 16px "Martian Mono Variable"', 'italic 400 16px "Instrument Serif"']
/** Boot never waits longer than this for the faces (system fallbacks are fine on a very slow link). */
const FONTS_CAP_MS = 4000
/** Results never land sooner than this after a search (the readout needs a beat to read). */
const MIN_DWELL_MS = 1800
/**
 * …and land this long before the camera arrives. The panel's handoff (readout out 160 ms, headline wipe
 * 480 ms, then the staggered blocks) then has the headline settled ~200 ms before arrival and the rest
 * landing with the reticle lock. (Plan K2 said 700 ms; measured, that put the headline 80 ms late.)
 */
const LEAD_BEFORE_ARRIVAL_MS = 1000
/** Never wait on the camera longer than this (a globe that stops reporting must not stall results). */
const MAX_CAMERA_WAIT_MS = 6000
/**
 * R-M1: from the camera window, the first paint waits at most this long for the settled report: the final one
 * (not the partial), carrying its clear cover when the week needs one (not `coverPending`).
 */
const SETTLE_RACE_MS = 1500
/** …extended by at most this much when the engine says the final report is due just after that (finalDueAt). */
const SETTLE_GRACE_MS = 600
/**
 * …and by at most this much more while the week's clear cover is still being checked (coverPending): the cover
 * is the photo the owner wants first, and after the first paint the hero never changes (results pins it).
 */
const COVER_GRACE_MS = 1000
/** The hero image gets at most this much extra time to decode. */
const HERO_RACE_MS = 1200
/** Background report patches are applied at most once per this window (trailing). */
const UPDATE_BATCH_MS = 400
/** A clear cover that arrives after the results gets this long to decode before it is shown anyway. */
const COVER_RACE_MS = 6000
/** An archive outage is retried once, this long after the report landed. */
const ARCHIVE_RETRY_MS = 8000

// ───────────────────────────── boot ─────────────────────────────

let catalogFailed = false
const CATALOG_ERROR = 'Could not load the orbit catalog. Check your connection and try again.'

/** Load the catalog in the background. A failure surfaces only when no report is running (that one reports it). */
function startCatalog() {
  catalogFailed = false
  loadCatalog().then(
    () => useApp.getState().setCatalogReady(true),
    (e: unknown) => {
      console.error(e)
      catalogFailed = true
      const phase = useApp.getState().phase
      if (phase === 'idle' || phase === 'locating') useApp.getState().setPhase('error', CATALOG_ERROR)
    },
  )
}

let booted = false

export async function boot() {
  // Once per page (React StrictMode replays mount effects in development).
  if (booted) return
  booted = true
  const bootStart = performance.now()
  mark('boot')
  const target = readUrlTarget(location.search)
  // A place link that carries `tl` opens the time-lapse over its results (ui/results/TimelapseEntry.tsx).
  if (target?.kind === 'q') useTimelapseUi.getState().request(timelapseParam(location.search))
  // Everything that can overlap does: the share lookup, the catalog, the globe's first light, the fonts.
  const shareP: Promise<Share | null> | null = target?.kind === 'share' ? getShare(target.id).catch(() => null) : null
  let shareSettled = false
  void shareP?.then(() => (shareSettled = true))
  // A deep link computes as soon as boot ends, so its engine and time-zone table load now (the landing
  // loads them at idle).
  if (target) {
    void ensureTz()
    void loadEngine().catch(() => undefined)
  }
  startCatalog()
  const fonts = loadFirstFonts()

  await Promise.race([waitFor(() => useApp.getState().globeReady), sleep(12_000)])
  await raceTimeout(fonts, FONTS_CAP_MS)
  mark('first-light')
  await sleep(Math.max(0, LOGO_MIN_MS - performance.now()))

  // R2K2: a deep or share link flies to its place straight from boot. The globe uploads the sharp day map under
  // the curtain; give it a moment (from first light, alongside the share lookup) so the flight is planned once,
  // at the sharp range, instead of landing at the blurry floor and re-zooming. The landing never waits.
  const sharp = target ? Promise.race([waitFor(() => useApp.getState().dayMapSharp), sleep(SHARP_MAP_WAIT_MS)]) : undefined

  // Resolve the URL target while the boot log is still up.
  let run: { place: Place; opts: RunOpts; share?: Share } | null = null
  if (target?.kind === 'q') run = { place: target.place, opts: target.opts }
  else if (shareP) {
    const share = await raceTimeout(shareP, Math.max(SHARE_MIN_AFTER_LIGHT_MS, SHARE_CAP_MS - (performance.now() - bootStart)))
    if (share) run = shareRun(share)
    // Unknown, expired or invalid share (settled with null): the landing, with a clean address bar.
    else if (shareSettled) history.replaceState(history.state, '', location.pathname)
    // Still pending: the landing, keeping ?s= — it opens when it answers, if the landing is untouched.
    else adoptLateShare(shareP, bootStart)
  }

  if (run) {
    await sharp
    mark(useApp.getState().dayMapSharp ? 'boot-run-sharp' : 'boot-run-unsharp')
    // Straight from boot to computing: runReport sets the phase, the curtain lifts onto the panel.
    if (run.share) useApp.getState().setShared(run.share)
    void runReport(run.place, run.opts)
    return
  }
  if (catalogFailed) {
    useApp.getState().setPhase('error', CATALOG_ERROR)
    return
  }
  mark('boot-landing')
  useApp.getState().setPhase('idle')
  warmAfterLanding()
}

/** Once the landing's entrance is over: the report engine, its workers, the time-zone table and the hover names. */
function warmAfterLanding() {
  afterLandingEntrance(() => {
    void loadEngine().then(warmPassWorkers, () => undefined)
    void ensureTz()
    loadNamesWhenIdle()
  })
}

/** Request the first screens' faces now (nothing renders them until the landing does), then wait for fonts.ready. */
async function loadFirstFonts(): Promise<void> {
  const fonts = (document as Document & { fonts?: FontFaceSet }).fonts
  if (!fonts) return
  try {
    await Promise.all(FIRST_FONTS.map((f) => fonts.load(f)))
    await fonts.ready
  } catch {
    /* system fallbacks */
  }
}

/** The report a share opens: its place, with the window centred on the pass when it is older than the default window. */
function shareRun(share: Share): { place: Place; opts: RunOpts; share: Share } {
  const place: Place = { label: share.placeLabel, lat: share.lat, lon: share.lon, source: 'url' }
  return { place, opts: { ...passLinkOpts(share.tClosest ?? Date.now(), share.norad), geoItem: sharedGeoItem(share) }, share }
}

/**
 * R2K1 (c): the share lookup outlived boot's cap and the landing is up. If it answers within 15 s of boot and
 * the visitor hasn't started anything (still on the landing, About closed, no field focused, the search field
 * empty, the address bar still the share link), open it exactly as the on-time path would. Otherwise drop it:
 * a search replaces ?s= in the address bar (writeUrl). This path never cleans the address bar itself (a late null
 * can't tell "unknown" from "timed out"); the landing keeps ?s= until the visitor starts a search of their own
 * (lateShare, below), so a landing they come back to after it is clean (src/app/lateShare.ts).
 */
const lateShare = createLateShareGate()
export const isShareUnresolved = () => lateShare.unresolved()

function adoptLateShare(shareP: Promise<Share | null>, bootStart: number) {
  lateShare.start(bootStart + LATE_SHARE_MS)
  void shareP.then((share) => {
    // Too late, or the visitor has started their own search.
    if (!lateShare.answered()) return
    const st = useApp.getState()
    // A late null is unknown OR a lookup that timed out: either way ?s= stays (a reload may still find it).
    if (!share) return
    const linked = new URLSearchParams(location.search).has('s')
    if (!linked || st.phase !== 'idle' || st.aboutOpen || landingTouched()) return
    const run = shareRun(share)
    st.setShared(share)
    void runReport(run.place, run.opts)
  })
}

/** Has the visitor started using the landing (a field focused, or text typed into the search field)? */
function landingTouched(): boolean {
  if (typeof document === 'undefined') return false
  if (document.activeElement?.closest?.('input, textarea, select, [contenteditable="true"]')) return true
  const fields = document.querySelectorAll<HTMLInputElement>('input:not([type]), input[type="text"], input[type="search"]')
  return [...fields].some((f) => f.value.trim() !== '')
}

/**
 * Run `fn` in idle time once the UI's entrance animations are over (store.motionBusyUntil, written by the
 * landing as enterDelay + 1600 ms). Used to keep worker spawns and chunk fetches out of the hero entrance.
 */
export function afterLandingEntrance(fn: () => void) {
  const go = () => {
    const busy = useApp.getState().motionBusyUntil - performance.now()
    if (busy > 16) {
      setTimeout(go, busy + 32)
      return
    }
    whenIdle(fn)
  }
  // The landing mounts and writes its hold in the commit after 'idle'; look a frame later.
  setTimeout(go, 64)
}

/** Hover-label names for the off-profile objects (compact catalog), once the catalog is in. */
function loadNamesWhenIdle() {
  loadCatalog().then(
    () => whenIdle(() => void loadCatalogNames(), 4000),
    () => undefined,
  )
}

export function whenIdle(fn: () => void, timeout = 1500) {
  const ric = (globalThis as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback
  if (ric) ric(fn, { timeout })
  else setTimeout(fn, 120)
}

// ───────────────────────────── reports ─────────────────────────────

/** The last run, so "Try again" re-runs it without retyping. */
let lastRun: { place: Place; opts: RunOpts } | null = null

/**
 * Re-run the last report (error notice, archive-outage headline). Falls back to the stored place. Returns the
 * catalog retry when that is what it does, so the notice can say it is trying.
 */
export function retryReport(): Promise<void> | void {
  const st = useApp.getState()
  if (lastRun && (!st.place || (st.place.lat === lastRun.place.lat && st.place.lon === lastRun.place.lon))) {
    mark('retry') // usage stats: this search is a retry (src/app/telemetry.ts)
    void runReport(lastRun.place, lastRun.opts)
    return
  }
  if (st.place) {
    mark('retry')
    void runReport(st.place)
    return
  }
  return retryCatalog()
}

let catalogRetry: Promise<void> | null = null

/**
 * Nothing to re-run (the catalog failed before any search): load the catalog again BEHIND the notice, and go to
 * the landing once it is in. The phase stays 'error' meanwhile: 'boot' belongs to the loading screen (it re-keys
 * the HUD's lines, which blanked and wiped in again on every retry), and a landing shown on the way could flash
 * for a frame before a second failure. A second failure leaves the notice where it is.
 */
function retryCatalog(): Promise<void> {
  catalogRetry ??= (async () => {
    catalogFailed = false
    try {
      await loadCatalog()
      useApp.getState().setCatalogReady(true)
      if (useApp.getState().phase === 'error') {
        useApp.getState().setPhase('idle')
        warmAfterLanding()
      }
    } catch (e) {
      console.error(e)
      catalogFailed = true
    } finally {
      catalogRetry = null
    }
  })()
  return catalogRetry
}

export async function runReport(place: Place, opts: RunOpts = {}) {
  mark('run-report')
  // The visitor's own search (or the late share itself, already answered): a pending share no longer opens.
  lateShare.cancel()
  // S4: the lead photo's crop goes out the moment its scene is known (onArchive, ~1–2 s from now): its URL builders and
  // loader (the results chunk) load now, alongside the archive search, not after it (measured: up to 0.8 s later).
  void loadHeroTools().catch(() => undefined)
  inflight?.abort()
  const ctrl = new AbortController()
  inflight = ctrl
  lastRun = { place, opts }
  const s = useApp.getState()
  // A new place (inline search, not the share's own place) drops the share context.
  if (s.shared && (Math.abs(s.shared.lat - place.lat) > 0.02 || Math.abs(s.shared.lon - place.lon) > 0.02)) s.setShared(undefined)
  s.selectPass(undefined)
  s.setReport(undefined)
  s.setPlace(place)
  const end = opts.now ?? Date.now()
  s.setPendingWindow([end - 7 * DAY, end])
  s.setProgress({ stage: 'catalog', message: 'Loading orbital elements' })
  // The camera flight this search starts is the first one with an id above this.
  const flightBefore = s.cameraFlight.id
  s.setPhase('computing')
  s.setTimeMode('live')
  s.setCamera({ kind: 'place', lat: place.lat, lon: place.lon })
  // R2K3: the address bar and the lookup count are not in the submit task (history.replaceState and a fetch
  // cost the keydown task several ms on a phone): they go out in a task of their own right after it (~1 ms;
  // queued now, so no frame or panel mount can hold them back). The URL write is skipped if a newer search
  // started or anything wrote the address bar since (a pass selection writing ?p=).
  const urlWritesBefore = urlWrites
  setTimeout(() => {
    if (inflight === ctrl && urlWrites === urlWritesBefore) writeUrl(place)
    if (place.source !== 'url') void recordLookup(place).catch(() => undefined)
  }, 0)

  const started = performance.now()
  /** The newest non-partial report (the final one, then each background patch). */
  let finalReport: EngineReport | undefined
  /** The newest partial report (the engine re-sends it once with its clear cover, when it finds one before the final). */
  let partialReport: EngineReport | undefined
  /** Called whenever finalReport changes, while the first paint waits for the settled report. */
  let onNewer: (() => void) | undefined
  let heroP: Promise<unknown> | undefined
  let firstWarm: Promise<void> | undefined
  let firstShow: Promise<void> | undefined
  let shown = false
  /** The clear cover already preloaded for this run (its id), and its decode (shared by every later swap). */
  let coverSeen: string | undefined
  let coverReady: Promise<unknown> = Promise.resolve()

  /** The first time results appear: wait for the camera, the settled report (briefly) and the hero image. */
  const showFirst = async (r: EngineReport) => {
    mark(r.partial ? 'partial-report' : 'final-report')
    // (1) Decode the picture that will lead the panel while the camera is still flying, and build the panel's
    //     model in idle time, so the handoff render only reads the cache (R2K3).
    heroP ??= preloadHero(r, opts)
    void prewarmModel(r)
    // …and start the panel's first thumbnails and the gallery's next photos (after the hero's decode), so the panel
    // does not request them only when it mounts.
    firstWarm ??= warmFirst(r, heroP, !leadsWithPass(opts))
    // (2) Land ~1 s before the camera arrives, never sooner than 1.8 s after the search.
    await waitForCamera(started, flightBefore, ctrl.signal)
    mark('camera-window')
    if (inflight !== ctrl) return
    // (3) R-M1: one coherent arrival. Up to 1.5 s more for the settled report (the final one, with its clear
    //     cover when the week needs one), so the headline and the hero are chosen once. If the final is late,
    //     the newest partial leads (with the cover, when the engine found it by then).
    const current = () => finalReport ?? partialReport ?? r
    // A share or pass link opens on that pass's photo: the clear cover doesn't lead, so only the final report counts.
    const settled = (x: EngineReport) => isSettled(x, leadsWithPass(opts))
    if (!settled(current())) {
      // An imminent final report (the engine's GIBS budget ends just after the window) is worth the extra moment.
      const wait = settleWaitMs(performance.now(), SETTLE_RACE_MS, SETTLE_GRACE_MS, (partialReport ?? r).finalDueAt)
      await raceTimeout(
        new Promise<void>((res) => (onNewer = () => settled(current()) && res())),
        wait,
      )
      if (inflight !== ctrl) return
      // Still checking the clear cover: a little longer for it (the report itself may stay partial).
      if (!leadsWithPass(opts) && current().coverPending)
        await raceTimeout(
          new Promise<void>((res) => (onNewer = () => !current().coverPending && res())),
          COVER_GRACE_MS,
        )
    }
    onNewer = undefined
    if (inflight !== ctrl) return
    const best = current()
    mark(settled(best) ? 'report-settled' : 'report-unsettled')
    if (best !== r) heroP = preloadHero(best, opts) // usually the same URL, or the cover's (warmed by onCover)
    // (4) The hero image, decoded, or at most 1.2 s more.
    await raceTimeout(heroP, HERO_RACE_MS)
    mark('hero-ready')
    if (inflight !== ctrl) return
    // A report that came in meanwhile lands with the first paint if its photo #1 is the same one or is decoded
    // too (a cover that arrived during the decode is never painted undecoded); otherwise it follows through the
    // update path after the entrance (results keeps the painted hero).
    const newer = current()
    const paint = newer !== best && (await heroIsReady(newer, best, opts)) ? newer : best
    if (inflight !== ctrl) return
    if (paint.clearCover) {
      // The hero preload covers it (or the preselected pass leads, and the gallery preloads its neighbours).
      coverSeen = paint.clearCover.id
      coverReady = heroP ?? coverReady
    }
    // (5) The model of the report about to land, built in an earlier idle task (normally long done by now).
    await raceTimeout(prewarmModel(paint), 400)
    if (inflight !== ctrl) return
    const st = useApp.getState()
    shown = true
    mark('set-report')
    // One tick: report, preselection and phase together (the results view retargets the camera from here).
    st.setReport(paint)
    const pre = pickPreselect(paint, opts)
    if (pre) st.selectPass(pre)
    st.setPhase('results')
    mark('results')
    // Anything newer than the painted report follows in place, after the entrance (results keeps the hero).
    if (finalReport && finalReport !== paint && updateTimer === undefined) updateTimer = setTimeout(flushUpdate, UPDATE_BATCH_MS)
  }

  /**
   * The newest background patch, applied once its model is built in idle time (the swap's render only reads
   * the cache) and, for a clear cover that arrives late (owner D), once its photo is decoded, so it cross-fades
   * in, never blank. A newer patch that lands meanwhile supersedes it.
   */
  let updateTimer: ReturnType<typeof setTimeout> | undefined
  const flushUpdate = () => {
    updateTimer = undefined
    const next = finalReport
    if (!next || inflight !== ctrl) return
    // Never mid-entrance: the results' handoff holds motion (~900 ms); the patch lands right after it, in place.
    const busy = useApp.getState().motionBusyUntil - performance.now()
    if (busy > 16) {
      updateTimer = setTimeout(flushUpdate, busy + 32)
      return
    }
    void ready(next).then(() => finalReport === next && apply(next))
  }
  /**
   * `r` can be swapped in without a flash: its model is built, and its clear cover is decoded. A newer patch that
   * supersedes a swap still waiting on the cover's decode waits on that same decode (never swaps the cover in blank).
   */
  const ready = (r: Report): Promise<unknown> => {
    if (r.clearCover && r.clearCover.id !== coverSeen) {
      coverSeen = r.clearCover.id
      coverReady = raceTimeout(preloadCover(r), COVER_RACE_MS)
    }
    return Promise.all([prewarmModel(r), r.clearCover ? coverReady : undefined])
  }

  /** Every later report (final after partial, background patches) applies at once. */
  const apply = (r: Report) => {
    if (inflight !== ctrl) return
    if (!shown) return
    const st = useApp.getState()
    if (st.report === r) return
    // A background retry may have swapped in a report whose archives answered: a late patch of this run's
    // archive-outage report must never take it back.
    if (r.archiveFailed && st.report && !st.report.archiveFailed) return
    st.setReport(r)
    if (st.selectedPassId && !r.passes.some((p) => p.id === st.selectedPassId)) st.selectPass(undefined)
  }

  const progress = progressWriter(ctrl)
  try {
    // R2K3: the engine's synchronous start (archive requests, catalog targets, worker posts: ~40 ms on a 4×
    // throttled phone) runs in the first task after the next frame, so the submit task carries only the phase
    // flip, and the first frame of the landing's exit and the camera's flight paints without it. That task is
    // queued from the frame's first rAF callback, ahead of the panel's mount (Main sets panelReady from a later
    // one), so the archive requests never wait on the panel.
    await afterNextFrame()
    if (inflight !== ctrl) return
    const { computeReport } = await loadEngine()
    if (inflight !== ctrl) return
    const report = await computeReport(place, {
      now: opts.now,
      geoItem: opts.geoItem,
      signal: ctrl.signal,
      onProgress: progress.write,
      // The archive answers ~2 s before the partial report: start the likely hero's crop now (Planetary
      // Computer renders it on demand, 1–2.5 s cold), so it is decoded by the time results land. Sentinel-2's scenes
      // come first, alone, the moment that archive answers: a clear one leads whatever Landsat has, so its crop
      // starts then (the second call, with every scene, finds the same URL in flight: one request).
      onArchive: (caps) => {
        if (inflight === ctrl) void warmLikelyHero(caps, opts)
      },
      // R-M1: the week has no clear photo and the last clear look is found (usually before the first report):
      // its photo will lead the panel, so it downloads now, while the camera flies.
      onCover: (c) => {
        if (inflight === ctrl && !leadsWithPass(opts)) void warmPhoto(c)
      },
      onPartial: (r) => {
        if (inflight !== ctrl) return
        partialReport = r
        onNewer?.()
        firstShow ??= showFirst(r)
      },
      // Background verification after the final report: counts only ever go up.
      onUpdate: (r) => {
        finalReport = r
        onNewer?.()
        // Background patches come in bursts (a dozen GIBS answers within ~100 ms): one swap per burst. Before
        // the first paint, showFirst picks them up itself.
        if (shown && updateTimer === undefined) updateTimer = setTimeout(flushUpdate, UPDATE_BATCH_MS)
      },
    })
    if (inflight !== ctrl) return
    // A report needs the catalog: if the boot-time load had failed, this one succeeded (the HUD re-reads it).
    if (!useApp.getState().catalogReady) useApp.getState().setCatalogReady(true)
    finalReport = report
    onNewer?.()
    void prewarmModel(report)
    if (firstShow) {
      await firstShow
      // The final report after a partial one (a clear cover may have arrived with it) goes through the same
      // path as the background patches: after the results' entrance, ready (model built, new cover decoded),
      // then swapped in place; a newer patch supersedes it.
      if (updateTimer === undefined) flushUpdate()
    } else await showFirst(report)
    if (inflight !== ctrl) return
    progress.cancel()
    useApp.getState().setProgress({ stage: 'done', message: 'Report ready' })
    // Deep links never idle on the landing: fetch the hover names after the results entrance instead.
    afterLandingEntrance(loadNamesWhenIdle)
    if (report.archiveFailed) scheduleArchiveRetry(place, opts, ctrl)
  } catch (e) {
    progress.cancel()
    if (ctrl.signal.aborted) return
    console.error(e)
    // The place stays in the store, so "Try again" needs no input. Say what actually failed: without a
    // catalog no pass can be computed (the HUD says "catalog unavailable" too).
    useApp.getState().setPhase('error', currentCatalog() ? 'Something went wrong computing passes for this place. Try again in a moment.' : CATALOG_ERROR)
  }
}

/**
 * Sentinel-2 / Landsat archives didn't answer: try the whole report once more in the background after 8 s
 * (same window, so pass ids and the selection survive) and swap it in if the archives answered this time.
 */
function scheduleArchiveRetry(place: Place, opts: RunOpts, ctrl: AbortController) {
  const windowEnd = useApp.getState().report?.windowEnd
  const timer = setTimeout(async () => {
    if (inflight !== ctrl || ctrl.signal.aborted) return
    try {
      const { computeReport } = await loadEngine()
      const r = await computeReport(place, { now: windowEnd ?? opts.now, geoItem: opts.geoItem, signal: ctrl.signal })
      if (inflight !== ctrl || r.archiveFailed || r.partial) return
      const cur = useApp.getState().report
      // Only ever swap in a strictly better, final report: never fewer photographs than the user already saw
      // (a GIBS budget cut on the retry can verify fewer weather mosaics than the first run did).
      if (cur && r.counts.imaged < cur.counts.imaged) return
      // Swapped in place like any background patch: its model built, and a clear cover (now that the archives
      // answered) decoded first, so it never lands as an empty frame.
      await Promise.all([prewarmModel(r), r.clearCover ? raceTimeout(preloadCover(r), COVER_RACE_MS) : undefined])
      if (inflight !== ctrl) return
      const st = useApp.getState()
      st.setReport(r)
      if (st.selectedPassId && !r.passes.some((p) => p.id === st.selectedPassId)) st.selectPass(undefined)
    } catch {
      /* aborted or failed again: the headline already says so, and Try again is there */
    }
  }, ARCHIVE_RETRY_MS)
  ctrl.signal.addEventListener('abort', () => clearTimeout(timer), { once: true })
}

/**
 * Progress events can arrive many times per frame (pass workers, mosaic probes): one store write per frame.
 * Except at a stage change: the finished stage's last event is written first, so the readout's completed
 * line keeps its final words ("394 / 394", not whichever count happened to land on a frame boundary).
 */
function progressWriter(ctrl: AbortController) {
  let pending: ProgressEvent | undefined
  let raf = 0
  const flush = () => {
    raf = 0
    if (inflight === ctrl && pending) useApp.getState().setProgress(pending)
    pending = undefined
  }
  return {
    write: (e: ProgressEvent) => {
      if (inflight !== ctrl) return
      if (pending && pending.stage !== e.stage) useApp.getState().setProgress(pending)
      pending = e
      if (!raf) raf = requestAnimationFrame(flush)
    },
    /** Drop anything not yet written (a stale event must never overwrite 'done'). */
    cancel: () => {
      if (raf) cancelAnimationFrame(raf)
      raf = 0
      pending = undefined
    },
  }
}

/**
 * R2K3: build the results panel's model of `r` in idle time (the results chunk's prewarmResultsModel caches it
 * per report), so the commit that shows or swaps the report only reads the cache. Resolves once built (or on
 * failure; never rejects). Dynamic import only: the results chunk stays out of the first bundle.
 */
const warmedModels = new WeakMap<Report, Promise<void>>()
function prewarmModel(r: Report): Promise<void> {
  let p = warmedModels.get(r)
  if (!p) {
    p = import('@/ui/results').then(
      (m) =>
        new Promise<void>((resolve) =>
          whenIdle(() => {
            mark('model-prewarm')
            try {
              m.prewarmResultsModel(r)
            } catch (err) {
              console.error(err)
            }
            mark('model-ready')
            // Resolve in a task of its own: whoever awaits it (the report swap) never shares this one.
            setTimeout(resolve, 0)
          }, 300),
        ),
      () => undefined,
    )
    warmedModels.set(r, p)
  }
  return p
}

/**
 * What the hero preload needs: the results' URL builders and its decoded-photo cache. Loaded on first use (they
 * are in the results chunk, which a search has requested by then), so they stay out of the first bundle.
 * Preloading through the results' own loader (`loadPhoto`) leaves the decoded element in its cache, so the
 * gallery's first frame shows the photo with no "acquiring" state and no fade, from the one request (owner A2).
 */
const loadHeroTools = () =>
  Promise.all([import('@/ui/results/bestLook'), import('@/ui/results/lib/captures'), import('@/ui/results/lib/photos'), import('@/ui/results/images')]).then(
    ([best, caps, photos, images]) => ({ ...best, ...caps, ...photos, ...images }),
  )

/** A share or a pass deep link leads with that pass's own photo, not the cover. */
const leadsWithPass = (opts: RunOpts) => !!opts.selectPassId || opts.selectNorad !== undefined

/** Download and decode `capture`'s card photo through the results' cache (the URL the hero requests). Never rejects. */
async function warmPhoto(capture: Capture): Promise<void> {
  try {
    const { cardUrl, loadPhoto } = await loadHeroTools()
    await loadPhoto(cardUrl(capture)).catch(() => undefined)
  } catch (err) {
    console.error(err)
  }
}

/** Scene cloud at or above this reads as clouded over (the results' isClouded threshold). */
const CLOUDED_PCT = 70

/**
 * Before any pass is matched: download the photo most likely to lead the panel. The shared pass's own scene
 * for a share link; otherwise the gallery's cover rule (owner B1 + D1) without the spot check: the most
 * zoomed-in scene that isn't clouded over (smallest gsdM), the clearer scene cloud (under 20 % is likely
 * clear at the spot), then the newest. With only clouded scenes nothing: the clear cover will lead (R-M1).
 * A wrong guess costs one crop download; the right one is a cache hit for preloadHero and the hero (same
 * URL). Never rejects.
 */
async function warmLikelyHero(caps: Capture[], opts: RunOpts): Promise<void> {
  try {
    const { cardUrl, isDetailed, loadPhoto } = await loadHeroTools()
    const detailed = caps.filter(isDetailed)
    // A preselected pass (share, or a ?p=<norad>-<minute> deep link): its own scene, the one nearest in time.
    const fromId = opts.selectPassId ? /^(\d+)-(\d+)$/.exec(opts.selectPassId) : null
    const norad = opts.selectNorad ?? (fromId ? Number(fromId[1]) : undefined)
    const cloud = (c: Capture) => c.cloudCoverPct ?? 50
    let pick: Capture | undefined
    if (norad !== undefined) {
      const near = opts.selectNear ?? (fromId ? Number(fromId[2]) * 60_000 : Date.now())
      pick = detailed.filter((c) => c.norad === norad).sort((a, b) => Math.abs(a.datetime - near) - Math.abs(b.datetime - near))[0]
    } else {
      const clear = detailed.filter((c) => cloud(c) < CLOUDED_PCT)
      const tier = (c: Capture) => (cloud(c) < 20 ? 0 : cloud(c) < 45 ? 1 : 2)
      // Every scene is clouded over: the engine is already looking for the last clear look, which will lead
      // (onCover downloads it). The least cloudy scene is only the fallback; the first report preloads it.
      if (!clear.length) return
      pick = [...clear].sort((a, b) => a.gsdM - b.gsdM || tier(a) - tier(b) || b.datetime - a.datetime)[0]
    }
    if (pick) await loadPhoto(cardUrl(pick)).catch(() => undefined)
  } catch (err) {
    console.error(err)
  }
}

/** The URL of the photo that leads the panel: the preselected pass's (share / deep link), else the cover. */
async function heroUrl(r: Report, opts: RunOpts): Promise<string | undefined> {
  const { bestLookImageUrl, captureFor, cardUrl } = await loadHeroTools()
  const pre = pickPreselect(r, opts)
  const pass = pre ? r.passes.find((p) => p.id === pre) : undefined
  const capture = pass ? captureFor(r, pass) : undefined
  return capture ? cardUrl(capture) : bestLookImageUrl(r)
}

/** `next` leads with `prev`'s photo, or with one that is decoded already (so it can be painted at once). */
async function heroIsReady(next: Report, prev: Report, opts: RunOpts): Promise<boolean> {
  try {
    const [a, b, { decodedPhoto }] = await Promise.all([heroUrl(next, opts), heroUrl(prev, opts), loadHeroTools()])
    return a === b || !!decodedPhoto(a)
  } catch {
    return false
  }
}

/** The results' first photos after the hero (ui/results warm.ts), once the report's model is built. Never rejects. */
function warmFirst(r: Report, heroDecoded: Promise<unknown>, withGallery: boolean): Promise<void> {
  return prewarmModel(r)
    .then(() => import('@/ui/results'))
    .then((m) => m.warmFirstPhotos(r, heroDecoded, withGallery))
    .catch((err) => console.error(err))
}

/** Download and decode the report's cover photo (gallery photo #1: the clear cover when it leads). Never rejects. */
async function preloadCover(r: Report): Promise<unknown> {
  try {
    const { bestLookImageUrl, loadPhoto } = await loadHeroTools()
    const url = bestLookImageUrl(r)
    return url ? await loadPhoto(url).catch(() => undefined) : undefined
  } catch (err) {
    console.error(err)
    return undefined
  }
}

/** Download and decode the photo that leads the panel (see heroUrl). Never rejects. */
async function preloadHero(r: Report, opts: RunOpts): Promise<unknown> {
  try {
    const url = await heroUrl(r, opts)
    const { loadPhoto } = await loadHeroTools()
    return url ? await loadPhoto(url).catch(() => undefined) : undefined
  } catch (err) {
    console.error(err)
    return undefined
  }
}

/**
 * Resolve at max(started + 1.8 s, camera eta − 1 s). The eta is re-read whenever the globe reports a
 * flight change (a retarget moves it). Only flights that started after this search count; without one
 * (reduced-motion cut, the camera already there, no globe) the 1.8 s floor applies.
 */
function waitForCamera(started: number, flightBefore: number, signal: AbortSignal): Promise<void> {
  return new Promise<void>((resolve) => {
    let timer: ReturnType<typeof setTimeout> | undefined
    let unsub = () => {}
    const finish = () => {
      clearTimeout(timer)
      unsub()
      signal.removeEventListener('abort', finish)
      resolve()
    }
    const plan = () => {
      const f = useApp.getState().cameraFlight
      let at = started + MIN_DWELL_MS
      if (f.id > flightBefore && f.flying) at = Math.max(at, f.eta - LEAD_BEFORE_ARRIVAL_MS)
      at = Math.min(at, started + MAX_CAMERA_WAIT_MS)
      clearTimeout(timer)
      const wait = at - performance.now()
      if (wait <= 0) finish()
      else timer = setTimeout(plan, wait)
    }
    unsub = useApp.subscribe((st, prev) => {
      if (st.cameraFlight !== prev.cameraFlight) plan()
    })
    signal.addEventListener('abort', finish, { once: true })
    plan()
  })
}

export function resetToLanding() {
  inflight?.abort()
  inflight = null
  useApp.getState().reset()
  // history.state is kept: it carries the back stack's stamp for this entry (src/lib/backStack.ts).
  history.replaceState(history.state, '', location.pathname)
}

/** Address-bar writes so far: a deferred write is skipped when a newer one has happened since (R2K3). */
let urlWrites = 0

/**
 * Address-bar state. Coordinates are rounded to 3 decimals (~110 m): people copy the address bar far more
 * often than they press Share, and it must not leak a precise location (the share card promises ~1 km).
 */
export function writeUrl(place: Place, passId?: string) {
  urlWrites++
  const p = new URLSearchParams()
  p.set('q', `${place.lat.toFixed(3)},${place.lon.toFixed(3)}`)
  p.set('n', place.label)
  if (passId) p.set('p', passId)
  history.replaceState(history.state, '', `${location.pathname}?${p.toString()}`)
}

// ───────────────────────────── helpers ─────────────────────────────

/** A User Timing mark ("overflight:<name>") for performance tooling; free when nobody reads it. */
function mark(name: string) {
  try {
    performance.mark(`overflight:${name}`)
  } catch {
    /* ignore */
  }
}

/**
 * Resolve in the first task after the next frame (a message posted from that frame's rAF callback: it runs
 * before work queued by later callbacks), or after 100 ms if no frame comes (a hidden tab).
 */
function afterNextFrame(): Promise<void> {
  return new Promise((resolve) => {
    let done = false
    const go = () => {
      if (done) return
      done = true
      const mc = new MessageChannel()
      mc.port1.onmessage = () => {
        mc.port1.close()
        resolve()
      }
      mc.port2.postMessage(0)
    }
    requestAnimationFrame(go)
    setTimeout(go, 100)
  })
}

function waitFor(pred: () => boolean): Promise<void> {
  return new Promise((resolve) => {
    if (pred()) return resolve()
    const unsub = useApp.subscribe(() => {
      if (pred()) {
        unsub()
        resolve()
      }
    })
  })
}
