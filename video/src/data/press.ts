/**
 * Coverage, one card an outlet: its name in type, and a screenshot of its own page where one can be captured
 * (scripts/capture-proof.cjs). CBC's pages refuse cloud addresses, so until a screenshot of each is added by hand
 * those two cards set the outlet's own headline in type instead.
 *
 * Sources: CBC's video page (cbc.ca/player/play/video/9.7426784) and radio clip (The Morning Edition, K-W, clip
 * 16249864); cs.uwaterloo.ca/news/waterloo-computer-science-students-satellite-platform (18 Nov 2026); the Show HN
 * thread (news.ycombinator.com/item?id=50428907, 499 points); tek.sapo.pt's "Site do dia" of 10 Nov 2026.
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
    kicker: 'Video · Nov 2026',
    shot: 'press-cbc',
    headline: 'UW student creates website that shows time-lapse satellite images',
  },
  {
    outlet: 'CBC Radio',
    lines: ['CBC', 'Radio'],
    kicker: 'The Morning Edition · K-W',
    shot: 'press-cbc-radio',
    headline: 'UW student develops website showing satellite photos',
  },
  { outlet: 'University of Waterloo', lines: ['University', 'of Waterloo'], kicker: 'Cheriton School of Computer Science · 18 Nov 2026', shot: 'press-waterloo' },
  { outlet: 'Hacker News', lines: ['Hacker', 'News'], kicker: 'Show HN · 9 Nov 2026', shot: 'press-hn', readout: '499 points', inverted: true },
  { outlet: 'SAPO Tek', lines: ['SAPO', 'Tek'], kicker: 'Portugal · 10 Nov 2026', shot: 'press-sapo', readout: 'Site do dia' },
]
