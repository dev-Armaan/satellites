/**
 * Arabic copy for the photo gallery and the photo frames it shows (see src/i18n/en/gallery.ts for where each message
 * shows; docs/i18n/ar.md §3.7 "gallery and lightbox" is the authority on every line here).
 *
 * Why it reads this way:
 *  - Every picture is a «صورة» (photo, mosaic and radar image alike); a cover's reason is a «نظرة»: «أقرب نظرة»,
 *    «أحدث نظرة صافية» (never «آخر نظرة», the farewell to the dead, ar.md §8), «تحت السحب» (never «غائمة», which says
 *    blurry). Clear sky is «صافٍ», never «واضح».
 *  - Labels and buttons are nouns or masdars («عرض»، «تكبير الصورة»، «إعادة المحاولة»): an imperative to the reader
 *    would be gendered (ar.md §1.2). "Your spot" is «بقعتك», the one unvocalised ـك.
 *  - The strip and its ‹ › run left to right on the Arabic page too (ar.md §6.2.8), so the tooltips keep ← and → as the
 *    physical keys. The counter «3 / 27» is two numbers joined by a neutral slash, never one LTR island.
 *  - Names are never inflected and never take an attached preposition: the satellite follows its head noun
 *    («من القمر الصناعي Sentinel-2C», a no-break space between them), the place stands in a construct («صورة Waterloo»).
 *    Days («الأحد، 1 نوفمبر») and clocks arrive written and are joined with the Arabic comma «، ».
 *  - Numbers come from fmt('ar') (Western digits) with a no-break space before a unit or a counted noun; `%` attaches.
 *    The Replay label has no tablet-only strong part: «إعادة العرض» cannot be cut in two (ar.md §3.7, §7).
 */
import type en from '../en/gallery'
import type { CoverLead } from '../en/gallery'
import { fmt } from '../../../api/_lib/i18n/format'
import { strong, type Rich } from '../../../api/_lib/i18n/parts'

const f = fmt('ar')
// A left-to-right island (LRI…PDI, DOM text only): after Arabic letters the digits turn Arabic numbers and «25%»
// draws «%25».
const pct = (n: number) => `\u2066${f.int(n)}%\u2069`

const LEAD: Record<CoverLead, string> = {
  closest: 'أقرب نظرة',
  lastClear: 'أحدث نظرة صافية',
  clouded: 'تحت السحب',
}

/** «Sentinel-2C، الأحد، 1 نوفمبر 16:14»: the facts after a label's colon */
const who = (sat: string, day: string, time: string) => `${sat}، ${day} ${time}`

