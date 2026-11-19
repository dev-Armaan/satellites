/**
 * The numbers, as the owner words them: a million users in under seven days, a million searches, and every country
 * and territory they came from. "1,000,000+" is simply there on the downbeat the song sings "Don't stop me now" on
 * (it used to count up; a number that lands with the music hits harder), with no exact figure shown
 * (src/data/stats.ts says what is behind the claim); then one word changes under the same number. The country codes
 * are the real list, lighting in order of visits.
 */
import { fitText } from '@remotion/layout-utils'
import type { FC } from 'react'
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'
import { Frame } from '../components/Frame'
import { COUNTRIES, STATS } from '../data/stats'
import { punch } from '../motion'
import type { Cue } from '../sound'
import { MARGIN, MEASURE, PALETTE, SANS, accent, display, label, type Tone } from '../theme'
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

/** The frame flashes for three frames as the number lands; "users" becomes "searches" two beats in. */
const FLASH = 3
const SEARCHES_AT = 8 * T
const COUNTRIES_AT = 16 * T

/**
 * The second (and middle) of the video's three low hits, on the million; a tick as the word changes; a rising swish
 * as the country codes light.
 */
export const NUMBERS_CUES: Cue[] = [
  { at: 0, sound: 'boom', volume: 0.9 },
  { at: SEARCHES_AT, sound: 'tick', volume: 0.7 },
  { at: COUNTRIES_AT, sound: 'sweep', volume: 0.7 },
]

const SECTION = 'the numbers'
const READOUT = `Since ${STATS.since}`

const Million: FC<{ frame: number }> = ({ frame }) => {
  const tone: Tone = frame < FLASH ? 'signal' : 'ink'
  const p = PALETTE[tone]
  const searches = frame >= SEARCHES_AT
  const size = fitNumber(`${fmt(STATS.million)}+`, MEASURE * 0.9, 520)
  return (
    <Frame tone={tone} section={SECTION} readout={READOUT}>
      <AbsoluteFill style={{ justifyContent: 'center', padding: `0 ${MARGIN}px 20px`, scale: punch(frame, 0, 0.04) }}>
        <div style={{ ...display(size), fontVariantNumeric: 'tabular-nums', color: p.fg, marginLeft: -size * 0.03, whiteSpace: 'nowrap' }}>
          {fmt(STATS.million)}
          <span style={{ color: p.accent }}>+</span>
        </div>
        <div style={{ height: 2, marginTop: 30, backgroundColor: p.accent }} />
        <div style={{ ...display(184), color: p.fg, marginTop: 40, whiteSpace: 'nowrap' }}>
          <span style={{ display: 'inline-block', scale: punch(frame, SEARCHES_AT, 0.025), transformOrigin: 'left bottom' }}>{searches ? 'searches' : 'users'}</span>{' '}
          <span style={{ ...accent(), fontSize: '1.08em', color: p.accent }}>in under {STATS.days} days.</span>
        </div>
      </AbsoluteFill>
    </Frame>
  )
}

const COLS = 14
/** How many of the newest codes are in signal. */
const TRAIL = 12
const Countries: FC<{ frame: number }> = ({ frame }) => {
  const p = PALETTE.ink
  const f = frame - COUNTRIES_AT
  // Every code is lit three beats in; the newest few are in signal.
  const lit = interpolate(f, [1, 12 * T], [0, COUNTRIES.length + TRAIL], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <Frame section={SECTION} readout={READOUT}>
      <AbsoluteFill style={{ flexDirection: 'row', alignItems: 'center', padding: `60px ${MARGIN}px 40px`, gap: 70 }}>
        <div style={{ flex: 'none', width: 900, scale: punch(f), transformOrigin: 'left center' }}>
          <div style={{ ...display(600), color: p.fg, marginLeft: -18 }}>{COUNTRIES.length}</div>
          <div style={{ ...display(132), color: p.fg, marginTop: 4 }}>
            countries <span style={{ color: p.fg2 }}>and territories.</span>
          </div>
        </div>
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, rowGap: 17 }}>
          {COUNTRIES.map((code, i) => (
            <div key={code} style={{ ...label(23), letterSpacing: '0.04em', color: i >= lit ? p.line : i >= lit - TRAIL ? p.accent : p.fg2 }}>
              {code}
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
