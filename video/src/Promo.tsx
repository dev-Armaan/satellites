/**
 * The promo's running order. Scenes butt against each other with no transition between them (every change is a hard
 * cut); the one thing that runs through all of them is the signal hairline along the bottom of the bezel, which
 * fills as the video plays so that even a held frame is moving.
 */
import type { FC } from 'react'
import { AbsoluteFill, Series, interpolate, useCurrentFrame } from 'remotion'
import { BEZEL } from './components/Frame'
import { End } from './scenes/End'
import { Flood } from './scenes/Flood'
import { Hook } from './scenes/Hook'
import { Languages } from './scenes/Languages'
import { Numbers } from './scenes/Numbers'
import { Praise } from './scenes/Praise'
import { Press } from './scenes/Press'
import { SIGNAL } from './theme'
import { SCENES, TOTAL, WIDTH } from './timing'

export const Promo: FC = () => {
  const frame = useCurrentFrame()
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
          <Press />
        </Series.Sequence>
        <Series.Sequence name="Flood" durationInFrames={SCENES.flood}>
          <Flood />
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
      <div
        style={{
          position: 'absolute',
          left: BEZEL,
          bottom: BEZEL,
          height: 2,
          width: interpolate(frame, [0, TOTAL - 1], [0, WIDTH - 2 * BEZEL]),
          backgroundColor: SIGNAL,
        }}
      />
    </AbsoluteFill>
  )
}
