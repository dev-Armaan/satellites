/**
 * The press, one outlet a cut. Half a second is enough for a name and not for a sentence, so the outlet is the
 * poster and its own headline sits under it for anyone who pauses. Every card has the same skeleton (name hung from
 * the top, headline standing on the bottom), so across the cuts only the words move.
 */
import type { FC } from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Frame } from '../components/Frame'
import { PRESS } from '../data/press'
import { fitDisplay } from '../fit'
import { punch } from '../motion'
import { MARGIN, MEASURE, PALETTE, accent, display, label, type Tone } from '../theme'
import { T } from '../timing'

/** How long each card holds, in tenths: the run tightens as it goes. */
const HOLDS = [7, 6, 6, 5, 5, 5].map((n) => n * T)
/** The outlet's name, broken where it reads best when stacked. */
const STACKED: Record<string, string[]> = {
  'CBC Radio': ['CBC', 'Radio'],
  'University of Waterloo': ['University', 'of Waterloo'],
  'Hacker News': ['Hacker', 'News'],
  'SAPO Tek': ['SAPO', 'Tek'],
  'Made This Month': ['Made This', 'Month'],
}
/** One inversion in the run, on the thread it all started from. */
const INVERTED = 'Hacker News'

const pad = (n: number) => String(n).padStart(2, '0')

export const Press: FC = () => {
  const frame = useCurrentFrame()
  let index = 0
  let from = 0
  while (index < PRESS.length - 1 && frame >= from + HOLDS[index]) from += HOLDS[index++]
  const item = PRESS[index]
  const tone: Tone = item.outlet === INVERTED ? 'bone' : 'ink'
  const p = PALETTE[tone]
  const lines = STACKED[item.outlet] ?? [item.outlet]
  const size = Math.min(...lines.map((line) => fitDisplay(line, MEASURE, 400)))
  return (
    <Frame tone={tone} section="the press" readout={`${pad(index + 1)} / ${pad(PRESS.length)}`}>
      <AbsoluteFill style={{ padding: `216px ${MARGIN}px 130px`, justifyContent: 'space-between' }}>
        <div style={{ scale: punch(frame, from), transformOrigin: 'left top' }}>
          <div style={{ ...label(24), color: p.dim, marginBottom: 30 }}>{item.kicker}</div>
          <div style={{ ...display(size), color: p.fg, marginLeft: -size * 0.035 }}>
            {lines.map((line) => (
              <div key={line} style={{ whiteSpace: 'nowrap' }}>
                {line}
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={{ height: 2, backgroundColor: p.line, marginBottom: 34 }} />
          {item.readout ? (
            <div style={{ ...accent(), fontSize: 190, lineHeight: 0.95, color: p.accent }}>{item.headline}</div>
          ) : (
            <div style={{ ...display(84), lineHeight: 1, color: p.fg2, maxWidth: MEASURE }}>“{item.headline}”</div>
          )}
        </div>
      </AbsoluteFill>
    </Frame>
  )
}
