/**
 * Copy: every sentence the results UI says, built from real numbers (DESIGN §7: declarative,
 * specific, quietly uncanny, second person). Sentences are arrays of parts so the renderer can set
 * numbers in mono (DESIGN §3: "Numbers are always mono"); `plain()` flattens them for share text,
 * aria labels and tests.
 */
import type { Capture, GeoWatcher, Pass, Report } from '@/types'
import { isDailyMosaic, isRadar, sensorName } from './captures'
import { VERDICT_META, type MetaFn, type SatMeta } from './meta'
import { fmtLocalTime, zoneAbbr } from './time'

export type Part = string | { n: string; u?: string }
export type Sentence = Part[]

export const num = (n: string, u?: string): Part => ({ n, u })

/** Units that attach without a space: 5.3°, 25%. */
export const tightUnit = (u: string) => /^[°%′″]/.test(u)

export function plain(parts: Sentence | Sentence[]): string {
  const part = (p: Part) => (typeof p === 'string' ? p : !p.u ? p.n : tightUnit(p.u) ? `${p.n}${p.u}` : `${p.n} ${p.u}`)
  const flat = (s: Sentence) => s.map(part).join('')
  if (parts.length && Array.isArray(parts[0])) return (parts as Sentence[]).map(flat).join(' ')
  return flat(parts as Sentence)
}

const nf0 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
const nf1 = new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const nf2 = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const int = (n: number) => nf0.format(Math.round(n))
export const dec1 = (n: number) => nf1.format(n)
export const dec2 = (n: number) => nf2.format(n)

// ── compass ───────────────────────────────────────────────────────────────────────────────

const WORDS8 = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest']
const ABBR16 = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
const norm = (deg: number) => ((deg % 360) + 360) % 360

/** 8-point compass word for prose: 194° → "south". */
export function compassWord(deg: number): string {
  return WORDS8[Math.round(norm(deg) / 45) % 8]
}
/** 16-point abbreviation for readouts: 194.6° → "SSW". */
export function compassAbbr(deg: number): string {
  return ABBR16[Math.round(norm(deg) / 22.5) % 16]
}

// ── places ────────────────────────────────────────────────────────────────────────────────

/** Water bodies and deserts take an article in prose: "photographed the Pacific Ocean". */
const NEEDS_ARTICLE = /(Ocean|Sea|Gulf|Bay|Strait|Desert)$/

/** The place as it reads mid-sentence: "Waterloo", "the Pacific Ocean". */
export function placeInProse(label: string): string {
  return NEEDS_ARTICLE.test(label) && !/^the\s/i.test(label) ? `the ${label}` : label
}

/** Split for the headline, where only the name is set in the serif: ["the ", "Pacific Ocean"]. */
export function placeParts(label: string): [string, string] {
  return NEEDS_ARTICLE.test(label) && !/^the\s/i.test(label) ? ['the ', label] : ['', label]
}

const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1)

// ── headline ──────────────────────────────────────────────────────────────────────────────

/** Why nothing photographed the place, as a kind (the Summary picks words and layout from it). */
export type ZeroKind = 'archive' | 'dark' | 'unpublished' | 'none'

export interface Headline {
  /**
   * Distinct satellites that flew over the place in the window: any pass (imaged, likely, could, overhead).
   * Geostationary watchers don't fly over, so they are not counted. Final as soon as the passes exist.
   */
  flewOver: number
  /** Distinct satellites with at least one real image */
  photographed: number
  /** Distinct satellites with a detailed image (Sentinel-2 / Landsat) */
  detailedSats: number
  /** Distinct satellites with only a daily weather mosaic */
  mosaicSats: number
  /** Weather satellites that swept the place without a published picture (they image in infrared at night) */
  infraredSweeps: number
  /** Distinct other satellites that passed within view (likely / could / overhead) */
  more: number
  /**
   * Total real images made public (what "K images were made public" counts): photos, mosaics and radar images, and
   * every full-disc image the geostationary watchers with a public service took in the window (owner)
   */
  images: number
  /**
   * Of which geostationary: each watcher's frames over the window, by its cadence (GOES, Himawari and the Meteosats
   * with the place well inside their disc). Known as soon as the watchers are: only the newest of each is shown.
   */
  geoImages: number
  /** Of which per-scene detailed images (Sentinel-2, Landsat) */
  detailed: number
  /** Of which coarse daily weather mosaics */
  mosaics: number
  /** Of which Sentinel-1 radar images */
  radarImages: number
  /** Plain reason when nothing photographed the place */
  zeroReason?: string
  zeroKind?: ZeroKind
  /** The sun never rose (polar night): a darkness headline, not a "no image" one */
  sunNeverRose?: boolean
  /** Radar satellites that could have mapped the place (they need no light) */
  radar?: { names: string[]; sats: number; passes: number }
}

