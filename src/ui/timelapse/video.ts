/**
 * The time-lapse as a video file: the loop the player shows, drawn frame by frame and encoded in the browser.
 *
 * Why it works the way it does:
 *
 *  - It costs the site nothing: the pictures are the ones already on screen, the encoder is the browser's own
 *    (WebCodecs VideoEncoder, hardware where there is one) and the file never leaves the device unless its owner
 *    shares it. Only the MP4 container is ours (mp4-muxer, ~30 kB, in this chunk: fetched with the first export).
 *  - It is drawn and encoded as fast as the device allows, not recorded in real time: a 16 s loop takes a few
 *    seconds, every frame is exact, and a busy tab cannot drop one (a recording of the screen would do all three
 *    worse). The encoder is never given more than a few frames ahead, so memory stays flat.
 *  - H.264 in an MP4 is what every phone, chat app and social network plays, so it is asked for first, at the
 *    profile the device's encoder accepts. A browser with no H.264 encoder (some Linux builds) writes VP9 or AV1
 *    into the same container: it plays in Chrome and Firefox, not on Apple devices, and the caller is told
 *    (`codec`) so it never claims otherwise. With no usable encoder at all, `canExportVideo` says so and the
 *    button is not offered.
 *  - Taking a setting is not the same as making chunks the file can hold: some desktop encoders reorder frames
 *    (B-frames) at High profile, and the muxer refuses chunks whose times go backwards. On 2026-11-21 that ended 2 of
 *    the 7 exports in two hours with errors and no video. So a refused codec is dropped for the tab and the export
 *    starts again on the next (`encodeFirstThatFits`); Constrained Baseline H.264 has no B-frames, so it still plays
 *    everywhere.
 *  - The video says what it is on its own, away from the site: the year large, the frame's date and satellite, the
 *    place, the wordmark and the Copernicus credit, each on the same ink chip the player uses. Square, because the
 *    pictures are and every feed takes it.
 *  - Its words are the player's, in the visitor's language (src/i18n/en/timelapse.ts), in capitals: a canvas has no
 *    CSS to uppercase them, so they are uppercased here by the language's own rules (Turkish i → İ). The licence
 *    credit stays English, as the Copernicus data policy words it. A long place name is shortened a whole character
 *    at a time (an accented letter, an emoji, an Arabic cluster is never split).
 *  - A canvas has no `dir` or per-script CSS either, so the two lines that can be in a right-to-left script say so
 *    themselves: the date line runs the way the visitor's language does, the place the way its own first letter does
 *    (as dir="auto" would), and neither is tracked when it is in a joining script such as Arabic (tracking pulls the
 *    joined letters apart: docs/I18N.md). Latin, Cyrillic and CJK keep the mono's tracking; English is as it was.
 */
import { ArrayBufferTarget, Muxer } from 'mp4-muxer'
// The words come from the caller, the time-lapse, which already holds its catalog: a type here, so the catalog stays in
// the time-lapse's chunk instead of a chunk of its own that both would load.
import type enTimelapse from '@/i18n/en/timelapse'
import { currentLocale } from '@/i18n/runtime'
import { SPELLED } from '@/imagery/placeKey'
import type { Frame } from '@/imagery/timelapse'
import { LOCALE_INFO } from '../../../api/_lib/i18n/locales'
import { WORDMARK_BOX, WORDMARK_DOT, WORDMARK_PATH } from '../../../api/_lib/wordmark'

export const VIDEO_FPS = 30
/** How long each frame rests, how long the next takes to dissolve in over it, and the rests at both ends, in video frames. */
const HOLD = 27
const FADE = 12
const FIRST_HOLD = 36
const LAST_HOLD = 60

const INK = '#07080a'
const BONE = '#ece8e0'
const BONE_2 = 'rgba(236, 232, 224, 0.72)'
const SIGNAL = '#ff6a1a'
const CHIP = 'rgba(7, 8, 10, 0.82)'
const MONO_LATIN = "'Martian Mono Variable', 'Martian Mono', ui-monospace, 'SF Mono', Menlo, monospace"
/** The page's mono stack for the active script (src/styles/scripts.css adds Arabic or CJK faces after Martian Mono). */
let MONO = MONO_LATIN
function readMono() {
  const css = typeof getComputedStyle === 'function' && typeof document !== 'undefined' ? getComputedStyle(document.documentElement) : null
  MONO = css?.getPropertyValue('--font-mono').trim() || MONO_LATIN
}

