/**
 * The share card, specified once (share SH2). Three renderers draw exactly these fields:
 *
 *   src/ui/share/ShareCard.tsx   the DOM preview in the share sheet
 *   src/ui/share/card.ts         the PNG people save, attach to a native share or paste (canvas)
 *   api/_lib/card.ts             the Open Graph card X / iMessage / Slack unfurl (satori)
 *
 * Every string, number, colour and position on the card comes from here, so the sharer previews
 * the card their followers will see. Pure TypeScript with no DOM or Node APIs: the browser app
 * imports it by relative path, the serverless functions import it directly.
 *
 * The words come from the card catalog in the card's language (cardMessages(locale), api/_lib/i18n/card/), which
 * every builder takes explicitly: the browser builds the sharer's card in the app's language, the server the same
 * card in the language a link names (`l=`), and a test holds the two specs equal. The headline is rich parts in that
 * language's order (each top-level part a block: text in the condensed face, the accent, the place, in the serif).
 *
 *   ┌──────────── 630 ────────────┬──────────────── 570 ───────────────┐
 *   │ SENTINEL-2C · MSI · 10 m  ├1 km┤│ Watched.      SUN 1 NOV 2026 · 11:21 EST│
 *   │                             │ ─────────────────────────────────── │
 *   │                             │                                     │
 *   │            ⊕                │ 7 satellites                        │
 *   │   real crop (or geometry)   │ watched                             │
 *   │                             │ Waterloo.                           │
 *   │                             │ ─────────────────────────────────── │
 *   │                             │ ALTITUDE    OFF-NADIR     PIXEL      │
 *   │ CONTAINS MODIFIED COPERNICUS│ 795 km      5.3°          10 m       │
 *   │                             │ SEE WHAT WATCHED YOU  www.watched.earth│
 *   └─────────────────────────────┴─────────────────────────────────────┘
 *
 * Text is stored in sentence case; mono rows are uppercased by the renderers, in the card's language (as CSS does),
 * except the licence credit, which is English and uppercased as English (Chip.lang). Units keep their case in every
 * renderer ("10 m", "1 km", a readout's "km": ./i18n/units.ts).
 */
import { textPx, widestPiecePx } from './cardMeasure.js'
import { cardMessages, type CardMessages } from './i18n/card/index.js'
import { fmt } from './i18n/format.js'
import { DEFAULT_LOCALE, LOCALE_INFO, type Locale } from './i18n/locales.js'
import { isAccent, plain, type Part, type Rich } from './i18n/parts.js'

export type { Locale, Rich }

export type Verdict = 'imaged' | 'likely' | 'could' | 'overhead'

export const CARD_W = 1200
export const CARD_H = 630
/** The left square: the picture (or the pass geometry). */
export const PLATE = 630

/** Mirrors src/styles/tokens.css (satori and canvas have no CSS variables). */
export const CARD_COLOR = {
  ink0: '#07080A',
  ink1: '#0C0E11',
  bone: '#ECE8E0',
  bone2: 'rgba(236,232,224,0.64)',
  bone3: 'rgba(236,232,224,0.52)',
  bone3Mark: 'rgba(236,232,224,0.40)',
  bone4: 'rgba(236,232,224,0.18)',
  line: 'rgba(236,232,224,0.10)',
  lineStrong: 'rgba(236,232,224,0.22)',
  signal: '#FF6A1A',
  warn: '#E8C547',
  /** Flat ink chip behind text on imagery (no blur, no shadow: DESIGN §1). */
  chip: 'rgba(7,8,10,0.78)',
  /** Clouded picture: an ink veil ≈ brightness(.55), identical in every renderer (satori has no filter). */
  veil: 'rgba(7,8,10,0.45)',
  hatch: 'rgba(236,232,224,0.14)',
} as const

export type Tone = 'bone' | 'bone2' | 'bone3' | 'signal' | 'warn'

/** Type sizes on the card (px at 1200 × 630). */
export const CARD_FS = {
  /** In-image credit line (the renderers' micro size) */
  micro: 12,
  /** Chips over the picture */
  chip: 13,
  /** The main picture chip (satellite · sensor · pixel) */
  chipLead: 14,
  /** Mono rows of the panel: stamp, readout labels, footer */
  row: 13,
  lockup: 16,
  readout: 30,
  readoutUnit: 14,
  sub: 24,
} as const

/** Letter-spacing in em: mono labels +0.08em, the wordmark +0.26em (as the HUD's). */
export const TRACK = { label: 0.08, lockup: 0.26, readout: -0.01 } as const

/**
 * The right panel's fixed rows (card px). Boxes are [top, height]; text is centred in its box.
 * The headline block is centred in [headTop, headBottom]: the band between the top rule and the readouts' rule,
 * lifted HEAD_LIFT so the block reads as centred (its line boxes carry more empty room below, under the serif
 * place, than above the condensed caps).
 */
export const PANEL = {
  x: PLATE + 52,
  right: CARD_W - 52,
  w: CARD_W - PLATE - 104,
  top: [42, 22] as const,
  rule1: 82,
  /** rule1 + 1 … rule2 − 2·HEAD_LIFT: the headline block is centred in this band (no row above it: owner) */
  headTop: 83,
  headBottom: 454,
  rule2: 466,
  roLabel: [486, 16] as const,
  roValue: [512, 32] as const,
  rule3: 566,
  foot: [582, 20] as const,
} as const

/** Lead line height, place line height and gap (in em of their own font sizes): .place { line-height: .9; margin-top: .1em } */
export const HEAD = { leadLH: 0.94, placeScale: 1.06, placeLH: 0.9, placeGap: 0.1, subGap: 16, subLH: 1.3 } as const
/**
 * Chinese, Japanese and Korean headlines (CardSpec.cjk): full-height glyphs need real leading (at 0.94 two lines'
 * characters touched), and each text part of the headline is one phrase on one line, never broken inside: the
 * translations split their headline into line-sized phrases ("この1週間、" "256基の衛星が" "見ていた"), so a particle
 * is never left alone on a line and a word is never cut ("注 / 视过"). headlineSize picks the size they all fit at.
 */
export const HEAD_CJK = { leadLH: 1.12, placeLH: 1.1 } as const
/**
 * Hindi headlines (Devanagari): HEAD's leading × 1.3, the page's --lh-k (src/styles/scripts.css). Vowel signs rise to
 * 0.9 em above the baseline (ि ी े ं) and hang to 0.37 em below it (ु ृ, stacked conjuncts): at 0.94 a line's े touched
 * the conjunct hanging from the line above it.
 */
export const HEAD_DEVANAGARI = { leadLH: 1.22, placeLH: 1.17 } as const

/** The headline's leading for a card: HEAD, or its script's (Chinese, Japanese and Korean; Devanagari). */
export function headLeading(spec: Pick<CardSpec, 'cjk' | 'locale'>): { leadLH: number; placeLH: number } {
  return spec.cjk ? HEAD_CJK : LOCALE_INFO[spec.locale].script === 'devanagari' ? HEAD_DEVANAGARI : HEAD
}

/**
 * The headline's tracking in em, by script, as the page's --track-display (src/styles/scripts.css): Latin −0.02,
 * Cyrillic's denser lowercase −0.015, CJK −0.01, Arabic and Devanagari none (tracking breaks Arabic's joins and cuts
 * Devanagari's headline stroke between letters). The place's serif −0.01, none in Arabic and Devanagari. Every renderer
 * of the card reads these, so the preview, the PNG and the unfurl agree.
 */
export function headTracking(locale: Locale): { lead: number; place: number } {
  const script = LOCALE_INFO[locale].script
  if (script === 'arabic' || script === 'devanagari') return { lead: 0, place: 0 }
  return { lead: script === 'cyrillic' ? -0.015 : script === 'cjk' ? -0.01 : -0.02, place: -0.01 }
}

/**
 * Text that must be drawn as one run and never tracked: scripts whose letters a shaping engine joins and reorders
 * (Arabic, Hebrew, the Indic scripts with their headline stroke and conjuncts, South-East Asian scripts). Spacing their
 * letters apart breaks Arabic's joins and cuts Devanagari's stroke between letters. The canvas (src/ui/share/card.ts)
 * and satori (./card.ts) both turn a mono row's tracking off for such text, as the page's scripts.css does.
 */
const SHAPED = /[\u0590-\u08FF\u0900-\u0DFF\u0E00-\u0FFF\u1000-\u109F\u1780-\u17FF\uFB1D-\uFDFF\uFE70-\uFEFF]/
export const needsShaping = (text: string): boolean => SHAPED.test(text)

// ── Spec ────────────────────────────────────────────────────────────────────────────────────

export interface Readout {
  label: string
  value: string
  /** A unit symbol ("km", "m", "km/s", "км"): every renderer draws it as it is, never in capitals */
  unit?: string
}

