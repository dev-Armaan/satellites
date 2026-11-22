/**
 * Fetch the live GP (OMM) catalog from CelesTrak and write the compact catalog files the app loads:
 *
 *   public/data/catalog.json        v2 columnar format (src/engine/catalog.ts CatalogFileV2): NORAD ids
 *                                   delta-encoded, epochs as seconds after fetchedAt to 10 ms (≤ 40 m along
 *                                   track), mean motion to 1e-7 rev/day (≤ 30 m over a week), the rest as
 *                                   CelesTrak publishes them, no international designators, and names only for
 *                                   profiled ("featured") objects. 40 % smaller gzipped than the v1 rows
 *                                   (810 → 482 kB; brotli smaller still). Errors stay far below SGP4's own (~1 km).
 *   public/data/catalog-names.json  every object's name by NORAD id, loaded by the app in idle time for
 *                                   hover labels (src/engine/catalog.ts loadCatalogNames).
 *
 * Runs in GitHub Actions on a schedule (.github/workflows/catalog.yml; it must commit BOTH files).
 * CelesTrak asks clients not to re-download the same data more than once every 2 hours, and to stop asking on
 * any answer but 200: scripts/celestrak.ts asks that way, inside a deadline that fits the job's timeout. The schedule
 * comes every 3 hours and `--if-older-than` turns a slot away while the catalog is young, so the catalog is
 * refreshed about every 6 hours and a failed run is followed 3 hours later, not at the next refresh (GitHub drops
 * scheduled runs: in November 2026 it ran two of the four a day, and two failures in a row left the catalog 36 hours
 * old).
 *
 * Usage: tsx scripts/fetch-catalog.ts [outPath] [--from <existing catalog.json>] [--if-older-than <hours>]
 *   --from re-encodes an existing catalog file (v1 or v2) without contacting CelesTrak.
 *   --if-older-than does nothing (writes nothing, asks nothing) while outPath was fetched less than <hours> ago.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { CatalogFile, CatalogRow } from '../src/types'
import { resolveProfile } from '../src/engine/profiles'
import { fetchGroup, isFresh, Refused, type Omm } from './celestrak'

const args = process.argv.slice(2)
const flag = (name: string) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}
const FROM = flag('--from')
const IF_OLDER = flag('--if-older-than')
const OUT = args.filter((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'))[0] ?? 'public/data/catalog.json'
const NAMES_OUT = join(dirname(OUT), 'catalog-names.json')
/** How long the run may ask CelesTrak: the job's 10 minutes, less setting up, encoding and pushing. */
const ASK_MS = 6 * 60_000

// GROUP=active is ~12k+ payloads. We also pull a few groups that include non-"active" but relevant objects.
// CelesTrak has no 'noaa' group any more (its answer: "GROUP=noaa not found"); NOAA's satellites are in 'weather'.
const GROUPS = ['active', 'stations', 'weather', 'resource', 'planet', 'goes', 'sarsat']

const round = (x: number, d: number) => Math.round(x * 10 ** d) / 10 ** d
/** Round to `n` significant digits (BSTAR, ṅ/2, n̈/6: their published precision is ~4–5 digits). */
const sig = (x: number, n: number) => (x === 0 || !Number.isFinite(x) ? x : Number(x.toPrecision(n)))
const delta = (xs: number[]) => xs.map((x, i) => (i ? x - xs[i - 1] : x))

/** CelesTrak epochs carry no zone suffix; they are UTC. */
const epochMs = (iso: string) => Date.parse(/[zZ]|[+-]\d\d:\d\d$/.test(iso) ? iso : `${iso}Z`)

async function fetchRows(): Promise<{ rows: CatalogRow[]; fetchedAt: string; source: string }> {
  const byId = new Map<number, Omm>()
  const deadline = Date.now() + ASK_MS
  for (const g of GROUPS) {
    try {
      const list = await fetchGroup(g, { deadline })
      for (const o of list) {
        const prev = byId.get(o.NORAD_CAT_ID)
        if (!prev || prev.EPOCH < o.EPOCH) byId.set(o.NORAD_CAT_ID, o)
      }
      console.log(`[catalog] ${g}: ${list.length}`)
    } catch (e) {
      const refused = e instanceof Refused
      if (refused) console.warn(`[catalog] CelesTrak answered ${(e as Refused).message} for ${g}: asking nothing more this run`)
      // Without the active group there is no catalog; the others mostly add to it.
      if (g === 'active') throw e
      if (refused) break
      console.warn(`[catalog] skipping ${g}: ${(e as Error).message}`)
    }
  }
  const rows: CatalogRow[] = [...byId.values()]
    .filter((o) => Number.isFinite(o.MEAN_MOTION) && o.MEAN_MOTION > 0)
    .map((o) => [
      o.NORAD_CAT_ID,
      o.OBJECT_NAME.trim(),
      o.OBJECT_ID,
      o.EPOCH,
      o.MEAN_MOTION,
      o.ECCENTRICITY,
      o.INCLINATION,
      o.RA_OF_ASC_NODE,
      o.ARG_OF_PERICENTER,
      o.MEAN_ANOMALY,
      o.BSTAR,
      o.MEAN_MOTION_DOT,
      o.MEAN_MOTION_DDOT,
    ])
  return { rows, fetchedAt: new Date().toISOString(), source: 'CelesTrak GP' }
}

