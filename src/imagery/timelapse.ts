/**
 * The time-lapse's frames: the same ten kilometres around a place, one clear Sentinel-2 photo a year since the
 * archive begins (`years`), or one every few weeks of the last twelve months (`seasons`).
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
 *  - `years` keeps to one season where there are seasons (the same ±45 days of every year, the stretch with a nearly
 *    cloud-free scene in the most years), so what changes between frames is the place, not the leaves or the snow.
 *    Inside the tropics there is no such season and far fewer clear days: any day of the year counts (Singapore: 2
 *    frames with a season, 10 of 10 years without).
 *  - A scene's cloud percentage is for its whole 110 km tile. Each slot's least cloudy scenes are checked at the
 *    place itself (the cloud mask the photos already use), least cloudy first, and the first that shows at least
 *    95 % of the square is kept: usually the first one asked.
 *  - Haze passes the cloud mask and turns a frame milky (Toronto 2017, 2019, 2025). A 64 px render of the square
 *    tells: haze lifts the darkest blue (clean ≤ 0.025 of reflectance, hazy ≥ 0.047). A frame much hazier than the
 *    place's own median gives way to another clear scene of its slot, when there is one.
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

export type TimelapseMode = 'years' | 'seasons'

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
/** `years`: a scene counts toward a season when it is within this of the season's middle day. */
const SEASON_HALF_DAYS = 45
/** `seasons`: slots across the last twelve months (about 20 days each). */
const SEASON_SLOTS = 18
/** Scenes asked about per slot before giving the slot up, and how many more a hazy pick may try. */
const TRIES: Record<TimelapseMode, number> = { years: 5, seasons: 3 }
const HAZE_RETRIES = 2
/** Scene cloud above which a scene is not listed at all. */
const MAX_SCENE_CLOUD: Record<TimelapseMode, number> = { years: 50, seasons: 70 }
/** Between the tropics there is no season to keep to. */
const TROPIC_LAT = 23.5
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
  key: string
  /** Scenes to ask about, best first */
  candidates: Scene[]
}