export interface ChipSeg {
  text: string
  tone: Tone
}
export interface Chip {
  segs: ChipSeg[]
  size: number
  pos: { left?: number; right?: number; top?: number; bottom?: number }
  /**
   * 'en' on the licence credit only: its words are English in every language (creditFor), so each renderer
   * uppercases it with English rules, not the card's (Turkish would print "CONTAİNS MODİFİED").
   */
  lang?: 'en'
}

export interface ScaleBar {
  /** bar length, px */
  px: number
  /** "1 km", "500 m" (its unit keeps its case in the caps) */
  label: string
}

/** A vector primitive in plate coordinates (0…PLATE). Paths are SVG path data (canvas reads them via Path2D). */
export type Prim =
  | {
      t: 'path'
      d: string
      stroke?: string
      width?: number
      fill?: string
      dash?: [number, number]
      /** Stroke with a linear gradient instead of `stroke` (user-space coordinates). */
      grad?: { x1: number; y1: number; x2: number; y2: number; from: string; to: string }
    }
  | { t: 'circle'; cx: number; cy: number; r: number; fill?: string; stroke?: string; width?: number }

/**
 * Client only (share R2SH1): the card's square cut out of a larger picture the app has already
 * decoded (the pass view's crop), in that picture's pixels. The rect is the card crop centred on the
 * ROUNDED share point; nothing outside it is ever drawn. The server never reads this.
 */
export interface PlateSource {
  /** The decoded picture (the pass view's display URL) */
  url: string
  /** The card's square inside it, source pixels: left, top, width, height */
  sx: number
  sy: number
  sw: number
  sh: number
  /** The source picture's side, px */
  px: number
}

export interface ImagePlate {
  kind: 'image'
  /** The crop to draw (centred on the rounded share point). */
  crop: CardCrop
  /** Filled in by each side (client: imagery endpoints; server: cropPlan). */
  imageUrl?: string
  /** Client only: the same square cut from the picture already on screen (see PlateSource). */
  source?: PlateSource
  chip: Chip
  credit: Chip
  scale: ScaleBar
  /** Clouded picture: veil + hatch + this warn chip. */
  clouded?: Chip
  /** Drawn over the picture (under the chips): free-corner ticks and the place reticle. */
  overlay: Prim[]
  /** Drawn instead when the picture can't be fetched. */
  fallback: PlanPlate
}

export interface PlanPlate {
  kind: 'plan'
  prims: Prim[]
  chips: Chip[]
  scale: ScaleBar
}

export type Plate = ImagePlate | PlanPlate

export interface CardSpec {
  verdict: Verdict
  /** The card's language: every word below is in it, and the renderers uppercase and break lines in it */
  locale: Locale
  /** Top right: "Sun 1 Nov 2026 · 11:21 EST" ("" when unknown) */
  stamp: string
  /**
   * The headline as rich parts, in the language's order; every renderer lays the top-level parts out as blocks, one
   * after the other: a text part in the condensed display face (S, up to three lines), the accent (the place and the
   * words on its line) in the serif (S × 1.06), with P × HEAD.placeGap between blocks. English:
   * ["7 satellites watched", accent("Waterloo", ".")] (owner: every card leads with the week's N; the satellite's own
   * sentence when N is unknown).
   */
  head: Rich
  /**
   * Plain-text views of `head`, for tests and logs (no renderer reads them): the text blocks ("7 satellites watched"),
   * the accent's first part (the place as inserted: "Waterloo") and the rest of the accent ("." / " this week." / "").
   */
  lead: string
  place: string
  tail: string
  /** Clouded: cloudWords().sub, e.g. "Mostly cloud: 81% of the scene." */
  sub?: string
  /** Headline font size, px */
  size: number
  /** A Chinese, Japanese or Korean headline: HEAD_CJK's leading, and each text part on one line (see HEAD_CJK) */
  cjk?: true
  readouts: Readout[]
  /** Readout value size, px (default CARD_FS.readout; four columns use a smaller one) */
  readoutSize?: number
  /** Footer left: the invitation back */
  footLeft: string
  /** Footer right: "www.watched.earth" ("" hides it) */
  host: string
  plate: Plate
}

export interface CardCaptureInput {
  collection: string
  itemId?: string
  provider?: string
  platform?: string
  gsdM?: number
  cloudCoverPct?: number
  /** The pixel at the place (results' spot classification), when known: 'cloud' means clouded there. */
  spot?: 'clear' | 'cirrus' | 'cloud' | 'shadow' | 'unknown'
  datetime?: number
}

export interface CardInput {
  verdict: Verdict
  /**
   * The satellite's name ("Sentinel-2C", "NORAD 60989"); undefined when the share kept neither (the sentences then say
   * "a satellite" in their own words, the chips and the callout print the catalog's `aSatellite`).
   */
  satName?: string
  placeLabel: string
  /**
   * N: the satellites that watched the place that week (the results headline's number). The card then reads
   * "7 satellites watched Waterloo." (owner); a share stored before N was kept falls back to "Sentinel-2C watched Waterloo."
   */
  satellites?: number
  /** The rounded share point (2 decimals) */
  lat: number
  lon: number
  tClosest?: number
  /** IANA zone at the place; UTC when unknown */
  timeZone?: string
  pass: {
    altitudeKm?: number
    offNadirDeg?: number
    elevationDeg?: number
    groundSpeedKmS?: number
    groundDistanceKm?: number
    azimuthDeg?: number
    headingDeg?: number
  }
  capture?: CardCaptureInput
  /** The picture is mostly cloud (results: spot cloud or ≥ 70 % of the scene) */
  clouded?: boolean
  /** Imaged, but this capture can't be cropped by the card renderer ('permanent') */
  imageMiss?: 'transient' | 'permanent'
  host: string
}

/**
 * The one verdict vocabulary in English (docs/DESIGN.md §7; mirrors src/ui/results/lib/meta.ts, kept equal by a test).
 * Owner override (latest): user-facing copy says "watched", never "photographed". Nothing prints these words: the card
 * and the share page say whole sentences from the card catalog (headlineBy, crossed, withinView), which spec.test.ts
 * holds to this vocabulary.
 */
export const VERDICT_WORDS: Record<Verdict, { title: string; verb: string }> = {
  imaged: { title: 'Watched', verb: 'watched' },
  likely: { title: 'Likely watched', verb: 'swept over' },
  could: { title: 'Could have pointed here', verb: 'passed within view of' },
  overhead: { title: 'Passed overhead', verb: 'passed over' },
}

/** og:image:alt for the default (root link) card, in English: index.html uses the same words (core K9). */
export const DEFAULT_CARD_ALT = cardMessages(DEFAULT_LOCALE).defaultAlt
/** Scene cloud cover at or above which the card calls the picture clouded (as results' isClouded). */
export const CLOUDED_PCT = 70
/** Scene cloud cover at or above which "it saw only cloud" is true (as PassDetail's overcast line). */
export const OVERCAST_PCT = 90

/** The spot classes a capture can carry (results' SpotCloud). */
export type SpotCloudLike = 'clear' | 'cirrus' | 'cloud' | 'shadow' | 'unknown'

export interface CloudWords {
  /** The card's sub-line under the headline */
  sub: string
  /** The warn chip over the picture */
  chip: string
  /** Appended to the post text after "…from 795 km up on Sun 1 Nov at 11:21 local." */
  post: string
  /** The og:description sentence */
  desc: string
}

/**
 * One rule for clouded words (share R2SH3), so the card, the PNG, /api/og, the share page and the post
 * say what the picture shows: only cloud (≥ 90 %), mostly cloud (70–89 %), or cloud over the spot itself
 * (the place's pixel is cloud while the scene is clearer). Undefined when the picture isn't clouded.
 */
export function cloudWords(pct?: number, spot?: SpotCloudLike | string, locale: Locale = DEFAULT_LOCALE): CloudWords | undefined {
  const c = cardMessages(locale).cloud
  const known = pct !== undefined && Number.isFinite(pct)
  const p = known ? Math.round(pct) : 0
  if (known && pct >= OVERCAST_PCT) return { sub: c.only.sub(p), chip: c.only.chip(p), post: c.only.post(p), desc: c.only.desc(p) }
  if (known && pct >= CLOUDED_PCT) return { sub: c.mostly.sub(p), chip: c.mostly.chip(p), post: c.mostly.post(p), desc: c.mostly.desc(p) }
  if (spot === 'cloud') return { ...c.spot }
  return undefined
}

const PLACE_MAX = 48

/** The place as the card sets it: at most 48 code points, cut short with an ellipsis. */
export function cardPlace(placeLabel: string): string {
  const cps = Array.from(placeLabel)
  return cps.length > PLACE_MAX ? `${cps.slice(0, PLACE_MAX - 1).join('').trimEnd()}…` : placeLabel
}

