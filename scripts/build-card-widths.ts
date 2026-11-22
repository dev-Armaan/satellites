/**
 * Write api/_lib/cardWidths.gen.ts: the advance widths of the share card's headline faces, so the headline's size can
 * see a word that is wider than the column (cardSpec.ts headlineFits) before any renderer sets it.
 *
 * Why measured rather than estimated: a count of letters cannot tell «Visakhapatnam.» (6.06 em in the serif italic,
 * 74 px past the column at 84 px) from «Johannesburg.» that fits, nor a name in capitals (PROTOMETHEE, 0.47 em a letter
 * in the condensed display) from one in small letters (0.37). The faces are the very files satori draws with
 * (api/_fonts, built by scripts/backend-fonts.py), the static instances of the variable fonts the page and the canvas
 * draw with, size-adjust baked in, so the three renderers' advances are these numbers (kerning only narrows a word).
 *
 * Each role (display, serif) has two Latin tables: the brand stack (Instrument's latin, then latin-ext, then the Cyrillic
 * cut) and the Vietnamese cut, which a Vietnamese card asks first and any other card last (api/_lib/fonts.ts), over the
 * ranges below (Latin, Latin Extended-A, the Romanian commas, Cyrillic, Vietnamese, the punctuation a place name or a
 * sentence holds).
 *
 * Each also has its kerning between the letters, digits and punctuation a name holds (KERN_LATIN, KERN_CYRILLIC), so a
 * word in capitals measures what it sets: without it «ISS (ZARYA)» counted 4 % wide and «HYPERSPECTRAL» 470 px where
 * every renderer sets 462, and a pair kerned apart (the serif's up to +0.07 em) would have counted narrow.
 *
 * Arabic and Devanagari are shaped: a letter's width depends on its neighbours, so each gets what cardMeasure.ts needs
 * to rebuild a word's width from its letters. Arabic: each letter's four forms (isolated, initial, medial, final, each
 * measured between zero-width joiners) and whether it joins the letter after it; summed so, the card's words come within
 * 0 to 11 % of HarfBuzz's own width, never under it (2026-11-22). Devanagari: each code point alone (a vowel sign after
 * क, less क), each consonant's half form (before a virama and another consonant) and र's ligatures with ु and ू; within
 * −8 % to +50 % (a conjunct ligature such as क्ष is narrower than its halves). Their files are the ones satori draws
 * with, the widest of the three renderers: Noto Sans Arabic at 600 for the display and 400 for the serif (the page and
 * the canvas set Arabic in Noto Sans Arabic condensed and in Amiri, both narrower), and the Devanagari instances
 * fallbackFonts.ts asks Google Fonts for (the page's are lighter). Widths are thousandths of an em, two base-36 digits
 * each, `--` where a face has no glyph. Han, kana and hangul are a full em (cardMeasure.ts).
 *
 *   npx tsx scripts/build-card-widths.ts        (needs the network: the Arabic and Devanagari files come from Google)
 */
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const FONTS = path.join(ROOT, 'api', '_fonts')
const OUT = path.join(ROOT, 'api', '_lib', 'cardWidths.gen.ts')

/** The code point ranges the tables cover, inclusive. Keep in step with WIDTH_RANGES in the generated file. */
const RANGES: [number, number][] = [
  [0x20, 0x17f],
  [0x218, 0x21b],
  [0x400, 0x4ff],
  [0x1ea0, 0x1ef9],
  [0x2010, 0x2027],
]

/** Arabic letters and signs (U+060C … U+06FF) and Devanagari (U+0900 … U+097F). */
const ARABIC: [number, number] = [0x60c, 0x6ff]
const DEVANAGARI: [number, number] = [0x900, 0x97f]
const ZWJ = '\u200d'

interface HbFont {
  has(cp: number): boolean
  /** Advance of `text` shaped, in em */
  width(text: string): number
  /** Glyph ids of `text` shaped */
  glyphs(text: string): number[]
  advance(cp: number): number | undefined
}

