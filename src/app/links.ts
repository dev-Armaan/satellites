/**
 * What the address bar asks for (and what a report writes there), and which pass a report opens on. Pure functions
 * (no store, no DOM), so the link rules are unit-tested (src/app/app.test.ts).
 *
 *   /?s=<shareId>                                       a shared pass (resolved by the controller)
 *   /?q=<lat>,<lon>&n=<label>[&p=<passId>]              a deep link straight to a report
 *   /?q=…&p=…&norad=<id>&t=<ms>[&sat=…&verdict=…]       share's fallback deep link (R2K5): opens that satellite's
 *                                                       pass nearest t, with the window re-centred on t when
 *                                                       t is older than the default window
 *   /place/<slug>[?p=<passId>]                          a place page (src/lib/placePage.ts): the place it was built for
 *
 * A link is data, the same whoever made it in whatever language: `n` is a curated place's ENGLISH name
 * (placeSearch), and each reader sees that place in their own language (linkPlaceIn).
 */
import { placeQuery, type PagePlace } from '@/lib/placePage'
import type { Place, Report } from '@/types'
import { CURATED_NAMES, curatedPlace, type CuratedId } from '@/ui/landing/places'

const DAY = 86_400_000

export interface RunOpts {
  now?: number
  selectPassId?: string
  selectNorad?: number
  selectNear?: number
  /** A shared geostationary image: the report holds that very frame (engine ReportOptions.geoItem) */
  geoItem?: { norad: number; collection: string; itemId: string }
}

/**
 * The geostationary image a share carries, if it is one: a recipient's report would otherwise hold that watcher's
 * NEWEST frame, not the one that was shared.
 */
export function sharedGeoItem(share: { norad?: number; capture?: { collection: string; itemId: string } }): RunOpts['geoItem'] {
  const c = share.capture
  if (!c || share.norad === undefined || !/^(gibs-(goes-east|goes-west|himawari)|eumetsat-meteosat-)/.test(c.collection)) return undefined
  return { norad: share.norad, collection: c.collection, itemId: c.itemId }
}

export type UrlTarget = { kind: 'share'; id: string } | { kind: 'q'; place: Place; opts: RunOpts }

/**
 * The report options that open `norad`'s pass nearest `t`: the window ends now, or, when t is older than six
 * days (it would sit at or past the window's start), is centred on t. Shared by /s/ links and fallback links.
 */
export function passLinkOpts(t: number, norad: number | undefined, now: number = Date.now()): RunOpts {
  return { now: now - t > 6 * DAY ? t + 3.5 * DAY : now, selectNorad: norad, selectNear: t }
}

/** A positive integer from a query value, else undefined ("", "1.5", "-3", "1e3x" are all invalid). */
function positiveInt(v: string | null): number | undefined {
  if (v === null || !/^\d+$/.test(v.trim())) return undefined
  const n = Number(v)
  return Number.isSafeInteger(n) && n > 0 ? n : undefined
}

/**
 * What `search` (location.search) asks for; null for the landing. `page` is the place of the place page the address
 * is on, if it is one: it opens when the search names nothing else.
 */
export function readUrlTarget(search: string, now: number = Date.now(), page?: PagePlace): UrlTarget | null {
  const params = new URLSearchParams(search)
  if (params.has('sandbox')) return null
  const shareId = params.get('s')
  if (shareId) return { kind: 'share', id: shareId }
  const q = params.get('q')
  if (!q) {
    if (!page) return null
    // The page says more than a link can: where the place is, as the search box would have named it.
    const place: Place = { label: page.label, sublabel: page.sublabel, lat: page.lat, lon: page.lon, countryCode: page.cc, source: 'url' }
    return { kind: 'q', place, opts: { selectPassId: params.get('p') ?? undefined } }
  }
  const [lat, lon] = q.split(',').map(Number)
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null
  const label = params.get('n') || `${lat.toFixed(3)}, ${lon.toFixed(3)}`
  const place: Place = { label, lat, lon, source: 'url' }
  // A fallback share link carries its pass (norad + closest-approach time): the pass id alone may not match
  // in a window computed later or for the rounded spot. The other pass keys (sat, verdict, …) are for unfurls.
  const t = positiveInt(params.get('t'))
  const norad = positiveInt(params.get('norad'))
  if (t !== undefined && norad !== undefined) return { kind: 'q', place, opts: passLinkOpts(t, norad, now) }
  return { kind: 'q', place, opts: { selectPassId: params.get('p') ?? undefined } }
}

/**
 * The query a report writes on the address bar (src/lib/placePage.ts placeQuery, where a place page's own address is
 * decided too): rounded coordinates, and a curated place shown in another language named by its English label
 * (canonicalLabel), as it always was, so a link never carries its sender's language.
 */
export const placeSearch: (place: Place, passId?: string) => string = placeQuery

/** English label → curated id (labels are unique: the landing's tests hold them to it). Built on first use. */
let curatedByLabel: Map<string, CuratedId> | undefined

/**
 * A deep link's place as its reader sees it. A link to a curated place (an example chip or a Surprise me pick: its
 * English name, at its spot to the link's 3 decimals) shows that place's name from `names`, the 'places' namespace in
 * the reader's language (msgs(enPlaces)), and keeps the English one as canonicalLabel for the usage stats and the next
 * address-bar write. Nothing else about it changes (source 'url', no sublabel, as a link has always opened), so the
 * stats record the same search in every language. Any other link, and every link in English, is returned as it is.
 */
export function linkPlaceIn(place: Place, names: Readonly<Record<CuratedId, { label: string }>>): Place {
  curatedByLabel ??= new Map(Object.entries(CURATED_NAMES).map(([id, n]) => [n.label, id as CuratedId]))
  const id = place.source === 'url' ? curatedByLabel.get(place.label) : undefined
  if (!id) return place
  const spot = curatedPlace(id)
  const same = (a: number, b: number) => a.toFixed(3) === b.toFixed(3)
  // A translation that lacks the place (a stale bundle) shows the English name.
  const label = names[id]?.label
  if (!same(spot.lat, place.lat) || !same(spot.lon, place.lon) || !label || label === place.label) return place
  return { ...place, label, canonicalLabel: place.label }
}

/** The pass a report opens on: the named pass if it is in the report, else `selectNorad`'s pass nearest `selectNear`. */
export function pickPreselect(report: Pick<Report, 'passes' | 'windowEnd'>, opts: RunOpts): string | undefined {
  if (opts.selectPassId && report.passes.some((p) => p.id === opts.selectPassId)) return opts.selectPassId
  if (opts.selectNorad !== undefined) {
    const near = opts.selectNear ?? report.windowEnd
    let best: { id: string; d: number } | undefined
    for (const p of report.passes) {
      if (p.norad !== opts.selectNorad) continue
      const d = Math.abs(p.tClosest - near)
      if (!best || d < best.d) best = { id: p.id, d }
    }
    if (best) return best.id
  }
  return undefined
}
