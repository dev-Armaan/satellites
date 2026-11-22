/**
 * Traditional Chinese copy for the photo gallery and its photo frames (see docs/i18n/zh-Hant.md, Appendix A).
 *
 * Why the words are these: the gallery holds weather mosaics and radar images beside the photos, so what it shows is
 * 影像 (any satellite image), never 照片 (an optical photo only), and its counts say 張 ("第 3 張，共 27 張"). "Closest
 * look" is 最清晰的一張 (最近 would say "most recent"), "clear" is 無雲 (清晰 means sharp), and an image loading is
 * 接收中 (擷取 reads as a screen capture in Taiwan). Names are placed through cjkGap, so "Sentinel-2C 的 Waterloo 影像"
 * and "…的九龍影像" are both spaced as Chinese writes them. Tooltips name their keys in full-width parentheses. Mono
 * labels are stored as written (Han has no case; CSS uppercases the Latin parts).
 */
import type en from '../en/gallery'
import type { CoverLead } from '../en/gallery'
import { fmt } from '../../../api/_lib/i18n/format'
import { strong, type Rich } from '../../../api/_lib/i18n/parts'
import { withName } from '../../../api/_lib/i18n/card/zh-Hant'

const f = fmt('zh-Hant')
const pct = (n: number) => `${f.int(n)}%`

const LEAD: Record<CoverLead, string> = {
  closest: '最清晰的一張',
  lastClear: '最近一張無雲影像',
  clouded: '雲層遮蔽',
}

/** "：Sentinel-2C，11月1日 週日 16:14": the satellite and its moment after an accessible name's action */
const which = (sat: string, day: string, time: string) => `：${sat}，${day} ${time}`

const gallery: typeof en = {
  // ── the bar over the photos ──────────────────────────────────────────────────────────────
  barLabel: '影像',
  filterLabel: '顯示影像',
  filter: { all: '全部', detailed: '精細', weather: '氣象', radar: '雷達' },
  filterTitle: {
    all: '所有影像，最清晰的一張在前，其餘由新到舊',
    detailed: 'Sentinel-2 和 Landsat，每像素 10–30 m',
    weather: '每日氣象拼接影像，每像素 250 m 或更粗',
    radar: 'Sentinel-1 雷達影像，每像素 20 m：可穿透雲層，日夜皆可',
  },
  photosThisWeek: (n: number) => `這星期 ${f.int(n)} 張`,
  photosThatWeek: (n: number) => `那個星期 ${f.int(n)} 張`,
  prevPhoto: '上一張',
  prevTitle: '上一張（←）',
  nextPhoto: '下一張',
  nextTitle: '下一張（→）',
  carousel: '輪播',
  trackLabel: '這個地點的影像，滑動查看更多',

  // ── a slide ──────────────────────────────────────────────────────────────────────────────
  /** 影像, not 投影片 / 幻燈片: the word for a slide splits the regions (§1.4) */
  slide: '影像',
  lead: LEAD,
  slideLabel: (lead: CoverLead | undefined, sat: string, day: string, time: string, photo?: { k: number; n: number }) =>
    `${lead ? `${LEAD[lead]}：` : ''}${sat}，${day} ${time}${photo ? `，第 ${f.int(photo.k)} 張，共 ${f.int(photo.n)} 張` : ''}`,
  replayLabel: (sat: string, day: string, time: string) => `在地球上重播這次過境${which(sat, day, time)}`,
  /** Phones and laptops read 重播, portrait tablets 重播這次過境 */
  replay: ['重播', strong('這次過境')] as Rich,
  viewLabel: {
    lastClear: (sat: string, day: string, time: string) => `放大查看最近一張無雲影像${which(sat, day, time)}`,
    photo: (sat: string, day: string, time: string) => `放大查看影像${which(sat, day, time)}`,
  },
  view: '查看',
  sharePass: '分享這次過境',
  radarTag: '雷達',
  /** What the passes saw was mostly cloud (the card's 它看到的大多是雲), not "most passes saw only cloud" */
  noteMostlyCloud: '這星期的過境看到的大多是雲',
  noteLastClear: '這是最近一張無雲影像',
  clouded: {
    pct: (p: number) => `雲層遮蔽 · ${pct(p)}`,
    coverAtSpot: '雲層遮蔽 · 地點有雲',
    atSpot: '地點有雲',
  },
  status: {
    cloudedPct: (p: number) => `雲層遮蔽 · ${pct(p)}`,
    cloudAtSpot: '地點有雲',
    clear: '無雲',
    cirrus: '薄卷雲',
    shadow: '雲影',
    cloudPct: (p: number) => `雲量 ${pct(p)}`,
    mosaic: '每日拼接',
  },
  cropKm: (km: number) => `${km >= 100 ? f.int(km) : f.dec(km, 1)} km`,

  // ── a photo frame ────────────────────────────────────────────────────────────────────────
  /** No 拍攝 and no 照片: the picture may be a radar image, which is never "taken" like a photo */
  photoAlt: (sat: string, place: string) => `${withName(withName('', sat, '的'), place, '影像。')}地點在畫面中央。`,
  acquiring: '接收中',
  noImage: '影像庫沒有傳回影像',
  retry: '重試',
  scaleKm: (km: number) => `${km >= 1 ? f.int(km) : f.dec(km, 1)} km`,
  /** The cartographic N, as the guide keeps it (§6.9) */
  north: 'N',
  expandLabel: '放大影像',
  expandTitle: '放大（F）',

  // ── a photo developing (the pushbroom reveal) ────────────────────────────────────────────
  /** 產生, never 算繪 / 渲染 (a regional split, §1.4) */
  stillRendering: '仍在產生影像。大範圍影像可能需要 10 秒以上。',
  cropMissing: '影像庫沒有傳回這張裁切影像，可能正忙碌；影像本身仍然存在。',
  scanLine: (line: string, lines: string): Rich => ['掃描行 ', strong(line), ` → ${lines}`],
  awaiting: { pass: '等待過境', scan: '等待掃描' },
}

export default gallery
