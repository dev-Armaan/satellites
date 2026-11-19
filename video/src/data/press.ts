/**
 * Coverage, one card an outlet: its name in type, and a screenshot of its own page (scripts/capture-proof.cjs, or
 * added by hand where the page refuses cloud addresses: see that script's header). A card whose screenshot is missing
 * sets the outlet's own headline in type instead.
 *
 * Sources: CBC's video page (cbc.ca/player/play/video/9.7426784); cs.uwaterloo.ca/news/
 * waterloo-computer-science-students-satellite-platform (18 Nov 2026); the Show HN thread
 * (news.ycombinator.com/item?id=50428907); tek.sapo.pt's "Site do dia" of 10 Nov 2026. CBC Radio's
 * Morning Edition clip and Made This Month are left out (owner).
 */
export interface PressItem {
  outlet: string
  /** the outlet's name, broken where it reads best when stacked */
  lines: string[]
  /** the mono line above: what kind of piece, where, when */
  kicker: string
  /** the capture's name in public/proof */
  shot: string
  /** the outlet's own headline, set in type when there is no capture */
  headline?: string
  /** the one fact worth a line of its own under the name */
  readout?: string
  /** one inversion in the run */
  inverted?: boolean
}

export const PRESS: PressItem[] = [
  {
    outlet: 'CBC',
    lines: ['CBC'],
    kicker: 'News · Video',
    shot: 'press-cbc',
    headline: 'UW student creates website that shows time-lapse satellite images',
  },
  {
    outlet: 'University of Waterloo',
    lines: ['University', 'of Waterloo'],
    kicker: 'Cheriton School of Computer Science · 18 Nov 2026',
    shot: 'press-waterloo',
    headline: 'Waterloo computer science student’s satellite platform attracts global audience',
  },
  // "500+" is the owner's wording, ahead of the count: the thread stood at 499 on 19 Nov 2026. Check it before posting.
  { outlet: 'Hacker News', lines: ['Hacker', 'News'], kicker: 'Show HN · 9 Nov 2026', shot: 'press-hn', readout: '500+ points', inverted: true },
  { outlet: 'SAPO Tek', lines: ['SAPO', 'Tek'], kicker: 'Portugal · 10 Nov 2026', shot: 'press-sapo', readout: 'Site do dia' },
]
