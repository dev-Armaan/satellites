/**
 * Arabic copy for the results panel (see docs/i18n/ar.md §3.3, §3.7 "`results`", §5, §6, the authority on every line
 * here): the headline and its second line, the reasons no image was made public, the footnotes, the computing
 * readout, the headers and footer, the timeline, the replay controls, the plan view, the geostationary rows and the
 * picture captions.
 *
 * Why it is built this way:
 *  - The headline puts the time first, then the verb, then the count, then the place: «خلال آخر 7 أيام، **رصد 256
 *    قمرًا صناعيًا** *Waterloo*.» The verb is masculine singular for every count (verb first, it agrees with «قمر»),
 *    and the place, last, can only read as its object. One and two are words («قمر صناعي واحد»، «قمران صناعيان»), so
 *    their strong part has no number. Zero is its own sentence, its subject named before the place («لم يرصد أي قمر
 *    صناعي نتتبّعه *Waterloo*»), so nobody reads "Waterloo watched no satellite".
 *  - The second line is a passive that agrees with «صورة» in every category («نُشرت للعموم 7 صور»). "At least" («على
 *    الأقل», with its leading space) sits before the full stop, so the line reads with and without it.
 *  - The place is the gazetteer's word: never a subject, never with an attached preposition, an article or a pronoun
 *    pointing back at it. Sentences about it say «المكان» (our noun), and the satellite follows its head noun
 *    «القمر الصناعي» (a no-break space between them), or an indefinite «قمر صناعي» when it has no name. A crewed
 *    station is «المحطة الفضائية ISS» (f), recognised by its display name since no message carries a crewed flag: the
 *    shared tag and the plan's name can show one (every ISS pass has a plan and no picture).
 *  - Counts take all six CLDR forms. In sentences one and two are words; where the digit is its own figure beside its
 *    unit (the footnote's bold counts, a row's image count), the digit stays and the noun agrees with it («2 صورتان»).
 *    A no-break space ties every number to its noun or unit. Arabic units follow a num() island as text: inside it
 *    (`direction: ltr`) they would read before their number.
 *  - Bidi: every DOM-only string that would put a Latin run, a degree or a stamp where right-to-left text reorders it
 *    isolates that one run with LRI…PDI (ar.md §6.2.5, §6.2.7): the timeline's zones, a product code before its pixel
 *    («Sentinel-2 L2A · 10 م», else «م» lands on the far side of the code), a degree after an Arabic word («°8.9»
 *    otherwise), the fetch stamp (its date reads backwards otherwise). Ranges keep «←»; a counter's ends stay apart.
 *  - Mono labels are nouns or masdars with the article; buttons are masdars, never an imperative to the reader.
 */
import type en from '../en/results'
import type { PlaceWhen, UtcWhen, WindowWhen } from '../en/results'
import { fmt } from '../../../api/_lib/i18n/format'
import { accent, num, strong, type Part, type Rich } from '../../../api/_lib/i18n/parts'
import type { Pass, SatCategory } from '@/types'
import { localParts, type DateFields } from '@/ui/results/lib/time'
import time from './time'

const f = fmt('ar')
const nb = '\u00a0'
type Verdict = Pass['verdict']
type Forms = { one: string; two: string; few: string; many: string; other: string }

/** U+2066 LEFT-TO-RIGHT ISOLATE … U+2069 POP DIRECTIONAL ISOLATE: one left-to-right run in a DOM-only string */
const ltr = (s: string) => `\u2066${s}\u2069`
/**
 * Isolate a Latin label (a zone, a zone name, a place), but leave one that holds Arabic words or isolates already as it
 * is. A place searched by coordinates needs it most: «23.5000°N 12.5000°E» at the end of the headline read
 * «N 12.5000°E°23.5000.».
 */
