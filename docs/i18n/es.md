# Watched: Spanish (es) localisation style guide

Final, 2026-11-19. One neutral international Spanish for readers in Spain, Mexico, Argentina, Colombia, the US and
everywhere else Spanish is read. Every translator and reviewer of `es` follows this guide. Where it says "never", there
is no exception unless this guide lists one. Where it disagrees with `docs/i18n/TRANSLATING.md` on language, this guide
wins; on how the system works (catalogs, `fmt`, `dates.ts`, rich parts), the system docs win.

Sources: `docs/DESIGN.md` (§3, §7 and the verdict table), `docs/I18N.md`, `docs/i18n/TRANSLATING.md`, `README.md`,
`src/ui/landing/Landing.tsx`, `src/ui/results/lib/copy.ts`, `src/ui/results/lib/meta.ts`, `src/ui/pages/AboutPage.tsx`,
`api/_lib/cardSpec.ts`, `api/_lib/card.ts`, `api/_lib/i18n/{locales,format,dates,parts}.ts`, `api/_lib/i18n/card/en.ts`,
every `src/i18n/en/*.ts` namespace (their comments carry the length budgets used in §7), `src/imagery/geocode.ts`, and
the CSS of the strip, gallery bar, share sheet and HUD. Intl output quoted here is Node 22 / ICU 78. Widths in §3.1 and
§7 were measured with the shipped font files (`api/_fonts/*.ttf`: harfbuzz for mono, satori for the card hero).

**Cost and speed.** Nothing in this guide needs a paid service, a library, an extra request or an extra download. Plural
rules, numbers, lists (`y` → `e`), dates, relative time and country names come from the browser's built-in `Intl`.
Spanish has one number format for every reader (§6), so a share has one card in one language: no regional variants, no
extra card renders, no extra cache entries. The only code this guide asks for is a few lines of pure Intl: grouping
digits with U+00A0 in `fmt('es')` (§6) and three country-name overrides (§8). Every Spanish character (á é í ó ú ü ñ
¿ ¡ ° U+00A0 “ ” ’ … –) is in the `latin` subset of Instrument Sans, Instrument Serif and Martian Mono that the English
site already loads, so Spanish adds no font bytes. Never use U+202F (narrow no-break space): it is not in those subsets.

---

## 0. Decisions at a glance

| Question | Decision |
|---|---|
| Address | **tú** everywhere the reader is addressed. Never usted, vos or vosotros. |
| Product verb ("watched") | **observar**: *observó / observaron*. Never vigilar, espiar, fotografiar, ver, mirar. |
| Hero (landing and default share card) | `Algo` / `te observó *a ti*` / `esta semana.` |
| Pass (noun, the unit) | **pasada** (f.), *pasadas*. Never *pase*, never *paso* as the unit. |
| Verdict titles | **Observada** · **Probablemente observada** · **Pudo haber apuntado aquí** · **Pasó por encima** |
| Lane labels | `IMAGEN` · `PROBABLE` · `POSIBLE` · `DE PASO` |
| Image / photo | **imagen** in every generic UI string; **foto** only in a sentence that names Sentinel-2, Landsat or daylight cameras. |
| Spot (the searched place) | *aquí*, *justo aquí*, *el punto exacto*, *este lugar*. Never *tu punto*. |
| Buttons | Infinitive: *Compartir*, *Copiar URL*, *Guardar PNG*. The user's own voice keeps the first person: *Localízame*, *Sorpréndeme*. |
| Numbers | One format for every reader: decimal comma `7,46`; 4 digits ungrouped `1715`; 5 or more grouped with U+00A0 `35 778`. |
| Percent | `25%`, no space, everywhere. |
| Coordinates | Not copy: left exactly as code writes them (`43.47°N 80.54°W`, `16.2°S 063.0°E`). Example coordinates copied character for character. |
| Compass words and 16-point readouts | Spanish, **O** for *oeste*: *al oeste*, `SSO`, `ONO`. |
| Degrees | `°` (U+00B0). Never `º` (U+00BA) or `˚`. |
| Time | 24 h, `16:14:21`; *a las*, but *a la* when the clock starts with `01:`. |
| Dates | From Intl `es` parts: mono `dom 1 nov`, prose *el domingo 1 de noviembre*. No hand-made month tables. |
| Quotes | “ ” then ‘ ’. |
| Video | *video* (no accent). |
| Place and satellite slots | Bare: no article, no personal *a*, nothing that agrees with them. `[PLACE]` is never a subject. |
| Licence credits | Stay in English, in code. Not in the catalogs. |

---

## 1. Register and address

| Surface | Decision | Example | Why |
|---|---|---|---|
| Display headlines (hero, results headline, About title, share card headline) | Declarative statement. The reader appears only as the clitic *te* or the possessive *tu*, or as stressed *a ti* for the accent. No imperative. | *Algo te observó a ti esta semana.* | The uncanny line is intimate and personal. *te* has no gender, so we never have to guess the reader's. |
| Sentences and prose (pass detail, notes, footnotes, share post text) | **tú** for the reader (*tu cielo*, *sobre tu horizonte*, *donde estás*). The product speaks as an implied *nosotros* through the verb ending only (*calculamos*, *no podemos saber*), never the pronoun. Preterite for dated facts, imperfect for states during a pass, present for definitions. | *No podemos saber si lo hizo.* | Matches the English "we can't know" honesty without the stiffness of an explicit *nosotros*. |
| Buttons, menu items, placeholders, aria labels of actions | **Infinitive**, no address. Items in the user's own voice keep the first person, as the English does with "my" and "me". | *Compartir*, *Guardar PNG*, *Buscar un lugar*, *Marcar un punto*; *Usar mi ubicación*, *Localízame*, *Sorpréndeme*, *Cerca de mí* | The infinitive is the Spanish platform convention for actions (iOS, Android, Windows, Google). |
| Mono caps labels | Noun phrases with no article and no verb. Index headers that invite use the tú imperative. | `ÚLTIMOS 7 DÍAS`, `ALTITUD`, `FUERA DE NADIR`, `02 / PASADAS`; `02 / O PRUEBA` | Instrument readouts name things; they do not talk. |
| Error notices | Label `ERROR`. What failed in the impersonal *se*; the way out in the tú imperative. No apology, no *lo sentimos*, no *por favor*, no exclamation. | *No se pudo cargar el catálogo de órbitas. Revisa la conexión y vuelve a intentarlo.* | Blames no one, tells you what to do, in the same two beats as the English. |
| About page | tú, plain and conversational, short sentences, implied *nosotros*. Questions with ¿…?. | *¿Puede verme un satélite? No.* | The owner's About copy is short, plain and friendly; Spanish keeps that, never academic. |

**Rejected alternatives**

- **usted.** Lost on three counts. Its object pronoun is gendered (*Algo **lo** observó a usted* / *Algo **la** observó a
  usted*), and we do not know the reader; *te* is not gendered. It turns the human moment into a notice from a bank or a
  ministry. And Spanish consumer products (iOS, Android, Google, Spotify, Netflix) address the user as tú in Spain and
  in Latin America alike. Watch for accidental usted: a third-person verb with no subject (*¿Me puede ver?*) reads as
  "can you (usted) see me?". Name the subject (*¿Puede verme un satélite?*).
- **vos** (voseo). Natural in Argentina, Uruguay and parts of Central America, regional everywhere else. Rioplatense
  readers are used to tú in international products. So: *a ti*, never *a vos*; *Busca*, never *Buscá*.
- **vosotros.** Spain-only, and we never address a group.
- **tú imperative on buttons** (*Comparte*, *Descarga*). Reads as a command or an ad. Imperatives stay in prose and
  index headers (*Busca cualquier lugar…*, *Revisa la conexión…*, *O prueba*).
- **Impersonal everywhere** (*Se observó este lugar*). Loses the second person, which is half of the product.

---

## 2. Voice

DESIGN §7: declarative, specific, quietly uncanny, second person, real numbers. In Spanish that means:

- **Declarative.** Subject, verb, object; verb early. Dated facts in the preterite (*pasó*, *observó*, *se
  publicaron*). What was going on during the pass in the imperfect (*Miraba directamente hacia abajo.*, *Aquí era de
  noche.*, *Su franja cubría Waterloo.*). Definitions and rules in the present (*Hay una imagen real de este lugar…*).
  *Aún no se ha publicado* (present perfect) is right for "not yet" in every region; so is *ha observado todo el
  planeta* for an ongoing record.
- **Specific.** Digits for every count and measure, named satellites, exact times. Never *varios*, *muchos*, *unos
  cuantos* when the number is known. "~10 km" is *unos 10 km*.
- **Quietly uncanny.** The effect comes from plain facts placed next to *tú*: *Cruzó tu cielo.* *Vio tus nubes, no tus
  calles.* *A ti no se te ve.* No fear adjectives (*inquietante*, *misterioso*, *escalofriante*), no exclamation marks,
  no rhetorical questions except the share hook (*¿Qué te observó esta semana?*).
- **Second person.** Through verb endings and *te / tu / ti*. The subject pronoun *tú* only when it contrasts.

**Rhythm.** 6 to 18 words a sentence, one fact a sentence, at most one subordinate clause. Two short sentences beat a
gerund or a *que… que…* chain. Use a colon to deliver a number (*Nubosidad en toda la escena: 25%.*). Spanish puts new
information last, so when English opens with the striking item, Spanish may move it to the end (*Se publicaron 31
imágenes.*).

**Avoid**

- Marketing: *¡Descubre…!*, *increíble*, *potente*, *al instante*, *de un vistazo*, *te contamos*, *gratis* as a hook.
- Calques: passive *ser* + participle (*fue publicada*); the gerund of a later action (*…, moviéndose al sur*);
  *a nivel de*; *hacer sentido*; *realizar una búsqueda* (say *buscar*); *el mismo* as a pronoun; English adjective
  stacking (*daily weather mosaic* is *mosaico meteorológico diario*).
- English structure: the progressive for a state (*Estaba mirando* → *Miraba*), explicit subject pronouns (*Él
  miraba*), possessives on obviously-yours things in procedures (*Revisa tu conexión* → *Revisa la conexión*). Keep
  *tu* where it carries the uncanny: *tu cielo*, *tu horizonte*.

**Before and after**

| English | Literal (wrong) | Watched Spanish | Why |
|---|---|---|---|
| It was looking straight down. | *Él estaba mirando directamente hacia abajo.* | *Miraba directamente hacia abajo.* | Pro-drop (no pronoun, so no gender for the satellite); imperfect, not the progressive calque. |
| It was dark here. Weather imagers keep scanning at night in infrared, so it saw your clouds, not your streets. | *Estaba oscuro aquí. Los generadores de imágenes meteorológicas siguen escaneando por la noche en infrarrojo, así que vio tus nubes, no tus calles.* | *Aquí era de noche. Los sensores meteorológicos siguen escaneando en infrarrojo: vio tus nubes, no tus calles.* | *era de noche* is how Spanish says it; the colon lands the last clause; "at night" is already said. |
| Your position isn’t available right now. Search for a place instead. | *Tu posición no está disponible en este momento. Busca un lugar en su lugar.* | *Tu ubicación no está disponible ahora mismo. Busca un lugar.* | *un lugar en su lugar* is a tongue-twister; offering the alternative already says "instead". |
| Can it see me? No. At best a pixel here is 10 m across. A car is one pixel. You’re not in it. | *¿Me puede ver? No. En el mejor de los casos un pixel aquí es de 10 m de ancho. Un coche es un pixel. Tú no estás en él.* | *¿Puede verme un satélite? No. En el mejor de los casos, aquí un píxel mide 10 m de lado. Un auto ocupa un píxel. A ti no se te ve.* | *¿Me puede ver?* reads as usted; *píxel* takes an accent; *coche* is Spain, *carro* Mexico, *auto* is read everywhere; *no se te ve* is the quietly uncanny ending. |
| What watched Waterloo this week | *Qué observó Waterloo esta semana* | *Qué satélites observaron Waterloo esta semana* | Spanish puts subjects after the verb, so the literal reads "what did Waterloo watch". |
| See what passed over this place | *Mostrar qué pasó sobre este lugar* | *Ver los satélites que pasaron sobre este lugar* | *qué pasó* means "what happened". |
| Waterloo was inside its 24 km swath. | *Waterloo estuvo dentro de su franja de 24 km.* | *Su franja de 24 km cubría Waterloo.* | A place as subject breaks with plural names (*Cataratas del Niágara estuvo…*). |
| No picture of it is published. | *Ninguna imagen de él es publicada.* | *No hay ninguna imagen publicada.* | No passive calque, no gendered pronoun for the place. |
| (a "punchier" rewrite someone might try) | *¡Descubre qué satélites te han estado espiando esta semana!* | *Algo te observó a ti esta semana.* | No exclamation, no *descubre*, no spying. The fact is the hook. |

