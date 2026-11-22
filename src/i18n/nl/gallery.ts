/**
 * Dutch copy for the photo gallery and the photo frames it shows (see docs/i18n/nl.md §3.7 "Gallery and photo viewer",
 * §4.2, §6, §7): the bar, each slide's buttons and chips, what a picture shows at the place, and a frame's waiting and
 * error states.
 *
 * Why these words:
 *  - The gallery holds photos, daily mosaics, radar images and full-disc frames alike, so every item is a `beeld`,
 *    never a `foto` (§4.2): `Beelden`, `Vorig beeld`, `Beeld vergroten`.
 *  - The cover's reason is `Scherpst` (the most zoomed-in clear photo, never `Dichtstbij`, which says "nearest"),
 *    `Laatst helder` and `Dichtbewolkt`: the same tags as the share card's chip.
 *  - Chips and statuses are mono caps in measured boxes (≤ 8 characters a filter segment, ≤ 14 a status, ≤ 12 the
 *    counter), so they are nouns or short states with no article.
 *  - The Replay button keeps its tablet-only strong part in front: phones and laptops read `afspelen`, tablets
 *    `Deze overvlucht afspelen` (CSS uppercases both). `Afspelen`, never `Bekijken`, beside the verdict `Bekeken`.
 *  - Names, days ("zo 1 nov") and clocks arrive as they are, after a colon or a comma, never inflected; the place in
 *    the alt text follows `van`, the satellite `door` (§5).
 */
import type en from '../en/gallery'
import type { CoverLead } from '../en/gallery'
import { fmt } from '../../../api/_lib/i18n/format'
import { strong, type Rich } from '../../../api/_lib/i18n/parts'

const f = fmt('nl')
const pct = (n: number) => `${f.int(n)}%`

const LEAD: Record<CoverLead, string> = {
  closest: 'Scherpst',
  lastClear: 'Laatst helder',
  clouded: 'Dichtbewolkt',
}

/** "Sentinel-2C, zo 1 nov 16:14" */
const who = (sat: string, day: string, time: string) => `${sat}, ${day} ${time}`

const gallery: typeof en = {
  // ── the bar over the photos ──────────────────────────────────────────────────────────────
  barLabel: 'Beelden',
  filterLabel: 'Beelden tonen',
  filter: { all: 'Alles', detailed: 'Detail', weather: 'Weer', radar: 'Radar' },
  filterTitle: {
    all: 'Alle beelden: eerst het scherpste, dan de nieuwste',
    detailed: 'Sentinel-2 en Landsat, 10–30 m per pixel',
    weather: 'Dagelijkse weermozaïeken, 250 m per pixel en grover',
    radar: 'Radarbeelden van Sentinel-1, 20 m per pixel: door wolken heen, dag en nacht',
  },
  photosThisWeek: (n: number) => `${f.int(n)} deze week`,
  photosThatWeek: (n: number) => `${f.int(n)} die week`,
  prevPhoto: 'Vorig beeld',
  prevTitle: 'Vorige (←)',
  nextPhoto: 'Volgend beeld',
  nextTitle: 'Volgende (→)',
  carousel: 'carrousel',
  trackLabel: 'Beelden van deze plek, veeg voor meer',

  // ── a slide ──────────────────────────────────────────────────────────────────────────────
  slide: 'dia',
  lead: LEAD,
  slideLabel: (lead: CoverLead | undefined, sat: string, day: string, time: string, photo?: { k: number; n: number }) =>
    `${lead ? `${LEAD[lead]}: ` : ''}${who(sat, day, time)}${photo ? `, beeld ${f.int(photo.k)} van ${f.int(photo.n)}` : ''}`,
  replayLabel: (sat: string, day: string, time: string) => `Deze overvlucht afspelen op de wereldbol: ${who(sat, day, time)}`,
  replay: [strong('Deze overvlucht '), 'afspelen'] as Rich,
  viewLabel: {
    lastClear: (sat: string, day: string, time: string) => `De laatste heldere opname groot openen: ${who(sat, day, time)}`,
    photo: (sat: string, day: string, time: string) => `Beeld groot openen: ${who(sat, day, time)}`,
  },
  view: 'Openen',
  sharePass: 'Deze overvlucht delen',
  radarTag: 'Radar',
  noteMostlyCloud: 'Deze week vooral wolken',
  noteLastClear: 'De laatste heldere opname',
  clouded: {
    pct: (p: number) => `Dichtbewolkt · ${pct(p)}`,
    coverAtSpot: 'Dichtbewolkt · wolk op je plek',
    atSpot: 'Wolk op je plek',
  },
  status: {
    cloudedPct: (p: number) => `Bewolkt · ${pct(p)}`,
    cloudAtSpot: 'Wolk hier',
    clear: 'Helder',
    cirrus: 'Dunne cirrus',
    shadow: 'Wolkenschaduw',
    cloudPct: (p: number) => `Bewolking ${pct(p)}`,
    mosaic: 'Dagmozaïek',
  },
  cropKm: (km: number) => `${km >= 100 ? f.int(km) : f.dec(km, 1)} km`,

  // ── a photo frame ────────────────────────────────────────────────────────────────────────
  photoAlt: (sat: string, place: string) => `Beeld van ${place}, gemaakt door ${sat}. De plek ligt in het midden.`,
  acquiring: 'Ophalen',
  noImage: 'Geen beeld ontvangen',
  retry: 'Opnieuw',
  scaleKm: (km: number) => `${km >= 1 ? f.int(km) : f.dec(km, 1)} km`,
  // The cartographic N, understood by every Dutch reader (`noorden` starts with N as well).
  north: 'N',
  expandLabel: 'Beeld vergroten',
  expandTitle: 'Vergroten (F)',

  // ── a photo developing (the pushbroom reveal) ────────────────────────────────────────────
  stillRendering: 'Nog bezig. Grote opnamen kunnen 10 s of langer duren.',
  cropMissing: 'Het archief stuurde deze uitsnede niet. Misschien is het druk; het beeld zelf bestaat nog.',
  scanLine: (line: string, lines: string): Rich => ['Lijn ', strong(line), ` → ${lines}`],
  awaiting: { pass: 'Wacht op overvlucht', scan: 'Wacht op scan' },
}
export default gallery
