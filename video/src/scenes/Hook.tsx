/**
 * The opening: a stranger's post asking who made the site, then the maker's two-word answer. It is the whole story in
 * under two seconds (people found it before they knew whose it was), and it is funnier than any headline about
 * growth, so it earns the first frame.
 */
import type { FC } from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Frame } from '../components/Frame'
import { HOOK } from '../data/comments'
import { fitAccent, fitDisplay } from '../fit'
import { punch } from '../motion'
import { MARGIN, MEASURE, PALETTE, accent, display, label } from '../theme'
import { T } from '../timing'

/** The post's words land one every 5 frames, the first on the first frame (which is often the video's poster). */
const FIRST_WORD = 0
const WORD_EVERY = 5
/** The answer cuts in on this frame. */
export const REPLY_AT = 11 * T

export const Hook: FC = () => {
  const frame = useCurrentFrame()
  if (frame >= REPLY_AT) {
    const p = PALETTE.bone
    const size = fitAccent(HOOK.reply.text, MEASURE - 40, 520)
    return (
      <Frame tone="bone" section="the reply">
        <AbsoluteFill style={{ justifyContent: 'center', paddingLeft: MARGIN, paddingBottom: 60, scale: punch(frame, REPLY_AT) }}>
          <div style={{ ...label(26), textTransform: 'none', color: p.dim, marginBottom: 6 }}>{HOOK.reply.author}</div>
          <div style={{ ...accent(), fontSize: size, lineHeight: 0.9, color: p.fg, marginLeft: -size * 0.02 }}>{HOOK.reply.text}</div>
        </AbsoluteFill>
      </Frame>
    )
  }
  const p = PALETTE.ink
  const size = Math.min(...HOOK.post.lines.map((line) => fitDisplay(line.join(' '), MEASURE - 30, 320)))
  let word = 0
  return (
    <Frame section={`a post on ${HOOK.post.source}`}>
      <AbsoluteFill style={{ justifyContent: 'center', paddingLeft: MARGIN, paddingBottom: 40 }}>
        <div style={{ ...label(26), textTransform: 'none', color: p.dim, marginBottom: 34 }}>{HOOK.post.author}</div>
        <div style={{ ...display(size), color: p.fg }}>
          {HOOK.post.lines.map((line, i) => (
            <div key={i} style={{ whiteSpace: 'nowrap' }}>
              {line.map((w) => {
                const at = FIRST_WORD + word++ * WORD_EVERY
                return (
                  <span key={w} style={{ display: 'inline-block', marginRight: '0.2em', visibility: frame >= at ? 'visible' : 'hidden', scale: punch(frame, at, 0.08), transformOrigin: 'left bottom' }}>
                    {w}
                  </span>
                )
              })}
            </div>
          ))}
        </div>
      </AbsoluteFill>
    </Frame>
  )
}
