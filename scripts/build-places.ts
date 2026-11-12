/**
 * Build the offline place list the app names places from without a network geocoder (src/imagery/localPlaces.ts):
 *
 *   public/places/<version>/s/<ab>.txt   search: every place whose name starts with those letters, largest first.
 *                                        Two letters, or more where that group is large ("san", "sant"): no file
 *                                        holds more than 800 places, so a typed search fetches one of ~1–20 kB
 *                                        (placeKey.ts shardFor). A split group's `<ab>_.txt` holds its largest.
 *   public/places/<version>/t/<i>.txt    naming a spot: the towns and cities in one 5° tile (placeKey.ts tileIndex),
 *                                        or `<i>-<q>.txt` for each quarter of a tile with more than 1,500.
 *   public/places/<version>/l.txt        landmarks (scripts/landmarks.ts, and the landing's Surprise me and example
 *                                        places): `name|lat|lon|cc|where|alias;alias`, one small file for every search.
 *   src/imagery/localPlaces.gen.ts       the version, which search groups exist and which are split, and which tiles
 *                                        exist and which are quartered, so the app rarely asks for a missing file.
 *
 * Each line is `name|lat|lon|cc|admin1|p|kind|ascii`, trailing empty fields dropped: p is the population on a log
 * scale (round(20·log10)), kind is '' for a settlement, 'r' for a state or province, 'c' for a country and 'f' for a
 * named feature or building (ranked by how many names it has: featurePop), and ascii
 * the GeoNames ASCII name only where the name itself has no Latin key. Country names in sublabels come from
 * Intl.DisplayNames in the browser, so they cost no bytes here.
 *
 * Source: GeoNames (CC BY 4.0): cities500 (every settlement of 500+ people and every seat of government),
 * admin1CodesASCII, countryInfo, allCountries (the coordinates of states and countries, and the features in
 * FEATURES) and alternateNamesV2 (which features have an English Wikipedia article, and their English names). ~316,000
 * places. The output is committed; the version directory changes with each build, so the files can be cached as
 * immutable. Place data changes slowly: rebuild a few times a year, not on a schedule, since every rebuild adds the
 * whole list (~10 MB compressed) to git history.
 *
 * Usage: NODE_OPTIONS=--max-old-space-size=6000 npm run data:places <dir with the GeoNames downloads>
 *   The dir must hold cities500.zip, admin1CodesASCII.txt, countryInfo.txt, allCountries.zip and
 *   alternateNamesV2.zip from https://download.geonames.org/export/dump/ (~650 MB; needs `unzip` on the PATH).
 *   Takes ~2 minutes and ~4 GB of memory.
 */
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createInterface } from 'node:readline'
import { EXAMPLE_PLACES, SURPRISE_PLACES } from '../src/ui/landing/places'
import { LANDMARKS } from './landmarks'
import { compactKey, placeKey, SHARD_HEAD_PLACES, SHARD_MAX_PLACES, SHARD_MAX_PREFIX, shardOf, TILE_COLS, TILE_MAX_PLACES, TILE_ROWS, tileAt, tileFile, tileIndex } from '../src/imagery/placeKey'

const SRC = process.argv[2]
if (!SRC) throw new Error('usage: tsx scripts/build-places.ts <geonames dir>')
const OUT = 'public/places'
const GEN = 'src/imagery/localPlaces.gen.ts'

/**
 * Named features and buildings people look for from orbit (GeoNames feature codes), kept only if they have an
 * English Wikipedia article: a mountain, lake or dam with one is one people have heard of; the thousands without
 * one would bury the real answers.
 */
const FEATURES = new Set(
  [
    ...['MT', 'MTS', 'PK', 'PKS', 'VLC', 'ISL', 'ISLS', 'ATOL', 'CNYN', 'DSRT', 'PEN', 'CAPE', 'CRTR', 'MESA', 'GRGE', 'DLTA'],
    ...['LK', 'LKS', 'LKN', 'BAY', 'BAYS', 'GLCR', 'STRT', 'LGN', 'RSV', 'FLLS', 'RF', 'GULF', 'FJD', 'SD', 'SEA', 'CNL', 'GYSR'],
    ...['PRK', 'RESN', 'RESF', 'RESW'],
    ...['AIRP', 'STDM', 'DAM', 'MNMT', 'CSTL', 'UNIV', 'PAL', 'TMPL', 'MUS', 'BDG', 'TOWR', 'PYR', 'PYRS', 'RUIN', 'ANS'],
    ...['OBS', 'ZOO', 'HSTS', 'CTRS', 'SQR', 'OPRA', 'WALL', 'GDN', 'FT', 'MN'],
  ],
)

