/**
 * Ukrainian copy for the results panel (see docs/i18n/uk.md §3.3, §3.4, §4.1, §5, §6, §7, Appendix A): the headline
 * and its second line, the reasons no image was made public, the footnotes, the computing readout, the headers, the
 * timeline, the replay controls, the plan view, the geostationary rows and the picture captions.
 *
 * Why it is built this way:
 *  - Ukrainian cannot inflect an inserted name, so the place stands only where the nominative is grammatical: first,
 *    as the headline's title closed by a full stop («*Waterloo*. За останні 7 днів сюди…»), after a colon («Супутники
 *    над цим місцем: Waterloo») or alone. Sentences point back with «сюди», «тут», «це місце».
 *  - A count wraps its verb (21 → «дивився 21 супутник», 22 → «дивилися 22 супутники»), every category has its own
 *    form, and zero is its own sentence («жоден», «жодного знімка»). A count a word governs takes that case
 *    («Перевірено 1 204 прольоти 412 знімальних і пілотованих супутників»). Between a number and its noun the
 *    no-break space is written here: nothing else adds it.
 *  - «Оприлюднено» agrees with nothing, so removing «щонайменше» from the second line changes no other word.
 *  - A satellite follows its head noun («супутник Sentinel-2C», «із невідомого супутника»), so its name never takes
 *    a case. Days come from the uk 'time' namespace (Intl's forms), and in sentences Intl's genitive months («з 29
 *    жовтня по 5 листопада»). Mono labels are sentence case; the only abbreviations are units.
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

const f = fmt('uk')
type Verdict = Pass['verdict']
type Forms = { one: string; few: string; many: string; other: string }

/** A whole count, or a fraction kept (its plural form is `other`) */
const int = (n: number) => (Number.isInteger(n) ? f.int(n) : f.dec(n, 1))
/** «7 днів», «1 проліт»: a count and its noun, tied with a no-break space */
const count = (n: number, forms: Forms) => `${int(n)}\u00a0${f.plural(n, forms)}`

const DAYS: Forms = { one: 'день', few: 'дні', many: 'днів', other: 'дня' }
const IMAGES: Forms = { one: 'знімок', few: 'знімки', many: 'знімків', other: 'знімка' }
const TIMES: Forms = { one: 'раз', few: 'рази', many: 'разів', other: 'раза' }
const RADAR_SATS: Forms = { one: 'радарний супутник', few: 'радарні супутники', many: 'радарних супутників', other: 'радарного супутника' }

/** The full stop after a place, unless it already ends on one («D.C.», a label cut with «…») */
const stop = (place: string) => (/[.…!?]$/u.test(place) ? '' : '.')
/** The place as a title: «Waterloo.» */
const title = (place: string) => `${place}${stop(place)}`
/** «1 лист.» / «нд, 1 лист.» at a zone: the uk 'time' namespace's forms, from the instant */
const dayMonth = (ms: number, timeZone: string) => time.dayMonth(ms, timeZone, localParts(ms, timeZone))
const day = (ms: number, timeZone: string) => time.day(ms, timeZone, localParts(ms, timeZone))
/** «1 листопада»: Intl's genitive month, the day tied to it */
const dayLong = (ms: number, timeZone: string) =>
  formatDate('uk', ms, timeZone, { day: 'numeric', month: 'long' }).replace(/(\d) /, '$1\u00a0')

/** «За останні 7 днів» · «За останній 21 день» · «З 29 жовтня по 5 листопада» */
const windowWords = (when: WindowWhen) =>
  'lastDays' in when
    ? `За ${f.plural(when.lastDays, { one: 'останній', few: 'останні', many: 'останні', other: 'останні' })} ${count(when.lastDays, DAYS)}`
    : `З\u00a0${dayLong(when.fromMs, when.timeZone)} по ${dayLong(when.toMs, when.timeZone)}`

/** «Перевірено 1 204 прольоти 412 знімальних і пілотованих супутників.» (`one`: «…421 знімального й пілотованого супутника») */
const checked = (passes: number, sats: number) =>
  `Перевірено ${count(passes, { one: 'проліт', few: 'прольоти', many: 'прольотів', other: 'прольоту' })} ` +
  `${count(sats, {
    one: 'знімального й пілотованого супутника',
    few: 'знімальних і пілотованих супутників',
    many: 'знімальних і пілотованих супутників',
    other: 'знімального й пілотованого супутника',
  })}.`