/**
 * Which geostationary watchers have public images of the place: a public service carries them, and the place is
 * well inside their disc. The ones whose newest frame the gallery shows and whose week of frames is counted.
 */
export const hasPublicImages = (g: Pick<GeoWatcher, 'frames' | 'rim'>) => !!g.frames && !g.rim

/** Every full-disc image those watchers took in the window, by their cadence. */
export function geoImageCount(geo: readonly Pick<GeoWatcher, 'frames' | 'rim' | 'imagesInWindow'>[] | undefined): number {
  let n = 0
  for (const g of geo ?? []) if (hasPublicImages(g)) n += g.imagesInWindow
  return n
}

/** The archives failed (flag from the engine, or its outage note in older reports). */
export function archiveDown(report: Pick<Report, 'notes' | 'archiveFailed'>): boolean {
  if (report.archiveFailed !== undefined) return report.archiveFailed
  return /archives? (could not be reached|were too slow)/i.test((report.notes ?? []).join(' '))
}

/**
 * @param sunMaxDeg  highest sun elevation at the place over the window (from the timeline's sun
 *                   samples), so polar night is told by the sun, not inferred from pass times.
 */
export function headline(
  report: Pick<Report, 'passes' | 'captures' | 'notes' | 'archiveFailed'> & Partial<Pick<Report, 'geo'>>,
  meta: MetaFn,
  sunMaxDeg?: number,
): Headline {
  const geoImages = geoImageCount(report.geo)
  const imagedSats = new Set<number>()
  const detailedSats = new Set<number>()
  const mosaicSats = new Set<number>()
  const viewSats = new Set<number>()
  const flew = new Set<number>()
  const radarSats = new Map<number, number>()
  let detailed = 0
  let mosaics = 0
  let radarImages = 0
  let infraredSweeps = 0
  const byId = new Map(report.captures.map((c) => [c.id, c]))
  for (const p of report.passes) {
    // A geostationary scan is not an overflight: its images are counted from the watchers (geoImages).
    if (p.geostationary) continue
    const cat = meta(p.norad).category
    if (cat !== 'weather-geo') flew.add(p.norad)
    if (p.verdict === 'imaged') {
      imagedSats.add(p.norad)
      const c = p.captureId ? byId.get(p.captureId) : undefined
      if (c && isDailyMosaic(c)) {
        mosaics++
        mosaicSats.add(p.norad)
      } else if (c && isRadar(c)) radarImages++
      else {
        detailed++
        detailedSats.add(p.norad)
      }
    } else viewSats.add(p.norad)
    if (p.verdict === 'likely' && cat === 'weather-leo') infraredSweeps++
    if (p.verdict === 'could' && cat === 'radar') radarSats.set(p.norad, (radarSats.get(p.norad) ?? 0) + 1)
  }
  for (const n of imagedSats) viewSats.delete(n)
  for (const n of detailedSats) mosaicSats.delete(n)
  const h: Headline = {
    flewOver: flew.size,
    photographed: imagedSats.size,
    detailedSats: detailedSats.size,
    mosaicSats: mosaicSats.size,
    infraredSweeps,
    more: viewSats.size,
    images: detailed + mosaics + radarImages + geoImages,
    geoImages,
    detailed,
    mosaics,
    radarImages,
  }
  if (radarSats.size) {
    const ranked = [...radarSats.entries()].sort((a, b) => b[1] - a[1])
    h.radar = {
      names: ranked.slice(0, 2).map(([n]) => meta(n).name),
      sats: radarSats.size,
      passes: ranked.reduce((a, [, c]) => a + c, 0),
    }
  }
  if (!h.photographed) {
    const z = zeroReason(report, meta, sunMaxDeg)
    h.zeroReason = z.text
    h.zeroKind = z.kind
    h.sunNeverRose = z.neverRose
  }
  return h
}

