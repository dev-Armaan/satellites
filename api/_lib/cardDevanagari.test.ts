/**
 * A Hindi card is set as the Hindi page is (src/styles/scripts.css): no tracking anywhere on Devanagari (it cuts the
 * headline stroke between letters), the taller leading its vowel signs need, a headline size that keeps the taller block
 * in its band, and in satori the faces the web gives each role, fetched once per card. English and every other card keep
 * what they had.
 */
import type { ReactElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defaultCard, shareCard } from './card.js'
import {
  CARD_FS,
  HEAD,
  HEAD_DEVANAGARI,
  TRACK,
  buildCardSpec,
  buildSummarySpec,
  headLeading,
  headTracking,
  headlineSize,
  headlineSizeDevanagari,
  needsShaping,
  type CardInput,
  type CardSpec,
} from './cardSpec.js'
import { CACHE_SIZE, loadFallbackAsset, mergeShared, scaledFont } from './fallbackFonts.js'
import { DEVANAGARI_NAME, FAMILY, FONT, type SatoriFont } from './fonts.js'
import { LOCALES, LOCALE_INFO } from './i18n/locales.js'
import { accent, plain, type Rich } from './i18n/parts.js'
import './i18n/card/server.js'

afterEach(() => vi.unstubAllGlobals())

type Styled = ReactElement<{ style?: Record<string, unknown>; children?: unknown }>

/** Every element of a card with its style and its own text. */
function nodes(node: unknown, out: { style: Record<string, unknown>; text: string }[] = []) {
  if (Array.isArray(node)) node.forEach((n) => nodes(n, out))
  else if (node && typeof node === 'object' && 'props' in node) {
    const { style, children } = (node as Styled).props
    const own = (Array.isArray(children) ? children : [children]).filter((c) => typeof c === 'string').join('')
    if (style) out.push({ style, text: own })
    nodes(children, out)
  }
  return out
}

const T = Date.UTC(2026, 10, 1, 16, 21)
const PASS: CardInput = {
  verdict: 'imaged',
  satName: 'Sentinel-2C',
  placeLabel: 'Waterloo',
  satellites: 256,
  lat: 43.47,
  lon: -80.54,
  pass: { altitudeKm: 786, offNadirDeg: 5.3, groundDistanceKm: 61, groundSpeedKmS: 7.46, headingDeg: 192 },
  tClosest: T,
  timeZone: 'America/Toronto',
  host: 'www.watched.earth',
}
/** A card in Hindi's typography with Hindi words in its headline and rows (the Hindi copy is the card catalog's). */
function hindiCard(head: Rich): CardSpec {
  const spec = buildCardSpec(PASS, 'hi')
  return { ...spec, head, readouts: [{ label: 'ऊँचाई', value: '786' }, ...spec.readouts.slice(1)], footLeft: 'देखें, आपको किसने देखा' }
}

describe('the Hindi card’s type', () => {
  it('is never tracked, and only Hindi takes the Devanagari leading', () => {
    for (const l of LOCALES) {
      const deva = LOCALE_INFO[l].script === 'devanagari'
      if (deva) expect(headTracking(l)).toEqual({ lead: 0, place: 0 })
      expect(headLeading({ locale: l, cjk: undefined })).toBe(deva ? HEAD_DEVANAGARI : HEAD)
    }
    expect(headTracking('en')).toEqual({ lead: -0.02, place: -0.01 })
    // the page's --lh-k (1.3) over the card's own leading
    expect(HEAD_DEVANAGARI.leadLH).toBeCloseTo(HEAD.leadLH * 1.3, 2)
    expect(HEAD_DEVANAGARI.placeLH).toBeCloseTo(HEAD.placeLH * 1.3, 2)
  })

  it('sets its headline untracked at that leading, and its Hindi rows untracked, in satori', () => {
    const els = nodes(shareCard({ spec: hindiCard([accent('Waterloo को'), '256 उपग्रहों ने देखा।']), image: null }))
    const head = els.filter((e) => e.text === 'Waterloo को' || e.text === '256 उपग्रहों ने देखा।')
    expect(head.map((e) => [e.style.letterSpacing, e.style.lineHeight])).toEqual([
      [0, HEAD_DEVANAGARI.placeLH],
      [0, HEAD_DEVANAGARI.leadLH],
    ])
    const mono = els.filter((e) => e.style.fontFamily === FAMILY.mono && e.text)
    const deva = mono.filter((e) => /[ऀ-ॿ]/.test(e.text))
    expect(deva.map((e) => e.text)).toEqual(expect.arrayContaining(['ऊँचाई', 'देखें, आपको किसने देखा']))
    expect(deva.every((e) => e.style.letterSpacing === 0)).toBe(true)
    // a row with no Devanagari in it keeps the mono's tracking ("SENTINEL-2C · MSI · 10 M" over the picture)
    const latin = mono.filter((e) => !needsShaping(e.text) && (e.style.fontSize as number) < CARD_FS.readout && e.text !== PASS.host)
    expect(latin.length).toBeGreaterThan(0)
    for (const e of latin) expect(e.style.letterSpacing).toBe((e.style.fontSize as number) * TRACK.label)
  })

  it('sets the default card’s hero untracked, at that leading, its accent as tall as its sans', () => {
    const els = nodes(defaultCard({ host: '', locale: 'hi' }))
    const display = els.filter((e) => e.style.fontFamily === FAMILY.display && e.text)
    const serif = els.filter((e) => e.style.fontFamily === FAMILY.serif && e.text)
    expect(display.length).toBeGreaterThan(0)
    expect(serif.length).toBeGreaterThan(0)
    for (const e of [...display, ...serif]) expect([e.style.letterSpacing, e.style.lineHeight]).toEqual([0, HEAD_DEVANAGARI.leadLH])
    const size = display[0].style.fontSize as number
    expect(size).toBeLessThan(88) // English's 88 px: Hindi set as large reads larger, and taller
    expect(serif[0].style.fontSize).toBeCloseTo(size * 1.04, 5)
  })
})

