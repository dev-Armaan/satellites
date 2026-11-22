/**
 * Russian copy for the shared primitives (see docs/i18n/ru.md §1.3): the few words a component says itself. Buttons
 * and their accessible names are infinitives, which address no one («Закрыть», «Развернуть панель»).
 */
import type en from '../en/system'
import { fmt } from '../../../api/_lib/i18n/format'

const f = fmt('ru')

const system: typeof en = {
  close: 'Закрыть',
  expandPanel: 'Развернуть панель',
  collapsePanel: 'Свернуть панель',
  counter: (k: number, n: number, digits = 1) => [f.int(k).padStart(digits, '0'), ` / ${f.int(n).padStart(digits, '0')}`] as const,
}
export default system
