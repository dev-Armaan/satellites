/**
 * English copy for the shared primitives (src/ui/system): the few words a component says itself rather than taking
 * from its caller (the bottom sheet's grip, a close button's default name). Everything else a primitive shows is
 * passed in by the screen that uses it, from that screen's namespace.
 */
import { ns } from '../ns'
import { fmt } from '../../../api/_lib/i18n/format'

const en = fmt('en')

export default ns('system', {
  /** A panel's close (×) button: its accessible name and hover tooltip, unless the panel names it */
  close: 'Close',
  /** The phone bottom sheet's grip (aria only): pressing it raises the sheet to its next height */
  expandPanel: 'Expand panel',
  /** The same grip once the sheet is at its full height: pressing it lowers the sheet */
  collapsePanel: 'Collapse panel',
  /**
   * Every visual "k / n" counter (the gallery and the photo viewer, the pass pager, the time-lapse's frame badge and
   * its waiting screen): `[lead, tail]`, so a narrow view can drop the tail and a style can set the lead apart. `digits`
   * is the shortest a number is written (the time-lapse's "03 / 12"); a language may ignore it. It is one formatter
   * because the form is the language's, not the screen's: where "3 / 12" reads as a date (Vietnamese, docs/i18n/vi.md
   * §3.8), every counter changes at once. What a screen reader hears is said in words by each screen's own copy.
   * The split assumes k comes first, as it does in all 20 languages; a total-first language would need a new shape.
   */
  counter: (k: number, n: number, digits = 1): readonly [string, string] => [
    en.int(k).padStart(digits, '0'),
    ` / ${en.int(n).padStart(digits, '0')}`,
  ],
})