function zeroReason(
  report: Pick<Report, 'passes' | 'notes' | 'archiveFailed'>,
  meta: MetaFn,
  sunMaxDeg?: number,
): { kind: ZeroKind; text: string; neverRose?: boolean } {
  if (archiveDown(report)) return { kind: 'archive', text: 'the image archives did not answer in time' }
  if (sunMaxDeg !== undefined && sunMaxDeg < 0) return { kind: 'dark', text: 'the sun never rose', neverRose: true }
  const open = report.passes.filter((p) => p.verdict === 'likely' && meta(p.norad).category === 'open-optical')
  if (open.length)
    return {
      kind: 'unpublished',
      text: `Sentinel-2 or Landsat crossed it ${open.length === 1 ? 'once' : `${int(open.length)} times`} in daylight, but no scene has been published yet`,
    }
  if ((sunMaxDeg !== undefined && sunMaxDeg < 5) || (report.passes.length && report.passes.every((p) => p.sunElevationDeg < 5)))
    return { kind: 'dark', text: 'the sun barely rose there' }
  return { kind: 'none', text: 'no open imaging satellite crossed it in daylight' }
}

/** "Radar doesn’t need light. Umbra, Capella and 7 other radar satellites passed within range 1,204 times." */
/** "The sun never rose, so no daylight camera could see it." + "Weather satellites still swept it in infrared, 42 times." */
export function darkSentences(h: Pick<Headline, 'sunNeverRose' | 'infraredSweeps'>): Sentence[] {
  const out: Sentence[] = [[h.sunNeverRose ? 'The sun never rose, so no daylight camera could see it.' : 'The sun barely rose, so no daylight camera could see it.']]
  if (h.infraredSweeps > 0)
    out.push(['Weather satellites still swept it in infrared, ', num(int(h.infraredSweeps)), h.infraredSweeps === 1 ? ' time.' : ' times.'])
  return out
}

/**
 * "31 images were made public." / "At least 4 images…" / "1 image was made public." / "No images were made public this
 * week." One count (owner): photos, weather mosaics and Sentinel-1's radar images alike; the footnote breaks it down.
 */
export function photosLine(k: number, opts: { partial?: boolean; week?: 'this week' | 'that week' } = {}): string {
  if (k <= 0) return `No images were made public ${opts.week ?? 'this week'}.`
  const lead = opts.partial ? 'At least ' : ''
  return k === 1 ? `${lead}1 image was made public.` : `${lead}${int(k)} images were made public.`
}

/** "256 satellites watched" / "1 satellite watched" (owner F, latest: the headline verb is "watched") */
export const watchedPhrase = (n: number) => `${int(n)} ${n === 1 ? 'satellite' : 'satellites'} watched`

/** The archive outage, as the second line says it. */
export const ARCHIVE_DOWN_LINE = 'The image archives didn’t answer, so we can’t count the public images right now.'

export function radarSentence(r: NonNullable<Headline['radar']>): Sentence {
  const others = r.sats - r.names.length
  const names =
    others > 0
      ? `${r.names.join(', ')} and ${int(others)} other radar ${others === 1 ? 'satellite' : 'satellites'}`
      : r.names.length === 2
        ? `${r.names[0]} and ${r.names[1]}`
        : r.names[0]
  return [`Radar doesn’t need light. ${names} passed within range `, num(int(r.passes)), r.passes === 1 ? ' time.' : ' times.']
}

// ── pass detail ───────────────────────────────────────────────────────────────────────────

export interface PassCopyCtx {
  pass: Pass
  meta: SatMeta
  capture?: Capture
  timeZone: string
  placeLabel: string
  /** The Sentinel-2 / Landsat search failed: say so instead of "archives can lag" */
  archiveFailed?: boolean
  /** "Now" for the age of the pass (report-relative); defaults to Date.now() */
  now?: number
}

