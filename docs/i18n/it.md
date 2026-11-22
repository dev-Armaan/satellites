# Watched: Italian (it) localisation style guide

Every translator and reviewer of Watched in Italian follows this guide. It is written for **it-IT** (Intl tag `it`)
and binds every surface: the landing, results, pass detail, gallery and photo viewer, time-lapse, share sheet, share
cards, share pages and post text, the HUD, the globe, About, the loading screen, errors and aria labels.

The English source and `docs/DESIGN.md` §7 set the voice: declarative, specific, quietly uncanny, second person, real
numbers. This guide says how that voice sounds in Italian and settles every choice a translator would otherwise make
alone. Every answer here is final. Alternates appear only so reviewers know what was considered and why it lost. Where
this guide and the English disagree on a fact, the English wins and this guide is wrong: report it.

**Notation.** Italian copy is in *italics*. In frames, `*word*` is the serif italic accent in signal orange (one per
screen) and `**words**` the bold count phrase. `[PLACE]`, `[SAT]`, `[NUM]`, `[TIME]`, `[ZONE]`, `[DAY]`, `[DIR]` are
runtime slots. Numbers in examples sit in their own mono span, shown as `786 km`.

**Cost and speed (owner requirement).** Italian must not cost anything to serve and must not slow the site down.
- Every character Italian needs (à è é ì ò ù, À È É, « », “ ”, ’, …, °, –, −, ·) is in the Latin subset the site
  already loads. Italian downloads no extra font file and adds no emoji or symbol from outside that subset.
- The share card's bundled fonts (`api/_fonts/*-latin.ttf`) have no **→**, **≈** or **±**. Card copy (everything in
  `api/_lib/i18n/card/it.ts`) never uses them. The app's own fonts have them, so app copy may.
- Numbers, dates, plurals, lists, relative times and country names come from the browser's built-in `Intl` (zero
  bytes, no library, no request). Never hand-format them in a string, except where this guide says to build a form
  from Intl parts (§5.5, §6).
- Strings ship in the build, as one language chunk. No runtime or machine translation, no translation API, no
  per-language images or card templates: the card renderer prints the Italian text with the fonts it already bundles.
- Keep strings close to English length (§7) so no layout needs a new breakpoint.

**Engineering requests (all zero cost: catalog text, one CSS rule or a few lines in existing files; no request, font,
service or dependency).**
1. `src/styles/scripts.css`: `:root:lang(it) { --display-k: 0.9; }` for the landing hero (§3.1). Required.
2. `src/imagery/geocode.ts parseCoordinates`: accept the true minus − (U+2212) and a decimal comma when the two numbers
   are separated by a space or a semicolon (*43,47 -80,54*, *43,47; -80,54*). English's own example (*43.47, −80.54*)
   does not parse today. Required (it fixes English too).
3. `VERDICT_META` (`src/ui/results/lib/meta.ts`) and the sentences in `src/ui/results/lib/copy.ts` and `Summary.tsx`
   must move into catalogs before Italian can ship. This guide gives their Italian (§3).
4. Optional, after launch: pass the place's kind (country, region, feature) to the headline messages (§5.1). Nothing
   in this guide depends on it.

---

## 0. Decisions at a glance

