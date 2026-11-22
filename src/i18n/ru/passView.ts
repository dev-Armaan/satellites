/**
 * Russian copy for the passes: the list grouped by verdict and the view of one pass (see docs/i18n/ru.md §3.5, §3.8,
 * §4.1, §4.2, §5.3, §7, Appendix A).
 *
 * Why it is built this way:
 *  - Every verdict counts passes, so the unit is «пролёт» in ru's four plural forms (1 пролёт · 2 пролёта · 5 пролётов
 *    · 1,5 пролёта) whatever the group; satellites are counted in full words («12 спутников»), never «спутн.».
 *  - Where English writes "all 31 satellites", the count goes in parentheses («Показать все спутники (31)»), so «все»
 *    never has to agree with a number.
 *  - Labels are nouns in sentence case (CSS uppercases them) and fit their nowrap cells; readouts keep the international
 *    forms they arrive in (compass points «SSW», UTC clocks, NORAD ids), and the only abbreviations are units, «восх.»
 *    and «нисх.».
 *  - Off-nadir is «от надира» in labels and readouts; elevation is «над горизонтом», so the geostationary strip cell
 *    needs no unit after its degrees (the label already says "up").
 *  - Footnotes put an absent picture in the genitive of negation («нет снимка»), and the satellite after its head noun
 *    («У спутника Sentinel-2C нет снимка…»), so no name is ever inflected. A row's latest pass is «Последний раз»
 *    (an adverbial phrase that agrees with nothing): «Последний» beside «вс» would read "last Sunday".
 */
import type en from '../en/passView'
import { fmt } from '../../../api/_lib/i18n/format'
import { num, type NumPart } from '../../../api/_lib/i18n/parts'
import type { Verdict } from '@/ui/results/lib/meta'

const f = fmt('ru')

/** A whole count, or a fraction kept (its plural form is `other`) */
const count = (n: number) => (Number.isInteger(n) ? f.int(n) : f.dec(n, 1))
/** «пролёт · пролёта · пролётов · пролёта»: the form a number takes (every verdict counts passes, DESIGN §7) */
const passes = (n: number) => f.plural(n, { one: 'пролёт', few: 'пролёта', many: 'пролётов', other: 'пролёта' })
/** «1 пролёт», «31 пролёт», «12 пролётов» */
const passCount = (n: number) => `${count(n)}\u00a0${passes(n)}`
/** «25 процентов» (spoken: a screen reader reads «%» without its case) */
const percentSpoken = (p: number) => {
  const r = Math.round(p)
  return `${f.int(r)}\u00a0${f.plural(r, { one: 'процент', few: 'процента', many: 'процентов', other: 'процента' })}`
}
/** «Sentinel-2C, вс, 1 нояб., 16:14»: the day already holds a comma, so the clock gets one too */
const who = (sat: string, day: string, time: string) => `${sat}, ${day}, ${time}`
/** «каждую минуту», «раз в 10 минут», «раз в 2 минуты», «раз в 21 минуту» (в + accusative) */
const cadence = (min?: number) =>
  !min
    ? 'раз в несколько минут'
    : min === 1
      ? 'каждую минуту'
      : `раз в ${count(min)}\u00a0${f.plural(min, { one: 'минуту', few: 'минуты', many: 'минут', other: 'минуты' })}`