/** "0.2°W" / "140.8°E": a geostationary seat. */
const fmtLonShort = (lon: number) => `${Math.abs(lon).toFixed(1)}°${lon < 0 ? 'W' : 'E'}`

/** After this long, a missing scene is not "lag": it doesn't exist. */
const SCENE_LAG_MS = 48 * 3_600_000

/** "11:21:13 EST" */
function localClock(ms: number, tz: string, seconds = true): Part {
  return num(fmtLocalTime(ms, tz, seconds), zoneAbbr(ms, tz))
}

/** Below this ground distance the sub-satellite point is "overhead": a bearing would be noise. */
const OVERHEAD_KM = 15
/** Below this off-nadir angle the instrument was "looking straight down". */
const NADIR_DEG = 1.5

/** "786 km overhead" or "786 km up, 61 km to the west" */
function where(p: Pass): Part[] {
  if (p.groundDistanceKm < OVERHEAD_KM) return [num(int(p.altitudeKm), 'km'), ' overhead']
  return [num(int(p.altitudeKm), 'km'), ' up, ', num(int(p.groundDistanceKm), 'km'), ` to the ${compassWord(p.azimuthDeg)}`]
}

function looking(off: number): Sentence {
  if (off < NADIR_DEG) return ['It was looking straight down.']
  return ['It was looking ', num(dec1(off), '°'), ' off straight down.']
}

/**
 * One precise paragraph about a pass, as sentences. The order is always: what crossed, when, where,
 * how it moved → what that means for the image → what we can't know.
 */
