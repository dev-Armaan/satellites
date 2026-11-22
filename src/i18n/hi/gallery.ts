/**
 * Hindi copy for the photo gallery and the photo frames it shows (see docs/i18n/hi.md §3.7, §4.1, §7): the bar, each
 * slide's buttons and chips, what a picture shows at the place, and a frame's waiting and error states.
 *
 * Why these words: the gallery holds photos, daily mosaics and radar images alike, so every picture is a «तस्वीर»
 * (never «फ़ोटो», which a radar image is not), and a cover's reason is a «झलक», a look: «सबसे नज़दीकी झलक», «आखिरी
 * साफ़ झलक». "Clouded over" is «बादल छाए» everywhere, so it stands apart from the plain cover «बादल 25%». "Detailed"
 * is «बारीक», fine detail («विस्तृत» would read "extensive"), as a chip only: in a sentence it is «बारीक ब्योरे वाली
 * तस्वीरें» («बारीक तस्वीरें» reads "thin pictures"). Chips and statuses are mono labels in measured boxes, so
 * they are nouns and short phrases, never sentences. Names, days and clocks arrive as they are; the day already holds
 * a comma («रवि, 1 नवंबर»), so the clock gets one too.
 */
import type en from '../en/gallery'
import type { CoverLead } from '../en/gallery'
import { fmt } from '../../../api/_lib/i18n/format'
import { strong, type Rich } from '../../../api/_lib/i18n/parts'

const f = fmt('hi')
const pct = (n: number) => f.pct(n)

const LEAD: Record<CoverLead, string> = {
  closest: 'सबसे नज़दीकी झलक',
  lastClear: 'आखिरी साफ़ झलक',
  clouded: 'बादल छाए',
}

/** «Sentinel-2C, रवि, 1 नवंबर, 16:14» */
const who = (sat: string, day: string, time: string) => `${sat}, ${day}, ${time}`

const gallery: typeof en = {
  // ── the bar over the photos ──
  barLabel: 'तस्वीरें',
  filterLabel: 'तस्वीरें दिखाएँ',
  filter: { all: 'सभी', detailed: 'बारीक', weather: 'मौसम', radar: 'रडार' },
  filterTitle: {
    all: 'हर तस्वीर: पहले सबसे नज़दीकी झलक, फिर नई से पुरानी',
    detailed: 'Sentinel-2 और Landsat, 10–30\u00a0मी प्रति पिक्सेल',
    weather: 'दैनिक मौसम मोज़ेक, 250\u00a0मी प्रति पिक्सेल या उससे कम बारीक',
    radar: 'Sentinel-1 की रडार तस्वीरें, 20\u00a0मी प्रति पिक्सेल: बादलों के पार, दिन हो या रात',
  },
  photosThisWeek: (n: number) => `इस हफ़्ते ${f.int(n)}`,
  photosThatWeek: (n: number) => `उस हफ़्ते ${f.int(n)}`,
  prevPhoto: 'पिछली तस्वीर',
  prevTitle: 'पिछली (←)',
  nextPhoto: 'अगली तस्वीर',
  nextTitle: 'अगली (→)',
  carousel: 'कैरोसेल',
  trackLabel: 'इस जगह की तस्वीरें, और देखने के लिए स्वाइप करें',

  // ── a slide ──
  slide: 'स्लाइड',
  lead: LEAD,
  slideLabel: (lead: CoverLead | undefined, sat: string, day: string, time: string, photo?: { k: number; n: number }) =>
    `${lead ? `${LEAD[lead]}: ` : ''}${who(sat, day, time)}${photo ? `, ${f.int(photo.n)} में से तस्वीर ${f.int(photo.k)}` : ''}`,
  replayLabel: (sat: string, day: string, time: string) => `इस उड़ान का रीप्ले ग्लोब पर देखें: ${who(sat, day, time)}`,
  replay: [strong('इस उड़ान का '), 'रीप्ले'] as Rich,
  viewLabel: {
    lastClear: (sat: string, day: string, time: string) => `आखिरी साफ़ झलक बड़ी करके देखें: ${who(sat, day, time)}`,
    photo: (sat: string, day: string, time: string) => `तस्वीर बड़ी करके देखें: ${who(sat, day, time)}`,
  },
  view: 'देखें',
  sharePass: 'यह उड़ान शेयर करें',
  radarTag: 'रडार',
  noteMostlyCloud: 'इस हफ़्ते की उड़ानों में ज़्यादातर बादल दिखे',
  noteLastClear: 'यह रही आखिरी साफ़ झलक',
  clouded: {
    pct: (p: number) => `बादल छाए · ${pct(p)}`,
    coverAtSpot: 'बादल छाए · आपकी जगह पर भी',
    atSpot: 'आपकी जगह पर बादल',
  },
  status: {
    cloudedPct: (p: number) => `बादल छाए · ${pct(p)}`,
    cloudAtSpot: 'जगह पर बादल',
    clear: 'साफ़',
    cirrus: 'पतले बादल',
    shadow: 'बादल की छाया',
    cloudPct: (p: number) => `बादल ${pct(p)}`,
    mosaic: 'दैनिक मोज़ेक',
  },
  cropKm: (km: number) => `${km >= 100 ? f.int(km) : f.dec(km, 1)}\u00a0किमी`,

  // ── a photo frame ──
  photoAlt: (sat: string, place: string) => `${sat} से ली गई ${place} की तस्वीर। यह जगह बीच में है।`,
  acquiring: 'प्राप्त हो रही है',
  noImage: 'कोई तस्वीर नहीं मिली',
  retry: 'फिर कोशिश करें',
  scaleKm: (km: number) => `${km >= 1 ? f.int(km) : f.dec(km, 1)}\u00a0किमी`,
  north: 'N',
  expandLabel: 'तस्वीर बड़ी करें',
  expandTitle: 'बड़ी करें (F)',

  // ── a photo developing ──
  stillRendering: 'तस्वीर अब भी बन रही है। बड़े दृश्यों में 10\u00a0सेकंड या उससे ज़्यादा लग सकते हैं।',
  cropMissing: 'संग्रह ने तस्वीर का यह हिस्सा नहीं भेजा। शायद वह व्यस्त है, पर तस्वीर अब भी मौजूद है।',
  scanLine: (line: string, lines: string): Rich => ['पंक्ति ', strong(line), ` → ${lines}`],
  awaiting: { pass: 'उड़ान का इंतज़ार', scan: 'स्कैन का इंतज़ार' },
}
export default gallery
