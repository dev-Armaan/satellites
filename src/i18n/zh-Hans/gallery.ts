/**
 * Simplified Chinese copy for the photo gallery and its photo frames (see docs/i18n/zh-Hans.md).
 *
 * Why the words are these: the gallery holds weather mosaics and radar images beside the photos, so what it shows is
 * 图像 (any image), never 照片 (an optical photo only); counts of them avoid the noun where Chinese can ("第 3 张，共 27
 * 张"). "Closest look" is 最清晰画面 (最近 would say "most recent"), "clear" is 无云 (清晰 means sharp). Names are placed
 * through cjkGap, so "Sentinel-2C 获取的 Waterloo 图像" and "…获取的北京图像" are both spaced as Chinese writes them.
 * Tooltips name their keys in full-width parentheses. Mono labels are stored as written (Han has no case; CSS
 * uppercases the Latin parts).
 */
import type en from '../en/gallery'
import type { CoverLead } from '../en/gallery'
import { fmt } from '../../../api/_lib/i18n/format'
import { strong, type Rich } from '../../../api/_lib/i18n/parts'
import { withName } from '../../../api/_lib/i18n/card/zh-Hans'

const f = fmt('zh-Hans')
const NB = '\u00a0'
const pct = (n: number) => `${f.int(n)}%`

const LEAD: Record<CoverLead, string> = {
  closest: '最清晰画面',
  lastClear: '最近一次无云画面',
  clouded: '云层遮挡',
}

/** "：Sentinel-2C，11月1日 周日 16:14": the satellite and its moment after an accessible name's action */
const which = (sat: string, day: string, time: string) => `：${sat}，${day} ${time}`

const gallery: typeof en = {
  // ── the bar over the photos ──────────────────────────────────────────────────────────────
  barLabel: '图像',
  filterLabel: '显示图像',
  filter: { all: '全部', detailed: '精细', weather: '气象', radar: '雷达' },
  filterTitle: {
    all: '全部图像，最清晰画面在前，其余由新到旧',
    detailed: `Sentinel-2 和 Landsat，每像素 10–30${NB}m`,
    weather: `每日气象拼接图，每像素 250${NB}m 及以上`,
    radar: `Sentinel-1 雷达图像，每像素 20${NB}m：能穿透云层，不分昼夜`,
  },
  photosThisWeek: (n: number) => `这一周 ${f.int(n)}${NB}张`,
  photosThatWeek: (n: number) => `那一周 ${f.int(n)}${NB}张`,
  prevPhoto: '上一张',
  prevTitle: '上一张（←）',
  nextPhoto: '下一张',
  nextTitle: '下一张（→）',
  carousel: '轮播',
  trackLabel: '这个地方的图像，滑动查看更多',

  // ── a slide ──────────────────────────────────────────────────────────────────────────────
  slide: '幻灯片',
  lead: LEAD,
  slideLabel: (lead: CoverLead | undefined, sat: string, day: string, time: string, photo?: { k: number; n: number }) =>
    `${lead ? `${LEAD[lead]}：` : ''}${sat}，${day} ${time}${photo ? `，第 ${f.int(photo.k)}${NB}张，共 ${f.int(photo.n)}${NB}张` : ''}`,
  replayLabel: (sat: string, day: string, time: string) => `在地球上回放这次过境${which(sat, day, time)}`,
  /** Phones and laptops read 回放, portrait tablets 回放这次过境 */
  replay: ['回放', strong('这次过境')] as Rich,
  viewLabel: {
    lastClear: (sat: string, day: string, time: string) => `查看最近一次无云画面的大图${which(sat, day, time)}`,
    photo: (sat: string, day: string, time: string) => `查看大图${which(sat, day, time)}`,
  },
  view: '查看',
  sharePass: '分享这次过境',
  radarTag: '雷达',
  noteMostlyCloud: '这一周的过境大多只看到了云',
  noteLastClear: '这是最近一次无云画面',
  clouded: {
    pct: (p: number) => `云层遮挡 · ${pct(p)}`,
    coverAtSpot: '云层遮挡 · 此处有云',
    atSpot: '此处有云',
  },
  status: {
    cloudedPct: (p: number) => `云层遮挡 · ${pct(p)}`,
    cloudAtSpot: '此处有云',
    clear: '无云',
    cirrus: '薄卷云',
    shadow: '云影',
    cloudPct: (p: number) => `云量 ${pct(p)}`,
    mosaic: '每日拼接图',
  },
  cropKm: (km: number) => `${km >= 100 ? f.int(km) : f.dec(km, 1)} km`,

  // ── a photo frame ────────────────────────────────────────────────────────────────────────
  /** 获取 (acquired), not 拍摄: the picture may be a radar image, which is never "taken" like a photo */
  photoAlt: (sat: string, place: string) => `${withName(withName('', sat, '获取的'), place, '图像')}。这个地方在画面中央。`,
  acquiring: '获取中',
  noImage: '没有返回图像',
  retry: '重试',
  scaleKm: (km: number) => `${km >= 1 ? f.int(km) : f.dec(km, 1)} km`,
  /** The cartographic N, as the guide keeps it (Appendix A) */
  north: 'N',
  expandLabel: '查看大图',
  expandTitle: '查看大图（F）',

  // ── a photo developing (the pushbroom reveal) ────────────────────────────────────────────
  stillRendering: `仍在生成。大幅图像可能需要 10${NB}秒或更久。`,
  cropMissing: '图像库没有返回这部分画面，可能正忙。图像本身仍然存在。',
  scanLine: (line: string, lines: string): Rich => ['扫描行 ', strong(line), ` → ${lines}`],
  awaiting: { pass: '等待过境', scan: '等待扫描' },
}

export default gallery