const gallery: typeof en = {
  // ── the bar over the photos ──────────────────────────────────────────────────────────────
  barLabel: 'الصور',
  filterLabel: 'عرض الصور',
  filter: { all: 'الكل', detailed: 'مفصّلة', weather: 'الطقس', radar: 'رادار' },
  filterTitle: {
    all: 'كل الصور، الأحدث أولًا بعد أقرب نظرة',
    detailed: 'صور Sentinel-2 وLandsat، من 10 إلى 30\u00a0مترًا لكل بكسل',
    weather: 'فسيفساء الطقس اليومية، 250\u00a0مترًا لكل بكسل فأكثر',
    radar: 'صور رادار Sentinel-1، بدقة 20\u00a0مترًا لكل بكسل: عبر السحب، ليلًا ونهارًا',
  },
  // A label and its value: the number needs no agreement, and the box has no room for a counted noun.
  photosThisWeek: (n: number) => `هذا الأسبوع: ${f.int(n)}`,
  photosThatWeek: (n: number) => `ذلك الأسبوع: ${f.int(n)}`,
  prevPhoto: 'الصورة السابقة',
  prevTitle: 'السابق (←)',
  nextPhoto: 'الصورة التالية',
  nextTitle: 'التالي (→)',
  carousel: 'شريط صور',
  // «التمرير يعرض المزيد» states what a swipe does, without an imperative to the reader. Never «السحب» here: unvowelled
  // it is also «السُّحُب», the clouds, this strip's most frequent word, and a screen reader picks that reading.
  trackLabel: 'صور هذا المكان، التمرير يعرض المزيد',

  // ── a slide ──────────────────────────────────────────────────────────────────────────────
  slide: 'شريحة',
  lead: LEAD,
  slideLabel: (lead: CoverLead | undefined, sat: string, day: string, time: string, photo?: { k: number; n: number }) =>
    `${lead ? `${LEAD[lead]}: ` : ''}${who(sat, day, time)}${photo ? `، الصورة ${f.int(photo.k)} من ${f.int(photo.n)}` : ''}`,
  replayLabel: (sat: string, day: string, time: string) => `إعادة عرض هذا المرور على الكرة الأرضية: ${who(sat, day, time)}`,
  // No strong part: «إعادة» alone would read "redo", so every screen reads the whole masdar.
  replay: ['إعادة العرض'] as Rich,
  viewLabel: {
    lastClear: (sat: string, day: string, time: string) => `عرض أحدث نظرة صافية بحجم كبير: ${who(sat, day, time)}`,
    photo: (sat: string, day: string, time: string) => `عرض الصورة بحجم كبير: ${who(sat, day, time)}`,
  },
  view: 'عرض',
  sharePass: 'مشاركة هذا المرور',
  radarTag: 'رادار',
  // The product verb in the passive says what the week's passes saw; «مرات المرور» (a count noun) cannot be the one
  // that sees.
  noteMostlyCloud: 'معظم ما رُصد هذا الأسبوع سحب',
  noteLastClear: 'هذه أحدث نظرة صافية',
  clouded: {
    pct: (p: number) => `تحت السحب · ${pct(p)}`,
    coverAtSpot: 'تحت السحب · سحب فوق بقعتك',
    atSpot: 'سحب فوق بقعتك',
  },
  status: {
    cloudedPct: (p: number) => `سحب · ${pct(p)}`,
    cloudAtSpot: 'سحب فوق البقعة',
    clear: 'صافٍ',
    cirrus: 'سمحاق رقيق',
    shadow: 'ظل سحابة',
    cloudPct: (p: number) => `السحب ${pct(p)}`,
    mosaic: 'فسيفساء يومية',
  },
  cropKm: (km: number) => `${km >= 100 ? f.int(km) : f.dec(km, 1)}\u00a0كم`,

  // ── a photo frame ────────────────────────────────────────────────────────────────────────
  // The place in a construct («صورة Waterloo»), the satellite after its head noun: two Latin names never touch.
  photoAlt: (sat: string, place: string) => `صورة ${place} من القمر الصناعي\u00a0${sat}. المكان في المنتصف.`,
  acquiring: 'جارٍ الالتقاط',
  noImage: 'لم تُرسل أي صورة',
  retry: 'إعادة المحاولة',
  scaleKm: (km: number) => `${km >= 1 ? f.int(km) : f.dec(km, 1)}\u00a0كم`,
  // The cartographic N, as on the readouts' compass points (ar.md §4.2).
  north: 'N',
  expandLabel: 'تكبير الصورة',
  expandTitle: 'تكبير (F)',

  // ── a photo developing (the pushbroom reveal) ────────────────────────────────────────────
  // Prose spells the seconds with agreement («10 ثوانٍ»): a bare «ث» belongs to readouts.
  stillRendering: 'لا يزال يُرسم. قد تستغرق المشاهد الكبيرة 10\u00a0ثوانٍ أو أكثر.',
  cropMissing: 'لم يُرسل الأرشيف هذا الاقتطاع. ربما هو مشغول؛ الصورة نفسها لا تزال موجودة.',
  // Counting up to the last line reads right to left: ← (ar.md §6.1). The live counter stays the strong part.
  scanLine: (line: string, lines: string): Rich => ['السطر ', strong(line), ` ← ${lines}`],
  awaiting: { pass: 'بانتظار المرور', scan: 'بانتظار المسح' },
}
export default gallery
