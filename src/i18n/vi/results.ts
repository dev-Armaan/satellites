/**
 * Vietnamese copy for the results panel (see src/i18n/en/results.ts; docs/i18n/vi.md §3.3, §3.4 and §3.8 give the key
 * lines, and the guide is the authority on words).
 *
 * Why it reads this way: Vietnamese nouns do not inflect and CLDR `vi` has one plural category, so every count is a
 * digit before one noun form, with the right count word and no *các* / *những* after it (*256 vệ tinh*, *31 bức ảnh* in
 * a sentence, *31 ảnh* in a label, *31 lượt*, *42 lần*); zero is its own sentence. The headline keeps the English
 * shape, *Trong 7 ngày qua, **256 vệ tinh đã quan sát** \*Waterloo\*.*, so it still lands on the place; the place slot
 * is the bare label (no class noun before seas or cities). Days are digits, day before month, as ./time.ts writes them
 * (*29/10*, *CN, 1/11*); clocks, zones, coordinates and UTC stamps arrive written. "N of M" is *N trong số M* (a slash
 * pair would read as a date). A number and its count noun are held together by a no-break space in prose.
 */
import type en from '../en/results'
import type { PlaceWhen, UtcWhen, WindowWhen } from '../en/results'
import { fmt } from '../../../api/_lib/i18n/format'
import { accent, num, strong, type Part, type Rich } from '../../../api/_lib/i18n/parts'
import type { Pass, SatCategory } from '@/types'
import { localParts, type DateFields } from '@/ui/results/lib/time'
import viTime from './time'
import viVerdicts from './verdicts'

const f = fmt('vi')
type Verdict = Pass['verdict']

/** "29/10" at a zone (as ./time.ts dayMonth) */
const dayMonth = (ms: number, timeZone: string) => viTime.dayMonth(ms, timeZone, localParts(ms, timeZone))
/** "CN, 1/11" at a zone (as ./time.ts day) */
const day = (ms: number, timeZone: string) => viTime.day(ms, timeZone, localParts(ms, timeZone))

/**
 * A compound word held together in a display line: Vietnamese breaks at the space between syllables, so a wrapping
 * headline could split *vệ / tinh* or *quan / sát*, or end a line on the aspect marker *đã* (vi.md §6.5). Only the display lines (the headline and its second
 * line) bind their compounds; body text wraps as it will.
 */
const bind = (s: string) => s.replace(/ /g, '\u00a0')

/** A ground pixel as written ("10 m", "2 km"): never grouped; a fraction (none expected) takes the decimal comma */
const px = (n: number) => String(n).replace('.', ',')

/** "Đã kiểm tra 1.234 lượt bay của 250 vệ tinh chụp ảnh và trạm có người ở." */
const checkedVi = (passes: number, sats: number) =>
  `Đã kiểm tra ${f.int(passes)}\u00a0lượt bay của ${f.int(sats)}\u00a0vệ tinh chụp ảnh và trạm có\u00a0người\u00a0ở.`

/** The kind of satellite in the timeline's tooltip, with its mark's shape (the glyphs stay as they are) */
const MARK_KIND: Partial<Record<SatCategory, string>> = {
  'open-optical': 'chụp ảnh công khai · ◇',
  'commercial-optical': 'thương mại · □',
  radar: 'radar · ▣',
  'weather-leo': 'khí tượng · ○',
  crewed: 'có người ở · ✛',
}

