/**
 * Turkish copy for the shared primitives (src/ui/system; see docs/i18n/tr.md §3.10): the few words a component says
 * itself.
 *
 * Why these forms: they are buttons' accessible names, so each is a bare imperative stem with its object first (§1.3),
 * never a *-ma/-me* verbal noun, which would read as a negative command. `Kapat` is the glossary's close (§4). The
 * phone sheet's grip raises or lowers the panel: `Paneli genişlet` / `Paneli daralt`, the panel in the accusative
 * because it is a fixed word, not a runtime slot.
 */
import type en from '../en/system'
import { fmt } from '../../../api/_lib/i18n/format'

const f = fmt('tr')

const system: typeof en = {
  close: 'Kapat',
  expandPanel: 'Paneli genişlet',
  collapsePanel: 'Paneli daralt',
  counter: (k: number, n: number, digits = 1) => [f.int(k).padStart(digits, '0'), ` / ${f.int(n).padStart(digits, '0')}`] as const,
}
export default system
