/**
 * computeReport: everything that passed over a place in the last N days, and the real images.
 *
 *   STAC archive search (network) ───────────────────────────────────────┐
 *   catalog ─► targets ─┬─► GIBS satellites' passes (first, 1 per worker) ─► GIBS mosaics, 1 per (sat, day) ─┐
 *                       └─► all other passes (workers) ─────────────────┴─► match ─► [onPartial] ─► match ─┴─► Report
 *
 * Everything that can overlap does: the STAC search needs nothing from the catalog, so it is sent
 * first, and the five GIBS satellites are propagated ahead of everything else so NASA's slow pixel
 * probes start within ~50 ms of the catalog (when the workers are warm). Pass search is ~0.3–0.6 s for
 * a week; the network legs dominate: STAC ~0.5–1.1 s, GIBS 3–5 s cold for the last probe.
 *
 * Time budget: the report must land in under 4 s (docs/ARCHITECTURE.md). The GIBS leg is the only
 * one whose tail we can't control, so it is the one that gets cut: at `budgetMs` (default 2.5 s; never
 * sooner than 1.2 s after its first probe, and never before the STAC leg is done, since we wait for that
 * anyway) the report keeps every mosaic verified so far, aborts the rest, and says so in a note. Those
 * passes stay 'likely', which is exactly what we know about them.
 *
 * `onPartial` delivers a complete report (geometry + Sentinel-2/Landsat matches) as soon as the STAC leg
 * is done, so the UI can show results while the weather mosaics are still being verified; the final
 * report then adds the GIBS 'imaged' upgrades.
 *
 * Imagery is never allowed to fail the report: timeouts and outages degrade to geometry-only passes,
 * with a plain-language note in `notes` (and `archiveFailed` when no Sentinel-2/Landsat archive answered,
 * which is different from "answered with nothing"). Only an abort rejects (AbortError).
 *
 * Before the partial report, the engine also reads the cloud class AT THE PLACE (`capture.spot`) for the
 * four clearest Sentinel-2/Landsat scenes (1.5 s cap, in parallel with the pass search), so the best-look
 * hero can be ranked without another round trip; and, when the week has no Sentinel-2 scene at all, it
 * asks whether Sentinel-2 images this spot at all (open ocean: no), so geometry never claims "likely".
 *
 * The clear cover (owner request D, clearCover.ts): the newest nearly cloud-free scenes of the 60 days before
 * the window are listed in parallel with the archive search. R-M1: as soon as the window's own scenes show no
 * clear detailed photo (at once when they are all clouded over, else after their spot checks), the candidates'
 * spots are checked, in parallel with the pass search, and `onCover` hands the find to the UI so its photo
 * downloads early. The report carries it as `clearCover` once the matched passes confirm the need (usually
 * already the partial report; `coverPending` says one is still being checked), else a background `onUpdate`
 * delivers it. It never holds the partial or the final report.
 *
 * After the final report, GIBS stragglers keep probing in the background; each one that comes back with
 * pixels patches the report through `onUpdate` (counts only ever go up). VIIRS stragglers count as imaged
 * by rule at the budget (see weather.ts), so the headline doesn't depend on how fast GIBS answered.
 *
 * Sentinel-1's radar images (searchRadar) are asked for alongside the archive search and NEVER waited for: they are
 * matched into whichever report is built after they answer (one search, usually in before the Sentinel-2 / Landsat
 * one), turning those radar passes from 'could' into 'imaged'. Late (the archive slow or down), they are left out and
 * the radar passes stay what geometry says. They are never the lead photo, so they hold nothing else either.
 */
import { MS_PER_DAY } from '@/lib/geo'
import { ensureTz, geoCapture, geoCaptureFromItem, latestGeoFrame, searchCapturesDetailed, searchRadar, sentinel2PlanCovers, spotCheck } from '@/imagery'
import type { Capture, GeoWatcher, LatLon, Pass, Place, ProgressEvent, Report } from '@/types'
import { featuredSats, getRow, getSatInfo, loadCatalog, type LoadedCatalog } from './catalog'
import { satrecFor } from './sgp4'
import { geoScanPass, geoWatchers } from './geostationary'
import { needsClearCover, scenesLackClearPhoto, startClearCover } from './clearCover'
import { attachCaptures, attachDailyCaptures, captureNorad, dailyCaptureTarget, MATCH_AFTER_MS, MATCH_BEFORE_MS } from './match'
import { passNear, passTargetFor, type PassTarget } from './passes'
import { passWorkerCount, runPassSearch, warmPassWorkers } from './pool'
import { clonePass } from './tracks'
import { startWeatherLeg } from './weather'

