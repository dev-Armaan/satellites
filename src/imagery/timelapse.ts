/**
 * The time-lapse's frames: the same ten kilometres around a place, one clear Sentinel-2 photo a year since the
 * archive begins.
 *
 * Why it works the way it does (measured on nine places, 2026-11-13):
 *
 *  - Nothing here runs unless someone opens the time-lapse. A search costs what it did before.
 *  - Two light searches list the place's scenes (the STAC `fields` extension: 20–160 kB for eleven years, where the
 *    full items are megabytes): a small one to learn which tile and orbit see the place most, then every scene of
 *    that one geometry.
 *  - Frames need no alignment: every crop is cut on the place's own grid at whole native pixels (toneRender
 *    placeGrid), so the same ground is under the same pixel in every year. They are taken from ONE tile and ONE
 *    relative orbit (the pair with the most scenes), so the satellite looks from the same side every time and tall
 *    buildings do not lean back and forth.
 *  - The years turn through the seasons (owner, 2026-11-13): each year aims for the next quarter of the calendar
 *    (January, April, July, October, by the year's number), so a loop shows the place under snow, in leaf and dry,
 *    not eleven of the same afternoon. It is an aim, not a rule: a year whose quarter has no clear look takes its
 *    least cloudy scene of any date (Singapore gets 10 of 10 years that way, 2 if a season were required).
 *  - A scene's cloud percentage is for its whole 110 km tile. Each slot's least cloudy scenes are checked at the
 *    place itself (the cloud mask the photos already use), least cloudy first, and the first that shows at least
 *    95 % of the square is kept: usually the first one asked.
 *  - Haze passes the cloud mask and turns a frame milky (Toronto 2017, 2019, 2025). A 64 px render of the square
 *    tells: haze lifts the darkest blue (clean ≤ 0.025 of reflectance, hazy ≥ 0.047). A frame much hazier than the
 *    place's own median gives way to another clear scene of its slot, when there is one.
 *  - A scene can be listed, cloudless on paper and empty (isBlank): the same small render catches it, and the next
 *    scene of the year is asked instead.
 *  - Each frame is toned like every other photo (the pixels worker, one curve per photo), so a frame here is the
 *    picture the gallery would show for that day. Its bytes stay out of the photo cache (image.ts keeps 96 pictures
 *    for the session: a dozen frames would push the gallery's own photos out, and they would reload).
 *
 * Requests go from the browser to Planetary Computer and nowhere else. A request that times out is not asked again.
 */
import { mosaicDate } from '@/lib/geoCore'
import type { LatLon } from '@/types'
import { PC_STAC_SEARCH } from './endpoints'
import { tonedImageBlob } from './image'
import { fetchJson, isAbortError, mapLimit, throwIfAborted } from './net'
import { pcCropUrl, pcMaskUrl } from './pcCrop'
import { fetchMask, fetchPixels } from './pixelsClient'
import { clearFraction } from '../../api/_lib/tone'

const COLLECTION = 'sentinel-2-l2a'
const DAY = 86_400_000
/** Sentinel-2A's first public scenes. */
const ARCHIVE_START = Date.UTC(2015, 5, 23)
/** Half the side of every frame, km: the photos' own square. */
export const FRAME_HALF_KM = 5
/** Fewer frames than this is not a time-lapse. */
export const MIN_FRAMES = 3
/** The square must show at least this much ground (cloud and shadow 0, thin cirrus ½: tone.ts clearFraction). */
const MIN_CLEAR = 0.95
/** Scenes of one slot whose clear shares are this close show the same ground (firstClear), if it is at least this much. */
const SAME_GROUND = 0.03
const MIN_GROUND_CLEAR = 0.6
/** A scene is of the aimed-for quarter when it is within this many days of its middle. */
const SEASON_HALF_DAYS = 45
/** The middle day of each quarter a year can aim for (mid-January, mid-April, mid-July, mid-October). */
export const SEASON_DAYS = [15, 105, 196, 288] as const
/** Scenes of the aimed-for quarter asked about before any other date of the year gets a turn. */
const SEASON_TRIES = 3
/** Scenes asked about per slot before giving the slot up, and how many more a hazy pick may try. */
const TRIES = 5
const HAZE_RETRIES = 2
/** Scene cloud above which a scene is not listed at all. */
const MAX_SCENE_CLOUD = 50
/** A pick is hazy when its blue floor is this far above the place's median. */
const HAZE_RATIO = 1.7
const HAZE_MARGIN = 0.012

