/**
 * Places: forward search and reverse lookup (Photon / OpenStreetMap), browser geolocation, and
 * time zones (offline, @photostructure/tz-lookup).
 *
 * Reverse lookups (a dropped pin, "Near me", typed coordinates) are hedged: Photon's public server usually answers
 * in well under a second but can stall for 45 s (2026-11-12), and someone is watching "Naming this spot" the whole
 * time. If Photon has not answered within REVERSE_HEDGE_MS, Nominatim (the same OSM data) is asked too, and the first
 * answer wins. Nominatim's usage policy allows about one request a second and no autocomplete, so it is never used
 * for search-as-you-type, is asked only when Photon is slow, and its requests are spaced NOMINATIM_GAP_MS apart.
 *
 * Both are answered from the offline place list first where it can (./localPlaces.ts): a pin near a town is named
 * from it with no network at all, and a typed search shows its towns, states and countries if Photon has not answered
 * within SEARCH_GRACE_MS, network-only results (landmarks, streets) joining below them later, never above.
 *
 * Typed searches are hedged the same way, to Open-Meteo's place search (GeoNames, made for type-ahead). It knows
 * settlements and natural features but no landmarks, and it matches old and alternate names ("waterloo" → Austin,
 * Texas, once called Waterloo), so only results whose own name matches the query are kept, an empty answer counts as
 * none (Photon is still waited for), and its answers are never cached.
 *
 * Labels are built for a two-line display: `label` is the thing itself ("Waterloo"),
 * `sublabel` is where it is ("Ontario, Canada"), with no part repeated.
 */
import { haversineKm } from '@/lib/geo'
import type { LatLon, Place } from '@/types'
import { fmtLat, fmtLon } from '@/ui/system/format'
import { NOMINATIM, OPEN_METEO_GEOCODE, PHOTON } from './endpoints'
import { countryName, nearestLocal, searchLocal, type LocalPlace } from './localPlaces'
import { Lru } from './lru'
import { placeKey } from './placeKey'
import { fetchJson, hedge, HttpError, isAbortError, sleep, throwIfAborted } from './net'

// ── Photon wire types ──────────────────────────────────────────────────────────────────────

export interface PhotonProperties {
  name?: string
  housenumber?: string
  street?: string
  locality?: string
  district?: string
  city?: string
  county?: string
  state?: string
  country?: string
  countrycode?: string
  postcode?: string
  osm_key?: string
  osm_value?: string
  type?: string
  /** Bounding box of areas: [minLon, maxLat, maxLon, minLat] */
  extent?: [number, number, number, number]
}

export interface PhotonFeature {
  type?: 'Feature'
  geometry: { type: 'Point'; coordinates: [number, number] }
  properties: PhotonProperties
}

export interface PhotonResponse {
  features: PhotonFeature[]
}

// ── Label building (pure) ──────────────────────────────────────────────────────────────────

/** Case- and accent-insensitive key: "Tōkyō" and "tokyo" compare equal. */
export function textKey(s: string): string {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim()
}

/** Join non-empty parts with ", ", dropping repeats and anything equal to `exclude`. */
export function joinUnique(parts: (string | undefined)[], exclude: (string | undefined)[] = []): string | undefined {
  const seen = new Set(exclude.filter((x): x is string => !!x).map(textKey))
  const out: string[] = []
  for (const p of parts) {
    const t = p?.trim()
    if (!t) continue
    const k = textKey(t)
    if (seen.has(k)) continue
    seen.add(k)
    out.push(t)
  }
  return out.length ? out.join(', ') : undefined
}

/** "43.4723°N 80.5449°W" */
export function coordinateLabel(lat: number, lon: number): string {
  return `${fmtLat(lat)} ${fmtLon(lon)}`
}

const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n)

/** True if `s` carries any letter or digit (OSM has POIs named "-", ".", "🗲", a lone zero-width joiner). */
export const hasText = (s: string | undefined): s is string => !!s && /[\p{L}\p{N}]/u.test(s)
const LATIN = /\p{Script=Latin}/u

/**
 * Join the "where" line. With `lang=en`, OSM still hands back local-script names where no English
 * one exists ("Tokyo Dome · Tokyo, 東京都, Japan"); under a Latin-script label those read as noise,
 * so non-Latin parts are dropped, unless nothing would be left.
 */