type MuxCodec = 'avc' | 'vp9' | 'av1'
/** Encoder settings to try, best supported first: H.264 High, Main and Baseline at level 4, then VP9, then AV1. */
export const CODECS: readonly { codec: string; mux: MuxCodec }[] = [
  { codec: 'avc1.640028', mux: 'avc' },
  { codec: 'avc1.4d0028', mux: 'avc' },
  { codec: 'avc1.42e028', mux: 'avc' },
  { codec: 'vp09.00.40.08', mux: 'vp9' },
  { codec: 'av01.0.08M.08', mux: 'av1' },
]

export function canExportVideo(): boolean {
  return typeof VideoEncoder === 'function' && typeof VideoFrame === 'function' && typeof document !== 'undefined'
}

export interface VideoPlan {
  /** Which picture is on view, and which is dissolving in over it (with how much of it), for each video frame */
  steps: { base: number; over?: number; alpha: number }[]
}

/** Smooth both ways: the dissolve the player's ease-in-out makes. */
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)

/** The loop, once through: every picture rests, then the next dissolves in over it. Pure. */
export function planVideo(n: number): VideoPlan {
  const steps: VideoPlan['steps'] = []
  for (let k = 0; k < n; k++) {
    if (k > 0) for (let f = 1; f <= FADE; f++) steps.push({ base: k - 1, over: k, alpha: ease(f / (FADE + 1)) })
    const hold = k === 0 ? FIRST_HOLD : k === n - 1 ? LAST_HOLD : HOLD
    for (let f = 0; f < hold; f++) steps.push({ base: k, alpha: 0 })
  }
  return { steps }
}

/**
 * A name's Latin letters and digits as a file-name slug ("São Paulo" → "sao-paulo"); empty when it has none. Letters
 * with no decomposition are spelled as the place search spells them (placeKey's SPELLED: "Łódź" → "lodz",
 * "Kırıkkale" → "kirikkale"), not dropped into a hyphen. Cut at 40 characters, and a hyphen the cut leaves at the end
 * goes too, so the name never reads "…drobwll--2015".
 */
const slugOf = (label: string) =>
  label
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, (c) => SPELLED[c] ?? c)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/, '')

/**
 * "watched-groom-lake-2015-2026.mp4". A place named in another script (東京) takes the catalog's word for a place,
 * `placeWord` (the time-lapse's `fileNamePlace` in the visitor's language: "watched-place-2015-2026.mp4").
 */
export function videoFileName(label: string, frames: readonly Pick<Frame, 'date'>[], placeWord: string): string {
  const slug = slugOf(label) || slugOf(placeWord)
  const a = frames[0]?.date.slice(0, 4)
  const b = frames[frames.length - 1]?.date.slice(0, 4)
  return `watched${slug ? `-${slug}` : ''}${a ? `-${a}${b && b !== a ? `-${b}` : ''}` : ''}.mp4`
}

const anyOf = (scripts: string[]) => `[${scripts.map((n) => `\\p{Script=${n}}`).join('')}]`
/**
 * Scripts whose letters join (Arabic…) or hang from one headline stroke (Devanagari, Bengali, Gurmukhi), which tracking
 * would pull apart: the stroke breaks into a dash per letter.
 */
const JOINING = new RegExp(anyOf(['Arabic', 'Syriac', 'Nko', 'Adlam', 'Mandaic', 'Mongolian', 'Devanagari', 'Bengali', 'Gurmukhi']), 'u')
/** A first letter in a right-to-left script (anything that is not a letter before it is skipped, as bidi does). */
const RTL_FIRST = new RegExp(`^\\P{L}*${anyOf(['Arabic', 'Hebrew', 'Syriac', 'Thaana', 'Nko', 'Adlam', 'Mandaic', 'Samaritan'])}`, 'u')

