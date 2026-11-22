/**
 * DEV-only fixture for /admin?mock=1 (screenshots without signing in). Imported dynamically behind
 * `import.meta.env.DEV`, so production builds never contain it. Numbers are invented but shaped like the
 * real RPC output (see supabase/migrations/0004_events_admin.sql, admin_stats).
 */
import type { AdminStats, LiveCounts, Range } from './api'

function rng(seed: number) {
  let s = seed >>> 0
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32)
}

const PLACES: [string, string, string, number][] = [
  ['Waterloo, Ontario, Canada', 'ca', '43.5,-80.5', 96],
  ['Toronto, Ontario, Canada', 'ca', '43.7,-79.4', 71],
  ['London, England, United Kingdom', 'gb', '51.5,-0.1', 64],
  ['New York, New York, United States', 'us', '40.7,-74.0', 58],
  ['Pyramids of Giza, Giza, Egypt', 'eg', '30.0,31.1', 41],
  ['Area 51, Nevada, United States', 'us', '37.2,-115.8', 39],
  ['Berlin, Germany', 'de', '52.5,13.4', 33],
  ['Tokyo, Japan', 'jp', '35.7,139.7', 29],
  ['San Francisco, California, United States', 'us', '37.8,-122.4', 27],
  ['Mumbai, Maharashtra, India', 'in', '19.1,72.9', 22],
  ['Palm Jumeirah, Dubai, United Arab Emirates', 'ae', '25.1,55.1', 19],
  ['Sydney, New South Wales, Australia', 'au', '-33.9,151.2', 17],
  ['São Paulo, Brazil', 'br', '-23.6,-46.6', 14],
  ['Lagos, Nigeria', 'ng', '6.5,3.4', 11],
  ['Reykjavík, Iceland', 'is', '64.1,-21.9', 9],
]

/** Where the map's long tail gathers: lat, lon and a weight (searches in the middle cell, and how many cells around). */
const CITIES: [number, number, number][] = [
  [34.1, -118.2, 12], [41.9, -87.6, 9], [29.8, -95.4, 6], [47.6, -122.3, 7], [25.8, -80.2, 6], [45.5, -73.6, 8], [49.3, -123.1, 7], [51.0, -114.1, 5],
  [19.4, -99.1, 8], [4.7, -74.1, 4], [-12.0, -77.0, 3], [-34.6, -58.4, 6], [-22.9, -43.2, 5], [-33.4, -70.7, 3],
  [48.9, 2.3, 14], [40.4, -3.7, 9], [41.9, 12.5, 8], [52.4, 4.9, 9], [59.3, 18.1, 5], [50.1, 14.4, 5], [52.2, 21.0, 7], [48.2, 16.4, 5], [50.5, 30.5, 8],
  [41.0, 29.0, 10], [55.8, 37.6, 6], [38.0, 23.7, 4], [53.3, -6.3, 4],
  [30.0, 31.2, 6], [-1.3, 36.8, 3], [-26.2, 28.0, 4], [-33.9, 18.4, 4], [33.6, -7.6, 3],
  [28.6, 77.2, 12], [12.9, 77.6, 9], [24.9, 67.0, 4], [23.8, 90.4, 3], [35.7, 51.4, 4], [24.7, 46.7, 4],
  [39.9, 116.4, 6], [31.2, 121.5, 8], [22.3, 114.2, 6], [37.6, 127.0, 7], [1.3, 103.8, 6], [13.8, 100.5, 5], [-6.2, 106.8, 5], [14.6, 121.0, 4],
  [-37.8, 145.0, 8], [-27.5, 153.0, 4], [-36.8, 174.8, 3], [21.3, -157.9, 2],
]

