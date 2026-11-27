import { describe, expect, it } from 'vitest'
import { searchSource } from '@/app/telemetry'
import type { Place } from '@/types'
import { isTimeout, liveFor, parseLive, parseStats, RANGES } from './api'
import { mockLive, mockStats } from './fixture'
import { browserLangReach, browserLanguageName, fmtBucket, fmtPct, funnelShares, languageName, niceMax, SOURCE_NAMES, translationFor, type FunnelStage } from './format'
import { LOCALE_INFO, LOCALES } from '../../api/_lib/i18n/locales'
import { liveSeries } from './live'
import { BAND, DUST_BELOW, cellKey, dustCount, fmtLatLon, fmtShort, keyCounts, maxCircles, nameSpots, placeMap, placeTags, spotRadius, type Found } from './placeMap'

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
    expect(s.results).toEqual({ n: 0, p50Ms: null, p90Ms: null, partial: 0, archiveFailed: 0, legs: {} })
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

describe('funnel shares', () => {
  // The all-time funnel on 2026-11-15. Every step is a share of the recorded sessions (owner): the steps are not one
  // chain, and dividing each by the step listed above it read 211% for Expanded a photo.
  const stages: FunnelStage[] = [
    { key: 'search', label: 'Searched', n: 682_426 },
    { key: 'results', label: 'Saw results', n: 667_734 },
    { key: 'pass_open', label: 'Opened a pass', n: 165_370 },
    { key: 'lightbox_open', label: 'Expanded a photo', n: 348_729 },
    { key: 'share_open', label: 'Opened share', n: 9_478 },
    { key: 'share_action', label: 'Shared', n: 3_230 },
  ]
  it('gives each step as a share of the sessions, Searched being the sessions with at least one search', () => {
    expect(funnelShares(stages, 1_029_586).map((r) => fmtPct(r.share))).toEqual(['66%', '65%', '16%', '34%', '0.9%', '0.3%'])
  })
  it('never divides by zero sessions', () => {
    expect(funnelShares(stages, 0).every((r) => r.share === null)).toBe(true)
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

describe('the time-lapse in the stats (0024)', () => {
  it('reads a fifth number from each point of the series, and 0 from a database before it', () => {
    const s = parseStats({ range: '24h', series: [[1, 10, 2, 8, 3], [2, 5, 0, 4]] })!
    expect(s.series).toEqual([[1, 10, 2, 8, 3], [2, 5, 0, 4, 0]])
  })
  it("reads where a search's wait went, and nothing from a database before it was recorded (0031)", () => {
    const s = parseStats({ range: '7d', results: { n: 9, legs: { t_hero: { n: 4, p50: 100, p90: 1320 }, t_report: { n: 4, p50: 'x' }, junk: 7 } } })!
    expect(s.results.legs).toEqual({ t_hero: { n: 4, p50: 100, p90: 1320 }, t_report: { n: 4, p50: null, p90: null } })
    expect(parseStats({ range: '7d', results: { n: 9, legs: [1, 2] } })!.results.legs).toEqual({})
  })
  it('has a name for every leg the app reports, and the fixture has them all', async () => {
    const { LEG_NAMES } = await import('./format')
    const { searchLegs } = await import('@/app/telemetry')
    // Every key searchLegs can send, whether or not this call has a value for it.
    const sent = Object.keys(searchLegs(0, () => undefined))
    expect(LEG_NAMES.map(([key]) => key).sort()).toEqual([...sent].sort())
    expect(Object.keys(mockStats('7d', Date.UTC(2026, 10, 13, 12)).results.legs).sort()).toEqual([...sent].sort())
  })
  it('has a name for every way in and every way of sharing the client reports', async () => {
    const { TIMELAPSE_ACTION_NAMES, TIMELAPSE_FROM_NAMES } = await import('./format')
    for (const from of ['results', 'viewer', 'link']) expect(TIMELAPSE_FROM_NAMES[from]).toBeTruthy()
    for (const action of ['video', 'link']) expect(TIMELAPSE_ACTION_NAMES[action]).toBeTruthy()
    const { SUPPORT_FROM_NAMES } = await import('./format')
    for (const from of ['bar', 'share', 'results', 'about', 'timelapse', 'landing', 'computing', 'about_top']) expect(SUPPORT_FROM_NAMES[from]).toBeTruthy()
  })
  it('is in the fixture, so the page can be looked at without a database', () => {
    const m = mockStats('7d', Date.UTC(2026, 10, 13, 12))
    expect(m.totals.timelapse_open).toBe(m.series.reduce((a, p) => a + p[4], 0))
    expect(m.top['timelapse_open.from'].map((r) => r[0])).toEqual(['results', 'viewer', 'link'])
  })
})

describe('languages (0027)', () => {
  it('names each of the app\'s languages in English, and shows an unknown code as it is', () => {
    for (const l of LOCALES) expect(languageName(l)).toBe(LOCALE_INFO[l].english)
    expect(languageName('pt-BR')).toBe('Portuguese')
    expect(languageName('xx')).toBe('xx')
  })
  it('is in the fixture: every language, fewer tabs than sessions, nothing cut', () => {
    const m = mockStats('7d', Date.UTC(2026, 10, 19, 12))
    const rows = m.top['session.lang']
    expect(rows.map((r) => r[0]).sort()).toEqual([...LOCALES].sort())
    expect(m.dimTotals['session.lang']).toBe(rows.reduce((a, r) => a + r[1], 0))
    expect(m.dimTotals['session.lang']).toBeLessThanOrEqual(m.recorded.session)
  })
})

describe('browser languages (0028)', () => {
  it('has a translation for every language the app speaks, by its primary subtag, and by the matcher\'s exceptions', () => {
    for (const l of LOCALES) expect(translationFor(l.split('-')[0].toLowerCase())).toBe(LOCALE_INFO[l].listed ? 'listed' : 'unlisted')
    expect(translationFor('zh')).toBe('listed')
    expect(translationFor('pt')).toBe('listed')
    expect(translationFor('in')).toBe('listed') // the old code for Indonesian
    expect(translationFor('yue')).toBe('listed') // Cantonese reads Traditional Chinese
    for (const l of ['sv', 'cs', 'bn', 'th', 'be', 'fil', 'xx']) expect(translationFor(l)).toBe('none')
  })
  it('names a browser language in English, and shows an unknown code as it is', () => {
    expect(browserLanguageName('bn')).toBe('Bangla')
    expect(browserLanguageName('zh')).toBe('Chinese')
    expect(browserLanguageName('xx')).toBe('xx')
  })
  it('sums tabs and searching tabs for the languages with a translation and without, never more searching than tabs', () => {
    const r = browserLangReach(
      [['en', 100], ['sv', 20], ['ru', 10], ['th', 5], ['', 9]],
      [['en', 80], ['sv', 10], ['th', 7], ['de', 3]],
    )
    expect(r.rows.map((x) => [x.code, x.tabs, x.searched, x.translation])).toEqual([
      ['en', 100, 80, 'listed'],
      ['sv', 20, 10, 'none'],
      ['ru', 10, 0, LOCALE_INFO.ru.listed ? 'listed' : 'unlisted'],
      ['th', 5, 5, 'none'], // 24H: a tab can search in the range after it came, before it
    ])
    expect(r.all).toEqual({ tabs: 135, searched: 95 })
    expect(r.translated).toEqual({ tabs: 110, searched: 80 })
    expect(r.untranslated).toEqual({ tabs: 25, searched: 15 })
    expect(browserLangReach(undefined, undefined)).toEqual({ rows: [], all: { tabs: 0, searched: 0 }, translated: { tabs: 0, searched: 0 }, untranslated: { tabs: 0, searched: 0 } })
  })
  it('is in the fixture: more languages than the section lists, some with no translation, nothing cut', () => {
    const m = mockStats('30d', Date.UTC(2026, 10, 21, 12))
    const tabs = m.top['session.browser_lang']
    const did = new Map(m.top['session.browser_lang_searched'])
    expect(tabs.length).toBeGreaterThan(24)
    expect(tabs.every(([v], i) => /^[a-z]{2,3}$/.test(v) && (i === 0 || tabs[i - 1][1] >= tabs[i][1]))).toBe(true)
    expect(tabs.every(([v, n]) => (did.get(v) ?? 0) <= n)).toBe(true)
    for (const k of ['session.browser_lang', 'session.browser_lang_searched'] as const) expect(m.dimTotals[k]).toBe(m.top[k].reduce((a, r) => a + r[1], 0))
    expect(m.dimTotals['session.browser_lang']).toBeLessThanOrEqual(m.recorded.session)
    const r = browserLangReach(tabs, m.top['session.browser_lang_searched'])
    expect(r.untranslated.tabs).toBeGreaterThan(0)
    expect(r.untranslated.searched / r.untranslated.tabs).toBeLessThan(r.translated.searched / r.translated.tabs)
    for (const range of RANGES) {
      const s = mockStats(range, Date.UTC(2026, 10, 21, 12))
      expect(s.dimTotals['session.browser_lang']).toBeLessThanOrEqual(s.recorded.session)
    }
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
    expect(parseLive(answer)).toEqual({ ...answer, timelapse_open: null, hours: null })
    // 0025: the same counts hour by hour, or none of them if any is not five numbers
    const hours = [[now - 30 * 60e3, 35, 4, 17, 20]]
    expect(parseLive({ ...answer, hours })?.hours).toEqual([[now - 30 * 60e3, 35, 4, 17, 20, null]])
    // 0026: time-lapse opens, a total and each hour's sixth number; null where the database does not count them
    const lapsed = parseLive({ ...answer, timelapse_open: 6, hours: [[now, 35, 4, 17, 20, 6], [now + 3600e3, 1, 0, 1, 1, null]] })
    expect(lapsed?.timelapse_open).toBe(6)
    expect(lapsed?.hours).toEqual([[now, 35, 4, 17, 20, 6], [now + 3600e3, 1, 0, 1, 1, null]])
    expect(parseLive({ ...answer, hours: [[now, 1, 2, 3]] })?.hours).toBeNull()
    expect(parseLive({ ...answer, hours: [[now, 1, 2, 3, null]] })?.hours).toBeNull()
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

describe('activity chart with the live counts (0025)', () => {
  const H = 3600e3
  const h8 = Date.UTC(2026, 10, 13, 8) // 03:00 EST
  it('hourly: adds an hour to its bar, with the tabs active in it, and adds bars past the last one', () => {
    const series: [number, number, number, number, number][] = [[h8 - H, 900, 9, 700, 12], [h8, 4, 0, 3, 1]]
    const out = liveSeries(series, 'hour', [[h8, 100, 2, 60, 80, null], [h8 + 2 * H, 10, 1, 5, 7, null]])
    // time-lapse opens (the fifth number) from a database that does not count them live: kept as they are
    expect(out).toEqual([[h8 - H, 900, 9, 700, 12], [h8, 104, 2, 83, 1], [h8 + H, 0, 0, 0, 0], [h8 + 2 * H, 10, 1, 7, 0]])
    expect(series[1]).toEqual([h8, 4, 0, 3, 1]) // the stats' own series is not touched
    // 0026: the hour's time-lapse opens join its bar
    expect(liveSeries(series, 'hour', [[h8, 100, 2, 60, 80, 9], [h8 + H, 10, 1, 5, 7, 2]]).slice(1)).toEqual([[h8, 104, 2, 83, 10], [h8 + H, 10, 1, 7, 2]])
  })
  it('daily: adds each hour to its Eastern day, with the tabs new that day, and starts a day after midnight', () => {
    const nov12 = Date.UTC(2026, 10, 12, 5) // 00:00 EST
    const nov13 = Date.UTC(2026, 10, 13, 5)
    const series: [number, number, number, number, number][] = [[nov12 - 24 * H, 500, 5, 400, 0], [nov12, 800, 8, 600, 7]]
    // 23:00 EST on the 12th, then 00:00 and 03:00 EST on the 13th
    const out = liveSeries(series, 'day', [[nov13 - H, 10, 1, 6, 9, 1], [nov13, 20, 0, 15, 15, 2], [h8, 30, 2, 20, 25, 3]])
    expect(out).toEqual([[nov12 - 24 * H, 500, 5, 400, 0], [nov12, 810, 9, 606, 8], [nov13, 50, 2, 35, 5]])
  })
  it('daily: finds midnight on the day the clocks go back', () => {
    const nov1 = Date.UTC(2026, 10, 1, 4) // 00:00 EDT; the day is 25 hours long
    const out = liveSeries([[nov1, 1, 0, 1, 0]], 'day', [[nov1 + 24 * H, 5, 0, 2, 3, null]]) // 23:00 EST, still Nov 1
    expect(out).toEqual([[nov1, 6, 0, 3, 0]])
  })
  it('leaves the chart alone without hours', () => {
    const series: [number, number, number, number, number][] = [[h8, 4, 0, 3, 0]]
    expect(liveSeries(series, 'hour', null)).toBe(series)
    expect(liveSeries(series, 'hour', [])).toBe(series)
    expect(liveSeries([], 'hour', [[h8, 1, 0, 1, 1, null]])).toEqual([])
  })
})

describe('places map', () => {
  it('gathers the cells of one place into a spot on its busiest cell, largest first, and skips junk', () => {
    const m = placeMap([['40.7,-74.0', 60], ['40.8,-74.0', 170], ['40.9,-73.8', 5], ['51.5,-0.1', 40], ['nope', 3], ['95.0,10.0', 2], ['10.0,10.0', 0]])
    expect(m.cells).toBe(4)
    expect(m.searches).toBe(275)
    expect(m.spots).toMatchObject([{ lat: 40.8, lon: -74.0, n: 235, cells: 3 }, { lat: 51.5, lon: -0.1, n: 40, cells: 1 }])
    expect(m.max).toBe(235)
    // every cell knows its spot, however its key was written
    expect([m.at.get('40.7,-74.0'), m.at.get(cellKey(40.9, -73.8)), m.at.get(cellKey(51.5, -0.1))]).toEqual([0, 0, 1])
  })
  it('keeps places further apart than the reach apart, and orders spots by what they gathered', () => {
    // 0.6° from the busier cell: its own spot, which then outgrows it
    const m = placeMap([['10.0,10.0', 50], ['10.0,10.6', 40], ['10.0,10.9', 30]])
    expect(m.spots.map((s) => [s.lon, s.n])).toEqual([[10.6, 70], [10.0, 50]])
    expect(m.at.get('10.0,10.9')).toBe(0)
    // across the date line the two sides are neighbours
    expect(placeMap([['-17.0,180.0', 5], ['-17.0,-179.8', 3]]).spots).toHaveLength(1)
  })
  it('shows the inhabited band, and more only where there are searches', () => {
    expect(placeMap(undefined)).toMatchObject({ spots: [], max: 1, north: BAND.north, south: BAND.south })
    expect(placeMap([['51.5,-0.1', 1]])).toMatchObject({ north: BAND.north, south: BAND.south })
    expect(placeMap([['-77.8,166.7', 1], ['90.0,0.0', 1]])).toMatchObject({ north: 90, south: -81.8 })
  })
  it('sizes a circle by area, and calls dust what is too small or too many', () => {
    expect(spotRadius(40_000, 40_000, 20)).toBeCloseTo(20)
    expect(spotRadius(10_000, 40_000, 20)).toBeCloseTo(10)
    const spots = [900, 400, 100, 30, 30, 2].map((n) => ({ lat: 0, lon: 0, n, cells: 1 }))
    // by size: 900 · (2.2 / 20)² = 10.9, so 10 and fewer are under DUST_BELOW
    expect(dustCount(spots, 900, 20)).toBe(10)
    expect(spotRadius(11, 900, 20)).toBeGreaterThanOrEqual(DUST_BELOW)
    expect(spotRadius(10, 900, 20)).toBeLessThan(DUST_BELOW)
    // by number: room for three circles, so the fourth spot's count and under is dust (ties with it too)
    expect(dustCount(spots, 900, 20, 3)).toBe(30)
    expect(dustCount([], 1, 20)).toBe(0)
    expect(maxCircles(840)).toBe(120)
  })
  it('draws the key in round counts that are circles, not dust', () => {
    expect(keyCounts(38_664, 28)).toEqual([20_000, 2000])
    expect(keyCounts(38_664, 28, 2500)).toEqual([20_000])
    expect(keyCounts(239, 18)).toEqual([200, 20])
    // a range's first minutes: one search is a small circle, not the largest there is
    expect(spotRadius(1, 1, 20)).toBeCloseTo(5)
    expect(keyCounts(1, 18)).toEqual([1])
    expect(fmtShort(950)).toBe('950')
    expect(fmtShort(1200)).toBe('1.2K')
    expect(fmtShort(20_000)).toBe('20K')
    expect(fmtShort(1_139_538)).toBe('1.1M')
    expect(fmtLatLon(37.2, -115.8)).toBe('37.2°N 115.8°W')
    expect(fmtLatLon(-33.9, 151.2)).toBe('33.9°S 151.2°E')
    expect(fmtLatLon(0, 0)).toBe('0.0° 0.0°')
  })
  it('names a spot after the top place found in it', () => {
    const m = placeMap([['38.9,-77.0', 500], ['47.5,-120.5', 8], ['40.8,-74.0', 300], ['40.7,-74.0', 90], ['48.9,2.3', 50]])
    const found: Record<string, Found[]> = {
      // the state's middle comes first in the list; the capital has the searches
      Washington: [{ lat: 47.5, lon: -120.5, exact: true }, { lat: 38.9, lon: -77.04, exact: true }],
      'Central Park': [{ lat: 40.78, lon: -73.97, exact: true }],
      // a longer name that starts with the query is not the place
      Paris: [{ lat: 48.86, lon: 2.35 }],
      Atlantis: [],
    }
    const names = nameSpots(m, [['Washington, United States', 9], ['Central Park, New York, United States', 8], ['New York City, New York', 7], ['Paris, France', 6], ['Atlantis', 5], ['', 4]], (n) => found[n])
    expect([...names]).toEqual([[0, 'Washington'], [1, 'Central Park']])
  })
  it('puts a tag beside its circle, or where there is room, or nowhere', () => {
    const frame = { x: 0, y: 0, w: 400, h: 200 }
    const one = { spot: 0, cx: 100, cy: 100, r: 10, w: 60 }
    expect(placeTags([one], [], frame)[0]).toMatchObject({ x: 115, y: 94, w: 60, h: 12, leader: undefined })
    // something to the right: the left side
    expect(placeTags([one], [{ x: 120, y: 90, w: 20, h: 20 }], frame)[0]).toMatchObject({ x: 25 })
    // its own circle is not in its way
    expect(placeTags([{ ...one, own: 0 }], [{ x: 90, y: 90, w: 20, h: 20 }], frame)[0]).toMatchObject({ x: 115 })
    // against the right edge, with the left taken: above
    expect(placeTags([{ ...one, cx: 360 }], [{ x: 280, y: 90, w: 60, h: 20 }], frame)[0]).toMatchObject({ x: 330, y: 73 })
    // a later tag never takes an earlier one's place
    const two = placeTags([one, { ...one, spot: 1, cx: 104 }], [], frame)
    expect(two.map((t) => t.spot)).toEqual([0, 1])
    expect(two[1].x + two[1].w).toBeLessThanOrEqual(two[0].x)
    // boxed in on every side: further out, on a leader
    const walls = [{ x: 112, y: 94, w: 20, h: 12 }, { x: 68, y: 94, w: 20, h: 12 }, { x: 70, y: 70, w: 60, h: 14 }, { x: 70, y: 116, w: 60, h: 14 }]
    expect(placeTags([one], walls, frame)[0].leader).toBeDefined()
    // no room at all
    expect(placeTags([one], [{ x: 0, y: 0, w: 400, h: 200 }], frame)).toEqual([])
  })
  it('is in the fixture: a few places far ahead and a long tail', () => {
    const m = placeMap(mockStats('7d').top['search.cell'])
    expect(m.spots.length).toBeGreaterThan(200)
    expect(m.spots[0].n).toBeGreaterThan(20 * m.spots[Math.floor(m.spots.length / 2)].n)
  })
})
