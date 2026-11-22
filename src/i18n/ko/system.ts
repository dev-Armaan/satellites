/**
 * Korean copy for the shared primitives (see docs/i18n/ko.md §1.1, §3.7): the few words a component says itself.
 *
 * Why it reads this way: these are buttons and aria names, so they are nouns with no ending (닫기, 펼치기, 접기), object
 * first, as Korean system UI writes them. 펼치다 / 접다 are the pair a Korean reader expects for a panel that opens and
 * folds away.
 */
import type en from '../en/system'
import { fmt } from '../../../api/_lib/i18n/format'

const f = fmt('ko')

const system: typeof en = {
  close: '닫기',
  expandPanel: '패널 펼치기',
  collapsePanel: '패널 접기',
  counter: (k: number, n: number, digits = 1) => [f.int(k).padStart(digits, '0'), ` / ${f.int(n).padStart(digits, '0')}`] as const,
}
export default system
