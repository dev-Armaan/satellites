/**
 * Searching in the visitor's own names (./exonymSearch.ts through geocode.ts searchPlaces): a query typed as the
 * language writes a place finds it in the offline list, ranked as the place itself, with no network when the list
 * knows it. The real offline list (public/places) and the real generated tables.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { setBundleForTests } from '@/i18n/runtime'
import viExonyms from '@/i18n/vi/exonyms'
import deExonyms from '@/i18n/de/exonyms'
import itExonyms from '@/i18n/it/exonyms'
import ukExonyms from '@/i18n/uk/exonyms'
import ruExonyms from '@/i18n/ru/exonyms'
import faExonyms from '@/i18n/fa/exonyms'
import hiExonyms from '@/i18n/hi/exonyms'
import deNames from '@/i18n/de/exonyms.gen'
import itNames from '@/i18n/it/exonyms.gen'
import ukNames from '@/i18n/uk/exonyms.gen'
import ruNames from '@/i18n/ru/exonyms.gen'
import faNames from '@/i18n/fa/exonyms.gen'
import hiNames from '@/i18n/hi/exonyms.gen'
import { exonymSearch, typedKey } from './exonymSearch'
import type { Place } from '@/types'
import { displayLabel, displaySublabel, reversePlace, searchPlaces } from './geocode'
import { OPEN_METEO_GEOCODE } from './endpoints'
import { englishCountryKey, ensureExonyms, exonymAlternates, exonymHome } from './exonyms'
import { countryName, LIST_COUNTRY_NAMES, parsePlaces, searchLocal, shownCountryName } from './localPlaces'
import { PLACES_VERSION } from './localPlaces.gen'
import { placeKey } from './placeKey'

const FILES = import.meta.glob<string>('/public/places/**/*.txt', { query: '?raw', import: 'default' })
// Node's file system by a runtime specifier (the app's tsconfig has no Node types), as src/styles/scriptFonts.test.ts.
interface NodeFs {
  readdirSync(path: string): string[]
  readFileSync(path: string, encoding: 'utf8'): string
}
const fs = (await import('node:fs' as string)) as NodeFs

/** Serves the committed place files; any other request (a network geocoder) is recorded and answered empty. */
function serveFiles() {
  const f = vi.fn(async (input: string) => {
    const url = String(input)
    if (url.startsWith('/places/')) {
      const file = FILES[`/public${url}`]
      return file ? new Response(await file()) : new Response('', { status: 404 })
    }
    return Response.json({ results: [], features: [] })
  })
  vi.stubGlobal('fetch', f)
  return { network: () => f.mock.calls.map((c) => String(c[0])).filter((u) => !u.startsWith('/places/')) }
}

/** Each language's own countries, as its namespace gives them (a name at home leads the same name abroad). */
const HOME = { de: deExonyms, it: itExonyms, uk: ukExonyms, ru: ruExonyms, vi: viExonyms, fa: faExonyms, hi: hiExonyms }

const as = async (locale: keyof typeof HOME, names?: string) => {
  const { home, umlauts } = HOME[locale]
  setBundleForTests(locale, { exonyms: names === undefined ? viExonyms : { names, countries: true, home, umlauts } })
  await ensureExonyms()
}

describe('typedKey', () => {
  it('folds a name as it is typed in each script', () => {
    expect(typedKey('Hà Nội')).toBe(typedKey('ha noi'))
    expect(typedKey('Đà Nẵng')).toBe('da nang')
    expect(typedKey('Москва')).toBe(typedKey('МОСКВА'))
    expect(typedKey('Кам’янське')).toBe(typedKey("Кам'янське"))
    expect(typedKey('كرج')).toBe(typedKey('کرج')) // Arabic kaf, Persian kaf
    expect(typedKey('يزد')).toBe(typedKey('یزد'))
    expect(typedKey('می\u200cشود')).toBe(typedKey('میشود')) // the zero-width non-joiner
    expect(typedKey('ग़ाज़ियाबाद')).toBe(typedKey('गाजियाबाद')) // the nukta
    expect(typedKey('मुंबई')).not.toBe(typedKey('मंबई')) // vowel signs kept
    // As keyboards type them: Persian without its madda or hamza, Ukrainian on a Russian layout or with a Latin i,
    // Hindi with a half nasal or chandrabindu for the anusvara, and ॉ for ा.
    expect(typedKey('اسلام اباد')).toBe(typedKey('اسلام آباد'))
    expect(typedKey('اذربایجان')).toBe(typedKey('آذربایجان'))
    expect(typedKey('قایم شهر')).toBe(typedKey('قائم شهر'))
    expect(typedKey('харкив')).toBe(typedKey('Харків'))
    expect(typedKey('Кривий Рiг')).toBe(typedKey('Кривий Ріг'))
    expect(typedKey('Белгород')).toBe(typedKey('Бєлгород'))
    expect(typedKey('मुम्बई')).toBe(typedKey('मुंबई'))
    expect(typedKey('चण्डीगढ़')).toBe(typedKey('चंडीगढ़'))
    expect(typedKey('रांची')).toBe(typedKey('राँची'))
    expect(typedKey('मास्को')).toBe(typedKey('मॉस्को'))
    expect(typedKey('Hanoi')).toBe('hanoi') // Latin stays Latin
  })
})

