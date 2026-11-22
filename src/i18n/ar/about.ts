/**
 * Arabic copy for the About page («كيف يعمل», src/ui/pages/AboutPage.tsx; see src/i18n/en/about.ts for where each
 * line shows, and docs/i18n/ar.md §3.7 "`about`", which gives nearly every line here word for word, and §3.6 for the
 * verdicts' longer word).
 *
 * Why it reads this way:
 *  - The owner's copy, said plainly in Modern Standard Arabic and declarative throughout (ar.md §1.1). The reader is
 *    addressed only through forms spelled alike for a man and a woman, never vocalised: the suffix ـك («متصفحك»،
 *    «بقعتك»، «مكانك»، «شاشتك») and «أنت» with a prepositional predicate («فأنت في كل إطار»). The visitor's own
 *    questions are first person («أن يراني»), and the product's "we" is a first-person plural verb («نحسب»، «نبحث»،
 *    «نحتفظ»). The lede's imperative "Pick a spot" becomes the topic «أي بقعة على الأرض:», and the English
 *    second-person verbs become nouns («كل صورة هنا»، «والمرور المختار»), §1.2.
 *  - Named things are never bare subjects (§5.2, §5.3): «القمر الصناعي Sentinel-1»، «موقع CelesTrak»، «مكتبة
 *    satellite.js»; missions take «أقمار» («أقمار Sentinel-2 وLandsat»). Prose spells metres with agreement («10 أمتار»)
 *    and keeps «كم» as the symbol; every number is tied to its unit or noun by a no-break space.
 *  - `loaded` writes all six plural forms of «جسم», with one and two as words and the fetch clause agreeing with them
 *    («جسمًا واحدًا، جُلب»، «جسمين، جُلبا»، «16,893 جسمًا، جُلبت»); zero says no object was loaded and dates the copy.
 *  - The maker's handle and the fetch stamp are isolated (LRI…PDI, DOM-only text, §6.2.7). The page's number span has
 *    no `data-num`, so nothing else isolates them. In a right-to-left line the handle's «@» would otherwise be drawn
 *    after the name («armaangupt0@»), and «Armaan، @armaangupt0» would run together as one left-to-right run. After an
 *    Arabic word the stamp's digits become Arabic numbers that its hyphens split: «03:34Z 08-11-2026».
 *  - Marks are only those §6.6 allows: the passive damma and the guide's shaddas («تُنعّم»، «تُحمّل»), no fatha.
 *  - Credits keep every product, agency, licence and person's name in Latin letters, quote OpenStreetMap's
 *    attribution as given (§8), and name the Arabic faces this page is set in, so the type credit says what is on
 *    screen. Key caps: «Enter»، «مسافة»، «Esc» (§3.7).
 */
import type en from '../en/about'
import type { AboutPart, LinkPart } from '../en/about'
import { fmt } from '../../../api/_lib/i18n/format'
import { accent, num, type Part, type Rich } from '../../../api/_lib/i18n/parts'
import { whole } from '../bidi'

const f = fmt('ar')
const nb = '\u00a0'

const link = (...parts: Part[]): LinkPart => ({ link: parts })
/** The maker's handle as the link's text, kept left to right inside the right-to-left line (§6.2.7) */
const handleLink = (handle: string): LinkPart => link(`\u2066${handle}\u2069`)

/**
 * "This page loaded N objects, fetched STAMP." The count's six forms (ar.md §5.4): one and two are words, the clause
 * after them agrees («جُلب» / «جُلبا»), and a plural of things takes the feminine singular («جُلبت»). The stamp is one
 * LRI…PDI island, so it reads «2026-11-08 03:34Z» as it does in the HUD.
 */
const loaded = (count: number, stamp: string): AboutPart[] => {
  const n = Math.round(count)
  const at = num(`\u2066${whole(stamp)}\u2069`)
  return f.plural(n, {
    zero: ['لم تحمّل هذه الصفحة أي جسم. جُلبت النسخة في ', at, '.'],
    one: ['حمّلت هذه الصفحة جسمًا واحدًا، جُلب في ', at, '.'],
    two: ['حمّلت هذه الصفحة جسمين، جُلبا في ', at, '.'],
    few: ['حمّلت هذه الصفحة ', num(f.int(n)), `${nb}أجسام، جُلبت في `, at, '.'],
    many: ['حمّلت هذه الصفحة ', num(f.int(n)), `${nb}جسمًا، جُلبت في `, at, '.'],
    other: ['حمّلت هذه الصفحة ', num(f.int(n)), `${nb}جسم، جُلبت في `, at, '.'],
  })
}