export function sublabelOf(label: string, parts: (string | undefined)[]): string | undefined {
  let kept = parts
  if (LATIN.test(label)) {
    const latin = parts.filter((p) => !p || LATIN.test(p))
    if (latin.some((p) => p?.trim())) kept = latin
  }
  return joinUnique(kept, [label])
}

/** A forward-search result → Place. Undefined if the feature has no usable position or a junk name. */
export function photonToPlace(f: PhotonFeature, source: Place['source'] = 'search'): Place | undefined {
  const [lon, lat] = f.geometry?.coordinates ?? []
  if (!finite(lat) || !finite(lon)) return undefined
  const p = f.properties ?? {}
  if (p.name !== undefined && !hasText(p.name)) return undefined
  const address = p.street ? joinUnique([[p.housenumber, p.street].filter(Boolean).join(' ')]) : undefined
  const label = p.name?.trim() || address || p.city || p.district || p.county || p.state || p.country || coordinateLabel(lat, lon)
  return {
    lat,
    lon,
    label,
    sublabel: sublabelOf(label, [p.city, p.state, p.country]),
    countryCode: p.countrycode?.toLowerCase() || undefined,
    source,
    ...(isStreetLevel(p, label === address) ? { streetLevel: true } : {}),
  }
}

/** A street, building or address: usage stats keep only its city (src/lib/telemetry.ts regionLabel). */
function isStreetLevel(p: PhotonProperties, labelIsAddress: boolean): boolean {
  return labelIsAddress || !!p.housenumber || p.osm_key === 'highway' || p.osm_key === 'building' || p.type === 'street' || p.type === 'house'
}

const SETTLEMENT = new Set(['city', 'town', 'village', 'hamlet', 'suburb', 'neighbourhood', 'quarter', 'borough', 'municipality', 'locality', 'island', 'islet'])
const NAMED_LAND = new Set(['natural', 'waterway', 'place', 'mountain_pass'])

/**
 * A reverse-geocoding hit → Place at the *queried* coordinates. The nearest OSM object is often a
 * shop or a tree ("Class of 1995"), which is not what anyone means by "where I am", so prefer the
 * settlement (city / district / locality), then a named natural feature, then the region.
 */
export function photonReverseToPlace(f: PhotonFeature, lat: number, lon: number, source: Place['source'] = 'geolocation'): Place {
  const p = f.properties ?? {}
  const city = p.city && !/^unorganized\b/i.test(p.city) ? p.city : undefined
  const label =
    (p.osm_key === 'place' && p.osm_value && SETTLEMENT.has(p.osm_value) ? p.name : undefined) ||
    city ||
    p.district ||
    p.locality ||
    (p.osm_key && NAMED_LAND.has(p.osm_key) ? p.name : undefined) ||
    p.county ||
    p.state ||
    p.country ||
    coordinateLabel(lat, lon)
  return {
    lat,
    lon,
    label,
    sublabel: sublabelOf(label, [p.state, p.country]),
    countryCode: p.countrycode?.toLowerCase() || undefined,
    source,
  }
}

/**
 * Drop near-identical results, keeping the first (best-ranked):
 *  - the same name (accent/case-insensitive) within 25 km is the same place to a person (OSM often
 *    has a city node, its boundary relation and its station);
 *  - anything within 1 km of a better result is the same spot for this product (a pass covers
 *    kilometres; "CN Tower", "CN Tower Edge Walk", "CN Tower tickets").
 */
export function dedupePlaces(places: Place[], withinKm = 25, sameSpotKm = 1): Place[] {
  return distinctIndexes(places, withinKm, sameSpotKm).map((i) => places[i])
}

/** Indexes of the places `dedupePlaces` keeps, in order. */
function distinctIndexes(places: Place[], withinKm = 25, sameSpotKm = 1): number[] {
  const kept: number[] = []
  places.forEach((p, i) => {
    const k = textKey(p.label)
    const dup = kept.some((j) => {
      const d = haversineKm(p, places[j])
      return d < sameSpotKm || (d < withinKm && textKey(places[j].label) === k)
    })
    if (!dup) kept.push(i)
  })
  return kept
}