function hbFont(hb: any, data: Uint8Array): HbFont {
  const face = hb.createFace(hb.createBlob(data), 0)
  const font = hb.createFont(face)
  const upem = face.upem
  const covered = new Set<number>(face.collectUnicodes())
  const shape = (text: string) => {
    const buf = hb.createBuffer()
    buf.addText(text)
    buf.guessSegmentProperties()
    hb.shape(font, buf)
    const glyphs = buf.json() as { g: number; ax: number }[]
    buf.destroy()
    return glyphs
  }
  const width = (text: string) => shape(text).reduce((a, g) => a + g.ax, 0) / upem
  return {
    has: (cp) => covered.has(cp),
    width,
    glyphs: (text) => shape(text).map((g) => g.g),
    advance: (cp) => (covered.has(cp) ? width(String.fromCodePoint(cp)) : undefined),
  }
}

const openFont = async (hb: any, file: string) => hbFont(hb, readFileSync(path.join(FONTS, file)))

/** An old Safari: Google Fonts then answers TrueType (as fallbackFonts.ts asks). */
const TTF_USER_AGENT =
  'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1'

/** A whole Google Fonts family at one instance (`axes` in the style sheet's syntax, "wdth,wght@75,600"). */
async function googleFont(hb: any, family: string, axes: string): Promise<HbFont> {
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:${axes}`, { headers: { 'user-agent': TTF_USER_AGENT } })).text()
  const src = /src: url\((.+?)\) format\('(?:opentype|truetype)'\)/.exec(css)?.[1]
  if (!src) throw new Error(`no TrueType file for ${family} ${axes}`)
  return hbFont(hb, new Uint8Array(await (await fetch(src)).arrayBuffer()))
}

const em36 = (em: number | undefined) => (em === undefined ? '--' : Math.max(0, Math.min(1295, Math.round(em * 1000))).toString(36).padStart(2, '0'))

/**
 * Arabic: per code point its isolated, initial, medial and final widths (a form it lacks takes the isolated width), and
 * a list of the letters that join the letter after them (their glyph changes before a joiner).
 */
function arabicTable(f: HbFont): { forms: string; dual: string } {
  const z = f.width(ZWJ)
  let forms = ''
  let dual = ''
  for (let cp = ARABIC[0]; cp <= ARABIC[1]; cp++) {
    if (!f.has(cp)) {
      forms += '--------'
      continue
    }
    const ch = String.fromCodePoint(cp)
    const alone = f.glyphs(ch).join()
    const joinsNext = f.glyphs(ch + ZWJ).filter((g) => !f.glyphs(ZWJ).includes(g)).join() !== alone
    if (joinsNext && /\p{L}/u.test(ch)) dual += ch
    forms += [f.width(ch), joinsNext ? f.width(ch + ZWJ) - z : f.width(ch), joinsNext ? f.width(ZWJ + ch + ZWJ) - 2 * z : f.width(ZWJ + ch) - z, f.width(ZWJ + ch) - z]
      .map(em36)
      .join('')
  }
  return { forms, dual }
}

/** Devanagari: per code point its width (a sign's after क, less क), each consonant's half form, and रु / रू. */
function devanagariTable(f: HbFont): { base: string; half: string; ru: string } {
  const ka = f.width('\u0915')
  const z = f.width(ZWJ)
  let base = ''
  let half = ''
  for (let cp = DEVANAGARI[0]; cp <= DEVANAGARI[1]; cp++) {
    const ch = String.fromCodePoint(cp)
    const sign = /[\p{Mn}\p{Mc}]/u.test(ch)
    base += em36(!f.has(cp) ? undefined : sign ? f.width('\u0915' + ch) - ka : f.width(ch))
    half += em36(f.has(cp) && /[\u0915-\u0939\u0958-\u095f\u0978-\u097f]/.test(ch) ? f.width(ch + '\u094d' + ZWJ) - z : undefined)
  }
  const ra = f.width('\u0930')
  return { base, half, ru: em36(f.width('\u0930\u0941') - ra) + em36(f.width('\u0930\u0942') - ra) }
}

/** One table: each code point's advance in the first file of `stack` that has it. */
function table(stack: HbFont[]): string {
  let out = ''
  for (const [a, z] of RANGES)
    for (let cp = a; cp <= z; cp++) {
      const em = stack.map((f) => f.advance(cp)).find((w) => w !== undefined)
      out += em === undefined ? '--' : Math.min(1295, Math.round(em * 1000)).toString(36).padStart(2, '0')
    }
  return out
}

/** The letters, digits and marks of punctuation kerned (a place's or a satellite's name, the copy's words). */
const KERN_LATIN = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,:;-()\'\u2019 ']
const KERN_CYRILLIC = [...'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюяІЇЄҐіїєґ.,:;-() ']

/**
 * A face's kerning: each pair of `chars` whose shaped width differs from its two advances by 0.01 em or more, as the
 * pair then the difference in thousandths of an em plus 648, in two base-36 digits. Pairs across two files (a Latin
 * letter beside a Cyrillic one) are never kerned, by any renderer.
 */
function kerning(f: HbFont, chars: string[]): string {
  const alone = new Map(chars.map((c) => [c, f.width(c)]))
  let out = ''
  for (const a of chars)
    for (const b of chars) {
      const k = f.width(a + b) - alone.get(a)! - alone.get(b)!
      if (Math.abs(k) >= 0.01) out += a + b + Math.round(k * 1000 + 648).toString(36).padStart(2, '0')
    }
  return out
}

// @ts-expect-error harfbuzzjs ships no types (worker/modules.d.ts types only its two files)
const hb = await (await import('harfbuzzjs')).default
const open = (role: string, scripts: string[]) => Promise.all(scripts.map((s) => openFont(hb, `${role}-${s}.ttf`)))
const [displayBrand, displayVi, serifBrand, serifVi] = await Promise.all([
  open('display', ['latin', 'latin-ext', 'cyrillic']),
  open('display', ['vietnamese']),
  open('serif-italic', ['latin', 'latin-ext', 'cyrillic']),
  open('serif-italic', ['vietnamese']),
])

const [arabicDisplay, arabicSerif, devaDisplay, devaSerif] = await Promise.all([
  googleFont(hb, 'Noto Sans Arabic', 'wght@600'),
  googleFont(hb, 'Noto Sans Arabic', 'wght@400'),
  googleFont(hb, 'Noto Sans Devanagari', 'wdth,wght@75,600'),
  googleFont(hb, 'Noto Serif Devanagari', 'wdth,wght@87.5,400'),
])

const src = `/**
 * GENERATED by scripts/build-card-widths.ts from api/_fonts: do not edit. Advance widths of the share card's headline
 * faces (the condensed display, the serif italic), in thousandths of an em, two base-36 digits a code point over
 * WIDTH_RANGES, \`--\` where the stack has no glyph: the brand stack (latin, latin-ext, Cyrillic) and the Vietnamese cut;
 * Arabic's four forms a letter from U+${ARABIC[0].toString(16).toUpperCase().padStart(4, '0')} and the letters that join the next; Devanagari's
 * widths from U+${DEVANAGARI[0].toString(16).toUpperCase()}, its half forms, and रु रू.
 */
export const WIDTH_RANGES: readonly (readonly [number, number])[] = ${JSON.stringify(RANGES.map(([a, z]) => [a, z]))}
export const ARABIC_FROM = 0x${ARABIC[0].toString(16)}
export const DEVANAGARI_FROM = 0x${DEVANAGARI[0].toString(16)}

export const WIDTHS = {
  display: { brand: '${table(displayBrand)}', vi: '${table(displayVi)}' },
  serif: { brand: '${table(serifBrand)}', vi: '${table(serifVi)}' },
} as const

/** Kerning: a pair, then its difference in thousandths of an em plus 648, two base-36 digits (four characters a pair). */
export const KERNING = {
  display: { brand: ${JSON.stringify(kerning(displayBrand[0], KERN_LATIN) + kerning(displayBrand[2], KERN_CYRILLIC))}, vi: ${JSON.stringify(kerning(displayVi[0], KERN_LATIN))} },
  serif: { brand: ${JSON.stringify(kerning(serifBrand[0], KERN_LATIN) + kerning(serifBrand[2], KERN_CYRILLIC))}, vi: ${JSON.stringify(kerning(serifVi[0], KERN_LATIN))} },
} as const

export const ARABIC_WIDTHS = {
  display: ${JSON.stringify(arabicTable(arabicDisplay))},
  serif: ${JSON.stringify(arabicTable(arabicSerif))},
} as const

export const DEVANAGARI_WIDTHS = {
  display: ${JSON.stringify(devanagariTable(devaDisplay))},
  serif: ${JSON.stringify(devanagariTable(devaSerif))},
} as const
`
writeFileSync(OUT, src)
console.log(`wrote ${path.relative(ROOT, OUT)} (${src.length} bytes)`)
