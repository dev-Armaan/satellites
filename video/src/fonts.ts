/**
 * Loads the site's faces before the video is registered (src/index.ts waits on `fontsReady`), because the big lines
 * are fitted to the frame by measuring them: a line measured in the fallback face would be set at the wrong size, and
 * the measurement is cached.
 */
import '@fontsource-variable/instrument-sans/standard.css'
import '@fontsource-variable/martian-mono/standard.css'
import '@fontsource/instrument-serif/400-italic.css'
import { MONO, SANS, SERIF } from './theme'

// One Latin and one Latin Extended letter, so both subset files of each face are fetched.
const SAMPLE = 'Watched ł'

export const fontsReady: Promise<unknown> = Promise.all([
  document.fonts.load(`600 condensed 100px '${SANS}'`, SAMPLE),
  document.fonts.load(`400 100px '${SANS}'`, SAMPLE),
  document.fonts.load(`400 semi-condensed 100px '${MONO}'`, SAMPLE),
  document.fonts.load(`italic 400 100px '${SERIF}'`, SAMPLE),
])