/** Settlements people mean when they type a name that is also a region's. */
const MAJOR_SETTLEMENT = new Set(['city', 'town', 'village', 'hamlet', 'municipality', 'borough', 'suburb'])
const ADMIN_PLACE = new Set(['country', 'state', 'province', 'region', 'county', 'district', 'territory'])
const isSettlement = (p: PhotonProperties) => p.osm_key === 'place' && !!p.osm_value && MAJOR_SETTLEMENT.has(p.osm_value)
const isAdminArea = (p: PhotonProperties) => p.osm_key === 'boundary' || (p.osm_key === 'place' && !!p.osm_value && ADMIN_PLACE.has(p.osm_value))

function insideExtent(e: PhotonProperties['extent'], pt: LatLon): boolean {
  if (!e || e.length !== 4) return false
  const [minLon, maxLat, maxLon, minLat] = e
  return pt.lat >= minLat && pt.lat <= maxLat && pt.lon >= minLon && pt.lon <= maxLon
}

/** A result plus the raw properties ranking needs. */
export interface Hit {
  place: Place
  props: PhotonProperties
}

/**
 * "São Paulo", "Moscow", "New York", "Cairo": Photon often ranks the region above the city of the
 * same name, and its point is the region's centroid (São Paulo state: 250 km from the city). When
 * a same-named settlement lies inside the region, the settlement takes the region's rank and the
 * region is dropped. Same-named places elsewhere are left alone.
 */
export function preferSettlements(hits: Hit[]): Hit[] {
  const out = [...hits]
  for (let i = 0; i < out.length; i++) {
    const a = out[i]
    if (!isAdminArea(a.props)) continue
    const k = textKey(a.place.label)
    const j = out.findIndex(
      (s) => s !== a && isSettlement(s.props) && textKey(s.place.label) === k && (insideExtent(a.props.extent, s.place) || (!a.props.extent && haversineKm(a.place, s.place) < 50)),
    )
    if (j < 0) continue
    if (j < i) {
      // The settlement already outranks this admin area: drop the duplicate, never demote the city.
      out.splice(i, 1)
      i--
      continue
    }
    // Promote the settlement into the admin area's rank (j > i, so index i is unaffected by the splice).
    const [s] = out.splice(j, 1)
    out[i] = s
  }
  return out
}

const humanise = (v: string) => v.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase())

/** Two rows reading exactly alike ("Ushuaia · Argentina" twice) get the county, then the kind. */
function disambiguate(hits: Hit[]): Place[] {
  const seen = new Set<string>()
  const key = (p: Place) => `${textKey(p.label)}|${textKey(p.sublabel ?? '')}`
  return hits.map(({ place, props: p }) => {
    let out = place
    if (seen.has(key(out))) {
      const withCounty = sublabelOf(place.label, [p.county ?? p.district, p.city, p.state, p.country])
      out = { ...place, sublabel: withCounty }
      if (seen.has(key(out)) && p.osm_value) out = { ...place, sublabel: sublabelOf(place.label, [humanise(p.osm_value), p.city, p.state, p.country]) }
    }
    seen.add(key(out))
    return out
  })
}

/**
 * Coordinates typed into the search box: "43.4723, -80.5449", "43.4723 -80.5449",
 * "43.4723°N 80.5449°W", "43.4723N,80.5449W". Null if it isn't a coordinate pair.
 */
export function parseCoordinates(q: string): LatLon | null {
  const s = q.trim().toUpperCase().replace(/[°º]/g, ' ')
  const m = /^([+-]?\d{1,2}(?:\.\d+)?)\s*([NS])?\s*[,;\s]\s*([+-]?\d{1,3}(?:\.\d+)?)\s*([EW])?$/.exec(s)
  if (!m) return null
  let lat = Number(m[1])
  let lon = Number(m[3])
  if (m[2] === 'S') lat = -Math.abs(lat)
  if (m[4] === 'W') lon = -Math.abs(lon)
  if (!(Math.abs(lat) <= 90 && Math.abs(lon) <= 180)) return null
  return { lat, lon }
}

// ── Network ────────────────────────────────────────────────────────────────────────────────

