/**
 * English copy for the photo gallery (src/ui/results/Gallery.tsx) and the photo frames it shows (PhotoFrame.tsx, and
 * PushbroomReveal.tsx wherever a photo develops): the bar (filter, counter, ‹ ›), each slide's buttons and chips, what
 * a picture shows at the place, and a frame's waiting and error states.
 *
 * The photo viewer (lightbox.ts) reuses the words a photo carries everywhere (why a cover leads, its alt text,
 * "Acquiring", the scale bar, ‹ ›), so a photo says the same thing in the panel and large. Mono labels are written in
 * sentence case and uppercased by CSS. Not copy, and so not here: satellite names, sensors (MSI, OLI-2), product codes
 * (lib/captures), coordinates, 24 h times, zone abbreviations, and the archives' credit lines (legal attributions stay
 * English, docs/I18N.md; Gallery.tsx credit()).
 *
 * Inserted names (satellite, place) are never inflected; days ("Sun 1 Nov") and times ("16:14") arrive written by the
 * app's time formatter in the active language, and are placed as they come.
 */
import { ns } from '../ns'
import { fmt } from '../../../api/_lib/i18n/format'
import { strong, type Rich } from '../../../api/_lib/i18n/parts'

const en = fmt('en')
const pct = (n: number) => `${en.int(n)}%`

/** Why a cover photo leads the gallery (lib/photos CoverKind). */
export type CoverLead = 'closest' | 'lastClear' | 'clouded'

const LEAD: Record<CoverLead, string> = {
  closest: 'Closest look',
  lastClear: 'Last clear look',
  clouded: 'Clouded over',
}

