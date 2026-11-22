/**
 * Japanese copy for the photo gallery and its photo frames (see docs/i18n/ja.md §3.7 "gallery and lightbox").
 *
 * Why the words are these: the gallery holds weather mosaics and radar images beside the photos, so what it shows is
 * 画像 (any image), never 写真, and every count of them takes 枚, total first ("27枚中3枚目"). "Closest look" is the
 * most detailed clear image, 最も詳細な画像 (最接近 is a moment of the pass), and "clear" is 雲なし (クリア reads as the
 * Clear button). A daily mosaic is 日別画像: モザイク means censorship pixelation. Particles attach straight to any
 * satellite or place name, so "Sentinel-2Cによる東京の画像" needs no space. Mono labels are kanji nouns (Japanese has
 * no case: CSS uppercases only the Latin parts); tooltips name their keys in half-width parentheses, 拡大(F).
 */
import type en from '../en/gallery'
import type { CoverLead } from '../en/gallery'
import { fmt } from '../../../api/_lib/i18n/format'
import { strong, type Rich } from '../../../api/_lib/i18n/parts'

const f = fmt('ja')
const pct = (n: number) => `${f.int(n)}%`

const LEAD: Record<CoverLead, string> = {
  closest: '最も詳細な画像',
  lastClear: '直近の晴天画像',
  clouded: '雲に覆われた',
}

/** "：Sentinel-2C、11/1(日) 16:14": the satellite and its moment after an accessible name's action */
const which = (sat: string, day: string, time: string) => `：${sat}、${day} ${time}`

const gallery: typeof en = {
  // ── the bar over the photos ──────────────────────────────────────────────────────────────
  barLabel: '画像',
  filterLabel: '画像を絞り込む',
  filter: { all: 'すべて', detailed: '詳細画像', weather: '気象', radar: 'レーダー' },
  filterTitle: {
    all: 'すべての画像。最も詳細な画像のあとは新しい順',
    detailed: 'Sentinel-2とLandsat。1ピクセル10〜30 m',
    weather: '日別の気象画像。1ピクセル250 m以上',
    radar: 'Sentinel-1のレーダー画像。1ピクセル20 m。雲を通して、昼も夜も見える',
  },
  photosThisWeek: (n: number) => `この1週間に${f.int(n)}枚`,
  photosThatWeek: (n: number) => `その1週間に${f.int(n)}枚`,
  prevPhoto: '前の画像',
  prevTitle: '前へ(←)',
  nextPhoto: '次の画像',
  nextTitle: '次へ(→)',
  carousel: 'カルーセル',
  trackLabel: 'この場所の画像。スワイプで次へ',

  // ── a slide ──────────────────────────────────────────────────────────────────────────────
  slide: 'スライド',
  lead: LEAD,
  slideLabel: (lead: CoverLead | undefined, sat: string, day: string, time: string, photo?: { k: number; n: number }) =>
    `${lead ? `${LEAD[lead]}：` : ''}${sat}、${day} ${time}${photo ? `、${f.int(photo.n)}枚中${f.int(photo.k)}枚目` : ''}`,
  replayLabel: (sat: string, day: string, time: string) => `この通過を地球儀でリプレイ${which(sat, day, time)}`,
  /** Phones and laptops read リプレイ, portrait tablets この通過をリプレイ: the object comes first in Japanese */
  replay: [strong('この通過を'), 'リプレイ'] as Rich,
  viewLabel: {
    lastClear: (sat: string, day: string, time: string) => `直近の晴天画像を拡大表示${which(sat, day, time)}`,
    photo: (sat: string, day: string, time: string) => `画像を拡大表示${which(sat, day, time)}`,
  },
  view: '表示',
  sharePass: 'この通過を共有',
  radarTag: 'レーダー',
  noteMostlyCloud: 'この1週間の通過はほぼ雲だった',
  noteLastClear: 'これが直近の晴天画像',
  /** "your spot" is the searched place: 地点, never あなたの */
  clouded: {
    pct: (p: number) => `雲に覆われた · ${pct(p)}`,
    coverAtSpot: '雲に覆われた · 地点にも雲',
    atSpot: '地点に雲',
  },
  status: {
    cloudedPct: (p: number) => `雲に覆われた · ${pct(p)}`,
    cloudAtSpot: '地点に雲',
    clear: '雲なし',
    cirrus: '薄い巻雲',
    shadow: '雲の影',
    cloudPct: (p: number) => `雲量 ${pct(p)}`,
    mosaic: '日別画像',
  },
  cropKm: (km: number) => `${km >= 100 ? f.int(km) : f.dec(km, 1)} km`,

  // ── a photo frame ────────────────────────────────────────────────────────────────────────
  /** による (by), not 撮影: the picture may be a radar image or a mosaic */
  photoAlt: (sat: string, place: string) => `${sat}による${place}の画像。中央がこの場所。`,
  acquiring: '取得中',
  /** A failed status (§1.1), paired with 取得中: 画像なし would deny the image cropMissing says still exists */
  noImage: '取得に失敗',
  retry: '再試行',
  scaleKm: (km: number) => `${km >= 1 ? f.int(km) : f.dec(km, 1)} km`,
  /** The cartographic N, as the guide keeps it (§4 Compass) */
  north: 'N',
  expandLabel: '画像を拡大',
  expandTitle: '拡大(F)',

  // ── a photo developing (the pushbroom reveal) ────────────────────────────────────────────
  stillRendering: 'まだ生成中。大きなシーンは10秒以上かかることがある。',
  cropMissing: 'アーカイブがこの範囲を返さなかった。混んでいるのかもしれない。画像自体は存在する。',
  /** ライン, not 走査線: that word is the geostationary scan's */
  scanLine: (line: string, lines: string): Rich => ['ライン ', strong(line), ` → ${lines}`],
  awaiting: { pass: '通過待ち', scan: '走査待ち' },
}

export default gallery
