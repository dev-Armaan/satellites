/**
 * The 1200×630 Open Graph cards, drawn with satori from the shared card spec (./cardSpec.ts), so
 * what X / iMessage / Slack unfurl is field for field what the sharer previewed and downloaded:
 *
 *   shareCard    a shared pass: the real crop (or the pass geometry) + the headline panel
 *   defaultCard  the root link card: a real Sentinel-2 photograph + the hero line
 *
 * Instrument style (docs/DESIGN.md): near-black ink, warm bone type, one sodium-orange signal,
 * hairlines, Martian Mono numerics, condensed Instrument Sans display, one Instrument Serif phrase.
 * Line art is ≥ 2px wherever it carries meaning, so it survives X's ~600px timeline render.
 */
import type { CSSProperties, ReactElement } from 'react'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  CARD_COLOR as C,
  CARD_FS,
  CARD_H,
  CARD_W,
  CHIP_BOX,
  DEFAULT_CARD_ALT,
  HEAD,
  PANEL,
  PLATE,
  TONE_COLOR,
  TRACK,
  creditFor,
  hatchPath,
  imageOverlay,
  niceLength,
  plateFrame,
  reticlePrims,
  type CardSpec,
  type Chip,
  type ImagePlate,
  type Plate,
  type Prim,
  type ScaleBar,
  type Tone,
} from './cardSpec.js'
import { bundled } from './bundled.js'
import { FONT } from './fonts.js'
import { WORDMARK_ASPECT, wordmarkSvg } from './wordmark.js'
import { box, h, type Child } from './h.js'

export { CARD_H, CARD_W, PLATE, niceLength }

// ── Type primitives ─────────────────────────────────────────────────────────────────────────

/** Mono caps text: tracking +0.08em, as `.label` in primitives.module.css. */
function mono(text: string, size: number, color: string, style: CSSProperties = {}): ReactElement {
  return h(
    'div',
    {
      style: {
        display: 'flex',
        fontFamily: FONT.mono,
        fontSize: size,
        letterSpacing: size * TRACK.label,
        textTransform: 'uppercase',
        color,
        lineHeight: 1.3,
        whiteSpace: 'nowrap',
        ...style,
      },
    },
    text,
  )
}

/** The serif wordmark ("Watched." with the signal full stop): the one lockup everywhere. 22 px tall fills the header row. */
const LOCKUP_SRC = `data:image/svg+xml;base64,${Buffer.from(wordmarkSvg(C.bone, C.signal)).toString('base64')}`
function lockup(): ReactElement {
  const hgt = 22
  return h('img', { src: LOCKUP_SRC, width: Math.round(hgt * WORDMARK_ASPECT), height: hgt, style: { display: 'flex' } })
}

const abs = (style: CSSProperties, ...children: (Child | Child[])[]) => box({ position: 'absolute', ...style }, ...children)

/** A full-width hairline across the panel at card y. */
const rule = (y: number, color: string = C.line) => abs({ left: PANEL.x, top: y, width: PANEL.w, height: 1, background: color })

/** A text row centred in its [top, height] box, spanning the panel. */
function row(r: readonly [number, number], left: Child | Child[], right?: Child | Child[]): ReactElement {
  return abs({ left: PANEL.x, top: r[0], width: PANEL.w, height: r[1], alignItems: 'center', justifyContent: 'space-between' }, box({ alignItems: 'center', gap: 10 }, left), right ? box({ alignItems: 'center' }, right) : null)
}

// ── Vector primitives (shared spec → satori SVG) ────────────────────────────────────────────

function svgPrims(prims: Prim[], size: number, idPrefix: string): ReactElement {
  const defs: ReactElement[] = []
  const els = prims.map((p, i) => {
    if (p.t === 'circle') return h('circle', { cx: p.cx, cy: p.cy, r: p.r, fill: p.fill ?? 'none', stroke: p.stroke, strokeWidth: p.width })
    let stroke = p.stroke
    if (p.grad) {
      const id = `${idPrefix}g${i}`
      defs.push(
        h(
          'linearGradient',
          { id, gradientUnits: 'userSpaceOnUse', x1: p.grad.x1, y1: p.grad.y1, x2: p.grad.x2, y2: p.grad.y2 },
          h('stop', { offset: '0', stopColor: p.grad.from }),
          h('stop', { offset: '1', stopColor: p.grad.to }),
        ),
      )
      stroke = `url(#${id})`
    }
    return h('path', { d: p.d, fill: p.fill ?? 'none', stroke, strokeWidth: p.width, strokeDasharray: p.dash ? p.dash.join(' ') : undefined })
  })
  return h(
    'svg',
    { width: size, height: size, viewBox: `0 0 ${size} ${size}`, style: { position: 'absolute', left: 0, top: 0 } },
    defs.length ? h('defs', null, ...defs) : null,
    ...els,
  )
}

