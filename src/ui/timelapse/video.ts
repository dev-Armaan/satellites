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
 *  - The video says what it is on its own, away from the site: the year large, the frame's date and satellite, the
 *    place, the wordmark and the Copernicus credit, each on the same ink chip the player uses. Square, because the
 *    pictures are and every feed takes it.
 */
import { ArrayBufferTarget, Muxer } from 'mp4-muxer'
import type { Frame } from '@/imagery/timelapse'
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
const MONO = "'Martian Mono Variable', 'Martian Mono', ui-monospace, 'SF Mono', Menlo, monospace"
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

type MuxCodec = 'avc' | 'vp9' | 'av1'
/** Encoder settings to try, best supported first: H.264 High, Main and Baseline at level 4, then VP9, then AV1. */
const CODECS: { codec: string; mux: MuxCodec }[] = [
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

/** "watched-groom-lake-2015-2026.mp4" */
export function videoFileName(label: string, frames: readonly Pick<Frame, 'date'>[]): string {
  const slug =
    label
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'place'
  const a = frames[0]?.date.slice(0, 4)
  const b = frames[frames.length - 1]?.date.slice(0, 4)
  return `watched-${slug}${a ? `-${a}${b && b !== a ? `-${b}` : ''}` : ''}.mp4`
}

const fmtDate = (date: string) => `${Number(date.slice(8, 10))} ${MONTHS[Number(date.slice(5, 7)) - 1]} ${date.slice(0, 4)}`

async function chooseCodec(side: number, bitrate: number): Promise<{ config: VideoEncoderConfig; mux: MuxCodec } | undefined> {
  for (const c of CODECS) {
    const config: VideoEncoderConfig = { codec: c.codec, width: side, height: side, bitrate, framerate: VIDEO_FPS, latencyMode: 'quality', ...(c.mux === 'avc' ? { avc: { format: 'avc' as const } } : {}) }
    try {
      if ((await VideoEncoder.isConfigSupported(config)).supported) return { config, mux: c.mux }
    } catch {
      /* this one is not known here: the next */
    }
  }
  return undefined
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
  place: string
  credit: string
  wordmark: Path2D
}

/** The site's mono: its 87.5 % width and tracking, where the browser's canvas has them (elsewhere a little wider). */
function setType(ctx: CanvasRenderingContext2D, size: number, spacing: number) {
  const c = ctx as CanvasRenderingContext2D & { letterSpacing?: string; fontStretch?: string }
  c.font = `400 ${size}px ${MONO}`
  c.fontStretch = 'semi-condensed'
  c.letterSpacing = `${spacing}px`
}

function text(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, color: string, spacing = 0) {
  setType(ctx, size, spacing)
  ctx.fillStyle = color
  ctx.fillText(s, x, y)
}

function widthOf(ctx: CanvasRenderingContext2D, s: string, size: number, spacing = 0): number {
  setType(ctx, size, spacing)
  return ctx.measureText(s).width
}

/** Everything over the picture: the same chips, reticle and readout the player shows, at the video's size. */
function drawChrome(a: Art, frame: Frame) {
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
  let place = a.place.toUpperCase()
  while (place.length > 3 && widthOf(ctx, place, ps, 1.6 * u) > maxPlace) place = `${place.slice(0, -2).trimEnd()}…`
  const pw = widthOf(ctx, place, ps, 1.6 * u)
  ctx.fillStyle = CHIP
  ctx.fillRect(side - m - pw - 32 * u, m, pw + 32 * u, 50 * u)
  text(ctx, place, side - m - pw - 16 * u, m + 32 * u, ps, BONE, 1.6 * u)

  // Bottom left: the year, and under it the frame's own date and satellite.
  const year = frame.date.slice(0, 4)
  const sub = `${fmtDate(frame.date)} · ${frame.scene.platform.toUpperCase()}`
  const yw = widthOf(ctx, year, 92 * u, -2 * u)
  const sw = widthOf(ctx, sub, 19 * u, 1.6 * u)
  const cw = Math.max(yw, sw) + 44 * u
  const ch = 152 * u
  ctx.fillStyle = CHIP
  ctx.fillRect(m, side - m - ch, cw, ch)
  text(ctx, year, m + 20 * u, side - m - ch + 92 * u, 92 * u, BONE, -2 * u)
  text(ctx, sub, m + 22 * u, side - m - 24 * u, 19 * u, BONE_2, 1.6 * u)

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
  const chosen = canExportVideo() ? await chooseCodec(side, side >= 1000 ? 8_000_000 : 5_000_000) : undefined
  if (!chosen) throw new Error('No video encoder in this browser')

  const images = await Promise.all(frames.map((f) => loadImage(f.src)))
  // The chips' font must be in before the first frame is drawn, or the first second is in a fallback face.
  await Promise.all([document.fonts?.load(`400 92px ${MONO}`), document.fonts?.load(`400 19px ${MONO}`)]).catch(() => undefined)
  opts.signal?.throwIfAborted()

  const canvas = document.createElement('canvas')
  canvas.width = side
  canvas.height = side
  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) throw new Error('No canvas')
  ctx.imageSmoothingQuality = 'high'
  const a = frames[0].date.slice(0, 4)
  const b = frames[frames.length - 1].date.slice(0, 4)
  const art: Art = { ctx, side, u: side / 1080, place: opts.place, credit: `CONTAINS MODIFIED COPERNICUS SENTINEL DATA ${a === b ? a : `${a}–${b}`}`, wordmark: new Path2D(WORDMARK_PATH) }

  const muxer = new Muxer({ target: new ArrayBufferTarget(), video: { codec: chosen.mux, width: side, height: side, frameRate: VIDEO_FPS }, fastStart: 'in-memory' })
  let failed: unknown
  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => (failed = e),
  })
  encoder.configure(chosen.config)

  const { steps } = planVideo(frames.length)
  const micros = 1_000_000 / VIDEO_FPS
  try {
    for (let n = 0; n < steps.length; n++) {
      if (failed) throw failed
      opts.signal?.throwIfAborted()
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
      drawChrome(art, frames[st.over !== undefined && st.alpha >= 0.5 ? st.over : st.base])
      const vf = new VideoFrame(canvas, { timestamp: Math.round(n * micros), duration: Math.round(micros) })
      encoder.encode(vf, { keyFrame: n % (VIDEO_FPS * 2) === 0 })
      vf.close()
      // Never far ahead of the encoder: wait while it has frames queued (and let the page breathe every few frames).
      while (encoder.encodeQueueSize > 3) await new Promise((r) => setTimeout(r, 4))
      if (n % 6 === 5) {
        opts.onProgress?.((n + 1) / steps.length)
        await new Promise((r) => setTimeout(r, 0))
      }
    }
    await encoder.flush()
    if (failed) throw failed
    muxer.finalize()
  } finally {
    if (encoder.state !== 'closed') encoder.close()
  }
  opts.onProgress?.(1)
  return { blob: new Blob([muxer.target.buffer], { type: 'video/mp4' }), codec: chosen.mux, seconds: steps.length / VIDEO_FPS }
}
