/**
 * Hindi copy for the About page (see docs/i18n/hi.md §1.2, §3.5, §4.1, §8): every heading, paragraph, fact, credit
 * and key.
 *
 * Why it reads this way: the owner's English is short, plain and second person, so the Hindi is too: «आप» for the
 * reader, the copula where the English says "you are" («आप हर फ़्रेम में हैं», «तस्वीर में आप हैं ही नहीं»), «आपकी
 * चुनी हुई उड़ान» for "the pass you picked" (it agrees with «उड़ान»), and the reader's own questions in
 * the first person («क्या यह मुझे देख सकता है?»). The reader is never the subject of a gendered verb: "you have to be
 * in the strip" is «आपका उस पट्टी में होना ज़रूरी है», "if you were in reach" is «अगर आपकी जगह उनकी पहुँच में थी».
 * Optical pictures are «फ़ोटो» here because the English says photos; radar images are «तस्वीरें». The verdict quoted
 * in «मुड़ने वाले कैमरे» is the verdict's own name. Privacy is translated exactly, promising nothing more or less. The
 * licences, product, agency and person names, the handle and the key symbols stay as they are.
 */
import type en from '../en/about'
import type { AboutPart, LinkPart } from '../en/about'
import { fmt } from '../../../api/_lib/i18n/format'
import { accent, num, type Part, type Rich } from '../../../api/_lib/i18n/parts'

const f = fmt('hi')
/** Hindi counts zero with the plural; Intl files 0 under `one` (docs/i18n/hi.md §5.3) */
const pl = <T,>(n: number, one: T, other: T): T => (n === 0 ? other : f.plural(n, { one, other }))

const link = (...parts: Part[]): LinkPart => ({ link: parts })

