/**
 * The share card in the browser: its spec (from the shared builder in api/_lib/cardSpec.ts, so the
 * preview, this PNG and the server's Open Graph card print identical fields) and the PNG renderer.
 *
 * 1200 × 630 (OG size). Left: the real crop, centred on the ROUNDED place (privacy), with the reticle,
 * source chip, scale bar and the archive's credit; or the pass geometry when there is no picture.
 * Right: wordmark + local time, headline ("7 satellites watched Waterloo."), three readouts, the invitation footer.
 *
 * The plate (share R2SH1): the pass view has already decoded a larger crop of the same scene around the
 * searched point (1024 px, ±5 km for Sentinel-2). The card's square, centred on the rounded share point,
 * lies inside it, so `cardSource` maps that square into the decoded picture's pixels and the preview and
 * the PNG cut it out: no second render from the archive, no "Acquiring" plate, a PNG ready in well under
 * a second. Only that rect is ever drawn (the DOM preview clips to it too), so the card shows exactly the
 * ground a fresh crop centred on the rounded point would show. When the pass view's picture isn't in
 * the cache (a summary's closest look, a recipient's first look), the same rect is loaded and faded in.
 * Pictures go through the results' session photo cache (loadPhoto): one request per URL for the page.
 *
 * Language: the spec is built in the sharer's language (the app's, unless a caller names another) and the PNG is
 * drawn in it: mono rows uppercased with that language's rules except their units ("10 m", "786 km" in every language:
 * api/_lib/i18n/units.ts), lines broken between words even where words are not separated by spaces (Chinese, Japanese:
 * Intl.Segmenter), and text that a shaping engine must join (Arabic) always drawn as one run, untracked, in its own
 * direction. Latin text is drawn exactly as it always was, units aside.
 */
import { isolateIslands, outsideIsolates } from './bidi'
import { geoCaptureFromItem, gibsWmsUrl, pcCropUrl, radarCropUrl, radarPolOfItemId } from '@/imagery'
import { bboxAround } from '@/lib/geo'
import type { Capture, Pass, Report } from '@/types'
import {
  CARD_COLOR as C,
  CARD_FS,
  CARD_H,
  CARD_W,
  CHIP_BOX,
  HEAD,
  headLeading,
  headTracking,
  needsShaping,
  PANEL,
  PLATE,
  TONE_COLOR,
  TRACK,
  buildCardSpec,
  buildSummarySpec,
  hatchPath,
  plateOrFallback,
  type CardCrop,
  type CardSpec,
  type Chip,
  type PlanPlate,
  type PlateSource,
  type Prim,
  type ScaleBar,
  type SummaryLook,
} from '../../../api/_lib/cardSpec'
import { cropCrs, gridOfBox, isToneCollection, nativeBox } from '../../../api/_lib/toneRender'
import { loadPhoto } from '../results/images'
import { coverPinKey, pinnedOrder } from '../results/gallery'
import { orderPhotos } from '../results/lib/photos'
import { canonicalPlace, cityLevelLabel, platformDisplayName } from '@/lib/backend'
import { captureFor, cropSpec, displayUrl } from '../results/lib/captures'
import { archiveDown, headline } from '../results/lib/copy'
import type { MetaFn, SatMeta } from '../results/lib/meta'
import { roundedPlace, type SummaryLinkInput } from './links'
import { WORDMARK_BOX, WORDMARK_DOT, WORDMARK_PATH } from '../../../api/_lib/wordmark'
import { LOCALE_INFO, type Locale } from '../../../api/_lib/i18n/locales'
import { isAccent, plain } from '../../../api/_lib/i18n/parts'
import { capsExceptUnits } from '../../../api/_lib/i18n/units'
import { currentLocale } from '@/i18n/runtime'
// The card in the app's language takes its words from the app's loaded bundle (installed on import).
import '@/i18n/en/card'

/** Lockup height on the 1200×630 card (fills the 22 px header row). */
const LOCKUP_H = 22

export { CARD_H, CARD_W, PLATE, type CardSpec, type PlateSource }

export interface CardOptions {
  /** The picture is mostly cloud (results' isClouded): the clouded variant. */
  clouded?: boolean
  /** The card's language (default: the app's, read now) */
  locale?: Locale
}

/**
 * The place's name in a share (the card, the post, the stored share and every link). Shares are public: never a street
 * address; the city instead, then the rounded coordinates.
 *
 * Language-free: a curated place (an example chip, a Surprise me pick) shown in the sharer's language is shared under
 * its English name (canonicalPlace), as its address-bar links always name it (src/app/links.ts), so the stored share,
 * its links and the card the server draws for them never carry the sharer's language, and one place is one share in
 * every language. Its card, preview and post print that name too: the server could not print a translated one, and
 * the preview must be the card the followers see. Names from a geocoder or the offline list are data, shared as they
 * came.
 */
export function publicLabelOf(place: Report['place']): string {
  const r = roundedPlace(place.lat, place.lon)
  return cityLevelLabel(canonicalPlace(place)) ?? `${r.lat.toFixed(2)}, ${r.lon.toFixed(2)}`
}

/** N for a pass card's headline (owner): the results headline's count of satellites that watched the place this week. */
export function weekSatellites(report: Report, meta: MetaFn): number {
  return headline(report, meta).flewOver
}

