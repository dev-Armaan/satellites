# Watched: French (fr) localisation style guide

For every translator and reviewer of the French catalog. One French catalog serves France, Belgium, Switzerland and
Quebec. Every decision here is final; where a string is not covered, extend the nearest rule rather than inventing a
new one. This is the final guide: it replaces the draft, and its last section logs how each point of the native
review was resolved.

The English source of truth is `docs/DESIGN.md` §7 (voice, verdict vocabulary), the English catalogs
(`src/i18n/en/*.ts`, with the curated places in `src/i18n/en/plain/placeNames.ts`, and the share card's
`api/_lib/i18n/card/en.ts`), the sentences still built in `src/ui/results/lib/copy.ts`, and the verdict table
`src/ui/results/lib/meta.ts` (`VERDICT_META`). Read each key's doc comment: it says where the string appears and how
much room it has.

**About the examples.** French examples in this guide contain the real no-break characters: U+00A0 (no-break space)
before `:` and `%`, between a number and its unit or noun, and between a time and its zone; U+202F (narrow no-break
space) before `;` `!` `?`, inside `« »` and as the thousands separator. They look like ordinary spaces in most
editors. **In catalog source, write them as escapes** (` `, ` `), as `src/i18n/en/landing.ts` already does,
so a reviewer can see them; never as invisible literals, never as plain spaces.

## 0. Decisions at a glance

| Question | Decision |
|---|---|
| Address | **vous**, everywhere. Never *tu*. |
| Product verb ("watched") | **observer**: *a observé*, *ont observé*, *observait*. Never *photographier*, *surveiller*, *espionner*, *regarder*. |
| Hero | `Quelque chose` / `*vous* observait` / `cette semaine.` |
| Sub | *Choisissez un lieu, n’importe où sur Terre. Vous verrez tous les satellites qui l’ont survolé ces 7 derniers jours, et les images qu’ils ont réellement prises.* |
| Verdicts | **Observé** · **Probablement observé** · **Aurait pu viser ici** · **Survolé**; lanes `IMAGE` · `PROBABLE` · `POSSIBLE` · `SURVOL`; verbs *a observé* · *a balayé* · *pouvait viser* · *a survolé*. |
| Agreement trap | No past participle or adjective may agree with *vous*, with a satellite name or with a place name. Rewrite instead (§1). |
| Honesty lines | *Nous ne pouvons pas savoir si une image a été prise.* *Impossible de…* is kept for real failures only. |
| Buttons | Infinitive: *Partager*, *Télécharger l’image*, *Rejouer*, *Réessayer*. |
| Mono labels | Nouns, no articles, accents kept on capitals: `DÉPOINTAGE`, `VUE RAPPROCHÉE`, `AU FIL DES ANS`. |
| Feature names | Time-lapse = **Au fil des ans**. Closest look = **Vue rapprochée** (closest approach stays *Au plus près*). The searched spot = *l’endroit même* in prose, *ici* in labels. |
| Numbers | Decimal comma, U+00A0 for thousands (the sans draws U+202F at 0.1 em: 2330 on screen), from `fmt('fr')`: `1 715`, `7,46 km/s`, `25 %`, `5,4°`. Years, NORAD IDs and pass IDs are never grouped. |
| Coordinates | Readouts keep the international form, point and letters: `16.2°S 063.0°E`, `43.4723°N 80.5449°W`. Prose spells them out: *par 0,2° ouest*. |
| Compass | Prose spells it out (*vers le sud*, *à l’ouest*). Bearing readouts use the French 16-point letters with **O**: `SSO`, `ONO`, `NO`. |
| Units | Written lowercase in the catalog (`km`, `m`, `km/s`). A surface that sets its line in caps keeps them lowercase, as in every language (`786 km`, never `786 KM`: DESIGN §3). |
| Dates | Prose: *dimanche 1er novembre*; readouts: *dim. 1 nov.*; display headline ranges: *Du 29 octobre au 5 novembre*. |
| Time | 24-hour with colons, in prose too: *à 16:14:21 UTC*. |
| Never translated | Watched., www.watched.earth, satellite / sensor / product / programme names, NORAD IDs, UTC, zone abbreviations (EST, CET, JST), ISO stamps, readout coordinates, key symbols, attribution lines. |

## 1. Register and address

### 1.1 The decision: *vous* on every surface

| Surface | Address and form | Example | Why |
|---|---|---|---|
| Display headlines (hero, results headline, About title, share card) | *vous* when the reader is addressed; otherwise a third-person statement. Declarative, never imperative. | *Quelque chose vous observait cette semaine.* · *256 satellites ont observé Waterloo.* | The hero needs a free-standing pronoun to carry the serif accent: *vous* is one; *tu* only offers the clitic *t’*, which cannot be set apart. |
| Sentences and prose (results, pass view, footnotes) | *vous*, declarative, présent / passé composé / imparfait. The product's *we* is *nous* when it states what the product does, keeps or cannot know. | *Nous ne conservons qu’un carré d’environ 10 km de côté.* · *Nous ne pouvons pas savoir si une image a été prise.* | *Nous* makes responsibility explicit (privacy, method, limits), as the English "we" does on purpose. |
| Real failures (error notices, an archive down) | Impersonal statement of what failed, then a *vous* imperative for the one recovery step. | *Impossible de charger le catalogue d’orbites. Vérifiez votre connexion et réessayez.* | *Impossible de…* is the French software pattern for a failure; use it only where something did fail, never for a calm admission of what we cannot know. |
| UI labels and buttons | Infinitive for actions; nouns for states. No *vous* on a button. | *Partager* · *Copier le lien* · *Réessayer* · *Annuler* | French UI convention (Apple, Microsoft and Google French UIs). The imperative *Partagez* reads like an advert. |
| Mono caps labels | Nouns or noun phrases, no articles, no verbs except an action's infinitive. | `ALTITUDE` · `DÉPOINTAGE` · `02 / RECONSTITUTION` · `7 DERNIERS JOURS` | Instrument readouts name quantities. A noun also avoids gender and number agreement (`ACQUISITION`, not `ACQUIS` / `ACQUISE`). |
| About page | *vous*, plain and conversational, still declarative. The visitor's own questions use *on* or the first person. | *Peut-on me voir ?* *Non. Au mieux, un pixel couvre ici 10 m de côté.* | The English About is short answers, no jargon without a gloss. |

### 1.2 Rejected alternatives

- **tu.** Lost on four counts: (1) the hero's accent needs a stand-alone pronoun, and *tu* gives only *t’*
  (*Quelque chose t’observait*) or a heavy dislocation (*Toi, quelque chose t’observait*); (2) *tu* is the register of
  consumer brands and start-ups, which pulls the copy toward marketing, the one tone this product forbids; (3) a share
  card is often read by several people, and *vous* is singular and plural at once; (4) the instrument voice is cool
  and distant: a satellite does not know you, and *vous* keeps that distance. Quebec readers accept *vous* from a
  public product as readily as French readers.
