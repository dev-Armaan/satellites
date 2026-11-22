/**
 * time.ts's words now come from the 'time' namespace (src/i18n/en/time.ts). These tests hold the English to what the
 * module printed before (the old implementations are kept below as the baseline, swept over instants and zones), check
 * the raw-value functions that replace taking a formatted date apart, and that every word follows the language.
 */
import { afterEach, describe, expect, it } from 'vitest'
import enTime from '@/i18n/en/time'
import { setBundleForTests } from '@/i18n/runtime'
import {
  fmtDayCompact,
  fmtDayMonth,
  fmtDayRange,
  fmtDuration,
  fmtLocalDay,
  fmtLocalStamp,
  fmtLocalTime,
  fmtRelative,
  fmtSpokenDay,
  fmtWeekdayShort,
  localParts,
  partsAtOffset,
  spokenRelative,
  utcOffsetMin,
  zoneAbbr,
  zoneLabel,
  zoneHasAbbr,
  zoneName,
} from './time'

// ── The English baseline: what time.ts printed before the catalog ──────────────────────────
const WEEKDAYS: Record<string, string> = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' }
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const pad2 = (n: number) => String(n).padStart(2, '0')
const oldDay = (ms: number, tz: string) => {
  const p = localParts(ms, tz)
  return `${p.weekday} ${p.day} ${p.monthName}`
}
const oldDayMonth = (ms: number, tz: string) => {
  const p = localParts(ms, tz)
  return `${p.day} ${p.monthName}`
}
const oldSpokenDay = (ms: number, tz: string) => {
  const p = localParts(ms, tz)
  return `${WEEKDAYS[p.weekday] ?? p.weekday} ${p.day} ${MONTHS_LONG[p.month - 1] ?? ''}`
}
function oldRelative(ms: number, now: number): string {
  const diff = now - ms
  const future = diff < 0
  const s = Math.abs(diff) / 1000
  let out: string
  if (s < 45) return 'just now'
  if (s < 3600) out = `${Math.max(1, Math.round(s / 60))} min`
  else if (s < 48 * 3600) out = `${Math.round(s / 3600)} h`
  else {
    const d = Math.round(s / 86_400)
    out = `${d} ${d === 1 ? 'day' : 'days'}`
  }
  return future ? `in ${out}` : `${out} ago`
}
const oldSpokenRelative = (ms: number, now: number) =>
  oldRelative(ms, now)
    .replace(/(\d+) min\b/, (_, n) => `${n} ${n === '1' ? 'minute' : 'minutes'}`)
    .replace(/(\d+) h\b/, (_, n) => `${n} ${n === '1' ? 'hour' : 'hours'}`)
function oldDuration(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000))
  if (s < 60) return `${s} s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} min ${pad2(s % 60)} s`
  return `${Math.floor(m / 60)} h ${pad2(m % 60)} min`
}
/** Headers.tsx windowText's range, as it parsed fmtDayMonth back. */
const oldRange = (a: number, b: number, tz: string) => {
  const [da, ma] = oldDayMonth(a, tz).split(' ')
  const [db, mb] = oldDayMonth(b, tz).split(' ')
  return `${ma === mb ? da : `${da} ${ma}`} → ${db} ${mb}`
}

const ZONES = ['America/Toronto', 'Europe/Paris', 'Asia/Tokyo', 'Australia/Sydney', 'Pacific/Chatham', 'America/St_Johns', 'UTC', 'Etc/GMT+9']
const T0 = Date.UTC(2026, 9, 20, 3, 17, 41)
const INSTANTS = Array.from({ length: 60 }, (_, i) => T0 + i * 7.3 * 3_600_000 + i * 61_000)

