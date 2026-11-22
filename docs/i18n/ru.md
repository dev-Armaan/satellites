# Watched: Russian (ru) localisation style guide

Written 2026-11-21 and revised the same day after two independent native reviews (see Review). Binding for every
`ru` string the product shows, speaks or sends: the landing, results, pass detail, gallery and photo viewer, the
time-lapse, the share sheet, share cards, share pages and post text, the HUD and globe, About, errors, the loading
screen, alt text and aria labels. Written in English for the team; every example is the Russian a translator ships.
Scope: one variety for every reader (Russia, Belarus, Kazakhstan, Central Asia, the Baltic states, Israel, the
diaspora and Ukrainians who read Russian), current orthography (Правила 2006, the Grammar of the Russian Academy for
agreement), **ё written everywhere** (§6.1).

Sources of truth: `docs/DESIGN.md` §3 (type) and §7 (voice, verdict vocabulary), `docs/I18N.md`,
`docs/i18n/TRANSLATING.md`, the English namespaces in `src/i18n/en/`, `api/_lib/i18n/card/en.ts`,
`src/ui/results/lib/copy.ts`, `src/ui/results/lib/meta.ts`, `api/_lib/i18n/parts.ts` (a rich message may put its parts
in any order) and `api/_lib/i18n/format.ts` (`plural` takes `one | few | many | other` for ru, and a missing form is a
compile error). The closest model is the Ukrainian guide (`docs/i18n/uk.md`): Russian shares its two hard problems and
most of its solutions, and differs where the languages differ (agreement with numerals, euphony, «на/в Украине», the
war's vocabulary). When this guide and a ru string disagree, the guide wins and the string is fixed. When this guide
and the English disagree on a fact, the English wins: report it.

Notation: `[NUM]` a count (a mono span), `[PLACE]` a place label from the gazetteer, `[SAT]` a satellite name,
`[TIME]` a 24-hour clock with its zone (`16:14:21 UTC`, `11:21 EST`), `[DATE]` a date from Intl, `[ALT]` / `[DIST]` a
distance with its unit, `[DEG]` an angle, `[DIR]` a compass word. `*…*` marks the serif accent, `**…**` the bold
(`strong`) phrase. Examples show ordinary spaces for readability; where §6.3 says NBSP, the catalog string has U+00A0,
written as the `\u00a0` escape in source so a reviewer can see it.

**Russian has two problems English doesn't.** Most of this guide follows from them:

1. **Nothing inserted at runtime can be declined.** Russian puts nouns in six cases: *Москва* becomes *Москву*,
   *Москвы*, *над Москвой*, *в Москве*. A country from `Intl.DisplayNames('ru')` (*Соединенные Штаты*, *Нидерланды*,
   *Украина*) can be plural or adjectival, and a Latin name (*Waterloo*) has no Russian ending at all. So a `[PLACE]`
   slot goes only where the nominative is correct (§5.1).
2. **The past tense and short adjectives show gender.** *Пролетел* (m.), *пролетела* (f.), *пролетело* (n.),
   *пролетели* (pl.); *должен / должна*. Code knows neither a satellite's grammatical gender nor the reader's, so
   neither `[SAT]` nor "you" is ever the bare subject of a past tense or a short adjective (§1.4, §5.2).

A third, smaller one: **a numeral governs its noun and its verb** (21 → «смотрел 21 спутник», 22 → «смотрели 22
спутника», 25 → «смотрели 25 спутников»), so a count's message wraps the words that agree with it (§5.3).

---

## 0. Decisions at a glance

| Question | Decision |
|---|---|
| Address | **ты** in every sentence; never **вы** or **Вы**. The product speaks as **мы**. Buttons are **infinitives** («Поделиться», «Сохранить»), plus the two established UI nouns «Отмена» and «Назад». |
| The reader's gender | Unknown, so **never** a past tense or a short adjective with ты as its subject («ты искал», «ты должен» ✗). §1.4 lists every rewrite. |
| Product verb ("watched") | **смотреть**: «на тебя что-то смотрело», «сюда смотрели 256 спутников». Never следить, шпионить, наблюдать за, фотографировать (§8). |
| Hero | «На этой неделе / что-то смотрело / на *тебя*.» (the default share card sets it in five lines, §3.1). |
| Verdicts | **Увидено** · **Вероятно, увидено** · **Могли смотреть сюда** · **Над головой**; lanes СНИМОК · ВЕРОЯТНО · ВОЗМОЖНО · В НЕБЕ. |
| "pass" / "image" / "photo" | **пролёт**; **снимок** for any image (photo, mosaic, radar, full disc); **фото** only for a certain Sentinel-2 / Landsat photo; **кадр** for a scene, a frame and a "look" («самый близкий кадр», «ясный кадр»). |
| "made public" | **опубликован(о)**, agreeing with the count: «Опубликован 21 снимок.» «Опубликовано 27 снимков.» |
| "at least" | **как минимум** (governs no case, so removing it changes no other word). Never «не менее» (it puts the count in the genitive). |
| Weeks | «на этой неделе»; an older week «в ту неделю» / «за ту неделю» (never «на той неделе», which also means "last week" in speech); "last 7 days" «последние 7 дней», in prose «за последние 7 дней». |
| `[PLACE]` | Only where Russian puts the **nominative**: first, as a title («*Waterloo*. За последние 7 дней…»), after a colon, in parentheses or alone. Referred back to as **сюда / здесь / это место**. Never after a preposition, never an object, never the subject of a past tense. |
| `[SAT]` | Always with the head noun **спутник** wherever anything agrees with it (a crewed station too: no message gets a category). A nameless satellite is «неизвестный спутник» in sentences, «Спутник» as a lone chip. |
| Plurals | CLDR `one / few / many / other`. The plural message wraps the **verb or participle** too. Oblique cases have their own table (§5.3). |
| Numbers | `1 715` (NBSP, as Intl prints), `7,46`, `25%` and `98,6°` tight, NBSP before units: `786 км`. |
| Coordinates and compass | International notation, as they arrive: `43.47, −80.54`, `16.2°S 063.0°E`. Readouts keep the compass point as it arrives (`SSW`); prose uses Russian words (§4.2). |
| Clocks | 24-hour with a colon, as they arrive, after **в**: «в 16:14:21 UTC». About a minute: «около 07:49 CET». |
| Punctuation | «ёлочки», nested „лапки“; one-character ellipsis …; em dash — with spaces (NBSP before it), used where Russian grammar puts it (noun — noun), not as decoration, and never in About (§6.3); no exclamation marks. |
| ё | Written everywhere («пролёт», «ещё», «всё», «её», «тёмный»): «пролет» is also a flight of stairs, «все» and «всё» are different words. Intl's own strings are left as they come. |
| Euphony | «со» before «с», «з», «ш», «ж» + consonant and before «второго» (fixed words, and «Со 2 ноября», §5.6); «в», «с», «к», «о» everywhere else. |
| Place exonyms in static copy | Standard Russian names: Киев, Харьков, Одесса, Львов, Днепр, Чернобыль, Киевская область (§8). Gazetteer data is shown as it comes. |
| Crimea, the war | Crimea is shown as Ukraine (the data is corrected, owner); the war, if copy ever names it, is «война России против Украины»; never «СВО», «спецоперация», «конфликт на Украине» (§8). |
| Cost and speed | Catalog text, `Intl`, the shared Cyrillic fonts already shipped for Ukrainian. No new service, file or request (Appendix B). |

---

## 1. Register and address

### 1.1 The decision: ты everywhere, infinitives on buttons, мы for the product

The hero says "Something watched *you*": one person, singled out. **Ты** keeps that. **Вы** in Russian is both the
plural and the polite singular, so «на вас» reads either as "at all of you" or as an official notice («Уважаемые
клиенты…»), and the uncanny moment goes soft. The English voice is casual and short ("Can it see me? No. … You're not
in it."), close to the way a person talks, and that is ты in Russian. The Ukrainian edition (ти) and the Polish (ty)
make the same choice; a Russian reader who also reads those sees one product.

The product itself is **мы** («Мы не можем этого знать», «Мы передаём твоё местоположение геокодеру Photon…»).

### 1.2 What вы would have solved, and why ты still wins

Вы has one real advantage: its past tense is plural and has no gender («вы искали», «вы были в зоне досягаемости»), so
the gender trap of §1.4 would not exist. It also matches the default of Russian banks, ministries and most large
services, and some readers over forty find a website's ты presumptuous.

It loses anyway:

- The gender trap is avoidable in every English string the product has (§1.4 lists them all, with no loss).
- The product is not a service asking for anything. It tells one person one strange fact. With вы, «На этой неделе
  на вас что-то смотрело» sounds like a warning sign in a lift; with ты it sounds like someone leaning in.
- Buttons, labels and errors, the places where ты would feel familiar, do not address anyone (infinitives, nouns,
  impersonal facts: §1.3). Ты appears only in sentences that are about the reader.

Never mix: one ты string and one вы string on the same screen reads as two authors. Never «Вы» with a capital.

### 1.3 Surfaces

| Surface | Decision | Example | Rejected alternative, and why it lost |
|---|---|---|---|
| Display headlines | **ты** in the hero; the results headline is about the place (third person, no address) | «На этой неделе что-то смотрело на *тебя*.» · «*Waterloo*. За последние 7 дней сюда **смотрели 256 спутников**.» | «…на *вас*.»: plural or official; the poster stops pointing at one person |
| Sentences and prose | **ты** and **твой** where the reader is addressed; **мы** for the product | «Над твоей точкой ясно.» · «Мы передаём твоё местоположение геокодеру Photon, чтобы узнать название места.» | Impersonal prose throughout: loses the second person DESIGN §7 asks for |
| Buttons | **Infinitive**, the Russian UI norm; «Отмена», «Назад» as nouns | «Поделиться» · «Сохранить» · «Повторить» · «Отмена» | ты-imperatives («Сохрани») shout like an advert; вы-imperatives («Сохраните») are formal and longer |
| Mono caps labels | **Nouns** and noun phrases | «Высота» · «Последние 7 дней» · «02 / Пролёты» | Verbs in labels: a label is a name, not a request |
| Prompts that are not buttons | **ты**-imperative | «02 / Или попробуй» · «Или поставь метку на глобусе» | Infinitive: reads like a button that does nothing |
| Status labels (mono, short) | **Verbal nouns** | «Загрузка каталога» · «Поиск» · «Расчёт» · «Скачивание…» | «Загружаю…»: first person singular; who is "I"? |
| Lines that narrate the product's work | **мы**-present | «Читаем пиксель в твоей точке…» · «Медленное соединение, ещё загружаем» · locate chip «Ищем…» · «Пробуем…» | A verbal noun here («Определение…») does not say who is working |
| Error notices | Impersonal fact, then **ты** advice | «Не удалось загрузить каталог орбит. Проверь соединение и попробуй ещё раз.» | «Приносим извинения за неудобства»: filler, banned |
| About | **ты**, conversational, short answers | «Меня видно? Нет.» | вы: turns the page into terms and conditions |
| Share posts and card invitation | **ты** to the next reader | «На этой неделе что-то смотрело и на тебя.» | вы: breaks the echo of the hero |

### 1.4 The gender trap, and every "you + past tense" rewrite

Russian past tense and short adjectives agree in gender, so «ты искал», «ты был в зоне досягаемости», «ты должен быть в
полосе», «ты готов» are wrong for half the readers. Use the present or future («ищешь», «увидишь», «поделишься»),
make something else the subject («твоё место», «твоя точка»), or say it impersonally («нужно оказаться»). Never slash
forms («искал(а)»). The English strings that need it, with their shipped forms:

| English | Shipped |
|---|---|
| If you were in reach, we call it "could have pointed here" | Если твоё место было в зоне досягаемости, мы пишем «Могли смотреть сюда». |
| You have to be in the strip | Нужно оказаться в этой полосе. |
| Shared with you | С тобой поделились |
| Made when you share | Появится, когда поделишься |
| If you're on their side of Earth, you're in every frame | Если ты на обращённой к ним стороне Земли, ты в каждом кадре. («на их стороне» also means "on their side" in a conflict) |
| You're not in it | Тебя на снимке не видно. |
| Your spot was in cloud shadow | Твоя точка была в тени от облаков. |
| It was dark where you are | Там, где ты, было темно. |

A new English string with "you" as the subject of a past tense or a predicate adjective gets its rewrite added to this
table first.

---

## 2. Voice

### 2.1 How "declarative, specific, quietly uncanny, second person" sounds in Russian

- **Declarative** is the short simple sentence and the full stop. One fact a sentence; a second fact after a full stop,
  not after a semicolon (Russian prose uses the semicolon far less than English: the English "; " becomes ". ").
- **Specific** means the number and the unit carry the sentence: «на высоте 786 км», «7,46 км/с», «25%». No
  «примерно» unless the English says "about"; then «около» (or «~» where the English prints it).
- **Quietly uncanny** is understatement. Russian puts new and emphatic information **last**, so the unsettling word
  goes at the end: «На этой неделе что-то смотрело на *тебя*.» «Тебя на снимке не видно.» Never louder than the
  English: no «следили», no «шпионили», no «под наблюдением», no exclamation marks.
- **Second person** is carried by the verb ending; drop the pronoun when the verb shows the person («Введи…»,
  «Увидишь…»), keep it when it is the point («на тебя», «Там, где ты»).
- **Status forms in -но / -то** say what happened without saying who: «Увидено», «Скопировано», «Опубликовано»,
  «Пропущен». They need no subject, which also solves runtime slots (§5).

### 2.2 Rhythm and length

- Prose sentences: **20 words or fewer**, at most two commas and one participle phrase («двигаясь на юг»). A
  деепричастие always belongs to the sentence's subject: «Спутник … пролетел…, двигаясь на юг» is right; «Это место
  было в зоне видимости…, двигаясь на север» says the place moved.
- Keep the English order of *facts* (what crossed, when, where, how it moved → what that means → what we can't
  know), not of *words*: let Russian move time or place to the front when that is natural, and keep the punch at the
  end.
- Headlines: no subordinate clauses. Display lines break at phrase boundaries where the line allows (§3.1).
- Footnotes and readouts may be telegraphic: «Облачность кадра: 25%.»

### 2.3 What to avoid

- **Marketing tone:** «Откройте для себя», «невероятный», «уникальный», «революционный», «Добро пожаловать», «Узнайте
  больше», exclamation marks, emoji, rhetorical questions. Two questions are allowed because the English asks them:
  the share post's hook («Что пролетало над тобой на этой неделе?») and the last line of the share page's description
  («Что смотрело на тебя на этой неделе?»). The card's footer is no question in English ("See what watched you"): it is
  the indirect question as a label, «Что смотрело на тебя», with no question mark (§3.7).
- **Канцелярит (bureaucratese):** «осуществлять» («осуществил пролёт» ✗ → «пролетел»), «являться» (✗ → «это», or
  nothing), «данный» meaning "this" (✗ → «этот»), «в целях», «в случае», «в течение» only for time («в течение суток»
  ✓), «производить съёмку» (✗ → «снимать»), «на сегодняшний день», long genitive chains («расчёт времени пролёта
  спутника над точкой» ✗).
- **Calques of English structure:** «Это есть настоящий снимок» (✗ → «Это настоящий снимок»), a possessive on every
  noun («его свой»), passives with «был + -нный» where a -но form or an active verb is shorter («был опубликован» →
  «опубликован»), «сделать поиск» (✗ → «найти»), «на ежедневной основе» (✗ → «каждый день»).
- **Anglicisms the reader would not use here:** «шерить», «лайв», «таймлайн», «кликнуть», «тапнуть», «юзер»,
  «локация» (for a position: «местоположение»), «резолюция» (for resolution). «Таймлапс» is the exception: it is the
  ordinary Russian word for a time-lapse.
- **War and surveillance vocabulary:** §8. It is the first thing a reader hears in a sentence about a camera over
  their town.

### 2.4 Before and after

| English | Literal (wrong) | Shipped | Why |
|---|---|---|---|
| Something watched you this week. | Что-то наблюдало за вами на этой неделе. | На этой неделе что-то смотрело на *тебя*. | ты; the product verb, a gaze, not surveillance; "you" moves to the end, where Russian puts emphasis |
| It was daylight, so it almost certainly recorded this spot. No scene from this pass has been published yet; archives can lag by a day or more. | Было дневное время, поэтому он почти наверняка записал это пятно. Ни одна сцена с этого прохода ещё не была опубликована; архивы могут отставать на день или больше. | Был день, так что эта точка почти наверняка попала в кадр. Снимок с этого пролёта ещё не опубликован. Архивы могут запаздывать на сутки и больше. | «пятно» is a stain and «сцена» a stage; «проход» is a corridor; the point is the subject, so no satellite gender is needed; «сутки», not «день», for 24 hours |
| Its images feed weather forecasts; they are not published as pictures we can show. | Его изображения питают прогнозы погоды; они не являются опубликованными как картинки… | Его снимки используются в прогнозах погоды. В виде изображений, которые мы могли бы показать, их не публикуют. | No «являются»; «идут в прогнозы» is a spoken calque of "feed"; impersonal «не публикуют», the new fact last; «картинка» is too casual |
| (a typical marketing rewrite) | Узнайте, какие спутники следят за вами из космоса! | Введи любое место на Земле. Увидишь все спутники, пролетавшие над ним за последние 7 дней… | The English never sells; neither does the Russian |
| Can it see me? No. … You're not in it. | Может ли оно видеть меня? Нет. … Вы не в нём. | Меня видно? Нет. … Тебя на снимке не видно. | Short, spoken, ты |
| …weather satellites scan at night too, in infrared, so it saw your clouds… | …поэтому он видел твои облака… | Метеоспутники продолжают снимать и ночью, в инфракрасном диапазоне, так что этот спутник видел твои облака, а не улицы. | «он» after a plural has no antecedent |

---

## 3. The key lines

### 3.1 The hero

**Landing (three display lines, one accent):**

```
На этой неделе
что-то смотрело
на *тебя*.
```

The accent is **тебя** (serif italic, signal orange); «на» and the full stop stay in the display face. Line 2 starts
lowercase: it is one sentence. The ru value is
`[['На этой неделе'], ['что-то смотрело'], ['на ', accent('тебя'), '.']]`.

Measured in the page's faces (Noto Sans Cyrillic at the display's 67.5% width, −0.015em; 2026-11-21): at 1280 × 800
(91.2 px) «На этой неделе» 493 px and «что-то смотрело» 540 px in the 580 px column; at 1024 × 768 437 of 531; at
1366 × 768 519 of 623; portrait tablets 427 of 620; on phones 259 of 334 (390 px), 226 of 304 (360 px), 213 of 264
(320 px), 201 of 374 (844 × 390 landscape). Every line fits whole everywhere.

**Default share card (five lines):** at the card's 88 px in the bundled display face, «На этой неделе» measures
478 px and «что-то смотрело» 523 px against the 466 px column (English's widest line is 445 px), so neither phrase
fits on one card line. The card sets:

```
На этой
неделе
что-то
смотрело
на *тебя*.
```

`[['На этой'], ['неделе'], ['что-то'], ['смотрело'], ['на ', accent('тебя'), '.']]`: one word a line (237 / 229 / 205
/ 307 px), a slow drumbeat that ends on the accent. Five lines at 88 × 0.94 px are 414 px of the hero box's 471.

| Alternate | Why it loses |
|---|---|
| «Что-то / смотрело / на *тебя* / на этой неделе.» | Mirrors the English order, but ends on the time, so the emphasis lands on «на этой неделе», not on you; and «на этой неделе.» still does not fit a card line |
| «На этой неделе / за *тобой* / что-то наблюдало.» | «Наблюдать за» is surveillance where the English is quiet («наблюдение», «под наблюдением»); it also cannot take «сюда», so the results headline would need the place in a case (§3.3) |
| Card in four lines «На этой / неделе что-то / смотрело / на *тебя*.» (445 px) | Fits, but puts the end of one phrase and the start of the next on one line; the five-line form keeps every line one word |
| «Всю неделю / что-то / смотрело / на *тебя*.» | Fits the card in four lines, but says "all week long": the satellites passed at moments |

Why the shipped one wins: when → what → whom, with "you" in the last, strongest position; balanced lines; and
**смотреть** is literally what a camera pointed at the ground does.

Tab title: «Watched · На этой неделе что-то смотрело на тебя». The share post's hook and the results invitation repeat
the hero with one word: «На этой неделе что-то смотрело и на тебя.» Keep the three in step.

### 3.2 The sub line

**Shipped:** «Введи любое место на Земле. Увидишь все спутники, пролетавшие над ним за последние 7 дней, и настоящие
снимки, которые они сделали.» (`7` and «дней» tied with an NBSP; «дней» follows the plural of `days`: 1 день, 2 дня,
5 дней; «последний 21 день» with `one`.)

| Alternate | Why it loses |
|---|---|
| «…все спутники, которые пролетали над ним…, и настоящие снимки, которые они сделали.» | Two «которые» in one sentence; the participle is lighter |
| «Введи любое место на Земле — и увидишь каждый спутник, пролетевший над ним…» | «каждый … пролетевший» makes every satellite one event; the dash adds drama |
| «Выбери любое место на Земле. Здесь будут все спутники…» | «Здесь будут» describes a page, not a promise to the reader |

«настоящие» is "actual"; never «актуальные» (topical) or «фактические» (bookkeeping). «над ним» refers to «место»
(neuter). «Земле» with a capital: the planet.

### 3.3 Results headline

The place is the serif accent and comes **first**, as a title, in the nominative. The sentence after it points back
with **сюда**. The bold phrase is the verb with the count. On the results screen the full stop after the place is
plain text; on the card it sits in the accent block as its own part, as English does there.

**Current window**, one plural message wrapping the verb:

| Category | Numbers | Frame |
|---|---|---|
| `one` | 1, 21, 31, 101 | «*[PLACE]*. За последние 7 дней сюда **смотрел [NUM] спутник**.» |
| `few` | 2–4, 22–24, 102 | «*[PLACE]*. За последние 7 дней сюда **смотрели [NUM] спутника**.» |
| `many` | 5–20, 25–30, 111 | «*[PLACE]*. За последние 7 дней сюда **смотрели [NUM] спутников**.» |
| `other` | fractions (never reached) | «*[PLACE]*. За последние 7 дней сюда **смотрели [NUM] спутника**.» |

Examples: «*Waterloo*. За последние 7 дней сюда **смотрели 256 спутников**.» · «*Москва*. За последние 7 дней сюда
**смотрел 1 спутник**.» · «*Сочи*. За последние 7 дней сюда **смотрел 21 спутник**.» (21 is `one`.) With 2–4 both
«смотрели» and «смотрело» are correct Russian; the plural is chosen because the satellites act.

- **None** (its own message, never a plural form): «*[PLACE]*. На этой неделе ни один известный нам спутник сюда не
  смотрел.» (an older week: «В ту неделю…»). The same words on the card. «известный нам» is honest about the
  satellites About says no one lists. The negation comes last, where Russian puts the new fact, and the week card's
  lead sets in three lines («…сюда не смотрел ни один известный нам спутник» took four).
- **Old window:** «*[PLACE]*. С 29 октября по 5 ноября сюда **смотрели [NUM] спутников**.»; within one month «С 1 по
  8 ноября»; from the 2nd «Со 2 по 9 ноября» (§5.6).
- **A place cut short** ends on the ellipsis alone: «*Очень длинное название…* За последние 7 дней…»

| Alternate | Why it loses |
|---|---|
| «За последние 7 дней *Waterloo* видели **256 спутников**.» | Needs the accusative: «видели Москва», «видели Нидерланды» are ungrammatical, and Intl country names are exactly such words |
| «За последние 7 дней **256 спутников смотрели** на это место: *Waterloo*.» | The colon label reads like a form field, and the accent loses its place at the head |

Why the shipped one wins: the nominative title works for every name in every script, gender and number («Альпы»,
«Подмосковье», «Сочи», «Palm Jumeirah», «55.75, 37.62»).

```ts
const head = (place: string) => [accent(place), '. За последние 7\u00a0дней сюда ']
f.plural(n, {
  one: [...head(place), strong('смотрел ', num(f.int(n)), '\u00a0спутник'), '.'],
  few: [...head(place), strong('смотрели ', num(f.int(n)), '\u00a0спутника'), '.'],
  many: [...head(place), strong('смотрели ', num(f.int(n)), '\u00a0спутников'), '.'],
  other: [...head(place), strong('смотрели ', num(f.dec(n, 1)), '\u00a0спутника'), '.'],
})
```

The NBSP between the number and its noun is in the translator's string: neither React nor `plain()` adds it.

### 3.4 The second line (images made public)

One count for photos, mosaics, radar and full-disc images alike. The short participle agrees with the count, so the
plural message carries it:

| Case | Frame |
|---|---|
| `one` | «Опубликован [NUM] снимок.» (1, 21, 31) |
| `few` | «Опубликовано [NUM] снимка.» (2–4, 22–24) |
| `many` | «Опубликовано [NUM] снимков.» (5–20, 25–30, 1 715) |
| `other` | «Опубликовано [NUM] снимка.» |
| Partial ("At least") | «Опубликован **как минимум** 21 снимок.» · «Опубликовано **как минимум** 4 снимка / 27 снимков.» |
| None | «На этой неделе не опубликовано ни одного снимка.» (an older week: «За ту неделю…»; card: «Не опубликовано ни одного снимка.») |
| Archives down | «Архивы снимков не ответили, поэтому сейчас мы не можем посчитать опубликованные снимки.» Card: «Архивы снимков не ответили.» |

«Как минимум» is an adverb and governs nothing, so removing it changes no other word and the line settles in place.
«Не менее» and «не меньше» would put the count in the genitive («не менее 21 снимка»), and the noun would change when
the words go: banned here. «Опубликовано 1 снимок» is a common slip: with a count ending in 1 the participle is
singular masculine. With 2–4 «опубликовано» and «опубликованы» are both correct; the neuter is shorter and matches
5+.

### 3.5 Pass sentences

**Imaged, detailed photo** ("Sentinel-2C crossed 786 km overhead at 16:14:21 UTC, moving south at 7.46 km/s. It was
looking straight down. Cloud cover across the scene: 25%."):

> Спутник Sentinel-2C пролетел в 16:14:21 UTC прямо над этой точкой на высоте 786 км, двигаясь на юг со скоростью
> 7,46 км/с. Он смотрел строго вниз. Облачность кадра: 25%.

Time comes right after the verb, then where: «пролетел в [TIME] на высоте…» is how Russian tells it, and it keeps the
clock's «в» away from the offset's «в 61 км» (on screen, «…на высоте 795 км, в 73 км к востоку, в 11:21:13» stacked
three «в»).

Parts of the frame:

- Overhead (ground distance < 15 km): «прямо над этой точкой на высоте [ALT]». Never «прямо над головой»: it is the
  overhead verdict's name («Над головой»), and the searched place need not be where the reader stands.
- Offset: «на высоте [ALT], в [DIST] к [DIR-dative]» → «…в 16:14:21 UTC на высоте 786 км, в 61 км к западу, двигаясь…»
- Off nadir: «Он смотрел вниз с отклонением [DEG] от вертикали.» (prose says «от вертикали»; only labels say «от
  надира»)
- Radar: «Его радар смотрел вбок под углом [DEG] и снял это место[ в темноте]: [NUM] м на пиксель.» Never «глядя на
  [DEG]» (it reads first as "looking at"), and «в темноте» goes with «снял», never after the pixel size.
- Daily mosaic: «Его сенсор VIIRS добавил это место в суточную мозаику NASA в естественных цветах: 375 м на пиксель.»
- Likely, open optical, recent: «Был день, так что эта точка почти наверняка попала в кадр. Снимок с этого пролёта
  ещё не опубликован. Архивы могут запаздывать на сутки и больше.»
- Likely, in the dark: «Здесь было темно. Метеоспутники продолжают снимать и ночью, в инфракрасном диапазоне, так что
  этот спутник видел твои облака, а не улицы.» The line shows whenever the sun is below the horizon, civil twilight
  included, so it says «темно», as English says "dark", never «ночь».
- Could (commercial): «Спутник WorldView Legion 4 пролетел в 10:52 EST в зоне видимости, в 61 км к западу.» Then the
  camera: «Отклонив камеру на 18,2° от вертикали, он мог смотреть сюда. Мы не можем знать, так ли это было.»; passing
  straight over: «Не отклоняя камеру, он мог смотреть сюда.» (no «Даже»: the English adds no emphasis). Radar:
  «Глядя вбок под углом 25,0°, он мог снять это место.»
- Overhead (the message gets no satellite category, so a station is «спутник» here too, which is true: a station is
  an artificial satellite): «Спутник ISS (ZARYA) пролетел в 21:03 EET на высоте 420 км, на 45° над твоим горизонтом,
  на северо-западе.» Near the zenith: «…почти в зените.» At night (`darkStation`, which English words for a station):
  «Там, где ты, было темно. Если станцию ещё освещало солнце, она пролетела по твоему небу яркой немигающей точкой.»
- Geostationary: «Спутник Meteosat-12 не пролетает мимо, а неподвижно висит на высоте 35 786 км над экватором (0.2°W)
  и каждые 10 минут снимает всю обращённую к нему сторону Земли.» «Линия сканирования дошла сюда около 07:49 CET,
  двигаясь на север.» Infrared: «Здесь было темно, поэтому это инфракрасный снимок. Яркость показывает температуру
  верхушек облаков: чем холоднее, тем светлее.» («темно»: an infrared frame is picked whenever the sun is below 6°,
  sometimes still day; the explanation is its own sentence so it can take the colon.) The seat is a coordinate:
  international notation, in parentheses.

| Alternate | Why it loses |
|---|---|
| «В 16:14:21 UTC спутник Sentinel-2C пролетел…» | Natural too, but every pass paragraph opens on what crossed |
| «Sentinel-2C пролетел…» | Without «спутник» the verb's gender is a guess (and wrong for a station named «станция» by its operator) |
| could: «Спутник … видел это место в 10:52» | Claims it saw; the English says only that the place was within view |

### 3.6 The four verdicts (`VERDICT_META`)

One set of words everywhere (DESIGN §7). Titles are status forms, impersonal plurals or noun phrases, never a bare
past tense that would need the satellite's gender.

| Verdict | Title | Lane (mono caps, ≤ 8 characters) | Count unit | Definition | Headline frame (`[SAT]` / nameless) |
|---|---|---|---|---|---|
| imaged | Увидено | СНИМОК | пролёт · пролёта · пролётов · пролёта | Настоящий снимок этого места есть в открытом архиве. | «*[PLACE]*. Сюда смотрел спутник [SAT].» / «…неизвестный спутник.» |
| likely | Вероятно, увидено | ВЕРОЯТНО | same | Это место попало в полосу обзора неподвижной камеры. Снимок не опубликован. | «*[PLACE]*. Это место попало в полосу обзора спутника [SAT].» / «…неизвестного спутника.» |
| could | Могли смотреть сюда | ВОЗМОЖНО | same | Это место было в зоне досягаемости поворотной камеры или камеры с закрытым архивом. Оператор не сообщает, смотрела ли она сюда. | «*[PLACE]*. Сюда мог смотреть спутник [SAT].» / «…неизвестный спутник.» |
| overhead | Над головой | В НЕБЕ | same | Пролёт над твоей головой. Станции и всё остальное. | «*[PLACE]*. Над этим местом пролетел спутник [SAT].» / «…неизвестный спутник.» |

- **Увидено** is a status form like «Отправлено», «Просмотрено», «Прочитано» in a messenger: no gender, no agent, and
  honest (an image exists, so the place was seen). «Снято» ("shot") was rejected: the owner's rule is "watched", never
  "photographed", and radar and mosaics are not shots. «Есть снимок» was rejected as a title: it drops the product's
  verb, though the lane says СНИМОК for exactly that reason (it counts images).
- **Вероятно, увидено** keeps its comma: «вероятно» is a parenthetical word, and the comma is required even in a label.
- **ВЕРОЯТНО / ВОЗМОЖНО** is the standard Russian pair for "probable / possible", exactly the gap between *likely* and
  *could*.
- **Могли смотреть сюда**: the impersonal plural names no agent, which is the point (the operator may or may not have
  aimed the camera), and it keeps the product verb. «Навести» is banned (§8).
- **Над головой** is the noun phrase; the lane is **В НЕБЕ** and the definition «Пролёт над твоей головой» repeats the
  title's picture.
- The spoken verb in a row's summary («Sentinel-2C, увидено, пятница, 6 ноября…») is the title's own words in running
  case: «увидено», «вероятно, увидено», «могли смотреть сюда», «над головой». Never «пролетел» alone.
- English's "private" camera is «камера с закрытым архивом»: «частная камера» is a person's camera, and some of these
  cameras are governments'. «в зоне досягаемости», never a bare «в досягаемости».
- About's longer words: imaged «Если мы его показываем, это настоящий снимок.»; likely «Либо его ещё не выложили, либо
  отбраковали из-за облаков.» (after «Снимок не опубликован.», so not «опубликовали» again); could «Узнать, так ли было
  на самом деле, невозможно.»

### 3.7 Share card, share page and post

The card is drawn in the sharer's language (`l=ru`); the stored share keeps the canonical English label, as every
share does. Every card frame keeps `[PLACE]` first or after a colon.

**Headlines** (rich: the accent block holds the place and its full stop; the lead follows as its own block, ≤ 3 lines
of about 24 characters at the largest size):

| Key | ru |
|---|---|
| `headline` (the week's N, ≥ 1) | «*Waterloo.* Сюда смотрели 7 спутников.» (`one`: «Сюда смотрел 21 спутник.») |
| `headlineWeek` | «*Waterloo.* На этой неделе сюда смотрел 31 спутник.» · none: «*Waterloo.* На этой неделе ни один известный нам спутник сюда не смотрел.» (three lead lines) |
| `headlineBy` (older shares) | the four verdict frames of §3.6, with `sat` undefined → the nameless forms |
| `photos` | §3.4 |

**Top row and readouts:** stamp «вс, 1 нояб. 2026 · 11:21 EST» (built from Intl parts, without Intl's «г.»); `weekTo`
«7 дней по 1 нояб. 2026» («по» marks the span's last day, as in «с 25 октября по 1 ноября»; «7 дней до 1 нояб.» reads
as a countdown); `lastWeek` «Последние 7 дней». Readouts «Высота · Над горизонтом · Скорость · От надира ·
Пиксель · Пиксель мозаики · До трассы» (the longest, 15 characters, fits the 155 px column); week lanes «Снимок ·
Вероятно · Возможно · В небе»; units «км · м · км/с».

**Over the picture:** `aSatellite` (a lone label: chips and the plan plate's callout) «Спутник»; look chips «Самый
близкий кадр · Sentinel-2B · 10 м», «Последний ясный кадр · 3 нояб.», «Под облаками», «Радар»; geometry «Геометрия
пролёта · север вверху»; notes «Снимок открывается в приложении» · «Снимок сейчас недоступен» · «Закрытый коммерческий
архив» · «В полосе обзора, снимок ещё не опубликован» (the participle needs its noun) · «Трасса в момент
сближения»; `acquiring` «Приём…»; `noPublicPhoto` «За неделю снимков не опубликовано» (the week's lead can be
radar, which is not a photo); `noPhoto` «Нет снимка для показа».

**Clouds** (`sub` · `chip` · `post` · `desc`):

| Case | ru |
|---|---|
| only (≥ 90%) | «Сплошная облачность: видны только облака.» · «Под облаками · 93%» · «Видны только облака.» · «Видны только облака (93%).» |
| mostly (70–89%) | «В основном облака: 81% кадра.» · «В основном облака · 81%» · «Видны в основном облака (81%).» · same |
| spot | «Облака над самой точкой.» · «Облака над точкой» · «Точку закрыли облака.» · same |

**Footer:** `invite` «Что смотрело на тебя» (20 characters beside the domain: English invites, "See what watched
you", so the indirect question stands as a label, with no question mark); `enterAnyPlace` «Введи место на Земле» (20,
the landing's and the share page's verb); `defaultPlace` «Пальма Джумейра»; `defaultAlt` «Настоящий снимок Пальмы
Джумейра (Дубай) со спутника Sentinel-2, а рядом строка «На этой неделе что-то смотрело на тебя. Введи место на
Земле».» (it describes the ru default card).

**Share page:** `title` «На этой неделе что-то смотрело на тебя.»; `description` = the sub line (§3.2); `placeTitle`
«Waterloo: что смотрело сюда на этой неделе»; `placeDescription` «Waterloo: все спутники, пролетавшие здесь за
последние 7 дней, и настоящие снимки, которые они сделали. Что смотрело на тебя на этой неделе?»; `opening`
«Открываем *Watched*».

**Pass page description:**

| Key | ru |
|---|---|
| `crossed` imaged / likely | «Waterloo. Спутник Sentinel-2C пролетел здесь на высоте 795 км в 11:21 EST, 1 ноября 2026 года, двигаясь на юг.» (no altitude: «…пролетел над этим местом в 11:21 EST…»; the place is never dropped) |
| `crossed` overhead | «Waterloo. Над этим местом на высоте 420 км пролетел спутник ISS (ZARYA) в 21:03 EET, 1 ноября 2026 года, двигаясь на северо-восток.» |
| nameless | «Waterloo. Неизвестный спутник пролетел…» |
| `withinView` | «Waterloo. Спутник WorldView Legion 4 пролетел в зоне видимости этого места в 10:52 EST, 1 ноября 2026 года, двигаясь на север.» |
| `couldHave` | «Он мог смотреть сюда. Оператор не сообщает, так ли это было.» |
| `straightDown` / `offNadir` | «Он смотрел строго вниз.» / «Он смотрел вниз с отклонением 5,4° от вертикали.» |
| `cloudCover` | «Облачность: 25%.» |
| `inSwath(place)` | «Это место попало в полосу обзора его камеры.» (the slot is ignored: the place cannot be the subject of a past tense) |
| `bestFrom` | «Самый близкий кадр сделал спутник Sentinel-2B.» · «Последний ясный кадр сделал спутник …» · «Первый снимок сделал спутник …» · nameless «…сделал неизвестный спутник.» |
| `question` | «Что смотрело на тебя на этой неделе?» |
| `cardAlt` | «Карточка для публикации с самым близким кадром недели. Его сделал спутник Sentinel-2C.» · plain «Карточка для публикации.» |

**Post text:**

| Verdict | ru |
|---|---|
| imaged | «Waterloo. Сюда смотрел спутник Sentinel-2C с высоты 786 км, 1 ноября в 11:21 по местному времени. 10 м на пиксель. Это настоящий снимок.» |
| clouded | «Waterloo. Сюда смотрел спутник Sentinel-2C с высоты 786 км, 1 ноября в 11:21 по местному времени. Видны только облака.» |
| likely | «Waterloo. Спутник Sentinel-2A пролетел здесь на высоте 786 км, 1 ноября в 10:41 по местному времени. Это место попало в полосу обзора его камеры.» |
| could | «Waterloo. Спутник WorldView Legion 4 пролетел в зоне видимости этого места 1 ноября в 10:52 по местному времени. Он мог смотреть сюда. Оператор не сообщает, так ли это было.» |
| overhead | «Waterloo. Над этим местом на высоте 420 км пролетел спутник ISS (ZARYA), 1 ноября в 21:03 по местному времени.» |
| hooks | «На этой неделе что-то смотрело и на тебя.» / «Что пролетало над тобой на этой неделе?» |
| credit | «via @armaangupt0» (unchanged: the credit line is the maker's, and «via» is read on X in every language) |

### 3.8 Globe and HUD words

The globe's pass sequence shows a crosshair and a shockwave over the reader's town: its words are nouns, never a verb
of capture (§8).

| English | ru (stored in sentence case; CSS uppercases) |
|---|---|
| Acquiring | Приём |
| ACQUIRED 11:21:21 EST · 10 m | Снимок 11:21:21 EST · 10 м |
| ACQUIRED (now) | Снимок |
| IMAGED 11:21:13 EST / ≈ 11:21 EST | Снимок 11:21:13 EST / Снимок ≈ 11:21 EST |
| ACQUISITION · [SAT] (over T−) | Снимок · [SAT] |
| CLOSEST APPROACH · [SAT] / now | Сближение · [SAT] / Сближение |
| Scan line counter | `['Строка ', strong(line), ` → ${lines}`]` |
| Awaiting pass / scan | Ожидание пролёта / Ожидание сканирования |
| How this works | Как это работает |
| SUN 16.2°S 063.0°E | Солнце 16.2°S 063.0°E (coordinates as they arrive) |
| Sub-solar point · GMST 18:41:50 | Подсолнечная точка · GMST 18:41:50 |
| Scene (replay clock) | Повтор |
| 12,847 OBJECTS · Objects · CATALOG | 12 847 объектов · объектов · Каталог |
| Fetched [stamp] · Stale, 3 D ago | Получен [stamp] · 3 дн. назад, устарел |
| Catalog unavailable · Loading catalog | Каталог недоступен · Загрузка каталога |
| Fault · Trying… · Back | Сбой · Пробуем… · Назад |

«Приём» is the word of a ground station receiving a downlink: an instrument's word for a picture arriving, with no
capture in it. «устарел» follows the age: «Устарел, 3 дн. назад» read "went stale 3 days ago"; it agrees with
«каталог» (masculine, always the subject here). The replay's clock is «Повтор», and its scrubber «Время в повторе
пролёта»: «кадр» is an image's word, and this is the replay's simulated time, not the time anything was taken.

### 3.9 About page

The owner's plain voice, ты, short answers. `about.privacy` is translated **exactly**: it promises nothing more and
nothing less than the English.

| English | ru |
|---|---|
| How this / *works*. | Как это / *работает*. |
| Pick a spot on Earth. We work out which satellites flew over it in the last week, then go find the photos they took. It all runs in your browser, on public data. | Выбери точку на Земле. Мы вычисляем, какие спутники пролетали над ней за последнюю неделю, и ищем снимки, которые они сделали. Всё работает в твоём браузере, на открытых данных. |
| Sections | Коротко · Как мы находим пролёты · Что значат статусы · Чего мы не видим · Приватность · Благодарности · Клавиатура |
| Is it live? Not quite… | Это в реальном времени? Не совсем. Снимки попадают в архивы через несколько часов или пару дней после съёмки, так что у самых свежих пролётов их может ещё не быть. |
| Can it see me? No. At best a pixel here is 10 m across. A car is one pixel. You're not in it. | Меня видно? Нет. Пиксель здесь не меньше 10 м. Автомобиль занимает один пиксель. Тебя на снимке не видно. |
| Is this every satellite? No. Military and spy satellites mostly aren't in public catalogs… | Здесь все спутники? Нет. Военных и разведывательных спутников в основном нет в открытых каталогах, а компании не говорят, куда направляют свои камеры. |
| You have to be in the strip. | Нужно оказаться в этой полосе. |
| If you were in reach, we call it "could have pointed here". | Если твоё место было в зоне досягаемости, мы пишем «Могли смотреть сюда». |
| A few sit over the equator… If you're on their side of Earth, you're in every frame. | Несколько метеоспутников неподвижно висят над экватором и каждые 10 минут смотрят на полпланеты. Если ты на обращённой к ним стороне Земли, ты в каждом кадре. |
| Made from public data. We didn't take any of these photos. | Сделано на открытых данных. Ни одного из этих снимков мы не делали. («сделано из» is about material) |
| Close · Esc · Space | Закрыть · Esc · Пробел |

About has no em dash, as the owner's English has none: a sentence Russian would build noun — noun is rebuilt
(«Автомобиль занимает один пиксель», «здания и неровная земля светлые, спокойная вода тёмная»), and credits take a
colon («Автор: @armaangupt0», on the landing too) or none («GOES через NOAA и CIRA»).

Credits: licence lines ("Contains modified Copernicus Sentinel data 2026", "Contains modified EUMETSAT Meteosat data
2026", "Landsat: USGS / NASA", "Himawari: JMA, via NASA GIBS") stay in English, word for word. OpenStreetMap's
attribution takes the form OSM gives for Russian: «© участники OpenStreetMap (ODbL)». The Type credit names the
Cyrillic faces too, because a ru reader sees Noto, not Instrument.

---

## 4. Glossary

### 4.1 Terms

Gender: m. / f. / n. / pl. Plural forms are `one · few · many`.

| English | ru | Notes |
|---|---|---|
| satellite | спутник | m.; спутник · спутника · спутников. Never «сателлит». |
| a satellite (no name) | неизвестный спутник (sentences) · Спутник (a lone chip or callout) | |
| station (crewed) | станция | f. Only where the English itself words a station (`darkStation`). No message gets a category, so a station named by `[SAT]` is «спутник». |
| pass (noun) / overflight | пролёт | m.; пролёт · пролёта · пролётов. Always with ё. Never «проход», «пасс». |
| to pass over | пролетать / пролететь над | Past tense only with «спутник» / «станция» (§5.2). Never a bare «пролетел» as a label. |
| to watch (product verb) | смотреть (на / сюда) | Never следить, шпионить, наблюдать за, фотографировать. |
| watched (verdict) | Увидено | «Вероятно, увидено» for likely. |
| could have pointed here | Могли смотреть сюда | Never «навести» (§8). |
| verdict (the four labels) | статус | m. «Что значат статусы», «Пролёты по статусам». Never «отметка» (a tick, a grade, a height mark). |
| photo | фото | n., indeclinable. Only a certain Sentinel-2 / Landsat photo. «фотография» once, in "not a photograph". |
| image | снимок | m.; снимок · снимка · снимков. Any image. |
| picture (casual) | снимок; изображение in technical asides | Never «картинка». |
| scene / frame / look | кадр | m.; кадр · кадра · кадров. «Облачность кадра», «Кадр 3 из 12». Never «сцена». Never the replay's clock (that is «Повтор»). |
| closest look | самый близкий кадр | 18 characters. Never «ближайший» (it means "the next one": «ближайший рейс»). |
| clear look | ясный кадр | ясный кадр · ясных кадра · ясных кадров. «ясный» as the sky is clear. Never «ясный взгляд». |
| last clear look | последний ясный кадр | 20 characters, the chip's limit. |
| clouded over | под облаками | «В основном облака» for mostly cloud; status «Облачно». |
| made public / published | опубликован(о) | Of an operator's habit: «публикует», «не публикуют». |
| archive | архив | m.; «открытый архив», never «публичный архив». |
| swath | полоса обзора | f. «попало в полосу обзора», «ширина полосы обзора». Never «полоса захвата» (§8). |
| field of regard | зона обзора | f. Readout «Зона обзора ±45°». |
| field of view / within view | поле зрения / зона видимости | «В поле зрения» (replay); «пролетел в зоне видимости» (could). |
| in reach / within range | в зоне досягаемости | Never a bare «в досягаемости». |
| off-nadir | отклонение от вертикали (prose) · От надира (label) | |
| nadir / straight down | надир / строго вниз | «надир» only in labels. |
| ground track | трасса | f.; «наземная трасса». Never «трек». |
| orbit | орбита | f. |
| orbital elements / element sets | элементы орбит / наборы элементов | TLE stays. |
| propagate (orbits) | рассчитать | «Расчёт орбит», «Орбиты рассчитаны». |
| match (scenes to passes) | сверить / сверка | «Сверка кадров с пролётами», «Кадры сверены», «Сверка 128 кадров и 1 204 пролётов» (34 characters; «Сопоставление» ran past the phone row). |
| altitude | высота | f. Not for angles. |
| elevation (angle) | высота над горизонтом | Label «Над горизонтом»; «на 45° над твоим горизонтом». Sun: «Высота Солнца» (the standard term, qualified by its noun). The geostationary row: «39,6° над горизонтом». Never a bare «высота» for an angle (§9.1). |
| horizon | горизонт | |
| ground speed | путевая скорость | Prose: «со скоростью 7,46 км/с». Card: «Скорость». |
| heading | курс | m. Readout «194,6°» with unit «SSW · восх.». |
| ascending / descending | восходящий / нисходящий | Unit: «восх.» / «нисх.». |
| closest approach | наибольшее сближение | Label «Сближение». |
| ground distance | расстояние до трассы | Labels: «До трассы». |
| cloud cover | облачность | f. |
| cirrus / cloud shadow | тонкие (перистые) облака / тень от облаков | Prose «тонкие перистые облака»; status «Тонкие облака»; spot value «Тонкие» (≤ 7, so never «Перистые», 8); «Тень облаков». |
| clear | ясно / ясный | «Над твоей точкой ясно.» |
| pixel | пиксель | m.; пиксель · пикселя · пикселей. «10 м на пиксель». |
| resolution | разрешение | Labels say «Пиксель». Never «резолюция». |
| radar | радар | «радарный снимок», «радарный спутник». |
| radar echo | отражённый сигнал | «излучает микроволны и принимает отражённый сигнал». Never «записывает эхо» (a calque). |
| daily mosaic | суточная мозаика | f.; суточная мозаика · суточные мозаики · суточных мозаик. Tag «Мозаика». |
| true colour | естественные цвета | «в естественных цветах». |
| toned (photos) / touch-ups | обработанный / обработка | «обработанный так же, как все фото здесь». Never «тонированный» (tinted glass, sepia). |
| geostationary / full disc | геостационарный / полный диск | «снимок полного диска». |
| scan / scan line / line | сканирование / линия сканирования / строка | «Строка 412 → 1 100». |
| band: infrared / visible / colour | канал: тепловой / видимый / цветной | Values ≤ 9 characters at 21 px. Prose keeps «инфракрасный»; chip «ИК». |
| time-lapse | таймлапс | m.; таймлапс · таймлапса · таймлапсов. |
| replay | повтор (noun) · воспроизвести (verb) | Short «Повтор», long `['Повтор', strong(' пролёта')]`. The HUD's replay clock «Повтор», the scrubber «Время в повторе пролёта». |
| catalog | каталог | m. «каталог орбит». |
| sub-solar point | подсолнечная точка | f. |
| day / twilight / night | день / сумерки / ночь | «Был день». English "dark" is «темно» («Здесь было темно»), never «ночь»: the code knows only that the sun is down, twilight included. After the sun's degrees, lowercase: «31,1° день». |
| steerable / fixed camera | поворотная / неподвижная камера | f. A "private" camera is «камера с закрытым архивом», never «частная камера» (a person's). |
| camera / sensor | камера / сенсор | Instrument names (MSI, OLI, VIIRS) stay. Never «датчик» for an imager. |
| operator | оператор | «Оператор не сообщает». |
| weather / imaging / radar satellite | метеоспутник / съёмочный спутник / радарный спутник | |
| window (time) | окно | n. |
| place / spot | место / точка | «твоя точка». Never «пятно». |
| pin / reticle | метка | f. «Поставить метку». Never «пин», «прицел», «цель». |
| acquired / imaged | снимок (noun) | Never «зафиксировано», «захвачено» (§8). |
| acquiring | приём | m. A downlink's word. |
| object (catalog) | объект | m.; объект · объекта · объектов. |
| pass geometry / plan view | геометрия пролёта / схема пролёта | |
| app | приложение | |
| share | поделиться | «Поделиться пролётом / снимком / неделей». |
| download (image) | скачать | «Скачать снимок», «Скачивание…»; the share sheet's PNG «Сохранить». |
| copy / copied | копировать / скопировано | |
| link | ссылка | f. Field label «Ссылка» (§7). |
| card (share card) | карточка | f. «Копировать карточку». |
| post (social) | пост | m. «Пост в X». |
| video | видео | n., indeclinable. |
| cookies | файлы cookie | Never «куки». |
| search a place | поиск места | |
| use my location | моё местоположение | Matches the browser's prompt. «Где я» on phones, «Рядом» in the ≤ 400 px chip. Never «локация». |
| surprise me | наугад | Never «Удиви меня» (a calque). |
| last 7 days / this week / that week | последние 7 дней / на этой неделе / в ту неделю, за ту неделю | Never «на той неделе». |
| local time | местное время | Prose: «по местному времени». |
| UTC, zone abbreviations | unchanged | As code prints them (EST, CET, UTC+9). Never МСК in place of MSK. |
| ago / just now / in 3 h | назад / только что / через 3 ч | |
| s / min / h / d | с / мин / ч / дн. | «с», «мин», «ч» are unit symbols (ГОСТ 8.417): no period, never inflected; «дн.» is an abbreviation and takes its period, as Intl prints it. Prose spells days out: «2 дня назад». |
| km, m, km/s, ° | км, м, км/с, ° | NBSP before km and m; ° tight. |
| Earth / ground | Земля / земля | Capital for the planet. |
| Sun / sunlight | Солнце / солнце | Capital only in «Высота Солнца» and the HUD; «солнце так и не взошло», «камерам нужно солнце». |
| NASA, ESA, NOAA, EUMETSAT, Copernicus | unchanged | In Latin, as every name in this product («НАСА» would be the only Cyrillic agency). |
| key "Space" | Пробел | Esc, Enter, F as printed on keys. |

### 4.2 Compass and coordinates

**Prose only, 8 words, three tables:**

- Moving (на + accusative): на север · на северо-восток · на восток · на юго-восток · на юг · на юго-запад · на запад ·
  на северо-запад («двигаясь на юг»).
- Offset from the place (к + dative, after «в [DIST]»): к северу · к северо-востоку · к востоку · к юго-востоку · к
  югу · к юго-западу · к западу · к северо-западу («в 61 км к западу»).
- Position in the sky (на + prepositional): на севере · на северо-востоке · на востоке · на юго-востоке · на юге · на
  юго-западе · на западе · на северо-западе («на 45° над твоим горизонтом, на северо-западе»).

A prose message receives the direction as an index or a compass id, never as English text.

**Readouts:** the compass point arrives as `compassAbbr()` prints it («SSW») and is set as it arrives, uppercase
Latin, like the coordinates on the same screens («16.2°S 063.0°E») and the photo's N chip. Russian navigation uses
these letters too; a Cyrillic «ЮЮЗ» would sit beside a Latin «S» in the coordinates. `heading` → «SSW · восх.»;
`upCompass` → the compass alone («SSW»), because the label «В твоём небе» already says "up".

**Coordinates** are international notation in every surface, prose included: «43.47, −80.54», «16.2°S 063.0°E»,
«(0.2°W)». Never rewritten with a decimal comma or Cyrillic hemisphere letters («ю. ш.»).

### 4.3 Curated places (`places` namespace, every id)

Established Russian names; the chip only for the first three. Sublabels use «США», «ОАЭ», «ЮАР», the short forms
Russian writes, most specific first, joined with commas; «и» joins two countries.

| id | label | sublabel |
|---|---|---|
| area51 | Зона 51 (chip «Зона 51») | Грум-Лейк, Невада, США |
| centralPark | Центральный парк (chip «Центральный парк») | Нью-Йорк, США |
| giza | Пирамиды Гизы (chip «Гиза») | Гиза, Египет |
| uluru | Улуру | Северная территория, Австралия |
| palmJumeirah | Пальма Джумейра | Дубай, ОАЭ |
| worldIslands | Острова «Мир» | Дубай, ОАЭ |
| grandCanyon | Большой каньон | Аризона, США |
| meteorCrater | Аризонский кратер | Аризона, США |
| lowerManhattan | Нижний Манхэттен | Нью-Йорк, США |
| lasVegasStrip | Лас-Вегас-Стрип | Невада, США |
| hooverDam | Плотина Гувера и озеро Мид | Невада и Аризона, США |
| goldenGate | Мост Золотые Ворота | Сан-Франциско, США |
| kennedySpaceCenter | Космический центр Кеннеди | Флорида, США |
| washingtonDc | Вашингтон | Национальная аллея, США |
| mountStHelens | Гора Сент-Хеленс | Штат Вашингтон, США |
| niagaraFalls | Ниагарский водопад | Онтарио, Канада |
| panamaCanal | Панамский канал | Шлюзы Гатун, Панама |
| rioDeJaneiro | Рио-де-Жанейро | Сахарная Голова и Копакабана, Бразилия |
| paris | Париж | Иль-де-Франс, Франция |
| venice | Венеция | Венето, Италия |
| vesuvius | Везувий | Неаполь, Италия |
| istanbul | Стамбул | Босфор, Турция |
| chernobyl | Чернобыльская АЭС | Киевская область, Украина |
| tableMountain | Столовая гора | Кейптаун, ЮАР |
| kilimanjaro | Килиманджаро | Килиманджаро, Танзания |
| everest | Эверест | Непал и Китай |
| angkorWat | Ангкор-Ват | Сиемреап, Камбоджа |
| singapore | Сингапур | Марина-Бэй, Сингапур |
| hongKong | Гонконг | Гавань Виктория, Гонконг |
| tokyo | Токио | Токио, Япония |
| fuji | Фудзи | Сидзуока, Япония |
| sydneyHarbour | Сиднейская гавань | Сидней, Австралия |
| richat | Структура Ришат | Сахара, Мавритания |
| greatBlueHole | Большая голубая дыра | Риф Лайтхаус, Белиз |
| boraBora | Бора-Бора | Острова Общества, Французская Полинезия |
| hardyReef | Риф Харди | Большой Барьерный риф, Австралия |
| male | Мале | Атолл Северный Мале, Мальдивы |
| deadSea | Солеварни Мёртвого моря | Южный бассейн, Израиль и Иордания |
| binghamCanyon | Карьер Бингем-Каньон | Юта, США |
| mountWhaleback | Карьер Маунт-Уэйлбэк | Пилбара, Австралия |
| etna | Этна | Сицилия, Италия |
| santorini | Санторини | Киклады, Греция |
| teide | Тейде | Тенерифе, Испания |
| kilauea | Килауэа | Гавайи, США |
| craterLake | Озеро Крейтер | Орегон, США |
| glenCanyonDam | Плотина Глен-Каньон | Пейдж, Аризона, США |
| gardenCity | Круглые поля Гарден-Сити | Канзас, США |
| almeria | Теплицы Альмерии | Андалусия, Испания |
| gibraltar | Гибралтар | Гибралтарский пролив |
| suezCanal | Суэцкий канал | Исмаилия, Египет |
| aswanDam | Асуанская плотина | Озеро Насер, Египет |
| wadiRum | Вади-Рам | Акаба, Иордания |
| sossusvlei | Соссусфлей | Пустыня Намиб, Намибия |
| victoriaFalls | Водопад Виктория | Замбия и Зимбабве |
| threeGorges | Плотина «Три ущелья» | Хубэй, Китай |
| shanghai | Шанхай | Река Хуанпу, Китай |
| itaipu | Плотина Итайпу | Бразилия и Парагвай |

- «Мост Золотые Ворота», not «Золотые Ворота»: to a Russian reader the bare name is also Kyiv's and Vladimir's gate and
  Istanbul's strait. «Чернобыльская АЭС», not «Чернобыль»: the pin is the plant, about 15 km from the town (§8).
- «Аризонский кратер» is the Russian name of Meteor Crater («Метеоритный кратер» names any crater). «Большой каньон»,
  not «Гранд-Каньон»: the established Russian name.
- «Турция», not «Туркийе»: the Russian name of the country did not change with the English.
- A sublabel is a line of its own, so it starts with a capital («Штат Вашингтон, США»).
- The chip «Центральный парк» is 16 characters against the ~14 the English comment suggests: it is one nowrap line,
  fits beside the other chips at 1280 px and scrolls with them on phones (checked 2026-11-21). «Сентрал-парк» was
  rejected: the chip and its label would name the park two ways.
- These are display names only: usage stats, `record_lookup` and shares keep the English label.

---

## 5. Grammar strategies for runtime slots

### 5.1 [PLACE]: no inflection possible

Russian has six cases; code can only give the nominative. `[PLACE]` goes only where the nominative is grammatical, and
the sentence refers back to it with words that take the case for it.

**Allowed positions:**
1. **First, as a title**, closed by a full stop: «*[PLACE]*. За последние 7 дней сюда смотрели…»
2. **After a colon**: «Таймлапс: [PLACE]», «Waterloo: что смотрело сюда на этой неделе», «Метка поставлена: [PLACE].»
3. **In parentheses**, in quotation marks, or alone (a chip, a row, a field value).

**Referring back:** «сюда», «здесь», «отсюда», and «это место / этого места / этому месту / этим местом / об этом
месте». Pass sentences never repeat the name.

**Banned:** any preposition before `[PLACE]` («в», «над», «до», «из», «для», «у», «на», «по», «к»); `[PLACE]` as an
object («видели [PLACE]»); `[PLACE]` as the subject of a past tense or a short adjective («Москва была», «Сочи был»,
«Альпы были»). Also «город [PLACE]» as a workaround: the label may be a country, a sea or coordinates.

**Test every frame with:** «Москва» (f.), «Россия» (an Intl country), «Нидерланды» (pl.), «Подмосковье» (n.), «Сочи»
(indeclinable), «Альпы» (pl.), «Waterloo», «Palm Jumeirah», «Тихий океан», «55.75, 37.62», and a 48-character label
ending in «…».

English adds "the" to oceans and deserts (`placeInProse`); ru frames take the raw label.

### 5.2 [SAT] as subject: no gender known

- **Put the head noun «спутник» before the name** whenever a verb, adjective or pronoun agrees with it: «Спутник [SAT]
  пролетел…», «Сюда смотрел спутник [SAT].»
- After the first mention, «он / его / ему» refer to «спутник»: «Он смотрел строго вниз.» «Его радар…» «Спутнику
  Sentinel-1 солнце не нужно.»
- Oblique cases fall on the head noun; the name stays as is: «в полосу обзора спутника [SAT]», «сделал спутник [SAT]»,
  «Снимок со спутника [SAT]».
- **Crewed stations:** no message receives a satellite category, so a station named by `[SAT]` is «спутник [SAT]»
  with masculine agreement («Спутник ISS (ZARYA) пролетел…»), true and grammatical for any satellite. «Станция» with
  feminine agreement appears only where the English words a station (`darkStation`).
- **No name** (`sat` undefined): «неизвестный спутник» takes the head noun's place, in the case the sentence needs
  («Сюда смотрел неизвестный спутник.», «…полосу обзора неизвестного спутника.», «Снимок с неизвестного спутника»).
  «NORAD 60989» is a name: «спутник NORAD 60989».
- Two or more names are a compound subject: plural verb, «спутники» before them or no head noun («Радарные спутники
  Umbra и Capella пролетали…»).
- Never slash forms, never a bare name before a past tense.

### 5.3 [NUM]: plural categories and cases

CLDR ru (verified in Node, ICU 78 / CLDR 48): `one` 1, 21, 31, 101 (not 11); `few` 2–4, 22–24 (not 12–14); `many` 0,
5–20, 25–30, 111; `other` fractions only (counts never reach it, but the form is required and must be correct).

**After a bare numeral (nominative / accusative position):**

| Noun phrase | one | few | many | other |
|---|---|---|---|---|
| спутник | 1 спутник | 2 спутника | 5 спутников | 1,5 спутника |
| пролёт | 1 пролёт | 2 пролёта | 5 пролётов | 1,5 пролёта |
| снимок | 1 снимок | 2 снимка | 5 снимков | 1,5 снимка |
| детальный снимок | 1 детальный снимок | 2 детальных снимка | 5 детальных снимков | 1,5 детального снимка |
| радарный спутник | 1 радарный спутник | 2 радарных спутника | 5 радарных спутников | 1,5 радарного спутника |
| суточная мозаика | 1 суточная мозаика | 2 суточные мозаики | 5 суточных мозаик | 1,5 суточной мозаики |
| ясный кадр | 1 ясный кадр | 2 ясных кадра | 5 ясных кадров | 1,5 ясного кадра |
| кадр | 1 кадр | 2 кадра | 5 кадров | 1,5 кадра |
| объект | 1 объект | 2 объекта | 5 объектов | 1,5 объекта |
| место (search results) | 1 место | 2 места | 5 мест | 1,5 места |
| раз | 1 раз | 2 раза | 5 раз | 1,5 раза |
| день | 1 день | 2 дня | 5 дней | 1,5 дня |
| минута | 1 минута | 2 минуты | 5 минут | 1,5 минуты |
| процент (spoken) | 1 процент | 2 процента | 5 процентов | 1,5 процента |

Note the adjective after 2–4: masculine and neuter nouns take the **genitive plural** adjective («2 радарных
спутника», «2 ясных кадра»), feminine nouns the **nominative plural** («2 суточные мозаики»). Both are the norm.

**Agreement of the verb or participle** follows the category, so the plural message wraps it: `one` → singular
(«смотрел 21 спутник», «Опубликован 21 снимок», «Проверен 1 201 пролёт»); `few` / `many` / `other` → plural or the
neuter singular («смотрели 256 спутников», «Опубликовано 27 снимков»).

**When a word governs the count**, the noun takes that case and the categories collapse:

| Governing word | one | few / many | other |
|---|---|---|---|
| genitive: из, до, от, около, после a verbal noun («Расчёт», «Сверка») | 21 орбиты · 1 201 пролёта · из 21 снимка | 22 / 25 орбит · пролётов · из 35 снимков | 1,5 орбиты |
| dative: к, по | по 21 кадру | по 22 / 25 кадрам | avoid |
| instrumental: с ("with"), между, над | с 31 пролётом | с 32 / 35 пролётами | avoid |
| prepositional: в, на, о | в 21 кадре | в 22 / 25 кадрах | avoid |
| accusative of time: раз в, каждую / каждые | раз в 21 минуту · каждую 21 минуту | раз в 2 минуты / 10 минут · каждые 2 / 10 минут | avoid |

Prefer to restructure into a nominative position; when the case stays, every category still gets its own form.
Examples: «Проверено 1 204 пролёта 412 съёмочных и пилотируемых спутников» (`one`: «Проверен 1 201 пролёт 421
съёмочного и пилотируемого спутника»); engine row «Сверка 128 кадров и 1 204 пролётов» (`one`: «Сверка 121 кадра и
1 201 пролёта»).

Rules:
- Abbreviated units never inflect («5 мин», «41 ч», «786 км»).
- Zero is never a plural form: every zero sentence is its own message («ни один», «ни одного снимка»).
- Where a count would agree with «все» («Показать все 31 спутник»), put it in parentheses: «Показать все спутники
  (31)», «Показать все строки (31)».
- «один раз» for exactly 1 where English says "once"; «N раз / раза» otherwise.
- Test with 0, 1, 2, 4, 5, 11, 12, 14, 21, 22, 25, 101, 111, 401, 421, 1 715.

### 5.4 Lists of names

- Join runtime names with **«и»**: Russian has no alternation for «и», so a list is safe whatever the names.
- «A, B и ещё [NUM] …», with the plural on the noun phrase: `one` «и ещё 1 радарный спутник», `few` «и ещё 3 радарных
  спутника», `many` «и ещё 7 радарных спутников». The verb is plural.
- «Радару не нужен свет. Umbra, Capella и ещё 7 радарных спутников пролетали в зоне досягаемости 1 204 раза.» One
  name: «Радарный спутник Umbra пролетал в зоне досягаемости 1 204 раза.»
- `Intl.ListFormat('ru')` joins with «и» («Umbra, Capella и ICEYE-X2»), the same as the hand-made list.

### 5.5 Dates and times inside sentences

- **Date:** «1 ноября» from Intl (`{ day: 'numeric', month: 'long' }` gives the genitive month). With the year: «1
  ноября 2026 года» (Intl prints «г.»; prose replaces it with «года»).
- **Never put an Intl weekday after a preposition:** «в среду» needs the accusative and Intl gives «среда». In
  sentences and posts, drop the weekday; a standalone label may lead with it: «пятница, 6 ноября».
- **Clock:** «в [TIME]» («в 16:14:21 UTC», «в 11:21 по местному времени»). Approximate times: «около 07:49 CET».
- Ranges: «с 29 октября по 5 ноября» in sentences (§5.6 for «со 2»); «29 окт. → 5 нояб.» in labels, the arrow every
  language keeps.
- Relative time in a sentence: «41 час назад» (spoken), «41 ч назад» (labels), «через 3 ч».
- Seasons are whole phrases chosen by the code, never an inserted noun: «по одному каждую зиму / каждую весну /
  каждое лето / каждую осень».

### 5.6 Euphony next to slots

Russian alternates few prepositions, and only before sounds code can know:

- «со» before «с», «з», «ш», «ж» + consonant («со скоростью», «снимок со спутника»), and before «второго» read
  aloud: a range starting on the 2nd is «Со 2 ноября» (the code checks the day). Never «со» chosen from a slot:
  «со спутника Sentinel-2C» takes «со» from the fixed word «спутника», never from the name after it.
- «во» only before «в» + consonant and «второй / вторник» in fixed text; clocks keep «в» («в 2:15» is read «в два
  пятнадцать»).
- «об» before a vowel in fixed text («об этом»).
- Everything else («в», «к», «с», «о», «и») never changes: a slot can follow them only where §5.1 allows a slot at all.

---

## 6. Typography and formatting

### 6.1 Characters

- **ё** everywhere in our text: пролёт, ещё, всё, её, тёмный, зелёный, отключён, Мёртвое море. It disambiguates
  «пролет» (stairs) / «пролёт», «все» / «всё», «узнаем» / «узнаём», and the faces draw it (U+0451, in every Cyrillic
  font the app and the card bundle). Text that arrives from Intl or the gazetteer («Соединенные Штаты») is shown as
  it comes.
- No Latin look-alikes inside Cyrillic words (Latin «c», «o», «e», «p» in «спутник» break search, copy and hyphenation):
  type Russian on a Russian layout.
- «№» only if a message needs a number sign (none does today).

### 6.2 Quotation marks

- «ёлочки» for every quotation and for a typed query: «Ничего не найдено по запросу «Moskva».»; „лапки“ only for a
  quote inside a quote. Never straight or “English” quotes.
- Names in quotes where Russian uses them: «Острова «Мир»», «Плотина «Три ущелья»»; when two closing marks would meet,
  the Russian rule writes one: «…«Три ущелья»» stays as two marks only when both quotations close there.
- Verdict names quoted in prose: «отмечен как «Увидено»».

### 6.3 Dashes, ellipsis, spaces

- **Em dash** — with spaces, an NBSP before it (`\u00a0—`), where Russian grammar puts it: between subject and
  predicate when both are nouns («Каждый кадр\u00a0— один и тот же квадрат», «Время пролёта\u00a0— это момент…»). Never
  as decoration. **About has none**, as the owner's English has none: there the sentence is rebuilt («Пиксель здесь
  не меньше 10 м. Автомобиль занимает один пиксель.», «шириной около 290 км у Sentinel-2 и 185 км у Landsat») and a
  credit takes a colon («Автор: @armaangupt0», the landing's too). Elsewhere, prefer the rebuilt sentence when it
  reads as well.
- **En dash** – without spaces for numeric ranges («10–30 м», «2015–2026», «30–45 градусов»).
- **Hyphen** for compounds («что-то», «3D-вид», «IP-адресов», «15-метровый»).
- **Ellipsis**: one character … (U+2026), no space before: «Поиск…».
- **NBSP** (U+00A0) between a number and its unit or counted noun («786 км», «7 дней», «256 спутников»), inside grouped
  numbers (Intl does it: «1 715»), before an em dash, between a clock and its zone («11:21\u00a0EST») where a line can
  break, and after a one-letter preposition in short lines that wrap («в\u00a0точке» in a narrow cell).
- The NBSP between a `num()` part and the noun after it is in the translator's string (`num(…), '\u00a0спутников'`).
- **No space** before . , : ; ? and no exclamation marks anywhere.

### 6.4 Numbers

- Decimal comma: «7,46», «0,31 м». Grouping with NBSP from four digits: «1 715», «12 847» (what
  `Intl.NumberFormat('ru')` prints; GOST would leave four digits ungrouped, but every Russian number in the product
  comes from Intl and must look the same).
- Percent and degree **tight**: «25%», «98,6°». ГОСТ 8.417 asks for a space before %, and Intl's own percent style
  prints «25 %»; the product writes «25%» as Russian news sites and apps do, and as `fmt('ru').pct` and the rich
  `num(…, '%')` parts print it everywhere (LOCALE_INFO has no `percentGap` for ru). If the owner prefers the GOST form,
  it is one flag in `LOCALE_INFO` and no copy change.
- Minus: «−» (U+2212).
- Approximate: «~10 км», «≈ 07:49», as the product prints them.
- Years are never grouped («с 2015 года»).
- Coordinates are not numbers in this sense: international notation, untouched (§4.2).

### 6.5 Dates

| Where | Form | Intl options |
|---|---|---|
| Prose | «1 ноября», «с 29 октября по 5 ноября», «1 ноября 2026 года» | `{ day: 'numeric', month: 'long' }` (+ year, «г.» → «года») |
| Standalone label with weekday (spoken) | «пятница, 6 ноября» | `{ weekday: 'long', day: 'numeric', month: 'long' }` |
| Short (chips, timeline, lists) | «вс, 1 нояб.» | `{ weekday: 'short', day: 'numeric', month: 'short' }` |
| Card stamp | «вс, 1 нояб. 2026 · 11:21 EST» | short parts + year, without Intl's «г.» |
| Week stamp | «7 дней по 1 нояб. 2026» | no weekday; «по», never «до» (a countdown) |
| Mono caps | «ВС, 1 НОЯБ. 2026» (CSS uppercases) | same |
| Landing kicker | «Последние 7 дней · 14 → 21 нояб. 2026 UTC» | |
| Time-lapse | «22 окт. 2015» (readout), «22 октября 2015 года» (spoken) | short / long parts at UTC |
| HUD, geometry | ISO, unchanged: «2026-11-08 03:31:07 UTC» | |

Month abbreviations (Intl): янв., февр., мар., апр., мая, июн., июл., авг., сент., окт., нояб., дек. («мая» is never
cut). Weekdays: пн, вт, ср, чт, пт, сб, вс. Months and weekdays are lowercase. They are CLDR's, never a hand-made table.

### 6.6 Time

- 24-hour clocks with a colon, as they arrive: «16:14:21», «07:49». No «ч» after a clock.
- Relative time: «только что» (< 45 s), «12 мин назад», «30 ч назад», days spelled out «2 дня назад», «5 дней назад»;
  future «через 3 ч», «через 2 дня». Spoken (screen readers): «12 минут назад», «41 час назад».
- Minutes and hours are written by the catalog with the GOST symbols («мин», «ч»), because Intl's short style prints
  «12 мин. назад» with a period after one symbol and not the other; days and every spoken form come from
  `Intl.RelativeTimeFormat('ru', { numeric: 'always' })` (`'auto'` would say «вчера», and the product says «30 ч назад»).
- Durations: «38 с», «4 мин 12 с», «1 ч 02 мин».
- Compact HUD ages: «<1 мин», «42 мин», «5 ч», «3 дн.».

### 6.7 Capitalisation and mono caps

- **Sentence case** everywhere: titles, buttons, tabs, sections («Как мы находим пролёты»). Never Title Case.
- Lowercase: months, weekdays, compass words, «интернет». Capital: «Земля» as the planet; «Солнце» only in «Высота
  Солнца» and the HUD.
- Proper names: the first word and proper nouns («Сектор Газа», «Западный берег», «Тихий океан», «Большой Барьерный
  риф», «Космические силы США»).
- **Mono caps labels** are stored in sentence case and uppercased by CSS («Высота» → ВЫСОТА); Cyrillic and ё uppercase
  correctly with `<html lang="ru">`. Canvas and satori use `toLocaleUpperCase('ru')`.
- **Never uppercased:** the serif place and the hero accent; units, in prose and in mono caps alike (ВЫСОТА 786 км,
  10 м, 7,46 км/с: DESIGN §3); satellite names in prose; the wordmark «Watched.»; URLs; whole sentences.
- Keep mono caps labels to two or three words: long uppercase Cyrillic with +0.08em tracking reads slowly.

### 6.8 Line breaking

- No automatic hyphenation (`hyphens: manual`) and no soft hyphens. If a line overflows, the copy gets shorter.
- Never break between a number and its unit or noun, between a clock and its zone, before a dash, or after a one-letter
  preposition in a narrow cell (NBSP, §6.3).
- Display lines break at phrase boundaries where they fit (§3.1).

### 6.9 Type

Russian uses the Cyrillic set-up Ukrainian brought (`data-script='cyrillic'`, `src/styles/scripts.css`, uk.md §6.10):
Instrument and Martian Mono for Latin letters and digits in every language, Noto Sans (variable width, pinned at the
display's 67.5%) and a static Noto Serif Display italic instance for Cyrillic, Martian Mono's own Cyrillic for mono
labels, bundled static cuts for the server card. Every letter Russian needs and Ukrainian does not (ё Ё ы Ы э Э ъ Ъ)
is inside the same `unicode-range` (U+0400–045F), and `api/_fonts/*-cyrillic.ttf` hold them (checked 2026-11-21 with
fontTools); « » „ “ … — – come from the Latin faces, as for Ukrainian. Nothing is added for Russian.

---

## 7. Length discipline

Russian runs about **25–35% longer** than English in running prose and **up to ×2** in two-word labels and buttons.
Martian Mono is monospaced and its Cyrillic has the same advance as its Latin, so mono budgets are exact character
counts: **8.0 px a character at 11 px, 7.0 px at 9.5 px** (caps, +0.08em).

| Where | Budget | ru |
|---|---|---|
| Timeline lane (9.5 px) | ≤ 8 characters | СНИМОК · ВЕРОЯТНО · ВОЗМОЖНО · В НЕБЕ (English OVERHEAD 8) |
| Phone share secondaries (three in 360 px, ≈ 90 px each at 11 px) | ≤ 11 characters | «Копировать» 10 · «Пост в X» 8 · «Сохранить» 9 · «Скопировано» 11 · «Повторить» 9 |
| Share link and post labels (48 px column) | ≤ 6 characters | «Ссылка» 6 · «Пост» 4 |
| Gallery filter segments (with the counter, 350 px) | about 8 each, the four together as long as English's 23 | «Все · Детальные · Погода · Радар» (3 + 9 + 6 + 5 = 23) |
| Gallery and lightbox status (box ≈ 14; on laptops after «10 м · 36 ч назад · ») | ≤ 14 characters, ≈ 12 after the photo's caption line | «Ясно в точке» · «Облака в точке» · «Тонкие облака» · «Тень облаков» · «Облачно · 93%» · «Облака 25%» · «Суточная мозаика» (16, measured) |
| Gallery photo counter (box ≈ 12) | ≤ 12 characters | «12 за неделю» for this week and that week alike |
| Cover lead chip | ≤ 20 characters | «Самый близкий кадр» 18 · «Последний ясный кадр» 20 · «Под облаками» 12 |
| Band value (21 px) | ≤ 9 characters | «Тепловой» · «Видимый» · «Цветной» |
| Spot value (21 px, under «Облака в точке») | ≤ 7 characters | «Ясно» · «Тонкие» · «Облака» · «Тень» |
| Landing search hint (beside 01 / МЕСТО) | the English's 25 | «Название, адрес, координаты» (27, ellipsised if needed) |
| Pin hint (beside 02 / ИЛИ ПОПРОБУЙ) | ≈ the English's 32 | «Или поставь метку на глобусе» (28) |
| Search status | short | «Поиск» · «Не найдено» · «Поиск недоступен» · «1 место · 3 места · 5 мест» |
| Card footer (beside the domain, 466 px row) | ≈ 20 characters | «Что смотрело на тебя» 20 · «Введи место на Земле» 20 |
| Pass list order label (after «Увидено ·», ellipsised, 208 px at most) | ≤ 24 characters | «сначала самый близкий» (21, 176 px); «самый близкий, затем новые» (215 px) never fits whole |
| Geostationary frame note (72 px square, 9.5 px mono caps) | ≤ 9 characters a word | «Нет открытых снимков» · «Плохое качество» · «Кадр не пришёл» («загрузился» overflows by 3 px) |
| Computing readout rows (390 px phone) | ≈ 40 characters | «Сверка 128 кадров и 1 204 пролётов» (34) |
| Geostationary row facts (mono caps, may wrap) | wraps at a « · » | «0.0°E · 39,6° над горизонтом · каждые 10 мин», no-break spaces inside each fact |
| Card readout labels (155 px column, 13 px) | ≤ 15 characters | «Пиксель мозаики» 15 |
| Plan corner labels | ≤ 15 / 20 characters | «Север вверху» 12 · «Зона обзора ±45°» 16 · «Наземная трасса» 15 · «Сближение 61 км» 15 |
| Header button box (Cancel / New search / Close) | about the English | «Отмена» · «Новый поиск» · «Закрыть» |
| Boot note at 320 px | one line | «Медленное соединение, ещё загружаем» (35) |
| Pass strip labels (four cells on a 360 px phone, ≈ 62 px) | ≤ 7 characters a line | «Высота» · «От надира» (wraps) · «Пиксель» · «Облака» (never «Облачность», 68 px) |
| Thumbnail cloud chip (48 px on phones ≤ 360 px) | ≤ 5 characters | «Облака» (6) is clipped there, as Polish «Chmury» is: reported to the layout, no shorter honest word |
| Pin move hint at 320 px | one mono line | «Зажми глобус, чтобы сдвинуть метку» (34, as English) |
| HUD top-left at 375 px (beside the sun line) | about the English's 14 | «Как это работает» (16) |
| Pass view time cells (164 px on a 390 px phone, 11 px mono caps) | ≤ 18 characters | «Сближение · UTC» · «Местное время» (13); «Сближение · местное» (19) wrapped |
| Cover chip under the photo (285 px at 360, 293 px in landscape) | ≤ 33 characters, one line | «Снимки недели: в основном облака» (32) |

Strategies, in order:
1. A noun instead of a verb phrase in labels («Курс», «Высота», «Повтор»).
2. Drop what the screen already shows: «Где я» on phones; «До трассы» (the readouts are all about the pass). The bare
   «Копировать» for the link is the phone row's limit, not this rule: on laptops it stands beside «Копировать
   карточку» and needs a key of its own to say «Копировать ссылку» (Appendix B).
3. The established short term over the descriptive one («таймлапс», «надир», «метеоспутник», «ИК»).
4. No «пожалуйста», no «Нажмите, чтобы…», no possessives the screen implies.
5. Never truncate a word or invent an abbreviation. Units, month and weekday abbreviations, «восх.» / «нисх.», «дн.»
   and «ИК» are the only abbreviations. A count that does not fit keeps its full noun and the layout is checked; it is
   never «спутн.».

| English | ru | Characters | Note |
|---|---|---|---|
| SURPRISE ME | НАУГАД | 11 → 6 | |
| USE MY LOCATION | МОЁ МЕСТОПОЛОЖЕНИЕ | 15 → 18 | Phones: ГДЕ Я (5); ≤ 400 px chip: РЯДОМ (5) |
| HOW THIS WORKS | КАК ЭТО РАБОТАЕТ | 14 → 16 | Checked on a 375 px phone beside the sun line |
| LAST 7 DAYS | ПОСЛЕДНИЕ 7 ДНЕЙ | 11 → 16 | One nowrap line with the date range |
| CLOSEST LOOK | САМЫЙ БЛИЗКИЙ КАДР | 12 → 18 | |
| TIME-LAPSE | ТАЙМЛАПС | 10 → 8 | |
| OFF-NADIR | ОТ НАДИРА | 9 → 9 | |
| PIXEL | ПИКСЕЛЬ | 5 → 7 | Mosaic: ПИКСЕЛЬ МОЗАИКИ (15) |
| PASSES | ПРОЛЁТЫ | 6 → 7 | Count unit: 12 ПРОЛЁТОВ |
| SHARE | ПОДЕЛИТЬСЯ | 5 → 10 | No shorter natural form |
| SHARE IMAGE | ПОДЕЛИТЬСЯ КАРТОЧКОЙ | 11 → 20 | Full-width phone button |
| COPY LINK | КОПИРОВАТЬ | 9 → 10 | «Копировать ссылку» (17) does not fit the phone's third (135 px); a laptop's 197 px button would hold it (Appendix B) |
| COPY IMAGE | КОПИРОВАТЬ КАРТОЧКУ | 10 → 19 | Desktop only |
| POST TO X | ПОСТ В X | 9 → 8 | |
| SAVE PNG / TRY AGAIN | СОХРАНИТЬ / ПОВТОРИТЬ | 8 → 9 / 9 → 9 | «Сохранить PNG» (13) does not fit |
| DOWNLOAD IMAGE | СКАЧАТЬ СНИМОК | 14 → 14 | Pass view |
| REPLAY | ПОВТОР | 6 → 6 | |

---

## 8. Sensitive content

**The product is about surveillance and privacy, and Russia is at war with Ukraine.** Russian readers live on every
side of that war: in Russia, in Ukraine, in exile, in countries afraid of it. Many know satellite and drone imagery
from the news of strikes, and in Russia publishing military positions or "discrediting" the army is a crime. A camera
word next to the reader's town is read through all of that. The copy stays flat and factual, and it never takes a side
by vocabulary, never euphemises and never sloganises.

**Banned vocabulary, with what to use instead:**

| Banned | Why | Use |
|---|---|---|
| следить, слежка, шпионить, под наблюдением, наблюдать за | surveillance and spying | смотреть |
| наводить, навести, наведение, наводчик | guiding a missile or artillery onto a place («наведение ракет», «навести удар») | смотреть, направлять (a company directs its cameras); field of regard «зона обзора» |
| накрыть, накрыло | hit with fire («накрыло ракетой», «накрыть огнём») | попасть в полосу обзора; clouds «закрыли точку» |
| зафиксировано (for "acquired") | «зафиксировано попадание / прилёт» is the wording of strike reports, and the globe shows it under a crosshair in signal orange | «Снимок» (a noun) |
| захват, захвачено, полоса захвата | "seized", as territory is | снимок; «полоса обзора» |
| прицел, цель, удар, поражение, прилёт | weapons («прилёт» is a strike in today's Russian) | метка, место / точка; «пролёт» for a pass |
| объект (for a place) | «объект» is also a target in strike reports | место, точка; «объект» only for the orbit catalog's objects |

«Метка» stays for the pin (map apps use it) but never stands next to наведение, цель or удар.

- Nothing invites readers to look for military positions, air defence, energy sites or the results of strikes. The ru
  curated and Surprise lists (§4.3) never point at Ukrainian or Russian military or energy sites, or at sites struck
  since 24 February 2022 whose damage is the reason to look.
- **The one explicit exception: `chernobyl`.** It stays in the pool because the place is the world-famous 1986 site,
  decommissioned since 2000, imaged by every public archive, and it carries no live military information (a 10 m pixel
  does not show the drone strike on its shelter on 14 February 2025, nor the Russian occupation of the zone in
  February–March 2022). Its label says what the pin is: «Чернобыльская АЭС», «Киевская область, Украина».
- Never claim the images identify people: «Тебя на снимке не видно» is the product's own line.

**War zones in the time-lapse** (Gaza Strip, West Bank, Ukraine, Lebanon; owner, 2026-11-16):

- Today no ru string names the war: the single-season time-lapse says «по одному каждую осень» and nothing more about
  why, as in every language. The season line stays a season.
- Names, if copy ever needs them: «Сектор Газа», «Западный берег реки Иордан» (then «Западный берег»), «Украина»,
  «Ливан», «Израиль».
- **Ukraine:** if copy ever names the war, it is **«война»** and the agent is named: «война России против Украины»,
  «полномасштабное вторжение России, начавшееся 24 февраля 2022 года» (never «вторжение … в Украину» or «на
  Украину»: the preposition takes a side, as «в / на Украине» does). Never «специальная военная операция», «СВО»,
  «спецоперация», «конфликт на Украине», «украинский кризис», «события на Украине», «освобождённые территории», «новые
  регионы», «зона СВО». Areas under occupation, when they must be named: «оккупированные Россией территории Украины».
  No slogans in either direction («Слава Украине», «Z», «Нет войне» are not product copy).
- Gaza, the West Bank and Lebanon: «война», no evaluative adjectives, no casualty figures, no labels for either side.
- **«на Украине» / «в Украине»:** the Russian normative form is «на Украине», and since 1993 Ukraine and many Russian
  speakers have asked for «в Украине»; each is read as a side. The copy never needs the locative: Ukraine appears in
  the nominative after a comma («Киевская область, Украина»), and a sentence that would need it is rewritten
  («на территории Украины» if a rewrite is impossible). The same for «на / в» with Crimea: «Крым, Украина».

**Crimea is Ukraine** (owner). The place data files Crimea under UA and the geocoders' answers are corrected, so a
search for Simferopol or Sevastopol and a pin on the peninsula show «Украина» in Russian too. No ru string or data label
may present Crimea or any occupied area as Russia, and none adds a qualifier («аннексированный», «российский»,
«спорный»). This will surprise some readers in Russia; the product follows international law and the UN General
Assembly's resolution 68/262, and says nothing about it in copy.

**Place-name politics:**

- Static copy uses **standard Russian exonyms**: Киев, Харьков, Одесса, Львов, Николаев, Запорожье, Днепр (the city's
  name since 2016; never «Днепропетровск», though the oblast is still «Днепропетровская»), Кропивницкий, Бахмут (never
  «Артёмовск»), Чернобыль, Припять, Киевская область. These are the Russian language's own words for those places, as
  «Варшава» and «Пекин» are, not a position: the English "Kyiv / Kiev" question is about the romanisation of the
  Ukrainian name and does not apply to Russian. The Ukrainian edition writes the Ukrainian forms.
- Gazetteer results (the offline list, Open-Meteo, Photon, Nominatim) are data, shown as they come («Kyiv»), and only
  the country after them is Russian.
- Neighbours: «Беларусь» (CLDR's name; never «Белоруссия» in our copy), «Молдова», «Кишинёв», «Казахстан», «Кыргызстан»,
  «Туркменистан».
- Country names come from `Intl.DisplayNames('ru')` as CLDR gives them («Тайвань», «Косово», «Палестинские
  территории», «Западная Сахара», «Гонконг (САР)», «Беларусь»); add no qualifiers in either direction.
- **Russian satellites** (Elektro-L, any Russian imaging satellite in a "could" row) are described as flatly as any
  other: «Российский геостационарный метеоспутник». No evaluative adjectives, no «наш»; the name stays as the catalog
  gives it («Elektro-L 3», not «Электро-Л № 3»).
- Privacy: the analytics backstop (`src/lib/telemetry.ts` street patterns) would need the Russian street words to catch
  a typed address (улица / ул., проспект / пр-т, переулок / пер., бульвар / б-р, площадь / пл., набережная / наб.,
  шоссе / ш., проезд / пр.); see Appendix B.

**Glaciers:** factual and calm: «конец сезона таяния», «ледник». No «умирает», «катастрофа», «тает на глазах».

---

## 9. Pitfalls and the reviewer's checklist

### 9.1 False friends, calques and ambiguous words

| Wrong | Why | Use |
|---|---|---|
| актуальный, фактический (for "actual") | «актуальный» means topical | настоящий |
| сцена (for "scene") | a stage | кадр |
| пятно (for "spot") | a stain | точка |
| резолюция (for "resolution") | a resolution of a meeting | разрешение; labels: пиксель |
| публичный архив | calque | открытый архив |
| ближайший пролёт / ближайший кадр | reads "the next, upcoming" | наибольшее сближение (label «Сближение»); самый близкий кадр |
| взгляд (for "look") | a gaze, an opinion | кадр |
| пролёт / пролетел (alone, as a label) | «пролёт» alone is also a stairwell or a bridge span; «пролетел» alone is slang for "missed out" | a count («31 пролёт») or a full sentence with «спутник» |
| высота (for an angle, unqualified) | that is altitude, and the pass view prints a geostationary satellite's 35 786 км | «над горизонтом» («39,6° над горизонтом»); «Высота Солнца» stays, qualified by its noun |
| загрузить (for "download image") | also "upload", "load" | скачать |
| локация, юзер, шерить, тапнуть, кликнуть, куки, апп | slang, anglicisms | местоположение, —, поделиться, нажать, нажать, файлы cookie, приложение |
| вид (for "view", unqualified) | also "species, type" | вид only in «3D-вид»; «просмотр», «открыть крупно» |
| на той неделе | also "last week" in speech | в ту неделю, за ту неделю |
| не менее / не меньше + count | governs the genitive | как минимум |
| опубликовано 1 снимок | agreement with 1 | опубликован 1 снимок |
| ты должен / ты был / ты готов | gender | нужно…, твоё место было…, present tense |
| лучший (for "clearest") | "best" | самый ясный |
| сателлит | archaic, a political "satellite" | спутник |
| датчик (for an imager) | a gauge, a sensor in a car | сенсор, камера |
| Солнце (everyday light) | capital only for the body in astronomy | солнце |
| фото (for every image) | radar and mosaics are not photos | снимок |
| ночь (for "dark") | the code knows only that the sun is down, twilight included | темно |
| Кадр (for the replay clock) | reads as an image's capture time | Повтор |
| над головой (in a pass sentence) | the overhead verdict's name; the reader may be elsewhere | над этой точкой |
| глядя на N° (an angle) | reads "looking at" | вбок под углом N° |
| N дней до [даты] (a span) | a countdown | N дней по [дату] |
| эхо (radar) | calque | отражённый сигнал |
| тонированный (photos) | tinted glass, sepia | обработанный |
| частная камера | a person's camera | камера с закрытым архивом |
| отметка (for a verdict) | a tick, a grade, a height mark | статус |
| поиски (for searches) | a search effort («поиски пропавших») | поисковые запросы |
| попробуй город | "taste a city" | попробуй ввести город |
| кадр может занять N с | the frame "occupies" the time | на большой кадр может уйти N с |
| сделано из данных | material («из дерева») | сделано на открытых данных |

**Words that look simple and are not:**
- "watched": the headline counts every pass; «смотрели» says only that they looked this way. «Увидено» is kept for
  passes with a real image. Do not swap the two.
- "pass": «пролёт» needs its ё and a number or «спутник» beside it in a label.
- "you": the reader's gender is unknown (§1.4); so are the satellite's and the place's (§5).

### 9.2 Reviewer's checklist (run it on every string)

1. **Address:** ты in sentences, never вы; buttons infinitives (or «Отмена», «Назад»); no past tense or short adjective
   with ты as subject.
2. **[PLACE]** only as a title before a full stop, after a colon, in parentheses or alone; no preposition before it;
   never an object or the subject of a past tense. Read it with «Москва», «Нидерланды», «Сочи», «Подмосковье».
3. **[SAT]** has «спутник» beside it wherever anything agrees; «он / его» only after that; a nameless satellite is
   «неизвестный спутник».
4. **Counts** go through `one / few / many / other`; the verb or participle sits inside the plural message; a governed
   count takes its case (§5.3); check 1, 2, 5, 11, 21, 22, 25, 111, 421.
5. **Vocabulary** matches the glossary: смотреть, Увидено, Могли смотреть сюда, пролёт, снимок / фото / кадр,
   опубликован, полоса обзора, зона обзора, таймлапс, точка, метка, приложение.
6. **Euphony:** «со» where §5.6 says, never before a slot.
7. **Numbers:** decimal comma, NBSP grouping and units (as `\u00a0` in source), «25%» and «98,6°» tight; coordinates
   and compass points in readouts untouched.
8. **Punctuation:** «ёлочки», „лапки“ inside, …, em dash with an NBSP before it and only where grammar needs it, the
   comma in «Вероятно, увидено», no exclamation marks.
9. **ё** written in every word that has it.
10. **Dates and times:** genitive months from Intl; no weekday after a preposition; «в [TIME]»; «по местному времени»;
    numeric relative times; no «г.» in stamps, «года» in prose.
11. **Length:** within §7's budgets; mono labels counted in characters.
12. **Register:** no канцелярит, calques, anglicisms, marketing words or emoji.
13. **Honesty:** the label says exactly what is on screen («снимок» vs «фото», «опубликован» only for what is public,
    «пиксель» not «разрешение», «Чернобыльская АЭС» for the plant, «темно» where the code knows only that the sun is
    down, «Повтор» for the replay's clock).
14. **Sensitive:** none of §8's banned words; war wording; exonyms in static copy; Crimea in Ukraine; no «на / в
    Украине».
15. **Read it aloud.** If it sounds translated, rewrite it from the meaning.

### 9.3 Test values

- Places: «Москва», «Россия», «Нидерланды», «Подмосковье», «Сочи», «Альпы», «Waterloo», «Palm Jumeirah», «Тихий
  океан», «55.75, 37.62», a 48-character label with «…», «Washington, D.C.» (ends on a full stop).
- Satellites: «ISS (ZARYA)» (crewed), «NORAD 60989», a nameless satellite, «SuperView Neo-1 01» (length), a two-name
  radar list and «A, B и ещё 7».
- Counts: 0, 1, 2, 4, 5, 11, 12, 14, 21, 22, 25, 101, 111, 401, 421, 1 715.
- Dates: a window starting on the 2nd («Со 2 по 9 ноября»), one across two months, one across a new year.

---

## Appendix A: reference translations of the core strings

Landing

| English | ru |
|---|---|
| Something / watched you / this week. | На этой неделе / что-то смотрело / на *тебя*. |
| Enter any place on Earth. See every satellite… | Введи любое место на Земле. Увидишь все спутники, пролетавшие над ним за последние 7 дней, и настоящие снимки, которые они сделали. |
| LAST 7 DAYS · 14 → 21 NOV 2026 UTC | Последние 7 дней · 14 → 21 нояб. 2026 UTC |
| 01 / PLACE · Search a place | 01 / Место · Поиск места |
| Name, address or lat, lon | Название, адрес, координаты |
| Searching · No match · Search unavailable | Поиск · Не найдено · Поиск недоступен |
| 1 match / 3 matches / 5 matches | 1 место / 3 места / 5 мест |
| Nothing matches "q". Try a city, a landmark, or coordinates. | Ничего не найдено по запросу «q». Попробуй ввести город, достопримечательность или координаты. |
| 02 / OR TRY · Or click the globe to drop a pin | 02 / Или попробуй · Или поставь метку на глобусе |
| Use my location · Locate me · Near me · Locating… | Моё местоположение · Где я · Рядом · Ищем… |
| Requesting position · Naming the place | Запрос местоположения · Определение названия |
| Your position goes to the Photon geocoder to name the place. We store only a ~10 km cell. | Мы передаём твоё местоположение геокодеру Photon, чтобы узнать название места. Храним только ячейку сетки размером ~10 км. |
| Your position isn't available right now. Search for a place instead. | Сейчас не удаётся определить твоё местоположение. Найди место через поиск. |
| The place search isn't answering. Coordinates such as 43.47, −80.54 still work. | Поиск мест не отвечает. Координаты вроде 43.47, −80.54 по-прежнему работают. |
| Surprise me · Drop a pin · Cancel | Наугад · Поставить метку · Отмена (Surprise me's name: «Наугад: случайное известное место») |
| Pin dropped: Waterloo. Press Enter or an arrow to see what passed over it. | Метка поставлена: Waterloo. Нажми Enter или стрелку, чтобы увидеть, что пролетало здесь. |
| Built by @armaangupt0 | Автор: @armaangupt0 |
| Loading Watched · Slow connection, still loading | Загрузка Watched · Медленное соединение, ещё загружаем |
| Watched · Something watched you this week (tab) | Watched · На этой неделе что-то смотрело на тебя |
| 3D view unavailable · WebGL 2 is off in this browser | 3D-вид недоступен · В этом браузере отключён WebGL 2 |
| Could not load the orbit catalog. Check your connection and try again. | Не удалось загрузить каталог орбит. Проверь соединение и попробуй ещё раз. |

Results

| English | ru |
|---|---|
| Computing · Orbital catalog → Catalog loaded | Расчёт · Каталог орбит → Каталог загружен |
| Propagate orbits · 7 days → Orbits propagated | Расчёт орбит · 7 дней → Орбиты рассчитаны |
| Sentinel-2 + Landsat archives → Archives searched | Архивы Sentinel-2 + Landsat → Архивы проверены |
| Match scenes to passes → Scenes matched | Сверка кадров с пролётами → Кадры сверены |
| Verifying weather mosaics | Проверка суточных мозаик |
| New search · Change · Recent · All passes | Новый поиск · Изменить · Недавние · Все пролёты |
| The sun never rose, so no daylight camera could see it. | Солнце здесь так и не взошло, поэтому ни одна дневная камера не могла увидеть это место. |
| Weather satellites still swept it in infrared, 42 times. | Зато метеоспутники снимали это место в инфракрасном диапазоне: 42 раза. |
| Sentinel-2 or Landsat crossed it 3 times in daylight, but no scene has been published yet. | Sentinel-2 или Landsat пролетали здесь днём 3 раза, но ни одного кадра ещё не опубликовано. |
| No open imaging satellite crossed it in daylight. | Днём здесь не пролетал ни один спутник, который публикует свои снимки. |
| 12 detailed images (…) · 3 daily weather mosaics (…) · 2 radar images (…) · 1,008 full-disc images (…). 1,204 passes from 412 imaging and crewed satellites checked. | 12 детальных снимков (Sentinel-2, Landsat, 10–30 м) · 3 суточные мозаики (250–375 м) · 2 радарных снимка (Sentinel-1, 20 м) · 1 008 снимков полного диска с геостационарных метеоспутников (2–5 км; показан самый свежий снимок каждого). Проверено 1 204 пролёта 412 съёмочных и пилотируемых спутников. |
| Photos · All · Detailed · Weather · Radar | Снимки · Все · Детальные · Погода · Радар |
| Closest look · Last clear look · Clouded over · Daily mosaic | Самый близкий кадр · Последний ясный кадр · Под облаками · Суточная мозаика |
| This week's passes saw mostly cloud · Here's the last clear look | Снимки недели: в основном облака · Вот последний ясный кадр |
| 12 this week / 12 that week | 12 за неделю |
| Clear · Thin cirrus · Cloud shadow · Cloud at spot · Clouded · 93% · Cloud 25% | Ясно · Тонкие облака · Тень облаков · Облака в точке · Облачно · 93% · Облака 25% |
| Reading the pixel at your spot… · Clear over your spot. · Your spot was in cloud shadow. | Читаем пиксель в твоей точке… · Над твоей точкой ясно. · Твоя точка была в тени от облаков. |
| Sentinel-2C image of Waterloo. The place is at the centre. (alt) | Снимок со спутника Sentinel-2C: Waterloo. Это место в центре кадра. |
| Time-lapse · This place, year by year | Таймлапс · Это место год за годом |
| Replay this pass · View · Share | Повтор пролёта · Открыть · Поделиться |
| Show all 31 rows · Show all 31 satellites · Show 40 more · Show fewer · 12 left | Показать все строки (31) · Показать все спутники (31) · Показать ещё 40 · Свернуть · ещё 12 |
| 31 passes · 12 sats (group header) | 31 пролёт · 12 спутников |
| Shared with you · Sentinel-2C watched Waterloo | С тобой поделились · Waterloo. Сюда смотрел спутник Sentinel-2C. |
| Something watched you this week too. (invite) | На этой неделе что-то смотрело и на тебя. |
| No public image · Poor quality · No image just now · Frame unavailable | Нет открытых снимков · Плохое качество · Сейчас снимка нет · Кадр не пришёл |

Pass detail readouts

| English | ru |
|---|---|
| Altitude · Off-nadir · Pixel · Cloud (scene) · Cloud at spot | Высота · От надира · Пиксель · Облака (кадра) · Облака в точке |
| Clear · Cirrus · Cloud · Shadow | Ясно · Тонкие · Облака · Тень |
| Closest · UTC / Closest · local | Сближение · UTC / Местное время |
| Ground distance · Elevation from you · Ground speed · Heading | До трассы · Над горизонтом · Путевая скорость · Курс |
| SSW · Asc / Desc | SSW · восх. / нисх. |
| Sun elevation (Day / Twilight / Night) | Высота Солнца (день / сумерки / ночь) |
| Field of regard · Swath · In swath · In view · Window | Зона обзора · Полоса обзора · В полосе обзора · В поле зрения · Окно |
| Band: Infrared / Visible / Colour | Канал: тепловой / видимый / цветной |
| Scan line here · Above the equator at · In your sky · Scan direction (North → south) | Линия здесь · Над экватором · В твоём небе · Направление линии (север → юг) |
| Line speed here · Coverage: Full disc, every 10 min · This scan | Скорость линии · Охват: полный диск, каждые 10 мин · Это сканирование |
| Download image · Downloading… · Open image to save it · View source | Скачать снимок · Скачивание… · Открыть снимок, чтобы сохранить · Источник |
| No public image: commercial archives are private. Plan view of the pass. | Опубликованного снимка нет: коммерческие архивы закрыты. Схема пролёта. |

Share sheet

| English | ru |
|---|---|
| Share this pass · Share this image · Share this week | Поделиться пролётом · Поделиться снимком · Поделиться неделей |
| Share image · Preparing image… · Share | Поделиться карточкой · Готовим карточку… · Поделиться |
| Copy link · Copied · Post to X · Copy image · Save PNG · Try again | Копировать · Скопировано · Пост в X · Копировать карточку · Сохранить · Повторить |
| Link · Post (field labels) | Ссылка · Пост |
| Creating link… · Made when you share | Создаём ссылку… · Появится, когда поделишься |
| The card could not be rendered here; the link still works. | Здесь не удалось нарисовать карточку, но ссылка работает. |

Time-lapse

| English | ru |
|---|---|
| Time-lapse of Waterloo (aria) | Таймлапс: Waterloo |
| One clear look a year · since 2015 | Один ясный кадр в год · с 2015 года |
| 12 clear looks · one a year / one each autumn | 12 ясных кадров · по одному в год / по одному каждую осень (каждую зиму, каждую весну, каждое лето) |
| Listing the archive · Choosing clear looks · Developing frames | Просмотр архива · Выбор ясных кадров · Проявка кадров |
| Too cloudy here for a time-lapse. · 2 clear looks since 2015 · 3 needed | Здесь слишком облачно для таймлапса. · 2 ясных кадра с 2015 года · нужно 3 |
| Each frame is the same 10 km square… | Каждый кадр — один и тот же квадрат 10 × 10 км, снятый спутником Sentinel-2 и обработанный так же, как все фото здесь. Для каждого года мы ищем кадр другого сезона. Год без ясного кадра пропущен. (one season: «Все кадры сняты в одном и том же сезоне. Год без ясного кадра в этом сезоне пропущен.») |
| Video · Video failed · Save video · Rendering 42% · Link copied | Видео · Не удалось · Сохранить · Создание 42% · Ссылка скопирована |
| Waterloo, year by year (share title) | Waterloo: год за годом |

---

## Appendix B: engineering notes (cost and speed)

Russian adds no running cost and keeps the product fast. Every item is static copy in the ru chunk; numbers, dates,
plurals, lists, relative times and country names come from the browser's `Intl`; the fonts are the Cyrillic files
Ukrainian already ships (unicode-range, so a ru page downloads them once and an English page never does). Nothing is
translated at runtime, no service is called, nothing new is stored.

Found while writing this guide, for the coordinator (none is a copy change):

1. **Registration** (shared files, not edited here): `src/i18n/ru/boot.ts` into `src/i18n/bootText.ts`,
   `api/_lib/i18n/card/ru.ts` into `api/_lib/i18n/card/server.ts`, and `'ru'` into the `LOCALES` list of
   `api/_lib/cardGlyphs.test.ts` so every ru card is checked against the bundled fonts.
2. **Cyrillic searches skip the offline list** (`shardOf` returns undefined for a non-Latin key), so every «Москва»
   typed on a Russian keyboard goes to Open-Meteo, the free tier every visitor shares. The fix the Ukrainian guide
   proposed (transliterate the query only, in the language's chunk, before `placeKey`) applies to Russian with the
   GOST 7.79-2000 system B / BGN-like table GeoNames uses for Russia (Москва → moskva, Санкт-Петербург →
   sankt-peterburg, Новосибирск → novosibirsk, ё → e, й → y, х → kh, ц → ts, ч → ch, ш → sh, щ → shch, ы → y, ь ъ
   dropped, э → e, ю → yu, я → ya). About 0.3 kB.
3. **Russian names for places** (Москва for "Moscow", Киев for "Kyiv") would need a generated `exonyms` table
   (`scripts/build-exonyms.ts`); the ru bundle ships none for now, so gazetteer names appear as they come, in Latin.
4. **Street words** for the analytics backstop (`src/lib/telemetry.ts`): §8.
5. **Percent:** §6.4 (one flag if the owner wants «25 %»).
6. **Dev servers in a git worktree**: a worktree whose `node_modules` is a symlink to the main checkout gets 403 for
   every font under `node_modules` from Vite (`server.fs.allow`), and Cyrillic then falls back to a system face at full
   width: the hero looks too wide. Allow the main checkout in `server.fs.allow` (or install `node_modules` in the
   worktree) before judging Cyrillic layout there.
7. **Copy link on laptops** (`share.copyLink`, `src/ui/share/ShareSheet.tsx`): one key serves the phone row, where
   «Копировать» (10) is all a third of 360 px holds, and the laptop row, where it stands beside «Копировать карточку»
   and reads as "copy" what, the card? A laptop button is 197 px and holds «Копировать ссылку»: a second key, or the
   component choosing a long form where it fits, fixes it for every language. Both reviewers and the translator
   flagged it.

---

## Review

Two independent native reviews read every ru namespace, the card and this guide on 2026-11-21 (A: the prose, as a
native reader; B: accuracy against the English and the code that shows each string). What changed:

- **Honesty** (B): «Здесь было темно», not «ночь», for the likely-dark line (sun < 0°) and the infrared frame (sun <
  6°); the replay clock «Повтор» (A, B); «39,6° над горизонтом», not «высота» (A, B: §4.1 contradicted §9.1).
- **Misleading readings** (A): «3 дн. назад, устарел»; «7 дней по 1 нояб.»; «Отсюда ни один … не виден выше 5°»; «на
  обращённой к ним стороне Земли»; «Мы передаём…, чтобы узнать…» (the «чтобы» clause had the wrong subject); «Фото …
  мы готовим…: выравниваем цвета, сглаживаем…» («сглаживаем их» smoothed the colours).
- **Calques and wording** (A, B): «фрагмент с твоей точкой в центре», «рассчитываем по SGP4 … путь», «принимает
  отражённый сигнал», «обработанный», «вбок под углом», «снял это место в темноте», «Не отклоняя камеру» (no «Даже»),
  «используются в прогнозах погоды», «Сплошная облачность», «Сделано на открытых данных», «Перемещаться по
  подсказкам», «поисковые запросы», «Место без названия» (A's «Безымянное место» is literary), «Попробуй ввести…»,
  and the satellites' blurbs.
- **Consistency** (A, B): «в зоне досягаемости»; «камера с закрытым архивом»; «статус»; «C-диапазона»; the sun's
  phase lowercase; «Штат Вашингтон»; «Введи место на Земле»; «прямо над этой точкой» (B); «пролетел здесь на высоте…»
  on the post and the pass page (A, B); «Проверить моё место».
- **About** (B): its eight em dashes are gone, rebuilt (§6.3). **Fit** (B, measured): the zero week card sets in three
  lines; «Сверка 128 кадров и 1 204 пролётов»; «В полосе обзора, снимок ещё не опубликован».
- **This guide** (A, B): §2.3's premise (the footer is a label now), the cirrus row, §8's «вторжение … в Украину»,
  Appendix A's "Show all 31 rows", the §3.8 stale form, and §9.1's new rows.

Decided between the reviewers, or against both where the screen said so:

- Infrared: A's two sentences with a colon, not B's dash (one fact a sentence, §2.1). Radar: A's «вбок под углом»,
  not B's kept «глядя на». Keys: A's «Перемещаться», not B's «Листать» (↑↓ move a selection; «листать» turns pages).
  Timeline: A's «съёмочный с открытым архивом». Gallery chip: B's «Под облаками, включая твою точку». «Ещё готовится. На
  большой кадр может уйти 10 с и больше.»: neither A's (the verb twice) nor B's.
- Order label: both proposals were cut with an ellipsis on every screen (measured 253 and 215 px in a 208 px cell):
  «сначала самый близкий» (176), as French and Dutch drop "then newest".
- Frame note: «Кадр не загрузился» (both) overflows the 72 px square by 3 px: «Кадр не пришёл», as the gallery's
  «Снимок не пришёл».
- No satellite: B's «За неделю…» dropped "this week" and still set in four lines; the word order fixes it.

Rejected: A's «Скан · UTC» for "Scan line here" («скан» drops "here", blurs with «Это сканирование» on the same grid,
and «линия» is that screen's word: «Скорость линии», «Направление линии»); B's «Сентрал-парк» chip (§4.3). Copy link
on laptops (A, B, the translator) is right, but no ru string can fix it: Appendix B, item 7.

### Visual pass (2026-11-22)

Every screen measured at 360×780, 390×844, 430×932, 844×390 and 1280×800 against English at the same size
(`getBoundingClientRect` and `scrollWidth` over every visible text node, plus screenshots). Three strings changed:

- **Pass view time cells**: «Сближение · местное» (19) wrapped to two lines in its 164 px cell on a 390 px phone and
  pushed its value a line below its neighbour's; English sets one line. Now «Местное время» (13), as German has
  «Ortszeit»: it stands in the same row as «Сближение · UTC», so the moment is named once. The geostationary row's
  «Линия здесь · местное» gets the same «Местное время» beside «Линия здесь · UTC».
- **The cloud chip on the last clear look**: «На этой неделе на снимках в основном облака» (43) took two lines at 360,
  390 and 844 px and left «облака» (or «основном облака») alone below; English takes one line from 390 px. Now
  «Снимки недели: в основном облака» (32), one line at every size, 360 px included.
- **The week card's headline**: the 466 px column set «На этой неделе сюда / смотрели / 219 спутников.», a verb alone
  on its line. «сюда» and its verb are now tied with a no-break space («На этой неделе / сюда смотрели / 219
  спутников.»); the pass card («Сюда смотрели 219 спутников.») is unchanged on screen.

Checked and kept: relative days stay spelled out (§6.6). On a 390 px phone the last clear look's caption drops its age
(«21 день назад») by 5 px because «Открыть» is wider than "View"; «21 дн. назад» would win one character and fit only
this case, so the fit rule's drop stands. Reported to the layout, not changed here: the HUD's replay clock over the
language name, the results panel over it in landscape, and a count parted from its noun at a line end (the animated
count is an atomic inline, so the no-break space after it does not hold).

## Decisions log

| # | Question | Decision |
|---|---|---|
| 1 | ты or вы | ты, with infinitive buttons and мы for the product (§1); the gender trap handled by rewrites (§1.4). |
| 2 | Product verb | смотреть: takes «сюда», so the results headline needs no case for the place; наблюдать за rejected as surveillance and for needing an object (§3.1, §3.3). |
| 3 | Verdict titles | Увидено · Вероятно, увидено · Могли смотреть сюда · Над головой; «Снято» and «Есть снимок» rejected (§3.6). |
| 4 | "made public" with counts | the participle agrees and sits inside the plural message; «как минимум», never «не менее» (§3.4). |
| 5 | Card hero | five one-word lines; «На этой неделе» is 478 px against the 466 px column (§3.1). |
| 6 | "closest look" | «самый близкий кадр»; «ближайший» reads "next" (§4.1, §9.1). |
| 7 | ё | everywhere in our text (§6.1). |
| 8 | Percent | tight «25%»; GOST's «25 %» is one flag away (§6.4). |
| 9 | Minutes and hours | GOST symbols «мин», «ч» written by the catalog; Intl for days and spoken forms (§6.6). |
| 10 | "that week" | «в ту неделю» / «за ту неделю»; «на той неделе» is ambiguous in speech (§0). |
| 11 | Exonyms in static copy | standard Russian names (Киев, Харьков, Одесса, Днепр) (§8). |
| 12 | «на / в Украине» | never needed: nominative after a comma; «на территории Украины» if a rewrite is impossible (§8). |
| 13 | Crimea | Ukraine, no qualifier, nothing said in copy (§8). |
| 14 | Compass in readouts | Latin abbreviations as they arrive; Russian words in prose, three tables (§4.2). |
| 15 | Link field label | «Ссылка» (6 characters, checked in the 48 px column; «URL» if it ever does not fit) (§7). |
| 16 | "dark" | «темно», never «ночь»: the code knows that the sun is down, not that it is night (§3.5). |
| 17 | Replay clock | «Повтор» in the HUD, «Время в повторе пролёта» on the scrubber; «кадр» is an image's word (§3.8). |
| 18 | Elevation angle | «над горизонтом» everywhere, the geostationary row included; the «высота 39,6°» exception is gone (§4.1, §9.1). |
| 19 | Em dash in About | none, by rebuilding the sentence, as the owner's English has none (§3.9, §6.3). |
| 20 | The word for a verdict | «статус» (§4.1). |
| 21 | Card footer | «Что смотрело на тебя» (a label, not a question) · «Введи место на Земле» (§2.3, §3.7). |
| 22 | Week stamp | «7 дней по [дату]»; «до» reads as a countdown (§3.7, §6.5). |
| 23 | No satellite | «…ни один известный нам спутник сюда не смотрел.», the negation last (§3.3). |
| 24 | Straight over the place | «прямо над этой точкой»; «над головой» is only the verdict (§3.5). |
| 25 | Pass list order | «сначала самый близкий», the one phrase that fits its 208 px cell whole (§7). |
