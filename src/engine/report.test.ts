import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Capture, LatLon, Pass, Place } from '@/types'

// The imagery module is mocked: these tests exercise orchestration and matching, not the network.
const imagery = vi.hoisted(() => ({
  searchCapturesDetailed: vi.fn(),
  weatherCaptures: vi.fn(),
  spotCloud: vi.fn(),
  spotCheck: vi.fn(),
  ensureTz: vi.fn(),
  sentinel2PlanCovers: vi.fn(),
  searchClearScenes: vi.fn(),
  searchRadar: vi.fn(),
  latestGeoFrame: vi.fn(async (..._args: unknown[]): Promise<unknown> => null),
  geoCapture: vi.fn(),
  geoCaptureFromItem: vi.fn(),
}))
vi.mock('@/imagery', async () => {
  // Pure helpers are the real ones.
  const gibs = await vi.importActual<typeof import('@/imagery/gibs')>('@/imagery/gibs')
  return { ...imagery, weatherCandidates: gibs.weatherCandidates }
})

import { getRow, getSatInfo } from './catalog'
import { scanAngleAt, scanAngleOf, scanSeatOf } from './geostationary'
import { satrecFor } from './sgp4'
import { findPassesForSat, passTargetFor } from './passes'
import { computeReport, OCEAN_NOTE } from './report'
import { _resetClearCoverCache } from './clearCover'
import { loadTestCatalog, TOKYO, WATERLOO } from './testing'

let now: number
const waterloo: Place = { label: 'Waterloo', ...WATERLOO, source: 'demo' }
const tokyo: Place = { label: 'Tokyo', ...TOKYO, source: 'demo' }

function passesOf(norad: number, place: LatLon): Pass[] {
  const t = passTargetFor(getSatInfo(norad)!, getRow(norad)!)!
  return findPassesForSat(satrecFor(norad)!, t, { place, t0: now - 7 * 86_400_000, t1: now })
}

function capture(over: Partial<Capture> & Pick<Capture, 'id' | 'platform' | 'datetime' | 'collection'>): Capture {
  return {
    provider: 'planetary-computer',
    itemId: over.id,
    gsdM: 10,
    cropUrl: () => 'about:blank',
    ...over,
  }
}

beforeAll(() => {
  const cat = loadTestCatalog()
  now = Date.parse(cat.fetchedAt)
})
beforeEach(() => {
  imagery.searchCapturesDetailed.mockReset()
  imagery.weatherCaptures.mockReset()
  imagery.spotCloud.mockReset().mockResolvedValue('unknown')
  // The report reads spot + clear fraction through spotCheck; these tests script the spot through spotCloud.
  imagery.spotCheck.mockReset().mockImplementation(async (c: Capture, p: LatLon, s?: AbortSignal) => ({ spot: await imagery.spotCloud(c, p, s) }))
  imagery.ensureTz.mockReset().mockResolvedValue(undefined)
  imagery.sentinel2PlanCovers.mockReset().mockResolvedValue(true)
  imagery.searchClearScenes.mockReset().mockResolvedValue([])
  imagery.searchRadar.mockReset().mockResolvedValue([])
  _resetClearCoverCache()
})

