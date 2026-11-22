/**
 * English copy for the share sheet (src/ui/share/ShareSheet.tsx: its title, buttons, link field and post preview), the
 * post text it prefills (src/ui/share/links.ts: what lands on X, in a native share sheet or on the clipboard) and the
 * words in the PNG's file name. The card itself and the share page speak from the 'card' namespace
 * (api/_lib/i18n/card/en.ts), which the server shares.
 *
 * Why it is shaped this way:
 *  - What is shared is in the SHARER's language: the post, the PNG and its file name follow the app's language when
 *    they press Share. The link carries only the language's code (`l=`), so its card and share page match the post.
 *  - The post is whole sentences, one message per kind of pass, with every slot a parameter: the satellite's name and
 *    the place as they come (never inflected), the altitude in km and the pixel size in metres (numbers), the moment
 *    (`when`: the instant, the place's zone and its 24-hour clock). Paragraphs are joined by the
 *    code (a blank line, then the credit on the last line), so a message never holds a line break.
 *  - X counts a Chinese, Japanese or Korean character twice (links.ts xLength): a post must stay within 256 of those
 *    units with a 120-character place name; past that the invitation is dropped, then the first paragraph is cut.
 *  - Button labels are mono caps by CSS (stored in sentence case), on one line: three of them share a 360 px phone's
 *    width (about 12 characters each), so keep them short.
 */
import { ns } from '../ns'
import { enDay } from '../../../api/_lib/i18n/card/en'

/** When a pass was closest, at the place: the instant, the place's IANA zone, and its 24-hour clock there ("11:21"). */
export interface PostWhen {
  ms: number
  timeZone: string
  clock: string
}

/** "795 km": the satellite's altitude in the post (whole km, no grouping) */
const km = (altitudeKm: number) => `${Math.round(altitudeKm)} km`
/** "10 m", "2 km": a pixel's size in the post, in whole metres or whole km (the results' pixelLabel, no grouping) */
const pixel = (m: number) => (m >= 1000 ? `${Math.round(m / 1000)} km` : `${Math.round(m)} m`)
/** "Sun 1 Nov at 11:21 local" */
const when = (w: PostWhen) => `${enDay(w.ms, w.timeZone)} at ${w.clock} local`

export default ns('share', {
  // ── The sheet ─────────────────────────────────────────────────────────────────────────────────────────────────────

  /** The sheet's title (mono caps by CSS, one line beside the close button) for a pass */
  titlePass: 'Share this pass',
  /** …for a geostationary image (a scan of the whole disc, not a pass) */
  titleImage: 'Share this image',
  /** …for the week at the place (the summary) */
  titleWeek: 'Share this week',
  /** The close button's accessible name (aria only; an icon button) */
  close: 'Close',
  /** Its tooltip, with the key that also closes the sheet */
  closeTitle: 'Close (Esc)',

  // ── Buttons (mono caps by CSS; one line, never wrapped) ───────────────────────────────────────────────────────────

  /** Phones: the full-width primary, once the card's PNG is ready to attach */
  shareImage: 'Share image',
  /** …while the PNG is still being drawn (for up to 2.5 s; pressing it then does nothing) */
  preparingImage: 'Preparing image…',
  /** …when the PNG took too long or failed: shares the text and link alone */
  share: 'Share',
  /** Copy the link (one of three equal buttons on a phone) */
  copyLink: 'Copy link',
  /** Laptops: the same button beside "Copy image", where there is room to name what it copies (a language whose phone
   *  row only fits the verb, "Kopieren", says it in full here) */
  copyLinkDesktop: 'Copy link',
  /** Replaces "Copy link" / "Copy image" for 2 s once it worked */
  copied: 'Copied',
  /** Opens X's post composer with the text and link ("X" is the network's name) */
  postToX: 'Post to X',
  /** Desktop: the card on the clipboard, to paste into a post */
  copyImage: 'Copy image',
  /** Download the card */
  savePng: 'Save PNG',
  /** Replaces "Save PNG" when drawing the card failed */
  tryAgain: 'Try again',

  // ── The link and the post preview ─────────────────────────────────────────────────────────────────────────────────

  /** The link field's label (mono caps by CSS; its column is at least 48 px, else the wider of this and `postLabel`) */
  linkLabel: 'Link',
  /** The field's tooltip when it holds the long direct link (the short /s/ link could not be made) */
  directLink: 'Direct link: the short link could not be made right now',
  /** The field while the short link is being made (one line, cut with an ellipsis) */
  creatingLink: 'Creating link…',
  /** The field before the first share (the link is made on the first press) */
  linkLater: 'Made when you share',
  /** The post preview's label (mono caps by CSS, the same column as `linkLabel`) */
  postLabel: 'Post',
  /** Under the buttons when the card could not be drawn in this browser */
  renderFailed: 'The card could not be rendered here; the link still works.',

  // ── The post (first paragraph, by what the satellite did; then the invitation; then the credit) ──────────────────

  post: {
    /**
     * It took the picture, which is not clouded: from how high and when, then what the picture is. `pixelM` is the size
     * of one of its pixels on the ground, in metres (10 for Sentinel-2, 375 for VIIRS, 2000 for a 2 km weather grid),
     * when known: English writes it in whole metres, or whole km from 1000 m ("10 m per pixel", "2 km per pixel").
     */
    imaged: (sat: string, place: string, altitudeKm: number, w: PostWhen, pixelM?: number) =>
      `${sat} watched ${place} from ${km(altitudeKm)} up on ${when(w)}. ${pixelM !== undefined ? `${pixel(pixelM)} per pixel; this` : 'This'} is the actual image.`,
    /** It took the picture, but clouds hid the place: `cloud` is the card's own sentence for it ("It saw only cloud.") */
    clouded: (sat: string, place: string, altitudeKm: number, w: PostWhen, cloud: string) =>
      `${sat} watched ${place} from ${km(altitudeKm)} up on ${when(w)}. ${cloud}`,
    /** The place was inside its camera's swath (no public picture yet) */
    likely: (sat: string, place: string, altitudeKm: number, w: PostWhen) =>
      `${sat} swept over ${place} from ${km(altitudeKm)} up on ${when(w)}. Its camera's swath covered the spot.`,
    /** A commercial satellite that could have pointed its camera here: honest about what we don't know */
    could: (sat: string, place: string, w: PostWhen) =>
      `${sat} passed within view of ${place} on ${when(w)}. It could have pointed here. Its operator doesn't say whether it did.`,
    /** It passed over (no camera pointed here) */
    overhead: (sat: string, place: string, altitudeKm: number, w: PostWhen) => `${sat} passed ${km(altitudeKm)} over ${place} on ${when(w)}.`,
  },
  /** The invitation after a satellite took a picture (or a week a satellite watched): its own paragraph, dropped first when the post runs long */
  hookWatched: 'Something watched you this week too.',
  /** …after any other pass (or a week nothing watched) */
  hookPassed: 'What passed over you this week?',
  /** The post's last line, the creator's credit: `handle` is an X handle (never translated). Usually kept as is */
  credit: (handle: string) => `via ${handle}`,

  // ── File names (lowercase ASCII words and hyphens: they travel through every app and file system) ────────────────

  /** The PNG of a pass: the satellite and place as slugs ("sentinel-2c", "waterloo"), and the UTC day ("2026-11-01") */
  pngName: (sat: string, place: string, day: string) => `watched-${sat}-${place}-${day}.png`,
  /** The PNG of a week: the place as a slug and the week's last UTC day */
  weekPngName: (place: string, day: string) => `watched-${place}-week-${day}.png`,
})
