/**
 * The numbers, as the owner words them: a million users in under seven days, a million searches, and every country
 * and territory they came from. The count runs up to a round million and a plus sign lands on it (no exact figure is
 * shown; src/data/stats.ts says what is behind the claim), then one word changes under the same number. The country
 * codes are the real list, lighting in order of visits.
 */
import { fitText } from '@remotion/layout-utils'
import type { FC } from 'react'
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion'
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

/** The count lands here: the plus arrives, the frame flashes for three frames, and the line under it cuts in. */
const LANDS = 7 * T
const FLASH = 3
/** "users" becomes "searches" under the same number. */
const SEARCHES_AT = 13 * T
const COUNTRIES_AT = 19 * T

/** The count rattles up and lands; the word changes; the country codes rattle in. */
export const NUMBERS_CUES: Cue[] = [
  { at: 0, sound: 'count', volume: 0.55 },
  { at: LANDS, sound: 'boom' },
  { at: SEARCHES_AT, sound: 'thump', volume: 0.7 },
  { at: SEARCHES_AT, sound: 'tick', volume: 0.5 },
  { at: COUNTRIES_AT, sound: 'thump', volume: 0.8 },
  { at: COUNTRIES_AT + 2, sound: 'count', volume: 0.3, rate: 1.35 },
]

const SECTION = 'the numbers'
const READOUT = `Since ${STATS.since}`

const Million: FC<{ frame: number }> = ({ frame }) => {
  const tone: Tone = frame >= LANDS && frame < LANDS + FLASH ? 'signal' : 'ink'
  const p = PALETTE[tone]
  const landed = frame >= LANDS
  const searches = frame >= SEARCHES_AT
  const size = fitNumber(`${fmt(STATS.million)}+`, MEASURE * 0.9, 520)
  return (
    <Frame tone={tone} section={SECTION} readout={READOUT}>
      <AbsoluteFill style={{ justifyContent: 'center', padding: `0 ${MARGIN}px 20px`, scale: punch(frame, LANDS, 0.03) }}>
        <div style={{ ...display(size), fontVariantNumeric: 'tabular-nums', color: p.fg, marginLeft: -size * 0.03, whiteSpace: 'nowrap' }}>
          {fmt(
            interpolate(frame, [0, LANDS], [0, STATS.million], {
              extrapolateRight: 'clamp',
              easing: Easing.out(Easing.poly(4)),
            }),
          )}
          <span style={{ color: p.accent, visibility: landed ? 'visible' : 'hidden' }}>+</span>
        </div>
        <div style={{ position: 'relative', height: 2, marginTop: 30, backgroundColor: p.line }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: p.accent,
              transformOrigin: 'left',
              scale: `${interpolate(frame, [0, LANDS], [0, 1], { extrapolateRight: 'clamp', easing: Easing.out(Easing.poly(4)) })} 1`,
            }}
          />
        </div>
        <div style={{ ...display(184), color: p.fg, marginTop: 40, visibility: landed ? 'visible' : 'hidden', whiteSpace: 'nowrap' }}>
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
  // Every code is lit two thirds of the way through the beat; the newest few are in signal.
  const lit = interpolate(f, [1, 5 * T], [0, COUNTRIES.length + TRAIL], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
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
