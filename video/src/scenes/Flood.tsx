/**
 * The flood: screenshots of real comments and posts landing one on another, slowly enough at first to be read and
 * then faster than anyone can, until the frame is nothing but them. The two posts from X that carried the site land
 * first (owner: in the pile, not in frames of their own). This is the centre of the video, so its rules are
 * strict: every card is a capture of the real thing (src/data/proof.json, scripts/capture-proof.cjs), nothing rotates
 * or bounces, the newest card is always the brightest thing on screen, and the order and positions are fixed
 * (seeded), so a re-render gives the same film.
 */
import type { FC } from 'react'
import { AbsoluteFill, Easing, Img, interpolate, random, useCurrentFrame } from 'remotion'
import { BEZEL, Frame } from '../components/Frame'
import proof from '../data/proof.json'
import { shot, type ProofProps, type Sizes } from '../proof'
import type { Cue } from '../sound'
import { INK, PALETTE, SIGNAL } from '../theme'
import { HEIGHT, SCENES, WIDTH } from '../timing'

/**
 * Where the pile may be: inside the bezel, between the header row and the address in the bottom corner (the chrome is
 * drawn over the scene, so a card under it would have words on it). Cards are cut by its edges, as by a viewport.
 */
const FIELD = { left: BEZEL + 2, top: 112, right: WIDTH - BEZEL - 2, bottom: HEIGHT - 86 }
const FIELD_W = FIELD.right - FIELD.left
const FIELD_H = FIELD.bottom - FIELD.top

/** The edge of a dark card once it has cooled. */
const EDGE = '#3a3d40'

/** This many cards land whole, inside the field: they are the ones that get read. */
const WHOLE = 7
/** How wide a card is shown: the first, the last of the whole ones, the last of all. */
const WIDTHS = [1120, 800, 520]

/** The first card has the frame to itself for this long; each gap after it is this much shorter, down to the floor. */
const FIRST_GAP = 18
const GAP_DECAY = 0.87
const GAP_FLOOR = 1.5

/** A line of proof.json's flood: a Hacker News comment, a post on X, or a screenshot added by hand (Reddit). */
interface Entry {
  hn?: number
  x?: string
  file?: string
  /** a capture on a dark page (Reddit), which needs a light edge to stand off the ink and off its neighbours */
  dark?: boolean
  author: string
}

interface Card {
  name: string
  at: number
  left: number
  top: number
  width: number
  height: number
  /** a post from X's embed: its capture has rounded, transparent corners, so it takes no outline */
  post: boolean
  dark: boolean
}

/** A 4 × 3 lattice of landing zones, visited so that consecutive cards land far apart (the eye has to jump). */
const COLS = 4
const ROWS = 3
const ZONES = [5, 2, 8, 7, 0, 10, 3, 9, 4, 11, 1, 6]

function layOut(sizes: Sizes): Card[] {
  const cards: Card[] = []
  let at = 0
  let gap = FIRST_GAP
  const last = proof.flood.length - 1
  ;(proof.flood as Entry[]).forEach((entry, i) => {
    const post = !!entry.x
    const name = entry.x ? `x-${entry.x}` : entry.hn ? `hn-${entry.hn}` : (entry.file ?? '')
    const size = sizes[name]
    // A capture that is missing is skipped, and takes no time: the flood closes up around it.
    if (!size) return
    const width = interpolate(i, [0, WHOLE, last], WIDTHS) * (post ? 0.86 : 1)
    const height = (width * size[1]) / size[0]
    const zone = ZONES[i % ZONES.length]
    const cx = ((zone % COLS) + 0.5) / COLS + (random(`x${i}`) - 0.5) * 0.16
    const cy = (Math.floor(zone / COLS) + 0.5) / ROWS + (random(`y${i}`) - 0.5) * 0.2
    // The first cards stay whole, with air around them; later ones may hang over the field's edges, more as they go.
    const over = interpolate(i, [WHOLE, last], [0, 0.24], { extrapolateLeft: 'clamp' })
    const air = i < WHOLE ? 26 : 0
    const left = i === 0 ? (FIELD_W - width) / 2 : Math.max(air - width * over, Math.min(FIELD_W - air - width * (1 - over), cx * FIELD_W - width / 2))
    const top = i === 0 ? (FIELD_H - height) / 2 - 30 : Math.max(air - height * over, Math.min(FIELD_H - air - height * (1 - over), cy * FIELD_H - height / 2))
    cards.push({ name, at: Math.round(at), left, top, width, height, post, dark: !!entry.dark })
    at += gap
    gap = Math.max(GAP_FLOOR, gap * GAP_DECAY)
  })
  return cards
}

/**
 * A tock as each card lands (pitched a little differently each time, quieter as they crowd), over a riser that swells
 * through the scene and stops dead with it.
 */
export function floodCues(sizes: Sizes): Cue[] {
  const cards = layOut(sizes)
  return [
    { at: 0, sound: 'riser', volume: 0.5, length: SCENES.flood },
    ...cards.map((card, i) => ({
      at: card.at,
      sound: 'tock' as const,
      volume: interpolate(i, [0, cards.length - 1], [0.6, 0.3]),
      rate: 0.85 + 0.4 * random(`pitch${i}`),
    })),
  ]
}

const CardView: FC<{ card: Card; frame: number }> = ({ card, frame }) => {
  const age = frame - card.at
  // Newest is brightest: a card dims as others land on it, and its signal edge cools to an ink line between cards.
  const light = interpolate(age, [10, 60], [1, 0.6], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const fresh = age < 10
  return (
    <Img
      src={shot(card.name)}
      style={{
        position: 'absolute',
        left: card.left,
        top: card.top,
        width: card.width,
        height: card.height,
        filter: `brightness(${light})`,
        outline: card.post ? undefined : `3px solid ${fresh ? SIGNAL : card.dark ? EDGE : INK}`,
        scale: interpolate(age, [0, 5], [1.07, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.out(Easing.cubic),
          output: 'perceptual-scale',
        }),
      }}
    />
  )
}

export const Flood: FC<ProofProps> = ({ sizes }) => {
  const frame = useCurrentFrame()
  const cards = layOut(sizes)
  const landed = cards.filter((c) => frame >= c.at)
  return (
    <Frame section="the people" readout={`${String(landed.length).padStart(2, '0')} / ${cards.length}`}>
      <AbsoluteFill>
        <div style={{ position: 'absolute', left: FIELD.left, top: FIELD.top, width: FIELD_W, height: FIELD_H, overflow: 'hidden' }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              scale: interpolate(frame, [0, SCENES.flood], [1, 1.06], { easing: Easing.in(Easing.quad), output: 'perceptual-scale' }),
            }}
          >
            {/* Every card is mounted from the first frame (hidden until it lands), so no capture is still decoding when its turn comes. */}
            {cards.map((card) => (
              <div key={card.name} style={{ visibility: frame >= card.at ? 'visible' : 'hidden' }}>
                <CardView card={card} frame={frame} />
              </div>
            ))}
          </div>
        </div>
        <div style={{ position: 'absolute', left: BEZEL, right: BEZEL, top: FIELD.top - 2, height: 2, backgroundColor: PALETTE.ink.line }} />
        <div style={{ position: 'absolute', left: BEZEL, right: BEZEL, top: FIELD.bottom, height: 2, backgroundColor: PALETTE.ink.line }} />
      </AbsoluteFill>
    </Frame>
  )
}
