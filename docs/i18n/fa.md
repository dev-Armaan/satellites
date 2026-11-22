# Watched: Persian (fa) localisation style guide

First edition, 2026-11-21, written before the catalogs and then followed by them; revised the same day after two
independent reviews (see "Review" at the end). It binds every `fa` string the product
shows, speaks or sends: the app, the share card and share page, the post text, alt text and aria labels, the
time-lapse video, About and the loading screen. One catalog in standard written Persian of Iran (فارسی معیار) serves
Iran, the diaspora and Persian readers in Afghanistan and Tajikistan who read Iranian Persian (see §8.6).

If a translator's habit disagrees with this guide, the guide wins. If the guide and the English disagree on a fact, the
English wins and the guide is wrong: report it. The English source of truth is `src/i18n/en/*.ts` (above all
`results.ts`, `pass.ts`, `verdicts.ts`, `landing.ts`, `share.ts`), the card catalog `api/_lib/i18n/card/en.ts`,
`src/i18n/bootText.ts`, and `docs/DESIGN.md` §7 for the voice and the verdict vocabulary.

**About the examples.** Persian is typed in logical order, the order the code stores. In a left-to-right editor a
line that mixes Persian with Latin names or digits can look scrambled. That is a display effect: check a string in a
browser under `dir="rtl"` before deciding it is out of order, and never reorder words to make an editor look right.

**Notation.** In frames, `*…*` marks the one serif accent and `**…**` the strong part. `⟨LRI⟩`, `⟨FSI⟩`, `⟨PDI⟩` stand
for U+2066, U+2068, U+2069 (type the characters, or `\u2066` escapes, never the brackets). `⟨ZWNJ⟩` is U+200C, the
half-space (نیم‌فاصله), which is typed as the character itself in every catalog, as Persian is typed. Slots are
`[PLACE]`, `[SAT]`, `[NUM]`, `[TIME]` (a 24 h clock with its zone) and `[DAY]` (a day written by the `time`
namespace).

## 0. Decisions at a glance

| Question | Decision |
|---|---|
| Register | Standard written Persian (نوشتار معیار), plain and modern: the register of a careful science page or a good app, not a newspaper and not a government letter. No colloquial spellings (`میشه`، `رو`), no Arabic-heavy officialese (`می‌باشد`، `گردید`، `جهت`، `مذکور`). |
| Address | **شما** on every surface, with the verb in the second person plural (`کنید`، `دارید`) and the enclitic `ـتان` or `شما` for "your". Never `تو`. §1. |
| Product voice | `ما` with first person plural verbs (`ردیابی می‌کنیم`، `نگه نمی‌داریم`، `نمی‌توانیم بدانیم`). |
| Product verb ("watched") | **رصد کردن** (`رصد کرد`، `رصد کردند`). Never `زیر نظر گرفتن`، `تحت نظر`، `جاسوسی`، `شنود` (surveillance); never `عکس گرفت` (photographed). §4.1. |
| Hero | `چیزی این هفته` / `*شما* را رصد کرد.` |
| Headline shape | Time, then the place as the fronted object, then the count and the verb as the strong part: `در 7 روز گذشته، *Waterloo* را **256 ماهواره رصد کردند**.` §3.3. |
| Satellites | `ماهواره` (plural `ماهواره‌ها`); before a name `ماهوارهٔ Sentinel-2C`; a crewed station `ایستگاه فضایی ISS`. A nameless one is `یک ماهواره` (subject) or `ماهواره‌ای` (indefinite). |
| "Pass" | `گذر` (plural `گذرها`), counted `31 گذر`. Never `پرواز` (a flight), never `عبور` as the noun (kept for the verb `گذشت` only). |
| Verdicts | `رصد کرد` · `احتمالاً رصد کرد` · `می‌توانست به این‌جا نگاه کند` · `از بالای سر گذشت`. Lanes: `تصویر` · `محتمل` · `ممکن` · `بالای سر`. §3.6. |
| Counts | Persian counts with a **singular** noun (`256 ماهواره`، `31 گذر`). In sentences 1 is the word `یک` (`یک ماهواره`، `یک بار`); in readouts the digit stays. CLDR's `one` category also holds **0**: never write `یک` in a `one` branch, test `n === 1`. §5.4. |
| Buttons | Verbal or plain nouns: `اشتراک‌گذاری`، `کپی پیوند`، `تلاش دوباره`، `بستن`، `لغو`. The reader's own first-person commands stay: `غافلگیرم کن`. Help and errors: polite imperative (`دوباره امتحان کنید`). No `لطفاً`. |
| Digits | **Western 0–9 for now** (`fmt('fa')`, `fa-u-nu-latn`), `.` decimals, `,` groups, as the rest of the product and the mono face require. Persian digits (۰–۹) are what a native product would use: §6.3 says why and what must change. |
| Units | Words, never Latin symbols: `کیلومتر`، `متر`، `کیلومتر بر ثانیه`، `ثانیه`، `دقیقه`، `ساعت`. As adjectives: `در ارتفاع 786 کیلومتری`، `نوار 290 کیلومتری`. `°` and `%` stay as signs. |
| Calendar | **Gregorian**, with CLDR's Iranian month names (`ژانویه … دسامبر`): `یکشنبه 1 نوامبر`. Every Intl call passes `calendar: 'gregory'`, since Intl's `fa` defaults to the Solar Hijri calendar. §6.4. |
| Time | 24-hour clocks with colons, as they arrive (`16:14:21 UTC`). Never `ق.ظ` / `ب.ظ`. |
| Orthography | Persian `ی` (U+06CC) and `ک` (U+06A9), never Arabic `ي` / `ك`. The half-space wherever Persian orthography requires it (`می‌کند`، `ماهواره‌ها`، `نزدیک‌ترین`). Ezafe after silent `ه` written `ـهٔ` (`ماهوارهٔ`). §6.1. |
| Punctuation | `،` `؛` `؟` `« »`, the full stop `.`, the ellipsis `…`. No exclamation mark, no em dash. Ranges in prose with `تا`, never a dash between numbers. |
| Direction | The page is `dir="rtl"` and mirrored by the existing layout. Clocks with their zone, percentages after Persian words, degrees, coordinates, stamps and Latin codes are isolated (LRI…PDI in DOM-only strings, `num()` in rich parts). Plain text (card, post, titles) carries no bidi controls and always starts with a Persian letter. §6.2. |
| Type | The Arabic page's faces (Noto Sans Arabic, Amiri for the accent, `html[data-script='arabic']`), which already hold every Persian letter, the hamza above (U+0654), the half-space and the Persian digits. No new file. §6.8. |
| Never translated | Watched., www.watched.earth, satellite, sensor, product and programme names, NORAD ids, UTC and zone abbreviations, coordinates, licence lines, file-name words, `Planetary Computer`, `NASA GIBS`, `NASA Worldview`. `NASA` in prose is `ناسا`, the name every Persian reader uses for the agency. |

## 1. Register and address

### 1.1 Why شما

Persian has two ways to say "you" to one person: `تو` (intimate: family, friends, children, poetry, prayer) and
`شما` (the default with anyone you have not chosen to be close to). Every product a Persian reader uses daily speaks
`شما`: banks, Digikala, Snapp, Divar, and the Persian versions of Google, Instagram and Telegram. A product that says
`تو` is making a deliberate youth-brand gesture, and it reads that way.

The English voice is personal, but it is an instrument's voice: calm, exact, a little uncanny. In Persian that is
`شما`. Said flatly, `چیزی این هفته شما را رصد کرد.` is already unsettling: something unnamed, a precise verb, and you
at the centre of it. `تو` would add a whisper the English does not have (`چیزی این هفته تو را رصد کرد` sounds like a
stranger leaning in), and it would make every instruction in the product (`دوباره امتحان کن`، `اتصالت را بررسی کن`)
sound like a friend talking, or to an older reader like a lack of respect. `شما` costs the hero nothing.

`شما` is grammatically plural, but read as a polite singular by every Persian reader; a share card that says
`شما` addresses whoever reads it, one person or a feed.

### 1.2 Surface by surface

| Surface | Form | Example |
|---|---|---|
| Display lines (hero, headline, About title, card) | Declarative past tense. "You" is `شما`, free-standing, so the accent can fall on it. | `چیزی این هفته *شما* را رصد کرد.` |
| Sentences (results, pass paragraph, footnotes) | Declarative. The product's "we" is a first-person plural verb; the pronoun `ما` only for contrast or clarity (`ما فقط … نگه می‌داریم`). | `نمی‌توانیم بدانیم رصد کرد یا نه.` |
| Buttons and labels | Nouns or verbal nouns (`مصدر`): `بازپخش`، `اشتراک‌گذاری`، `ذخیرهٔ PNG`. The reader's own command to the product keeps the first person (`غافلگیرم کن`). | `تلاش دوباره` · `لغو` · `بستن` |
| Mono caps labels | Short nouns, ezafe chains kept short. Section rules keep their index. | `ارتفاع 786 کیلومتر` · `02 / گذرها` |
| Hints and errors | First what failed, impersonally (`… بارگیری نشد`، `… پاسخ نداد`), then one step as a polite imperative. | `کاتالوگ مداری بارگیری نشد. اتصالتان را بررسی کنید و دوباره امتحان کنید.` |
| About | Plain, conversational, still declarative. The visitor's questions in the first person singular. | `می‌تواند مرا ببیند؟ نه.` |

### 1.3 "Your"

`شما` after the noun (`مکان شما`، `نقطهٔ شما`، `آسمان شما`) is the default: clear, and the reader is named as a word.
The enclitic `ـتان` (`اتصالتان`، `خیابان‌هایتان`، `مرورگرتان`) is used where the possessed noun is not the point of
the sentence, or where `شما` would repeat. After a vowel the enclitic takes `یـ`: `خیابان‌هایتان`, `ابرهایتان`. Never
`خود` alone for "your" in a label (`مکان خود` reads "one's own place").

### 1.4 Rejected alternatives

- **`تو` everywhere.** Closer to the English's one-to-one feeling, and Turkish, Polish and Spanish chose their
  intimate forms. It loses in Persian because the intimate pronoun is a relationship the reader has not offered, and
  because its imperatives (`کن`، `بزن`) read as orders or as slang in a product.
- **Impersonal Persian** (`می‌توان دوباره تلاش کرد`، `مکان مورد نظر`). The register of forms and manuals; it removes
  the reader from a product whose whole point is the reader.
- **`لطفاً` before instructions.** Persian UI often adds it. The English never says "please"; `دوباره امتحان کنید`
  is polite already.

## 2. Voice

### 2.1 Declarative, specific, quietly uncanny, second person

- **Declarative:** the simple past, stated flat (`رصد کرد`، `گذشت`، `منتشر شد`). `احتمالاً` only where the English
  says "likely", `شاید` / `ممکن است` only where it says "may".
- **Specific:** the number and the name carry the sentence (`در ارتفاع 786 کیلومتری`، `ساعت 16:14:21 UTC`، `با سرعت
  7.46 کیلومتر بر ثانیه`). Never round, never `تعداد زیادی`.
- **Quietly uncanny:** the weight falls on the reader at the end of a clause: `ابرهای شما را دید، نه خیابان‌هایتان
  را.` No intensifier the English lacks (`واقعاً`، `کاملاً`، `دقیقاً`), no exclamation mark, no drama word
  (`ترسناک`، `شگفت‌انگیز`).
- **Second person:** "you" where the English has it, and nowhere else. "Your spot", "your sky", "your horizon" are the
  searched place: `نقطهٔ شما`، `آسمان شما`، `افق شما`.

### 2.2 Rhythm

- One fact per sentence, about 18 words at most (a number with its unit or a clock with its zone is one word). Prefer
  a full stop to a chain of `و`.
