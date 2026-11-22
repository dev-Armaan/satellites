/**
 * Which places get a page of their own (/place/<slug>, src/lib/placePage.ts), and what each page is called.
 *
 * The pages are for search engines and for people arriving from one, so the set is closed and chosen here, from the
 * offline place list the app already ships (public/places/<version>/, GeoNames): no page can be made by typing an
 * address, which is what keeps other people's words out of titles on this site. It is the places people look up:
 *   - every landmark in the list (scripts/landmarks.ts and the landing's own places), all of them curated, except a
 *     city's other name ("Kiev", "Bombay") where the city has its page already, and a second name for the very same
 *     point ("Golden Gate" beside "Golden Gate Bridge"): one place, one page. Two pages for one point would show the
 *     same passes and pictures under two titles, and a search engine keeps only one of such a pair, of its choosing;
 *   - every city of about half a million people or more;
 *   - smaller cities, down to about 100,000, in the countries where an English page is what a search would show;
 *   - each country's two largest towns, so no country is left without a page.
 * About 2,100 pages. Raising that is one constant, but each page is a file in every deploy, and a page is only worth
 * having if the app has something to show there.
 *
 * A slug is the name as someone would type it ("são paulo" → sao-paulo). The largest place of a name keeps the bare
 * slug and its namesakes say where they are, so a place that joins the list later never renames a page that already
 * exists: by state where people tell towns apart by state (london-ontario, springfield-illinois), by country
 * everywhere else (valencia-spain, victoria-seychelles). Pure: scripts/build-seo.ts reads the files and hands the
 * rows in.
 */
import { placeKey } from '../imagery/placeKey'

/** A settlement row of a tile file (`name|lat|lon|cc|admin1|p`, scripts/build-places.ts). */
export interface CityRow {
  name: string
  lat: number
  lon: number
  /** ISO country code, upper case */
  cc: string
  admin1: string
  /** Population on the list's log scale: round(20·log10(people)) */
  p: number
}

/** A row of the landmark file (`name|lat|lon|cc|where`). */
export interface LandmarkRow {
  name: string
  lat: number
  lon: number
  cc: string
  where: string
}

export interface SeoPlace {
  slug: string
  label: string
  sublabel?: string
  lat: number
  lon: number
  /** ISO country code, lower case ('' when the list has none) */
  cc: string
  kind: 'landmark' | 'city'
  /** Population on the list's log scale; 0 for a landmark */
  p: number
}

/** ~500,000 people: 20·log10(500,000) = 113.98. */
export const P_EVERYWHERE = 114
/** ~100,000 people, in ENGLISH_FIRST. */
export const P_ENGLISH = 100
/** Countries where an English page is the one a search engine would show for a town. */
export const ENGLISH_FIRST: ReadonlySet<string> = new Set(['US', 'GB', 'CA', 'AU', 'NZ', 'IE'])
/** Each country's largest towns, whatever their size above ~10,000 people. */
export const PER_COUNTRY = 2
export const P_PER_COUNTRY = 80

/** A landmark and a city of the same name this close are one place (the landing's "Paris" and the city of Paris). */
const SAME_PLACE_KM = 30
/** A city listed among the landmarks under the name people type is the city this close to it. */
const SAME_CITY_KM = 10
/**
 * Where the list names one point twice, the page is the first name's: scripts/landmarks.ts comes first and holds the
 * names people type ("Mount Kilimanjaro", "Sydney Opera House"). These are the exceptions: the place's own name
 * today, listed after the older one people still type ("Ayers Rock").
 */
export const NAMED_TODAY: ReadonlySet<string> = new Set(['Uluru'])

export function parseCityRows(text: string): CityRow[] {
  const out: CityRow[] = []
  for (const line of text.split('\n')) {
    const f = line.split('|')
    if (f.length < 6 || !f[0] || f[6]) continue // settlements only: f[6] marks a state, a country or a feature
    const lat = Number(f[1])
    const lon = Number(f[2])
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue
    out.push({ name: f[0], lat, lon, cc: f[3], admin1: f[4], p: Number(f[5]) || 0 })
  }
  return out
}

export function parseLandmarkRows(text: string): LandmarkRow[] {
  const out: LandmarkRow[] = []
  for (const line of text.split('\n')) {
    const f = line.split('|')
    const lat = Number(f[1])
    const lon = Number(f[2])
    if (f.length < 4 || !f[0] || !Number.isFinite(lat) || !Number.isFinite(lon)) continue
    out.push({ name: f[0], lat, lon, cc: f[3], where: f[4] ?? '' })
  }
  return out
}

/** A name as a path segment: its search key with hyphens. '' when the name has no Latin letters or digits. */
export const slugOf = (name: string) => placeKey(name).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

/**
 * Where a city is, as the search box says it (src/imagery/geocode.ts localToPlace): its state, unless that only
 * repeats the name ("Berlin · State of Berlin"), then its country, unless that is the name too (Singapore).
 */
