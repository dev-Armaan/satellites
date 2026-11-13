/**
 * Matching archive captures to predicted passes. Pure functions (no network), unit-tested.
 *
 * Time semantics of `Capture.datetime` differ by archive:
 *  - Landsat (PC):        scene-centre time, within seconds of our closest approach.
 *  - Sentinel-2 (PC/E84): the DATATAKE start, which can precede the overflight of the place by many
 *                         minutes (measured: 16:14:21 archive vs 16:21:14 SGP4 over Waterloo).
 *  - GIBS daily mosaics:  the imagery module stamps them with the pass they were derived from.
 * So a scene matches the pass of the same satellite whose closest approach lies in
 * [datetime − 10 min, datetime + 60 min]. Sentinel-2 only images on the sunlit half of its 100-minute
 * orbit, so a datatake cannot start much more than 50 min before it reaches any place; and one satellite
 * cannot pass the same place twice within ~95 min (one orbit), so the window is unambiguous.
 */
import { mosaicDate } from '@/lib/geoCore'
import type { Capture, Pass } from '@/types'
import { noradForGibsCollection, noradForPlatform } from './profiles'

export const MATCH_BEFORE_MS = 10 * 60_000
export const MATCH_AFTER_MS = 60 * 60_000

export function captureNorad(c: Capture): number | undefined {
  return c.norad ?? noradForPlatform(c.platform) ?? noradForGibsCollection(c.collection)
}

/** The pass a capture belongs to, if any. */
export function passForCapture(c: Capture, passes: readonly Pass[]): Pass | undefined {
  const norad = captureNorad(c)
  if (norad === undefined) return undefined
  let best: Pass | undefined
  for (const p of passes) {
    if (p.norad !== norad) continue
    const dt = p.tClosest - c.datetime
    if (dt < -MATCH_BEFORE_MS || dt > MATCH_AFTER_MS) continue
    if (!best || Math.abs(dt) < Math.abs(best.tClosest - c.datetime)) best = p
  }
  return best
}

/** Prefer the clearer scene, then the one closer in time. */
function better(a: Capture, b: Capture | undefined, pass: Pass): boolean {
  if (!b) return true
  const ca = a.cloudCoverPct ?? 101
  const cb = b.cloudCoverPct ?? 101
  if (ca !== cb) return ca < cb
  return Math.abs(a.datetime - pass.tClosest) < Math.abs(b.datetime - pass.tClosest)
}

/**
 * Upgrade passes that have a real image to 'imaged' (mutates the passes). Returns the captures that
 * matched no pass, for the caller to resolve geometrically.
 */
export function attachCaptures(passes: Pass[], captures: readonly Capture[]): Capture[] {
  const chosen = new Map<Pass, Capture>()
  const unmatched: Capture[] = []
  for (const c of captures) {
    const p = passForCapture(c, passes)
    if (!p) {
      unmatched.push(c)
      continue
    }
    if (better(c, chosen.get(p), p)) chosen.set(p, c)
  }
  for (const [p, c] of chosen) {
    p.verdict = 'imaged'
    p.captureId = c.id
  }
  return unmatched
}

/**
 * The pass a GIBS daily mosaic illustrates (pure: nothing is changed): exact time match first (the imagery
 * module stamps the pass time), else the daytime pass of the same mosaic day at the place (`lon`) closest to nadir. Passes already
 * imaged are skipped.
 */
export function dailyCaptureTarget(passes: readonly Pass[], c: Capture, lon: number): Pass | undefined {
  const norad = captureNorad(c)
  if (norad === undefined) return undefined
  const day = mosaicDate(c.datetime, lon)
  let best: Pass | undefined
  for (const p of passes) {
    if (p.norad !== norad || p.verdict === 'imaged') continue
    if (Math.abs(p.tClosest - c.datetime) < MATCH_BEFORE_MS) return p
    if (mosaicDate(p.tClosest, lon) !== day || p.sunElevationDeg <= 0) continue
    if (!best || p.groundDistanceKm < best.groundDistanceKm) best = p
  }
  return best
}

/**
 * GIBS daily mosaics: the image for (satellite, mosaic day at the place) shows the place as seen on that day's daytime
 * pass (see dailyCaptureTarget). One pass per capture. Mutates the matched passes; returns the captures
 * that matched.
 */
export function attachDailyCaptures(passes: Pass[], captures: readonly Capture[], lon: number): Capture[] {
  const matched: Capture[] = []
  const seen = new Set<string>()
  for (const c of captures) {
    // A capture id is one image: it may illustrate one pass only, even if a source repeats it.
    if (seen.has(c.id)) continue
    seen.add(c.id)
    const best = dailyCaptureTarget(passes, c, lon)
    if (!best) continue
    best.verdict = 'imaged'
    best.captureId = c.id
    matched.push(c)
  }
  return matched
}