const passView: typeof en = {
  // ── the list ─────────────────────────────────────────────────────────────────────────────
  empty:
    'За это время над этим местом не пролетел ни один известный нам спутник. Такое бывает редко. Если какой-то источник данных не работал, об этом сказано в примечаниях выше.',
  // After «Увидено ·», cut with an ellipsis in a cell that is 208 px at most (English's 27 characters just fit there):
  // the sort phrase Russian apps use («Сначала новые»), 21 characters. «самый близкий, затем новые» (26) never fits
  // whole; the rows' dates show that the rest run newest first, as French and Dutch leave them to.
  imagedOrder: 'сначала самый близкий',
  count: (n: number, _verdict: Verdict) => passCount(n),
  countStack: (n: number, _verdict: Verdict): NumPart => num(count(n), passes(n)),
  sats: (n: number) => `${count(n)}\u00a0${f.plural(n, { one: 'спутник', few: 'спутника', many: 'спутников', other: 'спутника' })}`,
  showAllSats: (n: number) => `Показать все спутники (${f.int(n)})`,
  showAllRows: (n: number) => `Показать все строки (${f.int(n)})`,
  showMore: (n: number) => `Показать ещё ${f.int(n)}`,
  left: (n: number) => `ещё ${f.int(n)}`,
  showFewer: 'Свернуть',
  tag: {
    mosaic: 'Мозаика',
    radar: 'Радар',
    cloudedPct: (pct: number) => `Облачно · ${f.int(pct)}%`,
    cloudedAtSpot: 'Облака в точке',
  },
  rowLabel: (o: { sat: string; verb: string; day: string; time: string; zone: string; ago: string; cloudPct?: number; clouded: boolean }) =>
    [
      o.sat,
      o.verb,
      `${o.day}, ${o.time}\u00a0${o.zone}`,
      o.ago,
      o.cloudPct !== undefined ? `облачность ${percentSpoken(o.cloudPct)}` : undefined,
      o.clouded ? 'под облаками' : undefined,
    ]
      .filter(Boolean)
      .join(', '),
  offNadir: (deg: number) => `${f.dec(deg, 1)}° от надира`,
  offNadirShort: (deg: number) => `${f.dec(deg, 1)}°`,
  distanceKm: (km: number) => `${f.int(km)}\u00a0км`,
  cloudPct: (pct: number) => `облака ${f.int(pct)}%`,
  expandLabel: (sat: string, day: string, time: string) => `Развернуть снимок: ${who(sat, day, time)}`,
  expandTitle: 'Развернуть снимок',
  satLabel: (o: { sat: string; operator?: string; passes: number; verdict: Verdict; day: string; time: string }) =>
    `${o.sat}${o.operator ? `, ${o.operator}` : ''}, ${passCount(o.passes)}, последний раз: ${o.day}, ${o.time}`,
  latest: 'Последний раз ',
  // The closest approach's label (never «ближайший», which reads "the next one" right under «Последний раз»).
  closest: 'Сближение ',
  cloudChip: 'Облака',

  // ── one pass ─────────────────────────────────────────────────────────────────────────────
  photosSection: 'Снимки',
  planSection: 'Схема пролёта',
  geometry: 'Геометрия',
  replay: 'Повтор',
  fullDiscNote: (pixel: string, cadenceMin?: number) =>
    `Снимок полного диска: один кадр со всем, что видит спутник. Здесь ${pixel} на пиксель. Деталей мало, но снимок настоящий и самый свежий из опубликованных. Такие снимки спутник делал всю неделю ${cadence(cadenceMin)}.`,
  mosaicNote: (gsdM: number) =>
    `Суточная мозаика: NASA каждый день сшивает полосы обзора в один снимок, ${f.int(gsdM)}\u00a0м на пиксель. Деталей мало, но мозаика настоящая и сделана в день этого пролёта.`,
  radarNote:
    'Радарный снимок, а не фотография: спутник Sentinel-1 посылает микроволны и принимает отражённый сигнал, поэтому облака и темнота ему не мешают. Яркость показывает, как сильно поверхность отражает сигнал: здания и неровная земля светлые, спокойная вода тёмная.',
  noImage: {
    openArchive: (sat: string) => `У спутника ${sat} нет снимка этой точки с этого пролёта. Схема пролёта.`,
    // The operator is the satellite's (a company), never «оператор радара», a military job (§8).
    radarPrivate: 'Опубликованного снимка нет: архив оператора этого радарного спутника закрыт. Схема пролёта.',
    commercialPrivate: 'Опубликованного снимка нет: коммерческие архивы закрыты. Схема пролёта.',
    noneToShow: 'С этого пролёта нет снимка, который можно показать. Схема пролёта.',
    archiveDown: 'Архив сейчас не удалось проверить. Схема пролёта.',
    noScene: 'Кадра с этого пролёта нет. Схема пролёта.',
    notYet: 'Опубликованного кадра с этого пролёта пока нет. Кадры Sentinel-2 и Landsat обычно появляются в течение суток.',
    crewed: 'На пилотируемых станциях есть камеры, но их фото не публикуют с привязкой к месту и времени.',
    unavailable: 'Снимок этого пролёта недоступен.',
  },
  links: {
    openToSave: 'Открыть снимок, чтобы сохранить',
    downloading: 'Скачивание…',
    download: 'Скачать снимок',
    viewSource: (archive: string) => `Источник · ${archive}`,
  },
  spot: {
    checking: 'Читаем пиксель в твоей точке…',
    clear: 'Над твоей точкой ясно.',
    cirrus: 'Над твоей точкой отмечены тонкие перистые облака: из-за них снимок может быть менее чётким.',
    cloud: 'Над твоей точкой облака.',
    shadow: 'Твоя точка была в тени от облаков.',
  },

  // ── the readout strip ───────────────────────────────────────────────────────────────────
  strip: {
    altitude: 'Высота',
    elevation: 'Над горизонтом',
    offNadir: 'От надира',
    pixel: 'Пиксель',
    band: 'Канал',
    sun: 'Солнце',
    // «Облака», not «Облачность»: the strip's four cells share a 360 px phone (≈ 62 px a label).
    cloud: 'Облака',
    // Strip labels wrap in a ~75 px cell: the no-break space keeps «в» with its word («ОБЛАКА / В ТОЧКЕ»).
    cloudAtSpot: 'Облака в\u00a0точке',
  },
  band: { infrared: 'Тепловой', visible: 'Видимый', colour: 'Цветной' },
  // Values under «Облака в точке» (≤ 7 characters at 21 px): «Тонкие» reads «облака в точке: тонкие».
  spotValue: { clear: 'Ясно', cirrus: 'Тонкие', cloud: 'Облака', shadow: 'Тень' },
  unit: {
    km: 'км',
    m: 'м',
    kmS: 'км/с',
    // The label «Над горизонтом» already says "up": nothing follows the degrees.
    up: '',
    mosaic: 'мозаика',
    // «25% кадра»: the whole scene's share, in the genitive
    scene: 'кадра',
    sun: { day: 'день', twilight: 'сумерки', night: 'ночь' },
  },

  // ── 01 / Geometry ───────────────────────────────────────────────────────────────────────
  geo: {
    closestUtc: 'Сближение · UTC',
    // «Местное время» alone, as German has «Ortszeit»: it stands beside «Сближение · UTC» in the same row, so the moment
    // is named once. «Сближение · местное» (19) wrapped in its 164 px cell on a 390 px phone while English set one line.
    closestLocal: 'Местное время',
    // Nowrap labels in a ~153 px column (19 characters at most): «До трассы», as the share card says it.
    groundDistance: 'До трассы',
    elevationFromYou: 'Над горизонтом',
    groundSpeed: 'Путевая скорость',
    heading: 'Курс',
    sunElevation: 'Высота Солнца',
    fieldOfRegard: 'Зона обзора',
    swath: 'Полоса обзора',
    inSwath: 'В полосе обзора',
    inView: 'В поле зрения',
    window: 'Окно',
    noradPass: 'NORAD · пролёт',
    // «Линия» alone, as in «Скорость линии» on the same screen: the full term would overflow its cell.
    scanUtc: 'Линия здесь · UTC',
    // The local clock beside «Линия здесь · UTC», as «Местное время» beside «Сближение · UTC».
    scanLocal: 'Местное время',
    aboveEquator: 'Над экватором',
    inYourSky: 'В твоём небе',
    scanDirection: 'Направление линии',
    lineSpeed: 'Скорость линии',
    coverage: 'Охват',
    thisScan: 'Это сканирование',
    noradScan: 'NORAD · скан',
  },
  northToSouth: 'Север → юг',
  southToNorth: 'Юг → север',
  timeRange: (from: string, to: string) => `${from} → ${to}`,
  // A unit after the sun's degrees («31,1° день»): lowercase, as the strip's unit.sun on the same screen.
  sunPhase: { day: 'день', twilight: 'сумерки', night: 'ночь' },
  fullDisc: 'Полный диск',
  // «каждую минуту» for one minute («каждые 1 мин» is not Russian); «каждую 21 мин» agrees with ru's `one`.
  everyMin: (n: number) => (n === 1 ? 'каждую минуту' : `${f.category(n) === 'one' ? 'каждую' : 'каждые'} ${count(n)}\u00a0мин`),
  // The label «В твоём небе» already says "up": the compass point alone (§4.2).
  upCompass: (compass: string) => compass,
  heading: (compass: string, ascending: boolean) => `${compass} · ${ascending ? 'восх.' : 'нисх.'}`,
}
export default passView
