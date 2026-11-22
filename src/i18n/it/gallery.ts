/**
 * Italian copy for the photo gallery and the photo frames it shows (see src/i18n/en/gallery.ts for where each message
 * shows; docs/i18n/it.md is the authority on every word here: §3.7 "Lightbox and gallery", §4, §7).
 *
 * Why it reads this way:
 *  - A satellite's image of the place is a *ripresa* (f.), never *sguardo*: *Ripresa più vicina*, *Ultima ripresa
 *    limpida*. "Photo" is *foto* (f., invariable), so the words that stand for it agree in the feminine (*Tutte*,
 *    *Nitide*, *Successiva*); "image" stays *immagine*, as in English. *Coperto* is said only where English says
 *    "Clouded over"; "Clouded" is *Nuvoloso*, a clear sky *Sereno* (§4, the cloud ladder).
 *  - The filter keeps English's width (*Tutte · Nitide · Meteo · Radar*), and the counter on the last clear look is
 *    *Settimana: N* for this week and that week alike: *Quella settimana: 12* would not fit its box (§7).
 *  - Names (satellite, place), days ("dom 1 nov") and clocks arrive written and stand bare: the place only after a
 *    colon (*Immagine di Sentinel-2C: Waterloo.*), the satellite after a simple preposition (*di Sentinel-2C*), never
 *    an article (§5.1, §5.2). Numbers go through fmt('it'): decimal comma, *25%* with no space (§6).
 *  - Buttons are tu imperatives (*Rivedi*, *Riprova*, *Ingrandisci*); waiting states are nouns (*Acquisizione*), so
 *    the product never speaks as *io* (§1).
 */
import type en from '../en/gallery'
import type { CoverLead } from '../en/gallery'
import { fmt } from '../../../api/_lib/i18n/format'
import { strong, type Rich } from '../../../api/_lib/i18n/parts'

const f = fmt('it')
const pct = (n: number) => `${f.int(n)}%`

const LEAD: Record<CoverLead, string> = {
  closest: 'Ripresa più vicina',
  lastClear: 'Ultima ripresa limpida',
  clouded: 'Coperto',
}

const gallery: typeof en = {
  // ── the bar over the photos ──────────────────────────────────────────────────────────────
  barLabel: 'Foto',
  filterLabel: 'Mostra le foto',
  // 21 characters against English's 23: *Dettagliate* or *Dettaglio* would widen the bar (§7).
  filter: { all: 'Tutte', detailed: 'Nitide', weather: 'Meteo', radar: 'Radar' },
  filterTitle: {
    // The pass list's order in the same words (passView.imagedOrder, §3.7).
    all: 'Tutte le foto: prima la ripresa più vicina, poi le più recenti',
    detailed: 'Sentinel-2 e Landsat, 10–30 m per pixel',
    weather: 'Mosaici meteo giornalieri, da 250 m per pixel in su',
    radar: 'Immagini radar di Sentinel-1, 20 m per pixel: attraverso le nuvole, di giorno e di notte',
  },
  // One form for both weeks: the label needs no demonstrative, and *Quella settimana: 12* is too wide (§7).
  photosThisWeek: (n: number) => `Settimana: ${f.int(n)}`,
  photosThatWeek: (n: number) => `Settimana: ${f.int(n)}`,
  prevPhoto: 'Foto precedente',
  prevTitle: 'Precedente (←)',
  nextPhoto: 'Foto successiva',
  nextTitle: 'Successiva (→)',
  carousel: 'carosello',
  trackLabel: 'Foto di questo luogo, scorri per vederne altre',

  // ── a slide ──────────────────────────────────────────────────────────────────────────────
  slide: 'diapositiva',
  lead: LEAD,
  slideLabel: (lead: CoverLead | undefined, sat: string, day: string, time: string, photo?: { k: number; n: number }) =>
    `${lead ? `${LEAD[lead]}: ` : ''}${sat}, ${day} ${time}${photo ? `, foto ${f.int(photo.k)} di ${f.int(photo.n)}` : ''}`,
  replayLabel: (sat: string, day: string, time: string) => `Rivedi questo passaggio sul globo: ${sat}, ${day} ${time}`,
  // Phones and laptops read *Rivedi*, portrait tablets *Rivedi il passaggio*: the long form begins with the short one.
  replay: ['Rivedi', strong(' il passaggio')] as Rich,
  viewLabel: {
    lastClear: (sat: string, day: string, time: string) => `Apri in grande l’ultima ripresa limpida: ${sat}, ${day} ${time}`,
    photo: (sat: string, day: string, time: string) => `Apri la foto in grande: ${sat}, ${day} ${time}`,
  },
  // The button opens the photo viewer: *Apri*, as short as English's "View".
  view: 'Apri',
  sharePass: 'Condividi questo passaggio',
  radarTag: 'Radar',
  noteMostlyCloud: 'I passaggi di questa settimana hanno visto soprattutto nuvole',
  noteLastClear: 'Ecco l’ultima ripresa limpida',
  clouded: {
    pct: (p: number) => `Coperto · ${pct(p)}`,
    coverAtSpot: 'Coperto · nuvole sul tuo punto',
    atSpot: 'Nuvole sul tuo punto',
  },
  // ≤ ~14 characters each (§7): *nubi* only in *Ombra di nubi*, to fit.
  status: {
    cloudedPct: (p: number) => `Nuvoloso · ${pct(p)}`,
    cloudAtSpot: 'Nuvole qui',
    clear: 'Sereno',
    cirrus: 'Cirri sottili',
    shadow: 'Ombra di nubi',
    cloudPct: (p: number) => `Nuvole ${pct(p)}`,
    mosaic: 'Mosaico meteo',
  },
  cropKm: (km: number) => `${km >= 100 ? f.int(km) : f.dec(km, 1)} km`,

  // ── a photo frame ────────────────────────────────────────────────────────────────────────
  // The place after a colon, never after *di* (§5.1); *di* before the satellite is a simple preposition (§5.2).
  photoAlt: (sat: string, place: string) => `Immagine di ${sat}: ${place}. Il luogo è al centro.`,
  acquiring: 'Acquisizione',
  noImage: 'Nessuna immagine ricevuta',
  retry: 'Riprova',
  scaleKm: (km: number) => `${km >= 1 ? f.int(km) : f.dec(km, 1)} km`,
  // The cartographic N, as Italian maps mark north.
  north: 'N',
  expandLabel: 'Ingrandisci la foto',
  expandTitle: 'Ingrandisci (F)',

  // ── a photo developing (the pushbroom reveal) ────────────────────────────────────────────
  stillRendering: 'Ancora in elaborazione. Le scene grandi possono richiedere 10 s o più.',
  cropMissing: 'L’archivio non ha inviato questo ritaglio. Potrebbe essere sovraccarico; l’immagine esiste comunque.',
  scanLine: (line: string, lines: string): Rich => ['Riga ', strong(line), ` → ${lines}`],
  awaiting: { pass: 'In attesa del passaggio', scan: 'In attesa della scansione' },
}

export default gallery
