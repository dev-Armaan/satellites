/**
 * The opening: a stranger's post asking who made the site (the real post, as X serves it: 18.7K likes), then the
 * maker's two-word answer. It is the whole story in under two seconds (people found it before they knew whose it
 * was), and it is funnier than any headline about growth, so it earns the first frame.
 */
import type { FC } from 'react'
import { AbsoluteFill, Img, useCurrentFrame } from 'remotion'
import { Frame } from '../components/Frame'
import { REPLY } from '../data/comments'
import proof from '../data/proof.json'
import { fitAccent } from '../fit'
import { drift, punch } from '../motion'
import { shot } from '../proof'
import { MARGIN, MEASURE, PALETTE, accent, label } from '../theme'
import { T } from '../timing'

/** The answer cuts in on this frame. */
export const REPLY_AT = 11 * T
/** How wide the post is shown. */
const POST_W = 1320

export const Hook: FC = () => {
  const frame = useCurrentFrame()
  if (frame >= REPLY_AT) {
    const p = PALETTE.bone
    const size = fitAccent(REPLY.text, MEASURE * 0.72, 620)
    return (
      <Frame tone="bone" section="the reply">
        <AbsoluteFill style={{ justifyContent: 'center', paddingLeft: MARGIN, paddingBottom: 30, scale: punch(frame, REPLY_AT) }}>
          <div style={{ ...label(30), textTransform: 'none', color: p.dim }}>{REPLY.author}</div>
          <div style={{ ...accent(), fontSize: size, lineHeight: 0.92, color: p.fg, marginLeft: -size * 0.02 }}>{REPLY.text}</div>
        </AbsoluteFill>
      </Frame>
    )
  }
  return (
    <Frame section="a post on X">
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', paddingTop: 30 }}>
        <Img src={shot(`x-${proof.hook.id}`)} style={{ width: POST_W, scale: punch(frame, 0, 0.06) * drift(frame, 0, REPLY_AT, 0.035) }} />
      </AbsoluteFill>
    </Frame>
  )
}