const isDetailedCapture = (c: Capture) => c.collection === 'sentinel-2-l2a' || c.collection === 'landsat-c2-l2'

/**
 * Read the cloud class at the place for the clearest detailed scenes (lowest scene cloud first), in
 * parallel, and write it to `capture.spot` (and the clear share of the photo's square to `capture.clearFraction`).
 * Resolves within `budgetMs`; an unanswered check leaves `spot` undefined. Never rejects.
 *
 * An answer that comes after the budget is dropped: the captures are shared by the partial and the final report, and
 * what they rank on (the lead photo, the globe's cover decal, the summary card's best look) must not change between
 * the two. The answer is not lost: spotCheck keeps it, so the pass view still reads it (spotCloud).
 */
function checkSpots(captures: Capture[], place: LatLon, budgetMs: number, signal?: AbortSignal): Promise<void> {
  const picks = captures
    .filter(isDetailedCapture)
    .sort((a, b) => (a.cloudCoverPct ?? 101) - (b.cloudCoverPct ?? 101) || b.datetime - a.datetime)
    .slice(0, SPOT_CANDIDATES)
  if (!picks.length) return Promise.resolve()
  let open = true
  const all = Promise.all(
    picks.map((c) =>
      Promise.resolve()
        .then(() => spotCheck(c, place, signal))
        .then(
          ({ spot, clearFraction }) => {
            if (!open) return
            // 'unknown' says nothing: leave the field for "not checked / no answer".
            if (spot && spot !== 'unknown') c.spot = spot
            if (clearFraction !== undefined) c.clearFraction = clearFraction
          },
          () => undefined,
        ),
    ),
  )
  return waitAtMost(all, budgetMs, signal)
    .catch(() => undefined)
    .finally(() => {
      open = false
    })
}

export interface ReportOptions {
  days?: number
  now?: number
  /**
   * A geostationary image this report must hold whatever is newest now: the one a shared link carries. Its watcher's
   * scan is built for that frame (not searched for), so the link opens on the picture that was shared.
   */
  geoItem?: { norad: number; collection: string; itemId: string }
  onProgress?: (e: ProgressEvent) => void
  /**
   * Called before the final result with a complete report that lacks only the GIBS weather-mosaic matches
   * (those passes are still 'likely'). Not called if nothing is pending by then. Called once more, with the
   * same report plus its `clearCover`, when the clear cover is found after that and before the final (R-M1).
   */
  onPartial?: (r: EngineReport) => void
  /**
   * Called after the final report, each time a background GIBS verification upgrades a pass (a new,
   * complete report; counts only ever go up). Without it, stragglers are dropped at the budget.
   */
  onUpdate?: (r: EngineReport) => void
  /**
   * Called as soon as the Sentinel-2/Landsat search answers (long before the partial report), with its scenes:
   * lets the UI start downloading the picture it will most likely lead with. Called first with Sentinel-2's scenes
   * alone the moment that archive answers (a clear one leads whatever Landsat has), then once with them all.
   */
  onArchive?: (captures: Capture[]) => void
  /**
   * Called at most once, as soon as the clear cover is found (the window's scenes show no clear photo; often
   * before the partial report): lets the UI download the photo that will lead the panel.
   */
  onCover?: (cover: Capture) => void
  signal?: AbortSignal
  /**
   * Time budget in ms from the call, after which NASA GIBS verifications still in flight are dropped
   * (default 3,500). The STAC leg is never cut by the budget, only by its own 20 s timeout.
   */
  budgetMs?: number
}

export interface ReportTimings {
  catalogMs: number
  passesMs: number
  /** STAC search, measured from its start (it overlaps the catalog and the pass search) */
  archiveMs: number
  /** GIBS verification, from its first probe to its last answer (or the budget cut) */
  weatherMs: number
  /** When the first usable report existed (partial or final) */
  firstResultMs: number
  totalMs: number
  /** Pass-search workers used (0 = main thread) */
  workers: number
}

/** The contract `Report`, plus caveats for footnotes and timings for diagnostics. */
export interface EngineReport extends Report {
  /** Plain sentences about degraded data (archive outage, stale elements). Empty when all is well. */
  notes: string[]
  /** True for the `onPartial` snapshot: GIBS weather mosaics not matched yet. */
  partial: boolean
  /**
   * The window needs a clear cover and it is still being looked for: a later report (or `onUpdate`) carries it,
   * or says there is none (false). Lets the UI hold its first paint briefly for the cover (R-M1).
   */
  coverPending: boolean
  /**
   * Partial reports only: when (performance.now() time) the final report is due, at the latest: the end of the
   * GIBS budget. Lets the UI wait for an imminent final report instead of painting the partial one (R-M1).
   */
  finalDueAt?: number
  timings: ReportTimings
}