const about: typeof en = {
  bar: 'जानकारी',
  close: 'बंद करें',
  sectionsLabel: 'हिस्से',
  title: [['यह कैसे'], [accent('काम'), ' करता है।']] as Rich[],
  lede: 'धरती पर कोई जगह चुनें। हम पता लगाते हैं कि पिछले सात दिनों में उसके ऊपर से कौन-से उपग्रह गुज़रे, फिर उनकी ली हुई फ़ोटो ढूँढते हैं। सब कुछ आपके ब्राउज़र में, सार्वजनिक डेटा पर चलता है।',

  sections: {
    short: 'संक्षेप में',
    method: 'उड़ानें कैसे मिलती हैं',
    words: 'लेबलों का मतलब',
    accuracy: 'जो हम नहीं देख सकते',
    privacy: 'निजता',
    credits: 'श्रेय',
    keys: 'कीबोर्ड',
  },

  short: {
    live: {
      term: 'क्या यह लाइव है?',
      text: 'पूरी तरह नहीं। फ़ोटो लिए जाने के कुछ घंटों से लेकर एक-दो दिन बाद तक संग्रहों में पहुँचती हैं, इसलिए हो सकता है कि सबसे नई उड़ानों की फ़ोटो अभी न आई हो।',
    },
    seeMe: { term: 'क्या यह मुझे देख सकता है?', text: 'नहीं। यहाँ सबसे बारीक पिक्सेल भी 10\u00a0मी का है। एक कार बस एक पिक्सेल जितनी होती है। तस्वीर में आप हैं ही नहीं।' },
    every: {
      term: 'क्या इसमें हर उपग्रह है?',
      text: 'नहीं। सैन्य और जासूसी उपग्रह ज़्यादातर सार्वजनिक सूचियों में नहीं होते, और कंपनियाँ नहीं बतातीं कि वे अपने कैमरे कहाँ घुमाती हैं।',
    },
  },

  method: {
    orbits: [
      'कक्षा में मौजूद हर वस्तु के रास्ते के आँकड़े सार्वजनिक हैं। ',
      link('CelesTrak'),
      ' इन्हें US Space Force की ट्रैकिंग से प्रकाशित करता है, और हम हर छह घंटे में इनकी ताज़ा कॉपी लेते हैं।',
    ] as AboutPart[],
    loaded: (count: number, stamp: string): AboutPart[] => [
      'इस पेज ने ',
      num(f.int(count)),
      `\u00a0${pl(count, 'वस्तु लोड की, जो', 'वस्तुएँ लोड कीं, जो')} `,
      num(stamp),
      pl(count, ' पर प्राप्त हुई।', ' पर प्राप्त हुईं।'),
    ],
    sgp4: 'हम कक्षा के मानक मॉडल SGP4 से पिछले सात दिनों में हर उपग्रह की स्थिति की गणना करते हैं, और हर वह पल दर्ज करते हैं जब आपकी जगह उसके देखने के दायरे में थी।',
    facts: {
      straightDown: {
        term: 'सीधे नीचे',
        text: 'Sentinel-2 और Landsat ज़मीन की एक पट्टी को सीधे नीचे देखते हैं, जो Sentinel-2 के लिए करीब 290\u00a0किमी और Landsat के लिए 185\u00a0किमी चौड़ी है। आपका उस पट्टी में होना ज़रूरी है।',
      },
      tilting: {
        term: 'मुड़ने वाले कैमरे',
        text: 'कई व्यावसायिक उपग्रह 30 से 45\u00a0डिग्री तक झुक सकते हैं। अगर आपकी जगह उनकी पहुँच में थी, तो हम उसे “यहाँ देख सकता था” कहते हैं।',
      },
      daylight: { term: 'दिन का उजाला', text: 'आम कैमरों को सूरज चाहिए। अंधेरे में हुई उड़ान कभी फ़ोटो नहीं गिनी जाती।' },
      radar: {
        term: 'रडार',
        text: 'Sentinel-1 को सूरज की ज़रूरत नहीं। यह माइक्रोवेव भेजता है और उनकी गूँज दर्ज करता है, इसलिए बादलों के पार और रात में भी देखता है। यह अपने रास्ते के एक तरफ़ तिरछा देखता है। इसकी तस्वीरें भी सार्वजनिक हैं, इसलिए हम उन्हें भी दिखाते हैं। वे स्लेटी रंग की होती हैं: चमकीला मतलब ऊबड़-खाबड़ ज़मीन और इमारतें, काला मतलब शांत पानी।',
      },
      weather: {
        term: 'मौसम उपग्रह',
        text: 'कुछ उपग्रह भूमध्य रेखा के ऊपर टिके रहते हैं और हर 10\u00a0मिनट में आधी धरती देखते हैं। अगर आप धरती के उनकी तरफ़ वाले हिस्से में हैं, तो आप हर फ़्रेम में हैं।',
      },
    },
    archives:
      'फिर हम तस्वीरों के संग्रह खोजते हैं (Microsoft Planetary Computer, Element 84 और NASA) और हर तस्वीर को उस उड़ान से मिलाते हैं जिसमें वह ली गई। आपको दिखने वाली हर तस्वीर असली है, आपकी जगह के आसपास से काटी हुई।',
    photoFacts: {
      touchUps: {
        term: 'सुधार',
        text: 'Sentinel-2 और Landsat की फ़ोटो के रंग संतुलित किए जाते हैं, और आपकी स्क्रीन के लिए उन्हें मुलायम करके हल्का-सा निखारा जाता है, पूरी तस्वीर में एक जैसा। कुछ भी जोड़ा या हटाया नहीं जाता।',
      },
      whichWayUp: {
        term: 'ऊपर कौन-सी दिशा है',
        text: 'Sentinel-2 और Landsat की फ़ोटो आपकी जगह के लिए संग्रह का अपना नक्शा-ग्रिड रखती हैं, इसलिए उत्तर ठीक ऊपर से कुछ डिग्री हटा हुआ हो सकता है। फ़ोटो खोलने पर उसका N तीर ठीक-ठीक दिशा बताता है।',
      },
    },
  },

  verdictMore: {
    imaged: 'हम जो तस्वीर दिखाते हैं, वह असली ही है।',
    likely: 'फ़ोटो अभी सार्वजनिक नहीं हुई है, या बादलों की वजह से हटा दी गई।',
    could: 'यह जानने का कोई तरीका नहीं कि उसने सच में देखा या नहीं।',
    overhead: '',
  },

  accuracy: {
    positions: {
      term: 'सटीक स्थिति',
      text: 'कक्षा के सार्वजनिक आँकड़े करीब एक किलोमीटर तक सही होते हैं, और उनकी सटीकता हर दिन थोड़ी घटती है। समय कुछ सेकंड आगे-पीछे हो सकता है।',
    },
    secret: { term: 'गुप्त उपग्रह', text: 'कक्षा में मौजूद कुछ सबसे अच्छे कैमरे सेनाओं के हैं। वे यहाँ नहीं दिखते।' },
    clouds: {
      term: 'बादल',
      text: 'कई फ़ोटो में बस बादल होते हैं। जब संग्रह हमें बताता है, तो हम आपकी जगह के ठीक ऊपर का पिक्सेल जाँचते हैं और बता देते हैं।',
    },
    delays: { term: 'देरी', text: 'फ़ोटो आने में एक-दो दिन लग सकते हैं।' },
  },

  privacy: {
    where: { term: 'यह कहाँ चलता है', text: 'कक्षाओं की गणना आपके ब्राउज़र में होती है।' },
    kept: {
      term: 'हम क्या रखते हैं',
      text: 'हम खोजें शहर और मोटे तौर पर 10\u00a0किमी के इलाके के हिसाब से गिनते हैं, आपकी सटीक जगह के हिसाब से कभी नहीं, और यह हिसाब रखते हैं कि क्या खोला और शेयर किया गया। कोई IP पता नहीं, हमारी अपनी कोई कुकी नहीं, ऐसा कुछ नहीं जो एक विज़िट को अगली से जोड़े।',
    },
    others: {
      term: 'और कौन देखता है',
      text: 'ज़्यादातर जगहों के नाम साइट में बनी एक सूची से आते हैं। बाकी खोजें Open-Meteo, Photon या Nominatim के पास जाती हैं। फ़ोटो सीधे संग्रहों से लोड होती हैं। हमारा होस्ट पेज व्यू गिनता है और पेज की रफ़्तार मापता है, बिना कुकी के, और लोगों को बॉट से अलग पहचानने के लिए एक सुरक्षा कुकी लगा सकता है। हम उसे कभी नहीं पढ़ते।',
    },
    links: {
      term: 'शेयर लिंक',
      text: 'सिर्फ़ कुछ शेयर करने पर बनते हैं। लिंक वाला कोई भी व्यक्ति जगह का नाम, करीब 1\u00a0किमी तक गोल किया गया एक बिंदु, और आपकी चुनी हुई उड़ान देख सकता है।',
    },
  },

  credits: {
    madeBy: { who: 'निर्माता', text: (handle: string): AboutPart[] => ['Armaan, X पर ', link(handle)] },
    gibs: 'तस्वीरें NASA के GIBS से, जो EOSDIS का हिस्सा है। GOES की तस्वीरें NOAA और CIRA के ज़रिए, Himawari की JMA के ज़रिए।',
    archives: {
      who: 'संग्रह',
      text: 'Microsoft Planetary Computer और Element 84 Earth Search। Landsat का 15\u00a0मी बैंड Copernicus Data Space Ecosystem से।',
    },
    orbits: { who: 'कक्षाएँ', text: 'कक्षा के आँकड़े CelesTrak से। SGP4 के लिए satellite.js।' },
    placeNames: { who: 'जगहों के नाम', text: 'komoot का Photon। मानचित्र डेटा © OpenStreetMap योगदानकर्ता (ODbL)।' },
    textures: { who: 'ग्लोब की तस्वीरें', text: 'Solar System Scope (CC BY 4.0), NASA Blue Marble और Black Marble से।' },
    // Honest labelling: the Devanagari letters are set in the Noto faces the page ships (src/styles/scripts.css).
    type: {
      who: 'फ़ॉन्ट',
      text: 'Instrument के Instrument Sans और Serif, Evil Martians का Martian Mono, और देवनागरी के लिए Google के Noto Sans Devanagari और Noto Serif Devanagari (SIL OFL)।',
    },
  },

  keys: {
    search: 'कोई जगह खोजें',
    suggestions: 'सुझावों में ऊपर-नीचे जाएँ',
    choose: 'चुनें',
    passes: 'एक-एक उड़ान पर जाएँ',
    photos: 'पिछली / अगली तस्वीर',
    expand: 'तस्वीर बड़ी करें',
    zoom: 'ज़ूम (बड़ी तस्वीर में)',
    play: 'रीप्ले चलाएँ या रोकें',
    back: 'वापस, या बंद करें',
    help: 'यह पेज',
  },
  keyNames: { enter: 'Enter', space: 'Space', esc: 'Esc' },

  builtBy: (handle: string): AboutPart[] => [link(handle), ' ने बनाया'],
  footerNote: 'सार्वजनिक डेटा से बना। इनमें से कोई भी फ़ोटो हमने नहीं ली।',
}
export default about
