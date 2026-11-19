/**
 * The video's clock. Everything is cut on a grid of a tenth of a second (`T`), so every beat can be counted in tenths
 * and re-timed by changing one number; 60 fps because the fastest cuts hold for a single tenth, and at 30 fps a
 * six-frame settle would be three frames of mush.
 */
export const FPS = 60
export const WIDTH = 1080
export const HEIGHT = 1350

/** A tenth of a second: the grid every cut lands on. */
export const T = FPS / 10

/** Scene lengths in frames, in running order. The sum is the video's length (under 25 s by a wide margin). */
export const SCENES = {
  hook: 18 * T,
  numbers: 26 * T,
  press: 34 * T,
  flood: 28 * T,
  praise: 27 * T,
  languages: 39 * T,
  end: 14 * T,
} as const

export type SceneName = keyof typeof SCENES

export const TOTAL = Object.values(SCENES).reduce((a, b) => a + b, 0)

/** The frame a scene starts on. */
export function startOf(name: SceneName): number {
  let at = 0
  for (const [key, length] of Object.entries(SCENES)) {
    if (key === name) return at
    at += length
  }
  return at
}
