/**
 * Arabic copy for one pass's paragraph, the sentences under a pass's picture or plan view (see docs/i18n/ar.md §3.4,
 * the authority on every sentence here; §4.2 for the compass, §5 for the slots).
 *
 * Why it reads this way:
 *  - Verb first, and the satellite always follows its head noun «القمر الصناعي» (a no-break space between them), so
 *    the verb and every later pronoun are masculine («كان ينظر»، «راداره»، «مشغّله»، «نطاق مسحه») and no sentence starts
 *    with a Latin name. A crewed station is «المحطة الفضائية ISS» (f: «مرّت»), never «القمر الصناعي ISS» (ar.md §0,
 *    §9.1). No message carries a crewed flag, so the station is recognised by the display name the catalog gives it
 *    (ISS, Tiangong); `overhead` is the only sentence here that names one, and darkStation's «المحطة» then agrees.
 *  - The place is the gazetteer's word, so it is never a subject, never takes an attached preposition, an article or a
 *    pronoun that points back at it: it stands as an object after a named subject («رصد راداره [PLACE]»), after a
 *    separate preposition or in a construct («صورة [PLACE]»). The sentences that receive no place say «المكان» (our
 *    noun, m, so «فوقه» is safe) or let the offset speak.
 *  - "Crossed" is «مرّ» (with its shadda), never «حلّق», the word for warplanes over Gaza and Lebanon, nor «عبر».
 *    "Swept" is «ضمّ … صورة … إلى» or «غطّى», never «مسح» with a place as its object. The likely verdict's tense is kept
 *    flat; "we can't know" is «لا يمكننا أن نعرف».
 *  - Numbers are num() parts (mono, each its own left-to-right island). Arabic units follow the island as text after a
 *    no-break space («786 كم»): inside the island (`direction: ltr`) an Arabic unit would read before its number. The
 *    clock keeps its zone inside the island («16:14:21 UTC», Latin both). '°' and '%' attach inside it. Prose spells
 *    metres and minutes with agreement («250 مترًا»، «كل 10 دقائق», one and two as words); readout units are symbols.
 *  - Directions are whole phrases from three tables (moving «نحو», offset «إلى», in the sky «باتجاه»); the 16-point
 *    readout letters stay Latin («SSW»), as coordinates do. The geostationary seat arrives formatted («0.2°W») and sits
 *    in an LRI…PDI island, or after Arabic its letters and digits swap («W°0.2»).
 */
import type en from '../en/pass'
import type { Offset } from '../en/pass'
import { fmt } from '../../../api/_lib/i18n/format'
import { num, type Part, type Rich } from '../../../api/_lib/i18n/parts'
import type { Compass8 } from '@/ui/results/lib/copy'

const f = fmt('ar')
const nb = '\u00a0'
/** U+2066 LEFT-TO-RIGHT ISOLATE … U+2069 POP DIRECTIONAL ISOLATE (DOM-only text) */
const ltr = (s: string) => `\u2066${s}\u2069`
/** The place, isolated unless it is Arabic: a place searched by coordinates would otherwise reorder its numbers */
const at = (place: string) => (/[\u0600-\u06ff\u2066-\u2069]/.test(place) ? place : ltr(place))

