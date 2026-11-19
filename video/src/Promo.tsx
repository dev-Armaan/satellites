/**
 * The promo's running order. Scenes butt against each other with no transition between them: every change is a hard
 * cut, and nothing is laid over the scenes (a progress line along the bezel was tried and removed: owner). The
 * soundtrack is assembled here from each scene's own cues, moved to where that scene starts.
 */
import type { FC } from 'react'
import { AbsoluteFill, Series } from 'remotion'
import type { ProofProps } from './proof'
import { END_CUES, End } from './scenes/End'
import { Flood, floodCues } from './scenes/Flood'
import { INTRO_CUES, Intro } from './scenes/Intro'
import { LANGUAGES_CUES, Languages } from './scenes/Languages'
import { NUMBERS_CUES, Numbers } from './scenes/Numbers'
import { PRAISE_CUES, Praise } from './scenes/Praise'
import { PRESS_CUES, Press } from './scenes/Press'
import { Soundtrack, shift } from './sound'
import { SCENES, startOf } from './timing'

export const Promo: FC<ProofProps> = ({ sizes }) => {
  const cues = [
    ...shift(INTRO_CUES, startOf('intro')),
    ...shift(PRESS_CUES, startOf('press')),
    ...shift(NUMBERS_CUES, startOf('numbers')),
    ...shift(floodCues(sizes), startOf('flood')),
    ...shift(PRAISE_CUES, startOf('praise')),
    ...shift(LANGUAGES_CUES, startOf('languages')),
    ...shift(END_CUES, startOf('end')),
  ]
  return (
    <AbsoluteFill>
      <Series>
        <Series.Sequence name="Intro" durationInFrames={SCENES.intro}>
          <Intro />
        </Series.Sequence>
        <Series.Sequence name="Press" durationInFrames={SCENES.press}>
          <Press sizes={sizes} />
        </Series.Sequence>
        <Series.Sequence name="Numbers" durationInFrames={SCENES.numbers}>
          <Numbers />
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
      <Soundtrack cues={cues} />
    </AbsoluteFill>
  )
}
