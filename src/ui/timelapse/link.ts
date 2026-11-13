/**
 * The link a time-lapse is shared by: the place link (`/?q=…&n=…`, which computes the week for whoever opens it)
 * plus `tl`, which opens the time-lapse over the results. Nothing is stored. Coordinates are rounded to ~1 km like
 * every share (ui/share/links.ts).
 */
import type { TimelapseMode } from '@/imagery/timelapse'
import { roundedPlace, SHARE_DECIMALS } from '@/ui/share/links'

export function timelapseLink(origin: string, place: { label: string; lat: number; lon: number }, mode: TimelapseMode): string {
  const r = roundedPlace(place.lat, place.lon)
  const p = new URLSearchParams()
  p.set('q', `${r.lat.toFixed(SHARE_DECIMALS)},${r.lon.toFixed(SHARE_DECIMALS)}`)
  p.set('n', place.label)
  p.set('tl', mode)
  return `${origin}/?${p.toString()}`
}
