/**
 * What people wrote, verbatim: their spelling, their punctuation, whole sentences (a comment cut short ends in "…").
 * Nothing here is paraphrased or tidied, because the flood is only worth showing if every card is a real one.
 *
 * Almost all of it is the Show HN thread (news.ycombinator.com/item?id=50428907, read through the public Algolia API).
 * X and Reddit cannot be read from a cloud session: add their posts here, with the handle and the text exactly as
 * posted, and the flood takes them.
 */
export interface Comment {
  source: 'Hacker News' | 'X' | 'Reddit'
  author: string
  text: string
}

const hn = (author: string, text: string): Comment => ({ source: 'Hacker News', author, text })

/** The post the video opens on, and the maker's reply to it. */
export const HOOK = {
  post: { source: 'X', author: '@AnkanXplorer', lines: [['who', 'tf'], ['made', 'this'], ['website', '😭']] },
  reply: { source: 'X', author: '@armaangupt0', text: 'was me' },
} as const

/** The one comment the flood resolves into. */
export const HERO: Comment & { before: string; phrase: string; after: string } = {
  ...hn('HoldOnAMinute', 'This may be the best combination of style and substance I have ever seen.'),
  before: 'This may be the best combination of',
  phrase: 'style and substance',
  after: 'I have ever seen.',
}

/** The flood, in the order the cards land: the first few are read, the rest are felt. */
export const FLOOD: Comment[] = [
  hn('kyleblarson', 'Beautiful site!'),
  hn('sixtyj', 'I work in geospatial. This site is really good one as you can see exact image taken by a satellite. Well done.'),
  hn('creeble', 'Um, wow. Amazing UI.'),
  hn('wnissen', "This is great for planning backpacking trips. I have been using Copernicus but you have a lot more and it's much easier to access. Very nice!"),
  hn('Zeetah', 'Love the fly overs, and the interface. Just beautiful.'),
  hn('award_', 'This is not only a very cool idea, but also fantastic execution! Great work and very neat!'),
  hn('gizajob', 'Awesome page. Thanks for building.'),
  hn('jttnr', 'That looks really nice. I especially like the view showing the satellite flying overhead and the line marking the scanned area.'),
  { source: 'X', author: '@kano955', text: '谁他妈做的 watched.earth，这站也太上头了。🤯' },
  hn('trizoza', 'Absolutely brilliant, thank you for making this!'),
  hn('nico', 'This is very cool, and a bit creepy too, but mostly cool'),
  hn('bketelsen', 'Great user interface - animations are such a nice touch.'),
  hn('adonovan', 'Beautifully done, at so many levels: the pincushion view of just how much stuff is up there; the rendering of the orbit of each satellite; the ground track of its aperture; the time series of its passes.'),
  hn('jfsebastian', 'Pretty damn cool and super smooth. Thanks op!'),
  hn('timoshishi', 'This is incredible. Amazing work!'),
  hn('a012', 'This is what I need: I like to see the latest developments in my area, but other web interfaces are hard to use.'),
  hn('janoelze', 'and built in three days!'),
  hn('quiroga09', "The fluid navigation, images and data (I didn't know that this was public) is awesome. Thanks"),
  hn('wpmaven', 'Very beautiful! Well done!'),
  hn('metalman', 'executes perfectly on my hincty android phone running a stripped down browser, everything is fast, search is educational…'),
  hn('zahirbmirza', 'oooh. so fun.'),
  hn('ayush_m1701', 'Really cool! The UI/UX is great.'),
  hn('mxuribe', 'Yeah, that was so cool; like something right out of a call sci-fi movie or show!'),
  hn('Jonah112', 'Thought this was amazing!'),
  hn('ugurkaya88', 'Beautiful combination of the data and the presentation.'),
  hn('moonjikwang', 'Awesome page!'),
  hn('tarpump', 'Really cool, and beautiful UX.'),
  hn('suryanallagonda', 'cool interaction in the hero section love the smooth transition'),
  hn('zenpositive', 'that is just amazing was worth the click!!!'),
  hn('2hjaito', 'wow good job'),
  hn('iantpe', 'This is a fantastic website.'),
  hn('1barun', 'This looks nice. Liked the satellite animation!'),
  hn('chrischase011', 'Nicely done!'),
  hn('ChoGGi', 'I can offer my gratitude for the experience. Thank you'),
  hn('animal_spirits', 'Welldone! very fun to play with'),
  hn('mrdabolins', 'Wow, amaizing vizual!'),
  hn('arindamghoshind', 'The visualization is very cool.'),
  hn('hxorr', 'Very cool tool'),
  hn('addandsubtract', 'This is cool!'),
]

/** After the flood: a phrase a tenth of a second, each one somebody's own words, each set as wide as the frame. */
export const STROBE: Comment[] = [
  hn('creeble', 'Um, wow.'),
  hn('Zeetah', 'Just beautiful.'),
  hn('trizoza', 'Absolutely brilliant'),
  hn('award_', 'fantastic execution'),
  hn('jfsebastian', 'Pretty damn cool'),
  hn('timoshishi', 'This is incredible.'),
  hn('zenpositive', 'just amazing'),
  hn('adonovan', 'Beautifully done'),
  hn('gizajob', 'Awesome page.'),
  hn('wpmaven', 'Very beautiful!'),
  hn('chrischase011', 'Nicely done!'),
  hn('2hjaito', 'wow good job'),
]
