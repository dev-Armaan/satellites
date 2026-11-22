/**
 * Russian copy for the share card and the share page (see docs/i18n/ru.md §3.1, §3.3, §3.4, §3.6, §3.7, §4.2, §5):
 * every word the card prints and every word the server writes around it. Pure TypeScript, no DOM, Node or src/
 * imports: the server reads it through cardMessages('ru'), and the app's ru bundle lists this very module.
 *
 * Why it is built this way:
 *  - Russian cannot inflect an inserted name, so the place stands only where the nominative is grammatical: first, as
 *    a title closed by its full stop (the accent block, «*Waterloo.*»), or after a colon («Waterloo: что смотрело сюда
 *    на этой неделе»). The lead after it points back with «сюда» / «это место» / «над этим местом», and is its own
 *    block.
 *  - The satellite always follows its head noun «спутник» (oblique cases fall on it: «полосу обзора спутника
 *    Sentinel-2C»), and a nameless one is «неизвестный спутник» in the case each sentence needs. These frames get no
 *    satellite category, so a crewed station is «спутник» too (true: a station is an artificial satellite).
 *  - Counts wrap the words that agree with them (21 → «смотрел 21 спутник», «Опубликован 21 снимок»; 22 → «смотрели
 *    22 спутника»); zero is its own sentence («ни один известный нам спутник», «ни одного снимка»); "at least" is «как
 *    минимум», which governs no case. Numbers and units are tied with a no-break space.
 *  - Dates come from Intl's parts at the place's zone, without Intl's «г.» in stamps («вс, 1 нояб. 2026»); in prose the
 *    genitive month and «года» («1 ноября 2026 года»), never a weekday after a preposition; the clock follows «в».
 *  - Prose compass words are Russian (на + accusative: «двигаясь на юго-запад»).
 *  - The default card's hero is five one-word lines: «На этой неделе» (478 px) and «что-то смотрело» (523 px) are both
 *    wider than the 466 px column at the card's 88 px, so no phrase of the landing's three lines fits whole (§3.1).
 */
import { fmt } from '../format.js'
import { dateFormat } from '../dates.js'
import { accent, type Rich } from '../parts.js'
import type { CardMessages, CardWhen, PassFacts, SatName } from './index.js'

const f = fmt('ru')

// ── Days at the place, from Intl's parts ────────────────────────────────────────────────────────────────────────────

const SHORT_DAY: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }
const LONG_DAY: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }

function dayParts(ms: number, timeZone: string, opts: Intl.DateTimeFormatOptions) {
  const parts = dateFormat('ru', timeZone, opts).formatToParts(ms)
  const get = (t: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === t)?.value ?? ''
  return { weekday: get('weekday'), day: get('day'), month: get('month'), year: get('year') }
}
/** «вс, 1 нояб. 2026»: the card is the one place a short date carries the year (no «г.») */
const dayYear = (ms: number, timeZone: string) => {
  const d = dayParts(ms, timeZone, SHORT_DAY)
  return `${d.weekday}, ${d.day}\u00a0${d.month} ${d.year}`
}
/** «1 нояб. 2026» */
const dateYear = (ms: number, timeZone: string) => {
  const d = dayParts(ms, timeZone, SHORT_DAY)
  return `${d.day}\u00a0${d.month} ${d.year}`
}
/** «3 нояб.» */
const dayMonth = (ms: number, timeZone: string) => {
  const d = dayParts(ms, timeZone, SHORT_DAY)
  return `${d.day}\u00a0${d.month}`
}
/** «1 ноября 2026 года» (prose) */
const dateProse = (ms: number, timeZone: string) => {
  const d = dayParts(ms, timeZone, LONG_DAY)
  return `${d.day}\u00a0${d.month} ${d.year} года`
}

// ── Pieces the sentences share ──────────────────────────────────────────────────────────────────────────────────────

