# Watched: Dutch (nl) localisation style guide

Status: final. One `nl` catalogue serves both the Netherlands and Flanders. Every translator and reviewer of Watched in
Dutch follows this guide. Where it says nothing, follow `docs/DESIGN.md` §7 first and the English source second. The
decisions below are final unless the owner changes them. They are rules, not suggestions.

Notation used throughout: `[NUM]` a number the code sets in mono, `[PLACE]` a gazetteer place name (serif in
headlines), `[SAT]` a satellite name, `[CLOCK]` a 24-hour clock with its zone abbreviation as the code formats it
(`16:14:21 UTC`, `10:52 EST`), `[DATE]` a date, `[DIR]` a compass word. `**bold**` marks the emphasised count phrase.
`*asterisks*` mark the one serif accent on a screen.

## 0. Decisions at a glance

| Question | Decision |
|:--|:--|
| Address | `je` / `jij` / `jou` / `jouw` everywhere, never `u`. Unstressed `je` by default. Stressed `jou` / `jouw` / `jij` only for the accent and for contrast. |
| Product verb | `kijken naar` (prose: `keek naar` / `keken naar`). Verdict title: `Bekeken`. `zien` is never the verb for what a satellite did to the place or the reader. Where the English itself says see or saw, Dutch says `zien` (§2). Never `fotograferen`, `bespieden`, `in de gaten houden`. |
| Hero | `Iets keek` / `deze week` / `naar *jou*.` |
| Pass | `overvlucht` (de), plural `overvluchten`. |
| Image / photo | `beeld` (het) for anything that can be radar, a mosaic or a full-disc frame, and for the count. `foto` (de) only where the item is certainly a Sentinel-2 or Landsat photo (§4.2). |
| Scene | `opname` (de), plural `opnamen`. Never `scène`. |
| Verdicts | `Bekeken` / `Waarschijnlijk bekeken` / `Kon hierheen kijken` / `Vloog over je heen`. Lanes `BEELD` / `STROOK` / `BEREIK` / `HEMEL`. |
| The "could" modal | `kon` everywhere. Never `had … kunnen`. |
| Buttons | Infinitive, no pronoun: `Delen`, `Kopiëren`, `Opnieuw proberen`. Where English says my / me, the user speaks: `Mijn locatie`, `Verras me`. An invitation that says "your" uses the `je`-imperative: `Zoek jouw plek`. |
| Tense | Simple past for what a satellite did (`keek`, `vloog`, `streek over`). Present perfect for a state that holds now (`zijn openbaar gemaakt`) and for whether something happened (`Of dat ook gebeurd is`). Present tense with `sinds` (`kijkt sinds 1999`). |
| Numbers | Digits in mono wherever the English has digits. Decimal comma, thousands point: `7,46 km/s`, `1.715 beelden`. Words where the English spells a number out (`elke zes uur`). |
| Coordinates | International notation, exactly as the code formats them: `52.3676°N 4.9041°E`, `ZON 16.2°S 063.0°E`. Never localised. In a sentence, a geostationary seat is written in words: `op 0,2° westerlengte`. |
| Compass | Dutch letters for bearings and compass words only: `ZZW`, `O`, `in het zuidwesten`. |
| Satellite pronoun | None. Repeat `de satelliet`, or make the instrument the subject: `De camera keek recht naar beneden.` |
| Abbreviations | None in copy, with one exception: `t/m` in the week card's stamp. |
| Date ranges | The house arrow: `1 → 8 nov 2026 UTC`, `29 okt → 5 nov`. Never `Intl` `formatRange` output. |

---

## 1. Register and address

### The decision: `je` on every surface

Watched speaks to one person about one place and one week. Dutch does that with `je`. The product's subject is the
reader personally ("Something watched *you*"), and the voice is calm, close and exact. `je` carries all of that.

