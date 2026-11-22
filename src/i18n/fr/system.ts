/**
 * French copy for the shared primitives (src/ui/system; see docs/i18n/fr.md §1.1): the few words a component says
 * itself rather than taking from its caller.
 *
 * Why infinitives: these are a button's accessible names, and French UI names an action in the infinitive («Fermer»,
 * «Agrandir»), never the imperative, which reads like an advert. «Agrandir» / «Réduire» are the words French systems
 * already use for a panel that grows and shrinks.
 */
import type en from '../en/system'
import { fmt } from '../../../api/_lib/i18n/format'

const f = fmt('fr')

const system: typeof en = {
  close: 'Fermer',
  expandPanel: 'Agrandir le panneau',
  collapsePanel: 'Réduire le panneau',
  counter: (k: number, n: number, digits = 1) => [f.int(k).padStart(digits, '0'), ` / ${f.int(n).padStart(digits, '0')}`] as const,
}
export default system