/** A whole count, or a fraction kept (its plural form is `other`) */
const count = (n: number) => (Number.isInteger(n) ? f.int(n) : f.dec(n, 1))
/** The full stop after the place, unless it was cut short or already ends on a stop («…», «D.C.») */
const stop = (cut: boolean, place: string) => (cut || /[.…!?]$/u.test(place) ? [] : ['.'])
/** The headline's serif block: the place and its full stop */
const head = (place: string, cut: boolean) => accent(place, ...stop(cut, place))
/** The place as the title of a prose sentence: «Waterloo.» */
const title = (place: string) => (/[.…!?]$/u.test(place) ? place : `${place}.`)

/** «спутник Sentinel-2C» / «неизвестный спутник» (nominative and accusative alike) */
const sat = (s: SatName) => (s !== undefined ? `спутник ${s}` : 'неизвестный спутник')
/** «Спутник Sentinel-2C» / «Неизвестный спутник», opening a sentence */
const Sat = (s: SatName) => (s !== undefined ? `Спутник ${s}` : 'Неизвестный спутник')
/** «спутника Sentinel-2C» / «неизвестного спутника» (genitive) */
const satGen = (s: SatName) => (s !== undefined ? `спутника ${s}` : 'неизвестного спутника')

/**
 * «сюда смотрел 21 спутник» · «сюда смотрели 22 спутника» · «…7 спутников» · «…1,5 спутника»; zero: «ни один известный
 * нам спутник сюда не смотрел», the negation last, which also sets the week card's lead in three lines, not four.
 * «сюда» and its verb are tied: untied, the 466 px column set «На этой неделе сюда / смотрели / 219 спутников.», a verb
 * alone on its line; tied, it sets «На этой неделе / сюда смотрели / 219 спутников.»
 */
const watchedHere = (n: number) =>
  n <= 0
    ? 'ни один известный нам спутник сюда не смотрел'
    : f.plural(n, {
        one: `сюда\u00a0смотрел ${count(n)}\u00a0спутник`,
        few: `сюда\u00a0смотрели ${count(n)}\u00a0спутника`,
        many: `сюда\u00a0смотрели ${count(n)}\u00a0спутников`,
        other: `сюда\u00a0смотрели ${count(n)}\u00a0спутника`,
      })
const cap = (s: string) => s.charAt(0).toLocaleUpperCase('ru') + s.slice(1)
/** «снимок · снимка · снимков · снимка» */
const images = (n: number) => f.plural(n, { one: 'снимок', few: 'снимка', many: 'снимков', other: 'снимка' })
/** «Опубликован» with a count ending in 1, «Опубликовано» otherwise */
const published = (n: number) => f.plural(n, { one: 'Опубликован', few: 'Опубликовано', many: 'Опубликовано', other: 'Опубликовано' })

/** Moving: на + accusative, 0 north … 7 northwest */
const COMPASS = ['север', 'северо-восток', 'восток', 'юго-восток', 'юг', 'юго-запад', 'запад', 'северо-запад']
/** « в 11:21 EST, 1 ноября 2026 года» */
const at = (w?: CardWhen) => (w ? ` в ${w.clock}\u00a0${w.zone}, ${dateProse(w.ms, w.timeZone)}` : '')
/** «, двигаясь на юг» (its subject is the sentence's satellite) */
const moving = (heading?: number) => (heading !== undefined && COMPASS[heading] ? `, двигаясь на ${COMPASS[heading]}` : '')

