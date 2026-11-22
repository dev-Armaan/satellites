/**
 * Isolating left-to-right runs inside Arabic and Persian copy. Both catalogs build plain strings for the DOM, where a
 * Latin label (a place, a zone, a satellite) or a coordinate pair next to right-to-left words is reordered by the bidi
 * algorithm («23.5000°N 12.5000°E» read «N 12.5000°E°23.5000»). One test for "is this already right to left" serves
 * both languages: the whole Arabic script (\p{Script=Arabic}: the base block, its supplements and extensions, and the
 * presentation forms a pasted name can carry), not only U+0600–06FF, or a Persian or Urdu name written with letters
 * outside that block would be isolated as if it were Latin.
 */

/** U+2066 LEFT-TO-RIGHT ISOLATE … U+2069 POP DIRECTIONAL ISOLATE: one left-to-right run in a DOM-only string */
export const ltr = (s: string) => `\u2066${s}\u2069`

/** Holds Arabic-script letters, or an isolate already (then the string places itself). */
const RTL_OR_ISOLATED = /[\p{Script=Arabic}\u2066-\u2069]/u

/** Isolate a Latin label (a zone, a place), but leave one with Arabic-script words or isolates of its own as it is. */
export const isoUnlessRtl = (s: string) => (RTL_OR_ISOLATED.test(s) ? s : ltr(s))

/**
 * A stamp or a zone kept on one line ("2026-11-19 07:34Z", "Africa/Niamey", "America/Port of Spain"). An isolate keeps
 * its run's order but not its line: Chrome broke «2026-» from «11-19 07:34Z», and the two halves then read in the
 * wrong order across the lines. No-break spaces, and a word joiner (U+2060) after each hyphen and slash.
 */
export const whole = (s: string) => s.replace(/[-/]/g, '$&\u2060').replace(/ /g, '\u00a0')

const RTL_LETTER = /[\p{Script=Arabic}\p{Script=Hebrew}]/u
const LETTER = /\p{L}/u
/** Arabic-Indic and Persian digits */
const RTL_DIGIT = /[\u0660-\u0669\u06f0-\u06f9]/
/**
 * The direction a query typed on a right-to-left page reads in. Its first strong letter decides, as dir="auto" would
 * ("Paris", "القاهرة", "12 خیابان"). With no letter, its digits decide, where dir="auto" would say left to right
 * for every number: ASCII digits read left to right («12.500, 23.500»), Persian and Arabic-Indic ones («۴۳٫۴۷، ۸۰٫۵۴»)
 * right to left, as a Persian reader typed them. Empty, right to left, so the placeholder reads as the page does.
 */
export function queryDir(value: string): 'ltr' | 'rtl' {
  for (const c of value) {
    if (RTL_LETTER.test(c)) return 'rtl'
    if (LETTER.test(c)) return 'ltr'
  }
  for (const c of value) {
    if (RTL_DIGIT.test(c)) return 'rtl'
    if (c >= '0' && c <= '9') return 'ltr'
  }
  return 'rtl'
}
