/**
 * Build the offline place list the app names places from without a network geocoder (src/imagery/localPlaces.ts):
 *
 *   public/places/<version>/s/<ab>.txt   search: every place whose name starts with those letters, largest first.
 *                                        Two letters, or more where that group is large ("san", "sant"): no file
 *                                        holds more than 800 places, so a typed search fetches one of ~1–20 kB
 *                                        (placeKey.ts shardFor). A split group's `<ab>_.txt` holds its largest.
 *   public/places/<version>/t/<i>.txt    naming a spot: the towns and cities in one 5° tile (placeKey.ts tileIndex).
 *   src/imagery/localPlaces.gen.ts       the version, which shards exist and a bitmap of which tiles exist, so the
 *                                        app never asks for a file that isn't there (a 404 is not cached).
 *
 * Each line is `name|lat|lon|cc|admin1|p|kind|ascii`, trailing empty fields dropped: p is the population on a log
 * scale (round(20·log10)), kind is '' for a settlement, 'r' for a state or province and 'c' for a country, and ascii
 * the GeoNames ASCII name only where the name itself has no Latin key. Country names in sublabels come from
 * Intl.DisplayNames in the browser, so they cost no bytes here.
 *
 * Source: GeoNames (CC BY 4.0): cities1000 (every settlement of 1,000+ people and every seat of government),
 * admin1CodesASCII, countryInfo, and allCountries for the coordinates of states and countries (only those rows are
 * kept). The output is committed; the version directory changes with each build, so the files can be cached as
 * immutable. City data changes slowly: rebuild a few times a year, not on a schedule, since every rebuild adds the
 * whole list (~5 MB compressed) to git history.
 *
 * Usage: tsx scripts/build-places.ts <dir with the GeoNames downloads>
 *   The dir must hold cities1000.zip, admin1CodesASCII.txt, countryInfo.txt and allCountries.zip from
 *   https://download.geonames.org/export/dump/ (needs `unzip` on the PATH).
 */
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createInterface } from 'node:readline'
import { compactKey, placeKey, SHARD_HEAD_PLACES, SHARD_MAX_PLACES, SHARD_MAX_PREFIX, shardOf, TILE_COLS, TILE_ROWS, tileAt, tileIndex } from '../src/imagery/placeKey'

const SRC = process.argv[2]
if (!SRC) throw new Error('usage: tsx scripts/build-places.ts <geonames dir>')
const OUT = 'public/places'
const GEN = 'src/imagery/localPlaces.gen.ts'

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
  kind: '' | 'r' | 'c'
  section: boolean
}

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

async function* unzipLines(zip: string): AsyncGenerator<string> {
  const p = spawn('unzip', ['-p', zip], { stdio: ['ignore', 'pipe', 'inherit'] })
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

  // Coordinates of states and countries, from the full dump (only the rows we need are kept).
  const wanted = new Set<string>([...admin1.values()].map((a) => a.id).concat([...countries.values()].map((c) => c.id)))
  const coords = new Map<string, [number, number]>()
  for await (const l of unzipLines(join(SRC, 'allCountries.zip'))) {
    const tab = l.indexOf('\t')
    if (!wanted.has(l.slice(0, tab))) continue
    const p = l.split('\t')
    coords.set(p[0], [Number(p[4]), Number(p[5])])
  }

  const entries: Entry[] = []
  const regionPop = new Map<string, number>()
  for await (const l of unzipLines(join(SRC, 'cities1000.zip'))) {
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
  entries.sort((a, b) => b.pop - a.pop || a.name.localeCompare(b.name))
  markDistricts(entries)

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
  const tiles = new Map<number, string[]>()
  for (const e of entries) {
    if (e.kind || e.section) continue
    const { row, col } = tileAt(e.lat, e.lon)
    const i = tileIndex(row, col)
    let list = tiles.get(i)
    if (!list) tiles.set(i, (list = []))
    list.push(line(e, false))
  }

  const version = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  if (existsSync(OUT)) for (const d of readdirSync(OUT)) rmSync(join(OUT, d), { recursive: true })
  mkdirSync(join(OUT, version, 's'), { recursive: true })
  mkdirSync(join(OUT, version, 't'), { recursive: true })
  for (const [k, v] of shards) writeFileSync(join(OUT, version, 's', `${k}.txt`), v.join('\n') + '\n')
  for (const [k, v] of tiles) writeFileSync(join(OUT, version, 't', `${k}.txt`), v.join('\n') + '\n')

  const bits = new Uint8Array(Math.ceil((TILE_ROWS * TILE_COLS) / 8))
  for (const i of tiles.keys()) bits[i >> 3] |= 1 << (i & 7)
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
`,
  )
  console.log(`${entries.length} places, ${shards.size} shards, ${tiles.size} tiles → ${OUT}/${version}`)
}

void main()
