/**
 * The admin map's geometry: searched 0.1° cells gathered into spots, sized by area, named from the page's own list.
 *
 * Why spots and not cells: a city is several cells, and at 4–5 px a degree they land on the same pixels, so drawn one
 * circle a cell New York is a stack of rings. The busiest cell seeds a spot and every cell within REACH of it joins
 * (largest first, so a spot is centred on its hottest cell); what is left over further out seeds its own.
 *
 * Why area: a circle's area is its searches, the one size people read without a key (the grid this replaced used a
 * logarithm, and had to say so). One place can have 500 times the median, so most spots would be under a pixel: those
 * are dust, one small grey dot each, and the key says from which count down that is (`dustCount`).
 *
 * Why names come from the list beside the map: the stats hold labels and cells separately, and the nearest town to a
 * cell is the wrong name for what was searched (Central Park's cell is nearest North Bergen, Area 51's is nearest
 * nothing). So each of the top labels is looked up in the offline place list and given to the spot it lands in.
 */
import type { Ranked } from './api'

/** Degrees. Cells this near a busier one are the same spot: about 2 px on a laptop, a metropolitan area on the ground. */
export const REACH = 0.5
/** The band of latitude always shown: the inhabited world. Searches beyond it widen the band to themselves. */
export const BAND = { north: 78, south: -58 }
const BAND_MARGIN = 4

export interface Spot {
  /** The busiest cell's centre */
  lat: number
  lon: number
  /** Searches in all its cells */
  n: number
  cells: number
  /** From the page's top places (nameSpots), when one of them is here */
  name?: string
}

export interface PlaceMap {
  /** Largest first, so drawn in order a small spot is never under a large one */
  spots: Spot[]
  /** Searches in the busiest spot (at least 1) */
  max: number
  /** Cells that had a readable position, and their searches */
  cells: number
  searches: number
  north: number
  south: number
  /** Cell key → index in `spots` */
  at: Map<string, number>
}

export const cellKey = (lat: number, lon: number): string => `${(Math.round(lat * 10) / 10 || 0).toFixed(1)},${(Math.round(lon * 10) / 10 || 0).toFixed(1)}`

export function placeMap(cells: Ranked | undefined, reach = REACH): PlaceMap {
  const rows: [number, number, number][] = []
  for (const [c, n] of cells ?? []) {
    const [lat, lon] = c.split(',').map(Number)
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180 || !(n > 0)) continue
    rows.push([lat, lon, n])
  }
  rows.sort((a, b) => b[2] - a[2] || a[0] - b[0] || a[1] - b[1])
  const spots: Spot[] = []
  const at = new Map<string, number>()
  // Seeds by square of side `reach`: a cell's spot, if it has one, is in its own square or one of the eight around it.
  const cols = Math.ceil(360 / reach)
  const seeds = new Map<number, number[]>()
  const square = (lat: number, lon: number) => [Math.floor((lat + 90) / reach), Math.floor((lon + 180) / reach)]
  for (const [lat, lon, n] of rows) {
    const [j, i] = square(lat, lon)
    let best = -1
    let bestD = reach * reach
    for (let dj = -1; dj <= 1; dj++)
      for (let di = -1; di <= 1; di++)
        for (const k of seeds.get((j + dj) * cols + ((i + di + cols) % cols)) ?? []) {
          const dLon = Math.abs(spots[k].lon - lon)
          const d = (spots[k].lat - lat) ** 2 + Math.min(dLon, 360 - dLon) ** 2
          if (d <= bestD) {
            best = k
            bestD = d
          }
        }
    if (best < 0) {
      best = spots.push({ lat, lon, n: 0, cells: 0 }) - 1
      const key = j * cols + i
      seeds.set(key, [...(seeds.get(key) ?? []), best])
    }
    spots[best].n += n
    spots[best].cells++
    at.set(cellKey(lat, lon), best)
  }
  // A spot can outgrow a busier seed once its neighbours join: order by what is drawn.
  const order = spots.map((_, i) => i).sort((a, b) => spots[b].n - spots[a].n || a - b)
  const rank = new Map(order.map((i, r) => [i, r]))
  for (const [k, i] of at) at.set(k, rank.get(i)!)
  const sorted = order.map((i) => spots[i])
  let { north, south } = BAND
  for (const s of sorted) {
    north = Math.max(north, s.lat + BAND_MARGIN)
    south = Math.min(south, s.lat - BAND_MARGIN)
  }
  return { spots: sorted, max: Math.max(1, sorted[0]?.n ?? 0), cells: rows.length, searches: rows.reduce((a, r) => a + r[2], 0), north: Math.min(90, north), south: Math.max(-90, south), at }
}