export interface Scene {
  id: string
  /** Acquisition time, ms */
  t: number
  /** Cloud over the whole tile, % */
  cloud: number
  tile: string
  orbit: number
  /** "Sentinel-2B" */
  platform: string
}

export interface Slot {
  /** The year */
  key: string
  /** Scenes to ask about, best first: the aimed-for quarter's, then the rest of the year's */
  candidates: Scene[]
  /** How many of them, at the front, are of the aimed-for quarter */
  inSeason: number
}

export interface TimelapsePlan {
  slots: Slot[]
}

export interface Frame {
  scene: Scene
  /** Local calendar date on the ground, "YYYY-MM-DD" */
  date: string
  /** Share of the square showing the ground, 0..1 */
  clear: number
  /** The toned picture, a blob: URL owned by the time-lapse (released by `releaseTimelapse`) */
  src: string
}

export type TimelapseProgress =
  | { phase: 'listing' }
  | { phase: 'choosing'; done: number; total: number }
  /** `src` is set on a frame once its picture is in */
  | { phase: 'loading'; frames: (Omit<Frame, 'src'> & { src?: string })[]; loaded: number }

export interface Timelapse {
  frames: Frame[]
  /** Years that had scenes to ask about */
  slots: number
}

// ── Listing ────────────────────────────────────────────────────────────────────────────────

interface LightItem {
  id: string
  properties?: Record<string, unknown>
}
interface LightPage {
  features?: LightItem[]
  links?: { rel: string; href: string; method?: string }[]
}

const FIELDS = ['id', 'properties.datetime', 'properties.eo:cloud_cover', 'properties.s2:mgrs_tile', 'properties.sat:relative_orbit', 'properties.platform', '-links', '-assets', '-geometry', '-bbox', '-stac_extensions', '-stac_version', '-collection', '-type'].join(',')
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 19) + 'Z'
const round6 = (n: number) => Math.round(n * 1e6) / 1e6

/** How far back the first, small search looks to learn which tiles and orbits see the place. */
const PROBE_DAYS = 120

export interface Geometry {
  tile: string
  orbit: number
}

function searchUrl(place: LatLon, start: number, end: number, limit: number, query?: Record<string, unknown>): string {
  const q = new URLSearchParams({
    collections: COLLECTION,
    intersects: JSON.stringify({ type: 'Point', coordinates: [round6(place.lon), round6(place.lat)] }),
    datetime: `${iso(start)}/${iso(end)}`,
    limit: String(limit),
    fields: FIELDS,
  })
  if (query) q.set('query', JSON.stringify(query))
  return `${PC_STAC_SEARCH}?${q}`
}

/** The first search: every recent scene of the place, whatever its cloud, to see which tiles and orbits cover it. */
export function probeUrl(place: LatLon, now: number): string {
  return searchUrl(place, now - PROBE_DAYS * DAY, now, 200)
}

/**
 * The second search: every scene of ONE tile and orbit since `start` under the cloud limit, a few fields each.
 * One geometry is at most a scene every five days (about 800 since 2015), so it fits the archive's 1000 a page: asked
 * for every geometry at once, a desert under four overlapping tiles and orbits (Groom Lake) filled the page with its
 * last year alone and the time-lapse lost the years before.
 */
export function sceneSearchUrl(place: LatLon, now: number, geometry?: Geometry): string {
  const start = ARCHIVE_START
  const query: Record<string, unknown> = { 'eo:cloud_cover': { lt: MAX_SCENE_CLOUD } }
  if (geometry) {
    query['s2:mgrs_tile'] = { eq: geometry.tile }
    query['sat:relative_orbit'] = { eq: geometry.orbit }
  }
  return searchUrl(place, start, now, 1000, query)
}

