/**
 * Generate the place-name display tables: src/i18n/<de|it|uk|ru|vi|fa|hi>/exonyms.gen.ts, the names those languages
 * give the places the data names in English (München, Mosca, Київ, Москва, Hà Nội, تهران, नई दिल्ली), read by
 * src/imagery/exonyms.ts. Which names, and why, is scripts/exonyms.ts; this script only reads GeoNames and writes the
 * tables. It never touches the offline place list (public/places, scripts/build-places.ts): each rebuild of that adds
 * ~10 MB to git history, while a table is a few kB.
 *
 * What a table covers (RULES in scripts/exonyms.ts): the towns of cities500 above the language's threshold, more at
 * home, the first-level regions (admin1CodesASCII), the curated landmarks (scripts/landmarks.ts) GeoNames knows (found
 * in allCountries by name, near the landmark's point), the large seas and oceans (countryless features with an English
 * Wikipedia article), the named features at home that the offline list carries (scripts/features.ts: its lakes,
 * castles, islands and airports, Rules.homeFeatures), and the hand-made OVERRIDES and search ALIASES. Countries are not
 * in it: the browser names them (Intl.DisplayNames).
 *
 * Usage: NODE_OPTIONS=--max-old-space-size=6000 npm run data:exonyms <dir with the GeoNames downloads> The dir must
 * hold cities500.zip, admin1CodesASCII.txt, allCountries.zip and alternateNamesV2.zip from
 * https://download.geonames.org/export/dump/ (~650 MB; needs `unzip` on the PATH). Keep the downloads out of the
 * repository. Takes ~1 minute and ~3 GB of memory, and prints each table's size; src/imagery/exonymTables.test.ts
 * checks the size budget.
 *
 * Source: GeoNames (CC BY 4.0).
 */
import { spawn } from 'node:child_process'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createInterface } from 'node:readline'
import { gzipSync } from 'node:zlib'
import { FEATURES, featurePop } from './features'
import { LANDMARKS } from './landmarks'
import { CURATED_NAMES } from '../src/i18n/en/plain/placeNames'
import { EXAMPLE_PLACES, SURPRISE_PLACES } from '../src/ui/landing/places'
import dePlaces from '../src/i18n/de/places'
import itPlaces from '../src/i18n/it/places'
import ukPlaces from '../src/i18n/uk/places'
import ruPlaces from '../src/i18n/ru/places'
import viPlaces from '../src/i18n/vi/places'
import faPlaces from '../src/i18n/fa/places'
import hiPlaces from '../src/i18n/hi/places'
import { placeKey } from '../src/imagery/placeKey'
import {
  addDisplay,
  addNamesake,
  ALIASES,
  atHome,
  cleanName,
  displayName,
  LANGS,
  OVERRIDES,
  pickName,
  RULES,
  serializeDisplay,
  stripAdmin,
  type Alias,
  type AltName,
  type DisplayTable,
  type Lang,
  type Named,
} from './exonyms'

const SRC = process.argv[2]
/** Optional: a directory (outside the repository) to write each table's names into, one per line, for review. */
const REVIEW = process.argv[3]
if (!SRC) throw new Error('usage: tsx scripts/build-exonyms.ts <geonames dir> [review dir]')

/** Feature codes left out, as the offline list leaves them out: historical, abandoned or destroyed places. */
const SKIP = new Set(['PPLH', 'PPLQ', 'PPLW', 'PPLCH', 'PPLR'])
/** Sections of a city: named only when they are as large as a town the table names anywhere. */
const SECTION = 'PPLX'
/**
 * Seas, oceans, gulfs, bays and straits with an English Wikipedia article: the well-known ones first, in
 * WELL_KNOWN_WATERS' order ( GeoNames' own name counts put the Ligurian, Irminger and Java Seas above the Caspian, the
 * Sea of Azov and the Bay of Bengal), then by how many names GeoNames gives them. Named countryless, as the offline
 * list files most of them; the few it files under a country (the English Channel under GB) take the countryless name
 * too (src/imagery/exonyms.ts, a feature's label).
 */
