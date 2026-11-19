/**
 * Coverage, as each outlet titled it. Outlets are named in type and never by logo, and no footage or audio of theirs
 * is used: both would need the outlet's permission.
 *
 * Sources: CBC's video page (cbc.ca/player/play/video/9.7426784) and radio clip (The Morning Edition, K-W, clip
 * 16249864); cs.uwaterloo.ca/news/waterloo-computer-science-students-satellite-platform (18 Nov 2026); the Show HN
 * thread (news.ycombinator.com/item?id=50428907, 499 points); tek.sapo.pt's "Site do dia" of 10 Nov 2026;
 * madethismonth.com/p/watched.
 */
export interface PressItem {
  outlet: string
  /** the mono line above: what kind of piece, where, when */
  kicker: string
  /** the outlet's own headline, or the one fact worth the frame */
  headline: string
  /** set the headline as a number readout instead of a quoted title */
  readout?: boolean
}

export const PRESS: PressItem[] = [
  { outlet: 'CBC', kicker: 'Video · Nov 2026', headline: 'UW student creates website that shows time-lapse satellite images' },
  { outlet: 'CBC Radio', kicker: 'The Morning Edition · K-W', headline: 'UW student develops website showing satellite photos' },
  {
    outlet: 'University of Waterloo',
    kicker: 'Cheriton School of Computer Science · 18 Nov 2026',
    headline: 'Waterloo computer science student’s satellite platform attracts global audience',
  },
  { outlet: 'Hacker News', kicker: 'Show HN · 9 Nov 2026', headline: '499 points', readout: true },
  { outlet: 'SAPO Tek', kicker: 'Portugal · 10 Nov 2026', headline: 'Site do dia', readout: true },
  { outlet: 'Made This Month', kicker: 'November 2026', headline: 'Featured', readout: true },
]