describe('the Hindi headline’s size', () => {
  const size = (head: Rich, sub?: string) => {
    const lead = head.filter((p) => typeof p === 'string').join(' ')
    const place = head.filter((p) => typeof p !== 'string').map((p) => plain([p])).join(' ')
    return { S: headlineSizeDevanagari(head, lead, place, sub), latin: headlineSize(lead, place) }
  }

  it('is the Latin ladder’s when the block fits at it', () => {
    const { S, latin } = size([accent('Waterloo\u00a0को'), '256\u00a0उपग्रहों ने\u00a0देखा।'])
    expect(S).toBe(latin)
    expect(S).toBe(84)
  })

  it('never leaves one word alone on a block’s last line', () => {
    // untied, «Sentinel-2C ने / देखा।» at 84 px: a size that puts the verb on its own line is passed over; tied, the
    // last line is «ने देखा।» and 84 px stays
    const untied = size([accent('Waterloo\u00a0को'), 'Sentinel-2C ने देखा।']).S
    expect(untied).toBeLessThan(84)
    expect(untied).toBeGreaterThanOrEqual(36)
    expect(size([accent('Waterloo\u00a0को'), 'Sentinel-2C ने\u00a0देखा।']).S).toBe(84)
    // a lone «से» under the place is passed over too, and «ऊपर से» tied keeps the size
    expect(size([accent('Waterloo\u00a0के ऊपर से'), 'MetOp-B की पट्टी\u00a0गुज़री।']).S).toBeLessThan(72)
    expect(size([accent('Waterloo\u00a0के ऊपर\u00a0से'), 'MetOp-B की पट्टी\u00a0गुज़री।']).S).toBe(72)
  })

  it('sets a tied run no wider than the column', () => {
    // a run the renderers cannot break would overflow the 466 px column at 84 px (515 px measured)
    const S = size([accent('Waterloo\u00a0को'), '256\u00a0उपग्रहों\u00a0ने\u00a0देखा।']).S
    expect(S).toBeLessThan(84)
    expect(S).toBeGreaterThanOrEqual(36)
    // the marks above and below are not counted: the week's run (441 px at 72 px) keeps 72
    const counts = { imaged: 31, likely: 220, could: 1544, overhead: 66 }
    const input = { placeLabel: 'Waterloo', lat: 43.47, lon: -80.54, satellites: 262, counts, host: 'x' }
    const week = buildSummarySpec(input, 'hi')
    expect(week.size).toBe(72)
  })

  it('steps down until a long place, a long lead and a sub-line fit the band', () => {
    // measured by its letters' forms (cardMeasure.ts), the place without «महाविद्यालय» fits at the ladder's 54 px
    const head: Rich = [accent('क्षत्रिय त्र्यंबकेश्वर धर्मशाला महाविद्यालय\u00a0के ऊपर से'), 'Sentinel-2C की नज़र पहुँच सकती थी।']
    const sub = 'दृश्य के 81% हिस्से पर बादल। उसे ज़्यादातर बादल दिखे।'
    const { S, latin } = size(head, sub)
    expect(S).toBeLessThan(latin)
    expect(S).toBeGreaterThanOrEqual(36)
    // without the sub-line there is more room: never smaller
    expect(size(head).S).toBeGreaterThanOrEqual(S)
  })

  it('leaves English, Cyrillic and Arabic cards on the Latin ladder', () => {
    for (const l of ['en', 'de', 'uk', 'ar'] as const) {
      const spec = buildCardSpec(PASS, l)
      expect(spec.size).toBe(headlineSize(spec.lead, spec.place + spec.tail.replace(/[.。]$/, '')))
    }
  })
})

