/**
 * How clear a Sentinel-2 / Landsat photo is, and which of two equally zoomed-in photos should lead (owner rule, final:
 * the first photo is the most zoomed-in CLEAR photo, then the rest newest first). Shared by the results' photo order
 * (ui/results/lib/photos.ts) and the globe's cover prefetch (globe/acquisition.ts coverPass), so the two always pick
 * the same photo. Pure.
 *
 * What counts as clear (tiers): a photo is CLOUDED OVER when the spot itself is cloud or the scene is ≥ 70 % cloud (the
 * label rule, unchanged); otherwise it is CLEAR unless the archive's per-pixel mask says under 60 % of its square shows
 * the ground (`clearFraction`, see imagery/cloud.ts), which makes it only PARTLY clear. The lead is the most zoomed-in
 * photo of the best tier present; among equally zoomed-in ones: the clear spot, then the clearer square (10 % steps),
 * then the higher sun (5° steps), then the straighter view (5° steps), then the newer. It only reorders real photos:
 * cloudy ones stay in the gallery, honestly labelled.
 *
 * Not named clarity.ts: the bundler names this module's chunk after the file, and AdGuard's Tracking Protection list
 * blocks any `/clarity-*.js` (Microsoft Clarity's tracker). Both the results panel and the globe import this module,
 * so with that list on, neither could load and every search ended in the fault notice with no globe (2026-11-22).
 * The build now refuses such names (scripts/blockerNames.ts).
 */
import type { Capture, SpotCloud } from '@/types'

/** Spot clarity rank (owner B1): clear > cirrus > unknown > shadow > cloud. */
export const SPOT_RANK: Record<SpotCloud, number> = { clear: 0, cirrus: 1, unknown: 2, shadow: 3, cloud: 4 }

/** Scene cloud cover ≥ this (or cloud at the spot) means the picture is mostly cloud. */
export const CLOUDED_PCT = 70

/** A photo whose square shows less ground than this is only partly clear. */
export const CLEAR_SQUARE_MIN = 0.6

/** The capture shows mostly cloud: label it honestly, never as a bright unexplained square (decision #2). */
export function isCloudedOver(c: Pick<Capture, 'spot' | 'cloudCoverPct'>): boolean {
  return c.spot === 'cloud' || (c.cloudCoverPct ?? 0) >= CLOUDED_PCT
}

export type ClarityTier = 0 | 1 | 2

/**
 * 0 clear, 1 partly clear (its square is mostly cloud or shadow, though the spot and scene are not), 2 clouded over.
 * The square's clear share is the mask's when measured, else the scene's (1 − cloud cover): a photo nobody checked
 * must not outrank a checked one on the strength of not having been looked at (a 65 % cloud scene is not "clear"
 * because the engine only spot-checked the four clearest). With neither, it counts as clear (the old rule).
 */
export function clarityTier(c: Pick<Capture, 'spot' | 'cloudCoverPct' | 'clearFraction'>): ClarityTier {
  if (isCloudedOver(c)) return 2
  const share = c.clearFraction ?? (c.cloudCoverPct !== undefined ? clearShare(c) : undefined)
  if (share !== undefined && share < CLEAR_SQUARE_MIN) return 1
  return 0
}

/** The clear share of the photo's square: measured, else estimated from the scene's cloud cover (unknown: ½). */
export function clearShare(c: Pick<Capture, 'clearFraction' | 'cloudCoverPct'>): number {
  if (c.clearFraction !== undefined) return c.clearFraction
  return c.cloudCoverPct !== undefined ? 1 - Math.min(100, Math.max(0, c.cloudCoverPct)) / 100 : 0.5
}

/** A photo as the ranking sees it: its capture, when it was taken, and the pass's view of the place (if any). */
export interface Ranked {
  capture: Pick<Capture, 'gsdM' | 'spot' | 'cloudCoverPct' | 'clearFraction' | 'sunElevationDeg'>
  /** The pass's closest approach (or the capture's time) */
  t: number
  /** Sun elevation at the place (the pass's, else the archive's) */
  sunDeg?: number
  /** How far off straight down the satellite looked at the place */
  offNadirDeg?: number
}

const step = (v: number | undefined, size: number, missing: number) => (v === undefined || !Number.isFinite(v) ? missing : Math.floor(v / size))
/** Clear share in 10 % steps, rounded (so 0.997 and 1 are the same step). */
const shareStep = (c: Ranked['capture']) => Math.round(clearShare(c) * 10)

/** Among equally zoomed-in photos of one tier: clear spot, clearer square, higher sun, straighter view, newer. */
export function byLead(a: Ranked, b: Ranked): number {
  return (
    SPOT_RANK[a.capture.spot ?? 'unknown'] - SPOT_RANK[b.capture.spot ?? 'unknown'] ||
    shareStep(b.capture) - shareStep(a.capture) ||
    step(b.sunDeg ?? b.capture.sunElevationDeg, 5, -99) - step(a.sunDeg ?? a.capture.sunElevationDeg, 5, -99) ||
    step(a.offNadirDeg, 5, 99) - step(b.offNadirDeg, 5, 99) ||
    b.t - a.t
  )
}

/** Most zoomed in first, then byLead. */
export function byCloseness(a: Ranked, b: Ranked): number {
  return a.capture.gsdM - b.capture.gsdM || byLead(a, b)
}

/** Every photo clouded over: the least cloudy (spot, then the square's clear share, then scene cloud), sharper, newer. */
export function byCloud(a: Ranked, b: Ranked): number {
  return (
    SPOT_RANK[a.capture.spot ?? 'unknown'] - SPOT_RANK[b.capture.spot ?? 'unknown'] ||
    shareStep(b.capture) - shareStep(a.capture) ||
    (a.capture.cloudCoverPct ?? 50) - (b.capture.cloudCoverPct ?? 50) ||
    a.capture.gsdM - b.capture.gsdM ||
    b.t - a.t
  )
}

/** The lead among detailed photos: the most zoomed-in of the clearest tier present, else the least cloudy. */
export function pickLead<T extends Ranked>(items: readonly T[]): { item: T; tier: ClarityTier } | undefined {
  if (!items.length) return undefined
  for (const tier of [0, 1] as const) {
    const pool = items.filter((x) => clarityTier(x.capture) === tier)
    if (pool.length) return { item: [...pool].sort(byCloseness)[0], tier }
  }
  return { item: [...items].sort(byCloud)[0], tier: 2 }
}