describe('computeReport', () => {
  it('upgrades the matching pass to imaged and keeps everything else', async () => {
    const s2c = passesOf(60989, WATERLOO)
    expect(s2c.length).toBeGreaterThan(0)
    const target = s2c[s2c.length - 1]
    // Sentinel-2 archive times are the datatake start, minutes before the overflight.
    const scene = capture({ id: 'S2C_TEST', platform: 'sentinel-2c', collection: 'sentinel-2-l2a', datetime: target.tClosest - 7 * 60_000, cloudCoverPct: 12 })
    imagery.searchCapturesDetailed.mockResolvedValue({ captures: [scene], degraded: [] })
    imagery.weatherCaptures.mockResolvedValue([])

    const stages: string[] = []
    const report = await computeReport(waterloo, { now, onProgress: (e) => stages.push(e.stage) })

    const imaged = report.passes.filter((p) => p.verdict === 'imaged')
    expect(imaged).toHaveLength(1)
    expect(imaged[0].norad).toBe(60989)
    expect(imaged[0].captureId).toBe('S2C_TEST')
    expect(Math.abs(imaged[0].tClosest - target.tClosest)).toBeLessThan(1000)
    expect(report.captures.map((c) => c.id)).toEqual(['S2C_TEST'])
    expect(report.counts.imaged).toBe(1)
    expect(report.counts.passes).toBe(report.passes.length)
    expect(report.counts.imaged + report.counts.likely + report.counts.could + report.counts.overhead).toBe(report.passes.length)
    expect(report.counts.satellitesConsidered).toBeGreaterThan(300)
    for (let i = 1; i < report.passes.length; i++) expect(report.passes[i].tClosest).toBeGreaterThanOrEqual(report.passes[i - 1].tClosest)
    for (const p of report.passes) {
      expect(p.tClosest).toBeGreaterThanOrEqual(report.windowStart)
      expect(p.tClosest).toBeLessThanOrEqual(report.windowEnd)
    }
    expect(new Set(report.passes.map((p) => p.id)).size).toBe(report.passes.length)
    expect(stages[0]).toBe('catalog')
    expect(stages).toContain('propagate')
    expect(stages).toContain('match')
    expect(stages[stages.length - 1]).toBe('done')
    expect(report.notes).toEqual([])
    console.log(
      `Waterloo: ${report.passes.length} passes in ${report.timings.totalMs.toFixed(0)} ms ` +
        `(passes ${report.timings.passesMs.toFixed(0)} ms, ${report.timings.workers} workers)`,
    )
  })

  it('adds a pass for a scene that no prediction qualified for', async () => {
    // Sentinel-2A over Tokyo at night: no daylight pass qualifies, but pretend the archive holds a scene.
    const t = passTargetFor(getSatInfo(40697)!, getRow(40697)!)!
    const geomOnly = findPassesForSat(satrecFor(40697)!, { ...t, category: 'radar' }, { place: TOKYO, t0: now - 7 * 86_400_000, t1: now })
    const night = geomOnly.find((p) => p.sunElevationDeg < 0 && p.inFieldOfRegard)
    expect(night).toBeDefined()
    imagery.searchCapturesDetailed.mockResolvedValue({
      captures: [capture({ id: 'S2A_NIGHT', platform: 'sentinel-2a', collection: 'sentinel-2-l2a', datetime: night!.tClosest - 3 * 60_000 })],
      degraded: [],
    })
    imagery.weatherCaptures.mockResolvedValue([])
    const report = await computeReport(tokyo, { now })
    const added = report.passes.find((p) => p.captureId === 'S2A_NIGHT')
    expect(added).toBeDefined()
    expect(added!.verdict).toBe('imaged')
    expect(Math.abs(added!.tClosest - night!.tClosest)).toBeLessThan(1000)
  })

  it('matches a scene whose datatake started up to an hour before the overflight', async () => {
    const s2c = passesOf(60989, WATERLOO)
    const target = s2c[0]
    const scene = capture({ id: 'S2C_LONG', platform: 'sentinel-2c', collection: 'sentinel-2-l2a', datetime: target.tClosest - 55 * 60_000 })
    imagery.searchCapturesDetailed.mockResolvedValue({ captures: [scene], degraded: [] })
    imagery.weatherCaptures.mockResolvedValue([])
    const report = await computeReport(waterloo, { now })
    const imaged = report.passes.filter((p) => p.captureId === 'S2C_LONG')
    expect(imaged).toHaveLength(1)
    expect(imaged[0].id).toBe(target.id)
  })

  it('never invents a pass for a scene with no overflight in its window', async () => {
    // A Sentinel-2A "scene" stamped 30 min after a real Tokyo overflight: the window [+20, +90] min
    // holds no approach (the next orbit is ~100 min later), so the minimum sits on the window edge.
    const t = passTargetFor(getSatInfo(40697)!, getRow(40697)!)!
    const any = findPassesForSat(satrecFor(40697)!, { ...t, category: 'radar' }, { place: TOKYO, t0: now - 7 * 86_400_000, t1: now })[0]
    imagery.searchCapturesDetailed.mockResolvedValue({
      captures: [capture({ id: 'S2A_GHOST', platform: 'sentinel-2a', collection: 'sentinel-2-l2a', datetime: any.tClosest + 30 * 60_000 })],
      degraded: [],
    })
    imagery.weatherCaptures.mockResolvedValue([])
    const report = await computeReport(tokyo, { now })
    expect(report.passes.find((p) => p.captureId === 'S2A_GHOST')).toBeUndefined()
  })

  it('matches a GIBS daily mosaic to its weather pass', async () => {
    const noaa = passesOf(43013, WATERLOO).filter((p) => p.sunElevationDeg > 5)
    expect(noaa.length).toBeGreaterThan(0)
    const p = noaa[0]
    imagery.searchCapturesDetailed.mockResolvedValue({ captures: [], degraded: [] })
    const calls: number[][] = []
    imagery.weatherCaptures.mockImplementation(async (_place: LatLon, passes: Pass[]) => {
      calls.push([...new Set(passes.map((x) => x.norad))])
      if (!passes.some((x) => x.id === p.id)) return []
      return [capture({ id: 'VIIRS@day', provider: 'gibs', platform: 'noaa-20', collection: 'gibs-viirs-noaa20', norad: 43013, datetime: p.tClosest, gsdM: 375 })]
    })
    const report = await computeReport(waterloo, { now })
    const imaged = report.passes.filter((x) => x.verdict === 'imaged')
    expect(imaged).toHaveLength(1)
    expect(imaged[0].norad).toBe(43013)
    expect(imaged[0].captureId).toBe('VIIRS@day')
    expect(report.captures.map((c) => c.id)).toEqual(['VIIRS@day'])
    // One call per (GIBS satellite, UTC day): NOAA-20, NOAA-21, Suomi NPP, Terra, Aqua over 7–8 days.
    for (const c of calls) expect(c).toHaveLength(1)
    expect(new Set(calls.flat())).toEqual(new Set([43013, 54234, 37849, 25994, 27424]))
    expect(calls.length).toBeGreaterThanOrEqual(35)
    expect(calls.length).toBeLessThanOrEqual(40)
    expect(report.notes).toEqual([])
  })

  it('keeps what GIBS verified within the budget and leaves MODIS stragglers likely', async () => {
    imagery.searchCapturesDetailed.mockResolvedValue({ captures: [], degraded: [] })
    const aborted: number[] = []
    imagery.weatherCaptures.mockImplementation((_place: LatLon, passes: Pass[], signal?: AbortSignal) => {
      const p = passes.find((x) => x.inSwath && x.sunElevationDeg > 5)
      if (!p) return Promise.resolve([])
      // Terra's (MODIS) probes hang until aborted; everyone else answers at once.
      if (p.norad === 25994) {
        return new Promise((_, reject) =>
          signal?.addEventListener('abort', () => {
            aborted.push(p.norad)
            reject(new DOMException('Aborted', 'AbortError'))
          }),
        )
      }
      return Promise.resolve([capture({ id: `G@${p.id}`, provider: 'gibs', platform: 'x', collection: 'gibs-modis-terra', norad: p.norad, datetime: p.tClosest, gsdM: 250 })])
    })
    const t0 = performance.now()
    const report = await computeReport(waterloo, { now, budgetMs: 200 })
    const elapsed = performance.now() - t0
    const imagedSats = new Set(report.passes.filter((p) => p.verdict === 'imaged').map((p) => p.norad))
    expect(imagedSats.has(25994)).toBe(false)
    expect(imagedSats.size).toBe(4)
    // Nobody listens for late patches (no onUpdate): the stragglers are aborted at the budget.
    expect(aborted.length).toBeGreaterThan(0)
    expect(report.notes).toHaveLength(1)
    expect(report.notes[0]).toMatch(new RegExp(`did not return ${aborted.length} of \\d+ weather-satellite images in time`))
    // Never sooner than 1.2 s after the first probe, and not much later.
    expect(elapsed).toBeLessThan(report.timings.passesMs + 2500)
    expect(report.counts.imaged).toBe(report.passes.filter((p) => p.verdict === 'imaged').length)
  })

  it('counts VIIRS stragglers by rule only with evidence, never an explicit no-data answer', async () => {
    imagery.searchCapturesDetailed.mockResolvedValue({ captures: [], degraded: [] })
    const day = (t: number) => new Date(t).toISOString().slice(0, 10)
    const noaa20Days = [...new Set(passesOf(43013, WATERLOO).filter((x) => x.inSwath && x.sunElevationDeg >= 5).map((x) => day(x.tClosest)))].sort()
    const latest = noaa20Days[noaa20Days.length - 1]
    const hang = (signal?: AbortSignal) => new Promise<never>((_, reject) => signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))))
    imagery.weatherCaptures.mockImplementation((_place: LatLon, passes: Pass[], signal?: AbortSignal) => {
      const p = passes.find((x) => x.inSwath && x.sunElevationDeg >= 5)
      if (!p) return Promise.resolve([])
      // NOAA-20 (VIIRS): its latest day verifies, every earlier day hangs. Suomi NPP (VIIRS) and Terra
      // (MODIS) hang throughout. NOAA-21 answers "no data here".
      if (p.norad === 43013 && day(p.tClosest) === latest)
        return Promise.resolve([capture({ id: `VIIRS@${latest}`, provider: 'gibs', platform: 'noaa-20', collection: 'gibs-viirs-noaa20', norad: 43013, datetime: p.tClosest, gsdM: 375 })])
      if (p.norad === 43013 || p.norad === 37849 || p.norad === 25994) return hang(signal)
      return Promise.resolve([])
    })
    const report = await computeReport(waterloo, { now, budgetMs: 200 })
    const imaged = report.passes.filter((p) => p.verdict === 'imaged')
    // Suomi NPP never verified a day (an outage looks exactly like this): nothing by rule. NOAA-21's
    // explicit no-data answers stay likely. NOAA-20 days before its verified day count; the last
    // 24 hours never do (not processed yet).
    expect(new Set(imaged.map((p) => p.norad))).toEqual(new Set([43013]))
    const ruleDays = imaged.map((p) => day(p.tClosest)).filter((d) => d !== latest)
    expect(ruleDays.length).toBeGreaterThan(0)
    for (const p of imaged) expect(Date.now() - p.tClosest > 86_400_000 || day(p.tClosest) === latest).toBe(true)
    expect(report.notes.some((n) => /slow to confirm .*VIIRS/.test(n))).toBe(true)
    expect(report.notes.some((n) => /shown as likely/.test(n))).toBe(true) // Terra, Suomi NPP
  })

  it('patches the report upward when a straggler answers after the budget', async () => {
    imagery.searchCapturesDetailed.mockResolvedValue({ captures: [], degraded: [] })
    let release!: () => void
    const gate = new Promise<void>((r) => (release = r))
    imagery.weatherCaptures.mockImplementation(async (_place: LatLon, passes: Pass[]) => {
      const p = passes.find((x) => x.inSwath && x.sunElevationDeg > 5)
      if (!p) return []
      if (p.norad === 25994) await gate // Terra answers late
      return [capture({ id: `G@${p.id}`, provider: 'gibs', platform: 'terra', collection: 'gibs-modis-terra', norad: p.norad, datetime: p.tClosest, gsdM: 250 })]
    })
    const ctl = new AbortController()
    const updates: { imaged: number; notes: string[]; late?: number }[] = []
    const report = await computeReport(waterloo, {
      now,
      budgetMs: 200,
      signal: ctl.signal,
      onUpdate: (r) => updates.push({ imaged: r.counts.imaged, notes: r.notes, late: r.lateChecks }),
    })
    const before = report.counts.imaged
    const terraBefore = report.passes.filter((p) => p.norad === 25994 && p.verdict === 'imaged').length
    expect(terraBefore).toBe(0)
    // PH-02: the final report says its photo count can still grow while the stragglers probe.
    expect(report.lateChecks).toBeGreaterThan(0)
    release()
    await new Promise((r) => setTimeout(r, 50))
    expect(updates.length).toBeGreaterThan(0)
    // Upward only, one step at a time, and the delivered report is never mutated.
    updates.forEach((u, i) => expect(u.imaged).toBe(before + i + 1))
    expect(report.counts.imaged).toBe(before)
    expect(report.passes.filter((p) => p.norad === 25994 && p.verdict === 'imaged')).toHaveLength(0)
    expect(updates[updates.length - 1].notes.some((n) => /shown as likely/.test(n))).toBe(false)
    // …and the patch that settles the last straggler says the count is final.
    expect(updates[updates.length - 1].late ?? 0).toBe(0)
    ctl.abort()
  })

  it('settles lateChecks with one patch when the last straggler has nothing to add', async () => {
    imagery.searchCapturesDetailed.mockResolvedValue({ captures: [], degraded: [] })
    let release!: () => void
    const gate = new Promise<void>((r) => (release = r))
    imagery.weatherCaptures.mockImplementation(async (_place: LatLon, passes: Pass[]) => {
      const p = passes.find((x) => x.inSwath && x.sunElevationDeg > 5)
      if (!p) return []
      if (p.norad === 25994) {
        await gate // Terra answers late, with no data at the place
        return []
      }
      return [capture({ id: `G@${p.id}`, provider: 'gibs', platform: 'aqua', collection: 'gibs-modis-aqua', norad: p.norad, datetime: p.tClosest, gsdM: 250 })]
    })
    const ctl = new AbortController()
    const updates: { imaged: number; late?: number }[] = []
    const report = await computeReport(waterloo, { now, budgetMs: 200, signal: ctl.signal, onUpdate: (r) => updates.push({ imaged: r.counts.imaged, late: r.lateChecks }) })
    expect(report.lateChecks).toBeGreaterThan(0)
    release()
    await new Promise((r) => setTimeout(r, 50))
    expect(updates.length).toBe(1)
    expect(updates[0].imaged).toBe(report.counts.imaged)
    expect(updates[0].late ?? 0).toBe(0)
    ctl.abort()
  })

  it('never sets lateChecks without a listener for the patches', async () => {
    imagery.searchCapturesDetailed.mockResolvedValue({ captures: [], degraded: [] })
    imagery.weatherCaptures.mockImplementation(async () => new Promise<never>(() => undefined))
    const report = await computeReport(waterloo, { now, budgetMs: 100 })
    expect(report.lateChecks).toBeUndefined()
  })

  it('reads the spot class for the clearest scenes before the partial report', async () => {
    const s2c = passesOf(60989, WATERLOO)
    const t = s2c[s2c.length - 1].tClosest
    const scenes = [5, 40, 12, 80, 95].map((cc, i) =>
      capture({ id: `S2_${cc}`, platform: 'sentinel-2c', collection: 'sentinel-2-l2a', datetime: t - 7 * 60_000 - i * 86_400_000 * 5, cloudCoverPct: cc }),
    )
    imagery.searchCapturesDetailed.mockResolvedValue({ captures: scenes, degraded: [] })
    imagery.weatherCaptures.mockResolvedValue([])
    imagery.spotCloud.mockImplementation(async (c: Capture) => (c.id === 'S2_5' ? 'cirrus' : c.id === 'S2_12' ? 'clear' : 'unknown'))
    let partialSpot: (string | undefined)[] = []
    const report = await computeReport(waterloo, {
      now,
      onPartial: (r) => (partialSpot = r.captures.map((c) => c.spot)),
    })
    // The four lowest-cloud scenes are checked; 'unknown' leaves the field empty.
    expect(imagery.spotCloud.mock.calls.map(([c]) => (c as Capture).id).sort()).toEqual(['S2_12', 'S2_40', 'S2_5', 'S2_80'])
    const byId = new Map(report.captures.map((c) => [c.id, c.spot]))
    expect(byId.get('S2_5')).toBe('cirrus')
    expect(byId.get('S2_12')).toBe('clear')
    expect(byId.get('S2_40')).toBeUndefined()
    if (partialSpot.length) expect(partialSpot).toContain('cirrus')
  })

  it('finds the last clear look before a cloudy week, without holding the first results (owner D)', async () => {
    const s2c = passesOf(60989, WATERLOO)
    const t = s2c[s2c.length - 1].tClosest
    // The week's only detailed photo is cloud at the spot.
    const white = capture({ id: 'S2_WHITE', platform: 'sentinel-2c', collection: 'sentinel-2-l2a', datetime: t - 7 * 60_000, cloudCoverPct: 88 })
    imagery.searchCapturesDetailed.mockResolvedValue({ captures: [white], degraded: [] })
    imagery.weatherCaptures.mockResolvedValue([])
    const windowStart = now - 7 * 86_400_000
    const older = [10, 20, 30].map((d, i) =>
      capture({ id: `OLD_${d}`, platform: i === 1 ? 'landsat-9' : 'sentinel-2b', collection: i === 1 ? 'landsat-c2-l2' : 'sentinel-2-l2a', datetime: windowStart - d * 86_400_000, cloudCoverPct: 5, gsdM: i === 1 ? 30 : 10 }),
    )
    imagery.searchClearScenes.mockResolvedValue(older)
    imagery.spotCloud.mockImplementation(async (c: Capture) => (c.id === 'S2_WHITE' || c.id === 'OLD_10' ? 'cloud' : 'clear'))
    let partialCover: Capture | undefined | null = null
    const report = await computeReport(waterloo, { now, onPartial: (r) => (partialCover = r.clearCover) })
    expect(imagery.searchClearScenes).toHaveBeenCalledWith({ lat: WATERLOO.lat, lon: WATERLOO.lon }, windowStart - 60 * 86_400_000, windowStart)
    // The newest candidate is clouded at the spot: the next one (Landsat 9, 20 days before) is the cover.
    expect(report.clearCover?.id).toBe('OLD_20')
    expect(report.clearCover?.spot).toBe('clear')
    // It never counts toward the window: no pass, not in the captures.
    expect(report.captures.map((c) => c.id)).not.toContain('OLD_20')
    expect(report.passes.some((p) => p.captureId === 'OLD_20')).toBe(false)
    // R-M1: when there is a partial report, it may already carry the cover (never a different one).
    if (partialCover) expect((partialCover as Capture).id).toBe('OLD_20')
  })

  it('R-M1: looks for the cover while the passes are computed, so the first report already carries it', async () => {
    const s2c = passesOf(60989, WATERLOO)
    const t = s2c[s2c.length - 1].tClosest
    const white = capture({ id: 'S2_WHITE', platform: 'sentinel-2c', collection: 'sentinel-2-l2a', datetime: t - 7 * 60_000, cloudCoverPct: 91 })
    imagery.searchCapturesDetailed.mockResolvedValue({ captures: [white], degraded: [] })
    // GIBS answers only after the partial report, so there is one.
    let release!: () => void
    const gate = new Promise<void>((r) => {
      release = r
      setTimeout(r, 3000)
    })
    imagery.weatherCaptures.mockImplementation(async () => {
      await gate
      return []
    })
    const windowStart = now - 7 * 86_400_000
    const old = capture({ id: 'OLD_6', platform: 'landsat-9', collection: 'landsat-c2-l2', datetime: windowStart - 6 * 86_400_000, cloudCoverPct: 4, gsdM: 30 })
    imagery.searchClearScenes.mockResolvedValue([old])
    imagery.spotCloud.mockResolvedValue('clear')
    const order: string[] = []
    const covers: string[] = []
    const seen: { partial: boolean; cover?: string; pending: boolean }[] = []
    const report = await computeReport(waterloo, {
      now,
      onCover: (c) => (covers.push(c.id), order.push('cover')),
      onPartial: (r) => {
        order.push('partial')
        seen.push({ partial: r.partial, cover: r.clearCover?.id, pending: r.coverPending })
        release()
      },
    })
    // Every scene of the week is clouded over (91 %): the cover's spot checks start with the archive's answer,
    // before any pass is known, and the UI hears about it before the first report.
    expect(covers).toEqual(['OLD_6'])
    expect(order).toEqual(['cover', 'partial'])
    expect(seen).toEqual([{ partial: true, cover: 'OLD_6', pending: false }])
    expect(report.clearCover?.id).toBe('OLD_6')
    expect(report.coverPending).toBe(false)
  })

  it('R-M1: a cover found after the partial report re-sends the partial with it, before the final', async () => {
    const s2c = passesOf(60989, WATERLOO)
    const white = capture({ id: 'S2_WHITE', platform: 'sentinel-2c', collection: 'sentinel-2-l2a', datetime: s2c[0].tClosest - 7 * 60_000, cloudCoverPct: 95 })
    imagery.searchCapturesDetailed.mockResolvedValue({ captures: [white], degraded: [] })
    let releaseGibs!: () => void
    const gibs = new Promise<void>((r) => {
      releaseGibs = r
      setTimeout(r, 3000)
    })
    imagery.weatherCaptures.mockImplementation(async () => {
      await gibs
      return []
    })
    let releaseSpot!: () => void
    const spotGate = new Promise<void>((r) => (releaseSpot = r))
    const old = capture({ id: 'OLD_2', platform: 'sentinel-2b', collection: 'sentinel-2-l2a', datetime: now - 9 * 86_400_000, cloudCoverPct: 3 })
    imagery.searchClearScenes.mockResolvedValue([old])
    imagery.spotCloud.mockImplementation(async (c: Capture) => {
      if (c.id === 'OLD_2') await spotGate
      return c.id === 'OLD_2' ? 'clear' : 'cloud'
    })
    const partials: { cover?: string; pending: boolean; passes: number }[] = []
    const report = await computeReport(waterloo, {
      now,
      onPartial: (r) => {
        partials.push({ cover: r.clearCover?.id, pending: r.coverPending, passes: r.passes.length })
        if (partials.length === 1) releaseSpot()
        else releaseGibs()
      },
    })
    expect(partials.map(({ cover, pending }) => ({ cover, pending }))).toEqual([
      { cover: undefined, pending: true },
      { cover: 'OLD_2', pending: false },
    ])
    expect(partials[1].passes).toBe(partials[0].passes)
    expect(report.clearCover?.id).toBe('OLD_2')
  })

  it('R-M1: a scene that looks clear waits for its own spot check before the cover is looked for', async () => {
    const s2c = passesOf(60989, WATERLOO)
    const scene = capture({ id: 'S2_SPOT', platform: 'sentinel-2c', collection: 'sentinel-2-l2a', datetime: s2c[0].tClosest - 7 * 60_000, cloudCoverPct: 30 })
    imagery.searchCapturesDetailed.mockResolvedValue({ captures: [scene], degraded: [] })
    imagery.weatherCaptures.mockResolvedValue([])
    const windowStart = now - 7 * 86_400_000
    const old = capture({ id: 'OLD_3', platform: 'sentinel-2a', collection: 'sentinel-2-l2a', datetime: windowStart - 3 * 86_400_000, cloudCoverPct: 2 })
    imagery.searchClearScenes.mockResolvedValue([old])
    const checked: string[] = []
    imagery.spotCloud.mockImplementation(async (c: Capture) => {
      checked.push(c.id)
      return c.id === 'S2_SPOT' ? 'cloud' : 'clear'
    })
    const report = await computeReport(waterloo, { now })
    // 30 % scene cloud could be clear at the spot: the week's own check first, then (cloud) the cover's.
    expect(checked).toEqual(['S2_SPOT', 'OLD_3'])
    expect(report.clearCover?.id).toBe('OLD_3')
  })

  it('R-M1: a final report sent while the cover is still checked says so, and an update settles it', async () => {
    imagery.searchCapturesDetailed.mockResolvedValue({ captures: [], degraded: [] })
    imagery.weatherCaptures.mockResolvedValue([])
    let release!: () => void
    const gate = new Promise<void>((r) => (release = r))
    imagery.searchClearScenes.mockResolvedValue([capture({ id: 'OLD', platform: 'sentinel-2a', collection: 'sentinel-2-l2a', datetime: now - 9 * 86_400_000, cloudCoverPct: 2 })])
    imagery.spotCloud.mockImplementation(async () => {
      await gate
      return 'cloud'
    })
    const ctl = new AbortController()
    const updates: { cover?: string; pending: boolean }[] = []
    const report = await computeReport(waterloo, { now, budgetMs: 100, signal: ctl.signal, onUpdate: (r) => updates.push({ cover: r.clearCover?.id, pending: r.coverPending }) })
    expect(report.coverPending).toBe(true)
    release()
    await new Promise((r) => setTimeout(r, 50))
    // No clear look was found: the update has no cover, and nothing is pending any more.
    expect(updates).toEqual([{ cover: undefined, pending: false }])
    ctl.abort()
  })

  it('delivers a late clear cover as a background update', async () => {
    imagery.searchCapturesDetailed.mockResolvedValue({ captures: [], degraded: [] })
    imagery.weatherCaptures.mockResolvedValue([])
    let release!: () => void
    const gate = new Promise<void>((r) => (release = r))
    const old = capture({ id: 'OLD', platform: 'sentinel-2a', collection: 'sentinel-2-l2a', datetime: now - 9 * 86_400_000, cloudCoverPct: 2 })
    imagery.searchClearScenes.mockImplementation(async () => {
      await gate
      return [old]
    })
    imagery.spotCloud.mockResolvedValue('clear')
    const ctl = new AbortController()
    const updates: (string | undefined)[] = []
    const report = await computeReport(waterloo, { now, budgetMs: 200, signal: ctl.signal, onUpdate: (r) => updates.push(r.clearCover?.id) })
    expect(report.clearCover).toBeUndefined()
    release()
    await new Promise((r) => setTimeout(r, 50))
    expect(updates).toEqual(['OLD'])
    ctl.abort()
  })

  it('never looks for a clear cover when the week has a clear photo', async () => {
    const s2c = passesOf(60989, WATERLOO)
    const clear = capture({ id: 'S2_CLEAR', platform: 'sentinel-2c', collection: 'sentinel-2-l2a', datetime: s2c[0].tClosest - 7 * 60_000, cloudCoverPct: 8 })
    imagery.searchCapturesDetailed.mockResolvedValue({ captures: [clear], degraded: [] })
    imagery.weatherCaptures.mockResolvedValue([])
    imagery.searchClearScenes.mockResolvedValue([capture({ id: 'OLD', platform: 'sentinel-2a', collection: 'sentinel-2-l2a', datetime: now - 20 * 86_400_000, cloudCoverPct: 1 })])
    imagery.spotCloud.mockResolvedValue('clear')
    const report = await computeReport(waterloo, { now })
    expect(report.clearCover).toBeUndefined()
    expect(imagery.spotCloud.mock.calls.map(([c]) => (c as Capture).id)).toEqual(['S2_CLEAR'])
  })

  it('does not wait for a slow spot check longer than its budget', async () => {
    const s2c = passesOf(60989, WATERLOO)
    const scene = capture({ id: 'S2_SLOW', platform: 'sentinel-2c', collection: 'sentinel-2-l2a', datetime: s2c[0].tClosest - 7 * 60_000, cloudCoverPct: 3 })
    imagery.searchCapturesDetailed.mockResolvedValue({ captures: [scene], degraded: [] })
    imagery.weatherCaptures.mockResolvedValue([])
    imagery.spotCloud.mockImplementation(() => new Promise(() => undefined))
    const t0 = performance.now()
    const report = await computeReport(waterloo, { now })
    expect(performance.now() - t0).toBeLessThan(5000)
    expect(report.captures[0].spot).toBeUndefined()
  })

  it('drops a spot check that answers after its budget: the captures the reports rank on stay put (CT-11)', async () => {
    const s2c = passesOf(60989, WATERLOO)
    const scene = capture({ id: 'S2_LATE', platform: 'sentinel-2c', collection: 'sentinel-2-l2a', datetime: s2c[0].tClosest - 7 * 60_000, cloudCoverPct: 3 })
    imagery.searchCapturesDetailed.mockResolvedValue({ captures: [scene], degraded: [] })
    imagery.weatherCaptures.mockResolvedValue([])
    let answered!: () => void
    const late = new Promise<void>((resolve) => (answered = resolve))
    imagery.spotCheck.mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 1_800)) // the budget is 1.5 s
      answered()
      return { spot: 'cloud', clearFraction: 0.05 }
    })
    const report = await computeReport(waterloo, { now })
    await late
    await new Promise((r) => setTimeout(r, 0))
    expect(report.captures[0].spot).toBeUndefined()
    expect(report.captures[0].clearFraction).toBeUndefined()
  })

  it('recasts open-optical passes over the open ocean, where Sentinel-2 never images', async () => {
    const ocean: Place = { label: 'Pacific Ocean', lat: 0, lon: -140, source: 'demo' }
    imagery.searchCapturesDetailed.mockResolvedValue({ captures: [], degraded: [] })
    imagery.weatherCaptures.mockResolvedValue([])
    imagery.sentinel2PlanCovers.mockResolvedValue(false)
    const report = await computeReport(ocean, { now })
    const optical = report.passes.filter((p) => getSatInfo(p.norad)?.category === 'open-optical')
    expect(optical.length).toBeGreaterThan(0)
    expect(optical.filter((p) => p.verdict === 'likely')).toEqual([])
    expect(report.notes).toContain(OCEAN_NOTE)

    // On land (the plan covers the place) nothing changes, and the question is only asked without S2 scenes.
    imagery.sentinel2PlanCovers.mockResolvedValue(true)
    const land = await computeReport(waterloo, { now })
    expect(land.passes.some((p) => p.verdict === 'likely' && getSatInfo(p.norad)?.category === 'open-optical')).toBe(true)
    expect(land.notes).not.toContain(OCEAN_NOTE)
    expect(land.archiveFailed).toBe(false)
  })

  for (const stage of ['propagate', 'archive'] as const) it(`aborts cleanly during the ${stage} stage (no unhandled rejections)`, async () => {
    // Node's process (vitest runs in node; the app tsconfig has no node types).
    const proc = (globalThis as unknown as { process: { on(e: string, f: (r: unknown) => void): void; off(e: string, f: (r: unknown) => void): void } }).process
    const unhandled: unknown[] = []
    const onUnhandled = (e: unknown) => unhandled.push(e)
    proc.on('unhandledRejection', onUnhandled)
    const pendingUntilAbort = (_a: unknown, _b: unknown, _c: unknown, signal?: AbortSignal) =>
      new Promise((_, reject) => signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))))
    imagery.searchCapturesDetailed.mockImplementation((place: unknown, a: unknown, b: unknown, signal?: AbortSignal) => pendingUntilAbort(place, a, b, signal))
    imagery.weatherCaptures.mockImplementation((place: unknown, passes: unknown, signal?: AbortSignal) => pendingUntilAbort(place, passes, null, signal))
    const ctl = new AbortController()
    const p = computeReport(waterloo, {
      now,
      signal: ctl.signal,
      onProgress: (e) => {
        if (e.stage === stage) setTimeout(() => ctl.abort(), 0)
      },
    })
    await expect(p).rejects.toMatchObject({ name: 'AbortError' })
    await new Promise((r) => setTimeout(r, 50))
    proc.off('unhandledRejection', onUnhandled)
    expect(unhandled).toEqual([])
  })

  it('survives a throwing callback', async () => {
    imagery.searchCapturesDetailed.mockResolvedValue({ captures: [], degraded: [] })
    imagery.weatherCaptures.mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 20))
      return []
    })
    const err = console.error
    console.error = () => undefined
    try {
      const report = await computeReport(waterloo, {
        now,
        onProgress: () => {
          throw new Error('ui bug')
        },
        onPartial: () => {
          throw new Error('ui bug')
        },
      })
      expect(report.passes.length).toBeGreaterThan(50)
    } finally {
      console.error = err
    }
  })

  it('delivers a partial report before the GIBS mosaics are verified', async () => {
    const p = passesOf(43013, WATERLOO).filter((x) => x.sunElevationDeg > 5)[0]
    imagery.searchCapturesDetailed.mockResolvedValue({ captures: [], degraded: [] })
    // GIBS answers only after the partial report was delivered (or after 3 s, so a bug can't hang the test).
    let release!: () => void
    const gate = new Promise<void>((r) => {
      release = r
      setTimeout(r, 3000)
    })
    imagery.weatherCaptures.mockImplementation(async (_place: LatLon, passes: Pass[]) => {
      await gate
      if (!passes.some((x) => x.id === p.id)) return []
      return [capture({ id: 'VIIRS@slow', provider: 'gibs', platform: 'noaa-20', collection: 'gibs-viirs-noaa20', norad: 43013, datetime: p.tClosest, gsdM: 375 })]
    })
    const partials: { imaged: number; partial: boolean; firstResultMs: number }[] = []
    const report = await computeReport(waterloo, {
      now,
      onPartial: (r) => {
        partials.push({ imaged: r.counts.imaged, partial: r.partial, firstResultMs: r.timings.firstResultMs })
        release()
      },
    })
    expect(partials).toHaveLength(1)
    expect(partials[0]).toMatchObject({ imaged: 0, partial: true })
    expect(report.partial).toBe(false)
    expect(report.counts.imaged).toBe(1)
    expect(report.timings.firstResultMs).toBe(partials[0].firstResultMs)
    expect(report.timings.firstResultMs).toBeLessThan(report.timings.totalMs)
  })

  it('degrades gracefully when the archives fail', async () => {
    imagery.searchCapturesDetailed.mockRejectedValue(new Error('network down'))
    imagery.weatherCaptures.mockRejectedValue(new Error('gibs down'))
    const report = await computeReport(waterloo, { now })
    expect(report.passes.length).toBeGreaterThan(50)
    expect(report.counts.imaged).toBe(0)
    expect(report.captures).toEqual([])
    expect(report.notes.length).toBe(2)
    expect(report.notes[1]).toMatch(/^NASA GIBS could not be reached/)
    expect(report.archiveFailed).toBe(true)
    // An outage is not "the open ocean": the plan question is never asked then.
    expect(imagery.sentinel2PlanCovers).not.toHaveBeenCalled()
  })

  it('lists geostationary watchers with their real longitudes', async () => {
    imagery.searchCapturesDetailed.mockResolvedValue({ captures: [], degraded: [] })
    imagery.weatherCaptures.mockResolvedValue([])
    const w = await computeReport(waterloo, { now })
    const names = w.geo.map((g) => g.name)
    expect(names).toContain('GOES-19')
    expect(names).toContain('GOES-18')
    expect(names).not.toContain('Himawari-9')
    expect(names).not.toContain('GOES-16') // standby
    const g19 = w.geo.find((g) => g.name === 'GOES-19')!
    expect(g19.subLon).toBeGreaterThan(-80)
    expect(g19.subLon).toBeLessThan(-70)
    expect(g19.imagesInWindow).toBe(1008)
    expect(g19.frames).toBe('goes-east')

    const t = await computeReport(tokyo, { now })
    const tn = t.geo.map((g) => g.name)
    expect(tn).toContain('Himawari-9')
    expect(tn).toContain('GEO-KOMPSAT-2A')
    expect(tn).toContain('Fengyun-4B')
    expect(tn).not.toContain('GOES-19')
    console.log('Tokyo geo:', t.geo.map((g) => `${g.name} ${g.subLon.toFixed(1)}° el ${g.elevationDeg.toFixed(1)}°`).join(', '))
  })

  it('names a frame source for the watchers a public service carries, and marks the rim of a disc', async () => {
    imagery.searchCapturesDetailed.mockResolvedValue({ captures: [], degraded: [] })
    imagery.weatherCaptures.mockResolvedValue([])
    const by = (r: { geo: { name: string; frames?: string; rim?: boolean }[] }) => Object.fromEntries(r.geo.map((g) => [g.name, g]))
    const paris = by(await computeReport({ lat: 48.8566, lon: 2.3522, label: 'Paris', source: 'demo' }, { now }))
    expect(paris['Meteosat-12']).toMatchObject({ frames: 'meteosat-0deg' })
    expect(paris['Meteosat-9']).toMatchObject({ frames: 'meteosat-iodc' })
    expect(paris['Meteosat-12'].rim ?? paris['Meteosat-9'].rim).toBeUndefined()
    expect(paris['Elektro-L 3'].frames).toBeUndefined() // no public service carries it
    // 74°N in the Norwegian Sea: Meteosat-12 stands 7° up, where its picture starts to go empty.
    const north = by(await computeReport({ lat: 74, lon: 5, label: 'Norwegian Sea', source: 'demo' }, { now }))
    expect(north['Meteosat-12']).toMatchObject({ frames: 'meteosat-0deg', rim: true })
    for (const g of Object.values(north)) expect(g.rim).toBe(true)
  })

  it("adds each public geostationary watcher's newest frame as an image with its scan, never counted as a pass", async () => {
    imagery.searchCapturesDetailed.mockResolvedValue({ captures: [], degraded: [] })
    imagery.weatherCaptures.mockResolvedValue([])
    const frameTime = now - 40 * 60_000
    imagery.latestGeoFrame.mockImplementation(async (source: unknown) => (source === 'goes-east' ? { url: 'u', time: frameTime, band: 'colour', gridKm: 2, empty: 0, layer: 'GOES-East_ABI_GeoColor', via: 'gibs' } : null))
    imagery.geoCapture.mockImplementation((source: string, frame: { time: number; layer: string }, _p: LatLon, norad?: number) => ({
      id: `${frame.layer}@${frame.time}`, provider: 'gibs', collection: 'gibs-goes-east', itemId: `${frame.layer}@${frame.time}`, platform: source, norad, datetime: frame.time, gsdM: 2000, band: 'colour', cropUrl: () => 'u',
    }))
    const clock = vi.spyOn(Date, 'now').mockReturnValue(now)
    try {
      const plain = await computeReport(waterloo, { now })
      // The frame may land after the final report (nobody was listening): ask again with a listener and wait for it.
      const updates: (typeof plain)[] = []
      const r0 = await computeReport(waterloo, { now, onUpdate: (r) => updates.push(r) })
      await new Promise((r) => setTimeout(r, 20))
      const r = updates[updates.length - 1] ?? r0
      const scans = r.passes.filter((p) => p.geostationary)
      expect(scans).toHaveLength(1)
      const scan = scans[0]
      expect(getSatInfo(scan.norad)?.displayName).toBe('GOES-19')
      expect(scan.verdict).toBe('imaged')
      expect(r.captures.find((c) => c.id === scan.captureId)?.collection).toBe('gibs-goes-east')
      // ABI scans north to south in 10 minutes: Waterloo (43°N) is crossed in the first half, the line heading south.
      expect(scan.tStart).toBe(frameTime)
      expect(scan.tEnd - scan.tStart).toBe(600_000)
      expect(scan.tClosest).toBeGreaterThan(frameTime + 30_000)
      expect(scan.tClosest).toBeLessThan(frameTime + 300_000)
      // South, give or take the line's slight tilt away from the meridian under the spacecraft (Waterloo is 5° off it).
      expect(Math.abs(scan.headingDeg - 180)).toBeLessThan(2)
      expect(scan.node).toBe('descending')
      // The crossing is the moment the line is at the angle GOES-19 sees Waterloo at.
      const seat = scanSeatOf(scan)!
      expect(Math.abs(seat.lon + 75)).toBeLessThan(3)
      expect(scanAngleAt(scan, scan.tClosest)).toBeCloseTo(scanAngleOf(seat, waterloo), 4)
      expect(scan.altitudeKm).toBeGreaterThan(35_000)
      expect(scan.elevationDeg).toBeGreaterThan(30)
      for (let i = 1; i < scan.track.length; i++) expect(scan.track[i].lat).toBeLessThan(scan.track[i - 1].lat)
      // The line's path passes nearest Waterloo at the scan's closest approach.
      const at = scan.track.reduce((a, b) => (Math.abs(b.t - scan.tClosest) < Math.abs(a.t - scan.tClosest) ? b : a))
      expect(Math.abs(at.lat - 44)).toBeLessThan(4)
      expect(scan.groundSpeedKmS).toBeGreaterThan(18)
      expect(scan.groundSpeedKmS).toBeLessThan(60)
      // Counts are of overflights only.
      expect(r.counts.passes).toBe(plain.counts.passes)
      expect(r.counts.imaged).toBe(plain.counts.imaged)
      expect(r.passes.length).toBe(r.counts.passes + 1)
    } finally {
      clock.mockRestore()
      imagery.latestGeoFrame.mockReset().mockResolvedValue(null)
    }
  })

  it('holds the geostationary image a shared link carries, in place of that watcher’s newest', async () => {
    imagery.searchCapturesDetailed.mockResolvedValue({ captures: [], degraded: [] })
    imagery.weatherCaptures.mockResolvedValue([])
    const frameTime = Math.floor((now - 5 * 3_600_000) / 600_000) * 600_000
    imagery.geoCaptureFromItem.mockImplementation((collection: string, itemId: string, _p: LatLon, norad?: number) => ({
      id: itemId, provider: 'gibs', collection, itemId, platform: 'goes-east', norad, datetime: frameTime, gsdM: 2000, band: 'colour', cropUrl: () => 'u',
    }))
    imagery.latestGeoFrame.mockClear()
    const clock = vi.spyOn(Date, 'now').mockReturnValue(now)
    try {
      const r = await computeReport(waterloo, { now, geoItem: { norad: 60133, collection: 'gibs-goes-east', itemId: 'GOES-East_ABI_GeoColor@x' } })
      const scans = r.passes.filter((p) => p.geostationary)
      expect(scans).toHaveLength(1)
      expect(scans[0]).toMatchObject({ norad: 60133, tStart: frameTime, captureId: 'GOES-East_ABI_GeoColor@x' })
      // GOES-East's newest is not asked for; GOES-West's still is.
      const asked = imagery.latestGeoFrame.mock.calls.map((c) => c[0])
      expect(asked).not.toContain('goes-east')
      expect(asked).toContain('goes-west')
    } finally {
      clock.mockRestore()
    }
  })

  it('asks for no geostationary frame when the window is not now (a shared link from last week)', async () => {
    imagery.searchCapturesDetailed.mockResolvedValue({ captures: [], degraded: [] })
    imagery.weatherCaptures.mockResolvedValue([])
    imagery.latestGeoFrame.mockClear()
    const clock = vi.spyOn(Date, 'now').mockReturnValue(now + 2 * 86_400_000)
    try {
      await computeReport(waterloo, { now })
      expect(imagery.latestGeoFrame).not.toHaveBeenCalled()
    } finally {
      clock.mockRestore()
    }
  })

  it('rejects with AbortError when aborted', async () => {
    imagery.searchCapturesDetailed.mockImplementation(() => new Promise(() => undefined))
    imagery.weatherCaptures.mockResolvedValue([])
    const ctl = new AbortController()
    const p = computeReport(waterloo, { now, signal: ctl.signal })
    ctl.abort()
    await expect(p).rejects.toMatchObject({ name: 'AbortError' })
  })
})

