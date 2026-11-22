/**
 * French copy for the photo gallery and the photo frames it shows (see src/i18n/en/gallery.ts for where each message
 * shows; docs/i18n/fr.md is the authority on every word here).
 *
 * Why it reads this way: the strip holds radar images, daily mosaics and full-disc frames as well as photographs, so
 * its chrome says *images* (fr.md §3.9), and *photo* stays only in the Detailed filter's tooltip, which names
 * Sentinel-2 and Landsat. "Closest look" is *Vue rapprochée* (never *Au plus près*, which is the closest approach);
 * "your spot" is *ici* in chips and labels (§4.1). The counter on the last clear look reads *27 en 7 jours* for this
 * week and an older one alike: *Semaine · 27* would read as a week number (decisions log, item 36). Chips are nouns,
 * so nothing agrees with the picture or the place; percentages and kilometres take a no-break space (§6.2).
 * Satellite names, days ("dim. 1 nov.") and clocks arrive written and are placed as they come.
 */
import type en from '../en/gallery'
import type { CoverLead } from '../en/gallery'
import { fmt } from '../../../api/_lib/i18n/format'
import { strong, type Rich } from '../../../api/_lib/i18n/parts'

const f = fmt('fr')
/** "25 %": the percent after a no-break space (fr.md §6.2) */
const pct = (n: number) => `${f.int(n)}\u00a0%`

const LEAD: Record<CoverLead, string> = {
  closest: 'Vue rapprochée',
  lastClear: 'Dernière vue dégagée',
  clouded: 'Ciel couvert',
}

const gallery: typeof en = {
  // ── the bar over the photos ──────────────────────────────────────────────────────────────
  barLabel: 'Images',
  filterLabel: 'Afficher les images',
  // Each segment within 8 characters (fr.md §7).
  filter: { all: 'Toutes', detailed: 'Précises', weather: 'Météo', radar: 'Radar' },
  filterTitle: {
    all: 'Toutes les images, la vue rapprochée d’abord, puis les plus récentes',
    detailed: 'Photos Sentinel-2 et Landsat, de 10 à 30\u00a0m par pixel',
    weather: 'Mosaïques météo quotidiennes, de 250\u00a0m par pixel ou plus',
    radar: 'Images radar Sentinel-1, 20\u00a0m par pixel\u00a0: à travers les nuages, de jour comme de nuit',
  },
  // One form for this week and an older one (fr.md §3.9): the box is about 12 characters, this is 13 at "27".
  photosThisWeek: (n: number) => `${f.int(n)} en 7\u00a0jours`,
  photosThatWeek: (n: number) => `${f.int(n)} en 7\u00a0jours`,
  prevPhoto: 'Image précédente',
  prevTitle: 'Précédente (←)',
  nextPhoto: 'Image suivante',
  nextTitle: 'Suivante (→)',
  carousel: 'carrousel',
  trackLabel: 'Images de ce lieu, balayez pour en voir plus',

  // ── a slide ──────────────────────────────────────────────────────────────────────────────
  slide: 'diapositive',
  lead: LEAD,
  slideLabel: (lead: CoverLead | undefined, sat: string, day: string, time: string, photo?: { k: number; n: number }) =>
    `${lead ? `${LEAD[lead]}\u00a0: ` : ''}${sat}, ${day} ${time}${photo ? `, image ${f.int(photo.k)} sur ${f.int(photo.n)}` : ''}`,
  replayLabel: (sat: string, day: string, time: string) => `Rejouer ce passage sur le globe\u00a0: ${sat}, ${day} ${time}`,
  // Phones and laptops read "Rejouer"; portrait tablets the whole "Rejouer ce passage" (fr.md §3.9 replay.long).
  replay: ['Rejouer', strong(' ce passage')] as Rich,
  viewLabel: {
    lastClear: (sat: string, day: string, time: string) => `Voir en grand la dernière vue dégagée\u00a0: ${sat}, ${day} ${time}`,
    photo: (sat: string, day: string, time: string) => `Voir l’image en grand\u00a0: ${sat}, ${day} ${time}`,
  },
  view: 'Voir',
  sharePass: 'Partager ce passage',
  radarTag: 'Radar',
  noteMostlyCloud: 'Surtout des nuages cette semaine',
  noteLastClear: 'Voici la dernière vue dégagée',
  clouded: {
    pct: (p: number) => `Ciel couvert · ${pct(p)}`,
    coverAtSpot: 'Ciel couvert · nuages ici',
    atSpot: 'Nuages ici',
  },
  // Nouns, within about 14 characters (fr.md §4.1: clouded chip *Nuages · 25 %*, spot *ici*).
  status: {
    cloudedPct: (p: number) => `Nuages · ${pct(p)}`,
    cloudAtSpot: 'Nuages ici',
    clear: 'Dégagé',
    cirrus: 'Cirrus fins',
    shadow: 'Ombre de nuage',
    cloudPct: (p: number) => `Nuages ${pct(p)}`,
    // *Mosaïque*, the pass list's tag: *Mosaïque quotidienne* (20) does not fit the slot, and *Mosaïque météo* ran the
    // laptop card's second line past its box beside *il y a 8 h*.
    mosaic: 'Mosaïque',
  },
  cropKm: (km: number) => `${km >= 100 ? f.int(km) : f.dec(km, 1)}\u00a0km`,

  // ── a photo frame ────────────────────────────────────────────────────────────────────────
  // Never *image de [PLACE]* (it would need *du*, *d’*): the place follows *sur* (fr.md §5.1, §5.2).
  photoAlt: (sat: string, place: string) => `Image prise par ${sat}, centrée sur ${place}.`,
  acquiring: 'Acquisition',
  noImage: 'Aucune image reçue',
  retry: 'Réessayer',
  scaleKm: (km: number) => `${km >= 1 ? f.int(km) : f.dec(km, 1)}\u00a0km`,
  // The cartographic N, as French maps print it.
  north: 'N',
  expandLabel: 'Agrandir l’image',
  expandTitle: 'Agrandir (F)',

  // ── a photo developing (the pushbroom reveal) ────────────────────────────────────────────
  // Under "Acquisition", which it continues.
  stillRendering: 'Toujours en cours. Les grandes scènes peuvent demander 10\u00a0s ou plus.',
  cropMissing: 'Les archives n’ont pas envoyé cet extrait. Elles sont peut-être surchargées\u202f; l’image elle-même existe bien.',
  scanLine: (line: string, lines: string): Rich => ['Ligne ', strong(line), ` → ${lines}`],
  awaiting: { pass: 'Passage à venir', scan: 'Balayage à venir' },
}

export default gallery
