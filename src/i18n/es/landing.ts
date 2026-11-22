/**
 * Spanish copy for the landing (see docs/i18n/es.md §3.1, §3.2, §4, §7): the hero, the place search, "Use my location",
 * the example chips and the maker's credit.
 *
 * Why it is built this way: Spanish cannot stress the clitic *te*, so the hero's accent is the doubled strong pronoun
 * *a ti* (*Algo / te observó a ti / esta semana.*); no-break spaces keep *te* with its verb and *a* with *ti* if a
 * narrow column wraps the line, and its only break left is the guide's fallback (*te observó* / *a ti*). The window's
 * length is a count, so its article and adjective agree with it (*los últimos 7 días*, *el último día*). The kicker's
 * dates come from Intl's parts (never a month table; *sept* kept), with the arrow every language uses. Buttons and
 * placeholders are infinitives (*Buscar un lugar*, *Marcar un punto*), the user's own voice keeps the first person
 * (*Localízame*, *Sorpréndeme*), prompts that invite use the tú imperative (*O prueba*), and errors say what failed,
 * then the way out, without "instead" (*en su lugar* beside *lugar* is a tongue-twister).
 */
import type en from '../en/landing'
import { fmt } from '../../../api/_lib/i18n/format'
import { dateFormat } from '../../../api/_lib/i18n/dates'
import { accent, type Rich } from '../../../api/_lib/i18n/parts'

const f = fmt('es')

/** "los últimos 7 días", "el último día": the window inside a sentence; the article and adjective agree with the count */
const lastWindow = (n: number) =>
  f.plural(n, { one: 'el último día', many: `los últimos ${f.int(n)}\u00a0días`, other: `los últimos ${f.int(n)}\u00a0días` })

const UTC_DAY: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }

/** An instant's day, short month ("nov", "sept") and year at UTC, from Intl's parts. */
function utcDay(ms: number) {
  const parts = dateFormat('es', 'UTC', UTC_DAY).formatToParts(ms)
  // Older ICU data still ends some abbreviations with a full stop ("nov."); the guide's abbreviations have none.
  const get = (t: Intl.DateTimeFormatPartTypes) => (parts.find((p) => p.type === t)?.value ?? '').replace(/\.$/, '')
  return { day: get('day'), month: get('month'), year: get('year') }
}

const landing: typeof en = {
  // ── Hero ──────────────────────────────────────────────────────────────────────────────────
  lastDays: (days: number) =>
    f.plural(days, { one: 'Último día', many: `Últimos ${f.int(days)}\u00a0días`, other: `Últimos ${f.int(days)}\u00a0días` }),
  windowRange: (startMs: number, endMs: number) => {
    const a = utcDay(startMs)
    const b = utcDay(endMs)
    const end = `${b.day} ${b.month} ${b.year}`
    const start = a.year !== b.year ? `${a.day} ${a.month} ${a.year}` : a.month !== b.month ? `${a.day} ${a.month}` : a.day
    return `${start} → ${end} UTC`
  },
  hero: [['Algo'], ['te\u00a0observó ', accent('a\u00a0ti')], ['esta semana.']] as Rich[],
  sub: (days: number): Rich => [
    `Busca cualquier lugar de la Tierra. Mira todos los satélites que lo sobrevolaron en ${lastWindow(days)} y las imágenes reales que tomaron.`,
  ],
  builtBy: (handle: string) => `Creado por ${handle}`,
  sourceLink: 'Código abierto',
  sourceLinkLabel: 'Código abierto: el proyecto en GitHub',

  // ── The place search ──────────────────────────────────────────────────────────────────────
  searchPlaceholder: 'Buscar un lugar',
  placeLabel: 'Lugar',
  searching: 'Buscando',
  searchUnavailable: 'Búsqueda no disponible',
  matches: (n: number) => `${f.int(n)}\u00a0${f.plural(n, { one: 'resultado', many: 'resultados', other: 'resultados' })}`,
  noMatch: 'Sin resultados',
  searchHint: 'Nombre, dirección o lat, lon',
  clearSearch: 'Borrar la búsqueda',
  go: 'Ver los satélites que pasaron sobre este lugar',
  searchDown: 'La búsqueda de lugares no responde. Las coordenadas como 43.47, −80.54 siguen funcionando.',
  nothingMatches: (query: string) =>
    `No hay resultados para “${query}”. Prueba con una ciudad, un lugar conocido o unas coordenadas.`,
  suggestions: 'Lugares',

  // ── Use my location ──────────────────────────────────────────────────────────────────────
  useMyLocation: 'Usar mi ubicación',
  locateMe: 'Localízame',
  nearMe: 'Cerca de mí',
  locating: 'Localizando…',
  cancelSearch: 'Cancelar',
  cancelLocate: 'Cancelar',
  cancelLocating: 'Cancelar la localización',
  requestingPosition: 'Pidiendo la ubicación',
  namingPlace: 'Poniendo nombre al lugar',
  elapsed: (seconds: number) => `${seconds.toFixed(0).padStart(2, '0')}\u00a0s`,
  locatingNote:
    'Enviamos tu ubicación al geocodificador Photon para poner nombre al lugar. Solo guardamos una celda de unos 10\u00a0km.',
  locationLabel: 'Ubicación',
  dismiss: 'Descartar',
  locateErrors: {
    denied: 'El acceso a la ubicación está bloqueado. Permítelo en la configuración del navegador o busca un lugar.',
    unavailable: 'Tu ubicación no está disponible ahora mismo. Busca un lugar.',
    timeout: 'La localización tardó demasiado. Vuelve a intentarlo o busca un lugar.',
    unsupported: 'Este navegador no puede compartir la ubicación. Busca un lugar.',
    insecure: 'La ubicación necesita una conexión segura (https). Busca un lugar.',
    other: 'Tu ubicación no está disponible ahora mismo. Busca un lugar.',
  },

  // ── Examples ──────────────────────────────────────────────────────────────────────────────
  orTry: 'O prueba',
  pinHint: 'O marca un punto en el globo',
  examplesLabel: 'Lugares de ejemplo',
  dropPin: 'Marcar un punto',
  chipName: (label: string, sublabel: string) => `${label}, ${sublabel}`,
  surprise: 'Sorpréndeme',
  surpriseName: 'Sorpréndeme: un lugar famoso elegido al azar',
}
export default landing
