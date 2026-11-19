/**
 * The entry Remotion bundles. The video is registered only once the fonts are in (src/fonts.ts): lines are fitted by
 * measuring them, and a measurement taken before the face has loaded is wrong and cached.
 */
import { registerRoot } from 'remotion'
import { fontsReady } from './fonts'
import { Root } from './Root'

fontsReady.then(() => registerRoot(Root))