/**
 * The GIBS leg's cut (see the header). 2.5 s, not 3.5 s: the results land with their photo (the controller waits for the
 * final report), and the photo is usually decoded by then; stragglers are verified in the background and patch the
 * counts up (onUpdate).
 */
export const REPORT_BUDGET_MS = 2_500
/** However late the GIBS leg starts (slow device), give it at least this long before cutting it. */
const MIN_WEATHER_MS = 1_200
const ARCHIVE_TIMEOUT_MS = 20_000
const STALE_CATALOG_MS = 3 * MS_PER_DAY
/** Spot-cloud checks for the best-look candidates: how many, and how long the partial report waits for them. */
const SPOT_CANDIDATES = 4
const SPOT_BUDGET_MS = 1_500
/** How long the partial report waits for the acquisition-plan check (open ocean). */
const PLAN_BUDGET_MS = 2_000
/** Without onUpdate (no way to deliver it later), the final report waits at most this long for the clear cover. */
const COVER_WAIT_MS = 2_500
/** The size the geostationary leg checks a frame at: the watcher's row shows this very image (results GeoWatchers.tsx). */
export const GEO_FRAME_PROBE = { halfSizeKm: 400, px: 176 }
/** A report whose window ended longer ago than this is not "now": it gets no newest geostationary frame. */
const GEO_LIVE_WINDOW_MS = 3 * 3_600_000
export const OCEAN_NOTE = "This spot is outside Sentinel-2's acquisition plan (open ocean)."

const nf = /* @__PURE__ */ new Intl.NumberFormat('en-US')
const plural = (n: number, one: string, many = `${one}S`) => `${nf.format(n)} ${n === 1 ? one : many}`
const noop = () => undefined

function abortError(): Error {
  return new DOMException('Aborted', 'AbortError')
}
function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw abortError()
}
const isAbort = (e: unknown) => e instanceof Error && e.name === 'AbortError'

/** Run `fn` with a signal that aborts on the caller's signal or after `ms`. Rejects 'TimeoutError' on timeout. */
async function withTimeout<T>(fn: (signal: AbortSignal) => Promise<T>, ms: number, outer?: AbortSignal): Promise<T> {
  const ctl = new AbortController()
  const onAbort = () => ctl.abort()
  outer?.addEventListener('abort', onAbort, { once: true })
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      ctl.abort()
      reject(Object.assign(new Error(`Timed out after ${ms} ms`), { name: 'TimeoutError' }))
    }, ms)
  })
  try {
    return await Promise.race([fn(ctl.signal), timeout])
  } finally {
    clearTimeout(timer)
    outer?.removeEventListener('abort', onAbort)
  }
}

/** Resolve when `p` settles or after `ms`, whichever is first; reject (AbortError) if `signal` aborts. */
function waitAtMost(p: Promise<unknown>, ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) return Promise.reject(abortError())
  return new Promise<void>((resolve, reject) => {
    const finish = () => {
      clearTimeout(timer)
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }
    const onAbort = () => {
      clearTimeout(timer)
      reject(abortError())
    }
    const timer = setTimeout(finish, Math.max(0, ms))
    signal?.addEventListener('abort', onAbort, { once: true })
    p.then(finish, finish)
  })
}

/** A User Timing mark ("overflight:engine-<name>") for timing probes; free when nobody reads it. */
function mark(name: string) {
  try {
    performance.mark(`overflight:engine-${name}`)
  } catch {
    /* no User Timing */
  }
}

/** Call a caller-supplied callback; a throwing UI callback must not take the report down with it. */
function safely<A>(fn: ((a: A) => void) | undefined, arg: A) {
  if (!fn) return
  try {
    fn(arg)
  } catch (err) {
    console.error('computeReport callback threw:', err)
  }
}

/** All satellites we predict passes for (only profiled ones qualify, so only the featured rows are read). */
export function passTargets(cat: LoadedCatalog): PassTarget[] {
  const out: PassTarget[] = []
  for (const s of featuredSats(cat)) {
    const row = getRow(s.norad)
    const t = row && passTargetFor(s, row)
    if (t) out.push(t)
  }
  return out
}

/** An archive scene contains the place, so its pass came this close at least (half swath + scene slop). */
const ORPHAN_MAX_GROUND_KM = 300
/** Sentinel-1 looks to one side: its IW swath lies 345–617 km from the ground track. */
const ORPHAN_MAX_GROUND_KM_RADAR = 650
const isRadarCapture = (c: Capture) => c.collection === 'sentinel-1-rtc'

