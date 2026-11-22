/**
 * Arabic copy for the HUD, the instrument chrome in the four corners (see docs/i18n/ar.md §3.7 "`hud`", §5.4, §6.2,
 * §6.4): the About link, the scene line, the orbit catalog's status and the sub-solar readout.
 *
 * Why these words: every corner line is a short label, a noun with its article («الوقت», «الكتالوج», «المشهد») kept
 * about as wide as the English (on a 375 px phone «كيف يعمل» and the sun line nearly touch). Coordinates, clocks, ISO
 * stamps and "GMST" arrive as they are; the sun's coordinates and the fetch stamp each sit in one LRI…PDI island so
 * the right-to-left corner never reorders them (after an Arabic word, the stamp's digits would otherwise become Arabic
 * numbers and its hyphens split them: «03:34Z 08-11-2026»). The catalog's age is compact and built by hand: the minute and hour symbols («د», «س») never
 * inflect, days take their counted forms («قبل يومين», «قبل 3 أيام», «قبل 11 يومًا»), and "under a minute" is «للتو»,
 * never a «<», which would mirror in right-to-left text. Object counts take all six plural forms, 1 and 2 as words.
 */
import type en from '../en/hud'
import { fmt } from '../../../api/_lib/i18n/format'
import { num, type Rich } from '../../../api/_lib/i18n/parts'
import type { AgeUnit } from '@/ui/hud/readouts'
import { whole } from '../bidi'

const f = fmt('ar')

/** A count as it is set: grouped («16,893»), a fraction kept (its plural category is `other`). */
const count = (n: number) => (Number.isInteger(n) ? f.int(n) : f.dec(n, 1))

/** «يوم واحد · يومين · 3 أيام · 11 يومًا · 100 يوم» after «قبل» (genitive, so the dual is «يومين») */
const daysAfterPreposition = (n: number) =>
  f.plural(n, {
    zero: `${f.int(n)}\u00a0يوم`,
    one: 'يوم واحد',
    two: 'يومين',
    few: `${f.int(n)}\u00a0أيام`,
    many: `${f.int(n)}\u00a0يومًا`,
    other: `${f.int(n)}\u00a0يوم`,
  })

/** The catalog's compact age: «للتو», «قبل 42 د», «قبل 5 س», «قبل 3 أيام». */
function age(unit: AgeUnit, n: number): string {
  if (unit === 'underMinute') return 'للتو'
  if (unit === 'minute') return `قبل ${f.int(n)}\u00a0د`
  if (unit === 'hour') return `قبل ${f.int(n)}\u00a0س`
  return `قبل ${daysAfterPreposition(n)}`
}

const hud: typeof en = {
  about: 'كيف يعمل',
  home: 'العودة إلى Watched',
  regionTime: 'الوقت',
  regionCatalog: 'كتالوج المدارات',
  regionSun: 'الشمس',

  scene: 'المشهد',
  sun: (lat: string, lon: string) => `الشمس \u2066${lat} ${lon}\u2069`,
  subsolar: 'نقطة تعامد الشمس',
  gmst: (time: string) => `GMST ${time}`,

  objects: (n: number) =>
    f.plural(n, {
      zero: `${count(n)}\u00a0جسم`,
      one: 'جسم واحد',
      two: 'جسمان',
      few: `${count(n)}\u00a0أجسام`,
      many: `${count(n)}\u00a0جسمًا`,
      other: `${count(n)}\u00a0جسم`,
    }),
  objectsPending: (count: string): Rich => [num(count), '\u00a0أجسام'],
  catalog: 'الكتالوج',
  fetched: (stamp: string) => `جُلب \u2066${whole(stamp)}\u2069`,
  catalogAge: (unit: AgeUnit, n: number, stale: boolean) => `${stale ? 'قديم، ' : ''}${age(unit, n)}`,
  catalogUnavailable: 'الكتالوج غير متاح',
  catalogLoading: 'جارٍ تحميل الكتالوج',
}
export default hud
