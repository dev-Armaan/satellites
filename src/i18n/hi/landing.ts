/**
 * Hindi copy for the landing (see docs/i18n/hi.md §3.1, §3.2, §7): the hero, the place search, "Use my location", the
 * example chips and the maker's credit. The curated places' names are the 'places' namespace.
 *
 * Why it is written this way:
 *  - The hero opens on «किसी चीज़ ने», "some thing": a thing as the one who sees, the slight wrongness the English has.
 *    «ने» makes «देखा» the neutral masculine whatever watched, and Hindi's verb-final order lands the line on
 *    «*आपको* देखा।», the serif "you" and the verb.
 *  - Instructions are the polite imperative in -एँ (खोजें, आज़माएँ, लगाएँ), which has no gender; the reader is
 *    never the subject of a participle. "Enter any place" is «कोई भी जगह खोजें», as the field's placeholder says
 *    («जगह डालें», "insert a place", is not Hindi). "Surprise me" is «कहीं भी», "anywhere": «मुझे चौंकाएँ» asks to
 *    be startled, and «किस्मत आज़माएँ» would repeat the row's «या आज़माएँ» right before it. "Every satellite … the
 *    pictures they took" is «गुज़रे सभी उपग्रह … उनकी», so the pronoun has a plural to agree with. The device's
 *    position is «लोकेशन», as Indian Hindi apps say it, so «जगह» can stay "a place on Earth".
 *  - Status lines are nouns or short «… रहे हैं» clauses with the product's «हम», no final mark. The coordinates in
 *    searchDown are kept exactly as written: the field parses them.
 *  - Dates come from Intl (full month names), the window's ends tied by the landing's arrow, «UTC» kept.
 */
import type en from '../en/landing'
import { fmt } from '../../../api/_lib/i18n/format'
import { dateFormat } from '../../../api/_lib/i18n/dates'
import { accent, type Rich } from '../../../api/_lib/i18n/parts'

const f = fmt('hi')
/** Hindi counts zero with the plural; Intl files 0 under `one` (docs/i18n/hi.md §5.3) */
const pl = <T,>(n: number, one: T, other: T): T => (n === 0 ? other : f.plural(n, { one, other }))

const DATE: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }
/** A UTC day's parts from Intl: «1», «नवंबर», «2026» */
function utcDay(ms: number) {
  const ps = dateFormat('hi', 'UTC', DATE).formatToParts(ms)
  const get = (t: Intl.DateTimeFormatPartTypes) => ps.find((p) => p.type === t)?.value ?? ''
  return { day: get('day'), month: get('month'), year: get('year') }
}

const landing: typeof en = {
  // ── Hero ──
  lastDays: (days: number) => `${pl(days, 'पिछला', 'पिछले')} ${f.int(days)}\u00a0दिन`,
  windowRange: (startMs: number, endMs: number) => {
    const a = utcDay(startMs)
    const b = utcDay(endMs)
    const end = `${b.day}\u00a0${b.month} ${b.year}`
    const start = a.year !== b.year ? `${a.day}\u00a0${a.month} ${a.year}` : a.month !== b.month ? `${a.day}\u00a0${a.month}` : a.day
    return `${start} → ${end} UTC`
  },
  hero: [['किसी चीज़ ने'], ['इस हफ़्ते'], [accent('आपको'), ' देखा।']] as Rich[],
  sub: (days: number): Rich => [
    `धरती की कोई भी जगह खोजें। पिछले ${f.int(days)}\u00a0${pl(days, 'दिन', 'दिनों')} में उसके ऊपर से गुज़रे सभी उपग्रह देखें, और उनकी ली हुई असली तस्वीरें भी।`,
  ],
  builtBy: (handle: string) => `${handle} ने बनाया`,
  sourceLink: 'ओपन सोर्स',
  sourceLinkLabel: 'ओपन सोर्स: GitHub पर प्रोजेक्ट का कोड',

  // ── The place search ──
  searchPlaceholder: 'कोई जगह खोजें',
  placeLabel: 'जगह',
  searching: 'खोज जारी',
  searchUnavailable: 'खोज उपलब्ध नहीं',
  matches: (n: number) => `${f.int(n)}\u00a0${pl(n, 'नतीजा', 'नतीजे')}`,
  noMatch: 'कोई नतीजा नहीं',
  searchHint: 'नाम, पता या अक्षांश, देशांतर',
  clearSearch: 'खोज साफ़ करें',
  go: 'देखें कि इस जगह के ऊपर से क्या गुज़रा',
  searchDown: 'जगह खोजने की सेवा जवाब नहीं दे रही है। 43.47, −80.54 जैसे निर्देशांक अब भी काम करते हैं।',
  nothingMatches: (query: string) => `“${query}” से कुछ मेल नहीं खाता। कोई शहर, मशहूर जगह या निर्देशांक आज़माएँ।`,
  suggestions: 'जगहें',

  // ── Use my location ──
  useMyLocation: 'मेरी लोकेशन इस्तेमाल करें',
  locateMe: 'मेरी लोकेशन',
  nearMe: 'मेरे आसपास',
  locating: 'ढूँढ रहे हैं…',
  cancelSearch: 'रद्द करें',
  cancelLocate: 'रद्द करें',
  cancelLocating: 'लोकेशन ढूँढना रद्द करें',
  requestingPosition: 'लोकेशन माँग रहे हैं',
  namingPlace: 'जगह का नाम ढूँढ रहे हैं',
  elapsed: (seconds: number) => `${seconds.toFixed(0).padStart(2, '0')} सेकंड`,
  locatingNote: 'जगह का नाम जानने के लिए आपकी लोकेशन Photon सेवा को भेजी जाती है। हम सिर्फ़ करीब 10\u00a0किमी का एक इलाका सहेजते हैं।',
  locationLabel: 'लोकेशन',
  dismiss: 'बंद करें',
  locateErrors: {
    denied: 'लोकेशन की अनुमति ब्लॉक है। इसे ब्राउज़र की सेटिंग में चालू करें, या कोई जगह खोजें।',
    unavailable: 'आपकी लोकेशन अभी उपलब्ध नहीं है। इसके बजाय कोई जगह खोजें।',
    timeout: 'आपकी लोकेशन पता करने में बहुत देर लगी। फिर कोशिश करें, या कोई जगह खोजें।',
    unsupported: 'यह ब्राउज़र अपनी लोकेशन नहीं बता सकता। इसके बजाय कोई जगह खोजें।',
    insecure: 'लोकेशन के लिए सुरक्षित (https) कनेक्शन चाहिए। इसके बजाय कोई जगह खोजें।',
    other: 'आपकी लोकेशन अभी उपलब्ध नहीं है। इसके बजाय कोई जगह खोजें।',
  },

  // ── Examples ──
  orTry: 'या आज़माएँ',
  pinHint: 'या ग्लोब पर क्लिक करके पिन लगाएँ',
  examplesLabel: 'उदाहरण के लिए कुछ जगहें',
  dropPin: 'पिन लगाएँ',
  chipName: (label: string, sublabel: string) => `${label}, ${sublabel}`,
  surprise: 'कहीं भी',
  surpriseName: 'कहीं भी: यूँ ही चुनी गई कोई मशहूर जगह',
}
export default landing