/** Each language's share of the tabs that named one (0027): every language has a few. */
const LANGS: [string, number][] = [
  ['en', 0.58], ['es', 0.085], ['de', 0.062], ['fr', 0.053], ['pt-BR', 0.046], ['ja', 0.038], ['it', 0.025], ['nl', 0.02],
  ['pl', 0.017], ['tr', 0.015], ['ko', 0.013], ['zh-Hans', 0.012], ['id', 0.01], ['uk', 0.008], ['ar', 0.007], ['ru', 0.006], ['zh-Hant', 0.005], ['vi', 0.004], ['fa', 0.003], ['hi', 0.003],
]

/**
 * Browser languages (0028): each one's weight among the tabs that recorded one, and the share of its tabs that searched.
 * The app's languages search about as often as English; most of those it has no translation for, and the four not
 * listed yet, less. More than the section lists, so its "And N more" line shows too.
 */
const BROWSER_LANGS: [string, number, number][] = [
  ['en', 50, 0.8], ['es', 8, 0.79], ['de', 6, 0.81], ['fr', 5, 0.78], ['pt', 4.5, 0.77], ['ja', 3.5, 0.74], ['it', 2.4, 0.8],
  ['nl', 2, 0.82], ['ru', 1.8, 0.52], ['zh', 1.6, 0.72], ['pl', 1.6, 0.79], ['tr', 1.4, 0.75], ['sv', 1.2, 0.58], ['ko', 1.2, 0.73],
  ['id', 1, 0.76], ['cs', 0.9, 0.55], ['uk', 0.8, 0.8], ['ar', 0.7, 0.71], ['he', 0.7, 0.49], ['ro', 0.6, 0.6], ['da', 0.6, 0.62],
  ['el', 0.5, 0.51], ['hu', 0.5, 0.57], ['th', 0.5, 0.31], ['vi', 0.5, 0.5], ['fi', 0.4, 0.6], ['hi', 0.4, 0.46], ['nb', 0.4, 0.64],
  ['fa', 0.3, 0.4], ['bn', 0.3, 0.35], ['ms', 0.2, 0.5], ['ca', 0.2, 0.7], ['bg', 0.2, 0.5], ['hr', 0.15, 0.55], ['sk', 0.15, 0.5],
  ['fil', 0.1, 0.4],
]

/** What admin_live would say a few minutes after `stats` were computed. */
export function mockLive(stats: AdminStats, now = Date.now()): LiveCounts | null {
  if (stats.cachedAt == null) return null
  const mins = Math.max(0, (now - stats.cachedAt) / 60e3)
  const [search, session, share] = [Math.round(mins * 9), Math.round(mins * 7), Math.round(mins * 0.4)]
  const lapses = Math.round(mins * 0.6)
  const hours: LiveCounts['hours'] = [[Math.floor(stats.cachedAt / 3600e3) * 3600e3, search, share, session, Math.round(session * 1.3), lapses]]
  return { range: stats.range, since: stats.cachedAt, at: now, search, session, share_action: share, timelapse_open: lapses, hours }
}

