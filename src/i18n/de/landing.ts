/**
 * German copy for the landing (src/ui/landing; see docs/i18n/de.md §3.1, §3.2, §3.9, §4.1, §7): the hero, the place
 * search, "Use my location", the example chips and the maker's credit.
 *
 * Why it is built this way: the hero is the guide's three lines, `Etwas hat *dich*` / `diese Woche` / `beobachtet.`,
 * opening on the unknown agent and ending on the participle, alone on its line, as the reveal; the accent is *dich*,
 * lowercase (§3.1). The sub is one piece in two sentences, the second ending on *echten Bilder* (never *aktuellen*,
 * never *Fotos*: the images include radar and mosaics), its day phrase a whole phrase per plural category (§3.2).
 * The kicker's dates are numeric, at UTC, from Intl's 2-digit parts (`01.11. → 08.11.2026 UTC`), the year written once
 * unless the two ends' years differ, built with the house arrow and never formatRange (§6.3, §6.7). The reader is
 * *du*, lowercase; buttons are infinitives (`Meinen Standort verwenden`, `Pin setzen`); the one clipped imperative is
 * the chip idiom `Überrasch mich` (§1.1, §1.2). Locating is `Standort` / `Bei mir` / `Ortung …`, never *Orten*, which
 * also reads as a plural of *Ort* (§9.1). The pin hint and the locating status are one `nowrap` mono line each, and
 * their box is clipped, not ellipsised (an inline-flex child), so they are worded to the measured room (§7): the hint
 * fits beside `02 / Oder` on a 1280 px laptop, `Positionsabfrage` leaves the seconds visible on a 360 px phone, and the
 * naming step says `Ort wird bestimmt`, as the globe's pin card does. The example coordinates keep their decimal
 * points, because the field parses that form (§6.2). Quotes are „…“; a number and its unit, and a word and its
 * ellipsis, never part (U+00A0, §6.1).
 */
import type en from '../en/landing'
import { formatDate } from '../../../api/_lib/i18n/dates'
import { fmt } from '../../../api/_lib/i18n/format'
import { accent, type Rich } from '../../../api/_lib/i18n/parts'

const f = fmt('de')

const DAY_MONTH: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit' }
const DAY_MONTH_YEAR: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' }

const landing: typeof en = {
  // ── Hero ──────────────────────────────────────────────────────────────────────────────────
  lastDays: (days: number) => f.plural(days, { one: 'Letzter Tag', other: `Letzte ${f.int(days)} Tage` }),
  windowRange: (startMs: number, endMs: number) => {
    const sameYear = new Date(startMs).getUTCFullYear() === new Date(endMs).getUTCFullYear()
    const start = formatDate('de', startMs, 'UTC', sameYear ? DAY_MONTH : DAY_MONTH_YEAR)
    const end = formatDate('de', endMs, 'UTC', DAY_MONTH_YEAR)
    return `${start} → ${end} UTC`
  },
  hero: [['Etwas hat ', accent('dich')], ['diese Woche'], ['beobachtet.']] as Rich[],
  sub: (days: number): Rich => [
    `Gib einen beliebigen Ort auf der Erde ein. Du siehst alle Satelliten, die ihn ${f.plural(days, {
      one: 'am letzten Tag',
      other: `in den letzten ${f.int(days)} Tagen`,
    })} überflogen haben, und ihre echten Bilder.`,
  ],
  builtBy: (handle: string) => `Von ${handle}`,
  sourceLink: 'Open Source',
  sourceLinkLabel: 'Open Source: der Code auf GitHub',

  // ── The place search ──────────────────────────────────────────────────────────────────────
  searchPlaceholder: 'Ort suchen',
  placeLabel: 'Ort',
  searching: 'Suche',
  searchUnavailable: 'Suche nicht verfügbar',
  matches: (n: number) =>
    n === 0 ? 'Kein Treffer' : f.plural(n, { one: `${f.int(n)} Treffer`, other: `${f.int(n)} Treffer` }),
  noMatch: 'Kein Treffer',
  searchHint: 'Name, Adresse, Koordinaten',
  clearSearch: 'Suche leeren',
  go: 'Zeigen, was über diesen Ort hinwegzog',
  searchDown: 'Die Ortssuche antwortet gerade nicht. Koordinaten wie 43.47, −80.54 funktionieren weiterhin.',
  nothingMatches: (query: string) =>
    query.trim()
      ? `Nichts passt zu „${query}“. Versuche eine Stadt, ein Wahrzeichen oder Koordinaten.`
      : 'Nichts passt. Versuche eine Stadt, ein Wahrzeichen oder Koordinaten.',
  suggestions: 'Orte',

  // ── Use my location ──────────────────────────────────────────────────────────────────────
  useMyLocation: 'Meinen Standort verwenden',
  locateMe: 'Standort',
  nearMe: 'Bei mir',
  locating: 'Ortung …',
  cancelSearch: 'Abbrechen',
  cancelLocate: 'Abbrechen',
  cancelLocating: 'Ortung abbrechen',
  requestingPosition: 'Positionsabfrage',
  namingPlace: 'Ort wird bestimmt',
  elapsed: (seconds: number) => `${String(Math.round(seconds)).padStart(2, '0')} s`,
  locatingNote:
    'Deine Position geht an den Geocoder Photon, um den Ort zu benennen. Wir speichern nur ein Feld von etwa 10 km.',
  locationLabel: 'Standort',
  dismiss: 'Ausblenden',
  locateErrors: {
    denied: 'Der Standortzugriff ist blockiert. Erlaube ihn in den Browsereinstellungen oder suche nach einem Ort.',
    unavailable: 'Deine Position ist gerade nicht verfügbar. Suche stattdessen nach einem Ort.',
    timeout: 'Die Ortung hat zu lange gedauert. Versuche es erneut oder suche nach einem Ort.',
    unsupported: 'Dieser Browser kann seinen Standort nicht teilen. Suche stattdessen nach einem Ort.',
    insecure: 'Die Ortung braucht eine sichere Verbindung (https). Suche stattdessen nach einem Ort.',
    other: 'Deine Position ist gerade nicht verfügbar. Suche stattdessen nach einem Ort.',
  },

  // ── Examples ──────────────────────────────────────────────────────────────────────────────
  orTry: 'Oder',
  pinHint: 'Oder klicke auf den Globus für einen Pin',
  examplesLabel: 'Beispielorte',
  dropPin: 'Pin setzen',
  chipName: (label: string, sublabel: string) => (sublabel ? `${label}, ${sublabel}` : label),
  surprise: 'Überrasch mich',
  surpriseName: 'Überrasch mich: ein bekannter Ort, zufällig gewählt',
}
export default landing
