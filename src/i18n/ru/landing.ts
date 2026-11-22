/**
 * Russian copy for the landing (see docs/i18n/ru.md §3.1, §3.2, §7, Appendix A): the hero, the place search, "Use my
 * location", the example chips and the maker's credit.
 *
 * Why it is built this way: the hero ends on «тебя» because Russian puts the emphatic word last, and its three lines
 * fit the column whole at every size measured (§3.1). The window's length is a count, so «день / дня / дней» and the
 * adjective before it follow ru's plural categories («последний 21 день», «последние 7 дней»); the kicker's dates come
 * from Intl's parts (never a month table) without Intl's «г.», the arrow kept as in every language. The search status
 * counts places («5 мест»), which is what the list holds, in fewer characters than «совпадений». Prompts that are not
 * buttons use the ты-imperative («Или попробуй»), buttons the infinitive («Поставить метку») or the UI noun «Отмена»,
 * status labels a verbal noun («Поиск», «Запрос местоположения»).
 */
import type en from '../en/landing'
import { fmt } from '../../../api/_lib/i18n/format'
import { dateFormat } from '../../../api/_lib/i18n/dates'
import { accent, type Rich } from '../../../api/_lib/i18n/parts'

const f = fmt('ru')

/** A count as it is set: grouped («1 715»), a fraction kept (its plural form is `other`: «1,5 дня»). */
const count = (n: number) => (Number.isInteger(n) ? f.int(n) : f.dec(n, 1))
/** «1 день · 2 дня · 5 дней · 1,5 дня», the number tied to its noun */
const days = (n: number) => `${count(n)}\u00a0${f.plural(n, { one: 'день', few: 'дня', many: 'дней', other: 'дня' })}`
/** «последний 21 день», «последние 7 дней»: the adjective agrees with the count */
const lastWord = (n: number) => f.plural(n, { one: 'последний', few: 'последние', many: 'последние', other: 'последние' })

const UTC_DAY: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }

/** An instant's day, short month («нояб.») and year at UTC, from Intl's parts (no «г.»). */
function utcDay(ms: number) {
  const parts = dateFormat('ru', 'UTC', UTC_DAY).formatToParts(ms)
  const get = (t: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === t)?.value ?? ''
  return { day: get('day'), month: get('month'), year: get('year') }
}

const landing: typeof en = {
  // ── Hero ──────────────────────────────────────────────────────────────────────────────────
  lastDays: (n: number) => `${f.plural(n, { one: 'Последний', few: 'Последние', many: 'Последние', other: 'Последние' })} ${days(n)}`,
  windowRange: (startMs: number, endMs: number) => {
    const a = utcDay(startMs)
    const b = utcDay(endMs)
    const end = `${b.day}\u00a0${b.month} ${b.year}`
    const start = a.year !== b.year ? `${a.day}\u00a0${a.month} ${a.year}` : a.month !== b.month ? `${a.day}\u00a0${a.month}` : a.day
    return `${start} → ${end} UTC`
  },
  hero: [['На этой неделе'], ['что-то смотрело'], ['на ', accent('тебя'), '.']] as Rich[],
  sub: (n: number): Rich => [
    `Введи любое место на Земле. Увидишь все спутники, пролетавшие над ним за ${lastWord(n)} ${days(n)}, и\u00a0настоящие снимки, которые они сделали.`,
  ],
  builtBy: (handle: string) => `Автор: ${handle}`,
  sourceLink: 'Открытый код',
  sourceLinkLabel: 'Открытый код: проект на GitHub',

  // ── The place search ──────────────────────────────────────────────────────────────────────
  searchPlaceholder: 'Поиск места',
  placeLabel: 'Место',
  searching: 'Поиск',
  searchUnavailable: 'Поиск недоступен',
  matches: (n: number) => `${count(n)}\u00a0${f.plural(n, { one: 'место', few: 'места', many: 'мест', other: 'места' })}`,
  noMatch: 'Не найдено',
  searchHint: 'Название, адрес, координаты',
  clearSearch: 'Очистить поиск',
  go: 'Показать, что пролетало над этим местом',
  searchDown: 'Поиск мест не отвечает. Координаты вроде 43.47, −80.54 по-прежнему работают.',
  nothingMatches: (query: string) => `Ничего не найдено по запросу «${query}». Попробуй ввести город, достопримечательность или координаты.`,
  suggestions: 'Места',

  // ── Use my location ──────────────────────────────────────────────────────────────────────
  useMyLocation: 'Моё местоположение',
  locateMe: 'Где я',
  nearMe: 'Рядом',
  locating: 'Ищем…',
  cancelSearch: 'Отмена',
  cancelLocate: 'Отмена',
  cancelLocating: 'Отменить определение местоположения',
  requestingPosition: 'Запрос местоположения',
  namingPlace: 'Определение названия',
  elapsed: (seconds: number) => `${seconds.toFixed(0).padStart(2, '0')}\u00a0с`,
  locatingNote:
    // «мы» is the subject of both verbs, so the «чтобы» clause has the right one; «размером» makes 10 km a size.
    'Мы передаём твоё местоположение геокодеру Photon, чтобы узнать название места. Храним только ячейку сетки размером ~10\u00a0км.',
  locationLabel: 'Геолокация',
  dismiss: 'Закрыть',
  locateErrors: {
    denied: 'Доступ к местоположению заблокирован. Разреши его в настройках браузера или найди место через поиск.',
    unavailable: 'Сейчас не удаётся определить твоё местоположение. Найди место через поиск.',
    timeout: 'Местоположение определялось слишком долго. Попробуй ещё раз или найди место через поиск.',
    unsupported: 'Этот браузер не может передать местоположение. Найди место через поиск.',
    insecure: 'Для определения местоположения нужно защищённое соединение (https). Найди место через поиск.',
    other: 'Сейчас не удаётся определить твоё местоположение. Найди место через поиск.',
  },

  // ── Examples ──────────────────────────────────────────────────────────────────────────────
  orTry: 'Или попробуй',
  pinHint: 'Или поставь метку на глобусе',
  examplesLabel: 'Примеры мест',
  dropPin: 'Поставить метку',
  chipName: (label: string, sublabel: string) => (sublabel ? `${label}, ${sublabel}` : label),
  surprise: 'Наугад',
  surpriseName: 'Наугад: случайное известное место',
}
export default landing
