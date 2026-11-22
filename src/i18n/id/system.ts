/**
 * Indonesian copy for the shared primitives (see docs/i18n/id.md). Base-form imperatives, as every Indonesian button
 * is written (§1.1): *Tutup*, and the bottom sheet's grip says what pressing it does, *Luaskan* / *Ciutkan*, the pair
 * Indonesian phone interfaces use for expand and collapse.
 */
import type en from '../en/system'
import { fmt } from '../../../api/_lib/i18n/format'

const f = fmt('id')

const system: typeof en = {
  close: 'Tutup',
  expandPanel: 'Luaskan panel',
  collapsePanel: 'Ciutkan panel',
  counter: (k: number, n: number, digits = 1) => [f.int(k).padStart(digits, '0'), ` / ${f.int(n).padStart(digits, '0')}`] as const,
}
export default system
