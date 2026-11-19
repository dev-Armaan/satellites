/**
 * The compositions Remotion can render: the promo, and each scene on its own so one beat can be opened, scrubbed and
 * re-timed in the Studio without playing the rest. Each is handed the capture sizes before it renders (src/proof.ts).
 */
import type { FC } from 'react'
import { Composition, Folder } from 'remotion'
import { Promo } from './Promo'
import { withProof, type ProofProps } from './proof'
import { End } from './scenes/End'
import { Flood } from './scenes/Flood'
import { Intro } from './scenes/Intro'
import { Languages } from './scenes/Languages'
import { Numbers } from './scenes/Numbers'
import { Praise } from './scenes/Praise'
import { Press } from './scenes/Press'
import { FPS, HEIGHT, SCENES, TOTAL, WIDTH } from './timing'

const size = { width: WIDTH, height: HEIGHT, fps: FPS }
const proof = { defaultProps: { sizes: {}, music: false } satisfies ProofProps, calculateMetadata: withProof }

export const Root: FC = () => (
  <>
    <Composition id="Promo" component={Promo} durationInFrames={TOTAL} {...size} {...proof} />
    <Folder name="Scenes">
      <Composition id="Intro" component={Intro} durationInFrames={SCENES.intro} {...size} />
      <Composition id="Press" component={Press} durationInFrames={SCENES.press} {...size} {...proof} />
      <Composition id="Numbers" component={Numbers} durationInFrames={SCENES.numbers} {...size} />
      <Composition id="Flood" component={Flood} durationInFrames={SCENES.flood} {...size} {...proof} />
      <Composition id="Praise" component={Praise} durationInFrames={SCENES.praise} {...size} />
      <Composition id="Languages" component={Languages} durationInFrames={SCENES.languages} {...size} />
      <Composition id="End" component={End} durationInFrames={SCENES.end} {...size} />
    </Folder>
  </>
)