/**
 * Crop URL for a capture at the card's scale, centred on an arbitrary point (the rounded share point): on the
 * place's grid (the server's card builds the very same URL, api/_lib/imagery.ts cropPlan).
 */
export function cropUrlFor(capture: Pick<Capture, 'provider' | 'collection' | 'itemId' | 'cropUrl'>, crop: CardCrop, lat: number, lon: number): string | undefined {
  const opts = { halfSizeKm: crop.halfSizeKm, px: PLATE }
  if (capture.provider === 'planetary-computer' && (capture.collection === 'sentinel-2-l2a' || capture.collection === 'landsat-c2-l2')) {
    // Planetary Computer renders the same crop as JPEG at a fraction of the PNG's size.
    return pcCropUrl(capture.collection, capture.itemId, { lat, lon }, opts).replace(/\.png\?/, '.jpg?')
  }
  if (capture.collection === 'sentinel-1-rtc') {
    // A radar image: the server's card asks for this very crop (api/_lib/imagery.ts cropPlan).
    const pol = radarPolOfItemId(capture.itemId)
    return pol ? radarCropUrl(capture.itemId, pol, { lat, lon }, opts).replace(/\.png\?/, '.jpg?') : undefined
  }
  // A geostationary frame, from NASA GIBS or EUMETSAT: the layer and the time are its item id.
  const geo = geoCaptureFromItem(capture.collection, capture.itemId, { lat, lon })
  if (geo) return geo.cropUrl(opts)
  if (capture.provider === 'gibs') {
    const [layer, time] = capture.itemId.split('@')
    return layer && time ? gibsWmsUrl(layer, time, { lat, lon }, opts) : undefined
  }
  try {
    return capture.cropUrl(opts)
  } catch {
    return undefined
  }
}

/** Display URLs whose pixels map linearly to a lon/lat box: Planetary Computer bbox crops and GIBS WMS (EPSG:4326). */
const LINEAR_CROP = /^https:\/\/(planetarycomputer\.microsoft\.com\/api\/data\/v1\/item\/bbox\/|gibs\.earthdata\.nasa\.gov\/wms\/epsg4326\/[^?]*\?.*BBOX=)/
const PC_BOX = /^https:\/\/planetarycomputer\.microsoft\.com\/api\/data\/v1\/item\/bbox\/(-?[\d.]+),(-?[\d.]+),(-?[\d.]+),(-?[\d.]+)\//

/**
 * Where the card's square sits inside the picture the pass view decoded (share R2SH1).
 *
 * The pass view shows displayUrl(capture, cropSpec(collection)): a `spec.px` square, linear in its own coordinates.
 * On the place's UTM grid (every Sentinel-2 / Landsat photo below 84° N) that is grid metres: the photo is the box of whole
 * native pixels around the exact point (toneRender nativeBox) and the card's square the box of whole native pixels
 * around the rounded point on the same grid, so the card is cut at whole-pixel offsets (Sentinel-2: 630 of the
 * photo's own 1000 pixels, the very pixels the server's card copies). Otherwise lon/lat (EPSG:4326):
 * bboxAround(exact, spec.halfSizeKm) and bboxAround(rounded, crop.halfSizeKm). Undefined when the card's box leaves
 * the source on any side, or when the capture has no such crop (an Earth Search thumbnail).
 */
export function cardSource(
  capture: Pick<Capture, 'collection' | 'cropUrl'>,
  exact: { lat: number; lon: number },
  rounded: { lat: number; lon: number },
  crop: Pick<CardCrop, 'halfSizeKm'>,
): PlateSource | undefined {
  const spec = cropSpec(capture.collection)
  let url: string
  try {
    url = displayUrl(capture, spec)
  } catch {
    return undefined
  }
  if (!url || !LINEAR_CROP.test(url)) return undefined
  const crs = cropCrs(url)
  let D: [number, number, number, number]
  let Cb: [number, number, number, number]
  if (crs !== null && crs !== 4326 && isToneCollection(capture.collection)) {
    const m = PC_BOX.exec(url)!
    D = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])]
    const grid = gridOfBox(capture.collection, crs, D)
    Cb = nativeBox(grid, rounded.lat, rounded.lon, Math.round((2 * crop.halfSizeKm * 1000) / grid.gsd))
  } else {
    D = bboxAround(exact.lat, exact.lon, spec.halfSizeKm)
    Cb = bboxAround(rounded.lat, rounded.lon, crop.halfSizeKm)
  }
  const kx = spec.px / (D[2] - D[0])
  const ky = spec.px / (D[3] - D[1])
  const sx = (Cb[0] - D[0]) * kx
  const sy = (D[3] - Cb[3]) * ky
  const sw = (Cb[2] - Cb[0]) * kx
  const sh = (Cb[3] - Cb[1]) * ky
  const ok = (v: number) => Number.isFinite(v) && v >= 0 && v <= spec.px
  if (!ok(sx) || !ok(sy) || !ok(sx + sw) || !ok(sy + sh) || sw <= 0 || sh <= 0) return undefined
  return { url, sx, sy, sw, sh, px: spec.px }
}

