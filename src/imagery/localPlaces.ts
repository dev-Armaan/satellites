/**
 * The offline place list (built by scripts/build-places.ts from GeoNames): names for a typed search and for a dropped
 * pin without waiting on a network geocoder, which can stall for tens of seconds (Photon, 2026-11-12).
 *
 * It is split so nobody downloads the whole list: a search fetches the one file for its first letters (two, or more
 * where the group is large; at most 800 places, ~1–20 kB compressed), a pin the one 5° tile under it (plus a neighbour
 * near an edge). Files sit under a versioned path that public/_headers caches as immutable, so a returning visitor
 * fetches nothing, and the generated manifest (localPlaces.gen.ts, ~1.5 kB) says which groups exist and which are
 * split, so a request for a file that doesn't exist is rare (a typo) and its 404 is remembered. Each file is fetched
 * once per page and kept in memory (a small LRU), shared by every caller: an abort only stops that caller waiting.
 */
import { haversineKm } from '@/lib/geo'
import { LOCALE_INFO, type Locale } from '../../api/_lib/i18n/locales'
import type { Alternate } from './exonymSearch'
import { PLACE_GROUPS, PLACE_SPLIT, PLACE_TILES, PLACE_TILES_SPLIT, PLACES_VERSION } from './localPlaces.gen'
import { Lru } from './lru'
import { raceAbort, throwIfAborted } from './net'
import { placeKey, shardFor, shardOf, tileAt, tileFile, tileIndex } from './placeKey'

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
  /** '' a settlement, 'r' a state or province, 'c' a country, 'f' a named feature or building, 'l' a landmark */
  kind: '' | 'r' | 'c' | 'f' | 'l'
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
const TILES_SPLIT = new Set(PLACE_TILES_SPLIT.split(',').filter(Boolean).map(Number))
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
    const kind = f[6] === 'r' || f[6] === 'c' || f[6] === 'f' ? f[6] : ''
    out.push({ name: f[0], lat, lon, cc: f[3], admin1: f[4], p: Number(f[5]) || 0, kind, key: placeKey(f[7] || f[0]) })
  }
  return out
}

/**
 * The offline list's English name for each country it names otherwise than the browser does in English (GeoNames':
 * Ivory Coast, The Netherlands, Palestinian Territory, for CLDR's Côte d’Ivoire, Netherlands, Palestine). Written
 * here, not gathered from the files a page has read: a row so named, the list's or Open-Meteo's (which names places as
 * GeoNames does), is named as its country from the first time it is shown, so its name never changes once shown
 * (geocode.ts displayLabel); and a country found by its name in the language is looked up in the file of this name,
 * which may not be the browser's name's file (./exonymSearch.ts, Alternate.also). src/imagery/exonymSearch.test.ts
 * holds it equal to the committed list.
 */
export const LIST_COUNTRY_NAMES: Readonly<Record<string, string>> = {
  BQ: 'Bonaire, Saint Eustatius and Saba',
  CC: 'Cocos Islands',
  CD: 'Democratic Republic of the Congo',
  CG: 'Republic of the Congo',
  CI: 'Ivory Coast',
  CV: 'Cabo Verde',
  GS: 'South Georgia and the South Sandwich Islands',
  HK: 'Hong Kong',
  HM: 'Heard Island and McDonald Islands',
  MM: 'Myanmar',
  MO: 'Macao',
  NL: 'The Netherlands',
  PN: 'Pitcairn',
  PS: 'Palestinian Territory',
  TR: 'Turkey',
  UM: 'United States Minor Outlying Islands',
  VA: 'Vatican',
  VC: 'Saint Vincent and the Grenadines',
}

