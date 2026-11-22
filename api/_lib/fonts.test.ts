/**
 * Which fonts a card reads, and what they draw: an English card reads and renders exactly what it always did; Turkish
 * and Polish letters come from each role's latin-ext file; a card that speaks Ukrainian or Russian or prints Cyrillic
 * adds the faces the web gives Cyrillic, each role its own; a Vietnamese card sets every word in the faces the web gives
 * Vietnamese, and any other card takes only the letters the brand faces lack from them; none of them asks Google Fonts
 * for a letter. A Chinese, Japanese or Korean card tells satori its language. Rendered offline with satori itself, since
 * the point is how satori resolves them.
 */
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import type { ReactElement } from 'react'
import satori, { init } from 'satori/standalone'
import { beforeAll, describe, expect, it } from 'vitest'
import { defaultCard, shareCard } from './card.js'
import { buildCardSpec } from './cardSpec.js'
import { FAMILY, FONT, FONT_FILES, cardFamily, cardFonts, loadFonts, needsCyrillic, needsVietnamese, type SatoriFont } from './fonts.js'
import { h, textOf } from './h.js'
import { LOCALES, type Locale } from './i18n/locales.js'
import { cardInputFromShare, shareFromParams } from './share.js'

beforeAll(async () => {
  await init(await readFile(createRequire(import.meta.url).resolve('satori/yoga.wasm')))
})

/** satori's SVG for an element; any glyph it has to ask the fallback loader for fails the test. */
async function svg(element: ReactElement, fonts: SatoriFont[], width = 800, height = 120): Promise<string> {
  const asked: string[] = []
  const out = await satori(element, {
    width,
    height,
    fonts,
    loadAdditionalAsset: async (code, text) => {
      asked.push(`${code}: ${text}`)
      return []
    },
  })
  expect(asked).toEqual([])
  return out
}

const line = (text: string, style: Record<string, unknown>) => h('div', { style: { display: 'flex', fontSize: 48, ...style } }, text)

/** The element with every role's stack replaced by its bare face: the card as it was before the Cyrillic cuts. */
function bareFamilies(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(bareFamilies)
  if (!node || typeof node !== 'object' || !('props' in node)) return node
  const el = node as ReactElement<{ style?: Record<string, unknown>; children?: unknown }>
  const style = el.props.style && { ...el.props.style }
  const role = (Object.keys(FAMILY) as (keyof typeof FAMILY)[]).find((r) => FAMILY[r] === style?.fontFamily)
  if (style && role) style.fontFamily = FONT[role]
  return { ...el, props: { ...el.props, ...(style ? { style } : {}), ...('children' in el.props ? { children: bareFamilies(el.props.children) } : {}) } }
}

const LATIN_LIST = [
  ['display-latin.ttf', 'Overflight Display', 600, 'normal'],
  ['sans-latin.ttf', 'Overflight Sans', 400, 'normal'],
  ['mono-latin.ttf', 'Overflight Mono', 400, 'normal'],
  ['serif-italic-latin.ttf', 'Overflight Serif', 400, 'italic'],
  ['display-latin-ext.ttf', 'Overflight Display Ext', 600, 'normal'],
  ['sans-latin-ext.ttf', 'Overflight Sans Ext', 400, 'normal'],
  ['mono-latin-ext.ttf', 'Overflight Mono Ext', 400, 'normal'],
  ['serif-italic-latin-ext.ttf', 'Overflight Serif Ext', 400, 'italic'],
  ['mono-medium-latin.ttf', 'Overflight Mono', 500, 'normal'],
] as const

const fontFile = async (file: string) => new Uint8Array(await readFile(new URL(`../_fonts/${file}`, import.meta.url)))
const same = (a: ArrayBuffer, b: Uint8Array) => a.byteLength === b.byteLength && Buffer.from(a).equals(Buffer.from(b))

