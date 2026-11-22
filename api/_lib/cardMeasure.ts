/**
 * How wide the share card's headline text is, in the faces the three renderers set it in, and where they may break it.
 *
 * Why: the headline's size was chosen from counts of letters and lines, which cannot see that one word no renderer
 * breaks is wider than the 466 px column («Visakhapatnam.» is 527 px at 84 px; «Thiruvananthapuram तक» 163 px over at
 * 62). The browser, the canvas and satori all set such a word on its own line and let it run out of the card. With
 * real advance widths (cardWidths.gen.ts, measured from the card's own font files by scripts/build-card-widths.ts) the
 * sizing passes over a size at which a piece would not fit, and leaves every card whose pieces fit as it was.
 *
 * The numbers err wide, never narrow: Latin, Cyrillic and Vietnamese are the faces' advances and kerning (a pair the
 * table leaves out is kerned by less than 0.01 em); Arabic and Devanagari are rebuilt from their letters' forms in the widest of the renderers' faces (satori's);
 * Han, kana and hangul are a full em; any other script 0.6 em a letter.
 *
 * The pieces are what no renderer breaks: words between breaking spaces (a no-break space ties its words), split after
 * a hyphen only where all three break, between a letter or digit and a letter (Unicode's line breaking keeps «-80» and
 * «2-02A» whole, so satori and the browser do, and the canvas's wrap breaks nowhere else), and between characters of
 * Chinese and Japanese.
 */
import { ARABIC_FROM, ARABIC_WIDTHS, DEVANAGARI_FROM, DEVANAGARI_WIDTHS, KERNING, WIDTHS, WIDTH_RANGES } from './cardWidths.gen.js'
import type { Locale } from './i18n/locales.js'

/** The headline's two faces: the condensed display (its text parts) and the serif italic (its accent, the place). */
export type HeadRole = 'display' | 'serif'

const em = (table: string, i: number): number | undefined => {
  const s = table.slice(i * 2, i * 2 + 2)
  return s === '--' || s.length < 2 ? undefined : parseInt(s, 36) / 1000
}

/** A Latin, Cyrillic or Vietnamese code point's index in WIDTHS' tables, or -1. */
function latinIndex(cp: number): number {
  let off = 0
  for (const [a, z] of WIDTH_RANGES) {
    if (cp >= a && cp <= z) return off + cp - a
    off += z - a + 1
  }
  return -1
}

const MARK = /\p{M}/u
const ARABIC = /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]/
const DEVANAGARI = /[\u0900-\u097f]/
const CONSONANT = /[\u0915-\u0939\u0958-\u095f\u0978-\u097f]/
const VIRAMA = '\u094d'
const NUKTA = '\u093c'
/** Full-width: Han, kana, hangul, CJK punctuation (as cjkEm in cardSpec.ts). */
const WIDE = /[\u1100-\u11ff\u2e80-\u9fff\uac00-\ud7af\uf900-\ufaff\uff00-\uffef]/
/** Spaces a renderer draws as a space (cardSpaces turns U+202F and U+2009 into U+00A0 on every card). */
const SPACE_LIKE = /[\u2007\u2009\u202f]/

/** One Latin-table character, in the stack a card in `locale` sets it in: the Vietnamese cut first on a Vietnamese card. */
function latinEm(cp: number, role: HeadRole, locale: Locale): number | undefined {
  const i = latinIndex(cp)
  if (i < 0) return undefined
  const t = WIDTHS[role]
  return locale === 'vi' ? (em(t.vi, i) ?? em(t.brand, i)) : (em(t.brand, i) ?? em(t.vi, i))
}

const kernMaps = new Map<string, Map<string, number>>()

/** The kerning of the pair `ab` in the stack a card in `locale` sets Latin in, in em (0 for a pair not kerned). */
function kern(a: string, b: string, role: HeadRole, locale: Locale): number {
  const stack = locale === 'vi' ? 'vi' : 'brand'
  const id = `${role}:${stack}`
  let map = kernMaps.get(id)
  if (!map) {
    map = new Map()
    const t = KERNING[role][stack]
    for (let i = 0; i + 4 <= t.length; i += 4) map.set(t.slice(i, i + 2), (parseInt(t.slice(i + 2, i + 4), 36) - 648) / 1000)
    kernMaps.set(id, map)
  }
  return map.get(a + b) ?? 0
}

/** An Arabic run's width: each letter in the form its neighbours give it. */
function arabicEm(chars: string[], role: HeadRole): number {
  const { forms, dual } = ARABIC_WIDTHS[role]
  const joinsNext = (ch: string | undefined) => !!ch && dual.includes(ch)
  const letter = (ch: string | undefined) => !!ch && !MARK.test(ch) && ARABIC.test(ch) && ch !== '\u200c'
  let w = 0
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]
    if (MARK.test(ch) || ch === '\u200c' || ch === '\u200d') continue
    const k = ch.codePointAt(0)! - ARABIC_FROM
    if (k < 0 || k * 8 >= forms.length) {
      w += 0.6
      continue
    }
    let p = i - 1
    while (p >= 0 && MARK.test(chars[p])) p--
    let n = i + 1
    while (n < chars.length && MARK.test(chars[n])) n++
    const joinPrev = letter(chars[p]) && joinsNext(chars[p])
    const joinNext = letter(chars[n]) && joinsNext(ch)
    const form = joinPrev ? (joinNext ? 2 : 3) : joinNext ? 1 : 0
    w += em(forms, k * 4 + form) ?? em(forms, k * 4) ?? 0.6
  }
  return w
}

