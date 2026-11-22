/**
 * Hindi copy for the share card and the share page (see docs/i18n/hi.md §3.1, §3.3, §3.5, §3.6, §5): every word the
 * card prints and every word the server writes around it. Pure TypeScript, no DOM, Node or src/ imports: the server
 * reads it through cardMessages('hi'), and the app's hi bundle lists this very module.
 *
 * Why it is built this way:
 *  - The place leads the headline, in the serif, with its postposition on its line («*Waterloo को*», «*Waterloo के ऊपर
 *    से*»), and the lead block after it ends on the verb and the danda: «31 उपग्रहों ने देखा।». Object first is plain
 *    Hindi when the subject is the news, and a block that opened on «को» would look broken. A cut place («…») needs no
 *    care: the danda belongs to the last block, never to the place.
 *  - No word agrees with the place or the satellite's unknown gender: "watched" is «ने … को देखा» (one form for every
 *    count), "swept over" and "within view" put our own feminine nouns in the subject («Sentinel-2C की पट्टी गुज़री»,
 *    «Waterloo तक · Sentinel-2C की पहुँच थी»: the could verdict's words all rest on «पहुँच»), and every satellite is
 *    masculine (§5.2). A nameless one is «एक उपग्रह» / «किसी उपग्रह».
 *  - "What watched you" is «किस चीज़ ने», as the hero's «किसी चीज़ ने»: «किसने» would ask "who", a person.
 *  - A heading folds into the sentence as «दक्षिण की ओर जाते हुए», never «गुज़रा और … जा रहा था».
 *  - Counts take Hindi's plural, zero the plural too; a number is tied to its noun or unit by a no-break space.
 *  - Days come from Intl's parts at the place's zone with the full month: «रवि, 1 नवंबर 2026» in stamps, «रविवार, 1
 *    नवंबर 2026 को» in prose. Units are Hindi's symbols «किमी», «मी», and «किमी/से» in the readout cells. Compass words
 *    in prose are Hindi.
 */
import { fmt } from '../format.js'
import { dateFormat } from '../dates.js'
import { accent, type Rich } from '../parts.js'
import type { CardMessages, CardWhen, PassFacts, SatName } from './index.js'

const f = fmt('hi')
/** Hindi counts zero with the plural; Intl files 0 under `one` (docs/i18n/hi.md §5.3) */
const pl = <T,>(n: number, one: T, other: T): T => (n <= 0 ? other : f.plural(n, { one, other }))

// ── Days at the place, from Intl's parts ────────────────────────────────────────────────────────────────────────────

const DAY: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }
const PROSE: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }

function dayParts(ms: number, timeZone: string, opts: Intl.DateTimeFormatOptions) {
  const parts = dateFormat('hi', timeZone, opts).formatToParts(ms)
  const get = (t: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === t)?.value ?? ''
  return { weekday: get('weekday'), day: get('day'), month: get('month'), year: get('year') }
}
/** «रवि, 1 नवंबर 2026»: the card is the one place a short date carries the year */
const dayYear = (ms: number, timeZone: string) => {
  const d = dayParts(ms, timeZone, DAY)
  return `${d.weekday}, ${d.day}\u00a0${d.month} ${d.year}`
}
/** «3 नवंबर» */
const dayMonth = (ms: number, timeZone: string) => {
  const d = dayParts(ms, timeZone, DAY)
  return `${d.day}\u00a0${d.month}`
}
/** «रविवार, 1 नवंबर 2026» (prose) */
const dateProse = (ms: number, timeZone: string) => {
  const d = dayParts(ms, timeZone, PROSE)
  return `${d.weekday}, ${d.day}\u00a0${d.month} ${d.year}`
}

// ── Pieces the sentences share ──────────────────────────────────────────────────────────────────────────────────────

/**
 * «31 उपग्रहों ने देखा।» / «1 उपग्रह ने देखा।» / zero: «हमारी सूची के किसी भी उपग्रह ने नहीं देखा।» (as the results say).
 * «ने देखा।» is tied, so the verb never stands alone on a line («262 उपग्रहों ने / देखा।» at a pass card's 84 px).
 */
const watched = (n: number) =>
  n > 0 ? `${f.int(n)}\u00a0${pl(n, 'उपग्रह', 'उपग्रहों')} ने\u00a0देखा।` : 'हमारी सूची के किसी भी उपग्रह ने नहीं देखा।'
