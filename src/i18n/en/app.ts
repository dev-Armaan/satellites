/**
 * English copy for the app's own words (src/app): the fault notice that replaces a search that failed, the progress
 * lines the controller writes before the engine speaks, and the browser tab's title.
 *
 * Why the fault sentences live here and the store keeps only a ref to them: store.error is a MessageRef
 * ('app.faults.catalog': CATALOG_FAULT / COMPUTE_FAULT in src/app/messageRefs.ts, whose englishOf gives the stats
 * their text), rendered by ErrorNotice in the visitor's language at render time, so a notice that is up follows a
 * language switch. The usage stats log the ENGLISH sentence of the same ref, read from this
 * object directly (never through msgs()): the admin page tells faults apart by their wording ("Could not load the orbit
 * catalog" is said only for the catalog loader's own failure, CLAUDE.md), and that wording must not change with the
 * reader's language. Changing an English sentence here changes what the stats record.
 */
import { ns } from '../ns'

export default ns('app', {
  /**
   * The landing's title in the browser tab (also history, bookmarks and, in English, the search result): the brand, a
   * middle dot, then one line. Tabs cut it after ~25–30 characters, so the brand comes first. "Watched" is the brand:
   * never translated. The English line says what the site does, in the words people search with ("satellite"): it is
   * index.html's own title, word for word (crawlers and link previews read that; src/lib/placePage.ts HOME_TITLE).
   * Every other language keeps the landing's hero line without its full stop. src/app/head.ts sets it, and a place's
   * title while one is on screen.
   */
  documentTitle: 'Watched · See every satellite that passed over you this week',

  /**
   * The fault notice (a search or the orbit catalog failed): a card over the globe, bottom left (420 px wide; full
   * width on phones), with a label, one message and two buttons. Screen readers hear the label, then the message
   * (role="alert").
   */
  notice: {
    /** The card's mono label over the message (uppercase by CSS): an instrument panel's word for a failure, terse and technical, not "Error!". One short word. */
    label: 'Fault',
    /** The message when the app gave no reason (should not happen). */
    fallback: 'Something went wrong.',
    /** The primary button: runs the search again (or asks for the catalog again). On phones each button is half of a ~343 px card. */
    tryAgain: 'Try again',
    /** The same button while that retry runs (disabled): a progressive verb and an ellipsis (…). Same width budget. */
    trying: 'Trying…',
    /** The secondary button: back to the start page (the landing). Text only, no arrow. */
    back: 'Back',
  },

  /** The fault notice's message: what failed, then what to do. Body text, wraps in the card. */
  faults: {
    /** The orbit catalog (every satellite's orbital elements) could not be downloaded, after three tries. */
    catalog: 'Could not load the orbit catalog. Check your connection and try again.',
    /** Anything else failed while the week's passes over the searched place were being computed. */
    compute: 'Something went wrong computing passes for this place. Try again in a moment.',
  },

  /**
   * Progress lines the controller writes into the computing readout (the engine writes the rest). store.progress holds
   * them as refs ('app.progress.catalog', src/app/messageRefs.ts) beside the engine's ('engine.progress.*'), so
   * whatever renders store.progress resolves both namespaces: refText(message, { engine: enEngine, app: enApp }).
   */
  progress: {
    /**
     * The readout's first row while the search starts, until the engine's own catalog line replaces it (a moment
     * later). Mono, uppercase by CSS, one line beside the row's number, duration and status, cut with an ellipsis.
     * "Orbital elements" are the numbers that describe each satellite's orbit.
     */
    catalog: 'Loading orbital elements',
    /** Written when the report is complete. Not shown on screen today (the readout announces its own words). */
    done: 'Report ready',
  },
})