/** The satellite in a sentence, after a preposition that takes the genitive: «супутника Sentinel-2C» / «невідомого супутника» */
const satGen = (sat: string | undefined) => (sat !== undefined ? `супутника ${sat}` : 'невідомого супутника')
/** …as the subject: «супутник Sentinel-2C» / «невідомий супутник» */
const satNom = (sat: string | undefined) => (sat !== undefined ? `супутник ${sat}` : 'невідомий супутник')

/** What a pass's mark stands for in the timeline's tooltip: the kind of satellite (masculine, for «супутник») and the mark */
const MARK_KIND: Partial<Record<SatCategory, string>> = {
  'open-optical': 'відкритий знімальний · ◇',
  'commercial-optical': 'комерційний · □',
  radar: 'радарний · ▣',
  'weather-leo': 'метеорологічний · ○',
  crewed: 'пілотований · ✛',
}

const VERDICT_ORDER = ['imaged', 'likely', 'could', 'overhead'] as const

const results: typeof en = {
  // ── the headline ─────────────────────────────────────────────────────────────────────────
  headline: {
    watched: (n: number, place: string, when: WindowWhen): Rich => {
      const head: Part[] = [accent(place), `${stop(place)} ${windowWords(when)} сюди `]
      return f.plural<Rich>(n, {
        one: [...head, strong('дивився ', num(f.int(n)), '\u00a0супутник'), '.'],
        few: [...head, strong('дивилися ', num(f.int(n)), '\u00a0супутники'), '.'],
        many: [...head, strong('дивилися ', num(f.int(n)), '\u00a0супутників'), '.'],
        other: [...head, strong('дивилися ', num(f.dec(n, 1)), '\u00a0супутника'), '.'],
      })
    },
    none: (place: string, past: boolean): Rich => [
      accent(place),
      `${stop(place)} ${past ? 'Того' : 'Цього'} тижня сюди не дивився жоден відомий нам супутник.`,
    ],
  },

  // ── the second line ──────────────────────────────────────────────────────────────────────
  imagesPublic: (k: number): Rich => ['Оприлюднено ', strong('щонайменше '), num(int(k)), `\u00a0${f.plural(k, IMAGES)}.`],
  noImages: { thisWeek: 'Цього тижня не оприлюднено жодного знімка.', thatWeek: 'Того тижня не оприлюднено жодного знімка.' },
  archiveDown: 'Архіви не відповіли, тож зараз ми не можемо порахувати оприлюднені знімки.',
  tryAgain: 'Повторити',
  share: 'Поділитися',
  shareWeekLabel: (place: string, past: boolean) => `Поділитися ${past ? 'тим' : 'цим'} тижнем: ${place}`,

  why: {
    sunNeverRose: 'Тут сонце так і не зійшло, тож жодна денна камера не могла побачити це місце.',
    sunBarelyRose: 'Сонце ледь піднялося над горизонтом, тож жодна денна камера не могла побачити це місце.',
    infrared: (n: number): Rich => [
      'Метеосупутники однаково сканували це місце в інфрачервоному діапазоні: ',
      num(int(n)),
      `\u00a0${f.plural(n, TIMES)}.`,
    ],
    // Names are joined with «та» (the sound of a name cannot be known); «та ще N» makes the subject plural, so the
    // verb is singular only for one named satellite. «у / в» follows the verb's last sound (пролітав у, пролітали в).
    radar: (names: readonly string[], others: number, passes: number): Rich => {
      const sats = (n: number) => count(n, RADAR_SATS)
      let who: string
      if (others > 0 && names.length) who = `${names.join(', ')} та ще ${sats(others)} пролітали в`
      else if (others > 0) who = `${sats(others)} ${f.category(others) === 'one' ? 'пролітав у' : 'пролітали в'}`
      else if (names.length === 1) who = `Радарний супутник ${names[0]} пролітав у`
      else if (names.length) who = `Радарні супутники ${names.slice(0, -1).join(', ')} та ${names[names.length - 1]} пролітали в`
      else who = 'Радарні супутники пролітали в'
      return [`Радару не потрібне світло. ${who} зоні досяжності `, num(int(passes)), `\u00a0${f.plural(passes, TIMES)}.`]
    },
    // One pass is one satellite: its own sentence, with the head noun so the verb has a gender.
    unpublished: (n: number) =>
      n === 1
        ? 'Удень тут один раз пролітав супутник Sentinel-2 або Landsat, але кадру ще не оприлюднено.'
        : `Sentinel-2 або Landsat пролітали тут удень ${count(n, TIMES)}, але жодного кадру ще не оприлюднено.`,
    none: 'Удень тут не пролітав жоден супутник, що оприлюднює свої знімки.',
  },

  // ── the summary's readouts ───────────────────────────────────────────────────────────────
  verdictGroup: 'Прольоти за позначками. Кожне число веде до свого списку.',
  verdictReadout: (n: number, verdict: Verdict, title: string) => `${int(n)}\u00a0${verdicts[verdict].unit(n)}: ${title}`,

  // ── the footnotes ────────────────────────────────────────────────────────────────────────
  notes: {
    counted: (o: { detailed: number; mosaics: number; radar: number; geo: number; passes: number; satellites: number }): Rich => {
      const detailed = f.plural(o.detailed, { one: 'детальний знімок', few: 'детальні знімки', many: 'детальних знімків', other: 'детального знімка' })
      const out: Part[] = [strong(int(o.detailed)), `\u00a0${detailed} (Sentinel-2, Landsat, 10–30\u00a0м)`]
      if (o.mosaics) {
        const mosaics = f.plural(o.mosaics, { one: 'добова мозаїка', few: 'добові мозаїки', many: 'добових мозаїк', other: 'добової мозаїки' })
        out.push(' · ', strong(int(o.mosaics)), `\u00a0${mosaics} (250–375\u00a0м)`)
      }
      if (o.radar) {
        const radar = f.plural(o.radar, { one: 'радарний знімок', few: 'радарні знімки', many: 'радарних знімків', other: 'радарного знімка' })
        out.push(' · ', strong(int(o.radar)), `\u00a0${radar} (Sentinel-1, 20\u00a0м)`)
      }
      if (o.geo) {
        out.push(
          ' · ',
          strong(int(o.geo)),
          `\u00a0${f.plural(o.geo, IMAGES)} повного диска з геостаціонарних метеосупутників (2–5\u00a0км; показано найновіший знімок кожного)`,
        )
      }
      out.push(`. ${checked(o.passes, o.satellites)}`)
      return out
    },
    checked: (passes: number, satellites: number) => checked(passes, satellites),
    // The place cannot follow «до»: the footnote sits under its results, so «цього місця» names it.
    passTimes: (_place: string, fetched: string | undefined, zoneLabel: string) =>
      'Час прольоту\u00a0— це мить, коли супутник був найближче до цього місця. ' +
      `Його обчислено за відкритими елементами орбіти${fetched ? ` (отримано ${fetched})` : ''}. Місцевий час: ${zoneLabel}.`,
  },

  // ── the panel ────────────────────────────────────────────────────────────────────────────
  sheetLabel: (place: string) => `Супутники над цим місцем: ${place}`,
  computingPasses: 'Обчислення прольотів',
  sections: { summary: 'Підсумок', passes: 'Прольоти', watchedContinuously: 'Дивляться постійно' },
  checkingArchives: 'Перевірка архівів',
  invite: {
    text: 'Цього тижня щось дивилося й на тебе.',
    checkPlace: 'Перевірити своє місце',
    dismiss: 'Закрити',
  },
  searchAnother: 'Пошук іншого місця',
  allPasses: 'Усі прольоти',

  footer: {
    replay: 'Повтор',
    replayLabel: 'Відтворити проліт',
    replayTitle: 'Відтворити проліт на глобусі',
    shareLabel: { pass: 'Поділитися прольотом', image: 'Поділитися знімком' },
    shareButton: { pass: ['Поділитися', strong(' прольотом')] as Rich, image: ['Поділитися', strong(' знімком')] as Rich },
    checkPlace: [strong('Перевірити '), 'своє місце'] as Rich,
    clearest: [strong('Показати '), 'найясніший кадр'] as Rich,
    clearestLabel: 'Показати найясніший кадр',
  },

  // ── the headers ──────────────────────────────────────────────────────────────────────────
  head: {
    windowSpan: (days: number, startMs: number, endMs: number, timeZone: string) =>
      `${count(days, DAYS)} · ${time.dayRange(startMs, endMs, timeZone, localParts(startMs, timeZone), localParts(endMs, timeZone))}`,
    verifying: 'Перевірка добових мозаїк',
    cancel: 'Скасувати',
    newSearch: 'Новий пошук',
    close: 'Закрити',
    escKey: 'Esc',
    searchBarLabel: (place: string) => `Пошук іншого місця (зараз: ${place})`,
    change: 'Змінити',
    computing: 'Обчислення',
    recent: 'Нещодавні',
    position: (k: number, n: number) => `Проліт ${f.int(k)} з ${f.int(n)} цієї групи`,
    previous: 'Попередній проліт цієї групи',
    next: 'Наступний проліт цієї групи',
    previousTitle: 'Попередній (←)',
    nextTitle: 'Наступний (→)',
    allPassesTitle: 'Усі прольоти (Esc)',
    shared: (sat: string, place: string) => `З тобою поділилися · ${title(place)} Сюди дивився супутник ${sat}.`,
    passWhen: (ms: number, timeZone: string, p: DateFields, clock: string, zone: string, approx: boolean) =>
      `${time.day(ms, timeZone, p)} · ${approx ? '≈\u00a0' : ''}${clock}\u00a0${zone}`,
  },

  // ── the computing readout ────────────────────────────────────────────────────────────────
  computing: {
    stages: {
      catalog: { idle: 'Каталог орбіт', done: 'Каталог завантажено' },
      propagate: { idle: (days: number) => `Розрахунок орбіт · ${count(days, DAYS)}`, done: 'Орбіти розраховано' },
      archive: { idle: 'Архіви Sentinel-2 + Landsat', done: 'Архіви переглянуто' },
      match: { idle: 'Зіставлення кадрів із прольотами', done: 'Кадри зіставлено' },
    },
    ready: 'Звіт готовий',
    ok: 'OK',
    seconds: (s: number) => `${f.dec(s, 2)}\u00a0с`,
    // «7 днів · », as the header's windowSpan says it: one line cut with an ellipsis, and «7-денне вікно» would push
    // «UTC» off the 432 px panel (49 characters against the English 44).
    window: (days: number, from: UtcWhen, to: UtcWhen): Rich => [
      strong(`${count(days, DAYS)} · `),
      `${dayMonth(from.ms, 'UTC')} ${from.time} → ${dayMonth(to.ms, 'UTC')} ${to.time}\u00a0UTC`,
    ],
    percent: (pct: number) => `${f.int(pct)}%`,
    slow: 'Planetary Computer і NASA готують знімки на запит. Цей крок може тривати кілька секунд.',
    verySlow:
      'Архіви знімків відповідають повільно. Якщо вони не відповідять, ми все одно покажемо прольоти за геометрією орбіт і скажемо про це.',
    sharedAlt: (sat: string | undefined, place: string) =>
      `Знімок із ${satGen(sat)}: ${title(place)} З тобою поділилися цим знімком.`,
    // The day goes before the sentence, so the sentence about the place keeps its full stop at the end.
    sharedCaption: (sat: string | undefined, place: string, when?: PlaceWhen): Rich => [
      strong('З тобою поділилися'),
      ` · ${when ? `${day(when.ms, when.timeZone)}, ${when.time} · ` : ''}${title(place)} Сюди дивився ${satNom(sat)}.`,
    ],
  },

  // ── 03 / ДИВЛЯТЬСЯ ПОСТІЙНО: geostationary weather satellites ─────────────────────────────
  geo: {
    none: 'Жоден робочий геостаціонарний метеосупутник не бачить це місце вище 5° над горизонтом.',
    // «кожні 10 хв», «кожну 21 хв» (uk's `one`), «щохвилини»; «хв» never inflects.
    facts: (lon: string, elevationDeg: number, cadenceMin: number) =>
      `${lon} · ${f.dec(elevationDeg, 1)}° над горизонтом · ${
        cadenceMin === 1 ? 'щохвилини' : `${f.category(cadenceMin) === 'one' ? 'кожну' : 'кожні'} ${int(cadenceMin)}\u00a0хв`
      }`,
    // «за 7 днів» for this week and an older one alike, as the gallery's counter says it.
    images: (n: number, days: number): Rich => [num(int(n)), `\u00a0${f.plural(n, IMAGES)} за ${count(days, DAYS)}`],
    replay: 'Повтор',
    replayLabel: (sat: string) => `${sat}: повтор найновішого знімка`,
    // Two or three short words in a 72 px square (≈ 9 mono caps a line, no hyphenation).
    frame: {
      probing: 'Пошук…',
      noPublic: 'Немає відкритих знімків',
      poorQuality: 'Погана якість',
      noneNow: 'Зараз знімка немає',
      unavailable: 'Кадр не відкрився',
    },
    frameAlt: (sat: string, infrared: boolean) => `${sat}: найновіший ${infrared ? 'інфрачервоний ' : ''}кадр навколо цього місця`,
    infraredChip: 'ІЧ',
    infraredTitle: 'Інфрачервоний знімок: верхівки хмар за температурою, що холодніше, то світліше',
  },

  // ── 04 / ЧАСОВА ШКАЛА ────────────────────────────────────────────────────────────────────
  timeline: {
    title: 'Часова шкала',
    meta: (days: number, zoneLabel: string, zones?: string) =>
      `${count(days, DAYS)} · ${zoneLabel}${zones ? ` · ${zones}` : ''}`,
    zoneChange: (before: string, after: string) => `${before} → ${after}`,
    daylight: 'Тут день',
    // A verdict's name cannot follow a bare count in Ukrainian («12 побачено»), so each count follows its name.
    summary: (days: number, counts: Record<Verdict, number>, titles: Readonly<Record<Verdict, string>>) =>
      `Часова шкала, ${count(days, DAYS)}. ` + VERDICT_ORDER.map((v) => `${titles[v]}: ${int(counts[v])}`).join('. ') + '.',
    keysHint: (summary: string) => `${summary} Гортай прольоти клавішами зі стрілками вліво й вправо.`,
    geoLane: (n: number): Rich => [strong('Гео · '), f.int(n)],
    geoNames: (names: readonly string[]) => names.join(', '),
    now: 'Зараз',
    geometry: (deg: number, km: number) => `${f.dec(deg, 1)}° від надиру · ${f.int(km)}\u00a0км`,
    markMosaic: (gsdM: number) => `Добова мозаїка, ${f.int(gsdM)}\u00a0м · ●`,
    markRadar: (gsdM: number) => `Радарний знімок, ${f.int(gsdM)}\u00a0м · ◆`,
    markImaged: (title: string) => `${title} · ◆`,
    markKind: (title: string, category: SatCategory) => `${title} · ${MARK_KIND[category] ?? 'інший'}`,
  },

  // ── 02 / ПОВТОР ──────────────────────────────────────────────────────────────────────────
  replay: {
    // The replay's clock, as the HUD's «Повтор»: «кадр» is an image's word, and this is no image's capture time.
    scrubLabel: 'Час у повторі прольоту',
    scrubValue: (tMinus: string, utc: string) => `${tMinus}, ${utc}`,
    play: 'Відтворити повтор',
    pause: 'Призупинити повтор',
    speed: 'Швидкість повтору',
    inView: (duration: string) => `У полі зору ${duration}`,
    closest: 'Зближення',
    spaceKey: 'Пробіл',
    playPause: 'відтворення / пауза',
    stepKind: 'попередній / наступний проліт цієї групи',
  },

  // ── the plan view ────────────────────────────────────────────────────────────────────────
  plan: {
    label: (sat: string, km: number) =>
      `Схема прольоту: наземна траса супутника ${sat}. У момент найбільшого зближення до цього місця було ${f.int(km)}\u00a0км.`,
    // The corner labels keep within the English lengths (15 characters, 20 for fieldOfRegard).
    northUp: 'Північ угорі',
    fieldOfRegard: (deg: number) => `Зона огляду ±${deg}°`,
    swath: (km: number) => `Смуга ${f.int(km)}\u00a0км`,
    groundTrack: 'Наземна траса',
    scale: (km: number) => `${km >= 1 ? f.int(km) : f.dec(km, 1)}\u00a0км`,
    closest: (km: number) => `Зближення ${km < 1 ? '< 1' : f.int(km)}\u00a0км`,
  },

  // ── a picture's product line ─────────────────────────────────────────────────────────────
  product: {
    mosaic: (m: number) => `Добова мозаїка · ${m}\u00a0м`,
    fullDisc: (km: number) => `Повний диск · ${km}\u00a0км`,
    infrared: (km: number) => `Інфрачервоний · ${km}\u00a0км`,
    sentinel2: (m: number) => `Sentinel-2 L2A · ${m}\u00a0м`,
    landsat: (m: number) => `Landsat C2 L2 · ${m}\u00a0м`,
    sentinel1: (m: number) => `Радар Sentinel-1 · ${m}\u00a0м`,
    other: (m: number) => `${m}\u00a0м`,
  },
  pixel: { m: (m: number) => `${m}\u00a0м`, km: (km: number) => `${km}\u00a0км` },

  // ── the time-lapse's row ─────────────────────────────────────────────────────────────────
  timelapse: {
    title: 'Таймлапс',
    sub: 'Це місце рік за роком',
  },
}
export default results
