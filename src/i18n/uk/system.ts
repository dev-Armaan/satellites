/**
 * Ukrainian copy for the shared primitives (see docs/i18n/uk.md): the few words a component says itself. Buttons and
 * their accessible names are infinitives, which address no one («Закрити», «Розгорнути панель»).
 */
import type en from '../en/system'
import { fmt } from '../../../api/_lib/i18n/format'

const f = fmt('uk')

const system: typeof en = {
  close: 'Закрити',
  expandPanel: 'Розгорнути панель',
  collapsePanel: 'Згорнути панель',
  counter: (k: number, n: number, digits = 1) => [f.int(k).padStart(digits, '0'), ` / ${f.int(n).padStart(digits, '0')}`] as const,
}
export default system