describe('card fonts', () => {
  it('reads the Latin files, and only those, for a card with no Cyrillic, in any language', async () => {
    const latin = await loadFonts()
    expect(latin.map((f) => [f.name, f.weight, f.style])).toEqual(LATIN_LIST.map(([, name, weight, style]) => [name, weight, style]))
    for (const [i, [file]] of LATIN_LIST.entries()) expect(same(latin[i].data, await fontFile(file))).toBe(true)
    // The same array, so satori keeps using the font loader (and shaping cache) it already built for it.
    for (const [locale, text] of [
      ['en', 'Sentinel-2C watched Waterloo.'],
      ['pl', 'Łódź'],
      ['ja', 'オンタリオ州ウォータールー'],
      ['zh-Hant', '臺北'],
      ['ar', 'القاهرة'],
    ] as [Locale, string][]) {
      expect(await cardFonts(locale, text)).toBe(latin)
    }
  })

  it('adds the four Cyrillic cuts, under their own names, for Ukrainian or for any Cyrillic word', async () => {
    const latin = await loadFonts()
    const uk = await cardFonts('uk', 'Sentinel-2C')
    expect(uk.slice(0, latin.length)).toEqual(latin) // the same objects: read and parsed once
    expect(uk.slice(latin.length).map((f) => [f.name, f.weight, f.style])).toEqual([
      ['Overflight Display Cyrillic', 600, 'normal'],
      ['Overflight Sans Cyrillic', 400, 'normal'],
      ['Overflight Mono Cyrillic', 400, 'normal'],
      ['Overflight Serif Cyrillic', 400, 'italic'],
    ])
    expect(await cardFonts('en', 'Sentinel-2C watched Київ.')).toBe(uk)
    expect(LOCALES.filter((l) => needsCyrillic(l, ''))).toEqual(['uk', 'ru'])
  })

  it('draws Turkish and Polish letters in each role’s own face, offline', async () => {
    const latin = await loadFonts()
    const roles = [
      ['display', { fontFamily: FAMILY.display, fontWeight: 600 }],
      ['sans', { fontFamily: FAMILY.sans }],
      ['mono', { fontFamily: FAMILY.mono }],
      ['serif', { fontFamily: FAMILY.serif, fontStyle: 'italic' }],
    ] as const
    for (const [role, style] of roles) {
      // With only that role's two files registered, the same words draw the same outlines: no other face was asked.
      const own = latin.filter((f) => f.name === FONT[role] || f.name === `${FONT[role]} Ext`)
      for (const words of ['ALTİTUDE İstanbul Şişli Ğ', 'Łódź Gdańsk Kraków źdźbło']) {
        expect(await svg(line(words, style), latin)).toBe(await svg(line(words, style), own))
      }
    }
  })

  it('draws Cyrillic in each role’s own cut, offline', async () => {
    const fonts = await cardFonts('uk', '')
    const cut = (name: string) => fonts.filter((f) => f.name === name)
    const roles = [
      ['display', { fontFamily: FAMILY.display, fontWeight: 600 }],
      ['sans', { fontFamily: FAMILY.sans }],
      ['mono', { fontFamily: FAMILY.mono }],
      ['serif', { fontFamily: FAMILY.serif, fontStyle: 'italic' }],
    ] as const
    for (const [role, style] of roles) {
      // With only that role's cut registered, the same word draws the same outlines: no other face was asked. (One
      // word: the cuts hold no space, which comes from the brand face, as in the browser.)
      for (const word of ['Ґанок', 'Їжачок']) expect(await svg(line(word, style), fonts)).toBe(await svg(line(word, style), cut(`${FONT[role]} Cyrillic`)))
    }
    // …and the roles differ (the condensed display is not the body's width).
    expect(await svg(line('Київ', roles[0][1]), fonts)).not.toBe(await svg(line('Київ', roles[1][1]), fonts))
  })

  it('adds the four Vietnamese cuts, under their own names, for Vietnamese or for any letter the brand faces lack', async () => {
    const latin = await loadFonts()
    const vi = await cardFonts('vi', 'Sentinel-2C')
    expect(vi.slice(0, latin.length)).toEqual(latin)
    expect(vi.slice(latin.length).map((f) => [f.name, f.weight, f.style])).toEqual([
      ['Overflight Display Vietnamese', 600, 'normal'],
      ['Overflight Sans Vietnamese', 400, 'normal'],
      ['Overflight Mono Vietnamese', 400, 'normal'],
      ['Overflight Serif Vietnamese', 400, 'italic'],
    ])
    expect(await cardFonts('en', 'Sentinel-2C watched Hà Nội.')).toBe(vi)
    // é, à, ô and ă are the brand faces' own: Lyon, Montréal and Brăila need nothing more
    expect(await cardFonts('fr', 'Montréal, Brăila, Hà')).toBe(latin)
    expect(LOCALES.filter((l) => needsVietnamese(l, ''))).toEqual(['vi'])
    // both, for a Vietnamese card with a Cyrillic place (each cut read once)
    const both = await cardFonts('vi', 'Київ')
    expect(both.map((f) => f.name)).toEqual([...latin, ...(await cardFonts('uk', '')).slice(latin.length), ...vi.slice(latin.length)].map((f) => f.name))
    expect(both[both.length - 1]).toBe(vi[vi.length - 1])
  })

  it('sets a Vietnamese card’s every word in its Vietnamese cut, Latin letters and digits too', async () => {
    const fonts = await cardFonts('vi', '')
    const F = cardFamily('vi')
    const roles = [
      ['display', { fontFamily: F.display, fontWeight: 600 }],
      ['sans', { fontFamily: F.sans }],
      ['mono', { fontFamily: F.mono }],
      ['serif', { fontFamily: F.serif, fontStyle: 'italic' }],
    ] as const
    for (const [role, style] of roles) {
      const cut = fonts.filter((f) => f.name === `${FONT[role]} Vietnamese`)
      // With only that role's cut registered, the same words draw the same outlines: no word is half in Instrument.
      for (const words of ['256 vệ tinh đã quan sát Waterloo.', 'ĐỘ CAO 786 km · TỐC ĐỘ 7,46 km/s', 'Thành phố Hồ Chí Minh', 'Łódź, Brașov']) {
        expect(await svg(line(words, style), fonts)).toBe(await svg(line(words, style), cut))
      }
    }
  })

  it('takes only the letters the brand faces lack from the Vietnamese cuts on any other card', async () => {
    const fonts = await cardFonts('en', 'Hà Nội')
    const brand = (role: keyof typeof FONT) => fonts.filter((f) => f.name === FONT[role] || f.name === `${FONT[role]} Ext`)
    const style = { fontFamily: FAMILY.serif, fontStyle: 'italic' }
    // "Hà N" and "i" in Instrument Serif, as the English card always set them; only ộ from the Vietnamese cut
    expect(await svg(line('Hà Ni', style), fonts)).toBe(await svg(line('Hà Ni', style), brand('serif')))
    expect(await svg(line('Hà Nội', style), fonts)).not.toBe(await svg(line('Hà Nội', style), fonts.filter((f) => f.name === 'Overflight Serif Vietnamese')))
  })

  it('takes the letters Martian Mono lacks (Serbian, Macedonian, Kazakh) from the sans cut, not the display', async () => {
    const fonts = await cardFonts('uk', '')
    const mono = { fontFamily: FAMILY.mono }
    for (const word of ['Ђ', 'љ', 'Ұ']) {
      expect(await svg(line(word, mono), fonts)).toBe(await svg(line(word, mono), fonts.filter((f) => f.name === 'Overflight Sans Cyrillic')))
    }
  })

  it('renders an English card exactly as it did before the Cyrillic cuts existed', async () => {
    const latin = await loadFonts()
    const share = shareFromParams(
      new URLSearchParams('place=Waterloo&lat=43.47&lon=-80.54&sat=Sentinel-2C&norad=60989&verdict=could&t=1793549661025&alt=794.9&off=5.26&dist=73&az=104&hdg=195'),
    )!
    for (const card of [defaultCard({ host: 'www.watched.earth' }), shareCard({ spec: buildCardSpec(cardInputFromShare(share, 'www.watched.earth')), image: null })]) {
      expect(card.props).not.toHaveProperty('lang')
      expect(await cardFonts('en', textOf(card))).toBe(latin)
      const before = bareFamilies(card) as ReactElement
      expect([JSON.stringify(card).includes('Cyrillic'), JSON.stringify(before).includes('Cyrillic')]).toEqual([true, false])
      expect(await svg(card, latin, 1200, 630)).toBe(await svg(before, latin, 1200, 630))
    }
  })

  it('is registered for the Worker, file for file', async () => {
    const worker = await readFile(new URL('../../worker/index.ts', import.meta.url), 'utf8')
    for (const file of FONT_FILES) {
      expect((await fontFile(file)).byteLength).toBeGreaterThan(1000)
      expect(worker).toContain(`from '../api/_fonts/${file}'`)
      expect(worker).toMatch(new RegExp(`'_fonts/${file.replace(/\./g, '\\.')}': \\w+,`))
    }
  })
})

