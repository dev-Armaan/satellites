/**
 * Ukrainian copy for the landing (see docs/i18n/uk.md §3.1, §3.2, Appendix A): the hero, the place search, "Use my
 * location", the example chips and the maker's credit.
 *
 * Why it is built this way: the hero ends on «тебе» because Ukrainian puts the emphatic word last; the window's
 * length is a count, so «день / дні / днів» and the adjective before it follow uk's plural categories; the kicker's
 * dates come from Intl's parts (never a month table) without Intl's «р.», arrow kept as in every language. Prompts
 * that are not buttons use the ти-imperative («Або спробуй»), buttons the infinitive («Поставити мітку»), status
 * labels a verbal noun («Пошук»).
 */
import type en from '../en/landing'
import { fmt } from '../../../api/_lib/i18n/format'
import { dateFormat } from '../../../api/_lib/i18n/dates'
import { accent, type Rich } from '../../../api/_lib/i18n/parts'

const f = fmt('uk')

/** A count as it is set: grouped («1 715»), a fraction kept (its plural form is `other`: «1,5 дня»). */
const count = (n: number) => (Number.isInteger(n) ? f.int(n) : f.dec(n, 1))
/** «1 день · 2 дні · 5 днів · 1,5 дня», the number tied to its noun */
const days = (n: number) => `${count(n)}\u00a0${f.plural(n, { one: 'день', few: 'дні', many: 'днів', other: 'дня' })}`
/** «останній 21 день», «останні 7 днів»: the adjective agrees with the count */
const lastWord = (n: number) => f.plural(n, { one: 'останній', few: 'останні', many: 'останні', other: 'останні' })

const UTC_DAY: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }

/** An instant's day, short month («лист.») and year at UTC, from Intl's parts (no «р.»). */
function utcDay(ms: number) {
  const parts = dateFormat('uk', 'UTC', UTC_DAY).formatToParts(ms)
  const get = (t: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === t)?.value ?? ''
  return { day: get('day'), month: get('month'), year: get('year') }
}

const landing: typeof en = {
  // ── Hero ──────────────────────────────────────────────────────────────────────────────────
  lastDays: (n: number) => `${f.plural(n, { one: 'Останній', few: 'Останні', many: 'Останні', other: 'Останні' })} ${days(n)}`,
  windowRange: (startMs: number, endMs: number) => {
    const a = utcDay(startMs)
    const b = utcDay(endMs)
    const end = `${b.day} ${b.month} ${b.year}`
    const start = a.year !== b.year ? `${a.day} ${a.month} ${a.year}` : a.month !== b.month ? `${a.day} ${a.month}` : a.day
    return `${start} → ${end} UTC`
  },
  hero: [['Цього тижня'], ['щось дивилося'], ['на ', accent('тебе'), '.']] as Rich[],
  sub: (n: number): Rich => [
    `Введи будь-яке місце на Землі. Побачиш усі супутники, що пролітали над ним за ${lastWord(n)} ${days(n)}, і\u00a0справжні знімки, які вони зробили.`,
  ],
  builtBy: (handle: string) => `Автор\u00a0— ${handle}`,
  sourceLink: 'Відкритий код',
  sourceLinkLabel: 'Відкритий код: проєкт на GitHub',

  // ── The place search ──────────────────────────────────────────────────────────────────────
  searchPlaceholder: 'Пошук місця',
  placeLabel: 'Місце',
  searching: 'Пошук',
  searchUnavailable: 'Пошук недоступний',
  matches: (n: number) => `${count(n)}\u00a0${f.plural(n, { one: 'збіг', few: 'збіги', many: 'збігів', other: 'збігу' })}`,
  noMatch: 'Немає збігів',
  searchHint: 'Назва, адреса, координати',
  clearSearch: 'Очистити пошук',
  go: 'Показати, що пролітало над цим місцем',
  searchDown: 'Пошук місць не відповідає. Координати на кшталт 43.47, −80.54 працюють і далі.',
  nothingMatches: (query: string) => `Нічого не знайдено за запитом «${query}». Спробуй місто, пам’ятку або координати.`,
  suggestions: 'Місця',

  // ── Use my location ──────────────────────────────────────────────────────────────────────
  useMyLocation: 'Моє місцезнаходження',
  locateMe: 'Де я',
  nearMe: 'Поруч',
  locating: 'Шукаємо…',
  cancelSearch: 'Скасувати',
  cancelLocate: 'Скасувати',
  cancelLocating: 'Скасувати визначення місцезнаходження',
  requestingPosition: 'Запит місцезнаходження',
  namingPlace: 'Визначення назви',
  elapsed: (seconds: number) => `${seconds.toFixed(0).padStart(2, '0')}\u00a0с`,
  locatingNote:
    'Твоє місцезнаходження надсилаємо геокодеру Photon, щоб визначити назву місця. Ми зберігаємо лише клітинку сітки ~10\u00a0км.',
  locationLabel: 'Геолокація',
  dismiss: 'Закрити',
  locateErrors: {
    denied: 'Доступ до місцезнаходження заблоковано. Дозволь його в налаштуваннях браузера або пошукай місце за назвою.',
    unavailable: 'Зараз не вдається визначити твоє місцезнаходження. Пошукай місце за назвою.',
    timeout: 'Місцезнаходження визначалося надто довго. Спробуй ще раз або пошукай місце за назвою.',
    unsupported: 'Цей браузер не може передати місцезнаходження. Пошукай місце за назвою.',
    insecure: 'Для визначення місцезнаходження потрібне захищене з’єднання (https). Пошукай місце за назвою.',
    other: 'Зараз не вдається визначити твоє місцезнаходження. Пошукай місце за назвою.',
  },

  // ── Examples ──────────────────────────────────────────────────────────────────────────────
  orTry: 'Або спробуй',
  pinHint: 'Або постав мітку на глобусі',
  examplesLabel: 'Приклади місць',
  dropPin: 'Поставити мітку',
  chipName: (label: string, sublabel: string) => (sublabel ? `${label}, ${sublabel}` : label),
  surprise: 'Навмання',
  surpriseName: 'Навмання: відоме місце, вибране випадково',
}
export default landing
