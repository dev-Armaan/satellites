/**
 * What is new: the app in sixteen languages. This is the only place the product is shown, and it is shown as it is:
 * full-frame captures of the real landing page (scripts/capture-product.cjs), one per language, cut fast enough that
 * the headline seems to retype itself while the globe and the frame stay put. No overlay is laid on the page; its own
 * header names each language.
 */
import type { FC } from 'react'
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion'
import { Frame } from '../components/Frame'
import { LANGUAGES, LANGUAGE_COUNT } from '../data/languages'
import { fitDisplay } from '../fit'
import { punch } from '../motion'
import type { Cue } from '../sound'
import { MARGIN, MEASURE, PALETTE, accent, display } from '../theme'
import { T } from '../timing'

/** The line that sets it up. */
const INTRO = 6 * T
/** English first, long enough to be recognised as the page; then a language every tenth and a half. */
const FIRST_HOLD = 4 * T
const EVERY = 9

/** A hit on the line, another as the page arrives, and a shutter on every language. */
export const LANGUAGES_CUES: Cue[] = [
  { at: 0, sound: 'thump', volume: 0.8 },
  { at: INTRO, sound: 'thump', volume: 0.55, rate: 1.1 },
  ...LANGUAGES.map((_, i) => ({ at: INTRO + FIRST_HOLD + i * EVERY, sound: 'shutter' as const, volume: 0.6, rate: 0.94 + 0.12 * ((i * 7) % 5) / 4 })),
]

export const Languages: FC = () => {
  const frame = useCurrentFrame()
  const p = PALETTE.ink
  if (frame < INTRO) {
    const line = `Now in ${LANGUAGE_COUNT} languages.`
    return (
      <Frame section="what is new" readout={`${LANGUAGE_COUNT} languages`}>
        <AbsoluteFill style={{ justifyContent: 'center', padding: `0 ${MARGIN}px 20px`, scale: punch(frame) }}>
          <div style={{ ...display(fitDisplay(line, MEASURE * 0.96)), color: p.fg, whiteSpace: 'nowrap' }}>
            Now in <span style={{ ...accent(), fontSize: '1.08em', color: p.accent }}>{LANGUAGE_COUNT}</span> languages.
          </div>
        </AbsoluteFill>
      </Frame>
    )
  }
  const f = frame - INTRO
  // After the run the page comes back to English and holds until the scene ends.
  const step = f < FIRST_HOLD ? 0 : 1 + Math.floor((f - FIRST_HOLD) / EVERY)
  const locale = step < LANGUAGES.length ? LANGUAGES[step] : LANGUAGES[0]
  return (
    <AbsoluteFill style={{ backgroundColor: p.bg }}>
      {/* Pixel for pixel: the capture is the frame's size, and scaling it would soften the page's hairlines. */}
      <Img src={staticFile(`product/${locale}.png`)} style={{ width: '100%', height: '100%' }} />
    </AbsoluteFill>
  )
}
