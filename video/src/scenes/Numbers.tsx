/**
 * The numbers: visits, then where they came from, then what they asked. Each is the exact production figure
 * (src/data/stats.ts), set as large as the frame allows, with the real data behind it as texture: every country code
 * that sent a visit lights up in order, and the most searched places flick past under the search count.
 */
import { fitText } from '@remotion/layout-utils'
import type { FC } from 'react'
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion'
import { Frame } from '../components/Frame'
import { COUNTRIES, STATS, TOP_SEARCHES } from '../data/stats'
import { fitAccent } from '../fit'
import { punch } from '../motion'
import { MARGIN, MEASURE, PALETTE, SANS, accent, display, label, type Tone } from '../theme'
import { T } from '../timing'

const fmt = (n: number) => Math.round(n).toLocaleString('en-US')

/** A number set as display type across the measure. Tabular, so a count that is still running does not shiver. */
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

/** The count lands here, flashes for three frames, and the line under it cuts in. */
const LANDS = 8 * T
const FLASH = 3
const COUNTRIES_AT = 14 * T
const SEARCHES_AT = 21 * T

const SECTION = 'the numbers'
const READOUT = `${STATS.since.slice(0, -5)} → ${STATS.asOf}`

const Visits: FC<{ frame: number }> = ({ frame }) => {
  const tone: Tone = frame >= LANDS && frame < LANDS + FLASH ? 'signal' : 'ink'
  const p = PALETTE[tone]
  const landed = frame >= LANDS
  const size = fitNumber(fmt(STATS.visits), MEASURE, 400)
  return (
    <Frame tone={tone} section={SECTION} readout={READOUT}>
      <AbsoluteFill style={{ justifyContent: 'center', padding: `0 ${MARGIN}px 40px`, scale: punch(frame, LANDS, 0.03) }}>
        <div style={{ ...label(26), color: p.dim, marginBottom: 30 }}>Visits since {STATS.since}</div>
        <div style={{ ...display(size), fontVariantNumeric: 'tabular-nums', color: p.fg, marginLeft: -size * 0.03 }}>
          {fmt(
            interpolate(frame, [0, LANDS], [0, STATS.visits], {
              extrapolateRight: 'clamp',
              easing: Easing.out(Easing.poly(4)),
            }),
          )}
        </div>
        <div style={{ position: 'relative', height: 2, marginTop: 34, backgroundColor: p.line }}>
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
        <div style={{ ...display(168), color: p.fg, marginTop: 44, visibility: landed ? 'visible' : 'hidden' }}>
          visits in <span style={{ ...accent(), fontSize: '1.08em', color: p.accent }}>{STATS.days} days.</span>
        </div>
      </AbsoluteFill>
    </Frame>
  )
}

const COLS = 19
/** How many of the newest codes are in signal. */
const TRAIL = 12
const Countries: FC<{ frame: number }> = ({ frame }) => {
  const p = PALETTE.ink
  const f = frame - COUNTRIES_AT
  // Every code is lit two thirds of the way through the beat; the newest few are in signal.
  const lit = interpolate(f, [1, 5 * T], [0, COUNTRIES.length + TRAIL], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <Frame section={SECTION} readout={READOUT}>
      <AbsoluteFill style={{ padding: `210px ${MARGIN}px 0` }}>
        <div style={{ scale: punch(f), transformOrigin: 'left center' }}>
          <div style={{ ...display(500), color: p.fg, marginLeft: -14 }}>{COUNTRIES.length}</div>
          <div style={{ ...display(118), color: p.fg, marginTop: 6 }}>
            countries <span style={{ color: p.fg2 }}>and territories.</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, rowGap: 15, marginTop: 56 }}>
          {COUNTRIES.map((code, i) => (
            <div key={code} style={{ ...label(21), letterSpacing: '0.04em', color: i >= lit ? p.line : i >= lit - TRAIL ? p.accent : p.fg2 }}>
              {code}
            </div>
          ))}
        </div>
      </AbsoluteFill>
    </Frame>
  )
}

/** A place is on screen for this many frames. */
const PLACE_EVERY = 5
const Searches: FC<{ frame: number }> = ({ frame }) => {
  const p = PALETTE.ink
  const f = frame - SEARCHES_AT
  const place = TOP_SEARCHES[Math.min(TOP_SEARCHES.length - 1, Math.floor(f / PLACE_EVERY))]
  const size = fitNumber(fmt(STATS.searches), MEASURE, 400)
  return (
    <Frame section={SECTION} readout={READOUT}>
      <AbsoluteFill style={{ justifyContent: 'center', padding: `0 ${MARGIN}px 40px` }}>
        <div style={{ scale: punch(f), transformOrigin: 'left center' }}>
          <div style={{ ...display(size), fontVariantNumeric: 'tabular-nums', color: p.fg, marginLeft: -size * 0.03 }}>{fmt(STATS.searches)}</div>
          <div style={{ ...display(168), color: p.fg, marginTop: 20 }}>searches.</div>
        </div>
        <div style={{ ...label(26), color: p.dim, marginTop: 70 }}>Most searched</div>
        <div style={{ ...accent(), fontSize: fitAccent(place, MEASURE, 150), lineHeight: 1.05, color: p.accent, marginTop: 14, whiteSpace: 'nowrap' }}>{place}</div>
      </AbsoluteFill>
    </Frame>
  )
}

export const Numbers: FC = () => {
  const frame = useCurrentFrame()
  if (frame >= SEARCHES_AT) return <Searches frame={frame} />
  if (frame >= COUNTRIES_AT) return <Countries frame={frame} />
  return <Visits frame={frame} />
}
