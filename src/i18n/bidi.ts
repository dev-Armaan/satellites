/**
 * Isolating left-to-right runs inside Arabic and Persian copy. Both catalogs build plain strings for the DOM, where a
 * Latin label (a place, a zone, a satellite) or a coordinate pair next to right-to-left words is reordered by the bidi
 * algorithm («23.5000°N 12.5000°E» read «N 12.5000°E°23.5000»). One test for "is this already right to left" serves
 * both languages: the whole Arabic script (\p{Script=Arabic}: the base block, its supplements and extensions, and the
 * presentation forms a pasted name can carry), not only U+0600–06FF, or a Persian or Urdu name written with letters
 * outside that block would be isolated as if it were Latin.
 */

/** U+2066 LEFT-TO-RIGHT ISOLATE … U+2069 POP DIRECTIONAL ISOLATE: one left-to-right run in a DOM-only string */
export const ltr = (s: string) => `⁦${s}⁩`

/** Holds Arabic-script letters, or an isolate already (then the string places itself). */
const RTL_OR_ISOLATED = /[\p{Script=Arabic}⁦-⁩]/u

/** Isolate a Latin label (a zone, a place), but leave one with Arabic-script words or isolates of its own as it is. */
export const isoUnlessRtl = (s: string) => (RTL_OR_ISOLATED.test(s) ? s : ltr(s))
