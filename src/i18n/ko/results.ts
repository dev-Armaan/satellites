/**
 * Korean copy for the results panel (see docs/i18n/ko.md §3.3 for the headline and its second line, §3.5 for the
 * verdicts, §3.7 "results" for the rest).
 *
 * Why the words are these: the headline is the product's finding in Korean's unmarked order, subject, object, verb:
 * 최근 7일 동안, **위성 256기가** *Waterloo* 일대를 지켜봤다. The bold run is the count phrase, its counter 기 written as
 * plain text right after the number part (a num() unit would print 위성 256 기가, small and grey); the accent covers the
 * place name only. 일대 ("the area around") is the buffer that fixes the object particle, because 을/를 cannot be chosen
 * for a Latin name by code, and it is honest: a satellite sees an area. Every runtime name takes a buffer or an invariant
 * particle (일대를, 상공의, 위성이, [PLACE]에, [PLACE]의), never 이/가, 은/는, 을/를 directly. The second line rhymes with
 * the headline (지켜봤다. / 공개됐다.) and keeps its particle before the separable 최소 ("at least"), so the count
 * settles in place. ko has one plural category: every count is one string, 1 included, and where English has a sentence
 * for none, Korean has its own (… 지켜보지 않았다., … 공개된 이미지는 없다.), never 위성 0기 in a sentence; "once" in
 * prose is the word 한 번 (1번 also reads "No. 1"). Counters: 기 satellites, 장 images, 회 passes, 번 times, 개 rows and
 * scenes. The rolling week is 지난 일주일 / 그 일주일 (이번 주 is the calendar week); numeric windows are 최근 [N]일.
 * Register is 한다체 everywhere, buttons and labels are nouns, status lines end in 중 or 됨. 당신 appears only in the
 * invite bar (the sanctioned 당신도 echo of the hero). Dates come from the ko 'time' namespace (11월 1일(일), 10월 29일,
 * 11월 1일 → 8일), so this panel and the pass list agree to the letter; lists of names are joined with a comma and 외,
 * never Intl's 및.
 */
import type en from '../en/results'
import type { PlaceWhen, UtcWhen, WindowWhen } from '../en/results'
import type { Pass, SatCategory } from '@/types'
import { localParts, type DateFields } from '@/ui/results/lib/time'
import { fmt } from '../../../api/_lib/i18n/format'
import { accent, num, strong, type Part, type Rich } from '../../../api/_lib/i18n/parts'
import koTime from './time'

const f = fmt('ko')
type Verdict = Pass['verdict']

/** "10월 29일" / "11월 1일(일)" at a zone: the ko 'time' forms, from the instant */
const dayMonth = (ms: number, timeZone: string) => koTime.dayMonth(ms, timeZone, localParts(ms, timeZone))
const day = (ms: number, timeZone: string) => koTime.day(ms, timeZone, localParts(ms, timeZone))

/** An unnamed satellite in a sentence: 이름 미상 fills the [SAT] slot, so the frame stays whole (이름 미상 위성이) */
const named = (sat: string | undefined) => sat ?? '이름 미상'

/** "N times" in prose: 한 번 for 1 (1번 reads "No. 1"), else the number part and 번 */
const times = (n: number, after: string): Part[] => (n === 1 ? [`한 번${after}`] : [num(f.int(n)), `번${after}`])
/** …the same as plain text */
const timesText = (n: number) => (n === 1 ? '한 번' : `${f.int(n)}번`)

/** "관측 위성과 유인 위성 250기의 통과 1,234회를 확인했다." */
const checkedKo = (passes: number, sats: number) => `관측 위성과 유인 위성 ${f.int(sats)}기의 통과 ${f.int(passes)}회를 확인했다.`

/** A pass's mark in the timeline's tooltip, by the satellite's category: its kind and the mark's shape */
const MARK_KIND: Partial<Record<SatCategory, string>> = {
  'open-optical': '공개 관측 위성 · ◇',
  'commercial-optical': '상업 · □',
  radar: '레이더 · ▣',
  'weather-leo': '기상 · ○',
  crewed: '유인 · ✛',
}

const VERDICT_ORDER = ['imaged', 'likely', 'could', 'overhead'] as const

