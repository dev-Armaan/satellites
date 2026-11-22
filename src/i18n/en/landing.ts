/**
 * English copy for the landing (src/ui/landing): the hero, the place search, "Use my location", the example chips and
 * the maker's credit. The curated places' own names are the 'places' namespace.
 *
 * Mono labels (the kicker, the field's meta row, chips, the locate button, footnotes) are stored in sentence case and
 * uppercased by CSS (which follows `lang`). Space is tight in the search line on phones: its trailing slot shares one
 * line with the input, so the short forms really must stay short. Voice: DESIGN §7 (declarative, specific, quietly
 * uncanny, second person).
 */
import { fmt } from '../../../api/_lib/i18n/format'
import { accent, type Rich } from '../../../api/_lib/i18n/parts'
import { ns } from '../ns'

const en = fmt('en')
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

export default ns('landing', {
  // ── Hero ──────────────────────────────────────────────────────────────────────────────────
  /** The kicker above the headline (mono caps, one nowrap line with the date range after it): "Last 7 days" */
  lastDays: (days: number) => `Last ${days} ${en.plural(days, { one: 'day', other: 'days' })}`,
  /**
   * The kicker's date range: the report window in UTC, "1 → 8 NOV 2026 UTC", "29 OCT → 5 NOV 2026 UTC",
   * "29 DEC 2026 → 5 JAN 2027 UTC" (a month or year written once when both ends share it; days never zero-padded).
   * Mono caps, one nowrap line. Instants in ms; format them at timeZone 'UTC' (Intl's formatRange elides the same way:
   * dates.ts `dateFormat(locale, 'UTC', { day: 'numeric', month: 'short', year: 'numeric' }).formatRange(startMs, endMs)`).
   * Keep "UTC". English stores its months in capitals; yours can be sentence case (CSS uppercases).
   */
  windowRange: (startMs: number, endMs: number) => {
    const a = new Date(startMs)
    const b = new Date(endMs)
    const end = `${b.getUTCDate()} ${MONTHS[b.getUTCMonth()]} ${b.getUTCFullYear()}`
    const start =
      a.getUTCFullYear() !== b.getUTCFullYear()
        ? `${a.getUTCDate()} ${MONTHS[a.getUTCMonth()]} ${a.getUTCFullYear()}`
        : a.getUTCMonth() !== b.getUTCMonth()
          ? `${a.getUTCDate()} ${MONTHS[a.getUTCMonth()]}`
          : `${a.getUTCDate()}`
    return `${start} → ${end} UTC`
  },
  /**
   * The headline, one sentence set as display lines (each wipes in on its own, 60 ms apart): "Something / watched you /
   * this week." Split it into 2–4 short lines that read naturally in your language; the accent (the serif, in signal
   * orange) goes on the word that means "you", and nothing else. Keep the full stop. The share post ends with the same
   * sentence ("…this week too."), so keep them in step.
   */
  hero: [['Something'], ['watched ', accent('you')], ['this week.']] as Rich[],
  /**
   * Under the headline, 2–3 lines. `days` is the window (7); keep the number and its unit together (no-break space).
   * Plain text in pieces (English keeps the page's text nodes as they were); a translation can return one piece.
   */
  sub: (days: number): Rich => [
    'Enter any place on Earth. See every satellite that passed over it in the last ',
    String(days),
    `\u00a0${en.plural(days, { one: 'day', other: 'days' })}, and the actual pictures they took.`,
  ],
  /** The maker's credit under the chips; `handle` is "@armaangupt0" (a link) */
  builtBy: (handle: string) => `Built by ${handle}`,
  /**
   * After the credit, on the same mono caps line (laptops and wide tablets only): a link to the project's code on
   * GitHub, with a ↗ after it. Say that the project is open source, in the words your readers use for it; keep it
   * about as short as the English: the credit and this share one line, and the link is hidden where that line is
   * under 340 px, sized for the longest pair (Indonesian, 329 px; Landing.module.css `@container`)
   */
  sourceLink: 'Open source',
  /** Its accessible name: the words above, first and unchanged, then where the link goes ("GitHub" as it is) */
  sourceLinkLabel: 'Open source: the code on GitHub',

  // ── The place search ──────────────────────────────────────────────────────────────────────
  /** The empty field's prompt. Must fit beside the field's buttons on a 390 px phone (it ellipsises) */
  searchPlaceholder: 'Search a place',
  /** The field's label, after its decorative index: "01 / Place" (mono caps) */
  placeLabel: 'Place',
  /** Status, right of the label (mono caps, one line, ellipsised): a search is running */
  searching: 'Searching',
  /** Status: the geocoders did not answer */
  searchUnavailable: 'Search unavailable',
  /** Status: how many suggestions are listed */
  matches: (n: number) => `${en.int(n)} ${en.plural(n, { one: 'match', other: 'matches' })}`,
  /** Status: nothing matched */
  noMatch: 'No match',
  /** Status while the empty field has focus: what you can type */
  searchHint: 'Name, address or lat, lon',
  /** The clear (×) button (aria only) */
  clearSearch: 'Clear search',
  /** The go (→) button (aria only) */
  go: 'Show what passed over this place',
  /** In the list when the geocoders fail. Keep the example coordinates exactly as written: the field parses them */
  searchDown: 'The place search isn’t answering. Coordinates such as 43.47, −80.54 still work.',
  /** In the list when nothing matches; `query` is what was typed (in your language's quotation marks) */
  nothingMatches: (query: string) => `Nothing matches “${query}”. Try a city, a landmark, or coordinates.`,
  /** The suggestion list (aria only) */
  suggestions: 'Places',

  // ── Use my location ──────────────────────────────────────────────────────────────────────
  /** The locate button, in full (wide screens) and as its accessible name everywhere */
  useMyLocation: 'Use my location',
  /** The same button on phones: much shorter, it shares the search line with the input */
  locateMe: 'Locate me',
  /** The same on the narrowest phones (≤ 400 px), as the first chip of the example row */
  nearMe: 'Near me',
  /** That chip while locating (a second tap cancels); about as wide as "Near me" */
  locating: 'Locating…',
  /** Leaves the phone's search mode (the field lifted over the globe); a short button in the search line */
  cancelSearch: 'Cancel',
  /** Stops locating; a short button in the search line */
  cancelLocate: 'Cancel',
  /** Its accessible name */
  cancelLocating: 'Cancel locating',
  /** The field's status while locating (mono caps), before the elapsed seconds */
  requestingPosition: 'Requesting position',
  namingPlace: 'Naming the place',
  /** Elapsed seconds while locating, mono: "04 S" (`seconds` is fractional: round it) */
  elapsed: (seconds: number) => `${seconds.toFixed(0).padStart(2, '0')} S`,
  /** Under the field while locating */
  locatingNote: 'Your position goes to the Photon geocoder to name the place. We store only a ~10\u00a0km cell.',
  /** The label of the fault line when locating fails (mono caps), then one of locateErrors */
  locationLabel: 'Location',
  /** Closes that fault line (aria only) */
  dismiss: 'Dismiss',
  /** Why locating failed */
  locateErrors: {
    denied: 'Location access is blocked. Allow it in your browser settings, or search for a place.',
    unavailable: 'Your position isn’t available right now. Search for a place instead.',
    timeout: 'Finding your position took too long. Try again, or search for a place.',
    unsupported: 'This browser can’t share its location. Search for a place instead.',
    /** Keep "https" */
    insecure: 'Location needs a secure (https) connection. Search for a place instead.',
    /** Any other failure (the reverse geocoder, the network) */
    other: 'Your position isn’t available right now. Search for a place instead.',
  },

  // ── Examples ──────────────────────────────────────────────────────────────────────────────
  /** Leads the example chips: "02 / Or try" on wide screens, the first item of the chip row on phones (mono caps) */
  orTry: 'Or try',
  /** Right of "02 / Or try" once the globe is up (mouse only; ellipsised) */
  pinHint: 'Or click the globe to drop a pin',
  /** The chip row (aria only) */
  examplesLabel: 'Example places',
  /** A chip that drops a pin in the middle of the globe (touch screens) */
  dropPin: 'Drop a pin',
  /** An example chip's accessible name: the place's name, then where it is */
  chipName: (label: string, sublabel: string) => `${label}, ${sublabel}`,
  /** The chip that picks a famous place at random (mono caps, short) */
  surprise: 'Surprise me',
  /** Its accessible name */
  surpriseName: 'Surprise me: a famous place picked at random',
})