describe('exonymSearch', () => {
  const T = 'VN:Ho Chi Minh City=Thành phố Hồ Chí Minh;Hanoi=Hà Nội;*Hanoi=Hà Nội;~Ho Chi Minh City=Sài Gòn|CN:Hainan=Hải Nam'
  const key = (cc: string) => cc.toLowerCase()

  it('finds a name exactly, by its start, by its later words, and by a search name, best first', () => {
    const find = (q: string) => exonymSearch(T, q, key).map((a) => `${a.cc}:${a.key}:${a.kind}${a.exact ? '!' : ''}`)
    expect(find('Hà Nội')).toEqual(['VN:hanoi:town!', 'VN:hanoi:region!'])
    expect(find('ha noi')).toEqual(['VN:hanoi:town!', 'VN:hanoi:region!'])
    expect(find('Hồ Chí Minh')).toEqual(['VN:ho chi minh city:town']) // the name after its class noun, not whole
    expect(find('Sài Gòn')).toEqual(['VN:ho chi minh city:town!'])
    expect(find('ha')).toEqual(['VN:hanoi:town', 'VN:hanoi:region', 'CN:hainan:town'])
    expect(find('xyz')).toEqual([])
  })

  it('puts the home country’s names first among those a query only starts, before the cap', () => {
    const T2 = 'CN:Hainan=Hải Nam;Henan=Hà Nam;Wuhan=Vũ Hán;Hangzhou=Hàng Châu;Hengyang=Hành Dương;Hanzhong=Hán Trung;Hanchuan=Hán Xuyên|VN:Hanoi=Hà Nội'
    const find = (home: string[]) => exonymSearch(T2, 'Hà N', key, [], home).map((a) => a.key)
    expect(find([])).not.toContain('hanoi')
    expect(find(['VN'])[0]).toBe('hanoi')
  })

  it('looks a name two English names share up under both, as one place', () => {
    const r = exonymSearch('UA:Zaporizhzhia=Saporischschja;Zaporizhzhya=Saporischschja;*Zaporizhzhia=Oblast Saporischschja', 'Saporischschja', key)
    expect(r.map((a) => [a.key, a.kind, a.also])).toEqual([
      ['zaporizhzhia', 'town', ['zaporizhzhya']],
      ['zaporizhzhia', 'region', undefined],
    ])
  })

  it('finds a region by its own label too', () => {
    const r = exonymSearch('IR:Qom=قم;*Qom Province=قم;#Qom Province=استان قم', 'استان قم', key)
    expect(r.map((a) => [a.key, a.kind, a.exact])).toEqual([['qom province', 'region', true]])
  })

  it('finds a German name typed without its umlauts', () => {
    const r = exonymSearch('DE:Cologne=Köln|VN:Thai Nguyen=Thái Nguyên', 'Koeln', key)
    expect(r).toEqual([{ key: 'cologne', cc: 'DE', kind: 'town', exact: true, shown: 'Köln' }])
  })

  it('finds a country by a name the language types for it, shown as the browser names it', () => {
    const r = exonymSearch(T, 'Белоруссия', key, [{ compact: typedKey('Белоруссия').replace(/ /g, ''), cc: 'BY', shown: 'Беларусь' }])
    expect(r).toEqual([{ key: 'by', cc: 'BY', kind: 'country', exact: true, shown: 'Беларусь' }])
  })

  it('finds the countries the browser names in the language', () => {
    const r = exonymSearch(T, 'Đức', key, [{ compact: typedKey('Đức'), cc: 'DE', shown: 'Đức' }])
    expect(r).toEqual([{ key: 'de', cc: 'DE', kind: 'country', exact: true, shown: 'Đức' }])
  })
})