/**
 * Scenes that matched no predicted pass (low sun, place at the scene edge): resolve the overflight
 * geometrically around the scene time and report it, because the photograph is the ground truth.
 * A minimum on the edge of the search window, or one too far away to have produced the scene, means
 * the overflight is not in the window (stale elements, a manoeuvre): no pass is invented then.
 */
function passesForOrphanScenes(cat: LoadedCatalog, place: LatLon, scenes: Capture[], existing: Pass[]): Pass[] {
  const out: Pass[] = []
  const byId = new Map(existing.map((p) => [p.id, p]))
  for (const c of scenes) {
    const norad = captureNorad(c)
    const info = norad !== undefined ? cat.byNorad.get(norad) : undefined
    const row = info && getRow(info.norad)
    const target = info && row && passTargetFor(info, row)
    const satrec = target && satrecFor(target.norad)
    if (!target || !satrec) continue
    const from = c.datetime - MATCH_BEFORE_MS
    const to = c.datetime + MATCH_AFTER_MS
    const p = passNear(satrec, target, place, from, to, 'imaged')
    const maxKm = isRadarCapture(c) ? ORPHAN_MAX_GROUND_KM_RADAR : ORPHAN_MAX_GROUND_KM
    if (!p || p.tClosest - from < 60_000 || to - p.tClosest < 60_000 || p.groundDistanceKm > maxKm) continue
    const same = byId.get(p.id)
    if (same) {
      // Resolved to a pass we already have (or just added for another tile of the same overflight).
      if (same.verdict !== 'imaged') Object.assign(same, { verdict: 'imaged', captureId: c.id })
      continue
    }
    p.captureId = c.id
    byId.set(p.id, p)
    out.push(p)
  }
  return out
}