const iso = (s: string) => (/[\u0600-\u06ff\u2066-\u2069]/.test(s) ? s : ltr(s))
/** A whole count, or a fraction kept (its plural category is `other`) */
const int = (n: number) => (Number.isInteger(n) ? f.int(n) : f.dec(n, 1))
/** A count and its noun: `one` and `two` hold the whole phrase (words, no digit), else the digit before the form */
const count = (n: number, w: Forms) =>
  f.plural(n, {
    zero: `${int(n)}${nb}${w.other}`,
    one: w.one,
    two: w.two,
    few: `${int(n)}${nb}${w.few}`,
    many: `${int(n)}${nb}${w.many}`,
    other: `${int(n)}${nb}${w.other}`,
  })
/** The noun beside its own digit (readouts): it agrees with the digit, which always stays */
const unit = (n: number, w: Forms) => f.plural(n, { zero: w.other, one: w.other, two: w.two, few: w.few, many: w.many, other: w.other })

/** Standing alone or as a subject (nominative): «يوم واحد»، «يومان»، «7 أيام» */
const DAYS: Forms = { one: 'يوم واحد', two: 'يومان', few: 'أيام', many: 'يومًا', other: 'يوم' }
/** After a preposition or a noun (genitive): «خلال يومين»، «نافذة يومين» */
const DAYS_GEN: Forms = { one: 'يوم واحد', two: 'يومين', few: 'أيام', many: 'يومًا', other: 'يوم' }
/** Passes in a run of text: «مرة واحدة»، «مرتان»، «3 مرات»، «31 مرة» */
const PASSES: Forms = { one: 'مرة واحدة', two: 'مرتان', few: 'مرات', many: 'مرة', other: 'مرة' }
/** Images beside their digit: «1 صورة»، «2 صورتان»، «7 صور»، «143 صورة» */
const IMAGES: Forms = { one: 'صورة', two: 'صورتان', few: 'صور', many: 'صورة', other: 'صورة' }

/** «آخر يوم» · «آخر يومين» · «آخر 7 أيام» · «آخر 11 يومًا» · «آخر 100 يوم» (as the landing's kicker says it) */
const lastDays = (n: number) =>
  f.plural(n, {
    zero: `آخر ${int(n)}${nb}يوم`,
    one: 'آخر يوم',
    two: 'آخر يومين',
    few: `آخر ${int(n)}${nb}أيام`,
    many: `آخر ${int(n)}${nb}يومًا`,
    other: `آخر ${int(n)}${nb}يوم`,
  })

/** "N times", adverbially (the dual in ـين): «مرة واحدة» · «مرتين» · «3 مرات» · «42 مرة», the number its own island */
const times = (n: number): Part[] =>
  f.plural<Part[]>(n, {
    zero: [num(int(n)), `${nb}مرة`],
    one: ['مرة واحدة'],
    two: ['مرتين'],
    few: [num(int(n)), `${nb}مرات`],
    many: [num(int(n)), `${nb}مرة`],
    other: [num(int(n)), `${nb}مرة`],
  })

/** The full stop after a place that ends a sentence, unless the name already ends on one («D.C.») */
const stop = (place: string) => (/[.…!?؟]$/u.test(place) ? '' : '.')
/** «القمر الصناعي Sentinel-2C»: the head noun carries the gender; a nameless one is an indefinite «قمر صناعي» */
const theSat = (sat: string) => `القمر الصناعي${nb}${sat}`
const aSat = (sat: string | undefined) => (sat ? theSat(sat) : 'قمر صناعي')
/** Display names of the crewed stations (src/engine/profiles.ts: ISS, Tiangong): no message carries a crewed flag */
const CREWED = /^(ISS|Tiangong)\b/
/**
 * Nominal "[SAT] watched", so the name and a place after it never touch: «القمر الصناعي X رصد» (m), or
 * «المحطة الفضائية ISS رصدت» (f) for a station
 */
const satWatched = (sat: string) => (CREWED.test(sat) ? `المحطة الفضائية${nb}${sat} رصدت` : `${theSat(sat)} رصد`)

