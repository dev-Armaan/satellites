/**
 * Japanese copy for the landing (see docs/i18n/ja.md §1, §3.1, §3.2, §3.7, §6.3): the hero, the place search, "Use my
 * location", the example chips and the maker's credit.
 *
 * Why it reads this way: the hero and the sub line are the guide's final lines word for word (今週、何かが／*あなた*を／
 * 見ていた。, the accent on あなた alone, を in the sans; the sub a 〜すると consequence, never a command). Plain form
 * everywhere: buttons are a noun or a dictionary verb with its object (現在地を使う), the pin hint states one
 * possibility (〜こともできる), and each fault says what failed, then where to act (許可はブラウザの設定から。) with at most
 * one 〜できる and no apology. A number and its counter touch (過去7日間, 3件, 05秒); a number and an SI unit keep one
 * no-break space (10 km). The kicker's date range is written by hand, numerically, with the year where it changes
 * (2026/11/12 → 11/19 UTC), never through formatRange, which emits ～.
 */
import type en from '../en/landing'
import { fmt } from '../../../api/_lib/i18n/format'
import { accent, type Rich } from '../../../api/_lib/i18n/parts'

const f = fmt('ja')

/** An instant's UTC day, unpadded: "2026/11/12", or "11/12" without the year. */
const utcDay = (d: Date, year: boolean) => `${year ? `${d.getUTCFullYear()}/` : ''}${d.getUTCMonth() + 1}/${d.getUTCDate()}`

/** Where the reader can act when locating fails: the search, which always works. */
const SEARCH_INSTEAD = '代わりに場所を検索できる。'

const landing: typeof en = {
  // ── Hero ──
  lastDays: (days: number) => `過去${f.int(days)}日間`,
  /** "2026/11/12 → 11/19 UTC", "2026/10/29 → 11/5 UTC", "2026/12/29 → 2027/1/5 UTC": the end repeats the year only when it changes. */
  windowRange: (startMs: number, endMs: number) => {
    const a = new Date(startMs)
    const b = new Date(endMs)
    return `${utcDay(a, true)} → ${utcDay(b, a.getUTCFullYear() !== b.getUTCFullYear())} UTC`
  },
  /** Three phrases (文節) in a falling cadence; the parts touch, with no spaces anywhere. */
  hero: [['今週、何かが'], [accent('あなた'), 'を'], ['見ていた。']] as Rich[],
  /** The day count is plain text, and 7日間 stays one phrase (the sub breaks at phrases). */
  sub: (days: number): Rich => [
    '地球上の好きな場所を入力すると、過去',
    f.int(days),
    '日間にその上空を通ったすべての衛星と、実際に撮られた画像が見られる。',
  ],
  builtBy: (handle: string) => `制作 ${handle}`,
  sourceLink: 'オープンソース',
  sourceLinkLabel: 'オープンソース：GitHubのコード',

  // ── The place search ──
  searchPlaceholder: '場所を検索',
  placeLabel: '場所',
  searching: '検索中',
  searchUnavailable: '検索不可',
  /** Only called with a count of 1 or more (none is `noMatch`): one form, 件 for search results. */
  matches: (n: number) => `${f.int(n)}件`,
  noMatch: '該当なし',
  /** "緯度, 経度" keeps the ASCII comma: it is the syntax the field parses (43.47, −80.54), not a Japanese list. */
  searchHint: '地名、住所、緯度, 経度',
  clearSearch: '検索をクリア',
  go: 'この場所の上空を通ったものを表示',
  searchDown: '場所の検索が応答していない。43.47, −80.54のような座標なら使える。',
  /** A typed query is quoted in 「」 (a place name never is). */
  nothingMatches: (query: string) => `「${query}」に一致するものはない。都市、ランドマーク、座標で検索できる。`,
  suggestions: '場所',

  // ── Use my location ──
  useMyLocation: '現在地を使う',
  locateMe: '現在地',
  nearMe: '現在地',
  locating: '取得中…',
  cancelSearch: 'キャンセル',
  cancelLocate: '中止',
  cancelLocating: '位置の取得を中止',
  requestingPosition: '位置を取得中',
  namingPlace: '地名を確認中',
  /** "05秒" */
  elapsed: (seconds: number) => `${seconds.toFixed(0).padStart(2, '0')}秒`,
  locatingNote: '地名を調べるため、現在地をPhoton（地名検索サービス）に送る。保存するのは約10 km四方の区画だけ。',
  locationLabel: '位置情報',
  dismiss: '閉じる',
  locateErrors: {
    denied: '位置情報へのアクセスがブロックされている。許可はブラウザの設定から。場所の検索もできる。',
    unavailable: `現在地をいま取得できない。${SEARCH_INSTEAD}`,
    timeout: '現在地の取得に時間がかかりすぎた。再試行するか、場所を検索できる。',
    unsupported: `このブラウザは位置情報を共有できない。${SEARCH_INSTEAD}`,
    insecure: `位置情報には安全な（https）接続が必要。${SEARCH_INSTEAD}`,
    other: `現在地をいま取得できない。${SEARCH_INSTEAD}`,
  },

  // ── Examples ──
  orTry: 'たとえば',
  pinHint: '地球儀をクリックしてピンを立てることもできる',
  examplesLabel: '場所の例',
  dropPin: 'ピンを立てる',
  /** Both parts are the curated places' Japanese copy; with no sublabel the name stands alone (no dangling 、). */
  chipName: (label: string, sublabel: string) => (sublabel ? `${label}、${sublabel}` : label),
  surprise: 'おまかせ',
  surpriseName: 'おまかせ：有名な場所をランダムに選ぶ',
}
export default landing
