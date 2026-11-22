/**
 * Shares on the server: fetch one through the `get_share` RPC, or build one from explicit query
 * parameters, and turn it into the copy the card and share page print.
 *
 * Everything that arrives here is untrusted (the RPC output was user input once; query params
 * are anyone's). Each field is re-validated and clamped before it reaches a renderer.
 *
 * The copy is in the language the caller names (a link's `l=`, read by api/s.ts and api/og.tsx; English by default):
 * whole sentences from the card catalog (cardMessages(locale), api/_lib/i18n/card/), with the names inserted as
 * they were stored. What is stored and what links carry never depends on a language.
 */
import tzlookup from '@photostructure/tz-lookup'
import {
  cloudWords,
  headText,
  localClock,
  passHeadline,
  photosSentence,
  summaryHeadline,
  zoneAbbr,
  lookOfCode,
  type CardInput,
  type SummaryInput,
  type SummaryLook,
} from './cardSpec.js'
import { supabaseConfig } from './env.js'
import { cardMessages, type CardWhen } from './i18n/card/index.js'
// Every language's card copy for the server's cards and pages (the app never imports this module).
import './i18n/card/server.js'
import { DEFAULT_LOCALE, LOCALE_INFO, isLocale, type Locale } from './i18n/locales.js'
import type { Rich } from './i18n/parts.js'

export type Verdict = 'imaged' | 'likely' | 'could' | 'overhead'

export const CAPTURE_COLLECTIONS = [
  'sentinel-2-l2a',
  'landsat-c2-l2',
  'gibs-viirs-noaa20',
  'gibs-viirs-noaa21',
  'gibs-viirs-snpp',
  'gibs-modis-terra',
  'gibs-modis-aqua',
  'gibs-goes-east',
  'gibs-goes-west',
  'gibs-himawari',
  // Sentinel-1 radar (migration 0012 lets create_share keep it)
  'sentinel-1-rtc',
  // The Meteosats' frames, from EUMETSAT (migration 0014 lets create_share keep them)
  'eumetsat-meteosat-0deg',
  'eumetsat-meteosat-iodc',
] as const
export type CaptureCollection = (typeof CAPTURE_COLLECTIONS)[number]

export interface ShareCapture {
  collection: CaptureCollection
  itemId: string
  provider?: 'earth-search' | 'planetary-computer' | 'gibs' | 'eumetsat'
  platform?: string
  datetime?: number
  cloudCoverPct?: number
  /** Cloud class of the pixel at the place, if the share stored it (see isCloudedCapture). */
  spot?: SpotCloud
  gsdM?: number
}

const SPOT_CLOUD = ['clear', 'cirrus', 'cloud', 'shadow', 'unknown'] as const
type SpotCloud = (typeof SPOT_CLOUD)[number]

/** The subset of a Pass the card uses (the stored pass has a few more fields). Ranges match create_share. */
export interface SharePass {
  norad?: number
  tClosest?: number
  groundDistanceKm?: number
  offNadirDeg?: number
  elevationDeg?: number
  azimuthDeg?: number
  altitudeKm?: number
  groundSpeedKmS?: number
  headingDeg?: number
  node?: 'ascending' | 'descending'
  sunElevationDeg?: number
  inSwath?: boolean
  verdict?: Verdict
  /** N: the satellites that watched the place that week (create_share keeps it since 0003; older shares lack it) */
  weekSatellites?: number
}

/** A share, normalised. Times are epoch ms. */
export interface ShareRecord {
  id?: string
  placeLabel: string
  lat: number
  lon: number
  norad?: number
  satName?: string
  verdict: Verdict
  tClosest?: number
  capture?: ShareCapture
  pass: SharePass
  /** N for the card's headline ("7 satellites watched Waterloo."), when the share carries it */
  satellites?: number
}

export const SHARE_ID_RE = /^[0-9a-z]{8}$/
const ITEM_ID_RE = /^[A-Za-z0-9_.:@-]{1,160}$/
const VERDICTS: readonly Verdict[] = ['imaged', 'likely', 'could', 'overhead']

