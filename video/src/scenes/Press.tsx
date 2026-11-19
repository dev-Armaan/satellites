/**
 * The press, one outlet a cut. Half a second is enough for a name and not for a sentence, so the name is the poster
 * on the left and the proof is on the right: a screenshot of the outlet's own page (scripts/capture-proof.cjs). An
 * outlet with no capture yet gets its own headline in type in the same place. Every card has the same skeleton, so
 * across the cuts only the content moves.
 */
import { measureText } from '@remotion/layout-utils'
import type { FC } from 'react'
import { AbsoluteFill, Img, useCurrentFrame } from 'remotion'
import { Frame } from '../components/Frame'
import { PRESS } from '../data/press'
import { fitAccent, fitDisplay } from '../fit'
import { drift, punch } from '../motion'
import { shot, type ProofProps } from '../proof'
import { MARGIN, PALETTE, SANS, accent, display, label, type Tone } from '../theme'
import { T } from '../timing'

/** How long each card holds: a beat and a half each (six sixteenths), so the four fill the bar and a half after the first two beats. */
const HOLDS = [6, 6, 6, 6].map((n) => n * T)
/** The widest a name may be set, the air between it and the proof, and the proof's top and height. */
const NAME_W = 700
const GAP = 84
const SHOT_TOP = 124
const SHOT_H = 1080 - 2 * SHOT_TOP

/** How wide a name's widest line is at a size. */
const nameWidth = (lines: string[], size: number) =>
  Math.max(
    ...lines.map(
      (text) => measureText({ text, fontFamily: SANS, fontSize: size, fontWeight: 580, letterSpacing: '-0.02em', additionalStyles: { fontStretch: '75%' } }).width,
    ),
  )

const pad = (n: number) => String(n).padStart(2, '0')

export const Press: FC<ProofProps> = ({ sizes }) => {
  const frame = useCurrentFrame()
  let index = 0
  let from = 0
  while (index < PRESS.length - 1 && frame >= from + HOLDS[index]) from += HOLDS[index++]
  const item = PRESS[index]
  const tone: Tone = item.inverted ? 'bone' : 'ink'
  const p = PALETTE[tone]
  const captured = sizes[item.shot]
  // A capture that is only a strip (the thread's head) leaves room under it: the readout goes there, not under the name.
  const strip = !!captured && captured[0] / captured[1] > 3
  const readoutLeft = item.readout && !strip
  const size = Math.min(...item.lines.map((line) => fitDisplay(line, NAME_W, readoutLeft ? 280 : 330)))
  // The proof takes everything to the right of the name (a short name leaves it more), and a capture is fitted
  // inside that, whatever its shape.
  const left = MARGIN + Math.max(nameWidth(item.lines, size), item.readout && readoutLeft ? 560 : 0) + GAP
  const SHOT = { left, top: SHOT_TOP, width: 1920 - left - MARGIN, height: SHOT_H }
  const fit = captured ? Math.min(SHOT.width / captured[0], SHOT.height / captured[1]) : 0
  return (
    <Frame tone={tone} section="the press" readout={`${pad(index + 1)} / ${pad(PRESS.length)}`}>
      <AbsoluteFill style={{ padding: `0 ${MARGIN}px 20px`, justifyContent: 'center' }}>
        <div style={{ width: NAME_W, scale: punch(frame, from), transformOrigin: 'left center' }}>
          <div style={{ ...label(24), color: p.dim, marginBottom: 28, whiteSpace: 'normal', lineHeight: 1.5 }}>{item.kicker}</div>
          <div style={{ ...display(size), color: p.fg, marginLeft: -size * 0.035 }}>
            {item.lines.map((line) => (
              <div key={line} style={{ whiteSpace: 'nowrap' }}>
                {line}
              </div>
            ))}
          </div>
          {readoutLeft ? <div style={{ ...accent(), fontSize: 150, lineHeight: 1, color: p.accent, marginTop: 26, whiteSpace: 'nowrap' }}>{item.readout}</div> : null}
        </div>
      </AbsoluteFill>
      <div style={{ position: 'absolute', ...SHOT, display: 'flex', flexDirection: 'column', alignItems: strip || !captured ? 'flex-start' : 'center', justifyContent: 'center' }}>
        {captured ? (
          <Img
            src={shot(item.shot)}
            style={{
              width: captured[0] * fit,
              height: captured[1] * fit,
              outline: `2px solid ${p.mark}`,
              scale: punch(frame, from, 0.05) * drift(frame, from, HOLDS[index], 0.025),
            }}
          />
        ) : (
          <div style={{ ...display(118), lineHeight: 0.98, color: p.fg2, scale: punch(frame, from) }}>“{item.headline}”</div>
        )}
        {strip && item.readout ? (
          <div style={{ ...accent(), fontSize: fitAccent(item.readout, SHOT.width - 20, 250), lineHeight: 1, color: p.accent, marginTop: 44, whiteSpace: 'nowrap' }}>{item.readout}</div>
        ) : null}
      </div>
    </Frame>
  )
}