/** The card for a pass, as the sharer sees it (the server builds the same from the stored share). */
export function cardSpec(pass: Pass, report: Report, meta: SatMeta, timeZone: string, host: string, opts: CardOptions & { satellites?: number } = {}): CardSpec {
  const r = roundedPlace(report.place.lat, report.place.lon)
  const capture = captureFor(report, pass)
  const spec = buildCardSpec(
    {
      verdict: pass.verdict,
      satName: meta.name,
      placeLabel: report.place.label,
      satellites: opts.satellites,
      lat: r.lat,
      lon: r.lon,
      tClosest: pass.tClosest,
      timeZone,
      pass,
      capture: capture
        ? {
            collection: capture.collection,
            itemId: capture.itemId,
            provider: capture.provider,
            platform: capture.platform,
            gsdM: capture.gsdM,
            cloudCoverPct: capture.cloudCoverPct,
            spot: capture.spot,
            datetime: capture.datetime,
          }
        : undefined,
      clouded: opts.clouded,
      host,
    },
    opts.locale ?? currentLocale(),
  )
  if (spec.plate.kind === 'image' && capture) {
    spec.plate.imageUrl = cropUrlFor(capture, spec.plate.crop, r.lat, r.lon)
    // report.place is the exact searched point (ShareSheet swaps only its label): the pass view's crop is centred there.
    spec.plate.source = cardSource(capture, report.place, r, spec.plate.crop)
  }
  return spec
}

/**
 * The week at a place (share SH6, R3-13), in the results headline's numbers: N, the distinct satellites that
 * watched it (any pass; geostationary watchers excluded), and K, the images made public (the imaged passes'
 * captures, weather mosaics and radar included). Plus the four verdict counts and the picture: the results gallery's
 * FIRST image (owner), as the gallery shows it (its pinned cover) and labelled as the gallery tags it: the closest
 * clear look, or the last clear look from before a cloudy week, or the least cloudy one, or a radar image.
 */
export function summaryFacts(report: Report, placeLabel: string, meta: MetaFn): SummaryLinkInput & { best?: SummaryLinkInput['best'] & { capture: Capture } } {
  const counts = { imaged: 0, likely: 0, could: 0, overhead: 0 }
  for (const p of report.passes) if (!p.geostationary) counts[p.verdict]++
  const head = headline(report, meta)
  const set = orderPhotos(report)
  const first = pinnedOrder(set.photos, coverPinKey(report))[0]
  const look: SummaryLook | undefined = !first
    ? undefined
    : set.cover?.photo.key === first.key
      ? set.cover.why
      : first.kind === 'radar'
        ? 'radar'
        : 'plain'
  const norad = first ? (first.pass?.norad ?? first.capture.norad) : undefined
  const best =
    first && look
      ? {
          collection: first.capture.collection,
          itemId: first.capture.itemId,
          // No name: nothing travels (the link carries no `bs`) and each card says "a satellite" in its own language.
          satName: norad !== undefined ? meta(norad).name : platformDisplayName(first.capture.platform),
          tClosest: first.pass?.tClosest ?? first.capture.datetime,
          gsdM: first.capture.gsdM,
          capture: first.capture,
          look,
        }
      : undefined
  const down = archiveDown(report)
  return {
    label: placeLabel,
    lat: report.place.lat,
    lon: report.place.lon,
    satellites: head.flewOver,
    // K is the headline's own count (it equals the imaged passes, the card's IMAGE readout).
    counts: { ...counts, imaged: head.images },
    archiveDown: down || undefined,
    partial: !down && (report.partial || (report.lateChecks ?? 0) > 0) ? true : undefined,
    windowEnd: report.windowEnd,
    best,
  }
}

/** The summary card, as the sharer sees it (the server builds the same from the link's parameters), in `locale`. */
export function summaryCardSpec(report: Report, placeLabel: string, meta: MetaFn, timeZone: string, host: string, locale: Locale = currentLocale()): CardSpec {
  const f = summaryFacts(report, placeLabel, meta)
  const r = roundedPlace(report.place.lat, report.place.lon)
  const c = f.best?.capture
  const spec = buildSummarySpec(
    {
      placeLabel,
      lat: r.lat,
      lon: r.lon,
      satellites: f.satellites,
      counts: f.counts,
      archiveDown: f.archiveDown,
      partial: f.partial,
      windowEnd: f.windowEnd,
      timeZone,
      best: f.best && c ? { satName: f.best.satName, tClosest: f.best.tClosest, capture: { collection: c.collection, itemId: c.itemId, gsdM: c.gsdM }, look: f.best.look } : undefined,
      host,
    },
    locale,
  )
  if (spec.plate.kind === 'image' && c) {
    spec.plate.imageUrl = cropUrlFor(c, spec.plate.crop, r.lat, r.lon)
    spec.plate.source = cardSource(c, report.place, r, spec.plate.crop)
  }
  return spec
}

// ── Canvas ──────────────────────────────────────────────────────────────────────────────────

/**
 * The canvas's font stacks: the page's own for the active script (src/styles/scripts.css adds the Cyrillic, Arabic or
 * CJK faces behind the brand ones), read from the CSS tokens when a card is drawn, so the PNG matches the preview in
 * every language. A canvas cannot read var(); getComputedStyle hands back the resolved list.
 */