/** A place that ends on an ellipsis was cut short: each language decides what its headline does then (English drops the full stop). */
const isCut = (place: string) => place.endsWith('…')

/**
 * A pass's headline (owner): the week's N, "7 satellites watched | Waterloo.", the same words as the results headline;
 * the satellite's own sentence ("Sentinel-2C watched | Waterloo.") only when N isn't known (older shares). `place` as
 * it is printed: cardPlace(label) on the card, the whole label in the share page's title.
 */
export function passHeadline(m: CardMessages, verdict: Verdict, satName: string | undefined, place: string, satellites?: number): Rich {
  const n = satellites
  return n !== undefined && Number.isFinite(n) && n >= 1 ? m.headline(Math.round(n), place, isCut(place)) : m.headlineBy[verdict](satName, place, isCut(place))
}

/** One top-level headline part as plain text. */
const blockText = (p: Part) => (isAccent(p) ? plain(p.accent) : plain([p]))

/**
 * The headline as one line of plain text (the share page's title, the post): its blocks joined with a space, or with
 * nothing in Chinese and Japanese.
 */
export function headText(head: Rich, locale: Locale): string {
  return head.map(blockText).join(LOCALE_INFO[locale].sentenceGap)
}

/** The spec's plain-text views of its headline (CardSpec.lead / place / tail). */
export function headPieces(head: Rich, locale: Locale): { lead: string; place: string; tail: string } {
  const a = head.find(isAccent)
  return {
    lead: head.filter((p) => !isAccent(p)).map(blockText).join(LOCALE_INFO[locale].sentenceGap),
    place: a ? plain(a.accent.slice(0, 1)) : '',
    tail: a ? plain(a.accent.slice(1)) : '',
  }
}

/**
 * What the headline's serif lines must hold: the accent's words (the place, and whatever words the language set on its
 * line), without a last part that is only punctuation (a full stop is too small to count). English: "Waterloo" on a
 * pass card, "Waterloo this week." on the week's.
 */
export function accentText(head: Rich, locale: Locale): string {
  const counted = (parts: Part[]) => parts.filter((p, i) => !(i > 0 && i === parts.length - 1 && typeof p === 'string' && /^[\s\p{P}]+$/u.test(p)))
  return head
    .filter(isAccent)
    .map((a) => plain(counted(a.accent)))
    .join(LOCALE_INFO[locale].sentenceGap)
}

/** The smallest headline: every size search stops here (a longer word is cut short instead: fittedPlace). */
export const HEAD_MIN = 36

/** Letters and digits outside the full-width set (cjkEm's): a Latin name in a CJK text part. */
const NARROW_LETTER = /(?![\u1100-\u11ff\u2e80-\u9fff\uac00-\ud7af\uf900-\ufaff\uff00-\uffef])[\p{L}\p{N}]/u

/**
 * Whether every piece of the headline that no renderer breaks fits the 466 px column at size S, in its face and
 * tracking, measured with the faces' own widths (cardMeasure.ts). The browser, the canvas and satori all set a word
 * wider than the column alone on its line and let it run out of the card («Visakhapatnam.» at 84 px, a satellite's
 * name in capitals), whatever the line counts said. A CJK text part is one line whatever its length (HEAD_CJK): it is
 * measured whole, when it holds a Latin name (cjkEm alone sizes the rest, as it always has).
 */
export function headlineFits(head: Rich, locale: Locale, S: number, cjk = false): boolean {
  const P = S * HEAD.placeScale
  const track = headTracking(locale)
  return head.every((part) => {
    if (isAccent(part)) return widestPiecePx(plain(part.accent), 'serif', P, track.place, locale) <= PANEL.w
    const text = plain([part])
    if (!cjk) return widestPiecePx(text, 'display', S, track.lead, locale) <= PANEL.w
    return !NARROW_LETTER.test(text) || textPx(text.trim(), 'display', S, track.lead, locale) <= PANEL.w
  })
}

/** Only the headline's serif blocks (the place and its words) fit at S: what a shorter place can mend. */
const accentFits = (head: Rich, locale: Locale, S: number) => headlineFits(head.filter(isAccent), locale, S)

/**
 * The place as the card sets it: cardPlace's, cut shorter still (with an ellipsis, as a name over 48 code points is) when
 * one of its words would be wider than the column even at HEAD_MIN: a 47-letter Welsh name, a run of coordinates with
 * no space. `build` makes the headline around a place.
 */
function fittedPlace(label: string, locale: Locale, build: (place: string) => Rich): string {
  let place = cardPlace(label)
  let cps = Array.from(place.endsWith('…') ? place.slice(0, -1) : place)
  while (cps.length > 1 && !accentFits(build(place), locale, HEAD_MIN)) {
    cps = cps.slice(0, -1)
    place = `${cps.join('').trimEnd()}…`
  }
  return place
}

/**
 * Headline size so the lead wraps to at most three condensed lines and the serif place to at most
 * two in the 466px column: the smaller of what the lead and the place (accentText) each allow.
 */
export function headlineSize(lead: string, place: string): number {
  const n = lead.length
  const p = Array.from(place).length
  const byLead = n <= 24 ? 84 : n <= 32 ? 72 : n <= 42 ? 62 : 54
  const byPlace = p <= 13 ? 84 : p <= 18 ? 72 : p <= 26 ? 62 : 54
  return Math.min(byLead, byPlace)
}

/** Width in em of text in the card's faces: a Han, kana or hangul character (or full-width punctuation) is a full em. */
export function cjkEm(text: string): number {
  let em = 0
  for (const ch of text) em += /[\u1100-\u11ff\u2e80-\u9fff\uac00-\ud7af\uf900-\ufaff\uff00-\uffef]/.test(ch) ? 1 : /\s/.test(ch) ? 0.25 : 0.52
  return em
}

/**
 * A Chinese, Japanese or Korean headline's size: the largest (84 px down, in 2 px steps) at which every text part
 * fits one line of the column, the place fits two, and the whole block, sub-line included, fits its band. Given the
 * card's `locale`, also one at which no word is wider than the column (headlineFits: a Latin place, a satellite's name).
 */
export function headlineSizeCjk(head: Rich, sub?: string, locale?: Locale): number {
  const texts = head.filter((p): p is string => typeof p === 'string').map((t) => t.trim()).filter(Boolean)
  const places = head.filter(isAccent).map((p) => plain(p.accent))
  const widest = Math.max(0, ...texts.map(cjkEm))
  const subH = sub ? HEAD.subGap + Math.ceil((cjkEm(sub) * CARD_FS.sub) / PANEL.w) * CARD_FS.sub * HEAD.subLH : 0
  for (let S = 84; S > 36; S -= 2) {
    const P = S * HEAD.placeScale
    if (widest * S * 0.98 > PANEL.w) continue
    if (locale && !headlineFits(head, locale, S, true)) continue
    // Whole characters per line (a line never holds a fraction of one), so 11 at 78 px take three lines, not 1.85.
    const perLine = Math.max(1, Math.floor(PANEL.w / P))
    const placeLines = places.map((t) => Math.ceil(cjkEm(t) / perLine))
    if (placeLines.some((n) => n > 2)) continue
    const blocks = texts.length + places.length
    const h = texts.length * S * HEAD_CJK.leadLH + placeLines.reduce((a, n) => a + n * P * HEAD_CJK.placeLH, 0) + Math.max(0, blocks - 1) * P * HEAD.placeGap + subH
    if (h <= PANEL.headBottom - PANEL.headTop - 8) return S
  }
  return 36
}

/**
 * Width in em of a Hindi card's text, per UTF-16 unit: the widest of the Hindi card's lines measured in each face
 * (HarfBuzz, 2026-11-21: the condensed display 0.37, the serif place 0.39 with a Latin name, the sans 0.40). A vowel
 * sign, a virama or a nukta is a unit that adds little or no width, so a count of units errs wide, never narrow.
 */
const DEVANAGARI_EM = { lead: 0.37, place: 0.4, sub: 0.41 } as const

/** The words of `text` as the renderers break it: at breaking spaces only (a no-break space ties its words into one). */
const runs = (text: string) => text.split(/[^\S\u00a0]+/).filter(Boolean)

/** The lines `text` takes in `width` px when each UTF-16 unit is `unit` px wide (greedy, by word), each its words. */
function linesOfUnits(text: string, unit: number, width: number): string[][] {
  const lines: string[][] = []
  let w = 0
  for (const word of runs(text)) {
    const ww = word.length * unit
    if (lines.length && w + unit + ww <= width) {
      w += unit + ww
      lines[lines.length - 1].push(word)
    } else {
      lines.push([word])
      w = ww
    }
  }
  return lines
}

