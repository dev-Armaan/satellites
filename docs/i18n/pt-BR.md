# Watched: Brazilian Portuguese (pt-BR) localisation style guide

Final, 2026-11-19. One Brazilian Portuguese for readers in Brazil, and the language every other Portuguese reader gets
(Portugal, Angola, Mozambique…: `locales.ts` maps any `pt-*` to `pt-BR`). Where Brazil and Portugal differ and a word
natural in both exists, this guide picks it; where none exists, it picks the Brazilian word and says so. Every
translator and reviewer of `pt-BR` follows this guide. Where it says "never", there is no exception unless this guide
lists one. Where it disagrees with `docs/i18n/TRANSLATING.md` on language, this guide wins; on how the system works
(catalogs, `fmt`, `dates.ts`, rich parts), the system docs win.

Sources: `docs/DESIGN.md` (§3, §7 and the verdict table), `docs/I18N.md`, `docs/i18n/TRANSLATING.md`, `README.md`,
`src/ui/landing/Landing.tsx`, `src/ui/results/lib/copy.ts`, `src/ui/results/lib/meta.ts`, `src/ui/pages/AboutPage.tsx`,
`api/_lib/cardSpec.ts`, `api/_lib/card.ts`, `api/_lib/i18n/{locales,format,dates,parts}.ts`, `api/_lib/i18n/card/en.ts`,
every `src/i18n/en/*.ts` namespace (their comments carry the budgets used in §7), `src/ui/results/lib/photos.ts`
(`filterOf`), `src/imagery/geocode.ts` (`parseCoordinates`), `src/engine/passes.ts` (`verdictFor`), and the CSS of the
strip, gallery bar and card. Intl output quoted here is Node 22.23 / ICU 78.3. Card widths were measured with the
shipped card fonts (`api/_fonts/*-latin.ttf`): satori for the hero, advance widths for the mono rows (Martian Mono has
no kerning, so those are exact).

**Cost and speed.** Nothing in this guide needs a paid service, a library, a request, stored data or a download.
Translations are static strings in the pt-BR chunk; plural rules, numbers, lists, dates, relative times and country
names come from the browser's built-in `Intl`. Every character pt-BR uses (á à â ã é ê í ó ô õ ú ç, º, “ ” ’ …, –, −,
U+00A0) is in the `latin` subsets of Instrument Sans, Instrument Serif and Martian Mono that the site and the card
already load (cmaps checked), so pt-BR adds no font bytes. One locale, one number format, one card per share: no
regional variants, no extra card renders, no extra cache entries. The card's hero keeps its size (measured, §3.1), so
the default card is rendered exactly as often as today. The only code this guide asks for is a few lines of pure
string logic inside the pt-BR catalog (*à/às*, *no/na* before a weekday, *1º*) and one type-only change (§9.4). Place
names stay as the gazetteer gives them: a table of Portuguese exonyms would add megabytes to every search.

---

## 0. Decisions at a glance

| Question | Decision |
|---|---|
| Address | **você**, third-person verbs. Never tu, te, o senhor, a gente. |
| Product verb ("watched") | **observar**: *observou / observaram*. Never assistir, vigiar, espionar, fotografar, ver, olhar, flagrar, monitorar. |
| Hero (landing and default share card) | `Algo` / `observou *você*` / `esta semana.` |
| Sub line | *Busque qualquer lugar da Terra. Veja todos os satélites que passaram sobre ele nos últimos 7 dias, e as imagens reais que captaram.* |
| Pass (the unit) | **passagem** (f.), *passagens*. Never passe, passo, trânsito. |
| Verdict titles | **Observou** · **Deve ter observado** · **Pode ter apontado aqui** · **Sobrevoou** (each ≤ 23 characters, §7) |
| Lane labels | `IMAGEM` · `PROVÁVEL` · `POSSÍVEL` · `SOBREVOO` |
| Verdict verbs (headline, post, row) | *observou* · *cobriu* · *teve … ao alcance* (prose: *esteve ao alcance*) · *sobrevoou* |
| *varrer* | Only with the Earth, the disc, a swath or the scan line as object. Never with a place name or *o local*. |
| Image / photo | **imagem** everywhere a picture is named generically; **foto** only for Sentinel-2 / Landsat true-colour pictures named as such (and the gallery filter that holds only those). |
| "Look" | **vista** (f.): *vista mais próxima*, *última vista limpa*, *12 vistas limpas*. |
| Spot (the searched point) | *o seu ponto* in prose, *ponto* or *aqui* in labels, *o local* / *este lugar* to refer back. |
| Buttons | Infinitive, no pronoun: *Compartilhar*, *Copiar link*, *Baixar imagem*, *Rever*. One fixed exception: *Surpreenda-me*. |
| Numbers | `fmt('pt-BR')`: `1.715`, `7,46`, `25%`. Translators type a separator only in the `sats` blurbs (§6). |
| Coordinates | Not copy: as code writes them (`43.47°N 80.54°W`, `Sol 16.2°S 063.0°E`, *em 0.2°W*). |
| Compass words and 16-point readouts | Portuguese, **O** for oeste: *a oeste*, `SSO`, `ONO`. Never L. |
| Degrees | `°` (U+00B0), attached: `5,3°`. Never `º` (U+00BA) for degrees. |
| Time | 24 h, `16:14:21`; *às*, but *à* when the clock starts `00` or `01`. Never `16h14`, never AM/PM. |
| Dates | From Intl parts. Mono: `dom 1 nov` (no periods, no *de*). Prose: *domingo, 1º de novembro*. |
| Quotes | “ ” then ‘ ’. Never « », never straight quotes. |
| Zero | Every count that can be 0 has an `n === 0` branch in code: pt-BR's plural rule puts 0 in `one`. |
| Place and satellite slots | Bare: no article, no contracting preposition (*de, em, a, por*), nothing that agrees with them. `[PLACE]` is never a subject. In pass paragraphs a satellite is *O satélite {sat}* (§5). |
| BR or PT word | Neutral if natural (§1.4); else Brazilian (*baixar*, *salvar*, *compartilhar*, *câmera*, *geleira*). |
| Licence credits | Stay English, in code (Copernicus, EUMETSAT, USGS lines). Not in the catalogs. |
| Telemetry | Analytics and fault `msg` stay English (they read the English namespace). Never log a pt-BR sentence. |

---

## 1. Register and address

### 1.1 The decision per surface

