/**
 * The press, one outlet a cut. Half a second is enough for a name and not for a sentence, so the name is the poster
 * on the left and the proof is on the right: a screenshot of the outlet's own page (scripts/capture-proof.cjs). An
 * outlet with no capture yet gets its own headline in type in the same place. Every card has the same skeleton, so
 * across the cuts only the content moves.
 */
import type { FC } from 'react'
import { AbsoluteFill, Img, useCurrentFrame } from 'remotion'
import { Frame } from '../components/Frame'
import { PRESS } from '../data/press'
import { fitDisplay } from '../fit'
import { drift, punch } from '../motion'
import { shot, type ProofProps } from '../proof'
import { MARGIN, PALETTE, accent, display, label, type Tone } from '../theme'
import { T } from '../timing'

/** How long each card holds, in tenths: the first has the longest. */
const HOLDS = [7, 6, 6, 6, 6].map((n) => n * T)
/** The name's column, and the proof's. */
const NAME_W = 700
const SHOT = { left: 850, top: 124, width: 1920 - 850 - MARGIN, height: 1080 - 2 * 124 }

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
  // A capture is fitted inside the proof column, whatever its shape, and centred on it.
  const fit = captured ? Math.min(SHOT.width / captured[0], SHOT.height / captured[1]) : 0
  // A capture that is only a strip (the thread's head) leaves room under it: the readout goes there, not under the name.
  const strip = !!captured && captured[1] * fit < 320
  const readoutLeft = item.readout && !strip
  const size = Math.min(...item.lines.map((line) => fitDisplay(line, NAME_W, readoutLeft ? 280 : 330)))
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
      <div style={{ position: 'absolute', ...SHOT, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
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
        {strip ? <div style={{ ...accent(), fontSize: 250, lineHeight: 1, color: p.accent, marginTop: 44, whiteSpace: 'nowrap' }}>{item.readout}</div> : null}
      </div>
    </Frame>
  )
}
