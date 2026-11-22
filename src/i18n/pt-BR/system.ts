/**
 * Brazilian Portuguese copy for the shared primitives (see docs/i18n/pt-BR.md §1.1, §4.2): the few words a component
 * says itself. They are actions, so they are infinitives with no pronoun (*Fechar*, *Expandir painel*), the pt-BR
 * platform convention that addresses no one. *Recolher* is the word Brazilian and Portuguese interfaces both use for a
 * panel that folds away.
 */
import type en from '../en/system'
import { fmt } from '../../../api/_lib/i18n/format'

const f = fmt('pt-BR')

const system: typeof en = {
  close: 'Fechar',
  expandPanel: 'Expandir painel',
  collapsePanel: 'Recolher painel',
  counter: (k: number, n: number, digits = 1) => [f.int(k).padStart(digits, '0'), ` / ${f.int(n).padStart(digits, '0')}`] as const,
}
export default system