---

## 3. The key lines

Slots: `[NUM]` a count or measure (set in mono by the code), `[PLACE]` the place label, `[SAT]` a satellite name,
`[TIME]` a clock time, `[DATE]` a date. `**bold**` is the `strong` part, `*italic*` the serif `accent` part.

### 3.1 The hero

```
Algo
te observó *a ti*
esta semana.
```

Accent: *a ti* (Instrument Serif italic, signal orange). Rich parts: `[['Algo'], ['te observó ', accent('a ti')],
['esta semana.']]`.

Why it wins:
- Spanish cannot stress *te*: it is an unstressed clitic, and a two-letter orange *te* reads as a typo. The only way to
  put weight on "you" is the doubled strong pronoun *a ti*, which every Spanish speaker uses exactly for this (*te
  observó a ti* = it was you it watched). It is the human moment in words as well as in type.
- It keeps the English order and the unknown subject alone on line 1, so *Algo* has the weight *Something* has.
- The breaks fall between constituents: [*Algo*] [*te observó a ti*] [*esta semana*]. The clitic stays with its verb.
- No gender, no region: *a ti* is standard in every country; preterite *observó* is correct everywhere (*te ha
  observado* is a word longer and reads Peninsular in Latin America).

**It fits, measured.** At the share card's 88 px (satori, the card's own fonts): *te observó a ti* is 451 px in the
466 px column; English *watched you* is 406 px and German *Etwas hat dich*, already shipping, is 462 px. The landing
hero uses the same faces, so it fits wherever German does. The default card (`card.hero`) therefore uses the same three
lines as the landing. If the card's hero size or face ever changes, re-measure; the only allowed fallback is four lines,
`Algo` / `te observó` / `*a ti*` / `esta semana.`

Plain text (tab title, `og:description`, alt text, anything with no serif accent): **Algo te observó esta semana.** The
emphatic *a ti* is the spoken equivalent of the serif; without the typography it is not needed. Tab title and boot
title: *Watched · Algo te observó esta semana*. Share page title: *Algo te observó esta semana.*

Alternates considered:
1. `Esta semana,` / `algo te observó` / `*a ti*.` Ends on the human moment, but the comma in display type is fussy,
   the last line is a quarter of the others, and it loses the *Algo* opening.
2. `Algo` / `te observó` / `*esta semana*.` Balanced lines, but the brand's serif accent is the person, not the date.

### 3.2 The sub line

**Busca cualquier lugar de la Tierra. Mira todos los satélites que lo sobrevolaron en los últimos 7 días y las imágenes
reales que tomaron.**

(No-break space in `7 días`, as in the English.) 137 characters against 120 (+14 %). The share page description is the
same sentence. The default card's footer, which has one short mono line beside the domain, is *Busca cualquier lugar*.

Why it wins: *Busca* matches the search field the reader is about to use (and covers a marked point or *Usar mi
ubicación*, unlike *Escribe*). *sobrevolar* is the exact, universal verb for "pass over", and *lo* refers to a noun in
the string (*lugar*). *reales* is "actual" (never *actuales*, which means "current"). *todos los satélites* keeps the
English "every". No comma before *y* in a two-part coordination.

Alternates rejected: *Escribe cualquier lugar… Verás todos los satélites…* (*Escribe* ties it to typing; the future
*Verás* is a promise, which is marketing tone). *Elige un lugar de la Tierra y mira qué satélites pasaron por encima…*
(one long sentence, drops "every", and *qué … pasaron* drifts towards "what happened").

### 3.3 Results headline and second line

**Line 1** (`strong` around the count phrase; `[NUM]` in the mono display face; `[PLACE]` in the serif).

| Case | Spanish frame |
|---|---|
| `one` (n = 1) | `En los últimos 7 días, **[NUM] satélite observó** *[PLACE]*.` |
| `other` (2–999 999 and decimals; 0 goes to the zero sentence) | `En los últimos 7 días, **[NUM] satélites observaron** *[PLACE]*.` |
| `many` (1 000 000, 2 000 000…) | Same text as `other`. With digits Spanish never adds *de*. |
| zero (own sentence) | `Ninguno de los satélites que seguimos observó *[PLACE]* esta semana.` (old window: `esa semana`) |
| other window length | `En los últimos [NUM] días,` (`one`: `En el último día,`) |
| past window | `Del [DATE] al [DATE], **[NUM] satélites observaron** *[PLACE]*.` with `[DATE]` = `29 de octubre` |

Examples: *En los últimos 7 días, **256 satélites observaron** Waterloo.* · *En los últimos 7 días, **1 satélite
observó** Waterloo.*

**Line 2** (`[NUM]` in the mono display face; no bold. *al menos* sits immediately before `[NUM]`, inside the sentence,
so the verb never moves when it goes.) Every image counts here, photos, weather mosaics and radar alike: always
*imágenes*.

| Case | Spanish |
|---|---|
| `other` | `Se publicaron [NUM] imágenes.` |
| `other`, partial | `Se publicaron al menos [NUM] imágenes.` |
| `one` | `Se publicó [NUM] imagen.` |
| `one`, partial | `Se publicó al menos [NUM] imagen.` |
| `many` | Same as `other`. |
| zero, results | `No se publicó ninguna imagen esta semana.` (old window: `esa semana`) |
| zero, card and post | `No se publicó ninguna imagen.` (line 1 already says *esta semana*) |
| archives down | `Los archivos de imágenes no respondieron, así que por ahora no podemos contar las imágenes públicas.` |
| archives down, short (card) | `Los archivos de imágenes no respondieron.` |

Why these win: *Se publicaron 31 imágenes* is how Spanish reports a release: verb first, number after. *31 imágenes se
hicieron públicas* keeps the English order but is heavier and reads translated; *Fueron publicadas 31 imágenes* is the
passive calque. For line 1, *Waterloo fue observado por 256 satélites* (rejected) needs a participle that agrees with
the place, and *256 satélites han observado Waterloo* (rejected) reads Peninsular.

Summary card: lead `[NUM] satélites observaron`, serif `*[PLACE] esta semana.*`; post text *31 satélites observaron
Waterloo esta semana. Se publicaron 12 imágenes.* The zero lead (*Ninguno de los satélites que seguimos observó*, 45
characters against 29) makes the card step its headline down a size; that is accepted, the zero case is rare.

Share page of a place link: title *Qué satélites observaron [PLACE] esta semana* (no full stop, it is a heading);
description *Todos los satélites que pasaron sobre [PLACE] en los últimos 7 días y las imágenes reales que tomaron. ¿Qué
te observó esta semana?*

### 3.4 Pass sentences, share headlines and share posts

`imaged`, Sentinel-2:

> **Sentinel-2C pasó justo encima a 786 km de altura a las 16:14:21 UTC, rumbo al sur a 7,46 km/s. Miraba directamente
> hacia abajo. Nubosidad en toda la escena: 25%.**

- Not overhead: *Sentinel-2C pasó a 786 km de altura y 61 km al oeste a las 16:14:21 UTC, rumbo al sur a 7,46 km/s.*
- Off-nadir: *Miraba a 5,3° de la vertical.*
- 01:xx: *…a la 01:12:09 UTC…* (see §5).
- Rejected: *Sentinel-2C cruzó en la vertical a 786 km…* (*en la vertical* is Spain's aviation jargon; *cruzar* wants an
  object). *moviéndose hacia el sur*: gerund calque; *rumbo al sur* needs no verb.

Other verdicts:

- `likely`: *Landsat 9 pasó justo encima a 705 km de altura a las 10:41:03 CET, dentro de su franja de 185 km. Era de
  día, así que casi con seguridad registró este lugar. Aún no se ha publicado ninguna escena de esta pasada; los
  archivos pueden tardar un día o más.*
- `could`, steerable camera: *WorldView Legion 4 tuvo este lugar a su alcance a las 10:52, hora local, a 61 km al oeste.
  Con la cámara a 25,3° de la vertical, pudo haber observado Waterloo. No podemos saber si lo hizo.* (*pudo haber
  observado*, never *pudo observar*, which reads "managed to".)
- `could`, fixed-swath commercial imager: *Su franja de 24 km cubría Waterloo. Su operador no publica dónde tomó
  imágenes, así que no podemos saber si lo hizo.*
- `overhead`: *ISS pasó a 420 km de altura a las 21:14, a 47° sobre tu horizonte, hacia el noroeste. Donde estás era de
  noche. Si la estación seguía iluminada por el sol, cruzó tu cielo como un punto brillante que no parpadea.*
- Geostationary: *Meteosat-12 no pasa. Se mantiene a 35 778 km sobre el ecuador, en 0.2°W, y cada 10 minutos escanea
  toda la cara de la Tierra que tiene debajo. La línea de este escaneo llegó a Waterloo hacia las 07:49 CET, rumbo al
  norte.* (`0.2°W` is a coordinate the code writes: leave it.) Infrared: *Aquí era de noche, así que esta imagen es
  infrarroja: los topes de las nubes, por temperatura; cuanto más fríos, más claros.*
- Radar line: *El radar no necesita luz. Umbra, Capella y otros 7 satélites de radar tuvieron este lugar a su alcance
  1204 veces.*
