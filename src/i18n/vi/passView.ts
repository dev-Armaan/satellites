/**
 * Vietnamese copy for the pass list and one pass's view (see src/i18n/en/passView.ts; docs/i18n/vi.md §3.5, §3.8, §4.1).
 *
 * Why it reads this way: every verdict counts passes with *lượt*, which takes no plural, so the verdict slot is not
 * needed for the unit. Readout labels are short nouns in mono caps, written in sentence case: *Độ cao* is the
 * altitude's and the angle above the horizon is *Góc ngẩng*, so the two never share a word (vi.md §4.1). *Mới nhất*
 * (latest) and *Gần nhất* (closest) stay apart: Vietnamese *gần nhất* can mean both. "Your spot" is *chỗ của bạn* in
 * sentences and *điểm* in labels (§1.2 rule 2). "Plan view of the pass" sits under the drawing, so it says where it is:
 * *Hình trên là sơ đồ lượt bay*. Compass letters arrive from the 'pass' namespace (*NTN*), with B for north.
 */
import type en from '../en/passView'
import type { Verdict } from '@/ui/results/lib/meta'
import { fmt } from '../../../api/_lib/i18n/format'
import { num, type NumPart } from '../../../api/_lib/i18n/parts'

const f = fmt('vi')
const PASS = 'lượt'
/** The plan view's caption, after each reason there is no picture */
const PLAN = 'Hình trên là sơ đồ lượt\u00a0bay.'

