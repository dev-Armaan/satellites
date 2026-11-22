/**
 * Italian copy for the landing (src/ui/landing; see docs/i18n/it.md §3.1, §3.2, §3.7, §7): the hero, the place search,
 * "Use my location", the example chips and the maker's credit.
 *
 * Why it is built this way: the hero is the guide's final three lines, *Qualcosa / questa settimana / ha osservato
 * te.*, with the accent on the stressed *te* (the clitic *ti* cannot carry emphasis) and Italian's focus at the end;
 * a participle never agrees with an object that follows it, so nothing agrees with the reader. The sub says *Scegli*
 * (the reader can type, tap a chip or drop a pin), *l’hanno sorvolato* agreeing with *luogo*, a noun written in the
 * sentence, and *immagini vere*, never the false friend *attuali*. The window is a count: *negli ultimi 7 giorni*,
 * *nell’ultimo giorno*, and the exact-million `many` takes *di*. The kicker's dates are CLDR's short months from Intl's
 * parts (never a month table), the day never padded, the month or year written once, the product's arrow; it is
 * scrambled on its first paint, so it keeps plain spaces. Buttons are tu imperatives (*Cerca un luogo*, *Metti un
 * segnaposto*, *Sorprendimi*); status words are nouns (*Ricerca*, *Posizione…*, *Richiesta posizione*), never a
 * first-person verb, which would make the product an *io*. Two mono lines are cut to English's width because they
 * share a nowrap row: the locating status drops its article (§7 rule 2), or a 375 px phone clips the elapsed seconds
 * after it; the mouse hint beside *02 / Oppure prova* is *Oppure metti un segnaposto sul globo*, which fits the
 * 452 px row at 1024 px wide, where the longer form with *clicca* ended mid-word. Errors say what happened, then the
 * way out. Typed coordinates keep English's point and U+2212 minus, because the field parses only that form.
 * Quotation marks are « ».
 */
import type en from '../en/landing'
import { dateFormat } from '../../../api/_lib/i18n/dates'
import { fmt } from '../../../api/_lib/i18n/format'
import { accent, type Rich } from '../../../api/_lib/i18n/parts'

const f = fmt('it')

/** "negli ultimi 7 giorni", "nell’ultimo giorno": the window inside a sentence */
const lastWindow = (days: number) =>
  f.plural(days, {
    one: 'nell’ultimo giorno',
    many: `negli ultimi ${f.int(days)} di giorni`,
    other: `negli ultimi ${f.int(days)} giorni`,
  })

const UTC_DAY: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }

/** An instant's day, short month ("nov", "gen") and year at UTC, from Intl's parts. */
function utcDay(ms: number) {
  const parts = dateFormat('it', 'UTC', UTC_DAY).formatToParts(ms)
  // Some ICU data ends an abbreviation with a full stop; the guide's readouts have none (§6).
  const get = (t: Intl.DateTimeFormatPartTypes) => (parts.find((p) => p.type === t)?.value ?? '').replace(/\.$/, '')
  return { day: get('day'), month: get('month'), year: get('year') }
}

const landing: typeof en = {
  // ── Hero ──────────────────────────────────────────────────────────────────────────────────
  lastDays: (days: number) =>
    f.plural(days, {
      one: 'Ultimo giorno',
      many: `Ultimi ${f.int(days)} di giorni`,
      other: `Ultimi ${f.int(days)} giorni`,
    }),
  windowRange: (startMs: number, endMs: number) => {
    const a = utcDay(startMs)
    const b = utcDay(endMs)
    const end = `${b.day} ${b.month} ${b.year}`
    const start = a.year !== b.year ? `${a.day} ${a.month} ${a.year}` : a.month !== b.month ? `${a.day} ${a.month}` : a.day
    return `${start} → ${end} UTC`
  },
  hero: [['Qualcosa'], ['questa settimana'], ['ha osservato ', accent('te'), '.']] as Rich[],
  sub: (days: number): Rich => [
    `Scegli un luogo qualsiasi sulla Terra. Vedi tutti i satelliti che l’hanno sorvolato ${lastWindow(days)}, e le immagini vere che hanno ripreso.`,
  ],
  builtBy: (handle: string) => `Realizzato da ${handle}`,
  sourceLink: 'Open source',
  sourceLinkLabel: 'Open source: il codice su GitHub',

  // ── The place search ──────────────────────────────────────────────────────────────────────
  searchPlaceholder: 'Cerca un luogo',
  placeLabel: 'Luogo',
  searching: 'Ricerca',
  searchUnavailable: 'Ricerca non disponibile',
  matches: (n: number) =>
    f.plural(n, {
      one: `${f.int(n)} risultato`,
      many: `${f.int(n)} di risultati`,
      other: `${f.int(n)} risultati`,
    }),
  noMatch: 'Nessun risultato',
  searchHint: 'Nome, indirizzo o coordinate',
  clearSearch: 'Cancella la ricerca',
  go: 'Mostra cosa è passato sopra questo luogo',
  searchDown: 'La ricerca dei luoghi non risponde. Le coordinate funzionano ancora, per esempio 43.47, −80.54.',
  nothingMatches: (query: string) => `Nessun risultato per «${query}». Prova una città, un luogo famoso o delle coordinate.`,
  suggestions: 'Luoghi',

  // ── Use my location ──────────────────────────────────────────────────────────────────────
  useMyLocation: 'La mia posizione',
  locateMe: 'Trovami',
  nearMe: 'Vicino a me',
  locating: 'Posizione…',
  cancelSearch: 'Annulla',
  cancelLocate: 'Annulla',
  cancelLocating: 'Annulla la localizzazione',
  requestingPosition: 'Richiesta posizione',
  namingPlace: 'Ricerca del nome',
  elapsed: (seconds: number) => `${seconds.toFixed(0).padStart(2, '0')} s`,
  locatingNote:
    'La tua posizione va al geocoder Photon per dare un nome al luogo. Conserviamo solo una cella di circa 10 km.',
  locationLabel: 'Posizione',
  dismiss: 'Chiudi',
  locateErrors: {
    denied: 'L’accesso alla posizione è bloccato. Consentilo nelle impostazioni del browser, oppure cerca un luogo.',
    unavailable: 'La tua posizione non è disponibile in questo momento. Cerca invece un luogo.',
    timeout: 'Ci è voluto troppo tempo per trovare la tua posizione. Riprova, oppure cerca un luogo.',
    unsupported: 'Questo browser non può condividere la posizione. Cerca invece un luogo.',
    insecure: 'La posizione richiede una connessione sicura (https). Cerca invece un luogo.',
    other: 'La tua posizione non è disponibile in questo momento. Cerca invece un luogo.',
  },

  // ── Examples ──────────────────────────────────────────────────────────────────────────────
  orTry: 'Oppure prova',
  pinHint: 'Oppure metti un segnaposto sul globo',
  examplesLabel: 'Luoghi di esempio',
  dropPin: 'Metti un segnaposto',
  chipName: (label: string, sublabel: string) => (sublabel ? `${label}, ${sublabel}` : label),
  surprise: 'Sorprendimi',
  surpriseName: 'Sorprendimi: un luogo famoso scelto a caso',
}
export default landing
