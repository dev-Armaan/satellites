/**
 * Persian copy for the share card and the share page (see docs/i18n/fa.md §3.1, §3.3, §3.5, §4.2, §5, §6.2): every word
 * the card prints and every word the server writes around it. Pure TypeScript, no DOM, Node or src/ imports: the server
 * reads it through cardMessages('fa'), and the app's fa bundle lists this very module.
 *
 * Why it is built this way:
 *  - The headline is the results headline in three blocks, time first: «این هفته» | *«Waterloo را»* | «31 ماهواره رصد
 *    کردند.». The place is the fronted object, so the count and the verb end the sentence, the part the English puts
 *    first; the serif block holds the place with its «را», the words on its line. One is a word («یک ماهواره رصد
 *    کرد.»). Zero keeps subject–object–verb, as the app's results.headline.none does: «این هفته هیچ‌یک از ماهواره‌هایی
 *    که ردیابی می‌کنیم | *Waterloo را* | رصد نکرد.» (with the object first two verbs would meet, «…ردیابی می‌کنیم رصد
 *    نکرد»). The full stop closes the last text block, so a cut place needs nothing special. Joined with spaces, the
 *    parts are the page title, and it starts with a Persian word.
 *  - An older share's headline puts a Persian word between the satellite's name and the place («ماهوارهٔ Sentinel-2C از
 *    بالا | *Waterloo را* | رصد کرد.»), so the two Latin names never run together in the title. The satellite always
 *    follows its head noun («ماهوارهٔ», a crewed station «ایستگاه فضایی», recognised by its display name); a nameless
 *    one is «یک ماهواره».
 *  - Plain text everywhere (the PNG, the og tags, the page title): no bidi control characters (the app's renderers
 *    isolate clocks, percentages and Latin names as they draw, src/ui/share/bidi.ts; satori and X take the text as it
 *    is). Every string starts with a Persian letter. The sentences of the share page's description say degrees and
 *    percentages in words («5.4 درجه», «25 درصد»): outside the card no renderer would isolate their signs. Chips and
 *    the card's own lines, which the app draws, keep the signs.
 *  - Days come from Intl in CLDR `fa`, always Gregorian (`calendar: 'gregory'`; Intl's fa default is Solar Hijri), at
 *    the place's zone, as Intl writes them («یکشنبه 1 نوامبر 2026»). A counted noun is singular («31 تصویر»).
 *  - Numbers come from fmt('fa') (Western digits, fa.md §6.3); units are words («کیلومتر», «متر», «کیلومتر بر ثانیه»).
 */
import { fmt } from '../format.js'
import { formatDate } from '../dates.js'
import { accent, type Rich } from '../parts.js'
import type { CardMessages, CardWhen, PassFacts, SatName } from './index.js'

const f = fmt('fa')
const nb = '\u00a0'

// ── Days at the place, from Intl (Gregorian) ────────────────────────────────────────────────────────────────────────