- Persian is verb-final: put what is new just before the verb. That is why the headline fronts the place and ends on
  `256 ماهواره رصد کردند` (§3.3): the count is the news.
- Prefer Persian words to Arabic loans where both are plain: `پس` over `لذا`، `برای` over `جهت`، `اما` over `لیکن`،
  `هنوز` over `تاکنون`، `فعلاً` over `در حال حاضر`، `است` over `می‌باشد`، `شد` over `گردید`.

### 2.3 What to avoid

- **Marketing:** `کشف کنید`، `همین حالا`، `فوق‌العاده`، `رایگان!`. The English never sells.
- **Calques of English structure:**
  - `توسط` for an agent: write `ماهوارهٔ X آن را رصد کرد`, not `توسط ماهوارهٔ X رصد شد`.
  - `انجام شد` + masdar: write `جستجو شد`, not `جستجو انجام شد`.
  - `به صورت` / `به شکل` + adjective as an adverb: `مستقیم`، not `به صورت مستقیم`.
  - `مورد` filler: `مکان`، not `مکان مورد نظر`؛ `بررسی شد`، not `مورد بررسی قرار گرفت`.
  - `داشتن` progressive (`دارد بارگیری می‌شود`): colloquial; labels say `در حال بارگیری`.
  - "the last 7 days" is `7 روز گذشته`, never `آخرین 7 روز`.
- **Religious formulas** for uncertainty: never `ان‌شاءالله`، `خدا می‌داند`. "We can't know" is `نمی‌توانیم بدانیم`.
- **Over-politeness:** `لطفاً`، `متأسفانه`، `پوزش می‌خواهیم`. State the fact, give the step.

### 2.4 Before and after

| Before (rejected) | After | What changed |
|---|---|---|
| `Waterloo توسط 256 ماهواره در 7 روز اخیر عکس‌برداری شده است.` | `در 7 روز گذشته، Waterloo را 256 ماهواره رصد کردند.` | The banned verb, the `توسط` passive and the starting Latin name are gone; the count is the news, at the end. |
| `همین حالا کشف کنید چه کسی شما را زیر نظر دارد!` | `چیزی این هفته شما را رصد کرد.` | Marketing, surveillance and the exclamation mark removed; the past tense says it happened. |
| `متأسفانه در حال حاضر امکان یافتن تصاویر وجود ندارد. لطفاً بعداً تلاش نمایید.` | `این هفته هیچ تصویری منتشر نشد.` | The apology, the officialese (`نمایید`) and the invented instruction are gone; the fact remains. |
| `Sentinel-2C Waterloo را رصد کرد.` (plain text) | `ماهوارهٔ Sentinel-2C از بالا Waterloo را رصد کرد.` | Plain text started with a Latin name, and the two names ran together into one. |
| `نمی‌توانیم بدانیم، خدا می‌داند.` | `نمی‌توانیم بدانیم رصد کرد یا نه.` | The formula is gone, the sentence is flat. |

## 3. The key lines

### 3.1 The hero

```
چیزی این هفته
*شما* را رصد کرد.
```

Catalog: `hero: [['چیزی این هفته'], [accent('شما'), ' را رصد کرد.']]`, the same for `landing.hero` and `card.hero`.
"Something this week / watched *you*." The accent is `شما`, at the start (the right) of the second line, in Amiri.

- Two lines, not three: Persian says it in five words, and the only three-line splits leave a one-word line
  (`رصد کرد.` or `چیزی`) that makes the poster a wedge. The two lines are nearly equal.
- `چیزی` first, as English begins with "Something": the unnamed thing comes before the time. `این هفته چیزی شما را رصد
  کرد` is equally natural and was the runner-up; it starts slower.
- `رصد کرد`, not `دید`: `دید` alone is also a noun ("sight, view"), and the product needs one verb that works as a
  label, a headline and a hero (§4.1).
- The share hook echoes it with `هم` after the object: `چیزی این هفته شما را هم رصد کرد.` ("…you too").

Tab title (`app.documentTitle`, boot `title`): `Watched · چیزی این هفته شما را رصد کرد`, brand first, as in English.

| Alternate | Why it loses |
|---|---|
| `کسی این هفته شما را زیر نظر داشت.` | `کسی` is a person (the English says "something"), and `زیر نظر داشتن` is surveillance over time. |
| `چیزی این هفته تو را دید.` | `تو` (§1.4), and `دید` is weaker than the product verb and ambiguous as a label. |
| `این هفته / چیزی *شما* را / رصد کرد.` | Three lines, the last a single word. |

### 3.2 The sub line

`هر جای زمین را جستجو کنید و همهٔ ماهواره‌هایی را ببینید که در 7 روز گذشته از فرازش گذشتند، همراه با تصویرهای
واقعی‌ای که گرفتند.`

- One sentence, one piece, a no-break space between `7` and `روز`.
- The two English imperatives become one sentence with two polite imperatives joined by `و`: Persian does not stack
  two short commands as English does.
- `جستجو کنید`, not `وارد کنید`: one searches a place; only a name is "entered" (`نام مکان را وارد کنید`).
  `هر جای زمین را وارد کنید` is a calque of "Enter any place". The card's footer and the share page say the same.
- `از فرازش` ("over it") points back to `هر جای زمین`, our own noun, never to a slot.
- `واقعی` carries "actual": real pictures, not illustrations. `گرفتند`: the pictures the satellites took (a picture
  is "taken", `تصویر گرفتن`; this is not the product verb and not "photographed").

### 3.3 The results headline and the second line

**`results.headline.watched(n, place, when)`**

```
{window}، *{place}* را **{n} ماهواره رصد کردند**.
```

| Case | Persian |
|---|---|
| n > 1, this week | `در 7 روز گذشته، *Waterloo* را **256 ماهواره رصد کردند**.` |
| n = 1 | `در 7 روز گذشته، *Waterloo* را **یک ماهواره رصد کرد**.` (no `num()`: one is a word) |
| an older window | `از 29 اکتبر تا 5 نوامبر، *Waterloo* را **31 ماهواره رصد کردند**.` |
| a one-day window | `در 24 ساعت گذشته، …` (`روز گذشته` alone means "yesterday") |

- The object comes first with `را`, the subject and verb last. Persian fronts an object freely (`این فیلم را دو
  میلیون نفر دیدند`), and it gives the headline what English bolds: the count and the verb, together, at the end.
- With a number the noun is singular (`256 ماهواره`), and the verb is plural (`رصد کردند`): the satellites act.
- The place takes nothing but `را` after it, tied by a no-break space (`accent(place), '\u00a0را '`) so a line never
  starts with `را`; it is never inflected and needs nothing else.
- A place that ends in a full stop (`D.C.`) takes no second one only when it ends the sentence; here it never does.

**`results.headline.none(place, past)`**: `این هفته هیچ‌یک از ماهواره‌هایی که ردیابی می‌کنیم *Waterloo* را رصد
نکرد.` (`آن هفته …` for `past`). A negative subject (`هیچ‌یک`) reads best before the object, so this one keeps the
plain subject–object–verb order.

**`results.imagesPublic(k)`**: `[strong('دست‌کم '), num(k), ' تصویر منتشر شد.']`; for `k === 1`
`[strong('دست‌کم '), 'یک تصویر منتشر شد.']`. "At least" comes first, as in English, and the sentence reads with and
without it. An inanimate counted subject takes a singular verb (`31 تصویر منتشر شد`), as Persian prose does.

- `noImages`: `این هفته هیچ تصویری منتشر نشد.` / `آن هفته هیچ تصویری منتشر نشد.`
- `archiveDown`: `آرشیوهای تصویر پاسخ ندادند، پس فعلاً نمی‌توانیم تصویرهای منتشرشده را بشماریم.`
- `منتشر شد` is "made public": what is published is public. `عمومی شد` was rejected as stilted for pictures, `در
  دسترس عموم قرار گرفت` as officialese.

**`results.why`**

| Key | Persian |
|---|---|
| `sunNeverRose` | `خورشید اصلاً طلوع نکرد، پس هیچ دوربینی که به نور روز نیاز دارد نمی‌توانست این‌جا را ببیند.` |
| `sunBarelyRose` | `خورشید به‌زحمت بالا آمد، پس هیچ دوربینی که به نور روز نیاز دارد نمی‌توانست این‌جا را ببیند.` |
| `infrared(n)` | `با این حال، ماهواره‌های هواشناسی ` + num + ` بار این‌جا را با فروسرخ پوشش دادند.` (1: `یک بار`) |
| `radar` | `رادار به نور نیاز ندارد. این‌جا در مجموع 1,204 بار در بُرد ماهواره‌های راداری Umbra-08، Capella-14 و 7 ماهوارهٔ دیگر بود.` One name: `این‌جا 3 بار در بُرد ماهوارهٔ راداری Umbra-08 بود.` One other: `… و یک ماهوارهٔ دیگر بود.` |
| `unpublished(n)` | `ماهواره‌های Sentinel-2 یا Landsat در روشنایی روز 3 بار از فراز این‌جا گذشتند، اما هنوز هیچ صحنه‌ای منتشر نشده است.` (1: `یکی از ماهواره‌های … یک بار … گذشت`) |
| `none` | `هیچ ماهوارهٔ تصویربرداری با آرشیو باز در روشنایی روز از فراز این‌جا نگذشت.` |

"Swept it in infrared" is `پوشش دادند`, the likely verdict's verb (§3.6), never `اسکن کردند` with a place as object.
A Persian word always stands between a Latin name and a number, or the reader sees `Umbra-08 3` (or `Landsat 3`, a
real satellite) as one name: in `unpublished`, `در روشنایی روز` stands between `Landsat` and the count. The range is
the satellites', so the place is the subject (`این‌جا … در بُرد … بود`): `در بُرد این‌جا` would be "in this place's
range". "In all" is `در مجموع`: `روی هم` after a plural subject reads "on top of each other". Each name in the list is
its own left-to-right island (§5.2).

### 3.4 The pass paragraph (`pass`)

> `ماهوارهٔ Sentinel-2C ساعت 16:14:21 UTC در ارتفاع 786 کیلومتری درست از فراز این مکان گذشت و با سرعت 7.46 کیلومتر
> بر ثانیه رو به جنوب می‌رفت. درست رو به پایین نگاه می‌کرد. پوشش ابر در کل صحنه: 25%.`

Persian order: subject, time, altitude and place, verb, then how it moved as a second clause. The clock and its zone
are one `num()` part. Altitude is adjectival (`در ارتفاع 786 کیلومتری`). The path of `گذشتن` is marked by `از`: a
ground offset is `از 61 کیلومتری غرب این مکان گذشت` ("passed 61 km west of this place"), as `از فراز`, `از کنار`.

**Written Persian is verb-final.** What English tacks on after a comma (`…, in the dark`, `…, 61 km to the west`,
`…, 62° above your horizon`) goes before the verb, or into a second clause with a verb of its own. Never end a
sentence on a phrase after its verb.

