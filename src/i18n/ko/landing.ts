/**
 * Korean copy for the landing (see docs/i18n/ko.md §1, §3.1, §3.2, §3.7 landing, §6.3): the hero, the place search,
 * "Use my location", the example chips and the maker's credit.
 *
 * Why it reads this way: the hero and the sub line are the guide's final lines word for word (지난 일주일, / 무언가
 * *당신*을 / 지켜봤다., the accent on 당신 alone, 을 in the sans and touching it; the sub a conditional, 입력하면 … 보인다,
 * never a command). 한다체 everywhere a sentence is; buttons, chips and status lines are nouns (장소 검색, 내 위치 사용,
 * 검색 중), and each fault says what failed, then one way out with -면 된다 or what still works with -ㄹ 수 있다, with no
 * apology. A number and its counter touch (최근 7일, 3건, 05초); a number and an SI unit keep a no-break space (10 km).
 * The kicker's range is dotted, because it carries a year (2026.11.12 → 11.19 UTC), and built by hand: Intl writes
 * "2026. 11. 12." with spaces and formatRange joins with ~, while the product's mono spans use →.
 */
import type en from '../en/landing'
import { fmt } from '../../../api/_lib/i18n/format'
import { accent, type Rich } from '../../../api/_lib/i18n/parts'

const f = fmt('ko')

/** An instant's UTC day, dotted and unpadded: "2026.11.12", or "11.19" without the year. */
const utcDay = (d: Date, year: boolean) => `${year ? `${d.getUTCFullYear()}.` : ''}${d.getUTCMonth() + 1}.${d.getUTCDate()}`

/** The one way out when locating fails: the search, which always works. */
const SEARCH_INSTEAD = '대신 장소를 검색하면 된다.'

const landing: typeof en = {
  // ── Hero ──
  lastDays: (days: number) => `최근 ${f.int(days)}일`,
  /** "2026.11.12 → 11.19 UTC", "2026.10.29 → 11.5 UTC", "2026.12.29 → 2027.1.5 UTC": the end repeats the year only when it changes. */
  windowRange: (startMs: number, endMs: number) => {
    const a = new Date(startMs)
    const b = new Date(endMs)
    return `${utcDay(a, true)} → ${utcDay(b, a.getUTCFullYear() !== b.getUTCFullYear())} UTC`
  },
  /** Two long lines and a short third, each whole 어절; nothing breaks inside a word. */
  hero: [['지난 일주일,'], ['무언가 ', accent('당신'), '을'], ['지켜봤다.']] as Rich[],
  /** One piece: the day count is plain text attached to its counter (7일), so the two never part. */
  sub: (days: number): Rich => [
    `지구 어디든 입력하면, 최근 ${f.int(days)}일 동안 그 상공을 지나간 모든 위성과 실제로 찍힌 이미지가 보인다.`,
  ],
  builtBy: (handle: string) => `만든 사람 ${handle}`,
  sourceLink: '오픈 소스',
  sourceLinkLabel: '오픈 소스: GitHub의 코드',

  // ── The place search ──
  searchPlaceholder: '장소 검색',
  placeLabel: '장소',
  searching: '검색 중',
  searchUnavailable: '검색 불가',
  /** One form for every count (ko has only `other`); 건 is the counter for search results. */
  matches: (n: number) => `${f.int(n)}건`,
  noMatch: '결과 없음',
  /** "위도, 경도" keeps the ASCII comma: it is the syntax the field parses (43.47, −80.54). */
  searchHint: '이름, 주소 또는 위도, 경도',
  clearSearch: '검색어 지우기',
  go: '이 장소 상공을 지나간 위성 보기',
  searchDown: '장소 검색이 응답하지 않는다. 43.47, −80.54 같은 좌표는 그대로 쓸 수 있다.',
  /** The query is quoted in “ ” and followed by a noun (검색 결과), so no particle has to agree with it. */
  nothingMatches: (query: string) => `“${query}” 검색 결과가 없다. 도시, 랜드마크, 좌표로 찾을 수 있다.`,
  suggestions: '장소 목록',

  // ── Use my location ──
  useMyLocation: '내 위치 사용',
  locateMe: '내 위치 찾기',
  nearMe: '내 위치',
  locating: '찾는 중…',
  cancelSearch: '취소',
  cancelLocate: '취소',
  cancelLocating: '위치 찾기 취소',
  requestingPosition: '위치 요청 중',
  namingPlace: '장소 이름 찾는 중',
  /** "05초": two digits, padded, so the live counter never changes width. */
  elapsed: (seconds: number) => `${seconds.toFixed(0).padStart(2, '0')}초`,
  /** Who acts is the content here, so the sentence is passive (전송된다, 저장되는 것은) rather than a "we". */
  locatingNote: '장소 이름을 찾기 위해 현재 위치가 Photon 주소 검색 서비스로 전송된다. 저장되는 것은 약 10 km 크기의 구역뿐이다.',
  locationLabel: '위치',
  dismiss: '닫기',
  locateErrors: {
    denied: '위치 접근이 차단돼 있다. 브라우저 설정에서 허용하거나 장소를 검색하면 된다.',
    unavailable: `지금은 위치를 알 수 없다. ${SEARCH_INSTEAD}`,
    timeout: '위치를 찾는 데 너무 오래 걸렸다. 다시 시도하거나 장소를 검색하면 된다.',
    unsupported: `이 브라우저는 위치를 공유할 수 없다. ${SEARCH_INSTEAD}`,
    insecure: `위치를 쓰려면 보안(https) 연결이 필요하다. ${SEARCH_INSTEAD}`,
    other: `지금은 위치를 알 수 없다. ${SEARCH_INSTEAD}`,
  },

  // ── Examples ──
  orTry: '이런 곳도',
  pinHint: '또는 지구본을 클릭해 핀 꽂기',
  examplesLabel: '예시 장소',
  dropPin: '핀 꽂기',
  /** Both parts are the curated places' Korean copy; with no sublabel the name stands alone (no dangling comma). */
  chipName: (label: string, sublabel: string) => (sublabel ? `${label}, ${sublabel}` : label),
  surprise: '아무 곳이나',
  surpriseName: '아무 곳이나: 무작위로 고른 유명한 장소',
}
export default landing
