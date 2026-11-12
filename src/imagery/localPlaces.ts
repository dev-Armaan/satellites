/**
 * The offline place list (built by scripts/build-places.ts from GeoNames): names for a typed search and for a dropped
 * pin without waiting on a network geocoder, which can stall for tens of seconds (Photon, 2026-11-12).
 *
 * It is split so nobody downloads the whole list: a search fetches the one file for its first letters (two, or more
 * where the group is large; at most 800 places, ~1–20 kB compressed), a pin the one 5° tile under it (plus a neighbour near an edge). Files sit under a versioned path that
 * vercel.json caches as immutable, so a returning visitor fetches nothing, and the generated manifest
 * (localPlaces.gen.ts, ~1.5 kB) says which groups exist and which are split, so a request for a file that doesn't
 * exist is rare (a typo) and its 404 is remembered. Each file is fetched once per
 * page and kept in memory (a small LRU), shared by every caller: an abort only stops that caller waiting.
 */
import { haversineKm } from '@/lib/geo'
import { PLACE_GROUPS, PLACE_SPLIT, PLACE_TILES, PLACES_VERSION } from './localPlaces.gen'
import { Lru } from './lru'
import { raceAbort, throwIfAborted } from './net'
import { placeKey, shardFor, shardOf, TILE_COLS, TILE_DEG, TILE_ROWS, tileAt, tileIndex } from './placeKey'

export interface LocalPlace {
  name: string
  lat: number
  lon: number
  /** ISO country code, upper case */
  cc: string
  /** State or province ('' for a state or country itself) */
  admin1: string
  /** Population on a log scale: round(20·log10(people)); 0 when unknown */
  p: number
  /** '' a settlement, 'r' a state or province, 'c' a country, 'l' a landmark */
  kind: '' | 'r' | 'c' | 'l'
  /** placeKey of the name (or of the ASCII name, where the name has no Latin key) */
  key: string
  /** A landmark's sublabel as written ("Giza, Egypt"), and its other names' keys */
  where?: string
  aliases?: string[]
  /** On a search result: the query is this place's whole name (or another of its names, or name and region) */
  exact?: boolean
}

const BASE = `/places/${PLACES_VERSION}`
const LANDMARKS = 'l.txt'
const GROUPS = new Set(PLACE_GROUPS.match(/../g) ?? [])
const SPLIT = new Set(PLACE_SPLIT.split(','))
let tileBits: Uint8Array | undefined
const hasTile = (i: number) => {
  tileBits ??= Uint8Array.from(atob(PLACE_TILES), (c) => c.charCodeAt(0))
  return ((tileBits[i >> 3] >> (i & 7)) & 1) === 1
}

export function parsePlaces(text: string): LocalPlace[] {
  const out: LocalPlace[] = []
  for (const l of text.split('\n')) {
    const f = l.split('|')
    if (f.length < 6 || !f[0]) continue
    const lat = Number(f[1])
    const lon = Number(f[2])
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue
    const kind = f[6] === 'r' || f[6] === 'c' ? f[6] : ''
    out.push({ name: f[0], lat, lon, cc: f[3], admin1: f[4], p: Number(f[5]) || 0, kind, key: placeKey(f[7] || f[0]) })
  }
  return out
}

/** The landmark file: `name|lat|lon|cc|where|alias;alias` (scripts/build-places.ts). */
export function parseLandmarks(text: string): LocalPlace[] {
  const out: LocalPlace[] = []
  for (const l of text.split('\n')) {
    const f = l.split('|')
    const lat = Number(f[1])
    const lon = Number(f[2])
    if (f.length < 4 || !f[0] || !Number.isFinite(lat) || !Number.isFinite(lon)) continue
    const aliases = (f[5] ?? '').split(';').filter(Boolean).map(placeKey)
    out.push({ name: f[0], lat, lon, cc: f[3], admin1: '', p: 0, kind: 'l', key: placeKey(f[0]), where: f[4] || undefined, aliases })
  }
  return out
}

const files = /* @__PURE__ */ new Lru<string, Promise<LocalPlace[] | null>>(48)