/** Rows from an existing file, v1 or v2 (for --from). */
function readRows(path: string): { rows: CatalogRow[]; fetchedAt: string; source: string } {
  const f = JSON.parse(readFileSync(path, 'utf8')) as CatalogFile & { v?: number; [k: string]: unknown }
  if (f.v !== 2) return { rows: f.rows, fetchedAt: f.fetchedAt, source: f.source }
  const v2 = f as unknown as Record<string, number[]> & { name: string[]; fetchedAt: string; source: string }
  const t0 = Date.parse(v2.fetchedAt)
  let id = 0
  let names: Map<number, string> | undefined
  try {
    const nf = JSON.parse(readFileSync(join(dirname(path), 'catalog-names.json'), 'utf8')) as { norad: number[]; name: string[] }
    let acc = 0
    names = new Map(nf.norad.map((d, k) => [(acc += d), nf.name[k]]))
  } catch {
    /* names stay as they are */
  }
  const rows = v2.norad.map((d, k): CatalogRow => {
    id += d
    const iso = new Date(Math.round(t0 + v2.epoch[k] * 1000)).toISOString().slice(0, -1)
    return [id, v2.name[k] || names?.get(id) || '', '', iso, v2.n[k], v2.e[k], v2.i[k], v2.raan[k], v2.argp[k], v2.ma[k], v2.bstar[k], v2.ndot[k], v2.nddot[k]]
  })
  return { rows, fetchedAt: v2.fetchedAt, source: v2.source }
}

/** The fetch time of the catalog at `path`, if there is one. */
function fetchedAtOf(path: string): string | undefined {
  try {
    const v = (JSON.parse(readFileSync(path, 'utf8')) as { fetchedAt?: unknown }).fetchedAt
    return typeof v === 'string' ? v : undefined
  } catch {
    return undefined
  }
}

async function main() {
  if (IF_OLDER !== undefined && !FROM) {
    const hours = Number(IF_OLDER)
    if (!(hours > 0)) throw new Error(`--if-older-than takes hours, got ${IF_OLDER}`)
    const at = fetchedAtOf(OUT)
    if (isFresh(at, hours)) {
      console.log(`[catalog] ${OUT} was fetched at ${at}, less than ${hours} h ago: nothing to do`)
      return
    }
  }
  const { rows: raw, fetchedAt, source } = FROM ? readRows(FROM) : await fetchRows()
  const rows = raw.filter((r) => Number.isFinite(r[4]) && r[4] > 0).sort((a, b) => a[0] - b[0])
  if (rows.length < 5000) throw new Error(`suspiciously small catalog: ${rows.length}`)
  const t0 = Date.parse(fetchedAt)
  const featured = (r: CatalogRow) => {
    const p = resolveProfile(r[0], r[1].trim())
    return !!p && p.category !== 'other'
  }
  const file = {
    v: 2,
    fetchedAt,
    source,
    count: rows.length,
    norad: delta(rows.map((r) => r[0])),
    epoch: rows.map((r) => round((epochMs(r[3]) - t0) / 1000, 2)),
    n: rows.map((r) => round(r[4], 7)),
    e: rows.map((r) => round(r[5], 7)),
    i: rows.map((r) => round(r[6], 4)),
    raan: rows.map((r) => round(r[7], 4)),
    argp: rows.map((r) => round(r[8], 4)),
    ma: rows.map((r) => round(r[9], 4)),
    bstar: rows.map((r) => sig(r[10], 5)),
    ndot: rows.map((r) => sig(r[11], 4)),
    nddot: rows.map((r) => sig(r[12], 3)),
    name: rows.map((r) => (featured(r) ? r[1].trim() : '')),
  }
  const names = { fetchedAt, norad: delta(rows.map((r) => r[0])), name: rows.map((r) => r[1].trim()) }
  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, JSON.stringify(file))
  writeFileSync(NAMES_OUT, JSON.stringify(names))
  console.log(`[catalog] wrote ${rows.length} objects (${file.name.filter(Boolean).length} named) → ${OUT}, names → ${NAMES_OUT}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
