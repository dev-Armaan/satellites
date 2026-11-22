/**
 * Time formatting for the results UI, always in the PLACE's time zone (not the viewer's).
 * Pure + cached Intl formatters, so it runs in tests and is cheap to call per row.
 *
 * Output is mixed case ("Sun 1 Nov"); mono labels uppercase it with CSS. Human dates never zero-pad
 * the day and carry no year (share cards add it); machine stamps stay ISO.
 *
 * The words (days, months, "ago", duration units) are the visitor's language: they come from the 'time' namespace
 * (src/i18n/en/time.ts), read at call time, so a cache or memo that keeps their output must be keyed by the locale.
 * This module computes the instant's local fields once (`localParts`, or `partsAtOffset` on the timeline's fast path)
 * and hands them to the message with the raw instant and zone; callers that need a piece of a date (the weekday, a
 * compact day) ask for it here (`fmtWeekdayShort`, `fmtDayCompact`, `fmtDayRange`) rather than taking a formatted
 * date apart, since another language orders and spaces its dates its own way. Clocks, zone abbreviations, the T−
 * countdown and ISO keys are international notation and stay as they are in every language.
 */
import enTime from '@/i18n/en/time'
import { msgs } from '@/i18n/runtime'

/**
 * One cached formatter per (call site, zone). Keys are fixed strings per call site, so a row render
 * never pays for JSON.stringify or a fresh Intl object.
 */
const cache = new Map<string, Intl.DateTimeFormat>()