export function citySublabel(name: string, admin1: string, country: string): string | undefined {
  const key = placeKey(name)
  const seen = new Set([key])
  const out: string[] = []
  const echoes = ` ${placeKey(admin1)} `.includes(` ${key} `)
  for (const part of [echoes ? '' : admin1, country]) {
    const k = placeKey(part)
    if (!part.trim() || seen.has(k)) continue
    seen.add(k)
    out.push(part.trim())
  }
  return out.length ? out.join(', ') : undefined
}

function km(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const rad = Math.PI / 180
  const h = Math.sin(((b.lat - a.lat) * rad) / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(((b.lon - a.lon) * rad) / 2) ** 2
  return 12742 * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** The cities that get a page, largest first (ties by name, then position, so the order never depends on file order). */
export function pickCities(rows: CityRow[]): CityRow[] {
  const sorted = [...rows].sort((a, b) => b.p - a.p || a.name.localeCompare(b.name, 'en') || a.lat - b.lat || a.lon - b.lon)
  const perCountry = new Map<string, number>()
  return sorted.filter((r) => {
    const n = perCountry.get(r.cc) ?? 0
    perCountry.set(r.cc, n + 1)
    return r.p >= P_EVERYWHERE || (ENGLISH_FIRST.has(r.cc) && r.p >= P_ENGLISH) || (n < PER_COUNTRY && r.p >= P_PER_COUNTRY)
  })
}

/**
 * The pages: landmarks first (as curated), then cities, largest first. `countryName` says a country in English
 * ("US" → "United States"). `cityNames` are the landmark rows that are a city under another name
 * (scripts/landmarks.ts CITY_NAMES): each is left out where that city gets a page of its own. A landmark listed twice
 * at one point gets one page (NAMED_TODAY says which name, where it is not the first). Throws if two places
 * cannot be told apart by name, state and country: the list is wrong then, and a page silently replacing another is
 * worse than a failed build.
 */
export function selectPlaces(cities: CityRow[], landmarks: LandmarkRow[], countryName: (cc: string) => string, cityNames: ReadonlySet<string> = new Set()): SeoPlace[] {
  const picked = pickCities(cities).filter((c) => slugOf(c.name))
  const out: SeoPlace[] = []
  const taken = new Set<string>()
  const claim = (candidates: string[], what: string): string => {
    const slug = candidates.find((s) => s && !taken.has(s))
    if (!slug) throw new Error(`no free slug for ${what} (tried ${candidates.join(', ')})`)
    taken.add(slug)
    return slug
  }

  // One point, one page: which of its names the page takes.
  const spot = (l: LandmarkRow) => `${l.lat},${l.lon}`
  const named = new Map<string, LandmarkRow>()
  for (const l of landmarks) {
    if (!slugOf(l.name)) continue
    const first = named.get(spot(l))
    if (!first || (NAMED_TODAY.has(l.name) && !NAMED_TODAY.has(first.name))) named.set(spot(l), l)
  }

  for (const l of landmarks) {
    const base = slugOf(l.name)
    if (!base || named.get(spot(l)) !== l) continue
    if (cityNames.has(l.name) && picked.some((c) => km(c, l) <= SAME_CITY_KM)) continue
    const slug = claim([base, `${base}-${slugOf(l.where)}`], `landmark ${l.name}`)
    out.push({ slug, label: l.name, sublabel: l.where || undefined, lat: l.lat, lon: l.lon, cc: l.cc.toLowerCase(), kind: 'landmark', p: 0 })
  }
  const marks = out.map((m) => ({ key: placeKey(m.label), lat: m.lat, lon: m.lon }))

  for (const c of picked) {
    const base = slugOf(c.name)
    const key = placeKey(c.name)
    if (marks.some((m) => m.key === key && km(m, c) <= SAME_PLACE_KM)) continue
    const country = countryName(c.cc)
    // A state or country that only repeats the name tells nothing apart ("valencia-valencia").
    const state = slugOf(c.admin1) === base ? '' : slugOf(c.admin1)
    const land = slugOf(country) === base ? '' : slugOf(country)
    const byState = state && `${base}-${state}`
    const byLand = land && `${base}-${land}`
    const where = ENGLISH_FIRST.has(c.cc) ? [byState, byLand] : [byLand, byState]
    const slug = claim([base, ...where, state && land && `${base}-${state}-${land}`].filter((s): s is string => !!s), `${c.name}, ${c.admin1}, ${c.cc}`)
    out.push({ slug, label: c.name, sublabel: citySublabel(c.name, c.admin1, country), lat: c.lat, lon: c.lon, cc: c.cc.toLowerCase(), kind: 'city', p: c.p })
  }
  return out
}

/** The `n` pages nearest `place`, nearest first: what a page links to, so every page is a few links from every other. */
export function nearest(place: SeoPlace, all: readonly SeoPlace[], n: number): SeoPlace[] {
  return all
    .filter((o) => o !== place)
    .map((o) => ({ o, d: km(place, o) }))
    .sort((a, b) => a.d - b.d || a.o.slug.localeCompare(b.o.slug))
    .slice(0, n)
    .map((x) => x.o)
}