describe('card language', () => {
  const spec = (locale: Locale) =>
    buildCardSpec(
      cardInputFromShare(shareFromParams(new URLSearchParams('place=Waterloo&lat=43.47&lon=-80.54&sat=Sentinel-2C&norad=60989&verdict=could&t=1793549661025'))!, ''),
      locale,
    )

  it('tracks the default card’s hero as the landing hero is tracked in the card’s language', () => {
    const tracks = (locale: Locale) => {
      const out = new Set<unknown>()
      const walk = (node: unknown): void => {
        if (Array.isArray(node)) return node.forEach(walk)
        if (!node || typeof node !== 'object' || !('props' in node)) return
        const { style, children } = (node as ReactElement<{ style?: Record<string, unknown>; children?: unknown }>).props
        if (style?.fontFamily === FAMILY.display && style.fontSize === 88) out.add(style.letterSpacing)
        walk(children)
      }
      walk(defaultCard({ host: '', locale }))
      return [...out]
    }
    // --track-display: tokens.css, and scripts.css for Cyrillic and CJK (Arabic waits for the right-to-left card)
    expect(tracks('en')).toEqual([-0.02 * 88])
    expect(tracks('pl')).toEqual([-0.02 * 88])
    expect(tracks('uk')).toEqual([-0.015 * 88])
    expect(tracks('ja')).toEqual([-0.01 * 88])
  })

  it('tells satori the language whose Han forms the card wants, and nothing for any other', () => {
    const want: Partial<Record<Locale, string>> = { ja: 'ja-JP', ko: 'ko-KR', 'zh-Hans': 'zh-CN', 'zh-Hant': 'zh-TW' }
    for (const locale of LOCALES) {
      for (const card of [defaultCard({ host: '', locale }), shareCard({ spec: spec(locale), image: null })]) {
        expect((card.props as { lang?: string }).lang).toBe(want[locale])
      }
    }
  })
})
