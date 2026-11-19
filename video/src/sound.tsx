/**
 * The soundtrack: every sound effect, placed. A scene says when its own sounds happen (its `…_CUES`, written with
 * the same constants that time its picture, so sound and picture cannot drift apart), and this plays them all from
 * one place on the video's timeline. Sounds are mounted here and never inside a scene, because scenes swap whole
 * trees between beats and a sound unmounted with its beat would be cut off mid-ring.
 *
 * The sounds themselves are made by scripts/make-sfx.cjs. Most people will first see the video muted, so nothing in
 * it depends on being heard.
 */
import { Audio } from '@remotion/media'
import type { FC } from 'react'
import { Sequence, staticFile } from 'remotion'

export type Sound = 'tick' | 'tock' | 'key' | 'shutter' | 'thump' | 'boom' | 'count' | 'riser'

export interface Cue {
  /** the frame it starts on, in its scene's own time */
  at: number
  sound: Sound
  /** 0–1, before the master level */
  volume?: number
  /** playback speed, which is also pitch: repeated sounds vary it so they do not machine-gun */
  rate?: number
  /** cut it off after this many frames (a sound that must stop with its scene) */
  length?: number
}

/**
 * The level of the whole track, set by measuring a render: about −18 LUFS with peaks at −0.7 dB (a track of nothing
 * but short hits measures low for how loud it sounds, and cannot go higher without clipping).
 */
const MASTER = 0.9

/** Cues moved onto the video's timeline from a scene that starts at `start`. */
export const shift = (cues: Cue[], start: number): Cue[] => cues.map((c) => ({ ...c, at: c.at + start }))

export const Soundtrack: FC<{ cues: Cue[] }> = ({ cues }) => (
  <>
    {cues.map((cue, i) => (
      <Sequence key={i} from={cue.at} durationInFrames={cue.length} layout="none" name={cue.sound}>
        <Audio src={staticFile(`sfx/${cue.sound}.wav`)} volume={(cue.volume ?? 1) * MASTER} playbackRate={cue.rate ?? 1} />
      </Sequence>
    ))}
  </>
)
