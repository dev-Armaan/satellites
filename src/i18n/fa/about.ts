/**
 * Persian copy for the About page ("How this works"; see src/i18n/en/about.ts for where each piece shows;
 * docs/i18n/fa.md §1.2, §2, §8.7).
 *
 * Why it reads this way:
 *  - The owner's English is short, plain and second person; the Persian is plain written Persian, conversational and
 *    still declarative, `شما` for the reader and «ما» for the product, no em dashes, no exclamation. The visitor's own
 *    questions are in the first person («می‌تواند مرا ببیند؟»).
 *  - The title «این‌طور / *کار می‌کند*.» ("this is how it works") is declarative, as "How this works." is: «چطور کار
 *    می‌کند» with a full stop would be a question punctuated wrong. The accent is on the verb, as the English puts it
 *    on "works", the full stop outside it. The HUD's link keeps «چطور کار می‌کند», which this page answers.
 *  - The privacy section says exactly what the English says, no more and no less (fa.md §8.7).
 *  - Numbers in rich parts are num() islands; the fetch stamp is an ISO time and sits in one.
 *  - The maker's handle is a link and is isolated (LRI…PDI), or its «@» would jump to the far side. Two Latin names
 *    with only «، » between them are isolated too, or they merge into one left-to-right run and read in the wrong
 *    order; where a Persian word can stand between them, it does («تصویرهای GOES … و تصویرهای Himawari»).
 *  - A satellite that leads a sentence follows its head noun («ماهوارهٔ Sentinel-1», fa.md §5.2).
 *  - Names stay: CelesTrak, SGP4, Sentinel-1/-2, Landsat, Planetary Computer, Element 84, Open-Meteo, Photon,
 *    Nominatim, the typefaces. "Could have pointed here" is quoted as the verdict says it, in «».
 */
import type en from '../en/about'
import type { AboutPart, LinkPart } from '../en/about'
import { fmt } from '../../../api/_lib/i18n/format'
import { accent, num, type Part, type Rich } from '../../../api/_lib/i18n/parts'

const f = fmt('fa')
const nb = '\u00a0'

/** U+2066 LEFT-TO-RIGHT ISOLATE … U+2069 POP DIRECTIONAL ISOLATE: one left-to-right run in a DOM-only string */
const ltr = (s: string) => `\u2066${s}\u2069`
const link = (...parts: Part[]): LinkPart => ({ link: parts })
const handleLink = (handle: string): LinkPart => link(`\u2066${handle}\u2069`)

