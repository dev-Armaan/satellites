/**
 * Hindi copy for one pass's paragraph (see docs/i18n/hi.md §2.2, §3.4, §4.2, §5.1, §5.2, §5.5): the sentences under a
 * pass's picture or plan view, in the English order of facts (what crossed, when, where, how it moved → what that
 * means → what we can't know).
 *
 * Why it is built this way:
 *  - Every satellite is masculine in Hindi (उपग्रह, स्टेशन), so a bare name agrees masculine («गुज़रा», «जा रहा था»)
 *    and «वह» points back to it. Wherever the English says "watched" or "imaged", the verb takes «ने» and a «को» object,
 *    so it agrees with nothing.
 *  - The place never governs a verb: it is followed by «को», «का», «तक», «के ऊपर से», and «यहाँ», «इस जगह» point
 *    back to it. "The place was inside its swath" becomes «उसकी पट्टी [PLACE] के ऊपर से गुज़री» (the swath, our own
 *    noun, is the subject, as in the likely verdict), or «यह जगह … थी».
 *  - The English one-sentence "crossed …, moving south at 7.46 km/s" is two Hindi sentences, as a Hindi report would
 *    write it. The clock opens the sentence («16:14:21 UTC पर Sentinel-2C …»): after the name it would run into a
 *    name that ends in a number («Landsat 9 16:14»). A clock takes «पर»; directions use one word table with three
 *    postpositions: «61 किमी पश्चिम से गुज़रा» (the path it passed by: गुज़रना takes «से»), «140 किमी पूर्व में था»,
 *    «उत्तर-पश्चिम में» (where it was) and «दक्षिण की ओर» (where it was heading). Readouts keep the Latin
 *    abbreviations (compass16).
 *  - "Passed within view" is «पहुँच के दायरे में आया», the verdict's spoken verb, then where it was in its own
 *    sentence («वह यहाँ से 140 किमी पूर्व में था», «वह ठीक ऊपर था»: a second «गुज़रा» would echo the swath's
 *    «गुज़री»). A radar that imaged looks «… के कोण पर» to the side (the English "looking"); one that could have
 *    pointed turns («मुड़कर», the English "pointing"), as a steerable camera does.
 *  - Numbers with units are num() parts in the mono face, units in Hindi's symbols «किमी», «मी»; a speed in prose is
 *    «किमी प्रति सेकंड» (a bare «से» after «किमी/» would read as the postposition).
 */
import type en from '../en/pass'
import type { Offset } from '../en/pass'
import { fmt } from '../../../api/_lib/i18n/format'
import { num, type Part, type Rich } from '../../../api/_lib/i18n/parts'
import type { Compass8 } from '@/ui/results/lib/copy'

const f = fmt('hi')

/** A direction's word: «पश्चिम में» where it lies from the place, «दक्षिण की ओर» where it moves */
const WORD: Record<Compass8, string> = {
  n: 'उत्तर',
  ne: 'उत्तर-पूर्व',
  e: 'पूर्व',
  se: 'दक्षिण-पूर्व',
  s: 'दक्षिण',
  sw: 'दक्षिण-पश्चिम',
  w: 'पश्चिम',
  nw: 'उत्तर-पश्चिम',
}

const km = (n: number) => num(f.int(n), 'किमी')
const m = (n: number) => num(f.int(n), 'मी')
const deg1 = (n: number) => num(f.dec(n, 1), '°')
const clock = (time: string, zone: string) => num(time, zone)
/** «ठीक ऊपर से» / «यहाँ से 61 किमी पश्चिम से»: the path it passed by (गुज़रना takes «से») */
const where = (offset?: Offset): Part[] => (offset ? ['यहाँ से ', km(offset.km), ` ${WORD[offset.dir]} से`] : ['ठीक ऊपर से'])