const PHOTON_TIMEOUT_MS = 8_000
const searchCache = /* @__PURE__ */ new Lru<string, Place[]>(48)

/** Results returned, and asked of Photon (extra, so merged duplicates and junk don't thin the list). */
const MAX_RESULTS = 6
const PHOTON_LIMIT = 10

/** How long Photon has to answer a typed search before Open-Meteo is asked as well. */
export const SEARCH_HEDGE_MS = 1_200

/** One Open-Meteo search result (the fields used). */
export interface OpenMeteoPlace {
  name?: string
  latitude?: number
  longitude?: number
  country_code?: string
  country?: string
  admin1?: string
  population?: number
}

const words = (s: string) => textKey(s).split(/[^\p{L}\p{N}]+/u).filter(Boolean)

/**
 * Open-Meteo results → Places, keeping only those the query actually names: the query's first word starts a word
 * of the place's own name, and every other word starts a word of its name, region or country ("paris, france").
 * Largest first: its own order puts Waterloo, Iowa above Waterloo, Ontario, which has more people.
 */
export function openMeteoToPlaces(results: OpenMeteoPlace[] | undefined, query: string): Place[] {
  const [first, ...rest] = words(query)
  if (!first) return []
  const out: Place[] = []
  const byPopulation = [...(results ?? [])].sort((a, b) => (b.population ?? 0) - (a.population ?? 0))
  for (const r of byPopulation) {
    if (!hasText(r.name) || !finite(r.latitude) || !finite(r.longitude)) continue
    const own = words(r.name)
    const all = [...own, ...words(r.admin1 ?? ''), ...words(r.country ?? '')]
    if (!own.some((w) => w.startsWith(first)) || !rest.every((q) => all.some((w) => w.startsWith(q)))) continue
    const label = r.name.trim()
    out.push({
      lat: r.latitude,
      lon: r.longitude,
      label,
      sublabel: sublabelOf(label, [r.admin1, r.country]),
      countryCode: r.country_code?.toLowerCase() || undefined,
      source: 'search',
    })
  }
  return out
}

async function photonSearch(query: string, signal: AbortSignal): Promise<Place[]> {
  let res: PhotonResponse
  try {
    res = await fetchJson<PhotonResponse>(`${PHOTON}/api/?q=${encodeURIComponent(query)}&limit=${PHOTON_LIMIT}&lang=en`, {
      signal,
      timeoutMs: PHOTON_TIMEOUT_MS,
      retries: 1,
    })
  } catch (err) {
    if (err instanceof HttpError && err.status === 400) return [] // e.g. a query Photon can't parse
    throw err
  }
  const hits = (res.features ?? []).flatMap((f): Hit[] => {
    const place = photonToPlace(f)
    return place ? [{ place, props: f.properties ?? {} }] : []
  })
  const ranked = preferSettlements(hits)
  const distinct = distinctIndexes(ranked.map((h) => h.place)).map((i) => ranked[i])
  const places = disambiguate(distinct).slice(0, MAX_RESULTS)
  searchCache.set(textKey(query), places)
  return places
}

async function openMeteoSearch(query: string, signal: AbortSignal): Promise<Place[]> {
  const res = await fetchJson<{ results?: OpenMeteoPlace[] }>(
    `${OPEN_METEO_GEOCODE}?name=${encodeURIComponent(query)}&count=${PHOTON_LIMIT}&language=en&format=json`,
    { signal, timeoutMs: PHOTON_TIMEOUT_MS, retries: 0 },
  )
  const places = dedupePlaces(openMeteoToPlaces(res.results, query)).slice(0, MAX_RESULTS)
  // Nothing it can name (a landmark, a street): leave the answer to Photon.
  if (!places.length) throw new Error('Open-Meteo has no match')
  return places
}

/** How long a typed search waits for Photon's better-ranked answer before showing the offline list's. */
export const SEARCH_GRACE_MS = 350
/** Rows the offline list may fill while the network is still out, leaving room for what only it knows. */
const EARLY_ROWS = 4

/** A state that only repeats the city's name ("Berlin · State of Berlin") says nothing: "Berlin · Germany". */
const echoes = (admin1: string, name: string) => ` ${placeKey(admin1)} `.includes(` ${placeKey(name)} `)

