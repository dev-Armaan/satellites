/**
 * Vietnamese copy for the shared primitives (see docs/i18n/vi.md). Bare verbs, as every Vietnamese button is written
 * (§1.1): *Đóng*, and the bottom sheet's grip says what pressing it does, *Mở rộng* / *Thu gọn*, the pair Vietnamese
 * phone interfaces use for expand and collapse. A counter is *3 trên 12*, never a slash, which reads as a date here.
 */
import type en from '../en/system'
import { fmt } from '../../../api/_lib/i18n/format'

const f = fmt('vi')

const system: typeof en = {
  close: 'Đóng',
  expandPanel: 'Mở rộng bảng',
  collapsePanel: 'Thu gọn bảng',
  // «3 trên 12», never «3 / 12»: beside «20/12/2017» a slash between two small numbers reads as a date (d/m), and a
  // zero-padded «03» more so (§3.8). *trên* is how Vietnamese says "out of" (*8 trên 10 điểm*); the spaces never break.
  counter: (k: number, n: number) => [f.int(k), `\u00a0trên\u00a0${f.int(n)}`] as const,
}
export default system
