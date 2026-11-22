/**
 * Persian copy for the HUD, the instrument chrome in the four corners (see docs/i18n/fa.md §3.7 "`hud`", §6.2): the
 * About link, the scene line, the orbit catalog's status and the sub-solar readout.
 *
 * Why these words: every corner line is a short noun phrase kept about as wide as the English (on a 375 px phone the
 * About link and the sun line nearly touch). Coordinates, clocks, ISO stamps and "GMST" arrive as they are; the sun's
 * coordinates and the fetch stamp each sit in one LRI…PDI island, so the right-to-left corner never reorders them
 * (after a Persian word the stamp's digits would become Arabic numbers and its hyphens split them). The catalog's age
 * is compact the Persian way, which is the plain words: Persian has no unit abbreviations («42 دقیقه پیش», «5 ساعت
 * پیش», «3 روز پیش»), and "under a minute" is «همین حالا», never a «<», which would mirror. A counted noun is singular
 * («16,893 جسم»).
 */
import type en from '../en/hud'
import { fmt } from '../../../api/_lib/i18n/format'
import { num, type Rich } from '../../../api/_lib/i18n/parts'
import type { AgeUnit } from '@/ui/hud/readouts'
import { whole } from '../bidi'

const f = fmt('fa')
const nb = '\u00a0'

/** A count as it is set: grouped («16,893»), a fraction kept. */
const count = (n: number) => (Number.isInteger(n) ? f.int(n) : f.dec(n, 1))

/** The catalog's age: «همین حالا», «42 دقیقه پیش», «5 ساعت پیش», «3 روز پیش». */
function age(unit: AgeUnit, n: number): string {
  if (unit === 'underMinute') return 'همین حالا'
  if (unit === 'minute') return `${f.int(n)}${nb}دقیقه پیش`
  if (unit === 'hour') return `${f.int(n)}${nb}ساعت پیش`
  return `${f.int(n)}${nb}روز پیش`
}

const hud: typeof en = {
  about: 'چطور کار می‌کند',
  home: 'Watched، صفحهٔ اصلی',
  regionTime: 'زمان',
  regionCatalog: 'کاتالوگ مداری',
  regionSun: 'خورشید',

  scene: 'صحنه',
  sun: (lat: string, lon: string) => `خورشید \u2066${lat} ${lon}\u2069`,
  subsolar: 'نقطهٔ زیرخورشیدی',
  gmst: (time: string) => `GMST ${time}`,

  objects: (n: number) => `${count(n)}${nb}جسم`,
  objectsPending: (count: string): Rich => [num(count), `${nb}جسم`],
  catalog: 'کاتالوگ',
  fetched: (stamp: string) => `دریافت \u2066${whole(stamp)}\u2069`,
  catalogAge: (unit: AgeUnit, n: number, stale: boolean) => `${stale ? 'کهنه، ' : ''}${age(unit, n)}`,
  catalogUnavailable: 'کاتالوگ در دسترس نیست',
  catalogLoading: 'بارگیری کاتالوگ',
}
export default hud