/** Flat ink chip for text over imagery (no blur, no shadow: DESIGN §1). */
function chip(c: Chip): ReactElement {
  return abs(
    {
      ...c.pos,
      alignItems: 'center',
      gap: CHIP_BOX.gap,
      padding: `${CHIP_BOX.padTop}px ${CHIP_BOX.padX}px ${CHIP_BOX.padBottom}px`,
      background: C.chip,
      border: `1px solid ${C.lineStrong}`,
    },
    c.segs.map((s) => mono(s.text, c.size, TONE_COLOR[s.tone])),
  )
}

/** Scale bar sized to a round ground distance: ├── 1 KM ──┤, top right of the plate. */
function scaleBar(s: ScaleBar): ReactElement | null {
  if (s.px <= 0) return null
  return abs(
    {
      right: 24,
      top: 24,
      alignItems: 'center',
      gap: CHIP_BOX.gap,
      padding: `${CHIP_BOX.padTop}px ${CHIP_BOX.padX}px ${CHIP_BOX.padBottom}px`,
      background: C.chip,
      border: `1px solid ${C.lineStrong}`,
    },
    box({ width: s.px, height: 10, borderLeft: `2px solid ${C.bone}`, borderRight: `2px solid ${C.bone}`, alignItems: 'center' }, box({ height: 2, width: '100%', background: C.bone })),
    mono(s.label, CARD_FS.chip, C.bone),
  )
}

// ── Plates ──────────────────────────────────────────────────────────────────────────────────

const CENTRE = PLATE / 2

function imagePlate(p: ImagePlate, dataUri: string): ReactElement {
  return abs(
    { left: 0, top: 0, width: PLATE, height: PLATE, background: C.ink1, overflow: 'hidden' },
    h('img', { src: dataUri, width: PLATE, height: PLATE, style: { position: 'absolute', left: 0, top: 0, width: PLATE, height: PLATE } }),
    p.clouded ? abs({ left: 0, top: 0, width: PLATE, height: PLATE, background: C.veil }) : null,
    p.clouded ? svgPrims([{ t: 'path', d: hatch(), stroke: C.hatch, width: 1 }], PLATE, 'h') : null,
    svgPrims(p.overlay, PLATE, 'i'),
    chip(p.chip),
    scaleBar(p.scale),
    p.clouded ? chip(p.clouded) : null,
    chip(p.credit),
  )
}

let hatchD: string | null = null
const hatch = () => (hatchD ??= hatchPath(PLATE))

function plate(p: Plate, dataUri: string | null): ReactElement {
  if (p.kind === 'image' && dataUri) return imagePlate(p, dataUri)
  const plan = p.kind === 'image' ? p.fallback : p
  return abs(
    { left: 0, top: 0, width: PLATE, height: PLATE, background: C.ink1, overflow: 'hidden' },
    svgPrims(plan.prims, PLATE, 'p'),
    plan.chips.map(chip),
    scaleBar(plan.scale),
  )
}

// ── The panel ───────────────────────────────────────────────────────────────────────────────

/** The headline block, centred in its band (PANEL.headTop … headBottom): condensed lead, serif place, optional sub-line. */
function headline(spec: Pick<CardSpec, 'lead' | 'place' | 'tail' | 'sub' | 'size'>): ReactElement {
  const S = spec.size
  const P = S * HEAD.placeScale
  return abs(
    { left: PANEL.x, top: PANEL.headTop, width: PANEL.w, height: PANEL.headBottom - PANEL.headTop, flexDirection: 'column', justifyContent: 'center' },
    h(
      'div',
      { style: { display: 'flex', fontFamily: FONT.display, fontWeight: 600, fontSize: S, lineHeight: HEAD.leadLH, letterSpacing: -0.02 * S, color: C.bone } },
      spec.lead,
    ),
    h(
      'div',
      {
        style: {
          display: 'flex',
          fontFamily: FONT.serif,
          fontStyle: 'italic',
          fontSize: P,
          lineHeight: HEAD.placeLH,
          marginTop: P * HEAD.placeGap,
          letterSpacing: -0.01 * P,
          color: C.bone,
        },
      },
      `${spec.place}${spec.tail}`,
    ),
    spec.sub
      ? h(
          'div',
          { style: { display: 'flex', fontFamily: FONT.sans, fontSize: CARD_FS.sub, lineHeight: HEAD.subLH, marginTop: HEAD.subGap, color: C.bone2 } },
          spec.sub,
        )
      : null,
  )
}