const ru: CardMessages = {
  // ── The headline: the place first, as a title, in the serif; the lead after it ─────────────────────────────────────

  headline: (satellites: number, place: string, cut: boolean): Rich => [head(place, cut), `${cap(watchedHere(satellites))}.`],
  headlineBy: {
    imaged: (s: SatName, place: string, cut: boolean): Rich => [head(place, cut), `Сюда смотрел ${sat(s)}.`],
    // The lead wraps at about 24 characters: the no-break space keeps «в» with «полосу» (§6.3).
    likely: (s: SatName, place: string, cut: boolean): Rich => [head(place, cut), `Это место попало в\u00a0полосу обзора ${satGen(s)}.`],
    could: (s: SatName, place: string, cut: boolean): Rich => [head(place, cut), `Сюда мог смотреть ${sat(s)}.`],
    overhead: (s: SatName, place: string, cut: boolean): Rich => [head(place, cut), `Над этим местом пролетел ${sat(s)}.`],
  },
  headlineWeek: (satellites: number, place: string, cut: boolean): Rich => [head(place, cut), `На этой неделе ${watchedHere(satellites)}.`],

  // ── The line under the headline ───────────────────────────────────────────────────────────────────────────────────

  photos: (n: number, atLeast: boolean) =>
    n <= 0 ? 'Не опубликовано ни одного снимка.' : `${published(n)} ${atLeast ? 'как минимум ' : ''}${count(n)}\u00a0${images(n)}.`,
  archiveDown: 'Архивы снимков не ответили, поэтому сейчас мы не можем посчитать опубликованные снимки.',
  archiveDownShort: 'Архивы снимков не ответили.',
  cloud: {
    only: {
      sub: (_pct: number) => 'Сплошная облачность: видны только облака.',
      chip: (pct: number) => `Под облаками · ${f.int(pct)}%`,
      post: (_pct: number) => 'Видны только облака.',
      desc: (pct: number) => `Видны только облака (${f.int(pct)}%).`,
    },
    mostly: {
      sub: (pct: number) => `В основном облака: ${f.int(pct)}% кадра.`,
      chip: (pct: number) => `В основном облака · ${f.int(pct)}%`,
      post: (pct: number) => `Видны в основном облака (${f.int(pct)}%).`,
      desc: (pct: number) => `Видны в основном облака (${f.int(pct)}%).`,
    },
    // «закрыли», never «накрыли» (fire, §8)
    spot: { sub: 'Облака над самой точкой.', chip: 'Облака над точкой', post: 'Точку закрыли облака.', desc: 'Точку закрыли облака.' },
  },

  // ── The top row ───────────────────────────────────────────────────────────────────────────────────────────────────

  stamp: (ms: number, timeZone: string, clock: string, zone: string) => `${dayYear(ms, timeZone)} · ${clock}\u00a0${zone}`,
  // «по» marks the span's last day, as in «с 25 октября по 1 ноября»; «7 дней до 1 нояб.» reads as a countdown.
  weekTo: (ms: number, timeZone: string) => `7\u00a0дней по ${dateYear(ms, timeZone)}`,
  lastWeek: 'Последние 7\u00a0дней',

  // ── Readouts ──────────────────────────────────────────────────────────────────────────────────────────────────────

  readout: {
    altitude: 'Высота',
    elevation: 'Над горизонтом',
    speed: 'Скорость',
    offNadir: 'От надира',
    pixel: 'Пиксель',
    mosaicPixel: 'Пиксель мозаики',
    closest: 'До трассы',
  },
  lane: { imaged: 'Снимок', likely: 'Вероятно', could: 'Возможно', overhead: 'В небе' },
  unit: { km: 'км', m: 'м', kmPerSecond: 'км/с' },
  decimal: (n: number, digits: number) => f.dec(n, digits),

  // ── Over the picture ──────────────────────────────────────────────────────────────────────────────────────────────

  pixelSize: (metres: number) =>
    metres >= 1000 ? `${f.int(metres / 1000)}\u00a0км` : `${metres < 1 ? f.dec(metres, 2) : f.int(metres)}\u00a0м`,
  distance: (km: number) => `${f.int(km)}\u00a0км`,
  scale: (km: number) => (km >= 1 ? `${f.int(km)}\u00a0км` : `${f.int(km * 1000)}\u00a0м`),
  geometry: 'Геометрия пролёта · север вверху',
  note: {
    imageInApp: 'Снимок открывается в приложении',
    imageUnavailable: 'Снимок сейчас недоступен',
    commercial: 'Закрытый коммерческий архив',
    // "no public image yet": the image may exist and not be published, so «не опубликован», not «снимка нет»; the
    // participle has its noun, «снимок», since nothing on the plate is masculine for it to agree with.
    inSwath: 'В полосе обзора, снимок ещё не опубликован',
    groundTrack: 'Трасса в момент сближения',
  },
  acquiring: 'Приём…',
  // The week's lead can be radar, which is not a photo: «снимков».
  noPublicPhoto: 'За неделю снимков не опубликовано',
  noPhoto: 'Нет снимка для показа',
  look: {
    closest: 'Самый близкий кадр',
    lastClear: 'Последний ясный кадр',
    clouded: 'Под облаками',
    radar: 'Радар',
  },
  lookDay: (ms: number, timeZone: string) => dayMonth(ms, timeZone),
  // A lone label (chips, the plan plate's callout); sentences say «неизвестный спутник» themselves.
  aSatellite: 'Спутник',
  // English invites ("See what watched you"), it doesn't ask: the indirect question as a label, no question mark.
  invite: 'Что смотрело на тебя',

  // ── The default card ──────────────────────────────────────────────────────────────────────────────────────────────

  // Five lines at the card's 88 px, one word each (237 / 229 / 205 / 307 px): the accent still ends the sentence.
  hero: [['На этой'], ['неделе'], ['что-то'], ['смотрело'], ['на ', accent('тебя'), '.']] as Rich[],
  // The landing's and the share page's verb («Введи любое место на Земле»), in the footer's 20 characters.
  enterAnyPlace: 'Введи место на Земле',
  defaultPlace: 'Пальма Джумейра',
  defaultAlt:
    'Настоящий снимок Пальмы Джумейра (Дубай) со спутника Sentinel-2, а рядом строка «На этой неделе что-то смотрело на тебя. Введи место на Земле».',

  // ── The share page ────────────────────────────────────────────────────────────────────────────────────────────────

  page: {
    title: 'На этой неделе что-то смотрело на тебя.',
    description:
      'Введи любое место на Земле. Увидишь все спутники, пролетавшие над ним за последние 7\u00a0дней, и настоящие снимки, которые они сделали.',
    placeTitle: (place: string) => `${place}: что смотрело сюда на этой неделе`,
    placeDescription: (place: string) =>
      `${place}: все спутники, пролетавшие здесь за последние 7\u00a0дней, и настоящие снимки, которые они сделали. Что смотрело на тебя на этой неделе?`,
    opening: ['Открываем ', accent('Watched')] as Rich,
  },
  crossed: (p: PassFacts & { verdict: 'imaged' | 'likely' | 'overhead'; altitudeKm?: number }) => {
    const alt = p.altitudeKm !== undefined ? ` на высоте ${f.int(p.altitudeKm)}\u00a0км` : ''
    // Overhead: the place is what it crossed («Над этим местом пролетел…»); a picture's pass says where and how high it
    // flew («пролетел здесь на высоте 795 км»), so the place is never dropped.
    const lead =
      p.verdict === 'overhead'
        ? `Над этим местом${alt} пролетел ${sat(p.sat)}`
        : `${Sat(p.sat)} пролетел ${alt ? `здесь${alt}` : 'над этим местом'}`
    return `${title(p.place)} ${lead}${at(p.when)}${moving(p.heading)}.`
  },
  // The satellite is the subject, so «двигаясь» says the satellite moved, not the place.
  withinView: (p: PassFacts) => `${title(p.place)} ${Sat(p.sat)} пролетел в зоне видимости этого места${at(p.when)}${moving(p.heading)}.`,
  couldHave: 'Он мог смотреть сюда. Оператор не сообщает, так ли это было.',
  straightDown: 'Он смотрел строго вниз.',
  offNadir: (deg: number) => `Он смотрел вниз с отклонением ${f.dec(deg, 1)}° от вертикали.`,
  cloudCover: (pct: number) => `Облачность: ${f.int(pct)}%.`,
  // The place cannot be the subject of a past tense («Москва был» ✗): the sentence says «это место» instead.
  inSwath: (_place: string) => 'Это место попало в полосу обзора его камеры.',
  bestFrom: {
    closest: (s: SatName) => `Самый близкий кадр сделал ${sat(s)}.`,
    lastClear: (s: SatName) => `Последний ясный кадр сделал ${sat(s)}.`,
    first: (s: SatName) => `Первый снимок сделал ${sat(s)}.`,
  },
  question: 'Что смотрело на тебя на этой неделе?',
  cardAlt: {
    withPhoto: (s: SatName) => `Карточка для публикации с самым близким кадром недели. Его сделал ${sat(s)}.`,
    plain: 'Карточка для публикации.',
  },
}

export default ru
