# Watched: Hindi (hi) localisation style guide

Reviewed 2026-11-21 by a native reader and an accuracy reviewer; what changed and what was rejected is in the
[Review](#review) section at the end. The guide binds every `hi` string the product shows, speaks or sends: the app, share cards
and share pages, post text, alt text, aria labels, the time-lapse video, About and the loading screen. If a
translator's habit disagrees with this guide, the guide wins. If the guide and the English disagree on a fact, the
English wins and the guide is wrong: report it.

One Hindi catalog, in the standard Hindi of good Indian apps and news sites, serves readers across India (and Hindi
readers abroad). It is reachable by `?hl=hi` only (`LOCALE_INFO.hi.listed: false`) until a native reviewer signs it off.

The English source of truth is the English namespaces in `src/i18n/en/*.ts`, the share card catalog
`api/_lib/i18n/card/en.ts`, `src/i18n/bootText.ts`, and `docs/DESIGN.md` §7 for the voice and the verdict vocabulary.

**Notation.** In frames, `*…*` marks the one serif accent (signal orange) and `**…**` the strong part (bold, or a part
that some layouts hide, as each message's comment says). Runtime slots are `[PLACE]`, `[SAT]`, `[NUM]`, `[TIME]` (a 24 h
clock with its zone, "16:14:21 UTC") and `[DAY]` (a day written by the `time` namespace). `⍽` in a frame is a no-break
space (U+00A0); in code it is always written as the escape `\u00a0`, never as a literal character.

## 0. Decisions at a glance

| Question | Decision |
|---|---|
| Register | Everyday standard Hindi (मानक हिंदी) as BBC Hindi, Google's and WhatsApp's Hindi interfaces write it: the common word of whatever origin (तस्वीर, हफ़्ता, जगह, शायद, असली next to उपग्रह, कक्षा, सार्वजनिक, क्षितिज). Never a heavy Sanskrit coinage where a common word exists, never Hinglish (no English verbs, no English plurals). |
| Address | `आप`, always. Instructions and buttons in the polite imperative `-एँ` (`खोजें`, `शेयर करें`, `फिर कोशिश करें`), which has no gender. `आप` is never the subject of a participle that shows gender (`थे / थीं`, `रहे / रही`, `सकते / सकती`, `गए / गईं`). The copula `हैं` is allowed (`आप उसमें नहीं हैं`). |
| Product verb ("watched") | `देखना`: `देखा`, `देखा गया`. Never `निगरानी`, `नज़र रखना`, `जासूसी`, `फ़ोटो खींचना` as the product verb. |
| Hero | `किसी चीज़ ने` / `इस हफ़्ते` / `*आपको* देखा।` |
| "Satellite" | `उपग्रह` (m), plural `उपग्रह`, oblique plural `उपग्रहों`. Never `सैटेलाइट` / `सैटेलाइट्स`. |
| Satellite as subject | Every satellite and station is masculine (`उपग्रह`, `स्टेशन`, `यान` are all masculine), so a bare `[SAT]` takes masculine agreement and needs no head noun. Perfective transitive sentences use `ने`, so the verb never agrees with the satellite anyway (`Sentinel-2C ने *Waterloo* को देखा`). A nameless satellite is `एक उपग्रह` / `किसी उपग्रह ने`. |
| Place name | Always followed by a postposition (`को`, `के ऊपर`, `में`, `पर`, `से`, `तक`, `का/की/के`) or standing alone (a title, after a colon). Never the subject of a verb or adjective that would have to agree with it. Pointed back to with `यहाँ`, `इस जगह`, `उसके ऊपर`. |
| Counts | `one` / `other` from `fmt('hi').plural`, but Intl puts 0 in `one`: Hindi counts zero with the plural (`0 तस्वीरें`), so every count goes through a helper that sends 0 to `other` (§5.3). Before a postposition the noun takes its oblique plural (`7 दिनों में`, `256 उपग्रहों ने`). |
| "Pass" | Noun `उड़ान` (f; `उड़ानें`, oblique `उड़ानों`). A count of passes in a verdict is `बार` (invariant): `देखा गया · 31 बार`. Never `पास` (it means "near"). |
| Verdicts | `देखा गया` · `संभवतः देखा गया` · `यहाँ देख सकता था` · `ऊपर से गुज़रा`. Lanes: `तस्वीर` · `संभवतः` · `पहुँच में` · `ऊपर से`. Every word of the could verdict rests on `पहुँच` (reach): `पहुँच में`, `पहुँच के दायरे में आया`, `[PLACE] तक … की पहुँच थी`. |
| Image vs photo | `तस्वीर` (f) for any image (photo, mosaic, radar, full disc); `फ़ोटो` (f) only for an optical photograph. A radar image is `रडार तस्वीर`, never `फ़ोटो`. |
| Digits | Western 0–9 from `fmt('hi')` (Intl `hi`), with Intl's Indian grouping (`16,893`, `12,34,567`). Never Devanagari digits ०१२. |
| Units | `किमी`, `मी`, `सेमी` in readouts, chips and prose (as Hindi newspapers write them). A speed is `किमी/से` in a readout cell only; in prose it is `किमी प्रति सेकंड` (a bare `से` reads as the postposition: `किमी/से की रफ़्तार से`). Post text spells `मीटर` and keeps `किमी`. `°` and `%` attach to the number. A no-break space ties a number to its unit or noun. |
| Punctuation | The danda `।` ends every sentence in running copy, attached to the last word. `?` for questions. Labels, buttons and chips take no final mark. No semicolons in Hindi prose, no exclamation marks, curly quotes “ ”. |
| Spelling | Nukta on `ज़` and `फ़` always (`हफ़्ता`, `ज़मीन`, `फ़ोटो`); never on क ख ग (`आखिरी`, `खबर`, `करीब`). Chandrabindu where the syllable has nothing above the headline (`यहाँ`, `पहुँच`, `ऊँचाई`), anusvara where it has (`में`, `हैं`, `नहीं`, `तस्वीरें`) and for a nasal before a consonant (`अंदर`, `संबंध`). |
| Dates | Gregorian, CLDR `hi` names from Intl, never a table: `रवि, 1 नवंबर` (pass rows), `रविवार, 1 नवंबर` (spoken), `1 नवंबर 2026`. Full month names everywhere (CLDR's `नव॰` abbreviations are not how Hindi copy writes dates). Ranges `1 → 8 नवंबर`. |
| Time | International 24 h clock with its zone (`16:14 EST`), never `बजे` or `सुबह / शाम` around it. In prose a clock takes `पर` (`16:14 UTC पर`), and post text says `स्थानीय समयानुसार 11:21 पर`. |
| Compass | Prose uses Hindi words (`दक्षिण की ओर`, `61 किमी पश्चिम में`); the 16-point readout abbreviations stay Latin (`SSW`), as coordinates do. |
| Never translated | Watched, www.watched.earth, satellite, sensor, product and agency names (in Latin: NASA, not नासा), NORAD ids, UTC and zone abbreviations, coordinates, licence attribution lines, file-name words (`watched-…-week-…`, the video's fallback `place`), key caps (`Enter`, `Space`, `Esc`, as Indian keyboards print them). |
| Script | `data-script="devanagari"`. Devanagari has no case: a mono caps row simply shows the words (Latin inside it still uppercases). Letter-spacing must be 0 on Devanagari, or the headline stroke breaks (§6.8). |

## 1. Register and address

### 1.1 The register

The reader is anyone who reads Hindi on a phone in India: a student in Lucknow, an engineer in Pune who reads Hindi
news, a retired teacher in Patna. They meet good Hindi daily in BBC Hindi, Dainik Bhaskar's and Amar Ujala's web desks,
and the Hindi interfaces of Google, WhatsApp and their bank. That is the register: **standard written Hindi that sounds
like careful speech.**

Two failure modes sit on either side of it.

- **Sanskritised officialese** (सरकारी हिंदी): `छायाचित्र` for photo, `अभिलेखागार` for archive, `उपलब्धता की स्थिति`,
  `कृपया पुनः प्रयास करें`. Correct, and unreadable as an interface: it sounds like a railway form. A word of Sanskrit
  origin is fine when it is the ordinary word (`उपग्रह`, `कक्षा`, `क्षितिज`, `सार्वजनिक`, `दैनिक`, `संभवतः`); it is
  wrong when a common word exists (`तस्वीर` over `छायाचित्र`, `संग्रह` over `अभिलेखागार`, `फिर` over `पुनः`).
- **Hinglish**: `सैटेलाइट्स ने वॉच किया`, `इमेजेज़ पब्लिश हुईं`, `लोकेशन एक्सेस डिनाइड`. English verbs with `किया`,
  English plurals (`-स`, `-ज़`) and English nouns where Hindi has a common one make the product sound like a quick
  machine pass.

Loanwords are welcome where they are the established Hindi word in Indian interfaces and news: `शेयर करें`, `लिंक`,
`कॉपी`, `पोस्ट`, `वीडियो`, `फ़ोटो`, `कैमरा`, `रडार`, `पिक्सेल`, `ग्लोब`, `पिन`, `रीप्ले`, `ज़ूम`, `डाउनलोड`, `सेव`,
`ब्राउज़र`, `कनेक्शन`, `लोकेशन`, `टाइम-लैप्स`, `स्कैन`, `मोज़ेक`, `इन्फ्रारेड`. They decline as Hindi nouns (`लिंक`
m, `पोस्ट` f, `फ़ोटो` f, `लोकेशन` f) and never take an English plural.

### 1.2 Address: `आप`, and the gender trap

`आप` is the only choice. `तुम` is what friends and family use; from an app it reads as either over-familiar or rude, and
no Indian product addresses a stranger with it. `आप` also carries no gender in its own forms: `आपको`, `आपका / आपकी /
आपके` (agreeing with the thing possessed, never with the reader), `आपके ऊपर`, `आपकी जगह`.

The trap is the verb. Hindi participles agree with their subject in gender: `आप देख सकते हैं` addresses a man, `आप देख
सकती हैं` a woman, and the code cannot know which. So:

Allowed:
- The polite imperative / subjunctive in `-एँ`, which has no gender: `खोजें`, `देखें`, `आज़माएँ`, `शेयर करें`, `फिर
  कोशिश करें`. It is the form every Hindi interface uses for buttons and instructions.
- `आप` as the subject of the copula `हैं` / `हों`, which has no gender: `तस्वीर में आप हैं ही नहीं`, `अगर आप धरती के उस
  हिस्से में हैं`.
- `आपको`, `आपका`, `आपके`, `आपकी` anywhere.
- The product's `हम` with masculine plural verbs, the conventional neutral for an organisation: `हम गिनते हैं`, `हम नहीं
  जान सकते`.
- Impersonal and passive frames: `… भेजी जाती है`, `… नहीं हो सकी`, `… किया जा सकता है`.
- The reader's own voice in the first person, where the English has it (`मेरी लोकेशन`, `क्या यह मुझे देख सकता है?`
  with `यह` as the subject).

Banned:
- `आप` as the subject of any participle: `आप थे / थीं`, `आप देख रहे हैं`, `आप चाहें तो देख सकते हैं`, `आपने चुना`
  (fine grammatically, `ने` makes it neutral, but the product never narrates what the reader did). Where the English
  itself says "you picked", the possessive participle keeps the reader and agrees with the thing: `आपकी चुनी हुई
  उड़ान`.
- An adjective that describes the reader (`आप तैयार हैं`, `आप जुड़े हुए हैं`).
- `तुम`, `तू`, slash forms (`सकते/सकती`), and `कृपया` (§2.3).

Rewrites of the English "you + verb":

| English | Hindi | How |
|---|---|---|
| If you were in reach | `अगर आपकी जगह पहुँच में थी` | The verb agrees with `जगह` (f). |
| You're not in it | `तस्वीर में आप हैं ही नहीं` | Copula. Name the picture: `आप उसमें नहीं हैं` after "a car is one pixel" read "you're not in the car". |
| the pass you picked | `आपकी चुनी हुई उड़ान` | Possessive participle, agrees with `उड़ान`. Privacy text keeps the "you". |
| Check your connection and try again | `अपना कनेक्शन जाँचें और फिर कोशिश करें` | Polite imperative. |
| It saw your clouds, not your streets | `उसने आपके बादल देखे, आपकी सड़कें नहीं` | `ने`; the verb agrees with `बादल`. |

### 1.3 Surfaces

| Surface | Form | Example |
|---|---|---|
| Display lines (hero, headline, About title, card) | Declarative, verb-final, past tense, the danda at the end. | `पिछले 7 दिनों में *Waterloo* को **256 उपग्रहों ने देखा**।` |
| Sentences (results, pass paragraph, footnotes) | Plain declarative Hindi; `हम` for the product; the satellite as subject. | `16:14:21 UTC पर Sentinel-2C ठीक ऊपर से गुज़रा।` |
| Buttons | Polite imperative `-एँ` with its object, or a bare noun where the screen implies the action. | `शेयर करें` · `लिंक कॉपी करें` · `रद्द करें` · `रीप्ले` |
| Mono labels (readouts, chips, section rules) | Nouns or noun phrases, no final mark. | `ऊँचाई 786 किमी` · `02 / उड़ानें` · `बादल छाए · 93%` |
| Status lines (progress) | A noun with `जारी` or a short `-रहे हैं` / `-हो रही है` clause, no final mark. | `खोज जारी` · `सूची लोड हो रही है` |
| Error notices | What failed, impersonally (`… नहीं हो सकी`, `… से जवाब नहीं मिला`), then one recovery step as a polite imperative. | `कक्षाओं की सूची लोड नहीं हो सकी। अपना कनेक्शन जाँचें और फिर कोशिश करें।` |
| About | Plain, warm, second person; the visitor's questions as questions. | `क्या यह मुझे देख सकता है? नहीं।` |

## 2. Voice

### 2.1 How "declarative, specific, quietly uncanny, second person" sounds in Hindi

- **Declarative:** the simple past, stated flat (`देखा`, `गुज़रा`, `सार्वजनिक हुईं`). `शायद` only where the English
  says "may" or "might"; `संभवतः` only in the likely verdict's name.
- **Specific:** the number and the name carry the sentence (`786 किमी की ऊँचाई पर`, `16:14:21 UTC पर`, `7.46 किमी
  प्रति सेकंड की रफ़्तार से`). Never round a number and never replace one with `कई` or `बहुत सारे`.
- **Quietly uncanny:** Hindi is verb-final, so the weight falls on the last words: `*आपको* देखा।`, `…आपके आसमान से
  गुज़रा।`, `उसने आपके बादल देखे, आपकी सड़कें नहीं।` Calm is the point: no `सचमुच`, `बिल्कुल`, `ज़बरदस्त`, no
  exclamation mark, no drama word.
- **Second person:** `आप` where the English has "you", `आपकी जगह` where it has "your spot", `आपका आसमान` for "your
  sky". Never add `आप` for warmth where the English has none.

### 2.2 Rhythm and length

- One fact per sentence, about 20 words at most. A number with its unit counts as one word.
- Hindi prefers two short sentences to one long one with a participle chain. The English "…, moving south at 7.46
  km/s" becomes a second sentence: `वह 7.46 किमी प्रति सेकंड की रफ़्तार से दक्षिण की ओर जा रहा था।` The same goes
  for appositive tails after the verb (`…, अपने रास्ते के एक तरफ़।`, `…गुज़रा, ठीक ऊपर से।`, `…, Sentinel-2 से लिया
  गया और … रंग-संतुलित।`): they are English order; give them a sentence of their own.
- Time, subject, place, manner, verb: `[TIME] पर [SAT] [where] गुज़रा।` The focus sits right before the verb, which is
  where the headline puts its strong count (§3.3).
- Postpositions belong to their noun: in display lines a no-break space ties a short postposition to the name before it
  (`Waterloo⍽को`), so a line never starts with `को` (§6.7).

### 2.3 What to avoid

- **Officialese:** `कृपया`, `पुनः`, `उपलब्धता`, `संबंधित`, `उक्त`, `हेतु`, `द्वारा` as a reflex passive (`उपग्रह द्वारा
  देखा गया` → `उपग्रह ने देखा`). `कृपया` in particular: the English never says "please", and a Hindi interface that
  does on every error sounds like a government portal.
- **Calques of English structure:**
  - `X के द्वारा Y किया गया` for an English passive: write the active with `ने`.
  - `X होने के नाते`, `के संदर्भ में`, `के रूप में`, `के तौर पर` for "as": say the thing (`जो अब कक्षा में बैकअप
    है`, not `बैकअप के तौर पर तैयार रखा गया`).
  - A zeugma that hangs two nouns on one verb that fits only one: `पेज व्यू गिनता है और पेज की रफ़्तार मापता है`,
    never `पेज व्यू और रफ़्तार गिनता है`.
  - Agency for things that have none: a pass does not take a picture (`उस उड़ान से … जिसमें वह ली गई`, not `जिसने उसे
    लिया`), and we do not "run" a satellite (`उपग्रह को चलाना` is to operate it: `हर उपग्रह की स्थिति की गणना करते
    हैं`).
  - `करके` chains translating English participles: split the sentence.
  - `यह है कि …` openers, `जैसा कि आप जानते हैं`.
  - English word order with Hindi words (`देखा Waterloo को 256 उपग्रहों ने`).
- **Marketing:** `खोजिए`, `जानिए`, `अद्भुत`, `अभी देखें!`, `बिल्कुल मुफ़्त`. The English never sells.
- **Religious and fatalistic formulas** for uncertainty or delay: never `भगवान जाने`, `राम भरोसे`. "We can't know" is
  `हम नहीं जान सकते`.
- **Over-politeness and apology:** `क्षमा करें`, `माफ़ कीजिए`, `दुर्भाग्य से`. The English states the fact and moves on.

### 2.4 Before and after

| Before (rejected) | After | What changed |
|---|---|---|
| `पिछले सात दिनों में 256 सैटेलाइट्स ने वॉटरलू की फ़ोटो खींची!` | `पिछले 7 दिनों में *Waterloo* को **256 उपग्रहों ने देखा**।` | Hinglish plural, the photographed verb, a respelt place name, a spelled-out number and an exclamation mark, all gone. |
| `कृपया अपना इंटरनेट कनेक्शन चेक करें और पुनः प्रयास करें।` | `अपना कनेक्शन जाँचें और फिर कोशिश करें।` | `कृपया` and the Sanskrit `पुनः प्रयास` out; `जाँचें` over Hinglish `चेक करें`. |
| `आप देख सकते हैं कि आपके ऊपर से कौन से उपग्रह गुज़रे।` | `पिछले 7 दिनों में उसके ऊपर से गुज़रे सभी उपग्रह देखें…` | The gendered `सकते` becomes an imperative. |
| `Waterloo के ऊपर उपग्रहों द्वारा निगरानी की गई।` | `*Waterloo* को 256 उपग्रहों ने देखा।` | `द्वारा` passive and `निगरानी` (surveillance) out. |
| `Waterloo साफ़ था।` | `आपकी जगह पर आसमान साफ़ था।` | The adjective had to guess the place's gender. |

## 3. The key lines

### 3.1 The hero

```
किसी चीज़ ने
इस हफ़्ते
*आपको* देखा।
```

As a catalog entry: `hero: [['किसी चीज़ ने'], ['इस हफ़्ते'], [accent('आपको'), ' देखा।']]`, the same in `landing.hero`
and `card.hero`.

- "Something" is `किसी चीज़ ने`, "some *thing*": the agent of seeing is a thing, which is exactly the slight wrongness
  the English has. `किसी ने` would mean "someone", a person, a stalker; the English is careful to say a thing.
- `ने` makes `देखा` masculine singular whatever watched, so nothing in the line has a gender to guess.
- The accent is `आपको`, the word that means "you", in the serif, followed by the verb. Hindi ends on the verb, so the
  line lands as `*you* saw.` The full stop is the danda.
- The order Subject · Time · Object · Verb is unmarked Hindi, and opening on "Something" keeps the English hook.

| Alternate | Why it loses |
|---|---|
| `इस हफ़्ते` / `किसी चीज़ ने` / `*आपको* देखा।` | Equally natural, but it opens slowly on a time phrase; the English opens on the strange subject. |
| `इस हफ़्ते किसी की` / `नज़र *आप* पर` / `पड़ी।` | A lovely idiom ("someone's gaze fell on you"), but `किसी` is a person, and the product verb everywhere else is `देखना`. |
| ~~`किसी चीज़ ने इस हफ़्ते आप पर नज़र रखी।`~~ | `नज़र रखना` is keeping someone under watch: surveillance. |
| ~~`इस हफ़्ते कोई आपको देख रहा था।`~~ | A person, and the progressive claims it lasted; the English states one past fact. |

Tab title (`app.documentTitle` and the boot title): `Watched · किसी चीज़ ने इस हफ़्ते आपको देखा` (no danda: a title takes
no full stop). The share hook and the invite echo it: `किसी चीज़ ने इस हफ़्ते आपको भी देखा।` Every question the
product asks about it keeps the same thing-subject: `इस हफ़्ते आपको किस चीज़ ने देखा?`, never `किसने`, which asks "who"
about a person (§3.6).

### 3.2 The sub line

`धरती की कोई भी जगह खोजें। पिछले 7⍽दिनों में उसके ऊपर से गुज़रे सभी उपग्रह देखें, और उनकी ली हुई असली तस्वीरें भी।`

- "Enter any place" is `खोजें`, the field's own word (`कोई जगह खोजें`). `डालें` is right for typed data (`पासवर्ड
  डालें`, `पता डालें`), but `जगह डालें` ("insert a place") is not Hindi, and the share card that repeats the line has no
  field at all. `धरती` is the everyday word for the Earth.
- `उसके ऊपर` points back to `जगह`; `उसके` agrees with nothing, so the pronoun is safe.
- `गुज़रे सभी उपग्रह` ("all the satellites that passed") is plural, so `उनकी` has a plural to point back to: `गुज़रा
  हर उपग्रह … उनकी` mixed a singular and a plural.
- `उनकी ली हुई असली तस्वीरें भी` ("and the actual pictures they took, too"): `ली हुई` agrees with `तस्वीरें`. `असली`
  carries "actual". `भी` closes the sentence on the pictures, as the English does.
- The share page's generic description is the same sentence (`card.page.description`, with 7 written in), and the
  default card's footer is its first clause (`धरती की कोई भी जगह खोजें`).

### 3.3 Results headline and second line

**`results.headline.watched(n, place, when)`**

```
{window} *{place}*⍽को **{n}⍽{उपग्रह ने | उपग्रहों ने} देखा**।
```

| Case | Hindi |
|---|---|
| n = 1 | `पिछले 7 दिनों में *Waterloo* को **1 उपग्रह ने देखा**।` |
| n = 256 | `पिछले 7 दिनों में *Waterloo* को **256 उपग्रहों ने देखा**।` |
| An older window | `29 अक्टूबर से 5 नवंबर के बीच *Waterloo* को **256 उपग्रहों ने देखा**।` |
| A one-day window | `पिछले 1 दिन में …` |

- Object before subject (OSV) is ordinary Hindi when the subject is the news: the pre-verbal position is Hindi's focus
  position, and that is where the strong count phrase sits. The English bolds "256 satellites watched"; Hindi bolds the
  same words in its own order, num inside the strong part.
- `ने` makes `देखा` independent of the count's number and the place's gender: one verb form for every n.
- The accent is the place alone; `को` follows as plain text, tied by a no-break space.

**`results.headline.none(place, past)`**: `इस हफ़्ते *Waterloo* को हमारी सूची के किसी भी उपग्रह ने नहीं देखा।` (`उस
हफ़्ते` for a past week). "No satellite we track" is "no satellite on our list", the orbit catalog we load; `किसी भी`
carries the "no … at all", and the card's zero headline says the same words.

**`results.imagesPublic(k)`**

| k | Parts | While partial |
|---|---|---|
| 1 | `**कम से कम **` + `num(1)` + `⍽तस्वीर सार्वजनिक हुई।` | `कम से कम 1 तस्वीर सार्वजनिक हुई।` |
| 27 | `**कम से कम **` + `num(27)` + `⍽तस्वीरें सार्वजनिक हुईं।` | `कम से कम 27 तस्वीरें सार्वजनिक हुईं।` |

- `सार्वजनिक हुईं` ("became public") is how Hindi news says it; the verb agrees with `तस्वीर` (f), which we know, so
  removing `कम से कम` changes no other word.
- `noImages`: `इस हफ़्ते कोई तस्वीर सार्वजनिक नहीं हुई।` / `उस हफ़्ते …`
- `archiveDown`: `तस्वीरों के संग्रहों ने जवाब नहीं दिया, इसलिए हम अभी सार्वजनिक तस्वीरें नहीं गिन सकते।`

**`results.why`**

| Key | Hindi |
|---|---|
| `sunNeverRose` | `सूरज निकला ही नहीं, इसलिए दिन के उजाले पर निर्भर कोई कैमरा इसे नहीं देख सका।` |
| `sunBarelyRose` | `सूरज मुश्किल से ही निकला, इसलिए दिन के उजाले पर निर्भर कोई कैमरा इसे नहीं देख सका।` |
| `infrared(n)` | `फिर भी मौसम उपग्रहों ने इन्फ्रारेड में इसे ` + `3` + ` बार स्कैन किया।` (`ने` + `इसे`: no agreement) |
| `radar(…)` | `रडार को रोशनी की ज़रूरत नहीं होती। Umbra-08, Capella-14 और 7 दूसरे रडार उपग्रह पहुँच के दायरे में ` + `1,204` + ` बार आए।` One name alone: `… Umbra-08 पहुँच के दायरे में 3 बार आया।` The verb phrase stands between the names and the count, so `Capella-14` never runs into `1,204`. The list is joined by hand: Intl's `hi` list puts a comma before `और`, which Hindi does not (§5.4). |
| `unpublished(n)` | `Sentinel-2 या Landsat का एक उपग्रह दिन के उजाले में एक बार यहाँ से गुज़रा, पर अभी तक कोई दृश्य प्रकाशित नहीं हुआ है।` / `Sentinel-2 या Landsat के उपग्रह दिन के उजाले में 3 बार यहाँ से गुज़रे, …` (a head noun, so the verb's number is not a guess between two names). Daylight is `दिन के उजाले में`: `दिन में 3 बार` is the idiom for "3 times a day". |
| `none` | `सार्वजनिक तस्वीरें देने वाला कोई उपग्रह दिन के उजाले में यहाँ से नहीं गुज़रा।` |

The footnotes: each count is followed by its own noun, its sources in brackets, so no count sits before a noun it does
not count (`5 बारीक ब्योरे वाली तस्वीरें (Sentinel-2, Landsat, 10–30 मी) · 1 दैनिक मौसम मोज़ेक (250–375 मी) · 3 पूरी
डिस्क की तस्वीरें (भूस्थिर मौसम उपग्रहों से, …)`; `1 मौसम के दैनिक मोज़ेक` and `1 भूस्थिर मौसम उपग्रहों से` read "one
weather" and "one satellites"). The zone after the pass-times note is a label after a colon (`स्थानीय समय: UTC−9 ·
समुद्र में।`): it can end in a postposition of its own.

### 3.4 The pass paragraph (`pass` namespace)

The English sentence "Sentinel-2C crossed 786 km overhead at 16:14:21 UTC, moving south at 7.46 km/s." becomes two
Hindi sentences, the way a Hindi news report would write it, with the clock first:

```
[TIME] पर [SAT] ठीक ऊपर से गुज़रा। वह [ALT] की ऊँचाई पर [SPEED] की रफ़्तार से [HEADING] की ओर जा रहा था।
[TIME] पर [SAT] यहाँ से [KM] [DIR] से गुज़रा। वह …
```

`16:14:21 UTC पर Sentinel-2C ठीक ऊपर से गुज़रा। वह 786 किमी की ऊँचाई पर 7.46 किमी प्रति सेकंड की रफ़्तार से दक्षिण
की ओर जा रहा था।`

- The clock opens the sentence. Hindi's unmarked order would put it after the subject (`Sentinel-2C 16:14:21 UTC पर`),
  but a satellite name that ends in a number then runs into the clock (`Landsat 9 16:14 EST`, `WorldView Legion 4
  10:52`); a time adverb first is just as natural.
- The altitude goes to the second sentence for the same reason (`Landsat 9 705 किमी`).
- `गुज़रा`, `जा रहा था`: masculine, for the satellite (§5.2). `वह` points back to it, and `उसका`, `उसके`, `उसने`
  throughout the paragraph (never a mix of `यह` and `वह` forms). The camera is the subject when it is the camera that
  looks (`उसका कैमरा सीधे नीचे देख रहा था`), which also saves a third `वह` in a row.
- Three direction frames from one word table. The path it passed by takes `से`, as `गुज़रना` always does (`ऊपर से`,
  `पास से`): `यहाँ से 61 किमी पश्चिम से गुज़रा` (the two `से` are ordinary Hindi, as in a cyclone report). Where it was
  takes `में`: `वह यहाँ से 140 किमी पूर्व में था`, `आपके क्षितिज से 40° ऊपर, उत्तर-पश्चिम में`. Where it was heading
  takes `की ओर` (`दक्षिण की ओर`).
- A speed in prose is `किमी प्रति सेकंड`; `किमी/से` is for readout cells (§0).
- The time takes `पर`, never `बजे`: `बजे` is for spoken hours, not a 24 h clock with seconds.

The other sentences:

| Key | Hindi |
|---|---|
| `lookingDown` | `उसका कैमरा सीधे नीचे देख रहा था।` |
| `lookingOff(deg)` | `उसका कैमरा सीधे नीचे से 5.4° हटकर देख रहा था।` |
| `cloudCover(pct)` | `पूरे दृश्य के 25% हिस्से पर बादल थे।` At 0: `पूरे दृश्य में बादलों का हिस्सा 0% था।` |
| `mosaic` | `उसके VIIRS इमेजर ने Waterloo को NASA के असली रंगों वाले दैनिक मोज़ेक में 375 मी प्रति पिक्सेल पर दर्ज किया।` |
| `radarImaged` | `उसके रडार ने एक तरफ़ 38.2° के कोण पर देखते हुए अंधेरे में Waterloo की तस्वीर 20 मी प्रति पिक्सेल पर ली।` ("looking", as the English: Sentinel-1 looks sideways by design; `झुककर` would say it leaned) |
| `likely.crossed` | `16:14 EST पर Landsat 9 ठीक ऊपर से गुज़रा। वह 705 किमी की ऊँचाई पर था, और यह जगह उसकी 185 किमी चौड़ी पट्टी के भीतर थी।` |
| `likely.dark` | `यहाँ अंधेरा था। मौसम इमेजर रात में भी इन्फ्रारेड में स्कैन करते रहते हैं, इसलिए उसने आपके बादल देखे, आपकी सड़कें नहीं।` |
| `could.withinView` | `10:52 EST पर WorldView Legion 4 पहुँच के दायरे में आया। वह यहाँ से 140 किमी पूर्व में था।` / overhead: `… पहुँच के दायरे में आया। वह ठीक ऊपर था।` (the verdict's verb, then where it was; `वह ठीक ऊपर था`, not a second `गुज़रा`, which the swath's `गुज़री` follows) |
| `could.insideSwath` | `उसकी 32 किमी चौड़ी पट्टी Waterloo के ऊपर से गुज़री। उसका संचालक यह नहीं बताता कि उपग्रह ने कहाँ की तस्वीरें लीं, इसलिए हम नहीं जान सकते कि उसने यहाँ की तस्वीर ली या नहीं।` |
| `could.radar` | `रडार बादलों और अंधेरे के पार देखता है। वह एक तरफ़ 38.2° मुड़कर Waterloo की रडार तस्वीर ले सकता था। हमें इस उड़ान में ली गई इस जगह की कोई प्रकाशित तस्वीर नहीं मिली।` ("pointing": a steerable radar turns, as a steerable camera does; "mapped" is `रडार तस्वीर ले सकता था`, never `नक्शा बना सकता था`, which is drawing a map) |
| `could.camera` | `वह सीधे नीचे से 24.1° मुड़कर Waterloo को देख सकता था। हम नहीं जान सकते कि उसने देखा या नहीं।` / straight down: `वह बिना मुड़े ही Waterloo को देख सकता था। …` |
| `geo.sits` | `Meteosat-12 ऊपर से गुज़रता नहीं। वह 0.2°W पर भूमध्य रेखा से 35,786 किमी ऊपर टिका रहता है और हर 10 मिनट में अपने नीचे की धरती का पूरा चेहरा स्कैन करता है।` |
| `geo.reached` | `इस स्कैन की रेखा करीब 07:49 CET पर Paris तक पहुँची और उत्तर की ओर बढ़ रही थी।` (agrees with `रेखा`, f) |
| `overhead` | `21:04 IST पर ISS (ZARYA) ऊपर से गुज़रा। वह 418 किमी की ऊँचाई पर था, आपके क्षितिज से 40° ऊपर, उत्तर-पश्चिम में।` |
| `darkStation` | `जहाँ आप हैं, वहाँ अंधेरा था। अगर तब भी स्टेशन पर धूप पड़ रही थी, तो वह बिना टिमटिमाए चमकते एक बिंदु की तरह आपके आसमान से गुज़रा।` ("steady" is "not blinking": `स्थिर बिंदु` is a point that stands still, which cannot cross a sky) |
| `likely.notPublished` | `उसकी तस्वीरें मौसम के पूर्वानुमान में काम आती हैं, पर ऐसे प्रकाशित नहीं होतीं कि हम उन्हें दिखा सकें।` |
| `likely.mosaicUnconfirmed` | `इस उड़ान के NASA दैनिक मोज़ेक में आपकी जगह है या नहीं, इसकी पुष्टि नहीं हो सकी।` |

`likely.crossed`'s "inside its swath" makes our own noun the subject of `थी`, which agrees with `जगह` (f): the frame
says `यह जगह`, never `Waterloo थी`. `could.insideSwath`, whose English starts with the place, makes the swath the subject
and says what the likely verdict says, `पट्टी … के ऊपर से गुज़री`. Never `पट्टी ने … को ढका`: `ढकना` is to cover with a
lid or a cloth, and no Hindi writer says a strip of ground covered a town (clouds do cover: `इस जगह को बादलों ने ढक लिया`
stays).

After `उसका संचालक`, name the camera or the satellite again (`कि कैमरे ने इधर देखा`, `कि उपग्रह ने कहाँ की तस्वीरें
लीं`): a bare `उसने` or `वह` there is read as the operator.

### 3.5 The four verdicts (`verdicts` namespace)

| Verdict | Title | Lane | Definition | Spoken verb |
|---|---|---|---|---|
| imaged | `देखा गया` | `तस्वीर` | `इस जगह की एक असली तस्वीर किसी सार्वजनिक संग्रह में मौजूद है।` | `देखा` |
| likely | `संभवतः देखा गया` | `संभवतः` | `न मुड़ने वाले कैमरे की पट्टी इस जगह के ऊपर से गुज़री। इस जगह की कोई तस्वीर प्रकाशित नहीं हुई है।` | `पट्टी ऊपर से गुज़री` |
| could | `यहाँ देख सकता था` | `पहुँच में` | `मुड़ने वाला या निजी कैमरा पहुँच में था। उसका संचालक नहीं बताता कि कैमरे ने इधर देखा या नहीं।` | `पहुँच के दायरे में आया` |
| overhead | `ऊपर से गुज़रा` | `ऊपर से` | `आपके आसमान से गुज़रा। स्टेशन और बाकी सब कुछ।` | `ऊपर से गुज़रा` |

- The four titles are one gradient on one verb: `देखा गया` (was watched), `संभवतः देखा गया` (probably watched),
  `यहाँ देख सकता था` (could have looked here), `ऊपर से गुज़रा` (passed over). A reader sees at once that they are
  degrees of the same question.
- `देखा गया` is also how Hindi messaging apps mark a message as "Seen". The echo is apt and quietly uncanny, and it is
  the default masculine singular, so it agrees with nothing.
- `संभवतः` ("probably") over `शायद` ("maybe"): the English says likely, and `notYet` says "almost certainly".
- The lanes name what each verdict rests on, so no two read alike: `तस्वीर` (a picture), `संभवतः` (probably), `पहुँच
  में` (in reach), `ऊपर से` (overhead). `मुमकिन` ("possible") was the first choice for the could lane, but `संभवतः`
  comes from `संभव`, "possible": the two read as near-synonyms from two registers. `पहुँच में` fits the lane at 1280 px
  and up (checked) and is the could verdict's own word.
- The could verdict's words all rest on `पहुँच` (reach): the lane `पहुँच में`, the definition `कैमरा पहुँच में था`, the
  spoken verb `पहुँच के दायरे में आया` (to come within range; `पहुँच के भीतर से गुज़रना`, "to pass from inside reach",
  is a calque), the card `Waterloo तक · Sentinel-2C की पहुँच थी।`, the post and the share page `यह जगह उसकी पहुँच में
  थी।`.
- `यहाँ देख सकता था`: masculine, for the satellite. "Pointed" becomes "looked": the could verdict is about what the
  camera was able to do, and `देख` keeps it on the product's verb.
- The unit after every verdict's count is `बार` ("times"): `देखा गया · 31 बार` reads "watched 31 times". `बार` does not
  change with the number, so readouts need no plural.
- A fixed camera is `न मुड़ने वाला कैमरा`, a steerable one `मुड़ने वाला कैमरा`: one is the exact opposite of the other.
  Never `स्थिर कैमरा` (that is a stationary camera), and not `सीधे नीचे देखने वाला कैमरा`: "fixed" means it cannot be
  pointed, and the likely lane holds VIIRS, MODIS and AVHRR, whose swaths reach far to the side (an imaged pass then
  says `उसका कैमरा सीधे नीचे से 5.4° हटकर देख रहा था` about the same camera). Sentinel-2 and Landsat do look straight
  down, and About says so of them.

### 3.6 Share card, share page and post

**Card headlines** (blocks: the accent block holds the place and its postposition; the text block the rest):

| Key | Blocks |
|---|---|
| `headline(31, place)` | `*Waterloo को*` · `31 उपग्रहों ने देखा।` |
| `headline(1, place)` | `*Waterloo को*` · `1 उपग्रह ने देखा।` |
| `headlineBy.imaged` | `*Waterloo को*` · `Sentinel-2C ने देखा।` |
| `headlineBy.likely` | `*Waterloo के ऊपर से*` · `Sentinel-2C की पट्टी गुज़री।` |
| `headlineBy.could` | `*Waterloo तक*` · `Sentinel-2C की पहुँच थी।` |
| `headlineBy.overhead` | `*Waterloo के ऊपर से*` · `Sentinel-2C गुज़रा।` |
| `headlineWeek(31)` | `*Waterloo को*` · `इस हफ़्ते 31⍽उपग्रहों⍽ने⍽देखा।` (the page title: `Waterloo को इस हफ़्ते 31 उपग्रहों ने देखा।`). The count phrase is tied, so the lead breaks after `इस हफ़्ते`, never before a lone `देखा।` (§6.7). |
| `headlineWeek(0)` | `*Waterloo को*` · `इस हफ़्ते हमारी सूची के किसी भी उपग्रह ने नहीं देखा।` (the results' words) |

- The place leads, in the serif, with its postposition on its line: a line that started with `को` would look broken.
  The danda belongs to the last text block, so a cut place (`…`) never collides with it.
- `likely` and `could` put a feminine noun in the subject (`पट्टी`, `पहुँच`), so the verbs agree with a word we chose,
  never with the place or the satellite. "Its swath passed over" is the honest fact, and so is "its reach extended to
  Waterloo" (`X तक Y की पहुँच थी` is idiomatic Hindi) for "passed within view of": a fact, as the English states it. The
  first draft's `की नज़र पहुँच सकती थी` made it a modal, gave the satellite a gaze, and sat next to the banned `नज़र
  रखना`.
- Nameless satellite: `किसी उपग्रह ने`, `किसी उपग्रह की पट्टी`, `किसी उपग्रह की पहुँच`, `एक उपग्रह गुज़रा`. The
  shared caption over a picture says `किसी उपग्रह ने … को देखा` too.

**The post** (`share.post`), plain text, one paragraph per message:

`Sentinel-2C ने रविवार, 1 नवंबर को स्थानीय समयानुसार 11:21 पर 795 किमी की ऊँचाई से Waterloo को देखा। एक पिक्सेल 10
मीटर का है, और यह असली तस्वीर है।`

- `स्थानीय समयानुसार` ("by local time") is the news idiom (`भारतीय समयानुसार`). The day takes `को`.
- A post spells `मीटर` and keeps `किमी`, as Hindi papers print them in prose.
- The altitude joins the place in one phrase, `Waterloo के 795 किमी ऊपर से गुज़रा`, never three postpositional phrases
  in a row (`11:21 पर 795 किमी की ऊँचाई पर Waterloo के ऊपर से`). `imaged` keeps `795 किमी की ऊँचाई से Waterloo को
  देखा`: "watched from 795 km up" is one phrase there.
- `likely`: `… Waterloo के 795 किमी ऊपर से गुज़रा। यह जगह उसके कैमरे की पट्टी के भीतर थी।`
- `could`: `… Waterloo के पास से गुज़रा। यह जगह उसकी पहुँच में थी। उसका कैमरा इधर मुड़ सकता था। उसका संचालक नहीं बताता
  कि कैमरा मुड़ा या नहीं।` It is the camera that turns: `वह इधर मुड़ सकता था` with `वह` the satellite reads as changing
  course, and a second `वह` after `संचालक` as the operator. The share page's `couldHave` is the same two sentences.
- The hooks: `किसी चीज़ ने इस हफ़्ते आपको भी देखा।` / `इस हफ़्ते आपके ऊपर से क्या गुज़रा?`; the credit `via @armaangupt0`
  (an X convention, kept).

**The share page's pass description** (`crossed`, `withinView`): with a time, the satellite leads and the date stands
between it and the place (`Sentinel-2C रविवार, 1 नवंबर 2026 को 11:21 EST पर दक्षिण की ओर जाते हुए Waterloo के 795 किमी
ऊपर से गुज़रा।`); without one, the place leads (`Waterloo के 795 किमी ऊपर से Sentinel-2C दक्षिण की ओर जाते हुए
गुज़रा।`). The heading folds into the sentence as the participle `… की ओर जाते हुए` (masculine, for the satellite): the
first draft's `गुज़रा और दक्षिण की ओर जा रहा था` joined a perfective and a progressive with `और`. `withinView` adds
`यह जगह उसकी पहुँच में थी।`. `straightDown` and `offNadir` make the camera the subject, as the pass paragraph does.

**The share page**: `placeTitle`: `Waterloo को इस हफ़्ते किस चीज़ ने देखा` (no danda: a heading); `question`: `इस
हफ़्ते आपको किस चीज़ ने देखा?`; the card's footer invite: `देखें, आपको किस चीज़ ने देखा` (it fits beside the address,
checked in the share sheet). "What watched you" keeps the hero's thing-subject (`किसी चीज़ ने`): `किसने` is the
ordinary "who did it", asked about a person, the reading the hero avoids.

### 3.7 Globe and HUD words

The globe's labels are instrument words: `तस्वीर ली 11:21:13 EST` (IMAGED), `प्राप्त 11:21:13 EST · 10 मी`
(ACQUIRED), `तस्वीर का समय · SENTINEL-2C` (ACQUISITION ·), `सबसे नज़दीकी पल · ISS` (CLOSEST APPROACH ·). The HUD: `कैसे काम
करता है`, `सूरज 16.2°S 063.0°E`, `सूरज के ठीक नीचे`, `16,893 वस्तुएँ · CELESTRAK GP`, `प्राप्त 2026-11-08 03:34Z`,
`42 मिनट पहले`, `पुरानी, 3 दिन पहले`.

## 4. Glossary

### 4.1 Terms

| English | Hindi | Gender | Notes |
|---|---|---|---|
| satellite | उपग्रह | m | Plural `उपग्रह`, oblique plural `उपग्रहों`. Declines naturally; `सैटेलाइट` would force `सैटेलाइट्स`. |
| watched (product verb) | देखना → `देखा`, `देखा गया` | | Never `निगरानी की`, `नज़र रखी`, `फ़ोटो खींची`. |
| image, picture | तस्वीर | f | `तस्वीरें`, `तस्वीरों`. Any kind of image. |
| photo, photograph | फ़ोटो | f | Optical photographs only (`Sentinel-2 और Landsat की फ़ोटो`). |
| pass (an overflight) | उड़ान | f | `उड़ानें`, `उड़ानों`. Never `पास` ("near"). |
| (a count of) passes in a verdict | बार | f | Invariant: `1 बार`, `31 बार`. |
| swath | पट्टी | f | "The strip of ground a fixed camera records": `290 किमी चौड़ी पट्टी`. It passes over a place (`पट्टी … के ऊपर से गुज़री`) or a place is inside it (`यह जगह … पट्टी के भीतर थी`); an imager scans one (`… चौड़ी पट्टी स्कैन करता है`). Never `ढकना` ("cover"). |
| off-nadir | झुकाव | m | The label; prose `सीधे नीचे से 5.4° हटकर`. |
| straight down (nadir) | सीधे नीचे | | |
| altitude | ऊँचाई | f | `786 किमी की ऊँचाई पर`. |
| elevation (angle above the horizon) | क्षितिज से … ऊपर | | Label `क्षितिज से`, unit `ऊपर`: `क्षितिज से 34° ऊपर`. |
| horizon | क्षितिज | m | |
| sky | आसमान | m | `आपका आसमान`. |
| ground track | ज़मीनी पथ | m | |
| ground speed | ज़मीनी रफ़्तार | f | Prose `… की रफ़्तार से`. |
| heading | दिशा | f | |
| ascending / descending | आरोही / अवरोही | | The heading's unit (`SSW · अवरोही`). Familiar from the `आरोह-अवरोह` of music and school science. |
| field of regard | देखने का दायरा | m | Corner label `दायरा ±30°`. |
| scene (an archive's whole image) | दृश्य | m | `पूरे दृश्य के 25% हिस्से पर बादल`. |
| detailed (imagery) | बारीक (chip) / बारीक ब्योरे वाली (prose) | | The filter chip is `बारीक`; in a sentence `बारीक ब्योरे वाली तस्वीरें`, since `बारीक तस्वीरें` reads "thin pictures". A pixel can be `बारीक` on its own (`सबसे बारीक पिक्सेल`). Coarse is `बारीक नहीं`, never the comparative `कम बारीक` with nothing to compare. |
| resolution (in a blurb) | … के पिक्सेल वाली तस्वीरें | | `3 मी के पिक्सेल वाली तस्वीरें`; a bare `3 मी पर` reads as a height or a distance. |
| image products | तस्वीरें | | `उत्पाद` is merchandise. |
| crop | हिस्सा | m | `संग्रह ने तस्वीर का यह हिस्सा नहीं भेजा।` |
| archive | संग्रह | m | `Sentinel-2 का संग्रह`, `खुला संग्रह`. Never `अभिलेखागार`. |
| open archive | खुला संग्रह | m | |
| publish / published | प्रकाशित करना / प्रकाशित | | `कोई तस्वीर प्रकाशित नहीं हुई है`. |
| made public | सार्वजनिक हुई(ं) | | The second line only. |
| orbit | कक्षा | f | `कक्षाएँ`, `कक्षाओं`. |
| orbital elements | कक्षा के आँकड़े | m pl | "The numbers that describe an orbit". Public ones: `कक्षा के सार्वजनिक आँकड़े` (never `सार्वजनिक कक्षा के आँकड़े`, "a public orbit's", nor `कक्षा आँकड़े` without `के`). They do not "drift": `उनकी सटीकता हर दिन थोड़ी घटती है`. |
| propagate (a satellite through SGP4) | स्थिति की गणना करना | | `उपग्रह को चलाना` is to operate it. |
| orbit catalog | कक्षाओं की सूची | f | Short `सूची` in labels. |
| object (in the catalog) | वस्तु | f | `16,893 वस्तुएँ`. |
| propagate orbits | कक्षाओं की गणना | f | |
| daily mosaic | दैनिक मोज़ेक | m | `दैनिक` as in the newspapers' names. |
| full disc | पूरी डिस्क | f | |
| geostationary | भूस्थिर | | The standard Hindi term (ISRO, textbooks). |
| weather satellite | मौसम उपग्रह | m | |
| imager | इमेजर | m | "Its VIIRS imager": `इसका VIIRS इमेजर`. |
| camera | कैमरा | m | `कैमरे` oblique. |
| radar | रडार | m | A radar image is `रडार तस्वीर`, never `फ़ोटो`. |
| infrared | इन्फ्रारेड | | Never `अवरक्त` (textbook-only). Chip `IR`. |
| cloud | बादल | m | `बादल छाए` = clouded over; `बादल 25%` = cloud cover. |
| thin cirrus | पतले बादल | m pl | Value `पतले बादल`. |
| cloud shadow | बादल की छाया | f | |
| clear | साफ़ | | |
| spot, your spot (the searched place) | जगह, आपकी जगह | f | |
| place | जगह | f | `इस जगह`, `यह जगह`. |
| position (the device's) | लोकेशन | f | As Indian Hindi apps say it. |
| look (closest look, clear look) | झलक | f | `सबसे नज़दीकी झलक`, `आखिरी साफ़ झलक`, `11 साफ़ झलकें`. |
| in reach, within view (the could verdict) | पहुँच | f | `पहुँच में`, `पहुँच के दायरे में आया`, `X तक Y की पहुँच थी`, `यह जगह उसकी पहुँच में थी` (§3.5). |
| k of n | n में से k | | `27 में से तस्वीर 3`, `12 में से फ़्रेम 3`, `इस तरह की 31 उड़ानों में से उड़ान 3`, `5 में से 2`. Never `X, कुल Y`. |
| frame (time-lapse) | फ़्रेम | m | |
| time-lapse | टाइम-लैप्स | m | |
| replay | रीप्ले | m | The button; known from cricket. |
| zoom in / out | ज़ूम बढ़ाएँ / ज़ूम घटाएँ | | Never `बड़ा करें`, which is the photo's expand (`तस्वीर बड़ी करें`). |
| smoothed / sharpened (photo touch-ups) | मुलायम करना / निखारना | | `मुलायम करके हल्का-सा निखारा जाता है`; `चिकना` is slick or oily and `तीखा` pungent. Pan-sharpened: `15 मी बैंड से और निखारी गई`. |
| share | शेयर करना | | `शेयर करें`. |
| link / post / card | लिंक (m) / पोस्ट (f) / कार्ड (m) | | |
| pixel | पिक्सेल | m | `10 मी प्रति पिक्सेल`, `एक पिक्सेल 10 मीटर का`. |
| operator | संचालक | m | |
| commercial | व्यावसायिक | | |
| private | निजी | | |
| steerable camera | मुड़ने वाला कैमरा | m | |
| fixed camera | न मुड़ने वाला कैमरा | m | The exact opposite of `मुड़ने वाला` (§3.5). |
| crewed station | मानवयुक्त स्टेशन | m | |
| space station | अंतरिक्ष स्टेशन | m | |
| the Earth | धरती | f | Warm and everyday; `पृथ्वी` is not wrong, but one word throughout. |
| Earth textures (the globe's, in the credits) | ग्लोब की तस्वीरें | f pl | `धरती की बनावट` is the Earth's structure, geology. |
| the sun | सूरज | m | `सूर्य` would be the science word; one word throughout, the everyday one. |
| daylight / day / twilight / night | दिन / दिन / धुंधलका / रात | | `धुंधलका` covers dawn and dusk; `गोधूलि` is only dusk. |
| sub-solar point | सूरज के ठीक नीचे | | The HUD label: "directly below the sun". |
| scan, scan line | स्कैन, स्कैन-रेखा | m, f | |
| equator | भूमध्य रेखा | f | |
| fault (the notice's label) | खराबी | f | The technical word (`तकनीकी खराबी`). The message body keeps the colloquial `कुछ गड़बड़ हो गई`. |
| stale (catalog) | पुरानी | | Agrees with `सूची`. |
| orbit maths | कक्षाओं की गणना | | |
| geocoder | (named: Photon, Nominatim, Open-Meteo) | | The prose says `सेवा` ("service") with the name; unnamed, `जगह खोजने की सेवा` (a search does not "answer"; a service does). |
| a stored area (privacy) | इलाका | m | `करीब 10 किमी का एक इलाका` (landing), `मोटे तौर पर 10 किमी के इलाके` (About). Never `वर्ग` (the stored cell is not a square away from the equator) nor `मोटा इलाका` ("a fat area"). |
| strait | जलडमरूमध्य | m | The geography word, in place names only. |
| cubesat | क्यूबसैट | m | |
| constellation | उपग्रह-समूह | m | |
| panchromatic | श्वेत-श्याम | | "Black-and-white, sharper": `50 सेमी के श्वेत-श्याम पिक्सेल`. |
| multispectral | मल्टीस्पेक्ट्रल | | |
| band | बैंड | m | `C-बैंड रडार`. |

### 4.2 Compass

| id | Word | Passed by (`से गुज़रा`) | Where it was (`में था`) | Heading (`की ओर`) | Readout |
|---|---|---|---|---|---|
| n | उत्तर | `61 किमी उत्तर से` | `उत्तर में` | `उत्तर की ओर` | N |
| ne | उत्तर-पूर्व | `उत्तर-पूर्व से` | `उत्तर-पूर्व में` | `उत्तर-पूर्व की ओर` | NE |
| e | पूर्व | `पूर्व से` | `पूर्व में` | `पूर्व की ओर` | E |
| se | दक्षिण-पूर्व | … | … | … | SE |
| s | दक्षिण | … | … | … | S |
| sw | दक्षिण-पश्चिम | … | … | … | SW |
| w | पश्चिम | … | … | … | W |
| nw | उत्तर-पश्चिम | … | … | … | NW |

The 16-point abbreviations (`NNE`, `SSW`) stay Latin: Hindi has no established letters for them, and they sit beside
coordinates that are Latin anyway. `पूर्वोत्तर` is a region's name ("North-East India"), not a direction here.

### 4.3 Curated places (`places` namespace)

The established Hindi name where one exists (`गीज़ा के पिरामिड`, `नियाग्रा जलप्रपात`, `मृत सागर`, `स्वेज़ नहर`,
`यूनान`), otherwise a transliteration as Hindi news writes it. Chips ≤ ~14 characters. The full table is
`src/i18n/hi/places.ts`.

A country in a sublabel is written as the where line under a searched place writes it: that line comes from Intl's `hi`
names through `shownCountryName` (`src/imagery/localPlaces.ts`), and one country must not be named two ways in one
session. So `मिस्र`, `तुर्किये`, `दक्षिण अफ़्रीका`, `यूनान`, `संयुक्त अरब अमीरात` (not `यूएई`), `हाँग काँग` (CLDR's short
name, as in every language; not `हांगकांग`), `फ़्रेंच पोलिनेशिया`, `पराग्वे`. The one exception is the United States:
Intl's long `hi` name is `संयुक्त राज्य` ("United States", without America), which is not how Hindi names the country,
so the sublabels say `अमेरिका`, CLDR's short `hi` name. To make the where lines agree, `SHORT_NAMES` in
`src/imagery/localPlaces.ts` would list `US: ['hi']` (code, one line; an owner decision, because it changes a data
display; until then a Hindi visitor can see `न्यूयॉर्क, अमेरिका` on a chip and `Iowa, संयुक्त राज्य` in a search).

The notable choices:

| id | Label | Sublabel | Why |
|---|---|---|---|
| giza | गीज़ा के पिरामिड | गीज़ा, मिस्र | The name every Hindi reader learned. |
| goldenGate | गोल्डन गेट | सैन फ़्रांसिस्को, अमेरिका | |
| washingtonDc | वॉशिंगटन डी.सी. | नेशनल मॉल, अमेरिका | |
| mountStHelens | माउंट सेंट हेलेंस | वॉशिंगटन राज्य, अमेरिका | `राज्य` tells the state from the capital. |
| vesuvius | माउंट विसूवियस | नेपल्स, इटली | The textbook spelling. |
| angkorWat | अंकोरवाट | सिएम रीप, कंबोडिया | Written as one word in Hindi. |
| gardenCity | गार्डन सिटी के गोल खेत | कैनसस, अमेरिका | They are irrigation circles: "round fields" is what they are; "crop circles" would promise something else. |
| deadSea | मृत सागर के नमक तालाब | दक्षिणी बेसिन, इज़राइल और जॉर्डन | |
| gibraltar | जिब्राल्टर | जिब्राल्टर जलडमरूमध्य | |
| everest | माउंट एवरेस्ट | नेपाल और चीन | |
| hongKong | हाँग काँग | विक्टोरिया हार्बर, हाँग काँग | Intl's spelling, as the where lines show it. |
| palmJumeirah | पाम जुमेराह | दुबई, संयुक्त अरब अमीरात | Intl's name, as the where lines show it. |

Usage stats, record_lookup and shares keep the English label, so nothing here splits a count.

## 5. Grammar strategies for runtime slots

### 5.1 [PLACE]: uninflectable, genderless

`[PLACE]` is data from the geocoder or the offline list, nearly always in Latin letters ("Waterloo", "Pacific Ocean",
"Bus stop, Ushuaia"), sometimes in another script. Hindi needs no case ending on it: postpositions are separate words.
The only hazard is gender: a Hindi reader would give `Waterloo` the gender of `शहर` (m) or `नगरी` (f), `Ganga` is
feminine, `Pacific Ocean` masculine, and the code cannot know.

Rules:
1. `[PLACE]` is always followed by a postposition or stands alone: `Waterloo को`, `Waterloo के ऊपर से`, `Waterloo में`,
   `Waterloo तक`, `Waterloo की तस्वीर`, `Waterloo:` (after a colon), a title.
2. `[PLACE]` is never the subject of a verb, adjective or participle that agrees with it. Not `Waterloo साफ़ था`, not
   `Waterloo पट्टी के भीतर थी`. Rewrite with a noun of our own: `यह जगह … थी`, `आपकी जगह पर आसमान साफ़ था`.
3. A possessive after the place agrees with what follows, never with the place: `Waterloo की तस्वीर` (f, for
   `तस्वीर`), `Waterloo के ऊपर`. Always safe.
4. Point back with `यहाँ`, `इस जगह`, `यह जगह` (f, our noun), or `उसके` / `इसके` (no gender). Never `वह` as the place's
   subject.
5. In display lines tie a short postposition to the name with a no-break space (`Waterloo\u00a0को`). The results
   headline also keeps a short name whole (≤ 20 characters, ≤ 3 words: `New\u00a0Delhi`, `-12.000,\u00a0-30.000`): it is
   balanced, and a break inside the serif name (`पिछले 7 दिनों में New / Delhi को`) reads worse than one after `में`.
6. English adds "the" before seas and deserts; Hindi has no article: `Pacific Ocean को`.

### 5.2 [SAT]: masculine, and `ने`

Every satellite in the catalog, crewed stations included, is named in Hindi by a masculine noun (`उपग्रह`, `स्टेशन`,
`अंतरिक्ष यान`), so a bare name takes masculine agreement: `Sentinel-2C गुज़रा`, `ISS (ZARYA) गुज़रा`, `वह … जा रहा
था`, `यहाँ देख सकता था`. No head noun is needed; Hindi news writes `ISS भारत के ऊपर से गुज़रा` the same way.

Where the sentence allows, the perfective transitive with `ने` removes agreement entirely: `Sentinel-2C ने Waterloo को
देखा` (the verb is the neutral masculine singular because the object is marked with `को`). Use it for every "watched".
Careful: with `ने` and an unmarked object, the verb agrees with the object (`उसने तस्वीर ली`, f). That is safe when the
object is our own noun (`तस्वीर`, `बादल`), never when it is `[PLACE]`: a place object always takes `को`.

A nameless satellite (`sat` undefined): `एक उपग्रह` as a subject, `किसी उपग्रह ने` with `ने`, `किसी उपग्रह की` as a
possessor, `एक उपग्रह से` after "from". The lone label `aSatellite` (chips, the plan callout) is `एक उपग्रह`.

Two names never collide. `Sentinel-2C ने Waterloo को देखा` keeps the two Latin names apart with `ने`; where no `ने` is
possible, something Hindi stands between them (`Sentinel-2C रविवार, 1 नवंबर 2026 को … Waterloo के ऊपर से गुज़रा`), or the
place leads (`Waterloo के 795 किमी ऊपर से Sentinel-2C गुज़रा`): `Sentinel-2C Waterloo` would read as one name. The same
goes for a name and a number: a clock, an altitude or a count never follows `[SAT]` directly (`Landsat 9 16:14`,
`Capella-14 1,204 बार`), so the pass paragraph opens on the clock (§3.4) and the radar reason puts its verb phrase
before the count (§3.3).

### 5.3 [NUM]: plural categories and the zero rule

Hindi has two CLDR categories, `one` and `other`. Intl puts **0 in `one`** (CLDR's rule is "i = 0 or n = 1", from
fractions such as "0.5 घंटा"), but Hindi counts zero things with the plural: `0 तस्वीरें`, `0 उड़ानें`, `0 घंटे`. Every
file that counts defines

```ts
const pl = <T>(n: number, one: T, other: T) => (n === 0 ? other : f.plural(n, { one, other }))
```

and never calls `f.plural` with a count that can be 0.

Noun forms after a number:

| Noun | 1 | 2+ (direct) | 2+ before a postposition |
|---|---|---|---|
| उपग्रह (m) | 1 उपग्रह | 5 उपग्रह | 5 उपग्रहों ने |
| दिन (m) | 1 दिन | 7 दिन | 7 दिनों में |
| दृश्य (m) | 1 दृश्य | 12 दृश्य | 12 दृश्यों का |
| घंटा (m) | 1 घंटा | 5 घंटे | 5 घंटे पहले (also oblique sg.) |
| तस्वीर (f) | 1 तस्वीर | 27 तस्वीरें | 27 तस्वीरों |
| उड़ान (f) | 1 उड़ान | 31 उड़ानें | 31 उड़ानों से |
| कक्षा (f) | 1 कक्षा | 400 कक्षाएँ | 400 कक्षाओं की |
| वस्तु (f) | 1 वस्तु | 16,893 वस्तुएँ | |
| झलक (f) | 1 साफ़ झलक | 11 साफ़ झलकें | |
| पंक्ति (f) | 1 पंक्ति | 40 पंक्तियाँ | |
| नतीजा (m) | 1 नतीजा | 5 नतीजे | |
| बार, मिनट, सेकंड, मोज़ेक | invariant | | |

- Before a postposition the plural is oblique (`दिनों में`, `उपग्रहों ने`); the singular is unchanged except for `-ā`
  nouns (`1 घंटे में`).
- A verb agrees in number with the count (`1 तस्वीर सार्वजनिक हुई` / `27 तस्वीरें सार्वजनिक हुईं`, `मौसम उपग्रह …
  गुज़रे`).
- `1` stays a digit in readouts and in sentences where the English has the digit. Where the English says "once", Hindi
  says `एक बार`.
- `showAllSats(31)`: `सभी 31 उपग्रह दिखाएँ` ("show all 31 satellites") reads naturally in Hindi, no parentheses needed.
- A number and its noun are tied with a no-break space in strings we build (`\u00a0`); a `num()` part with its unit is
  spaced by the renderer.

### 5.4 Lists of names

Intl's `hi` list (`fmt('hi').list`) gives `Umbra-08, Capella-14, और 7 दूसरे रडार उपग्रह`, with a comma before `और`,
which Hindi does not write. So Hindi copy never uses `fmt('hi').list`: a list is joined by hand, `a, b और c`
(`results.ts` `why.radar`). A list is plural: its verb is plural (`… आए`). One name alone keeps the singular (`Umbra-08
… आया`).

### 5.5 Dates and times inside sentences

- A day as a slot comes from the `time` namespace: `रवि, 1 नवंबर`. After a day, `को` (`रविवार, 1 नवंबर को`); in prose use
  the long weekday.
- "Between A and B": `A से B के बीच` (`29 अक्टूबर से 5 नवंबर के बीच`).
- A clock takes `पर`: `16:14 UTC पर`; "at about": `करीब 07:49 CET पर`.
- "In the last 7 days": `पिछले 7 दिनों में`; the kicker without a postposition: `पिछले 7 दिन`.
- Relative times from Intl's long style: `12 मिनट पहले`, `30 घंटे पहले`, `3 दिन पहले`, `3 घंटे में`; "just now" is
  `अभी-अभी`. The short style's `मि॰` / `घं॰` are not used.

### 5.6 Formatted slots

Coordinates (`43.4723°N 80.5449°W`), clocks, zones, ISO stamps and compass abbreviations arrive written and stay as they
are, in Latin. A Devanagari word next to one is separated by a space.

## 6. Typography and formatting

### 6.1 Punctuation

- **The danda `।`** (U+0964) ends every sentence of running copy: body text, headlines, footnotes, alt text, posts,
  page descriptions, spoken summaries. Attached to the last word, a space after it. Never `.` as a sentence end, never
  the double danda `॥`.
- A sentence should end on a Hindi word (Hindi is verb-final, so it nearly always does). Where a number would end it
  (`बादल: 25%।`), rebuild it (`पूरे दृश्य के 25% हिस्से पर बादल थे।`).
- `?` ends a question (`क्या यह लाइव है?`). No `!` anywhere.
- `,` and `:` as in English. No `;` in Hindi prose: split the sentence, or join with `, और` / `, इसलिए` / `, पर`.
- Quotation marks “ ” (`“${query}”`), and `‘ ’` inside them. Never ASCII `"`.
- `…` (U+2026) after a progressive status (`तस्वीर बन रही है…`).
- `·` and `→` are the design's separators and keep their role; `/` in `01 / जगह`.
- Labels, buttons, chips and titles take no final mark.

### 6.2 Spelling

- Nukta on `ज़` and `फ़` always: `हफ़्ता`, `ज़मीन`, `ज़ूम`, `फ़ोटो`, `फ़्रेम`, `फ़ाइल`, `रफ़्तार`, `साफ़`, `ज़रूरत`. Never
  on `क ख ग` (`आखिरी`, `करीब`, `खराब`): most Hindi readers do not pronounce them apart, and most Hindi papers drop them.
- Chandrabindu where nothing sits above the headline: `यहाँ`, `वहाँ`, `कहाँ`, `पहुँच`, `ऊँचाई`, `आँकड़े`, `माँग`,
  `ढूँढ`. Anusvara where something does: `में`, `हैं`, `नहीं`, `तस्वीरें`, `उड़ानें`, `करें`.
- Anusvara for a nasal before a consonant: `अंदर`, `संबंध`, `ठंड`, `हिंदी`. One exception: the language's own name in
  the switcher and the HUD is `हिन्दी` (`LOCALE_INFO.hi.native`), as CLDR, `Intl.DisplayNames('hi')` and Hindi
  Wikipedia spell it; it is a name, and the copy never writes the word.
- `ई` / `ि` and `ऊ` / `ु` as the dictionary has them: `जानकारी`, `गुज़री`, `पूरी`, `दूरी`.
- Hyphens join compounds and echo words: `उत्तर-पूर्व`, `अभी-अभी`, `श्वेत-श्याम`, `टाइम-लैप्स`, `स्कैन-रेखा`.
- English loanwords as Hindi news spells them: `ब्राउज़र`, `कनेक्शन`, `डाउनलोड`, `पिक्सेल`, `वीडियो`, `ऑस्ट्रेलिया`.
- The oblique passive infinitive is `लिए जाने के` whatever its object (`फ़ोटो लिए जाने के कुछ घंटों से लेकर … बाद तक`),
  never `ली जाने के`; a stative is `हटा हुआ हो सकता है`, not `हटा हो सकता है`; "or more" after a number is `या उससे
  ज़्यादा`.

### 6.3 Spaces

- A no-break space (written `\u00a0`) between a number and its unit or noun, in strings we build and in fixed prose
  alike (the satellite blurbs, About): `786\u00a0किमी`, `7\u00a0दिनों`, `27\u00a0तस्वीरें`, `15\u00a0मी`.
- A word joiner (written `\u2060`) after the hyphen or dash of a name, range or stamp in running text that wraps
  (`Sentinel-\u20601`, `2–\u20605`, `2026-\u206011-\u206019`): Chrome breaks after a hyphen, and the footnotes at 390 px
  split `(Sentinel-` from `1, 20 मी)`.
- Between `[PLACE]` and a short postposition in display lines (`Waterloo\u00a0को`).
- No space before `।`, `?`, `,`, `:`, `%`, `°`.

### 6.4 Numbers

- `fmt('hi').int` / `.dec` / `.pct`: Western digits, `.` for decimals, and Intl's Indian grouping, which is what an
  Indian reader expects (`1,715`, `16,893`, `12,34,567`). Never `toLocaleString('en-US')`.
- Decimals where the English has them (`7.46`, `5.4°`); the English `toFixed` forms become `f.dec(x, digits)`.
- A minus is U+2212 where the English has one.

### 6.5 Dates

From Intl (`hi`), never a table:

| Use | Options | Example |
|---|---|---|
| `day` (pass rows, captions, HUD) | `{ weekday: 'short', day: 'numeric', month: 'long' }` | `रवि, 1 नवंबर` |
| `weekdayShort` | `{ weekday: 'short' }` | `रवि` |
| `dayCompact` (days 48–92 px wide) | weekday + day | `रवि 1`, `मंगल 27`, `शुक्र 30` (up to 8 characters: fits at 1280 px, checked) |
| `dayMonth` | `{ day: 'numeric', month: 'long' }` | `1 नवंबर` |
| `daySpoken` | `{ weekday: 'long', day: 'numeric', month: 'long' }` | `रविवार, 1 नवंबर` |
| with year (card, time-lapse) | `+ year: 'numeric'` | `1 नवंबर 2026` |
| `dayRange` | built from parts | `1 → 8 नवंबर`, `29 अक्टूबर → 5 नवंबर` |

Full month names everywhere: Hindi months are short words (`मई`, `जून`, `नवंबर`), and CLDR's `नव॰`, `अक्टू॰` with the
abbreviation sign read as forms, not as copy.

The timeline shows `day` (`मंगल, 27 अक्टूबर`) once a day is 92 px wide. At 1920 px every label shows. At 1440 px (a day
about 105 px) only `रवि, 1 नवंबर` shows: the timeline's fit test (`Timeline.tsx`, `text.length * charW`) counts UTF-16
units, and Devanagari's vowel signs, virama and anusvara are units that take no cell, so a label that fits is judged too
wide and blanked. That is a component fix (count grapheme clusters, or measure), not a reason to abbreviate the months.

### 6.6 Time

24 h clocks with their zone abbreviation, never `बजे`, `सुबह`, `शाम`, `रात` around them. In prose `16:14 UTC पर`; a post
says `स्थानीय समयानुसार 11:21 पर`. Durations in words: `38 सेकंड`, `4 मिनट 12 सेकंड`, `1 घंटा 02 मिनट`, `2 घंटे 05
मिनट`.

### 6.7 Line breaking

Devanagari breaks at spaces. A postposition left at a line start (`को देखा।`) looks like a fragment; in display lines
(the hero, the headline, the card) keep it with its noun by a no-break space, and in body text accept the break. A lone
verb on a display line's last line (`… उपग्रहों ने / देखा।`) is as bad: tie the phrase it ends where the width allows
(measure: a tied run wider than its column overflows instead of wrapping). Never break inside a word, and never
hyphenate Hindi.

### 6.8 Mono labels and the script

Devanagari has no case: `text-transform: uppercase` leaves it as it is and uppercases only the Latin inside a label
(`SENTINEL-2C`), which is what English does too. Store labels as written. Units stay lowercase anyway.

For whoever tunes `html[data-script="devanagari"]` (not in this guide's files):
- **Letter-spacing 0** on Devanagari, mono labels included: tracking cuts the headline stroke (शिरोरेखा) between letters
  and breaks conjuncts apart. The mono caps rows' +0.08em must not apply.
- **More leading**: vowel signs sit above the headline (`ि`, `ी`, `े`, `ै`, `ं`) and below the baseline (`ु`, `ू`,
  `ृ`); the display face's 0.92 line height clips them. Hindi wants at least ×1.3 in display lines, ×1.5 in body text.
- Martian Mono has no Devanagari, so mono labels fall to the Devanagari face: their widths are proportional, not cells.
- The display face's condensed width has no Devanagari counterpart in most families; a condensed Latin next to a normal
  Devanagari reads mismatched, so the headline's Devanagari should be the family's narrowest true width.
- The serif accent (`आपको`, the place) needs a Devanagari face with a distinct, calligraphic voice; Devanagari has no
  italic, so `font-synthesis-style: none` (a slanted Devanagari reads as a mistake).

## 7. Length discipline

Hindi in Devanagari runs about as many characters as English, but each character is wider at the same size and the
vowel signs need height: expect running prose **10–25% wider** than English, and short labels anywhere from shorter
(`तस्वीर` for "Image") to half again as wide (`फिर कोशिश करें` for "Try again"). Mono budgets in the English comments
are Latin character counts in a monospaced face; in Hindi they are a width, checked on screen.

Strategies, in order:
1. A noun instead of a verb phrase in labels (`रीप्ले`, `ऊँचाई`, `झुकाव`, `खराबी`).
2. Drop what the screen already shows: the share sheet's buttons sit under the link and the post, so `कॉपी करें` is
   not needed twice.
3. The established short word (`रीप्ले` over `दोबारा चलाएँ`, `IR`, `किमी`).
4. No `कृपया`, no `यहाँ क्लिक करें`, no possessive the screen implies.
5. Never truncate a Hindi word or invent an abbreviation. The only abbreviations are the units (`किमी`, `मी`, `सेमी`,
   and `किमी/से` in readout cells).

| English | Hindi | Note |
|---|---|---|
| SURPRISE ME | कहीं भी | "Anywhere": a random pick, after the row's `या आज़माएँ`. Not `मुझे चौंकाएँ` ("startle me"), not `किस्मत आज़माएँ` (it repeats `आज़माएँ` right after the row's label). |
| USE MY LOCATION | मेरी लोकेशन इस्तेमाल करें | Phones: `मेरी लोकेशन`; ≤ 400 px chip: `मेरे आसपास`. |
| HOW THIS WORKS | कैसे काम करता है | Beside `सूरज 16.2°S 063.0°E` on a 375 px phone. |
| LAST 7 DAYS | पिछले 7 दिन | |
| CLOSEST LOOK | सबसे नज़दीकी झलक | ≤ 20 |
| LAST CLEAR LOOK | आखिरी साफ़ झलक | |
| CLOUDED OVER | बादल छाए | |
| TIME-LAPSE | टाइम-लैप्स | |
| OFF-NADIR | झुकाव | |
| PIXEL / MOSAIC PIXEL | पिक्सेल / मोज़ेक पिक्सेल | |
| SHARE | शेयर करें | |
| SHARE IMAGE | तस्वीर शेयर करें | Full-width phone button. |
| COPY LINK | लिंक कॉपी करें | One of three on a 360 px phone: checked on screen. |
| POST TO X | X पर पोस्ट करें | |
| SAVE PNG | PNG सेव करें | |
| COPIED | कॉपी हो गया | |
| TRY AGAIN | फिर कोशिश करें | |
| REPLAY | रीप्ले | |
| LINK / POST (48 px column) | लिंक / पोस्ट | |
| Filter: ALL · DETAILED · WEATHER · RADAR | सभी · बारीक · मौसम · रडार | `बारीक` = fine detail, as a chip only (prose: `बारीक ब्योरे वाली`); `विस्तृत` would read "extensive". |
| Lanes | तस्वीर · संभवतः · पहुँच में · ऊपर से | Checked in the timeline at 1280 px. |
| RECENT | हाल की खोजें | A bare `हाल की` is an adjective waiting for its noun. |
| FAULT | खराबी | |
| Hold the globe anywhere to move it (one line, 320 px) | पिन खिसकाने के लिए ग्लोब पर कहीं भी दबाए रखें | 249 px in the stand-in Devanagari face, under the English 267 px. |
| Name, address or lat, lon (the field's hint) | नाम, पता या अक्षांश, देशांतर | Says the order to type, as the English does; fits at 320 px (checked). |
| Visible (a geostationary band, ≤ ~9 characters) | दृश्य प्रकाश | 67 px in the 78 px cell at 390 px, 70 px at 360 px (measured). |

## 8. Sensitive content

- **Surveillance.** The product is about being watched, and Indian readers know the debates about phone surveillance
  and data. The product verb is the plain `देखना`. `निगरानी` (surveillance), `नज़र रखना` (keep under watch), `जासूसी`
  (spying) and `ट्रैक करना` never describe what Watched or a satellite does. "Military and spy satellites" in About is
  `सैन्य और जासूसी उपग्रह`: there the English names them, and Hindi does too.
- **Borders.** India's borders with Pakistan and China are disputed, and maps are a legal matter in India. Nothing in
  this catalog names a border or a disputed region. Place names and the country at the end of a "where" line come from
  the geocoder and the browser (data, not copy); if the owner wants a policy for Kashmir or Arunachal Pradesh, it is a
  data decision (`src/imagery/exonyms.ts`), not a translation one.
- **Strikes and war imagery.** Hindi readers saw satellite images of strikes in May 2025. Keep the plain verbs: a
  satellite `गुज़रा`, `देखा`, its camera `मुड़ सकता था`; never `निशाना` (target), `लक्ष्य साधना`, `हमला`.
- **ISRO.** Indian satellites (Cartosat, RISAT, INSAT) are named as their operator writes them, in Latin, like every
  other: no national pride words, no `हमारा`.
- **Religion and caste.** No idiom with a religious source (`भगवान जाने`, `राम भरोसे`, `ऊपर वाला देख रहा है`), however
  tempting "someone up there is watching" is for this product.
- **Privacy text** is translated exactly: promise nothing more or less than the English. "The pass you picked" keeps
  the reader (`आपकी चुनी हुई उड़ान`); the stored area is one word everywhere, `इलाका` (never `वर्ग`, a shape claim the
  0.1° cell does not keep away from the equator).
- **The time-lapse in war zones** (`src/imagery/seasonRegions.ts`: Gaza Strip, West Bank, Ukraine, Lebanon). Every year
  there is one season (owner, 2026-11-16), and the caption says only that and the count: `11 साफ़ झलकें · हर साल पतझड़
  में एक`. Never add `युद्ध`, `तबाही`, `हमला`, `बमबारी`, `कब्ज़ा` or any characterisation the English does not make.
- **Names, in strings we write** (runtime gazetteer names are shown as they come and never patched): `ग़ाज़ा पट्टी`,
  `वेस्ट बैंक`, `यूक्रेन`, `लेबनान`, as Hindi news writes them. The country Intl gives for PS is `फ़िलिस्तीनी क्षेत्र`; add
  no qualifier. Crimea is named as the data has it (in Ukraine), with no qualifier (`क्रीमिया (रूस)` never).
- **`पट्टी` is also the Gaza Strip.** Our swath is `पट्टी`, and Hindi calls the Gaza Strip `ग़ाज़ा पट्टी`. Never put both
  in one authored sentence (none does today: the places are inserted as the geocoder names them, in Latin, so a Gaza
  search's likely card reads `Gaza Strip के ऊपर से · Sentinel-2C की पट्टी गुज़री।`). A new string that names Gaza and
  a swath together says `कैमरे की पट्टी`, or rewrites the swath away.

## 9. Pitfalls and the reviewer's checklist

### 9.1 False friends and ambiguous words

| Word | Trap | Use |
|---|---|---|
| पास | "near", not a satellite pass | `उड़ान`, `बार` |
| दृश्य | also "view, sight"; fine for a scene, wrong for "visible" alone | `दृश्य प्रकाश` for the visible band |
| विस्तृत | "extensive, elaborate" | `बारीक` for detailed imagery |
| स्थिर कैमरा, स्थिर बिंदु | stationary: a camera that stands still, a point that cannot cross a sky | `न मुड़ने वाला कैमरा`; "steady" light: `बिना टिमटिमाए` |
| सीधे नीचे देखने वाला कैमरा | not what "fixed" means (VIIRS, MODIS see far to the side) | `न मुड़ने वाला कैमरा` |
| किसने | "who did it", a person | `किस चीज़ ने`, as the hero |
| पट्टी ने … को ढका | "covered" with a lid: a calque | `पट्टी … के ऊपर से गुज़री`, `यह जगह … पट्टी के भीतर थी` |
| दिन में N बार | "N times a day" | `दिन के उजाले में` for daylight |
| पिछले हफ़्ते | last calendar week | `पिछले सात दिनों में`, `पिछले 7 दिनों में` |
| उपग्रह को चलाना | to operate a satellite | `… की स्थिति की गणना` |
| वह मुड़ सकता था (the satellite) | it could change course | `उसका कैमरा मुड़ सकता था` |
| नक्शा बनाना (radar) | to draw a map | `रडार तस्वीर लेना` |
| बारीक तस्वीरें | thin pictures | `बारीक ब्योरे वाली तस्वीरें` |
| चिकना, तीखा (a photo) | slick, pungent | `मुलायम`, `निखारना` |
| मोटा इलाका | a fat area | `मोटे तौर पर … इलाका` |
| बनावट | structure, geology | `ग्लोब की तस्वीरें` for textures |
| उत्पाद | merchandise | `तस्वीरें` |
| हल्की (with no colour noun) | light in weight | `सफ़ेद` for a lighter picture |
| बड़ा करें (zoom) | the photo's expand | `ज़ूम बढ़ाएँ / घटाएँ` |
| किमी/से in prose | `से` read as the postposition | `किमी प्रति सेकंड` |
| ऊँचाई | altitude, but also height of the sun's angle | `ऊँचाई` for km; `क्षितिज से … ऊपर` for an elevation; `सूरज की ऊँचाई` with degrees |
| निगरानी, नज़र रखना | surveillance | `देखना` |
| फ़ोटो खींचना | "take a photo", wrong for radar and mosaics | `तस्वीर ली`, `देखा` |
| सैटेलाइट्स | Hinglish plural | `उपग्रह` |
| बजे | spoken hours | `पर` after a 24 h clock |
| कृपया | officialese | nothing |
| के तौर पर, के रूप में | the "as" calque | say the thing (`जो अब कक्षा में बैकअप है`) |
| ट्रैक करना | tracking a person | `हमारी सूची` for "we track" |

### 9.2 Reviewer's checklist (run it on every string)

1. Is `आप` ever the subject of a gendered participle? Rewrite.
2. Does any verb, adjective or participle agree with `[PLACE]`? Rewrite with `यह जगह` or a postposition.
3. Does a place object take `को`? (`ने` + unmarked place object would agree with the place.)
4. Is a count that can be 0 sent through `pl`, and is the noun oblique before a postposition?
5. Does every sentence end with `।`, and every label with nothing?
6. Is every number and unit tied, and does a display line keep its postposition with its noun?
7. Is `तस्वीर` used for anything that is not an optical photo?
8. Is there a word of officialese (`कृपया`, `पुनः`, `द्वारा`) or Hinglish (`-स` plurals, English verbs with `करना` that
   Hindi interfaces do not use)?
9. Nukta on ज़ / फ़, none on क ख ग; chandrabindu vs anusvara.
10. Does it fit: read it on screen at 390 px and 1280 px.
11. After `उसका संचालक`, is the camera or satellite named again, instead of an `उसने` / `वह` that reads as the operator?
12. Does a number touch a name that ends in a digit (`Capella-14 1,204`, `Landsat 9 16:14`)? Put a word between them.
13. Does a pronoun have an antecedent of its number (`हर उपग्रह … उनकी`)?
14. Is the could verdict's word `पहुँच` throughout, and the question `किस चीज़ ने`?

### 9.3 Test values

Places: `Waterloo`, `Pacific Ocean`, `Bus stop, Ushuaia, Tierra del Fuego`, `Ganga` (feminine to a Hindi reader),
`Washington, D.C.` (ends on a full stop), a 120-character name, `東京`. Satellites: `Sentinel-2C`, `ISS (ZARYA)`,
`NORAD 60989`, undefined. Counts: 0, 1, 2, 5, 21, 1,715, 1,23,456.

## Decisions log

| # | Question | Decision |
|---|---|---|
| 1 | `उपग्रह` or `सैटेलाइट` | `उपग्रह`: the school and news word, declines (`उपग्रहों ने`), short in Devanagari. `सैटेलाइट` is common in speech, but its plural is Hinglish. |
| 2 | `आप` or `तुम` | `आप`: the only address an Indian product uses with a stranger. Gender handled by the `-एँ` imperative and the copula (§1.2). |
| 3 | Product verb | `देखना`, with `ने`: no agreement with the satellite or the count. |
| 4 | "Pass" | `उड़ान` as the noun, `बार` as the verdicts' unit. `पास` means "near". |
| 5 | Image vs photo | `तस्वीर` for every image, `फ़ोटो` for optical photographs (honest labelling: radar is not a photo). |
| 6 | Zero | Plural, against Intl's `one` (§5.3). |
| 7 | Digits and grouping | Western digits; Intl's Indian grouping kept. |
| 8 | Units | Devanagari `किमी`, `मी`, as Hindi papers print them. A speed is `किमी/से` in readouts only, `किमी प्रति सेकंड` in prose (review). |
| 9 | Danda | `।` in all running copy, no space before. |
| 10 | Nukta | ज़ and फ़ only. |
| 11 | Dates | CLDR via Intl, full month names. |
| 12 | Compass readouts | Latin abbreviations; Hindi words in prose. |
| 13 | Agency names | Latin (`NASA`), as the product keeps every agency name; Hindi news would write `नासा`, which a reviewer may prefer in prose. |
| 14 | Card headline order | Place first, with its postposition, in the serif; then the count phrase. |
| 15 | Ascending / descending | `आरोही` / `अवरोही`. |
| 16 | Clock position in the pass paragraph | First (`16:14 EST पर Landsat 9 …`), so a name ending in a number never runs into it (§3.4). |
| 17 | The computing readout's status mark | `OK`, in Latin: beside a duration in words (`0.24 सेकंड`), a Hindi `ठीक` read as part of it. |
| 18 | The pass list's "Latest" / "Closest" | `आखिरी बार:` / `सबसे नज़दीक:`, with a colon: `आखिरी सोम` reads "the last Monday", `सबसे नज़दीक झुकाव` "the nearest tilt". |
| 19 | Open questions for the native review | Answered by the review (2026-11-21): the could lane is `पहुँच में` (neither `मुमकिन` nor `संभव`); `रीप्ले` stays; "Surprise me" is `कहीं भी`; `NASA` stays Latin; `आरोही / अवरोही`, `बारीक` (as a chip), `लोकेशन` and the zero-takes-plural rule stand; the file-name word is `place`. |
| 20 | The could verdict's vocabulary | One noun, `पहुँच`: lane `पहुँच में`, verb `पहुँच के दायरे में आया`, card `X तक Y की पहुँच थी`, post and page `यह जगह उसकी पहुँच में थी` (§3.5). |
| 21 | "What watched you" | `किस चीज़ ने`, echoing the hero; `किसने` asks about a person. |
| 22 | "Enter any place" | `कोई भी जगह खोजें`. |
| 23 | Fixed camera | `न मुड़ने वाला कैमरा`. |
| 24 | Swath sentences | `पट्टी … के ऊपर से गुज़री` or `यह जगह … पट्टी के भीतर थी`; never `ढकना`. |
| 25 | "k of n" | `n में से k` everywhere. |
| 26 | Country names in curated sublabels | Intl's, as the where lines print them, except `अमेरिका` for the US (§4.3). |
| 27 | Key caps | Latin, as Indian keyboards print them (`Space`). |
| 28 | The fault label | `खराबी`. |
| 29 | The language's self-name | `हिन्दी`, CLDR's (§6.2). |

## Review

Two independent reviews (2026-11-21): a native reader (voice, naturalness, idiom) and an accuracy reviewer (meaning
against the English and its comments, every message run with the counts 0, 1, 2, 5, 21, 1,565, 1,23,456 and the edge
cases). Their findings were judged on their merits; where one was right, every occurrence was fixed, not only the one
cited. The rules they exposed are now in the sections above.

### Changed

Meaning errors:
- `darkStation`: `स्थिर बिंदु` (a point that stands still, crossing the sky) → `बिना टिमटिमाए चमकते एक बिंदु`. Both
  reviewers.
- About `sgp4`: `हम हर उपग्रह को … चलाते हैं` ("we operate every satellite") → `… हर उपग्रह की स्थिति की गणना करते हैं`.
- `why.unpublished`, `why.none`, `sunNeverRose`, `sunBarelyRose`: `दिन में` ("6 times a day") → `दिन के उजाले में`.
- The could post and the share page's `couldHave`: `वह इधर मुड़ सकता था … कि वह मुड़ा` (the satellite changing course,
  then the operator turning) → `उसका कैमरा इधर मुड़ सकता था। … कि कैमरा मुड़ा या नहीं।`
- `could.definition`, `could.insideSwath`: `उसका संचालक … कि उसने` (the operator looked) → `कैमरे ने`, `उपग्रह ने`; the
  officialese `प्रकाशित नहीं करता कि` → `नहीं बताता कि`.
- `likely.definition` (and the glossary): "fixed camera" `सीधे नीचे देखने वाला` (false for VIIRS, MODIS, AVHRR) → `न
  मुड़ने वाला`; `इसकी कोई तस्वीर` (the swath's, or the place's?) → `इस जगह की`. Accuracy reviewer.
- About `credits.textures`: `धरती की बनावट` (the Earth's structure) → `ग्लोब की तस्वीरें`.
- About `lede`: `पिछले हफ़्ते` (last calendar week) → `पिछले सात दिनों में`.
- About `short.live`: `फ़ोटो ली जाने के … बाद` → `फ़ोटो लिए जाने के … बाद तक`.
- Footnote with one mosaic: `1 मौसम के दैनिक मोज़ेक` → `1 दैनिक मौसम मोज़ेक`; and, found while checking it, `1 भूस्थिर
  मौसम उपग्रहों से पूरी डिस्क की तस्वीर` ("1 satellites") → `1 पूरी डिस्क की तस्वीर (भूस्थिर मौसम उपग्रहों से, …)`.
- Pass-times footnote at sea: `स्थानीय समय UTC−9 · समुद्र में के हिसाब से है` → `स्थानीय समय: UTC−9 · समुद्र में।`
- `why.radar`, found while running it: with the new verb after the names, `Capella-14 1,204 बार` touched; the verb
  phrase now stands between them (`… पहुँच के दायरे में 1,204 बार आए`).

Calques and unnatural phrasing:
- Swath: `पट्टी ने … को ढका` → `पट्टी … के ऊपर से गुज़री` (`could.insideSwath`, card `inSwath`) and `यह जगह उसके कैमरे की
  पट्टी के भीतर थी` (post); the blurbs' `पट्टी ढकता है` → `पट्टी स्कैन करता है`, and VIIRS `पूरी धरती को ढक लेता है` →
  `… स्कैन कर लेता है`. This reverses the guide's first rule.
- "Passed within view": `पहुँच के भीतर से गुज़रा` → `पहुँच के दायरे में आया` (verb, radar reason, pass sentence); the
  comma tails `…, यहाँ से 140 किमी पूर्व में।` / `…, ठीक ऊपर से।` → their own sentence (`वह यहाँ से 140 किमी पूर्व में
  था।`, `वह ठीक ऊपर था।`).
- One vocabulary for the could verdict (the accuracy reviewer's point, the native reader's words): the card's `की नज़र
  पहुँच सकती थी` → `की पहुँच थी`; the post's and page's `के पास से, उसे देख सकने की दूरी पर` → `के पास से गुज़रा। यह
  जगह उसकी पहुँच में थी।` The lane `मुमकिन` → `पहुँच में`, since `संभवतः` and `मुमकिन` read as synonyms.
- `could.radar`: `का नक्शा बना सकता था` → `की रडार तस्वीर ले सकता था`; `इस उड़ान से इस जगह की … तस्वीर` → `इस उड़ान में
  ली गई …` (also in the pass view's no-image note, with `कोई Sentinel-2C तस्वीर` for the stacked `की … की`).
- `radarImaged`: `झुककर` (leaning) → `के कोण पर देखते हुए` (the English "looking").
- `could.camera` straight down: `सीधे नीचे देखते हुए … देख सकता था` → `बिना मुड़े ही … देख सकता था`.
- `geo.sits`: `गुज़रता नहीं` → `ऊपर से गुज़रता नहीं`.
- The infrared legend: `उतनी हल्की` (light in weight) → `जितनी ठंडी, उतनी सफ़ेद`.
- `likely.notPublished` (`के तौर पर`), `likely.mosaicUnconfirmed` (`पक्का नहीं हो सका`), and the GOES spares' `बैकअप के
  तौर पर तैयार रखा गया` → `जो अब कक्षा में बैकअप है`.
- Engine notes: `देखी गई मानी गई` and the unlinked `“संभवतः देखा गया” दिखाई गई` → `“देखा गया” में गिनी गई है`,
  `“संभवतः देखा गया” में दिखाई गई हैं` (the verdicts quoted, with a postposition).
- Card `crossed` and `withinView`: `गुज़रा और दक्षिण की ओर जा रहा था` → `दक्षिण की ओर जाते हुए … गुज़रा`.
- Posts: `11:21 पर 795 किमी की ऊँचाई पर Waterloo के ऊपर से` → `Waterloo के 795 किमी ऊपर से`.
- `किसने` → `किस चीज़ ने` in the card's invite, the page title and the question. Both reviewers.
- `जगह डालें` → `जगह खोजें` (landing, card footer, page description, the default card's alt).
- `गुज़रा हर उपग्रह … उनकी` → `गुज़रे सभी उपग्रह … उनकी` (landing, page description, place description).
- "Surprise me": `मुझे चौंकाएँ` ("startle me") → `कहीं भी`. The native reader proposed `किस्मत आज़माएँ`; on screen it sat
  right after the row's label `या आज़माएँ`, so the chip took another idiom for a random pick.
- `हाल की` → `हाल की खोजें`. Both reviewers.
- `बारीक तस्वीरें` in prose → `बारीक ब्योरे वाली तस्वीरें` (footnote, two blurbs); `कम बारीक` → `बारीक नहीं`;
  `प्रकाशित हुई सबसे नई` → `अब तक प्रकाशित सबसे नई`.
- Touch-ups: `थोड़ा चिकना और तीखा` → `मुलायम करके हल्का-सा निखारा` (the native reader's words, with the accuracy
  reviewer's point that "lightly" qualifies only the sharpening); `तीखी की गई` → `निखारी गई`.
- Privacy: `करीब 10 किमी के मोटे इलाके … आपकी सटीक जगह कभी नहीं` → `मोटे तौर पर 10 किमी के इलाके … आपकी सटीक जगह के
  हिसाब से कभी नहीं`; `पेज व्यू और पेज की रफ़्तार गिनता है` → `पेज व्यू गिनता है और पेज की रफ़्तार मापता है`; `चुनी गई
  उड़ान` → `आपकी चुनी हुई उड़ान`; the landing's `10 किमी का एक वर्ग` → `इलाका`.
- About: `एक कार एक पिक्सेल है। आप उसमें नहीं हैं।` ("you're not in the car") → `एक कार बस एक पिक्सेल जितनी होती है।
  तस्वीर में आप हैं ही नहीं।`; `सार्वजनिक कक्षा आँकड़े … थोड़ा खिसकते हैं` → `कक्षा के सार्वजनिक आँकड़े … उनकी सटीकता
  हर दिन थोड़ी घटती है` (and `कक्षा के सार्वजनिक आँकड़ों` in the pass-times note); the radar fact's tail and its
  "so grey" reading split into sentences; `उड़ान … जिसने उसे लिया` → `जिसमें वह ली गई`; `SGP4, satellite.js का` → `SGP4
  के लिए satellite.js`; `हटा हो सकता है` → `हटा हुआ हो सकता है`; `अगर हम इसे दिखाते हैं, तो यह असली तस्वीर है` → `हम जो
  तस्वीर दिखाते हैं, वह असली ही है`; `कक्षा के … कैमरे` ("the orbit's cameras") → `कक्षा में मौजूद …`.
- Time-lapse: the note's participle chain → sentences; `हर सर्दी में एक` (also "in every cold") → `हर साल सर्दियों में
  एक`, and the other seasons with `हर साल`.
- `X, कुल Y` → `Y में से X` (pass position, gallery slide, viewer position, time-lapse frame).
- Zoom: `बड़ा करें / छोटा करें` (the photo's expand is `बड़ी करें`) → `ज़ूम बढ़ाएँ / ज़ूम घटाएँ`.
- `गुज़रा … पश्चिम में` → `पश्चिम से` (the path; `में` stays for where a thing was).
- Prose speed `किमी/से` → `किमी प्रति सेकंड`. Both reviewers.
- Small ones: `या ज़्यादा` → `या उससे ज़्यादा`; `शायद वह व्यस्त है, तस्वीर खुद मौजूद है` → `…, पर तस्वीर अब भी मौजूद
  है`; `पर लिंक काम करता है` → `पर लिंक अब भी काम करता है`; `बादल छाए।` as a sentence → `बादल छाए थे।`; `बादल छाए · जगह
  पर` → `… आपकी जगह पर`; `उदाहरण की जगहें` → `उदाहरण के लिए कुछ जगहें`; `जगहों की खोज जवाब नहीं दे रही` → `जगह खोजने
  की सेवा …`; `खिसकाने के लिए ग्लोब दबाए रखें` → `पिन खिसकाने के लिए ग्लोब पर कहीं भी दबाए रखें`; `…, दिखाएँ` → `देखें
  कि …`; `भोर-सांझ` → `भोर-साँझ`; `3 मी पर तस्वीरें` → `3 मी के पिक्सेल वाली तस्वीरें` (and Sentinel-1's `20 मी पर`);
  `श्वेत-श्याम उत्पाद` → `… तस्वीरें`; `इस जगह को क्षितिज से 5° से ऊपर नहीं देखता` → `इस जगह के आसमान में … क्षितिज से
  5° से ज़्यादा ऊपर नहीं है`; `उड़ान के भीतर` → `उड़ान के दौरान`; the zero card headline's `किसी उपग्रह` → `किसी भी
  उपग्रह`; the shared caption's nameless `एक उपग्रह ने` → `किसी उपग्रह ने`; `हर एक को दबाने पर उसकी सूची खुलती है` →
  `हर एक अपनी सूची पर ले जाता है`; `निर्देशांक` in the field's hint → `अक्षांश, देशांतर`; the fault label `गड़बड़ी` →
  `खराबी`; key caps `स्पेस` → `Space`; the video's file-name word `jagah` → `place`; country names in the curated
  sublabels → Intl's (`संयुक्त अरब अमीरात`, `हाँग काँग`, `फ़्रेंच पोलिनेशिया`, `पराग्वे`), the US kept as `अमेरिका`; the
  font credit names the device's Devanagari font until one ships.

The guide: §5.4 said Intl's `hi` list has no comma before `और`; it has one (both reviewers). §3.6 said a post spells
`किमी`. §8 lacked the war zones, Crimea and the `पट्टी` collision. §6.5's `≤ 5` for `dayCompact` was wrong. §6.2 did not
say why the self-name is `हिन्दी`.

### Rejected

- **`झुककर` for both radar sentences** (native reader). The two sentences belong to different verdicts and are never
  shown together, and the English itself uses two verbs: an imaging radar is "looking" to the side (`के कोण पर देखते
  हुए`), a steerable one "pointing" (`मुड़कर`, as a steerable camera turns). `झुककर` would say the radar leaned.
- **`इतने पास से गुज़रा कि उसे देख सके`** for "within view" (native reader). Grammatical, but it is a third wording for one
  verdict; the accuracy reviewer's point that the could verdict needs one vocabulary won, with `पहुँच`.
- **`किस्मत आज़माएँ`** (native reader): see "Surprise me" above.
- **`ज़ूम इन करें / ज़ूम आउट करें`** (accuracy reviewer): an English particle with `करें`; `ज़ूम बढ़ाएँ / घटाएँ` is Hindi
  and as short.
- **`उजली`** for the infrared legend (accuracy reviewer): right, but `सफ़ेद` is the everyday word and says what the
  picture shows.
- **`दिखाएँ कि …`** for the search button (accuracy reviewer): `देखें कि …` is the natural order and the reader's own
  action, as the native reader proposed.
- **`ग्लोब के टेक्सचर`** (native reader): `टेक्सचर` is not an everyday word; `ग्लोब की तस्वीरें` says what they are.
- **`उन उड़ानों को “संभवतः देखा गया” माना गया है`** (native reader) for the GIBS notes: the English says the passes are
  "shown as likely", so `में दिखाई गई हैं` keeps "shown" and links the quoted verdict.
- **`कक्षा में घूम रहे`** (accuracy reviewer, accepted in substance): the fix is "in orbit", not "the orbit's", and
  `कक्षा में मौजूद` says exactly that; `घूम रहे` ("roaming") adds a motion the English does not state.
- **`दृश्य प्रकाश` overflowing** (accuracy reviewer, unverified): measured in the strip cell, 67 px of 78 at 390 px and
  70 of 81 at 360 px; it stays.
- **`जगह पर बादल` in the narrow readout and gallery status** (by extension of the native reader's `बादल छाए · आपकी जगह पर`):
  those cells are budgeted at ~14 characters and sit over a value (`साफ़`, `पतले बादल`) that makes the place clear; only
  the pass-list chip, which has room, says `आपकी जगह पर`.
- **`US: ['hi']` in `SHORT_NAMES`** (accuracy reviewer's first option): it would fix the where lines, but it is shared
  code and an owner decision about a data display; recorded in §4.3 for the coordinator.
- **Kept as decided**, after both reviews: `उपग्रह`, `तस्वीर` / `फ़ोटो`, `उड़ान` and `बार`, the hero, `संभवतः`, `रीप्ले`,
  `NASA` in Latin, `आरोही / अवरोही`, `बारीक` as the filter chip, `लोकेशन`, the zero-takes-plural rule (the native reader
  confirmed it), Western digits with Indian grouping, full month names, and the danda.

### Phone pass (2026-11-22)

Every screen measured at 360, 390 and 430 px portrait, 844 × 390 and 1280 × 800, beside English (`getBoundingClientRect`,
`scrollWidth`, line boxes per word). Changed:
- Results headline: a short place stays whole (`New\u00a0Delhi`). The balanced headline broke the serif name at every
  phone width (`पिछले 7 दिनों में New / Delhi को 262 उपग्रहों ने देखा।`); now it breaks after `को` (360–430 px) and keeps
  `-12.000, -30.000 को` on one line at sea. Long names (`Thiruvananthapuram, Kerala, India`) keep their spaces.
- Week card: `इस हफ़्ते 262 उपग्रहों ने / देखा।` (a lone verb) → the count phrase tied, `इस हफ़्ते / 262 उपग्रहों ने देखा।`
  (380 px at 62 px in the 466 px column, 441 px at 72; a week's lead is never set at 84 px). Zero ties `किसी भी`,
  `उपग्रह ने` and `नहीं देखा।` (`… के / किसी भी उपग्रह ने / नहीं देखा।`: untied it left `देखा।` alone, tied whole it opened
  a line on `ने`). The pass card's `262 उपग्रहों ने / देखा।` and `Landsat 9 ने / देखा।` (84 px, 515 px wide) cannot be tied
  without overflowing: reported.
- Footnotes: `(Sentinel-` / `1, 20 मी)`, `2–` / `5 किमी` and `(प्राप्त 2026-` / `11-19 …)` split at 390 px; word joiners
  after the hyphens and dashes (§6.3).
- Blurbs and About: 61 numbers and units joined by a plain space (`30 मी के रंगीन और 15 / मी के` at 1280 px) → a
  no-break space (§6.3).
- `cloudCover(0)`: `पूरे दृश्य के 0% हिस्से पर बादल थे` ("clouds lay on 0 % of it") → `पूरे दृश्य में बादलों का हिस्सा
  0% था।`; every other value keeps its sentence.
- About `sgp4`: `उसकी नज़र के दायरे में` gave the satellite a gaze, which §3.6 rejected for the card → `उसके देखने के
  दायरे में`, the glossary's field of regard (`देखने का दायरा`).

Measured and kept: the imaged group's order note is cut at 360 px (18 px; English is cut at 390); `जगह पर / बादल` takes
two lines as `CLOUD AT / SPOT` does; the lane words at 1280 px sit 12 px apart in 14 px line boxes, touching nothing.
