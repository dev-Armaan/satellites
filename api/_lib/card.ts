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
 *
 * The words are the spec's, in its language (spec.locale): mono rows are uppercased here in that language, their units
 * kept as they are ("10 m": satori's own text-transform knows no language, Turkish i must become İ, and would
 * uppercase the units), and the headline's blocks are set in the order the language's message gives them. The default
 * card takes its words from the card catalog in the same way.
 *
 * Every role names its face and then the faces the web gives Cyrillic and Vietnamese (fonts.ts cardFamily: a
 * Vietnamese card names its own first, for every letter, as its page does), so Ukrainian, Russian, Vietnamese and their
 * place names are set as the app sets them; a Chinese, Japanese or Korean card carries its language (`lang`), so its
 * Han characters take that language's forms.
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
  HEAD_DEVANAGARI,
  headLeading,
  headTracking,
  needsShaping,
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
import { cardMessages } from './i18n/card/index.js'
import { DEFAULT_LOCALE, LOCALE_INFO, type Locale, type Script } from './i18n/locales.js'
import { isAccent, plain, type Rich } from './i18n/parts.js'
import { capsExceptUnits } from './i18n/units.js'
import { bundled } from './bundled.js'
import { cardFamily } from './fonts.js'
import { WORDMARK_ASPECT, wordmarkSvg } from './wordmark.js'
import { box, h, type Child } from './h.js'

export { CARD_H, CARD_W, PLATE, niceLength }

// ── Type primitives ─────────────────────────────────────────────────────────────────────────

/**
 * Mono caps text: tracking +0.08em, as `.label` in primitives.module.css. Uppercased here in the card's language,
 * except its units ("10 m", "1 km": ./i18n/units.ts), so satori's own text-transform is off: it would uppercase the
 * units too, and in no language's rules (Turkish i must become İ). `textTransform: 'none'` from a caller keeps the
 * text as it is (the host, a readout's unit). `faces` is the language whose faces set it: the card's, also for words
 * cased as another language's (the English licence credit on a Vietnamese card is in the card's mono). A row in a
 * script that must not be tracked (Devanagari's headline stroke, Arabic's joins: needsShaping) is set without it, as
 * the app's canvas draws it.
 */
