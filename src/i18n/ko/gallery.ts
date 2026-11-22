/**
 * Korean copy for the photo gallery and its photo frames (see docs/i18n/ko.md §3.7 "gallery", §4).
 *
 * Why the words are these: the gallery holds daily composites and radar images beside the photos, so what it shows is
 * 이미지, never 사진 (and never 영상, which most readers hear as "video"), counted with 장; a position reads total first,
 * as Korean does (이미지 27장 중 3번째). "Closest look" is the most detailed clear image, 가장 자세한 모습 (최근접 is a
 * moment of the pass). A daily mosaic is 일일 합성: 모자이크 means blurring and censorship to Korean readers. "Your spot"
 * is 이 지점 or 지점, never 당신의. A name never takes a varying particle: the alt text says [SAT] 위성이 … [PLACE] 일대
 * (§5.1). Mono labels are nouns with no ending (포착 중, 이미지를 받지 못함); Hangul has no case, so CSS uppercases only
 * the Latin. Tooltips name their keys in attached parentheses, 크게 보기(F).
 */
import type en from '../en/gallery'
import type { CoverLead } from '../en/gallery'
import { fmt } from '../../../api/_lib/i18n/format'
import { strong, type Rich } from '../../../api/_lib/i18n/parts'

const f = fmt('ko')
const pct = (n: number) => `${f.int(n)}%`

const LEAD: Record<CoverLead, string> = {
  closest: '가장 자세한 모습',
  lastClear: '마지막 맑은 모습',
  clouded: '구름에 가림',
}

/** ": Sentinel-2C, 11월 1일(일) 16:14": the satellite and its moment after an accessible name's action */
const which = (sat: string, day: string, time: string) => `: ${sat}, ${day} ${time}`

const gallery: typeof en = {
  // ── the bar over the photos ──────────────────────────────────────────────────────────────
  barLabel: '이미지',
  filterLabel: '표시할 이미지',
  filter: { all: '전체', detailed: '상세', weather: '기상', radar: '레이더' },
  filterTitle: {
    all: '모든 이미지. 가장 자세한 모습 다음은 최신순',
    detailed: 'Sentinel-2와 Landsat, 픽셀당 10~30 m',
    weather: '일일 기상 합성 이미지, 픽셀당 250 m 이상',
    radar: 'Sentinel-1 레이더 이미지, 픽셀당 20 m. 구름을 뚫고, 밤낮없이',
  },
  /** 지난 일주일 / 그 일주일: a rolling week, never 이번 주 (the calendar week) */
  photosThisWeek: (n: number) => `지난 일주일 ${f.int(n)}장`,
  photosThatWeek: (n: number) => `그 일주일 ${f.int(n)}장`,
  prevPhoto: '이전 이미지',
  prevTitle: '이전(←)',
  nextPhoto: '다음 이미지',
  nextTitle: '다음(→)',
  carousel: '캐러셀',
  trackLabel: '이 장소의 이미지. 밀어서 더 보기',

  // ── a slide ──────────────────────────────────────────────────────────────────────────────
  slide: '슬라이드',
  lead: LEAD,
  slideLabel: (lead: CoverLead | undefined, sat: string, day: string, time: string, photo?: { k: number; n: number }) =>
    `${lead ? `${LEAD[lead]}: ` : ''}${sat}, ${day} ${time}${photo ? `, 이미지 ${f.int(photo.n)}장 중 ${f.int(photo.k)}번째` : ''}`,
  replayLabel: (sat: string, day: string, time: string) => `지구본에서 이 통과 다시 보기${which(sat, day, time)}`,
  /** Phones and laptops read 다시 보기, portrait tablets 이 통과 다시 보기: Korean drops the object at the front */
  replay: [strong('이 통과 '), '다시 보기'] as Rich,
  viewLabel: {
    lastClear: (sat: string, day: string, time: string) => `마지막 맑은 모습 크게 보기${which(sat, day, time)}`,
    photo: (sat: string, day: string, time: string) => `이미지 크게 보기${which(sat, day, time)}`,
  },
  view: '보기',
  sharePass: '이 통과 공유',
  radarTag: '레이더',
  noteMostlyCloud: '지난 일주일의 통과는 대부분 구름만 봤다',
  /** A sentence, not the chip's label: the chip on the same picture already says 마지막 맑은 모습 */
  noteLastClear: '이것이 마지막 맑은 모습이다',
  clouded: {
    pct: (p: number) => `구름에 가림 · ${pct(p)}`,
    coverAtSpot: '구름에 가림 · 이 지점도 구름',
    atSpot: '이 지점 구름',
  },
  status: {
    cloudedPct: (p: number) => `구름 · ${pct(p)}`,
    cloudAtSpot: '지점 구름',
    clear: '맑음',
    cirrus: '얇은 권운',
    shadow: '구름 그림자',
    cloudPct: (p: number) => `구름 ${pct(p)}`,
    mosaic: '일일 합성',
  },
  cropKm: (km: number) => `${km >= 100 ? f.int(km) : f.dec(km, 1)} km`,

  // ── a photo frame ────────────────────────────────────────────────────────────────────────
  /** [SAT] 위성이 and [PLACE] 일대: buffers, so no particle follows a name */
  photoAlt: (sat: string, place: string) => `${sat} 위성이 찍은 ${place} 일대 이미지. 가운데가 이 장소다.`,
  /** 포착: the mono readout's word for "acquiring", never in a sentence */
  acquiring: '포착 중',
  noImage: '이미지를 받지 못함',
  retry: '다시 시도',
  scaleKm: (km: number) => `${km >= 1 ? f.int(km) : f.dec(km, 1)} km`,
  /** The cartographic N, kept */
  north: 'N',
  expandLabel: '이미지 크게 보기',
  expandTitle: '크게 보기(F)',

  // ── a photo developing (the pushbroom reveal) ────────────────────────────────────────────
  stillRendering: '아직 렌더링 중. 큰 장면은 10초 넘게 걸릴 수 있다.',
  /** 부분: the crop, as prose calls it */
  cropMissing: '아카이브가 이 부분을 보내지 않았다. 바쁜 것일 수 있다. 이미지 자체는 그대로 있다.',
  /** 라인, not 스캔 선: that word is the geostationary scan's */
  scanLine: (line: string, lines: string): Rich => ['라인 ', strong(line), ` → ${lines}`],
  awaiting: { pass: '통과 대기', scan: '스캔 대기' },
}

export default gallery