const tone = (t: Tone) => TONE_COLOR[t]

function readouts(spec: CardSpec): ReactElement[] {
  const n = spec.readouts.length
  const colW = PANEL.w / n
  const size = spec.readoutSize ?? CARD_FS.readout
  return spec.readouts.flatMap((r, i) => {
    const x = PANEL.x + i * colW + (i ? 22 : 0)
    const out: ReactElement[] = []
    if (i) out.push(abs({ left: PANEL.x + i * colW, top: PANEL.roLabel[0], width: 1, height: PANEL.roValue[0] + PANEL.roValue[1] - PANEL.roLabel[0], background: C.line }))
    out.push(abs({ left: x, top: PANEL.roLabel[0], height: PANEL.roLabel[1], alignItems: 'center' }, mono(r.label, CARD_FS.row, C.bone3)))
    out.push(
      abs(
        { left: x, top: PANEL.roValue[0], height: PANEL.roValue[1], alignItems: 'baseline', gap: r.unit ? 8 : 0 },
        h('div', { style: { display: 'flex', fontFamily: FONT.mono, fontSize: size, letterSpacing: TRACK.readout * size, color: C.bone, lineHeight: 1 } }, r.value),
        r.unit ? mono(r.unit, CARD_FS.readoutUnit, C.bone3, { lineHeight: 1 }) : null,
      ),
    )
    return out
  })
}

function footer(left: string, host: string): ReactElement[] {
  return [
    rule(PANEL.rule3),
    row(PANEL.foot, mono(left, CARD_FS.row, C.bone2), host ? mono(host, CARD_FS.row, C.bone2, { textTransform: 'none', letterSpacing: 0.5 }) : undefined),
  ]
}

// ── Cards ───────────────────────────────────────────────────────────────────────────────────

export interface ShareCardInput {
  spec: CardSpec
  /** The fetched crop for an image plate; null draws the plate's geometry fallback. */
  image: { dataUri: string } | null
}

export function shareCard({ spec, image }: ShareCardInput): ReactElement {
  return box(
    { position: 'relative', width: CARD_W, height: CARD_H, background: C.ink0, fontFamily: FONT.sans, color: C.bone },
    plate(spec.plate, image?.dataUri ?? null),
    abs({ left: PLATE, top: 0, width: 1, height: CARD_H, background: C.lineStrong }),
    row(PANEL.top, lockup(), spec.stamp ? mono(spec.stamp, CARD_FS.row, C.bone2) : undefined),
    rule(PANEL.rule1),
    headline(spec),
    rule(PANEL.rule2),
    ...readouts(spec),
    ...footer(spec.footLeft, spec.host),
  )
}

// ── Default card (the root link) ────────────────────────────────────────────────────────────

/**
 * The real photograph on the root card: Sentinel-2C over Palm Jumeirah, Dubai, 3 Nov 2026 (0.2 %
 * cloud), a 6.3 km square at 10 m per pixel from Planetary Computer (item below). Bundled with the
 * function (vercel.json includeFiles) so the card never waits on an archive.
 */
export const DEFAULT_PLATE = {
  file: 'og-default-plate.jpg',
  item: 'S2C_MSIL2A_20261103T065031_R020_T40RCN_20261103T101659',
  collection: 'sentinel-2-l2a',
  datetime: Date.UTC(2026, 10, 3, 6, 50, 31),
  lat: 25.1206,
  lon: 55.132,
  place: 'Palm Jumeirah, Dubai',
  /** The plate names the place (the card has no place row: owner removed the ◆ row and the coordinates) */
  chip: 'Palm Jumeirah · Sentinel-2C · 10 m',
} as const

export { DEFAULT_CARD_ALT }

