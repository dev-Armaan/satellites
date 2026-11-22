/**
 * Persian copy for the photo gallery and the photo frames it shows (see src/i18n/en/gallery.ts for where each message
 * shows; docs/i18n/fa.md §4.1 for the words).
 *
 * Why it reads this way:
 *  - "Photos" over a strip that holds radar images and mosaics too is «تصویرها» (images), the honest general word;
 *    «عکس» is kept for where the English contrasts a photograph with a radar image.
 *  - A "look" is «نما»: «نزدیک‌ترین نما», «آخرین نمای بی‌ابر» («بی‌ابر», never «صاف», which also means "flat");
 *    "clouded over" is «پوشیده از ابر»; the searched place is «نقطهٔ شما».
 *  - The bar's counters stay digits: «3 / 27» reads right to left in a right-to-left bar, as Persian reads «3 از 27».
 *    A percentage after a Persian word, the scan counter and the scale stay isolated islands (LRI…PDI, DOM-only).
 *  - The strip itself runs left to right (docs/I18N.md "Right to left"); the arrows in the tooltips are the physical
 *    keys and stay as they are.
 */
import type en from '../en/gallery'
import type { CoverLead } from '../en/gallery'
import { fmt } from '../../../api/_lib/i18n/format'
import { strong, type Rich } from '../../../api/_lib/i18n/parts'

const f = fmt('fa')
const nb = '\u00a0'
/** U+2066 LEFT-TO-RIGHT ISOLATE … U+2069 POP DIRECTIONAL ISOLATE */
const ltr = (s: string) => `\u2066${s}\u2069`
/** «25%» as an island: after Persian words the sign would otherwise jump in front of the digits */
const pct = (n: number) => ltr(`${f.int(n)}%`)

const LEAD: Record<CoverLead, string> = {
  closest: 'نزدیک‌ترین نما',
  lastClear: 'آخرین نمای بی‌ابر',
  clouded: 'پوشیده از ابر',
}

const gallery: typeof en = {
  // ── the bar over the photos ──────────────────────────────────────────────────────────────
  barLabel: 'تصویرها',
  filterLabel: 'نمایش تصویرها',
  // «پرجزئیات» (detailed): «دقیق» is "accurate", which would call the other images inaccurate
  filter: { all: 'همه', detailed: 'پرجزئیات', weather: 'هواشناسی', radar: 'رادار' },
  filterTitle: {
    all: 'همهٔ تصویرها، پس از نزدیک‌ترین نما از تازه‌ترین به قدیمی‌ترین',
    // A Persian word after each Latin name: «Landsat، 10» would merge into one left-to-right run
    detailed: `ماهواره‌های Sentinel-2 و Landsat، با 10 تا 30${nb}متر در هر پیکسل`,
    weather: `موزاییک‌های هواشناسی روزانه، با پیکسل‌های 250${nb}متری و بزرگ‌تر`,
    radar: `تصویرهای راداری Sentinel-1 با 20${nb}متر در هر پیکسل: از پشت ابر، در روز یا شب`,
  },
  photosThisWeek: (n: number) => `این هفته: ${f.int(n)}`,
  photosThatWeek: (n: number) => `آن هفته: ${f.int(n)}`,
  prevPhoto: 'تصویر قبلی',
  prevTitle: 'قبلی (←)',
  nextPhoto: 'تصویر بعدی',
  nextTitle: 'بعدی (→)',
  carousel: 'نوار تصویرها',
  trackLabel: 'تصویرهای این مکان؛ برای دیدن بیشتر بکشید',

  // ── a slide ──────────────────────────────────────────────────────────────────────────────
  slide: 'تصویر',
  lead: LEAD,
  slideLabel: (lead: CoverLead | undefined, sat: string, day: string, time: string, photo?: { k: number; n: number }) =>
    `${lead ? `${LEAD[lead]}: ` : ''}${sat}، ${day} ${ltr(time)}${photo ? `، تصویر ${f.int(photo.k)} از ${f.int(photo.n)}` : ''}`,
  replayLabel: (sat: string, day: string, time: string) => `بازپخش این گذر روی کرهٔ زمین: ${sat}، ${day} ${ltr(time)}`,
  replay: ['بازپخش', strong(' این گذر')] as Rich,
  viewLabel: {
    lastClear: (sat: string, day: string, time: string) => `دیدن آخرین نمای بی‌ابر در اندازهٔ بزرگ: ${sat}، ${day} ${ltr(time)}`,
    photo: (sat: string, day: string, time: string) => `دیدن تصویر در اندازهٔ بزرگ: ${sat}، ${day} ${ltr(time)}`,
  },
  view: 'دیدن',
  sharePass: 'اشتراک‌گذاری این گذر',
  radarTag: 'رادار',
  // Impersonal: a pass does not "see" in Persian
  noteMostlyCloud: 'در گذرهای این هفته بیشتر ابر دیده شد',
  noteLastClear: 'این آخرین نمای بی‌ابر است',
  clouded: {
    pct: (p: number) => `پوشیده از ابر · ${pct(p)}`,
    coverAtSpot: 'پوشیده از ابر · ابر روی نقطهٔ شما',
    atSpot: 'ابر روی نقطهٔ شما',
  },
  status: {
    cloudedPct: (p: number) => `ابری · ${pct(p)}`,
    cloudAtSpot: 'ابر روی نقطه',
    clear: 'بی‌ابر',
    cirrus: 'سیروس نازک',
    shadow: 'سایهٔ ابر',
    cloudPct: (p: number) => `ابر ${pct(p)}`,
    mosaic: 'موزاییک روزانه',
  },
  cropKm: (km: number) => `${km >= 100 ? f.int(km) : f.dec(km, 1)}${nb}کیلومتر`,

  // ── a photo frame ────────────────────────────────────────────────────────────────────────
  // The place stands in an ezafe after «تصویر»; «از ماهوارهٔ» brings in the satellite, so their names never touch.
  photoAlt: (sat: string, place: string) => `تصویر ${place} از ماهوارهٔ ${sat}. این مکان در مرکز تصویر است.`,
  acquiring: 'در حال دریافت',
  noImage: 'تصویری دریافت نشد',
  retry: 'تلاش دوباره',
  scaleKm: (km: number) => `${km >= 1 ? f.int(km) : f.dec(km, 1)}${nb}کیلومتر`,
  // The cartographic N, as every map shows it
  north: 'N',
  expandLabel: 'بزرگ کردن تصویر',
  expandTitle: 'بزرگ کردن (F)',

  // ── a photo developing ───────────────────────────────────────────────────────────────────
  stillRendering: `هنوز در حال ساخت است. صحنه‌های بزرگ ممکن است 10${nb}ثانیه یا بیشتر طول بکشند.`,
  cropMissing: 'آرشیو این برش را نفرستاد. ممکن است شلوغ باشد؛ خود تصویر همچنان وجود دارد.',
  // The counter's ends stay apart: «←» points from this line to the last, along the reading.
  scanLine: (line: string, lines: string): Rich => ['خط ', strong(line), ` ← ${lines}`],
  awaiting: { pass: 'در انتظار گذر', scan: 'در انتظار اسکن' },
}
export default gallery