const WATER_CODES = new Set(['OCN', 'SEA', 'GULF', 'BAY', 'STRT'])
const WELL_KNOWN_WATERS = new Map(
  [
    'Pacific Ocean', 'Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Southern Ocean', 'Mediterranean Sea', 'Black Sea',
    'Caspian Sea', 'Red Sea', 'Persian Gulf', 'Arabian Sea', 'Bay of Bengal', 'South China Sea', 'East China Sea',
    'Yellow Sea', 'Sea of Japan', 'Baltic Sea', 'North Sea', 'Caribbean Sea', 'Gulf of Mexico', 'English Channel',
    'Aegean Sea', 'Adriatic Sea', 'Sea of Azov', 'Bering Sea', 'Sea of Okhotsk', 'White Sea', 'Barents Sea',
    'Gulf of Oman', 'Gulf of Aden', 'Gulf of Thailand', 'Gulf of Tonkin', 'Andaman Sea', 'Strait of Gibraltar',
    'Ionian Sea', 'Tyrrhenian Sea', 'Ligurian Sea', 'Bay of Biscay', 'Sea of Marmara', 'Gulf of Finland', 'Kara Sea',
    'Laptev Sea', 'Gulf of Bothnia', 'Coral Sea', 'Tasman Sea', 'Java Sea', 'Irish Sea', 'Hudson Bay', 'Gulf of Aqaba',
    'Wadden Sea',
  ].map((name, i, all) => [placeKey(name), all.length - i] as const),
)
const WATERS = Math.max(...LANGS.map((l) => RULES[l].waters))
/** The offline list's own spellings of a few waters, where it names one otherwise than GeoNames does. */
const WATER_SPELLINGS: Record<string, readonly string[]> = { 'Sea of Japan': ['Japan Sea'] }
/** A regional seat at home is named down to this size (Magadan, Batken; not a hamlet GeoNames files as a seat). */
const SEAT_MIN_POP = 20_000
/** How far from its point a landmark's GeoNames feature may be, in degrees (a lake's or a reef's point is far off). */
const LANDMARK_REACH = 1
/**
 * The landing's curated places (example chips and Surprise me) as each language's translators named them
 * (src/i18n/<locale>/places.ts, the guides' §4.3): the offline list carries them under their English label, so a search
 * shows and finds them by the same name the chip does (Tschernobyl, Етна, Piramidi di Giza).
 */
const CURATED_IN: Record<Lang, Record<string, { label: string }>> = {
  de: dePlaces,
  it: itPlaces,
  uk: ukPlaces,
  ru: ruPlaces,
  vi: viPlaces,
  fa: faPlaces,
  hi: hiPlaces,
}
/** The offline list's landmark rows (`CC|key`): a curated place that is a city has none (the town's row is it). */
const LANDMARK_ROWS = new Set(
  readFileSync(join('public/places', readdirSync('public/places')[0], 'l.txt'), 'utf8')
    .split('\n')
    .map((l) => l.split('|'))
    .filter((f) => f.length >= 4)
    .map((f) => `${f[3]}|${placeKey(f[0])}`),
)
const CURATED = [...EXAMPLE_PLACES, ...SURPRISE_PLACES]
  .map((p) => ({
    id: Object.keys(CURATED_NAMES).find((id) => CURATED_NAMES[id as keyof typeof CURATED_NAMES].label === p.label)!,
    english: p.label,
    cc: (p.countryCode ?? '').toUpperCase(),
  }))
  .filter((c) => LANDMARK_ROWS.has(`${c.cc}|${placeKey(c.english)}`))

/** The countries some language names its features in (Rules.home): their features are read from allCountries. */
const FEATURE_HOMES = new Set(LANGS.flatMap((l) => RULES[l].home.filter((h) => !h.includes('.'))))
/**
 * A feature the offline list shows under an English name (Lake Starnberg, Heidelberg Castle, Frankfurt Airport): what
 * a Latin table names at home. One under its own name (Planai, Mutta, Piz Giuv) keeps it: GeoNames' German or Italian
 * name for a Romansh or Italian peak is often another language's, or a neighbouring summit's.
 */
const ENGLISH_FEATURE =
  /\b(Lakes?|Castle|Palace|Fountain|Forum|Circus|Aquarium|Basilica|Theatre|Field|Islands?|Isle|Airport|Airfield|University|Glacier|Mount|Mountains?|Alps|Forest|Zoo|Cathedral|Church|Abbey|Monastery|Park|Museum|Bridge|Dam|Reservoir|Falls|Waterfall|Gorge|Peninsula|Bay|Valley|Tower|Square|Gardens?|Opera|Cemetery|Camp|Fortress|Canal|Strait|Sea|Gulf|Lagoon|Volcano|Hills?|Peak|Range|Plateau|Cape|Viaduct|Observatory|Monument|Memorial|Ruins|Temple|Basin|Delta|Lighthouse|Caves?|Crater|Reef)\b/i
