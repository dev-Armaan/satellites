/**
 * Turkish copy for the photo gallery and the photo frames it shows (see docs/i18n/tr.md §3.9, §4, §5, §6.3, §7): the
 * bar, each slide's buttons and chips, what a picture shows at the place, and a frame's waiting and error states.
 *
 * Why these words:
 *  - The gallery holds photos, daily mosaics, radar images and full-disc frames alike, so every item is a `görüntü`,
 *    never a `fotoğraf` (§4): `Görüntüler`, `Önceki görüntü`, `Görüntüyü büyüt`.
 *  - The cover's reason is `En net görüntü` (the most detailed clear photo, never `En yakın geçiş`, which would claim
 *    distance), `Son bulutsuz görüntü` and `Tamamen bulutlu`: the share card's chip says the same words.
 *  - No suffix is ever attached to an inserted name, day or clock (§5): they stand after a colon or a comma, or before
 *    a fixed noun that carries the case (`Sentinel-2C görüntüsü: Waterloo.`). Positions are said as `görüntü 3, toplam
 *    27`, never with a slash a screen reader reads as `bölü` (§5.3).
 *  - Percentages put the sign first (`%86`, §6.3). Chips that speak to the reader say `noktan` (your spot); chips that
 *    only name a state say `noktada` (§1.4).
 *  - The Replay button keeps its tablet-only strong part in front: phones and laptops read `oynat` (the narrow replay
 *    word, as on the geostationary row: `YENİDEN OYNAT` is twice REPLAY's width and cut the caption's time), tablets
 *    `Bu geçişi yeniden oynat` (CSS uppercases both). Buttons are bare stems, never a `-ma/-me` noun (§1.3).
 *  - A number and its unit in prose are held together by a no-break space (`10 sn`, `250 m`, §6.7).
 */
import type en from '../en/gallery'
import type { CoverLead } from '../en/gallery'
import { fmt } from '../../../api/_lib/i18n/format'
import { strong, type Rich } from '../../../api/_lib/i18n/parts'

const f = fmt('tr')
/** "%86": the percent sign before the number, no space (§6.3) */
const pct = (n: number) => `%${f.int(n)}`

const LEAD: Record<CoverLead, string> = {
  closest: 'En net görüntü',
  lastClear: 'Son bulutsuz görüntü',
  clouded: 'Tamamen bulutlu',
}

/** "Sentinel-2C, 1 Kas Paz 16:14": names and clocks as they come, after a comma */
const who = (sat: string, day: string, time: string) => `${sat}, ${day} ${time}`