/** Is `name` the offline list's own name for country `cc`, where that is not the browser's (LIST_COUNTRY_NAMES)? */
export function isListCountry(name: string, cc: string): boolean {
  const listed = LIST_COUNTRY_NAMES[cc.toUpperCase()]
  return !!listed && placeKey(listed) === placeKey(name)
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

/** The browser's country names, one set per language and style (null where it has none). */
const regionNames = new Map<string, Intl.DisplayNames | null>()

function regionName(cc: string, locale: Locale, style: 'long' | 'short'): string {
  const k = `${locale}|${style}`
  let names = regionNames.get(k)
  if (names === undefined) {
    try {
      names = new Intl.DisplayNames([locale === 'en' ? 'en' : LOCALE_INFO[locale].intl], { type: 'region', style })
    } catch {
      names = null
    }
    regionNames.set(k, names)
  }
  try {
    return names?.of(cc.toUpperCase()) ?? cc
  } catch {
    return cc
  }
}

/**
 * "United States" for "US": in English by default, which is what the offline list's rows are matched against ("paris
 * france") and what the places keep as data; in `locale` for a name in another language. The code itself if the
 * browser can't say. A name shown to the visitor goes through shownCountryName instead.
 */
export function countryName(cc: string, locale: Locale = 'en'): string {
  return regionName(cc, locale, 'long')
}

let byEnglishName: Map<string, string> | undefined

/**
 * The country an English name (countryName's, as a landmark's where line writes it: "Italy", "Israel and Jordan"'s
 * parts) is, as an upper-case ISO code; undefined for anything else. Built once, from the browser's names.
 */
export function countryCodeOf(english: string): string | undefined {
  if (!byEnglishName) {
    byEnglishName = new Map()
    for (let a = 65; a <= 90; a++)
      for (let b = 65; b <= 90; b++) {
        const cc = String.fromCharCode(a, b)
        const name = countryName(cc)
        if (name !== cc && !byEnglishName.has(placeKey(name))) byEnglishName.set(placeKey(name), cc)
      }
  }
  return byEnglishName.get(placeKey(english))
}

/**
 * The countries read by CLDR's short name on screen (owner, 2026-11-19): Hong Kong and Macao in every language, English
 * included (the long names are officialese in a where line: "Hong Kong SAR China", "R.A.S. chinoise de Hong Kong"), and
 * Palestine in Arabic and Indonesian (فلسطين, Palestina, for الأراضي الفلسطينية and Wilayah Palestina; the other
 * languages keep the long name), and the United States in Hindi (अमेरिका, as Hindi says it and its curated places
 * write it, for संयुक्त राज्य) and German (USA, docs/i18n/de.md §6.7: Vereinigte Staaten is stiff in a where line).
 * Never the short style wholesale: it turns the US and the UK into "US" and "UK".
 */
const SHORT_NAMES: Record<string, true | readonly Locale[]> = { HK: true, MO: true, PS: ['ar', 'id'], US: ['hi', 'de'] }
/**
 * Names a language's guide fixes whatever the browser says: CLDR's German long name for the Palestinian territories
 * became Palästina in Chromium (157), which de.md §6.7 rejects as politically loaded.
 */
const PINNED: Record<string, Partial<Record<Locale, string>>> = { PS: { de: 'Palästinensische Autonomiegebiete' } }

/**
 * A country's name as the visitor reads it (geocode.ts displaySublabel): countryName in `locale`, or its CLDR short
 * name for the few countries SHORT_NAMES lists, or the name PINNED fixes. Display only: matching, the stored labels and
 * the usage stats keep countryName's English.
 */
export function shownCountryName(cc: string, locale: Locale): string {
  const pinned = PINNED[cc.toUpperCase()]?.[locale]
  if (pinned) return pinned
  const short = SHORT_NAMES[cc.toUpperCase()]
  const style = short === true || short?.includes(locale) ? 'short' : 'long'
  return spelledOut(regionName(cc, locale, style), cc, locale)
}

/** The states whose Russian name ends in Острова, capitalised as their official names are (МИД России). */
const ISLAND_STATES = new Set(['MH', 'SB', 'SC'])

/**
 * Russian CLDR abbreviates islands (Сейшельские о-ва, о-в Мэн, о-в Св. Елены; Chromium's Фолклендские (Мальвинские)
 * о-ва), and ru.md (§ never invent an abbreviation) allows none in running text: a where line, a country row and a
 * headline name them in full. The name's first word takes a capital (Острова Кука, Остров Мэн), and so do the island
 * states' (Сейшельские Острова, Маршалловы Острова, Соломоновы Острова); other islands keep the lower case
 * (Фарерские острова). Display only, as the rest of shownCountryName: the search finds the browser's names too.
 */
function spelledOut(name: string, cc: string, locale: Locale): string {
  if (locale !== 'ru' || !/о-в|Св\./.test(name)) return name
  const islands = ISLAND_STATES.has(cc.toUpperCase()) ? 'Острова' : 'острова'
  const full = name
    .replace(/(^|[\s(])о-ва(?=$|[\s)])/g, `$1${islands}`)
    .replace(/(^|[\s(])о-в(?=$|[\s)])/g, '$1остров')
    .replace(/(^|[\s(])Св\.\s/g, '$1Святой ')
  return full.charAt(0).toUpperCase() + full.slice(1)
}

/**
 * shownCountryName and LIST_COUNTRY_NAMES, shared with ./exonymSearch.ts by Symbol.for, as src/lib/staleBuild.ts
 * shares its quiet chunks: the search's chunk must not import this module, which would then be split into files of its
 * own (with ./lru.ts), two more requests on every page, English's too.
 */
;(globalThis as { [k: symbol]: unknown })[Symbol.for('watched.shownCountryName')] = shownCountryName
;(globalThis as { [k: symbol]: unknown })[Symbol.for('watched.listCountryNames')] = LIST_COUNTRY_NAMES

/**
 * Up to `limit` places matching `query`, best first, from the search file for its first letters and the landmark
 * file (both small; each fetched once a page). Towns, states and countries match from the start of the name, the
 * larger first, an exact name counted as a hundred times the people (so "toro" leads with Toronto, not a village
 * called Toro, but "paris" with Paris, not Parisot); "paris france" and "waterloo, ontario" also match, the words
 * after the name starting the place's state or country. Landmarks match from the start of their name or another
 * name typed in full ("Area 51", "Groom Lake"), ranked as a large city, and from a later word or the start of
 * another name, 3+ letters ("pyramids", "giza"), ranked as a small one. Rejects only if no file can be loaded.
 *
 * `alternates` are the places the query names in the visitor's language (./exonymSearch.ts: Москва
 * for Moscow, Hà Nội for Hanoi): each is looked up in its English name's file, by name and country (a country by its
 * code alone: the list's name for it may not be the browser's, Palestinian Territory for Palestine), and ranked as the
 * place itself would be (its people, the exact bonus if the query is its whole name), so the capital Hà Nội leads the
 * hamlet of that name. Three rules settle the names a language shares between places: a place named exactly so in
 * the language's `home` countries leads one abroad (HOME_BONUS: Thái Nguyên is the Vietnamese city, not Taiyuan), and
 * every place the query only starts; a town leads the region the visitor reads by the same name (`namesOf`, the
 * names shown: Qom the city, then the province; Huế, then the province), however either was found; and a place whose
 * name is the query as typed, accents and all, leads one whose name only folds to it (Nha Trang the city, not Nhà
 * Trắng, the White House). An old name's landmark
 * row (Kiev, Peking: how the list finds the city by it in English) gives way to the city an alternate names at its spot
 * (Kyiv for an Italian's Kiev, Peking for a German's). A query with no Latin key (Cyrillic, Persian, Devanagari) is
 * answered by the alternates alone; with none, []. `variants` are the query as the language also types it, matched as
 * the query is (Muenster for Münster: ./exonyms.ts exonymVariants). `ownArea` says where the language's readers hold
 * the land to be their own though the data files it elsewhere or nowhere (./exonyms.ts exonymContested: the Paracels
 * and Spratlys for Vietnamese): a place there named exactly so leads every place of that name abroad, as one at home
 * does («Trường Sa» is the Spratlys first, then Changsha, which Vietnamese also calls Trường Sa).
 */
export async function searchLocal(
  query: string,
  signal?: AbortSignal,
  limit = 6,
  alternates: readonly Alternate[] = [],
  home: readonly string[] = [],
  variants: readonly string[] = [],
  namesOf?: (r: LocalPlace) => string[],
  ownArea?: (lat: number, lon: number) => boolean,
): Promise<LocalPlace[]> {
  throwIfAborted(signal)
  const q = placeKey(query)
  const latin = !!shardOf(q)
  if (!latin && !alternates.length) return []
  const shardRows = (shard: ReturnType<typeof shardFor>) => searchFile(shard, signal)
  const spelled = latin ? [...new Set(variants.map(placeKey))].filter((k) => k !== q && !!shardOf(k)) : []
  // Each alternate under its English name's key, and at home under its own name's too: the list files a town named in
  // its language at home by that name (Köln, not Cologne).
  const lookups = alternates.flatMap((a, i) => {
    const own = placeKey(a.shown)
    const keys = [a.key, ...(a.also ?? [])]
    return [...keys.map((key) => ({ i, key })), ...(home.includes(a.cc) && !keys.includes(own) && shardOf(own) ? [{ i, key: own }] : [])]
  })
  const [towns, marks, ...rest] = await Promise.allSettled([
    latin ? shardRows(shardFor(q, GROUPS, SPLIT)) : Promise.resolve(null),
    load(LANDMARKS, signal),
    ...spelled.map((k) => shardRows(shardFor(k, GROUPS, SPLIT))),
    ...lookups.map((l) => shardRows(shardFor(l.key, GROUPS, SPLIT))),
  ])
  throwIfAborted(signal)
  const named = rest.slice(spelled.length)
  const all = [towns, marks, ...rest]
  if (all.every((x) => x.status === 'rejected')) throw (towns as PromiseRejectedResult).reason
  const rowsOf = (x: PromiseSettledResult<LocalPlace[] | null>) => (x.status === 'fulfilled' && x.value) || []
  const hits: { r: LocalPlace; score: number; exact?: boolean; named?: boolean; shown: string; also?: string[] }[] = []
  const homeBonus = (r: LocalPlace) => (home.includes(r.cc) && r.p >= HOME_MIN_P ? HOME_BONUS : 0)
  for (const [k, rows] of [[q, towns], ...spelled.map((s, i) => [s, rest[i]] as const)] as const)
    for (const r of rowsOf(rows)) {
      const exact = r.key === k || (k.startsWith(`${r.key} `) && inContext(k.slice(r.key.length + 1), r))
      if (exact || r.key.startsWith(k)) hits.push({ r, score: r.p + (exact ? EXACT_BONUS + homeBonus(r) : 0), exact, shown: r.name })
    }
  for (const r of latin ? rowsOf(marks) : []) {
    const aliases = r.aliases ?? []
    const keys = [r.key, ...aliases]
    if (keys.includes(q)) hits.push({ r, score: LANDMARK_SCORE + EXACT_BONUS, exact: true, shown: r.name })
    else if (r.key.startsWith(q)) hits.push({ r, score: LANDMARK_SCORE, shown: r.name })
    else if (q.length >= 3 && (aliases.some((k) => k.startsWith(q)) || keys.some((k) => k.split(' ').slice(1).some((w) => w.startsWith(q)))))
      hits.push({ r, score: LANDMARK_WORD_SCORE, shown: r.name })
  }
  // The query as typed, accents and all: a place named exactly so outranks a name that only folds to it.
  const typed = verbatim(query)
  const asTyped = hits.some((h) => h.exact && verbatim(h.r.name) === typed)
  lookups.forEach(({ i, key }, n) => {
    const a = alternates[i]
    const exact = a.exact && (!asTyped || verbatim(a.shown) === typed)
    // A country is its code's country row, whatever the list calls it: its name there is GeoNames' (Palestinian
    // Territory, Turkey), the browser's English one may be another (Palestine, Türkiye). Once, if two files have it.
    const isIt = (r: LocalPlace) =>
      a.kind === 'country'
        ? r.kind === 'c' && !hits.some((h) => h.r === r)
        : r.key === key && KINDS[a.kind].includes(r.kind)
    for (const r of rowsOf(named[n]))
      if (r.cc === a.cc && isIt(r))
        hits.push({ r, score: r.p + (exact ? EXACT_BONUS + homeBonus(r) : 0), exact, named: a.kind === 'town', shown: a.shown })
    if ((a.kind === 'town' || a.kind === 'feature') && key === a.key)
      // A landmark by the visitor's name for it ranks as by another of its names: in full as a large city, else as a
      // word of it (Моск finds Москва before Московский Кремль, as "mosc" finds Moscow before the Kremlin).
      for (const r of rowsOf(marks))
        if (r.key === a.key && r.cc === a.cc) hits.push({ r, score: exact ? LANDMARK_SCORE + EXACT_BONUS : LANDMARK_WORD_SCORE, exact, shown: a.shown })
  })
  if (alternates.length || namesOf) {
    // As the visitor reads them (`namesOf`: the name the page shows, then any other it reads it by, as a region in a
    // where line; else the alternate's or the list's own).
    for (const h of hits) if (namesOf) [h.shown, ...h.also] = [...namesOf(h.r), h.shown]
    // A region named like a town of its country follows the town, however either was found (Huế the city, then the
    // province the table calls Huế in a where line and Thành phố Huế on its own).
    const townScore = new Map<string, number>()
    const sameName = (h: (typeof hits)[number], name: string) => `${h.r.cc}|${verbatim(name)}`
    for (const h of hits) if (h.r.kind === '') townScore.set(sameName(h, h.shown), Math.max(townScore.get(sameName(h, h.shown)) ?? -Infinity, h.score))
    for (const h of hits) {
      if (h.r.kind !== 'r') continue
      const towns = [h.shown, ...(h.also ?? [])].map((n) => townScore.get(sameName(h, n))).filter((t) => t !== undefined)
      if (towns.length) h.score = Math.min(h.score, Math.max(...towns) - 1)
    }
  }
  if (home.length) {
    // A place named exactly so at home leads every place the query only starts (Quận 1, whose people the list does not
    // know, before Quận 10); among the exact ones the people still decide (Moskau the city, not a hamlet of that name).
    const best = Math.max(-Infinity, ...hits.filter((h) => !h.exact).map((h) => h.score))
    for (const h of hits) if (h.exact && home.includes(h.r.cc)) h.score = Math.max(h.score, best + 0.5)
  }
  if (ownArea) {
    const top = Math.max(-Infinity, ...hits.filter((h) => h.exact && !home.includes(h.r.cc)).map((h) => h.score))
    for (const h of hits)
      if (h.exact && !home.includes(h.r.cc) && ownArea(h.r.lat, h.r.lon)) h.score = Math.max(h.score, top + 0.5)
  }
  // An old name's landmark row yields to the town the visitor's own name finds at its spot under another name (Kiev to
  // Kyiv, in Italian); a landmark under its own name stays (Torre di Pisa).
  const found = hits.filter((h) => h.named && h.exact)
  const yields = (h: (typeof hits)[number]) =>
    h.r.kind === 'l' && found.some((t) => t.r.key !== h.r.key && haversineKm(t.r, h.r) < OLD_NAME_KM)
  // Files are largest first and the sort is stable, so equal scores stay largest first.
  const seen = new Set<string>()
  return hits
    .filter((h) => !yields(h))
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

/** A search file's places (its group's head file's, where it has none), or null. */
function searchFile(shard: ReturnType<typeof shardFor>, signal?: AbortSignal): Promise<LocalPlace[] | null> {
  if (!shard) return Promise.resolve(null)
  const head = shard.head
  return load(`s/${shard.file}.txt`, signal).then((rows) => (rows || !head ? rows : load(`s/${head}.txt`, signal)))
}

/**
 * Start reading the files a search for `query` reads whatever it finds, its own search file and the landmarks, and
 * wait for neither (geocode.ts searchPlaces, while a language's names download): the first search then waits for the
 * longer of the two downloads, not one after the other. Nothing for a query with no Latin key, whose files depend on
 * the names. A file that fails is asked again by the search.
 */
export function prefetchLocal(query: string): void {
  const shard = shardFor(placeKey(query), GROUPS, SPLIT)
  if (!shard) return
  void searchFile(shard).catch(() => undefined)
  void load(LANDMARKS).catch(() => undefined)
}

/** The offline list's kinds of row an alternate of each kind may be. */
const KINDS: Record<Alternate['kind'], readonly LocalPlace['kind'][]> = { town: ['', 'f'], region: ['r'], country: ['c'], feature: ['f'] }

/** An exact name's head start, on the log scale of `p` (20 per factor of ten): a hundred times the people. */
const EXACT_BONUS = 40
/**
 * And a place at home's, over a place abroad that the language names alike: a hundred times the people again. Not a
 * hamlet's (under HOME_MIN_P: a thousand people), which never leads a famous place abroad (Betlemme in Apulia, ~560
 * people, before Bethlehem).
 */
const HOME_BONUS = 40
const HOME_MIN_P = 60

/** A name as typed, accents and all (case and spacing aside): what an alternate's shown name is compared with. */
const verbatim = (s: string) => s.normalize('NFC').toLowerCase().replace(/[\s\p{P}]+/gu, ' ').trim()
/** How near a town an old name's landmark row is (Kiev, Peking, Bombay: the city's own point, a few hundred metres off). */
const OLD_NAME_KM = 3
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

/**
 * The tile files near enough to (lat, lon) to hold a place whose reach covers it (the reach is at most 30 km): the
 * files under the spot and under points 0.3° (~33 km) around it, quarters where a tile is split.
 */
function tilesAround(lat: number, lon: number): string[] {
  const dLat = 0.3
  const dLon = Math.min(5, 0.3 / Math.max(0.05, Math.cos((lat * Math.PI) / 180)))
  const out = new Set<string>()
  for (const a of [-dLat, 0, dLat])
    for (const o of [-dLon, 0, dLon]) {
      const la = Math.max(-89.999, Math.min(89.999, lat + a))
      const lo = ((((lon + o + 180) % 360) + 360) % 360) - 180
      const { row, col } = tileAt(la, lo)
      const i = tileIndex(row, col)
      if (hasTile(i)) out.add(tileFile(la, lo, TILES_SPLIT.has(i)))
    }
  return [...out]
}

/** How far from a link's point the place it names may be, in degrees (a city's point in OpenStreetMap and in GeoNames). */
const NAMED_REACH = 0.3

/**
 * The place of the offline list named `name` nearest (lat, lon), within NAMED_REACH: a town in the tiles around the
 * point, a landmark, or a region, a country or a feature, which no tile holds (towns only): those are in the name's
 * own search file, the one a search for it reads (a link to Germany, Kharkiv Oblast, the Gaza Strip or Lake Starnberg
 * is the point a search for it wrote). What a link's place is (./linkCountry.ts). Undefined when the list has no place
 * of that name there. Rejects if a tile or the landmarks can't be loaded; a search file that can't be leaves only the
 * places it alone holds out.
 */
export async function localNamed(name: string, lat: number, lon: number, signal?: AbortSignal): Promise<LocalPlace | undefined> {
  throwIfAborted(signal)
  const key = placeKey(name)
  if (!key) return undefined
  const areas = searchFile(shardFor(key, GROUPS, SPLIT), signal).then(
    (rows) => rows?.filter((r) => r.kind === 'r' || r.kind === 'c' || r.kind === 'f') ?? null,
    () => null,
  )
  const lists = await Promise.all([...tilesAround(lat, lon).map((f) => load(`t/${f}.txt`, signal)), load(LANDMARKS, signal), areas])
  let best: LocalPlace | undefined
  let bestKm = Infinity
  for (const r of lists.flatMap((l) => l ?? [])) {
    if ((r.key !== key && !r.aliases?.includes(key)) || Math.abs(r.lat - lat) > NAMED_REACH) continue
    const km = haversineKm({ lat, lon }, r)
    if (km < bestKm && km <= NAMED_REACH * 111) {
      best = r
      bestKm = km
    }
  }
  return best
}

/**
 * The settlement (lat, lon) is in, as far as points can say: among places whose reach (reachKm) covers the spot, the
 * one it is relatively nearest. Undefined when none does (open sea, ice, wilderness): the caller asks a network
 * geocoder, which knows natural features and regions. Rejects if a tile can't be loaded.
 */
export async function nearestLocal(lat: number, lon: number, signal?: AbortSignal): Promise<LocalPlace | undefined> {
  throwIfAborted(signal)
  const lists = (await Promise.all(tilesAround(lat, lon).map((f) => load(`t/${f}.txt`, signal)))).map((l) => l ?? [])
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