const localToPlace = (r: LocalPlace, source: Place['source']): Place => ({
  lat: r.lat,
  lon: r.lon,
  label: r.name,
  sublabel: r.kind === 'c' ? undefined : sublabelOf(r.name, [echoes(r.admin1, r.name) ? undefined : r.admin1, countryName(r.cc)]),
  countryCode: r.cc.toLowerCase() || undefined,
  source,
})

/** `first`, then whatever in `more` is not already there (dedupePlaces' rules), at most MAX_RESULTS. */
const appendNew = (first: Place[], more: Place[]) => dedupePlaces([...first, ...more]).slice(0, MAX_RESULTS)

/**
 * Up to 6 places matching `q`, best first, in English where OSM has it. Coordinates are accepted
 * and reverse-geocoded. Resolves [] for queries under 2 characters, with no letters or digits, or
 * that Photon rejects. Rejects on network failure with nothing found offline (show "search
 * unavailable") and on abort.
 *
 * Photon is asked first, Open-Meteo too if it is slow (see the top of this module), and the offline list at once.
 * If the network answers within SEARCH_GRACE_MS, its order leads and the offline list only fills gaps. Otherwise
 * `onEarly` gets the offline list's best rows now, and the promise resolves with those same rows first and the
 * network's new ones after them, so a list on screen only ever grows at the bottom.
 */
export async function searchPlaces(q: string, signal?: AbortSignal, onEarly?: (places: Place[]) => void): Promise<Place[]> {
  throwIfAborted(signal)
  const query = q.trim().replace(/\s+/g, ' ')
  if (query.length < 2 || !hasText(query)) return []
  const hit = searchCache.get(textKey(query))
  if (hit) return hit

  const coords = parseCoordinates(query)
  if (coords) {
    const place = { ...(await reversePlace(coords.lat, coords.lon, signal)), source: 'search' as const }
    return [place]
  }

  const net = hedge(
    (s) => photonSearch(query, s),
    (s) => openMeteoSearch(query, s),
    SEARCH_HEDGE_MS,
    signal,
  )
  const settledNet = net.then(
    (places) => ({ places }),
    (err: unknown) => ({ err }),
  )
  const local = searchLocal(query, signal).then(
    (rows) => rows.map((r) => localToPlace(r, 'search')),
    (err: unknown) => {
      if (isAbortError(err)) throw err
      return [] as Place[]
    },
  )
  local.catch(() => undefined)

  const quick = await Promise.race([settledNet, sleep(SEARCH_GRACE_MS, signal).then(() => undefined)])
  if (quick) {
    if ('places' in quick) return appendNew(quick.places, await local)
    const found = await local
    if (found.length) return found
    throw quick.err
  }

  const found = await local
  if (!found.length) return net
  const early = found.slice(0, EARLY_ROWS)
  onEarly?.(early)
  const late = await settledNet
  throwIfAborted(signal)
  if ('err' in late) return appendNew(early, found)
  return appendNew(appendNew(early, late.places), found)
}

/** Photon's budget for one reverse lookup: no retry, since Nominatim is already being asked by then. */
const REVERSE_TIMEOUT_MS = 6_000
/** How long Photon has to answer a reverse lookup before Nominatim is asked as well. */
export const REVERSE_HEDGE_MS = 1_200
/** Nominatim's usage policy: at most about one request a second from us. */
const NOMINATIM_GAP_MS = 1_100
let nominatimNextAt = 0

/** Nominatim's GeoCodeJSON reply: the same fields as Photon's, under `properties.geocoding`. */
interface NominatimGeocoding extends Omit<PhotonProperties, 'countrycode' | 'extent'> {
  country_code?: string
}
interface NominatimResponse {
  features?: { properties?: { geocoding?: NominatimGeocoding } }[]
  error?: string
}

/** Nominatim types that name the field Photon would have put the object's name in. */
const NOMINATIM_TYPE_FIELD: Record<string, 'city' | 'district' | 'locality' | 'county' | 'state'> = {
  city: 'city',
  town: 'city',
  village: 'city',
  hamlet: 'city',
  municipality: 'city',
  district: 'district',
  suburb: 'district',
  locality: 'locality',
  county: 'county',
  state: 'state',
}

