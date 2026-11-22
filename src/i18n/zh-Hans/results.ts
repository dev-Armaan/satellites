/**
 * Simplified Chinese copy for the results panel (see docs/i18n/zh-Hans.md §3.3, §3.4, §4, §5, Appendix A "Results"):
 * the headline and its second line, the reasons no image was made public, the footnotes, the computing readout, the
 * headers and footer, the timeline, the replay controls, the plan view, the geostationary list and the product lines.
 *
 * Why it reads this way:
 *  - The headline is a full sentence with 有 before its numbered subject ("过去 7 天里，有 256 颗卫星注视过 Waterloo。"):
 *    without 有 it reads like a newspaper headline. 有 and the time phrase stay plain, the count phrase is the strong
 *    part, the place the accent, and 。 sits outside it (dropped when the code cut the place with …). The zero case is
 *    its own sentence; an older window is "10月29日至11月5日，有…".
 *  - The second line puts 至少 first, as its own part, so the sentence settles in place when the count is final
 *    ("至少 31 张图像已公开。" → "31 张图像已公开。"). It counts every kind of image, so it is always 图像, never 照片.
 *  - zh has one plural category: a count has one form, and where English spells "once" Chinese writes 一次. A number
 *    and its measure word are tied by U+00A0 ("256 颗", "7 天"), and so is a unit inside text that wraps (the
 *    footnote's "10–30 m"), because Chinese breaks a line anywhere; Han and a number are spaced by an ordinary space.
 *    One-line mono readouts keep the ordinary space before a unit, as English does.
 *  - Place and satellite names arrive bare and are spaced through cjkGap (withName), so "注视过 Waterloo" but "注视过北京";
 *    no frame adds a suffix, an article or quotes to them. Lists join with 、 and 和, by hand (Intl writes "Capella和").
 *  - Days are built by hand from the date fields through the zh-Hans 'time' namespace (11月1日 周日, 10月29日,
 *    11月1日 → 8日), so a header and the same pass's row agree. Mono labels are noun phrases; Han has no case.
 */
import type en from '../en/results'
import type { PlaceWhen, UtcWhen, WindowWhen } from '../en/results'
import type { Pass, SatCategory } from '@/types'
import { localParts, type DateFields } from '@/ui/results/lib/time'
import { fmt } from '../../../api/_lib/i18n/format'
import { accent, num, strong, type Part, type Rich } from '../../../api/_lib/i18n/parts'
import { cjkGap, withName } from '../../../api/_lib/i18n/card/zh-Hans'
import zhTime from './time'
import zhVerdicts from './verdicts'

const f = fmt('zh-Hans')
const NB = ' '
type Verdict = Pass['verdict']

/** "7 天", "31 次": a grouped count, U+00A0, its measure word */
const count = (n: number, unit: string) => `${f.int(n)}${NB}${unit}`
/** "10月29日" / "11月1日 周日" at a zone, as the 'time' namespace writes them */
const dayMonth = (ms: number, timeZone: string) => zhTime.dayMonth(ms, timeZone, localParts(ms, timeZone))
const day = (ms: number, timeZone: string) => zhTime.day(ms, timeZone, localParts(ms, timeZone))

/** The place at the end of a sentence: the gap from the text before it, the accent, and 。 unless the place was cut */
const placeEnd = (before: string, place: string): Part[] => {
  const gap = cjkGap(before, place)
  return [...(gap ? [gap] : []), accent(place), ...(place.endsWith('…') ? [] : ['。'])]
}

/** "Umbra-08、Capella-14 和另外 7 颗雷达卫星": items joined with 、, the last with 和, spaced through cjkGap (§5.4) */
function list(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  const head = items.slice(0, -1).join('、')
  const last = items[items.length - 1]
  return `${head}${cjkGap(head, '和')}和${cjkGap('和', last)}${last}`
}

/** "已核查 412 颗成像卫星和载人航天器的 1,204 次过境。" */
const checked = (passes: number, sats: number) => `已核查 ${count(sats, '颗成像卫星和载人航天器')}的 ${count(passes, '次过境')}。`

/** The verdicts in their order on screen */
const VERDICTS = ['imaged', 'likely', 'could', 'overhead'] as const

