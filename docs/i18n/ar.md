# Watched: Arabic (ar) localisation style guide

Final, 2026-11-19. This guide supersedes `ar.draft.md`. Every decision in it is final. The "Decisions log" at the end
resolves each item of the native review (`ar.critique.md`). The guide binds every `ar` string the product shows, speaks
or sends: the app, share cards and share pages, post text, alt text, aria labels, the time-lapse video, About and the
loading screen.

One Arabic catalog, in Modern Standard Arabic, serves Saudi Arabia, the Gulf, Egypt and Jordan. If a translator's habit
disagrees with this guide, the guide wins. If the guide and the English disagree on a fact, the English wins and the
guide is wrong: report it.

The English source of truth is the set of English namespaces in `src/i18n/en/*.ts` (in particular `results.ts`,
`pass.ts`, `verdicts.ts`, `landing.ts`, `share.ts`), the share card catalog `api/_lib/i18n/card/en.ts`,
`src/i18n/bootText.ts`, and `docs/DESIGN.md` §7 for the voice and the verdict vocabulary.

**About the examples.** Arabic examples are typed in logical order, which is the order you type and the order the code
stores. In a left-to-right editor, a line that mixes Arabic with Latin names or digits can look scrambled (`Waterloo`
may show up on the "wrong" side of a word). That is a display effect, not the content. Check a string in a browser under
`dir="rtl"` before you decide it is out of order, and never reorder words to make an LTR editor look right.

