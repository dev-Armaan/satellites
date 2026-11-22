/**
 * Persian copy for the landing (see docs/i18n/fa.md §3.1, §3.2, §3.7 "`landing`", §6.2): the hero, the place search,
 * "Use my location", the example chips and the maker's credit.
 *
 * Why it is built this way:
 *  - The hero is the guide's two lines, «چیزی این هفته / *شما* را رصد کرد.»: five Persian words split evenly, the accent
 *    on the free-standing «شما» at the head of the second line (any three-line split strands a one-word line).
 *  - The sub line is one sentence with two polite imperatives joined by «و», as Persian says them; «از فرازش» points
 *    back to «هر جای زمین», our own noun. One searches a place («جستجو کنید»): only a name can be «وارد کردن» (entered).
 *    The window's number is tied to «روز» by a no-break space.
 *  - The kicker's range is Intl's own («1 تا 8 نوامبر 2026»), Gregorian, then «UTC».
 *  - Buttons are nouns («گذاشتن سنجاق», «استفاده از موقعیت من»); the reader's own command to the product keeps the
 *    first person («غافلگیرم کن»); help and errors give one polite imperative, never «لطفاً».
 *  - Text the visitor typed, the example coordinates and the maker's handle are isolated (FSI / LRI … PDI): DOM-only
 *    strings, where a query, a negative coordinate or the handle's leading «@» would otherwise be reordered.
 */
import type en from '../en/landing'
import { fmt } from '../../../api/_lib/i18n/format'
import { dateFormat } from '../../../api/_lib/i18n/dates'
import { accent, type Rich } from '../../../api/_lib/i18n/parts'

const f = fmt('fa')
const nb = '\u00a0'

/** A count as it is set: grouped («1,715»), a fraction kept. */
const count = (n: number) => (Number.isInteger(n) ? f.int(n) : f.dec(n, 1))

const UTC_RANGE: Intl.DateTimeFormatOptions = { calendar: 'gregory', day: 'numeric', month: 'long', year: 'numeric' }

const landing: typeof en = {
  // ── Hero ──────────────────────────────────────────────────────────────────────────────────
  lastDays: (days: number) => `${count(days)}${nb}روز گذشته`,
  windowRange: (startMs: number, endMs: number) => `${dateFormat('fa', 'UTC', UTC_RANGE).formatRange(startMs, endMs)} UTC`,
  hero: [['چیزی این هفته'], [accent('شما'), ' را رصد کرد.']] as Rich[],
  sub: (days: number): Rich => [
    `هر جای زمین را جستجو کنید و همهٔ ماهواره‌هایی را ببینید که در ${count(days)}${nb}روز گذشته از فرازش گذشتند، همراه با تصویرهای واقعی‌ای که گرفتند.`,
  ],
  builtBy: (handle: string) => `ساختهٔ \u2066${handle}\u2069`,
  sourceLink: 'متن‌باز',
  sourceLinkLabel: 'متن‌باز: کد پروژه در GitHub',

  // ── The place search ──────────────────────────────────────────────────────────────────────
  searchPlaceholder: 'جستجوی مکان',
  placeLabel: 'مکان',
  searching: 'در حال جستجو',
  searchUnavailable: 'جستجو در دسترس نیست',
  matches: (n: number) => `${count(n)}${nb}نتیجه`,
  noMatch: 'نتیجه‌ای نیست',
  searchHint: 'نام، نشانی یا مختصات',
  clearSearch: 'پاک کردن جستجو',
  go: 'نمایش آنچه از فراز این مکان گذشت',
  searchDown: 'جستجوی مکان پاسخ نمی‌دهد. مختصاتی مثل \u206643.47, −80.54\u2069 همچنان کار می‌کند.',
  nothingMatches: (query: string) => `هیچ نتیجه‌ای برای «\u2068${query}\u2069» پیدا نشد. یک شهر، یک جای شناخته‌شده یا مختصات را امتحان کنید.`,
  suggestions: 'مکان‌ها',

  // ── Use my location ──────────────────────────────────────────────────────────────────────
  useMyLocation: 'استفاده از موقعیت من',
  locateMe: 'موقعیت من',
  nearMe: 'نزدیک من',
  locating: 'مکان‌یابی…',
  cancelSearch: 'لغو',
  cancelLocate: 'لغو',
  cancelLocating: 'لغو مکان‌یابی',
  requestingPosition: 'درخواست موقعیت',
  namingPlace: 'یافتن نام مکان',
  elapsed: (seconds: number) => `${seconds.toFixed(0).padStart(2, '0')}${nb}ثانیه`,
  locatingNote: `موقعیت شما برای یافتن نام مکان به سرویس Photon فرستاده می‌شود. ما فقط یک ناحیهٔ تقریبی 10${nb}کیلومتری از آن را نگه می‌داریم.`,
  locationLabel: 'موقعیت',
  dismiss: 'بستن',
  locateErrors: {
    denied: 'دسترسی به موقعیت مسدود است. آن را در تنظیمات مرورگر مجاز کنید یا مکانی را جستجو کنید.',
    unavailable: 'موقعیت شما فعلاً در دسترس نیست. به‌جای آن مکانی را جستجو کنید.',
    timeout: 'یافتن موقعیت شما بیش از حد طول کشید. دوباره امتحان کنید یا مکانی را جستجو کنید.',
    unsupported: 'این مرورگر نمی‌تواند موقعیت را به اشتراک بگذارد. به‌جای آن مکانی را جستجو کنید.',
    insecure: 'مکان‌یابی به اتصال امن (https) نیاز دارد. به‌جای آن مکانی را جستجو کنید.',
    other: 'موقعیت شما فعلاً در دسترس نیست. به‌جای آن مکانی را جستجو کنید.',
  },

  // ── Examples ──────────────────────────────────────────────────────────────────────────────
  orTry: 'نمونه‌ها',
  pinHint: 'یا با کلیک روی کره سنجاق بگذارید',
  examplesLabel: 'مکان‌های نمونه',
  dropPin: 'گذاشتن سنجاق',
  chipName: (label: string, sublabel: string) => (sublabel ? `${label}، ${sublabel}` : label),
  surprise: 'غافلگیرم کن',
  surpriseName: 'غافلگیرم کن: مکانی مشهور، به انتخاب تصادفی',
}
export default landing
