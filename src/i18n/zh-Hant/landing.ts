/**
 * Traditional Chinese copy for the landing (see docs/i18n/zh-Hant.md §1.1, §3.1, §3.2, §5.5, §6.4, §7, Appendix A):
 * the hero, the place search, "Use my location", the example chips and the maker's credit.
 *
 * Why it reads this way: the hero and the sub line are the guide's final lines, word for word (這星期 / 有東西 /
 * 注視過*你*。: the accent on 你 alone, no comma at the display's line breaks, and 注視過, the past report the results
 * headline and the verdicts also say, so the hero says what the results say). Labels and buttons are verb + object or
 * a bare noun with no 請; 請 appears once, in `locateErrors.denied`, the one sentence that asks the reader to act
 * outside the app, and every other failure offers the search as a possibility (可改為搜尋地點).
 * A number and its unit stay together: a plain space in one-line mono labels, U+00A0 where the English ties them in
 * running text (the sub line's `7 天`, the locating note's `10 km`). The kicker's range is built from the UTC date
 * fields (`2026年11月1日 → 8日 UTC`), never Intl's numeric dates, which read as different days in Taipei and Hong Kong.
 * Hong Kong's 日 / 坐標 forms belong to the zh-Hant-HK overlay, not here.
 */
import type en from '../en/landing'
import { fmt } from '../../../api/_lib/i18n/format'
import { accent, type Rich } from '../../../api/_lib/i18n/parts'

const f = fmt('zh-Hant')

/** A UTC day as a Han date token: "2026年11月1日", "11月1日" without the year, "1日" alone. */
function utcDay(d: Date, parts: 'ymd' | 'md' | 'd'): string {
  const y = `${d.getUTCFullYear()}年`
  const m = `${d.getUTCMonth() + 1}月`
  const day = `${d.getUTCDate()}日`
  return parts === 'ymd' ? `${y}${m}${day}` : parts === 'md' ? `${m}${day}` : day
}

const landing: typeof en = {
  // ── Hero ──
  lastDays: (days: number) => `過去 ${f.int(days)} 天`,
  /** "2026年11月1日 → 8日 UTC", "2026年10月29日 → 11月5日 UTC", "2026年12月29日 → 2027年1月5日 UTC". */
  windowRange: (startMs: number, endMs: number) => {
    const a = new Date(startMs)
    const b = new Date(endMs)
    const newYear = a.getUTCFullYear() !== b.getUTCFullYear()
    const end = newYear ? 'ymd' : a.getUTCMonth() !== b.getUTCMonth() ? 'md' : 'd'
    return `${utcDay(a, 'ymd')} → ${utcDay(b, end)} UTC`
  },
  hero: [['這星期'], ['有東西'], ['注視過', accent('你'), '。']] as Rich[],
  sub: (days: number): Rich => [
    '輸入地球上任何一個地方，看看過去 ',
    f.int(days),
    ' 天從上空飛過的每一顆衛星，以及它們實際拍下的影像。',
  ],
  builtBy: (handle: string) => `由 ${handle} 製作`,
  sourceLink: '開源',
  sourceLinkLabel: '開源：GitHub 上的原始碼',

  // ── The place search ──
  searchPlaceholder: '搜尋地點',
  placeLabel: '地點',
  searching: '搜尋中',
  searchUnavailable: '無法搜尋',
  /** One form for every count (zh has only `other`); an empty list is its own phrase, never "0 個結果". */
  matches: (n: number) => (n === 0 ? '沒有結果' : `${f.int(n)} 個結果`),
  noMatch: '沒有結果',
  /** Latitude first, as the field parses it; the half-width comma inside 「」 is what you type. */
  searchHint: '地名、地址或「緯度, 經度」',
  clearSearch: '清除搜尋',
  go: '顯示從這裡上空經過的衛星',
  /** The example keeps its half-width comma and U+2212 minus: the field parses it. */
  searchDown: '地點搜尋沒有回應。座標（例如 43.47, −80.54）仍可使用。',
  nothingMatches: (query: string) => `沒有符合「${query}」的地點。試試城市、地標或座標。`,
  suggestions: '地點',

  // ── Use my location ──
  useMyLocation: '使用我的位置',
  locateMe: '我的位置',
  nearMe: '我的位置',
  locating: '定位中…',
  cancelSearch: '取消',
  cancelLocate: '取消',
  cancelLocating: '取消定位',
  requestingPosition: '正在取得位置',
  namingPlace: '正在查詢地名',
  elapsed: (seconds: number) => `${seconds.toFixed(0).padStart(2, '0')} 秒`,
  locatingNote: '你的位置會傳送到 Photon 地理編碼服務，用來取得地名。我們只記錄約 10 km 範圍的大致位置。',
  locationLabel: '定位',
  dismiss: '關閉',
  locateErrors: {
    denied: '瀏覽器已封鎖定位。請在瀏覽器設定中允許，或直接搜尋地點。',
    unavailable: '暫時無法取得你的位置，可改為搜尋地點。',
    timeout: '取得位置的時間太長。可以再試一次，或改為搜尋地點。',
    unsupported: '這個瀏覽器無法提供位置，可改為搜尋地點。',
    insecure: '定位需要安全的 https 連線，可改為搜尋地點。',
    other: '暫時無法取得你的位置，可改為搜尋地點。',
  },

  // ── Examples ──
  orTry: '或試試',
  pinHint: '或在地球上按一下，放置圖釘',
  examplesLabel: '範例地點',
  dropPin: '放置圖釘',
  /** Both parts are the curated places' Chinese copy; with no sublabel the name stands alone (no dangling comma). */
  chipName: (label: string, sublabel: string) => (sublabel ? `${label}，${sublabel}` : label),
  surprise: '隨機地點',
  surpriseName: '隨機地點：隨機挑選一個著名地點',
}
export default landing
