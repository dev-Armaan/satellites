/**
 * The promo's running order. Scenes butt against each other with no transition between them: every change is a hard
 * cut, and nothing is laid over the scenes (a progress line along the bezel was tried and removed: owner).
 */
import type { FC } from 'react'
import { AbsoluteFill, Series } from 'remotion'
import { End } from './scenes/End'
import { Flood } from './scenes/Flood'
import { Hook } from './scenes/Hook'
import { Languages } from './scenes/Languages'
import { Numbers } from './scenes/Numbers'
import { Praise } from './scenes/Praise'
import { Press } from './scenes/Press'
import type { ProofProps } from './proof'
import { SCENES } from './timing'

export const Promo: FC<ProofProps> = ({ sizes }) => {
  return (
    <AbsoluteFill>
      <Series>
        <Series.Sequence name="Hook" durationInFrames={SCENES.hook}>
          <Hook />
        </Series.Sequence>
        <Series.Sequence name="Numbers" durationInFrames={SCENES.numbers}>
          <Numbers />
        </Series.Sequence>
        <Series.Sequence name="Press" durationInFrames={SCENES.press}>
          <Press sizes={sizes} />
        </Series.Sequence>
        <Series.Sequence name="Flood" durationInFrames={SCENES.flood}>
          <Flood sizes={sizes} />
        </Series.Sequence>
        <Series.Sequence name="Praise" durationInFrames={SCENES.praise}>
          <Praise />
        </Series.Sequence>
        <Series.Sequence name="Languages" durationInFrames={SCENES.languages}>
          <Languages />
        </Series.Sequence>
        <Series.Sequence name="End" durationInFrames={SCENES.end}>
          <End />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  )
}
