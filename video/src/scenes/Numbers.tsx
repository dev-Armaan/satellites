/**
 * The numbers, as the owner words them: a million users in under seven days, a million searches, and every country
 * and territory they came from. "1,000,000+" is simply there on the downbeat the song sings "Don't stop me now" on
 * (it used to count up; a number that lands with the music hits harder), with no exact figure shown
 * (src/data/stats.ts says what is behind the claim); then one word rolls over under the same number. The flags are
 * the real list of countries and territories, going up in order of visits.
 */
import { fitText, measureText } from '@remotion/layout-utils'
import type { FC } from 'react'
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion'
import { Frame } from '../components/Frame'
import { COUNTRIES, STATS } from '../data/stats'
import { punch } from '../motion'
import type { Cue } from '../sound'
import { FLAGS, MARGIN, MEASURE, PALETTE, SANS, accent, display } from '../theme'
import { T } from '../timing'

const fmt = (n: number) => Math.round(n).toLocaleString('en-US')

/** A number set as display type across a width. Tabular, so a count that is still running does not shiver. */
function fitNumber(text: string, width: number, max: number): number {
  const { fontSize } = fitText({
    text,
    withinWidth: width,
    fontFamily: SANS,
    fontWeight: 580,
    letterSpacing: '-0.02em',
    fontVariantNumeric: 'tabular-nums',
    additionalStyles: { fontStretch: '75%' },
  })
  return Math.min(fontSize, max)
}

/** "users" becomes "searches" two beats in, and the countries follow two beats after that. */
const SEARCHES_AT = 8 * T
const COUNTRIES_AT = 16 * T
/** The word rolls over in this many frames, timed so the new one is all but in place on the beat. */
const ROLL = 14
const ROLL_FROM = SEARCHES_AT - 10
const WORD_SIZE = 184

/** The first of the video's two low hits, on the million. The word change and the flags need none. */
export const NUMBERS_CUES: Cue[] = [{ at: 0, sound: 'boom', volume: 0.9 }]

const SECTION = 'the numbers'
const READOUT = `Since ${STATS.since}`

/** How wide a word of the line under the number is. */
const wordWidth = (text: string) =>
  measureText({ text, fontFamily: SANS, fontSize: WORD_SIZE, fontWeight: 580, letterSpacing: '-0.02em', additionalStyles: { fontStretch: '75%' } }).width

/**
 * The million, on the signal screen (owner: ink on orange for the whole beat, not a flash of it). The one word that
 * changes rolls over like a counter wheel: "users" leaves through the top of its line as "searches" comes up from
 * the bottom, and the rest of the line slides along as the slot widens.
 */
const Million: FC<{ frame: number }> = ({ frame }) => {
  const p = PALETTE.signal
  const size = fitNumber(`${fmt(STATS.million)}+`, MEASURE * 0.9, 520)
  const roll = interpolate(frame, [ROLL_FROM, ROLL_FROM + ROLL], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.6, 0, 0.2, 1),
  })
  return (
    <Frame tone="signal" section={SECTION} readout={READOUT}>
      <AbsoluteFill style={{ justifyContent: 'center', padding: `0 ${MARGIN}px 20px`, scale: punch(frame, 0, 0.04) }}>
        <div style={{ ...display(size), fontVariantNumeric: 'tabular-nums', color: p.fg, marginLeft: -size * 0.03, whiteSpace: 'nowrap' }}>
          {fmt(STATS.million)}+
        </div>
        <div style={{ height: 2, marginTop: 30, backgroundColor: p.fg }} />
        <div style={{ ...display(WORD_SIZE), color: p.fg, marginTop: 40, whiteSpace: 'nowrap' }}>
          {/* The slot: as wide as the word it shows, clipped to its own line. The first word is in the flow (it sets
              the baseline); the second hangs directly under it, and both ride up together. */}
          <span
            style={{
              display: 'inline-block',
              position: 'relative',
              // The slot opens ahead of the word that needs the room, and the line is clipped top and bottom only,
              // so the longer word is never cut off at the side while it arrives.
              width: interpolate(roll, [0, 0.55], [wordWidth('users'), wordWidth('searches')], { extrapolateRight: 'clamp' }),
              clipPath: 'inset(-0.04em -3em 0 -0.06em)',
            }}
          >
            <span style={{ display: 'block', translate: `0 ${-roll * 100}%` }}>
              users
              <span style={{ position: 'absolute', left: 0, top: '100%' }}>searches</span>
            </span>
          </span>{' '}
          <span style={{ ...accent(), fontSize: '1.08em' }}>in under {STATS.days} days.</span>
        </div>
      </AbsoluteFill>
    </Frame>
  )
}

const COLS = 16
/** A flag takes this many frames to settle once it is up. */
const SETTLE = 5

/** A two-letter region code as its flag: the pair of regional-indicator letters an emoji font draws as one flag. */
const flag = (code: string) => String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))

const Countries: FC<{ frame: number }> = ({ frame }) => {
  const p = PALETTE.ink
  const f = frame - COUNTRIES_AT
  // Flags go up in order of visits (owner: flags, not the codes), the last of them three beats in.
  const up = interpolate(f, [1, 12 * T], [0, COUNTRIES.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const every = (12 * T) / COUNTRIES.length
  return (
    <Frame section={SECTION} readout={READOUT}>
      <AbsoluteFill style={{ flexDirection: 'row', alignItems: 'center', padding: `60px ${MARGIN}px 40px`, gap: 60 }}>
        <div style={{ flex: 'none', width: 860, scale: punch(f), transformOrigin: 'left center' }}>
          <div style={{ ...display(600), color: p.fg, marginLeft: -18 }}>{COUNTRIES.length}</div>
          <div style={{ ...display(132), color: p.fg, marginTop: 4 }}>
            countries <span style={{ color: p.fg2 }}>and territories.</span>
          </div>
        </div>
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, rowGap: 9, justifyItems: 'center' }}>
          {COUNTRIES.map((code, i) => (
            <div
              key={code}
              style={{
                fontFamily: FLAGS,
                fontSize: 40,
                lineHeight: 1.1,
                visibility: i < up ? 'visible' : 'hidden',
                scale: interpolate(f - (1 + i * every), [0, SETTLE], [1.5, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
              }}
            >
              {flag(code)}
            </div>
          ))}
        </div>
      </AbsoluteFill>
    </Frame>
  )
}

export const Numbers: FC = () => {
  const frame = useCurrentFrame()
  return frame >= COUNTRIES_AT ? <Countries frame={frame} /> : <Million frame={frame} />
}
