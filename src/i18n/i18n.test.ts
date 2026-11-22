import { afterEach, describe, expect, it } from 'vitest'
import { LOCALES, LOCALE_INFO, localeForTag, matchLocale, type Locale } from '../../api/_lib/i18n/locales'
import { PLURALS, fmt } from '../../api/_lib/i18n/format'
import { accent, isNum, num, numText, plain, strong, type Part } from '../../api/_lib/i18n/parts'
import { bootLocale, type BootData } from './boot'
import enApp from './en/app'
import { heldAfter, heldBefore, holdNum } from './Rich'

const TAGS = [
  'en', 'en-US', 'en-GB', 'EN_us', 'es', 'es-MX', 'es-419', 'fr-CA', 'fr', 'de-AT', 'de-CH', 'pt', 'pt-BR', 'pt-PT', 'pt_br',
  'it', 'nl-BE', 'pl', 'tr', 'id', 'in', 'in-ID', 'uk', 'uk-UA', 'ru', 'ru-UA', 'be', 'ja', 'ja-JP', 'ko-KR', 'zh', 'zh-CN',
  'zh-SG', 'zh-Hans', 'zh-Hans-CN', 'zh-TW', 'zh-HK', 'zh-MO', 'zh-Hant', 'zh-Hant-HK', 'ZH-tw', 'zh-Hans-HK', 'zh-Hans-TW', 'zh-Hans-MO', 'zh-Hant-CN', 'yue', 'yue-HK', 'ar', 'ar-SA', 'ar-EG',
  'he', 'hi-IN', 'vi', 'th', 'sv', '', ' ', 'x-pseudo', 'enx',
]

describe('locale matching', () => {
  it('maps tags the way the product promises', () => {
    expect(localeForTag('zh-CN')).toBe('zh-Hans')
    expect(localeForTag('zh-SG')).toBe('zh-Hans')
    expect(localeForTag('zh')).toBe('zh-Hans')
    expect(localeForTag('zh-HK')).toBe('zh-Hant')
    expect(localeForTag('zh-Hant-HK')).toBe('zh-Hant')
    expect(localeForTag('zh-TW')).toBe('zh-Hant')
    // A named script wins over the region
    expect(localeForTag('zh-Hans-HK')).toBe('zh-Hans')
    expect(localeForTag('zh-Hans-TW')).toBe('zh-Hans')
    expect(localeForTag('zh-Hant-CN')).toBe('zh-Hant')
    expect(localeForTag('pt-PT')).toBe('pt-BR')
    expect(localeForTag('in')).toBe('id')
    // Cantonese: Traditional Chinese, the one neighbour chosen over English
    expect(localeForTag('yue')).toBe('zh-Hant')
    expect(localeForTag('yue-Hant-HK')).toBe('zh-Hant')
    expect(localeForTag('ru-RU')).toBe('ru')
    expect(localeForTag('fa-IR')).toBe('fa')
    expect(localeForTag('vi-VN')).toBe('vi')
    expect(localeForTag('hi-IN')).toBe('hi')
    // A neighbour is never assumed: Belarusian and Tajik get English, not Russian or Persian
    expect(localeForTag('be')).toBeUndefined()
    expect(localeForTag('tg')).toBeUndefined()
    expect(localeForTag('enx')).toBeUndefined()
  })
  it('takes the first language we speak, English when none', () => {
    expect(matchLocale(['be-BY', 'uk-UA', 'en'])).toBe('uk')
    expect(matchLocale(['ru-RU', 'uk-UA', 'en'])).toBe('ru')
    expect(matchLocale(['en-US', 'ja'])).toBe('en')
    expect(matchLocale(['be', 'he'])).toBe('en')
    expect(matchLocale([])).toBe('en')
  })
})

/** Run index.html's boot script against fake globals and read what it decided. */
function boot(langs: readonly string[], search = '', saved: string | null = null) {
  const store = new Map<string, string>(saved ? [['watched.lang', saved]] : [])
  const attrs: Record<string, string> = {}
  const links: { rel: string; href: string }[] = []
  const g = globalThis as Record<string, unknown>
  const keep = { localStorage: g.localStorage, location: g.location, navigator: g.navigator, document: g.document }
  Object.assign(g, {
    localStorage: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v), removeItem: (k: string) => store.delete(k) },
    location: { search },
    document: {
      documentElement: { lang: '', dir: '', setAttribute: (k: string, v: string) => (attrs[k] = v) },
      head: { appendChild: (l: { rel: string; href: string }) => links.push(l) },
      createElement: () => ({}),
    },
  })
  Object.defineProperty(g, 'navigator', { value: { languages: langs, language: langs[0] }, configurable: true, writable: true })
  const data: BootData = {
    locales: Object.fromEntries(Object.values(LOCALE_INFO).map((l) => [l.code, [l.script, l.dir, l.listed ? 1 : 0]])),
    preload: { de: ['/assets/de.js'] },
  }
  try {
    bootLocale(data)
    const root = (g.document as { documentElement: { lang: string; dir: string } }).documentElement
    return { lang: root.lang, dir: root.dir, attrs, links, saved: store.get('watched.lang') }
  } finally {
    Object.defineProperty(g, 'navigator', { value: keep.navigator, configurable: true, writable: true })
    Object.assign(g, { localStorage: keep.localStorage, location: keep.location, document: keep.document })
  }
}