const about: typeof en = {
  bar: 'حول',
  close: 'إغلاق',
  sectionsLabel: 'الأقسام',
  /** «هكذا / *يعمل*.» (§3.7): the accent on the verb, the full stop outside it */
  title: [['هكذا'], [accent('يعمل'), '.']] as Rich[],
  lede: 'أي بقعة على الأرض: نحدّد الأقمار الصناعية التي مرّت فوقها خلال الأسبوع الماضي، ثم نبحث عن الصور التي التقطتها. كل ذلك يجري في متصفحك، على بيانات عامة.',

  sections: {
    short: 'باختصار',
    method: 'كيف نجد مرات المرور',
    words: 'معنى التسميات',
    accuracy: 'ما لا نستطيع رؤيته',
    privacy: 'الخصوصية',
    credits: 'المصادر',
    keys: 'لوحة المفاتيح',
  },

  short: {
    live: {
      term: 'هل البث مباشر؟',
      text: 'ليس تمامًا. تصل الصور إلى الأرشيفات بعد ساعات قليلة إلى يومين من التقاطها، لذا قد لا تكون لأحدث مرات المرور صورة بعد.',
    },
    /** The reassurance keeps its number and its flatness (§8): no «اطمئن» */
    seeMe: {
      term: 'هل يمكن لقمر صناعي أن يراني؟',
      text: `لا. أدق بكسل هنا عرضه 10${nb}أمتار. السيارة بكسل واحد. ولا أثر لك فيه.`,
    },
    /** «أقمار التجسس» is the owner's category word, here only (§8) */
    every: {
      term: 'هل هذه كل الأقمار الصناعية؟',
      text: 'لا. معظم الأقمار العسكرية وأقمار التجسس ليست في الكتالوجات العامة، والشركات لا تقول أين توجّه كاميراتها.',
    },
  },

  method: {
    /** The link stays on CelesTrak's name, after its head noun «موقع» (§5.3) */
    orbits: [
      'لكل جسم في المدار مجموعة أرقام عامة تصف مساره. ينشرها موقع ',
      link('CelesTrak'),
      ' من بيانات تتبّع قوة الفضاء الأمريكية، ونجلب نسخة جديدة كل ست ساعات.',
    ] as AboutPart[],
    loaded,
    sgp4: 'نحسب مسار كل قمر صناعي على مدى الأيام السبعة الماضية بنموذج SGP4، النموذج المعياري للمدارات، ونسجّل كل مرة كانت فيها بقعتك ضمن ما كان يستطيع رؤيته.',
    facts: {
      straightDown: {
        term: 'عموديًا إلى الأسفل',
        text: `تنظر أقمار Sentinel-2 وLandsat عموديًا إلى الأسفل نحو شريط من الأرض، عرضه نحو 290${nb}كم في Sentinel-2 و185${nb}كم في Landsat. يجب أن يكون مكانك داخل الشريط.`,
      },
      /** Quotes the could verdict's title as the results show it, in « » (§3.6) */
      tilting: {
        term: 'الكاميرات المائلة',
        text: `كثير من الأقمار التجارية يمكنها أن تميل من 30 إلى 45${nb}درجة. إن كان مكانك في متناولها، نسمّي ذلك «كان بإمكانه النظر إلى هنا».`,
      },
      daylight: { term: 'ضوء النهار', text: 'تحتاج الكاميرات العادية إلى الشمس. المرور في الظلام لا يُحسب صورة أبدًا.' },
      radar: {
        term: 'الرادار',
        text: `لا يحتاج القمر الصناعي${nb}Sentinel-1 إلى الشمس. يُرسل موجات ميكروية ويسجّل صداها، فيرى عبر السحب وفي الليل، ناظرًا إلى أحد جانبي مساره. صوره متاحة للعموم أيضًا، لذا نعرضها بالرمادي: الساطع أرض وعرة ومبانٍ، والداكن ماء ساكن.`,
      },
      /** «أنت» with a prepositional predicate, the one form of it allowed outside the hero (§1.2) */
      weather: {
        term: 'أقمار الطقس',
        text: `يستقر بعضها فوق خط الاستواء ويرصد نصف الكوكب كل 10${nb}دقائق. إن كان مكانك في جهتها من الأرض، فأنت في كل إطار.`,
      },
    },
    archives:
      'ثم نبحث في أرشيفات الصور (Microsoft Planetary Computer وElement 84 وناسا) ونطابق كل صورة مع المرور الذي التُقطت فيه. كل صورة هنا هي الصورة الحقيقية، مقتطعة حول بقعتك.',
    photoFacts: {
      touchUps: {
        term: 'المعالجة',
        text: 'تُضبط ألوان صور Sentinel-2 وLandsat وتُنعّم وتُزاد حدتها قليلًا لتناسب شاشتك، بالطريقة نفسها في الصورة كلها. لا يُضاف شيء ولا يُحذف.',
      },
      /** The photo viewer's north arrow is labelled N on the Arabic page too */
      whichWayUp: {
        term: 'أين الشمال',
        text: 'تحتفظ صور Sentinel-2 وLandsat بشبكة الخريطة الخاصة بالأرشيف لمكانك، لذا قد يميل الشمال بضع درجات عن الأعلى. عند فتح صورة، يبيّن سهم N فيها الاتجاه بالضبط.',
      },
    },
  },

  /** The next sentence after each verdict's definition (§3.6); «ـها» and «كانت» refer back to its image or camera */
  verdictMore: {
    imaged: 'إن عرضناها، فهي الصورة الحقيقية.',
    likely: 'الصورة لم تُنشر بعد، أو استُبعدت بسبب السحب.',
    could: 'لا سبيل إلى معرفة ما إذا كانت قد نظرت حقًا.',
    overhead: '',
  },

  accuracy: {
    positions: {
      term: 'المواقع الدقيقة',
      text: 'هامش الخطأ في بيانات المدارات العامة نحو كيلومتر، ويزيد قليلًا كل يوم. قد تختلف الأوقات بضع ثوانٍ.',
    },
    secret: { term: 'الأقمار السرية', text: 'بعض أفضل الكاميرات في المدار ملك للجيوش. لا تظهر هنا.' },
    clouds: {
      term: 'السحب',
      text: 'كثير من الصور سحب فقط. حين يخبرنا الأرشيف، نفحص البكسل الدقيق فوق بقعتك ونقول ذلك.',
    },
    delays: { term: 'التأخير', text: 'قد تستغرق الصور يومًا أو يومين لتظهر.' },
  },

  /** Exactly the English, no more and no less (§8): "a ~10 km area" is a width, «عرضها نحو 10 كم» */
  privacy: {
    where: { term: 'أين تجري الحسابات', text: 'تجري حسابات المدارات في متصفحك.' },
    kept: {
      term: 'ما نحتفظ به',
      text: `نعدّ عمليات البحث بحسب المدينة ومنطقة تقريبية عرضها 10${nb}كم، لا بحسب بقعتك الدقيقة أبدًا، ونحتفظ بإحصاء لما يُفتح ويُشارك. لا عناوين IP، ولا ملفات تعريف ارتباط خاصة بنا، ولا شيء يربط زيارة بأخرى.`,
    },
    others: {
      term: 'من يرى ذلك أيضًا',
      text: 'معظم أسماء الأماكن من قائمة مدمجة في الموقع. وتذهب عمليات البحث الأخرى إلى Open-Meteo أو Photon أو Nominatim. تُحمّل الصور مباشرةً من الأرشيفات. يحصي مستضيفنا مشاهدات الصفحات والسرعة دون ملفات تعريف الارتباط، وقد يضع ملف تعريف ارتباط أمنيًا واحدًا للتمييز بين البشر والروبوتات. لا نقرؤه أبدًا.',
    },
    links: {
      term: 'روابط المشاركة',
      text: `لا تُنشأ إلا عند مشاركة شيء. كل من لديه الرابط يرى اسم المكان، وبقعة مقرّبة إلى نحو 1${nb}كم، والمرور المختار.`,
    },
  },

  /** Every product, agency, licence and person's name as it is; the attribution quoted as given (§8) */
  credits: {
    madeBy: { who: 'من صنع', text: (handle: string): AboutPart[] => ['Armaan، ', handleLink(handle), ' على X'] },
    gibs: 'الصور من خدمة GIBS التابعة لناسا، ضمن EOSDIS. صور GOES عبر NOAA وCIRA، وHimawari عبر JMA.',
    archives: {
      who: 'الأرشيفات',
      text: `Microsoft Planetary Computer وElement 84 Earth Search؛ وحزمة Landsat بدقة 15${nb}مترًا من Copernicus Data Space Ecosystem.`,
    },
    orbits: { who: 'المدارات', text: 'العناصر المدارية من CelesTrak. نموذج SGP4 من مكتبة satellite.js.' },
    placeNames: { who: 'أسماء الأماكن', text: 'خدمة Photon من komoot. بيانات الخرائط: © OpenStreetMap contributors (ODbL).' },
    textures: { who: 'خرائط الأرض', text: 'Solar System Scope (CC BY 4.0)، من صور NASA Blue Marble وBlack Marble.' },
    /** Names the Arabic faces this page is set in too, so the credit says what is on screen */
    type: {
      who: 'الخطوط',
      text: 'Instrument Sans وSerif من Instrument، وMartian Mono من Evil Martians، وNoto Sans Arabic وAmiri للعربية (SIL OFL).',
    },
  },

  /** Masdars, as every Arabic interface action is named (§1.1); the viewer's own words («تكبير الصورة»، «إعادة العرض») */
  keys: {
    search: 'البحث عن مكان',
    suggestions: 'التنقل بين الاقتراحات',
    choose: 'اختيار',
    passes: 'التنقل بين مرات المرور',
    photos: 'الصورة السابقة / التالية',
    expand: 'تكبير الصورة',
    zoom: 'التكبير والتصغير (عند فتح الصورة)',
    play: 'تشغيل إعادة العرض أو إيقافها',
    back: 'رجوع أو إغلاق',
    help: 'هذه الصفحة',
  },
  /** Arabic keyboards print Enter and Esc in Latin letters; the space bar is «مسافة» (§3.7) */
  keyNames: { enter: 'Enter', space: 'مسافة', esc: 'Esc' },

  builtBy: (handle: string): AboutPart[] => ['من صنع ', handleLink(handle)],
  footerNote: 'مبني على بيانات عامة. لم نلتقط أيًّا من هذه الصور.',
}

export default about
