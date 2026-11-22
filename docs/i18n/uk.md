# Watched: Ukrainian (uk) localisation style guide

Final, 2026-11-19. Supersedes `uk.draft.md`. Every decision below is final, and the closing "Decisions log" resolves
each item of the native review (`uk.critique.md`). Binding for every `uk` string the product shows, speaks or sends:
the app, the share cards and pages, post text, alt text, aria labels, the video, About and the loading screen. Written
in English for the team; every example is the Ukrainian a translator ships. Scope: one variety for every reader,
current orthography (Правопис 2019).

Sources of truth: `docs/DESIGN.md` §3 (type) and §7 (voice, verdict vocabulary), `docs/I18N.md`,
`docs/i18n/TRANSLATING.md`, the English namespaces in `src/i18n/en/`, `api/_lib/i18n/card/en.ts`,
`src/ui/results/lib/copy.ts`, `src/ui/results/lib/meta.ts`, `api/_lib/i18n/parts.ts` (a rich message may put its parts
in any order) and `api/_lib/i18n/format.ts` (`plural` takes `one | few | many | other` for uk). When this guide and a
uk string disagree, the guide wins and the string is fixed. When this guide and the English disagree on a fact, the
English wins and this guide is wrong: report it.

Notation: `[NUM]` a count (a mono span), `[PLACE]` a place name from the gazetteer, `[SAT]` a satellite name, `[TIME]`
a 24-hour clock with its zone (`16:14:21 UTC`, `11:21 EST`), `[DATE]` a date from Intl, `[ALT]` / `[DIST]` a distance
with its unit, `[DEG]` an angle, `[DIR]` a compass word. `*…*` marks the serif accent, `**…**` the bold phrase.
Examples show ordinary spaces for readability; where §6.3 says NBSP, the catalog string has U+00A0, written as a
` ` escape in source so a reviewer can see it.

---

## 0. Decisions at a glance