/** A file's places, or null if it doesn't exist. */
function load(path: string, signal?: AbortSignal): Promise<LocalPlace[] | null> {
  let p = files.get(path)
  if (!p) {
    p = fetch(`${BASE}/${path}`).then(async (res) => {
      if (res.status === 404) return null // no such file: remembered, not asked again
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`)
      const text = await res.text()
      return path === LANDMARKS ? parseLandmarks(text) : parsePlaces(text)
    })
    p.catch(() => files.delete(path)) // a failed load is retried by the next caller
    files.set(path, p)
  }
  return raceAbort(p, signal)
}

let regionNames: Intl.DisplayNames | null | undefined
/** "United States" for "US", in English; the code itself if the browser can't say. */
export function countryName(cc: string): string {
  if (regionNames === undefined) {
    try {
      regionNames = new Intl.DisplayNames(['en'], { type: 'region' })
    } catch {
      regionNames = null
    }
  }
  try {
    return regionNames?.of(cc) ?? cc
  } catch {
    return cc
  }
}

/**
 * Up to `limit` places matching `query`, best first, from the search file for its first letters and the landmark
 * file (both small; each fetched once a page). Towns, states and countries match from the start of the name, the
 * larger first, an exact name counted as a hundred times the people (so "toro" leads with Toronto, not a village
 * called Toro, but "paris" with Paris, not Parisot); "paris france" and "waterloo, ontario" also match, the words
 * after the name starting the place's state or country. Landmarks match from the start of their name or another
 * name typed in full ("Area 51", "Groom Lake"), ranked as a large city, and from a later word or the start of
 * another name, 3+ letters ("pyramids", "giza"), ranked as a small one. [] if the query has no Latin key. Rejects only if neither
 * file can be loaded.
 */
export async function searchLocal(query: string, signal?: AbortSignal, limit = 6): Promise<LocalPlace[]> {
  throwIfAborted(signal)
  const q = placeKey(query)
  if (!shardOf(q)) return []
  const shard = shardFor(q, GROUPS, SPLIT)
  const [towns, marks] = await Promise.allSettled([
    shard ? load(`s/${shard.file}.txt`, signal).then((rows) => (rows || !shard.head ? rows : load(`s/${shard.head}.txt`, signal))) : Promise.resolve(null),
    load(LANDMARKS, signal),
  ])
  throwIfAborted(signal)
  if (towns.status === 'rejected' && marks.status === 'rejected') throw towns.reason
  const hits: { r: LocalPlace; score: number; exact?: boolean }[] = []
  for (const r of (towns.status === 'fulfilled' && towns.value) || []) {
    const exact = r.key === q || (q.startsWith(`${r.key} `) && inContext(q.slice(r.key.length + 1), r))
    if (exact || r.key.startsWith(q)) hits.push({ r, score: r.p + (exact ? EXACT_BONUS : 0), exact })
  }
  for (const r of (marks.status === 'fulfilled' && marks.value) || []) {
    const aliases = r.aliases ?? []
    const keys = [r.key, ...aliases]
    if (keys.includes(q)) hits.push({ r, score: LANDMARK_SCORE + EXACT_BONUS, exact: true })
    else if (r.key.startsWith(q)) hits.push({ r, score: LANDMARK_SCORE })
    else if (q.length >= 3 && (aliases.some((k) => k.startsWith(q)) || keys.some((k) => k.split(' ').slice(1).some((w) => w.startsWith(q)))))
      hits.push({ r, score: LANDMARK_WORD_SCORE })
  }
  // Files are largest first and the sort is stable, so equal scores stay largest first.
  const seen = new Set<string>()
  return hits
    .sort((a, b) => b.score - a.score)
    .filter(({ r }) => {
      const k = `${r.key}|${r.lat.toFixed(1)}|${r.lon.toFixed(1)}`
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
    .slice(0, limit)
    .map((h) => (h.exact ? { ...h.r, exact: true } : h.r))
}

/** An exact name's head start, on the log scale of `p` (20 per factor of ten): a hundred times the people. */
const EXACT_BONUS = 40
/** A landmark named from its start ranks as a city of ~30 million; from a later word, as a town of ~300,000. */
const LANDMARK_SCORE = 150
const LANDMARK_WORD_SCORE = 110

function inContext(rest: string, r: LocalPlace): boolean {
  const words = placeKey(`${r.admin1} ${countryName(r.cc)}`).split(' ')
  return rest.split(' ').every((w) => words.some((c) => c.startsWith(w)))
}

/**
 * How far from its point a place's name still holds, in km: ~2 km for a village of 1,000, ~8 for a town of 100,000,
 * ~16 for a city of a million, at most 30.
 */
export function reachKm(p: number): number {
  const people = p > 0 ? 10 ** (p / 20) : 1_000
  return Math.min(30, 2 * Math.max(1, people / 1_000) ** 0.3)
}

/** Tiles near enough to (lat, lon) to hold a place whose reach covers it (the reach is at most 30 km). */
function tilesAround(lat: number, lon: number): number[] {
  const { row, col } = tileAt(lat, lon)
  const marginLat = 0.3
  const marginLon = Math.min(TILE_DEG, 0.3 / Math.max(0.05, Math.cos((lat * Math.PI) / 180)))
  const fr = (lat + 90) / TILE_DEG - row
  const fc = (lon + 180) / TILE_DEG - col
  const rows = [row]
  if (fr * TILE_DEG < marginLat && row > 0) rows.push(row - 1)
  if ((1 - fr) * TILE_DEG < marginLat && row < TILE_ROWS - 1) rows.push(row + 1)
  const cols = [col]
  if (fc * TILE_DEG < marginLon) cols.push(col - 1)
  if ((1 - fc) * TILE_DEG < marginLon) cols.push(col + 1)
  const out = new Set<number>()
  for (const r of rows) for (const c of cols) out.add(tileIndex(r, ((c % TILE_COLS) + TILE_COLS) % TILE_COLS))
  return [...out]
}

/**
 * The settlement (lat, lon) is in, as far as points can say: among places whose reach (reachKm) covers the spot, the
 * one it is relatively nearest. Undefined when none does (open sea, ice, wilderness): the caller asks a network
 * geocoder, which knows natural features and regions. Rejects if a tile can't be loaded.
 */
export async function nearestLocal(lat: number, lon: number, signal?: AbortSignal): Promise<LocalPlace | undefined> {
  throwIfAborted(signal)
  const tiles = tilesAround(lat, lon).filter(hasTile)
  const lists = (await Promise.all(tiles.map((i) => load(`t/${i}.txt`, signal)))).map((l) => l ?? [])
  let best: LocalPlace | undefined
  let bestScore = 1
  for (const list of lists) {
    for (const r of list) {
      if (Math.abs(r.lat - lat) > 0.3) continue
      const score = haversineKm({ lat, lon }, r) / reachKm(r.p)
      if (score < bestScore) {
        best = r
        bestScore = score
      }
    }
  }
  return best
}