/** The tiles and orbits of `scenes`, the one with the most scenes first (ties: by name, the same for every visitor). */
export function rankGeometries(scenes: readonly Geometry[]): Geometry[] {
  const count = new Map<string, { g: Geometry; n: number }>()
  for (const s of scenes) {
    const k = `${s.tile}/${s.orbit}`
    const c = count.get(k)
    if (c) c.n++
    else count.set(k, { g: { tile: s.tile, orbit: s.orbit }, n: 1 })
  }
  return [...count.entries()].sort((a, b) => b[1].n - a[1].n || (a[0] < b[0] ? -1 : 1)).map(([, c]) => c.g)
}

/** The tile and orbit with the most scenes (ties: the first by name, so every visitor gets the same one). */
export function commonGeometry(scenes: readonly Geometry[]): Geometry | undefined {
  return rankGeometries(scenes)[0]
}

const platformName = (p: unknown) => (typeof p === 'string' && /^sentinel-2[a-d]$/i.test(p) ? `Sentinel-2${p.slice(-1).toUpperCase()}` : 'Sentinel-2')

export function sceneOf(item: LightItem): Scene | null {
  const p = item.properties ?? {}
  const t = Date.parse(String(p.datetime ?? ''))
  const cloud = Number(p['eo:cloud_cover'])
  const tile = p['s2:mgrs_tile']
  const orbit = Number(p['sat:relative_orbit'])
  if (!item.id || !Number.isFinite(t) || !Number.isFinite(cloud) || typeof tile !== 'string' || !Number.isFinite(orbit)) return null
  return { id: item.id, t, cloud, tile, orbit, platform: platformName(p.platform) }
}

async function searchScenes(url: string, signal?: AbortSignal): Promise<Scene[]> {
  const out: Scene[] = []
  let next: string | undefined = url
  for (let page = 0; next && page < 2; page++) {
    const r: LightPage = await fetchJson<LightPage>(next, { signal, timeoutMs: 12_000, retries: 1, retryTimeouts: false })
    for (const f of r.features ?? []) {
      const s = sceneOf(f)
      if (s) out.push(s)
    }
    const link = r.links?.find((l) => l.rel === 'next' && (l.method ?? 'GET').toUpperCase() === 'GET')
    next = r.features?.length ? link?.href : undefined
  }
  return out
}

/**
 * The geometry to take the frames from: the commonest one whose newest scene covers the whole square. A place near a
 * tile's edge is inside two tiles, and the one that ends inside the square would put a black strip in every frame
 * (Groom Lake, tile 11SNB). With no geometry that covers it, the commonest.
 */
async function chooseGeometry(recent: readonly Scene[], place: LatLon, signal?: AbortSignal): Promise<Geometry | undefined> {
  const ranked = rankGeometries(recent)
  for (const g of ranked.slice(0, 4)) {
    const newest = recent.filter((s) => s.tile === g.tile && s.orbit === g.orbit).sort((a, b) => b.t - a.t)[0]
    const r = await fetchMask(pcMaskUrl(COLLECTION, newest.id, place), signal).catch(() => undefined)
    throwIfAborted(signal)
    if (r?.mask && noDataShare(r.mask.cls) <= MAX_NO_DATA) return g
  }
  return ranked[0]
}

async function listScenes(place: LatLon, now: number, signal?: AbortSignal): Promise<Scene[]> {
  // A place nothing has photographed in four months (no geometry) is asked about without one.
  const geometry = await chooseGeometry(await searchScenes(probeUrl(place, now), signal), place, signal)
  return searchScenes(sceneSearchUrl(place, now, geometry), signal)
}

// ── Planning (pure) ────────────────────────────────────────────────────────────────────────

const dayOfYear = (date: string) => (Date.parse(date) - Date.UTC(Number(date.slice(0, 4)), 0, 1)) / DAY
const byCloud = (a: Scene, b: Scene) => a.cloud - b.cloud || b.t - a.t