/** The largest circle's radius for a map `width` px wide: big enough to rank the top places by eye, small enough that
 *  the busiest one covers a state and not a continent. */
export const maxRadius = (width: number): number => Math.max(10, Math.min(28, width / 46))
/** A spot whose circle would be smaller than this is drawn as dust: one small grey dot, the same for all of them.
 *  Under two pixels a circle's size cannot be read, and hundreds of them in signal bury the places that matter. */
export const DUST_BELOW = 2.2
export const DUST_RADIUS = 1.1

/** The largest circle stands for at least this many searches: in a range's first minutes, when the busiest place has
 *  one search, one search is not drawn as the largest circle there is. */
export const FULL_AT = 16

/** Radius in px: area in proportion to searches. Dust (under DUST_BELOW) is not drawn at this size. */
export function spotRadius(n: number, max: number, rMax: number): number {
  return rMax * Math.sqrt(Math.max(0, n) / Math.max(FULL_AT, max))
}

/** How many circles a map `width` px wide carries before they run together: about 120 on a laptop, 55 on a phone. */
export const maxCircles = (width: number): number => Math.round(width / 7)

/**
 * The count at and under which a spot is dust (0 when every spot is a circle): where a circle would be too small to
 * read, and past the `most` busiest spots. The second matters on a quiet day, when the busiest place has 200 searches
 * and by size alone every place with 6 would be a circle. `spots` is largest first.
 */
export function dustCount(spots: Spot[], max: number, rMax: number, most = Infinity): number {
  const tooSmall = Math.ceil(Math.max(FULL_AT, max) * (DUST_BELOW / rMax) ** 2) - 1
  return Math.max(0, tooSmall, spots[most]?.n ?? 0)
}

/** Round counts for the key's circles, largest first: 1, 2 or 5 times a power of ten, each a circle clearly smaller
 *  than the one before and none of them dust. */
export function keyCounts(max: number, rMax: number, dust = 0): number[] {
  const out: number[] = []
  const nice = (v: number) => {
    const p = 10 ** Math.floor(Math.log10(v))
    return (v / p >= 5 ? 5 : v / p >= 2 ? 2 : 1) * p
  }
  let v = max
  while (out.length < 3 && v >= 1) {
    const c = nice(v)
    if (c <= dust || spotRadius(c, max, rMax) < Math.max(3, DUST_BELOW)) break
    out.push(c)
    v = c / 4.5 // the next circle: about half the radius
  }
  return out
}

/** "37.2°N 115.8°W" */
export function fmtLatLon(lat: number, lon: number): string {
  const part = (v: number, pos: string, neg: string) => `${Math.abs(v).toFixed(1)}°${v === 0 ? '' : v > 0 ? pos : neg}`
  return `${part(lat, 'N', 'S')} ${part(lon, 'E', 'W')}`
}

/** "38.7K" on the map, where a full number would not fit beside its circle. */
export function fmtShort(n: number): string {
  if (n < 1000) return String(n)
  if (n < 1e6) return `${(n / 1e3).toFixed(n < 99_950 ? 1 : 0).replace(/\.0$/, '')}K`
  return `${(n / 1e6).toFixed(1).replace(/\.0$/, '')}M`
}