/** «29 أكتوبر» / «الأحد، 1 نوفمبر» at a zone: the ar 'time' namespace's forms, from the instant */
const dayMonth = (ms: number, timeZone: string) => time.dayMonth(ms, timeZone, localParts(ms, timeZone))
const day = (ms: number, timeZone: string) => time.day(ms, timeZone, localParts(ms, timeZone))

/** «فُحصت 1,234 مرة مرور لعدد 250 من أقمار التصوير والمحطات المأهولة.»: «لعدد … من» needs no form per count */
const checked = (passes: number, sats: number) => {
  const of = `لعدد ${f.int(sats)} من أقمار التصوير والمحطات المأهولة`
  return f.plural(passes, {
    zero: `فُحص عدد ${f.int(sats)} من أقمار التصوير والمحطات المأهولة، ولم يمرّ أي منها فوق المكان.`,
    one: `فُحصت مرة مرور واحدة ${of}.`,
    two: `فُحصت مرتا مرور ${of}.`,
    few: `فُحصت ${int(passes)}${nb}مرات مرور ${of}.`,
    many: `فُحصت ${int(passes)}${nb}مرة مرور ${of}.`,
    other: `فُحصت ${int(passes)}${nb}مرة مرور ${of}.`,
  })
}

/** The footnote's kinds of image, each beside its bold digit */
const DETAILED: Forms = { one: 'صورة مفصّلة', two: 'صورتان مفصّلتان', few: 'صور مفصّلة', many: 'صورة مفصّلة', other: 'صورة مفصّلة' }
const MOSAICS: Forms = {
  one: 'صورة فسيفساء طقس يومية',
  two: 'صورتا فسيفساء طقس يومية',
  few: 'صور فسيفساء طقس يومية',
  many: 'صورة فسيفساء طقس يومية',
  other: 'صورة فسيفساء طقس يومية',
}
const RADAR_IMAGES: Forms = { one: 'صورة رادارية', two: 'صورتان راداريتان', few: 'صور رادارية', many: 'صورة رادارية', other: 'صورة رادارية' }
const GEO_IMAGES: Forms = {
  one: 'صورة للقرص الكامل',
  two: 'صورتان للقرص الكامل',
  few: 'صور للقرص الكامل',
  many: 'صورة للقرص الكامل',
  other: 'صورة للقرص الكامل',
}

/** "and N other radar satellites", the last item of a list (nominative): «قمر آخر» … «7 أقمار أخرى» … «11 قمرًا آخر» */
const OTHER_SATS: Forms = { one: 'قمر آخر', two: 'قمران آخران', few: 'أقمار أخرى', many: 'قمرًا آخر', other: 'قمر آخر' }
/** Radar satellites counted as a subject, with no name to lead them */
const RADAR_SATS: Forms = { one: 'قمر رادار واحد', two: 'قمرا رادار', few: 'أقمار رادار', many: 'قمر رادار', other: 'قمر رادار' }

/** What a pass's mark stands for in the timeline's tooltip, by the satellite's category: its kind and the mark's shape */
const MARK_KIND: Partial<Record<SatCategory, string>> = {
  'open-optical': 'تصوير مفتوح · ◇',
  'commercial-optical': 'تجاري · □',
  radar: 'رادار · ▣',
  'weather-leo': 'طقس · ○',
  crewed: 'مأهول · ✛',
}

const VERDICT_ORDER = ['imaged', 'likely', 'could', 'overhead'] as const

