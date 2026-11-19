/**
 * The instrument bezel every type scene sits in: the hairline frame, the corner ticks, the wordmark and the corner
 * readouts, at the same pixels as the landing page's own (measured from a 540 × 675 capture at 2×). The last beat cuts
 * to the real page, and because the chrome never moves, that cut reads as the page arriving inside the same instrument.
 */
import type { FC, ReactNode } from 'react'
import { AbsoluteFill } from 'remotion'
import { MARGIN, PALETTE, label, type Palette, type Tone } from '../theme'
import { Wordmark } from './Wordmark'

/** Where the page draws its frame, from the edge of the picture. */
export const BEZEL = 20
const HAIR = 2
const TICK_W = 40
const TICK_H = 30

const Tick: FC<{ p: Palette; h: 'left' | 'right'; v: 'top' | 'bottom' }> = ({ p, h, v }) => (
  <>
    <div style={{ position: 'absolute', [h]: BEZEL, [v]: BEZEL, width: TICK_W, height: HAIR, backgroundColor: p.mark }} />
    <div style={{ position: 'absolute', [h]: BEZEL, [v]: BEZEL, width: HAIR, height: TICK_H, backgroundColor: p.mark }} />
  </>
)

export const Frame: FC<{ tone?: Tone; section: string; readout?: string; children?: ReactNode }> = ({ tone = 'ink', section, readout, children }) => {
  const p = PALETTE[tone]
  return (
    <AbsoluteFill style={{ backgroundColor: p.bg, color: p.fg }}>
      {children}
      <div style={{ position: 'absolute', inset: BEZEL, border: `${HAIR}px solid ${p.line}` }} />
      <Tick p={p} h="left" v="top" />
      <Tick p={p} h="right" v="top" />
      <Tick p={p} h="left" v="bottom" />
      <Tick p={p} h="right" v="bottom" />
      <div style={{ position: 'absolute', left: MARGIN, top: 44 }}>
        <Wordmark height={34} fill={p.fg} dot={p.accent} />
      </div>
      <div style={{ ...label(), position: 'absolute', left: MARGIN + 2, top: 88, color: p.dim }}>{section}</div>
      {/* Top right: the scene's readout over the address; with no readout the address takes its line. */}
      <div style={{ ...label(), position: 'absolute', right: MARGIN + 2, top: 48, color: p.fg }}>{readout ?? 'watched.earth'}</div>
      {readout ? <div style={{ ...label(), position: 'absolute', right: MARGIN + 2, top: 84, color: p.dim }}>watched.earth</div> : null}
    </AbsoluteFill>
  )
}
