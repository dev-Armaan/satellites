import { describe, expect, it } from 'vitest'
import { searchSource } from '@/app/telemetry'
import type { Place } from '@/types'
import { isTimeout, liveFor, parseLive, parseStats, RANGES } from './api'
import { mockLive, mockStats } from './fixture'
import { fmtBucket, fmtPct, niceMax, SOURCE_NAMES } from './format'
import { dotRadius, GRID_STEP, legendCounts, placeGrid } from './placeGrid'

describe('admin_stats parsing', () => {
  it('accepts the fixture for every range', () => {
    for (const r of RANGES) {
      const s = parseStats(JSON.parse(JSON.stringify(mockStats(r, Date.UTC(2026, 10, 9, 12)))))
      expect(s?.range).toBe(r)
      expect(s!.series.length).toBeGreaterThan(20)
      expect(s!.top['search.label'][0][0]).toBe('Waterloo, Ontario, Canada')
    }
  })
  it('rejects junk and fills gaps', () => {
    expect(parseStats(null)).toBeNull()
    expect(parseStats({ range: 'forever' })).toBeNull()
    const s = parseStats({ range: '7d', totals: { search: 'x', session: 3 }, top: { 'a.b': [['x', 1], 'junk', [2, 3]] }, results: null })!
    expect(s.totals).toEqual({ search: 0, session: 3 })
    expect(s.top['a.b']).toEqual([['x', 1]])
    expect(s.results).toEqual({ n: 0, p50Ms: null, p90Ms: null, partial: 0, archiveFailed: 0 })
    expect(s.series).toEqual([])
  })
})

describe('search sources', () => {
  it('every way into a search has its own name on the admin page', () => {
    // Typed as a Record so a new Place source fails to compile until it is listed here.
    const sources: Record<Place['source'], true> = { search: true, geolocation: true, url: true, demo: true, surprise: true, pin: true }
    const reported = Object.keys(sources).map((s) => searchSource({ place: { label: 'x', lat: 0, lon: 0, source: s as Place['source'] } }))
    for (const r of reported) expect(SOURCE_NAMES[r]).toBeTruthy()
    expect(new Set(reported).size).toBe(reported.length)
    expect(SOURCE_NAMES.surprise).toBe('Surprise me')
  })
})

describe('formats', () => {
  it('nice axis maxima', () => {
    expect([1, 3, 7, 12, 99, 101, 240].map(niceMax)).toEqual([1, 5, 10, 20, 100, 200, 250])
  })
  it('percentages and buckets', () => {
    expect(fmtPct(0.0612)).toBe('6.1%')
    expect(fmtPct(0.5)).toBe('50%')
    expect(fmtPct(null)).toBe('—')
    expect(fmtBucket(Date.UTC(2026, 10, 8, 14), 'hour')).toBe('NOV 08 09:00') // EST = UTC-5
    expect(fmtBucket(Date.UTC(2026, 10, 8, 5), 'hour', true)).toBe('NOV 08') // ET midnight
    expect(fmtBucket(Date.UTC(2026, 6, 8, 14), 'hour')).toBe('JUL 08 10:00') // EDT = UTC-4
    expect(fmtBucket(Date.UTC(2026, 10, 8), 'day')).toBe('NOV 08') // a UTC day (before 0016)
    expect(fmtBucket(Date.UTC(2026, 10, 8, 5), 'day')).toBe('NOV 08') // an Eastern day: midnight EST
    expect(fmtBucket(Date.UTC(2026, 6, 8, 4), 'day')).toBe('JUL 08') // midnight EDT
  })
})

describe('range start (0016)', () => {
  it('parses from, null from a database before 0016', () => {
    const from = Date.UTC(2026, 10, 6, 5)
    expect(parseStats({ range: '7d', from })!.from).toBe(from)
    expect(parseStats({ range: '7d' })!.from).toBeNull()
    expect(parseStats({ range: '7d', from: 'x' })!.from).toBeNull()
  })
})

describe('maintenance note', () => {
  it('shows when the hourly job is over 2 h late or never ran', async () => {
    const { maintBehind } = await import('./format')
    const now = Date.UTC(2026, 10, 9, 12)
    expect(maintBehind({ generatedAt: now, maintLastAt: now - 30 * 60e3 })).toBe(false)
    expect(maintBehind({ generatedAt: now, maintLastAt: now - 3 * 3600e3 })).toBe(true)
    expect(maintBehind({ generatedAt: now, maintLastAt: null })).toBe(true)
    expect(parseStats({ range: '7d', maintLastAt: now, rolledThrough: '2026-11-08' })).toMatchObject({ maintLastAt: now, rolledThrough: '2026-11-08' })
  })
})

describe('admin_stats retry', () => {
  it('treats only statement timeouts as retryable', () => {
    expect(isTimeout({ code: '57014', message: 'canceling statement due to statement timeout' })).toBe(true)
    expect(isTimeout({ message: 'canceling statement due to statement timeout' })).toBe(true)
    expect(isTimeout({ code: '42501', message: 'not allowed' })).toBe(false)
  })
})

