/**
 * Arabic copy for the landing (see docs/i18n/ar.md §3.1, §3.2, §3.7 "`landing`", §5.4, §6.2): the hero, the place
 * search, "Use my location", the example chips and the maker's credit.
 *
 * Why it is built this way:
 *  - The hero is the guide's three lines, «ثمّة شيء / رصدك *أنت* / هذا الأسبوع.»: the accent is the free-standing
 *    «أنت» that emphasises the object suffix, and neither is vocalised, so every reader reads it as said to them.
 *  - The sub line replaces the English pair of imperatives with the product's "we" («نريك»), and the window's length
 *    is a count: «آخر يوم / آخر يومين / آخر 7 أيام / آخر 11 يومًا», the number tied to its noun by a no-break space.
 *  - The kicker's dates come from Intl's range parts (months from CLDR, never a table), with Intl's en dash replaced by
 *    «←», the arrow every Arabic range uses (ar.md §6.1).
 *  - Buttons are masdars («وضع دبوس», «استخدام موقعي»); the reader's own commands to the product keep the first
 *    person («حدّد موقعي», «فاجئني»); help and errors say «يمكنك» + masdar, never a gendered imperative (§1.2).
 *  - Text the visitor typed, the example coordinates and the maker's handle are isolated (FSI / LRI … PDI): DOM-only
 *    strings, where a query, a negative coordinate or the handle's leading «@» (a neutral, which the right-to-left
 *    paragraph would draw on the far side of the name) would otherwise be reordered (§6.2.6, §6.2.7).
 */
import type en from '../en/landing'
import { fmt } from '../../../api/_lib/i18n/format'
import { dateFormat } from '../../../api/_lib/i18n/dates'
import { accent, type Rich } from '../../../api/_lib/i18n/parts'

const f = fmt('ar')

/** A count as it is set: grouped («1,715»), a fraction kept (its plural category is `other`). */
const count = (n: number) => (Number.isInteger(n) ? f.int(n) : f.dec(n, 1))

/** «آخر يوم · آخر يومين · آخر 7 أيام · آخر 11 يومًا · آخر 100 يوم»: the window, «آخر» in construct with the count */
const lastDays = (n: number) =>
  f.plural(n, {
    zero: `آخر ${count(n)}\u00a0يوم`,
    one: 'آخر يوم',
    two: 'آخر يومين',
    few: `آخر ${count(n)}\u00a0أيام`,
    many: `آخر ${count(n)}\u00a0يومًا`,
    other: `آخر ${count(n)}\u00a0يوم`,
  })

const UTC_RANGE: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }

/** Intl's range separator (an en dash, spaced or not, shared by both ends). */
const isSeparator = (p: Intl.DateTimeRangeFormatPart) => p.type === 'literal' && p.source === 'shared' && /[–—-]/.test(p.value)

const landing: typeof en = {
  // ── Hero ──────────────────────────────────────────────────────────────────────────────────
  lastDays: (days: number) => lastDays(days),
  windowRange: (startMs: number, endMs: number) => {
    const parts = dateFormat('ar', 'UTC', UTC_RANGE).formatRangeToParts(startMs, endMs)
    return `${parts.map((p) => (isSeparator(p) ? ' ← ' : p.value)).join('')} UTC`
  },
  hero: [['ثمّة شيء'], ['رصدك ', accent('أنت')], ['هذا الأسبوع.']] as Rich[],
  sub: (days: number): Rich => [
    `أي مكان على الأرض، نريك كل قمر صناعي مرّ فوقه خلال ${lastDays(days)}، والصور الحقيقية التي التقطها.`,
  ],
  builtBy: (handle: string) => `من صنع \u2066${handle}\u2069`,
  sourceLink: 'مفتوح المصدر',
  sourceLinkLabel: 'مفتوح المصدر: الشيفرة على GitHub',

  // ── The place search ──────────────────────────────────────────────────────────────────────
  searchPlaceholder: 'البحث عن مكان',
  placeLabel: 'المكان',
  searching: 'جارٍ البحث',
  searchUnavailable: 'البحث غير متاح',
  matches: (n: number) =>
    f.plural(n, {
      zero: 'لا نتائج',
      one: 'نتيجة واحدة',
      two: 'نتيجتان',
      few: `${count(n)}\u00a0نتائج`,
      many: `${count(n)}\u00a0نتيجة`,
      other: `${count(n)}\u00a0نتيجة`,
    }),
  noMatch: 'لا نتائج',
  searchHint: 'اسم أو عنوان أو إحداثيات',
  clearSearch: 'إفراغ البحث',
  go: 'عرض ما مرّ فوق هذا المكان',
  searchDown: 'لا يستجيب البحث عن الأماكن. الإحداثيات مثل \u206643.47, −80.54\u2069 لا تزال تعمل.',
  nothingMatches: (query: string) => `لا شيء يطابق «\u2068${query}\u2069». يمكنك تجربة مدينة أو معلم أو إحداثيات.`,
  suggestions: 'الأماكن',

  // ── Use my location ──────────────────────────────────────────────────────────────────────
  useMyLocation: 'استخدام موقعي',
  locateMe: 'حدّد موقعي',
  nearMe: 'بالقرب مني',
  locating: 'جارٍ التحديد…',
  cancelSearch: 'إلغاء',
  cancelLocate: 'إلغاء',
  cancelLocating: 'إلغاء تحديد الموقع',
  requestingPosition: 'جارٍ طلب الموقع',
  namingPlace: 'جارٍ تسمية المكان',
  elapsed: (seconds: number) => `${seconds.toFixed(0).padStart(2, '0')}\u00a0ث`,
  locatingNote: 'يُرسل موقعك إلى خدمة Photon لتسمية المكان. لا نحتفظ إلا بخلية عرضها نحو 10\u00a0كم.',
  locationLabel: 'الموقع',
  dismiss: 'إغلاق',
  locateErrors: {
    denied: 'الوصول إلى الموقع محظور. يمكنك السماح به في إعدادات المتصفح، أو البحث عن مكان.',
    unavailable: 'موقعك غير متاح الآن. يمكنك البحث عن مكان بدلًا من ذلك.',
    timeout: 'استغرق تحديد موقعك وقتًا طويلًا. يمكنك المحاولة مجددًا، أو البحث عن مكان.',
    unsupported: 'لا يستطيع هذا المتصفح مشاركة موقعه. يمكنك البحث عن مكان بدلًا من ذلك.',
    insecure: 'يتطلب تحديد الموقع اتصالًا آمنًا (https). يمكنك البحث عن مكان بدلًا من ذلك.',
    other: 'موقعك غير متاح الآن. يمكنك البحث عن مكان بدلًا من ذلك.',
  },

  // ── Examples ──────────────────────────────────────────────────────────────────────────────
  orTry: 'أمثلة',
  pinHint: 'النقر على الكرة يضع دبوسًا',
  examplesLabel: 'أماكن للتجربة',
  dropPin: 'وضع دبوس',
  chipName: (label: string, sublabel: string) => (sublabel ? `${label}، ${sublabel}` : label),
  surprise: 'فاجئني',
  surpriseName: 'فاجئني: مكان مشهور يُختار عشوائيًا',
}
export default landing
