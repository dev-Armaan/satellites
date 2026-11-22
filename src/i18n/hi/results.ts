/**
 * Hindi copy for the results panel (see docs/i18n/hi.md §3.3, §3.5, §4.1, §5, §6, §7): the headline and its second
 * line, the reasons no image was made public, the footnotes, the computing readout, the headers, the timeline, the
 * replay controls, the plan view, the geostationary rows and the picture captions.
 *
 * Why it is built this way:
 *  - The headline is object first: «पिछले 7 दिनों में *Waterloo* को **256 उपग्रहों ने देखा**।» Hindi's focus sits
 *    right before the verb, which is where the strong count phrase goes; «ने» keeps «देखा» one form for every count
 *    and every place. The place takes «को», tied to it by a no-break space so a line never opens on the postposition.
 *  - The place never governs a verb or an adjective: it is followed by a postposition, and «यहाँ», «इसे», «इस जगह»
 *    point back to it.
 *  - Counts take Hindi's plural, and zero the plural too (Intl files 0 under `one`); before a postposition the noun is
 *    oblique («7 दिनों में», «250 उपग्रहों की»). A count of passes in a verdict is «बार», invariant.
 *  - «सार्वजनिक हुई / हुईं» agrees with «तस्वीर», our own noun, so removing «कम से कम» changes no other word.
 *  - Days come from the hi 'time' namespace (Intl's forms, full months); a span is «A से B के बीच».
 */
import type en from '../en/results'
import type { PlaceWhen, UtcWhen, WindowWhen } from '../en/results'
import { fmt } from '../../../api/_lib/i18n/format'
import { accent, num, strong, type Part, type Rich } from '../../../api/_lib/i18n/parts'
import type { Pass, SatCategory } from '@/types'
import type { DateFields } from '@/ui/results/lib/time'
import { localParts } from '@/ui/results/lib/time'
import time from './time'

const f = fmt('hi')
type Verdict = Pass['verdict']
/** Hindi counts zero with the plural; Intl files 0 under `one` (docs/i18n/hi.md §5.3) */
const pl = <T,>(n: number, one: T, other: T): T => (n === 0 ? other : f.plural(n, { one, other }))
/** «7 दिन», «1 उड़ान»: a count and its noun, tied with a no-break space */
const count = (n: number, one: string, other: string) => `${f.int(n)}\u00a0${pl(n, one, other)}`

/** «1 नवंबर» / «रवि, 1 नवंबर» at a zone: the hi 'time' namespace's forms, from the instant */
const dayMonth = (ms: number, timeZone: string) => time.dayMonth(ms, timeZone, localParts(ms, timeZone))
const day = (ms: number, timeZone: string) => time.day(ms, timeZone, localParts(ms, timeZone))

/** «पिछले 7 दिनों में» · «पिछले 1 दिन में» · «29 अक्टूबर से 5 नवंबर के बीच» */
const windowWords = (when: WindowWhen) =>
  'lastDays' in when
    ? `पिछले ${count(when.lastDays, 'दिन', 'दिनों')} में`
    : `${dayMonth(when.fromMs, when.timeZone)} से ${dayMonth(when.toMs, when.timeZone)} के बीच`

/**
 * The place in a headline, a short name kept whole: «New\u00a0Delhi», «Rio\u00a0de\u00a0Janeiro». The headline is
 * balanced, and it broke inside the serif name at every phone width («पिछले 7 दिनों में New / Delhi को»); kept whole,
 * it breaks after «को», before the count (measured at 360–430 px). A longer name keeps its spaces, so it can wrap.
 */
const wholePlace = (place: string) => (place.length <= 20 && place.split(' ').length <= 3 ? place.replace(/ /g, '\u00a0') : place)

/** A date stamp or a range that never breaks at its hyphen or dash («2026-11-19», «2–5»): a word joiner after each */
const unbroken = (s: string) => s.replace(/([-–])/g, '$1\u2060')

/** «तस्वीरें लेने वाले और मानवयुक्त 250 उपग्रहों की 1,234 उड़ानें जाँची गईं।» */
const checked = (passes: number, sats: number) =>
  `तस्वीरें लेने वाले और मानवयुक्त ${count(sats, 'उपग्रह', 'उपग्रहों')} की ${count(passes, 'उड़ान', 'उड़ानें')} ${pl(passes, 'जाँची गई', 'जाँची गईं')}।`

