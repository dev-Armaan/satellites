/**
 * German copy for the shared primitives (src/ui/system; see docs/i18n/de.md): the few words a component says itself.
 *
 * Why these forms: they are buttons' accessible names, so they take the infinitive with the object first and address
 * no one (§1.1, §7). `Schließen` is the glossary's close (§4.1). The bottom sheet's grip raises or lowers the panel,
 * so it is `Bereich ausklappen` / `Bereich einklappen`: the plain German words for a sheet that unfolds, where
 * *Panel* would be a needless Anglicism (§2.4). The ß stays ß; CSS and screen readers handle it (§6.5).
 */
import type en from '../en/system'
import { fmt } from '../../../api/_lib/i18n/format'

const f = fmt('de')

const system: typeof en = {
  close: 'Schließen',
  expandPanel: 'Bereich ausklappen',
  collapsePanel: 'Bereich einklappen',
  counter: (k: number, n: number, digits = 1) => [f.int(k).padStart(digits, '0'), ` / ${f.int(n).padStart(digits, '0')}`] as const,
}
export default system