- **Impersonal only** (never addressing the reader). Lost because the voice is second person by design ("Something
  watched *you*"). It survives only where English itself is impersonal.
- **Inclusive writing** (*observé·e·s*). Lost: it is contested, unreadable in mono caps, and unnecessary, because the
  rule below removes every agreement with the reader.

### 1.3 The agreement trap (the most important rule in this guide)

French agrees past participles and adjectives with nouns and pronouns whose gender the code cannot know: the reader
(*vous*), a satellite name, a place name. Every string must be written so that no word agrees with them.

- **Never** a past participle after a preceding *vous* object: ~~*Quelque chose vous a observé(e)(s)*~~,
  ~~*Qu’est-ce qui vous a observé*~~. Use the imparfait (*vous observait*), put *vous* after a preposition
  (*au-dessus de chez vous*), or make something else the object.
- **Never** an adjective or participle on *vous*: ~~*Vous êtes observé*~~, ~~*Vous êtes prêt*~~.
- **Never** *être* + participle with a satellite as subject: ~~*Sentinel-2C est passé*~~ (the ISS is feminine in
  French, so no default is safe). Use *avoir* verbs and the imparfait: *a survolé*, *a observé*, *a balayé*,
  *pouvait viser*, *avait … à portée*.
- **Never** *il* / *elle* for a satellite right after its bare name. Use a possessive and a noun whose gender is known:
  *son capteur*, *sa caméra*, *son radar*, *son imageur*, *son opérateur*, *sa fauchée*, *sa position*.
- **Allowed:** a pronoun after a common noun of known gender in the same text: *le satellite … il*, *la station …
  elle*, *la caméra … elle*, *les imageurs … ils*. *Si la station était encore éclairée par le soleil, elle a traversé
  votre ciel…* is correct.
- **Never** an adjective or participle on a place name: ~~*Waterloo était couverte*~~, ~~*[PLACE] survolée*~~.

Gender and number that **are** known agree normally: *les images qu’ils ont prises*, *1 image a été rendue publique*,
*le lieu … l’ont survolé* (*lieu* is masculine), *la vue rapprochée a été prise par…*.

## 2. Voice

### 2.1 How "declarative, specific, quietly uncanny, second person" sounds in French

- **Declarative.** Statements of fact in the indicative. No exclamation marks, no rhetorical questions (the exceptions
  are the share invitations and the share page's closing question, which English also asks). No *n’hésitez pas*, no
  *découvrez*, no *grâce à*.
- **Specific.** Every number stays a number, every name stays a name. Prefer the precise French term (*fauchée*,
  *dépointage*, *trace au sol*) and gloss it once in About rather than replacing it with a vague word. In plain
  sentences, prefer the everyday word to jargon: *un carré d’environ 10 km de côté*, not *une maille*.
- **Quietly uncanny.** The effect comes from plain facts placed next to *vous*: *Il faisait nuit ici.* *Rien que des
  nuages.* *Nous ne pouvons pas savoir si une image a été prise.* Understatement, never alarm. The imparfait is the
  French tool for this: a state that was going on while you were not looking (*Quelque chose vous observait*, *Son
  capteur pointait droit vers le sol*).
- **Second person.** *vous*, *votre ciel*, *au-dessus de chez vous*, *chez vous*.

### 2.2 Rhythm and length

- One fact per sentence. Aim for 8 to 18 words; split anything over 22.
- Short sentence after a long one, as the English does: *… filant vers le sud à 7,46 km/s. Son capteur pointait
  droit vers le sol.*
- Do not chain with *qui … dont … lequel*. Do not stack prepositional groups (*de la … du … des …*): restructure.
- French may reorder a sentence's parts (messages take named slots). Start with the time when it makes the sentence
  read like a log entry: *À 16:14:21 UTC, Sentinel-2C a survolé Waterloo…*
- **Colons.** A colon is the French way to join a fact and its consequence where English writes ", so": *Le soleil ne
  s’est jamais levé : aucune caméra de jour ne pouvait voir ce lieu.* **One colon per sentence**: when the English
  has two, end the first clause with a full stop (*Une image radar, pas une photo. Sentinel-1 émet des micro-ondes et
  enregistre leur écho : ni les nuages ni la nuit ne l’arrêtent.*).
- **Numerals.** Never spell out a count (*ces sept derniers jours* is wrong: every count is data set in the mono face,
  so *ces 7 derniers jours*). In running prose (posts, notes, About), do not start a sentence with a numeral: write
  *Résolution : 10 m par pixel.*, not *10 m par pixel…*. The data headlines whose count leads by design (the results'
  second line, the card's image line) are the exception.

### 2.3 What to avoid

- **Marketing tone:** *Découvrez*, *Explorez*, *incroyable*, *en un clic*, *gratuitement* in a headline, `!`.
- **Stilted imperatives:** the bare *Voyez…* reads as nineteenth-century prose or an advert. Use the future (*Vous
  verrez…*) in sentences and the infinitive (*Voir…*) in labels.
- **Calques of English structure:** *Il regardait tout droit vers le bas* (looking straight down), *faire sens*,
  *supporter* (for *prendre en charge*), *être en charge de*, *basé sur* (use *d’après*, *fondé sur*), a noun
  modified by a noun (*image satellite* and *image radar* are accepted; *passage données* is not).
- **Anglicisms where French has an established word:** *time-lapse* (→ *au fil des ans*), *replay* (→ *rejouer*),
  *scanner* as a verb (→ *balayer*), *checker*, *online* (→ *en ligne*), *update* (→ *mise à jour*), *spot* (→
  *endroit*).
- **The passive chain** *a été effectué par*. The passives the product keeps are the owner's line *… ont été rendues
  publiques* and *… a été prise par [SAT]* (which avoids *de* before a name, §5).
- **Subject pronouns right after a satellite name** (§1.3).

### 2.4 Before and after

| English | Literal French (rejected) | House French | Why |
|---|---|---|---|
| Something watched you this week. | *Quelque chose vous a regardé cette semaine.* | *Quelque chose vous observait cette semaine.* | *regardé* must agree with *vous* (gender unknown) and *regarder* is not the product verb. The imparfait removes the agreement and adds the sense of something ongoing. |
| It was looking straight down. | *Il regardait tout droit vers le bas.* | *Son capteur pointait droit vers le sol.* | *il* assumes the satellite's gender; *tout droit vers le bas* is a calque. *Pointer vers* is what an instrument does (*pointage*, *dépointage*). |
| Clouded over. It saw only cloud. | *Couvert de nuages. Il a vu seulement des nuages.* | *Ciel couvert. Rien que des nuages.* | Two nominal fragments, no subject to agree with, and colder. |
| It was dark here. Weather imagers keep scanning at night in infrared, so it saw your clouds, not your streets. | *Il faisait sombre ici. Les imageurs météo continuent de scanner la nuit en infrarouge, donc il a vu vos nuages, pas vos rues.* | *Il faisait nuit ici. Les imageurs météo balaient aussi la nuit, en infrarouge : ils ont vu vos nuages, pas vos rues.* | *ils* = *les imageurs* (known: masculine plural). *balayer* replaces the anglicism. The colon replaces *donc*. |
| We can't know whether it did. | *Impossible de savoir s’il l’a fait.* | *Nous ne pouvons pas savoir si une image a été prise.* | *Impossible de* reads as an error message; *il* assumes a gender. |
| See what watched you (card footer) | *Découvrez ce qui vous a surveillé !* | *Voir ce qui vous observait* | Infinitive label, no marketing verb, no exclamation, no agreement, and it echoes the hero. |

## 3. The key lines

Notation: `**bold**` is the weight English sets in bold, `*accent*` is the one serif-italic phrase in signal orange,
`[NUM]` is a count set in mono, `[PLACE]` the place name, `[SAT]` the satellite name.

### 3.1 The hero (three lines, one accent)

**Final:**

```
Quelque chose
*vous* observait
cette semaine.
```

Line lengths 13 / 14 / 14 characters: a balanced block. The accent is *vous*, alone, at the head of the middle line.
As rich parts: `[['Quelque chose'], [accent('vous'), ' observait'], ['cette semaine.']]`.

| Alternate | Why it loses |
|---|---|
| `Cette semaine,` / `quelque chose` / `*vous* observait.` | Good poster and a strong last word, but the comma on line 1 makes it start slowly, and it departs from the order the results headline and the share post echo. Fallback only if a layout ever needs the accent lower. |
| `Quelque chose` / `*vous* regardait` / `cette semaine.` | *regarder* is not the product verb: the results say *ont observé*, and the hero must rhyme with them. |
| ~~`Quelque chose` / `vous a observé` / `cette semaine.`~~ | *observé* must agree with *vous*, whose gender and number are unknown. Never. |

**Sign-off checks (layout, not wording):**
- *vous* opens line 2, where English has its accent at the end of a line. The padding that absorbs the italic's
  overhang was set for English; check the left edge at 1440 px and 390 px. Line 2 must not look indented against
  *Quelque chose* and *cette semaine.*
- The default share card sets the hero at 88 px in a 466 px column and never re-wraps it. From the bundled fonts'
  advance widths each French line is about 452–455 px before tracking: it fits with about 2 % to spare. Render the
  card once to confirm.

### 3.2 The sub line

**Final:** *Choisissez un lieu, n’importe où sur Terre. Vous verrez tous les satellites qui l’ont survolé ces
7 derniers jours, et les images qu’ils ont réellement prises.*

- *Choisissez*, not *Saisissez* or *Indiquez*: the reader can type, tap an example or drop a pin.
- *Vous verrez*: a statement in the future, not the stilted *Voyez*.
- *l’ont survolé*: *l’* is *un lieu* (masculine singular), so *survolé* is correct.
- *qu’ils ont réellement prises*: *que* is *les images* (feminine plural), so *prises* is correct. *réellement*
  carries "actual" (never *actuelles*, which means "current").
- The comma before *et* is deliberate: without it, *survolé … et les images* can be misread.
- `days` plural forms: `other` *ces [NUM] derniers jours*; `one` *ces 24 dernières heures*; `many` is unreachable for
  a window: give it the `other` text.
- The same sentence is the share page's `description` and the default card's alt text.

### 3.3 Results headline and second line

**Line 1** (N = distinct satellites with a pass; never 0 here, zero has its own sentence). Bold: the count phrase
including its verb. Accent: the place name, and only the name.

| Case | French |
|---|---|
| `one` (N = 1) | Ces 7 derniers jours, **1 satellite a observé** *Waterloo*. |
| `other` (2, 3 … 256 …) | Ces 7 derniers jours, **256 satellites ont observé** *Waterloo*. |
| `many` (exact millions; required by CLDR, never seen) | Ces 7 derniers jours, **1 000 000 de satellites ont observé** *Waterloo*. |
| Zero | Aucun satellite que nous suivons n’a observé *Waterloo* cette semaine. |
| Zero, an older window | Aucun satellite que nous suivons n’a observé *Waterloo* cette semaine-là. |
| An older window (replaces *Ces 7 derniers jours*) | Du 29 octobre au 5 novembre, **256 satellites ont observé** *Waterloo*. Same month: *Du 1er au 7 novembre,* (month written once; day 1 is *1er*). Across a year: *Du 29 décembre 2026 au 4 janvier 2027,* |
| A window of [NUM] days | `other` *Ces [NUM] derniers jours,* · `one` *Ces 24 dernières heures,* |

Message shape (illustrative; `#` is the mono number):

```
{window}, **{n, plural,
  one   {# satellite a observé}
  many  {# de satellites ont observé}
  other {# satellites ont observé}}** *{place}*.
```

The headline is display type: full month names, never readout abbreviations (*nov.*). Alternates for *Ces 7 derniers
jours*: *Au cours des 7 derniers jours* (9 characters longer and more formal; loses on the phone headline); *En
7 jours* (shortest, but loses recency).

**Line 2** (K = images made public; the number is mono, the sentence weight follows English).

| Case | French |
|---|---|
| `one` | **1 image a été rendue publique.** |
| `other` | **31 images ont été rendues publiques.** |
| `many` | **1 000 000 d’images ont été rendues publiques.** |
| Partial, `one` / `other` / `many` | **Au moins 1 image a été rendue publique.** · **Au moins 31 images ont été rendues publiques.** · **Au moins 1 000 000 d’images ont été rendues publiques.** |
| Zero | *Aucune image n’a été rendue publique cette semaine.* (older window: *cette semaine-là*; on the share card, where the headline already says the week: *Aucune image n’a été rendue publique.*) |
| Archives down | *Les archives d’images n’ont pas répondu : impossible de compter les images publiques pour l’instant.* (card short form: *Les archives d’images n’ont pas répondu.*) |

*ont été rendues publiques*, not *ont été publiées* (drops "public", which is the point: anyone can look at them; the
owner's English line is "made public") nor *sont publiques* (loses the act of publication in the week). The line
counts every kind of image in one number (photos, mosaics, radar, full-disc frames), so it says *images*, never
*photos*.

French counts 0 and every value below 2 as singular: the tiles read `0 PASSAGE`, `1 PASSAGE`, `31 PASSAGES`. That
is correct French; do not "fix" it.

### 3.4 Pass sentences

Each case is one whole message in the catalog, so a translator may reorder and may split a verb around its object
there (unlike the verb slot, §3.6).

**The detailed pass (Sentinel-2 / Landsat), overhead case:**

> *À 16:14:21 UTC, Sentinel-2C a survolé Waterloo à 786 km d’altitude, filant vers le sud à 7,46 km/s. Son
> capteur pointait droit vers le sol. Couverture nuageuse de la scène : 25 %.*

| English piece | French |
|---|---|
| crossed 786 km overhead | *a survolé [PLACE] à 786 km d’altitude* |
| crossed 786 km up, 61 km to the west | *a longé [PLACE] à 786 km d’altitude, à 61 km à l’ouest* |
| at 16:14:21 UTC | *À 16:14:21 UTC,* (sentence-initial) |
| moving south at 7.46 km/s | *filant vers le sud à 7,46 km/s* (the eight phrases are in §4.2) |
| It was looking straight down. | *Son capteur pointait droit vers le sol.* |
| It was looking 5.4° off straight down. | *Son capteur pointait à 5,4° de la verticale.* |
| Cloud cover across the scene: 25%. | *Couverture nuageuse de la scène : 25 %.* |

*Sentinel-2C est passé…* is never used (agreement with the satellite; the ISS is feminine). *Viser* is not used for
the instrument's direction in prose (*viser à* means "to aim to do", and *viser* wants an object): *pointer vers*,
*pointer à … de la verticale*, *dépointé de*.

**Reference lines for every other case** (translators complete `passSentences` from these):

| English | French |
|---|---|
| Its MODIS imager swept Waterloo into NASA's daily true-colour mosaic at 250 m per pixel. | *Son imageur MODIS a intégré Waterloo à la mosaïque quotidienne en couleurs naturelles de la NASA, à 250 m par pixel.* |
| Its radar, looking 32.1° to the side, imaged Waterloo at 20 m per pixel, in the dark. | *Son radar, dépointé de 32,1° sur le côté, a imagé Waterloo à 20 m par pixel, dans le noir.* |
| Sentinel-1C crossed … , inside its 250 km swath. (likely) | *… à 16:14:21 UTC, dans sa fauchée de 250 km.* |
| It was daylight, so it almost certainly recorded this spot. No scene from this pass has been published yet; archives can lag by a day or more. | *Il faisait jour : son capteur a presque certainement enregistré cet endroit. Aucune scène de ce passage n’est encore publiée ; les archives peuvent avoir un jour de retard ou plus.* |
| It was daylight, so it would have recorded this spot. The archive could not be searched just now. | *Il faisait jour : son capteur aurait enregistré cet endroit. Impossible d’interroger les archives pour l’instant.* |
| No scene exists for this pass. Sentinel-2 records only land and coastal water, and may not have scheduled this spot. | *Aucune scène n’existe pour ce passage. Sentinel-2 n’enregistre que les terres et les eaux côtières, et n’a peut-être pas programmé cet endroit.* |
| NASA's daily mosaic for this pass could not be confirmed at your spot. | *La mosaïque quotidienne de la NASA pour ce passage n’a pas pu être confirmée à l’endroit même.* |
| Its images feed weather forecasts; they are not published as pictures we can show. | *Ses images alimentent les prévisions météo ; elles ne sont pas publiées sous une forme que nous pouvons montrer.* |
| WorldView Legion 4 passed within view at 10:52 EST, 61 km to the west. | *À 10:52 EST, WorldView Legion 4 avait Waterloo à portée, à 61 km à l’ouest.* (directly overhead: *…, juste à la verticale.*) |
| Pointing 18.0° off straight down, it could have watched Waterloo. We can't know whether it did. | *Dépointé de 18,0°, son capteur aurait pu observer Waterloo. Nous ne pouvons pas savoir si une image a été prise.* At nadir: *Pointé à la verticale, son capteur aurait pu observer Waterloo.* (*dépointé*, *pointé* agree with *son capteur*, masculine: correct.) |
| Waterloo was inside its 290 km swath. Its operator does not publish where it imaged, so we can't know whether it did. | *Sa fauchée de 290 km couvrait Waterloo. Son opérateur ne publie pas les lieux qu’il a imagés : nous ne pouvons pas savoir si une image a été prise.* (*il* = *son opérateur*, known.) |
| Radar sees through cloud and darkness. Pointing 18.0° to the side, it could have mapped Waterloo. We can't know whether it did. | *Le radar voit à travers les nuages et la nuit. Dépointé de 18,0° sur le côté, son radar aurait pu cartographier Waterloo. Nous ne pouvons pas savoir si une image a été prise.* Open archive: *… Nous n’avons trouvé aucune image publiée de ce passage.* |
| Meteosat-12 doesn't pass. It sits 35,778 km above the equator at 0.2°W and scans the whole face of the Earth below it every 10 minutes. | *Meteosat-12 ne passe pas. Sa position est fixe, à 35 778 km au-dessus de l’équateur, par 0,2° ouest. Son imageur balaie toute la face visible de la Terre toutes les 10 minutes.* |
| This scan's line reached Paris at about 07:49 CET, moving north. | *La ligne de ce balayage a atteint Paris vers 07:49 CET, en progressant vers le nord.* |
| It was dark here, so this is infrared: cloud tops by temperature, colder is lighter. | *Il faisait nuit ici, l’image est donc en infrarouge : le sommet des nuages selon sa température, plus clair quand il est plus froid.* |
| ISS passed 420 km up at 21:14 CET, 62° above your horizon to the northwest. | *À 21:14 CET, ISS (ZARYA) a survolé Waterloo à 420 km d’altitude, à 62° au-dessus de votre horizon, au nord-ouest.* Near the zenith: *…, presque à la verticale.* |
| It was dark where you are. If the station was still in sunlight, it crossed your sky as a bright, steady point. | *Il faisait nuit chez vous. Si la station était encore éclairée par le soleil, elle a traversé votre ciel comme un point brillant, sans clignoter.* (*fixe* would say it stood still.) |
| Radar doesn't need light. Umbra, Capella and 7 other radar satellites passed within range 1,204 times. | *Le radar n’a pas besoin de lumière. Umbra, Capella et 7 autres satellites radar ont été à portée 1 204 fois.* (§5.4) |
| No Sentinel-2C image of this spot from this pass. Plan view of the pass. | *Aucune image prise par Sentinel-2C à cet endroit lors de ce passage. Vue en plan du passage.* |

### 3.5 Share card, share page and post

**Headlines** (each is its own message in `card/fr.ts`: text blocks in the condensed face, the accent block with the
place in the serif, a closing full stop as its own part):

| Message | French blocks |
|---|---|
| `headline` (week count known) | `256 satellites ont observé` · *`Waterloo`* · `.` (one: `1 satellite a observé`; zero: `Aucun satellite que nous suivons n’a observé`) |
| `headlineWeek` | same lead · *`Waterloo cette semaine.`* |
| `headlineBy.imaged` | `Sentinel-2C a observé` · *`Waterloo`* · `.` |
| `headlineBy.likely` | `Sentinel-2C a balayé` · *`Waterloo`* · `.` |
| `headlineBy.could` | `WorldView Legion 4 pouvait viser` · *`Waterloo`* · `.` |
| `headlineBy.overhead` | `ISS (ZARYA) a survolé` · *`Waterloo`* · `.` |
| nameless satellite | `Un satellite a observé` · … (each sentence writes *un satellite* in the form it needs) |

The lead must wrap to at most three short lines in the 466 px column (about 24 characters a line at the largest size).

**Under the headline:** the second-line messages of §3.3. Clouded pictures (`cloud.*`):

| Case | `sub` (card line) | `chip` (mono caps) | `post` / `desc` |
|---|---|---|---|
| only (≥ 90 %) | *Ciel couvert. Rien que des nuages.* | *Ciel couvert · 96 %* | *Rien que des nuages.* / *Rien que des nuages (96 %).* |
| mostly (70–89 %) | *Surtout des nuages : 85 % de la scène.* | *Très nuageux · 85 %* | *Surtout des nuages (85 %).* |
| spot | *Des nuages sur l’endroit même.* | *Nuages ici* | *Des nuages couvraient l’endroit même.* |

**Top row and readouts:** `stamp` *dim. 1 nov. 2026 · 11:21 EST*; `weekTo` *7 jours au 1 nov. 2026*; `lastWeek` *7 derniers
jours*. Readout labels: *Altitude*, *Élévation*, *Vitesse*, *Dépointage*, *Pixel*, *Pixel mosaïque*, *Au plus près*.
Lanes (≤ 8 characters): *Image*, *Probable*, *Possible*, *Survol*.

**Over the picture:** `geometry` *Géométrie · nord en haut* (*du passage* ran into the scale bar); notes: *Image dans l’application* · *Image
indisponible pour l’instant* · *Archives commerciales, non publiques* · *Dans la fauchée, aucune image publique* ·
*Trace au sol au plus près*; `acquiring` *Acquisition…*; `noPublicPhoto` *Aucune image publique cette semaine*;
`noPhoto` *Aucune image à montrer*; `look` *Vue rapprochée* · *Dernière vue dégagée* · *Ciel couvert* · *Radar*;
`aSatellite` *Un satellite* (a chip label only: `VUE RAPPROCHÉE · UN SATELLITE · 10 m`).

**Footer:** `invite` *Voir ce qui vous observait* (26 characters beside `www.watched.earth` in the 466 px row);
`enterAnyPlace` *Choisissez un lieu* (the sub's first words; *N’importe quel lieu sur Terre*, 29 characters, ran
into `www.watched.earth` on the rendered card).

**The share page:**

| Key | French |
|---|---|
| `page.title` | *Quelque chose vous observait cette semaine.* |
| `page.description` | the sub line (§3.2) |
| `page.placeTitle` | *Ce qui a observé [PLACE] cette semaine* |
| `page.placeDescription` | *Tous les satellites qui ont survolé [PLACE] ces 7 derniers jours, et les images qu’ils ont réellement prises. Qu’est-ce qui vous observait cette semaine ?* |
| `page.opening` | *Ouverture de* · accent(*Watched*) |
| `crossed` | *Sentinel-2C a survolé Waterloo à 795 km d’altitude, le dimanche 1er novembre 2026 à 11:21 EST, filant vers le sud.* (no altitude: *Sentinel-2C a survolé Waterloo, le …*) |
| `withinView` | *WorldView Legion 4 avait Waterloo à portée le dimanche 1er novembre 2026 à 10:52 EST, filant vers l’ouest.* |
| `couldHave` | *Sa caméra aurait pu viser ici. Son opérateur ne dit pas si elle l’a fait.* |
| `straightDown` / `offNadir` | *Son capteur pointait droit vers le sol.* / *Son capteur pointait à 5,4° de la verticale.* |
| `cloudCover` | *Couverture nuageuse : 25 %.* |
| `inSwath` | *Sa fauchée couvrait [PLACE].* |
| `bestFrom` | *La vue rapprochée a été prise par [SAT].* · *La dernière vue dégagée a été prise par [SAT].* · *La première image a été prise par [SAT].* (nameless: *par un satellite*) |
| `question` | *Qu’est-ce qui vous observait cette semaine ?* |
| `cardAlt.withPhoto` / `plain` | *La carte de partage, avec la vue rapprochée de la semaine, prise par [SAT].* / *La carte de partage.* |
| `defaultAlt` | *Une vraie photo Sentinel-2 de Palm Jumeirah, à Dubaï, à côté de la phrase « Quelque chose vous observait cette semaine. » Choisissez un lieu, n’importe où sur Terre.* |

**The post** (`share.post`; X counts 280 characters and French runs longer, so the invitation is dropped first, as in
English):

> *Sentinel-2C a observé Waterloo depuis 795 km d’altitude, le dimanche 1er novembre à 11:21, heure locale.
> Résolution : 10 m par pixel. C’est l’image réelle.*
>
> *Quelque chose vous observait, vous aussi, cette semaine.*

| Case | French |
|---|---|
| imaged, no pixel size | *… à 11:21, heure locale. C’est l’image réelle.* |
| clouded | *Sentinel-2C a observé Waterloo depuis 795 km d’altitude, le … . Rien que des nuages.* (the `cloud.post` sentence) |
| likely | *Sentinel-2C a balayé Waterloo depuis 786 km d’altitude, le … . La fauchée de sa caméra couvrait l’endroit même.* |
| could | *WorldView Legion 4 avait Waterloo à portée le dimanche 1er novembre à 10:52, heure locale. Sa caméra aurait pu viser ici. Son opérateur ne dit pas si elle l’a fait.* |
| overhead | *ISS (ZARYA) a survolé Waterloo à 420 km d’altitude, le dimanche 1er novembre à 21:14, heure locale.* |
| `hookWatched` | *Quelque chose vous observait, vous aussi, cette semaine.* (*aussi* alone reads as "also this week") |
| `hookPassed` | *Et au-dessus de chez vous, cette semaine ?* |
| `credit` | *via [handle]* |

### 3.6 The four verdicts (one vocabulary, `VERDICT_META`)

| Verdict | Title | Lane (mono caps) | Count unit (`one` / `other` / `many`) | Definition | Verb slot |
|---|---|---|---|---|---|
| imaged | **Observé** | `IMAGE` | *passage* / *passages* / *de passages* | *Une image réelle de ce lieu figure dans des archives publiques.* | *a observé* |
| likely | **Probablement observé** | `PROBABLE` | same | *La fauchée d’une caméra fixe a couvert ce lieu. Aucune image n’en est publiée.* | *a balayé* |
| could | **Aurait pu viser ici** | `POSSIBLE` | same | *Une caméra orientable ou privée était à portée. Son opérateur ne dit pas si elle a visé ce lieu.* | *pouvait viser* |
| overhead | **Survolé** | `SURVOL` | same | *Passage dans votre ciel : les stations spatiales, et tout le reste.* | *a survolé* |

- **The verb slot is one unbroken string.** Code inserts it as `[SAT] {verb} [PLACE]` (the share headline) and on its
  own in a pass row's accessible name (*WorldView Legion 4, pouvait viser, dimanche 1er novembre 10:52 EST, …*). A
  verb split around its object (*a eu … à portée*) cannot work there. Whole-sentence messages (§3.4, the post) may
  still say *avait [PLACE] à portée*.
- Titles describe the place and agree with an implied *lieu* (masculine singular): *Observé*, *Survolé*. They are
  labels, never sentences about the reader. *Aurait pu viser ici* has the satellite as its implied subject and agrees
  with nothing.
- `IMAGE`, not `PHOTO`, for the imaged lane: it holds radar images and weather mosaics too, and the product rule is
  that a radar image is not a photo.
- *Probablement*, not *Sans doute*: many readers take *sans doute* as "without doubt".
- *viser ici*, not *pointer ici*: *se pointer* is familiar French for "to show up"; *viser* takes the place as its
  aim. (In prose about the instrument's direction, *pointer* is the right verb: §3.4.)
- *Survolé* / `SURVOL`, not *Passé au-dessus* / `AU-DESSUS`: *au-dessus* alone is a direction with no complement
  ("above what?") and runs over the card's 8-character lane.
- About's extra sentences (`verdictMore`): imaged *Si nous la montrons, c’est l’image réelle.* · likely *L’image
  n’est pas encore publique, ou elle a été écartée à cause des nuages.* · could *Rien ne permet de savoir si elle l’a
  vraiment fait.* (*elle* = *la caméra* of the definition) · overhead empty.
- The timeline's accessible summary must be a message, not code that lowercases the title: *Chronologie sur
  7 jours. Observé, 31 passages. Probablement observé, 4 passages. Aurait pu viser ici, 2 passages. Survolé,
  12 passages.*

### 3.7 About page and HUD

- HUD top-left link (`hud.about`): *À propos* (8 characters; *Comment ça marche* would add 3 characters on a 375 px
  line that already nearly touches the sun readout). About's bar: *Watched. / À propos*.
- About title (`about.title`): `Comment ça` / *`marche`*`.` (accent on the verb, full stop outside it).
- Lede: *Choisissez un endroit sur Terre. Nous calculons quels satellites l’ont survolé la semaine écoulée, puis nous
  allons chercher les images qu’ils ont prises. Tout se passe dans votre navigateur, avec des données publiques.*
- Sections: *L’essentiel* · *Comment nous trouvons les passages* · *Ce que veulent dire les libellés* · *Ce que nous
  ne voyons pas* · *Confidentialité* · *Crédits* · *Clavier*.
- Short answers: *C’est en direct ?* *Pas tout à fait. Les images arrivent dans les archives de quelques heures à
  deux jours après la prise de vue : les passages les plus récents n’en ont peut-être pas encore.* · *Peut-on me
  voir ?* *Non. Au mieux, un pixel couvre ici 10 m de côté. Une voiture tient dans un pixel. On ne vous y voit pas.*
  · *Est-ce que ce sont tous les satellites ?* *Non. Les satellites militaires et de renseignement figurent rarement
  dans les catalogues publics, et les entreprises ne disent pas où elles pointent leurs caméras.*
- `tilting`: *De nombreux satellites commerciaux peuvent s’incliner de 30 à 45 degrés. Si vous étiez à portée, nous
  classons le passage « Aurait pu viser ici ».* (*l’appelons* had no antecedent: the paragraph never names the pass.)
- Privacy (translate exactly, promise nothing more or less): *Nous comptons les recherches par ville et par zone
  d’environ 10 km, jamais votre position exacte…*; the locate note: *Votre position est envoyée au géocodeur Photon
  pour nommer le lieu. Nous ne conservons qu’un carré d’environ 10 km de côté.*
- Key names (`keyNames`, the time-lapse's `escKey`): *Entrée*, *Espace*, *Échap*. Key symbols (`/ ↑ ↓ ← → F + − 0 ?`)
  stay.
- HUD: `sun` *Soleil 16.2°S 063.0°E* (coordinates as they arrive); `subsolar` *Point subsolaire*; `gmst` *GMST
  18:41:50* (kept; *TSMG* is rare); `objects` *16 893 objets*; `fetched` *Récupéré 2026-11-08 03:34Z*; `catalogAge`
  *il y a 42 min*, *il y a < 1 min*, *il y a 5 h*, *il y a 3 j*, stale *Périmé, il y a 3 j*; `catalogUnavailable`
  *Catalogue indisponible*; `catalogLoading` *Chargement du catalogue*; `scene` *Scène*.

### 3.8 Time-lapse (*Au fil des ans*)

One clear Sentinel-2 photo of the same place a year, as a loop. *Accéléré* names a playback speed and reads as an
adjective ("sped up") on a button; *time-lapse* is an anglicism. *Au fil des ans* says what is on screen and is
neutral for war zones and glaciers (no *évolution*, no *transformation*).

| Key | French |
|---|---|
| `title`, lightbox `timelapse`, the gallery row | *Au fil des ans* (bar: `AU FIL DES ANS / WATERLOO`) |
| `dialog` | *[PLACE] au fil des ans* |
| lightbox `timelapseLabel` | *Ce lieu au fil des ans, une vue par an* |
| `slider` / `frameList` / `frameSpoken` | *Vue* / *Vues* / *Vue 3 sur 11 : 22 octobre 2015* |
| `date` / `dayMonth` / `readout` | *22 oct. 2015* / *22 oct.* / *22 oct. 2015 · Sentinel-2A* |
| `captionYearly` | *11 vues dégagées · une par an* |
| `captionSeason` | *11 vues dégagées · une par an, en hiver* · *…, au printemps* · *…, en été* · *…, en automne* (a southern glacier's February frame is `summer`: *en été*) |
| `captionGathering` | *Une vue dégagée par an · depuis 2015* |
| `captionShort` / `captionError` | *Pas assez de vues dégagées pour ce lieu* / *Les archives n’ont pas répondu* |
| `note` | *Chaque vue est le même carré de 10 km de côté, prise par Sentinel-2 et étalonnée comme toutes les photos ici. Chaque année vise une saison différente ; une année sans vue dégagée est omise.* |
| `noteOneSeason` | *… Chaque année vient de la même saison ; une année sans vue dégagée à cette saison est omise.* |
| `listing` / `choosing` / `developing` | *Inventaire des archives* / *Choix des vues dégagées* / *Développement des vues* |
| `tooCloudy` / `tooFew` | *Trop de nuages ici pour remonter les années.* / *Aucune vue dégagée depuis 2015 · 3 nécessaires*, *2 vues dégagées depuis 2015 · 3 nécessaires* |
| `noAnswer` / `unreachable` / `retry` | *Les archives n’ont pas répondu.* / *Planetary Computer est injoignable* / *Réessayer* |
| `shareTitle` | *[PLACE], année après année* |
| `video` / `rendering` / `videoFailed` / `saveVideo` | *Vidéo* / *Création 42 %* / *Échec vidéo* / *Enregistrer* (one 132 px button width) |
| `noH264` | *Ce navigateur n’a pas d’encodeur H.264 : le fichier se lit dans Chrome et Firefox* |
| `source` / `fileNamePlace` | *Copernicus Sentinel-2, via Planetary Computer* / *lieu* |

### 3.9 Other screens

- **Landing:** placeholder *Chercher un lieu* (*Rechercher un lieu* ellipsised at 1024 px beside the locate button);
  `useMyLocation` *Ma position* (*Utiliser ma position* left the field too little room on laptops);
  `placeLabel` *Lieu*; `searching` *Recherche*; `matches` *3 résultats* (`one` *1 résultat*); `noMatch` *Aucun
  résultat*; `searchHint` *Nom, adresse ou lat., long.*; `searchDown` *La recherche de lieux ne répond pas. Les
  coordonnées telles que 43.47, −80.54 fonctionnent toujours.* (point and U+2212 minus kept exactly: the field parses
  them); `nothingMatches` *Rien ne correspond à « [query] ». Essayez une ville, un monument ou des coordonnées.*;
  `locating` *Localisation…*; `requestingPosition` *Demande de position*; `namingPlace` *Recherche du nom* (16, as English);
  `elapsed` *04 s*; `builtBy` *Créé par [handle]*; `sourceLink` *Code source* (says what the link opens, without the anglicism; aria
  *Code source : le projet sur GitHub*); `surpriseName` *Au hasard : un lieu célèbre tiré au sort*.
- **Gallery and viewer chrome say *Images*:** they hold radar images and weather mosaics. `barLabel` *Images*;
  `filterLabel` *Afficher les images*; filter (≤ 8 characters each) *Toutes · Précises · Météo · Radar*; `prevPhoto` /
  `nextPhoto` *Image précédente* / *Image suivante*; `trackLabel` *Images de ce lieu, balayez pour en voir plus*;
  lightbox `dialogLabel` *Images*, filmstrip *Toutes les images*, thumb *Image 3*, `spokenPosition` *Image 3 sur 27,
  vue rapprochée*; `expandLabel` *Agrandir l’image*. Keep *photo* only where English names a Sentinel-2 or Landsat
  picture (About's *Retouches*, the `detailed` filter's tooltip, `expandTitle` of a photo row).
- **Gallery counters:** `photosThisWeek` and `photosThatWeek` *27 en 7 jours* (one form for both, 13 characters in a
  12-character box: check the 263 px landscape bar).
- **Pass list:** `imagedOrder` *vue rapprochée en tête* (23 characters at most, or the group's count drops to a
  second line); `sats` *4 sat.*; `showAllSats`
  *Voir les 31 satellites*; `showMore` *Voir 40 de plus*; `left` *12 restantes*; `showFewer` *Voir moins*;
  `latest` empty (*Dernier lun. 2 nov.* reads « lundi dernier », and the row ran past its box); `closest` *Au plus
  près* (with its trailing space); `offNadir` *5,3° du nadir* (the rows' mono lines hold about 36 characters:
  *de dépointage* ran them past their box); tags *Mosaïque*,
  *Radar*, *Nuages · 25 %*, *Nuages · ici*; `cloudChip` *Nuage* (one word on a 48 px thumbnail; *Nuages* is clipped there).
- **Pass view:** section rules `01 / GÉOMÉTRIE`, `02 / RECONSTITUTION` (a noun, like its neighbour; *Lecture* is the
  play button's name); buttons *Rejouer*, `replay.long` *Rejouer ce passage*; links *Télécharger l’image*,
  *Téléchargement…*, *Ouvrir l’image pour l’enregistrer*, *Voir la source · [archive]*; `spot` *Lecture du pixel à
  l’endroit même…* · *Ciel dégagé à l’endroit même.* · *Cirrus fins signalés à l’endroit même ; ils peuvent adoucir
  l’image.* · *Nuages à l’endroit même.* · *L’endroit même était à l’ombre d’un nuage.*; `fullDiscNote` *Une image du
  disque complet : une seule image de tout ce que voit le satellite, à 2 km par pixel ici. Peu détaillée, mais
  réelle, et la plus récente publiée. Le satellite en prend une semblable toutes les 10 minutes, toute la semaine.*;
  `mosaicNote` *Une mosaïque quotidienne : la NASA assemble les fauchées de chaque jour en une image à 250 m par pixel.
  Peu détaillée, mais réelle, et du jour de ce passage.*
- **Share sheet:** *Partager ce passage* · *Partager cette image* · *Partager cette semaine* · *Partager l’image* ·
  *Préparation de l’image…* · *Copier le lien* (a bare *Copier* beside *Copier l’image* left the reader to guess
  which copies what; the row now makes room for its labels, stacking on a phone) · *Copié* · *Poster sur X* (X's own French verb; *Publier sur X* ran past its
  border) · *Copier l’image* · *Enregistrer* (Save PNG)
  · *Lien* · *Texte* · *Création du lien…* · *Créé au moment du partage* · *Lien direct : le lien court n’a pas pu être
  créé pour l’instant* · *La carte n’a pas pu être générée ici ; le lien fonctionne toujours.* · *Fermer (Échap)*.
- **Globe:** `searchAria` *Voir ce qui a survolé [PLACE]*; `droppedIn` *Repère posé : [PLACE]. Appuyez sur Entrée ou
  sur la flèche pour voir ce qui est passé au-dessus.*; `droppedAt` *Repère posé : 43.4723°N 80.5449°W.*; `imaged`
  *Image 11:21:13 EST*; closest approach *Au plus près · SENTINEL-2C*; fallback *Vue 3D indisponible* / *WebGL 2 est
  désactivé dans ce navigateur*; `awaiting` *Passage à venir* / *Balayage à venir*; `acquiredNow` *Image prise*.
- **Boot and switcher:** `slow` *Connexion lente, chargement en cours*; switcher `title` *Langue*, `trigger` *Langue :
  Français. Changer*.

## 4. Glossary

Gender: (m) masculine, (f) feminine. "Invariable apposition" means the second noun never takes an *s*:
*des satellites radar*, *des mosaïques météo*.

### 4.1 Terms

| English | fr | Notes |
|---|---|---|
| to watch / watched (product verb) | observer · *a observé* · *ont observé* · *observait* | The one verb. Never *photographier*, *surveiller*, *espionner*, *regarder*, *filmer*, *voir* in this sense. Never after a preceding *vous* in the passé composé (§1.3). |
| Watched (verdict) | Observé | Label; agrees with an implied *lieu*. |
| Likely watched | Probablement observé | Never *Sans doute observé*. |
| Could have pointed here | Aurait pu viser ici | Verb slot *pouvait viser*. |
| Passed overhead | Survolé | Lane `SURVOL`. |
| swept over (verb) | a balayé | *balayer*: *balaie*, *balaient*. |
| passed within view (of) | pouvait viser (verb slot) · avait [PLACE] à portée (whole sentences) | Never *est passé à portée de* (agreement + *de* before the place). |
| passed over (verb) | a survolé | |
| satellite | satellite (m) | *1 satellite*, *0 satellite*, *256 satellites*. |
| sats (row count) | sat. | *4 sat.*, invariable. |
| pass (n.) | passage (m) | The public word. *Une passe* is ground-station jargon (CNES); never *transit* (a crossing of the Sun's disc). |
| overflight | survol (m) | |
| photo | photo (f) | Only optical images (Sentinel-2, Landsat). Never for radar, mosaics or full-disc images. |
| image | image (f) | The umbrella word: photos, mosaics, radar, full disc. |
| picture | image (f) | Never *tableau*, never *cliché*. |
| closest look | vue rapprochée (f) | The most detailed clear photo of the week. Chip, tag, card `look.closest`, *vue rapprochée en tête*. |
| closest (approach) | au plus près | Timing and distance only: `AU PLUS PRÈS · UTC`, `AU PLUS PRÈS · LOCAL`, the globe's moment label, the card readout. |
| last clear look | Dernière vue dégagée | |
| look (n.) | vue (f) | *vue dégagée*, *vues dégagées*. |
| frame (time-lapse) | vue (f) | *Vue 3 sur 11*. |
| clear (sky at the spot) | dégagé | Never *clair* (= bright). Value *Dégagé*. |
| spot (the exact point) | endroit (m) · *l’endroit même* · label *ici* | *Nuages ici*, *Dégagé ici*. Never *votre point* ("your point" in an argument), never *au point* (= in focus). |
| public image | image publique (f) | |
| made public | rendue publique | *rendues publiques*. Never *publicisée* (= advertised). |
| published | publié(e) | |
| archive | archives (f pl) | Always plural: *les archives*, *les archives d’images*. |
| open (archive, data) | en accès libre | *archives en accès libre*, *satellite d’imagerie aux données en accès libre*. |
| scene | scène (f) | One archive image (*une scène Sentinel-2*). |
| swath | fauchée (f) | Never *bande* (spectral bands, and *bande de Gaza*). |
| band (spectral) | bande (f) | Label `BANDE`. |
| off-nadir | dépointage (m) · dépointé de | Label `DÉPOINTAGE`; prose *pointait à 5,4° de la verticale*, *dépointé de 18,0°*. |
| straight down (nadir) | droit vers le sol · à la verticale · nadir (m) | *Son capteur pointait droit vers le sol.* |
| to point (an instrument) | pointer (vers) | *pointage*, *dépointage*; *satellite à pointage agile*. |
| field of regard | dépointage max. | Label `DÉPOINTAGE MAX.` with `±30°`. |
| ground track | trace au sol (f) | |
| orbit | orbite (f) | |
| orbital elements (TLE) | éléments orbitaux (m pl) | Keep `TLE`: *les TLE*. |
| epoch | époque (f) | `ÉPOQUE TLE`. |
| catalog | catalogue (m) | *catalogue d’orbites*. |
| objects (catalog count) | objets (m) | `16 917 OBJETS`. |
| altitude | altitude (f) | Never *hauteur* for a satellite. |
| elevation (a satellite's angle in your sky) | élévation (f) | Label `ÉLÉVATION`; *élévation vue d’ici*. |
| sun elevation | hauteur du soleil (f) | French astronomy says *hauteur*. |
| ground speed | vitesse au sol (f) | |
| heading | cap (m) | Readout `CAP · SSO · ASC.` |
| ascending / descending | ascendant / descendant | Readout *Asc.* / *Desc.* |
| ground distance | distance au sol (f) | |
| in swath / in view | dans la fauchée / à portée | |
| window (time span) | fenêtre (f) | |
| clouds | nuages (m pl) | Label `NUAGES`; value *Nuages*. |
| clouded (chip) | Nuages · 25 % | A noun, no agreement. |
| clouded over | ciel couvert | |
| mostly cloud | surtout des nuages (prose) · très nuageux (chips) | |
| cloud cover | couverture nuageuse (f) | |
| thin cirrus | cirrus fins (m pl) | |
| cloud shadow | ombre de nuage (f) | |
| place | lieu (m) | Never *place* (= square, seat). *endroit* in prose. |
| pixel | pixel (m) | |
| mosaic pixel | pixel mosaïque | Card readout. |
| resolution | résolution (f) | |
| per pixel | par pixel | |
| radar / radar image | radar (m) / image radar (f) | Invariable apposition. |
| weather mosaic | mosaïque météo (f) | Diaeresis: *mosaïque*. |
| daily mosaic | mosaïque quotidienne (f) | |
| true colour | couleurs naturelles (f pl) | |
| infrared | infrarouge | Value *Infrarouge* (10 characters in a ~9-character cell: check; fallback *IR*). |
| visible / colour (band value) | visible / couleur | |
| geostationary | géostationnaire | |
| full disc | disque complet (m) | |
| coarse | peu détaillé(e) | Never *grossier* (= crude, rude). |
| scan (n.) / scan line | balayage (m) / ligne de balayage (f) | |
| scan direction | sens du balayage (m) | `NORD → SUD`. |
| imager / sensor / camera | imageur (m) / capteur (m) / caméra (f) | *son capteur* is the default possessive subject. |
| steerable / fixed camera | caméra orientable / caméra fixe (f) | |
| operator / private operator | opérateur / opérateur privé (m) | |
| commercial | commercial(e) | *archives commerciales*. |
| crewed / station | habité(e) / station (f) | *station spatiale habitée*. |
| weather / imaging / radar satellite | satellite météo / satellite d’imagerie / satellite radar (m) | |
| standby spare | satellite de réserve (m) | |
| scheduled | programmé | |
| military and spy satellites | satellites militaires et de renseignement | Never *satellites espions* in our copy. |
| sub-solar point | point subsolaire (m) | |
| GMST | GMST | Kept. |
| sun (HUD readout) | soleil · `SOLEIL` | Not the weekday *Sun* (→ *dim.*). |
| day / twilight / night (sun phase) | jour / demi-jour / nuit | *Crépuscule* reads as evening only; the phase covers dawn too. |
| daylight | jour (m) | *Il faisait jour.* |
| dark, night | nuit (f) · *dans le noir* | *Il faisait nuit ici.* |
| time-lapse | Au fil des ans | Never *time-lapse*, never *accéléré*. |
| video | vidéo (f) | |
| replay (verb, button) / Replay (section) | rejouer / Reconstitution (f) | |
| play / pause | Lecture / Pause | |
| geometry / plan view / globe | géométrie (f) / vue en plan (f) / globe (m) | |
| pin (dropped) | repère (m) | *poser un repère*. |
| acquisition, acquired | acquisition (f) | A noun, so no agreement. |
| tone, toned | étalonner, étalonné(e) | Never *tonifier*. |
| touch-ups | retouches (f pl) | |
| colour-balanced / sharpened | couleurs équilibrées / netteté accentuée | |
| pan-sharpened / panchromatic | affinée avec la bande panchromatique de 15 m / panchromatique | |
| fault | anomalie (f) | Label `ANOMALIE`. Never *faute* (= blame). |
| stale / fetched | périmé / récupéré | Agree with *catalogue* (m). |
| share / download / download image | partager / télécharger / Télécharger l’image | |
| copy link / copied / link copied | Copier le lien / Copié (lien) · Copiée (image) / Lien copié | Two keys where both exist. |
| save PNG / save video | Enregistrer | |
| post (share text) | Texte | Share sheet label. |
| search a place / another place | Chercher un lieu / Chercher un autre lieu | |
| use my location / locate me / near me | Ma position / Me localiser / Près de moi | Never *location* (= rental). |
| surprise me / drop a pin / or try | Au hasard / Poser un repère / Ou essayez | |
| how this works / about | Comment ça marche (About title) / À propos (HUD, bar) | |
| try again / back / close / cancel | Réessayer / Retour / Fermer / Annuler | |
| zoom in / out | Zoom avant / Zoom arrière | |
| previous / next | Image précédente / Image suivante | |
| Enter / Space / Esc (keys) | Entrée / Espace / Échap | |
| last 7 days / this week / that week | 7 derniers jours / cette semaine / cette semaine-là | |
| local time | heure locale | *à 11:21, heure locale*. |
| UTC, EST, CET, JST… | unchanged | Never *TU*, *HNE*, *HNEC*. |
| ago / just now / in 3 h | il y a / à l’instant / dans 3 h | *il y a* precedes the number. |
| s / min / h / days | s / min / h / j | Prose: *seconde(s)*, *minute(s)*, *heure(s)*, *jour(s)*. |
| about (approximately) | environ · vers (times) · ≈ (web readouts only, §6.8) | |
| every 10 minutes | toutes les 10 minutes | |
| at least / none | au moins / aucun, aucune | *Aucune image n’a été…* (with *ne*, without *pas*). |

**Names and their articles in French prose** (never translate the name; the article is French usage): *l’ESA*, *la
NASA*, *la NOAA*, *EUMETSAT* (no article), *l’USGS*, *l’Agence météorologique du Japon (JMA)*, *le programme
Copernicus*, *le Planetary Computer de Microsoft*, *CelesTrak*, *l’US Space Force*, *la Station spatiale
internationale* (in our own sentences; in a `[SAT]` slot the catalog name stands bare: *ISS (ZARYA) a survolé…*).

### 4.2 Compass

The eight words are a closed set: translators supply the whole phrase for each context, so code never joins a
preposition to a word (*vers l’est*, not *vers le est*).

| ° | Word | Moving (*filant …*) | Offset (*à 61 km …*) | Sky (*au-dessus de votre horizon, …*) |
|---|---|---|---|---|
| 0 | nord | vers le nord | au nord | au nord |
| 45 | nord-est | vers le nord-est | au nord-est | au nord-est |
| 90 | est | vers l’est | à l’est | à l’est |
| 135 | sud-est | vers le sud-est | au sud-est | au sud-est |
| 180 | sud | vers le sud | au sud | au sud |
| 225 | sud-ouest | vers le sud-ouest | au sud-ouest | au sud-ouest |
| 270 | ouest | vers l’ouest | à l’ouest | à l’ouest |
| 315 | nord-ouest | vers le nord-ouest | au nord-ouest | au nord-ouest |

**Bearing readouts** (heading, a satellite's direction in your sky) use the French 16-point letters, as Météo-France,
French sailing and astronomy apps and the OQLF do: N, NNE, NE, ENE, E, ESE, SE, SSE, S, SSO, SO, OSO, O, ONO, NO, NNO.
`SSW` would look untranslated. (`SSO` also abbreviates "sun-synchronous orbit" in the trade; in a heading cell, after
`CAP`, it reads as a direction.)

**Coordinates** keep the international notation in every readout: point decimals and N / S / E / W
(`16.2°S 063.0°E`, `0.2°W`, `43.4723°N 80.5449°W`). They arrive formatted from code, the search box parses only that
form, and a comma inside a coordinate pair is ambiguous. In prose, a longitude is spelled out: *par 0,2° ouest*.

### 4.3 Curated places (`places` namespace)

The landing's three chips and the ~55 places "Surprise me" picks. French exonyms where they exist, no leading
article, capitalised as names (the first word takes a capital as a title: *Mont Fuji*, *Chutes du Niagara*). The
label goes into `[PLACE]` slots in the serif, where a bare title reads as a name (*256 satellites ont observé
Pyramides de Gizeh*). Chips ≤ 14 characters. Countries as `Intl.DisplayNames('fr')` names them.

| id | label (chip) | sublabel |
|---|---|---|
| area51 | Zone 51 (chip *Zone 51*) | Groom Lake, Nevada, États-Unis |
| centralPark | Central Park (chip *Central Park*) | New York, États-Unis |
| giza | Pyramides de Gizeh (chip *Gizeh*) | Gizeh, Égypte |
| uluru | Uluru | Territoire du Nord, Australie |
| palmJumeirah | Palm Jumeirah | Dubaï, Émirats arabes unis |
| worldIslands | Archipel The World | Dubaï, Émirats arabes unis |
| grandCanyon | Grand Canyon | Arizona, États-Unis |
| meteorCrater | Meteor Crater | Arizona, États-Unis |
| lowerManhattan | Lower Manhattan | New York, États-Unis |
| lasVegasStrip | Strip de Las Vegas | Nevada, États-Unis |
| hooverDam | Barrage Hoover et lac Mead | Nevada et Arizona, États-Unis |
| goldenGate | Golden Gate | San Francisco, États-Unis |
| kennedySpaceCenter | Centre spatial Kennedy | Floride, États-Unis |
| washingtonDc | Washington | National Mall, États-Unis |
| mountStHelens | Mont Saint Helens | État de Washington, États-Unis |
| niagaraFalls | Chutes du Niagara | Ontario, Canada |
| panamaCanal | Canal de Panama | Écluses de Gatún, Panama |
| rioDeJaneiro | Rio de Janeiro | Pain de Sucre et Copacabana, Brésil |
| paris | Paris | Île-de-France, France |
| venice | Venise | Vénétie, Italie |
| vesuvius | Vésuve | Naples, Italie |
| istanbul | Istanbul | Bosphore, Turquie |
| chernobyl | Tchernobyl | Oblast de Kyiv, Ukraine |
| tableMountain | Montagne de la Table | Le Cap, Afrique du Sud |
| kilimanjaro | Kilimandjaro | Kilimandjaro, Tanzanie |
| everest | Mont Everest | Népal et Chine |
| angkorWat | Angkor Vat | Siem Reap, Cambodge |
| singapore | Singapour | Marina Bay, Singapour |
| hongKong | Hong Kong | Port Victoria, Hong Kong |
| tokyo | Tokyo | Tokyo, Japon |
| fuji | Mont Fuji | Shizuoka, Japon |
| sydneyHarbour | Port de Sydney | Sydney, Australie |
| richat | Structure de Richat | Sahara, Mauritanie |
| greatBlueHole | Grand Trou bleu | Lighthouse Reef, Belize |
| boraBora | Bora-Bora | Îles de la Société, Polynésie française |
| hardyReef | Hardy Reef | Grande Barrière de corail, Australie |
| male | Malé | Atoll de Malé Nord, Maldives |
| deadSea | Salines de la mer Morte | Bassin sud, Israël et Jordanie |
| binghamCanyon | Mine de Bingham Canyon | Utah, États-Unis |
| mountWhaleback | Mine du mont Whaleback | Pilbara, Australie |
| etna | Etna | Sicile, Italie |
| santorini | Santorin | Cyclades, Grèce |
| teide | Teide | Tenerife, Espagne |
| kilauea | Kīlauea | Hawaï, États-Unis |
| craterLake | Crater Lake | Oregon, États-Unis |
| glenCanyonDam | Barrage de Glen Canyon | Page, Arizona, États-Unis |
| gardenCity | Champs circulaires de Garden City | Kansas, États-Unis |
| almeria | Serres d’Almería | Andalousie, Espagne |
| gibraltar | Gibraltar | Détroit de Gibraltar |
| suezCanal | Canal de Suez | Ismaïlia, Égypte |
| aswanDam | Haut barrage d’Assouan | Lac Nasser, Égypte |
| wadiRum | Wadi Rum | Aqaba, Jordanie |
| sossusvlei | Sossusvlei | Désert du Namib, Namibie |
| victoriaFalls | Chutes Victoria | Zambie et Zimbabwe |
| threeGorges | Barrage des Trois-Gorges | Hubei, Chine |
| shanghai | Shanghai | Rivière Huangpu, Chine |
| itaipu | Barrage d’Itaipu | Brésil et Paraguay |

*Garden City*'s circles are centre-pivot irrigation, not *agroglyphes*. *Kīlauea* keeps the macron as English does
(same font file as English when it is picked). Usage stats, links and shares keep the English label, so counts never
split by language.

## 5. Grammar strategies for runtime slots

### 5.1 [PLACE]: the gazetteer's name, uninflectable

Most inserted names arrive **in English**: the geocoders are asked in English and the offline list carries GeoNames'
English names, so readers will see *Cairo*, *Pacific Ocean*, *Gulf of Mexico*, beside local scripts (*東京*,
*Київ*). Frames must read well with an English name. *256 satellites ont observé Pacific Ocean.*, set as a name in the
serif, is the normal case and is accepted. French would need an article, a contraction or an elision in front of many
names, and the code cannot supply any.

**Allowed positions:**
- Direct object right after a transitive verb: *ont observé [PLACE]*, *a survolé [PLACE]*, *a balayé [PLACE]*, *a
  longé [PLACE]*, *pouvait viser [PLACE]*, *avait [PLACE] à portée*, *a atteint [PLACE]*, *a intégré [PLACE] à…*,
  *aurait pu observer [PLACE]*, *couvrait [PLACE]*.
- After a preposition that never contracts or elides: *sur*, *pour*, *vers*, *avec*, *par*, *entre*.
- After a colon, as a label: *Repère posé : [PLACE]*, *Partager cette semaine : [PLACE]*.
- At the head of a label or title with no verb agreeing: *[PLACE] au fil des ans*, *[PLACE], année après année*.

**Forbidden:**
- After *de*, *à*, *que*, *le*, *la*: they must contract or elide (*du Caire*, *au Caire*, *d’Abidjan*, *qu’Abidjan*).
  ~~*au-dessus de [PLACE]*~~, ~~*à [PLACE]*~~, ~~*image de [PLACE]*~~ (→ *Image prise par [SAT], centrée sur [PLACE]*),
  ~~*Repère posé à [PLACE]*~~.
- After *en*, *au*, *aux* (country and region prepositions).
- Any adjective or participle agreeing with the place, and a place as the subject of *être* + adjective. A sentence
  that English starts with the place is turned around: *Sa fauchée de 290 km couvrait [PLACE].* (never *[PLACE] était
  dans sa fauchée*, where *sa* reads as the place's swath).
- A pronoun standing for the place: ~~*ce qui l’a survolé*~~ after *Repère posé : [PLACE]* (agreement); write *ce qui
  est passé au-dessus*.
- An article added by code. English prefixes *the* to oceans, seas, gulfs, bays, straits and deserts (`placeInProse`,
  `placeParts`); in French that prefix is empty.
- Possessive or genitive constructions on the place (*Waterloo's sky*): use *votre ciel* or *le ciel de ce lieu*.

When the reader's place is meant but the name is not needed, use *ce lieu*, *cet endroit*, *l’endroit même*, *ici*,
*chez vous* (all with known gender).

### 5.2 [SAT] as subject: gender unknown

- Bare name, no article: *Sentinel-2C a observé…*, *ISS (ZARYA) a survolé…*. French usually says *l’ISS*, but the
  slot carries the catalog's own name (*ISS (ZARYA)*, *NORAD 60989*), which reads as a label, so a bare subject is
  acceptable.
- *avoir* verbs or the imparfait only, no *être* + participle: *a survolé*, *a observé*, *a balayé*, *a longé*,
  *pouvait viser*, *avait … à portée*, *a été à portée* (*été* never agrees), *a imagé*, *ne passe pas*.
- No adjective that varies with gender. Epicene adjectives are safe: *immobile*, *visible*, *capable*,
  *géostationnaire*, *rapide*, *possible*. Do not hang a participle or adjective at the head of a sentence whose
  subject is something else (~~*Immobile à 35 778 km…, son imageur balaie…*~~ makes the imager sit still).
- No *il* / *elle* after the bare name: *son capteur*, *sa caméra*, *son radar*, *son imageur*, *son opérateur*, *sa
  fauchée*, *sa position*, *ses images*. After a common noun of known gender, the pronoun is fine (§1.3).
- Not after *de* or *que*: ~~*Aucune image de [SAT]*~~ (*d’Aqua*, *d’ICEYE*). Use *par*: *Aucune image prise par
  [SAT] à cet endroit lors de ce passage.*, *La vue rapprochée a été prise par [SAT].*
- **A nameless satellite.** Card messages get `sat` undefined when a share kept no name: each sentence writes *un
  satellite* itself, in the form it needs (*Un satellite a observé…*, *… prise par un satellite.*). `aSatellite`
  (*Un satellite*) is only the label printed on chips and the plan plate.

### 5.3 [NUM]: CLDR plural categories for French

The code passes counts to `fmt('fr').plural`, which uses `Intl.PluralRules('fr')`. French has three categories:

| Category | Values | Notes |
|---|---|---|
| `one` | 0, 1, and anything below 2 (1,5) | 0 is singular in French: *0 passage*. Dedicated zero sentences (*Aucun…*) are separate branches. |
| `many` | exact multiples of a million (1 000 000, 2 000 000…) | The noun takes *de* / *d’*: *1 000 000 de satellites*, *1 000 000 d’images*. Must be supplied even if never seen. Where an adjective sits between the number and the noun (*derniers jours*), give `many` the `other` text. |
| `other` | everything else (2, 31, 1 000 001) | |

Every plural message selects the **whole phrase**, verb and participle included: *1 satellite a observé* /
*256 satellites ont observé*; *1 image a été rendue publique* / *31 images ont été rendues publiques*.

| Noun | `one` | `other` | `many` |
|---|---|---|---|
| satellite | 1 satellite | 256 satellites | 1 000 000 de satellites |
| image | 1 image | 31 images | 1 000 000 d’images |
| image radar | 1 image radar | 4 images radar | … d’images radar |
| mosaïque météo | 1 mosaïque météo | 9 mosaïques météo | … de mosaïques météo |
| passage | 1 passage | 31 passages | … de passages |
| fois | 1 fois | 42 fois | … de fois |
| vue dégagée | 1 vue dégagée | 11 vues dégagées | … de vues dégagées |
| objet | 1 objet | 16 893 objets | … d’objets |
| résultat | 1 résultat | 3 résultats | … de résultats |
| minute / heure / jour | 1 minute / 1 heure / 1 jour | 41 heures | … de minutes |

The space between a count and its noun is U+00A0, so a number never ends a line alone.

### 5.4 Lists of names

Use `fmt('fr').list` (`Intl.ListFormat('fr', { type: 'conjunction' })`): *Umbra, Capella et Iceye*. No comma before
*et*.

| Case | French |
|---|---|
| one name | *Le radar n’a pas besoin de lumière. Umbra a été à portée 3 fois.* |
| two names | *Le radar n’a pas besoin de lumière. Umbra et Capella ont été à portée 1 204 fois.* |
| names + others, `one` | *… Umbra, Capella et 1 autre satellite radar ont été à portée 1 204 fois.* |
| names + others, `other` | *… Umbra, Capella et 7 autres satellites radar ont été à portée 1 204 fois.* |

*ont été à portée* never agrees, whatever the names' genders. Never *sont passés*.

### 5.5 Dates, times and years inside sentences

- A date in prose takes *le*: *le dimanche 1er novembre*, *le 31 octobre*.
- Day 1 is *1er* in prose and spoken dates only. `Intl.DateTimeFormat('fr')` prints *dimanche 1 novembre*, so this is
  a step in the catalog: `formatToParts`, then the `day` part `'1'` becomes `'1er'`. Readouts keep CLDR's *dim. 1 nov.*
- Display headline ranges use full months, the month written once when both ends share it: *Du 29 octobre au
  5 novembre*, *Du 1er au 7 novembre*. Never *entre le … et le …* in a headline.
- Time: *à 16:14:21 UTC*, *vers 07:49 CET*, *entre 16:12 et 16:15 UTC*. Local time in posts: *à 11:21, heure
  locale*.
- Seasons (the time-lapse caption) are a closed set of whole phrases, each with its own preposition: *une par an, en
  hiver*, *une par an, au printemps*, *une par an, en été*, *une par an, en automne*. Otherwise *une par an*.
- **Years are never grouped**: `fmt('fr').int(2026)` returns *2 026*. Never pass a year (the time-lapse's `since`,
  a frame's year, a Copernicus year), a NORAD ID or a pass ID through `f.int`; write `String(year)`.

## 6. Typography and formatting

### 6.1 Punctuation and spaces

| Mark | Rule | Example |
|---|---|---|
| `:` | U+00A0 before, space after. One colon per sentence. | *Couverture nuageuse de la scène : 25 %.* |
| `;` `!` `?` | U+202F before | *… n’est encore publiée ; les archives…* · *Peut-on me voir ?* |
| `« »` | French guillemets with U+202F inside; nested quotes “ ” | *nous classons le passage « Aurait pu viser ici ».* |
| `’` | Typographic apostrophe U+2019, never `'` | *l’image*, *aujourd’hui*, *n’a* |
| `…` | One character U+2026, no space before | *Recherche…*, *Création du lien…* |
| `–` (en dash) | Ranges in compact labels only, no spaces | `10–30 m`; in prose: *de 10 à 30 m* |
| `—` (em dash) | Not used (the owner's copy has none). Use a comma, a colon or parentheses. | |
| `·` | Separator in labels and chips, a normal space each side | `VUE RAPPROCHÉE · SENTINEL-2B · 10 m` |
| `→` | Kept from English, in web labels only (§6.8) | `12 → 19 NOV. 2026 UTC`, `NORD → SUD` |
| `.` `,` `)` | No space before | |

**Colons in mono caps lines.** Where English only uses a colon to separate a label from its value, use the product's
own separators (` · `, ` / `): `LIEN DIRECT · LE LIEN COURT…` reads better than a full mono cell before the colon. A
mono sentence that needs a colon keeps its U+00A0: French typography does not change with the font.

### 6.2 Numbers

- Decimal comma everywhere a reader sees a quantity: *7,46 km/s*, *5,4°*, *1,1 km*. Format with `fmt('fr').dec`
  and `fmt('fr').int`, never by hand, never `toLocaleString('en-US')`.
- Thousands: U+00A0 (`LOCALE_INFO.fr.group`), not Intl's U+202F: the design's sans draws U+202F at 0.1 em, so *2 330*
  read as *2330* on screen (visual QA, 2026-11-19): *1 715*, *35 778*, *16 917*.
- One French format for every French reader: `fmt('fr')`, not the browser's region (`fr-CH` prints *1'715*, `fr-CA`
  prints *16 h 14*). One catalog, one look, deterministic cards and tests.
- Percent: U+00A0 before `%`: *25 %*. Units: U+00A0 between number and unit: *786 km*, *10 m*, *38 s*,
  *4 min 12 s*. Today the renderer attaches `%` with no space for every language and joins other units with an
  ordinary space (§6.8, item 1): until that lands, put the percent inside the number (`num(f.int(p) + ' %')`),
  and hand-written card strings write the U+00A0 themselves.
- Angles: degree attached, no space: *5,4°*, *±30°*, *62°*.
- **Kept in their international form:** ISO stamps (*2026-11-19 08:32:30 UTC*, *07:34Z*), URLs, readout coordinates
  (*16.2°S 063.0°E*, §4.2), and the coordinates a visitor is told to type (*43.47, −80.54*, with the U+2212 minus),
  because the search box parses a point.
- Never group years, NORAD IDs or pass IDs (§5.5).
- Satellite blurbs (`sats`) have numbers written into the text: group and punctuate them by hand as `fmt('fr')` would
  (*3 040 km*, *1,1 km*), years ungrouped (*depuis 2011*). "Its VIIRS imager…" → *Son imageur VIIRS…*; "images
  the full disk" → *image le disque complet*.

### 6.3 Dates, times and relative time

| Context | Form | Example |
|---|---|---|
| Prose, posts, screen readers | weekday + day + month, lowercase, *1er* for day 1 (formatToParts) | *dimanche 1er novembre*, *vendredi 6 novembre* |
| Short readouts and chips (`day`) | `formatDate('fr', ms, tz, { weekday: 'short', day: 'numeric', month: 'short' })`, as is | *dim. 1 nov.* → caps `DIM. 1 NOV.` |
| Day + month (`dayMonth`) | | *29 oct.* (readout), *1er novembre* (prose) |
| Weekday alone (`weekdayShort`) | | *dim.* |
| Timeline compact day (`dayCompact`, ~5 characters) | French two-letter weekdays *lu, ma, me, je, ve, sa, di* | *di 1*, *lu 2* (never Intl's narrow form: *M* is both Tuesday and Wednesday) |
| Card stamp (with year) | | *dim. 1 nov. 2026 · 11:21 EST* |
| Kicker (`lastDays` · `windowRange`) | built by hand from `formatToParts`, with `→` | `7 DERNIERS JOURS · 12 → 19 NOV. 2026 UTC`, `29 OCT. → 5 NOV. 2026 UTC` |
| Day range (`dayRange`) | by hand, month once | *1 → 8 nov.*, *29 oct. → 5 nov.* |
| Time | 24 h, colons, in prose too | *16:14:21*, *11:21* (never *16 h 14*: the time is one mono token and the seconds matter) |
| Relative (`relative`) | `relativeParts`; *à l’instant* for unit `second`; `relativeFormat('fr', 'short')` for every unit (the compact form only stands in mono meta lines; the long *il y a 6 jours* ran the pass rows past their box) | *à l’instant*, *il y a 12 min*, *il y a 41 h*, *il y a 3 j*, *dans 3 h* |
| Relative, spoken | `relativeFormat('fr', 'long')` | *il y a 12 minutes*, *il y a 41 heures*, *il y a 1 heure* |
| HUD age | | `IL Y A 42 MIN`, `IL Y A < 1 MIN`, `IL Y A 5 H`, `IL Y A 3 J` |
| Durations | | *38 s*, *4 min 12 s*, *1 h 02 min* |
| At sea | | *UTC−9 · en mer* |
| Countdown | kept | `T−00:42` |

Month abbreviations (CLDR, keep the period): *janv., févr., mars, avr., mai, juin, juil., août, sept., oct., nov.,
déc.* Weekdays: *lun., mar., mer., jeu., ven., sam., dim.* Intl's `formatRange` puts U+2009 thin spaces around its
dash across months (*29 oct. – 5 nov.*): build ranges by hand, and never let U+2009 reach a card (§6.8).

### 6.4 Capitalisation

- Sentence case everywhere: headings, buttons, titles, menu items. French has no title case: *Comment ça marche*,
  *Dernière vue dégagée*, never *Dernière Vue Dégagée*.
- Lowercase: months, weekdays, nationalities as adjectives, compass directions (*vers le sud*), *équateur*, *soleil*
  in the everyday sense, *mont*, *lac*, *mer* in running text (*le mont Fuji*, *la mer Morte*).
- Capital: *Terre* (the planet), the first word of an institution (*Agence spatiale européenne*, *Station spatiale
  internationale*), the first word of a curated label (*Mont Fuji*).

### 6.5 Mono caps labels and units

CSS uppercases mono labels (`text-transform: uppercase`, which follows `lang`), and the canvas and satori card
renderers uppercase their mono rows with `toLocaleUpperCase('fr')`, so the catalog writes them in sentence case. In
caps French keeps its accents: `DÉPOINTAGE`, `ÉLÉVATION`, `AU PLUS PRÈS`, `DERNIÈRE VUE DÉGAGÉE`, `MOSAÏQUE`. A label
without its accents (`DEPOINTAGE`) is a bug.

**Units.** Write unit symbols in lowercase (`km`, `m`, `km/s`, `min`, `h`, `s`, `j`). Where a surface sets the line in
mono caps, the distance and speed symbols stay lowercase, as in every language (`ALTITUDE 786 km`, `10 m`: DESIGN §3,
owner 2026-11-19); the HUD's compact ages are uppercased with their line (`IL Y A 3 J`). In sentence-case text (prose,
tooltips, aria labels, posts) they stay lowercase. The wordmark *Watched.* is never set in mono caps. Satellite names are uppercased with their
label as in English (`SENTINEL-2B`).

### 6.6 Line breaking and abbreviations

- No break between a number and its unit or noun, before `:` `;` `!` `?`, inside `« »`, inside a date (*1er nov.*),
  or between a time and its zone (*11:21 EST*): the no-break characters above do this.
- No hyphenation in display headlines, mono labels, place names, satellite names or numbers. About's long prose may
  use `hyphens: auto` under `lang="fr"` (*géostationnaire* is 15 letters on a 390 px phone).
- Abbreviations that cut the end of a word take a period (*env.*, *max.*, *lat.*, *long.*, *nov.*, *asc.*, *sat.*);
  those that keep the last letter do not. Unit symbols never take a period (*km*, *min*, *h*, *j*). Never *min.* for
  "minimum" (it reads as minutes).

### 6.7 Capitals in other surfaces

The video and the card renderers uppercase in code: always `toLocaleUpperCase(LOCALE_INFO.fr.intl)`, never
`toUpperCase()`, so accented capitals and *Ç* come out right.

### 6.8 Cost and speed guardrails (for whoever wires the French catalog)

The owner's rule: French must cost nothing more to serve and stay as fast as English. Every point below is a catalog
string or a small pure-string change: none adds a request, a font file, storage or a runtime library.

1. **Percent and unit spacing** (`api/_lib/i18n/parts.ts`). Pass the locale to `tightUnit` and `numText`. For `fr`,
   only `°′″` attach; `%` and every other unit join with U+00A0 in plain text, and in React `%` gets the same unit
   span and margin as `km`. English stays byte-identical.
2. **No extra font downloads.** Every French letter and mark used here (é è ê à â ç î ï ô û ù ë œ, their capitals,
   « » ’ … – · and U+00A0, U+202F) is inside the `latin` subset's unicode-range the app already loads for English. Do
   not introduce `latin-ext` characters (for instance `Ÿ`) in UI strings. `→` (U+2192) is outside that range and in
   none of the fonts: a system font draws it, as it already does in English, so it costs nothing new on the web.
3. **The share card is not free of fallbacks.** satori sends any character missing from the bundled card fonts to
   `loadFallbackAsset`, which asks Google Fonts for a subset (two requests, up to 4 s each) before the card can render.
   The nine TTFs in `api/_fonts/` lack U+202F, U+2009, `→`, `≈` and `≤`, and `±` outside the mono face.
   `Intl.NumberFormat('fr')` puts U+202F in every grouped number, so:
   - replace U+202F and U+2009 with U+00A0 once, in the card builders, for every locale (English cards contain
     neither, so they do not change): done, `cardSpaces` in `api/_lib/cardSpec.ts`;
   - keep `→`, `≈`, `≤` (and `±` outside mono) out of every `card/fr.ts` string;
   - add a unit test that every character of every `card/fr.ts` output is in the bundled fonts' cmaps: done for every
     Latin and Cyrillic language, `api/_lib/cardGlyphs.test.ts`.
4. **One render per share.** The card's language travels in the link (`l=`), so a French card is one render per
   share, cached like English. Never key it on the crawler's Accept-Language: that would split the cache and multiply
   renders.
5. **No runtime translation.** Catalogs are static strings in the language's chunk; dates, numbers, plurals, lists and
   country names come from the built-in `Intl` APIs through `fmt('fr')` and `dates.ts` (no locale library, no call to
   a translation service).
6. **Telemetry stays English.** A fault notice's `msg` is logged from the English namespace (or its key) for French
   visitors, so the admin page groups the same fault as one, whatever the visitor's language. Analytics enum values
   are never translated (a new value would be stored as null).
7. **Country names:** `Intl.DisplayNames(['fr'], { type: 'region' })` in its default long style; only Hong Kong and
   Macao take the short style (long is *R.A.S. chinoise de Hong Kong*). Never the short style in general (*É.-U.*).
8. **Code changes the French catalog needs** (all pure strings): the verdict verb comes whole from the catalog
   (`copy.ts shareHeadline` adds an English `of` today); compass bearings reach the catalog as the 0–15 index (or the
   English letters, mapped through a 16-entry table) so French can write `SSO`; the timeline's accessible summary is a
   message (§3.6); years never pass through `f.int` (§5.5).
9. **Search input (later, optional):** `parseCoordinates` reads only a decimal point and N/S/E/W. Accepting a decimal
   comma and `O` for *ouest* would match what French visitors may type; until it does, the hint keeps the point form.

## 7. Length discipline

French runs about 15 to 25 % longer than this product's English in prose, and 30 to 60 % longer in short labels,
where English packs a verb into one syllable (*share*, *copy*, *replay*). Budgets:

- Prose and headlines: at most English + 25 %. Over that, cut words, not meaning.
- Buttons, chips and mono labels: at most English + 4 characters, unless a key's comment gives a hard width; then the
  comment wins. Every catalog key has one string, so the form chosen must fit the narrowest screen named.
- Never abbreviate a word just to fit, except with the standard abbreviations in §6.6.

Strategies, in this order: drop the article (*Télécharger l’image* → *Télécharger* where the image is the context);
use the noun (*Acquisition* rather than *Image acquise*); use the established short word; use the standard
abbreviation (*j*, *min*, *max.*, *sat.*); move detail into the `aria-label` / `title`, which have no length limit.

| English (chars) | French (chars) | Where / note |
|---|---|---|
| HOW THIS WORKS (14) | À PROPOS (8) | HUD corner, 375 px phone |
| SURPRISE ME (11) | AU HASARD (9) | Example chip |
| USE MY LOCATION (15) | MA POSITION (11) | Wide screens; also the accessible name. *Utiliser ma position* (20) ellipsised the placeholder |
| LOCATE ME (9) | ME LOCALISER (12) | Phone search line |
| NEAR ME (7) | PRÈS DE MOI (11) | Chip on phones ≤ 400 px |
| LOCATING… (9) | LOCALISATION… (13) | Same chip while locating |
| SEARCH A PLACE (14) | CHERCHER UN LIEU (16) | Placeholder; *Rechercher un lieu* ellipsised at 1024 px |
| OR TRY (6) | OU ESSAYEZ (10) | Example row lead |
| LAST 7 DAYS (11) | 7 DERNIERS JOURS (16) | Kicker |
| CLOSEST LOOK (12) | VUE RAPPROCHÉE (14) | Tag, chip |
| LAST CLEAR LOOK (15) | DERNIÈRE VUE DÉGAGÉE (20) | Tag, chip (may wrap) |
| TIME-LAPSE (10) | AU FIL DES ANS (14) | Row title, viewer button: check the viewer bar on a 375 px phone |
| OFF-NADIR (9) | DÉPOINTAGE (10) | Readout |
| PIXEL / ALTITUDE (5 / 8) | PIXEL / ALTITUDE (5 / 8) | Readout |
| PASSES (6) | PASSAGES (8) | Rule label, tiles |
| SHARE (5) | PARTAGER (8) | Buttons |
| DOWNLOAD IMAGE (14) | TÉLÉCHARGER L’IMAGE (19) | Pass view link |
| COPY LINK (9) | COPIER LE LIEN (14) | Share sheet; the row stacks on a phone where three labels do not fit one line |
| SAVE PNG (8) | ENREGISTRER (11) | Share sheet |
| REPLAY (6) | REJOUER (7) | Buttons; the section is RECONSTITUTION (14) |
| TRY AGAIN (9) | RÉESSAYER (9) | Error notices |
| ELEVATION (9) | ÉLÉVATION (9) | Readout |
| SUN ELEVATION (13) | HAUTEUR DU SOLEIL (17) | Geometry grid, two columns |
| GROUND SPEED (12) | VITESSE AU SOL (14) | Readout |
| CLOUD AT SPOT (13) | NUAGES ICI (10) | Strip label |
| SUN (3) | SOLEIL (6) | HUD corner (`SOLEIL 16.2°S 063.0°E`) |
| 27 THIS WEEK (12) | 27 EN 7 JOURS (13) | Gallery counter box (12) |
| ALL · DETAILED · WEATHER · RADAR | TOUTES · PRÉCISES · MÉTÉO · RADAR | Filter, ≤ 8 each |
| VIDEO / RENDERING 42% / VIDEO FAILED / SAVE VIDEO | VIDÉO / CRÉATION 42 % / ÉCHEC VIDÉO / ENREGISTRER | One 132 px button |
| MOSAIC PIXEL (12) | PIXEL MOSAÏQUE (14) | Card readout, 155 px column: render once |
| PHOTO · LIKELY · COULD · OVERHEAD | IMAGE · PROBABLE · POSSIBLE · SURVOL | Card lanes, ≤ 8 |
| Likely watched (14) | Probablement observé (20) | Tiles: nowrap, ellipsised label ~200 px wide; it fits |

Headlines: the condensed display face absorbs +10–20 %; the share card's headline size already steps down with
length. The hero is three explicit lines and never wraps further.

## 8. Sensitive content

**Surveillance and privacy.** The product shows that something could see you, and is exact about how little it could
see. The French must never inflate either side.
- *observer* (neutral, scientific: *satellites d’observation de la Terre*) for what satellites did. Never *surveiller*,
  *espionner*, *traquer*, *pister*, *fliquer*: they assert intent toward the reader, which the product does not know.
- The reassurances keep their numbers and their flatness: *Non. Au mieux, un pixel couvre ici 10 m de côté. Une
  voiture tient dans un pixel. On ne vous y voit pas.* No *rassurez-vous*.
- *satellites militaires et de renseignement*, never *satellites espions* in our copy.
- *we track* is *nous suivons* (we follow in the catalog), never *nous traquons*.
- The privacy text is translated exactly: no promise more or less than the English.

**War zones in the time-lapse** (Gaza Strip, West Bank, Ukraine, Lebanon). The UI states the method, never the
reason: the caption says *11 vues dégagées · une par an, en automne*, never that a war is shown. Our own copy uses
*bande de Gaza* (lowercase *bande*), *Cisjordanie*, *Ukraine*, *Liban*. Never *territoires occupés*, *Judée-Samarie*,
*zone de guerre*, *destruction*, *frappes*, or any word assigning cause or blame. Describe what is on screen: *une vue
dégagée par an*, *la même saison chaque année*. The feature's name, *Au fil des ans*, is neutral on purpose (no
*évolution*, no *transformation*).

**Glaciers.** *fin de la saison de fonte*, *glacier*, *glace*. No *catastrophe*, *fonte dramatique*, *disparition*: the
frames speak for themselves.

**Place-name politics** (our own copy only; gazetteer names are shown as they come):
- *Kyiv*, *Kharkiv*, *Lviv*, and *oblast de Kyiv*. French usage is split (major titles such as *Le Monde* have kept
  *Kiev*; Ukrainian institutions and part of the press write *Kyiv*). Watched chooses *Kyiv* deliberately, as the
  form Ukraine asks for, and as the English source already writes it. *Tchernobyl* stays (the established exonym,
  not *Tchornobyl*).
- Countries come from `Intl.DisplayNames('fr')` and are never overridden for politics: *Taïwan*, *Kosovo*, *Sahara
  occidental*, *Territoires palestiniens*, *Macédoine du Nord*, *Tchéquie*, *Eswatini*, *Myanmar (Birmanie)*, *Côte
  d’Ivoire*. Never add a sovereignty qualifier (*province de*, *République de Chine*, *Crimée (Russie)*). Crimea and
  other disputed areas are named as the gazetteer names them, with no country attached in our copy.
- Hong Kong and Macao: the short CLDR names (*Hong Kong*, *Macao*), a length choice, not a political one.
- The Dead Sea salt ponds keep the English source's *Israël et Jordanie*.

**Attribution lines** burnt into images, cards, the time-lapse and its video stay verbatim in English (*Contains
modified Copernicus Sentinel data 2026*, *Landsat: USGS / NASA*, *Himawari: JMA, via NASA GIBS*): they are licence
notices, and a shared card travels beyond French readers. About's credits section is prose and is translated, with
the attribution sentence quoted as given.

## 9. Pitfalls and the reviewer's checklist

### 9.1 False friends and ambiguous words in this product

| English | Trap | Use |
|---|---|---|
| actual (pictures) | *actuel* = current | *réel*, *réellement*, *vrai* |
| location | *location* = rental | *position* (yours), *emplacement* |
| place | *place* = square, seat | *lieu* |
| spot | *un spot* = a TV advert, a spotlight; *votre point* = your argument; *au point* = in focus | *l’endroit même*, *ici* |
| watched | *regardé* (childish), *surveillé* (intent), *vu* (weak, agrees), *photographié* (owner rule) | *observé* |
| pass | *passe* (ground-station jargon), *col* (mountain), *transit* (astronomy) | *passage* |
| scene | *scène* in its theatre sense, *paysage* | *scène* in the remote-sensing sense only |
| swath | *bande* (spectral bands, *bande de Gaza*) | *fauchée* |
| elevation | *altitude* | *élévation* (a satellite's angle); *hauteur* for the sun |
| clear | *clair* (bright) | *dégagé* |
| coarse | *grossier* (crude, rude) | *peu détaillé* |
| twilight | *crépuscule* (evening only, to most readers) | *demi-jour* |
| archive | *une archive* (an archived file) | *les archives* |
| fault | *faute* (blame) | *anomalie* |
| Sun (HUD) | read as the weekday | *soleil* (`SOLEIL`); the weekday is *dim.* |
| Likely | *sans doute* (misread as "undoubtedly") | *probablement* |
| eventually | *éventuellement* = possibly | *finalement*, *à terme* |
| steady (light) | *fixe* (= stationary) | *sans clignoter* |
| time-lapse | *time-lapse* (anglicism), *accéléré* (a playback speed; reads as "sped up") | *Au fil des ans* |
| replay | *replay* (anglicism) | *rejouer*; section *Reconstitution* |
| closest look | *au plus près* (that is closest approach) | *vue rapprochée* |
| made public | *publicisé* | *rendu public* |
| cell (the stored area) | *maille* (jargon) | *carré d’environ 10 km de côté* |
| data | singular | *les données* (f pl): *les données sont* |
| Copied | one form for all | *Copié* (lien), *Copiée* (image) |
| SSO (bearing) | "sun-synchronous orbit" | fine in a heading cell; never in prose |

Gender reminders: *orbite* (f), *image* (f), *photo* (f), *vue* (f), *scène* (f), *fauchée* (f), *mosaïque* (f),
*caméra* (f), *station* (f), *position* (f); *satellite* (m), *passage* (m), *pixel* (m), *radar* (m), *capteur* (m),
*lieu* (m), *endroit* (m), *catalogue* (m), *dépointage* (m), *survol* (m), *repère* (m).

### 9.2 Reviewer's checklist (run it on every string)

1. **Verb:** "watched" is *observer*. No *photographier*, *surveiller*, *espionner*, *regarder*.
2. **Address:** *vous* only. No *tu*, *te*, *ton*.
3. **Agreement:** nothing agrees with *vous*, a satellite name or a place name. No *être* + participle after [SAT], no
   *il* / *elle* right after a bare satellite name, no participle after a preceding *vous*, no dangling participle or
   adjective at the head of a sentence.
4. **[PLACE]:** follows a transitive verb, *sur* / *pour* / *vers* / *par*, or a colon. Never after *de*, *à*, *que*,
   *le*, *la*, *en*, *au*. No article added. No pronoun standing for it. Reads well with an English name.
5. **[SAT]:** bare, after *par* rather than *de*; a nameless satellite written as *un satellite* by the sentence.
6. **Verdicts:** the four titles, lanes and verbs exactly as §3.6; the verb slot unbroken (*pouvait viser*).
7. **Plurals:** `one`, `many` and `other` all present; the verb and participle inside each form; `many` uses *de* /
   *d’*; 0 reads singular.
8. **Numbers:** `fmt('fr')`; decimal comma; U+202F thousands; U+00A0 before units and `%`; degrees attached; years,
   NORAD IDs and pass IDs ungrouped; ISO stamps, readout coordinates and typed coordinates keep the point.
9. **Punctuation:** U+00A0 before `:`; U+202F before `;` `!` `?` and inside `« »`; one colon per sentence; separators
   rather than colons in mono caps; `’` not `'`; `…` one character; no em dash; escapes in source.
10. **Units:** written lowercase; caps only where the surface uppercases the line.
11. **Compass:** whole phrases from the closed set in prose; bearing letters with **O** in readouts; coordinates with
    N / S / E / W.
12. **Dates:** *1er* for day 1 in prose and spoken forms; CLDR abbreviations with periods in readouts; full months in
    display headlines; months and weekdays lowercase; compact relative days short (*il y a 3 j*), spoken ones long.
13. **Form:** buttons in the infinitive, labels as nouns, sentence case, accents on capitals.
14. **Honesty:** *image* versus *photo* matches what is on screen (radar, mosaics and full disc are images; the
    gallery and viewer chrome say *Images*); *Nous ne pouvons pas savoir* for what we cannot know; no claim beyond the
    English.
15. **Tone:** no marketing verb, no exclamation mark, no *n’hésitez pas*, no *découvrez*, no bare *Voyez*.
16. **Untouched:** Watched., www.watched.earth, satellite / sensor / programme names, NORAD IDs, UTC, EST / CET / JST,
    ISO stamps, key symbols, attribution lines.
17. **Length:** within budget (§7) on the narrowest screen the key's comment names; the hero stays three lines.
18. **Characters and cost:** nothing outside the fonts' `latin` subset; no `→`, `≈`, `≤` (or `±` outside mono) in card
    strings; no U+202F or U+2009 left in card text after normalisation.

## Decisions log

Each item of the native review (`fr.critique.md`), numbered as there, and how it was resolved: 39 numbered items (32 accepted, 7 partly accepted, 0 rejected outright) and 7 items from its "Missing from the guide" list (all accepted).

1. **Split `could` verb**: Accepted: the verb slot is *pouvait viser*; whole sentences use *avait [PLACE] à portée*,
   with offsets written *à 61 km à l’ouest* (§3.4–§3.6).
2. **Units "always lowercase" unworkable**: Settled by the owner (2026-11-19) for every language: units are written
   lowercase and stay lowercase in caps lines (§6.5).
3. **Decimal comma in readout coordinates**: Accepted: readout coordinates keep point and N/S/E/W; prose spells them
   out; every other decimal keeps the comma (§0, §4.2, §6.2).
4. **W versus O in bearings**: Accepted: bearing readouts use the French 16-point set with O; coordinates keep W/E;
   the code passes the index or maps through a table (§4.2, §6.8).
5. **Overhead definition without a subject**: Accepted: *Passage dans votre ciel : les stations spatiales, et tout le
   reste.* (§3.6).
6. **`could` definition used *regarder***: Accepted: *… ne dit pas si elle a visé ce lieu.*, and About's *Rien ne
   permet de savoir si elle l’a vraiment fait.* (§3.6).
7. **ISS *point fixe***: Accepted: *éclairée par le soleil … comme un point brillant, sans clignoter.* (§3.4).
8. ***une chaque automne***: Accepted: whole phrases *une par an, en hiver / au printemps / en été / en automne*
   (§3.8, §5.5, §8).
9. ***Voyez***: Accepted: sub *Vous verrez…*, card `invite` *Voir ce qui vous observait*, `enterAnyPlace` *Choisissez
   un lieu* (§3.2, §3.5; first *N’importe quel lieu sur Terre*, too long for the card's footer).
10. ***Au plus près* for two things**: Accepted: "Closest look" is *Vue rapprochée* everywhere; *Au plus près* only
    for closest approach (§4.1).
11. ***votre point*, *nuages au point***: Partly accepted: prose *l’endroit même*, labels *ici*; the card chip is
    *Nuages ici* (not *Nuages sur l’endroit*, which reads unfinished) (§3.5, §3.9, §4.1).
12. ***viser à la verticale*; *pointer* is not a calque**: Accepted: prose uses *pointer* / *dépointé*; *viser* stays
    in the verdict title and verb (§3.4, §3.6).
13. ***Impossible de savoir* reads as an error**: Accepted: *Nous ne pouvons pas savoir si une image a été prise.*;
    *Impossible de* kept for real failures (§1.1, §3.4).
14. **`%` and unit spacing need a code change**: Accepted: locale-aware `tightUnit` / `numText`, English unchanged,
    with a catalog workaround until it lands (§6.2, §6.8).
15. **Time-lapse is not an *accéléré***: Accepted: *Au fil des ans*, with dialog, share title and captions to match
    (§3.8).
16. **Curated places missing**: Accepted and completed for all 57 ids (the review listed about 40), with *État de
    Washington* to tell the state from the city and *Champs circulaires* for pivot irrigation (§4.3).
17. **Slot traps not worked out**: Partly accepted: every key listed is adopted; `aSatellite` needs no second key, because card
    sentences already write *un satellite* themselves and `aSatellite` is a chip label (§3.5, §5.2).
18. **HUD and About headings**: Accepted: HUD *À propos*, title `Comment ça` / *marche*., the lede as proposed with
    *images* for *photos* (§3.7).
19. **Gallery and viewer chrome say Photos**: Accepted: *Images* throughout that chrome; *photo* only for Sentinel-2 /
    Landsat (§3.9).
20. **Overhead title and lane**: Accepted: *Survolé* / `SURVOL`; titles agree with an implied *lieu* (§3.6).
21. **Colons**: Partly accepted: one colon per sentence; separators instead of label colons in mono caps; a mono
    sentence that needs a colon keeps its U+00A0 (§2.2, §6.1).
22. ***Grossière***: Accepted: *Peu détaillée, mais réelle* (§3.9, §9.1).
23. **Glossary rows missing**: Accepted: tone, touch-ups, pan-sharpened, standby spare, scheduled, GMST, frame =
    *vue*, *sat.*, *en accès libre*, *passe* reclassified as ground-station jargon (§4.1).
24. **Sun height, twilight**: Accepted: *Hauteur du soleil*; phase *jour / demi-jour / nuit* (§4.1).
25. **`02 / REJOUER` is a verb**: Accepted: *Reconstitution* (not *Lecture*, which is the play button's name) (§3.9).
26. **Headline windows**: Partly accepted: full months, month once; the 1-day window is *Ces 24 dernières heures*
    (standard order, matching *Ces 7 derniers jours*), not *Ces dernières 24 heures* (§3.3).
27. **Date mechanics**: Accepted: *1er* via `formatToParts` in prose only; relative short for minutes and hours, long
    for days; kicker built by hand; no U+2009 on cards (§5.5, §6.3).
28. **Compact day label**: Accepted: *lu, ma, me, je, ve, sa, di* (§6.3).
29. **Numerals at sentence start; spelled-out numbers**: Partly accepted: *Résolution : 10 m par pixel.* in posts and
    prose, counts never spelled out; the data headlines whose count leads by design are exempt (§2.2, §3.5).
30. **Bare *ISS* reason; pronoun rule**: Accepted: the slot carries the catalog name, which reads as a label;
    pronouns allowed after a common noun of known gender (§1.3, §5.2).
31. **Geostationary dangling modifier**: Partly accepted: *Sa position est fixe, …* as proposed, split into two
    sentences for rhythm (§3.4).
32. **Hero checks, post hook**: Accepted: layout checks at 1440 / 390 px and on the card; hook *Quelque chose vous
    observait, vous aussi, cette semaine.* (§3.1, §3.5).
33. **Cost guardrails**: Accepted: `→` is outside the latin range (free on the web, as in English); the card fonts'
    missing characters listed and kept out of card strings; U+202F / U+2009 normalised once for every locale; cmap
    unit test; one render per share via `l=` (§6.8). Verified against the nine TTFs' cmaps.
34. **Kyiv reason**: Accepted: presented as a deliberate choice in a split usage; *Tchernobyl* kept (§8).
35. **Search example coordinates**: Accepted: *telles que 43.47, −80.54*, point and U+2212 kept exactly (§3.9, §6.2).
36. **Length gaps**: Partly accepted: placeholder, locating, awaiting, acquired, globe `imaged`, video button, Save PNG
    (*Enregistrer*), filter and tile checks adopted; *Semaine · 27* rejected because French reads *semaine 27* as a
    week number, replaced by *27 en 7 jours* (§3.9, §7).
37. **Inserted names mostly English**: Accepted: frames must read with English names; *ont observé Pacific Ocean* is
    the normal, accepted case (§5.1).
38. ***Maille***: Accepted: *un carré d’environ 10 km de côté* (§2.1, §3.7).
39. **Key names**: Accepted: *Entrée*, *Espace*, *Échap*, also for the time-lapse's `escKey` (§3.7).

From the review's "Missing from the guide" list:

- **M1 Satellite blurbs**: Accepted: numbers grouped and punctuated by hand as `fmt('fr')` would, years ungrouped
  (§6.2).
- **M2 Loading screen**: Accepted: *Connexion lente, chargement en cours* (§3.9).
- **M3 Language switcher**: Accepted: *Langue : Français. Changer* (§3.9).
- **M4 Share sheet**: Accepted, extended to every label of the sheet (§3.9).
- **M5 Globe fallback**: Accepted: *Vue 3D indisponible* / *WebGL 2 est désactivé dans ce navigateur* (§3.9).
- **M6 At sea and the credit**: Accepted: *UTC−9 · en mer*; *Créé par [handle]* (§3.9, §6.3).
- **M7 4-digit grouping trap**: Accepted: never pass a year, NORAD ID or pass ID through `f.int` (§5.5). Verified:
  `fmt('fr').int(2026)` gives *2 026*.

### On-screen review (2026-11-19)

Every state checked in the browser at 1024, 1280, 1440, 390 and 360 px, and the share cards rendered, against English.
What changed, and why:

- **Fit.** `searchPlaceholder` *Chercher un lieu* and `useMyLocation` *Ma position* (the placeholder ellipsised beside
  the long locate label); `computing.window` drops *Fenêtre de* (*7 jours · 27 oct. 05:00 → 3 nov. 05:00 UTC*);
  `stages.match.idle` *Association scènes-passages* (28 characters: the row ellipsised at 390 px); the pass rows:
  `latest` empty, `offNadir` *5,3° du nadir* (also the timeline's tooltip), compact relative days *il y a 6 j*,
  `imagedOrder` *vue rapprochée en tête*; the laptop photo card's `status.mosaic` *Mosaïque* (the pass list's
  tag; *Mosaïque météo* ran the line past its box); the geostationary square's `noneNow` *Rien pour l’instant* (two lines, as
  English; *Pas d’image pour l’instant* took four); the card's `geometry` *Géométrie · nord en haut* (it ran into the
  scale bar) and `enterAnyPlace` *Choisissez un lieu* (it ran into `www.watched.earth`; the default card's alt text
  ends *Choisissez un lieu, n’importe où sur Terre.*).
- **Line breaks.** The card's headlines tie the auxiliary to its participle with U+00A0 (*a observé*, *ont observé*,
  *a balayé*, *a survolé*, *pouvait viser*): a bare *a* closed the first line (*Sentinel-2C a / observé / Waterloo.*).
- **Copy.** About's `tilting`: *nous classons le passage « Aurait pu viser ici »* (*l’appelons* had no antecedent).
- **Kept after seeing them:** *Poster sur X* (X's own French verb, fits), *Copier le lien* for the link (once the share row
  made room for its labels; *Copier* alone sat beside *Copier l’image*), `cloudChip` *Nuage*, `namingPlace` *Recherche du nom*, the hero on the default card (it fits
  the 466 px column with room to spare).
