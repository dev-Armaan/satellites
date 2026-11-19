/**
 * The soundtrack: every sound effect, placed. A scene says when its own sounds happen (its `…_CUES`, written with
 * the same constants that time its picture, so sound and picture cannot drift apart), and this plays them all from
 * one place on the video's timeline. Sounds are mounted here and never inside a scene, because scenes swap whole
 * trees between beats and a sound unmounted with its beat would be cut off mid-ring.
 *
 * The sounds themselves are made by scripts/make-sfx.cjs, and the song under them is cut by scripts/cut-music.py.
 * There are few on purpose (owner: no effect just to have one; each has to add something the song does not). What is
 * left: a low hit on the million and on the wordmark (not on the first frame: the song fades in there, and a hit
 * would undo that); a pop for each comment as it lands in the flood; and the keys of the address being typed, after
 * the music has stopped.
 * Ticks on every cut, a swish on every card, a shutter on every language, a sweep on the countries and a riser under
 * the flood were all tried and removed. Most people will first see the video muted, so nothing in it depends on being heard.
 */
import { Audio } from '@remotion/media'
import type { FC } from 'react'
import { Sequence, staticFile } from 'remotion'

export type Sound = 'boom' | 'pop' | 'key'

export interface Cue {
  /** the frame it starts on, in its scene's own time */
  at: number
  sound: Sound
  /** 0–1, before the master level */
  volume?: number
  /** playback speed, which is also pitch: the pops and the keys vary it so they do not machine-gun */
  rate?: number
  /** cut it off after this many frames (a sound that must stop with its scene) */
  length?: number
}

/**
 * The level of the effects under the music, set by measuring a render (the whole mix at about −14 LUFS, peaks under
 * −1 dB). They sit well below the song: it carries the video, they only mark the cuts.
 */
const MASTER = 0.42

/** Cues moved onto the video's timeline from a scene that starts at `start`. */
export const shift = (cues: Cue[], start: number): Cue[] => cues.map((c) => ({ ...c, at: c.at + start }))

/** `music`: whether the song's excerpt is there to play (it is generated and uncommitted: scripts/cut-music.py). */
export const Soundtrack: FC<{ cues: Cue[]; music: boolean }> = ({ cues, music }) => (
  <>
    {music ? <Audio src={staticFile('music/track.wav')} /> : null}
    {cues.map((cue, i) => (
      <Sequence key={i} from={Math.round(cue.at)} durationInFrames={cue.length} layout="none" name={cue.sound}>
        <Audio src={staticFile(`sfx/${cue.sound}.wav`)} volume={(cue.volume ?? 1) * MASTER} playbackRate={cue.rate ?? 1} />
      </Sequence>
    ))}
  </>
)