/**
 * A Nominatim GeoCodeJSON feature → the Photon shape photonReverseToPlace reads. Nominatim names the object
 * itself (a city's boundary: name "Waterloo", type "city", no `city` field), so the name also fills the field its
 * type stands for. Null when Nominatim has nothing here (open sea, ice sheet). The point is the queried one, as
 * photonReverseToPlace keeps it.
 */
export function nominatimToPhoton(res: NominatimResponse, lat: number, lon: number): PhotonFeature | null {
  const f = res.features?.[0]
  const g = f?.properties?.geocoding
  if (!f || !g) return null
  const { country_code, ...rest } = g
  const props: PhotonProperties = { ...rest, countrycode: country_code }
  const field = g.type ? NOMINATIM_TYPE_FIELD[g.type] : undefined
  if (field && hasText(g.name)) props[field] ??= g.name
  return { type: 'Feature', geometry: { type: 'Point', coordinates: [lon, lat] }, properties: props }
}

async function photonReverse(lat: number, lon: number, signal: AbortSignal): Promise<PhotonFeature | null> {
  const res = await fetchJson<PhotonResponse>(`${PHOTON}/reverse?lat=${lat.toFixed(6)}&lon=${lon.toFixed(6)}&lang=en&limit=1&radius=25`, {
    signal,
    timeoutMs: REVERSE_TIMEOUT_MS,
    retries: 0,
  })
  return res.features?.[0] ?? null
}

async function nominatimReverse(lat: number, lon: number, signal: AbortSignal): Promise<PhotonFeature | null> {
  const now = Date.now()
  const at = Math.max(now, nominatimNextAt)
  nominatimNextAt = at + NOMINATIM_GAP_MS
  if (at > now) await sleep(at - now, signal)
  // zoom 10: the settlement or district, never the nearest shop (Photon's reply is ranked the same way).
  const res = await fetchJson<NominatimResponse>(
    `${NOMINATIM}/reverse?lat=${lat.toFixed(6)}&lon=${lon.toFixed(6)}&format=geocodejson&zoom=10&accept-language=en`,
    { signal, timeoutMs: REVERSE_TIMEOUT_MS, retries: 0 },
  )
  return nominatimToPhoton(res, lat, lon)
}

/**
 * Name the place at (lat, lon). Never rejects except on abort: if neither geocoder has anything nearby (open
 * ocean, ice sheet) or can be reached, the label is the coordinates themselves.
 * The returned position is exactly (lat, lon), not the matched OSM object's.
 */
export async function reversePlace(lat: number, lon: number, signal?: AbortSignal): Promise<Place> {
  throwIfAborted(signal)
  const fallback: Place = { lat, lon, label: coordinateLabel(lat, lon), source: 'geolocation' }
  if (!(Math.abs(lat) <= 90 && Math.abs(lon) <= 180)) return fallback
  try {
    const near = await nearestLocal(lat, lon, signal)
    if (near) return { ...localToPlace(near, 'geolocation'), lat, lon }
  } catch (err) {
    if (isAbortError(err) || signal?.aborted) throw err
    // The tile didn't load: ask the network.
  }
  try {
    const f = await hedge(
      (s) => photonReverse(lat, lon, s),
      (s) => nominatimReverse(lat, lon, s),
      REVERSE_HEDGE_MS,
      signal,
    )
    return f ? photonReverseToPlace(f, lat, lon) : fallback
  } catch (err) {
    if (isAbortError(err) || signal?.aborted) throw err
    return fallback
  }
}

// ── Geolocation ────────────────────────────────────────────────────────────────────────────

export type LocateErrorCode = 'denied' | 'unavailable' | 'timeout' | 'unsupported' | 'insecure'

/** A geolocation failure with a message fit to show as-is. */
export class LocateError extends Error {
  readonly code: LocateErrorCode
  constructor(code: LocateErrorCode, message: string) {
    super(message)
    this.name = 'LocateError'
    this.code = code
  }
}