describe('time words in English', () => {
  it('print dates exactly as before, in every zone', () => {
    for (const tz of ZONES)
      for (const t of INSTANTS) {
        expect(fmtLocalDay(t, tz)).toBe(oldDay(t, tz))
        expect(fmtDayMonth(t, tz)).toBe(oldDayMonth(t, tz))
        expect(fmtSpokenDay(t, tz)).toBe(oldSpokenDay(t, tz))
        expect(fmtLocalStamp(t, tz, true)).toBe(`${oldDay(t, tz)} · ${fmtLocalTime(t, tz, true)} ${zoneAbbr(t, tz)}`)
      }
  })

  it('say how long ago, compact and spoken, exactly as before', () => {
    const now = Date.UTC(2026, 10, 8, 12, 0, 0)
    const offsets = [0, 20e3, 44e3, 45e3, 89e3, 90e3, 61e3, 59 * 60e3, 3599e3, 3600e3, 5400e3, 47.4 * 3600e3, 48 * 3600e3, 3 * 86_400e3, 400 * 86_400e3]
    for (const d of offsets)
      for (const sign of [1, -1]) {
        expect(fmtRelative(now - sign * d, now)).toBe(oldRelative(now - sign * d, now))
        expect(spokenRelative(now - sign * d, now)).toBe(oldSpokenRelative(now - sign * d, now))
      }
    expect(spokenRelative(now - 60e3, now)).toBe('1 minute ago')
    expect(spokenRelative(now - 3600e3, now)).toBe('1 hour ago')
    expect(spokenRelative(now + 3 * 3600e3, now)).toBe('in 3 hours')
  })

  it('time durations exactly as before', () => {
    for (const ms of [0, 400, 38_400, 59_499, 59_500, 60_000, 252_000, 3_599_000, 3_600_000, 3_720_000, 26 * 3_600_000 + 5_000]) expect(fmtDuration(ms)).toBe(oldDuration(ms))
    expect(fmtDuration(3_720_000)).toBe('1 h 02 min')
  })

  it('names a zone at sea', () => {
    expect(zoneLabel(T0, 'Etc/GMT+9')).toBe('UTC−9 · at sea')
    expect(zoneLabel(T0, 'America/St_Johns')).toBe('America/St Johns')
  })

  it('names the place row\'s zone by its offset where it has no abbreviation, as the pass rows do', () => {
    // tz-lookup gives Hanoi Asia/Bangkok: the rows say UTC+7, and the place row must not name Thailand.
    expect(zoneName(T0, 'Asia/Bangkok')).toBe('UTC+7')
    expect(zoneName(T0, 'Asia/Bangkok')).toBe(zoneAbbr(T0, 'Asia/Bangkok'))
    expect(zoneName(T0, 'Asia/Kathmandu')).toBe('UTC+5:45')
    expect(zoneName(T0, 'America/Toronto')).toBe('America/Toronto')
    expect(zoneName(T0, 'Europe/Paris')).toBe('Europe/Paris')
    expect(zoneName(T0, 'Etc/GMT+9')).toBe('UTC−9 · at sea')
  })

  it('knows which zones have an abbreviation of their own (the timeline names the others once)', () => {
    expect(zoneHasAbbr(T0, 'America/Toronto')).toBe(true)
    expect(zoneHasAbbr(T0, 'Europe/Paris')).toBe(true)
    expect(zoneHasAbbr(T0, 'Asia/Bangkok')).toBe(false)
    expect(zoneHasAbbr(T0, 'Etc/GMT+9')).toBe(false)
  })
})

describe('pieces of a date, without taking one apart', () => {
  it('gives the weekday, the compact day and a day range as the old parse-backs did', () => {
    for (const tz of ZONES)
      for (const t of INSTANTS) {
        const day = oldDay(t, tz)
        const p = localParts(t, tz)
        expect(fmtWeekdayShort(t, tz)).toBe(day.slice(0, 3))
        expect(fmtDayCompact(t, tz)).toBe(`${day.slice(0, 2)} ${Number(day.split(' ')[1])}`)
        expect(fmtDayRange(t - 7 * 86_400_000, t, tz)).toBe(oldRange(t - 7 * 86_400_000, t, tz))
        expect(p.dow).toBe(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday))
        // The timeline's fast path (fields at a known offset) prints the same day.
        expect(fmtLocalDay(t, tz, partsAtOffset(t, utcOffsetMin(t, tz)))).toBe(day)
      }
    expect(fmtDayRange(Date.UTC(2026, 10, 1, 12), Date.UTC(2026, 10, 8, 12), 'UTC')).toBe('1 → 8 Nov')
    expect(fmtDayRange(Date.UTC(2026, 9, 29, 12), Date.UTC(2026, 10, 5, 12), 'UTC')).toBe('29 Oct → 5 Nov')
  })
})

describe('time words follow the language', () => {
  afterEach(() => setBundleForTests('en', null))

  it('reads the active language at call time, with the raw instant, zone and local fields', () => {
    const seen: unknown[] = []
    setBundleForTests('de', {
      time: {
        ...enTime,
        day: (ms: number, tz: string, p: { day: number; month: number; dow: number }) => (seen.push([ms, tz, p.day, p.month, p.dow]), `${p.day}.${p.month}.`),
        stamp: (ms: number, tz: string, p: { day: number; month: number }, time: string, zone: string) => (seen.push(['stamp', ms, tz]), `${p.day}.${p.month}., ${time} ${zone}`),
        relative: () => 'vor Kurzem',
        durationSeconds: (s: number) => `${s} Sek.`,
        atSea: (zone: string) => `${zone} · auf See`,
      },
    })
    const t = Date.UTC(2026, 10, 1, 16, 21, 13)
    expect(fmtLocalDay(t, 'America/Toronto')).toBe('1.11.')
    expect(seen).toEqual([[t, 'America/Toronto', 1, 11, 0]])
    // The stamp gets the instant itself (never the day already written), and the clock and zone as they are.
    expect(fmtLocalStamp(t, 'America/Toronto')).toBe('1.11., 11:21 EST')
    expect(fmtLocalStamp(t, 'America/Toronto', true)).toBe('1.11., 11:21:13 EST')
    expect(seen.slice(1)).toEqual([['stamp', t, 'America/Toronto'], ['stamp', t, 'America/Toronto']])
    expect(fmtRelative(t, t + 3_600_000)).toBe('vor Kurzem')
    expect(fmtDuration(38_000)).toBe('38 Sek.')
    expect(zoneLabel(t, 'Etc/GMT+9')).toBe('UTC−9 · auf See')
    // International notation stays: clocks and zone abbreviations.
    expect(fmtLocalTime(t, 'America/Toronto', true)).toBe('11:21:13')
    expect(zoneAbbr(t, 'America/Toronto')).toBe('EST')
    setBundleForTests('en', null)
    expect(fmtLocalDay(t, 'America/Toronto')).toBe('Sun 1 Nov')
  })
})