| Question | Decision |
|---|---|
| Address | **ти** in every sentence; never **ви** or **Ви**. The product speaks as **ми**. Buttons are **infinitives** («Поділитися»): they address no one. |
| The reader's gender | Unknown, so **never** a past-tense verb or short adjective with ти as its subject («ти шукав» ✗). §1.4 lists every rewrite. |
| Product verb ("watched") | **дивитися**: «щось дивилося на тебе», «сюди дивилися 256 супутників». Never стежити, спостерігати, слідкувати, фотографувати. |
| Hero | «Цього тижня / щось дивилося / на *тебе*.» (the default share card sets it in four lines, §3.1). |
| Verdicts | **Побачено** · **Імовірно побачено** · **Могли дивитися сюди** · **Над головою**; lanes ЗНІМОК · ІМОВІРНО · МОЖЛИВО · У НЕБІ. |
| "pass" / "image" / "photo" | **проліт**; **знімок** for any image (photo, mosaic, radar, full disc); **фото** only for a certain Sentinel-2 / Landsat photo; **кадр** for a scene, a frame and a "look" («кадр зблизька», «ясний кадр»). |
| "made public" | **оприлюднено**: «Оприлюднено 31 знімок.» |
| Weeks | «цього тижня» / «того тижня»; "last 7 days" «останні 7 днів», in prose «за останні 7 днів». |
| `[PLACE]` | Only where Ukrainian puts the **nominative**: first, as a title («*Waterloo*. За останні 7 днів…»), after a colon, or alone. Referred back to as **сюди / тут / це місце**. Never after a preposition, never an object, never the subject of a past tense. |
| `[SAT]` | Always with the head noun **супутник** (a crewed station too: no message gets a category) wherever anything agrees with it. A nameless satellite is «невідомий супутник» in sentences, «Супутник» as a lone chip. |
| Plurals | CLDR `one / few / many / other`. The plural message wraps the **verb** too (21 → «дивився 21 супутник»). Oblique cases have their own table (§5.3). |
| Numbers | `1 715` (NBSP), `7,46`, `25%`, `98,6°`, NBSP before units: `786 км`. |
| Coordinates and compass | Coordinates are international notation, set as they arrive: `43.47, −80.54`, `16.2°S 063.0°E`. Readouts keep the compass point as it arrives (`SSW`); prose uses Ukrainian words (§4.2). |
| Clocks | 24-hour with a colon, as they arrive. Preposition **о** 16:14, **об** 1:xx and 11:xx (chosen from the hour). |
| Punctuation | «ялинки», nested „лапки“; apostrophe **’ (U+2019)**, not U+02BC ’ (the design's faces have no U+02BC glyph, so it would fall to a system font; ’ looks the same and is the one in use in Ukrainian digital type); one-character ellipsis …; em dash only where grammar needs it. |
| Euphony | у/в, і/й, з/із/зі by Правопис §23–25 in fixed text; next to a runtime slot, «та» for "and", and fixed words on both sides of у/в (§6.2). |
| Cost and speed | Catalog text, `Intl`, two small uk-only tables (query transliteration, Ukrainian names for Ukraine's places) and uk-only fonts (≈ 76 kB once, self-hosted, preloaded, cached). No new service, no third-party request. A Cyrillic search for a Ukrainian place is answered by the offline list, like a Latin one; a uk share card renders with bundled fonts and makes no font request. English downloads exactly what it did before (Appendix B). |

---

## 1. Register and address

### 1.1 The decision: ти everywhere, infinitives on buttons, ми for the product

The hero says "Something watched *you*": one person, singled out. Ukrainian **ти** keeps that. **Ви** is both plural and
polite, so «на вас» reads as "at you all" or as an official notice, and the uncanny moment goes soft. The English
voice is casual and short ("Can it see me? No. … You're not in it."), and **ти** is what Ukrainian consumer apps use
when they talk to one person. The product itself is **ми** («Ми не можемо цього знати»).

### 1.2 What ви would have solved, and why ти still wins

Ви has one real advantage: its past tense is plural and has no gender («ви шукали», «ви були в досяжності»), so the
gender trap of §1.4 would not exist. It loses anyway: the trap is avoidable in every English string the product has
(§1.4 lists them all), while ви would make every screen sound like a bank or a ministry, break the echo between the
hero and the share post, and blur "you" into "you all" on the one word the product is built around.

### 1.3 Surfaces

| Surface | Decision | Example | Rejected alternative, and why it lost |
|---|---|---|---|
| Display headlines | **ти** in the hero; the results headline is about the place (third person, no address) | «Цього тижня щось дивилося на *тебе*.» · «*Waterloo*. За останні 7 днів сюди дивилися **256 супутників**.» | «…на *вас*.»: plural or polite; the poster stops pointing at one person |
| Sentences and prose | **ти** and **твій** where the reader is addressed; **ми** for the product | «Над твоєю точкою ясно.» · «Ми зберігаємо лише клітинку сітки ~10 км.» | Impersonal prose throughout: loses the second person DESIGN §7 asks for |
| Buttons | **Infinitive**, the Ukrainian UI norm | «Поділитися» · «Зберегти знімок» · «Скасувати» | ти-imperatives («Збережи») shout like an advert; ви-imperatives («Збережіть») are formal and longer |
| Mono caps labels | **Nouns** and noun phrases | «Висота» · «Останні 7 днів» · «02 / Прольоти» | Verbs in labels: a label is a name, not a request |
| Prompts that are not buttons | **ти**-imperative | «02 / Або спробуй» · «Або постав мітку на глобусі» | Infinitive: sounds like a button that does nothing |
| Status labels (mono, short) | **Verbal nouns** | «Завантаження каталогу» · «Пошук» · «Збереження…» · «Зчитування» | «Завантажую…»: first person singular; who is "I"? |
| Lines that narrate the product's work | **ми**-present | «Читаємо піксель у твоїй точці…» · «Повільне з’єднання, ще завантажуємо» · locate chip «Шукаємо…» | A verbal noun here («Визначення…») does not say what is being done |
| Error notices | Impersonal fact, then **ти** advice | «Не вдалося завантажити каталог орбіт. Перевір з’єднання й спробуй ще раз.» | «Вибачте за незручності»: filler, banned |
| About | **ти**, conversational, short answers | «Мене видно? Ні.» | ви: turns the page into terms and conditions |
| Share posts and card invitation | **ти** to the next reader | «Цього тижня щось дивилося й на тебе.» | ви: breaks the echo of the hero |

### 1.4 The gender trap, and every "you + past tense" rewrite

Ukrainian past tense and short adjectives agree in gender, so «ти шукав», «ти був у досяжності», «ти готовий» are wrong
for half the readers. Use the present or future («шукаєш», «побачиш»), or make something else the subject. Never
slash forms («шукав(-ла)»). The English strings that need it, with their shipped forms:

| English | Shipped |
|---|---|
| If you were in reach, we call it "could have pointed here" | Якщо твоє місце було в досяжності, ми пишемо «Могли дивитися сюди». |
| Shared with you | З тобою поділилися |
| Made when you share | З’явиться, коли поділишся |
| If you're on their side of Earth, you're in every frame | Якщо ти на їхньому боці Землі, ти в кожному кадрі. |
| You're not in it | Тебе на знімку не видно. |
| Your spot was in cloud shadow | Твоя точка була в тіні від хмар. |

A new English string with "you" as the subject of a past tense gets its rewrite added to this table first.

---

## 2. Voice

### 2.1 How "declarative, specific, quietly uncanny, second person" sounds in Ukrainian

- **Declarative** is the short simple sentence and the full stop. One fact per sentence; a second fact after a full
  stop, not after a semicolon.
- **Specific** means the number and the unit carry the sentence: «на висоті 786 км», «7,46 км/с», «25%». No
  «приблизно» unless the English says "about"; then «близько».
- **Quietly uncanny** is understatement. Ukrainian puts new and emphatic information **last**, so the unsettling word
  goes at the end: «Цього тижня щось дивилося на *тебе*.» «Тебе на знімку не видно.» Never louder than the English:
  no «стежили», no «шпигували», no exclamation marks.
- **Second person** is carried by the verb ending; drop the pronoun when the verb shows the person («Введи…»,
  «Побачиш…»), keep it when it is the point («на тебе»).
- **Status forms in -но / -то** say what happened without saying who: «Оприлюднено», «Скопійовано», «Побачено»,
  «Не вдалося». They have no gender and no number, which also solves runtime slots (§5).

### 2.2 Rhythm and length

- Prose sentences: **20 words or fewer**, at most two commas and one participle phrase («рухаючись на південь»). A
  participle (дієприслівник) always belongs to the sentence's subject: «Супутник … пролетів…, рухаючись на південь» is
  right; «Це місце було в полі зору…, рухаючись на північ» says the place moved.
- Keep the English order of *facts* (what crossed, when, where, how it moved → what that means → what we can't know),
  not of *words*: let Ukrainian move time or place to the front when that is natural, and keep the punch at the end.
- Headlines: no subordinate clauses. Display lines break at phrase boundaries, never between a preposition and its
  word.
- Footnotes and readouts may be telegraphic: «Хмарність кадру: 25%.»

### 2.3 What to avoid

- **Marketing tone:** «Відкрийте для себе», «неймовірний», «унікальний», «революційний», «Ласкаво просимо»,
  «Дізнайтеся більше», exclamation marks, emoji, rhetorical questions. Two questions are allowed because the English
  asks them: the share post's hook and the card's footer invitation (§3.7).
- **Bureaucratese:** «здійснювати» («здійснив проліт» ✗ → «пролетів»), «являтися» (✗ → «є», or nothing), «даний»
  meaning "this" (✗ → «цей»), «з метою», «у разі», «на протязі» (✗ → «протягом»), «вносити» («вніс це місце в мозаїку»
  ✗ → «додав це місце до мозаїки»), long genitive chains.
- **Calques of English structure:** «Це є справжній знімок» (✗ → «Це справжній знімок»), «робити зйомку» (✗ →
  «знімати»), a possessive on every noun, passives with «був + -ний» («був опублікований» ✗ → «оприлюднено»).
- **Russianisms:** §9. A reviewer who "also knows Ukrainian" through Russian is not a reviewer for this product.
- **War vocabulary:** §8. It is the first thing a Ukrainian reader hears in a sentence about a camera over their town.

### 2.4 Before and after

| English | Literal (wrong) | Shipped | Why |
|---|---|---|---|
| Something watched you this week. | Щось спостерігало за вами цього тижня. | Цього тижня щось дивилося на *тебе*. | ти; the product verb; "you" moves to the end, where Ukrainian puts emphasis |
| It was daylight, so it almost certainly recorded this spot. No scene from this pass has been published yet; archives can lag by a day or more. | Був денний час, тому він майже напевно записав цю пляму. Жодна сцена з цього проходу ще не була опублікована; архіви можуть відставати на день або більше. | Був день, тож ця точка майже напевно потрапила в кадр. Знімка з цього прольоту ще не оприлюднено. Архіви можуть запізнюватися на добу й більше. | «пляма» is a stain and «сцена» a stage; «прохід» is a corridor; the point is the subject, so no satellite gender is needed |
| Its images feed weather forecasts; they are not published as pictures we can show. | Його зображення живлять прогнози погоди; вони не є опублікованими як картинки… | Його знімки йдуть у прогнози погоди. Їх не публікують як зображення, які ми могли б показати. | No «є + -ний»; impersonal «не публікують»; «картинка» is too casual |
| (a typical marketing rewrite) | Відкрийте для себе, які супутники стежать за вами з космосу! | Введи будь-яке місце на Землі. Побачиш усі супутники, що пролітали над ним за останні 7 днів… | The English never sells; neither does the Ukrainian |
| Can it see me? No. … You're not in it. | Чи може воно бачити мене? Ні. … Ви не в ньому. | Мене видно? Ні. … Тебе на знімку не видно. | Short, spoken, ти |
| …weather satellites scan at night too, in infrared, so it saw your clouds… | …тож він бачив твої хмари… | Метеосупутники сканують і вночі, в інфрачервоному діапазоні, тож цей супутник бачив твої хмари, а не вулиці. | «він» after a plural has no antecedent |

---

## 3. The key lines

### 3.1 The hero

**Landing (three display lines, one accent):**

```
Цього тижня
щось дивилося
на *тебе*.
```

The accent is **тебе** (serif italic, signal orange); «на» and the full stop stay in the display face. Line 2 starts
lowercase: it is one sentence. The uk value is
`[['Цього тижня'], ['щось дивилося'], ['на ', accent('тебе'), '.']]`: the message carries its own lines and accent,
so no code changes for the accent moving to line 3.

Measured (§6.10 faces, 1280 × 900, 92.2 px): 421 / 509 / 277 px in the 580 px column (English 343 / 402 / 314). On a
390 px phone the longest line is ≈ 241 px of 334. On a landscape tablet where the middle line does not fit, it wraps at
its space into the card's four-line form below; that is allowed, a break anywhere else is not.

**Default share card (four lines):** at the card's 88 px, «щось дивилося» measures 480 px against a 466 px column
(English's widest line is 445 px). The card sets:

```
Цього тижня
щось
дивилося
на *тебе*.
```

`[['Цього тижня'], ['щось'], ['дивилося'], ['на ', accent('тебе'), '.']]`. «щось» alone on its line echoes the English
poster's "Something".

| Alternate | Why it loses |
|---|---|
| «Щось дивилося / на *тебе* / цього тижня.» | Mirrors the English order, but ends on the time, so the emphasis lands on «цього тижня», not on you |
| «Цього тижня / за *тобою* / стежили.» | «Стежити» is paranoid where the English is quiet, and since 2022 it evokes spotters and surveillance; «стежили» is also "people watched", not "something" |

Why the shipped one wins: when → what → whom, with "you" in the last, strongest position; balanced lines; and
**дивитися** is literally what a camera pointed at the ground does.

Tab title: «Watched · Цього тижня щось дивилося на тебе». The share post's hook and the results invitation repeat the
hero with one word: «Цього тижня щось дивилося й на тебе.» Keep the three in step.

### 3.2 The sub line

**Shipped:** «Введи будь-яке місце на Землі. Побачиш усі супутники, що пролітали над ним за останні 7 днів, і справжні
знімки, які вони зробили.» (`7` is a mono number with an NBSP before «днів»; «днів» follows the plural of `days`:
1 день, 2 дні, 5 днів.)

| Alternate | Why it loses |
|---|---|
| «Введи будь-яке місце на Землі — і побачиш кожен супутник, що пролетів над ним…, і справжні знімки, які він зробив.» | «кожен … він зробив» makes every satellite own the pictures one by one; the dash adds drama |
| «Обери будь-яке місце на Землі. Тут будуть усі супутники…» | «Тут будуть» describes a page, not a promise to the reader; drops "last" |

«справжні» is "actual"; never «фактичні» or «актуальні» (§9). «над ним» refers to «місце» (neuter).

### 3.3 Results headline

The place is the serif accent and comes **first**, as a title, in the nominative. The sentence after it points back
with **сюди**. The bold phrase is the verb with the count. On the results screen the full stop after the place is
plain text; on the card it sits in the accent block as its own part, as English does there.

**Current window**, one plural message wrapping the verb:

| Category | Numbers | Frame |
|---|---|---|
| `one` | 1, 21, 31, 101 | «*[PLACE]*. За останні 7 днів сюди **дивився [NUM] супутник**.» |
| `few` | 2–4, 22–24, 102 | «*[PLACE]*. За останні 7 днів сюди **дивилися [NUM] супутники**.» |
| `many` | 5–20, 25–30, 111 | «*[PLACE]*. За останні 7 днів сюди **дивилися [NUM] супутників**.» |
| `other` | fractions (never reached) | «*[PLACE]*. За останні 7 днів сюди **дивилися [NUM] супутника**.» |

Examples: «*Waterloo*. За останні 7 днів сюди **дивилися 256 супутників**.» · «*Київ*. За останні 7 днів сюди
**дивився 1 супутник**.» · «*Одеса*. За останні 7 днів сюди **дивився 21 супутник**.» (21 is `one`.)

- **None** (its own message, never a plural form): «*[PLACE]*. Цього тижня сюди не дивився жоден відомий нам
  супутник.» (that week: «Того тижня…»). The same words everywhere, card included: they set in three card lines
  («Цього тижня сюди не / дивився жоден відомий / нам супутник.»), and «відомий нам» is honest about the satellites
  About says no one lists.
- **Old window:** «*[PLACE]*. З 29 жовтня по 5 листопада сюди **дивилися [NUM] супутників**.»
- **A place cut short** ends on the ellipsis alone: «*Дуже довга назва…* За останні 7 днів…»

| Alternate | Why it loses |
|---|---|
| «За останні 7 днів *Waterloo* бачили **256 супутників**.» | Needs the accusative: «Одеса бачили», «Україна бачили» are ungrammatical, and Intl country names are exactly such words |
| «За останні 7 днів **256 супутників дивилися** на це місце: *Waterloo*.» | The colon label reads like a form field |

Why the shipped one wins: the nominative title works for every name in every script, gender and number («Карпати»,
«Дніпро», «Palm Jumeirah», «50.45, 30.52»).

In code:

```ts
const head = (place: string) => [accent(place), '. За останні 7 днів сюди ']
f.plural(n, {
  one: [...head(place), strong('дивився ', num(f.int(n)), ' супутник'), '.'],
  few: [...head(place), strong('дивилися ', num(f.int(n)), ' супутники'), '.'],
  many: [...head(place), strong('дивилися ', num(f.int(n)), ' супутників'), '.'],
  other: [...head(place), strong('дивилися ', num(f.int(n)), ' супутника'), '.'],
})
```

The NBSP between the number and its noun is in the translator's string: neither React nor `plain()` adds it.

### 3.4 The second line (images made public)

One count for photos, mosaics, radar and full-disc images alike. «Оприлюднено» agrees with nothing, so only the noun
changes.

| Case | Frame |
|---|---|
| `one` | «Оприлюднено [NUM] знімок.» (1, 21, 31) |
| `few` | «Оприлюднено [NUM] знімки.» (2–4, 22–24) |
| `many` | «Оприлюднено [NUM] знімків.» (5–20, 25–30, 1 715) |
| `other` | «Оприлюднено [NUM] знімка.» |
| Partial ("At least") | «Оприлюднено щонайменше [NUM] знімок / знімки / знімків.» |
| None | «Цього тижня не оприлюднено жодного знімка.» (that week: «Того тижня…»; card: «Не оприлюднено жодного знімка.») |
| Archives down | «Архіви не відповіли, тож зараз ми не можемо порахувати оприлюднені знімки.» Card: «Архіви знімків не відповіли.» |

Removing «щонайменше» changes no other word, so the partial line settles in place. The line is set whole (no bold
inside); the number is mono.

### 3.5 Pass sentences

**Imaged, detailed photo** ("Sentinel-2C crossed 786 km overhead at 16:14:21 UTC, moving south at 7.46 km/s. It was
looking straight down. Cloud cover across the scene: 25%."):

> Супутник Sentinel-2C пролетів на висоті 786 км просто над головою о 16:14:21 UTC, рухаючись на південь зі
> швидкістю 7,46 км/с. Він дивився прямо вниз. Хмарність кадру: 25%.

Parts of the frame:

- Overhead (ground distance < 15 km): «на висоті [ALT] просто над головою»
- Offset: «на висоті [ALT], за [DIST] на [DIR]» → «на висоті 786 км, за 61 км на захід»
- Off nadir: «Він дивився вниз із відхиленням [DEG] від вертикалі.» (prose says «від вертикалі»; only the label says
  «від надиру»)
- Radar: «Його радар, дивлячись на [DEG] убік, отримав знімок цього місця: [NUM] м на піксель[, у темряві].»
- Daily mosaic: «Його сенсор VIIRS додав це місце до добової мозаїки NASA в природних кольорах: 375 м на піксель.»
- Likely, open optical, recent: «Був день, тож ця точка майже напевно потрапила в кадр. Знімка з цього прольоту ще не
  оприлюднено. Архіви можуть запізнюватися на добу й більше.»
- Likely, at night: «Тут була ніч. Метеосупутники сканують і вночі, в інфрачервоному діапазоні, тож цей супутник
  бачив твої хмари, а не вулиці.»
- Could (commercial): «Супутник WorldView Legion 4 мав це місце в полі зору о 10:52 за місцевим часом. Він міг
  дивитися сюди. Ми не можемо цього знати.»
- Overhead (the message gets no satellite category, so a station is «супутник» here too, which is true: a station is
  an artificial satellite): «Супутник ISS (ZARYA) пролетів на висоті 420 км о 21:03 EET, на 45° над твоїм горизонтом,
  на північному заході.» Near the zenith: «…майже в зеніті.» At night (`darkStation`, which English words for a
  station): «Там, де ти, було темно. Якщо станцію ще освітлювало сонце, вона пролетіла твоїм небом яскравою точкою,
  що не блимає.»
- Geostationary: «Супутник Meteosat-12 не пролітає. Він нерухомо висить на висоті 35 778 км над екватором (0.2°W) і
  кожні 10 хв сканує весь бік Землі під собою.» «Лінія цього сканування дійшла сюди близько 07:49 CET, рухаючись на
  північ.» Infrared: «Тут була ніч, тож це інфрачервоний знімок: верхівки хмар за температурою, що холодніше, то
  світліше.» The seat is a coordinate: international notation, in parentheses, as it arrives.

| Alternate | Why it loses |
|---|---|
| «О 16:14:21 UTC супутник Sentinel-2C пролетів…» | Natural too, but every pass paragraph opens on what crossed |
| «Sentinel-2C пролетів…» | Without «супутник» the verb's gender is a guess (and wrong for a station) |

### 3.6 The four verdicts (`VERDICT_META`)

One set of words everywhere (DESIGN §7). Titles are status forms, impersonal plurals or noun phrases, never a bare
past tense that would need the satellite's gender.

| Verdict | Title | Lane (mono caps, ≤ 8 characters) | Count unit | Definition (one sentence or two) | Headline frame (`[SAT]` / nameless) |
|---|---|---|---|---|---|
| imaged | Побачено | ЗНІМОК | проліт · прольоти · прольотів · прольоту | Справжній знімок цього місця є у відкритому архіві. | «*[PLACE]*. Сюди дивився супутник [SAT].» / «…невідомий супутник.» |
| likely | Імовірно побачено | ІМОВІРНО | same | Це місце потрапило в смугу огляду нерухомої камери. Знімка не оприлюднено. | «*[PLACE]*. Це місце потрапило в смугу огляду супутника [SAT].» / «…невідомого супутника.» |
| could | Могли дивитися сюди | МОЖЛИВО | same | Це місце було в досяжності поворотної або приватної камери. Оператор не повідомляє, чи вона дивилася сюди. | «*[PLACE]*. Сюди міг дивитися супутник [SAT].» / «…невідомий супутник.» |
| overhead | Над головою | У НЕБІ | same | Проліт твоїм небом. Станції та все інше. | «*[PLACE]*. Над цим місцем пролетів супутник [SAT].» / «…невідомий супутник.» |

- **Побачено** is kept on its own merits: a -но status form, no gender, and honest (an image exists).
- **ІМОВІРНО / МОЖЛИВО** is the standard Ukrainian pair for "probable / possible", exactly the gap between *likely* and
  *could*. «Імовірно» with і at the start, per the euphony rule.
- **Могли дивитися сюди**: the impersonal plural names no agent, which is the point (the operator may or may not have
  aimed the camera), and it keeps the product verb. «Навести» is banned (§8).
- The overhead lane is **У НЕБІ**: it fits the lane and matches the definition («Проліт твоїм небом»).
- About's longer words: imaged «Якщо ми його показуємо, це справжній знімок.»; likely «Можливо, він ще не вийшов або
  його відкинули через хмари.» (not «Знімок ще не оприлюднили…»: it echoed the definition's «Знімка не оприлюднено»
  word for word, right before it); could «Дізнатися, чи так було насправді, неможливо.»

### 3.7 Share card, share page and post

The card is drawn in the sharer's language (`l=uk`); the stored share keeps the canonical English label, as every share
does. Every card frame below keeps `[PLACE]` first or after a colon.

**Headlines** (rich: the accent block holds the place and its full stop; the lead follows as its own block, ≤ 3 lines
of about 24 characters at the largest size):

| Key | uk |
|---|---|
| `headline` (the week's N, ≥ 1) | «*Waterloo.* Сюди дивилися 7 супутників.» (`one`: «Сюди дивився 21 супутник.») |
| `headlineWeek` | «*Waterloo.* Цього тижня сюди дивився 31 супутник.» · none: «*Waterloo.* Цього тижня сюди не дивився жоден відомий нам супутник.» |
| `headlineBy` (older shares) | the four verdict frames of §3.6, with `sat` undefined → the nameless forms |
| `photos` | §3.4 |

**Top row and readouts:** stamp «нд, 1 лист. 2026 · 11:21 EST» (built from Intl parts, without Intl's «р.»); `weekTo`
«7 днів до 1 лист. 2026»; `lastWeek` «Останні 7 днів». Readouts «Висота · Від надиру · Піксель · Піксель мозаїки ·
До траси · Над горизонтом · Швидкість» (the longest, 15 characters, measures ≈ 142 px of the 155 px column); week
lanes «Знімок · Імовірно · Можливо · У небі»; units «км · м · км/с».

**Over the picture:** `aSatellite` (a lone label: chips and the plan plate's callout) «Супутник»; look chips «Кадр
зблизька · Sentinel-2B · 10 м», «Останній ясний кадр · 3 лист.», «Під хмарами», «Радар»; geometry «Геометрія прольоту ·
північ угорі»; notes «Знімок відкривається в застосунку» · «Знімок зараз недоступний» · «Комерційний архів, закритий» ·
«У смузі огляду, знімка ще немає» · «Траса в момент зближення»; `acquiring` «Зчитування…»; `noPublicPhoto` «Цього тижня
знімків не оприлюднено» (the week's lead can be radar, which is not a photo); `noPhoto` «Немає знімка для показу».

**Clouds** (`sub` · `chip` · `post` · `desc`):

| Case | uk |
|---|---|
| only (≥ 90%) | «Під хмарами. Видно лише хмари.» · «Під хмарами · 93%» · «Видно лише хмари.» · «Видно лише хмари (93%).» |
| mostly (70–89%) | «Переважно хмари: 81% кадру.» · «Переважно хмари · 81%» · «Видно переважно хмари (81%).» · same |
| spot | «Хмари над самою точкою.» · «Хмари над точкою» · «Точку закрили хмари.» · same |

**Footer:** `invite` «Що дивилося на тебе?» (20 characters beside the domain); `enterAnyPlace` «Обери місце на Землі»;
`defaultPlace` «Пальма Джумейра»; `defaultAlt` «Справжній знімок Пальми Джумейра (Дубай) із супутника Sentinel-2, а поруч
рядок: Цього тижня щось дивилося на тебе. Обери місце на Землі.» (it describes the uk default card, drawn for an
`l=uk` link).

**Share page:** `title` «Цього тижня щось дивилося на тебе.»; `description` = the sub line (§3.2); `placeTitle`
«Waterloo: що дивилося сюди цього тижня»; `placeDescription` «Waterloo: усі супутники, що пролітали тут за останні 7
днів, і справжні знімки, які вони зробили. Що дивилося на тебе цього тижня?»; `opening` «Відкриваємо *Watched*».

**Pass page description:**

| Key | uk |
|---|---|
| `crossed` imaged / likely | «Waterloo. Супутник Sentinel-2C пролетів на висоті 795 км об 11:21 EST, 1 листопада 2026 року, рухаючись на південь.» |
| `crossed` overhead | «Waterloo. Над цим місцем пролетів супутник ISS (ZARYA) о 21:03 EET, 1 листопада 2026 року, рухаючись на північний схід.» |
| nameless | «Waterloo. Невідомий супутник пролетів…» |
| `withinView` | «Waterloo. Супутник WorldView Legion 4 мав це місце в полі зору о 10:52 EST, 1 листопада 2026 року, рухаючись на північ.» |
| `couldHave` | «Він міг дивитися сюди. Оператор не повідомляє, чи так було.» |
| `straightDown` / `offNadir` | «Він дивився прямо вниз.» / «Він дивився вниз із відхиленням 5,4° від вертикалі.» |
| `cloudCover` | «Хмарність: 25%.» |
| `inSwath(place)` | «Це місце потрапило в смугу огляду його камери.» (the slot is ignored: the place cannot be the subject of a past tense) |
| `bestFrom` | «Кадр зблизька зробив супутник Sentinel-2B.» · «Останній ясний кадр зробив супутник …» · «Перший знімок зробив супутник …» · nameless «…зробив невідомий супутник.» |
| `question` | «Що дивилося на тебе цього тижня?» |
| `cardAlt` | «Картка для поширення з кадром зблизька цього тижня. Його зробив супутник Sentinel-2C.» · plain «Картка для поширення.» |

No message, in the app, the post or the card, receives a satellite category, so every frame with `[SAT]` keeps
«супутник» for a station too: it is true (a station is an artificial satellite). Only `darkStation`, which English
words for a station, says «станція».

**Post text:**

| Verdict | uk |
|---|---|
| imaged | «Waterloo. Сюди дивився супутник Sentinel-2C з висоти 786 км, 1 листопада об 11:21 за місцевим часом. 10 м на піксель. Це справжній знімок.» |
| likely | «Waterloo. Супутник Sentinel-2A пролетів на висоті 786 км, 1 листопада о 10:41 за місцевим часом. Це місце потрапило в смугу огляду його камери.» |
| could | «Waterloo. Супутник WorldView Legion 4 мав це місце в полі зору 1 листопада о 10:52 за місцевим часом. Він міг дивитися сюди. Оператор не повідомляє, чи так було.» |
| overhead | «Waterloo. Над цим місцем на висоті 420 км пролетів супутник ISS (ZARYA), 1 листопада о 21:03 за місцевим часом.» |
| hooks | «Цього тижня щось дивилося й на тебе.» / «Що пролітало над тобою цього тижня?» |
| credit | «via @armaangupt0» (unchanged) |

### 3.8 Globe and HUD words

The globe's pass sequence shows a crosshair and a shockwave over the reader's town: its words are nouns, never a verb
of capture (§8).

| English | uk (stored in sentence case; CSS uppercases) |
|---|---|
| Acquiring | Зчитування |
| ACQUIRED 11:21:21 EST · 10 m | Знімок 11:21:21 EST · 10 м |
| ACQUIRED (now) | Знімок |
| IMAGED 11:21:13 EST / ≈ 11:21 EST | Знімок 11:21:13 EST / Знімок ≈ 11:21 EST |
| ACQUISITION · [SAT] (over T−) | Знімок · [SAT] |
| CLOSEST APPROACH · [SAT] / now | Зближення · [SAT] / Зближення |
| Scan line counter | `['Рядок ', strong(line), ` → ${lines}`]` |
| Awaiting pass / scan | Очікування прольоту / Очікування сканування |
| How this works | Як це працює |
| SUN 16.2°S 063.0°E | Сонце 16.2°S 063.0°E (coordinates as they arrive) |
| Sub-solar point · GMST 18:41:50 | Підсонячна точка · GMST 18:41:50 |
| Scene (replay clock) | Кадр |
| 12,847 OBJECTS · Objects · CATALOG | 12 847 об’єктів · Об’єкти · Каталог |
| Fetched [stamp] · Stale, 3 D ago | Отримано [stamp] · Застарілий, 3 дн. тому |
| Catalog unavailable · Loading catalog | Каталог недоступний · Завантаження каталогу |
| Fault · Trying… · Back | Збій · Пробуємо… · Назад |

### 3.9 About page

The owner's plain voice, ти, short answers. `about.privacy` is translated **exactly**: it promises nothing more and
nothing less than the English.

| English | uk |
|---|---|
| How this / *works*. | Як це / *працює*. |
| Pick a spot on Earth. We work out which satellites flew over it in the last week, then go find the photos they took. It all runs in your browser, on public data. | Обери точку на Землі. Ми обчислюємо, які супутники пролітали над нею за останній тиждень, і шукаємо знімки, які вони зробили. Усе працює у твоєму браузері, на відкритих даних. |
| Sections | Коротко · Як ми шукаємо прольоти · Що означають позначки · Чого ми не бачимо · Приватність · Подяки · Клавіатура |
| Is it live? Not quite. Photos land in the archives a few hours to a couple of days after they're taken… | Це в реальному часі? Не зовсім. Знімки потрапляють до архівів за кілька годин або за день-два після зйомки, тож для найсвіжіших прольотів їх може ще не бути. |
| Can it see me? No. At best a pixel here is 10 m across. A car is one pixel. You're not in it. | Мене видно? Ні. Найдрібніший піксель тут — 10 м. Автомобіль — це один піксель. Тебе на знімку не видно. |
| Is this every satellite? No. Military and spy satellites mostly aren't in public catalogs, and companies don't say where they point their cameras. | Тут усі супутники? Ні. Військових і розвідувальних супутників здебільшого немає у відкритих каталогах, а компанії не кажуть, куди спрямовують свої камери. |
| A few sit over the equator… If you're on their side of Earth, you're in every frame. | Кілька висять над екватором і кожні 10 хвилин дивляться на пів планети. Якщо ти на їхньому боці Землі, ти в кожному кадрі. |
| Tilting cameras: … If you were in reach, we call it "could have pointed here". | Поворотні камери: … Якщо твоє місце було в досяжності, ми пишемо «Могли дивитися сюди». |
| Made from public data. We didn't take any of these photos. | Зроблено з відкритих даних. Жодного з цих знімків ми не робили. |
| Close · Esc · Space | Закрити · Esc · Пробіл |
| Keyboard rows | Знайти місце · Перейти між підказками · Вибрати · Гортати прольоти · Розгорнути знімок · Відтворити або призупинити повтор · Назад або закрити · Ця сторінка |

Credits: licence lines ("Contains modified Copernicus Sentinel data 2026", "Contains modified EUMETSAT Meteosat data
2026", "Landsat: USGS / NASA", "Himawari: JMA, via NASA GIBS") stay in English, word for word. OpenStreetMap's
attribution is localised under OSM's own guidelines: «© учасники OpenStreetMap (ODbL)». The words around them («Подяки»)
are translated.

---

## 4. Glossary

### 4.1 Terms

Gender: m. / f. / n. / pl. Plural forms are `one · few · many`.

| English | uk | Notes |
|---|---|---|
| satellite | супутник | m.; супутник · супутники · супутників. Never «сателіт». |
| a satellite (no name) | невідомий супутник (sentences) · Супутник (a lone chip or callout) | |
| station (crewed) | станція | f. Only where the English itself words a station (`darkStation`: «станцію … вона»). No message gets a category, so a station named by `[SAT]` is «супутник». |
| pass (noun) / overflight | проліт | m.; проліт · прольоти · прольотів · прольоту. Never «пас», «прохід». |
| to pass over | пролітати / пролетіти над | Past tense only with «супутник» / «станція» (§5.2). Never the bare «пролетів» as a label: slang for "failed". |
| to watch (product verb) | дивитися (на / сюди) | Never стежити, спостерігати, слідкувати, фотографувати. |
| watched (verdict) | Побачено | «Імовірно побачено» for likely. |
| could have pointed here | Могли дивитися сюди | Never «навести» (§8). |
| photo | фото | n., indeclinable. Only a certain Sentinel-2 / Landsat photo. |
| image | знімок | m.; знімок · знімки · знімків · знімка. Any image. |
| picture (casual) | знімок; зображення in technical asides | Never «картинка». |
| scene / frame / look | кадр | m.; кадр · кадри · кадрів · кадру. «Хмарність кадру», «Кадр 3 з 12». |
| closest look | кадр зблизька | Never «найближчий …»: it reads "the next one" (in a ‹ › carousel above all). |
| clear look | ясний кадр | ясний кадр · ясні кадри · ясних кадрів · ясного кадру. Never «ясний погляд» (a person's clear eyes). |
| last clear look | останній ясний кадр | 19 characters. |
| clouded over | під хмарами | «Переважно хмари» for mostly cloud. |
| made public / published | оприлюднено / оприлюднений | Of an operator's habit: «публікувати» («їх не публікують»). |
| archive | архів | m.; «відкритий архів», never «публічний архів». |
| swath | смуга огляду | f. «потрапило в смугу огляду». Never «свот», «смуга захоплення». |
| field of regard | зона огляду | f. Readout «Зона огляду ±45°». Never «зона наведення». |
| field of view | поле зору | n. «У полі зору». |
| off-nadir | відхилення від вертикалі (prose) · Від надиру (label) | |
| nadir / straight down | надир / прямо вниз | «надир» only in labels. |
| ground track | траса | f.; «наземна траса». Never «трек». |
| orbit | орбіта | f. |
| orbital elements / element sets | елементи орбіти / набори елементів | TLE stays. |
| propagate (orbits) | розрахувати | «Розрахунок орбіт», «Орбіти розраховано». |
| epoch | епоха | f. «Епоха TLE». |
| altitude | висота | f. Not for angles. |
| elevation (angle) | висота над горизонтом | Label «Над горизонтом»; «над твоїм горизонтом». Sun: «висота Сонця». |
| horizon | горизонт | Never «обрій» in this product. |
| ground speed | шляхова швидкість | Prose: «зі швидкістю 7,46 км/с». |
| heading | курс | m. Readout «194,6°» with unit «SSW · висх.». |
| ascending / descending | висхідний / низхідний | Unit: «висх.» / «низх.». |
| closest approach | найбільше зближення | Label «Зближення». |
| ground distance | відстань до траси | Card: «До траси». |
| cloud cover | хмарність | f. |
| cirrus / cloud shadow | перисті хмари / тінь від хмар | |
| clear | ясно / ясний | «Над твоєю точкою ясно.» |
| pixel | піксель | m.; піксель · пікселі · пікселів. «10 м на піксель». |
| resolution | роздільна здатність | f. Never «резолюція». Labels say «Піксель». |
| radar | радар | «радарний знімок», «радарний супутник». |
| daily mosaic | добова мозаїка | f.; добова мозаїка · добові мозаїки · добових мозаїк. Tag «Мозаїка». |
| true colour | природні кольори | «у природних кольорах». |
| geostationary / full disc | геостаціонарний / повний диск | «знімок повного диска». |
| scan / scan line / line | сканування / лінія сканування / рядок | «Рядок 412 → 1 100». |
| band: infrared / visible / colour | діапазон: тепловий / видимий / колір | Values ≤ 9 characters at 21 px. Prose keeps «інфрачервоний». |
| time-lapse | таймлапс | m.; таймлапс · таймлапси. |
| replay | повтор (noun) · відтворити (verb) | Short «Повтор», long `['Повтор', strong(' прольоту')]`: the long form begins with the short. |
| catalog | каталог | m. «каталог орбіт». |
| sub-solar point | підсонячна точка | f. |
| day / twilight / night | день / сутінки / ніч | «Був день», «Тут була ніч». |
| steerable / fixed camera | поворотна / нерухома камера | f. |
| camera / sensor | камера / сенсор | Instrument names (MSI, OLI, VIIRS) stay. Never «датчик» for an imager. |
| operator | оператор | «Оператор не повідомляє». |
| weather / imaging / radar satellite | метеосупутник / знімальний супутник / радарний супутник | |
| window (time) | вікно | n. |
| place / spot | місце / точка | «твоя точка». Never «пляма». |
| pin / reticle | мітка | f. «Поставити мітку». Never «пін», «приціл», «ціль». |
| acquired / imaged | знімок (noun) | Never «зафіксовано», «захоплено» (§8). |
| object (catalog) | об’єкт | m.; об’єкт · об’єкти · об’єктів. |
| pass geometry / plan view | геометрія прольоту / схема прольоту | |
| app | застосунок | Never «додаток». |
| share | поділитися | «Поділитися прольотом / знімком / тижнем». |
| download (image) | зберегти | «Зберегти знімок». «завантажити» only for the app loading («Не вдалося завантажити каталог»); never «скачати». |
| copy / copied | копіювати / скопійовано | |
| link | посилання | n. Field label «URL» (fits the 48 px column). Never «лінк». |
| card (share card) | картка | f. «Копіювати картку». |
| post (social) | допис | m. |
| video | відео | n., indeclinable. |
| cookies | файли cookie | Never «куки». |
| search a place | пошук місця | |
| use my location | моє місцезнаходження | Matches the browser's prompt. «Де я» on phones, «Поруч» in the ≤ 400 px chip. |
| surprise me | навмання | |
| last 7 days / this week / that week | останні 7 днів / цього тижня / того тижня | Never «на цьому тижні». |
| local time | місцевий час | Prose: «за місцевим часом». |
| UTC, zone abbreviations | unchanged | As code prints them (EST, CET, UTC+9). |
| ago / just now / in 3 h | тому / щойно / через 3 год | |
| s / min / h / d | с / хв / год / дн. | «с», «хв», «год» are unit symbols, no period, never inflected; «дн.» is an abbreviation and takes its period, as Intl prints. Prose spells days out: «2 дні тому». |
| km, m, km/s, ° | км, м, км/с, ° | NBSP before km and m; ° tight. |
| Earth / ground | Земля / земля | Capital for the planet. |
| Sun / sunlight | Сонце / сонце | Capital only in «висота Сонця» and the HUD; «тут сонце так і не зійшло». |
| ESA | ЄКА | NASA, NOAA, EUMETSAT, Copernicus, Planetary Computer stay Latin. |
| key "Space" | Пробіл | Esc, Enter, F as printed on keys. |

### 4.2 Compass and coordinates

**Prose only, 8 words.** Moving or offset (на + accusative): на північ · на північний схід · на схід · на південний
схід · на південь · на південний захід · на захід · на північний захід («рухаючись на південь», «за 61 км на захід»).
Position in the sky (на + locative): на півночі · на північному сході · на сході · на південному сході · на півдні · на
південному заході · на заході · на північному заході («45° над горизонтом, на північному заході»). A prose message
receives the direction as an index or degrees, never as English text.

**Readouts:** the compass point arrives as `compassAbbr()` prints it («SSW») and is set as it arrives, uppercase
Latin, like the coordinates on the same screens («16.2°S 063.0°E») and the photo's N chip. `heading` →
«SSW · висх.»; `upCompass` → the compass alone («SSW»), because the label «У твоєму небі» already says "up".

**Coordinates** are international notation in every surface, prose included: «43.47, −80.54», «16.2°S 063.0°E»,
«(0.2°W)». Never rewritten with a decimal comma or Cyrillic hemisphere letters.

### 4.3 Ukraine's oblasts and cities (uk display table)

The offline list stores Ukraine's places under their GeoNames English names («Kyiv», «Kharkiv», sublabel «Kyiv City»).
For a uk reader they are shown in Ukrainian through a display table in the uk chunk; usage stats, `record_lookup` and
shares keep the English label (`Place.canonicalLabel`), so counts never split by language.

The 27 first-level names, as the Constitution lists them (official names are never "corrected": the city is Дніпро,
the oblast is still Дніпропетровська; Кіровоградська stays):

| GeoNames | uk | GeoNames | uk |
|---|---|---|---|
| Cherkasy | Черкаська область | Mykolaiv | Миколаївська область |
| Chernihiv Oblast | Чернігівська область | Odesa | Одеська область |
| Chernivtsi | Чернівецька область | Poltava | Полтавська область |
| Crimea | Автономна Республіка Крим | Rivne Oblast | Рівненська область |
| Dnipropetrovsk | Дніпропетровська область | Sevastopol City | місто Севастополь |
| Donetsk | Донецька область | Sumy | Сумська область |
| Ivano-Frankivsk | Івано-Франківська область | Ternopil | Тернопільська область |
| Kharkiv | Харківська область | Vinnytsia | Вінницька область |
| Kherson | Херсонська область | Volyn | Волинська область |
| Khmelnytskyi | Хмельницька область | Zakarpattia | Закарпатська область |
| Kirovohrad | Кіровоградська область | Zaporizhzhia | Запорізька область |
| Kyiv City | місто Київ | Zhytomyr Oblast | Житомирська область |
| Kyiv Oblast | Київська область | Luhansk | Луганська область |
| Lviv | Львівська область | | |

Settlements: every UA row of 10,000+ people (≈ 350 names, ≈ 3 kB gzipped), generated by a script from GeoNames
`alternateNamesV2` (language `uk`, preferred names), read once by a native reviewer, never typed by hand. It covers the
landmark aliases too: Kiev → Київ, Pripyat → Прип’ять, Kishinev → Кишинів.

### 4.4 Curated places (`places` namespace, every id)

Established Ukrainian names; the chip only for the first three. Sublabels use «США», «ОАЕ», «ПАР», the short forms
Ukrainians write.

| id | label | sublabel |
|---|---|---|
| area51 | Зона 51 (chip «Зона 51») | Грум-Лейк, Невада, США |
| centralPark | Центральний парк (chip «Центральний парк», measured: the three chips fit one 334 px row) | Нью-Йорк, США |
| giza | Піраміди Гізи (chip «Гіза») | Гіза, Єгипет |
| uluru | Улуру | Північна територія, Австралія |
| palmJumeirah | Пальма Джумейра | Дубай, ОАЕ |
| worldIslands | Острови «Світ» | Дубай, ОАЕ |
| grandCanyon | Великий каньйон | Аризона, США |
| meteorCrater | Метеоритний кратер | Аризона, США |
| lowerManhattan | Нижній Мангеттен | Нью-Йорк, США |
| lasVegasStrip | Лас-Вегас-Стрип | Невада, США |
| hooverDam | Гребля Гувера й озеро Мід | Невада й Аризона, США |
| goldenGate | Міст Золоті Ворота | Сан-Франциско, США |
| kennedySpaceCenter | Космічний центр Кеннеді | Флорида, США |
| washingtonDc | Вашингтон | Національна алея, США |
| mountStHelens | Гора Сент-Геленс | штат Вашингтон, США |
| niagaraFalls | Ніагарський водоспад | Онтаріо, Канада |
| panamaCanal | Панамський канал | Шлюзи Гатун, Панама |
| rioDeJaneiro | Ріо-де-Жанейро | Цукрова Голова й Копакабана, Бразилія |
| paris | Париж | Іль-де-Франс, Франція |
| venice | Венеція | Венето, Італія |
| vesuvius | Везувій | Неаполь, Італія |
| istanbul | Стамбул | Босфор, Туреччина |
| chernobyl | Чорнобильська АЕС | Київська область, Україна |
| tableMountain | Столова гора | Кейптаун, ПАР |
| kilimanjaro | Кіліманджаро | Кіліманджаро, Танзанія |
| everest | Еверест | Непал і Китай |
| angkorWat | Ангкор-Ват | Сіємреап, Камбоджа |
| singapore | Сінгапур | Марина-Бей, Сінгапур |
| hongKong | Гонконг | Гавань Вікторія, Гонконг |
| tokyo | Токіо | Токіо, Японія |
| fuji | Фудзі | Сідзуока, Японія |
| sydneyHarbour | Сіднейська гавань | Сідней, Австралія |
| richat | Структура Рішат | Сахара, Мавританія |
| greatBlueHole | Велика блакитна діра | Риф Лайтгаус, Беліз |
| boraBora | Бора-Бора | Острови Товариства, Французька Полінезія |
| hardyReef | Риф Гарді | Великий Бар’єрний риф, Австралія |
| male | Мале | Атол Північний Мале, Мальдіви |
| deadSea | Солеварні Мертвого моря | Південний басейн, Ізраїль і Йорданія |
| binghamCanyon | Кар’єр Бінгем-Каньйон | Юта, США |
| mountWhaleback | Кар’єр Маунт-Вейлбек | Пілбара, Австралія |
| etna | Етна | Сицилія, Італія |
| santorini | Санторині | Кіклади, Греція |
| teide | Тейде | Тенерифе, Іспанія |
| kilauea | Кілауеа | Гаваї, США |
| craterLake | Озеро Крейтер | Орегон, США |
| glenCanyonDam | Гребля Глен-Каньйон | Пейдж, Аризона, США |
| gardenCity | Круглі поля Гарден-Сіті | Канзас, США |
| almeria | Теплиці Альмерії | Андалусія, Іспанія |
| gibraltar | Гібралтар | Гібралтарська протока |
| suezCanal | Суецький канал | Ісмаїлія, Єгипет |
| aswanDam | Асуанська гребля | Озеро Насер, Єгипет |
| wadiRum | Ваді-Рам | Акаба, Йорданія |
| sossusvlei | Соссусфлей | Пустеля Наміб, Намібія |
| victoriaFalls | Водоспад Вікторія | Замбія й Зімбабве |
| threeGorges | Гребля «Три ущелини» | Хубей, Китай |
| shanghai | Шанхай | Річка Хуанпу, Китай |
| itaipu | Гребля Ітайпу | Бразилія й Парагвай |

«Міст Золоті Ворота», not «Золоті Ворота»: to a Ukrainian reader the bare name is Kyiv's gate. «Чорнобильська АЕС»,
not «Чорнобиль»: the pin is the plant, about 15 km from the town (§8).

---

## 5. Grammar strategies for runtime slots

### 5.1 [PLACE]: no inflection possible

Ukrainian has seven cases; code can only give the nominative. `[PLACE]` goes only where the nominative is grammatical,
and the sentence refers back to it with words that take the case for it.

**Allowed positions:**
1. **First, as a title**, closed by a full stop: «*[PLACE]*. За останні 7 днів сюди дивилися…»
2. **After a colon**: «Таймлапс: [PLACE]», «Waterloo: що дивилося сюди цього тижня», «Мітку поставлено: [PLACE].»
3. **In parentheses**, in quotation marks, or alone (a chip, a row, a field value).

**Referring back:** «сюди», «тут», «звідси», and «це місце / цього місця / цьому місцю / цим місцем». Pass sentences
never repeat the name.

**Banned:** any preposition before `[PLACE]` («у», «в», «над», «до», «з», «для», «біля», «на», «за»); `[PLACE]` as an
object («бачили [PLACE]»); `[PLACE]` as the subject of a past tense or an adjective («Київ був», «Одеса була»,
«Карпати були»).

**Test every frame with:** «Одеса» (f.), «Україна» (an Intl country), «Карпати» (pl.), «Дніпро» (n.), «Київ»,
«Їжакевичі», «Йосипівка», «Waterloo», «Palm Jumeirah», «50.45, 30.52», and a 48-character label ending in «…».

English adds "the" to oceans and deserts (`placeInProse`); uk frames take the raw label: «Тихий океан».

### 5.2 [SAT] as subject: no gender known

- **Put the head noun «супутник» before the name** whenever a verb, adjective or pronoun agrees with it: «Супутник
  [SAT] пролетів…», «Сюди дивився супутник [SAT].»
- After the first mention, «він / його» refer to «супутник»: «Він дивився прямо вниз.» «Його радар…»
- Oblique cases fall on the head noun; the name stays as is: «у полі зору супутника [SAT]», «зробив супутник [SAT]».
- **Crewed stations:** no message receives a satellite category (the app's pass sentences, posts, cards and pages
  alike), so a station named by `[SAT]` is «супутник [SAT]» with masculine agreement («Супутник ISS (ZARYA)
  пролетів…»), grammatical for any satellite. «Станція» with feminine agreement appears only where the English itself
  words a station (`darkStation`: «станцію… вона…»). Never hard-code «Станція [SAT] пролетіла».
- **No name** (`sat` undefined): «невідомий супутник» takes the head noun's place («Сюди дивився невідомий супутник.»,
  «…смугу огляду невідомого супутника.»). «NORAD 60989» is a name: «супутник NORAD 60989».
- Two or more names are a compound subject: plural verb, no head noun («Umbra та Capella пролітали…»).
- Never slash forms, never a bare name before a past tense.

### 5.3 [NUM]: plural categories and cases

CLDR uk (verified in Node, ICU 78 / CLDR 48): `one` 1, 21, 31, 101 (not 11); `few` 2–4, 22–24 (not 12–14); `many` 0,
5–20, 25–30, 111; `other` fractions only (counts never reach it, but the form is required and must be correct).

**After a bare numeral (nominative / accusative position):**

| Noun phrase | one | few | many | other |
|---|---|---|---|---|
| супутник | 1 супутник | 2 супутники | 5 супутників | 1,5 супутника |
| проліт | 1 проліт | 2 прольоти | 5 прольотів | 1,5 прольоту |
| знімок | 1 знімок | 2 знімки | 5 знімків | 1,5 знімка |
| детальний знімок | 1 детальний знімок | 2 детальні знімки | 5 детальних знімків | 1,5 детального знімка |
| радарний супутник | 1 радарний супутник | 2 радарні супутники | 5 радарних супутників | 1,5 радарного супутника |
| добова мозаїка | 1 добова мозаїка | 2 добові мозаїки | 5 добових мозаїк | 1,5 добової мозаїки |
| ясний кадр | 1 ясний кадр | 2 ясні кадри | 5 ясних кадрів | 1,5 ясного кадру |
| кадр | 1 кадр | 2 кадри | 5 кадрів | 1,5 кадру |
| об’єкт | 1 об’єкт | 2 об’єкти | 5 об’єктів | 1,5 об’єкта |
| збіг (search matches) | 1 збіг | 2 збіги | 5 збігів | 1,5 збігу |
| раз | 1 раз | 2 рази | 5 разів | 1,5 раза |
| день | 1 день | 2 дні | 5 днів | 1,5 дня |
| годину тому | 1 годину тому | 2 години тому | 5 годин тому | 1,5 години тому |
| хвилину тому | 1 хвилину тому | 2 хвилини тому | 5 хвилин тому | 1,5 хвилини тому |

**When a preposition or a verbal noun governs the count**, the noun takes that case and the categories collapse:

| Governing word | one | few / many | other |
|---|---|---|---|
| genitive: від, з ("from"), до, понад, близько, after a verbal noun («Зіставлення», «Перевірено … ») | 21 супутника · 1 201 прольоту | 22 / 25 супутників · прольотів | 1,5 супутника |
| instrumental: з / із ("with"), між, над | із 31 прольотом | із 32 / 35 прольотами | avoid |
| locative: у, на | у 21 кадрі | у 22 / 25 кадрах | avoid |

Prefer to restructure into a nominative position; when the case stays, every category still gets its own form.
Examples: «Перевірено 1 204 прольоти 412 знімальних і пілотованих супутників» (`one`: «…421 знімального і пілотованого
супутника»); engine row «Зіставлення 128 кадрів та 1 204 прольотів» (`one`: «Зіставлення 121 кадру та 1 201
прольоту»).

Rules:
- **The verb agrees with the category**, so the plural message wraps the verb: `one` → singular masculine («дивився
  21 супутник»), `few` / `many` / `other` → plural.
- With `few`, adjectives take the nominative plural («2 радарні супутники»).
- **Prefer -но forms** where English uses a passive: «Оприлюднено 1 знімок / 3 знімки / 31 знімок».
- Abbreviated units never inflect («5 хв», «41 год», «786 км»).
- Zero is never a plural form: every zero sentence is its own message («жоден», «жодного знімка»).
- Where a count would agree with «усі» («Показати всі 31 супутник»), put it in parentheses: «Показати всі супутники
  (31)», «Показати всі прольоти (31)», «Показати всі рядки (31)».
- Test with 0, 1, 2, 4, 5, 11, 12, 14, 21, 22, 25, 101, 111, 401, 421, 1 715.

### 5.4 Lists of names

- Join runtime names with **«та»**, never «і / й»: code cannot know how a name ends when read aloud (§6.2).
- «A, B та ще [NUM] …», with the plural on the noun phrase: `one` «та ще 1 радарний супутник», `few` «та ще 3 радарні
  супутники», `many` «та ще 7 радарних супутників». The verb is plural.
- «Радару не потрібне світло. Umbra, Capella та ще 7 радарних супутників пролітали в зоні досяжності 1 204 рази.» One
  name: «Радарний супутник Umbra пролітав у зоні досяжності 1 204 рази.»
- `Intl.ListFormat('uk')` joins with «і» («Umbra, Capella і ICEYE-X2»): accepted only where a list stands alone, not
  inside a sentence.

### 5.5 Dates and times inside sentences

- **Date:** «1 листопада» from Intl (`{ day: 'numeric', month: 'long' }` gives the genitive month). With the year:
  «1 листопада 2026 року».
- **Never put an Intl weekday after a preposition:** «у неділю» needs the accusative and Intl gives «неділя». In
  sentences and posts, drop the weekday; a standalone label may lead with it: «п’ятниця, 6 листопада».
- **Clock:** «о [TIME]», but «об [TIME]» when the hour is 1 or 11 («об одній», «об одинадцятій»). The message takes
  the hour: `hour === 1 || hour === 11 ? 'об' : 'о'`. Approximate times: «близько 07:49 CET», no preposition.
- Local time: «об 11:21 за місцевим часом». The zone follows the clock: «о 16:14:21 UTC».
- Ranges: «з 29 жовтня по 5 листопада» in sentences; «29 жовтня – 5 листопада» in labels.
- Relative time in a sentence: «41 годину тому», «через 3 год».
- Seasons are whole phrases chosen by the code, never an inserted noun: «по одному щозими / щовесни / щоліта /
  щоосені».

### 5.6 Euphony next to slots

The alternation rules (§6.2) depend on the sounds on both sides, and code cannot know how a slot sounds. So:
- Between fixed text and a slot, "and" is «та».
- Keep fixed words on both sides of у/в and з/із/зі: «у полі зору супутника [SAT]», never «в [SAT]», «у [NUM] …» or
  «з [PLACE]» (the last is banned anyway).
- A fixed brand or sensor name inside a frame is fixed text: read it aloud and choose («у браузері Chrome»).

---

## 6. Typography and formatting

### 6.1 Punctuation

- **Quotation marks:** «ялинки», „лапки“ inside them. Never straight or “English” quotes. A typed query is quoted
  with «ялинки»: «Нічого не знайдено за запитом «Kyiv».»; „лапки“ only for a quote inside a quote.
- **Apostrophe:** **’ U+02BC** everywhere («з’єднання», «об’єкт», «п’ятниця», «Прип’ять»). It is what Intl prints, and
  it is in Instrument Sans's Latin subset, so it never falls back to another face. Never U+0027, U+2019 or a backtick.
- **Ellipsis:** one character … (U+2026), no space before: «Пошук…».
- **Dashes:** em dash — with spaces only where grammar needs it (a missing link verb: «Автомобіль — це один піксель»,
  «Автор — @armaangupt0», «Кожен кадр — той самий квадрат»), never as decoration. En dash – without spaces for ranges
  («10–30 м», «2015–2026»). Hyphen for compounds («будь-яке», «3D-вигляд»).
- **No space** before . , : ; ? and no exclamation marks anywhere.

### 6.2 Euphony (Правопис 2019 §23–25)

Native readers notice this first. Apply it to every fixed string; next to a slot, §5.6.

- **у / в.** «у» between consonants («піксель у твоїй точці»); at the start of a sentence or after a pause (comma,
  colon, dash) before a consonant; and before в, ф, льв, св, тв, хв whatever comes before («у твоєму браузері», «у
  відкритих каталогах»). «в» between vowels, after a vowel before a consonant («ця точка … потрапила в кадр», «Ясно в
  точці»), and at the start of a sentence or after a pause before a vowel («вночі, в інфрачервоному діапазоні»).
- **і / й.** «й» between vowels and after a vowel before a consonant («з’єднання й спробуй», «Гувера й озеро», «дивилося
  й на тебе»). «і» between consonants («знімальних і пілотованих»), at the start of a sentence, after a pause, and before
  й, я, ю, є, ї («Ізраїль і Йорданія»).
- **з / із / зі.** «з» between vowels and after a vowel before most consonants; «із» between consonants («кадрів із
  прольотами», «Знімок із супутника»); «зі» before з, с, ш, щ followed by a consonant («зі швидкістю»).
- Fixed idioms keep their form («так і не», «день-два»).
- When the rule and the ear disagree, read the sentence aloud; the ear of a native reader decides.

### 6.3 Spaces

- NBSP (U+00A0) between a number and its unit or counted noun («786 км», «7 днів», «256 супутників»), inside grouped
  numbers («1 715»), before an em dash, and after one-letter words (в, у, з, і, й, а, о) in headlines and short lines.
- The NBSP between a `num()` part and the noun after it is in the translator's string (`num(…), ' супутників'`):
  React sets a number and its unit in one span, but nothing adds the space before a following noun, and `plain()` (posts,
  aria) joins with an ordinary space.

### 6.4 Numbers

- Decimal comma: «7,46», «0,31 м». Grouping with NBSP from four digits: «1 715», «12 847» (what
  `Intl.NumberFormat('uk')` prints).
- Percent and degree tight: «25%», «98,6°».
- Minus: «−» (U+2212).
- Approximate: «~10 км», «≈ 07:49», as the product prints them.
- Coordinates are not numbers in this sense: international notation, untouched (§4.2).
- People in Ukraine type coordinates as «50,45 30,52»: the coordinate parser accepts a decimal comma when the two
  numbers are separated by a space or a semicolon (Appendix B).

### 6.5 Dates

| Where | Form | Intl options |
|---|---|---|
| Prose | «1 листопада», «з 29 жовтня по 5 листопада» | `{ day: 'numeric', month: 'long' }` |
| Standalone label with weekday | «п’ятниця, 6 листопада» | `{ weekday: 'long', day: 'numeric', month: 'long' }` |
| Short (chips, timeline, lists) | «нд, 1 лист.» | `{ weekday: 'short', day: 'numeric', month: 'short' }` |
| Card stamp | «нд, 1 лист. 2026 · 11:21 EST» | short parts + year, without Intl's «р.» |
| Week stamp | «7 днів до 1 лист. 2026» | no weekday |
| Mono caps | «НД, 1 ЛИСТ. 2026» (CSS uppercases) | same |
| Landing kicker | «Останні 7 днів · 12 → 19 лист. 2026 UTC» | |
| HUD, geometry | ISO, unchanged: «2026-11-08 03:31:07 UTC» | |

Month abbreviations (Intl): січ., лют., бер., квіт., трав., черв., лип., серп., вер., жовт., лист., груд. Weekdays: пн,
вт, ср, чт, пт, сб, нд. Months and weekdays are lowercase.

### 6.6 Time

- 24-hour clocks with a colon, as they arrive: «16:14:21», «07:49». No «год.» after a clock.
- Relative time: «щойно» (< 45 s), «12 хв тому», «41 год тому», days spelled out «2 дні тому», «5 днів тому»; future
  «через 3 год». Spoken (screen readers): «41 годину тому», «12 хвилин тому».
- `Intl.RelativeTimeFormat('uk', { numeric: 'always' })`: `'auto'` says «учора», and the product says «30 год тому».
  Style `'short'` for minutes and hours, `'long'` for days (short prints «2 дн. тому»).
- Compact HUD ages: «<1 хв тому», «42 хв тому», «5 год тому», «3 дн. тому».

### 6.7 Capitalisation and mono caps

- **Sentence case** everywhere: titles, buttons, tabs, sections («Як ми шукаємо прольоти»). Never Title Case.
- Lowercase: months, weekdays, compass words, «інтернет». Capital: «Земля» as the planet; «Сонце» only in «висота
  Сонця» and the HUD; «сонце» in everyday sense («тут сонце так і не зійшло», «камерам потрібне сонце»).
- Proper names: only the first word and proper nouns («Сектор Гази», «Західний берег», «Тихий океан»).
- **Mono caps labels** are stored in sentence case and uppercased by CSS («Висота» → ВИСОТА); Cyrillic uppercases
  correctly with `<html lang="uk">`. Canvas and satori use `toLocaleUpperCase('uk')`.
- **Never uppercased:** the serif place and the hero accent; units, in prose and in mono caps alike (ВИСОТА 786 км,
  10 м, 7,46 км/с: DESIGN §3); satellite names in prose (mono chips
  uppercase them, as in English); the wordmark «Watched.»; URLs; whole sentences.
- Keep mono caps labels to two words: long uppercase Cyrillic with +0.08em tracking reads slowly.

### 6.8 Line breaking

- No automatic hyphenation (`hyphens: manual`) and no soft hyphens. If a line overflows, the copy gets shorter.
- Never break between a number and its unit or noun, between a clock and its zone, before a dash, or after a one-letter
  word (NBSP, §6.3).
- Display lines break at phrase boundaries (§3.1).

### 6.9 Leading and the line mask

`--lh-k` is 1 for Cyrillic today, and the `.hl` line mask pads 0.05em on top, which can clip Й and Ї in a serif place
name. Set `--lh-k` for `[data-script='cyrillic']` from a test of «*Їжакевичі*. За останні 7 днів…» in the results
headline and the card, and check the italic overhang of «тебе» on the hero's wipe. Щ, ц, щ descenders clear the next
line at 0.92 in the chosen faces.

### 6.10 Type: the Cyrillic faces (decided)

Instrument Sans and Instrument Serif have no Cyrillic. Measured choices (specimens, metrics and file sizes in the type
study, `scratchpad/i18n/type/cyrillic/index.md`):

- **Order: brand faces first.** `src/styles/scripts.css` keeps Latin letters and digits in Instrument and Martian Mono
  in every language, so «Sentinel-2C», «256», «UTC» and a Latin place in the accent look the same everywhere. Cyrillic
  falls through to the next family. Every punctuation mark uk needs (’, «», „“, —, …, NBSP) is in Instrument's Latin
  subset.
- **Display and body: Noto Sans (variable, `wdth` + `wght`)**, Fontsource `noto-sans-cyrillic-wdth-normal.woff2`
  (34.0 kB), one `@font-face` with the Cyrillic `unicode-range` (U+0400–045F, U+0490–0491, U+2116), weight 100 900,
  stretch 62.5% 100%, `size-adjust: 94.5%`, appended to `--font-sans` under `[data-script='cyrillic']`. Its width axis
  follows the display's `font-stretch: 75%`; it sits beside Instrument Latin with no visible seam at 34 and 72 px.
- **Accent: Noto Serif Display Italic**, the only candidate that matches Instrument Serif's narrow, high-contrast italic
  in measure (density 5.53 vs 5.59), with true Cyrillic italic forms (т, и, д, б). Declared as its own family pinned to
  `font-weight: 320; font-stretch: 62.5%; size-adjust: 98.5%`, appended to `--font-serif`, with `font-synthesis: none`.
  Shipped as a static instance at those settings (`src/assets/fonts/noto-serif-display-cyrillic-italic-320-62.woff2`,
  11.4 kB against the variable file's 65.4 kB), built by `scripts/build-cyrillic-fonts.py` with fontTools' instancer:
  every glyph and layout feature (ccmp, locl, kern, mark, mkmk) and the source's coverage (U+0301, U+0400–045F,
  U+0490–0491, U+04B0–04B1, U+2116) are kept, and it is committed with its OFL licence (`src/assets/fonts/OFL.txt`).
- **Mono: Martian Mono's Cyrillic subset** (17.2 kB) is already declared with a `unicode-range` in `fonts.css`.
- **Speed:** boot's per-script font list preloads the three files for `cyrillic` only; `FIRST_FONTS` for a Cyrillic
  page adds the two Cyrillic faces with sample text («Цього тижня щось дивилося на тебе») so the hero never re-flows
  mid-wipe, inside the existing 4 s cap. Same origin, cached as immutable, no third party.
- **Share cards:** satori bundles static TTF instances, subset to U+0400–045F, U+0490–0491, U+02BC and «»„“: Noto Sans
  at wdth 67.5 / wght 600 (display) and wdth 100 / wght 400 (sans), the serif accent instance, and Martian Mono's
  Cyrillic at the card's weights. No uk card then asks Google Fonts for Noto (two requests and a 4 s timeout per
  uncached render today), and the card matches the app. Test that the default uk card's widest hero line is ≤ 445 px.
- **The video** already loads its mono face with the words it draws (`video.ts`), so «КИЇВ» is never burned in a
  fallback face.

---

## 7. Length discipline

Ukrainian runs about **30% longer** than English in running prose (the draft's pass sentence is +19%, the none headline
+60%) and **up to ×2** in two-word labels and buttons. Martian Mono is monospaced and its Cyrillic has the same advance
as its Latin, so mono budgets are exact character counts: **8.0 px a character at 11 px, 7.0 px at 9.5 px** (caps,
+0.08em, measured).

Budgets (measured or from the English catalog's constraints):

| Where | Budget | uk |
|---|---|---|
| Timeline lane (9.5 px) | ≤ 8 characters | ЗНІМОК 42 px · ІМОВІРНО 55 · МОЖЛИВО 49 · У НЕБІ 42 (English OVERHEAD 55) |
| Phone share secondaries (three in 360 px, ≈ 90 px of text each at 11 px) | ≤ 11 characters | «Копіювати» 72 · «Допис в X» 72 · «Зберегти» 64 · «Скопійовано» 88 · «Повторити» 72 |
| Share link and post labels (48 px column) | ≤ 5 characters | «URL» 24 · «Допис» 40 |
| Gallery filter segments | ≤ 8 characters | «Усі · Детальні · Погода · Радар» |
| Gallery status, lightbox status (box ≈ 14) | ≤ 14 characters | «Ясно в точці» · «Хмари в точці» · «Перисті хмари» · «Тінь від хмар» · «Добова мозаїка» · «Хмарно · 93%» · «Хмари 25%» |
| Gallery photo counter (box ≈ 12) | ≤ 12 characters | «12 за 7 днів» for this week and that week alike |
| Cover lead chip | ≤ 20 characters | «Кадр зблизька» 13 · «Останній ясний кадр» 19 · «Під хмарами» 11 |
| Band value (21 px) | ≤ 9 characters | «Тепловий» · «Видимий» · «Колір» |
| Landing search hint (beside 01 / МІСЦЕ) | the English's 25 | «Назва, адреса, координати» (25) |
| Pin hint (beside 02 / АБО СПРОБУЙ) | ≈ the English's 32 | «Або постав мітку на глобусі» (27) |
| Search status | short | «Пошук» · «Немає збігів» · «Пошук недоступний» · «1 збіг · 3 збіги · 5 збігів» |
| Card footer (beside the domain, 466 px row) | ≈ 20 characters | «Що дивилося на тебе?» · «Обери місце на Землі» |
| Card readout labels (155 px column, 13 px) | ≤ 15 characters | «Піксель мозаїки» ≈ 142 px |
| Boot note at 320 px | one line | «Повільне з’єднання, ще завантажуємо» (35) |

Strategies, in order:
1. A noun instead of a verb phrase in labels («Курс», «Висота», «Повтор»).
2. Drop what the screen already shows: «Копіювати» directly above the link field; «Де я» on phones.
3. The established short term over the descriptive one («таймлапс», «надир», «метеосупутник»).
4. No «будь ласка», no «Натисніть, щоб…», no possessives the screen implies.
5. Never truncate a word or invent an abbreviation. Units, month and weekday abbreviations, «висх.» / «низх.» and
   «дн.» are the only abbreviations. A count that does not fit keeps its full noun and the layout is checked; it is
   never «суп.».

| English | uk | Characters | Note |
|---|---|---|---|
| SURPRISE ME | НАВМАННЯ | 11 → 8 | |
| USE MY LOCATION | МОЄ МІСЦЕЗНАХОДЖЕННЯ | 15 → 20 | Phones: ДЕ Я (4); ≤ 400 px chip: ПОРУЧ (5) |
| HOW THIS WORKS | ЯК ЦЕ ПРАЦЮЄ | 14 → 12 | Pairs with «СОНЦЕ 16.2°S 063.0°E» (+2) on a 375 px phone |
| LAST 7 DAYS | ОСТАННІ 7 ДНІВ | 11 → 14 | |
| CLOSEST LOOK | КАДР ЗБЛИЗЬКА | 12 → 13 | |
| TIME-LAPSE | ТАЙМЛАПС | 10 → 8 | |
| OFF-NADIR | ВІД НАДИРУ | 9 → 10 | |
| PIXEL | ПІКСЕЛЬ | 5 → 7 | Mosaic: ПІКСЕЛЬ МОЗАЇКИ (15) |
| PASSES | ПРОЛЬОТИ | 6 → 8 | Count unit: 12 ПРОЛЬОТІВ |
| SHARE | ПОДІЛИТИСЯ | 5 → 10 | No shorter natural form |
| SHARE IMAGE | ПОДІЛИТИСЯ КАРТКОЮ | 11 → 18 | Full-width phone button |
| COPY LINK | КОПІЮВАТИ | 9 → 9 | «Копіювати URL» (13, 104 px) does not fit the phone's third |
| COPY IMAGE | КОПІЮВАТИ КАРТКУ | 10 → 16 | Desktop only, ≈ 240 px wide |
| POST TO X | ДОПИС В X | 9 → 9 | «в»: X is read «ікс» |
| SAVE PNG / TRY AGAIN | ЗБЕРЕГТИ / ПОВТОРИТИ | 8 → 8 / 9 → 9 | «Зберегти PNG» (12, 96 px) does not fit |
| DOWNLOAD IMAGE | ЗБЕРЕГТИ ЗНІМОК | 14 → 15 | Pass view |
| REPLAY | ПОВТОР | 6 → 6 | |

---

## 8. Sensitive content

**The product is about surveillance and privacy, and Ukraine is at war.** Ukrainian readers know satellite and drone
imagery from the news of strikes; many have been told not to film or post where strikes land. A camera word next to
the reader's town is read through that. The copy stays flat and factual.

**Banned vocabulary, with what to use instead:**

| Banned | Why | Use |
|---|---|---|
| стежити, стеження, коригувальник, навідник, наводка | spotting targets | дивитися |
| наводити, навести, наведення | guiding a missile or artillery onto a place («наведення ракет»); «навести сюди» also lacks an object | дивитися, спрямовувати; field of regard «зона огляду» |
| накрити, накрив, накрило | hit with fire («накрило ракетою») | потрапити в смугу огляду; clouds «закрили точку» |
| зафіксовано (for "acquired") | «зафіксовано влучання» is the wording of strike reports, and the globe shows it under a crosshair in signal orange | «Знімок» (a noun) |
| захоплено, захоплення | also "seized", as territory is | знімок; «смуга огляду» |
| приціл, ціль, удар | weapons | мітка, місце / точка |

«Мітка» stays for the pin (map apps use it) but never stands next to наведення, ціль or удар.

- Nothing invites readers to look for military positions, air defence, energy sites or the results of strikes. The uk
  curated and Surprise lists never point at Ukrainian military or energy sites, or at sites struck since 24 February
  2022 whose damage is the reason to look. Ukraine's martial-law rules restrict publishing the location of forces and
  the consequences of strikes; the copy never brushes against them.
- **The one explicit exception: `chernobyl`.** It stays in the Surprise pool because the place is the world-famous
  1986 site, decommissioned since 2000, imaged by every public archive, and it carries no live military information (the
  drone strike on its shelter on 14 February 2025 is not what a 10 m pixel shows). Its label says what the pin is:
  «Чорнобильська АЕС», «Київська область, Україна».
- Never claim the images identify people: «Тебе на знімку не видно» is the product's own line.

**War zones in the time-lapse** (Gaza Strip, West Bank, Ukraine, Lebanon):

- Names: «Сектор Гази», «Західний берег річки Йордан» (then «Західний берег»), «Україна», «Ліван».
- Ukraine: if copy names the war, it is **«війна»** and the agent is named: «повномасштабна війна Росії проти України»,
  «російське вторгнення», «з 24 лютого 2022 року». Never «конфлікт в Україні», «українська криза», «події в Україні»,
  «спецоперація». Occupied areas, when they must be named: «тимчасово окуповані території».
- Gaza, the West Bank and Lebanon: «війна», no evaluative adjectives, no casualty figures, no labels for either side.
  The season line stays a season: «по одному щоосені».
- **Crimea is Ukraine.** No uk string or data label may present Crimea or any occupied area as Russia. The offline list
  files Crimea under UA (Simferopol, Yalta, Kerch, Sevastopol checked). A pin in Simferopol and a search for
  «Севастополь» through every path (offline list, Open-Meteo, Photon, Nominatim) must show «Україна»; a geocoder that
  answers RU there is overridden from the peninsula's outline (a small local polygon, not a box, so the Taman peninsula
  across the strait stays Russia).

**Place-name politics:**

- Ukrainian places in their Ukrainian forms: Київ, Одеса, Харків, Львів, Миколаїв, Запоріжжя, Дніпро (not
  Dnipropetrovsk), Кропивницький, Бахмут, Чорнобиль, Прип’ять. Never Kiev, Odessa, Kharkov, Lvov, Nikolaev, Chernobyl,
  Pripyat in uk. The §4.3 table does this for the offline list.
- «в Україні», never «на Україні».
- Neighbours: Білорусь, Молдова, Кишинів.
- Country names come from `Intl.DisplayNames('uk')` as CLDR gives them («Тайвань», «Косово», «Палестинські
  території», «Західна Сахара», «Гонконг, ОАР Китаю»); add no qualifiers in either direction.
- Curated places use established Ukrainian names (§4.4). Gazetteer results outside the §4.3 table are shown as they
  come.
- **Russian satellites** (Elektro-L, any Russian imaging satellite in a "could" row) are described as flatly as any
  other: «Російський геостаціонарний метеосупутник». No evaluative adjectives; the name stays as the catalog gives it.
- Privacy: the analytics backstop (`src/lib/telemetry.ts` street patterns) also knows Ukrainian street words: вулиця /
  вул., проспект / просп., провулок / пров., бульвар / бульв., площа / пл., узвіз, набережна, шосе.

**Glaciers:** factual and calm: «кінець сезону танення», «льодовик». No «вмирає», «катастрофа», «тане на очах».

**No Russian.** uk never falls back to Russian, and Russian forms are never "close enough" (the app sends a Russian
browser to English, not Ukrainian).

---

## 9. Pitfalls and the reviewer's checklist

### 9.1 False friends, calques and ambiguous words

| Wrong | Why | Use |
|---|---|---|
| актуальний, фактичний (for "actual") | «актуальний» means topical | справжній |
| сцена (for "scene") | a stage | кадр |
| пляма (for "spot") | a stain | точка |
| резолюція (for "resolution") | a resolution of a meeting | роздільна здатність; labels: піксель |
| публічний архів | calque | відкритий архів |
| найближчий проліт / найближчий погляд / найближчі | read "the next, upcoming" | найбільше зближення (label «Зближення»); кадр зблизька; sort «за відстанню» |
| погляд (for "look") | a gaze, an opinion («на мій погляд») | кадр |
| пролетів (alone, as a label) | slang for "failed" | a full sentence with «супутник» |
| висота (for an angle) | that is altitude | висота над горизонтом |
| обрій | not the product's term | горизонт |
| завантажити (for "download image") | also "upload", "load" | зберегти |
| скачати, лінк, тапнути, клікнути, куки, додаток | slang, anglicisms, Russian-style | зберегти, посилання, торкнутися, клацнути, файли cookie, застосунок |
| вид (for "view") | "species, type" | вигляд, перегляд («3D-вигляд») |
| вніс (у мозаїку) | bureaucratic | додав до |
| рівна точка (for "steady") | «рівна» means flat | точка, що не блимає |
| слідкувати, являтися, даний, на протязі, співпадати, відмінити, настройки, получати, приймати участь | Russianisms | стежити (not the product verb anyway), є, цей, протягом, збігатися, скасувати, налаштування, отримувати, брати участь |
| вірний (for "correct") | "faithful" | правильний |
| по причині, в залежності від | calques | через, залежно від |
| на цьому тижні | calque | цього тижня |
| кращий (for "best") | "better" | найкращий |
| фото (for every image) | radar and mosaics are not photos | знімок |
| Сонце (everyday light) | capital only for the body in astronomy | сонце |

**Words that look simple and are not:**
- "watched": the headline counts every pass; «дивилися» says only that they looked this way. «Побачено» is kept for
  passes with a real image. Do not swap the two.
- "pass": «проліт» also means a flight of stairs or a bridge span; never alone in a label without a number or
  «супутник».
- "you": the reader's gender is unknown (§1.4); so are the satellite's and the place's (§5).

### 9.2 Reviewer's checklist (run it on every string)

1. **Address:** ти in sentences, never ви; buttons infinitives; no past tense or short adjective with ти as subject.
2. **[PLACE]** only as a title before a full stop, after a colon, or alone; no preposition before it; never an object
   or the subject of a past tense. Read it with «Одеса», «Україна», «Карпати», «Їжакевичі».
3. **[SAT]** has «супутник» (a station too: no message gets a category) beside it wherever anything agrees; «він /
   його» only after that; a nameless satellite is «невідомий супутник».
4. **Counts** go through `one / few / many / other`; the verb sits inside the plural message; a governed count takes
   its case (§5.3); check 1, 2, 5, 11, 21, 22, 25, 111, 421.
5. **Vocabulary** matches the glossary: дивитися, Побачено, Могли дивитися сюди, проліт, знімок / фото / кадр,
   оприлюднено, смуга огляду, зона огляду, таймлапс, точка, мітка, застосунок.
6. **Euphony:** у/в, і/й, з/із/зі by §6.2; «та» next to a slot.
7. **Numbers:** decimal comma, NBSP grouping and units (as ` ` in source), «25%» and «98,6°» tight; coordinates
   and compass points in readouts untouched.
8. **Punctuation:** «ялинки», ’ (U+02BC), …, em dash only where grammar needs it, no exclamation marks.
9. **Dates and times:** genitive months from Intl; no weekday after a preposition; «о / об» by the hour; «за місцевим
   часом»; numeric relative times; no «р.» in stamps.
10. **Length:** within §7's budgets; mono labels counted in characters.
11. **Register:** no Russianisms, calques, bureaucratese, marketing words or emoji.
12. **Honesty:** the label says exactly what is on screen («знімок» vs «фото», «оприлюднено» only for what is public,
    «піксель» not «роздільна здатність», «Чорнобильська АЕС» for the plant).
13. **Sensitive:** none of §8's banned words; war wording; Ukrainian place names; Crimea in Ukraine.
14. **Case:** sentence case; months and weekdays lowercase; Земля capitalised as the planet; «Сонце» only in astronomy.
15. **Read it aloud.** If it sounds translated, rewrite it from the meaning.

### 9.3 Test values

- Places: «Київ», «Їжакевичі» (Ї under 0.92 leading and the line mask), «Йосипівка», «Одеса», «Карпати», «Дніпро»,
  «Waterloo», «Palm Jumeirah», «50.45, 30.52», a 48-character label with «…».
- Satellites: «ISS (ZARYA)» (crewed), «NORAD 60989», a nameless satellite, «SuperView Neo-1 01» (length), a two-name
  radar list and «A, B та ще 7».
- Counts: 0, 1, 2, 4, 5, 11, 12, 14, 21, 22, 25, 101, 111, 401, 421, 1 715.
- Searches typed in Cyrillic: «Київ», «Ки» (prefix), «Харків», «Запоріжжя», «Хмельницький», «Ужгород», «Сімферополь»,
  «Севастополь» (must answer from the offline list, with Ukrainian names and «Україна»).

---

## Appendix A: reference translations of the core strings

Landing

| English | uk |
|---|---|
| Something / watched you / this week. | Цього тижня / щось дивилося / на *тебе*. |
| Enter any place on Earth. See every satellite… | Введи будь-яке місце на Землі. Побачиш усі супутники, що пролітали над ним за останні 7 днів, і справжні знімки, які вони зробили. |
| LAST 7 DAYS · 12 → 19 NOV 2026 UTC | Останні 7 днів · 12 → 19 лист. 2026 UTC |
| 01 / PLACE · Search a place | 01 / Місце · Пошук місця |
| Name, address or lat, lon | Назва, адреса, координати |
| Searching · No match · Search unavailable | Пошук · Немає збігів · Пошук недоступний |
| 1 match / 3 matches / 5 matches | 1 збіг / 3 збіги / 5 збігів |
| Nothing matches "q". Try a city, a landmark, or coordinates. | Нічого не знайдено за запитом «q». Спробуй місто, пам’ятку або координати. |
| 02 / OR TRY · Or click the globe to drop a pin | 02 / Або спробуй · Або постав мітку на глобусі |
| Use my location · Locate me · Near me · Locating… | Моє місцезнаходження · Де я · Поруч · Шукаємо… |
| Requesting position · Naming the place | Запит місцезнаходження · Визначення назви |
| Your position goes to the Photon geocoder to name the place. We store only a ~10 km cell. | Твоє місцезнаходження надсилаємо геокодеру Photon, щоб визначити назву місця. Ми зберігаємо лише клітинку сітки ~10 км. |
| Your position isn't available right now. Search for a place instead. | Зараз не вдається визначити твоє місцезнаходження. Пошукай місце за назвою. |
| The place search isn't answering. Coordinates such as 43.47, −80.54 still work. | Пошук місць не відповідає. Координати на кшталт 43.47, −80.54 працюють і далі. |
| Surprise me · Drop a pin · Cancel | Навмання · Поставити мітку · Скасувати |
| Surprise me: a famous place picked at random (aria) | Навмання: відоме місце, вибране випадково |
| Pin dropped: Waterloo. Press Enter or an arrow to see what passed over it. | Мітку поставлено: Waterloo. Натисни Enter або стрілку, щоб побачити, що пролітало тут. |
| Built by @armaangupt0 | Автор — @armaangupt0 |
| Open source / Open source: the code on GitHub (laptops only) | Відкритий код / Відкритий код: проєкт на GitHub |
| Loading Watched · Slow connection, still loading | Завантаження Watched · Повільне з’єднання, ще завантажуємо |
| Watched · Something watched you this week (tab) | Watched · Цього тижня щось дивилося на тебе |
| 3D view unavailable · WebGL 2 is off in this browser | 3D-вигляд недоступний · У цьому браузері вимкнено WebGL 2 |
| Could not load the orbit catalog. Check your connection and try again. | Не вдалося завантажити каталог орбіт. Перевір з’єднання й спробуй ще раз. |

Results

| English | uk |
|---|---|
| Computing · Orbital catalog → Catalog loaded | Обчислення · Каталог орбіт → Каталог завантажено |
| Propagate orbits · 7 days → Orbits propagated | Розрахунок орбіт · 7 днів → Орбіти розраховано |
| Sentinel-2 + Landsat archives → Archives searched | Архіви Sentinel-2 + Landsat → Архіви переглянуто |
| Match scenes to passes → Scenes matched | Зіставлення кадрів із прольотами → Кадри зіставлено |
| Verifying weather mosaics | Перевірка добових мозаїк |
| New search · Change · Recent · All passes | Новий пошук · Змінити · Нещодавні · Усі прольоти |
| The sun never rose, so no daylight camera could see it. | Тут сонце так і не зійшло, тож жодна денна камера не могла побачити це місце. |
| The sun barely rose, so no daylight camera could see it. | Сонце ледь піднялося над горизонтом, тож жодна денна камера не могла побачити це місце. |
| Weather satellites still swept it in infrared, 42 times. | Метеосупутники однаково сканували це місце в інфрачервоному діапазоні: 42 рази. |
| Sentinel-2 or Landsat crossed it 3 times in daylight, but no scene has been published yet. | Sentinel-2 або Landsat пролітали тут удень 3 рази, але жодного кадру ще не оприлюднено. |
| No open imaging satellite crossed it in daylight. | Удень тут не пролітав жоден супутник, що оприлюднює свої знімки. |
| 12 detailed images (Sentinel-2, Landsat, 10–30 m) · 3 daily weather mosaics (250–375 m) · 2 radar images (Sentinel-1, 20 m) · 1,008 full-disc images from geostationary weather satellites (2–5 km; the newest of each is shown). 1,204 passes from 412 imaging and crewed satellites checked. | 12 детальних знімків (Sentinel-2, Landsat, 10–30 м) · 3 добові мозаїки (250–375 м) · 2 радарні знімки (Sentinel-1, 20 м) · 1 008 знімків повного диска з геостаціонарних метеосупутників (2–5 км; показано найновіший знімок кожного). Перевірено 1 204 прольоти 412 знімальних і пілотованих супутників. |
| Photos · All · Detailed · Weather · Radar | Знімки · Усі · Детальні · Погода · Радар |
| Closest look · Last clear look · Clouded over · Daily mosaic | Кадр зблизька · Останній ясний кадр · Під хмарами · Добова мозаїка |
| This week's passes saw mostly cloud · Here's the last clear look | Цього тижня на знімках переважно хмари · Ось останній ясний кадр |
| 12 this week / 12 that week | 12 за 7 днів |
| Clear · Thin cirrus · Cloud shadow · Cloud at spot · Clouded · 93% · Cloud 25% | Ясно · Перисті хмари · Тінь від хмар · Хмари в точці · Хмарно · 93% · Хмари 25% |
| Clear at your spot (lightbox) | Ясно в точці |
| Reading the pixel at your spot… · Clear over your spot. · Your spot was in cloud shadow. | Читаємо піксель у твоїй точці… · Над твоєю точкою ясно. · Твоя точка була в тіні від хмар. |
| Thin cirrus flagged over your spot; it may soften the picture. | Над твоєю точкою позначено тонкі перисті хмари. Знімок може бути м’якшим. |
| Sentinel-2C image of Waterloo. The place is at the centre. (alt) | Знімок із супутника Sentinel-2C: Waterloo. Це місце в центрі кадру. |
| Photo 1 of 27, closest look (spoken) | Знімок 1 з 27, кадр зблизька |
| Time-lapse · This place, year by year | Таймлапс · Це місце рік за роком |
| Replay this pass · View · Share | Повтор прольоту · Відкрити · Поділитися |
| Show all 31 passes · Show all 31 satellites · Show 40 more · Show fewer · 12 left | Показати всі прольоти (31) · Показати всі супутники (31) · Показати ще 40 · Згорнути · ще 12 |
| 31 passes · 12 sats (group header) | 31 проліт · 12 супутників |
| Shared with you · Sentinel-2C watched Waterloo | З тобою поділилися · *Waterloo*. Сюди дивився супутник Sentinel-2C. |
| Something watched you this week too. (invite) | Цього тижня щось дивилося й на тебе. |
| No public image · Poor quality · No image just now | Оприлюдненого знімка немає · Погана якість · Зараз знімка немає |
| No operational geostationary weather imager sees this place above 5° elevation. | Жоден робочий геостаціонарний метеосупутник не бачить це місце вище 5° над горизонтом. |

Pass detail readouts

| English | uk |
|---|---|
| Altitude · Off-nadir · Pixel · Cloud (scene) · Cloud at spot | Висота · Від надиру · Піксель · Хмарність (кадр) · Хмари в точці |
| Clear · Cirrus · Cloud · Shadow | Ясно · Перисті · Хмари · Тінь |
| Closest · UTC / Closest · local | Зближення · UTC / Зближення · місцевий час |
| Ground distance · Elevation from you · Ground speed · Heading | Відстань до траси · Над твоїм горизонтом · Шляхова швидкість · Курс |
| SSW · Asc / Desc · up · SSW | SSW · висх. / низх. · SSW |
| Sun elevation (Day / Twilight / Night) | Висота Сонця (день / сутінки / ніч) |
| Field of regard · Swath · In swath · In view · Window | Зона огляду · Смуга огляду · У смузі огляду · У полі зору · Вікно |
| Band: Infrared / Visible / Colour | Діапазон: тепловий / видимий / колір |
| Scan line here · Above the equator at · In your sky · Scan direction (North → south) | Лінія сканування тут · Над екватором · У твоєму небі · Напрям сканування (північ → південь) |
| Line speed here · Coverage: Full disc, every 10 min · This scan | Швидкість лінії тут · Охоплення: повний диск, кожні 10 хв · Це сканування |
| NORAD · pass / NORAD · scan | NORAD · проліт / NORAD · сканування |
| Geometry · Replay (section rules) | Геометрія · Повтор |
| Download image · Downloading… · Open image to save it · View source | Зберегти знімок · Збереження… · Відкрити знімок, щоб зберегти · Джерело |
| No public image: commercial archives are private. Plan view of the pass. | Оприлюдненого знімка немає: комерційні архіви закриті. Схема прольоту. |
| Crewed stations carry cameras, but their photos are not published by place and time. | Пілотовані станції мають камери, але їхні фото не публікують із прив’язкою до місця й часу. |

Share sheet

| English | uk |
|---|---|
| Share this pass · Share this image · Share this week | Поділитися прольотом · Поділитися знімком · Поділитися тижнем |
| Close · Close (Esc) | Закрити · Закрити (Esc) |
| Share image · Preparing image… · Share | Поділитися карткою · Підготовка картки… · Поділитися |
| Copy link · Copied · Post to X · Copy image · Save PNG · Try again | Копіювати · Скопійовано · Допис в X · Копіювати картку · Зберегти · Повторити |
| Link · Post (field labels) | URL · Допис |
| Direct link: the short link could not be made right now | Пряме посилання: коротке зараз не вдалося створити |
| Creating link… · Made when you share | Створення посилання… · З’явиться, коли поділишся |
| The card could not be rendered here; the link still works. | Тут не вдалося створити картку, але посилання працює. |

Time-lapse

| English | uk |
|---|---|
| Time-lapse of Waterloo (aria) | Таймлапс: Waterloo |
| One clear look a year · since 2015 | Один ясний кадр на рік · з 2015 року |
| 12 clear looks · one a year / one each autumn | 12 ясних кадрів · по одному на рік / по одному щоосені (щозими, щовесни, щоліта) |
| Listing the archive · Choosing clear looks · Developing frames | Перегляд архіву · Вибір ясних кадрів · Проявлення кадрів |
| Too cloudy here for a time-lapse. · 2 clear looks since 2015 · 3 needed | Тут забагато хмар для таймлапсу. · 2 ясні кадри з 2015 року · потрібно 3 |
| No clear look since 2015 · 1 clear look | Жодного ясного кадру з 2015 року · 1 ясний кадр |
| The archive did not answer. · Planetary Computer could not be reached | Архів не відповів. · Не вдалося з’єднатися з Planetary Computer |
| No time-lapse for this place | Для цього місця таймлапсу немає |
| Each frame is the same 10 km square, taken by Sentinel-2 and toned like every photo here. Each year aims for a different season; a year with no clear look is left out. | Кожен кадр — той самий квадрат 10 × 10 км, знятий супутником Sentinel-2 та тонований, як і всі фото тут. Кожен рік припадає на інший сезон. Рік без ясного кадру пропущено. |
| Frame 3 of 12: … · Play · Pause | Кадр 3 з 12: … · Відтворити · Пауза |
| Video · Video failed · Save video · Rendering 42% · Link copied | Відео · Помилка відео · Зберегти відео · Створення 42% · Посилання скопійовано |
| This browser has no H.264 encoder: the file plays in Chrome and Firefox | У цьому браузері немає кодера H.264: файл відтворюється в Chrome і Firefox |
| Waterloo, year by year (share title) | Waterloo: рік за роком |
| File name slug | from the canonical (English) label: watched-kyiv-2015-2026.mp4; `fileNamePlace` stays «place» (Latin) |

---

## Appendix B: engineering notes (cost and speed)

Ukrainian adds no running cost and keeps the product fast. Every item is static copy, a small table in the uk chunk,
or a font file served from the site's own origin. Nothing is translated at runtime, no new service is called, nothing
new is stored, and an English visitor downloads exactly what they did before.

1. **Cyrillic search answered offline (saves the free geocoder quota and a network round trip).** Today
   `searchLocal` returns `[]` for any query without a Latin key (`shardOf` is undefined), so every «Київ» typed on a
   Ukrainian keyboard goes to Open-Meteo (free tier ≈ 10,000 requests a day, shared by every visitor) and then Photon,
   where CLAUDE.md budgets ~2% of searches. Fix, uk chunk only: transliterate the query (only the query) by the
   official national table (КМУ 2010) before `placeKey`: а a, б b, в v, г h, ґ g, д d, е e, є ye/ie, ж zh, з z, и y,
   і i, ї yi/i, й y/i, к k, л l, м m, н n, о o, п p, р r, с s, т t, у u, ф f, х kh, ц ts, ч ch, ш sh, щ shch, ь and
   apostrophes dropped (’ U+02BC is a letter to `placeKey`, so strip it first), ю yu/iu, я ya/ia (the first form at the
   start of a word), зг → zgh; best-effort ы y, э e, ё yo, ъ dropped. It yields the GeoNames names in the offline files:
   Київ → kyiv, Харків → kharkiv, Одеса → odesa, Запоріжжя → zaporizhzhia, Хмельницький → khmelnytskyi, Ужгород →
   uzhhorod; «Ки» → ky for prefix typing. About 0.3 kB. Foreign places typed in Cyrillic (Варшава, Париж) still go to
   the network as today; an exonym alias table is added only if the admin page's search-source breakdown shows uk
   searches still reaching the network often after this ships.
2. **Ukrainian names for Ukraine's places**: the §4.3 display table (27 first-level names + ≈ 350 settlements, ≈ 3 kB
   gzipped) applied to the offline list's labels and sublabels for a uk reader; `canonicalLabel` keeps the English for
   stats, `record_lookup` and shares. The uk card and share page apply the same table to a stored English label (it is
   imported by `api/_lib/i18n/card/uk.ts`; no request).
3. **Fonts** (§6.10): ≈ 34 kB (sans) + ≤ 25 kB (accent instance) + 17.2 kB (mono, already declared) ≈ 76 kB, once, for
   uk visitors only (unicode-range), preloaded by boot in parallel with the app, cached as immutable. Static files on
   the existing CDN: no new bill.
4. **Share cards**: bundled Cyrillic TTF subsets (≈ 15–30 kB each, ≈ 100 kB in the server bundle; check the Worker's
   size with `wrangler deploy --dry-run`). This removes today's two Google Fonts requests and their 4 s timeout from
   every uncached render of a card with Cyrillic on it, in any language: faster cards and fewer outbound calls.
5. **Coordinate parser**: accept a decimal comma when the two numbers are separated by a space or a semicolon
   («50,45 30,52», «50,45; 30,52»); the ambiguous «50,45, 30,52» stays a search.
6. **Crimea**: the country override of §8 is a local outline test, no request. Applying it in every language (as the
   offline list already does) is the owner's call; for uk it is required.
7. **Layout checks (QA, no cost):** the landing hero at 320 px, 1280 × 800 and an 800 px landscape tablet; the default
   uk card's widest hero line ≤ 445 px; the phone share row at 360 px; the lane labels; the HUD corner pair at 375 px;
   «Їжакевичі» under the line mask; `?hl=uk` on every screen.
8. `<html lang="uk">` is set by boot, so screen readers use a Ukrainian voice and CSS uppercases Cyrillic correctly.

---

## Decisions log

The critique's 36 items: 29 accepted, 7 partly accepted, 0 rejected.

| # | Item | Resolution |
|---|---|---|
| 1 | Blocker: «навести / наведення» is strike wording | Accepted: could = «Могли дивитися сюди», frame «Сюди міг дивитися супутник [SAT].», «Зона огляду», About «спрямовують»; наводити / навести / наведення / навідник / наводка banned (§3.6, §4.1, §8). |
| 2 | Blocker: Cyrillic searches skip the offline list | Accepted: КМУ 2010 query transliteration in the uk chunk, ’ stripped first; Ukrainian display table for UA places; Cost row rewritten. Foreign Cyrillic exonyms measured before any alias table (§0, §4.3, Appendix B.1–2). |
| 3 | Blocker: no Cyrillic typefaces chosen | Partly accepted: Noto Sans (wdth) and Noto Serif Display Italic chosen from the measured type study, preload and `FIRST_FONTS` added; the accent budget is ≤ 25 kB (a static instance), not 15 kB, because a true Cyrillic italic subset for any place name needs the whole basic block (§6.10). |
| 4 | Share cards: wrong face, overflow, font fetches | Accepted: bundled Cyrillic TTF instances, no Google Fonts request; and the card hero is set in four lines, measured at 480 px against 466 (§3.1, §6.10). |
| 5 | «накрив / накрила» means hit with fire | Accepted: «потрапило в смугу огляду»; clouds «закрили точку»; «накрити» banned (§3.6, §3.7, §8). |
| 6 | «Зафіксовано» sounds like a strike report; globe verbs missing | Accepted: nouns «Знімок …», «Зближення · [SAT]», «Рядок», «Зчитування» (§3.8, §8). |
| 7 | «Найближчий / ясний погляд» ambiguous | Accepted: «кадр зблизька», «ясний кадр», «останній ясний кадр» throughout (§4.1, Appendix A). |
| 8 | `aSatellite` yields «супутник Супутник» | Partly accepted: sentences say «невідомий супутник» (the code already passes `sat` undefined, never the label); the lone chip / callout is «Супутник», not «Невідомий супутник», to keep chips one line (§3.7, §5.2). |
| 9 | Coordinate and compass rules contradict the code | Accepted: coordinates and readout compass points stay international as they arrive; `heading` «SSW · висх.», `upCompass` the point alone; prose keeps Ukrainian words; the geostationary seat goes in parentheses «(0.2°W)» (§3.5, §4.2). |
| 10 | None headline too long for the card | Accepted: «…не дивився жоден відомий нам супутник.» everywhere (§3.3). |
| 11 | Share-sheet labels overflow | Partly accepted, measured (8 px a character, ≈ 90 px a third at 360 px): «Копіювати URL» (104 px) and «Зберегти PNG» (96 px) do not fit, so «Копіювати» and «Зберегти», plus «Повторити» for Try again; «URL», «Допис», «Допис в X», «Копіювати картку», «Поділитися карткою», «Скопійовано» as proposed (§7, Appendix A). |
| 12 | Other fixed-width strings over budget | Accepted: «Тепловий / Видимий / Колір», gallery and lightbox statuses, «12 за 7 днів», hints, «Немає збігів», card footer, «7 днів до 1 лист. 2026» (§7). |
| 13 | No rule for counts in oblique cases | Accepted: oblique-case table and the fixed footnote; the engine row joins with «та», not «і», before a number (§5.3). |
| 14 | Euphony rule missing and broken | Accepted, made precise: after a pause «у/і» only before a consonant, «в» before a vowel; «з’єднання й спробуй» shipped; «та» beside slots (§5.6, §6.2). |
| 15 | "Cyrillic face first" contradicts the design system | Accepted: brand faces first, Cyrillic after them (§6.10). |
| 16 | Chornobyl breaks the guide's rule; label dishonest | Accepted, exception chosen: stays in the pool as the one stated exception, labelled «Чорнобильська АЕС», «Київська область, Україна» (§4.4, §8). |
| 17 | «він» points back to a plural | Accepted: «тож цей супутник бачив твої хмари» (§2.4, §3.5). |
| 18 | «Сонце» capitalisation; горизонт / обрій | Accepted: lowercase in the everyday sense, «горизонт» only (§4.1, §6.7, Appendix A). |
| 19 | Progress-state rule inconsistent | Accepted: verbal nouns for mono status labels, ми-present for narration, locate chip «Шукаємо…» (§1.3). |
| 20 | Share hook out of step with the hero | Accepted: «Цього тижня щось дивилося й на тебе.» for the hook and the invite (§3.1, §3.7). |
| 21 | Card and share-page frames missing | Partly accepted: all frames written, with fixes to the proposals: «об 11:21» (hour 11), `withinView` rebuilt with the satellite as subject so «рухаючись» has the right subject, `bestFrom` with «зробив» instead of a dash, `inSwath` on the likely wording, alt «Знімок із супутника» (§3.7). |
| 22 | English count helpers and abbreviations | Partly accepted: «проліт» and «супутник» pluralised in uk, «ще 12», replay short / long; but `showAll*` put the count in parentheses («Показати всі супутники (31)») to avoid «усі 31 супутник» agreement (§5.3). |
| 23 | NBSP instruction misleads | Accepted: the translator writes the NBSP before a noun, as ` ` (§3.3, §6.3). |
| 24 | Wording | Accepted, all eight: «додав … до», «точкою, що не блимає», «Оператор не повідомляє», «Пошукай місце за назвою», «Це в реальному часі?», present tense on About, «Архіви не відповіли», «Цього тижня знімків не оприлюднено» (§3, Appendix A). |
| 25 | «станція [SAT]» for crewed stations | Partly accepted, then corrected against the English: no message (app, post, card or page) receives `meta.category`, so `[SAT]` keeps «супутник» for a station everywhere; «станція» only where the English words a station (`darkStation`) (§3.5, §5.2). |
| 26 | ти decision lacks trade-off and inventory | Accepted (§1.2, §1.4). |
| 27 | Length estimate optimistic | Accepted: +30% prose, up to ×2 labels (§7). |
| 28 | File names need Latin | Partly accepted: slugs come from the canonical English label (watched-kyiv-…), transliteration only for a label with no Latin form, `fileNamePlace` «place» (Appendix A). |
| 29 | Crimea and oblast names | Accepted: the test, the outline override (required for uk; every language is the owner's call), official oblast names kept (§4.3, §8). |
| 30 | Privacy and credits wording | Accepted: privacy translated exactly, «файли cookie», «© учасники OpenStreetMap (ODbL)» (§3.9, §4.1). |
| 31 | Two inaccuracies in the reasoning | Accepted: the hero is already `Rich[]` (implementation note dropped); the messenger analogy for «Побачено» dropped (§3.1, §3.6). |
| 32 | The video draws Cyrillic on a canvas | Accepted; already true in code: `video.ts` loads the mono face with the words it draws (§6.10). |
| 33 | Missing glossary entries | Accepted: застосунок, Збій, Пробуємо…, Назад, Застарілий, Рядок, Очікування…, Отримано, елементи / набори елементів, розрахувати, схема прольоту, Мозаїка (§3.8, §4.1). |
| 34 | Test list for slot frames | Accepted (§9.3). |
| 35 | Cyrillic leading under the line mask | Accepted (§6.9). |
| 36 | Tone for Russian satellites | Accepted (§8). |

**Other corrections to the draft, from measuring and checking the code** (not raised by the critique):

- The landing hero was measured in the chosen faces and fits (509 px of 580); only the card needs four lines.
- Mono budgets are exact: Martian Mono's Cyrillic has the same advance as its Latin (8.0 px at 11 px, 7.0 px at
  9.5 px).
- «дн.» keeps its period (an abbreviation, as Intl prints it); «с», «хв», «год» are symbols without one.
- Intl's `{ day, month: 'short', year }` adds «р.»; stamps are built from parts without it.
- `cloud.spot.post` «Хмари накрили точку» → «Точку закрили хмари» (the banned verb); the time-lapse note uses «та» after
  «Sentinel-2» and splits its semicolon into two sentences.
- The 57 curated places are given in full (§4.4); «Центральний парк» fits the chip row (measured), and «Міст Золоті
  Ворота» avoids Kyiv's gate.
- Prose off-nadir says «від вертикалі» everywhere; the label alone says «від надиру».
- A participle always takes the sentence's subject (§2.2): the rule that caught `withinView`.
