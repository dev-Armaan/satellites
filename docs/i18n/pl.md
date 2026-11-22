# Watched: Polish (pl) localisation style guide

Final, 2026-11-19. Supersedes `pl.draft.md`. Every decision below is final. The closing "Decisions log" resolves each
item of the native review (`pl.critique.md`). This guide binds every `pl` string the product shows, speaks or sends:
the landing, results, pass detail, gallery and photo viewer, "Rok po roku" (the time-lapse), the share sheet, share
cards, share pages and post text, the HUD and globe, About, errors, the loading screen, alt text and aria labels. It is
written in English for the team, and every example is the Polish a translator ships. It covers **pl-PL**, current
orthography (RJP / WSO PWN).

Sources of truth: `docs/DESIGN.md` §3 (type) and §7 (voice, verdict vocabulary), `docs/I18N.md`,
`docs/i18n/TRANSLATING.md`, the English namespaces in `src/i18n/en/`, `api/_lib/i18n/card/en.ts`,
`src/ui/results/lib/copy.ts`, `src/ui/results/lib/meta.ts`, `api/_lib/i18n/parts.ts` (a rich message may put its
parts in any order) and `api/_lib/i18n/format.ts` (`plural` takes `one | few | many | other` for pl, and a missing form
is a compile error). If this guide and a pl string disagree, the guide wins and the string is fixed. If this guide and
the English disagree on a fact, the English wins: the guide is wrong, so report it.

**Notation.** `[PLACE]` is a place label from the gazetteer, `[SAT]` a satellite name, `[NUM]` a count (a mono span),
`[TIME]` a 24-hour clock with its zone (`16:14:21 UTC`, `11:21 EST`), `[DATE]` a date from Intl and `[DIR]` a compass
word. `*…*` marks the serif accent (one per screen) and `**…**` the bold (`strong`) phrase. Examples show ordinary
spaces for readability. Where §6.3 asks for a no-break space, the catalog string has U+00A0, written as the `\u00a0`
escape in source so a reviewer can see it. Code examples use the real message API: TypeScript functions,
`const f = fmt('pl')`, `f.plural(n, { one, few, many, other })`, `f.int`, `f.dec`, and the parts `num()`, `accent()`
and `strong()`.

**Polish has two problems English doesn't.** Most of this guide follows from them:
1. **Nothing inserted at runtime can be declined.** Polish puts nouns in seven cases: *Warszawa* becomes *Warszawę*,
   *Warszawy*, *nad Warszawą*, *w Warszawie*. A country from `Intl.DisplayNames('pl')` (*Niemcy*, *Stany
   Zjednoczone*, *Polska*) can also be plural or adjectival. So a [PLACE] slot goes only where the nominative is
   correct.
2. **The past tense shows gender.** *Przeleciał* (m.), *przeleciała* (f.), *przeleciało* (n.), *przeleciały* (pl.).
   Code doesn't know a satellite's grammatical gender, and it doesn't know the reader's. So neither [SAT] nor "you" is
   ever the bare subject of a past-tense verb.

**Cost and speed (owner requirement: no extra cost, and still fast).** Polish adds no running cost and no wait:
- **Strings are static.** The pl catalog is its own lazy chunk (a few kB gzipped), modulepreloaded by the boot script
  in parallel with the app. Nothing is translated at runtime, no translation API or service is called, nothing new is
  stored, and there are no per-language images or cards. An English visitor downloads exactly what they did before.
- **Numbers, dates, plurals, lists, relative times and country names come from the browser's built-in `Intl`**
  (through `fmt('pl')` and `api/_lib/i18n/dates.ts`). They cost no bytes, no library and no request. Never format them
  by hand in a string.
- **Fonts.** Polish needs ą ć ę ł ń ś ź ż and their capitals, which live in the **latin-ext** subsets (ó, „ ” « » – …
  ° are in latin). The `@fontsource` CSS already declares latin-ext with `unicode-range`, so an English page fetches
  nothing new. A Polish page fetches three static woff2 files once, from our own host, and caches them: Instrument Sans
  latin-ext 18.9 kB, Martian Mono latin-ext 24.7 kB and Instrument Serif italic latin-ext 12.4 kB (≈ 56 kB). There is no
  font CDN, no paid service and no new kind of request.