// ── Validation primitives ───────────────────────────────────────────────────────────────────

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)

/** A finite number within [min, max], or undefined. Accepts numeric strings (query params). */
export function num(v: unknown, min = -Infinity, max = Infinity): number | undefined {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v
  return typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max ? n : undefined
}

/**
 * Trimmed single-line text, at most `max` characters (code points, so a surrogate pair is never
 * split), or undefined. Drops control characters and the invisible bidi / zero-width format
 * characters that could reorder or hide text on the card and share page (as clean_text in SQL).
 */
export function text(v: unknown, max: number): string | undefined {
  if (typeof v !== 'string') return undefined
  const t = v
    .replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁠-⁩﻿]/g, '')
    .replace(/\s+/g, ' ') // \s includes U+2028 / U+2029
    .trim()
  if (!t) return undefined
  const cps = Array.from(t)
  return cps.length > max ? `${cps.slice(0, max - 1).join('').trimEnd()}…` : t
}

const verdictOf = (v: unknown): Verdict | undefined => (VERDICTS as readonly unknown[]).includes(v) ? (v as Verdict) : undefined

export function captureOf(v: unknown): ShareCapture | undefined {
  if (!isObj(v)) return undefined
  const collection = (CAPTURE_COLLECTIONS as readonly unknown[]).includes(v.collection) ? (v.collection as CaptureCollection) : undefined
  const itemId = typeof v.itemId === 'string' && ITEM_ID_RE.test(v.itemId) ? v.itemId : undefined
  if (!collection || !itemId) return undefined
  const provider = v.provider === 'earth-search' || v.provider === 'planetary-computer' || v.provider === 'gibs' || v.provider === 'eumetsat' ? v.provider : undefined
  return {
    collection,
    itemId,
    provider,
    platform: text(v.platform, 40),
    datetime: num(v.datetime, 0, 8.64e15),
    cloudCoverPct: num(v.cloudCoverPct, 0, 100),
    spot: (SPOT_CLOUD as readonly unknown[]).includes(v.spot) ? (v.spot as SpotCloud) : undefined,
    gsdM: num(v.gsdM, 0.1, 100_000),
  }
}

function passOf(v: unknown): SharePass {
  if (!isObj(v)) return {}
  return {
    norad: num(v.norad, 1, 999_999_999),
    tClosest: num(v.tClosest, 0, 8.64e15),
    groundDistanceKm: num(v.groundDistanceKm, 0, 20_100),
    offNadirDeg: num(v.offNadirDeg, 0, 90),
    elevationDeg: num(v.elevationDeg, -90, 90),
    azimuthDeg: num(v.azimuthDeg, 0, 360),
    altitudeKm: num(v.altitudeKm, 100, 400_000),
    groundSpeedKmS: num(v.groundSpeedKmS, 0, 12),
    headingDeg: num(v.headingDeg, 0, 360),
    node: v.node === 'ascending' || v.node === 'descending' ? v.node : undefined,
    sunElevationDeg: num(v.sunElevationDeg, -90, 90),
    inSwath: typeof v.inSwath === 'boolean' ? v.inSwath : undefined,
    verdict: verdictOf(v.verdict),
    weekSatellites: whole(num(v.weekSatellites, 1, 100_000)),
  }
}

/** A count: rounded, or undefined. */
function whole(n: number | undefined): number | undefined {
  return n === undefined ? undefined : Math.round(n)
}

/** Normalise the `get_share` RPC's JSON. Null if it isn't a usable share. */
export function shareFromRpc(v: unknown): ShareRecord | null {
  if (!isObj(v)) return null
  const placeLabel = text(v.placeLabel, 120)
  const lat = num(v.lat, -90, 90)
  const lon = num(v.lon, -180, 180)
  const pass = passOf(v.pass)
  const verdict = verdictOf(v.verdict) ?? pass.verdict
  if (!placeLabel || lat === undefined || lon === undefined || !verdict) return null
  return {
    id: typeof v.id === 'string' && SHARE_ID_RE.test(v.id) ? v.id : undefined,
    placeLabel,
    lat,
    lon,
    norad: num(v.norad, 1, 999_999_999) ?? pass.norad,
    satName: text(v.satName, 80),
    verdict,
    tClosest: num(v.tClosest, 0, 8.64e15) ?? pass.tClosest,
    capture: captureOf(v.capture),
    pass,
    satellites: pass.weekSatellites,
  }
}