/**
 * The headline's serif block: the place and the postposition on its line, the place tied to the postposition's first
 * word. A postposition's words are tied by the caller where one would be left alone («के ऊपर / से»).
 */
const head = (place: string, post: string) => accent(`${place}\u00a0${post}`)
/** «Sentinel-2C» / «एक उपग्रह» (a subject) */
const sat = (s: SatName) => s ?? 'एक उपग्रह'
/** «Sentinel-2C» / «किसी उपग्रह» (before ने, की) */
const satObl = (s: SatName) => s ?? 'किसी उपग्रह'

/** Where it moved, 0 north … 7 northwest («दक्षिण की ओर») */
const COMPASS = ['उत्तर', 'उत्तर-पूर्व', 'पूर्व', 'दक्षिण-पूर्व', 'दक्षिण', 'दक्षिण-पश्चिम', 'पश्चिम', 'उत्तर-पश्चिम']
/** «रविवार, 1 नवंबर 2026 को 11:21 EST पर » */
const at = (w?: CardWhen) => (w ? `${dateProse(w.ms, w.timeZone)} को ${w.clock}\u00a0${w.zone} पर ` : '')
/** «दक्षिण की ओर जाते हुए »: before the place, agreeing with the sentence's satellite (masculine) */
const moving = (heading?: number) => (heading !== undefined && COMPASS[heading] ? `${COMPASS[heading]} की ओर जाते हुए ` : '')

