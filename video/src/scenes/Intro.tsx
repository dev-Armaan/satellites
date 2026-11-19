/**
 * The first frame: "Featured in international news." (owner), whole from frame 0 because a video's first frame is
 * often its poster, and because it is a claim the next two seconds then prove, card by card (the press scene follows
 * with no gap). International is literal: CBC is Canada's, SAPO Tek is Portugal's.
 */
import type { FC } from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Frame } from '../components/Frame'
import { fitAccent, fitDisplay } from '../fit'
import { drift, punch } from '../motion'
import type { Cue } from '../sound'
import { MARGIN, MEASURE, PALETTE, accent, display } from '../theme'
import { SCENES } from '../timing'

const FIRST = 'Featured in'
const SECOND = 'international news.'

export const INTRO_CUES: Cue[] = [{ at: 0, sound: 'boom', volume: 0.9 }]

export const Intro: FC = () => {
  const frame = useCurrentFrame()
  const p = PALETTE.ink
  // The second line is set as wide as the measure; the first matches its height.
  const second = fitAccent(SECOND, MEASURE * 0.97, 400)
  const first = Math.min(fitDisplay(FIRST, MEASURE, 400), second * 0.94)
  return (
    <Frame section="the press">
      <AbsoluteFill style={{ justifyContent: 'center', padding: `0 ${MARGIN}px 40px`, scale: punch(frame) * drift(frame, 0, SCENES.intro) }}>
        <div style={{ ...display(first), color: p.fg, whiteSpace: 'nowrap', marginLeft: -first * 0.03 }}>{FIRST}</div>
        <div style={{ ...accent(), fontSize: second, lineHeight: 1, color: p.accent, whiteSpace: 'nowrap', marginTop: -second * 0.04 }}>{SECOND}</div>
      </AbsoluteFill>
    </Frame>
  )
}
