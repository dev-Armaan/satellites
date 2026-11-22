/**
 * Persian copy for the results panel (see docs/i18n/fa.md §3.3, §3.7 "`results`", §5, §6, the authority on every line
 * here): the headline and its second line, the reasons no image was made public, the footnotes, the computing
 * readout, the headers and footer, the timeline, the replay controls, the plan view, the geostationary rows and the
 * picture captions.
 *
 * Why it is built this way:
 *  - The headline fronts the place as the object and ends on the count and the verb, the part the English bolds:
 *    «در 7 روز گذشته، *Waterloo* را **256 ماهواره رصد کردند**.» Persian fronts an object freely, a counted noun is
 *    singular, and the satellites take a plural verb. One is a word («یک ماهواره رصد کرد»), so its strong part has no
 *    number. Zero keeps subject–object–verb for its negative subject («هیچ‌یک از ماهواره‌هایی که ردیابی می‌کنیم
 *    *Waterloo* را رصد نکرد»).
 *  - The second line puts «دست‌کم» first, as English puts "At least", so it reads with and without it; an inanimate
 *    counted subject takes a singular verb («31 تصویر منتشر شد»).
 *  - CLDR's `one` holds 0 as well as 1 in Persian, so every «یک» is tied to `n === 1`, never to the plural category.
 *  - The place needs no inflection: «را» after it, a preposition before it, or an ezafe. A Persian word always stands
 *    between it and a Latin satellite name («[PLACE] را ماهوارهٔ X رصد کرد»), and between a name and a number.
 *  - Units are words, outside num() and after a no-break space («10 متر»). Ranges in prose take «تا» («10 تا 30
 *    متر»): a dash between two numbers after Persian letters would be reordered.
 *  - Bidi: every DOM-only string that would put a Latin run, a degree or a stamp where right-to-left text reorders it
 *    isolates that run with LRI…PDI (fa.md §6.2): the timeline's zones, a product code before its pixel, a degree after
 *    a Persian word, the fetch stamp. Arrows that mean "then" point along the reading («←»).
 *  - Lists are built here (`list`): Persian puts no comma before «و», and CLDR's pattern does (fa.md §5.5).
 *  - Dates are the fa 'time' namespace's (Gregorian, Intl).
 */
import type en from '../en/results'
import type { PlaceWhen, UtcWhen, WindowWhen } from '../en/results'
import { fmt } from '../../../api/_lib/i18n/format'
import { accent, num, strong, type Part, type Rich } from '../../../api/_lib/i18n/parts'
import type { Pass, SatCategory } from '@/types'
import { localParts, type DateFields } from '@/ui/results/lib/time'
import time from './time'
import { isoUnlessRtl, ltr, whole } from '../bidi'

const f = fmt('fa')
const nb = '\u00a0'
type Verdict = Pass['verdict']

/**
 * Isolate a Latin label (a zone, a zone name, a place), but leave one that holds Persian words or isolates already as it
 * is. A place searched by coordinates needs it most: «23.5000°N 12.5000°E» after a Persian comma read
 * «N 12.5000°E°23.5000» in the headline.
 */
const iso = isoUnlessRtl
/** A whole count, or a fraction kept */
const int = (n: number) => (Number.isInteger(n) ? f.int(n) : f.dec(n, 1))
/** "A، B و C": Persian lists, no comma before «و» */
const list = (items: readonly string[]) =>
  items.length < 2 ? (items[0] ?? '') : `${items.slice(0, -1).join('، ')} و ${items[items.length - 1]}`

/** Display names of the crewed stations (src/engine/profiles.ts: ISS, Tiangong): no message carries a crewed flag */
const CREWED = /^(ISS|Tiangong)\b/
/**
 * «ماهوارهٔ Sentinel-2C» / «ایستگاه فضایی ISS»; a nameless one is «یک ماهواره». The name is its own left-to-right
 * island: a name that ends in a bracket («ISS (ZARYA)», an older share's) would otherwise mirror it before Persian text.
 */