/** A Devanagari run's width: half forms before a virama and a consonant, a reph or a rakar adding nothing, रु and रू. */
function devanagariEm(chars: string[], role: HeadRole): number {
  const { base, half, ru } = DEVANAGARI_WIDTHS[role]
  const at = (ch: string) => ch.codePointAt(0)! - DEVANAGARI_FROM
  let w = 0
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]
    if (CONSONANT.test(ch)) {
      let v = i + 1
      if (chars[v] === NUKTA) v++
      const next = chars[v + 1]
      if (chars[v] === VIRAMA && next && CONSONANT.test(next)) {
        // र् before a consonant is the reph, a mark over it; ्र after one is the rakar, a stroke on it
        const reph = ch === '\u0930' && (i === 0 || chars[i - 1] !== VIRAMA)
        if (next === '\u0930') w += em(base, at(ch)) ?? 0.5
        else if (!reph) w += em(half, at(ch)) ?? em(base, at(ch)) ?? 0.5
        i = next === '\u0930' ? v + 1 : v
        continue
      }
      if (ch === '\u0930' && (chars[i + 1] === '\u0941' || chars[i + 1] === '\u0942')) {
        w += (em(base, at(ch)) ?? 0.5) + (em(ru, chars[i + 1] === '\u0941' ? 0 : 1) ?? 0)
        i++
        continue
      }
    }
    w += em(base, at(ch)) ?? (MARK.test(ch) ? 0 : 0.5)
  }
  return w
}

/**
 * The width of `text` in em in a headline face, tracking aside: each run of one script measured as that script is
 * (see the top of this file).
 */
export function textEm(text: string, role: HeadRole, locale: Locale): number {
  const chars = Array.from(text)
  let w = 0
  let prev = ''
  for (let i = 0; i < chars.length; ) {
    const ch = chars[i]
    if (ARABIC.test(ch) || DEVANAGARI.test(ch)) {
      prev = ''
      const script = ARABIC.test(ch) ? ARABIC : DEVANAGARI
      let j = i + 1
      // a run of the script and the marks and joiners inside it
      while (j < chars.length && (script.test(chars[j]) || MARK.test(chars[j]) || chars[j] === '\u200c' || chars[j] === '\u200d')) j++
      w += script === ARABIC ? arabicEm(chars.slice(i, j), role) : devanagariEm(chars.slice(i, j), role)
      i = j
      continue
    }
    const cp = (SPACE_LIKE.test(ch) ? '\u00a0' : ch).codePointAt(0)!
    w += latinEm(cp, role, locale) ?? (MARK.test(ch) || ch === '\u200c' || ch === '\u200d' ? 0 : WIDE.test(ch) ? 1 : 0.6)
    if (prev) w += kern(prev, ch, role, locale)
    prev = ch
    i++
  }
  return w
}

/** Shaped scripts take no tracking in any renderer (cardSpec.ts needsShaping): the same test, here for the width. */
const UNTRACKED = /[\u0590-\u08ff\u0900-\u0dff\u0e00-\u0fff\u1000-\u109f\u1780-\u17ff\ufb1d-\ufdff\ufe70-\ufeff]/

/** The width of `text` in px at `size`, with the face's tracking (`track` em after every character) unless it is shaped. */
export function textPx(text: string, role: HeadRole, size: number, track: number, locale: Locale): number {
  const n = Array.from(text).length
  return textEm(text, role, locale) * size + (UNTRACKED.test(text) ? 0 : track * size * n)
}

/** Han and kana: a line may break between any two (the canvas breaks between words, which only makes its pieces shorter). */
const BREAK_ANYWHERE = /[\u2e80-\u2fff\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/

/** The pieces of `text` no renderer breaks inside (see the top of this file). */
export function unbreakable(text: string): string[] {
  const out: string[] = []
  for (const word of text.split(/[^\S\u00a0\u2007\u2009\u202f]+/)) {
    let piece = ''
    const chars = Array.from(word)
    chars.forEach((ch, i) => {
      if (BREAK_ANYWHERE.test(ch)) {
        if (piece) out.push(piece)
        out.push(ch)
        piece = ''
        return
      }
      piece += ch
      if (ch === '-' && i > 0 && /[\p{L}\p{N}]/u.test(chars[i - 1]) && piece.length > 1 && i + 1 < chars.length && /\p{L}/u.test(chars[i + 1])) {
        out.push(piece)
        piece = ''
      }
    })
    if (piece) out.push(piece)
  }
  return out
}

/** The widest piece of `text` no renderer breaks, in px (see textPx). */
export function widestPiecePx(text: string, role: HeadRole, size: number, track: number, locale: Locale): number {
  return Math.max(0, ...unbreakable(text).map((p) => textPx(p, role, size, track, locale)))
}