export async function computeReport(place: Place, opts: ReportOptions = {}): Promise<EngineReport> {
  const { signal } = opts
  const tStart = performance.now()
  const budgetMs = opts.budgetMs ?? REPORT_BUDGET_MS
  const days = opts.days ?? 7
  const windowEnd = opts.now ?? Date.now()
  const windowStart = windowEnd - days * MS_PER_DAY
  const latLon = { lat: place.lat, lon: place.lon }
  const notes: string[] = []
  const emit = (stage: ProgressEvent['stage'], message: string, fraction?: number) => safely(opts.onProgress, { stage, message, fraction })
  throwIfAborted(signal)

  // ── STAC archive search: needs nothing from the catalog, so it goes out first ──
  emit('catalog', 'LOADING ORBITAL CATALOG', 0.02)
  const archiveStart = performance.now()
  let archiveMs = 0
  let archiveDone = false
  let archiveFailed = false
  const onSentinel2 = opts.onArchive ? (caps: Capture[]) => !signal?.aborted && safely(opts.onArchive, caps) : undefined
  const archive = withTimeout((s) => searchCapturesDetailed(latLon, windowStart, windowEnd, s, onSentinel2), ARCHIVE_TIMEOUT_MS, signal)
    .then((r) => {
      notes.push(...r.degraded)
      return r.captures
    })
    .catch((err): Capture[] => {
      if (isAbort(err) && signal?.aborted) throw err
      archiveFailed = true
      notes.push(
        err instanceof Error && err.name === 'TimeoutError'
          ? 'The Sentinel-2 and Landsat archives were too slow to answer; passes are shown from orbital geometry only.'
          : 'The Sentinel-2 and Landsat archives could not be reached; passes are shown from orbital geometry only.',
      )
      return []
    })
    .finally(() => {
      archiveMs = performance.now() - archiveStart
      archiveDone = true
      mark('archive')
    })
  // It only rejects on abort, possibly while we await something else: never leave that unhandled.
  archive.catch(noop)
  // Sentinel-1's radar images: a search of their own, matched into whichever report is built after they answer.
  let radarScenes: Capture[] | undefined
  withTimeout((s) => searchRadar(latLon, windowStart, windowEnd, s), ARCHIVE_TIMEOUT_MS, signal).then(
    (caps) => {
      radarScenes = caps
      mark('radar')
    },
    () => (radarScenes = []),
  )
  if (opts.onArchive)
    archive.then((caps) => {
      if (caps.length && !signal?.aborted) safely(opts.onArchive, [...caps])
    }, noop)
  // The cloud class at the place for the best-look candidates starts as soon as the scenes are known.
  const spots = archive.then((caps) => checkSpots(caps, latLon, SPOT_BUDGET_MS, signal), noop)
  // No Sentinel-2 scene this week (and the archive answered): does Sentinel-2 image this spot at all?
  // (Registered before anything awaits `archive`, so it has run by the time the scenes are matched.)
  let planCheck: Promise<boolean | undefined> | undefined
  archive.then((caps) => {
    if (archiveFailed || caps.some((c) => c.collection === 'sentinel-2-l2a')) return
    planCheck = Promise.resolve()
      .then(() => sentinel2PlanCovers(latLon, windowEnd, signal))
      .catch(() => undefined)
  }, noop)
  // The clear cover's candidate scenes (60 days before the window): listed now, checked only if needed.
  const coverLeg = startClearCover(latLon, windowStart, signal)
  let clearCover: Capture | undefined
  /** The cover's spot checks are done (`found` is their answer). */
  const cover = { done: false, found: undefined as Capture | undefined, told: false }
  const pickCover = () => {
    const p = coverLeg.pick()
    if (!cover.done)
      p.then(
        (c) => {
          mark(c ? 'cover-found' : 'cover-none')
          cover.found = c
          cover.done = true
          if (c && !cover.told && !signal?.aborted) {
            cover.told = true
            safely(opts.onCover, c)
          }
        },
        () => (cover.done = true),
      )
    return p
  }
  // R-M1: look for the cover as soon as the window's own scenes say there is no clear photo (at once when every
  // scene is clouded over, else once their spot checks are in), in parallel with the pass search, so it is
  // usually known before the first results. The matched passes confirm the need below.
  archive
    .then(async (caps) => {
      if (archiveFailed || signal?.aborted) return
      if (!scenesLackClearPhoto(caps)) {
        await spots
        if (!scenesLackClearPhoto(caps) || signal?.aborted) return
      }
      mark('cover-start')
      await pickCover()
    })
    .catch(noop)
  // Time zones for the report's local times (a lazy chunk; usually loaded long before).
  const tz = Promise.resolve()
    .then(() => ensureTz())
    .catch(noop)
  // Spawn the pass workers now (no-op when warm) so their start-up overlaps the catalog download.
  warmPassWorkers()

  // ── catalog ───────────────────────────────────────────────────────────────
  // Shared with the globe and the HUD: our signal stops our wait, never the shared download.
  const cat = await loadCatalog(undefined, signal)
  throwIfAborted(signal)
  const catalogMs = performance.now() - tStart
  const targets = passTargets(cat)
  emit('catalog', `CATALOG · ${plural(cat.count, 'OBJECT')}`, 0.06)
  // SGP4 error grows by roughly 1–3 km per day away from the element epoch, in either direction.
  const ageMs = windowEnd - Date.parse(cat.fetchedAt)
  if (ageMs > STALE_CATALOG_MS) {
    notes.push(`Orbital elements are ${Math.round(ageMs / MS_PER_DAY)} days old, so pass times may be off by a few minutes.`)
  } else if (-ageMs > STALE_CATALOG_MS) {
    notes.push('These passes are reconstructed from newer orbital elements, so their times may be off by a few minutes.')
  }

  // ── passes: GIBS satellites first, one per worker; everything else behind them ──
  const passStart = performance.now()
  const query = { place: latLon, t0: windowStart, t1: windowEnd }
  const hasGibs = (t: PassTarget) => getSatInfo(t.norad)?.profile?.gibs?.kind === 'daily'
  const done = { gibs: 0, other: 0 }
  const onPassProgress = () => {
    const n = done.gibs + done.other
    emit('propagate', `PROPAGATING ORBITS · ${nf.format(n)} / ${nf.format(targets.length)}`, 0.06 + 0.64 * (n / Math.max(1, targets.length)))
  }
  emit('propagate', `PROPAGATING ${plural(targets.length, 'ORBIT')} · ${days} DAYS`, 0.06)
  const gibsPasses = runPassSearch(targets.filter(hasGibs), query, {
    signal,
    chunkSize: 1,
    onProgress: (n) => ((done.gibs = n), onPassProgress()),
  })
  const otherPasses = runPassSearch(
    targets.filter((t) => !hasGibs(t)),
    query,
    { signal, onProgress: (n) => ((done.other = n), onPassProgress()) },
  )

  // ── GIBS daily mosaics: start as soon as the GIBS satellites' passes exist ──
  let verifying = false // progress for the GIBS leg is only shown once it is what we wait for
  let onLate: ((c: Capture, byRule: boolean) => void) | undefined
  let onLateSettled: ((left: number) => void) | undefined
  const weather = startWeatherLeg(latLon, gibsPasses, {
    signal,
    onSettle: (n, total) => {
      if (verifying) emit('match', `VERIFYING NASA WEATHER MOSAICS · ${nf.format(n)} / ${nf.format(total)}`, 0.86 + 0.13 * (n / total))
    },
    onLate: (c, byRule) => onLate?.(c, byRule),
    onLateSettled: (left) => onLateSettled?.(left),
    // Stragglers only keep probing when someone listens for the patches.
    lateMs: opts.onUpdate ? undefined : 0,
  })

  // The geostationary watchers need nothing from the pass search: worked out in a task of their own while the
  // workers run (on a 4x-throttled phone they cost ~70 ms, which used to sit in the task that delivers the passes).
  const geoP = new Promise<GeoWatcher[]>((resolve, reject) =>
    setTimeout(() => {
      try {
        resolve(geoWatchers(cat, latLon, windowStart, windowEnd))
      } catch (err) {
        reject(err)
      }
    }, 0),
  )
  geoP.catch(noop)

  // ── Geostationary images: the newest public frame of each watcher that has the place well inside its disc, as a
  // capture with the scan that took it as its pass (geostationary.ts geoScanPass). Asked for as soon as the watchers
  // are known and never waited for: a report carries the ones that are in when it is built, and one that comes after
  // the final report patches it through `onUpdate`. Only for a window that ends now: "newest" means nothing in an
  // older one (a shared link's).
  const geoShots: { pass: Pass; capture: Capture }[] = []
  let onGeoShot: (() => void) | undefined
  const wanted = opts.geoItem
  if (wanted) {
    const capture = geoCaptureFromItem(wanted.collection, wanted.itemId, latLon, wanted.norad)
    const pass = capture && geoScanPass(wanted.norad, latLon, capture.datetime, capture.id)
    if (capture && pass) geoShots.push({ pass, capture })
  }
  if (Math.abs(Date.now() - windowEnd) < GEO_LIVE_WINDOW_MS) {
    void geoP.then((watchers) => {
      for (const g of watchers) {
        const source = g.frames
        // One image per watcher: the shared one stands in for its newest.
        if (!source || g.rim || geoShots.some((x) => x.pass.norad === g.norad)) continue
        latestGeoFrame(source, latLon, GEO_FRAME_PROBE, { signal })
          .then((frame) => {
            if (!frame || signal?.aborted) return
            const capture = geoCapture(source, frame, latLon, g.norad)
            const pass = capture && geoScanPass(g.norad, latLon, frame.time, capture.id)
            if (!capture || !pass) return
            geoShots.push({ pass, capture })
            onGeoShot?.()
          })
          .catch(noop)
      }
    }, noop)
  }

  let passes: Pass[]
  try {
    passes = (await Promise.all([gibsPasses, otherPasses])).flat()
  } catch (err) {
    weather.stop()
    throw err
  }
  const passesMs = performance.now() - passStart
  mark('passes')
  throwIfAborted(signal)

  const geo = await geoP
  mark('geo')
  const satellitesConsidered = targets.length + featuredSats(cat).filter((s) => s.category === 'weather-geo' && s.profile?.operational).length
  /** Weather-leg sentences, recomputed for every build (background patches change them). */
  let weatherNotes: string[] = []
  /** The clear cover this report waits on (set once the matched passes confirm the window needs one). */
  let coverP: Promise<Capture | undefined> | undefined

  /** The end of the GIBS budget (set when the partial report goes out). */
  let finalDueAt: number | undefined
  const build = (list: Pass[], captures: Capture[], partial: boolean, firstResultMs: number): EngineReport => {
    // The counts are of overflights: a geostationary scan is listed among the passes (it can be opened, replayed and
    // shared like one) but never counted as one.
    const counts = { satellitesConsidered, passes: list.length, imaged: 0, likely: 0, could: 0, overhead: 0 }
    for (const p of list) counts[p.verdict]++
    const sorted = [...list, ...geoShots.map((g) => g.pass)].sort((a, b) => a.tClosest - b.tClosest)
    if (geoShots.length) captures = [...captures, ...geoShots.map((g) => g.capture)]
    const { startedAt, finishedAt } = weather.timing()
    return {
      place,
      windowStart,
      windowEnd,
      generatedAt: Date.now(),
      catalogFetchedAt: cat.fetchedAt,
      passes: sorted,
      captures,
      geo: geo.map((g): GeoWatcher => ({ ...g })),
      counts,
      notes: [...notes, ...weatherNotes],
      partial,
      archiveFailed,
      coverPending: !!coverP && !cover.done,
      // PH-02: the final report says its photo count can still grow (stragglers still probing), so the UI reads
      // "At least K" and settles in place, never shows a definite number that then changes.
      ...(!partial && opts.onUpdate && weather.lateLeft() > 0 ? { lateChecks: weather.lateLeft() } : {}),
      ...(partial && finalDueAt !== undefined ? { finalDueAt } : {}),
      ...(clearCover ? { clearCover } : {}),
      timings: {
        catalogMs,
        passesMs,
        archiveMs,
        weatherMs: startedAt ? (finishedAt || performance.now()) - startedAt : 0,
        firstResultMs,
        totalMs: performance.now() - tStart,
        workers: passWorkerCount(),
      },
    }
  }

  // ── STAC scenes ───────────────────────────────────────────────────────────
  if (!archiveDone) emit('archive', 'SEARCHING SENTINEL-2 + LANDSAT ARCHIVES', 0.72)
  let stac: Capture[]
  try {
    stac = await archive
  } catch (err) {
    weather.stop()
    throw err
  }
  throwIfAborted(signal)
  emit('match', `MATCHING ${plural(stac.length, 'SCENE')} TO ${plural(passes.length, 'PASS', 'PASSES')}`, 0.8)
  mark('archive-in')
  const orphans = attachCaptures(passes, stac)
  passes.push(...passesForOrphanScenes(cat, latLon, orphans, passes))
  /** The radar images matched to a pass so far (once, as soon as the radar search has answered). */
  let radar: Capture[] = []
  let radarMatched = false
  const matchRadar = () => {
    if (radarMatched || radarScenes === undefined || signal?.aborted) return
    radarMatched = true
    const unmatched = attachCaptures(passes, radarScenes)
    passes.push(...passesForOrphanScenes(cat, latLon, unmatched, passes))
    const used = new Set(passes.map((p) => p.captureId))
    radar = radarScenes.filter((c) => used.has(c.id))
  }
  matchRadar()
  /** Every scene of the window the report shows: Sentinel-2 / Landsat, and the radar images matched so far. */
  const scenes = () => [...stac, ...radar]

  // Spot classes for the best look, the open-ocean check and the time-zone table: all were started long
  // ago; whatever isn't in by its budget doesn't hold the report.
  mark('matched')
  await Promise.all([spots, tz])
  throwIfAborted(signal)
  const planAnswer = planCheck ? await waitForValue(planCheck, PLAN_BUDGET_MS, signal) : undefined
  throwIfAborted(signal)
  if (planAnswer === false) {
    let recast = 0
    for (const p of passes) {
      if (p.verdict !== 'likely' || getSatInfo(p.norad)?.category !== 'open-optical') continue
      p.verdict = 'overhead'
      recast++
    }
    if (recast) notes.push(OCEAN_NOTE)
  }

  /** The partial report's snapshot, until the final report is built (a cover found meanwhile re-sends it). */
  let partialSnapshot: Pass[] | undefined
  let partialScenes: Capture[] | undefined
  let partialHadCover = false
  // No clear Sentinel-2 / Landsat photo this week: the last clear look from before it (usually found by now).
  if (!archiveFailed && needsClearCover(passes, stac)) {
    coverP = pickCover().then(
      (c) => {
        clearCover = c
        // Found after the partial report and before the final one: the partial again, with its cover, so the
        // UI can lead with the right photo whichever report it paints first.
        if (c && partialSnapshot && !partialHadCover && !signal?.aborted) safely(opts.onPartial, build(partialSnapshot, partialScenes ?? scenes(), true, firstResultMs))
        return c
      },
      (): undefined => undefined,
    )
    if (cover.done) clearCover = cover.found
  }

  let firstResultMs = 0
  if (!weather.isDone() && opts.onPartial) {
    firstResultMs = performance.now() - tStart
    finalDueAt = Math.max(tStart + budgetMs, (weather.timing().startedAt || performance.now()) + MIN_WEATHER_MS)
    mark('partial')
    matchRadar()
    // Snapshot: the final report mutates verdicts on these passes, so hand out copies.
    partialSnapshot = passes.map(clonePass)
    partialScenes = scenes()
    partialHadCover = !!clearCover
    const partialReport = build(partialSnapshot, partialScenes, true, firstResultMs)
    mark('partial-built')
    safely(opts.onPartial, partialReport)
    mark('partial-sent')
  }

  // ── GIBS mosaics, within the time budget ─────────────────────────────────
  if (!weather.isDone()) {
    verifying = true
    const { total, settled } = weather.progress()
    emit('match', total ? `VERIFYING NASA WEATHER MOSAICS · ${nf.format(settled)} / ${nf.format(total)}` : 'VERIFYING NASA WEATHER MOSAICS', 0.86 + 0.13 * (total ? settled / total : 0))
    const startedAt = weather.timing().startedAt || performance.now()
    const deadline = finalDueAt ?? Math.max(tStart + budgetMs, startedAt + MIN_WEATHER_MS)
    try {
      await waitAtMost(weather.settled, deadline - performance.now(), signal)
    } catch (err) {
      weather.stop()
      throw err
    }
  }
  const cut = weather.stop()
  const rule = weather.byRule()
  const { total: mosaics, failed } = weather.progress()
  // Stragglers that stay 'likely' (MODIS; VIIRS ones count by rule), until a late answer patches them.
  let missing = cut - rule.length + failed
  /** VIIRS images counted by rule and not confirmed yet (late confirmations shrink the footnote). */
  let unconfirmed = rule.length
  const gibsNotes = () => {
    const out: string[] = []
    if (unconfirmed > 0)
      out.push(
        `NASA GIBS was slow to confirm ${unconfirmed === 1 ? 'one VIIRS image' : `${nf.format(unconfirmed)} VIIRS images`}; VIIRS images the whole globe every day, so ${unconfirmed === 1 ? 'that pass counts' : 'those passes count'} as watched.`,
      )
    if (missing > 0) {
      const all = missing >= mosaics
      out.push(
        cut > 0
          ? all
            ? 'NASA GIBS did not answer in time, so weather-satellite images are not shown.'
            : `NASA GIBS did not return ${nf.format(missing)} of ${nf.format(mosaics)} weather-satellite images in time; those passes are shown as likely.`
          : all
            ? 'NASA GIBS could not be reached, so weather-satellite images are not shown.'
            : `NASA GIBS failed to return ${nf.format(missing)} of ${nf.format(mosaics)} weather-satellite images; those passes are shown as likely.`,
      )
    }
    return out
  }
  weatherNotes = gibsNotes()
  const weatherMatched = attachDailyCaptures(passes, [...weather.verified(), ...rule], place.lon)
  const firstMs = firstResultMs || performance.now() - tStart
  // Nobody to hand a late cover to: give it a short wait (a retry of the same report is a cache hit).
  if (coverP && !clearCover && !opts.onUpdate) await waitAtMost(coverP, COVER_WAIT_MS, signal)
  throwIfAborted(signal)
  partialSnapshot = undefined
  matchRadar()
  const shown = scenes()
  let latest = build(passes, [...shown, ...weatherMatched], false, firstMs)
  mark('final')
  emit('done', `${plural(latest.counts.passes, 'PASS', 'PASSES')} · ${plural(latest.counts.imaged, 'IMAGE')}`, 1)

  // Background: a straggler that comes back with pixels upgrades its pass in a NEW report (the delivered
  // one is never mutated), and the counts only ever go up.
  if (opts.onUpdate) {
    let current = passes
    const weatherCaps = [...weatherMatched]
    // A clear cover that came in after the final report: the same report, plus its cover. When the final went
    // out still waiting on the cover (coverPending) and the search found none, the same report says so.
    if (coverP && latest.coverPending) {
      void coverP.then(() => {
        if (signal?.aborted) return
        latest = build(current, [...shown, ...weatherCaps], false, firstMs)
        safely(opts.onUpdate, latest)
      })
    }
    onLate = (c, byRule) => {
      if (signal?.aborted) return
      if (byRule) {
        // Already counted: the image is confirmed now, so the footnote shrinks (the counts don't move).
        unconfirmed = Math.max(0, unconfirmed - 1)
        weatherNotes = gibsNotes()
        latest = build(current, [...shown, ...weatherCaps], false, firstMs)
        safely(opts.onUpdate, latest)
        return
      }
      // Only the upgraded pass is a new object; the others are shared with the delivered report (never
      // mutated after delivery), so a patch costs one copy, not ~2,000.
      const target = dailyCaptureTarget(current, c, place.lon)
      if (!target) return
      const upgraded = Object.assign(clonePass(target), { verdict: 'imaged' as const, captureId: c.id })
      current = current.map((p) => (p === target ? upgraded : p))
      weatherCaps.push(c)
      missing = Math.max(0, missing - 1)
      weatherNotes = gibsNotes()
      latest = build(current, [...shown, ...weatherCaps], false, firstMs)
      safely(opts.onUpdate, latest)
    }
    // A geostationary image that came in after the final report: the same report, plus it.
    onGeoShot = () => {
      if (signal?.aborted) return
      latest = build(current, [...shown, ...weatherCaps], false, firstMs)
      safely(opts.onUpdate, latest)
    }
    // The last straggler settled with nothing to add (no data, a failure, the late cut): the same report, now final.
    onLateSettled = (left) => {
      if (signal?.aborted || left > 0 || !latest.lateChecks) return
      latest = build(current, [...shown, ...weatherCaps], false, firstMs)
      safely(opts.onUpdate, latest)
    }
  }
  return latest
}

/** `p`'s value, or undefined after `ms` (rejects only on abort). */
async function waitForValue<T>(p: Promise<T>, ms: number, signal?: AbortSignal): Promise<T | undefined> {
  let value: T | undefined
  await waitAtMost(
    p.then((v) => {
      value = v
    }),
    ms,
    signal,
  )
  return value
}
