/**
 * Vietnamese copy for the landing (see src/i18n/en/landing.ts; docs/i18n/vi.md §3.1, §3.2 and §3.8).
 *
 * Why it reads this way: the hero ends on the reader, *Tuần này, / có thứ gì đó / quan sát \*bạn\*.*, because
 * Vietnamese puts a sentence's weight at its end; *thứ gì đó* is a thing, not a person. The existential *có …* with
 * the fronted *Tuần này* reports a past event without *đã*, as Vietnamese does (*Hôm nay có người tìm bạn*). The sub
 * line says *Chọn* (the chips and the pin are choices too, not a form to fill) and *hình ảnh thật mà chúng đã ghi
 * lại*, true for radar and mosaics. Buttons are bare verbs, and where the English speaks as the user they say
 * *tôi* (*Dùng vị trí của tôi*, *Gần tôi*). Faults say what happened, then what to do, with no *Vui lòng* or *Rất
 * tiếc*; *của bạn* only where whose it is matters. The kicker's dates are digits, day before month (*1 → 8/11/2026
 * UTC*), the month and year written once when both ends share them. Mono labels are sentence case, uppercased by CSS.
 */
import type en from '../en/landing'
import { fmt } from '../../../api/_lib/i18n/format'
import { accent, type Rich } from '../../../api/_lib/i18n/parts'

const f = fmt('vi')

/** The instant's civil date in UTC */
function utcDate(ms: number): { d: number; m: number; y: number } {
  const t = new Date(ms)
  return { d: t.getUTCDate(), m: t.getUTCMonth() + 1, y: t.getUTCFullYear() }
}

const landing: typeof en = {
  // ── Hero ──
  lastDays: (days: number) => f.plural(days, { other: `${f.int(days)} ngày qua` }),
  /** "1 → 8/11/2026 UTC", "29/10 → 5/11/2026 UTC", "29/12/2026 → 5/1/2027 UTC" */
  windowRange: (startMs: number, endMs: number) => {
    const a = utcDate(startMs)
    const b = utcDate(endMs)
    const start = a.y !== b.y ? `${a.d}/${a.m}/${a.y}` : a.m !== b.m ? `${a.d}/${a.m}` : `${a.d}`
    return `${start} → ${b.d}/${b.m}/${b.y} UTC`
  },
  hero: [['Tuần này,'], ['có thứ gì đó'], ['quan sát ', accent('bạn'), '.']] as Rich[],
  sub: (days: number): Rich => [
    `Chọn một nơi bất kỳ trên Trái Đất. Xem mọi vệ tinh đã bay qua nơi đó trong ${f.int(days)}\u00a0ngày qua, cùng những hình ảnh thật mà chúng đã ghi lại.`,
  ],
  /** "Do … thực hiện", never the calque *Được xây dựng bởi* */
  builtBy: (handle: string) => `Do ${handle} thực hiện`,
  sourceLink: 'Mã nguồn mở',
  sourceLinkLabel: 'Mã nguồn mở: dự án trên GitHub',

  // ── The place search ──
  searchPlaceholder: 'Tìm địa điểm',
  placeLabel: 'Địa điểm',
  searching: 'Đang tìm',
  /** *tìm kiếm*, the act of searching: *Không tìm được* would say nothing was found (that is `noMatch`) */
  searchUnavailable: 'Không tìm kiếm được',
  matches: (n: number) => f.plural(n, { other: `${f.int(n)} kết quả` }),
  noMatch: 'Không có kết quả',
  searchHint: 'Tên, địa chỉ hoặc tọa độ',
  clearSearch: 'Xóa tìm kiếm',
  go: 'Xem những gì đã bay qua nơi này',
  searchDown: 'Dịch vụ tìm địa điểm không phản hồi. Bạn vẫn có thể nhập tọa độ, chẳng hạn 43.47, −80.54.',
  nothingMatches: (query: string) => `Không có kết quả cho “${query}”. Thử một thành phố, một địa danh hoặc tọa độ.`,
  suggestions: 'Địa điểm',

  // ── Use my location ──
  useMyLocation: 'Dùng vị trí của tôi',
  locateMe: 'Định vị',
  nearMe: 'Gần tôi',
  /** A live state takes *đang*: a bare *Định vị…* reads as a command. The chip row scrolls, so it may grow */
  locating: 'Đang định vị…',
  cancelSearch: 'Hủy',
  cancelLocate: 'Hủy',
  cancelLocating: 'Hủy định vị',
  requestingPosition: 'Đang lấy vị trí',
  namingPlace: 'Đang tìm tên nơi này',
  elapsed: (seconds: number) => `${seconds.toFixed(0).padStart(2, '0')} giây`,
  locatingNote:
    'Vị trí của bạn được gửi tới Photon, một dịch vụ tra tên địa điểm, để biết nơi này tên gì. Chúng tôi chỉ lưu một vùng rộng khoảng 10\u00a0km.',
  locationLabel: 'Vị trí',
  dismiss: 'Đóng',
  /** *hãy* only after a clause, where a bare verb would read as a label (vi.md §1.4) */
  locateErrors: {
    denied: 'Quyền truy cập vị trí đang bị chặn. Bật lại trong cài đặt trình duyệt, hoặc tìm một địa điểm.',
    unavailable: 'Hiện không xác định được vị trí của bạn. Thay vào đó, hãy tìm một địa điểm.',
    timeout: 'Tìm vị trí của bạn mất quá lâu. Thử lại, hoặc tìm một địa điểm.',
    unsupported: 'Trình duyệt này không chia sẻ được vị trí. Thay vào đó, hãy tìm một địa điểm.',
    insecure: 'Định vị cần kết nối bảo mật (https). Thay vào đó, hãy tìm một địa điểm.',
    other: 'Hiện không xác định được vị trí của bạn. Thay vào đó, hãy tìm một địa điểm.',
  },

  // ── Examples ──
  orTry: 'Hoặc thử',
  pinHint: 'Hoặc bấm vào quả địa cầu để thả ghim',
  examplesLabel: 'Địa điểm ví dụ',
  dropPin: 'Thả ghim',
  chipName: (label: string, sublabel: string) => (sublabel ? `${label}, ${sublabel}` : label),
  /** Never *Làm tôi bất ngờ* (a calque) */
  surprise: 'Ngẫu nhiên',
  surpriseName: 'Ngẫu nhiên: một địa danh nổi tiếng bất kỳ',
}
export default landing
