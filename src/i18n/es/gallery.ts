/**
 * Spanish copy for the photo gallery and the photo frames it shows (see src/i18n/en/gallery.ts; docs/i18n/es.md is the
 * authority on every word here).
 *
 * Why it reads this way: the strip holds radar images, daily mosaics and geostationary frames as well as photographs,
 * so everything that names its pictures says *imagen*, never *foto* (es.md §0, §4). The spot is *aquí* or *justo aquí*,
 * never *tu punto* (§9). The filter keeps each segment to 8 characters (*Todo · Detalle · Meteo · Radar*, §7) and
 * its tooltips carry the full words (§9). Names, days ("dom 1 nov") and clocks arrive written and are placed bare: no
 * article, nothing that agrees with them (§5). Numbers go through fmt('es'); percent is `25%`, no space (§6).
 */
import type en from '../en/gallery'
import type { CoverLead } from '../en/gallery'
import { fmt } from '../../../api/_lib/i18n/format'
import { strong, type Rich } from '../../../api/_lib/i18n/parts'

const f = fmt('es')
const pct = (n: number) => `${f.int(n)}%`

const LEAD: Record<CoverLead, string> = {
  closest: 'Vista más cercana',
  lastClear: 'Última sin nubes',
  clouded: 'Nublado',
}

const gallery: typeof en = {
  // ── the bar over the photos ──────────────────────────────────────────────────────────────
  barLabel: 'Imágenes',
  filterLabel: 'Mostrar imágenes',
  filter: { all: 'Todo', detailed: 'Detalle', weather: 'Meteo', radar: 'Radar' },
  filterTitle: {
    all: 'Todas las imágenes, de la más reciente a la más antigua, tras la vista más cercana',
    detailed: 'Sentinel-2 y Landsat, 10–30 m por píxel',
    weather: 'Mosaicos meteorológicos diarios, 250 m por píxel o más',
    radar: 'Imágenes de radar de Sentinel-1, 20 m por píxel: a través de las nubes, de día o de noche',
  },
  photosThisWeek: (n: number) => `${f.int(n)} esta semana`,
  photosThatWeek: (n: number) => `${f.int(n)} esa semana`,
  prevPhoto: 'Imagen anterior',
  prevTitle: 'Imagen anterior (←)',
  nextPhoto: 'Imagen siguiente',
  nextTitle: 'Imagen siguiente (→)',
  carousel: 'carrusel',
  trackLabel: 'Imágenes de este lugar, desliza para ver más',

  // ── a slide ──────────────────────────────────────────────────────────────────────────────
  slide: 'diapositiva',
  lead: LEAD,
  slideLabel: (lead: CoverLead | undefined, sat: string, day: string, time: string, photo?: { k: number; n: number }) =>
    `${lead ? `${LEAD[lead]}: ` : ''}${sat}, ${day} ${time}${photo ? `, imagen ${f.int(photo.k)} de ${f.int(photo.n)}` : ''}`,
  replayLabel: (sat: string, day: string, time: string) => `Repetir esta pasada en el globo: ${sat}, ${day} ${time}`,
  // Phones and laptops read "Repetir"; portrait tablets the whole "Repetir esta pasada".
  replay: ['Repetir', strong(' esta pasada')] as Rich,
  viewLabel: {
    lastClear: (sat: string, day: string, time: string) => `Ver en grande la última vista despejada: ${sat}, ${day} ${time}`,
    photo: (sat: string, day: string, time: string) => `Ver la imagen en grande: ${sat}, ${day} ${time}`,
  },
  view: 'Ver',
  sharePass: 'Compartir esta pasada',
  radarTag: 'Radar',
  noteMostlyCloud: 'Las pasadas de esta semana vieron casi solo nubes',
  noteLastClear: 'Esta es la última vista despejada',
  clouded: {
    pct: (p: number) => `Nublado · ${pct(p)}`,
    coverAtSpot: 'Nublado · nubes justo aquí',
    atSpot: 'Nubes justo aquí',
  },
  status: {
    cloudedPct: (p: number) => `Nublado · ${pct(p)}`,
    cloudAtSpot: 'Nubes aquí',
    clear: 'Despejado',
    cirrus: 'Cirros finos',
    shadow: 'Sombra de nube',
    cloudPct: (p: number) => `Nubosidad ${pct(p)}`,
    mosaic: 'Mosaico diario',
  },
  cropKm: (km: number) => `${km >= 100 ? f.int(km) : f.dec(km, 1)} km`,

  // ── a photo frame ────────────────────────────────────────────────────────────────────────
  photoAlt: (sat: string, place: string) => `Imagen de ${place} tomada por ${sat}. El lugar está en el centro.`,
  acquiring: 'Captando',
  noImage: 'No llegó ninguna imagen',
  retry: 'Reintentar',
  scaleKm: (km: number) => `${km >= 1 ? f.int(km) : f.dec(km, 1)} km`,
  // The cartographic N, as Spanish maps mark north.
  north: 'N',
  expandLabel: 'Ampliar la imagen',
  expandTitle: 'Ampliar (F)',

  // ── a photo developing (the pushbroom reveal) ────────────────────────────────────────────
  stillRendering: 'Sigue generándose. Las escenas grandes pueden tardar 10 s o más.',
  cropMissing: 'El archivo no envió este recorte. Puede estar saturado; la imagen sí existe.',
  scanLine: (line: string, lines: string): Rich => ['Línea ', strong(line), ` → ${lines}`],
  awaiting: { pass: 'Esperando la pasada', scan: 'Esperando el escaneo' },
}

export default gallery