const passView: typeof en = {
  // ── the list ─────────────────────────────────────────────────────────────────────────────
  /** "We track" is *trong danh mục của chúng tôi*, and a negated past takes no *đã* (as the headline's zero) */
  empty:
    'Trong khoảng thời gian này, không vệ tinh nào trong danh mục của chúng tôi bay qua nơi này. Điều đó hiếm khi xảy ra; ghi chú phía trên sẽ cho biết nếu có nguồn dữ liệu bị gián\u00a0đoạn.',
  imagedOrder: 'chi tiết nhất, rồi mới nhất',
  count: (n: number, _verdict: Verdict) => `${f.int(n)} ${PASS}`,
  countStack: (n: number, _verdict: Verdict): NumPart => num(f.int(n), PASS),
  sats: (n: number) => `${f.int(n)} vệ tinh`,
  showAllSats: (n: number) => `Hiện cả ${f.int(n)} vệ tinh`,
  showAllRows: (n: number) => `Hiện cả ${f.int(n)} dòng`,
  showMore: (n: number) => `Hiện thêm ${f.int(n)}`,
  left: (n: number) => `còn ${f.int(n)}`,
  showFewer: 'Thu gọn',
  tag: {
    mosaic: 'Ảnh ghép',
    radar: 'Radar',
    cloudedPct: (pct: number) => `Có mây · ${f.int(pct)}%`,
    cloudedAtSpot: 'Có mây · tại điểm',
  },
  /** "Sentinel-2C, đã quan sát, Thứ Sáu, ngày 6 tháng 11, 16:14 EST, 41 giờ trước, lượng mây 25 phần trăm, mây che kín" */
  rowLabel: (o: { sat: string; verb: string; day: string; time: string; zone: string; ago: string; cloudPct?: number; clouded: boolean }) =>
    [
      o.sat,
      o.verb,
      `${o.day}, ${o.time} ${o.zone}`,
      o.ago,
      o.cloudPct !== undefined ? `lượng mây ${f.int(o.cloudPct)} phần trăm` : undefined,
      o.clouded ? 'mây che kín' : undefined,
    ]
      .filter(Boolean)
      .join(', '),
  offNadir: (deg: number) => `nghiêng ${f.dec(deg, 1)}°`,
  offNadirShort: (deg: number) => `${f.dec(deg, 1)}°`,
  distanceKm: (km: number) => `${f.int(km)} km`,
  cloudPct: (pct: number) => `mây ${f.int(pct)}%`,
  expandLabel: (sat: string, day: string, time: string) => `Phóng to ảnh: ${sat}, ${day} ${time}`,
  expandTitle: 'Phóng to ảnh',
  satLabel: (o: { sat: string; operator?: string; passes: number; verdict: Verdict; day: string; time: string }) =>
    `${o.sat}${o.operator ? `, ${o.operator}` : ''}, ${f.int(o.passes)} ${PASS}, mới nhất ${o.day}, ${o.time}`,
  latest: 'Mới nhất ',
  closest: 'Gần nhất ',
  cloudChip: 'Mây',

  // ── one pass ─────────────────────────────────────────────────────────────────────────────
  photosSection: 'Ảnh',
  planSection: 'Sơ đồ lượt bay',
  geometry: 'Hình học',
  replay: 'Phát lại',
  /**
   * The frame above can be infrared at night, so the satellite *ghi* it (never *chụp*); the pixel is a sentence of its
   * own words (*mỗi điểm ảnh ở đây rộng 2 km*), "Coarse, but real" a whole clause (*Ảnh thô nhưng là ảnh thật*), and a
   * repeated action "every N minutes" is *cứ N phút lại …*
   */
  fullDiscNote: (pixel: string, cadenceMin?: number) =>
    `Ảnh toàn đĩa: một bức ảnh ghi lại mọi thứ vệ tinh nhìn thấy, mỗi điểm ảnh ở đây rộng ${pixel}. Ảnh thô nhưng là ảnh thật, và là ảnh mới nhất được công bố; suốt tuần, vệ tinh này cứ ${
      cadenceMin === 1 ? 'mỗi phút' : cadenceMin ? `${f.int(cadenceMin)}\u00a0phút` : 'vài phút'
    } lại ghi một ảnh như vậy.`,
  mosaicNote: (gsdM: number) =>
    `Ảnh ghép hằng ngày: NASA ghép các dải quét trong ngày thành một bức ảnh, mỗi điểm ảnh rộng ${f.int(gsdM)}\u00a0m. Ảnh thô nhưng là ảnh thật, và là ảnh của đúng ngày có lượt bay này.`,
  radarNote:
    'Ảnh radar, không phải ảnh chụp: Sentinel-1 phát sóng vi ba và ghi lại sóng phản xạ, nên mây và bóng tối không cản được. Độ sáng cho biết mặt đất phản xạ sóng mạnh đến đâu: nhà cửa và địa hình gồ ghề thì sáng, mặt nước lặng thì tối.',
  /** "Private" archives are *không mở cho công chúng*: *không công khai* after *Không có ảnh công khai* read the word twice */
  noImage: {
    openArchive: (sat: string) => `Không có ảnh ${sat} nào của điểm này từ lượt bay này. ${PLAN}`,
    radarPrivate: `Không có ảnh công khai: kho lưu trữ của nhà vận hành radar này không mở cho công chúng. ${PLAN}`,
    commercialPrivate: `Không có ảnh công khai: kho lưu trữ thương mại không mở cho công chúng. ${PLAN}`,
    noneToShow: `Không có ảnh để hiển thị cho lượt bay này. ${PLAN}`,
    archiveDown: `Hiện chưa tra cứu được kho lưu trữ. ${PLAN}`,
    noScene: `Không có cảnh ảnh nào từ lượt bay này. ${PLAN}`,
    notYet: 'Chưa có cảnh ảnh nào được công bố khớp với lượt bay này. Ảnh Sentinel-2 và Landsat thường xuất hiện trong vòng một ngày.',
    /** Stations are named, never *họ* (that is people: the crews' own photos) */
    crewed: 'Các trạm vũ trụ có người ở đều mang camera, nhưng ảnh từ các trạm này không được công bố theo địa điểm và thời gian.',
    unavailable: 'Hiện không có ảnh cho lượt bay này.',
  },
  links: {
    openToSave: 'Mở ảnh để lưu',
    downloading: 'Đang tải xuống…',
    download: 'Tải ảnh xuống',
    viewSource: (archive: string) => `Xem nguồn · ${archive}`,
  },
  spot: {
    checking: 'Đang đọc điểm ảnh ở chỗ của bạn…',
    clear: 'Trời quang ở chỗ của bạn.',
    cirrus: 'Có dấu hiệu mây ti mỏng ở chỗ của bạn; ảnh có thể hơi mờ.',
    cloud: 'Có mây ở chỗ của bạn.',
    shadow: 'Chỗ của bạn nằm trong bóng mây.',
  },

  // ── the readout strip ────────────────────────────────────────────────────────────────────
  strip: {
    altitude: 'Độ cao',
    elevation: 'Góc ngẩng',
    offNadir: 'Độ nghiêng',
    pixel: 'Điểm ảnh',
    band: 'Kênh',
    sun: 'Mặt Trời',
    cloud: 'Mây',
    cloudAtSpot: 'Mây tại điểm',
  },
  band: { infrared: 'Hồng ngoại', visible: 'Khả kiến', colour: 'Màu' },
  spotValue: { clear: 'Quang', cirrus: 'Mây ti', cloud: 'Mây', shadow: 'Bóng mây' },
  unit: {
    km: 'km',
    m: 'm',
    kmS: 'km/s',
    up: 'cao',
    mosaic: 'ảnh ghép',
    /** The archive's figure for the whole scene, not the crop: *cảnh ảnh* (the card's word), never *toàn ảnh* */
    scene: 'cảnh ảnh',
    /** After an angle a bare *ngày* reads as a count of days (*31,1° ngày*): the phase is *ban ngày* / *ban đêm* */
    sun: { day: 'ban ngày', twilight: 'chạng vạng', night: 'ban đêm' },
  },

  // ── 01 / Hình học ────────────────────────────────────────────────────────────────────────
  geo: {
    closestUtc: 'Gần nhất · UTC',
    closestLocal: 'Gần\u00a0nhất · địa\u00a0phương',
    groundDistance: 'Khoảng cách mặt đất',
    /** The label form of the spot, *điểm* (as `MÂY TẠI ĐIỂM`): *Góc ngẩng từ chỗ bạn* took two lines on phones;
     * at 360 px this one still wraps, held as GÓC NGẨNG / TẠI ĐIỂM (as the closest-local label, GẦN NHẤT · / ĐỊA PHƯƠNG) */
    elevationFromYou: 'Góc\u00a0ngẩng tại\u00a0điểm',
    groundSpeed: 'Tốc độ mặt đất',
    heading: 'Hướng bay',
    sunElevation: 'Góc ngẩng Mặt Trời',
    fieldOfRegard: 'Tầm nhìn',
    swath: 'Dải quét',
    inSwath: 'Trong dải quét',
    inView: 'Trong tầm nhìn',
    window: 'Khung thời gian',
    noradPass: 'NORAD · lượt bay',
    /** When the scan line was here: *Quét qua đây* ("scanned past here"), short enough for the two-column grid */
    scanUtc: 'Quét qua đây · UTC',
    scanLocal: 'Quét qua đây · địa phương',
    aboveEquator: 'Trên xích đạo tại',
    inYourSky: 'Trên bầu trời bạn',
    scanDirection: 'Hướng quét',
    lineSpeed: 'Tốc độ đường quét',
    coverage: 'Vùng phủ',
    thisScan: 'Lần quét này',
    noradScan: 'NORAD · lần quét',
  },
  northToSouth: 'Bắc → nam',
  southToNorth: 'Nam → bắc',
  timeRange: (from: string, to: string) => `${from} → ${to}`,
  sunPhase: { day: 'Ban ngày', twilight: 'Chạng vạng', night: 'Ban đêm' },
  fullDisc: 'Toàn đĩa',
  everyMin: (n: number) => `mỗi ${f.int(n)} phút`,
  upCompass: (compass: string) => `cao · ${compass}`,
  heading: (compass: string, ascending: boolean) => `${compass} · ${ascending ? 'Đi lên' : 'Đi xuống'}`,
}

export default passView