| Message | Persian |
|---|---|
| `crossed`, overhead | `ماهوارهٔ [SAT] ساعت [TIME] در ارتفاع 786 کیلومتری درست از فراز این مکان گذشت و با سرعت 7.46 کیلومتر بر ثانیه رو به جنوب می‌رفت.` |
| `crossed`, offset | `ماهوارهٔ [SAT] ساعت [TIME] در ارتفاع 786 کیلومتری، از 61 کیلومتری غرب این مکان گذشت و با سرعت … رو به جنوب می‌رفت.` |
| `lookingDown` / `lookingOff` | `درست رو به پایین نگاه می‌کرد.` / `با 5.4° انحراف از راستای قائم رو به پایین نگاه می‌کرد.` |
| `cloudCover` | `پوشش ابر در کل صحنه: 25%.` |
| `mosaic` | `تصویربردار MODIS این ماهواره تصویر [PLACE] را با 250 متر در هر پیکسل به موزاییک روزانهٔ رنگ طبیعی ناسا افزود.` |
| `radarImaged` | `رادار این ماهواره با زاویهٔ 32.1° به پهلو، [PLACE] را در تاریکی با دقت 20 متر در هر پیکسل رصد کرد.` |
| `likely.crossed` | `… گذشت و این‌جا درون نوار تصویربرداری 290 کیلومتری‌اش بود.` (no swath: ends at `گذشت.`) |
| `likely.archiveFailed` | `روز بود، پس باید این نقطه را ثبت کرده باشد. فعلاً جستجو در آرشیو ممکن نیست.` (`فعلاً` takes the present) |
| `likely.noScene` | `برای این گذر هیچ صحنه‌ای وجود ندارد. ماهواره‌های Sentinel-2 فقط خشکی و آب‌های ساحلی را ثبت می‌کنند و شاید این نقطه در برنامه‌شان نبوده است.` |
| `likely.notYet` | `روز بود، پس به احتمال قریب به یقین این نقطه را ثبت کرده است. هنوز هیچ صحنه‌ای از این گذر منتشر نشده است؛ انتشار در آرشیوها ممکن است یک روز یا بیشتر طول بکشد.` |
| `likely.dark` | `این‌جا تاریک بود. تصویربردارهای هواشناسی شب‌ها هم با فروسرخ اسکن می‌کنند، پس این ماهواره ابرهای شما را دید، نه خیابان‌هایتان را.` (the subject of the singular `دید` is named) |
| `could.withinView` | `ماهوارهٔ [SAT] ساعت [TIME] از 61 کیلومتری غرب این مکان گذشت و این‌جا در دیدرسش بود.` / `… درست از بالای سر این مکان گذشت و این‌جا در دیدرسش بود.` |
| `could.insideSwath` | `[PLACE] درون نوار 24 کیلومتری‌اش بود. اپراتورش اعلام نمی‌کند از کجا تصویر گرفته است، پس نمی‌توانیم بدانیم این‌جا را رصد کرد یا نه.` |
| `could.radar` | `رادار از پشت ابر و در تاریکی هم می‌بیند. اگر 25.0° به پهلو نگاه می‌کرد، می‌توانست از [PLACE] تصویر راداری بگیرد.` + `در این گذر هیچ تصویر منتشرشده‌ای از این‌جا نیافتیم.` or `نمی‌توانیم بدانیم چنین تصویری گرفت یا نه.` |
| `could.camera` | `اگر دوربینش را 18.0° از راستای قائم می‌چرخاند، می‌توانست [PLACE] را رصد کند. نمی‌توانیم بدانیم رصد کرد یا نه.` Overhead: `با نگاهی رو به پایین، می‌توانست …` |
| `overhead` | `ماهوارهٔ [SAT] ساعت [TIME] در ارتفاع 420 کیلومتری گذشت و در سمت شمال غربی به 62° بالای افق شما رسید.` Zenith: `… گذشت و به 85° بالای افق شما، تقریباً درست بالای سرتان، رسید.` Station: `ایستگاه فضایی ISS …` |
| `darkStation` | `در محل شما هوا تاریک بود. اگر ایستگاه هنوز در نور خورشید بوده باشد، مانند نقطه‌ای روشن که چشمک نمی‌زد از آسمان شما گذشته است.` (an inference about the past: `اگر … بوده باشد، … گذشته است`; `اگر … بود، … گذشت` is the counterfactual mixed with a fact) |
| `geo.sits` | `ماهوارهٔ Meteosat-12 گذر نمی‌کند. در ارتفاع 35,778 کیلومتری بالای استوا، در 0.2°W، قرار دارد و هر 10 دقیقه تمام نیمه‌ای از زمین را که رو به آن است اسکن می‌کند.` (`می‌ایستد` is "stands up" or "stops") |
| `geo.reached` | `خط این اسکن حدود ساعت [TIME] به [PLACE] رسید و رو به شمال پیش می‌رفت.` |
| `geo.infrared` | `این‌جا تاریک بود، پس این تصویر فروسرخ است: دمای بالای ابرها؛ هرچه سردتر، روشن‌تر.` |

- `گذشت` for every "crossed" and "passed". Never `پرواز کرد` (a flight: aircraft and, in the news of the war zones
  people search for, warplanes and drones), never `عبور کرد` (correct, but stiffer, and kept out so the noun `گذر` and
  its verb match).
- `از فراز` ("over") in prose, `از بالای سر` ("overhead") where the English says overhead.
- "Steady" is `چشمک نمی‌زند` (does not twinkle), never `ثابت` (stationary, the geostationary word).
- "Mapped" (radar) is `تصویر راداری گرفتن`: `نقشه‌برداری` is surveying. A blurb that does mean mapping says
  `نقشه تهیه کردن`; `نقشه کردن` is no verb and `نقشه کشیدن` is also "to scheme".