const about: typeof en = {
  bar: 'درباره',
  close: 'بستن',
  sectionsLabel: 'بخش‌ها',
  title: [['این‌طور'], [accent('کار می‌کند'), '.']] as Rich[],
  lede: 'نقطه‌ای روی زمین انتخاب کنید. ما حساب می‌کنیم در هفتهٔ گذشته کدام ماهواره‌ها از فراز آن گذشتند، بعد سراغ تصویرهایی می‌رویم که گرفتند. همهٔ این کارها در مرورگر شما و با داده‌های عمومی انجام می‌شود.',

  sections: {
    short: 'به‌طور خلاصه',
    method: 'چطور گذرها را پیدا می‌کنیم',
    words: 'معنی برچسب‌ها',
    accuracy: 'آنچه نمی‌بینیم',
    privacy: 'حریم خصوصی',
    credits: 'منابع',
    keys: 'صفحه‌کلید',
  },

  short: {
    live: {
      // «زنده است؟» alone reads "is it alive?"; «لحظه‌ای» is the tech word for real time
      term: 'لحظه‌ای است؟',
      text: 'نه کاملاً. عکس‌ها چند ساعت تا یکی دو روز پس از گرفته شدن به آرشیوها می‌رسند، پس تازه‌ترین گذرها شاید هنوز تصویری نداشته باشند.',
    },
    seeMe: {
      term: 'می‌تواند مرا ببیند؟',
      text: `نه. در بهترین حالت، هر پیکسل این‌جا 10${nb}متر پهنا دارد. یک ماشین یک پیکسل است. شما در آن نیستید.`,
    },
    every: {
      term: 'این همهٔ ماهواره‌هاست؟',
      text: 'نه. ماهواره‌های نظامی و جاسوسی بیشترشان در کاتالوگ‌های عمومی نیستند و شرکت‌ها نمی‌گویند دوربین‌هایشان را به کجا می‌گیرند.',
    },
  },

  method: {
    orbits: [
      'هر جسمی که در مدار است مجموعه‌ای عمومی از اعداد دارد که مسیرش را توصیف می‌کند. ',
      link('CelesTrak'),
      ' این اعداد را بر پایهٔ ردیابی‌های نیروی فضایی آمریکا منتشر می‌کند و ما هر شش ساعت نسخهٔ تازه‌ای از آن‌ها برمی‌داریم.',
    ] as AboutPart[],
    // A relative clause, not English's trailing participle («…، دریافت‌شده در …»)
    loaded: (count: number, stamp: string): AboutPart[] =>
      count === 1
        ? ['این صفحه یک جسم را بارگیری کرد که در ', num(`\u2066${stamp}\u2069`), ' دریافت شده بود.']
        : ['این صفحه ', num(f.int(count)), `${nb}جسم را بارگیری کرد که در `, num(`\u2066${stamp}\u2069`), ' دریافت شده بودند.'],
    sgp4: 'مسیر هر ماهواره را در هفت روز گذشته با SGP4، مدل استاندارد مدار، محاسبه می‌کنیم و هر باری را که نقطهٔ شما در گسترهٔ دیدش بود یادداشت می‌کنیم.',
    facts: {
      straightDown: {
        term: 'رو به پایین',
        text: `ماهواره‌های Sentinel-2 و Landsat درست رو به پایین به نواری از زمین نگاه می‌کنند، به پهنای حدود 290${nb}کیلومتر برای Sentinel-2 و 185${nb}کیلومتر برای Landsat. شما باید درون آن نوار باشید.`,
      },
      tilting: {
        // «قابل‌چرخش» (can be turned): «دوربین چرخان» also means "spinning", and in Iran it is the CCTV camera's name
        term: 'دوربین‌های قابل‌چرخش',
        text: 'بسیاری از ماهواره‌های تجاری می‌توانند دوربینشان را 30 تا 45 درجه بچرخانند. اگر در بُردشان بودید، آن را «می‌توانست به این‌جا نگاه کند» می‌نامیم.',
      },
      daylight: { term: 'روشنایی روز', text: 'دوربین‌های معمولی به خورشید نیاز دارند. گذری که در تاریکی باشد هرگز عکس به حساب نمی‌آید.' },
      radar: {
        term: 'رادار',
        text: 'ماهوارهٔ Sentinel-1 به خورشید نیاز ندارد. ریزموج می‌فرستد و پژواکش را ثبت می‌کند، پس از پشت ابر و در شب هم می‌بیند و به یک سوی مسیرش نگاه می‌کند. تصویرهایش هم عمومی‌اند، پس آن‌ها را به رنگ خاکستری نشان می‌دهیم: روشن یعنی زمین ناهموار و ساختمان، تیره یعنی آب آرام.',
      },
      weather: {
        term: 'ماهواره‌های هواشناسی',
        text: 'برخی از آن‌ها بالای استوا قرار دارند و هر 10 دقیقه نیمی از زمین را رصد می‌کنند. اگر در نیمه‌ای از زمین باشید که رو به آن‌هاست، در همهٔ قاب‌ها هستید.',
      },
    },
    archives:
      `بعد آرشیوهای تصویر (${ltr(`Microsoft${nb}Planetary${nb}Computer`)}، ${ltr(`Element${nb}84`)} و ناسا) را جستجو می‌کنیم و هر تصویر را با گذری که آن را گرفت جفت می‌کنیم. هر تصویری که می‌بینید همان تصویر واقعی است، که پیرامون نقطهٔ شما بریده شده.`,
    photoFacts: {
      touchUps: {
        // Never «دست‌کاری» (tampering, a doctored photo): the paragraph's point is that nothing is added or removed
        term: 'اصلاح‌های جزئی',
        text: 'رنگ عکس‌های Sentinel-2 و Landsat برای صفحهٔ نمایش شما متعادل می‌شود و خود عکس‌ها نرم و کمی تیز می‌شوند، به یک شکل در سراسر تصویر. هیچ چیز اضافه یا حذف نمی‌شود.',
      },
      whichWayUp: {
        term: 'کدام طرف بالاست',
        text: 'عکس‌های Sentinel-2 و Landsat شبکهٔ نقشهٔ خود آرشیو را برای مکان شما نگه می‌دارند، پس شمال ممکن است چند درجه از راستای بالا منحرف باشد. وقتی عکسی را باز می‌کنید، پیکان N آن دقیقاً نشان می‌دهد کجاست.',
      },
    },
  },

  verdictMore: {
    imaged: 'اگر نشانش می‌دهیم، همان تصویر واقعی است.',
    likely: 'تصویر هنوز عمومی نشده یا به خاطر ابر کنار گذاشته شده است.',
    could: 'هیچ راهی نیست که بدانیم واقعاً نگاه کرد یا نه.',
    overhead: '',
  },

  accuracy: {
    positions: {
      term: 'موقعیت‌های دقیق',
      text: 'دادهٔ عمومی مدارها تا حدود یک کیلومتر دقیق است و دقتش هر روز کمی کمتر می‌شود. زمان‌ها ممکن است چند ثانیه اختلاف داشته باشند.',
    },
    secret: { term: 'ماهواره‌های مخفی', text: 'برخی از بهترین دوربین‌های مداری به ارتش‌ها تعلق دارند. آن‌ها این‌جا دیده نمی‌شوند.' },
    clouds: {
      term: 'ابرها',
      text: 'بسیاری از عکس‌ها فقط ابرند. وقتی آرشیو به ما بگوید، پیکسل دقیق روی نقطهٔ شما را بررسی می‌کنیم و همین را می‌گوییم.',
    },
    delays: { term: 'تأخیرها', text: 'ممکن است یکی دو روز طول بکشد تا عکس‌ها برسند.' },
  },

  privacy: {
    where: { term: 'کجا اجرا می‌شود', text: 'محاسبهٔ مدارها در مرورگر شما انجام می‌شود.' },
    kept: {
      term: 'آنچه نگه می‌داریم',
      // "never your exact spot" gets its own «بر اساس», or it reads as the object of «نگه می‌داریم» ("we keep your spot")
      text: `جستجوها را بر اساس شهر و یک ناحیهٔ تقریبی 10${nb}کیلومتری می‌شماریم، هرگز بر اساس نقطهٔ دقیق شما. شمار چیزهایی را هم که باز یا به اشتراک گذاشته می‌شوند نگه می‌داریم. نه نشانی IP، نه کوکی‌ای از خودمان، نه چیزی که یک بازدید را به بازدید بعدی پیوند دهد.`,
    },
    others: {
      term: 'چه کس دیگری آن را می‌بیند',
      text: `بیشتر نام‌های مکان از فهرستی می‌آیند که درون خود سایت است. جستجوهای دیگر به ${ltr('Open-Meteo')}، ${ltr('Photon')} یا Nominatim می‌روند. تصویرها مستقیم از آرشیوها بارگیری می‌شوند. سرویس میزبانی ما بدون کوکی بازدید صفحه‌ها را می‌شمارد و سرعت را می‌سنجد و ممکن است یک کوکی امنیتی بگذارد تا انسان‌ها را از ربات‌ها تشخیص دهد. ما هرگز آن را نمی‌خوانیم.`,
    },
    links: {
      // «اشتراک» alone is a subscription: sharing is «اشتراک‌گذاری»
      term: 'پیوندهای اشتراک‌گذاری',
      text: `فقط وقتی چیزی را به اشتراک می‌گذارید ساخته می‌شوند. هر کس پیوند را داشته باشد نام مکان، نقطه‌ای با دقت حدود یک${nb}کیلومتر و گذری را که انتخاب کردید می‌بیند.`,
    },
  },

  credits: {
    // Multi-word Latin names are tied with no-break spaces here and in the archives sentence: in a right-to-left line a
    // name broken in two («Copernicus Data | Space Ecosystem») reads from the left end of one line to the right start of
    // the next, mid-name.
    // A label on its own, so a noun («سازنده»), never «ساختهٔ», which ends on an ezafe with nothing after it
    madeBy: { who: 'سازنده', text: (handle: string): AboutPart[] => ['Armaan، ', handleLink(handle), ' در X'] },
    gibs: 'تصویرها از GIBS ناسا، که بخشی از EOSDIS است. تصویرهای GOES از طریق NOAA و CIRA و تصویرهای Himawari از طریق JMA.',
    archives: {
      who: 'آرشیوها',
      text: `Microsoft${nb}Planetary${nb}Computer و Element${nb}84 Earth${nb}Search؛ باند 15${nb}متری Landsat از Copernicus${nb}Data${nb}Space${nb}Ecosystem.`,
    },
    orbits: { who: 'مدارها', text: 'مجموعه‌عناصر مداری از CelesTrak. پیاده‌سازی SGP4 از satellite.js.' },
    // OpenStreetMap's own Persian attribution
    placeNames: { who: 'نام مکان‌ها', text: 'Photon از komoot. داده‌های نقشه © مشارکت‌کنندگان OpenStreetMap (ODbL).' },
    textures: { who: 'بافت‌های زمین', text: `Solar${nb}System${nb}Scope (CC${nb}BY${nb}4.0)، از Blue${nb}Marble و Black${nb}Marble ناسا.` },
    // Names the faces the Persian page is set in too, so the credit says what is on screen
    // «قلم‌ها» (typefaces); «حروف» is "letters". «؛» is a strong right-to-left letter for the bidi algorithm, so it keeps
    // the Latin names on either side apart.
    type: {
      who: 'قلم‌ها',
      text: `Instrument${nb}Sans و Instrument${nb}Serif از Instrument؛ Martian${nb}Mono از Evil${nb}Martians؛ Noto${nb}Sans${nb}Arabic و Amiri برای فارسی (SIL${nb}OFL).`,
    },
  },

  keys: {
    search: 'جستجوی مکان',
    suggestions: 'حرکت میان پیشنهادها',
    choose: 'انتخاب',
    passes: 'رفتن از گذری به گذر دیگر',
    photos: 'تصویر قبلی / بعدی',
    expand: 'بزرگ کردن تصویر',
    zoom: 'بزرگ‌نمایی (در حالت بزرگ)',
    play: 'پخش یا مکث بازپخش',
    back: 'بازگشت یا بستن',
    help: 'همین صفحه',
  },
  keyNames: { enter: 'Enter', space: 'فاصله', esc: 'Esc' },

  builtBy: (handle: string): AboutPart[] => ['ساختهٔ ', handleLink(handle)],
  footerNote: 'ساخته‌شده از داده‌های عمومی. هیچ‌یک از این عکس‌ها را ما نگرفته‌ایم.',
}
export default about
