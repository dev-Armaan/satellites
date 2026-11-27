import { describe, expect, it } from 'vitest'
import { searchLegs } from './telemetry'

/** The controller's marks, as times. */
const marks = (m: Record<string, number>) => (name: string) => m[name]

describe('searchLegs (where a search wait went)', () => {
  it('splits the wait into the controller waits, in order, adding up to the total', () => {
    const legs = searchLegs(1000, marks({ 'engine-run': 1004, 'partial-report': 2400, 'camera-window': 2810, 'report-settled': 3650, 'hero-ready': 3900 }), {
      catalogMs: 0.4,
      passesMs: 512.6,
      archiveMs: 930,
    })
    expect(legs).toEqual({ t_report: 1400, t_camera: 410, t_settle: 840, t_hero: 250, e_catalog: 0, e_passes: 513, e_archive: 930, ahead: undefined })
    expect(Number(legs.t_report) + Number(legs.t_camera) + Number(legs.t_settle) + Number(legs.t_hero)).toBe(3900 - 1000)
  })

  it('reads a final report that came with no partial, and a report that never settled', () => {
    const legs = searchLegs(0, marks({ 'final-report': 900, 'camera-window': 1800, 'report-unsettled': 1800, 'hero-ready': 1805 }))
    expect(legs).toMatchObject({ t_report: 900, t_camera: 900, t_settle: 0, t_hero: 5 })
  })

  it("says how far ahead a link's search began, and that its report was already in hand", () => {
    // Engine at 1.2 s under the loading screen; the search on screen at 3.0 s, its report handed over at once.
    const legs = searchLegs(3000, marks({ 'engine-run': 1200, 'final-report': 3004, 'camera-window': 4800, 'report-settled': 4800, 'hero-ready': 4801 }))
    expect(legs).toMatchObject({ ahead: 1800, t_report: 4, t_camera: 1796, t_settle: 0, t_hero: 1 })
  })

  it("never takes an earlier search's mark for this one's", () => {
    // The second search of a tab: every mark but the report's is still the first search's.
    const legs = searchLegs(60_000, marks({ 'engine-run': 60_010, 'partial-report': 61_500, 'camera-window': 2800, 'report-settled': 3600, 'hero-ready': 3900 }))
    expect(legs).toEqual({ t_report: 1500, t_camera: undefined, t_settle: undefined, t_hero: undefined, e_catalog: undefined, e_passes: undefined, e_archive: undefined, ahead: undefined })
  })

  it('keeps every value a whole number the stats accept (0 to 600 000)', () => {
    const legs = searchLegs(0, marks({ 'partial-report': 900_000, 'camera-window': 900_000.4 }), { catalogMs: Number.NaN, passesMs: -3, archiveMs: 1e9 })
    expect(legs).toMatchObject({ t_report: 600_000, t_camera: 0, e_catalog: undefined, e_passes: 0, e_archive: 600_000 })
  })
})
