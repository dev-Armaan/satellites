/**
 * Arabic copy for the shared primitives (see docs/i18n/ar.md §3.7 "Small namespaces"): the few words a component says
 * itself.
 *
 * Why masdars: a button's name in Arabic is a verbal noun («إغلاق», «توسيع اللوحة»), which addresses no one; an
 * imperative would be gendered (ar.md §1.2). "Close" is «إغلاق» here as everywhere in the product, never «تجاهل».
 */
import type en from '../en/system'
import { fmt } from '../../../api/_lib/i18n/format'

const f = fmt('ar')

const system: typeof en = {
  close: 'إغلاق',
  expandPanel: 'توسيع اللوحة',
  collapsePanel: 'طي اللوحة',
  counter: (k: number, n: number, digits = 1) => [f.int(k).padStart(digits, '0'), ` / ${f.int(n).padStart(digits, '0')}`] as const,
}
export default system