export function mockStats(range: Range, now = Date.now()): AdminStats {
  const r = rng(range.length * 7919 + 17)
  const scale = { '24h': 0.16, '7d': 1, '30d': 3.6, all: 6.2 }[range]
  const hourly = range === '24h' || range === '7d'
  const n = hourly ? (range === '24h' ? 25 : 169) : range === '30d' ? 31 : 58
  const step = hourly ? 3600e3 : 86400e3
  const start = Math.floor(now / step) * step - (n - 1) * step
  const series: AdminStats['series'] = []
  for (let i = 0; i < n; i++) {
    const t = start + i * step
    const h = new Date(t).getUTCHours()
    const diurnal = hourly ? 0.35 + 0.65 * Math.max(0, Math.sin(((h - 9) / 24) * Math.PI * 2) * 0.5 + 0.5) : 1
    const launch = !hourly && i > n - 12 ? 1.8 : 1
    const base = (hourly ? 4.2 : 58) * diurnal * launch
    const s = Math.round(base * (0.55 + r() * 0.9))
    let sh = 0
    for (let j = 0; j < s; j++) if (r() < 0.07) sh++
    series.push([t, s, sh, Math.round(s * (0.7 + r() * 0.25)), Math.round(s * (0.05 + r() * 0.06))])
  }
  const searches = series.reduce((a, s) => a + s[1], 0)
  const shares = series.reduce((a, s) => a + s[2], 0)
  const sessions = Math.round(searches * 0.83)
  const lapses = series.reduce((a, s) => a + s[4], 0)
  const k = (x: number) => Math.max(1, Math.round(x * scale))
  const places = PLACES.map(([l, , , c]) => [l, k(c)] as [string, number])
  const countries: Record<string, number> = {}
  for (const [, cc, , c] of PLACES) countries[cc] = (countries[cc] ?? 0) + k(c)
  // Shaped like the real list: a few places far ahead, then cities with their suburbs, then a long tail of ones and
  // twos scattered around where people live (and a few in the open sea).
  const cellCounts = new Map<string, number>(PLACES.map(([, , cell, c]) => [cell, k(c)]))
  const addCell = (lat: number, lon: number, n: number) => {
    const key = `${(Math.round(lat * 10) / 10 || 0).toFixed(1)},${(Math.round(lon * 10) / 10 || 0).toFixed(1)}`
    cellCounts.set(key, (cellCounts.get(key) ?? 0) + n)
  }
  for (const [lat, lon, weight] of CITIES) {
    addCell(lat, lon, k(weight * (0.6 + r() * 0.8)))
    for (let i = 0; i < 4 + weight; i++) addCell(lat + (r() - 0.5) * (r() < 0.6 ? 1.4 : 9), lon + (r() - 0.5) * (r() < 0.6 ? 1.8 : 12), 1 + Math.floor(r() ** 3 * 4 * scale))
  }
  for (let i = 0; i < 24; i++) addCell(r() * 120 - 50, r() * 340 - 170, 1)
  const cells = [...cellCounts].sort((a, b) => b[1] - a[1])
  const funnel = { search: Math.round(sessions * 0.78), results: Math.round(sessions * 0.74), pass_open: Math.round(sessions * 0.41), lightbox_open: Math.round(sessions * 0.22), share_open: Math.round(shares * 1.2), share_action: Math.round(shares * 0.85) }
  const minsAgo = (m: number) => now - m * 60e3
  const weights = BROWSER_LANGS.reduce((a, l) => a + l[1], 0)
  // A language with no tab in a short range is not listed, as the database lists none: the tabs never outnumber the sessions.
  const browserTabs = BROWSER_LANGS.map(([l, w, f]) => [l, Math.round((sessions * 0.92 * w) / weights), f] as const).filter(([, n]) => n > 0)
  const out: AdminStats = {
    range,
    generatedAt: now,
    from: range === '24h' ? now - 86400e3 : series[0][0],
    dimTotals: {},
    maintLastAt: now - 20 * 60e3,
    cachedAt: now - 3 * 60e3,
    rolledThrough: new Date(now - 86400e3).toISOString().slice(0, 10),
    bucket: hourly ? 'hour' : 'day',
    totals: {
      session: sessions,
      view: Math.round(sessions * 1.02),
      search: searches,
      results: Math.round(searches * 0.96),
      results_final: Math.round(searches * 0.93),
      pass_open: Math.round(searches * 0.88),
      lightbox_open: Math.round(searches * 0.31),
      about_open: Math.round(sessions * 0.07),
      share_open: Math.round(shares * 1.6),
      share_action: shares,
      timelapse_open: lapses,
      timelapse_share: Math.round(lapses * 0.075),
      error: k(6),
      vitals: Math.round(sessions * 0.6),
    },
    recorded: { search: searches, session: sessions },
    funnel,
    series,
    top: {
      'search.label': places,
      'search.country': Object.entries(countries).sort((a, b) => b[1] - a[1]),
      'search.source': [['search', k(310)], ['example', k(96)], ['share_link', k(64)], ['near_me', k(41)], ['surprise', k(26)], ['deep_link', k(23)], ['pin', k(19)], ['retry', k(4)]],
      'search.cell': cells,
      'timelapse_open.from': [['results', Math.round(lapses * 0.68)], ['viewer', Math.round(lapses * 0.31)], ['link', Math.max(1, Math.round(lapses * 0.01))]],
      'timelapse_share.action': [['video', Math.round(lapses * 0.061)], ['link', Math.round(lapses * 0.014)]],
      'session.device': [['desktop', k(298)], ['phone', k(251)], ['tablet', k(19)]],
      'session.country': [['ca', k(150)], ['us', k(131)], ['gb', k(66)], ['de', k(31)], ['in', k(28)], ['jp', k(19)], ['au', k(15)], ['fr', k(12)]],
      'session.ref': [['t.co', k(140)], ['news.ycombinator.com', k(88)], ['reddit.com', k(41)], ['linkedin.com', k(17)], ['google.com', k(12)], ['bsky.app', k(9)]],
      'session.utm': [['newsletter / email / launch', k(21)], ['x / social', k(8)]],
      // Most tabs, not all: those from before the app sent its language have none.
      'session.lang': LANGS.map(([l, f]) => [l, Math.max(1, Math.round(sessions * 0.92 * f))] as [string, number]),
      // The same tabs' browsers, and how many of each searched.
      'session.browser_lang': browserTabs.map(([l, n]) => [l, n] as [string, number]).sort((a, b) => b[1] - a[1]),
      'session.browser_lang_searched': browserTabs.map(([l, n, f]) => [l, Math.round(n * f)] as [string, number]).sort((a, b) => b[1] - a[1]),
      'pass_open.sat': [['Sentinel-2C', k(120)], ['Landsat 9', k(77)], ['Sentinel-2B', k(70)], ['NOAA-20', k(52)], ['ISS (ZARYA)', k(44)], ['WorldView Legion 4', k(31)], ['Terra', k(22)], ['Sentinel-1C', k(18)]],
      'pass_open.verdict': [['imaged', k(288)], ['likely', k(96)], ['could', k(71)], ['overhead', k(48)]],
      'share_action.sat': [['Sentinel-2C', k(14)], ['Landsat 9', k(9)], ['ISS (ZARYA)', k(5)], ['NOAA-20', k(3)]],
      'share_action.action': [['copy_link', k(19)], ['x', k(12)], ['native', k(10)], ['save_png', k(6)], ['copy_image', k(3)]],
    },
    results: { n: Math.round(searches * 0.96), p50Ms: 2140, p90Ms: 4870, partial: Math.round(searches * 0.21), archiveFailed: k(3) },
    vitals: { n: Math.round(sessions * 0.6), lcp: 1840, inp: 136, cls: 0.012 },
    recentSearches: PLACES.slice(0, 12).map(([label, country, cell], i) => ({
      t: minsAgo(i * 7 + Math.floor(r() * 5)),
      label,
      country,
      cell,
      source: (['search', 'example', 'share_link', 'near_me', 'surprise', 'deep_link', 'pin'] as const)[i % 7],
      device: (['desktop', 'phone', 'desktop', 'tablet'] as const)[i % 4],
    })),
    recentErrors: [
      { t: minsAgo(42), where: 'phase', msg: 'The satellite catalog could not be loaded.' },
      { t: minsAgo(190), where: 'promise', msg: 'TypeError: Failed to fetch' },
      { t: minsAgo(611), where: 'window', msg: 'ResizeObserver loop completed with undelivered notifications.' },
    ],
  }
  for (const [k, rows] of Object.entries(out.top)) out.dimTotals[k] = Math.round(rows.reduce((a, r) => a + r[1], 0) * 1.08)
  // All 20 languages and every browser language are listed, so nothing of theirs is cut.
  for (const k of ['session.lang', 'session.browser_lang', 'session.browser_lang_searched']) out.dimTotals[k] = out.top[k].reduce((a, r) => a + r[1], 0)
  return out
}
