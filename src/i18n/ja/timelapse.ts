/**
 * Japanese copy for the time-lapse: the player, its waiting screen, its share and video buttons, and the words drawn
 * into the MP4 (see docs/i18n/ja.md §3.7 "timelapse", §8).
 *
 * Why it reads this way: a frame is フレーム and a clear look 晴天画像, both counted with 枚, so a loop is "晴天画像11枚 ·
 * 毎年1枚". Dates are built from the frame's day read at 'UTC' (its `ms` is UTC midnight of that day): 2015/10/22 in
 * the mono readouts, 2015年10月22日 when spoken. A year is never grouped ("2015年から"). Progress counts put the total
 * first, as Japanese does ("12件中3件": scenes are 件, frames 枚). The war-zone and glacier captions name only the
 * season every frame is from (毎年夏に1枚), never why (§8). Status lines are nouns: 書き出し中, 作成に失敗, never a
 * conjugated verb. The video draws these words as they are (Japanese has no case); names (Sentinel-2, Planetary
 * Computer, H.264, Chrome) stay as they are, and particles attach straight to any place name.
 */
import type en from '../en/timelapse'
import type { SeasonName } from '@/imagery/seasonRegions'
import { fmt } from '../../../api/_lib/i18n/format'
import { jaFields } from '../../../api/_lib/i18n/card/ja'

const f = fmt('ja')
const pad2 = (n: number) => String(n).padStart(2, '0')

/**
 * "10月22日": the frame's day in the frame list, read at 'UTC'. Never the bare "10/22": beside the badge's "02 / 12"
 * (a count) a slash day without a weekday or a year reads as one more date, and the badge as 2月12日 (docs/i18n/ja.md).
 */
const dayMonth = (ms: number) => {
  const d = jaFields(ms, 'UTC')
  return `${d.month}月${d.day}日`
}
/** "2015/10/22" (mono) */
const day = (ms: number) => {
  const d = jaFields(ms, 'UTC')
  return `${d.year}/${d.month}/${d.day}`
}
/** "2015年10月22日" (spoken) */
const daySpoken = (ms: number) => {
  const d = jaFields(ms, 'UTC')
  return `${d.year}年${d.month}月${d.day}日`
}
/** "晴天画像11枚" */
const looks = (n: number) => `晴天画像${f.int(n)}枚`
const EACH: Record<SeasonName, string> = {
  winter: '毎年冬に1枚',
  spring: '毎年春に1枚',
  summer: '毎年夏に1枚',
  autumn: '毎年秋に1枚',
}
/**
 * The first sentence both notes share. The frames stay its topic throughout: a joined …Sentinel-2が撮り、…整えている
 * would carry Sentinel-2 over as the subject of the toning, which the site does.
 */
const SQUARE = (km: number) => `どのフレームもSentinel-2が撮った同じ${f.int(km)} km四方で、このサイトのほかの画像と同じ色調に整えてある。`

const timelapse: typeof en = {
  // ── The dialog and its bar ────────────────────────────────────────────────────────────────
  dialog: (place: string) => `${place}のタイムラプス`,
  title: 'タイムラプス',
  close: '閉じる',
  escKey: 'Esc',

  // ── Controls ──────────────────────────────────────────────────────────────────────────────
  play: '再生',
  pause: '一時停止',
  slider: 'フレーム',
  frameList: 'フレーム一覧',

  // ── Dates and the readout ─────────────────────────────────────────────────────────────────
  date: day,
  dayMonth,
  readout: (ms: number, satellite: string) => `${day(ms)} · ${satellite}`,
  frameSpoken: (index: number, total: number, ms: number) => `${f.int(total)}枚中${f.int(index)}枚目：${daySpoken(ms)}`,

  // ── The caption ───────────────────────────────────────────────────────────────────────────
  captionYearly: (count: number) => `${looks(count)} · 毎年1枚`,
  captionSeason: (count: number, season: SeasonName) => `${looks(count)} · ${EACH[season]}`,
  captionGathering: (since: number) => `晴天画像を毎年1枚 · ${since}年から`,
  captionShort: 'タイムラプスなし',
  /** A label: past tense, no full stop */
  captionError: 'アーカイブが応答しなかった',

  // ── The note under the frames ─────────────────────────────────────────────────────────────
  /** できるだけ keeps "aims for": a year falls back to any clear date when its season has none */
  note: (km: number) => `${SQUARE(km)}年ごとにできるだけ違う季節から選び、晴天画像のない年は省く。`,
  noteOneSeason: (km: number) => `${SQUARE(km)}毎年同じ季節から選び、その季節に晴天画像のない年は省く。`,
  /** The names stay; only 経由 ("via") is Japanese */
  source: 'Copernicus Sentinel-2、Planetary Computer経由',

  // ── The waiting screen ────────────────────────────────────────────────────────────────────
  listing: 'アーカイブを検索中',
  choosing: '晴天画像を選定中',
  /** 現像 is the darkroom word, as the English "developing" is */
  developing: 'フレームを現像中',
  choosingProgress: (done: number, total: number) => `晴天画像を選定中、${f.int(total)}件中${f.int(done)}件`,
  developingProgress: (done: number, total: number) => `フレームを現像中、${f.int(total)}枚中${f.int(done)}枚`,
  tooCloudy: 'ここは雲が多く、タイムラプスを作れない。',
  tooFew: (count: number, since: number, needed: number) =>
    `${count === 0 ? `${since}年以降、晴天画像なし` : `${since}年以降の${looks(count)}`} · ${f.int(needed)}枚必要`,
  noAnswer: 'アーカイブが応答しなかった。',
  unreachable: 'Planetary Computerに接続できない',
  retry: '再試行',

  // ── Sharing and the video ─────────────────────────────────────────────────────────────────
  share: '共有',
  linkCopied: 'コピー済み',
  shareTitle: (place: string) => `${place}、年ごとの変化`,
  video: '動画',
  /** Padded to two digits, as English, so the 132 px button never changes width as it counts */
  rendering: (pct: number) => `書き出し中 ${pad2(pct)}%`,
  videoFailed: '作成に失敗',
  saveVideo: '動画を保存',
  /** A tooltip: its last sentence takes no 。, like every other tooltip (gallery.filterTitle, results.geo.infraredTitle) */
  noH264: 'このブラウザにはH.264エンコーダーがない。ファイルはChromeとFirefoxで再生できる',
  fileNamePlace: 'place',
}

export default timelapse