describe('recorded counts (0015)', () => {
  it('keeps the counts without rebuilt hours apart from the totals', () => {
    const s = parseStats({ range: '7d', totals: { search: 1894 + 100, session: 1217 + 50 }, recorded: { search: 100, session: 50 } })!
    expect(s.totals).toMatchObject({ search: 1994, session: 1267 })
    expect(s.recorded).toEqual({ search: 100, session: 50 })
  })
  it('falls back to the totals from a database before 0015, or on junk', () => {
    expect(parseStats({ range: '7d', totals: { search: 9, session: 4 } })!.recorded).toEqual({ search: 9, session: 4 })
    expect(parseStats({ range: '7d', totals: { search: 9 }, recorded: { search: 'x' } })!.recorded).toEqual({ search: 9, session: 0 })
    expect(parseStats({ range: '7d' })!.recorded).toEqual({ search: 0, session: 0 })
  })
})

describe('cached stats', () => {
  it('parses cachedAt, null from a database before 0009', () => {
    const now = Date.UTC(2026, 10, 10, 12)
    expect(parseStats({ range: '24h', cachedAt: now })?.cachedAt).toBe(now)
    expect(parseStats({ range: '24h' })?.cachedAt).toBeNull()
    expect(parseStats({ range: '24h', cachedAt: 'soon' })?.cachedAt).toBeNull()
    expect(mockStats('7d', now).cachedAt).toBe(now - 3 * 60e3)
  })
  it("says how long ago the stats were updated", async () => {
    const { fmtUpdated } = await import('./format')
    const now = Date.UTC(2026, 10, 10, 12)
    expect(fmtUpdated(now - 20e3, now)).toBe('UPDATED JUST NOW')
    expect(fmtUpdated(now - 4 * 60e3, now)).toBe('UPDATED 4 MIN AGO')
    expect(fmtUpdated(now - 16 * 60e3, now)).toBe('UPDATED 16 MIN AGO')
  })
})

describe('live counts (0023)', () => {
  const now = Date.UTC(2026, 10, 13, 8, 30)
  const answer = { range: '7d', since: now - 30 * 60e3, at: now, search: 35, share_action: 4, session: 17 }
  it('parses the counts, and none when the database gives none', () => {
    expect(parseLive(answer)).toEqual(answer)
    // counters that do not cover the whole time since the stored stats: since and at, no counts
    expect(parseLive({ range: '7d', since: now - 6 * 3600e3, at: now })).toBeNull()
    expect(parseLive({ range: '24h', since: null, at: now })).toBeNull()
    expect(parseLive({ ...answer, search: '35' })).toBeNull()
    expect(parseLive({ ...answer, session: -1 })).toBeNull()
    expect(parseLive({ ...answer, range: 'forever' })).toBeNull()
    expect(parseLive(null)).toBeNull()
  })
  it('adds them only to the stats they continue', () => {
    const live = parseLive(answer)!
    expect(liveFor({ range: '7d', cachedAt: answer.since }, live)).toBe(live)
    // the hourly refresh landed between the two answers: these counts start an hour too late, or too early
    expect(liveFor({ range: '7d', cachedAt: answer.since - 3600e3 }, live)).toBeNull()
    expect(liveFor({ range: '7d', cachedAt: answer.since + 3600e3 }, live)).toBeNull()
    expect(liveFor({ range: '30d', cachedAt: answer.since }, live)).toBeNull()
    expect(liveFor({ range: '7d', cachedAt: null }, live)).toBeNull()
    expect(liveFor({ range: '7d', cachedAt: answer.since }, null)).toBeNull()
  })
  it('the fixture continues its own stats', () => {
    const s = mockStats('7d', now)
    expect(liveFor(s, mockLive(s, now))?.search).toBeGreaterThan(0)
  })
  it('shows the moment they were read, to the second, on the admin clock', async () => {
    const { fmtClock } = await import('./format')
    expect(fmtClock(Date.UTC(2026, 10, 13, 8, 30, 7))).toBe('03:30:07 EST')
    expect(fmtClock(Date.UTC(2026, 6, 1, 4, 0, 59))).toBe('00:00:59 EDT')
  })
})

describe('places map grid', () => {
  it('gathers cells into grid squares, largest first, and skips junk', () => {
    const g = placeGrid([['37.2,-115.8', 10], ['37.4,-115.1', 5], ['51.5,-0.1', 40], ['nope', 3], ['95.0,10.0', 2], ['10.0,10.0', 0]])
    expect(g.cells).toBe(3)
    expect(g.dots.map((d) => d.n)).toEqual([40, 15])
    expect(g.max).toBe(40)
    // 51.5°N 0.1°W sits in the square 50–52.5°N, 2.5–0°W
    expect(g.dots[0]).toMatchObject({ x: 178.75, y: 38.75 })
  })
  it('keeps the poles and the date line inside the map', () => {
    const g = placeGrid([['-90.0,180.0', 1], ['90.0,-180.0', 1]])
    expect(g.dots).toHaveLength(2)
    for (const d of g.dots) {
      expect(d.x).toBeGreaterThan(0)
      expect(d.x).toBeLessThan(360)
    }
    expect([g.top, g.bottom]).toEqual([0, 180])
    expect(placeGrid(undefined)).toMatchObject({ dots: [], max: 1, top: 10, bottom: 150 })
  })
  it('sizes dots on a log scale that never overflows a square', () => {
    expect(dotRadius(13654, 13654)).toBeCloseTo(GRID_STEP / 2)
    expect(dotRadius(1, 13654)).toBeGreaterThan(GRID_STEP * 0.12)
    expect(dotRadius(100, 13654)).toBeGreaterThan(dotRadius(10, 13654))
    expect(dotRadius(1, 1)).toBeCloseTo(GRID_STEP / 2)
    expect(legendCounts(13654)).toEqual([1, 100, 13654])
    expect(legendCounts(2)).toEqual([2])
  })
})
