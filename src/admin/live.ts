/**
 * The activity chart with the live counts in it (admin_live's `hours`, 0024).
 *
 * The chart's series is computed hourly with the rest of the stats, so on its own the newest bar holds only what
 * happened before the top of the hour. The database also counts searches, shares and tabs as their events arrive, hour
 * by hour; this adds those hours to the bars they belong to, and adds a bar when the clock has moved past the last one.
 * A bar's sessions keep their meaning: tabs active in the hour in the hourly chart, tabs new that Eastern day in the
 * daily one (a tab counts once a day), which is why the database sends both.
 */
import type { AdminStats, LiveHour } from './api'
import { etParts } from './format'

type Row = AdminStats['series'][number]
const HOUR = 3600e3

/** The Eastern midnight that starts the day of `t` (a whole hour): back an hour at a time, so DST days come out right. */
function etDayStart(t: number): number {
  const day = etParts(t).d
  let s = t
  for (let i = 0; i < 25 && etParts(s - HOUR).d === day; i++) s -= HOUR
  return s
}

export function liveSeries(series: Row[], bucket: 'hour' | 'day', hours: LiveHour[] | null): Row[] {
  if (!hours?.length || !series.length) return series
  const out = series.map((r) => [...r] as Row)
  for (const [hour, searches, shares, tabs, active] of hours) {
    const start = bucket === 'hour' ? hour : etDayStart(hour)
    let row = out.findLast((r) => r[0] === start)
    if (!row) {
      const last = out[out.length - 1]
      if (start < last[0]) continue // before the chart's last bar and not one of its bars: not this range's to show
      // Past the last bar: the bars up to this one (hours in between had nothing counted).
      if (bucket === 'hour') for (let t = last[0] + HOUR; t <= start; t += HOUR) out.push([t, 0, 0, 0])
      else out.push([start, 0, 0, 0])
      row = out[out.length - 1]
    }
    row[1] += searches
    row[2] += shares
    row[3] += bucket === 'hour' ? active : tabs
  }
  return out
}