export interface Found {
  lat: number
  lon: number
  /** The whole name was asked for, not a longer name that starts with it */
  exact?: boolean
}

/**
 * Names for the spots that the top places fall in. `labels` is the page's list ("Groom Lake, Nevada, United States"),
 * `found` what the offline list answers for a label's first part. Among the answers that are that name exactly, the
 * one in the busiest spot is the place meant ("Washington" is the capital, not the state's middle, when the capital
 * has the searches); a spot keeps the first name it is given, which is the most searched one.
 * Returns the names by spot index; the map is not changed.
 */
export function nameSpots(map: PlaceMap, labels: Ranked | undefined, found: (name: string) => Found[] | undefined): Map<number, string> {
  const names = new Map<number, string>()
  for (const [label] of labels ?? []) {
    const name = label.split(',')[0].trim()
    if (!name) continue
    let best = -1
    for (const f of found(name) ?? []) {
      if (!f.exact) continue
      const i = map.at.get(cellKey(f.lat, f.lon))
      if (i !== undefined && (best < 0 || i < best)) best = i
    }
    if (best >= 0 && !names.has(best)) names.set(best, name)
  }
  return names
}

export interface Box {
  x: number
  y: number
  w: number
  h: number
}
const hits = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h

export interface Tag {
  spot: number
  /** The text's box: it starts at x, and its middle line is y + h / 2 */
  x: number
  y: number
  w: number
  h: number
  /** From the circle's edge to the text, when the text could not sit against the circle */
  leader?: [number, number, number, number]
}

/** Where a tag may sit, nearest first: against the circle (east, west, north, south), then further out on a leader. */
const TAG_SIDES: [number, number][] = [[1, 0], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 1], [-1, -1], [-1, 1]]
const TAG_OUT = [0, 12, 24]

/**
 * Where each named spot's tag goes. The first free place is taken: beside the circle, else above or below it, else
 * further out with a leader back to it, else not at all (the name is still in the hover plate). `avoid` is what a tag
 * must not cover: the large circles (a tag may touch its own, `own` is its index there) and the key. Earlier tags
 * (busier spots) are placed first and keep their place.
 */
export function placeTags(wanted: { spot: number; cx: number; cy: number; r: number; w: number; own?: number }[], avoid: Box[], frame: Box, h = 12, gap = 5): Tag[] {
  const placed: Box[] = []
  const out: Tag[] = []
  for (const t of wanted) {
    place: for (const far of TAG_OUT)
      for (const [dx, dy] of TAG_SIDES) {
        if (!far && dx && dy) continue // against the circle a corner is no nearer than a side
        const u = Math.hypot(dx, dy)
        const reach = t.r + gap + far
        const ax = t.cx + (dx / u) * reach
        const ay = t.cy + (dy / u) * reach
        const box = { x: dx > 0 ? ax : dx < 0 ? ax - t.w : ax - t.w / 2, y: dy > 0 ? ay : dy < 0 ? ay - h : ay - h / 2, w: t.w, h }
        if (box.x < frame.x || box.x + box.w > frame.x + frame.w || box.y < frame.y || box.y + box.h > frame.y + frame.h) continue
        // One pixel of air around the text, so two tags never read as one line
        const air = { x: box.x - 3, y: box.y - 1, w: box.w + 6, h: box.h + 2 }
        if (placed.some((p) => hits(p, air)) || avoid.some((c, i) => i !== t.own && hits(c, air))) continue
        placed.push(air)
        const leader: Tag['leader'] = far ? [t.cx + (dx / u) * (t.r + 2), t.cy + (dy / u) * (t.r + 2), t.cx + (dx / u) * (reach - 3), t.cy + (dy / u) * (reach - 3)] : undefined
        out.push({ spot: t.spot, ...box, leader })
        break place
      }
  }
  return out
}