/** Moving (`heading`): «متجهًا نحو الجنوب» */
const HEADING: Record<Compass8, string> = {
  n: 'نحو الشمال',
  ne: 'نحو الشمال الشرقي',
  e: 'نحو الشرق',
  se: 'نحو الجنوب الشرقي',
  s: 'نحو الجنوب',
  sw: 'نحو الجنوب الغربي',
  w: 'نحو الغرب',
  nw: 'نحو الشمال الغربي',
}
/** Where it was from the place (`dir`): «على بعد 61 كم إلى الغرب» */
const DIR: Record<Compass8, string> = {
  n: 'إلى الشمال',
  ne: 'إلى الشمال الشرقي',
  e: 'إلى الشرق',
  se: 'إلى الجنوب الشرقي',
  s: 'إلى الجنوب',
  sw: 'إلى الجنوب الغربي',
  w: 'إلى الغرب',
  nw: 'إلى الشمال الغربي',
}
/** Where it stood in your sky (`toward`): «باتجاه الشمال الغربي» */
const TOWARD: Record<Compass8, string> = {
  n: 'باتجاه الشمال',
  ne: 'باتجاه الشمال الشرقي',
  e: 'باتجاه الشرق',
  se: 'باتجاه الجنوب الشرقي',
  s: 'باتجاه الجنوب',
  sw: 'باتجاه الجنوب الغربي',
  w: 'باتجاه الغرب',
  nw: 'باتجاه الشمال الغربي',
}

/** The full stop after a place that ends a sentence, unless the name already ends on one («D.C.») */
const stop = (place: string) => (/[.…!?؟]$/u.test(place) ? '' : '.')
/** «القمر الصناعي Sentinel-2C»: the head noun carries the gender, the name stays as it came */
const theSat = (sat: string) => `القمر الصناعي${nb}${sat}`
/** Display names of the crewed stations (src/engine/profiles.ts: ISS, Tiangong): the messages carry no crewed flag */
const CREWED = /^(ISS|Tiangong)\b/
/** A whole number, grouped */
const int = (n: number) => num(f.int(n))
const clock = (time: string, zone: string) => num(time, zone)
/** «786 كم»: the number's island, then its unit */
const km = (n: number): Part[] => [int(n), `${nb}كم`]
const deg = (d: number) => num(f.dec(d, 1), '°')

/** «بدقة 250 مترًا لكل بكسل»: metres after «بدقة» (genitive), one and two as words */
const perPixel = (gsdM: number): Part[] => {
  const m = Math.round(gsdM)
  return f.plural<Part[]>(m, {
    zero: [int(m), `${nb}متر لكل بكسل`],
    one: ['متر واحد لكل بكسل'],
    two: ['مترين لكل بكسل'],
    few: [int(m), `${nb}أمتار لكل بكسل`],
    many: [int(m), `${nb}مترًا لكل بكسل`],
    other: [int(m), `${nb}متر لكل بكسل`],
  })
}

/** «كل دقيقة» · «كل دقيقتين» · «كل 10 دقائق» · «كل 15 دقيقة»: a cadence in prose (a fraction is `other`) */
const everyMinutes = (n: number): Part[] => {
  const v = Number.isInteger(n) ? f.int(n) : f.dec(n, 1)
  return f.plural<Part[]>(n, {
    zero: ['كل بضع دقائق'],
    one: ['كل دقيقة'],
    two: ['كل دقيقتين'],
    few: ['كل ', num(v), `${nb}دقائق`],
    many: ['كل ', num(v), `${nb}دقيقة`],
    other: ['كل ', num(v), `${nb}دقيقة`],
  })
}

/** "786 km overhead" / "786 km up, 61 km to the west", before the clock */
const where = (altKm: number, offset?: Offset): Part[] =>
  offset
    ? ['على ارتفاع ', ...km(altKm), '، على بعد ', ...km(offset.km), ` ${DIR[offset.dir]}، عند `]
    : ['فوق المكان مباشرةً على ارتفاع ', ...km(altKm), ' عند ']

