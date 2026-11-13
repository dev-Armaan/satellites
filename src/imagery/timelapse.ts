/**
 * The time-lapse's frames: the same ten kilometres around a place, one clear Sentinel-2 photo a year since the
 * archive begins (`years`), or one every few weeks of the last twelve months (`seasons`).
 *
 * Why it works the way it does (measured on nine places, 2026-11-13):
 *
 *  - Nothing here runs unless someone opens the time-lapse. A search costs what it did before.
 *  - ONE light search lists every scene of the place (the STAC `fields` extension: 20–130 kB for eleven years,
 *    where the full items are megabytes).
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

/** The one search: every scene over the place since `start` under the mode's cloud limit, a few fields each. */
export function sceneSearchUrl(place: LatLon, mode: TimelapseMode, now: number): string {
  const start = mode === 'years' ? ARCHIVE_START : now - 365 * DAY
  const q = new URLSearchParams({
    collections: COLLECTION,
    intersects: JSON.stringify({ type: 'Point', coordinates: [round6(place.lon), round6(place.lat)] }),
    datetime: `${iso(start)}/${iso(now)}`,
    limit: '1000',
    query: JSON.stringify({ 'eo:cloud_cover': { lt: MAX_SCENE_CLOUD[mode] } }),
    fields: FIELDS,
  })
  return `${PC_STAC_SEARCH}?${q}`
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

async function listScenes(place: LatLon, mode: TimelapseMode, now: number, signal?: AbortSignal): Promise<Scene[]> {
  const out: Scene[] = []
  let url: string | undefined = sceneSearchUrl(place, mode, now)
  // 1000 a page: a second page only where two orbits and two tiles overlap over a desert.
  for (let page = 0; url && page < 3; page++) {
    const r: LightPage = await fetchJson<LightPage>(url, { signal, timeoutMs: 12_000, retries: 1, retryTimeouts: false })
    for (const f of r.features ?? []) {
      const s = sceneOf(f)
      if (s) out.push(s)
    }
    const next = r.links?.find((l) => l.rel === 'next' && (l.method ?? 'GET').toUpperCase() === 'GET')
    url = r.features?.length ? next?.href : undefined
  }
  return out
}

// ── Planning (pure) ────────────────────────────────────────────────────────────────────────

const dayOfYear = (date: string) => (Date.parse(date) - Date.UTC(Number(date.slice(0, 4)), 0, 1)) / DAY
const byCloud = (a: Scene, b: Scene) => a.cloud - b.cloud || b.t - a.t

/** The scenes of the tile and orbit with the most of them, one per day. */
export function oneGeometry(scenes: readonly Scene[], lon: number): Scene[] {
  const count = new Map<string, number>()
  for (const s of scenes) count.set(`${s.tile}/${s.orbit}`, (count.get(`${s.tile}/${s.orbit}`) ?? 0) + 1)
  let best = ''
  for (const [k, n] of count) if (!best || n > count.get(best)! || (n === count.get(best) && k < best)) best = k
  const days = new Map<string, Scene>()
  for (const s of scenes) {
    if (`${s.tile}/${s.orbit}` !== best) continue
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
  /** Share of the square showing the ground, or undefined when the mask can't be read */
  clear: (scene: Scene, place: LatLon, signal?: AbortSignal) => Promise<number | undefined>
  /** The blue floor of a small render, or undefined when it can't be read */
  haze: (scene: Scene, place: LatLon, signal?: AbortSignal) => Promise<number | undefined>
  /** The toned frame, as a blob: URL */
  frame: (scene: Scene, place: LatLon, px: number, signal?: AbortSignal) => Promise<string>
}

const cropUrl = (scene: Scene, place: LatLon, px: number) => pcCropUrl(COLLECTION, scene.id, place, { halfSizeKm: FRAME_HALF_KM, px }).replace(/\.png\?/, '.jpg?')

const realDeps: TimelapseDeps = {
  list: listScenes,
  clear: async (scene, place, signal) => {
    const r = await fetchMask(pcMaskUrl(COLLECTION, scene.id, place), signal)
    return r.mask ? clearFraction(r.mask) : undefined
  },
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

/** The first candidate from `from` on (at most `tries`) that is clear at the place, with its haze measured. */
async function firstClear(slot: Slot, from: number, tries: number, place: LatLon, deps: TimelapseDeps, signal?: AbortSignal): Promise<{ pick: Pick; index: number } | undefined> {
  for (let i = from; i < Math.min(slot.candidates.length, from + tries); i++) {
    const scene = slot.candidates[i]
    const clear = await ask((s) => deps.clear(scene, place, s), signal)
    if (clear === undefined || clear < MIN_CLEAR) continue
    return { pick: { scene, clear, haze: await ask((s) => deps.haze(scene, place, s), signal) }, index: i }
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
export async function buildTimelapse(place: LatLon, mode: TimelapseMode, opts: TimelapseOptions): Promise<Timelapse> {
  const { signal, onProgress } = opts
  const now = opts.now ?? Date.now()
  const deps = { ...realDeps, ...opts.deps }
  onProgress?.({ phase: 'listing' })
  const plan = planTimelapse(await deps.list(place, mode, now, signal), place, mode, now)
  throwIfAborted(signal)

  // The clear look of each slot, three slots at a time (a slot asks one thing at a time).
  let done = 0
  onProgress?.({ phase: 'choosing', done, total: plan.slots.length })
  const first = await mapLimit(plan.slots, 3, async (slot) => {
    const r = await firstClear(slot, 0, TRIES[mode], place, deps, signal)
    onProgress?.({ phase: 'choosing', done: ++done, total: plan.slots.length })
    return r
  })
  // A pick much hazier than the place usually is gives way to a cleaner clear scene of its slot, if one is found.
  const usual = median(first.flatMap((r) => (r?.pick.haze !== undefined ? [r.pick.haze] : [])))
  const hazy = (h: number | undefined) => h !== undefined && h > Math.max(usual * HAZE_RATIO, usual + HAZE_MARGIN)
  const picks = await mapLimit(plan.slots, 3, async (slot, i) => {
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
    const srcs = await mapLimit(chosen, 4, async (p) => {
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
