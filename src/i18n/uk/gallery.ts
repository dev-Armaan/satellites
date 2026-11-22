/**
 * Ukrainian copy for the photo gallery and the photo frames it shows (see docs/i18n/uk.md §3.8, §4.1, §7, Appendix A):
 * the bar, each slide's buttons and chips, what a picture shows at the place, and a frame's waiting and error states.
 *
 * Why these words: the gallery holds photos, daily mosaics and radar images alike, so every picture is a «знімок» and
 * a cover's reason is a «кадр» («Кадр зблизька», «Останній ясний кадр»; never «найближчий», which reads "the next one"
 * beside ‹ ›). Chips and statuses are mono caps in measured boxes (≤ 8 characters a filter segment, ≤ 14 a status,
 * ≤ 12 the counter), so they are nouns, never verbs. The counter on the last clear look says «12 за 7 днів» for this
 * week and an older one alike: the box has no room for «цього / того тижня». The globe's capture words are nouns
 * («Зчитування», «Рядок»), never «зафіксовано» (§8). Names, days and clocks arrive as they are and sit after a colon or
 * a comma, where no case is needed.
 */
import type en from '../en/gallery'
import type { CoverLead } from '../en/gallery'
import { fmt } from '../../../api/_lib/i18n/format'
import { strong, type Rich } from '../../../api/_lib/i18n/parts'

const f = fmt('uk')
const pct = (n: number) => `${f.int(n)}%`
/** A whole count, or a fraction kept (its plural form is `other`) */
const count = (n: number) => (Number.isInteger(n) ? f.int(n) : f.dec(n, 1))

const LEAD: Record<CoverLead, string> = {
  closest: 'Кадр зблизька',
  lastClear: 'Останній ясний кадр',
  clouded: 'Під хмарами',
}

/** «Sentinel-2C, нд, 1 лист., 16:14»: the day already holds a comma, so the clock gets one too */
const who = (sat: string, day: string, time: string) => `${sat}, ${day}, ${time}`

const gallery: typeof en = {
  // ── the bar over the photos ──────────────────────────────────────────────────────────────
  barLabel: 'Знімки',
  filterLabel: 'Показати знімки',
  filter: { all: 'Усі', detailed: 'Детальні', weather: 'Погода', radar: 'Радар' },
  filterTitle: {
    all: 'Усі знімки: спершу кадр зблизька, далі найновіші',
    detailed: 'Sentinel-2 та Landsat, 10–30\u00a0м на піксель',
    weather: 'Добові мозаїки: від 250\u00a0м на піксель',
    radar: 'Радарні знімки Sentinel-1, 20\u00a0м на піксель: крізь хмари, удень і вночі',
  },
  photosThisWeek: (n: number) => `${count(n)} за 7\u00a0днів`,
  photosThatWeek: (n: number) => `${count(n)} за 7\u00a0днів`,
  prevPhoto: 'Попередній знімок',
  prevTitle: 'Попередній (←)',
  nextPhoto: 'Наступний знімок',
  nextTitle: 'Наступний (→)',
  carousel: 'карусель',
  trackLabel: 'Знімки цього місця. Гортай, щоб побачити більше',

  // ── a slide ──────────────────────────────────────────────────────────────────────────────
  slide: 'слайд',
  lead: LEAD,
  slideLabel: (lead: CoverLead | undefined, sat: string, day: string, time: string, photo?: { k: number; n: number }) =>
    `${lead ? `${LEAD[lead]}: ` : ''}${who(sat, day, time)}${photo ? `, знімок ${f.int(photo.k)} з ${f.int(photo.n)}` : ''}`,
  replayLabel: (sat: string, day: string, time: string) => `Відтворити проліт на глобусі: ${who(sat, day, time)}`,
  // Phones and laptops read «Повтор», portrait tablets «Повтор прольоту» (the glossary's short and long forms).
  replay: ['Повтор', strong(' прольоту')] as Rich,
  viewLabel: {
    lastClear: (sat: string, day: string, time: string) => `Відкрити останній ясний кадр на весь екран: ${who(sat, day, time)}`,
    photo: (sat: string, day: string, time: string) => `Відкрити знімок на весь екран: ${who(sat, day, time)}`,
  },
  view: 'Відкрити',
  sharePass: 'Поділитися прольотом',
  radarTag: 'Радар',
  noteMostlyCloud: 'Цього тижня на знімках переважно хмари',
  noteLastClear: 'Ось останній ясний кадр',
  clouded: {
    pct: (p: number) => `Під хмарами · ${pct(p)}`,
    coverAtSpot: 'Під хмарами · твоя точка теж',
    atSpot: 'Хмари над твоєю точкою',
  },
  status: {
    cloudedPct: (p: number) => `Хмарно · ${pct(p)}`,
    cloudAtSpot: 'Хмари в точці',
    clear: 'Ясно',
    cirrus: 'Перисті хмари',
    shadow: 'Тінь від хмар',
    cloudPct: (p: number) => `Хмари ${pct(p)}`,
    mosaic: 'Добова мозаїка',
  },
  cropKm: (km: number) => `${km >= 100 ? f.int(km) : f.dec(km, 1)}\u00a0км`,

  // ── a photo frame ────────────────────────────────────────────────────────────────────────
  // The satellite after its head noun (an oblique case falls on «супутника»), the place alone after a colon.
  photoAlt: (sat: string, place: string) => `Знімок із супутника ${sat}: ${place}. Це місце в центрі кадру.`,
  acquiring: 'Зчитування',
  noImage: 'Знімок не надійшов',
  retry: 'Повторити',
  scaleKm: (km: number) => `${km >= 1 ? f.int(km) : f.dec(km, 1)}\u00a0км`,
  // The cartographic N, as on every readout's compass point (§4.2).
  north: 'N',
  expandLabel: 'Розгорнути знімок',
  expandTitle: 'Розгорнути (F)',

  // ── a photo developing (the pushbroom reveal) ────────────────────────────────────────────
  stillRendering: 'Ще готується. Для великого кадру це може тривати 10\u00a0с і довше.',
  cropMissing: 'Архів не надіслав фрагмент, можливо, через навантаження. Сам знімок існує.',
  scanLine: (line: string, lines: string): Rich => ['Рядок ', strong(line), ` → ${lines}`],
  awaiting: { pass: 'Очікування прольоту', scan: 'Очікування сканування' },
}
export default gallery
