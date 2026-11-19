/**
 * The end card: the wordmark and the address, nothing else, centred as the wordmark is on the site's loading screen.
 * The address is typed behind a block cursor, as a place is typed into the site's search field, and the cursor then
 * blinks at 1 Hz with no fade, as the site's live dot does: the two motions the product already owns.
 */
import type { FC } from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { BEZEL } from '../components/Frame'
import { Wordmark } from '../components/Wordmark'
import { punch } from '../motion'
import { PALETTE, label } from '../theme'
import { FPS, T } from '../timing'

const ADDRESS = 'watched.earth'
/** Typing starts a tenth of a second in, a letter every 2 frames. */
const TYPE_AT = T
const LETTER_EVERY = 2

export const End: FC = () => {
  const frame = useCurrentFrame()
  const p = PALETTE.ink
  const typed = Math.max(0, Math.min(ADDRESS.length, Math.floor((frame - TYPE_AT) / LETTER_EVERY) + 1))
  const done = TYPE_AT + ADDRESS.length * LETTER_EVERY
  // Solid while typing, then on for the first half of every second.
  const cursor = frame < done || (frame - done) % FPS < FPS / 2
  return (
    <AbsoluteFill style={{ backgroundColor: p.bg, color: p.fg }}>
      <div style={{ position: 'absolute', inset: BEZEL, border: `2px solid ${p.line}` }} />
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', paddingBottom: 30 }}>
        <div style={{ scale: punch(frame) }}>
          <Wordmark height={236} fill={p.fg} dot={p.accent} />
        </div>
        {/* Every letter is laid out from the start (untyped ones hidden), so the line does not shift as it is typed. */}
        <div style={{ ...label(52), textTransform: 'none', letterSpacing: '0.02em', color: p.fg, marginTop: 70, display: 'flex', alignItems: 'center', height: 64 }}>
          {ADDRESS.split('').map((c, i) => (
            <span key={i} style={{ order: i < typed ? 0 : 2, color: c === '.' ? p.accent : undefined, visibility: i < typed ? 'visible' : 'hidden' }}>
              {c}
            </span>
          ))}
          {/* The cursor rides behind the last typed letter: typed letters, then it, then the hidden rest. */}
          <span style={{ order: 1, width: 30, height: 60, margin: '0 4px', backgroundColor: p.accent, visibility: cursor ? 'visible' : 'hidden' }} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