| Question | Decision |
|---|---|
| Address | **tu**, on every surface. The product is **noi**. Never Lei, never voi, never impersonal *si* in place of *tu*, never the product as *io*. |
| Product verb "watched" | **osservare**: *ha osservato*, *hanno osservato*. Never guardare, vedere, sorvegliare, spiare, fotografare. |
| Verdict verbs | watched *ha osservato* · swept over *ha inquadrato* · passed within view *aveva a portata* · passed over *ha sorvolato* |
| Verdict titles | *Osservato* · *Probabilmente osservato* · *Poteva puntare qui* · *Nel tuo cielo*; lanes *Foto* · *Probabile* · *Possibile* · *In cielo* |
| Hero (landing) | `Qualcosa` / `questa settimana` / `ha osservato *te*.` |
| Hero (default share card) | Five lines at 88 px: `Qualcosa` / `questa` / `settimana` / `ha osservato` / `*te*.` |
| Running-text hero | *Qualcosa, questa settimana, ha osservato te.*; tab title *Watched · Qualcosa ti ha osservato questa settimana* |
| look (a satellite's image of the place) | **ripresa**, f.: *Ripresa più vicina*, *Ultima ripresa limpida*, *11 riprese limpide* |
| Past tense | Passato prossimo for events, imperfetto for states. Never passato remoto. |
| Buttons | Second-person singular imperative (*Condividi*, *Copia link*, *Rivedi*). Never infinitive. |
| [PLACE] | Bare direct object of a transitive verb, or after a colon or a middle dot. Never after a preposition, never after *cosa / chi* + singular verb. |
| [SAT] as subject | *avere* perfects, present, imperfetto, gerunds, verbless phrases. Nothing agrees with it. No article. |
| Plurals | CLDR `one` / `many` / `other`. `many` (exact millions) takes *di*: *1.000.000 di immagini*. |
| Numbers | *1715*, *12.847*, *7,46*, *25%*, *12,4°*, *786 km* (Intl `it`). |
| Coordinates | International everywhere: decimal point and N S E W (*16.2°S 063.0°E*, *43.47, −80.54*). |
| Compass | Readouts: international letters (N, NNW, WSW). Prose: Italian words (*nord-ovest*), *a* for position, *verso* for motion. |
| Dates | Readouts *dom 1 nov*; prose *domenica 1 novembre*; the article is chosen by the message (*dal 29 ottobre*, *dall’8 novembre*). The 1st is *1*, never *1º* or *1°*. |
| Quotes | « » outside, “ ” inside. Typographic apostrophe ’ always. |

---

## 1. Register and address

### The decision: tu everywhere

Watched speaks to one person, alone with a globe, about something that happened to them. In Italian that is **tu**.
The consumer products Italians use daily (Apple, Google, Spotify, Netflix, WhatsApp) address their users as tu. On a
product whose hook is "something watched you", Lei sounds like a bank.

There is also a grammatical reason, and it settles the question. Italian participles agree with a preceding object
pronoun. With Lei the pronoun is *La*, and agreement after *La* is compulsory, so the hero would read *Qualcosa L’ha
osservata* (a woman) or *L’ha osservato* (a man). We never know which. With tu, every form we use is gender-free: the
stressed *te* after the verb never triggers agreement (*ha osservato te*), and agreement after *ti* is optional in
standard Italian (*ti ha osservato* is correct for any reader).

| Surface | Register | How it looks | Why |
|---|---|---|---|
| Display headlines (hero, results, About title, time-lapse) | tu, declarative | *Qualcosa, questa settimana, ha osservato te.* | The poster talks to one reader. |
| Sentences and prose (pass sentences, footnotes, captions) | tu where English says *you*; *noi* for the product | *Il suo ha visto le tue nuvole, non le tue strade.* | Mirrors English: *we* is Watched, *you* is the reader. |
| UI labels and buttons | Imperative 2nd singular | *Condividi*, *Cerca un luogo*, *Salva PNG*, *Riprova* | Standard modern Italian UI. The infinitive (*Condividere*) reads as a manual. |
| Status words (loading, retrying, locating) | Nouns, never a verb in the 1st person | *Caricamento…*, *Nuovo tentativo…*, *Posizione…* | The product is *noi*; *Carico…*, *Riprovo…*, *Localizzo…* would make it *io*. |
| Mono caps labels | No address: nouns or noun phrases | *QUOTA*, *ULTIMI 7 GIORNI*, *NEL TUO CIELO* | Labels name things. *tuo* appears only where English says *your*. |
| Error notices | tu + *noi*, declarative, subject first | *Non siamo riusciti a caricare il catalogo delle orbite. Controlla la connessione e riprova.* | Says what happened, then what to do. Never *Si è verificato un errore*. |
| About page | tu + *noi*, plain and conversational | *Scegli un punto sulla Terra. Calcoliamo quali satelliti l’hanno sorvolato nell’ultima settimana.* | The owner's English is short and plain. |
| Share post and share page (read by the sharer's audience) | Third person about the satellite; *ti* only in the closing question and hook | *Sentinel-2C ha osservato Waterloo da 786 km di quota.* | The post states facts to strangers. |

### Rejected alternatives

- **Lei** (formal). It forces gender agreement we can't supply (*L’ha osservata/o*), fills copy with capitalised
  pronouns (*La*, *Le*, *Suo*), and puts the reader at the distance of a public office, which kills the hero's
  intimacy.
- **voi** (plural you, as some retailers use). The reader is alone; *voi* turns them into a crowd and sounds like
  customer service.
- **Impersonal** (*si osserva*, *è possibile cercare*, infinitive buttons). It removes the second person, which is the
  product's hook, and sounds bureaucratic.

### Rules that keep tu gender-free

Never write an adjective or participle that agrees with the reader.
- ✗ *Sei stato osservato*, *Benvenuto*, *Sei pronto?*, *Sei sicuro?*, *Tranquillo*
- ✓ *Qualcosa ha osservato te*, *Da te era buio.*, *Se eri a portata…* (no participle)

---

## 2. Voice

### How the voice sounds in Italian

- **Declarative.** Main clause first, subject before verb, one fact per sentence. *Il sole non è mai sorto.* Italian
  tends towards long sentences with several subordinate clauses. We don't write that way.
- **Specific.** Every number is real and in a mono span. Name the satellite, the time and the distance. Never use
  vague quantifiers (*alcuni*, *diversi*, *numerosi*) where the English gives a number.
- **Quietly uncanny.** The unease comes from plain facts placed close to the reader: *786 km sopra di te*, *le tue
  nuvole, non le tue strade*. Never raise the voice: no exclamation marks, no rhetorical questions beyond the two the
  English asks (the share hook and *Cosa ti ha osservato questa settimana?*), no *incredibile*, *pazzesco*, *scopri*,
  *finalmente*.
- **Second person.** *tu*, *ti*, *te*, *tuo* exactly where English says *you* / *your*, never more often. Adding *you*
  where English has none is the commonest way to make Italian copy sound like marketing.

### Rhythm and length

- Sentences: at most 20 words, at most one subordinate clause. Past 25 words, split at the clause boundary with a full
  stop or a colon.
- A colon does in Italian what "so" does in English: *Era giorno: quasi certamente l’ha registrato.* Use it instead
  of *quindi* chains. One *quindi* in a sentence is fine.
- Verbs, not nominalisations. ✗ *effettuazione del calcolo*, ✗ *procedere alla condivisione*; ✓ *calcoliamo*,
  ✓ *condividi*. Status labels are the exception (*Caricamento…*, *Propagazione delle orbite*): they name a process.
- Active voice in sentences addressed to the reader. No *viene effettuato*, *viene mostrato*. Two passives are kept:
  the second line's *sono state pubblicate* (the owner's "were made public"), and *essere* passives in footnotes where English uses a
  passive and the agent doesn't matter (*I passaggi sono calcolati solo dalla geometria orbitale.*).
- Put the new or heavy information last. Italian end-weight is natural: the place ends the headline, *te* ends the
  hero.
- Movement is a verbless phrase, never *procedendo* (police-report register: *il veicolo procedeva in direzione sud*):
  *…alle `16:14:21 UTC`, verso sud a `7,46 km/s`.*

### What to avoid

- **Marketing tone:** *Scopri subito…*, *Esplora…*, *Il tuo pianeta come non l’hai mai visto*, *gratis!*
- **Bureaucratic tone:** *Si prega di…*, *Si informa che…*, *in corso di elaborazione*, *Impossibile procedere*, *Si è
  verificato un errore*, *procedendo in direzione*.
- **Calques:** *fare senso* → *avere senso*; *in accordo a* → *secondo*; *supportare* (a feature) → *funzionare con*;
  *realizzare* (realise) → *rendersi conto*; *attualmente* (actually) → *davvero*; *scansionare* (an office scanner) →
  *scandire* for instruments.
- **English structure:** stacked noun modifiers (✗ *immagine archivio Sentinel*), possessive chains (✗ *la linea della
  scansione di questo satellite*), English adverb order (✗ *è ancora non pubblicata*).
- **Emoji, hashtags, exclamation marks, ellipses for suspense.**

### Before and after

1. *The image archives didn’t answer, so we can’t count the public images right now.*
   - ✗ *Gli archivi di immagini non hanno risposto, pertanto non è possibile effettuare il conteggio delle immagini
     pubbliche in questo momento.* (bureaucratic, nominalised)
   - ✓ *Gli archivi delle immagini non hanno risposto: per ora non possiamo contare le immagini pubbliche.*
2. *It was dark here. Weather imagers keep scanning at night in infrared, so it saw your clouds, not your streets.*
   - ✗ *Era buio qui. I generatori di immagini meteo continuano la scansione nell’infrarosso di notte, quindi esso ha
     visto le tue nuvole.* (calque "imager", *esso*)
   - ✗ *…continuano a scansionare nell’infrarosso: ha visto le tue nuvole…* (the dropped subject of *ha visto* points
     back to the plural *strumenti*)
   - ✓ *Qui era buio. Di notte gli strumenti meteo continuano a scandire nell’infrarosso: il suo ha visto le tue
     nuvole, non le tue strade.*
3. *Can it see me? No. At best a pixel here is 10 m across. A car is one pixel. You’re not in it.*
   - ✗ *Mi può vedere? No. Nel migliore dei casi, un pixel qui è largo 10 metri. Una macchina corrisponde a un pixel. Non
     sei presente nell’immagine.* (padding, *presente*)
   - ✓ *Un satellite può vedermi? No. Nel migliore dei casi un pixel misura 10 m. Un’auto è un pixel. Tu lì dentro non ci sei.*
4. *See every satellite that passed over it in the last 7 days, and the actual pictures they took.*
   - ✗ *Scopri tutti i satelliti che sono passati sopra di esso negli ultimi 7 giorni e le foto attuali che hanno
     scattato!* (marketing verb, *esso*, false friend *attuali*, exclamation)
   - ✓ *Vedi tutti i satelliti che l’hanno sorvolato negli ultimi 7 giorni, e le immagini vere che hanno ripreso.*
5. *Sentinel-2C crossed 786 km overhead at 16:14:21 UTC, moving south at 7.46 km/s.*
   - ✗ *Sentinel-2C è passato sulla verticale a 786 km alle 16:14:21 UTC, procedendo in direzione sud…* (gendered
     *è passato*, police register)
   - ✓ *Sentinel-2C ha attraversato il cielo `786 km` sopra di te alle `16:14:21 UTC`, verso sud a `7,46 km/s`.*

---

## 3. The key lines

### 3.1 Hero

**Landing (final):**

```
Qualcosa
questa settimana
ha osservato *te*.
```

```ts
hero: [['Qualcosa'], ['questa settimana'], ['ha osservato ', accent('te'), '.']] as Rich[]
```

Lines of 8 / 16 / 16 characters (English 9 / 11 / 10). The accent is ***te***: the reader, the human moment.

Why it wins:
- *te* is the stressed form of *you*, the only Italian *you* that can carry emphasis. The clitic *ti* can't be
  stressed, so setting it in the accent would look like a typo.
- A stressed *te* is a contrastive focus, and Italian puts focus last. Ending on *te* reads as a finger pointed at the
  reader (*Cerchiamo te*, *Voglio te* for Uncle Sam's *I want you*). Mid-sentence, followed by *questa settimana*, it
  sounded translated.
- *Qualcosa* stays first: the uncanny agent opens the poster, as in English.
- Nothing agrees with the reader: a participle never agrees with an object that follows it.
- *osservare* carries the idiom *sentirsi osservati* (to feel watched) and is the real technical term (*satelliti di
  osservazione della Terra*).
- On the poster, the line breaks stand for the commas of the running form.

Alternates: `Qualcosa` / `ha osservato *te*` / `questa settimana.` (the focus buried mid-sentence);
`Questa settimana` / `qualcosa` / `ha osservato *te*.` (loses *Qualcosa* as the opener); `Qualcosa` / `ti ha
*osservato*` / `questa settimana.` (the accent marks the act, not the person).

**Landing layout.** The widest Italian line (*questa settimana*, about 5.7 em) is about 24% wider than English's
(*watched you*, about 4.6 em). The mechanism is the existing token: `:root:lang(it) { --display-k: 0.9; }` in
`src/styles/scripts.css`. Visual QA confirms one line per row at 1024×768, 1280×800, 1366×768 and 1440×900 (1024×768
is the tight one: a 452 px column). If a row still wraps, engineering lowers the factor. Never reword the hero to fit,
and never let it take a fourth line. `Landing.tsx` measures where the text ends to frame the globe, so the globe moves
with the line: expected.

**Default share card (`card.hero`, its own key).** The card sets the hero in explicit lines at a fixed 88 px in a
466 px column and never re-wraps them. *questa settimana* alone measures about 500 px there (more in satori), so it
cannot share a line. Final:

```ts
hero: [['Qualcosa'], ['questa'], ['settimana'], ['ha osservato'], [accent('te'), '.']] as Rich[]
```

Widest line *ha osservato* (about 365 px). Five lines take about 425 px of the 471 px band. *te.* alone on the last
line, in serif orange, is the card's human moment. Check every line of a card hero at 88 px, never only the landing.

**Running-text forms (all written together):**

| Where | Italian |
|---|---|
| `card.page.title`, og:image alt, README, `index.html` | *Qualcosa, questa settimana, ha osservato te.* |
| `share.hookWatched` ("…this week too.") | *Qualcosa, questa settimana, ha osservato anche te.* (*anche te* is why the stressed form pays off) |
| `app.documentTitle` and the boot `title` | *Watched · Qualcosa ti ha osservato questa settimana* (the verb lands inside the ~30 characters a tab keeps) |
| About title (`How this` / `*works*.`) | `Come` / `*funziona*.` |
| `card.invite` (footer, *See what watched you*) | *Vedi cosa ti ha osservato* (*ti* can only be the object; *Guarda cosa…* carries the reproach "look what you did") |

### 3.2 Sub line

English: *Enter any place on Earth. See every satellite that passed over it in the last 7 days, and the actual pictures
they took.*

**Final:** *Scegli un luogo qualsiasi sulla Terra. Vedi tutti i satelliti che l’hanno sorvolato negli ultimi
`7`&nbsp;giorni, e le immagini vere che hanno ripreso.*

Two tu imperatives, as in English. *Scegli* covers typing, the chips and dropping a pin. *l’hanno sorvolato* agrees
with *luogo*, a noun written in the sentence. *vere* says "actual" without the false friend *attuali* (= current).
*ripreso* is the Italian imaging verb and avoids *fotografato*. The comma before *e* sets the pictures apart as the
payoff. `days = 1`: *nell’ultimo giorno*. The same text is `card.page.description`.

Alternates: *Cerca un luogo qualsiasi della Terra. Vedrai ogni satellite che ci è passato sopra…* (the future sounds
like a promise; *ci è passato sopra* is chatty); *Scrivi un luogo qualsiasi: ecco ogni satellite…* (*Scrivi* excludes
the pin and the chips; *ecco* is a salesman's word).

### 3.3 Results headline and second line

Bold = the count phrase, verb included, as in English. Serif accent = the place name only. The full stop after the
place is neither bold nor serif.

**Headline (Italian has three CLDR categories: `one`, `many`, `other`):**

| Case | Italian |
|---|---|
| `one` (N = 1) | Negli ultimi `7` giorni, **`1` satellite ha osservato** *[PLACE]*. |
| `other` (2, 256, 1715…) | Negli ultimi `7` giorni, **`256` satelliti hanno osservato** *[PLACE]*. |
| `many` (exact millions; unreachable in practice, supply it anyway) | Negli ultimi `7` giorni, **`1.000.000` di satelliti hanno osservato** *[PLACE]*. |
| Zero (own string) | Questa settimana nessun satellite che seguiamo ha osservato *[PLACE]*. |
| Old window, N ≥ 1 | Dal `29` ottobre al `5` novembre, **`256` satelliti hanno osservato** *[PLACE]*. |
| Old window, same month, elided | Dall’`8` al `15` novembre, … · Dal `1` all’`8` novembre, … |
| Old window across a year | Dal `29` dicembre `2026` al `5` gennaio `2027`, … |
| Old window, zero | Quella settimana nessun satellite che seguiamo ha osservato *[PLACE]*. |
| Window ≠ 7 days | Negli ultimi `[NUM]` giorni, … (`one`: Nell’ultimo giorno, …) |

- In the `many` row, *di* is plain text outside the mono span.
- *che seguiamo* is *we track* (§4).
- The old window builds its article from the day number (§5.5): the message receives each end's local fields.
- Zero puts the time first, so the serif place stays last, as in every other headline.

Why this frame wins: it keeps the English order and ends on the place (end-weight). [PLACE] is a bare direct object,
so there is no preposition to contract. The *avere* perfect means no gender anywhere.

Alternates: **`256` satelliti hanno osservato** *Waterloo* negli ultimi 7 giorni (the time phrase after the serif name
buries the accent); *Waterloo*: negli ultimi 7 giorni l’hanno osservata **256 satelliti** (the participle needs the
place's gender); *Nella settimana 29 ott – 5 nov, …* (a readout abbreviation and a dash in a 44–128 px headline).

**Under an empty headline** (`zeroReason`, `darkSentences`, `radarSentence`; one sentence each). English says "it" for
the place; Italian resumes it with *questo luogo*, never a pronoun (§5.1).

| English | Italian |
|---|---|
| Sentinel-2 or Landsat crossed it N times in daylight, but no scene has been published yet. | Sentinel-2 o Landsat hanno attraversato questo luogo `3` volte di giorno, ma non è ancora stata pubblicata nessuna scena. |
| …once… | …una volta di giorno… (a word, as English writes *once*) |
| The sun barely rose there. | Lì il sole è sorto appena. |
| No open imaging satellite crossed it in daylight. | Nessun satellite con archivio pubblico ha attraversato questo luogo di giorno. |
| The sun never rose, so no daylight camera could see it. | Il sole non è mai sorto: nessuna fotocamera diurna poteva vedere questo luogo. |
| The sun barely rose, so no daylight camera could see it. | Il sole è sorto appena: nessuna fotocamera diurna poteva vedere questo luogo. |
| Weather satellites still swept it in infrared, 42 times. | I satelliti meteo hanno comunque scandito questo luogo nell’infrarosso, `42` volte. (`one`: `1` volta) |
| Radar doesn’t need light. Umbra, Capella and 7 other radar satellites passed within range 1,204 times. | Il radar non ha bisogno di luce. Umbra, Capella e altri `7` satelliti radar sono passati a portata `1204` volte. |

**Second line (the number in the display face, as in English):**

| Case | Italian |
|---|---|
| `one` | È stata pubblicata `1` immagine. |
| `other` | Sono state pubblicate `31` immagini. |
| `many` | Sono state pubblicate `1.000.000` di immagini. |
| Partial, `one` | È stata pubblicata almeno `1` immagine. |
| Partial, `other` | Sono state pubblicate almeno `31` immagini. |
| Zero, results | Nessuna immagine è stata pubblicata questa settimana. (old window: *quella settimana*) |
| Zero, card (its headline already says the week) | Nessuna immagine è stata pubblicata. |
| Archive outage | Gli archivi delle immagini non hanno risposto: per ora non possiamo contare le immagini pubbliche. |
| Outage, card short form | Gli archivi delle immagini non hanno risposto. |

*almeno* appears and disappears in place after the verb while the count settles; the sentence reads correctly with
and without it. The line sits beside Share and must hold one line there, as the English does (about 36 characters on a
1280 px screen, fewer on a phone): *`31` immagini sono state rese pubbliche.* (38) wrapped on every screen in visual
QA, so the verb leads and *pubblicate* says "made public" (the Spanish line is *Se publicaron 31 imágenes.*).
Alternates: *`31` immagini pubblicate.* (not a sentence); *`31` immagini sono pubbliche.* (loses the event); *`31`
immagini sono state rese pubbliche.* (two lines beside Share).

### 3.4 Pass sentences

The order never changes: what crossed, where, when, how it moved; then what that means for the image; then what we
can't know. *ha attraversato il cielo* is the constant prose verb (gender-free, *avere*). Movement is verbless: *verso
[DIR] a [SPEED]*.

The two *where* parts: *`786 km` sopra di te* (overhead) and *a `786 km` di quota, `61 km` a [DIR]* (offset).

**Watched, straight down, overhead (the DESIGN example):**
> Sentinel-2C ha attraversato il cielo `786 km` sopra di te alle `16:14:21 UTC`, verso sud a `7,46 km/s`. Guardava
> dritto verso il basso. Copertura nuvolosa sull’intera scena: `25%`.

**Watched, offset and off-nadir:**
> Landsat 9 ha attraversato il cielo a `705 km` di quota, `61 km` a ovest, alle `10:21:13 EST`, verso sud a
> `7,52 km/s`. Guardava a `4,8°` dalla verticale.

*Guardava* has no subject: Italian drops subject pronouns, which solves English *It*. Never *Esso* or *Lui*.

**Daily mosaic:**
> NOAA-21 ha attraversato il cielo a `829 km` di quota, `312 km` a est, alle `13:42:05 CET`, verso nord a
> `6,64 km/s`. Il suo strumento VIIRS ha ripreso Waterloo nel mosaico giornaliero a colori naturali della NASA, a
> `375 m` per pixel.

**Radar:**
> Il suo radar, puntato `38,2°` di lato, ha ripreso Waterloo a `20 m` per pixel, al buio.

**Likely, fresh (open optical):**
> Sentinel-2B ha attraversato il cielo a `786 km` di quota, `44 km` a est, alle `10:31:02 CET`, con questo punto
> dentro la sua fascia di `290 km`. Era giorno: quasi certamente l’ha registrato. Non è ancora stata pubblicata
> nessuna scena di questo passaggio; gli archivi possono tardare di un giorno o più.

- Archive failed: *Era giorno: dovrebbe aver registrato questo punto. Per ora non siamo riusciti a consultare
  l’archivio.* (Never the conditional *avrebbe registrato*: in Italian it reads as hearsay.)
- Older than 48 h: *Per questo passaggio non esiste una scena. Sentinel-2 registra solo terre emerse e acque costiere,
  e potrebbe non aver programmato questo punto.*

**Likely, weather satellite:**
- At night: *Qui era buio. Di notte gli strumenti meteo continuano a scandire nell’infrarosso: il suo ha visto le tue
  nuvole, non le tue strade.*
- No mosaic: *Non siamo riusciti a confermare sul tuo punto il mosaico giornaliero della NASA di questo passaggio.*
- Not published: *Le sue immagini servono alle previsioni del tempo; non sono pubblicate come foto che possiamo
  mostrare.*

**Could have pointed here (commercial, steerable):**
> WorldView Legion 4 era a portata alle `10:52 CET`, `61 km` a est. Puntando a `23,1°` dalla verticale, avrebbe potuto
> osservare Waterloo. Non possiamo sapere se l’ha fatto.

- Directly overhead: *…era a portata alle `10:52 CET`, proprio sopra di te. Guardando dritto verso il basso, avrebbe
  potuto osservare Waterloo. Non possiamo sapere se l’ha fatto.*
- Fixed swath: *La sua fascia di `24 km` comprendeva Waterloo. Il suo operatore non pubblica dove ha ripreso: non
  possiamo sapere se l’ha fatto.*
- Radar: *Il radar vede attraverso nuvole e buio. Puntando `31,0°` di lato, avrebbe potuto mappare Waterloo. Non
  possiamo sapere se l’ha fatto.* (open archive: *Non abbiamo trovato un’immagine pubblicata di questo passaggio.*)

**Passed overhead:**
> ISS (ZARYA) ha attraversato il cielo a `418 km` di quota alle `21:14 CET`, `62°` sopra il tuo orizzonte, a
> nord-ovest.

- At 80° or more: *…`84°` sopra il tuo orizzonte, quasi allo zenit.*
- At night: *Da te era buio. Se la stazione era ancora al sole, ha attraversato il tuo cielo come un punto luminoso che
  non lampeggiava.* (*steady* = it didn't blink, unlike an aircraft. Never *fermo*, which means motionless.)

**Geostationary:**
> Meteosat-12 non passa. Resta a `35.778 km` sopra l’equatore, a `0,2°` ovest, e scandisce l’intera faccia della
> Terra sotto di sé ogni `10 minuti`. La linea di questa scansione ha raggiunto Paris intorno alle `07:49 CET`,
> spostandosi verso nord.

- Cadence `one`: *ogni minuto*; unknown: *ogni pochi minuti*.
- The seat's longitude is the one prose longitude: a translatable number and an Italian word (*a `0,2°` ovest*,
  *a `140,7°` est*), not the readout form *0.2°W*.
- "at about" is *intorno alle* (avoids *verso le… verso nord*).
- Infrared: *Qui era buio, quindi questa è un’immagine all’infrarosso: le cime delle nuvole per temperatura, le più
  fredde sono le più chiare.*
- *Paris* is shown as the gazetteer supplies it (§5.1).

Alternates considered: *Sentinel-2C è passato sulla verticale…, diretto a sud* (*è passato* and *diretto* need the
satellite's gender; stations are feminine: *la ISS*); *…procedendo verso sud* (police register); *Alle 16:14:21 UTC
Sentinel-2C ha sorvolato il punto…* (*sorvolare* is the overhead verdict verb in headlines; the pass sentence keeps
*attraversare*).

### 3.5 Share headline, post and share page

**Pass card headline (`headlineBy`, also the share page's title).** Lead in the condensed face, place in the serif,
the full stop as its own part:

| Verdict | Italian | English |
|---|---|---|
| imaged | `[SAT] ha osservato` · *[PLACE]*. | watched |
| likely | `[SAT] ha inquadrato` · *[PLACE]*. | swept over |
| could | `[SAT] aveva a portata` · *[PLACE]*. | passed within view of |
| overhead | `[SAT] ha sorvolato` · *[PLACE]*. | passed over |

- *inquadrare* is "to have in frame": the swath covered the place, and it says nothing about a published picture. It
  takes *avere*, is gender-free and leaves the place last.
- *avere a portata* is the glossary's in-range term, used transitively. Never *avere in vista* (it also means "to have
  in one's plans", which reads as intent).
- Never *ha probabilmente osservato* for likely: it hedges the imaged verb, which the English deliberately avoids (the
  likely card shows no picture).
- Nameless satellite (`sat` undefined): *Un satellite ha osservato* / *ha inquadrato* / *aveva a portata* / *ha
  sorvolato*.
- When the week's count is known, the card leads with the results headline's words: **`7` satelliti hanno
  osservato** *Waterloo*.

**Week card (`headlineWeek`).** Keep English's split: **`7` satelliti hanno osservato** *Waterloo questa settimana.*;
zero: *Nessun satellite che seguiamo ha osservato* *Waterloo questa settimana.* The words on the place's line count
toward its two serif lines, so names of nine or more characters step the type down one size. That is correct. When
the place was cut (`cut`, it ends in …), drop the full stop and *questa settimana*'s stop with it, as English does.

**Post text (`share.post`).** Prose: the day in full (*domenica 1 novembre*), never the readout form (*dom 1 nov*).

| Kind | Italian |
|---|---|
| imaged | Sentinel-2C ha osservato Waterloo da `786 km` di quota domenica 1 novembre alle 11:21 ora locale. `10 m` per pixel: questa è l’immagine vera. (no pixel size: *Questa è l’immagine vera.*) |
| clouded | Sentinel-2C ha osservato Waterloo da `786 km` di quota domenica 1 novembre alle 11:21 ora locale. Ha visto solo nuvole. |
| likely | Sentinel-2B ha inquadrato Waterloo da `786 km` di quota domenica 1 novembre alle 11:21 ora locale. La fascia della sua fotocamera copriva il punto. |
| could | WorldView Legion 4 aveva a portata Waterloo domenica 1 novembre alle 10:52 ora locale. Poteva puntare qui. Il suo operatore non dice se l’ha fatto. |
| overhead | ISS (ZARYA) ha sorvolato Waterloo a `418 km` di quota domenica 1 novembre alle 21:14 ora locale. |
| hookWatched | Qualcosa, questa settimana, ha osservato anche te. |
| hookPassed | Cosa ti ha sorvolato questa settimana? (never *Cosa ti è passato sopra*: "what ran you over") |
| credit | via @handle |

Cloud sentences (`card.cloud`): only: sub *Coperto. Ha visto solo nuvole.*, chip *Coperto · `95%`*, post *Ha visto
solo nuvole.*, desc *Ha visto solo nuvole (`95%`).*; mostly: sub *Molto nuvoloso: `82%` della scena.*, chip *Molto
nuvoloso · `82%`*, post and desc *Ha visto soprattutto nuvole (`82%`).*; spot: sub *Nuvole proprio sul punto.*, chip
*Nuvole sul punto*, post and desc *Le nuvole coprivano il punto.*

**Share page (`card.page`, the unfurl).**

| Key | Italian |
|---|---|
| `page.title` | Qualcosa, questa settimana, ha osservato te. |
| `page.description` | as the sub line (§3.2) |
| `page.placeTitle` | I satelliti che hanno osservato [PLACE] questa settimana |
| `page.placeDescription` | Tutti i satelliti che hanno sorvolato [PLACE] negli ultimi 7 giorni, e le immagini vere che hanno ripreso. Cosa ti ha osservato questa settimana? |
| `page.opening` | Apertura di *Watched* |
| `crossed` (imaged, likely, overhead) | Sentinel-2C ha sorvolato Waterloo a `795 km` di quota domenica 1 novembre 2026 alle 11:21 EST, verso sud. (no altitude: *ha sorvolato Waterloo domenica…*) |
| `withinView` | WorldView Legion 4 aveva a portata Waterloo domenica 1 novembre 2026 alle 10:52 EST, verso nord. |
| `couldHave` | Poteva puntare qui. Il suo operatore non dice se l’ha fatto. |
| `straightDown` / `offNadir` | Guardava dritto verso il basso. / Guardava a `4,8°` dalla verticale. |
| `cloudCover` | Copertura nuvolosa: `25%`. |
| `inSwath` | La sua fascia comprendeva [PLACE]. |
| `bestFrom` | La ripresa più vicina è di Sentinel-2B. · L’ultima ripresa limpida è di Sentinel-2B. · La prima immagine è di Sentinel-2B. (nameless: *di un satellite*) |
| `question` | Cosa ti ha osservato questa settimana? |
| `cardAlt` | L’anteprima, con la foto più vicina della settimana, di Sentinel-2B. · L’anteprima. |
| `defaultAlt` | Una vera foto di Palm Jumeirah, a Dubai, ripresa da Sentinel-2, accanto alla frase: Qualcosa, questa settimana, ha osservato te. Scegli un luogo sulla Terra. |

- `crossed` uses *ha sorvolato* for all three kinds: Italian has no gender-free way to say "crossed above [PLACE]"
  without a preposition before the place, and both English verbs mean flying over it.
- In `placeTitle`, the plural verb fixes [PLACE] as the object. *Cosa ha osservato Waterloo* first parses as "What
  did Waterloo observe?" (§5.1 rule 7).

**Card labels and notes.**

| Key | Italian |
|---|---|
| `stamp` | dom 1 nov 2026 · 11:21 EST |
| `weekTo` | 7 giorni fino a dom 1 nov 2026 (30 characters: about 285 px of the ~340 px beside the wordmark; no → on the card) |
| `lastWeek` | Ultimi 7 giorni |
| `readout` | Quota · Elevazione · Velocità · Off-nadir · Pixel · Pixel mosaico · Più vicino |
| `lane` | Foto · Probabile · Possibile · In cielo |
| `geometry` | Geometria · nord in alto (top left of the plan plate: *Geometria del passaggio…* runs into the scale bar's chip) |
| `note` | L’immagine è nell’app · Immagine non disponibile ora · Archivio commerciale, non pubblico · Nella fascia, ancora nessuna immagine pubblica · Traccia al suolo al massimo avvicinamento |
| `acquiring` | Acquisizione… |
| `noPublicPhoto` / `noPhoto` | Nessuna foto pubblica questa settimana / Nessuna foto da mostrare |
| `look` | Più vicina · Ultima limpida · Coperto · Radar (the lead chip must end before the picture's scale chip: *Ripresa più vicina · Landsat 9 · 30 m* does not) |
| `lookDay` | 3 nov |
| `aSatellite` | Un satellite |
| `invite` | Vedi cosa ti ha osservato |
| `enterAnyPlace` | Scegli un luogo sulla Terra (about 296 px at 15 px beside the 152 px host in the 466 px row: fits) |
| `defaultPlace` | Palm Jumeirah |

### 3.6 The four verdicts (`VERDICT_META`)

| Verdict | Title | Lane (mono caps) | Count unit | Definition | Headline / post verb | Pass sentence | aria `rowLabel` verb |
|---|---|---|---|---|---|---|---|
| imaged | **Osservato** | Foto | `1` passaggio / `31` passaggi / `1.000.000` di passaggi | In un archivio pubblico c’è un’immagine reale di questo luogo. | ha osservato | ha attraversato il cielo… | osservato |
| likely | **Probabilmente osservato** | Probabile | passaggio / passaggi | Questo luogo era nella fascia di ripresa di una fotocamera fissa. Non ne è stata pubblicata nessuna immagine. | ha inquadrato | ha attraversato il cielo… | inquadrato |
| could | **Poteva puntare qui** | Possibile | passaggio / passaggi | Era a portata una fotocamera orientabile o privata. Il suo operatore non dice se ha puntato qui. | aveva a portata | era a portata | a portata |
| overhead | **Nel tuo cielo** | In cielo | passaggio / passaggi | Ha attraversato il tuo cielo. Stazioni spaziali e tutto il resto. | ha sorvolato | ha attraversato il cielo… | sorvolato |

Notes:
- Titles are masculine singular, the Italian default for a status (*il passaggio*, *osservato*).
- *Probabilmente osservato* (23 characters) breaks after *Probabilmente* in the verdict tiles; accepted. Never *Forse
  osservato*: *forse* understates a pass the product calls almost certain.
- *Passed overhead* is not *Passato sopra*: *passarci sopra* means "to let it go", and *ti è passato sopra* means "it
  ran you over". *Nel tuo cielo* follows the English definition (*Crossed your sky*). The phrase *cosa è passato sopra
  questo luogo* (literal, about a place) is safe and is used in aria labels.
- *Probabile / Possibile* is a deliberate pair Italians read at once.
- About's extra lines (`verdictMore`): imaged *Se la mostriamo, è l’immagine vera.* · likely *La foto non è ancora
  pubblica, oppure è stata scartata per le nuvole.* · could *Non c’è modo di sapere se l’ha fatto davvero.* · overhead
  (empty, as English).
- Engine notes quote the verdicts in the plural: *…quei passaggi contano come osservati.*, *…quei passaggi sono
  mostrati come probabilmente osservati.*
- One vocabulary: these words are the only words for the verdicts, everywhere (tiles, lists, tooltips, About, cards,
  aria). They are never reused for anything else: the geostationary readout "In your sky" is *Dal tuo punto*, not *Nel
  tuo cielo* (§4).

### 3.7 Reference lines (copy these patterns)

**App and boot.**

| Key | Italian |
|---|---|
| `bootText.loading` / `slow` / `title` | Caricamento di Watched / Rete lenta, ancora in caricamento / *as `documentTitle`* |
| `app.notice` | label *Anomalia* (an instrument panel's word) · fallback *Qualcosa non ha funzionato.* · tryAgain *Riprova* · trying *Nuovo tentativo…* · back *Indietro* |
| `app.faults.catalog` | Non siamo riusciti a caricare il catalogo delle orbite. Controlla la connessione e riprova. |
| `app.faults.compute` | Qualcosa non ha funzionato nel calcolo dei passaggi per questo luogo. Riprova tra poco. |
| `app.progress` | Caricamento degli elementi orbitali · Risultati pronti |

**Computing readout (`engine.progress`, mono caps, about 40 characters).** *Caricamento del catalogo delle orbite* ·
*Catalogo · `16.912` oggetti* · *Propagazione di `412` orbite · `7` giorni* · *Propagazione delle orbite · `120` /
`412`* · *Ricerca archivi Sentinel-2 + Landsat* (never *Ricerca negli archivi…*, 42) · *Abbinamento di `412` scene a
`286` passaggi* · *Verifica dei mosaici meteo NASA* · *Verifica mosaici meteo NASA · `12` / `30`* · *`286` passaggi ·
`31` immagini*.

**Engine notes.** *Gli archivi Sentinel-2 e Landsat erano troppo lenti: i passaggi sono calcolati solo dalla geometria
orbitale.* · *Non è stato possibile raggiungere gli archivi Sentinel-2 e Landsat: i passaggi sono calcolati solo dalla
geometria orbitale.* · *Gli elementi orbitali hanno `3` giorni, quindi gli orari dei passaggi possono essere sbagliati
di qualche minuto.* · *NASA GIBS è stato lento a confermare `3` immagini VIIRS; VIIRS riprende tutto il globo ogni
giorno, quindi quei passaggi contano come osservati.*

**Landing.**

| Key | Italian |
|---|---|
| `lastDays` | Ultimi 7 giorni (`one`: Ultimo giorno) |
| `searchPlaceholder` / `placeLabel` | Cerca un luogo / Luogo |
| `searching` / `searchUnavailable` / `matches` | Ricerca / Ricerca non disponibile / `1` risultato, `5` risultati |
| `searchHint` | Nome, indirizzo o coordinate |
| `searchDown` | La ricerca dei luoghi non risponde. Le coordinate funzionano ancora, per esempio 43.47, −80.54. (the example exactly as English writes it, minus sign included) |
| `nothingMatches` | Nessun risultato per «[query]». Prova una città, un luogo famoso o delle coordinate. |
| `go` (aria) | Mostra cosa è passato sopra questo luogo |
| `useMyLocation` / `locateMe` / `nearMe` / `locating` | La mia posizione / Trovami / Vicino a me / Posizione… |
| `requestingPosition` / `namingPlace` | Richiesta della posizione / Ricerca del nome |
| `locatingNote` | La tua posizione va al geocoder Photon per dare un nome al luogo. Conserviamo solo una cella di circa 10&nbsp;km. |
| `orTry` / `pinHint` / `dropPin` / `surprise` | Oppure prova / Oppure clicca sul globo per mettere un segnaposto / Metti un segnaposto / Sorprendimi |
| `sourceLink` / `sourceLinkLabel` | Open source / Open source: il codice su GitHub |

**Globe.** imaged *Ripresa 11:21:13 EST*, about *Ripresa ≈ 11:21 EST* · acquired *Acquisita 11:21:13 EST · 10 m* ·
acquisitionOf *Acquisizione · SENTINEL-2C* · closestApproachOf *Massimo avvicinamento · ISS (ZARYA)* (right-aligned,
may wrap) · acquiredNow *Acquisita* · closestApproachNow *Massimo avvicinamento* · pin naming *Ricerca del nome…* · noName
*Nessun nome qui vicino* (141 px of the 156 px column; *Nessun luogo con nome qui vicino* is 202 px) · searchAria
*Mostra cosa è passato sopra questo luogo: [PLACE]* · searchTitle *Cerca qui (Invio)* · moveHint *Tieni premuto per
spostarlo* · droppedAt *Segnaposto inserito in 43.4723°N 80.5449°W.* · droppedIn *Segnaposto inserito: [PLACE]. Premi
Invio o la freccia per vedere cosa è passato sopra questo luogo.* · noGl *Vista 3D non disponibile* / *WebGL 2 è
disattivato in questo browser*.

**Pass list and pass view.** sats *`31` sat* (invariable) · imagedOrder *la più vicina, poi le recenti* ·
latest *Ultimo* · closest *Più vicino* · cloudChip *Nuvole* · tag *Mosaico*, *Radar*, *Nuvoloso · `82%`*, *Nuvoloso · sul
punto* · offNadir *`4,8°` off-nadir* · noImage notes end with *Vista dall’alto del passaggio.* · crewed *Le stazioni con
equipaggio hanno fotocamere, ma le loro foto non sono pubblicate per luogo e ora.* · spot *Lettura del pixel sul tuo
punto…*, *Cielo sereno sul tuo punto.*, *Cirri sottili sul tuo punto: possono ammorbidire l’immagine.*, *Nuvole sul
tuo punto.*, *Il tuo punto era all’ombra di una nuvola.* · section rules *01 / Geometria*, *02 / Rivedi*.

**Replay pair (`gallery.replay`).** `['Rivedi', strong(' il passaggio')]`: phones and laptops read *Rivedi*,
tablets *Rivedi il passaggio*. The long form must begin with the short one, and both must read as a label.

**Time-lapse.** title *Time-lapse* · captionYearly *`11` riprese limpide · una all’anno* · captionSeason *`11` riprese
limpide · una ogni autunno* · captionGathering *Una ripresa limpida all’anno · dal 2015* · tooFew *Nessuna ripresa
limpida dal 2015 · ne servono `3`* (`one`: *`1` ripresa limpida…*) · listing *Lettura dell’archivio* · choosing *Scelta
riprese limpide* (one nowrap line with its count) · developing *Sviluppo dei fotogrammi* · tooCloudy *Qui è troppo nuvoloso per un time-lapse.* ·
noAnswer *L’archivio non ha risposto.* · unreachable *Planetary Computer non è raggiungibile* (never *Impossibile
raggiungere…*) · source *Copernicus Sentinel-2, via Planetary Computer* · shareTitle *[PLACE] · anno
dopo anno* · share *Condividi* · linkCopied *Link copiato* · video *Video* · rendering *Rendering `42%`* · videoFailed
*Non riuscito* · saveVideo *Salva video* · fileNamePlace *luogo*.

**Lightbox and gallery.** perPixel *10 m / pixel* · zoom *2,5×* (`fmt('it').dec`) · panTitle *Nitidezza migliorata con
la banda pancromatica da 15 m di Landsat* · status *Nuvoloso · `82%`*, *Sereno qui* · photoAlt *Immagine di
Sentinel-2C: [PLACE]. Il luogo è al centro.* · expandLabel *Ingrandisci la foto: Sentinel-2C, dom 1 nov 16:14* ·
noteMostlyCloud *I passaggi di questa settimana hanno visto soprattutto nuvole* · noteLastClear *Ecco l’ultima ripresa
limpida* · scanLine *Riga **0412** → 1024* · awaiting *In attesa del passaggio* / *In attesa della scansione*.

**About.** lede *Scegli un punto sulla Terra. Calcoliamo quali satelliti l’hanno sorvolato nell’ultima settimana, poi
andiamo a cercare le foto che hanno ripreso. Funziona tutto nel tuo browser, con dati pubblici.* · sections *La
versione breve*, *Come troviamo i passaggi*, *Cosa dicono le etichette*, *Cosa non possiamo vedere*, *Privacy*,
*Crediti*, *Tastiera* · facts *Dritto verso il basso*, *Fotocamere orientabili* (*Se eri a portata, lo chiamiamo
«poteva puntare qui».*), *Luce del giorno*, *Radar*, *Satelliti meteo*, *Ritocchi*, *Dov’è il nord*.

---

## 4. Glossary

Gender: m. / f.; inv. = invariable in the plural.

| English | it | Notes |
|---|---|---|
| Watched (brand) | Watched. | Never translated or declined. No article: *su Watched*, *con Watched*. |
| www.watched.earth | www.watched.earth | Never changed. |
| to watch (product verb) | osservare | *ha osservato*. Never guardare, vedere, sorvegliare, spiare, fotografare. |
| watched (verdict title) | Osservato | |
| swept over (likely verb) | inquadrare | *ha inquadrato [PLACE]*. Headlines, posts, aria only. |
| passed within view (could verb) | avere a portata; essere a portata | *aveva a portata [PLACE]* (headline, post); *era a portata* (pass sentence). |
| passed over (overhead verb) | sorvolare | *ha sorvolato [PLACE]*. Transitive, *avere*. |
| something (hero) | qualcosa | Never *qualcuno*: a thing watched you, that is the unease. |
| satellite | satellite, m. | pl. *satelliti*. *satellite meteo*, *satellite radar* (*radar* inv.). Short *sat*, inv., only in the pass list's count. |
| pass | passaggio, m. | pl. *passaggi*. Never *passata* (tomato purée), *passo*, *transito*. |
| to cross (the sky) | attraversare il cielo | The prose verb of every pass sentence. |
| look (an image of the place) | ripresa, f. | pl. *riprese*. *Ripresa più vicina*, *Ultima ripresa limpida*, *riprese limpide*. Never *sguardo* (a person's eyes). |
| closest look | ripresa più vicina | Short *Più vicina*. |
| last clear look | ultima ripresa limpida | 22 characters: fits the cover chip (about 169 px at 10.5 px); check on a 320 px phone. |
| photo | foto, f. inv. | *la foto*, *le foto*. Filters agree: *Tutte*, *Nitide*. Never *fotografia* in UI. |
| image | immagine, f. | pl. *immagini*. Default for anything that may be radar, a mosaic or a full disc. |
| made public | pubblicato | *Sono state pubblicate `31` immagini.* (§3.3). |
| published | pubblicato | |
| archive | archivio, m. | *gli archivi delle immagini*. |
| scene | scena, f. | One archive product. Never *inquadratura*, *scenario*. |
| swath | fascia di ripresa, f. | Short *fascia*. Never *swath*, *andana*, *striscia* (clashes with *Striscia di Gaza*). |
| steerable / fixed camera | fotocamera orientabile / fissa | |
| camera | fotocamera, f. | Never *camera* (= room). Instruments: *strumento*, *sensore*. |
| imager / instrument | strumento, m. | *il suo strumento VIIRS*. Never *generatore di immagini*. |
| to scan (instrument) | scandire | *scandisce*, *ha scandito*. Noun *scansione*, f. Never *scansionare*. |
| radar image | immagine radar | Never *foto radar*. |
| off-nadir | off-nadir | Term of art, kept (*angolo off-nadir*). Label *Off-nadir*. Prose: *a `12,4°` dalla verticale*. |
| straight down | dritto verso il basso; la verticale | *Guardava dritto verso il basso.* |
| to the side (radar) | di lato | *puntato `38,2°` di lato*. |
| ground track | traccia al suolo, f. | |
| altitude | quota, f. | *a `786 km` di quota*. Never *altitudine*, *altezza*. |
| ground speed | velocità al suolo, f. | |
| heading | rotta, f. (label) | Prose: *verso sud*. Never *intestazione*. |
| elevation (angle above horizon) | elevazione, f. | Never *altitudine*. |
| in your sky (geostationary readout) | Dal tuo punto | Not *Nel tuo cielo* (a verdict word). Value *`38,0°`*, unit *in alto · SSW*. |
| up (unit after degrees) | in alto | *`38,0°` in alto*. |
| sun elevation | elevazione del sole | |
| azimuth | azimut, m. inv. | |
| horizon | orizzonte, m. | *sopra il tuo orizzonte*. |
| almost straight up | quasi allo zenit | |
| ground distance | distanza al suolo | |
| closest (approach) | più vicino; massimo avvicinamento | Labels *Più vicino · UTC*, *Massimo avvicinamento*. |
| in range / within view | a portata | Never *a tiro* (firearms), *in vista di* (= in preparation for). |
| field of regard | campo di puntamento | |
| ascending / descending | ascendente / discendente | Short *Asc* / *Disc*. |
| window (time) | finestra, f. | |
| cloud cover | copertura nuvolosa, f. | Label *Nuvole*. |
| cloud at spot | nuvole qui | Label *Nuvole qui*. |
| clear (sky state) | sereno | Value *Sereno*; prose *Cielo sereno sul tuo punto.* Never *chiaro*. |
| clear (a look) | limpido, -a | *ripresa limpida*. |
| clouded (status) | nuvoloso | *Nuvoloso · `82%`*. |
| clouded over | coperto | *Coperto · `95%`*. Only where English says *Clouded over*. |
| mostly cloud | molto nuvoloso | |
| cirrus | cirri, m. pl. | *Cirri sottili*. |
| cloud shadow | ombra di nubi (label); ombra di una nuvola (prose) | *nubi* only in the 14-character status label. |
| pixel | pixel, m. inv. | *`10 m` per pixel*. Never *10 m a pixel*. |
| resolution | risoluzione, f. | The honest form on screen is *m per pixel*. |
| weather mosaic | mosaico meteo, m. | pl. *mosaici meteo*. The gallery status *Mosaico meteo* stands for *Daily mosaic* (14 characters). |
| daily mosaic (prose) | mosaico giornaliero | |
| true colour | a colori naturali | Never *colori veri*. |
| geostationary | geostazionario, -a | |
| full disc | disco intero, m. | *immagine a disco intero*. |
| scan line | linea di scansione | |
| infrared / visible | infrarosso / visibile | *nell’infrarosso*; band values *Infrarosso*, *Visibile*, *Colore*. |
| band | banda, f. | |
| panchromatic / multispectral | pancromatico / multispettrale | |
| C-band / X-band | banda C / banda X | |
| cubesat / constellation | cubesat, m. inv. / costellazione, f. | |
| sub-metre | submetrico | |
| dawn–dusk orbit | orbita alba-tramonto | |
| standby spare | riserva in orbita | |
| tasked | su richiesta; programmato | |
| spotlight (radar mode) | modalità spotlight | |
| time-lapse | time-lapse, m. inv. | Never *timelapse*, *ripresa accelerata*. |
| frame (time-lapse) | fotogramma, m. | pl. *fotogrammi*. |
| replay (action) | Rivedi | Never *Riproduci*, *Ripeti*, *il replay*. |
| play / pause | Riproduci / Pausa | Media controls only. |
| rendering (video) | Rendering | *Rendering `42%`*. |
| acquired | acquisita | Agrees with *immagine*: *Acquisita 11:21:21 EST · 10 m*. |
| acquisition | acquisizione, f. | |
| imaged (globe callout) | Ripresa (noun) | *Ripresa 11:21:13 EST*. |
| line (pushbroom counter) | riga, f. | *Riga 0000 → 1024*. |
| catalog | catalogo, m. | *il catalogo delle orbite*. |
| objects | oggetti | *`12.847` oggetti*. |
| orbital elements (TLE) | elementi orbitali | |
| to propagate (orbits) | propagazione, f. | Status labels only. |
| epoch | epoca, f. | |
| sub-solar point | punto subsolare, m. | |
| daylight / dark | luce del giorno, di giorno / buio | |
| day / twilight / night | giorno / crepuscolo / notte | |
| operator | operatore, m. | |
| commercial | commerciale | |
| crewed | con equipaggio | Never *presidiato*, *umano*. |
| station | stazione spaziale, f. | The code supplies *ISS (ZARYA)*: no article before it. |
| weather satellite | satellite meteo | |
| Earth observation | osservazione della Terra | |
| military satellite | satellite militare | *satelliti militari e spia*. |
| share | Condividi; condivisione, f. | |
| download image | Scarica immagine | *Scaricamento…* |
| copy link / copy image | Copia link / Copia immagine | |
| copied | Copiato | One key for both buttons: the impersonal status, as in *Copiato negli appunti*. |
| save PNG | Salva PNG | |
| post to X | Posta su X | X's own Italian verb. |
| post (social) | post, m. inv. | |
| card (link preview) | anteprima, f. | Never *card*, *scheda*. |
| search a place | Cerca un luogo | |
| place / spot | luogo, m. / punto, m. | *il tuo punto*. Never *spot*. |
| pin | segnaposto, m. inv. | *Metti un segnaposto*. |
| globe | globo, m. | |
| use my location | La mia posizione | Beside the search field on wide screens: *Usa la mia posizione* (20) cut the placeholder to *Cerca un luo…* at 1024 px. Short *Trovami*; chip *Vicino a me*; locating *Posizione…* |
| surprise me | Sorprendimi | |
| or try | Oppure prova | |
| how this works | Come funziona | |
| About (bar label) | Informazioni | |
| fault (notice label) | Anomalia | |
| close / cancel / dismiss | Chiudi / Annulla / Chiudi | |
| try again / back | Riprova / Indietro | |
| results ready | Risultati pronti | |
| timeline | linea del tempo, f. | Section *04 / Linea del tempo*. Never *Cronologia* (every Italian browser's History). |
| geometry | geometria, f. | |
| plan view | vista dall’alto | Never *vista in pianta* (an architect's word). |
| last 7 days | ultimi 7 giorni | |
| this week / that week | questa settimana / quella settimana | |
| local time | ora locale | *alle 10:52 ora locale*. |
| at sea | in mare | *UTC−9 · in mare*. |
| UTC | UTC | Never *TUC*, *GMT*. |
| ago / in | fa / tra | *41 h fa*, *tra 3 h*. |
| just now | poco fa | Never *adesso*. |
| fetched (catalog) | aggiornato | *Aggiornato 2026-11-08 03:34Z · 4 h fa*. |
| stale | vecchio | *Vecchio, 3 giorni fa*. Never *Datato* (also "stamped", next to a stamp). |
| credits / privacy | Crediti / Privacy | |
| keyboard | Tastiera | Keys *Spazio*, *Invio*, *Esc*. |
| we track | che seguiamo | Chosen for warmth. *tracciare* is correct technical Italian (*tracciamento satellitare*) but colder. |
| touch-ups | ritocchi | |

### Never translated

The wordmark **Watched.** and **www.watched.earth**; satellite names exactly as the code supplies them (Sentinel-2C,
Landsat 9, WorldView Legion 4, NOAA-21, Meteosat-12, ISS (ZARYA), Tiangong…); sensor and product names (MSI, OLI,
OLI-2, VIIRS, MODIS, ABI, AHI, FCI, SEVIRI, C-SAR, GeoColor); agencies and programmes (NASA, ESA, NOAA, EUMETSAT, JMA,
USGS, Copernicus, Planetary Computer, Element 84, CelesTrak, GIBS, EOSDIS). Write *NASA*, never *Nasa*. NORAD IDs,
pass IDs, ISO stamps (*2026-11-08 03:34Z*), coordinates, UTC and zone abbreviations (EST, CET, CEST), GMST, T−00:42,
SGP4, TLE, WebGL 2, H.264, PNG, MP4. *via* stays *via*.

Agencies take the feminine article in prose (*la NASA*, *l’ESA*, *la NOAA*, *l’EUMETSAT*). Legal attribution lines
stay in English exactly as the licences word them (*Contains modified Copernicus Sentinel data 2026*, *© OpenStreetMap
contributors*). Translate the labels around them (*Crediti*, *Realizzato da*).

### Curated places (`places` namespace)

The example chips and the "Surprise me" pool are the only place names translators write. `label` is inserted into the
headline as [PLACE], bare, so write it the way an Italian map labels the place: the Italian exonym where one is
established, with no article (*Piramidi di Giza*, *Cascate del Niagara*, *Diga di Hoover e lago Mead*, *Monte
Sant’Elena*), and the original name where Italians use it (*Central Park*, *Area 51*, *Palm Jumeirah*, *Grand
Canyon*, *Golden Gate*, *Uluru*, *Lower Manhattan*, *Kennedy Space Center*). `chip` stays under 14 characters (*Giza*,
*Central Park*, *Area 51*). `sublabel` lists where it is, most specific first, with commas and country names as
`Intl.DisplayNames('it')` writes them (*Giza, Egitto*; *New York, Stati Uniti*).

---

## 5. Grammar strategies for runtime slots

### 5.1 [PLACE]: no inflection, no article, no gender

Italian puts articles before countries, regions, seas, lakes, mountains and many landmarks (*l’Italia*, *gli Stati
Uniti*, *il Texas*), contracts them with prepositions (*dell’*, *sul*, *negli*), and picks *a* or *in* by place type
(*a Roma*, *in Francia*). The code can do none of this. So:

1. **[PLACE] is the direct object of a transitive verb, at the end of the clause.** *…hanno osservato [PLACE].*, *ha
   ripreso [PLACE]*, *ha raggiunto [PLACE]*, *La sua fascia comprendeva [PLACE].*
2. **Or it follows a colon or a middle dot, as a label.** *Segnaposto inserito: [PLACE]*, *Immagine di Sentinel-2C:
   [PLACE]*, *[PLACE] · anno dopo anno*.
3. **Never after a preposition**: no *a / in / di / da / su / per / con / tra / sopra / verso [PLACE]*.
4. **Never as a sentence-initial subject.** ✗ *[PLACE] era nella sua fascia* → ✓ *La sua fascia comprendeva [PLACE].*
5. **Never refer back to [PLACE] with *lo, la, li, le*, an agreeing participle or an adjective.** Use a noun written
   in the sentence: *questo luogo*, *il punto*, *la zona*. ✗ *l’hanno scansionata* → ✓ *hanno scandito questo luogo*.
6. **No article insertion.** The English code adds *the* before Ocean / Sea / Gulf / Bay / Strait / Desert
   (`placeInProse`, `placeParts`). For Italian it returns the label unchanged: no *the*, no Italian article.
7. **Never put [PLACE] straight after *cosa / chi / che cosa* + a singular verb.** Italian questions put the subject
   after the verb (*Cosa ha visto Marco?*), so a [PLACE] there reads as the one doing it. ✗ *Cosa ha osservato
   Waterloo questa settimana* → ✓ *I satelliti che hanno osservato Waterloo questa settimana*. With the clitic *ti*
   there is no ambiguity: *Cosa ti ha osservato?*

**What arrives in the slot.** The offline list and the geocoders are asked in English, and countries and regions are
first-class results (`LocalPlace.kind` 'c' and 'r'). Italian visitors will regularly read *hanno osservato Italy*,
*…Florence*, *…Texas*, *…Lake Garda*, next to towns and landmarks (*Waterloo*, *Central Park*, *Giza*). In object
position these read as labels, which is the accepted cost of the bare-object frame: every alternative costs
naturalness in every headline. This frame is final for launch.

**If engineering later passes the place's kind (optional engineering request 4, at the top),** countries, regions and features take a
label frame with a resumptive noun, and towns and landmarks keep the bare object:
- country: *Negli ultimi `7` giorni, **`256` satelliti hanno osservato** questo paese: *[PLACE]*.*
- region: *…hanno osservato** questa regione: *[PLACE]*.*
- feature (sea, lake, mountain): *…hanno osservato** questo luogo: *[PLACE]*.*
The same rule applies to every message that takes [PLACE] and a kind.

### 5.2 [SAT] as subject: gender unknown

Italian treats satellite names as masculine (*il satellite*), but stations are feminine (*la ISS*), and the code can't
tell them apart. So nothing may agree with [SAT]:

- **Use *avere* perfects:** *ha osservato*, *ha attraversato*, *ha sorvolato*, *ha inquadrato*, *ha ripreso*, *ha
  registrato*, *ha raggiunto*, *ha visto*.
- **Use the present or the imperfetto with an invariable complement:** *non passa*, *resta*, *era a portata*, *aveva a
  portata*, *era al sole*, *guardava*, *copriva*.
- **Movement is verbless** (*verso sud a `7,46 km/s`*); pointing and looking take gerunds (*puntando a `23,1°` dalla
  verticale*, *guardando dritto verso il basso*, *spostandosi verso nord* for a scan line).
- **Banned:** *è passato/a*, *è stato/a*, *diretto/a*, *fermo/a*, *pronto/a*, and any *-o/-a* participle or adjective
  that agrees with [SAT]. Adjectives in *-e* are invariable and allowed (*visibile*, *costante*).
- **Pronouns:** drop the subject (*Guardava dritto verso il basso.*). Possessives agree with the thing owned, so they
  are always safe (*il suo radar*, *la sua fascia*, *il suo* for "its [instrument]").
- **No article before [SAT]**, anywhere. Italian news writes spacecraft names bare (*Perseverance ha trovato*,
  *Sentinel-2 ha ripreso*). *ISS (ZARYA)* arrives as a catalog label and stays bare too, in headlines and prose alike;
  a sentence that is only about stations names them itself (*Se la stazione era ancora al sole…*).
- **After a preposition:** simple prepositions are fine because the names take no article (*di Sentinel-2C*, *da
  Landsat 9*, *con NOAA-21*). Never an articulated one (*del*, *dal*, *sul*).
- **Nameless satellite:** each sentence writes *un satellite* in the form it needs (*Un satellite ha osservato…*, *…è
  di un satellite*). The mono chips print `aSatellite`: *Un satellite*.
- **Exception:** a plural list of radar satellites may take the masculine plural with *essere* (*Umbra, Capella e altri
  `7` satelliti radar sono passati a portata*): the list holds radar satellites only, and no station is one.

### 5.3 [NUM]: plural categories

Italian CLDR categories: **one** (exactly 1), **many** (exact multiples of 1,000,000: 1.000.000 and 2.000.000 are
`many`, 1.500.000 is `other`), **other** (everything else, including 0 and decimals). `fmt('it').plural` returns
them; the translator supplies all three. In `many`, *milione* is a noun, so *di* follows the number as plain text
outside the mono span.

| Noun | one | other | many |
|---|---|---|---|
| satellite | `1` satellite | `256` satelliti | `1.000.000` di satelliti |
| immagine | `1` immagine | `31` immagini | `1.000.000` di immagini |
| passaggio | `1` passaggio | `31` passaggi | `1.000.000` di passaggi |
| volta (times) | `1` volta | `42` volte | `1.000.000` di volte |
| ripresa limpida | `1` ripresa limpida | `11` riprese limpide | `1.000.000` di riprese limpide |
| fotogramma | `1` fotogramma | `12` fotogrammi | `1.000.000` di fotogrammi |
| oggetto | `1` oggetto | `12.847` oggetti | `1.000.000` di oggetti |
| risultato | `1` risultato | `5` risultati | `1.000.000` di risultati |
| minuto / ora / giorno | `1` minuto / `1` ora / `1` giorno | `12` minuti / `41` ore / `3` giorni | `1.000.000` di … |

- Verbs agree with the category: `one` singular (*è stata pubblicata*, *ha osservato*); `other` and `many` plural.
- **Zero** always has its own sentence with *Nessun / Nessuna / Nessuno* + singular: *Nessun satellite*, *Nessuna
  immagine*, *Nessuna ripresa limpida* (no elision to *nessun’*); *Nessuno* before *s* + consonant, *z*, *gn*, *ps*.
- **Always digits** for counts, including 1. Exceptions where English writes a word: *una volta* (once), *e un altro
  satellite radar* (§5.4).
- Adjectives in a counted phrase agree too: *`12` immagini dettagliate*, *`3` mosaici meteo giornalieri*.

### 5.4 Lists of names

- `Intl.ListFormat('it', { type: 'conjunction' })`: *Umbra, Capella e ICEYE*. No serial comma. Always *e*, never *ed*
  (the code can't see the next word).
- "A, B and 7 other radar satellites": `other` *Umbra, Capella e altri `7` satelliti radar*; `one` *Umbra, Capella e
  un altro satellite radar* (no number: *1 altro* is not Italian); `many` *e altri `1.000.000` di satelliti radar*.
- Two names: *Umbra e Capella*. One name: just the name.

### 5.5 Dates and times inside sentences

Date messages receive the instant (`ms`, `timeZone`) and its local fields (`p`: day, month, year, dow). So an Italian
message chooses its own article. Among days 1–31, only **8** and **11** take the elided article; *1* is read *primo*
and takes *il*:

```ts
const elided = (d: number) => d === 8 || d === 11
const il = (d: number) => (elided(d) ? 'l’' : 'il ')
const dal = (d: number) => (elided(d) ? 'dall’' : 'dal ')
const al = (d: number) => (elided(d) ? 'all’' : 'al ')
```

- **Time:** *alle `[TIME]`* for every time: times are 24 h and zero-padded (*alle 01:05*), so never *all’1*. "At
  about": *intorno alle `[TIME]`*. The zone follows the time: *alle 11:21 EST*, *alle 10:52 ora locale*.
- **With a weekday, no article:** *domenica 1 novembre alle 11:21*. This is the form for the post and the share page.
- **Ranges in prose:** *Dal 29 ottobre al 5 novembre*, *Dall’8 al 15 novembre*, *Dal 1 all’8 novembre*, built with
  `dal` / `al` and month names from `formatDate(…, { day: 'numeric', month: 'long' })`, the month written once when
  both ends share it.
- **Prose vs readouts:** full forms (*domenica 1 novembre*) in sentences; Intl short forms (*dom 1 nov*) only in mono
  readouts, chips, stamps and aria lists of facts.
- **The first of the month is *1*.** Never *1º* (it looks like *1°* in a product full of angles) and never *1°*.
- **Fixed years** after *dal* are safe without a function: every year from 2000 on starts with a consonant sound
  (*duemila…*), so *dal 2015* never elides.
- **Relative times** are their own strings (§6). Never build a sentence around them.

---

## 6. Typography and formatting conventions

**Quotation marks.** « » for quotations and coined terms, no inner spaces: *lo chiamiamo «poteva puntare qui»*. “ ” for
quotes inside quotes. Never straight quotes.

**Apostrophe.** Typographic ’ (U+2019) in every elision: *l’immagine*, *dall’alto*, *un’auto*, *all’anno*. No space
after it. Never ' (U+0027), ´ or `. Accents are accents: *È*, *più*, *perché* (acute), *né*, *sé*, *così*, *qual è* (no
apostrophe), *po’* (apostrophe).

**Ellipsis.** The single character … (U+2026), attached: *Caricamento…*, *Posizione…*. Only for a state in progress,
never for suspense. A place cut short ends in … and drops its full stop.

**Dashes.** No parenthetical dashes: Italian uses a comma, colon or parentheses there. En dash – without spaces for
numeric ranges in tooltips (*10–30 m*, *2015–2026*). Hyphen in compounds (*nord-est*, *time-lapse*). True minus − in
signs (*UTC−3*, *T−00:42*). Arrows → in app ranges and counters (*1 → 8 nov*); never on the share card, whose fonts
have no arrow (and no ≈ or ±).

**Spaces.** None before : ; ! ? % ° or ’. One normal space after. A non-breaking space between a number and its unit
(*786&nbsp;km*, *7&nbsp;giorni*).

**Numbers.** Always through `fmt('it')` (`int`, `dec`) or `Intl.NumberFormat('it')`:
- decimal comma: *7,46*, *12,4°*, *2,5×*;
- grouping point from five digits: *12.847*, *35.778*; four digits have none (CLDR minimum grouping): *1715*, *1204*.
  Both are correct; don't "fix" either by hand;
- percent with no space: *25%* (Intl's own output);
- degree with no space: *12,4°*;
- units with a space: *786 km*, *7,46 km/s*, *10 m*, *38 s*, *4 min 12 s*, *1 h 02 min*.

**Coordinates are international notation everywhere**, as ISO stamps are: decimal point and the letters N S E W, in
readouts, the HUD, the globe, the card and the search field (*SOLE 16.2°S 063.0°E*, *43.4723°N 80.5449°W*, *43.47,
−80.54*). They arrive pre-formatted (`hud.sun`, `globe`, `cardSpec.fmtCoords`): insert them as they come. The one prose
longitude, the geostationary seat, is an Italian number and word (*a `0,2°` ovest*). Every other number takes the
comma.

Machine strings stay as they are: ISO stamps, NORAD and pass IDs, *T+00:42*.

**Dates.**
- Readouts: Intl short forms, lowercase in the catalog, uppercased by CSS: *dom 1 nov* → *DOM 1 NOV*; *dom 1 nov
  2026*; *29 ott*. Weekdays *lun mar mer gio ven sab dom*; months *gen feb mar apr mag giu lug ago set ott nov dic*.
  No full stops. (*mar* is both Tuesday and March; position makes it clear: *mar 3 mar*.)
- `dayCompact` (about 5 characters): *dom 1*, Intl's short weekday. Never the narrow *M* (both *martedì* and
  *mercoledì*).
- Prose: *domenica 1 novembre*, *venerdì 6 novembre*, lowercase.
- **Ranges in readouts are built by hand from Intl parts**, because Italian `formatRange` zero-pads the days (*01–08
  nov*) and drops the arrow. Join two `formatDate(…, { day: 'numeric', month: 'short' })` calls with « → », and write
  a shared month or year once by comparing the `p` fields: `dayRange` *1 → 8 nov*, *29 ott → 5 nov*; `windowRange`
  *1 → 8 nov 2026 UTC*, *29 ott → 5 nov 2026 UTC*, *29 dic 2026 → 5 gen 2027 UTC*.

**Time.** 24-hour clock with colons: *16:14:21*, *07:49*. Never *16.14* or *4:14 PM*.

**Relative time.** Minutes and hours from `relativeFormat('it', 'short')`; days from `relativeFormat('it', 'long')`,
because Italian short days are *2 gg fa*, *1 g fa*. Spoken forms (aria) use `long` throughout.

| English | Italian (readout) | Italian (spoken / aria) |
|---|---|---|
| just now | poco fa | poco fa |
| 12 min ago | 12 min fa | 12 minuti fa |
| 41 h ago | 41 h fa | 41 ore fa |
| 2 days ago | 2 giorni fa | 2 giorni fa |
| 1 day ago | 1 giorno fa | 1 giorno fa |
| in 3 h | tra 3 h | tra 3 ore |
| HUD age: <1 MIN · 42 MIN · 5 H · 3 D | <1 min · 42 min · 5 h · 3 giorni | |
| Stale, 3 D ago | Vecchio, 3 giorni fa | |

*fa* follows the quantity; *tra* (not *fra*) precedes it. The HUD's day unit is the word *giorni* (*giorno* for 1),
never *G*: in mono caps *3 G* reads as the mobile network. It appears only when the catalog is stale.

**Capitalisation.**
- Sentence case for everything: headings, buttons, chips, tabs, the About index. Italian never uses Title Case.
- Lowercase: weekdays, months, seasons (*autunno*), compass words (*nord-ovest*), nationalities and languages.
- *Terra* capitalised for the planet (*sulla Terra*), lowercase for land (*terre emerse*). *sole*, *equatore*,
  *orizzonte* lowercase in prose.

**Uppercase mono labels.** Write labels in sentence case; CSS (or `toLocaleUpperCase('it')` on canvas and satori)
uppercases them. Accented letters uppercase correctly (*più* → *PIÙ*, *velocità* → *VELOCITÀ*, *è* → *È*). Never type
*PIU'*, *E'* or *VELOCITA'*, never uppercase by hand. Keep out of uppercase: prose, the wordmark, the serif place name,
URLs, satellite names inside sentences.

**Line breaking.** The landing hero is the three lines of §3.1, the card hero its five. No soft hyphens; never
hyphenate headlines or mono labels. Keep a number with its unit (nbsp). Satellite names must not break at their hyphen
(*Sentinel-|2C*): engineering keeps names `white-space: nowrap`. Never end a line on *l’*, *un’* or *dell’*.

**Abbreviations.** In prose, write words out (*circa*, *massimo*, *per esempio*). SI units never take a full stop
(*min*, *km*, *s*). In readouts, no full stops and standard symbols only (*Asc*, *Disc*, *≈*, *→*; not on the card).
Never invent clipped forms (✗ *VELOC.*, ✗ *ALT.*, ✗ *CONDIV.*, ✗ *SETT.*). *sat* (pass list) and *off-nadir* are
established forms, not clippings.

**Compass in readouts: international letters.** N S E W and the 16-point set (N NNE NE ENE E ESE SE SSE S SSW SW WSW
W WNW NW NNW). They are instrument symbols like *km* and *UTC*; Italian *O* for *ovest* sits next to digits in a mono
face where O and 0 look alike; and *NO* (nord-ovest) reads as the word *no*. Prose uses the Italian words, with *a* for
a position (*`61 km` a ovest*, *a nord-ovest*) and *verso* for a motion (*verso sud*), never *ad est*.

---

## 7. Length discipline

Italian runs about **15–25% longer** than English in sentences and **30–80% longer** in one- and two-word labels
(*SHARE* 5 → *CONDIVIDI* 9). Strategies, in order:

1. **Pick the shorter exact word**: *quota* over *altitudine*, *nuvole* over *copertura nuvolosa*, *foto* over
   *fotografia*, *auto* over *automobile*, *nubi* over *nuvole* in one 14-character status.
2. **Drop articles in labels and buttons**: *Scarica immagine*, *Copia link*, *Salva PNG*.
3. **Use the middle dot or a colon instead of *di* / *del***: *Più vicino · UTC*, *NORAD · passaggio*, *Settimana: 12*.
4. **Use symbols** where English does: → ≈ · (not → or ≈ on the card).
5. **Use a short form only where the code offers one** (*Trovami*, *Vicino a me*, *Rivedi* / *Rivedi il passaggio*).
   Never truncate, never clip words with a full stop.
6. **If it still doesn't fit, report it.** The layout changes, not the language. The share card already steps its
   headline size down by length: *`256` satelliti hanno osservato* (29 characters against 22) lands one size smaller,
   which is correct.

**Measured budgets.** Mono caps run about 7.7 px a character at 10.5 px. These are the tight keys:

| Key (constraint) | Italian | Notes |
|---|---|---|
| `card.hero` (88 px, 466 px column, never re-wraps) | five lines (§3.1) | widest *ha osservato*, about 365 px |
| landing hero (span-6 column) | three lines + `--display-k: 0.9` | QA at 1024×768 first |
| `gallery.filter` (four segments plus the counter in a 350 / 263 px bar) | Tutte · Nitide · Meteo · Radar | 21 characters against English's 23. *Dettagliate* (11) and *Dettaglio* (9) push the bar past English's width. |
| `gallery.photosThisWeek` / `ThatWeek` (counter box about 12) | Settimana: `12` / Settimana: `12` | One form for both: the label needs no demonstrative, and *Quella settimana: 12* (20) does not fit. |
| `gallery.lead` (cover chip ≤ ~20) | Ripresa più vicina (18) · Ultima ripresa limpida (22) · Coperto | the 22 measures 169 px and fits; check on a 320 px phone. `card.look` uses *Più vicina* (§3.5) |
| `gallery.status` (≤ ~14) | Nuvoloso · `82%` · Nuvole qui · Sereno · Cirri sottili · Ombra di nubi · Nuvole `82%` · Mosaico meteo | |
| `lightbox.status` (box ~14) | Nuvoloso · `82%` · Sereno qui | *Sereno sul tuo punto* (20) is too long |
| `landing.locating` (about as wide as *Vicino a me*) | Posizione… (10) | never *Localizzazione…* (15), never *Localizzo…* (1st person) |
| `app.notice.trying` | Nuovo tentativo… | |
| `timelapse.videoFailed` / `rendering` (fixed 132 px button) | Non riuscito · Rendering `42%` | |
| `passView.band` (≤ ~9, 21 px) | Infrarosso (10) · Visibile · Colore | check the strip cell; report it if it clips |
| `passView.spotValue` (≤ ~7) | Sereno · Cirri · Nuvole · Ombra | |
| `passView.cloudChip` (56 px square) | Nuvole | |
| `card.readout.mosaicPixel` (155 px column) | Pixel mosaico (13) | |
| `card.lane` (≤ ~8, 116 px) | Foto · Probabile · Possibile · In cielo | the two 9s fit the 116 px column |
| `card.weekTo` (one line beside the wordmark) | 7 giorni fino a dom 1 nov 2026 (30) | about 285 px of ~340 |
| `card.enterAnyPlace` + host (466 px row) | Scegli un luogo sulla Terra | about 296 + 152 px |
| `globe.pin.noName` (156 px at 13 px sans) | Nessun nome qui vicino (141 px) | |
| `globe.pin.moveHint` (one line on a 320 px phone) | Tieni premuto per spostarlo (27) | |
| `share.*` buttons (three across 360 px, about 12 each) | Copia link · Posta su X · Salva PNG · Copia immagine · Copiato | |
| `share.linkLabel` / `postLabel` (48 px column, ~5) | Link · Post | |
| `engine.progress.*` (about 40) | §3.7 | *Ricerca archivi Sentinel-2 + Landsat* (36) |
| `bootText.slow` (one centred mono line) | Rete lenta, ancora in caricamento (33) | |
| `about.sections` (index: mono caps, 3 of 12 columns, about 233 px at 1101 px) | 24 characters at most: *Cosa dicono le etichette* | *Cosa significano le etichette* (29) wraps up to about 1240 px |

| English | Italian | Short form (only where the code has a slot) | Chars en → it |
|---|---|---|---|
| SURPRISE ME | SORPRENDIMI | — | 11 → 11 |
| USE MY LOCATION | USA LA MIA POSIZIONE | TROVAMI; chip VICINO A ME | 15 → 20 |
| HOW THIS WORKS | COME FUNZIONA | — | 14 → 13 |
| LAST 7 DAYS | ULTIMI 7 GIORNI | — | 11 → 15 |
| CLOSEST LOOK | RIPRESA PIÙ VICINA | PIÙ VICINA | 12 → 18 |
| TIME-LAPSE | TIME-LAPSE | — | 10 → 10 |
| OFF-NADIR | OFF-NADIR | — | 9 → 9 |
| PIXEL | PIXEL | — | 5 → 5 |
| ALTITUDE | QUOTA | — | 8 → 5 |
| PASSES | PASSAGGI | — | 6 → 8 |
| SHARE | CONDIVIDI | — | 5 → 9 |
| DOWNLOAD IMAGE | SCARICA IMMAGINE | — | 14 → 16 |
| COPY LINK | COPIA LINK | — | 9 → 10 |
| REPLAY | RIVEDI | RIVEDI IL PASSAGGIO (tablets) | 6 → 6 |
| TIMELINE | LINEA DEL TEMPO | — | 8 → 15 |

More readout labels: *SOLE*, *NUVOLE*, *NUVOLE QUI*, *BANDA*, *ELEVAZIONE*, *PIÙ VICINO · LOCALE*, *DISTANZA AL
SUOLO*, *ELEVAZIONE DA TE*, *VELOCITÀ AL SUOLO*, *ROTTA*, *ELEVAZIONE DEL SOLE*, *CAMPO DI PUNTAMENTO*, *FASCIA*,
*NELLA FASCIA*, *A PORTATA*, *FINESTRA*, *SCANSIONE QUI · UTC*, *SOPRA L’EQUATORE A*, *DAL TUO PUNTO*, *DIREZIONE
SCANSIONE*, *VELOCITÀ LINEA QUI*, *COPERTURA* (*Disco intero*), *QUESTA SCANSIONE*, *NORAD · SCANSIONE*. Values: *NORD →
SUD*, *SUD → NORD*, *ogni 10 min*, *SSW · Asc*. Section notches: *01 / GEOMETRIA*, *02 / RIVEDI*, *02 / PASSAGGI*,
*02 / OPPURE PROVA*, *04 / LINEA DEL TEMPO*. Kicker: *ULTIMI 7 GIORNI · 1 → 8 NOV 2026 UTC*.

---

## 8. Sensitive content

Watched is about being seen from orbit. In Italian the wording stays factual and neutral, and never claims more than
the data shows.

**Surveillance and privacy.**
- The product verb is *osservare*. Never *sorvegliare*, *spiare*, *tenere d’occhio* or *controllare*: they assert an
  intent to monitor that the data doesn't show. *spia* appears only as a fixed term (*satelliti militari e spia*).
- *inquadrare* (likely) says the place was in frame, nothing about intent or a published picture. *aveva a portata*
  (could) says it was in reach, nothing about whether it looked.
- *pubblicate* states a fact; don't escalate it (✗ *esposte*, ✗ *diffuse*).
- Privacy copy says exactly what the English says, in plain words: *Conserviamo solo una cella di circa 10 km.*, *Non
  lo leggiamo mai.* No GDPR legalese (*trattamento*, *titolare*) unless the English has it.
- Reassurance stays factual: *Un satellite può vedermi? No.* Never *Tranquillo* or *Niente paura* (gendered, and condescending).

**War zones in the time-lapse** (Gaza Strip, West Bank, Ukraine, Lebanon).
- Names: *Striscia di Gaza*, *Cisgiordania*, *Ucraina*, *Libano*, *Israele*. Never *Territori occupati*, *Giudea e
  Samaria* or *Terra Santa* in our copy.
- Where the English says *war*, write *guerra*, unqualified. Never *invasione*, *aggressione*, *operazione militare
  speciale*, *genocidio*, *conflitto* (as a softener) or *liberazione*. Describe only what the frames show, and only if
  the English does.
- The caption names the season only: *`11` riprese limpide · una ogni autunno*. Add nothing to explain why.
- The Ukraine zone includes Crimea (the internationally recognised border). Our copy never attributes Crimea to either
  state and never mentions the choice.

**Glaciers.** *ghiacciaio*, m.; the retreat is *il ritiro del ghiacciaio*. Season wording: *a fine estate, quando la
neve stagionale si è sciolta*. No alarmism (✗ *catastrofe*, ✗ *agonia del ghiacciaio*): the frames speak.

**Place-name politics.**
- Country names come from `Intl.DisplayNames('it')`. Accept its output and don't override it: *Taiwan*, *Territori
  Palestinesi*, *Kosovo*, *Macedonia del Nord*, *Cechia*, *Myanmar (Birmania)*, *RAS di Hong Kong*.
- Our own copy uses the name the gazetteer shows, so one place has one name: **Kyiv**, *Kharkiv*, *Odesa*. *Kiev* and
  *Odessa* are the traditional Italian forms and not wrong, but mixing them with the search results is. No *Kiev* in
  parentheses.
- *Taiwan*, never *Taiwan (Cina)* or *provincia di Taiwan*. Disputed areas get their geographic name with no
  sovereignty claim (*Crimea*, *Kashmir*, *Sahara Occidentale*; *Golfo Persico*, the standard Italian name).
- Never translate a place name supplied at runtime (§5.1). Curated places are the only exception (§4).

---

## 9. Pitfalls and reviewer checklist

### False friends and traps for this product

| English | Wrong Italian | Why | Right |
|---|---|---|---|
| actual (pictures) | attuali | *attuale* = current | vere, reali |
| actually | attualmente | = currently | davvero, in realtà |
| eventually | eventualmente | = possibly | alla fine |
| camera | camera | = room | fotocamera; strumento |
| data | data | = date | dati |
| pass | passata, passo | tomato purée; step | passaggio |
| look (an image) | sguardo | a person's gaze | ripresa |
| heading | intestazione | document heading | rotta; verso [dir] |
| moving south | procedendo verso sud | police-report register | verso sud |
| to scan | scansionare | an office scanner | scandire |
| clear | chiaro | = light-coloured, obvious | sereno (sky), limpido (look) |
| frame | cornice, frame | picture frame; anglicism | fotogramma |
| swath | striscia | clashes with *Striscia di Gaza* | fascia (di ripresa) |
| replay | riproduci | = play media | rivedi |
| passed overhead | passato sopra | *passarci sopra* = let it go; *ti è passato sopra* = ran you over | nel tuo cielo; ha sorvolato |
| likely watched (verb) | ha probabilmente osservato | hedges the imaged verb | ha inquadrato |
| steady (light) | fermo | = motionless | che non lampeggiava |
| in range | a tiro | firearms | a portata |
| within view of | in vista di; avere in vista | = in preparation for; = to plan | a portata; avere a portata |
| timeline | cronologia | every browser's History | linea del tempo |
| stale | datato | also "stamped" | vecchio |
| plan view | vista in pianta | architecture | vista dall’alto |
| schedule | schedulare | anglicism | programmare |
| watched | guardato, sorvegliato, spiato, fotografato, visto | too casual / an accusation / owner rule / overclaims | osservato |
| scene | scenario, inquadratura | wrong sense | scena |
| just now | adesso | still happening | poco fa |
| something | qualcuno | someone | qualcosa |
| See what watched you | Guarda cosa… | "look what you did" | Vedi cosa ti ha osservato |

**Ambiguous source words.** *watched* is always the product verb (*osservare*); only the imaged lane label says *Foto*.
*swept over* is the likely verb (*inquadrare*), never a second *osservare*. *pass* is the event (*passaggio*). *scene*
is an archive product (*scena*). *look* is a satellite's image of the place (*ripresa*). *spot* is the exact point
(*punto*); *place* is the searched location (*luogo*). *clear* is a sky state (*sereno*) or a cloud-free look
(*limpido*). *Clouded* is *nuvoloso*, *Clouded over* is *coperto*.

### Reviewer checklist (run on every string)

1. **Register:** tu (or *noi* for the product). No Lei, voi, impersonal *si*, or product as *io*. Buttons are tu
   imperatives; status words are nouns.
2. **No agreement with the reader:** no *stato/a*, *pronto/a*, *benvenuto/a* referring to *tu*.
3. **[PLACE]:** a bare direct object at the end of the clause, or after a colon or middle dot. No preposition before
   it, no article, no resuming *lo/la*, never after *cosa / chi* + a singular verb.
4. **[SAT]:** *avere* perfects, present or imperfetto, gerunds, verbless movement. No *è passato/a*, no *diretto/a*, no
   *procedendo*. No article before the name; only simple prepositions after it.
5. **[NUM]:** `one`, `other` and `many` all supplied; `many` has *di* outside the mono span; verbs and adjectives agree;
   zero is a *Nessun / Nessuna / Nessuno* sentence.
6. **Dates:** the article chosen by `il` / `dal` / `al`; weekday forms without article; full forms in prose, short
   forms only in readouts; the 1st is *1*; *alle* before every time; *intorno alle* for "at about".
7. **Vocabulary:** every term matches the glossary; verdict words only from §3.6 and never reused elsewhere;
   *osservare*, never *fotografare*; *ripresa* for look.
8. **Honesty:** the label says exactly what is on screen (*immagine* when it may be radar or a mosaic; *m per pixel*;
   counts as the code gives them). No hedge or claim the English doesn't make.
9. **Numbers:** decimal comma, Intl grouping, *25%*, *12,4°*, *786 km* with nbsp; coordinates untouched in
   international notation; times *16:14:21*; ISO stamps untouched.
10. **Typography:** ’ not '; « » not "; … not ...; *È* not *E’*; *perché* not *perchè*; *qual è*; *po’*; no
    parenthetical dash; no space before : ; ! ? %; no → ≈ ± in card copy.
11. **Case:** sentence case; lowercase weekdays, months, seasons and compass words; *Terra* for the planet; labels not
    uppercased by hand.
12. **Never-translate list respected:** brand, domain, satellite, sensor and agency names, coordinates, legal credit
    lines.
13. **False friends:** none from the table above.
14. **Voice:** declarative, at most 20 words, one fact per sentence; no exclamation marks, extra questions, marketing
    verbs or bureaucratic formulas; passives only as §2 allows.
15. **Second person** only where the English has *you / your*.
16. **Length:** within the §7 budget; no truncation, no invented abbreviation; overflow reported, not cut. Card hero
    lines checked at 88 px.
17. **Sensitive content:** neutral names, *guerra* unqualified, Intl country names untouched, *Kyiv* as the gazetteer
    spells it.
18. **Read it aloud.** If a native speaker wouldn't say it at a planetarium desk, rewrite it.

---

## Decisions log

Each item of the native reviewer's critique (`it.critique.md`) and how it was resolved. A = accepted, P = partly
accepted, R = rejected.

| # | Critique item | | Resolution |
|---|---|---|---|
| 1 | Default card hero overflows its 466 px column at 88 px | A | Verified (*questa settimana* ≈ 500 px); the card hero is five explicit lines that fit at 88 px (§3.1); no engineering needed. |
| 2 | Landing hero ~30% wider, no mechanism | A | `:root:lang(it) { --display-k: 0.9 }`, QA at four sizes; never reword, never four lines. |
| 3 | Hero buries its focus mid-sentence | A | Hero is *Qualcosa / questa settimana / ha osservato te.*; running forms, hook and tab title written together. |
| 4 | Likely and could verbs replace the English vocabulary | A | *ha inquadrato* (swept over), *aveva a portata* (passed within view); could post no longer says "could" twice; example satellite fixed to WorldView Legion 4. |
| 5 | *sguardo* is a person's gaze | A | *ripresa*, f., everywhere (gallery, card chips, time-lapse, globe callout), with agreement changes. |
| 6 | *procedendo verso* is police register | A | Verbless *verso sud a…* in passes; scan line *spostandosi verso nord* after *intorno alle* (avoids two *verso*); *scandire* for instruments. |
| 7 | Night weather line loses its subject | A | *…continuano a scandire nell’infrarosso: il suo ha visto le tue nuvole, non le tue strade.* |
| 8 | Question word + [PLACE] reads backwards | A | New §5.1 rule 7; `placeTitle`, `placeDescription`, `invite` rewritten. |
| 9 | Date strategy rests on a false constraint | P | Accepted: messages pick *il/dal/al* from `p.day`, prose ranges *Dal 29 ottobre al 5 novembre*, full dates in posts. Rejected: *1º* in prose (looks like *1°*; Intl writes *1*). |
| 10 | Guide promises formats Intl doesn't produce | P | Accepted: days in `long` relative form, HUD *giorni* not *G*, ranges built from two `formatDate` calls. Changed: `weekTo` is *7 giorni fino a dom 1 nov 2026*, because the card fonts have no →. |
| 11 | The coordinate rule cannot be followed | A | Coordinates international everywhere; prose seat *a 0,2° ovest*; `searchHint` *Nome, indirizzo o coordinate*; parser fix listed as engineering request 2. |
| 12 | No second key for *Copiato / Copiata* | P | Accepted that one key exists (glossary fixed). Kept *Copiato* as the impersonal status (*Copiato negli appunti*) rather than *Fatto*, which says less. |
| 13 | Length budgets never checked | P | Accepted most strings and the measured table (§7). Changed: filter *Nitide* (not *Dettaglio*, which still widens the bar), counter *Settimana: N* for both weeks (not reported), locating *Posizione…* (not first-person *Localizzo…*). |
| 14 | Sentences under an empty headline missing | A | All six zero/dark sentences and the radar sentence added (§3.3), resuming the place with *questo luogo*. |
| 15 | Missing hook lines | A | `hookWatched`, `hookPassed`, `landing.go`, `globe.pin.droppedIn`, `card.enterAnyPlace` added; width of the last checked (fits). |
| 16 | *DAL NADIR* is not an Italian label | A | Label *Off-nadir* (term of art); prose keeps *dalla verticale*. |
| 17 | *Nel tuo cielo* collides with the geostationary readout | P | Accepted the collision rule. Readout is *Dal tuo punto* (unit *in alto · SSW*) instead of *Sul tuo orizzonte*, which reads as "at the horizon". |
| 18 | Position vs motion in the overhead line | A | *…`62°` sopra il tuo orizzonte, a nord-ovest.* |
| 19 | *avrebbe registrato* reads as hearsay | A | *Era giorno: dovrebbe aver registrato questo punto.* |
| 20 | Night overhead line wording and tense | A | *Da te era buio.* … *un punto luminoso che non lampeggiava.* |
| 21 | *più fredde più chiare* is telegraphic | A | *…le più fredde sono le più chiare.* |
| 22 | Word order and scope in the likely sentence | A | *Non è ancora stata pubblicata nessuna scena…*; *con questo punto dentro la sua fascia*; second mention resumed with *l’ha registrato*. |
| 23 | *Datato* is ambiguous next to a stamp | A | *Vecchio, 3 giorni fa*. |
| 24 | *Cronologia* is the browser's History | A | *Linea del tempo*. |
| 25 | Cloud ladder | A | *Nuvoloso* (status), *Coperto* (clouded over only), *Molto nuvoloso*, *Sereno*; prose *Cielo sereno sul tuo punto.* |
| 26 | Bare *ISS* reads like a telegram; ask for a crewed frame | R | The name arrives as the catalog label *ISS (ZARYA)*, which reads as a label in any frame; Italian headlines write *Iss* bare; a crewed-only frame would add a flag to every pass message for one family. Sentences only about stations already say *la stazione*. |
| 27 | Country and region names are not rare | P | Accepted and stated plainly (§5.1), English geocoder names included. Bare object stays the launch frame; the kind-aware label frame (*questo paese: [PLACE]*) is specified for an optional later request. |
| 28 | [SAT] after prepositions not covered | A | Simple prepositions allowed, articulated ones banned (§5.2); `photoAlt`, `expandLabel` examples added. |
| 29 | The guide breaks its own rules (About lede, zero headline) | A | About lede uses *l’hanno sorvolato*; zero headline puts the week first (*Questa settimana nessun satellite…*). |
| 30 | Factual slips | A | *º* is in the subset (banned for legibility, not fonts); `it-CH` note removed; *tracciare* acknowledged as correct, *seguire* kept for warmth; *dal 2015* safe because years from 2000 start with a consonant. |
| M1 | Boot screen strings | P | *Caricamento di Watched*, title as `documentTitle`; slow line *Rete lenta, ancora in caricamento* (shorter, no *in corso*). |
| M2 | Fault notice strings | P | *Anomalia*, *Riprova*, *Indietro*, progress accepted; *trying* is *Nuovo tentativo…*, not first-person *Riprovo…*. |
| M3 | Computing readout | P | Accepted, with *Caricamento del catalogo delle orbite* and *Propagazione delle orbite* to match the glossary. |
| M4 | Engine notes and the passive exception | A | Plural verdict words in notes; §2 allows *essere* passives in footnotes. |
| M5 | Globe strings | P | Accepted; *noName* is *Nessun nome qui vicino* because the proposed string is 202 px in a 156 px column. |
| M6 | Share card strings and the cut rule | A | Added to §3.5 (notes, chips, acquiring, opening, cut drops the stop). |
| M7 | Week card split | A | Accent holds *[PLACE] questa settimana.*; long names step down a size. |
| M8 | `time` namespace | A | `dayCompact` *dom 1* (never narrow *M*), `atSea` *UTC−9 · in mare*. |
| M9 | Pass list strings | A | *sat* invariable, *Ultimo*, *Più vicino*, *Nuvole*, *Vista dall’alto del passaggio.* (glossary updated). |
| M10 | Replay pair constraint | A | *Rivedi* / *Rivedi il passaggio*; the long form begins with the short one (§3.7). |
| M11 | Time-lapse strings | A | Source, steps, *tooCloudy*, `shareTitle`, `fileNamePlace` added. |
| M12 | Landing strings | P | `nothingMatches` accepted; `searchDown` keeps English's − (parser fix requested) instead of an ASCII hyphen, coordinates moved to the end of the sentence. |
| M13 | About strings | A | *Ritocchi*, *Fotocamere orientabili*, *Dov’è il nord*, the quoted verdict in « ». |
| M14 | Satellite blurb glossary | A | All terms added to §4, plus the pan-sharpening tooltip. |
| M15 | Lightbox strings | A | *10 m / pixel*, *2,5×* through `fmt('it').dec`, *Sereno qui*. |

Visual QA on every screen (2026-11-19, desktop 1280×800, 1024×768 and 1440×900, phones 390 and 360 px):

| # | Finding | Change |
|---|---|---|
| Q1 | The second line (*40 immagini sono state rese pubbliche.*) wrapped beside Share on desktop and phone | *Sono state pubblicate 40 immagini.*, on the card too (§3.3) |
| Q2 | *Usa la mia posizione* cut the search placeholder to *Cerca un luo…* at 1024 px | *La mia posizione* (§4) |
| Q3 | The Watched group's order (*ripresa più vicina, poi le più recenti*) ran off a 390 px phone | *la più vicina, poi le recenti* |
| Q4 | Computing rows *Abbinamento delle scene ai passaggi* and *Propagazione delle orbite · 7 giorni* cut on a phone | *Abbinamento scene e passaggi*, *Propagazione orbite · 7 giorni* (the engine's running line keeps *Propagazione delle orbite · 120 / 412*) |
| Q5 | *Può vedermi?* with no subject reads as the formal *Lei* ("can you see me?") | *Un satellite può vedermi?*, as the Spanish |
| Q6 | About's foot said *Realizzato* twice in a row (*Realizzato da…* / *Realizzato con dati pubblici.*) | *Fatto con dati pubblici.* |
| Q7 | `likely` definition *Nessuna sua immagine è pubblicata.* (*sua*: of the camera or the place?) | *Non ne è stata pubblicata nessuna immagine.* |
| Q8 | The card's lead broke *256 satelliti hanno* / *osservato* | a no-break space in *hanno osservato* |
| Q9 | The week card's chip *Ultima ripresa limpida* runs 7 characters past the English before the day and satellite | *Ultima limpida*, like *Più vicina* (§3.5) |

Additions not raised by the critique: the card fonts lack → ≈ ± (card copy must not use them, which changed `weekTo`);
the share page's `crossed` uses *ha sorvolato* to keep [PLACE] a bare object; curated place labels written as map
labels (§4); *RAS di Hong Kong* listed among accepted Intl names; status words as nouns, never the product as *io*.
