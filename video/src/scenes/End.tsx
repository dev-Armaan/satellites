/**
 * The end card: the wordmark and the address, nothing else. The address is typed behind a block cursor, as a place
 * is typed into the site's search field, and the cursor then blinks at 1 Hz with no fade, as the site's live dot does:
 * the two motions the product already owns.
 */
import type { FC } from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { BEZEL } from '../components/Frame'
import { Wordmark } from '../components/Wordmark'
import { punch } from '../motion'
import { MARGIN, MEASURE, PALETTE, label } from '../theme'
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
      <AbsoluteFill style={{ justifyContent: 'center', padding: `0 ${MARGIN}px 40px` }}>
        <div style={{ scale: punch(frame), transformOrigin: 'left center' }}>
          <Wordmark height={(MEASURE * 0.86 * 72.54) / 300.51} fill={p.fg} dot={p.accent} />
        </div>
        <div style={{ ...label(44), textTransform: 'none', letterSpacing: '0.02em', color: p.fg, marginTop: 64, display: 'flex', alignItems: 'center', height: 56 }}>
          {ADDRESS.slice(0, typed)
            .split('')
            .map((c, i) => (
              <span key={i} style={c === '.' ? { color: p.accent } : undefined}>
                {c}
              </span>
            ))}
          <span style={{ width: 26, height: 52, marginLeft: 6, backgroundColor: p.accent, visibility: cursor ? 'visible' : 'hidden' }} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