/**
 * Explicit-parameter fallback, for a card without a stored share:
 *   /api/og?sat=Sentinel-2C&norad=60989&place=Waterloo&lat=43.47&lon=-80.54&t=<ms|ISO>
 *          &verdict=imaged&alt=786&off=0.9&cloud=25&dist=12&az=271&hdg=194
 *          &collection=sentinel-2-l2a&item=<STAC item id>&gsd=10&spot=clear&sv=7
 * (`sv`: N, the satellites that watched the place that week, for the "7 satellites watched Waterloo." headline)
 * Null unless at least place, lat, lon and verdict are valid.
 */
export function shareFromParams(q: URLSearchParams): ShareRecord | null {
  const placeLabel = text(q.get('place'), 120)
  const lat = num(q.get('lat'), -90, 90)
  const lon = num(q.get('lon'), -180, 180)
  const verdict = verdictOf(q.get('verdict')) ?? (q.get('item') ? 'imaged' : undefined)
  if (!placeLabel || lat === undefined || lon === undefined || !verdict) return null
  const tRaw = q.get('t')
  const tClosest = tRaw ? (num(tRaw, 0, 8.64e15) ?? (Number.isFinite(Date.parse(tRaw)) ? Date.parse(tRaw) : undefined)) : undefined
  const norad = num(q.get('norad'), 1, 999_999_999)
  const satellites = whole(num(q.get('sv'), 1, 100_000))
  const capture = captureOf({
    collection: q.get('collection') ?? (q.get('item') ? 'sentinel-2-l2a' : undefined),
    itemId: q.get('item'),
    datetime: tClosest,
    cloudCoverPct: q.get('cloud'),
    gsdM: q.get('gsd'),
    spot: q.get('spot'), // validated against the five classes by captureOf
  })
  return {
    placeLabel,
    // Same coarsening as create_share, so a hand-built URL can't carry a more precise spot.
    lat: Math.round(lat * 100) / 100,
    lon: Math.round(lon * 100) / 100,
    norad: norad !== undefined ? Math.trunc(norad) : undefined,
    satName: text(q.get('sat'), 80),
    verdict,
    tClosest,
    capture,
    satellites,
    pass: {
      norad,
      tClosest,
      altitudeKm: num(q.get('alt'), 100, 400_000),
      offNadirDeg: num(q.get('off'), 0, 90),
      groundDistanceKm: num(q.get('dist'), 0, 20_100),
      azimuthDeg: num(q.get('az'), 0, 360),
      headingDeg: num(q.get('hdg'), 0, 360),
      elevationDeg: num(q.get('el'), -90, 90),
      groundSpeedKmS: num(q.get('spd'), 0, 12),
      verdict,
    },
  }
}

/** The pass keys a fallback deep link carries (src/ui/share/links.ts DEEP_LINK_PASS_KEYS). */
export const DEEP_LINK_PASS_KEYS = ['sat', 'norad', 'verdict', 't', 'alt', 'off', 'hdg', 'collection', 'item', 'cloud', 'gsd', 'spot', 'sv'] as const
/** The rest of what shareFromParams reads for a card drawn from its address alone. */
const CARD_PLACE_KEYS = ['place', 'lat', 'lon', 'dist', 'az', 'el', 'spd'] as const

/**
 * A pass from the app's fallback deep link (share R2SH2): the place link `/?q=lat,lon&n=label&p=passId`
 * plus the pass's own facts (DEEP_LINK_PASS_KEYS). Coordinates are coarsened to 0.01° and the label is
 * screened as placeFromParams does. Null unless the link names a verdict and a satellite (norad).
 */