describe('the unfurl’s Devanagari', () => {
  const sheet = (url: string) => {
    const name = /family=([^:&]+)/.exec(url)![1]
    const axes = /:([^&]+)&/.exec(url)?.[1] ?? ''
    return `@font-face { font-family: '${name}'; font-weight: ${axes.endsWith('600') ? 600 : 400}; src: url(https://f/${name}/${encodeURIComponent(axes)}.ttf) format('truetype'); }`
  }
  /** A TrueType file of one table, `head`, whose em is 1000 (enough for scaledFont) */
  const ttf = () => {
    const b = new DataView(new ArrayBuffer(12 + 16 + 54))
    b.setUint32(0, 0x00010000)
    b.setUint16(4, 1)
    b.setUint32(12, 0x68656164) // 'head'
    b.setUint32(12 + 8, 28)
    b.setUint32(12 + 12, 54)
    b.setUint16(28 + 18, 1000)
    return b.buffer
  }

  it('is a face per role as the page sets Hindi: three style sheets, the sans shared with the mono', async () => {
    const asked: string[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        asked.push(url)
        return url.startsWith('https://fonts.googleapis.com/') ? new Response(sheet(decodeURIComponent(url))) : new Response(ttf())
      }),
    )
    const fonts = (await loadFallbackAsset('devanagari', 'नमस्ते')) as SatoriFont[]
    expect(fonts.map((f) => [f.name, f.weight, f.style, f.lang])).toEqual([
      [DEVANAGARI_NAME(FONT.sans), 400, 'normal', undefined],
      [DEVANAGARI_NAME(FONT.display), 600, 'normal', undefined],
      [DEVANAGARI_NAME(FONT.mono), 400, 'normal', undefined],
      [DEVANAGARI_NAME(FONT.serif), 400, 'italic', undefined],
    ])
    const css = asked.filter((u) => u.startsWith('https://fonts.googleapis.com/')).map((u) => decodeURIComponent(u).replace(/&text=.*/, ''))
    expect(css).toEqual([
      'https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400',
      'https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wdth,wght@75,600',
      'https://fonts.googleapis.com/css2?family=Noto+Serif+Devanagari:wdth,wght@87.5,400',
    ])
    // the mono's labels drawn 20% larger, as the page's size-adjust: the em shrunk, nothing else
    const upem = (f: SatoriFont) => new DataView(f.data).getUint16(28 + 18)
    expect([upem(fonts[0]), upem(fonts[2])]).toEqual([1000, 833])
    // each name in its role's stack, after the role's own faces
    for (const role of ['display', 'sans', 'mono', 'serif'] as const) expect(FAMILY[role].split(', ')).toContain(DEVANAGARI_NAME(FONT[role]))
  })

  it('takes the danda with the card’s Devanagari, not five other scripts’ subsets', () => {
    const indic = 'bn-IN|ta-IN|ml-IN|te-IN|devanagari|kannada'
    expect(
      mergeShared([
        { code: 'devanagari', text: 'देखा' },
        { code: indic, text: '।' },
      ]),
    ).toEqual([{ code: 'devanagari', text: 'देखा।' }])
    // a danda alone (no Devanagari to join), and Han shared by CJK languages, are left as satori names them
    expect(mergeShared([{ code: indic, text: '।' }])).toEqual([{ code: indic, text: '।' }])
    const han = [
      { code: 'ja-JP', text: 'の' },
      { code: 'ja-JP|zh-CN|zh-TW|zh-HK', text: '東京' },
    ]
    expect(mergeShared(han)).toEqual(han)
  })

  it('scales a font by its em alone', () => {
    const f = ttf()
    const big = scaledFont(f, 1.2)
    expect([new DataView(f).getUint16(46), new DataView(big).getUint16(46)]).toEqual([1000, 833])
    expect(CACHE_SIZE).toBeGreaterThan(0)
  })
})