/** Feature codes left out: historical, abandoned or destroyed places, and religious centres. */
const SKIP = new Set(['PPLH', 'PPLQ', 'PPLW', 'PPLCH', 'PPLR'])
/** Sections of a city (neighbourhoods): searchable only if large, and never a pin's name (the city is). */
const SECTION = 'PPLX'
const SECTION_MIN_POP = 10_000

interface Entry {
  name: string
  ascii: string
  lat: number
  lon: number
  cc: string
  admin1: string
  pop: number
  kind: '' | 'r' | 'c' | 'f'
  section: boolean
}

/**
 * A feature has no population to rank by. How many names it has (languages, spellings) says how widely it is known:
 * ranked as a place of 10^(2 + 1.5·log10(names + 1)) people, e.g. ~3,000 for a lake with 9 names, ~1 million for a
 * mountain with 50, capped at 10 million.
 */
const featurePop = (names: number) => Math.min(1e7, 10 ** (2 + 1.5 * Math.log10(names + 1)))

/**
 * GeoNames lists some cities' districts as towns of their own, named after the city ("Paris 16 Passy", "Lyon 03"):
 * a pin there should read "Paris". A place whose name continues the name of a larger place within 20 km is marked a
 * section: searchable, never a pin's name.
 */
function markDistricts(entries: Entry[]) {
  const cell = (lat: number, lon: number) => `${Math.floor(lat * 4)}|${Math.floor(lon * 4)}`
  const grid = new Map<string, Entry[]>()
  for (const e of entries) {
    if (e.kind) continue
    const k = cell(e.lat, e.lon)
    const list = grid.get(k) ?? []
    list.push(e)
    grid.set(k, list)
  }
  for (const e of entries) {
    if (e.kind || e.section) continue
    const key = placeKey(e.name)
    const r0 = Math.floor(e.lat * 4)
    const c0 = Math.floor(e.lon * 4)
    search: for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++)
        for (const o of grid.get(`${r0 + dr}|${c0 + dc}`) ?? []) {
          if (o === e || o.pop <= e.pop || !key.startsWith(`${placeKey(o.name)} `)) continue
          if (Math.hypot(o.lat - e.lat, (o.lon - e.lon) * Math.cos((e.lat * Math.PI) / 180)) > 0.18) continue // ~20 km
          e.section = true
          break search
        }
  }
}

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
  const admin1 = new Map<string, { name: string; id: string }>()
  for (const p of tsv('admin1CodesASCII.txt')) admin1.set(p[0], { name: p[1], id: p[3] })
  const countries = new Map<string, { name: string; pop: number; id: string }>()
  for (const p of tsv('countryInfo.txt')) countries.set(p[0], { name: p[4], pop: Number(p[7]) || 0, id: p[16] })

  // Pass 1 over the full dump: which rows are candidate features.
  const candidates = new Set<string>()
  for await (const l of unzipLines(join(SRC, 'allCountries.zip'))) {
    const p = l.split('\t', 8)
    if (FEATURES.has(p[7])) candidates.add(p[0])
  }
  // The alternate names: which candidates have an English Wikipedia article, and their English names.
  const notable = new Set<string>()
  const english = new Map<string, { name: string; preferred: boolean }>()
  for await (const l of unzipLines(join(SRC, 'alternateNamesV2.zip'), 'alternateNamesV2.txt')) {
    const p = l.split('\t')
    if (!candidates.has(p[1])) continue
    if (p[2] === 'link' && p[3].includes('en.wikipedia.org/')) notable.add(p[1])
    else if (p[2] === 'en' && p[6] !== '1' && p[7] !== '1' && !/[|;]/.test(p[3])) {
      const preferred = p[4] === '1'
      const had = english.get(p[1])
      if (!had || (preferred && !had.preferred)) english.set(p[1], { name: p[3], preferred })
    }
  }
  candidates.clear()

  // Pass 2: the coordinates of states and countries, and the notable features.
  const wanted = new Set<string>([...admin1.values()].map((a) => a.id).concat([...countries.values()].map((c) => c.id)))
  const coords = new Map<string, [number, number]>()
  const features: Entry[] = []
  for await (const l of unzipLines(join(SRC, 'allCountries.zip'))) {
    const id = l.slice(0, l.indexOf('\t'))
    const isFeature = notable.has(id)
    if (!wanted.has(id) && !isFeature) continue
    const p = l.split('\t')
    coords.set(id, [Number(p[4]), Number(p[5])])
    if (!isFeature) continue
    const name = english.get(id)?.name ?? p[1]
    const names = p[3] ? p[3].split(',').length : 0
    const code = `${p[8]}.${p[10]}`
    features.push({ name, ascii: p[2], lat: Number(p[4]), lon: Number(p[5]), cc: p[8], admin1: admin1.get(code)?.name ?? '', pop: featurePop(names), kind: 'f', section: false })
  }

  const entries: Entry[] = []
  const regionPop = new Map<string, number>()
  for await (const l of unzipLines(join(SRC, 'cities500.zip'))) {
    const p = l.split('\t')
    if (p.length < 15 || SKIP.has(p[7])) continue
    const pop = Number(p[14]) || 0
    const section = p[7] === SECTION
    if (section && pop < SECTION_MIN_POP) continue
    const code = `${p[8]}.${p[10]}`
    if (!section) regionPop.set(code, (regionPop.get(code) ?? 0) + pop)
    entries.push({ name: p[1], ascii: p[2], lat: Number(p[4]), lon: Number(p[5]), cc: p[8], admin1: admin1.get(code)?.name ?? '', pop, kind: '', section })
  }
  // A state named like a city at the same spot ("Tokyo", "Kyiv City") would be a second row for the same thing: keep
  // the city.
  const cityAt = new Map<string, [number, number][]>()
  for (const e of entries) {
    const k = `${e.cc}|${placeKey(e.name)}`
    const list = cityAt.get(k) ?? []
    list.push([e.lat, e.lon])
    cityAt.set(k, list)
  }
  const near = (a: [number, number], b: [number, number]) => Math.hypot(a[0] - b[0], (a[1] - b[1]) * Math.cos((a[0] * Math.PI) / 180)) < 0.9 // ~100 km
  for (const [code, a] of admin1) {
    const c = coords.get(a.id)
    if (!c) continue
    const cc = code.split('.')[0]
    const key = placeKey(a.name).replace(/ (city|municipality)$/, '')
    if (cityAt.get(`${cc}|${key}`)?.some((p) => near(p, c))) continue
    entries.push({ name: a.name, ascii: a.name, lat: c[0], lon: c[1], cc: code.split('.')[0], admin1: '', pop: regionPop.get(code) ?? 0, kind: 'r', section: false })
  }
  for (const [cc, k] of countries) {
    const c = coords.get(k.id)
    if (!c) continue
    entries.push({ name: k.name, ascii: k.name, lat: c[0], lon: c[1], cc, admin1: '', pop: k.pop, kind: 'c', section: false })
  }
  markDistricts(entries)
  // Features named exactly like a town within 10 km of it are the same place to a searcher ("Monaco", "Gibraltar").
  const townAt = new Map<string, [number, number][]>()
  for (const e of entries) if (!e.kind) townAt.set(placeKey(e.name), [...(townAt.get(placeKey(e.name)) ?? []), [e.lat, e.lon]])
  for (const f of features) {
    const close = townAt.get(placeKey(f.name))?.some(([la, lo]) => Math.abs(la - f.lat) < 0.09 && Math.abs(lo - f.lon) < 0.12)
    if (!close && placeKey(f.name)) entries.push(f)
  }
  entries.sort((a, b) => b.pop - a.pop || a.name.localeCompare(b.name))

  const line = (e: Entry, withAscii: boolean) =>
    [e.name, e.lat.toFixed(3), e.lon.toFixed(3), e.cc, e.admin1, e.pop > 0 ? Math.round(20 * Math.log10(e.pop)) : 0, e.kind, withAscii ? e.ascii : '']
      .map(String)
      .join('|')
      .replace(/\|+$/, '')

  // Two-letter groups, split by the next letter while larger than SHARD_MAX_PLACES (placeKey.ts shardFor).
  const groups = new Map<string, { key: string; line: string }[]>()
  for (const e of entries) {
    let key = placeKey(e.name)
    let withAscii = false
    if (!shardOf(key)) {
      key = placeKey(e.ascii)
      withAscii = true
    }
    const shard = shardOf(key)
    if (!shard) continue
    const list = groups.get(shard) ?? []
    list.push({ key: compactKey(key), line: line(e, withAscii) })
    groups.set(shard, list)
  }
  const shards = new Map<string, string[]>()
  const emit = (prefix: string, list: { key: string; line: string }[]) => {
    if (list.length <= SHARD_MAX_PLACES || prefix.length >= SHARD_MAX_PREFIX) {
      shards.set(prefix, list.map((x) => x.line))
      return
    }
    const short = list.filter((x) => x.key.length <= prefix.length)
    const head = [...new Set([...list.slice(0, SHARD_HEAD_PLACES), ...short])].sort((a, b) => list.indexOf(a) - list.indexOf(b))
    shards.set(`${prefix}_`, head.map((x) => x.line))
    const next = new Map<string, { key: string; line: string }[]>()
    for (const x of list) {
      if (x.key.length <= prefix.length) continue
      const k = x.key.slice(0, prefix.length + 1)
      const l = next.get(k) ?? []
      l.push(x)
      next.set(k, l)
    }
    for (const [k, l] of next) emit(k, l)
  }
  for (const [k, list] of groups) emit(k, list)
  // Pin tiles: towns only. A tile with more than TILE_MAX_PLACES is written as its four quarters (placeKey.ts tileFile).
  const byTile = new Map<number, Entry[]>()
  for (const e of entries) {
    if (e.kind || e.section) continue
    const { row, col } = tileAt(e.lat, e.lon)
    const i = tileIndex(row, col)
    const list = byTile.get(i) ?? []
    list.push(e)
    byTile.set(i, list)
  }
  const tiles = new Map<string, string[]>()
  const splitTiles: number[] = []
  for (const [i, list] of byTile) {
    if (list.length <= TILE_MAX_PLACES) {
      tiles.set(String(i), list.map((e) => line(e, false)))
      continue
    }
    splitTiles.push(i)
    for (const e of list) {
      const f = tileFile(e.lat, e.lon, true)
      tiles.set(f, [...(tiles.get(f) ?? []), line(e, false)])
    }
  }

  // Landmarks: the curated list, then the landing's own places, except those that are just a city in the list
  // already ("Paris", "Tokyo"), which would otherwise come back with the chip's sublabel.
  const cityNear = (name: string, lat: number, lon: number) =>
    entries.some((e) => !e.kind && Math.abs(e.lat - lat) < 0.3 && Math.abs(e.lon - lon) < 0.3 && placeKey(e.name) === placeKey(name))
  const landmarks = new Map<string, string>()
  const addLandmark = (name: string, where: string, lat: number, lon: number, cc: string, aliases: string[] = []) => {
    const k = placeKey(name)
    if (landmarks.has(k) || /[|;\n]/.test(name + where + aliases.join(''))) return
    landmarks.set(k, [name, lat.toFixed(4), lon.toFixed(4), cc.toUpperCase(), where, aliases.join(';')].join('|').replace(/\|+$/, ''))
  }
  for (const [name, where, lat, lon, cc, aliases] of LANDMARKS) addLandmark(name, where, lat, lon, cc, aliases)
  for (const p of [...EXAMPLE_PLACES, ...SURPRISE_PLACES]) {
    if (!p.countryCode || cityNear(p.label, p.lat, p.lon)) continue
    addLandmark(p.label, p.sublabel ?? '', p.lat, p.lon, p.countryCode, 'chip' in p && p.chip !== p.label ? [String(p.chip)] : [])
  }

  const version = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  if (existsSync(OUT)) for (const d of readdirSync(OUT)) rmSync(join(OUT, d), { recursive: true })
  mkdirSync(join(OUT, version, 's'), { recursive: true })
  mkdirSync(join(OUT, version, 't'), { recursive: true })
  for (const [k, v] of shards) writeFileSync(join(OUT, version, 's', `${k}.txt`), v.join('\n') + '\n')
  for (const [k, v] of tiles) writeFileSync(join(OUT, version, 't', `${k}.txt`), v.join('\n') + '\n')
  writeFileSync(join(OUT, version, 'l.txt'), [...landmarks.values()].join('\n') + '\n')

  const bits = new Uint8Array(Math.ceil((TILE_ROWS * TILE_COLS) / 8))
  for (const i of byTile.keys()) bits[i >> 3] |= 1 << (i & 7)
  writeFileSync(
    GEN,
    `/**
 * Generated by scripts/build-places.ts from GeoNames (CC BY 4.0). Do not edit.
 * ${entries.length} places in ${shards.size} search files and ${tiles.size} tiles.
 */
export const PLACES_VERSION = '${version}'
/** The two-letter groups that exist, run together (placeKey.ts shardFor). */
export const PLACE_GROUPS = '${[...shards.keys()].map((k) => k.slice(0, 2)).filter((k, i, a) => a.indexOf(k) === i).sort().join('')}'
/** The prefixes split into longer ones, comma-separated (placeKey.ts shardFor). */
export const PLACE_SPLIT = '${[...shards.keys()].filter((k) => k.endsWith('_')).map((k) => k.slice(0, -1)).sort().join(',')}'
/** Which tiles exist: bit i of the decoded bytes is tile i (placeKey.ts tileIndex). */
export const PLACE_TILES = '${Buffer.from(bits).toString('base64')}'
/** The tiles written as four quarters, comma-separated (placeKey.ts tileFile). */
export const PLACE_TILES_SPLIT = '${splitTiles.sort((a, b) => a - b).join(',')}'
`,
  )
  console.log(`${entries.length} places, ${landmarks.size} landmarks, ${shards.size} shards, ${tiles.size} tiles → ${OUT}/${version}`)
}

void main()
