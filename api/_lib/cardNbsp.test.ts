/**
 * The server card (satori) keeps a no-break space between a count and its noun at every width, in the languages that
 * write one: satori breaks lines by UAX #14, where the space is glue, so the card needs no hold of its own (the
 * results' animated count does: src/i18n/Rich.tsx holdNum). Rendered with satori itself, text left as <text> runs so
 * each word's line can be read from its y.
 */
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import satori, { init } from 'satori/standalone'
import { beforeAll, describe, expect, it } from 'vitest'
import { FAMILY, cardFonts } from './fonts.js'
import { h } from './h.js'
import type { Locale } from './i18n/locales.js'

beforeAll(async () => {
  await init(await readFile(createRequire(import.meta.url).resolve('satori/yoga.wasm')))
})

/** The y of each <text> run satori writes for `text` set `width` px wide, in order. */
async function runs(locale: Locale, text: string, width: number): Promise<{ y: number; t: string }[]> {
  const fonts = await cardFonts(locale, text)
  const el = h('div', { style: { display: 'flex', width, fontFamily: FAMILY.sans, fontSize: 40, lineHeight: 1.1 } }, text)
  const svg = await satori(el, { width: 440, height: 600, fonts, embedFont: false, loadAdditionalAsset: async () => [] })
  return [...svg.matchAll(/<text[^>]*?y="([\d.]+)"[^>]*>([^<]*)<\/text>/g)].map((m) => ({ y: +m[1], t: m[2] }))
}

const CASES: [Locale, string, string, string][] = [
  ['ru', 'Опубликовано 1\u00a0037\u00a0снимков.', '037', 'снимков'],
  ['uk', 'Оприлюднено щонайменше 12\u00a0345\u00a0знімків.', '345', 'знімків'],
  ['fr', 'Au moins 1\u00a0713\u00a0images ont été rendues publiques.', '713', 'images'],
  ['es', 'Se publicaron al\u00a0menos 12\u00a0345\u00a0imágenes.', '345', 'imágenes'],
  ['tr', 'En\u00a0az\u00a012.345 görüntü kamuya açıldı.', 'az', '12.345'],
]

describe('the server card keeps a no-break space after a count', () => {
  for (const [locale, text, a, b] of CASES)
    it(`${locale}: «${a}» and «${b}» share a line at every width`, async () => {
      for (let width = 120; width <= 420; width += 20) {
        const rs = await runs(locale, text, width)
        const ya = rs.find((r) => r.t.includes(a))?.y
        const yb = rs.find((r) => r.t.includes(b))?.y
        expect(ya, `${width} px: ${JSON.stringify(rs)}`).toBeDefined()
        expect(yb, `${width} px`).toBe(ya)
      }
    })
})
