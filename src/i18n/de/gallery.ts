/**
 * German copy for the photo gallery and the photo frames it shows (see src/i18n/en/gallery.ts for where each message
 * shows; docs/i18n/de.md §3.9 is the authority on every word here).
 *
 * Why it reads this way: the strip holds radar images, daily mosaics and full-disc frames as well as photographs, so
 * its chrome says *Bilder* (never *Fotos*, de.md §4.1); *Foto* would not be honest for radar. "Closest look" is *Aus
 * nächster Nähe* (never *Nächster Blick*, which reads "next look"), "your spot" is *dein Ort* (never *an deiner
 * Stelle*). Cloud follows the German Weather Service's words: *Bedeckt* for a picture that is clouded over, *Bewölkt*
 * in the short status. Chips and labels are nouns in sentence case, uppercased by CSS (ß becomes SS there, correctly).
 * The counter on the last clear look is *12 neuere* for this week and an older one alike: *12 diese Woche* does not fit
 * its 91 px box (§7). Replay has no tablet-only strong part: *Abspielen* is already the whole label. Numbers come from
 * fmt('de') with a no-break space before units and % (*25 %*, *10 km*); satellite names, days ("So 01.11.") and
 * clocks arrive written and are placed as they come.
 */
import type en from '../en/gallery'
import type { CoverLead } from '../en/gallery'
import { fmt } from '../../../api/_lib/i18n/format'
import { strong, type Rich } from '../../../api/_lib/i18n/parts'

const f = fmt('de')
/** "25 %": the percent after a no-break space (de.md §6.2) */
const pct = (n: number) => `${f.int(n)}\u00a0%`

const LEAD: Record<CoverLead, string> = {
  closest: 'Aus nächster Nähe',
  lastClear: 'Letzter klarer Blick',
  clouded: 'Bedeckt',
}

const gallery: typeof en = {
  // ── the bar over the photos ──────────────────────────────────────────────────────────────
  barLabel: 'Bilder',
  filterLabel: 'Bilder filtern',
  // Each segment within 8 characters (de.md §7: *Detail* 45 px against *Detailed* 60).
  filter: { all: 'Alle', detailed: 'Detail', weather: 'Wetter', radar: 'Radar' },
  filterTitle: {
    all: 'Alle Bilder: erst der Blick aus nächster Nähe, dann die neuesten',
    detailed: 'Sentinel-2 und Landsat, 10–30\u00a0m pro Pixel',
    weather: 'Tägliche Wettermosaike, 250\u00a0m pro Pixel und gröber',
    radar: 'Radarbilder von Sentinel-1, 20\u00a0m pro Pixel: durch Wolken, bei Tag und Nacht',
  },
  // One form for this week and an older one (de.md §3.9): the photos of the window that follow the last clear look.
  photosThisWeek: (n: number) => f.plural(n, { one: `${f.int(n)} neueres`, other: `${f.int(n)} neuere` }),
  photosThatWeek: (n: number) => f.plural(n, { one: `${f.int(n)} neueres`, other: `${f.int(n)} neuere` }),
  prevPhoto: 'Voriges Bild',
  prevTitle: 'Voriges (←)',
  nextPhoto: 'Nächstes Bild',
  nextTitle: 'Nächstes (→)',
  carousel: 'Karussell',
  trackLabel: 'Bilder dieses Ortes, zum Blättern wischen',

  // ── a slide ──────────────────────────────────────────────────────────────────────────────
  slide: 'Folie',
  lead: LEAD,
  slideLabel: (lead: CoverLead | undefined, sat: string, day: string, time: string, photo?: { k: number; n: number }) =>
    `${lead ? `${LEAD[lead]}: ` : ''}${sat}, ${day} ${time}${photo ? `, Bild ${f.int(photo.k)} von ${f.int(photo.n)}` : ''}`,
  replayLabel: (sat: string, day: string, time: string) => `Überflug auf dem Globus abspielen: ${sat}, ${day} ${time}`,
  // No strong part: *Abspielen* is the label at every width (de.md §3.9).
  replay: ['Abspielen'] as Rich,
  viewLabel: {
    // A button's name: the infinitive with its object first and no article, like *Bild groß ansehen* (de.md §7).
    lastClear: (sat: string, day: string, time: string) => `Letzten klaren Blick groß ansehen: ${sat}, ${day} ${time}`,
    photo: (sat: string, day: string, time: string) => `Bild groß ansehen: ${sat}, ${day} ${time}`,
  },
  view: 'Ansehen',
  sharePass: 'Überflug teilen',
  radarTag: 'Radar',
  noteMostlyCloud: 'Die Überflüge dieser Woche sahen überwiegend Wolken',
  noteLastClear: 'Hier ist der letzte klare Blick',
  clouded: {
    pct: (p: number) => `Bedeckt · ${pct(p)}`,
    coverAtSpot: 'Bedeckt · Wolken an deinem Ort',
    atSpot: 'Wolken an deinem Ort',
  },
  // Nouns within about 14 characters (de.md §7: *Wolkenschatten* and *Bewölkt · 81 %* are 106 px, the box's width).
  status: {
    cloudedPct: (p: number) => `Bewölkt · ${pct(p)}`,
    cloudAtSpot: 'Wolken am Ort',
    clear: 'Klar',
    cirrus: 'Dünne Zirren',
    shadow: 'Wolkenschatten',
    cloudPct: (p: number) => `Wolken ${pct(p)}`,
    mosaic: 'Tagesmosaik',
  },
  cropKm: (km: number) => `${km >= 100 ? f.int(km) : f.dec(km, 1)}\u00a0km`,

  // ── a photo frame ────────────────────────────────────────────────────────────────────────
  // A colon frame keeps the place bare and out of a case (de.md §5.1); *Bild*, since it may be radar. A name that
  // already ends on a stop ("Washington, D.C.") takes no second one.
  photoAlt: (sat: string, place: string) => `Bild von ${sat}: ${place}${/[.…!?]$/u.test(place) ? '' : '.'} Der Ort liegt in der Bildmitte.`,
  // A blinking caret follows it on screen, so no ellipsis of its own (the card's *Erfassung …* has no caret).
  acquiring: 'Erfassung',
  noImage: 'Kein Bild erhalten',
  retry: 'Erneut laden',
  scaleKm: (km: number) => `${km >= 1 ? f.int(km) : f.dec(km, 1)}\u00a0km`,
  // The cartographic N, as German maps print it.
  north: 'N',
  expandLabel: 'Bild vergrößern',
  expandTitle: 'Vergrößern (F)',

  // ── a photo developing (the pushbroom reveal) ────────────────────────────────────────────
  stillRendering: 'Rendert noch. Große Szenen können 10\u00a0s und länger brauchen.',
  // Three mono lines of ≤ ~30 characters above the retry button, as the English (the title already says no crop came).
  cropMissing: 'Das Archiv ist vielleicht ausgelastet. Das Bild selbst gibt es trotzdem.',
  scanLine: (line: string, lines: string): Rich => ['Zeile ', strong(line), ` → ${lines}`],
  awaiting: { pass: 'Überflug steht bevor', scan: 'Scan steht bevor' },
}

export default gallery
