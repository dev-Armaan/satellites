/**
 * The NASA GIBS leg of a report: daily VIIRS / MODIS true-colour mosaics for the weather-LEO passes.
 *
 * The imagery module reads a tiny probe per mosaic and drops the ones that are empty at the place
 * (not processed yet, swath gap, instrument outage). The probes were small WMS renders until 2026-11-12:
 * GIBS renders WMS on demand and answers a single browser connection in a staircase (measured cold in
 * Chromium, 35 probes took 1.4–2.3 s median and 3.0–4.8 s for the last one), and under that day's traffic
 * it stopped answering inside the budget at all. They are read from GIBS's pre-cut tiles now
 * (imagery/gibsTiles.ts), which answer in about 0.3 s each. The budget and the rules below stay: a slow
 * connection or a bad day at NASA still leaves stragglers.
 *
 * So verification is issued one mosaic per call (one `weatherCaptures` call per satellite and UTC day,
 * which is exactly one candidate, since daily mosaics are one image per layer per UTC day), results
 * are collected as they land, and the report can `stop()` at its time budget: everything verified by
 * then is kept, and the stragglers are handled so the headline count doesn't depend on GIBS's speed:
 *
 *  - VIIRS (NOAA-20, NOAA-21, Suomi NPP): the CorrectedReflectance product is global and daily with no
 *    gaps between swaths, so a daylight in-swath pass whose probe is still out at the budget counts as
 *    imaged BY RULE (`byRule()`), but only with evidence that the instrument was producing data and the
 *    day is fully processed: the same satellite has a verified mosaic on a LATER UTC day in this report,
 *    and the pass is over a day old. Measured 2026-11-08 at Waterloo: Suomi NPP's mosaics were empty from
 *    2 Nov (instrument outage) and today's were not processed yet, so an unconditional rule claimed six
 *    photographs that do not exist (and named a satellite in the headline that took none). An explicit
 *    "no data" answer (an empty probe) never counts.
 *  - MODIS (Terra, Aqua) has equatorial gaps between swaths: a straggler stays 'likely'.
 *  - Either way the stragglers keep probing in the background (bounded by `lateMs`), and every one that
 *    comes back with pixels is reported through `onLate`, so the report can be patched upward only.
 */
import { weatherCandidates, weatherCaptures } from '@/imagery'
import type { Capture, LatLon, Pass } from '@/types'
import { getSatInfo } from './catalog'
import { utcDay } from './match'

export interface WeatherLeg {
  /** Resolves once every verification has settled, or the leg was stopped. Never rejects. */
  readonly settled: Promise<void>
  /** Captures verified so far (before `stop()`), newest first. */
  verified(): Capture[]
  /** VIIRS mosaics whose verification was still out at `stop()`: imaged by rule (see the header). */
  byRule(): Capture[]
  /** True once every verification has settled. */
  isDone(): boolean
  /** Mosaics being verified (known once the passes exist), settled, and failed (rejected). */
  progress(): { total: number; settled: number; failed: number }
  /**
   * Stop waiting. Verifications still in flight carry on in the background for up to `lateMs` (their
   * data arrives through `onLate`), then are aborted. Returns how many were cut (VIIRS and MODIS).
   */
  stop(): number
  /** performance.now() of the first request (0 if none was needed) and of the end (0 while running) */
  timing(): { startedAt: number; finishedAt: number }
  /**
   * After `stop()`: stragglers still probing whose mosaics are NOT counted by rule (an answer with pixels would add
   * a photo). Each one that settles (pixels, no data, failure, or the `lateMs` abort) leaves this count; the last
   * one calls `onLateSettled(0)`.
   */
  lateLeft(): number
}

export interface WeatherLegOptions {
  signal?: AbortSignal
  onSettle?: (settled: number, total: number) => void
  /**
   * A straggler verified after `stop()`. `byRule` is true for a VIIRS mosaic already counted by rule (its
   * pass is imaged already; only the footnote about unconfirmed images changes).
   */
  onLate?: (c: Capture, byRule: boolean) => void
  /** How long stragglers may keep probing after `stop()` (default 20 s). */
  lateMs?: number
  /**
   * A straggler that was not counted by rule settled after `stop()` (after its `onLate` calls, if it had pixels):
   * `left` of them are still out.
   */
  onLateSettled?: (left: number) => void
}

const LATE_MS = 20_000
/** A daily mosaic is complete once its UTC day is this far behind (GIBS near-real-time latency is hours). */
const PROCESSED_AFTER_MS = 24 * 3_600_000

