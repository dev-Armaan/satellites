/**
 * The words the video sets in its own type. Everything else people said is shown as a screenshot (src/data/proof.json
 * lists which, scripts/capture-proof.cjs captures them); these are the few lines pulled out of those screenshots to be
 * read at a glance, verbatim, each with its author.
 */
export interface Comment {
  source: 'Hacker News' | 'X' | 'Reddit'
  author: string
  text: string
}

const hn = (author: string, text: string): Comment => ({ source: 'Hacker News', author, text })

/** The maker's reply to the post the video opens on (the post itself is a screenshot). */
export const REPLY: Comment = { source: 'X', author: '@armaangupt0', text: 'was me' }

/** The one comment the flood resolves into, with the phrase that takes the accent. */
export const HERO: Comment & { before: string; phrase: string; after: string } = {
  ...hn('HoldOnAMinute', 'This may be the best combination of style and substance I have ever seen.'),
  before: 'This may be the best combination of',
  phrase: 'style and substance',
  after: 'I have ever seen.',
}

/** After the flood: a phrase a tenth of a second, each one somebody's own words, each set as wide as the frame. */
export const STROBE: Comment[] = [
  hn('creeble', 'Um, wow.'),
  hn('Zeetah', 'Just beautiful.'),
  hn('trizoza', 'Absolutely brilliant'),
  hn('award_', 'fantastic execution'),
  hn('jfsebastian', 'Pretty damn cool'),
  hn('timoshishi', 'This is incredible.'),
  hn('zenpositive', 'just amazing'),
  hn('sixtyj', 'Well done.'),
  hn('gizajob', 'Awesome page.'),
  hn('wpmaven', 'Very beautiful!'),
  hn('chrischase011', 'Nicely done!'),
  hn('2hjaito', 'wow good job'),
]