/** How many lines `text` takes in `width` px when each UTF-16 unit is `unit` px wide (greedy, by word). */
function linesByUnits(text: string, unit: number, width: number): number {
  return linesOfUnits(text, unit, width).length
}

/**
 * One word alone on the last of two or more lines (a lone «देखा।» under «262 उपग्रहों ने»). A last line that is one
 * run of words tied by no-break spaces («ने देखा।») is not alone.
 */
function lonelyLast(lines: string[][]): boolean {
  const last = lines[lines.length - 1]
  return lines.length > 1 && last.length === 1 && !last[0].includes('\u00a0')
}

/**
 * Units of the widest run of `text` that no renderer may break (a word, or words tied by no-break spaces), its
 * nonspacing marks left out: a vowel sign above or below, a virama, a nukta or an anusvara has no advance of its own.
 * Counted so, the card's tied runs («262 उपग्रहों ने देखा।», «पट्टी गुज़री।») measure 0.34 to 0.37 em a unit in the
 * display face (Chromium, 2026-11-22), so DEVANAGARI_EM.lead still errs wide on them; with the marks counted, the
 * week's run (441 px at 72 px) would count as 559 px and be set needlessly small.
 */
function widestRun(text: string): number {
  // Whole, even across a hyphen: satori does not break after one inside a tied run («STARLINK-31234 गुज़रा।» ran out of
  // the card at 84 px where the canvas broke it).
  return Math.max(0, ...runs(text).map((r) => r.replace(/\p{Mn}/gu, '').length))
}

/**
 * A Hindi headline's size: at most headlineSize's (the lead in three lines, the place in two), and small enough that
 * the whole block, at HEAD_DEVANAGARI's taller leading and with its sub-line, fits its band. At HEAD's sizes a
 * two-line place, a two-line lead and a sub-line ran into the readouts. A size is also passed over when a run the
 * copy ties is wider than the column (the renderers never break it, so it would overflow: linesByUnits counts it as
 * one line whatever its width), or when a block's last line would hold one word alone: the copy ties the words that
 * must not part (hi.ts), and this keeps a size from leaving an untied one alone.
 */
export function headlineSizeDevanagari(head: Rich, lead: string, place: string, sub?: string): number {
  const leads = head.filter((p) => !isAccent(p)).map((p) => plain([p]).trim()).filter(Boolean)
  const places = head.filter(isAccent).map((p) => plain(p.accent).trim())
  const subH = sub ? HEAD.subGap + linesByUnits(sub, DEVANAGARI_EM.sub * CARD_FS.sub, PANEL.w) * CARD_FS.sub * HEAD.subLH : 0
  for (let S = headlineSize(lead, place); S > 36; S -= 2) {
    const P = S * HEAD.placeScale
    if (leads.some((t) => widestRun(t) * DEVANAGARI_EM.lead * S > PANEL.w)) continue
    const leadSets = leads.map((t) => linesOfUnits(t, DEVANAGARI_EM.lead * S, PANEL.w))
    const placeSets = places.map((t) => linesOfUnits(t, DEVANAGARI_EM.place * P, PANEL.w))
    if ([...leadSets, ...placeSets].some(lonelyLast)) continue
    const leadLines = leadSets.reduce((n, l) => n + l.length, 0)
    const placeLines = placeSets.map((l) => l.length)
    if (leadLines > 3 || placeLines.some((n) => n > 2)) continue
    const blocks = leads.length + places.length
    const h =
      leadLines * S * HEAD_DEVANAGARI.leadLH + placeLines.reduce((a, n) => a + n * P * HEAD_DEVANAGARI.placeLH, 0) + Math.max(0, blocks - 1) * P * HEAD.placeGap + subH
    if (h <= PANEL.headBottom - PANEL.headTop - 8) return S
  }
  return 36
}

/** The headline's size and script flags for a card in `locale` (English and every other script: headlineSize). */
function headSizing(locale: Locale, head: Rich, lead: string, sub?: string): { size: number; cjk?: true } {
  const script = LOCALE_INFO[locale].script
  if (script === 'cjk') return { size: headlineSizeCjk(head, sub, locale), cjk: true }
  if (script === 'devanagari') return { size: headlineSizeDevanagari(head, lead, accentText(head, locale), sub) }
  // A word wider than the column steps the size down until it fits (2 px at a time, so it stays as large as it can).
  let S = headlineSize(lead, accentText(head, locale))
  while (S > HEAD_MIN && !headlineFits(head, locale, S)) S -= 2
  return { size: S }
}

// ── Numbers and places ──────────────────────────────────────────────────────────────────────

export function fmtCoords(lat: number, lon: number): string {
  return `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'} ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? 'E' : 'W'}`
}

/** "Nice" round length ≤ max: 1, 2, 5 × 10ⁿ. */
export function niceLength(max: number): number {
  const p = 10 ** Math.floor(Math.log10(max))
  for (const m of [5, 2, 1]) if (m * p <= max) return m * p
  return p
}

/** "1 km" / "500 m": a scale bar's round length, in the card's language */
export function fmtKm(km: number, locale: Locale = DEFAULT_LOCALE): string {
  return cardMessages(locale).scale(km)
}

// ── Time at the place ───────────────────────────────────────────────────────────────────────
// A port of src/ui/results/lib/time.ts (localParts / zoneAbbr), so the server prints exactly what
// the app prints. A test compares the two.