function mono(locale: Locale, text: string, size: number, color: string, style: CSSProperties = {}, faces: Locale = locale): ReactElement {
  const shown = style.textTransform === 'none' ? text : capsExceptUnits(text, LOCALE_INFO[locale].intl)
  return h(
    'div',
    {
      style: {
        display: 'flex',
        fontFamily: cardFamily(faces).mono,
        fontSize: size,
        letterSpacing: needsShaping(shown) ? 0 : size * TRACK.label,
        textTransform: 'none',
        color,
        lineHeight: 1.3,
        whiteSpace: 'nowrap',
        ...style,
      },
    },
    shown,
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
function chip(locale: Locale, c: Chip): ReactElement {
  return abs(
    {
      ...c.pos,
      alignItems: 'center',
      gap: CHIP_BOX.gap,
      padding: `${CHIP_BOX.padTop}px ${CHIP_BOX.padX}px ${CHIP_BOX.padBottom}px`,
      background: C.chip,
      border: `1px solid ${C.lineStrong}`,
    },
    // The licence credit is English in every language, so it is uppercased as English (Chip.lang), in the card's faces.
    c.segs.map((s) => mono(c.lang ?? locale, s.text, c.size, TONE_COLOR[s.tone], {}, locale)),
  )
}

/** Scale bar sized to a round ground distance: ├── 1 km ──┤, top right of the plate. */
function scaleBar(locale: Locale, s: ScaleBar): ReactElement | null {
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
    mono(locale, s.label, CARD_FS.chip, C.bone),
  )
}

// ── Plates ──────────────────────────────────────────────────────────────────────────────────

const CENTRE = PLATE / 2

function imagePlate(locale: Locale, p: ImagePlate, dataUri: string): ReactElement {
  return abs(
    { left: 0, top: 0, width: PLATE, height: PLATE, background: C.ink1, overflow: 'hidden' },
    h('img', { src: dataUri, width: PLATE, height: PLATE, style: { position: 'absolute', left: 0, top: 0, width: PLATE, height: PLATE } }),
    p.clouded ? abs({ left: 0, top: 0, width: PLATE, height: PLATE, background: C.veil }) : null,
    p.clouded ? svgPrims([{ t: 'path', d: hatch(), stroke: C.hatch, width: 1 }], PLATE, 'h') : null,
    svgPrims(p.overlay, PLATE, 'i'),
    chip(locale, p.chip),
    scaleBar(locale, p.scale),
    p.clouded ? chip(locale, p.clouded) : null,
    chip(locale, p.credit),
  )
}

let hatchD: string | null = null
const hatch = () => (hatchD ??= hatchPath(PLATE))

function plate(locale: Locale, p: Plate, dataUri: string | null): ReactElement {
  if (p.kind === 'image' && dataUri) return imagePlate(locale, p, dataUri)
  const plan = p.kind === 'image' ? p.fallback : p
  return abs(
    { left: 0, top: 0, width: PLATE, height: PLATE, background: C.ink1, overflow: 'hidden' },
    svgPrims(plan.prims, PLATE, 'p'),
    plan.chips.map((c) => chip(locale, c)),
    scaleBar(locale, plan.scale),
  )
}

// ── The panel ───────────────────────────────────────────────────────────────────────────────

/**
 * The headline block, centred in its band (PANEL.headTop … headBottom): the headline's parts as blocks in their order
 * (text in the condensed display face, the accent, the place, in the serif, P × placeGap between two blocks), then
 * the optional sub-line. The display text is tracked by script (headTracking), as the app's own preview and PNG of
 * this card are (src/ui/share/ShareCard.tsx and card.ts): the unfurl shows what the sharer saw.
 */
function headline(spec: Pick<CardSpec, 'head' | 'sub' | 'size' | 'cjk' | 'locale'>): ReactElement {
  const S = spec.size
  const P = S * HEAD.placeScale
  const gap = P * HEAD.placeGap
  // Chinese, Japanese, Korean and Devanagari: their leading (headLeading); CJK's text parts one phrase on one line each.
  const lh = headLeading(spec)
  const track = headTracking(spec.locale)
  const F = cardFamily(spec.locale)
  const blocks = spec.head.map((part, i) =>
    isAccent(part)
      ? h(
          'div',
          {
            style: {
              display: 'flex',
              fontFamily: F.serif,
              fontStyle: 'italic',
              fontSize: P,
              lineHeight: lh.placeLH,
              // Korean breaks only between words, as the page (scripts.css keep-all) and the canvas do: 종로 / 구 otherwise
              ...(spec.locale === 'ko' ? { wordBreak: 'keep-all' as const } : {}),
              ...(i ? { marginTop: gap } : {}),
              letterSpacing: track.place * P,
              color: C.bone,
            },
          },
          plain(part.accent),
        )
      : h(
          'div',
          {
            style: {
              display: 'flex',
              fontFamily: F.display,
              fontWeight: 600,
              fontSize: S,
              lineHeight: lh.leadLH,
              ...(spec.cjk ? { whiteSpace: 'nowrap' as const } : {}),
              ...(i ? { marginTop: gap } : {}),
              letterSpacing: track.lead * S,
              color: C.bone,
            },
          },
          plain([part]),
        ),
  )
  return abs(
    { left: PANEL.x, top: PANEL.headTop, width: PANEL.w, height: PANEL.headBottom - PANEL.headTop, flexDirection: 'column', justifyContent: 'center' },
    ...blocks,
    spec.sub
      ? h(
          'div',
          { style: { display: 'flex', fontFamily: F.sans, fontSize: CARD_FS.sub, lineHeight: HEAD.subLH, marginTop: HEAD.subGap, color: C.bone2 } },
          spec.sub,
        )
      : null,
  )
}

const tone = (t: Tone) => TONE_COLOR[t]

function readouts(spec: CardSpec): ReactElement[] {
  const l = spec.locale
  const n = spec.readouts.length
  const colW = PANEL.w / n
  const size = spec.readoutSize ?? CARD_FS.readout
  return spec.readouts.flatMap((r, i) => {
    const x = PANEL.x + i * colW + (i ? 22 : 0)
    const out: ReactElement[] = []
    if (i) out.push(abs({ left: PANEL.x + i * colW, top: PANEL.roLabel[0], width: 1, height: PANEL.roValue[0] + PANEL.roValue[1] - PANEL.roLabel[0], background: C.line }))
    out.push(abs({ left: x, top: PANEL.roLabel[0], height: PANEL.roLabel[1], alignItems: 'center' }, mono(l, r.label, CARD_FS.row, C.bone3)))
    out.push(
      abs(
        { left: x, top: PANEL.roValue[0], height: PANEL.roValue[1], alignItems: 'baseline', gap: r.unit ? 8 : 0 },
        h('div', { style: { display: 'flex', fontFamily: cardFamily(l).mono, fontSize: size, letterSpacing: TRACK.readout * size, color: C.bone, lineHeight: 1 } }, r.value),
        // A readout's unit is a unit symbol ("km", "m", "km/s"): it keeps its case.
        r.unit ? mono(l, r.unit, CARD_FS.readoutUnit, C.bone3, { lineHeight: 1, textTransform: 'none' }) : null,
      ),
    )
    return out
  })
}

function footer(locale: Locale, left: string, host: string): ReactElement[] {
  return [
    rule(PANEL.rule3),
    row(PANEL.foot, mono(locale, left, CARD_FS.row, C.bone2), host ? mono(locale, host, CARD_FS.row, C.bone2, { textTransform: 'none', letterSpacing: 0.5 }) : undefined),
  ]
}

// ── Cards ───────────────────────────────────────────────────────────────────────────────────

/**
 * satori's code for a language that gives Han characters forms of its own, set as the card's `lang`: satori then draws
 * Han from the Noto it loaded for that language (fallbackFonts.ts) rather than from whichever it loaded first, as the
 * web's per-language stacks do. Only these four: satori matches `lang` by prefix against its own codes (German `de`
 * would read as Devanagari), and no other language has forms to choose. (Korean's rare Han still take Japanese forms:
 * satori asks for a Korean font only for hangul.)
 */
const HAN_LANG: Partial<Record<Locale, string>> = { ja: 'ja-JP', ko: 'ko-KR', 'zh-Hans': 'zh-CN', 'zh-Hant': 'zh-TW' }

/** The 1200×630 card itself, in its language. */
function cardRoot(locale: Locale, ...children: (Child | Child[])[]): ReactElement {
  const lang = HAN_LANG[locale]
  const style: CSSProperties = { display: 'flex', position: 'relative', width: CARD_W, height: CARD_H, background: C.ink0, fontFamily: cardFamily(locale).sans, color: C.bone }
  return h('div', lang ? { lang, style } : { style }, ...children)
}

export interface ShareCardInput {
  spec: CardSpec
  /** The fetched crop for an image plate; null draws the plate's geometry fallback. */
  image: { dataUri: string } | null
}

export function shareCard({ spec, image }: ShareCardInput): ReactElement {
  return cardRoot(
    spec.locale,
    plate(spec.locale, spec.plate, image?.dataUri ?? null),
    abs({ left: PLATE, top: 0, width: 1, height: CARD_H, background: C.lineStrong }),
    row(PANEL.top, lockup(), spec.stamp ? mono(spec.locale, spec.stamp, CARD_FS.row, C.bone2) : undefined),
    rule(PANEL.rule1),
    headline(spec),
    rule(PANEL.rule2),
    ...readouts(spec),
    ...footer(spec.locale, spec.footLeft, spec.host),
  )
}

// ── Default card (the root link) ────────────────────────────────────────────────────────────

/**
 * The real photograph on the root card: Sentinel-2C over Palm Jumeirah, Dubai, 3 Nov 2026 (0.2 %
 * cloud), a 6.3 km square at 10 m per pixel from Planetary Computer (item below). Bundled with the
 * Worker (worker/index.ts) so the card never waits on an archive.
 */
export const DEFAULT_PLATE = {
  file: 'og-default-plate.jpg',
  item: 'S2C_MSIL2A_20261103T065031_R020_T40RCN_20261103T101659',
  collection: 'sentinel-2-l2a',
  datetime: Date.UTC(2026, 10, 3, 6, 50, 31),
  lat: 25.1206,
  lon: 55.132,
  /**
   * The plate's chip names the place (the card catalog's `defaultPlace`), then this satellite and pixel: the card has
   * no place row (owner removed the ◆ row and the coordinates).
   */
  satName: 'Sentinel-2C',
  gsdM: 10,
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
 * The landing hero per script, as the page's tokens set it (src/styles/tokens.css, overridden in scripts.css):
 *  - track: its tracking in em (--track-display): Cyrillic lowercase is a denser picket fence than Latin, Han and kana
 *    denser again, Devanagari none (tracking cuts its headline stroke). Arabic is tracked as Latin until the
 *    right-to-left card gives it the web's (none: tracking breaks its joins).
 *  - lh: its line height (the page's 0.92 × --lh-k; 0.94 here): Devanagari's vowel signs need HEAD_DEVANAGARI's.
 *  - accent: the serif accent's size against the display's: 1.12 sets Instrument Serif's lowercase "you" as tall as
 *    the condensed sans' letters; Devanagari's serif letters are as tall as the sans' already (--accent-k).
 *  - size: the display's size against English's (--display-k): Hindi set as large reads larger, and taller.
 */
const HERO: Record<Script, { track: number; lh: number; accent: number; size: number }> = {
  latin: { track: -0.02, lh: 0.94, accent: 1.12, size: 1 },
  cyrillic: { track: -0.015, lh: 0.94, accent: 1.12, size: 1 },
  cjk: { track: -0.01, lh: 0.94, accent: 1.12, size: 1 },
  arabic: { track: -0.02, lh: 0.94, accent: 1.12, size: 1 },
  devanagari: { track: 0, lh: HEAD_DEVANAGARI.leadLH, accent: 1.04, size: 0.84 },
}

/**
 * The hero, set in explicit lines (satori has no inline formatting, and a free wrap left "week." as a
 * widow): "Something / watched *you* / this week." The last line is the widest (≈ 445 of the
 * 466px column at 88px); it never wraps, so the phrase always stays whole.
 *
 * Each line is the catalog's parts, each its own span: a part boundary with a space at it gets the word gap (0.2em,
 * a flex gap: satori has no inline spacing), so "watched" and the serif "you" stay two words while parts written
 * without a space between them (Chinese, Japanese) touch. The display words are tracked as the landing hero's are in
 * the card's language (HERO).
 */
function heroLines(locale: Locale, size: number, lines: Rich[]): ReactElement {
  const hero = HERO[LOCALE_INFO[locale].script]
  const F = cardFamily(locale)
  const w = (s: string, serif = false, style: CSSProperties = {}) =>
    h(
      'span',
      {
        style: {
          fontFamily: serif ? F.serif : F.display,
          fontStyle: serif ? 'italic' : 'normal',
          fontWeight: serif ? 400 : 600,
          // Instrument Serif sits smaller than the condensed sans at the same size: match cap height.
          fontSize: serif ? size * hero.accent : size,
          letterSpacing: serif ? 0 : hero.track * size,
          lineHeight: hero.lh,
          whiteSpace: 'nowrap',
          // "you" (the serif accent) in signal, as on the landing hero.
          color: serif ? C.signal : C.bone,
          ...style,
        },
      },
      s,
    )
  const line = (parts: Rich) => {
    const words = parts.map((p) => ({ text: isAccent(p) ? plain(p.accent) : plain([p]), serif: isAccent(p) }))
    const spaced = words.slice(1).map((x, k) => /\s$/.test(words[k].text) || /^\s/.test(x.text))
    const gap = size * 0.2
    // Every boundary a word space (English): one flex gap. Otherwise the gap goes only where a space was written.
    if (spaced.every(Boolean)) return box({ alignItems: 'baseline', gap, flexWrap: 'nowrap' }, ...words.map((x) => w(x.text.trim(), x.serif)))
    return box({ alignItems: 'baseline', gap: 0, flexWrap: 'nowrap' }, ...words.map((x, k) => w(x.text.trim(), x.serif, k && spaced[k - 1] ? { marginLeft: gap } : {})))
  }
  return box({ flexDirection: 'column', width: '100%' }, ...lines.map(line))
}

/** The homepage card: a real photograph on the left, the hero line on the right, in `locale` (English by default). */
export function defaultCard({ host, plateDataUri, locale = DEFAULT_LOCALE }: { host: string; plateDataUri?: string | null; locale?: Locale }): ReactElement {
  const P = DEFAULT_PLATE
  const m = cardMessages(locale)
  const source: Chip = { segs: [{ text: [m.defaultPlace, P.satName, m.pixelSize(P.gsdM)].join(' · '), tone: 'bone' }], size: CARD_FS.chipLead, pos: { left: 24, top: 24 } }
  const credit: Chip = { segs: [{ text: creditFor({ collection: P.collection, datetime: P.datetime }), tone: 'bone2' }], size: CARD_FS.micro, pos: { left: 24, bottom: 24 }, lang: 'en' }
  const scale: ScaleBar = { px: 100, label: m.scale(1) }
  const left = plateDataUri
    ? abs(
        { left: 0, top: 0, width: PLATE, height: PLATE, background: C.ink1, overflow: 'hidden' },
        h('img', { src: plateDataUri, width: PLATE, height: PLATE, style: { position: 'absolute', left: 0, top: 0, width: PLATE, height: PLATE } }),
        svgPrims(imageOverlay([source, credit], scale), PLATE, 'd'),
        chip(locale, source),
        scaleBar(locale, scale),
        chip(locale, credit),
      )
    : abs({ left: 0, top: 0, width: PLATE, height: PLATE, background: C.ink1 }, svgPrims([...plateFrame([], undefined, C.bone3Mark), ...reticlePrims(CENTRE, CENTRE)], PLATE, 'd'))

  return cardRoot(
    locale,
    left,
    abs({ left: PLATE, top: 0, width: 1, height: CARD_H, background: C.lineStrong }),
    row(PANEL.top, lockup(), mono(locale, m.lastWeek, CARD_FS.row, C.bone2)),
    rule(PANEL.rule1),
    // The hero is centred between the top rule and the footer rule, lifted as the pass headline is (owner: even spacing).
    abs({ left: PANEL.x, top: PANEL.headTop, width: PANEL.w, height: PANEL.rule3 - 12 - PANEL.headTop, flexDirection: 'column', justifyContent: 'center' }, heroLines(locale, 88 * HERO[LOCALE_INFO[locale].script].size, m.hero)),
    rule(PANEL.rule3),
    row(PANEL.foot, mono(locale, m.enterAnyPlace, 15, C.bone), host ? mono(locale, host, CARD_FS.row, C.bone2, { textTransform: 'none', letterSpacing: 0.5 }) : undefined),
  )
}