/** The scenes of the tile and orbit with the most of them, one per day. */
export function oneGeometry(scenes: readonly Scene[], lon: number): Scene[] {
  const g = commonGeometry(scenes)
  const days = new Map<string, Scene>()
  for (const s of scenes) {
    if (!g || s.tile !== g.tile || s.orbit !== g.orbit) continue
    const d = mosaicDate(s.t, lon)
    const prev = days.get(d)
    if (!prev || byCloud(s, prev) < 0) days.set(d, s)
  }
  return [...days.values()]
}

/** The middle day of the quarter a year aims for: the quarters in turn, by the year's number. */
export const seasonDayOf = (year: number): number => SEASON_DAYS[((year % 4) + 4) % 4]

/** Days between two days of the year, the short way round New Year. */
const dayGap = (a: number, b: number) => Math.min(Math.abs(a - b), 365 - Math.abs(a - b))

/** Which scenes to ask about, year by year (oldest first): the aimed-for quarter's least cloudy, then any date's. */
export function planTimelapse(all: readonly Scene[], place: LatLon): TimelapsePlan {
  const years = new Map<string, Scene[]>()
  for (const s of oneGeometry(all, place.lon)) {
    const y = mosaicDate(s.t, place.lon).slice(0, 4)
    const list = years.get(y)
    if (list) list.push(s)
    else years.set(y, [s])
  }
  return {
    slots: [...years.entries()]
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([key, list]) => {
        const aim = seasonDayOf(Number(key))
        const near = (s: Scene) => dayGap(dayOfYear(mosaicDate(s.t, place.lon)), aim) <= SEASON_HALF_DAYS
        const season = list.filter(near).sort(byCloud).slice(0, SEASON_TRIES)
        const rest = list.filter((s) => !season.includes(s)).sort(byCloud)
        return { key, candidates: [...season, ...rest].slice(0, TRIES + HAZE_RETRIES), inSeason: season.length }
      }),
  }
}

/** The darkest blue of a 64 px encoded render (2nd percentile, linear reflectance): what haze lifts. */
export function blueFloor(rgba: ArrayLike<number>): number {
  const blue: number[] = []
  for (let i = 2; i < rgba.length; i += 4) blue.push((rgba[i] / 255) * (rgba[i] / 255))
  if (!blue.length) return 0
  blue.sort((a, b) => a - b)
  return blue[Math.floor(blue.length * 0.02)]
}

/** What `haze` answers for a scene with no picture in it. */
export const BLANK = -1
/** Mean of each pixel's brightest channel (encoded, 0–255) under which a render is empty: open water is 40 or more. */
const BLANK_BELOW = 14

/**
 * Is there a picture in this render? A few scenes in the archive are listed, cloud-free by their own metadata and
 * all but empty (Groom Lake, 9 Sep 2015, from the satellite's first weeks: mean values 6, 2, 2 of 255). Toned, the
 * noise in them stretches to a red and black frame, which opened the loop and the exported video.
 */
export function isBlank(rgba: ArrayLike<number>): boolean {
  let sum = 0
  let n = 0
  for (let i = 0; i + 2 < rgba.length; i += 4, n++) sum += Math.max(rgba[i], rgba[i + 1], rgba[i + 2])
  return n === 0 || sum / n < BLANK_BELOW
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b)
  return s.length ? s[s.length >> 1] : 0
}

// ── Choosing and loading ───────────────────────────────────────────────────────────────────

/** What the choice asks the archive, replaceable in tests. */
export interface TimelapseDeps {
  list: (place: LatLon, now: number, signal?: AbortSignal) => Promise<Scene[]>
  /**
   * Share of the square showing the ground, or undefined when the mask can't be read or the scene does not cover the
   * whole square (a tile or a swath that ends inside it leaves a black strip)
   */
  clear: (scene: Scene, place: LatLon, signal?: AbortSignal) => Promise<number | undefined>
  /** The blue floor of a small render; BLANK when the render holds no picture; undefined when it can't be read */
  haze: (scene: Scene, place: LatLon, signal?: AbortSignal) => Promise<number | undefined>
  /** The toned frame, as a blob: URL */
  frame: (scene: Scene, place: LatLon, px: number, signal?: AbortSignal) => Promise<string>
}