const SANS_LATIN = '"Instrument Sans Variable", "Instrument Sans", system-ui, sans-serif'
const MONO_LATIN = '"Martian Mono Variable", "Martian Mono", ui-monospace, monospace'
const SERIF_LATIN = '"Instrument Serif", Georgia, serif'
let SANS = SANS_LATIN
let MONO = MONO_LATIN
let SERIF = SERIF_LATIN
/** The headline's stack: the sans, or one whose script face is pinned at the display width (Cyrillic, scripts.css) */
let DISPLAY = SANS_LATIN
function readStacks() {
  const css = typeof getComputedStyle === 'function' && typeof document !== 'undefined' ? getComputedStyle(document.documentElement) : null
  const get = (name: string, fallback: string) => css?.getPropertyValue(name).trim() || fallback
  SANS = get('--font-sans', SANS_LATIN)
  MONO = get('--font-mono', MONO_LATIN)
  SERIF = get('--font-serif', SERIF_LATIN)
  DISPLAY = get('--font-card-display', SANS)
}

/**
 * Fetch a stack's faces for `text` as the page draws it: each family only for the characters the families before it
 * do not claim (a face's unicode-range). FontFaceSet.load(stack) would fetch every family's faces for every character,
 * and a Vietnamese page's stack, its own faces first with the brand faces behind them for a rare symbol, then fetched
 * the brand faces' latin-ext files for its ă and đ, which its own faces draw. A Latin, Cyrillic or Arabic page fetches
 * the same files as before.
 */
