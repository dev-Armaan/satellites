/**
 * Russian copy for the results panel (see docs/i18n/ru.md §3.3, §3.4, §4.1, §5, §6, §7, Appendix A): the headline and
 * its second line, the reasons no image was made public, the footnotes, the computing readout, the headers, the
 * timeline, the replay controls, the plan view, the geostationary rows and the picture captions.
 *
 * Why it is built this way:
 *  - Russian cannot inflect an inserted name, so the place stands only where the nominative is grammatical: first, as
 *    the headline's title closed by a full stop («*Waterloo*. За последние 7 дней сюда…»), after a colon («Спутники над
 *    этим местом: Waterloo») or alone. Sentences point back with «сюда», «здесь», «это место».
 *  - A count wraps the words that agree with it: the verb (21 → «смотрел 21 спутник», 22 → «смотрели 22 спутника»),
 *    the participle («Опубликован 21 снимок», «Опубликовано 27 снимков»), and the adjective before the noun («2
 *    радарных спутника», «2 суточные мозаики»). Zero is its own sentence («ни один», «ни одного снимка»). A count a
 *    word governs takes that case («Проверено 1 204 пролёта 412 съёмочных и пилотируемых спутников»). Between a number
 *    and its noun the no-break space is written here: nothing else adds it.
 *  - "At least" is «как минимум», an adverb that governs nothing, so removing it from the second line changes no other
 *    word («не менее» would put the count in the genitive).
 *  - A satellite follows its head noun («спутник Sentinel-2C», «с неизвестного спутника»), so its name never takes a
 *    case. Days come from the ru 'time' namespace (Intl's forms), and in sentences Intl's genitive months («с 29
 *    октября по 5 ноября», «со 2 по 9 ноября»: «со» before «второго»). Mono labels are sentence case; the only
 *    abbreviations are units.
 */
import type en from '../en/results'
import type { PlaceWhen, UtcWhen, WindowWhen } from '../en/results'
import { fmt } from '../../../api/_lib/i18n/format'
import { formatDate } from '../../../api/_lib/i18n/dates'
import { accent, num, strong, type Part, type Rich } from '../../../api/_lib/i18n/parts'
import type { Pass, SatCategory } from '@/types'
import type { DateFields } from '@/ui/results/lib/time'
import { localParts } from '@/ui/results/lib/time'
import time from './time'
import verdicts from './verdicts'

const f = fmt('ru')
type Verdict = Pass['verdict']
type Forms = { one: string; few: string; many: string; other: string }

/** A whole count, or a fraction kept (its plural form is `other`) */
const int = (n: number) => (Number.isInteger(n) ? f.int(n) : f.dec(n, 1))
/** «7 дней», «1 пролёт»: a count and its noun, tied with a no-break space */
const count = (n: number, forms: Forms) => `${int(n)}\u00a0${f.plural(n, forms)}`

const DAYS: Forms = { one: 'день', few: 'дня', many: 'дней', other: 'дня' }
const IMAGES: Forms = { one: 'снимок', few: 'снимка', many: 'снимков', other: 'снимка' }
const TIMES: Forms = { one: 'раз', few: 'раза', many: 'раз', other: 'раза' }
const RADAR_SATS: Forms = { one: 'радарный спутник', few: 'радарных спутника', many: 'радарных спутников', other: 'радарного спутника' }

/** The full stop after a place, unless it already ends on one («D.C.», a label cut with «…») */
const stop = (place: string) => (/[.…!?]$/u.test(place) ? '' : '.')
/** The place as a title: «Waterloo.» */
const title = (place: string) => `${place}${stop(place)}`
/** «1 нояб.» / «вс, 1 нояб.» at a zone: the ru 'time' namespace's forms, from the instant */
const dayMonth = (ms: number, timeZone: string) => time.dayMonth(ms, timeZone, localParts(ms, timeZone))
const day = (ms: number, timeZone: string) => time.day(ms, timeZone, localParts(ms, timeZone))
/** «1 ноября»: Intl's genitive month, the day tied to it */
const dayLong = (ms: number, timeZone: string) =>
  formatDate('ru', ms, timeZone, { day: 'numeric', month: 'long' }).replace(/(\d) /, '$1\u00a0')