/** What a pass's mark stands for in the timeline's tooltip: the kind of satellite and the mark's shape */
const MARK_KIND: Partial<Record<SatCategory, string>> = {
  'open-optical': 'खुले संग्रह वाला इमेजर · ◇',
  'commercial-optical': 'व्यावसायिक · □',
  radar: 'रडार · ▣',
  'weather-leo': 'मौसम · ○',
  crewed: 'मानवयुक्त · ✛',
}

const VERDICT_ORDER = ['imaged', 'likely', 'could', 'overhead'] as const

const results: typeof en = {
  // ── the headline ──
  headline: {
    watched: (n: number, place: string, when: WindowWhen): Rich => [
      `${windowWords(when)} `,
      accent(wholePlace(place)),
      '\u00a0को ',
      strong(num(f.int(n)), `\u00a0${pl(n, 'उपग्रह', 'उपग्रहों')} ने देखा`),
      '।',
    ],
    none: (place: string, past: boolean): Rich => [
      `${past ? 'उस' : 'इस'} हफ़्ते `,
      accent(wholePlace(place)),
      '\u00a0को हमारी सूची के किसी भी उपग्रह ने नहीं देखा।',
    ],
  },

  // ── the second line ──
  imagesPublic: (k: number): Rich => [
    strong('कम से कम '),
    num(f.int(k)),
    pl(k, '\u00a0तस्वीर सार्वजनिक हुई।', '\u00a0तस्वीरें सार्वजनिक हुईं।'),
  ],
  noImages: { thisWeek: 'इस हफ़्ते कोई तस्वीर सार्वजनिक नहीं हुई।', thatWeek: 'उस हफ़्ते कोई तस्वीर सार्वजनिक नहीं हुई।' },
  archiveDown: 'तस्वीरों के संग्रहों ने जवाब नहीं दिया, इसलिए हम अभी सार्वजनिक तस्वीरें नहीं गिन सकते।',
  tryAgain: 'फिर कोशिश करें',
  share: 'शेयर करें',
  shareWeekLabel: (place: string, past: boolean) => `${place} का ${past ? 'वह' : 'यह'} हफ़्ता शेयर करें`,

  why: {
    sunNeverRose: 'सूरज निकला ही नहीं, इसलिए दिन के उजाले पर निर्भर कोई कैमरा इसे नहीं देख सका।',
    sunBarelyRose: 'सूरज मुश्किल से ही निकला, इसलिए दिन के उजाले पर निर्भर कोई कैमरा इसे नहीं देख सका।',
    infrared: (n: number): Rich => ['फिर भी मौसम उपग्रहों ने इन्फ्रारेड में इसे ', num(f.int(n)), '\u00a0बार स्कैन किया।'],
    // The names are a list, so the verb is plural unless one named satellite stands alone. "Passed within view" is the
    // could verdict's spoken verb, «पहुँच के दायरे में आया», and it stands between the names and the count, so a name
    // that ends in a number never runs into it («Capella-14 1,204»).
    radar: (names: readonly string[], others: number, passes: number): Rich => {
      const rest = others > 0 ? [`${f.int(others)}\u00a0${names.length ? pl(others, 'दूसरा रडार उपग्रह', 'दूसरे रडार उपग्रह') : 'रडार उपग्रह'}`] : []
      const all = [...names, ...rest]
      // Hindi puts no comma before «और» (Intl's hi list does): «Umbra-08, Capella-14 और 7 दूसरे रडार उपग्रह».
      const who = all.length > 1 ? `${all.slice(0, -1).join(', ')} और ${all[all.length - 1]}` : (all[0] ?? 'रडार उपग्रह')
      const one = all.length === 1 && (names.length === 1 || others === 1)
      return ['रडार को रोशनी की ज़रूरत नहीं होती। ', `${who} पहुँच के दायरे में `, num(f.int(passes)), `\u00a0बार ${one ? 'आया' : 'आए'}।`]
    },
    // Daylight is «दिन के उजाले में»: «दिन में 6 बार» would read "6 times a day".
    unpublished: (n: number) =>
      n === 1
        ? 'Sentinel-2 या Landsat का एक उपग्रह दिन के उजाले में एक बार यहाँ से गुज़रा, पर अभी तक कोई दृश्य प्रकाशित नहीं हुआ है।'
        : `Sentinel-2 या Landsat के उपग्रह दिन के उजाले में ${f.int(n)}\u00a0बार यहाँ से गुज़रे, पर अभी तक कोई दृश्य प्रकाशित नहीं हुआ है।`,
    none: 'सार्वजनिक तस्वीरें देने वाला कोई उपग्रह दिन के उजाले में यहाँ से नहीं गुज़रा।',
  },

  // ── the summary's four readouts ──
  verdictGroup: 'नतीजे के हिसाब से उड़ानें। हर एक अपनी सूची पर ले जाता है।',
  verdictReadout: (n: number, _verdict: Verdict, title: string) => `${f.int(n)}\u00a0बार: ${title}`,

  // ── the footnotes ──
  notes: {
    counted: (o: { detailed: number; mosaics: number; radar: number; geo: number; passes: number; satellites: number }): Rich => {
      // «बारीक ब्योरे वाली»: a bare «बारीक तस्वीरें» reads "thin pictures". «दैनिक मौसम मोज़ेक» is the same for 1 and 3.
      // Each count is followed by its own noun, its sources in brackets: «1 भूस्थिर मौसम उपग्रहों से» read
      // "1 satellites".
      const out: Part[] = [strong(f.int(o.detailed)), `\u00a0बारीक ब्योरे वाली ${pl(o.detailed, 'तस्वीर', 'तस्वीरें')} (${unbroken('Sentinel-2')}, Landsat, ${unbroken('10–30')}\u00a0मी)`]
      if (o.mosaics) out.push(' · ', strong(f.int(o.mosaics)), `\u00a0दैनिक मौसम मोज़ेक (${unbroken('250–375')}\u00a0मी)`)
      if (o.radar) out.push(' · ', strong(f.int(o.radar)), `\u00a0रडार ${pl(o.radar, 'तस्वीर', 'तस्वीरें')} (${unbroken('Sentinel-1')}, 20\u00a0मी)`)
      if (o.geo)
        out.push(
          ' · ',
          strong(f.int(o.geo)),
          `\u00a0पूरी डिस्क की ${pl(o.geo, 'तस्वीर', 'तस्वीरें')} (भूस्थिर मौसम उपग्रहों से, ${unbroken('2–5')}\u00a0किमी, हर एक की सबसे नई दिखाई गई है)`,
        )
      out.push(`। ${checked(o.passes, o.satellites)}`)
      return out
    },
    checked: (passes: number, satellites: number) => checked(passes, satellites),
    passTimes: (place: string, fetched: string | undefined, zoneLabel: string) =>
      // The zone is a label after a colon: it can be «UTC−9 · समुद्र में», which takes no postposition.
      `उड़ानों का समय वह पल है जब हर उपग्रह ${place} के सबसे नज़दीक था। इसकी गणना कक्षा के सार्वजनिक आँकड़ों से की गई है` +
      `${fetched ? ` (प्राप्त ${unbroken(fetched)})` : ''}। स्थानीय समय: ${zoneLabel}।`,
  },

  // ── the panel ──
  sheetLabel: (place: string) => `${place} के ऊपर के उपग्रह`,
  computingPasses: 'उड़ानों की गणना जारी',
  sections: { summary: 'सार', passes: 'उड़ानें', watchedContinuously: 'लगातार देखने वाले' },
  checkingArchives: 'संग्रहों की जाँच जारी',
  invite: {
    text: 'किसी चीज़ ने इस हफ़्ते आपको भी देखा।',
    checkPlace: 'अपनी जगह देखें',
    dismiss: 'बंद करें',
  },
  searchAnother: 'कोई और जगह खोजें',
  allPasses: 'सभी उड़ानें',

  footer: {
    replay: 'रीप्ले',
    replayLabel: 'उड़ान का रीप्ले देखें',
    replayTitle: 'ग्लोब पर उड़ान का रीप्ले देखें',
    shareLabel: { pass: 'यह उड़ान शेयर करें', image: 'यह तस्वीर शेयर करें' },
    shareButton: { pass: [strong('यह उड़ान '), 'शेयर करें'] as Rich, image: [strong('यह तस्वीर '), 'शेयर करें'] as Rich },
    checkPlace: ['अपनी जगह', strong(' देखें')] as Rich,
    clearest: ['सबसे साफ़ झलक', strong(' देखें')] as Rich,
    clearestLabel: 'सबसे साफ़ झलक देखें',
  },

  // ── the headers ──
  head: {
    windowSpan: (days: number, startMs: number, endMs: number, timeZone: string) =>
      `${count(days, 'दिन', 'दिन')} · ${time.dayRange(startMs, endMs, timeZone, localParts(startMs, timeZone), localParts(endMs, timeZone))}`,
    verifying: 'मौसम मोज़ेक की जाँच जारी',
    cancel: 'रद्द करें',
    newSearch: 'नई खोज',
    close: 'बंद करें',
    escKey: 'Esc',
    searchBarLabel: (place: string) => `कोई और जगह खोजें (अभी: ${place})`,
    change: 'बदलें',
    computing: 'गणना जारी',
    recent: 'हाल की खोजें',
    position: (k: number, n: number) => `इस तरह की ${f.int(n)}\u00a0${pl(n, 'उड़ान', 'उड़ानों')} में से उड़ान ${f.int(k)}`,
    previous: 'इस तरह की पिछली उड़ान',
    next: 'इस तरह की अगली उड़ान',
    previousTitle: 'पिछली (←)',
    nextTitle: 'अगली (→)',
    allPassesTitle: 'सभी उड़ानें (Esc)',
    shared: (sat: string, place: string) => `आपके साथ शेयर किया गया · ${sat} ने ${place} को देखा`,
    passWhen: (ms: number, timeZone: string, p: DateFields, clock: string, zone: string, approx: boolean) =>
      `${time.day(ms, timeZone, p)} · ${approx ? '≈ ' : ''}${clock}\u00a0${zone}`,
  },

  // ── the computing readout ──
  computing: {
    stages: {
      catalog: { idle: 'कक्षाओं की सूची', done: 'सूची लोड हुई' },
      propagate: { idle: (days: number) => `कक्षाओं की गणना · ${count(days, 'दिन', 'दिन')}`, done: 'कक्षाओं की गणना पूरी' },
      archive: { idle: 'Sentinel-2 + Landsat संग्रह', done: 'संग्रहों में खोज पूरी' },
      match: { idle: 'दृश्यों का उड़ानों से मिलान', done: 'दृश्यों का मिलान पूरा' },
    },
    ready: 'रिपोर्ट तैयार',
    ok: 'OK',
    seconds: (s: number) => `${f.dec(s, 2)}\u00a0सेकंड`,
    window: (days: number, from: UtcWhen, to: UtcWhen): Rich => [
      strong(`${f.int(days)}\u00a0दिन की अवधि · `),
      `${dayMonth(from.ms, 'UTC')} ${from.time} → ${dayMonth(to.ms, 'UTC')} ${to.time} UTC`,
    ],
    percent: (pct: number) => f.pct(pct),
    slow: 'Planetary Computer और NASA तस्वीरें माँगने पर ही बनाते हैं, इसलिए इस चरण में कुछ सेकंड लग सकते हैं।',
    verySlow: 'तस्वीरों के संग्रह जवाब देने में धीमे हैं। अगर जवाब नहीं आया, तब भी उड़ानें कक्षाओं की गणना से दिखाई जाएँगी, और हम यह बता देंगे।',
    sharedAlt: (sat: string | undefined, place: string) => `${sat ?? 'एक उपग्रह'} से ली गई ${place} की तस्वीर, आपके साथ शेयर की गई।`,
    sharedCaption: (sat: string | undefined, place: string, when?: PlaceWhen): Rich => [
      strong('आपके साथ शेयर किया गया'),
      ` · ${sat !== undefined ? `${sat} ने` : 'किसी उपग्रह ने'} ${place} को देखा${when ? ` · ${day(when.ms, when.timeZone)}, ${when.time}` : ''}`,
    ],
  },

  // ── 03 / Watched continuously ──
  geo: {
    none: 'इस जगह के आसमान में कोई भी चालू भूस्थिर मौसम इमेजर क्षितिज से 5° से ज़्यादा ऊपर नहीं है।',
    facts: (lon: string, elevationDeg: number, cadenceMin: number) => `${lon} · ${f.dec(elevationDeg, 1)}° ऊपर · हर ${f.int(cadenceMin)}\u00a0मिनट`,
    images: (n: number, days: number): Rich =>
      days === 7
        ? ['इस हफ़्ते ', num(f.int(n)), `\u00a0${pl(n, 'तस्वीर', 'तस्वीरें')}`]
        : [`${count(days, 'दिन', 'दिनों')} में `, num(f.int(n)), `\u00a0${pl(n, 'तस्वीर', 'तस्वीरें')}`],
    replay: 'रीप्ले',
    replayLabel: (sat: string) => `${sat}: इसकी सबसे नई तस्वीर का रीप्ले`,
    frame: {
      probing: 'खोज जारी…',
      noPublic: 'सार्वजनिक तस्वीर नहीं',
      poorQuality: 'खराब गुणवत्ता',
      noneNow: 'अभी तस्वीर नहीं',
      unavailable: 'फ़्रेम नहीं मिला',
    },
    frameAlt: (sat: string, infrared: boolean) => `${sat}: इस जगह के आसपास का सबसे नया ${infrared ? 'इन्फ्रारेड ' : ''}फ़्रेम`,
    infraredChip: 'IR',
    infraredTitle: 'इन्फ्रारेड: बादलों की चोटियाँ तापमान के हिसाब से, जितनी ठंडी, उतनी सफ़ेद',
  },

  // ── 04 / Timeline ──
  timeline: {
    title: 'समयरेखा',
    meta: (days: number, zoneLabel: string, zones?: string) =>
      `${count(days, 'दिन', 'दिन')} · ${zoneLabel}${zones ? ` · ${zones}` : ''}`,
    zoneChange: (before: string, after: string) => `${before} → ${after}`,
    daylight: 'यहाँ दिन का उजाला',
    summary: (days: number, counts: Record<Verdict, number>, titles: Readonly<Record<Verdict, string>>) =>
      `समयरेखा, ${count(days, 'दिन', 'दिन')}: ` + VERDICT_ORDER.map((v) => `${titles[v]} ${f.int(counts[v])}\u00a0बार`).join(', ') + '।',
    keysHint: (summary: string) => `${summary} बाईं और दाईं तीर कुंजियों से एक-एक उड़ान पर जाएँ।`,
    geoLane: (n: number): Rich => [strong('भूस्थिर · '), f.int(n)],
    geoNames: (names: readonly string[]) => names.join(', '),
    now: 'अभी',
    geometry: (deg: number, km: number) => `झुकाव ${f.dec(deg, 1)}° · ${f.int(km)}\u00a0किमी`,
    markMosaic: (gsdM: number) => `दैनिक मोज़ेक, ${f.int(gsdM)}\u00a0मी · ●`,
    markRadar: (gsdM: number) => `रडार तस्वीर, ${f.int(gsdM)}\u00a0मी · ◆`,
    markImaged: (title: string) => `${title} · ◆`,
    markKind: (title: string, category: SatCategory) => `${title} · ${MARK_KIND[category] ?? 'अन्य'}`,
  },

  // ── 02 / Replay ──
  replay: {
    scrubLabel: 'उड़ान के दौरान रीप्ले का समय',
    scrubValue: (tMinus: string, utc: string) => `${tMinus}, ${utc}`,
    play: 'रीप्ले चलाएँ',
    pause: 'रीप्ले रोकें',
    speed: 'रीप्ले की रफ़्तार',
    inView: (duration: string) => `पहुँच में ${duration}`,
    closest: 'सबसे नज़दीक',
    spaceKey: 'Space',
    playPause: 'चलाएँ / रोकें',
    stepKind: 'इस तरह की पिछली / अगली उड़ान',
  },

  // ── the plan view ──
  plan: {
    label: (sat: string, km: number) => `उड़ान का नक्शा: ${sat} का ज़मीनी पथ, सबसे नज़दीक होने पर इस जगह से ${f.int(km)}\u00a0किमी।`,
    northUp: 'नक्शा · उत्तर ऊपर',
    fieldOfRegard: (deg: number) => `दायरा ±${deg}°`,
    swath: (km: number) => `पट्टी ${f.int(km)}\u00a0किमी`,
    groundTrack: 'ज़मीनी पथ',
    scale: (km: number) => `${km >= 1 ? f.int(km) : f.dec(km, 1)}\u00a0किमी`,
    closest: (km: number) => `सबसे नज़दीक ${km < 1 ? '< 1' : f.int(km)}\u00a0किमी`,
  },

  // ── a picture's product line ──
  product: {
    mosaic: (m: number) => `दैनिक मोज़ेक · ${m}\u00a0मी`,
    fullDisc: (km: number) => `पूरी डिस्क · ${km}\u00a0किमी`,
    infrared: (km: number) => `इन्फ्रारेड · ${km}\u00a0किमी`,
    sentinel2: (m: number) => `Sentinel-2 L2A · ${m}\u00a0मी`,
    landsat: (m: number) => `Landsat C2 L2 · ${m}\u00a0मी`,
    sentinel1: (m: number) => `Sentinel-1 रडार · ${m}\u00a0मी`,
    other: (m: number) => `${m}\u00a0मी`,
  },
  pixel: { m: (m: number) => `${m}\u00a0मी`, km: (km: number) => `${km}\u00a0किमी` },

  // ── the time-lapse's row ──
  timelapse: {
    title: 'टाइम-लैप्स',
    sub: 'यह जगह, साल दर साल',
  },
}
export default results