describe('boot script (index.html)', () => {
  afterEach(() => undefined)
  it('agrees with matchLocale on every tag', () => {
    for (const tag of TAGS) expect(boot([tag]).lang, tag).toBe(matchLocale([tag]))
    for (let i = 0; i < TAGS.length - 1; i++) expect(boot([TAGS[i], TAGS[i + 1]]).lang).toBe(matchLocale([TAGS[i], TAGS[i + 1]]))
  })
  it('sets direction and script, and preloads the bundle', () => {
    const ar = boot(['ar-SA'])
    expect([ar.lang, ar.dir, ar.attrs['data-script']]).toEqual(['ar', 'rtl', 'arabic'])
    const de = boot(['de-DE'])
    expect(de.links.map((l) => [l.rel, l.href])).toEqual([['modulepreload', '/assets/de.js']])
    expect(boot(['en-US']).links).toEqual([])
  })
  it('lets ?hl= and the saved choice win, and remembers ?hl=', () => {
    expect(boot(['en-US'], '?hl=ja')).toMatchObject({ lang: 'ja', saved: 'ja' })
    expect(boot(['en-US'], '', 'de').lang).toBe('de')
    expect(boot(['en-US'], '?hl=auto', 'de')).toMatchObject({ lang: 'en', saved: undefined })
    expect(boot(['fr'], '?hl=klingon').lang).toBe('fr')
  })
})

describe('formatting', () => {
  it('keeps the plural table equal to the runtime ICU', () => {
    for (const l of LOCALES) {
      const icu = new Intl.PluralRules(LOCALE_INFO[l].intl).resolvedOptions().pluralCategories
      expect([...icu].sort(), l).toEqual([...LOCALE_INFO[l].plurals].sort())
      expect([...PLURALS[l]].sort(), l).toEqual([...LOCALE_INFO[l].plurals].sort())
    }
  })
  it('formats numbers per locale, English as before', () => {
    expect(fmt('en').int(1715)).toBe('1,715')
    expect(fmt('en').dec(7.456, 2)).toBe('7.46')
    expect(fmt('de').int(1715)).toBe('1.715')
    expect(fmt('de').dec(7.456, 2)).toBe('7,46')
    expect(fmt('ar').int(1715)).toBe('1,715')
    expect(fmt('en').list(['Umbra', 'Capella', '7 other radar satellites'])).toBe('Umbra, Capella and 7 other radar satellites')
    // Spanish groups with a no-break space from 5 digits (its style guide).
    expect(fmt('es').int(35778)).toBe('35\u00a0778')
    expect(fmt('es').int(1715)).toBe('1715')
    expect(fmt('es').dec(12345.678, 2)).toBe('12\u00a0345,68')
    // French groups with a no-break space too: the sans draws U+202F at 0.1 em, so 2 330 read as 2330.
    expect(fmt('fr').int(35778)).toBe('35\u00a0778')
  })
  it('spaces a percent sign where the language does', () => {
    expect(numText({ n: '25', u: '%' })).toBe('25%')
    expect(numText({ n: '25', u: '%' }, LOCALE_INFO.fr)).toBe('25\u00a0%')
    expect(numText({ n: '5,3', u: '°' }, LOCALE_INFO.de)).toBe('5,3°')
    expect(numText({ n: '25', u: '%' }, LOCALE_INFO.tr)).toBe('%25')
    expect([fmt('en').pct(25), fmt('fr').pct(25), fmt('tr').pct(25), fmt('es').pct(12.4)]).toEqual(['25%', '25\u00a0%', '%25', '12%'])
  })
  it('picks plural forms', () => {
    const pl = fmt('pl')
    const forms = { one: 'satelita', few: 'satelity', many: 'satelitów', other: 'satelity' }
    expect([1, 2, 5, 22, 25].map((n) => pl.plural(n, forms))).toEqual(['satelita', 'satelity', 'satelitów', 'satelity', 'satelitów'])
  })
})

describe('rich parts', () => {
  it('flattens to text with the locale sentence gap', () => {
    const s = ['In the last 7 days, ', strong(num('256'), ' satellites watched'), ' ', accent('Waterloo'), '.']
    expect(plain(s)).toBe('In the last 7 days, 256 satellites watched Waterloo.')
    expect(plain([[num('25', '%')], [num('7.46', 'km/s')]])).toBe('25% 7.46 km/s')
    expect(plain([['今週。'], ['見ていた。']], '')).toBe('今週。見ていた。')
  })
})

