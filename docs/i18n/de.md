# Watched: German (de) localisation style guide

Every translator and reviewer of the German catalog follows this guide. One German catalog serves Germany, Austria
and Switzerland. It formats with the `de` Intl locale everywhere (the locale registry's `intl: 'de'`). Where this
guide decides something, that decision is final. If a string isn't covered, extend the nearest rule; don't invent a
new one.

The English source of truth is `docs/DESIGN.md` §7 (voice and the verdict vocabulary), `src/i18n/en/*.ts` (every
namespace: `results.ts` and `pass.ts` hold the results sentences, `verdicts.ts` the verdicts), `api/_lib/i18n/card/en.ts`
(share card and share page) and `src/i18n/en/share.ts` (post text). Each key's doc comment states where the string sits
and how much room it has. That comment wins over a guess.

**About the examples.** In this guide `*word*` marks the serif accent (Instrument Serif italic, signal orange) and
`**words**` marks bold. Wherever this guide shows a space between a number and its unit, or before `…`, the catalog
must have a no-break space, U+00A0. It looks like an ordinary space in an editor, so check it with a character
inspector. Widths quoted in px were measured (method in §7), not estimated from character counts.

## 0. Decisions at a glance

| Question | Decision |
|---|---|
| Address | **du** on every surface, lowercase (*du, dich, dir, dein*). Never *Sie*. Buttons use the infinitive and address no one. |
| Imperative | In sentences, the full form with *-e* (*Prüfe*, *Versuche*, *Drücke*, *Suche*). Strong verbs keep their short form (*Gib*, *Sieh*). The one chip idiom drops it: *Überrasch mich*. |
| Product verb ("watched") | **beobachten**: *beobachtete* (report), *hat … beobachtet* (hero). Never *überwachen*, *ausspionieren*, *fotografieren*, *ansehen*, *sehen*. |
| Tense | Präteritum for what satellites did (the instrument's log: *beobachtete*, *zog … hinweg*). Perfekt for the hero and for what just happened in the app (*Die Archive haben nicht geantwortet.*). Present tense for facts that hold. |
| Hero | `Etwas hat *dich*` / `diese Woche` / `beobachtet.` |
| Results headline | `In den letzten 7 Tagen **beobachteten 256 Satelliten** *Waterloo*.` |
| Second line | `**31 Bilder wurden veröffentlicht.**` (one count for photos, mosaics, radar and full-disc images) |
| Verdicts | *Beobachtet* / *Vermutlich beobachtet* / *Konnte hierher blicken* / *Überflogen*; lanes `BILD` / `VERMUTLICH` / `MÖGLICH` / `ÜBERFLOGEN`; unit *Überflug, Überflüge*. |
| Headline lead verbs | *[SAT] beobachtete* / *[SAT] erfasste vermutlich* / *[SAT] kam in Sichtweite von* / *[SAT] überflog*, each before the serif place. |
| [PLACE] | Bare, no case ending, no pronoun after it. An object only when the subject is unmistakably nominative (§5.1). Never next to *was/etwas/das/es* as subject. Body prose says *den Ort*. Curated places that need an article get it from one German table, outside the serif (§5.1). |
| [SAT] | Bare as a subject. Crewed stations take the classifier in sentences: *Die Raumstation ISS zog …*. No pronoun after a bare name. |
| Numbers | Decimal comma and a dot to group thousands: `1.715`, `7,46 km/s`, `5,4°`, `25 %`. Years, NORAD IDs and pass IDs are never grouped. |
| Coordinates | International, as code delivers them: `16.2°S 063.0°E`, `0.2°W`. Never reformatted, also inside German prose. |
| Units | SI symbols, written lowercase in the catalog (`786 km`, `10 m`, `5 min`). A mono caps row keeps them lowercase, as in every language (`786 KM` never: DESIGN §3). Prose is never uppercased. |
| Compass | Prose spells the direction out (*Richtung Süden*, *westlich*, *im Südwesten*). The 16-point readout table (`pass.compass16`) uses N, NNO, NO, ONO, O … Coordinates keep their own letters. |
| Dates | Numeric in mono (`So 01.11.`, `01.11. → 08.11.`), Intl short in prose (*am So., 1. Nov.*), Intl long for screen readers (*Sonntag, 1. November*). Instrument UTC stamps stay ISO 8601. Table by key in §6.3. |
| Time zones | 24-hour clock. CET/CEST print as **MEZ/MESZ** (WEZ/WESZ, OEZ/OESZ), through one helper in the German catalog. Other abbreviations stay. *Uhr* only without a zone (*um 11:21 Uhr Ortszeit*). |
| Quotes | „…“ and ‚…‘. The apostrophe is ’ (U+2019). |
| ß and Switzerland | Write ß. One catalog for DE, AT and CH; Swiss readers accept ß. Never replace it with *ss*, never type ẞ, never add a `de-CH` catalog. |
| Never translated | Watched., www.watched.earth, satellite / sensor / product / programme names, agency acronyms, NORAD IDs, UTC, zone abbreviations outside Europe, coordinates, licence and attribution lines. |

## 1. Register and address

### 1.1 The decision: du everywhere

| Surface | Form | Example | Reason |
|---|---|---|---|
| Display headlines (hero, About title) | du, lowercase | `Etwas hat *dich*` / `diese Woche` / `beobachtet.` | The hero is about intimacy: something knows *you*. *dich* is close and unsettling. *Sie* turns it into a notice from an authority. |
| Results and share headlines | No address (third person) | *In den letzten 7 Tagen beobachteten 256 Satelliten Waterloo.* | The headline reports. It talks about a place, not to a person. |
| Sentences and prose | du wherever the English says "you/your"; otherwise third person | *Gesehen hat der Sensor deine Wolken, nicht deine Straßen.* | The second person carries the uncanny, so keep every *you* the English has, and add none. |
| UI buttons and menu items | Infinitive, no address | *Teilen*, *Bild herunterladen*, *Erneut versuchen*, *Deinen Ort prüfen* | The German UI norm. It needs no verb form for du, so it stays short. A possessive the English has (*your place*) stays. |
| Fixed idioms as buttons | du imperative | *Überrasch mich* | The idiom exists only in the imperative. It is the one playful chip. |
| Mono caps labels | Nouns, no articles; a du form only where the English label has *your* | `HÖHE`, `LETZTE 7 TAGE`, `02 / ÜBERFLÜGE`, `AN DEINEM HIMMEL` | Labels name things. |
| Error and status notices | Impersonal statement of fact; du only when the reader must act | *Der Bahnkatalog konnte nicht geladen werden. Prüfe deine Verbindung und versuche es erneut.* | A fault is not the reader's doing, so it states what failed. A request for action addresses the reader. |
| About page | du, full sentences, plain | *Suche dir einen Ort auf der Erde aus.* | The long form keeps the hero's voice. It never shifts to *Sie*. |

### 1.2 Imperatives and pronoun case

- **Imperative in sentences:** the full form with *-e* for weak verbs: *Prüfe*, *Versuche*, *Drücke*, *Suche*,
  *Klicke*, *Erlaube*, *Halte*, and always where the stem needs it (*Warte*, *Öffne*, *Zeichne*). The clipped form
  (*Prüf*, *Versuch*) reads as spoken German and looks clipped in written copy.
- **Strong verbs with a vowel change** never take *-e*: *Gib*, *Sieh*, *Lies*, *Nimm*.
- **The chip idiom** *Überrasch mich* keeps its spoken form. It is the only clipped imperative in the catalog.
- **Pronoun case:** lowercase *du, dich, dir, dein, euch*, as the 2006 reform rules for everything except letters.
  A capital *Du* reads as a letter or as advertising.

### 1.3 Rejected alternatives

- **Sie everywhere.** *Etwas hat Sie diese Woche beobachtet* is the register of fraud warnings, scareware pop-ups
  and letters from an authority: alarming, not quietly uncanny. And du is the norm of the consumer web in Germany,
  Austria and Switzerland (Spotify, Instagram, komoot, whose Photon geocoder this app uses). *Sie* would mark Watched
  as an institution, which it is not. The cost is that some older readers and some Swiss readers expect *Sie*. That
  is acceptable for a free, curious web tool.
- **Mixed register** (du in the hero, Sie in About and errors). German readers notice a switch between du and Sie at
  once and read it as a mistake. One register throughout.
- **Impersonal everywhere** (*Man sieht …*, *Es wurde beobachtet*). It kills the product's second person, which is its
  whole emotional mechanism.

### 1.4 The *Ihr / Sie* trap at the start of a sentence

In a du product, a capitalised *Ihr*, *Ihre* or *Sie* at the start of a sentence reads as formal address, even when it
refers to a feminine noun. *Ihr Betreiber sagt nicht, ob sie hingesehen hat* (meaning "its operator", the camera's)
reads as "**Your** operator". Never open a sentence with *Ihr/Ihre/Ihnen/Sie* as a pronoun. Rewrite it with the noun:
*Der Betreiber sagt nicht, ob sie hingesehen hat.* Lowercase *ihr/sie* in the middle of a sentence is fine.

## 2. Voice

### 2.1 How "declarative, specific, quietly uncanny, second person" sounds in German

- **Declarative.** Main clauses with the verb second. State the fact, then stop. *Die Kamera blickte senkrecht nach
  unten.* No hedging particles (*eigentlich*, *halt*, *ja*, *wohl*) and no rhetorical questions in results copy. The
  share hook and the card's invitation are the only questions.
- **Specific.** Real numbers in mono spans, exact times, named satellites. The number does the emotional work: *zog um
  16:14:21 UTC in 786 km Höhe genau über den Ort hinweg*.
- **Quietly uncanny.** It comes from the second person and from plain words: *Etwas*, *beobachten*, *über deinen
  Himmel*, *deine Wolken, nicht deine Straßen*. German has a ready phrase for the feeling, *sich beobachtet fühlen*,
  and *beobachten* carries it without help. Never add *unheimlich*, *mysteriös* or *geheimnisvoll*.
- **Second person.** *du, dich, dir, dein*, and only where the English has "you".

### 2.2 Tense, as a rule of voice

The report is a log, so it uses Präteritum: *Sentinel-2C beobachtete Waterloo.* *Die Kamera blickte senkrecht nach
unten.* Written German reports use Präteritum, and it keeps the verb next to its subject in the headline frames
(§3.3), which Perfekt can't do (*haben … beobachtet* splits around the place name). The hero speaks to you, so it uses
the conversational Perfekt and ends on the participle: *… beobachtet.* App events (errors, status) use Perfekt too:
*Die Archive haben nicht geantwortet.*

### 2.3 Rhythm and length

- Main clauses of at most 15–18 words. At most one subordinate clause per sentence.
- At most one appended phrase after the verb bracket, set off by a comma (Ausklammerung): *… genau über den Ort
  hinweg, mit 7,46 km/s Richtung Süden.* A second fact goes inside the bracket (*in 786 km Höhe und 61 km westlich am
  Ort vorbei*) or into its own sentence. Never stack more than about six words between *hat* and *beobachtet*.
- End on the information: the place, the number, the verb that lands.
- Two short sentences beat one long one joined by a semicolon. A semicolon is allowed when the English has one and
  both halves are short.
- German prose runs about 20–30 % longer than English. Don't fight that with abbreviations; cut words.

### 2.4 What to avoid

- **Marketing tone:** *Entdecke jetzt …*, *spannend*, *faszinierend*, *erstaunlich*, *einzigartig*, *Wow*, exclamation
  marks, *Lass dich überraschen*.
- **Nominalstil and office German** in sentences: *erfolgt*, *Durchführung*, *seitens*, *bezüglich*, *im Rahmen
  von*, *diesbezüglich*, *Es wurde festgestellt, dass*. Use the verb. (Log lines are the exception, §2.5.)
- **English word order.** A fronted English adverbial with a comma (*In the last 7 days, 256 satellites watched*) needs
  inversion in German and no comma: *In den letzten 7 Tagen beobachteten 256 Satelliten …*.
- **English participle chains:** *moving south at 7.46 km/s* is never *sich mit 7,46 km/s nach Süden bewegend*. Use a
  prepositional tail: *mit 7,46 km/s Richtung Süden*.
- **Needless Anglicisms:** *tracken*, *checken*, *gecaptured*, *Location*, *Overflight*. Accept the established ones:
  *Pixel*, *Scan*, *Radar*, *Link*, *Video*, *Cookie*, *App*, *Pin*, *Rendern*, and *Off-Nadir* in readouts.
- **Gender markers** (*Betreiber\*innen*, *Nutzer:innen*, Binnen-I). They break mono caps and screen readers and don't
  belong in this terse register. Rewrite neutrally: *alle, die den Link haben*, *wer sucht*, *Menschen an Bord*.
  Nouns for institutions (*der Betreiber*, *der Anbieter*) are grammatical masculine and mean organisations.

### 2.5 The one exception: log lines

The computing readout (`engine.progress`, `results.computing.stages`, `app.progress`) and the time-lapse's waiting
steps are an instrument log. There, noun style is correct German, as in any log: *Bahnberechnung · 412 Bahnen · 7
Tage*. Use it only there.

### 2.6 Before and after

| Before (wrong) | After | Why |
|---|---|---|
| *Entdecke jetzt, welche Satelliten dich ausspionieren!* | *Etwas hat dich diese Woche beobachtet.* | Marketing and fear vocabulary. The voice states the fact and stops. |
| *In den letzten 7 Tagen, 256 Satelliten haben Waterloo beobachtet.* | *In den letzten 7 Tagen beobachteten 256 Satelliten Waterloo.* | English word order. The verb comes second, with no comma after the fronted adverbial. |
| *Sentinel-2C überquerte 786 km über Kopf um 16:14:21 UTC, sich mit 7,46 km/s südwärts bewegend. Er schaute gerade hinunter.* | *Sentinel-2C zog um 16:14:21 UTC in 786 km Höhe genau über den Ort hinweg, mit 7,46 km/s Richtung Süden. Die Kamera blickte senkrecht nach unten.* | A calque of "overhead", the English participle chain and a gendered pronoun after [SAT]. Time before place, a prepositional tail, the camera named. |
| *Die Durchführung der Bahnberechnung erfolgt lokal in deinem Browser.* | *Dein Browser berechnet die Bahnen.* | Nominalstil. (*rechnen* with an object means doing sums: use *berechnen*.) |
| *Es konnte keine Szene gefunden werden.* | *Zu diesem Überflug ist noch keine Szene veröffentlicht.* | A bureaucratic passive that says less than the truth. Say what is true. |
| *Was hat Waterloo diese Woche beobachtet* | *Welche Satelliten haben Waterloo diese Woche beobachtet* | With *was* as subject, the bare name reads as the subject: "what did Waterloo watch" (§5.1). |

## 3. The key lines

### 3.1 The hero (three lines, one accent)

**Final:**

```
Etwas hat *dich*
diese Woche
beobachtet.
```

The accent is *dich* (lowercase, serif italic, signal orange). The full sentence, for og:title, screen readers and the
share hook, is: *Etwas hat dich diese Woche beobachtet.* The tab title is `Watched · Etwas hat dich diese Woche
beobachtet`: tabs cut it after about 25–30 characters, which loses the verb. That is accepted, because the brand comes
first, as in English.

Why this one wins:
- It opens like the English, on the unknown agent *Etwas*. The subject stays a thing, never a person.
- *Etwas hat dich* reads as a complete, unsettling fragment ("something has got you"). The break after *dich* gives the
  poster a beat. The verb lands last, alone on its line, as the reveal. Verb-final order is German's strongest
  closing device.
- The word order is plain spoken German. Nothing is inverted for effect.

**Widths on the default share card** (88 px, each line `nowrap` in a 466 px column, measured through satori with the
card fonts): `Etwas hat dich` **464 px**, `diese Woche` 377 px, `beobachtet.` 359 px. English: 326 / 408 / 307. Line 1
has 2 px to spare; the serif *dich*'s italic overhang falls into the card's 52 px right margin. **Never lengthen line
1.** If a font or size change ever pushes it past 466 px, the card (only) switches to the four-line form the hero key
allows: `Etwas` / `hat *dich*` / `diese Woche` / `beobachtet.` (widest line 377 px; four lines fit the card's 471 px
band). The landing fits the three lines at every breakpoint.

**Alternates:**
1. `Diese Woche` / `hat *dich* etwas` / `beobachtet.` Natural German, but *etwas* sits mid-line after *dich* and stops
   being the uncanny opening. Line 2 is 466 px on the card, with no margin at all.
2. `Diese Woche` / `wurdest *du*` / `beobachtet.` The most compact, but the passive drops the agent, and *Du wurdest
   beobachtet* is the stock phrase of thrillers and scareware: alarmist, not quiet.

Rejected: *Etwas beobachtete dich diese Woche* (Präteritum is stiff when spoken to someone), *Jemand* (personifies the
satellites), *Irgendwas* (too casual), *überwacht* (accuses).

### 3.2 The sub line

English: "Enter any place on Earth. See every satellite that passed over it in the last 7 days, and the actual pictures
they took."

**Final:** *Gib einen beliebigen Ort auf der Erde ein. Du siehst alle Satelliten, die ihn in den letzten 7 Tagen
überflogen haben, und ihre echten Bilder.*

Why: two sentences, as in the English, and the second ends on *echten Bilder*, the promise. *ihn* refers to *Ort*,
our own noun. *Du siehst* is declarative, which suits the voice better than an imperative *Sieh dir … an* split around
a long object. At 142 characters it is about 20 % longer than the English.

Mechanics: `sub` is plain text in pieces, not a mono span; the German message may return one piece. The day phrase
still goes through the plural, as a whole phrase per category: `other` *in den letzten 7 Tagen* (U+00A0 between number
and noun), `one` *am letzten Tag*.

**Alternates:**
1. *… Du siehst jeden Satelliten, der ihn in den letzten 7 Tagen überflogen hat, und die echten Bilder, die dabei
   entstanden sind.* Closer to "every … they took", but 155 characters and it ends on a weak relative clause.
2. *Gib irgendeinen Ort ein. Sieh, welche Satelliten ihn … überflogen haben, und ihre echten Bilder.* *Sieh* takes a
   clause and a noun at once (a zeugma), and *irgendeinen* is casual.

Never *die aktuellen Bilder* (*aktuell* means "current"). Never *Fotos* here: the images include radar and weather
mosaics.

### 3.3 Results headline and second line

The English frame is "In the last 7 days, **256 satellites watched** *Waterloo*." German keeps the bold run in one
piece with Präteritum and inversion: the verb comes second, right after the fronted time phrase, and the subject
follows it. The plural verb with the plural count makes the subject unmistakable, so the bare place is safely the
object (§5.1).

| Key / case | German | Emphasis |
|---|---|---|
| `headline.watched`, `other` | In den letzten [DAYS] Tagen **beobachteten [NUM] Satelliten** *[PLACE]*. | bold: *beobachteten [NUM] Satelliten*; serif: [PLACE]; [NUM] mono |
| `headline.watched`, `one` | In den letzten [DAYS] Tagen **beobachtete [NUM] Satellit** *[PLACE]*. | the same |
| `headline.watched`, older window (`from`, `to`) | Vom [FROM] bis [TO] **beobachteten [NUM] Satelliten** *[PLACE]*. → *Vom 29.10. bis 05.11. beobachteten …* | the same |
| `headline.none`, this week | Diese Woche beobachtete kein uns bekannter Satellit *[PLACE]*. | serif: [PLACE]; no bold |
| `headline.none`, `past` | In der gezeigten Woche beobachtete kein uns bekannter Satellit *[PLACE]*. | the same |

`[DAYS]` is 7 and takes the dative plural *Tagen*; a one-day window says *Am letzten Tag beobachteten …*. `[FROM]` and
`[TO]` arrive from the time namespace's `dayMonth` (*29.10.*).

Examples: *In den letzten 7 Tagen **beobachteten 256 Satelliten** Waterloo.* · *In den letzten 7 Tagen **beobachtete 1
Satellit** Waterloo.* · *Diese Woche beobachtete kein uns bekannter Satellit Waterloo.*

**"diese Woche" and "in den letzten 7 Tagen":** German follows the English wording. Where the English says *this
week*, German says *diese Woche* (the hero, the zero headline, the second line, the card tail, the hook). Where the
English says *in the last 7 days*, German says *in den letzten 7 Tagen*. An older window is *die gezeigte Woche*.
Never *Kalenderwoche* or *KW*.

**"Kein uns bekannter Satellit"** ("no satellite known to us") is the one phrase for "no satellite we track", on every
surface (headline, card, pass list). It is honest (the catalog is what we know; About says secret satellites are
missing) and short enough for the card (§3.5).

**Second line** (`imagesPublic`, `noImages`, `archiveDown`; one count for photos, mosaics, radar and full-disc images;
bold as in English):

| Case | German |
|---|---|
| `other` | **[NUM] Bilder wurden veröffentlicht.** |
| `one` | **[NUM] Bild wurde veröffentlicht.** |
| partial (the strong part, hidden once final) | **Mindestens** [NUM] Bilder wurden veröffentlicht. / **Mindestens** [NUM] Bild wurde veröffentlicht. |
| zero, this week | Diese Woche wurden keine Bilder veröffentlicht. |
| zero, older week | In der gezeigten Woche wurden keine Bilder veröffentlicht. |
| archives down | Die Bildarchive haben nicht geantwortet, darum können wir die öffentlichen Bilder gerade nicht zählen. |

The sentence reads whole with and without *Mindestens*. Example: *1.715 Bilder wurden veröffentlicht.* Use
*veröffentlicht*, never *öffentlich gemacht* (a calque) and never *publik gemacht* (that means "exposed", as in a
scandal). Use *Bilder*, never *Fotos*: the count includes radar.

**Why no image was made public** (`results.why`; *ihn* in the infrared line refers to *den Ort* in the sun line that
always comes before it):

| Key | German |
|---|---|
| sunNeverRose | Die Sonne ging nie auf, also konnte keine Tageslichtkamera den Ort sehen. |
| sunBarelyRose | Die Sonne stieg kaum über den Horizont, also konnte keine Tageslichtkamera den Ort sehen. |
| infrared | Wettersatelliten erfassten ihn trotzdem im Infrarot, [NUM]-mal. (`one`: *…, einmal.*) |
| radar | Radar braucht kein Licht. Umbra-08, Capella-14 und 7 weitere Radarsatelliten kamen 1.204-mal in Reichweite. (one name alone: *Umbra-08 kam 3-mal in Reichweite.*) |
| unpublished | Sentinel-2 oder Landsat überflog den Ort einmal bei Tageslicht, aber es ist noch keine Szene veröffentlicht. (`other`: *… 3-mal …*) |
| none | Kein Erdbeobachtungssatellit mit offenen Daten überflog den Ort bei Tageslicht. |

Each reason is a whole sentence in the catalog. Summary.tsx capitalises its first letter in code, which is harmless.

**The footnote under the summary** (`notes.counted`, each count bold, ranges are ground resolution):

> **12** detaillierte Bilder (Sentinel-2, Landsat, 10–30 m) · **3** tägliche Wettermosaike (250–375 m) · **1** Radarbild
> (Sentinel-1, 20 m) · **1.008** Vollscheibenbilder geostationärer Wettersatelliten (2–5 km; von jedem wird das neueste
> gezeigt). 1.234 Überflüge von 250 Erdbeobachtungssatelliten und Raumstationen geprüft.

`one` forms: *1 detailliertes Bild*, *1 tägliches Wettermosaik*, *1 Vollscheibenbild*, *1 Überflug von 1 …*.
`passTimes`: *Die Überflugzeiten geben an, wann jeder Satellit dem Ort am nächsten war, berechnet aus öffentlichen
Bahnelementen (abgerufen 2026-11-08 03:31Z). Ortszeit: America/Toronto.*

### 3.4 Pass sentences (`pass` namespace)

Every sentence is one catalog message with slots. The German order differs from the English (time before place, then
the tail), so never build German from English parts.

**Imaged, detailed (Sentinel-2 / Landsat):**

> EN: Sentinel-2C crossed 786 km overhead at 16:14:21 UTC, moving south at 7.46 km/s. It was looking straight down.
> Cloud cover across the scene: 25%.
>
> **DE:** Sentinel-2C zog um 16:14:21 UTC in 786 km Höhe genau über den Ort hinweg, mit 7,46 km/s Richtung Süden. Die
> Kamera blickte senkrecht nach unten. Bewölkung der ganzen Szene: 25 %.

| Key | German template |
|---|---|
| crossed, overhead (no `offset`) | [SAT] zog um [TIME] in [ALT] km Höhe genau über den Ort hinweg, mit [SPEED] km/s Richtung [HEADING-NOUN]. |
| crossed, off to one side | [SAT] zog um [TIME] in [ALT] km Höhe und [KM] km [DIR-ADV] am Ort vorbei, mit [SPEED] km/s Richtung [HEADING-NOUN]. → *Sentinel-2C zog um 16:14:21 UTC in 786 km Höhe und 61 km westlich am Ort vorbei, mit 7,46 km/s Richtung Süden.* |
| lookingDown | Die Kamera blickte senkrecht nach unten. |
| lookingOff | Die Kamera war um [DEG]° aus der Senkrechten geneigt. → *um 5,4° aus der Senkrechten geneigt* |
| cloudCover | Bewölkung der ganzen Szene: [PCT] %. |

*zog … hinweg / vorbei* is the crossing verb in results prose: it needs no object for the off-track case and has the
quiet motion of something passing above. The *und* inside the bracket keeps the two mono numbers apart and leaves one
appended phrase.

**Every other pass sentence:**

| Key | English | German |
|---|---|---|
| mosaic | Its VIIRS imager swept Waterloo into NASA’s daily true-colour mosaic at 375 m per pixel. | Der VIIRS-Sensor an Bord erfasste den Ort für das tägliche Echtfarbenmosaik der NASA, mit 375 m pro Pixel. |
| radarImaged | Its radar, looking 20.4° to the side, imaged Waterloo at 20 m per pixel, in the dark. | Das Radar an Bord blickte 20,4° zur Seite und bildete den Ort im Dunkeln mit 20 m pro Pixel ab. (not dark: *… und bildete den Ort mit 20 m pro Pixel ab.*) |
| likely.crossed | Sentinel-2A crossed 786 km overhead at 10:41:07 CET, inside its 290 km swath. | Sentinel-2A zog um 10:41:07 MEZ in 786 km Höhe genau über den Ort hinweg; der 290 km breite Aufnahmestreifen deckte ihn ab. (no swath: end after *hinweg.*; off-track: *… und 61 km westlich am Ort vorbei; der …*) |
| likely.archiveFailed | It was daylight, so it would have recorded this spot. The archive could not be searched just now. | Es war Tag, die Kamera hätte den Ort also aufgenommen. Das Archiv ließ sich gerade nicht durchsuchen. |
| likely.noScene | No scene exists for this pass. Sentinel-2 records only land and coastal water, and may not have scheduled this spot. | Zu diesem Überflug gibt es keine Szene. Sentinel-2 zeichnet nur Land und Küstengewässer auf und hat diesen Ort womöglich nicht eingeplant. |
| likely.notYet | It was daylight, so it almost certainly recorded this spot. No scene from this pass has been published yet; archives can lag by a day or more. | Es war Tag, die Kamera hat den Ort also höchstwahrscheinlich aufgenommen. Zu diesem Überflug ist noch keine Szene veröffentlicht; Archive können einen Tag oder länger hinterherhinken. |
| likely.dark | It was dark here. Weather imagers keep scanning at night in infrared, so it saw your clouds, not your streets. | Hier war es dunkel. Wettersensoren messen nachts im Infrarot weiter. Gesehen hat der Sensor deine Wolken, nicht deine Straßen. |
| likely.mosaicUnconfirmed | NASA’s daily mosaic for this pass could not be confirmed at your spot. | Das Tagesmosaik der NASA zu diesem Überflug ließ sich an deinem Ort nicht bestätigen. |
| likely.notPublished | Its images feed weather forecasts; they are not published as pictures we can show. | Die Daten dieses Sensors fließen in Wettervorhersagen ein; als Bilder, die wir zeigen können, werden sie nicht veröffentlicht. |
| could.withinView | WorldView Legion 4 passed within view at 10:52 EST, directly overhead. / …, 61 km to the west. | WorldView Legion 4 kam um 10:52 EST in Sichtweite, genau über dem Ort. / … in Sichtweite, 61 km westlich des Ortes. |
| could.camera | Looking straight down, it could have watched Waterloo. We can’t know whether it did. | Mit senkrechtem Blick hätte die Kamera den Ort beobachten können. Ob sie es getan hat, können wir nicht wissen. |
| could.camera (`deg`) | Pointing 23.1° off straight down, it could have … | Um 23,1° aus der Senkrechten geschwenkt, hätte die Kamera den Ort beobachten können. Ob sie es getan hat, können wir nicht wissen. |
| could.insideSwath | Waterloo was inside its 300 km swath. Its operator does not publish where it imaged, so we can’t know whether it did. | Der Ort lag innerhalb des 300 km breiten Aufnahmestreifens. Der Betreiber veröffentlicht nicht, wo die Kamera aufgenommen hat; ob dieser Ort dabei war, können wir nicht wissen. |
| could.radar | Radar sees through cloud and darkness. Pointing 25.0° to the side, it could have mapped Waterloo. We found no published image of it from this pass. | Radar sieht durch Wolken und Dunkelheit. Um 25,0° zur Seite geneigt, hätte das Radar den Ort kartieren können. Von diesem Überflug fanden wir kein veröffentlichtes Bild. (no `deg`: *Das Radar hätte den Ort kartieren können.*; closed archive: *Ob es das getan hat, können wir nicht wissen.*) |
| overhead | ISS passed 418 km up at 21:14 EST, 62° above your horizon to the southwest. | NOAA-21 zog um 21:14 EST in 824 km Höhe vorüber, 62° über deinem Horizont im Südwesten. Crewed: *Die Raumstation ISS zog um 21:14 EST in 418 km Höhe vorüber, …* |
| overhead (≥ 80°) | … almost straight up. | … 84° über deinem Horizont, fast senkrecht über dir. |
| darkStation | It was dark where you are. If the station was still in sunlight, it crossed your sky as a bright, steady point. | Bei dir war es dunkel. Stand die Station noch im Sonnenlicht, dann zog sie als heller, ruhig leuchtender Punkt über deinen Himmel. |
| geo.sits | Meteosat-12 doesn’t pass. It sits 35,786 km above the equator at 0.2°W and scans the whole face of the Earth below it every 10 minutes. | Meteosat-12 zieht nicht vorüber. Der Satellit steht in 35.786 km Höhe über dem Äquator bei 0.2°W und tastet alle 10 Minuten die ganze sichtbare Erdscheibe ab. (no `seat`: *… über dem Äquator und …*; no cadence: *… und tastet die ganze sichtbare Erdscheibe ab.*) |
| geo.reached | This scan’s line reached Paris at about 07:49 CET, moving north. | Die Scanlinie dieses Bildes erreichte den Ort gegen 07:49 MEZ und lief Richtung Norden weiter. |
| geo.infrared | It was dark here, so this is infrared: cloud tops by temperature, colder is lighter. | Hier war es dunkel, darum zeigt das Bild Infrarot: Wolkenobergrenzen nach Temperatur, je kälter, desto heller. |

Notes:
- *das Radar an Bord*, *der VIIRS-Sensor an Bord*, *die Kamera*, *der Betreiber*, *der Satellit* (geostationary) and
  *die Station* (crewed) are our nouns, so pronouns may follow them (*sie*, *es*, *ihn*). A pronoun never follows a
  bare [SAT].
- *ihn* in *deckte ihn ab* refers to *den Ort* in the same sentence.
- *Die Raumstation ISS* needs a `crewed` flag in `pass.overhead` and `share.post.overhead`; code already knows the
  category (`meta.category`), so it costs nothing. English ignores the flag.
- *kam in Sichtweite* is the could verb everywhere. *überflog* is used in the share leads, posts and page descriptions
  (§3.5), *zog … hinweg / vorbei / vorüber* in results prose.

### 3.5 Share card, share page and post

**Card headline** (`card.headline`, `headlineBy`, `headlineWeek`). The card sets the lead in the condensed face, then
the serif place, then the tail on the place's line. The place is always the accusative object and the verb sits before
it. Every lead verb is inseparable or complete before the place, so nothing verbal falls into the serif tail. Keep the
closing full stop as its own part; when the place was cut (`cut`, it ends with "…"), drop the stop.

| Case | lead | place | tail | Reads |
|---|---|---|---|---|
| `headline`, `other` | `[NUM] Satelliten beobachteten` | [PLACE] | `.` | *7 Satelliten beobachteten Waterloo.* |
| `headline`, `one` | `1 Satellit beobachtete` | [PLACE] | `.` | *1 Satellit beobachtete Waterloo.* |
| `headlineWeek` | the same leads | [PLACE] | ` diese Woche.` | *31 Satelliten beobachteten Waterloo diese Woche.* |
| `headlineWeek`, zero | `Kein uns bekannter Satellit beobachtete` | [PLACE] | ` diese Woche.` | |
| `headlineBy.imaged` | `[SAT] beobachtete` | [PLACE] | `.` | *Sentinel-2C beobachtete Waterloo.* |
| `headlineBy.likely` | `[SAT] erfasste vermutlich` | [PLACE] | `.` | *Sentinel-2A erfasste vermutlich Waterloo.* |
| `headlineBy.could` | `[SAT] kam in Sichtweite von` | [PLACE] | `.` | *WorldView Legion 4 kam in Sichtweite von Waterloo.* |
| `headlineBy.overhead` | `[SAT] überflog` | [PLACE] | `.` | *ISS überflog Waterloo.* |

- A definite object such as a name comes before a time adverb in normal German word order, so *beobachteten Waterloo
  diese Woche* is unmarked. Never move the verb into the tail: *haben … beobachtet* would set *beobachtet* in serif.
- A nameless satellite (`sat` undefined) is written by each sentence itself: *Ein Satellit beobachtete*, *Ein Satellit
  kam in Sichtweite von*.
- Headline leads stay bare, also for the ISS (headline style).
- Curated places that take an article get it from the German table, as plain text before the serif name (§5.1): *7
  Satelliten beobachteten den *Central Park*.* For the could lead the table gives the *von* form: *… kam in Sichtweite
  vom *Central Park*.*
- Every German pass-card lead is over 24 characters, so the card sets it at 72 px against English's 84. Accepted. The
  zero lead (39 characters) renders at 62 px; English's is 72.

**Line under the headline** (`card.photos`, one line, 24 px sans): *1.715 Bilder wurden veröffentlicht.* / partial
*Mindestens 1.715 Bilder sind öffentlich.* (*… wurden veröffentlicht.* would be 505 px in the 466 px column; this is
423 px, 456 for 123.456) / `one` *… Bild wurde …*, partial *Mindestens 1 Bild wurde veröffentlicht.* (426 px) / zero
*Es wurden keine Bilder veröffentlicht.* (the headline already says *diese Woche*). `archiveDown`: *Die Bildarchive haben nicht geantwortet, darum können wir
die öffentlichen Bilder gerade nicht zählen.* `archiveDownShort`: *Die Bildarchive haben nicht geantwortet.*

**Cloud words** (`card.cloud`; the German Weather Service's terms, which lay readers know from every forecast):

| Case | `sub` (one line) | `chip` | `post` | `desc` |
|---|---|---|---|---|
| ≥ 90 % (`only`) | Bedeckt. Das Bild zeigt nur Wolken. | Bedeckt · 93 % | Das Bild zeigt nur Wolken. | Das Bild zeigt nur Wolken (93 %). |
| 70–89 % (`mostly`) | Stark bewölkt: 81 % der Szene. | Stark bewölkt · 81 % | Das Bild zeigt überwiegend Wolken (81 %). | the same as `post` |
| at the spot (`spot`) | Wolken genau über dem Ort. | Wolken über dem Ort | Wolken lagen über dem Ort. | the same as `post` |

**Top row, readouts and chips** (mono caps; sentence case in the catalog):

| Key | German |
|---|---|
| stamp | So 01.11.2026 · 11:21 MEZ |
| weekTo | 7 Tage bis So 08.11.2026 (the year stays, as in English) |
| lastWeek | Letzte 7 Tage |
| readout | Höhe · Höhenwinkel · Geschwindigkeit · Off-Nadir · Pixel · Mosaikpixel · Abstand |
| lane | Bild · Vermutlich · Möglich · Überflogen |
| unit | km · m · km/s |
| decimal, pixelSize | `f.dec`: *7,46*, *5,3*; *10 m*, *0,31 m*, *2 km* |
| geometry | Geometrie · Norden oben |
| note | Bild öffnet sich in der App · Bild gerade nicht verfügbar · Kommerziell, nicht öffentlich · Im Streifen, unveröffentlicht · Bodenspur bei größter Annäherung |
| acquiring | Erfassung … |
| noPublicPhoto | Kein öffentliches Bild (the stamp already names the week) |
| noPhoto | Kein Bild vorhanden |
| look | Aus nächster Nähe · Letzter klarer Blick · Bedeckt · Radar |
| lookDay | 03.11. |
| aSatellite | Ein Satellit (only as a label on its own: chips, the plan callout) |
| invite (footer beside the host) | Was hat dich beobachtet? |

**Default card:** `hero` as §3.1; `enterAnyPlace` (footer, 15 px mono caps beside `www.watched.earth`): *Suche dir
einen Ort aus*; `defaultPlace`: *Palm Jumeirah*; `defaultAlt`: *Ein echtes Satellitenfoto von Sentinel-2 zeigt Palm
Jumeirah in Dubai, daneben die Zeile: Etwas hat dich diese Woche beobachtet. Suche dir einen Ort aus.*

**Share page** (`card.page`, and the description sentences):

| Key | German |
|---|---|
| page.title | Etwas hat dich diese Woche beobachtet. |
| page.description | the sub line (§3.2), verbatim |
| page.placeTitle (no full stop) | Welche Satelliten haben Waterloo diese Woche beobachtet |
| page.placeDescription | Alle Satelliten, die Waterloo in den letzten 7 Tagen überflogen haben, und ihre echten Bilder. Was hat dich diese Woche beobachtet? |
| page.opening | [accent *Watched*] wird geöffnet … |
| crossed (imaged, likely, overhead) | Sentinel-2C überflog Waterloo am So., 1. Nov. 2026, um 11:21 EST in 795 km Höhe, Richtung Süden. (no altitude: *… um 11:21 EST, Richtung Süden.*; no heading: end after the time or altitude) |
| withinView | WorldView Legion 4 kam am So., 1. Nov. 2026, um 10:52 EST in Sichtweite von Waterloo, Richtung Süden. |
| couldHave | Die Kamera hätte hierher blicken können. Der Betreiber sagt nicht, ob sie es getan hat. |
| straightDown | Die Kamera blickte senkrecht nach unten. |
| offNadir | Die Kamera war um 5,4° aus der Senkrechten geneigt. |
| cloudCover | Bewölkung: 25 %. |
| inSwath | Der Ort lag im Aufnahmestreifen. |
| bestFrom | Das Bild aus nächster Nähe stammt von Sentinel-2B. · Der letzte klare Blick stammt von Sentinel-2B. · Das erste Bild stammt von Sentinel-2B. (nameless: *… stammt von einem Satelliten.*) |
| question | Was hat dich diese Woche beobachtet? |
| cardAlt.withPhoto | Die Karte zum Teilen, mit dem Bild der Woche aus nächster Nähe. Es stammt von Sentinel-2B. (nameless: *… Es stammt von einem Satelliten.*) |
| cardAlt.plain | Die Karte zum Teilen. |

*überflog* with an accusative object keeps the place in the safe object slot, which *über* + name never does. *von*
+ [SAT] is safe here: the satellites that take the week's pictures (Sentinel, Landsat, NOAA, Terra, Meteosat …) are
written without an article in German. The card is called *die Karte* (*die Karte zum Teilen*).

**Post text** (`share.post`; the credit line `via @armaangupt0` stays as is):

| Case | German |
|---|---|
| imaged | Sentinel-2C beobachtete Waterloo am So., 1. Nov., um 11:21 Uhr Ortszeit aus 786 km Höhe. 10 m pro Pixel; das ist das echte Bild. (no pixel: *… Höhe. Das ist das echte Bild.*) |
| clouded | Sentinel-2C beobachtete Waterloo am So., 1. Nov., um 11:21 Uhr Ortszeit aus 786 km Höhe. [the `cloud.post` sentence] |
| likely | Sentinel-2A erfasste vermutlich Waterloo am So., 1. Nov., um 10:41 Uhr Ortszeit aus 786 km Höhe. Der Aufnahmestreifen der Kamera deckte den Ort ab. |
| could | WorldView Legion 4 kam am So., 1. Nov., um 10:52 Uhr Ortszeit in Sichtweite von Waterloo. Die Kamera hätte hierher blicken können. Der Betreiber sagt nicht, ob sie es getan hat. |
| overhead | NOAA-21 überflog Waterloo am So., 1. Nov., um 21:14 Uhr Ortszeit in 824 km Höhe. Crewed: *Die Raumstation ISS überflog Waterloo am …* |
| hookWatched | Etwas hat auch dich diese Woche beobachtet. |
| hookPassed | Was ist diese Woche über dich hinweggezogen? |
| summary post (first sentence = `headlineWeek`) | 31 Satelliten beobachteten Waterloo diese Woche. 12 Bilder wurden veröffentlicht. |

*hookWatched* echoes the hero word for word (*Etwas hat … diese Woche beobachtet*), as the landing's key asks; the
invite bar over a shared link (`results.invite.text`) is the same sentence. Both hooks are under 45 characters, so the
invitation is dropped only for long place names, as in English. PNG names: `watched-sentinel-2c-waterloo-2026-11-01.png`,
`watched-waterloo-woche-2026-11-08.png` (lowercase ASCII).

**Share sheet** (`share`; mono caps buttons, one line):

| Key | German | Note |
|---|---|---|
| titlePass / titleImage / titleWeek | Überflug teilen / Bild teilen / Diese Woche teilen | |
| close / closeTitle | Schließen / Schließen (Esc) | |
| shareImage / preparingImage / share | Bild teilen / Bild wird vorbereitet … / Teilen | the phone's full-width primary |
| copyLink / copied | Kopieren / Kopiert | the LINK field names what it copies; on laptops it sits beside *Bild kopieren* |
| postToX | Auf X | |
| copyImage | Bild kopieren | laptops only |
| savePng / tryAgain | Speichern / Noch mal | |
| linkLabel / postLabel | Link / Text | the 48 px column |
| directLink | Direkter Link: Der Kurzlink ließ sich gerade nicht erstellen. | |
| creatingLink / linkLater | Link wird erstellt … / Entsteht beim Teilen | |
| renderFailed | Die Karte ließ sich hier nicht zeichnen; der Link funktioniert trotzdem. | |

### 3.6 The four verdicts (`verdicts`, one vocabulary)

| Verdict | Title | Lane (`short`) | Unit `one` / `other` | Definition | `verb` (row summary) | Headline lead |
|---|---|---|---|---|---|---|
| imaged | Beobachtet | `BILD` | Überflug / Überflüge | Ein echtes Bild dieses Ortes liegt in einem öffentlichen Archiv. | beobachtet | beobachtete |
| likely | Vermutlich beobachtet | `VERMUTLICH` | Überflug / Überflüge | Der Aufnahmestreifen einer fest ausgerichteten Kamera lag über diesem Ort. Ein Bild davon ist nicht veröffentlicht. | vermutlich erfasst | erfasste vermutlich |
| could | Konnte hierher blicken | `MÖGLICH` | Überflug / Überflüge | Eine schwenkbare oder kommerzielle Kamera war in Reichweite. Der Betreiber sagt nicht, ob sie hingesehen hat. | in Sichtweite | kam in Sichtweite von |
| overhead | Überflogen | `ÜBERFLOGEN` | Überflug / Überflüge | Über deinen Himmel gezogen. Raumstationen und alles andere. | überflogen | überflog |

About's sentence after each definition (`verdictMore`):
- imaged: *Was wir zeigen, ist das echte Bild.*
- likely: *Das Bild ist noch nicht öffentlich, oder es wurde wegen Wolken verworfen.*
- could: *Ob sie es wirklich getan hat, lässt sich von außen nicht sagen.*

Why these words:
- **Beobachtet** is the product verb itself, as a participle. **Überflogen** (10) is its parallel. *Nur überflogen*
  would add a judgement the English doesn't make.
- **Vermutlich beobachtet** is the hedged twin of *Beobachtet*, which is the verdict's meaning.
- **Konnte hierher blicken.** The indicative *konnte* states a capability, "was able to look here", which is exactly
  what we know. *Hätte hierher blicken können* suggests it did not; *Möglicherweise beobachtet* loses the steerable
  camera.
- **Room:** the summary tiles are a 2 × 2 grid. On laptops the label box is about 182 px (10.5 px, `nowrap`): *Konnte
  hierher blicken* 168 px, *Vermutlich beobachtet* 160 px, the English *Could have pointed here* 175 px. On phones and
  on 761–1100 px screens the CSS already lets the name take two lines (`results.module.css`), as the English does.
- **erfasste vermutlich** is the likely verb in leads and posts. It is honest (the swath captured the place; no
  picture is published), inseparable before the place, and it echoes the title's *vermutlich*. *überstrich* was
  rejected: lay readers hear *eine Wand überstreichen*, to paint over.
- **`kommerziell`, never *privat*, for the camera:** *eine private Kamera* is a person's own camera, the very
  surveillance connotation to avoid. An archive may be *privat* (not public).
- **The lane `BILD`, not `FOTO`:** the imaged lane includes Sentinel-1 radar and weather mosaics. A radar image is not
  a photo.
- **Unit *Überflug***: every verdict counts passes, so the tiles read alike: `12 ÜBERFLÜGE`, `1 ÜBERFLUG`.
- Running text that names the verdicts (the timeline's spoken summary, the lightbox's spoken lead) gets its own German
  message: code never lowercases a title. The timeline summary pairs each title with its count: *Zeitleiste, 7 Tage:
  Beobachtet 12, Vermutlich beobachtet 3, Konnte hierher blicken 5, Überflogen 40.*

### 3.7 About page and HUD

**HUD** (mono caps, one `nowrap` line per corner; on a 375 px phone the top corners nearly touch, so German keeps them
as wide as the English):

| Key | German | Width at 11 px (EN) |
|---|---|---|
| about (top left) | Funktionsweise | 112 px (112) |
| sun (top right) | `Sonne ${lat} ${lon}` → *SONNE 16.2°S 063.0°E* | 160 px (144) |
| scene | Szene (then the scene clock *So 01.11. 11:21:13 EST*) | 39 px (39) |
| subsolar / gmst | Subsolarpunkt / GMST 18:41:50 | |
| objects / objectsPending / catalog | 16.893 Objekte (`one` *1 Objekt*) / Objekte / Katalog | |
| fetched | Abgerufen 2026-11-08 03:34Z | |
| catalogAge | vor <1 min · vor 42 min · vor 5 h · vor 3 Tagen; stale: *Veraltet, vor 3 Tagen* | days always spelled out, never `3 T` |
| catalogUnavailable / catalogLoading | Katalog nicht verfügbar / Katalog wird geladen | |
| home / regionTime / regionCatalog / regionSun (aria) | Watched, Startseite / Zeit / Bahnkatalog / Sonne | |

The coordinates arrive formatted and stay as they come. *Szene* here is the replay's scene clock (it mirrors the
English), not the archive's *Szene*.

**About page:**

| Key | German |
|---|---|
| bar | Info |
| title | `Wie das` / `*funktioniert*.` (the full stop outside the accent) |
| lede | Suche dir einen Ort auf der Erde aus. Wir berechnen, welche Satelliten in der letzten Woche darüber hinweggezogen sind, und suchen dann die Bilder, die sie gemacht haben. Alles läuft in deinem Browser, mit öffentlichen Daten. |
| sections | Kurz gesagt · Wie wir Überflüge finden · Was die Begriffe bedeuten · Was wir nicht sehen · Datenschutz · Quellen · Tastatur (the index column, §7: no article before *Überflüge*, *Begriffe* not *Bezeichnungen*) |
| seeMe | *Kann es mich sehen?* Nein. Ein Pixel ist hier bestenfalls 10 m breit. Ein Auto ist ein Pixel. Du bist darin nicht zu sehen. |
| everySatellite | *Sind das alle Satelliten?* Nein. Militär- und Spionagesatelliten tauchen in öffentlichen Katalogen meist nicht auf, und Firmen sagen nicht, wohin sie ihre Kameras richten. |
| tilting cameras | Viele kommerzielle Satelliten können sich um 30 bis 45 Grad neigen. Warst du in Reichweite, nennen wir das „Konnte hierher blicken“. |
| where it runs | Die Bahnen berechnet dein Browser. |
| what we keep | Wir zählen Suchen nach Ort, auf etwa 10 km genau, nie nach deinem genauen Standort, und führen eine Strichliste darüber, was geöffnet und geteilt wird. Keine IP-Adressen, keine eigenen Cookies, nichts, was einen Besuch mit dem nächsten verbindet. |
| madeBy / builtBy | Gemacht von: Armaan, @armaangupt0 auf X / Von @armaangupt0 |
| keyNames | Enter · Leertaste · Esc |
| footerNote | Aus öffentlichen Daten gemacht. Keines dieser Bilder haben wir selbst aufgenommen. |

The HUD link and the page title need not match word for word: *Funktionsweise* is a precise, instrument-like label;
the display title has room for the spoken phrase. *Enter* is the common name of the key (some German keyboards print
*Eingabe*).

### 3.8 Time-lapse (`timelapse`, and the row under the photos)

| Key | German |
|---|---|
| results row title / sub | Zeitraffer / Dieser Ort, Jahr für Jahr |
| dialog / title | Zeitraffer: Waterloo / Zeitraffer |
| play / pause / slider / frameList (aria) | Abspielen / Anhalten / Bild / Bilder |
| date / dayMonth | 22.10.2015 / 22.10. |
| readout | 22.10.2015 · Sentinel-2A |
| frameSpoken | Bild 3 von 11: 22. Oktober 2015 |
| captionYearly | 11 klare Blicke · einer pro Jahr (`one` *1 klarer Blick*) |
| captionSeason | 11 klare Blicke · jeweils im Winter / im Frühling / im Sommer / im Herbst |
| captionGathering | Ein klarer Blick pro Jahr · seit 2015 |
| captionShort / captionError | Kein Zeitraffer für diesen Ort / Das Archiv hat nicht geantwortet |
| note | Jedes Bild zeigt dasselbe Quadrat von 10 km Seitenlänge, aufgenommen von Sentinel-2 und farblich so abgestimmt wie jedes Foto hier. Jedes Jahr zielt auf eine andere Jahreszeit; ein Jahr ohne klaren Blick fällt weg. |
| noteOneSeason | Jedes Bild zeigt dasselbe Quadrat von 10 km Seitenlänge, aufgenommen von Sentinel-2 und farblich so abgestimmt wie jedes Foto hier. Alle Bilder stammen aus derselben Jahreszeit; ein Jahr ohne klaren Blick in dieser Jahreszeit fällt weg. |
| source | Copernicus Sentinel-2, über Planetary Computer |
| listing / choosing / developing | Archivsuche · 03 / 12 / Auswahl klarer Blicke · 03 / 12 / Entwicklung der Bilder · 03 / 12 (the counters, `system.counter`, keep the slash: German dates take dots, *20.12.2017*, *Mi 28.10.*, so `03 / 12` beside them reads as a count, never a day; checked 2026-11-22, when Vietnamese, whose dates are d/m, dropped it) |
| choosingProgress / developingProgress (aria) | Auswahl klarer Blicke, 3 von 12 / Entwicklung der Bilder, 3 von 12 |
| tooCloudy / tooFew | Zu bewölkt für einen Zeitraffer. / Kein klarer Blick seit 2015 · 3 nötig (`2 klare Blicke seit 2015 · 3 nötig`) |
| noAnswer / unreachable / retry | Das Archiv hat nicht geantwortet. / Planetary Computer war nicht erreichbar / Erneut versuchen |
| share / linkCopied / shareTitle | Teilen / Link kopiert / Waterloo, Jahr für Jahr |
| video / rendering / videoFailed / saveVideo | Video / Rendern 42 % / Fehlgeschlagen / Speichern (the button keeps 132 px) |

Photos in the time-lapse are Sentinel-2 photos, so *Foto* is honest in *wie jedes Foto hier*. The video draws its
words with `toLocaleUpperCase('de')`, which writes ß as SS: correct. The licence credit stays English.

### 3.9 Other screens

**Landing** (`landing`):

| Key | German |
|---|---|
| lastDays / windowRange | Letzte 7 Tage / 01.11. → 08.11.2026 UTC (across months *29.10. → 05.11.2026 UTC*, across years *29.12.2026 → 05.01.2027 UTC*) |
| searchPlaceholder / placeLabel | Ort suchen / Ort |
| searching / searchUnavailable / matches / noMatch | Suche / Suche nicht verfügbar / 1 Treffer, 5 Treffer / Kein Treffer |
| searchHint | Name, Adresse, Koordinaten |
| clearSearch / go (aria) | Suche leeren / Zeigen, was über diesen Ort hinwegzog |
| searchDown | Die Ortssuche antwortet gerade nicht. Koordinaten wie 43.47, −80.54 funktionieren weiterhin. |
| nothingMatches | Nichts passt zu „Watrloo“. Versuche eine Stadt, ein Wahrzeichen oder Koordinaten. |
| useMyLocation / locateMe / nearMe / locating | Meinen Standort verwenden / Standort / Bei mir / Ortung … |
| cancelSearch / cancelLocate / cancelLocating | Abbrechen / Abbrechen / Ortung abbrechen |
| requestingPosition / namingPlace / elapsed | Positionsabfrage / Ort wird bestimmt / 04 s (the phone's field row; *Ort wird bestimmt* as on the globe's pin card, never *benannt*, which reads as giving the place a name) |
| locatingNote | Deine Position geht an den Geocoder Photon, um den Ort zu benennen. Wir speichern nur ein Feld von etwa 10 km. |
| locationLabel / dismiss | Standort / Ausblenden |
| locateErrors | denied *Der Standortzugriff ist blockiert. Erlaube ihn in den Browsereinstellungen oder suche nach einem Ort.* · unavailable / other *Deine Position ist gerade nicht verfügbar. Suche stattdessen nach einem Ort.* · timeout *Die Ortung hat zu lange gedauert. Versuche es erneut oder suche nach einem Ort.* · unsupported *Dieser Browser kann seinen Standort nicht teilen. Suche stattdessen nach einem Ort.* · insecure *Die Ortung braucht eine sichere Verbindung (https). Suche stattdessen nach einem Ort.* |
| orTry / pinHint / dropPin | Oder / Oder klicke auf den Globus für einen Pin / Pin setzen |
| surprise / surpriseName | Überrasch mich / Überrasch mich: ein bekannter Ort, zufällig gewählt |
| builtBy | Von @armaangupt0 |

The example coordinates in `searchDown` keep the decimal point: they are input syntax, set as written (§6.2).

**Computing readout** (log style, §2.5; one line of at most ~40 characters on a 390 px phone):

| Key | German |
|---|---|
| app.progress.catalog | Bahnelemente werden geladen |
| engine.progress.loadingCatalog / catalog | Bahnkatalog wird geladen / Katalog · 16.893 Objekte |
| propagateStart / propagating | Bahnberechnung · 412 Bahnen · 7 Tage / Bahnberechnung · 231 / 412 |
| searchingArchives | Archivsuche · Sentinel-2 + Landsat |
| matching | Abgleich · 31 Szenen mit 412 Überflügen |
| verifyingWeatherStart / verifyingWeather | NASA-Wettermosaike werden geprüft / NASA-Wettermosaike geprüft · 12 / 35 |
| done | 412 Überflüge · 31 Bilder |
| stages (idle / done) | Bahnkatalog / Katalog geladen · Bahnberechnung · 7 Tage / Bahnen berechnet · Archive Sentinel-2 + Landsat / Archive durchsucht · Szenen zuordnen / Szenen zugeordnet |
| ready / ok / seconds | Bericht fertig / OK / 1,84 s |
| window (strong part hidden ≤ 420 px) | **7 Tage · **01.11. 05:47 → 08.11. 05:47 UTC (as `head.windowSpan` writes the span; one day *1 Tag · …*. *7-Tage-Fenster* overran the dock, §7) |
| slow | Planetary Computer und die NASA berechnen Bilder auf Anfrage; dieser Schritt kann einige Sekunden dauern. |
| verySlow | Die Bildarchive antworten langsam. Bleibt die Antwort aus, zeigen wir die Überflüge trotzdem aus der Bahngeometrie und sagen das dazu. |
| sharedAlt / sharedCaption | Bild von Sentinel-2C: Waterloo, mit dir geteilt. / **Mit dir geteilt** · Sentinel-2C beobachtete Waterloo · So 01.11., 11:21 |

**Report footnotes** (`engine.note`; they quote the verdict words exactly):

- archiveSlow: *Die Sentinel-2- und Landsat-Archive haben zu langsam geantwortet; die Überflüge stammen nur aus der
  Bahngeometrie.* archiveDown: *… waren nicht erreichbar; die Überflüge stammen nur aus der Bahngeometrie.*
- sentinel2Thumbnails: *Sentinel-2 über Earth Search gelistet; manche Szenen zeigen ein Vorschaubild der ganzen Szene
  statt eines Ausschnitts.* sentinel2EarthSearch: *Sentinel-2 über Earth Search gelistet (Suche von Planetary Computer
  nicht verfügbar).*
- sentinel2Down / landsatDown: *Sentinel-2-Archiv nicht erreichbar; Sentinel-2-Bilder können fehlen.* / *Landsat-Archiv
  nicht erreichbar; Landsat-Bilder können fehlen.*
- openOcean: *Dieser Ort liegt außerhalb des Aufnahmeplans von Sentinel-2 (offenes Meer).*
- elementsOld: *Die Bahnelemente sind 4 Tage alt, daher können die Überflugzeiten um einige Minuten abweichen.*
  elementsNewer: *Diese Überflüge sind aus neueren Bahnelementen rekonstruiert, daher können ihre Zeiten um einige
  Minuten abweichen.*
- gibsUnconfirmed: *NASA GIBS hat ein VIIRS-Bild nicht rechtzeitig bestätigt; VIIRS nimmt jeden Tag die ganze Erde
  auf, also zählt dieser Überflug als beobachtet.* / *… 3 VIIRS-Bilder nicht rechtzeitig bestätigt, also zählen diese
  Überflüge als beobachtet.* While the note shows, the images are still unconfirmed: never *zu spät bestätigt*, which
  says the confirmation came.
- gibsSlowAll / gibsDownAll: *NASA GIBS hat nicht rechtzeitig geantwortet, darum werden keine Bilder von
  Wettersatelliten gezeigt.* / *NASA GIBS war nicht erreichbar, darum …*
- gibsSlowSome / gibsDownSome: *NASA GIBS hat 3 von 35 Bildern von Wettersatelliten nicht rechtzeitig geliefert; diese
  Überflüge werden als vermutlich beobachtet gezeigt.* / *NASA GIBS konnte 3 von 35 … nicht liefern; …*

**Fault notice** (`app.notice`, `app.faults`): label *Störung* (the technical word for a fault, never *Fehler!*);
fallback *Etwas ist schiefgelaufen.*; buttons *Erneut versuchen* (fits half of the ~343 px card), *Neuer Versuch …*,
*Zurück*; catalog *Der Bahnkatalog konnte nicht geladen werden. Prüfe deine Verbindung und versuche es erneut.*;
compute *Beim Berechnen der Überflüge für diesen Ort ist etwas schiefgelaufen. Versuche es gleich noch einmal.* The
stats keep logging the English sentence.

**Results panel** (`results`): sheetLabel *Überflüge: Waterloo*; computingPasses *Überflüge werden berechnet*;
sections *Übersicht* / *Überflüge* / *Ständig beobachtet*; checkingArchives *Archive werden geprüft*; invite
*Etwas hat auch dich diese Woche beobachtet.* / *Deinen Ort prüfen* / *Ausblenden*; searchAnother *Anderen Ort
suchen*; allPasses *Alle Überflüge*; share *Teilen*; shareWeekLabel *Diese Woche teilen: Waterloo* (past: *Die
gezeigte Woche teilen: Waterloo*); verdictGroup *Überflüge nach Art. Jede Zahl führt zu ihrer Liste.*; verdictReadout
*12 Überflüge: Beobachtet*. Footer: replay *Abspielen*, replayLabel *Überflug abspielen*, replayTitle *Überflug auf dem
Globus abspielen*, shareLabel *Überflug teilen* / *Bild teilen*, shareButton `[strong('Überflug '), 'teilen']` /
`[strong('Bild '), 'teilen']` (narrow: *Teilen*), checkPlace `[strong('Deinen '), 'Ort prüfen']` (narrow: *Ort
prüfen*), clearest *Klarster Blick* (no strong part; the same at every width), clearestLabel *Klarsten Blick
ansehen*. Headers: windowSpan *7 Tage · 01.11. → 08.11.*; verifying *Wettermosaike werden geprüft*; cancel / newSearch /
close *Abbrechen* / *Neue Suche* / *Schließen*; searchBarLabel *Anderen Ort suchen (jetzt: Waterloo)*; change *Ändern*;
computing *Berechnung*; recent *Zuletzt*; position *Überflug 3 von 31 dieser Art*; previous / next *Vorheriger* /
*Nächster Überflug dieser Art*; shared *Mit dir geteilt · Sentinel-2C beobachtete Waterloo*; passWhen *So 01.11. · ≈
16:14 MEZ*.

**Watched continuously** (`results.geo`): none *Kein aktiver geostationärer Wettersatellit sieht diesen Ort mehr als
5° über dem Horizont.*; facts *0.0°E · 32,4° hoch · alle 10 min*; images *1.008 Bilder diese Woche* / *… in 5 Tagen*;
replay *Abspielen*, replayLabel *Meteosat-12: neuestes Bild abspielen*; frame *Suche …* / *Kein öffentliches Bild* /
*Geringe Qualität* / *Gerade kein Bild* / *Bild nicht verfügbar*; frameAlt *Meteosat-12: neuestes Infrarotbild rund um
den Ort*; infraredChip *IR*; infraredTitle *Infrarot: Wolkenobergrenzen nach Temperatur, je kälter, desto heller*.

**Timeline, replay, plan view** (`results.timeline`, `replay`, `plan`): title *Zeitleiste*; meta *7 Tage ·
America/Toronto · EST*; daylight *Tageslicht hier*; keysHint *… Mit den Pfeiltasten links und rechts gehst du durch die
Überflüge.*; now *Jetzt*; geometry *5,4° Off-Nadir · 61 km*; markMosaic *Tagesmosaik, 375 m · ●*; markRadar *Radarbild,
20 m · ◆*; markKind *offene Kamera · ◇*, *kommerziell · □*, *Radar · ▣*, *Wetter · ○*, *Raumstation · ✛*, *sonstige*.
Replay: scrubLabel *Szenenzeit im Überflug*; play / pause *Wiedergabe starten* / *Wiedergabe anhalten*; speed
*Wiedergabetempo*; inView *In Sicht 4 min 12 s*; closest *Am nächsten*; spaceKey *Leertaste*; playPause *Start /
Pause*; stepKind *Überflüge dieser Art* (after the ← → caps, which say back and forth; the row never wraps, §7). Plan: label *Draufsicht, Sentinel-2C: Bodenspur, 61 km vom
Ort bei größter Annäherung.*; northUp *Draufsicht · Norden oben*; fieldOfRegard *Schwenkbereich ±45°*; swath *Streifen
290 km*; groundTrack *Bodenspur*; closest *Abstand 61 km* (*Abstand < 1 km*).

**Product lines** (`results.product`): *Tagesmosaik · 375 m*, *Vollscheibe · 2 km*, *Infrarot · 2 km*, *Sentinel-2 L2A
· 10 m*, *Landsat C2 L2 · 30 m*, *Sentinel-1-Radar · 20 m*.

**Pass list and pass view** (`passView`):

| Key | German |
|---|---|
| empty | Kein uns bekannter Satellit überflog diesen Ort im Zeitfenster. Das ist selten; die Hinweise oben sagen, ob eine Datenquelle ausgefallen war. |
| imagedOrder | nach Nähe, dann neueste (the group head is one `nowrap` line: *Beobachtet · nach Nähe, dann neueste* 275 px at 10.5 px, 288 at 11 px, English 267 / 280; *erst aus nächster Nähe, dann die neuesten* was 413 / 433 and overran every panel) |
| sats / showAllSats / showAllRows / showMore / left / showFewer | 12 Satelliten (never *Sat*) / Alle 12 Satelliten zeigen / Alle 31 Zeilen zeigen / 12 weitere zeigen / noch 12 / Weniger zeigen |
| tag | Mosaik · Radar · Bewölkt · 81 % · Bewölkt · am Ort |
| offNadir / cloudPct | 5,4° Off-Nadir / Wolken 25 % |
| latest / closest (row prefixes, dropped on narrow lists) | Zuletzt / Am nächsten |
| cloudChip (56 px square) | Wolke |
| photosSection / planSection / geometry / replay | Bilder / Draufsicht / Geometrie / Wiedergabe |
| fullDiscNote | Ein Vollscheibenbild: alles, was der Satellit von der Erde sieht, in einem Bild, hier mit 2 km pro Pixel. Grob, aber echt, und das neueste veröffentlichte; ein solches Bild entsteht die ganze Woche über alle 10 Minuten. |
| mosaicNote | Ein Tagesmosaik: Die NASA setzt die Streifen jedes Tages zu einem Bild mit 375 m pro Pixel zusammen. Grob, aber echt, und vom Tag dieses Überflugs. |
| radarNote | Ein Radarbild, kein Foto: Sentinel-1 sendet Mikrowellen aus und zeichnet ihr Echo auf, darum stören Wolken und Dunkelheit das Radar nicht. Die Helligkeit zeigt, wie stark der Boden sie zurückwirft: Gebäude und rauer Boden sind hell, ruhiges Wasser ist dunkel. |
| noImage.openArchive | Sentinel-2C: kein Bild dieses Ortes von diesem Überflug. Draufsicht des Überflugs. |
| noImage (others) | Kein öffentliches Bild: Das Archiv dieses Radarbetreibers ist privat. · Kein öffentliches Bild: Kommerzielle Archive sind privat. · Für diesen Überflug gibt es kein Bild zu zeigen. · Das Archiv ließ sich gerade nicht durchsuchen. · Zu diesem Überflug gibt es keine Szene. (each then *Draufsicht des Überflugs.*) · notYet *Noch keine veröffentlichte Szene passt zu diesem Überflug. Szenen von Sentinel-2 und Landsat erscheinen meist innerhalb eines Tages.* · crewed *Raumstationen haben Kameras an Bord, aber ihre Fotos werden nicht nach Ort und Zeit veröffentlicht.* · unavailable *Das Bild zu diesem Überflug ist nicht verfügbar.* |
| links | Bild öffnen, um es zu speichern · Wird heruntergeladen … · Bild herunterladen · Quelle ansehen · Planetary Computer |
| spot | Pixel an deinem Ort wird gelesen … · Klare Sicht auf deinen Ort. · Dünne Zirren über deinem Ort; sie können das Bild weicher machen. · Wolken über deinem Ort. · Dein Ort lag im Wolkenschatten. |
| strip labels | Höhe · Elevation · Off-Nadir · Pixel · Kanal · Sonne · Wolken · Wolken am Ort (*Elevation*, Duden's word, is 71.4 px at 11 px, the English width; *Höhenwinkel*, 87.5 px, crosses the hairline of a ~67 px cell on a 375 px phone) |
| band / spotValue | Infrarot · Sichtbar · Farbe / Klar · Zirren · Wolken · Schatten |
| unit | km · m · km/s · hoch · Mosaik · Szene · Tag / Dämmerung / Nacht |
| geo grid | Am nächsten · UTC · Ortszeit (beside its UTC twin; *Am nächsten · Ortszeit*, 177 px, ran past a 390 px phone's edge) · Bodenabstand · Höhenwinkel bei dir · Tempo über Grund · Kurs · Sonnenhöhe · Schwenkbereich · Streifenbreite · Im Streifen · In Sicht · Zeitfenster · NORAD · Überflug · Scan hier · UTC · Ortszeit · Über dem Äquator bei · An deinem Himmel · Scanrichtung · Linientempo hier · Abdeckung · Dieser Scan · NORAD · Scan |
| values | Nord → Süd / Süd → Nord · `16:14:21 → 16:18` · Tag / Dämmerung / Nacht · Vollscheibe · alle 10 min · hoch · SSW · SSW · absteigend / aufsteigend |
| pan-sharpened | Mit dem 15-m-Kanal von Landsat geschärft (never *Landsats*) |

**Gallery** (`gallery`; filter segments ≤ 8 characters, counter ≤ 12, status ≤ 14): barLabel *Bilder*; filterLabel
*Bilder filtern*; filter *Alle* / *Detail* / *Wetter* / *Radar*; filterTitle *Alle Bilder: erst der Blick aus nächster
Nähe, dann die neuesten* · *Sentinel-2 und Landsat, 10–30 m pro Pixel* · *Tägliche Wettermosaike, 250 m pro Pixel und
gröber* · *Radarbilder von Sentinel-1, 20 m pro Pixel: durch Wolken, bei Tag und Nacht*; position *3 / 27*;
photosThisWeek / photosThatWeek *12 neuere* (the window's photos that follow the last clear look); prev / next *Voriges
Bild* / *Nächstes Bild* (*Voriges (←)* / *Nächstes (→)*); lead *Aus nächster Nähe* / *Letzter klarer Blick* /
*Bedeckt*; replay `['Abspielen']`; view *Ansehen*; radarTag *Radar*; noteMostlyCloud *Die Überflüge dieser Woche sahen
überwiegend Wolken*; noteLastClear *Hier ist der letzte klare Blick*; clouded *Bedeckt · 93 %* / *Bedeckt · Wolken an
deinem Ort* / *Wolken an deinem Ort*; status *Bewölkt · 81 %* / *Wolken am Ort* / *Klar* / *Dünne Zirren* /
*Wolkenschatten* / *Wolken 25 %* / *Tagesmosaik*; photoAlt *Bild von Sentinel-2C: Waterloo. Der Ort liegt in der
Bildmitte.*; acquiring *Erfassung …*; noImage *Kein Bild erhalten*; retry *Erneut laden*; stillRendering *Rendert noch.
Große Szenen können 10 s und länger brauchen.*; cropMissing *Das Archiv ist vielleicht ausgelastet. Das Bild selbst gibt
es trotzdem.* (three mono lines above the retry button: the title already says no crop came); expand *Bild vergrößern* (*Vergrößern (F)*); scanLine
*Zeile **0412** → 1024*; awaiting *Überflug steht bevor* / *Scan steht bevor*; north *N*.

**Globe** (`globe`): capture line *Erfasst 11:21:21 EST · 10 m* (geostationary: *Erfasst ≈ 11:21 EST*, DOM only);
callouts *Aufnahme · Sentinel-2C*, *Größte Annäherung · ISS*; closestApproachNow *Größte Annäherung*. Pin card (text
column 156 px on phones): card *Gesetzter Pin*; naming *Ort wird bestimmt …*; noName *Kein Ort in der Nähe* (120 px of
156 at 13 px); searchAria *Überflüge anzeigen: Waterloo*; searchTitle *Hier suchen (Enter)*; removeAria / removeTitle
*Pin entfernen* / *Pin entfernen (Esc)*; moveHint *Pin versetzen: Globus gedrückt halten* (283 px; it must fit a 320 px
phone); droppedAt *Pin gesetzt bei 43.4723°N 80.5449°W.*; droppedIn *Pin gesetzt: Waterloo. Drücke Enter oder den
Pfeil, um zu sehen, was darüber hinwegzog.*; droppedUnnamed *Pin gesetzt. Drücke Enter oder den Pfeil, um zu sehen,
was darüber hinwegzog.*; noGl *3D-Ansicht nicht verfügbar* / *WebGL 2 ist in diesem Browser aus*.

**Boot screen** (`boot.ts`): *Watched wird geladen …* (the brand stays: it is the only name a screen reader hears) / *Langsame Verbindung, lädt noch* / the tab title (§3.1).

## 4. Glossary

### 4.1 Terms

Gender: m, f, n. "Pl." gives the plural. **Never** marks a banned word.

| English | de | Notes |
|---|---|---|
| satellite | der Satellit, Pl. Satelliten | Weak masculine: *den/dem/des Satelliten*. Never *Sat* in the UI. *Wettersatellit*, *Radarsatellit*. |
| pass | der Überflug, Pl. Überflüge | The noun for every pass, and the count unit. **Never** *Pass* (passport, mountain pass), *Passage* or *Durchgang*. |
| to watch (product verb) | beobachten: beobachtete, hat beobachtet | **Never** *überwachen*, *ausspionieren*, *bespitzeln*, *fotografieren*, *ansehen*, *zusehen*, *bewachen*. |
| watched / likely watched / could have pointed here / passed overhead | Beobachtet / Vermutlich beobachtet / Konnte hierher blicken / Überflogen | Lanes `BILD` / `VERMUTLICH` / `MÖGLICH` / `ÜBERFLOGEN` (§3.6). |
| swept over (likely verb) | erfasste vermutlich; row summary *vermutlich erfasst* | **Never** *überstrich* (reads as "painted over"). |
| passed within view (of) | kam in Sichtweite (von); row summary *in Sichtweite* | Not *passierte in Sichtweite*. |
| passed over (overhead verb) | überflog (leads, posts, descriptions); *zog … vorüber / hinweg* (results prose) | |
| photo | das Foto, Pl. Fotos | Only for optical photos (Sentinel-2, Landsat), and in contrast to radar (*ein Radarbild, kein Foto*). |
| image | das Bild, Pl. Bilder | The general word: photos, mosaics, radar, full-disc frames. The gallery is *Bilder*. Never *Image* (a reputation). |
| public image | öffentliches Bild | *1 öffentliches Bild*, *31 öffentliche Bilder*. |
| made public / published | veröffentlicht | **Never** *publik gemacht* or *öffentlich gemacht*. |
| archive | das Archiv, Pl. Archive | *Bildarchiv*. Not *Datenbank*. |
| scene | die Szene, Pl. Szenen | The archive's unit (*Sentinel-2-Szene*). Only where the English says "scene". |
| swath | der Aufnahmestreifen; short: der Streifen | Label `STREIFENBREITE`; window `IM STREIFEN`. *Schwad* is real Earth-observation jargon, but avoid it: lay readers don't know it. |
| off-nadir | readout `OFF-NADIR`; prose *aus der Senkrechten geneigt*; About *Off-Nadir-Winkel* | **Never** *Neigung* alone (orbital inclination) or *Blickwinkel* (perspective). |
| straight down (nadir) | senkrecht nach unten; der Nadir | |
| ground track | die Bodenspur | Not *Bodentrack*. |
| orbit | die Umlaufbahn; short: die Bahn; *im Orbit* | *Bahndaten*, *Bahnkatalog*, *Bahnberechnung*. |
| orbital elements (TLE) | die Bahnelemente (TLE) | HUD `TLE-EPOCHE`. |
| altitude | die Höhe | Label `HÖHE`; prose *in 786 km Höhe*. **Never** for an angle. |
| elevation (in your sky) | der Höhenwinkel | Label `HÖHENWINKEL`; grid `HÖHENWINKEL BEI DIR`; unit *hoch*. The pass view's readout strip (a narrow cell, geostationary only) says `ELEVATION` (§3.9). Not *Erhebung*. |
| sun elevation | die Sonnenhöhe | Label `SONNENHÖHE`. |
| speed (card) / ground speed (grid) | `GESCHWINDIGKEIT` / `TEMPO ÜBER GRUND` | Prose needs no noun: *mit 7,46 km/s*. Line speed: `LINIENTEMPO HIER`. |
| ground distance / closest (card) | der Bodenabstand / `ABSTAND` | |
| closest (time) | `AM NÄCHSTEN · UTC`, `AM NÄCHSTEN · ORTSZEIT` | *am nächsten* is a superlative; it never reads as "next". **Never** *nächster …* in a label. |
| closest approach | die größte Annäherung | Globe `GRÖSSTE ANNÄHERUNG`; card note *Bodenspur bei größter Annäherung*. |
| heading | der Kurs | Label `KURS`. **Never** *Überschrift*. |
| ascending / descending | aufsteigend / absteigend | Spelled out: `SSW · ABSTEIGEND`. |
| field of regard | der Schwenkbereich | `±45°`. |
| in view | in Sicht; in Sichtweite | Window label `IN SICHT`. |
| time window | das Zeitfenster | |
| cloud cover | die Bewölkung | *Bewölkung der ganzen Szene: 25 %.* |
| clouded over (≥ 90 %) / mostly cloud (70–89 %) | bedeckt / stark bewölkt | The DWD terms. Gallery status *Bewölkt · 81 %*. |
| cloud at spot | Wolken am Ort | Values *Klar*, *Zirren*, *Wolken*, *Schatten*. |
| thin cirrus | dünne Zirren (Pl.), der Zirrus | |
| cloud shadow | der Wolkenschatten | |
| clear | klar; *klare Sicht* | |
| spot (the exact point) | der Ort; *dein Ort*; *genau über dem Ort* | **Never** *an deiner Stelle* ("if I were you"). |
| place | der Ort, Pl. Orte | *Ort suchen*. |
| pixel | das Pixel, Pl. Pixel (dat. Pixeln) | *10 m pro Pixel*. |
| resolution | die Auflösung | Say the pixel (*10 m pro Pixel*) rather than the word. |
| mosaic | das Mosaik, Pl. Mosaike | One of Duden's two plurals, chosen once. *Tagesmosaik*, *Wettermosaik*, *Mosaikpixel*. |
| radar / radar image | das Radar (always *das*) / das Radarbild | |
| geostationary | geostationär | |
| full disc | die Vollscheibe; das Vollscheibenbild | The German meteorological term. Readout `VOLLSCHEIBE`. Never *ganze Scheibe*. |
| scan / scan line / scan direction | der Scan / die Scanlinie / die Scanrichtung | Grid `SCAN HIER · UTC`. |
| infrared / visible | das Infrarot (*im Infrarot*) / sichtbar | |
| band (spectral) | der Kanal | Label `KANAL`. |
| true colour | Echtfarben- | *Echtfarbenmosaik*. Never *wahre Farbe*. |
| time-lapse | der Zeitraffer | |
| frame (time-lapse) | das Bild | *Bild 3 von 11*. Not *Frame*. |
| clear look | der klare Blick, Pl. klare Blicke | |
| closest look | Aus nächster Nähe; in sentences *das Bild aus nächster Nähe* | **Never** *Nächster Blick* ("next look"). |
| last clear look | Letzter klarer Blick | |
| replay | abspielen (button *Abspielen*); die Wiedergabe (section `02 / WIEDERGABE`) | **Never** *wiederholen* for replay. |
| plan view | die Draufsicht | |
| catalog | der Katalog; der Bahnkatalog | |
| object (catalog count) | das Objekt, Pl. Objekte | |
| sub-solar point | der Subsolarpunkt | |
| daylight / twilight / night | Tag / Dämmerung / Nacht; *bei Tageslicht*, *im Dunkeln* | |
| steerable / fixed camera | die schwenkbare / die fest ausgerichtete Kamera | |
| camera / imager / instrument | die Kamera / der Sensor / das Instrument | Nouns to use instead of pronouns after [SAT]. |
| operator | der Betreiber | An organisation. |
| commercial | kommerziell | For cameras and satellites. **Never** *privat* for a camera. An archive may be *privat*. |
| crewed / station | die Raumstation; *mit Menschen an Bord* | **Never** *Besatzung* (also military occupation). Avoid *bemannt*. |
| imaging satellite | der Erdbeobachtungssatellit | *mit offenen Daten* for "open". |
| military / spy satellites | Militär- und Spionagesatelliten | About's factual line only. |
| fault | die Störung | The notice's label. |
| share | teilen | **Never** *freigeben* (permissions). |
| download / save / copy | herunterladen / speichern / kopieren | |
| post (share text) | der Text | The label above the post; *Beitrag* doesn't fit the 48 px column. |
| card (share card) | die Karte; *die Karte zum Teilen* | |
| link | der Link | *Kurzlink*, *Direkter Link*. |
| use my location | Meinen Standort verwenden; phone *Standort*; ≤ 400 px chip *Bei mir*; locating *Ortung …* | Never *Orten* (also reads as a plural of *Ort*). |
| drop a pin | Pin setzen | |
| surprise me | Überrasch mich | |
| how this works | Funktionsweise (HUD); *Wie das funktioniert* (About title) | |
| this week / last 7 days | diese Woche / in den letzten 7 Tagen; kicker `LETZTE 7 TAGE` | Follow the English wording (§3.3). |
| local time | die Ortszeit | **Never** *lokale Zeit*. |
| ago / just now / in (future) | vor (+ dat.) / gerade eben / in (+ dat.) | *vor 12 min*, *vor 2 Tagen*, *in 3 h*. |
| minutes / hours / seconds | min / h / s in readouts; *Minuten*, *Stunden*, *Sekunden* spoken | |
| days | Tag, Pl. Tage (dat. Tagen) | Always spelled out. |
| at sea | auf See | *UTC−9 · auf See*. |
| unknown value | — | The em dash as a placeholder glyph only. |
| Space / Enter / Esc | Leertaste / Enter / Esc | |
| close / cancel / dismiss / back | Schließen / Abbrechen / Ausblenden / Zurück | |
| try again | Erneut versuchen; share sheet *Noch mal* | |
| something went wrong | Etwas ist schiefgelaufen. | |
| made by / built by | Gemacht von / Von @handle | *Gebaut von* is a calque. |

### 4.2 Compass

All eight compass nouns are masculine, so *im* works with every one of them.

| Degrees | `compass16` readout | Noun (*Richtung …*, *im …*) | Adverb (*… km westlich des Ortes*, *… km westlich am Ort vorbei*) |
|---|---|---|---|
| 0 | N | Norden | nördlich |
| 22.5 | NNO | | |
| 45 | NO | Nordosten | nordöstlich |
| 67.5 | ONO | | |
| 90 | O | Osten | östlich |
| 112.5 | OSO | | |
| 135 | SO | Südosten | südöstlich |
| 157.5 | SSO | | |
| 180 | S | Süden | südlich |
| 202.5 | SSW | | |
| 225 | SW | Südwesten | südwestlich |
| 247.5 | WSW | | |
| 270 | W | Westen | westlich |
| 292.5 | WNW | | |
| 315 | NW | Nordwesten | nordwestlich |
| 337.5 | NNW | | |

- The pass messages take an 8-point id and need three German tables: the noun after *Richtung* (`heading`), the
  adverb (`dir`, `offset.dir`) and the noun after *im* (`toward`).
- The German letters are those of German weather maps and wind reports. They apply only to `pass.compass16`.
  Coordinates (`16.2°S 063.0°E`, `0.2°W`) arrive formatted in international notation and keep E and W.
- *SO* is both Südost and Sonntag. A weekday never stands alone where a heading can appear: rows and the HUD write
  `SO 01.11.`, and a heading always follows its degrees (`135° SO · ABSTEIGEND`).

### 4.3 Curated places (`places` namespace)

The landing's three chips and the "Überrasch mich" pool are copy. German uses the established German name where one
exists and keeps the name where German has none. Chip, label and sublabel change together, so the chip and the
headline always match. Chips stay under ~14 characters. Countries in sublabels as §6.7 names them (*USA*). Usage stats,
links and shares keep the English label, so counts never split by language.

The last column is the article table (§5.1): the accusative article and the *von* form, for the headline's object slot.
"—" means no article. A plural place takes the genitive *der* after *in Sichtweite* (*in Sichtweite der Niagarafälle*):
*von den* before an uninflected plural label is ungrammatical, so api/_lib/i18n/card/deNames.ts writes *der*.

| id | label (chip) | sublabel | article / von |
|---|---|---|---|
| area51 | Area 51 (chip *Area 51*) | Groom Lake, Nevada, USA | die / von der |
| centralPark | Central Park (chip *Central Park*) | New York, USA | den / vom |
| giza | Pyramiden von Gizeh (chip *Gizeh*) | Gizeh, Ägypten | die / der |
| uluru | Uluru | Northern Territory, Australien | den / vom |
| palmJumeirah | Palm Jumeirah | Dubai, Vereinigte Arabische Emirate | — |
| worldIslands | Inselgruppe The World | Dubai, Vereinigte Arabische Emirate | die / von der |
| grandCanyon | Grand Canyon | Arizona, USA | den / vom |
| meteorCrater | Barringer-Krater | Arizona, USA | den / vom |
| lowerManhattan | Lower Manhattan | New York, USA | — |
| lasVegasStrip | Las Vegas Strip | Nevada, USA | den / vom |
| hooverDam | Hoover-Damm und Lake Mead | Nevada und Arizona, USA | den / vom |
| goldenGate | Golden Gate | San Francisco, USA | — (a town in Florida, see below) |
| kennedySpaceCenter | Kennedy Space Center | Florida, USA | das / vom |
| washingtonDc | Washington, D.C. | National Mall, USA | — |
| mountStHelens | Mount St. Helens | Bundesstaat Washington, USA | den / vom |
| niagaraFalls | Niagarafälle | Ontario, Kanada | die / der |
| panamaCanal | Panamakanal | Gatún-Schleusen, Panama | den / vom |
| rioDeJaneiro | Rio de Janeiro | Zuckerhut und Copacabana, Brasilien | — |
| paris | Paris | Île-de-France, Frankreich | — |
| venice | Venedig | Venetien, Italien | — |
| vesuvius | Vesuv | Neapel, Italien | den / vom |
| istanbul | Istanbul | Bosporus, Türkei | — |
| chernobyl | Tschernobyl | Oblast Kyjiw, Ukraine | — |
| tableMountain | Tafelberg | Kapstadt, Südafrika | den / vom |
| kilimanjaro | Kilimandscharo | Kilimandscharo, Tansania | den / vom |
| everest | Mount Everest | Nepal und China | den / vom |
| angkorWat | Angkor Wat | Siem Reap, Kambodscha | — |
| singapore | Singapur | Marina Bay, Singapur | — |
| hongKong | Hongkong | Victoria Harbour, Hongkong | — |
| tokyo | Tokio | Tokio, Japan | — |
| fuji | Fuji | Shizuoka, Japan | — (cities in Shizuoka and Sichuan, see below) |
| sydneyHarbour | Hafen von Sydney | Sydney, Australien | den / vom |
| richat | Richat-Struktur | Sahara, Mauretanien | die / von der |
| greatBlueHole | Great Blue Hole | Lighthouse Reef, Belize | das / vom |
| boraBora | Bora Bora | Gesellschaftsinseln, Französisch-Polynesien | — |
| hardyReef | Hardy Reef | Great Barrier Reef, Australien | das / vom |
| male | Malé | Nord-Malé-Atoll, Malediven | — |
| deadSea | Salzbecken am Toten Meer | Südbecken, Israel und Jordanien | die / der |
| binghamCanyon | Bingham-Canyon-Mine | Utah, USA | die / von der |
| mountWhaleback | Mount-Whaleback-Mine | Pilbara, Australien | die / von der |
| etna | Ätna | Sizilien, Italien | den / vom |
| santorini | Santorin | Kykladen, Griechenland | — |
| teide | Teide | Teneriffa, Spanien | den / vom |
| kilauea | Kīlauea | Hawaii, USA | — (a town on Kauai, see below) |
| craterLake | Crater Lake | Oregon, USA | den / vom |
| glenCanyonDam | Glen-Canyon-Talsperre | Page, Arizona, USA | die / von der |
| gardenCity | Bewässerungskreise von Garden City | Kansas, USA | die / der |
| almeria | Gewächshäuser von Almería | Andalusien, Spanien | die / der |
| gibraltar | Gibraltar | Straße von Gibraltar | — |
| suezCanal | Suezkanal | Ismailia, Ägypten | den / vom |
| aswanDam | Assuan-Staudamm | Nassersee, Ägypten | den / vom |
| wadiRum | Wadi Rum | Akaba, Jordanien | das / vom |
| sossusvlei | Sossusvlei | Namib, Namibia | das / vom |
| victoriaFalls | Victoriafälle | Sambia und Simbabwe | die / der |
| threeGorges | Drei-Schluchten-Talsperre | Hubei, China | die / von der |
| shanghai | Shanghai | Huangpu-Fluss, China | — |
| itaipu | Itaipú-Talsperre | Brasilien und Paraguay | die / von der |

**Labels a town shares.** The article table matches the label alone, so it cannot tell a chip from a search result
with the same name. A curated label that a town in the offline list also carries, far from the curated place, gets no
article and takes the residue (§5.1): *Golden Gate* (a town of about 25,000 in Florida), *Fuji* (cities in Shizuoka
and Sichuan), *Kīlauea* (a town on Kauai). With the article, *… beobachteten 256 Satelliten das Golden Gate.* would
name the strait for a search of the Florida town. *Central Park* (a town in Washington) and *Grand Canyon* (the
village on the rim) keep theirs: the name reads as the park or the canyon with or without it. Check every new entry
against `public/places/<version>/s/` first. A flag for "this place came from the curated pool" would remove the
residue; it needs the shared message signature, so it is the owner's call.

*Garden City*'s circles are centre-pivot irrigation: **never** *Kornkreise* (the mystery patterns). *Kīlauea* keeps its
macron as English does. *Mount St. Helens* gets *Bundesstaat* so the state is not read as the city. *Tschernobyl* is the
established German name of the site, used even by outlets that write *Kyjiw*.

## 5. Grammar strategies for runtime slots

German shows case, gender and number on articles, adjectives and some nouns. Code can supply none of these for a place
or a satellite, so every frame keeps the inserted name **bare**: no case ending and no pronoun that points back to it.

### 5.1 [PLACE]: the gazetteer's name, never inflected

**The nominative trap.** German names, *was*, *etwas*, *das* and *es* look the same in the nominative and the
accusative. When a clause has one of them and a bare name, readers take the name as the subject: *Was hat Waterloo
diese Woche beobachtet?* means "What did Waterloo watch this week?". So:

- **[PLACE] may be an object only if the subject is unmistakably nominative:** a plural verb with a plural count
  (*beobachteten 256 Satelliten Waterloo*), *1 Satellit* (its accusative would be *1 Satelliten*), *kein … Satellit*,
  *welche Satelliten*, a plural relative pronoun with a plural verb (*die Waterloo … überflogen haben*), or a [SAT]
  name in first position (*Sentinel-2C beobachtete Waterloo*).
- **Never** use *was*, *etwas*, *das* or *es* as the subject of a clause with a bare [PLACE].

**Allowed positions:**
1. The accusative object of a lead verb, as above: headlines, card leads, posts, page titles and descriptions.
2. After *von* in the could lead (*kam in Sichtweite von Waterloo*). This is a preposition slot: it has the same
   residue as the object slot (names that need an article), no more.
3. After a colon in labels and spoken names: *Diese Woche teilen: Waterloo*, *Zeitraffer: Waterloo*, *Überflüge
   anzeigen: Waterloo*, *Pin gesetzt: Waterloo*, *Bild von Sentinel-2C: Waterloo*.
4. As a whole title: *Waterloo, Jahr für Jahr*.

**Body prose does not repeat the name.** The headline above already shows it, so pass sentences, spot lines, notes and
footnotes say *den Ort*, *diesen Ort* or *deinen Ort*, our own noun, whose case we set (*des Ortes*, *dem Ort*).

**Never:** *in*, *über*, *bei*, *nach* + [PLACE] (*über Schweiz*); a genitive -s (*Waterloos*); an article written
before the slot for gazetteer labels; an adjective before it; a pronoun after it.

**Curated places take their article from one table.** The German catalog keeps a plain module (for example
`src/i18n/de/plain/articles.ts`) that maps each German curated label that needs an article (and the identical English
label, for links and shares made by its English name, such as *Central Park*) to its accusative article and its *von*
form (§4.3). The headline frames look the place up; on a match they put the article before the name as plain text, and
only the name goes in the serif, the way English puts "the " before seas: *In den letzten 7 Tagen beobachteten 256
Satelliten den *Central Park*.* · *… kam in Sichtweite vom *Central Park*.* A test checks that every key of the table
is a label in `de/places.ts`. Nothing outside the German catalog changes, and it costs no request. Gazetteer labels are
never looked up or guessed: they stay bare. Because the lookup sees only the label, a curated label that a town in the
offline list also carries (*Golden Gate*, *Fuji*, *Kīlauea*) is left out of the table (§4.3).

**Known residue, accepted:** a gazetteer label that German would use with an article (*Schweiz*, *Türkei*, *Pazifik*)
reads without it: *… beobachteten 256 Satelliten Schweiz.* A German reader sees this as an error, not a convention. It
is accepted because it is rare: towns and cities, which most searches are, take no article. **Never let code add an
article to a gazetteer label**, and do not port English `placeInProse`.

**Gazetteer labels are usually English.** The geocoders are asked for English names (`lang=en` / `language=en` in
`geocode.ts`) and the offline list is English, so a visitor who types *München* gets *Munich*, *Wien* gives *Vienna*,
and the where line can read *Bavaria, Deutschland*. This is expected, and it is never fixed in a catalog string. The
label may also be in a local script (*Москва*). Never translate it and never fix its spelling. (A German display-name
table is an open question for the owner; see the summary.)

### 5.2 [SAT]: gender unknown

- Satellite names stand bare as the subject, with no article: *Sentinel-2C beobachtete …*, *Landsat 9 überflog …*.
  German news uses mission names this way.
- **Crewed stations** take the classifier in sentences, because every German writes *die ISS*: *Die Raumstation ISS
  zog um 21:14 EST in 418 km Höhe vorüber, …* and *Die Raumstation ISS überflog Waterloo am …*. The messages
  `pass.overhead` and `share.post.overhead` get a `crewed` flag (from `meta.category`, at no cost). Headline leads stay
  bare (*ISS überflog Waterloo.*), as headlines drop articles.
- **Classifier apposition** (*der Satellit Sentinel-2C*) is allowed where a sentence must refer back with a pronoun and
  no instrument noun fits; the pronoun then follows *der Satellit* (*er*). Prefer the instrument nouns.
- Verbs agree only in number, and [SAT] is singular: *beobachtete*, *zog*, *kam*, *überflog*.
- **No pronoun after a bare [SAT].** *Er/sie/es* and *sein/ihr* are wrong for some name. Use a noun we control: *Die
  Kamera blickte …*, *Das Radar an Bord …*, *Der VIIRS-Sensor an Bord …*, *Der Betreiber …*, *Der Satellit steht …*
  (geostationary), *die Station … sie* (crewed).
- Possessives: *Its swath* becomes *der Aufnahmestreifen*, *Its operator* becomes *Der Betreiber*, *Its radar*
  becomes *Das Radar an Bord*.
- After *von*: *stammt von Sentinel-2B* is safe for the satellites that take the pictures shown (none of them takes an
  article). In labels, a colon frame: *Sentinel-2C: kein Bild dieses Ortes …*, *Draufsicht, Sentinel-2C: …*.
- **A nameless satellite** (`sat` undefined) is written by each sentence in the case it needs: *Ein Satellit
  beobachtete* (subject), *von einem Satelliten* (dative). `card.aSatellite` (*Ein Satellit*) is only a label on its
  own (chips, the plan callout); no sentence inserts it.
- Agencies written by us take their article: *der NASA*, *die ESA*, *die EUMETSAT*. Those are authored words, not slots.

### 5.3 [NUM]: plural categories

German has two CLDR categories: **one** (exactly the integer 1) and **other** (0, 2 and up, and every decimal, so
*1,5* is `other`). Zero always gets its own message with *kein/keine*: never *0 Bilder*. Code passes the category and
the catalog holds both forms as whole phrases. Numbers stay digits in mono spans; the only word numbers are *einmal* and
*kein/keine*.

| Noun | `one` | `other` | Zero | Case notes |
|---|---|---|---|---|
| Satellit (m) | 1 Satellit | 256 Satelliten | kein Satellit | Accusative and dative singular *1 Satelliten*. Every plural form is *Satelliten*. |
| Bild (n) | 1 Bild | 31 Bilder | keine Bilder | Dative plural *Bildern*. |
| öffentliches Bild | 1 öffentliches Bild | 31 öffentliche Bilder | keine öffentlichen Bilder | Strong adjective endings after numbers. |
| detailliertes Bild, tägliches Wettermosaik, Vollscheibenbild | 1 detailliertes Bild … | 12 detaillierte Bilder, 3 tägliche Wettermosaike, 1.008 Vollscheibenbilder | — | |
| Mosaik (n) | 1 Mosaik | 3 Mosaike | — | |
| Überflug (m) | 1 Überflug | 31 Überflüge | kein Überflug | Dative plural *Überflügen* (*mit 412 Überflügen*). |
| Szene, Bahn, Objekt, Zeile | 1 Szene, 1 Bahn, 1 Objekt, 1 Zeile | 31 Szenen, 412 Bahnen, 16.893 Objekte, 31 Zeilen | — | |
| Treffer (m) | 1 Treffer | 5 Treffer | kein Treffer | |
| klarer Blick (m) | 1 klarer Blick | 4 klare Blicke | kein klarer Blick | |
| weiterer Radarsatellit | 1 weiterer Radarsatellit | 7 weitere Radarsatelliten | — | Nominative (the list is the subject). |
| Tag (m) | 1 Tag / vor 1 Tag | 7 Tage / vor 2 Tagen / in den letzten 7 Tagen | — | Prepositions take the dative *Tagen*. |
| Minute, Stunde | 1 Minute / 1 Stunde | 12 Minuten / 41 Stunden | — | Spoken forms only; readouts use *min* and *h*. |
| -mal | einmal | 42-mal; 1.204-mal | — | The mono number span is followed by *-mal* with no space. |

Inflected forms such as *1 Satelliten* are the reason a German message is a whole phrase per category. Never assemble
it as number + noun + plural suffix.

### 5.4 Lists of names

- Join with `Intl.ListFormat('de', { type: 'conjunction' })` (`fmt('de').list`): *Umbra, Capella und 7 weitere
  Radarsatelliten*. German puts no comma before *und* in a list.
- The tail is a catalog phrase with plural forms: *1 weiterer Radarsatellit* / *7 weitere Radarsatelliten*.
- **The verb follows the whole list.** One name alone takes the singular (*Umbra kam 3-mal in Reichweite*); two names,
  or names plus a tail, take the plural (*Umbra und Capella kamen …*). The message counts the list's items itself.
- Never *sowie* or *bzw.* in lists.

### 5.5 Dates and times inside sentences

- Date: *am* + the date: *am So., 1. Nov.*, *am Sonntag, 1. November*. Weekday and date are one unit, closed by a
  comma when the sentence continues: *am So., 1. Nov., um 11:21 Uhr Ortszeit*. Always set both commas.
- Clock time: *um* + time. With a zone abbreviation there is no *Uhr*: *um 16:14:21 UTC*, *um 07:49 MEZ*. With the
  word *Ortszeit*: *um 11:21 Uhr Ortszeit*.
- Approximate: *gegen 07:49 MEZ* (English "about"). In readouts: `≈ 07:49` (DOM only, §6.7).
- Ranges in prose: *zwischen 10:41 und 10:48 UTC*; *vom 29.10. bis 05.11.*. In readouts: `10:41:07 → 10:48:12`.
- Order in the clause: time before place (*um 16:14:21 UTC in 786 km Höhe*), the German default.
- Dates come from `Intl.DateTimeFormat('de')` through `api/_lib/i18n/dates.ts`, never from English parts rearranged
  and never from a hand-made month table.

## 6. Typography and formatting

### 6.1 Punctuation and spaces

- **Quotation marks:** „…“ (U+201E … U+201C); inside a quote, ‚…‘ (U+201A … U+2018). Never "…", never »…« or «…».
  About: *nennen wir das „Konnte hierher blicken“*. Swiss readers know „…“.
- **Apostrophe:** ’ (U+2019) only. Never ' (U+0027). Never an apostrophe for a genitive (*NASA’s* → *der NASA*) or a
  plural.
- **No space before** `:` `;` `!` `?`. `%` takes a no-break space after the number (*25 %*). After a colon,
  capitalise when a complete sentence follows (*Direkter Link: Der Kurzlink …*; *Kein öffentliches Bild: Das Archiv
  …*); after a fragment, keep the word's normal case (*Stark bewölkt: 81 % der Szene.*).
- **Ellipsis:** … (U+2026). After a complete word it takes a no-break space (*Wird geladen …*, *Ortung …*). It follows
  a cut-off word directly (*Westjordanl…*).
- **Dashes:** no dashes in prose; use a colon, a semicolon or a full stop. The en dash (U+2013) without spaces is for
  ranges in labels and readouts: *10–30 m*, *2015–2026*. In running text write *10 bis 30 m*. The em dash appears only
  as the unknown-value placeholder.
- **The middle dot ·** separates readout parts, as in English: `STARK BEWÖLKT · 81 %`.
- **Hyphenated compounds** (Duden's *Durchkopplung*): when a compound contains an acronym, a name with a digit or a
  number with a unit, hyphenate every part: *VIIRS-Sensor*, *Sentinel-2-Szene*, *Landsat-9-Bild*, *TLE-Epoche*,
  *7-Tage-Fenster*, *15-m-Kanal*. A shared tail takes the *Ergänzungsstrich*: *Sentinel-2- und Landsat-Archive*.
- **A number compound inside a plain message** (a string code can't wrap in a span: `timelapse.note`, `about.privacy`)
  would break at its hyphen (*10-* / *km-Quadrat*). Rephrase it: *Quadrat von 10 km Seitenlänge*, *auf etwa 10 km
  genau*.

### 6.2 Numbers and coordinates

- `fmt('de')` (Intl `de`): decimal comma, a dot to group thousands from four digits: *1.715*, *12.847*, *35.786 km*,
  *7,46 km/s*. Never group years (*2015*), NORAD IDs (*25544*), pass IDs, line counters (`ZEILE 0000 → 1024`) or ISO
  stamps.
- Fixed decimals through `f.dec`: *5,4°*, *7,46*, *1,84 s*, *0,31 m*. Never `toFixed` in German messages.
- Percent: *25 %* with U+00A0, as Intl `de` writes it. As an adjective, *25-prozentig* (never *25%ig*). In German only
  `°`, `′` and `″` attach without a space; `%` does not.
- Degrees for angles are tight: *5,4°*, *±45°*.
- **Coordinates** arrive formatted in international notation (`16.2°S`, `063.0°E`, `0.2°W`, `43.4723°N 80.5449°W`) and
  stay as they come, in readouts and in prose (*über dem Äquator bei 0.2°W*). Never reformat them with a comma or O.
- Signs: minus is − (U+2212) in readouts, as in English (`UTC−9`).
- **Input syntax is not prose.** The search fallback shows coordinates the way the parser reads them, with decimal
  points: *Koordinaten wie 43.47, −80.54 funktionieren weiterhin.*

### 6.3 Dates, times and relative time

Each `time` key serves every screen that calls it, so the form is chosen per key, not per use:

| Key | German | How |
|---|---|---|
| weekdayShort | So | Intl `{ weekday: 'short' }` (standalone: no period) |
| dayCompact (≤ 5 characters) | So 1 | built from Intl parts |
| day (pass rows, photo captions, HUD scene clock) | So 01.11. | Intl `{ weekday: 'short', day: '2-digit', month: '2-digit' }` = "So., 01.11.", then drop ".," |
| dayMonth (also card `lookDay`, time-lapse list) | 01.11. | Intl 2-digit parts |
| dayRange | 01.11. → 08.11. | built from parts (never `formatRange`) |
| daySpoken | Sonntag, 1. November | Intl long |
| stamp | So 01.11. · 11:21 MEZ | `day`, then time and zone |
| relative | gerade eben · vor 12 min · vor 5 h · vor 2 Tagen · in 3 h | **by hand** from `relativeParts` (Intl short gives *vor 12 Min.*, *vor 5 Std.*: dotted, and not SI) |
| relativeSpoken | vor 12 Minuten · vor 41 Stunden · in 3 Stunden | Intl long |
| durations | 38 s · 4 min 12 s · 1 h 02 min | unchanged SI |
| atSea | UTC−9 · auf See | |
| post `when` (share.ts) | am So., 1. Nov., um 11:21 Uhr Ortszeit | Intl `{ weekday: 'short', day: 'numeric', month: 'short' }` |
| card day with year (description) | So., 1. Nov. 2026 | Intl short with year |
| card `stamp` / `weekTo` | So 01.11.2026 · 11:21 MEZ / 7 Tage bis So 08.11.2026 | numeric, with the year as in English |
| landing `windowRange` | 01.11. → 08.11.2026 UTC | built from parts at time zone UTC |
| time-lapse `date` / `frameSpoken` | 22.10.2015 / 22. Oktober 2015 | numeric / Intl long |
| instrument UTC stamps (HUD clock, TLE epoch, fetched) | `2026-11-08 03:31:07 UTC`, `2026-11-08 03:15Z` | ISO 8601, unchanged |

- Numeric dates in mono avoid German's uneven month abbreviations (*März*, *Juni*, *Juli* have none; *Sept.* has
  five letters) and line up in tabular figures. Leading zeros follow DIN 5008.
- Months follow `de`: *Januar*, also for Austria (*Jänner* needs a `de-AT` tag, which the catalog does not use).
- 24-hour clock with two-digit hours. Hours up to 48 in `relative`, as in English.
- **Zone abbreviations** arrive formatted from code. The German catalog passes every `zone` slot through one helper
  that maps CET → **MEZ**, CEST → **MESZ**, WET → **WEZ**, WEST → **WESZ**, EET → **OEZ**, EEST → **OESZ** and leaves
  everything else (*EST*, *JST*, *GMT*, *BST*, *AEDT*, *UTC+9*). The same helper serves the card and the app, so the
  two stay equal. A test checks that every German message with a `zone` parameter calls it.

### 6.4 Capitalisation

- **Sentence case** for everything: the first word and every noun capitalised, nothing else: *Bild herunterladen*,
  *Aus nächster Nähe*, *Letzter klarer Blick*. Never English title case.
- Nouns are capitalised in labels that CSS will uppercase too, and in aria labels.
- *du, dich, dir, dein* are lowercase. Compass adjectives are lowercase (*westlich*); the nouns are capitalised
  (*Richtung Westen*).
- **Code never changes the case of a German string.** Where English lowercases a title mid-sentence (the timeline's
  spoken summary, the lightbox's spoken lead), the German catalog provides that sentence as its own message.

### 6.5 Mono caps labels and units

- CSS uppercases them. The catalog holds sentence case: *Höhe* → `HÖHE`, *Letzte 7 Tage* → `LETZTE 7 TAGE`.
- Umlauts stay umlauts: `HÖHE`, `ÜBERFLÜGE`. Never `HOEHE`.
- **ß.** CSS `text-transform: uppercase`, the card's renderers and `toLocaleUpperCase('de')` in the video turn ß into
  SS: *Schließen* → `SCHLIESSEN`, *Größte Annäherung* → `GRÖSSTE ANNÄHERUNG`. This is correct. Never type ẞ (it would
  cost a font download, §6.7) and never type `SS` by hand (the same string is read in sentence case by screen readers).
- **Units** are written lowercase in the catalog (*km*, *m*, *km/s*, *min*, *h*, *s*) and follow the design: a caps row
  keeps the unit symbols lowercase, as English does (`HÖHE 786 km`, `7,46 km/s`; DESIGN §3, owner 2026-11-19). German
  makes no exception of its own. Prose is never uppercased.
- Labels are nouns or noun phrases without articles: `HÖHE`, `KURS`, `STREIFENBREITE`, `01 / GEOMETRIE`,
  `02 / WIEDERGABE`.

### 6.6 Line breaking and abbreviations

- Display headlines break only where the catalog breaks them. Never hyphenate a display line.
- **No display line authored by us starts with a capital umlaut** (*Ü*, *Ö*, *Ä*): the display line mask clips their
  dots during the wipe (leading 0.92, `.hl` pads 0.05 em; *Ü* reaches 0.93 em above the baseline). None of the current
  lines does. Place names (*Örebro*, *Österreich*) can; see the open question in the summary.
- Body prose (About, footnotes, the time-lapse note) may use CSS `hyphens: auto` under `lang="de"`. Mono labels,
  names and numbers never hyphenate. If a label doesn't fit, rewrite it (§7).
- No break between a number and its unit (U+00A0), or before `…` (U+00A0).
- Satellite names with a hyphen (*Sentinel-2C*) go in a `white-space: nowrap` span in code, never U+2011.
- **No abbreviations in prose:** never *z. B.*, *bzw.*, *ca.*, *ggf.*, *u. a.*, *usw.*, *Nr.* Write *etwa* or
  rewrite. `~10 km` in English prose becomes *etwa 10 km*.
- Allowed abbreviations: SI units, compass letters, agency and sensor acronyms, *So.*/*Nov.* inside Intl dates in
  prose, and two-letter weekdays without a period in mono.

### 6.7 Cost and speed guardrails (for whoever wires the German catalog)

The owner's condition is that German costs nothing more to serve and stays as fast. These choices keep it so:

1. **No extra font files.** Every German letter and mark in this guide (ä ö ü ß Ä Ö Ü „ “ ‚ ‘ ’ – … · ° − and U+00A0)
   is in the `latin` subset English already loads. The card's five `*-latin` cuts contain them all (checked against
   their cmaps); the four `*-latin-ext` cuts lack „ “ ’ – … · −, which is fine, because the latin cuts carry them. The
   app downloads nothing new.
2. **Characters that cost something are never in German strings:**
   - ẞ (U+1E9E): only in the latin-ext range, so it would trigger a second font download on every family.
   - U+202F, U+2009, U+2011, → (U+2192) and ≈ (U+2248): in no card font. On a card, satori would send them to
     `loadFallbackAsset`, which means Google Fonts requests and seconds of delay on a cold Worker. → and ≈ are fine in
     DOM readouts (timeline, headers, pass view, globe) and never go into card text.
   - U+00AD (soft hyphen): missing from the display, sans and serif card cuts. Never in card text.
3. **Intl `de` does write U+2009.** `formatRange` across months gives *29. Okt. – 5. Nov.* with a thin space on both
   sides of the dash. The German formatters never use `formatRange` for anything shown: they build ranges from parts
   (§6.3). If one ever does, it replaces U+2009 with U+00A0, and its output never goes into card text. Keep the `intl`
   tag at `de`: `de-CH` would group with `’` and `de-AT` with U+00A0, which disagree with this guide.
4. **One catalog, one bundle.** No `de-AT`/`de-CH` catalogs, no regional variants, no duplicated long and short copies
   beyond the short forms the keys define. German runs about 25 % longer, a couple of kB in a bundle loaded in parallel
   with the app.
5. **No runtime translation and no libraries.** Dates, numbers, plurals, lists and country names come from the
   built-in Intl APIs. The article table (§5.1) and the zone helper (§6.3) are a few hundred bytes in the German chunk.
   The `crewed` flag (§5.2) is a boolean code already has. Nothing calls a service.
6. **Analytics stay English.** A fault notice's `msg` is logged as the English sentence; enum props (search source,
   action, `from`) keep their English values. A German label sent as a prop would be stored as null by the SQL
   allow-list and would split one fault into two languages.
7. **Country names:** `Intl.DisplayNames(['de'], { type: 'region' })`, long style, except three regions that take the
   short style: **US** (*USA*: what every German writes; *Vereinigte Staaten* is stiff in a where line), **HK**
   (*Hongkong*) and **MO** (*Macau*). Everything else long: GB stays *Vereinigtes Königreich* (short is *UK*), PS stays
   *Palästinensische Autonomiegebiete* (short is *Palästina*, politically loaded).
8. **X post length.** `xLength` counts every German letter and „ “ as 1, so German costs no extra weight, but its text
   runs longer. Both hooks are under 45 characters, so the invitation is dropped only for long place names.

## 7. Length discipline

German UI text typically runs 20–35 % longer than English, and a single label can double. Measured here: the hero's
widest card line is +14 % (464 against 408 px), the sub +20 %, the results headline about +25 %.

**How widths are measured.** Mono labels: the Martian Mono cut the card uses (`api/_fonts/mono-latin.ttf`, the 87.5 %
width), advances summed for the text uppercased with `toLocaleUpperCase('de')`, plus 0.08 em tracking between
characters: about 7.67 px a character at 10.5 px and 8.03 px at 11 px (the phone's `--fs-label`). Card lines: satori
0.33.5 with `api/_fonts/*` at the card's own sizes and tracking. Room comes from the CSS of the screen, not from the
character count. A reviewer who changes a constrained string measures it the same way.

**Strategies:**
1. Labels are nouns. Drop articles and verbs: `HÖHE`, not `DIE HÖHE DES SATELLITEN`.
2. Choose the short established word: *Höhe* (not *Bahnhöhe*), *Kurs* (not *Flugrichtung*), *Bild* (not *Aufnahme*).
   Where the room exists, use the full standard word (*Geschwindigkeit* on the card).
3. SI symbols (*min*, *h*, *km*), never words, in readouts.
4. Buttons take the infinitive with the object first: *Bild herunterladen*. Where the context already names the object,
   use the verb alone (*Kopieren* beside the LINK field, *Speichern* under the card).
5. A long compound in a narrow mono cell splits into words (*Tempo über Grund*, not *Grundgeschwindigkeit*); the test
   is the measured width, not a character cap.
6. **No dotted abbreviations in mono caps** (`BODENGESCHW.`, `MIN.`). Never truncate a label with `…`. Rewrite it.
7. Where English swaps in a shorter form on phones, German defines its own short form. It is never a truncation of the
   long one.

**Budgets** (measured; English in brackets):

| Where | Room | German |
|---|---|---|
| HUD top left (375 px phone, the corners nearly touch) | the English width, 112 px at 11 px | *Funktionsweise* 112 px (112) |
| HUD top right | about the English width, 144 px | *Sonne 16.2°S 063.0°E* 160 px (144) |
| Share sheet, phone: three buttons | about 89 px each at 11 px (≤ 11 characters) | *Kopieren* 63, *Kopiert* 55, *Auf X* 39, *Speichern* 71, *Noch mal* 63 (*Copy link* 71) |
| Share sheet, link and post label column | 48 px | *Link* 31, *Text* 31 (*Post* 31) |
| Time-lapse video button (one width through all labels) | 132 px | *Video* 39, *Rendern 42 %* 95, *Fehlgeschlagen* 112, *Speichern* 71 (*Rendering 42%* 104) |
| Summary verdict tiles (2 × 2) | laptops about 182 px at 10.5 px, `nowrap`; phones and 761–1100 px wrap to two lines by CSS | *Konnte hierher blicken* 168, *Vermutlich beobachtet* 160 (*Could have pointed here* 175) |
| Card hero (88 px, each line `nowrap`) | 466 px | 464 / 377 / 359 px (widest English 408); never lengthen line 1 |
| Card footer beside `www.watched.earth` (152 px) | 466 px row, 15 px mono caps | *Suche dir einen Ort aus* 251 → 403; *Was hat dich beobachtet?* 262 → 414 (*Enter any place on Earth* 414, *See what watched you* 370) |
| Card readout labels | 155 px at 13 px | *Geschwindigkeit* 141, *Höhenwinkel* 103, *Mosaikpixel* 103, *Off-Nadir* 84, *Abstand* 65 |
| Card lanes (week card) | 116 px at 13 px | *Vermutlich* 94, *Überflogen* 94, *Möglich* 65, *Bild* 37 |
| Card stamp | about 26 characters at 13 px | *So 01.11.2026 · 11:21 MEZ* 236 px (246); *7 Tage bis So 08.11.2026* 227 (227) |
| Card notes and chips | about the English width | *Kommerziell, nicht öffentlich* (29 characters), *Im Streifen, unveröffentlicht* (29), *Bodenspur bei größter Annäherung* 252 px (244), *Stark bewölkt · 81 %* 152 (137) |
| Card headline lead | about 24 characters at the largest size | pass leads over 24 → 72 px (English 84), accepted; zero lead 39 characters → 62 px (72) |
| Gallery filter segments | about 8 characters | *Alle* 30, *Detail* 45, *Wetter* 45, *Radar* 37 px (*Detailed* 60) |
| Gallery counter on the last clear look | about 12 characters, 91 px | *12 neuere* 68 px (*12 this week* 91); *12 diese Woche* would be 106 |
| Gallery status | about 14 characters, 106 px | *Wolkenschatten* 106, *Bewölkt · 81 %* 106, *Wolken am Ort* 99 |
| Gallery lead chip | about 20 characters | *Letzter klarer Blick* 20, *Aus nächster Nähe* 17 |
| Pass list cloud chip | a 56 px square (48 px on small phones) | *Wolke* 37 px (*Cloud* 37) |
| Pass strip values (21 px) | the English band value's width | *Schatten* 121 px = *Infrared* 121; *Infrarot* 121, *Sichtbar* 121 |
| Geometry grid labels | no longer than the English longest (22 characters, 168 px at 10.5 px); a 390 px phone gives a cell's label about 164 px at 11 px (19 characters) | *Über dem Äquator bei* 168 (the English *Above the equator at* is as long), *Höhenwinkel bei dir* 160 on the phone, *Tempo über Grund* 122, *Ortszeit* beside *Am nächsten · UTC* / *Scan hier · UTC* |
| Computing rows | about 40 characters on a 390 px phone | longest *Abgleich · 31 Szenen mit 412 Überflügen* (39) |
| Computing window line (under the bar, one `nowrap` line with the percentage; first span ellipsised) | desktop dock 382 px at 10.5 px | *7 Tage · 01.11. 05:47 → 08.11. 05:47 UTC* + *42 %* 353 px, 369 at 11 px (English 375–384, 401); *7-Tage-Fenster · …* was 414 and lost *UTC* |
| Replay key hints (laptops: key caps and words in one `nowrap` row, 10 px, clipped without an ellipsis) | about 406 px visible | *Leertaste* cap + *Start / Pause* + ← → caps + *Überflüge dieser Art* 391 px (English 449); *Abspielen / Pause* + *voriger / nächster Überflug dieser Art* was 547 |
| Time-lapse waiting steps | about 280 px, one line with its counter | *Entwicklung der Bilder · 03 / 12* 244, *Auswahl klarer Blicke · 03 / 12* 237 |
| About section index (3 of 12 columns, shown above 1100 px; after `00` and a 14 px gap; the CSS hides it rather than wrap) | about 204 px at 1101 px, 10.5 px | *Was die Begriffe bedeuten* 191, *Wie wir Überflüge finden* 183, *Was wir nicht sehen* 145 (*How we find the passes* 168; *Was die Bezeichnungen bedeuten* 229 and *Wie wir die Überflüge finden* 214 wrapped up to 1200 / 1140 px) |
| Header button box (Cancel / New search / Close) | as wide as the longest | *Neue Suche* 79 px = *New search* 79 |
| Landing chips and locate button (phones) | the English short forms | *Bei mir* 55 (= *Near me*), *Ortung …* 63 (*Locating…* 71), *Standort* 63 (*Locate me* 71), *Pin setzen* 79, *Überrasch mich* 112 (the last chip; the row scrolls) |
| Landing kicker | one `nowrap` line | *Letzte 7 Tage · 29.10. → 05.11.2026 UTC* (39 characters, 37 in English across months) |
| Landing pin hint (right of `02 / Oder`, 10.5 px, after an 18 px glyph; clipped, not ellipsised) | `--search-w` minus about 85 px: 394 px at 1280 px | *Oder klicke auf den Globus für einen Pin* 306 px, clips only below 940 px (*Or click the globe to drop a pin* 244, below 848); the *um … zu setzen* form (382 px) clipped at 1200–1296 px |
| Locating status on phones (`01 / Ort`, then dot, text and seconds in one clipped row) | 304 px on a 360 px phone, 319 on 375; dot, gaps and `04 S` take 58 px | *Positionsabfrage* 128 px, *Ort wird bestimmt* 136 px (*Requesting position* 152, *Naming the place* 128) |
| Pin card name line | 156 px, sans 13 px | *Kein Ort in der Nähe* 120 px (*No named place nearby* 141) |
| Pin move hint | one line on a 320 px phone | *Pin versetzen: Globus gedrückt halten* 283 px (260) |
| Timeline lane words | about 10 characters | `VERMUTLICH`, `ÜBERFLOGEN` |

**The requested examples:**

| English | German | Characters (EN → DE) | Note |
|---|---|---|---|
| SURPRISE ME | ÜBERRASCH MICH | 11 → 14 | Not *ZUFALLSORT* (cold) and not *ÜBERRASCHE MICH* (longer). |
| USE MY LOCATION | MEINEN STANDORT VERWENDEN | 15 → 25 | Wide screens and the accessible name. Phones: *STANDORT*. The ≤ 400 px chip: *BEI MIR*. |
| HOW THIS WORKS | FUNKTIONSWEISE | 14 → 14 | HUD. The About title keeps *Wie das funktioniert*. |
| LAST 7 DAYS | LETZTE 7 TAGE | 11 → 13 | Nominative here; *in den letzten 7 Tagen* in prose. |
| CLOSEST LOOK | AUS NÄCHSTER NÄHE | 12 → 17 | Not *NÄCHSTER BLICK* ("next look"), not *BESTER BLICK* (the criterion is closeness). |
| TIME-LAPSE | ZEITRAFFER | 10 → 10 | |
| OFF-NADIR | OFF-NADIR | 9 → 9 | Prose explains it in words. |
| PIXEL | PIXEL | 5 → 5 | |
| ALTITUDE | HÖHE | 8 → 4 | |
| PASSES | ÜBERFLÜGE | 6 → 9 | `1 ÜBERFLUG` |
| SHARE | TEILEN | 5 → 6 | |
| DOWNLOAD IMAGE | BILD HERUNTERLADEN | 14 → 18 | *Wird heruntergeladen …* while busy. |
| COPY LINK | KOPIEREN | 9 → 8 | Then *KOPIERT*. The LINK field beside it names the object. |
| REPLAY | ABSPIELEN | 6 → 9 | The section is *WIEDERGABE*. Not *WIEDERHOLEN*. |

## 8. Sensitive content

The product is about being watched. The time-lapse shows war zones (Gaza Strip, West Bank, Ukraine, Lebanon) and
glaciers. German readers are sensitive to surveillance language, and the political vocabulary for these places is
loaded. The rule is **neutral, factual and dry**.

**Surveillance and privacy**
- *beobachten* is the product verb. *Überwachung*, *ausspioniert*, *gläserner Mensch* / *gläserner Bürger*, *Big
  Brother*, *Spähangriff* and *im Visier* are never used. *Spionagesatelliten* appears only in About's factual line.
- A camera that could have looked is *schwenkbar* or *kommerziell*, never *privat*: *eine private Kamera* means a
  person's camera, being watched by individuals.
- Privacy copy states exactly what is stored: *Wir zählen Suchen nach Ort, auf etwa 10 km genau, nie nach deinem
  genauen Standort.* Never claim *anonym* (say *grob*, *auf etwa 10 km genau*). Never write *DSGVO-konform* or any
  other compliance claim, and never use legalese.
- Reassurance is as precise as the English: *Ein Pixel ist hier bestenfalls 10 m breit. Ein Auto ist ein Pixel. Du
  bist darin nicht zu sehen.* No *keine Sorge*, no *völlig sicher*.

**War zones**
- Region names as German uses them in neutral reporting: *Gazastreifen*, *Westjordanland* (never *Judäa und Samaria*,
  never *Westbank*), *die Ukraine* in authored prose, *der Libanon* / *im Libanon*.
- The caption names only the season and the count: *11 klare Blicke · jeweils im Herbst*. The note says *Alle Bilder
  stammen aus derselben Jahreszeit.* Never add *Zerstörung*, *Krieg*, *Angriff*, *Besatzung*, *Besetzung* or
  *zerbombt*. The app does not interpret the pictures.
- *Besatzung* also means "crew": the catalog never uses it, not even for the ISS (*Menschen an Bord*).
- The Ukraine region includes Crimea. Write *die Krim*, never *die russische Krim*, and nothing that assigns it.
- **Ukrainian place names in authored text: *Kyjiw*,** *Charkiw*, *Saporischschja*. This is a deliberate choice: the
  federal government and Deutsche Welle write *Kyjiw*, while much of the press (Tagesschau, Spiegel, FAZ, dpa) still
  writes *Kiew*. The product follows the Ukrainian name. The site of the 1986 disaster stays *Tschernobyl*, its
  established German name (sublabel *Oblast Kyjiw, Ukraine*). Gazetteer labels (often English *Kyiv*) are shown as
  delivered.

**Place-name politics.** Country names come from `Intl.DisplayNames('de')` (§6.7), never overridden except for the
US/HK/MO short style. That gives *Taiwan* (never *Republik China* or *Chinesisch-Taipeh*), *Kosovo*,
*Palästinensische Autonomiegebiete*, *Westsahara*, *Belarus* (not *Weißrussland*), *Myanmar*, *Nordmazedonien*,
*Tschechien*, *Eswatini*, *Côte d’Ivoire* and *Türkei*. The catalog never adds a status word (*besetzt*,
*umstritten*, *abtrünnig*). Curated places use their German exonyms (§4.3).

**Glaciers.** *Gletscher*; every year is *am Ende der Schmelzsaison* (mid-August in the north, mid-February in the
south). No climate editorialising (*schmilzt dahin*, *dramatisch*). The pictures show it.

**Switzerland.** Swiss Standard German writes *ss* (*Schliessen*, *Grösse*). The one catalog writes ß, as for Germany
and Austria; Swiss readers accept it. Never replace ß with ss, and never add a `de-CH` catalog.

## 9. Pitfalls and the reviewer's checklist

### 9.1 False friends and traps in this product

| Trap | Why it's wrong | Use |
|---|---|---|
| *Was/etwas/das/es* + bare [PLACE] | The name reads as the subject: *Was hat Waterloo beobachtet?* = "what did Waterloo watch" | *Welche Satelliten haben Waterloo …*; a colon frame |
| *aktuell* for "actual" | It means "current". | *echt*: *die echten Bilder* |
| *eventuell* for "eventually" | It means "possibly". | *schließlich*, *irgendwann* |
| *Pass* for "pass" | Passport, mountain pass. | *Überflug* |
| *publik machen* for "make public" | To expose (a scandal). | *veröffentlichen* |
| *Image* for "image" | A reputation. | *Bild* |
| *private Kamera* for "private camera" | A person's own camera. | *kommerzielle Kamera* |
| *Kornkreise* for crop circles (Garden City) | The mystery patterns. | *Bewässerungskreise* |
| *Überschrift* for "Heading" | A text heading. | *Kurs* |
| *Höhe* for "elevation" | That is altitude. | *Höhenwinkel*; *Sonnenhöhe* |
| *Neigung* for "off-nadir" | Reads as orbital inclination. | `OFF-NADIR`; *aus der Senkrechten geneigt* |
| *nächster* for "closest" in a label | Reads as "next". | *Aus nächster Nähe*, *Am nächsten*, *größte Annäherung* |
| *Breite, Länge* for "lat, lon" | Reads as width and length. | *Koordinaten* |
| *Orten* for "Locate me" | Also the dative plural of *Ort*, beside *Ort suchen*. | *Standort* |
| *an deiner Stelle* for "at your spot" | It means "if I were you". | *an deinem Ort*, *über deinem Ort* |
| *Besatzung* for "crew" | Also military occupation. | *Menschen an Bord*, *Raumstation* |
| *wiederholen* for "replay" | To redo. | *abspielen*, *Wiedergabe* (*Noch mal* is the share sheet's retry) |
| *freigeben* for "share" | To grant permissions. | *teilen* |
| *überwachen* for "watch" | Surveillance, an accusation. | *beobachten* |
| *ansehen*, *zusehen* for "watch" | Watching a film. | *beobachten* |
| *überstreichen* for "swept over" | Lay readers hear "to paint over". | *erfasste vermutlich* |
| *Ganze Scheibe* for "full disc" | A calque. | *Vollscheibe*, *Vollscheibenbild* |
| *lokal* for "local (time)" | "Locally", not a time. | *Ortszeit* |
| *Gebaut von* for "Built by" | A calque. | *Von @handle*; *Gemacht von* |
| *rechnen* + object | Doing sums. | *berechnen* |
| *Schwad* for "swath" | Real jargon, but lay readers don't know it. | *Aufnahmestreifen* |
| Sentence-initial *Ihr/Ihre/Sie* | Reads as formal "your/you". | Rewrite with a noun: *Der Betreiber …* |
| *Er/Sie/Es* after a bare [SAT] | The gender is unknown and often wrong (*die ISS*). | *Die Kamera …*, *Das Radar an Bord …* |
| Bare *ISS* in a sentence | Every German writes *die ISS*. | *Die Raumstation ISS* (headline leads stay bare) |
| *watched* → *gesehen* | Too weak; it means "saw". | *beobachtet* (*gesehen* only where English says "saw") |
| *scene* → *Szene* in casual prose | Theatre or subculture. | Only the archive term; a picture on screen is *Bild*. |
| *Foto* for radar or mosaics | Not honest. | *Bild*, *Radarbild*, *Tagesmosaik* |

### 9.2 Reviewer's checklist (run it on every string)

1. **Address:** du only, lowercase. No *Sie/Ihr/Ihnen*, no sentence opening with a capitalised *Ihr/Sie* pronoun.
   Imperatives in sentences with *-e* (*Prüfe*, *Versuche*), *Gib/Sieh* short, *Überrasch mich* the one exception.
2. **Product verb:** *beobachten* for "watched". None of *überwachen, fotografieren, ansehen, ausspionieren*.
3. **Tense:** Präteritum for what satellites did, Perfekt for the hero and app events, present for facts.
4. **Word order:** verb second after a fronted adverbial, no comma after it. No English participle chains. At most
   one appended phrase after the verb bracket.
5. **Slots:** [PLACE] and [SAT] bare. [PLACE] is an object only after an unmistakable nominative subject, never with
   *was/etwas/das/es*. No *in/über/bei/nach* + [PLACE], no genitive -s, no pronoun after a bare name. Body prose says
   *den Ort*. Curated articles only from the table, outside the serif.
6. **Plurals:** `one` and `other` as whole phrases, with case and adjective endings right for each (*1 klarer Blick* /
   *4 klare Blicke*). Zero is its own message with *kein/keine*.
7. **Headline leads:** the verb is complete before [PLACE]. Nothing verbal falls into the serif tail.
8. **Numbers:** decimal comma; dot grouping from four digits; none for years, IDs or counters; `25 %` with U+00A0;
   `5,4°` tight; `f.dec`, never `toFixed`. Coordinates exactly as delivered.
9. **Dates and times:** from Intl `de` per the §6.3 key table; *am So., 1. Nov., um …* with both commas; *Uhr* only
   without a zone; every `zone` through the MEZ/MESZ helper.
10. **Compass:** words in prose (*Richtung Süden*, *westlich*, *im Südwesten*), German letters in `compass16` only.
11. **Typography:** „…“, ’, `…` with U+00A0 after a whole word, no dashes in prose, hyphenated compounds with
    acronyms or numbers, no number compound inside a plain message.
12. **Capitals:** sentence case; every noun capitalised; ß as ß (never ẞ, never SS by hand); umlauts never AE/OE/UE;
    no authored display line starting with *Ä/Ö/Ü*.
13. **Characters:** none of U+202F, U+2009, U+2011 or ẞ anywhere; no → ≈ or U+00AD in card strings. Search the catalog
    for them before review.
14. **Length:** measured against §7 with the stated method. No dotted abbreviations, no ellipsis truncation.
15. **Honesty:** the label says exactly what is on screen (*Bild* for radar or mosaics, *10 m pro Pixel*, *Mindestens*
    when partial, *kommerziell* for the camera). No word claims more certainty or frequency than the English.
16. **Tone:** no marketing words, no exclamation marks, no Nominalstil outside log lines, no gender markers, no
    editorialising on war zones or glaciers, no fear vocabulary.
17. **Never translated:** Watched., www.watched.earth, satellite / sensor / product names, agency acronyms, NORAD
    IDs, UTC, coordinates, attribution lines (*Contains modified Copernicus Sentinel data 2026* stays English).
18. **Read it aloud.** If a German speaker would not say it, or would not print it in a news report, rewrite it.

## Decisions log

Each item of the native review (`de.critique.md`), numbered as there, and how it was resolved: 39 numbered items and 12
items from its "Missing from the guide" list. 43 accepted, 8 partly accepted, 0 rejected. The review's measurements
were re-run with its method and reproduced; its Intl claims were checked on Node 22 (ICU 78.3).

1. **HUD top row collides.** Accepted: HUD link *Funktionsweise* (112 px, as English); *Sonne* + coordinates as
   delivered; German compass letters only in `compass16`; the localised coordinate examples removed (§3.7, §4.2, §6.2).
2. **Bare [PLACE] next to *was*.** Accepted: the nominative rule in §5.1; *Welche Satelliten haben Waterloo diese Woche
   beobachtet*; *Überflüge anzeigen: Waterloo*; *Zeigen, was über diesen Ort hinwegzog* (§3.5, §3.9, §5.1).
3. **Share sheet phone buttons overflow.** Accepted: *Kopieren*, *Kopiert*, *Auf X*, *Speichern*, *Noch mal*, with the
   budget row; *Erneut versuchen* stays in the fault notice (§3.5, §7).
4. ***Beitrag* in the 48 px column.** Accepted: *Text* (§3.5, §4.1).
5. **Verdict tiles cut on phones.** Partly accepted: the budget is corrected, but the premise is not: the CSS already
   wraps the name onto two lines on phones and 761–1100 px screens, and laptops hold about 182 px; so the titles stay
   *Vermutlich beobachtet* and *Konnte hierher blicken*, and no CSS request is needed (§3.6, §7).
6. **Card hero at the column's edge.** Accepted: 464 / 466 px recorded, "never lengthen line 1", and the four-line
   form as the card's only fallback instead of the passive (§3.1).
7. **Curated places must be translated.** Partly accepted: German exonyms for all 57 ids (chip, label, sublabel
   together), including *Bewässerungskreise* and *Tschernobyl*; the article form is a table inside the German catalog,
   test-checked against `de/places.ts`, not a new field in the shared places type (§4.3, §5.1).
8. **Article residue misjudged; labels are English.** Accepted: the rationale now says it reads as an error and is
   rare; a note that gazetteer labels are English exonyms; the German display-name table goes to the owner (§5.1).
9. **Keys with a name after a preposition.** Partly accepted: every [PLACE] frame adopted (*überflog Waterloo* in the
   descriptions, colon frames for aria and alt text, the *von* slot's residue stated); the [SAT]-after-*von* concern
   rests on a wrong premise (`aSatellite` is never inserted into sentences; a nameless satellite gets each sentence's
   own words), so `bestFrom` and `cardAlt` keep *stammt von [SAT]*; the colon frame adopted for `noImage.openArchive`
   (§3.5, §3.9, §5.1, §5.2).
10. **Bare *ISS* reads like a typo.** Accepted: *Die Raumstation ISS* in pass sentences and posts through a `crewed`
    flag code already has; *der Satellit [SAT]* allowed before a pronoun; headline leads stay bare (§3.4, §5.2).
11. ***private Kamera*.** Accepted: *schwenkbare oder kommerzielle Kamera*; *privat* only for archives (§3.6, §8).
12. **Could sentence lacks offsets.** Accepted: *… in Sichtweite, genau über dem Ort.* / *… 61 km westlich des Ortes.*
    (§3.4).
13. **Date formats by key; relative vs Intl.** Accepted: the §6.3 key table, with `relative` built by hand and the
    card's `weekTo` keeping its year (§6.3).
14. **U+2009 from Intl; → and ≈ not in card fonts; latin-ext cuts.** Accepted, all three re-checked: ranges built from
    parts (U+2009 → U+00A0 if ever needed), → and ≈ DOM-only, the font claim corrected (§6.7).
15. **Units never uppercased under :lang(de).** Accepted, now for every language: the owner ruled on 2026-11-19 that
    units keep their case in caps rows (§0, §6.5).
16. **Time-lapse video labels break 132 px.** Accepted: *Video*, *Rendern 42 %*, *Fehlgeschlagen*, *Speichern*
    (§3.8, §7).
17. **Default card footer.** Accepted, with §1.2's imperative: *Suche dir einen Ort aus* (403 / 466 px); the invite
    *Was hat dich beobachtet?* kept as a choice of tone, since *Sieh, was dich beobachtet hat* would fit too (§3.5,
    §7).
18. ***diese Woche* rule vs practice.** Partly accepted: German follows the English wording (*diese Woche* /
    *in den letzten 7 Tagen*); the older window says *In der gezeigten Woche* on both lines rather than *In den
    gezeigten 7 Tagen*, to match the English "that week" (§3.3).
19. **Hook in step with the hero.** Accepted: *Etwas hat auch dich diese Woche beobachtet.*, also for the invite bar
    (§3.5).
20. ***darum ist das Infrarot*.** Accepted: *darum zeigt das Bild Infrarot: …* (§3.4).
21. **Honesty slips in the likely sentence.** Accepted: *höchstwahrscheinlich aufgenommen*, *können … hinterherhinken*
    (§3.4).
22. ***abtasten* without object.** Accepted: *Wettersensoren messen nachts im Infrarot weiter.* (§3.4).
23. **Off-track template has two tails.** Accepted: *… in 786 km Höhe und 61 km westlich am Ort vorbei, mit … Richtung
    Süden.*, and the one-tail rule in §2.3 (§3.4).
24. **Likely swath tail dangles.** Accepted: *…; der 290 km breite Aufnahmestreifen deckte ihn ab.* (*ihn* = *den Ort*)
    (§3.4).
25. **The operator is not the imager.** Accepted, worded *wo die Kamera aufgenommen hat* (§3.4).
26. **Crewed dark-sky sentence.** Accepted: *Stand die Station noch im Sonnenlicht, dann zog sie als heller, ruhig
    leuchtender Punkt …* (§3.4).
27. ***überstrich* on social media.** Accepted, with the review's alternative made final: *erfasste vermutlich*
    (honest, complete before the place, no "paint over" reading) (§3.5, §3.6, §4.1).
28. **Labels *Tempo* and *Größte Nähe*.** Accepted: card *Geschwindigkeit* (141 / 155 px), grid *Tempo über Grund*,
    *Am nächsten · UTC / Ortszeit*, *Größte Annäherung*, *Bodenspur bei größter Annäherung*; the 16-character cap
    replaced by measured width (§4.1, §7).
29. **Full disc is *Vollscheibe*.** Accepted: readout *Vollscheibe*, prose *Vollscheibenbild* (§3.9, §4.1).
30. ***Schwad* rationale.** Accepted: "jargon, avoid", not a meaning error (§4.1, §9.1).
31. **Kyjiw claim; Chernobyl.** Accepted: *Kyjiw* stated as a deliberate choice with the real split in the press;
    *Tschernobyl*, *Oblast Kyjiw, Ukraine* (§4.3, §8).
32. **Country names short style.** Accepted: long style, short for US, HK and MO only; PS and GB long (§6.7, §8).
33. **Swiss usage.** Accepted: one catalog with ß, never ss, no `de-CH` (§0, §8).
34. **Sub line facts.** Accepted: no mono span; the day phrase still through the plural, whole phrase per category
    (§3.2).
35. ***SO* collision.** Accepted: `SO 01.11.` in rows and the HUD; headings always after their degrees (§4.2, §6.3).
36. **Capital umlauts clipped by line masks.** Partly accepted: the authored-copy rule is adopted; the `.hl` padding
    change goes to the owner, because applied to all Latin scripts it would move the English (§6.6, open question).
37. **Number compounds in plain messages.** Accepted: *Quadrat von 10 km Seitenlänge*, *auf etwa 10 km genau* (§3.8,
    §6.1, §8).
38. **Register rationale; imperative *-e*.** Accepted: the rationale rewritten (fraud-warning register, DACH du norm,
    the accepted cost); the *-e* rule made final for sentences, *Überrasch mich* the one exception (§1.2, §1.3).
39. **Smaller wording fixes.** Accepted: *Dein Browser berechnet die Bahnen*; *Alle Bilder stammen aus derselben
    Jahreszeit*; hint *Name, Adresse, Koordinaten* (shortened to stay near the English width); *Standort* / *Bei mir* /
    *Ortung …*; *Von @armaangupt0*; du forms in labels only where the English has *your*; *Kein uns bekannter
    Satellit*, extended from the card to every surface for one vocabulary; the tab-title cut noted (§3.1, §3.3, §3.9,
    §4.1).
40. **M1 Computing readout lines.** Accepted: log style as an explicit exception (§2.5), with *Abgleich · 31 Szenen mit
    412 Überflügen* and *NASA-Wettermosaike geprüft · 12 / 35* in place of the arrow and the bare noun (§3.9).
41. **M2 Report footnotes.** Accepted: all footnotes, quoting *beobachtet* and *vermutlich beobachtet*, with *daher*
    instead of a comma splice (§3.9).
42. **M3 Zero reasons and breakdown.** Accepted: the reasons in Präteritum (*überflog*), *mit offenen Daten* for
    "open", *Raumstationen* for "crewed", *Mosaik, Pl. Mosaike* in the plural table (§3.3, §5.3).
43. **M4 Fault notice.** Accepted: *Störung*, *Erneut versuchen*, *Neuer Versuch …*, *Zurück* (§3.9).
44. **M5 HUD.** Accepted: *Abgerufen …*, *Veraltet, vor 3 Tagen*, SI ages, *Subsolarpunkt*, *GMST*, *Watched,
    Startseite*, *Szene* noted as the scene clock (§3.7).
45. **M6 Gallery.** Partly accepted: filters, status and notes as proposed; the counter *12 diese Woche* is 106 px in
    a 91 px box, so it is *12 neuere* for both windows (§3.9, §7).
46. **M7 Pass view.** Partly accepted: everything as proposed except the 56 / 48 px thumbnail chip, which is *Wolke*
    (37 px, the English width) rather than *Wolken* (45 px); row prefix *Zuletzt* rather than *Neueste* (§3.9).
47. **M8 Share card and page.** Accepted: *die Karte*, the page title and description verbatim, *Was hat dich diese
    Woche beobachtet?*, *Watched wird geöffnet …*, *Kein Bild vorhanden*, *Erfassung …*; `noPublicPhoto` shortened to
    *Kein öffentliches Bild* (the stamp names the week), and the card notes trimmed to the English width (§3.5, §7).
48. **M9 Globe.** Partly accepted: capture line, callouts and the no-WebGL lines as proposed; the move hint is *Pin
    versetzen: Globus gedrückt halten*, because the proposed *um ihn zu verschieben* makes the globe the thing moved;
    *Kein Ort in der Nähe* to fit 156 px (§3.9, §7).
49. **M10 Time-lapse waiting steps.** Accepted: *Archivsuche*, *Auswahl klarer Blicke*, *Entwicklung der Bilder*
    (≤ 244 of 280 px), *Zu bewölkt für einen Zeitraffer.* (§3.8).
50. **M11 Keyboard key names.** Accepted: *Enter*, *Leertaste*, *Esc*, with the *Eingabe* note (§3.7).
51. **M12 Budget table for every constrained key.** Accepted: §7's table with measured German and English values and
    the measuring method (§7).