const pass: typeof en = {
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

  // ── a geostationary scan ──
  geo: {
    sits: (o: { sat: string; altKm: number; seat?: string; cadenceMin?: number }): Rich => [
      `${o.sat} ऊपर से गुज़रता नहीं। वह `,
      ...(o.seat !== undefined ? [`${o.seat} पर `] : []),
      'भूमध्य रेखा से ',
      km(o.altKm),
      ' ऊपर टिका रहता है',
      ...(o.cadenceMin
        ? [' और हर ', num(f.int(o.cadenceMin), 'मिनट'), ' में अपने नीचे की धरती का पूरा चेहरा स्कैन करता है।']
        : [' और अपने नीचे की धरती का पूरा चेहरा स्कैन करता है।']),
    ],
    reached: (o: { place: string; time: string; zone: string; heading: Compass8 }): Rich => [
      'इस स्कैन की रेखा करीब ',
      clock(o.time, o.zone),
      ` पर ${o.place} तक पहुँची और ${WORD[o.heading]} की ओर बढ़ रही थी।`,
    ],
    infrared: 'यहाँ अंधेरा था, इसलिए यह इन्फ्रारेड तस्वीर है: बादलों की चोटियाँ तापमान के हिसाब से, जितनी ठंडी, उतनी सफ़ेद।',
  },

  // ── a pass with a picture ──
  crossed: (o: { sat: string; altKm: number; offset?: Offset; time: string; zone: string; heading: Compass8; speedKmS: number }): Rich => [
    clock(o.time, o.zone),
    ` पर ${o.sat} `,
    ...where(o.offset),
    ' गुज़रा। वह ',
    km(o.altKm),
    ' की ऊँचाई पर ',
    num(f.dec(o.speedKmS, 2), 'किमी प्रति सेकंड'),
    ` की रफ़्तार से ${WORD[o.heading]} की ओर जा रहा था।`,
  ],
  mosaic: (o: { sensor: string; place: string; gsdM: number }): Rich => [
    `उसके ${o.sensor} इमेजर ने ${o.place} को NASA के असली रंगों वाले दैनिक मोज़ेक में `,
    m(o.gsdM),
    ' प्रति पिक्सेल पर दर्ज किया।',
  ],
  radarImaged: (o: { deg: number; place: string; gsdM: number; dark: boolean }): Rich => [
    'उसके रडार ने एक तरफ़ ',
    deg1(o.deg),
    ` के कोण पर देखते हुए ${o.dark ? 'अंधेरे में ' : ''}${o.place} की तस्वीर `,
    m(o.gsdM),
    ' प्रति पिक्सेल पर ली।',
  ],
  lookingDown: 'उसका कैमरा सीधे नीचे देख रहा था।',
  lookingOff: (deg: number): Rich => ['उसका कैमरा सीधे नीचे से ', deg1(deg), ' हटकर देख रहा था।'],
  // At 0 %, «पूरे दृश्य के 0% हिस्से पर बादल थे» ("clouds lay on 0 % of it") reads oddly; the clouds' share is plain.
  cloudCover: (pct: number): Rich =>
    Math.round(pct) === 0
      ? ['पूरे दृश्य में बादलों का हिस्सा ', num(f.int(pct), '%'), ' था।']
      : ['पूरे दृश्य के ', num(f.int(pct), '%'), ' हिस्से पर बादल थे।'],

  // ── "Likely watched" ──
  likely: {
    crossed: (o: { sat: string; altKm: number; offset?: Offset; time: string; zone: string; swathKm?: number }): Rich => [
      clock(o.time, o.zone),
      ` पर ${o.sat} `,
      ...where(o.offset),
      ' गुज़रा। वह ',
      km(o.altKm),
      ' की ऊँचाई पर था',
      ...(o.swathKm ? [', और यह जगह उसकी ', km(o.swathKm), ' चौड़ी पट्टी के भीतर थी।'] : ['।']),
    ],
    archiveFailed: 'दिन का उजाला था, इसलिए उसने इस जगह को दर्ज किया होगा। अभी संग्रह में खोज नहीं हो सकी।',
    noScene:
      'इस उड़ान का कोई दृश्य मौजूद नहीं है। Sentinel-2 सिर्फ़ ज़मीन और तट के पास का पानी दर्ज करता है, और हो सकता है कि यह जगह उसकी योजना में न रही हो।',
    notYet:
      'दिन का उजाला था, इसलिए लगभग तय है कि उसने इस जगह को दर्ज किया। ' +
      'इस उड़ान का कोई दृश्य अभी प्रकाशित नहीं हुआ है। संग्रहों में दृश्य एक दिन या उससे ज़्यादा देर से आ सकते हैं।',
    dark: 'यहाँ अंधेरा था। मौसम इमेजर रात में भी इन्फ्रारेड में स्कैन करते रहते हैं, इसलिए उसने आपके बादल देखे, आपकी सड़कें नहीं।',
    mosaicUnconfirmed: 'इस उड़ान के NASA दैनिक मोज़ेक में आपकी जगह है या नहीं, इसकी पुष्टि नहीं हो सकी।',
    notPublished: 'उसकी तस्वीरें मौसम के पूर्वानुमान में काम आती हैं, पर ऐसे प्रकाशित नहीं होतीं कि हम उन्हें दिखा सकें।',
  },

  // ── "Could have pointed here" ──
  could: {
    withinView: (o: { sat: string; time: string; zone: string; offset?: Offset }): Rich => [
      clock(o.time, o.zone),
      ` पर ${o.sat} पहुँच के दायरे में आया।`,
      ...(o.offset ? [' वह यहाँ से ', km(o.offset.km), ` ${WORD[o.offset.dir]} में था।`] : [' वह ठीक ऊपर था।']),
    ],
    insideSwath: (o: { place: string; swathKm: number }): Rich => [
      'उसकी ',
      km(o.swathKm),
      ` चौड़ी पट्टी ${o.place} के ऊपर से गुज़री। उसका संचालक यह नहीं बताता कि उपग्रह ने कहाँ की तस्वीरें लीं, इसलिए हम नहीं जान सकते कि उसने यहाँ की तस्वीर ली या नहीं।`,
    ],
    radar: (o: { place: string; deg?: number; openArchive: boolean }): Rich => [
      'रडार बादलों और अंधेरे के पार देखता है। वह ',
      ...(o.deg === undefined ? [] : ['एक तरफ़ ', deg1(o.deg), ' मुड़कर ']),
      `${o.place} की रडार तस्वीर ले सकता था।`,
      o.openArchive ? ' हमें इस उड़ान में ली गई इस जगह की कोई प्रकाशित तस्वीर नहीं मिली।' : ' हम नहीं जान सकते कि उसने ऐसा किया या नहीं।',
    ],
    camera: (o: { place: string; deg?: number }): Rich => [
      'वह ',
      ...(o.deg === undefined ? ['बिना मुड़े ही '] : ['सीधे नीचे से ', deg1(o.deg), ' मुड़कर ']),
      `${o.place} को देख सकता था। हम नहीं जान सकते कि उसने देखा या नहीं।`,
    ],
  },

  // ── "Passed overhead" ──
  overhead: (o: { sat: string; altKm: number; time: string; zone: string; elevationDeg: number; toward?: Compass8 }): Rich => [
    clock(o.time, o.zone),
    ` पर ${o.sat} ऊपर से गुज़रा। वह `,
    km(o.altKm),
    ' की ऊँचाई पर था, आपके क्षितिज से ',
    num(f.int(o.elevationDeg), '°'),
    o.toward === undefined ? ' ऊपर, लगभग सीधे सिर के ऊपर।' : ` ऊपर, ${WORD[o.toward]} में।`,
  ],
  darkStation: 'जहाँ आप हैं, वहाँ अंधेरा था। अगर तब भी स्टेशन पर धूप पड़ रही थी, तो वह बिना टिमटिमाए चमकते एक बिंदु की तरह आपके आसमान से गुज़रा।',
}
export default pass