const results: typeof en = {
  // ── the headline ─────────────────────────────────────────────────────────────────────────
  headline: {
    watched: (n: number, place: string, when: WindowWhen): Rich => {
      const window =
        'lastDays' in when
          ? `خلال ${lastDays(when.lastDays)}، `
          : `من ${dayMonth(when.fromMs, when.timeZone)} إلى ${dayMonth(when.toMs, when.timeZone)}، `
      const phrase = f.plural<Part[]>(n, {
        zero: ['رصد ', num(int(n)), `${nb}قمر صناعي`],
        one: ['رصد قمر صناعي واحد'],
        two: ['رصد قمران صناعيان'],
        few: ['رصد ', num(int(n)), `${nb}أقمار صناعية`],
        many: ['رصد ', num(int(n)), `${nb}قمرًا صناعيًا`],
        other: ['رصد ', num(int(n)), `${nb}قمر صناعي`],
      })
      return [window, strong(...phrase), ' ', accent(iso(place)), stop(place)]
    },
    none: (place: string, past: boolean): Rich => [
      `${past ? 'في ذلك الأسبوع' : 'هذا الأسبوع'}، لم يرصد أي قمر صناعي نتتبّعه `,
      accent(iso(place)),
      stop(place),
    ],
  },

  // ── the second line ──────────────────────────────────────────────────────────────────────
  // `k` is 1 or more; a zero would say "none yet" («بعد» taking the place of "at least").
  imagesPublic: (k: number): Rich => {
    const atLeast = strong(' على الأقل')
    return f.plural<Rich>(k, {
      zero: ['لم تُنشر للعموم أي صورة', strong(' بعد'), '.'],
      one: ['نُشرت للعموم صورة واحدة', atLeast, '.'],
      two: ['نُشرت للعموم صورتان', atLeast, '.'],
      few: ['نُشرت للعموم ', num(int(k)), `${nb}صور`, atLeast, '.'],
      many: ['نُشرت للعموم ', num(int(k)), `${nb}صورة`, atLeast, '.'],
      other: ['نُشرت للعموم ', num(int(k)), `${nb}صورة`, atLeast, '.'],
    })
  },
  noImages: { thisWeek: 'لم تُنشر للعموم أي صورة هذا الأسبوع.', thatWeek: 'لم تُنشر للعموم أي صورة في ذلك الأسبوع.' },
  archiveDown: 'لم تستجب أرشيفات الصور، لذا لا يمكننا الآن عدّ الصور المنشورة للعموم.',
  tryAgain: 'إعادة المحاولة',
  share: 'مشاركة',
  shareWeekLabel: (place: string, past: boolean) => `مشاركة ${past ? 'ذلك' : 'هذا'} الأسبوع في ${place}`,

  why: {
    sunNeverRose: 'لم تشرق الشمس، فلم تتمكن أي كاميرا نهارية من رؤية المكان.',
    sunBarelyRose: 'بالكاد أشرقت الشمس، فلم تتمكن أي كاميرا نهارية من رؤية المكان.',
    // "Swept it in infrared" is «غطّى», the likely verdict's verb, never «مسح» (ar.md §8).
    infrared: (n: number): Rich => ['ومع ذلك، غطّت أقمار الطقس المكان بالأشعة تحت الحمراء ', ...times(n), '.'],
    // A list as the subject takes a plural head noun first («مرّت أقمار الرادار Umbra-08 وCapella-14 و7 أقمار أخرى»).
    // One or two satellites in all take the singular head noun, repeated before a second name: a dual before names
    // would misread (ar.md §5.3).
    radar: (names: readonly string[], others: number, passes: number): Rich => {
      let who: string
      if (others > 0 && names.length === 1 && f.category(others) === 'one') who = `مرّ قمر الرادار ${names[0]} وقمر رادار آخر`
      else if (others > 0 && names.length) who = `مرّت أقمار الرادار ${f.list([...names, count(others, OTHER_SATS)])}`
      else if (others > 0) who = `مرّ ${count(others, RADAR_SATS)}`
      else if (names.length === 1) who = `مرّ قمر الرادار ${names[0]}`
      else if (names.length === 2) who = `مرّ قمر الرادار ${names[0]} وقمر الرادار ${names[1]}`
      else if (names.length) who = `مرّت أقمار الرادار ${f.list(names)}`
      else who = 'مرّت أقمار الرادار'
      return [`لا يحتاج الرادار إلى الضوء. ${who} ضمن المدى `, ...times(passes), '.']
    },
    // One pass is one satellite: «مرّ أحد أقمار …» (never a bare «قمر», the Moon); more take the mission's plural with
    // a feminine verb.
    unpublished: (n: number) => {
      const plural = (t: string) => `مرّت أقمار Sentinel-2 أو Landsat فوق المكان نهارًا ${t}، لكن لم يُنشر أي مشهد بعد.`
      return f.plural(n, {
        zero: plural(`${int(n)}${nb}مرة`),
        one: 'مرّ أحد أقمار Sentinel-2 أو Landsat فوق المكان نهارًا مرة واحدة، لكن لم يُنشر أي مشهد بعد.',
        two: plural('مرتين'),
        few: plural(`${int(n)}${nb}مرات`),
        many: plural(`${int(n)}${nb}مرة`),
        other: plural(`${int(n)}${nb}مرة`),
      })
    },
    none: 'لم يمرّ فوق المكان نهارًا أي قمر تصوير ذي أرشيف مفتوح.',
  },

  // ── the summary's readouts ───────────────────────────────────────────────────────────────
  verdictGroup: 'مرات المرور بحسب الحكم. كل منها ينقل إلى قائمته.',
  // A spoken run of text, so one and two are words («مرة واحدة: رصد»); every verdict counts passes alike.
  verdictReadout: (n: number, _verdict: Verdict, title: string) => `${count(n, PASSES)}: ${title}`,

  // ── the footnotes ────────────────────────────────────────────────────────────────────────
  notes: {
    // The Latin names in the brackets are one isolated run: after them a bare number would join their run and push
    // its «م» to the far side.
    counted: (o: { detailed: number; mosaics: number; radar: number; geo: number; passes: number; satellites: number }): Rich => {
      const out: Part[] = [strong(int(o.detailed)), `${nb}${unit(o.detailed, DETAILED)} (${ltr('Sentinel-2، Landsat')}، 10–30${nb}م)`]
      if (o.mosaics) out.push(' · ', strong(int(o.mosaics)), `${nb}${unit(o.mosaics, MOSAICS)} (250–375${nb}م)`)
      if (o.radar) out.push(' · ', strong(int(o.radar)), `${nb}${unit(o.radar, RADAR_IMAGES)} (${ltr('Sentinel-1')}، 20${nb}م)`)
      if (o.geo) {
        out.push(
          ' · ',
          strong(int(o.geo)),
          `${nb}${unit(o.geo, GEO_IMAGES)} من أقمار الطقس الثابتة (2–5${nb}كم؛ تُعرض أحدث صورة من كل منها)`,
        )
      }
      out.push(`. ${checked(o.passes, o.satellites)}`)
      return out
    },
    checked: (passes: number, satellites: number) => checked(passes, satellites),
    passTimes: (place: string, fetched: string | undefined, zoneLabel: string) =>
      `أوقات المرور هي اللحظات التي كان فيها كل قمر صناعي أقرب ما يكون إلى ${iso(place)}، محسوبة من عناصر مدارية عامة` +
      `${fetched ? ` (جُلبت ${ltr(fetched)})` : ''}. الأوقات المحلية بتوقيت ${zoneLabel}.`,
  },

  // ── the panel ────────────────────────────────────────────────────────────────────────────
  sheetLabel: (place: string) => `الأقمار الصناعية فوق ${place}`,
  computingPasses: 'جارٍ حساب مرات المرور',
  sections: { summary: 'الملخص', passes: 'مرات المرور', watchedContinuously: 'رصد متواصل' },
  checkingArchives: 'جارٍ البحث في الأرشيفات',
  invite: {
    text: 'ثمّة شيء رصدك أنت أيضًا هذا الأسبوع.',
    checkPlace: 'التحقق من مكانك',
    dismiss: 'إغلاق',
  },
  searchAnother: 'البحث عن مكان آخر',
  allPasses: 'كل مرات المرور',

  footer: {
    replay: 'إعادة العرض',
    replayLabel: 'إعادة عرض المرور',
    replayTitle: 'إعادة عرض المرور على الكرة الأرضية',
    shareLabel: { pass: 'مشاركة هذا المرور', image: 'مشاركة هذه الصورة' },
    shareButton: { pass: ['مشاركة', strong(' هذا المرور')] as Rich, image: ['مشاركة', strong(' هذه الصورة')] as Rich },
    checkPlace: [strong('التحقق من '), 'مكانك'] as Rich,
    clearest: [strong('عرض '), 'أصفى نظرة'] as Rich,
    clearestLabel: 'عرض أصفى نظرة',
  },

  // ── the headers ──────────────────────────────────────────────────────────────────────────
  head: {
    windowSpan: (days: number, startMs: number, endMs: number, timeZone: string) =>
      `${count(days, DAYS)} · ${time.dayRange(startMs, endMs, timeZone, localParts(startMs, timeZone), localParts(endMs, timeZone))}`,
    verifying: 'جارٍ التحقق من فسيفساء الطقس',
    cancel: 'إلغاء',
    newSearch: 'بحث جديد',
    close: 'إغلاق',
    escKey: 'Esc',
    searchBarLabel: (place: string) => `البحث عن مكان آخر (الحالي: ${place})`,
    change: 'تغيير',
    computing: 'جارٍ الحساب',
    recent: 'الأخيرة',
    position: (k: number, n: number) => `المرور ${f.int(k)} من ${f.int(n)} من هذا النوع`,
    previous: 'المرور السابق من هذا النوع',
    next: 'المرور التالي من هذا النوع',
    // The arrows name the physical keys, which keep their meaning (ar.md §6.2.8).
    previousTitle: 'السابق (←)',
    nextTitle: 'التالي (→)',
    allPassesTitle: 'كل مرات المرور (Esc)',
    // Nominal, so the satellite's name and the place never touch (ar.md §5.2); a shared ISS pass is the station's.
    shared: (sat: string, place: string) => `تمت مشاركته معك · ${satWatched(sat)} ${iso(place)}`,
    passWhen: (ms: number, timeZone: string, p: DateFields, clock: string, zone: string, approx: boolean) =>
      // The clock and its zone are one left-to-right island (LRI…PDI), or they read «UTC-5 11:21» after the day.
      `${time.day(ms, timeZone, p)} · \u2066${approx ? `≈${nb}` : ''}${clock}${nb}${zone}\u2069`,
  },

  // ── the computing readout ────────────────────────────────────────────────────────────────
  computing: {
    stages: {
      catalog: { idle: 'كتالوج المدارات', done: 'حُمّل الكتالوج' },
      propagate: { idle: (days: number) => `حساب المدارات · ${count(days, DAYS)}`, done: 'حُسبت المدارات' },
      archive: { idle: 'أرشيف Sentinel-2 + Landsat', done: 'اكتمل البحث في الأرشيفات' },
      // «مع», as the engine's running line in the same cell has to say it («مطابقة 31 مشهدًا مع 412 مرة مرور»).
      match: { idle: 'مطابقة المشاهد مع مرات المرور', done: 'طوبقت المشاهد' },
    },
    ready: 'التقرير جاهز',
    ok: 'تم',
    seconds: (s: number) => `${f.dec(s, 2)}${nb}ث`,
    // Each end is its own island, joined by «←», so the window's start sits on the right.
    window: (days: number, from: UtcWhen, to: UtcWhen): Rich => [
      strong(`نافذة ${count(days, DAYS_GEN)} · `),
      `${dayMonth(from.ms, 'UTC')} ${from.time} ← ${dayMonth(to.ms, 'UTC')} ${to.time}${nb}UTC`,
    ],
    percent: (pct: number) => `${f.int(pct)}%`,
    slow: 'يرسم أرشيف Planetary Computer وناسا الصور عند الطلب؛ قد تستغرق هذه الخطوة بضع ثوانٍ.',
    verySlow: 'أرشيفات الصور بطيئة في الرد. إن لم تستجب، فستظهر مرات المرور من الحسابات المدارية مع ذلك، وسنذكر ذلك.',
    // The place stands in a construct («صورة Waterloo»), the satellite after «من».
    sharedAlt: (sat: string | undefined, place: string) => `صورة ${place} من ${aSat(sat)}، تمت مشاركتها معك.`,
    sharedCaption: (sat: string | undefined, place: string, when?: PlaceWhen): Rich => [
      strong('تمت مشاركته معك'),
      ` · ${sat ? `${satWatched(sat)} ${iso(place)}` : `رصد قمر صناعي ${iso(place)}`}${when ? ` · ${day(when.ms, when.timeZone)}، ${when.time}` : ''}`,
    ],
  },

  // ── 03 / رصد متواصل: geostationary weather satellites ────────────────────────────────────
  geo: {
    none: `لا يرى أي قمر طقس ثابت عامل هذا المكان فوق زاوية ارتفاع ${ltr('5°')}.`,
    // The seat is isolated: otherwise the elevation's digits join its Latin run and read before it.
    facts: (lon: string, elevationDeg: number, cadenceMin: number) =>
      `${ltr(lon)} · ${f.dec(elevationDeg, 1)}° ارتفاعًا · كل ${f.int(cadenceMin)}${nb}د`,
    // A row's figure: the digit stays and the noun agrees with it («2 صورتان»).
    images: (n: number, days: number): Rich => [
      num(int(n)),
      `${nb}${unit(n, IMAGES)} ${days === 7 ? 'هذا الأسبوع' : `خلال ${count(days, DAYS_GEN)}`}`,
    ],
    replay: 'إعادة العرض',
    replayLabel: (sat: string) => `${theSat(sat)}: إعادة عرض أحدث صورة`,
    frame: {
      probing: 'جارٍ البحث…',
      noPublic: 'لا صورة منشورة',
      poorQuality: 'جودة رديئة',
      noneNow: 'لا صورة الآن',
      unavailable: 'الإطار غير متاح',
    },
    frameAlt: (sat: string, infrared: boolean) => `${theSat(sat)}: أحدث إطار ${infrared ? 'بالأشعة تحت الحمراء ' : ''}حول المكان`,
    infraredChip: 'IR',
    infraredTitle: 'الأشعة تحت الحمراء: قمم السحب بحسب حرارتها، والأبرد أفتح',
  },

  // ── 04 / الخط الزمني ─────────────────────────────────────────────────────────────────────
  timeline: {
    title: 'الخط الزمني',
    // Two Latin labels between neutrals would merge and read backwards: each is its own island.
    meta: (days: number, zoneLabel: string, zones: string) => `${count(days, DAYS)} · ${iso(zoneLabel)} · ${iso(zones)}`,
    zoneChange: (before: string, after: string) => `${iso(before)} ← ${iso(after)}`,
    daylight: 'النهار هنا',
    // A verdict's name cannot follow a bare count in Arabic, so each name is a label before its count.
    summary: (days: number, counts: Record<Verdict, number>, titles: Readonly<Record<Verdict, string>>) =>
      `الخط الزمني، ${count(days, DAYS)}: ` + VERDICT_ORDER.map((v) => `${titles[v]}: ${f.int(counts[v])}`).join('، ') + '.',
    keysHint: (summary: string) => `${summary} مفتاحا السهم الأيسر والأيمن يتنقلان بين مرات المرور.`,
    geoLane: (n: number): Rich => [strong('ثابت · '), f.int(n)],
    geoNames: (names: readonly string[]) => names.join('، '),
    now: 'الآن',
    geometry: (deg: number, km: number) => `انحراف ${ltr(`${f.dec(deg, 1)}°`)} · ${f.int(km)}${nb}كم`,
    markMosaic: (gsdM: number) => `فسيفساء يومية، ${f.int(gsdM)}${nb}م · ●`,
    markRadar: (gsdM: number) => `صورة رادارية، ${f.int(gsdM)}${nb}م · ◆`,
    markImaged: (title: string) => `${title} · ◆`,
    markKind: (title: string, category: SatCategory) => `${title} · ${MARK_KIND[category] ?? 'أخرى'}`,
  },

  // ── 02 / إعادة العرض ─────────────────────────────────────────────────────────────────────
  replay: {
    scrubLabel: 'وقت المشهد خلال المرور',
    scrubValue: (tMinus: string, utc: string) => `${tMinus}، ${utc}`,
    play: 'تشغيل إعادة العرض',
    pause: 'إيقاف إعادة العرض مؤقتًا',
    speed: 'سرعة إعادة العرض',
    inView: (duration: string) => `ضمن المدى ${duration}`,
    closest: 'الأقرب',
    spaceKey: 'مسافة',
    playPause: 'تشغيل / إيقاف',
    stepKind: 'المرور السابق / التالي من هذا النوع',
  },

  // ── the plan view ────────────────────────────────────────────────────────────────────────
  plan: {
    label: (sat: string, km: number) =>
      `منظر علوي: المسار الأرضي ${CREWED.test(sat) ? 'للمحطة الفضائية' : 'للقمر الصناعي'}${nb}${sat}، ` +
      `على بعد ${f.int(km)}${nb}كم من المكان عند أقرب نقطة.`,
    // No longer than the English (104 px at 9.5 px): «منظر علوي · …» measured 132 px. The drawing's and its section's
    // accessible names and the visible no-image line («منظر علوي للمرور.») already say "plan" (ar.md §7, strategy 2).
    northUp: 'الشمال للأعلى',
    // The angle is isolated: after an Arabic word «±30°» would display «°30±».
    fieldOfRegard: (deg: number) => `مدى التوجيه ${ltr(`±${deg}°`)}`,
    swath: (km: number) => `نطاق المسح ${f.int(km)}${nb}كم`,
    groundTrack: 'المسار الأرضي',
    scale: (km: number) => `${km >= 1 ? f.int(km) : f.dec(km, 1)}${nb}كم`,
    closest: (km: number) => (km < 1 ? `الأقرب أقل من 1${nb}كم` : `الأقرب ${f.int(km)}${nb}كم`),
  },

  // ── a picture's product line ─────────────────────────────────────────────────────────────
  // A Latin product code is isolated, so the pixel's digits keep their «م» beside them (ar.md §6.2.5).
  product: {
    mosaic: (m: number) => `فسيفساء يومية · ${m}${nb}م`,
    fullDisc: (km: number) => `القرص الكامل · ${km}${nb}كم`,
    infrared: (km: number) => `تحت الحمراء · ${km}${nb}كم`,
    sentinel2: (m: number) => `${ltr('Sentinel-2 L2A')} · ${m}${nb}م`,
    landsat: (m: number) => `${ltr('Landsat C2 L2')} · ${m}${nb}م`,
    sentinel1: (m: number) => `رادار ${ltr('Sentinel-1')} · ${m}${nb}م`,
    other: (m: number) => `${m}${nb}م`,
  },
  pixel: { m: (m: number) => `${m}${nb}م`, km: (km: number) => `${km}${nb}كم` },

  // ── the time-lapse's row ─────────────────────────────────────────────────────────────────
  timelapse: {
    title: 'عبر السنين',
    sub: 'هذا المكان، عامًا بعد عام',
  },
}
export default results