/** Passes of satellites whose daily mosaics GIBS serves, grouped by (satellite, UTC day). */
export function mosaicGroups(passes: readonly Pass[]): Pass[][] {
  const groups = new Map<string, Pass[]>()
  for (const p of passes) {
    if (getSatInfo(p.norad)?.profile?.gibs?.kind !== 'daily') continue
    const key = `${p.norad}@${utcDay(p.tClosest)}`
    const g = groups.get(key)
    if (g) g.push(p)
    else groups.set(key, [p])
  }
  return [...groups.values()]
}

/** VIIRS daily mosaics have no inter-swath gaps (MODIS has equatorial gaps). */
export function isGapFreeMosaic(norad: number): boolean {
  return getSatInfo(norad)?.profile?.gibs?.collection.startsWith('gibs-viirs-') ?? false
}

/**
 * Start verifying the daily mosaics as soon as `passes` (the GIBS satellites' passes) resolve.
 * `onSettle` fires after each mosaic is settled. Aborting `signal` aborts every request, background
 * ones included.
 */
export function startWeatherLeg(place: LatLon, passes: Promise<Pass[]>, opts: WeatherLegOptions = {}): WeatherLeg {
  const ctl = new AbortController()
  const onOuterAbort = () => ctl.abort()
  opts.signal?.addEventListener('abort', onOuterAbort, { once: true })

  const found: Capture[] = []
  const rule: Capture[] = []
  /** Groups still being verified, by index, with the candidate each would produce. */
  const inFlight = new Map<number, Pass[]>()
  const counted = new Set<string>()
  /** Groups still out at stop() that are not counted by rule (their answer can add a photo). */
  const lateOpen = new Set<number>()
  let total = 0
  let settledCount = 0
  let failed = 0
  let stopped = false
  let done = false
  let startedAt = 0
  let finishedAt = 0
  let lateTimer: ReturnType<typeof setTimeout> | undefined
  let release: () => void = () => undefined
  const stoppedSignal = new Promise<void>((r) => (release = r))

  const work = passes
    .then(async (list) => {
      if (stopped || ctl.signal.aborted) return
      const groups = mosaicGroups(list)
      total = groups.length
      if (!total) return
      startedAt = performance.now()
      await Promise.all(
        groups.map((group, i) => {
          inFlight.set(i, group)
          return weatherCaptures(place, group, ctl.signal)
            .then(
              (caps) => {
                if (!stopped) {
                  found.push(...caps)
                  return
                }
                // Out of the open count before its patches go out, so they carry what is still left.
                const open = lateOpen.delete(i)
                for (const c of caps) opts.onLate?.(c, counted.has(c.id))
                if (open) opts.onLateSettled?.(lateOpen.size)
              },
              () => {
                // weatherCaptures only rejects on abort; anything else counts as an unanswered mosaic.
                if (!stopped) failed++
                else if (lateOpen.delete(i)) opts.onLateSettled?.(lateOpen.size)
              },
            )
            .finally(() => {
              inFlight.delete(i)
              if (stopped) return
              settledCount++
              opts.onSettle?.(settledCount, total)
            })
        }),
      )
    })
    // A failed or aborted pass search is reported by the pass leg; this leg just ends empty.
    .catch(() => undefined)
    .finally(() => {
      done = true
      finishedAt ||= performance.now()
      clearTimeout(lateTimer)
      opts.signal?.removeEventListener('abort', onOuterAbort)
    })

  return {
    settled: Promise.race([work, stoppedSignal]),
    verified: () => [...found].sort((a, b) => b.datetime - a.datetime),
    byRule: () => [...rule].sort((a, b) => b.datetime - a.datetime),
    isDone: () => done,
    progress: () => ({ total, settled: settledCount, failed }),
    stop: () => {
      if (stopped) return 0
      stopped = true
      const cut = done ? 0 : inFlight.size
      if (!done) {
        finishedAt = performance.now()
        // VIIRS stragglers count by rule when the evidence allows (see the header); late answers for them
        // only confirm (onLate's byRule flag).
        const now = Date.now()
        for (const [i, group] of inFlight) {
          let byRule = false
          if (group.length && isGapFreeMosaic(group[0].norad)) {
            for (const c of weatherCandidates(place, group)) {
              if (now - c.datetime < PROCESSED_AFTER_MS) continue
              const day = utcDay(c.datetime)
              if (!found.some((f) => f.norad === c.norad && utcDay(f.datetime) > day)) continue
              rule.push(c)
              counted.add(c.id)
              byRule = true
            }
          }
          if (!byRule) lateOpen.add(i)
        }
        // Let the stragglers finish in the background, within reason (or not at all: nobody listens).
        const lateMs = opts.lateMs ?? LATE_MS
        if (lateMs > 0) lateTimer = setTimeout(() => ctl.abort(), lateMs)
        else ctl.abort()
      }
      release()
      return cut
    },
    timing: () => ({ startedAt, finishedAt }),
    lateLeft: () => lateOpen.size,
  }
}