const cropUrl = (scene: Scene, place: LatLon, px: number) => pcCropUrl(COLLECTION, scene.id, place, { halfSizeKm: FRAME_HALF_KM, px }).replace(/\.png\?/, '.jpg?')

/** Cells of the mask with no data, as a share: above this the scene does not cover the square. */
const MAX_NO_DATA = 0.02

export function noDataShare(cls: ArrayLike<number>): number {
  let n = 0
  for (let i = 0; i < cls.length; i++) if (cls[i] === 0) n++
  return cls.length ? n / cls.length : 1
}

/** The scene's mask over the square: how much of it shows the ground; undefined if unreadable or not fully covered. */
async function squareOf(scene: Scene, place: LatLon, signal?: AbortSignal): Promise<{ clear: number } | undefined> {
  const r = await fetchMask(pcMaskUrl(COLLECTION, scene.id, place), signal)
  if (!r.mask || noDataShare(r.mask.cls) > MAX_NO_DATA) return undefined
  const clear = clearFraction(r.mask)
  return clear === undefined ? undefined : { clear }
}

const realDeps: TimelapseDeps = {
  list: listScenes,
  clear: async (scene, place, signal) => (await squareOf(scene, place, signal))?.clear,
  haze: async (scene, place, signal) => {
    const r = await fetchPixels(cropUrl(scene, place, 64), signal)
    return r.pixels ? (isBlank(r.pixels.data) ? BLANK : blueFloor(r.pixels.data)) : undefined
  },
  frame: async (scene, place, px, signal) => URL.createObjectURL(await tonedImageBlob(cropUrl(scene, place, px), { signal, timeoutMs: 20_000 })),
}

interface Pick {
  scene: Scene
  clear: number
  haze?: number
}

/** One archive question, with its own deadline; a failure is "can't say" (undefined), an abort is an abort. */
async function ask<T>(fn: (signal: AbortSignal) => Promise<T | undefined>, signal: AbortSignal | undefined, ms = 9_000): Promise<T | undefined> {
  throwIfAborted(signal)
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), ms)
  const onAbort = () => ctl.abort()
  signal?.addEventListener('abort', onAbort, { once: true })
  try {
    return await fn(ctl.signal)
  } catch (err) {
    if (signal?.aborted) throw err
    return undefined
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onAbort)
  }
}

/**
 * The first candidate from `from` on (at most `tries`) that is clear at the place, with its haze measured.
 *
 * Bright ground reads as cloud in the archive's older classifications: Groom Lake's dry lake bed is "cloud" over 18 %
 * of the square in every scene before 2022, so no scene of those years reached 95 % and the years were left out.
 * Cloud moves and ground does not: when nothing is clear enough but three scenes of the slot agree on the same share
 * (within SAME_GROUND), that share is the ground's, and the least cloudy of them is taken.
 */
async function firstClear(slot: Slot, from: number, tries: number, place: LatLon, deps: TimelapseDeps, signal?: AbortSignal): Promise<{ pick: Pick; index: number } | undefined> {
  const end = Math.min(slot.candidates.length, from + tries)
  /** The scene as a pick, unless its small render shows it holds no picture (BLANK): then it is nobody's frame. */
  const take = async (index: number, clear: number): Promise<{ pick: Pick; index: number } | undefined> => {
    const scene = slot.candidates[index]
    const haze = await ask((s) => deps.haze(scene, place, s), signal)
    return haze === BLANK ? undefined : { pick: { scene, clear, haze }, index }
  }
  const seen: { index: number; clear: number }[] = []
  for (let i = from; i < end; i++) {
    const clear = await ask((s) => deps.clear(slot.candidates[i], place, s), signal)
    if (clear === undefined) continue
    if (clear < MIN_CLEAR) {
      seen.push({ index: i, clear })
      continue
    }
    const got = await take(i, clear)
    if (got) return got
  }
  for (const a of seen) {
    if (a.clear < MIN_GROUND_CLEAR || seen.filter((b) => Math.abs(b.clear - a.clear) <= SAME_GROUND).length < 3) continue
    const got = await take(a.index, a.clear)
    if (got) return got
  }
  return undefined
}

