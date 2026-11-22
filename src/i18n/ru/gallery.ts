/**
 * Russian copy for the photo gallery and the photo frames it shows (see docs/i18n/ru.md §3.8, §4.1, §7, Appendix A):
 * the bar, each slide's buttons and chips, what a picture shows at the place, and a frame's waiting and error states.
 *
 * Why these words: the gallery holds photos, daily mosaics and radar images alike, so every picture is a «снимок» and
 * a cover's reason is a «кадр» («Самый близкий кадр», «Последний ясный кадр»; never «ближайший», which reads "the next
 * one" beside ‹ ›). Chips and statuses are mono caps in measured boxes (the four filter segments together as long as
 * English's, ≤ 14 characters a status, ≤ 12 the counter), so they are nouns, never verbs. The counter on the last clear
 * look says «12 за неделю» for this week and an older one alike: the box has no room for «эту / ту». The capture words
 * are nouns («Приём», a downlink's word, and «Строка»), never «зафиксировано» (§8). Names, days and clocks arrive as
 * they are and sit after a colon or a comma, where no case is needed.
 */
import type en from '../en/gallery'
import type { CoverLead } from '../en/gallery'
import { fmt } from '../../../api/_lib/i18n/format'
import { strong, type Rich } from '../../../api/_lib/i18n/parts'

const f = fmt('ru')
const pct = (n: number) => `${f.int(n)}%`
/** A whole count, or a fraction kept (its plural form is `other`) */
const count = (n: number) => (Number.isInteger(n) ? f.int(n) : f.dec(n, 1))

const LEAD: Record<CoverLead, string> = {
  closest: 'Самый близкий кадр',
  lastClear: 'Последний ясный кадр',
  clouded: 'Под облаками',
}

/** «Sentinel-2C, вс, 1 нояб., 16:14»: the day already holds a comma, so the clock gets one too */
const who = (sat: string, day: string, time: string) => `${sat}, ${day}, ${time}`

const gallery: typeof en = {
  // ── the bar over the photos ──────────────────────────────────────────────────────────────
  barLabel: 'Снимки',
  filterLabel: 'Показать снимки',
  filter: { all: 'Все', detailed: 'Детальные', weather: 'Погода', radar: 'Радар' },
  filterTitle: {
    all: 'Все снимки: сначала самый близкий кадр, затем самые новые',
    detailed: 'Sentinel-2 и Landsat, 10–30\u00a0м на пиксель',
    weather: 'Суточные мозаики: от 250\u00a0м на пиксель',
    radar: 'Радарные снимки Sentinel-1, 20\u00a0м на пиксель: сквозь облака, днём и ночью',
  },
  photosThisWeek: (n: number) => `${count(n)} за неделю`,
  photosThatWeek: (n: number) => `${count(n)} за неделю`,
  prevPhoto: 'Предыдущий снимок',
  prevTitle: 'Предыдущий (←)',
  nextPhoto: 'Следующий снимок',
  nextTitle: 'Следующий (→)',
  carousel: 'карусель',
  trackLabel: 'Снимки этого места. Листай, чтобы увидеть больше',

  // ── a slide ──────────────────────────────────────────────────────────────────────────────
  slide: 'слайд',
  lead: LEAD,
  slideLabel: (lead: CoverLead | undefined, sat: string, day: string, time: string, photo?: { k: number; n: number }) =>
    `${lead ? `${LEAD[lead]}: ` : ''}${who(sat, day, time)}${photo ? `, снимок ${f.int(photo.k)} из ${f.int(photo.n)}` : ''}`,
  replayLabel: (sat: string, day: string, time: string) => `Воспроизвести пролёт на глобусе: ${who(sat, day, time)}`,
  // Phones and laptops read «Повтор», portrait tablets «Повтор пролёта» (the glossary's short and long forms).
  replay: ['Повтор', strong(' пролёта')] as Rich,
  viewLabel: {
    lastClear: (sat: string, day: string, time: string) => `Открыть последний ясный кадр крупно: ${who(sat, day, time)}`,
    photo: (sat: string, day: string, time: string) => `Открыть снимок крупно: ${who(sat, day, time)}`,
  },
  view: 'Открыть',
  sharePass: 'Поделиться пролётом',
  radarTag: 'Радар',
  // 32 characters: one line on every screen, as the English; «На этой неделе на снимках в основном облака» (43) took
  // two lines on phones and in landscape and left «облака» alone on the second.
  noteMostlyCloud: 'Снимки недели: в основном облака',
  noteLastClear: 'Вот последний ясный кадр',
  clouded: {
    pct: (p: number) => `Под облаками · ${pct(p)}`,
    coverAtSpot: 'Под облаками, включая твою точку',
    atSpot: 'Облака над твоей точкой',
  },
  status: {
    cloudedPct: (p: number) => `Облачно · ${pct(p)}`,
    cloudAtSpot: 'Облака в точке',
    clear: 'Ясно',
    cirrus: 'Тонкие облака',
    shadow: 'Тень облаков',
    cloudPct: (p: number) => `Облака ${pct(p)}`,
    mosaic: 'Суточная мозаика',
  },
  cropKm: (km: number) => `${km >= 100 ? f.int(km) : f.dec(km, 1)}\u00a0км`,

  // ── a photo frame ────────────────────────────────────────────────────────────────────────
  // The satellite after its head noun (the case falls on «спутника»), the place alone after a colon.
  photoAlt: (sat: string, place: string) => `Снимок со спутника ${sat}: ${place}. Это место в центре кадра.`,
  acquiring: 'Приём',
  noImage: 'Снимок не пришёл',
  retry: 'Повторить',
  scaleKm: (km: number) => `${km >= 1 ? f.int(km) : f.dec(km, 1)}\u00a0км`,
  // The cartographic N, as on every readout's compass point (§4.2).
  north: 'N',
  expandLabel: 'Развернуть снимок',
  expandTitle: 'Развернуть (F)',

  // ── a photo developing (the pushbroom reveal) ────────────────────────────────────────────
  stillRendering: 'Ещё готовится. На большой кадр может уйти 10\u00a0с и больше.',
  cropMissing: 'Архив не прислал этот фрагмент, возможно, из-за нагрузки. Сам снимок существует.',
  scanLine: (line: string, lines: string): Rich => ['Строка ', strong(line), ` → ${lines}`],
  awaiting: { pass: 'Ожидание пролёта', scan: 'Ожидание сканирования' },
}
export default gallery
