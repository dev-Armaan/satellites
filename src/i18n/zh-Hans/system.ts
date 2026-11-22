/**
 * Simplified Chinese copy for the shared primitives (see docs/i18n/zh-Hans.md §1.1, §4.1): a close button's default
 * name and the bottom sheet's grip. Controls are verb + object, two to four Han, with no 请 and no pronoun.
 */
import type en from '../en/system'
import { fmt } from '../../../api/_lib/i18n/format'

const f = fmt('zh-Hans')

const system: typeof en = {
  close: '关闭',
  expandPanel: '展开面板',
  collapsePanel: '收起面板',
  counter: (k: number, n: number, digits = 1) => [f.int(k).padStart(digits, '0'), ` / ${f.int(n).padStart(digits, '0')}`] as const,
}
export default system