| Surface | Form | Example | Why |
|:--|:--|:--|:--|
| Display headlines (hero, results headline, About title, card headline) | `je`, with stressed `jou` where the accent falls | `Iets keek deze week naar *jou*.` | The accent is the human moment. Dutch has a stressed object pronoun for it, and the sentence stress falls on it at the end of the line. |
| Sentences and prose (results, pass detail, footnotes, spot lines) | unstressed `je`; `we` for the makers | `38° boven je horizon in het zuiden.` / `Bewolking boven je plek.` | Most sentences have the satellite as subject. The reader appears only in possessives and places, and unstressed `je` keeps that quiet. |
| Action buttons | infinitive, no pronoun | `Delen`, `Beeld downloaden`, `Kopiëren`, `Opnieuw proberen`, `Sluiten` | A button names an action; it does not order the reader about. The infinitive is the Dutch software default and works in mono caps. |
| Buttons where English says my / me | first person, the user speaking | `Mijn locatie`, `Mijn plek`, `Verras me` | Same convention as English. `Jouw locatie gebruiken` would make the product speak inside the user's own button. |
| Invitations where English says "your" | `je`-imperative; stressed `jouw` when it contrasts with someone else's place | `Zoek jouw plek` (narrow phones: `Jouw plek`) | It invites the reader, as the English does. On a shared link it contrasts with the sharer's place, so `jouw` is stressed. |
| Placeholders and prompts | `je`-imperative | `Zoek een plek` | A placeholder invites; it is not a command button. |
| Readout labels (a quantity's name over a value) | nouns only, no pronouns, no verbs | `HOOGTE`, `NADIRHOEK`, `STROOKBREEDTE`, `AFGELOPEN 7 DAGEN`, `02 / OVERVLUCHTEN` | Instrument labels name a quantity. Other mono caps strings (buttons, chips, progress rows) follow their own row of this table. |
| Error notices | `je`; what happened first, then what to do in the imperative | `De baancatalogus kon niet worden geladen. Controleer je verbinding en probeer het opnieuw.` | Plain and adult. No `Helaas`, `Oeps`, `Sorry`, no emoticon. |
| About page | `je` and `we`, the most conversational surface, same register | `Kunnen ze mij zien? Nee. Een pixel is hier op zijn best 10 m breed. Een auto is één pixel. Jij staat er niet op.` | The owner's About copy is short and plain. Dutch matches it with everyday words, not with a looser register. |
| Share post text (published under the sharer's name) | no address to the reader, except the hook line | `Iets keek deze week ook naar jou.` | The hook speaks to the sharer's followers, exactly as the English hook does. |
| Screen-reader labels | same register as the visible text | `Deze overvlucht delen` | |

Pronoun forms, once and for all: subject `je` (stressed `jij`), object `je` (stressed `jou`), possessive `je`
(stressed `jouw`), reflexive `je`. `jij` / `jou` / `jouw` appear only where you would stress them aloud: the hero, the
hooks, the card footer, the invitation `Zoek jouw plek`, and contrasts such as `Jij staat er niet op.` `mij` (not `me`)
where the first person is stressed: `Kunnen ze mij zien?`

### The rejected alternative: `u`

1. **It turns the hero into an official notice.** `u` is the pronoun of banks, insurers and government letters.
   `Iets keek deze week naar u.` reads like a notice from the authorities: surveillance by the state, which is louder
   than the product is and not what it says. (`u` can carry stress, `naar ú`; the problem is its register, not its
   weight.)
2. **It is not one register across the border.** In the Netherlands consumer software says `je` almost without
   exception. In Flanders `u` is still normal for banks and government, but most consumer apps address people as
   `je`, and in Flemish speech `u` is also the informal object form (`ik zie u graag`). So `u` would not even read as
   the same register in both regions. One register for both is better than a split catalogue, and a mixed register
   is worse than either.
3. **It makes every sentence longer and stiffer** (`uw plek`, `boven uw horizon`, `Controleer uw verbinding`) on a
   product whose labels already run longer in Dutch.

Never mix the two. A single `u` anywhere in the catalogue is a bug.

---

## 2. Voice

DESIGN §7: declarative, specific, quietly uncanny, second person, real numbers. In Dutch that sounds like a calm news
presenter reading an instrument log: short main clauses, the fact first, the unknown stated flatly.

**Declarative.** Statements, not invitations. The only questions are the About page's questions, the hook
`Wat vloog er deze week over je heen?`, and the card's closing question and footer (`Wat keek er deze week naar
jou?`, `Wat keek er naar jou?`), all of which are questions in the English too. No exclamation marks anywhere.

**Specific.** The number, the unit, the time, the direction. Never `een paar satellieten`, `veel beelden`, `ongeveer
om half vijf`. An unknown value is `—`, never a vague word. (Where the owner's English itself says "a few minutes" or
"a day or two", Dutch says the same.)

**Quietly uncanny.** The uncanny comes from the plain fact plus the second person, never from adjectives. No
`griezelig`, `spannend`, `ongelooflijk`, `stiekem`, `Big Brother`. Understatement does the work:
`Of dat ook gebeurd is, kunnen we niet weten.`

**Second person, sparingly.** The satellite is the subject of most sentences. The reader appears in `je plek`,
`je horizon`, `je hemel`, and once, stressed, in the hero. As in English, "your spot" is the searched place, wherever
the reader actually is.

**`zien`.** `zien` is never the verb for what a satellite did to the place or the reader in the hero, headlines,
verdicts or share headlines: those say `kijken naar` or the verdict's own verb. Where the English says see or saw (the
reader sees results, a camera saw only cloud), Dutch says `zien`: `Je ziet welke satellieten …`,
`De camera zag alleen wolken.`, `ze zagen je wolken, niet je straten.`

**Rhythm.**
- Dutch puts sentence stress at the end. End on the word that matters: the place, the number, the unknown.
  `… naar Waterloo.` `… : 25%.` `… kunnen we niet weten.`
- At most about 20 words a sentence (a number with its unit, or a clock with its zone, counts as one word), and at
  most one subordinate clause. A Dutch subclause sends its verb to the end, so a long one makes the reader wait;
  prefer two main clauses joined with `en`, or a colon.
- After a fronted time or place phrase the verb comes second and there is **no comma**:
  `In de afgelopen 7 dagen keken 256 satellieten naar Waterloo.` The English comma is a calque.
- **Two finite verbs side by side take a comma** (Taalunie: *Wie dit leest, is gek.*):
  `Geen satelliet die we volgen, keek deze week naar Waterloo.`, `Of dat ook gebeurd is, kunnen we niet weten.`,
  `Elk beeld dat je ziet, is het echte.`

**Tense.**
- Simple past for what a satellite did: `keek`, `vloog`, `streek over`, `kwam binnen bereik`. It is shorter and
  avoids the verb bracket (`heeft … gekeken`), which pushes the meaning to the end of a long line.
- Present perfect for a state that holds now (`[NUM] beelden zijn openbaar gemaakt`, `Er is nog geen opname
  gepubliceerd`) and for the open question whether something happened (`Of dat ook gebeurd is, kunnen we niet
  weten.`).
- Present tense for an ongoing state since a date. `heeft … gekeken sinds 1999` is a calque:
  `De MODIS-camera kijkt sinds 1999 naar de hele planeet, 2.330 km tegelijk.`,
  `Duitse X-bandradarsatelliet die sinds 2007 beelden maakt.`,
  `De eerste VIIRS-camera in een baan om de aarde, die sinds 2011 een strook van 3.040 km bestrijkt.`

**Numbers in words.** Mirror the source. Digits where the English has digits or a mono part; words where the owner's
English spells the number out: `elke zes uur`, `de afgelopen zeven dagen`, `30 tot 45 graden`,
`Een auto is één pixel.`, `vloog er één keer overheen`, `één VIIRS-beeld`.

**Avoid.**
- Marketing: `Ontdek`, `Check`, `Bekijk nu`, `Gratis!`, `jouw persoonlijke`, `in een handomdraai`, `supersnel`.
- Softeners and filler: `even`, `gewoon`, `eigenlijk`, `helaas`, `Let op:`, `Wist je dat`.
- English participle clauses: `bewegend naar het zuiden`, `recht naar beneden kijkend`.
- Noun stacks and passives where an actor exists: `wolkbedekkingspercentage`, `er werd door de satelliet een opname
  gemaakt`.
- `het`, `hij` or `zijn` for a satellite (§5).
- Literal English order: `Iets heeft jou gezien deze week` keeps the English shape and sounds translated.

### Before and after

| English | Literal Dutch (wrong) | Watched Dutch |
|:--|:--|:--|
| moving south at 7.46 km/s | `bewegend naar het zuiden met 7,46 km/s` (participle calque) | `met 7,46 km/s naar het zuiden` |
| It was looking straight down. | `Het keek recht naar beneden.` (`het` for a satellite) | `De camera keek recht naar beneden.` |
| Cloud cover across the scene: 25%. | `Wolkbedekking over de scène: 25%.` (calque, false friend) | `Bewolking over de hele opname: 25%.` |
| It could have watched Waterloo. We can't know whether it did. | `Het had naar Waterloo kunnen kijken. We kunnen niet weten of het dat deed.` (`het`, counterfactual `had … kunnen`, English order) | `… kon de camera naar Waterloo kijken. Of dat ook gebeurd is, kunnen we niet weten.` |
| The image archives didn't answer, so we can't count the public images right now. | `Helaas konden we de beeldarchieven op dit moment niet bereiken.` (softener, shifts blame, drops the consequence) | `De beeldarchieven reageerden niet, dus we kunnen de openbare beelden nu niet tellen.` |
| See every satellite that passed over it… | `Ontdek welke satellieten jou in de gaten hielden!` (marketing, dramatised verb) | `Je ziet welke satellieten er de afgelopen 7 dagen overheen vlogen …` |
| has watched the whole planet since 1999 | `heeft sinds 1999 naar de hele planeet gekeken` (tense calque) | `kijkt sinds 1999 naar de hele planeet` |

---

## 3. The key lines

### 3.1 Hero (three lines, one accent)

```
Iets keek
deze week
naar *jou*.
```

Read as one sentence: `Iets keek deze week naar jou.` The accent is `jou`: the stressed pronoun at the end of the
sentence, where Dutch puts the stress anyway. It is set in Instrument Serif italic in signal orange; everything else
is the condensed sans. Do not accent `naar`. The full stop after `jou` sits outside the serif span, as the full stop
after the serif place name does in the results headline.

Catalogue parts, the same for the landing (`landing.hero`) and the default card (`card.hero`, which joins parts at
their spaces):

```ts
hero: [['Iets keek'], ['deze week'], ['naar ', accent('jou'), '.']] as Rich[]
```

| Alternate | Why it loses |
|:--|:--|
| `Iets heeft` / `*jou* gezien` / `deze week.` | `zien` overclaims: most passes have no image, and "saw you" says one exists. The time phrase after the participle is a spoken afterthought that reads as translated. The verb bracket splits the sentence over the line breaks. |
| `Deze week` / `keek iets` / `naar *jou*.` | Opens on the time instead of the actor. Line 2 (`keek iets`) is an inverted fragment that does not stand on a poster. |
| `Iets keek` / `naar *jou*,` / `deze week.` | Needs a comma for the afterthought, and the afterthought reads as translated. |

The same sentence everywhere it appears: the share page title `Iets keek deze week naar jou.`, the tab title
`Watched · Iets keek deze week naar jou` (no full stop), the boot title (same), the post hook and results invite
`Iets keek deze week ook naar jou.`, the default card's alt text `Een echte satellietfoto van Sentinel-2 van Palm
Jumeirah, Dubai, naast de regel: Iets keek deze week naar jou. Kies een plek op aarde.`

About title, same pattern: `[['Hoe het'], [accent('werkt'), '.']]`.

### 3.2 Sub line

> **Kies een plek op aarde. Je ziet welke satellieten er de afgelopen 7 dagen overheen vlogen, en de echte beelden
> die ze maakten.**

- `Kies` covers typing, a pin, a chip and your location; `Voer … in` would describe a form.
- `Je ziet` is declarative second person, as DESIGN asks, and avoids a second imperative.
- `welke satellieten … vlogen` is plural, so `ze maakten` agrees and no satellite needs a gender.
- `er … overheen` refers to the place without naming it. `erover` would read as "about it".
- `beelden`, not `foto’s`: the count includes radar, mosaics and full-disc frames.
- The comma before `en` is deliberate: without it the reader briefly parses "flew over … and the real images".
- Keep the no-break space in `7&nbsp;dagen`, as English keeps `7&nbsp;days`. One piece is fine (the English splits it
  only to keep its own text nodes).

| Alternate | Why it loses |
|:--|:--|
| `Voer een plek op aarde in. Zie elke satelliet die er in de afgelopen 7 dagen overheen ging, en de echte foto’s die hij maakte.` | Form language; stiff imperative `Zie`; `hij` assigns a gender; `foto’s` undercounts. |
| `Zoek een plek op aarde. Bekijk alle satellieten die er de afgelopen 7 dagen overheen vlogen, en de beelden die ze echt maakten.` | Two imperatives in a row is brochure tone, and `Bekijk` collides with the verdict title `Bekeken`. |

The share page's generic description is the same sentence. The place page: title `Wat keek er deze week naar
Waterloo` (no full stop: a heading), description `Alle satellieten die de afgelopen 7 dagen over Waterloo vlogen, en
de echte beelden die ze maakten. Wat keek er deze week naar jou?`

### 3.3 Results headline

Bold = the count phrase, which in Dutch is **verb + number + noun** (the verb comes second after the fronted time
phrase). The number inside it is the large mono display numeral. `*[PLACE]*` is the serif accent. No comma after the
time phrase.

| Case | nl frame | Bold part |
|:--|:--|:--|
| N > 1 (CLDR `other`), last 7 days | `In de afgelopen 7 dagen **keken [NUM] satellieten** naar *[PLACE]*.` | `keken [NUM] satellieten` |
| N = 1 (CLDR `one`), last 7 days | `In de afgelopen 7 dagen **keek [NUM] satelliet** naar *[PLACE]*.` | `keek [NUM] satelliet` |
| window of another length, `other` | `In de afgelopen [NUM] dagen **keken [NUM] satellieten** naar *[PLACE]*.` | |
| one-day window (rare) | `In de afgelopen 24 uur **keek [NUM] satelliet** naar *[PLACE]*.` / `… **keken [NUM] satellieten** …` | |
| old window | `Tussen [DATE] en [DATE] **keken [NUM] satellieten** naar *[PLACE]*.` / `… **keek [NUM] satelliet** …` | |
| N = 0, current window | `Geen satelliet die we volgen, keek deze week naar *[PLACE]*.` | none |
| N = 0, old window | `Geen satelliet die we volgen, keek in die week naar *[PLACE]*.` | none |
| no window (pass card lead, older shares) | `**[NUM] satellieten keken** naar *[PLACE]*.` / `**[NUM] satelliet keek** naar *[PLACE]*.` | |
| summary card, page title and post | `[NUM] satellieten keken deze week naar [PLACE].` / `[NUM] satelliet keek deze week naar [PLACE].` / `Geen satelliet die we volgen, keek deze week naar [PLACE].` | |

Dates inside the old-window frame are written in full: `Tussen 29 oktober en 5 november`. The kicker of a one-day
window is `Afgelopen 24 uur`.

Rejected order: `**[NUM] satellieten keken** de afgelopen 7 dagen naar *[PLACE]*.` It is natural Dutch and keeps the
English bold span, but it moves the time frame from the owner's first position into the middle. The chosen order
reads: when, the finding, where.

**Second line.** The whole sentence is emphasised as in English (DESIGN §7 sets it bold); the number is mono.

| Case | nl |
|:--|:--|
| K > 1 (`other`) | `**[NUM] beelden zijn openbaar gemaakt.**` |
| K = 1 (`one`) | `**[NUM] beeld is openbaar gemaakt.**` |
| partial, `other` | `**Minstens [NUM] beelden zijn openbaar gemaakt.**` |
| partial, `one` | `**Minstens [NUM] beeld is openbaar gemaakt.**` |
| zero, this week | `Er zijn deze week geen beelden openbaar gemaakt.` |
| zero, that week | `Er zijn die week geen beelden openbaar gemaakt.` |
| zero, summary card (its headline already says "deze week") | `Er zijn geen beelden openbaar gemaakt.` |
| archives down | `De beeldarchieven reageerden niet, dus we kunnen de openbare beelden nu niet tellen.` |
| archives down, one-line card | `De beeldarchieven reageerden niet.` |

`Minstens` is the only hedge; it settles to the bare number in place, as `At least` does. Never `ten minste` (formal)
or `minimaal` (bureaucratic). Dutch has two plural categories, `one` and `other`; 0 takes `other` in readouts
(`0 overvluchten`) but prose says `geen`.

**The reasons behind a zero** (the footnote and the dark-week lines):

- `Sentinel-2 of Landsat vloog er overdag 3 keer overheen, maar er is nog geen opname gepubliceerd` (`one`: `… vloog er
  overdag één keer overheen, …`)
- `de beeldarchieven reageerden niet op tijd` · `de zon kwam niet op` · `de zon kwam er nauwelijks op` ·
  `geen satelliet met een openbaar archief vloog er overdag overheen`
- `De zon kwam niet op, dus kon geen enkele daglichtcamera de plek zien.` / `De zon kwam nauwelijks op, dus …`
- `Weersatellieten streken er toch 42 keer in infrarood overheen.` (`one`: `… toch één keer …`)
- Radar: `Radar heeft geen licht nodig. Umbra, Capella en 7 andere radarsatellieten kwamen 1.204 keer binnen bereik.`
  (the verb follows the number of satellites, §5).

### 3.4 Pass sentences

Order, as in English: what crossed, when, where, how it moved; then what that means for the image; then what we
cannot know. `[CLOCK]` arrives formatted, with its zone (`16:14:21 UTC`, `11:21:13 EST`): never add `plaatselijke
tijd` or `uur` to it. `plaatselijke tijd` belongs to the share post only (§3.6).

**Imaged, optical.** Directly overhead:

> `Sentinel-2C vloog om 16:14:21 UTC op 786 km hoogte recht over, met 7,46 km/s naar het zuiden. De camera keek recht
> naar beneden. Bewolking over de hele opname: 25%.`

Not overhead:

> `Sentinel-2C vloog om 16:14:21 UTC op 786 km hoogte voorbij, 61 km ten westen van de plek, met 7,46 km/s naar het
> zuiden.`

Off straight down: `De camera keek 5,3° schuin naar beneden.` (`schuin` is always measured from straight down; never
`onder een hoek van 5,3°`, which readers measure from the horizontal.)

Why this shape: one verb for the first sentence (`vloog … recht over`), Dutch middle-field order (time, then altitude,
then the separable particle last), and the movement as a trailing phrase instead of an English participle. In prose
`ten westen` always takes `van de plek`. The second sentence makes the camera the subject, so no pronoun has to guess
the satellite's gender.

| Alternate | Why it loses |
|:--|:--|
| `Sentinel-2C passeerde om 16:14:21 UTC op 786 km recht boven je, op weg naar het zuiden met 7,46 km/s.` | `op weg naar` is softer than the instrument voice, and `passeerde` is a word for traffic. |
| `Sentinel-2C kwam om 16:14:21 UTC op 786 km hoogte recht over en vloog met 7,46 km/s naar het zuiden.` | Two verbs where one does, and `overkomen` also means "to come across as". |

**Imaged, daily mosaic.** `De VIIRS-camera streek over [PLACE] voor het dagelijkse NASA-mozaïek in ware kleuren, met
375 m per pixel.` (`NASA-mozaïek`, so `van NASA` cannot attach to `kleuren`. Sensor names stay as they are: `de
[SENSOR]-camera` or `het instrument [SENSOR]`.)

**Imaged, radar.** `De radar keek 31,2° opzij en bracht [PLACE] in beeld met 20 m per pixel, in het donker.` (Without
the dark: end on `… met 20 m per pixel.`)

**Imaged, geostationary.**

> `Meteosat-12 vliegt niet over. De satelliet staat 35.778 km boven de evenaar op 0,2° westerlengte en scant elke
> 10 minuten de hele aardschijf onder zich. De scanlijn bereikte Paris rond 07:49 CET en schoof naar het noorden.`

- Without a known cadence: `… en scant de hele aardschijf onder zich.` Without a known seat: `… boven de evenaar en
  scant …`.
- A seat east of Greenwich: `op 140,7° oosterlengte` (`0°` and above is `oosterlengte`, as the code's `E`).
- Infrared frame: `Het was hier donker, dus dit is infrarood: wolkentoppen naar temperatuur, hoe kouder hoe lichter.`
- `de hele aardschijf`, never `het hele aardoppervlak`: the satellite scans the disc it sees, a little under half the
  planet. `staat` is how Dutch describes a geostationary satellite, and `zich` has no gender.

**Likely.** `Sentinel-2C vloog om 16:14:21 UTC op 786 km hoogte voorbij, 61 km ten westen van de plek, binnen de
opnamestrook van 290 km.` Then, by case:

- open optical, recent: `Het was dag, dus de camera heeft deze plek vrijwel zeker vastgelegd. Er is nog geen opname van
  deze overvlucht gepubliceerd; archieven lopen soms een dag of langer achter.`
- open optical, archive down: `Het was dag, dus de camera zou deze plek hebben vastgelegd. Het archief kon nu niet worden
  doorzocht.`
- open optical, after two days: `Er bestaat geen opname van deze overvlucht. Sentinel-2 neemt alleen land en kustwater
  op, en heeft deze plek misschien niet ingepland.`
- weather satellite at night: `Het was hier donker. Weercamera’s scannen ’s nachts in infrarood door: ze zagen je
  wolken, niet je straten.`
- weather satellite, mosaic unconfirmed: `Het dagmozaïek van NASA voor deze overvlucht kon op je plek niet worden
  bevestigd.`
- forecast-only imager: `De beelden gaan naar weersverwachtingen; ze worden niet gepubliceerd als beelden die we
  kunnen tonen.`

**Could.** The first sentence ends on the offset: `WorldView Legion 4 kwam om 10:52 EST binnen bereik, recht boven de
plek.` / `…, 61 km ten westen van de plek.` Then:

- straight down: `Recht naar beneden gericht kon de camera naar Waterloo kijken. Of dat ook gebeurd is, kunnen we niet
  weten.`
- off nadir: `5,3° schuin naar beneden gericht kon de camera naar Waterloo kijken. Of dat ook gebeurd is, kunnen we niet
  weten.`
- fixed-swath commercial camera: `De plek lag binnen de opnamestrook van 290 km. De exploitant maakt niet bekend waar de
  camera opnamen maakte; of dat hier ook gebeurd is, kunnen we niet weten.`
- radar, private operator: `Radar kijkt door wolken en duisternis heen. 31,2° opzij gericht kon de radar Waterloo in
  kaart brengen. Of dat ook gebeurd is, kunnen we niet weten.` (straight down: `Radar kijkt door wolken en duisternis
  heen. De radar kon Waterloo in kaart brengen. …`)
- radar, open archive (Sentinel-1): `… kon de radar Waterloo in kaart brengen. We vonden geen gepubliceerd beeld van deze
  overvlucht.`

`kon` states the capacity and implies nothing. `had … kunnen` leans counterfactual ("could have, but didn't"), which
we do not know; `kan … hebben gekeken` is correct but heavy. `ook` carries the "actually" of "whether it actually did".

**Overhead.** `ISS (ZARYA) vloog om 21:04 EST op 420 km hoogte over, 38° boven je horizon in het zuiden.` Near the
zenith (80° and up): `…, 84° boven je horizon, bijna recht omhoog.` In the dark: `Het was donker waar je bent. Als het
station nog in de zon stond, trok het over je hemel als een helder lichtpunt dat niet knipperde.` (`het station` is a
known neuter noun, so `het` is safe. `dat niet knipperde` says what "steady" is there for: it is not a blinking plane.)

**Per-pass headline.** `Sentinel-2C keek naar *Waterloo*.` / `Sentinel-2C streek over *Waterloo*.` /
`WorldView Legion 4 had *Waterloo* binnen bereik.` / `ISS (ZARYA) vloog over *Waterloo*.`

### 3.5 The four verdicts

Source of truth: `VERDICT_META` (`src/ui/results/lib/meta.ts`), mirrored by the card's `lane` (`api/_lib/i18n/card`).
One set of words everywhere: never spell a verdict any other way.

| verdict | title | lane label (mono caps) | count unit | definition | prose verb |
|:--|:--|:--|:--|:--|:--|
| imaged | `Bekeken` | `Beeld` | `overvlucht` / `overvluchten` | `Er staat een echt beeld van deze plek in een openbaar archief.` | `keek naar` → `[SAT] keek naar [PLACE].` |
| likely | `Waarschijnlijk bekeken` | `Strook` | `overvlucht` / `overvluchten` | `De opnamestrook van een vaste camera bestreek deze plek. Er is geen beeld van gepubliceerd.` | `streek over` → `[SAT] streek over [PLACE].` |
| could | `Kon hierheen kijken` | `Bereik` | `overvlucht` / `overvluchten` | `Een richtbare of commerciële camera was binnen bereik. De exploitant zegt niet of er gekeken is.` | `had … binnen bereik` → `[SAT] had [PLACE] binnen bereik.` |
| overhead | `Vloog over je heen` | `Hemel` | `overvlucht` / `overvluchten` | `Trok over je hemel. Ruimtestations en al het andere.` | `vloog over` → `[SAT] vloog over [PLACE].` |

Why these words:

- **`Bekeken`** is the participle of `bekijken`, the same root as `kijken naar`, so title and sentence read as one
  word family, and it is the only form that also works inline (`telt als bekeken`). In Dutch UIs `Bekeken` is also
  a status for things you opened and a view count (`31 keer bekeken`): never print `[NUM] bekeken`; the title always
  sits with its glyph and its unit. Rejected: `Gezien` (overclaims recognition), `Vastgelegd` (drops the product
  verb).
- **`Waarschijnlijk bekeken`** is the exact probability of the English. `Vermoedelijk bekeken` sounds like a police
  report. Never `wellicht` or `allicht` (§8).
- **`Kon hierheen kijken`** keeps the owner's point: a camera that could be pointed here, a mechanism, not a lower
  probability. `Had hierheen kunnen kijken` is counterfactual; `Mogelijk bekeken` reads as a probability.
- **`Vloog over je heen`** keeps "overhead", the one thing the English title adds to the `overvluchten` above it on the
  tile (`40 OVERVLUCHTEN / Vloog over je heen`). The prose verb stays `vloog over [PLACE]`.
- **Lane labels.** Each lane is the noun of its prose verb, so it says what put the pass there: an image exists
  (`BEELD`), the swath covered the place (`STROOK`), the place was in range (`BEREIK`), it crossed your sky
  (`HEMEL`). All are 5–6 characters and fit the timeline's 8-character lane and the week card's 116 px columns. The
  English lane says PHOTO, but the lane holds radar images and mosaics too, so Dutch says `BEELD` (honesty rule).
  Rejected: `FOTO` (dishonest for radar and mosaics), `WAARSCH.` (an abbreviation; it also abbreviates
  `waarschuwing`), `MOGELIJK`, `BOVEN` (beside its count, `BOVEN 40` reads "more than 40"), `OVER` (`nog 9 over`
  reads "9 remaining").
- **Prose verbs.** `streek over` is what a searchlight does (`de schijnwerper streek over het plein`): exact for a
  swath, and quietly uncanny. `had [PLACE] binnen bereik` states only geometry, as `passed within view of` does.
  Rejected: `kwam binnen bereik van [PLACE]` (the satellite came within the place's range), `kon kijken naar` as the
  share verb (it needs the camera as subject to read right).
- **Count unit.** All four count passes: `1 overvlucht`, `31 overvluchten`. Tile aria label:
  `[NUM] overvluchten: Waarschijnlijk bekeken`. The verdict group's aria label: `Overvluchten per soort. Elke knop
  springt naar zijn lijst.` (a verdict is a `soort`, never an `oordeel` or `vonnis`).
- **About's longer word after each definition** (`verdictMore`): imaged `Wat we tonen, is het echte beeld.`; likely
  `Het beeld is nog niet openbaar, of het is afgekeurd vanwege wolken.`; could `Of dat ook echt gebeurd is, valt niet
  te weten.`; overhead: nothing.

### 3.6 Sharing: the card, the share page, the post, the sheet

**Card headline blocks** (text blocks in the condensed face, the accent block in the serif; a closing full stop is its
own part, outside the count):

| Message | nl parts |
|:--|:--|
| `headline` (pass card, week count known) | `['[NUM] satellieten keken naar', accent(place, '.')]` / `one`: `['1 satelliet keek naar', …]` |
| `headlineWeek` | `['[NUM] satellieten keken deze week naar', accent(place, '.')]` / `one`: `['1 satelliet keek deze week naar', …]` / zero: `['Geen satelliet die we volgen, keek deze week naar', accent(place, '.')]` |
| `headlineBy.imaged` | `['[SAT] keek naar', accent(place, '.')]` |
| `headlineBy.likely` | `['[SAT] streek over', accent(place, '.')]` |
| `headlineBy.could` | `['[SAT] had', accent(place), 'binnen bereik.']` (a text block after the accent is supported) |
| `headlineBy.overhead` | `['[SAT] vloog over', accent(place, '.')]` |

Nameless satellite: `Een satelliet keek naar`, `Een satelliet had`, … (§5). The place is cut with `…`: then drop the
full stop, as English does.

Do not move `deze week` after the place on the week card (`naar Waterloo deze week.` is an afterthought, and the
comma version `naar Waterloo, deze week.` reads oddly in the post, which uses the same message).

Card sizes (`headlineSize`: 84 px for a lead of up to 24 characters, 72 up to 32, 62 up to 42, 54 beyond; the accent's
words, without a closing full stop, cap it the same way at 13 / 18 / 26 characters):

| Lead | Characters | nl size | English for the same card |
|:--|--:|--:|--:|
| `31 satellieten keken naar` (pass card) | 25 | 72 px | 84 px (`31 satellites watched`, 21) |
| `1 satelliet keek naar` | 21 | 84 px | 84 px |
| `31 satellieten keken deze week naar` (week card, `Waterloo`) | 35 | 62 px | 62 px (its accent `Waterloo this week.` is 19) |
| `Geen satelliet die we volgen, keek deze week naar` | 49 | 54 px | 62 px |

So a typical pass card is one size smaller than the English and a week card is the same size for an ordinary place
name. That is expected, not a bug.

**Line under the headline** (`photos`): §3.3's second line. `archiveDown` and `archiveDownShort` as there.

**Cloud, four channels** (`cloud.*`):

| Case | sub (card line) | chip (mono caps) | post | desc |
|:--|:--|:--|:--|:--|
| ≥ 90% | `Dichtbewolkt. De camera zag alleen wolken.` | `Dichtbewolkt · 92%` | `De camera zag alleen wolken.` | `De camera zag alleen wolken (92%).` |
| 70–89% | `Vooral wolken: 81% van de opname.` | `Vooral wolken · 81%` | `De camera zag vooral wolken (81%).` | `De camera zag vooral wolken (81%).` |
| the spot itself | `Bewolking precies boven de plek.` | `Wolk boven de plek` | `Er lag een wolk boven de plek.` | `Er lag een wolk boven de plek.` |

**Top row, readouts, chips.**

- `stamp`: `zo 1 nov 2026 · 11:21 EST` (Intl `weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'`).
- `weekTo`: `7 dagen t/m zo 1 nov 2026` (`tot` alone reads as "up to, not including"). `lastWeek`: `Afgelopen 7 dagen`.
- `readout`: `Hoogte`, `Elevatie`, `Snelheid`, `Nadirhoek`, `Pixel`, `Mozaïekpixel`, `Dichtstbij`.
- `lane`: `Beeld`, `Strook`, `Bereik`, `Hemel`.
- `unit`: `km`, `m`, `km/s`. `decimal`: `fmt('nl').dec` (`7,46`, `0,31 m`).
- `geometry`: `Geometrie · noorden boven`. `note`: `Beeld opent in de app` · `Beeld nu niet beschikbaar` ·
  `Commercieel archief, niet openbaar` · `In strook, nog geen openbaar beeld` · `Grondspoor bij dichtste nadering`.
- `acquiring`: `Ophalen…`. `noPublicPhoto`: `Deze week geen openbaar beeld`. `noPhoto`: `Geen beeld om te tonen`.
- `look`: `Scherpst` · `Laatst helder` · `Dichtbewolkt` · `Radar`; chip `Scherpst · Sentinel-2B · 10 m`,
  `Laatst helder · 3 nov · Landsat 9 · 30 m`. `lookDay`: `3 nov`. `aSatellite`: `Een satelliet`.
- `invite` (footer, beside www.watched.earth): `Wat keek er naar jou?`
- `enterAnyPlace` (default card footer): `Kies een plek op aarde`. `defaultPlace`: `Palm Jumeirah`.

**Share page.**

- `page.title`, `page.description`, `placeTitle`, `placeDescription`: §3.1 and §3.2.
- `page.opening`: `[accent('Watched'), ' wordt geopend']`.
- `crossed`: `Sentinel-2C vloog op zondag 1 november 2026 om 11:21 EST op 795 km hoogte over Waterloo, naar het zuiden.`
  (no altitude: `… om 11:21 EST over Waterloo, …`; no heading: end on the place; nameless: `Een satelliet vloog …`).
- `withinView`: `WorldView Legion 4 had Waterloo op zondag 1 november 2026 om 11:21 EST binnen bereik en vloog naar het
  zuiden.`
- `couldHave`: `De camera kon hierheen kijken. De exploitant zegt niet of dat ook gebeurd is.`
- `straightDown`: `De camera keek recht naar beneden.` `offNadir`: `De camera keek 5,3° schuin naar beneden.`
  `cloudCover`: `Bewolking: 25%.` `inSwath`: `De plek lag binnen de opnamestrook.` (never start on [PLACE])
- `bestFrom`: `Het scherpste beeld is van Sentinel-2C.` · `De laatste heldere opname is van Sentinel-2C.` ·
  `Het eerste beeld is van Sentinel-2C.` (nameless: `… is van een satelliet.`)
- `question`: `Wat keek er deze week naar jou?`
- `cardAlt`: `De deelkaart, met het scherpste beeld van de week, gemaakt door Sentinel-2C.` / `De deelkaart.`

**The post** (`share.post.*`; prose, so the day is written in full with `Intl` `weekday: 'long', day: 'numeric',
month: 'long'`, and the clock is followed by `plaatselijke tijd`):

- imaged: `Sentinel-2C keek op zondag 1 november om 11:21 plaatselijke tijd vanaf 786 km hoogte naar Waterloo. 10 m per
  pixel; dit is het echte beeld.` (no pixel size: `… naar Waterloo. Dit is het echte beeld.`)
- clouded: `Sentinel-2C keek op zondag 1 november om 11:21 plaatselijke tijd vanaf 786 km hoogte naar Waterloo. De camera
  zag alleen wolken.`
- likely: `Sentinel-2C streek op zondag 1 november om 11:21 plaatselijke tijd vanaf 786 km hoogte over Waterloo. De
  opnamestrook van de camera bedekte de plek.`
- could: `WorldView Legion 4 had Waterloo op zondag 1 november om 11:21 plaatselijke tijd binnen bereik. De camera kon
  hierheen kijken. De exploitant zegt niet of dat ook gebeurd is.`
- overhead: `ISS (ZARYA) vloog op zondag 1 november om 21:04 plaatselijke tijd op 420 km hoogte over Waterloo.`
- hooks: `hookWatched` `Iets keek deze week ook naar jou.` / `hookPassed` `Wat vloog er deze week over je heen?`
- `credit`: `via @handle` (keep `via`).
- file names stay ASCII: `watched-sentinel-2c-waterloo-2026-11-01.png`, `watched-waterloo-week-2026-11-01.png`.

**The sheet** (`share.*`; three buttons share a 360 px phone, about 12 characters each):

| Key | nl | Characters |
|:--|:--|--:|
| `titlePass` / `titleImage` / `titleWeek` | `Deze overvlucht delen` / `Dit beeld delen` / `Deze week delen` | |
| `shareImage` / `preparingImage` / `share` | `Beeld delen` / `Beeld klaarmaken…` / `Delen` | |
| `copyLink` | `Kopiëren` (the field labelled LINK sits right above it, on phones and desktops) | 8 |
| `copied` | `Gekopieerd` | 10 |
| `postToX` | `Op X zetten` | 11 |
| `copyImage` (desktop only) | `Beeld kopiëren` | 14 |
| `savePng` | `PNG opslaan` | 11 |
| `tryAgain` (replaces `PNG opslaan`) | `Opnieuw` | 7 |
| `linkLabel` / `postLabel` (48 px column) | `Link` / `Tekst` | 4 / 5 |
| `directLink` | `Directe link: de korte link kon nu niet worden gemaakt` | |
| `creatingLink` / `linkLater` | `Link maken…` / `Wordt gemaakt als je deelt` | |
| `renderFailed` | `De kaart kon hier niet worden getekend; de link werkt nog steeds.` | |
| `close` / `closeTitle` | `Sluiten` / `Sluiten (Esc)` | |

### 3.7 Reference strings by screen

Where a wrong guess is likely, these are the Dutch strings. Every other key follows the rules and the glossary.

**App, boot, system**

| Key | nl |
|:--|:--|
| `app.documentTitle`, boot `title` | `Watched · Iets keek deze week naar jou` |
| boot `loading` / `slow` | `Watched wordt geladen` / `Trage verbinding, nog bezig met laden` |
| `notice.label` (one instrument word) | `Storing` |
| `notice.fallback` | `Er ging iets mis.` |
| `notice.tryAgain` / `trying` / `back` | `Opnieuw proberen` / `Proberen…` / `Terug` |
| `faults.catalog` | `De baancatalogus kon niet worden geladen. Controleer je verbinding en probeer het opnieuw.` |
| `faults.compute` | `Er ging iets mis bij het berekenen van de overvluchten voor deze plek. Probeer het zo opnieuw.` |
| `app.progress.catalog` | `Baanelementen laden` |
| switcher | `Taal` / `Taal: Nederlands. Wijzigen` |
| system | `Sluiten` / `Paneel vergroten` / `Paneel verkleinen` |

**Landing**

| Key | nl |
|:--|:--|
| `lastDays` (kicker) / `windowRange` | `Afgelopen 7 dagen` / `1 → 8 nov 2026 UTC`, `29 okt → 5 nov 2026 UTC`, `29 dec 2026 → 5 jan 2027 UTC` |
| `searchPlaceholder` / `placeLabel` | `Zoek een plek` / `Plek` |
| `searching` / `searchUnavailable` / `matches` / `noMatch` | `Zoeken` / `Zoeken niet beschikbaar` / `1 treffer`, `3 treffers` / `Geen treffers` |
| `searchHint` | `Naam, adres of coördinaten` |
| `clearSearch` / `go` (aria) | `Zoekveld leegmaken` / `Overvluchten van deze plek tonen` |
| `searchDown` | `Het zoeken naar plekken reageert niet. Coördinaten zoals 43.47, −80.54 werken nog steeds.` (the example stays as the field parses it) |
| `nothingMatches` | `Niets gevonden voor “Waterloo”. Probeer een stad, een bezienswaardigheid of coördinaten.` |
| `useMyLocation` / `locateMe` / `nearMe` | `Mijn locatie` / `Mijn plek` / `Mijn plek` (`Mijn locatie gebruiken` ellipsised the placeholder at 1024 px) |
| `locating` (chip, about as wide as `Mijn plek`) | `Bepalen…` |
| `cancelSearch` / `cancelLocate` / `cancelLocating` | `Annuleren` / `Annuleren` / `Locatie bepalen annuleren` |
| `requestingPosition` / `namingPlace` / `elapsed` | `Positie opvragen` / `Naam opzoeken` / `04 s` |
| `locatingNote` | `Je positie gaat naar de geocoder Photon om de plek een naam te geven. We bewaren alleen een gebied van ongeveer 10 km.` |
| `locationLabel` / `dismiss` | `Locatie` / `Sluiten` |
| `locateErrors.denied` | `De toegang tot je locatie is geblokkeerd. Sta die toe in de instellingen van je browser, of zoek een plek.` |
| `locateErrors.unavailable` / `other` | `Je positie is nu niet beschikbaar. Zoek in plaats daarvan een plek.` |
| `locateErrors.timeout` | `Het bepalen van je positie duurde te lang. Probeer het opnieuw, of zoek een plek.` |
| `locateErrors.unsupported` | `Deze browser kan zijn locatie niet delen. Zoek in plaats daarvan een plek.` |
| `locateErrors.insecure` | `Locatie werkt alleen via een beveiligde verbinding (https). Zoek in plaats daarvan een plek.` |
| `orTry` / `pinHint` / `dropPin` | `Of probeer` / `Of klik op de wereldbol voor een speld` / `Speld neerzetten` |
| `examplesLabel` / `surprise` / `surpriseName` | `Voorbeeldplekken` / `Verras me` / `Verras me: een bekende plek, willekeurig gekozen` |
| `builtBy` | `Gemaakt door @armaangupt0` (`Gebouwd door` is a calque) |
| `sourceLink` / `sourceLinkLabel` | `Open source` / `Open source: de code op GitHub` |

**Results, pass list and pass view**

| Key | nl |
|:--|:--|
| invite bar | text `Iets keek deze week ook naar jou.`, button `Zoek jouw plek` |
| shared-pass CTA (lead hidden on narrow phones) | `Zoek ` + `jouw plek` (narrow: `Jouw plek`) |
| `passView.empty` | `Geen satelliet die we volgen, vloog in deze periode over deze plek. Dat is zeldzaam; de voetnoten hierboven melden of een gegevensbron uitviel.` |
| `imagedOrder` | `scherpste eerst` (19 characters at most beside `40 overvluchten`, or the count drops to a second line) |
| `count` / `countStack` | `1 overvlucht` / `31 overvluchten` (unit in the number's form) |
| `sats` | `1 satelliet` / `12 satellieten` (no `sat` / `sats`) |
| `showAllSats` / `showAllRows` / `showMore` / `left` / `showFewer` | `Alle 31 satellieten tonen` / `Alle 12 rijen tonen` / `Nog 40 tonen` / `nog 12` / `Minder tonen` |
| `tag` | `Mozaïek` · `Radar` · `Bewolkt · 81%` · `Bewolkt · op de plek` |
| `rowLabel` (spoken) | `Sentinel-2C, keek naar, vrijdag 6 november 16:14 CET, 41 uur geleden, bewolking 25 procent, dichtbewolkt` |
| `offNadir` / `cloudPct` | `5,3° nadirhoek` / `bewolking 25%` |
| `expandLabel` / `expandTitle` | `Beeld vergroten: Sentinel-2C, zo 1 nov 16:14` / `Beeld vergroten` |
| `satLabel` | `Sentinel-2C, ESA, 3 overvluchten, laatste vrijdag 6 november 16:14` |
| `latest` / `closest` / `cloudChip` | empty / `Dichtstbij ` / `Wolk` (`Laatste ` ran the row past its box beside the 12-letter count unit; the row is the latest pass) |
| `photosSection` / `planSection` / `geometry` / `replay` | `Beelden` / `Bovenaanzicht` / `Geometrie` / `Herhaling` |
| `fullDiscNote` | `Een beeld van de hele schijf: één opname van alles wat de satelliet kan zien, hier met 2 km per pixel. Grof, maar echt, en het nieuwste dat gepubliceerd is; de satelliet maakte de hele week elke 10 minuten zo’n beeld.` (no cadence: `… om de paar minuten zo’n beeld.`) |
| `mosaicNote` | `Een dagmozaïek: NASA voegt de stroken van elke dag samen tot één beeld met 375 m per pixel. Grof, maar echt, en van de dag van deze overvlucht.` |
| `radarNote` | `Een radarbeeld, geen foto: Sentinel-1 zendt microgolven uit en registreert hun echo, dus wolken en duisternis houden de radar niet tegen. De helderheid is hoe sterk de grond ze terugkaatst: gebouwen en ruwe grond zijn licht, kalm water is donker.` |
| `noImage.openArchive` | `Geen beeld van Sentinel-2C van deze plek bij deze overvlucht. Bovenaanzicht van de overvlucht.` |
| `noImage.radarPrivate` / `commercialPrivate` | `Geen openbaar beeld: het archief van deze radarexploitant is privé. Bovenaanzicht van de overvlucht.` / `Geen openbaar beeld: commerciële archieven zijn privé. Bovenaanzicht van de overvlucht.` |
| `noImage.noneToShow` / `archiveDown` / `noScene` | `Geen beeld te tonen voor deze overvlucht. …` / `Het archief kon nu niet worden doorzocht. …` / `Er bestaat geen opname van deze overvlucht. …` (each then `Bovenaanzicht van de overvlucht.`) |
| `noImage.notYet` | `Nog geen gepubliceerde opname bij deze overvlucht. Opnamen van Sentinel-2 en Landsat verschijnen meestal binnen een dag.` |
| `noImage.crewed` / `unavailable` | `Ruimtestations hebben camera’s aan boord, maar hun foto’s worden niet per plek en tijd gepubliceerd.` / `Het beeld van deze overvlucht is niet beschikbaar.` |
| `links` | `Beeld openen om op te slaan` · `Downloaden…` · `Beeld downloaden` · `Bron bekijken · Planetary Computer` |
| `spot` | `Pixel op je plek lezen…` · `Helder boven je plek.` · `Dunne cirrus gemeld boven je plek; die kan het beeld wat zachter maken.` · `Bewolking boven je plek.` · `Je plek lag in de schaduw van een wolk.` |
| `strip` | `Hoogte` · `Elevatie` · `Nadirhoek` · `Pixel` · `Kanaal` (the word KNMI uses for a satellite channel) · `Zon` · `Bewolking` · `Op je plek` |
| `band` / `spotValue` | `Infrarood` / `Zichtbaar` / `Kleur` · `Helder` / `Cirrus` / `Bewolkt` / `Schaduw` (all ≤ 9 / ≤ 7) |
| `unit` | `km`, `m`, `km/s`, `hoog` (`38° hoog`), `mozaïek`, `opname`, sun `dag` / `schemer` / `nacht` (`schemering` is too long for a unit) |
| `geo` | `Dichtstbij · UTC` · `Dichtstbij · lokaal` · `Grondafstand` · `Elevatie hier` · `Grondsnelheid` · `Koers` · `Zonnehoogte` · `Richtbereik` · `Strookbreedte` · `In strook` · `In zicht` · `Venster` · `NORAD · overvlucht` · `Scanlijn hier · UTC` · `Scanlijn hier · lokaal` · `Boven de evenaar op` · `Aan je hemel` · `Scanrichting` · `Lijnsnelheid hier` · `Dekking` · `Deze scan` · `NORAD · scan` |
| direction values | `Noord → zuid` / `Zuid → noord`; `timeRange` `16:14:21 → 16:18` |
| `sunPhase` / `fullDisc` / `everyMin` | `Dag` / `Schemer` / `Nacht` · `Hele schijf` · `elke 10 min` |
| `upCompass` / `heading` | `hoog · ZZW` / `ZZW · stijgend`, `ZZW · dalend` |
| Timeline spoken summary (title first, then the count) | `Tijdlijn, 7 dagen: Bekeken 3, Waarschijnlijk bekeken 31, Kon hierheen kijken 12, Vloog over je heen 40.` |

**Gallery and photo viewer**

| Key | nl |
|:--|:--|
| `barLabel` / `filterLabel` / `dialogLabel` | `Beelden` / `Beelden tonen` / `Beelden` |
| `filter` (≤ 8 each) | `Alles` · `Detail` · `Weer` · `Radar` |
| `filterTitle` | `Alle beelden: eerst het scherpste, dan de nieuwste` · `Sentinel-2 en Landsat, 10–30 m per pixel` · `Dagelijkse weermozaïeken, 250 m per pixel en grover` · `Radarbeelden van Sentinel-1, 20 m per pixel: door wolken heen, dag en nacht` |
| `system.counter` / `photosThisWeek` / `photosThatWeek` | `3 / 27` / `12 deze week` / `12 die week` |
| `prevPhoto` / `nextPhoto` | `Vorig beeld` / `Volgend beeld` |
| lead tags (`LEAD`) | `Scherpst` · `Laatst helder` · `Dichtbewolkt` |
| `slideLabel` | `Scherpst: Sentinel-2C, zo 1 nov 16:14, beeld 3 van 27` |
| `replayLabel` | `Deze overvlucht afspelen op de wereldbol: Sentinel-2C, zo 1 nov 16:14` |
| `replay` (strong part only on portrait tablets) | `[strong('Deze overvlucht '), 'afspelen']` (phones and laptops: `AFSPELEN`) |
| `view` / `viewLabel` | `Openen` / `De laatste heldere opname groot openen: …` · `Beeld groot openen: …` |
| `sharePass` / `radarTag` | `Deze overvlucht delen` / `Radar` |
| `noteMostlyCloud` / `noteLastClear` | `Deze week vooral wolken` / `De laatste heldere opname` |
| `clouded` | `Dichtbewolkt · 92%` · `Dichtbewolkt · wolk op je plek` · `Wolk op je plek` |
| `status` (≤ ~14) | `Bewolkt · 81%` · `Wolk hier` · `Helder` · `Dunne cirrus` · `Wolkenschaduw` · `Bewolking 25%` · `Dagmozaïek` |
| `photoAlt` | `Beeld van Waterloo, gemaakt door Sentinel-2C. De plek ligt in het midden.` |
| `acquiring` / `noImage` / `retry` | `Ophalen` / `Geen beeld ontvangen` / `Opnieuw` |
| `stillRendering` / `cropMissing` | `Nog bezig. Grote opnamen kunnen 10 s of langer duren.` / `Het archief stuurde deze uitsnede niet. Misschien is het druk; het beeld zelf bestaat nog.` |
| `scanLine` / `awaiting` | `['Lijn ', strong('0412'), ' → 1024']` / `Wacht op overvlucht` · `Wacht op scan` |
| `north` / `expandLabel` / `expandTitle` | `N` / `Beeld vergroten` / `Vergroten (F)` |
| aria roles | `carrousel` / `dia` |
| lightbox `perPixel` / `panTitle` | `10 m / pixel` / `Verscherpt met de panchromatische band van Landsat (15 m)` |
| lightbox zoom | `Inzoomen` / `Uitzoomen` / `Inzoomen (+)` / `Uitzoomen (−)` / `2,5×` |

**HUD and globe**

| Key | nl |
|:--|:--|
| `hud.about` / `home` | `Hoe het werkt` / `Watched, beginpagina` |
| `regionTime` / `regionCatalog` / `regionSun` | `Tijd` / `Baancatalogus` / `Zon` |
| `hud.scene` (the replay's clock) | `Toen` (`TOEN zo 1 nov 11:21:13 EST`) |
| `sun` / `subsolar` / `gmst` | `ZON 16.2°S 063.0°E` / `Subsolair punt` / `GMST 18:41:50` |
| `objects` / `objectsPending` / `catalog` | `16.893 objecten` / `Objecten` / `Catalogus` |
| `fetched` / `catalogAge` | `Opgehaald 2026-11-08 03:34Z` / `<1 min geleden`, `42 min geleden`, `5 uur geleden`, `3 dagen geleden`; stale `Verouderd, 3 dagen geleden` (never `u`, `h` or `d`) |
| `catalogUnavailable` / `catalogLoading` | `Catalogus niet beschikbaar` / `Catalogus laden` |
| globe `imaged` / `imagedAbout` | `Opgenomen 11:21:13 EST` / `Opgenomen ≈ 11:21 EST` |
| `acquired` / `acquiredAbout` / `acquiredNow` | `Vastgelegd 11:21:13 EST · 10 m` / `Vastgelegd ≈ 11:21 EST · 2 km` / `Vastgelegd` |
| `acquisitionOf` / `closestApproachOf` | `Opname · SENTINEL-2C` / `Dichtste nadering · SENTINEL-2C` |
| pin `card` / `naming` / `noName` / `searchTitle` / `removeAria` | `Geplaatste speld` / `Naam opzoeken` / `Geen plaatsnaam in de buurt` / `Hier zoeken (Enter)` / `Speld verwijderen` |
| `moveHint` (one line, 320 px) | `Houd de bol vast om te verplaatsen` |
| `droppedAt` / `droppedIn` | `Speld geplaatst op 43.4723°N 80.5449°W.` / `Speld geplaatst bij Waterloo, Ontario, Canada. Druk op Enter of op de pijl om te zien wat er overheen vloog.` |
| `noGl` | `3D-weergave niet beschikbaar` / `WebGL 2 staat uit in deze browser` |

**Computing readout and footnotes (engine)** (one mono line, about 40 characters on a 390 px phone)

| Key | nl | Characters |
|:--|:--|--:|
| `loadingCatalog` | `Baancatalogus laden` | 19 |
| `catalog` | `Catalogus · 16.893 objecten` | 27 |
| `propagateStart` | `412 banen doorrekenen · 7 dagen` | 31 |
| `propagating` | `Banen doorrekenen · 120 / 412` | 29 |
| `searchingArchives` | `Sentinel-2 + Landsat doorzoeken` | 31 |
| `matching` | `132 opnamen koppelen · 48 overvluchten` | 38 |
| `verifyingWeatherStart` | `NASA-weermozaïeken controleren` | 30 |
| `verifyingWeather` | `NASA-weermozaïeken controleren · 12 / 35` | 40 |
| `done` | `48 overvluchten · 1.715 beelden` | 31 |

`doorrekenen`, not `propageren` (jargon). Footnotes:

- `archiveSlow` / `archiveDown`: `De archieven van Sentinel-2 en Landsat reageerden te traag; de overvluchten zijn alleen uit de baangeometrie
  berekend.` / `De archieven van Sentinel-2 en Landsat waren niet bereikbaar; …` (same ending).
- `sentinel2Thumbnails`: `Sentinel-2 opgehaald via Earth Search; sommige opnamen tonen een miniatuur van de hele opname, geen uitsnede.`
- `sentinel2EarthSearch`: `Sentinel-2 opgehaald via Earth Search (zoeken in Planetary Computer niet beschikbaar).`
- `sentinel2Down` / `landsatDown`: `Archief van Sentinel-2 onbereikbaar; beelden van Sentinel-2 kunnen ontbreken.` (Landsat the same)
- `openOcean`: `Deze plek valt buiten het opnameplan van Sentinel-2 (open zee).`
- `elementsOld`: `De baanelementen zijn 4 dagen oud, dus de tijden van de overvluchten kunnen een paar minuten afwijken.`
- `elementsNewer`: `Deze overvluchten zijn gereconstrueerd uit nieuwere baanelementen, dus hun tijden kunnen een paar minuten afwijken.`
- `gibsUnconfirmed`: `one` `NASA GIBS bevestigde één VIIRS-beeld niet op tijd; VIIRS brengt elke dag de hele aarde in beeld, dus die
  overvlucht telt als bekeken.` / `other` `NASA GIBS bevestigde 12 VIIRS-beelden niet op tijd; VIIRS brengt elke dag de
  hele aarde in beeld, dus die overvluchten tellen als bekeken.`
- `gibsSlowAll` / `gibsDownAll`: `NASA GIBS reageerde niet op tijd, dus beelden van weersatellieten worden niet getoond.` /
  `NASA GIBS was niet bereikbaar, dus …` (same ending).
- `gibsSlowSome`: `one` `NASA GIBS leverde 1 van de 35 beelden van weersatellieten niet op tijd; die overvlucht wordt getoond als
  waarschijnlijk bekeken.` / `other` `… 3 van de 35 … ; die overvluchten worden getoond als waarschijnlijk bekeken.`
- `gibsDownSome`: `NASA GIBS kon 3 van de 35 beelden van weersatellieten niet leveren; die overvluchten worden getoond als
  waarschijnlijk bekeken.` (`one` as above.)

**Time-lapse**

| Key | nl |
|:--|:--|
| `dialog` / `title` / `close` / `escKey` | `Timelapse van Waterloo` / `Timelapse` / `Sluiten` / `Esc` |
| `play` / `pause` / `slider` / `frameList` | `Afspelen` / `Pauzeren` / `Frame` / `Frames` |
| `date` / `dayMonth` / `readout` | `22 okt 2015` / `22 okt` / `22 okt 2015 · Sentinel-2A` |
| `frameSpoken` | `Frame 3 van 11: 22 oktober 2015` |
| `captionYearly` | `11 heldere opnamen · één per jaar` |
| `captionSeason` | `11 heldere opnamen · elke herfst` (`elke winter`, `elke lente`, `elke zomer`) |
| `captionGathering` | `Elk jaar één heldere opname · sinds 2015` |
| `captionShort` / `captionError` | `Geen timelapse voor deze plek` / `Het archief gaf geen antwoord` |
| `note` | `Elk frame is hetzelfde vierkant van 10 km, gemaakt door Sentinel-2 en bewerkt zoals elke foto hier. We zoeken voor elk jaar een ander seizoen; een jaar zonder heldere opname valt weg.` |
| `noteOneSeason` | `Elk frame is hetzelfde vierkant van 10 km, gemaakt door Sentinel-2 en bewerkt zoals elke foto hier. Elk jaar komt uit hetzelfde seizoen; een jaar zonder heldere opname in dat seizoen valt weg.` |
| `source` | `Copernicus Sentinel-2, via Planetary Computer` |
| `listing` / `choosing` / `developing` | `Archief doorzoeken` / `Heldere opnamen kiezen` / `Frames ontwikkelen` |
| `choosingProgress` / `developingProgress` | `Heldere opnamen kiezen, 3 van 12` / `Frames ontwikkelen, 3 van 11` |
| `tooCloudy` / `tooFew` | `Te bewolkt voor een timelapse.` / `Geen heldere opname sinds 2015 · 3 nodig`, `1 heldere opname sinds 2015 · 3 nodig` |
| `noAnswer` / `unreachable` / `retry` | `Het archief gaf geen antwoord.` / `Planetary Computer was niet bereikbaar` / `Opnieuw proberen` |
| `share` / `linkCopied` / `shareTitle` | `Delen` / `Link gekopieerd` / `Waterloo, jaar na jaar` (a title may open on the place; a sentence may not) |
| `video` / `rendering` / `videoFailed` / `saveVideo` | `Video` / `Renderen 42%` / `Video mislukt` / `Video opslaan` |
| `noH264` / `fileNamePlace` | `Deze browser heeft geen H.264-encoder: het bestand speelt af in Chrome en Firefox` / `plek` |

**About** (the owner's plain register; numbers as the English writes them)

| Key | nl |
|:--|:--|
| `bar` / `close` / `sectionsLabel` | `Over` / `Sluiten` / `Onderdelen` |
| `lede` | `Kies een plek op aarde. We rekenen uit welke satellieten er de afgelopen week overheen vlogen en gaan dan op zoek naar de beelden die ze maakten. Alles draait in je browser, op openbare data.` |
| `sections` | `De korte versie` · `Hoe we de overvluchten vinden` · `Wat de labels betekenen` · `Wat we niet kunnen zien` · `Privacy` · `Met dank aan` · `Toetsenbord` |
| `short.live` | `Is het live?` / `Niet helemaal. Beelden komen een paar uur tot een paar dagen na de opname in de archieven, dus van de nieuwste overvluchten is er misschien nog geen.` |
| `short.seeMe` | `Kunnen ze mij zien?` / `Nee. Een pixel is hier op zijn best 10 m breed. Een auto is één pixel. Jij staat er niet op.` |
| `short.every` | `Is dit elke satelliet?` / `Nee. Militaire en spionagesatellieten staan meestal niet in openbare catalogi, en bedrijven zeggen niet waar ze hun camera’s op richten.` |
| `method.orbits` | `Elk object in een baan om de aarde heeft een openbare reeks getallen die zijn baan beschrijft. ` + link `CelesTrak` + ` publiceert die op basis van de tracking van de US Space Force, en we halen elke zes uur een verse kopie op.` |
| `method.loaded` | `Deze pagina laadde ` + `16.893` + ` objecten, opgehaald ` + `2026-11-08 03:34Z` + `.` |
| `method.sgp4` | `We rekenen elke satelliet door met SGP4, het standaard baanmodel, over de afgelopen zeven dagen, en noteren elke keer dat je plek binnen het blikveld van de satelliet lag.` |
| `facts.straightDown` | `Recht naar beneden` / `Sentinel-2 en Landsat kijken recht naar beneden naar een strook grond, ongeveer 290 km breed bij Sentinel-2 en 185 km bij Landsat. Je plek moet in die strook liggen.` |
| `facts.tilting` | `Kantelbare camera’s` / `Veel commerciële satellieten kunnen 30 tot 45 graden kantelen. Lag je binnen hun bereik, dan noemen we dat “kon hierheen kijken”.` |
| `facts.daylight` | `Daglicht` / `Gewone camera’s hebben de zon nodig. Een overvlucht in het donker telt nooit als foto.` |
| `facts.radar` | `Radar` / `Sentinel-1 heeft de zon niet nodig. De satelliet zendt microgolven uit en registreert de echo, dus de radar kijkt door wolken heen en ook ’s nachts, schuin opzij van het grondspoor. Ook deze beelden zijn openbaar, dus we tonen ze, in grijs: licht is ruwe grond en gebouwen, donker is kalm water.` |
| `facts.weather` | `Weersatellieten` / `Enkele staan boven de evenaar en kijken elke 10 minuten naar de halve planeet. Ben je aan hun kant van de aarde, dan sta je op elk beeld.` |
| `method.archives` | `Daarna doorzoeken we de beeldarchieven (Microsoft Planetary Computer, Element 84 en NASA) en koppelen we elk beeld aan de overvlucht die het maakte. Elk beeld dat je ziet, is het echte, uitgesneden rond je plek.` |
| `photoFacts.touchUps` | `Bewerking` / `Foto’s van Sentinel-2 en Landsat krijgen voor je scherm een kleurbalans, worden gladgestreken en licht verscherpt, over het hele beeld op dezelfde manier. Er wordt niets toegevoegd of weggehaald.` |
| `photoFacts.whichWayUp` | `Waar boven is` / `Foto’s van Sentinel-2 en Landsat houden het kaartraster van het archief voor je plek aan, dus het noorden kan een paar graden naast recht omhoog staan. Open je een foto, dan wijst de N-pijl precies aan waar.` |
| `accuracy` | `Precieze posities` / `Openbare baandata is op ongeveer een kilometer nauwkeurig en verloopt elke dag een beetje. Tijden kunnen een paar seconden afwijken.` · `Geheime satellieten` / `Enkele van de beste camera’s in een baan om de aarde zijn van legers. Die zie je hier niet.` · `Wolken` / `Veel foto’s tonen alleen wolken. Als het archief het ons vertelt, controleren we de pixel precies boven je plek en zeggen we het.` · `Vertraging` / `Beelden kunnen een dag of twee op zich laten wachten.` |
| `privacy.where` | `Waar het draait` / `De baanberekeningen gebeuren in je browser.` |
| `privacy.kept` | `Wat we bewaren` / `We tellen zoekopdrachten per plaats en per gebied van ongeveer 10 km, nooit je precieze plek, en houden bij wat er geopend en gedeeld wordt. Geen IP-adressen, geen eigen cookies, niets dat het ene bezoek aan het volgende koppelt.` |
| `privacy.others` | `Wie het nog meer ziet` / `De meeste plaatsnamen komen uit een lijst die in de site zit. Andere zoekopdrachten gaan naar Open-Meteo, Photon of Nominatim. Beelden laden rechtstreeks uit de archieven. Onze host telt paginabezoeken en snelheid, zonder cookies, en kan één beveiligingscookie plaatsen om mensen van bots te onderscheiden. Wij lezen die nooit.` |
| `privacy.links` | `Deellinks` / `Alleen gemaakt als je iets deelt. Wie de link heeft, ziet de plaatsnaam, een plek afgerond op ongeveer 1 km en de overvlucht die je koos.` |
| `credits` | `Gemaakt door` / `Armaan, @armaangupt0 op X` · `Beelden van NASA GIBS, onderdeel van EOSDIS. GOES via NOAA en CIRA, Himawari via JMA.` · `Archieven` · `Banen` / `Baanelementen van CelesTrak. SGP4 via satellite.js.` · `Plaatsnamen` / `Photon van komoot. Kaartgegevens © OpenStreetMap-bijdragers (ODbL).` · `Aardtexturen` · `Letters` |
| `keys` | `Een plek zoeken` · `Door de suggesties gaan` · `Kiezen` · `Door de overvluchten gaan` · `Vorig / volgend beeld` · `Beeld vergroten` · `Zoomen (vergroot)` · `De herhaling afspelen of pauzeren` · `Terug, of sluiten` · `Deze pagina` |
| `keyNames` | `Enter` / `Spatie` / `Esc` |
| `builtBy` / `footerNote` | `Gemaakt door @armaangupt0` / `Gemaakt met openbare data. Geen van deze beelden is door ons gemaakt.` |

---

## 4. Glossary

### 4.1 Terms

Gender: `de` or `het`. Plural forms are given wherever a count can precede the noun. "Never" lists words that look
right and are wrong here.

| English | nl | Notes |
|:--|:--|:--|
| Watched (brand) | `Watched.` | Never translated, inflected or given an article: `Watched toont …`. Wordmark only in its SVG. |
| www.watched.earth | `www.watched.earth` | Always lowercase, also inside uppercase mono rows. |
| to watch (product verb) | `kijken naar` | Prose `keek naar` / `keken naar`. Never `fotograferen`, `bespieden`, `observeren`, `in de gaten houden`, `bewaken`. `zien` only where the English says see (§2). |
| watched (verdict title) | `Bekeken` | Never `[NUM] bekeken`. |
| photographed | (never) | Owner rule: user copy says watched. Never `gefotografeerd`. |
| satellite | `satelliet` (de), pl. `satellieten` | Refer back with `de satelliet`, never `hij` / `het` / `zijn`. |
| satellites we track | `satellieten die we volgen` | Never `tracken`. Before a verb: `die we volgen, keek` (comma). |
| a satellite (nameless) | `een satelliet` / `Een satelliet` | §5. |
| pass (n.) | `overvlucht` (de), pl. `overvluchten` | Never `pas`, `pass`, `passage`, `overkomst`. |
| to pass over | `overvliegen` (`vloog … over`) | Imaged passes: `vloog … recht over` / `vloog … voorbij`. |
| verdict | `soort` (de) | Never `oordeel`, `vonnis`. |
| likely watched | `Waarschijnlijk bekeken` | Lane `STROOK`. |
| could have pointed here | `Kon hierheen kijken` | Lane `BEREIK`. Never `Had hierheen kunnen kijken`. |
| passed overhead | `Vloog over je heen` | Lane `HEMEL`. Prose `vloog over [PLACE]`. |
| swept over | `streek over` | Infrared sweeps: `streken er [NUM] keer in infrarood overheen`. |
| passed within view (of) | `kwam binnen bereik` / `had [PLACE] binnen bereik` | Never `kwam binnen bereik van [PLACE]`. |
| could (have) | `kon` | Never `had … kunnen`. |
| photo | `foto` (de), pl. `foto’s` | Only where the item is certainly a Sentinel-2 or Landsat photo (§4.2). |
| image | `beeld` (het), pl. `beelden` | The umbrella word and the count. Satellite image: `satellietbeeld`. Never `imago`, `plaatje`. |
| image (the file) | `beeld` in buttons | `Beeld downloaden`, `Beeld kopiëren`, `Beeld delen`. |
| public image | `openbaar beeld`, pl. `openbare beelden` | Never `publiek beeld`. |
| made public / published | `openbaar gemaakt` / `gepubliceerd` | `[NUM] beelden zijn openbaar gemaakt.` / `Er is geen beeld van gepubliceerd.` |
| archive | `archief` (het), pl. `archieven` | Image archive: `beeldarchief`. |
| scene | `opname` (de), pl. `opnamen` | Never `scène`. One plural throughout (not `opnames`). |
| scene (the HUD's replay clock) | `Toen` | It is the replay's moment, not an image: `TOEN 11:21:13 EST`. |
| swath | `opnamestrook` (de), pl. `opnamestroken`; short `strook` | Never `zwad` (mown grass). Label `STROOKBREEDTE`. |
| off-nadir (label) | `NADIRHOEK` | Prose `schuin naar beneden`. Never `KIJKHOEK` (field of view). |
| straight down (nadir) | `recht naar beneden` | `nadir` only inside `nadirhoek`. |
| straight up (zenith) | `recht omhoog` | `bijna recht omhoog`. |
| ground track | `grondspoor` (het) | |
| orbit | `baan` (de), pl. `banen` | `omloopbaan` or `een baan om de aarde` in About. Never `orbit`. |
| orbital catalog | `baancatalogus` (de), pl. `catalogi` | |
| orbital elements (TLE) | `baanelementen (TLE)` | `TLE-epoche`. |
| epoch | `epoche` (de) | |
| to propagate (orbits) | `doorrekenen` | Never `propageren`. |
| object (catalog) | `object` (het), pl. `objecten` | `16.893 objecten`. |
| altitude | `hoogte` (de) | Prose `op 786 km hoogte`; label `HOOGTE`. |
| elevation (angle above horizon) | `elevatie` (de) | Label `ELEVATIE`; prose `38° boven je horizon`; unit `hoog`. |
| sun elevation | `zonnehoogte` (de) | |
| ground speed | `grondsnelheid` (de) | Card readout `SNELHEID`. |
| heading | `koers` (de) | Never `kop`. |
| ground distance | `grondafstand` (de) | |
| closest approach | `dichtste nadering`; label `Dichtstbij` | `DICHTSTBIJ · UTC`. A real distance. |
| closest look (the lead photo) | `Scherpst` (tag); `het scherpste beeld` (prose) | The most zoomed-in clear photo, not the nearest pass. Never `Dichtstbij` or `dichtstbijzijnd` here. |
| last clear look | `Laatst helder` (tag); `de laatste heldere opname` (prose) | |
| clear look (time-lapse) | `heldere opname`, pl. `heldere opnamen` | |
| ascending / descending | `stijgend` / `dalend` | No abbreviations. |
| field of regard | `richtbereik` (het) | |
| in swath / in view / window | `in strook` / `in zicht` / `venster` | |
| cloud cover | `bewolking` (de) | Never `wolkbedekking`, `wolkendekking`. |
| clouded over / mostly cloud | `dichtbewolkt` / `vooral wolken` | Chips `Dichtbewolkt · 92%`, `Vooral wolken · 81%`. |
| spot values | `Helder` / `Cirrus` / `Bewolkt` / `Schaduw` | |
| it saw only cloud | `De camera zag alleen wolken.` | |
| pixel | `pixel` (de), pl. `pixels` | `10 m per pixel`; label `PIXEL`. |
| resolution | `pixelgrootte` | Labels say `PIXEL`, because a pixel size is what is shown. `resolutie` only in About prose. |
| mosaic pixel | `Mozaïekpixel` | Trema stays in capitals. |
| radar | `radar` (de) | `radarbeeld` (het), `radarsatelliet` (de), `radarexploitant` (de). |
| weather mosaic / daily mosaic | `weermozaïek` (het) / `dagmozaïek` (het) | `het dagelijkse NASA-mozaïek in ware kleuren`. |
| geostationary | `geostationair`, `geostationaire satelliet` | |
| full disc | label `Hele schijf`; prose `de hele aardschijf` | |
| scan / scan line | `scan` (de), `scannen`; `scanlijn` (de) | |
| band (geostationary) | `kanaal` (het) | Values `Infrarood` / `Zichtbaar` / `Kleur`. |
| true colour | `ware kleuren` | Never `echte kleur`. |
| time-lapse | `timelapse` (de), pl. `timelapses` | One word. |
| frame (time-lapse, video) | `frame` (het), pl. `frames` | Not `beeld` (taken by image). |
| replay (section) / replay (button) | `herhaling` / `Afspelen` | `02 / HERHALING`. Pause: `Pauzeren`. |
| view (open large) | `Openen` | Never `Bekijken` (it collides with `Bekeken`). |
| sub-solar point | `subsolair punt` | HUD `ZON 16.2°S 063.0°E`. |
| sunlight / daylight / dark | `zonlicht` / `daglicht` / `donker` | `daglichtcamera`. |
| day / twilight / night | `dag` / `schemer` / `nacht` | Readout units and values. |
| steerable / tilting / fixed camera | `richtbare` / `kantelbare` / `vaste camera` | |
| operator | `exploitant` (de), pl. `exploitanten` | The standard Dutch for a satellite operator. Never `operator`, never `beheerder` (reads as a website's administrator). |
| commercial | `commercieel`, `commerciële` | |
| crewed / station | `bemand` / `ruimtestation` (het), short `station` | |
| weather / imaging satellite | `weersatelliet` / `aardobservatiesatelliet` | |
| military / spy satellite | `militaire satelliet` / `spionagesatelliet` | Only where the English says it. |
| place | `plek` (de) | Never `locatie` for a searched place. |
| spot (the exact pixel) | `plek`; for contrast `precies je plek` | |
| location (GPS) | `locatie` (de); position `positie` | `Mijn locatie`, `Positie opvragen`. |
| area (privacy) | `gebied` (het) | `een gebied van ongeveer 10 km`. Never `vak`, `cel`, `~`. |
| globe | `wereldbol` (de), short `bol` | |
| pin / drop a pin | `speld` (de) / `Speld neerzetten` | |
| plan view | `bovenaanzicht` (het) | |
| geometry | `geometrie` | `01 / GEOMETRIE`. |
| imaged / acquired / acquisition | `Opgenomen` / `Vastgelegd` / `Opname` | Globe labels. |
| acquiring (loading a photo) | `Ophalen` | |
| line (pushbroom counter) | `Lijn` | |
| coordinates | `coördinaten` | `COÖRDINATEN`. |
| sky / horizon / equator | `hemel` / `horizon` / `evenaar` | `over je hemel`, `aan je hemel`. |
| Earth / Sun | `aarde` / `zon` | Lowercase in prose. |
| share / share card | `Delen` / `deelkaart` (de) | Never `sharen`. |
| post (n.) | `bericht` (het) in prose; sheet label `Tekst` | |
| Post to X | `Op X zetten` | |
| copy link / copy image / copied | `Kopiëren` / `Beeld kopiëren` / `Gekopieerd` | |
| download / save PNG / video | `Beeld downloaden` / `PNG opslaan` / `video` (de), pl. `video’s` | |
| match (search) | `treffer` (de), pl. `treffers` | `Geen treffers`. |
| fault | `storing` (de) | Notice label `Storing`. |
| use my location / near me / locating | `Mijn locatie` / `Mijn plek` / `Bepalen…` | |
| surprise me | `Verras me` | |
| how this works | `Hoe het werkt` | |
| last 7 days / this week / that week | `afgelopen 7 dagen` / `deze week` / `die week` (`in die week` after `keek`) | |
| local time | prose (posts) `plaatselijke tijd`; label `lokaal` | Never in pass sentences, whose clock carries its zone. |
| UTC | `UTC` | Never `GMT`, never expanded. |
| ago / just now / in (future) | `geleden` / `zojuist` / `over` | `over 3 uur`, never `in 3 uur`. |
| min / h / days / s | `min` / `uur` / `dagen` / `s` | `uur` is never abbreviated and never plural after a number. |
| try again / cancel / close | `Opnieuw proberen` (tight: `Opnieuw`) / `Annuleren` / `Sluiten` | |
| keyboard keys | `Spatie`, `Enter`, `Esc`, `↑ ↓ ← →` | Never `Space`. |

### 4.2 Where `foto` may stand

`foto` only where the thing on screen is certainly a Sentinel-2 or Landsat photo. Everywhere else, `beeld`.

| `beeld` (can be radar, a mosaic or a full-disc frame) | `foto` (certainly optical) |
|:--|:--|
| the imaged lane `BEELD`; the second line's count | About: `Bewerking`, `Waar boven is`, `Daglicht`, `Wolken` |
| gallery bar, filter, ‹ › buttons, position, thumbnails, alt text, expand, share, view | `filterTitle.detailed` is `Sentinel-2 en Landsat, …` (no noun needed) |
| card: `noPublicPhoto`, `noPhoto`, `cardAlt`, `bestFrom` | `noImage.crewed` (`hun foto’s`) |
| About: `verdictMore.imaged` and `.likely`, `short.live`, `accuracy.delays`, `privacy.others`, `footerNote` | time-lapse `note` (`zoals elke foto hier`: its frames are Sentinel-2) |
| `photosSection` `Beelden` | the default card's alt (`satellietfoto van Sentinel-2`) |

### 4.3 Compass words and coordinates

Dutch compass letters are for bearings and compass words. Coordinates stay international.

| deg | prose noun | movement | position | horizon |
|:--|:--|:--|:--|:--|
| 0 | `noorden` | `naar het noorden` | `61 km ten noorden van de plek` | `in het noorden` |
| 45 | `noordoosten` | `naar het noordoosten` | `ten noordoosten van de plek` | `in het noordoosten` |
| 90 | `oosten` | `naar het oosten` | `ten oosten van de plek` | `in het oosten` |
| 135 | `zuidoosten` | `naar het zuidoosten` | `ten zuidoosten van de plek` | `in het zuidoosten` |
| 180 | `zuiden` | `naar het zuiden` | `ten zuiden van de plek` | `in het zuiden` |
| 225 | `zuidwesten` | `naar het zuidwesten` | `ten zuidwesten van de plek` | `in het zuidwesten` |
| 270 | `westen` | `naar het westen` | `ten westen van de plek` | `in het westen` |
| 315 | `noordwesten` | `naar het noordwesten` | `ten noordwesten van de plek` | `in het noordwesten` |

One noun list serves all uses; the preposition lives in the sentence template. 16-point readout abbreviations from 0°:
`N NNO NO ONO O OZO ZO ZZO Z ZZW ZW WZW W WNW NW NNW`. Scan direction values: `Noord → zuid`, `Zuid → noord`.

Coordinates are international in every language, exactly as the code formats them (`fmtLat` / `fmtLon`, the HUD's
`sun`, the card's `fmtCoords`): `52.3676°N 4.9041°E`, `ZON 16.2°S 063.0°E`, `43.4723°N 80.5449°W`. Never localise
them: no decimal comma, no `Z` or `O`. An `S` in a coordinate and a `Z` in a bearing on the same screen is accepted.
The one place a longitude is written the Dutch way is inside a sentence, in words: `op 0,2° westerlengte`,
`op 140,7° oosterlengte` (geostationary seat, §3.4).

### 4.4 Curated places (`places`)

Established Dutch exonyms where they exist (Taalunie list of foreign place names); names without one stay as they
are. Country names match `Intl.DisplayNames('nl')`, except `Hongkong` written by hand. Sublabels list most specific
first, with commas.

| id | chip | label | sublabel |
|:--|:--|:--|:--|
| area51 | `Area 51` | `Area 51` | `Groom Lake, Nevada, Verenigde Staten` |
| centralPark | `Central Park` | `Central Park` | `New York, Verenigde Staten` |
| giza | `Gizeh` | `Piramides van Gizeh` | `Gizeh, Egypte` |
| uluru | | `Uluru` | `Noordelijk Territorium, Australië` |
| palmJumeirah | | `Palm Jumeirah` | `Dubai, Verenigde Arabische Emiraten` |
| worldIslands | | `The World-eilanden` | `Dubai, Verenigde Arabische Emiraten` |
| grandCanyon | | `Grand Canyon` | `Arizona, Verenigde Staten` |
| meteorCrater | | `Meteor Crater` | `Arizona, Verenigde Staten` |
| lowerManhattan | | `Lower Manhattan` | `New York, Verenigde Staten` |
| lasVegasStrip | | `Las Vegas Strip` | `Nevada, Verenigde Staten` |
| hooverDam | | `Hooverdam en Lake Mead` | `Nevada en Arizona, Verenigde Staten` |
| goldenGate | | `Golden Gate` | `San Francisco, Verenigde Staten` |
| kennedySpaceCenter | | `Kennedy Space Center` | `Florida, Verenigde Staten` |
| washingtonDc | | `Washington D.C.` | `National Mall, Verenigde Staten` |
| mountStHelens | | `Mount St. Helens` | `Washington, Verenigde Staten` |
| niagaraFalls | | `Niagarawatervallen` | `Ontario, Canada` |
| panamaCanal | | `Panamakanaal` | `Gatunsluizen, Panama` |
| rioDeJaneiro | | `Rio de Janeiro` | `Suikerbroodberg en Copacabana, Brazilië` |
| paris | | `Parijs` | `Île-de-France, Frankrijk` |
| venice | | `Venetië` | `Veneto, Italië` |
| vesuvius | | `Vesuvius` | `Napels, Italië` |
| istanbul | | `Istanbul` | `Bosporus, Turkije` |
| chernobyl | | `Tsjernobyl` | `Oblast Kyiv, Oekraïne` |
| tableMountain | | `Tafelberg` | `Kaapstad, Zuid-Afrika` |
| kilimanjaro | | `Kilimanjaro` | `Kilimanjaro, Tanzania` |
| everest | | `Mount Everest` | `Nepal en China` |
| angkorWat | | `Angkor Wat` | `Siem Reap, Cambodja` |
| singapore | | `Singapore` | `Marina Bay, Singapore` |
| hongKong | | `Hongkong` | `Victoria Harbour, Hongkong` |
| tokyo | | `Tokio` | `Tokio, Japan` |
| fuji | | `Fuji` | `Shizuoka, Japan` |
| sydneyHarbour | | `Haven van Sydney` | `Sydney, Australië` |
| richat | | `Richatstructuur` | `Sahara, Mauritanië` |
| greatBlueHole | | `Great Blue Hole` | `Lighthouse Reef, Belize` |
| boraBora | | `Bora Bora` | `Genootschapseilanden, Frans-Polynesië` |
| hardyReef | | `Hardy Reef` | `Groot Barrièrerif, Australië` |
| male | | `Malé` | `Noord-Malé-atol, Maldiven` |
| deadSea | | `Zoutpannen van de Dode Zee` | `Zuidelijk bekken, Israël en Jordanië` |
| binghamCanyon | | `Bingham Canyon-mijn` | `Utah, Verenigde Staten` |
| mountWhaleback | | `Mount Whaleback-mijn` | `Pilbara, Australië` |
| etna | | `Etna` | `Sicilië, Italië` |
| santorini | | `Santorini` | `Cycladen, Griekenland` |
| teide | | `Teide` | `Tenerife, Spanje` |
| kilauea | | `Kīlauea` | `Hawaï, Verenigde Staten` |
| craterLake | | `Crater Lake` | `Oregon, Verenigde Staten` |
| glenCanyonDam | | `Glen Canyon-dam` | `Page, Arizona, Verenigde Staten` |
| gardenCity | | `Ronde akkers van Garden City` | `Kansas, Verenigde Staten` |
| almeria | | `Kassen van Almería` | `Andalusië, Spanje` |
| gibraltar | | `Gibraltar` | `Straat van Gibraltar` |
| suezCanal | | `Suezkanaal` | `Ismaïlia, Egypte` |
| aswanDam | | `Aswandam` | `Nassermeer, Egypte` |
| wadiRum | | `Wadi Rum` | `Akaba, Jordanië` |
| sossusvlei | | `Sossusvlei` | `Namibwoestijn, Namibië` |
| victoriaFalls | | `Victoriawatervallen` | `Zambia en Zimbabwe` |
| threeGorges | | `Drieklovendam` | `Hubei, China` |
| shanghai | | `Shanghai` | `Huangpu, China` |
| itaipu | | `Itaipudam` | `Brazilië en Paraguay` |

`Ronde akkers`, not `graancirkels`: these are irrigated circular fields, and `graancirkels` means the mysterious
formations. A multi-word name joined to a noun takes a hyphen (`Glen Canyon-dam`, `The World-eilanden`).

---

## 5. Grammar strategies for runtime slots

### [PLACE]: no inflection possible

- **Insert as-is.** No article, no case, no genitive, no capitalisation change. The English rule that adds `the`
  before oceans, seas and deserts (`placeInProse`, `placeParts`) is off for `nl`, and no Dutch article goes in its
  place: a frame that writes `de [PLACE]` turns a town into `de Waterloo`.
- **Gazetteer names arrive in English** (the geocoders are asked in English) or in local script. A Dutch reader will
  see `naar The Hague`, `over Pacific Ocean`, `Paris`. That is correct by these rules; do not "fix" it at runtime.
- **Put it after a preposition that takes any name:** `naar [PLACE]`, `over [PLACE]`, `van [PLACE]`,
  `boven [PLACE]`, `bij [PLACE]` (proximity, as in `Speld geplaatst bij Waterloo`). Never `in` / `op` before [PLACE]
  (`in Waterloo` but `op Texel`, `op Sicilië`): the code cannot know which one a name takes.
- **End the sentence on it** where you can (`keek naar Waterloo`), which keeps the serif accent last, as in English.
- **Never start a sentence with [PLACE].** Names can begin with `’s` (`’s-Hertogenbosch`) or a lowercase particle, and
  `cap()` would mangle them. `Waterloo was inside its 290 km swath.` becomes `De plek lag binnen de opnamestrook van
  290 km.` A title is not a sentence and may open on the place: `Waterloo, jaar na jaar`.
- **Refer back without naming it:** `de plek`, `deze plek`, or the gender-free pronominal adverb `er`
  (`vloog er één keer overheen`, `wat er overheen vloog`). Never `het` or `zijn` for a place, and never `erover`
  for "over it" (it reads as "about it").
- **No genitive.** `Timelapse van [PLACE]`, never `[PLACE]’s timelapse`. Aria: `Deze week van [PLACE] delen`.
- No quotation marks around place names, except a search query quoted back (`Niets gevonden voor “Waterloo”.`).

### [SAT] as subject: no gender known

- **Bare name, no article:** `Sentinel-2C keek …`, `ISS (ZARYA) vloog …`. Never `De Sentinel-2C`, `het ISS`.
- **Singular verb always**, whatever the name looks like: `Landsat 9 keek`, `NOAA-21 streek over`.
- **No pronoun back to it**: not `hij`, `zij`, `het`, and not the possessive `zijn`. Instead:
  - repeat a noun: `De satelliet staat 35.778 km boven de evenaar …`
  - make the instrument the subject: `De camera keek recht naar beneden.`, `De radar keek 31,2° opzij.`
  - pivot to a generic plural: `Weercamera’s scannen ’s nachts in infrarood door: ze zagen je wolken, niet je
    straten.`
  - use `zich`, which has no gender: `de hele aardschijf onder zich`.
  - a known noun takes its own pronoun: `Als het station nog in de zon stond, trok het …`.
- **Nameless satellite** (`sat` undefined): each sentence writes the form it needs: subject `Een satelliet vloog …`,
  object or after a preposition `… is van een satelliet.` The label alone (`aSatellite`) is `Een satelliet`.
- **Never compound a satellite name with a noun.** `het beeld van Sentinel-2C`, never `Sentinel-2C-beeld`. Sensor and
  programme names may form hyphenated compounds in hand-written copy (`de VIIRS-camera`, `VIIRS-beelden`,
  `NASA-weermozaïeken`), but `van` is always the safer choice.
- Sensor and product names: `het instrument VIIRS`, `de MSI-camera`, `GeoColor`. Never translated.

### [NUM] and plural categories

Dutch (CLDR `nl`) has two categories: `one` (exactly 1, no decimals) and `other` (0, 2 and up, any decimal). Every
counted string needs both, even when they are identical. Prose turns 0 into `geen`; readouts and tiles show `0`.

| Noun | `one` | `other` | Note |
|:--|:--|:--|:--|
| satellite | `[NUM] satelliet` | `[NUM] satellieten` | |
| pass | `[NUM] overvlucht` | `[NUM] overvluchten` | |
| image | `[NUM] beeld` | `[NUM] beelden` | |
| photo | `[NUM] foto` | `[NUM] foto’s` | |
| scene | `[NUM] opname` | `[NUM] opnamen` | |
| clear look | `[NUM] heldere opname` | `[NUM] heldere opnamen` | Zero: `Geen heldere opname`. |
| mosaic | `[NUM] mozaïek` | `[NUM] mozaïeken` | |
| radar image | `[NUM] radarbeeld` | `[NUM] radarbeelden` | |
| object | `[NUM] object` | `[NUM] objecten` | |
| orbit | `[NUM] baan` | `[NUM] banen` | |
| frame | `[NUM] frame` | `[NUM] frames` | |
| match | `[NUM] treffer` | `[NUM] treffers` | Zero: `Geen treffers`. |
| row | `[NUM] rij` | `[NUM] rijen` | |
| times (occurrences) | `[NUM] keer` | `[NUM] keer` | Invariable. Never `keren`. |
| hour | `[NUM] uur` | `[NUM] uur` | Invariable after a number. Never `uren`. |
| year | `[NUM] jaar` | `[NUM] jaar` | Invariable after a number. |
| minute | `[NUM] minuut` | `[NUM] minuten` | Cadence `elke [NUM] minuten`; `one`: `elke minuut`. |
| day | `[NUM] dag` | `[NUM] dagen` | A one-day window: `24 uur`. |
| second | `[NUM] seconde` | `[NUM] seconden` | Readouts use `s`. |

The verb agrees with the category too: `[NUM] beeld is` / `[NUM] beelden zijn`, `keek` / `keken`, `die overvlucht
wordt` / `die overvluchten worden`. Put the verb in both forms of the template.

Adjectives before a counted `het`-word change with the category: `1 ander beeld` but `2 andere beelden`; `de`-words do
not (`1 andere radarsatelliet`, `7 andere radarsatellieten`). Write the adjective into both forms.

`één` with accents only where the English spells the number out or where `een` could be read as the article:
`vloog er één keer overheen`, `één per jaar`. Where the English has a digit or a mono number, use the digit:
`1 satelliet`. At the start of a sentence it is `Eén`, but **no mono caps label opens on `Eén`** (CSS turns it into
`EÉN`); a lowercase `één` inside a label uppercases correctly to `ÉÉN`: `Elk jaar één heldere opname · sinds 2015`.

### Verdict names inside sentences

Titles are names, not words to inflect or lowercase into a count. The English lowercases titles into counts
(`3 watched, 12 likely watched`); Dutch never does.

- Spoken summaries put the title first, then the count, so nothing has to agree:
  `Tijdlijn, 7 dagen: Bekeken 3, Waarschijnlijk bekeken 31, Kon hierheen kijken 12, Vloog over je heen 40.`
  The tile pattern `[NUM] overvluchten: [Titel]` stays.
- Where a note says a pass "counts as watched" or is "shown as likely", Dutch uses the verdict's participle phrase
  lowercase, unquoted: `telt als bekeken`, `worden getoond als waarschijnlijk bekeken`.
- Where the English quotes a title as a name, Dutch quotes it in curly quotes: `dan noemen we dat “kon hierheen
  kijken”.`

### Lists of names

`Intl.ListFormat('nl', { type: 'conjunction' })`: `Umbra, Capella en ICEYE` (no comma before `en`); two names
`Umbra en Capella`.

`A, B and 7 other radar satellites` → `Umbra, Capella en 7 andere radarsatellieten` (`one`: `Umbra, Capella en
1 andere radarsatelliet`). The whole sentence:

- several satellites: `Radar heeft geen licht nodig. Umbra, Capella en 7 andere radarsatellieten kwamen 1.204 keer
  binnen bereik.`
- one satellite: `Radar heeft geen licht nodig. Umbra kwam 3 keer binnen bereik.` (`one` pass: `… kwam één keer …`)

The verb (`kwam` / `kwamen`) follows how many satellites the list holds, not the number of passes, so this template
takes its plural from the satellite total. `keer` does not change.

### Dates and times inside sentences

- Day: `op` + date; clock: `om` + time; approximate: `rond`. `op zondag 1 november om 11:21 plaatselijke tijd`,
  `rond 07:49 CET`.
- In sentences weekdays and months are written in full and in lowercase: `zondag 1 november`, `Tussen 29 oktober en
  5 november`. No comma between weekday and date, no ordinal (`1e`), no leading zero on the day.
- The clock arrives with its zone abbreviation; add nothing: `om 16:14:21 UTC`, `om 10:52 EST`. Never `uur` after
  it, never Dutch zone names (`MET`).
- `plaatselijke tijd` only in the share post, after a clock that has no zone.
- Relative time in a sentence: `41 uur geleden`, `zojuist`, `over 3 uur`.
- A window: `de afgelopen 7 dagen`. `deze week` is the voice word for the same window; where the exact span matters
  (kicker, headline), say `afgelopen 7 dagen`, because `deze week` can be read as the calendar week from Monday.
- `t/m` (inclusive) where a span ends on a day: `7 dagen t/m zo 1 nov 2026`. `tot` alone reads as exclusive.

---

## 6. Typography and formatting

**Quotation marks.** Double curly quotes `“ ”`, single `‘ ’` inside them. Never straight quotes, never `„ ”`.
`dan noemen we dat “kon hierheen kijken”.`

**Apostrophe.** Always U+2019 `’`: `foto’s`, `camera’s`, `video’s`, `’s nachts`, `zo’n`. A word-initial `’s` must not
be autocorrected to an opening quote `‘s`. No possessive `’s`: write `van NASA`, not `NASA’s`.

**Ellipsis.** The single character `…` (U+2026), straight after the word: `Beeld klaarmaken…`, `Bepalen…`.

**Dashes and arrows.** No em dashes in product copy (owner rule). En dash `–` without spaces for numeric ranges only:
`10–30 m`, `2015–2026`. Date ranges and time spans use the house arrow with spaces: `1 → 8 nov 2026 UTC`,
`29 okt → 5 nov`, `16:14:21 → 16:18`; never the spaced en dash that `Intl` `formatRange` returns
(`29 okt – 5 nov`). For an aside use a comma or a colon. `—` stays the readout placeholder for an unknown value.

**Spaces before punctuation.** None. No space before `%`, `°`, `:`, `;`, `?`.

**Numbers.**
- Decimal comma, thousands point: `7,46`, `1.715`, `35.778`. This is what `fmt('nl')` (`Intl.NumberFormat('nl')`)
  returns; use it, never hand-format.
- Never group years, NORAD IDs, pass IDs or clocks: `2026`, `NORAD 62261`.
- Minus sign `−` (U+2212) in signed values, as the English does (`Intl` returns a hyphen; the formatter swaps it).
- Percent and degrees without a space: `25%`, `98,6°`. Other units after a no-break space: `786 km`, `7,46 km/s`,
  `10 m`, `4 min 12 s`.
- Coordinates: international, never localised (§4.3). The search hint and the search-down message show the syntax
  the field accepts: `Coördinaten zoals 43.47, −80.54 werken nog steeds.`; the hint itself says `Naam, adres of
  coördinaten`, so no decimal comma collides with the separator.

**Dates.**
- Prose: `zondag 1 november`, `vrijdag 6 november` (screen readers), lowercase.
- Short mono readouts and chips, as `Intl` gives them, no full stops: `zo 1 nov`, `29 okt`, `zo 1 nov 2026`.
  Weekdays `ma di wo do vr za zo`; months `jan feb mrt apr mei jun jul aug sep okt nov dec`. The timeline's compact
  day: `zo 1`.
- Ranges: built from `formatToParts` day and month pieces, month and year written once when both ends share them:
  `1 → 8 nov`, `29 okt → 5 nov`, `29 dec 2026 → 5 jan 2027 UTC`.
- ISO stamps stay ISO: `2026-11-08 03:31:07 UTC`, `2026-11-08 03:34Z`.
- In caps `ZO` is both Sunday and south-east. They never share a cell; keep it that way.

**Time.** 24 hours with a colon and leading zero: `07:49`, `16:14:21`. No `u`, `uur` or `h` after a clock, no
a.m./p.m. Durations: `38 s`, `4 min 12 s`, `1 uur 02 min` (not `1 u`, which reads as the formal pronoun, not `1 h`).

**Relative time.**
- Compact (`time.relative`, the HUD age): built by hand from `relativeParts`: `zojuist`, `12 min geleden`,
  `41 uur geleden` (hours up to 48, as the English), `3 dagen geleden` / `1 dag geleden`, future `over 3 uur`. Never
  `Intl` `short` or `narrow` for `nl`: they print `12 min. geleden` and `3 dgn geleden`.
- Spoken (`relativeSpoken`): `Intl` `long` is right as it is: `12 minuten geleden`, `1 minuut geleden`, `41 uur
  geleden`, `3 dagen geleden`, `over 3 uur`.
- `min` takes no full stop.

**Capitalisation.**
- Sentence case everywhere: headings, buttons, tabs, titles. Dutch never uses title case: `Wat we niet kunnen zien`.
- Lowercase: months, weekdays, compass words, `aarde`, `zon`, `maan` in prose.
- `IJ` is one letter for capitalisation: `IJsland`, `IJmuiden`. CSS `text-transform: uppercase` gets it right;
  capitalising the first character in JavaScript does not (`Ijs`). Never run `cap()` or `text-transform: capitalize`
  on Dutch strings. Never use the ligature `ĳ` (U+0133).
- At a sentence start: `Eén`, `’s Nachts` (capital on the word after `’s`).
- Agency acronyms stay as written: `NASA`, `ESA`, `EUMETSAT`, `NOAA`, `USGS`.

**Uppercase mono labels.** Written in sentence case in the catalogue and uppercased by CSS (`lang="nl"` on the
document). Diacritics stay: `MOZAÏEKPIXEL`, `COÖRDINATEN`, `KOPIËREN`, `ÉÉN`. No label opens on `Eén` (it would
render `EÉN`). Never uppercase: the domain `www.watched.earth`, the wordmark, `’s`-forms, unit symbols in prose, place
names in sentences. The time-lapse video uppercases its own words with `toLocaleUpperCase('nl')`; the same rules
hold.

**Line breaking.** Headlines never hyphenate. Long compounds may break at the compound seam: give the long ones a soft
hyphen (`aardobservatie­satellieten`). Do not break a word at a trema (`coördinaten`, `mozaïek`). Keep `7&nbsp;dagen`,
`[NUM]&nbsp;km`, `16:14&nbsp;UTC` together.

**Abbreviations.** None in copy. In particular `bijv.`, `nl.`, `o.a.`, `ca.`, `dgn`, `WAARSCH.`, `sat`, `sats` are out;
reword or choose a shorter word instead. Unit symbols are not abbreviations (`km`, `m`, `s`, `min`). The one sanctioned
abbreviation is `t/m` in the week card's stamp (`7 DAGEN T/M ZO 1 NOV 2026`), which every Dutch reader knows from
calendars, timetables and shop signs (`MA T/M VR`).

**Compounds.** Dutch closes compounds: `radarsatelliet`, `weermozaïek`, `beeldarchief`, `grondspoor`, `wolkenschaduw`,
`daglichtcamera`. Writing them apart (`radar satelliet`) is the most common error in Dutch UI. Hyphen when one part is
an abbreviation or contains a digit: `TLE-epoche`, `H.264-encoder`, `ISS-overvlucht`, `NASA-weermozaïeken`,
`3D-weergave`. Hyphen between vowels that would merge (`zonne-energie`) and after a multi-word name (`Glen
Canyon-dam`).

---

## 7. Length discipline

Dutch UI strings run about 15–30% longer than English (long single-word compounds, separable verbs, articles); prose
runs about 10–20% longer. The budget is the English width, so:

- Readout labels are nouns, never verb phrases: `HOOGTE`, not `HOE HOOG`.
- Drop articles in labels and chips: `Bewolking hier`, not `De bewolking hier`.
- A compound is shorter than a `van`-phrase: `grondafstand`, not `afstand over de grond`.
- Buttons take the infinitive with no pronoun or article: `Delen`.
- Choose the shorter of two equal words: `plek` over `locatie`, `beeld` over `afbeelding`, `timelapse` over
  `tijdsverloop`.
- Never abbreviate to save room; reword instead.
- **One key, one context.** A key that also appears somewhere roomier still gets the short form if one of its places
  is tight (`Kopiëren`). Keep the longer phrase on keys that only appear where there is room (`Opnieuw proberen` on the
  fault notice and the time-lapse retry; `Opnieuw` in the share sheet and on a photo).
- Budgets: timeline lane labels ≤ 8 characters; share sheet buttons ≈ 11; summary card readout labels ≤ 12; verdict
  tile titles ≤ 24 (two to a row); HUD corner lines about as long as the English; computing rows ≤ 40; chips on the
  phone landing ≤ 14.

| English | chars | nl | chars | Note |
|:--|--:|:--|--:|:--|
| SURPRISE ME | 11 | VERRAS ME | 9 | |
| USE MY LOCATION | 15 | MIJN LOCATIE | 12 | Wide screens and the accessible name only. `MIJN LOCATIE GEBRUIKEN` (22) ellipsised the placeholder at 1024 px. |
| LOCATE ME / NEAR ME | 9 / 7 | MIJN PLEK / MIJN PLEK | 9 / 9 | They share the search line with the input. |
| LOCATING… | 10 | BEPALEN… | 8 | Not `ZOEKEN…`: that is the search status. |
| HOW THIS WORKS | 14 | HOE HET WERKT | 13 | |
| SCENE 11:21:13 EST | 18 | TOEN 11:21:13 EST | 17 | HUD top right on a 375 px phone. `HERHALING` (22) would collide with the top-left link. |
| SUN 16.2°S 063.0°E | 18 | ZON 16.2°S 063.0°E | 18 | |
| LAST 7 DAYS | 11 | AFGELOPEN 7 DAGEN | 17 | Where it must be tight: `7 DAGEN`. Not `LAATSTE 7 DAGEN` ("the final 7 days"). |
| CLOSEST LOOK | 12 | SCHERPST | 8 | |
| TIME-LAPSE | 10 | TIMELAPSE | 9 | |
| OFF-NADIR | 9 | NADIRHOEK | 9 | |
| ALTITUDE | 8 | HOOGTE | 6 | |
| PASSES | 6 | OVERVLUCHTEN | 12 | Rule notches have room: `02 / OVERVLUCHTEN`. |
| PHOTO · LIKELY · COULD · OVERHEAD | 5/6/5/8 | BEELD · STROOK · BEREIK · HEMEL | 5/6/6/5 | Lane and week-card labels. |
| COPY LINK · POST TO X · SAVE PNG | 9/9/8 | KOPIËREN · OP X ZETTEN · PNG OPSLAAN | 8/11/11 | Three buttons on a 360 px phone. |
| TRY AGAIN (share sheet) | 9 | OPNIEUW | 7 | |
| COPY IMAGE | 10 | BEELD KOPIËREN | 14 | Desktop only. |
| POST (label) | 4 | TEKST | 5 | 48 px column. |
| DOWNLOAD IMAGE | 14 | BEELD DOWNLOADEN | 16 | Not `AFBEELDING DOWNLOADEN` (21). |
| REPLAY | 6 | AFSPELEN (button) / HERHALING (section) | 8 / 9 | Tablets: `DEZE OVERVLUCHT AFSPELEN` (24). |
| CHECK YOUR PLACE | 16 | ZOEK JOUW PLEK | 14 | Narrow phones: `JOUW PLEK`. |
| SEE WHAT WATCHED YOU | 20 | WAT KEEK ER NAAR JOU? | 21 | Card footer beside the domain. |
| 7 DAYS TO SUN 1 NOV 2026 | 24 | 7 DAGEN T/M ZO 1 NOV 2026 | 25 | Card stamp, about 26 fit. |
| MOSTLY CLOUD · 81% | 18 | VOORAL WOLKEN · 81% | 19 | |
| ONE CLEAR LOOK A YEAR · SINCE 2015 | 34 | ELK JAAR ÉÉN HELDERE OPNAME · SINDS 2015 | 40 | Measure at 320 px. |
| 11 CLEAR LOOKS · ONE EACH AUTUMN | 32 | 11 HELDERE OPNAMEN · ELKE HERFST | 32 | |
| VERIFYING NASA WEATHER MOSAICS · 12 / 35 | 40 | NASA-WEERMOZAÏEKEN CONTROLEREN · 12 / 35 | 40 | Longest computing row. |
| HOLD THE GLOBE ANYWHERE TO MOVE IT | 34 | HOUD DE BOL VAST OM TE VERPLAATSEN | 34 | One line on a 320 px phone. |

Card headline sizing: see §3.6. A typical pass card's lead (`31 satellieten keken naar`, 25) sets at 72 px against
the English 84 px; the week card sets at 62 px, as the English week card does for an ordinary place name.

---

## 8. Sensitive content

**Tone.** Watched states geometry and archive facts. It never accuses, dramatises or reassures beyond the facts. No
`spioneren`, `bespioneren`, `bespieden`, `Big Brother`, `je wordt gevolgd`, `privacy is dood`. Where the English says
"spy satellites" (About), Dutch says `spionagesatellieten`, and nowhere else.

**Privacy statements are exactly as exact as the English.** `We bewaren alleen een gebied van ongeveer 10 km.`,
`Je positie gaat naar de geocoder Photon om de plek een naam te geven.`, `Geen IP-adressen, geen eigen cookies, niets
dat het ene bezoek aan het volgende koppelt.` Do not soften (`we doen ons best`) or inflate (`volledig anoniem`). The
calming answer is factual: `Kunnen ze mij zien? Nee. … Jij staat er niet op.`

**War zones in the time-lapse.** The UI never names the war; it names the season, because every frame is taken in it.
Follow that.

| English | nl |
|:--|:--|
| Gaza Strip | `Gazastrook` |
| West Bank | `Westelijke Jordaanoever` |
| Ukraine | `Oekraïne` |
| Lebanon | `Libanon` |
| Crimea | `de Krim` |
| Israel | `Israël` |
| one each autumn / winter / summer / spring | `[NUM] heldere opnamen · elke herfst` / `elke winter` / `elke zomer` / `elke lente` |

Use `lente`, not `voorjaar`, so the four seasons read alike. No words such as `verwoest`, `bezet`, `bevrijd`,
`zogenaamd` in product copy. The frames show what they show.

**Glaciers.** `gletsjer` (de), pl. `gletsjers` (not `gletscher`). `einde van het smeltseizoen`, `half augustus`
(north), `half februari` (south). No `verdwijnend`, `dramatisch`, `klimaatramp`.

**Place-name politics.**
- Country and territory names come from `Intl.DisplayNames('nl', { type: 'region' })` and are used as they come:
  `Oekraïne`, `Palestijnse gebieden`, `Taiwan`, `Kosovo`, `Westelijke Sahara`, `Noord-Macedonië`, `Myanmar (Birma)`,
  `Ivoorkust`, `Eswatini`, `Hongkong SAR van China`. Never add a qualifier, never attach a country to a territory in
  hand-written copy. In the hand-written curated sublabels Hong Kong is `Hongkong`.
- Gazetteer names are inserted as delivered (§5); do not "fix" them at runtime.
- In hand-written copy use the Ukrainian-based spellings that Dutch and Flemish public media use: `Kyiv` (not
  `Kiev`), `Charkiv`, `Lviv`, `Dnipro`.
- `Taiwan` is `Taiwan`: never `Republiek China`, `Chinees Taipei` or `provincie Taiwan`.
- Never `Holland` for the Netherlands; it is `Nederland`. Never treat `Vlaanderen` and `België` as the same thing.

**Two regions, one text.** Avoid words that belong to only one side of the border, or that mean different things on
each side:
- Netherlands-only: `gaaf`, `lekker`, `hartstikke`, `mobieltje`, `pinnen`, and the UX softener `even`
  (`Even geduld`).
- Flanders-only: `gsm`, `plezant`, `goesting`, `content` (happy), `een foto nemen` (standard: `een foto maken`), `14 u`
  for a time.
- Different meanings: `wellicht` and `allicht` mean "perhaps" in the Netherlands and "probably" in Flanders. They never
  appear in the likely / could gradation or anywhere near `waarschijnlijk`. `tot` before a day reads as exclusive:
  use `t/m` where the day is included.
- Neutral choices made in this guide: `telefoon`, `downloaden`, `tik`, `veeg` (`Veeg voor meer`), `foto maken`,
  `plaatselijke tijd`, `Gemaakt door`.

---

## 9. Pitfalls and the reviewer's checklist

### False friends and calques

| English | Wrong | Right | Why |
|:--|:--|:--|:--|
| actual pictures | `actuele beelden` | `echte beelden` | `actueel` means current. |
| eventually | `eventueel` | `uiteindelijk` | `eventueel` means possibly. |
| image | `imago` | `beeld` | `imago` is reputation. |
| public | `publiek` | `openbaar` | `publiek` is an audience. |
| scene | `scène` | `opname` | A fuss, a theatre scene. |
| pass | `pas` | `overvlucht` | `pas` is a card, a step or "only". |
| operator | `operator`, `beheerder` | `exploitant` | `operator` is a telephone or network operator; `beheerder` is a site admin. |
| swath | `zwad` | `opnamestrook` | `zwad` is mown grass. |
| heading (direction) | `kop` | `koers` | |
| to track | `tracken` | `volgen` | |
| to propagate (orbits) | `propageren` | `doorrekenen` | Jargon. |
| closest look | `dichtstbijzijnde opname` | `het scherpste beeld` | It is the most zoomed-in clear photo, not the nearest. |
| could have watched | `had kunnen kijken` | `kon … kijken` | Counterfactual. |
| has watched since 1999 | `heeft sinds 1999 gekeken` | `kijkt sinds 1999` | Ongoing state. |
| in 3 h | `in 3 uur` | `over 3 uur` | `in` gives a duration. |
| 41 hours / 3 times | `41 uren` / `3 keren` | `41 uur` / `3 keer` | Invariable after numbers. |
| field of view | `kijkhoek` for off-nadir | `nadirhoek` | `kijkhoek` is the field of view. |
| Share | `Sharen` | `Delen` | |
| Built by | `Gebouwd door` | `Gemaakt door` | |
| take a photo | `een foto nemen` | `een foto maken` | Flemish usage and a calque. |
| crop circles (Garden City) | `graancirkels` | `ronde akkers` | Irrigated fields, not the mysterious formations. |
| In the last 7 days, … | comma after the phrase | no comma, verb second | |
| No satellite we track watched | no comma | `Geen satelliet die we volgen, keek` | Two finite verbs side by side. |
| What passed over you? | `over jou` | `over je heen` | `over jou` reads as "about you". |
| 7 days to Sun 1 Nov | `tot zo 1 nov` | `t/m zo 1 nov` | `tot` excludes the day. |

### Words with two jobs in English

- **watched**: prose `kijken naar`; title `Bekeken`; brand `Watched.` (untouched). Never `gezien`.
- **see / saw**: `zien` where the English says it (the reader sees, a camera saw only cloud); never for what a
  satellite did to the place in headlines and verdicts.
- **view**: the gallery's View button is `Openen`; `in view` (geometry) is `in zicht`; `passed within view` is
  `binnen bereik`. Never `Bekijken` anywhere near `Bekeken`.
- **pass**: always `overvlucht`; the verb is `vloog over` / `voorbij`.
- **scene**: an image is an `opname`; the HUD's replay clock is `Toen`.
- **closest**: a real distance or moment is `Dichtstbij` / `dichtste nadering` (`Dichtstbij · UTC`, the row's
  `Dichtstbij`, the card readout); the lead photo's "closest look" is `Scherpst` / `het scherpste beeld`.
- **look**: the tags `Scherpst` / `Laatst helder`; a time-lapse "clear look" is a `heldere opname`.
- **image / photo / picture / frame**: `beeld` / `foto` (§4.2) / `beeld` / `frame`, never interchanged. Radar is
  never a `foto`.
- **place / spot / location / position**: `plek` / `plek` (`precies je plek`) / `locatie` (GPS) / `positie`.
- **overhead**: lane `HEMEL`; title `Vloog over je heen`; prose `recht over`, `bijna recht omhoog`.
- **replay**: the section `Herhaling`; the button `Afspelen`.
- **ZO**: Sunday and south-east in caps; never in one cell.

### Reviewer's checklist

Run every translated string through this list.

1. **Register.** `je` / `jou` only; stressed forms only where stress falls; no `u` anywhere. Action buttons in the
   infinitive; my/me buttons in the first person; "your" invitations in the `je`-imperative.
2. **Product verb.** `kijken naar` / `Bekeken`; `zien` only where the English says see; never `gefotografeerd`,
   `bespied`; never `[NUM] bekeken`.
3. **Glossary.** Every term is the glossary's word; one English word, one Dutch word, everywhere.
4. **Verdicts** match `VERDICT_META` letter for letter (title, lane, unit, definition, verb); `kon`, never `had …
   kunnen`; inline forms as in §5.
5. **Slots.** [PLACE] after `naar` / `over` / `van` / `boven` / `bij`, never sentence-initial, no article, no
   genitive, no `erover`. [SAT] bare, singular verb, no pronoun or `zijn` back to it; nameless forms written out.
6. **Plurals.** Both `one` and `other` filled and agreeing (noun, verb, adjective); `uur`, `keer`, `jaar` invariable;
   prose zero is `geen`.
7. **Numbers.** Digits where the English has digits, words where it spells them; decimal comma; thousands point;
   years and IDs ungrouped; `25%`, `98,6°` tight; a no-break space before other units; `−` for minus.
8. **Coordinates** international (`52.3676°N 4.9041°E`), untouched; Dutch letters only in bearings; a geostationary
   seat in a sentence in words (`op 0,2° westerlengte`).
9. **Word order and commas.** Verb second in main clauses; no comma after a fronted adverbial; a comma between two
   finite verbs; short subclauses; the sentence ends on the place, the number or the unknown.
10. **Tense.** Simple past for events, present perfect for states and open questions, present with `sinds`.
11. **Compounds.** Closed (`radarsatelliet`); hyphenated with abbreviations and digits (`TLE-epoche`); no satellite name
    in a compound.
12. **Typography.** `’` (U+2019) in `foto’s` and `’s nachts`; `“ ”`; `…`; no em dash; en dash only in numeric ranges;
    the arrow in date ranges and spans.
13. **Dates and times.** `Intl` short forms in mono, full forms in prose; ranges with the arrow, never `formatRange`;
    relative times built by hand in compact form; no `plaatselijke tijd` in pass sentences; `t/m` in the week stamp.
14. **Capitals.** Sentence case; months, weekdays, compass words, `aarde`, `zon` lowercase; `IJ`; `Eén` at a sentence
    start; no mono caps label opening on `Eén`; no `cap()` on Dutch.
15. **Length.** Within the budgets in §7; no abbreviation except `t/m`.
16. **Honesty.** The label says exactly what is on screen: `PIXEL` not `RESOLUTIE`, `BEELD` not `FOTO` on the imaged
    lane, `foto` only where §4.2 allows, `Minstens` only while the count can grow, `de hele aardschijf`.
17. **Voice.** No marketing, no softeners, no exclamation marks, no emoji; questions only in About, the hooks and the
    card's closing question and footer.
18. **Never translated.** Brand, domain, satellite, sensor and product names, agency acronyms, NORAD IDs, `UTC`, zone
    abbreviations, coordinates, ISO stamps, and the licence attribution lines (`Contains modified Copernicus Sentinel
    data 2026`, `Contains modified EUMETSAT Meteosat data 2026`, `Landsat: USGS / NASA`, `NASA GIBS / EOSDIS`), which
    stay in English as the data licences word them.
19. **Read it aloud.** If it would not sound right from a news presenter on NOS or VRT, rewrite it.

---

## Appendix: notes for engineering (no extra cost, no extra latency)

The owner's requirement for this work: it must not cost more to run and must stay fast for the visitor. Nothing in
this guide needs a paid service, a network request, a library or a new download.

- Dates, numbers, plurals, lists and country names come from the browser's built-in `Intl` (`DateTimeFormat`,
  `NumberFormat`, `PluralRules`, `ListFormat`, `DisplayNames`, `RelativeTimeFormat`) through `api/_lib/i18n`
  (`fmt('nl')`, `formatDate`, `relativeParts`). No translation API at runtime.
- Two formatter details, both pure string work on values the app already has:
  - compact relative times for `nl` are built from `relativeParts` (`${n} min geleden`, `${n} uur geleden`,
    `${n} dagen geleden`), never `Intl` `short` / `narrow`; the spoken form uses `Intl` `long`;
  - date ranges are built from `formatToParts` pieces with the arrow, never printed from `formatRange`.
- Coordinates keep the shared international formatters (`fmtLat`, `fmtLon`, `fmtCoords`, the HUD's `sun`): no fork.
- When the results sentences move into a catalogue, the geostationary sentence's message takes the seat's longitude
  as a number (it is `p.track[0].lon` today), so Dutch can write `op 0,2° westerlengte`. Same data, no cost.
- Fonts: every Dutch character (`ë ï ö é ü`, `ÉÉN`, `’`, `…`, `−`, `→`) is in the Latin subset the three fonts already
  load. Dutch adds no font files and no bytes to the font payload.
- Set `lang="nl"` on `<html>` when Dutch is active, so CSS uppercasing and hyphenation use Dutch rules.
- The Dutch catalogue loads only for Dutch visitors (its own chunk), so English visitors download nothing more.
- Telemetry: an error event's `msg` is the sentence the visitor read (CLAUDE.md). With Dutch text it would split the
  admin page's error counts by language. Keep sending the English sentence (or a stable key) in `msg`. A language
  property on analytics events would be stored as null until a migration allow-lists it; do not add one without
  asking the owner.
- Share cards are rendered by the Worker with the same bundled fonts; Dutch card text adds no requests. The card's
  `l=nl` link gives one cache entry per link, as for every language.

---

## Decisions log

The critique's 40 items (38 numbered, the missing-keys table, and the note on English gazetteer names): 31 accepted,
8 partly accepted, 1 rejected.

| # | Item | Resolution |
|---|---|---|
| 1 | Coordinates contradict the i18n contract | Accepted: coordinates international everywhere (§4.3, §6); Dutch letters for bearings only; prose seat `op 0,2° westerlengte`, with the engineering note on passing `lon` as a number. |
| 2 | Geostationary "het hele aardoppervlak" is wrong | Accepted: `de hele aardschijf onder zich`, `De scanlijn bereikte …` (§3.4). |
| 3 | `FOTO` on things that are not photos | Accepted: lane `BEELD`, `beeld` in gallery, viewer and card strings, a §4.2 table of where `foto` may stand; `footerNote` and `verdictMore.likely` also take `beeld`. |
| 4 | `had … kunnen` against `kon` | Accepted: `kon` throughout, with `Of dat ook gebeurd is, kunnen we niet weten.` (§3.4, §3.6). |
| 5 | Hook "Ook naar jou keek deze week iets." | Accepted: `Iets keek deze week ook naar jou.` for the post and the results invite. |
| 6 | "over jou" reads as "about you" | Accepted: `Wat vloog er deze week over je heen?` |
| 7 | Comma between two finite verbs | Accepted: zero headlines, card lead, `passView.empty`; rule added to §2. |
| 8 | `Intl` relative times | Accepted: compact forms built from `relativeParts`; spoken forms from `Intl` `long` (§6, appendix). |
| 9 | `formatRange` gives a spaced en dash | Accepted: the house arrow for every date range, built from `formatToParts` (§6). |
| 10 | Share-sheet buttons overflow at 360 px | Accepted: `Kopiëren`, `Op X zetten`, `PNG opslaan`, `Gekopieerd`, sheet `Opnieuw`; "one key, one context" rule in §7. |
| 11 | Locate labels too long on phones | Partly accepted: `Mijn plek` for `locateMe` and `nearMe`, `Positie opvragen`, `Naam opzoeken`; `locating` is `Bepalen…`, not `Zoeken…` (which is the search status on the same field), and `cancelLocating` `Locatie bepalen annuleren`. |
| 12 | Lane labels `WAARSCH.` and `BOVEN` | Accepted: `BEELD` / `STROOK` / `BEREIK` / `HEMEL`; `WAARSCH.` removed as the guide's abbreviation. |
| 13 | `Eén` at the start of a caps label | Accepted, wording tuned: `Elk jaar één heldere opname · sinds 2015`, `11 heldere opnamen · één per jaar`; the season caption shortened to `elke herfst` to match the English length. |
| 14 | HUD "Scene" is a clock | Partly accepted: not `opname`; but `Toen` instead of `Herhaling`, which is 4 characters longer and would collide with the top-left link on a 375 px phone. |
| 15 | Verdict names inside sentences | Accepted: title-first spoken summaries, `telt als bekeken`, `worden getoond als waarschijnlijk bekeken`, quoted `“kon hierheen kijken”` in About (§5), with `one` / `other` forms of the GIBS notes. |
| 16 | Computing rows overflow at 390 px | Accepted, with `NASA-weermozaïeken` in both weather rows for consistency (40 characters, as the English). |
| 17 | Card headline sizes misstated | Partly accepted: sizes corrected; the critique's English figure for the week card was also wrong (its `this week` sits on the serif line, so English is 62 px too); option (a), the standard order, chosen; (b) rejected because the same message is the post's first sentence. |
| 18 | The ban on `zien` is too broad | Accepted (§2). |
| 19 | "Kan het mij zien?" uses `het` | Accepted, answer tuned: `Kunnen ze mij zien?` … `Jij staat er niet op.` (the idiom for being in a picture). |
| 20 | The argument against `u` is wrong | Accepted: reasoning rewritten (register and the Flemish object `u`), §1. |
| 21 | "Mono caps: nouns only" contradicts caps strings | Accepted: the rule now covers readout labels only. |
| 22 | Digits below 20 override the owner | Accepted: mirror the source (§2, §5). |
| 23 | Present tense with `sinds` | Accepted, VIIRS blurb recast with `die` instead of a subjectless clause (§2). |
| 24 | `plaatselijke tijd` in pass sentences | Accepted: pass sentences take the clock with its zone; `plaatselijke tijd` only in posts. |
| 25 | `bijna recht boven je` | Partly accepted: `bijna recht omhoog`, the English "almost straight up", rather than `boven de plek`. |
| 26 | `61 km ten westen` floats | Accepted: `ten westen van de plek` in every prose use. |
| 27 | `Vloog over` adds nothing | Accepted: title `Vloog over je heen`; definition `… en al het andere.` |
| 28 | `Bekeken` reads as "viewed by you" | Accepted: kept, with the pitfall "never `[NUM] bekeken`". |
| 29 | `exploitant` → `beheerder` | Rejected: in a web app `beheerder` reads as the site's administrator, and `exploitant` is the standard Dutch term for a satellite operator (`satellietexploitant`). |
| 30 | `tot` reads as exclusive | Accepted: `7 dagen t/m zo 1 nov 2026`; `t/m` is the one sanctioned abbreviation. |
| 31 | Post label overflows | Accepted: `Tekst`. |
| 32 | Footer `kijk` / `keek` echo | Accepted: `Wat keek er naar jou?`; §2 lists it among the allowed questions. |
| 33 | Hero rectangle claim | Accepted: claim dropped, catalogue parts given (§3.1). |
| 34 | `wellicht` / `allicht` | Accepted (§8). |
| 35 | `constant lichtpunt` | Partly accepted: the clause moves to the end and into the past tense: `trok het over je hemel als een helder lichtpunt dat niet knipperde`. |
| 36 | Prose forms for "clear look" | Partly accepted: the prose forms adopted, but "closest look" is `Scherpst` / `het scherpste beeld` (the most zoomed-in clear photo), not `dichtstbij` / `dichtstbijzijnde`, which say "nearest". |
| 37 | Replay long label must begin with the short one | Partly accepted: the catalogue lets the strong part sit anywhere, so `[strong('Deze overvlucht '), 'afspelen']` keeps "this pass"; the accessible name `Deze overvlucht afspelen op de wereldbol: …` adopted. |
| 38 | "In de afgelopen 1 dag" | Accepted: `In de afgelopen 24 uur`, kicker `Afgelopen 24 uur`. |
| 39 | Missing keys table | Partly accepted: adopted into §3.7 and §4.4, with changes: `Geen treffers`, invite `Zoek jouw plek` (narrow `Jouw plek`), go aria `Overvluchten van deze plek tonen`, `droppedIn` with `er overheen` (not `erover`), `Elevatie hier`, `Deze week vooral wolken`, `De laatste heldere opname`, `Geometrie · noorden boven`, `Aswandam`, and the full curated places table. |
| 40 | Gazetteer names arrive in English | Accepted (§5). |

**Other corrections to the draft, from checking the code** (not raised by the critique):

- "Closest look" is the most zoomed-in clear photo (`src/ui/results/lib/photos.ts`), so its tag and prose are
  `Scherpst` / `het scherpste beeld`; `Dichtstbij` is kept for real distances and moments (closest approach).
- The daily mosaic sentence says `het dagelijkse NASA-mozaïek in ware kleuren`, so `van NASA` cannot attach to
  `kleuren`.
- Mostly-cloud chips are `Vooral wolken · 81%` (19 characters) instead of `Grotendeels bewolkt · 81%` (25), for the
  one-line chip over the picture.
- The time-lapse note says `We zoeken voor elk jaar een ander seizoen`: each year aims for a season and falls back to
  any clear date, so `komt uit een ander seizoen` would overclaim.
- `Intl.DisplayNames('nl')` gives `Hongkong SAR van China`; it is used as it comes, and hand-written sublabels say
  `Hongkong`.
- `Garden City Crop Circles` is `Ronde akkers van Garden City`: `graancirkels` names something else.

**On-screen review (2026-11-19)**, every state in the browser at 1024, 1280, 1440, 390 and 360 px and the share cards
rendered, against English: `useMyLocation` `Mijn locatie` (the placeholder ellipsised beside the long label at
1024 px); the pass rows' `latest` empty and `imagedOrder` `scherpste eerst` (rows and group headers ran past their
boxes). The rest fits as written; what copy cannot fix (the pass rows' meta lines beside `overvluchten`, the
three share buttons on a phone) is a layout change, reported to the coordinator. The catalogue's literal no-break spaces
(139, outside comments) are now written as ` ` escapes, as the house style asks; no string changed.