| Surface | Register | Example | Why |
|---|---|---|---|
| Display headlines (hero, results headline, About title, share card headline) | Declarative statement, sentence case, no imperative, no exclamation. The reader appears as **você** (the object, stressable). | *Algo observou você esta semana.* | *Você* is the one unmarked written pronoun of Brazil and the only one that can carry the serif accent. |
| Sentences and prose (results, pass paragraph, notes, footnotes, post text) | **você** + third-person verbs. The product speaks as *nós* through the verb ending only (*calculamos, não temos como saber*), never the pronoun *nós* and never *a gente*. Preterite for dated facts, imperfect for states during a pass, present for definitions. | *Não temos como saber se observou.* | Second person, plain, factual. |
| UI labels, buttons, placeholders, aria names of actions | **Infinitive**, no pronoun, no article where a label can drop it. | *Compartilhar*, *Baixar imagem*, *Usar meu local*, *Ver seu lugar* | The pt-BR platform convention (system dialogs, Google, Apple, Microsoft); neutral in register and natural in Portugal. |
| Mono caps labels | Noun or noun phrase, no article, no verb (unless the label is an action). Stored in sentence case. | *Altitude*, *Fora do nadir*, *02 / Passagens* | Instrument labels name a quantity. |
| Status lines while something runs | Gerund + ellipsis: *Carregando…*, *Baixando…*, *Localizando…*, *Captando…* | *Criando link…* | Brazilian; no neutral form stays short (§1.4). |
| Fault notices | Label **Falha**. What failed in the impersonal *Não foi possível…*; what to do in the imperative of *você*. No apology, no *Ops!*, no *Desculpe*, no *por favor*. | *Não foi possível carregar o catálogo de órbitas. Verifique a conexão e tente de novo.* | An instrument reports a fault; it does not apologise. |
| About page | **você** + *nós* (verb endings), a little warmer than results, short sentences, no em dashes (the owner's About copy has none). | *Escolha um ponto da Terra. Calculamos quais satélites passaram sobre ele na última semana.* | The owner's plain explanatory voice. |

Instructions inside sentences use the **imperative of você** (subjunctive form): *Busque*, *Veja*, *Tente*, *Escolha*,
*Pressione*. Never the tu-imperative (*Busca*, *Vê*), never the infinitive as an instruction inside a sentence.

### 1.2 Rules that follow from você

- **You as an object:** *observou você*, *passou sobre você*. Never the clitics *o / a* (they mark the reader's gender)
  and never *te* (it belongs to *tu*; *te* with *você* is spoken Brazilian and a register slip in writing).
- **Your:** *o seu / a sua* in prose (the article reads naturally in Brazil and Portugal); no article in labels (*Usar
  minha localização*, *Ver seu lugar*). A possessive only for what is the reader's: never *seu / sua* for a
  satellite's or an object's things, because the reader reads "your" (*a trajetória*, *a faixa*, *o operador*).
- **The reader's gender is unknown.** No adjective or participle that agrees with the reader: no *Você foi
  observado(a)*, no *Bem-vindo*, no *Pronto?*. Make the satellite or the image the subject.
- **Object clitics** split Brazil (*me vê*) from Portugal (*vê-me*). Avoid them. Two fixed exceptions, correct in both
  countries: *Surpreenda-me* (enclisis at the start of a phrase) and proclisis after a preposition or an attracting word
  (*Dá para me ver?*, *por isso as mostramos*).

### 1.3 Rejected alternatives

| Rejected | Why it lost |
|---|---|
| **tu** (correctly conjugated) | Standard in Portugal and parts of Brazil, but regional to most Brazilians; *tu observaste* reads like another country. |
| **te** with você (*Algo te observou*) | The most natural spoken Brazilian form, but a register mix in writing, and an unstressed clitic cannot carry the serif accent. |
| **o senhor / a senhora** | Too formal for a product about you, and gendered. |
| Fully impersonal copy | Kills the product. "Something watched *you*" is the point; buttons are impersonal, sentences are not. |
| Imperative buttons (*Compartilhe*, *Baixe*) | Read as advertising (*Compartilhe já!*). The infinitive is the instrument's voice. |

### 1.4 Brazil and Portugal: which word

| Concept | Brazil | Portugal | Use |
|---|---|---|---|
| file (computer) | arquivo | ficheiro | **Neither**: name the thing (*o vídeo*, *a imagem*, *o PNG*). *Arquivo* is reserved for **archive**. |
| screen | tela | ecrã | Avoid: *aqui*, *nesta página*, *para exibição*. |
| download | baixar | transferir | *baixar* (no neutral word). |
| save | salvar | guardar | *salvar* for files; *guardar* for what we keep (privacy), neutral. |
| share | compartilhar | partilhar | *compartilhar*. |
| camera | câmera | câmara | *câmera* (*câmara* is also a legislature in Brazil). |
| browser | navegador | navegador / browser | *navegador*. |
| settings | configurações | definições | *configurações*. |
| connection (network) | conexão | ligação | *conexão*. |
| it runs (software) | roda | corre | *funciona*, *acontece*, *é calculado*. |
| record (an image) | registrar | registar | **captar** (neutral). |
| contact | contato | contacto | Avoid. |
| optical | óptico / ótico | óptico / ótico | *óptico* (valid in both). |
| user | usuário | utilizador | Avoid: say *você*. |
| phone | celular | telemóvel | Avoid: *telefone*, *este aparelho*. |
| progressive | estava olhando | estava a olhar | Simple imperfect: *olhava*. A gerund that is not a progressive (*Apontando 12,3° fora da vertical, …*) is correct in both. |
| in fact | de fato | de facto | Avoid; *realmente* where needed. |
| detect | detectar | detetar | *encontrar*, *identificar*. |
| in 3 h | em 3 h | dentro de 3 h | *daqui a 3 h* (both). |
| local time | horário local | hora local | *hora local* (both). |
| glacier | geleira | glaciar | *geleira*. |
| billion | bilhão | mil milhões | Digits only. |
| in a | em um | num | *em um* (Brazilian written norm, understood everywhere). |
| status line ("Loading…") | Carregando… | A carregar… | *Carregando…* (no neutral form stays short). |
| east (letter) | L (school compass) | E | **E** in compass readouts. |
| Antarctica | Antártica | Antártida | Never written by hand: country names come from Intl (*Antártida*). |

Orthography is the Brazilian variant of the 1990 Agreement: *quilômetro*, *fenômeno*, *ação*, *ótimo*, *sobrevoo*
(no circumflex), *ideia* (no accent), *micro-ondas*.

---

## 2. Voice

### 2.1 How it sounds in Portuguese

The English is cool, exact and slightly unsettling because it states facts about *you* without comment. Portuguese
gets there with **short active sentences, concrete subjects, real numbers and no adjectives of feeling**. The satellite
is the subject and it *did* something: *passou*, *olhava*, *cobriu*, *observou*. The uncanny part is left to the
reader, never named: no *assustador*, *incrível*, *misterioso*, *de olho em você*.

- **Declarative:** statements in the indicative. The only questions are the English ones (the share hook *O que passou
  sobre você esta semana?*, About's terms *Dá para me ver?*).
- **Specific:** a number, a time, a direction, a satellite name in every sentence that can hold one.
- **Second person:** *você* where the English has *you*, not more often. Portuguese drops subjects; do not add *você*
  to every sentence (*Você pode ver…* is salesy).
- **Quietly uncanny:** end on the concrete thing (*Um carro é um pixel.*), not on a comment about it.

### 2.2 Rhythm

- Sentences of **6–16 words**; split anything over 22. One idea per sentence, as in English.
- Order: **what crossed → where → when → how it moved**, then what it means, then what we can't know.
- Put the number late in its clause (*rumo ao sul a 7,46 km/s*) and the place last in its sentence where the frame
  allows (*observaram Waterloo.*): that is where the mono span and the serif accent land in the English layout.
- Commas: none in a simple list before *e*. A comma before *e* when the two parts have different subjects or the
  sentence could misparse (*…nos últimos 7 dias, e as imagens reais que captaram.*). A comma before *mas* and *por
  isso*.

### 2.3 What to avoid

- **Marketing tone:** *Descubra*, *Incrível*, *Confira*, *Agora você pode*, exclamation marks, emoji.
- **Calques of English structure:** possessive chains (*sua câmera… sua faixa…*) where Portuguese uses the article;
  *ser* passives where English is active; *estar sendo* + participle; *realizar uma passagem*; *passar ao alcance*
  (§3.4); *acima* with no complement (*passou 786 km acima*); *varrer X para dentro de Y*.
- **Gerund chains** (*estava olhando*, *vai estar calculando*): imperfect or simple tense.
- **Hedging fluff:** *Infelizmente*, *Vale lembrar que*, *É importante notar*. English says "We can't know";
  Portuguese says *Não temos como saber.*
- **Colloquial spellings:** *pra*, *tá*, *né*, *cê*. Write *para*, *está*.
- **Glosses** the English doesn't have (*(satélite)*, *(fotografar)*).

### 2.4 Before and after

| English | ✗ Literal or wrong | ✓ pt-BR | Why |
|---|---|---|---|
| Something watched you this week. | Algo assistiu você essa semana. | Algo observou você esta semana. | *Assistir* is "watch a show" (*assistiu Waterloo* = watched the film). *Esta* for the current week in writing. |
| See every satellite that passed over it… | Descubra quais satélites estão de olho em você! | Veja todos os satélites que passaram sobre ele nos últimos 7 dias… | Marketing verb, exclamation, an idiom that names the creepiness. |
| A fixed camera’s swath covered this place. No picture of it is published. | A faixa da sua câmera fixa cobriu sua localização. Nenhuma foto dela é publicada. | A faixa de uma câmera fixa cobriu este lugar. Nenhuma imagem foi publicada. | Possessives read as "your"; *dela* points at the wrong noun; present passive is a calque. |
| Sentinel-2C swept over Waterloo. | Sentinel-2C varreu Waterloo. | Sentinel-2C cobriu Waterloo. | *Varrer* + a place is the verb of storms and wars (*o furacão varreu a costa*); next to Gaza or Kharkiv it reads as destruction. |
| It was looking straight down. | Ele estava olhando diretamente para baixo. | Olhava direto para baixo. | No pronoun, no progressive, one adverb. |
| Can it see me? No. At best a pixel here is 10 m across. A car is one pixel. You’re not in it. | Ele consegue me ver? Não. No melhor caso, um pixel tem 10 metros de largura… | Dá para me ver? Não. Na melhor das hipóteses, um pixel aqui tem 10 m de lado. Um carro é um pixel. Você não aparece. | No subject pronoun, the idiom (not *no melhor caso*), ends on the concrete fact. |

---

## 3. The key lines

Notation: `**bold**` is a `strong()` part, `*italic*` the `accent()` part (the serif; signal orange in the hero),
`[786 km]` a `num()` part (mono, unit smaller; `°` and `%` attach). Code is the catalogs' real TypeScript: messages are
typed functions of raw values (`docs/I18N.md`), never ICU strings, and a pt-BR file starts with

```ts
import { fmt } from '../../../api/_lib/i18n/format'
import { accent, num, strong, type Rich } from '../../../api/_lib/i18n/parts'
const f = fmt('pt-BR')
```

A pt-BR file never imports `src/i18n/en/plain/english` (`placeInProse`, `placeAccent`, `capitalize`): that is
English's article logic. pt-BR uses `accent(place)` and the bare `place`.

### 3.1 The hero

```ts
hero: [['Algo'], ['observou ', accent('você')], ['esta semana.']] as Rich[],
```

Only *você* is in the serif italic, in signal orange; *observou* stays in the condensed sans; the full stop stays.
The same three lines are the default share card's `hero`. Measured in satori with the card's fonts at 88 px:
*observou* **você** is **444 px** of the 466 px column (English *watched* **you** 408 px; German's 464 px ships). The
card keeps its size: no per-locale hero size.

| Option | Verdict |
|---|---|
| **Algo / observou *você* / esta semana.** | **Chosen.** *Algo* alone on line 1 is a beat of suspense, as *Something* is. The accent falls on *você*, the human moment, mid-poster as in English. The verb is the product verb, so the hero rhymes with every headline (*observaram Waterloo*). |
| Alguma coisa / observou *você* / esta semana. | Rejected: balanced lines (398 / 444 / 388 px) but the chattier spoken form, two syllables longer; it loses the menace. |
| Esta semana, / algo observou / *você*. | Rejected: moves the time hook first and leaves a 5-letter last line. |
| ~~Algo te observou esta semana.~~ | Rejected: *te* mixes *tu* and *você* and cannot carry the accent. |
| ~~Você foi observado esta semana.~~ | Rejected: passive, and it guesses the reader's gender. |

For Portugal *observou você* sounds Brazilian (they would write *observou-te*); no form is neutral, gender-free and
stressable, so the Brazilian one wins. QA: look at `?hl=pt-BR` during and after the wipe; the serif *ê*'s circumflex
must not be clipped by `.hl`'s mask (§9.4).

`app.documentTitle` and the boot title: *Watched · Algo observou você esta semana*. The share post's invitation keeps in
step with the hero: *Algo observou você também esta semana.* (§3.6).

### 3.2 The sub line

```ts
sub: (days: number): Rich => [
  'Busque qualquer lugar da Terra. Veja todos os satélites que passaram sobre ele nos últimos ',
  String(days),
  ` ${f.plural(days, { one: 'dia', many: 'dias', other: 'dias' })}, e as imagens reais que captaram.`,
],
```

131 characters (English 120, +9%). The comma before *e* stops the garden path ("the last 7 days and the images").
*Imagens reais* is the word the card uses (*esta é a imagem real*); it carries "actual" without the false friend
*atual* and without *realmente*, which would hint at doubt. *Ele* is *lugar*, from the previous sentence: a pronoun for
a fixed noun across a sentence break is fine; a pronoun for a `[PLACE]` slot never is. No *eles* before *captaram*:
Portuguese drops the subject.

Rejected: *Digite qualquer lugar…* (you type a name, not a place); *Escolha… na última semana… as fotos que tiraram*
(*última semana* is not "the last 7 days", *fotos que tiraram* is snapshot slang and miscounts radar).

The share page's description is the same sentence. `card.page.placeDescription(place)`: *Todos os satélites que
passaram sobre {place} nos últimos 7 dias, e as imagens reais que captaram. Quais satélites observaram você esta semana?*

### 3.3 Results headline, second line, reasons and footnotes

**Headline** (`results.headline`). Strong = the count phrase **with its verb** (the verb agrees, so it lives inside
the plural); accent = the place; `n` ≥ 1.

```ts
watched: (n: number, place: string, when: WindowWhen): Rich => [
  'lastDays' in when
    ? `${f.plural(when.lastDays, { one: 'No último dia', many: `Nos últimos ${when.lastDays} dias`, other: `Nos últimos ${when.lastDays} dias` })}, `
    : `Entre ${when.from} e ${when.to}, `,
  strong(num(f.int(n)), f.plural(n, { one: ' satélite observou', many: ' satélites observaram', other: ' satélites observaram' })),
  ' ',
  accent(place),
  '.',
],
none: (place: string, past: boolean): Rich => ['Nenhum satélite que rastreamos observou ', accent(place), past ? ' naquela semana.' : ' esta semana.'],
```

| Case | pt-BR |
|---|---|
| 256 | Nos últimos 7 dias, **256 satélites observaram** *Waterloo*. |
| 1 | Nos últimos 7 dias, **1 satélite observou** *Waterloo*. |
| none | Nenhum satélite que rastreamos observou *Waterloo* esta semana. / …naquela semana. |
| older week | Entre 29 de outubro e 5 de novembro, **256 satélites observaram** *Waterloo*. |

The older week's dates are prose, so they are long (*29 de outubro*, *1º de novembro*), never the mono *29 out*. The
`WindowWhen` slot carries `time.dayMonth` strings, which in pt-BR are the mono form; it must also carry the instants
(`fromMs`, `toMs`, `timeZone`; English ignores them, a type-only change, §9.4) so this message writes the long dates
itself with `formatDate('pt-BR', ms, tz, { day: 'numeric', month: 'long' })` and the *1º* rule (§5).

*Rastrear* is the established term for tracking satellites; it takes satellites as object, never *você*.

**Second line** (`results.imagesPublic`, `noImages`, `archiveDown`). The strong part is the "at least" words, hidden
once the count is final; the sentence reads with and without it. `k` ≥ 1.

```ts
imagesPublic: (k: number): Rich => [strong('Pelo menos '), num(f.int(k)), f.plural(k, { one: ' imagem foi publicada.', many: ' imagens foram publicadas.', other: ' imagens foram publicadas.' })],
noImages: { thisWeek: 'Nenhuma imagem foi publicada esta semana.', thatWeek: 'Nenhuma imagem foi publicada naquela semana.' },
archiveDown: 'Os arquivos de imagens não responderam, por isso não conseguimos contar as imagens públicas agora.',
```

*Publicadas* agrees with *imagens* (fixed noun). Rejected: *se tornaram públicas* (longer; "became" hints they were
secret), *foram divulgadas* (press-release flavour). The card: `card.photos` the same sentences, 0 → *Nenhuma imagem
foi publicada.*; `archiveDownShort` *Os arquivos de imagens não responderam.*

**Why nothing was made public** (`results.why`, "it" = the place → *o local*):

| key | pt-BR |
|---|---|
| sunNeverRose | O sol não chegou a nascer, por isso nenhuma câmera diurna pôde ver o local. |
| sunBarelyRose | O sol mal nasceu, por isso nenhuma câmera diurna pôde ver o local. |
| infrared(n) | Ainda assim, satélites meteorológicos captaram o local [42] vezes no infravermelho. (*[1] vez*) |
| radar(names, others, passes) | O radar não precisa de luz. Umbra-08, Capella-14 e mais 7 satélites de radar estiveram ao alcance [1.204] vezes. |
| unpublished(n) | O Sentinel-2 ou o Landsat passou sobre o local 3 vezes durante o dia, mas nenhuma cena foi publicada ainda. (*uma vez*) |
| none | Nenhum satélite com imagens públicas passou sobre o local durante o dia. |

`radar`: the list is `f.list([...names, 'mais 7 satélites de radar'])` (*mais* avoids agreeing *outros*; one: *mais 1
satélite de radar*), and the verb agrees with the total: one name and no others → *esteve*, otherwise *estiveram*.
Static text may give known names an article (*o Sentinel-2*, *o Landsat*); slots never get one.

**Footnotes** (`results.notes`; counts are strong parts):

> **31** imagens detalhadas (Sentinel-2, Landsat, 10–30 m) · **12** mosaicos meteorológicos diários (250–375 m) ·
> **4** imagens de radar (Sentinel-1, 20 m) · **1.715** imagens de disco completo de satélites meteorológicos
> geoestacionários (2–5 km; a mais recente de cada um aparece aqui). Verificamos 412 passagens de 38 satélites de
> observação e estações tripuladas.

Each noun has its own plural (*1 imagem detalhada*, *1 mosaico meteorológico diário*, *1 imagem de radar*, *1 imagem
de disco completo*). `passTimes` never needs the place after a preposition: *Os horários das passagens são o momento
em que cada satélite esteve mais perto do lugar pesquisado, calculados a partir de elementos orbitais públicos (obtidos
em 2026-11-08 03:31Z). Horários locais: America/Toronto.* (The `place` parameter is left unused.)

Readouts (`results.verdictReadout`): *4 passagens: Observou* (a title never follows a bare number, §3.5).

### 3.4 Pass sentences

One message per sentence (`src/i18n/en/pass.ts`); the shape (overhead or offset, straight down or pointing away)
is chosen by code, the words by the message. In the **imaged, likely and could** messages and in `geo.sits`, the
satellite is introduced as **O satélite {sat}** (those verdicts never hold a crewed station: `verdictFor` gives
`crewed` only `'overhead'`; geostationary watchers are all satellites). Every later sentence has a null subject.
`overhead` keeps the bare name (it may be a station: *ISS (ZARYA) passou…*).

Reference paragraph, English: *Sentinel-2C crossed 786 km overhead at 16:14:21 UTC, moving south at 7.46 km/s. It was
looking straight down. Cloud cover across the scene: 25%.*

> O satélite Sentinel-2C passou na vertical do local, a [786 km] de altitude, às [16:14:21 UTC], rumo ao sul a
> [7,46 km/s]. Olhava direto para baixo. Cobertura de nuvens na cena: [25%].

- *Na vertical do local* is the exact, natural phrase in both countries; *a 786 km de altitude* gives *acima* nothing
  to dangle from and matches the post.
- *Rumo ao sul* has no verb: no gerund question. The 8 heading phrases are a table (§4.3).
- *Olhava*: imperfect, null subject, no pronoun, no gender.
- *a 7,46 km/s*, *a 786 km*: plain *a*, never *à*. *às 16:14:21 UTC*: *à* for `00`/`01` (§5).

| key (shape) | pt-BR |
|---|---|
| crossed, overhead | O satélite Sentinel-2C passou na vertical do local, a [786 km] de altitude, às [16:14:21 UTC], rumo ao sul a [7,46 km/s]. |
| crossed, offset | O satélite Sentinel-2C passou a [786 km] de altitude, [61 km] a oeste do local, às [16:14:21 UTC], rumo ao sul a [7,46 km/s]. |
| lookingDown | Olhava direto para baixo. |
| lookingOff(deg) | Olhava [5,3°] fora da vertical. |
| cloudCover(pct) | Cobertura de nuvens na cena: [25%]. |
| mosaic | O sensor VIIRS captou Waterloo para o mosaico diário da NASA em cores naturais, a [375 m] por pixel. |
| radarImaged | O radar, apontando [32,1°] para o lado, captou Waterloo a [20 m] por pixel, no escuro. (not dark: …por pixel.) |
| likely.crossed, overhead | O satélite Sentinel-2B passou na vertical do local, a [786 km] de altitude, às [10:31:02 EST], com este lugar dentro da faixa de [290 km]. |
| likely.crossed, offset | O satélite Sentinel-2B passou a [786 km] de altitude, [12 km] a leste do local, às [10:31:02 EST], com este lugar dentro da faixa de [290 km]. (no swath: ends at the time.) |
| likely.archiveFailed | Era dia, por isso teria captado este ponto. Não foi possível consultar o arquivo agora. |
| likely.noScene | Não existe cena desta passagem. O Sentinel-2 só capta terra e águas costeiras, e pode não ter programado este ponto. |
| likely.notYet | Era dia, por isso quase certamente captou este ponto. Nenhuma cena desta passagem foi publicada ainda; a publicação pode levar um dia ou mais. |
| likely.dark | Estava escuro aqui. À noite, o sensor deste satélite trabalha no infravermelho: viu as suas nuvens, não as suas ruas. |
| likely.mosaicUnconfirmed | Não foi possível confirmar no seu ponto o mosaico diário da NASA desta passagem. |
| likely.notPublished | As imagens deste satélite alimentam a previsão do tempo; não são publicadas como imagens que possamos mostrar. |
| could.withinView, offset | O satélite WorldView Legion 4 esteve ao alcance às [10:52 EST], [61 km] a oeste do local. |
| could.withinView, overhead | O satélite WorldView Legion 4 esteve ao alcance às [10:52 EST], na vertical do local. |
| could.insideSwath | A faixa de [24 km] cobriu Waterloo. O operador não publica onde captou imagens, por isso não temos como saber se observou este lugar. |
| could.camera, deg | Apontando [12,3°] fora da vertical, pode ter observado Waterloo. Não temos como saber se observou. |
| could.camera, none | Olhando direto para baixo, pode ter observado Waterloo. Não temos como saber se observou. |
| could.radar | O radar vê através das nuvens e do escuro. Apontando [32,1°] para o lado, pode ter mapeado Waterloo. Não temos como saber se mapeou. / (open archive) Não encontramos nenhuma imagem publicada desta passagem. / (no deg) …escuro. Pode ter mapeado Waterloo. … |
| overhead, toward | ISS (ZARYA) passou a [420 km] de altitude às [21:03 EST], [62°] acima do seu horizonte, a oeste. |
| overhead, zenith | ISS (ZARYA) passou a [420 km] de altitude às [21:03 EST], [85°] acima do seu horizonte, quase a pino. |
| darkStation | Estava escuro onde você está. Se a estação ainda estava sob a luz do sol, cruzou o seu céu como um ponto brilhante que não pisca. |
| geo.sits | O satélite Meteosat-12 não passa. Fica a [35.778 km] de altitude sobre o equador, em 0.2°W, e a cada [10 minutos] varre toda a face da Terra que se vê de lá. (no seat: drop *, em …*; no cadence: *…e varre toda a face da Terra que se vê de lá.*) |
| geo.reached | A linha desta varredura cruzou Paris por volta das [07:49 CET], rumo ao norte. (*por volta da* for `00`/`01`) |
| geo.infrared | Estava escuro aqui, por isso esta imagem é no infravermelho: o topo das nuvens pela temperatura; quanto mais frio, mais claro. |

Notes:
- **Off-nadir is one word in prose: *fora da vertical*.** Labels say *Fora do nadir*; field of regard is *Inclinação
  máx.* Never *Com inclinação de 12,3°* (a second concept, and it drops who is inclined).
- *Esteve ao alcance*, never *passou ao alcance* (*ao alcance* goes with *estar* or *ter*).
- *Captar* is the verb for an instrument making an image (VIIRS, radar, Sentinel-2); *observar* stays the product's
  verdict verb; *varrer* only with the Earth, the disc or a swath as object (*varre toda a face da Terra*, *varre uma
  faixa de 3.040 km*).
- *Deste satélite* only where the sentence is never said of a station (`likely.dark`, `likely.notPublished`).
- The geostationary seat (*0.2°W*) is a coordinate: as code writes it (§6).

### 3.5 The four verdicts

Titles are **verb phrases with the satellite as unstated subject** (Portuguese drops subjects), so nothing agrees in
gender: *observado/observada* would have to agree with something, and *a passagem observada* is false (the pass is
not what was watched).
*Deve ter observado* is a compound perfect (*ter* + invariable participle), so it agrees with nothing either, and
*deve ter* is the Brazilian inference "likely": it pairs with *Pode ter apontado aqui* as likely pairs with could.
*Provavelmente observou* (22) did not fit the summary tile; *Pode ter apontado para cá* (25) wrapped (§7). Prose keeps
the same words as the title (*Pode ter apontado aqui.* in the post, the card page and About).

| verdict | title | lane (≤ 8) | unit | definition | verb (row, headline) |
|---|---|---|---|---|---|
| imaged | **Observou** | Imagem | passagem / passagens | Há uma imagem real deste lugar em um arquivo público. | observou |
| likely | **Deve ter observado** | Provável | passagem / passagens | A faixa de uma câmera fixa cobriu este lugar. Nenhuma imagem foi publicada. | cobriu |
| could | **Pode ter apontado aqui** | Possível | passagem / passagens | Uma câmera orientável ou privada estava ao alcance. O operador não diz se ela olhou. | esteve ao alcance (headline: *teve … ao alcance*) |
| overhead | **Sobrevoou** | Sobrevoo | passagem / passagens | Cruzou o seu céu. Estações espaciais e todo o resto. | sobrevoou |

- **Lane *Imagem*, not *Foto*** (the card's `lane.imaged` too): the lane holds radar images and weather mosaics as
  well as photos, and DESIGN says radar images are never photos. This deviates from English *Photo* on purpose; the
  owner may want English to follow.
- *Pode ter* (may have), not *Poderia ter*: "it's possible; we can't know". *Ela* in the *could* definition is *a
  câmera*, a fixed noun in the same sentence.
- **A title is never placed after a bare count** (*4 observou* is ungrammatical). Where a count and a verdict meet,
  use a colon (*4 passagens: Observou*) or the lane words in running text, as the timeline summary does:
  *Linha do tempo, 7 dias: 4 passagens com imagem, 12 prováveis, 30 possíveis, 8 sobrevoos.* (singular *1 passagem
  com imagem*, *1 provável*, *1 possível*, *1 sobrevoo*; 0 takes the plural).
- Unit: `n === 0 ? 'passagens' : f.plural(n, { one: 'passagem', many: 'passagens', other: 'passagens' })`.
- About's next sentence after each definition (`about.verdictMore`): *Se aparece aqui, é a imagem real.* / *A imagem
  ainda não é pública, ou foi descartada por causa das nuvens.* / *Não temos como saber se realmente olhou.* / (none).
- Engine footnotes quote the group titles in quotation marks: *…por isso essa passagem fica em “Observou”*,
  *…essas passagens ficam em “Deve ter observado”* (§3.7).
- Timeline tooltip kinds (`results.timeline.markKind`): *arquivo aberto · ◇*, *comercial · □*, *radar · ▣*,
  *meteorológico · ○*, *com tripulação · ✛*, *outro*; marks *Mosaico diário, 375 m · ●*, *Imagem de radar, 20 m · ◆*.

### 3.6 Share headline, post, card and page

**Headline** (`card.headline`, `headlineBy`, `headlineWeek`; also the share page title). Each verdict is a whole
message; the accent holds the place and the words on its line; a closing full stop is its own part, dropped when the
place was cut (`cut`). The lead wraps to at most three short lines (*256 satélites observaram* is 24 characters).

| message | pt-BR | Example |
|---|---|---|
| headline(n ≥ 1) | `[f.plural(n, …'# satélites observaram'), accent(place, '.')]` | 7 satélites observaram *Waterloo.* |
| headlineWeek | same, accent `(place, ' esta semana.')`; 0 → *Nenhum satélite que rastreamos observou* | 7 satélites observaram *Waterloo esta semana.* |
| headlineBy.imaged | `{sat} observou` + accent(place) | Sentinel-2C observou *Waterloo.* |
| headlineBy.likely | `{sat} cobriu` + accent(place) | Sentinel-2C cobriu *Waterloo.* |
| headlineBy.could | `{sat} teve` + accent(place, ' ao alcance', '.') | WorldView Legion 4 teve *Waterloo ao alcance.* |
| headlineBy.overhead | `{sat} sobrevoou` + accent(place) | ISS (ZARYA) sobrevoou *Waterloo.* |
| nameless `sat` | *Um satélite observou / cobriu / teve … ao alcance / sobrevoou* | Um satélite cobriu *Waterloo.* |

In *could*, *ao alcance* sits on the place's line and is set in the serif with it (the card's contract); a cut place
reads *teve Rio Grande do… ao alcance* (no full stop).

**Post** (`share.post`; `when` → *no domingo, 1º de novembro, às 11:21, hora local*, §5):

| key | pt-BR |
|---|---|
| imaged | Sentinel-2C observou Waterloo a 786 km de altitude no domingo, 1º de novembro, às 11:21, hora local. 10 m por pixel; esta é a imagem real. (no pixel: *…hora local. Esta é a imagem real.*) |
| clouded | Sentinel-2C observou Waterloo a 786 km de altitude no domingo, 1º de novembro, às 11:21, hora local. Só viu nuvens. |
| likely | Sentinel-2C cobriu Waterloo a 795 km de altitude no domingo, 1º de novembro, às 11:21, hora local. O ponto ficou dentro da faixa da câmera. |
| could | WorldView Legion 4 teve Waterloo ao alcance no domingo, 1º de novembro, às 11:21, hora local. Pode ter apontado aqui. O operador não diz se apontou. |
| overhead | ISS (ZARYA) sobrevoou Waterloo a 420 km de altitude no domingo, 1º de novembro, às 21:03, hora local. |
| hookWatched | Algo observou você também esta semana. |
| hookPassed | O que passou sobre você esta semana? |
| credit | via @armaangupt0 |
| pngName / weekPngName | `watched-${sat}-${place}-${day}.png` / `watched-${place}-semana-${day}.png` |

*Também* after *você*: "you too", not "also watched". The post must stay inside its length limit; the existing rule
(drop the invitation, then cut the first paragraph) does the work: never shorten words to fit.

**Card fixed lines** (`card.*`; mono labels in sentence case, uppercased by the renderer):

| English | pt-BR |
|---|---|
| Clouded over. It saw only cloud. / chip *Clouded over · 92%* / post *It saw only cloud.* / desc *It saw only cloud (92%).* | Céu encoberto. Só viu nuvens. / *Encoberto · 92%* / *Só viu nuvens.* / *Só viu nuvens (92%).* |
| Mostly cloud: 81% of the scene. / chip / post / desc | Quase só nuvens: 81% da cena. / *Quase só nuvens · 81%* / *Viu quase só nuvens (81%).* / same |
| Cloud over the spot itself. / chip / post / desc | Nuvem sobre o próprio ponto. / *Nuvem sobre o ponto* / *Nuvens cobriam o ponto.* / same |
| stamp *Sun 1 Nov 2026 · 11:21 EST* | *dom 1 nov 2026 · 11:21 EST* (26) |
| weekTo *7 days to Sun 8 Nov 2026* / lastWeek | *7 dias até dom 8 nov 2026* / *Últimos 7 dias* |
| readouts Altitude · Elevation · Speed · Off-nadir · Pixel · Mosaic pixel · Closest | *Altitude* · *Elevação* · *Velocidade* · *Fora do nadir* · *Pixel* · *Pixel mosaico* · *Mais perto* |
| lane Photo · Likely · Could · Overhead | *Imagem* · *Provável* · *Possível* · *Sobrevoo* |
| geometry *Pass geometry · north up* | *Geometria · norte acima* |
| note: in app · unavailable · commercial · in swath · ground track | *Imagem abre no site* · *Imagem indisponível agora* · *Arquivo comercial, não público* · *Na faixa, sem imagem pública ainda* · *Traço no solo na máxima aproximação* |
| acquiring · noPublicPhoto · noPhoto | *Captando…* · *Nenhuma imagem pública esta semana* · *Nenhuma imagem para mostrar* |
| look: closest · lastClear · clouded · radar; lookDay | *Vista mais próxima* · *Última vista limpa* · *Encoberto* · *Radar*; *3 nov* |
| aSatellite (a chip label alone) | *Um satélite* |
| invite / enterAnyPlace | *Algo observou você também* / *Busque um lugar da Terra* |
| defaultPlace / defaultAlt | *Palm Jumeirah* / *Foto real do satélite Sentinel-2: Palm Jumeirah, Dubai, ao lado da frase: Algo observou você esta semana. Busque um lugar da Terra.* |
| decimal | `f.dec(n, digits)` (*7,46*) |

Measured at the card's 13 px mono: *Mais perto* 95 px and *Pixel mosaico* 123 px fit the 134 px a later readout column
leaves (*Distância mín.* 133 px and *Pixel do mosaico* 152 px do not, safely). The footer sets `enterAnyPlace` at
15 px beside `www.watched.earth` (152 px) in 466 px: *Busque um lugar da Terra* is 263 px (= English), *Busque
qualquer lugar da Terra* would be 328 px and overflow.

**Share page** (`card.page`, `crossed`, …): title *Algo observou você esta semana.*; `placeTitle` *Quais satélites
observaram {place} esta semana*; `question` *Quais satélites observaram você esta semana?*; `opening` `['Abrindo o ', accent('Watched')]`;
`crossed` *{sat} passou a 795 km de altitude sobre {place} às 11:21 EST, no domingo, 1º de novembro de 2026, rumo ao
sul.* (no altitude: *{sat} passou sobre {place}…*; nameless: *Um satélite passou…*); `withinView` *{sat} teve {place}
ao alcance às 11:21 EST, no domingo, 1º de novembro de 2026, rumo ao sul.*; `couldHave` *Pode ter apontado aqui. O
operador não diz se apontou.*; `straightDown` *Olhava direto para baixo.*; `offNadir` *Olhava 5,3° fora da vertical.*;
`cloudCover` *Cobertura de nuvens: 25%.*; `inSwath(place)` *A faixa da câmera cobriu {place}.*; `bestFrom` *A vista
mais próxima é do satélite {sat}.* / *A última vista limpa é do satélite {sat}.* / *A primeira imagem é do satélite
{sat}.* (nameless: *…é de um satélite.*); `cardAlt` *A imagem de compartilhamento, com a vista mais próxima da semana,
do satélite {sat}.* / *A imagem de compartilhamento.*

### 3.7 Other fixed lines

**Landing and search** (`landing`): kicker *Últimos 7 dias* (`windowRange` *1 → 8 nov 2026 UTC*, *29 out → 5 nov 2026
UTC*, *29 dez 2026 → 5 jan 2027 UTC*, built from `formatToParts`, never by editing `formatRange`'s *1 – 8 de nov. de
2026*); placeholder *Buscar um lugar*; label *Lugar*; *Buscando*, *Busca indisponível*, *3 resultados* / *1 resultado*,
*Nenhum resultado*; `searchHint` *Nome, endereço ou lat, lon*; `go` *Mostrar o que passou sobre este lugar*;
`searchDown` *A busca de lugares não está respondendo. Coordenadas como 43.47, -80.54 ainda funcionam.* (ASCII
hyphen-minus: the only form the field parses, §6); `nothingMatches` *Nenhum resultado para “{query}”. Tente uma cidade,
um ponto turístico ou coordenadas.*; *Usar meu local* / *Localizar* / *Perto de mim* / *Localizando…*;
*Cancelar*, *Cancelar localização*; *Obtendo a posição*, *Identificando o lugar*, elapsed *04 s*; `locatingNote` *A sua
posição vai para o geocodificador Photon para dar nome ao lugar. Guardamos apenas uma célula de cerca de 10 km.*;
label *Localização*; *Fechar*; *Ou experimente*; *Ou clique no globo para marcar um ponto*; *Lugares de exemplo*;
*Marcar ponto*; *Surpreenda-me* (aria *Surpreenda-me: um lugar famoso escolhido ao acaso*); *Feito por @armaangupt0*; *Código aberto* (aria
*Código aberto: o projeto no GitHub*).

`locateErrors`: denied *O acesso à localização está bloqueado. Permita o acesso nas configurações do navegador ou
busque um lugar.* · unavailable / other *A sua posição não está disponível agora. Busque um lugar.* · timeout
*Encontrar a sua posição demorou demais. Tente de novo ou busque um lugar.* · unsupported *Este navegador não
compartilha a localização. Busque um lugar.* · insecure *A localização precisa de uma conexão segura (https). Busque
um lugar.*

**Shared-link bar** (`results.invite`): *Algo observou você também esta semana.* · *Ver seu lugar* · *Fechar*.

**Fault notice** (`app`): label *Falha*; fallback *Ocorreu um erro.* (*Algo deu errado* would echo the hero's *Algo*
on the screen where the product failed); catalog *Não foi possível carregar o catálogo de órbitas. Verifique a
conexão e tente de novo.*; compute *Houve um erro ao calcular as passagens deste lugar. Tente de novo em instantes.*;
*Tentar de novo* / *Tentando…* / *Voltar*; progress *Carregando elementos orbitais*. Boot: loading *Carregando o
Watched*, slow *Conexão lenta, ainda carregando*, title as §3.1.

**Computing readout** (`engine.progress`, ≤ 40 characters): *Carregando catálogo orbital* · *Catálogo · 16.912
objetos* · *Calculando 412 órbitas · 7 dias* · *Calculando órbitas · 120 / 412* · *Consultando Sentinel-2 + Landsat* ·
*Associando 214 cenas a 38 passagens* · *Verificando mosaicos da NASA* · *Verificando mosaicos da NASA · 12 / 35* ·
*38 passagens · 27 imagens*. Stages (`results.computing.stages`): *Catálogo orbital* / *Catálogo carregado*; *Cálculo
das órbitas · 7 dias* / *Órbitas calculadas*; *Arquivos Sentinel-2 + Landsat* / *Arquivos consultados*; *Associação de
cenas e passagens* / *Cenas associadas*; *Relatório pronto*; *OK*; *1,84 s*; window `[strong('Janela de 7 dias · '),
'1 nov 05:47 → 8 nov 05:47 UTC']`; slow *O Planetary Computer e a NASA geram as imagens na hora; esta etapa pode
levar alguns segundos.*; verySlow *Os arquivos de imagens estão demorando a responder. Se não responderem, as
passagens aparecem mesmo assim, calculadas pela geometria orbital, e avisamos.*; header *Verificando mosaicos*.

**Engine footnotes** (`engine.note`): *Os arquivos do Sentinel-2 e do Landsat demoraram demais para responder; as
passagens aparecem só pela geometria orbital.* · *Não foi possível acessar os arquivos do Sentinel-2 e do Landsat; as
passagens aparecem só pela geometria orbital.* · *Sentinel-2 listado pelo Earth Search; algumas cenas aparecem como
miniatura da cena inteira, não como recorte.* · *Sentinel-2 listado pelo Earth Search (busca do Planetary Computer
indisponível).* · *Arquivo do Sentinel-2 inacessível; podem faltar imagens do Sentinel-2.* (Landsat the same) · *Este
ponto está fora do plano de aquisição do Sentinel-2 (oceano aberto).* · *Os elementos orbitais têm 4 dias, por isso os
horários das passagens podem errar por alguns minutos.* · *Estas passagens foram reconstruídas com elementos orbitais
mais recentes, por isso os horários podem errar por alguns minutos.* · gibsUnconfirmed *O NASA GIBS demorou para
confirmar 3 imagens VIIRS; o VIIRS capta o planeta inteiro todos os dias, por isso essas passagens ficam em
“Observou”.* (one: *1 imagem VIIRS… essa passagem fica…*) · *O NASA GIBS não respondeu a tempo, por isso as imagens
de satélites meteorológicos não aparecem.* · gibsSlowSome *O NASA GIBS não enviou a tempo 3 de 35 imagens de
satélites meteorológicos; essas passagens ficam em “Deve ter observado”.* (`missing` 1: *1 de 35 imagens…; essa
passagem fica…*) · *Não foi possível acessar o NASA GIBS, por isso as imagens de satélites meteorológicos não
aparecem.* · gibsDownSome *O NASA GIBS não retornou 3 de 35 imagens…* (as gibsSlowSome).

**Notes under pictures** (`passView`): fullDiscNote *Uma imagem de disco completo: tudo o que o satélite vê, em uma só
imagem, a 2 km por pixel aqui. Pouco detalhada, mas real, e a mais recente publicada; o satélite faz uma igual a cada
10 minutos, a semana inteira.* (1 min: *a cada minuto*; unknown: *a cada poucos minutos*) · mosaicNote *Um mosaico
diário: a NASA junta as faixas de cada dia em uma só imagem, a 375 m por pixel. Pouco detalhado, mas real, e do dia
desta passagem.* · radarNote *Uma imagem de radar, não uma fotografia: o Sentinel-1 emite micro-ondas e capta o eco,
por isso nuvens e escuridão não atrapalham. O brilho mostra quanto o solo devolve o sinal: prédios e terreno irregular
aparecem claros, água calma aparece escura.* "Coarse" is *pouco detalhada*, never *grosseira* (rude).

`noImage`: openArchive *O satélite {sat} não tem imagem deste ponto nesta passagem. Vista de cima da passagem.* ·
radarPrivate *Sem imagem pública: o arquivo deste operador de radar é privado. Vista de cima da passagem.* ·
commercialPrivate *Sem imagem pública: arquivos comerciais são privados. Vista de cima da passagem.* · noneToShow
*Nenhuma imagem para mostrar desta passagem. Vista de cima da passagem.* · archiveDown *Não foi possível consultar o
arquivo agora. Vista de cima da passagem.* · noScene *Não existe cena desta passagem. Vista de cima da passagem.* ·
notYet *Nenhuma cena publicada corresponde a esta passagem ainda. Cenas do Sentinel-2 e do Landsat costumam aparecer
em até um dia.* · crewed *Estações tripuladas levam câmeras, mas as fotos delas não são publicadas por lugar e
horário.* · unavailable *A imagem desta passagem não está disponível.*

`spot`: *Lendo o pixel do seu ponto…* · *Céu limpo sobre o seu ponto.* · *Cirros finos sobre o seu ponto; podem
suavizar a imagem.* · *Nuvem sobre o seu ponto.* · *O seu ponto estava na sombra de uma nuvem.*

**Time-lapse** (`timelapse`): dialog *Time-lapse: {place}*; title *Time-lapse*; date *22 out 2015*; dayMonth *22 out*;
readout *22 out 2015 · Sentinel-2A*; frameSpoken *Quadro 3 de 11: 22 de outubro de 2015*; captionYearly *12 vistas
limpas · uma por ano*; captionSeason *12 vistas limpas · uma a cada outono* (*inverno*, *primavera*, *verão*);
captionGathering *Uma vista limpa por ano · desde 2015*; captionShort *Sem time-lapse para este lugar*; captionError
*O arquivo não respondeu*; note *Cada quadro é o mesmo quadrado de 10 km, captado pelo Sentinel-2 e tratado como
todas as fotos daqui. Cada ano busca uma estação diferente; um ano sem vista limpa fica de fora.*; noteOneSeason
*…Todos os anos são da mesma estação; um ano sem vista limpa nessa estação fica de fora.*; source *Copernicus
Sentinel-2, via Planetary Computer*; steps *Consultando o arquivo* · *Escolhendo vistas limpas* · *Revelando quadros*
(aria *Escolhendo vistas limpas, 03 de 11*, *Revelando quadros, 03 de 11*); tooCloudy *Nuvens demais aqui para um
time-lapse.*; tooFew *Nenhuma vista limpa desde 2015 · 3 necessárias* / *1 vista limpa desde 2015 · 3 necessárias* /
*2 vistas limpas…*; noAnswer *O arquivo não respondeu.*; unreachable *Não foi possível acessar o Planetary Computer*;
*Tentar de novo*; *Compartilhar*; *Link copiado*; shareTitle *{place}, ano a ano*; *Vídeo* / *Gerando 42%* / *Falha
no vídeo* / *Salvar vídeo*; noH264 *Este navegador não tem codificador H.264: o vídeo toca no Chrome e no Firefox*;
fileNamePlace *lugar*.

---

## 4. Glossary

Gender: (m.) masculine, (f.) feminine. "Never" lists the wrong words translators reach for.

### 4.1 Core vocabulary

| English | pt-BR | Notes |
|---|---|---|
| satellite | satélite (m.) | *satélites*. Abbreviation *sat.* only in the pass list's count (invariable: *12 sat.*). |
| pass (noun) | passagem (f.) | *passagens*. Never *passe* (ticket, football pass), *passo* (step), *trânsito*. |
| to pass / cross | passar | *passou na vertical do local*, *passou sobre o local*. Geostationary: *não passa*. |
| overflight | sobrevoo (m.) | No circumflex. Verb *sobrevoar* (transitive: *sobrevoou Waterloo*). |
| to watch (product verb) | observar | *observou / observaram*. Echoes *observação da Terra*. Never *assistir*, *vigiar*, *espionar*, *fotografar*, *ver*, *olhar*, *monitorar*, *flagrar*. |
| swept over (likely verb) | cobrir | *cobriu Waterloo*, *a faixa cobriu este lugar*. Never *varrer* with a place. |
| passed within view (could) | estar / ter ao alcance | *esteve ao alcance*, *teve Waterloo ao alcance*. Never *passar ao alcance*. |
| to image (an instrument) | captar | *captou Waterloo a 20 m por pixel*. Not *registrar* (BR/PT split). |
| photo | foto (f.) | *fotos*. Only Sentinel-2 / Landsat true-colour pictures named as such, and the *Fotos* filter. Never for radar, mosaics or full-disc frames. |
| image | imagem (f.) | *imagens*. The default word for any picture, in every generic string (gallery, viewer, card, counts). |
| photograph (radar note) | fotografia (f.) | Only in *uma imagem de radar, não uma fotografia*. |
| public image | imagem pública | |
| to make public | publicar | *foram publicadas* (agrees with *imagem*, *cena*). |
| archive | arquivo (m.) | *os arquivos de imagens*. Never for a computer file (§1.4). |
| scene | cena (f.) | The archive's unit. Never *cenário*. |
| swath | faixa (f.) | *dentro da faixa de 290 km*. Never *trilha*, never *varredura*. |
| off-nadir | fora do nadir (label) / fora da vertical (prose) | One concept, these two forms only. |
| straight down | direto para baixo | *Olhava direto para baixo.* About term *Na vertical*. |
| directly overhead | na vertical do local | Never *logo acima* (reads "just above, in this text"). |
| field of regard | inclinação máx. | *Inclinação máx. ±45°*. Never *campo de visada* (field of view). |
| ground track | traço no solo (m.) | Never *pista*. |
| orbit | órbita (f.) | |
| altitude | altitude (f.) | *a 786 km de altitude*. |
| ground speed | velocidade no solo (f.) | Card *Velocidade*. |
| heading | rumo (m.) | *rumo ao sul*. Never *direção* in the readout, never *proa*. |
| elevation (angle) | elevação (f.) | *Elevação no seu céu*; *[62°] acima do seu horizonte*. |
| ground distance | distância no solo (f.) | |
| closest (distance, readout) | mais perto | Card readout, pass list prefix, replay tick, plan *Mais perto 61 km*. |
| closest approach (moment) | máxima aproximação (f.) | *Máxima aproximação · Sentinel-2C* (globe); geometry *Mais perto · UTC*. |
| cloud cover | cobertura de nuvens (f.) | Label *Nuvens*. Never *nebulosidade* in lay copy. |
| clouded over | encoberto | Chip *Encoberto · 92%*; card sub *Céu encoberto.*; status *Nublado · 92%*. |
| clear (at the spot) | limpo / céu limpo | *Céu limpo sobre o seu ponto.* Value *Limpo*. |
| thin cirrus | cirros finos | Value *Cirros*. |
| cloud shadow | sombra de nuvem | Value and status *Sombra*. |
| pixel | pixel (m.) | *pixels* (not *píxeis*). *10 m por pixel*. |
| resolution | resolução (f.) | Only when it is resolution. A pixel size is labelled *Pixel*, never *Resolução*. |
| mosaic pixel (card) | pixel mosaico | |
| radar | radar (m.) | *radares*. *imagem de radar*, never *foto de radar*. |
| weather mosaic / daily mosaic | mosaico meteorológico / mosaico diário (m.) | |
| weather (filter) | Meteo | A clipped form, no period, like *foto*. Never *Clima* (climate) or *Tempo* (reads "time"). |
| geostationary | geoestacionário/a | Agrees with its noun. |
| full disc | disco completo (m.) | *imagem de disco completo*; value *Disco completo*. |
| scan / to scan | varredura (f.) / varrer | *esta varredura*, *linha de varredura*; *varre toda a face da Terra*. |
| infrared | infravermelho | Noun (m.) and adjective. Chip and band value **IR** (never *IV*: *Banda IV* reads "band 4"). |
| visible / colour (band values) | Visível / Em cores | |
| true colour | cores naturais | *mosaico diário em cores naturais*. Never *cor real*. |
| coarse | pouco detalhado/a | Never *grosseiro* (rude). |
| time-lapse | time-lapse (m.) | *o time-lapse*, invariable. Never *lapso de tempo*. |
| frame | quadro (m.) | *Quadro 3 de 11*. Never *frame*, *moldura*. |
| to develop (a picture) | revelar | *Revelando quadros*. |
| replay | Rever | Never *Repetir*, *Reproduzir*, *Reprise*. |
| play / pause | Reproduzir / Pausar | |
| closest look / last clear look / clear look | vista mais próxima / última vista limpa / vista limpa (f.) | *12 vistas limpas · uma por ano*. |
| clearest look | vista mais limpa | *Ver vista mais limpa*. |
| plan view | vista de cima | Corner *Vista de cima · norte acima*. |
| geometry | geometria (f.) | *01 / Geometria*. |
| catalog / orbit catalog | catálogo / catálogo de órbitas (m.) | |
| orbital elements, element sets, TLE | elementos orbitais, conjuntos de elementos, TLE | *TLE* never expanded. |
| objects (catalog) | objetos (m.) | *16.893 objetos*. |
| to track | rastrear | Satellites as object only. |
| sub-solar point | ponto subsolar (m.) | HUD *Sol 16.2°S 063.0°E*. |
| Sun / Earth / Moon | sol / Terra / Lua | *Terra* always capitalised (the planet). *sol* lowercase in prose (*o sol nasceu*, *luz do sol*, *Elevação do sol*). |
| equator | equador (m.) | Lowercase; *Equador* is the country. |
| daylight / in daylight | luz do dia / durante o dia | *Era dia.* |
| day / twilight / night | dia / crepúsculo / noite | Units after the sun's elevation. |
| steerable / fixed / tilting camera | câmera orientável / fixa / que se inclina | |
| in swath / in view | na faixa / ao alcance | |
| window (time) | janela (f.) | |
| coverage | cobertura (f.) | |
| scan direction | sentido da varredura | *Norte → sul*, *Sul → norte*. |
| ascending / descending | Asc. / Desc. | With the period (Portuguese abbreviations). |
| operator / private operator | operador / operador privado (m.) | Never *operadora* (telecoms). |
| commercial | comercial | |
| crewed | tripulado/a; com tripulação | *estações tripuladas*; tooltip kind *com tripulação* (no agreement). |
| station | estação (f.) | *a estação*; *estações espaciais* when alone. |
| weather satellite | satélite meteorológico | |
| open imaging satellite | satélite com imagens públicas | |
| imaging satellite | satélite de observação | |
| spy satellite | satélite de espionagem | Factual category. |
| sensor / imager | sensor (m.) | *O sensor VIIRS*. Never *imageador*. |
| panchromatic / multispectral | pancromático / multiespectral | |
| place | lugar (m.) | *este lugar*, *o lugar pesquisado*. |
| spot | ponto (m.) | *o seu ponto*; labels *ponto*. |
| the place (referring back) | o local (m.) | *passou sobre o local*. |
| share card | imagem de compartilhamento | Never *cartão*, never *card*. |
| the brand in a sentence | o Watched (m.) | Never translated or glossed. *Abrindo o Watched*, `hud.home` *Watched, início*. |

### 4.2 Actions, navigation and short UI

| English | pt-BR | Notes |
|---|---|---|
| Share | Compartilhar | Never *Partilhar*, *Enviar*. |
| Share this pass / image / week | Compartilhar esta passagem / esta imagem / esta semana | Lightbox *Share this photo* → *Compartilhar esta imagem*. |
| Share image / Preparing image… | Compartilhar imagem / Preparando imagem… | |
| Copy link / Copy image / Copied | Copiar link / Copiar PNG / Copiado | One `copied` key for both: *Copiado* (generic confirmation). *Copiar imagem* (13) overflowed its third of the row on a 390 px phone; *Copiar PNG* (10) is as long as *Copy image*, names what is copied and pairs with *Salvar PNG*. |
| Post to X | Postar no X | X's own pt-BR verb. |
| Save PNG / Try again | Salvar PNG / Tentar de novo | |
| Link / Post (48 px labels) | Link / Texto | |
| Creating link… / Made when you share | Criando link… / Criado ao compartilhar | |
| Direct link tooltip | Link direto: não foi possível criar o link curto agora | |
| Render failed | Não foi possível gerar a imagem aqui; o link continua funcionando. | |
| Download image / Downloading… / Open image to save it | Baixar imagem / Baixando… / Abrir imagem para salvar | |
| View source · {archive} | Ver na fonte · {archive} | |
| Link copied | Link copiado | |
| Search a place / Search another place | Buscar um lugar / Buscar outro lugar | Inside sentences: *Busque um lugar*. |
| Change / New search / Cancel / Close / Back / Dismiss | Trocar / Nova busca / Cancelar / Fechar / Voltar / Fechar | |
| Recent | Recentes | |
| All passes / Previous / Next pass of this kind | Todas as passagens / Passagem anterior deste tipo / Próxima passagem deste tipo | aria *Passagem 3 de 31 deste tipo*. |
| Use my location / Locate me / Near me / Locating… | Usar meu local / Localizar / Perto de mim / Localizando… | *Usar minha localização* (22) squeezed the field beside it until *Buscar um lugar* was cut to *Buscar um lug…* at 1280 px and *Buscar um l…* at 1024 px; *Usar meu local* (14, Google's and Apple's *local*) leaves the placeholder whole. |
| Surprise me / Or try | Surpreenda-me / Ou experimente | Never *Ou tente* (implies difficulty). |
| Drop a pin / Dropped pin | Marcar ponto / Ponto marcado | Never *soltar um alfinete*. |
| Pin card: naming / no name / move hint | Identificando o local / Sem nome por perto / Segure o globo para mover o ponto | 156 px; 320 px phone. |
| Pin spoken | Ponto marcado em 43.4723°N 80.5449°W. / Ponto marcado: {place}. Pressione Enter ou a seta para ver o que passou sobre ele. | *ele* = *ponto*. |
| Search here (Enter) / Remove the pin (Esc) | Buscar aqui (Enter) / Remover o ponto (Esc) | |
| 3D view unavailable / WebGL 2 is off in this browser | Visualização 3D indisponível / WebGL 2 desativado neste navegador | The reason is a nowrap mono line: the nominal form (269 px at 11 px) matches the title's and fits a 320 px phone; the full sentence (324 px) does not. Checked on screen. |
| How this works | Como funciona | About title `[['Como'], [accent('funciona'), '.']]`. |
| About sections | Em resumo · Como achamos as passagens · O significado dos rótulos · O que não conseguimos ver · Privacidade · Créditos · Teclado | The index is 233 px at its narrowest and an entry must not wrap: *Como encontramos as passagens* (252 px) and *O que os rótulos significam* (236 px) did; the shipped two are ≤ 25 characters. The body headings use the same words. |
| Previous / Next photo; tooltips | Imagem anterior / Próxima imagem; *Anterior (←)* / *Próxima (→)* | Arrows kept. |
| Photos (gallery bar) / Show photos | Imagens / Mostrar imagens | |
| Filter: All / Detailed / Weather / Radar | **Todas / Fotos / Meteo / Radar** | ≤ 8 each. *Fotos* holds only Sentinel-2 and Landsat; *Meteo* holds mosaics and full-disc frames. |
| Filter tooltips | *Todas as imagens: a vista mais próxima, depois as mais recentes* · *Sentinel-2 e Landsat, 10–30 m por pixel* · *Mosaicos meteorológicos diários e imagens de disco completo, pixels de 250 m ou maiores* · *Imagens de radar do Sentinel-1, 20 m por pixel: através das nuvens, de dia ou de noite* | |
| 27 this week / that week | 27 na semana (both) | ≤ 12; true for either week. |
| carousel / slide | carrossel / slide | aria-roledescription. |
| Replay this pass | `['Rever', strong(' esta passagem')]` | |
| View / Expand the photo / Expand (F) | Ver / Ampliar a imagem / Ampliar (F) | |
| Zoom in / out | Aumentar zoom (+) / Diminuir zoom (−) | |
| Close the photo viewer | Fechar o visualizador | |
| Acquiring / No image returned / Retry | Captando / Nenhuma imagem recebida / Recarregar | Photo retry reloads the picture. |
| Still rendering… | Ainda gerando. Cenas grandes podem levar 10 s ou mais. | |
| Line 0412 → 1024 | `['Linha ', strong(line), ` → ${lines}`]` | |
| Awaiting pass / scan | Aguardando a passagem / Aguardando a varredura | |
| Show all 40 satellites / rows; Show 40 more; 12 left; Show fewer | Mostrar todos os 40 satélites / itens; Mostrar mais 40; 12 restantes (1 restante); Mostrar menos | *itens*, not *linhas* (a list row is not a scan line). |
| Latest / Closest (row prefixes) | Última / Mais perto | Keep the trailing space. |
| Cloud (56 px chip) | Nuvem | |
| Probing… / No public image / Poor quality / No image just now / Frame unavailable | Verificando… / Sem imagem pública / Qualidade baixa / Sem imagem no momento / Quadro indisponível | |
| Report ready / Computing / Computing passes | Relatório pronto / Calculando / Calculando passagens | |
| Watched continuously (section) | Observação contínua | A noun: no agreement. |
| Check your place / See the clearest look | `[strong('Ver '), 'seu lugar']` / `[strong('Ver '), 'vista mais limpa']` | Read alone: *Seu lugar*, *Vista mais limpa*. |
| Daylight here / Now | Dia aqui / Agora | Timeline. |
| Keys | *Enter*, *Espaço*, *Esc*; *reproduzir / pausar*; *anterior / próxima do mesmo tipo* | The replay hint row is one nowrap line after the ← → caps: *passagem anterior / próxima deste tipo* (38) was cut at the panel's edge; the feminine *próxima* already says *passagem*. |
| Language / trigger | Idioma / *Idioma: Português. Alterar* | |
| Expand / Collapse panel | Expandir painel / Recolher painel | |
| Fault label | Falha | |

### 4.3 Time, units and direction

| English | pt-BR | Notes |
|---|---|---|
| last 7 days | últimos 7 dias | Kicker *Últimos 7 dias · 1 → 8 nov 2026 UTC*. |
| this week / that week | esta semana / naquela semana | Never *essa semana* in writing. |
| local time | hora local | *às 11:21, hora local*. |
| UTC, EST, CET, UTC+9 | unchanged | Never *TUC*, *GMT*, *BRT* swapped in. |
| just now | agora | |
| 12 min ago / 41 h ago / 3 days ago | há 12 min / há 41 h / há 3 dias | Never *atrás*. Days always spelled. |
| in 3 h | daqui a 3 h | Not Intl's *em 3 h*. |
| spoken | há 12 minutos / há 1 hora / há 41 horas / daqui a 3 horas | |
| HUD age | há <1 min / há 42 min / há 5 h / há 3 d; *Desatualizado, há 3 d* | *Obtido em 2026-11-08 03:34Z*. |
| durations | 38 s / 4 min 12 s / 1 h 02 min | U+00A0 between number and unit. |
| every 10 minutes | a cada 10 minutos | Unit *a cada 10 min*. |
| at sea | *UTC−9 · no mar* | |
| since 2015 | desde 2015 | Years never grouped. |
| one a year / one each autumn | uma por ano / uma a cada outono | *uma* agrees with *vista*. |
| km, m, km/s, % , ° | km, m, km/s, %, ° | Space before units; `%` and `°` attached. |
| up (degrees above horizon) | acima | *62° acima · SSO*. |
| 8 compass words | norte, nordeste, leste, sudeste, sul, sudoeste, oeste, noroeste | Lowercase. *Leste* in prose (*este* collides with "this"). |
| moving {dir} (heading table) | rumo ao norte · rumo ao nordeste · rumo ao leste · rumo ao sudeste · rumo ao sul · rumo ao sudoeste · rumo ao oeste · rumo ao noroeste | |
| {km} to the {dir} (offset/toward table) | ao norte · a nordeste · a leste · a sudeste · ao sul · a sudoeste · a oeste · a noroeste | |
| 16-point readouts | N, NNE, NE, ENE, E, ESE, SE, SSE, S, SSO, SO, OSO, O, ONO, NO, NNO | *NO* is noroeste. |
| north up | norte acima | |
| seasons | primavera (f.), verão (m.), outono (m.), inverno (m.) | Lowercase; the place's own season (§8). |

---

## 5. Grammar strategies for runtime slots

### [PLACE]: no inflection, no article, no contracting preposition, never a subject

Portuguese contracts the prepositions *de, em, a, por* with the article a place name takes (*do Rio*, *no Cairo*, *ao
Porto*, *pelo Recife*; but *em São Paulo*, *de Lisboa*). Code cannot know which, the name may be English (*Pacific
Ocean*) or in another script, and it may be plural (*Estados Unidos*, *Filipinas*, *Países Baixos*). So:

1. **[PLACE] is a direct object** (*observaram Waterloo*, *cobriu Waterloo*, *cruzou Paris*, *teve Waterloo ao
   alcance*), **follows a colon** (*Time-lapse: Waterloo*, *Ponto marcado: Waterloo*), opens a label (*{place}, ano a
   ano*), or **follows a non-contracting preposition**: *sobre*, *para*, *até*, *com*, *sem*, *entre* (*O que passou
   sobre Waterloo*). Brazilian headline style drops articles (*Chuva atinge Rio de Janeiro*), so *observaram Rio
   Grande do Sul* reads as a headline, not an error: this is the accepted compromise for names that take an article
   (Brazilian states, *Estados Unidos*); never "fix" it with an article in one string.
2. **Never after *de, em, a, por*** or their contractions.
3. **Never a subject** (*Estados Unidos estava…* needs *estavam*; code cannot know), and so never capitalised by code.
4. **Never a word that agrees with it** (*Waterloo foi observada*, *a bela Lisboa*).
5. **Refer back with a fixed noun**: *o local*, *este lugar*, *este ponto*. Never a pronoun for the slot.

| English frame | ✗ | ✓ |
|---|---|---|
| …watched Waterloo. | …observaram o Waterloo. | …observaram Waterloo. |
| Time-lapse of Waterloo | Time-lapse de Waterloo (→ *de Rio de Janeiro*) | Time-lapse: Waterloo |
| Share this week at Waterloo | Compartilhar esta semana em Waterloo | Compartilhar esta semana: Waterloo |
| This scan’s line reached Paris | …chegou a Paris (→ *a Cairo*) | …cruzou Paris |
| passed within view of Waterloo | passou perto de Waterloo | teve Waterloo ao alcance |
| crossed it 3 times | …cruzou-o 3 vezes | …passou sobre o local 3 vezes |
| Waterloo was inside its swath | Waterloo estava dentro da faixa | A faixa de 24 km cobriu Waterloo. |
| {sat} image of {place}. The place is at the centre. | Imagem de Waterloo feita pelo… | Imagem do satélite Sentinel-2C: Waterloo. O lugar está no centro. |
| Satellites over {place} | — | Satélites sobre Waterloo |
| Search another place (now {place}) | — | Buscar outro lugar (agora: Waterloo) |
| closest to {place} | mais perto de Waterloo | mais perto do lugar pesquisado |

Names that start a sentence (the overhead `[SAT]`) arrive capitalised; never run code that capitalises a Portuguese
sentence over a slot.

### [SAT]: no gender known

Satellites are masculine, stations feminine (*a ISS*, *a Tiangong*), and code cannot tell.

1. **In the imaged, likely and could pass sentences and in `geo.sits`: *O satélite {sat}*** as the first subject;
   null subject after. Those messages never hold a station (`verdictFor`). The same noun makes a contracting
   preposition safe: *do satélite {sat}* (gallery alt text, `bestFrom`, `noImage.openArchive`, `sharedAlt`).
2. **Bare elsewhere**: headlines, the card, the post, the share page, `overhead`, chips, row labels (*Sentinel-2C
   observou Waterloo.*, *ISS (ZARYA) passou…*). Static text naming a known craft may use its article (*o Sentinel-2*,
   *a ISS*).
3. **Never after *de, em, a, por*** unless *satélite* comes first; otherwise a colon (*Traço no solo: ISS (ZARYA)*).
4. **No pronoun after it** (*Ele / Ela / O mesmo*): the next sentence starts with the verb (*Olhava…*).
5. **No gendered predicate**: no participle with *ser/estar*, no adjective. Use active verbs, compound tenses with *ter*
   (*pode ter observado*), or a gerund phrase (*Apontando 12,3° fora da vertical, …*).
6. **No *seu / sua* for its things**: the article (*a faixa*, *o operador*, *o radar*, *o sensor VIIRS*) or *deste
   satélite* where no station can occur.
7. **Nameless** (`sat` undefined): each sentence writes *um satélite* in the form it needs (*Um satélite observou…*,
   *…é de um satélite.*, *Imagem de satélite compartilhada com você: Waterloo.*); `card.aSatellite` *Um satélite*.

### [NUM] and plural categories

`Intl.PluralRules('pt-BR')` (verified):

| Category | Which numbers | Note |
|---|---|---|
| `one` | 0, 1, and every decimal below 2 (0,5; 1,5) | **0 is `one`**: `f.plural(0, …)` returns the `one` form. |
| `many` | exact millions (1.000.000, 2.000.000) | Matters only for spelled *milhão de*. With digits give it the `other` text. |
| `other` | everything else (2, 5, 21, 1.715) | |

(`pt-PT` puts 0 and decimals in `other`; Portugal gets the pt-BR rules, and the zero branches make that invisible.)

`fmt('pt-BR').plural` takes CLDR categories only; there is no `=0`. Every count that can be 0 tests for it in code:

```ts
count: (n: number) => (n === 0 ? '0 passagens' : f.plural(n, { one: `${f.int(n)} passagem`, many: `${f.int(n)} passagens`, other: `${f.int(n)} passagens` })),
```

- Zero usually gets its own sentence (*Nenhuma imagem foi publicada…*); a count label at 0 takes the plural noun.
- **Always write `many`** (the type requires it) with the `other` text.
- **Verbs and participles agree in number** and live inside the plural: *1 satélite observou / 256 satélites
  observaram*; *1 imagem foi publicada / 31 imagens foram publicadas*; *1 vista limpa… 3 necessárias*.
- **Units never pluralise**: *1,5 km*, *10 m*, *25%*.
- Decimal counts are not used; if one appears, `one` covers *1,5 hora*, which is correct Portuguese.

| Noun | `one` | `other` / `many` / 0 |
|---|---|---|
| satellite (+ verb) | 1 satélite observou | 256 satélites observaram |
| image (+ verb) | 1 imagem foi publicada | 31 imagens foram publicadas |
| pass | 1 passagem | 31 passagens |
| time (occurrence) | 1 vez (*uma vez* in plain prose) | 3 vezes |
| clear look | 1 vista limpa | 12 vistas limpas |
| frame / object / result / item | 1 quadro / objeto / resultado / item | quadros / objetos / resultados / itens |
| day / hour / minute | 1 dia / hora / minuto | dias / horas / minutos |
| mosaic | 1 mosaico meteorológico diário | mosaicos meteorológicos diários |
| radar satellite | mais 1 satélite de radar | mais 7 satélites de radar |
| remaining | 1 restante | 12 restantes |
| sat (pass list) | 12 sat. | invariable |

### Lists of names

- `f.list` (`Intl.ListFormat('pt-BR', { type: 'conjunction' })`): *Umbra e Capella*, *Umbra, Capella e mais 7
  satélites de radar*. No comma before *e*. Disjunction where English has *or*: *Sentinel-2 ou Landsat*.
- The verb after a list agrees with the **total**: one name alone *esteve*; anything more *estiveram*.
- Names in a list get no articles. `results.timeline.geoNames` joins with *, * as English.

### Dates and times inside sentences

- **Clock times:** the clock arrives as text (*16:14:21*). *à* when it starts `00` or `01`, else *às*: `const as =
  Number(clock.slice(0, 2)) <= 1 ? 'à' : 'às'` (and *por volta da / das*). Never hard-coded *às*, never tied to plural
  rules.
- **A day in prose:** long forms from Intl (`{ weekday: 'long', day: 'numeric', month: 'long' }` → *domingo, 1 de
  novembro*), with the first of the month written **1º** (U+00BA: `day === 1 ? '1º' : String(day)`, from
  `formatToParts`). The weekday sets the preposition: *no* for *domingo* and *sábado*, *na* for the others: `const
  em = /^(domingo|sábado)/.test(weekday) ? 'no' : 'na'`. Post: *no domingo, 1º de novembro, às 11:21, hora local*;
  share page: *às 11:21 EST, na sexta-feira, 6 de novembro de 2026*.
- **Ranges in prose:** *Entre 29 de outubro e 5 de novembro*; mono ranges keep the arrow (*1 → 8 nov*, *29 out → 5
  nov*).
- **Durations:** *38 s*, *4 min 12 s*, *1 h 02 min*.
- **Relative:** from `relativeParts(ms, now)` with pt-BR's own templates and plurals: compact *há 12 min*, *há 41 h*,
  *há 3 dias*, *daqui a 3 h*, *agora*; spoken *há 12 minutos*, *há 41 horas*, *daqui a 3 horas*. Not
  `relativeFormat('pt-BR', 'short')`, which prints *há 12 min.* with a period and *em 3 h*.
- **Years and sequences:** *desde 2015*, *Quadro 3 de 11: 2018*.

---

## 6. Typography and formatting

**Quotation marks.** “ ” (U+201C/201D), ‘ ’ inside. Never « » (Portuguese tradition, foreign in Brazil), never straight
quotes. Punctuation outside unless it belongs to the quote: *chamamos de “pode ter apontado aqui”.*

**Apostrophe.** Portuguese almost never needs one; when it does, ’ (U+2019). English's (*doesn’t*, *NASA’s*) disappear:
*da NASA*.

**Ellipsis.** One character … (U+2026), attached: *Carregando…*. A place cut short ends on … with no full stop.

**Dashes and signs.** No em dash (—) in copy: comma, colon or parentheses. En dash (–) only for ranges, no spaces:
*10–30 m*, *2015–2026*. Minus sign (−, U+2212) in readouts as English: *UTC−3*, *T−00:42*; but the example
coordinates in copy use the ASCII hyphen-minus (below). Hyphen for compounds and enclisis: *sexta-feira*,
*Surpreenda-me*, *micro-ondas*, *Sentinel-2C*.

**Spaces.** No space before `: ; ! ? %`. A space either side of ` · `. In strings you type, U+00A0 between a number
and its unit (*7 dias*, *4 min*); `num()` parts are spaced by the renderer. Never U+202F or U+2011: the shipped
card fonts have neither (cmap checked), so they would draw fallback glyphs.

**Numbers.** Always through `f.int` / `f.dec` (`Intl.NumberFormat('pt-BR')`), never typed into a template:
- Decimal comma, thousands dot from 4 digits: *7,46*, *1.715*, *12.847*, *35.778 km*, *1.234.567,5*.
- Percent attached: *25%*. Degree attached: *98,6°*, *5,3°*, *±45°* (never `Intl` unit style, which prints *98,6 °*).
- Never U+00BA (º, next to the bracket on Brazilian keyboards) for degrees: *98,6º* is wrong. º is only the ordinal
  of the first of the month (*1º de novembro*). Search every file for `º` before review.
- **The `sats` blurbs** are the one place numbers are typed into text: type pt-BR forms (*3.040 km*, *2.330 km*,
  *1,1 km*, *0,5 m*, space before the unit). Blurbs are static per satellite, so articles and agreement are allowed:
  *O antigo GOES-East, mantido em órbita como reserva.*, *O sensor MODIS observa o planeta inteiro, 2.330 km por vez,
  desde 1999.*

**Coordinates are not copy.** Code writes them in international notation in every language: point decimals and N S E
W (`43.47°N 80.54°W`, `Sol 16.2°S 063.0°E`, *em 0.2°W*), as Google Maps shows them in Brazil. Translators never
reformat them, and example coordinates in copy are typed in that notation with an ASCII hyphen-minus, because that is
what `parseCoordinates` accepts today: *Coordenadas como 43.47, -80.54 ainda funcionam.* The mix on one screen
(*7,46 km/s* beside *80.54°W*) is accepted: a coordinate is a notation, like a clock. *O* for *oeste* is for compass
words and the 16-point readouts only.

**Dates.** All from `formatDate` / `dateFormat(…).formatToParts` (`api/_lib/i18n/dates.ts`), never a hand-made month
table; lowercase. Intl's short parts end in a period (*dom.*, *nov.*, *set.*): strip it in mono.
- Mono (rows, captions, stamps, timeline, HUD; uppercased by CSS): *dom 1 nov*, with year *dom 1 nov 2026*, day and
  month *29 out*, time-lapse *22 out 2015*. No period, no *de*, no º.
- Timeline compact (~5 characters): *dom 1*, *seg 2*, *qua 4*, *sáb 7*. Short weekday alone: *dom*. Never the narrow
  letters (*D S T Q Q S S*) and never two letters (*se* is both segunda and sexta).
- Spoken and prose: *sexta-feira, 6 de novembro*, *domingo, 1º de novembro*, with year *1º de novembro de 2026*.
- ISO stamps stay ISO: *2026-11-08 03:31:07 UTC*, *2026-11-08 03:34Z*.

**Time.** 24-hour, colons, leading zero as English: *16:14:21*, *07:49*. Never *16h14*, never AM/PM. Zones stay as the
code writes them (*UTC*, *EST*, *UTC−3*), never Intl's pt-BR names (*BRT*), which would differ from the cards.

**Capitalisation.** Sentence case everywhere (*Como encontramos as passagens*, never Title Case). Lowercase: months,
weekdays, seasons, compass words, languages, *equador*, *sol* in prose. Capitalised: *Terra*, *Lua*, programme,
product and agency names.

**Uppercase mono labels.** CSS (or the card's `toLocaleUpperCase`) uppercases them; accents stay on capitals:
*ÚLTIMOS 7 DIAS*, *ELEVAÇÃO*, *PROVÁVEL*. Store every label in sentence case, never in capitals. The page carries
`lang="pt-BR"`. Never uppercased: *Watched.*, URLs, the *@handle*, units inside prose. Abbreviations keep their period
in caps (*MÁX.*, *ASC.*).

**Line breaking.** The hero and the About title break where the parts say. Never break inside a number + unit or
*às* + time (U+00A0 in typed strings); names that must not break at their hyphen (*Sentinel-2C*, *time-lapse*) are
`white-space: nowrap` spans in code, never typed U+2011. No automatic hyphenation (`hyphens: manual`).

**Abbreviations.** Portuguese abbreviations take a period (*máx.*, *mín.*, *aprox.*, *asc.*, *desc.*, *sat.*); SI
symbols never do (*km*, *min*, *h*, *s*, *d*); clipped words never do (*foto*, *Meteo*). Abbreviations only in mono
labels and readouts, never in prose. Never invent an acronym; *IR* is the one international abbreviation used (chip
and band value).

---

## 7. Length discipline

Portuguese sentences run **about 10–25% longer** than English (sub line +9%, archive outage +23%, zero headline
+24%); some run shorter (*Sobrevoou* −40%). **Short labels can double** (*Share* → *Compartilhar*). Plan for +20% on
sentences and +30% on labels.

Strategies, in this order:
1. **Drop articles and possessives in labels:** *Usar meu local*, *Baixar imagem*, *Ver seu lugar*.
2. **Nouns over clauses:** *Mais perto* over *Distância mais próxima*; *Sem imagem pública* over *Não há imagem
   pública*.
3. **Use the long/short pairs the UI already has**, each its own string, never one cut by CSS.
4. **Standard abbreviations in mono only** (*máx.*, *asc.*), SI symbols for units.
5. **Strong parts that hide** on narrow layouts must leave a readable label (*Compartilhar* / *Compartilhar esta
   passagem*; *Seu lugar* / *Ver seu lugar*).
6. **Never** cut a word with an ellipsis, drop accents, invent an acronym, or switch to English.

Budgets from the catalogs and the measured card (pt-BR value in brackets):

| Where | Budget | pt-BR |
|---|---|---|
| Gallery filter segments | ≤ ~8 characters | *Todas* · *Fotos* · *Meteo* · *Radar* (5) |
| Gallery lead chip | ≤ ~20 | *Vista mais próxima* (18), *Última vista limpa* (18) |
| Gallery counter (last clear look) | ~12 | *27 na semana* (12) |
| Gallery status | ≤ ~14 | *Nublado · 92%* (13), *Nuvem no ponto* (14), *Cirros finos* (12), *Sombra* (6), *Nuvens 25%*, *Mosaico diário* (14) |
| Strip band value | ≤ ~9 | *IR* · *Visível* · *Em cores* |
| Strip spot value | ≤ ~7 | *Limpo* · *Cirros* · *Nuvem* · *Sombra* |
| Strip labels (wrap at spaces) | 2 lines | *Fora do nadir*, *Nuvem no ponto* wrap like English *Cloud at spot* |
| Timeline lane / card lane | ~8 | *Imagem* · *Provável* · *Possível* · *Sobrevoo* (≤ 8) |
| Timeline compact day | ~5 | *dom 1*, *sáb 7* |
| Share buttons (three on a 360 px phone) | ~12 | *Copiar link* (11), *Postar no X* (11), *Salvar PNG* (10), *Tentar de novo* (14) |
| Link / Post labels (48 px) | ~5 | *Link*, *Texto* |
| Computing rows | ≤ 40 | longest *Verificando mosaicos da NASA · 12 / 35* (38) |
| Results header (verifying) | as *windowSpan* | *Verificando mosaicos* (20) |
| Time-lapse waiting rows (~280 px) | short | *Consultando o arquivo* (21), *Escolhendo vistas limpas* (24) |
| Time-lapse video button (132 px) | as English | *Vídeo*, *Gerando 42%*, *Falha no vídeo*, *Salvar vídeo* |
| Pin card (156 px sans 13 px) | whole | *Sem nome por perto* (18) |
| Pin move hint (320 px phone) | one line | *Segure o globo para mover o ponto* (33; English 34) |
| Card hero (466 px at 88 px) | 3 lines | *observou* **você** 444 px |
| Card later readout column (13 px mono) | 134 px | *Mais perto* 95, *Pixel mosaico* 123, *Fora do nadir* 123, *Velocidade* 95 |
| Card footer, 15 px mono + host 152 px | 466 px | *Busque um lugar da Terra* 263 px |
| Card stamp | ~26 | *dom 1 nov 2026 · 11:21 EST* (26) |

| English (mono caps) | pt-BR | Chars | Tight fallback |
|---|---|---|---|
| SURPRISE ME | SURPREENDA-ME | 11 → 13 | — |
| USE MY LOCATION | USAR MINHA LOCALIZAÇÃO | 15 → 22 | LOCALIZAR; chip PERTO DE MIM |
| HOW THIS WORKS | COMO FUNCIONA | 14 → 13 | — |
| LAST 7 DAYS | ÚLTIMOS 7 DIAS | 11 → 14 | — |
| CLOSEST LOOK | VISTA MAIS PRÓXIMA | 12 → 18 | — |
| OFF-NADIR | FORA DO NADIR | 9 → 13 | wraps in the strip |
| GROUND SPEED | VELOCIDADE NO SOLO | 12 → 18 | card: VELOCIDADE |
| PASSES | PASSAGENS | 6 → 9 | — |
| SHARE | COMPARTILHAR | 5 → 12 | glyph only where the UI allows, aria kept |
| REPLAY | REVER | 6 → 5 | — |

Verdict titles stay within 23 characters, English's longest (*Could have pointed here*): the results summary's tiles set
them in one mono caps line, and a longer title wraps and pushes the last row under the fold (the right-hand tile holds
about 20). *Observou* 8, *Deve ter observado* 18, *Pode ter apontado aqui* 22, *Sobrevoou* 9. Tooltips may wrap.

---

## 8. Sensitive content

**Surveillance and privacy.** The product is about being seen, and the English never dramatises it.
- Product verb *observar* only. Never *vigiar*, *espionar*, *monitorar você*, *rastrear você*, *de olho em você*,
  *Big Brother*, *invasão de privacidade*. *Satélites militares e de espionagem* is allowed where English says
  "military and spy satellites": a factual category.
- Privacy statements are exactly as strong as the English: *nunca* only where English says "never", *apenas / só*
  where it says "only", no added reassurance (*Seus dados estão 100% seguros*). `about.privacy.kept`: *Contamos buscas
  por cidade e por uma área aproximada de 10 km, nunca o seu ponto exato, e mantemos uma contagem do que é aberto e
  compartilhado. Nada de endereços IP, nenhum cookie nosso, nada que ligue uma visita à seguinte.* `others`: *A maioria
  dos nomes de lugares vem de uma lista embutida no site. As outras buscas vão para o Open-Meteo, o Photon ou o
  Nominatim. As imagens carregam direto dos arquivos. A nossa hospedagem conta visualizações de página e velocidade, sem
  cookies, e pode definir um cookie de segurança para distinguir pessoas de robôs. Nós nunca o lemos.* `links`: *Só são
  criados quando você compartilha algo. Quem tiver o link vê o nome do lugar, um ponto arredondado para cerca de 1 km e
  a passagem que você escolheu.*
- Honest limits stay blunt: *Não. Na melhor das hipóteses, um pixel aqui tem 10 m de lado. Um carro é um pixel. Você
  não aparece.*

**War zones.** The code names four zones only to pick a season; the visible copy says the season, not the war.
- Names in copy: *Faixa de Gaza*, *Cisjordânia*, *Ucrânia*, *Líbano*. Never *Judeia e Samaria*, never *territórios
  ocupados* unless the English says so, never a qualifier (*Ucrânia ocupada*, *Crimeia russa*).
- Caption: *[12] vistas limpas · uma a cada outono*. Never add *da guerra*, *antes e depois*, *destruição*, *conflito*,
  *bombardeio*, or any explanation the English doesn't have.
- **Seasons are the place's own**, never the reader's: Gaza's *outono* is October–November even for a reader in São
  Paulo. Never convert or annotate by hemisphere.
- **No verb of devastation next to a place**: *varrer*, *atingir*, *arrasar* never take a place as object (§3.4). The
  likely verb is *cobrir*.

**Glaciers.** *Geleira* (f.). "The end of the melt season" is *o fim da estação de degelo*. Factual, no climate
adjectives (*derretimento alarmante*).

**Country and place names.**
- Countries come from `Intl.DisplayNames('pt-BR', { type: 'region' })` and are never overridden: *Ucrânia*,
  *Territórios palestinos*, *Taiwan*, *Kosovo*, *Saara Ocidental*, *Ilhas Malvinas*, *Macedônia do Norte*, *Tchéquia*,
  *Mianmar (Birmânia)*, *Antártida*, *Hong Kong, RAE da China*. CLDR's neutral forms; an override table would be a
  political decision made in code.
- Runtime places come from the gazetteer as it gives them (*Kyiv*, *Kharkiv*, *Odesa*, *Gaza*). Translators never
  rename them.
- **Ukrainian cities in static copy: avoid them**; no string needs one today. Chernobyl's sublabel (`places`,
  *Kyiv Oblast, Ukraine*) becomes *Norte da Ucrânia*. If a future string must name one, it uses the gazetteer's
  spelling (*Kyiv*, *Odesa*), a deliberate exception to the "established exonym" rule for curated names, so one screen
  never shows two spellings (*Kiev* beside *Kyiv*).
- Curated places (`src/i18n/pt-BR/places.ts`) use the established Portuguese name where one exists (*Área 51*,
  *Pirâmides de Gizé*, *Cataratas do Niágara*, *Canal do Panamá*, *Veneza*, *Monte Vesúvio*,
  *Istambul*, *Monte Everest*, *Monte Fuji*, *Mar Morto*, *Cataratas Vitória*, *Usina de Itaipu*, *Canal de Suez*);
  otherwise the local or English name (*Central Park*, *Grand Canyon*, *Palm Jumeirah*, *Uluru*, *Sossusvlei*). Generic nouns are
  lowercase inside a name only where Portuguese writes them so (*as pirâmides de Gizé* in prose; the label's first
  letter stays capital).

**Licence credits stay English, in code**, as the data policies word them: *Contains modified Copernicus Sentinel data
2026*, *Contains modified EUMETSAT Meteosat data 2026*, *Landsat: USGS / NASA*, the time-lapse's *Contains modified
Copernicus Sentinel data 2015–2026*. They are not in the catalogs. The About credit lines in `about.credits` are
translated: *Imagens do GIBS da NASA, parte do EOSDIS. GOES via NOAA e CIRA, Himawari via JMA.*; *Microsoft Planetary
Computer e Element 84 Earth Search; a banda de 15 m do Landsat vem do Copernicus Data Space Ecosystem.*; *Conjuntos de
elementos do CelesTrak. SGP4 por satellite.js.*; *Photon, da komoot. Dados do mapa © colaboradores do OpenStreetMap
(ODbL).*; *Solar System Scope (CC BY 4.0), a partir do Blue Marble e do Black Marble da NASA.*; *Instrument Sans e
Serif, da Instrument; Martian Mono, da Evil Martians (SIL OFL).*; footer *Feito com dados públicos. Não fizemos
nenhuma destas imagens.*

**Agencies and programmes.** Never translated: ESA, NASA, NOAA, EUMETSAT, JMA, CIRA, Copernicus (never *Copérnico*),
Planetary Computer (never *Computador Planetário*), CelesTrak, GIBS, EOSDIS, Element 84. Established Portuguese names
for two: *Força Espacial dos EUA* (US Space Force) and *Serviço Geológico dos Estados Unidos* in prose (the licence
line stays *USGS*). Genders in static text: *a NASA*, *a ESA*, *a NOAA*, *a EUMETSAT*, *a JMA*, *o USGS*, *o
Copernicus*, *o Planetary Computer*, *o CelesTrak*, *o NASA GIBS*, *a ISS*, *o Watched*.

---

## 9. Pitfalls and the reviewer's checklist

### 9.1 Pitfalls specific to pt-BR here

| Trap | Wrong | Right |
|---|---|---|
| *assistir* (watch TV) for "watched" | *256 satélites assistiram Waterloo* | *observaram Waterloo* |
| *varrer* with a place | *Sentinel-2C varreu Gaza.* | *Sentinel-2C cobriu Gaza.* |
| *passar ao alcance* | *passou ao alcance às 10:52* | *esteve ao alcance às 10:52* |
| *acima* with nothing after it | *passou 786 km acima*, *, logo acima.* | *a 786 km de altitude*, *na vertical do local* |
| Two words for off-nadir | *Com inclinação de 12,3°* | *Apontando 12,3° fora da vertical* |
| *atual* for "actual" | *as imagens atuais* | *as imagens reais* |
| *data* for "data" | *data pública* | *dados públicos* |
| *eventualmente* for "eventually" | *eventualmente aparece* | *acaba aparecendo* |
| *grosseiro* for "coarse" | *imagem grosseira* | *pouco detalhada* |
| *passe* / *passo* for "pass" | *31 passes* | *31 passagens* |
| "photographed" | *fotografou Waterloo* | *observou Waterloo* |
| *foto* for a mixed set | *foto de radar*, *12 fotos*, lane *Foto* | *imagem de radar*, *12 imagens*, lane *Imagem* |
| A filter label that lies | *Mosaicos* (it holds full-disc frames too) | *Meteo* |
| "resolution" for a pixel size | *Resolução 10 m* | *Pixel 10 m* |
| *arquivo* for a computer file | *o arquivo toca no Chrome* | *o vídeo toca no Chrome* |
| *câmara* | *câmara orientável* | *câmera orientável* |
| º for degrees | *98,6º* | *98,6°* |
| *há … atrás* | *há 41 horas atrás* | *há 41 horas* |
| Crase before numbers, speeds, masculine words | *à 7,46 km/s*, *à 786 km* | *a 7,46 km/s*, *a 786 km* |
| Missing crase before hours | *as 16:14* | *às 16:14* (*à 01:05*) |
| First of the month in prose | *1 de novembro* | *1º de novembro* (mono *1 nov*) |
| Abbreviated dates in prose | *no dom., 1 de nov., às…* | *no domingo, 1º de novembro, às…* |
| Two-letter or narrow weekdays | *SE 2 … SE 6*, *D S T Q* | *seg 2 … sex 6* |
| *essa semana* | *essa semana* | *esta semana* |
| Gendered reader | *Você foi observado* | *Algo observou você* |
| Pronoun for [SAT] or [PLACE] | *Ele estava olhando…*, *observou-o* | *Olhava…*, *o local* |
| [PLACE] as subject | *Waterloo estava dentro da faixa* | *A faixa cobriu Waterloo* |
| Possessive *seu/sua* for the satellite | *sua faixa de 290 km* | *a faixa de 290 km* |
| Article or contracting preposition before a slot | *observaram o Rio*, *em Waterloo*, *imagem do Sentinel-2C* | *observaram Rio de Janeiro*, colon frames, *imagem do satélite Sentinel-2C* |
| A verdict title after a number | *4 observou* | *4 passagens: Observou*; *4 passagens com imagem* |
| Zero in `one` | *0 passagem* | `n === 0` → *0 passagens* or its own sentence |
| Verb outside the count | *256 satélites observou* | the plural includes the verb |
| English decimals or grouping | *7.46 km/s*, *1,715 imagens* | *7,46 km/s*, *1.715 imagens* (from `fmt`) |
| Reformatted coordinates | *46,63°O*, *-23,55; -46,63* | as code writes them: *46.63°W* |
| W or L for compass words | *rumo a W*, *SSW* | *rumo ao oeste*, *SSO* |
| Title Case, capitalised months | *Como Encontramos as Passagens*, *Domingo, 1 de Novembro* | *Como encontramos as passagens*, *domingo, 1º de novembro* |
| *Sentinel* translated or pluralised | *Sentinela-2*, *os Sentinels* | *Sentinel-2*, *os Sentinel* |
| Gerund chains / progressive | *estava olhando*, *vai estar calculando* | *olhava*, *calcula* |
| Clitic placement | *Me surpreenda*, *vê-me* | *Surpreenda-me*; otherwise avoid clitics |
| *também* before the verb in the hook | *Algo também observou você* | *Algo observou você também* |
| *Algo deu errado* in the fault | — | *Ocorreu um erro.* |
| Typed U+2011 / U+202F | fallback glyphs on the card | plain hyphen, U+00A0, `nowrap` in code |
| Colloquial spellings | *pra*, *tá*, *a gente* | *para*, *está*, verb ending in *-mos* |
| A pt-BR sentence in analytics | the pt-BR fault logged as `msg` | the English ref text (`englishOf`) is what is logged |

### 9.2 Reviewer's checklist

Run every translated string through these, in order:

1. **Verb:** "watched" is *observar*; likely is *cobrir*; could is *estar/ter ao alcance*; no *assistir, vigiar,
   fotografar, ver*, no *varrer* with a place.
2. **Image words:** *imagem* by default, *foto* only for named Sentinel-2/Landsat photos, *vista* for "look",
   *passagem* for "pass", *arquivo* only for archives.
3. **Address:** *você* + third person; no *tu, te, o senhor, a gente*; nothing agrees with the reader's gender.
4. **Slots:** [PLACE] never a subject, no article, no *de/em/a/por*, nothing agreeing; [SAT] *O satélite {sat}* in the
   imaged/likely/could/geo sentences, bare elsewhere, no pronoun after it, no gendered predicate, no *seu/sua*.
5. **Counts:** `one`, `many`, `other` present; `n === 0` handled wherever 0 can arrive; verbs and participles inside
   the plural and agreeing; no verdict title after a bare number.
6. **Numbers:** through `fmt`; decimal comma, thousands dot; `25%`, `98,6°` attached; no º for degrees; typed numbers
   only in `sats`.
7. **Coordinates:** untouched; example coordinates in the dot notation with ASCII hyphen-minus.
8. **Time and date:** 24 h; *à/às* from the clock's first two digits; *no/na* from the weekday; *1º* in prose only;
   mono dates without periods; weekdays three letters; *há* without *atrás*; *daqui a* for the future.
9. **Compass:** N/S/E/O and the 16-point set with O; heading and offset phrases from their two tables.
10. **Typography:** “ ”, …, no em dash, en dash only in ranges, no space before `: ; ! ? %`, U+00A0 in typed
    number + unit, no U+2011 / U+202F.
11. **Case:** sentence case; labels stored in sentence case; accents kept on capitals.
12. **Register per surface:** infinitive buttons, imperative of *você* inside sentences, impersonal faults without
    apology, no exclamation, no emoji, no marketing verbs.
13. **BR/PT:** the neutral word where §1.4 gives one; else the Brazilian one.
14. **Honesty:** the label says exactly what is on screen (*Pixel* not *Resolução*, *Imagem* not *Foto* for mixed sets,
    *Meteo* not *Mosaicos*, *Pelo menos* only where English has *At least*); nothing stronger or softer than English.
15. **Never translated:** *Watched.*, www.watched.earth, satellite, sensor, agency and programme names, NORAD ids, UTC,
    zone abbreviations, TLE, GMST, coordinates, licence lines, file-name slugs' `watched-`.
16. **Length:** inside the §7 budget; any tight form is its own string; no word cut, no accent dropped.
17. **Read it aloud** as a Brazilian radio newsreader would: if it sounds translated, rewrite it from the meaning.

### 9.3 Test values for reviewers

- Counts: 0, 1, 2, 5, 21, 1.715 and 1.000.000 (`many`).
- Places: *Waterloo*, *Rio Grande do Sul*, *Estados Unidos*, *Pacific Ocean*, a 120-character name, a name cut with …,
  coordinates (*43.4723°N 80.5449°W*), a name in Cyrillic or Han.
- Satellites: *Sentinel-2C*, *ISS (ZARYA)*, *NORAD 60989*, nameless (`undefined`).
- Clocks: 00:05, 01:05, 02:05 and 12:00 (*à / às*); weekdays domingo, sábado and sexta-feira (*no / na*); the first and
  the second of a month (*1º / 2*).
- Screens: `?hl=pt-BR` on a 320 px and a 390 px phone and a laptop; the hero's wipe; the share card PNG and the default
  card.

### 9.4 Notes for the owner and engineers (all free: no request, no byte for English, no render)

1. **`WindowWhen` carries the instants** (`fromMs`, `toMs`, `timeZone` beside `from` / `to`): a type-only change so
   the older-week headline can say *Entre 29 de outubro e 5 de novembro* (§3.3). English ignores them.
2. **Optional parser tweak** (`parseCoordinates`, ~3 lines): accept *O* as west and a decimal comma when the separator
   is `;` or whitespace (*-23,55 -46,63*, *-23,55; -46,63*), the way a Brazilian types coordinates. Not required by
   this guide; dots keep working. The English `searchDown` example's U+2212 does not parse today: fix the parser or the
   English; pt-BR already uses ASCII.
3. **Hero accent under the wipe:** `.hl` pads its mask 0.05em above the line, tuned for English, whose serif *you* has
   nothing above the x-height. Check *você*'s circumflex at `?hl=pt-BR`; if clipped, raise the top padding (and its
   negative margin) for `data-script="latin"`. CSS only.
4. **Lane label:** pt-BR's *Imagem* departs from English *Photo* on honesty grounds (radar and mosaics share the lane);
   the owner may want the English to follow.
5. **Not done, by decision:** no per-locale card hero size (measured 444 / 466 px); no article table for countries and
   Brazilian states (it would be under 1 kB in the pt-BR chunk if the owner ever wants *observaram o Rio Grande do
   Sul*); no country-name overrides.

---

## Decisions log

Each item of the native reviewer's critique (`pt-BR.critique.md`) and how it was resolved. Measurements: satori and
the shipped card fonts, Intl in Node 22.23 / ICU 78.3, the catalogs and CSS as they are on 2026-11-19.

1. *varrer* + place reads as devastation (blocker): **accepted.** Likely verb *cobriu* everywhere (headline, post, row, definition); VIIRS and infrared lines use *captar*; *varrer* only with the Earth, the disc, a swath or the scan line.
2. Filter *Mosaicos* dishonest, *Detalhadas* too long (blocker): **accepted.** Verified `filterOf` puts `geo` in weather; *Todas · Fotos · Meteo · Radar* with the proposed tooltips.
3. ICU notation, fragment table, two `copied` keys: **accepted.** Every example is now the catalogs' TypeScript with an `n === 0` branch; the pieces table replaced by one row per message and shape; one *Copiado*.
4. Coordinates the user cannot type back: **partly accepted.** Coordinates are not copy (code writes `43.47°N 80.54°W`, which the field parses); the draft's *46,6°O* and semicolon rule deleted; `searchDown` uses ASCII hyphen-minus; hint *Nome, endereço ou lat, lon* rather than *coordenadas* (it shows the order and separator); the parser tweak goes to the owner as optional (§9.4).
5. *passou ao alcance* calque: **accepted.** *esteve / estiveram ao alcance*; headline and post keep *teve {place} ao alcance*.
6. Dangling *acima*, *logo acima*: **accepted.** *na vertical do local, a 786 km de altitude*; offset adds *a oeste do local*; ISS *acima do seu horizonte*.
7. Wrong antecedent in the dark weather line: **accepted.** *À noite, o sensor deste satélite trabalha no infravermelho: viu as suas nuvens, não as suas ruas.*
8. Off-nadir in two words: **accepted.** Prose always *fora da vertical* (*Apontando 12,3° fora da vertical, …*); labels *Fora do nadir*, field of regard *Inclinação máx.*
9. Bare satellite names opening paragraphs: **accepted**, and extended to `geo.sits` (geostationary watchers are all satellites); verified `verdictFor` keeps stations out of imaged, likely and could.
10. [PLACE] as subject: **accepted.** Never a subject; *A faixa de 24 km cobriu Waterloo*, alt text *Imagem do satélite {sat}: {place}. O lugar está no centro.*
11. Abbreviated prose dates, *1 de novembro*: **accepted.** Long prose dates with *1º*; mono stamps from `formatToParts` without periods; the older-week headline needs the instants in `WindowWhen` (§9.4).
12. Colliding weekday abbreviations: **accepted.** Always three letters (*dom 1 … sáb 7*), never narrow or two letters.
13. Sub line garden path, *realmente*, false note: **accepted.** Comma before *e*, *imagens reais*, cross-sentence *ele* explained, comma rule rewritten; *eles* also dropped before *captaram*.
14. Default card overflow: **partly accepted.** `enterAnyPlace` *Busque um lugar da Terra* (263 px, = English) accepted; the per-locale hero size rejected: satori measures *observou você* at 444 of 466 px (English 408, German 464 ships).
15. Verdict titles after numbers: **accepted.** Rule added; timeline summary in lane words (*4 passagens com imagem, 12 prováveis, 30 possíveis, 8 sobrevoos*); tooltip kinds as proposed.
16. Values over their budgets: **partly accepted.** *27 na semana*, *Nublado · 92%*, *Sombra*, *Em cores* accepted; band value *IR* instead of *Térmico* (one word with the chip; *IV* rejected because *Banda IV* reads "band 4").
17. Missing surfaces: **partly accepted.** Computing rows, blurbs, geometry labels, notes and *grosseiro* accepted; *Consultando Sentinel-2 + Landsat* instead of *Buscando…* (which reads as looking for the satellites); footnotes quote the titles (*fica em “Observou”*) rather than *conta como observada* (a pass is not what was watched); card *Mais perto* (95 px) instead of *Distância mín.* (133 of 134 px).
18. *Odesa* and *Kyiv* in static text: **partly accepted.** Static copy avoids Ukrainian city names (Chernobyl's sublabel is *Norte da Ucrânia*), never two spellings on a screen, the gazetteer spelling as a stated exception; *Odessa* rejected because it would sit beside the gazetteer's *Odesa*.
19. Blanket preposition ban too wide: **accepted.** *sobre, para, até, com, sem, entre* allowed before [PLACE]; only *de, em, a, por* banned.
20. States and countries that take an article: **accepted.** Documented as the accepted headline-style compromise; the article table noted for the owner, not shipped.
21. Missing BR/PT pairs: **accepted.** *configurações*, *conexão*, *captar* for *registrar*, avoid *contato*, *óptico*, *Antártida* from Intl only.
22. *Sol* capitalised everywhere: **accepted.** *sol* lowercase in prose, *Terra* always capitalised.
23. Unbuildable line-break rules: **accepted.** Verified no U+2011 / U+202F in the card fonts; plain hyphens, U+00A0, `nowrap` in code; the one-letter binding rule dropped.
24. *à/às* tied to plural rules: **accepted.** `Number(clock.slice(0, 2)) <= 1 ? 'à' : 'às'`, also for *por volta da / das*.
25. Quoted query after a contracting preposition: **accepted.** *Nenhum resultado para “{query}”. Tente uma cidade, um ponto turístico ou coordenadas.*
26. Small rewrites: **accepted.** All twelve rows applied (*Estações espaciais*, *você também*, *que não pisca*, *vê através das nuvens e do escuro*, the geostationary sentence, *Na melhor das hipóteses*, *Dá para me ver?*, *pôde*, *com imagens públicas*, *Se aparece aqui*, *a publicação pode levar*, *Céu encoberto*).
27. Missing fault fallback: **accepted.** *Ocorreu um erro.*, label *Falha*.
28. The brand in running text: **accepted.** *o Watched*; `hud.home` *Watched, início*.
29. Hero circumflex under the wipe mask: **accepted.** QA check and CSS-only fix listed (§3.1, §9.4).
30. Short UI: **accepted.** *Postar no X*, *Tentar de novo*, *{n} restantes*, *Espaço*.
31. Inconsistencies inside the guide: **accepted.** *Asc. / Desc.*, *Não temos como saber* everywhere (About too), *Ou experimente* only.
M1. Locate errors: **accepted**, with *Permita o acesso nas configurações do navegador* (the verb needs its object).
M2. Locating note: **accepted**, with *cerca de 10 km* in prose instead of *~10 km*.
M3. Tab title and boot line: **accepted.**
M4. Engine footnotes, `noImage`, `spot`, time-lapse rows, `tooFew`: **accepted** (§3.7).
M5. Aria strings built from counts: **accepted.** *nuvens 25 por cento*, *encoberto*, *imagem 3 de 27* (§3.7, §4.2).
M6. Reviewer test list: **accepted** (§9.3).

The reviewer's "Keep" list (*você*, no *te*/*tu*, *observar*, the hero, the headline, the zero sentence, *Pelo menos*,
*passagem*, *imagem* vs *foto*, the *Imagem* lane, *Pode ter apontado aqui*, *Sobrevoou / Sobrevoo*, *teve {place}
ao alcance*, *Olhava direto para baixo*, *rumo ao sul a 7,46 km/s*, *Não temos como saber se observou*,
*Surpreenda-me*, *Rever*, *time-lapse*, *quadro*, *Revelando*, *encoberto*, *cirros*, *pixels*, the zero and `many`
rules, Intl for numbers, lists and relative time with *há* and *daqui a*, “ ”, no space before *% : ; ! ?*, N/S/E/O and
the 16 points, the sensitive-content section, English licence lines and analytics) is kept.

### Screen QA, 2026-11-19

Every state of `?hl=pt-BR` was looked at beside English (laptop 1280×800, 1024×768, 1440×900; phones 390, 360, 320).

1. *Ao menos* (card sub-line) vs *Pelo menos* (results): **both kept.** Both are standard in Brazil and Portugal; the
   card's one 24 px line has no room for *Pelo menos* (468 of 466 px) and the app has; no one sees the two together.
2. `share.tryAgain` *Refazer PNG*: **kept.** It replaces *Salvar PNG* in a three-button row that holds about 11
   characters on a 360 px phone; *Tentar de novo* (14) and *Gerar de novo* (13) do not fit, and *Refazer PNG* says
   what is redone.
3. `globe.noGl.reason`: **kept** the nominal *WebGL 2 desativado neste navegador* (fits a 320 px phone, §4.2).
4. About section names: **the catalog's shorter two are the decision** (§4.2 table corrected to match).
5. *O que observou você* (card question, card invite): **rewritten.** After a verb, *você* reads as its subject (*what
   did you observe?*). The question names the subject in the plural, which *você* cannot agree with: *Quais satélites
   observaram você esta semana?* (as `placeTitle` already did). The footer invite has about 26 characters beside the
   host, so it echoes the hero instead: *Algo observou você também* (25), "something watched you too", the post's hook.
6. Verdict titles: **shortened** to ≤ 23 characters (§3.5, §7).
7. *Copiar imagem* → *Copiar PNG*, *Usar minha localização* → *Usar meu local*, replay hint → *anterior / próxima do
   mesmo tipo*: each was cut or overflowed on screen (§4.2).
8. `could.insideSwath`: *onde fez imagens* → *onde captou imagens* (*captar* is the instrument verb, §3.4).