/**
 * Whether `s` has letters that join (Arabic, Syriac…) or share a headline stroke (Devanagari…), so it must be drawn
 * without tracking. Pure.
 */
export const joins = (s: string): boolean => JOINING.test(s)

/** Which way `s` runs, decided by its first letter as dir="auto" decides it: a place's name can be in any script. Pure. */
export const textDir = (s: string): CanvasDirection => (RTL_FIRST.test(s) ? 'rtl' : 'ltr')

let segmenter: Intl.Segmenter | undefined
/** The string's user-perceived characters: an accented letter, a flag, an Arabic or Devanagari cluster stay whole. */
function graphemes(s: string): string[] {
  if (typeof Intl.Segmenter !== 'function') return Array.from(s)
  segmenter ??= new Intl.Segmenter(undefined, { granularity: 'grapheme' })
  return Array.from(segmenter.segment(s), (g) => g.segment)
}

/**
 * Shortened from its end behind an ellipsis, a whole character at a time, until `fits` says so (and never below three
 * characters, the ellipsis included). Pure.
 */
export function fitText(s: string, fits: (s: string) => boolean): string {
  let out = s
  let g = graphemes(out)
  while (g.length > 3 && !fits(out)) {
    out = `${g.slice(0, -2).join('').trimEnd()}…`
    g = graphemes(out)
  }
  return out
}

export interface Chosen {
  config: VideoEncoderConfig
  mux: MuxCodec
}

/** The codecs whose chunks the file could not hold in this tab (`Unmuxable`): later exports start past them. */
const REFUSED = new Set<string>()

/** Every setting this browser's encoder takes, best first, less the ones already refused in this tab. */
async function supportedCodecs(side: number, bitrate: number): Promise<Chosen[]> {
  const out: Chosen[] = []
  for (const c of CODECS) {
    if (REFUSED.has(c.codec)) continue
    const config: VideoEncoderConfig = { codec: c.codec, width: side, height: side, bitrate, framerate: VIDEO_FPS, latencyMode: 'quality', ...(c.mux === 'avc' ? { avc: { format: 'avc' as const } } : {}) }
    try {
      if ((await VideoEncoder.isConfigSupported(config)).supported) out.push({ config, mux: c.mux })
    } catch {
      /* this one is not known here: the next */
    }
  }
  return out
}

/**
 * The file could not take this encoder's chunks: they came out of order (B-frames: the encoder hands frames over in
 * decode order and WebCodecs gives only their presentation times, which then go backwards) or not starting at the
 * loop's start. Another codec can do: the next one is tried.
 */
export class Unmuxable extends Error {
  override name = 'Unmuxable'
}

const reason = (e: unknown) => (e instanceof Error ? e.message : String(e))

/**
 * `count` frames, each drawn by `frameAt` (which returns what to encode), as one MP4 with one codec. The muxer is fed
 * from the encoder's output callback, so what it throws there is kept (an error thrown in that callback would be the
 * page's, uncaught, and the export would go on to finalize a broken file) and ends the encode as `Unmuxable`.
 */
