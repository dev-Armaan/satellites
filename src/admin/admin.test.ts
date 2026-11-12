import { describe, expect, it } from 'vitest'
import { searchSource } from '@/app/telemetry'
import type { Place } from '@/types'
import { isTimeout, parseStats, RANGES } from './api'
import { mockStats } from './fixture'
import { fmtBucket, fmtPct, niceMax, SOURCE_NAMES } from './format'

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
    expect(fmtBucket(Date.UTC(2026, 10, 8), 'day')).toBe('NOV 08')
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