- "Imaged" is `تصویر گرفتن`; `تصویر کردن` is "to depict".
- "Within view" is a clause of its own with the place in the satellite's view, `این‌جا در دیدرسش بود`, or the set
  phrase `در دیدرس [PLACE] گذشت` (the card, the post, the verdict's verb). Never `از دیدرس … گذشت`: it gives the
  view to the place and pulls towards `از دیدرس خارج شد` ("went out of sight").

### 3.5 Share card, share page and post

**Card headline**, `card.headline(n, place, cut)` and `headlineWeek`: three blocks, time first as in the app:

```
این هفته
*Waterloo* را
31 ماهواره رصد کردند.
```

`['این هفته', accent(place, ' را'), '31 ماهواره رصد کردند.']`. Zero keeps subject–object–verb, as the app's
`results.headline.none` does: `['این هفته هیچ‌یک از ماهواره‌هایی که ردیابی می‌کنیم', accent(place, ' را'), 'رصد
نکرد.']` (with the object first, two verbs meet: `…ردیابی می‌کنیم رصد نکرد`). The serif block holds the place and its `را` (the words on its line).
The full stop closes the last text block, so a cut place (`…`) needs no special case. Joined with spaces the parts are
the page title, and it starts with a Persian word.

**Older shares, `headlineBy`.** A Persian word stands between the satellite's name and the place, so the two Latin names
never run together in the title:

| Verdict | Blocks |
|---|---|
| imaged | `ماهوارهٔ [SAT] از بالا` \| `*[PLACE]* را` \| `رصد کرد.` |
| likely | `ماهوارهٔ [SAT] از بالا` \| `*[PLACE]* را` \| `پوشش داد.` |
| could | `ماهوارهٔ [SAT] در دیدرس` \| `*[PLACE]*` \| `گذشت.` |
| overhead | `ماهوارهٔ [SAT] از فراز` \| `*[PLACE]*` \| `گذشت.` (station: `ایستگاه فضایی ISS …`) |
| nameless | `یک ماهواره از بالا` … |

`از بالا` ("from above") is true of every one of them and is the plainest separator Persian has.

**The card's other words**

| Key | Persian |
|---|---|
| `photos` | `هیچ تصویری منتشر نشد.` · `31 تصویر منتشر شد.` · `دست‌کم 31 تصویر منتشر شد.` · `یک تصویر منتشر شد.` |
| `cloud.only` | sub `پوشیده از ابر. جز ابر چیزی ندید.` · chip `پوشیده از ابر · 92%` · post `جز ابر چیزی ندید.` · desc `جز ابر چیزی ندید (92%).` |
| `cloud.mostly` | sub `عمدتاً ابری: 81% صحنه.` · chip `عمدتاً ابری · 81%` · post/desc `بیشتر ابر دید (81% صحنه).` (as a label, `بیشتر ابر` reads "more cloud"; in the sentence it is adverbial) |
| `cloud.spot` | sub `ابر درست روی همان نقطه.` · chip `ابر روی نقطه` · post/desc `ابر نقطه را پوشانده بود.` |
| `stamp` | `یکشنبه 1 نوامبر 2026 · 11:21 EST` |
| `weekTo` / `lastWeek` | `7 روز تا یکشنبه 1 نوامبر 2026` / `7 روز گذشته` |
| `readout` | `ارتفاع` · `زاویهٔ ارتفاع` · `سرعت` · `انحراف` · `پیکسل` · `پیکسل موزاییک` · `نزدیک‌ترین` |
| `lane` | `تصویر` · `محتمل` · `ممکن` · `بالای سر` |
| `unit` | `کیلومتر` · `متر` · `کیلومتر بر ثانیه` |
| `geometry` | `هندسهٔ گذر · شمال بالا` |
| `note` | `تصویر در Watched باز می‌شود` · `تصویر فعلاً در دسترس نیست` · `آرشیو تجاری، غیرعمومی` · `درون نوار؛ هنوز تصویر عمومی ندارد` · `مسیر زمینی در نزدیک‌ترین نقطه` (the app is named: `برنامه` is also "schedule", the catalogs' word for an acquisition plan) |
| `noPublicPhoto` | `این هفته هیچ تصویر عمومی‌ای نیست` (`تصویر عمومی نیست` reads "the image is not public") |
| `look` | `نزدیک‌ترین نما` · `آخرین نمای بی‌ابر` · `پوشیده از ابر` · `رادار` |
| `aSatellite` | `یک ماهواره` |
| `invite` | `چه چیزی شما را رصد کرد؟` (a question for the English imperative, as the page's question) |
| `cardAlt` | `کارت اشتراک‌گذاری، با نزدیک‌ترین تصویر این هفته که ماهوارهٔ X گرفته است.` · `کارت اشتراک‌گذاری.` (`اشتراک` alone is a subscription) |
| `enterAnyPlace` | `هر جای زمین را جستجو کنید` |
| `defaultPlace` | `نخل جمیرا` |

**Share page.** `page.title` = the hero sentence. `page.placeTitle(place)`: `چه چیزی این هفته [PLACE] را رصد کرد` (no
full stop: a heading). `placeDescription`: `همهٔ ماهواره‌هایی که در 7 روز گذشته از فراز [PLACE] گذشتند، همراه با
تصویرهای واقعی‌ای که گرفتند. این هفته چه چیزی شما را رصد کرد؟` `question`: `این هفته چه چیزی شما را رصد کرد؟`

**Pass descriptions** (`crossed`, `withinView`): `ماهوارهٔ Sentinel-2C ساعت 11:21 EST روز یکشنبه 1 نوامبر 2026، در
ارتفاع 795 کیلومتری از فراز Waterloo گذشت و رو به جنوب می‌رفت.` Each part (altitude, moment, heading) drops out
cleanly when unknown. `couldHave`: `می‌توانست به این‌جا نگاه کند. اپراتورش نمی‌گوید که نگاه کرد یا نه.`

**Post (`share.post`)**: `ماهوارهٔ Sentinel-2C روز یکشنبه 1 نوامبر ساعت 11:21 به وقت محلی، Waterloo را از ارتفاع
795 کیلومتری رصد کرد. 10 متر در هر پیکسل؛ این همان تصویر واقعی است.` then `چیزی این هفته شما را هم رصد کرد.` The
moment stands between the two names, and the place comes before the altitude: `795 کیلومتری Waterloo` would read
"795 km from Waterloo" (`در 61 کیلومتری تهران`). The credit is `از طریق @armaangupt0`, tied by a no-break space so it
never breaks (X's mention parser accepts one before `@`; the sheet's preview isolates the handle, so its `@` stays
with the name). X weighs Persian letters as one, like Latin: the English length budget holds.

### 3.6 The four verdicts (`verdicts`)

| Verdict | `title` | `short` | `unit` | `definition` | `verb` |
|---|---|---|---|---|---|
| imaged | `رصد کرد` | `تصویر` | `گذر` | `تصویری واقعی از این مکان در یک آرشیو عمومی وجود دارد.` | `رصد کرد` |
| likely | `احتمالاً رصد کرد` | `محتمل` | `گذر` | `نوار تصویربرداری یک دوربین ثابت این مکان را پوشش داد. هیچ تصویری از این‌جا منتشر نشده است.` | `پوشش داد` |
| could | `می‌توانست به این‌جا نگاه کند` | `ممکن` | `گذر` | `این‌جا در بُرد یک دوربین قابل‌چرخش یا خصوصی بود. اپراتورش نمی‌گوید که نگاه کرد یا نه.` | `در دیدرس گذشت` |
| overhead | `از بالای سر گذشت` | `بالای سر` | `گذر` | `از آسمان شما گذشت. ایستگاه‌های فضایی و هر چیز دیگر.` | `از بالای سر گذشت` |

- Titles are past-tense verb phrases whose subject is the satellite, as the English ones are.
- `می‌توانست به این‌جا نگاه کند` ("it could have looked here") is the honest Persian for "could have pointed here":
  the definition says it is about looking. `نشانه گرفتن` and `هدف گرفتن` (to aim, to target) are weapons' words.
- The lane word is `تصویر` (image), never `عکس`: radar images and mosaics share the lane.
- `احتمالاً` / `محتمل` mean "more likely than not"; `ممکن` means "possible". The gradient is the point.
- `ثابت` in "fixed camera" is safe here (a camera that cannot be pointed); the geostationary word is `زمین‌ایستا`.
- A camera that can be pointed is `قابل‌چرخش`, never `چرخان` ("spinning", and in Iran the CCTV camera's name, the
  surveillance word §8.1 keeps out). Leaning is `دوربینش را … بچرخاند`, never `کج شدن` ("to go crooked").
- Coverage is `پوشش دادن`; `پوشاندن` is to cover over or hide, as cloud does (`ابر نقطه را پوشانده بود`).
- Footnotes that name a verdict quote its title as the pass list shows it: `در دستهٔ «احتمالاً رصد کرد» نشان داده
  می‌شوند`, `در دستهٔ «رصد کرد» شمرده می‌شود`.
- About's `verdictMore`: imaged `اگر نشانش می‌دهیم، همان تصویر واقعی است.` · likely `تصویر هنوز عمومی نشده، یا به
  خاطر ابر کنار گذاشته شده است.` · could `هیچ راهی نیست که بدانیم واقعاً نگاه کرد یا نه.` · overhead (empty).

### 3.7 Reference lines by namespace

**`landing`**: kicker `7 روز گذشته`; range `1 تا 8 نوامبر 2026 UTC` (Intl's `formatRange`, Gregorian, as it comes:
with a year, CLDR writes a shared month once);
`searchPlaceholder` `جستجوی مکان`; `placeLabel` `مکان`; `searching` `در حال جستجو`; `searchUnavailable` `جستجو در
دسترس نیست`; `matches(n)` `6 نتیجه`; `noMatch` `نتیجه‌ای نیست`; `searchHint` `نام، نشانی یا مختصات`; `searchDown`
`جستجوی مکان پاسخ نمی‌دهد. مختصاتی مثل ⟨LRI⟩43.47, −80.54⟨PDI⟩ همچنان کار می‌کند.`; `nothingMatches`
`هیچ نتیجه‌ای برای «⟨FSI⟩[QUERY]⟨PDI⟩» پیدا نشد. یک شهر، یک جای شناخته‌شده یا مختصات را امتحان کنید.`; `useMyLocation`
`استفاده از موقعیت من`; `locateMe` `موقعیت من`; `nearMe` `نزدیک من`; `locating` `مکان‌یابی…`; `surprise`
`غافلگیرم کن`; `orTry` `نمونه‌ها`; `dropPin` `گذاشتن سنجاق`; `builtBy` `ساختهٔ ⟨LRI⟩@armaangupt0⟨PDI⟩`.

**`app` and boot**: notice label `خطا`; fallback `مشکلی پیش آمد.`; `تلاش دوباره`; `در حال تلاش…`; `بازگشت`.
Faults: `کاتالوگ مداری بارگیری نشد. اتصالتان را بررسی کنید و دوباره امتحان کنید.` / `هنگام محاسبهٔ گذرها برای این
مکان مشکلی پیش آمد. کمی بعد دوباره امتحان کنید.` Boot: `loading` `در حال بارگیری Watched`; `slow` `اتصال کند است؛
بارگیری ادامه دارد`; `title` as §3.1.

**`hud`**: `چطور کار می‌کند` · `Watched، صفحهٔ اصلی` · `زمان` · `کاتالوگ مداری` · `خورشید` · `صحنه` ·
`خورشید ⟨LRI⟩16.2°S 063.0°E⟨PDI⟩` · `نقطهٔ زیرخورشیدی` · `16,893 جسم` · `دریافت ⟨LRI⟩2026-11-08 03:34Z⟨PDI⟩` ·
age `همین حالا` / `42 دقیقه پیش` / `5 ساعت پیش` / `3 روز پیش`, stale `کهنه، 3 روز پیش` · `کاتالوگ در دسترس نیست` ·
`بارگیری کاتالوگ`.

**`globe`**: callout `NORAD 39634 · 786 کیلومتر`; `ثبت تصویر ⟨LRI⟩11:21:13 EST⟨PDI⟩`; capture line
`ثبت شد ⟨LRI⟩11:21:13 EST⟨PDI⟩ · 10 متر`; countdown labels `ثبت تصویر · SENTINEL-2C` / `نزدیک‌ترین نقطه ·
SENTINEL-2C`; pin card `سنجاق` · `یافتن نام این نقطه` · `مکان نام‌داری در این نزدیکی نیست` · `نمایش آنچه از فراز
[PLACE] گذشت` · `جستجو در این‌جا (Enter)` · `برداشتن سنجاق (Esc)` · `برای جابه‌جایی سنجاق، کره را نگه دارید`; no 3D:
`نمای سه‌بعدی در دسترس نیست` / `WebGL 2 در این مرورگر خاموش است`.

**`results`** (beyond §3.3): `اشتراک‌گذاری`; sections `خلاصه` · `گذرها` · `رصد پیوسته`; `در حال بررسی آرشیوها`;
`جستجوی مکانی دیگر`; `همهٔ گذرها`; footer `بازپخش` · `[اشتراک‌گذاری، **این گذر**]` · `[**بررسی **، مکان شما]` ·
`[**دیدن **، بی‌ابرترین نما]`; head `7 روز · 1 تا 8 نوامبر` (built by `time.ts`: without a year CLDR repeats the month,
`1 نوامبر تا 8 نوامبر`) · `لغو` · `جستجوی تازه` · `بستن` · `تغییر` ·
`محاسبه` · `اخیر` · `قبلی (←)` · `بعدی (→)`; shared tag `برای شما فرستاده شد · [PLACE] را ماهوارهٔ [SAT] رصد کرد`;
computing `کاتالوگ مداری` / `کاتالوگ بارگیری شد` · `محاسبهٔ مدارها · 7 روز` / `مدارها محاسبه شد` · `آرشیوهای
Sentinel-2 + Landsat` / `آرشیوها جستجو شد` · `تطبیق صحنه‌ها با گذرها` / `صحنه‌ها تطبیق داده شد`; `1.84 ثانیه`;
timeline `خط زمانی`; plan `نقشهٔ گذر` · `نقشه · شمال بالا` · `چرخش ⟨LRI⟩±30°⟨PDI⟩` · `نوار 290 کیلومتری` · `مسیر زمینی`;
time-lapse row `گذر سال‌ها` / `این مکان، سال به سال`; share the week `اشتراک‌گذاری خلاصهٔ این هفته در [PLACE]` (a bare
`اشتراک‌گذاری این هفته` reads "sharing, this week"); a pass's position `گذر 3 از 31 در این دسته`; replay `در میدان دید:
4 دقیقه و 12 ثانیه`.

**`passView`**: row labels `آخرین: ` / `نزدیک‌ترین: ` (with a colon: `آخرین یکشنبه` would be "the last Sunday");
`نمایش همهٔ 1,565 ردیف` (`هر` before a large number reads "every"); `40 ردیف باقی مانده`; the spot's pixel in the past
(`نقطهٔ شما بی‌ابر بود.`، `روی نقطهٔ شما ابر بود.`: it is the picture's, not today's sky); `کم‌جزئیات، اما واقعی`
(`درشت` is first "large").

**`about`**: title `این‌طور / *کار می‌کند*.` (declarative; the HUD's link `چطور کار می‌کند` is the question it
answers); `لحظه‌ای است؟` ("Is it live?": `زنده است؟` reads "is it alive?"); touch-ups `اصلاح‌های جزئی` (never
`دست‌کاری`, tampering); `صفحهٔ نمایش` for a screen (`صفحه` is a page); credits `سازنده` · `قلم‌ها` · `© مشارکت‌کنندگان
OpenStreetMap` (OpenStreetMap's Persian attribution).

## 4. Glossary

### 4.1 Terms

| English | Persian | Notes |
|---|---|---|
| watched (product verb) | رصد کرد / رصد کردند | The established verb of Earth observation (`ماهواره‌های رصد زمین`) and of astronomy (`رصدخانه`). Its shadow of "monitoring" is the English word's own. Plural verb for satellites as subjects. |
| watched continuously | رصد پیوسته | section 03 |
| satellite | ماهواره | `ماهوارهٔ [SAT]` before a name; plural `ماهواره‌ها` |
| crewed station | ایستگاه فضایی | `ایستگاه فضایی ISS`; "crewed" `سرنشین‌دار` |
| pass | گذر | `31 گذر`; plural `گذرها`; verb `گذشت` |
| overhead | از بالای سر | lane `بالای سر` |
| within view | در دیدرس | `دیدرس` = range of sight; `این‌جا در دیدرسش بود`, `در دیدرس [PLACE] گذشت`; never `از دیدرس` |
| within range (radar) | در بُرد | the damma marks بُرد (range), never `برد` (won) |
| swath | نوار تصویربرداری | `نوار 290 کیلومتری`; label `پهنای نوار`; "in swath" `درون نوار` |
| fixed / steerable camera | دوربین ثابت / دوربین قابل‌چرخش | never `چرخان` (spinning; Iran's word for the CCTV camera) |
| cover (a swath covers a place) | پوشش دادن | never `پوشاندن` (to cover over, hide) |
| map (a radar blurb) | نقشه تهیه کردن | never `نقشه کردن` |
| field of regard | گسترهٔ چرخش | plan corner `چرخش ±30°` |
| off-nadir | انحراف | prose `انحراف از راستای قائم`; never `میل` (orbital inclination) |
| straight down | درست رو به پایین | |
| altitude | ارتفاع | km above ground |
| elevation (in the sky) | زاویهٔ ارتفاع | always with `زاویهٔ`; bare `ارتفاع` is the altitude. `62° بالای افق` in prose |
| ground speed | سرعت زمینی | |
| heading | جهت حرکت | |
| ground track | مسیر زمینی | |
| closest approach | نزدیک‌ترین نقطه | readout `نزدیک‌ترین` |
| image | تصویر | the general word, honest for radar and mosaics |
| photo | عکس | only where the English contrasts a photograph with something else |
| made public | منتشر شد | |
| scene | صحنه | an archive's scene |
| archive | آرشیو | |
| frame (time-lapse, geostationary) | قاب | |
| clear look | نمای بی‌ابر | never `نمای صاف` (reads "flat view") |
| clear (a value, a status) | بی‌ابر | never `صاف` (flat, smooth): `بی‌ابر روی نقطهٔ شما` |
| detailed (the filter) | پرجزئیات | never `دقیق` ("accurate", which would call the rest inaccurate) |
| coarse (an image) | کم‌جزئیات | `درشت` is first "large" |
| closest look | نزدیک‌ترین نما | |
| last clear look | آخرین نمای بی‌ابر | |
| clearest look | بی‌ابرترین نما | |
| clouded over | پوشیده از ابر | chip `پوشیده از ابر · 92%` |
| cloud cover | پوشش ابر | |
| thin cirrus | سیروس نازک | |
| cloud shadow | سایهٔ ابر | |
| daily mosaic | موزاییک روزانه | true colour `رنگ طبیعی` |
| full disc | قرص کامل | |
| geostationary | زمین‌ایستا | never `زمین‌آهنگ` (geosynchronous) |
| weather satellite | ماهوارهٔ هواشناسی | |
| infrared | فروسرخ | chip stays `IR` |
| radar image | تصویر راداری | |
| orbital elements | عناصر مداری | |
| orbit catalog | کاتالوگ مداری | |
| object (catalog) | جسم | `16,893 جسم` |
| propagate orbits | محاسبهٔ مدارها | never `انتشار` (a calque) |
| pixel | پیکسل | `10 متر در هر پیکسل` |
| replay | بازپخش | |
| share | اشتراک‌گذاری | |
| link | پیوند | |
| time-lapse | گذر سال‌ها | the feature's name: "the passing of years"; `تایم‌لپس` is a loanword, `گذر زمان` is vaguer. As a title or a button it stands alone; inside a sentence it is quoted and carried by a verb (`برای این مکان «گذر سال‌ها» ساخته نمی‌شود`، `برای ساختن «گذر سال‌ها»`), or it reads as the everyday phrase (`برای این مکان گذر سال‌ها نیست`: "the years don't pass here") |
| timeline | خط زمانی | |
| plan view | نقشهٔ گذر | the pass's map; `نمای بالا` reads as "the view above". The trailing note under it: `نقشهٔ بالا مسیر گذر را نشان می‌دهد.` |
| spot (the searched place) | نقطه | "your spot" `نقطهٔ شما` |
| place | مکان | `این مکان`, `این‌جا` |
| pin | سنجاق | `گذاشتن سنجاق` |
| operator | اپراتور | the word Persian space news uses |
| track (satellites we track) | ردیابی می‌کنیم | never `دنبال کردن` of a person |
| fault (notice label) | خطا | terse, the word every Persian instrument and app uses; no exclamation mark. `اشکال`, unvowelled and alone, also reads `اَشکال` ("shapes") |
| share link / card | پیوند اشتراک‌گذاری / کارت اشتراک‌گذاری | `اشتراک` alone is a subscription or membership |
| encoder (video) | کدگذار | `رمزگذار` is an encryptor |
| typefaces (credit) | قلم‌ها | `حروف` is "letters" |
| screen | صفحهٔ نمایش | `صفحه` alone is a page |
| daylight | روشنایی روز | |
| sub-solar point | نقطهٔ زیرخورشیدی | |
| NASA (agency, in prose) | ناسا | `NASA GIBS` stays Latin |

### 4.2 Compass

| id | moving (`heading`) | from the place (`dir`) | in your sky (`toward`) |
|---|---|---|---|
| n | رو به شمال | شمال | در سمت شمال |
| ne | رو به شمال شرقی | شمال شرقی | در سمت شمال شرقی |
| e | رو به شرق | شرق | در سمت شرق |
| se | رو به جنوب شرقی | جنوب شرقی | در سمت جنوب شرقی |
| s | رو به جنوب | جنوب | در سمت جنوب |
| sw | رو به جنوب غربی | جنوب غربی | در سمت جنوب غربی |
| w | رو به غرب | غرب | در سمت غرب |
| nw | رو به شمال غربی | شمال غربی | در سمت شمال غربی |

`dir` is used as `در 61 کیلومتری غرب این مکان`. The 16-point readout abbreviations stay Latin (`SSW`), as coordinates
do: Persian has no established abbreviations, and single letters would be unreadable in a caps row. The scan
direction values are `شمال ← جنوب` / `جنوب ← شمال` (the arrow points along the reading).

### 4.3 Curated places (`places`)

Persian exonyms where Persian has one (`اهرام جیزه`، `ونیز`، `جبل‌الطارق`، `چشم صحرا` for the Richat Structure, the
name Persian readers met it by), otherwise the name as Persian writers spell it (`سنترال پارک`، `گرند کنیون`).
Country names are exactly `Intl.DisplayNames('fa')`'s long names (`ایالات متحده`، `امارات متحدهٔ عربی`،
`افریقای جنوبی`، `جمهوری آذربایجان`), Hong Kong its short one, so a curated row and a geocoder row (which takes the same
names) never spell a country two ways. That is the one place CLDR's spelling beats §6.1: `افریقای جنوبی` keeps CLDR's
`ا`, while our own prose writes the continent `آفریقا` (`صحرای بزرگ آفریقا`، `اروپا و آفریقا`); two countries are joined with `و` in Persian alphabetical order (`اردن و
اسرائیل`، `چین و نپال`، `برزیل و پاراگوئه`). Chips start with a Persian letter and stay under about 14 characters
(`منطقهٔ 51`، `سنترال پارک`، `جیزه`). `ایالت واشینگتن` keeps Mount St. Helens apart from the capital. The usage
stats, lookups and shares keep the English label, so nothing here splits a count.

## 5. Grammar strategies for runtime slots

### 5.1 [PLACE]

Persian nouns have no case and no gender, so an inserted name needs no inflection, ever. The frames:

- **Object:** the name, a space, `را`: `Waterloo را`، `تهران را`، `Bus stop, Ushuaia, Tierra del Fuego را`. `را` is
  always a separate word after a space (never attached, even after a Persian name).
- **After a preposition:** `از فراز [PLACE]`، `به [PLACE]`، `در [PLACE]`، `در دیدرس [PLACE]`. Prepositions are
  separate words; `به` is never attached (`بـ`).
- **After a noun (ezafe):** `تصویر [PLACE]`. The ezafe vowel is unwritten after a consonant. Never build an ezafe on
  the place itself (`[PLACE]ِ …`): the name ends the phrase.
- **As subject:** allowed (`[PLACE] درون نوار … بود`), but only where nothing could read as its object.
- **Never** a pronoun pointing back at the name (`آن` for the place) when another noun stands between: say `این مکان`
  or `این‌جا`, our own words.
- A name ending in a full stop (`Washington, D.C.`) gets no second full stop where it ends a sentence (`stop()`).

### 5.2 [SAT]

- `ماهوارهٔ [SAT]` wherever the name leads a sentence or a plain-text line: a Persian letter starts the line, and the
  head noun is how Persian introduces any named craft. A crewed station (display names `ISS…`, `Tiangong…`, recognised
  by name: no message carries a crewed flag) is `ایستگاه فضایی [SAT]`.
- A list of names takes the plural head once: `ماهواره‌های راداری Umbra-08 و Capella-14`.
- Inside mono labels and aria lists the bare name is fine (`Sentinel-2C، رصد کرد، …`).
- **Two Latin names never meet** with only spaces or neutrals between them: put a Persian word between
  (`ماهوارهٔ X از بالا [PLACE] را`، `[PLACE] را ماهوارهٔ X رصد کرد`). A satellite name and a number likewise
  (`در روشنایی روز 3 بار`). The Persian comma `،` is a neutral for the bidi algorithm (class CS), so `A، B` merges
  into one left-to-right run and a right-to-left reader meets B first; `؛` is a strong right-to-left letter (AL) and
  does keep them apart. In DOM text a list of Latin names isolates each one (`⟨LRI⟩Umbra-08⟨PDI⟩، ⟨LRI⟩Capella-14⟨PDI⟩`);
  where a Persian word can stand between them, it does (`تصویرهای GOES … و تصویرهای Himawari`).
- In DOM text the inserted satellite name is its own island (`ماهوارهٔ ⟨LRI⟩[SAT]⟨PDI⟩`): a name that ends in a
  bracket (`ISS (ZARYA)`, an older share's) would otherwise mirror it before Persian text. Plain text (the post, the
  card) carries no controls; the card's renderers isolate Latin names as they draw.
- A blurb or a note that leads with a satellite takes the head noun too (`ماهوارهٔ Sentinel-1 …`، `ماهواره‌های
  Sentinel-2 و Landsat …`); a constellation is plural (`ماهواره‌های Sentinel-2 … ثبت می‌کنند`).
- Nameless (`sat` undefined): subject `یک ماهواره`، after a preposition `یک ماهواره`، indefinite object
  `ماهواره‌ای`. The label `aSatellite` (`یک ماهواره`) is never inserted into a sentence.

### 5.3 Services, archives, agencies

`آرشیو Planetary Computer`، `سرویس Photon`، `ناسا`. An English agency or company name as a subject keeps its Latin
form and takes a plural verb only for a fleet (`ماهواره‌های Sentinel-2 … گذشتند`).

### 5.4 [NUM]: counts and the two CLDR categories

- After a number the noun is **singular**: `7 روز`، `256 ماهواره`، `31 گذر`، `1,715 تصویر`. Never `7 روزها`.
- The plural verb follows animate or agentive plural subjects (`256 ماهواره رصد کردند`); inanimate counted subjects
  take the singular (`31 تصویر منتشر شد`، `آرشیوها جستجو شد` in a status row).
- **`one` covers 0 and 1** in CLDR `fa` (`i = 0 or n = 1`): `fmt('fa').plural(0, …)` returns the `one` form. So a `one`
  branch never spells `یک`, and zero is handled before the plural. Every message that says "one" in words tests
  `n === 1`.
- In running sentences 1 is `یک` (`یک ماهواره`، `یک بار`، `یک تصویر`، `یک ماهوارهٔ دیگر`، `حدود یک کیلومتر`، `یک‌متری`),
  About and the satellites' blurbs included; in readouts, counters, stacked counts and chips the digit stays (`1 گذر`).
- One thing takes a singular after it: one missing image is `آن گذر … نشان داده می‌شود`, never `آن گذرها`.
- "N times": `3 بار` (1: `یک بار`). "every N minutes": `هر 10 دقیقه` (1: `هر دقیقه`).
- "N more": `40 ردیف دیگر`؛ "N left": `40 ردیف باقی مانده`؛ "3 needed": `3 نما لازم است`. The counter `تا` (`40 تا`)
  is spoken Persian: written copy repeats the counted noun.
- "All N": `همهٔ 1,565 ردیف`; `هر` before a number means "every" (`هر 10 دقیقه`) except with very small ones (`هر سه`).
- A year after `از` takes `سال`: `از سال 2015` ("since 2015"); a bare `از 2015` can read "out of 2015".

### 5.5 Lists

Persian joins the last two items with ` و ` and the others with `، `, with **no comma before `و`**: `Umbra-08،
Capella-14 و 7 ماهوارهٔ دیگر`. CLDR's `fa` list format puts a comma before `و` and a hidden RLM after the first comma
(`A،\u200f B، و C`): do not use `fmt('fa').list`; the catalogs build lists themselves (`list()` in `results.ts`).

### 5.6 Dates and times inside sentences

- A day before a clock: `روز یکشنبه 1 نوامبر ساعت 11:21` ("on Sunday 1 November at 11:21"). `روز` before a weekday
  date and `ساعت` before a clock are how Persian says "on" and "at".
- A time span in prose: `از 29 اکتبر تا 5 نوامبر`. In mono rows: `1 تا 8 نوامبر`, the month once when both ends share
  it. Intl does that only when the format has a year (`1 تا 8 نوامبر 2026`); for day and month alone CLDR `fa` has no
  interval pattern and `formatRange` writes `1 نوامبر تا 8 نوامبر`, so `time.ts dayRange` builds the shared-month form
  itself and takes Intl's range only across months (`29 اکتبر تا 8 نوامبر`).
- Ezafe before a year: Intl writes `ژانویهٔ 2027` itself; take its output as it comes.

### 5.7 Formatted slots

Clocks (`16:14:21`), zones (`EST`، `UTC+9`), coordinates, ISO stamps, the countdown `T−00:42`, NORAD ids and compass
letters arrive written. They are left-to-right islands in DOM text (§6.2) and are never re-punctuated.

## 6. Typography and formatting

### 6.1 Orthography

- **Letters.** `ی` (U+06CC) and `ک` (U+06A9) everywhere; Arabic `ي` (U+064A) and `ك` (U+0643) never. They look alike in
  some faces, but they are different characters: search, sorting and screen readers treat them differently, and the
  Arabic `ي` shows its dots in final position. Before review, every catalog is searched for U+064A and U+0643 and for
  the common patterns that need a half-space (`می ` + verb, `ها` joined without one, `ترین`); none may remain.
- **The half-space** (نیم‌فاصله, U+200C ZWNJ) where the Academy's rules require it, typed as the character:
  - verb prefixes: `می‌کند`، `نمی‌توانیم`، `می‌رفت`;
  - plural `ها` after a joining letter: `ماهواره‌ها`، `عکس‌ها`، `ایستگاه‌ها` (no ZWNJ after a non-joining letter:
    `تصویرها`، `گذرها`، `آرشیوها`);
  - `تر` / `ترین`: `نزدیک‌ترین`، `تازه‌ترین`، `سردتر` (none after non-joiners);
  - compounds and prefixed words: `اشتراک‌گذاری`، `بی‌ابر`، `سه‌بعدی`، `این‌جا`، `هیچ‌یک`، `به‌جای`، `به‌زحمت`،
    `منتشرشده`، `زمین‌ایستا`، `نام‌دار`، `جابه‌جا`؛
  - enclitics after silent `ه`: `کیلومتری‌اش`، `برنامه‌اش`.
  Exception kept on purpose: `جستجو` (Google's and every app's spelling) over the Academy's `جست‌وجو`.
- **Ezafe after silent ه** is written with the hamza above, `ـهٔ` (U+0654): `ماهوارهٔ`، `همهٔ`، `نقطهٔ`، `زاویهٔ`،
  `محاسبهٔ`، `ساختهٔ`. Never `ماهواره‌ی`, never nothing (`ماهواره Sentinel-2C` reads as two nouns).
- **Marks:** only the ezafe hamza, the tanwin of `احتمالاً`، `تقریباً`، `فعلاً`، `اصلاً`، `واقعاً`, and the damma of
  `بُرد` (range), where it prevents a misreading. No other vowel marks.
- **`آ`** is always written with its madda (`آسمان`، `آرشیو`، `آب‌های`).
- **Words, not stand-ins:** `«…»` for quotes, never `"…"`; `…` (U+2026), never three dots.

### 6.2 Direction

Persian letters have the bidi class AL, as Arabic's do, so every rule of the Arabic page applies:

1. **Digits after Persian letters become Arabic numbers** for the bidi algorithm: a `%` after them is drawn on the
   wrong side (`%25`), a clock's zone jumps in front (`EST 11:21`), a degree lands before the number. So, in DOM-only
   strings: `⟨LRI⟩11:21 EST⟨PDI⟩`، `⟨LRI⟩25%⟨PDI⟩`، `⟨LRI⟩42.3°⟨PDI⟩`، `⟨LRI⟩2026-11-08 03:34Z⟨PDI⟩`، coordinates in
   `⟨LRI⟩…⟨PDI⟩`. In rich parts the `num()` part is the island (`[data-num]` is isolated in right-to-left pages), so
   `num('25', '%')` and `num('16:14', 'EST')` need nothing more.
2. **Persian units are never inside `num()`.** `num(n, 'km')` puts the unit inside the left-to-right island; a Persian
   word there would read before its number. Write `[num('786'), '\u00a0کیلومتر']`.
3. **Text the visitor typed** is first-strong isolated: `«⟨FSI⟩[QUERY]⟨PDI⟩»`.
4. **A handle** (`@armaangupt0`) is isolated, or its `@` jumps to the far side.
5. **Plain text has no bidi controls**: card text, the post, page titles and descriptions, file names, the video, the
   tab title. Those strings start with a Persian letter (never a Latin name or a digit), so every renderer reads them
   right to left; the app's card renderers isolate clocks, percentages and Latin names as they draw
   (`src/ui/share/bidi.ts`, whose Arabic test includes every Persian letter).
6. **Time axes and sequences run left to right** (the timeline, the scrubber, the photo strip, the time-lapse), as on
   the Arabic page. `←` and `→` in tooltips name the physical keys and are never mirrored.
7. **Ranges** in prose use `تا` (`10 تا 30 متر`): a dash between two numbers after Persian letters is reordered.
   Arrows that mean "then" in mono rows point along the reading: `←` (`EST ← EDT`، the scan line `0412 ← 1024`), each
   end isolated.
8. **The place** is a slot like any other: in DOM sentences a label without Persian letters is isolated (`iso` in
   `results.ts`, `at` in `pass.ts`). A place searched by coordinates showed why: `در 7 روز گذشته، 23.5000°N 12.5000°E
   را` was drawn `N 12.5000°E°23.5000 را`. Plain text (post, card) keeps it bare, as rule 5 says.
9. **A Latin name followed by a number** joins it into one left-to-right run (`Copernicus: 13 باند` read
   `13 :Copernicus`): isolate the name, or put a Persian word between them, as `why.unpublished` does.

### 6.3 Digits: Western for now, Persian digits recommended

`LOCALE_INFO.fa.intl` is `fa-u-nu-latn`: `fmt('fa')` writes `1,715`, `7.46`, `25%`. That is consistent with the rest of
the product, with Arabic's choice, and with the one hard constraint: Martian Mono, the face of every readout, has no
Persian digits.

**It is not what a Persian product would do.** Persian typography writes Persian digits (۰۱۲۳۴۵۶۷۸۹) in every Persian
sentence: the Academy's rules, every newspaper, and every app a Persian reader uses (the Persian versions of Google,
Instagram and Telegram included) print `۱۲ دقیقه پیش`, `۲۵۶ ماهواره`, `۷٫۴۶`. Western digits are read without effort,
but in Persian prose they look like copy that was never finished. Technical notation (coordinates, NORAD ids, product
codes, ISO stamps) is often left Western in Persian technical writing, and that is acceptable.

The recommendation is Persian digits in every Persian sentence and label, Western digits in international notation.
What would have to change (none of it is a catalog's job):

1. `LOCALE_INFO.fa.intl` becomes `fa` (Intl: `۱٬۷۱۵`, `۷٫۴۶`, `۲۵٪`), and `fmt`'s `pct` must accept `٪`
   (`tightUnit` already does).
2. The mono stack needs digits: Noto Sans Arabic (already shipped, U+06F0–06F9, `٫` `٬` `٪` are in the subset) would
   draw them as a fallback, but proportionally; readouts that tick (`Count`, the countdown, the scan counter) need
   tabular figures, so either `font-variant-numeric: tabular-nums` must hold in that face (to be measured) or a
   digits-only subset in the mono stack, as `'Watched Arabic Space'` does for the space.
3. Everything the code writes as digits outside `fmt` (clocks from `fmtLocal`, `pad2` counters, `toFixed`, coordinates,
   the countdown, the time-lapse's big year, the canvas video, the card's satori and canvas renderers) would need one
   shared digit mapping, applied where those strings are shown in Persian, so a line never mixes ۱۱:۲۱ with 786.
4. Input: the place search must accept Persian and Arabic-Indic digits and `٫` in typed coordinates. Today
   `parseCoordinates` (`src/imagery/geocode.ts`) does not (NFKC leaves U+06F0–06F9 alone), so a Persian keyboard's
   `۴۳٫۴۷, -۸۰٫۵۴` is sent to the geocoders as a name. This should be fixed whatever the display digits are.

Until then: Western digits everywhere, from `fmt('fa')`, never hand-mixed.

### 6.4 Calendar and dates

**Gregorian, with Persian month names.** Intl's `fa` defaults to the Solar Hijri calendar (`یکشنبه 10 آبان`), which
is the calendar of daily life in Iran and the one an Iranian product would show. Watched keeps the Gregorian calendar
because everything it states is Gregorian and cannot be converted at the edge: the time-lapse's big year and its time
line are the frame's Gregorian year drawn by the component (`Timelapse.tsx yearOf`), the licence credit's years
(`Copernicus Sentinel data 2015–2026`), the archive's start (`since 2015`), the ISO stamps, the war-zone seasons
"inside the calendar year". A Jalali day under a Gregorian year (`25 مرداد 1403` under `2024`) would contradict
itself. Persian readers of world news read Gregorian dates in Persian every day (`1 نوامبر 2026`).

So every Intl date call in the catalogs passes `calendar: 'gregory'` (dates.ts passes options through). Months come
from CLDR as Intl writes them (`ژانویه، فوریه، مارس، آوریل، مه، ژوئن، ژوئیه، اوت، سپتامبر، اکتبر، نوامبر،
دسامبر`), weekdays likewise (`شنبه … جمعه`). Persian has no abbreviated months or weekdays: short and long are the
same word. The day in the compact timeline label is the number alone.

Moving to Jalali later would need the time-lapse's year to come from the catalog (a `year(ms)` message) and the
caption's `since` to be a date, not a number; every other date is already the catalog's.

Relative time is built by hand (§7 of `time.ts`): `همین حالا`, `12 دقیقه پیش`, `30 ساعت پیش`, `3 روز پیش`, the future
`3 ساعت دیگر` (Intl says `3 ساعت بعد`, which reads "3 hours after").

### 6.5 Punctuation and spaces

- `،` comma, `؛` semicolon, `؟` question mark, `«»` quotes, `.` full stop, `:` colon; no space before any of them, one
  space after.
- **No comma before `و` or `یا`** joining two clauses or two commands (`… نیستند و شرکت‌ها …`، `… مجاز کنید یا مکانی را
  جستجو کنید`): the comma is English's. Where a sentence needs a pause that long, make it two sentences.
- A colon ends a label before its value (`در میدان دید: 4 دقیقه و 12 ثانیه`، `آخرین: یکشنبه 1 نوامبر`); pairs of label
  and value are separated by `؛` (`رصد کرد: 12؛ احتمالاً رصد کرد: 3`), never by a comma or another colon.
- No exclamation mark. No em dash: the English avoids it too. A middle dot ` · ` separates fields in mono rows.
- A no-break space (`\u00a0`, written as the escape) ties a number to its unit or counted noun where a line could break
  (`7\u00a0روز`، `10\u00a0کیلومتر`).
- Parentheses mirror by themselves in right-to-left text: type `(` first.

### 6.6 Mono caps labels

Arabic script has no case: `text-transform: uppercase` leaves Persian as it is, and Latin parts in the same label
(`SENTINEL-2C`, `UTC`) are still uppercased. Labels are short nouns; the half-space matters even more at 9.5 px, where a
missing ZWNJ visibly joins two words.

### 6.7 Line breaking

Persian breaks at spaces; the half-space never breaks. Keep a number with its unit (no-break space), a day's number
with its month (`time.ts` glues Intl's `2 نوامبر`), and `را` with its object, where a break would strand one at the
start or end of a line. Two more, from the visual pass:

- **A compound verb stays whole** in display type: `رصد\u00a0کردند` in the results headline and on the card, so the
  card's block breaks `256 ماهواره | رصد کردند.`, never `256 ماهواره رصد | کردند.`.
- **A Latin name of several words stays whole** where it sits in Persian prose (About's credits and archives:
  `Copernicus\u00a0Data\u00a0Space\u00a0Ecosystem`). In a right-to-left line a name broken in two reads from the left end
  of one line to the right start of the next.

### 6.8 Type

The page is `data-script="arabic"`: Noto Sans Arabic (weights 400–700, widths 75–100) for display, body and labels,
Amiri for the accent, Arabic-script leading (×1.36) and no tracking, exactly as on the Arabic page. The committed
subsets cover U+0600–06FF, so every Persian letter (`پ چ ژ ک گ ی`), the hamza above (U+0654), the Persian digits and
`٫ ٬ ٪` are there, and the half-space (U+200C) is in their unicode-range (its glyph has no advance: `می‌کند` measures
exactly `می` + `کند`). Measured on the landing (§7): the two-line hero fits at the Arabic size; it would also fit at the
Latin size, which would restore the English block's height.

## 7. Length discipline

Persian in Arabic script is narrower than English for the same sentence (about 0.8–0.95× at the same size), but its
verbs are longer (`نمی‌توانیم بدانیم`) and units are words, so labels with units grow.

| Where | Budget | Persian |
|---|---|---|
| Hero lines | the English column | `چیزی این هفته` / `شما را رصد کرد.`: 388 and 385 px at the Arabic page's 69 px hero (English: 459 / 526 / 431 px at 91 px); 244 / 242 px of a 334 px phone column. The block is shorter than English's (173 against 252 px); at the Latin size (×1.32) both lines would still fit the English 528 px block |
| Locate button on phones | ~8 characters | `موقعیت من` |
| Chips | ~14 characters | `منطقهٔ 51`، `سنترال پارک`، `جیزه`، `غافلگیرم کن`، `نزدیک من` |
| Filter segments | ~8 characters | `همه` · `پرجزئیات` · `هواشناسی` · `رادار` |
| Lane words | ~8 characters | `تصویر` · `محتمل` · `ممکن` · `بالای سر` |
| Header button (Cancel/New search/Close share one box) | English length | `لغو` · `جستجوی تازه` · `بستن` |
| Share buttons on a phone | ~12 characters | `کپی پیوند` · `ارسال در X` · `ذخیرهٔ PNG` |
| Link/Post labels | 48 px | `پیوند` · `متن` |
| Plan corners | 15 / 20 characters | `نقشه · شمال بالا` · `چرخش ±30°` |
| Time-lapse video button (132 px, constant) | English length | `ویدیو` · `ساخت 06%` · `خطای ویدیو` · `ذخیرهٔ ویدیو` |
| Pin card | 156 px at 13 px | `یافتن نام این نقطه` · `مکان نام‌داری در این نزدیکی نیست` (wraps to two lines on the narrowest phones, as Arabic does) |
| Readout units | after a 21 px value | `کیلومتر` · `متر` · `کیلومتر بر ثانیه` (the geometry grid is two columns: it fits) |

Where a label overflows, choose a better word; never an abbreviation Persian readers do not use (`ک.م`، `ث`).

## 8. Sensitive content

1. **Surveillance words.** Iranian readers live with state monitoring of phones and social media; the words for it
   are loaded: `زیر نظر`، `تحت نظر`، `شنود`، `ردگیری` (of a person)، `جاسوسی`. The product's verb is `رصد`, which is
   observation; "satellites we track" is `ردیابی`, which is said of objects in orbit. `ماهواره‌های جاسوسی` appears once,
   in About, because the English names "spy satellites" there.
2. **War zones** (Gaza Strip, West Bank, Lebanon, Ukraine: the time-lapse's single-season regions, and places people
   search for). Never `پرواز` or `بر فراز … پرواز کرد` for a satellite (warplanes and drones), never `هدف`، `نشانه
   گرفتن`، `شناسایی` (reconnaissance), never `حمله`. A satellite `گذشت`.
3. **Names of countries** are CLDR's, never a government's preferred form: `اسرائیل` (never `رژیم صهیونیستی` or
   `فلسطین اشغالی`), and the Palestinian territories as Intl names them. CLDR's long name `سرزمین‌های فلسطینی` reads
   as officialese; Persian readers say `فلسطین` (CLDR's short name): see the report for the shared change.
4. **The Persian Gulf** is `خلیج فارس`, never `خلیج` alone and never any other name, if a sentence ever needs it. Dubai's
   places are `دبی، امارات متحدهٔ عربی`.
5. **No religious formulas**, no political word, no national sentiment (`ماهوارهٔ ملی`، `دشمن`).
6. **Afghanistan and Tajikistan.** Dari readers read Iranian standard Persian comfortably; CLDR `fa` writes Iranian
   month names (`ژانویه`) where Afghan Dari writes `جنوری`. The catalog is Iranian Persian on purpose (one standard,
   the one the Persian web mostly uses); `fa-AF` is not a locale here and maps to `fa`.
7. **Privacy text** (About §04) says exactly what the English says: no more, no less, and its scope is unmistakable:
   "never your exact spot" has its own `بر اساس` (`هرگز بر اساس نقطهٔ دقیق شما`), or it reads as the object of the
   next verb ("we keep your exact spot"). A grid cell is `ناحیه`, never `خانه` (first read "a house"). `هیچ نشانی
   IP` means "no IP addresses", `هیچ کوکی‌ای از خودمان` "no cookies of our own".
8. **Azerbaijan.** The country is `جمهوری آذربایجان` (CLDR's name) in every sentence: a bare `آذربایجان` is also Iran's
   own Azerbaijan provinces, and the distinction is political.
9. **Crimea and Ukraine.** Crimea is `کریمه`, filed under `اوکراین` with no qualifier (the geocoder files Crimea under
   Ukraine in every language, `inCrimea` in `src/imagery/geocode.ts`); never `کریمه (روسیه)`. Ukrainian places in our copy take their established
   Persian names (`کی‌یف`، `چرنوبیل`) and, where Persian has a choice, the Ukrainian-based form (`خارکیف`، `لویو`), never a
   Russian-only one (`خارکوف`، `لووف`).

## 9. Pitfalls and the reviewer's checklist

### 9.1 False friends and traps

| Trap | Why | Write |
|---|---|---|
| `دید` as a label | also the noun "sight, view" | `رصد کرد` |
| `ارتفاع` for elevation | it is the altitude | `زاویهٔ ارتفاع` |
| `میل` for off-nadir | orbital inclination | `انحراف` |
| `برد` without its mark | reads `بُرد` / `بَرد` (won) | `بُرد` |
| `نمای صاف` | "flat view" | `نمای بی‌ابر` |
| `آخرین` | fine for "latest"; only `آخرین نگاه` has a farewell ring; before a day it reads "the last Sunday" | `آخرین نمای بی‌ابر`، the label `آخرین: ` |
| `ثابت` for "steady" light | "stationary" | `چشمک نمی‌زند` |
| `روز گذشته` | "yesterday" | `24 ساعت گذشته` for a one-day window |
| `fmt('fa').plural(0, …)` | returns `one` | test `n === 1` before writing `یک` |
| `fmt('fa').list` | comma before `و`, hidden RLM | the catalog's own `list()` |
| `formatDate('fa', …)` without `calendar` | Solar Hijri | always `calendar: 'gregory'` |
| `num(n, 'کیلومتر')` | the unit reads before the number | `[num(n), '\u00a0کیلومتر']` |
| Arabic `ي`، `ك` | wrong characters | `ی`، `ک` |
| a missing half-space | `میکند`، `ماهوارهها` | `می‌کند`، `ماهواره‌ها` |
| `ماهواره‌ی` / bare `ماهواره X` | wrong or missing ezafe | `ماهوارهٔ X` |
| `توسط` | a calque passive | an active sentence |
| `اشکال` as a lone label | also `اَشکال`, "shapes" | `خطا` |
| `پوشاندن` for coverage | to cover over, hide | `پوشش دادن` |
| `تصویر کردن` | to depict | `تصویر گرفتن` |
| `نقشه کردن` | no verb; `نقشه کشیدن` is "to scheme" | `نقشه تهیه کردن` |
| `قدمت` for days | antiquity | `عمر عناصر مداری 5 روز است` |
| `می‌ایستد` (geostationary) | stands up, stops | `قرار دارد` |
| `دست‌کاری` | tampering, a doctored photo | `اصلاح‌های جزئی` |
| `اشتراک` alone | subscription, membership | `اشتراک‌گذاری` |
| `دقیق` for "detailed" | accurate | `پرجزئیات` |
| `صاف` for "clear" | flat, smooth | `بی‌ابر` |
| `دوربین چرخان` | spinning; Iran's CCTV camera | `دوربین قابل‌چرخش` |
| `رمزگذار` | encryptor | `کدگذار` |
| `40 تا` | spoken counter | `40 ردیف` |
| `هر 1,565 ردیف` | "every 1,565 rows" | `همهٔ 1,565 ردیف` |
| `فعلاً … ممکن نشد` | "for now" with a past verb | `فعلاً … ممکن نیست` |
| `از دیدرس … گذشت` | "out of sight" | `در دیدرس … گذشت`، `این‌جا در دیدرسش بود` |
| `در بُرد این‌جا` | the place's range | `این‌جا در بُرد … بود` |
| `795 کیلومتری Waterloo` | "795 km from Waterloo" | `Waterloo را از ارتفاع 795 کیلومتری` |
| `زنده است؟` | "is it alive?" | `لحظه‌ای است؟` |
| `خانه` for a grid cell | a house | `ناحیه` |
| `مال`، `چند تایشان`، `نیامد` | spoken Persian | `متعلق به`، `برخی از آن‌ها`، `دریافت نشد` |
| `تقریباً به‌یقین` | a calque of "almost certainly" | `به احتمال قریب به یقین` |
| `از هندسهٔ مداری نشان داده می‌شوند` | "shown from" | `بر پایهٔ هندسهٔ مداری` |
| `دیر پاسخ دادند` for "too slow to answer" | they did answer, late | `به‌موقع پاسخ ندادند` |
| a phrase after the verb (`…گذشت، در تاریکی.`) | English word order | before the verb, or a clause with its own verb |
| `، و` / `، یا` between clauses | English's comma | no comma |
| kasra of the ezafe (`پیکسلِ`) | §6.1 allows no such mark | `پیکسل` |

### 9.2 Checklist (every string)

1. Is it what the English means, and what the screen shows (honest labelling)?
2. `شما` and polite imperatives; no `تو`, no `لطفاً`, no exclamation.
3. The product verb is `رصد`; a pass is `گذر` and `گذشت`; the verdict words are §3.6's.
4. Singular noun after every number; `یک` only for `n === 1`; zero handled before the plural.
5. Every Latin name and every number has a Persian word between it and the next Latin name or number (`،` is not
   one: isolate the names in DOM text).
6. Clocks, percentages, degrees, stamps, coordinates isolated in DOM text; plain text has no controls and starts with
   a Persian letter.
7. Units are words, outside `num()`, tied with a no-break space.
8. `ی`، `ک`، the half-space, `ـهٔ`; `«»`، `،`، `؟`.
9. Dates Gregorian (`calendar: 'gregory'`), from Intl, never a table.
10. It fits (§7), read at 390 px and 1280 px.
11. The sentence ends on its verb; no comma before `و` or `یا`; no spoken forms (`تا`، `مال`، `ـش را بدهد`).
12. Every word means what the English means in this product (§9.1): coverage, imaging, mapping, sharing, a screen.

### 9.3 Test values

Places: `Waterloo`، `تهران`، `Bus stop, Ushuaia, Tierra del Fuego`، `Washington, D.C.`، `東京`. Satellites:
`Sentinel-2C`، `ISS (ZARYA)`، `NORAD 60989`، none. Counts: 0, 1, 2, 5, 21, 1,715.

## Decisions log

1. **Register `شما`** over `تو` (§1). The intimate form is a relationship; the product's voice is an instrument's.
2. **Product verb `رصد کردن`** over `دیدن` (a noun as well as a verb, too weak for the verdict), `تماشا کردن` (a
   spectator's watching), `زیر نظر داشتن` (surveillance over time, dishonest for a pass) and `پاییدن` (literary).
3. **Hero in two lines** (§3.1): Persian's five words split evenly in two; any three-line split strands one word.
4. **Headline with the fronted object** (§3.3): ends on the count and the verb, the part English bolds; the zero case
   keeps subject–object–verb for its negative subject.
5. **`یک` in sentences, digits in readouts**; `one` covers 0 in CLDR `fa`, so `یک` is tied to `n === 1`.
6. **Units as words** (`کیلومتر`، `متر`): Persian has no established symbols; Latin `km` in a Persian line reads as an
   untranslated string.
7. **Gregorian calendar** with CLDR months (§6.4), because the time-lapse's years and the licence lines are Gregorian.
8. **Western digits for now** (§6.3), with the recommendation and the list of changes for Persian digits.
9. **Pass = `گذر`**, verb `گذشت`; `پرواز` banned (§8.2). Time-lapse = `گذر سال‌ها`: the shared root is apt (both
   are passing), and as a title or a button nobody reads it as a pass. Inside a sentence it is quoted and carried by a
   verb (`ساختن «گذر سال‌ها»`), or it reads as the everyday phrase (§4.1; review B).
10. **Half-space typed as the character**, not as `‌`: it is a letter-level part of Persian spelling, and a
    reviewer reads the word, not an escape. No-break spaces and bidi controls stay escaped, as in every catalog.
11. **Lists built by hand** (§5.5): CLDR's `fa` list pattern is not Persian punctuation.
12. **`اشتراک‌گذاری`** for "share" (every Persian app's word) over the Academy's `هم‌رسانی`; **`پیوند`** for "link"
    (the label column has five characters; `لینک` is the spoken word, `پیوند` the written one).
13. **`ناسا` in prose**, Latin in names that contain it (`NASA GIBS`), as Persian news writes it.
14. **Fault label `خطا`** over `اشکال` (review A and B, and the translator's own doubt): terse, every Persian
    product's word, and unambiguous alone.
15. **Verb-final pass sentences** (§3.4; review A): what English adds after a comma goes before the verb or gets a
    verb of its own.
16. **`در دیدرس`** for "within view" (§3.4, §4.1; review A): the set phrase, with the view owned by the one who sees.
17. **`قابل‌چرخش`** for "steerable" (§3.6; review A): `چرخان` is spinning, and the CCTV camera's name in Iran.

## Review

Two independent reviews (A: a native reader; B: accuracy) read every catalog against the English and this guide,
2026-11-21. Both agreed on شما, the Gregorian calendar, the two-line hero and the «از طریق» credit, which stand. Digits
stay Western until the product changes (§6.3).

### Changed

- **Meaning errors.** `why.unpublished` printed «Landsat 3 بار» (the satellite Landsat 3): `در روشنایی روز` now stands
  between the name and the count. The post's «از ارتفاع 795 کیلومتری Waterloo» read "795 km from Waterloo": the place
  now comes before the altitude. Privacy's «هرگز نقطهٔ دقیق شما را» read as the object of «نگه می‌داریم»: it has its own
  «بر اساس» and the tally is its own sentence. «دست‌کاری‌ها» (tampering) headed the paragraph that says nothing is added
  or removed: `اصلاح‌های جزئی`. `archiveSlow` said the archives answered late: `به‌موقع پاسخ ندادند`. `sentinel2Down`
  said images may be few: `نشان داده نشوند`.
- **Wrong words.** `تصویر کردن` → `تصویر گرفتن`; `نقشه کردن` → `نقشه تهیه کردن`; `پوشاندن` → `پوشش دادن` for coverage
  (verdict, post, three blurbs); `قدمت` → `عمر`; `جابه‌جا باشد` → `خطا داشته باشد`; `می‌ایستد` → `قرار دارد`;
  `رمزگذار` → `کدگذار`; `فهرست‌گیری` → `فهرست‌برداری`; `دقیق` → `پرجزئیات` for "detailed"; `صاف` → `بی‌ابر` (three
  values, against the guide's own rule); `درشت` → `کم‌جزئیات`; `حروف` → `قلم‌ها`; `ساختهٔ` (a label) → `سازنده`;
  `زنده است؟` → `لحظه‌ای است؟`; `خانه` (a grid cell) → `ناحیه`; `اشتراک` → `اشتراک‌گذاری` (a subscription);
  `صفحه` → `صفحهٔ نمایش`; `دوربین چرخان` → `قابل‌چرخش` and `کج شدن` → `بچرخانند`; the fault label `اشکال` → `خطا`;
  `آذربایجان` → `جمهوری آذربایجان`; `تقریباً به‌یقین` → `به احتمال قریب به یقین`.
- **Grammar.** Tenses in `passView.empty` (`افتاده باشد`) and `darkStation` (`بوده باشد … گذشته است`); the subject of
  the singular `دید` in `likely.dark`; `آن` → `آن‌ها` for plural numbers; one missing image takes `آن گذر`; `یک` for
  one in `why.radar`, privacy and two blurbs; the spot's pixel in the past tense; `فعلاً … ممکن نیست`; `هیچ تصویر
  عمومی‌ای` for "no public image"; `همهٔ N` for "all N".
- **Word order and calques.** Phrases after the verb moved before it or got a verb (§3.4: `withinView`, `overhead`,
  `radarImaged`, `loaded`); `از … گذشت` for an offset; `در دیدرس` for "within view" (pass, card, post, verdict verb);
  the radar sentence with the place as subject, so the range is the satellites' (`در مجموع`, not `روی هم`); `بر پایهٔ
  هندسهٔ مداری`; `جستجو کنید` for "enter any place"; SGP4 as a calculation; `هر سال می‌کوشد` → `انتخاب می‌شود`;
  `تصویرهای این‌جا` → `این سایت`; `خلاصهٔ این هفته` as the thing shared; the zero card headline in the app's order.
- **Register.** `مال`، `چند تایشان`، `تا` as a counter (`40 ردیف`، `3 نما`)، `نیامد`، `موقعیتش را بدهد`، `آدم‌ها`،
  `خودش`; no comma before `و` or `یا` (thirteen strings); three kasras removed.
- **Bidi.** Satellite names isolated in DOM text (a trailing bracket mirrored); Latin names with only `،` between them
  isolated or separated by a Persian word or `؛` (`why.radar`, About's archives, privacy, credits, the filter's
  tooltips); the credit's no-break space.
- **Labels.** `آخرین: ` / `نزدیک‌ترین: ` with a colon; `در میدان دید: `; `؛` between the timeline's pairs; `از سال
  2015`; `در این دسته`; the pin hint names the pin; the head noun before a satellite that leads a sentence.
- **The guide.** The time-lapse rule in sentences (§4.1), the date-range fact (§5.6: CLDR repeats the month without
  a year, so `time.ts` writes it once), punctuation (§6.5), Azerbaijan, Crimea and Ukrainian names (§8.8, §8.9), the
  CLDR exception for `افریقای جنوبی` (§4.3), the traps (§9.1), decisions 14–17.

### Visual pass, 2026-11-22

Every screen measured at 360, 390 and 430 px portrait, 844×390 and 1280×800 (`getBoundingClientRect`, `scrollWidth`,
and the x position of each glyph for bidi order), beside English and Arabic.

- **`sats.blurb.sentinel2`**: `Copernicus` isolated and `13` tied to `باند`. The line read «تصویربردار چندطیفی 13
  :Copernicus باند» (§6.2.9).
- **The headline's place** (`results.headline.watched` and `none`, `notes.passTimes`, `watchedBy` for the shared
  caption and label) and **the pass sentences' place** (`pass.ts`, eight slots): isolated unless Persian (§6.2.8).
- **`رصد کردند` held together** in the results headline and the card headline (§6.7). The card's last block wrapped
  `256 ماهواره رصد | کردند.` at 72 px; it now breaks before the verb (measured at 256 and 263 satellites, in the preview and on phone landscape).
- **About's credits and archives sentence**: multi-word Latin names tied with no-break spaces (§6.7). At 390 px
  `Element 84 Earth | Search` and `Copernicus Data | Space Ecosystem` were split across lines.
- **Kept, measured**: the replay legend's `در میدان دید: 7 دقیقه و 15 ثانیه` overflows 30 px at 390 and 60 px at 360
  (English overflows too: the shared layout is being fixed). `در دیدرس` would save 13 px and still overflow, so the
  reviewed label stays. The percent in `cloudCover` and the clocks were checked glyph by glyph and are in order.

### Rejected, and why

- **Renaming the time-lapse** (A: `سال‌به‌سال` or `تایم‌لپس`). As a title or a button `گذر سال‌ها` reads at once as the
  idiom; no one reads "passes of years". The real fault was in sentences, which B's rule fixes (quoted, with a verb).
  The viewer's label no longer says the years twice.
- **`اخیر` → `جستجوهای اخیر`** (B). `اخیر` alone is the established header for recent searches in the Persian apps
  readers use, and it sits before the chips that show what it is.
- **`تصویر در برنامه باز می‌شود`** (B, from this guide). `برنامه` is also "schedule", the catalogs' own word for an
  acquisition plan; `تصویر در Watched باز می‌شود` names the app. The guide was wrong and now says so.
- **`آفریقای جنوبی`** (B, one option). Country names stay CLDR's so a curated row and a geocoder row agree.
- **`در حال ساختن پیوند…`** (A). Not every busy label is `در حال …`: `آماده‌سازی تصویر…` and `مکان‌یابی…` are verbal
  nouns with an ellipsis, as `ساختن پیوند…` is.
- **`این تصویر واقعی است`** in the post (A). `این همان تصویر واقعی است` is "this is the actual picture", the emphasis
  the English has; `این تصویر واقعی است` also reads "this picture is real". The guide now matches the catalog.
- **`با تصویربرداری فروسرخ`** (A). `با فروسرخ` matches `با رادار` throughout and is not clipped in Persian.
- **A comma after `ردیابی می‌کنیم`** in `passView.empty` (A) and **`از فراز آن`** for `از فرازش` (A): taste; no verbs
  meet there and the enclitic is standard written Persian.
- **`دست‌کم 3 نما`** (A). The English says "3 needed", not "at least 3".
- **Where the two disagreed:** the footnotes quote the verdict's title, `در دستهٔ «احتمالاً رصد کرد»` (B), not the lane
  word (A), since the pass list's groups carry the title; `ماهوارهٔ X در این گذر هیچ تصویری … ندارد` (B), since A's
  `تصویری از ماهوارهٔ X` keeps the "picture of the satellite" reading; `نقطهٔ شما بی‌ابر بود` (B), since A's `صاف` is
  banned; `خلاصهٔ این هفته` (B), the product's own word for that line, over `گزارش` (A); `عمر عناصر مداری 5 روز است`
  over both (`از عمر … گذشته است` is wordy, `5 روز کهنه‌اند` is not how Persian gives an age); `اصلاح‌های جزئی` over
  `اصلاح‌ها` (A, which can sound like editing) and `تنظیم‌های تصویر` (B, which reads as "image settings"); `3 نما`
  over `3 قاب` (the caption counts looks); `و این را هم می‌گوییم` (A) over `به شما خواهیم گفت` (B): the condition
  already makes it future.
