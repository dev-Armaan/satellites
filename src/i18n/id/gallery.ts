/**
 * Indonesian copy for the photo gallery and the photo frames it shows (see src/i18n/en/gallery.ts, and
 * docs/i18n/id.md, which is the authority on every word here).
 *
 * Why it reads this way: the strip can hold radar images, daily mosaics and geostationary frames, so every element
 * that names its pictures says *citra*, never *foto* (id.md §0, §9.2 item 4). A count never stands right before
 * *pekan* ("12 pekan ini" reads "these 12 weeks"), so the counter puts the label first: *Pekan ini: 12* (§5.3). Names,
 * days ("Min, 1 Nov") and clocks arrive written and are placed as they come, never inflected or suffixed.
 */
import type en from '../en/gallery'
import type { CoverLead } from '../en/gallery'
import { fmt } from '../../../api/_lib/i18n/format'
import { strong, type Rich } from '../../../api/_lib/i18n/parts'

const f = fmt('id')
const pct = (n: number) => `${f.int(n)}%`

const LEAD: Record<CoverLead, string> = {
  closest: 'Paling rinci',
  lastClear: 'Cerah terakhir',
  clouded: 'Tertutup awan',
}

const gallery: typeof en = {
  // ── the bar over the photos ──────────────────────────────────────────────────────────────
  barLabel: 'Citra',
  filterLabel: 'Tampilkan citra',
  filter: { all: 'Semua', detailed: 'Rinci', weather: 'Cuaca', radar: 'Radar' },
  filterTitle: {
    all: 'Semua citra: yang paling rinci, lalu yang terbaru',
    detailed: 'Sentinel-2 dan Landsat, 10–30 m per piksel',
    weather: 'Mosaik cuaca harian, 250 m per piksel atau lebih kasar',
    radar: 'Citra radar Sentinel-1, 20 m per piksel: menembus awan, siang atau malam',
  },
  photosThisWeek: (n: number) => `Pekan ini: ${f.int(n)}`,
  photosThatWeek: (n: number) => `Pekan itu: ${f.int(n)}`,
  prevPhoto: 'Citra sebelumnya',
  prevTitle: 'Sebelumnya (←)',
  nextPhoto: 'Citra berikutnya',
  nextTitle: 'Berikutnya (→)',
  carousel: 'karusel',
  trackLabel: 'Citra tempat ini, geser untuk melihat lainnya',

  // ── a slide ──────────────────────────────────────────────────────────────────────────────
  slide: 'slide',
  lead: LEAD,
  slideLabel: (lead: CoverLead | undefined, sat: string, day: string, time: string, photo?: { k: number; n: number }) =>
    `${lead ? `${LEAD[lead]}: ` : ''}${sat}, ${day} ${time}${photo ? `, citra ${f.int(photo.k)} dari ${f.int(photo.n)}` : ''}`,
  replayLabel: (sat: string, day: string, time: string) => `Putar ulang lintasan ini di bola dunia: ${sat}, ${day} ${time}`,
  // Phones and laptops read "Putar ulang"; portrait tablets the whole "Putar ulang lintasan ini".
  replay: ['Putar ulang', strong(' lintasan ini')] as Rich,
  viewLabel: {
    lastClear: (sat: string, day: string, time: string) => `Lihat citra cerah terakhir dalam ukuran besar: ${sat}, ${day} ${time}`,
    photo: (sat: string, day: string, time: string) => `Lihat citra dalam ukuran besar: ${sat}, ${day} ${time}`,
  },
  view: 'Lihat',
  sharePass: 'Bagikan lintasan ini',
  radarTag: 'Radar',
  noteMostlyCloud: 'Lintasan pekan ini sebagian besar hanya menangkap awan',
  noteLastClear: 'Ini citra cerah terakhir',
  clouded: {
    pct: (p: number) => `Tertutup awan · ${pct(p)}`,
    coverAtSpot: 'Tertutup awan · awan di titikmu',
    atSpot: 'Awan di titikmu',
  },
  status: {
    cloudedPct: (p: number) => `Berawan · ${pct(p)}`,
    cloudAtSpot: 'Awan di titik',
    clear: 'Cerah',
    cirrus: 'Sirus tipis',
    shadow: 'Bayangan awan',
    cloudPct: (p: number) => `Awan ${pct(p)}`,
    mosaic: 'Mosaik harian',
  },
  cropKm: (km: number) => `${km >= 100 ? f.int(km) : f.dec(km, 1)} km`,

  // ── a photo frame ────────────────────────────────────────────────────────────────────────
  photoAlt: (sat: string, place: string) => `Citra ${sat} dari ${place}. Tempat itu ada di tengah.`,
  acquiring: 'Merekam',
  noImage: 'Citra tidak terkirim',
  retry: 'Coba lagi',
  scaleKm: (km: number) => `${km >= 1 ? f.int(km) : f.dec(km, 1)} km`,
  // Utara, as Indonesian maps mark it (id.md §6).
  north: 'U',
  expandLabel: 'Perbesar citra',
  expandTitle: 'Perbesar (F)',

  // ── a photo developing (the pushbroom reveal) ────────────────────────────────────────────
  stillRendering: 'Masih diproses. Citra besar bisa butuh 10 detik atau lebih.',
  cropMissing: 'Arsip tidak mengirim potongan ini. Mungkin sedang sibuk; citra utuhnya tetap ada.',
  scanLine: (line: string, lines: string): Rich => ['Baris ', strong(line), ` → ${lines}`],
  awaiting: { pass: 'Menunggu lintasan', scan: 'Menunggu pindaian' },
}

export default gallery