const LOCATE_MESSAGES: Record<LocateErrorCode, string> = {
  denied: 'Location access is blocked. Allow it in your browser settings, or search for a place.',
  unavailable: 'Your position isn’t available right now. Search for a place instead.',
  timeout: 'Finding your position took too long. Try again, or search for a place.',
  unsupported: 'This browser can’t share its location. Search for a place instead.',
  insecure: 'Location needs a secure (https) connection. Search for a place instead.',
}

const LOCATE_TIMEOUT_MS = 10_000
/**
 * Hard cap while the permission prompt is open. The API's own `timeout` only starts once
 * permission is granted, and some browsers never call back if the prompt is ignored.
 */
const LOCATE_PROMPT_CAP_MS = 30_000

/**
 * The device's position. Rejects with a LocateError whose message is ready to display.
 * Coarse accuracy is plenty (a pass covers kilometres) and much faster on desktop.
 */
export function locateMe(): Promise<LatLon> {
  return new Promise<LatLon>((resolve, reject) => {
    const fail = (code: LocateErrorCode) => reject(new LocateError(code, LOCATE_MESSAGES[code]))
    if (typeof window !== 'undefined' && window.isSecureContext === false) return fail('insecure')
    const geo = typeof navigator !== 'undefined' ? navigator.geolocation : undefined
    if (!geo) return fail('unsupported')
    let done = false
    const cap = setTimeout(() => {
      if (done) return
      done = true
      fail('timeout')
    }, LOCATE_PROMPT_CAP_MS)
    geo.getCurrentPosition(
      (pos) => {
        if (done) return
        done = true
        clearTimeout(cap)
        resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude })
      },
      (err) => {
        if (done) return
        done = true
        clearTimeout(cap)
        fail(err.code === err.PERMISSION_DENIED ? 'denied' : err.code === err.TIMEOUT ? 'timeout' : 'unavailable')
      },
      { enableHighAccuracy: false, timeout: LOCATE_TIMEOUT_MS, maximumAge: 5 * 60_000 },
    )
  })
}

// ── Time zone ──────────────────────────────────────────────────────────────────────────────
//
// The offline table (@photostructure/tz-lookup, ~70 kB) is not needed for the first screen, so it is a
// separate chunk: `ensureTz()` loads it (the controller starts it at landing idle and at boot for deep
// links; computeReport awaits it before producing a report), and `timeZoneAt` stays synchronous. Until
// the table is in, `timeZoneAt` answers with the nautical zone for the longitude (Etc/GMT±N), which is
// never more than an hour or two off and is only ever seen in the computing readout.

type TzLookup = (lat: number, lon: number) => string
let tzlookup: TzLookup | undefined
let tzLoad: Promise<void> | undefined

/** Load the time-zone table (idempotent; a failed load is retried by the next call). Never rejects. */
export function ensureTz(): Promise<void> {
  if (tzlookup) return Promise.resolve()
  tzLoad ??= import('@photostructure/tz-lookup').then(
    (m) => {
      const fn = ((m as { default?: unknown }).default ?? m) as TzLookup
      if (typeof fn === 'function') tzlookup = fn
    },
    (err: unknown) => {
      console.warn('Time-zone table failed to load; using nautical zones.', err)
      tzLoad = undefined
    },
  )
  return tzLoad
}

/** True once `ensureTz()` has loaded the table. */
export const tzReady = () => !!tzlookup

/** Nautical time zone for a longitude: the IANA "Etc/GMT±N" id (signs inverted by POSIX convention). */
export function nauticalZone(lon: number): string {
  const n = Math.max(-12, Math.min(12, Math.round(lon / 15)))
  if (n === 0) return 'UTC'
  return n > 0 ? `Etc/GMT-${n}` : `Etc/GMT+${-n}`
}

/**
 * IANA time zone at a position ("America/Toronto"). Offline; open sea gets "Etc/GMT±N".
 * Before `ensureTz()` has resolved, the nautical zone for the longitude.
 */
export function timeZoneAt(lat: number, lon: number): string {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return 'UTC'
  const la = Math.max(-90, Math.min(90, lat))
  const lo = ((((lon + 180) % 360) + 360) % 360) - 180
  if (!tzlookup) {
    void ensureTz()
    return nauticalZone(lo)
  }
  try {
    return tzlookup(la, lo)
  } catch {
    return 'UTC'
  }
}