- Spot lines (the place's own pixel): *Leyendo el píxel del punto exacto…* · *Despejado justo aquí.* · *Cirros finos justo
  aquí; pueden suavizar la imagen.* · *Nubes justo aquí.* · *Este punto estaba a la sombra de una nube.*

**Share headline** (card blocks: a text part in the condensed face, the accent part with the place). With the week's
N, the card's normal lead: **7 satélites observaron *Waterloo*.** Per verdict, for old shares without N:

| Verdict | Frame (the text after `[PLACE]` is the card's tail) | Nameless satellite |
|---|---|---|
| imaged | `[SAT] observó *[PLACE]*.` | `Un satélite observó *[PLACE]*.` |
| likely | `[SAT] cubrió *[PLACE]* con su franja.` | `Un satélite cubrió…` |
| could | `[SAT] tuvo *[PLACE]* a su alcance.` | `Un satélite tuvo…` |
| overhead | `[SAT] sobrevoló *[PLACE]*.` | `Un satélite sobrevoló…` |

Rejected: *Waterloo, observado por Sentinel-2C* (participle agrees with the place); *Sentinel-2C te observó en Waterloo*
(assumes the reader was there; the card goes to other people).

Share hooks: *Algo te observó a ti también esta semana.* (*también* attaches to *a ti*) · *¿Qué te sobrevoló esta
semana?* · the descriptions' closing question *¿Qué te observó esta semana?*

**Share post** (prose: long dates, *hora local*, *a la* for 01:xx):
- imaged: *Sentinel-2C observó Waterloo desde 795 km de altura el domingo 1 de noviembre a las 11:21, hora local. 10 m
  por píxel; esta es la imagen real.*
- clouded: *…a las 11:21, hora local. Solo vio nubes.*
- likely: *Landsat 9 pasó sobre Waterloo a 795 km de altura el domingo 1 de noviembre a las 11:21, hora local. La franja
  de su cámara cubrió el lugar.*
- credit: *vía @handle*.

**Share page descriptions** (prose, with the year):
- *Sentinel-2C pasó a 795 km de altura sobre Waterloo el domingo 1 de noviembre de 2026 a las 11:21 EST, rumbo al sur.*
  (overhead without altitude: *…pasó sobre Waterloo…*)
- *WorldView Legion 4 tuvo Waterloo a su alcance el domingo 1 de noviembre de 2026 a las 10:52 EST, rumbo al norte.
  Pudo haber apuntado aquí. Su operador no dice si lo hizo.*
- *Miraba directamente hacia abajo.* · *Miraba a 5,3° de la vertical.* · *Nubosidad: 25%.* · *Su franja cubrió
  Waterloo.*
- *La vista más cercana es de Sentinel-2B.* · *La última vista despejada es de Landsat 9.* · *La primera imagen es de
  NOAA-21.* (nameless: *…es de un satélite.*)
- Card alt: *La tarjeta para compartir, con la imagen más cercana de la semana, de Sentinel-2B.* · *La tarjeta para
  compartir.*

### 3.5 The four verdicts

| | `imaged` | `likely` | `could` | `overhead` |
|---|---|---|---|---|
| Title | **Observada** | **Probablemente observada** | **Pudo haber apuntado aquí** | **Pasó por encima** |
| Lane label (mono caps; also the week card's lanes, ≤ 8) | `IMAGEN` | `PROBABLE` | `POSIBLE` | `DE PASO` |
| Count unit | `pasada` / `pasadas` | same | same | same |
| Definition | Hay una imagen real de este lugar en un archivo público. | La franja de una cámara fija cubrió este lugar. No hay ninguna imagen publicada. | Una cámara orientable o privada tenía este lugar a su alcance. Su operador no dice si llegó a mirar. | Cruzó tu cielo. Estaciones espaciales y todo lo demás. |
| Prose verb | *observó / observaron* | *cubrió … con su franja* | *tuvo … a su alcance* | *sobrevoló / sobrevolaron* |
| About, one more line | Si la mostramos, es la imagen real. | La imagen aún no es pública o se descartó por las nubes. | No hay forma de saber si lo hizo. | (none) |

Notes and rejected alternates:
- The titles agree with *pasada*, the noun they head (*Observada · 12 pasadas*); they describe the pass, never the
  reader. When prose quotes a verdict it agrees the same way: *esa pasada cuenta como observada*, *se muestran como
  probablemente observadas*. About: *lo llamamos “pudo haber apuntado aquí”*.
- *Pudo haber apuntado aquí* (24 characters, the English is 23, so the tile wraps as it already does). *Pudo apuntar
  aquí* is rejected: with an action verb the preterite *pudo* + infinitive reads "it managed to point here", the
  opposite of this verdict.
- *Probablemente observada* is 23 characters. *Observada (probable)* was rejected: the bracket reads as a footnote.
- *Pasó por encima* beats a bare *Sobrevoló* as a title: a transitive verb with no object reads unfinished in a tile.
- Lane `IMAGEN`, not `FOTO`: radar images and weather mosaics sit in this lane, and a radar image is not a photo.
- Lane `DE PASO` ("just passing by"), not `ENCIMA`, which alone reads "on top". It does not clash with the ban on *paso*
  as the unit.
- Never *barrió* for `likely`: *barrer* a place also means to wipe it out, which beside Gaza or Bakhmut is unacceptable.
- Never *veredicto* for "verdict" in visible or spoken text (it is judicial); say *categoría* in aria labels: *Pasadas
  por categoría. Cada una lleva a su lista.*
- Never build "`[NUM]` `[title]`" from titles (*12 observada* ✗): write *Observada: 12* or *12 pasadas*.

### 3.6 Share card and share page: fixed lines

| Key | Spanish | Note |
|---|---|---|
| `invite` | *Mira qué te observó* | 19 against 20; measured narrower than the English. |
| `enterAnyPlace` | *Busca cualquier lugar* | Beside the domain; the full sub does not fit. |
| `stamp` | `dom 1 nov 2026 · 11:21 CET` | 26, as the English. |
| `weekTo` | `7 días al dom 1 nov 2026` | *al* + date = "up to, as of". |
| `lastWeek` | *Últimos 7 días* | |
| `readout` | *Altitud*, *Elevación*, *Velocidad*, *Fuera de nadir*, *Píxel*, *Píxel mosaico*, *Más cerca* | 155 px columns at 13 px hold 16 characters. |
| `lane` | *Imagen*, *Probable*, *Posible*, *De paso* | ≤ 8. |
| `geometry` | *Geometría · norte arriba* | One line over the drawing, never cut: the English length (24). *Geometría de la pasada · norte arriba* (37) ran into the scale bar. |
| `note` | *La imagen se abre en la app* · *Imagen no disponible ahora* · *Archivo comercial, no público* · *En la franja, sin imagen pública aún* · *Traza terrestre en el punto más cercano* | |
| `acquiring` | *Captando…* | |
| `noPublicPhoto` / `noPhoto` | *Ninguna imagen pública esta semana* / *Sin imagen que mostrar* | *imagen*, never *foto*: the week can be radar only. |
| `look` | *Más cercana* · *Última sin nubes* · *Nublado* · *Radar* | The week card's lead chip ends before the picture's scale chip: *Vista más cercana · Sentinel-2C · 10 m* (38) ran into it; the gallery keeps *Vista más cercana*. |
| `cloud.only` | sub *Nublado. Solo vio nubes.* · chip *Nublado · 95%* · post *Solo vio nubes.* · desc *Solo vio nubes (95%).* | |
| `cloud.mostly` | sub *Casi todo nubes: el 81% de la escena.* · chip *Casi todo nubes · 81%* · post and desc *Vio casi solo nubes (81%).* | |
| `cloud.spot` | sub *Nubes sobre el punto exacto.* · chip *Nubes en el punto* · post and desc *Las nubes cubrían el punto exacto.* | |
| `aSatellite` | *Un satélite* | Only the chips and the plan plate print it. |
| `defaultAlt` | *Una foto real del satélite Sentinel-2 de Palm Jumeirah, Dubái, junto a la frase: Algo te observó esta semana. Busca cualquier lugar de la Tierra.* | *foto*: it names Sentinel-2. |
| `page.opening` | `Abriendo ` + accent `Watched` | |
| `question` | *¿Qué te observó esta semana?* | |

---

## 4. Glossary

Gender: m. masculine, f. feminine. "Label" means a mono caps label (written in sentence case in the catalog; CSS
uppercases it).

| English | Spanish | Notes |
|---|---|---|
| satellite | satélite | m.; pl. *satélites*. The English mono "12 sats" is *12 satélites* (*1 satélite*): no abbreviation. |
| pass (n.) | pasada | f.; pl. *pasadas*: `02 / PASADAS`, *Repetir esta pasada en el globo*, *Pasada 3 de 12 de este tipo*, `NORAD · PASADA`, *Compartir esta pasada*, *Esperando la pasada*. The remote-sensing and meteorology term (*pasada ascendente / descendente*). Never *pase* (= ticket, permit, football pass), never *paso* as the unit (= step). *el paso del satélite* is allowed uncounted in prose. |
| to pass over / overhead | pasar por encima / pasar justo encima / pasar sobre | *pasó justo encima a 786 km de altura*. After *qué*, *pasar* means "to happen": say *los satélites que pasaron* or *sobrevolar*. |
| overflight / to overfly | sobrevuelo / sobrevolar | m.; transitive with no preposition: *sobrevoló Waterloo*. |
| to watch (product verb) | observar | *observó / observaron*. Never vigilar (surveillance, police), espiar, fotografiar, ver, mirar. |
| Watched (verdict) | Observada | Agrees with *pasada*. |
| photo | foto | f. (*la foto*). Only in a sentence that names Sentinel-2, Landsat or daylight cameras (About: *Las fotos de Sentinel-2 y Landsat…*, *Una pasada de noche nunca cuenta como foto.*). |
| image, picture | imagen | f.; pl. *imágenes* (accent in the plural only). Every generic string: `barLabel` *Imágenes*, *Mostrar imágenes*, *Imagen anterior (←)*, *Imagen siguiente (→)*, *Imagen 3 de 12*, *Ampliar la imagen (F)*, *Compartir esta imagen*, *Todas las imágenes*, alt *Imagen de [PLACE] tomada por [SAT]. El lugar está en el centro.* |
| public image / no public image | imagen pública / sin imagen pública | Geostationary rows: *Sin imagen pública*, *Calidad baja*. |
| made public, published | se publicó / se publicaron; publicado | Never *se hicieron públicas*. |
| archive | archivo | m.; first mention *archivo de imágenes*. Not *repositorio*. |
| scene | escena | f. Never *escenario*, never *toma* (also a military capture). |
| swath | franja | f.; *franja de 290 km*; label `FRANJA`. Never *faja*, never *barrido*. |
| off-nadir | fuera de nadir | Label `FUERA DE NADIR` (labels drop articles); value in a row or tooltip *5,3° del nadir* ("5.3° from nadir", as *a 30° del cenit*); prose *a 5,3° de la vertical*. |
| straight down, nadir | directamente hacia abajo; la vertical; nadir (m.) | *nadir* only in labels. |
| ground track | traza terrestre | f.; short *traza*. |
| orbit | órbita | f. |
| altitude | altitud | f.; label `ALTITUD`; prose *a 786 km de altura*. |
| elevation (above horizon) | elevación | f.; *a 47° sobre tu horizonte*; label `ELEVACIÓN DESDE TI`. The English unit "up" after the degrees has no Spanish word: leave `unit.up` empty (the label says it) and write the compass alone in `upCompass` (`SSO`). |
| ground speed | velocidad sobre el suelo | Geometry label *Velocidad terrestre* (the aviation term, 19 characters: the phone column holds 19; never *Velocidad en tierra*, which is a speed while on the ground); card readout *Velocidad*; prose just *a 7,46 km/s*. |
| ground distance | distancia horizontal | Label. |
| heading | rumbo | m.; label `RUMBO`; prose *rumbo al sur*; unit `SSO · DESC`. |
| ascending / descending | ascendente / descendente | Readout `ASC` / `DESC`. |
| closest approach | máxima aproximación | Countdown `MÁXIMA APROXIMACIÓN · SENTINEL-2C`, `MÁXIMA APROXIMACIÓN`; geometry labels `MÁS CERCA · UTC`, `MÁS CERCA · LOCAL`; card readout *Más cerca*. |
| acquisition / acquiring | captura / captando | Countdown `CAPTURA · SENTINEL-2C`; placeholder *Captando…*; `CAPTURA 11:21:21 EST · 10 m`. |
| scan line here | línea de escaneo aquí | `LÍNEA DE ESCANEO AQUÍ · UTC`. |
| cloud cover | nubosidad | f.; label `NUBOSIDAD`; *Nubosidad en toda la escena: 25%*. |
| clouded over | nublado | Chip *Nublado · 81%*. |
| clear (sky) | despejado | Not *claro*. Not the input's "Clear", which is *Borrar*. |
| cloud at the spot (strip) | `NUBES AQUÍ` | Values: clear *Ninguna*, cirrus *Cirros*, cloud *Sí*, shadow *Sombra* (≤ 7). Gallery status: *Nubes aquí*, *Despejado*, *Cirros finos*, *Sombra de nube*; lightbox *Despejado aquí*; gallery chips *Nubes justo aquí*, *Nublado · nubes justo aquí*. |
| spot | aquí / justo aquí / el punto exacto / este lugar | Never *tu punto*. |
| thin cirrus | cirros finos | m. pl. |
| cloud shadow | sombra de nube | f. |
| cloud tops | topes de las nubes | m. pl. |
| pixel | píxel | m.; pl. *píxeles*; *10 m por píxel*; label `PÍXEL`. Never *pixel*, *pixeles*. |
| resolution | resolución | Never as the label for pixel size: the label is `PÍXEL` (honest labelling). |
| radar | radar | m.; pl. *radares*; *imagen de radar*, never *foto de radar*. |
| weather mosaic | mosaico meteorológico | m.; where space is tight drop *meteorológico*, never replace it with *tiempo* or *clima*. |
| daily mosaic | mosaico diario | m.; full *mosaico meteorológico diario*. Unit after "—": `MOSAICO`. |
| true colour | color real | m. *color verdadero* only beside *falso color*. |
| geostationary | geoestacionario, -a | Never *geostacionario*. |
| full disc | disco completo | m. |
| scan / to scan | escaneo / escanear | m. Not *barrer*. |
| infrared / visible / colour (band) | infrarrojo / visible / color | Strip value (≤ 9): `IR`, `VISIBLE`, `COLOR`; everywhere else *infrarrojo* in full. |
| band | banda | f.; noun first: *radar de banda C*, *banda X*, *banda L*. |
| multispectral / panchromatic | multiespectral / pancromático | Never *multispectral*. |
| cubesat | cubesat | m. |
| revisit / tasked | revisita / programado | *revisita rápida*; *se programa* for tasking. |
| dawn–dusk orbit | órbita crepuscular | f. |
| standby spare | de reserva | |
| stereo mapping / soil moisture | cartografía estereoscópica / humedad del suelo | |
| spotlight mode | modo spotlight | Mode names stay. |
| ISS (in blurbs) | la Estación Espacial Internacional | *tripulada sin interrupción desde noviembre de 2000*. The satellite slot stays *ISS*. |
| time-lapse | time-lapse | m., *el time-lapse*; keep the hyphen. Never *timelapse*, *cámara rápida*. |
| frame (time-lapse, geostationary) | imagen | f.; *Imagen 3 de 11*; slider *Imagen*, list *Imágenes*. Never *fotograma* (Spain) or *cuadro* (Latin America). |
| developing (frames) | revelando | As a photograph is developed: *Revelando imágenes*. |
| rendering (video) | generando | *Generando 07%*. |
| year by year | año a año | Share title *[PLACE], año a año*; file name word *lugar*. |
| clear look | vista despejada | f.; *una vista despejada al año*. |
| closest look | vista más cercana | f.; chip *Vista más cercana*. |
| last clear look | última vista despejada | f. in prose; chip and tag *Última sin nubes*. |
| replay | repetición; button *Repetir* | *Repetir esta pasada en el globo*. |
| play / pause | reproducir / pausar | |
| catalog | catálogo | m.; *catálogo de órbitas* (one term, also in notices and progress rows). |
| orbital elements (TLE) | elementos orbitales (TLE) | Keep *TLE*. |
| epoch | época | f.; `ÉPOCA TLE`. |
| sub-solar point | punto subsolar | m.; HUD `SOL 16.2°S 063.0°E` (coordinates as the code gives them). |
| sun / Sun | sol / Sol | Capital for the body in readouts (`SOL`, *elevación del Sol*); lowercase in *salió el sol*, *luz del sol*. |
| Earth | la Tierra | Capital T for the planet. |
| equator | ecuador | m., lowercase. |
| day / twilight / night (sun units) | día / crepúsculo / noche | *Era de día.* *Aquí era de noche.* Not *estaba oscuro*. |
| steerable / fixed camera | cámara orientable / cámara fija | f. |
| field of regard | alcance | m.; label `ALCANCE ±45°`. |
| in swath / in view | en la franja / a la vista | Labels `EN LA FRANJA`, `A LA VISTA`. |
| operator | operador | m.; *su operador*. |
| private / commercial | privado / comercial | *archivo comercial, no público*. |
| crewed / station | tripulado / estación espacial | f. *estación*. |
| weather / imaging / radar satellite | satélite meteorológico / de observación / de radar | m. Not *satélite de imágenes*. |
| military and spy satellites | satélites militares y espía | *espía* is invariable in apposition. |
| verdict | categoría | Aria only. Never *veredicto*. |
| place | lugar | m. |
| plan view | vista cenital | f. |
| pin (n.); drop a pin | marcador; marcar un punto | Chip *Marcar un punto*; spoken *Marcador colocado en [PLACE]…*; *Quitar el marcador*. Never *chincheta*, *tachuela*, *pin*. |
| globe | globo | m. |
| click / tap / press / hold | hacer clic / tocar / presionar / mantener presionado | Never *pulsar* (Spain), never *cliquear*. |
| share | compartir | *Compartir*, *Compartir imagen*, *Preparando imagen…*. |
| download / save | descargar / guardar | *Guardar PNG*, *Guardar video*. |
| link | enlace | m. Field label *Enlace*; *Creando enlace…*; *Enlace directo*. The one exception: the copy button is *Copiar URL* (§7: *Copiar enlace* does not fit three across a phone). Never *liga*, *vínculo*, *link*. |
| copied | copiado | The share sheet's `copied` replaces both copy buttons: bare *Copiado*. The time-lapse's own `linkCopied`: *Enlace copiado*. |
| post to X | enviar a X | Button *Enviar a X*. |
| card (share) | tarjeta | f. |
| post (social text) | texto | Label `TEXTO`. |
| video | video | m.; no accent (the form of the Americas, accepted by the RAE). |
| search a place | buscar un lugar | Placeholder *Buscar un lugar*; hint *Nombre, dirección o lat, lon*. |
| use my location / locate me / near me | usar mi ubicación / localízame / cerca de mí | Progress *Localizando…*; status *Pidiendo la ubicación*, *Poniendo nombre al lugar*. |
| location | ubicación | f. Error label `UBICACIÓN`. |
| surprise me | sorpréndeme | |
| open source (the link to the code) | código abierto | |
| how this works | cómo funciona | `CÓMO FUNCIONA`. |
| last 7 days | últimos 7 días | `ÚLTIMOS 7 DÍAS`. |
| this week / that week | esta semana / esa semana | |
| local time | hora local | *a las 10:52, hora local*. |
| UTC | UTC | Unchanged. |
| ago / in | hace … / dentro de … | Prefixes: *hace 12 min*, *dentro de 3 h*. |
| just now | ahora mismo | |
| fetched (catalog) | descargado | `DESCARGADO 2026-11-19 07:34Z`. |
| stale | desactualizado | `DESACTUALIZADO, HACE 3 D`. |
| fault (notice label) | error | `ERROR`. Never *fallo* (Spain; a court ruling in Latin America) or *falla* (Latin America; a geological fault in Spain). |
| try again / retrying | reintentar / reintentando… | Button *Reintentar*; prose *vuelve a intentarlo*. |
| cancel / close / back / dismiss | cancelar / cerrar / volver / descartar | |
| report | resultados | *Resultados listos*. Never *informe* or *reporte*. |
| computing | calculando | |
| line (pushbroom) | línea | `LÍNEA 0000 → 1024`. |
| coverage / window | cobertura / ventana | f. / f. |
| horizon / sky | horizonte / cielo | m. / m. |
| glacier | glaciar | m.; *fin de la temporada de deshielo*. |
| seasons | primavera, verano, otoño, invierno | Lowercase; *una cada otoño*, *una al año*. |
| live | en tiempo real | Never *en directo* or *en vivo*. |
| keys | Enter, Espacio, Esc | *Presiona Enter o la flecha…*. |
| zoom in / out / expand | acercar / alejar / ampliar | *Acercar (+)*, *Alejar (−)*, *Ampliar (F)*. |
| carousel / slide (aria) | carrusel / diapositiva | |
| sheet grip | expandir panel / contraer panel | |
| cookie | cookie | Pl. *cookies*. Its gender is split in use; build phrases that need no article where possible: *ninguna cookie propia*, *sin cookies*. Never *galleta*. |
| s, min, h, d, days | s, min, h, d, días | SI symbols, no period, no plural. *d* only in the HUD's compact age; elsewhere *días* spelled out. |
| km, m, km/s | km, m, km/s | Never *kms*, *mts*, *seg*, *hrs*. |
| N / S / E / W (compass) | N / S / E / O | Compass words and 16-point readouts only; coordinates keep W (§6). |
| compass, 8 points | norte, noreste, este, sureste, sur, suroeste, oeste, noroeste | Lowercase; *al norte*, *rumbo al sur*, *hacia el noroeste*. Not *nordeste/sudeste/sudoeste*. |
| compass, 16 points | N NNE NE ENE E ESE SE SSE S SSO SO OSO O ONO NO NNO | Readouts only, always beside a degree value (so *NO* never reads as "no"). |
| objects (catalog) | objetos | `16 917 OBJETOS`. |
| browser / settings | navegador / configuración | f. *configuración*, not *ajustes*. |

**Never translated:** the wordmark *Watched.* and *www.watched.earth*; satellite names (Sentinel-2C, Landsat 9,
WorldView Legion 4, NOAA-21, Meteosat-12, ISS…); sensor and product names (MSI, OLI, OLI-2, VIIRS, MODIS, ABI, AHI,
SEVIRI, C-SAR, GeoColor); agencies and programmes (ESA, NASA, NOAA, EUMETSAT, JMA, USGS, CIRA, Copernicus, Planetary
Computer, Element 84, CelesTrak, Photon, Nominatim, Open-Meteo); NORAD IDs; UTC, GMST, TLE, PNG, H.264, WebGL; time-zone
abbreviations; coordinates; the licence credits. *Copernicus* is the EU programme: never *Copérnico*. When a sentence
needs an article, agencies are feminine (*la NASA*, *la ESA*, *la NOAA*) and the USGS masculine (*el USGS*). In prose
refer to the product as *Watched*, no article.

---

## 5. Grammar strategies for runtime slots

The code inserts names and numbers; it cannot inflect, add articles or know gender. Every frame is a whole sentence the
translator owns, and it must be correct for any value of its slots.

### [PLACE]

It arrives as the gazetteer gives it: an English exonym (*Seville*, *Mexico City*, *Pacific Ocean*), a local name, a
local script (北京, Москва), a plural name (*Islas Canarias*, *Países Bajos*, *Cataratas del Niágara*) or coordinates.

- **Never a subject.** A verb agrees in number with its subject, and the name can be plural: *Cataratas del Niágara
  quedó…* is wrong and the code cannot know. Use `[PLACE]` as a direct object of an active verb (*observaron [PLACE]*,
  *sobrevoló [PLACE]*, *Su franja cubría [PLACE]*), after a preposition (*sobre*, *de*, *en*, *hacia*), or as a label.
- **Never after the verb of a *qué / que / quién / lo que* subject.** Spanish puts subjects after the verb, so *Qué
  observó Waterloo* reads "what did Waterloo watch", and *el satélite que observó Waterloo* reads "the satellite that
  Waterloo watched". Make the subject explicit and plural (*Qué satélites observaron [PLACE]*, *los satélites que
  observaron [PLACE]*), or put the place after *sobre* (*el satélite que pasó sobre [PLACE]*). A named subject before
  the verb is safe: *Sentinel-2C observó [PLACE].*
- **No article, ever.** The label may be English, and we cannot know its gender. *observaron Pacific Ocean* is
  accepted; *observaron el Pacific Ocean* is not.
- **No personal *a*:** *observaron Waterloo*, never *observaron a Waterloo*. (*llegó a Waterloo* is fine: that *a* is
  the destination.)
- **No contraction before the slot:** write *de [PLACE]*, *a [PLACE]*. With *El Cairo* this gives *de El Cairo*, which
  the RAE accepts when the article is part of the name. Never *del* or *al* before a slot.
- **No agreement:** never an adjective or participle about the place (*[PLACE] fue observado*, *[PLACE] está nublada*).
- **Never refer back with *lo* or *la*.** Use *este lugar*, *aquí*, *el lugar*, or repeat the name. (*lo hizo* refers to
  the action, which is fine.)
- **Text may follow the slot.** *[SAT] tuvo [PLACE] a su alcance.* The card prints everything after `[PLACE]` as its tail.
- Coordinates in the place slot arrive written by code (`43.4723°N 80.5449°W`): leave them as they are.
- Never put `[PLACE]` in quotation marks, and never "correct" its spelling (*Seville*, *Kyiv* stay as delivered).

### [SAT] as subject

- **Bare, no article:** *Sentinel-2C pasó…*, *ISS pasó…*. Never *el Sentinel-2C*, *la ISS* in a frame: the code cannot
  know that a station is feminine and a satellite masculine.
- **Nothing that agrees with it:** *Meteosat-12 está fijo / situado* ✗ → *Meteosat-12 se mantiene…* ✓.
- **After the first mention, pro-drop:** *Miraba…*, *Su franja…*, *Su operador…* (*su* has no gender). Never *él*,
  *ella*, *este*, *esta*.
- **Nameless satellite:** the sentence says *un satélite* itself, in the form it needs: subject *Un satélite observó…*,
  after a preposition *de un satélite*. Only the chips and the plan plate print `aSatellite` (*Un satélite*).
- When a frame names a fixed noun, agree with that noun: *Si la estación seguía iluminada…* (the noun is in the string).
- A list of satellites as subject takes a plural verb: *Umbra, Capella y otros 7 satélites de radar tuvieron…*.

### [NUM] and plural categories

Spanish CLDR categories (`Intl.PluralRules('es')`): **one** (exactly 1), **many** (1 000 000, 2 000 000…), **other**
(0, 2–999 999, every decimal). Checked: `0:other 1:one 2:other 1.5:other 1000:other 1000000:many 21:other`.

- Every count string has all three keys. **many is a copy of other** (with digits Spanish never says *de*).
- **Zero is its own sentence**, never `0 satélites observaron` (§3.3). A bare `0` in a readout tile takes the `other`
  unit: *0 pasadas*.
- The verb agrees with the count, so the whole sentence changes: *1 satélite observó* / *256 satélites observaron*;
  *Se publicó 1 imagen* / *Se publicaron 31 imágenes*; *1 vez* / *42 veces*. Impersonal *haber* never pluralises:
  *hubo 3 pasadas*, never *hubieron*.
- Articles and adjectives agree with the noun: *Mostrar los [NUM] satélites* / *Mostrar las [NUM] filas*; *1 pasada
  observada* / *12 pasadas observadas*; *Mostrar [NUM] más*.
- *otros* goes before the number: *y otros 7 satélites de radar*. For one, drop the digit: *y otro satélite de radar*.
- Percent in prose takes the article: *el 81% de la escena*.
- Counters: *Imagen 3 de 12*, *Pasada 3 de 12 de este tipo*; zero-padded progress *03 de 11*.
- Never spell numbers in words, except *una vez* where the English says "once" and *una al año*.
- Format every number with `fmt('es')` (`int`, `dec`): never type a runtime number's separator by hand.

| one | other |
|---|---|
| satélite | satélites |
| pasada | pasadas |
| imagen | imágenes |
| escena | escenas |
| órbita | órbitas |
| vez | veces |
| vista despejada | vistas despejadas |
| mosaico | mosaicos |
| objeto | objetos |
| fila | filas |
| minuto · hora · día · año | minutos · horas · días · años |

### Lists of names

Join with `fmt('es').list` (`Intl.ListFormat`): *A, B y C*, no comma before *y*. It turns *y* into *e* before an /i/
sound and leaves *hie-* alone, and *o* into *u* before /o/: checked *Capella e Iridium*, *Umbra, Capella y Hierro*.
Never build lists by hand. The "and N others" tail is part of the frame: *[A], [B] y otros [NUM] satélites de radar*.

### Dates and times inside sentences

- Day in prose: *el* + long weekday + day + *de* + long month, all lowercase, built from `formatToParts` (Intl's own
  long form puts a comma after the weekday): *el domingo 1 de noviembre*; with the year (share page) *el domingo 1 de
  noviembre de 2026*. Mono short forms (*dom 1 nov*) only in readouts, rows and chips.
- Clock time: *a las [TIME]*, but **a la** when the clock text starts with `01:` (*a la 01:05*):
  `/^01:/.test(clock) ? 'a la' : 'a las'`. The same for *hacia la / hacia las* (*hacia las 07:49 CET*). Midnight is
  *a las 00:15*. Every message that says *a las* must receive the clock as a string (extraction).
- Local time: *a las 10:52, hora local*. Never *10:52 local*.
- Window: *Del 29 de octubre al 5 de noviembre* (*del/al* are fine here: *el* belongs to the date, not to a name).
- Relative: *hace 12 min*, *hace 2 días*, *dentro de 3 h*, *ahora mismo*. The number follows *hace*; frames must allow a
  prefix.

---

## 6. Typography and formatting

**Punctuation**
- Quotation marks: “ ” first, ‘ ’ inside. Never straight quotes, never « ». *lo llamamos “pudo haber apuntado aquí”*.
- Apostrophe ’ (U+2019) only inside foreign names.
- ¿ and ¡ always open their sentence or clause: *¿Es en tiempo real?* (We never use ¡…!: no exclamations.)
- Ellipsis: one character … (U+2026), no space before: *Cargando…*, *Captando…*.
- No raya (—) in product copy (the owner's rule: no em dashes). Use a comma, colon or parentheses. En dash (–) only in
  ranges: *10–30 m*, *2015–2026*. Minus sign (−, U+2212) for negatives: *T−00:42*, *UTC−9*. Hyphen in names and
  compounds: *Sentinel-2*, *time-lapse*.
- No space before any punctuation mark.
- After a colon, lowercase unless a name follows: *Meteosat-12 no pasa: se mantiene…*.

**Numbers: one format for every reader.** The system has one Spanish locale (`LOCALE_INFO.es.intl` is `es`), a share
link carries only `l=es`, and the card the sharer previews must equal the one the server draws, so there is no regional
format. And plain `es` is not safe as Intl writes it: it groups five digits with a point (`35.778 km`, `16.917`), which
Mexico, Central America, the Caribbean and US Hispanics read as a decimal (35 778 km would read "about 36 km"). So:

- **Decimal comma**, as `fmt('es').dec` prints it: `7,46 km/s`, `5,3°`, `1,1 km`, `0,31 m`. A comma followed by one or
  two digits cannot be a thousands group, so readers who use the point still read it as a decimal.
- **Four-digit integers not grouped** (CLDR `es` and the RAE agree): `1715 imágenes`, `3040 km`, `1204 veces`.
- **Five digits or more grouped with a no-break space U+00A0**: `35 778 km`, `16 917 objetos`, `12 345`. This is the RAE
  and ASALE recommendation (*Ortografía* 2010), made because the point and the comma split the Spanish-speaking world;
  with spaces a comma can only be a decimal. The RAE also accepts the decimal point and leans to it; we keep the comma
  because `fmt('es')` already prints it and about half of Spanish readers write it.
- **Code** (a few lines, Intl only, no detection, no extra render): in `fmt()` for `es`, map every `group` part of
  `formatToParts` to U+00A0, in `int` and `dec`. Never U+202F (not in the shipped font subsets: it would fall back to
  another font inside mono readouts).
- **Numbers typed by hand** in fixed text (satellite blurbs, About) follow the same format: `2900 km a 1,1 km`, `2330 km`,
  `1270 km`, `1,5 m`, `10–30 m`. Years are never grouped (`2015`).

| Value | Spanish |
|---|---|
| 7.456 (2 decimals) | 7,46 |
| 1715 | 1715 |
| 16917 | 16 917 |
| 35778 | 35 778 |
| 1000000 | 1 000 000 |
| 25 % | 25% |

**Percent.** `25%`, no space, everywhere: readouts, chips and prose (*el 81% de la escena*, *Nubosidad en toda la escena:
25%.*, *Nublado · 81%*, *Generando 42%*). The renderer attaches `%` to its number in every language (`tightUnit`), so a
hand-typed `25 %` would mix two forms on one screen. Never use Intl's percent style (it gives `25 %`).

**Units and symbols.** In strings you type, a no-break space (U+00A0) between a number and its unit or noun: *786 km*,
*10 m por píxel*, *7 días*. Units handed to the renderer as a `num(n, u)` part are spaced by the code. Symbols are
lowercase, never pluralised, never followed by a period.

**Degrees.** `°` (U+00B0), attached: *5,3°*, *47°*. Never `º` (U+00BA, the ordinal indicator on the Spanish keyboard's
key next to 1) or `˚`: in Martian Mono `º` is a raised, underlined o, visibly wrong beside the code's own `°`. Search
every file for `º` before review.

**Coordinates are not copy.** Code writes them in international notation in every language: point decimals and N S E
W (`43.47°N 80.54°W`, `SOL 16.2°S 063.0°E`, *en 0.2°W*), as Google Maps shows them in Spanish. The search field parses
only that notation, so example coordinates inside copy are copied character for character from the English: *La
búsqueda de lugares no responde. Las coordenadas como 43.47, −80.54 siguen funcionando.* *O* for *oeste* is only for
compass words (*al oeste*) and the 16-point readouts (`SSO`, `ONO`). The mix on one screen (`7,46 km/s` beside
`80.54°W`) is accepted: coordinates are a notation, like a clock.

**Dates.** Every Spanish date comes from Intl (`formatDate('es', ms, timeZone, …)` or `dateFormat(…).formatToParts`,
`api/_lib/i18n/dates.ts`), never from a hand-made month table, so the timeline, the card, the post and the time-lapse
agree. Intl's short month for September is *sept*: accept it.
- Mono short form: the weekday, day and month parts joined by spaces, no comma: *dom 1 nov*, *sáb 6 sept* (shown
  `DOM 1 NOV`). With the year: *dom 1 nov 2026*; day and month only: *29 oct*; with year, no weekday: *22 oct 2015*.
- Timeline compact day (~5 characters): short weekday + day, *dom 1*, *mié 4*. Never the narrow letters (*X* for
  miércoles is Spain only).
- Prose: from the long parts, *el domingo 1 de noviembre* (§5).
- Ranges: `formatRange` with `{ day, month: 'short' }`, then its dash (`–` or ` – `) replaced by ` → `: *29 oct → 5 nov*,
  *1 → 8 nov*; the kicker *12 → 19 nov 2026 UTC*.
- Screen readers: the long form, *viernes 6 de noviembre*.
- Machine stamps stay ISO: *2026-11-19 07:34Z*.

**Time.** 24-hour, *16:14:21*, no *h* after it, never a. m. / p. m. The zone abbreviation the code supplies follows the
time (*CET*, *EST*, *UTC−9*); a place at sea: *UTC−9 · en el mar*.

**Relative time.** From `relativeParts` and `relativeFormat('es')`: `short` for minutes and hours (*hace 12 min*, *hace
5 h*, *dentro de 3 h*), `long` for days (*hace 2 días*; `short` would give *hace 2 d*), *ahora mismo* under 45 s. Screen
readers get `long` for all (*hace 12 minutos*, *hace 41 horas*). The HUD's compact catalog age: *hace <1 min*, *hace 42
min*, *hace 5 h*, *hace 3 d*; stale: *Desactualizado, hace 3 d*. Durations: *38 s*, *4 min 12 s*, *1 h 02 min*.

**Capitalisation.** Sentence case everywhere: *Cómo encontramos las pasadas*, *Qué significan las etiquetas*, never Title
Case. Lowercase: weekdays, months, seasons, compass points, nationalities, languages, *ecuador*. Capitals: *la Tierra*,
*el Sol* and *la Luna* as celestial bodies, agency acronyms. Inside a geographic name, the generic noun is lowercase
(*Salinas del mar Muerto*, *Presa Hoover y lago Mead*, *el monte Everest*, *el canal de Panamá*); only the first letter
of a label or sublabel is capitalised, as any label starts (*Monte Everest*, *Estrecho de Gibraltar*).

**Mono caps labels.** Write them in sentence case in the catalog (*Últimos 7 días*); CSS uppercases them following
`lang="es"`. Accents stay on capitals, as the RAE requires: `ÚLTIMOS 7 DÍAS`, `CÓMO FUNCIONA`, `PÍXEL`, `LÍNEA`, `ÉPOCA
TLE`, `SÁB 31 OCT`, `MIÉ`. Where there is no CSS (canvas, satori), the renderer uses `toLocaleUpperCase('es')`. The
units stay lowercase everywhere, caps rows included (`ALTITUD 786 km`: DESIGN §3, owner 2026-11-19).
Never uppercase: the serif place name, satellite names in prose, the wordmark.

**Line breaking.** No-break space between a number and its unit or noun (*7 días*, *256 satélites*). In display
headlines also after one-letter words (*a*, *y*, *o*, *e*, *u*) so no line ends on one. Never split a clitic from its
verb (*te observó*). No automatic hyphenation (`hyphens: manual`).

**Abbreviations.** Only this fixed set, without periods: weekdays and months as Intl gives them, units (s, min, h, d,
km, m, km/s), `ASC` / `DESC`, compass letters, TLE, UTC, GMST, *lat, lon*, `IR` (the strip's band value only), *Meteo*
(the gallery filter segment only), *URL* (the copy button only). Spell out everything else: never *aprox.*, *máx.*,
*vel.*, *dist.*, *sat.*, *sats*.

**Spelling (Ortografía 2010).** *solo* and *este / ese* never take an accent; *guion* has none; no accent on *o* between
digits (*2 o 3*); *vía* takes one; *Hawái*, *Dubái*, *Sídney*, *Shanghái*.

---

## 7. Length discipline

Spanish runs 10–20 % longer than English in sentences and 30–80 % longer in one- and two-word labels (typical factor
1.2). Measured on this product: hero 32 → 33 characters, sub 120 → 137 (+14 %), headline 52 → 57 (+10 %), pass sentence
144 → 162 (+13 %), *Share* 5 → 9 (+80 %), zero-case lead 29 → 45 (+55 %).

**How to measure.** Martian Mono (at the site's 87.5 % width) is monospaced: with the +0.08em label tracking every
character is 0.73 em, so **7.7 px at 10.5 px, 8.0 px at 11 px (phone labels), 9.5 px at 13 px (card rows)**. Count
characters and multiply. Display lines are measured in the renderer (§3.1).

**Budgets** (from the English catalogs' comments and the CSS; phones are 360 px unless stated)

| Where | Budget | Spanish |
|---|---|---|
| Hero line, 88 px card / landing | ≤ 462 px (German's line) | *te observó a ti* 451 px |
| Pass view strip label (4 cells, 62–73 px of text each) | ≤ 8 characters a line, wraps at spaces; no single word over 9 (English *Elevation*) | `FUERA DE / NADIR`, `NUBES / AQUÍ`, `ELEVACIÓN` |
| Strip values (21 px, 18 px on phones) | band ≤ 9, spot ≤ 7 | `IR` `VISIBLE` `COLOR`; `NINGUNA` `CIRROS` `SÍ` `SOMBRA` |
| Share sheet secondaries (3 across, 6 px padding) | ≤ 11 characters | *Copiar URL* 10, *Enviar a X* 10, *Guardar PNG* 11, *Reintentar* 10, *Copiado* 7 |
| Share link and post labels (48 px column) | ≤ 6 | *Enlace* 6, *Texto* 5 |
| Gallery filter segments (263 px bar on short landscape phones) | ≤ 8 each | *Todo · Detalle · Meteo · Radar* |
| Gallery counter on the last clear look | reserves 12 ch | *12 esta semana* is 14: the counter's `min-width` is 14 ch for `es` (one CSS rule, `:lang(es)`), and the filter is 2 characters shorter than the English, so the bar still fits. |
| Gallery status beside the product line | ≤ 14 | *Nubes aquí* 10, *Sombra de nube* 14 |
| Chips and tags over a picture | ≤ 20 | *Vista más cercana* 17, *Última sin nubes* 16 |
| Computing readout rows | ≤ 40 | see below |
| HUD corners (one nowrap line, half the screen) | the English length ± 2 | *Cómo funciona* 13, `SOL 16.2°S 063.0°E` |
| Pin move hint (one line on a 320 px phone) | ≤ 35 | *Mantén presionado para moverlo* 30 |
| Card readout labels (155 px at 13 px) / week lanes (116 px) | ≤ 16 / ≤ 8 | *Fuera de nadir* 14, *Píxel mosaico* 13; *Probable* 8 |
| Card stamp, footer | the English length | `dom 1 nov 2026 · 11:21 CET` 26, *Mira qué te observó* 19 |
| Time-lapse video button (132 px) | ≤ 14 | *Video*, *Generando 42%*, *Error de video*, *Guardar video* |
| Time-lapse waiting lines (~280 px) | ≤ 34 | *Consultando el archivo*, *Eligiendo vistas despejadas*, *Revelando imágenes*; progress *Vistas despejadas: 03 de 11*, *Revelando imágenes: 03 de 11* |
| Other buttons and chips | English + 4, or × 1.3, whichever is larger; chip rows that scroll on phones may run longer | *Marcar un punto* 15 (scrolling row) |

Computing readout rows: *Cargando catálogo de órbitas* · *Catálogo · 16 917 objetos* · *Propagando 412 órbitas · 7
días* · *Propagando órbitas · 120 / 412* · *Buscando en Sentinel-2 + Landsat* · *Emparejando 12 escenas con 31 pasadas* ·
*Revisando mosaicos de la NASA* · *Revisando mosaicos de la NASA · 12 / 31* (39) · *31 pasadas · 12 imágenes*.

**Strategies**
1. Infinitive with no article: *Guardar PNG*, not *Guardar el PNG*.
2. Short common words: *ver* not *visualizar*, *usar* not *utilizar*, *buscar* not *realizar una búsqueda*.
3. Nouns for labels: `ALTITUD`, not `ALTITUD ORBITAL`.
4. Symbols over words: →, ·, ±, units.
5. Drop an adjective the context already gives (*mosaicos de la NASA*, not *mosaicos meteorológicos de la NASA*, in a
   progress row); never replace *meteorológico* with *tiempo* or *clima*.
6. Never shrink the type or the tracking to make a string fit: rewrite it.
7. Never abbreviate outside the §6 list.

| English | Spanish | Characters | Note |
|---|---|---|---|
| SURPRISE ME | SORPRÉNDEME | 11 → 11 | |
| USE MY LOCATION | USAR MI UBICACIÓN | 15 → 17 | Wide screens. |
| LOCATE ME | LOCALÍZAME | 9 → 10 | Phones, beside the field. |
| NEAR ME · LOCATING… | CERCA DE MÍ · LOCALIZANDO… | 7 → 11 · 9 → 12 | Narrowest phones, scrolling chip row. |
| HOW THIS WORKS | CÓMO FUNCIONA | 14 → 13 | |
| LAST 7 DAYS | ÚLTIMOS 7 DÍAS | 11 → 14 | |
| CLOSEST LOOK | VISTA MÁS CERCANA | 12 → 17 | |
| LAST CLEAR LOOK | ÚLTIMA SIN NUBES | 15 → 16 | Prose keeps *última vista despejada*. |
| TIME-LAPSE | TIME-LAPSE | 10 → 10 | |
| OFF-NADIR | FUERA DE NADIR | 9 → 14 | Two lines in the strip, like English *Cloud at spot*. |
| PIXEL · ALTITUDE · PASSES | PÍXEL · ALTITUD · PASADAS | 5 → 5 · 8 → 7 · 6 → 7 | |
| SHARE | COMPARTIR | 5 → 9 | Within English + 4. |
| COPY LINK | COPIAR URL | 9 → 10 | *Copiar enlace* (13) overflows three across a 360 px phone. |
| POST TO X | ENVIAR A X | 9 → 10 | *Publicar en X* (13) overflows likewise. |
| SAVE PNG · COPY IMAGE | GUARDAR PNG · COPIAR IMAGEN | 8 → 11 · 10 → 13 | *Copiar imagen* is desktop only. |
| TRY AGAIN | REINTENTAR | 9 → 10 | |
| OR TRY · PLACE | O PRUEBA · LUGAR | 6 → 8 · 5 → 5 | |
| DROP A PIN | MARCAR UN PUNTO | 10 → 15 | Scrolling chip row. |
| OR CLICK THE GLOBE TO DROP A PIN | O MARCA UN PUNTO EN EL GLOBO | 32 → 28 | Mouse only, ellipsised: the shorter form keeps the purpose. |
| ALL · DETAILED · WEATHER · RADAR | TODO · DETALLE · METEO · RADAR | 23 → 21 | Tooltips carry the full words (§9). |
| FETCHED … | DESCARGADO … | 7 → 10 | |
| FAULT | ERROR | 5 → 5 | |

---

## 8. Sensitive content

The product is about being watched. Spanish has two loaded families of words for that: *vigilar / vigilancia* (state and
police surveillance) and *espiar* (intent). We use the neutral science word, *observar*, which is also the field's own
name (*observación de la Tierra*), and we describe our own data practices with *contar* and *guardar*, never *rastrear*
(which to a reader means tracking them). *Satélites espía* appears only where the English says "spy".

**Privacy copy** (`about.privacy` says: translate exactly, promise nothing more or less). *ninguna cookie propia*, never
*galleta*; "nothing that ties one visit to the next" is *nada que relacione una visita con la siguiente*; "a rough 10 km
area" is *una zona aproximada de 10 km*; "we store only a ~10 km cell" is *Solo guardamos una celda de unos 10 km*. Never
add *nunca* or *jamás* where the English has no "never".

**The time-lapse in war zones.** The caption states the season and nothing else: *11 vistas despejadas · una cada
otoño*. Never add *guerra*, *destrucción*, *bombardeo*, *ocupación*, *genocidio* or any other characterisation the
English does not make. Seasons are the hemisphere's own (the code picks them), so never swap a season for a month.

**Names** (for strings we write; runtime gazetteer names are shown as delivered and never patched):
- *franja de Gaza* (lowercase *franja*, as Fundéu recommends) and *Cisjordania*. Never *Judea y Samaria*. The country
  label is what `Intl.DisplayNames('es')` gives for PS: *Territorios Palestinos*. Add no *ocupado*.
- *Ucrania*. In strings we write, the capital is **Kiev**, the established Spanish exonym (DPD, Fundéu,
  es.wikipedia), as are *Chernóbil* and *óblast de Kiev*. *Kyiv* is also seen in Spanish (some outlets and Ukraine's own
  Spanish texts), and the gazetteer will show *Kyiv* on the same screens: both are fine, we never "correct" either.
  *Crimea* takes no qualifier.
- *Líbano*, *Taiwán* (as `Intl` gives them); never *Taiwán (China)*, *provincia* or *República de China*.
- **Hong Kong** and **Macao**: CLDR's short names, as in every language, English included (owner, 2026-11-19,
  `shownCountryName`), which also avoids Intl Spanish's acronym *RAE* (*RAE de Hong Kong (China)*), which every Spanish
  reader takes for the Real Academia Española. (This guide had proposed *Hong Kong (China)*.)
- **Costa de Marfil** for CI: Intl `es` gives the French *Côte d’Ivoire*; Fundéu recommends *Costa de Marfil*.
- These three need a small per-locale override map in `countryName` (`src/imagery/localPlaces.ts`): code, a few lines,
  free. Translators cannot do it from the catalogs.
- *Islas Malvinas* (the Spanish name, and what `Intl` gives for FK). Never *Falkland* in Spanish copy, never a
  sovereignty note.
- *Gibraltar*, *Sáhara Occidental*, *Kosovo* exactly as `Intl` gives them, with no qualifier.
- *golfo Pérsico*; *Turquía* (the English sublabel's *Türkiye* becomes *Turquía*); *Dubái* (with accent).

**Curated places** (`places` namespace: the three example chips and the *Sorpréndeme* pool). The Spanish form where an
established exonym exists, otherwise the original; generic nouns lowercase inside a name (§6).

| id | label (chip) | sublabel |
|---|---|---|
| area51 | Área 51 (chip *Área 51*) | Groom Lake, Nevada, Estados Unidos |
| centralPark | Central Park (chip *Central Park*) | Nueva York, Estados Unidos |
| giza | Pirámides de Guiza (chip *Guiza*) | Guiza, Egipto |
| uluru | Uluru | Territorio del Norte, Australia |
| palmJumeirah | Palm Jumeirah | Dubái, Emiratos Árabes Unidos |
| worldIslands | Islas The World | Dubái, Emiratos Árabes Unidos |
| grandCanyon | Gran Cañón | Arizona, Estados Unidos |
| meteorCrater | Cráter Barringer | Arizona, Estados Unidos |
| lowerManhattan | Bajo Manhattan | Nueva York, Estados Unidos |
| lasVegasStrip | Las Vegas Strip | Nevada, Estados Unidos |
| hooverDam | Presa Hoover y lago Mead | Nevada y Arizona, Estados Unidos |
| goldenGate | Golden Gate | San Francisco, Estados Unidos |
| kennedySpaceCenter | Centro Espacial Kennedy | Florida, Estados Unidos |
| washingtonDc | Washington D. C. | National Mall, Estados Unidos |
| mountStHelens | Monte Santa Helena | Washington, Estados Unidos |
| niagaraFalls | Cataratas del Niágara | Ontario, Canadá |
| panamaCanal | Canal de Panamá | Esclusas de Gatún, Panamá |
| rioDeJaneiro | Río de Janeiro | Pan de Azúcar y Copacabana, Brasil |
| paris | París | Isla de Francia, Francia |
| venice | Venecia | Véneto, Italia |
| vesuvius | Vesubio | Nápoles, Italia |
| istanbul | Estambul | Bósforo, Turquía |
| chernobyl | Chernóbil | Óblast de Kiev, Ucrania |
| tableMountain | Montaña de la Mesa | Ciudad del Cabo, Sudáfrica |
| kilimanjaro | Kilimanjaro | Kilimanjaro, Tanzania |
| everest | Monte Everest | Nepal y China |
| angkorWat | Angkor Wat | Siem Reap, Camboya |
| singapore | Singapur | Marina Bay, Singapur |
| hongKong | Hong Kong | Puerto de Victoria, Hong Kong |
| tokyo | Tokio | Tokio, Japón |
| fuji | Monte Fuji | Shizuoka, Japón |
| sydneyHarbour | Puerto de Sídney | Sídney, Australia |
| richat | Estructura de Richat | Sáhara, Mauritania |
| greatBlueHole | Gran Agujero Azul | Lighthouse Reef, Belice |
| boraBora | Bora Bora | Islas de la Sociedad, Polinesia Francesa |
| hardyReef | Arrecife Hardy | Gran Barrera de Coral, Australia |
| male | Malé | Atolón Malé Norte, Maldivas |
| deadSea | Salinas del mar Muerto | Cuenca sur, Israel y Jordania |
| binghamCanyon | Mina de Bingham Canyon | Utah, Estados Unidos |
| mountWhaleback | Mina de Mount Whaleback | Pilbara, Australia |
| etna | Etna | Sicilia, Italia |
| santorini | Santorini | Cícladas, Grecia |
| teide | Teide | Tenerife, España |
| kilauea | Kilauea | Hawái, Estados Unidos |
| craterLake | Lago del Cráter | Oregón, Estados Unidos |
| glenCanyonDam | Presa del Glen Canyon | Page, Arizona, Estados Unidos |
| gardenCity | Campos circulares de Garden City | Kansas, Estados Unidos |
| almeria | Invernaderos de Almería | Andalucía, España |
| gibraltar | Gibraltar | Estrecho de Gibraltar |
| suezCanal | Canal de Suez | Ismailía, Egipto |
| aswanDam | Presa de Asuán | Lago Nasser, Egipto |
| wadiRum | Wadi Rum | Áqaba, Jordania |
| sossusvlei | Sossusvlei | Desierto del Namib, Namibia |
| victoriaFalls | Cataratas Victoria | Zambia y Zimbabue |
| threeGorges | Presa de las Tres Gargantas | Hubei, China |
| shanghai | Shanghái | Río Huangpu, China |
| itaipu | Represa de Itaipú | Brasil y Paraguay |

"Crop circles" here are irrigated round fields: *campos circulares*, never *círculos en los cultivos* (the UFO patterns).
*Represa* for Itaipú is the local Spanish usage; *presa* everywhere else. Country names in runtime sublabels come from
`Intl.DisplayNames('es')`, with the three overrides above.

**Glaciers.** *glaciar*, *fin de la temporada de deshielo*. Neutral and physical; no climate commentary the English
does not make.

**Attributions.** The licence credits (*Contains modified Copernicus Sentinel data 2026*, *Landsat: USGS / NASA*,
*Contains modified EUMETSAT Meteosat data*) stay in English, as the data policies word them; they live in code
(`cardSpec.ts`, `Gallery.tsx credit()`, the lightbox, the time-lapse), not in the catalogs. Never translate or paraphrase
them. Translate only the About credit prose and the time-lapse's source line, keeping every name:
- *Imágenes de GIBS de la NASA, parte de EOSDIS. GOES a través de la NOAA y CIRA; Himawari, de la JMA.*
- *Microsoft Planetary Computer y Element 84 Earth Search; la banda de 15 m de Landsat, del Copernicus Data Space
  Ecosystem.*
- *Photon, de komoot. Datos del mapa © colaboradores de OpenStreetMap (ODbL).* (OpenStreetMap's own Spanish wording.)
- `timelapse.source`: *Copernicus Sentinel-2, vía Planetary Computer*.

---

## 9. Pitfalls and the reviewer's checklist

**False friends**
- *actual* = current. "The actual pictures" is *las imágenes reales*.
- *eventualmente* = possibly, not "eventually" (*al final*).
- *soportar* = to put up with. "This browser doesn't support…" is *Este navegador no admite…* / *no es compatible con…*.
- *remover* = to stir (Spain). Use *quitar*.
- *introducir* (Spain) / *ingresar* (Latin America) for typing data: use *escribir* or *buscar*.
- *sensible* = sensitive (of a person); fine for *contenido sensible*, wrong for "sensible".

**Ambiguous words in this product**
- watched: *observar*. Not *vigilar*, *ver* or *mirar* (*ver* stays for literal seeing: *Solo vio nubes.*).
- pass: *pasada*. *pase* is a ticket; *paso* is a step.
- *qué pasó* = "what happened": say *los satélites que pasaron* or *sobrevolar*. *Ver los satélites que pasaron sobre
  este lugar* (landing go button), *Ver los satélites que pasaron sobre [PLACE]* (pin search aria), *Marcador colocado
  en [PLACE]. Presiona Enter o la flecha para ver los satélites que pasaron por aquí.*
- *pudo* + action infinitive = "managed to": for possibility write *pudo haber* + participle.
- spot: *aquí*, *justo aquí*, *el punto exacto*. Never *tu punto* ("your point", as in an argument).
- photo: *imagen* in generic strings; *foto* only where a sentence names a daylight camera.
- scene: *escena*, not *escenario*; never *toma*.
- clear: sky *despejado*; input *Borrar*.
- live: *en tiempo real*.
- frame: *imagen*.
- archive / file: both *archivo*; write *archivo de imágenes* on first mention.
- track: we *seguimos* satellites; a ground track is a *traza*; users are never *rastreados*.
- weather: never *tiempo* (also "time", everywhere in this UI) and never *clima* (= climate); say *meteorológico*, or
  *Meteo* in the filter segment.
- *barrer / barrido*: also "wipe out" and "police sweep". Use *escanear* and *franja*.
- *franja*: our word for swath, and also in *franja de Gaza*. Both stay; never put them in one sentence.
- *en su lugar* ("instead") next to *lugar*: drop it.
- *NO* in a 16-point readout is northwest; it only ever appears beside a degree value.
- *Descarga* alone reads as a Download link: the HUD says *Descargado*.
- *fallo / falla*: regional and ambiguous; the notice label is *Error*.
- *coger*: never (vulgar in much of Latin America). *tomar imágenes*.

**Regional words to avoid**: *ordenador / computadora* (say *navegador* or *dispositivo*), *móvil / celular* (say
*teléfono*), *coche / carro* (say *auto*), *pulsar* (say *presionar* or *tocar*), *ajustes* (say *configuración*),
*fichero* (say *archivo*), *vale*, *dale*, *ahorita*, *chévere*, *mola*, *vídeo* (say *video*), *en directo / en vivo*
(say *en tiempo real*), *informe / reporte* (say *resultados*), *fotograma / cuadro* (say *imagen*), *chincheta*
(say *marcador*), *Intro* for the Enter key (say *Enter*), *fallo / falla* (say *error*).

**Grammar traps**: adjectives or participles that agree with the reader (*¿Estás listo?*, *Bienvenido*), with `[SAT]` or
with `[PLACE]`; `[PLACE]` as a subject, or after the verb of a *qué / que* subject; a third-person verb with no subject
that reads as usted; *le* as a direct object (leísmo); *hubieron*; the gerund of a later action; the English serial
comma (*A, B, y C*); hand-built *y* before *I-*; *º* for degrees; building "`[NUM]` `[title]`" from verdict titles.

**Gallery filter tooltips** (the full words behind *Todo · Detalle · Meteo · Radar*): *Todas las imágenes, de la más
reciente a la más antigua, tras la vista más cercana* · *Sentinel-2 y Landsat, 10–30 m por píxel* · *Mosaicos
meteorológicos diarios, 250 m por píxel o más* · *Imágenes de radar de Sentinel-1, 20 m por píxel: a través de las nubes,
de día o de noche*.

**Reviewer's checklist** (run it over every string)

1. tú only; no usted (including a bare third-person verb), vos or vosotros; no word whose gender depends on the reader.
2. The product verb is *observar*; nothing says *vigilar*, *espiar*, *fotografiar*.
3. `[SAT]`: bare, no article, nothing agrees with it, later references pro-drop; nameless form written in the sentence.
4. `[PLACE]`: bare, no article, no personal *a*, no *del/al* before it, no *lo/la* for it, never a subject, never after
   the verb of a *qué / que / quién / lo que* subject.
5. Every count string has `one`, `many` and `other`; `many` equals `other`; zero has its own sentence; the verb agrees.
6. Numbers through `fmt('es')`; hand-typed numbers as §6 (`1715`, `35 778`, `1,1`); `25%` with no space; `°` not `º`;
   coordinates and example coordinates untouched.
7. Dates from Intl parts; *dom 1 nov* in mono, *el domingo 1 de noviembre* in prose; 24 h; *a la* for `01:`.
8. Accents present, also on capitals; ¿ opens every question; “ ” quotes; … as one character; no raya.
9. Sentence case (generic geographic nouns lowercase inside names); no exclamation marks, no emoji, no *por favor*, no
   marketing words.
10. Every term matches §4 (*pasada*, *imagen*, *aquí*, *Error*, *Descargado*); no regional word; no false friend.
11. Within the §7 budget, counted at 7.7–8.0 px a mono character; buttons in the infinitive; abbreviations only from the
    §6 list.
12. Honest: the label says what is on screen (*imagen* for radar and generic slides, `PÍXEL` not resolution, *al menos*
    while partial, *pudo haber* for what we cannot know).
13. Never-translated items untouched; licence credits not in the catalogs; *Copernicus*, not *Copérnico*; *la NASA*.
14. Sensitive names as §8; nothing added to what the English says about a place.
15. Read it aloud as a reader in Madrid, Mexico City, Buenos Aires and Bogotá. If any of them would say it differently,
    find the version all four would sign.

---

## Decisions log

Each item of the native reviewer's critique (`es.critique.md`) and how it was resolved. Measurements were taken on the
shipped fonts, the CSS and Intl (Node 22 / ICU 78).

1. Numbers by region (blocker): **accepted.** One locale, one link format, one card: a single format for everyone, decimal comma, 4 digits ungrouped, 5+ grouped with U+00A0 (a few lines in `fmt('es')`); regional rows and "sharer's tag" deleted.
2. Coordinates translated (blocker): **accepted.** Verified `parseCoordinates` rejects `43,47; -80,54` and `°O`; coordinates are not copy, examples copied exactly, *O* only for compass words and 16-point readouts.
3. *Pudo apuntar aquí* (blocker): **accepted.** Title is *Pudo haber apuntado aquí*; About and card `couldHave` follow.
4. *pase* → *pasada*: **accepted.** *pasada* (f.) everywhere; titles agree (*Observada*, *Probablemente observada*); *paso* still banned as the unit.
5. `[PLACE]` as subject: **accepted.** Never a subject; *Su franja de 24 km cubría [PLACE]* and card *Su franja cubrió [PLACE]*; checklist item 4 updated.
6. Postposed-subject ambiguity: **accepted.** Rule added to §5; *Qué satélites observaron [PLACE] esta semana*; new place description.
7. *qué pasó* = "what happened": **accepted.** Added to §9 with the go button, pin aria and pin announcement strings.
8. Licence attributions: **accepted.** Credits stay English in code (verified in `docs/I18N.md`, `card/en.ts`, `about.ts`); only About credit prose and `timelapse.source` translated; invented lines removed.
9. *tu punto*: **accepted.** Spot is *aquí / justo aquí / el punto exacto*; strip *Nubes aquí* with ≤ 7 values; all spot strings listed.
10. *foto* vs *imagen*: **accepted.** *imagen* in every generic string (gallery, viewer, card); *foto* only where a sentence names a daylight camera.
11. Gallery filter overflow: **accepted.** *Todo · Detalle · Meteo · Radar* (≤ 8 each) with the full words in tooltips; *Meteo* added to the abbreviation list.
12. Off-nadir and band value: **partly accepted.** Band value becomes `IR` (final, no "if it fits"). *Inclinación* rejected: measured at 8.0 px a mono character, the strip cell holds ≤ 8 characters a line and wraps at spaces, so the one-word 11-character *Inclinación* (88 px) overflows while *Fuera de nadir* wraps to two lines like English *Cloud at spot*; *del* dropped because labels drop articles; card readout 14 × 9.5 px fits 155 px.
13. Percent: **accepted.** `25%` with no space everywhere, matching `tightUnit`; Intl percent style banned.
14. Hand-made date tables: **accepted.** Every date from Intl parts (`sept` accepted), ranges from `formatRange` with `→`; tables deleted.
15. Card hero overflow: **rejected.** Measured in satori with the card's fonts at 88 px: *te observó a ti* is 451 px in the 466 px column (English 406, German 462 already ships); the card keeps three lines, with the four-line split recorded only as the fallback if the hero's size or face changes.
16. `º` vs `°`: **accepted.** Rule in §6 and checklist item 6; search for `º` before review.
17. Hong Kong and Macao: **accepted.** *Hong Kong (China)*, *Macao (China)*, plus *Costa de Marfil*; override map in `countryName` noted as code.
18. HUD *Descarga*: **accepted.** *Descargado 2026-11-19 07:34Z*; stale *Desactualizado, hace 3 d*.
19. Relative days: **accepted.** `short` for minutes and hours, `long` for days (*hace 2 días*), `long` for screen readers.
20. *a la / a las*: **accepted.** Regex on the clock string (`/^01:/`), also for *hacia la*; extraction must pass the clock string.
21. Lane `ENCIMA`: **accepted.** `DE PASO`.
22. *Mi ubicación* for "Locate me": **accepted.** *Localízame* (user's own voice, like *Sorpréndeme*).
23. *Poner marcador*: **partly accepted.** Button *Marcar un punto* accepted; the proposed move hint (39 characters, 313 px) does not fit a 320 px phone, so *Mantén presionado para moverlo* (30); the mouse hint is *O marca un punto en el globo* (28), not the 43-character form that the ellipsis would cut.
24. *¿Me puede ver?*: **partly accepted.** The usted reading is fixed, worded *¿Puede verme un satélite?* (standard question order); *Un auto ocupa un píxel* rather than *Un auto entero cabe en un píxel*, which is closer to the English.
25. Specialist terms: **partly accepted.** *traza terrestre*, *velocidad sobre el suelo* (card *Velocidad*), *vista cenital*, *color verdadero* allowed beside *falso color*, *máxima aproximación* in the countdown all accepted; cloud tops are *topes de las nubes* (transparent to lay readers) rather than the jargon *topes nubosos*.
26. Kiev: **accepted.** *Kiev* and *Chernóbil* in our strings; the "carries no signal" claim dropped; both spellings seen, gazetteer names untouched.
27. Chip and button lengths: **partly accepted.** *Última sin nubes* accepted; *12 esta semana* kept (*12 en 7 días* rejected: it also reads "12 in 7 days' time") with the counter's reserved width set to 14 ch for `es`; share buttons measured at ≤ 11 characters on a 360 px phone, which rules out *Copiar enlace* and *Publicar en X* (13), so *Copiar URL* and *Enviar a X*.
28. One `copied` key: **accepted.** Bare *Copiado*; *Enlace copiado* only for `timelapse.linkCopied`.
29. Curated places: **accepted.** Generic nouns lowercase inside names (first letter of a label still capital); *campos circulares*, *Represa de Itaipú* and the full list in §8.
30. Small naturalness fixes: **accepted.** *por ahora*, *casi con seguridad registró este lugar*, and the reworded `likely` post.
31. Fault label: **accepted.** `ERROR`; *Reintentar*, *Reintentando…*, *Volver*.
32. Computing readout rows: **partly accepted.** Rows and the "drop *meteorológico*" rule accepted; the proposed *Verificando mosaicos de la NASA · 12 / 31* is 41 characters, so *Revisando…* (39).
33. Share card fixed lines: **partly accepted.** All lines accepted except the readout *Inclinación*, which follows item 12 (*Fuera de nadir*).
34. Post text dates: **accepted.** Long prose dates, *hora local*, *a la* for 01:xx, *vía @handle*.
35. Key names, zoom, ARIA roles: **accepted.** *Enter*, *Espacio*, *Esc*; *Acercar (+)*, *Alejar (−)*, *Ampliar (F)*; *carrusel*, *diapositiva*; *Expandir / Contraer panel*.
36. `sats` count: **accepted.** *12 satélites*, no abbreviation.
37. Satellite blurb vocabulary: **accepted.** Added to §4 (*banda C*, *multiespectral*, *órbita crepuscular*, *programado*, ISS phrase, *ha observado todo el planeta*).
38. Privacy precision: **accepted.** Terms added to §8, including no added *nunca*.
39. About title and short words: **accepted.** `Cómo` / `*funciona*.`, section names (*En resumen*, *Cómo encontramos las pasadas*, *Qué significan las etiquetas*, *Lo que no podemos ver*, *Privacidad*, *Créditos*, *Teclado*), boot *Conexión lenta, todavía cargando*, tab title.
40. Spelling rules: **accepted.** *solo*, *este*, *guion*, *o* between digits, *unos 10 km*, *vía* in §6.
41. Time-lapse widths: **accepted.** Static lines as proposed; the progress lines, which the critique did not cover, are reworded to fit 280 px (*Vistas despejadas: 03 de 11*).

Visual QA on every screen (2026-11-19, desktop 1280×800 and 1024×768, phones 390 and 360 px):

42. Pass list rows: *5,3° fuera de nadir · 73 km · nubosidad 25%* (43) and *Más cercana 8,9° fuera de nadir · 131 km* were
    cut with "…" on desktop and phone. The row value is now *5,3° del nadir* (34 and 35 characters, the English length);
    the label stays *Fuera de nadir*. The timeline tooltip follows.
43. Computing readout's window line: *Ventana de 7 días · 27 oct 05:00 → 3 nov 05:00 UTC* was cut; now *7 días · …* (39).
44. Share card plate: *Geometría · norte arriba* (§3.6).
45. Geometry label *Velocidad terrestre* (§4).
46. About: *A ti no se te ve.* left *ve.* alone on a phone line; the clitics are held to the verb with no-break spaces
    (§6). The `could` line no longer repeats *llegó a*: *No hay forma de saber si lo hizo.*
47. Week card: *esta semana.* is held together by a no-break space, so the serif lines read *Waterloo* / *esta semana.*
    instead of *Waterloo esta* / *semana.*
48. Week card's lead chip: *Más cercana* (§3.6), which ends before the scale chip.

Reviewer's "side notes for the code", carried to the owner (not language decisions):
- S1. The English hint's `−80.54` uses U+2212, which `parseCoordinates` rejects: fix the parser or the English, and the Spanish hint follows the English character for character.
- S2. U+202F is not in the shipped subsets: confirmed; this guide never uses it (French should check its readouts).
- S3. `countryName` per-locale overrides: required by §8 (HK, MO, CI).

The reviewer's "Keep" list (tú, infinitive buttons, *observar*, the hero, the headline, *Se publicaron (al menos) N
imágenes*, the zero sentence, bare slots, `many` = `other`, *otros 7*, `Intl.ListFormat`, no *barrer*, *time-lapse*,
*video*, *auto*, the sensitive names, the war-zone caption rule, “ ” quotes, accents on capitals, sentence case) is
kept as it was.