/** «С 29 октября по 5 ноября» · «С 1 по 8 ноября» · «Со 2 по 9 ноября» (read «со второго») */
function between(fromMs: number, toMs: number, timeZone: string): string {
  const a = localParts(fromMs, timeZone)
  const b = localParts(toMs, timeZone)
  const from = a.year === b.year && a.month === b.month ? String(a.day) : dayLong(fromMs, timeZone)
  return `${a.day === 2 ? 'Со' : 'С'}\u00a0${from} по ${dayLong(toMs, timeZone)}`
}

/** «За последние 7 дней» · «За последний 21 день» · «С 29 октября по 5 ноября» */
const windowWords = (when: WindowWhen) =>
  'lastDays' in when
    ? `За ${f.plural(when.lastDays, { one: 'последний', few: 'последние', many: 'последние', other: 'последние' })} ${count(when.lastDays, DAYS)}`
    : between(when.fromMs, when.toMs, when.timeZone)

/** «Проверено 1 204 пролёта 412 съёмочных и пилотируемых спутников.» (`one`: «Проверен 1 201 пролёт 421 съёмочного…») */
const checked = (passes: number, sats: number) =>
  `${f.plural(passes, { one: 'Проверен', few: 'Проверено', many: 'Проверено', other: 'Проверено' })} ` +
  `${count(passes, { one: 'пролёт', few: 'пролёта', many: 'пролётов', other: 'пролёта' })} ` +
  `${count(sats, {
    one: 'съёмочного и пилотируемого спутника',
    few: 'съёмочных и пилотируемых спутников',
    many: 'съёмочных и пилотируемых спутников',
    other: 'съёмочного и пилотируемого спутника',
  })}.`

/** The satellite after «с»/«со» (genitive): «со спутника Sentinel-2C» / «с неизвестного спутника» */
const fromSat = (sat: string | undefined) => (sat !== undefined ? `со спутника ${sat}` : 'с неизвестного спутника')
/** …as the subject: «спутник Sentinel-2C» / «неизвестный спутник» */
const satNom = (sat: string | undefined) => (sat !== undefined ? `спутник ${sat}` : 'неизвестный спутник')

/** What a pass's mark stands for in the timeline's tooltip: the kind of satellite (masculine, for «спутник») and the mark */
const MARK_KIND: Partial<Record<SatCategory, string>> = {
  'open-optical': 'съёмочный с открытым архивом · ◇',
  'commercial-optical': 'коммерческий · □',
  radar: 'радарный · ▣',
  'weather-leo': 'метеорологический · ○',
  crewed: 'пилотируемый · ✛',
}

const VERDICT_ORDER = ['imaged', 'likely', 'could', 'overhead'] as const

