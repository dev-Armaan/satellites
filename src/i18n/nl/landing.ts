/**
 * Dutch copy for the landing (src/ui/landing; see docs/i18n/nl.md §3.1, §3.2, §3.7, §7): the hero, the place search,
 * "Use my location", the example chips and the maker's credit.
 *
 * Why it is built this way: the hero is the guide's three lines, `Iets keek / deze week / naar *jou*.`, one sentence
 * whose stress falls on the stressed pronoun at its end, where the accent goes; the full stop sits outside the serif
 * (§3.1). The sub says `Kies` (the reader can type, tap a chip or drop a pin) and the declarative `Je ziet`, never a
 * second imperative, and counts `beelden`, not `foto’s`, because the count holds radar and mosaics too (§3.2). The
 * window is `de afgelopen 7 dagen`, and a one-day window `de afgelopen 24 uur` (§3.3). The kicker's dates are Intl's
 * short months at UTC with no full stop, the day never padded, the month or year written once, the house arrow
 * (never formatRange's spaced en dash, §6). Buttons where the English says my / me speak as the user (`Mijn plek`,
 * `Verras me`), prompts and errors use the je-imperative, statuses are nouns or infinitives (`Zoeken`, `Bepalen…`,
 * not `Zoeken…`, which would read as the search status, §7). A searched place is a `plek`, a GPS fix a `locatie` or
 * `positie` (§4.1). Typed coordinates keep the point and the U+2212 minus, because the field parses only that form
 * (§6). A number and its unit never part (U+00A0).
 */
import type en from '../en/landing'
import { formatDate } from '../../../api/_lib/i18n/dates'
import { fmt } from '../../../api/_lib/i18n/format'
import { accent, type Rich } from '../../../api/_lib/i18n/parts'

const f = fmt('nl')

/** "7 dagen"; a one-day window is "24 uur" (§3.3: never "1 dag"). */
const span = (days: number) =>
  days === 1 ? '24 uur' : f.plural(days, { one: `${f.int(days)} dag`, other: `${f.int(days)} dagen` })

const MONTH: Intl.DateTimeFormatOptions = { month: 'short' }

/** An instant's day, short month ("nov", no full stop) and year at UTC; the month's word from Intl. */
function utcDay(ms: number) {
  const d = new Date(ms)
  return {
    day: String(d.getUTCDate()),
    month: formatDate('nl', ms, 'UTC', MONTH).replace(/\.$/, ''),
    year: String(d.getUTCFullYear()),
  }
}

const landing: typeof en = {
  // ── Hero ──────────────────────────────────────────────────────────────────────────────────
  lastDays: (days: number) => `Afgelopen ${span(days)}`,
  windowRange: (startMs: number, endMs: number) => {
    const a = utcDay(startMs)
    const b = utcDay(endMs)
    const end = `${b.day} ${b.month} ${b.year}`
    const start = a.year !== b.year ? `${a.day} ${a.month} ${a.year}` : a.month !== b.month ? `${a.day} ${a.month}` : a.day
    return `${start} → ${end} UTC`
  },
  hero: [['Iets keek'], ['deze week'], ['naar ', accent('jou'), '.']] as Rich[],
  sub: (days: number): Rich => [
    `Kies een plek op aarde. Je ziet welke satellieten er de afgelopen ${span(days)} overheen vlogen, en de echte beelden die ze maakten.`,
  ],
  builtBy: (handle: string) => `Gemaakt door ${handle}`,
  sourceLink: 'Open source',
  sourceLinkLabel: 'Open source: de code op GitHub',

  // ── The place search ──────────────────────────────────────────────────────────────────────
  searchPlaceholder: 'Zoek een plek',
  placeLabel: 'Plek',
  searching: 'Zoeken',
  searchUnavailable: 'Zoeken niet beschikbaar',
  matches: (n: number) =>
    n === 0 ? 'Geen treffers' : f.plural(n, { one: `${f.int(n)} treffer`, other: `${f.int(n)} treffers` }),
  noMatch: 'Geen treffers',
  searchHint: 'Naam, adres of coördinaten',
  clearSearch: 'Zoekveld leegmaken',
  go: 'Overvluchten van deze plek tonen',
  searchDown: 'Het zoeken naar plekken reageert niet. Coördinaten zoals 43.47, −80.54 werken nog steeds.',
  nothingMatches: (query: string) =>
    query.trim()
      ? `Niets gevonden voor “${query}”. Probeer een stad, een bezienswaardigheid of coördinaten.`
      : 'Niets gevonden. Probeer een stad, een bezienswaardigheid of coördinaten.',
  suggestions: 'Plekken',

  // ── Use my location ──────────────────────────────────────────────────────────────────────
  // `Mijn locatie`: `Mijn locatie gebruiken` (22) left the field too little room for its placeholder at 1024 px.
  useMyLocation: 'Mijn locatie',
  locateMe: 'Mijn plek',
  nearMe: 'Mijn plek',
  locating: 'Bepalen…',
  cancelSearch: 'Annuleren',
  cancelLocate: 'Annuleren',
  cancelLocating: 'Locatie bepalen annuleren',
  requestingPosition: 'Positie opvragen',
  namingPlace: 'Naam opzoeken',
  elapsed: (seconds: number) => `${seconds.toFixed(0).padStart(2, '0')} s`,
  locatingNote:
    'Je positie gaat naar de geocoder Photon om de plek een naam te geven. We bewaren alleen een gebied van ongeveer 10 km.',
  locationLabel: 'Locatie',
  dismiss: 'Sluiten',
  locateErrors: {
    denied: 'De toegang tot je locatie is geblokkeerd. Sta die toe in de instellingen van je browser, of zoek een plek.',
    unavailable: 'Je positie is nu niet beschikbaar. Zoek in plaats daarvan een plek.',
    timeout: 'Het bepalen van je positie duurde te lang. Probeer het opnieuw, of zoek een plek.',
    unsupported: 'Deze browser kan zijn locatie niet delen. Zoek in plaats daarvan een plek.',
    insecure: 'Locatie werkt alleen via een beveiligde verbinding (https). Zoek in plaats daarvan een plek.',
    other: 'Je positie is nu niet beschikbaar. Zoek in plaats daarvan een plek.',
  },

  // ── Examples ──────────────────────────────────────────────────────────────────────────────
  orTry: 'Of probeer',
  pinHint: 'Of klik op de wereldbol voor een speld',
  examplesLabel: 'Voorbeeldplekken',
  dropPin: 'Speld neerzetten',
  chipName: (label: string, sublabel: string) => (sublabel ? `${label}, ${sublabel}` : label),
  surprise: 'Verras me',
  surpriseName: 'Verras me: een bekende plek, willekeurig gekozen',
}
export default landing