const pass: typeof en = {
  // Latin letters, as coordinates are (ar.md §4.2): Arabic has no established 16-point abbreviations, and its single
  // letters would clash with «ث»، «س»، «د» (seconds, hours, minutes) in the same rows.
  compass16: {
    n: 'N',
    nne: 'NNE',
    ne: 'NE',
    ene: 'ENE',
    e: 'E',
    ese: 'ESE',
    se: 'SE',
    sse: 'SSE',
    s: 'S',
    ssw: 'SSW',
    sw: 'SW',
    wsw: 'WSW',
    w: 'W',
    wnw: 'WNW',
    nw: 'NW',
    nnw: 'NNW',
  },

  // ── a geostationary scan ─────────────────────────────────────────────────────────────────
  geo: {
    // «فهو», not «بل», after the full stop (ar.md decisions log, 23).
    sits: (o: { sat: string; altKm: number; seat?: string; cadenceMin?: number }): Rich => [
      `لا يمرّ ${theSat(o.sat)}. فهو يستقر على ارتفاع `,
      ...km(o.altKm),
      ` فوق خط الاستواء${o.seat !== undefined ? ` عند ${ltr(o.seat)}` : ''}، ويُجري مسحًا كاملًا لوجه الأرض المقابل له`,
      ...(o.cadenceMin ? [' ', ...everyMinutes(o.cadenceMin), '.'] : ['.']),
    ],
    reached: (o: { place: string; time: string; zone: string; heading: Compass8 }): Rich => [
      `بلغ خط هذا المسح ${at(o.place)} عند `,
      clock(o.time, o.zone),
      ` تقريبًا، متجهًا ${HEADING[o.heading]}.`,
    ],
    infrared: 'كان المكان مظلمًا، لذا هذه صورة بالأشعة تحت الحمراء: قمم السحب بحسب حرارتها، والأبرد أفتح.',
  },

  // ── a pass with a picture ────────────────────────────────────────────────────────────────
  crossed: (o: { sat: string; altKm: number; offset?: Offset; time: string; zone: string; heading: Compass8; speedKmS: number }): Rich => [
    `مرّ ${theSat(o.sat)} `,
    ...where(o.altKm, o.offset),
    clock(o.time, o.zone),
    `، متجهًا ${HEADING[o.heading]} بسرعة `,
    num(f.dec(o.speedKmS, 2)),
    `${nb}كم/ث.`,
  ],
  // The sensor and the place never touch: «صورة» stands between them (ar.md §5.2).
  mosaic: (o: { sensor: string; place: string; gsdM: number }): Rich => [
    `ضمّ جهاز تصويره ${o.sensor} صورة ${at(o.place)} إلى فسيفساء ناسا اليومية بالألوان الطبيعية، بدقة `,
    ...perPixel(o.gsdM),
    '.',
  ],
  radarImaged: (o: { deg: number; place: string; gsdM: number; dark: boolean }): Rich => [
    `رصد راداره ${at(o.place)} بدقة `,
    ...perPixel(o.gsdM),
    '، ناظرًا بزاوية ',
    deg(o.deg),
    o.dark ? ' إلى الجانب، في الظلام.' : ' إلى الجانب.',
  ],
  lookingDown: 'كان ينظر عموديًا إلى الأسفل.',
  lookingOff: (d: number): Rich => ['كان ينظر إلى الأسفل بانحراف ', deg(d), ' عن العمودي.'],
  cloudCover: (pct: number): Rich => ['الغطاء السحابي في المشهد: ', num(f.int(pct), '%'), '.'],

  // ── "Likely watched" ─────────────────────────────────────────────────────────────────────
  likely: {
    crossed: (o: { sat: string; altKm: number; offset?: Offset; time: string; zone: string; swathKm?: number }): Rich => [
      `مرّ ${theSat(o.sat)} `,
      ...where(o.altKm, o.offset),
      clock(o.time, o.zone),
      ...(o.swathKm ? ['، والمكان داخل نطاق مسحه بعرض ', ...km(o.swathKm), '.'] : ['.']),
    ],
    archiveFailed: 'كان الوقت نهارًا، فكان سيسجّل هذه البقعة. تعذّر البحث في الأرشيف الآن.',
    noScene: 'لا يوجد مشهد لهذا المرور. لا تسجّل أقمار Sentinel-2 إلا اليابسة والمياه الساحلية، وربما لم تكن هذه البقعة ضمن جدولها.',
    notYet:
      'كان الوقت نهارًا، فمن شبه المؤكد أنه سجّل هذه البقعة. ' +
      'لم يُنشر بعد أي مشهد من هذا المرور؛ فقد تتأخر الأرشيفات يومًا أو أكثر.',
    dark: 'كان المكان مظلمًا. تواصل أجهزة تصوير الطقس عملها ليلًا بالأشعة تحت الحمراء، لذا رأى جهازه سحبك، لا شوارعك.',
    mosaicUnconfirmed: 'تعذّر التأكد من فسيفساء ناسا اليومية لهذا المرور فوق بقعتك.',
    notPublished: 'تغذّي صوره توقعات الطقس؛ ولا تُنشر صورًا يمكننا عرضها.',
  },

  // ── "Could have pointed here" ────────────────────────────────────────────────────────────
  could: {
    withinView: (o: { sat: string; time: string; zone: string; offset?: Offset }): Rich => [
      `مرّ ${theSat(o.sat)} على مرأى من المكان عند `,
      clock(o.time, o.zone),
      ...(o.offset ? ['، على بعد ', ...km(o.offset.km), ` ${DIR[o.offset.dir]}.`] : ['، فوقه مباشرةً.']),
    ],
    // The place cannot be the subject of «كان»: the swath is, and the place is its object (ar.md §5.1).
    insideSwath: (o: { place: string; swathKm: number }): Rich => [
      'كان نطاق مسحه بعرض ',
      ...km(o.swathKm),
      ` يشمل ${at(o.place)}${stop(o.place)} لا ينشر مشغّله أين التقط صوره، لذا لا يمكننا أن نعرف إن كان قد فعل.`,
    ],
    radar: (o: { place: string; deg?: number; openArchive: boolean }): Rich => [
      'يرى الرادار عبر السحب والظلام. ',
      ...(o.deg === undefined
        ? [`كان بإمكانه رصد ${at(o.place)}${stop(o.place)}`]
        : ['لو وجّه راداره بزاوية ', deg(o.deg), ` إلى الجانب، لأمكنه رصد ${at(o.place)}${stop(o.place)}`]),
      o.openArchive ? ' لم نجد صورة منشورة من هذا المرور.' : ' لا يمكننا أن نعرف إن كان قد فعل.',
    ],
    camera: (o: { place: string; deg?: number }): Rich => [
      ...(o.deg === undefined
        ? [`كان بإمكانه رصد ${at(o.place)} وهو ينظر عموديًا إلى الأسفل.`]
        : ['لو وجّه كاميرته بانحراف ', deg(o.deg), ` عن العمودي، لأمكنه رصد ${at(o.place)}${stop(o.place)}`]),
      ' لا يمكننا أن نعرف إن كان قد فعل.',
    ],
  },

  // ── "Passed overhead" ────────────────────────────────────────────────────────────────────
  // Nearly always a crewed station (only `crewed` gets this verdict, bar an open-ocean recast of Sentinel-2 / Landsat).
  overhead: (o: { sat: string; altKm: number; time: string; zone: string; elevationDeg: number; toward?: Compass8 }): Rich => [
    CREWED.test(o.sat) ? `مرّت المحطة الفضائية${nb}${o.sat} على ارتفاع ` : `مرّ ${theSat(o.sat)} على ارتفاع `,
    ...km(o.altKm),
    ' عند ',
    clock(o.time, o.zone),
    '، بزاوية ',
    num(f.int(o.elevationDeg), '°'),
    o.toward === undefined ? ' فوق أفقك، فوق رأسك تقريبًا.' : ` فوق أفقك، ${TOWARD[o.toward]}.`,
  ],
  // "Steady" is a light that does not blink («لا تومض»), not «ثابتة» ("stationary", and the geostationary word, §4.1).
  darkStation: 'كان مكانك مظلمًا. فإن كانت المحطة لا تزال في ضوء الشمس، فقد مرّت في سمائك نقطةً ساطعة لا تومض.',
}
export default pass
