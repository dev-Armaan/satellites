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
import { MARGIN, MEASURE, PALETTE, accent, display } from '../theme'
import { T } from '../timing'

/** The line that sets it up: two beats. */
const INTRO = 8 * T
/** English for two beats, long enough to be recognised as the page; then a language every sixteenth, through the bar that sings "I am a satellite". */
const FIRST_HOLD = 8 * T
const EVERY = T

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
