/**
 * What the flood said, twice: first as a strobe (one phrase a tenth of a second, each somebody's own words, each set
 * from margin to margin), then as the one sentence worth holding on. The strobe is the fastest thing in the video
 * and the sentence is the only thing in it that is given time, so the sentence lands.
 */
import type { FC } from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Frame } from '../components/Frame'
import { HERO, STROBE } from '../data/comments'
import { fitDisplay } from '../fit'
import { drift, punch } from '../motion'
import { MARGIN, MEASURE, PALETTE, accent, display, label } from '../theme'
import { HEIGHT, SCENES, T, WIDTH } from '../timing'

/** Each phrase holds a tenth of a second. */
const STROBE_LENGTH = STROBE.length * T
/** Where every strobe phrase stands, from the top of the frame. */
const BASELINE = 810
/** The sentence arrives a word every 3 frames. */
const WORD_EVERY = 3

const WORDS = [
  ...HERO.before.split(' ').map((w) => ({ w, accent: false })),
  ...HERO.phrase.split(' ').map((w) => ({ w, accent: true })),
  ...HERO.after.split(' ').map((w) => ({ w, accent: false })),
]

export const Praise: FC = () => {
  const frame = useCurrentFrame()
  const p = PALETTE.ink
  if (frame < STROBE_LENGTH) {
    const index = Math.floor(frame / T)
    const item = STROBE[index]
    const size = fitDisplay(item.text, MEASURE, 560)
    return (
      <Frame section="the people" readout={`${String(index + 1).padStart(2, '0')} / ${STROBE.length}`}>
        {/* SVG text, because it is placed by its baseline: phrases of every size stand on the same line. */}
        <svg width={WIDTH} height={HEIGHT} style={{ position: 'absolute', inset: 0 }}>
          <text
            x={MARGIN - size * 0.035}
            y={BASELINE}
            style={{ ...display(size), fill: p.fg, scale: punch(frame, index * T, 0.03), transformOrigin: `${MARGIN}px ${BASELINE}px` }}
          >
            {item.text}
          </text>
        </svg>
        <div style={{ ...label(24), position: 'absolute', left: MARGIN + 2, top: BASELINE + 56, color: p.dim }}>
          <span style={{ textTransform: 'none', color: p.fg2 }}>{item.author}</span> · {item.source}
        </div>
      </Frame>
    )
  }
  const f = frame - STROBE_LENGTH
  const said = Math.floor(f / WORD_EVERY) + 1
  return (
    <Frame section="the people" readout={HERO.source}>
      <AbsoluteFill style={{ justifyContent: 'center', padding: `0 ${MARGIN}px 30px`, scale: drift(f, 0, SCENES.praise - STROBE_LENGTH) }}>
        <div style={{ ...display(148), lineHeight: 0.96, color: p.fg }}>
          {WORDS.map(({ w, accent: on }, i) => (
            <span key={i} style={{ visibility: i < said ? 'visible' : 'hidden' }}>
              <span style={on ? { ...accent(), fontSize: '1.08em', color: p.accent } : undefined}>{w}</span>{' '}
            </span>
          ))}
        </div>
        <div style={{ ...label(26), color: p.dim, marginTop: 46, visibility: said > WORDS.length ? 'visible' : 'hidden' }}>
          <span style={{ textTransform: 'none', color: p.fg2 }}>{HERO.author}</span> · {HERO.source}
        </div>
      </AbsoluteFill>
    </Frame>
  )
}