function dtf(site: string, locale: string, timeZone: string, opts: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${site}|${timeZone}`
  let f = cache.get(key)
  if (!f) {
    try {
      f = new Intl.DateTimeFormat(locale, { ...opts, timeZone })
    } catch {
      // Unknown zone (should not happen with tz-lookup output): fall back to UTC rather than throw in render.
      f = new Intl.DateTimeFormat(locale, { ...opts, timeZone: 'UTC' })
    }
    cache.set(key, f)
  }
  return f
}

const PARTS_OPTS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
}
const ZONE_OPTS: Intl.DateTimeFormatOptions = { timeZoneName: 'short' }

/**
 * An instant's local fields at a zone, numbers only: what the 'time' messages get beside the instant and the zone, so a
 * translation that builds its label by hand has the day, month and weekday, and no English word to reach for.
 */
export interface DateFields {
  year: number
  month: number // 1..12
  day: number
  /** Day of the week, 0 = Sunday */
  dow: number
  hour: number
  minute: number
  second: number
}

export interface LocalParts extends DateFields {
  /**
   * English "Sun", the field's historical value, for callers that still assemble labels from it.
   * @deprecated Visible words come from the visitor's language: fmtWeekdayShort(ms, tz, p), fmtDayCompact(ms, tz, p).
   * Removed once no caller is left (the timeline's day marks).
   */
  weekday: string
  /**
   * English "Nov", the field's historical value.
   * @deprecated Visible words come from the visitor's language: fmtLocalDay(ms, tz, p), fmtDayMonth(ms, tz, p).
   */
  monthName: string
}

const pad2 = (n: number) => String(n).padStart(2, '0')

export function localParts(ms: number, timeZone: string): LocalParts {
  const parts = dtf('parts', 'en-GB', timeZone, PARTS_OPTS).formatToParts(ms)
  const get = (t: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === t)?.value ?? ''
  const year = Number(get('year'))
  const month = Number(get('month'))
  const day = Number(get('day'))
  return {
    year,
    month,
    day,
    dow: new Date(Date.UTC(year, month - 1, day)).getUTCDay(),
    weekday: get('weekday').slice(0, 3),
    monthName: MONTHS[month - 1] ?? '',
    hour: Number(get('hour')) % 24,
    minute: Number(get('minute')),
    second: Number(get('second')),
  }
}
// LocalParts' deprecated English `weekday` / `monthName` fields only; visible words come from the 'time' namespace.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** Local fields at a known UTC offset (minutes), without Intl: the same values as localParts. */
export function partsAtOffset(ms: number, offsetMin: number): LocalParts {
  const d = new Date(ms + offsetMin * 60_000)
  const month = d.getUTCMonth() + 1
  return {
    year: d.getUTCFullYear(),
    month,
    day: d.getUTCDate(),
    dow: d.getUTCDay(),
    weekday: WEEKDAYS_SHORT[d.getUTCDay()],
    monthName: MONTHS[month - 1],
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    second: d.getUTCSeconds(),
  }
}

/** Longest window `windowOffset` assumes holds at most one offset change. */
const ONE_CHANGE_MS = 40 * 86_400_000

/**
 * The zone's UTC offset across [t0, t1] as a cheap function, from a handful of Intl calls (PERF-03:
 * the timeline's 15-minute stepping made ~1,300 formatToParts calls per report). An offset is
 * piecewise constant and a window of a few weeks holds at most one change (DST), which is found by
 * bisection to the whole minute (transitions happen on whole minutes). Longer windows fall back to
 * asking Intl at every instant.
 */
export function windowOffset(t0: number, t1: number, timeZone: string): (ms: number) => number {
  if (t1 - t0 > ONE_CHANGE_MS) return (ms) => utcOffsetMin(ms, timeZone)
  const a = utcOffsetMin(t0, timeZone)
  const b = utcOffsetMin(t1, timeZone)
  if (a === b) return () => a
  // Minute indexes: offset(lo) = a, offset(hi) = b; narrow until hi is the first minute of `b`.
  let lo = Math.floor(t0 / 60_000)
  let hi = Math.ceil(t1 / 60_000)
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (utcOffsetMin(mid * 60_000, timeZone) === a) lo = mid
    else hi = mid
  }
  const change = hi * 60_000
  return (ms) => (ms < change ? a : b)
}

/** "UTC+9", "UTC−3", "UTC+5:30" (true minus sign) for an offset in minutes. */
export function utcLabel(offsetMin: number): string {
  if (!offsetMin) return 'UTC'
  const a = Math.abs(offsetMin)
  const h = Math.floor(a / 60)
  const m = a % 60
  return `UTC${offsetMin < 0 ? '−' : '+'}${h}${m ? `:${String(m).padStart(2, '0')}` : ''}`
}

/** Familiar fixed abbreviations (no daylight time) the en-US locale doesn't know. */
const FIXED_ABBR: Record<string, string> = {
  'Asia/Tokyo': 'JST',
  'Asia/Seoul': 'KST',
  'Asia/Kolkata': 'IST',
  'Asia/Calcutta': 'IST',
  'Asia/Hong_Kong': 'HKT',
  'Asia/Singapore': 'SGT',
  // Indonesia's three zones, as Indonesians write them (Bali and Makassar are WITA, Papua WIT; owner, 2026-11-19)
  'Asia/Jakarta': 'WIB',
  'Asia/Pontianak': 'WIB',
  'Asia/Makassar': 'WITA',
  'Asia/Jayapura': 'WIT',
  'Europe/Moscow': 'MSK',
  'Australia/Perth': 'AWST',
}
/** [standard, daylight] pairs by zone family and standard offset (minutes). */
const EUROPE: Record<number, [string, string]> = { 0: ['WET', 'WEST'], 60: ['CET', 'CEST'], 120: ['EET', 'EEST'] }
const BRITISH = new Set(['Europe/London', 'Europe/Belfast', 'Europe/Guernsey', 'Europe/Isle_of_Man', 'Europe/Jersey'])
const AUSTRALIA: Record<number, [string, string]> = { 600: ['AEST', 'AEDT'], 570: ['ACST', 'ACDT'], 480: ['AWST', 'AWST'] }

const stdOffsetCache = new Map<string, number>()
/** The zone's standard (non-daylight) UTC offset in the year of `ms`: the smaller of January's and July's. */
function standardOffsetMin(ms: number, timeZone: string): number {
  const year = new Date(ms).getUTCFullYear()
  const key = `${timeZone}|${year}`
  let v = stdOffsetCache.get(key)
  if (v === undefined) {
    v = Math.min(utcOffsetMin(Date.UTC(year, 0, 1), timeZone), utcOffsetMin(Date.UTC(year, 6, 1), timeZone))
    stdOffsetCache.set(key, v)
  }
  return v
}

/**
 * "EST", "EDT", "JST", "CET", "AEDT"… or "UTC+9" where there is no familiar abbreviation.
 * The en-US locale only knows North American names, so Europe, Australia and the big Asian zones
 * are mapped by hand from the real offset at that instant (DST-correct).
 */
export function zoneAbbr(ms: number, timeZone: string): string {
  const fixed = FIXED_ABBR[timeZone]
  if (fixed) return fixed
  if (timeZone.startsWith('Europe/') || timeZone.startsWith('Australia/') || timeZone === 'Arctic/Longyearbyen') {
    const std = standardOffsetMin(ms, timeZone)
    const dst = utcOffsetMin(ms, timeZone) > std ? 1 : 0
    if (BRITISH.has(timeZone)) return dst ? 'BST' : 'GMT'
    if (timeZone === 'Europe/Dublin') return dst ? 'IST' : 'GMT'
    const pair = (timeZone.startsWith('Australia/') ? AUSTRALIA : EUROPE)[std]
    if (pair) return pair[dst]
    return utcLabel(utcOffsetMin(ms, timeZone))
  }
  const name = dtf('zone', 'en-US', timeZone, ZONE_OPTS)
    .formatToParts(ms)
    .find((p) => p.type === 'timeZoneName')?.value
  if (!name) return 'UTC'
  if (name === 'GMT' || name === 'UTC') return 'UTC'
  // "GMT+9" / "GMT-3" / "GMT+5:30": recompute from the offset so the sign is a true minus.
  if (/^GMT[+-]/.test(name)) return utcLabel(utcOffsetMin(ms, timeZone))
  return name
}

/**
 * The zone as a place label: "America/Toronto" → "America/Toronto" (spaces for underscores), but
 * the ocean's nautical zones ("Etc/GMT+9", whose sign is inverted) read "UTC−9 · at sea".
 */
export function zoneLabel(ms: number, timeZone: string): string {
  if (timeZone.startsWith('Etc/')) return msgs(enTime).atSea(utcLabel(utcOffsetMin(ms, timeZone)))
  return timeZone.replace(/_/g, ' ')
}

/**
 * The zone as the place row names it: its name where the zone has an abbreviation of its own ("America/Toronto",
 * whose rows say EST), else the offset the pass rows print ("UTC+7"). A zone with no abbreviation is often a city
 * that stands for a whole region (tz-lookup gives Hanoi "Asia/Bangkok"), so its name would name another country;
 * the offset is what the rest of the page says.
 */
export function zoneName(ms: number, timeZone: string): string {
  return timeZone.startsWith('Etc/') || zoneHasAbbr(ms, timeZone) ? zoneLabel(ms, timeZone) : zoneAbbr(ms, timeZone)
}

/**
 * Whether the zone has an abbreviation of its own ("EST"), so its name and its abbreviation say different things. A
 * zone named by its offset ("UTC+7", "UTC−9 · at sea") already says what its abbreviation would: a label that gives
 * both says it once.
 */
export function zoneHasAbbr(ms: number, timeZone: string): boolean {
  return !timeZone.startsWith('Etc/') && !zoneAbbr(ms, timeZone).startsWith('UTC')
}

const clock = (p: DateFields, seconds: boolean) => `${pad2(p.hour)}:${pad2(p.minute)}${seconds ? `:${pad2(p.second)}` : ''}`

/** "11:21" or "11:21:13" at the place. */
export function fmtLocalTime(ms: number, timeZone: string, seconds = false): string {
  return clock(localParts(ms, timeZone), seconds)
}

/**
 * "Sun 1 Nov" at the place. `p` (the instant's local fields, from localParts or partsAtOffset) skips the Intl call
 * where the caller already has them (the timeline's day marks).
 */
export function fmtLocalDay(ms: number, timeZone: string, p: DateFields = localParts(ms, timeZone)): string {
  return msgs(enTime).day(ms, timeZone, p)
}

/** "Sun" at the place: the weekday alone (never cut it from fmtLocalDay: other languages order dates differently). */
export function fmtWeekdayShort(ms: number, timeZone: string, p: DateFields = localParts(ms, timeZone)): string {
  return msgs(enTime).weekdayShort(ms, timeZone, p)
}

/** "Su 1" at the place: the timeline's mid-width day label. */
export function fmtDayCompact(ms: number, timeZone: string, p: DateFields = localParts(ms, timeZone)): string {
  return msgs(enTime).dayCompact(ms, timeZone, p)
}

/** "Friday 6 November" at the place, for screen readers. */
export function fmtSpokenDay(ms: number, timeZone: string): string {
  return msgs(enTime).daySpoken(ms, timeZone, localParts(ms, timeZone))
}

/** "41 hours ago", "12 minutes ago", "3 days ago": fmtRelative spelled out for screen readers. */
export function spokenRelative(ms: number, now: number): string {
  return msgs(enTime).relativeSpoken(ms, now)
}

/** "29 Oct" at the place (no weekday, no zero pad). */
export function fmtDayMonth(ms: number, timeZone: string, p: DateFields = localParts(ms, timeZone)): string {
  return msgs(enTime).dayMonth(ms, timeZone, p)
}

/** "1 → 8 Nov" / "29 Oct → 5 Nov" at the place: the days from `startMs` to `endMs`, the shared month written once. */
export function fmtDayRange(startMs: number, endMs: number, timeZone: string): string {
  return msgs(enTime).dayRange(startMs, endMs, timeZone, localParts(startMs, timeZone), localParts(endMs, timeZone))
}

/** "Sun 1 Nov · 11:21 EST": the day in the visitor's language, then the clock and the zone (international notation). */
export function fmtLocalStamp(ms: number, timeZone: string, seconds = false): string {
  const p = localParts(ms, timeZone)
  return msgs(enTime).stamp(ms, timeZone, p, clock(p, seconds), zoneAbbr(ms, timeZone))
}

/** Local calendar date key "2026-11-01" (for day bucketing). */
export function localDateKey(ms: number, timeZone: string): string {
  const p = localParts(ms, timeZone)
  return `${p.year}-${pad2(p.month)}-${pad2(p.day)}`
}

/** UTC offset at an instant, in minutes (EST → -300). */
export function utcOffsetMin(ms: number, timeZone: string): number {
  const p = localParts(ms, timeZone)
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  return Math.round((asUtc - Math.floor(ms / 1000) * 1000) / 60_000)
}

/**
 * "just now", "12 min ago", "5 h ago", "2 days ago" (and "in 3 h" for the future).
 * Hours up to 48 so "yesterday evening" reads as "30 h ago", which is what an instrument would say.
 */
export function fmtRelative(ms: number, now: number): string {
  return msgs(enTime).relative(ms, now)
}

/** "T−00:42" / "T+01:05" relative to a reference instant (mm:ss, or h:mm:ss past an hour). */
export function fmtTMinus(ms: number, ref: number): string {
  const d = Math.round((ms - ref) / 1000)
  const sign = d < 0 ? '−' : '+'
  const a = Math.abs(d)
  const h = Math.floor(a / 3600)
  const m = Math.floor((a % 3600) / 60)
  const s = a % 60
  return `T${sign}${h ? `${h}:${pad2(m)}` : pad2(m)}:${pad2(s)}`
}

/** "38 s", "4 min 12 s", "1 h 02 min" */
export function fmtDuration(ms: number): string {
  const t = msgs(enTime)
  const s = Math.max(0, Math.round(ms / 1000))
  if (s < 60) return t.durationSeconds(s)
  const m = Math.floor(s / 60)
  if (m < 60) return t.durationMinutes(m, s % 60)
  return t.durationHours(Math.floor(m / 60), m % 60)
}