/** What a pass's mark stands for in the timeline's tooltip: the kind of satellite and the mark's shape */
const MARK_KIND: Partial<Record<SatCategory, string>> = {
  'open-optical': '开放数据成像卫星 · ◇',
  'commercial-optical': '商业卫星 · □',
  radar: '雷达卫星 · ▣',
  'weather-leo': '气象卫星 · ○',
  crewed: '载人航天器 · ✛',
}

const results: typeof en = {
  // ── the headline ────────────────────────────────────────────────────────────────────────────
  headline: {
    /** "过去 7 天里，有 **256 颗卫星注视过** *Waterloo*。" / "10月29日至11月5日，有 **31 颗卫星注视过** *Waterloo*。" */
    watched: (n: number, place: string, when: WindowWhen): Rich => [
      'lastDays' in when
        ? `过去 ${count(when.lastDays, '天')}里，有 `
        : `${dayMonth(when.fromMs, when.timeZone)}至${dayMonth(when.toMs, when.timeZone)}，有 `,
      strong(num(f.int(n)), `${NB}颗卫星注视过`),
      ...placeEnd('注视过', place),
    ],
    /** "这一周，我们追踪的卫星没有一颗注视过 *Waterloo*。" */
    none: (place: string, past: boolean): Rich => [`${past ? '那一周' : '这一周'}，我们追踪的卫星没有一颗注视过`, ...placeEnd('注视过', place)],
  },

  // ── the second line ─────────────────────────────────────────────────────────────────────────
  /** "至少 1,715 张图像已公开。": 至少 is the strong part, removed once the count is final */
  imagesPublic: (k: number): Rich => [strong('至少 '), num(f.int(k)), `${NB}张图像已公开。`],
  noImages: { thisWeek: '这一周没有公开的图像。', thatWeek: '那一周没有公开的图像。' },
  archiveDown: '图像库没有及时响应，暂时无法统计公开图像。',
  tryAgain: '重试',
  share: '分享',
  shareWeekLabel: (place: string, past: boolean) => withName('分享', place, `的${past ? '那一周' : '这一周'}`),

  why: {
    sunNeverRose: '太阳一直没有升起，白天工作的相机都看不到这里。',
    sunBarelyRose: '太阳几乎没有升起，白天工作的相机都看不到这里。',
    /** "气象卫星仍用红外扫过这里 42 次。" */
    infrared: (n: number): Rich => ['气象卫星仍用红外扫过这里 ', num(f.int(n)), `${NB}次。`],
    /** "雷达不需要光照。Umbra-08、Capella-14 和另外 7 颗雷达卫星在探测范围内经过了 1,204 次。" */
    radar: (names: readonly string[], others: number, passes: number): Rich => {
      const rest = others > 0 ? [`${names.length ? '另外 ' : ''}${count(others, '颗雷达卫星')}`] : []
      return [withName('雷达不需要光照。', list([...names, ...rest]), '在探测范围内经过了 '), num(f.int(passes)), `${NB}次。`]
    },
    /** "Sentinel-2 或 Landsat 白天经过这里一次 / 3 次，但还没有公开任何图像。" */
    unpublished: (n: number) => `Sentinel-2 或 Landsat 白天经过这里${n === 1 ? '一次' : ` ${count(n, '次')}`}，但还没有公开任何图像。`,
    none: '白天没有开放数据的成像卫星经过这里。',
  },

  // ── the summary's four readouts ─────────────────────────────────────────────────────────────
  verdictGroup: '按判定分类的过境。每一项都能跳到对应的列表。',
  /** "31 次过境：注视过" */
  verdictReadout: (n: number, verdict: Verdict, title: string) => `${f.int(n)}${NB}${zhVerdicts[verdict].unit(n)}：${title}`,

  // ── the footnotes ───────────────────────────────────────────────────────────────────────────
  notes: {
    /**
     * "12 张精细图像（Sentinel-2、Landsat，10–30 m）· 3 张每日气象拼接图（250–375 m）· …。已核查…": no space beside the
     * full-width parenthesis. With no detailed image the first part says so (never "0 张")
     */
    counted: (o: { detailed: number; mosaics: number; radar: number; geo: number; passes: number; satellites: number }): Rich => {
      const out: Part[] = o.detailed
        ? [strong(f.int(o.detailed)), `${NB}张精细图像（Sentinel-2、Landsat，10–30${NB}m）`]
        : [`没有精细图像（Sentinel-2、Landsat，10–30${NB}m）`]
      if (o.mosaics) out.push('· ', strong(f.int(o.mosaics)), `${NB}张每日气象拼接图（250–375${NB}m）`)
      if (o.radar) out.push('· ', strong(f.int(o.radar)), `${NB}张雷达图像（Sentinel-1，20${NB}m）`)
      if (o.geo) out.push('· ', strong(f.int(o.geo)), `${NB}张静止气象卫星全圆盘图像（2–5${NB}km；每颗只显示最新一张）`)
      out.push(`。${checked(o.passes, o.satellites)}`)
      return out
    },
    checked: (passes: number, satellites: number) => checked(passes, satellites),
    /**
     * "过境时间是每颗卫星最接近 Waterloo 的时刻，根据公开的轨道根数（获取于 2026-11-08 03:31Z）算出。当地时间的时区：
     * America/Toronto。": the fetch time sits beside the elements it dates, as in English
     */
    passTimes: (place: string, fetched: string | undefined, zoneLabel: string) =>
      `${withName('过境时间是每颗卫星最接近', place, '的时刻，根据公开的轨道根数')}` +
      `${fetched ? `（获取于 ${fetched}）` : ''}算出。当地时间的时区：${zoneLabel}。`,
  },

  // ── the panel ───────────────────────────────────────────────────────────────────────────────
  sheetLabel: (place: string) => withName('', place, '上空的卫星'),
  computingPasses: '正在计算过境',
  sections: { summary: '概览', passes: '过境', watchedContinuously: '持续注视' },
  checkingArchives: '正在查询图像库',
  invite: {
    text: '这一周，也有东西注视过你。',
    checkPlace: '查看你的地点',
    dismiss: '关闭',
  },
  searchAnother: '搜索其他地点',
  allPasses: '全部过境',

  footer: {
    replay: '回放',
    replayLabel: '回放这次过境',
    replayTitle: '在地球上回放这次过境',
    shareLabel: { pass: '分享这次过境', image: '分享这张图像' },
    /** Narrow phones read 分享 */
    shareButton: { pass: ['分享', strong('这次过境')] as Rich, image: ['分享', strong('这张图像')] as Rich },
    /** Narrow phones read 你的地点, beside the search glyph */
    checkPlace: [strong('查看'), '你的地点'] as Rich,
    /** Narrow phones read 最清晰画面 */
    clearest: [strong('查看'), '最清晰画面'] as Rich,
    clearestLabel: '查看最清晰画面',
  },

  // ── the headers ─────────────────────────────────────────────────────────────────────────────
  head: {
    /** "7 天 · 11月1日 → 8日" */
    windowSpan: (days: number, startMs: number, endMs: number, timeZone: string) =>
      `${count(days, '天')} · ${zhTime.dayRange(startMs, endMs, timeZone, localParts(startMs, timeZone), localParts(endMs, timeZone))}`,
    verifying: '正在核对气象拼接图',
    cancel: '取消',
    newSearch: '重新搜索',
    close: '关闭',
    escKey: 'Esc',
    searchBarLabel: (place: string) => `搜索其他地点（当前：${place}）`,
    change: '更换',
    computing: '计算中',
    recent: '最近搜索',
    /** "同类过境中的第 3 次，共 31 次" */
    position: (k: number, n: number) => `同类过境中的第 ${count(k, '次')}，共 ${count(n, '次')}`,
    previous: '上一次同类过境',
    next: '下一次同类过境',
    previousTitle: '上一次（←）',
    nextTitle: '下一次（→）',
    allPassesTitle: '全部过境（Esc）',
    /** "有人分享给你 · Sentinel-2C 注视过 Waterloo" */
    shared: (sat: string, place: string) => `有人分享给你 · ${withName(withName('', sat, '注视过'), place, '')}`,
    /** "11月1日 周日 · 16:14:21 EST", the day as the 'time' namespace's stamp writes it; "≈ 16:14" for a scan */
    passWhen: (ms: number, timeZone: string, p: DateFields, time: string, zone: string, approx: boolean) =>
      `${zhTime.day(ms, timeZone, p)} · ${approx ? '≈ ' : ''}${time} ${zone}`,
  },

  // ── the computing readout ───────────────────────────────────────────────────────────────────
  computing: {
    stages: {
      catalog: { idle: '轨道目录', done: '目录已加载' },
      propagate: { idle: (days: number) => `推算轨道 · ${count(days, '天')}`, done: '轨道已推算' },
      archive: { idle: 'Sentinel-2 + Landsat 图像库', done: '图像库已检索' },
      match: { idle: '匹配图像与过境', done: '图像已匹配' },
    },
    ready: '报告已就绪',
    /** A 24 px cell: OK is read in Chinese UIs, and two Han would not fit */
    ok: 'OK',
    seconds: (s: number) => `${f.dec(s, 2)}${NB}秒`,
    /**
     * "7 天 · 11月1日 05:47 → 8日 05:47 UTC" (phones up to 420 px drop the strong part). One nowrap mono row beside the
     * percentage, 352 px on the 400 px panel: 时间窗 adds nothing next to the dates (head.windowSpan reads "7 天 · …"),
     * and the end's month is written only when it changes, as the 'time' namespace's dayRange does
     */
    window: (days: number, from: UtcWhen, to: UtcWhen): Rich => {
      const a = localParts(from.ms, 'UTC')
      const b = localParts(to.ms, 'UTC')
      const sameMonth = a.month === b.month && a.year === b.year
      const end = sameMonth ? zhTime.dayCompact(to.ms, 'UTC', b) : zhTime.dayMonth(to.ms, 'UTC', b)
      return [strong(`${count(days, '天')} · `), `${zhTime.dayMonth(from.ms, 'UTC', a)} ${from.time} → ${end} ${to.time} UTC`]
    },
    percent: (pct: number) => `${f.int(pct)}%`,
    slow: 'Planetary Computer 和 NASA 按需生成图像，这一步可能需要几秒钟。',
    verySlow: '图像库响应较慢。如果一直没有响应，我们仍会根据轨道几何显示过境，并注明这一点。',
    /** "Sentinel-2C 获取的 Waterloo 图像，有人分享给你。" */
    sharedAlt: (sat: string | undefined, place: string) =>
      withName(withName('', sat ?? '一颗卫星', '获取的'), place, '图像，有人分享给你。'),
    /** "**有人分享给你** · Sentinel-2C 注视过 Waterloo · 11月1日 周日 16:14" */
    sharedCaption: (sat: string | undefined, place: string, when?: PlaceWhen): Rich => [
      strong('有人分享给你'),
      ` · ${withName(withName('', sat ?? '一颗卫星', '注视过'), place, '')}${when ? ` · ${day(when.ms, when.timeZone)} ${when.time}` : ''}`,
    ],
  },

  // ── 03 / 持续注视: geostationary weather satellites ─────────────────────────────────────────
  geo: {
    none: '从这里看，没有一颗业务运行的静止气象卫星的仰角超过 5°。',
    /** "0.0°E · 仰角 34.5° · 每 10 分钟" */
    facts: (lon: string, elevationDeg: number, cadenceMin: number) =>
      `${lon} · 仰角 ${f.dec(elevationDeg, 1)}° · 每 ${count(cadenceMin, '分钟')}`,
    /** "这一周 312 张图像" / "3 天内 312 张图像" */
    images: (n: number, days: number): Rich => [days === 7 ? '这一周 ' : `${count(days, '天')}内 `, num(f.int(n)), `${NB}张图像`],
    replay: '回放',
    /** The satellite is named before the colon, so no 它的 (§2.3) */
    replayLabel: (sat: string) => withName('', sat, '：回放最新图像'),
    frame: {
      probing: '正在查找…',
      noPublic: '没有公开图像',
      poorQuality: '画质不佳',
      noneNow: '暂无图像',
      unavailable: '画面无法显示',
    },
    frameAlt: (sat: string, infrared: boolean) => withName('', sat, `：这里附近的最新${infrared ? '红外' : ''}画面`),
    /** Two Han fit the chip, and Chinese readers know 红外 better than IR */
    infraredChip: '红外',
    infraredTitle: '红外图像：亮度表示云顶温度，越冷越亮',
  },

  // ── 04 / 时间线 ─────────────────────────────────────────────────────────────────────────────
  timeline: {
    title: '时间线',
    meta: (days: number, zoneLabel: string, zones?: string) =>
      `${count(days, '天')} · ${zoneLabel}${zones ? ` · ${zones}` : ''}`,
    zoneChange: (before: string, after: string) => `${before} → ${after}`,
    daylight: '此处白天',
    /**
     * "时间线（7 天）：注视过 12 次，很可能注视过 3 次，能对准这里 0 次，从上空经过 40 次。" Each verdict's name, then its
     * count of passes: in Chinese a verb phrase takes its count after it, so every name stays as the verdicts write it
     */
    summary: (days: number, counts: Record<Verdict, number>, titles: Readonly<Record<Verdict, string>>) =>
      `时间线（${count(days, '天')}）：${VERDICTS.map((v) => `${titles[v]} ${count(counts[v], '次')}`).join('，')}。`,
    /** Chinese joins sentences with no space */
    keysHint: (summary: string) => `${summary}按左右方向键可以逐一查看过境。`,
    /** "静止轨道 · 5" (screens up to 1180 px show the count alone) */
    geoLane: (n: number): Rich => [strong('静止轨道 · '), f.int(n)],
    geoNames: (names: readonly string[]) => names.join('、'),
    now: '现在',
    geometry: (deg: number, km: number) => `偏离垂直 ${f.dec(deg, 1)}° · ${f.int(km)} km`,
    markMosaic: (gsdM: number) => `每日拼接图，${f.int(gsdM)} m · ●`,
    markRadar: (gsdM: number) => `雷达图像，${f.int(gsdM)} m · ◆`,
    markImaged: (title: string) => `${title} · ◆`,
    markKind: (title: string, category: SatCategory) => `${title} · ${MARK_KIND[category] ?? '其他卫星'}`,
  },

  // ── 02 / 回放 ───────────────────────────────────────────────────────────────────────────────
  replay: {
    scrubLabel: '过境中的场景时间',
    scrubValue: (tMinus: string, utc: string) => `${tMinus}，${utc}`,
    play: '开始回放',
    pause: '暂停回放',
    speed: '回放速度',
    inView: (duration: string) => `在可视范围内 ${duration}`,
    closest: '最接近',
    spaceKey: '空格',
    playPause: '播放 / 暂停',
    stepKind: '上一次 / 下一次同类过境',
  },

  // ── the plan view ───────────────────────────────────────────────────────────────────────────
  plan: {
    /** "示意图：Sentinel-2C 的地面轨迹，最接近时距离这里 61 km。" */
    label: (sat: string, km: number) => `${withName('示意图：', sat, '的地面轨迹')}，最接近时距离这里 ${f.int(km)} km。`,
    northUp: '示意图 · 上北',
    fieldOfRegard: (deg: number) => `可视范围 ±${deg}°`,
    swath: (km: number) => `幅宽 ${f.int(km)} km`,
    groundTrack: '地面轨迹',
    scale: (km: number) => `${km >= 1 ? f.int(km) : f.dec(km, 1)} km`,
    closest: (km: number) => `最近距离 ${km < 1 ? '< 1' : f.int(km)} km`,
  },

  // ── a picture's product line ────────────────────────────────────────────────────────────────
  product: {
    mosaic: (m: number) => `每日拼接图 · ${m} m`,
    fullDisc: (km: number) => `全圆盘 · ${km} km`,
    infrared: (km: number) => `红外 · ${km} km`,
    sentinel2: (m: number) => `Sentinel-2 L2A · ${m} m`,
    landsat: (m: number) => `Landsat C2 L2 · ${m} m`,
    sentinel1: (m: number) => `Sentinel-1 雷达 · ${m} m`,
    other: (m: number) => `${m} m`,
  },
  pixel: { m: (m: number) => `${m} m`, km: (km: number) => `${km} km` },

  // ── the time-lapse's row ────────────────────────────────────────────────────────────────────
  timelapse: {
    title: '延时摄影',
    sub: '这个地方，一年一帧',
  },
}

export default results
