/**
 * Brazilian Portuguese copy for the landing (see docs/i18n/pt-BR.md §3.1, §3.2, §3.7, §4.2, §7): the hero, the place
 * search, "Use my location", the example chips and the maker's credit.
 *
 * Why it is built this way: the hero is the guide's three lines, *Algo* / *observou você* / *esta semana.*, with the
 * accent on *você*, the one written Brazilian pronoun that can carry the stress (never *te*, never a participle that
 * would guess the reader's gender). The sub line is the guide's sentence; *ele* there is *lugar*, from the sentence
 * before, never a pronoun for a slot, and the comma before *e* stops the garden path. The window's length is a count,
 * so its article and adjective agree with it (*nos últimos 7 dias*, *no último dia*), and 0, which pt-BR's plural rule
 * puts in `one`, takes the plural. The kicker's dates come from Intl's parts (never a month table), periods stripped
 * and no *de* (*1 → 8 nov 2026 UTC*), with the arrow every language uses.
 *
 * Buttons and placeholders are infinitives with no pronoun (*Buscar um lugar*, *Usar meu local*, *Marcar
 * ponto*); instructions inside sentences are the imperative of *você* (*Busque*, *Tente*, *Permita*); the one fixed
 * exception is *Surpreenda-me*. Status lines while something runs are gerunds (*Buscando*, *Localizando…*). Faults say
 * what failed, then the way out, with no apology. The example coordinates in `searchDown` use the dot notation and an
 * ASCII hyphen-minus, the only form the field parses today. Numbers and their units never part (U+00A0).
 */
import type en from '../en/landing'
import { fmt } from '../../../api/_lib/i18n/format'
import { dateFormat } from '../../../api/_lib/i18n/dates'
import { accent, type Rich } from '../../../api/_lib/i18n/parts'

const f = fmt('pt-BR')

/** A count of days that may be 0 (pt-BR puts 0 in `one`): the singular only for exactly one day. */
const isOneDay = (n: number) => n !== 0 && f.category(n) === 'one'

const UTC_DAY: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }

/** An instant's day, short month ("nov", "set") and year at UTC, from Intl's parts, the abbreviation's period stripped. */
function utcDay(ms: number) {
  const parts = dateFormat('pt-BR', 'UTC', UTC_DAY).formatToParts(ms)
  const get = (t: Intl.DateTimeFormatPartTypes) => (parts.find((p) => p.type === t)?.value ?? '').replace(/\.$/, '')
  return { day: get('day'), month: get('month'), year: get('year') }
}

const landing: typeof en = {
  // ── Hero ──────────────────────────────────────────────────────────────────────────────────
  lastDays: (days: number) => (isOneDay(days) ? 'Último dia' : `Últimos ${f.int(days)} dias`),
  windowRange: (startMs: number, endMs: number) => {
    const a = utcDay(startMs)
    const b = utcDay(endMs)
    const end = `${b.day} ${b.month} ${b.year}`
    const start = a.year !== b.year ? `${a.day} ${a.month} ${a.year}` : a.month !== b.month ? `${a.day} ${a.month}` : a.day
    return `${start} → ${end} UTC`
  },
  hero: [['Algo'], ['observou ', accent('você')], ['esta semana.']] as Rich[],
  sub: (days: number): Rich => [
    `Busque qualquer lugar da Terra. Veja todos os satélites que passaram sobre ele ${
      isOneDay(days) ? 'no último dia' : `nos últimos ${f.int(days)} dias`
    }, e as imagens reais que captaram.`,
  ],
  builtBy: (handle: string) => `Feito por ${handle}`,
  sourceLink: 'Código aberto',
  sourceLinkLabel: 'Código aberto: o projeto no GitHub',

  // ── The place search ──────────────────────────────────────────────────────────────────────
  searchPlaceholder: 'Buscar um lugar',
  placeLabel: 'Lugar',
  searching: 'Buscando',
  searchUnavailable: 'Busca indisponível',
  matches: (n: number) =>
    `${f.int(n)} ${n === 0 ? 'resultados' : f.plural(n, { one: 'resultado', many: 'resultados', other: 'resultados' })}`,
  noMatch: 'Nenhum resultado',
  searchHint: 'Nome, endereço ou lat, lon',
  clearSearch: 'Limpar a busca',
  go: 'Mostrar o que passou sobre este lugar',
  searchDown: 'A busca de lugares não está respondendo. Coordenadas como 43.47, -80.54 ainda funcionam.',
  nothingMatches: (query: string) =>
    `Nenhum resultado para “${query}”. Tente uma cidade, um ponto turístico ou coordenadas.`,
  suggestions: 'Lugares',

  // ── Use my location ──────────────────────────────────────────────────────────────────────
  useMyLocation: 'Usar meu local',
  locateMe: 'Localizar',
  nearMe: 'Perto de mim',
  locating: 'Localizando…',
  cancelSearch: 'Cancelar',
  cancelLocate: 'Cancelar',
  cancelLocating: 'Cancelar localização',
  requestingPosition: 'Obtendo a posição',
  namingPlace: 'Identificando o lugar',
  elapsed: (seconds: number) => `${seconds.toFixed(0).padStart(2, '0')} s`,
  locatingNote:
    'A sua posição vai para o geocodificador Photon para dar nome ao lugar. Guardamos apenas uma célula de cerca de 10 km.',
  locationLabel: 'Localização',
  dismiss: 'Fechar',
  locateErrors: {
    denied: 'O acesso à localização está bloqueado. Permita o acesso nas configurações do navegador ou busque um lugar.',
    unavailable: 'A sua posição não está disponível agora. Busque um lugar.',
    timeout: 'Encontrar a sua posição demorou demais. Tente de novo ou busque um lugar.',
    unsupported: 'Este navegador não compartilha a localização. Busque um lugar.',
    insecure: 'A localização precisa de uma conexão segura (https). Busque um lugar.',
    other: 'A sua posição não está disponível agora. Busque um lugar.',
  },

  // ── Examples ──────────────────────────────────────────────────────────────────────────────
  orTry: 'Ou experimente',
  pinHint: 'Ou clique no globo para marcar um ponto',
  examplesLabel: 'Lugares de exemplo',
  dropPin: 'Marcar ponto',
  chipName: (label: string, sublabel: string) => `${label}, ${sublabel}`,
  surprise: 'Surpreenda-me',
  surpriseName: 'Surpreenda-me: um lugar famoso escolhido ao acaso',
}
export default landing