const theSat = (sat: string) => (CREWED.test(sat) ? `ایستگاه فضایی${nb}${ltr(sat)}` : `ماهوارهٔ${nb}${ltr(sat)}`)
const aSat = (sat: string | undefined) => (sat ? theSat(sat) : 'یک ماهواره')
/** "[SAT] watched [PLACE]", object first, so the place and the satellite's name never touch */
const watchedBy = (sat: string | undefined, place: string) => `${iso(place)}${nb}را ${aSat(sat)} رصد کرد`

/** «7 روز گذشته» (a one-day window is «24 ساعت»: «روز گذشته» alone means "yesterday") */
const lastDays = (n: number) => (n === 1 ? `24${nb}ساعت گذشته` : `${int(n)}${nb}روز گذشته`)
/** "N days": «7 روز» */
const days = (n: number) => `${int(n)}${nb}روز`
/** "N times", adverbially: «یک بار» · «42 بار», the number its own island */
const times = (n: number): Part[] => (n === 1 ? ['یک بار'] : [num(int(n)), `${nb}بار`])

/** «29 اکتبر» / «یکشنبه 1 نوامبر» at a zone: the fa 'time' namespace's forms, from the instant */
const dayMonth = (ms: number, timeZone: string) => time.dayMonth(ms, timeZone, localParts(ms, timeZone))
const day = (ms: number, timeZone: string) => time.day(ms, timeZone, localParts(ms, timeZone))

/** «1,234 گذر مربوط به 250 ماهوارهٔ تصویربردار و سرنشین‌دار بررسی شد.» */
const checked = (passes: number, sats: number) =>
  `${int(passes)}${nb}گذر مربوط به ${int(sats)}${nb}ماهوارهٔ تصویربردار و سرنشین‌دار بررسی شد.`

/** What a pass's mark stands for in the timeline's tooltip, by the satellite's category: its kind and the mark's shape */
const MARK_KIND: Partial<Record<SatCategory, string>> = {
  'open-optical': 'تصویربردار باز · ◇',
  'commercial-optical': 'تجاری · □',
  radar: 'راداری · ▣',
  'weather-leo': 'هواشناسی · ○',
  crewed: 'سرنشین‌دار · ✛',
}

const VERDICT_ORDER = ['imaged', 'likely', 'could', 'overhead'] as const

