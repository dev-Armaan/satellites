/**
 * The two moves the video allows itself. Scenes change by hard cut, never by fade or wipe; what keeps a cut from
 * feeling like a slideshow is that whatever arrives settles for a tenth of a second (`punch`), and what keeps a held
 * frame alive is a push so slow it is felt rather than seen (`drift`).
 */
import { Easing, interpolate } from 'remotion'
import { T } from './timing'

/** Scale for something that has just cut in at `from`: a hair too big, settled within a tenth of a second. */
export function punch(frame: number, from = 0, amount = 0.04): number {
  if (frame < from) return 1
  return interpolate(frame, [from, from + T], [1 + amount, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  })
}

/** Scale for a frame that holds from `from` for `length` frames: a constant, barely visible push in. */
export function drift(frame: number, from: number, length: number, amount = 0.02): number {
  return interpolate(frame, [from, from + length], [1, 1 + amount], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
}