let plateUri: Promise<string | null> | null = null
/** The bundled plate as a data URI (null if it can't be read: the card then draws without it). */
export function defaultPlateDataUri(): Promise<string | null> {
  plateUri ??= (async () => {
    const registered = bundled(`_assets/${DEFAULT_PLATE.file}`) // a Worker's copy (bundled.ts)
    if (registered instanceof ArrayBuffer) return `data:image/jpeg;base64,${Buffer.from(registered).toString('base64')}`
    let buf: Buffer
    try {
      buf = await readFile(fileURLToPath(new URL(`../_assets/${DEFAULT_PLATE.file}`, import.meta.url)))
    } catch {
      buf = await readFile(path.join(process.cwd(), 'api', '_assets', DEFAULT_PLATE.file))
    }
    return `data:image/jpeg;base64,${buf.toString('base64')}`
  })().catch(() => {
    plateUri = null
    return null
  })
  return plateUri
}

/**
 * The hero, set in explicit lines (satori has no inline formatting, and a free wrap left "week." as a
 * widow): "Something / photographed / *you* this week." The last line is the widest (≈ 445 of the
 * 466px column at 88px); it never wraps, so the phrase always stays whole.
 */
function heroLines(size: number): ReactElement {
  const w = (s: string, serif = false) =>
    h(
      'span',
      {
        style: {
          fontFamily: serif ? FONT.serif : FONT.display,
          fontStyle: serif ? 'italic' : 'normal',
          fontWeight: serif ? 400 : 600,
          // Instrument Serif sits smaller than the condensed sans at the same size: match cap height.
          fontSize: serif ? size * 1.12 : size,
          letterSpacing: serif ? 0 : -0.02 * size,
          lineHeight: 0.94,
          whiteSpace: 'nowrap',
          // "you" (the serif accent) in signal, as on the landing hero.
          color: serif ? C.signal : C.bone,
        },
      },
      s,
    )
  const line = (...words: ReactElement[]) => box({ alignItems: 'baseline', gap: size * 0.2, flexWrap: 'nowrap' }, ...words)
  return box({ flexDirection: 'column', width: '100%' }, line(w('Something')), line(w('watched'), w('you', true)), line(w('this week.')))
}

/** The homepage card: a real photograph on the left, the hero line on the right. */
export function defaultCard({ host, plateDataUri }: { host: string; plateDataUri?: string | null }): ReactElement {
  const P = DEFAULT_PLATE
  const source: Chip = { segs: [{ text: P.chip, tone: 'bone' }], size: CARD_FS.chipLead, pos: { left: 24, top: 24 } }
  const credit: Chip = { segs: [{ text: creditFor({ collection: P.collection, datetime: P.datetime }), tone: 'bone2' }], size: CARD_FS.micro, pos: { left: 24, bottom: 24 } }
  const scale: ScaleBar = { px: 100, label: '1 km' }
  const left = plateDataUri
    ? abs(
        { left: 0, top: 0, width: PLATE, height: PLATE, background: C.ink1, overflow: 'hidden' },
        h('img', { src: plateDataUri, width: PLATE, height: PLATE, style: { position: 'absolute', left: 0, top: 0, width: PLATE, height: PLATE } }),
        svgPrims(imageOverlay([source, credit], scale), PLATE, 'd'),
        chip(source),
        scaleBar(scale),
        chip(credit),
      )
    : abs({ left: 0, top: 0, width: PLATE, height: PLATE, background: C.ink1 }, svgPrims([...plateFrame([], undefined, C.bone3Mark), ...reticlePrims(CENTRE, CENTRE)], PLATE, 'd'))

  return box(
    { position: 'relative', width: CARD_W, height: CARD_H, background: C.ink0, fontFamily: FONT.sans, color: C.bone },
    left,
    abs({ left: PLATE, top: 0, width: 1, height: CARD_H, background: C.lineStrong }),
    row(PANEL.top, lockup(), mono('Last 7 days', CARD_FS.row, C.bone2)),
    rule(PANEL.rule1),
    // The hero is centred between the top rule and the footer rule, lifted as the pass headline is (owner: even spacing).
    abs({ left: PANEL.x, top: PANEL.headTop, width: PANEL.w, height: PANEL.rule3 - 12 - PANEL.headTop, flexDirection: 'column', justifyContent: 'center' }, heroLines(88)),
    rule(PANEL.rule3),
    row(PANEL.foot, mono('Enter any place on Earth', 15, C.bone), host ? mono(host, CARD_FS.row, C.bone2, { textTransform: 'none', letterSpacing: 0.5 }) : undefined),
  )
}
