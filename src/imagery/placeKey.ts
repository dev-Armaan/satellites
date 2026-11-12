/**
 * How a place name is matched, shared by the app (./localPlaces.ts) and the script that builds the offline place
 * list (scripts/build-places.ts), so the two can never disagree about which file a name lives in.
 *
 * A key is what someone would type: accents and case dropped ("Zürich" → "zurich"), letters with no decomposition
 * spelled out ("Łódź" → "lodz", "Ålesund" → "alesund"), apostrophes removed ("St. John's" → "st johns") and
 * every other run of punctuation a single space ("Stratford-upon-Avon" → "stratford upon avon").
 *
 * Dependency-free: the build script runs it under Node.
 */

const SPELLED: Record<string, string> = { ł: 'l', ø: 'o', æ: 'ae', œ: 'oe', ß: 'ss', đ: 'd', ð: 'd', þ: 'th', ı: 'i', ħ: 'h' }

export function placeKey(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[łøæœßđðþıħ]/g, (c) => SPELLED[c])
    .replace(/['’ʻ`]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

/** A key without its spaces: what search files are named by. */
export const compactKey = (key: string) => key.replace(/ /g, '')

/** The two-letter group a key's places are filed under. Undefined for non-Latin text. */
export function shardOf(key: string): string | undefined {
  const s = compactKey(key).slice(0, 2)
  return /^[a-z0-9]{2}$/.test(s) ? s : undefined
}

/** Search files hold at most this many places; a larger group is split by the next letter, down to this length. */
export const SHARD_MAX_PLACES = 800
export const SHARD_MAX_PREFIX = 7
/** A split group keeps a head file (`<prefix>_`) of its largest places, for a query no longer than its prefix. */
export const SHARD_HEAD_PLACES = 100

/**
 * The search file that holds every place a query can match, given the two-letter groups that exist and the
 * prefixes that are split: its group, that group's sub-group by the next letter while it is split, down to the
 * query's length. `head` is the last split group's head file (its largest places, and every place whose name is no
 * longer than its prefix), to read instead if `file` turns out not to exist (no name continues that way). Undefined
 * when no group starts that way.
 */
export function shardFor(key: string, groups: ReadonlySet<string>, split: ReadonlySet<string>): { file: string; head?: string } | undefined {
  const g = shardOf(key)
  if (!g || !groups.has(g)) return undefined
  const c = compactKey(key)
  let p = g
  let head: string | undefined
  while (split.has(p)) {
    head = `${p}_`
    if (c.length <= p.length) return { file: head }
    p = c.slice(0, p.length + 1)
  }
  return { file: p, head }
}

/** Map tiles for naming a spot: 5° on a side, 36 rows from the south pole by 72 columns from 180°W. */
export const TILE_DEG = 5
export const TILE_ROWS = 180 / TILE_DEG
export const TILE_COLS = 360 / TILE_DEG

/** The tile at (row, col), or the tile holding (lat, lon) with `tileAt`. Columns wrap; rows clamp. */
export function tileIndex(row: number, col: number): number {
  const r = Math.min(TILE_ROWS - 1, Math.max(0, row))
  const c = ((col % TILE_COLS) + TILE_COLS) % TILE_COLS
  return r * TILE_COLS + c
}

export function tileAt(lat: number, lon: number): { row: number; col: number } {
  return { row: Math.floor((lat + 90) / TILE_DEG), col: Math.floor((lon + 180) / TILE_DEG) }
}

/** A tile with more towns than this is written as its four quarters. */
export const TILE_MAX_PLACES = 1500

/**
 * The file (without `.txt`) holding (lat, lon)'s tile: `<i>`, or `<i>-<q>` for a quarter of a split tile, q = 2 × the
 * northern half + the eastern half.
 */
export function tileFile(lat: number, lon: number, split: boolean): string {
  const { row, col } = tileAt(lat, lon)
  const i = tileIndex(row, col)
  if (!split) return String(i)
  const north = (lat + 90) / TILE_DEG - row >= 0.5 ? 1 : 0
  const east = (((lon + 180) / TILE_DEG - col) % 1) >= 0.5 ? 1 : 0
  return `${i}-${north * 2 + east}`
}
