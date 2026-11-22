/**
 * Brazilian Portuguese copy for the photo gallery and the photo frames it shows (see src/i18n/en/gallery.ts for where
 * each line shows; docs/i18n/pt-BR.md is the authority on every word here).
 *
 * Why it reads this way: the strip holds radar images, daily mosaics and full-disc frames as well as photographs, so
 * everything that names its pictures generically says *imagem*; *foto* is only the filter that holds Sentinel-2 and
 * Landsat alone (pt-BR.md §0, §4.2: *Todas · Fotos · Meteo · Radar*, each ≤ 8 characters, the tooltips saying exactly
 * what each holds). A "look" is a *vista*, the searched point *o seu ponto* in prose and *ponto* in chips, a clouded
 * cover chip *Encoberto*, a status *Nublado* (§4.1). The counter on the last clear look says *27 na semana*, true for
 * this week and for an older one (§7). The alt text names the satellite after *do satélite*, so no article ever lands
 * on the bare name, and the place follows a colon (§5). Days ("dom 1 nov") and clocks arrive written; a clock takes
 * *às*, or *à* when it starts 00 or 01 (§5). Numbers go through fmt('pt-BR'); a no-break space ties a number to its
 * unit (§6).
 */
import type en from '../en/gallery'
import type { CoverLead } from '../en/gallery'
import { fmt } from '../../../api/_lib/i18n/format'
import { strong, type Rich } from '../../../api/_lib/i18n/parts'

const f = fmt('pt-BR')
const pct = (n: number) => `${f.int(n)}%`
/** "às 16:14", "à 01:05" (the clock's hour decides the article; a no-break space ties it to the clock, as in pass.ts) */
const at = (clock: string) => `${parseInt(clock, 10) <= 1 ? 'à' : 'às'} ${clock}`

const LEAD: Record<CoverLead, string> = {
  closest: 'Vista mais próxima',
  lastClear: 'Última vista limpa',
  clouded: 'Encoberto',
}

const gallery: typeof en = {
  // ── the bar over the photos ──────────────────────────────────────────────────────────────
  barLabel: 'Imagens',
  filterLabel: 'Mostrar imagens',
  filter: { all: 'Todas', detailed: 'Fotos', weather: 'Meteo', radar: 'Radar' },
  filterTitle: {
    all: 'Todas as imagens: a vista mais próxima, depois as mais recentes',
    detailed: 'Sentinel-2 e Landsat, 10–30 m por pixel',
    weather: 'Mosaicos meteorológicos diários e imagens de disco completo, pixels de 250 m ou maiores',
    radar: 'Imagens de radar do Sentinel-1, 20 m por pixel: através das nuvens, de dia ou de noite',
  },
  // One form for both windows: "na semana" is true of this week and of an older one, and fits the ~12-character box.
  photosThisWeek: (n: number) => `${f.int(n)} na semana`,
  photosThatWeek: (n: number) => `${f.int(n)} na semana`,
  prevPhoto: 'Imagem anterior',
  prevTitle: 'Anterior (←)',
  nextPhoto: 'Próxima imagem',
  nextTitle: 'Próxima (→)',
  carousel: 'carrossel',
  trackLabel: 'Imagens deste lugar, deslize para ver mais',

  // ── a slide ──────────────────────────────────────────────────────────────────────────────
  slide: 'slide',
  lead: LEAD,
  slideLabel: (lead: CoverLead | undefined, sat: string, day: string, time: string, photo?: { k: number; n: number }) =>
    `${lead ? `${LEAD[lead]}: ` : ''}${sat}, ${day}, ${at(time)}${photo ? `, imagem ${f.int(photo.k)} de ${f.int(photo.n)}` : ''}`,
  replayLabel: (sat: string, day: string, time: string) => `Rever esta passagem no globo: ${sat}, ${day}, ${at(time)}`,
  // Phones and laptops read "Rever"; portrait tablets the whole "Rever esta passagem".
  replay: ['Rever', strong(' esta passagem')] as Rich,
  viewLabel: {
    lastClear: (sat: string, day: string, time: string) => `Ver a última vista limpa ampliada: ${sat}, ${day}, ${at(time)}`,
    photo: (sat: string, day: string, time: string) => `Ver a imagem ampliada: ${sat}, ${day}, ${at(time)}`,
  },
  view: 'Ver',
  sharePass: 'Compartilhar esta passagem',
  radarTag: 'Radar',
  noteMostlyCloud: 'As passagens desta semana viram quase só nuvens',
  noteLastClear: 'Esta é a última vista limpa',
  clouded: {
    pct: (p: number) => `Encoberto · ${pct(p)}`,
    coverAtSpot: 'Encoberto · nuvem no seu ponto',
    atSpot: 'Nuvem no seu ponto',
  },
  status: {
    cloudedPct: (p: number) => `Nublado · ${pct(p)}`,
    cloudAtSpot: 'Nuvem no ponto',
    clear: 'Céu limpo',
    cirrus: 'Cirros finos',
    shadow: 'Sombra',
    cloudPct: (p: number) => `Nuvens ${pct(p)}`,
    mosaic: 'Mosaico diário',
  },
  cropKm: (km: number) => `${km >= 100 ? f.int(km) : f.dec(km, 1)} km`,

  // ── a photo frame ────────────────────────────────────────────────────────────────────────
  photoAlt: (sat: string, place: string) => `Imagem do satélite ${sat}: ${place}. O lugar está no centro.`,
  acquiring: 'Captando',
  noImage: 'Nenhuma imagem recebida',
  retry: 'Recarregar',
  scaleKm: (km: number) => `${km >= 1 ? f.int(km) : f.dec(km, 1)} km`,
  // The cartographic N, as Brazilian maps mark north.
  north: 'N',
  expandLabel: 'Ampliar a imagem',
  expandTitle: 'Ampliar (F)',

  // ── a photo developing (the pushbroom reveal) ────────────────────────────────────────────
  stillRendering: 'Ainda gerando. Cenas grandes podem levar 10 s ou mais.',
  cropMissing: 'O arquivo não enviou este recorte. Talvez esteja sobrecarregado; a imagem em si ainda existe.',
  scanLine: (line: string, lines: string): Rich => ['Linha ', strong(line), ` → ${lines}`],
  awaiting: { pass: 'Aguardando a passagem', scan: 'Aguardando a varredura' },
}

export default gallery
