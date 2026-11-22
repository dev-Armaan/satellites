/**
 * Simplified Chinese copy for the landing (see docs/i18n/zh-Hans.md §3.1, §3.2, §5.3, §5.5, §7, Appendix A): the hero,
 * the place search, "Use my location", the example chips and the maker's credit.
 *
 * Why it reads this way: the hero and the sub line are the guide's final lines, word for word (这一周 / 有东西 /
 * 注视过*你*。, the accent on 你 alone, no comma in the display). Labels and buttons are verb + object or a bare noun,
 * with no 请; 请 appears once, in `locateErrors.denied`, the one sentence that asks the reader to act outside the app.
 * A number and its measure word are tied with U+00A0 (`7 天`, `3 个结果`), Han and a digit get an ordinary space. The
 * kicker's date range is ISO digits, because it scrambles on its first appearance (§6.7): `2026-11-12 → 11-19 UTC`.
 */
import type en from '../en/landing'
import { fmt } from '../../../api/_lib/i18n/format'
import { accent, type Rich } from '../../../api/_lib/i18n/parts'

const f = fmt('zh-Hans')
const pad2 = (n: number) => String(n).padStart(2, '0')

/** An instant's UTC day as ISO digits: "2026-11-12", or "11-12" without the year. */
const isoDay = (d: Date, year: boolean) => `${year ? `${d.getUTCFullYear()}-` : ''}${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`

const landing: typeof en = {
  // ── Hero ──
  lastDays: (days: number) => `过去 ${f.int(days)}\u00a0天`,
  /** The year written once: the end drops it when both ends share it ("2026-11-12 → 11-19 UTC"). */
  windowRange: (startMs: number, endMs: number) => {
    const a = new Date(startMs)
    const b = new Date(endMs)
    return `${isoDay(a, true)} → ${isoDay(b, a.getUTCFullYear() !== b.getUTCFullYear())} UTC`
  },
  hero: [['这一周'], ['有东西'], ['注视过', accent('你'), '。']] as Rich[],
  sub: (days: number): Rich => [
    '输入地球上的任何地方。你会看到过去 ',
    f.int(days),
    '\u00a0天里飞过那里的每一颗卫星，以及它们拍下的真实图像。',
  ],
  builtBy: (handle: string) => `由 ${handle} 制作`,
  sourceLink: '开源',
  sourceLinkLabel: '开源：GitHub 上的源代码',

  // ── The place search ──
  searchPlaceholder: '搜索地点',
  placeLabel: '地点',
  searching: '正在搜索',
  searchUnavailable: '搜索不可用',
  /** One form (zh has only `other`); an empty list is its own phrase, never "0 个结果". */
  matches: (n: number) => (n === 0 ? '没有结果' : `${f.int(n)}\u00a0个结果`),
  noMatch: '没有结果',
  searchHint: '地名、地址或经纬度',
  clearSearch: '清除搜索',
  go: '显示从这里上空经过的卫星',
  searchDown: '地点搜索没有响应。坐标仍然可用，例如 43.47, −80.54。',
  nothingMatches: (query: string) => `没有与“${query}”匹配的结果。可以试试城市、地标或坐标。`,
  suggestions: '候选地点',

  // ── Use my location ──
  useMyLocation: '使用当前位置',
  locateMe: '定位',
  nearMe: '我的位置',
  locating: '正在定位…',
  cancelSearch: '取消',
  cancelLocate: '取消',
  cancelLocating: '取消定位',
  requestingPosition: '正在请求位置',
  namingPlace: '正在识别地名',
  elapsed: (seconds: number) => `${seconds.toFixed(0).padStart(2, '0')}\u00a0秒`,
  locatingNote: '你的位置会发送给 Photon 地理编码服务，用来识别地名。我们只保存你所在的约 10\u00a0km 网格单元。',
  locationLabel: '定位',
  dismiss: '关闭',
  locateErrors: {
    denied: '位置权限被阻止了。请在浏览器设置里允许，或者直接搜索地点。',
    unavailable: '暂时无法获取你的位置。你可以直接搜索地点。',
    timeout: '获取位置用时太长。再试一次，或者直接搜索地点。',
    unsupported: '这个浏览器不支持定位。你可以直接搜索地点。',
    insecure: '定位需要安全的 https 连接。你可以直接搜索地点。',
    other: '暂时无法获取你的位置。你可以直接搜索地点。',
  },

  // ── Examples ──
  orTry: '或者试试',
  pinHint: '也可以点击地球放置标记',
  examplesLabel: '示例地点',
  dropPin: '放置标记',
  /** Both parts are the curated places' Chinese copy; with no sublabel the name stands alone (no dangling comma). */
  chipName: (label: string, sublabel: string) => (sublabel ? `${label}，${sublabel}` : label),
  surprise: '随机一处',
  surpriseName: '随机一处：从著名地点中抽取一个',
}
export default landing