export default ns('gallery', {
  // ── the bar over the photos ──────────────────────────────────────────────────────────────
  /** The bar's label over the summary's photos when there is no filter (mono caps) */
  barLabel: 'Photos',
  /** The filter's accessible name (aria only) */
  filterLabel: 'Show photos',
  /**
   * The filter's segments (mono caps, nowrap): all four sit side by side with the counter in a 350 px bar on laptops
   * and a 263 px half column on short landscape phones, so keep each to about 8 characters.
   */
  filter: { all: 'All', detailed: 'Detailed', weather: 'Weather', radar: 'Radar' },
  /** Each segment's tooltip (title) */
  filterTitle: {
    all: 'Every photo, newest first after the closest look',
    detailed: 'Sentinel-2 and Landsat, 10–30 m per pixel',
    weather: 'Daily weather mosaics, 250 m per pixel and coarser',
    radar: 'Sentinel-1 radar images, 20 m per pixel: through cloud, day or night',
  },
  /**
   * The counter on the last clear look (a photo from before the window, so it has no number): how many of the
   * window's photos follow it. Mono caps, nowrap, its box sized to about 12 characters.
   */
  photosThisWeek: (n: number) => `${en.int(n)} this week`,
  /** The same, for a window that ended a while ago (a shared link opened days later) */
  photosThatWeek: (n: number) => `${en.int(n)} that week`,
  /** The ‹ button (laptops; aria) */
  prevPhoto: 'Previous photo',
  /**
   * Its tooltip, naming the key. ← and → are the physical arrow keys, which keep their meaning in every language for
   * now (ArrowLeft is the previous photo, ArrowRight the next): keep both arrows exactly as they are, in any script.
   */
  prevTitle: 'Previous (←)',
  /** The › button (laptops; aria) */
  nextPhoto: 'Next photo',
  /** Its tooltip, naming the key (→ is the physical ArrowRight key: keep it, as in prevTitle) */
  nextTitle: 'Next (→)',
  /** aria-roledescription of the strip (screen readers say it instead of "group") */
  carousel: 'carousel',
  /** The strip's accessible name */
  trackLabel: 'Photos of this place, swipe for more',

  // ── a slide ──────────────────────────────────────────────────────────────────────────────
  /** aria-roledescription of one photo in the strip */
  slide: 'slide',
  /**
   * Why the cover leads: a chip on the summary's first photo (mono caps, one line, ≤ ~20 characters) and the start of
   * the photo viewer's counter. The share card says the same words (api/_lib/cardSpec.ts).
   */
  lead: LEAD,
  /**
   * A slide's accessible name. `lead`: why it leads (cover only); `day` "Sunday 1 November" (the day in words, as
   * screen readers say it) and `time` "16:14" at the place;
   * `photo`: its place among the window's photos (absent for the last clear look, which is not one of them).
   */
  slideLabel: (lead: CoverLead | undefined, sat: string, day: string, time: string, photo?: { k: number; n: number }) =>
    `${lead ? `${LEAD[lead]}: ` : ''}${sat}, ${day} ${time}${photo ? `, photo ${en.int(photo.k)} of ${en.int(photo.n)}` : ''}`,
  /** The summary card's Replay button, its accessible name */
  replayLabel: (sat: string, day: string, time: string) => `Replay this pass on the globe: ${sat}, ${day} ${time}`,
  /**
   * The Replay button's words (mono caps, beside the caption; hidden under 380 px, where the play glyph stays). The
   * strong part is shown only on portrait tablets, which have room for the longer phrase: phones and laptops read the
   * other parts alone ("Replay"), tablets the whole ("Replay this pass"). Both must read as a label. Put the strong
   * part wherever your words need it (before, after or inside), at most one; leave none if the label cannot be
   * shortened.
   */
  replay: ['Replay', strong(' this pass')] as Rich,
  /** The last clear look has no pass to replay: its button opens it large instead (accessible names) */
  viewLabel: {
    lastClear: (sat: string, day: string, time: string) => `View the last clear look large: ${sat}, ${day} ${time}`,
    photo: (sat: string, day: string, time: string) => `View the photo large: ${sat}, ${day} ${time}`,
  },
  /** That button's word (mono caps, like Replay) */
  view: 'View',
  /** The summary card's share button (laptops): accessible name and tooltip */
  sharePass: 'Share this pass',
  /** The chip on a radar image (mono caps, ice colour) */
  radarTag: 'Radar',
  /** The note on the last clear look when the window has photos, all of them mostly cloud (mono caps chip, may wrap) */
  noteMostlyCloud: 'This week’s passes saw mostly cloud',
  /** The note on the last clear look when the window has no photo at all */
  noteLastClear: 'Here’s the last clear look',
  /** The warn chip on a clouded picture: `pct` is the scene's cloud cover; "your spot" is the searched place */
  clouded: {
    pct: (p: number) => `Clouded over · ${pct(p)}`,
    /** The cover: clouded over, and cloud at the place itself */
    coverAtSpot: 'Clouded over · cloud at your spot',
    atSpot: 'Cloud at your spot',
  },
  /**
   * What a picture shows at the place, in the fewest words (mono caps, nowrap, beside the product line: keep ≤ ~14
   * characters). "spot" is the searched place.
   */
  status: {
    cloudedPct: (p: number) => `Clouded · ${pct(p)}`,
    cloudAtSpot: 'Cloud at spot',
    clear: 'Clear',
    cirrus: 'Thin cirrus',
    shadow: 'Cloud shadow',
    /** The scene's cloud cover, when the place itself was not read */
    cloudPct: (p: number) => `Cloud ${pct(p)}`,
    /** A coarse daily weather mosaic */
    mosaic: 'Daily mosaic',
  },
  /** The width of ground a photo shows (whole kilometres from 100, else one decimal) */
  cropKm: (km: number) => `${km >= 100 ? en.int(km) : en.dec(km, 1)} km`,

  // ── a photo frame ────────────────────────────────────────────────────────────────────────
  /** A photo's alt text: who took it, and where the searched place is in it (the reticle at the centre) */
  photoAlt: (sat: string, place: string) => `${sat} image of ${place}. The place is at the centre.`,
  /** While the photo loads (mono caps readout; a blinking caret follows it) */
  acquiring: 'Acquiring',
  /** The archive sent nothing (mono caps readout) */
  noImage: 'No image returned',
  /** Try the photo again (a small mono caps button) */
  retry: 'Retry',
  /** The scale bar on a photo (mono chip): 0.1, 0.2 or 0.5 under a kilometre, else whole kilometres */
  scaleKm: (km: number) => `${km >= 1 ? en.int(km) : en.dec(km, 1)} km`,
  /**
   * True north on the photo, after its arrow (a one-character chip). The cartographic N is understood everywhere;
   * use your own initial only if your readers expect it.
   */
  north: 'N',
  /** The expand control on a photo (accessible name) */
  expandLabel: 'Expand the photo',
  /** Its tooltip: F is the key that opens and closes the viewer */
  expandTitle: 'Expand (F)',

  // ── a photo developing (the pushbroom reveal) ────────────────────────────────────────────
  /** Under "Acquiring" when the archive is slow (a short mono note, ≤ ~30 characters a line) */
  stillRendering: 'Still rendering. Large scenes can take 10 s or more.',
  /** Under "No image returned" */
  cropMissing: 'The archive did not send this crop. It may be busy; the image itself still exists.',
  /**
   * The scan counter on a developing photo (mono caps chip): `line` counts up as the scan runs and `lines` is the last;
   * both are zero-padded ("0412", "1024") and stay as they are, digits. The arrow means counting up to the last line: a
   * right-to-left language may write ← or keep →. The strong part is the live counter: keep exactly one.
   */
  scanLine: (line: string, lines: string): Rich => ['Line ', strong(line), ` → ${lines}`],
  /**
   * The chip while a photo waits for the replay to reach the moment it was taken (mono caps); a countdown
   * " · T−00:00:41" follows it. A geostationary image waits for the scan line instead of a pass.
   */
  awaiting: { pass: 'Awaiting pass', scan: 'Awaiting scan' },
})