export interface TimelapseOptions {
  /** Frame side, px */
  px: number
  now?: number
  signal?: AbortSignal
  onProgress?: (p: TimelapseProgress) => void
  deps?: Partial<TimelapseDeps>
}

/**
 * Build the time-lapse of a place. Resolves with the frames that loaded, oldest first (possibly fewer than
 * MIN_FRAMES: the caller says so); rejects when the archive can't be listed, and on abort (every blob made so far is
 * released first).
 */
export async function buildTimelapse(place: LatLon, opts: TimelapseOptions): Promise<Timelapse> {
  const { signal, onProgress } = opts
  const now = opts.now ?? Date.now()
  const deps = { ...realDeps, ...opts.deps }
  onProgress?.({ phase: 'listing' })
  const plan = planTimelapse(await deps.list(place, now, signal), place)
  throwIfAborted(signal)

  // The clear look of each slot, six slots at a time (a slot asks one thing at a time).
  let done = 0
  onProgress?.({ phase: 'choosing', done, total: plan.slots.length })
  const first = await mapLimit(plan.slots, 6, async (slot) => {
    const r = await firstClear(slot, 0, TRIES, place, deps, signal)
    onProgress?.({ phase: 'choosing', done: ++done, total: plan.slots.length })
    return r
  })
  // A pick much hazier than the place usually is gives way to a cleaner clear scene of its slot, if one is found.
  const usual = median(first.flatMap((r) => (r?.pick.haze !== undefined ? [r.pick.haze] : [])))
  const hazy = (h: number | undefined) => h !== undefined && h > Math.max(usual * HAZE_RATIO, usual + HAZE_MARGIN)
  const picks = await mapLimit(plan.slots, 6, async (slot, i) => {
    const got = first[i]
    if (!got || !hazy(got.pick.haze)) return got?.pick
    // Only another scene of the same quarter can stand in: snow lifts the blue floor too, and a winter frame must
    // not lose its place to a summer one for being white.
    const tries = Math.min(HAZE_RETRIES, slot.inSeason - (got.index + 1))
    if (tries <= 0) return got.pick
    const other = await firstClear(slot, got.index + 1, tries, place, deps, signal)
    return other && (other.pick.haze ?? Infinity) < got.pick.haze! ? other.pick : got.pick
  })
  throwIfAborted(signal)

  const chosen = picks.filter((p): p is Pick => !!p).sort((a, b) => a.scene.t - b.scene.t)
  const meta: (Omit<Frame, 'src'> & { src?: string })[] = chosen.map((p) => ({ scene: p.scene, date: mosaicDate(p.scene.t, place.lon), clear: p.clear }))
  let loaded = 0
  onProgress?.({ phase: 'loading', frames: meta, loaded })
  const made: string[] = []
  try {
    const srcs = await mapLimit(chosen, 6, async (p, k) => {
      try {
        const src = await deps.frame(p.scene, place, opts.px, signal)
        made.push(src)
        meta[k] = { ...meta[k], src }
        onProgress?.({ phase: 'loading', frames: [...meta], loaded: ++loaded })
        return src
      } catch (err) {
        if (isAbortError(err) || signal?.aborted) throw err
        return undefined // this frame did not come: the others still play
      }
    })
    throwIfAborted(signal)
    const frames = meta.flatMap((m, i) => (srcs[i] ? [{ ...m, src: srcs[i]! }] : []))
    return { frames, slots: plan.slots.length }
  } catch (err) {
    for (const src of made) URL.revokeObjectURL(src)
    throw err
  }
}

/** Give a time-lapse's pictures back (its blob: URLs). Nothing may show them afterwards. */
export function releaseTimelapse(t: Timelapse): void {
  for (const f of t.frames) URL.revokeObjectURL(f.src)
}