const results: typeof en = {
  // ── the headline ─────────────────────────────────────────────────────────────────────────
  headline: {
    watched: (n: number, place: string, when: WindowWhen): Rich => {
      const window =
        'lastDays' in when
          ? `در ${lastDays(when.lastDays)}، `
          : `از ${dayMonth(when.fromMs, when.timeZone)} تا ${dayMonth(when.toMs, when.timeZone)}، `
      const phrase = n === 1 ? strong(`یک ماهواره رصد${nb}کرد`) : strong(num(int(n)), `${nb}ماهواره رصد${nb}کردند`)
      // A no-break space keeps «را» on its object's line: a line never starts with it. Another holds the compound verb
      // together («رصد کردند»): a line may break before it, never inside it.
      return [window, accent(iso(place)), `${nb}را `, phrase, '.']
    },
    none: (place: string, past: boolean): Rich => [
      `${past ? 'آن هفته' : 'این هفته'} هیچ‌یک از ماهواره‌هایی که ردیابی می‌کنیم `,
      accent(iso(place)),
      `${nb}را رصد نکرد.`,
    ],
  },

  // ── the second line ──────────────────────────────────────────────────────────────────────
  imagesPublic: (k: number): Rich =>
    k === 1 ? [strong('دست‌کم '), 'یک تصویر منتشر شد.'] : [strong('دست‌کم '), num(int(k)), `${nb}تصویر منتشر شد.`],
  noImages: { thisWeek: 'این هفته هیچ تصویری منتشر نشد.', thatWeek: 'آن هفته هیچ تصویری منتشر نشد.' },
  archiveDown: 'آرشیوهای تصویر پاسخ ندادند، پس فعلاً نمی‌توانیم تصویرهای منتشرشده را بشماریم.',
  tryAgain: 'تلاش دوباره',
  share: 'اشتراک‌گذاری',
  // «خلاصهٔ … هفته»: after a verbal noun a bare «این هفته» reads as "this week" the adverb
  shareWeekLabel: (place: string, past: boolean) => `اشتراک‌گذاری خلاصهٔ ${past ? 'آن' : 'این'} هفته در ${place}`,

  why: {
    sunNeverRose: 'خورشید اصلاً طلوع نکرد، پس هیچ دوربینی که به نور روز نیاز دارد نمی‌توانست این‌جا را ببیند.',
    sunBarelyRose: 'خورشید به‌زحمت بالا آمد، پس هیچ دوربینی که به نور روز نیاز دارد نمی‌توانست این‌جا را ببیند.',
    // "Swept it in infrared" is «پوشش دادند», the likely verdict's verb.
    infrared: (n: number): Rich => ['با این حال، ماهواره‌های هواشناسی ', ...times(n), ' این‌جا را با فروسرخ پوشش دادند.'],
    // The place is the subject: «این‌جا … در بُرد ماهوارهٔ راداری X بود», so the range is the satellites' and the count
    // stands before every name. The plural head noun leads the names once; each name is its own island, or two names
    // with only «، » between them merge into one left-to-right run and read in the wrong order.
    radar: (names: readonly string[], others: number, passes: number): Rich => {
      const many = names.length + Math.max(0, others) > 1
      const isolated = names.map(ltr)
      const rest = (n: number, what: string) => `${n === 1 ? 'یک' : int(n)}${nb}${what}`
      let who: string
      if (others > 0 && names.length) who = `ماهواره‌های راداری ${list([...isolated, rest(others, 'ماهوارهٔ دیگر')])}`
      else if (others > 0) who = rest(others, 'ماهوارهٔ راداری')
      else if (names.length === 1) who = `ماهوارهٔ راداری ${isolated[0]}`
      else if (names.length) who = `ماهواره‌های راداری ${list(isolated)}`
      else who = 'ماهواره‌های راداری'
      return [
        `رادار به نور نیاز ندارد. این‌جا ${many ? 'در مجموع ' : ''}`,
        ...times(passes),
        ` در بُرد ${who} بود.`,
      ]
    },
    unpublished: (n: number) =>
      n === 1
        ? 'یکی از ماهواره‌های Sentinel-2 یا Landsat در روشنایی روز یک بار از فراز این‌جا گذشت، اما هنوز هیچ صحنه‌ای منتشر نشده است.'
        : // «در روشنایی روز» stands between the name and the count: «Landsat 3 بار» would read as the satellite Landsat 3
          `ماهواره‌های Sentinel-2 یا Landsat در روشنایی روز ${int(n)}${nb}بار از فراز این‌جا گذشتند، اما هنوز هیچ صحنه‌ای منتشر نشده است.`,
    none: 'هیچ ماهوارهٔ تصویربرداری با آرشیو باز در روشنایی روز از فراز این‌جا نگذشت.',
  },

  // ── the summary's readouts ───────────────────────────────────────────────────────────────
  verdictGroup: 'گذرها به تفکیک نوع. با هر کدام به فهرست همان دسته می‌روید.',
  verdictReadout: (n: number, _verdict: Verdict, title: string) => `${int(n)}${nb}گذر: ${title}`,

  // ── the footnotes ────────────────────────────────────────────────────────────────────────
  notes: {
    // The Latin names in the brackets are one isolated run; the ranges are said with «تا».
    counted: (o: { detailed: number; mosaics: number; radar: number; geo: number; passes: number; satellites: number }): Rich => {
      const out: Part[] = [strong(int(o.detailed)), `${nb}تصویر پرجزئیات (${ltr('Sentinel-2، Landsat')}، 10 تا 30${nb}متر)`]
      if (o.mosaics) out.push(' · ', strong(int(o.mosaics)), `${nb}موزاییک هواشناسی روزانه (250 تا 375${nb}متر)`)
      if (o.radar) out.push(' · ', strong(int(o.radar)), `${nb}تصویر راداری (${ltr('Sentinel-1')}، 20${nb}متر)`)
      if (o.geo) {
        out.push(
          ' · ',
          strong(int(o.geo)),
          `${nb}تصویر قرص کامل از ماهواره‌های هواشناسی زمین‌ایستا (2 تا 5${nb}کیلومتر؛ تازه‌ترین تصویر هر کدام نشان داده می‌شود)`,
        )
      }
      out.push(`. ${checked(o.passes, o.satellites)}`)
      return out
    },
    checked: (passes: number, satellites: number) => checked(passes, satellites),
    passTimes: (place: string, fetched: string | undefined, zoneLabel: string) =>
      `زمان هر گذر لحظه‌ای است که ماهواره در نزدیک‌ترین فاصله از ${iso(place)} بود و از عناصر مداری عمومی محاسبه شده است` +
      `${fetched ? ` (دریافت‌شده در ${ltr(whole(fetched))})` : ''}. زمان‌های محلی به وقت ${iso(whole(zoneLabel))} است.`,
  },

  // ── the panel ────────────────────────────────────────────────────────────────────────────
  sheetLabel: (place: string) => `ماهواره‌ها بر فراز ${place}`,
  computingPasses: 'در حال محاسبهٔ گذرها',
  sections: { summary: 'خلاصه', passes: 'گذرها', watchedContinuously: 'رصد پیوسته' },
  checkingArchives: 'در حال بررسی آرشیوها',
  invite: {
    text: 'چیزی این هفته شما را هم رصد کرد.',
    checkPlace: 'بررسی مکان شما',
    dismiss: 'بستن',
  },
  searchAnother: 'جستجوی مکانی دیگر',
  allPasses: 'همهٔ گذرها',

  footer: {
    replay: 'بازپخش',
    replayLabel: 'بازپخش گذر',
    replayTitle: 'بازپخش گذر روی کرهٔ زمین',
    shareLabel: { pass: 'اشتراک‌گذاری این گذر', image: 'اشتراک‌گذاری این تصویر' },
    shareButton: { pass: ['اشتراک‌گذاری', strong(' این گذر')] as Rich, image: ['اشتراک‌گذاری', strong(' این تصویر')] as Rich },
    checkPlace: [strong('بررسی '), 'مکان شما'] as Rich,
    clearest: [strong('دیدن '), 'بی‌ابرترین نما'] as Rich,
    clearestLabel: 'دیدن بی‌ابرترین نما',
  },

  // ── the headers ──────────────────────────────────────────────────────────────────────────
  head: {
    windowSpan: (n: number, startMs: number, endMs: number, timeZone: string) =>
      `${days(n)} · ${time.dayRange(startMs, endMs, timeZone, localParts(startMs, timeZone), localParts(endMs, timeZone))}`,
    verifying: 'بررسی موزاییک‌های هواشناسی',
    cancel: 'لغو',
    newSearch: 'جستجوی تازه',
    close: 'بستن',
    escKey: 'Esc',
    searchBarLabel: (place: string) => `جستجوی مکانی دیگر (اکنون: ${place})`,
    change: 'تغییر',
    computing: 'محاسبه',
    recent: 'اخیر',
    position: (k: number, n: number) => `گذر ${f.int(k)} از ${f.int(n)} در این دسته`,
    previous: 'گذر قبلی در این دسته',
    next: 'گذر بعدی در این دسته',
    // The arrows name the physical keys, which keep their meaning (fa.md §6.2.6).
    previousTitle: 'قبلی (←)',
    nextTitle: 'بعدی (→)',
    allPassesTitle: 'همهٔ گذرها (Esc)',
    shared: (sat: string, place: string) => `برای شما فرستاده شد · ${watchedBy(sat, place)}`,
    passWhen: (ms: number, timeZone: string, p: DateFields, clock: string, zone: string, approx: boolean) =>
      // The clock and its zone are one left-to-right island (LRI…PDI), or they read «EST 11:21» after the day.
      `${time.day(ms, timeZone, p)} · \u2066${approx ? `≈${nb}` : ''}${clock}${nb}${zone}\u2069`,
  },

  // ── the computing readout ────────────────────────────────────────────────────────────────
  computing: {
    stages: {
      catalog: { idle: 'کاتالوگ مداری', done: 'کاتالوگ بارگیری شد' },
      propagate: { idle: (n: number) => `محاسبهٔ مدارها · ${days(n)}`, done: 'مدارها محاسبه شد' },
      archive: { idle: 'آرشیوهای Sentinel-2 + Landsat', done: 'آرشیوها جستجو شد' },
      match: { idle: 'تطبیق صحنه‌ها با گذرها', done: 'صحنه‌ها تطبیق داده شد' },
    },
    ready: 'گزارش آماده است',
    ok: 'تمام',
    seconds: (s: number) => `${f.dec(s, 2)}${nb}ثانیه`,
    // Each end's clock is its own island; «تا» joins them, so the window's start sits on the right.
    window: (n: number, from: UtcWhen, to: UtcWhen): Rich => [
      strong(`بازهٔ ${int(n)}${nb}روزه · `),
      `${dayMonth(from.ms, 'UTC')} ${ltr(from.time)} تا ${dayMonth(to.ms, 'UTC')} ${ltr(`${to.time} UTC`)}`,
    ],
    percent: (pct: number) => `${f.int(pct)}%`,
    slow: 'آرشیوهای Planetary Computer و ناسا تصویرها را در لحظهٔ درخواست می‌سازند؛ این مرحله ممکن است چند ثانیه طول بکشد.',
    verySlow: 'آرشیوهای تصویر دیر پاسخ می‌دهند. اگر پاسخ ندهند، گذرها باز هم بر پایهٔ هندسهٔ مداری نشان داده می‌شوند و این را هم می‌گوییم.',
    sharedAlt: (sat: string | undefined, place: string) => `تصویری از ${place}، گرفته‌شده با ${aSat(sat)}، که برای شما فرستاده شد.`,
    sharedCaption: (sat: string | undefined, place: string, when?: PlaceWhen): Rich => [
      strong('برای شما فرستاده شد'),
      ` · ${watchedBy(sat, place)}${when ? ` · ${day(when.ms, when.timeZone)}، ${ltr(when.time)}` : ''}`,
    ],
  },

  // ── 03 / رصد پیوسته: geostationary weather satellites ────────────────────────────────────
  geo: {
    none: `هیچ ماهوارهٔ هواشناسی زمین‌ایستای فعالی این مکان را بالاتر از زاویهٔ ارتفاع ${ltr('5°')} نمی‌بیند.`,
    // The seat and the angle are isolated: otherwise the digits turn around the degree sign.
    facts: (lon: string, elevationDeg: number, cadenceMin: number) =>
      `${ltr(lon)} · ${ltr(`${f.dec(elevationDeg, 1)}°`)} بالای افق · هر ${f.int(cadenceMin)}${nb}دقیقه`,
    images: (n: number, d: number): Rich => [num(int(n)), `${nb}تصویر ${d === 7 ? 'در این هفته' : `در ${days(d)}`}`],
    replay: 'بازپخش',
    replayLabel: (sat: string) => `${theSat(sat)}: بازپخش تازه‌ترین تصویر`,
    frame: {
      probing: 'در حال جستجو…',
      noPublic: 'بدون تصویر عمومی',
      poorQuality: 'کیفیت پایین',
      noneNow: 'فعلاً تصویری نیست',
      unavailable: 'قاب در دسترس نیست',
    },
    frameAlt: (sat: string, infrared: boolean) => `${theSat(sat)}: تازه‌ترین قاب ${infrared ? 'فروسرخ ' : ''}پیرامون این مکان`,
    infraredChip: 'IR',
    infraredTitle: 'فروسرخ: دمای بالای ابرها؛ هرچه سردتر، روشن‌تر',
  },

  // ── 04 / خط زمانی ────────────────────────────────────────────────────────────────────────
  timeline: {
    title: 'خط زمانی',
    // Two Latin labels between neutrals would merge and read backwards: each is its own island.
    meta: (n: number, zoneLabel: string, zones?: string) => `${days(n)} · ${iso(zoneLabel)}${zones ? ` · ${iso(zones)}` : ''}`,
    zoneChange: (before: string, after: string) => `${iso(before)} ← ${iso(after)}`,
    daylight: 'روشنایی روز در این‌جا',
    // A verdict's name cannot follow a bare count in Persian, so each name is a label before its count, and «؛»
    // separates the pairs (a colon inside a colon list blurs where each ends).
    summary: (n: number, counts: Record<Verdict, number>, titles: Readonly<Record<Verdict, string>>) =>
      `خط زمانی، ${days(n)}. ` + VERDICT_ORDER.map((v) => `${titles[v]}: ${f.int(counts[v])}`).join('؛ ') + '.',
    keysHint: (summary: string) => `${summary} با کلیدهای پیکان چپ و راست میان گذرها جابه‌جا شوید.`,
    geoLane: (n: number): Rich => [strong('زمین‌ایستا · '), f.int(n)],
    geoNames: (names: readonly string[]) => names.join('، '),
    now: 'اکنون',
    geometry: (deg: number, km: number) => `انحراف ${ltr(`${f.dec(deg, 1)}°`)} · ${f.int(km)}${nb}کیلومتر`,
    markMosaic: (gsdM: number) => `موزاییک روزانه، ${f.int(gsdM)}${nb}متر · ●`,
    markRadar: (gsdM: number) => `تصویر راداری، ${f.int(gsdM)}${nb}متر · ◆`,
    markImaged: (title: string) => `${title} · ◆`,
    markKind: (title: string, category: SatCategory) => `${title} · ${MARK_KIND[category] ?? 'سایر'}`,
  },

  // ── 02 / بازپخش ──────────────────────────────────────────────────────────────────────────
  replay: {
    scrubLabel: 'زمان صحنه در طول گذر',
    scrubValue: (tMinus: string, utc: string) => `${tMinus}، ${utc}`,
    play: 'شروع بازپخش',
    pause: 'مکث بازپخش',
    speed: 'سرعت بازپخش',
    inView: (duration: string) => `در میدان دید: ${duration}`,
    closest: 'نزدیک‌ترین',
    spaceKey: 'فاصله',
    playPause: 'پخش / مکث',
    stepKind: 'گذر قبلی / بعدی در این دسته',
  },

  // ── the plan view ────────────────────────────────────────────────────────────────────────
  plan: {
    label: (sat: string, km: number) =>
      `نقشهٔ گذر: مسیر زمینی ${theSat(sat)}، که در نزدیک‌ترین نقطه ${f.int(km)}${nb}کیلومتر با این مکان فاصله داشت.`,
    northUp: 'نقشه · شمال بالا',
    // The angle is isolated: after a Persian word «±30°» would display «°30±».
    fieldOfRegard: (deg: number) => `چرخش ${ltr(`±${deg}°`)}`,
    swath: (km: number) => `نوار ${f.int(km)}${nb}کیلومتری`,
    groundTrack: 'مسیر زمینی',
    scale: (km: number) => `${km >= 1 ? f.int(km) : f.dec(km, 1)}${nb}کیلومتر`,
    closest: (km: number) => (km < 1 ? `نزدیک‌ترین زیر 1${nb}کیلومتر` : `نزدیک‌ترین ${f.int(km)}${nb}کیلومتر`),
  },

  // ── a picture's product line ─────────────────────────────────────────────────────────────
  // A Latin product code is isolated, so the pixel's digits keep their «متر» beside them.
  product: {
    mosaic: (m: number) => `موزاییک روزانه · ${m}${nb}متر`,
    fullDisc: (km: number) => `قرص کامل · ${km}${nb}کیلومتر`,
    infrared: (km: number) => `فروسرخ · ${km}${nb}کیلومتر`,
    sentinel2: (m: number) => `${ltr('Sentinel-2 L2A')} · ${m}${nb}متر`,
    landsat: (m: number) => `${ltr('Landsat C2 L2')} · ${m}${nb}متر`,
    sentinel1: (m: number) => `رادار ${ltr('Sentinel-1')} · ${m}${nb}متر`,
    other: (m: number) => `${m}${nb}متر`,
  },
  pixel: { m: (m: number) => `${m}${nb}متر`, km: (km: number) => `${km}${nb}کیلومتر` },

  // ── the time-lapse's row ─────────────────────────────────────────────────────────────────
  timelapse: {
    title: 'گذر سال‌ها',
    sub: 'این مکان، سال به سال',
  },
}
export default results