async function encodeWith(chosen: Chosen, count: number, frameAt: (n: number) => CanvasImageSource, opts: { signal?: AbortSignal; onProgress?: (done: number) => void }): Promise<ArrayBuffer> {
  const { width = 2, height = 2 } = chosen.config
  // 'offset': an encoder that starts its timestamps past zero (as one did, 2026-11-21) still makes a whole file; one
  // whose chunks go backwards is still refused.
  const muxer = new Muxer({ target: new ArrayBufferTarget(), video: { codec: chosen.mux, width, height, frameRate: VIDEO_FPS }, fastStart: 'in-memory', firstTimestampBehavior: 'offset' })
  let failed: unknown
  const encoder = new VideoEncoder({
    output: (chunk, meta) => {
      if (failed !== undefined) return
      try {
        muxer.addVideoChunk(chunk, meta)
      } catch (e) {
        failed = new Unmuxable(`${chosen.config.codec}: ${reason(e)}`)
      }
    },
    error: (e) => (failed ??= e),
  })
  encoder.configure(chosen.config)

  const micros = 1_000_000 / VIDEO_FPS
  try {
    for (let n = 0; n < count; n++) {
      if (failed !== undefined) throw failed
      opts.signal?.throwIfAborted()
      const vf = new VideoFrame(frameAt(n), { timestamp: Math.round(n * micros), duration: Math.round(micros) })
      encoder.encode(vf, { keyFrame: n % (VIDEO_FPS * 2) === 0 })
      vf.close()
      // Never far ahead of the encoder: wait while it has frames queued (and let the page breathe every few frames).
      while (encoder.encodeQueueSize > 3) await new Promise((r) => setTimeout(r, 4))
      if (n % 6 === 5) {
        opts.onProgress?.((n + 1) / count)
        await new Promise((r) => setTimeout(r, 0))
      }
    }
    await encoder.flush()
    if (failed !== undefined) throw failed
    try {
      muxer.finalize()
    } catch (e) {
      throw new Unmuxable(`${chosen.config.codec}: ${reason(e)}`)
    }
  } finally {
    if (encoder.state !== 'closed') encoder.close()
  }
  return muxer.target.buffer
}

/**
 * Encode with the first of `candidates` whose chunks the file takes. A refused codec is remembered in `refused` (the
 * tab's, unless given) and the next is tried from the first frame: the refusal comes within the first few frames, so
 * that costs a fraction of a second. Any other failure (the encoder's own error, an abort) ends the export as it is.
 */
export async function encodeFirstThatFits(
  candidates: readonly Chosen[],
  count: number,
  frameAt: (n: number) => CanvasImageSource,
  opts: { signal?: AbortSignal; onProgress?: (done: number) => void; refused?: Set<string> } = {},
): Promise<{ buffer: ArrayBuffer; chosen: Chosen }> {
  const refused = opts.refused ?? REFUSED
  let last: unknown = new Error('No video encoder in this browser')
  for (const chosen of candidates) {
    try {
      return { buffer: await encodeWith(chosen, count, frameAt, opts), chosen }
    } catch (e) {
      if (!(e instanceof Unmuxable)) throw e
      refused.add(chosen.config.codec)
      console.warn(`[video] ${e.message}; trying the next codec`)
      last = e
    }
  }
  throw last
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  const img = new Image()
  img.src = src
  await img.decode()
  return img
}

interface Art {
  ctx: CanvasRenderingContext2D
  side: number
  /** One 1080th of the side: every size below is in these */
  u: number
  /** The place, in capitals */
  place: string
  /** Which way the place runs (its own first letter) and its tracking, px (none in a joining script) */
  placeDir: CanvasDirection
  placeTrack: number
  /** Which way the date lines run (the visitor's language) and their tracking, px: one value for every frame, so
   * the chip never changes its type as the loop plays */
  subDir: CanvasDirection
  subTrack: number
  credit: string
  wordmark: Path2D
}

/** The site's mono: its 87.5 % width and tracking, where the browser's canvas has them (elsewhere a little wider). */
function setType(ctx: CanvasRenderingContext2D, size: number, spacing: number, dir: CanvasDirection) {
  const c = ctx as CanvasRenderingContext2D & { letterSpacing?: string; fontStretch?: string }
  c.font = `400 ${size}px ${MONO}`
  c.fontStretch = 'semi-condensed'
  c.letterSpacing = `${spacing}px`
  // Said every time: a detached canvas inherits no direction from the page.
  ctx.direction = dir
}

/** Draws `s` with its left edge at `x`, whichever way it runs ('start' would put right-to-left text's right edge there). */
function text(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, color: string, spacing = 0, dir: CanvasDirection = 'ltr') {
  setType(ctx, size, spacing, dir)
  ctx.textAlign = 'left'
  ctx.fillStyle = color
  ctx.fillText(s, x, y)
}

function widthOf(ctx: CanvasRenderingContext2D, s: string, size: number, spacing = 0, dir: CanvasDirection = 'ltr'): number {
  setType(ctx, size, spacing, dir)
  return ctx.measureText(s).width
}

/** Everything over the picture: the same chips, reticle and readout the player shows, at the video's size. `sub` is
 * the line under the year (the frame's date and satellite, in capitals). */