describe('searching in the visitor’s own names (real data)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    setBundleForTests('en', null)
  })

  it('ranks the capital Hà Nội above the hamlet of that name, and finds it however it is typed', async () => {
    serveFiles()
    await as('vi')
    for (const q of ['Hà Nội', 'Ha Noi', 'ha noi']) {
      const r = await searchLocal(q, undefined, 6, exonymAlternates(q, countryName))
      expect(r[0]).toMatchObject({ name: 'Hanoi', cc: 'VN', exact: true, lat: 21.024 })
      expect(r[1]).toMatchObject({ name: 'Hanoi', cc: 'VN', p: 0, lat: 20.328 }) // the hamlet in Ninh Bình, below
    }
    const hcmc = await searchPlaces('Sài Gòn')
    expect(hcmc[0]).toMatchObject({ label: 'Ho Chi Minh City', countryCode: 'vn' })
    expect(displayLabel(hcmc[0])).toBe('Thành phố Hồ Chí Minh')
  })

  it('settles a name shared by places: home first, the place named as typed, the town before its region', async () => {
    serveFiles()
    await as('vi')
    const first = async (q: string) => (await searchLocal(q, undefined, 6, exonymAlternates(q, countryName), exonymHome()))[0]
    expect(await first('Thái Nguyên')).toMatchObject({ cc: 'VN' }) // not Taiyuan, which Vietnamese also calls so
    expect(await first('thai nguyen')).toMatchObject({ cc: 'VN' })
    expect(await first('Nha Trang')).toMatchObject({ name: 'Nha Trang', cc: 'VN' }) // not Nhà Trắng, the White House
    // A landmark's name stands for the landmark only: White House, Tennessee is not Nhà Trắng.
    const nhaTrang = await searchLocal('Nhà Trắng', undefined, 6, exonymAlternates('Nhà Trắng', countryName), exonymHome())
    expect(nhaTrang.filter((r) => r.name === 'White House').map((r) => r.kind)).toEqual(['l'])
    expect(await first('Luân Đôn')).toMatchObject({ name: 'London', cc: 'GB' }) // not Tower Bridge, Cầu Tháp Luân Đôn
    await as('fa', faNames)
    expect(await first('لندن')).toMatchObject({ name: 'London', cc: 'GB' }) // not Heathrow, فرودگاه هیترو لندن
  })

  it('answers a Cyrillic query offline when the table knows the place, and asks the network when it does not', async () => {
    const files = serveFiles()
    await as('ru', ruNames)
    const moscow = await searchPlaces('Москва')
    expect(moscow[0]).toMatchObject({ label: 'Moscow', countryCode: 'ru' })
    expect(displayLabel(moscow[0])).toBe('Москва')
    expect((await searchPlaces('Киев'))[0]).toMatchObject({ label: 'Kyiv', countryCode: 'ua' })
    expect(files.network()).toEqual([])
    // As it is typed, the city leads its landmarks (a prefix with few rows may still ask the network, as in English).
    expect((await searchPlaces('Моск'))[0]).toMatchObject({ label: 'Moscow' })
    await searchPlaces('Урюпинская улица')
    expect(files.network().length).toBeGreaterThan(0)
  })

  it('in Ukrainian, Persian and Hindi too, with the place shown in that language', async () => {
    serveFiles()
    await as('uk', ukNames)
    expect(displayLabel((await searchPlaces('Харків'))[0])).toBe('Харків')
    await as('fa', faNames)
    const tehran = (await searchPlaces('تهران'))[0]
    expect(tehran).toMatchObject({ label: 'Tehran', countryCode: 'ir' })
    expect(displayLabel(tehran)).toBe('تهران')
    expect((await searchPlaces('كرج'))[0]).toMatchObject({ label: 'Karaj' }) // typed with the Arabic kaf
    await as('hi', hiNames)
    const delhi = (await searchPlaces('नई दिल्ली'))[0]
    expect(delhi).toMatchObject({ label: 'New Delhi', countryCode: 'in' })
    expect(displayLabel(delhi)).toBe('नई दिल्ली')
  })

  it('reads a Latin query’s own files while the names download, and shows nothing before they are in', async () => {
    const asked: string[] = []
    vi.stubGlobal('fetch', async (input: string) => {
      const url = String(input)
      asked.push(url)
      const file = FILES[`/public${url}`]
      return file ? new Response(await file()) : Response.json({ results: [], features: [] })
    })
    // Fresh modules: the files earlier tests read stay in memory.
    vi.resetModules()
    const runtime = await import('@/i18n/runtime')
    const geocode = await import('./geocode')
    let arrive: (() => void) | undefined
    const ns: { names: string; countries: boolean; load: () => Promise<void> } = {
      names: '',
      countries: true,
      load: () => new Promise<void>((done) => (arrive = () => ((ns.names = ruNames), done()))),
    }
    runtime.setBundleForTests('ru', { exonyms: ns })
    let found: Place[] | undefined
    const search = geocode.searchPlaces('Paris').then((r) => (found = r))
    await vi.waitFor(() => expect(arrive).toBeDefined())
    const files = [`/places/${PLACES_VERSION}/s/pari.txt`, `/places/${PLACES_VERSION}/l.txt`]
    await vi.waitFor(() => expect(asked).toEqual(expect.arrayContaining(files)))
    await new Promise((r) => setTimeout(r, 50))
    expect(found).toBeUndefined()
    arrive?.()
    await search
    expect(geocode.displayLabel(found![0])).toBe('Париж')
    expect(asked.filter((u) => u === files[0])).toHaveLength(1) // read once
    runtime.setBundleForTests('en', null)
  })

  it('shows nothing of a search or a pin before the table is in, so its names never change once shown', async () => {
    serveFiles()
    let arrive: (() => void) | undefined
    const ns: { names: string; countries: boolean; load: () => Promise<void> } = {
      names: '',
      countries: true,
      load: () => new Promise<void>((done) => (arrive = () => ((ns.names = ruNames), done()))),
    }
    setBundleForTests('ru', { exonyms: ns })
    let found: Awaited<ReturnType<typeof searchPlaces>> | undefined
    let pinned: Awaited<ReturnType<typeof reversePlace>> | undefined
    const search = searchPlaces('Москва').then((r) => (found = r))
    const pin = reversePlace(55.756, 37.617).then((p) => (pinned = p))
    await vi.waitFor(() => expect(arrive).toBeDefined())
    await new Promise((r) => setTimeout(r, 50))
    expect([found, pinned]).toEqual([undefined, undefined])
    arrive?.()
    await Promise.all([search, pin])
    expect(displayLabel(found![0])).toBe('Москва')
    expect(displayLabel(pinned!)).toBe('Москва')
  })

  it('finds what the native review typed (2026-11-22), offline and first', async () => {
    const files = serveFiles()
    const first = async (q: string) => (await searchPlaces(q))[0]
    await as('de', deNames)
    expect(await first('Kiew')).toMatchObject({ label: 'Kyiv', countryCode: 'ua' })
    expect(await first('Koeln')).toMatchObject({ label: 'Köln', countryCode: 'de' })
    expect(await first('Bodensee')).toMatchObject({ label: 'Lake Constance', countryCode: 'de' })
    const kherson = await first('Cherson')
    expect([kherson.label, displayLabel(kherson)]).toEqual(['Kherson', 'Cherson']) // the city, not its oblast
    // Umlauts typed out, for towns the table has no entry for; an old name's landmark row gives way to the city.
    expect(await first('Muenster')).toMatchObject({ label: 'Münster', countryCode: 'de' })
    expect(await first('Luebeck')).toMatchObject({ label: 'Lübeck', countryCode: 'de' })
    expect(await first('Peking')).toMatchObject({ label: 'Beijing', countryCode: 'cn' })
    // The table writes a geocoder's spelling first, which the list has no row for: the city still leads its oblast.
    expect(await first('Saporischschja')).toMatchObject({ label: 'Zaporizhzhya', countryCode: 'ua', lat: 47.852 })
    expect(await first('Mykolajiw')).toMatchObject({ label: 'Mykolayiv', countryCode: 'ua', lat: 46.976 })
    await as('it', itNames)
    expect(await first('Kiev')).toMatchObject({ label: 'Kyiv', countryCode: 'ua' })
    expect(await first('Betlemme')).toMatchObject({ label: 'Bethlehem', countryCode: 'ps' }) // not a hamlet in Apulia
    await as('vi')
    // The city before the province the table names alike, however either was found; an exact name at home first.
    for (const [q, label] of [['Huế', 'Huế'], ['hue', 'Huế'], ['Thanh Hoá', 'Thanh Hóa'], ['Hải Phòng', 'Haiphong'], ['hai phong', 'Haiphong']])
      expect([q, (await first(q)).label, (await first(q)).kind]).toEqual([q, label, undefined])
    expect(await first('Quận 1')).toMatchObject({ label: 'Quận Một' })
    // Two rows that read alike within 25 km are one (the city and the province around it, a city-state and its state).
    expect((await searchPlaces('Huế')).filter((p) => displayLabel(p) === 'Huế')).toHaveLength(1)
    await as('it', itNames)
    expect((await searchPlaces('Berlino')).map(displayLabel)).toEqual(['Berlino'])
    await as('uk', ukNames)
    expect(await first('харкив')).toMatchObject({ label: 'Kharkiv' }) // и for і, from a Russian layout
    expect(await first('Киев')).toMatchObject({ label: 'Kyiv' }) // a search name, never shown
    expect(displayLabel(await first('Бунге'))).toBe('Бунге')
    setBundleForTests('ru', { exonyms: { ...ruExonyms, names: ruNames } })
    await ensureExonyms()
    expect(await first('Белоруссия')).toMatchObject({ label: 'Belarus', countryCode: 'by' }) // a search name for it
    await as('ru', ruNames)
    const murmansk = await first('Мурманск')
    expect([murmansk.label, murmansk.kind, displayLabel(murmansk)]).toEqual(['Murmansk', undefined, 'Мурманск'])
    await as('fa', faNames)
    expect(displayLabel(await first('اسلام اباد'))).toBe('اسلام\u200cآباد') // typed without its madda
    expect(await first('قدس')).toMatchObject({ label: 'Jerusalem' }) // not Shahr-e Qods, شهر قدس
    await as('hi', hiNames)
    expect(await first('मुम्बई')).toMatchObject({ label: 'Mumbai' })
    expect(displayLabel(await first('बर्न'))).toBe('बर्न')
    expect(files.network()).toEqual([])
  })

  it('finds what the third review typed (2026-11-22), offline and first, shown in the language', async () => {
    const files = serveFiles()
    const first = async (q: string) => (await searchPlaces(q))[0]
    const shown = async (q: string) => displayLabel(await first(q))
    await as('de', deNames)
    for (const [q, name] of [['Tschernobyl', 'Tschernobyl'], ['Vesuv', 'Vesuv'], ['Eiffelturm', 'Eiffelturm'], ['Gardasee', 'Gardasee'], ['Slowjansk', 'Slowjansk'], ['Straße von Hormus', 'Straße von Hormus'], ['Vierwaldstättersee', 'Vierwaldstättersee']])
      expect([q, await shown(q)]).toEqual([q, name])
    expect(await first('Rjasan')).toMatchObject({ label: 'Ryazan’', countryCode: 'ru' }) // the city before its oblast
    await as('it', itNames)
    for (const [q, name] of [['Striscia di Gaza', 'Striscia di Gaza'], ['Cisgiordania', 'Cisgiordania'], ['Piazza San Pietro', 'Piazza San Pietro'], ['Fontana di Trevi', 'Fontana di Trevi'], ['Pirenei', 'Pirenei'], ['Gomel', 'Gomel']])
      expect([q, await shown(q)]).toEqual([q, name])
    await as('uk', ukNames)
    for (const [q, name] of [['Газа', 'Газа'], ['Венеція', 'Венеція'], ['Перська затока', 'Перська затока'], ['Говерла', 'Говерла'], ['Борщагівка', 'Борщагівка']])
      expect([q, await shown(q)]).toEqual([q, name])
    expect(await first('Луганск')).toMatchObject({ label: 'Luhansk' }) // its Russian spelling, a search name
    await as('ru', ruNames)
    for (const [q, name] of [['Краматорск', 'Краматорск'], ['Этна', 'Этна'], ['Алушта', 'Алушта']]) expect([q, await shown(q)]).toEqual([q, name])
    await as('vi')
    expect(await first('Quần đảo Hoàng Sa')).toMatchObject({ lat: 16.5, lon: 112 })
    expect(await first('Sapa')).toMatchObject({ label: 'Sa Pa', countryCode: 'vn' })
    // The bare names find the archipelagos first: «Trường Sa» is also Changsha (Trường Sa, Hồ Nam) and three namesakes.
    expect(await first('Trường Sa')).toMatchObject({ lat: 10, lon: 114 })
    expect(await first('Truong Sa')).toMatchObject({ lat: 10, lon: 114 })
    // «Hoàng Sa» is Vietnam's own district for the Paracels first (Đà Nẵng), then the archipelago.
    const paracels = await searchPlaces('Hoàng Sa')
    expect(paracels[0]).toMatchObject({ countryCode: 'vn' })
    expect(paracels.slice(0, 4).some((p) => p.lat === 16.5 && p.lon === 112)).toBe(true)
    await as('fa', faNames)
    for (const [q, name] of [['غزه', 'غزه'], ['تخت جمشید', 'تخت جمشید'], ['آلماتی', 'آلماتی'], ['کیش', 'کیش']]) expect([q, await shown(q)]).toEqual([q, name])
    await as('hi', hiNames)
    for (const [q, name] of [['टेक्सास', 'टेक्सास'], ['वुहान', 'वुहान'], ['लेह', 'लेह'], ['एफ़िल टॉवर', 'एफ़िल टॉवर']]) expect([q, await shown(q)]).toEqual([q, name])
    expect(files.network()).toEqual([])
  })

  it('shows one row of those that read alike in one country, the best-ranked', async () => {
    serveFiles()
    const read = (ps: Place[]) => ps.map((p) => `${displayLabel(p)} · ${displaySublabel(p) ?? ''}`)
    // The city and two villages of that name in its oblast; the capital and a hamlet; the country and its region.
    await as('uk', ukNames)
    const zaporizhzhia = await searchPlaces('Запоріжжя')
    expect([read(zaporizhzhia), zaporizhzhia[0].lat]).toEqual([['Запоріжжя · Запорізька область, Україна'], 47.852])
    await as('ru', ruNames)
    expect(read(await searchPlaces('Запорожье'))).toEqual(['Запорожье · Запорожская область, Украина'])
    await as('vi')
    expect((await searchPlaces('Hà Nội')).map((p) => [p.label, p.lat])).toEqual([['Hanoi', 21.024]])
    expect((await searchPlaces('Đài Loan')).map((p) => [displayLabel(p), p.kind])).toEqual([['Đài Loan', undefined]])
    // A country and its capital that read alike are two places, both shown.
    await as('ru', ruNames)
    const djibouti = await searchPlaces('Джибути')
    const rows = djibouti.map((p) => [displayLabel(p), p.lat.toFixed(1)]).sort()
    expect(rows).toEqual([['Джибути', '11.6'], ['Джибути', '11.8']])
    // English shows each row as it came.
    setBundleForTests('en', null)
    expect(read(await searchPlaces('Zaporizhzhya'))).toEqual(Array(3).fill('Zaporizhzhya · Zaporizhzhia, Ukraine'))
  })

  it('finds every Ukrainian oblast offline, by its name in the language and in English', async () => {
    const files = serveFiles()
    const first = async (q: string) => (await searchPlaces(q))[0]
    const oblast = (lat: number) => expect.objectContaining({ kind: 'region', countryCode: 'ua', lat })
    // Named after their capitals in GeoNames, these had no row (scripts/regions.ts): the network answered, or streets.
    const asks = [
      ['uk', ukNames, ['Харківська область', 'Одеська область', 'Херсонська область']],
      ['ru', ruNames, ['Харьковская область', 'Одесская область', 'Херсонская область']],
    ] as const
    for (const [lang, names, qs] of asks) {
      await as(lang, names)
      for (const [q, lat] of qs.map((q, i) => [q, [49.617, 46.458, 46.641][i]] as const))
        expect([q, await first(q)]).toEqual([q, oblast(lat)])
    }
    expect(displayLabel(await first('Луганская область'))).toBe('Луганская область')
    expect(files.network()).toEqual([])
    // English finds them by name, and its city first by the city's.
    setBundleForTests('en', null)
    expect(await first('Kharkiv Oblast')).toEqual(oblast(49.617))
    expect(await first('Kharkiv')).toMatchObject({ label: 'Kharkiv', lat: 49.982 })
    // The oblasts the list always had keep their rows: what English finds for Mykolaiv (GeoNames' city is Mykolayiv).
    for (const q of ['Mykolaiv', 'Vinnytsia', 'Zaporizhzhia', 'Kirovohrad']) expect((await first(q)).label).toBe(q)
    expect(files.network()).toEqual([])
  })

  it('counts the places found, not the rows shown, before it asks the network', async () => {
    // The city and its two namesake villages are three places offline, enough as in English, shown as one row.
    const files = serveFiles()
    const typing = (word: string) => Array.from({ length: word.length - 1 }, (_, i) => word.slice(0, i + 2))
    await as('uk', ukNames)
    for (const q of typing('Запоріжжя')) await searchPlaces(q)
    expect((await searchPlaces('Запоріж')).map((p) => displayLabel(p))).toEqual(['Запоріжжя'])
    await as('ru', ruNames)
    for (const q of typing('Запорожье')) await searchPlaces(q)
    const zaporozhye = (await searchPlaces('Запорож')).map((p) => displayLabel(p))
    expect(zaporozhye.sort()).toEqual(['Запорожская область', 'Запорожье'])
    await as('vi')
    for (const q of ['Đài L', 'Đài Lo']) await searchPlaces(q)
    expect(files.network()).toEqual([])
  })

  it('keeps rows that read otherwise: a city whose where line repeats its name, a namesake abroad', async () => {
    const geocoder = (name: string, admin1: string, cc: string, country: string, lat: number, ADM1 = false) => ({
      name,
      latitude: lat,
      longitude: 30,
      country_code: cc,
      country,
      admin1,
      population: 1000,
      ...(ADM1 ? { feature_code: 'ADM1' } : {}),
    })
    vi.stubGlobal('fetch', async (input: string) => {
      const url = String(input)
      const file = url.startsWith('/places/') ? FILES[`/public${url}`] : undefined
      if (url.startsWith('/places/')) return file ? new Response(await file()) : new Response('', { status: 404 })
      if (!url.startsWith(OPEN_METEO_GEOCODE)) return Response.json({ features: [] })
      return Response.json({
        results: [
          geocoder('Qwertyburg', 'Qwertyburg Krai', 'RU', 'Russia', 50),
          geocoder('Qwertyburg Krai', '', 'RU', 'Russia', 51, true),
          geocoder('Qwertyburg', 'Tver Oblast', 'RU', 'Russia', 52),
          geocoder('Qwertyburg', 'Tver Oblast', 'RU', 'Russia', 54),
          geocoder('Qwertyburg', 'Tver Oblast', 'BY', 'Belarus', 56),
        ],
      })
    })
    // A city and its region named alike, as Санкт-Петербург is; two towns alike in one oblast; one in another country.
    const table = 'RU:Qwertyburg=Квертиград;*Qwertyburg Krai=Квертиград;*Tver Oblast=Тверская область'
    await as('ru', `${table}|BY:Qwertyburg=Квертиград`)
    const read = (ps: Place[]) => ps.map((p) => `${displayLabel(p)} · ${displaySublabel(p) ?? ''}`)
    expect(read(await searchPlaces('Qwertyburg'))).toEqual([
      'Квертиград · Квертиград, Россия',
      'Квертиград · Россия',
      'Квертиград · Тверская область, Россия',
      'Квертиград · Tver Oblast, Беларусь',
    ])
  })

  it('keeps the country where a region ranked above it reads alike', async () => {
    // No offline list (its files will not load): the geocoder's region, then its country 50 km off, both Đài Loan.
    const taiwan = (feature_code: string, population: number, latitude: number) =>
      ({ name: 'Taiwan', latitude, longitude: 121, country_code: 'TW', country: 'Taiwan', feature_code, population })
    const results = [taiwan('ADM1', 2, 24), taiwan('PCLI', 1, 23.5)]
    vi.stubGlobal('fetch', async (input: string) =>
      String(input).startsWith(OPEN_METEO_GEOCODE) ? Response.json({ results }) : new Response('', { status: 404 }),
    )
    // Fresh modules: the files earlier tests read stay in memory, and the list knows Taiwan.
    vi.resetModules()
    const runtime = await import('@/i18n/runtime')
    const geocode = await import('./geocode')
    runtime.setBundleForTests('vi', { exonyms: (await import('@/i18n/vi/exonyms')).default })
    await (await import('./exonyms')).ensureExonyms()
    const rows = await geocode.searchPlaces('Taiwan')
    expect(rows.map((p) => [geocode.displayLabel(p), p.kind])).toEqual([['Đài Loan', undefined]])
    runtime.setBundleForTests('en', null)
  })

  it('finds a country the list names otherwise by the browser’s name for it, offline and first', async () => {
    const files = serveFiles()
    const first = async (q: string) => (await searchPlaces(q))[0]
    const palestine = { label: 'Palestinian Territory', countryCode: 'ps' }
    // The list says Palestinian Territory (GeoNames), the browser Palestine or Palestinian Territories (CLDR).
    const asks: [keyof typeof HOME, string, string[]][] = [
      ['ru', ruNames, ['Палестина', 'Палестинские территории']],
      ['uk', ukNames, ['Палестина']],
      ['fa', faNames, ['فلسطین']],
      ['hi', hiNames, ['फ़िलिस्तीन', 'फिलिस्तीन']],
      ['it', itNames, ['Palestina']],
      ['de', deNames, ['Palästina', 'Palästinensische Autonomiegebiete']],
    ]
    for (const [lang, names, qs] of asks) {
      await as(lang, names)
      for (const q of qs) expect([lang, q, await first(q)]).toMatchObject([lang, q, palestine])
    }
    // And in a file of its own name, not the browser's: The Netherlands, Ivory Coast, Democratic Republic of the Congo.
    await as('de', deNames)
    expect(await first('Niederlande')).toMatchObject({ label: 'The Netherlands', countryCode: 'nl' })
    expect(await first('Türkei')).toMatchObject({ label: 'Turkey', countryCode: 'tr' })
    await as('vi')
    expect(await first('Thành Vatican')).toMatchObject({ countryCode: 'va' })
    expect(await first('Hà Lan')).toMatchObject({ label: 'The Netherlands', countryCode: 'nl' })
    expect(await first('Thổ Nhĩ Kỳ')).toMatchObject({ label: 'Turkey', countryCode: 'tr' })
    await as('ru', ruNames)
    expect(await first('Кот-д’Ивуар')).toMatchObject({ label: 'Ivory Coast', countryCode: 'ci' })
    const congo = { label: 'Democratic Republic of the Congo', countryCode: 'cd' }
    expect(await first('Конго - Киншаса')).toMatchObject(congo)
    expect(await first('Мьянма (Бирма)')).toMatchObject({ label: 'Myanmar', countryCode: 'mm' })
    // A code the browser reads as another's (CS, Serbia and Montenegro, as Serbia) is not that country.
    expect((await searchPlaces('Сербия')).map((p) => p.label)).toEqual(['Serbia'])
    expect(files.network()).toEqual([])
  })

  it('names a country the list names otherwise as its where line does, and as it came in English', async () => {
    serveFiles()
    const first = async (q: string) => (await searchPlaces(q))[0]
    await as('de', deNames)
    const typed = await first('Palestinian')
    expect([typed.label, displayLabel(typed)]).toEqual(['Palestinian Territory', 'Palästinensische Autonomiegebiete'])
    for (const q of ['Niederlande', 'Türkei', 'Côte d’Ivoire']) expect(displayLabel(await first(q))).toBe(q)
    await as('ru', ruNames)
    expect(displayLabel(await first('Палестина'))).toBe(shownCountryName('PS', 'ru'))
    for (const q of ['Турция', 'Кот-д’Ивуар', 'Нидерланды']) expect(displayLabel(await first(q))).toBe(q)
    await as('vi')
    for (const q of ['Hà Lan', 'Thổ Nhĩ Kỳ']) expect(displayLabel(await first(q))).toBe(q)
    setBundleForTests('en', null)
    expect(displayLabel(await first('Palestin'))).toBe('Palestinian Territory')
  })

  it('names a country as the list does before its file is read, and the same after', async () => {
    // Open-Meteo names a country as GeoNames does, so as the list does (Ivory Coast), whatever list files were read.
    vi.stubGlobal('fetch', async (input: string) => {
      const file = FILES[`/public${String(input)}`]
      return file ? new Response(await file()) : Response.json({ results: [], features: [] })
    })
    // Fresh modules: the files earlier tests read stay in memory.
    vi.resetModules()
    const runtime = await import('@/i18n/runtime')
    const geocode = await import('./geocode')
    const { shownCountryName } = await import('./localPlaces')
    runtime.setBundleForTests('ru', { exonyms: { names: ruNames, countries: true } })
    await (await import('./exonyms')).ensureExonyms()
    const geocoded = { label: 'Ivory Coast', countryCode: 'ci' }
    const shown = geocode.displayLabel(geocoded)
    // The list's file for it, with its country row.
    expect((await geocode.searchPlaces('Ivory Coast'))[0]).toMatchObject(geocoded)
    expect([shown, geocode.displayLabel(geocoded)]).toEqual(Array(2).fill(shownCountryName('CI', 'ru')))
    runtime.setBundleForTests('en', null)
  })

  it('knows the list’s own name for each country it names otherwise than the browser', () => {
    const dir = decodeURIComponent(new URL(`../../public/places/${PLACES_VERSION}/s/`, import.meta.url).pathname)
    const rows = fs
      .readdirSync(dir)
      .flatMap((f) => parsePlaces(fs.readFileSync(`${dir}${f}`, 'utf8')))
      .filter((r) => r.kind === 'c' && new Intl.Locale(`und-${r.cc}`).region === r.cc)
    expect(rows.length).toBeGreaterThan(240)
    for (const r of rows) {
      const browser = [countryName(r.cc), shownCountryName(r.cc, 'en')].map(englishCountryKey)
      const listed = placeKey(LIST_COUNTRY_NAMES[r.cc] ?? '')
      expect([r.cc, browser.includes(r.key) || listed === r.key]).toEqual([r.cc, true])
    }
    for (const [cc, name] of Object.entries(LIST_COUNTRY_NAMES))
      expect([cc, rows.find((r) => r.cc === cc)?.key]).toEqual([cc, placeKey(name)])
  })

  it('finds a German or Italian exonym, and a country by the browser’s name for it', async () => {
    serveFiles()
    await as('de', deNames)
    expect((await searchPlaces('München'))[0]).toMatchObject({ label: 'Munich', countryCode: 'de' })
    expect((await searchPlaces('Mailand'))[0]).toMatchObject({ label: 'Milan', countryCode: 'it' })
    const germany = (await searchPlaces('Deutschland'))[0]
    expect(germany).toMatchObject({ label: 'Germany', countryCode: 'de' })
    expect(displayLabel(germany)).toBe('Deutschland')
  })
})