export interface TimelapsePlan {
  mode: TimelapseMode
  /** Middle day of the season kept to (day of the year, 0-based); undefined when any day counts */
  seasonDay?: number
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
  | { phase: 'loading'; frames: Omit<Frame, 'src'>[]; loaded: number }

export interface Timelapse {
  mode: TimelapseMode
  frames: Frame[]
  /** Slots that had scenes to ask about (a year, or a stretch of the year) */
  slots: number
  seasonDay?: number
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
 * The second search: every scene of ONE tile and orbit since `start` under the mode's cloud limit, a few fields each.
 * One geometry is at most a scene every five days (about 800 since 2015), so it fits the archive's 1000 a page: asked
 * for every geometry at once, a desert under four overlapping tiles and orbits (Groom Lake) filled the page with its
 * last year alone and the time-lapse lost the years before.
 */
export function sceneSearchUrl(place: LatLon, mode: TimelapseMode, now: number, geometry?: Geometry): string {
  const start = mode === 'years' ? ARCHIVE_START : now - 365 * DAY
  const query: Record<string, unknown> = { 'eo:cloud_cover': { lt: MAX_SCENE_CLOUD[mode] } }
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

async function listScenes(place: LatLon, mode: TimelapseMode, now: number, signal?: AbortSignal): Promise<Scene[]> {
  // A place nothing has photographed in four months (no geometry) is asked about without one.
  const geometry = await chooseGeometry(await searchScenes(probeUrl(place, now), signal), place, signal)
  return searchScenes(sceneSearchUrl(place, mode, now, geometry), signal)
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

/**
 * The season `years` keeps to: the middle day (of ten, mid-February to mid-November) whose ±45 days hold a scene under 10 % cloud in the
 * most years; ties go to the higher sun. Windows that straddle New Year are left out, so a frame's year is the year
 * it was taken. Undefined in the tropics.
 */
export function seasonDay(scenes: readonly Scene[], place: LatLon): number | undefined {
  if (Math.abs(place.lat) < TROPIC_LAT) return undefined
  const solstice = place.lat >= 0 ? 172 : 355
  let best: { day: number; years: number; off: number } | undefined
  for (let m = 1; m <= 10; m++) {
    const day = m * 30.4 + 15
    const years = new Set<string>()
    for (const s of scenes) {
      const d = mosaicDate(s.t, place.lon)
      if (s.cloud < 10 && Math.abs(dayOfYear(d) - day) <= SEASON_HALF_DAYS) years.add(d.slice(0, 4))
    }
    const off = Math.min(Math.abs(day - solstice), 365 - Math.abs(day - solstice))
    if (!best || years.size > best.years || (years.size === best.years && off < best.off)) best = { day, years: years.size, off }
  }
  return best && best.years > 0 ? best.day : undefined
}

/** Which scenes to ask about, slot by slot (oldest slot first), best candidate first. */
export function planTimelapse(all: readonly Scene[], place: LatLon, mode: TimelapseMode, now: number): TimelapsePlan {
  const scenes = oneGeometry(all, place.lon)
  const slots = new Map<string, Scene[]>()
  const put = (key: string, s: Scene) => {
    const list = slots.get(key)
    if (list) list.push(s)
    else slots.set(key, [s])
  }
  let season: number | undefined
  if (mode === 'years') {
    season = seasonDay(scenes, place)
    for (const s of scenes) {
      const d = mosaicDate(s.t, place.lon)
      if (season !== undefined && Math.abs(dayOfYear(d) - season) > SEASON_HALF_DAYS) continue
      put(d.slice(0, 4), s)
    }
  } else {
    const span = (365 * DAY) / SEASON_SLOTS
    for (const s of scenes) {
      const i = SEASON_SLOTS - 1 - Math.floor((now - s.t) / span)
      if (i >= 0 && i < SEASON_SLOTS) put(String(i).padStart(2, '0'), s)
    }
  }
  return {
    mode,
    seasonDay: season,
    slots: [...slots.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([key, list]) => ({ key, candidates: list.sort(byCloud).slice(0, TRIES[mode] + HAZE_RETRIES) })),
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

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b)
  return s.length ? s[s.length >> 1] : 0
}

// ── Choosing and loading ───────────────────────────────────────────────────────────────────

/** What the choice asks the archive, replaceable in tests. */
export interface TimelapseDeps {
  list: (place: LatLon, mode: TimelapseMode, now: number, signal?: AbortSignal) => Promise<Scene[]>
  /**
   * Share of the square showing the ground, or undefined when the mask can't be read or the scene does not cover the
   * whole square (a tile or a swath that ends inside it leaves a black strip)
   */
  clear: (scene: Scene, place: LatLon, signal?: AbortSignal) => Promise<number | undefined>
  /** The blue floor of a small render, or undefined when it can't be read */
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
    return r.pixels ? blueFloor(r.pixels.data) : undefined
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
  const seen: { index: number; clear: number }[] = []
  let found: { index: number; clear: number } | undefined
  for (let i = from; i < Math.min(slot.candidates.length, from + tries) && !found; i++) {
    const clear = await ask((s) => deps.clear(slot.candidates[i], place, s), signal)
    if (clear === undefined) continue
    if (clear >= MIN_CLEAR) found = { index: i, clear }
    else seen.push({ index: i, clear })
  }
  if (!found) {
    for (const a of seen) {
      if (a.clear >= MIN_GROUND_CLEAR && seen.filter((b) => Math.abs(b.clear - a.clear) <= SAME_GROUND).length >= 3) {
        found = a
        break
      }
    }
  }
  if (!found) return undefined
  const scene = slot.candidates[found.index]
  return { pick: { scene, clear: found.clear, haze: await ask((s) => deps.haze(scene, place, s), signal) }, index: found.index }
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
export async function buildTimelapse(place: LatLon, mode: TimelapseMode, opts: TimelapseOptions): Promise<Timelapse> {
  const { signal, onProgress } = opts
  const now = opts.now ?? Date.now()
  const deps = { ...realDeps, ...opts.deps }
  onProgress?.({ phase: 'listing' })
  const plan = planTimelapse(await deps.list(place, mode, now, signal), place, mode, now)
  throwIfAborted(signal)

  // The clear look of each slot, six slots at a time (a slot asks one thing at a time).
  let done = 0
  onProgress?.({ phase: 'choosing', done, total: plan.slots.length })
  const first = await mapLimit(plan.slots, 6, async (slot) => {
    const r = await firstClear(slot, 0, TRIES[mode], place, deps, signal)
    onProgress?.({ phase: 'choosing', done: ++done, total: plan.slots.length })
    return r
  })
  // A pick much hazier than the place usually is gives way to a cleaner clear scene of its slot, if one is found.
  const usual = median(first.flatMap((r) => (r?.pick.haze !== undefined ? [r.pick.haze] : [])))
  const hazy = (h: number | undefined) => h !== undefined && h > Math.max(usual * HAZE_RATIO, usual + HAZE_MARGIN)
  const picks = await mapLimit(plan.slots, 6, async (slot, i) => {
    const got = first[i]
    if (!got || !hazy(got.pick.haze)) return got?.pick
    const other = await firstClear(slot, got.index + 1, HAZE_RETRIES, place, deps, signal)
    return other && (other.pick.haze ?? Infinity) < got.pick.haze! ? other.pick : got.pick
  })
  throwIfAborted(signal)

  const chosen = picks.filter((p): p is Pick => !!p).sort((a, b) => a.scene.t - b.scene.t)
  const meta = chosen.map((p) => ({ scene: p.scene, date: mosaicDate(p.scene.t, place.lon), clear: p.clear }))
  let loaded = 0
  onProgress?.({ phase: 'loading', frames: meta, loaded })
  const made: string[] = []
  try {
    const srcs = await mapLimit(chosen, 6, async (p) => {
      try {
        const src = await deps.frame(p.scene, place, opts.px, signal)
        made.push(src)
        onProgress?.({ phase: 'loading', frames: meta, loaded: ++loaded })
        return src
      } catch (err) {
        if (isAbortError(err) || signal?.aborted) throw err
        return undefined // this frame did not come: the others still play
      }
    })
    throwIfAborted(signal)
    const frames = meta.flatMap((m, i) => (srcs[i] ? [{ ...m, src: srcs[i] }] : []))
    return { mode, frames, slots: plan.slots.length, seasonDay: plan.seasonDay }
  } catch (err) {
    for (const src of made) URL.revokeObjectURL(src)
    throw err
  }
}

/** Give a time-lapse's pictures back (its blob: URLs). Nothing may show them afterwards. */
export function releaseTimelapse(t: Timelapse): void {
  for (const f of t.frames) URL.revokeObjectURL(f.src)
}