function drawChrome(a: Art, frame: Frame, sub: string) {
  const { ctx, side, u } = a
  const m = 28 * u
  ctx.textBaseline = 'alphabetic'

  // The reticle on the place (ui/results/Reticle.tsx: ring 15, ticks 20–30, a centre dot, of a 100 box).
  const r = 0.44 * u
  ctx.save()
  ctx.translate(side / 2, side / 2)
  for (const [color, width] of [
    [INK, 5.2 * u],
    [SIGNAL, 2.6 * u],
  ] as const) {
    ctx.strokeStyle = color
    ctx.lineWidth = width
    ctx.beginPath()
    ctx.arc(0, 0, 15 * r * 2.2, 0, Math.PI * 2)
    for (const [x, y] of [
      [0, -1],
      [0, 1],
      [-1, 0],
      [1, 0],
    ]) {
      ctx.moveTo(x * 20 * r * 2.2, y * 20 * r * 2.2)
      ctx.lineTo(x * 30 * r * 2.2, y * 30 * r * 2.2)
    }
    ctx.stroke()
  }
  ctx.fillStyle = SIGNAL
  ctx.beginPath()
  ctx.arc(0, 0, 2.6 * u, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // Top left: the wordmark.
  const wh = 40 * u
  const ws = wh / WORDMARK_BOX[3]
  const ww = WORDMARK_BOX[2] * ws
  ctx.fillStyle = CHIP
  ctx.fillRect(m, m, ww + 36 * u, wh + 30 * u)
  ctx.save()
  ctx.translate(m + 18 * u - WORDMARK_BOX[0] * ws, m + 15 * u - WORDMARK_BOX[1] * ws)
  ctx.scale(ws, ws)
  ctx.fillStyle = BONE
  ctx.fill(a.wordmark)
  ctx.fillStyle = SIGNAL
  ctx.beginPath()
  ctx.arc(WORDMARK_DOT.cx, WORDMARK_DOT.cy, WORDMARK_DOT.r, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // Top right: the place (shortened to fit, never past the wordmark).
  const ps = 19 * u
  const maxPlace = side - 2 * m - ww - 36 * u - 24 * u - 32 * u
  const place = fitText(a.place, (s) => widthOf(ctx, s, ps, a.placeTrack, a.placeDir) <= maxPlace)
  const pw = widthOf(ctx, place, ps, a.placeTrack, a.placeDir)
  ctx.fillStyle = CHIP
  ctx.fillRect(side - m - pw - 32 * u, m, pw + 32 * u, 50 * u)
  text(ctx, place, side - m - pw - 16 * u, m + 32 * u, ps, BONE, a.placeTrack, a.placeDir)

  // Bottom left: the year, and under it the frame's own date and satellite.
  const year = frame.date.slice(0, 4)
  const yw = widthOf(ctx, year, 92 * u, -2 * u)
  const sw = widthOf(ctx, sub, 19 * u, a.subTrack, a.subDir)
  const cw = Math.max(yw, sw) + 44 * u
  const ch = 152 * u
  ctx.fillStyle = CHIP
  ctx.fillRect(m, side - m - ch, cw, ch)
  text(ctx, year, m + 20 * u, side - m - ch + 92 * u, 92 * u, BONE, -2 * u)
  text(ctx, sub, m + 22 * u, side - m - 24 * u, 19 * u, BONE_2, a.subTrack, a.subDir)

  // Bottom right: the credit the data asks for, at the largest of three sizes that clears the year's chip (always
  // drawn: at the smallest it may come close to it, never over it for a four-digit year).
  const room = side - 2 * m - cw - 20 * u - 28 * u
  const cs = ([14, 12.5, 11].find((px) => widthOf(ctx, a.credit, px * u, 1.1 * u) <= room) ?? 11) * u
  const crw = widthOf(ctx, a.credit, cs, 1.1 * u)
  ctx.fillStyle = CHIP
  ctx.fillRect(side - m - crw - 28 * u, side - m - 40 * u, crw + 28 * u, 40 * u)
  text(ctx, a.credit, side - m - crw - 14 * u, side - m - 14 * u, cs, BONE_2, 1.1 * u)
}

export interface VideoOptions {
  /** The video's side, px (even) */
  side: number
  place: string
  /** The time-lapse's words in the visitor's language (its `readout` under each frame's year) */
  words: Pick<typeof enTimelapse, 'readout'>
  signal?: AbortSignal
  /** 0..1 as the frames are drawn and encoded */
  onProgress?: (done: number) => void
}

export interface VideoFile {
  blob: Blob
  /** 'avc' plays everywhere; 'vp9' / 'av1' do not play on Apple devices */
  codec: MuxCodec
  seconds: number
}

/** Render the loop to an MP4. Rejects when no encoder takes it, when encoding fails, and on abort. */
export async function renderVideo(frames: readonly Frame[], opts: VideoOptions): Promise<VideoFile> {
  const side = Math.max(2, Math.round(opts.side / 2) * 2)
  const candidates = canExportVideo() ? await supportedCodecs(side, side >= 1000 ? 8_000_000 : 5_000_000) : []
  if (!candidates.length) throw new Error('No video encoder in this browser')

  // The words, in the visitor's language and in capitals by its rules (a canvas has no CSS text-transform).
  const m = opts.words
  const info = LOCALE_INFO[currentLocale()]
  const upper = (s: string) => s.toLocaleUpperCase(info.intl)
  const place = upper(opts.place)
  const subs = frames.map((f) => upper(m.readout(Date.parse(f.date), f.scene.platform)))
  const a = frames[0].date.slice(0, 4)
  const b = frames[frames.length - 1].date.slice(0, 4)
  // The licence credit, as the data policy words it: English in every language.
  const credit = `CONTAINS MODIFIED COPERNICUS SENTINEL DATA ${a === b ? a : `${a}–${b}`}`

  const images = await Promise.all(frames.map((f) => loadImage(f.src)))
  // The chips' font must be in before the first frame is drawn, or the first second is in a fallback face; given the
  // words, the browser also fetches the subsets they need beyond Latin (Łódź, Київ).
  readMono()
  await Promise.all([document.fonts?.load(`400 92px ${MONO}`), document.fonts?.load(`400 19px ${MONO}`, [place, ...subs, credit].join(' '))]).catch(() => undefined)
  opts.signal?.throwIfAborted()

  const canvas = document.createElement('canvas')
  canvas.width = side
  canvas.height = side
  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) throw new Error('No canvas')
  ctx.imageSmoothingQuality = 'high'
  const u = side / 1080
  // The mono's tracking, except on letters that join or share a stroke (an Arabic or Hindi readout, an Arabic or
  // Devanagari place name in any language).
  const track = 1.6 * u
  const subTrack = info.script === 'arabic' || info.script === 'devanagari' || subs.some(joins) ? 0 : track
  const art: Art = {
    ctx,
    side,
    u,
    place,
    placeDir: textDir(place),
    placeTrack: joins(place) ? 0 : track,
    subDir: info.dir,
    subTrack,
    credit,
    wordmark: new Path2D(WORDMARK_PATH),
  }

  const { steps } = planVideo(frames.length)
  const frameAt = (n: number) => {
    const st = steps[n]
    ctx.globalAlpha = 1
    ctx.fillStyle = INK
    ctx.fillRect(0, 0, side, side)
    ctx.drawImage(images[st.base], 0, 0, side, side)
    if (st.over !== undefined) {
      ctx.globalAlpha = st.alpha
      ctx.drawImage(images[st.over], 0, 0, side, side)
      ctx.globalAlpha = 1
    }
    // The readout changes with the picture: the incoming frame's once it is more than half in.
    const k = st.over !== undefined && st.alpha >= 0.5 ? st.over : st.base
    drawChrome(art, frames[k], subs[k])
    return canvas
  }
  const { buffer, chosen } = await encodeFirstThatFits(candidates, steps.length, frameAt, opts)
  opts.onProgress?.(1)
  return { blob: new Blob([buffer], { type: 'video/mp4' }), codec: chosen.mux, seconds: steps.length / VIDEO_FPS }
}
