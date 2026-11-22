/**
 * Polish copy for the shared primitives (src/ui/system; see docs/i18n/pl.md §3.9): the few words a component says
 * itself. Buttons are the 2nd-person perfective imperative, as the OS says them («Zamknij», «Rozwiń», «Zwiń»), never
 * the older infinitive.
 */
import type en from '../en/system'
import { fmt } from '../../../api/_lib/i18n/format'

const f = fmt('pl')

const system: typeof en = {
  close: 'Zamknij',
  expandPanel: 'Rozwiń panel',
  collapsePanel: 'Zwiń panel',
  counter: (k: number, n: number, digits = 1) => [f.int(k).padStart(digits, '0'), ` / ${f.int(n).padStart(digits, '0')}`] as const,
}
export default system