export function shareFromDeepLink(q: URLSearchParams): ShareRecord | null {
  if (!verdictOf(q.get('verdict')) || num(q.get('norad'), 1, 999_999_999) === undefined) return null
  const place = placeFromParams(q)
  if (!place) return null
  const p = new URLSearchParams({ place: place.label, lat: place.lat.toFixed(2), lon: place.lon.toFixed(2) })
  for (const k of DEEP_LINK_PASS_KEYS) {
    const v = q.get(k)
    if (v !== null) p.set(k, v)
  }
  return shareFromParams(p)
}

// ── Language ────────────────────────────────────────────────────────────────────────────────

/**
 * The language a link names (`l=<locale>`: the sharer's, written by the app only when it isn't English), when we
 * speak it; English otherwise. It chooses the card's and the share page's words, never what the app shows the reader.
 */
export function linkLocale(q: URLSearchParams): Locale {
  const l = q.get('l')
  return isLocale(l) ? l : DEFAULT_LOCALE
}

/**
 * The language satori can draw a card in: the link's, or English for a right-to-left one (it shapes Arabic but has
 * no bidirectional layout; see the top of api/og.tsx). The one place that decides it.
 */
export const cardLocale = (locale: Locale): Locale => (LOCALE_INFO[locale].dir === 'rtl' ? DEFAULT_LOCALE : locale)

// ── The card's cache key ────────────────────────────────────────────────────────────────────

/**
 * Bump when the card design changes so unfurler caches (which key on the URL) refetch.
 * 4 (round 3): "watched" vocabulary on pass cards, the summary card's N / K headline (R3-13).
 * 5: no verdict row or coordinates; pass cards lead with the week's N ("7 satellites watched Waterloo.", owner).
 */
export const CARD_VERSION = '5'

/**
 * The query a card (GET /api/og) is kept under in Cloudflare's cache (worker/router.ts `cached`): what the card is
 * drawn from, in one order, and nothing else.
 *  - a stored share: its id (the handler reads nothing else of the address);
 *  - any other card: the parameters shareFromParams, placeFromParams and summaryFromParams read, sorted;
 *  - the language the card is drawn in (cardLocale: a right-to-left link's card is the English one), English unnamed;
 *  - the card version, only when it is the current one: any other `v` is the same picture as none.
 * Keyed on the whole address, each unknown parameter was a new card: `?id=…&x=1`, `&x=2`, … drew one share's card
 * again each time and asked its archive for the photo again, which for a Meteosat frame is EUMETSAT's map service.
 */
export function cardCacheQuery(q: URLSearchParams): string {
  const out = new URLSearchParams()
  const id = q.get('id')
  if (id !== null) out.set('id', id)
  else {
    for (const k of [...new Set<string>(['kind', 'q', 'n', ...CARD_PLACE_KEYS, ...DEEP_LINK_PASS_KEYS, ...SUMMARY_KEYS])].sort()) {
      const v = q.get(k)
      if (v !== null) out.set(k, v)
    }
  }
  const locale = cardLocale(linkLocale(q))
  if (locale !== DEFAULT_LOCALE) out.set('l', locale)
  if (q.get('v') === CARD_VERSION) out.set('v', CARD_VERSION)
  return out.toString()
}

// ── Places (address-bar links: /?q=lat,lon&n=label) ─────────────────────────────────────────

export interface SharedPlace {
  label: string
  /** Rounded to 2 decimals (≈ 1 km), whatever precision the link carried */
  lat: number
  lon: number
}

/**
 * A place from an address-bar link (`q=43.4723,-80.5449&n=Waterloo`) or explicit card params
 * (`place=…&lat=…&lon=…`). Coordinates are coarsened to 0.01° before anything prints them.
 * Null unless the coordinates are valid. The label falls back to the coordinates.
 */