const gallery: typeof en = {
  // ── the bar over the photos ──────────────────────────────────────────────────────────────
  barLabel: 'Görüntüler',
  filterLabel: 'Görüntüleri filtrele',
  // `Ayrıntılı`, the results footnote's word (*ayrıntılı görüntü*): the four segments together (22 characters) stay
  // narrower than the English (23), so it fits wherever the English does (§3.9).
  filter: { all: 'Tümü', detailed: 'Ayrıntılı', weather: 'Hava', radar: 'Radar' },
  filterTitle: {
    all: 'Tüm görüntüler: en net görüntüden sonra en yeniden eskiye',
    detailed: 'Sentinel-2 ve Landsat, piksel başına 10–30 m',
    // `ve üzeri`: the idiom for "this figure and beyond"; a larger pixel is the coarser direction. `meteoroloji
    // mozaikleri`, as the results' footnote counts them (*meteoroloji mozaiği*), never *hava durumu* ("forecast").
    weather: 'Günlük meteoroloji mozaikleri, piksel başına 250 m ve üzeri',
    radar: 'Sentinel-1 radar görüntüleri, piksel başına 20 m: bulutun içinden, gece gündüz',
  },
  // The number last, so it never takes a suffix.
  photosThisWeek: (n: number) => `bu hafta ${f.int(n)}`,
  photosThatWeek: (n: number) => `o hafta ${f.int(n)}`,
  prevPhoto: 'Önceki görüntü',
  prevTitle: 'Önceki (←)',
  nextPhoto: 'Sonraki görüntü',
  nextTitle: 'Sonraki (→)',
  carousel: 'karusel',
  trackLabel: 'Bu yerin görüntüleri; daha fazlası için kaydır',

  // ── a slide ──────────────────────────────────────────────────────────────────────────────
  slide: 'slayt',
  lead: LEAD,
  slideLabel: (lead: CoverLead | undefined, sat: string, day: string, time: string, photo?: { k: number; n: number }) =>
    `${lead ? `${LEAD[lead]}: ` : ''}${who(sat, day, time)}${photo ? `, görüntü ${f.int(photo.k)}, toplam ${f.int(photo.n)}` : ''}`,
  replayLabel: (sat: string, day: string, time: string) => `Bu geçişi kürede yeniden oynat: ${who(sat, day, time)}`,
  replay: [strong('Bu geçişi yeniden '), 'oynat'] as Rich,
  viewLabel: {
    lastClear: (sat: string, day: string, time: string) => `Son bulutsuz görüntüyü büyük aç: ${who(sat, day, time)}`,
    photo: (sat: string, day: string, time: string) => `Görüntüyü büyük aç: ${who(sat, day, time)}`,
  },
  view: 'Aç',
  sharePass: 'Bu geçişi paylaş',
  radarTag: 'Radar',
  // The cloud is in the passes: a `geçiş` is an event, it does not see.
  noteMostlyCloud: 'Bu haftaki geçişlerde çoğunlukla bulut vardı',
  noteLastClear: 'İşte son bulutsuz görüntü',
  clouded: {
    pct: (p: number) => `Tamamen bulutlu · ${pct(p)}`,
    coverAtSpot: 'Tamamen bulutlu · noktanda bulut',
    atSpot: 'Noktanda bulut',
  },
  status: {
    cloudedPct: (p: number) => `Bulutlu · ${pct(p)}`,
    cloudAtSpot: 'Noktada bulut',
    clear: 'Bulutsuz',
    cirrus: 'İnce sirrus',
    shadow: 'Bulut gölgesi',
    cloudPct: (p: number) => `Bulut ${pct(p)}`,
    mosaic: 'Günlük mozaik',
  },
  cropKm: (km: number) => `${km >= 100 ? f.int(km) : f.dec(km, 1)} km`,

  // ── a photo frame ────────────────────────────────────────────────────────────────────────
  // The satellite before a fixed noun, the place after a colon: neither takes a suffix (§5.1, §5.2).
  photoAlt: (sat: string, place: string) => `${sat} görüntüsü: ${place}. Yer, görüntünün ortasında.`,
  acquiring: 'Alınıyor',
  noImage: 'Görüntü gelmedi',
  retry: 'Yeniden dene',
  scaleKm: (km: number) => `${km >= 1 ? f.int(km) : f.dec(km, 1)} km`,
  // Turkish compass letters (§4): north is `kuzey`.
  north: 'K',
  expandLabel: 'Görüntüyü büyüt',
  expandTitle: 'Büyüt (F)',

  // ── a photo developing (the pushbroom reveal) ────────────────────────────────────────────
  // Two lines of ≤ 30 characters: `Hâlâ işleniyor. Büyük sahneler` / `en az 10 sn sürebilir.`
  stillRendering: 'Hâlâ işleniyor. Büyük sahneler en az 10 sn sürebilir.',
  cropMissing: 'Arşiv bu kesiti göndermedi. Yoğun olabilir; görüntünün kendisi yine de var.',
  scanLine: (line: string, lines: string): Rich => ['Satır ', strong(line), ` → ${lines}`],
  awaiting: { pass: 'Geçiş bekleniyor', scan: 'Tarama bekleniyor' },
}
export default gallery
