/**
 * Polish copy for the photo gallery and the photo frames it shows (see docs/i18n/pl.md §3.9, §4.1, §6.3, §7): the bar,
 * each slide's buttons and chips, what a picture shows at the place, and a frame's waiting and error states.
 *
 * Why these words:
 *  - "Photo" is «zdjęcie», as the English says it; anything that names a radar image says «obraz» (§0). A cover's reason
 *    is an «ujęcie»: «Ujęcie z najbliższa» (never «najbliższe ujęcie», which reads "the next shot" beside ‹ ›) and, in
 *    a chip, «Ostatnie bez chmur»; prose keeps the full «ostatnie bezchmurne ujęcie».
 *  - Chips and statuses are mono caps in measured boxes (≤ ~8 characters a filter segment, ≤ ~14 a status, ≤ ~12 the
 *    counter), so they are nouns or prepositional states, never verbs. The counter on the last clear look says «12 z
 *    tygodnia» for this week and an older one alike: «12 w tym tygodniu» overflows its box (§7).
 *  - Names never take a case: the satellite follows «z satelity», the place stands before a colon (§5.1, §5.2). Days
 *    («niedz., 1 lis») and clocks («16:14») arrive written by the pl time formatter and are placed as they come.
 *  - Numbers keep their unit with a no-break space («10,0 km»), and short strings keep a one-letter word with the next.
 */
import type en from '../en/gallery'
import type { CoverLead } from '../en/gallery'
import { fmt } from '../../../api/_lib/i18n/format'
import { strong, type Rich } from '../../../api/_lib/i18n/parts'

const f = fmt('pl')
const pct = (n: number) => `${f.int(n)}%`
/** A whole count, or a fraction kept (never shown, but a fraction must not print as a rounded integer) */
const count = (n: number) => (Number.isInteger(n) ? f.int(n) : f.dec(n, 1))

const LEAD: Record<CoverLead, string> = {
  closest: 'Ujęcie z\u00a0najbliższa',
  lastClear: 'Ostatnie bez chmur',
  clouded: 'Zachmurzone',
}

/** «Sentinel-2C, niedz., 1 lis 16:14»: the day already holds its own comma, the clock follows it */
const who = (sat: string, day: string, time: string) => `${sat}, ${day} ${time}`

const gallery: typeof en = {
  // ── the bar over the photos ──────────────────────────────────────────────────────────────
  barLabel: 'Zdjęcia',
  filterLabel: 'Pokaż zdjęcia',
  // «Dokładne» is the glossary's one word for 10–30 m (the footnote counts «dokładnych obrazów»); «Pogoda» fits 8.
  filter: { all: 'Wszystkie', detailed: 'Dokładne', weather: 'Pogoda', radar: 'Radar' },
  filterTitle: {
    all: 'Wszystkie zdjęcia: najpierw ujęcie z\u00a0najbliższa, potem najnowsze',
    detailed: 'Sentinel-2 i\u00a0Landsat, 10–30\u00a0m na piksel',
    weather: 'Dzienne mozaiki pogodowe, od 250\u00a0m na piksel',
    // Radar is an image, never a photo: «obrazy radarowe».
    radar: 'Obrazy radarowe z\u00a0satelity Sentinel-1, 20\u00a0m na piksel: przez chmury, w\u00a0dzień i\u00a0w\u00a0nocy',
  },
  // «z tygodnia» needs no agreement with the count, so one form serves every number.
  photosThisWeek: (n: number) => `${count(n)} z\u00a0tygodnia`,
  photosThatWeek: (n: number) => `${count(n)} z\u00a0tygodnia`,
  prevPhoto: 'Poprzednie zdjęcie',
  prevTitle: 'Poprzednie (←)',
  nextPhoto: 'Następne zdjęcie',
  nextTitle: 'Następne (→)',
  carousel: 'karuzela',
  trackLabel: 'Zdjęcia tego miejsca; przesuń, by zobaczyć więcej',

  // ── a slide ──────────────────────────────────────────────────────────────────────────────
  slide: 'slajd',
  lead: LEAD,
  slideLabel: (lead: CoverLead | undefined, sat: string, day: string, time: string, photo?: { k: number; n: number }) =>
    `${lead ? `${LEAD[lead]}: ` : ''}${who(sat, day, time)}${photo ? `, zdjęcie ${f.int(photo.k)} z ${f.int(photo.n)}` : ''}`,
  replayLabel: (sat: string, day: string, time: string) => `Odtwórz ten przelot na globusie: ${who(sat, day, time)}`,
  // Phones and laptops read «Odtwórz», portrait tablets «Odtwórz przelot» (the glossary's button words).
  replay: ['Odtwórz', strong(' przelot')] as Rich,
  viewLabel: {
    lastClear: (sat: string, day: string, time: string) => `Powiększ ostatnie bezchmurne ujęcie: ${who(sat, day, time)}`,
    photo: (sat: string, day: string, time: string) => `Powiększ zdjęcie: ${who(sat, day, time)}`,
  },
  // «Powiększ», the expand control's own word, beside the expand glyph: «Otwórz» would differ from «Odtwórz» (the
  // Replay button in the same slot on the next slide) by one letter. The accessible names above start with it.
  view: 'Powiększ',
  sharePass: 'Udostępnij ten przelot',
  radarTag: 'Radar',
  noteMostlyCloud: 'Przeloty z\u00a0tego tygodnia widziały głównie chmury',
  noteLastClear: 'Oto ostatnie bezchmurne ujęcie',
  clouded: {
    pct: (p: number) => `Zachmurzone · ${pct(p)}`,
    coverAtSpot: 'Zachmurzone · chmury nad twoim punktem',
    atSpot: 'Chmury nad twoim punktem',
  },
  status: {
    cloudedPct: (p: number) => `Pochmurne · ${pct(p)}`,
    cloudAtSpot: 'Chmury tutaj',
    clear: 'Czysto',
    cirrus: 'Cirrusy',
    shadow: 'Cień chmur',
    cloudPct: (p: number) => `Chmury ${pct(p)}`,
    mosaic: 'Dzienna mozaika',
  },
  cropKm: (km: number) => `${km >= 100 ? f.int(km) : f.dec(km, 1)}\u00a0km`,

  // ── a photo frame ────────────────────────────────────────────────────────────────────────
  // The place before a colon (nominative), the satellite after its classifier «satelity» (§5.1, §5.2). «obraz»: the
  // same alt text serves mosaics, radar and full-disc frames.
  photoAlt: (sat: string, place: string) => `${place}: obraz z satelity ${sat}. To miejsce jest na środku.`,
  acquiring: 'Pobieranie',
  noImage: 'Nie przysłano obrazu',
  retry: 'Ponów',
  scaleKm: (km: number) => `${km >= 1 ? f.int(km) : f.dec(km, 1)}\u00a0km`,
  // The cartographic N, as every readout writes the compass (§6.6): a Polish «P» would be read as nothing.
  north: 'N',
  expandLabel: 'Powiększ zdjęcie',
  expandTitle: 'Powiększ (F)',

  // ── a photo developing (the pushbroom reveal) ────────────────────────────────────────────
  stillRendering: 'Wciąż się renderuje. Duże sceny mogą zająć 10\u00a0s lub więcej.',
  cropMissing: 'Archiwum nie przysłało tego wycinka. Może być zajęte; sam obraz nadal istnieje.',
  scanLine: (line: string, lines: string): Rich => ['Linia ', strong(line), ` → ${lines}`],
  // A countdown follows: «DO PRZELOTU · T−00:00:41».
  awaiting: { pass: 'Do przelotu', scan: 'Do skanu' },
}
export default gallery