export function placeFromParams(q: URLSearchParams): SharedPlace | null {
  let lat: number | undefined
  let lon: number | undefined
  const pair = q.get('q')
  if (pair) {
    const m = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/.exec(pair)
    if (m) {
      lat = num(m[1], -90, 90)
      lon = num(m[2], -180, 180)
    }
  } else {
    lat = num(q.get('lat'), -90, 90)
    lon = num(q.get('lon'), -180, 180)
  }
  if (lat === undefined || lon === undefined) return null
  const r = { lat: Math.round(lat * 100) / 100, lon: Math.round(lon * 100) / 100 }
  // A label that names a street address or exact coordinates is not printed (as cityLevelLabel in the app).
  const raw = text(q.get('n') ?? q.get('place'), 80)
  const label = raw && !/\d/.test(raw) ? raw : `${Math.abs(r.lat).toFixed(2)}°${r.lat >= 0 ? 'N' : 'S'} ${Math.abs(r.lon).toFixed(2)}°${r.lon >= 0 ? 'E' : 'W'}`
  return { label, ...r }
}

// ── Summary links (share SH6): the week at a place, carried in the link itself ─────────────

/** Summary params a summary link carries next to q / n (nothing is stored server-side). */
export const SUMMARY_KEYS = ['sv', 'sc', 'sw', 'sa', 'sp', 'bc', 'bi', 'bs', 'bt', 'bg', 'bw'] as const

/**
 * A summary from a link: `sv` the satellites that watched the place (N: any pass, geostationary excluded),
 * `sc` the four verdict counts ("31,220,1544,66"; the first is K, the photos made public), `sw` the window
 * end (ms), `sa=1` the archives didn't answer, `sp=1` the archives were still answering (K is a floor), and
 * the gallery's first image: `bc` collection, `bi` item id, `bs` satellite name (absent when it has none: the card
 * then prints its own words for "a satellite"), `bt` time (ms), `bg` pixel size (m), `bw` why it leads when it is not
 * the closest look (`lc` last clear look, `co` clouded over, `ra` radar, `pl` none).
 * Null unless place, sv and sc are valid.
 */
export type LinkSummary = Omit<SummaryInput, 'host' | 'timeZone' | 'best'> & {
  place: SharedPlace
  best?: { satName?: string; tClosest?: number; capture: ShareCapture; look?: SummaryLook }
}

export function summaryFromParams(q: URLSearchParams): LinkSummary | null {
  const place = placeFromParams(q)
  const satellites = num(q.get('sv'), 0, 100_000)
  const counts = (q.get('sc') ?? '').split(',').map((v) => num(v, 0, 10_000_000))
  if (!place || satellites === undefined || counts.length !== 4 || counts.some((v) => v === undefined)) return null
  const [imaged, likely, could, overhead] = counts.map((v) => Math.round(v!))
  const capture = captureOf({ collection: q.get('bc'), itemId: q.get('bi'), gsdM: q.get('bg') })
  const satName = text(q.get('bs'), 40)
  const tClosest = num(q.get('bt'), 0, 8.64e15)
  const out: LinkSummary = {
    place,
    placeLabel: place.label,
    lat: place.lat,
    lon: place.lon,
    satellites: Math.round(satellites),
    counts: { imaged, likely, could, overhead },
    windowEnd: num(q.get('sw'), 0, 8.64e15),
    best: capture ? { ...(satName ? { satName } : {}), tClosest, capture, ...(lookOfCode(q.get('bw')) ? { look: lookOfCode(q.get('bw')) } : {}) } : undefined,
  }
  // Flags are present only when set, so a summary rebuilt from its link equals the one the app built.
  if (q.get('sa') === '1') out.archiveDown = true
  else if (q.get('sp') === '1') out.partial = true
  return out
}

/** Sentences of one paragraph, joined as the language joins them (a space; nothing in Chinese and Japanese). */
const sentences = (locale: Locale, ...parts: string[]) => parts.join(LOCALE_INFO[locale].sentenceGap)

/** "31 satellites watched Waterloo this week." (R3-13: the results headline's N, as the card and the post say it) */
export function summaryTitle(s: Pick<SummaryInput, 'satellites' | 'placeLabel'>, locale: Locale = DEFAULT_LOCALE): string {
  return summaryHeadline(s, locale)
}

