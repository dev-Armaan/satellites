/**
 * The video's clock, which is the song's. The cut is laid over one unbroken excerpt of the music
 * (scripts/cut-music.py), so every scene starts on a beat of it and everything inside a scene moves on its
 * sixteenths (`T`). The beat was measured over that excerpt (a straight-line fit through 45 tracked beats: 0.38207 s,
 * 157.04 BPM, steady to within the tracker's jitter), which at 60 fps is 22.92 frames: not a whole number, so scenes
 * start on the nearest frame to their beat and nothing drifts. The frame is 16:9 (owner: a regular full-screen video).
 *
 * What the music is doing where, which is why the scenes are the lengths they are (bars of four beats, from the top):
 *   bar 0   "Don't stop me now"                    the first frame, then the press
 *   bar 2   "Don't stop me now" again              the million lands on it
 *   bar 4   the band comes back in                 the flood starts
 *   bar 6   a drum fill                            the strobe, on its eighths
 *   bar 7   "I'm a rocket ship on my way to Mars"  the one sentence
 *   bar 8   "on a collision course"                "Now in 16 languages", then the page
 *   bar 9   "I am a satellite"                     the languages turn over the globe
 *   bar 10  "I'm out of control"                   the wordmark; the music stops on the bar's last hit and rings out
 */
export const FPS = 60
export const WIDTH = 1920
export const HEIGHT = 1080

/** A beat of the song, in frames. */
export const BEAT = (FPS * 60) / 157.04
/** A sixteenth: the grid everything inside a scene moves on. */
export const T = BEAT / 4

/** Scene lengths in beats, in running order. The end holds two and a half beats past the last bar, for the ring-out. */
const BEATS = { intro: 2, press: 6, numbers: 8, flood: 8, praise: 8, languages: 8, end: 6.5 } as const

export type SceneName = keyof typeof BEATS
const NAMES = Object.keys(BEATS) as SceneName[]

/** The frame a scene starts on: its beat, to the nearest frame. */
export function startOf(name: SceneName): number {
  let beats = 0
  for (const key of NAMES) {
    if (key === name) break
    beats += BEATS[key]
  }
  return Math.round(beats * BEAT)
}

/** The video's length in frames (under 18 s). */
export const TOTAL = Math.round(Object.values(BEATS).reduce((a, b) => a + b, 0) * BEAT)

/** Scene lengths in frames: from one scene's start to the next. */
export const SCENES = Object.fromEntries(
  NAMES.map((name, i) => [name, (i + 1 < NAMES.length ? startOf(NAMES[i + 1]) : TOTAL) - startOf(name)]),
) as Record<SceneName, number>
