/**
 * The opening: reach, before anything else. The two posts that carried the site, each as its screenshot, each with
 * its view count pulled out as large as the frame allows (3.2M and 3.6M: the figure is in the screenshot beside it).
 * The first frame is "who tf made this website", which is the hook; a tenth of a second later the number is the
 * reason to keep watching. The second post repeats the move faster, because by then the pattern is known, and
 * mirrored (post and number swap corners), so the cut between them moves everything on screen.
 */
import type { FC } from 'react'
import { Img, useCurrentFrame } from 'remotion'
import { Frame } from '../components/Frame'
import proof from '../data/proof.json'
import { drift, punch } from '../motion'
import { shot } from '../proof'
import { MARGIN, PALETTE, accent, display } from '../theme'
import { SCENES, T } from '../timing'

/** When each post cuts in, and how long after it its number lands. */
const POSTS_AT = [0, 8 * T]
const VIEWS_AFTER = [4 * T, 2 * T]
/** How wide a post is shown; its number stands in the opposite corner. */
const POST_W = 1420
const POST_TOP = 126
const NUMBER = 310

export const Hook: FC = () => {
  const frame = useCurrentFrame()
  const p = PALETTE.ink
  const index = frame >= POSTS_AT[1] ? 1 : 0
  const post = proof.opening[index]
  const from = POSTS_AT[index]
  const until = index === 0 ? POSTS_AT[1] : SCENES.hook
  const viewsAt = from + VIEWS_AFTER[index]
  // The first post hangs from the top left with its number bottom right; the second is the mirror of that.
  const postSide = index === 0 ? 'left' : 'right'
  const numberSide = index === 0 ? 'right' : 'left'
  return (
    <Frame section="on X" readout={`0${index + 1} / 0${proof.opening.length}`}>
      <Img
        src={shot(post.file)}
        style={{
          position: 'absolute',
          [postSide]: MARGIN,
          top: POST_TOP,
          width: POST_W,
          outline: `2px solid ${p.mark}`,
          transformOrigin: `${postSide} top`,
          scale: punch(frame, from, 0.05) * drift(frame, from, until - from, 0.02),
        }}
      />
      <div
        style={{
          ...display(NUMBER),
          position: 'absolute',
          [numberSide]: MARGIN,
          bottom: 62,
          color: p.fg,
          whiteSpace: 'nowrap',
          visibility: frame >= viewsAt ? 'visible' : 'hidden',
          transformOrigin: `${numberSide} bottom`,
          scale: punch(frame, viewsAt, 0.06),
        }}
      >
        {post.views} <span style={{ ...accent(), fontSize: '1.08em', color: p.accent }}>views.</span>
      </div>
    </Frame>
  )
}