/** "12 images were made public. The closest look is from Sentinel-2C. What watched you this week?" */
export function summaryDescription(s: Pick<SummaryInput, 'best' | 'counts' | 'placeLabel' | 'archiveDown' | 'partial'>, locale: Locale = DEFAULT_LOCALE): string {
  const m = cardMessages(locale)
  const look = s.best?.look ?? 'closest'
  const from = look === 'closest' ? m.bestFrom.closest : look === 'lastClear' ? m.bestFrom.lastClear : m.bestFrom.first
  const best = s.best ? [from(s.best.satName)] : []
  return sentences(locale, photosSentence(s.counts.imaged, s, locale), ...best, m.question)
}

/** The week's card described for its image alt: its title, then what the card shows. */
export function summaryAlt(s: Pick<SummaryInput, 'best' | 'satellites' | 'placeLabel'>, locale: Locale = DEFAULT_LOCALE): string {
  const m = cardMessages(locale)
  return sentences(locale, summaryTitle(s, locale), s.best ? m.cardAlt.withPhoto(s.best.satName) : m.cardAlt.plain)
}

/** "What watched Waterloo this week" */
export function placeTitle(p: SharedPlace, locale: Locale = DEFAULT_LOCALE): string {
  return cardMessages(locale).page.placeTitle(p.label)
}

export function placeDescription(p: SharedPlace, locale: Locale = DEFAULT_LOCALE): string {
  return cardMessages(locale).page.placeDescription(p.label)
}

// ── Fetch ───────────────────────────────────────────────────────────────────────────────────

export type FetchShareResult = { status: 'found'; share: ShareRecord } | { status: 'missing' } | { status: 'unavailable' }

/**
 * Read a share without counting a view (crawlers and the OG renderer aren't readers).
 * 'missing' = the database answered and there is no such share; 'unavailable' = we couldn't ask.
 */