const hi: CardMessages = {
  // ── The headline: the place first, in the serif; the lead after it ────────────────────────────────────────────────

  headline: (satellites: number, place: string, _cut: boolean): Rich => [head(place, 'को'), watched(satellites)],
  // The verb is tied to the word before it («ने देखा।», «पट्टी गुज़री।», «पहुँच थी।»), and «ऊपर से» is tied, so no line
  // holds a lone «देखा।», «गुज़री।» or «से» (each did at 72–84 px, 2026-11-22). A satellite's name is never tied to the
  // verb: a Latin name in capitals is wider a letter than headlineSizeDevanagari counts a tied run (STARLINK-31234);
  // a lone «गुज़रा।» is left to its size check instead.
  headlineBy: {
    imaged: (s: SatName, place: string, _cut: boolean): Rich => [head(place, 'को'), `${satObl(s)} ने\u00a0देखा।`],
    likely: (s: SatName, place: string, _cut: boolean): Rich => [head(place, 'के ऊपर\u00a0से'), `${satObl(s)} की पट्टी\u00a0गुज़री।`],
    could: (s: SatName, place: string, _cut: boolean): Rich => [head(place, 'तक'), `${satObl(s)} की पहुँच\u00a0थी।`],
    overhead: (s: SatName, place: string, _cut: boolean): Rich => [head(place, 'के ऊपर\u00a0से'), `${sat(s)} गुज़रा।`],
  },
  // The count, its verb and the danda are tied (no-break spaces), so the lead breaks after «इस हफ़्ते» and never leaves
  // «देखा।» alone on a line: «262 उपग्रहों ने देखा।» is 380 px at the week card's 62 px (441 px at 72) in the 466 px
  // column, measured 2026-11-22. A week's lead is always over 24 units, so it is never set at 84 px. Zero is too long
  // to tie whole: «किसी भी», «उपग्रह ने» and «नहीं देखा।» are tied, so it breaks «… के / किसी भी उपग्रह ने / नहीं
  // देखा।» (no lone verb, no line that opens on «ने»), checked in satori with a short and a 33-letter place.
  headlineWeek: (satellites: number, place: string, _cut: boolean): Rich => [
    head(place, 'को'),
    `इस हफ़्ते ${satellites > 0 ? watched(satellites).replace(/ /g, '\u00a0') : watched(0).replace('किसी भी उपग्रह ने नहीं देखा।', 'किसी\u00a0भी उपग्रह\u00a0ने नहीं\u00a0देखा।')}`,
  ],

  // ── The line under the headline ───────────────────────────────────────────────────────────────────────────────────

  // The verb agrees with «तस्वीर» (f), our own noun, so removing «कम से कम» changes no other word.
  photos: (count: number, atLeast: boolean) =>
    count <= 0
      ? 'कोई तस्वीर सार्वजनिक नहीं हुई।'
      : `${atLeast ? 'कम से कम ' : ''}${f.int(count)}\u00a0${pl(count, 'तस्वीर सार्वजनिक हुई।', 'तस्वीरें सार्वजनिक हुईं।')}`,
  archiveDown: 'तस्वीरों के संग्रहों ने जवाब नहीं दिया, इसलिए हम अभी सार्वजनिक तस्वीरें नहीं गिन सकते।',
  archiveDownShort: 'तस्वीरों के संग्रहों ने जवाब नहीं दिया।',
  cloud: {
    only: {
      sub: (_pct: number) => 'बादल छाए थे। उसे सिर्फ़ बादल दिखे।',
      chip: (pct: number) => `बादल छाए · ${f.pct(pct)}`,
      post: (_pct: number) => 'उसे सिर्फ़ बादल दिखे।',
      desc: (pct: number) => `उसे सिर्फ़ बादल दिखे (${f.pct(pct)})।`,
    },
    mostly: {
      sub: (pct: number) => `दृश्य के ${f.pct(pct)} हिस्से पर बादल।`,
      chip: (pct: number) => `ज़्यादातर बादल · ${f.pct(pct)}`,
      post: (pct: number) => `उसे ज़्यादातर बादल दिखे (${f.pct(pct)})।`,
      desc: (pct: number) => `उसे ज़्यादातर बादल दिखे (${f.pct(pct)})।`,
    },
    spot: {
      sub: 'इस जगह के ठीक ऊपर बादल।',
      chip: 'जगह के ऊपर बादल',
      post: 'इस जगह को बादलों ने ढक लिया।',
      desc: 'इस जगह को बादलों ने ढक लिया।',
    },
  },

  // ── The top row ───────────────────────────────────────────────────────────────────────────────────────────────────

  stamp: (ms: number, timeZone: string, clock: string, zone: string) => `${dayYear(ms, timeZone)} · ${clock}\u00a0${zone}`,
  weekTo: (ms: number, timeZone: string) => `${dayYear(ms, timeZone)} तक के 7\u00a0दिन`,
  lastWeek: 'पिछले 7\u00a0दिन',

  // ── Readouts ──────────────────────────────────────────────────────────────────────────────────────────────────────

  readout: {
    altitude: 'ऊँचाई',
    elevation: 'क्षितिज से',
    speed: 'रफ़्तार',
    offNadir: 'झुकाव',
    pixel: 'पिक्सेल',
    mosaicPixel: 'मोज़ेक पिक्सेल',
    closest: 'सबसे नज़दीक',
  },
  lane: { imaged: 'तस्वीर', likely: 'संभवतः', could: 'पहुँच में', overhead: 'ऊपर से' },
  unit: { km: 'किमी', m: 'मी', kmPerSecond: 'किमी/से' },
  decimal: (n: number, digits: number) => f.dec(n, digits),

  // ── Over the picture ──────────────────────────────────────────────────────────────────────────────────────────────

  pixelSize: (metres: number) =>
    metres >= 1000 ? `${f.int(metres / 1000)}\u00a0किमी` : `${metres < 1 ? f.dec(metres, 2) : f.int(metres)}\u00a0मी`,
  distance: (km: number) => `${f.int(km)}\u00a0किमी`,
  scale: (km: number) => (km >= 1 ? `${f.int(km)}\u00a0किमी` : `${f.int(km * 1000)}\u00a0मी`),
  geometry: 'उड़ान की ज्यामिति · उत्तर ऊपर',
  note: {
    imageInApp: 'तस्वीर ऐप में खुलती है',
    imageUnavailable: 'तस्वीर अभी उपलब्ध नहीं',
    commercial: 'व्यावसायिक संग्रह, सार्वजनिक नहीं',
    inSwath: 'पट्टी में, अभी सार्वजनिक तस्वीर नहीं',
    groundTrack: 'सबसे नज़दीक होने पर ज़मीनी पथ',
  },
  acquiring: 'प्राप्त हो रही है…',
  noPublicPhoto: 'इस हफ़्ते कोई सार्वजनिक फ़ोटो नहीं',
  noPhoto: 'दिखाने को कोई फ़ोटो नहीं',
  look: {
    closest: 'सबसे नज़दीकी झलक',
    lastClear: 'आखिरी साफ़ झलक',
    clouded: 'बादल छाए',
    radar: 'रडार',
  },
  lookDay: (ms: number, timeZone: string) => dayMonth(ms, timeZone),
  aSatellite: 'एक उपग्रह',
  invite: 'देखें, आपको किस चीज़ ने देखा',

  // ── The default card ──────────────────────────────────────────────────────────────────────────────────────────────

  hero: [['किसी चीज़ ने'], ['इस हफ़्ते'], [accent('आपको'), ' देखा।']] as Rich[],
  enterAnyPlace: 'धरती की कोई भी जगह खोजें',
  defaultPlace: 'पाम जुमेराह',
  defaultAlt:
    'दुबई के पाम जुमेराह की Sentinel-2 उपग्रह से ली गई असली फ़ोटो, इस पंक्ति के साथ: किसी चीज़ ने इस हफ़्ते आपको देखा। धरती की कोई भी जगह खोजें।',

  // ── The share page ────────────────────────────────────────────────────────────────────────────────────────────────

  page: {
    title: 'किसी चीज़ ने इस हफ़्ते आपको देखा।',
    description: 'धरती की कोई भी जगह खोजें। पिछले 7\u00a0दिनों में उसके ऊपर से गुज़रे सभी उपग्रह देखें, और उनकी ली हुई असली तस्वीरें भी।',
    placeTitle: (place: string) => `${place} को इस हफ़्ते किस चीज़ ने देखा`,
    placeDescription: (place: string) =>
      `पिछले 7\u00a0दिनों में ${place} के ऊपर से गुज़रे सभी उपग्रह, और उनकी ली हुई असली तस्वीरें। इस हफ़्ते आपको किस चीज़ ने देखा?`,
    opening: [accent('Watched'), ' खुल रहा है'] as Rich,
  },
  // With a time, the satellite leads and the date stands between it and the place; without one, the place leads, so
  // two Latin names never touch («Sentinel-2C Waterloo» would read as one name). The heading, when known, stands just
  // before the verb's path: «दक्षिण की ओर जाते हुए Waterloo के … ऊपर से», or after the satellite when the place leads.
  crossed: (o: PassFacts & { verdict: 'imaged' | 'likely' | 'overhead'; altitudeKm?: number }) => {
    const over = `${o.place} के ${o.altitudeKm !== undefined ? `${f.int(o.altitudeKm)}\u00a0किमी ऊपर से` : 'ऊपर से'}`
    return `${o.when ? `${sat(o.sat)} ${at(o.when)}${moving(o.heading)}${over}` : `${over} ${sat(o.sat)} ${moving(o.heading)}`.trimEnd()} गुज़रा।`
  },
  // "Within view" is the place in its reach, the could verdict's word («पहुँच»), in a sentence of our own noun.
  withinView: (o: PassFacts) =>
    `${o.when ? `${sat(o.sat)} ${at(o.when)}${moving(o.heading)}${o.place} के पास से` : `${o.place} के पास से ${sat(o.sat)} ${moving(o.heading)}`.trimEnd()} गुज़रा। यह जगह उसकी पहुँच में थी।`,
  // The camera turns, not the satellite («वह मुड़ सकता था» reads as changing course), and is named again after «संचालक».
  couldHave: 'उसका कैमरा इधर मुड़ सकता था। उसका संचालक नहीं बताता कि कैमरा मुड़ा या नहीं।',
  straightDown: 'उसका कैमरा सीधे नीचे देख रहा था।',
  offNadir: (deg: number) => `उसका कैमरा सीधे नीचे से ${f.dec(deg, 1)}° हटकर देख रहा था।`,
  cloudCover: (pct: number) => `दृश्य के ${f.pct(pct)} हिस्से पर बादल थे।`,
  inSwath: (place: string) => `उसकी पट्टी ${place} के ऊपर से गुज़री।`,
  bestFrom: {
    closest: (s: SatName) => `सबसे नज़दीकी झलक ${satObl(s)} की है।`,
    lastClear: (s: SatName) => `आखिरी साफ़ झलक ${satObl(s)} की है।`,
    first: (s: SatName) => `पहली तस्वीर ${satObl(s)} की है।`,
  },
  question: 'इस हफ़्ते आपको किस चीज़ ने देखा?',
  cardAlt: {
    withPhoto: (s: SatName) => `शेयर कार्ड, ${sat(s)} से ली गई हफ़्ते की सबसे नज़दीकी फ़ोटो के साथ।`,
    plain: 'शेयर कार्ड।',
  },
}

export default hi
