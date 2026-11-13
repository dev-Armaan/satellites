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

/** What admin_live would say a few minutes after `stats` were computed. */
export function mockLive(stats: AdminStats, now = Date.now()): LiveCounts | null {
  if (stats.cachedAt == null) return null
  const mins = Math.max(0, (now - stats.cachedAt) / 60e3)
  return { range: stats.range, since: stats.cachedAt, at: now, search: Math.round(mins * 9), session: Math.round(mins * 7), share_action: Math.round(mins * 0.4) }
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
  const cells: [string, number][] = PLACES.map(([, , cell, c]) => [cell, k(c)])
  for (let i = 0; i < 160; i++) {
    const lat = Math.round((r() * 120 - 50) * 10) / 10
    const lon = Math.round((r() * 340 - 170) * 10) / 10
    cells.push([`${lat.toFixed(1)},${lon.toFixed(1)}`, 1 + Math.floor(r() ** 3 * 8)])
  }
  const funnel = { search: Math.round(sessions * 0.78), results: Math.round(sessions * 0.74), pass_open: Math.round(sessions * 0.41), lightbox_open: Math.round(sessions * 0.22), share_open: Math.round(shares * 1.2), share_action: Math.round(shares * 0.85) }
  const minsAgo = (m: number) => now - m * 60e3
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
  return out
}
