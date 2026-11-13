/**
 * Number and time formats for the admin page. Times are US Eastern (the owner's clock, EST/EDT handled by Intl).
 * A daily bucket starts at Eastern midnight (from 0016) or UTC midnight (before): Eastern midnight is 04:00 or 05:00 UTC
 * the same date, so either way the bucket's UTC date is the day it counts, and it is labelled by that.
 */

const INT = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

export const fmtInt = (n: number | null | undefined): string => (n == null || !Number.isFinite(n) ? '—' : INT.format(Math.round(n)))

export function fmtPct(f: number | null | undefined): string {
  if (f == null || !Number.isFinite(f)) return '—'
  const p = f * 100
  return `${p >= 10 || p === 0 ? Math.round(p) : p.toFixed(1)}%`
}

export const fmtSec = (ms: number | null | undefined): string => (ms == null || !Number.isFinite(ms) ? '—' : (ms / 1000).toFixed(2))

const pad = (n: number) => String(n).padStart(2, '0')

export const ADMIN_TZ = 'America/New_York'
const ET = new Intl.DateTimeFormat('en-US', { timeZone: ADMIN_TZ, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' })
/** Calendar fields of an instant on the admin clock (US Eastern). */
export function etParts(t: number): { y: number; mo: number; d: number; h: number; mi: number } {
  const v: Record<string, number> = {}
  for (const p of ET.formatToParts(new Date(t))) if (p.type !== 'literal') v[p.type] = Number(p.value)
  return { y: v.year, mo: v.month, d: v.day, h: v.hour % 24, mi: v.minute }
}
/** "EST" or "EDT" for an instant. */
export function etZone(t: number): string {
  const part = new Intl.DateTimeFormat('en-US', { timeZone: ADMIN_TZ, timeZoneName: 'short' }).formatToParts(new Date(t)).find((p) => p.type === 'timeZoneName')
  return part?.value ?? 'ET'
}

/** "NOV 08 14:00" (hour buckets) / "NOV 08" (days); `short` drops the date on hour ticks except at midnight. */
export function fmtBucket(t: number, bucket: 'hour' | 'day', short = false): string {
  if (bucket === 'day') {
    const d = new Date(t) // the day's own date, whether it began at Eastern or UTC midnight (see top)
    return `${MON[d.getUTCMonth()]} ${pad(d.getUTCDate())}`
  }
  const e = etParts(t)
  const day = `${MON[e.mo - 1]} ${pad(e.d)}`
  const hh = `${pad(e.h)}:00`
  if (short) return e.h === 0 ? day : hh
  return `${day} ${hh}`
}

export function fmtAgo(t: number, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - t) / 1000))
  if (s < 60) return `${s} S AGO`
  const m = Math.round(s / 60)
  if (m < 60) return `${m} MIN AGO`
  const h = Math.round(m / 60)
  if (h < 48) return `${h} H AGO`
  return `${Math.round(h / 24)} D AGO`
}

export function fmtStamp(t: number): string {
  const e = etParts(t)
  return `${e.y}-${pad(e.mo)}-${pad(e.d)} ${pad(e.h)}:${pad(e.mi)} ${etZone(t)}`
}

/** 1, 2, 2.5, 5 × 10^k at or above `v`. */
export function niceMax(v: number): number {
  if (v <= 1) return 1
  const p = 10 ** Math.floor(Math.log10(v))
  for (const m of [1, 2, 2.5, 5, 10]) if (v <= m * p) return m * p
  return 10 * p
}

let regions: Intl.DisplayNames | null | undefined
export function countryName(cc: string | undefined): string {
  if (!cc) return '—'
  try {
    regions ??= new Intl.DisplayNames(['en'], { type: 'region' })
    return regions.of(cc.toUpperCase()) ?? cc.toUpperCase()
  } catch {
    return cc.toUpperCase()
  }
}

export const SOURCE_NAMES: Record<string, string> = {
  search: 'Typed search',
  example: 'Example chip',
  surprise: 'Surprise me',
  near_me: 'Near me',
  pin: 'Dropped pin',
  deep_link: 'Deep link',
  share_link: 'Share link',
  retry: 'Retry',
}

export const ACTION_NAMES: Record<string, string> = {
  copy_link: 'Copy link',
  x: 'Post to X',
  native: 'System share',
  save_png: 'Save PNG',
  copy_image: 'Copy image',
}

/** Where a time-lapse was opened from, and how it was shared (0022's events). */
export const TIMELAPSE_FROM_NAMES: Record<string, string> = { results: 'Row under the photos', viewer: 'Photo viewer', link: 'A shared link' }
export const TIMELAPSE_ACTION_NAMES: Record<string, string> = { video: 'Video saved', link: 'Link shared' }

export const DEVICE_NAMES: Record<string, string> = { desktop: 'Desktop', phone: 'Phone', tablet: 'Tablet' }

export const VERDICT_NAMES: Record<string, string> = { imaged: 'Watched', likely: 'Likely watched', could: 'Could have pointed here', overhead: 'Passed overhead' }

/** How old the cached stats are: 'UPDATED JUST NOW' under a minute, else 'UPDATED 3 MIN AGO' (fmtAgo). */
export function fmtUpdated(cachedAt: number, now = Date.now()): string {
  return now - cachedAt < 60e3 ? 'UPDATED JUST NOW' : `UPDATED ${fmtAgo(cachedAt, now)}`
}

/** The hourly maintenance cron job hasn't run for over 2 hours (or never has). */
export function maintBehind(s: { maintLastAt: number | null; generatedAt: number }): boolean {
  return s.maintLastAt == null || s.generatedAt - s.maintLastAt > 2 * 3600e3
}
