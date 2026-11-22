/**
 * Dutch copy for the shared primitives (src/ui/system; see docs/i18n/nl.md §1, §3.7): the few words a component says
 * itself rather than taking from its caller.
 *
 * Why infinitives: these are a button's accessible names, and a Dutch button names an action in the infinitive with no
 * pronoun (`Sluiten`), never an order to the reader. `Paneel vergroten` / `Paneel verkleinen` are the guide's words for
 * the bottom sheet's grip, object first, as Dutch infinitive phrases put it.
 */
import type en from '../en/system'
import { fmt } from '../../../api/_lib/i18n/format'

const f = fmt('nl')

const system: typeof en = {
  close: 'Sluiten',
  expandPanel: 'Paneel vergroten',
  collapsePanel: 'Paneel verkleinen',
  counter: (k: number, n: number, digits = 1) => [f.int(k).padStart(digits, '0'), ` / ${f.int(n).padStart(digits, '0')}`] as const,
}
export default system
