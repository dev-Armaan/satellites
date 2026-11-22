/**
 * Polish copy for the landing (see docs/i18n/pl.md §3.1, §3.2, §3.9, §7): the hero, the place search, "Use my
 * location", the example chips and the maker's credit.
 *
 * Why it is built this way: the hero is the guide's three lines, «Coś *cię* / obserwowało / w tym tygodniu.»: the
 * neuter «Coś» takes the neuter past, so nothing agrees with the reader, and the accent is the clitic «cię», the human
 * moment, in its natural second place. The sub speaks to the reader in the imperative («Wpisz», «Zobacz») and refers
 * to the place as «miejsce» / «nad nim», never a name; a one-day window is «w ostatniej dobie». Counts follow pl's
 * four plural forms. Errors and states are impersonal or the verbal noun («Ustalanie…»), so the reader's gender never
 * shows. The kicker's dates are Intl's short months («lis», «paź») from its parts, with the house arrow, never Intl's
 * formatRange. One-letter words and a number's noun are tied by a no-break space (§6.3).
 */
import type en from '../en/landing'
import { fmt } from '../../../api/_lib/i18n/format'
import { dateFormat } from '../../../api/_lib/i18n/dates'
import { accent, type Rich } from '../../../api/_lib/i18n/parts'

const f = fmt('pl')

/** A count as it is set: grouped from five digits («12 847»), a fraction kept (its plural form is `other`). */
const count = (n: number) => (Number.isInteger(n) ? f.int(n) : f.dec(n, 1))

const UTC_DAY: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }

/** An instant's day, short month («lis») and year at UTC, from Intl's parts. */
function utcDay(ms: number) {
  const parts = dateFormat('pl', 'UTC', UTC_DAY).formatToParts(ms)
  const get = (t: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === t)?.value ?? ''
  return { day: get('day'), month: get('month'), year: get('year') }
}

/** «w ostatniej dobie», «w ostatnich 7 dniach» (the locative plural is one form for every count above 1) */
const inLastDays = (n: number) =>
  f.plural(n, {
    one: 'w\u00a0ostatniej dobie',
    few: `w\u00a0ostatnich ${count(n)}\u00a0dniach`,
    many: `w\u00a0ostatnich ${count(n)}\u00a0dniach`,
    other: `w\u00a0ostatnich ${count(n)}\u00a0dnia`,
  })

const landing: typeof en = {
  // ── Hero ──────────────────────────────────────────────────────────────────────────────────
  lastDays: (n: number) =>
    f.plural(n, {
      one: 'Ostatnia doba',
      few: `Ostatnie ${count(n)}\u00a0dni`,
      many: `Ostatnie ${count(n)}\u00a0dni`,
      other: `Ostatnie ${count(n)}\u00a0dnia`,
    }),
  windowRange: (startMs: number, endMs: number) => {
    const a = utcDay(startMs)
    const b = utcDay(endMs)
    const end = `${b.day} ${b.month} ${b.year}`
    const start = a.year !== b.year ? `${a.day} ${a.month} ${a.year}` : a.month !== b.month ? `${a.day} ${a.month}` : a.day
    return `${start} → ${end} UTC`
  },
  hero: [['Coś ', accent('cię')], ['obserwowało'], ['w\u00a0tym tygodniu.']] as Rich[],
  sub: (n: number): Rich => [
    `Wpisz dowolne miejsce na Ziemi. Zobacz wszystkie satelity, które przeleciały nad nim ${inLastDays(n)}, i\u00a0ich prawdziwe zdjęcia.`,
  ],
  builtBy: (handle: string) => `Autor: ${handle}`,
  sourceLink: 'Kod źródłowy',
  sourceLinkLabel: 'Kod źródłowy w serwisie GitHub',

  // ── The place search ──────────────────────────────────────────────────────────────────────
  searchPlaceholder: 'Szukaj miejsca',
  placeLabel: 'Miejsce',
  searching: 'Szukanie',
  searchUnavailable: 'Wyszukiwarka niedostępna',
  matches: (n: number) => `${count(n)}\u00a0${f.plural(n, { one: 'wynik', few: 'wyniki', many: 'wyników', other: 'wyniku' })}`,
  noMatch: 'Brak wyników',
  searchHint: 'Nazwa, adres lub współrzędne',
  clearSearch: 'Wyczyść wyszukiwanie',
  go: 'Pokaż, co przeleciało nad tym miejscem',
  searchDown: 'Wyszukiwarka miejsc nie odpowiada. Współrzędne, np. 43.47, −80.54, nadal działają.',
  nothingMatches: (query: string) => `Nic nie pasuje do „${query}”. Wpisz miasto, znane miejsce albo współrzędne.`,
  suggestions: 'Miejsca',

  // ── Use my location ──────────────────────────────────────────────────────────────────────
  useMyLocation: 'Użyj mojej lokalizacji',
  locateMe: 'Znajdź mnie',
  nearMe: 'W\u00a0pobliżu',
  locating: 'Ustalanie…',
  cancelSearch: 'Anuluj',
  cancelLocate: 'Anuluj',
  cancelLocating: 'Anuluj ustalanie lokalizacji',
  requestingPosition: 'Ustalanie pozycji',
  namingPlace: 'Ustalanie nazwy',
  elapsed: (seconds: number) => `${seconds.toFixed(0).padStart(2, '0')}\u00a0s`,
  locatingNote: 'Twoja pozycja trafia do geokodera Photon, który nazywa miejsce. Zapisujemy tylko obszar ok.\u00a010\u00a0km.',
  locationLabel: 'Lokalizacja',
  dismiss: 'Zamknij',
  locateErrors: {
    denied: 'Dostęp do lokalizacji jest zablokowany. Włącz go w\u00a0ustawieniach przeglądarki albo wyszukaj miejsce.',
    unavailable: 'Nie da się teraz ustalić twojej pozycji. Zamiast tego wyszukaj miejsce.',
    timeout: 'Ustalanie pozycji trwało zbyt długo. Spróbuj ponownie albo wyszukaj miejsce.',
    unsupported: 'Ta przeglądarka nie może udostępnić lokalizacji. Zamiast tego wyszukaj miejsce.',
    insecure: 'Lokalizacja wymaga bezpiecznego połączenia (https). Zamiast tego wyszukaj miejsce.',
    other: 'Nie da się teraz ustalić twojej pozycji. Zamiast tego wyszukaj miejsce.',
  },

  // ── Examples ──────────────────────────────────────────────────────────────────────────────
  orTry: 'Albo sprawdź',
  pinHint: 'Albo kliknij globus, by postawić pinezkę',
  examplesLabel: 'Przykładowe miejsca',
  dropPin: 'Postaw pinezkę',
  chipName: (label: string, sublabel: string) => (sublabel ? `${label}, ${sublabel}` : label),
  surprise: 'Zaskocz mnie',
  surpriseName: 'Zaskocz mnie: losowe znane miejsce',
}
export default landing