const results: typeof en = {
  // ── the headline ─────────────────────────────────────────────────────────────────────────
  headline: {
    /**
     * "최근 7일 동안, **위성 256기가** *Waterloo* 일대를 지켜봤다." / an older window: "10월 29일부터 11월 5일까지,
     * **위성 12기가** *Waterloo* 일대를 지켜봤다." The comma after the window phrase is required
     */
    watched: (n: number, place: string, when: WindowWhen): Rich => [
      'lastDays' in when
        ? `최근 ${f.int(when.lastDays)}일 동안, `
        : `${dayMonth(when.fromMs, when.timeZone)}부터 ${dayMonth(when.toMs, when.timeZone)}까지, `,
      strong('위성 ', num(f.int(n)), '기가'),
      ' ',
      accent(place),
      ' 일대를 지켜봤다.',
    ],
    /** "지난 일주일 동안, 추적 중인 어떤 위성도 *Waterloo* 일대를 지켜보지 않았다." ("we track" without 우리; no bold run) */
    none: (place: string, past: boolean): Rich => [
      `${past ? '그' : '지난'} 일주일 동안, 추적 중인 어떤 위성도 `,
      accent(place),
      ' 일대를 지켜보지 않았다.',
    ],
  },

  // ── the second line ──────────────────────────────────────────────────────────────────────
  /**
   * "이미지가 31장 공개됐다." / "이미지가 최소 31장 공개됐다.": the strong part is 최소, right before the number, so the
   * particle never moves when it goes. One form for every count, 1 included
   */
  imagesPublic: (k: number): Rich => ['이미지가 ', strong('최소 '), num(f.int(k)), '장 공개됐다.'],
  noImages: { thisWeek: '지난 일주일 동안 공개된 이미지는 없다.', thatWeek: '그 일주일 동안 공개된 이미지는 없다.' },
  archiveDown: '이미지 아카이브가 응답하지 않아, 지금은 공개 이미지를 셀 수 없다.',
  tryAgain: '다시 시도',
  share: '공유',
  /** "Waterloo의 지난 일주일 공유" (의 is invariant after a name) */
  shareWeekLabel: (place: string, past: boolean) => `${place}의 ${past ? '그' : '지난'} 일주일 공유`,

  why: {
    sunNeverRose: '해가 한 번도 뜨지 않아, 낮에만 찍는 카메라로는 이곳을 볼 수 없었다.',
    sunBarelyRose: '해가 거의 뜨지 않아, 낮에만 찍는 카메라로는 이곳을 볼 수 없었다.',
    /** "그래도 기상위성은 적외선으로 이곳을 42번 훑었다." (1: 한 번, a word, not a mono number) */
    infrared: (n: number): Rich => ['그래도 기상위성은 적외선으로 이곳을 ', ...times(n, ' 훑었다.')],
    /**
     * "레이더에는 빛이 필요 없다. Umbra-08, Capella-14 외 레이더 위성 7기가 이곳이 보이는 범위를 1,204번 지나갔다."
     * Names are joined with a comma and 외 adds the rest (never 와/과 after a name, never Intl's 및); with no others the
     * names take the buffer 위성이 (Umbra-08, Capella-14 위성이 …)
     */
    radar: (names: readonly string[], others: number, passes: number): Rich => {
      const list = names.join(', ')
      const rest = `레이더 위성 ${f.int(others)}기가`
      const who = others > 0 ? (list ? `${list} 외 ${rest}` : rest) : list ? `${list} 위성이` : '레이더 위성이'
      return [`레이더에는 빛이 필요 없다. ${who} 이곳이 보이는 범위를 `, ...times(passes, ' 지나갔다.')]
    },
    /** "Sentinel-2나 Landsat 위성이 낮에 이곳 상공을 3번 지나갔지만, 아직 공개된 장면이 없다." (1: 한 번) */
    unpublished: (n: number) => `Sentinel-2나 Landsat 위성이 낮에 이곳 상공을 ${timesText(n)} 지나갔지만, 아직 공개된 장면이 없다.`,
    none: '이미지를 공개하는 관측 위성은 낮에 이곳 상공을 지나가지 않았다.',
  },

  // ── the summary's four readouts ──────────────────────────────────────────────────────────
  verdictGroup: '분류별 통과. 누르면 해당 목록으로 이동한다.',
  /** "31회: 지켜봤다" (every verdict counts passes with 회; the counter attached) */
  verdictReadout: (n: number, _verdict: Verdict, title: string) => `${f.int(n)}회: ${title}`,

  // ── the footnotes ────────────────────────────────────────────────────────────────────────
  notes: {
    /**
     * "상세 이미지 **29**장(Sentinel-2, Landsat, 10~30 m) · 일일 기상 합성 이미지 **12**장(250~375 m) · …. 관측 위성과
     * 유인 위성 250기의 통과 1,234회를 확인했다." Noun first, the strong part is the number alone with 장 after it as
     * text; prose ranges take ~ and parentheses attach to the word before
     */
    counted: (o: { detailed: number; mosaics: number; radar: number; geo: number; passes: number; satellites: number }): Rich => {
      const out: Part[] = ['상세 이미지 ', strong(f.int(o.detailed)), '장(Sentinel-2, Landsat, 10~30 m)']
      if (o.mosaics) out.push(' · 일일 기상 합성 이미지 ', strong(f.int(o.mosaics)), '장(250~375 m)')
      if (o.radar) out.push(' · 레이더 이미지 ', strong(f.int(o.radar)), '장(Sentinel-1, 20 m)')
      if (o.geo) out.push(' · 정지궤도 기상위성의 지구 전면 이미지 ', strong(f.int(o.geo)), '장(2~5 km, 위성마다 가장 최신 이미지를 보여 준다)')
      out.push(`. ${checkedKo(o.passes, o.satellites)}`)
      return out
    },
    checked: (passes: number, satellites: number) => checkedKo(passes, satellites),
    /**
     * "통과 시각은 각 위성이 Waterloo에 가장 가까웠던 때로, 공개 궤도 요소로 계산했다(받은 시각 2026-11-08 03:31Z).
     * 현지 시각은 America/Toronto 기준이다."
     */
    passTimes: (place: string, fetched: string | undefined, zoneLabel: string) =>
      `통과 시각은 각 위성이 ${place}에 가장 가까웠던 때로, 공개 궤도 요소로 계산했다${fetched ? `(받은 시각 ${fetched})` : ''}. ` +
      `현지 시각은 ${zoneLabel} 기준이다.`,
  },

  // ── the panel ────────────────────────────────────────────────────────────────────────────
  sheetLabel: (place: string) => `${place} 상공의 위성`,
  computingPasses: '통과 계산 중',
  sections: { summary: '요약', passes: '통과', watchedContinuously: '늘 지켜보는 위성' },
  checkingArchives: '아카이브 확인 중',
  invite: {
    /** One of the sanctioned 당신 lines: the hero's echo, 당신도 */
    text: '지난 일주일, 무언가 당신도 지켜봤다.',
    /** "your place" is 내 장소 (the first-person control), never 당신의 */
    checkPlace: '내 장소 찾기',
    dismiss: '닫기',
  },
  searchAnother: '다른 장소 검색',
  allPasses: '모든 통과',

  footer: {
    replay: '다시 보기',
    replayLabel: '이 통과 다시 보기',
    replayTitle: '지구본에서 이 통과 다시 보기',
    shareLabel: { pass: '이 통과 공유', image: '이 이미지 공유' },
    /** Korean drops the object at the front: narrow phones show 공유 alone */
    shareButton: { pass: [strong('이 통과 '), '공유'] as Rich, image: [strong('이 이미지 '), '공유'] as Rich },
    /** …and the verb at the end: narrow phones show 내 장소 */
    checkPlace: ['내 장소', strong(' 찾기')] as Rich,
    clearest: ['가장 맑은 모습', strong(' 보기')] as Rich,
    clearestLabel: '가장 맑은 모습 보기',
  },

  // ── the headers ──────────────────────────────────────────────────────────────────────────
  head: {
    /** "7일 · 11월 1일 → 8일" */
    windowSpan: (days: number, startMs: number, endMs: number, timeZone: string) =>
      `${f.int(days)}일 · ${koTime.dayRange(startMs, endMs, timeZone, localParts(startMs, timeZone), localParts(endMs, timeZone))}`,
    verifying: '기상 합성 이미지 확인 중',
    cancel: '취소',
    newSearch: '새 검색',
    close: '닫기',
    escKey: 'Esc',
    searchBarLabel: (place: string) => `다른 장소 검색(현재 ${place})`,
    change: '변경',
    computing: '계산 중',
    recent: '최근 검색',
    /** "이 분류의 통과 12회 중 3번째": the total first */
    position: (k: number, n: number) => `이 분류의 통과 ${f.int(n)}회 중 ${f.int(k)}번째`,
    previous: '이 분류의 이전 통과',
    next: '이 분류의 다음 통과',
    previousTitle: '이전(←)',
    nextTitle: '다음(→)',
    allPassesTitle: '모든 통과(Esc)',
    /** "공유받음 · Sentinel-2C 위성이 Waterloo 일대를 지켜봤다" (the headline's frame, with its buffers) */
    shared: (sat: string, place: string) => `공유받음 · ${sat} 위성이 ${place} 일대를 지켜봤다`,
    /** "11월 1일(일) · 16:14:21 EST", as the pass list's stamp writes it; ≈ stays in mono */
    passWhen: (ms: number, timeZone: string, p: DateFields, time: string, zone: string, approx: boolean) =>
      `${koTime.day(ms, timeZone, p)} · ${approx ? '≈ ' : ''}${time} ${zone}`,
  },

  // ── the computing readout ────────────────────────────────────────────────────────────────
  computing: {
    /** Labels are nouns; a finished step is noun + 됨 */
    stages: {
      catalog: { idle: '궤도 카탈로그', done: '카탈로그 준비됨' },
      propagate: { idle: (days: number) => `궤도 계산 · ${f.int(days)}일`, done: '궤도 계산됨' },
      archive: { idle: 'Sentinel-2 + Landsat 아카이브', done: '아카이브 검색됨' },
      match: { idle: '장면과 통과 대조', done: '장면 대조됨' },
    },
    ready: '보고서 준비됨',
    ok: 'OK',
    /** "1.84초": the counter attached, as every Korean duration is */
    seconds: (s: number) => `${f.dec(s, 2)}초`,
    /** "**7일 · **11월 1일 05:47 → 11월 8일 05:47 UTC" (the strong part hides on phones; the rest reads alone; 기간 would cut the end on laptops) */
    window: (days: number, from: UtcWhen, to: UtcWhen): Rich => [
      strong(`${f.int(days)}일 · `),
      `${dayMonth(from.ms, 'UTC')} ${from.time} → ${dayMonth(to.ms, 'UTC')} ${to.time} UTC`,
    ],
    percent: (pct: number) => `${f.int(pct)}%`,
    slow: 'Planetary Computer와 NASA는 요청이 올 때마다 이미지를 렌더링한다. 이 단계는 몇 초 걸릴 수 있다.',
    /** "we'll say so" without 우리: the report says so */
    verySlow: '이미지 아카이브의 응답이 느리다. 끝내 응답하지 않으면 통과는 궤도 계산만으로 보여 주고, 그렇다고 밝힌다.',
    /**
     * "Sentinel-2C 위성이 찍은 Waterloo 일대 이미지. 공유받은 이미지다." (no name: 이름 미상 위성이 찍은 …). The same
     * frame as the gallery's photoAlt ("[SAT] image of [PLACE]" in both Englishes, "who took it"), so a picture is
     * described one way whether it was shared or found
     */
    sharedAlt: (sat: string | undefined, place: string) => `${named(sat)} 위성이 찍은 ${place} 일대 이미지. 공유받은 이미지다.`,
    /** "**공유받음** · Sentinel-2C 위성이 Waterloo 일대를 지켜봤다 · 11월 1일(일), 16:14" */
    sharedCaption: (sat: string | undefined, place: string, when?: PlaceWhen): Rich => [
      strong('공유받음'),
      ` · ${named(sat)} 위성이 ${place} 일대를 지켜봤다${when ? ` · ${day(when.ms, when.timeZone)}, ${when.time}` : ''}`,
    ],
  },

  // ── 03 / geostationary weather satellites ────────────────────────────────────────────────
  geo: {
    none: '운용 중인 정지궤도 기상위성 중 이곳을 고도각 5° 이상에서 보는 것은 없다.',
    /** "0.0°E · 고도각 38.2° · 10분마다" (고도각: 고도 alone is the orbit's height) */
    facts: (lon: string, elevationDeg: number, cadenceMin: number) => `${lon} · 고도각 ${f.dec(elevationDeg, 1)}° · ${f.int(cadenceMin)}분마다`,
    /** "지난 일주일 이미지 **1,008**장" / "최근 3일 이미지 **432**장": the num() is the count, 장 after it as text */
    images: (n: number, days: number): Rich =>
      days === 7 ? ['지난 일주일 이미지 ', num(f.int(n)), '장'] : [`최근 ${f.int(days)}일 이미지 `, num(f.int(n)), '장'],
    replay: '다시 보기',
    replayLabel: (sat: string) => `${sat}: 최신 이미지 다시 보기`,
    /** Status words in a 64 px square: noun endings, no particles to spare */
    frame: {
      probing: '찾는 중…',
      noPublic: '공개 이미지 없음',
      poorQuality: '품질 낮음',
      noneNow: '지금은 이미지 없음',
      unavailable: '불러오지 못함',
    },
    frameAlt: (sat: string, infrared: boolean) => `${sat}: 이 장소 주변의 최신 ${infrared ? '적외선 ' : ''}프레임`,
    /** 적외, the chip's two syllables (IR is a clipping Korean readers do not use) */
    infraredChip: '적외',
    infraredTitle: '적외선: 구름 꼭대기를 온도로 나타낸다. 차가울수록 밝다.',
  },

  // ── 04 / timeline ────────────────────────────────────────────────────────────────────────
  timeline: {
    title: '타임라인',
    meta: (days: number, zoneLabel: string, zones?: string) => `${f.int(days)}일 · ${zoneLabel}${zones ? ` · ${zones}` : ''}`,
    zoneChange: (before: string, after: string) => `${before} → ${after}`,
    daylight: '이곳의 낮',
    /**
     * "타임라인, 7일: 지켜봤다 31회, 아마 지켜봤다 4회, 여기를 볼 수도 있었다 120회, 상공을 지나갔다 12회." A verdict
     * title is a whole predicate in Korean (지켜봤다), so it cannot follow a bare count as a noun: each title comes first,
     * then its count with 회
     */
    summary: (days: number, counts: Record<Verdict, number>, titles: Readonly<Record<Verdict, string>>) =>
      `타임라인, ${f.int(days)}일: ` + VERDICT_ORDER.map((v) => `${titles[v]} ${f.int(counts[v])}회`).join(', ') + '.',
    keysHint: (summary: string) => `${summary} 왼쪽, 오른쪽 화살표 키로 통과를 하나씩 넘길 수 있다.`,
    /** "정지궤도 · 3": the strong part hides up to 1180 px */
    geoLane: (n: number): Rich => [strong('정지궤도 · '), f.int(n)],
    geoNames: (names: readonly string[]) => names.join(', '),
    now: '지금',
    /** "기울기 5.4° · 61 km" */
    geometry: (deg: number, km: number) => `기울기 ${f.dec(deg, 1)}° · ${f.int(km)} km`,
    markMosaic: (gsdM: number) => `일일 합성 이미지, ${f.int(gsdM)} m · ●`,
    markRadar: (gsdM: number) => `레이더 이미지, ${f.int(gsdM)} m · ◆`,
    markImaged: (title: string) => `${title} · ◆`,
    markKind: (title: string, category: SatCategory) => `${title} · ${MARK_KIND[category] ?? '기타'}`,
  },

  // ── 02 / replay ──────────────────────────────────────────────────────────────────────────
  replay: {
    scrubLabel: '통과 안의 장면 시각',
    scrubValue: (tMinus: string, utc: string) => `${tMinus}, ${utc}`,
    /** 다시 보기 is the replay; the act of playing is 재생 */
    play: '다시 보기 재생',
    pause: '다시 보기 일시정지',
    speed: '재생 속도',
    /** "시야 안 4분 12초" */
    inView: (duration: string) => `시야 안 ${duration}`,
    closest: '최근접',
    spaceKey: '스페이스',
    playPause: '재생 / 일시정지',
    stepKind: '이 분류의 이전 / 다음 통과',
  },

  // ── the plan view ────────────────────────────────────────────────────────────────────────
  plan: {
    label: (sat: string, km: number) => `평면도: ${sat} 위성의 지상 궤적. 최근접 시점에 이 장소에서 ${f.int(km)} km.`,
    northUp: '평면도 · 북쪽 위',
    fieldOfRegard: (deg: number) => `지향 범위 ±${deg}°`,
    swath: (km: number) => `관측 폭 ${f.int(km)} km`,
    groundTrack: '지상 궤적',
    scale: (km: number) => `${km >= 1 ? f.int(km) : f.dec(km, 1)} km`,
    closest: (km: number) => `최근접 ${km < 1 ? '< 1' : f.int(km)} km`,
  },

  // ── a picture's product line ─────────────────────────────────────────────────────────────
  /** 합성 and 지구 전면: never 모자이크 (censorship blurring) or 전구 (also "light bulb") */
  product: {
    mosaic: (m: number) => `일일 합성 · ${m} m`,
    fullDisc: (km: number) => `지구 전면 · ${km} km`,
    infrared: (km: number) => `적외선 · ${km} km`,
    sentinel2: (m: number) => `Sentinel-2 L2A · ${m} m`,
    landsat: (m: number) => `Landsat C2 L2 · ${m} m`,
    sentinel1: (m: number) => `Sentinel-1 레이더 · ${m} m`,
    other: (m: number) => `${m} m`,
  },
  pixel: { m: (m: number) => `${m} m`, km: (km: number) => `${km} km` },

  // ── the time-lapse's row ─────────────────────────────────────────────────────────────────
  timelapse: {
    title: '타임랩스',
    sub: '해마다 본 이곳',
  },
}
export default results
