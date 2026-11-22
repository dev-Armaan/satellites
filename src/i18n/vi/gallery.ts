/**
 * Vietnamese copy for the photo gallery and its frames (see src/i18n/en/gallery.ts; docs/i18n/vi.md §3.8, §4.1).
 *
 * Why it reads this way: every picture is *ảnh*, whatever took it (radar, mosaics), and a satellite *ghi lại* (records)
 * rather than *chụp* (photographs) it. "Closest look" is the most detailed one, *Chi tiết nhất*, and the filter that
 * keeps such pictures is *Chi tiết*, the same word; never *gần nhất* (nearest), and the last clear look is the latest,
 * *mới nhất*. A clear look is *ảnh không mây*
 * (*ảnh quang* would read as optics). "Your spot" is *chỗ của bạn* in a sentence and *điểm* in a short label. A count
 * stands after its label (*Tuần này: 12*), since *12 tuần này* reads "these 12 weeks". "N of M" is *N trong số M*,
 * never *N/M*, which reads as a date. The north arrow is B (*bắc*): N is *nam*, south, to a Vietnamese reader.
 */
import type en from '../en/gallery'
import type { CoverLead } from '../en/gallery'
import { fmt } from '../../../api/_lib/i18n/format'
import { strong, type Rich } from '../../../api/_lib/i18n/parts'

const f = fmt('vi')
const pct = (n: number) => `${f.int(n)}%`

const LEAD: Record<CoverLead, string> = {
  closest: 'Chi tiết nhất',
  /** "Last" is the latest, *mới nhất*: *gần nhất* is "closest" on these screens */
  lastClear: 'Không mây mới nhất',
  clouded: 'Mây che kín',
}

const gallery: typeof en = {
  // ── the bar over the photos ──────────────────────────────────────────────────────────────
  barLabel: 'Ảnh',
  filterLabel: 'Hiện ảnh',
  filter: { all: 'Tất cả', detailed: 'Chi tiết', weather: 'Thời tiết', radar: 'Radar' },
  filterTitle: {
    all: 'Mọi ảnh: chi tiết nhất trước, rồi đến mới nhất',
    detailed: 'Sentinel-2 và Landsat, điểm ảnh 10–30 m',
    weather: 'Ảnh ghép thời tiết hằng ngày, điểm ảnh từ 250 m trở lên',
    radar: 'Ảnh radar Sentinel-1, điểm ảnh 20 m: xuyên mây, cả ngày lẫn đêm',
  },
  photosThisWeek: (n: number) => `Tuần này: ${f.int(n)}`,
  photosThatWeek: (n: number) => `Tuần đó: ${f.int(n)}`,
  prevPhoto: 'Ảnh trước',
  prevTitle: 'Trước (←)',
  nextPhoto: 'Ảnh tiếp theo',
  nextTitle: 'Tiếp (→)',
  carousel: 'băng chuyền',
  trackLabel: 'Ảnh của nơi này, vuốt để xem thêm',

  // ── a slide ──────────────────────────────────────────────────────────────────────────────
  slide: 'trang',
  lead: LEAD,
  slideLabel: (lead: CoverLead | undefined, sat: string, day: string, time: string, photo?: { k: number; n: number }) =>
    `${lead ? `${LEAD[lead]}: ` : ''}${sat}, ${day} ${time}${photo ? `, ảnh ${f.int(photo.k)} trong số ${f.int(photo.n)}` : ''}`,
  replayLabel: (sat: string, day: string, time: string) => `Phát lại lượt bay này trên quả địa cầu: ${sat}, ${day} ${time}`,
  // Phones and laptops read *Phát lại*; portrait tablets the whole *Phát lại lượt bay này*.
  replay: ['Phát lại', strong(' lượt bay này')] as Rich,
  viewLabel: {
    lastClear: (sat: string, day: string, time: string) => `Xem lớn ảnh không mây mới nhất: ${sat}, ${day} ${time}`,
    photo: (sat: string, day: string, time: string) => `Xem lớn ảnh: ${sat}, ${day} ${time}`,
  },
  view: 'Xem',
  sharePass: 'Chia sẻ lượt bay này',
  radarTag: 'Radar',
  /** The passes are the understood subject, as Vietnamese drops it: *Các lượt bay tuần này chủ yếu chỉ thấy mây* set as
   * two lines on every phone, THẤY MÂY alone on the second; this is one from 360 px up */
  noteMostlyCloud: 'Tuần này hầu như chỉ thấy mây',
  noteLastClear: 'Đây là ảnh không mây mới nhất',
  clouded: {
    pct: (p: number) => `Mây che kín · ${pct(p)}`,
    coverAtSpot: 'Mây che kín · có mây ở chỗ của bạn',
    atSpot: 'Có mây ở chỗ của bạn',
  },
  /** ≤ ~14 characters beside the product line (which already says *Ảnh ghép hằng ngày* for a mosaic) */
  status: {
    cloudedPct: (p: number) => `Có mây · ${pct(p)}`,
    cloudAtSpot: 'Mây tại điểm',
    /** *quang* does not stand alone (it lives in *trời quang*, and alone suggests *quang học*) */
    clear: 'Không mây',
    cirrus: 'Mây ti mỏng',
    shadow: 'Bóng mây',
    cloudPct: (p: number) => `Mây ${pct(p)}`,
    mosaic: 'Ảnh ghép',
  },
  cropKm: (km: number) => `${km >= 100 ? f.int(km) : f.dec(km, 1)} km`,

  // ── a photo frame ────────────────────────────────────────────────────────────────────────
  photoAlt: (sat: string, place: string) => `Ảnh ${place} do ${sat} ghi lại. Nơi này nằm ở giữa ảnh.`,
  /** *thu nhận ảnh* is the remote-sensing term for acquiring an image */
  acquiring: 'Đang thu nhận',
  noImage: 'Không nhận được ảnh',
  retry: 'Thử lại',
  scaleKm: (km: number) => `${km >= 1 ? f.int(km) : f.dec(km, 1)} km`,
  north: 'B',
  expandLabel: 'Phóng to ảnh',
  expandTitle: 'Phóng to (F)',

  // ── a photo developing (the pushbroom reveal) ────────────────────────────────────────────
  stillRendering: 'Vẫn đang tạo ảnh. Cảnh ảnh lớn có thể mất từ 10 giây trở lên.',
  cropMissing: 'Kho lưu trữ không gửi phần ảnh cắt này. Có thể kho đang bận; bản thân bức ảnh vẫn còn\u00a0đó.',
  scanLine: (line: string, lines: string): Rich => ['Dòng ', strong(line), ` → ${lines}`],
  awaiting: { pass: 'Chờ lượt bay', scan: 'Chờ lần quét' },
}

export default gallery