export async function fetchShare(id: string, timeoutMs = 4000): Promise<FetchShareResult> {
  if (!SHARE_ID_RE.test(id)) return { status: 'missing' }
  const cfg = supabaseConfig()
  if (!cfg) return { status: 'unavailable' }
  try {
    const res = await fetch(`${cfg.url}/rest/v1/rpc/get_share`, {
      method: 'POST',
      headers: { apikey: cfg.key, authorization: `Bearer ${cfg.key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ p_id: id, p_view: false }),
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (!res.ok) return { status: 'unavailable' }
    const share = shareFromRpc(await res.json())
    return share ? { status: 'found', share } : { status: 'missing' }
  } catch {
    return { status: 'unavailable' }
  }
}

// ── Copy ────────────────────────────────────────────────────────────────────────────────────

/**
 * "Sentinel-2C", or "NORAD 60989" when the share didn't carry a name (NORAD ids read the same in every language), or
 * undefined when it carried neither: each sentence then says "a satellite" in its own words (the card catalog).
 */
export function satLabel(s: ShareRecord): string | undefined {
  return s.satName ?? (s.norad ? `NORAD ${s.norad}` : undefined)
}

/**
 * The headline as the card's rich parts (blocks in the language's order, the place as the accent), with the whole
 * place label (the card cuts it to 48 characters; the page title never does). With the week's N (owner):
 *   any      → "7 satellites watched | Waterloo."
 * Older shares without N, by verdict:
 *   imaged   → "Sentinel-2C watched | Waterloo."
 *   likely   → "Sentinel-2C swept over | Waterloo."
 *   could    → "WorldView Legion 4 passed within view of | Waterloo."
 *   overhead → "ISS (ZARYA) passed over | Waterloo."
 * A place already cut short with an ellipsis takes no full stop ("…" not "….").
 */
export function headlineParts(s: ShareRecord, locale: Locale = DEFAULT_LOCALE): Rich {
  return passHeadline(cardMessages(locale), s.verdict, satLabel(s), s.placeLabel, s.satellites)
}

/** The share page's title: the card's headline as one line ("7 satellites watched Waterloo."). */
export function headline(s: ShareRecord, locale: Locale = DEFAULT_LOCALE): string {
  return headText(headlineParts(s, locale), locale)
}

const pad = (n: number) => String(n).padStart(2, '0')

/** "2026-11-01 16:14:21 UTC" (machine stamp: the same in every language) */
export function fmtUtc(ms: number): string {
  const d = new Date(ms)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`
}

/**
 * When the moment happened: the satellite's closest approach to the place. Archive timestamps are not used:
 * Sentinel-2's STAC datetime is the start of the datatake, often minutes before the satellite was overhead.
 */
export function momentOf(s: ShareRecord): number | undefined {
  return s.tClosest ?? s.pass.tClosest ?? s.capture?.datetime
}

/** 194.6° → 4 (south): the 8-point compass for prose, 0 north, 1 northeast … 7 northwest (each language names them). */
export function compassPoint(deg: number): number {
  return Math.round((((deg % 360) + 360) % 360) / 45) % 8
}

/** The IANA zone at the share's place ("America/Toronto"), or UTC if the lookup fails. */
export function shareTimeZone(s: Pick<ShareRecord, 'lat' | 'lon'>): string {
  try {
    return tzlookup(s.lat, s.lon)
  } catch {
    return 'UTC'
  }
}

/** When the pass was closest, at the place: the instant and zone, and the clock and zone name the card prints. */
function whenOf(ms: number, timeZone: string): CardWhen {
  return { ms, timeZone, clock: localClock(ms, timeZone), zone: zoneAbbr(ms, timeZone) }
}

/**
 * og:description in the product voice (DESIGN §7), using only known numbers, ending on the
 * question that brings the reader in:
 * "Sentinel-2C crossed 795 km above Waterloo at 11:21 EST on Sun 1 Nov 2026, moving south.
 *  It was looking 5.3° off nadir. Cloud cover: 26%. What watched you this week?"
 */
export function description(s: ShareRecord, locale: Locale = DEFAULT_LOCALE): string {
  const m = cardMessages(locale)
  const p = s.pass
  const t = momentOf(s)
  const facts = {
    sat: satLabel(s),
    place: s.placeLabel,
    when: t !== undefined ? whenOf(t, shareTimeZone(s)) : undefined,
    heading: p.headingDeg !== undefined ? compassPoint(p.headingDeg) : undefined,
  }
  const parts: string[] = []
  if (s.verdict === 'could') {
    parts.push(m.withinView(facts), m.couldHave)
  } else {
    parts.push(m.crossed({ ...facts, verdict: s.verdict, altitudeKm: p.altitudeKm }))
    if (s.verdict === 'imaged' && p.offNadirDeg !== undefined) parts.push(p.offNadirDeg < 2 ? m.straightDown : m.offNadir(p.offNadirDeg))
    const pct = s.capture?.cloudCoverPct
    // The card's own words for a clouded picture (cloudWords), else the plain cloud cover.
    const words = s.verdict === 'imaged' ? cloudWords(pct, s.capture?.spot, locale) : undefined
    if (words) parts.push(words.desc)
    else if (s.verdict === 'imaged' && pct !== undefined) parts.push(m.cloudCover(Math.round(pct)))
    if (s.verdict === 'likely') parts.push(m.inSwath(s.placeLabel))
  }
  parts.push(m.question)
  return sentences(locale, ...parts)
}

/**
 * The card input for a stored share (the client builds the same from the live pass: see
 * src/ui/share/card.ts), so both sides print identical fields. Language-free: buildCardSpec takes the locale.
 */
export function cardInputFromShare(s: ShareRecord, host: string, imageMiss?: CardInput['imageMiss']): CardInput {
  const p = s.pass
  return {
    verdict: s.verdict,
    satName: satLabel(s),
    placeLabel: s.placeLabel,
    satellites: s.satellites,
    lat: s.lat,
    lon: s.lon,
    tClosest: momentOf(s),
    timeZone: shareTimeZone(s),
    pass: {
      altitudeKm: p.altitudeKm,
      offNadirDeg: p.offNadirDeg,
      elevationDeg: p.elevationDeg,
      groundSpeedKmS: p.groundSpeedKmS,
      groundDistanceKm: p.groundDistanceKm,
      azimuthDeg: p.azimuthDeg,
      headingDeg: p.headingDeg,
    },
    capture: s.capture,
    imageMiss,
    host,
  }
}
