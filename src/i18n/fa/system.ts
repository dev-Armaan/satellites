/**
 * Persian copy for the shared primitives (see docs/i18n/fa.md §1.2): the few words a component says itself.
 *
 * Why these words: buttons are nouns or verbal nouns, the form Persian interfaces use for an action («بستن», never an
 * imperative to the reader). The grip opens and folds the panel: «باز کردن» / «جمع کردن», the everyday pair.
 */
import type en from '../en/system'
import { fmt } from '../../../api/_lib/i18n/format'

const f = fmt('fa')

const system: typeof en = {
  close: 'بستن',
  expandPanel: 'باز کردن پنل',
  collapsePanel: 'جمع کردن پنل',
  counter: (k: number, n: number, digits = 1) => [f.int(k).padStart(digits, '0'), ` / ${f.int(n).padStart(digits, '0')}`] as const,
}
export default system
