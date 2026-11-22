/**
 * Traditional Chinese copy for the shared primitives (see docs/i18n/zh-Hant.md §1.1, §4.1, Appendix A): a close
 * button's default name and the bottom sheet's grip. Controls are verb + object, two to four Han, with no 請 and no
 * pronoun; "collapse" is 收起, the form both Taiwan and Hong Kong read (§1.4).
 */
import type en from '../en/system'
import { fmt } from '../../../api/_lib/i18n/format'

const f = fmt('zh-Hant')

const system: typeof en = {
  close: '關閉',
  expandPanel: '展開面板',
  collapsePanel: '收起面板',
  counter: (k: number, n: number, digits = 1) => [f.int(k).padStart(digits, '0'), ` / ${f.int(n).padStart(digits, '0')}`] as const,
}
export default system
