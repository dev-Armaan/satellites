/**
 * The flood: real comments landing one on another, slowly enough at first to be read and then faster than anyone
 * can, until the frame is nothing but them. This is the centre of the video, so its rules are strict: every card is
 * a real comment with its author on it, nothing rotates or bounces (it is a pile of instrument readouts, not sticky
 * notes), the newest card is always the brightest thing on screen, and the order and positions are fixed (seeded),
 * so a re-render gives the same film.
 */
import type { FC } from 'react'
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from 'remotion'
import { BEZEL, Frame } from '../components/Frame'
import { FLOOD, type Comment } from '../data/comments'
import { INK_1, PALETTE, body, display, label } from '../theme'
import { HEIGHT, SCENES, WIDTH } from '../timing'

/** Where the pile may be: inside the bezel, under the header row. Cards are cut by its edges, as by a viewport. */
const FIELD = { left: BEZEL + 2, top: 132, right: WIDTH - BEZEL - 2, bottom: HEIGHT - BEZEL - 2 }
const FIELD_W = FIELD.right - FIELD.left
const FIELD_H = FIELD.bottom - FIELD.top

/** A comment this short is set as a shout, in display type. */
const SHOUT_MAX = 26
const PAD = 30
const BODY = 40
const SHOUT = 104

/** This many cards land whole, inside the field: they are the ones that get read. */
const WHOLE = 9

/** The first card has the frame to itself for this long; each gap after it is this much shorter, down to the floor. */
const FIRST_GAP = 18
const GAP_DECAY = 0.87
const GAP_FLOOR = 1.5

interface Card {
  comment: Comment
  at: number
  left: number
  top: number
  width: number
  scale: number
  shout: boolean
}

/** A 3 × 4 lattice of landing zones, visited so that consecutive cards land far apart (the eye has to jump). */
const ZONES = [4, 9, 2, 7, 0, 11, 5, 6, 1, 10, 3, 8]

function layOut(): Card[] {
  const cards: Card[] = []
  let at = 0
  let gap = FIRST_GAP
  FLOOD.forEach((comment, i) => {
    const n = comment.text.length
    const shout = n <= SHOUT_MAX
    const width = shout ? Math.min(890, 2 * PAD + 30 + n * 43) : Math.max(540, Math.min(800, 420 + n * 3.2))
    const scale = Math.min(interpolate(i, [0, WHOLE, FLOOD.length - 1], [1.16, 0.96, 0.7]), (FIELD_W - 44) / width)
    // An estimate of the card's height (from average glyph widths), good enough to keep a card inside the field.
    const lines = Math.ceil((n * (shout ? 42 : 20.5)) / (width - 2 * PAD))
    const height = 2 * PAD + 45 + lines * (shout ? SHOUT * 0.92 : BODY * 1.22)
    const zone = ZONES[i % ZONES.length]
    const cx = ((zone % 3) + 0.5) / 3 + (random(`x${i}`) - 0.5) * 0.2
    const cy = (Math.floor(zone / 3) + 0.5) / 4 + (random(`y${i}`) - 0.5) * 0.16
    // The first cards stay whole, with air around them; later ones may hang over the field's edges, more as they go.
    const over = interpolate(i, [WHOLE, FLOOD.length - 1], [0, 0.24], { extrapolateLeft: 'clamp' })
    const air = i < WHOLE ? 22 : 0
    const w = width * scale
    const h = height * scale
    const left = i === 0 ? (FIELD_W - w) / 2 : Math.max(air - w * over, Math.min(FIELD_W - air - w * (1 - over), cx * FIELD_W - w / 2))
    const top = i === 0 ? (FIELD_H - h) / 2 - 60 : Math.max(air - h * over, Math.min(FIELD_H - air - h * (1 - over), cy * FIELD_H - h / 2))
    cards.push({ comment, at: Math.round(at), left, top, width, scale, shout })
    at += gap
    gap = Math.max(GAP_FLOOR, gap * GAP_DECAY)
  })
  return cards
}

const CARDS = layOut()

const CardView: FC<{ card: Card; frame: number }> = ({ card, frame }) => {
  const p = PALETTE.ink
  const age = frame - card.at
  // Newest is brightest: a card's text settles back as others land on it, and its signal edge cools to a hairline.
  const ink = interpolate(age, [10, 60], [1, 0.58], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const edge = interpolate(age, [2, 12], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <div style={{ position: 'absolute', left: card.left, top: card.top, width: card.width, scale: card.scale, transformOrigin: 'left top' }}>
      <div
        style={{
          backgroundColor: INK_1,
          border: `2px solid rgb(${interpolate(edge, [0, 1], [58, 255])} ${interpolate(edge, [0, 1], [58, 106])} ${interpolate(edge, [0, 1], [58, 26])})`,
          padding: PAD,
          scale: interpolate(age, [0, 5], [1.07, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.out(Easing.cubic),
            output: 'perceptual-scale',
          }),
        }}
      >
        <div style={{ ...label(19), display: 'flex', justifyContent: 'space-between', color: p.dim, marginBottom: 22 }}>
          <span style={{ textTransform: 'none' }}>{card.comment.author}</span>
          <span>{card.comment.source}</span>
        </div>
        <div style={{ ...(card.shout ? display(SHOUT) : body(BODY)), color: p.fg, opacity: ink }}>{card.comment.text}</div>
      </div>
    </div>
  )
}

export const Flood: FC = () => {
  const frame = useCurrentFrame()
  const landed = CARDS.filter((c) => frame >= c.at)
  return (
    <Frame section="the people" readout={`${String(landed.length).padStart(2, '0')} comments`}>
      <AbsoluteFill>
        <div style={{ position: 'absolute', left: FIELD.left, top: FIELD.top, width: FIELD_W, height: FIELD_H, overflow: 'hidden' }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              scale: interpolate(frame, [0, SCENES.flood], [1, 1.07], { easing: Easing.in(Easing.quad), output: 'perceptual-scale' }),
            }}
          >
            {landed.map((card) => (
              <CardView key={card.comment.author} card={card} frame={frame} />
            ))}
          </div>
        </div>
        <div style={{ position: 'absolute', left: BEZEL, right: BEZEL, top: FIELD.top - 2, height: 2, backgroundColor: PALETTE.ink.line }} />
      </AbsoluteFill>
    </Frame>
  )
}

