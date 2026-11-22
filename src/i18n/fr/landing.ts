/**
 * French copy for the landing (src/ui/landing; see docs/i18n/fr.md §3.1, §3.2, §3.9, §7): the hero, the place search,
 * "Use my location", the example chips and the maker's credit.
 *
 * Why it is built this way: the hero is the guide's final three lines, «Quelque chose / *vous* observait / cette
 * semaine.», the imparfait so nothing agrees with *vous* (§1.3). The sub says *Choisissez* (the reader can type, tap a
 * chip or drop a pin) and *Vous verrez*, never the stilted *Voyez*. The window is a count: «ces 7 derniers jours»,
 * and a one-day window «ces 24 dernières heures» (§3.2). The kicker's dates are CLDR's short months from Intl's parts
 * (never a month table), the day never padded, the month or year written once, the product's arrow. Labels and buttons
 * are infinitives or nouns (§1.1); status lines are nouns («Recherche», «Localisation…»). Typed coordinates keep the
 * point and the U+2212 minus, because the field parses only that form (§3.9). Typography: U+00A0 before a colon and
 * between a number and its unit, «» with U+202F inside.
 */
import type en from '../en/landing'
import { dateFormat } from '../../../api/_lib/i18n/dates'
import { fmt } from '../../../api/_lib/i18n/format'
import { accent, type Rich } from '../../../api/_lib/i18n/parts'

const f = fmt('fr')

/**
 * "7 derniers jours"; a one-day window is "24 dernières heures" (§3.2, §3.3). The form follows the number as shown
 * (rounded), and `many` takes the `other` text because an adjective sits between the number and the noun (§5.3).
 */
const lastSpan = (days: number) => {
  const d = Math.round(days)
  if (d === 1) return '24\u00a0dernières heures'
  const n = f.int(d)
  return f.plural(d, { one: `${n}\u00a0dernier jour`, many: `${n}\u00a0derniers jours`, other: `${n}\u00a0derniers jours` })
}

/** "1 résultat", "3 résultats", "1 000 000 de résultats": the form follows the number as shown (rounded). */
const results = (count: number) => {
  const c = Math.round(count)
  const n = f.int(c)
  return f.plural(c, { one: `${n}\u00a0résultat`, many: `${n}\u00a0de résultats`, other: `${n}\u00a0résultats` })
}

const UTC_DAY: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }

/** An instant's day, short month ("nov.") and year at UTC, from Intl's parts. */
function utcDay(ms: number) {
  const parts = dateFormat('fr', 'UTC', UTC_DAY).formatToParts(ms)
  const get = (t: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === t)?.value ?? ''
  return { day: get('day'), month: get('month'), year: get('year') }
}

const landing: typeof en = {
  // ── Hero ──────────────────────────────────────────────────────────────────────────────────
  lastDays: (days: number) => lastSpan(days),
  windowRange: (startMs: number, endMs: number) => {
    const a = utcDay(startMs)
    const b = utcDay(endMs)
    const end = `${b.day} ${b.month} ${b.year}`
    const start = a.year !== b.year ? `${a.day} ${a.month} ${a.year}` : a.month !== b.month ? `${a.day} ${a.month}` : a.day
    return `${start} → ${end} UTC`
  },
  hero: [['Quelque chose'], [accent('vous'), ' observait'], ['cette semaine.']] as Rich[],
  sub: (days: number): Rich => [
    `Choisissez un lieu, n’importe où sur Terre. Vous verrez tous les satellites qui l’ont survolé ces ${lastSpan(days)}, et les images qu’ils ont réellement prises.`,
  ],
  builtBy: (handle: string) => `Créé par ${handle}`,
  sourceLink: 'Code source',
  sourceLinkLabel: 'Code source\u00a0: le projet sur GitHub',

  // ── The place search ──────────────────────────────────────────────────────────────────────
  // *Chercher*: *Rechercher un lieu* ellipsised at 1024 px, beside the locate button.
  searchPlaceholder: 'Chercher un lieu',
  placeLabel: 'Lieu',
  searching: 'Recherche',
  searchUnavailable: 'Recherche indisponible',
  matches: (n: number) => results(n),
  noMatch: 'Aucun résultat',
  searchHint: 'Nom, adresse ou lat., long.',
  clearSearch: 'Effacer la recherche',
  go: 'Voir ce qui a survolé ce lieu',
  searchDown: 'La recherche de lieux ne répond pas. Les coordonnées telles que 43.47, −80.54 fonctionnent toujours.',
  nothingMatches: (query: string) =>
    `Rien ne correspond à «\u202f${query}\u202f». Essayez une ville, un monument ou des coordonnées.`,
  suggestions: 'Lieux',

  // ── Use my location ──────────────────────────────────────────────────────────────────────
  // *Ma position*: *Utiliser ma position* (20) left the field too little room for its placeholder on laptops.
  useMyLocation: 'Ma position',
  locateMe: 'Me localiser',
  nearMe: 'Près de moi',
  locating: 'Localisation…',
  cancelSearch: 'Annuler',
  cancelLocate: 'Annuler',
  cancelLocating: 'Annuler la localisation',
  requestingPosition: 'Demande de position',
  namingPlace: 'Recherche du nom',
  elapsed: (seconds: number) => `${seconds.toFixed(0).padStart(2, '0')}\u00a0s`,
  locatingNote:
    'Votre position est envoyée au géocodeur Photon pour nommer le lieu. Nous ne conservons qu’un carré d’environ 10\u00a0km de côté.',
  locationLabel: 'Localisation',
  dismiss: 'Fermer',
  locateErrors: {
    denied: 'L’accès à votre position est bloqué. Autorisez-le dans les paramètres de votre navigateur ou recherchez un lieu.',
    unavailable: 'Votre position n’est pas disponible pour l’instant. Recherchez plutôt un lieu.',
    timeout: 'La localisation a pris trop de temps. Réessayez ou recherchez un lieu.',
    unsupported: 'Ce navigateur ne peut pas fournir votre position. Recherchez plutôt un lieu.',
    insecure: 'La localisation exige une connexion sécurisée (https). Recherchez plutôt un lieu.',
    other: 'Votre position n’est pas disponible pour l’instant. Recherchez plutôt un lieu.',
  },

  // ── Examples ──────────────────────────────────────────────────────────────────────────────
  orTry: 'Ou essayez',
  pinHint: 'Ou cliquez sur le globe pour poser un repère',
  examplesLabel: 'Exemples de lieux',
  dropPin: 'Poser un repère',
  chipName: (label: string, sublabel: string) => (sublabel ? `${label}, ${sublabel}` : label),
  surprise: 'Au hasard',
  surpriseName: 'Au hasard\u00a0: un lieu célèbre tiré au sort',
}
export default landing