async function loadStack(font: string, stack: string, text: string): Promise<void> {
  const fonts = typeof document !== 'undefined' ? document.fonts : undefined
  if (!fonts) return
  let rest = [...new Set(text)]
  for (const family of stack.split(',').map((f) => f.trim())) {
    if (!rest.length) return
    if (!/^["']/.test(family)) continue // a generic or system family: nothing to fetch
    const faces = await fonts.load(`${font} ${family}`, rest.join(''))
    const ranges = faces.flatMap((f) => f.unicodeRange.split(',').map((r) => r.trim().replace(/^U\+/i, '').split('-').map((h) => parseInt(h, 16))))
    rest = rest.filter((ch) => {
      const c = ch.codePointAt(0)!
      return !ranges.some(([a, z = a]) => c >= a && c <= z)
    })
  }
}

type Ctx = CanvasRenderingContext2D & { fontStretch?: string; letterSpacing?: string }
interface Face {
  family: string
  size: number
  weight?: number
  italic?: boolean
  /** CSS font-stretch keyword: mono is 87.5 % (semi-condensed), display 75 % (condensed) */
  stretch?: 'normal' | 'condensed' | 'semi-condensed'
  /** px */
  tracking?: number
}

const monoFace = (size: number, tracking = size * TRACK.label, weight = 350): Face => ({ family: MONO, size, weight, stretch: 'semi-condensed', tracking })

function setFace(ctx: Ctx, f: Face) {
  const lead = `${f.italic ? 'italic ' : ''}${f.weight ?? 400}`
  const stretch = f.stretch ?? 'normal'
  if (Reflect.has(ctx, 'fontStretch')) {
    ctx.font = `${lead} ${f.size}px ${f.family}`
    ctx.fontStretch = stretch
  } else if (stretch !== 'normal') {
    // No ctx.fontStretch (Safari): put the keyword in the font shorthand, and fall back to the plain
    // face if this canvas rejects it (an invalid assignment leaves the previous font in place).
    ctx.font = '1px serif'
    ctx.font = `${lead} ${stretch} ${f.size}px ${f.family}`
    if (ctx.font === '1px serif') ctx.font = `${lead} ${f.size}px ${f.family}`
  } else ctx.font = `${lead} ${f.size}px ${f.family}`
  if (nativeTracking(ctx)) ctx.letterSpacing = `${f.tracking ?? 0}px`
}

const nativeTracking = (ctx: Ctx) => Reflect.has(ctx, 'letterSpacing')

/**
 * Text in a script whose letters a shaping engine joins and reorders (Arabic, Hebrew, the Indic and South-East Asian
 * scripts) is always drawn as one run and never tracked (needsShaping, cardSpec.ts): spacing its letters apart breaks
 * Arabic's joins and cuts Devanagari's headline stroke.
 */
export { needsShaping }
/** Right-to-left letters: a run whose first letter is one of them is laid out right to left (its own direction). */
const RTL = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/
const rtlRun = (text: string) => {
  // read outside its isolates, as the preview's unicode-bidi: plaintext reads it (bidi.ts)
  const first = /\p{L}/u.exec(outsideIsolates(text))
  return !!first && RTL.test(first[0])
}

/** Run `fn` with the canvas's native tracking off for shaped text (Latin text keeps the face's tracking). */
function untracked<T>(ctx: Ctx, text: string, fn: () => T): T {
  if (!nativeTracking(ctx) || !needsShaping(text)) return fn()
  const prev = ctx.letterSpacing
  ctx.letterSpacing = '0px'
  try {
    return fn()
  } finally {
    ctx.letterSpacing = prev
  }
}

/** Width of `text` in the current face, tracking included (CSS adds it after every glyph; shaped text has none). */
function textWidth(ctx: Ctx, text: string, tracking: number): number {
  if (nativeTracking(ctx)) return untracked(ctx, text, () => ctx.measureText(text).width)
  return ctx.measureText(text).width + (needsShaping(text) ? 0 : tracking * Array.from(text).length)
}

/**
 * One run of text at its left edge, in its own direction (a right-to-left run keeps its left edge at x). In Arabic text,
 * clocks, percentages and Latin names are isolated first, so they keep their order ("81%", "11:21 EST": bidi.ts).
 */
function drawRun(ctx: Ctx, line: string, x: number, y: number) {
  const text = isolateIslands(line)
  if (!rtlRun(text)) {
    ctx.fillText(text, x, y)
    return
  }
  ctx.save()
  ctx.direction = 'rtl'
  ctx.textAlign = 'left'
  ctx.fillText(text, x, y)
  ctx.restore()
}

/**
 * Draw text with tracking even where the canvas has no `letterSpacing` (per-glyph fallback, for text that has no
 * shaping: drawing Arabic a glyph at a time would leave it unjoined and backwards).
 */
function fillText(ctx: Ctx, text: string, x: number, y: number, tracking: number) {
  if (nativeTracking(ctx) || !tracking || needsShaping(text)) {
    untracked(ctx, text, () => drawRun(ctx, text, x, y))
    return
  }
  let cx = x
  for (const ch of Array.from(text)) {
    ctx.fillText(ch, cx, y)
    cx += ctx.measureText(ch).width + tracking
  }
}

/** Baseline of a line box (CSS model): half-leading, then the font's ascent. */
function baselineIn(ctx: Ctx, top: number, lineH: number): number {
  const m = ctx.measureText('Hg')
  const asc = m.fontBoundingBoxAscent ?? m.actualBoundingBoxAscent ?? lineH * 0.8
  const desc = m.fontBoundingBoxDescent ?? m.actualBoundingBoxDescent ?? lineH * 0.2
  return top + (lineH - (asc + desc)) / 2 + asc
}

/**
 * Writing without spaces between words (Chinese, Japanese, Thai, Lao, Khmer, Myanmar): such text breaks between the
 * words Intl.Segmenter finds. Korean writes spaces, and keeps its words whole.
 */
const SPACELESS = /[\u0E00-\u0EFF\u1000-\u109F\u1780-\u17FF\u2E80-\u2FFF\u3000-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF]/
/** Never at a line's start: closing punctuation, small kana, the prolonged sound mark (kinsoku). */
const NO_START = /^[、。，．・：；？！ー〜）」』】〕〉》〙〗〟’”…‥ぁぃぅぇぉっゃゅょゎゕゖァィゥェォッャュョヮヵヶ々,.:;!?)\]}%]/
/** Never at a line's end: opening brackets and quotes. */
const NO_END = /[（「『【〔〈《〘〖〝‘“([{]$/

const segmenters = new Map<Locale, { segment(text: string): Iterable<{ segment: string }> } | null>()
function wordSegmenter(locale: Locale) {
  if (!segmenters.has(locale)) {
    const S = (Intl as { Segmenter?: new (tag: string, o: { granularity: 'word' }) => { segment(text: string): Iterable<{ segment: string }> } }).Segmenter
    segmenters.set(locale, S ? new S(LOCALE_INFO[locale].intl, { granularity: 'word' }) : null)
  }
  return segmenters.get(locale)
}

/** The pieces of a run written without spaces, each a place a line may break before (by word; by character without Intl.Segmenter). */
function spacelessPieces(text: string, locale: Locale): string[] {
  const seg = wordSegmenter(locale)
  const raw = seg ? Array.from(seg.segment(text), (x) => x.segment) : Array.from(text)
  const out: string[] = []
  for (const piece of raw) {
    if (out.length && (NO_START.test(piece) || NO_END.test(out[out.length - 1]))) out[out.length - 1] += piece
    else out.push(piece)
  }
  return out
}

/**
 * Word wrap that, like the browser and satori, may also break after a hyphen, and between the words of text written
 * without spaces. Exported for its tests.
 */
export function wrap(ctx: Pick<Ctx, 'measureText'> & Partial<Ctx>, text: string, maxW: number, tracking: number, locale: Locale = 'en'): string[] {
  // Words, each hyphenated part kept with its hyphen ("Saint-", "Jean-", "sur-", "Richelieu,"). No
  // regex lookbehind: Safari before 16.4 can't parse one, and this module ships to every browser. A part written
  // without spaces is cut into its words; those join their neighbours without a space, as hyphenated parts do.
  const tokens: { text: string; spaced: boolean }[] = []
  // Split at breaking spaces only: a no-break space holds a count to its noun ("256 супутників", "1 565 m"), as
  // the browser and satori keep it, so the PNG breaks its lines where the preview does.
  for (const w of text.split(/[^\S\u00a0\u202f\u2007]+/).filter(Boolean)) {
    w.replace(/-/g, '-\u0000')
      .split('\u0000')
      .filter(Boolean)
      .forEach((part, i) => {
        const pieces = SPACELESS.test(part) ? spacelessPieces(part, locale) : [part]
        pieces.forEach((piece, j) => tokens.push({ text: piece, spaced: i === 0 && j === 0 }))
      })
  }
  // Re-attach the separators: a token that ended with "-" joins the next without a space.
  const lines: string[] = []
  let line = ''
  for (const tok of tokens) {
    const sep = line && tok.spaced && !line.endsWith('-') ? ' ' : ''
    const test = line + sep + tok.text
    if (line && textWidth(ctx as Ctx, test, tracking) > maxW) {
      lines.push(line)
      line = tok.text
    } else line = test
  }
  if (line) lines.push(line)
  return lines
}

function drawPrims(ctx: Ctx, prims: Prim[]) {
  for (const p of prims) {
    ctx.save()
    if (p.t === 'circle') {
      ctx.beginPath()
      ctx.arc(p.cx, p.cy, p.r, 0, Math.PI * 2)
      if (p.fill) {
        ctx.fillStyle = p.fill
        ctx.fill()
      }
      if (p.stroke) {
        ctx.strokeStyle = p.stroke
        ctx.lineWidth = p.width ?? 1
        ctx.stroke()
      }
    } else {
      const path = new Path2D(p.d)
      if (p.fill) {
        ctx.fillStyle = p.fill
        ctx.fill(path)
      }
      if (p.stroke || p.grad) {
        if (p.grad) {
          const g = ctx.createLinearGradient(p.grad.x1, p.grad.y1, p.grad.x2, p.grad.y2)
          g.addColorStop(0, p.grad.from)
          g.addColorStop(1, p.grad.to)
          ctx.strokeStyle = g
        } else ctx.strokeStyle = p.stroke!
        ctx.lineWidth = p.width ?? 1
        if (p.dash) ctx.setLineDash(p.dash)
        ctx.stroke(path)
      }
    }
    ctx.restore()
  }
}

/**
 * Uppercase in the card's language (canvas has no CSS text-transform): Turkish i → İ. Units keep their case
 * ("10 m", "1 km": api/_lib/i18n/units.ts), as the preview's [data-unit] spans and satori's rows keep them.
 */
type Caps = (text: string) => string

/** The card's mono caps in a language (`intl`, as LOCALE_INFO gives it). */
export const cardCaps =
  (intl: string): Caps =>
  (t) =>
    capsExceptUnits(t, intl)

/**
 * How a chip is uppercased: in the card's language, except the licence credit (Chip.lang 'en'), which is English in
 * every language and so is uppercased as English ("CONTAINS", never Turkish "CONTAİNS").
 */
export function chipCaps(chip: Pick<Chip, 'lang'>, caps: Caps): Caps {
  const lang = chip.lang
  return lang ? cardCaps(lang) : caps
}

/** A flat ink chip: padding, 1px line-strong border, mono segments separated by CHIP_BOX.gap. */
function drawChip(ctx: Ctx, chip: Chip, caps: Caps, plateSize = PLATE) {
  const f = monoFace(chip.size)
  setFace(ctx, f)
  const up = chipCaps(chip, caps)
  const segs = chip.segs.map((s) => ({ ...s, text: up(s.text) }))
  const widths = segs.map((s) => textWidth(ctx, s.text, f.tracking!))
  const lineH = chip.size * CHIP_BOX.lineH
  const w = widths.reduce((a, b) => a + b, 0) + CHIP_BOX.gap * (segs.length - 1) + CHIP_BOX.padX * 2 + 2
  const h = lineH + CHIP_BOX.padTop + CHIP_BOX.padBottom + 2
  const { left, right, top, bottom } = chip.pos
  const x = left !== undefined ? left : plateSize - (right ?? 0) - w
  const y = top !== undefined ? top : plateSize - (bottom ?? 0) - h
  ctx.fillStyle = C.chip
  ctx.fillRect(x, y, w, h)
  ctx.strokeStyle = C.lineStrong
  ctx.lineWidth = 1
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1)
  const base = baselineIn(ctx, y + 1 + CHIP_BOX.padTop, lineH)
  let cx = x + 1 + CHIP_BOX.padX
  segs.forEach((s, i) => {
    ctx.fillStyle = TONE_COLOR[s.tone]
    fillText(ctx, s.text, cx, base, f.tracking!)
    cx += widths[i] + CHIP_BOX.gap
  })
}

/** ├── 1 km ──┤ in a chip at the plate's top right. */
function drawScale(ctx: Ctx, s: ScaleBar, caps: Caps) {
  if (s.px <= 0) return
  const f = monoFace(CARD_FS.chip)
  setFace(ctx, f)
  const label = caps(s.label)
  const lw = textWidth(ctx, label, f.tracking!)
  const lineH = CARD_FS.chip * CHIP_BOX.lineH
  const w = s.px + CHIP_BOX.gap + lw + CHIP_BOX.padX * 2 + 2
  const h = lineH + CHIP_BOX.padTop + CHIP_BOX.padBottom + 2
  const x = PLATE - 24 - w
  const y = 24
  ctx.fillStyle = C.chip
  ctx.fillRect(x, y, w, h)
  ctx.strokeStyle = C.lineStrong
  ctx.lineWidth = 1
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1)
  const bx = x + 1 + CHIP_BOX.padX
  const cy = y + h / 2
  ctx.fillStyle = C.bone
  ctx.fillRect(bx, cy - 5, 2, 10)
  ctx.fillRect(bx + s.px - 2, cy - 5, 2, 10)
  ctx.fillRect(bx, cy - 1, s.px, 2)
  ctx.fillStyle = C.bone
  fillText(ctx, label, bx + s.px + CHIP_BOX.gap, baselineIn(ctx, y + 1 + CHIP_BOX.padTop, lineH), f.tracking!)
}

function drawPlan(ctx: Ctx, plan: PlanPlate, caps: Caps) {
  ctx.fillStyle = C.ink1
  ctx.fillRect(0, 0, PLATE, PLATE)
  drawPrims(ctx, plan.prims)
  plan.chips.forEach((c) => drawChip(ctx, c, caps))
  drawScale(ctx, plan.scale, caps)
}

/** Mono caps text centred vertically in a [top, height] box; `align` right anchors at x. */
/** The serif wordmark, height h with its top-left at (x, y): letters in bone, the full stop in signal. */
function drawWordmark(ctx: Ctx, x: number, y: number, h: number) {
  const [bx, by, , bh] = WORDMARK_BOX
  const k = h / bh
  ctx.save()
  ctx.translate(x - bx * k, y - by * k)
  ctx.scale(k, k)
  ctx.fillStyle = C.bone
  ctx.fill(new Path2D(WORDMARK_PATH))
  ctx.fillStyle = C.signal
  ctx.beginPath()
  ctx.arc(WORDMARK_DOT.cx, WORDMARK_DOT.cy, WORDMARK_DOT.r, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function rowText(ctx: Ctx, text: string, caps: Caps, x: number, box: readonly [number, number], color: string, face: Face, align: 'left' | 'right' = 'left') {
  setFace(ctx, face)
  const t = caps(text)
  const w = textWidth(ctx, t, face.tracking ?? 0)
  ctx.fillStyle = color
  fillText(ctx, t, align === 'left' ? x : x - w, baselineIn(ctx, box[0], box[1]), face.tracking ?? 0)
  return w
}

/**
 * The picture for the plate: the pass view's decoded crop when there is one (a hit in the results' session
 * photo cache, so no request and no decode), else the card's own crop.
 */
async function plateImage(spec: CardSpec): Promise<{ img: HTMLImageElement; rect?: PlateSource } | null> {
  if (spec.plate.kind !== 'image') return null
  const { source, imageUrl } = spec.plate
  if (source) {
    const img = await loadPhoto(source.url).catch(() => null)
    if (img) return { img, rect: source }
  }
  const img = imageUrl ? await loadPhoto(imageUrl).catch(() => null) : null
  return img ? { img } : null
}

/**
 * Render the card to a PNG blob on a canvas (fonts are the page's own web fonts; the crop is CORS-clean
 * because every archive sends `Access-Control-Allow-Origin: *` and loadPhoto asks anonymously).
 *
 * The canvas is CPU-backed (`willReadFrequently`), so toBlob encodes from memory, off the main thread's
 * critical path, instead of first reading the whole card back from the GPU (a long task on phones).
 */
export async function renderCardPng(spec: CardSpec): Promise<Blob> {
  readStacks()
  const fontsToLoad: [string, string][] = [['560 84px', DISPLAY], ['400 24px', SANS], ['350 13px', MONO], ['500 16px', MONO], ['italic 400 84px', SERIF]]
  // The card's own words, so a script face behind a unicode-range (Cyrillic, Arabic) is fetched before it is drawn.
  const sample = JSON.stringify(spec)
  const [, pic] = await Promise.all([
    Promise.all(fontsToLoad.map(([font, stack]) => loadStack(font, stack, sample))).catch(() => undefined), // fall back to whatever is available
    plateImage(spec),
  ])
  const img = pic?.img ?? null

  const cv = document.createElement('canvas')
  cv.width = CARD_W
  cv.height = CARD_H
  const ctx = cv.getContext('2d', { willReadFrequently: true }) as Ctx | null
  if (!ctx) throw new Error('Canvas unavailable')
  ctx.textBaseline = 'alphabetic'
  const caps = cardCaps(LOCALE_INFO[spec.locale].intl)

  ctx.fillStyle = C.ink0
  ctx.fillRect(0, 0, CARD_W, CARD_H)

  // ── the plate ──
  const plate = plateOrFallback(spec.plate, !!img)
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, PLATE, PLATE)
  ctx.clip()
  if (plate.kind === 'image' && img) {
    const r = pic?.rect
    ctx.imageSmoothingQuality = 'high' // a cut on the place's grid is copied 1:1 (630 of the photo's own pixels); a lon/lat cut is resampled a little
    if (r) ctx.drawImage(img, r.sx, r.sy, r.sw, r.sh, 0, 0, PLATE, PLATE)
    else ctx.drawImage(img, 0, 0, PLATE, PLATE)
    if (plate.clouded) {
      ctx.fillStyle = C.veil
      ctx.fillRect(0, 0, PLATE, PLATE)
      drawPrims(ctx, [{ t: 'path', d: hatchPath(PLATE), stroke: C.hatch, width: 1 }])
    }
    drawPrims(ctx, plate.overlay)
    drawChip(ctx, plate.chip, caps)
    drawScale(ctx, plate.scale, caps)
    if (plate.clouded) drawChip(ctx, plate.clouded, caps)
    drawChip(ctx, plate.credit, caps)
  } else if (plate.kind === 'plan') drawPlan(ctx, plate, caps)
  ctx.restore()
  ctx.fillStyle = C.lineStrong
  ctx.fillRect(PLATE, 0, 1, CARD_H)

  // ── the panel ──
  const X = PANEL.x
  const R = PANEL.right
  drawWordmark(ctx, X, PANEL.top[0] + (PANEL.top[1] - LOCKUP_H) / 2, LOCKUP_H)
  if (spec.stamp) rowText(ctx, spec.stamp, caps, R, PANEL.top, C.bone2, monoFace(CARD_FS.row), 'right')
  ctx.fillStyle = C.line
  ctx.fillRect(X, PANEL.rule1, PANEL.w, 1)

  // headline, centred in its band (PANEL.headTop … headBottom): the headline's blocks in their order (condensed text,
  // the serif place), then the optional sub-line
  const S = spec.size
  const P = S * HEAD.placeScale
  const track = headTracking(spec.locale)
  // CJK at 600: system CJK fonts round 501–599 up to Semibold or Bold (scripts.css --w-display)
  const lead: Face = { family: DISPLAY, size: S, weight: spec.cjk ? 600 : 560, stretch: 'condensed', tracking: track.lead * S }
  const place: Face = { family: SERIF, size: P, italic: true, tracking: track.place * P }
  const sub: Face = { family: SANS, size: CARD_FS.sub }
  // Chinese, Japanese, Korean and Devanagari: their leading (headLeading); CJK's text parts one phrase on one line each
  const lh = headLeading(spec)
  const leadLH = S * lh.leadLH
  const placeLH = P * lh.placeLH
  const subLH = CARD_FS.sub * HEAD.subLH
  const blockGap = P * HEAD.placeGap
  const blocks = spec.head.map((part) => {
    const serif = isAccent(part)
    const face = serif ? place : lead
    setFace(ctx, face)
    const text = serif ? plain(part.accent) : plain([part])
    return { face, lh: serif ? placeLH : leadLH, lines: spec.cjk && !serif ? [text.trim()] : wrap(ctx, text, PANEL.w, face.tracking!, spec.locale) }
  })
  setFace(ctx, sub)
  const subLines = spec.sub ? wrap(ctx, spec.sub, PANEL.w, 0, spec.locale) : []
  const total = blocks.reduce((sum, b, i) => sum + (i ? blockGap : 0) + b.lines.length * b.lh, 0) + (subLines.length ? HEAD.subGap + subLines.length * subLH : 0)
  let y = PANEL.headTop + (PANEL.headBottom - PANEL.headTop - total) / 2
  ctx.fillStyle = C.bone
  blocks.forEach((b, i) => {
    if (i) y += blockGap
    setFace(ctx, b.face)
    for (const l of b.lines) {
      fillText(ctx, l, X, baselineIn(ctx, y, b.lh), b.face.tracking!)
      y += b.lh
    }
  })
  if (subLines.length) {
    y += HEAD.subGap
    setFace(ctx, sub)
    ctx.fillStyle = C.bone2
    for (const l of subLines) {
      fillText(ctx, l, X, baselineIn(ctx, y, subLH), 0)
      y += subLH
    }
  }

  // readouts
  ctx.fillStyle = C.line
  ctx.fillRect(X, PANEL.rule2, PANEL.w, 1)
  const colW = PANEL.w / spec.readouts.length
  spec.readouts.forEach((r, i) => {
    const cx = X + i * colW + (i ? 22 : 0)
    if (i) {
      ctx.fillStyle = C.line
      ctx.fillRect(X + i * colW, PANEL.roLabel[0], 1, PANEL.roValue[0] + PANEL.roValue[1] - PANEL.roLabel[0])
    }
    rowText(ctx, r.label, caps, cx, PANEL.roLabel, C.bone3, monoFace(CARD_FS.row))
    const size = spec.readoutSize ?? CARD_FS.readout
    const vf = monoFace(size, TRACK.readout * size)
    setFace(ctx, vf)
    const base = baselineIn(ctx, PANEL.roValue[0], size)
    ctx.fillStyle = C.bone
    fillText(ctx, r.value, cx, base, vf.tracking!)
    const vw = textWidth(ctx, r.value, vf.tracking!)
    if (r.unit) {
      const uf = monoFace(CARD_FS.readoutUnit)
      setFace(ctx, uf)
      ctx.fillStyle = C.bone3
      // A readout's unit is a unit symbol ("km", "m", "km/s"): it keeps its case.
      fillText(ctx, r.unit, cx + vw + 8, base, uf.tracking!)
    }
  })

  // footer
  ctx.fillStyle = C.line
  ctx.fillRect(X, PANEL.rule3, PANEL.w, 1)
  rowText(ctx, spec.footLeft, caps, X, PANEL.foot, C.bone2, monoFace(CARD_FS.row))
  if (spec.host) {
    setFace(ctx, monoFace(CARD_FS.row, 0.5))
    const w = textWidth(ctx, spec.host, 0.5)
    ctx.fillStyle = C.bone2
    fillText(ctx, spec.host, R - w, baselineIn(ctx, PANEL.foot[0], PANEL.foot[1]), 0.5)
  }

  return new Promise<Blob>((resolve, reject) => cv.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG encode failed'))), 'image/png'))
}
