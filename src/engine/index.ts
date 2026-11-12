/**
 * engine: orbits, passes and the report. See docs/ARCHITECTURE.md ("engine → src/engine/index.ts").
 */
export { loadCatalog, loadCatalogNames, getSatInfo, featuredSats, currentCatalog, type LoadedCatalog } from './catalog'
export { propagate, groundTrack, type SatState } from './propagate'
export { CATEGORY_INDEX } from './categories'
export {
  buildElementBuffer,
  keplerJ2World,
  ELEMENT_STRIDE,
  FLAG_FEATURED,
  type ElementBuffer,
} from './elements'
export type { EngineReport, ReportOptions, ReportTimings } from './report'
export { geoWatchers, scanAngleAt, scanLine, scanSeatOf, type ScanLine, type ScanSeat } from './geostationary'
export { PROFILES } from './profiles'

import type { Place, SatProfile } from '@/types'
import { getSatInfo } from './catalog'
import { resolveProfile } from './profiles'
import type { EngineReport, ReportOptions } from './report'

/**
 * The report engine (pass search workers, archives, matching) is a separate chunk, loaded on first use:
 * anything that only needs the catalog (the HUD, the boot log) never pulls it into the first bundle.
 */
export async function computeReport(place: Place, opts?: ReportOptions): Promise<EngineReport> {
  const m = await import('./report')
  return m.computeReport(place, opts)
}

/** Create the pass-search workers ahead of time (fire-and-forget; loads the pool chunk). */
export function warmPassWorkers(): void {
  void import('./pool').then((m) => m.warmPassWorkers(), () => undefined)
}

/** Curated profile for a satellite (after loadCatalog, the catalog name is used for family patterns). */
export function profileFor(norad: number): SatProfile | undefined {
  return getSatInfo(norad)?.profile ?? resolveProfile(norad)
}