const results: typeof en = {
  // ── the headline ─────────────────────────────────────────────────────────────────────────
  headline: {
    watched: (n: number, place: string, when: WindowWhen): Rich => {
      const head: Part[] = [accent(place), `${stop(place)} ${windowWords(when)} сюда `]
      return f.plural<Rich>(n, {
        one: [...head, strong('смотрел ', num(f.int(n)), '\u00a0спутник'), '.'],
        few: [...head, strong('смотрели ', num(f.int(n)), '\u00a0спутника'), '.'],
        many: [...head, strong('смотрели ', num(f.int(n)), '\u00a0спутников'), '.'],
        other: [...head, strong('смотрели ', num(f.dec(n, 1)), '\u00a0спутника'), '.'],
      })
    },
    none: (place: string, past: boolean): Rich => [
      accent(place),
      `${stop(place)} ${past ? 'В ту неделю' : 'На этой неделе'} ни один известный нам спутник сюда не смотрел.`,
    ],
  },

  // ── the second line ──────────────────────────────────────────────────────────────────────
  // The participle agrees with the count; «как минимум» governs nothing, so it can go without another word changing.
  // Its two words are one phrase: a line never ends between them.
  imagesPublic: (k: number): Rich => [
    `${f.plural(k, { one: 'Опубликован', few: 'Опубликовано', many: 'Опубликовано', other: 'Опубликовано' })} `,
    strong('как\u00a0минимум '),
    num(int(k)),
    `\u00a0${f.plural(k, IMAGES)}.`,
  ],
  noImages: { thisWeek: 'На этой неделе не опубликовано ни одного снимка.', thatWeek: 'За ту неделю не опубликовано ни одного снимка.' },
  archiveDown: 'Архивы снимков не ответили, поэтому сейчас мы не можем посчитать опубликованные снимки.',
  tryAgain: 'Повторить',
  share: 'Поделиться',
  shareWeekLabel: (place: string, past: boolean) => `Поделиться ${past ? 'той' : 'этой'} неделей: ${place}`,

  why: {
    sunNeverRose: 'Солнце здесь так и не взошло, поэтому ни одна дневная камера не могла увидеть это место.',
    sunBarelyRose: 'Солнце едва поднялось над горизонтом, поэтому ни одна дневная камера не могла увидеть это место.',
    infrared: (n: number): Rich => [
      // Always after the sentence about the sun, so «Зато» is the contrast («всё равно» is a spoken "anyway").
      'Зато метеоспутники снимали это место в инфракрасном диапазоне: ',
      num(int(n)),
      `\u00a0${f.plural(n, TIMES)}.`,
    ],
    // «и ещё N» makes the subject plural, so the verb is singular only for one named satellite or a `one` count alone.
    radar: (names: readonly string[], others: number, passes: number): Rich => {
      const sats = (n: number) => count(n, RADAR_SATS)
      let who: string
      if (others > 0 && names.length) who = `${names.join(', ')} и ещё ${sats(others)} пролетали`
      else if (others > 0) who = `${sats(others)} ${f.category(others) === 'one' ? 'пролетал' : 'пролетали'}`
      else if (names.length === 1) who = `Радарный спутник ${names[0]} пролетал`
      else if (names.length) who = `Радарные спутники ${names.slice(0, -1).join(', ')} и ${names[names.length - 1]} пролетали`
      else who = 'Радарные спутники пролетали'
      return [`Радару не нужен свет. ${who} в зоне досягаемости `, num(int(passes)), `\u00a0${f.plural(passes, TIMES)}.`]
    },
    // One pass is one satellite: its own sentence, with the head noun so the verb has a gender.
    unpublished: (n: number) =>
      n === 1
        ? 'Днём здесь один раз пролетал спутник Sentinel-2 или Landsat, но кадр ещё не опубликован.'
        : `Sentinel-2 или Landsat пролетали здесь днём ${count(n, TIMES)}, но ни одного кадра ещё не опубликовано.`,
    none: 'Днём здесь не пролетал ни один спутник, который публикует свои снимки.',
  },

  // ── the summary's readouts ───────────────────────────────────────────────────────────────
  verdictGroup: 'Пролёты по статусам. Каждое число ведёт к своему списку.',
  verdictReadout: (n: number, verdict: Verdict, title: string) => `${int(n)}\u00a0${verdicts[verdict].unit(n)}: ${title}`,

  // ── the footnotes ────────────────────────────────────────────────────────────────────────
  notes: {
    counted: (o: { detailed: number; mosaics: number; radar: number; geo: number; passes: number; satellites: number }): Rich => {
      const detailed = f.plural(o.detailed, { one: 'детальный снимок', few: 'детальных снимка', many: 'детальных снимков', other: 'детального снимка' })
      const out: Part[] = [strong(int(o.detailed)), `\u00a0${detailed} (Sentinel-2, Landsat, 10–30\u00a0м)`]
      if (o.mosaics) {
        const mosaics = f.plural(o.mosaics, { one: 'суточная мозаика', few: 'суточные мозаики', many: 'суточных мозаик', other: 'суточной мозаики' })
        out.push(' · ', strong(int(o.mosaics)), `\u00a0${mosaics} (250–375\u00a0м)`)
      }
      if (o.radar) {
        const radar = f.plural(o.radar, { one: 'радарный снимок', few: 'радарных снимка', many: 'радарных снимков', other: 'радарного снимка' })
        out.push(' · ', strong(int(o.radar)), `\u00a0${radar} (Sentinel-1, 20\u00a0м)`)
      }
      if (o.geo) {
        out.push(
          ' · ',
          strong(int(o.geo)),
          `\u00a0${f.plural(o.geo, IMAGES)} полного диска с геостационарных метеоспутников (2–5\u00a0км; показан самый свежий снимок каждого)`,
        )
      }
      out.push(`. ${checked(o.passes, o.satellites)}`)
      return out
    },
    checked: (passes: number, satellites: number) => checked(passes, satellites),
    // The place cannot follow «к»: the footnote sits under its results, so «этому месту» names it.
    passTimes: (_place: string, fetched: string | undefined, zoneLabel: string) =>
      'Время пролёта\u00a0— это момент, когда спутник был ближе всего к этому месту. ' +
      `Оно рассчитано по открытым элементам орбит${fetched ? ` (получены ${fetched})` : ''}. Местное время: ${zoneLabel}.`,
  },

  // ── the panel ────────────────────────────────────────────────────────────────────────────
  sheetLabel: (place: string) => `Спутники над этим местом: ${place}`,
  computingPasses: 'Расчёт пролётов',
  sections: { summary: 'Сводка', passes: 'Пролёты', watchedContinuously: 'Смотрят постоянно' },
  checkingArchives: 'Проверка архивов',
  invite: {
    text: 'На этой неделе что-то смотрело и на тебя.',
    checkPlace: 'Проверить моё место',
    dismiss: 'Закрыть',
  },
  searchAnother: 'Поиск другого места',
  allPasses: 'Все пролёты',

  footer: {
    replay: 'Повтор',
    replayLabel: 'Воспроизвести пролёт',
    replayTitle: 'Воспроизвести пролёт на глобусе',
    shareLabel: { pass: 'Поделиться пролётом', image: 'Поделиться снимком' },
    shareButton: { pass: ['Поделиться', strong(' пролётом')] as Rich, image: ['Поделиться', strong(' снимком')] as Rich },
    // Narrow phones drop the strong part: «Моё место» stands alone in the reader's voice, as «Моё местоположение»
    // does on the landing (a bare reflexive «Своё место» has no one to refer to).
    checkPlace: [strong('Проверить '), 'моё место'] as Rich,
    clearest: [strong('Показать '), 'самый ясный кадр'] as Rich,
    clearestLabel: 'Показать самый ясный кадр',
  },

  // ── the headers ──────────────────────────────────────────────────────────────────────────
  head: {
    windowSpan: (days: number, startMs: number, endMs: number, timeZone: string) =>
      `${count(days, DAYS)} · ${time.dayRange(startMs, endMs, timeZone, localParts(startMs, timeZone), localParts(endMs, timeZone))}`,
    verifying: 'Проверка суточных мозаик',
    cancel: 'Отмена',
    newSearch: 'Новый поиск',
    close: 'Закрыть',
    escKey: 'Esc',
    searchBarLabel: (place: string) => `Поиск другого места (сейчас: ${place})`,
    change: 'Изменить',
    computing: 'Расчёт',
    recent: 'Недавние',
    position: (k: number, n: number) => `Пролёт ${f.int(k)} из ${f.int(n)} в этой группе`,
    previous: 'Предыдущий пролёт этой группы',
    next: 'Следующий пролёт этой группы',
    previousTitle: 'Предыдущий (←)',
    nextTitle: 'Следующий (→)',
    allPassesTitle: 'Все пролёты (Esc)',
    shared: (sat: string, place: string) => `С тобой поделились · ${title(place)} Сюда смотрел спутник ${sat}.`,
    passWhen: (ms: number, timeZone: string, p: DateFields, clock: string, zone: string, approx: boolean) =>
      `${time.day(ms, timeZone, p)} · ${approx ? '≈\u00a0' : ''}${clock}\u00a0${zone}`,
  },

  // ── the computing readout ────────────────────────────────────────────────────────────────
  computing: {
    stages: {
      catalog: { idle: 'Каталог орбит', done: 'Каталог загружен' },
      propagate: { idle: (days: number) => `Расчёт орбит · ${count(days, DAYS)}`, done: 'Орбиты рассчитаны' },
      archive: { idle: 'Архивы Sentinel-2 + Landsat', done: 'Архивы проверены' },
      match: { idle: 'Сверка кадров с пролётами', done: 'Кадры сверены' },
    },
    ready: 'Отчёт готов',
    ok: 'OK',
    seconds: (s: number) => `${f.dec(s, 2)}\u00a0с`,
    // «7 дней · », as the header's windowSpan says it: one line cut with an ellipsis, so the hidden part stays short.
    window: (days: number, from: UtcWhen, to: UtcWhen): Rich => [
      strong(`${count(days, DAYS)} · `),
      `${dayMonth(from.ms, 'UTC')} ${from.time} → ${dayMonth(to.ms, 'UTC')} ${to.time}\u00a0UTC`,
    ],
    percent: (pct: number) => `${f.int(pct)}%`,
    slow: 'Planetary Computer и NASA готовят снимки по запросу. Этот шаг может занять несколько секунд.',
    verySlow:
      'Архивы снимков отвечают медленно. Если они не ответят, мы всё равно покажем пролёты по геометрии орбит и скажем об этом.',
    sharedAlt: (sat: string | undefined, place: string) => `Снимок ${fromSat(sat)}: ${title(place)} С тобой поделились этим снимком.`,
    // The day goes before the sentence, so the sentence about the place keeps its full stop at the end.
    sharedCaption: (sat: string | undefined, place: string, when?: PlaceWhen): Rich => [
      strong('С тобой поделились'),
      ` · ${when ? `${day(when.ms, when.timeZone)}, ${when.time} · ` : ''}${title(place)} Сюда смотрел ${satNom(sat)}.`,
    ],
  },

  // ── 03 / СМОТРЯТ ПОСТОЯННО: geostationary weather satellites ──────────────────────────────
  geo: {
    // «Отсюда … не виден»: «выше 5°» is the satellite's height in this place's sky, not the place's.
    none: 'Отсюда ни один действующий геостационарный метеоспутник не виден выше 5° над горизонтом.',
    // The angle is «над горизонтом», as in the pass strip, the geometry grid and the card: a bare «высота» is altitude,
    // and the pass view prints this very satellite's 35 786 км. The no-break spaces keep each fact whole, so a narrow
    // row wraps at a « · ». «каждые 10 мин», «каждую 21 мин» (ru's `one`), «каждую минуту»; «мин» never inflects.
    facts: (lon: string, elevationDeg: number, cadenceMin: number) =>
      `${lon} · ${f.dec(elevationDeg, 1)}°\u00a0над\u00a0горизонтом · ${
        cadenceMin === 1 ? 'каждую\u00a0минуту' : `${f.category(cadenceMin) === 'one' ? 'каждую' : 'каждые'}\u00a0${int(cadenceMin)}\u00a0мин`
      }`,
    images: (n: number, days: number): Rich => [
      num(int(n)),
      `\u00a0${f.plural(n, IMAGES)} ${days === 7 ? 'за неделю' : `за ${count(days, DAYS)}`}`,
    ],
    replay: 'Повтор',
    replayLabel: (sat: string) => `${sat}: повтор самого свежего снимка`,
    // Two or three short words in a 64 px square (≈ 8 mono caps a line, no hyphenation).
    frame: {
      probing: 'Поиск…',
      noPublic: 'Нет открытых снимков',
      poorQuality: 'Плохое качество',
      noneNow: 'Сейчас снимка нет',
      // «загрузился» (10) overflows the square by 3 px; «не пришёл», as the gallery's «Снимок не пришёл», never says
      // the visitor tried to open it («не открылся»).
      unavailable: 'Кадр не пришёл',
    },
    frameAlt: (sat: string, infrared: boolean) => `${sat}: самый свежий ${infrared ? 'инфракрасный ' : ''}кадр этого места и окрестностей`,
    infraredChip: 'ИК',
    infraredTitle: 'Инфракрасный снимок. Яркость показывает температуру верхушек облаков: чем холоднее, тем светлее',
  },

  // ── 04 / ШКАЛА ВРЕМЕНИ ───────────────────────────────────────────────────────────────────
  timeline: {
    title: 'Шкала времени',
    meta: (days: number, zoneLabel: string, zones?: string) =>
      `${count(days, DAYS)} · ${zoneLabel}${zones ? ` · ${zones}` : ''}`,
    zoneChange: (before: string, after: string) => `${before} → ${after}`,
    daylight: 'Здесь день',
    // A verdict's name cannot follow a bare count in Russian («12 увидено»), so each count follows its name.
    summary: (days: number, counts: Record<Verdict, number>, titles: Readonly<Record<Verdict, string>>) =>
      `Шкала времени, ${count(days, DAYS)}. ` + VERDICT_ORDER.map((v) => `${titles[v]}: ${int(counts[v])}`).join('. ') + '.',
    keysHint: (summary: string) => `${summary} Листай пролёты клавишами со стрелками влево и вправо.`,
    geoLane: (n: number): Rich => [strong('Гео · '), f.int(n)],
    geoNames: (names: readonly string[]) => names.join(', '),
    now: 'Сейчас',
    geometry: (deg: number, km: number) => `${f.dec(deg, 1)}° от надира · ${f.int(km)}\u00a0км`,
    markMosaic: (gsdM: number) => `Суточная мозаика, ${f.int(gsdM)}\u00a0м · ●`,
    markRadar: (gsdM: number) => `Радарный снимок, ${f.int(gsdM)}\u00a0м · ◆`,
    markImaged: (title: string) => `${title} · ◆`,
    markKind: (title: string, category: SatCategory) => `${title} · ${MARK_KIND[category] ?? 'другой'}`,
  },

  // ── 02 / ПОВТОР ──────────────────────────────────────────────────────────────────────────
  replay: {
    // The replay's clock, as the HUD's «Повтор»: «кадр» is an image's word, and this is no image's capture time.
    scrubLabel: 'Время в повторе пролёта',
    scrubValue: (tMinus: string, utc: string) => `${tMinus}, ${utc}`,
    play: 'Воспроизвести повтор',
    pause: 'Приостановить повтор',
    speed: 'Скорость повтора',
    inView: (duration: string) => `В поле зрения ${duration}`,
    closest: 'Сближение',
    spaceKey: 'Пробел',
    playPause: 'пуск / пауза',
    stepKind: 'предыдущий / следующий пролёт этой группы',
  },

  // ── the plan view ────────────────────────────────────────────────────────────────────────
  plan: {
    label: (sat: string, km: number) =>
      `Схема пролёта: наземная трасса спутника ${sat}. В момент наибольшего сближения до этого места было ${f.int(km)}\u00a0км.`,
    // The corner labels keep within the English lengths (15 characters, 20 for fieldOfRegard).
    northUp: 'Север вверху',
    fieldOfRegard: (deg: number) => `Зона обзора ±${deg}°`,
    swath: (km: number) => `Полоса ${f.int(km)}\u00a0км`,
    groundTrack: 'Наземная трасса',
    scale: (km: number) => `${km >= 1 ? f.int(km) : f.dec(km, 1)}\u00a0км`,
    closest: (km: number) => `Сближение ${km < 1 ? '< 1' : f.int(km)}\u00a0км`,
  },

  // ── a picture's product line ─────────────────────────────────────────────────────────────
  product: {
    mosaic: (m: number) => `Суточная мозаика · ${m}\u00a0м`,
    fullDisc: (km: number) => `Полный диск · ${km}\u00a0км`,
    infrared: (km: number) => `Инфракрасный · ${km}\u00a0км`,
    sentinel2: (m: number) => `Sentinel-2 L2A · ${m}\u00a0м`,
    landsat: (m: number) => `Landsat C2 L2 · ${m}\u00a0м`,
    sentinel1: (m: number) => `Радар Sentinel-1 · ${m}\u00a0м`,
    other: (m: number) => `${m}\u00a0м`,
  },
  pixel: { m: (m: number) => `${m}\u00a0м`, km: (km: number) => `${km}\u00a0км` },

  // ── the time-lapse's row ─────────────────────────────────────────────────────────────────
  timelapse: {
    title: 'Таймлапс',
    sub: 'Это место год за годом',
  },
}
export default results