describe('computeReport: Sentinel-1 radar images', () => {
  const S1C = 62261
  const radarScene = (p: Pass, id: string) =>
    capture({ id, platform: 'sentinel-1c', norad: S1C, collection: 'sentinel-1-rtc', datetime: p.tClosest - 10_000, gsdM: 20, cropUrl: () => 'about:blank' })

  it('turns the radar pass with an image into a watched one, and keeps the others as geometry says', async () => {
    const could = passesOf(S1C, WATERLOO)
    expect(could.length).toBeGreaterThan(1)
    const target = could[0]
    imagery.searchCapturesDetailed.mockResolvedValue({ captures: [], degraded: [] })
    imagery.weatherCaptures.mockResolvedValue([])
    imagery.searchRadar.mockResolvedValue([radarScene(target, 'S1C_RTC')])
    const report = await computeReport(waterloo, { now })
    const s1 = report.passes.filter((p) => p.norad === S1C)
    const imaged = s1.filter((p) => p.verdict === 'imaged')
    expect(imaged.map((p) => p.captureId)).toEqual(['S1C_RTC'])
    expect(Math.abs(imaged[0].tClosest - target.tClosest)).toBeLessThan(1000)
    expect(s1.filter((p) => p.verdict !== 'imaged').every((p) => p.verdict === 'could')).toBe(true)
    expect(report.captures.map((c) => c.id)).toContain('S1C_RTC')
    expect(report.counts.imaged).toBe(report.passes.filter((p) => p.verdict === 'imaged').length)
  })

  it('never waits for the radar search: a report built before it answers leaves radar out', async () => {
    imagery.searchCapturesDetailed.mockResolvedValue({ captures: [], degraded: [] })
    imagery.weatherCaptures.mockResolvedValue([])
    imagery.searchRadar.mockReturnValue(new Promise(() => undefined))
    const t0 = performance.now()
    const report = await computeReport(waterloo, { now })
    expect(performance.now() - t0).toBeLessThan(15_000)
    expect(report.passes.filter((p) => p.norad === S1C).every((p) => p.verdict === 'could')).toBe(true)
    expect(report.captures.some((c) => c.collection === 'sentinel-1-rtc')).toBe(false)
  })

  it('leaves radar out when its archive fails, without a note (the passes are what they always were)', async () => {
    imagery.searchCapturesDetailed.mockResolvedValue({ captures: [], degraded: [] })
    imagery.weatherCaptures.mockResolvedValue([])
    imagery.searchRadar.mockRejectedValue(new Error('down'))
    const report = await computeReport(waterloo, { now })
    expect(report.captures.some((c) => c.collection === 'sentinel-1-rtc')).toBe(false)
    expect(report.notes).toEqual([])
  })

  it('lists only the radar images a pass shows (an image that matched none is not in the report)', async () => {
    const target = passesOf(S1C, WATERLOO)[0]
    imagery.searchCapturesDetailed.mockResolvedValue({ captures: [], degraded: [] })
    imagery.weatherCaptures.mockResolvedValue([])
    // A second slice of the same overflight, and a scene of a satellite that never came near.
    imagery.searchRadar.mockResolvedValue([radarScene(target, 'A'), radarScene(target, 'B'), { ...radarScene(target, 'Z'), platform: 'sentinel-1z', norad: undefined }])
    const report = await computeReport(waterloo, { now })
    const radar = report.captures.filter((c) => c.collection === 'sentinel-1-rtc').map((c) => c.id)
    expect(radar).toHaveLength(1)
    expect(report.passes.filter((p) => p.captureId && radar.includes(p.captureId))).toHaveLength(1)
  })
})