- **Keep the first screen from swapping faces (engineering, free).** Today `loadFirstFonts` (`src/app/controller.ts`)
  calls `fonts.load(f)` with no text. The spec then samples a space, so only the *latin* faces load, and the hero's
  *ś ę ł* would swap face in the middle of the wipe. The fix covers every language at once: load `FIRST_FONTS` with
  the first screen's own text, `fonts.load(f, plain(msgs(enLanding).hero))`. That loads exactly the faces the hero
  draws, latin and latin-ext together. English is unchanged, because its hero is all latin. Also add the three
  latin-ext files to the boot script's font preload for `pl`, keyed like the Cyrillic and Arabic entries in
  `vite.config.ts` `SCRIPT_FONTS`, so they download in parallel with the app chunk instead of after the JS runs. A
  sample of Polish letters alone (the draft's `'ąćęł…'`) is wrong: `FontFaceSet.load` then awaits only the latin-ext
  faces, and the rest of the hero swaps.
- **Canvases already do this.** `renderCardPng` (`src/ui/share/card.ts`) loads its faces with the card's own text
  (`JSON.stringify(spec)`). The time-lapse video (`video.ts`) loads its label face with the words it draws, and its big
  year is digits. The server card bundles latin-ext TTFs (`api/_fonts/*-latin-ext.ttf`), whose character maps hold
  every Polish letter and „ ” « » – … ° (checked). → and ≈ are not in the Martian Mono subsets: they fall back, as they
  do in English today. Don't add more of them.
- **The loading screen** shows before any web font is guaranteed. Its Polish slow line uses only latin letters
  (§3.1).
- **File names** (share PNG, MP4) must map ł/Ł before NFKD (§6.2). It is one replace with no cost.
- **Length.** Polish runs about 25 % longer than English in prose, and up to twice as long in short labels. Section 7's
  budgets keep every layout on its existing breakpoints.

---

## 0. Decisions at a glance

| Question | Decision |
|---|---|
| Address | **ty**, lowercase (*cię, ciebie, twój, tobie, u ciebie, nad tobą*), on every surface. Never Pan/Pani/Państwo, never a capitalised *Ty/Cię/Twój*. |
| The reader's gender | The reader is never the subject of a past tense, a conditional or a gendered adjective. Use the present, the future, the imperative, the impersonal (*widać, da się, -no/-to*), or make the reader the object or possessor (*cię, twoje niebo*). |
| Product verb "watched" | **obserwować** (*Coś cię obserwowało*). With a place it becomes the verbless frame **[PLACE] pod okiem …** ("under the eye of"). Never *oglądać, obejrzeć, śledzić, szpiegować, inwigilować, fotografować*. |
| Hero (landing) | `Coś *cię*` / `obserwowało` / `w tym tygodniu.` |
| Hero (share card) | Four lines: `Coś *cię*` / `obserwowało` / `w tym` / `tygodniu.` (measured: three lines overflow the card's 466 px column). |
| Results headline | `*[PLACE]* **pod okiem [NUM] satelitów** w ostatnich 7 dniach.` |
| None headline | `*[PLACE]* poza zasięgiem znanych nam satelitów w tym tygodniu.` |
| Second line | `Opublikowano [NUM] obrazów.` (impersonal *-no*, so nothing agrees) · zero: `W tym tygodniu nie opublikowano żadnych obrazów.` |
| [PLACE] | Nominative only: subject of a verbless frame, after a colon, a heading, or in parentheses. In prose it is *to miejsce / tu / stąd*. Never after a preposition, never an object, never the subject of a verb. |
| [SAT] as subject | Behind a classifier noun: **satelita [SAT]** (m.) everywhere, **stacja [SAT]** (f.) for a crewed station, recognised by its name (`/^(ISS|Tiangong)\b/`, §5.2). In nominal frames, the genitive: *satelity [SAT]*. |
| Nameless satellite | The code passes `sat` undefined. Each sentence says *satelita* on its own (*Satelita przeleciał tu…*, *z nieznanego satelity*). `aSatellite` is *Satelita*, for chips and the callout only. |
| Plurals | CLDR `one` / `few` / `many` / `other`, all four always written. `many` covers 0, 5–21, 25–31, 100, 101, 112 and 1000. `other` is fractions only. Zero is a branch in the message (`n <= 0 ? … :`). |
| Verdicts | **Pod okiem** · **Zapewne pod okiem** · **Satelita mógł spojrzeć** · **Nad głową**. Lanes: *Zdjęcie · W kadrze · W zasięgu · Nad głową*. |
| Photo vs image | Mirror the English key by key: photo → *zdjęcie*, image → *obraz*. The exception: a string that names or counts radar images says *obraz* (*obraz radarowy*, never *zdjęcie radarowe*). |
| Time-lapse | The feature is **Rok po roku** (indeclinable, native). The loanword *timelapse* is not used. |
| Buttons | 2nd-person singular imperative: *Udostępnij*, *Pobierz obraz*, *Kopiuj link*, *Odtwórz*, *Zaskocz mnie*. States in progress take the imperfective verbal noun: *Pobieranie…*, *Przygotowywanie obrazu…*, *Ponawianie…*. |
| Mono caps labels | Nouns in the nominative, no verbs: *WYSOKOŚĆ*, *ELEWACJA*, *OD PIONU*, *PIKSEL*, *PRZELOTY*. |
| Numbers | Decimal comma, no-break-space grouping from five digits (Intl: *1715*, *12 847*), *25%*, *12,4°*, *786 km*. |
| Coordinates | International notation, exactly as they arrive: *52.23, 21.01*, *SŁOŃCE 16.2°S 063.0°E*, a seat *(0.2°W)*. |
| Relative times | Intl short style: *41 godz. temu*, *12 min temu*, *2 dni temu*, *za 3 godz.*, and *przed chwilą* under 45 s. Spoken: Intl long. |
| Quotes | „ ” outside, « » inside. |
| Compass | Readouts keep the international letters N S E W (NNE, WSW…). Prose uses Polish words in two cases (*na zachód*, *na zachodzie*). |

---

## 1. Register and address

### 1.1 The decision: ty everywhere, lowercase

Watched speaks to one person, alone with a globe, about something that happened to them. In Polish that person is
**ty**. The Polish consumer products people use every day (Google, Apple, Spotify, Allegro, Messenger) all address
their users in the second person singular. The hero only works with ty: *Coś cię obserwowało w tym tygodniu.*

The formal *Pan/Pani* fails twice. It is gendered, and code doesn't know the reader's gender: the hero would have to
be *Coś Pana obserwowało* or *Coś Panią obserwowało*. It is also the register of banks, doctors and the tax office.
"Something watched you, Madam" turns the uncanny moment into a letter from an institution.

**Lowercase.** A capitalised *Ty / Cię / Twój* is a courtesy convention for letters to one known person. In mass
copy it is optional, and here it is wrong. It makes the instrument sound like customer service, and *Coś Cię* puts two
capitals into a three-word poster line. Write *cię, ciebie, twój, twoje, tobie, u ciebie, nad tobą*. A pronoun takes a
capital only at the start of a sentence (*Twoje niebo…*, *Ciebie też…*).

**"We".** The product speaks as *my*, in the present tense: *Liczymy…*, *Przechowujemy tylko…*, *pokazujemy*,
*oznaczamy jako…*. Avoid *my* in the past tense (*zrobiliśmy, znaleźliśmy*). Rephrase it instead: *Nie ma
opublikowanego obrazu*, not *Nie znaleźliśmy obrazu*. *Żadne z tych zdjęć nie jest nasze*, not *Nie zrobiliśmy*.

### 1.2 Register by surface

| Surface | Register | Example | Why |
|---|---|---|---|
| Display headlines (hero, results, About title, share card) | Declarative third person about satellites and places. The reader appears only as an object (*cię*). Verbless frames wherever a place is inserted. | *Coś cię obserwowało w tym tygodniu.* · *Warszawa pod okiem 256 satelitów w ostatnich 7 dniach.* | Headlines carry the uncanny fact. Nominal headlines (*X pod okiem Y*) are idiomatic Polish news style and keep the place name grammatical. |
| Sentences and prose (sub line, pass detail, notes, post text) | ty for the reader, in the present, future or imperative (*Wpisz…*, *Zobacz…*). Third person past for satellites, behind a classifier. *my* in the present for the product. | *Wpisz dowolne miejsce na Ziemi.* · *U ciebie było ciemno.* | The second person stays intimate without showing gender. |
| Buttons | 2sg imperative. Perfective for one completed act (*Udostępnij, Pobierz, Zapisz, Zamknij*), except where the system convention is imperfective (*Kopiuj link*, as the OS says *Kopiuj*). | *Udostępnij* · *Pobierz obraz* · *Spróbuj ponownie* | This is the convention of Windows, macOS, Android and iOS in Polish. |
| Status lines and states in progress | The imperfective verbal noun, with an ellipsis where English has one. | *Pobieranie…* · *Tworzenie linku…* · *Ustalanie nazwy…* · *Ponawianie…* | A verbal noun names a state and has no gender. The perfective noun (*Przygotowanie*) names the act or its result, which is wrong for a state that is still running. |
| Mono caps labels | Nouns or noun phrases in the nominative. No verbs, and no pronouns except *twój* in a few readouts. | *WYSOKOŚĆ* · *OD PIONU* · *NAD PUNKTEM* | Instrument labels name a quantity. |
| Error notices | Impersonal and factual. The system or the archive is the subject, or use *nie udało się* or an *-no* form. No apology, no blame. | *Archiwum nie odpowiedziało.* · *Nie udało się wczytać katalogu orbit.* · *Coś poszło nie tak.* | Gender-free, calm and exact. *Przepraszamy* is filler. |
| About page | ty + *my*, conversational but exact, in the present tense. Short paragraphs, plain words. | *Czy mnie widać? Nie. Piksel ma tu w najlepszym razie 10 m.* | The owner's English is plain and friendly. The Polish matches it without slang. |

### 1.3 Rejected alternatives

- **Pan / Pani.** Gendered (*Pana / Panią*), stiff, and absurd in the hero.
- **Państwo** (formal plural). It addresses a hall full of people, and the product addresses one.
- **Impersonal throughout** (*Należy wpisać miejsce*, *Można udostępnić*). It is gender-free but cold and bureaucratic,
  and it deletes the human moment: *Coś obserwowało* without *cię* is no hook. The impersonal survives in error
  notices, status lines and the "can't know" sentences, where it is natural.
- **Infinitive buttons** (*Udostępnić*, *Pobrać obraz*). An older style that reads like a question or an order to
  staff.

### 1.4 Rules that keep ty gender-free

The reader's gender shows only in the past tense, the conditional, and predicate adjectives or participles:

| Never (gendered) | Write instead |
|---|---|
| *Jeśli byłeś w zasięgu…* | *Jeśli twoje miejsce było w zasięgu…* |
| *Udostępniłeś link.* | *Skopiowano link.* / *Link jest gotowy.* |
| *Czy byłaś widoczna?* | *Czy mnie widać?* (the reader speaks; *widać* is impersonal) |
| *Jesteś gotowy?* | (don't ask) |
| *Gdybyś chciał…* | *Jeśli chcesz…* |
| *Nie jesteś na nim widoczny.* | *Ciebie w nim nie ma.* |

The present tense, the perfective future (*zobaczysz, udostępnisz*) and the imperative never show gender.

---

## 2. Voice

### 2.1 How the voice sounds in Polish

- **Declarative.** Short indicative sentences that state a measured fact. No questions in results, and no
  exclamation marks anywhere. Polish headlines may be verbless (*Warszawa pod okiem 256 satelitów…*). That is
  declarative, not marketing.
- **Specific.** Real numbers early, real units, real names: *786 km*, *16:14:21 UTC*, *7,46 km/s*. Never *kilkaset*,
  *wiele* or *mnóstwo* where a number exists.
- **Quietly uncanny.** The uncanny part is the plain fact, said calmly. Polish puts focus at the end of a sentence, so
  put the unsettling fact last (*…więc ten satelita widział twoje chmury, a nie ulice.*). Don't add adjectives
  (*niepokojąco, tajemniczo, aż*): the calm is what makes it uncanny.
- **Second person.** Intimacy comes from *cię, twoje niebo, nad tobą, u ciebie*, not from repeating *ty* as a
  subject. Polish drops subject pronouns: *Wpisz miejsce*, never *Ty wpisz miejsce*.

### 2.2 Rhythm and length

- One fact per sentence, 6–16 words. The pass panel's prose is a chain of short sentences, never one long one with
  five commas.
- Prefer verbs to nominalisations in prose: *obserwował*, not *dokonał obserwacji*; *opublikowano*, not *nastąpiła
  publikacja*. The exceptions are the place frames in §5.1, where a nominal phrase is the grammar we need, and status
  lines.
- Don't open with a subordinate clause when a main clause will do. Avoid two relative clauses in a row.
- Polish commas are grammatical, not breathing marks. They are **mandatory** before *że, który/która/które, gdy,
  jeśli, więc, ale, a*, before *czy* in an indirect question, and around adverbial participles (*…, lecąc na
  południe…*). There is none before *i, oraz, lub, albo* in simple coordination. A comma before *i* that closes a
  relative clause is correct (*…które przeleciały nad nim w ostatnich 7 dniach, i ich prawdziwe zdjęcia*). Missing
  commas are the most common error in translated Polish UI.

### 2.3 What to avoid

- **Marketing tone:** *Odkryj!*, *Sprawdź już teraz!*, *niesamowite*, *zaskakujące*, *magia*, *rewolucyjny*,
  exclamation marks, rhetorical questions in results. (*Zaskocz mnie* is the button's name, not an exclamation.)
- **Calques and office Polish:** *w oparciu o* (→ *na podstawie*, or rephrase), *dedykowany* (→ *przeznaczony*,
  *własny*), *posiadać* (→ *mieć*), *na ten moment* (→ *teraz*, *na razie*), *dokonać* + noun, *w celu* (→ *żeby*),
  *zostało wykonane* and other *zostać* passives (→ an *-no* form: *nie opublikowano jeszcze żadnej sceny*), *w dniu 1
  listopada* (→ *1 listopada*), *adresować problem*, *wspierać* a feature (→ *obsługiwać*), *celować w* for "aim for"
  (→ *szukać*).
- **Literal English structure:** *To jest prawdziwy obraz* → *To prawdziwy obraz*. Drop English possessives where
  Polish doesn't need them (*Kamera patrzyła prosto w dół*, not *Jego kamera była skierowana…*), unless the sentence
  would be ambiguous.
- **Colloquialisms and diminutives:** *fajnie, ekstra, na luzie, chmurki*.
- **Hedging filler:** *wydaje się, że*, *jakby*, *w pewnym sensie*. Uncertainty is stated once, plainly: *Nie da się
  sprawdzić, czy tak było.*
- **Invented technical nouns:** *obrazownik*, *skaner pogodowy*. Say *satelita pogodowy*, *kamera*, *instrument*.
- **Words that mean something else to a lay reader:** *zobrazować* ("to illustrate"), *najbliższe ujęcie* ("the next
  shot"), *w pasie* alone ("at the waist"). See §9.

### 2.4 Before and after

| English | Literal (wrong) | Watched Polish | Why |
|---|---|---|---|
| Something watched you this week. | *Coś obejrzało cię w tym tygodniu.* | *Coś cię obserwowało w tym tygodniu.* | *Obejrzeć* is to watch a film or look something over. *Obserwować* is the surveillance sense and the EO term (*satelita obserwacyjny*). The clitic *cię* goes second, as natives say it. |
| 31 images were made public. | *31 obrazy zostały upublicznione.* | *Opublikowano 31 obrazów.* | 31 is CLDR `many`, so the genitive plural *obrazów*. A *zostały* passive needs agreement that varies with the count, while the impersonal *opublikowano* needs none. |
| It was dark here. Weather imagers keep scanning at night in infrared, so it saw your clouds, not your streets. | *Tutaj było ciemno. Obrazowniki pogodowe kontynuują skanowanie w nocy w podczerwieni, więc on widział twoje chmury, nie twoje ulice.* | *Było tu ciemno. Satelity pogodowe skanują też nocą, w podczerwieni, więc ten satelita widział twoje chmury, a nie ulice.* | No invented noun, no *kontynuować*, and the uncanny fact last. *Ten satelita* gives the verb a visible antecedent: the nearest subject is the plural *satelity*, so a bare *widział* would have none. The sentence runs only for weather satellites (masculine *satelita*). |
| Can it see me? No. At best a pixel here is 10 m across. A car is one pixel. You're not in it. | *Czy może mnie zobaczyć? Nie. W najlepszym wypadku piksel tutaj ma 10 m szerokości. Samochód jest jednym pikselem. Nie jesteś w nim.* | *Czy mnie widać? Nie. Piksel ma tu w najlepszym razie 10 m. Samochód to jeden piksel. Ciebie w nim nie ma.* | *Widać* is impersonal, *to* replaces the copula, and the last line is gender-free with the stress on *ciebie*. |
| See every satellite that passed over it… (the marketing temptation) | *Odkryj, które satelity Cię śledzą!* | *Zobacz wszystkie satelity, które przeleciały nad nim…* | No exclamation, no "discover", no capital *Cię*, no *śledzić* (stalking). |

---

## 3. The key lines

### 3.1 Hero, loading screen and the lines in step with them

**Landing hero (final):**

```
Coś *cię*
obserwowało
w tym tygodniu.
```

```ts
hero: [['Coś ', accent('cię')], ['obserwowało'], ['w tym tygodniu.']] as Rich[],
```

Plain text (aria, alt text, README): *Coś cię obserwowało w tym tygodniu.*

- The accent is **cię**, the human moment, as *you* is in English. It is three letters, like *you*.
- The lines run 7 / 11 / 15 characters, a clean staircase. *obserwowało* can't be broken, and each break falls between
  phrases. Measured in the display face: 201 px at the 44 px minimum on a 320 px phone, and 584 px at 128 px.
- *Coś* (neuter) takes the neuter past *obserwowało*, so there is no gender problem, and the neuter keeps the watcher
  nonhuman and unnamed. That is the uncanny part.
- Sentence case. Only *Coś* takes a capital; *cię* is lowercase (§1.1).

**Share card hero (`card.hero`): four lines.** The card never re-wraps its lines (`heroLines`: nowrap, 88 px, −0.02em,
the serif at ×1.12). In the card's own fonts, "w tym tygodniu." measures 477–490 px against a 466 px column, and the
code's own budget is about 445 px. So the card's message sets it in four lines:

```ts
hero: [['Coś ', accent('cię')], ['obserwowało'], ['w tym'], ['tygodniu.']] as Rich[],
```

Its widest line is *obserwowało* at 402 px. Four lines take 4 × 88 × 0.94 ≈ 331 px of the 471 px band. *w tym* is one
part, so it stays on one line.

**Alternates considered for the landing:**
1. `Coś` / `obserwowało *cię*` / `w tym tygodniu.` (3 / 16 / 15). Correct, but *Coś* alone is weak against two long
   lines, and the clitic after the verb is a slightly marked order.
2. `W tym tygodniu` / `coś obserwowało` / `*ciebie*.` The stressed *ciebie* at the end is contrastive ("it was YOU it
   watched"). That reads paranoid rather than quiet, and opening with a time phrase loses the hook *Coś…*.

The chosen version wins: the most natural word order (clitic second), the earliest human moment, no orphan line.

**Lines in step with the hero:**

| Key | Polish |
|---|---|
| `share.hookWatched`, `results.invite.text` | *Ciebie też coś obserwowało w tym tygodniu.* (the stressed *Ciebie też* = "you too") |
| `share.hookPassed` | *Co przeleciało nad tobą w tym tygodniu?* |
| `card.question` | *Co cię obserwowało w tym tygodniu?* |
| `card.invite` (card footer, beside the host) | *Zobacz, co cię obserwowało* (247 px + 152 px host, in a 466 px row) |
| `card.enterAnyPlace` (default card footer) | *Wpisz dowolne miejsce* (230 px + 152 px. The full *…na Ziemi* measures 329 px and overflows the row.) |
| `card.page.title` | *Coś cię obserwowało w tym tygodniu.* |
| `app.documentTitle` | *Watched · Coś cię obserwowało w tym tygodniu* |
| About title | `Jak to` / `*działa*.` |

**Loading screen (`src/i18n/bootText.ts`).** It shows before the app's fonts are certain. So the slow line uses only
latin letters: a latin-ext letter (Ł, Ą, Ę) would come from a fallback font in the middle of a mono line.

| Key | Polish |
|---|---|
| `loading` | *Wczytywanie aplikacji Watched* |
| `slow` | *Powolne wczytywanie* (no letter outside latin) |
| `title` | *Watched · Coś cię obserwowało w tym tygodniu* |

### 3.2 Sub line

English: "Enter any place on Earth. See every satellite that passed over it in the last 7 days, and the actual pictures
they took."

**Final:** *Wpisz dowolne miejsce na Ziemi. Zobacz wszystkie satelity, które przeleciały nad nim w ostatnich [7]
dniach, i ich prawdziwe zdjęcia.*

```ts
sub: (days: number): Rich => [
  days === 1
    ? 'Wpisz dowolne miejsce na Ziemi. Zobacz wszystkie satelity, które przeleciały nad nim w ostatniej dobie, i ich prawdziwe zdjęcia.'
    : `Wpisz dowolne miejsce na Ziemi. Zobacz wszystkie satelity, które przeleciały nad nim w ostatnich ${f.int(days)} dniach, i ich prawdziwe zdjęcia.`,
],
```

- *nad nim* refers to *miejsce* (neuter), never to a place name, so it is always correct.
- The plural *wszystkie satelity … przeleciały* avoids the singular *każdego satelitę, który … zrobił*, which would say
  each satellite took the pictures alone.
- *i ich prawdziwe zdjęcia* avoids a second relative clause (*…zdjęcia, które zrobiły*).
- *prawdziwe*, never *aktualne*: *aktualny* means "current" (§9).
- *Ziemi* takes a capital: the planet. The comma before *i ich* closes the relative clause.
- The locative plural *dniach* is the same for every count above 1. A one-day window is *w ostatniej dobie*.
- `card.page.description` is the same sentence with 7.

**Alternates considered:** the future *Zobaczysz każdego satelitę, który nad nim przeleciał…* (softer and promotional,
and the singular forces *zrobił*), and one long sentence joined with *i zobacz* (it loses the English two-beat rhythm).

### 3.3 Results headline and second line

#### The frame

English: "In the last 7 days, **256 satellites watched** *Waterloo*." In Polish the place would be an object, in the
accusative (*obserwowało Warszawę*), or in the genitive under negation. Code can produce neither. So the place becomes
the nominative subject of a verbless headline, and "watched" becomes *pod okiem* ("under the eye of"), as in the stock
headline *Miasto pod okiem kamer*.

**Final:**

| Case | Polish |
|---|---|
| `one` | *[PLACE]* **pod okiem [1] satelity** w ostatnich [7] dniach. |
| `few` (2–4, 22–24…) | *[PLACE]* **pod okiem [3] satelitów** w ostatnich [7] dniach. |
| `many` (5–21, 25–31, 100…) | *[PLACE]* **pod okiem [256] satelitów** w ostatnich [7] dniach. |
| `other` (fractions, never shown) | *[PLACE]* **pod okiem [1,5] satelity** w ostatnich [7] dniach. |
| An older window (a shared link) | *[PLACE]* **pod okiem [31] satelitów** między 29 paź a 5 lis. |
| None (`headline.none`) | *[PLACE]* poza zasięgiem znanych nam satelitów w tym tygodniu. / …w tamtym tygodniu. |

```ts
/** Genitive after "pod okiem": 1 satelity, 3 / 256 satelitów */
const satGen = (n: number) => f.plural(n, { one: 'satelity', few: 'satelitów', many: 'satelitów', other: 'satelity' })
const inWindow = (w: WindowWhen) =>
  'lastDays' in w
    ? f.plural(w.lastDays, {
        one: 'w ostatniej dobie',
        few: `w ostatnich ${f.int(w.lastDays)} dniach`,
        many: `w ostatnich ${f.int(w.lastDays)} dniach`,
        other: `w ostatnich ${f.int(w.lastDays)} dniach`,
      })
    : `między ${w.from} a ${w.to}`

headline: {
  watched: (n: number, place: string, when: WindowWhen): Rich => [
    accent(place), ' ', strong('pod okiem ', num(f.int(n)), ` ${satGen(n)}`), ` ${inWindow(when)}.`,
  ],
  none: (place: string, past: boolean): Rich => [
    accent(place), ` poza zasięgiem znanych nam satelitów ${past ? 'w tamtym' : 'w tym'} tygodniu.`,
  ],
},
```

- After *pod okiem* the count is in the genitive: *1 satelity* (gen. sg.), *3 / 256 satelitów* (gen. pl.). Polish
  digits carry the case silently, so the noun is the only thing that changes.
- There is exactly one `strong` part (with the `num()` inside it) and one `accent`, as the English comment requires.
- Every place works: *Warszawa pod okiem 256 satelitów w ostatnich 7 dniach.* · *Niemcy pod okiem 3 satelitów…* ·
  *Polska pod okiem 1 satelity…* · *ul. Marszałkowska 1 pod okiem 31 satelitów…*
- The older window's `from` and `to` arrive written by the pl `time.dayMonth` (*29 paź*). It is always *między … a
  …*, never *między … i …*.
- *pod okiem* counts every satellite with a pass, as English "watched" does (owner's choice, DESIGN §3). The verdict
  titles say which of them left an image.
- **Never run `cap()` over a frame that starts with the place.** A label can start in lowercase or with a digit (*ul.
  Marszałkowska*, coordinates). The place-first order is already supported: `accent()` can be the first part.
- **The full stop after a cut place.** English drops it when the place ends in "…" (`stop(cut)`), because there the
  place ends the sentence. In Polish the stop ends the text block, not the place, so keep it: *Ulica Długa w Gdańsku
  przy… pod okiem 31 satelitów.*

The none frame: *poza zasięgiem znanych nam satelitów* ("beyond the reach of the satellites known to us") says the
same as "No satellite we track watched", stays a verbless nominal frame, and avoids *śledzić*. It fits the card's
three-line lead (*poza zasięgiem / znanych nam satelitów / w tym tygodniu.*, 14 / 21 / 15 characters).

**Alternates considered:** *Przez ostatnie 7 dni 256 satelitów obserwowało to miejsce: Warszawa* (30 % longer, and the
colon after an accusative invites *Warszawę*); *Warszawa: przez ostatnie 7 dni obserwowało ją 256 satelitów*
(ungrammatical in general: *ją / je / go* must match the place). The chosen frame is correct for every name, about as
long as the English, idiomatic, and an echo of the hero (*obserwowało → pod okiem*).

#### The second line (`imagesPublic`, `noImages`, card `photos`)

| Case | Polish |
|---|---|
| `one` | *Opublikowano [1] obraz.* |
| `few` | *Opublikowano [3] obrazy.* |
| `many` | *Opublikowano [31] obrazów.* |
| `other` | *Opublikowano [1,5] obrazu.* |
| Partial | *Opublikowano co najmniej [31] obrazów.* |
| Zero, results | *W tym tygodniu nie opublikowano żadnych obrazów.* / *W tamtym tygodniu nie opublikowano żadnych obrazów.* |
| Zero, card (its first line already says the week) | *Nie opublikowano żadnych obrazów.* |
| Archives down | *Archiwa nie odpowiedziały, więc na razie nie możemy policzyć publicznych obrazów.* |
| Archives down, card | *Archiwa obrazów nie odpowiedziały.* |

```ts
const obrazy = (k: number) => f.plural(k, { one: 'obraz', few: 'obrazy', many: 'obrazów', other: 'obrazu' })
imagesPublic: (k: number): Rich => ['Opublikowano ', strong('co najmniej '), num(f.int(k)), ` ${obrazy(k)}.`],
```

- The `strong` part is the "at least" words. The component removes it (`display: none`, with its trailing space) once
  the count is final, so *Opublikowano 31 obrazów.* reads cleanly with or without it.
- *Opublikowano* is the impersonal *-no* form: it agrees with nothing.
- A zero is a sentence with negation and *żadnych* (`noImages`, and `count <= 0` in the card's `photos`). Never print
  *Opublikowano 0 obrazów*.
- *obraz*, not *zdjęcie*: the count includes radar images and full-disc frames (owner: "always images").

#### Why there is no image (`results.why`)

Each is a whole sentence. "It" in English is the searched place: in Polish it is *to miejsce*, or *je* where the
sentence before has just named it.

| Key | Polish |
|---|---|
| `sunNeverRose` | *Słońce nie wzeszło ani razu, więc żadna kamera dzienna nie mogła zobaczyć tego miejsca.* |
| `sunBarelyRose` | *Słońce ledwie wzeszło, więc żadna kamera dzienna nie mogła zobaczyć tego miejsca.* |
| `infrared(n)` (always follows one of the two above) | *Satelity pogodowe i tak omiotły je w podczerwieni [42] razy.* (`one` *raz*, `few` *razy*, `many` *razy*, `other` *raza*) |
| `radar(names, others, passes)` | *Radar nie potrzebuje światła. Satelity radarowe Umbra-08, Capella-14 i 7 innych były w zasięgu [1204] razy.* (§5.4) |
| `unpublished(n)` | `one`: *Satelita Sentinel-2 lub Landsat przeleciał nad tym miejscem za dnia raz, ale nie opublikowano jeszcze żadnej sceny.* · others: *Satelity Sentinel-2 lub Landsat przeleciały nad tym miejscem za dnia [3] razy, ale nie opublikowano jeszcze żadnej sceny.* |
| `none` | *Za dnia nad tym miejscem nie przeleciał żaden satelita obserwacyjny z otwartym archiwum.* |

### 3.4 Pass sentences (`pass` namespace)

English: "Sentinel-2C crossed 786 km overhead at 16:14:21 UTC, moving south at 7.46 km/s. It was looking straight down.
Cloud cover across the scene: 25%."

**Final:** *Satelita Sentinel-2C przeleciał nad tym miejscem o [16:14:21 UTC] na wysokości [786 km], lecąc na
południe z prędkością [7,46 km/s]. Kamera patrzyła prosto w dół. Zachmurzenie całej sceny: [25%].*

```ts
crossed: (o): Rich =>
  o.offset
    ? [`Satelita ${o.sat} przeleciał o `, num(o.time, o.zone), ' na wysokości ', num(f.int(o.altKm), 'km'), ', ',
       num(f.int(o.offset.km), 'km'), ` ${MOTION[o.offset.dir]} stąd, lecąc ${MOTION[o.heading]} z prędkością `,
       num(f.dec(o.speedKmS, 2), 'km/s'), '.']
    : [`Satelita ${o.sat} przeleciał nad tym miejscem o `, num(o.time, o.zone), ' na wysokości ', num(f.int(o.altKm), 'km'),
       `, lecąc ${MOTION[o.heading]} z prędkością `, num(f.dec(o.speedKmS, 2), 'km/s'), '.'],
```

- Height is always ***na wysokości*** [786 km]. *Przeleciał 786 km* reads as a distance flown, and *przeleciał 786 km
  nad ziemią i 61 km na zachód* reads as two distances flown, which is false.
- *Satelita* is the classifier. It is masculine, so *przeleciał* is always right, whatever the name (§5.2).
- *lecąc* (an adverbial participle) has no gender and shares the subject of the main verb.
- *Kamera patrzyła…* gives the second sentence its own feminine subject.
- The place is *to miejsce* / *stąd* / *tu*, never its name, which the panel's header already shows (§5.1).
- *scena* is the archive's whole tile. *całej* tells the reader it is the scene, not the spot.

Every message, one sentence each, with the slots inside the sentence (never glue fragments):

| Key | Polish |
|---|---|
| `crossed`, offset | *Satelita Sentinel-2C przeleciał o [16:14:21 UTC] na wysokości [786 km], [61 km] na zachód stąd, lecąc na południe z prędkością [7,46 km/s].* |
| `lookingDown` | *Kamera patrzyła prosto w dół.* |
| `lookingOff(deg)` | *Kamera była odchylona od pionu o [4,2°].* |
| `cloudCover(pct)` | *Zachmurzenie całej sceny: [25%].* |
| `mosaic` | *Obraz z jego instrumentu VIIRS trafił do dziennej mozaiki NASA w barwach naturalnych, [375 m] na piksel.* (*jego* = the weather satellite. *Obraz* is the subject, so nothing agrees with the sensor.) |
| `radarImaged` | *Jego radar, patrząc [32,1°] w bok, zarejestrował to miejsce w rozdzielczości [20 m] na piksel.* / dark: *…na piksel, w ciemności.* |
| `geo.sits` | *Satelita Meteosat-12 nie przelatuje. Wisi [35 786 km] nad równikiem (0.2°W) i co [10] minut skanuje całą tarczę Ziemi pod sobą.* (no seat: *…nad równikiem i…*; no cadence: *…i skanuje całą tarczę Ziemi pod sobą.*; cadence `one` *co minutę*, `few` *co 2 minuty*, `many` *co 10 minut*) |
| `geo.reached` | *Linia tego skanu dotarła tu około [07:49 CET], przesuwając się na północ.* |
| `geo.infrared` | *Było tu ciemno, więc to obraz w podczerwieni: wierzchołki chmur według temperatury, im zimniej, tym jaśniej.* |
| `likely.crossed` | *Satelita Sentinel-2C przeleciał nad tym miejscem o [16:14:21 UTC] na wysokości [786 km], obejmując je pasem obrazowania o szerokości [290 km].* (offset: *…na wysokości [786 km], [61 km] na zachód stąd, obejmując to miejsce pasem obrazowania o szerokości [290 km].*; no swath: end after the place or the offset) |
| `likely.archiveFailed` | *Było jasno, więc to miejsce musiało trafić do kadru. Nie udało się teraz przeszukać archiwum.* |
| `likely.noScene` | *Z tego przelotu nie ma żadnej sceny. Sentinel-2 rejestruje tylko ląd i wody przybrzeżne, a tego miejsca mogło nie być w planie obrazowania.* |
| `likely.notYet` | *Było jasno, więc niemal na pewno zarejestrował to miejsce. Nie opublikowano jeszcze żadnej sceny z tego przelotu; archiwa spóźniają się czasem o dzień lub dłużej.* |
| `likely.dark` | *Było tu ciemno. Satelity pogodowe skanują też nocą, w podczerwieni, więc ten satelita widział twoje chmury, a nie ulice.* |
| `likely.mosaicUnconfirmed` | *Nie udało się potwierdzić dziennej mozaiki NASA z tego przelotu w twoim punkcie.* |
| `likely.notPublished` | *Jego obrazy zasilają prognozy pogody; nie są publikowane jako zdjęcia, które możemy pokazać.* |
| `could.withinView` | *Satelita WorldView Legion 4 był w zasięgu o [10:52 CET], [61 km] na zachód stąd.* / overhead: *…o [10:52 CET], dokładnie nad tym miejscem.* |
| `could.insideSwath` | *To miejsce było w jego pasie obrazowania o szerokości [24 km]. Operator nie publikuje, gdzie ten satelita rejestrował obrazy, więc nie da się sprawdzić, czy zarejestrował to miejsce.* |
| `could.radar` | *Radar widzi przez chmury i w ciemności. Patrząc [32,1°] w bok, mógł zmapować to miejsce. Z tego przelotu nie ma opublikowanego obrazu tego miejsca.* (no angle: *Radar widzi przez chmury i w ciemności. Mógł zmapować to miejsce.*; private archive: *…Nie da się sprawdzić, czy tak było.*) |
| `could.camera` | *Patrząc prosto w dół, mógł obserwować to miejsce. Nie da się sprawdzić, czy tak było.* / angle: *Z kamerą odchyloną od pionu o [4,2°] mógł obserwować to miejsce. Nie da się sprawdzić, czy tak było.* |
| `overhead` | *Stacja ISS (ZARYA) przeleciała o [21:14 CET] na wysokości [420 km], [45°] nad twoim horyzontem, na północnym zachodzie.* / near the zenith: *…[45°] nad twoim horyzontem, niemal w zenicie.* (§5.2 for *stacja*) |
| `darkStation` | *U ciebie było ciemno. Jeśli stacja była jeszcze w słońcu, przecięła twoje niebo jako jasny punkt, który nie mruga.* |

- "We can't know whether it did" is always ***Nie da się sprawdzić, czy tak było.*** It works for any subject and says
  impossibility, not ignorance. *Nie wiemy* is weaker, and *Nie możemy wiedzieć* is a calque.
- The follow-up sentences above use the masculine without a classifier (*zarejestrował, mógł, jego*) only because
  they run for one category alone, never for a crewed station: `mosaic` and `likely.dark` for weather satellites,
  `likely.*` for Sentinel-2 / Landsat, `could.*` for commercial and radar.
- *Patrząc* and *lecąc* are adverbial participles: their subject must be the main verb's subject, the satellite.
  That is why `could.camera` with an angle uses *Z kamerą odchyloną…* rather than a participle about the camera.
- *zmapować* translates the English "mapped". *zobrazować* is banned: a lay reader takes it as "to illustrate".
- `darkStation` runs only after the overhead sentence, and today the engine gives the overhead verdict only to crewed
  stations (`passes.ts`). So it keeps *stacja*, as the English says "the station". The planes it may be mistaken for
  blink, so *punkt, który nie mruga* is the exact sense of "steady".

### 3.5 Share card, share page and post (`card`, `share`)

**Card headlines.** Blocks in the order the message returns them: the accent (the place, in the serif) first, then
the text block in the condensed face, which must wrap to three short lines at most (about 24 characters at the largest
size).

| Key | Polish |
|---|---|
| `headline(n, place, cut)` | *[PLACE]* pod okiem [31] satelitów. (`one` *1 satelity*) |
| `headlineWeek(n, place, cut)` | *[PLACE]* pod okiem [31] satelitów w tym tygodniu. · n = 0: *[PLACE]* poza zasięgiem znanych nam satelitów w tym tygodniu. |
| `headlineBy.imaged` | *[PLACE]* pod okiem satelity [SAT]. · nameless: *[PLACE]* pod okiem satelity. |
| `headlineBy.likely` | *[PLACE]* w kadrze satelity [SAT]. · nameless: *…w kadrze satelity.* |
| `headlineBy.could` | *[PLACE]* w zasięgu satelity [SAT]. · nameless: *…w zasięgu satelity.* |
| `headlineBy.overhead` | *[PLACE]*: przelot stacji [SAT]. (crewed) / *[PLACE]*: przelot satelity [SAT]. · nameless: *[PLACE]*: przelot satelity. |

```ts
headline: (n: number, place: string, _cut: boolean): Rich => [accent(place), `pod okiem ${f.int(n)} ${satGen(n)}.`],
headlineBy: {
  imaged: (sat: SatName, place: string, _cut: boolean): Rich => [accent(place), sat ? `pod okiem satelity ${sat}.` : 'pod okiem satelity.'],
  // …
},
```

The headline also becomes the share page's title (its parts joined with a space). `cut` needs nothing in Polish
(§3.3).

**The line under the headline and the chips:**

| Key | Polish |
|---|---|
| `photos` | as §3.3 (zero: *Nie opublikowano żadnych obrazów.*) |
| `archiveDown` / `archiveDownShort` | *Archiwa nie odpowiedziały, więc na razie nie możemy policzyć publicznych obrazów.* / *Archiwa obrazów nie odpowiedziały.* |
| `cloud.only` | sub *Zachmurzone. Widać tylko chmury.* · chip *Zachmurzone · 92%* · post *Widać tylko chmury.* · desc *Widać tylko chmury (92%).* |
| `cloud.mostly` | sub *Głównie chmury: 81% sceny.* · chip *Głównie chmury · 81%* · post *Widać głównie chmury (81%).* · desc *Widać głównie chmury (81%).* |
| `cloud.spot` | sub *Chmura nad samym punktem.* · chip *Chmura nad punktem* · post / desc *Chmury zakryły ten punkt.* |
| `stamp` | *niedz., 1 lis 2026 · 11:21 EST* (Intl `weekday: 'short', day, month: 'short', year`) |
| `weekTo` | *7 dni do 1 lis 2026* (no weekday after a preposition) |
| `lastWeek` | *Ostatnie 7 dni* |
| `readout` | *Wysokość · Elewacja · Prędkość · Od pionu · Piksel · Piksel mozaiki · Najbliżej* |
| `lane` | *Zdjęcie · W kadrze · W zasięgu · Nad głową* (columns 116 px: the longest is 9 characters, as *Overhead* is 8) |
| `decimal` | `(n, d) => f.dec(n, d)` |
| `geometry` | *Geometria · północ u góry* (as long as the English: *Geometria przelotu · …* ran into the scale bar beside it) |
| `note` | imageInApp *Obraz zobaczysz w aplikacji* · imageUnavailable *Obraz chwilowo niedostępny* · commercial *Archiwum komercyjne, niepubliczne* · inSwath *W kadrze, jeszcze bez publicznego obrazu* · groundTrack *Ślad orbity przy największym zbliżeniu* |
| `acquiring` | *Pobieranie…* |
| `noPublicPhoto` / `noPhoto` | *Brak publicznego zdjęcia w tym tygodniu* / *Brak zdjęcia do pokazania* |
| `look` | closest *Ujęcie z najbliższa* · lastClear *Ostatnie bez chmur* · clouded *Zachmurzone* · radar *Radar* |
| `lookDay` | *3 lis* |
| `aSatellite` | *Satelita* (chips and the plan callout only) |
| `defaultPlace` | *Palm Jumeirah* |
| `defaultAlt` | *Prawdziwe zdjęcie wyspy Palm Jumeirah w Dubaju z satelity Sentinel-2, obok napis: Coś cię obserwowało w tym tygodniu. Wpisz dowolne miejsce.* (*wyspy* carries the case; the name is curated, so a classifier is fine. The alt quotes the card's shortened footer exactly.) |

The summary chip reads *Ujęcie z najbliższa · Sentinel-2B · 10 m* or *Ostatnie bez chmur · 3 lis · Landsat 9 · 30 m*.
*Ostatnie bezchmurne ujęcie* (26 characters) would leave about 2 px on the card's 582 px chip with a name like
Sentinel-2C, so the tag is *Ostatnie bez chmur*. Prose keeps the full *ostatnie bezchmurne ujęcie*.

**The share page (`card.page` and the pass sentences).** The place goes after a colon. Every sentence that follows
refers to it as *to miejsce* or *tu*.

| Key | Polish |
|---|---|
| `page.placeTitle(place)` | *[PLACE]: co obserwowało to miejsce w tym tygodniu* (no full stop: a heading) |
| `page.placeDescription(place)` | *[PLACE]: wszystkie satelity, które przeleciały tu w ostatnich 7 dniach, i ich prawdziwe zdjęcia. Co cię obserwowało w tym tygodniu?* |
| `page.opening` | `['Otwieranie aplikacji ', accent('Watched')]` |
| `crossed(o)` imaged / likely | *[PLACE]: satelita [SAT] przeleciał tu na wysokości [795 km] 1 listopada 2026 o 11:21 EST, lecąc na południe.* |
| `crossed(o)` overhead | *[PLACE]: stacja [SAT] przeleciała tu na wysokości [420 km]…* (crewed) / *satelita [SAT] przeleciał…* |
| …no altitude | *[PLACE]: satelita [SAT] przeleciał nad tym miejscem 1 listopada 2026 o 11:21 EST.* |
| …nameless | *[PLACE]: satelita przeleciał tu…* |
| `withinView(o)` | *[PLACE]: satelita [SAT] był w zasięgu 1 listopada 2026 o 10:52 EST, lecąc na południe.* |
| `couldHave` | *Mógł tu spojrzeć. Operator nie podaje, czy tak było.* |
| `straightDown` / `offNadir(deg)` | *Kamera patrzyła prosto w dół.* / *Kamera była odchylona od pionu o [4,2°].* |
| `cloudCover(pct)` | *Zachmurzenie: [25%].* |
| `inSwath(place)` | *To miejsce było w kadrze jego kamery.* (the place is not repeated: the first sentence named it) |
| `bestFrom` | *Ujęcie z najbliższa pochodzi z satelity [SAT].* · *Ostatnie bezchmurne ujęcie pochodzi z satelity [SAT].* · *Pierwszy obraz pochodzi z satelity [SAT].* · nameless: *…pochodzi z nieznanego satelity.* |
| `cardAlt` | withPhoto *Karta do udostępnienia: ujęcie tygodnia z najbliższa, z satelity [SAT].* (nameless: *…z nieznanego satelity.*) · plain *Karta do udostępnienia.* |

Dates in sentences come from `formatDate('pl', ms, timeZone, { day: 'numeric', month: 'long', year: 'numeric' })`:
*1 listopada 2026*, with no *r.* after it. The compass words are the motion table of §6.6 (*lecąc na południe*).

**The post (`share.post`, `postText`).** [DATE] is `formatDate` with `day` and `month: 'long'` (*1 listopada*), with no
weekday.

| Key | Polish |
|---|---|
| `imaged` | *Waterloo pod okiem satelity Sentinel-2C z wysokości 786 km, 1 listopada o 11:21 czasu lokalnego. 10 m na piksel; to prawdziwy obraz.* (no pixel: *…czasu lokalnego. To prawdziwy obraz.*) |
| `clouded` | *Waterloo pod okiem satelity Sentinel-2C z wysokości 786 km, 1 listopada o 11:21 czasu lokalnego. Widać głównie chmury (81%).* (the card's own `cloud.*.post`) |
| `likely` | *Waterloo w kadrze satelity Sentinel-2C z wysokości 786 km, 1 listopada o 11:21 czasu lokalnego. Pas obrazowania jego kamery objął ten punkt.* |
| `could` | *Waterloo w zasięgu satelity WorldView Legion 4, 1 listopada o 10:52 czasu lokalnego. Mógł tu spojrzeć. Operator nie podaje, czy tak było.* |
| `overhead` | *Waterloo: przelot stacji ISS (ZARYA) na wysokości 420 km, 1 listopada o 21:14 czasu lokalnego.* (non-crewed: *przelot satelity*) |
| Summary post | *Waterloo pod okiem 31 satelitów w tym tygodniu. Opublikowano 12 obrazów.* |
| `hookWatched` / `hookPassed` | *Ciebie też coś obserwowało w tym tygodniu.* / *Co przeleciało nad tobą w tym tygodniu?* |
| `credit` | *via @armaangupt0* (*via* is normal on Polish X) |
| `pngName` / `weekPngName` | *watched-[sat]-[place]-[day].png* / *watched-[place]-tydzien-[day].png* (ASCII only) |

**The share sheet (buttons are mono caps, three to a 360 px phone row, about 12 characters each):**

| Key | Polish |
|---|---|
| `titlePass` / `titleImage` / `titleWeek` | *Udostępnij ten przelot* / *Udostępnij ten obraz* / *Udostępnij ten tydzień* |
| `close` / `closeTitle` | *Zamknij* / *Zamknij (Esc)* |
| `shareImage` / `preparingImage` / `share` | *Udostępnij obraz* / *Przygotowywanie obrazu…* / *Udostępnij* |
| `copyLink` / `copied` / `copyImage` | *Kopiuj link* / *Skopiowano* / *Kopiuj obraz* |
| `postToX` | *Wpis na X* (72 px, the same as *Post to X*. *Opublikuj na X* is 112 px.) |
| `savePng` / `tryAgain` | *Zapisz PNG* / *Ponów* |
| `linkLabel` / `postLabel` | *Link* / *Wpis* (a 48 px column) |
| `directLink` | *Link bezpośredni: nie udało się teraz utworzyć krótkiego linku* |
| `creatingLink` / `linkLater` | *Tworzenie linku…* / *Powstanie po udostępnieniu* |
| `renderFailed` | *Nie udało się utworzyć karty w tej przeglądarce; link działa.* |

### 3.6 The four verdicts (`verdicts` namespace)

| Verdict | `title` | `short` (lane) | `unit` | `definition` | `verb` (aria list) |
|---|---|---|---|---|---|
| imaged | **Pod okiem** | Zdjęcie | *1 przelot · 3 przeloty · 31 przelotów · 1,5 przelotu* | *Prawdziwy obraz tego miejsca jest w publicznym archiwum.* | *pod okiem* |
| likely | **Zapewne pod okiem** | W kadrze | as above | *To miejsce było w pasie obrazowania kamery, która zawsze patrzy w dół. Nie opublikowano zdjęcia tego miejsca.* | *w kadrze* |
| could | **Satelita mógł spojrzeć** | W zasięgu | as above | *Wychylna lub prywatna kamera była w zasięgu. Jej operator nie podaje, czy tu patrzyła.* | *w zasięgu* |
| overhead | **Nad głową** | Nad głową | as above | *Przelot po twoim niebie. Stacje kosmiczne i cała reszta.* | *nad głową* |

About's extra sentences (`about.verdictMore`), said after each definition:
- imaged: *Jeśli go pokazujemy, to jest prawdziwy obraz.* (*obraz*: the imaged verdict includes radar)
- likely: *Zdjęcie nie jest jeszcze publiczne albo odrzucono je z powodu chmur.* (*z powodu*: *przez chmury* could
  mean "through the clouds")
- could: *Nie da się sprawdzić, czy tak było.*
- overhead: empty.

Why these words:
- **The could title names the satellite, not a camera.** The could group includes radar satellites (Capella, ICEYE,
  Umbra), and a radar is not a camera. A bare *Mógł tu spojrzeć* under *31 PRZELOTÓW* would be made to agree with the
  count (*mogło*). *Satelita mógł spojrzeć* is masculine by the noun and gender-safe.
- **Every title fits one line of the summary tile at 1280 px**, as the English does (*COULD HAVE POINTED HERE*, 23
  characters, fills it; a longer title wraps and pushes the last row under the panel's fold). *Zapewne pod okiem* (17;
  *zapewne* is the written register's "presumably") replaced *Prawdopodobnie pod okiem* (24), and *Satelita mógł
  spojrzeć* (22; the screen is about the place, so *tu* goes without saying) replaced *Satelita mógł tu spojrzeć* (25).
  Sentences keep *prawdopodobnie* (`pass`, `share`). Both wrap on the same phones the English does.
- **The likely lane is *W kadrze*,** "in the frame" (8 characters, 61 px, as wide as *OVERHEAD*). Alone in mono caps,
  *W PASIE* is first read as "at the waist", and on a timeline lane as "in the lane". *W kadrze* is the verdict
  exactly: the place was in a fixed camera's frame. The same root runs through the share frame (*w kadrze satelity
  [SAT]*), the geometry readout (*W kadrze 16:14:21 → 16:14:25*) and the card note. *Pas obrazowania* stays the word
  for the swath as a width (*Pas obrazowania 290 km*).
- **The imaged lane is *Zdjęcie*,** the owner's word ("Photo") for the lane that holds the pictures.
- **No title or `verb` has a past tense with a bare name as subject.** The `verb` values are gender-free phrases,
  because the aria list puts them after a bare name (*Sentinel-2C, pod okiem, piątek, 6 listopada 16:14 EST, 41
  godzin temu*).
- *Pod okiem* mirrors the headline frame, as *Watched* mirrors "256 satellites watched".
- *Nad głową* is the Polish idiom for "overhead".
- Readout aria: *[31] przelotów: Pod okiem*.

**When a verdict is quoted in running text, quote its exact title in „ ”:** About `tilting`: *Wiele satelitów
komercyjnych może się wychylić o 30–45 stopni. Jeśli twoje miejsce było w zasięgu, nazywamy to „Satelita mógł
spojrzeć”.* The engine notes: *…więc ten przelot liczymy jako „Pod okiem”.* · *…te przeloty oznaczamy jako
„Zapewne pod okiem”.*

**Timeline summary (`timeline.summary`).** Write label: value pairs, never `count + title` (*12 zapewne pod
okiem* reads as nonsense): *Oś czasu, 7 dni. Pod okiem: 3. Zapewne pod okiem: 12. Satelita mógł spojrzeć: 2.
Nad głową: 1.* `Timeline.tsx` also builds an aria string as `${n} ${title.toLowerCase()}`. It gets a message instead,
*Zapewne pod okiem: 12 przelotów* (engineering, free).

**Rejected:** *Obserwowane / Prawdopodobnie obserwowane* (on Instagram and X, *Obserwowane* means "Following"; §9),
*Obserwacja / Możliwa obserwacja* (a report category, cut off from the headline), *Obserwował* or *Mógł tu celować* as
headings (gendered verbs on a bare name; *celować* is weapon wording), *Kamera mogła tu spojrzeć* (calls a radar a
camera), the lanes *W PASIE* (the waist), *PRAWDOP.* (an abbreviation) and *MOŻE* (vague).

### 3.7 Globe, HUD, readouts and the computing readout

**Pass view readouts (`passView`):**

| Key | Polish |
|---|---|
| `strip` | altitude *Wysokość* · elevation *Elewacja* · offNadir *Od pionu* · pixel *Piksel* · band *Kanał* · sun *Słońce* · cloud *Chmury* · cloudAtSpot *Nad punktem* |
| `band` | *Podczerwień* · *Widzialny* · *Kolor* |
| `spotValue` | *Czysto* · *Cirrus* · *Chmury* · *Cień* (21 px in the strip's last cell: *Cirrusy* ran past the panel's edge at 1280; *cirrus* is the genus' Polish name) |
| `unit` | km, m, km/s · up *''* (empty: *Elewacja* already says "up") · mosaic *mozaika* · scene *sceny* (*25% SCENY*) · sun *dzień / półmrok / noc* |
| `upCompass(c)` | the compass point alone: *SSW* |
| `heading(c, asc)` | *SSW · na płd.* / *NNE · na płn.* (ascending = northbound) |
| `geo` (01 / Geometria) | closestUtc *Najbliżej · UTC* · closestLocal *Najbliżej · lokalnie* · groundDistance *Odległość po ziemi* · elevationFromYou *Nad twoim horyzontem* · groundSpeed *Prędkość wzgl. ziemi* · heading *Kurs* · sunElevation *Wysokość Słońca* · fieldOfRegard *Zasięg wychylenia* · swath *Pas obrazowania* · inSwath *W kadrze* · inView *W zasięgu* · window *Okno* · noradPass *NORAD · przelot* · scanUtc *Linia skanu tutaj · UTC* · scanLocal *Linia skanu tutaj · lokalnie* · aboveEquator *Nad równikiem na* · inYourSky *Na twoim niebie* · scanDirection *Kierunek skanu* · lineSpeed *Prędkość linii tutaj* · coverage *Obszar* (never *Zasięg*: that is the could lane) · thisScan *Ten skan* · noradScan *NORAD · skan* |
| `northToSouth` / `southToNorth` | *Północ → południe* / *Południe → północ* |
| `sunPhase` | *Dzień · Półmrok · Noc* |
| `fullDisc` / `everyMin(n)` | *Pełna tarcza* / *co 10 min* |
| `offNadir(deg)` / `offNadirShort` | *8,9° od pionu* / *8,9°* |
| `cloudPct(pct)` | *chmury 25%* |
| `latest` / `closest` (dropped on narrow lists) | *Ostatni * / *Najbliżej * |
| `cloudChip` | *Chmury* |
| `photosSection` / `planSection` | *Zdjęcia* / *Widok z góry* |
| `geometry` / `replay` (section rules) | *Geometria* / *Powtórka* |
| `imagedOrder` | *z najbliższa, potem najnowsze* (the chip's *z najbliższa*; *od ujęcia z najbliższa, …*, 39 characters, ran past the panel's edge at 1280) |
| `count` / `countStack` | *31 przelotów* (the unit in the form the number takes) |
| `sats(n)` | *1 satelita · 3 satelity · 12 satelitów* (no abbreviation exists) |
| `showAllSats` / `showAllRows` | *Pokaż wszystkie satelity (31)* / *Pokaż wszystkie wiersze (31)* |
| `showMore` / `left` / `showFewer` | *Pokaż jeszcze 40* / *został 1 · zostały 3 · zostało 120* / *Pokaż mniej* |
| `tag` | mosaic *Mozaika* · radar *Radar* · cloudedPct *Pochmurne · 81%* · cloudedAtSpot *Chmury nad punktem* |
| `noImage.*` | *…Widok przelotu z góry.* (openArchive: *Ten przelot satelity [SAT] nie dał obrazu tego punktu. Widok przelotu z góry.*; crewed: *Stacje załogowe mają kamery, ale ich zdjęć nie publikuje się według miejsca i czasu.*) |
| `radarNote` | *Obraz radarowy, nie zdjęcie: Sentinel-1 wysyła mikrofale i rejestruje ich echo, więc chmury i ciemność mu nie przeszkadzają. Jasność to siła odbicia: budynki i nierówny teren są jasne, spokojna woda ciemna.* |
| `spot` | checking *Odczyt piksela w twoim punkcie…* · clear *Czysto nad twoim punktem.* · cirrus *Nad twoim punktem cienkie cirrusy; mogą zmiękczyć obraz.* · cloud *Chmury nad twoim punktem.* · shadow *Twój punkt był w cieniu chmury.* |
| `links` | openToSave *Otwórz obraz, by go zapisać* · downloading *Pobieranie…* · download *Pobierz obraz* · viewSource *Źródło · Planetary Computer* |

Measured strip labels in 11 px mono, against cells of about 80 px: *ELEWACJA* 64 px (English *ELEVATION* 72), *OD
PIONU* 64, *NAD PUNKTEM* 88 (English *CLOUD AT SPOT* 104). *NAD HORYZONTEM* (112 px) and *CHMURY W PUNKCIE* (128 px)
don't fit. *Elewacja* is the everyday term for the angle: everyone who has aimed a satellite dish knows *azymut i
elewacja*. *Od pionu* replaces *od nadiru* everywhere (strip, card, rows), because it matches the prose *odchylona od
pionu o 4,2°*, and *nadir* is opaque to most readers. *Wysokość Słońca* is the established astronomical term. It sits
beside *WYSOKOŚĆ* (km) on purpose, because the qualifier and the unit tell them apart (the one allowed double use of
*wysokość*, §9).

**HUD (`hud`):**

| Key | Polish |
|---|---|
| `about` / `home` | *Jak to działa* / *Watched, strona główna* |
| `regionTime` / `regionCatalog` / `regionSun` | *Czas* / *Katalog orbit* / *Słońce* |
| `scene` (the clock during a replay) | *Powtórka* (*Scena* would collide with the archive's *scena*) |
| `sun(lat, lon)` | *Słońce 16.2°S 063.0°E* (coordinates as they arrive) |
| `subsolar` / `gmst` | *Punkt podsłoneczny* / *GMST 18:41:50* |
| `objects(n)` | *1 obiekt · 16 893 obiekty · 12 847 obiektów* |
| `objectsPending` / `catalog` | *Obiekty* / *Katalog* |
| `fetched(stamp)` | *Pobrano 2026-11-08 03:34Z* |
| `catalogAge(unit, n, stale)` | underMinute *<1 min temu* · minute *42 min temu* · hour *5 godz. temu* · day *3 dni temu* (`f.plural`: `one` *1 dzień*, `few` / `many` *N dni*, `other` *N dnia*) · stale first: *Nieaktualny, 3 dni temu* (*nieaktualny* agrees with *katalog*) |
| `catalogUnavailable` / `catalogLoading` | *Katalog niedostępny* / *Wczytywanie katalogu* |

**Globe (`globe`):** callouts are one nowrap line in mono caps. One event gets one noun: the moment of the picture is
*Ujęcie* everywhere.

| Key | Polish |
|---|---|
| `imaged` / `imagedAbout` | *Ujęcie 11:21:13 EST* / *Ujęcie ≈ 11:21 EST* |
| `acquired` / `acquiredAbout` | *Ujęcie 11:21:13 EST · 10 m* / *Ujęcie ≈ 11:21 EST · 10 m* |
| `acquisitionOf` / `closestApproachOf` | *Ujęcie · Sentinel-2C* / *Najbliżej · Sentinel-2C* |
| `acquiredNow` / `closestApproachNow` | *Zarejestrowano* / *Najbliżej* |
| `pin.card` / `pin.naming` / `pin.noName` | *Pinezka* / *Ustalanie nazwy…* / *Brak nazwy w pobliżu* |
| `pin.searchAria` / `pin.searchTitle` | *Pokaż, co przeleciało nad tym miejscem: [PLACE]* / *Szukaj tutaj (Enter)* |
| `pin.removeAria` / `pin.removeTitle` / `pin.moveHint` | *Usuń pinezkę* / *Usuń pinezkę (Esc)* / *Przytrzymaj globus w dowolnym miejscu, by ją przesunąć* |
| `pin.droppedAt` / `droppedIn` / `droppedUnnamed` | *Pinezka postawiona: 52.23, 21.01.* / *Pinezka postawiona: [PLACE]. Naciśnij Enter lub strzałkę, by zobaczyć, co przeleciało nad tym miejscem.* / *Pinezka postawiona. Naciśnij Enter lub strzałkę, by zobaczyć, co przeleciało nad tym miejscem.* |
| `noGl` | *Widok 3D niedostępny* / *WebGL 2 jest wyłączony w tej przeglądarce* |

**The computing readout (`results.computing`, `engine.progress`).** Each row is one line of about 40 characters, set in
capitals by CSS, so write it in sentence case. A verbal noun governs the genitive, so `few` and `many` share the
genitive plural.

| Key | Polish |
|---|---|
| `stages` | catalog *Katalog orbit* / *Katalog wczytany* · propagate *Propagacja orbit · 7 dni* / *Orbity wyliczone* · archive *Archiwa Sentinel-2 + Landsat* / *Archiwa przeszukane* · match *Dopasowywanie scen do przelotów* / *Sceny dopasowane* |
| `ready` / `ok` / `seconds` / `percent` | *Raport gotowy* / *OK* / *1,84 s* / *42%* |
| `window` | `[strong('Okno 7 dni · '), '1 lis 05:47 → 8 lis 05:47 UTC']` |
| `slow` | *Planetary Computer i NASA renderują obrazy na żądanie; ten krok może potrwać kilka sekund.* |
| `verySlow` | *Archiwa obrazów odpowiadają powoli. Jeśli nie odpowiedzą, pokażemy przeloty z samej geometrii orbit i powiemy o tym.* |
| `progress.loadingCatalog` | *Wczytywanie katalogu orbit* |
| `progress.catalog` | *Katalog · 16 893 obiekty* |
| `progress.propagateStart` | *Propagacja 412 orbit · 7 dni* (`one` *1 orbity*) |
| `progress.propagating` | *Propagacja orbit · 120 / 412* |
| `progress.searchingArchives` | *Szukanie w archiwach Sentinel-2/Landsat* (39) |
| `progress.matching` | *Dopasowywanie 3 scen do 31 przelotów* (`one` *1 sceny*, *do 1 przelotu*) |
| `progress.verifyingWeatherStart` / `verifyingWeather` | *Sprawdzanie mozaik NASA* / *Sprawdzanie mozaik NASA · 12 / 35* |
| `progress.done` | *812 przelotów · 31 obrazów* |
| `head.verifying` | *Weryfikacja mozaik pogodowych* |

**Engine notes (`engine.note`)** are calm and impersonal. A service name takes its classifier when a verb agrees with
it (*usługa NASA GIBS*, f.): *Usługa NASA GIBS nie zdążyła potwierdzić jednego obrazu VIIRS; VIIRS rejestruje całą
Ziemię codziennie, więc ten przelot liczymy jako „Pod okiem”.* · *Archiwa Sentinel-2 i Landsat odpowiadały zbyt wolno;
przeloty pokazujemy z samej geometrii orbit.* · *Elementy orbitalne mają 3 dni, więc czasy przelotów mogą się różnić o
kilka minut.*

**Faults (`app`):** label *Usterka* · fallback *Coś poszło nie tak.* · tryAgain *Spróbuj ponownie* · trying
*Ponawianie…* · back *Wróć* · catalog *Nie udało się wczytać katalogu orbit. Sprawdź połączenie i spróbuj ponownie.*
(said only for the loader's own failure) · compute *Coś poszło nie tak przy liczeniu przelotów dla tego miejsca.
Spróbuj ponownie za chwilę.*

### 3.8 Rok po roku (the time-lapse)

**The feature's name is *Rok po roku*.** It never declines, it is native, and it says exactly what the loop is (the
English aria says "year by year"). The loanword *timelapse* would need cases the code can't give (*brak timelapse’u*),
and *To miejsce rok po roku* as a title would say the place twice in the bar (*TO MIEJSCE ROK PO ROKU / Warszawa*).

| Key | Polish |
|---|---|
| `timelapse.title`, `lightbox.timelapse`, `results.timelapse.title` | *Rok po roku* (the bar: *ROK PO ROKU / Warszawa*) |
| `results.timelapse.sub` | *To miejsce w kolejnych latach* |
| `lightbox.timelapseLabel` (aria) | *To miejsce rok po roku* |
| `dialog(place)` | *Rok po roku: [PLACE]* |
| `shareTitle(place)` | *[PLACE] rok po roku* (the nominative and an adverbial phrase, so any name is grammatical) |
| `play` / `pause` / `slider` / `frameList` | *Odtwórz* / *Wstrzymaj* / *Klatka* / *Klatki* |
| `date` / `dayMonth` / `readout` | *22 paź 2019* / *22 paź* / *22 paź 2019 · Sentinel-2A* |
| `frameSpoken` | *Klatka 3 z 12: 22 października 2019* |
| `captionYearly(n)` | *12 bezchmurnych ujęć · jedno na rok* |
| `captionSeason(n, season)` | *12 bezchmurnych ujęć · jedno z każdej zimy / z każdej wiosny / z każdego lata / z każdej jesieni* |
| `captionGathering(since)` | *Jedno bezchmurne ujęcie na rok · od 2015* |
| `captionShort` / `captionError` | *Za mało bezchmurnych ujęć* / *Archiwum nie odpowiedziało* |
| `note(km)` | *Każda klatka to ten sam kwadrat o boku [10 km] z satelity Sentinel-2, z taką samą obróbką barw jak każde zdjęcie tutaj. Co roku szukamy innej pory roku; rok bez bezchmurnego ujęcia pomijamy.* |
| `noteOneSeason(km)` | *Każda klatka to ten sam kwadrat o boku [10 km] z satelity Sentinel-2, z taką samą obróbką barw jak każde zdjęcie tutaj. Każdy rok pokazuje tę samą porę roku; rok bez bezchmurnego ujęcia w tej porze pomijamy.* |
| `source` | *Copernicus Sentinel-2, via Planetary Computer* |
| `listing` / `choosing` / `developing` | *Przeglądanie archiwum* / *Wybór bezchmurnych ujęć* / *Wywoływanie klatek* (*wywoływać* is the darkroom word, the English "developed") |
| `choosingProgress` / `developingProgress` | *Wybór bezchmurnych ujęć, 3 z 12* / *Wywoływanie klatek, 3 z 12* |
| `tooCloudy` | *Za dużo tu chmur.* |
| `tooFew(count, since, needed)` | *Brak bezchmurnych ujęć od 2015 · potrzeba 3* / *1 bezchmurne ujęcie od 2015 · potrzeba 3* / *2 bezchmurne ujęcia od 2015 · potrzeba 3* |
| `noAnswer` / `unreachable` / `retry` | *Archiwum nie odpowiedziało.* / *Nie udało się połączyć z Planetary Computer* / *Ponów* |
| `share` / `linkCopied` | *Udostępnij* / *Skopiowano link* |
| `video` / `rendering(pct)` / `videoFailed` / `saveVideo` | *Wideo* / *Tworzenie 42%* / *Błąd wideo* / *Zapisz wideo* (the button is fixed at 132 px: *TWORZENIE 42%* measures 104 px, the same as *RENDERING 42%*. *Renderowanie 42%* is 128 px.) |
| `noH264` | *Ta przeglądarka nie ma kodera H.264: plik odtworzą przeglądarki Chrome i Firefox* |
| `fileNamePlace` | *miejsce* |

*Co roku szukamy innej pory roku* is exact: the loop aims for the next season and falls back to any clear date, so
*Co roku inna pora roku* would overclaim, and *Każdy rok celuje w…* is a calque. The war-zone and glacier captions name
the season and nothing else (§8).

### 3.9 About, landing and other long-form

| Key | Polish |
|---|---|
| `about.short.live` | *Czy to na żywo?* — *Nie do końca. Zdjęcia trafiają do archiwów od kilku godzin do paru dni po wykonaniu, więc najnowsze przeloty mogą jeszcze nie mieć zdjęcia.* |
| `about.short.seeMe` | *Czy mnie widać?* — *Nie. Piksel ma tu w najlepszym razie 10 m. Samochód to jeden piksel. Ciebie w nim nie ma.* |
| `about.short.every` | *Czy to wszystkie satelity?* — *Nie. Satelitów wojskowych i szpiegowskich zwykle nie ma w publicznych katalogach, a firmy nie mówią, gdzie kierują kamery.* |
| `about.method.facts.tilting` | *Wychylne kamery* — *Wiele satelitów komercyjnych może się wychylić o 30–45 stopni. Jeśli twoje miejsce było w zasięgu, nazywamy to „Satelita mógł spojrzeć”.* |
| `about.method.facts.daylight` | *Światło dzienne* — *Zwykłe kamery potrzebują słońca. Przelot w ciemności nigdy nie liczy się jako zdjęcie.* |
| `about.privacy.kept` | *Liczymy wyszukiwania według miejscowości i przybliżonego obszaru ok. 10 km, nigdy według twojego dokładnego punktu, i prowadzimy licznik tego, co ktoś otwiera i udostępnia. Bez adresów IP, bez własnych plików cookie, bez niczego, co łączy jedną wizytę z następną.* |
| `about.credits.madeBy` | who *Autor* · text *Armaan, @armaangupt0 na X* |
| `about.credits.placeNames` | *Photon od komoot. Dane mapy © autorzy OpenStreetMap (ODbL).* (OpenStreetMap's own Polish attribution) |
| `about.builtBy`, `landing.builtBy` | `['Autor: ', link(handle)]` |
| `landing.sourceLink` / `sourceLinkLabel` | *Kod źródłowy* / *Kod źródłowy w serwisie GitHub* (native, and no case for *GitHub* to take) |
| `about.footerNote` | *Zbudowane z publicznych danych. Żadne z tych zdjęć nie jest nasze.* |
| `about.keyNames` | *Enter* · *Spacja* · *Esc* |
| `switcher` | title *Język* · trigger *Język: Polski. Zmień* |
| `system` | close *Zamknij* · expandPanel *Rozwiń panel* · collapsePanel *Zwiń panel* |
| `landing.searchPlaceholder` / `placeLabel` / `searchHint` | *Szukaj miejsca* / *Miejsce* / *Nazwa, adres lub współrzędne* |
| `landing.matches(n)` / `noMatch` | *1 wynik · 3 wyniki · 12 wyników* / *Brak wyników* |
| `landing.searchDown` | *Wyszukiwarka miejsc nie odpowiada. Współrzędne, np. 43.47, −80.54, nadal działają.* (the coordinates exactly as written: the field parses them) |
| `landing.nothingMatches(q)` | *Nic nie pasuje do „[q]”. Wpisz miasto, znane miejsce albo współrzędne.* |
| `landing.useMyLocation` / `locateMe` / `nearMe` / `locating` | *Użyj mojej lokalizacji* / *Znajdź mnie* / *W pobliżu* / *Ustalanie…* (80 px; *Lokalizowanie…* is 112 px against a chip about as wide as *W POBLIŻU*, 72 px) |
| `landing.requestingPosition` / `namingPlace` | *Ustalanie pozycji* / *Ustalanie nazwy* |
| `landing.locatingNote` | *Twoja pozycja trafia do geokodera Photon, który nazywa miejsce. Zapisujemy tylko obszar ok. 10 km.* |
| `landing.orTry` / `pinHint` / `dropPin` | *Albo sprawdź* / *Albo kliknij globus, by postawić pinezkę* / *Postaw pinezkę* |
| `landing.surprise` / `surpriseName` | *Zaskocz mnie* / *Zaskocz mnie: losowe znane miejsce* |
| `landing.lastDays(d)` | *Ostatnie 7 dni* (`one` *Ostatnia doba*) |
| `results.sections` | *Podsumowanie* · *Przeloty* · *Pod stałym okiem* (watched continuously) |
| `results.head.shared(sat, place)` | *Udostępniono ci · [PLACE] pod okiem satelity [SAT]* |
| `results.computing.sharedAlt` | *[PLACE]: obraz z satelity [SAT], udostępniony ci.* (nameless: *…obraz z satelity, udostępniony ci.*) |
| `results.sheetLabel(place)` / `shareWeekLabel` | *[PLACE]: satelity nad tym miejscem* / *Udostępnij ten tydzień: [PLACE]* (*tamten tydzień* for an older week) |
| `results.head.newSearch` / `cancel` / `close` / `change` | *Szukaj* / *Anuluj* / *Zamknij* / *Zmień* (the three share one box: keep them about as long as the English) |
| `results.footer.checkPlace` / `clearest` | `[strong('Sprawdź '), 'swoje miejsce']` / `[strong('Zobacz '), 'najczystsze ujęcie']` (each reads alone without its strong part) |
| `results.notes.counted` | *[12] dokładnych obrazów (Sentinel-2, Landsat, 10–30 m) · [3] dzienne mozaiki pogodowe (250–375 m) · [2] obrazy radarowe (Sentinel-1, 20 m) · [1700] obrazów pełnej tarczy z geostacjonarnych satelitów pogodowych (2–5 km; pokazujemy najnowszy z każdego). Sprawdzono [812] przelotów ([412] satelitów obserwacyjnych i stacji załogowych).* |
| `results.notes.passTimes` | *Czas przelotu to chwila, w której satelita był najbliżej tego miejsca, liczona z publicznych elementów orbitalnych (pobranych 2026-11-08 03:31Z). Czas lokalny: America/Toronto.* |
| `results.geo.none` | *Żaden działający geostacjonarny satelita pogodowy nie widzi tego miejsca wyżej niż 5° nad horyzontem.* |
| `results.geo.facts` | *0.0°E · elewacja 23,4° · co 10 min* |
| `results.geo.frame` (two short words in 64 px) | probing *Szukanie…* · noPublic *Brak obrazu* · poorQuality *Słaba jakość* · noneNow *Chwilowo brak* · unavailable *Brak klatki* |
| `results.timeline` | title *Oś czasu* · daylight *Dzień tutaj* · now *Teraz* · geometry *4,2° od pionu · 61 km* · marks *Dzienna mozaika, 375 m · ●*, *Obraz radarowy, 20 m · ◆*, kinds *otwarty · ◇ / komercyjny · □ / radarowy · ▣ / pogodowy · ○ / załogowy · ✛ / inny* |
| `results.replay` | inView *W zasięgu 4 min 12 s* · closest *Najbliżej* · play / pause *Odtwórz powtórkę / Wstrzymaj powtórkę* · spaceKey *Spacja* · playPause *odtwórz / wstrzymaj* |
| `results.plan` | northUp *Widok z góry · północ u góry* · fieldOfRegard *Zasięg wychylenia ±30°* · swath *Pas obrazowania 290 km* · groundTrack *Ślad orbity* · closest *Najbliżej 12 km* / *Najbliżej < 1 km* |
| `results.product` | *Dzienna mozaika · 375 m* · *Pełna tarcza · 2 km* · *Podczerwień · 2 km* · *Sentinel-2 L2A · 10 m* · *Landsat C2 L2 · 30 m* · *Radar Sentinel-1 · 20 m* |
| `gallery.filter` | *Wszystkie · Dokładne · Pogoda · Radar* |
| `gallery.photosThisWeek` / `photosThatWeek` | *12 z tygodnia* (both) |
| `gallery.lead` | *Ujęcie z najbliższa* · *Ostatnie bez chmur* · *Zachmurzone* |
| `gallery.status` (≤ ~14 characters) | cloudedPct *Pochmurne · 81%* · cloudAtSpot *Chmury tutaj* · clear *Czysto* · cirrus *Cirrusy* · shadow *Cień chmur* · cloudPct *Chmury 25%* · mosaic *Dzienna mozaika* |
| `gallery.clouded` | pct *Zachmurzone · 81%* · coverAtSpot *Zachmurzone · chmury nad twoim punktem* · atSpot *Chmury nad twoim punktem* |
| `gallery.noteMostlyCloud` / `noteLastClear` | *Przeloty z tego tygodnia widziały głównie chmury* / *Oto ostatnie bezchmurne ujęcie* |
| `gallery.awaiting` | pass *Do przelotu* · scan *Do skanu* (a countdown follows: *DO PRZELOTU · T−00:00:41*) |
| `gallery.photoAlt(sat, place)` | *[PLACE]: obraz z satelity [SAT]. To miejsce jest na środku.* |
| `gallery.stillRendering` / `cropMissing` | *Wciąż się renderuje. Duże sceny mogą zająć 10 s lub więcej.* / *Archiwum nie przysłało tego wycinka. Może być zajęte; sam obraz nadal istnieje.* |
| `lightbox.perPixel` / `panTitle` | *10 m na piksel* / *Wyostrzone kanałem panchromatycznym 15 m z satelity Landsat* |
| `lightbox.status.clearAtSpot` | *Czysto nad twoim punktem* |

---

## 4. Glossary

### 4.1 Terms

Gender: m. / f. / n. Plural forms are `one · few · many`. The `other` form (fractions) is the genitive singular unless
noted.

| English | pl | Notes |
|---|---|---|
| satellite | satelita | m. (despite the -a). *1 satelita · 3 satelity · 5 satelitów*; gen. sg. *satelity*, acc. sg. *satelitę*. Plural verbs are non-masculine-personal: *satelity przeleciały*. Never *satelici*. The classifier for [SAT] (§5.2). |
| imaging satellite | satelita obserwacyjny | The standard term (ESA and POLSA: *satelity obserwacyjne Ziemi*). Not *obrazujący* (agency jargon). |
| weather satellite / radar satellite | satelita pogodowy / satelita radarowy | *meteorologiczny* is correct but long. |
| crewed / station | załogowy / stacja kosmiczna | f. The classifier *stacja* for the crewed category. |
| military / spy satellites | satelity wojskowe i szpiegowskie | Factual, as in the English. |
| pass, overflight | przelot | m. *1 przelot · 3 przeloty · 5 przelotów*. Never *przejście*, *hasło* or *przepustka*. |
| to watch (product verb) | obserwować | impf. *Coś cię obserwowało.* With a place, the frame *[PLACE] pod okiem …*. Never a standalone label or button (it means "Follow" on social media). |
| watched (verdict) | Pod okiem | Title. Lane *Zdjęcie*. |
| likely watched | Zapewne pod okiem | Title (one tile line; sentences say *prawdopodobnie*). Lane *W kadrze*. |
| could have pointed here | Satelita mógł spojrzeć | Title (one tile line). Lane *W zasięgu*. |
| passed overhead | Nad głową | Title and lane. |
| watched continuously | Pod stałym okiem | The geostationary section. |
| photo, picture | zdjęcie | n. *1 zdjęcie · 2 zdjęcia · 5 zdjęć*. Wherever the English says photo or picture, except a string that names or counts radar images. |
| image | obraz | m. *1 obraz · 2 obrazy · 5 obrazów*; gen. sg. *obrazu*. The counting word for photos, radar, mosaics and full-disc frames. |
| made public / published | opublikowano; opublikowany | *Opublikowano 31 obrazów.* |
| detailed (10–30 m) | dokładny | *Dokładne* (filter) · *12 dokładnych obrazów* (footnote). One word for both. |
| archive | archiwum | n. pl. *archiwa*, gen. pl. *archiwów*. *Archiwum nie odpowiedziało.* |
| scene | scena | f. The archive's whole tile, never the crop on screen. Never *scenka*. |
| swath | pas obrazowania | m. The strip a fixed camera records, as a width. Never *pokos* (mowing), never *pas* alone in a label. |
| in swath | w kadrze | The likely lane, the geometry readout, the share frame. |
| in view / in range | w zasięgu | The could lane and its readouts. |
| off-nadir | od pionu | Label *OD PIONU*. Prose: *odchylona od pionu o 4,2°*. Never *od nadiru*. |
| straight down | prosto w dół | *Kamera patrzyła prosto w dół.* |
| ground track | ślad orbity | m. |
| orbit / orbital elements | orbita / elementy orbitalne | f. *katalog orbit*, *propagacja orbit*. TLE stays TLE. |
| altitude | wysokość | f. Kilometres above the ground: *na wysokości 786 km*. Label *WYSOKOŚĆ*. |
| elevation (angle above the horizon) | elewacja; nad horyzontem | Label *ELEWACJA*. Prose and the geometry label: *nad twoim horyzontem*. |
| sun elevation | wysokość Słońca | The astronomical term; the one allowed second *wysokość*. |
| ground speed | prędkość względem ziemi | Geometry label *Prędkość wzgl. ziemi*. Card label *Prędkość*. Prose *z prędkością 7,46 km/s*. |
| heading | kurs | m. Never *nagłówek* (a UI header). |
| ascending / descending | na płn. / na płd. | The heading unit only (ascending = northbound). Standard abbreviations. |
| cloud cover | zachmurzenie | n. *Zachmurzenie całej sceny: 25%.* |
| clouded over | zachmurzone | The lead tag, the card's chips, the gallery's warn chip. |
| clouded (status, tag) | pochmurne | *Pochmurne · 81%*. |
| mostly cloud | głównie chmury | *Głównie chmury · 81%*. |
| cloud (noun, chips) | chmury | *Chmury nad punktem*, *Chmury 25%*. |
| clear (no cloud) | czysto (status); bezchmurny (adj.) | *Czysto nad twoim punktem.* · *bezchmurne ujęcie*. |
| clearest look | najczystsze ujęcie | The least cloudy one. |
| thin cirrus | cienkie cirrusy; cirrusy | *Cienkie cirrusy nad twoim punktem…* · value *Cirrusy*. |
| cloud shadow | cień chmury; cień chmur | *Twój punkt był w cieniu chmury.* · status *Cień chmur*. |
| pixel | piksel | m. *10 m na piksel*. Label *PIKSEL*. |
| resolution | rozdzielczość | f. *w rozdzielczości 20 m na piksel*. Never *rezolucja*. |
| radar | radar; radarowy | m. *obraz radarowy*, never *zdjęcie radarowe*. |
| to image (radar) / to map | zarejestrować / zmapować | Never *zobrazować*. |
| daily (weather) mosaic | dzienna mozaika (pogodowa) | f. *1 mozaika · 2 mozaiki · 5 mozaik*. "Mosaic pixel" = *Piksel mozaiki*. |
| geostationary | geostacjonarny | |
| full disc | pełna tarcza | f. *obraz pełnej tarczy*. Never *dysk*. |
| scan / scan line | skan / linia skanu | m. / f. *Linia tego skanu dotarła tu…* |
| infrared / visible / colour | podczerwień / widzialny / kolor | Band values *Podczerwień · Widzialny · Kolor* (agreeing with *kanał*). |
| band | kanał | m. Label *KANAŁ*. *kanał panchromatyczny*. |
| true colour | barwy naturalne; w barwach naturalnych | |
| time-lapse | Rok po roku | The feature's name (§3.8). Never *timelapse*. |
| replay | powtórka (the section, the HUD clock); *Odtwórz* (button) | *Odtwórz przelot* / *Wstrzymaj*. |
| look (one picture of the place) | ujęcie | n. *1 ujęcie · 2 ujęcia · 5 ujęć*. |
| closest look | ujęcie z najbliższa | Tag *Ujęcie z najbliższa*. Never *najbliższe ujęcie* ("the next shot"). |
| last clear look | ostatnie bezchmurne ujęcie | Tag *Ostatnie bez chmur*. |
| frame / loop | klatka / pętla | f. *Klatka 3 z 12*. |
| catalog | katalog | m. *katalog orbit*. Stale: *nieaktualny*. |
| epoch | epoka | f. |
| sub-solar point | punkt podsłoneczny | |
| Sun / sun | Słońce / słońce | A capital for the body (*wysokość Słońca*), lowercase for sunlight (*słońce nie wzeszło*, *w słońcu*). |
| Earth / ground | Ziemia / ziemia | *na Ziemi* (the planet) vs *nad ziemią*, *względem ziemi* (the ground). |
| daylight / dark | za dnia, jasno / ciemno, w ciemności | *Było tu ciemno.* *Było jasno…* |
| day / twilight / night | dzień / półmrok / noc | Readout units (twilight is dawn or dusk, so *półmrok*). |
| steerable camera | kamera wychylna | f. |
| fixed camera | kamera, która zawsze patrzy w dół | Spelled out in definitions. |
| private / commercial | prywatny / komercyjny | *archiwum komercyjne, niepubliczne*. |
| operator | operator | m. (masculine even for a company: *operator nie podaje*). |
| field of regard | zasięg wychylenia | Value *±30°*. |
| window | okno | *Okno 7 dni*. |
| coverage | obszar | Never *zasięg* (the could lane). |
| plan view | widok z góry | *Widok przelotu z góry.* |
| place / spot | miejsce / punkt | n. / m. "this place" = *to miejsce*; "your spot" = *twój punkt*. |
| globe / pin | globus / pinezka | *Postaw pinezkę* (action), *Pinezka* (the card). |
| timeline / lane | oś czasu / tor | |
| share | Udostępnij; udostępnianie | *Udostępnij ten przelot / ten obraz / ten tydzień*. |
| download / downloading | Pobierz / Pobieranie… | |
| copy / copied | Kopiuj / Skopiowano | |
| post (on X) | wpis | *Wpis na X*, label *Wpis*. |
| link | link | m., gen. *linku*. |
| video | wideo | n., indeclinable. |
| use my location / locating | Użyj mojej lokalizacji / Ustalanie… | Phone: *Znajdź mnie*. Chip: *W pobliżu*. |
| surprise me | Zaskocz mnie | |
| fault | usterka | The fault notice's label. |
| last 7 days / this week / that week | ostatnie 7 dni / w tym tygodniu / w tamtym tygodniu | |
| local time | czas lokalny | *o 11:21 czasu lokalnego*. Never *lokalny czas*. |
| ago / in / just now | temu / za / przed chwilą | Never *teraz* or *właśnie* for "just now". |
| minutes / hours / days | min / godz. / dni | Running UI: *12 min temu*, *41 godz. temu*, *1 godz. 02 min*. Spoken: Intl long. |
| season / melt season / glacier | pora roku / sezon topnienia / lodowiec | Never *sezon* for spring, summer, autumn or winter. |
| report | raport | m. *Raport gotowy*. |
| browser | przeglądarka | f. *w tej przeglądarce*. |
| cookie | plik cookie | *żadnych własnych plików cookie*. |
| cancel / close / back / try again | Anuluj / Zamknij / Wróć / Spróbuj ponownie | *Ponów* where a row is tight (the share sheet, small mono buttons). |
| Watched. / www.watched.earth | Watched. / www.watched.earth | Never translated or declined. In a sentence: *aplikacja Watched*, *na stronie www.watched.earth*. |

### 4.2 Never translated

Satellite names (Sentinel-2C, Landsat 9, WorldView Legion 4, NOAA-21, Meteosat-12, ISS (ZARYA), Tiangong), sensor and
product names (MSI, OLI, VIIRS, MODIS, ABI, AHI, FCI, SEVIRI, C-SAR, GeoColor), programme and service names
(Copernicus, never *Kopernik*; Planetary Computer, Element 84, Earth Search, CelesTrak, GIBS, EOSDIS, Photon,
Nominatim, Open-Meteo), NASA, NOAA, EUMETSAT, USGS, JMA, NORAD IDs, UTC, GMST, zone abbreviations (EST, CET, CEST,
JST), PNG, MP4, H.264, TLE, SGP4. ESA has an established Polish name, *Europejska Agencja Kosmiczna*, but the acronym
stays *ESA* (feminine: *ESA opublikowała*). NASA is feminine too (*agencja*). Avoid verbs that agree with the other
acronyms.

Foreign names are never declined (*Landsata*, *Sentinela*, *Firefoksie* are all wrong). When a preposition or a verb
needs one, put a classifier in front: *z archiwum Planetary Computer*, *do geokodera Photon*, *usługa NASA GIBS nie
zdążyła*, *z satelity Landsat*, *przeglądarki Chrome i Firefox*, *aplikacji Watched*.

**Licence lines stay in English, verbatim:** *Contains modified Copernicus Sentinel data 2026*, *Contains modified
EUMETSAT Meteosat data 2026*, *Landsat: USGS / NASA*, *CC BY 4.0*, *SIL OFL*. The one exception is OpenStreetMap,
whose guidelines give the Polish form: *© autorzy OpenStreetMap (ODbL)*. The labels around the credits are translated
(*Źródła*, *Archiwa*, *Orbity*, *Nazwy miejsc*, *Tekstury Ziemi*, *Kroje pisma*).

### 4.3 Curated places (`places` namespace, every entry)

These are copy, not data: use the established Polish exonym. Sublabels go from the most specific place outward,
separated by commas. The chip (the first three only) stays under ~14 characters.

| English label | label | sublabel |
|---|---|---|
| Area 51 (chip *Strefa 51*) | Strefa 51 | Groom Lake, Nevada, Stany Zjednoczone |
| Central Park (chip *Central Park*) | Central Park | Nowy Jork, Stany Zjednoczone |
| Pyramids of Giza (chip *Giza*) | Piramidy w Gizie | Giza, Egipt |
| Uluru | Uluru | Terytorium Północne, Australia |
| Palm Jumeirah | Palm Jumeirah | Dubaj, Zjednoczone Emiraty Arabskie |
| The World Islands | Archipelag The World | Dubaj, Zjednoczone Emiraty Arabskie |
| Grand Canyon | Wielki Kanion | Arizona, Stany Zjednoczone |
| Meteor Crater | Krater Barringera | Arizona, Stany Zjednoczone |
| Lower Manhattan | Dolny Manhattan | Nowy Jork, Stany Zjednoczone |
| Las Vegas Strip | Las Vegas Strip | Nevada, Stany Zjednoczone |
| Hoover Dam and Lake Mead | Zapora Hoovera i jezioro Mead | Nevada i Arizona, Stany Zjednoczone |
| Golden Gate | Golden Gate | San Francisco, Stany Zjednoczone |
| Kennedy Space Center | Centrum Kosmiczne Kennedy’ego | Floryda, Stany Zjednoczone |
| Washington, D.C. | Waszyngton | National Mall, Stany Zjednoczone |
| Mount St. Helens | Mount St. Helens | stan Waszyngton, Stany Zjednoczone |
| Niagara Falls | Wodospad Niagara | Ontario, Kanada |
| Panama Canal | Kanał Panamski | Śluzy Gatún, Panama |
| Rio de Janeiro | Rio de Janeiro | Głowa Cukru i Copacabana, Brazylia |
| Paris | Paryż | Île-de-France, Francja |
| Venice | Wenecja | Wenecja Euganejska, Włochy |
| Mount Vesuvius | Wezuwiusz | Neapol, Włochy |
| Istanbul | Stambuł | Bosfor, Turcja |
| Chernobyl | Elektrownia w Czarnobylu | obwód kijowski, Ukraina |
| Table Mountain | Góra Stołowa | Kapsztad, Republika Południowej Afryki |
| Kilimanjaro | Kilimandżaro | Kilimandżaro, Tanzania |
| Mount Everest | Mount Everest | Nepal i Chiny |
| Angkor Wat | Angkor Wat | Siem Reap, Kambodża |
| Singapore | Singapur | Marina Bay, Singapur |
| Hong Kong | Hongkong | Port Wiktorii, Hongkong |
| Tokyo | Tokio | Tokio, Japonia |
| Mount Fuji | Fudżi | Shizuoka, Japonia |
| Sydney Harbour | Port w Sydney | Sydney, Australia |
| Richat Structure | Struktura Richat | Sahara, Mauretania |
| Great Blue Hole | Wielka Błękitna Dziura | Lighthouse Reef, Belize |
| Bora Bora | Bora-Bora | Wyspy Towarzystwa, Polinezja Francuska |
| Hardy Reef | Hardy Reef | Wielka Rafa Koralowa, Australia |
| Malé | Male | Atol Male Północny, Malediwy |
| Dead Sea Salt Ponds | Baseny solne Morza Martwego | basen południowy, Izrael i Jordania |
| Bingham Canyon Mine | Kopalnia Bingham Canyon | Utah, Stany Zjednoczone |
| Mount Whaleback Mine | Kopalnia Mount Whaleback | Pilbara, Australia |
| Mount Etna | Etna | Sycylia, Włochy |
| Santorini | Santoryn | Cyklady, Grecja |
| Teide | Teide | Teneryfa, Hiszpania |
| Kīlauea | Kīlauea | Hawaje, Stany Zjednoczone |
| Crater Lake | Jezioro Kraterowe | Oregon, Stany Zjednoczone |
| Glen Canyon Dam | Zapora Glen Canyon | Page, Arizona, Stany Zjednoczone |
| Garden City Crop Circles | Okrągłe pola w Garden City | Kansas, Stany Zjednoczone |
| Almería Greenhouses | Szklarnie w Almerii | Andaluzja, Hiszpania |
| Gibraltar | Gibraltar | Cieśnina Gibraltarska |
| Suez Canal | Kanał Sueski | Ismailia, Egipt |
| Aswan High Dam | Wysoka Tama w Asuanie | Jezioro Nasera, Egipt |
| Wadi Rum | Wadi Rum | Akaba, Jordania |
| Sossusvlei | Sossusvlei | Pustynia Namib, Namibia |
| Victoria Falls | Wodospady Wiktorii | Zambia i Zimbabwe |
| Three Gorges Dam | Zapora Trzech Przełomów | Hubei, Chiny |
| Shanghai | Szanghaj | rzeka Huangpu, Chiny |
| Itaipu Dam | Zapora Itaipu | Brazylia i Paragwaj |

Notes:
- **Chernobyl.** The curated point (51.389, 30.099) is the power plant, not the town 15 km away, so the honest label is
  *Elektrownia w Czarnobylu*.
- **Garden City.** These are centre-pivot irrigation circles: *okrągłe pola*, never *kręgi zbożowe*, which in Polish
  means the alien-legend crop circles.
- Curated labels may be declined inside themselves (*Piramidy w Gizie*, *Szklarnie w Almerii*), because a translator
  writes them. Once picked, the label becomes [PLACE] and obeys §5.1 like any other.
- Usage stats, `record_lookup` and links keep the English label (`canonicalLabel`), so counts never split by language.

---

## 5. Grammar strategies for runtime slots

### 5.1 [PLACE]: nominative only

A place label is whatever the gazetteer returns: Polish (*Warszawa, Łódź, Zielona Góra, Katowice*), English or local
script (*Munich, Waterloo, 東京*), a country from `Intl.DisplayNames('pl')` (*Niemcy, Stany Zjednoczone, Polska*), a
street address, or coordinates (*52.23, 21.01*). It may be feminine, plural or adjectival, and it may start in
lowercase or with a digit. Code passes it as it is.

**Allowed positions** (the nominative is correct whatever the name):
1. **The subject of a verbless frame:** *[PLACE] pod okiem 256 satelitów…*, *[PLACE] w kadrze satelity [SAT].*,
   *[PLACE] rok po roku*, *[PLACE] poza zasięgiem…*
2. **A label before or after a colon:** *Rok po roku: [PLACE]*, *[PLACE]: przelot stacji ISS (ZARYA).*, *Pokaż, co
   przeleciało nad tym miejscem: [PLACE]*.
3. **A heading or caption on its own:** the pass panel's header, the pin card.
4. **In parentheses:** *(Waterloo)*.

**Forbidden** (each needs a case or an agreement code can't produce):

| Pattern | Why it breaks | Example of the failure |
|---|---|---|
| after any preposition | *w, na, nad, do, z, u, dla, o, przez, pod, między* each take an oblique case | *nad Warszawa* ✗ (*nad Warszawą*) |
| direct object | accusative, and the genitive under negation | *obserwowało Warszawa* ✗ · *nie obserwował Kraków* ✗ |
| subject of a verb | the past agrees in gender, the present in number | *Katowice był…* ✗ · *Niemcy jest…* ✗ |
| a pronoun for the place | *go / ją / je* depend on its gender and number | *obserwowało ją* (for *Kraków*) ✗ |
| an adjective or participle about the place | agreement | *Warszawa, obserwowany…* ✗ |
| apposition after a classifier in prose | *w mieście Warszawa* is tolerated in official texts but reads as software Polish | (don't) |

**In prose, the place is *to miejsce*** (*tego miejsca, nad tym miejscem, obejmując je*), *tu*, *stąd* (*61 km na
zachód stąd*), or the reader's *twój punkt* / *twoje niebo* / *u ciebie*. These are ordinary nouns and adverbs, so
the grammar is always right, and the name is already in the panel header. *je* stands for *to miejsce* only right after
a sentence that has named it (`why.infrared` after `why.sunNeverRose`).

English's article logic (*the Pacific Ocean*, `placeInProse`, `placeAccent`, `capitalize`) doesn't apply: Polish frames
take the bare label, and never `cap()` it.

### 5.2 [SAT] as subject: gender unknown

A satellite's grammatical gender in Polish follows the implied noun, *satelita* (m.) or *stacja* (f.), not the name.
Readers would put *Umbra*, *Capella* or *Aqua* in the feminine from the ending, and *Sentinel-2* could be read as a
*misja*. So the bare name is never the subject of a past-tense verb.

**Strategy: a classifier noun is the grammatical subject.**

- ***Satelita [SAT]*** (m.) for every category except crewed: optical, commercial, radar, weather (LEO and GEO) and
  "other". In nominal frames, the genitive: *satelity [SAT]*.
- ***Stacja [SAT]*** (f.) for a crewed station. In the app, overhead-verdict passes are crewed stations only
  (`passes.ts verdictFor`), but no message carries a `crewed` flag and none is coming. So the four overhead messages
  (`pass.overhead`, `card.headlineBy.overhead`, `card.crossed` with verdict `'overhead'`, `share.post.overhead`)
  recognise the station by the display name the catalog gives it, `/^(ISS|Tiangong)\b/` (`src/engine/profiles.ts`), as
  the Arabic files do (`src/i18n/ar/pass.ts`, `api/_lib/i18n/card/ar.ts`): *Stacja ISS przeleciała o 21:14 EST…*,
  *Waterloo: przelot stacji ISS.*, *Waterloo: stacja ISS przeleciała tu…*, *Waterloo: przelot stacji ISS na wysokości
  428 km, …*. Every other satellite in those messages keeps *satelita* (m.). `darkStation` says *stacja* (§3.4). A
  new crewed station joins the pattern in each of the three files (`pl/pass.ts`, `pl/share.ts`, `card/pl.ts`).

```ts
const CREWED = /^(ISS|Tiangong)\b/
overhead: (o: { sat: string; altKm: number; time: string; zone: string; elevationDeg: number; toward?: Compass8 }): Rich => [
  CREWED.test(o.sat) ? `Stacja ${o.sat} przeleciała o ` : `Satelita ${o.sat} przeleciał o `,
  num(o.time, o.zone), ' na wysokości ', num(f.int(o.altKm), 'km'), ', ', num(f.int(o.elevationDeg), '°'),
  o.toward === undefined ? ' nad twoim horyzontem, niemal w zenicie.' : ` nad twoim horyzontem, ${SKY[o.toward]}.`,
],
```

- The name is never declined (*Sentinela-2C* ✗, *Landsata 9* ✗). It stands in apposition to the classifier, which is
  how Polish treats the names of ships, hotels and spacecraft.
- **Nameless (`sat` undefined).** The code already passes `undefined` rather than the label (`api/_lib/i18n/card/en.ts`).
  Each sentence drops the name and keeps the classifier: *Satelita przeleciał tu…*, *[PLACE] pod okiem satelity.*,
  *…pochodzi z nieznanego satelity.* `aSatellite` (*Satelita*) is printed only by the mono chips and the plan callout
  (*Ujęcie z najbliższa · Satelita · 10 m*). *NORAD 60989* is a name: *satelita NORAD 60989*.
- **Follow-up sentences** that run for one non-crewed category only (§3.4) may use the masculine without the
  classifier: *mógł obserwować to miejsce*, *zarejestrował to miejsce*, *jego radar*. Anything that can run for an
  overhead pass uses the classifier chosen by the station pattern above, or a gender-free subject.
- **Gender-free tools:** the present tense (*Satelita Meteosat-12 nie przelatuje. Wisi…*), adverbial participles
  (*lecąc, patrząc, obejmując, przesuwając się*), a different subject (*Kamera patrzyła…*, *Linia tego skanu
  dotarła…*, *Obraz z jego instrumentu trafił…*, *Radar widzi…*), impersonal neuters (*Było tu ciemno*, *Widać tylko
  chmury*), and *Nie da się sprawdzić, czy tak było*.
- **Never** write *Sentinel-2C obserwował(a)…*, a slash form, or the neuter *-ło* as a "neutral" guess.

### 5.3 [NUM]: plural categories

Polish CLDR categories (checked with `Intl.PluralRules('pl')`: 0 many, 1 one, 2 few, 5 / 12 / 21 many, 22 few, 25 /
101 / 112 many, 102 few, 1715 many, 1.5 other):

| Category | Integers | Examples |
|---|---|---|
| `one` | 1 only | 1 |
| `few` | ending in 2–4, except 12–14 | 2, 3, 4, 22, 23, 24, 32, 102, 1002 |
| `many` | every other integer, **including 0** | 0, 5, 11–14, 21, 25, 31, 100, 101, 112, 1000, 1715 |
| `other` | non-integers | 1,5 · 7,46 |

Write all four in every plural message (`fmt('pl').plural` requires them). Counts never reach `other`, but it must
exist and must be the genitive singular, not a copy of `many`. *21 satelitów* and *101 obrazów* are `many`: never *21
satelita*.

**Zero is a branch in the message**, because `plural` has no `=0`: `n <= 0 ? 'Nie opublikowano żadnych obrazów.' :
f.plural(n, {…})`. In sentences, zero takes *żaden / żadna / żadne / żadnych* and a negation. In mono counters a bare
*0* is fine, with the `many` form (*0 PRZELOTÓW*).

**The case depends on the slot, so give the whole phrase per category.** In a subject or object slot, `one` is the
nominative singular, `few` the nominative plural and `many` the genitive plural. The verb agrees: `one` with the noun's
gender, `few` in the plural, and `many` in the **neuter singular**. Adjectives follow the noun.

| Noun phrase | one | few | many | other |
|---|---|---|---|---|
| satelita (m.) | 1 satelita przeleciał | 3 satelity przeleciały | 5 satelitów przeleciało | 1,5 satelity |
| obraz (m.) | 1 obraz | 3 obrazy | 31 obrazów | 1,5 obrazu |
| dokładny obraz | 1 dokładny obraz | 3 dokładne obrazy | 12 dokładnych obrazów | 1,5 dokładnego obrazu |
| zdjęcie (n.) | 1 zdjęcie | 3 zdjęcia | 5 zdjęć | 1,5 zdjęcia |
| przelot (m.) | 1 przelot | 3 przeloty | 31 przelotów | 1,5 przelotu |
| ujęcie (n.) | 1 bezchmurne ujęcie | 3 bezchmurne ujęcia | 12 bezchmurnych ujęć | 1,5 bezchmurnego ujęcia |
| klatka (f.) | 1 klatka | 3 klatki | 12 klatek | 1,5 klatki |
| mozaika (f.) | 1 dzienna mozaika pogodowa | 3 dzienne mozaiki pogodowe | 5 dziennych mozaik pogodowych | 1,5 dziennej mozaiki pogodowej |
| obiekt (HUD) | 1 obiekt | 16 893 obiekty | 12 847 obiektów | 1,5 obiektu |
| wynik | 1 wynik | 3 wyniki | 12 wyników | 1,5 wyniku |
| raz | 1 raz | 3 razy | 42 razy | 1,5 raza |
| dzień | 1 dzień | 3 dni | 7 dni | 1,5 dnia |
| godzina (spoken) | 1 godzinę temu | 2 godziny temu | 41 godzin temu | 1,5 godziny temu |
| minuta | co 1 minutę | co 2 minuty | co 10 minut | co 1,5 minuty |
| remaining (`left`) | został 1 | zostały 3 | zostało 120 | zostało 1,5 |

In a genitive slot (*pod okiem, bez, od, do, z, sprzed, ponad, około*, and after a verbal noun such as *propagacja,
dopasowywanie*), the forms collapse: `one` is the genitive singular, and `few` and `many` share the genitive plural
(*pod okiem 1 satelity / 3 satelitów / 256 satelitów*; *propagacja 1 orbity / 3 orbit / 412 orbit*). In a locative
slot (*w … dniach*) there is one plural form: *w ostatnich 2 / 7 dniach*.

- **Two numbers side by side read as one.** Separate them: *Sprawdzono [812] przelotów ([412] satelitów
  obserwacyjnych i stacji załogowych).*
- **A quantifier never agrees with a numeral.** Write *Pokaż wszystkie satelity (31)* and *Pokaż jeszcze 40*, never
  *Pokaż wszystkie 31 satelitów*.
- *procent* doesn't decline after a numeral: *zachmurzenie 25 procent*, *2 procent*.

### 5.4 Lists of names

Use `f.list` (`Intl.ListFormat('pl', { type: 'conjunction' })`): *Umbra, Capella i ICEYE*, with no comma before *i*.
Never build a list with `join(', ') + ' and '`.

The radar sentence puts a classifier in front of the list, so the verb agrees with *satelity* (plural,
non-masculine-personal) whatever the names:

```ts
radar: (names: readonly string[], others: number, passes: number): Rich => {
  const rest = f.plural(others, { one: 'jeszcze jeden', few: `${f.int(others)} inne`, many: `${f.int(others)} innych`, other: `${f.int(others)} innych` })
  const times = f.plural(passes, { one: ' raz.', few: ' razy.', many: ' razy.', other: ' raza.' })
  const subject =
    names.length === 1 && others === 0
      ? `Satelita radarowy ${names[0]} był`
      : `Satelity radarowe ${f.list(others > 0 ? [...names, rest] : names)} były`
  return [`Radar nie potrzebuje światła. ${subject} w zasięgu `, num(f.int(passes)), times]
},
```

Results: *Satelity radarowe Umbra-08, Capella-14 i 7 innych były w zasięgu [1204] razy.* · *Satelity radarowe Umbra i
Capella były w zasięgu [12] razy.* · *Satelity radarowe Umbra i jeszcze jeden były…* · *Satelita radarowy Umbra był w
zasięgu [12] razy.*

### 5.5 Dates and times inside sentences

- **Time:** *o 16:14:21 UTC*, *o 11:21 czasu lokalnego*, *około 07:49 CET*. 24-hour, with colons, from Intl or as it
  arrives. No *godz.* before a time in prose. The old print form *16.14* is not used.
- **Dates in prose:** `formatDate` with `{ day: 'numeric', month: 'long' }` gives the genitive *1 listopada*, which is
  correct after a number. With the year: *1 listopada 2026*, with no *r.* after it.
- **Weekdays never follow a preposition.** Intl returns the nominative (*niedziela, środa, sobota*), but *w* needs the
  accusative (*w niedzielę*). Use a weekday only in a stamp (*niedz., 1 lis*), a spoken date (*piątek, 6 listopada*) or
  a readout. *7 dni do 1 lis 2026* drops the weekday for this reason.
- **Months** come from Intl in the right case: never hand-type *listopad* where *listopada* is needed.
- **Cadence:** *co [10] minut*, *co [2] minuty*, *co minutę*.
- **Years** in labels: *od 2015*, never grouped. In running prose a bare year takes *r.* (*od 2015 r.*), but not in
  mono labels and not after a full date.
- **Relative times** come from `relativeFormat('pl')` (`dates.ts`). Running UI and mono readouts use the short style:
  *41 godz. temu*, *12 min temu*, *2 dni temu*, *za 3 godz.*, and *przed chwilą* under 45 s (unit `'second'` from
  `relativeParts`). Spoken and aria use the long style: *41 godzin temu*, *1 godzinę temu*, *za 3 godziny*. *h* in
  running UI reads as foreign.
- **Durations:** *38 s*, *4 min 12 s*, *1 godz. 02 min*.
- **At sea:** *UTC−9 · na morzu*.

---

## 6. Typography and formatting conventions

### 6.1 Characters

Polish needs Latin plus Latin Extended-A (*ą ć ę ł ń ó ś ź ż Ą Ć Ę Ł Ń Ó Ś Ź Ż*) and „ ” « » ’ – … ° ± ×. All of them
are in the fonts the site and the card load. → and ≈ are used only where English already uses them (the house range
arrow, "≈ 16:14"); they fall back to a system face exactly as in English, so add no new ones. Don't use anything else:
no ‚ ‘ single low quotes, no U+202F, no emoji, no *º* ordinal.

### 6.2 Quotation marks, apostrophe, file names

- Primary: **„…”** (U+201E, U+201D): *nazywamy to „Satelita mógł spojrzeć”*. Nested: **«…»**.
- Never ASCII "…", never English “…”, never ,,…'' typed with commas.
- The apostrophe **’** appears only in foreign names (*Côte d’Ivoire*, *Kennedy’ego*). Never build a case ending on a
  runtime name with an apostrophe: rephrase.
- **File names** (`slug()` in `src/ui/results/lib/captures.ts`, `slugOf()` in `src/ui/timelapse/video.ts`) use NFKD,
  and *ł* doesn't decompose: *Łódź → odz*, *Wrocław → wroc-aw*, *Białystok → bia-ystok*. Before `normalize('NFKD')`,
  map *ł → l* and *Ł → L* (reuse the table in `src/imagery/placeKey.ts`, which the search already applies). This is
  free and fixes every language's file names. The PNG's own word is *tydzien* (ASCII).

### 6.3 Dashes, ellipsis, spaces

- The sentence dash is a spaced en dash, **" – "**. Use it sparingly: the owner's copy avoids dashes, so prefer a full
  stop, a colon or a semicolon.
- Ranges take an unspaced en dash: *10–30 m*, *250–375 m*, *2015–2026*, *30–45 stopni*.
- **Date spans keep the house arrow**, built from two `formatDate` calls with the English elision (the month or year
  written once): *1 → 8 lis*, *29 paź → 5 lis*, kicker *1 → 8 LIS 2026 UTC*, *29 PAŹ → 5 LIS 2026 UTC*, *29 GRU 2026 →
  5 STY 2027 UTC*. Intl's `formatRange` (*29 paź–5 lis 2026*) is not used: Polish typography spaces a dash between
  multi-word ends, and every other span in the product is an arrow.
- Ellipsis: the single character **…**, with no space before it: *Pobieranie…*, *Ustalanie…*.
- No space before *: ; ? ! %* (Polish is not French): *25%*, *Czy mnie widać?*
- **No-break spaces (U+00A0)**, written `\u00a0` in source:
  - after one-letter words (*a, i, o, u, w, z* and their capitals) in display headlines, the sub line, share card
    text and every string of two lines or less. Polish typesetting forbids leaving them at the end of a line: *w ostatnich*,
    *i ich prawdziwe zdjęcia*;
  - between a number written in a string and its noun or unit (*7 dniach*, *31 obrazów*). A `num()` part
    keeps its own unit;
  - inside Intl's grouping (*12 847*): Intl puts it there, so don't replace it.

### 6.4 Numbers

| Thing | Format | Source |
|---|---|---|
| decimal | comma: *7,46*, *12,4* | `f.dec` |
| grouping | no-break space, only from five digits: *1715*, *12 847*, *1 234 567* | `f.int` (CLDR pl `minimumGroupingDigits` 2) |
| percent | no space: *25%* | |
| degrees | no space: *12,4°*, *±30°* | |
| units | a space: *786 km*, *7,46 km/s*, *10 m*, *375 m na piksel* | |
| multiplier | *2,5×* | `f.dec(k, 1)` |
| **coordinates** | **international notation, exactly as they arrive**: *52.23, 21.01* · HUD *SŁOŃCE 16.2°S 063.0°E* · seat *(0.2°W)* · row *0.0°E* | already written by code |
| approximations | prose *ok. 10 km* / *około 07:49*; readouts *≈ 07:49* | |

Coordinates are international notation and arrive pre-formatted (`hud.sun`, `geo`, `globe`, the pin card, URLs).
Google Maps in Polish writes *52.2297, 21.0122*, and a comma decimal inside a comma-separated pair (*52,23, 21,01*) is
unreadable. `landing.searchDown` keeps *43.47, −80.54* exactly, because the field parses it. Every other number takes
the decimal comma.

**Search input (a separate, optional engineering note):** a Polish user may type *52,23 21,01* or *52,23; 21,01*. The
parser can accept a decimal comma when the two numbers are separated by a space or a semicolon. The ambiguous *52,23,
21,01* stays a text search. The placeholder avoids the question: *Nazwa, adres lub współrzędne*.

### 6.5 Dates and times

| Use | Format | Example |
|---|---|---|
| `time.day` (pass rows, captions, the HUD clock) | Intl `weekday: 'short', day, month: 'short'` | *niedz., 1 lis* → mono *NIEDZ., 1 LIS* |
| `time.weekdayShort` | Intl `weekday: 'short'` | *niedz.* |
| `time.dayCompact` (about 5 characters) | the Polish calendar's two-letter forms from `p.dow`: *nd, pn, wt, śr, cz, pt, sb* | *nd 1* → *ND 1* (Intl's narrow form is ambiguous: P/P, S/Ś) |
| `time.dayMonth` | Intl `day, month: 'short'` | *29 paź* |
| `time.daySpoken` | Intl `weekday: 'long', day, month: 'long'` | *piątek, 6 listopada* |
| `time.stamp` | day + clock + zone | *niedz., 1 lis · 11:21 EST* |
| prose date | Intl `day, month: 'long'` (+ `year`) | *1 listopada*, *1 listopada 2026* |
| card stamp / week | | *niedz., 1 lis 2026 · 11:21 EST* · *7 dni do 1 lis 2026* |
| time-lapse frame | Intl `day, month: 'short', year` at UTC | *22 paź 2019* |
| HUD and footnote stamps | ISO, as they arrive | *2026-11-08 03:31:07 UTC*, *2026-11-08 03:34Z* |
| clock | 24 h with colons | *16:14:21* |

Months and weekdays are **lowercase** in Polish (*listopada*, *niedziela*), and uppercase only through CSS in mono
labels. CLDR's Polish month abbreviations take no dot (*lis, paź, gru*); weekday abbreviations do (*niedz., pon., śr.*).
Take both as Intl gives them.

### 6.6 Compass

**Readouts** (`pass.compass16`, coordinates, the heading unit) keep the international letters **N, NNE, NE, ENE, E,
ESE, SE, SSE, S, SSW, SW, WSW, W, WNW, NW, NNW**, as Polish cartography and Polish Wikipedia write them. Never use
Polish letters (*Pn, Pd, Wsch, Zach*), and never translate *W*: a reader could take a Polish *W* for *wschód* (east),
the opposite of west.

**Prose** uses Polish words, from two tables chosen by the sentence (the English comment asks for two):

| Point | `MOTION`: heading and offset (*na* + acc.) | `SKY`: position in your sky (*na* + loc.) |
|---|---|---|
| n | na północ | na północy |
| ne | na północny wschód | na północnym wschodzie |
| e | na wschód | na wschodzie |
| se | na południowy wschód | na południowym wschodzie |
| s | na południe | na południu |
| sw | na południowy zachód | na południowym zachodzie |
| w | na zachód | na zachodzie |
| nw | na północny zachód | na północnym zachodzie |

*lecąc na południe*, *61 km na zachód stąd*, *przesuwając się na północ*, but *45° nad twoim horyzontem, na północnym
zachodzie*. The share page's `moving(heading)` uses `MOTION`.

### 6.7 Capitalisation

- **Sentence case everywhere.** Polish never title-cases headings: *Jak to działa*, *Co znaczą etykiety*, *Czego nie
  widać*.
- Capitals for proper names only: *Ziemia* (the planet), *Słońce* (the body), *Strefa Gazy*, *Zachodni Brzeg*,
  *Europejska Agencja Kosmiczna*, *Wielki Kanion*. Lowercase: months, weekdays, nationalities and adjectives from names
  (*europejski, amerykański*), *ty / twój*, *satelita*, *stacja kosmiczna*, *ziemia* (the ground), *słońce*
  (sunlight), *obwód kijowski*, *stan Waszyngton*, *rzeka Huangpu*.
- After a colon in running text, lowercase (*Zachmurzenie całej sceny: 25%*). A label and its value: lowercase
  (*Kanał: podczerwień*).

### 6.8 Uppercase mono labels

- Labels are written in sentence case in the catalog and uppercased by CSS. Boot sets `lang="pl"` on `<html>`, so
  casing and screen-reader pronunciation follow Polish. Uppercasing is safe (*ą→Ą, ł→Ł, ó→Ó, ś→Ś, ż→Ż*), and Polish has
  no special casing rules. Canvases and satori use `toLocaleUpperCase('pl')`.
- What they look like: *OSTATNIE 7 DNI*, *02 / PRZELOTY*, *WYSOKOŚĆ 786 km*, *OD PIONU 4,2°*, *PIKSEL 10 m*, *KURS
  194,6° · SSW · NA PŁD.*, *UJĘCIE 11:21:21 EST · 10 m*, *LINIA 0412 → 1024*, *12 847 OBIEKTÓW · POBRANO 2026-11-08
  03:34Z · 5 GODZ. TEMU*, *SŁOŃCE 16.2°S 063.0°E*.
- **Never uppercased:** prose, the wordmark *Watched.*, URLs, file names, sensor names in sentences. Satellite names
  are uppercased by CSS only inside mono labels, as in English.
- **Diacritics over capitals.** Display headlines use leading 0.92 and a clip-path line-mask wipe. An accent on a
  capital (*Ś, Ź, Ż, Ć, Ń, Ó*: *Świnoujście, Żywiec, Ćmielów*) rises above the cap height and may be clipped by the
  mask or touch the line above. QA checks a place starting with *Ż* or *Ś* in the results headline and on the share
  card. *Ł* has no accent above, and the ogonek (*ą, ę*) sits in the descender space.

### 6.9 Line breaking

- No one-letter word at the end of a line (§6.3).
- Never break between a number and its unit or noun, inside *co najmniej*, or inside a satellite name (put no-break
  spaces inside multi-word names in display text: *WorldView Legion 4*).
- No automatic hyphenation (`hyphens: manual`, the default). Chrome's Polish hyphenation varies by platform, and the
  condensed display face needs none: *obserwowało* (11 letters) fits at 44 px on a 320 px phone.

### 6.10 Abbreviations

- The Polish rule: an abbreviation takes a dot when it doesn't end with the word's last letter (*godz.*, *ok.*,
  *wzgl.*, *płn.*, *płd.*, *ul.*, *np.*, *niedz.*) and none when it does (*dr*, *nr*). Unit symbols never take a dot
  (*km, m, min, s*).
- Use only the abbreviations this guide lists. Never invent one to save space (*Prawdop.*, *Zachm.*, *wst.*, *zst.*,
  *tyg.* in a label).

---

## 7. Length discipline

Polish runs **about 25 % longer than English** in prose, and short labels can double (*Share* 5 → *Udostępnij* 10),
because English one-syllable words map to three- or four-syllable Polish ones. There are no articles to drop, so the
savings come from choosing words.

**Strategies:**
- **Nouns, not verb phrases, in mono labels:** *WYSOKOŚĆ*, not *NA JAKIEJ WYSOKOŚCI*.
- **One imperative per button**, with no object where the context gives it (*Udostępnij* in the photo viewer, not
  *Udostępnij to zdjęcie*).
- **Prepositional phrases as states** (*W KADRZE*, *W ZASIĘGU*, *NAD GŁOWĄ*, *NAD PUNKTEM*): shorter than participles.
- **Symbols over words in readouts:** *min, godz., km/s, °, ·*.
- **Where a label can't fit, keep the glyph only** (Share in a tight header) and put the full Polish label in the
  `aria-label`.
- **Never abbreviate to fit**, except with the standard abbreviations in §6.10. If a label still doesn't fit, report
  it; never truncate it.
- **Budgets:** mono caps labels ≤ 1.3 × the English length; buttons ≤ 12 characters where English is ≤ 9; chips ≤ 20.
  Where a key's comment gives a pixel or character budget, that budget wins.

**Measured** (Martian Mono, from the card's TTFs at the code's sizes and 0.08em tracking; the site's 87.5 % width
gives the same advance):

| English | Polish | px en → pl | Container / note |
|---|---|---|---|
| Card hero, widest line *watched you* | *obserwowało* (four lines) | 408 → 402 | 466 px column (three lines: *w tym tygodniu.* 477–490 ✗) |
| Card footer *ENTER ANY PLACE ON EARTH* + host | *WPISZ DOWOLNE MIEJSCE* + host | 263 → 230 (+152) | 466 px row (*…NA ZIEMI* 329 ✗) |
| Card footer *SEE WHAT WATCHED YOU* | *ZOBACZ, CO CIĘ OBSERWOWAŁO* | 190 → 247 (+152) | 466 px row |
| *ELEVATION* (strip, card) | *ELEWACJA* | 72 → 64 | ~80 px cell (*NAD HORYZONTEM* 112 ✗) |
| *CLOUD AT SPOT* | *NAD PUNKTEM* | 104 → 88 | (*CHMURY W PUNKCIE* 128 ✗) |
| *OFF-NADIR* | *OD PIONU* | 72 → 64 | |
| *COULD HAVE POINTED HERE* (tile title) | *SATELITA MÓGŁ SPOJRZEĆ* | 176 → 169 | one line at 1280 px; wraps on phones like the English (*…TU SPOJRZEĆ*, 192, wrapped at 1280) |
| *LIKELY WATCHED* | *ZAPEWNE POD OKIEM* | 107 → 130 | one line at 1280 px (*PRAWDOPODOBNIE POD OKIEM*, 184, wrapped) |
| Lanes *OVERHEAD* | *W KADRZE · W ZASIĘGU · NAD GŁOWĄ · ZDJĘCIE* | 61 → 61 / 69 / 69 / 54 | lane gutter, about 8 characters |
| *12 THIS WEEK* | *12 Z TYGODNIA* | 92 → 100 | counter sized to 12 characters (*12 W TYM TYGODNIU* 130 ✗) |
| *RENDERING 42%* | *TWORZENIE 42%* | 104 → 104 | fixed 132 px button (*RENDEROWANIE 42%* 128 ✗) |
| *NEAR ME* while locating | *USTALANIE…* | 56 → 80 | about as wide as *W POBLIŻU* (72) (*LOKALIZOWANIE…* 112 ✗) |
| *POST TO X* | *WPIS NA X* | 72 → 72 | a third of a 360 px row (*OPUBLIKUJ NA X* 112 ✗) |
| *CLOSEST LOOK* (tag) | *UJĘCIE Z NAJBLIŻSZA* | 96 → 153 | chip ≤ 20 characters |
| *LAST CLEAR LOOK* (tag) | *OSTATNIE BEZ CHMUR* | 121 → 145 | card chip with day, name, pixel: *OSTATNIE BEZCHMURNE UJĘCIE* (209) leaves ~2 px ✗ |

**Character counts for the rest:**

| English | Polish | Chars | Note |
|---|---|---|---|
| SURPRISE ME | ZASKOCZ MNIE | 11 → 12 | |
| USE MY LOCATION | UŻYJ MOJEJ LOKALIZACJI | 15 → 22 | wide screens only; phones *ZNAJDŹ MNIE* (11), ≤ 400 px *W POBLIŻU* (9) |
| HOW THIS WORKS | JAK TO DZIAŁA | 14 → 13 | |
| LAST 7 DAYS | OSTATNIE 7 DNI | 11 → 14 | |
| SEARCH A PLACE | SZUKAJ MIEJSCA | 14 → 14 | |
| NEW SEARCH | SZUKAJ | 10 → 6 | shares one box with Cancel / Close |
| TIME-LAPSE | ROK PO ROKU | 10 → 11 | |
| ALL · DETAILED · WEATHER · RADAR | WSZYSTKIE · DOKŁADNE · POGODA · RADAR | 23 → 28 (segments) | each segment ≤ ~8–9, as the comment asks. *Szczegółowe* (11) and *Pogodowe* (8) would add 5 more. |
| SHARE | UDOSTĘPNIJ | 5 → 10 | glyph only where tight |
| DOWNLOAD IMAGE | POBIERZ OBRAZ | 14 → 13 | |
| COPY LINK / SAVE PNG / COPIED | KOPIUJ LINK / ZAPISZ PNG / SKOPIOWANO | 9 → 11 / 8 → 10 / 6 → 10 | |
| TRY AGAIN | PONÓW (share row, small buttons) · SPRÓBUJ PONOWNIE (fault notice) | 9 → 5 / 16 | |
| MADE WHEN YOU SHARE | POWSTANIE PO UDOSTĘPNIENIU | 19 → 26 | one ellipsised line |
| CLOUDED · 81% (status ≤ 14) | POCHMURNE · 81% | 13 → 15 | |
| CLOUD AT SPOT (status ≤ 14) | CHMURY TUTAJ | 13 → 12 | |
| DAILY MOSAIC (status) | DZIENNA MOZAIKA | 12 → 15 | within 1.3 × |
| AWAITING PASS | DO PRZELOTU | 13 → 11 | the countdown follows |
| INFRARED (band value, ≤ ~9) | PODCZERWIEŃ | 8 → 11 | no shorter honest word: QA the geostationary strip at 343 px |
| OVERHEAD (card readout, 116 px) | NAD GŁOWĄ | 8 → 9 | fits |

**QA before shipping (no cost):** the gallery bar at the 350 px laptop dock with four segments and *12 z tygodnia*
(Polish adds about 40 px there, so if it overflows, fix the layout, not the words); *PODCZERWIEŃ* in the geostationary
strip at 343 px; the landing hero at 320 px and 1280 × 800; the default and pass cards (hero ≤ 445 px, footer ≤ 466
px); a place starting with *Ż* in the headline and on the card; `?hl=pl` on every screen.

---

## 8. Sensitive content

**Surveillance and privacy.** The product's subject is being watched. Polish stays neutral and exact:
- Only *obserwować* and *pod okiem*. Never *szpiegować*, *inwigilować* (state surveillance of citizens: loaded and
  political), *śledzić* (stalking) or *podglądać* (voyeurism). The one exception is the factual phrase *satelity
  szpiegowskie*, which the English also says. The none headline says *znanych nam satelitów*, not *śledzonych*.
- Don't overclaim. *Pod okiem* counts passes, as "watched" does, and the verdict titles, the definitions and the
  second line say exactly what exists. Never turn *mógł* (could have) into *obserwował* (did), and never call a radar
  image *zdjęcie*.
- Privacy copy states facts in the present tense and makes no legal promises the English doesn't: *Liczymy
  wyszukiwania według miejscowości i przybliżonego obszaru ok. 10 km, nigdy według twojego dokładnego punktu.* Don't
  add RODO/GDPR vocabulary (*administrator danych*, *przetwarzamy dane osobowe*) unless the owner asks.
- No weapon or strike wording near satellites and places: *celować*, *namierzać*, *cel*, *trafić w* are not used
  (*trafić do kadru* / *trafił do mozaiki*, of a picture, are fine).

**War zones in Rok po roku** (`seasonRegions.ts`: Gaza Strip, West Bank, Ukraine, Lebanon). The UI never says why a
place's years all share one season, and Polish doesn't either. The caption is the same as anywhere else: *12
bezchmurnych ujęć · jedno z każdego lata* (or *z każdej jesieni / zimy / wiosny*). Never add *wojna, zniszczenia,
atak, okupacja, front* to a label or note. If a curated string ever names these places, use the standard Polish names:
*Strefa Gazy*, *Zachodni Brzeg*, *Ukraina*, *Liban*.

**Ukraine.** *Na Ukrainie* and *w Ukrainie* are both read as a political position in Polish, and the product's frames
never need either, because the place is always in the nominative. Avoid both. If a curated sentence ever names the
country, use the label frame *Ukraina: …*. Cities take the established Polish exonyms: *Kijów, Lwów, Charków, Odessa,
Chersoń, Zaporoże, Mikołajów, Donieck, Ługańsk, Mariupol, Bachmut, Czarnobyl, Prypeć*. Never the English *Kiev / Kyiv*,
never Russian transliterations. *Krym*, with no qualifier in UI copy.

**Other names.** Follow the official list of Polish names of the world (KSNG, *Urzędowy wykaz polskich nazw
geograficznych świata*) for any curated name: *Białoruś*, *Mołdawia*, *Kosowo*, *Tajwan* (never *Republika Chińska* or
*prowincja*), *Macedonia Północna*, *Turcja* (not *Türkiye*), *Czechy*, *Mjanma*, *Eswatini*, *Hongkong*. Since 2023
KSNG recommends *Królewiec* for Kaliningrad: use it in curated copy and leave gazetteer output alone. Polish cities
never get German names (*Gdańsk*, not *Danzig*; *Wrocław*, not *Breslau*). Country names at runtime always come from
`Intl.DisplayNames('pl')` (*Terytoria Palestyńskie*, *Mjanma (Birma)*, *Côte d’Ivoire*, *Sahara Zachodnia*): never
override them by hand. Gazetteer place names are shown as they come and never edited by translators.

**Glaciers.** Factual, with no alarm adjectives (*dramatycznie, katastrofalnie, alarmujący*). The caption names the
season (*jedno z każdego lata*). If a note ever explains it: *Każdy rok pokazuje koniec sezonu topnienia: połowę
sierpnia na północy, połowę lutego na południu.* Let the pictures carry the change.

**Darkness, military, private operators.** *Satelitów wojskowych i szpiegowskich zwykle nie ma w publicznych
katalogach.* State it plainly, without speculating about what they see.

---

## 9. Pitfalls and reviewer checklist

### 9.1 False friends and traps for this product

| Trap | Wrong | Right | Why |
|---|---|---|---|
| "actual" | *aktualne zdjęcia* | *prawdziwe zdjęcia* | *aktualny* = current. (*nieaktualny* = outdated is right for a stale catalog.) |
| "watched" as a label | *Obserwowane*, *Obserwuj* | *Pod okiem* | On Instagram, X and TikTok in Polish, *Obserwuj* = Follow, *Obserwowani* = Following, *Obserwujący* = Followers. In a sentence (*Coś cię obserwowało*) the surveillance sense is clear; alone it is a social button. |
| "watch" | *oglądać / obejrzeć* | *obserwować* | *oglądać* is for films and shop windows. |
| "closest look" | *najbliższe ujęcie* | *ujęcie z najbliższa* | With event nouns *najbliższy* means "upcoming" (*najbliższe spotkanie*). |
| "in swath" as a label | *W PASIE* | *W KADRZE* | Alone, *w pasie* = at the waist (*obwód w pasie*), or "in the lane". |
| "imaged" (radar) | *zobrazował* | *zarejestrował*, *zmapował* | *zobrazować* = to illustrate. |
| "could have pointed here" | *Kamera mogła tu spojrzeć*, *mógł tu celować* | *Satelita mógł spojrzeć* | Radar is not a camera; *celować* is weapon wording. |
| "pass" | *przejście, hasło, przepustka* | *przelot* | |
| "swath" | *pokos* | *pas obrazowania* | *pokos* is a mowing swath. |
| "scene" | *scenka, widok* | *scena* | The archive's whole tile. The HUD's replay clock is *Powtórka*, never *Scena*. |
| "crop circles" (Garden City) | *kręgi zbożowe* | *okrągłe pola* | *kręgi zbożowe* = the alien legend. |
| "heading" | *nagłówek* | *kurs* | |
| "full disc" | *pełny dysk* | *pełna tarcza* | |
| "resolution" | *rezolucja* | *rozdzielczość* | *rezolucja* is a UN resolution. |
| "season" | *sezon letni* | *lato*, *pora roku* | *sezon* is tourism or sport; *sezon topnienia* is fine. |
| "altitude" vs "elevation" | both *wysokość* | *wysokość* (km) / *elewacja* (°) | *Wysokość Słońca* is the one allowed exception. |
| "time-lapse" | *timelapse’u*, *timelapse* | *Rok po roku* | |
| "number of" | *ilość przelotów* | *liczba przelotów* | Countable nouns take *liczba*. |
| "between X and Y" | *między X i Y* | *między X a Y* | |
| "local time" | *lokalny czas 11:21* | *11:21 czasu lokalnego* | |
| "just now" | *teraz*, *właśnie teraz* | *przed chwilą* | |
| "41 h ago" | *41 h temu* | *41 godz. temu* | Intl short; *h* reads as foreign in running UI. |
| "ascending / descending" | *wst. / zst.* | *na płn. / na płd.* | Invented abbreviations. |
| "photographed" | *sfotografował*, *robił zdjęcia* | *obserwował*, *pod okiem*, *rejestrował obrazy* | Owner rule, as in English. |
| "satellites" | *satelici* | *satelity* | *satelici* is the masculine-personal form, i.e. people. |
| "imaging satellite" | *satelita obrazujący* | *satelita obserwacyjny* | |
| "imager" | *obrazownik, imager, skaner pogodowy* | *instrument, kamera, satelita pogodowy* | |
| "you" capitalised | *Cię*, *Twoje* | *cię*, *twoje* | §1.1. |
| "Earth" | *na ziemi* (the planet) | *na Ziemi* / *nad ziemią* | Planet vs ground. |
| "Copernicus" | *Kopernik* | *Copernicus* | The EU programme keeps its name. |
| declined names | *z Landsata*, *w Firefoksie*, *nad Warszawą* (runtime) | *z satelity Landsat*, *przeglądarki Chrome i Firefox*, *[PLACE]: …* | §4.2, §5.1. |
| calques | *w oparciu o, dedykowany, posiadać, na ten moment, dokonać obserwacji, celować w porę roku* | *na podstawie, własny, mieć, teraz, obserwować, szukać pory roku* | |
| English word order | *To jest prawdziwy obraz.* | *To prawdziwy obraz.* | |
| decimal comma in coordinates | *52,23, 21,01* | *52.23, 21.01* | §6.4. |
| Ambiguous *W* | *0,2°W* rewritten, or Polish letters | *(0.2°W)* as it arrives | §6.6. |

### 9.2 Reviewer checklist (run it on every string)

1. **[PLACE]** appears only as the subject of a verbless frame, beside a colon, as a heading, or in parentheses. Never
   after a preposition, as an object, as the subject of a verb, or picked up by *go / ją / je*. Prose uses *to
   miejsce / tu / stąd*. No `cap()` on a frame that starts with the place.
2. **[SAT]** is never the bare subject of a past tense. It sits behind *satelita* / *stacja* (the `crewed` flag), or
   the sentence is gender-free. The masculine without a classifier appears only in sentences that never run for a
   crewed station. A nameless satellite (`sat` undefined) gets its own words, never the `aSatellite` label.
3. **The reader** is never the subject of a past tense, a conditional or a gendered adjective. Pronouns are lowercase.
4. **Plural messages** have `one`, `few`, `many` and `other` (genitive singular), and a zero branch where a sentence
   would say zero. Check 0, 1, 2, 5, 12, 21, 22, 25, 101 and 1715 by hand. The verb and adjectives agree with the
   category (`many` → neuter singular verb).
5. **The case after the frame** is right: genitive after *pod okiem / bez / od / do / z / sprzed* and verbal nouns,
   locative after *w … dniach*.
6. **Numbers, dates, lists, relative times and country names** come from `fmt('pl')` / `dates.ts`, never typed:
   decimal comma, no-break grouping from five digits, *25%*, *12,4°*, *786 km*, *41 godz. temu*. Coordinates stay as
   they arrive.
7. **Vocabulary** matches the glossary: *obraz* counts everything, *zdjęcie* follows the English "photo", *przelot*,
   *pas obrazowania*, *w kadrze*, *ujęcie z najbliższa*, *scena*, *dokładny*, *Rok po roku*. Verdict words come only
   from §3.6, and a quoted verdict is its exact title in „ ”.
8. **Honesty:** the string says exactly what is on screen. *mógł* stays *mógł*; *co najmniej* stays until the count is
   final; radar is never a photo; a curated label names what the point is (*Elektrownia w Czarnobylu*).
9. **No banned words:** *fotografować, szpiegować, inwigilować, śledzić, oglądać* (for the product verb), *zobrazować,
   celować, namierzać*, *Obserwuj / Obserwowane* as labels, *aktualny* for "actual", *ilość* with countables,
   *timelapse*.
10. **Punctuation:** commas before *że, który, gdy, jeśli, więc, ale, a, czy* and around participles; none before a
    simple *i / lub*. „ ” quotes. *…* as one character. No space before *: ; ? ! %*. An unspaced en dash for ranges;
    the house arrow for date spans.
11. **No-break spaces** (`\u00a0`) after one-letter words in display text and short strings, between a number and its
    noun in a string, and inside multi-word satellite names in headlines.
12. **Capitals:** sentence case; lowercase months and weekdays; *Ziemia / ziemia* and *Słońce / słońce* used correctly;
    no title case.
13. **Readouts:** compass letters N/S/E/W and the 16-point abbreviations unchanged; prose uses the two Polish tables.
14. **Never translated:** names, sensors, agencies, UTC, NORAD IDs, the wordmark, licence lines (OpenStreetMap
    excepted). Foreign names sit behind a classifier when a preposition or a verb needs them, and are never declined.
15. **Rich parts:** the same kinds as the English (`num`, `accent`, `strong`), exactly one accent, and the strong part
    where the English comment says (the count phrase, the "at least" words, the part dropped on narrow phones). Each
    message reads with and without an optional strong part.
16. **Length:** within §7's budgets; nothing truncated or abbreviated ad hoc.
17. **Voice:** declarative, calm, no exclamation marks, no marketing verbs, no hedging filler, the uncanny fact last.
18. **Characters:** only Latin + Latin Extended-A and the punctuation in §6.1. The loading screen's slow line uses
    latin letters only.
19. **Display QA:** a headline whose place starts with *Ś / Ż / Ź / Ó*, checked for accent clipping in the mask wipe
    and on the share card.

### 9.3 Test values

Run every message with slots against these:
- **Places:** *Warszawa* (f.), *Kraków* (m.), *Katowice* (pl.), *Zielona Góra* (adj. + noun), *Niemcy*, *Stany
  Zjednoczone*, *Polska* (from Intl), *ul. Marszałkowska 1, Warszawa* (lowercase start), *52.23, 21.01* (coordinates),
  *東京*, *Ocean Spokojny*, *Świnoujście* and *Żywiec* (accent clipping), a 120-character address cut with "…".
- **Satellites:** *Sentinel-2C*, *Landsat 9*, *Umbra-08*, *Capella-14*, *Aqua*, *ISS (ZARYA)* (crewed),
  *WorldView Legion 4* (multi-word), *NORAD 60989*, and none (`undefined`).
- **Counts:** 0, 1, 2, 4, 5, 12, 21, 22, 25, 101, 112, 1715, 12 847.
- **Windows:** 7 days, 1 day, an older window (*między 29 paź a 5 lis*), a window across a year (*29 GRU 2026 → 5 STY
  2027 UTC*).

---

## Decisions log

The review's 40 numbered items and the 9 proposals of its section D (D1–D9): **33 accepted, 16 partly accepted, 0
rejected.** Section E (checked and sound) is kept as written.

| # | Item | Resolution |
|---|---|---|
| 1 | Blocker: the default card's hero overflows | Accepted. `card.hero` is four lines (*Coś cię / obserwowało / w tym / tygodniu.*); remeasured at 477 px for the three-line version against 466 (§3.1, §7). |
| 2 | Blocker: the default card's footer overflows | Accepted. `enterAnyPlace` *Wpisz dowolne miejsce* (230 + 152 px); `defaultAlt` quotes the shorter footer (§3.1, §3.5). |
| 3 | *przeleciał 786 km* reads as a distance flown | Accepted. *na wysokości [N km]* in every crossing sentence, share page and post (§3.4, §3.5). |
| 4 | The nameless-satellite fallback breaks classifier frames | Partly accepted. Option (a) is already in the code (`sat` arrives undefined), so each sentence writes its own words (*satelita*, *z nieznanego satelity*); `aSatellite` *Satelita* only for chips and the callout (§5.2). |
| 5 | The strategy relies on ICU and parameters the API lacks | Accepted. Every example is in the real API; zero is a branch; `crewed: boolean` requested on the four overhead messages, with *satelita* until it lands (§3.3, §5.2). |
| 6 | Share page and unfurl copy missing | Partly accepted. All frames written; `placeDescription` ends on the standard question, `opening` keeps the classifier, `cardAlt` and `bestFrom` reworded, nameless forms added (§3.5). |
| 7 | Coordinates must keep the dot | Accepted. International notation as they arrive (HUD, pin, seat *(0.2°W)*, URLs); the decimal comma everywhere else; parser note kept as optional (§6.4). |
| 8 | Font warming with Polish letters alone slows Polish | Accepted. Boot loads `FIRST_FONTS` with the hero's own text, and pl's latin-ext files are preloaded; the canvases already pass their text (Cost and speed). |
| 9 | *Kamera mogła tu spojrzeć* calls a radar a camera | Accepted. Title *Satelita mógł spojrzeć* (*tu* dropped in QA so the tile title fits one line); `verb` values are gender-free phrases (§3.6). |
| 10 | *W PASIE* reads as "at the waist" | Accepted. *W kadrze* for the likely lane, the geometry readout, the share frame and the card note; *pas obrazowania* for the width (§3.6). |
| 11 | *Najbliższe ujęcie* reads as "the next shot" | Partly accepted. *Ujęcie z najbliższa* everywhere; the last clear tag is decided now as *Ostatnie bez chmur*, because the full form leaves ~2 px on the card chip (§3.5, §7). |
| 12 | Strip labels too long; off-nadir term inconsistent | Partly accepted. *Elewacja*, *Od pionu*, *Nad punktem*, `unit.scene` *sceny*, `unit.up` empty, *Wysokość Słońca* as the stated exception; but `upCompass` prints the compass point alone, not a leading dot (§3.7). |
| 13 | Relative times and HUD ages | Accepted. Intl short (*41 godz. temu*); `catalogAge` written to the real signature with *Nieaktualny*; `fetched` *Pobrano* (§3.7, §5.5). |
| 14 | The night sentence's verb has no antecedent | Partly accepted. *Satelity pogodowe* replaces the invented *skanery*, but the sentence keeps "it saw" with *więc ten satelita widział twoje chmury, a nie ulice* instead of an impersonal *widać* (§2.4, §3.4). |
| 15 | The time-lapse's name and the loanword's cases | Accepted. *Rok po roku* is the feature's name; the row's second line is *To miejsce w kolejnych latach*, so the name isn't repeated (§3.8). |
| 16 | Tight strings without budgets | Partly accepted. *Pogoda*, *12 z tygodnia*, *Tworzenie 42%*, *Ustalanie…*, *Wpis na X*, *Ponów*, *Powstanie po udostępnieniu*; *Dokładne* chosen outright for detailed (not as a fallback) and used in the footnote too (§3.9, §7). |
| 17 | The zero headline uses *śledzić* | Partly accepted. The ban stays absolute; the frame avoids the word with *poza zasięgiem znanych nam satelitów*, shorter than the proposal and three card lines (§3.3, §8). |
| 18 | *obraz / zdjęcie* goes further than the English | Partly accepted. Mirror the English key by key, with the exception for anything that names or counts radar images; so the imaged lane is *Zdjęcie* but `verdictMore.imaged` says *obraz*; *z powodu chmur* (§0, §3.6). |
| 19 | The radar list makes bare names the subject | Accepted. *Satelity radarowe … były*, with the one-name *Satelita radarowy … był* and `jeszcze jeden` (§5.4). |
| 20 | *zobrazował* reads as "illustrated" | Partly accepted. *zarejestrował*, *mógł zmapować*; the mosaic sentence is rebuilt on *Obraz z jego instrumentu VIIRS trafił…*, not *radiometr*, because MODIS is a spectroradiometer (§3.4). |
| 21 | *robił zdjęcia* breaks the "photographed" rule | Accepted, with the subject made explicit: *gdzie ten satelita rejestrował obrazy* (§3.4). |
| 22 | *Sentinel-2 … mógł* is a bare-name past tense | Accepted. *…a tego miejsca mogło nie być w planie obrazowania*; the same fix applied to `why.unpublished` (§3.3, §3.4). |
| 23 | *wst. / zst.* are invented abbreviations | Accepted. *na płn. / na płd.* (§3.7). |
| 24 | Two relative clauses in the sub line | Accepted. *…i ich prawdziwe zdjęcia* (§3.2). |
| 25 | States in progress need the imperfective noun | Accepted. *Przygotowywanie obrazu…*, *Ponawianie…*, *Ustalanie nazwy…*, *Dopasowywanie…* (§1.2). |
| 26 | Four small rewrites | Partly accepted. Three as proposed; in the likely post the second sentence is *Pas obrazowania jego kamery objął ten punkt*, because the frame now says *w kadrze* (§3.3, §3.5). |
| 27 | *Pokaż wszystkie: 31*; `sats` | Partly accepted. *Pokaż wszystkie satelity (31)* keeps the noun, with the count in parentheses; *12 satelitów* in full (§3.7). |
| 28 | Place-first frames need two rules | Accepted. Keep the full stop after a cut place; never `cap()` a frame that starts with the place (§3.3, §5.1). |
| 29 | The window example breaks "all four" | Accepted. Four forms, *w ostatniej dobie* for one day (§3.3). |
| 30 | *Każdy rok celuje w…* is a calque | Partly accepted. *Co roku szukamy innej pory roku*, because *Co roku inna pora roku* would overclaim (the loop falls back to any clear date) (§3.8). |
| 31 | Don't prescribe *w Ukrainie* | Accepted. Avoid both; the label frame *Ukraina: …*; exonyms kept (§8). |
| 32 | *satelita obrazujący* is jargon | Accepted. *satelita obserwacyjny* (§4.1). |
| 33 | Quoted verdicts must match the titles | Accepted. Exact titles in „ ” in About and the engine notes (§3.6). |
| 34 | File names drop *ł* | Accepted. Map ł/Ł before NFKD, reusing `placeKey`'s table; `fileNamePlace` *miejsce* (§6.2). |
| 35 | The boot slow line mixes faces | Accepted. *Powolne wczytywanie*; `loading` and `title` as proposed (§3.1). |
| 36 | `darkStation` is stiff and says *stacja* always | Partly accepted. *jasny punkt, który nie mruga*; *stacja* stays, because the message is the station's and the engine gives the overhead verdict only to crewed stations (§3.4). |
| 37 | The HUD's *Scene* collides with *scena* | Accepted. *Powtórka*, also for the 02 section rule; the button stays *Odtwórz* (§3.7). |
| 38 | Two numerals side by side | Accepted. *Sprawdzono [812] przelotów ([412] satelitów obserwacyjnych i stacji załogowych).* (§5.3). |
| 39 | OpenStreetMap allows a Polish attribution | Accepted. *© autorzy OpenStreetMap (ODbL)*; the other licence lines stay English (§4.2). |
| 40 | → / ≈ coverage; the kicker | Accepted. → and ≈ fall back as in English, none added; the kicker and day ranges use the house arrow, not `formatRange` (§6.1, §6.3). |
| D1 | Globe callouts and pin card | Partly accepted. One noun for one event (*Ujęcie* for both `imaged` and `acquired`), *Zarejestrowano*, *Najbliżej*; the pin card is *Pinezka*, not *Upuszczona pinezka*, to match *Postaw pinezkę* (§3.7). |
| D2 | Engine progress lines | Partly accepted. As proposed, but in progress *Dopasowywanie*, and *Sprawdzanie mozaik NASA · 12 / 35* to stay within 40 characters (§3.7). |
| D3 | Fault notice | Accepted. *Usterka*, *Coś poszło nie tak.*, *Spróbuj ponownie*, *Ponawianie…*, *Wróć* (§3.7). |
| D4 | Time-lapse waiting steps | Accepted. *Przeglądanie archiwum*, *Wybór bezchmurnych ujęć*, *Wywoływanie klatek*, `tooFew`, `unreachable` (§3.8). |
| D5 | Short weekday for `dayCompact` | Accepted. *nd, pn, wt, śr, cz, pt, sb* from `p.dow` (§6.5). |
| D6 | Pass view leftovers | Partly accepted. *Widok z góry*, *Pokaż*, *Ostatni / Najbliżej*, *Obszar*; but `left` is *zostało 120* (with plural forms), because *jeszcze 40* would repeat the button beside it (§3.7). |
| D7 | Keys and credits | Accepted. *Enter / Spacja / Esc*, *Autor: @armaangupt0*, *Armaan, @armaangupt0 na X*, *Język: Polski. Zmień* (§3.9). |
| D8 | Curated places | Accepted. The full table of all 57 entries, with *Elektrownia w Czarnobylu* (the point is the plant) and *okrągłe pola* (not *kręgi zbożowe*) (§4.3). |
| D9 | Aria built from titles | Accepted. The timeline summary is label: value pairs, and `Timeline.tsx` gets a message instead of `${n} ${title.toLowerCase()}` (§3.6). |