/** «یکشنبه 1 نوامبر 2026»: the card is the one place a human date carries the year */
const dayYear = (ms: number, timeZone: string) =>
  formatDate('fa', ms, timeZone, { calendar: 'gregory', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
/** «3 نوامبر» (Persian months have no abbreviation) */
const dayMonth = (ms: number, timeZone: string) => formatDate('fa', ms, timeZone, { calendar: 'gregory', day: 'numeric', month: 'long' })

// ── Pieces the sentences share ──────────────────────────────────────────────────────────────────────────────────────

/**
 * «31 ماهواره رصد کردند.» · «یک ماهواره رصد کرد.» A no-break space holds the compound verb together: at the card's size
 * the block wraps, and «256 ماهواره رصد | کردند.» split the verb; now it breaks «256 ماهواره | رصد کردند.».
 */
const watched = (n: number) => (n === 1 ? `یک ماهواره رصد${nb}کرد.` : `${f.int(n)}${nb}ماهواره رصد${nb}کردند.`)
/** The serif block: the place and its object marker («Waterloo را»), the words on its line */
const object = (place: string) => accent(place, `${nb}را`)
/** The week's headline: «این هفته | *Waterloo را* | 31 ماهواره رصد کردند.»; zero puts its negative subject first */
const week = (n: number, place: string): Rich =>
  n <= 0
    ? ['این هفته هیچ‌یک از ماهواره‌هایی که ردیابی می‌کنیم', object(place), 'رصد نکرد.']
    : ['این هفته', object(place), watched(n)]

/** Display names of the crewed stations (src/engine/profiles.ts: ISS, Tiangong): no message carries a crewed flag */
const CREWED = /^(ISS|Tiangong)\b/
/** «ماهوارهٔ Sentinel-2C» · «ایستگاه فضایی ISS» · a nameless «یک ماهواره» */
const theSat = (sat: SatName) => (!sat ? 'یک ماهواره' : CREWED.test(sat) ? `ایستگاه فضایی${nb}${sat}` : `ماهوارهٔ${nb}${sat}`)

/** Moving: 0 north … 7 northwest (fa.md §4.2, the "moving" column) */
const HEADING = ['شمال', 'شمال شرقی', 'شرق', 'جنوب شرقی', 'جنوب', 'جنوب غربی', 'غرب', 'شمال غربی']
/** « روز یکشنبه 1 نوامبر 2026 ساعت 11:21 EST»: the date, then the clock with its zone */
const at = (w?: CardWhen) => (w ? ` روز ${dayYear(w.ms, w.timeZone)} ساعت ${w.clock}${nb}${w.zone}` : '')
/** « و رو به جنوب می‌رفت» */
const moving = (heading?: number) => (heading !== undefined && HEADING[heading] ? ` و رو به ${HEADING[heading]} می‌رفت` : '')
/** «92%»: a percentage on the card (drawn by the app, which isolates it) */
const pct = (n: number) => `${f.int(n)}%`
/** «92 درصد»: a percentage in a sentence that leaves the card (the post, the page's description) */
const percent = (n: number) => `${f.int(n)}${nb}درصد`

const fa: CardMessages = {
  // ── The headline: time, the place in the serif, then the count and the verb ───────────────────────────────────────

  headline: (satellites: number, place: string, _cut: boolean): Rich => week(satellites, place),
  headlineBy: {
    imaged: (sat: SatName, place: string, _cut: boolean): Rich => [`${theSat(sat)} از بالا`, object(place), 'رصد کرد.'],
    likely: (sat: SatName, place: string, _cut: boolean): Rich => [`${theSat(sat)} از بالا`, object(place), 'پوشش داد.'],
    // «در دیدرس» ("within view"); «از دیدرس» pulls towards «از دیدرس خارج شد», "went out of sight"
    could: (sat: SatName, place: string, _cut: boolean): Rich => [`${theSat(sat)} در دیدرس`, accent(place), 'گذشت.'],
    overhead: (sat: SatName, place: string, _cut: boolean): Rich => [`${theSat(sat)} از فراز`, accent(place), 'گذشت.'],
  },
  headlineWeek: (satellites: number, place: string, _cut: boolean): Rich => week(satellites, place),

  // ── The line under the headline ───────────────────────────────────────────────────────────────────────────────────

  photos: (count: number, atLeast: boolean) =>
    count <= 0 ? 'هیچ تصویری منتشر نشد.' : `${atLeast ? 'دست‌کم ' : ''}${count === 1 ? 'یک' : f.int(count)}${nb}تصویر منتشر شد.`,
  archiveDown: 'آرشیوهای تصویر پاسخ ندادند، پس فعلاً نمی‌توانیم تصویرهای منتشرشده را بشماریم.',
  archiveDownShort: 'آرشیوهای تصویر پاسخ ندادند.',
  cloud: {
    only: {
      sub: (_pct: number) => 'پوشیده از ابر. جز ابر چیزی ندید.',
      chip: (p: number) => `پوشیده از ابر · ${pct(p)}`,
      post: (_pct: number) => 'جز ابر چیزی ندید.',
      desc: (p: number) => `جز ابر چیزی ندید (${percent(p)}).`,
    },
    // «… صحنه»: the percentage is the scene's, not the place's. As a label «عمدتاً ابری»: a bare «بیشتر ابر» reads
    // "more cloud"; the sentences' «بیشتر ابر دید» ("saw mostly cloud") is adverbial and stays.
    mostly: {
      sub: (p: number) => `عمدتاً ابری: ${pct(p)} صحنه.`,
      chip: (p: number) => `عمدتاً ابری · ${pct(p)}`,
      post: (p: number) => `بیشتر ابر دید (${percent(p)} صحنه).`,
      desc: (p: number) => `بیشتر ابر دید (${percent(p)} صحنه).`,
    },
    spot: { sub: 'ابر درست روی همان نقطه.', chip: 'ابر روی نقطه', post: 'ابر نقطه را پوشانده بود.', desc: 'ابر نقطه را پوشانده بود.' },
  },

  // ── The top row ───────────────────────────────────────────────────────────────────────────────────────────────────

  stamp: (ms: number, timeZone: string, clock: string, zone: string) => `${dayYear(ms, timeZone)} · ${clock}${nb}${zone}`,
  weekTo: (ms: number, timeZone: string) => `7${nb}روز تا ${dayYear(ms, timeZone)}`,
  lastWeek: `7${nb}روز گذشته`,

  // ── Readouts ──────────────────────────────────────────────────────────────────────────────────────────────────────

  readout: {
    altitude: 'ارتفاع',
    // Always with «زاویهٔ»: a bare «ارتفاع» is the altitude
    elevation: 'زاویهٔ ارتفاع',
    speed: 'سرعت',
    // Never «میل», which reads as orbital inclination
    offNadir: 'انحراف',
    pixel: 'پیکسل',
    mosaicPixel: 'پیکسل موزاییک',
    closest: 'نزدیک‌ترین',
  },
  lane: { imaged: 'تصویر', likely: 'محتمل', could: 'ممکن', overhead: 'بالای سر' },
  unit: { km: 'کیلومتر', m: 'متر', kmPerSecond: 'کیلومتر بر ثانیه' },
  decimal: (n: number, digits: number) => f.dec(n, digits),

  // ── Over the picture ──────────────────────────────────────────────────────────────────────────────────────────────

  pixelSize: (metres: number) =>
    metres >= 1000 ? `${f.int(metres / 1000)}${nb}کیلومتر` : `${metres < 1 ? f.dec(metres, 2) : f.int(metres)}${nb}متر`,
  distance: (km: number) => `${f.int(km)}${nb}کیلومتر`,
  scale: (km: number) => (km >= 1 ? `${f.int(km)}${nb}کیلومتر` : `${f.int(km * 1000)}${nb}متر`),
  geometry: 'هندسهٔ گذر · شمال بالا',
  note: {
    imageInApp: 'تصویر در Watched باز می‌شود',
    imageUnavailable: 'تصویر فعلاً در دسترس نیست',
    commercial: 'آرشیو تجاری، غیرعمومی',
    inSwath: 'درون نوار؛ هنوز تصویر عمومی ندارد',
    groundTrack: 'مسیر زمینی در نزدیک‌ترین نقطه',
  },
  acquiring: 'در حال دریافت…',
  // «هیچ … عمومی‌ای»: a bare «تصویر عمومی نیست» reads "the image is not public"
  noPublicPhoto: 'این هفته هیچ تصویر عمومی‌ای نیست',
  noPhoto: 'تصویری برای نشان دادن نیست',
  look: {
    closest: 'نزدیک‌ترین نما',
    lastClear: 'آخرین نمای بی‌ابر',
    clouded: 'پوشیده از ابر',
    radar: 'رادار',
  },
  lookDay: (ms: number, timeZone: string) => dayMonth(ms, timeZone),
  // A lone label (chips, the plan plate's callout); sentences say «یک ماهواره» themselves.
  aSatellite: 'یک ماهواره',
  // A question, as the page's own question, for the English imperative "See what watched you".
  invite: 'چه چیزی شما را رصد کرد؟',

  // ── The default card ──────────────────────────────────────────────────────────────────────────────────────────────

  // "Something this week / watched *you*." (fa.md §3.1): two lines, the accent on «شما».
  hero: [['چیزی این هفته'], [accent('شما'), ' را رصد کرد.']] as Rich[],
  // One searches a place; only a name is «وارد کردن» (entered)
  enterAnyPlace: 'هر جای زمین را جستجو کنید',
  defaultPlace: 'نخل جمیرا',
  defaultAlt: `عکسی واقعی از نخل جمیرا در دبی، گرفته‌شده با ماهوارهٔ${nb}Sentinel-2، کنار این جمله: چیزی این هفته شما را رصد کرد. هر جای زمین را جستجو کنید.`,

  // ── The share page ────────────────────────────────────────────────────────────────────────────────────────────────

  page: {
    title: 'چیزی این هفته شما را رصد کرد.',
    description: `هر جای زمین را جستجو کنید و همهٔ ماهواره‌هایی را ببینید که در 7${nb}روز گذشته از فرازش گذشتند، همراه با تصویرهای واقعی‌ای که گرفتند.`,
    // «چه چیزی» is the subject and comes first, so the title starts with a Persian word.
    placeTitle: (place: string) => `چه چیزی این هفته ${place} را رصد کرد`,
    placeDescription: (place: string) =>
      `همهٔ ماهواره‌هایی که در 7${nb}روز گذشته از فراز ${place} گذشتند، همراه با تصویرهای واقعی‌ای که گرفتند. این هفته چه چیزی شما را رصد کرد؟`,
    opening: ['در حال باز کردن ', accent('Watched')] as Rich,
  },
  // Every "crossed" and "passed" is «گذشت» (never «پرواز», fa.md §8.2); the moment, the altitude and the heading each
  // drop out cleanly when unknown, and «از فراز» always stands between the satellite's name and the place.
  crossed: (o: PassFacts & { verdict: 'imaged' | 'likely' | 'overhead'; altitudeKm?: number }) => {
    const alt = o.altitudeKm !== undefined ? ` در ارتفاع ${f.int(o.altitudeKm)}${nb}کیلومتری` : ''
    return `${theSat(o.sat)}${at(o.when)}${alt} از فراز ${o.place} گذشت${moving(o.heading)}.`
  },
  withinView: (o: PassFacts) => `${theSat(o.sat)}${at(o.when)} در دیدرس ${o.place} گذشت${moving(o.heading)}.`,
  couldHave: 'می‌توانست به این‌جا نگاه کند. اپراتورش نمی‌گوید که نگاه کرد یا نه.',
  straightDown: 'درست رو به پایین نگاه می‌کرد.',
  offNadir: (deg: number) => `با ${f.dec(deg, 1)}${nb}درجه انحراف از راستای قائم رو به پایین نگاه می‌کرد.`,
  cloudCover: (p: number) => `پوشش ابر: ${percent(p)}.`,
  // Starts with Persian: the swath is the subject, the place its object.
  inSwath: (place: string) => `نوار تصویربرداری‌اش ${place} را در بر می‌گرفت.`,
  bestFrom: {
    closest: (sat: SatName) => `نزدیک‌ترین نما از ${theSat(sat)} است.`,
    lastClear: (sat: SatName) => `آخرین نمای بی‌ابر از ${theSat(sat)} است.`,
    first: (sat: SatName) => `نخستین تصویر از ${theSat(sat)} است.`,
  },
  question: 'این هفته چه چیزی شما را رصد کرد؟',
  cardAlt: {
    // «اشتراک» alone is a subscription («کارت اشتراک», a membership card): sharing is «اشتراک‌گذاری»
    withPhoto: (sat: SatName) => `کارت اشتراک‌گذاری، با نزدیک‌ترین تصویر این هفته که ${theSat(sat)} گرفته است.`,
    plain: 'کارت اشتراک‌گذاری.',
  },
}

export default fa
