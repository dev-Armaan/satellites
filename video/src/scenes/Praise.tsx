/**
 * What the flood said, twice: first as a strobe (one phrase an eighth note, each somebody's own words, each set
 * from margin to margin), then as the one sentence worth holding on, with the screenshot of the comment it comes
 * from under it. The strobe is the fastest thing in the video and the sentence is the only thing in it that is given
 * time, so the sentence lands.
 */
import type { FC } from 'react'
import { AbsoluteFill, Img, useCurrentFrame } from 'remotion'
import { Frame } from '../components/Frame'
import { HERO, STROBE } from '../data/comments'
import proof from '../data/proof.json'
import { fitDisplay } from '../fit'
import { drift, punch } from '../motion'
import { shot } from '../proof'
import { MARGIN, MEASURE, PALETTE, accent, display, label } from '../theme'
import { HEIGHT, SCENES, T, WIDTH } from '../timing'

/** Each phrase holds an eighth note, so the eight of them fill the bar of the drum fill. */
const PHRASE = 2 * T
const STROBE_LENGTH = STROBE.length * PHRASE
/** Where every strobe phrase stands, from the top of the frame, and the tallest it may be set. */
const BASELINE = 690
const TALLEST = 520
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
    const index = Math.floor(frame / PHRASE)
    const item = STROBE[index]
    const size = fitDisplay(item.text, MEASURE, TALLEST)
    return (
      <Frame section="the people" readout={`${String(index + 1).padStart(2, '0')} / ${STROBE.length}`}>
        {/* SVG text, because it is placed by its baseline: phrases of every size stand on the same line. */}
        <svg width={WIDTH} height={HEIGHT} style={{ position: 'absolute', inset: 0 }}>
          <text
            x={MARGIN - size * 0.035}
            y={BASELINE}
            style={{ ...display(size), fill: p.fg, scale: punch(frame, index * PHRASE, 0.03), transformOrigin: `${MARGIN}px ${BASELINE}px` }}
          >
            {item.text}
          </text>
        </svg>
        <div style={{ ...label(28), position: 'absolute', left: MARGIN + 2, top: BASELINE + 150, color: p.dim }}>
          <span style={{ textTransform: 'none', color: p.fg2 }}>{item.author}</span> · {item.source}
        </div>
      </Frame>
    )
  }
  const f = frame - STROBE_LENGTH
  const said = Math.floor(f / WORD_EVERY) + 1
  return (
    <Frame section="the people" readout={HERO.source}>
      <AbsoluteFill style={{ justifyContent: 'center', padding: `50px ${MARGIN}px 0`, scale: drift(f, 0, SCENES.praise - STROBE_LENGTH) }}>
        <div style={{ ...display(176), lineHeight: 0.95, color: p.fg }}>
          {WORDS.map(({ w, accent: on }, i) => (
            <span key={i} style={{ visibility: i < said ? 'visible' : 'hidden' }}>
              <span style={on ? { ...accent(), fontSize: '1.08em', color: p.accent } : undefined}>{w}</span>{' '}
            </span>
          ))}
        </div>
        {/* The comment itself, as Hacker News shows it. */}
        <Img src={shot(`hn-${proof.hero.id}`)} style={{ width: 760, marginTop: 54, outline: `2px solid ${p.mark}` }} />
      </AbsoluteFill>
    </Frame>
  )
}