const fmts = new Map<string, Intl.DateTimeFormat>()
function dtf(site: string, locale: string, timeZone: string, opts: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${site}|${timeZone}`
  let f = fmts.get(key)
  if (!f) {
    try {
      f = new Intl.DateTimeFormat(locale, { ...opts, timeZone })
    } catch {
      f = new Intl.DateTimeFormat(locale, { ...opts, timeZone: 'UTC' })
    }
    fmts.set(key, f)
  }
  return f
}
const PARTS_OPTS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
}
interface Parts {
  year: number
  month: number
  day: number
  weekday: string
  hour: number
  minute: number
  second: number
}
function parts(ms: number, timeZone: string): Parts {
  const ps = dtf('parts', 'en-GB', timeZone, PARTS_OPTS).formatToParts(ms)
  const get = (t: Intl.DateTimeFormatPartTypes) => ps.find((p) => p.type === t)?.value ?? ''
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    weekday: get('weekday').slice(0, 3),
    hour: Number(get('hour')) % 24,
    minute: Number(get('minute')),
    second: Number(get('second')),
  }
}

function utcOffsetMin(ms: number, timeZone: string): number {
  const p = parts(ms, timeZone)
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  return Math.round((asUtc - Math.floor(ms / 1000) * 1000) / 60_000)
}

function utcLabel(offsetMin: number): string {
  if (!offsetMin) return 'UTC'
  const a = Math.abs(offsetMin)
  const h = Math.floor(a / 60)
  const m = a % 60
  return `UTC${offsetMin < 0 ? '−' : '+'}${h}${m ? `:${String(m).padStart(2, '0')}` : ''}`
}

const FIXED_ABBR: Record<string, string> = {
  'Asia/Tokyo': 'JST',
  'Asia/Seoul': 'KST',
  'Asia/Kolkata': 'IST',
  'Asia/Calcutta': 'IST',
  'Asia/Hong_Kong': 'HKT',
  'Asia/Singapore': 'SGT',
  // Indonesia's three zones, as Indonesians write them (Bali and Makassar are WITA, Papua WIT; owner, 2026-11-19)
  'Asia/Jakarta': 'WIB',
  'Asia/Pontianak': 'WIB',
  'Asia/Makassar': 'WITA',
  'Asia/Jayapura': 'WIT',
  'Europe/Moscow': 'MSK',
  'Australia/Perth': 'AWST',
}
const EUROPE: Record<number, [string, string]> = { 0: ['WET', 'WEST'], 60: ['CET', 'CEST'], 120: ['EET', 'EEST'] }
const BRITISH = new Set(['Europe/London', 'Europe/Belfast', 'Europe/Guernsey', 'Europe/Isle_of_Man', 'Europe/Jersey'])
const AUSTRALIA: Record<number, [string, string]> = { 600: ['AEST', 'AEDT'], 570: ['ACST', 'ACDT'], 480: ['AWST', 'AWST'] }

function standardOffsetMin(ms: number, timeZone: string): number {
  const year = new Date(ms).getUTCFullYear()
  return Math.min(utcOffsetMin(Date.UTC(year, 0, 1), timeZone), utcOffsetMin(Date.UTC(year, 6, 1), timeZone))
}

/** "EST", "CET", "JST", "AEDT"… or "UTC+9" where there is no familiar abbreviation (DST-correct). */
export function zoneAbbr(ms: number, timeZone: string): string {
  const fixedName = FIXED_ABBR[timeZone]
  if (fixedName) return fixedName
  if (timeZone.startsWith('Europe/') || timeZone.startsWith('Australia/') || timeZone === 'Arctic/Longyearbyen') {
    const std = standardOffsetMin(ms, timeZone)
    const dst = utcOffsetMin(ms, timeZone) > std ? 1 : 0
    if (BRITISH.has(timeZone)) return dst ? 'BST' : 'GMT'
    if (timeZone === 'Europe/Dublin') return dst ? 'IST' : 'GMT'
    const pair = (timeZone.startsWith('Australia/') ? AUSTRALIA : EUROPE)[std]
    if (pair) return pair[dst]
    return utcLabel(utcOffsetMin(ms, timeZone))
  }
  const name = dtf('zone', 'en-US', timeZone, { timeZoneName: 'short' })
    .formatToParts(ms)
    .find((p) => p.type === 'timeZoneName')?.value
  if (!name || name === 'GMT' || name === 'UTC') return 'UTC'
  if (/^GMT[+-]/.test(name)) return utcLabel(utcOffsetMin(ms, timeZone))
  return name
}

const pad2 = (n: number) => String(n).padStart(2, '0')

/** "11:21": the 24-hour time at the place (international: the same in every language). */
export function localClock(ms: number, timeZone = 'UTC'): string {
  const p = parts(ms, timeZone)
  return `${pad2(p.hour)}:${pad2(p.minute)}`
}

/** "Sun 1 Nov 2026 · 11:21 EST" at the place (the card is the one place a human date carries the year). */
export function localStamp(ms: number, timeZone = 'UTC', locale: Locale = DEFAULT_LOCALE): string {
  return cardMessages(locale).stamp(ms, timeZone, localClock(ms, timeZone), zoneAbbr(ms, timeZone))
}

// ── Imagery: crop, sensor, credit ───────────────────────────────────────────────────────────

const NATIVE_GSD_M: Record<string, number> = {
  'sentinel-2-l2a': 10,
  'landsat-c2-l2': 30,
  'gibs-viirs-noaa20': 375,
  'gibs-viirs-noaa21': 375,
  'gibs-viirs-snpp': 375,
  'gibs-modis-terra': 250,
  'gibs-modis-aqua': 250,
  'gibs-goes-east': 1000,
  'gibs-goes-west': 1000,
  'gibs-himawari': 1000,
}

/** A geostationary imager's full-disc frame (GOES, Himawari, Meteosat): the pixel of its map grid is in km. */
export const isGeoCollection = (collection: string) => /^(gibs-(goes-east|goes-west|himawari)|eumetsat-meteosat-)/.test(collection)
/** The square the app shows of such a frame, and so the card: ±400 km around the place. */
export const GEO_HALF_KM = 400

export interface CardCrop {
  collection: string
  itemId?: string
  /** Half the side of the square on the ground, km */
  halfSizeKm: number
  /** Ground metres per card pixel */
  metresPerPx: number
}

/**
 * The card's crop: one output pixel = one native pixel (10 m for Sentinel-2 → a 6.3 km square: 630 of the scene's
 * own pixels, the very ones the app's photo shows), so the "10 m" on the chip is literally what each pixel is.
 * Landsat's 30 m is soft at 1:1 on a phone, so it renders at 15 m per pixel: an exact 2× of 315 native pixels
 * (9.45 km), as the app's Landsat photo is (500 native pixels at 1000 px), so the card shows the photo's pixels.
 */
export function cardCrop(c: Pick<CardCaptureInput, 'collection' | 'itemId' | 'gsdM'>, px = PLATE): CardCrop {
  // A geostationary frame: the app's own 800 km square (its grid is 2–5 km, so one grid pixel per card pixel would be
  // most of a continent); the chip names the grid, the scale bar the card's pixels.
  if (isGeoCollection(c.collection)) return { collection: c.collection, itemId: c.itemId, halfSizeKm: GEO_HALF_KM, metresPerPx: (2 * GEO_HALF_KM * 1000) / px }
  const gsd = NATIVE_GSD_M[c.collection] ?? c.gsdM ?? 10
  const metresPerPx = c.collection === 'landsat-c2-l2' ? 15 : gsd
  return { collection: c.collection, itemId: c.itemId, halfSizeKm: Math.max(2, (metresPerPx * px) / 2000), metresPerPx }
}

export function sensorName(c: Pick<CardCaptureInput, 'collection' | 'platform'>): string {
  const k = c.collection
  if (k === 'sentinel-2-l2a') return 'MSI'
  if (k === 'landsat-c2-l2') return /9$/.test(c.platform ?? '') ? 'OLI-2' : 'OLI'
  if (k.startsWith('gibs-viirs')) return 'VIIRS'
  if (k.startsWith('gibs-modis')) return 'MODIS'
  if (k === 'gibs-himawari') return 'AHI'
  if (k === 'eumetsat-meteosat-0deg') return 'FCI'
  if (k === 'eumetsat-meteosat-iodc') return 'SEVIRI'
  if (k === 'sentinel-1-rtc') return 'C-SAR'
  return 'ABI'
}

/**
 * Attribution the archive asks for when its imagery is redistributed (the card is redistribution). English in every
 * language: the data policies word it so (the licence credits are not translated).
 */
export function creditFor(c: Pick<CardCaptureInput, 'collection' | 'datetime'>, fallbackMs?: number): string {
  if (c.collection === 'sentinel-2-l2a' || c.collection === 'sentinel-1-rtc') {
    const t = c.datetime ?? fallbackMs
    return `Contains modified Copernicus Sentinel data ${t !== undefined ? new Date(t).getUTCFullYear() : new Date().getUTCFullYear()}`
  }
  if (c.collection === 'landsat-c2-l2') return 'Landsat: USGS / NASA'
  // The attribution EUMETSAT's data policy asks for (article 6.3).
  if (c.collection.startsWith('eumetsat-')) {
    const t = c.datetime ?? fallbackMs
    return `Contains modified EUMETSAT Meteosat data ${t !== undefined ? new Date(t).getUTCFullYear() : new Date().getUTCFullYear()}`
  }
  if (c.collection === 'gibs-himawari') return 'Himawari: JMA, via NASA GIBS'
  if (isGeoCollection(c.collection)) return 'GOES: NOAA / CIRA, via NASA GIBS'
  return 'NASA GIBS / EOSDIS'
}

function scaleFor(m: CardMessages, metresPerPx: number, maxPx = 150): ScaleBar {
  const km = niceLength((maxPx * metresPerPx) / 1000)
  return { px: Math.round((km * 1000) / metresPerPx), label: m.scale(km) }
}

// ── Plate chips (positions shared by every renderer) ────────────────────────────────────────

const INSET = 24

function plateChip(text: string, pos: Chip['pos'], tone: Tone = 'bone', size: number = CARD_FS.chip): Chip {
  return { segs: [{ text, tone }], size, pos }
}

/** The licence credit at the plate's bottom left: English in every language, and cased as English (Chip.lang). */
function creditChip(c: Pick<CardCaptureInput, 'collection' | 'datetime'>, fallbackMs?: number): Chip {
  return { ...plateChip(creditFor(c, fallbackMs), { left: INSET, bottom: INSET }, 'bone2', CARD_FS.micro), lang: 'en' }
}

/** The place reticle: thin ring, four ticks, centre dot, in signal (DESIGN §6). Strokes ≥ 2px so it survives a 600px unfurl. */
export function reticlePrims(cx: number, cy: number, r = 26, width = 2): Prim[] {
  const t0 = r + 9
  const t1 = r + 25
  return [
    { t: 'circle', cx, cy, r, stroke: CARD_COLOR.signal, width },
    { t: 'path', d: `M${cx} ${cy - t0}V${cy - t1}M${cx} ${cy + t0}V${cy + t1}M${cx - t0} ${cy}H${cx - t1}M${cx + t0} ${cy}H${cx + t1}`, stroke: CARD_COLOR.signal, width },
    { t: 'circle', cx, cy, r: 3, fill: CARD_COLOR.signal },
  ]
}

export type Corner = 'tl' | 'tr' | 'bl' | 'br'
const CORNERS: readonly Corner[] = ['tl', 'tr', 'bl', 'br']

/** L-shaped corner ticks inset into the square (all four corners unless `corners` names some). */
export function cornerTickPrim(size: number, inset: number, len: number, color: string, width = 2, corners: readonly Corner[] = CORNERS): Prim {
  const a = inset
  const b = size - inset
  const seg: Record<Corner, string> = {
    tl: `M${a} ${a + len}V${a}H${a + len}`,
    tr: `M${b - len} ${a}H${b}V${a + len}`,
    bl: `M${a} ${b - len}V${b}H${a + len}`,
    br: `M${b - len} ${b}H${b}V${b - len}`,
  }
  return { t: 'path', d: corners.map((c) => seg[c]).join(''), stroke: color, width }
}

/** The corner a chip is anchored in, or null for one placed inside the plate (callouts, distance labels). */
function cornerOf(pos: Chip['pos']): Corner | null {
  const near = (v?: number) => v !== undefined && v <= INSET * 3
  const h = near(pos.left) ? 'l' : near(pos.right) ? 'r' : null
  const v = near(pos.top) ? 't' : near(pos.bottom) ? 'b' : null
  return h && v ? (`${v}${h}` as Corner) : null
}

/**
 * The plate's viewfinder ticks, only in the corners no chip holds (the scale bar holds the top right),
 * with the outer edge of the 2px stroke on the chips' 24px inset: every corner element lines up, and no
 * tick ever peeks out around a chip.
 */
export function plateFrame(chips: readonly (Chip | undefined)[], scale: ScaleBar | undefined, color: string): Prim[] {
  const held = new Set<Corner>()
  for (const c of chips) {
    const k = c ? cornerOf(c.pos) : null
    if (k) held.add(k)
  }
  if (scale && scale.px > 0) held.add('tr')
  const free = CORNERS.filter((c) => !held.has(c))
  return free.length ? [cornerTickPrim(PLATE, INSET + 1, 16, color, 2, free)] : []
}

/** Ticks over a picture: bright enough to read on any terrain. */
const PICTURE_TICK = 'rgba(236,232,224,0.85)'

/** What is drawn over a picture: the free-corner ticks and the place reticle at the centre. */
export function imageOverlay(chips: readonly (Chip | undefined)[], scale: ScaleBar | undefined): Prim[] {
  return [...plateFrame(chips, scale, PICTURE_TICK), ...reticlePrims(PLATE / 2, PLATE / 2)]
}

/** Diagonal hatch over a clouded picture (as PassList's clouded thumbnail: 135°, 1px lines ≈ 5px apart). */
export function hatchPath(size: number, step = 7): string {
  let d = ''
  for (let k = 0; k < 2 * size; k += step) d += `M${k} 0L${k - size} ${size}`
  return d
}

/** The verdict mark (DESIGN §2): ◆ photographed, ◇ likely, □ could, ✛ overhead. */
export function verdictGlyphPrims(v: Verdict, s = 14): Prim[] {
  const m = s / 2
  const stroke = v === 'imaged' || v === 'likely' ? CARD_COLOR.signal : CARD_COLOR.bone
  if (v === 'imaged') return [{ t: 'path', d: `M${m} 0.5L${s - 0.5} ${m}L${m} ${s - 0.5}L0.5 ${m}Z`, fill: CARD_COLOR.signal }]
  if (v === 'likely') return [{ t: 'path', d: `M${m} 1.5L${s - 1.5} ${m}L${m} ${s - 1.5}L1.5 ${m}Z`, stroke, width: 1.5 }]
  if (v === 'could') return [{ t: 'path', d: `M2 2H${s - 2}V${s - 2}H2Z`, stroke, width: 1.5 }]
  return [{ t: 'path', d: `M${m} 1V${s - 1}M1 ${m}H${s - 1}`, stroke, width: 1.5 }]
}

// ── Plan plate: the pass to scale, north up ─────────────────────────────────────────────────

/**
 * No picture to show (commercial, crewed, not archived, or the archive was slow): draw the pass
 * itself, to scale. The place is the reticle at the centre; the ground track passes at the real
 * closest-approach distance and azimuth, in the real direction of travel. North is up.
 */
export function planPlate(input: Pick<CardInput, 'pass' | 'satName'>, note: string, locale: Locale = DEFAULT_LOCALE): PlanPlate {
  const m = cardMessages(locale)
  const S = PLATE
  const c = S / 2
  const p = input.pass
  const dist = p.groundDistanceKm
  const halfKm = niceLength(Math.max(30, (dist ?? 0) * 1.7) * 1.25) // keep the track well inside the frame
  const kmToPx = c / halfKm
  const prims: Prim[] = []
  const chips: Chip[] = []

  const step = S / 12
  let grid = ''
  for (let i = 1; i < 12; i++) grid += `M${i * step} 0V${S}M0 ${i * step}H${S}`
  prims.push({ t: 'path', d: grid, stroke: 'rgba(236,232,224,0.05)', width: 1 })
  prims.push({ t: 'path', d: `M${c} 0V${S}M0 ${c}H${S}`, stroke: 'rgba(236,232,224,0.09)', width: 1 })
  prims.push({ t: 'circle', cx: c, cy: c, r: c / 2, stroke: 'rgba(236,232,224,0.08)', width: 1 })

  const hdg = p.headingDeg
  if (hdg !== undefined) {
    const rad = Math.PI / 180
    const az = p.azimuthDeg ?? (hdg + 90) % 360
    const g = (dist ?? 0) * kmToPx
    const px = c + g * Math.sin(az * rad)
    const py = c - g * Math.cos(az * rad)
    const dx = Math.sin(hdg * rad)
    const dy = -Math.cos(hdg * rad)
    const nx = -dy
    const ny = dx
    const L = S * 1.5
    const r1 = (v: number) => Math.round(v * 10) / 10
    // Trail behind the satellite (alpha fading along it, as on the globe), the path ahead dashed and dim.
    prims.push({
      t: 'path',
      d: `M${r1(px - dx * L)} ${r1(py - dy * L)}L${r1(px)} ${r1(py)}`,
      width: 2,
      grad: { x1: r1(px - dx * S * 0.7), y1: r1(py - dy * S * 0.7), x2: r1(px), y2: r1(py), from: 'rgba(236,232,224,0)', to: 'rgba(236,232,224,0.95)' },
    })
    prims.push({ t: 'path', d: `M${r1(px + dx * 34)} ${r1(py + dy * 34)}L${r1(px + dx * L)} ${r1(py + dy * L)}`, stroke: 'rgba(236,232,224,0.32)', width: 1.5, dash: [2, 6] })
    const tx = px + dx * 26
    const ty = py + dy * 26
    prims.push({
      t: 'path',
      d: `M${r1(tx - dx * 8 + nx * 6)} ${r1(ty - dy * 8 + ny * 6)}L${r1(tx)} ${r1(ty)}L${r1(tx - dx * 8 - nx * 6)} ${r1(ty - dy * 8 - ny * 6)}`,
      stroke: CARD_COLOR.bone,
      width: 2,
    })
    // Closest-approach perpendicular, labelled at its midpoint.
    if (g > 60) {
      prims.push({ t: 'path', d: `M${c} ${c}L${r1(px)} ${r1(py)}`, stroke: 'rgba(236,232,224,0.55)', width: 1, dash: [3, 4] })
      const mx = (c + px) / 2
      const my = (c + py) / 2
      const side = dx * (px - c) + dy * (py - c) >= 0 ? 1 : -1 // keep the label off the track
      const lx = mx - dx * 16 * side
      const ly = my - dy * 16 * side
      chips.push(plateChip(m.distance(dist ?? 0), lx >= c ? { left: r1(lx), top: r1(ly - 14) } : { right: r1(S - lx), top: r1(ly - 14) }))
    }
    // The satellite at closest approach and its callout (leader line + chip).
    prims.push({ t: 'circle', cx: r1(px), cy: r1(py), r: 6, fill: CARD_COLOR.ink1, stroke: CARD_COLOR.bone, width: 2 })
    const alt = p.altitudeKm !== undefined ? m.distance(p.altitudeKm) : null
    const name = input.satName ?? m.aSatellite
    // Mono 13px with +0.08em tracking ≈ 9.2 px per glyph, plus chip padding and gap.
    const calloutW = (name.length + (alt ? alt.length : 0)) * 9.2 + 34
    const away = px >= c ? 1 : -1
    const fits = (sd: number) => (sd > 0 ? S - 16 - (px + 24 + 12) : px - 24 - 12 - 16) >= calloutW
    const side = fits(away) ? away : -away
    const ax = px + side * 24
    const ay = Math.max(76, Math.min(S - 136, py + (py >= c ? 30 : -30)))
    prims.push({ t: 'path', d: `M${r1(px + (ax - px) * 0.3)} ${r1(py + (ay - py) * 0.3)}L${r1(ax)} ${r1(ay)}H${r1(ax + side * 12)}`, stroke: CARD_COLOR.bone3Mark, width: 1.5 })
    const segs: ChipSeg[] = [{ text: name, tone: 'bone' }]
    if (alt) segs.push({ text: alt, tone: 'bone3' })
    chips.push({ segs, size: CARD_FS.chip, pos: side > 0 ? { left: r1(ax + 12), top: r1(ay - 15) } : { right: r1(S - ax + 12), top: r1(ay - 15) } })
  }

  prims.push(...reticlePrims(c, c, 18))
  chips.unshift(plateChip(m.geometry, { left: INSET, top: INSET }, 'bone2'))
  chips.push(plateChip(note, { left: INSET, bottom: INSET }, 'bone2'))
  const scale: ScaleBar = { px: Math.round(c / 2), label: m.scale(halfKm / 2) }
  prims.push(...plateFrame(chips, scale, CARD_COLOR.bone3Mark))
  return { kind: 'plan', prims, chips, scale }
}

function planNote(m: CardMessages, verdict: Verdict, imageMiss?: 'transient' | 'permanent'): string {
  if (verdict === 'imaged') return imageMiss === 'permanent' ? m.note.imageInApp : m.note.imageUnavailable
  if (verdict === 'could') return m.note.commercial
  if (verdict === 'likely') return m.note.inSwath
  return m.note.groundTrack
}

// ── The spec ────────────────────────────────────────────────────────────────────────────────

/** Mostly cloud: cloud at the spot, or most of the scene (as results' isClouded, so both sides agree). */
export function isCloudedCapture(c: Pick<CardCaptureInput, 'cloudCoverPct' | 'spot'> | undefined): boolean {
  return c?.spot === 'cloud' || (c?.cloudCoverPct ?? 0) >= CLOUDED_PCT
}

function readoutsFor(input: CardInput, m: CardMessages, locale: Locale): Readout[] {
  const p = input.pass
  const int = fmt(locale).int
  const dec = m.decimal
  const dash = (v: number | undefined, show: (n: number) => string, unit?: string): Pick<Readout, 'value' | 'unit'> =>
    v === undefined || !Number.isFinite(v) ? { value: '—' } : { value: show(v), unit }
  const out: Readout[] = [{ label: m.readout.altitude, ...dash(p.altitudeKm, int, m.unit.km) }]
  if (input.verdict === 'overhead') {
    out.push({ label: m.readout.elevation, ...dash(p.elevationDeg, (n) => `${int(n)}°`) }, { label: m.readout.speed, ...dash(p.groundSpeedKmS, (n) => dec(n, 2), m.unit.kmPerSecond) })
    return out
  }
  out.push({ label: m.readout.offNadir, ...dash(p.offNadirDeg, (n) => `${dec(n, 1)}°`) })
  const c = input.verdict === 'imaged' ? input.capture : undefined
  if (c) {
    const gsd = c.gsdM ?? NATIVE_GSD_M[c.collection]
    const mosaic = c.collection.startsWith('gibs-') && !isGeoCollection(c.collection)
    if (gsd !== undefined && gsd >= 1000) out.push({ label: m.readout.pixel, value: int(gsd / 1000), unit: m.unit.km })
    else out.push({ label: mosaic ? m.readout.mosaicPixel : m.readout.pixel, ...dash(gsd, (n) => (n < 1 ? dec(n, 2) : int(n)), m.unit.m) })
  } else out.push({ label: m.readout.closest, ...dash(p.groundDistanceKm, int, m.unit.km) })
  return out
}

/**
 * Build the card from a normalised input (client: the selected pass; server: the stored share), in `locale`: the
 * sharer's language (the app's when they share, the link's `l=` on the server). English by default, for callers
 * that only ever print English (scripts, older tests).
 */
/**
 * The card's fonts have no narrow no-break space (U+202F) or thin space (U+2009): satori sends a character its fonts lack
 * to Google Fonts for a subset (two requests, up to 4 s each) before the card renders, and the canvas draws it in a
 * system face. French puts U+202F before ; ! ? and inside « », so every card's text takes a no-break space for them
 * instead (docs/i18n/fr.md). English has neither, so an English card is unchanged.
 */
function cardSpaces<T>(v: T): T {
  if (typeof v === 'string') return v.replace(/[\u202f\u2009]/g, '\u00a0') as T
  if (Array.isArray(v)) return v.map(cardSpaces) as T
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, cardSpaces(x)])) as T
  return v
}

export function buildCardSpec(input: CardInput, locale: Locale = DEFAULT_LOCALE): CardSpec {
  const m = cardMessages(locale)
  const place = fittedPlace(input.placeLabel, locale, (p) => passHeadline(m, input.verdict, input.satName, p, input.satellites))
  const head = passHeadline(m, input.verdict, input.satName, place, input.satellites)
  const pieces = headPieces(head, locale)
  const c = input.capture
  const clouded = input.verdict === 'imaged' && !!c && (input.clouded ?? isCloudedCapture(c))
  // The words for a clouded picture (R2SH3). A caller that calls it clouded on evidence the capture
  // doesn't carry gets the most modest wording: cloud over the spot.
  const words = clouded ? (cloudWords(c?.cloudCoverPct, c?.spot, locale) ?? cloudWords(undefined, 'cloud', locale)) : undefined
  let plate: Plate
  if (input.verdict === 'imaged' && c && input.imageMiss !== 'permanent') {
    const crop = cardCrop(c)
    const gsd = c.gsdM ?? NATIVE_GSD_M[c.collection] ?? crop.metresPerPx
    const chip = plateChip(`${input.satName ?? m.aSatellite} · ${sensorName(c)} · ${m.pixelSize(gsd)}`, { left: INSET, top: INSET }, 'bone', CARD_FS.chipLead)
    const credit = creditChip(c, input.tClosest)
    const scale = scaleFor(m, crop.metresPerPx)
    plate = {
      kind: 'image',
      crop,
      chip,
      credit,
      scale,
      clouded: words ? plateChip(words.chip, { left: INSET, bottom: INSET + 38 }, 'warn') : undefined,
      overlay: imageOverlay([chip, credit], scale),
      fallback: planPlate(input, planNote(m, 'imaged', 'transient'), locale),
    }
  } else plate = planPlate(input, planNote(m, input.verdict, input.imageMiss), locale)

  return cardSpaces({
    verdict: input.verdict,
    locale,
    stamp: input.tClosest !== undefined ? localStamp(input.tClosest, input.timeZone, locale) : '',
    head,
    ...pieces,
    sub: words?.sub,
    // The place's lines hold the place and any words the language sets beside it (its full stop is too small to count).
    ...headSizing(locale, head, pieces.lead, words?.sub),
    readouts: readoutsFor(input, m, locale),
    footLeft: m.invite,
    host: input.host,
    plate,
  })
}

// ── Summary card (share SH6): the week at a place, with its closest look ────────────────────

export interface SummaryInput {
  placeLabel: string
  /** The rounded share point (2 decimals) */
  lat: number
  lon: number
  /**
   * N: distinct satellites that watched the place this week, i.e. with any pass (imaged, likely, could, overhead),
   * geostationary watchers excluded (they don't fly over). The results headline's number (headline().flewOver).
   */
  satellites: number
  /** The four verdict counts. `imaged` is K: the real images made public this week (results' headline().images). */
  counts: { imaged: number; likely: number; could: number; overhead: number }
  /** The image archives didn't answer: K is unknown, so the photos line says that instead of a count. */
  archiveDown?: boolean
  /** The archives were still answering when this was shared: K is a floor ("At least 4 photos…"). */
  partial?: boolean
  /** End of the 7-day window, epoch ms */
  windowEnd?: number
  timeZone?: string
  /**
   * The results gallery's first image, and why it leads (its tag in the gallery): the closest clear look, the last
   * clear look from before the week, the least cloudy when every photo is clouded, a radar image in a week with no
   * photo; `plain` for a first image the gallery tags with nothing. Missing `look` reads as the closest look.
   */
  /**
   * `satName` is missing when the image's satellite has no name: the chip then prints the catalog's `aSatellite`, and
   * the share page's sentences say "a satellite" in their own words.
   */
  best?: { satName?: string; tClosest?: number; capture: CardCaptureInput; look?: SummaryLook }
  host: string
}

/** Why the summary card's picture leads (results lib/photos.ts CoverKind, plus radar and none). */
export type SummaryLook = 'closest' | 'lastClear' | 'clouded' | 'radar' | 'plain'

/** A summary link's `bw`: why its picture leads, when it is not the closest look (the default, never written). */
export const LOOK_CODES: Record<Exclude<SummaryLook, 'closest'>, string> = { lastClear: 'lc', clouded: 'co', radar: 'ra', plain: 'pl' }
export const lookOfCode = (code: string | null): SummaryLook | undefined =>
  (Object.keys(LOOK_CODES) as Exclude<SummaryLook, 'closest'>[]).find((k) => LOOK_CODES[k] === code)

/**
 * The summary plate's chip, in the gallery's own words: "Closest look · Sentinel-2B · 10 m", "Last clear look · 3 Nov ·
 * Landsat 9" (from before the week, so its day is said; its pixel size gave way to the scale chip, summaryLookFit),
 * "Clouded over · …", "Radar · Sentinel-1D · 20 m".
 */
export function summaryLookChip(best: NonNullable<SummaryInput['best']>, timeZone = 'UTC', locale: Locale = DEFAULT_LOCALE): string {
  return summaryLookFit(best, timeZone, locale).text
}

/**
 * The summary plate's chip and its scale bar, fitted together: the chip must end before the scale chip at the plate's
 * top right ("LAST CLEAR LOOK · 3 NOV · LANDSAT 9 · 30 m" ran 72 px under it, in English). First the bar takes a
 * shorter round length (it may be anything up to 150 px), then the chip gives up the pixel size, the satellite's
 * name, and last the day, which says the picture is from before the week.
 */
export function summaryLookFit(best: NonNullable<SummaryInput['best']>, timeZone = 'UTC', locale: Locale = DEFAULT_LOCALE): { text: string; scale: ScaleBar } {
  const m = cardMessages(locale)
  const c = best.capture
  const mpp = cardCrop(c).metresPerPx
  const gsd = c.gsdM ?? NATIVE_GSD_M[c.collection] ?? mpp
  const look = best.look ?? 'closest'
  const lead = look === 'closest' || look === 'lastClear' || look === 'clouded' || look === 'radar' ? m.look[look] : undefined
  const day = look === 'lastClear' && best.tClosest !== undefined ? m.lookDay(best.tClosest, timeZone) : undefined
  const sat = best.satName ?? m.aSatellite
  // Mono chip segments joined by the card's " · " (DESIGN: label · data · data, the same in every language).
  const texts = [[lead, day, sat, m.pixelSize(gsd)], [lead, day, sat], [lead, day], [lead]].map((t) => t.filter((x): x is string => !!x).join(' · '))
  const fits = (text: string, scale: ScaleBar) => INSET + monoWidth(text, CARD_FS.chipLead) + 2 * CHIP_BOX.padX + 2 + 8 <= PLATE - INSET - chipWidth(scale)
  const scales = [scaleFor(m, mpp), scaleFor(m, mpp, 80)]
  for (const text of texts) for (const scale of scales) if (fits(text, scale)) return { text, scale }
  return { text: texts[texts.length - 1], scale: scales[1] }
}

/**
 * A mono caps chip's text width: the card's mono face advances 0.65 em a character, plus the label tracking (a CJK
 * character, from a fallback face, about a full em).
 */
const monoWidth = (t: string, size: number) =>
  [...t].reduce((w, ch) => w + (/[\u1100-\u11ff\u2e80-\u9fff\uac00-\ud7af\uff00-\uffef]/.test(ch) ? 1 : 0.65) * size + TRACK.label * size, 0)
/** The scale chip's width: its bar, the gap, its label, padding and border (api/_lib/card.ts scaleBar). */
const chipWidth = (s: ScaleBar) => s.px + CHIP_BOX.gap + monoWidth(s.label, CARD_FS.chip) + 2 * CHIP_BOX.padX + 2

/**
 * The second line (owner F): "31 images were made public." / "1 image was made public." / "At least 4 images were made
 * public." (one count: photos, weather mosaics and radar images alike). The results panel's photosLine words, except a
 * zero: the summary's first sentence already says "this week", so it reads "No images were made public." rather than
 * repeating it. With the archives down, the results' outage line (src/ui/results/lib/copy.ts ARCHIVE_DOWN_LINE; `short`
 * where the card's sub-line has room for one line).
 */
export function photosSentence(k: number, opts: { archiveDown?: boolean; partial?: boolean; short?: boolean } = {}, locale: Locale = DEFAULT_LOCALE): string {
  const m = cardMessages(locale)
  if (opts.archiveDown) return opts.short ? m.archiveDownShort : m.archiveDown
  return m.photos(Math.max(0, Math.round(k)), !!opts.partial)
}

/** "31 satellites watched Waterloo this week." (R3-13: the summary share's first sentence, everywhere it is printed) */
export function summaryHeadline(i: Pick<SummaryInput, 'satellites' | 'placeLabel'>, locale: Locale = DEFAULT_LOCALE): string {
  return headText(cardMessages(locale).headlineWeek(Math.max(0, Math.round(i.satellites)), i.placeLabel, false), locale)
}

/** "31 satellites watched Waterloo this week. 12 images were made public." (R3-13, owner F) */
export function summarySentences(i: Pick<SummaryInput, 'satellites' | 'placeLabel' | 'counts' | 'archiveDown' | 'partial'>, locale: Locale = DEFAULT_LOCALE): string {
  return [summaryHeadline(i, locale), photosSentence(i.counts.imaged, i, locale)].join(LOCALE_INFO[locale].sentenceGap)
}

/**
 * "31 satellites watched *Waterloo this week.*" + "12 images were made public." over the gallery's first image, with
 * the four verdict counts, in `locale` (as buildCardSpec).
 */
export function buildSummarySpec(i: SummaryInput, locale: Locale = DEFAULT_LOCALE): CardSpec {
  const m = cardMessages(locale)
  const int = fmt(locale).int
  const n = Math.max(0, Math.round(i.satellites))
  const place = fittedPlace(i.placeLabel, locale, (p) => m.headlineWeek(n, p, isCut(p)))
  // The results headline, in the card's two type faces (R3-13): the condensed lead, then the serif place.
  const head = m.headlineWeek(n, place, isCut(place))
  const pieces = headPieces(head, locale)
  let plate: Plate
  const c = i.best?.capture
  if (c && i.best) {
    const crop = cardCrop(c)
    const fit = summaryLookFit(i.best, i.timeZone, locale)
    const chip = plateChip(fit.text, { left: INSET, top: INSET }, 'bone', CARD_FS.chipLead)
    const credit = creditChip(c, i.best.tClosest)
    const scale = fit.scale
    plate = { kind: 'image', crop, chip, credit, scale, overlay: imageOverlay([chip, credit], scale), fallback: emptyPlate(planNote(m, 'imaged', 'transient')) }
  } else {
    // Say "no public photo" only when K says so: with the archives down (K unknown) or a count but no picture in the link,
    // the plate stays neutral beside the sub-line ("The image archives didn’t answer." / "1 image was made public.").
    const none = !i.archiveDown && Math.round(i.counts.imaged) <= 0
    plate = emptyPlate(none ? m.noPublicPhoto : m.noPhoto)
  }
  const readouts: Readout[] = (['imaged', 'likely', 'could', 'overhead'] as const).map((v) => ({ label: m.lane[v], value: int(i.counts[v]) }))
  return cardSpaces({
    verdict: n > 0 ? 'imaged' : 'overhead',
    locale,
    stamp: i.windowEnd !== undefined ? m.weekTo(i.windowEnd, i.timeZone ?? 'UTC') : m.lastWeek,
    head,
    ...pieces,
    sub: photosSentence(i.counts.imaged, { ...i, short: true }, locale),
    // The words on the place's line ("Waterloo this week.") count toward what it must hold.
    ...headSizing(locale, head, pieces.lead, photosSentence(i.counts.imaged, { ...i, short: true }, locale)),
    readouts,
    // Four columns of 116px: a six-character count ("12,345") steps down so it clears the next rule.
    readoutSize: readouts.some((r) => r.value.length > 5) ? 21 : 26,
    footLeft: m.invite,
    host: i.host,
    plate,
  })
}

/** No picture to show (none this week, or the archive was slow): the instrument face alone (grid, reticle, a plain note). */
function emptyPlate(note: string): PlanPlate {
  const S = PLATE
  const c = S / 2
  const step = S / 12
  let grid = ''
  for (let k = 1; k < 12; k++) grid += `M${k * step} 0V${S}M0 ${k * step}H${S}`
  const chips = [plateChip(note, { left: INSET, bottom: INSET }, 'bone2')]
  const scale: ScaleBar = { px: 0, label: '' }
  return {
    kind: 'plan',
    prims: [
      { t: 'path', d: grid, stroke: 'rgba(236,232,224,0.05)', width: 1 },
      { t: 'path', d: `M${c} 0V${S}M0 ${c}H${S}`, stroke: 'rgba(236,232,224,0.09)', width: 1 },
      ...reticlePrims(c, c, 18),
      ...plateFrame(chips, scale, CARD_COLOR.bone3Mark),
    ],
    chips,
    scale,
  }
}

/** The plate to draw: the picture, or its geometry fallback when the picture couldn't be fetched. */
export function plateOrFallback(plate: Plate, haveImage: boolean): Plate {
  return plate.kind === 'image' && !haveImage ? plate.fallback : plate
}

export const TONE_COLOR: Record<Tone, string> = {
  bone: CARD_COLOR.bone,
  bone2: CARD_COLOR.bone2,
  bone3: CARD_COLOR.bone3,
  signal: CARD_COLOR.signal,
  warn: CARD_COLOR.warn,
}

/** Chip box metrics (px) shared by the renderers: padding and the gap between segments. */
export const CHIP_BOX = { padX: 10, padTop: 7, padBottom: 6, gap: 10, lineH: 1.3 } as const