**Notation.** In frames and code blocks, `*…*` marks the one serif accent (signal orange) and `**…**` the strong part
(bold, or a part that some layouts hide, as each message's comment says). `⟨LRI⟩`, `⟨FSI⟩` and `⟨PDI⟩` stand for the
invisible characters U+2066, U+2068 and U+2069: type the characters, not the brackets. Runtime slots are written `[PLACE]`, `[SAT]`,
`[NUM]`, `[TIME]` (a 24 h clock with its zone) and `[DAY]` (a day written by the `time` namespace).

## 0. Decisions at a glance

| Question | Decision |
|---|---|
| Register | Modern Standard Arabic (فصحى معاصرة), light news-and-science register. No dialect, no classical pastiche, no newsroom stock phrases. |
| Address | Singular "you", only in forms spelled the same for a man and a woman: the attached suffix ـك (`رصدك`، `فوقك`، `سماءك`، `مكانك`) and the detached `أنت`, both **never vocalised**. `أنت` may also be the subject of a verbless clause with a prepositional predicate (`فأنت في كل إطار`). Never a second-person verb, an imperative to the reader, or an adjective or participle that describes the reader. |
| Instructions | `يمكنك` + masdar: `يمكنك البحث عن مكان بدلًا من ذلك.` |
| Product verb ("watched") | `رصد / يرصد` (masdar `رصد`). Never `صوّر` (photographed), `راقب / مراقبة` (surveillance), `تجسّس`، `تعقّب`، `ترصّد`، `شاهد`. |
| Hero | `ثمّة شيء` / `رصدك *أنت*` / `هذا الأسبوع.` |
| Satellite as subject | A head noun always carries the gender. Known satellite: `القمر الصناعي [SAT]` (m). Crewed station (ISS, Tiangong): `المحطة الفضائية [SAT]` (f). Unknown satellite: indefinite `قمر صناعي`, after the verb. Verb first (VSO), except when the place would be the verb's object right after the satellite's name: then the sentence is nominal (`القمر الصناعي Sentinel-2C رصد *Waterloo*.`), so two Latin names never touch. |
| Place name | Never in the slot where a reader expects the verb's subject. Never referred to by a pronoun. Never takes an attached preposition (لـ، بـ، كـ، و، فـ), an added article, or an adjective. |
| Counts | All six CLDR categories (zero, one, two, few, many, other). In sentences, 1 and 2 are words (`صورة واحدة`، `صورتان`). In readouts the digit stays and the unit agrees with it. |
| "Pass" | `مرور` (m), counted with `مرة` (`3 مرات`، `31 مرة`). The plural label is `مرات المرور`. Never `تمريرة`, never `تحليق`. |
| Verdicts | `رصد` · `رصد على الأرجح` · `كان بإمكانه النظر إلى هنا` · `مرّ فوقك`. Lanes: `صورة` · `مرجّح` · `ممكن` · `فوقك`. |
| Buttons | Masdar: `مشاركة`، `نسخ الرابط`، `تنزيل الصورة`، `إعادة المحاولة`. The only exceptions are the reader's own first-person commands to the product: `فاجئني`، `حدّد موقعي`. |
| Digits | Western 0–9 everywhere, `.` for decimals, `,` for grouping, from `fmt('ar')` (tag `ar-u-nu-latn`). Never ٠١٢٣, never ٫ ٬ ٪. Negative numbers carry U+2212 (`−12.4°`). |
| Units | `كم`، `م`، `كم/ث`، `ث`، `د`، `س` in readouts. Running prose spells metres with agreement (`10 أمتار`، `30 مترًا`). `°` and `%` attach to the number: `5.4°`، `25%`. |
| Direction | The page is `dir="rtl"`. Every number, clock and Latin name is its own left-to-right island. Ranges and sequences use `←`, never `→`. Two Latin slots never sit next to each other with only neutral characters between them (§6.2). Plain text never starts with a Latin name or a digit. |
| Bidi controls | LRI…PDI (U+2066…U+2069) and FSI…PDI (U+2068…U+2069) are allowed in DOM-only strings, and only around the one run that needs them. They are never used in post text, card text, page titles and descriptions, file names or the video. |
| Compass | Prose uses whole phrases (`نحو الجنوب`، `على بعد 61 كم إلى الغرب`، `باتجاه الشمال الغربي`). The 16-point readout abbreviations (`pass.compass16`) stay in Latin letters (`SSW`), and so do coordinates (`16.2°S 063.0°E`) and a geostationary seat (`0.2°W`). |
| Off-nadir | `الانحراف` (label), `بانحراف 5.4° عن العمودي` (prose). Never `الميل`, which reads as orbital inclination. |
| Dates | Gregorian, with the CLDR `ar` months (`يناير … ديسمبر`) taken from Intl as they come: `الأحد، 1 نوفمبر`. Never Hijri dates, never كانون or تشرين. |
| Time | 24-hour clock with colons (`16:14:21 UTC`). Never ص / م. |
| Punctuation | Arabic comma `،`, semicolon `؛`, question mark `؟`, guillemets `« »`. No em dash, no exclamation mark, no tatweel. |
| Marks (تشكيل) | Shadda, the standard tanween spellings (`ـًا`، `جارٍ`، `صافٍ`) and a damma on passives and on `يُجري`. Nothing else. Never any mark on ـك or `أنت`. |
| Type | Noto Sans Arabic (trimmed: weights 400–700, widths 75–100, 62 kB) for display, body and labels, and Amiri Regular (75 kB) for the one accent. Both are already committed and load only on pages that show Arabic. Leading ×1.36, tracking 0 everywhere. |
| Sequences and time axes | All of them run left to right on the Arabic page: the photo strip, the filmstrip, the pass ‹ ›, the timeline, the replay scrubber and the time-lapse slider. Arrow keys keep their physical meaning, and the tooltips name them as bound (`السابق (←)`). |
| Never translated | Watched., www.watched.earth, satellite, sensor and product names, NORAD ids, UTC and zone abbreviations, coordinates, licence attribution lines, file-name words. `NASA` becomes `ناسا` only when it names the agency in prose. Names that contain it (`NASA GIBS`, `NASA Worldview`) stay Latin as units. Every other agency stays in Latin letters. |

## 1. Register and address

### 1.1 The decision, surface by surface

| Surface | Form | Example | Why |
|---|---|---|---|
| Display headlines (hero, results headline, About title, share card) | MSA and declarative, either verb-first or nominal. "You" appears only as unvocalised ـك or `أنت`. No imperatives, no questions. | `ثمّة شيء رصدك أنت هذا الأسبوع.` · `خلال آخر 7 أيام، رصد 256 قمرًا صناعيًا Waterloo.` | The accent needs a free-standing "you", and `أنت` reads the same for every reader. Verb-first keeps the satellite's gender out of the verb and puts Arabic at the start of every line. |
| Sentences (results, the pass paragraph, footnotes) | MSA, verb-first. The product's "we" is a first-person plural verb (`نتتبّع`، `نعرض`، `نحتفظ`), and limits keep the "we": `لا يمكننا أن نعرف`. | `مرّ القمر الصناعي Sentinel-2C فوق المكان مباشرةً على ارتفاع 786 كم.` | First-person plural verbs carry no gender, and "we" makes responsibility explicit, as the English does. |
| UI labels and buttons | Masdar or noun. A first-person command from the reader to the product is allowed. | `مشاركة` · `نسخ الرابط` · `إعادة المحاولة` · `إلغاء` · `فاجئني` · `حدّد موقعي` | An imperative to the reader is gendered (`ابحثْ / ابحثي`). The masdar is the neutral form Arabic interfaces already use. In `فاجئني` the speaker is the reader and the addressee is the product. |
| Mono caps labels | Short nouns with the article: `الارتفاع`، `الانحراف`، `البكسل`، `الشمس`. Section rules keep their index: `01 / القياسات`. | `الارتفاع 786 كم` · `02 / مرات المرور` | Without the article an Arabic field label reads as a cut-off headline. With it, it reads as the name of a quantity. |
| Error notices | First what failed, said impersonally (`تعذّر …`، `لم يستجب …`), then the one recovery step as `يمكنك` + masdar. | `تعذّر تحميل كتالوج المدارات. يمكنك التحقق من اتصالك ثم المحاولة مجددًا.` | This states the fault without blaming the visitor and addresses one reader without a gendered imperative. |
| About page | Plain, conversational MSA that stays declarative. The visitor's own questions are first person singular. | `هل يمكن لقمر صناعي أن يراني؟ لا. أدق بكسل هنا عرضه 10 أمتار.` | First-person verbs (`يراني`) carry no gender, and naming the subject (`لقمر صناعي`) gives the pronoun an antecedent. |

### 1.2 The gender rule (the most important rule in this guide)

Arabic marks the gender of "you" on verbs, imperatives, adjectives and vowel marks. The code cannot know the reader's
gender, and every reader must feel the text was written for them. The strategy is to **use only the forms of "you" that
are spelled the same for a man and a woman, and never to vocalise them.**

Allowed:
- The attached object or possessive suffix ـك, unvocalised: `رصدك`، `فوقك`، `سماءك`، `أفقك`، `بقعتك`، `مكانك`، `لك`،
  `نريك`. A man reads `رصدكَ` and a woman reads `رصدكِ`, and both are correct.
- The detached pronoun `أنت`, unvocalised. It may emphasise ـك (the hero and the share hook). It may also be the subject
  of a verbless clause whose predicate is a prepositional phrase: `إن كان مكانك في جهتها من الأرض، فأنت في كل إطار.`
- `يمكنك` + masdar for instructions and options.
- First person singular for the reader's own voice: `موقعي`، `بالقرب مني`، `هل يمكن لقمر صناعي أن يراني؟`
- First person plural for the product: `نتتبّع`، `لا نحتفظ`، `نعرض`.
- Impersonal and passive frames: `يُرسل موقعك إلى …`، `تعذّر …`، `لا سبيل إلى معرفة …`، `يُنشأ عند المشاركة`.

Banned, because each is gendered or ambiguous:
- Verbs with "you" as their subject. In the past tense `كنت` also reads as "I was". In the present, `ترى / ترين`،
  `تختار / تختارين`، `تراها`. Rewrite with ـك as object or possessive ("If you were in reach" →
  `إن كان مكانك في متناولها`), or with a passive or masdar ("the pass you picked" → `المرور المختار`).
- Imperatives to the reader: `ابحث`، `أدخل`، `شاهد`، `اختر`، `جرّب`، `حاول`، `تحقّق`، `اضغط`، `اسحب`، `انقر`.
- Adjectives and participles about the reader, including as the predicate of `أنت`: `أنت مرصود`، `متصل`، `جاهز`.
- Any vowel mark on ـك or `أنت` (`رصدكَ`، `أنتِ`), slash forms (`ابحث/ي`), parenthesised endings.
- Plural address (`أنتم / ـكم`) and its imperatives.

Spelling trap with ـك: the hamza seat of the noun before it follows the case. `غطّت السحب سماءك` (accusative), `في
سمائك` (genitive), `سماؤك صافية` (nominative). Write the form the sentence needs.

### 1.3 Rejected alternatives

- **Masculine as generic** (`أنتَ`، `ابحثْ`، `شاهدْ`). Many Arabic interfaces default to it. It loses here because the
  hero speaks to one person about something that happened to them, and telling half the readers "you (man)" breaks the
  human moment. The neutral forms cost nothing.
- **Plural address** (`أنتم`، `ابحثوا`). This is the tone of government portals and banks: cold and bureaucratic. It
  turns "something watched *you*" into "something watched you all", and it is masculine plural too.
- **Slash and double forms** (`رصدكَ/كِ`، `ابحث/ي`). Unreadable at display sizes and on a share card.
- **Dialect** (Egyptian `حاجة شافتك`, Gulf `شي رصدك`). It splits the audience. MSA is the only register read naturally
  from Riyadh to Cairo to Amman.
- **Elevated classical** (`إيّاك رصد`, full vocalisation, Quranic cadence). It reads as religious or archaic, and full
  vocalisation forces a gender.

## 2. Voice

### 2.1 How "declarative, specific, quietly uncanny, second person" sounds in Arabic

- **Declarative:** the past tense, stated flat (`رصد`، `مرّ`، `نُشرت`). Use `ربما` only where the English says "may".
  Use hedges (`يبدو أن`، `من المحتمل أن`) only where the English hedges.
- **Specific:** the number and the name carry the sentence (`على ارتفاع 786 كم`، `عند 16:14:21 UTC`، `بسرعة 7.46 كم/ث`).
  Never round a number, and never replace one with `عدد كبير`.
- **Quietly uncanny:** the weight falls on the reader at the end of a clause, through ـك: `رصدك`، `مرّ فوقك`، `رأى
  جهازه سحبك، لا شوارعك`. The calm is the point. Add no intensifier (`جدًا`، `حقًا`، `فعلًا`، `تمامًا`) unless the English
  has one, no exclamation mark, and no drama word.
- **Second person:** "you" appears where the English has it. The one standing exception is the overhead verdict
  (`مرّ فوقك`, lane `فوقك`): the English uses "your sky" and "your spot" for the searched place throughout, and the
  verdict's own definition says "Crossed your sky". Never add `عزيزي`, or an extra `أنت`, for warmth.

### 2.2 Rhythm and length

- One fact per sentence, at most about 18 words. A number with its unit, or a clock with its zone, counts as one word.
  Prefer a full stop to a chain of `و`, with at most two `و` clauses in a sentence.
- Put the verb first when a satellite acts. Use nominal sentences for states (`الغطاء السحابي في المشهد: 25%.`) and in
  the two share frames where two Latin names would otherwise touch (§5.2).
- Never open a sentence with `إنّ`، `حيث`، `يُذكر أن`، `تجدر الإشارة إلى أن` or `من الجدير بالذكر`: they are filler.
- Prefer light MSA to newsroom stock phrases: `بعرض 290 كم`, not `البالغ 290 كم`; `تقريبًا`, not `قرابة`; `كان المكان
  مظلمًا`, not `كان الظلام يخيّم`. `ثمّة` belongs to the hero and its echo, and nowhere else.

### 2.3 What to avoid

- **Marketing tone:** `اكتشف`، `لا تفوّت`، `مذهل`، `الآن فقط`، `بكل سهولة`، `مجانًا!`. The English never sells.
- **Calques of English structure:**
  - `قام بـ` + masdar: write `مرّ القمر`, not `قام القمر بالمرور`.
  - `تمّ` + masdar as a reflex passive: write `نُشرت 31 صورة`, not `تمّ نشر 31 صورة`. (`تم النسخ` for "Copied",
    `تم نسخ الرابط` and `تمت مشاركته معك` are the accepted UI exceptions.)
  - Agent passives with `من قبل` or `بواسطة`: write `رصده القمر`, not `رُصد من قبل القمر`.
  - `بشكل` + adjective for an adverb: write `مباشرةً`, not `بشكل مباشر`, and `عموديًا`, not `بشكل عمودي`.
  - The article on a digit: write `آخر 7 أيام`, not `الـ7 أيام الأخيرة`.
  - `يعتبر`، `عبارة عن`، `الأمر الذي`، `نظرًا لـ`: say the thing itself.
- **Religious formulas** for uncertainty or delay. Never `الله أعلم`، `إن شاء الله`، `بإذن الله`. "We can't know" is
  `لا يمكننا أن نعرف`.
- **Over-politeness:** `يُرجى`، `نرجو منك`، `عذرًا`، `لسوء الحظ`. The English states the fact and moves on.

### 2.4 Before and after

| Before (rejected) | After | What changed |
|---|---|---|
| `تم تصوير Waterloo بواسطة 256 قمرًا صناعيًا خلال الأيام السبعة الأخيرة.` | `خلال آخر 7 أيام، رصد 256 قمرًا صناعيًا Waterloo.` | "Photographed" is the banned verb, the `بواسطة` passive is a calque, and `السبعة` spells a number the design sets in mono. |
| `اكتشف الآن من يراقبك من الفضاء!` | `ثمّة شيء رصدك أنت هذا الأسبوع.` | The marketing imperative, the surveillance verb, the exclamation mark and the masculine imperative are all gone. |
| `ابحث عن مكانك وشاهد الأقمار التي مرّت فوقك.` | `أي مكان على الأرض، نريك كل قمر صناعي مرّ فوقه خلال آخر 7 أيام.` | Two gendered imperatives become the product's first-person plural (`نريك`). |
| `لسوء الحظ، لم نتمكن من العثور على أي صور متاحة لهذا الموقع في الوقت الحالي، يرجى المحاولة لاحقًا.` | `لم تُنشر للعموم أي صورة هذا الأسبوع.` | The apology, the filler and the invented instruction are removed. `الموقع` (which also means "website") becomes the fact. |
| `هذا الأسبوع، لم يرصد Waterloo أي قمر صناعي.` | `هذا الأسبوع، لم يرصد أي قمر صناعي نتتبّعه Waterloo.` | The place sat in the subject slot ("Waterloo observed no satellite"). |
| `رصد القمر الصناعي Sentinel-2C Waterloo من ارتفاع 795 كم…` | `القمر الصناعي Sentinel-2C رصد Waterloo من ارتفاع 795 كم…` | In plain text the two Latin names ran together as one. |
| `لا يمكننا معرفة إن كان قد التقط صورة، والله أعلم.` | `لا يمكننا أن نعرف إن كان قد فعل.` | The religious formula is gone, and the English sentence stays flat. |

## 3. The key lines

### 3.1 The hero (three lines, one accent)

```
ثمّة شيء
رصدك *أنت*
هذا الأسبوع.
```

As a catalog entry: `hero: [['ثمّة شيء'], ['رصدك ', accent('أنت')], ['هذا الأسبوع.']]`, the same for `landing.hero` and
`card.hero`.

The hero says "There is something / that watched *you* / this week." The accent is `أنت`, alone at the end of the middle
line, in the accent face (Amiri, upright, signal orange).

Measured in Chrome with the committed faces (Noto Sans Arabic, weight 600 at 75 % width; the accent in Amiri at the
design's ×1.08 × `--accent-k` 1.08), at 100 px:

| | Line 1 | Line 2 | Line 3 | Shortest / longest |
|---|---|---|---|---|
| Arabic | 341 px | 412 px | 456 px | 75 % |
| English | 371 px | 445 px | 340 px | 76 % |

The widest Arabic line is 2.5 % wider than the widest English one, so no display-size factor is needed. On the default
card (88 px, a 466 px column) the widest line is about 401 px with a condensed instance and about 447 px at full width.
Both fit.

- Each reader reads `رصدك` as `رصدكَ` or `رصدكِ`. Never vocalise it, and the same goes for `أنت`.
- `رصدك أنت` is the standard Arabic emphasis of an object pronoun (compare `رأيتك أنت`): "watched you, you". It carries
  the stress that English sets with the serif italic.
- `ثمّة` gives the line its quiet, literary unease and echoes `ثمة من يراقبك`. It is used in the hero and in the share
  hook that echoes it, and nowhere else.
- The relative clause takes no `الذي` because `شيء` is indefinite (جملة صفة).

| Alternate | Why it loses |
|---|---|
| `شيء ما` / `رصدك *أنت*` / `هذا الأسبوع.` | The most direct rendering of "Something", and fully natural. It loses on the poster: its first line is 283 px against a 456 px base, a wedge rather than a block. |
| `هذا الأسبوع،` / `شيء ما` / `رصدك *أنت*.` | It ends on the accent, but its middle line is the shortest and the comma on line 1 makes the poster start slowly. |
| ~~`شيء ما` / `*رصدك*` / `هذا الأسبوع.`~~ | The accent falls on the verb instead of the person. |
| ~~`شيء ما يراقبك هذا الأسبوع.`~~ | `يراقب` is surveillance, and the present tense claims it is still happening. |
| ~~`شيءٌ ما رصدكَ`~~ | Any vowel on the suffix assigns a gender. |

Tab title (`app.documentTitle` and `bootText` title): `Watched · ثمّة شيء رصدك أنت هذا الأسبوع`. The brand comes first,
as in English, because tabs cut the title after 25–30 characters. The base direction is then LTR, but the Arabic is one
unbroken run, so it reads correctly.

### 3.2 The sub line

`أي مكان على الأرض، نريك كل قمر صناعي مرّ فوقه خلال آخر 7 أيام، والصور الحقيقية التي التقطها.`

("Any place on Earth: we show you every satellite that passed over it in the last 7 days, and the real pictures it
took.") Return it as one piece, with a no-break space between the number and `أيام`. The days take the forms in §5.4
(`آخر يوم`، `آخر يومين`، `آخر 7 أيام`، `آخر 11 يومًا`).

- It is a topic-comment sentence. `أي مكان` is the topic and `فوقه` points back to it. `مكان` is our own noun (m), not
  `[PLACE]`, so the pronoun is safe.
- `نريك` replaces the English pair of imperatives ("Enter", "See") with the product's "we" and the reader as ـك. It
  works whether the visitor types, taps an example or drops a pin.
- `التقطها`: the subject `كل قمر صناعي` is singular, hence the masculine singular, and `ها` refers to `الصور`. `التقط`
  describes taking a picture; it is not the product verb.
- `الحقيقية` carries "actual": real pictures, not illustrations.

| Alternate | Why it loses |
|---|---|
| `أدخل أي مكان على الأرض لترى كل قمر صناعي …` | The usual Arabic UI shape, but `أدخل` and `لترى` are masculine. |
| `يكفي إدخال أي مكان على الأرض لنريك …` | Neutral and clear, but `يكفي` ("is enough") is a selling move the English does not make. |

### 3.3 Results headline and second line

**Line 1, `results.headline.watched(n, place, when)`.** `N` is the number of distinct satellites. The strong part is
the verb and the count phrase, as English bolds "256 satellites watched". The accent is the place alone (Arabic adds no
article). The verb is masculine singular in every category: in a verb-first sentence it agrees with `قمر` (m), whatever N
is.

```
{window}، **رصد {n, plural,
  one   {قمر صناعي واحد}
  two   {قمران صناعيان}
  few   {# أقمار صناعية}
  many  {# قمرًا صناعيًا}
  other {# قمر صناعي}}** *{place}*.
```

| Category (examples of N) | Arabic |
|---|---|
| `one` (1) | `خلال آخر 7 أيام، **رصد قمر صناعي واحد** *Waterloo*.` |
| `two` (2) | `خلال آخر 7 أيام، **رصد قمران صناعيان** *Waterloo*.` |
| `few` (3–10, 103–110, 1,204) | `خلال آخر 7 أيام، **رصد 7 أقمار صناعية** *Waterloo*.` |
| `many` (11–99, 111–199, 256, 1,715) | `خلال آخر 7 أيام، **رصد 256 قمرًا صناعيًا** *Waterloo*.` |
| `other` (100–102, 200, 1,000) | `خلال آخر 7 أيام، **رصد 200 قمر صناعي** *Waterloo*.` |
| An older window (`{from, to}`) | `من 29 أكتوبر إلى 5 نوفمبر، **رصد 256 قمرًا صناعيًا** *Waterloo*.` |
| A window of other lengths | `خلال آخر يوم،` · `خلال آخر يومين،` · `خلال آخر 5 أيام،` · `خلال آخر 14 يومًا،` |

- For one and two the strong part has no `num()`: Arabic says `قمر صناعي واحد` and `قمران صناعيان`, never `1 قمر صناعي`.
  The renderer must accept a count phrase with no number part (see the open questions).
- `n` is never 0 here. Nothing found is `headline.none`.

**`results.headline.none(place, past)`**:
`هذا الأسبوع، لم يرصد أي قمر صناعي نتتبّعه *Waterloo*.` (and `في ذلك الأسبوع، …` for `past`). The time comes first, the
subject `أي قمر صناعي نتتبّعه` comes right after the verb, and the place comes last, so nobody reads "Waterloo observed
no satellite". `نتتبّعه` already has its object (`ـه`), so the place can only attach to `يرصد`.

**Line 2, `results.imagesPublic(k)`.** It is a passive, verb-first sentence: `نُشرت` agrees with `صورة` (f) in every
category. "At least" is the strong part `' على الأقل'`, placed before the full stop with its leading space inside the
part. The component removes it (`display: none`) once the count is final, and the sentence reads correctly with and
without it.

| Category | Rich parts | While partial |
|---|---|---|
| `one` | `نُشرت للعموم صورة واحدة` + `**' على الأقل'**` + `.` | `نُشرت للعموم صورة واحدة على الأقل.` |
| `two` | `نُشرت للعموم صورتان` + … | `نُشرت للعموم صورتان على الأقل.` |
| `few` | `نُشرت للعموم ` + `num(7)` + ` صور` + … | `نُشرت للعموم 7 صور على الأقل.` |
| `many` / `other` | `نُشرت للعموم ` + `num(31)` + ` صورة` + … | `نُشرت للعموم 31 صورة على الأقل.` (`1,715 صورة`، `100 صورة`) |

- `noImages`: `لم تُنشر للعموم أي صورة هذا الأسبوع.` / `لم تُنشر للعموم أي صورة في ذلك الأسبوع.`
- `archiveDown`: `لم تستجب أرشيفات الصور، لذا لا يمكننا الآن عدّ الصور المنشورة للعموم.`
- On the card, `photos(count, atLeast)`: `لم تُنشر للعموم أي صورة.` / `نُشرت للعموم 31 صورة.` / `نُشرت للعموم 31 صورة
  على الأقل.` The card's `archiveDownShort` is `لم تستجب أرشيفات الصور.`

Alternates for `نُشرت للعموم`: `أُتيحت للعموم` ("were made available") loses the act of publishing. `نُشرت` alone drops
"public", which is the point. `صارت علنية` is out because `علني` means "overt" and has a political edge.

**`results.why` (under the second line when no image was made public)**

| Key | Arabic |
|---|---|
| `sunNeverRose` | `لم تشرق الشمس، فلم تتمكن أي كاميرا نهارية من رؤية المكان.` |
| `sunBarelyRose` | `بالكاد أشرقت الشمس، فلم تتمكن أي كاميرا نهارية من رؤية المكان.` |
| `infrared(n)` | `ومع ذلك، غطّت أقمار الطقس المكان بالأشعة تحت الحمراء` + ` مرة واحدة.` / ` مرتين.` / ` 3 مرات.` / ` 42 مرة.` |
| `radar(names, others, passes)` | `لا يحتاج الرادار إلى الضوء. مرّت أقمار الرادار Umbra-08 وCapella-14 و7 أقمار أخرى ضمن المدى 1,204 مرات.` One name: `مرّ قمر الرادار Umbra-08 ضمن المدى 3 مرات.` Two names, no others: `مرّ قمر الرادار Umbra-08 وقمر الرادار Capella-14 ضمن المدى 31 مرة.` |
| `unpublished(n)` | `مرّ قمر من Sentinel-2 أو Landsat فوق المكان نهارًا مرة واحدة، لكن لم يُنشر أي مشهد بعد.` / n ≥ 2: `مرّت أقمار Sentinel-2 أو Landsat فوق المكان نهارًا 3 مرات، لكن لم يُنشر أي مشهد بعد.` |
| `none` | `لم يمرّ فوق المكان نهارًا أي قمر تصوير ذي أرشيف مفتوح.` |

"Swept it in infrared" is `غطّى`, the likely verdict's verb, and never `مسح` (see §8).

### 3.4 The pass paragraph (`pass` namespace)

The detailed pass, overhead case:

> `مرّ القمر الصناعي Sentinel-2C فوق المكان مباشرةً على ارتفاع 786 كم عند 16:14:21 UTC، متجهًا نحو الجنوب بسرعة 7.46
> كم/ث. كان ينظر عموديًا إلى الأسفل. الغطاء السحابي في المشهد: 25%.`

`crossed`, `likely.crossed`, `could.withinView` and `overhead` receive no place. They say `المكان` (our noun) or let
the offset speak for itself, as the English does. Clocks arrive written (`16:14:21`) with their zone and are set as one
`num()` part.

| Message | Arabic |
|---|---|
| `crossed`, overhead | `مرّ القمر الصناعي [SAT] فوق المكان مباشرةً على ارتفاع 786 كم عند [TIME]، متجهًا نحو الجنوب بسرعة 7.46 كم/ث.` |
| `crossed`, offset | `مرّ القمر الصناعي [SAT] على ارتفاع 786 كم، على بعد 61 كم إلى الغرب، عند [TIME]، متجهًا نحو الجنوب بسرعة 7.46 كم/ث.` |
| `lookingDown` | `كان ينظر عموديًا إلى الأسفل.` |
| `lookingOff(deg)` | `كان ينظر إلى الأسفل بانحراف 5.4° عن العمودي.` |
| `cloudCover(pct)` | `الغطاء السحابي في المشهد: 25%.` |
| `mosaic({sensor, place, gsdM})` | `ضمّ جهاز تصويره MODIS صورة [PLACE] إلى فسيفساء ناسا اليومية بالألوان الطبيعية، بدقة 250 مترًا لكل بكسل.` |
| `radarImaged` | `رصد راداره [PLACE] بدقة 20 مترًا لكل بكسل، ناظرًا بزاوية 32.1° إلى الجانب، في الظلام.` (without `dark`: `…إلى الجانب.`) |
| `likely.crossed` | `مرّ القمر الصناعي [SAT] فوق المكان مباشرةً على ارتفاع 786 كم عند [TIME]، والمكان داخل نطاق مسحه بعرض 290 كم.` (without a swath: ends after `[TIME]`) |
| `likely.archiveFailed` | `كان الوقت نهارًا، فكان سيسجّل هذه البقعة. تعذّر البحث في الأرشيف الآن.` |
| `likely.noScene` | `لا يوجد مشهد لهذا المرور. لا تسجّل أقمار Sentinel-2 إلا اليابسة والمياه الساحلية، وربما لم تكن هذه البقعة ضمن جدولها.` |
| `likely.notYet` | `كان الوقت نهارًا، فمن شبه المؤكد أنه سجّل هذه البقعة. لم يُنشر بعد أي مشهد من هذا المرور؛ فقد تتأخر الأرشيفات يومًا أو أكثر.` |
| `likely.dark` | `كان المكان مظلمًا. تواصل أجهزة تصوير الطقس عملها ليلًا بالأشعة تحت الحمراء، لذا رأى جهازه سحبك، لا شوارعك.` |
| `likely.mosaicUnconfirmed` | `تعذّر التأكد من فسيفساء ناسا اليومية لهذا المرور فوق بقعتك.` |
| `likely.notPublished` | `تغذّي صوره توقعات الطقس؛ ولا تُنشر صورًا يمكننا عرضها.` |
| `could.withinView` | `مرّ القمر الصناعي [SAT] على مرأى من المكان عند [TIME]، فوقه مباشرةً.` / offset: `…عند [TIME]، على بعد 61 كم إلى الغرب.` |
| `could.insideSwath` | `كان نطاق مسحه بعرض 24 كم يشمل [PLACE]. لا ينشر مشغّله أين التقط صوره، لذا لا يمكننا أن نعرف إن كان قد فعل.` |
| `could.radar`, with `deg` | `يرى الرادار عبر السحب والظلام. لو وجّه راداره بزاوية 25.0° إلى الجانب، لأمكنه رصد [PLACE].` + `لم نجد صورة منشورة من هذا المرور.` (open archive) or `لا يمكننا أن نعرف إن كان قد فعل.` |
| `could.radar`, overhead | `يرى الرادار عبر السحب والظلام. كان بإمكانه رصد [PLACE].` + the same closing sentence |
| `could.camera`, with `deg` | `لو وجّه كاميرته بانحراف 18.0° عن العمودي، لأمكنه رصد [PLACE]. لا يمكننا أن نعرف إن كان قد فعل.` |
| `could.camera`, overhead | `كان بإمكانه رصد [PLACE] وهو ينظر عموديًا إلى الأسفل. لا يمكننا أن نعرف إن كان قد فعل.` |
| `overhead` | `مرّ القمر الصناعي [SAT] على ارتفاع 420 كم عند [TIME]، بزاوية 62° فوق أفقك، باتجاه الشمال الغربي.` Near the zenith: `…، بزاوية 85° فوق أفقك، فوق رأسك تقريبًا.` |
| `overhead`, crewed | `مرّت المحطة الفضائية ISS على ارتفاع 420 كم عند [TIME]، بزاوية 62° فوق أفقك، باتجاه الشمال الغربي.` |
| `darkStation` | `كان مكانك مظلمًا. فإن كانت المحطة لا تزال في ضوء الشمس، فقد مرّت في سمائك نقطةً ساطعة ثابتة.` |
| `geo.sits` | `لا يمرّ القمر الصناعي Meteosat-12. فهو يستقر على ارتفاع 35,778 كم فوق خط الاستواء عند 0.2°W، ويُجري مسحًا كاملًا لوجه الأرض المقابل له كل 10 دقائق.` Without a seat: `…فوق خط الاستواء، …`. Without a cadence: `…ويُجري مسحًا كاملًا لوجه الأرض المقابل له.` Cadence: `كل دقيقة` / `كل دقيقتين` / `كل 10 دقائق` / `كل 15 دقيقة`. |
| `geo.reached` | `بلغ خط هذا المسح [PLACE] عند [TIME] تقريبًا، متجهًا نحو الشمال.` |
| `geo.infrared` | `كان المكان مظلمًا، لذا هذه صورة بالأشعة تحت الحمراء: قمم السحب بحسب حرارتها، والأبرد أفتح.` |

| Rejected for the first sentence | Why |
|---|---|
| ~~`Sentinel-2C مرّ فوق …`~~ | It starts with a Latin name, so plain text and screen readers turn the paragraph left to right, and the verb's gender then rests on the name. |
| ~~`حلّق القمر الصناعي …`~~ | `حلّق` / `تحليق` is the word Arabic war reporting uses for warplanes and drones over Gaza and Lebanon. Never in this product. |
| ~~`عبر القمر الصناعي …`~~ | `عبر` is also the preposition "via", so the sentence first reads "via the satellite". |
| ~~`قرابة 07:49`~~ | It means "nearly", it is stiff before a clock, and it is newsroom register. Use `عند 07:49 CET تقريبًا`. |

The compass ids in `heading`, `dir` and `toward` use three Arabic tables (§4.2).

### 3.5 Share card, share page and post (`card` and `share`)

**Card headline.** The usual card leads with the week's count, `card.headline(n, place, cut)`:
`رصد 7 أقمار صناعية` | `*Waterloo*` | `.`. The count phrase follows §3.3, without a window. When the place is cut (`…`),
drop the full stop.

**Week card, `headlineWeek(n, place, cut)`.** The time comes first, as in the results headline, so the card, the
summary page's title and the post's first sentence match the app:
- `هذا الأسبوع، رصد 31 قمرًا صناعيًا` | `*Waterloo*` | `.`
- Zero: `هذا الأسبوع، لم يرصد أي قمر صناعي نتتبّعه` | `*Waterloo*` | `.`

**Older shares, `headlineBy` (no stored count).** Each verdict has its own lead. When the place would be the object
directly after the name, the sentence is nominal:

| Verdict | Known satellite (lead \| place \| tail) | `sat` undefined |
|---|---|---|
| imaged | `القمر الصناعي [SAT] رصد` \| `[PLACE]` \| `.` | `رصد قمر صناعي` \| `[PLACE]` \| `.` |
| likely | `القمر الصناعي [SAT] غطّى` \| `[PLACE]` \| `.` | `غطّى قمر صناعي` \| `[PLACE]` \| `.` |
| could | `مرّ القمر الصناعي [SAT] على مرأى من` \| `[PLACE]` \| `.` | `مرّ قمر صناعي على مرأى من` \| `[PLACE]` \| `.` |
| overhead | `مرّ القمر الصناعي [SAT] فوق` \| `[PLACE]` \| `.` (crewed: `مرّت المحطة الفضائية [SAT] فوق`) | `مرّ قمر صناعي فوق` \| `[PLACE]` \| `.` |

`sat` is `undefined` for a nameless satellite, and each sentence writes "a satellite" itself, as above. `card.aSatellite`
(`قمر صناعي`) is only for the chips over the picture and the plan plate's callout. Never insert it into a sentence:
`القمر الصناعي قمر صناعي` would follow.

**The card's other words**

| Key | Arabic |
|---|---|
| `cloud.only` | sub `غطّت السحب المشهد: لم ير سواها.` · chip `تحت السحب · 92%` · post `لم ير سوى السحب.` · desc `لم ير سوى السحب (92%).` |
| `cloud.mostly` | sub `معظم المشهد سحب: 81%.` · chip `معظم المشهد سحب · 81%` · post and desc `رأى سحبًا في معظم المشهد (81%).` |
| `cloud.spot` | sub `سحب فوق البقعة نفسها.` · chip `سحب فوق البقعة` · post and desc `غطّت السحب البقعة.` |
| `stamp` | `الأحد، 1 نوفمبر 2026 · 11:21 EST` (the Intl day with its year, as it comes) |
| `weekTo` / `lastWeek` | `7 أيام حتى الأحد، 1 نوفمبر 2026` / `آخر 7 أيام` |
| `readout` | `الارتفاع` · `زاوية الارتفاع` · `السرعة` · `الانحراف` · `البكسل` · `بكسل الفسيفساء` · `أقرب مسافة` |
| `lane` | `صورة` · `مرجّح` · `ممكن` · `فوقك` |
| `unit` | `كم` · `م` · `كم/ث` |
| `decimal`, `pixelSize`, `distance`, `scale` | `fmt('ar').dec`/`int` with the symbol units: `10 م`، `0.31 م`، `2 كم`، `786 كم` |
| `geometry` | `مسار المرور · الشمال للأعلى` |
| `note` | `تُفتح الصورة في التطبيق` · `الصورة غير متاحة الآن` · `أرشيف تجاري غير متاح للعموم` · `ضمن نطاق المسح، ولا صورة منشورة بعد` · `المسار الأرضي عند أقرب نقطة` |
| `acquiring` | `جارٍ الالتقاط…` |
| `noPublicPhoto` / `noPhoto` | `لا صورة منشورة هذا الأسبوع` / `لا صورة للعرض` |
| `look` | `أقرب نظرة` · `أحدث نظرة صافية` · `تحت السحب` · `رادار` (chip: `أحدث نظرة صافية · 3 نوفمبر · Landsat 9 · 30 م`) |
| `lookDay` | `3 نوفمبر` |
| `aSatellite` | `قمر صناعي` |
| `invite` | `ما الذي رصدك؟` (a question replaces the English imperative "See what watched you") |
| `enterAnyPlace` | `أي مكان على الأرض` |
| `defaultPlace` | `نخلة جميرا` |
| `defaultAlt` | `صورة حقيقية من القمر الصناعي Sentinel-2 لنخلة جميرا في دبي، بجانب العبارة: ثمّة شيء رصدك أنت هذا الأسبوع. أي مكان على الأرض.` |

**Share page (`card.page` and the descriptions)**

| Key | Arabic |
|---|---|
| `page.title` | `ثمّة شيء رصدك أنت هذا الأسبوع.` |
| `page.description` | the sub line of §3.2, with 7 |
| `page.placeTitle(place)` | `ما الذي رصد [PLACE] هذا الأسبوع` (the verb's subject `الذي` comes first, so the place is its object) |
| `page.placeDescription(place)` | `كل قمر صناعي مرّ فوق [PLACE] خلال آخر 7 أيام، والصور الحقيقية التي التقطها. ما الذي رصدك هذا الأسبوع؟` |
| `page.opening` | `['جارٍ فتح ', accent('Watched')]` |
| `crossed` (imaged, likely, overhead) | `مرّ القمر الصناعي [SAT] على ارتفاع 795 كم فوق [PLACE] عند 11:21 EST يوم الأحد، 1 نوفمبر 2026، متجهًا نحو الجنوب.` Without an altitude: `مرّ … فوق [PLACE] …`. Nameless: `مرّ قمر صناعي …`. Crewed: `مرّت المحطة الفضائية [SAT] …` |
| `withinView` | `مرّ القمر الصناعي [SAT] على مرأى من [PLACE] عند 11:21 EST يوم الأحد، 1 نوفمبر 2026، متجهًا نحو الجنوب.` |
| `couldHave` | `كان بإمكانه توجيه كاميرته إلى هنا. لا يقول مشغّله إن كان قد فعل.` |
| `straightDown` / `offNadir(deg)` | `كان ينظر عموديًا إلى الأسفل.` / `كان ينظر إلى الأسفل بانحراف 5.4° عن العمودي.` |
| `cloudCover(pct)` | `الغطاء السحابي: 25%.` |
| `inSwath(place)` | `كان نطاق مسحه يشمل [PLACE].` |
| `bestFrom` | `أقرب نظرة من القمر الصناعي [SAT].` · `أحدث نظرة صافية من القمر الصناعي [SAT].` · `أول صورة من القمر الصناعي [SAT].` (nameless: `… من قمر صناعي.`) |
| `question` | `ما الذي رصدك هذا الأسبوع؟` |
| `cardAlt` | `بطاقة المشاركة، مع أقرب صورة هذا الأسبوع، من القمر الصناعي [SAT].` (nameless: `من قمر صناعي`) · `بطاقة المشاركة.` |

**Post (`share.post`)**. The date is the Intl long day (`يوم الأحد، 1 نوفمبر`), and the clock arrives as `11:21`.

> `القمر الصناعي Sentinel-2C رصد Waterloo من ارتفاع 795 كم يوم الأحد، 1 نوفمبر، عند 11:21 بالتوقيت المحلي. الدقة 10
> أمتار لكل بكسل، وهذه هي الصورة الحقيقية.`
>
> `ثمّة شيء رصدك أنت أيضًا هذا الأسبوع.`

| Message | Arabic |
|---|---|
| `imaged` | as above. `pixelM` arrives as a number: `الدقة 10 أمتار` / `30 مترًا` / `375 مترًا`, or from 1000 m `الدقة 2 كم لكل بكسل`. Without it: `… بالتوقيت المحلي. هذه هي الصورة الحقيقية.` |
| `clouded` | `القمر الصناعي [SAT] رصد [PLACE] من ارتفاع 795 كم يوم … عند 11:21 بالتوقيت المحلي.` + the card's post sentence |
| `likely` | `القمر الصناعي [SAT] غطّى [PLACE] من ارتفاع 795 كم يوم … عند 11:21 بالتوقيت المحلي. شمل نطاق مسح كاميرته البقعة.` |
| `could` | `مرّ القمر الصناعي [SAT] على مرأى من [PLACE] يوم الأحد، 1 نوفمبر، عند 11:21 بالتوقيت المحلي. كان بإمكانه توجيه كاميرته إلى هنا. لا يقول مشغّله إن كان قد فعل.` |
| `overhead` | `مرّ القمر الصناعي [SAT] على ارتفاع 795 كم فوق [PLACE] يوم … عند 11:21 بالتوقيت المحلي.` (crewed: `مرّت المحطة الفضائية [SAT] …`) |
| `hookWatched` / `hookPassed` | `ثمّة شيء رصدك أنت أيضًا هذا الأسبوع.` / `ما الذي مرّ فوقك هذا الأسبوع؟` |
| `credit(handle)` | `عبر [HANDLE]` |
| `pngName`, `weekPngName` | as English (ASCII words: `watched-…-week-….png`) |

X weighs Arabic letters as 1, like Latin, so the English length budget holds.

### 3.6 The four verdicts (`verdicts` namespace)

| Verdict | `title` | `short` (lane) | `unit(n)` zero / one / two / few / many / other | `definition` | `verb` (spoken row) |
|---|---|---|---|---|---|
| imaged | `رصد` | `صورة` | مرة / مرة / مرتان / مرات / مرة / مرة | `توجد صورة حقيقية لهذا المكان في أرشيف متاح للعموم.` | `رصد` |
| likely | `رصد على الأرجح` | `مرجّح` | same | `غطّى نطاق مسح كاميرا غير قابلة للتوجيه هذا المكان. لم تُنشر له أي صورة.` | `غطّى المكان` |
| could | `كان بإمكانه النظر إلى هنا` | `ممكن` | same | `كانت ضمن المدى كاميرا قابلة للتوجيه أو تابعة لجهة خاصة. لا يقول مشغّلها إن كانت قد نظرت.` | `مرّ ضمن المدى` |
| overhead | `مرّ فوقك` | `فوقك` | same | `مرّ في سمائك. المحطات الفضائية وكل ما سواها.` | `مرّ فوقك` |

- The titles stay unvocalised. `رصد` reads as "was watched" or as the noun "observation", and both are true.
- `كان بإمكانه النظر إلى هنا`: "it could have looked here". The implicit subject is the satellite, as in `مرّ فوقك`, and it
  matches the definition's `نظرت`. As a group title over many satellites it reads as "each could have…", exactly as the
  English does.
- `مرّ فوقك` is the documented exception to "no extra you" (§2.1).
- Lane `صورة`, not `صورة فوتوغرافية`: Arabic `صورة` means image and photo alike, so it is honest for radar images and
  weather mosaics in the same lane. Where the English contrasts a photo with a radar image, add the adjective
  (`صورة فوتوغرافية` / `صورة رادارية`).
- `على الأرجح` / `مرجّح` means "more likely than not". Never `محتمل`, which leans toward "possible" and would blur into
  `ممكن`.
- `غير قابلة للتوجيه` parallels `قابلة للتوجيه`. `ثابت` is reserved for geostationary satellites.
- The definitions name a camera (`كاميرا`, f, our noun) or the place (`هذا المكان`, m), never the reader.
- In the prose sentences, the verbs are: imaged `رصد`, likely `غطّى`, could `مرّ … على مرأى من`, overhead `مرّ … فوق`.
- About's `verdictMore`: imaged `إن عرضناها، فهي الصورة الحقيقية.` · likely `الصورة لم تُنشر بعد، أو استُبعدت بسبب السحب.`
  · could `لا سبيل إلى معرفة ما إذا كانت قد نظرت حقًا.` · overhead (empty).

### 3.7 Reference lines by namespace

These are the agreed forms. Write the rest of each namespace from them.

**`landing`**

| Key | Arabic |
|---|---|
| `lastDays(days)` | `آخر 7 أيام` (`آخر يوم`، `آخر يومين`، `آخر 11 يومًا`) |
| `windowRange` | `1 ← 8 نوفمبر 2026 UTC`، `29 أكتوبر ← 5 نوفمبر 2026 UTC` (build it from `formatRangeToParts` and replace the separator with ` ← `) |
| `builtBy(handle)` | `من صنع @armaangupt0` |
| `sourceLink` · `sourceLinkLabel` | `مفتوح المصدر` · `مفتوح المصدر: الشيفرة على GitHub` (the ↗ after it mirrors to point left, away from the words) |
| `searchPlaceholder` · `placeLabel` | `البحث عن مكان` · `المكان` |
| `searching` · `searchUnavailable` · `noMatch` | `جارٍ البحث` · `البحث غير متاح` · `لا نتائج` |
| `matches(n)` | `نتيجة واحدة` · `نتيجتان` · `3 نتائج` · `11 نتيجة` · `100 نتيجة` |
| `searchHint` | `اسم أو عنوان أو إحداثيات` |
| `clearSearch` · `go` | `إفراغ البحث` · `عرض ما مرّ فوق هذا المكان` |
| `searchDown` | `لا يستجيب البحث عن الأماكن. الإحداثيات مثل ⟨LRI⟩43.47, −80.54⟨PDI⟩ لا تزال تعمل.` (the coordinates exactly as the source writes them, with U+2212, inside LRI…PDI) |
| `nothingMatches(query)` | `لا شيء يطابق «⟨FSI⟩[QUERY]⟨PDI⟩». يمكنك تجربة مدينة أو معلم أو إحداثيات.` (the query inside FSI…PDI) |
| `useMyLocation` · `locateMe` · `nearMe` · `locating` | `استخدام موقعي` · `حدّد موقعي` · `بالقرب مني` · `جارٍ التحديد…` |
| `cancelSearch` · `cancelLocate` · `cancelLocating` | `إلغاء` · `إلغاء` · `إلغاء تحديد الموقع` |
| `requestingPosition` · `namingPlace` · `elapsed` | `جارٍ طلب الموقع` · `جارٍ تسمية المكان` · `04 ث` |
| `locatingNote` | `يُرسل موقعك إلى خدمة Photon لتسمية المكان. لا نحتفظ إلا بخلية عرضها نحو 10 كم.` |
| `locationLabel` · `dismiss` | `الموقع` · `إغلاق` |
| `locateErrors` | denied `الوصول إلى الموقع محظور. يمكنك السماح به في إعدادات المتصفح، أو البحث عن مكان.` · unavailable and other `موقعك غير متاح الآن. يمكنك البحث عن مكان بدلًا من ذلك.` · timeout `استغرق تحديد موقعك وقتًا طويلًا. يمكنك المحاولة مجددًا، أو البحث عن مكان.` · unsupported `لا يستطيع هذا المتصفح مشاركة موقعه. يمكنك البحث عن مكان بدلًا من ذلك.` · insecure `يتطلب تحديد الموقع اتصالًا آمنًا (https). يمكنك البحث عن مكان بدلًا من ذلك.` |
| `orTry` · `pinHint` · `examplesLabel` · `dropPin` | `أمثلة` · `النقر على الكرة يضع دبوسًا` · `أماكن للتجربة` · `وضع دبوس` |
| `chipName(label, sublabel)` | `[label]، [sublabel]` |
| `surprise` · `surpriseName` | `فاجئني` · `فاجئني: مكان مشهور يُختار عشوائيًا` |

**`app` and `bootText`**: notice label `عطل`; fallback `حدث خطأ.`; `tryAgain` `إعادة المحاولة`; `trying`
`جارٍ المحاولة…`; `back` `رجوع`. The `catalog` fault is
`تعذّر تحميل كتالوج المدارات. يمكنك التحقق من اتصالك ثم المحاولة مجددًا.` and the `compute` fault is
`حدث خطأ أثناء حساب مرات المرور فوق هذا المكان. يمكنك المحاولة مجددًا بعد قليل.` Progress lines: `جارٍ تحميل العناصر
المدارية` · `التقرير جاهز`. Boot strings: `loading` `جارٍ تحميل Watched` · `slow` `الاتصال بطيء، والتحميل مستمر` ·
`title` as §3.1.

**`hud`**

| Key | Arabic |
|---|---|
| `about` · `home` | `كيف يعمل` · `العودة إلى Watched` |
| `regionTime` · `regionCatalog` · `regionSun` · `scene` | `الوقت` · `كتالوج المدارات` · `الشمس` · `المشهد` |
| `sun(lat, lon)` | `الشمس ⟨LRI⟩16.2°S 063.0°E⟨PDI⟩` (the coordinates exactly as given, inside one LRI…PDI) |
| `subsolar` · `gmst` | `نقطة تعامد الشمس` · `GMST 18:41:50` |
| `objects(n)` · `objectsPending` · `catalog` | `16,893 جسمًا` (`جسم واحد`، `جسمان`، `7 أجسام`، `100 جسم`) · `أجسام` · `الكتالوج` |
| `fetched(stamp)` | `جُلب 2026-11-08 03:34Z` |
| `catalogAge` | `للتو` · `قبل 42 د` · `قبل 5 س` · `قبل يومين` · `قبل 3 أيام` · `قبل 11 يومًا`; stale: `قديم، قبل 3 أيام`. Never a `<`. |
| `catalogUnavailable` · `catalogLoading` | `الكتالوج غير متاح` · `جارٍ تحميل الكتالوج` |

**`globe`**: callout meta `NORAD 39634 · 786 كم`; `imaged` `التقاط 11:21:13 EST` (`التقاط ≈ 11:21 EST`); `acquired`
`التُقطت 11:21:13 EST · 10 م`; `resolutionM` / `resolutionKm` `10 م` / `2 كم`; `acquisitionOf`
`الالتقاط · SENTINEL-2C`; `closestApproachOf` `أقرب نقطة · SENTINEL-2C`; `acquiredNow` `التُقطت`; `closestApproachNow`
`أقرب نقطة`. Pin card: `card` `الدبوس`; `naming` `جارٍ تسمية هذه البقعة`; `noName` `لا اسم لمكان قريب`; `placeTitle`
`[name]، [area]`; `searchAria` `عرض ما مرّ فوق [PLACE]`; `searchTitle` `البحث هنا (Enter)`; `removeAria` `إزالة الدبوس`;
`removeTitle` `إزالة الدبوس (Esc)`; `moveHint` `الضغط المطوّل على الكرة ينقله`; `droppedAt` `وُضع دبوس عند [COORDS].`;
`droppedIn` `وُضع دبوس في [PLACE]. يمكنك الضغط على Enter أو السهم لعرض ما مرّ فوق المكان.`; `droppedUnnamed`
`وُضع دبوس. يمكنك الضغط على Enter أو السهم لعرض ما مرّ فوق المكان.`; `noGl` `العرض ثلاثي الأبعاد غير متاح` /
`تقنية WebGL 2 معطّلة في هذا المتصفح`.

**`results` (beyond §3.3)**

| Key | Arabic |
|---|---|
| `share` · `shareWeekLabel` | `مشاركة` · `مشاركة هذا الأسبوع في [PLACE]` / `مشاركة ذلك الأسبوع في [PLACE]` |
| `verdictGroup` · `verdictReadout` | `مرات المرور بحسب الحكم. كل منها ينقل إلى قائمته.` · `31 مرة: رصد` |
| `notes.counted` | `**12** صورة مفصّلة (Sentinel-2، Landsat، 10–30 م) · **31** صورة فسيفساء طقس يومية (250–375 م) · **4** صور رادارية (Sentinel-1، 20 م) · **1,008** صور للقرص الكامل من أقمار الطقس الثابتة (2–5 كم؛ تُعرض أحدث صورة من كل منها). فُحصت 1,234 مرة مرور لعدد 250 من أقمار التصوير والمحطات المأهولة.` (each noun by its count's category) |
| `notes.passTimes` | `أوقات المرور هي اللحظات التي كان فيها كل قمر صناعي أقرب ما يكون إلى [PLACE]، محسوبة من عناصر مدارية عامة (جُلبت 2026-11-08 03:31Z). الأوقات المحلية بتوقيت America/Toronto.` |
| `sheetLabel` · `computingPasses` | `الأقمار الصناعية فوق [PLACE]` · `جارٍ حساب مرات المرور` |
| `sections` | `الملخص` · `مرات المرور` · `رصد متواصل` |
| `checkingArchives` | `جارٍ البحث في الأرشيفات` |
| `invite` | `ثمّة شيء رصدك أنت أيضًا هذا الأسبوع.` · `التحقق من مكانك` · `إغلاق` |
| `searchAnother` · `allPasses` | `البحث عن مكان آخر` · `كل مرات المرور` |
| `footer` | `إعادة العرض` · `إعادة عرض المرور` · `إعادة عرض المرور على الكرة الأرضية` · `مشاركة هذا المرور` / `مشاركة هذه الصورة` · shareButton `['مشاركة', strong(' هذا المرور')]` / `['مشاركة', strong(' هذه الصورة')]` · checkPlace `[strong('التحقق من '), 'مكانك']` · clearest `[strong('عرض '), 'أصفى نظرة']` · `عرض أصفى نظرة` |
| `head.windowSpan` | `7 أيام · 1 ← 8 نوفمبر` |
| `head` buttons | `جارٍ التحقق من فسيفساء الطقس` · `إلغاء` · `بحث جديد` · `إغلاق` · `Esc` · `تغيير` · `جارٍ الحساب` · `الأخيرة` |
| `head.searchBarLabel` | `البحث عن مكان آخر (الحالي: [PLACE])` |
| `head.position` · `previous` · `next` | `المرور 3 من 31 من هذا النوع` · `المرور السابق من هذا النوع` · `المرور التالي من هذا النوع` |
| `head.previousTitle` · `nextTitle` · `allPassesTitle` | `السابق (←)` · `التالي (→)` · `كل مرات المرور (Esc)` |
| `head.shared` | `تمت مشاركته معك · القمر الصناعي [SAT] رصد [PLACE]` |
| `head.passWhen` | `الأحد، 1 نوفمبر · ≈ 16:14 EST` |
| `computing.stages` | `كتالوج المدارات` / `حُمّل الكتالوج` · `حساب المدارات · 7 أيام` / `حُسبت المدارات` · `أرشيف Sentinel-2 + Landsat` / `اكتمل البحث في الأرشيفات` · `مطابقة المشاهد بمرات المرور` / `طوبقت المشاهد` |
| `computing` misc | `ready` `التقرير جاهز` · `ok` `تم` · `seconds` `1.84 ث` · `percent` `42%` |
| `computing.window` | `[strong('نافذة 7 أيام · '), '1 نوفمبر 05:47 ← 8 نوفمبر 05:47 UTC']` |
| `computing.slow` · `verySlow` | `يرسم أرشيف Planetary Computer وناسا الصور عند الطلب؛ قد تستغرق هذه الخطوة بضع ثوانٍ.` · `أرشيفات الصور بطيئة في الرد. إن لم تستجب، فستظهر مرات المرور من الحسابات المدارية مع ذلك، وسنذكر ذلك.` |
| `computing.sharedAlt` · `sharedCaption` | `صورة [PLACE] من القمر الصناعي [SAT]، تمت مشاركتها معك.` · `[strong('تمت مشاركته معك'), ' · القمر الصناعي [SAT] رصد [PLACE] · الأحد، 1 نوفمبر، 11:21']` (nameless: `صورة [PLACE] من قمر صناعي…` · `رصد قمر صناعي [PLACE]`) |
| `geo.none` | `لا يرى أي قمر طقس ثابت عامل هذا المكان فوق زاوية ارتفاع 5°.` |
| `geo.facts` | `0.0°E · 42.3° ارتفاعًا · كل 10 د` |
| `geo.images` | `[num('143'), ' صورة هذا الأسبوع']`، `7 صور هذا الأسبوع`، days ≠ 7: `143 صورة خلال 5 أيام` |
| `geo.replay` · `replayLabel` | `إعادة العرض` · `القمر الصناعي [SAT]: إعادة عرض أحدث صورة` |
| `geo.frame` | `جارٍ البحث…` · `لا صورة منشورة` · `جودة رديئة` · `لا صورة الآن` · `الإطار غير متاح` |
| `geo.frameAlt` · `infraredChip` · `infraredTitle` | `القمر الصناعي [SAT]: أحدث إطار بالأشعة تحت الحمراء حول المكان` · `IR` · `الأشعة تحت الحمراء: قمم السحب بحسب حرارتها، والأبرد أفتح` |
| `timeline` | `الخط الزمني` · meta `7 أيام · ⟨LRI⟩America/Toronto⟨PDI⟩ · ⟨LRI⟩EST⟨PDI⟩` · zoneChange `⟨LRI⟩EDT⟨PDI⟩ ← ⟨LRI⟩EST⟨PDI⟩` · `النهار هنا` · `الآن` |
| `timeline.summary` · `keysHint` | `الخط الزمني، 7 أيام: رصد: 12، رصد على الأرجح: 30، كان بإمكانه النظر إلى هنا: 4، مرّ فوقك: 2.` · `[summary] مفتاحا السهم الأيسر والأيمن يتنقلان بين مرات المرور.` |
| `timeline.geoLane` · `geoNames` | `[strong('ثابت · '), '3']` · names joined with `، ` |
| `timeline.geometry` · marks | `انحراف 8.9° · 61 كم` · `فسيفساء يومية، 250 م · ●` · `صورة رادارية، 20 م · ◆` · `رصد · ◆` · `رصد على الأرجح · تصوير مفتوح · ◇` (kinds: `تصوير مفتوح · ◇`، `تجاري · □`، `رادار · ▣`، `طقس · ○`، `مأهول · ✛`، `أخرى`) |
| `replay` | `وقت المشهد خلال المرور` · `T−00:42، 16:14:21 UTC` · `تشغيل إعادة العرض` · `إيقاف إعادة العرض مؤقتًا` · `سرعة إعادة العرض` · `ضمن المدى 4 د 12 ث` · `الأقرب` · `مسافة` · `تشغيل / إيقاف` · `المرور السابق / التالي من هذا النوع` |
| `plan` | `منظر علوي: المسار الأرضي للقمر الصناعي [SAT]، على بعد 61 كم من المكان عند أقرب نقطة.` · `منظر علوي · الشمال للأعلى` · `مدى التوجيه ±30°` · `نطاق المسح 290 كم` · `المسار الأرضي` · `1 كم` · `الأقرب 61 كم` / `الأقرب أقل من 1 كم` |
| `product` · `pixel` | `فسيفساء يومية · 250 م` · `القرص الكامل · 2 كم` · `تحت الحمراء · 2 كم` · `Sentinel-2 L2A · 10 م` · `Landsat C2 L2 · 30 م` · `رادار Sentinel-1 · 20 م` · `10 م` / `2 كم` |
| `timelapse` | `عبر السنين` · `هذا المكان، عامًا بعد عام` |

**`passView`**

| Key | Arabic |
|---|---|
| `empty` | `لم يمرّ أي قمر صناعي نتتبّعه فوق هذا المكان خلال هذه الفترة. هذا نادر؛ والملاحظات أعلاه تذكر إن كان أحد مصادر البيانات معطّلًا.` |
| `imagedOrder` | `أقرب نظرة، ثم الأحدث` |
| `count` · `countStack` | `31 مرة` (sentence forms) · `num('2', 'مرتان')` (readout forms, §5.4) |
| `sats(n)` | `قمر صناعي واحد` · `قمران صناعيان` · `7 أقمار صناعية` · `11 قمرًا صناعيًا` · `100 قمر صناعي` |
| `showAllSats` · `showAllRows` · `showMore` · `left` · `showFewer` | `عرض كل الأقمار الصناعية: 31` · `عرض كل الصفوف: 40` · `عرض 40 صفًا آخر` (`صف آخر`، `صفين آخرين`، `3 صفوف أخرى`) · `متبقٍّ: 12` · `عرض أقل` |
| `tag` | `فسيفساء` · `رادار` · `سحب · 81%` · `سحب فوق البقعة` |
| `rowLabel` | facts joined with `، `: `Sentinel-2C، رصد، الجمعة، 6 نوفمبر 16:14 EST، قبل 41 ساعة، السحب 25 بالمئة، تحت السحب` |
| `offNadir` · `offNadirShort` · `distanceKm` · `cloudPct` | `انحراف 8.9°` · `8.9°` · `61 كم` · `السحب 25%` |
| `satLabel` | `Sentinel-2C، ESA، 31 مرة، الأحدث الجمعة، 6 نوفمبر 16:14` |
| `latest` · `closest` · `cloudChip` | `الأحدث ` · `الأقرب ` · `سحب` |
| sections | `الصور` · `المنظر العلوي` · `القياسات` · `إعادة العرض` |
| `fullDiscNote` | `صورة للقرص الكامل: لقطة واحدة لكل ما يراه القمر الصناعي، بدقة [PIXEL] لكل بكسل هنا. خشنة، لكنها حقيقية، وأحدث ما نُشر؛ وقد التقط مثلها كل 10 دقائق طوال الأسبوع.` (no cadence: `كل بضع دقائق`) |
| `mosaicNote` | `فسيفساء يومية: تجمع ناسا مسارات كل يوم في صورة واحدة بدقة 250 مترًا لكل بكسل. خشنة، لكنها حقيقية، ومن يوم هذا المرور.` |
| `radarNote` | `صورة رادارية، لا صورة فوتوغرافية: يُرسل القمر الصناعي Sentinel-1 موجات ميكروية ويسجّل صداها، فلا تحجبه السحب ولا الظلام. السطوع هو قوة ارتداد الموجات عن الأرض: المباني والأرض الوعرة ساطعة، والماء الساكن داكن.` |
| `noImage` | `لا صورة من القمر الصناعي [SAT] لهذه البقعة من هذا المرور. منظر علوي للمرور.` · `لا صورة منشورة: أرشيف هذا الرادار غير متاح للعموم. منظر علوي للمرور.` · `لا صورة منشورة: الأرشيفات التجارية غير متاحة للعموم. منظر علوي للمرور.` · `لا صورة لعرضها من هذا المرور. منظر علوي للمرور.` · `تعذّر البحث في الأرشيف الآن. منظر علوي للمرور.` · `لا يوجد مشهد لهذا المرور. منظر علوي للمرور.` · `لا يطابق هذا المرور أي مشهد منشور بعد. تظهر مشاهد Sentinel-2 وLandsat عادةً خلال يوم.` · `تحمل المحطات المأهولة كاميرات، لكن صورها لا تُنشر بحسب المكان والوقت.` · `صورة هذا المرور غير متاحة.` |
| `links` | `فتح الصورة لحفظها` · `جارٍ التنزيل…` · `تنزيل الصورة` · `عرض المصدر · Planetary Computer` |
| `spot` | `جارٍ قراءة البكسل فوق بقعتك…` · `صافٍ فوق بقعتك.` · `ظهر سمحاق رقيق فوق بقعتك؛ قد يخفف حدة الصورة.` · `سحب فوق بقعتك.` · `كانت بقعتك في ظل سحابة.` |
| `strip` | `الارتفاع` · `زاوية الارتفاع` · `الانحراف` · `البكسل` · `الحزمة` · `الشمس` · `السحب` · `السحب هنا` |
| `band` · `spotValue` | `تحت الحمراء` · `مرئي` · `ألوان` · `صافٍ` · `سمحاق` · `سحب` · `ظل` |
| `unit` | `كم` · `م` · `كم/ث` · `ارتفاعًا` · `فسيفساء` · `المشهد` · `نهار` / `شفق` / `ليل` |
| `geo` labels | `أقرب نقطة · UTC` · `أقرب نقطة · محلي` · `المسافة الأرضية` · `زاوية الارتفاع من مكانك` · `السرعة الأرضية` · `الاتجاه` · `ارتفاع الشمس` · `مدى التوجيه` · `نطاق المسح` · `ضمن نطاق المسح` · `ضمن المدى` · `النافذة الزمنية` · `NORAD · المرور` · `خط المسح هنا · UTC` · `خط المسح هنا · محلي` · `فوق خط الاستواء عند` · `في سمائك` · `اتجاه المسح` · `سرعة الخط هنا` · `التغطية` · `هذا المسح` · `NORAD · المسح` |
| `northToSouth` · `southToNorth` · `timeRange` | `الشمال ← الجنوب` · `الجنوب ← الشمال` · `16:14:21 ← 16:18` |
| `sunPhase` · `fullDisc` · `everyMin` | `نهار` / `شفق` / `ليل` · `القرص الكامل` · `كل 10 د` |
| `upCompass` · `heading` | `ارتفاعًا · SSW` · `SSW · صاعد` / `SSW · هابط` |

**`gallery` and `lightbox`**

| Key | Arabic |
|---|---|
| `barLabel` · `filterLabel` · `filter` | `الصور` · `عرض الصور` · `الكل` · `مفصّلة` · `الطقس` · `رادار` |
| `filterTitle` | `كل الصور، الأحدث أولًا بعد أقرب نظرة` · `صور Sentinel-2 وLandsat، من 10 إلى 30 مترًا لكل بكسل` · `فسيفساء الطقس اليومية، 250 مترًا لكل بكسل فأكثر` · `صور رادار Sentinel-1، بدقة 20 مترًا لكل بكسل: عبر السحب، ليلًا ونهارًا` |
| `system.counter` · `photosThisWeek` · `photosThatWeek` | `3 / 27` · `هذا الأسبوع: 12` · `ذلك الأسبوع: 12` |
| `prevPhoto` · `prevTitle` · `nextPhoto` · `nextTitle` | `الصورة السابقة` · `السابق (←)` · `الصورة التالية` · `التالي (→)` |
| `carousel` · `trackLabel` · `slide` | `شريط صور` · `صور هذا المكان، السحب يعرض المزيد` · `شريحة` |
| `lead` | `أقرب نظرة` · `أحدث نظرة صافية` · `تحت السحب` |
| `slideLabel` | `أقرب نظرة: Sentinel-2C، الأحد، 1 نوفمبر 16:14، الصورة 3 من 27` |
| `replayLabel` · `replay` | `إعادة عرض هذا المرور على الكرة الأرضية: [SAT]، [DAY] 16:14` · `['إعادة العرض']` (no strong part: the phrase cannot be cut in two) |
| `viewLabel` · `view` · `sharePass` · `radarTag` | `عرض أحدث نظرة صافية بحجم كبير: …` / `عرض الصورة بحجم كبير: …` · `عرض` · `مشاركة هذا المرور` · `رادار` |
| `noteMostlyCloud` · `noteLastClear` | `معظم ما رأته مرات المرور هذا الأسبوع سحب` · `هذه أحدث نظرة صافية` |
| `clouded` | `تحت السحب · 92%` · `تحت السحب · سحب فوق بقعتك` · `سحب فوق بقعتك` |
| `status` | `سحب · 81%` · `سحب فوق البقعة` · `صافٍ` · `سمحاق رقيق` · `ظل سحابة` · `السحب 25%` · `فسيفساء يومية` |
| `cropKm` · `scaleKm` · `north` | `10 كم` · `1 كم` · `N` |
| `photoAlt` | `صورة [PLACE] من القمر الصناعي [SAT]. المكان في المنتصف.` |
| frame states | `جارٍ الالتقاط` · `لم تُرسل أي صورة` · `إعادة المحاولة` · `لا يزال يُرسم. قد تستغرق المشاهد الكبيرة 10 ثوانٍ أو أكثر.` · `لم يُرسل الأرشيف هذا الاقتطاع. ربما هو مشغول؛ الصورة نفسها لا تزال موجودة.` |
| `expandLabel` · `expandTitle` | `تكبير الصورة` · `تكبير (F)` |
| `scanLine` | `['السطر ', strong('0412'), ' ← 1024']` |
| `awaiting` | `بانتظار المرور` · `بانتظار المسح` |
| lightbox | `الصور` · `الصورة 3 من 27، أقرب نظرة` · `أحدث نظرة صافية، من قبل هذا الأسبوع` · `هذا المكان عبر السنين، نظرة صافية كل عام` · `عبر السنين` · `تصغير` / `تصغير (−)` · `تكبير` / `تكبير (+)` · zoom `⟨LRI⟩2.5×⟨PDI⟩` · `إغلاق عارض الصور` · `إغلاق (Esc)` · `10 م لكل بكسل` · `حُسّنت دقتها بحزمة Landsat البانكروماتية (15 م)` · `Landsat C2 L2 + L1 pan · 15 م` · `سحب · 81%` · `صافٍ فوق بقعتك` · `إعادة عرض هذا المرور على الكرة الأرضية` · `إعادة العرض` · `مشاركة هذه الصورة` · `مشاركة` · `كل الصور` · `الصورة 3` |

**`timelapse`**

| Key | Arabic |
|---|---|
| `dialog` · `title` · `close` · `escKey` | `عبر السنين: [PLACE]` · `عبر السنين` · `إغلاق` · `Esc` |
| `play` · `pause` · `slider` · `frameList` | `تشغيل` · `إيقاف مؤقت` · `الإطار` · `الإطارات` |
| `date` · `dayMonth` · `readout` | `22 أكتوبر 2015` · `22 أكتوبر` · `22 أكتوبر 2015 · Sentinel-2A` |
| `frameSpoken` | `الإطار 3 من 12: 22 أكتوبر 2015` |
| `captionYearly` · `captionSeason` | `11 نظرة صافية · واحدة كل عام` · `11 نظرة صافية · واحدة كل خريف` (`كل شتاء`، `كل ربيع`، `كل صيف`، `كل خريف`) |
| `captionGathering` · `captionShort` · `captionError` | `نظرة صافية كل عام · منذ 2015` · `لا عرض عبر السنين لهذا المكان` · `لم يستجب الأرشيف` |
| `note` | `كل إطار هو المربع نفسه بضلع 10 كم، التقطته أقمار Sentinel-2، وضُبطت ألوانه كسائر الصور هنا. يستهدف كل عام موسمًا مختلفًا؛ ويُستبعد العام الذي لا نظرة صافية فيه.` |
| `noteOneSeason` | `… كل الأعوام من الموسم نفسه؛ ويُستبعد العام الذي لا نظرة صافية فيه في ذلك الموسم.` |
| `source` | `Copernicus Sentinel-2، عبر Planetary Computer` |
| steps | `جارٍ البحث في الأرشيف` · `جارٍ اختيار النظرات الصافية` · `جارٍ تحميض الإطارات` · `…، 3 من 12` |
| `tooCloudy` · `tooFew` | `سحب هذا المكان أكثف من أن تسمح بعرض عبر السنين.` · `لا نظرة صافية منذ 2015 · يلزم 3` (`نظرة صافية واحدة`، `نظرتان صافيتان`) |
| `noAnswer` · `unreachable` · `retry` | `لم يستجب الأرشيف.` · `تعذّر الوصول إلى Planetary Computer` · `إعادة المحاولة` |
| share and video | `مشاركة` · `تم نسخ الرابط` · shareTitle `عبر السنين: [PLACE]` · `فيديو` · `جارٍ الإنشاء 42%` · `فشل الفيديو` · `حفظ الفيديو` · `لا يوجد في هذا المتصفح مُرمّز H.264: يعمل الملف في Chrome وFirefox` · fileNamePlace `place` |

**`share` (the sheet)**: `مشاركة هذا المرور` · `مشاركة هذه الصورة` · `مشاركة هذا الأسبوع` · `إغلاق` · `إغلاق (Esc)` ·
`مشاركة الصورة` · `جارٍ تجهيز الصورة…` · `مشاركة` · `نسخ الرابط` · `تم النسخ` · `النشر على X` · `نسخ الصورة` · `حفظ PNG` ·
`إعادة المحاولة` · `linkLabel` `الرابط` · `رابط مباشر: تعذّر إنشاء الرابط المختصر الآن` · `جارٍ إنشاء الرابط…` ·
`يُنشأ عند المشاركة` · `postLabel` `النص` · `تعذّر رسم البطاقة هنا؛ لكن الرابط يعمل.`

**`engine`**

| Key | Arabic |
|---|---|
| `progress` | `جارٍ تحميل كتالوج المدارات` · `الكتالوج · 16,912 جسمًا` · `جارٍ حساب 412 مدارًا · 7 أيام` · `جارٍ حساب المدارات · 120 / 412` · `جارٍ البحث في أرشيف Sentinel-2 + Landsat` · `مطابقة 31 مشهدًا مع 412 مرة مرور` · `جارٍ التحقق من فسيفساء ناسا للطقس` · `… · 12 / 35` · `412 مرة مرور · 31 صورة` |
| `note.archiveSlow` · `archiveDown` | `تأخر أرشيف Sentinel-2 وأرشيف Landsat في الرد؛ لذا تظهر مرات المرور من الحسابات المدارية فقط.` · `تعذّر الوصول إلى أرشيف Sentinel-2 وأرشيف Landsat؛ لذا تظهر مرات المرور من الحسابات المدارية فقط.` |
| `sentinel2Thumbnails` · `sentinel2EarthSearch` | `أُدرجت مشاهد Sentinel-2 عبر Earth Search؛ تظهر بعض المشاهد صورةً مصغرة للمشهد كاملًا، لا مقتطعة حول المكان.` · `أُدرجت مشاهد Sentinel-2 عبر Earth Search (بحث Planetary Computer غير متاح).` |
| `sentinel2Down` · `landsatDown` · `openOcean` | `تعذّر الوصول إلى أرشيف Sentinel-2؛ قد تنقص صور Sentinel-2.` · the same for Landsat · `هذه البقعة خارج خطة تصوير Sentinel-2 (محيط مفتوح).` |
| `elementsOld` · `elementsNewer` | `عمر العناصر المدارية 5 أيام، لذا قد تختلف أوقات المرور بضع دقائق.` · `أُعيد حساب مرات المرور هذه من عناصر مدارية أحدث، لذا قد تختلف أوقاتها بضع دقائق.` |
| `gibsUnconfirmed(n)` | one: `تأخرت خدمة NASA GIBS في تأكيد صورة VIIRS واحدة؛ يرصد جهاز VIIRS الأرض كلها يوميًا، لذا يُحسب ذلك المرور رصدًا.` · other: `تأخرت خدمة NASA GIBS في تأكيد 12 صورة VIIRS؛ يرصد جهاز VIIRS الأرض كلها يوميًا، لذا تُحسب مرات المرور تلك رصدًا.` |
| `gibsSlowAll` · `gibsDownAll` | `لم تستجب خدمة NASA GIBS في الوقت المناسب، لذا لا تظهر صور أقمار الطقس.` · `تعذّر الوصول إلى خدمة NASA GIBS، لذا لا تظهر صور أقمار الطقس.` |
| `gibsSlowSome` · `gibsDownSome` | `لم تُرسل خدمة NASA GIBS في الوقت المناسب 3 صور لأقمار الطقس من أصل 12؛ لذا تظهر مرات المرور هذه ضمن «رصد على الأرجح».` · `أخفقت خدمة NASA GIBS في إرسال 3 صور لأقمار الطقس من أصل 12؛ …` (forms by `missing`) |

**`time`**

| Key | Arabic |
|---|---|
| `weekdayShort` | `الأحد` (Arabic has no short weekday) |
| `dayCompact` | `1` (the day number alone; the weekday goes in the tooltip) |
| `day` · `dayMonth` · `daySpoken` | `الأحد، 1 نوفمبر` · `29 أكتوبر` · `الجمعة، 6 نوفمبر` |
| `dayRange` | `1 ← 8 نوفمبر` · `29 أكتوبر ← 5 نوفمبر` |
| `stamp` | `الأحد، 1 نوفمبر · 11:21 EST` |
| `relative` | `للتو` · `قبل 12 د` · `قبل 30 س` · `قبل يومين` · `قبل 3 أيام` · `بعد 3 س` (built from `relativeParts`) |
| `relativeSpoken` | `قبل لحظات` · `قبل 12 دقيقة` · `قبل ساعة واحدة` · `قبل 41 ساعة` · `بعد 3 ساعات` (Intl long for the past; the future is built with `بعد`, never Intl's `خلال`) |
| durations | `38 ث` · `4 د 12 ث` · `1 س 02 د` |
| `atSea` | `UTC−9 · في البحر` |

**`about`** (the owner's copy, so translate exactly)

| Key | Arabic |
|---|---|
| `title` · `bar` · `close` · `sectionsLabel` | `[['هكذا'], [accent('يعمل'), '.']]` · `حول` · `إغلاق` · `الأقسام` |
| `lede` | `أي بقعة على الأرض: نحسب الأقمار الصناعية التي مرّت فوقها خلال الأسبوع الماضي، ثم نبحث عن الصور التي التقطتها. كل ذلك يجري في متصفحك، على بيانات عامة.` |
| `sections` | `باختصار` · `كيف نجد مرات المرور` · `معنى التسميات` · `ما لا نستطيع رؤيته` · `الخصوصية` · `المصادر` · `لوحة المفاتيح` |
| `short.live` | `هل البث مباشر؟` / `ليس تمامًا. تصل الصور إلى الأرشيفات بعد ساعات قليلة إلى يومين من التقاطها، لذا قد لا تكون لأحدث مرات المرور صورة بعد.` |
| `short.seeMe` | `هل يمكن لقمر صناعي أن يراني؟` / `لا. أدق بكسل هنا عرضه 10 أمتار. السيارة بكسل واحد. ولا أثر لك فيه.` |
| `short.every` | `هل هذه كل الأقمار الصناعية؟` / `لا. معظم الأقمار العسكرية وأقمار التجسس ليست في الكتالوجات العامة، والشركات لا تقول أين توجّه كاميراتها.` |
| `method.orbits` | `لكل جسم في المدار مجموعة أرقام عامة تصف مساره. ينشرها موقع [CelesTrak] من بيانات تتبّع قوة الفضاء الأمريكية، ونجلب نسخة جديدة كل ست ساعات.` |
| `method.loaded` | `حمّلت هذه الصفحة 16,893 جسمًا، جُلبت في 2026-11-08 03:34Z.` |
| `method.sgp4` | `نُشغّل كل قمر صناعي عبر SGP4، نموذج المدارات المعياري، على مدى الأيام السبعة الماضية، ونسجّل كل مرة كانت فيها بقعتك ضمن ما يستطيع رؤيته.` |
| `facts.straightDown` | `عموديًا إلى الأسفل` / `تنظر أقمار Sentinel-2 وLandsat عموديًا إلى الأسفل نحو شريط من الأرض، عرضه نحو 290 كم في Sentinel-2 و185 كم في Landsat. يجب أن يكون مكانك داخل الشريط.` |
| `facts.tilting` | `الكاميرات المائلة` / `كثير من الأقمار التجارية يمكنها أن تميل من 30 إلى 45 درجة. إن كان مكانك في متناولها، نسمّي ذلك «كان بإمكانه النظر إلى هنا».` |
| `facts.daylight` | `ضوء النهار` / `تحتاج الكاميرات العادية إلى الشمس. المرور في الظلام لا يُحسب صورة أبدًا.` |
| `facts.radar` | `الرادار` / `لا يحتاج القمر الصناعي Sentinel-1 إلى الشمس. يُرسل موجات ميكروية ويسجّل صداها، فيرى عبر السحب وفي الليل، ناظرًا إلى أحد جانبي مساره. صوره متاحة للعموم أيضًا، لذا نعرضها بالرمادي: الساطع أرض وعرة ومبانٍ، والداكن ماء ساكن.` |
| `facts.weather` | `أقمار الطقس` / `يستقر بعضها فوق خط الاستواء ويرصد نصف الكوكب كل 10 دقائق. إن كان مكانك في جهتها من الأرض، فأنت في كل إطار.` |
| `method.archives` | `ثم نبحث في أرشيفات الصور (Microsoft Planetary Computer وElement 84 وناسا) ونطابق كل صورة مع المرور الذي التقطها. كل صورة هنا هي الصورة الحقيقية، مقتطعة حول بقعتك.` |
| `photoFacts` | `المعالجة` / `تُضبط ألوان صور Sentinel-2 وLandsat وتُنعَّم وتُزاد حدتها قليلًا لتناسب شاشتك، بالطريقة نفسها في الصورة كلها. لا يُضاف شيء ولا يُحذف.` · `أين الشمال` / `تحتفظ صور Sentinel-2 وLandsat بشبكة الخريطة الخاصة بالأرشيف لمكانك، لذا قد يميل الشمال بضع درجات عن الأعلى. عند فتح صورة، يبيّن سهم N فيها الاتجاه بالضبط.` |
| `accuracy` | `المواقع الدقيقة` / `دقة بيانات المدارات العامة نحو كيلومتر، وتتراجع قليلًا كل يوم. قد تختلف الأوقات بضع ثوانٍ.` · `الأقمار السرية` / `بعض أفضل الكاميرات في المدار ملك للجيوش. لا تظهر هنا.` · `السحب` / `كثير من الصور سحب فقط. حين يخبرنا الأرشيف، نفحص البكسل الدقيق فوق بقعتك ونقول ذلك.` · `التأخير` / `قد تستغرق الصور يومًا أو يومين لتظهر.` |
| `privacy.where` · `kept` | `أين تجري الحسابات` / `تجري حسابات المدارات في متصفحك.` · `ما نحتفظ به` / `نعدّ عمليات البحث بحسب المدينة ومنطقة تقريبية عرضها 10 كم، لا بحسب بقعتك الدقيقة أبدًا، ونحتفظ بإحصاء لما يُفتح ويُشارك. لا عناوين IP، ولا ملفات تعريف ارتباط خاصة بنا، ولا شيء يربط زيارة بأخرى.` |
| `privacy.others` | `من يرى ذلك أيضًا` / `معظم أسماء الأماكن من قائمة مدمجة في الموقع. وتذهب عمليات البحث الأخرى إلى Open-Meteo أو Photon أو Nominatim. تُحمَّل الصور مباشرة من الأرشيفات. يحصي مستضيفنا مشاهدات الصفحات والسرعة دون ملفات تعريف الارتباط، وقد يضع ملف تعريف ارتباط أمنيًا واحدًا للتمييز بين البشر والروبوتات. لا نقرؤه أبدًا.` |
| `privacy.links` | `روابط المشاركة` / `لا تُنشأ إلا عند مشاركة شيء. كل من لديه الرابط يرى اسم المكان، وبقعة مقرّبة إلى نحو 1 كم، والمرور المختار.` |
| `credits` | `من صنع` / `Armaan، [@armaangupt0] على X` · `الصور من خدمة GIBS التابعة لناسا، ضمن EOSDIS. صور GOES عبر NOAA وCIRA، وHimawari عبر JMA.` · `الأرشيفات` · `المدارات` · `أسماء الأماكن` · `خرائط الأرض` · `الخطوط` / `Instrument Sans وSerif من Instrument، وMartian Mono من Evil Martians، وNoto Sans Arabic وAmiri للعربية (SIL OFL).` |
| `keys` | `البحث عن مكان` · `التنقل بين الاقتراحات` · `اختيار` · `التنقل بين مرات المرور` · `الصورة السابقة / التالية` · `تكبير الصورة` · `التكبير (عند فتح الصورة)` · `تشغيل إعادة العرض أو إيقافها` · `رجوع أو إغلاق` · `هذه الصفحة` |
| `keyNames` | `Enter` · `مسافة` · `Esc` |
| `builtBy` · `footerNote` | `من صنع [@armaangupt0]` · `صُنع من بيانات عامة. لم نلتقط أيًّا من هذه الصور.` |

**Small namespaces**: `switcher` `اللغة` / `اللغة: العربية. تغيير`; `system` `إغلاق` · `توسيع اللوحة` ·
`طي اللوحة`; `geo.where(rest, country)` `[rest]، [country]` (`rest` stays whole and as it came); `sats`: one sentence
each, with numbers grouped by `fmt('ar')` and symbol units (`بعرض 3,040 كم`). "Its" becomes ـه (the satellite), except
in the ISS and Tiangong blurbs, where it becomes ـها (the station). A sensor as subject takes `جهاز` (`يرصد جهاز VIIRS`).

## 4. Glossary

### 4.1 Terms

Gender is marked (m) masculine or (f) feminine. Plural forms follow §5.4.

| English | ar | Notes |
|---|---|---|
| satellite | قمر صناعي (m), pl. أقمار صناعية | Always in full. Never `قمر` alone (it means the Moon), except in fixed compounds: `أقمار الطقس`، `أقمار الرادار`، `أقمار التصوير`. Never `ساتل` (ITU jargon). |
| head noun before a name | القمر الصناعي [SAT] | No-break space between `الصناعي` and the name. |
| crewed station | المحطة الفضائية [SAT] (f) | ISS and Tiangong (the only crewed profiles). `المحطات المأهولة` in general. |
| a satellite (unnamed) | قمر صناعي | Indefinite, after the verb. Also `card.aSatellite`. |
| pass | مرور (m) | `هذا المرور`، `من هذا المرور`. Never `تمريرة` (football), `تحليق` (warplanes), or `عبور` as a noun. |
| passes (label) | مرات المرور | `كل مرات المرور`، `02 / مرات المرور`. `المرور` alone can read as "traffic". |
| times (count of passes) | مرة (f), pl. مرات | The unit for every verdict. |
| crossed / passed | مرّ فوق … | Always with the shadda: `مر` means "bitter". Never `عبر` as a verb. |
| within view of | على مرأى من | The could verdict's prose. The label "In view" is `ضمن المدى`. |
| watched (product verb) | رصد / يرصد; masdar رصد | Neutral and scientific (`مرصد` means observatory). Never `ترصّد` (to stalk). |
| swept over (likely) | غطّى | The remote-sensing `تغطية`. Never `مسح` or `اجتاح`. |
| photo / image | صورة (f) | Add `فوتوغرافية` or `رادارية` only when the English contrasts them. |
| made public / public image | نُشرت للعموم / صورة منشورة للعموم | Never `صورة عمومية`, and never `عامة` where it could read "general". |
| archive | أرشيف (m), pl. أرشيفات | Never the dual (`أرشيفا`، `أرشيفي`): repeat the noun (`أرشيف Sentinel-2 وأرشيف Landsat`). |
| scene | مشهد (m), pl. مشاهد | The remote-sensing sense only. |
| swath / swath width | نطاق المسح (m) / بعرض 290 كم | Never `شريحة`, and never `البالغ 290 كم`. |
| off-nadir | الانحراف | Prose: `بانحراف 5.4° عن العمودي`; aria and About: `الانحراف عن الاتجاه العمودي`. Never `الميل` (orbital inclination, solar declination) or `خارج النظير`. |
| looking to the side (radar) | ناظرًا بزاوية 32.1° إلى الجانب | |
| straight down (nadir) | عموديًا إلى الأسفل | The technical `النظير` appears only in About, glossed. |
| ground track | المسار الأرضي (m) | |
| orbit / orbital elements | مدار (m) / العناصر المدارية | `TLE` stays in Latin. |
| altitude | الارتفاع (m) | Height above the ground, never an angle. |
| elevation (angle above the horizon) | زاوية الارتفاع (f) | Always with `زاوية`. The unit after degrees is `ارتفاعًا`. |
| sun elevation | ارتفاع الشمس | |
| ground speed | السرعة الأرضية (f) | Prose: `بسرعة 7.46 كم/ث`. |
| heading / ascending / descending | الاتجاه / صاعد / هابط | |
| closest approach | أقرب نقطة (f) | |
| field of regard | مدى التوجيه | `مدى التوجيه ±30°`. |
| steerable / non-steerable camera | كاميرا قابلة للتوجيه / كاميرا غير قابلة للتوجيه | Never `كاميرا ثابتة` (that reads as CCTV, and `ثابت` belongs to geostationary). |
| geostationary | ثابت بالنسبة إلى الأرض; label ثابت | `أقمار الطقس الثابتة`. The only use of `ثابت`. |
| full disc / scan line / scan | القرص الكامل / خط المسح / مسح | `مسح` is a noun only: `خط المسح`، `نطاق المسح`، `يُجري مسحًا`. |
| cloud cover | الغطاء السحابي (m) | |
| clouded over | تحت السحب | Never `غائمة` on a picture (`صورة غائمة` means blurry). |
| mostly cloud | معظم المشهد سحب | |
| clear (sky) / cirrus / cloud shadow | صافٍ / سمحاق رقيق / ظل سحابة | Never `واضح` (it means "obvious"). |
| spot (your spot) / place | البقعة، بقعتك (f) / المكان (m) | Our nouns, not [PLACE]. |
| pixel / resolution | بكسل (m), pl. بكسلات / الدقة (f) | `بدقة 10 أمتار لكل بكسل`. Position accuracy is `هامش الخطأ`. |
| radar | رادار (m); adj. راداري | `صورة رادارية`، `أقمار الرادار`. |
| SAR | رادار ذو فتحة اصطناعية (SAR) | |
| X-band / C-band / L-band | النطاق X / C / L | Always followed by the letter, so it never clashes with `نطاق المسح`. |
| band (spectral) | حزمة طيفية (f), pl. حزم | Label `الحزمة`. Never `نطاق`. `13 حزمة طيفية`. |
| panchromatic | بانكروماتي (أحادي اللون، أدق) | `بكسلات بانكروماتية بدقة 15 م`. |
| pan-sharpened | حُسّنت دقتها بالحزمة البانكروماتية | |
| multispectral | متعدد الأطياف | |
| constellation / cubesat | كوكبة / قمر صناعي مكعب | |
| sun-synchronous / dawn–dusk orbit | متزامن مع الشمس / مدار الفجر والغسق | |
| sensor / instrument / imager | مستشعر / جهاز / جهاز تصوير | |
| debris / rocket body | حطام فضائي / جسم صاروخ | |
| weather mosaic / daily mosaic | فسيفساء الطقس / الفسيفساء اليومية (f) | `فسيفساء ناسا اليومية`. Counted as `صورة فسيفساء`. |
| true colour | الألوان الطبيعية | |
| infrared / visible / colour (band) | الأشعة تحت الحمراء; label تحت الحمراء / مرئي / ألوان | The tight timeline chip keeps `IR`. |
| time-lapse (feature name) | عبر السنين | Row title, viewer button, bar, aria, share title. Never `فاصل زمني` (it reads as "time interval") or `تايم لابس`. |
| frame / developing frames | إطار (m), pl. إطارات / تحميض الإطارات | The darkroom word, on purpose. |
| replay | إعادة العرض (f) | Never `إعادة التشغيل` ("restart"), and never `إعادة` alone. |
| closest look / most recent clear look | أقرب نظرة / أحدث نظرة صافية | Never `آخر نظرة` (§8). The short form is `نظرة صافية`. |
| catalog | كتالوج (m) | `كتالوج المدارات`. Never `فهرس`. |
| epoch | الحقبة (f) | |
| objects | أجسام (m pl), sing. جسم | `12,847 جسمًا`. |
| sub-solar point | نقطة تعامد الشمس | HUD label `الشمس`. |
| daylight / twilight / night | نهار / شفق / ليل | |
| private operator / operator | جهة تشغيل خاصة / المشغّل | `خاص` alone can read as "special". |
| commercial | تجاري | |
| weather satellite / imaging satellite | قمر طقس, pl. أقمار الطقس / قمر تصوير, pl. أقمار التصوير | `تصوير` is fine as a category noun, but `صوّر` is never the product verb. |
| military / spy satellites | الأقمار العسكرية وأقمار التجسس | About's category sentence only (the owner's words). Never `تجسّس` as a verb for what a satellite did. |
| track (we track) | نتتبّع | Never `نتعقّب`. |
| plan view | منظر علوي (m) | |
| geometry (section) | القياسات | Never `الهندسة`. |
| pass geometry (card chip) | مسار المرور | |
| timeline | الخط الزمني (m) | |
| pin / drop a pin | دبوس (m) / وضع دبوس | |
| coordinates | إحداثيات (f pl) | Shown in Latin notation. |
| globe | الكرة الأرضية | |
| share / download / loading | مشاركة / تنزيل / تحميل | `تحميل` only for loading: it also means "upload". |
| copy link / copied / link copied | نسخ الرابط / تم النسخ / تم نسخ الرابط | |
| the app (on the card) | التطبيق | Not `الموقع`, which this product also uses for "your location". |
| search a place / use my location / locate me / near me | البحث عن مكان / استخدام موقعي / حدّد موقعي / بالقرب مني | |
| surprise me / or try | فاجئني / أمثلة | |
| how this works | كيف يعمل | About's title: `هكذا` / `*يعمل*.` |
| last 7 days / this week / that week | آخر 7 أيام / هذا الأسبوع / ذلك الأسبوع | |
| local time | التوقيت المحلي; label محلي | |
| just now (compact / spoken) | للتو / قبل لحظات | Never `الآن`, which means "now". |
| in 3 h | بعد 3 س | Never Intl's `خلال` ("within"). |
| Try again / Cancel / Close / Dismiss | إعادة المحاولة / إلغاء / إغلاق / إغلاق | `تجاهل` ("ignore") is the wrong action. |
| Fault / Something went wrong | عطل / حدث خطأ. | |
| Acquiring / acquisition / imaged / acquired | جارٍ الالتقاط / الالتقاط / التقاط / التُقطت | Never `اكتساب` or `استحواذ`. |
| LINE (pushbroom counter) | السطر | `السطر 0412 ← 1024`. |
| Watched continuously | رصد متواصل | |
| Shared with you | تمت مشاركته معك | |
| Language | اللغة | |

### 4.2 Compass

| Id | Moving (`heading`) | Offset (`dir`) | In the sky (`toward`) |
|---|---|---|---|
| n | نحو الشمال | إلى الشمال | باتجاه الشمال |
| ne | نحو الشمال الشرقي | إلى الشمال الشرقي | باتجاه الشمال الشرقي |
| e | نحو الشرق | إلى الشرق | باتجاه الشرق |
| se | نحو الجنوب الشرقي | إلى الجنوب الشرقي | باتجاه الجنوب الشرقي |
| s | نحو الجنوب | إلى الجنوب | باتجاه الجنوب |
| sw | نحو الجنوب الغربي | إلى الجنوب الغربي | باتجاه الجنوب الغربي |
| w | نحو الغرب | إلى الغرب | باتجاه الغرب |
| nw | نحو الشمال الغربي | إلى الشمال الغربي | باتجاه الشمال الغربي |

- `pass.compass16` (readouts such as `58° · SSW` and `SSW · هابط`, at most 3 characters in narrow mono cells) stays in
  Latin letters: `N`, `NNE`, … `NNW`. Arabic has no established 16-point abbreviations. Its single letters would clash
  with `ث`، `س`، `د` (seconds, hours, minutes) in the same rows. And the coordinates beside them are Latin notation too.
- Coordinates (`16.2°S 063.0°E`, `43.4723°N 80.5449°W`) and a geostationary seat (`0.2°W`) arrive formatted and
  zero-padded so the right-aligned readouts never jitter. Keep them exactly as given, as one left-to-right island.
- The card's `PassFacts.heading` (0–7) uses the "moving" column: `، متجهًا نحو الجنوب`.

### 4.3 Curated places (`places` namespace)

Rules: use the established Arabic exonym. A chip is at most about 14 characters and starts with an Arabic letter.
Sublabels go most specific first, joined with `، `. Country names are exactly as `Intl.DisplayNames('ar-u-nu-latn')`
writes them (Hong Kong in its short form, §8). Two countries are joined with `و` in Arabic alphabetical order (ignoring
`ال`). Never use `قطاع` for "Strip" outside the Gaza Strip.

| id | chip | label | sublabel |
|---|---|---|---|
| area51 | المنطقة 51 | المنطقة 51 | بحيرة غروم، نيفادا، الولايات المتحدة |
| centralPark | سنترال بارك | سنترال بارك | نيويورك، الولايات المتحدة |
| giza | الجيزة | أهرامات الجيزة | الجيزة، مصر |
| uluru | | أولورو | الإقليم الشمالي، أستراليا |
| palmJumeirah | | نخلة جميرا | دبي، الإمارات العربية المتحدة |
| worldIslands | | جزر العالم | دبي، الإمارات العربية المتحدة |
| grandCanyon | | الأخدود العظيم | أريزونا، الولايات المتحدة |
| meteorCrater | | فوهة النيزك | أريزونا، الولايات المتحدة |
| lowerManhattan | | مانهاتن السفلى | نيويورك، الولايات المتحدة |
| lasVegasStrip | | لاس فيغاس ستريب | نيفادا، الولايات المتحدة |
| hooverDam | | سد هوفر وبحيرة ميد | نيفادا وأريزونا، الولايات المتحدة |
| goldenGate | | البوابة الذهبية | سان فرانسيسكو، الولايات المتحدة |
| kennedySpaceCenter | | مركز كينيدي للفضاء | فلوريدا، الولايات المتحدة |
| washingtonDc | | واشنطن العاصمة | ناشونال مول، الولايات المتحدة |
| mountStHelens | | جبل سانت هيلينز | ولاية واشنطن، الولايات المتحدة |
| niagaraFalls | | شلالات نياغارا | أونتاريو، كندا |
| panamaCanal | | قناة بنما | أهوسة غاتون، بنما |
| rioDeJaneiro | | ريو دي جانيرو | جبل السكر وكوباكابانا، البرازيل |
| paris | | باريس | إيل دو فرانس، فرنسا |
| venice | | البندقية | فينيتو، إيطاليا |
| vesuvius | | جبل فيزوف | نابولي، إيطاليا |
| istanbul | | إسطنبول | البوسفور، تركيا |
| chernobyl | | تشيرنوبل | مقاطعة كييف، أوكرانيا |
| tableMountain | | جبل الطاولة | كيب تاون، جنوب أفريقيا |
| kilimanjaro | | كليمنجارو | كليمنجارو، تنزانيا |
| everest | | جبل إيفرست | الصين ونيبال |
| angkorWat | | أنغكور وات | سييم ريب، كمبوديا |
| singapore | | سنغافورة | مارينا باي، سنغافورة |
| hongKong | | هونغ كونغ | ميناء فيكتوريا، هونغ كونغ |
| tokyo | | طوكيو | طوكيو، اليابان |
| fuji | | جبل فوجي | شيزوكا، اليابان |
| sydneyHarbour | | ميناء سيدني | سيدني، أستراليا |
| richat | | عين الصحراء | الصحراء الكبرى، موريتانيا |
| greatBlueHole | | الثقب الأزرق العظيم | شعاب لايتهاوس، بليز |
| boraBora | | بورا بورا | جزر المجتمع، بولينيزيا الفرنسية |
| hardyReef | | شعاب هاردي | الحاجز المرجاني العظيم، أستراليا |
| male | | ماليه | أتول ماليه الشمالي، جزر المالديف |
| deadSea | | برك الملح في البحر الميت | الحوض الجنوبي، الأردن وإسرائيل |
| binghamCanyon | | منجم بينغهام كانيون | يوتا، الولايات المتحدة |
| mountWhaleback | | منجم جبل ويلباك | بيلبارا، أستراليا |
| etna | | جبل إتنا | صقلية، إيطاليا |
| santorini | | سانتوريني | جزر كيكلادس، اليونان |
| teide | | جبل تيدي | تينيريفي، إسبانيا |
| kilauea | | كيلاويا | هاواي، الولايات المتحدة |
| craterLake | | بحيرة كريتر | أوريغون، الولايات المتحدة |
| glenCanyonDam | | سد غلين كانيون | بيج، أريزونا، الولايات المتحدة |
| gardenCity | | الحقول الدائرية في غاردن سيتي | كانساس، الولايات المتحدة |
| almeria | | البيوت المحمية في المرية | الأندلس، إسبانيا |
| gibraltar | | جبل طارق | مضيق جبل طارق |
| suezCanal | | قناة السويس | الإسماعيلية، مصر |
| aswanDam | | السد العالي | بحيرة ناصر، مصر |
| wadiRum | | وادي رم | العقبة، الأردن |
| sossusvlei | | سوسوسفلي | صحراء ناميب، ناميبيا |
| victoriaFalls | | شلالات فيكتوريا | زامبيا وزيمبابوي |
| threeGorges | | سد الخوانق الثلاثة | هوبي، الصين |
| shanghai | | شنغهاي | نهر هوانغبو، الصين |
| itaipu | | سد إيتايبو | باراغواي والبرازيل |

Notes: `عين الصحراء` is the name Arab readers know the Richat Structure by. The Almería greenhouses use the city's own
Arabic name, `المرية`. The Garden City "crop circles" are irrigation fields (`الحقول الدائرية`), not `دوائر المحاصيل`.
`ولاية واشنطن` keeps Mount St. Helens apart from the capital.

## 5. Grammar strategies for runtime slots

### 5.1 [PLACE]: the gazetteer's name, uninflectable

Names arrive in English (`Waterloo`), in Latin transliteration (`Al Jizah`), in Arabic script, or in another script.
Code cannot add or remove an article, merge a preposition with `ال`, or know the name's gender. The rules:

1. **Never in the subject slot.** In a verb-first sentence, an unmarked noun right after the verb reads as its subject.
   So [PLACE] never directly follows a verb whose subject has not yet been named. Write `لم يرصد أي قمر صناعي نتتبّعه
   [PLACE]`, not `لم يرصد [PLACE] أي قمر صناعي`. After a named subject (`رصد 256 قمرًا صناعيًا [PLACE]`، `رصد راداره
   [PLACE]`), in a nominal sentence (`القمر الصناعي [SAT] رصد [PLACE]`) or in a relative clause (`ما الذي رصد [PLACE]`),
   the place is the object and reads as one.
2. **Never the subject of a verb or of `كان`**, because the verb would have to agree: `كان [PLACE] داخل نطاق مسحه`
   becomes `كان نطاق مسحه يشمل [PLACE]`.
3. **Only separate prepositions:** `فوق`، `في`، `إلى`، `من`، `على`، `عن`، `قرب`، `حول`، `بين`، `على مرأى من`. Never an
   attached `لـ`، `بـ`، `كـ`، `و` or `فـ` on [PLACE]: `لـWaterloo` is ugly, and `ل + القاهرة` would have to become
   `للقاهرة`, which code cannot do. "Time-lapse of Waterloo" is `عبر السنين: [PLACE]`.
4. **A construct is safe:** `صورة [PLACE]`، `سماء [PLACE]`. Nothing in the name changes.
5. **No pronoun refers back to [PLACE]** (`ـه`، `ـها`، `هو`، `هي`), because its gender is unknown. Use `المكان` (m, our
   noun) or say nothing: `لم نجد صورة منشورة من هذا المرور`.
6. **No adjective after [PLACE]**, and never an added head noun (`مدينة`، `منطقة`، `موقع`): the place may be an ocean, a
   landmark or a country.
7. **No article added or removed.** The English "the Pacific Ocean" logic does not apply. The serif covers exactly the
   name.
8. **Never at the start of a plain-text sentence** (§6.2).
9. **In the DOM**, [PLACE] in an accent part is isolated by its element. In a plain DOM string, wrap a place that can
   sit next to another Latin slot in FSI…PDI (§6.2).

### 5.2 [SAT] as subject: gender unknown

- **The head noun carries the gender:** `القمر الصناعي [SAT]` with a masculine verb, and every later reference is
  masculine (`كان ينظر`، `راداره`، `مشغّله`، `نطاق مسحه`، `لأمكنه`، `جهازه`).
- **Crewed:** the ISS and Tiangong are `المحطة الفضائية [SAT]`, feminine throughout (`مرّت`، `كانت`، `صورها`). The
  messages that can name them (`pass.overhead`, `card.headlineBy.overhead`, `card.crossed`, `share.post.overhead`)
  take a `crewed` flag (see the open questions). A message without it uses the satellite frame.
- **Unknown (`sat` undefined):** indefinite `قمر صناعي` after the verb (`رصد قمر صناعي [PLACE]`). An indefinite noun
  cannot open a nominal sentence. Chips and the plan callout print `card.aSatellite` (`قمر صناعي`).
- **Two Latin names never touch.** When [PLACE] would be the object directly after the satellite's name (the imaged and
  likely share frames), the sentence is nominal: `القمر الصناعي [SAT] رصد [PLACE]`، `القمر الصناعي [SAT] غطّى [PLACE]`.
  With a preposition between them (`فوق`، `على مرأى من`), keep the verb first. A sensor and a place are kept apart the
  same way: `ضمّ جهاز تصويره MODIS صورة [PLACE] إلى …`.
- **Missions and constellations** take `أقمار` (a non-human plural, with a feminine singular verb): `لا تسجّل أقمار
  Sentinel-2`، `التقطته أقمار Sentinel-2`.
- **Labels and chips** (no verb) carry the name alone: `Sentinel-2B · 10 م`.
- Never transliterate a name (`سنتينل`), inflect it, or put `ال` on it.

### 5.3 Services, archives, agencies and operators as subjects

A Latin service, archive, agency or company name is never a bare subject. Give it a head noun (`خدمة`، `أرشيف`،
`وكالة`، `شركة`، `موقع`، `جهاز`) or use an impersonal frame:

- `لم تستجب خدمة NASA GIBS في الوقت المناسب، لذا لا تظهر صور أقمار الطقس.`
- `تعذّر الوصول إلى Planetary Computer.`
- `يُرسل موقعك إلى خدمة Photon لتسمية المكان.`
- `ينشرها موقع CelesTrak …`، `يرسم أرشيف Planetary Computer وناسا الصور عند الطلب`، `يرصد جهاز VIIRS الأرض كلها`.

Never write the dual of a head noun before names (`أرشيفا`، `أرشيفي`، `قمرا`): it misreads as an accusative or as "my
archive". Repeat the noun instead: `أرشيف Sentinel-2 وأرشيف Landsat`، `قمر الرادار Umbra وقمر الرادار Capella`.

### 5.4 [NUM]: CLDR plural categories for Arabic

`fmt('ar').plural` (tag `ar-u-nu-latn`) answers six categories. They depend on the **last two digits**: 1,204 is
`few`, 1,215 is `many`, 1,200 is `other`. Never test `n === 1`; always go through `plural`.

| Category | Numbers | Noun form | Example |
|---|---|---|---|
| `zero` | 0 | its own sentence (`لم … أي صورة`); in readouts, the singular (`0 مرة`) | |
| `one` | 1 | no digit in sentences: noun + `واحد / واحدة` | `صورة واحدة`، `قمر صناعي واحد` |
| `two` | 2 | no digit in sentences: the dual | nominative `ـان` (`صورتان`), accusative and genitive `ـين` (`مرتين`) |
| `few` | 3–10, 103–110, 1,003… | `[NUM]` + plural, genitive | `7 صور`، `3 أيام`، `1,204 مرات` |
| `many` | 11–99, 111–199, 1,011… | `[NUM]` + singular, accusative (tanween `ـًا` where the noun takes it) | `31 قمرًا صناعيًا`، `11 يومًا`، `42 مرة` |
| `other` | 100–102, 200, 1,000, decimals | `[NUM]` + singular, genitive | `100 قمر صناعي`، `200 صورة` |

**Sentences and readouts.** In a sentence, one and two are words (`مرة واحدة`، `مرتين`). Where the number is its own
display figure with the unit beside it (verdict tiles, `countStack`, card readouts, `geo.images`), the digit stays and
the unit agrees: `0 مرة`، `1 مرة`، `2 مرتان`، `3 مرات`، `31 مرة`، `100 مرة`. Where number and noun form one text run
(`3 مرات` in a group header), use the sentence forms.

**Case.** Only the dual shows case in this product. Use `ـان` for a subject; use `ـين` for an object, after a
preposition, or adverbially ("twice").

| Noun | one | two (nom. / acc.-gen.) | few | many | other |
|---|---|---|---|---|---|
| قمر صناعي (m) | قمر صناعي واحد | قمران صناعيان / قمرين صناعيين | [NUM] أقمار صناعية | [NUM] قمرًا صناعيًا | [NUM] قمر صناعي |
| صورة (f) | صورة واحدة | صورتان / صورتين | [NUM] صور | [NUM] صورة | [NUM] صورة |
| مرة (f) | مرة واحدة | مرتان / مرتين | [NUM] مرات | [NUM] مرة | [NUM] مرة |
| يوم (m) | يوم واحد | يومان / يومين | [NUM] أيام | [NUM] يومًا | [NUM] يوم |
| ساعة (f) | ساعة واحدة | ساعتان / ساعتين | [NUM] ساعات | [NUM] ساعة | [NUM] ساعة |
| دقيقة (f) | دقيقة واحدة | دقيقتان / دقيقتين | [NUM] دقائق | [NUM] دقيقة | [NUM] دقيقة |
| ثانية (f) | ثانية واحدة | ثانيتان / ثانيتين | [NUM] ثوانٍ | [NUM] ثانية | [NUM] ثانية |
| متر (m), prose | متر واحد | متران / مترين | [NUM] أمتار | [NUM] مترًا | [NUM] متر |
| جسم (m) | جسم واحد | جسمان / جسمين | [NUM] أجسام | [NUM] جسمًا | [NUM] جسم |
| مدار (m) | مدار واحد | مداران / مدارين | [NUM] مدارات | [NUM] مدارًا | [NUM] مدار |
| مشهد (m) | مشهد واحد | مشهدان / مشهدين | [NUM] مشاهد | [NUM] مشهدًا | [NUM] مشهد |
| نتيجة (f) | نتيجة واحدة | نتيجتان / نتيجتين | [NUM] نتائج | [NUM] نتيجة | [NUM] نتيجة |
| صف (m) | صف واحد | صفان / صفين | [NUM] صفوف | [NUM] صفًا | [NUM] صف |
| إطار (m) | إطار واحد | إطاران / إطارين | [NUM] إطارات | [NUM] إطارًا | [NUM] إطار |
| نظرة صافية (f) | نظرة صافية واحدة | نظرتان صافيتان / نظرتين صافيتين | [NUM] نظرات صافية | [NUM] نظرة صافية | [NUM] نظرة صافية |

- **Verb agreement with a counted subject:** verb first, singular, gendered by the noun. `رصد` agrees with `قمر` and
  `نُشرت` with `صورة`, in every category. Never put the count before the verb.
- Symbol units (`كم`، `م`، `كم/ث`، `د`، `س`، `ث`) never inflect: `2 كم`، `11 كم`.
- Decimals are `other`: `7.46 كم/ث`.
- When two counts meet in one sentence, or a count follows a preposition awkwardly, use `عدد [NUM] من` + definite plural,
  which needs no form per category (`لعدد 250 من أقمار التصوير`). Or use a label-value pair (`عرض كل الصفوف: 40`).
- "And N others" is the last item of a list, with its own forms: `وقمر آخر`، `وقمران آخران`، `و7 أقمار أخرى`، `و11
  قمرًا آخر`، `و100 قمر آخر`.

### 5.5 Lists of names

- Join with `fmt('ar').list`, which gives `Umbra وCapella وICEYE`: `و` before each item, attached, with no comma. The
  attached `و` before a Latin name is standard and is what CLDR produces. Do not add a space.
- A list as subject takes a plural head noun first: `مرّت أقمار الرادار Umbra وCapella …`.
- Joins inside messages (`rowLabel`, `satLabel`, `slideLabel`, `placeTitle`, `chipName`) use `، `, never `, `.
- In aria text, a percentage is said in words: `السحب 25 بالمئة`.

### 5.6 Dates and times inside sentences

- Days come from the `time` namespace, from Intl as they are: `يوم الأحد، 1 نوفمبر` (keep CLDR's comma, and add `يوم`
  before it for "on").
- Clocks: `عند 16:14:21 UTC`، `عند 11:21 بالتوقيت المحلي`، `عند 07:49 CET تقريبًا`.
- Windows: `من 29 أكتوبر إلى 5 نوفمبر` in prose; `29 أكتوبر ← 5 نوفمبر` in labels.
- Since a year: `منذ 2015`. Never group a year's digits.
- Never a Hijri date, never ص / م, and never an ordinal day (`الأول من نوفمبر`): the digit is the datum.

### 5.7 Formatted slots

A slot that arrives already formatted (a clock, a zone, a coordinate, a seat, `pixel` in `fullDiscNote`, a day string)
keeps its form: a translation cannot re-inflect it. Two consequences follow:
- No frame may put a symbol unit directly after a clock. A bare `م` after `11:21` reads as `مساءً`.
- Where Arabic needs agreement with a quantity, the message must receive a number. `share.post.imaged` already takes
  `pixelM`, so the post spells metres. If a formatted slot ever carries an English unit into Arabic, report it as a
  code issue: never translate around it.

## 6. Typography and formatting

### 6.1 Punctuation and spaces

| Mark | Rule | Example |
|---|---|---|
| `،` U+060C | The sentence comma. The ASCII `,` only groups digits (and stays inside data strings as they come). | `خلال آخر 7 أيام، رصد …` |
| `؛` U+061B | Semicolon. | `لم يُنشر بعد أي مشهد من هذا المرور؛ فقد تتأخر الأرشيفات …` |
| `؟` U+061F | Question mark. | `ما الذي رصدك هذا الأسبوع؟` |
| `.` `:` | Standard full stop and colon, no space before them and one after. | `الغطاء السحابي في المشهد: 25%.` |
| `« »` | Quotation marks. Type U+00AB before and U+00BB after, in logical order; the browser mirrors them. | `لا شيء يطابق «[QUERY]».` |
| `…` | One character, U+2026, with no space before it. | `جارٍ تجهيز الصورة…` |
| `–` | Only in compact ranges with numbers on both sides (`10–30 م`). Prose says `من … إلى`. | |
| `←` | Every range, sequence and "from → to" in Arabic: kicker, day ranges, clock spans, scan direction, scan counter, zone change. Never `→`. Intl's `formatRange` gives an en dash: replace it. | `1 ← 8 نوفمبر 2026 UTC` |
| `—` | Not used (the owner's copy has none). | |
| `·` | Separator in labels and chips, with a space on each side. | `أقرب نظرة · Sentinel-2B · 10 م` |
| `!` | Never. | |
| ـ (tatweel, U+0640) | Never: not for justification, not for emphasis, not to stretch a label. | |

There is never a space before punctuation. Text is never justified (`text-align: start`): Arabic justification
stretches with tatweel or opens wide gaps.

### 6.2 Direction (bidi)

Arabic runs right to left. Satellite names, digits, units like `UTC` and zone names run left to right inside it. These
rules keep every string correct in the DOM, in plain text (posts, clipboard, page titles) and on the share card. Each
claim below was checked in Chrome under `dir="rtl"`.

1. **The container sets the direction.** The page is `<html dir="rtl">`. Never put `dir="auto"` on a paragraph that can
   start with a name.
2. **Plain text never starts with a Latin name, a digit or a symbol.** This covers posts, page titles, og tags, share
   sheet titles and aria labels. Plain-text renderers take a paragraph's direction from its first strong letter, so a
   post that starts with `Sentinel-2C` turns left to right. In the DOM the RTL container decides, and on the card the
   row-reverse layout does. A mono label like `7 أيام` or a stamp like `7 أيام حتى الأحد، 1 نوفمبر 2026` may start with
   a digit.
3. **Every number is a left-to-right island.** `num()` parts are rendered as `[data-num]` spans. Under `dir="rtl"` such
   a span needs `unicode-bidi: isolate` **and** `direction: ltr`: with `isolate` alone, `−6°` displays as `6°−`. A
   negative number is formatted as `Math.abs(n)` with a U+2212 prefix inside the island. `fmt('ar').dec(-12.4)` returns
   LRM + hyphen-minus, which must never reach a post or the card.
4. **Ranges and counters are not one island.** Each end is its own island, joined by `←` (`16:14 ← 16:22`) or `/`
   (`3 / 27`), so the start sits on the right. Never wrap a whole range or counter in one left-to-right span: it would
   read end to start. A readout cell that holds a composite value (`الشمال ← الجنوب`, a time range, `SSW · هابط`) must
   not force `direction: ltr`.
5. **Two Latin slots never sit side by side with only neutrals between them.** Space, `·`, `←`, `/` and `,` are neutral,
   and two Latin runs separated only by neutrals merge into one left-to-right run that reads backwards in RTL
   (`America/Toronto · EDT ← EST` came out reversed). Use the fix for the surface:
   - DOM strings: isolate each slot (`⟨LRI⟩EDT⟨PDI⟩ ← ⟨LRI⟩EST⟨PDI⟩`).
   - Plain text: put an Arabic word between the slots (§5.2).
   - The card: lay the slots out as separate items.
6. **What the visitor types stays as typed.** A query goes inside FSI…PDI (`«⟨FSI⟩[QUERY]⟨PDI⟩»`). The coordinates in
   `searchDown` go inside LRI…PDI, written exactly as the source writes them (`43.47, −80.54`, with U+2212). Without
   it they display as `80.54− ,43.47`.
7. **Bidi control characters:**
   - Allowed: LRI/FSI…PDI, in DOM-only strings, around the one run the frame cannot avoid (`hud.sun`, `landing.searchDown`,
     `landing.nothingMatches`, the timeline's zone labels, `lightbox.zoom`).
   - Never allowed in: post text, `card` strings (they reach satori), page titles and descriptions, og tags, file names,
     or the time-lapse video. X counts each control as 2 characters, and a font may draw it as a box. The card
     renderer strips U+200E, U+200F, U+061C and U+2066–2069.
   - Percentages are written `${n}%`: Intl's percent style inserts U+200E around `%`.
8. **Sequences and time axes run left to right.** This covers the photo strip and its ‹ ›, the photo viewer's filmstrip,
   the pass ‹ › in the header, the week timeline, the replay scrubber and the time-lapse slider. Each is laid out
   `direction: ltr`, its chevrons are not mirrored, the arrow keys keep their physical meaning (← previous or earlier,
   → next or later) and the tooltips say so: `السابق (←)`، `التالي (→)`. One rule covers every control you step
   through. It matches the time axes and the media-tape convention, and it needs no right-to-left scroll arithmetic in
   the gallery.
9. **Interface mirroring.** Chevrons in reading-direction navigation (the search field's go arrow, a back arrow) point
   the reading way. The share glyph, the reticle, the north arrow, the globe, the plan view and every map stay
   unmirrored, because they are physical (west is on the left). Copy never says `يمين` / `يسار` for "next" /
   "previous"; it says `التالي` / `السابق`.

### 6.3 Numbers

- Western digits 0–9 everywhere, from `fmt('ar')`: `1,715`، `35,778`، `7.46`. Never Arabic-Indic digits, never `٫ ٬`.
  Never group years, NORAD ids or pass ids (`2026`، `NORAD 62261`).
- Never use a regional tag. `ar-SA`, `ar-EG` and `ar-JO` switch to Arabic-Indic digits, and some engines give `ar-SA` the
  Islamic calendar. `ar-AE` already defaults to Latin digits, but the app's tag is `ar-u-nu-latn` everywhere.
- Percent and degrees attach: `25%`، `5.4°`، `±30°`، `62°`.
- A unit follows its number after a no-break space (U+00A0), so the two never part: `786 كم`، `10 م`، `7.46 كم/ث`،
  `38 ث`، `4 د 12 ث`.
- Prose spells metres and seconds with agreement (`10 أمتار`، `30 مترًا`، `10 ثوانٍ`), because a bare `م` in running
  text can read as `ميلادي` or `مساءً`. Readouts and chips use the symbols.
- The zoom readout is one island, `⟨LRI⟩2.5×⟨PDI⟩`, written with `fmt('ar').dec(k, 1)`.

### 6.4 Dates, times and relative time

| Context | Form | Example |
|---|---|---|
| Prose, posts, screen readers | Intl `{ weekday: 'long', day: 'numeric', month: 'long' }` as it comes | `الأحد، 1 نوفمبر`؛ `الجمعة، 6 نوفمبر` |
| Short readouts and chips | day and month (Arabic has no abbreviated months) | `1 نوفمبر`، `31 أكتوبر` |
| A readout that shows a weekday | the full weekday (Arabic has no short weekdays) | `الأحد، 1 نوفمبر` |
| Timeline day ticks | the day number alone; the full weekday goes in the tooltip. Never the narrow letters `ح ن ث ر خ ج س` (they clash with `ث` seconds and `س` hours). | `1`، `2`، `3` |
| Card stamp | with the year | `الأحد، 1 نوفمبر 2026 · 11:21 EST` |
| Kicker | | `آخر 7 أيام · 1 ← 8 نوفمبر 2026 UTC` |
| Time | 24 h with colons, in prose too | `16:14:21`، `11:21` |
| Relative, compact | built from `relativeParts`. Intl's short and narrow styles equal the long one in Arabic, so they cannot be used. | `للتو`، `قبل 12 د`، `قبل 41 س`، `قبل يومين`، `قبل 3 أيام`، `بعد 3 س` |
| Relative, spoken | Intl long for the past; the future built with `بعد` | `قبل 12 دقيقة`، `قبل ساعتين`، `بعد 3 ساعات` |
| HUD age | no `<`, because it mirrors | `للتو`، `قبل 58 د`، `قبل 5 س`، `قبل 3 أيام` |
| Durations | | `38 ث`، `4 د 12 ث`، `1 س 02 د` |
| Countdown | kept as is | `T−00:42` |

Months come from CLDR `ar` (Gregorian): `يناير، فبراير، مارس، أبريل، مايو، يونيو، يوليو، أغسطس، سبتمبر، أكتوبر،
نوفمبر، ديسمبر`. Never the Levantine `كانون الثاني / تشرين الثاني`: Jordanian readers read `نوفمبر` without effort, but
Gulf and Egyptian readers would stumble on `تشرين`.

### 6.5 Mono caps labels

- Arabic has no case. CSS `text-transform: uppercase` does nothing to Arabic and still uppercases the Latin parts
  (`SENTINEL-2B` in a label, as in English, which is accepted).
- An Arabic "mono caps" label is set in the label face (Noto Sans Arabic at full width, `size-adjust: 114 %`): about 12
  px beside 10.5 px Latin caps, and about 10.8 px in 9.5 px micro chips. It has **letter-spacing 0**, because tracking
  pulls joined letters apart (the stylesheet enforces 0 everywhere under `data-script='arabic'`). Digits inside stay in
  Martian Mono.
- Never uppercase or track anything Arabic, or the wordmark `Watched.`

### 6.6 Marks (تشكيل)

- **Shadda:** always on `مرّ / يمرّ`. Elsewhere, write it exactly as this guide spells the word (`حدّد`، `غطّى`، `تعذّر`،
  `نتتبّع`، `ثمّة`، `مشغّل`، `مفصّلة`، `مرجّح`, but `تم النسخ`). In a word this guide does not spell, use it only where a
  reader could misread the word without it.
- **Tanween** in its standard spellings: `قمرًا`، `عموديًا`، `مباشرةً`، `جارٍ`، `صافٍ`، `ثوانٍ`، `متبقٍّ`.
- **Damma** on a verb whose bare form reads as another verb: passives (`نُشرت`، `تُنشر`، `يُرسل`، `تُفتح`، `استُبعدت`،
  `التُقطت`، `جُلب`، `وُضع`) and `يُجري` ("conducts"; bare `يجري` means "runs").
- Not allowed: any other fatha, kasra, damma or sukun; full vocalisation; and **any mark at all on ـك or `أنت`**.
  Titles stay unvocalised (`رصد`).

### 6.7 Line breaking and abbreviations

- Break only at spaces. No hyphenation, and never split a word with tatweel.
- Never break between a number and its unit or noun, between `القمر الصناعي` and [SAT], inside a clock and its zone, or
  inside a coordinate pair. Use U+00A0 where the frame puts a space.
- Display headlines and the hero use explicit lines only: no automatic wrap inside the hero.
- The only abbreviations are the unit symbols (`كم`، `م`، `كم/ث`، `ث`، `د`، `س`) and Latin notation that stays Latin
  (UTC, TLE, IR, PNG, the 16-point compass, coordinates). Never invent dotted Arabic abbreviations (`د.` means
  "doctor").

### 6.8 Type: the faces and their settings (committed in `src/styles/scripts.css`)

| Role | Face | Settings |
|---|---|---|
| Display, body, labels | Noto Sans Arabic, trimmed by `scripts/build-arabic-fonts.py` to weights 400–700, widths 75–100 and the basic Arabic block (62 kB WOFF2) | Display at the design's condensed `--stretch-display` (75 %), weight 600. Labels use the same file at full width with `size-adjust: 114 %`. |
| Accent (the hero's `أنت`, About's `يعمل`, Arabic-script place names in the headline) | Amiri Regular, trimmed to the basic Arabic block (75 kB) | Upright, declared italic so `.serif` never slants it. Size ×1.08 (`--accent-k`). Never Amiri Quran, never Amiri's slanted style, never a stylistic set, never vocalised. |
| Leading | | `--lh-k: 1.36` (hero 1.25, headline 1.33); running text `--lh-text-k: 1.15` (about 1.7). |
| Tracking | | 0 everywhere. |
| Synthesis | | `font-synthesis-style: none`. The headline's bold is a real weight. |

- **Hero mask (fix required).** Each hero line wipes in through `clip-path`, and the mask box is the line's box plus
  `0.05em` of padding at the top. Measured at 100 px: the sans lines' shadda, hamza and dots fit inside it. The ink of
  Amiri's `أ` in `أنت` rises about 0.24em above the line box, so about 19 px of it is clipped for the whole 900 ms wipe
  and then pops in when the animation ends. That is a flicker. Under `data-script='arabic'`, the `.hl` padding-top (and
  the matching negative margin) must be at least `0.3em`. Re-check at 44 px and 128 px on iOS Safari, Android Chrome
  and Windows Chrome.
- **Why Amiri stays.** The reviewer warned that Amiri reads as scripture. Amiri was chosen from specimens set in this
  design and judged against the English by three judges. Amiri is not Amiri Quran. What makes text read as Quranic is
  full vocalisation, Uthmani spelling and verse ornaments, and this guide bans all three. The accent is one unvocalised
  word. The alternative, Noto Naskh Arabic, is Android's system text face, so the accent would read as fallback body
  text instead of the human moment.

### 6.9 Cost and speed guardrails (for whoever wires the Arabic catalog)

The owner's constraint is that Arabic must cost nothing more to serve and stay as fast. None of the following adds a
request, a service, stored data, or a byte for a non-Arabic visitor.

1. **Fonts load only for Arabic.** Both faces are self-hosted with `unicode-range` on the Arabic block. The boot script
   preloads them only for Arabic pages, so the hero never swaps faces under the curtain. They are cached immutably, and
   an English visitor downloads nothing new.
2. **Share cards bundle their Arabic faces and never fetch them.** Add static TTF instances (the card's display weight
   at the condensed width, the sans weight, and Amiri, basic Arabic block only) to `api/_fonts/`. Read them only for a
   card that prints Arabic, the same way the Cyrillic card faces are read. Without them, satori sends every Arabic text
   to `loadFallbackAsset`: two Google Fonts requests of up to 4 s each, per text, per cold instance, and in the wrong
   face. Check the Worker bundle size after adding them.
3. **Share cards lay out Arabic as word items, right to left.** satori does not reorder words: a single RTL text node
   is laid out left to right (checked with the repo's satori 0.33.5: `لم` at x=0, `سوى` at x=97). For an RTL card:
   - Split every text block into word items, keeping each left-to-right run whole as one item: a Latin name
     (`Sentinel-2C`, `WorldView Legion 4`, `Area 51`), a number (`256`, `1,715`), a clock with its zone (`11:21 EST`).
   - Put the items in a `flexDirection: 'row-reverse', flexWrap: 'wrap'` box. This was checked: `رصد` is at the right
     edge, the next words follow leftward, wrapped lines fill from the right, and resvg joins the letters inside each
     word.
   - Lay out the hero lines and the `lead | place | tail` blocks the same way.
   - Add PNG snapshot tests: a pass card, a week card and the default card, at counts 0, 1, 2, 7, 256 and 1,715, each
     with a Latin place, an Arabic-script place and a cut place.
4. **No runtime translation.** Catalogs are static strings in the Arabic chunk. Numbers, plurals, dates, lists and
   country names come from Intl with `ar-u-nu-latn`.
5. **Analytics stay English.** Telemetry reads the English namespaces directly.
6. **Normalise Arabic keyboard input before parsing coordinates.** Phone keyboards in the Gulf and Egypt type
   Arabic-Indic digits and the Arabic comma. Map ٠–٩ and ۰–۹ to 0–9, `٫` to `.`, and `،` to `,` in the coordinate
   parser. It is one string replace, and a typed coordinate then never goes to a network geocoder.
7. **Arabic-script place search.** Today a query typed in Arabic letters cannot match the offline list. Its file key is
   Latin-only (`shardOf` is undefined for non-Latin text), and `placeKey` splits words at hamza marks
   (`الإسكندرية` → `الا سكندرية`). So almost every Arabic-script search goes to Open-Meteo, then Photon: a network wait
   instead of a local tile, spent against a free tier of about 10,000 requests a day.
   - Now, at build time, with no runtime cost: fold Arabic in `placeKey` before its other steps:
     `s.normalize('NFD').replace(/[ً-ٰٟـ]/g, '').replace(/ٱ/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')`.
     Checked: `الإسكندرية/الاسكندرية`، `أبوظبي/ابوظبي`، `القاهرة/القاهره`، `دبي/دبى`، `جدّة/جده`، `مؤتة/موته`،
     `شاطئ/شاطي` all match. Latin keys do not change, so no existing file moves.
   - At the next rebuild of the place list, timed with the Arabic launch (the owner signs off on the rebuild): add
     GeoNames `ar` alternate names for the larger towns and for every place in Arab League countries, as search keys
     filed under Arabic shards. They resolve to the same place record, which is shown and stored under its canonical
     name.
   - Geocoders stay asked in English. Never add `language=ar`. Place names are data (`src/i18n/en/geo.ts`): one town is
     one row in the stats, the lookups and the share links whatever the visitor's language.
8. **Country names** come from `Intl.DisplayNames(['ar-u-nu-latn'], { type: 'region' })` in the long style. Hong Kong and
   Macao take the short style for length (`هونغ كونغ`، `مكاو`), and so does Palestine (`فلسطين`, owner, 2026-11-19, §8):
   `shownCountryName` in `src/imagery/localPlaces.ts`, display only.
9. **File names stay ASCII.** The PNG name's place slug drops non-ASCII letters, so an Arabic-script place gives an
   empty slug. It falls back to `place`, as `timelapse.fileNamePlace` does.
10. **The time-lapse video** draws its words on a canvas. Set `ctx.direction = 'rtl'` and end alignment for Arabic, and
    check that the readout `22 أكتوبر 2015 · SENTINEL-2A` keeps its order.

## 7. Length discipline

Arabic has fewer characters than English (short vowels are not written) but wider letters, and it is set larger for
legibility. Character counts mislead in Arabic: `س ش ص ض ع` are wide and `ا د ر و` narrow. `headlineSize` and every
length rule in code must measure for `ar`, not count. The budgets:

- Prose and headlines: at most English + 20 % rendered width. Over that, cut words, not facts. The hero measures +2.5 %
  (§3.1).
- Buttons, chips and mono labels: at most the English width. Supply the short form below for phones.
- Never abbreviate an Arabic word to make it fit. Cut the article in labels only where the table gives a short form.

Strategies, in this order:
1. Use the noun or masdar.
2. Drop the object where the context gives it.
3. Use the established short word.
4. Move detail into `aria-label` or `title`.

Rendered at 10.5 px, Arabic labels in the label face are mostly narrower than English mono caps with +0.08em tracking
(measured: `كان بإمكانه النظر إلى هنا` 128 px against `COULD HAVE POINTED HERE` 176 px; `الانحراف` 40 against 69;
`كيف يعمل` 55 against 107). The exceptions are listed below.

| English | Arabic | Arabic short | Where | Rendered vs English |
|---|---|---|---|---|
| SURPRISE ME | فاجئني | same | Example chip | narrower |
| USE MY LOCATION | استخدام موقعي | موقعي | Inline button; the full form is the accessible name | 78 / 115 px |
| LOCATE ME | حدّد موقعي | same | Phone button | about equal |
| NEAR ME | بالقرب مني | same | Chip on phones ≤ 400 px | 58 / 54 px (+7 %) |
| HOW THIS WORKS | كيف يعمل | same | HUD corner | 55 / 107 px |
| LAST 7 DAYS | آخر 7 أيام | 7 أيام | Kicker, stamps | narrower |
| CLOSEST LOOK | أقرب نظرة | same | Tag, chip | narrower |
| LAST CLEAR LOOK | أحدث نظرة صافية | نظرة صافية | Tag, chip | 93 / 115 px |
| CLOUDED OVER | تحت السحب | same | Lead tag, chip | 68 / 92 px |
| MOSTLY CLOUD · 81% | معظم المشهد سحب · 81% | same | Card chip | 148 / 138 px (+7 %) |
| TIME-LAPSE | عبر السنين | same | Row title, viewer button | 55 / 77 px |
| OFF-NADIR | الانحراف | same | Readout | 40 / 69 px |
| ELEVATION | زاوية الارتفاع | الزاوية (geostationary strip only) | Readout; never the bare `الارتفاع` | 61 / 69 px |
| GROUND SPEED | السرعة الأرضية | السرعة | Readout, card | 74 / 92 px |
| PASSES | مرات المرور | same | Rule label (room on the rule) | 60 / 46 px (+30 %) |
| REPLAY | إعادة العرض | none | Buttons, section label | 62 / 46 px (+35 %) |
| TRY AGAIN | إعادة المحاولة | same | Error notices | about equal |
| DOWNLOAD IMAGE | تنزيل الصورة | تنزيل | Pass link | narrower |
| COPY LINK | نسخ الرابط | same | Share sheet | about equal |
| POST TO X | النشر على X | same | Share sheet | about equal |
| VIDEO FAILED / SAVE VIDEO | فشل الفيديو / حفظ الفيديو | same | 132 px video button | 63 / 92 px |
| LINK / POST | الرابط / النص | same | 48 px column | fits |

`إعادة العرض` and `مرات المرور` are the two documented overruns. The masdar pair has no honest shorter form, and both
sit where there is room. Check `إعادة العرض` beside the gallery caption at 380 px (it is hidden below that).

The share card's headline size shrinks with length (`headlineSize`). The hero is three explicit lines and never wraps
further. The results headline may wrap to one more line than English on phones, but it never truncates.

## 8. Sensitive content

**Surveillance and privacy.** The product shows that something could see you, and is exact about how little it could
see. The Arabic must never inflate either side.
- Satellites `رصد`. Never `راقب / مراقبة` (state surveillance), `تجسّس`, `تعقّب`, `ترصّد` (to stalk, to lie in wait) or
  `استهدف`. They assert an intent toward the reader that the product does not know.
- We `نتتبّع` (follow objects in a catalog), never `نتعقّب` (pursue).
- About's category sentence keeps the owner's words: `الأقمار العسكرية وأقمار التجسس`. A category name asserts nothing
  about the reader. It appears nowhere else, and `الاستطلاع` stays out of our copy.
- The reassurances keep their numbers and their flatness: `لا. أدق بكسل هنا عرضه 10 أمتار. السيارة بكسل واحد. ولا أثر
  لك فيه.` No `اطمئن`. The privacy notes are translated exactly and promise nothing more or less. "A ~10 km cell" is a
  width (`خلية عرضها نحو 10 كم`), not an area.

**War zones in the time-lapse** (Gaza Strip, West Bank, Ukraine, Lebanon). For many Arabic readers these places are
personal. The copy states the method and never the reason. The caption says `11 نظرة صافية · واحدة كل خريف` and never
says that a war is being shown. Our own copy names them `قطاع غزة`، `الضفة الغربية`، `أوكرانيا`، `لبنان`. Never add
`المحتلة`، `يهودا والسامرة`، `منطقة حرب`، `دمار`، `عدوان`، `قصف`، `غارات`، `شهداء`, or any word that assigns cause or
blame, in either direction.

Words that are dangerous next to these places:
- `مسح` with a place as object: `مسح غزة` reads "wiped Gaza out". `مسح` is a noun only (`خط المسح`، `نطاق المسح`،
  `يُجري مسحًا`).
- `حلّق / تحليق`: the word for warplanes and drones over Gaza and south Lebanon. Satellites `مرّ`.
- `استهدف` (targeted), `ضرب`, `اجتاح` (swept, invaded). Never, even for "swept over", which is `غطّى`.
- `آخر نظرة` / `النظرة الأخيرة`: the farewell viewing of the dead before burial. The chip appears on week cards whenever
  every photo was clouded, Gaza and Lebanon included. "Last clear look" is `أحدث نظرة صافية`.

**Glaciers.** `نهر جليدي` (m), pl. `أنهار جليدية`; `نهاية موسم الذوبان`; `الجليد`. Never `كارثة`، `ذوبان مأساوي`،
`اختفاء`: the frames speak for themselves.

**Place-name politics** (our own copy only; gazetteer names are shown as they come):
- Countries come from `Intl.DisplayNames('ar-u-nu-latn')` and are never overridden for politics, whichever way a
  reviewer feels: `إسرائيل`، `تايوان`، `كوسوفو`، `الصحراء الغربية`، `الإمارات العربية المتحدة`. Never add a
  sovereignty qualifier (`تايوان (الصين)`، `القرم (روسيا)`). Crimea and other disputed areas are named as the gazetteer
  names them, with no country attached.
- **Palestine (owner decision).** CLDR's long style gives `الأراضي الفلسطينية` and its short style gives `فلسطين`. Saudi
  Arabia, the UAE, Egypt and Jordan all recognise the State of Palestine, and to their readers "the Palestinian
  territories" is the Western diplomatic formula. It would show in every Gaza and West Bank sublabel (Gaza alone is
  about 1,300 searches). The native reviewer recommends the short style. The short style is CLDR data, as for Hong Kong,
  but choosing it here would be a per-language choice for political reasons, which the policy above rules out unless
  the owner makes it. **Decided (owner, 2026-11-19): `فلسطين`**, CLDR's short name, for Arabic (and *Palestina* for
  Indonesian); the other languages keep their long CLDR name. Display only: the stored labels stay English.
- Curated sublabels list two countries in Arabic alphabetical order: `الأردن وإسرائيل`، `زامبيا وزيمبابوي`، `الصين
  ونيبال`.
- Ukrainian cities in our copy: `كييف`، `خاركيف`، `لفيف`.
- The Gulf: our copy never names it. If it must, write `الخليج` alone, never `العربي` or `الفارسي`.
- Jerusalem and the holy places appear as the gazetteer gives them, with no country, religious title or epithet.

**Religion.** No religious formulas anywhere (§2.3). No allusion to Quranic phrasing in the hero or headlines (no `إيّاك`
constructions, no rhymed prose). The accent face is never vocalised (§6.8). Friday is a weekday like any other in the
timeline.

**Attribution lines** burnt into images, cards, the time-lapse and its video stay verbatim in English (`Contains modified
Copernicus Sentinel data 2026`, `Landsat: USGS / NASA`): they are licence notices. About's credits section is prose and
is translated, quoting the attribution as given. On the Arabic page it also names the Arabic faces shown.

## 9. Pitfalls and the reviewer's checklist

### 9.1 False friends and ambiguous words in this product

| English | Trap | Use |
|---|---|---|
| watched | `صوّر` (owner rule), `راقب` (surveillance), `شاهد` (TV), `ترصّد` (stalk) | `رصد` |
| satellite | `قمر` alone = the Moon; `ساتل` = jargon | `قمر صناعي` |
| the ISS | `القمر الصناعي ISS` (no Arabic writer says it) | `المحطة الفضائية ISS` |
| pass | `تمريرة` (football), `تحليق` (warplanes), `المرور` alone (traffic) | `مرور`، `مرات المرور`، `مرة` |
| swept over | `مسح` (wipe out), `اجتاح` (invade) | `غطّى` |
| crossed | `عبر` (also "via"), `حلّق` (warplanes) | `مرّ فوق …` |
| within view of | `ضمن مدى الرؤية` (clumsy in prose) | `على مرأى من` |
| off-nadir | `الميل` (inclination, declination) | `الانحراف` |
| altitude / elevation | both `ارتفاع` | `الارتفاع` / `زاوية الارتفاع` |
| resolution / accuracy | both `دقة` | `دقة … لكل بكسل` / `هامش الخطأ` |
| location (yours) / website / the app | all `موقع` | `موقعك` for the position; `التطبيق` for the app; never `موقع [PLACE]` |
| fixed camera / geostationary | both `ثابت` | `غير قابلة للتوجيه` / `ثابت` |
| clouded over | `غائمة` (blurry picture) | `تحت السحب` |
| last clear look | `آخر نظرة` (farewell to the dead) | `أحدث نظرة صافية` |
| time-lapse | `فاصل زمني` (time interval) | `عبر السنين` |
| geometry | `هندسة` = engineering | `القياسات`، `مسار المرور` |
| replay | `إعادة التشغيل` = restart; `إعادة` alone = redo | `إعادة العرض` |
| download | `تحميل` = load / upload / download | `تنزيل` |
| dismiss | `تجاهل` = ignore | `إغلاق` |
| private (operator) | `خاص` = special | `جهة … خاصة`، `غير متاح للعموم` |
| public (image) | `عام` = general; `علني` = overt | `منشورة للعموم`، `متاح للعموم` |
| likely | `محتمل` leans toward "possible" | `على الأرجح`، `مرجّح` |
| clear (sky) | `واضح` = obvious | `صافٍ` |
| actual (pictures) | `الحالية` = current | `الحقيقية` |
| just now / in 3 h | `الآن` = now; `خلال` = within | `للتو` / `قبل لحظات`; `بعد` |
| Copied | `نُسخ` (reads "was transcribed") | `تم النسخ` |
| orbit catalog | `فهرس` (index) | `كتالوج المدارات` |
| Strip (Las Vegas) | `قطاع` (Gaza) | `ستريب` |

Spelling reminders: `إلى` and `على` with alif maqsura (never `الي`, `علي`); hamza seats in `سماءك / سمائك / سماؤك`;
`مسؤول`, not `مسئول`; the taa marbuta in `صورة`، `مرة`، `دقيقة`.

### 9.2 Reviewer's checklist (run it on every string)

1. **Verb:** "watched" is `رصد`. No `صوّر`، `راقب`، `تجسّس`، `شاهد`.
2. **Gender:** "you" only as unvocalised ـك or `أنت`, the latter emphatic or with a prepositional predicate. No
   second-person verb, no imperative to the reader, no adjective about the reader, no slash forms, no `أنتم`.
3. **Marks:** only shadda, standard tanween and a passive damma. Nothing on ـك or `أنت`. Titles unvocalised.
4. **[SAT]:** preceded by `القمر الصناعي` (`المحطة الفضائية` for crewed; indefinite `قمر صناعي` when unknown). Masculine
   verb and pronouns (feminine for a station). The sentence does not start with the name. Two Latin names never touch.
5. **[PLACE]:** never in the subject slot, never the subject of a verb, never a pronoun's antecedent. No attached
   `لـ بـ كـ و فـ`, no added article or head noun, no adjective after it.
6. **Other names:** a service, archive, agency or sensor as subject has a head noun. No dual construct before names.
7. **Plurals:** all six categories present. 1 and 2 as words in sentences, digits in readouts. The dual's case right
   (`ـان` / `ـين`), many in the accusative (`قمرًا`، `يومًا`). The verb agrees with the counted noun, and comes before
   it.
8. **Digits:** Western 0–9 from `fmt('ar')`. No Arabic-Indic digits or separators. Years and ids ungrouped. Negative
   numbers with U+2212, never LRM + hyphen.
9. **Units:** symbols in readouts, metres and seconds spelled in prose, `°` and `%` attached, a no-break space before a
   unit. No symbol unit right after a clock.
10. **Direction:** plain text starts with an Arabic letter. Ranges and sequences use `←`, never `→`. Ranges and counters
    are never one LTR island. Adjacent Latin slots are isolated (DOM) or separated by Arabic (plain text). Bidi
    controls only in DOM-only strings. Coordinates and queries shown as typed.
11. **Punctuation:** `،` `؛` `؟`; `« »` in logical order; `…` as one character; no em dash, no `!`, no tatweel.
12. **Compass:** whole phrases from the three tables in prose; Latin 16-point letters and Latin coordinates in readouts.
13. **Dates:** Gregorian, `يناير…ديسمبر` from Intl; no narrow weekday letters; 24-hour time; no ص / م; no Hijri dates.
    Relative compact and future forms built by hand.
14. **Form:** buttons as masdar (or the reader's own command to the product); labels as nouns with the article; errors
    as `تعذّر …` + `يمكنك …`.
15. **Honesty:** `صورة` plus `فوتوغرافية` / `رادارية` where the English contrasts them; no claim beyond the English;
    "we can't know" stays `لا يمكننا أن نعرف`; "where it imaged" stays `أين التقط صوره`, never "where it pointed".
16. **Tone:** no marketing verb, no apology, no `يُرجى`, no religious formula, no intensifier the English lacks, no
    newsroom stock phrase.
17. **Sensitive words:** no `مسح` with a place as object, no `حلّق / تحليق`, no `عبر` as a verb, no `استهدف`, no `آخر
    نظرة`. War-zone and country names exactly as §8.
18. **Untouched:** Watched., www.watched.earth, satellite, sensor and programme names, NORAD ids, UTC, EST / CET /
    UTC+3, coordinates, attribution lines, file-name words. `ناسا` only for the agency itself in prose.
19. **Length:** within budget (§7) by rendered width. A short form for every chip, button and mono label. The hero stays
    three lines.

## Decisions log

The critique has 42 numbered items and 11 "missing" items. Of these 53, 45 were accepted, 8 partly accepted and none
rejected outright. The partial items reject specific sub-points, with the reasons given in each row.

| # | Item | Resolution |
|---|---|---|
| 1 | Satori lays Arabic words out left to right (blocker) | Accepted and verified: one RTL node places `لم` at x=0. Row-reverse word items, with each LTR run kept whole, read correctly, wrap from the right, and the letters join in the PNG. Snapshot tests listed (§6.9.3). |
| 2 | `aSatellite` doubled with the head noun (blocker) | Partly accepted. The premise is wrong: sentences receive `sat` undefined, and `aSatellite` reaches only chips and the plan callout. The outcome is adopted: an unknown satellite is an indefinite `قمر صناعي` after the verb, and `aSatellite` is `قمر صناعي` (§3.5, §5.2). |
| 3 | The zero headline reads "Waterloo observed no satellite" | Accepted: `هذا الأسبوع، لم يرصد أي قمر صناعي نتتبّعه *Waterloo*.`, and the alternate order is deleted. The rule is worded precisely: [PLACE] never sits in the slot right after a verb whose subject is not yet named. That still allows the critique's own nominal frames (§5.1). |
| 4 | Two Latin names touch | Accepted: nominal frames for imaged and likely (`القمر الصناعي [SAT] رصد [PLACE]`), `على مرأى من` for could, the MODIS frame `ضمّ جهاز تصويره MODIS صورة [PLACE] …`, and `المكان` in the pass sentence (§3.4, §3.5, §5.2). |
| 5 | The ISS called `القمر الصناعي` | Accepted: `المحطة الفضائية [SAT]` (f) for the crewed category (ISS and Tiangong only), with a `crewed` flag requested for the four messages that can name them (§5.2, open questions). |
| 6 | Arabic-script searches go to the network | Partly accepted. The fold in `placeKey` is adopted now (tested; Latin keys unchanged). Arabic alternate names come at the launch rebuild, with owner sign-off. `language=ar` for Open-Meteo is rejected: place names are data, one row per town in stats, lookups and shares (`geo.ts`) (§6.9.7). |
| 7 | Typography never decided | Partly accepted. Adopted: the committed faces (Noto Sans Arabic with its width axis, 62 kB; Amiri, 75 kB), leading ×1.36, labels via `size-adjust: 114 %`, boot preload, card faces bundled, and the mask problem, which was measured (Amiri's `أ` is clipped about 0.24em above the line box) with a fix. Rejected: "never Amiri" (reasons in §6.8); "no width axis, so no condensing" (the trimmed file keeps width 75–100); `--display-k 0.8` (measured: the Arabic hero is +2.5 %); `local()` sources (version and metric drift on devices). |
| 8 | Plain-string messages cannot isolate numbers | Accepted and verified: `searchDown` displays `80.54− ,43.47` without LRI…PDI. LRI/FSI…PDI are allowed in DOM-only strings; composite readout cells never force LTR; no `<` in HUD ages (`للتو`); the U+2212 coordinates kept. Extended: adjacent Latin slots and `[data-num]`'s missing `direction: ltr` (§6.2). |
| 9 | Coordinates in ش ج ق غ break the product contract | Accepted: coordinates stay Latin and zero-padded as one island. The geostationary seat also arrives formatted (`0.2°W`), so prose keeps it too (§4.2). |
| 10 | `الميل` reads as inclination | Accepted: `الانحراف` for the label and prose; radar's side-look keeps `بزاوية … إلى الجانب` (§4.1). |
| 11 | The post's pixel slot arrives as `10 م` | Partly accepted. Obsolete: `share.post.imaged` already takes `pixelM` as a number, so the post spells metres. The general rule (formatted slots keep their form; no symbol unit right after a clock) is adopted (§5.7). |
| 12 | `آخر نظرة` is the farewell to the dead | Accepted: `أحدث نظرة صافية` everywhere; `آخر نظرة` banned in §8. |
| 13 | `غائمة` means a blurry picture | Partly accepted: `تحت السحب` for "clouded over". "Mostly cloud" names the scene explicitly (`معظم المشهد سحب · 81%`) instead of the critique's pronoun `معظمه`, since the percentage is the scene's (§3.5). |
| 14 | The could title makes the satellite the object | Accepted: `كان بإمكانه النظر إلى هنا`; post `كان بإمكانه توجيه كاميرته إلى هنا`; About quotes the title (§3.6). |
| 15 | `ثابت` used for two things | Accepted: `كاميرا غير قابلة للتوجيه` in the likely definition; `ثابت` only for geostationary (§3.6). |
| 16 | The commercial in-swath sentence claims steering | Accepted: `لا ينشر مشغّله أين التقط صوره` (§3.4). |
| 17 | Services as subjects; the dual of `أرشيف` | Accepted, with `NASA GIBS` kept whole (the critique's own example split it): head nouns, impersonal frames, repeated nouns instead of duals (§5.3). |
| 18 | Palestine's CLDR long name | Partly accepted. The reason is written into §8, Arabic alphabetical order is used for our own country lists, and the decision goes to the owner. The guide ships CLDR's long name until then, because a per-language political choice is the owner's to make (open question). |
| 19 | Mirroring is inconsistent and undecided | Partly accepted: decided once, as the critique asked, but with its alternative of mirroring none. Every stepped sequence and time axis runs left to right, keys keep their physical meaning, and tooltips name them as bound (§6.2.8). Option (a) was rejected because the strip shares order and keys with the left-to-right timeline, and mirroring needs right-to-left scroll arithmetic the catalogs say is not there. |
| 20 | Remote-sensing glossary missing; "band" collides with "swath" | Accepted: all the proposed terms are added, with `حزمة طيفية` for band and `النطاق X` for radar bands (§4.1). |
| 21 | Agreement after a plural subject | Accepted: `لذا رأى جهازه سحبك`، `كان المكان مظلمًا`، `كان مكانك مظلمًا` (§3.4). |
| 22 | `فشبه المؤكد` | Accepted: `فمن شبه المؤكد أنه` (§3.4). |
| 23 | `بل` after a full stop | Accepted: `فهو يستقر …` (§3.4). |
| 24 | `قرابة 07:49` | Accepted: `عند 07:49 CET تقريبًا` (§3.4). |
| 25 | "Can it see me?" | Accepted: `هل يمكن لقمر صناعي أن يراني؟` / `لا. أدق بكسل هنا عرضه 10 أمتار. …` (§3.7). |
| 26 | `verdictMore.could` gender | Accepted: `ما إذا كانت قد نظرت حقًا` (§3.6). |
| 27 | "Spy satellites" softened | Accepted: `أقمار التجسس` in About's category sentence only (§8). |
| 28 | `مرّ فوقك` adds "you" | Accepted: kept, and written into §2.1 and §3.6 as the documented exception. |
| 29 | The digit-first rule is over-broad; the stamp drops the year | Accepted: the rule is scoped to plain text, and the stamp is `7 أيام حتى الأحد، 1 نوفمبر 2026` (§6.2.2, §3.5). |
| 30 | Tab title order | Accepted: `Watched · ثمّة شيء رصدك أنت هذا الأسبوع` (§3.1). |
| 31 | Dismiss is `تجاهل` | Accepted: `إغلاق`. |
| 32 | Replay short form `إعادة` | Accepted: `['إعادة العرض']` with no strong part; the +35 % width is documented (§7). |
| 33 | "Image opens in the app" uses `الموقع` | Accepted: `تُفتح الصورة في التطبيق`. |
| 34 | `فاصل زمني` reads as "time interval" | Accepted: `عبر السنين` for the row, button, bar, aria and share title (`عبر السنين: [PLACE]`) (§3.7, §4.1). |
| 35 | Negative numbers carry LRM + hyphen | Accepted and verified: format `Math.abs(n)` with a U+2212 prefix inside the island (§6.2.3). |
| 36 | Compact relative times must be hand-built | Accepted and verified (short = narrow = long in ICU), extended to the future `بعد` (Intl says `خلال`) (§6.4). |
| 37 | `ar-AE` already uses Latin digits | Accepted and verified; the text is corrected (§6.3). |
| 38 | Register: newsroom stock phrases | Accepted: `بعرض`، `تقريبًا`، `كان المكان مظلمًا` (§2.2). |
| 39 | `أنت` allowed too narrowly | Accepted: a verbless clause with a prepositional predicate is allowed (`فأنت في كل إطار`); adjectival predicates stay banned (§1.2). |
| 40 | The `upCompass` claim is false | Accepted: the claim is removed. Readout compass points are now Latin 16-point letters, which need no degrees beside them to be exact (§4.2). |
| 41 | Joins inside messages | Accepted: `، ` in every join; `السحب 25 بالمئة` in aria (§5.5). |
| 42 | Post cosmetics | Accepted: `الدقة 10 أمتار لكل بكسل، وهذه هي الصورة الحقيقية.`; the stray spaces before full stops are removed (§3.5). |
| M1 | `places` namespace | Partly accepted: the critique's seed list is extended to all 58 ids. Everest is `الصين ونيبال` under the critique's own alphabetical rule, and the Richat Structure is `عين الصحراء`, the name Arab readers know, rather than `بنية الريشات` (§4.3). |
| M2 | Globe and HUD instrument words | Accepted: `التقاط`، `التُقطت`، `الالتقاط ·`، `أقرب نقطة ·`، `جُلب`، `قديم،`، `16,893 جسمًا`، `الكتالوج` (§3.7). |
| M3 | Boot strings | Accepted: `الاتصال بطيء، والتحميل مستمر`; the title is the tab title (§3.7). |
| M4 | Engine progress and notes | Accepted: every line given, with six-form counts and head nouns for services (§3.7). |
| M5 | Share page strings | Accepted (§3.5). `ما الذي رصد [PLACE] هذا الأسبوع` stays, since its subject `الذي` comes first. |
| M6 | File names | Accepted: ASCII words, and an empty place slug falls back to `place` (§6.9.9). |
| M7 | Key names | Accepted: `Enter`, `مسافة`, `Esc`. |
| M8 | Switcher | Accepted: `اللغة` / `اللغة: العربية. تغيير`. |
| M9 | Filters and statuses | Accepted: `الكل` / `مفصّلة` / `الطقس` / `رادار`, `سمحاق رقيق`, `ظل سحابة`, `فسيفساء يومية`. |
| M10 | "The sun barely rose" | Accepted (§3.3). |
| M11 | Hero QA line | Accepted and measured: the sans lines fit the mask; the accent does not, and the fix is in §6.8. |

**Other corrections to the draft, from checking the code, the fonts and Chrome** (not raised by the critique):

- The pass sentences `crossed`, `likely.crossed`, `could.withinView` and `overhead` receive no place. The draft's
  `إلى الغرب من [PLACE]` and `فوق [PLACE] مباشرةً` are withdrawn in favour of `المكان` and the bare offset.
- `pass.compass16` is keyed by 16 ids at 3 characters. The draft's computed 8-point readout word is withdrawn: Latin
  letters, as for coordinates.
- `[data-num]` isolates need `direction: ltr` (`−6°` displays as `6°−` otherwise). Two Latin slots between neutrals
  merge (`America/Toronto · EDT ← EST` reversed). Counters like `3 / 27` must not be one LTR island.
- The hero was re-measured with the committed faces: 341 / 412 / 456 px against English 371 / 445 / 340 px. The draft's
  Noto Naskh figures are withdrawn.
- "At least" is removed with `display: none`, so it sits before the full stop with its space inside the strong part.
- The results headline's older window reads `من … إلى …` (no attached `و` on a day string). The week card puts
  `هذا الأسبوع،` first, so the card, the page title and the post match the app's headline.
- `خلية مساحتها 10 كم` (an area in kilometres) becomes `خلية عرضها نحو 10 كم`.
- Second-person verbs left in About are removed: `كل صورة تراها` → `كل صورة هنا`, `المرور الذي اخترته` → `المرور
  المختار`. Imperatives in hints are rewritten: `pinHint`, `moveHint`, `trackLabel`, `keysHint`.
- `مسح` is avoided in `clearSearch` (`إفراغ البحث`). "Swept it in infrared" is `غطّت`.
- The Arabic About credits name the Arabic faces the page shows, so the credit says exactly what is on screen.