const results: typeof en = {
  // ── the headline ─────────────────────────────────────────────────────────────────────────
  headline: {
    /** vi.md §3.3: bold *[NUM] vệ tinh đã quan sát* (the number inside it), serif the place */
    watched: (n: number, place: string, when: WindowWhen): Rich => [
      'lastDays' in when
        ? `Trong ${bind(`${f.int(when.lastDays)} ngày qua`)}, `
        : `${bind(`Từ ${dayMonth(when.fromMs, when.timeZone)}`)} ${bind(`đến ${dayMonth(when.toMs, when.timeZone)}`)}, `,
      strong(num(f.int(n)), `\u00a0${bind('vệ tinh')} ${bind('đã quan sát')}`),
      ' ',
      accent(place),
      '.',
    ],
    /**
     * Zero is its own sentence. "We track" is *trong danh mục của chúng tôi* (the limit is our catalog), and a negated
     * past takes no *đã* (*Không ai đến*, never *Không ai đã đến*)
     */
    none: (place: string, past: boolean): Rich => [
      `Không ${bind('vệ tinh')} nào trong ${bind('danh mục')} của ${bind('chúng tôi')} ${bind('quan sát')} `,
      accent(place),
      past ? ` ${bind('tuần đó')}.` : ` ${bind('tuần này')}.`,
    ],
  },

  // ── the second line ──────────────────────────────────────────────────────────────────────
  /** *Ít nhất* is the strong part, outside the number: the sentence reads with and without it (§3.4) */
  imagesPublic: (k: number): Rich => [strong(`${bind('Ít nhất')} `), num(f.int(k)), `\u00a0${bind('bức ảnh')} đã được ${bind('công bố')}.`],
  noImages: {
    thisWeek: `${bind('Tuần này')} không có ${bind('bức ảnh')} nào được ${bind('công bố')}.`,
    thatWeek: `${bind('Tuần đó')} không có ${bind('bức ảnh')} nào được ${bind('công bố')}.`,
  },
  archiveDown: `Các kho ${bind('lưu trữ')} ảnh không ${bind('phản hồi')}, nên hiện ${bind('chúng tôi')} chưa thể đếm số ảnh ${bind('công khai')}.`,
  tryAgain: 'Thử lại',
  share: 'Chia sẻ',
  /** The share sheet's own words (*Chia sẻ tóm tắt tuần này*, §3.6), never *Chia sẻ tuần này* */
  shareWeekLabel: (place: string, past: boolean) => `Chia sẻ tóm tắt ${past ? 'tuần đó' : 'tuần này'} về ${place}`,

  /** "It" is the searched place: *nơi này* (§5.1 rule 4) */
  why: {
    sunNeverRose: 'Mặt Trời không hề mọc, nên không camera thường nào có thể thấy nơi này.',
    sunBarelyRose: 'Mặt Trời gần như không mọc, nên không camera thường nào có thể thấy nơi này.',
    /** The count stands by its verb (*quét qua nơi này 42 lần*), not after a comma as English adds it */
    infrared: (n: number): Rich => ['Vệ tinh khí tượng vẫn quét qua nơi này ', num(f.int(n)), ' lần bằng hồng ngoại.'],
    /** "Umbra, Capella và 7 vệ tinh radar khác" (Intl.ListFormat: no serial comma, as Vietnamese writes it) */
    radar: (names: readonly string[], others: number, passes: number): Rich => {
      const who = f.list(others > 0 ? [...names, `${f.int(others)} vệ tinh radar khác`] : names)
      return [`Radar không cần ánh sáng. ${who} đã bay qua trong tầm nhìn `, num(f.int(passes)), ' lần.']
    },
    /** Plain prose, no number part: "once" is *một lần*, as English writes the word (vi.md §5.3 rule 1) */
    unpublished: (n: number) =>
      `Sentinel-2 hoặc Landsat đã bay qua nơi này ${n === 1 ? 'một' : f.int(n)}\u00a0lần vào ban ngày, nhưng chưa có cảnh ảnh nào được công bố.`,
    none: 'Không vệ tinh chụp ảnh công khai nào bay qua nơi này vào ban ngày.',
  },

  // ── the summary's four readouts ──────────────────────────────────────────────────────────
  /** The verdicts are "labels" on About (*Ý nghĩa các nhãn*) */
  verdictGroup: 'Lượt bay theo nhãn. Mỗi mục dẫn tới danh sách của nhãn đó.',
  verdictReadout: (n: number, verdict: Verdict, title: string) => `${f.int(n)} ${viVerdicts[verdict].unit(n)}: ${title}`,

  // ── the footnotes ────────────────────────────────────────────────────────────────────────
  notes: {
    counted: (o: { detailed: number; mosaics: number; radar: number; geo: number; passes: number; satellites: number }): Rich => {
      const out: Part[] = [strong(f.int(o.detailed)), ' ảnh chi tiết (Sentinel-2, Landsat, 10–30 m)']
      if (o.mosaics) out.push(' · ', strong(f.int(o.mosaics)), ' ảnh ghép thời tiết hằng ngày (250–375 m)')
      if (o.radar) out.push(' · ', strong(f.int(o.radar)), ' ảnh radar (Sentinel-1, 20 m)')
      if (o.geo) {
        out.push(' · ', strong(f.int(o.geo)), ' ảnh toàn đĩa từ vệ tinh khí tượng địa tĩnh (2–5 km; hiển thị ảnh mới nhất của mỗi vệ tinh)')
      }
      out.push(`. ${checkedVi(o.passes, o.satellites)}`)
      return out
    },
    checked: (passes: number, satellites: number) => checkedVi(passes, satellites),
    passTimes: (place: string, fetched: string | undefined, zoneLabel: string) =>
      `Giờ bay qua là lúc mỗi vệ tinh ở gần ${place} nhất, tính từ tham số quỹ đạo công khai` +
      `${fetched ? ` (lấy lúc ${fetched})` : ''}. Giờ địa phương theo múi giờ ${zoneLabel}.`,
  },

  // ── the panel ────────────────────────────────────────────────────────────────────────────
  sheetLabel: (place: string) => `Các vệ tinh bay qua ${place}`,
  computingPasses: 'Đang tính các lượt bay',
  sections: { summary: 'Tóm tắt', passes: 'Lượt bay', watchedContinuously: 'Quan sát liên tục' },
  checkingArchives: 'Đang kiểm tra các kho lưu trữ',
  invite: {
    /** The share hook, echoing the hero; *cũng có* puts "too" on the event (you as well), not on "something" (§3.6) */
    text: 'Tuần này, cũng có thứ gì đó quan sát bạn.',
    /** "Your place" is where you are, *nơi bạn ở*, not the calque *nơi của bạn* */
    checkPlace: 'Xem nơi bạn ở',
    dismiss: 'Đóng',
  },
  searchAnother: 'Tìm nơi khác',
  allPasses: 'Tất cả lượt bay',

  footer: {
    replay: 'Phát lại',
    replayLabel: 'Phát lại lượt bay',
    replayTitle: 'Phát lại lượt bay trên quả địa cầu',
    shareLabel: { pass: 'Chia sẻ lượt bay này', image: 'Chia sẻ ảnh này' },
    /** Narrow phones drop the strong part: *Chia sẻ* alone */
    shareButton: { pass: ['Chia sẻ', strong(' lượt bay này')] as Rich, image: ['Chia sẻ', strong(' ảnh này')] as Rich },
    /** …*nơi bạn ở* alone */
    checkPlace: [strong('Xem '), 'nơi bạn ở'] as Rich,
    /** "The clearest look" is the least cloudy one: *ảnh ít mây nhất*, which reads alone too */
    clearest: [strong('Xem '), 'ảnh ít mây nhất'] as Rich,
    clearestLabel: 'Xem ảnh ít mây nhất',
  },

  // ── the headers ──────────────────────────────────────────────────────────────────────────
  head: {
    windowSpan: (days: number, startMs: number, endMs: number, timeZone: string) =>
      `${f.int(days)} ngày · ${viTime.dayRange(startMs, endMs, timeZone, localParts(startMs, timeZone), localParts(endMs, timeZone))}`,
    verifying: 'Đang kiểm tra ảnh thời tiết',
    cancel: 'Hủy',
    newSearch: 'Tìm kiếm mới',
    close: 'Đóng',
    escKey: 'Esc',
    searchBarLabel: (place: string) => `Tìm nơi khác (hiện tại: ${place})`,
    change: 'Đổi',
    computing: 'Đang tính',
    recent: 'Gần đây',
    /** "Of this kind" is *cùng loại* (the verdict's group) */
    position: (k: number, n: number) => `Lượt ${f.int(k)} trong số ${f.int(n)} lượt cùng loại`,
    previous: 'Lượt cùng loại trước',
    next: 'Lượt cùng loại tiếp theo',
    previousTitle: 'Trước (←)',
    nextTitle: 'Tiếp (→)',
    allPassesTitle: 'Tất cả lượt bay (Esc)',
    shared: (sat: string, place: string) => `Được chia sẻ với bạn · ${sat} đã quan sát ${place}`,
    /** The day as ./time.ts `stamp` writes it (*CN, 1/11 · 16:14:21 EST*), so the header and the pass's row agree */
    passWhen: (ms: number, timeZone: string, p: DateFields, time: string, zone: string, approx: boolean) =>
      `${viTime.day(ms, timeZone, p)} · ${approx ? '≈ ' : ''}${time} ${zone}`,
  },

  // ── the computing readout ────────────────────────────────────────────────────────────────
  computing: {
    /** Idle labels name the step, done labels say it is done (*Đã …*); never *lan truyền* */
    stages: {
      catalog: { idle: 'Danh mục quỹ đạo', done: 'Đã tải danh mục' },
      propagate: { idle: (days: number) => `Tính quỹ đạo · ${f.int(days)} ngày`, done: 'Đã tính quỹ đạo' },
      archive: { idle: 'Kho Sentinel-2 + Landsat', done: 'Đã tra kho lưu trữ' },
      match: { idle: 'Đối chiếu ảnh với lượt bay', done: 'Đã đối chiếu ảnh' },
    },
    ready: 'Báo cáo đã sẵn sàng',
    ok: 'OK',
    /**
     * "1,84 s": the SI symbol, not *giây*: the row's time sits in a fixed 48 px column on phones (56 px on desktop),
     * which "0,00 giây" overruns into the status cell; "0,00 s" is six characters, as in English (vi.md §7)
     */
    seconds: (s: number) => `${f.dec(s, 2)} s`,
    /** Phones drop the strong part: the span reads alone */
    window: (days: number, from: UtcWhen, to: UtcWhen): Rich => [
      strong(`Khung ${f.int(days)} ngày · `),
      `${dayMonth(from.ms, 'UTC')} ${from.time} → ${dayMonth(to.ms, 'UTC')} ${to.time} UTC`,
    ],
    percent: (pct: number) => `${f.int(pct)}%`,
    slow: 'Planetary Computer và NASA tạo ảnh theo yêu cầu; bước này có thể mất vài giây.',
    verySlow:
      'Các kho lưu trữ ảnh đang phản hồi chậm. Nếu không có phản hồi, các lượt bay vẫn sẽ được tính theo hình học quỹ đạo, và chúng tôi sẽ ghi rõ điều đó.',
    sharedAlt: (sat: string | undefined, place: string) =>
      sat ? `Ảnh ${place} do ${sat} ghi lại, được chia sẻ với bạn.` : `Ảnh vệ tinh của ${place}, được chia sẻ với bạn.`,
    /** "… · CN, 1/11, 16:14": the day, then its clock */
    sharedCaption: (sat: string | undefined, place: string, when?: PlaceWhen): Rich => [
      strong('Được chia sẻ với bạn'),
      ` · ${sat ?? 'Một vệ tinh'} đã quan sát ${place}${when ? ` · ${day(when.ms, when.timeZone)}, ${when.time}` : ''}`,
    ],
  },

  // ── 03 / QUAN SÁT LIÊN TỤC ───────────────────────────────────────────────────────────────
  geo: {
    /** The elevation is the satellite's height in the place's sky, said as the pass sentences say it */
    none: 'Từ nơi này, không vệ tinh khí tượng địa tĩnh nào đang hoạt động nằm cao hơn 5° trên đường chân trời.',
    /** *cao 34,5°*: the angle above the horizon, said as a person says it (§3.5). Each fact is held whole, so a
     * 360 px row wraps between facts, never as *mỗi 10 / phút* */
    facts: (lon: string, elevationDeg: number, cadenceMin: number) =>
      `${lon} · ${bind(`cao ${f.dec(elevationDeg, 1)}°`)} · ${bind(`mỗi ${f.int(cadenceMin)} phút`)}`,
    /** Mono caps: the bare count word *ảnh* (a counter), then the week (*12 ảnh tuần này*, never *12 tuần này*) */
    images: (n: number, days: number): Rich => [num(f.int(n)), days === 7 ? ' ảnh tuần này' : ` ảnh trong ${f.int(days)} ngày`],
    replay: 'Phát lại',
    replayLabel: (sat: string) => `${sat}: phát lại ảnh mới nhất`,
    /**
     * A 64 px square at 9.5 px mono caps (10.5 px on phones): about 9 characters a line, three lines. Never split a
     * compound across lines (*công / khai*): the label form *Không ảnh công khai*, its compound held by a no-break
     * space, sets as KHÔNG ẢNH / CÔNG KHAI at both sizes
     */
    frame: {
      probing: 'Đang dò…',
      noPublic: 'Không ảnh công\u00a0khai',
      poorQuality: 'Chất lượng kém',
      /** Two phrases, HIỆN CHƯA / CÓ ẢNH: unbound it set as HIỆN / CHƯA CÓ / ẢNH, three lines with *ẢNH* alone */
      noneNow: 'Hiện\u00a0chưa có\u00a0ảnh',
      unavailable: 'Không tải được ảnh',
    },
    frameAlt: (sat: string, infrared: boolean) => `${sat}: ảnh ${infrared ? 'hồng ngoại ' : ''}mới nhất quanh nơi này`,
    /** IR is international; *HN* would read Hà Nội */
    infraredChip: 'IR',
    infraredTitle: 'Hồng ngoại: đỉnh mây theo nhiệt độ, càng lạnh càng sáng',
  },

  // ── 04 / DÒNG THỜI GIAN ──────────────────────────────────────────────────────────────────
  timeline: {
    title: 'Dòng thời gian',
    meta: (days: number, zoneLabel: string, zones: string) => `${f.int(days)} ngày · ${zoneLabel} · ${zones}`,
    zoneChange: (before: string, after: string) => `${before} → ${after}`,
    daylight: 'Ban ngày ở đây',
    /**
     * A verdict's name cannot follow a bare count in Vietnamese (*31 đã quan sát* has no noun), so each verdict is
     * named, then a colon and its count: the verdicts' own titles, unchanged (vi.md §3.7)
     */
    summary: (days: number, counts: Record<Verdict, number>, titles: Readonly<Record<Verdict, string>>) =>
      `Dòng thời gian ${f.int(days)} ngày. ` +
      (['imaged', 'likely', 'could', 'overhead'] as const).map((v) => `${titles[v]}: ${f.int(counts[v])}`).join('; ') +
      '.',
    keysHint: (summary: string) => `${summary} Dùng phím mũi tên trái và phải để chuyển giữa các lượt bay.`,
    /** *Địa tĩnh* ("geostationary"), as the lanes' own words */
    geoLane: (n: number): Rich => [strong('Địa tĩnh · '), f.int(n)],
    geoNames: (names: readonly string[]) => names.join(', '),
    now: 'Bây giờ',
    geometry: (deg: number, km: number) => `nghiêng ${f.dec(deg, 1)}° · ${f.int(km)} km`,
    markMosaic: (gsdM: number) => `Ảnh ghép hằng ngày, ${f.int(gsdM)} m · ●`,
    markRadar: (gsdM: number) => `Ảnh radar, ${f.int(gsdM)} m · ◆`,
    markImaged: (title: string) => `${title} · ◆`,
    markKind: (title: string, category: SatCategory) => `${title} · ${MARK_KIND[category] ?? 'khác'}`,
  },

  // ── 02 / PHÁT LẠI ────────────────────────────────────────────────────────────────────────
  replay: {
    scrubLabel: 'Thời điểm trong lượt bay',
    scrubValue: (tMinus: string, utc: string) => `${tMinus}, ${utc}`,
    /** The media pair (*Phát* / *Tạm dừng*), so it never shares the footer's name *Phát lại lượt bay* */
    play: 'Phát',
    pause: 'Tạm dừng',
    speed: 'Tốc độ phát lại',
    /**
     * The legend is one nowrap row (start clock, this, the closest tick, end clock), about 21 characters on a 390 px
     * phone: the noun *Tầm nhìn* labels the shaded span (*Trong tầm nhìn 37 giây* pushed the end clock off the screen;
     * a bare *Trong tầm* is incomplete)
     */
    inView: (duration: string) => `Tầm nhìn ${duration}`,
    closest: 'Gần nhất',
    /** The key as Vietnamese keyboards print it (US layout) */
    spaceKey: 'Space',
    playPause: 'phát / tạm dừng',
    stepKind: 'lượt cùng loại trước / tiếp theo',
  },

  // ── the plan view ────────────────────────────────────────────────────────────────────────
  plan: {
    label: (sat: string, km: number) => `Sơ đồ lượt bay: vệt quỹ đạo của ${sat}, cách nơi này ${f.int(km)} km lúc gần nhất.`,
    /** At most 15 characters; the drawing itself is the plan */
    northUp: 'Bắc ở trên',
    /** 20 characters at most with a two-digit angle */
    fieldOfRegard: (deg: number) => `Tầm nhìn ±${deg}°`,
    swath: (km: number) => `Dải quét ${f.int(km)} km`,
    groundTrack: 'Vệt quỹ đạo',
    scale: (km: number) => `${km >= 1 ? f.int(km) : f.dec(km, 1)} km`,
    closest: (km: number) => `Gần nhất ${km < 1 ? '< 1' : f.int(km)} km`,
  },

  // ── a picture's product line ─────────────────────────────────────────────────────────────
  product: {
    mosaic: (m: number) => `Ảnh ghép hằng ngày · ${px(m)} m`,
    fullDisc: (km: number) => `Toàn đĩa · ${px(km)} km`,
    infrared: (km: number) => `Hồng ngoại · ${px(km)} km`,
    sentinel2: (m: number) => `Sentinel-2 L2A · ${px(m)} m`,
    landsat: (m: number) => `Landsat C2 L2 · ${px(m)} m`,
    sentinel1: (m: number) => `Radar Sentinel-1 · ${px(m)} m`,
    other: (m: number) => `${px(m)} m`,
  },
  pixel: { m: (m: number) => `${px(m)} m`, km: (km: number) => `${px(km)} km` },

  // ── the time-lapse row ───────────────────────────────────────────────────────────────────
  timelapse: {
    title: 'Time-lapse',
    sub: 'Nơi này, qua từng năm',
  },
}
export default results