export function passSentences({ pass: p, meta, capture, timeZone: tz, placeLabel: label, archiveFailed, now = Date.now() }: PassCopyCtx): Sentence[] {
  const name = meta.name
  const placeLabel = placeInProse(label)
  const moving: Part[] = [`, moving ${compassWord(p.headingDeg)} at `, num(dec2(p.groundSpeedKmS), 'km/s'), '.']
  const out: Sentence[] = []
  switch (p.verdict) {
    case 'imaged': {
      if (p.geostationary) {
        // It never crosses: it sits, and scans. The line's crossing is good to about a minute (geostationary.ts).
        const every = meta.profile?.cadenceMin
        const lon = p.track[0]?.lon
        out.push([
          `${name} doesn’t pass. It sits `,
          num(int(p.altitudeKm), 'km'),
          lon !== undefined ? ` above the equator at ${fmtLonShort(lon)}` : ' above the equator',
          every ? ' and scans the whole face of the Earth below it every ' : ' and scans the whole face of the Earth below it.',
          ...(every ? [num(int(every), 'minutes'), '.'] : []),
        ])
        out.push([`This scan’s line reached ${placeLabel} at about `, localClock(p.tClosest, tz, false), `, moving ${compassWord(p.headingDeg)}.`])
        if (capture?.band === 'infrared') out.push(['It was dark here, so this is infrared: cloud tops by temperature, colder is lighter.'])
        break
      }
      if (capture && isDailyMosaic(capture)) {
        out.push([`${name} crossed `, ...where(p), ' at ', localClock(p.tClosest, tz), ...moving])
        out.push([
          `Its ${sensorName(capture)} imager swept ${placeLabel} into NASA’s daily true-colour mosaic at `,
          num(int(capture.gsdM), 'm'),
          ' per pixel.',
        ])
      } else if (capture && isRadar(capture)) {
        out.push([`${name} crossed `, ...where(p), ' at ', localClock(p.tClosest, tz), ...moving])
        out.push([
          'Its radar, looking ',
          num(dec1(p.offNadirDeg), '°'),
          ` to the side, imaged ${placeLabel} at `,
          num(int(capture.gsdM), 'm'),
          p.sunElevationDeg < -6 ? ' per pixel, in the dark.' : ' per pixel.',
        ])
      } else {
        out.push([`${name} crossed `, ...where(p), ' at ', localClock(p.tClosest, tz), ...moving])
        out.push(looking(p.offNadirDeg))
        if (capture?.cloudCoverPct !== undefined) out.push(['Cloud cover across the scene: ', num(int(capture.cloudCoverPct), '%'), '.'])
      }
      break
    }
    case 'likely': {
      const swath = meta.profile?.swathKm
      out.push([
        `${name} crossed `,
        ...where(p),
        ' at ',
        localClock(p.tClosest, tz),
        ...(swath ? [', inside its ', num(int(swath), 'km'), ' swath.'] : ['.']),
      ])
      if (meta.category === 'open-optical') {
        if (archiveFailed) out.push(['It was daylight, so it would have recorded this spot. The archive could not be searched just now.'])
        else if (now - p.tClosest > SCENE_LAG_MS)
          out.push(['No scene exists for this pass. Sentinel-2 records only land and coastal water, and may not have scheduled this spot.'])
        else
          out.push(['It was daylight, so it almost certainly recorded this spot. No scene from this pass has been published yet; archives can lag by a day or more.'])
      } else if (p.sunElevationDeg < 0) {
        out.push(['It was dark here. Weather imagers keep scanning at night in infrared, so it saw your clouds, not your streets.'])
      } else if (meta.profile?.gibs) {
        out.push(['NASA’s daily mosaic for this pass could not be confirmed at your spot.'])
      } else {
        out.push(['Its images feed weather forecasts; they are not published as pictures we can show.'])
      }
      break
    }
    case 'could': {
      // Always the height: "0.6 km" alone reads as how far away the satellite was (a reader, 2026-11-16).
      out.push([`${name} passed within view at `, localClock(p.tClosest, tz, false), ', ', ...where(p), '.'])
      const swath = meta.profile?.swathKm
      const nadir = p.offNadirDeg < NADIR_DEG
      if (p.inSwath && swath && !meta.profile?.maxOffNadirDeg) {
        // Fixed-swath commercial imagers (e.g. Planet's Doves) record continuously, but privately.
        out.push([`${cap(placeLabel)} was inside its `, num(int(swath), 'km'), ' swath. Its operator does not publish where it imaged, so we can’t know whether it did.'])
      } else if (meta.category === 'radar') {
        out.push([
          'Radar sees through cloud and darkness. ',
          ...(nadir ? [] : ['Pointing ', num(dec1(p.offNadirDeg), '°'), ' to the side, ']),
          `${nadir ? 'It' : 'it'} could have mapped ${placeLabel}.`,
          // Sentinel-1 publishes every image it takes; a private operator does not say.
          meta.profile?.openArchive ? ` We found no published image of it from this pass.` : ' We can’t know whether it did.',
        ])
      } else {
        out.push([
          ...(nadir ? ['Looking straight down, '] : ['Pointing ', num(dec1(p.offNadirDeg), '°'), ' off straight down, ']),
          `it could have watched ${placeLabel}. We can’t know whether it did.`,
        ])
      }
      break
    }
    case 'overhead': {
      out.push([
        `${name} passed `,
        num(int(p.altitudeKm), 'km'),
        ' up at ',
        localClock(p.tClosest, tz, false),
        ', ',
        num(int(p.elevationDeg), '°'),
        // Near the zenith the bearing flips around and means nothing.
        p.elevationDeg >= 80 ? ' above your horizon, almost straight up.' : ` above your horizon to the ${compassWord(p.azimuthDeg)}.`,
      ])
      if (p.sunElevationDeg < -6) out.push(['It was dark where you are. If the station was still in sunlight, it crossed your sky as a bright, steady point.'])
      break
    }
  }
  return out
}

// ── share ─────────────────────────────────────────────────────────────────────────────────

/** Card / post headline: "Sentinel-2C watched Waterloo." */
export function shareHeadline(verdict: Pass['verdict'], name: string, place: string): { lead: string; place: string } {
  switch (verdict) {
    case 'imaged':
      return { lead: `${name} ${VERDICT_META.imaged.verb}`, place }
    case 'likely':
      return { lead: `${name} ${VERDICT_META.likely.verb}`, place }
    case 'could':
      return { lead: `${name} ${VERDICT_META.could.verb} of`, place }
    case 'overhead':
      return { lead: `${name} passed over`, place }
  }
}