describe('a number set as a box of its own keeps the words tied to it (holdNum)', () => {
  it('holds what a no-break space, or no space at all, ties to the number, and nothing across a plain space', () => {
    expect(heldAfter(' images were made public.')).toBe(0)
    expect(heldAfter('\u00a0снимков.')).toBe('\u00a0снимков.'.length)
    expect(heldAfter('\u00a0images ont été rendues publiques.')).toBe('\u00a0images'.length)
    expect(heldAfter('\u00a0bức\u00a0ảnh đã được công\u00a0bố.')).toBe('\u00a0bức\u00a0ảnh'.length)
    // A counter right after a number: Japanese 枚, Chinese 张 (one character: Chinese breaks between the next ones),
    // a Korean word written against it
    expect(heldAfter('枚。')).toBe(1)
    expect(heldAfter('\u00a0张图像已公开。')).toBe(2)
    expect(heldAfter('장 공개됐다.')).toBe(1)
    expect(heldBefore('At least ')).toBe(0)
    expect(heldBefore('En\u00a0az\u00a0')).toBe('En\u00a0az\u00a0'.length)
    expect(heldBefore('Au moins à\u00a0')).toBe('à\u00a0'.length)
    // Plain text breaks before a number after Japanese kana (少なくとも|12,345枚。): so does the count
    expect(heldBefore('少なくとも')).toBe(0)
  })

  it('cuts the parts around the number, and leaves English as it was', () => {
    const en = [strong('At least '), num('1,713'), ' images were made public.']
    expect(holdNum(en, 1)).toEqual({ before: [en[0]], held: [en[1]], after: [en[2]] })
    const tr = [strong('En\u00a0az\u00a0'), num('12.345'), '\u00a0görüntü kamuya açıldı.']
    expect(holdNum(tr, 1)).toEqual({ before: [], held: [strong('En\u00a0az\u00a0'), num('12.345'), '\u00a0görüntü'], after: [' kamuya açıldı.'] })
    const ru = ['Опубликовано ', strong('как минимум '), num('1\u00a0037'), '\u00a0снимков.']
    expect(holdNum(ru, 2)).toEqual({ before: ru.slice(0, 2), held: [ru[2], ru[3]], after: [] })
  })

  it('holds every language’s second line so that no no-break space is left at a cut', () => {
    const catalogs = import.meta.glob<{ imagesPublic: (k: number) => Part[] }>('./*/results.ts', { import: 'default', eager: true })
    expect(Object.keys(catalogs).length).toBe(LOCALES.length)
    const glue = /[\u00a0\u202f\u2007\u2060]/
    for (const [file, m] of Object.entries(catalogs))
      for (const k of [3, 5, 22, 27, 101, 1713, 12345]) {
        const parts = m.imagesPublic(k)
        const at = parts.findIndex(isNum)
        if (at < 0) continue
        const { before, held, after } = holdNum(parts, at)
        expect(plain([...before, ...held, ...after]), file).toBe(plain(parts))
        const lastBefore = plain(before.slice(-1)).slice(-1)
        const firstAfter = plain(after.slice(0, 1)).slice(0, 1)
        const heldText = plain(held)
        expect(glue.test(lastBefore) || glue.test(heldText[0]), `${file} ${k}: ${JSON.stringify(heldText)}`).toBe(false)
        expect(glue.test(firstAfter) || glue.test(heldText[heldText.length - 1]), `${file} ${k}: ${JSON.stringify(heldText)}`).toBe(false)
        // English writes plain spaces on both sides of its count: nothing is held, its line renders as it always did
        if (file === './en/results.ts') expect(held).toHaveLength(1)
      }
  })
})

describe('the tab title', () => {
  // src/app/head.ts sets app.documentTitle on the landing in every language, English included: English must be
  // index.html's title as it is, the one crawlers and link previews read.
  it('is index.html’s own in English', () => {
    const html = import.meta.glob<string>('../../index.html', { query: '?raw', import: 'default', eager: true })['../../index.html']
    expect(/<title>([^<]*)<\/title>/.exec(html)?.[1]).toBe(enApp.documentTitle)
  })
})

describe('catalog characters', () => {
  // The design's faces draw ’ (U+2019); they have no glyph for U+02BC ʼ, so a translation using it would print its
  // apostrophes in a system font (src/styles/scripts.css).
  it('uses ’ for apostrophes, never U+02BC', () => {
    const files = {
      ...import.meta.glob<string>(['./*/*.ts', '!./en/**'], { query: '?raw', import: 'default', eager: true }),
      ...import.meta.glob<string>('../../api/_lib/i18n/card/*.ts', { query: '?raw', import: 'default', eager: true }),
    }
    expect(Object.keys(files).length).toBeGreaterThan(100)
    expect(Object.keys(files).filter((f) => files[f].includes('\u02bc'))).toEqual([])
  })
})

export type { Locale }
