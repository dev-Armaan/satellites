/**
 * Spanish copy for the shared primitives (see docs/i18n/es.md §1, §4): the few words a component says itself. They are
 * actions, so they are infinitives (*Cerrar*, *Expandir panel*), the platform convention that addresses no one.
 */
import type en from '../en/system'
import { fmt } from '../../../api/_lib/i18n/format'

const f = fmt('es')

const system: typeof en = {
  close: 'Cerrar',
  expandPanel: 'Expandir panel',
  collapsePanel: 'Contraer panel',
  counter: (k: number, n: number, digits = 1) => [f.int(k).padStart(digits, '0'), ` / ${f.int(n).padStart(digits, '0')}`] as const,
}
export default system