/** Stadiums keep their names: GeoNames' other names for them are often the club's, or a sponsor's (Joggeli, Servette FC). */
const KEEPS_NAME = new Set(['STDM'])

interface Town {
  id: string
  name: string
  cc: string
  admin1: string
  pop: number
  section: boolean
  capital: boolean
  /** The seat of a first-level region (PPLA) */
  seat: boolean
  /** How many names it has in other languages (scripts/exonyms.ts TownFacts) */
  names: number
}

/**
 * A table as a single-quoted string literal, its invisible characters (Persian's zero-width non-joiner, a direction
 * mark) written as escapes, so the file shows them and an editor cannot drop them unseen.
 */
const literal = (s: string) =>
  `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/[\u00ad\u200b-\u200f\u2028\u2029\u2060\ufeff]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`)}'`

async function* unzipLines(zip: string, member?: string): AsyncGenerator<string> {
  const p = spawn('unzip', ['-p', zip, ...(member ? [member] : [])], { stdio: ['ignore', 'pipe', 'inherit'] })
  yield* createInterface({ input: p.stdout, crlfDelay: Infinity })
}

const tsv = (file: string) =>
  readFileSync(join(SRC, file), 'utf8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => l.split('\t'))

async function main() {
  const started = Date.now()
  const regions = new Map<string, { code: string; name: string; cc: string }>()
  for (const p of tsv('admin1CodesASCII.txt')) regions.set(p[3], { code: p[0], name: p[1], cc: p[0].split('.')[0] })

  const towns: Town[] = []
  const regionPop = new Map<string, number>()
  for await (const l of unzipLines(join(SRC, 'cities500.zip'))) {
    const p = l.split('\t')
    if (p.length < 15 || SKIP.has(p[7])) continue
    const pop = Number(p[14]) || 0
    const admin1 = `${p[8]}.${p[10]}`
    const section = p[7] === SECTION
    if (!section) regionPop.set(admin1, (regionPop.get(admin1) ?? 0) + pop)
    towns.push({ id: p[0], name: p[1], cc: p[8], admin1, pop, section, capital: p[7] === 'PPLC', seat: p[7] === 'PPLA', names: 0 })
  }

  // The landmarks' GeoNames features (a name or alias of the landmark among the feature's names, the nearest), and
  // the countryless seas and oceans.
  const cell = (lat: number, lon: number) => `${Math.floor(lat)}|${Math.floor(lon)}`
  const near = new Map<string, number[]>()
  LANDMARKS.forEach(([, , lat, lon], i) => {
    for (let a = -1; a <= 1; a++)
      for (let o = -1; o <= 1; o++) {
        const k = cell(lat + a * LANDMARK_REACH, lon + o * LANDMARK_REACH)
        const list = near.get(k) ?? []
        if (!list.includes(i)) list.push(i)
        near.set(k, list)
      }
  })
  const landmarkKeys = LANDMARKS.map(([name, , , , , aliases]) => new Set([name, ...(aliases ?? [])].map(placeKey)))
  const landmarkHit: ({ id: string; d: number; own: boolean } | undefined)[] = LANDMARKS.map(() => undefined)
  const waterCandidates = new Map<string, { name: string; names: number; cc: string }>()
  const featureCandidates = new Map<string, { name: string; names: number; cc: string; code: string }>()
  for await (const l of unzipLines(join(SRC, 'allCountries.zip'))) {
    const p = l.split('\t', 9)
    const lat = Number(p[4])
    const lon = Number(p[5])
    if (WATER_CODES.has(p[7]) && p[3])
      waterCandidates.set(p[0], { name: p[1], cc: p[8], names: p[3].split(',').length + (WELL_KNOWN_WATERS.get(placeKey(p[1])) ?? 0) * 1e6 })
    if (FEATURES.has(p[7]) && FEATURE_HOMES.has(p[8])) featureCandidates.set(p[0], { name: p[1], cc: p[8], code: p[7], names: p[3] ? p[3].split(',').length : 0 })
    const here = near.get(cell(lat, lon))
    if (!here) continue
    for (const i of here) {
      const [, , la, lo, cc] = LANDMARKS[i]
      if (p[8] && p[8] !== cc.toUpperCase()) continue
      const d = Math.hypot(la - lat, (lo - lon) * Math.cos((la * Math.PI) / 180))
      if (d > LANDMARK_REACH) continue
      const own = placeKey(LANDMARKS[i][0]) === placeKey(p[1]) || placeKey(LANDMARKS[i][0]) === placeKey(p[2])
      const named = own || landmarkKeys[i].has(placeKey(p[1])) || p[3].split(',').some((n) => landmarkKeys[i].has(placeKey(n)))
      if (!named) continue
      const had = landmarkHit[i]
      if (!had || (own && !had.own) || (own === had.own && d < had.d)) landmarkHit[i] = { id: p[0], d, own }
    }
  }

  // The alternate names of every town, region, landmark and water in the table languages and English, and which
  // waters have an English Wikipedia article.
  const wanted = new Set<string>([...towns.map((t) => t.id), ...regions.keys(), ...waterCandidates.keys(), ...featureCandidates.keys()])
  for (const h of landmarkHit) if (h) wanted.add(h.id)
  const langs = new Set<string>([...LANGS, 'en'])
  const alts = new Map<string, Map<string, AltName[]>>()
  const wiki = new Set<string>()
  const nameCount = new Map<string, number>()
  const isLanguage = /^[a-z]{2,3}(-[A-Za-z]+)?$/
  for await (const l of unzipLines(join(SRC, 'alternateNamesV2.zip'), 'alternateNamesV2.txt')) {
    const a = l.indexOf('\t')
    if (!wanted.has(l.slice(a + 1, l.indexOf('\t', a + 1)))) continue
    const p = l.split('\t')
    if (p[2] === 'link') {
      if (p[3].includes('en.wikipedia.org/')) wiki.add(p[1])
      continue
    }
    if (isLanguage.test(p[2])) nameCount.set(p[1], (nameCount.get(p[1]) ?? 0) + 1)
    if (!langs.has(p[2])) continue
    let byLang = alts.get(p[1])
    if (!byLang) alts.set(p[1], (byLang = new Map()))
    const list = byLang.get(p[2]) ?? []
    list.push({ name: p[3], preferred: p[4] === '1', short: p[5] === '1', colloquial: p[6] === '1', historic: p[7] === '1' })
    byLang.set(p[2], list)
  }
  for (const t of towns) t.names = nameCount.get(t.id) ?? 0
  // The features at home the offline list carries (those with an English Wikipedia article), under the name it shows:
  // the English one GeoNames gives (preferred first), else GeoNames' own (scripts/build-places.ts does the same), the
  // best known first.
  const homeFeatures = [...featureCandidates]
    .filter(([id]) => wiki.has(id))
    .map(([id, f]) => {
      const en = (alts.get(id)?.get('en') ?? []).filter((a) => !a.colloquial && !a.historic && !/[|;]/.test(a.name))
      return { id, cc: f.cc, code: f.code, names: f.names, english: (en.find((a) => a.preferred) ?? en[0])?.name ?? f.name }
    })
    .sort((a, b) => b.names - a.names)
  featureCandidates.clear()
  // The best known first, one per name (GeoNames has two Seas of Azov).
  const waterKeys = new Set<string>()
  const waters = [...waterCandidates]
    .filter(([id]) => wiki.has(id))
    .sort((a, b) => b[1].names - a[1].names)
    .filter(([, w]) => !waterKeys.has(placeKey(w.name)) && !!waterKeys.add(placeKey(w.name)))
    .slice(0, WATERS)

  /**
   * A place's English spellings: GeoNames' own name (the offline list's), then, in a Latin table, its English name if
   * that differs (Köln, Cologne: what Photon and Open-Meteo say). A script table writes every name it has, so it
   * spends no bytes on a second spelling: the offline list, which answers nearly every search and pin, has the first.
   */
  const englishOf = (id: string, name: string, both: boolean) => {
    const en = both ? pickName(alts.get(id)?.get('en'), (n) => !!placeKey(n)) : undefined
    return en && en !== name ? [name, en] : [name]
  }
  /**
   * Each region's own name in the data, by country and key: another region's English spelling never takes it. A city
   * that is a region of its own goes by its bare name too (Kyiv City is Photon's "Kyiv"), unless that is another
   * region's own name (Minsk, the region, beside Minsk City).
   */
  const regionNamed = new Map([...regions].map(([id, r]) => [`${r.cc}|${placeKey(r.name)}`, id]))
  const cityRegions = new Map<string, string>()
  for (const [id, r] of regions) {
    const bare = r.name.replace(/ City$/, '')
    if (bare !== r.name && !regionNamed.has(`${r.cc}|${placeKey(bare)}`)) cityRegions.set(id, bare)
  }
  for (const [id, bare] of cityRegions) regionNamed.set(`${regions.get(id)!.cc}|${placeKey(bare)}`, id)
  /**
   * A region's English spellings in a script table, at home (Rules.spelledRegions): the data's and every current one,
   * each also without "Province", as OpenStreetMap names Iran's in a where line (Gilan, Kurdistan, Lorestan); never
   * another region's own name (Moscow Oblast is also called Moscow in English, which is the city's region).
   */
  const regionEnglish = (id: string, name: string) => {
    const cc = regions.get(id)?.cc ?? ''
    const others = (e: string) => (regionNamed.get(`${cc}|${placeKey(e)}`) ?? id) !== id
    const all = [
      name,
      ...(cityRegions.has(id) ? [cityRegions.get(id)!] : []),
      ...(alts.get(id)?.get('en') ?? [])
        // Not a transliteration or a description (Kharkivs’ka Oblast’, Rostovskaya Oblast, The 10th Province).
        .filter(
          (a) =>
            !a.historic &&
            !a.colloquial &&
            !/['’()]|skaya\b|skiy\b|\d(st|nd|rd|th)\b|\bostan\b|governor/i.test(a.name) &&
            !!placeKey(a.name) &&
            placeKey(a.name) !== placeKey(name) &&
            !others(a.name),
        )
        .map((a) => a.name),
    ]
    const bare = all
      .map((e) => e.replace(/ Province$/i, ''))
      .filter((e) => e && !others(e) && !all.some((x) => placeKey(x) === placeKey(e)))
    return [...all, ...new Set(bare)]
  }

  // Every town's key, by country: a landmark sharing one is written for landmarks only (`^`), and a Latin region's
  // bare name that is one is written in full.
  const townKeys = new Map<string, Set<string>>()
  for (const t of towns) {
    const set = townKeys.get(t.cc) ?? new Set<string>()
    set.add(placeKey(t.name))
    townKeys.set(t.cc, set)
  }
  const regionKeys = new Map<string, Map<string, string>>()
  for (const [id, r] of regions) {
    const m = regionKeys.get(r.cc) ?? new Map<string, string>()
    for (const e of englishOf(id, r.name, true)) m.set(placeKey(e), id)
    regionKeys.set(r.cc, m)
  }
  const landmarkNames = new Set(LANDMARKS.map(([name, , , , cc]) => `${cc.toUpperCase()}:${placeKey(name)}`))

  const report: string[] = []
  for (const lang of LANGS) {
    const rules = RULES[lang]
    const over = OVERRIDES[lang]
    const table: DisplayTable = new Map()
    const nameOf = (id: string, cc: string, home: boolean, region = false, avoid?: (n: string) => boolean) => {
      if (over[id] !== undefined) return over[id] || undefined
      const shown = displayName(alts.get(id)?.get(lang), lang, { region, home, cc, english: (alts.get(id)?.get('en') ?? []).map((a) => a.name), avoid })
      // Abroad, a Latin name that is one of the place's former English names is an old name, not the language's own
      // (Allahabad for Prayagraj). One the English also use is not (Odessa, Latium, Göteborg).
      if (shown && rules.latin && !home && alts.get(id)?.get('en')?.some((a) => a.historic && placeKey(a.name) === placeKey(shown))) return undefined
      return shown
    }
    const spellings = (id: string, name: string) => englishOf(id, name, rules.latin)

    // Towns: the large ones everywhere and every capital, more in the neighbours the rules list, more at home, and
    // every regional seat at home (Magadan, Gangtok, Batken), and the towns the rules add by name (Rules.include).
    const included = new Set(rules.include ?? [])
    const inTable = (t: Town, home: boolean) =>
      included.has(t.id) ||
      !!over[t.id] ||
      (home
        ? !t.section && (t.pop >= rules.homeMinPop || (t.seat && t.pop >= SEAT_MIN_POP))
        : rules.abroad(t) || (!t.section && !!rules.near?.countries.includes(t.cc) && t.pop >= rules.near.minPop))
    /**
     * At home, a Latin table keeps the data's name where it is already written in the language (Biên Hòa, Köln), as
     * the language writes it (`own`: Đà Lạt for GeoNames' Ðà Lạt, Đông Triều for Thị Trấn Đông Triều), under its
     * English spelling too (Cologne, Dusseldorf: what Photon and Open-Meteo say).
     */
    const keepsOwn = (t: Town, home: boolean) => rules.latin && home && /[^\x00-\x7f]/.test(t.name) && over[t.id] === undefined
    const own = (name: string) => {
      const bare = stripAdmin(cleanName(name, lang), lang)
      return bare.charAt(0).toLocaleUpperCase(lang) + bare.slice(1)
    }
    const small: Town[] = []
    for (const t of towns) {
      const home = atHome(rules, t.cc, t.admin1)
      if (inTable(t, home) && keepsOwn(t, home)) {
        const shown = own(t.name)
        // The data's own name, cleaned, is written as cleaned; its English spelling only where it is no longer one
        // (Cologne, not Greifswald for Universitäts- und Hansestadt Greifswald).
        // And an English spelling without its letters (Dusseldorf, Zurich: what Open-Meteo writes) finds it under its key.
        const plain = (alts.get(t.id)?.get('en') ?? []).find((a) => !a.historic && a.name !== t.name && placeKey(a.name) === placeKey(t.name))
        addDisplay(table, { english: plain ? [t.name, plain.name] : [t.name], cc: t.cc, region: false, pop: t.pop, home }, shown, { forced: true })
        const en = spellings(t.id, t.name).slice(1)
        if (en.length) addDisplay(table, { english: en, cc: t.cc, region: false, pop: t.pop, home }, shown)
        continue
      }
      const shown = inTable(t, home) ? nameOf(t.id, t.cc, home) : undefined
      // At home, the town's own name where the data writes a census locality's compound (Valmadrera-Caserta) or the
      // wrong case (Cassano All'Ionio): Rules.compounds.
      const ownName =
        !!shown && home && !!rules.compounds && (t.name.split(/\s*[-–]\s*/).includes(shown) || (shown !== t.name && shown.toLowerCase() === t.name.replace(/'/g, '’').toLowerCase()))
      if (shown) addDisplay(table, { english: spellings(t.id, t.name), cc: t.cc, region: false, pop: t.pop, home }, shown, { forced: over[t.id] !== undefined || ownName })
      else small.push(t)
    }
    // Regions: every one at home, and abroad those of the countries the rules list, and any the language names by hand
    // by its code (Crimea in Hindi, whose table names no other region of Ukraine). A Latin region whose English name
    // says what it is (Krasnodar Krai, Chelyabinsk Oblast, Opole Voivodeship, District of Columbia) is not named by a
    // bare name that is a town's in its country, in English or in the table (Krasnodar), or another region's (Altai);
    // a canton, a state or a city-state keeps its usual bare name (Zürich, Bayern, Berlin).
    for (const [id, r] of regions) {
      const home = atHome(rules, r.cc, r.code)
      const listed = rules.regionsAbroad === 'all' || rules.regionsAbroad.includes(r.cc)
      if (!home && !listed && over[r.code] === undefined) continue
      const classed = spellings(id, r.name).some((e) => /\b(krai|kray|oblast|voivodeship|district|okrug|autonomous)\b/i.test(e))
      const avoid = (n: string) => {
        const k = placeKey(n)
        const other = regionKeys.get(r.cc)?.get(k)
        return (
          classed &&
          (!!townKeys.get(r.cc)?.has(k) || [...(table.get(r.cc)?.values() ?? [])].some((e) => e.shown !== null && placeKey(e.shown) === k) || (other !== undefined && other !== id))
        )
      }
      const forced = over[r.code] !== undefined
      const shown = forced ? over[r.code] || undefined : nameOf(id, r.cc, home, true, avoid)
      const english = !rules.latin && (home || rules.spelledRegions?.includes(r.cc)) ? regionEnglish(id, r.name) : spellings(id, r.name)
      if (!shown) continue
      const pop = regionPop.get(r.code) ?? 0
      // At home, under the geocoders' other spellings too (Rules.regionForms: Khanh Hoa province, Thành phố Hà Nội).
      const forms = home ? (rules.regionForms?.({ shown, english }) ?? []) : []
      addDisplay(table, { english: [...english, ...forms], cc: r.cc, region: true, pop, home }, shown, { forced })
      // A region named like a town of its country gets a label of its own (Rules.regionLabel: استان قم, Tỉnh Thanh Hóa),
      // so the two rows of a search differ; its where-line name stays the plain one.
      const likeTown =
        !!townKeys.get(r.cc)?.has(placeKey(shown)) ||
        [...(table.get(r.cc) ?? [])].some(([key, e]) => !/^[*^#]/.test(key) && e.shown === shown)
      const label = likeTown ? rules.regionLabel?.({ shown, cc: r.cc, english: [...english, ...englishOf(id, r.name, true)], alts: alts.get(id)?.get(lang) }) : undefined
      if (label) addDisplay(table, { english: [r.name], cc: r.cc, region: false, pop, home }, label, { forced: true, label: true })
    }
    // Landmarks GeoNames knows, under their own (curated) English name, ranked as a city of a million. In a Latin
    // table only a feature named by the landmark's own name (not an airport's code or a nickname), and only a name
    // that is more than its English with words around it (not Mount Rushmore National Memorial).
    /** A landmark's name a town of its country shares is written for landmarks only (`^`: White House, Tennessee). */
    const sharedWithTown = (cc: string, english: string) => !!townKeys.get(cc)?.has(placeKey(english))
    LANDMARKS.forEach(([name, , , , cc], i) => {
      const hit = landmarkHit[i]
      const CC = cc.toUpperCase()
      const home = atHome(rules, CC, '')
      const shown = hit && (!rules.latin || hit.own) ? nameOf(hit.id, CC, home) : undefined
      if (shown) addDisplay(table, { english: [name], cc: CC, region: false, pop: 1e6, home }, shown, { landmark: sharedWithTown(CC, name) })
    })
    // The features at home the offline list carries (its lakes, castles, islands and airports), the best known first,
    // as many as the rules name (all in a Latin table, which writes only the names that differ), under the English
    // name the list shows them by: Starnberger See for Lake Starnberg, Heidelberger Schloss, Rügen.
    const named = (f: (typeof homeFeatures)[number]) => atHome(rules, f.cc, '') && !KEEPS_NAME.has(f.code) && (!rules.latin || ENGLISH_FEATURE.test(f.english))
    for (const f of homeFeatures.filter(named).slice(0, rules.homeFeatures ?? 0)) {
      const shown = nameOf(f.id, f.cc, true)
      // Not an abbreviation GeoNames lists as a name (DHM for the German Historical Museum).
      if (shown && !/^[\p{Lu}\d]{2,6}$/u.test(shown))
        addDisplay(table, { english: [f.english], cc: f.cc, region: false, pop: featurePop(f.names), home: true, feature: true }, shown, {
          landmark: sharedWithTown(f.cc, f.english),
        })
    }
    // Seas, oceans, gulfs and straits: countryless, and under the country the data files one under, if any (the
    // English Channel under GB), as a landmark's name there.
    for (const [id, w] of waters.slice(0, rules.waters)) {
      const fixed = over[`:${w.name}`]
      const shown = fixed === undefined ? nameOf(id, '', false) : fixed && cleanName(fixed, lang)
      if (!shown) continue
      const english = [...englishOf(id, w.name, rules.latin), ...(WATER_SPELLINGS[w.name] ?? [])]
      addDisplay(table, { english, cc: '', region: false, pop: w.names }, shown)
      if (w.cc) addDisplay(table, { english: [w.name], cc: w.cc, region: false, pop: w.names }, shown, { landmark: sharedWithTown(w.cc, w.name) })
    }
    // The curated places the offline list has a landmark row for, as the language's own copy names them, where the table
    // has no name for that key yet.
    for (const c of CURATED) {
      const shown = CURATED_IN[lang][c.id]?.label
      const landmark = sharedWithTown(c.cc, c.english)
      if (!shown || !c.cc || table.get(c.cc)?.has(`${landmark ? '^' : ''}${placeKey(c.english)}`)) continue
      addDisplay(table, { english: [c.english], cc: c.cc, region: false, pop: 1e6, home: atHome(rules, c.cc, '') }, cleanName(shown, lang), {
        forced: true,
        landmark,
      })
    }
    // Hand-made names given by English name (`CC:English`, `CC:*English` for a region, `CC:#English` for a region's own
    // label), countryless or in a country: written as given. A spelling of a place the table already names so (Photon's
    // Zaporizhzhia beside the list's Zaporizhzhya) comes right after it, where a search keeps the place under both.
    for (const [k, shown] of Object.entries(over)) {
      const at = k.indexOf(':')
      if (at < 0) continue
      const cc = k.slice(0, at)
      const region = k[at + 1] === '*'
      const label = k[at + 1] === '#'
      const english = k.slice(at + (region || label ? 2 : 1))
      const landmark = !region && !label && landmarkNames.has(`${cc}:${placeKey(english)}`) && sharedWithTown(cc, english)
      const had = table.get(cc)?.get(`${landmark ? '^' : region ? '*' : label ? '#' : ''}${placeKey(english)}`)
      if (had) {
        had.shown = shown ? cleanName(shown, lang) : null
        had.forced = true
      } else if (shown) {
        const name = cleanName(shown, lang)
        const twin = [...(table.get(cc) ?? [])].find(([key, e]) => e.shown === name && key.startsWith('*') === region && !/^[\^#]/.test(key))
        addDisplay(table, { english: [english], cc, region, pop: twin ? twin[1].pop - 1e-3 : 1e7, home: true }, name, { forced: true, landmark, label })
      }
    }
    // Namesakes too small for the table make its keys ambiguous only if they have names of their own (or, in a
    // Sino-Vietnamese reading, any name: Rules.ownNamesakes).
    for (const t of small) {
      const home = atHome(rules, t.cc, t.admin1)
      addNamesake(table, { english: spellings(t.id, t.name), cc: t.cc, region: false, pop: t.pop }, nameOf(t.id, t.cc, home), {
        ownNames: !!rules.ownNamesakes?.includes(t.cc),
      })
    }

    // Search names, by GeoNames id or by `CC:English` (a town of that name, the largest, or a landmark).
    const aliases: Alias[] = []
    for (const [k, names] of Object.entries(ALIASES[lang])) {
      const at = k.indexOf(':')
      const t = at < 0 ? towns.find((x) => x.id === k) : undefined
      const cc = t ? t.cc : k.slice(0, at)
      const english = t ? t.name : k.slice(at + 1)
      for (const alias of names) {
        const a = { cc, english, alias: cleanName(alias, lang) }
        if (!aliases.some((x) => x.cc === a.cc && x.english === a.english && x.alias === a.alias)) aliases.push(a)
      }
    }
    // And the large towns at home in another language's spelling (Rules.searchAs: Russian's for Ukrainian).
    if (rules.searchAs) {
      const { lang: other, minPop } = rules.searchAs
      const fold = (n: string) => n.toLowerCase().replace(/[іїы]/g, 'и').replace(/[єэ]/g, 'е').replace(/ґ/g, 'г').replace(/['’ʼ]/g, '')
      for (const t of towns) {
        if (t.section || t.pop < minPop || !atHome(rules, t.cc, t.admin1)) continue
        const theirs = OVERRIDES[other][t.id] || displayName(alts.get(t.id)?.get(other), other, { cc: t.cc, english: [t.name] })
        const ours = table.get(t.cc)?.get(placeKey(t.name))?.shown
        if (theirs && ours && fold(theirs) !== fold(ours) && !aliases.some((a) => a.cc === t.cc && a.english === t.name && a.alias === theirs))
          aliases.push({ cc: t.cc, english: t.name, alias: cleanName(theirs, lang) })
      }
    }
    const names = serializeDisplay(table, rules.latin, aliases)
    const entries = names ? names.split('|').reduce((n, g) => n + g.split(';').length, 0) : 0
    const bytes = Buffer.byteLength(names)
    const gz = gzipSync(names, { level: 9 }).length
    writeFileSync(
      `src/i18n/${lang}/exonyms.gen.ts`,
      `/**
 * Generated by scripts/build-exonyms.ts from GeoNames (CC BY 4.0). Do not edit: a wrong name is fixed in
 * scripts/exonyms.ts (OVERRIDES), then the table is generated again. Format: src/i18n/en/exonyms.ts.
 * ${entries} names, ${bytes} bytes, ${gz} compressed.
 */
export default ${literal(names)}
`,
    )
    report.push(`${lang}: ${entries} names, ${bytes} bytes, ${gz} gzip`)
    if (REVIEW) writeFileSync(join(REVIEW, `${lang}.txt`), names.split('|').flatMap((g) => g.split(';').map((e, i) => (i ? `${g.slice(0, g.indexOf(':'))}:${e}` : e))).join('\n') + '\n')
  }
  if (REVIEW) writeFileSync(join(REVIEW, 'waters.txt'), waters.map(([id, w]) => `${id}\t${w.name}\t${w.names}`).join('\n') + '\n')
  if (REVIEW)
    writeFileSync(
      join(REVIEW, 'features.tsv'),
      homeFeatures.map((f) => [f.id, f.cc, f.code, f.names, f.english, ...LANGS.map((l) => (alts.get(f.id)?.get(l) ?? []).map((a) => a.name).join(' / '))].join('\t')).join('\n') + '\n',
    )
  const found = landmarkHit.filter(Boolean).length
  console.log(`${towns.length} towns, ${regions.size} regions, ${found}/${LANDMARKS.length} landmarks, ${waters.length} waters (${((Date.now() - started) / 1000).toFixed(0)} s)`)
  for (const r of report) console.log(r)
  for (const [i, h] of landmarkHit.entries()) if (!h) console.log(`  landmark not in GeoNames: ${LANDMARKS[i][0]}`)
}

void main()
