/**
 * The site's design tokens (src/styles/tokens.css, docs/DESIGN.md), restated for the video. The promo is set in the
 * product's own ink, bone and one signal orange, and its own three faces, so that the cut from type to the real page
 * in the last beat changes nothing but the content.
 */
import type { CSSProperties } from 'react'

export const INK = '#07080A'
export const INK_1 = '#0C0E11'
export const BONE = '#ECE8E0'
export const SIGNAL = '#FF6A1A'

const boneAt = (a: number) => `rgb(236 232 224 / ${a})`
const inkAt = (a: number) => `rgb(7 8 10 / ${a})`

/** A frame's palette: ink is the default, bone and signal are the two inversions used for punctuation. */
export type Tone = 'ink' | 'bone' | 'signal'

export interface Palette {
  bg: string
  fg: string
  /** secondary text */
  fg2: string
  /** labels */
  dim: string
  /** hairlines */
  line: string
  /** corner ticks and other non-text marks */
  mark: string
  /** the accent: signal on ink and bone, ink on signal */
  accent: string
}

export const PALETTE: Record<Tone, Palette> = {
  ink: { bg: INK, fg: BONE, fg2: boneAt(0.64), dim: boneAt(0.52), line: boneAt(0.1), mark: boneAt(0.4), accent: SIGNAL },
  bone: { bg: BONE, fg: INK, fg2: inkAt(0.7), dim: inkAt(0.56), line: inkAt(0.14), mark: inkAt(0.5), accent: SIGNAL },
  signal: { bg: SIGNAL, fg: INK, fg2: inkAt(0.76), dim: inkAt(0.62), line: inkAt(0.18), mark: inkAt(0.5), accent: INK },
}

export const SANS = 'Instrument Sans Variable'
export const MONO = 'Martian Mono Variable'
export const SERIF = 'Instrument Serif'

/** The page's left and right margin (the landing's hero starts on it), in video pixels. */
export const MARGIN = 72
/** The width type can fill. */
export const MEASURE = 1920 - 2 * MARGIN

/** Display: the condensed sans, tight, as the landing's headline is set. */
export const display = (size: number): CSSProperties => ({
  fontFamily: SANS,
  fontStretch: '75%',
  fontWeight: 580,
  letterSpacing: '-0.02em',
  lineHeight: 0.92,
  fontSize: size,
})

/** Running text. */
export const body = (size: number): CSSProperties => ({
  fontFamily: SANS,
  fontStretch: '100%',
  fontWeight: 400,
  lineHeight: 1.22,
  fontSize: size,
})

/** Mono labels: caps, tracked, tabular. */
export const label = (size = 22): CSSProperties => ({
  fontFamily: MONO,
  fontStretch: '87.5%',
  fontWeight: 400,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  fontVariantNumeric: 'tabular-nums',
  lineHeight: 1,
  fontSize: size,
  whiteSpace: 'nowrap',
})

/** The serif accent: one phrase a screen, for the human moment. */
export const accent = (): CSSProperties => ({
  fontFamily: SERIF,
  fontStyle: 'italic',
  fontWeight: 400,
  fontStretch: '100%',
  letterSpacing: '-0.015em',
})
