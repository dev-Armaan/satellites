/**
 * Vietnamese copy for the shared primitives (see docs/i18n/vi.md). Bare verbs, as every Vietnamese button is written
 * (§1.1): *Đóng*, and the bottom sheet's grip says what pressing it does, *Mở rộng* / *Thu gọn*, the pair Vietnamese
 * phone interfaces use for expand and collapse.
 */
import type en from '../en/system'
import { fmt } from '../../../api/_lib/i18n/format'

const f = fmt('vi')

const system: typeof en = {
  close: 'Đóng',
  expandPanel: 'Mở rộng bảng',
  collapsePanel: 'Thu gọn bảng',
  counter: (k: number, n: number, digits = 1) => [f.int(k).padStart(digits, '0'), ` / ${f.int(n).padStart(digits, '0')}`] as const,
}
export default system
