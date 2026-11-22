# Watched: Korean (ko) localisation style guide

Final. Binding for every Korean string the product shows, speaks or sends: the landing, the computing readout, the
results panel, the pass list and pass view, the gallery and photo viewer, the time-lapse, the globe and HUD, the share
sheet, the share card (DOM preview, PNG, Open Graph unfurl), the share page and post text, alt text and aria labels, the
loading screen and the About page. Written against `docs/DESIGN.md` §7, `docs/I18N.md`, `docs/i18n/TRANSLATING.md`,
the English catalogs in `src/i18n/en/` (including `verdicts`, `results` and `pass`, which hold what
`src/ui/results/lib/meta.ts` and `copy.ts` used to spell), `api/_lib/i18n/card/en.ts`, `api/_lib/i18n/parts.ts`,
`src/i18n/Rich.tsx`, `src/styles/scripts.css` and the three card renderers. Where this guide and a translator's habit
disagree, this guide wins. Where this guide and `docs/DESIGN.md` disagree on anything that is not language, DESIGN
wins. Where this guide and the English disagree on a fact, the English wins and this guide is wrong: report it.

**Notation.** `[PLACE]`, `[SAT]`, `[SENSOR]`, `[NUM]`, `[N]`, `[DAYS]`, `[TIME]` (a 24 h clock with its zone, one mono
part: "16:14:21 EST"), `[ALT]`, `[DIST]`, `[SPEED]`, `[SWATH]`, `[GSD]`, `[DIR8]`, `[DIR16]`, `[DEG]`, `[PCT]`, `[DAY]`,
`[QUERY]` are runtime slots. In frames, `*…*` is the serif accent and `**…**` the bold (strong) run. A slash inside a
Korean example (이미지 / 사진) separates alternatives; it is never on screen unless the example says so. "Syllables"
means Hangul syllable blocks (음절).

**The voice in one line:** 조용하게, 사실만, 짧게. Quiet, facts only, short. 한다체 (the plain written declarative of
newspapers, field logs and non-fiction) on every surface, no polite or honorific form anywhere. 당신 only in the brand
lines. Real numbers, half-width, in the mono face, with their counter written after them as text (위성 256기, 이미지
31장).

**The rule translators break most:** a particle that changes with the final consonant (이/가, 은/는, 을/를, 와/과,
(으)로, 이다) never follows a runtime name directly. Every frame here is built so it does not have to (§5).

**Cost and speed (owner's condition).** Everything in this guide is static copy in the `ko` chunk, CSS on
`:root:lang(ko)` or `[data-script='cjk']`, or a constant or a few lines in a renderer. Korean adds no web font for
running text (system fonts), no particle library, no segmenter, no runtime service and no request on page load or on a
search. The only font bytes in the browser are the accent subset (the glyphs of 당신 and 돌아간다, a few kB) that
`scripts/build-accent-fonts.py` embeds in the `ko` chunk the page downloads anyway; nothing is ever fetched from
`fonts.googleapis.com` in the browser (About's "Who else sees it" lists every third party, and a font request would make
it false). Share cards get their Hangul from the free text-subset loader the server already has, once per card, and the
card is cached per link (§6.8).

### Decisions at a glance

| Question | Decision |
|---|---|
| Register | 한다체 on every surface. No -ㅂ니다, -요, -세요, -주세요, -시-, no plain imperative (-라). Buttons and labels are nouns. Notices: what failed, then one way out with -면 된다 or what still works with -ㄹ 수 있다. |
| "you" | 당신 only in: the hero and its plain copies, the shared-link banner and post hook (당신도), the second post hook (당신 머리 위로는), the share page's question (무엇이 당신을 지켜봤을까?), About's one answer (당신은 그보다 작다). Elsewhere no word: 이곳, 이 지점, 이곳 하늘. |
| "we" | Dropped. Where who acts is the content (About's method and privacy, the locating note), name the actor (Watched는 / Watched가) or use a passive (-되다). Never 우리, 저희, 당사. |
| Product verb | 지켜보다 → 지켜봤다 for watching this place. Instruments in general statements: 관측하다, 훑다. 찍다 only where the English says "took", "taken", "imaged" of a camera; radar 담다. Never 감시, never 촬영. |
| Hero | 지난 일주일, / 무언가 *당신*을 / 지켜봤다. Default share card: 무언가 / *당신*을 / 지켜봤다. (its stamp says 최근 7일). |
| Results headline | 최근 7일 동안, **위성 256기가** *Waterloo* 일대를 지켜봤다. / 이미지가 31장 공개됐다. |
| Verdicts | 지켜봤다 · 아마 지켜봤다 · 여기를 볼 수도 있었다 · 상공을 지나갔다; lanes 이미지 · 추정 · 가능 · 상공; unit 회. |
| Counters | satellites 기 · images, photos, frames, clear looks 장 · passes 회 (counts, readouts) · times 번 (prose; 1 is 한 번) · list rows, catalog objects, scenes, orbits, bands 개 · search results 건. Never 대 or 개 for satellites. |
| Counter mechanics | In sentences a counter is plain text right after the number part: `strong('위성 ', num(n), '기가')`. Only in stacked readouts may it be a `num()` unit. |
| Particles | Never a varying particle after a slot: buffers ([PLACE] 일대를, [PLACE] 상공을, [SAT] 위성이, [SENSOR] 센서가) or invariant particles (의, 에, 에서, 도, 까지, 부터, 쯤, 마다). |
| Unnamed satellite | Sentences receive `sat` undefined and write 이름 미상 into the [SAT] slot (이름 미상 위성이); the chip label `aSatellite` is 이름 미상 위성. |
| Plural | One CLDR category, `other` (cardinal and ordinal). Zero has its own sentence wherever English has one. |
| Numbers | 1,715 · 7.46 km/s · 786 km · 25% · 98.6°. Half-width digits, comma grouping, never 만 / 억. |
| Dates | The `day` slot and prose: 11월 1일(일). Dotted only with a year: 2026.11.1(일), kicker 2026.11.12 → 11.19 UTC. Spoken: 11월 6일 금요일. 24 h clock. |
| Ranges | Prose 10~30 m (물결표, no spaces). Mono spans and directions →. |
| Card headline | Phrase parts, one card line each: 위성 7기가 / *Waterloo* / 일대를 / 지켜봤다. (§3.6). No part has a leading space; flat text joins them with a space. |
| Type | System fonts (scripts.css stacks and CJK tokens). Upright Myeongjo accent (embedded subset), never slanted. `word-break: keep-all` + `overflow-wrap: break-word` on the root. |
| Country names | `Intl.DisplayNames('ko', { type: 'region' })`, never typed by hand. Place names are data, shown as they come (§8 for the four contested names). |

---

## 1. Register and address

### 1.1 One register: 한다체, no honorifics

| Surface | Register | Sentence shape | Example (en → ko) |
|---|---|---|---|
| Display headlines (hero, results headline, card headline, About title, time-lapse heads) | 한다체 | Past declarative (-었다 / -았다 / -지 않았다) or a standing fact (-ㄴ다). Ends with a full stop. | Something watched you this week. → 지난 일주일, 무언가 당신을 지켜봤다. |
| Sentences and prose (second line, pass paragraphs, why-lines, footnotes, verdict definitions, notes, post text, tooltips that are sentences) | 한다체 | -었다 for what happened on the pass, -ㄴ다 / -다 for standing facts (레이더는 구름을 뚫고 본다), a noun and a colon for readout-like facts. | It was looking straight down. Cloud cover across the scene: 25%. → 바로 아래를 보고 있었다. 장면 전체 구름양: 25%. |
| Satellite blurbs | 한다체, noun endings allowed | A noun phrase with a colon where the English has one (명사형 종결), or one -ㄴ다 sentence. | Copernicus multispectral imager: 13 bands, 10 m pixels, a 290 km swath. → Copernicus 다중분광 이미저: 밴드 13개, 픽셀 10 m, 관측 폭 290 km. |
| Buttons and links | No ending | A Sino-Korean action noun when one exists (저장, 복사, 공유, 취소, 검색, 시도, 변경, 선택); a native verb + 기 only when none does (닫기, 보기, 꽂기, 찾기, 접기, 빼기). Object first: 이미지 저장. | Close → 닫기 · Download image → 이미지 저장 · Try again → 다시 시도 · Share → 공유 |
| Mono caps labels and readouts | No ending, no particles | A noun of 2–5 syllables, Sino-Korean preferred. | ALTITUDE → 고도 · OFF-NADIR → 기울기 · CLOUD AT SPOT → 지점 구름 |
| Status lines | No ending | In progress: a short Sino noun + 중… (검색 중, 계산 중, 확인 중, 준비 중, 저장 중, 생성 중), or a native verb + -는 중 where no plain noun fits (불러오는 중, 고르는 중, 만드는 중, 찾는 중). Done: noun + 됨 (복사됨, 준비됨). Failed: noun + 실패, or -지 못함. | Creating link… → 링크 생성 중… · Copied → 복사됨 · Catalog loaded → 카탈로그 준비됨 · Video failed → 만들기 실패 |
| Placeholders and hints | No ending | A noun phrase; a gesture hint may be a short -해 clause ending on a noun. | Search a place → 장소 검색 · Or click the globe to drop a pin → 또는 지구본을 클릭해 핀 꽂기 |
| Fault and error notices | 한다체 | What failed (past or negative), then at most one -면 된다 (a one-step way out) or -ㄹ 수 있다 (what still works). No apology, no 주세요. | Location access is blocked. Allow it in your browser settings, or search for a place. → 위치 접근이 차단돼 있다. 브라우저 설정에서 허용하거나 장소를 검색하면 된다. |
| About page | 한다체, a little looser | The reader's questions in -ㄹ까?, first person (내가, 이게). Answers open short (안 보인다. · 꼭 그렇지는 않다. · 전부는 아니다.). | Can it see me? → 내가 보일까? |
| Accessibility text (aria-label, alt, title) | Same as the visible surface it describes | Use the visible label's words; add only what a sighted reader gets from layout. Write counters attached (31회), dates in words (11월 6일 금요일). | 31 passes: Watched → 31회: 지켜봤다 |

**Why 한다체.** It is the register of Korean reporting, science writing, documentary narration, data journalism and
observation logs: an instrument stating what it recorded. It addresses no one in particular, which is the "quietly
uncanny" distance the English keeps. The hero only works in it: 무언가 당신을 지켜봤다 is a quiet shock; 지켜봤습니다
is an official notice (or a confession); 지켜봤어요 is cute. The headline, its second line and the pass paragraph under it
read as one statement and must share one register. It is also the shortest form: -었습니다 adds two syllables a
sentence and -었어요 one, in a panel with none to spare.

한다체 is not 반말. It is impersonal written style, and Korean readers do not hear it as talking down. 반말 is the spoken
해체 (봤어, 했지, 그래?), which this product never uses.

**Rejected registers.** 해요체 throughout (Toss, Kakao, most consumer apps): its warmth turns the uncanny friendly, and
지난 일주일, 무언가 당신을 지켜봤어요 reads as a cheerful push notification; DESIGN rules that out ("If a choice makes it
look more like a SaaS landing page… it is the wrong choice"). 합니다체 (banks, government, broadcast): two syllables
longer a sentence and a public announcement. Plain headlines over 합니다 or 해요 body text (common in Korean marketing):
the headline and the second line are one finding, and the voice would switch mid-statement. 해체: rude to a stranger.

**Per surface, why:**

- **Display headlines:** the only register in which a headline is quiet and still a full sentence. Rejected:
  noun-ending headlines (위성 256기의 관측), the Korean news style, because they drop the verb, and the verb is the
  product.
- **Prose:** the same register as the headline it continues. Rejected: 합니다체 for "longer text", the usual Korean
  split, because the pass paragraph sits directly under the headline.
- **Buttons and links:** nouns, as on Korean iOS, Android and Windows (공유, 복사, 취소). Rejected: -하기 on every button
  (공유하기, 복사하기), the older web habit: longer, and it reads as a menu of activities. Never -세요 forms.
- **Labels:** Sino-Korean nouns, the vocabulary of instruments and data (고도, 기울기, 최근접). Rejected: native phrases
  (얼마나 높은지, 기운 정도): longer and soft.
- **Notices:** 한다체 plus one way out. Rejected: the default Korean error voice (죄송합니다. 오류가 발생했습니다.):
  the apology is filler and the register breaks the single voice; and bare noun errors (위치 오류), which don't say what
  to do. `-면 된다` in every notice would sound offhand ("just do X"), so it appears at most once per notice and only for
  a one-step way out.
- **About:** 한다체 with the reader's questions in -ㄹ까?. Rejected: 해요체 for the FAQ, which Korean FAQs often use,
  because About quotes the verdict definitions from the results' own table; one page in two registers would show.

### 1.2 Instructions without imperatives

Korean has no neutral imperative. The plain imperative (-라, -하라) reads as an order or an exam question; the polite
one (-세요, -주세요, -십시오, -바랍니다) is service register. So:

- **Buttons** are nouns: 공유, 링크 복사, 내 위치 사용, 다시 시도. Never 공유하기 when 공유 exists, never 공유해 보세요.
- **Notices** state the way out with -면 된다 (장소를 검색하면 된다) or what still works with -ㄹ 수 있다 (좌표는 그대로
  쓸 수 있다). One -면 된다 per notice at most.
- **The sub line and the About lede** use a conditional instead of a command: 입력하면 … 보인다, 고르면 Watched가 …
  찾아온다 (§3.2, §3.7 about).
- **Never** -세요, -주세요, -십시오, -바랍니다, 해 보세요, 확인하세요, 즐겨 보세요, and never a bare -ㄴ다 sentence used as
  an instruction (지점을 고른다. as a step).

### 1.3 Address: "you", "we", "I", the product

| Word | Use | Never |
|---|---|---|
| 당신 | Only the sanctioned lines in the table at the top. At most once per screen. On the share sheet the post preview carries 당신도, so the card footer uses the first person (나). | In pass prose, labels, notices, buttons, tooltips. Never 당신의 for "your". |
| (no word for "you") | Everywhere else. Korean drops the pronoun, and place words carry the second person: "your spot" → 이 지점, "your sky" → 이곳 하늘, "your horizon" → 이곳 지평선 (or 이곳에서 보면 … 지평선 위), "where you are" → 이곳, "your browser" → 브라우저, "your screen" → 화면. | 너, 여러분, 그대, 고객님, 사용자님, 회원님. |
| we (the product) | Dropped. The subject goes, or the sentence turns on the object: "We can't know whether it did." → 실제로 그랬는지는 알 수 없다. "No satellite we track" → 추적 중인 어떤 위성도. Where who does what is the content (About's method, privacy, the locating note), name the actor (Watched는 6시간마다 새로 받아 온다) or use a passive (저장되는 것은 … 구역뿐이다). | 저희 (humble service register), 우리, 당사, 이 서비스는. |
| I (the reader) | 나 / 내: About's questions (내가 보일까?, 이게 위성 전부일까?), the card footer (무엇이 나를 지켜봤을까), the first-person controls (내 위치, 내 장소). | 저. |
| The product | Watched, in Latin, read 워치드 (vowel-final: Watched는, Watched가, Watched를). | 워치드 or 왓치드 in writing. |

---

## 2. Voice

### 2.1 What "declarative, specific, quietly uncanny, second person" sounds like in Korean

- **Declarative:** every sentence ends in -다. It states what happened, in the past, with no softener (-는 것 같다,
  -인 듯하다, -ㄹ지도 모른다) unless the English hedges too ("likely", "could have", "may").
- **Specific:** the satellite's own name, the minute, the kilometre, the degree. Numbers sit in the mono face with
  their counter (위성 256기) or unit (786 km). Never round a number into words (수백 기, 수십 장).
- **Quietly uncanny:** understatement. Short sentences that let a fact land on its own: 당신은 그보다 작다. 거리가
  아니라 구름을 봤다. The verb 지켜보다 already carries the unease; nothing needs adding. No horror clichés (소름, 노리고
  있다, 누군가 당신을), no exclamation marks, no rhetorical question outside the two share questions (§3.6).
- **Second person:** 당신 is spent in the brand lines. After that the reader is addressed by place (여기, 이곳, 이 지점)
  and by dropped subjects. Korean that repeats 당신 sounds translated, and it would wear out the one word the hero
  depends on.

### 2.2 Rhythm and sentence length

- Aim for 15–35 syllables a sentence; 40 is the ceiling in a panel. Split an English sentence at "so", "because", ";"
  or ", and" into two Korean sentences (그래서, 하지만 may open the second).
- End a paragraph on its shortest sentence. That is where the quiet weight goes: 실제로 그랬는지는 알 수 없다.
- Vary the endings. Never three -었다 sentences in a row, never two -고 있었다 in a row: alternate -었다, -고 있었다,
  -중이었다, -없다, and a noun with a colon.
- One clause chain at most: [A]하고 [B]하며 [C]했다 is a calque of an English list. Use two sentences.
- Put the new fact right before the verb (Korean's focus position): 위성 256기가 … 지켜봤다, 이미지가 31장 공개됐다.
- Don't stack modifiers (~한 ~의 ~인 명사). Split into two sentences instead.

### 2.3 Words for what satellites and instruments do

| Act | ko | Where |
|---|---|---|
| watched this place (the product verb) | 지켜보다 → 지켜봤다, 지켜볼 수 있었다, 지켜봐 왔다 | Headlines, verdicts, share, any sentence about this place being watched. |
| saw (one look) | 보다 → 봤다, 보고 있었다, 볼 수도 있었다 | "looking straight down", the could title, "it saw your clouds". |
| swept, scanned | 훑다 → 훑었다, 훑는다 | likely's prose verb, weather imagers, scan lines. |
| observes, images (an instrument, in general) | 관측하다 → 관측한다 | Blurbs and footnotes about what an instrument does everywhere ("VIIRS images the whole globe" → VIIRS는 날마다 지구 전체를 관측한다). Never for this place's verdict. |
| took, taken (a camera's act) | 찍다 → 찍었다, 찍힌 | Only where the English says "took", "taken", "imaged" of a camera ("the actual pictures they took" → 실제로 찍힌 이미지). |
| imaged (radar) | 담다 → 담았다, 담을 수 있었다 | Radar is not a camera: 레이더가 … 픽셀당 20 m로 담았다. |
| recorded | 기록하다 → 기록했다 | likely: 이 지점을 거의 확실히 기록했다. |
| acquired (the globe's mono readout) | 포착 | Mono callouts and the capture line only, never in a sentence. |
| never | 감시하다, 촬영하다, 엿보다, 내려다보다, 염탐하다 | Anywhere in user-facing copy. |

### 2.4 Avoid

- **Marketing:** 지금 바로, 한눈에, 손쉽게, 놀라운, 생생한, 혁신적인, 확인해 보세요, ~할 수 있습니다!, 무료로 즐기세요.
- **Service and honorifics:** -시- (검색하신, 보실), 드리다 (보여 드립니다), 저희, 고객님, 죄송합니다, 감사합니다.
- **Calques of English structure:** 그것은 / 그것의 / 그들은 for "it / its / they"; ~에 의해 (passive "by"); ~을
  가지다 ("have"); ~하는 것이 가능하다 ("it is possible to"); ~에 있어서; ~중의 하나; ~을 통해 for every "through"; 하나의
  for "a"; -들 after a counted noun (위성 256기들, 이미지들 31장); 되어지다 (double passive); 그러나 opening every contrast.
  -들 after a noun with no number (기업들은, 그 위성들이) is correct Korean and allowed.
- **Literal English order:** never translate clause by clause. Rebuild the sentence around its verb.
- **Drama the English doesn't have:** 무려, 고작, 결국, 마침내, 소름 돋는, 충격적인.

### 2.5 Before and after

1. "Something went wrong computing passes for this place. Try again in a moment."
   - Before (service register): 죄송합니다. 이 장소의 통과를 계산하는 도중 문제가 발생했습니다. 잠시 후 다시 시도해
     주세요.
   - After: 이 장소의 통과를 계산하다가 문제가 생겼다. 잠시 후 다시 시도하면 된다.
   - Why: no apology, no 주세요, one register, nine syllables shorter.

2. "Can it see me? / No. At best a pixel here is 10 m across. A car is one pixel. You're not in it."
   - Before (calque): 그것은 나를 볼 수 있습니까? / 아니요. 최선의 경우 여기에서 하나의 픽셀은 10 m의 폭을 가집니다.
     자동차는 하나의 픽셀입니다. 당신은 그 안에 있지 않습니다.
   - After: 내가 보일까? / 안 보인다. 여기서는 픽셀 하나가 아무리 작아도 10 m다. 자동차 한 대가 픽셀 하나다. 당신은
     그보다 작다.
   - Why: 그것은, 하나의, ~를 가지다 and 최선의 경우 are English structure. 안 보인다 is the natural direct answer to
     -ㄹ까?. The last sentence is the honest reading of "You're not in it": you are smaller than one pixel.

3. "It was dark here. Weather imagers keep scanning at night in infrared, so it saw your clouds, not your streets."
   - Before: 이곳은 어두웠습니다. 기상 이미저들은 밤에도 적외선으로 스캔을 계속하므로, 그것은 당신의 거리가 아닌
     당신의 구름을 보았습니다.
   - After: 여기는 어두웠다. 기상위성의 센서는 밤에도 적외선으로 계속 훑는다. 그래서 거리가 아니라 구름을 봤다.
   - Why: two 당신의 and a 그것은 are gone; the reader is still the one whose clouds were seen.

4. The sub line, done as marketing:
   - Before: 지구상 어디든 검색해 보세요! 지난 7일간 머리 위를 지나간 모든 위성과 실제 촬영 사진을 한눈에 확인할 수
     있습니다.
   - After: 지구 어디든 입력하면, 최근 7일 동안 그 상공을 지나간 모든 위성과 실제로 찍힌 이미지가 보인다.
   - Why: no imperative, no "!", no 한눈에, no 촬영, no "can" list. 보인다 states what happens.

5. "Its operator does not publish where it imaged, so we can't know whether it did."
   - Before: 그것의 운영자는 그것이 어디를 촬영했는지 공개하지 않으므로, 우리는 그것이 그렇게 했는지 알 수 없습니다.
   - After: 운영사는 어디를 찍었는지 공개하지 않는다. 그래서 실제로 찍었는지는 알 수 없다.
   - Why: three pronouns and 우리 dropped; split at "so"; the short sentence lands last.

---

## 3. The key lines

### 3.1 Hero (poster, three lines, one accent)

**Final (landing, `landing.hero`):**

```
지난 일주일,
무언가 *당신*을
지켜봤다.
```

```ts
hero: [['지난 일주일,'], ['무언가 ', accent('당신'), '을'], ['지켜봤다.']] as Rich[]
```

- Line widths in Hangul em (a space or a comma ≈ 0.3 em): 5.6 / 6.3 / 4.3. Two long lines and a short third, the
  English shape (Something / watched you / this week., middle line longest). Each line is whole 어절; nothing breaks
  inside a word.
- The accent is 당신 alone, in signal orange, an upright Myeongjo from the embedded accent subset (§6.7). 을 stays in
  the sans, as "watched" does in English; 당신 and 을 touch (no space between the parts).
- 무언가, not 누군가: "something", not "someone". A machine, not a person. No subject particle (무언가가): natural,
  a syllable shorter, and line 2 stays tight.
- 지켜봤다 is the product verb (§2.3): attention with duration, the old unease of 누군가 지켜보고 있다, without the
  accusation of 감시.
- 지난 일주일 is honest: the window is the last seven days, rolling. 이번 주 means the calendar week since Monday.
- Plain text (page `<title>` fallback, og:title, alt, aria, share text): 지난 일주일, 무언가 당신을 지켜봤다.
- Tab title (`app.documentTitle`, boot `title`): **Watched · 무언가 당신을 지켜봤다**. Tabs cut after about 25–30
  Latin widths and Hangul is double width, so the full sentence would lose its verb; the tab keeps the verb.

**Default share card (`card.hero`):** the card's column is 466 px at a fixed 88 px, and 지난 일주일, (≈ 474 px) and
무언가 당신을 (≈ 560 px) overflow it. The card's stamp already says 최근 7일, so the card takes the three-line poster
without the time:

```ts
hero: [['무언가'], [accent('당신'), '을'], ['지켜봤다.']] as Rich[]   // widest line ≈ 365 px at 88 px
```

The two keys are allowed to differ, and this is the reason. The renderer rules that go with it are in §6.8.

**Alternates:**

| Alternate | Why it lost |
|---|---|
| 이번 주, / 무언가 *당신*을 / 지켜봤다. | 이번 주 is the calendar week: on a Tuesday it means two days. And line 1 shrinks to 3.6 em against 6.3. |
| 지난 일주일, / 무언가 *당신*을 / 지켜보고 있었다. | More duration, but line 3 becomes the longest (7 syllables) and the punch drags; the headline needs 지켜봤다 (each pass is an event), and the hero must share its verb. |
| 무언가 / *당신*을 / 지켜봤다. (on the landing) | The best poster shape, but it drops the time, and on phones the kicker that states the window is hidden. Used on the default card only, where the stamp carries the time. |
| 지난 일주일, / 당신을 지켜본 / 무언가가 있다. | "There is something that watched you": a trailer construction, louder than the English. |

### 3.2 Sub line

EN: Enter any place on Earth. See every satellite that passed over it in the last 7 days, and the actual pictures they
took.

**Final:** 지구 어디든 입력하면, 최근 [DAYS]일 동안 그 상공을 지나간 모든 위성과 실제로 찍힌 이미지가 보인다.

- `landing.sub(days)` returns one plain piece (the English splits for its own text nodes; a translation may return one).
  [DAYS] is plain text here, attached to 일 (7일), so the number and its counter never part.
- A conditional (입력하면) replaces the two English imperatives: no command, no 보세요.
- 보인다 ("you see", literally "becomes visible") states what happens. 볼 수 있다 would make it a feature list.
- 그 상공을, not 그 위를: 지구 위 and 그 위 in one sentence repeat 위.
- 실제로 찍힌 이미지 drops "they" (the translationese 그 위성들이). 찍다 is right here: the English says "took".
- 이미지, not 사진: the pictures include radar images and daily composites, which are not photographs.
- Meta description (`card.page.description`, "…in the last 7 days…"): the same sentence with 7.

**Alternates:**

| Alternate | Why it lost |
|---|---|
| 지구 위 어디든 입력하면, … 그 위를 지나간 … | 위 twice in one sentence. |
| 지구 어디든 입력할 수 있다. 최근 7일 동안 … 이미지를 볼 수 있다. | Two "can" sentences read like a spec sheet. |
| … 모든 위성과 그 위성들이 실제로 찍은 이미지가 보인다. | 그 위성들이 is the English "they" kept for its own sake. |
| 지구 어디든 입력해 보세요. 지난 7일간 … 실제 사진을 볼 수 있어요. | Service register, an imperative, and 사진 claims every picture is a photograph. |

### 3.3 Results headline and second line

Korean has one CLDR plural category, `other` (cardinal and ordinal). Every count uses one string, and 1 uses it too.
Zero has its own sentence wherever the English has one. Never "위성 0기" or "이미지 0장" in a sentence.

**Headline (`results.headline.watched`, n ≥ 1):**

| Case | Frame | Example |
|---|---|---|
| Current window | 최근 [DAYS]일 동안, **위성 [NUM]기가** *[PLACE]* 일대를 지켜봤다. | 최근 7일 동안, **위성 256기가** *Waterloo* 일대를 지켜봤다. |
| n = 1 | (same frame) | 최근 7일 동안, **위성 1기가** *Waterloo* 일대를 지켜봤다. |
| Older window (a shared link) | [DATE1]부터 [DATE2]까지, **위성 [NUM]기가** *[PLACE]* 일대를 지켜봤다. | 10월 29일부터 11월 5일까지, **위성 12기가** *Waterloo* 일대를 지켜봤다. |

```ts
watched: (n, place, when) => [
  'lastDays' in when ? `최근 ${f.int(when.lastDays)}일 동안, ` : `${when.from}부터 ${when.to}까지, `,
  strong('위성 ', num(f.int(n)), '기가'),
  ' ', accent(place), ' 일대를 지켜봤다.',
]
```

- **Bold:** 위성 [NUM]기가, with the num() inside it (the display face's figures). 기가 is text after the number part,
  never the num's unit (§5.4).
- **Serif accent:** the place name only, never 일대를.
- **Plain weight:** the window phrase, 일대를 and 지켜봤다.
- 일대 ("the area around") is the buffer that fixes the object particle: [PLACE]를 / [PLACE]을 cannot be chosen by code
  (§5). It is also honest: a satellite sees an area, not a point.
- Subject-object-verb, the unmarked order. The comma after the window phrase is required.

**Alternates:** *Waterloo* 일대를 **위성 256기가 지켜봤다** (object first, so the count and the verb share the bold
run) lost because the card, the post and the aria text all say it subject first, and one order everywhere is easier
to translate and to recognise. **256기의 위성이** *Waterloo*를 … lost: 256기의 위성 is translationese, and Waterloo를
needs a particle code cannot choose. … *Waterloo* 위를 지나며 지켜봤다 lost: longer, and it claims every satellite
passed directly over.

**Headline: none (`results.headline.none`):**

| Case | Frame |
|---|---|
| Current window | 지난 일주일 동안, 추적 중인 어떤 위성도 *[PLACE]* 일대를 지켜보지 않았다. |
| Older window ("that week") | 그 일주일 동안, 추적 중인 어떤 위성도 *[PLACE]* 일대를 지켜보지 않았다. |

No bold run (no count). The place is still the accent. "We track" becomes 추적 중인 (no 우리).

**Second line (`results.imagesPublic`, `noImages`, `archiveDown`):**

| Case | Frame |
|---|---|
| k ≥ 1 | 이미지가 [NUM]장 공개됐다. |
| partial ("At least") | 이미지가 **최소** [NUM]장 공개됐다. (the strong part is the hidden-when-final 최소) |
| k = 0, current window | 지난 일주일 동안 공개된 이미지는 없다. |
| k = 0, older window | 그 일주일 동안 공개된 이미지는 없다. |
| Archives down | 이미지 아카이브가 응답하지 않아, 지금은 공개 이미지를 셀 수 없다. |

```ts
imagesPublic: (k) => ['이미지가 ', strong('최소 '), num(f.int(k)), '장 공개됐다.']
```

- 최소 is the separable "At least" span, right before the number; the rest of the line is identical with and without
  it, so the count settles in place (DESIGN §3).
- The two lines rhyme: 지켜봤다. / 공개됐다. Both end on the event.
- **Rejected:** 이미지 31장이 공개됐다. Natural, but the partial form needs 이미지가 최소 31장, so the particle would jump
  when the count settles. 공개된 이미지는 31장이다. ends on a copula and breaks the rhyme.

### 3.4 Pass sentences

EN: Sentinel-2C crossed 786 km overhead at 16:14:21 UTC, moving south at 7.46 km/s. It was looking straight down.
Cloud cover across the scene: 25%.

**Final:** Sentinel-2C 위성은 16:14:21 UTC에 고도 786 km에서 이곳 바로 위를 지나갔다. 남쪽을 향해 7.46 km/s로 이동
중이었다. 바로 아래를 보고 있었다. 장면 전체 구름양: 25%.

| Part (`pass.*`) | ko frame |
|---|---|
| crossed, overhead (no offset) | [SAT] 위성은 [TIME]에 고도 [ALT]에서 이곳 바로 위를 지나갔다. [DIR8]을 향해 [SPEED]로 이동 중이었다. |
| crossed, with an offset ("786 km up, 61 km to the west") | [SAT] 위성은 [TIME]에 고도 [ALT], 이곳에서 [DIR8]으로 [DIST] 떨어진 곳 위를 지나갔다. [DIR8]을 향해 [SPEED]로 이동 중이었다. |
| lookingDown | 바로 아래를 보고 있었다. |
| lookingOff | 바로 아래에서 [DEG] 비스듬히 보고 있었다. |
| cloudCover | 장면 전체 구름양: [PCT]. |
| mosaic | [SENSOR] 센서가 [PLACE] 일대를 훑었다. 그 모습은 NASA의 일일 자연색 합성 이미지에 픽셀당 [GSD]로 담겼다. |
| radarImaged | 레이더가 옆으로 [DEG] 비스듬히 [PLACE] 일대를 픽셀당 [GSD]로 담았다. (dark: + 어둠 속이었다.) |
| likely.crossed | [SAT] 위성은 [TIME]에 고도 [ALT]에서 이곳 바로 위를 지나갔다. 이곳은 관측 폭 [SWATH] 안에 있었다. (offset form as in crossed; no swath: the first sentence alone) |
| likely.notYet | 낮이었으므로 이 지점을 거의 확실히 기록했다. 이번 통과의 장면은 아직 공개되지 않았다. 아카이브 반영은 하루 이상 늦어질 수 있다. |
| overhead | [SAT] 위성은 [TIME]에 고도 [ALT] 상공을 지나갔다. 이곳에서 보면 [DIR8] 하늘, 지평선 위 [DEG]였다. |
| overhead, near the zenith | … 이곳에서 보면 지평선 위 [DEG], 거의 바로 머리 위였다. |

- 위성은 (topic) opens the paragraph: the satellite is what it is about. Later sentences drop the subject. 위성 is
  also the buffer that fixes the particle (§5).
- [DIR8] always ends in 쪽 (two tables in code, one Korean word list): 서쪽으로, 남쪽을 향해, 남서쪽 하늘.
- Units stay in their mono num() parts: 786 km, 7.46 km/s. Never 초속 7.46 km.
- 이곳 바로 위 only below 15 km of ground distance, as the code decides (no offset); otherwise the offset frame says
  what the distance is measured from (이곳에서).
- 향해 avoids two 로 in a row (남쪽으로 7.46 km/s로).
- One English sentence may become two Korean ones inside one message; that is allowed.
- The full list, every key, is in §3.7 (`pass`).

**More pass sentences, for tone:**

- Geostationary: Meteosat-12 위성은 지나가지 않는다. 적도 상공 35,778 km, 서경 0.2°에 머물며 10분마다 아래로 보이는
  지구 전면을 훑는다. 이번 스캔 선은 07:49 CET쯤 Paris에 닿았고, 북쪽으로 이동 중이었다.
- Commercial: WorldView Legion 4 위성은 10:52 EST에 이곳이 보이는 범위를 지나갔다. 이곳에서 서쪽으로 61 km 떨어진
  곳이었다. / 바로 아래에서 23.4° 기울였다면 Waterloo 일대를 지켜볼 수 있었다. 실제로 그랬는지는 알 수 없다.
- Station at night: 이곳은 어두웠다. 우주정거장이 아직 햇빛을 받고 있었다면, 깜빡이지 않는 밝은 점으로 이곳 하늘을
  가로질렀을 것이다.
- Overhead: ISS 위성은 21:04 CET에 고도 418 km 상공을 지나갔다. 이곳에서 보면 남서쪽 하늘, 지평선 위 54°였다.

### 3.5 The four verdicts (one vocabulary everywhere)

| verdict | Title | Lane (`short`) | Unit | Definition | Verb (`verb`, and the share frame) |
|---|---|---|---|---|---|
| imaged | 지켜봤다 | 이미지 | 회 | 이 장소의 실제 이미지가 공개 아카이브에 있다. | 지켜봤다 · [SAT] 위성이 [PLACE] 일대를 지켜봤다 |
| likely | 아마 지켜봤다 | 추정 | 회 | 늘 바로 아래를 보는 카메라의 관측 폭이 이 장소를 덮었다. 이곳을 찍은 이미지는 공개되지 않았다. | 훑고 지나갔다 · [SAT] 위성이 [PLACE] 일대를 훑고 지나갔다 |
| could | 여기를 볼 수도 있었다 | 가능 | 회 | 이곳이 방향을 돌릴 수 있는 카메라나 비공개 카메라가 닿는 범위 안에 있었다. 실제로 이쪽을 봤는지 운영사는 밝히지 않는다. | 보이는 곳을 지나갔다 · [SAT] 위성이 [PLACE] 일대가 보이는 곳을 지나갔다 |
| overhead | 상공을 지나갔다 | 상공 | 회 | 이곳 하늘을 가로질렀다. 우주정거장과 나머지 모든 위성. | 상공을 지나갔다 · [SAT] 위성이 [PLACE] 상공을 지나갔다 |

**In use:**

- Summary readouts (number, unit, title): 31회 지켜봤다 · 4회 아마 지켜봤다 · 120회 여기를 볼 수도 있었다 · 12회 상공을
  지나갔다. Readout tiles show zero as the number (0회); only sentences avoid zero.
- Aria (`results.verdictReadout`): 31회: 지켜봤다.
- Timeline lanes: 이미지 31 · 추정 4 · 가능 120 · 상공 12.
- Group header order line (`passView.imagedOrder`): 가장 자세한 모습부터, 이후 최신순.
- About's longer words (`about.verdictMore`): imaged 보여 주는 이미지는 모두 실제 이미지다. · likely 아직 공개
  전이거나, 구름 때문에 버려졌다. · could 그래서 알 길이 없다. · overhead (none). Each is read right after its
  definition, so it leans on it instead of repeating it (공개 전, not 공개되지 않았 again; 그래서, not 실제로 봤는지 again).
- Footnotes quote the titles in ‘ ’: ‘지켜봤다’로 센다, ‘아마 지켜봤다’로 보여 준다. Every title ends in 다, so 로 and
  라고 after the quote are fixed.

**Why these words:** the titles share the product's verbs (지켜보다, 보다), so the set hangs together; overhead makes no
claim about seeing. 여기를 볼 수도 있었다 is the honest counterfactual of "could have pointed here": a capability, with
도 marking possibility, not an event. 아마 지켜봤다 is the narrative use of 아마 with a plain past (그는 아마 지쳐
있었다); never "correct" it to 아마 지켜봤을 것이다 (heavy after a number). The lanes are short Sino-Korean legend words;
이미지, not 사진, because the lane holds radar images and daily composites too.

**Rejected:** 사진 as the lane (dishonest for radar); 포착 / 포착 추정 / 포착 가능 as titles (instrument-like, but the
verdict names would no longer say what the headline says); 아마도 (longer, more emotive); 여기를 겨눌 수 있었다 (겨누다
is to aim a weapon); 머리 위를 지나갔다 as the overhead title (claims the zenith; most overhead passes are far from it;
the idiom is fine in a rhetorical hook, §3.6); 감시 or 촬영 in any form.

### 3.6 Share card, share page and post

**Card headline (`card.headline`, `headlineBy`, `headlineWeek`).** The renderers set the headline's parts as blocks in
their order: a text part in the condensed display face, the accent part in the serif. Each text part is ONE line of
the card, never broken inside, and the size is the largest at which every text part fits the 466 px column
(cardSpec `headlineSizeCjk`). So Korean splits lead and tail into display phrases of about 4–8 syllables, cut at word
(어절) boundaries where a typesetter breaks a display headline, never between a modifier and its noun (보이는 / 곳을):

```ts
const named = (sat: SatName) => sat ?? '이름 미상'

headline:   (n, place, cut) => [`위성 ${f.int(n)}기가`, accent(place), '일대를', '지켜봤다.']
headlineBy: {
  imaged:   (sat, place, cut) => [named(sat), '위성이', accent(place), '일대를 지켜봤다.'],
  likely:   (sat, place, cut) => [named(sat), '위성이', accent(place), '일대를 훑고', '지나갔다.'],
  could:    (sat, place, cut) => [named(sat), '위성이', accent(place), '일대가', '보이는 곳을', '지나갔다.'],
  overhead: (sat, place, cut) => [named(sat), '위성이', accent(place), '상공을 지나갔다.'],
}
headlineWeek: (n, place, cut) =>
  n > 0 ? ['지난 일주일,', `위성 ${f.int(n)}기가`, accent(place), '일대를 지켜봤다.']
        : ['지난 일주일,', '추적 중인 어떤 위성도', accent(place), '일대를 지켜보지', '않았다.']
```

| Card | lines (/ between text parts; *place* the accent) | Size (Waterloo) |
|---|---|---|
| a pass, the week's N known | 위성 7기가 / *Waterloo* / 일대를 / 지켜봤다. | 74 px |
| an older share, imaged | Sentinel-2C / 위성이 / *Waterloo* / 일대를 지켜봤다. | 60 px |
| likely | MetOp-B / 위성이 / *Waterloo* / 일대를 훑고 / 지나갔다. | 58 px |
| could | WorldView Legion 4 / 위성이 / *Waterloo* / 일대가 / 보이는 곳을 / 지나갔다. | 48 px |
| overhead | ISS / 위성이 / *Waterloo* / 상공을 지나갔다. | 60 px |
| the week, n ≥ 1 | 지난 일주일, / 위성 1,715기가 / *Waterloo* / 일대를 지켜봤다. | 60 px |
| the week, n = 0 | 지난 일주일, / 추적 중인 어떤 위성도 / *Waterloo* / 일대를 지켜보지 / 않았다. | 48 px |

Each split was chosen as the one with the largest size among natural breaks (measured with `headlineSizeCjk`, with the
week's sub line): one long text part ('지난 일주일, 위성 256기가') forced the week's card down to 40 px.

- **No text part has a leading or trailing space.** `headText()` joins blocks with the locale's sentence gap (a space
  for ko), so the share page's title reads 위성 7기가 Waterloo 일대를 지켜봤다. A space inside a part would double it
  and indent the canvas block.
- **Never put the tail inside `accent(...)`:** it would be set in the serif at 1.06 ×, which breaks the accent rule.
- **`cut`:** when the place is cut short (`Waterl…`), keep the tail and its full stop unchanged. The stop sits in the
  tail, not after the ellipsis, so `cut` changes nothing in ko.
- 이 in headlines (the satellite is the news), 은 in the paragraph (the satellite is the topic).
- The week's frames open with 지난 일주일, (the hero's time topic): the week card is the brand line's echo, and the
  comma form is a syllable shorter than 동안 on the longest lead.
- **Rejected:** Sentinel-2C가 Waterloo를 지켜봤다. (both particles follow a slot); Waterloo 일대를 Sentinel-2C 위성이
  지켜봤다. (fronting the place breaks the lead / place / tail order); Sentinel-2C 위성은 … (은 answers "what did
  Sentinel-2C do", weaker as a headline).

**The line under the card headline (`card.photos`, `archiveDownShort`, `cloud.*.sub`):** 이미지가 31장 공개됐다. ·
이미지가 최소 31장 공개됐다. · 공개된 이미지는 없다. (the headline already says the week) · 이미지 아카이브가 응답하지
않았다. · 구름에 가렸다. 구름만 보였다. · 대부분 구름: 장면의 85%. · 이 지점 위에 구름이 있었다.

**Card footer and default card:** `invite` 무엇이 나를 지켜봤을까 (first person, beside www.watched.earth; the share
sheet's post preview already carries 당신도) · `enterAnyPlace` 지구 어디든 입력 · `defaultPlace` 팜 주메이라 ·
`lastWeek` 최근 7일 · `aSatellite` 이름 미상 위성.

**Share page (`card.page`):**

| key | ko |
|---|---|
| title | 지난 일주일, 무언가 당신을 지켜봤다. |
| description | 지구 어디든 입력하면, 최근 7일 동안 그 상공을 지나간 모든 위성과 실제로 찍힌 이미지가 보인다. |
| placeTitle | 지난 일주일, 무엇이 [PLACE] 일대를 지켜봤나 (the news-headline question in -나, natural without a question mark, as the English wants none) |
| placeDescription | 최근 7일 동안 [PLACE] 일대 상공을 지나간 모든 위성과 실제로 찍힌 이미지. 지난 일주일, 무엇이 당신을 지켜봤을까? |
| question | 지난 일주일, 무엇이 당신을 지켜봤을까? |
| opening | `[accent('Watched'), ' 여는 중']` |

**Post text (`share.post`, `hookWatched`, `hookPassed`):**

| key | ko |
|---|---|
| imaged | [SAT] 위성이 현지 시각 [DAY] [TIME]에 고도 [ALT]에서 [PLACE] 일대를 지켜봤다. 픽셀당 [RES]. 실제 이미지다. (no pixel: …지켜봤다. 실제 이미지다.) |
| clouded | [SAT] 위성이 현지 시각 [DAY] [TIME]에 고도 [ALT]에서 [PLACE] 일대를 지켜봤다. [CLOUD] (구름만 보였다. / 대부분 구름이었다(85%). / 구름이 이 지점을 덮었다.) |
| likely | [SAT] 위성이 현지 시각 [DAY] [TIME]에 고도 [ALT]에서 [PLACE] 일대를 훑고 지나갔다. 카메라의 관측 폭이 이 지점을 덮었다. |
| could | [SAT] 위성이 현지 시각 [DAY] [TIME]에 [PLACE] 일대가 보이는 곳을 지나갔다. 이쪽을 볼 수도 있었다. 실제로 봤는지 운영사는 밝히지 않는다. |
| overhead | [SAT] 위성이 현지 시각 [DAY] [TIME]에 고도 [ALT]에서 [PLACE] 상공을 지나갔다. |
| hookWatched | 지난 일주일, 무언가 당신도 지켜봤다. |
| hookPassed | 지난 일주일, 당신 머리 위로는 무엇이 지나갔을까? |
| credit | via @armaangupt0 (an X convention, kept) |

[DAY] in the post is the prose day (11월 1일(일)), [TIME] the 24 h clock (11:21). 머리 위 is the idiom for "over
you"; the ban on it in §3.5 is about the overhead verdict's claim, not a rhetorical hook. The product asks two
rhetorical questions in all, both here: `hookPassed` and `question` / `placeDescription`.

### 3.7 Reference lines by namespace

Every user-facing key, in final Korean. Where a key is a function, the slots are shown in brackets; the code formats
numbers with `fmt('ko')`. "(same)" means the English stays as it is.

**`landing`**

| key | ko |
|---|---|
| lastDays | 최근 [N]일 |
| windowRange | 2026.11.12 → 11.19 UTC · 2026.10.29 → 11.5 UTC · 2026.12.29 → 2027.1.5 UTC (year always on the end date, written once if both share it; never zero-padded) |
| hero | §3.1 |
| sub | §3.2 |
| builtBy | 만든 사람 [HANDLE] |
| searchPlaceholder | 장소 검색 |
| placeLabel | 장소 |
| searching / searchUnavailable | 검색 중 / 검색 불가 |
| matches / noMatch | [N]건 / 결과 없음 |
| searchHint | 이름, 주소 또는 위도, 경도 |
| clearSearch | 검색어 지우기 |
| go | 이 장소 상공을 지나간 위성 보기 |
| searchDown | 장소 검색이 응답하지 않는다. 43.47, −80.54 같은 좌표는 그대로 쓸 수 있다. |
| nothingMatches | “[QUERY]” 검색 결과가 없다. 도시, 랜드마크, 좌표로 찾을 수 있다. |
| suggestions | 장소 목록 |
| useMyLocation / locateMe / nearMe / locating | 내 위치 사용 / 내 위치 찾기 / 내 위치 / 찾는 중… |
| cancelSearch / cancelLocate / cancelLocating | 취소 / 취소 / 위치 찾기 취소 |
| requestingPosition / namingPlace | 위치 요청 중 / 장소 이름 찾는 중 |
| elapsed | [SS]초 (two digits, padded: a live counter must not change width) |
| locatingNote | 장소 이름을 찾기 위해 현재 위치가 Photon 주소 검색 서비스로 전송된다. 저장되는 것은 약 10 km 크기의 구역뿐이다. |
| locationLabel / dismiss | 위치 / 닫기 |
| locateErrors.denied | 위치 접근이 차단돼 있다. 브라우저 설정에서 허용하거나 장소를 검색하면 된다. |
| locateErrors.unavailable, other | 지금은 위치를 알 수 없다. 대신 장소를 검색하면 된다. |
| locateErrors.timeout | 위치를 찾는 데 너무 오래 걸렸다. 다시 시도하거나 장소를 검색하면 된다. |
| locateErrors.unsupported | 이 브라우저는 위치를 공유할 수 없다. 대신 장소를 검색하면 된다. |
| locateErrors.insecure | 위치를 쓰려면 보안(https) 연결이 필요하다. 대신 장소를 검색하면 된다. |
| orTry | 이런 곳도 |
| pinHint | 또는 지구본을 클릭해 핀 꽂기 |
| examplesLabel / dropPin | 예시 장소 / 핀 꽂기 |
| chipName | [LABEL], [SUBLABEL] |
| surprise / surpriseName | 아무 곳이나 / 아무 곳이나: 무작위로 고른 유명한 장소 |

**`results`**

| key | ko |
|---|---|
| headline.* | §3.3 |
| imagesPublic, noImages, archiveDown | §3.3 |
| tryAgain / share | 다시 시도 / 공유 |
| shareWeekLabel | [PLACE]의 지난 일주일 공유 / [PLACE]의 그 일주일 공유 |
| why.sunNeverRose | 해가 한 번도 뜨지 않아, 낮에만 찍는 카메라로는 이곳을 볼 수 없었다. |
| why.sunBarelyRose | 해가 거의 뜨지 않아, 낮에만 찍는 카메라로는 이곳을 볼 수 없었다. |
| why.infrared | 그래도 기상위성은 적외선으로 이곳을 [N]번 훑었다. (n = 1: …이곳을 한 번 훑었다.) |
| why.radar | 레이더에는 빛이 필요 없다. [A], [B] 외 레이더 위성 [N]기가 이곳이 보이는 범위를 [M]번 지나갔다. (no others: [A], [B] 위성이 …; one name: [A] 외 …; §5.5) |
| why.unpublished | Sentinel-2나 Landsat 위성이 낮에 이곳 상공을 [N]번 지나갔지만, 아직 공개된 장면이 없다. (n = 1: 한 번) |
| why.none | 이미지를 공개하는 관측 위성은 낮에 이곳 상공을 지나가지 않았다. |
| verdictGroup | 분류별 통과. 누르면 해당 목록으로 이동한다. |
| verdictReadout | [N]회: [TITLE] |
| notes.counted | **[N]**장 상세 이미지(Sentinel-2, Landsat, 10~30 m) · **[N]**장 일일 기상 합성 이미지(250~375 m) · **[N]**장 레이더 이미지(Sentinel-1, 20 m) · **[N]**장 정지궤도 기상위성의 지구 전면 이미지(2~5 km, 위성마다 가장 최신 이미지를 보여 준다). 관측 위성과 유인 위성 [S]기의 통과 [P]회를 확인했다. Write it noun first: 상세 이미지 **29**장(…) · 일일 기상 합성 이미지 **12**장(…) …; the strong part is the number alone, the counter text after it. |
| notes.checked | 관측 위성과 유인 위성 [S]기의 통과 [P]회를 확인했다. |
| notes.passTimes | 통과 시각은 각 위성이 [PLACE]에 가장 가까웠던 때로, 공개 궤도 요소로 계산했다(받은 시각 [STAMP]). 현지 시각은 [ZONE] 기준이다. (no stamp: …계산했다.) |
| sheetLabel / computingPasses | [PLACE] 상공의 위성 / 통과 계산 중 |
| sections | 요약 · 통과 · 늘 지켜보는 위성 |
| checkingArchives | 아카이브 확인 중 |
| invite.text / checkPlace / dismiss | 지난 일주일, 무언가 당신도 지켜봤다. / 내 장소 찾기 / 닫기 |
| searchAnother / allPasses | 다른 장소 검색 / 모든 통과 |
| footer.replay / replayLabel / replayTitle | 다시 보기 / 이 통과 다시 보기 / 지구본에서 이 통과 다시 보기 |
| footer.shareLabel | 이 통과 공유 / 이 이미지 공유 |
| footer.shareButton | `[strong('이 통과 '), '공유']` / `[strong('이 이미지 '), '공유']` (narrow phones drop the strong part: 공유) |
| footer.checkPlace | `['내 장소', strong(' 찾기')]` (Korean drops the verb at the end: narrow phones show 내 장소) |
| footer.clearest / clearestLabel | `['가장 맑은 모습', strong(' 보기')]` / 가장 맑은 모습 보기 |
| head.windowSpan | [N]일 · [RANGE] (7일 · 11월 1일 → 8일) |
| head.verifying | 기상 합성 이미지 확인 중 |
| head.cancel / newSearch / close / escKey | 취소 / 새 검색 / 닫기 / Esc |
| head.searchBarLabel / change | 다른 장소 검색(현재 [PLACE]) / 변경 |
| head.computing / recent | 계산 중 / 최근 검색 |
| head.position | 이 분류의 통과 [N]회 중 [K]번째 |
| head.previous / next | 이 분류의 이전 통과 / 이 분류의 다음 통과 |
| head.previousTitle / nextTitle / allPassesTitle | 이전(←) / 다음(→) / 모든 통과(Esc) |
| head.shared | 공유받음 · [SAT] 위성이 [PLACE] 일대를 지켜봤다 |
| head.passWhen | [DAY] · [TIME] [ZONE], geostationary ≈ [TIME] [ZONE] |
| computing.stages | 궤도 카탈로그 / 카탈로그 준비됨 · 궤도 계산 · [N]일 / 궤도 계산됨 · Sentinel-2 + Landsat 아카이브 / 아카이브 검색됨 · 장면과 통과 대조 / 장면 대조됨 |
| computing.ready / ok / seconds / percent | 보고서 준비됨 / OK / 1.84초 / 42% |
| computing.window | `[strong('7일 · '), '[DAY] [TIME] → [DAY] [TIME] UTC']` (the rest reads alone on phones; no 기간: with it the line's end was cut on a 1280 px laptop) |
| computing.slow | Planetary Computer와 NASA는 요청이 올 때마다 이미지를 렌더링한다. 이 단계는 몇 초 걸릴 수 있다. |
| computing.verySlow | 이미지 아카이브의 응답이 느리다. 끝내 응답하지 않으면 통과는 궤도 계산만으로 보여 주고, 그렇다고 밝힌다. |
| computing.sharedAlt | [SAT] 위성이 찍은 [PLACE] 일대 이미지. 공유받은 이미지다. (no name: 이름 미상 위성이 …) |
| computing.sharedCaption | `[strong('공유받음'), ' · [SAT] 위성이 [PLACE] 일대를 지켜봤다 · [DAY], [TIME]']` |
| geo.none | 운용 중인 정지궤도 기상위성 중 이곳을 고도각 5° 이상에서 보는 것은 없다. |
| geo.facts | [LON] · 고도각 38.2° · 10분마다 |
| geo.images | 지난 일주일 이미지 **[N]**장 / 최근 [D]일 이미지 **[N]**장 (num() on the count, 장 after it as text) |
| geo.replay / replayLabel | 다시 보기 / [SAT]: 최신 이미지 다시 보기 |
| geo.frame | 찾는 중… · 공개 이미지 없음 · 품질 낮음 · 지금은 이미지 없음 · 불러오지 못함 |
| geo.frameAlt | [SAT]: 이 장소 주변의 최신 프레임 / [SAT]: 이 장소 주변의 최신 적외선 프레임 |
| geo.infraredChip / infraredTitle | 적외 / 적외선: 구름 꼭대기를 온도로 나타낸다. 차가울수록 밝다. |
| timeline.title / meta / zoneChange | 타임라인 / [N]일 · [ZONE] · [ABBR] / [A] → [B] |
| timeline.daylight / now | 이곳의 낮 / 지금 |
| timeline.summary | 타임라인, [N]일: 지켜봤다 31회, 아마 지켜봤다 4회, 여기를 볼 수도 있었다 120회, 상공을 지나갔다 12회. |
| timeline.keysHint | [SUMMARY] 왼쪽, 오른쪽 화살표 키로 통과를 하나씩 넘길 수 있다. |
| timeline.geoLane | `[strong('정지궤도 · '), '[N]']` |
| timeline.geometry | 기울기 5.4° · 61 km |
| timeline.markMosaic / markRadar / markImaged | 일일 합성 이미지, 375 m · ● / 레이더 이미지, 20 m · ◆ / [TITLE] · ◆ |
| timeline.markKind | [TITLE] · 공개 관측 위성 · ◇ / 상업 · □ / 레이더 · ▣ / 기상 · ○ / 유인 · ✛ / 기타 |
| replay.scrubLabel / scrubValue | 통과 안의 장면 시각 / T−00:42, 16:14:21 UTC |
| replay.play / pause / speed | 다시 보기 재생 / 다시 보기 일시정지 / 재생 속도 |
| replay.inView / closest | 시야 안 [DURATION] / 최근접 |
| replay.spaceKey / playPause / stepKind | 스페이스 / 재생 / 일시정지 / 이 분류의 이전 / 다음 통과 |
| plan.label | 평면도: [SAT] 위성의 지상 궤적. 최근접 시점에 이 장소에서 [KM] km. |
| plan.northUp / fieldOfRegard / swath / groundTrack | 평면도 · 북쪽 위 / 지향 범위 ±30° / 관측 폭 290 km / 지상 궤적 |
| plan.scale / closest | 1 km / 최근접 61 km (under 1 km: 최근접 < 1 km) |
| product | 일일 합성 · 375 m · 지구 전면 · 2 km · 적외선 · 2 km · Sentinel-2 L2A · 10 m · Landsat C2 L2 · 30 m · Sentinel-1 레이더 · 20 m |
| pixel | 10 m · 2 km |
| timelapse.title / sub | 타임랩스 / 해마다 본 이곳 |

**`pass`**

| key | ko |
|---|---|
| compass16 | 북 · 북북동 · 북동 · 동북동 · 동 · 동남동 · 남동 · 남남동 · 남 · 남남서 · 남서 · 서남서 · 서 · 서북서 · 북서 · 북북서 (the KMA's wind directions) |
| compass8, both tables | 북쪽 · 북동쪽 · 동쪽 · 남동쪽 · 남쪽 · 남서쪽 · 서쪽 · 북서쪽 |
| geo.sits | [SAT] 위성은 지나가지 않는다. 적도 상공 [ALT], [SEAT]에 머물며 [N]분마다 아래로 보이는 지구 전면을 훑는다. (no seat: 적도 상공 [ALT]에 머물며 …; no cadence: …머물며 아래로 보이는 지구 전면을 훑는다.) `seat` arrives as "0.2°W": the ko message rewrites it to 서경 0.2° / 동경 140.8° in prose. |
| geo.reached | 이번 스캔 선은 [TIME]쯤 [PLACE]에 닿았고, [DIR8]으로 이동 중이었다. |
| geo.infrared | 이곳은 어두웠다. 그래서 이 이미지는 적외선이다. 구름 꼭대기를 온도로 나타내며, 차가울수록 밝다. |
| crossed, mosaic, radarImaged, lookingDown, lookingOff, cloudCover | §3.4 |
| likely.crossed, likely.notYet | §3.4 |
| likely.archiveFailed | 낮이었으므로 이 지점을 기록했을 것이다. 지금은 아카이브를 검색할 수 없었다. |
| likely.noScene | 이번 통과의 장면은 없다. Sentinel-2는 육지와 연안 수역만 기록하며, 이 지점을 관측 계획에 넣지 않았을 수 있다. |
| likely.dark | 여기는 어두웠다. 기상위성의 센서는 밤에도 적외선으로 계속 훑는다. 그래서 거리가 아니라 구름을 봤다. |
| likely.mosaicUnconfirmed | 이번 통과의 NASA 일일 합성 이미지가 이 지점에서 확인되지 않았다. |
| likely.notPublished | 이 위성의 이미지는 일기예보에 쓰인다. 여기서 보여 줄 수 있는 이미지로는 공개되지 않는다. |
| could.withinView | [SAT] 위성은 [TIME]에 이곳이 보이는 범위를 지나갔다. 이곳에서 [DIR8]으로 [DIST] 떨어진 곳이었다. (no offset: [SAT] 위성은 [TIME]에 이곳 바로 위를 지나갔다.) |
| could.insideSwath | [PLACE] 일대는 관측 폭 [SWATH] 안에 있었다. 운영사는 어디를 찍었는지 공개하지 않는다. 그래서 실제로 찍었는지는 알 수 없다. |
| could.radar | 레이더는 구름과 어둠을 뚫고 본다. 옆으로 [DEG] 비스듬히 향했다면 [PLACE] 일대를 담을 수 있었다. + 이번 통과에서 공개된 이미지는 찾지 못했다. / 실제로 그랬는지는 알 수 없다. (no angle: 레이더는 구름과 어둠을 뚫고 본다. [PLACE] 일대를 담을 수 있었다. …) |
| could.camera | 바로 아래에서 [DEG] 기울였다면 [PLACE] 일대를 지켜볼 수 있었다. 실제로 그랬는지는 알 수 없다. (no angle: 바로 아래를 보고 있었다면 …) |
| overhead | §3.4 |
| darkStation | 이곳은 어두웠다. 우주정거장이 아직 햇빛을 받고 있었다면, 깜빡이지 않는 밝은 점으로 이곳 하늘을 가로질렀을 것이다. |

**`verdicts`**: §3.5. Every `unit(n)` returns 회.

**`passView`**

| key | ko |
|---|---|
| empty | 추적 중인 어떤 위성도 이 기간에 이곳을 지나가지 않았다. 드문 일이다. 데이터 출처가 멈췄다면 위의 주석에 적혀 있다. |
| imagedOrder | 가장 자세한 모습부터, 이후 최신순 |
| count / countStack | [N]회 / `num(f.int(n), '회')` (a stacked readout: the counter may be the unit here) |
| sats | 위성 [N]기 |
| showAllSats | 위성 [N]기 모두 보기 |
| showAllRows | [N]개 모두 보기 |
| showMore / left / showFewer | [N]개 더 보기 / [N]개 남음 / 접기 |
| tag | 합성 · 레이더 · 구름 · 85% · 구름 · 지점 |
| rowLabel | [SAT], [VERB], [DAY_SPOKEN] [TIME] [ZONE], [AGO], 구름 25퍼센트, 구름에 가림 |
| offNadir / offNadirShort / distanceKm / cloudPct | 기울기 5.4° / 8.9° / 61 km / 구름 25% |
| expandLabel / expandTitle | 이미지 크게 보기: [SAT], [DAY] [TIME] / 크게 보기 |
| satLabel | [SAT], [OPERATOR], 통과 [N]회, 최근 [DAY_SPOKEN] [TIME] |
| latest / closest / cloudChip | `'최근 '` / `'최근접 '` / 구름 |
| photosSection / planSection / geometry / replay | 이미지 / 평면도 / 기하 / 다시 보기 |
| fullDiscNote | 지구 전면 이미지: 위성이 볼 수 있는 모든 것을 한 장에 담은 이미지다. 이곳에서는 픽셀 하나가 [PIXEL]다. 거칠지만 실제 이미지이고, 공개된 것 중 가장 최신이다. 이 위성은 일주일 내내 [N]분마다 이런 이미지를 찍었다. (unknown cadence: 몇 분마다) |
| mosaicNote | 일일 합성 이미지: NASA가 하루 동안의 관측 폭을 한 장으로 이어 붙인 이미지다. 픽셀당 [GSD]. 거칠지만 실제 이미지이고, 이번 통과가 있던 날의 것이다. |
| radarNote | 레이더 이미지이지 사진이 아니다. Sentinel-1은 마이크로파를 쏘고 그 반사파를 기록하므로, 구름과 어둠에 막히지 않는다. 밝기는 지면이 전파를 얼마나 강하게 되돌려 보내는지를 나타낸다. 건물과 거친 지면은 밝고, 잔잔한 물은 어둡다. |
| noImage.openArchive | [SAT] 위성이 이번 통과에서 이 지점을 찍은 이미지는 없다. 통과 평면도를 보여 준다. |
| noImage.radarPrivate | 공개 이미지 없음: 이 레이더 운영사의 아카이브는 비공개다. 통과 평면도를 보여 준다. |
| noImage.commercialPrivate | 공개 이미지 없음: 상업 아카이브는 비공개다. 통과 평면도를 보여 준다. |
| noImage.noneToShow | 이번 통과에 보여 줄 이미지가 없다. 통과 평면도를 보여 준다. |
| noImage.archiveDown | 지금은 아카이브를 검색할 수 없었다. 통과 평면도를 보여 준다. |
| noImage.noScene | 이번 통과의 장면은 없다. 통과 평면도를 보여 준다. |
| noImage.notYet | 이번 통과와 맞는 공개 장면이 아직 없다. Sentinel-2와 Landsat 장면은 보통 하루 안에 올라온다. |
| noImage.crewed | 우주정거장에도 카메라가 있지만, 그 사진은 장소와 시각별로 공개되지 않는다. |
| noImage.unavailable | 이번 통과의 이미지를 불러올 수 없다. |
| links | 이미지 열어서 저장 · 저장 중… · 이미지 저장 · 원본 보기 · [ARCHIVE] |
| spot | 이 지점의 픽셀을 읽는 중… · 이 지점 위는 맑았다. · 이 지점 위에 얇은 권운이 표시됐다. 이미지가 조금 흐릴 수 있다. · 이 지점 위에 구름이 있었다. · 이 지점은 구름 그림자 속이었다. |
| strip | 고도 · 고도각 · 기울기 · 픽셀 · 밴드 · 태양 · 구름양 · 지점 구름 |
| band / spotValue | 적외선 · 가시광 · 컬러 / 맑음 · 권운 · 구름 · 그림자 |
| unit | km · m · km/s · up 위 · mosaic 합성 · scene 장면 · sun 낮 / 박명 / 밤 |
| geo.* | 최근접 시각 · UTC · 최근접 시각 · 현지 · 지상 거리 · 고도각 · 지상 속도 · 진행 방향 · 태양 고도 · 지향 범위 · 관측 폭 · 관측 폭 안 · 시야 안 · 기간 · NORAD · 통과 · 스캔 선 도달 · UTC · 스캔 선 도달 · 현지 · 적도 위 경도 · 이곳 하늘 · 스캔 방향 · 이곳 스캔 속도 · 관측 범위 · 이번 스캔 · NORAD · 스캔 |
| northToSouth / southToNorth / timeRange | 북 → 남 / 남 → 북 / [A] → [B] |
| sunPhase / fullDisc / everyMin | 낮 · 박명 · 밤 / 지구 전면 / [N]분마다 |
| upCompass / heading | 위 · [DIR16] / [DIR16] · 북행, [DIR16] · 남행 |

**`engine`**

| key | ko |
|---|---|
| progress.loadingCatalog | 궤도 카탈로그 불러오는 중 |
| progress.catalog | 카탈로그 · 물체 16,917개 |
| progress.propagateStart | 궤도 412개 계산 중 · 7일 |
| progress.propagating | 궤도 계산 중 · 212 / 412 |
| progress.searchingArchives | Sentinel-2 + Landsat 아카이브 검색 중 |
| progress.matching | 장면 12개와 통과 31회 대조 중 |
| progress.verifyingWeatherStart / verifyingWeather | NASA 기상 합성 이미지 확인 중 / NASA 기상 합성 이미지 확인 · 12 / 35 |
| progress.done | 통과 31회 · 이미지 29장 |
| note.archiveSlow | Sentinel-2와 Landsat 아카이브의 응답이 너무 늦어, 통과는 궤도 계산만으로 보여 준다. |
| note.archiveDown | Sentinel-2와 Landsat 아카이브에 연결하지 못해, 통과는 궤도 계산만으로 보여 준다. |
| note.sentinel2Thumbnails | Sentinel-2 목록은 Earth Search에서 받았다. 일부 장면은 잘라 낸 부분이 아니라 장면 전체의 작은 이미지로 보인다. |
| note.sentinel2EarthSearch | Sentinel-2 목록은 Earth Search에서 받았다(Planetary Computer 검색 불가). |
| note.sentinel2Down / landsatDown | Sentinel-2 아카이브에 연결할 수 없다. Sentinel-2 이미지가 빠졌을 수 있다. / Landsat 아카이브에 연결할 수 없다. Landsat 이미지가 빠졌을 수 있다. |
| note.openOcean | 이 지점은 Sentinel-2의 관측 계획 밖(먼바다)이다. |
| note.elementsOld | 궤도 요소가 [N]일 전 것이어서, 통과 시각이 몇 분 어긋날 수 있다. |
| note.elementsNewer | 이 통과들은 그 뒤에 나온 궤도 요소로 다시 계산했다. 그래서 시각이 몇 분 어긋날 수 있다. |
| note.gibsUnconfirmed | NASA GIBS가 VIIRS 이미지 [N]장을 제때 확인하지 못했다. VIIRS는 날마다 지구 전체를 관측하므로, 해당 통과는 ‘지켜봤다’로 센다. |
| note.gibsSlowAll / gibsDownAll | NASA GIBS가 제때 응답하지 않아 기상위성 이미지는 보여 주지 않는다. / NASA GIBS에 연결할 수 없어 기상위성 이미지는 보여 주지 않는다. |
| note.gibsSlowSome | NASA GIBS가 기상위성 이미지 [T]장 중 [M]장을 제때 보내지 않았다. 해당 통과는 ‘아마 지켜봤다’로 보여 준다. |
| note.gibsDownSome | NASA GIBS가 기상위성 이미지 [T]장 중 [M]장을 보내지 못했다. 해당 통과는 ‘아마 지켜봤다’로 보여 준다. |

Progress rows are one mono line of about 40 Latin widths on a 390 px phone; a Hangul syllable in the fallback sans is
about 1.6 of them, so keep each row to about 22 syllables plus digits. They are cut with an ellipsis, never reworded
by code.

**`gallery`**

| key | ko |
|---|---|
| barLabel / filterLabel | 이미지 / 표시할 이미지 |
| filter | 전체 · 상세 · 기상 · 레이더 |
| filterTitle | 모든 이미지. 가장 자세한 모습 다음은 최신순 · Sentinel-2와 Landsat, 픽셀당 10~30 m · 일일 기상 합성 이미지, 픽셀당 250 m 이상 · Sentinel-1 레이더 이미지, 픽셀당 20 m. 구름을 뚫고, 밤낮없이 |
| system.counter | 3 / 27 (every visual counter; no date here takes a slash, decision 23, so it never reads as one; checked 2026-11-22) |
| photosThisWeek / photosThatWeek | 지난 일주일 [N]장 / 그 일주일 [N]장 |
| prevPhoto / prevTitle / nextPhoto / nextTitle | 이전 이미지 / 이전(←) / 다음 이미지 / 다음(→) |
| carousel / trackLabel / slide | 캐러셀 / 이 장소의 이미지. 밀어서 더 보기 / 슬라이드 |
| lead | 가장 자세한 모습 · 마지막 맑은 모습 · 구름에 가림 |
| slideLabel | [LEAD]: [SAT], [DAY] [TIME], 이미지 [N]장 중 [K]번째 |
| replayLabel | 지구본에서 이 통과 다시 보기: [SAT], [DAY] [TIME] |
| replay | `[strong('이 통과 '), '다시 보기']` (tablets show the whole; phones and laptops 다시 보기) |
| viewLabel | 마지막 맑은 모습 크게 보기: [SAT], [DAY] [TIME] / 이미지 크게 보기: [SAT], [DAY] [TIME] |
| view / sharePass / radarTag | 보기 / 이 통과 공유 / 레이더 |
| noteMostlyCloud / noteLastClear | 지난 일주일의 통과는 대부분 구름만 봤다 / 마지막 맑은 모습 |
| clouded | 구름에 가림 · 85% · 구름에 가림 · 이 지점도 구름 · 이 지점 구름 |
| status | 구름 · 85% · 지점 구름 · 맑음 · 얇은 권운 · 구름 그림자 · 구름 25% · 일일 합성 |
| cropKm / scaleKm | 6.3 km / 1 km |
| photoAlt | [SAT] 위성이 찍은 [PLACE] 일대 이미지. 가운데가 이 장소다. |
| acquiring / noImage / retry | 포착 중 / 이미지를 받지 못함 / 다시 시도 |
| north | N |
| expandLabel / expandTitle | 이미지 크게 보기 / 크게 보기(F) |
| stillRendering | 아직 렌더링 중. 큰 장면은 10초 넘게 걸릴 수 있다. |
| cropMissing | 아카이브가 이 부분을 보내지 않았다. 바쁜 것일 수 있다. 이미지 자체는 그대로 있다. |
| scanLine | `['라인 ', strong(line), ' → ' + lines]` |
| awaiting | 통과 대기 / 스캔 대기 |

**`lightbox`**

| key | ko |
|---|---|
| dialogLabel | 이미지 |
| spokenPosition | 이미지 [N]장 중 [K]번째 (+ , 가장 자세한 모습 / , 구름에 가림) |
| spokenLastClear | 지난 일주일보다 앞선 마지막 맑은 모습 |
| timelapseLabel / timelapse | 이 장소의 타임랩스, 해마다 / 타임랩스 |
| zoomOut / zoomOutTitle / zoomIn / zoomInTitle / zoom | 축소 / 축소(−) / 확대 / 확대(+) / 2.5× |
| close / closeTitle | 이미지 보기 닫기 / 닫기(Esc) |
| perPixel | 픽셀당 [PIXEL] |
| panTitle / panProduct | Landsat 15 m 전정색 밴드로 선명화 / Landsat C2 L2 + L1 전정색 · [PIXEL] |
| status | 구름 · 85% (no pct: 구름) / 이 지점 맑음 |
| replayLabel / replay | 지구본에서 이 통과 다시 보기 / 다시 보기 |
| shareLabel / share | 이 이미지 공유 / 공유 |
| filmstripLabel / thumbLabel | 모든 이미지 / [N]번째 이미지 |

**`timelapse`**

| key | ko |
|---|---|
| dialog / title / close / escKey | [PLACE] 타임랩스 / 타임랩스 / 닫기 / Esc |
| play / pause / slider / frameList | 재생 / 일시정지 / 프레임 / 프레임 목록 |
| date / dayMonth / readout | 2015.10.22 / 10월 22일 / 2015.10.22 · Sentinel-2A |
| frameSpoken | 프레임 [N]장 중 [K]번째: 2015년 10월 22일 |
| captionYearly | 맑은 모습 [N]장 · 해마다 1장 |
| captionSeason | 맑은 모습 [N]장 · 해마다 겨울에 1장 / 봄에 / 여름에 / 가을에 |
| captionGathering | 해마다 맑은 모습 1장 · [YEAR]년부터 |
| captionShort / captionError | 이곳의 타임랩스 없음 / 아카이브 응답 없음 |
| note | 모든 프레임은 Sentinel-2가 찍은 가로세로 [KM] km의 같은 땅으로, 여기 있는 다른 사진처럼 색을 보정했다. 해마다 다른 계절을 고르고, 맑은 모습이 없는 해는 뺀다. |
| noteOneSeason | 모든 프레임은 Sentinel-2가 찍은 가로세로 [KM] km의 같은 땅으로, 여기 있는 다른 사진처럼 색을 보정했다. 모든 해가 같은 계절이고, 그 계절에 맑은 모습이 없는 해는 뺀다. |
| source | Copernicus Sentinel-2, Planetary Computer 경유 |
| listing / choosing / developing | 아카이브 목록 확인 중 / 맑은 모습 고르는 중 / 프레임 현상 중 (현상: a film being developed) |
| choosingProgress / developingProgress | 맑은 모습 고르는 중, 장면 [T]개 중 [K]개 / 프레임 현상 중, [T]장 중 [K]장 |
| tooCloudy | 구름이 너무 잦아 이곳은 타임랩스를 만들 수 없다. |
| tooFew | [YEAR]년부터 맑은 모습 [N]장 · [NEEDED]장 필요 (zero: [YEAR]년부터 맑은 모습 없음 · 3장 필요) |
| noAnswer / unreachable / retry | 아카이브가 응답하지 않았다. / Planetary Computer에 연결할 수 없음 / 다시 시도 |
| share / linkCopied / shareTitle | 공유 / 링크 복사됨 / 해마다 본 [PLACE] |
| video / rendering / videoFailed / saveVideo | 동영상 / 만드는 중 42% (padded: 만드는 중 05%) / 만들기 실패 / 동영상 저장 |
| noH264 | 이 브라우저에는 H.264 인코더가 없다. 파일은 Chrome과 Firefox에서 재생된다. |
| fileNamePlace | place |

**`share`**

| key | ko |
|---|---|
| titlePass / titleImage / titleWeek | 이 통과 공유 / 이 이미지 공유 / 지난 일주일 공유 |
| close / closeTitle | 닫기 / 닫기(Esc) |
| shareImage / preparingImage / share | 이미지 공유 / 이미지 준비 중… / 공유 |
| copyLink / copied / postToX / copyImage / savePng / tryAgain | 링크 복사 / 복사됨 / X에 게시 / 이미지 복사 / PNG 저장 / 다시 시도 |
| linkLabel / postLabel | 링크 / 게시글 |
| directLink | 직접 링크: 지금은 짧은 링크를 만들 수 없다 |
| creatingLink / linkLater | 링크 생성 중… / 공유할 때 생성 |
| renderFailed | 이 브라우저에서는 카드를 그리지 못했다. 링크는 그대로 쓸 수 있다. |
| post.*, hookWatched, hookPassed, credit | §3.6 |
| pngName / weekPngName | ASCII slugs, as English. A Hangul place slugs to nothing: the code falls back to `place` (as `timelapse.fileNamePlace`) or the coordinates. Not a translator's job. |

**`card`** (in `api/_lib/i18n/card/ko.ts`)

| key | ko |
|---|---|
| headline, headlineBy, headlineWeek | §3.6 |
| photos | 이미지가 [N]장 공개됐다. / 이미지가 최소 [N]장 공개됐다. / 공개된 이미지는 없다. |
| archiveDown / archiveDownShort | 이미지 아카이브가 응답하지 않아, 지금은 공개 이미지를 셀 수 없다. / 이미지 아카이브가 응답하지 않았다. |
| cloud.only | sub 구름에 가렸다. 구름만 보였다. · chip 구름에 가림 · 92% · post 구름만 보였다. · desc 구름만 보였다(92%). |
| cloud.mostly | sub 대부분 구름: 장면의 85%. · chip 대부분 구름 · 85% · post 대부분 구름이었다(85%). · desc 대부분 구름이었다(85%). |
| cloud.spot | sub 이 지점 위에 구름이 있었다. · chip 지점 위 구름 · post 구름이 이 지점을 덮었다. · desc 구름이 이 지점을 덮었다. |
| stamp / weekTo / lastWeek | 2026.11.1(일) · 11:21 EST / 2026.11.1(일)까지 7일 / 최근 7일 |
| readout | 고도 · 고도각 · 속도 · 기울기 · 픽셀 · 합성 픽셀 · 최근접 거리 |
| lane | 이미지 · 추정 · 가능 · 상공 |
| unit / decimal | km · m · km/s / `f.dec(n, digits)` |
| pixelSize / distance / scale | 10 m · 0.31 m · 2 km / 61 km / 1 km · 500 m |
| geometry | 통과 기하 · 북쪽 위 |
| note | 이미지는 앱에서 볼 수 있음 · 지금은 이미지를 받을 수 없음 · 상업 아카이브, 비공개 · 관측 폭 안, 공개 이미지 아직 없음 · 최근접 시점의 지상 궤적 |
| acquiring / noPublicPhoto / noPhoto | 포착 중… / 지난 일주일 공개 이미지 없음 / 보여 줄 이미지 없음 |
| look / lookDay | 가장 자세한 모습 · 마지막 맑은 모습 · 구름에 가림 · 레이더 / 11월 3일 |
| aSatellite / invite | 이름 미상 위성 / 무엇이 나를 지켜봤을까 |
| hero / enterAnyPlace / defaultPlace | §3.1 / 지구 어디든 입력 / 팜 주메이라 |
| defaultAlt | Sentinel-2 위성이 실제로 찍은 두바이 팜 주메이라 사진. 옆에 ‘무언가 당신을 지켜봤다. 지구 어디든 입력’이라는 문구가 있다. (it must quote the card hero: keep the two in step) |
| page.* | §3.6 |
| crossed | [SAT] 위성이 [DATE] [TIME] [ZONE]에 고도 [ALT]에서 [PLACE] 상공을 지나갔다. [DIR8]을 향해 이동 중이었다. (each part may be missing: no time, no altitude (…[PLACE] 상공을…), no heading (one sentence)); [DATE] is 2026년 11월 1일(일) |
| withinView | [SAT] 위성이 [DATE] [TIME] [ZONE]에 [PLACE] 일대가 보이는 곳을 지나갔다. [DIR8]을 향해 이동 중이었다. |
| couldHave | 이쪽을 볼 수도 있었다. 실제로 봤는지 운영사는 밝히지 않는다. |
| straightDown / offNadir / cloudCover | 바로 아래를 보고 있었다. / 바로 아래에서 [DEG]° 비스듬히 보고 있었다. / 구름양: [PCT]%. |
| inSwath | [PLACE] 일대는 관측 폭 안에 있었다. |
| bestFrom | 가장 자세한 모습은 [SAT] 위성이 찍었다. · 마지막 맑은 모습은 [SAT] 위성이 찍었다. · 첫 이미지는 [SAT] 위성이 찍었다. |
| question | §3.6 |
| cardAlt | 공유 카드. 지난 일주일의 가장 자세한 이미지는 [SAT] 위성이 찍었다. / 공유 카드. |

In every card sentence, `sat` undefined goes through `named()` (§5.3): 이름 미상 위성이 찍었다.

**`about`**

| key | ko |
|---|---|
| bar / close / sectionsLabel | 소개 / 닫기 / 목차 |
| title | `[['이렇게'], [accent('돌아간다'), '.']]` (돌아가다: "to work, to run", and "to go round", which everything on this page does; the lede uses it too) |
| lede | 지구 위 한 지점을 고르면, Watched가 지난 일주일 동안 어떤 위성이 그 상공을 지나갔는지 계산하고, 그 위성들이 찍은 이미지를 찾아온다. 모든 과정은 브라우저에서, 공개 데이터로 돌아간다. (계산하다 takes an orbit, a time or an embedded question, never 위성을) |
| sections | 00 짧게 말하면 · 01 통과를 찾는 방법 · 02 분류가 뜻하는 것 · 03 보이지 않는 것 · 04 개인정보 · 05 크레딧 · 06 키보드 |
| short.live | 실시간일까? / 꼭 그렇지는 않다. 이미지는 찍힌 뒤 몇 시간에서 이틀쯤 지나야 아카이브에 올라온다. 그래서 가장 최근 통과에는 아직 이미지가 없을 수 있다. |
| short.seeMe | 내가 보일까? / 안 보인다. 여기서는 픽셀 하나가 아무리 작아도 10 m다. 자동차 한 대가 픽셀 하나다. 당신은 그보다 작다. |
| short.every | 이게 위성 전부일까? / 전부는 아니다. 군사 위성과 정찰위성은 대부분 공개 카탈로그에 없다. 기업들은 카메라를 어디로 돌리는지 밝히지 않는다. |
| method.orbits | `['궤도에 있는 모든 물체에는 그 경로를 나타내는 공개된 숫자 묶음이 있다. ', link('CelesTrak'), '이 미국 우주군의 추적 자료로 이를 공개하고, Watched는 6시간마다 새로 받아 온다.']` |
| method.loaded | `['이 페이지는 물체 ', num(n), '개를 불러왔다(받은 시각 ', num(stamp), ').']` |
| method.sgp4 | 각 위성의 지난 7일 궤도를 표준 궤도 모델인 SGP4로 계산하고, 이 지점이 위성의 시야 안에 든 때를 모두 기록한다. (the window inside the object: 지난 7일 동안 right before 계산하고 reads as how long the computing took) |
| facts.straightDown | 바로 아래 / Sentinel-2와 Landsat은 바로 아래의 띠 모양 땅을 본다. 폭은 Sentinel-2가 약 290 km, Landsat이 약 185 km다. 이 띠 안에 있어야 한다. |
| facts.tilting | 기울이는 카메라 / 상업 위성 상당수는 30~45도까지 기울일 수 있다. 그 범위 안에 있었다면 ‘여기를 볼 수도 있었다’로 분류한다. |
| facts.daylight | 낮 / 일반 카메라에는 햇빛이 필요하다. 어둠 속 통과는 사진으로 세지 않는다. |
| facts.radar | 레이더 / Sentinel-1에는 햇빛이 필요 없다. 마이크로파를 쏘고 그 반사파를 기록하므로, 구름을 뚫고 밤에도 본다. 시선은 궤도 한쪽 옆으로 비스듬히 향한다. 이미지도 공개되므로 회색으로 보여 준다. 밝은 곳은 거친 지면과 건물, 어두운 곳은 잔잔한 물이다. |
| facts.weather | 기상위성 / 몇몇은 적도 위에 머물며 10분마다 지구의 절반을 지켜본다. 그 절반 안에 있다면 모든 프레임에 들어 있다. |
| archives | 그다음 이미지 아카이브(Microsoft Planetary Computer, Element 84, NASA(미국 항공우주국))를 검색해, 각 이미지를 그것을 찍은 통과와 짝짓는다. → write: 각 이미지를 찍은 통과와 짝짓는다. 보이는 이미지는 모두 실제 이미지를 이 지점 주변으로 잘라 낸 것이다. |
| photoFacts.touchUps | 보정 / Sentinel-2와 Landsat 사진은 화면에 맞춰 색 균형을 잡고, 매끄럽게 다듬은 뒤 살짝 선명하게 한다. 사진 전체에 같은 방식으로 적용한다. 더하거나 빼는 것은 없다. |
| photoFacts.whichWayUp | 어느 쪽이 위인가 / Sentinel-2와 Landsat 사진은 아카이브의 지도 격자를 그대로 쓴다. 그래서 북쪽이 정확히 위에서 몇 도 어긋날 수 있다. 이미지를 열면 N 화살표가 정확한 방향을 가리킨다. |
| verdictMore | §3.5 |
| accuracy.positions | 정확한 위치 / 공개 궤도 자료의 오차는 약 1 km이고, 날마다 조금씩 커진다. 시각은 몇 초 틀릴 수 있다. |
| accuracy.secret | 비밀 위성 / 궤도에서 가장 좋은 카메라 가운데 일부는 군대의 것이다. 여기에는 나오지 않는다. |
| accuracy.clouds | 구름 / 구름만 찍힌 사진이 많다. 아카이브가 알려 주면 이 지점 바로 위의 픽셀을 확인하고 그렇다고 밝힌다. |
| accuracy.delays | 지연 / 사진이 올라오기까지 하루이틀 걸릴 수 있다. |
| privacy.where | 계산되는 곳 / 궤도 계산은 브라우저 안에서 이뤄진다. |
| privacy.kept | 남기는 것 / Watched는 검색을 도시와 약 10 km 크기의 구역 단위로만 세고, 정확한 지점은 남기지 않는다. 무엇이 열리고 공유됐는지도 집계한다. IP 주소도, 자체 쿠키도, 한 방문과 다음 방문을 잇는 정보도 남기지 않는다. |
| privacy.others | 다른 곳이 보는 것 / 대부분의 장소 이름은 사이트에 내장된 목록에서 나온다. 그 밖의 검색은 Open-Meteo, Photon 또는 Nominatim으로 간다. 이미지는 아카이브에서 바로 불러온다. 호스팅 업체는 쿠키 없이 페이지 조회 수와 속도를 집계하고, 사람과 봇을 구분하려고 보안 쿠키 하나를 둘 수 있다. Watched는 그 쿠키를 읽지 않는다. |
| privacy.links | 공유 링크 / 무언가를 공유할 때만 만든다. 링크가 있으면 누구나 장소 이름, 약 1 km 단위로 반올림한 지점, 고른 통과를 볼 수 있다. |
| credits.madeBy | 만든 사람 / `['Armaan, X ', link(handle)]` |
| credits.gibs | 이미지: NASA(미국 항공우주국)의 GIBS(EOSDIS의 일부). GOES는 NOAA(미국 해양대기청)와 CIRA, Himawari는 JMA(일본 기상청) 제공. |
| credits.archives | 아카이브 / Microsoft Planetary Computer와 Element 84 Earth Search. Landsat의 15 m 밴드는 Copernicus Data Space Ecosystem에서 받았다. |
| credits.orbits | 궤도 / 궤도 요소는 CelesTrak, SGP4는 satellite.js. |
| credits.placeNames | 장소 이름 / komoot의 Photon. 지도 데이터 © OpenStreetMap contributors (ODbL). |
| credits.textures | 지구 텍스처 / Solar System Scope(CC BY 4.0), NASA Blue Marble과 Black Marble 기반. |
| credits.type | 서체 / Instrument의 Instrument Sans와 Serif, Evil Martians의 Martian Mono(SIL OFL). |
| keys | 장소 검색 · 추천 목록 이동 · 선택 · 통과 넘기기 · 이전 / 다음 이미지 · 이미지 크게 보기 · 확대 / 축소(크게 볼 때) · 다시 보기 재생 또는 일시정지 · 뒤로 또는 닫기 · 이 페이지 |
| keyNames | Enter · 스페이스 · Esc |
| builtBy / footerNote | `['만든 사람 ', link(handle)]` / 공개 데이터로 만들었다. 여기 있는 이미지는 하나도 직접 찍지 않았다. |

(For `archives`, the final string is: 그다음 이미지 아카이브(Microsoft Planetary Computer, Element 84, NASA)를 검색해,
각 이미지를 찍은 통과와 짝짓는다. 보이는 이미지는 모두 실제 이미지를 이 지점 주변으로 잘라 낸 것이다. NASA's
Korean name goes once on the page, in `credits.gibs`. Agency names elsewhere stay Latin acronyms; on About only, the
first mention of NASA, NOAA, JMA, ESA or EUMETSAT may carry the Korean name in parentheses: 미국 항공우주국, 미국
해양대기청, 일본 기상청, 유럽우주국, 유럽기상위성기구. The licence lines stay English.)

**`app`, boot text, `hud`, `globe`, `time`, `geo`, `system`, `switcher`**

| key | ko |
|---|---|
| app.documentTitle, boot title | Watched · 무언가 당신을 지켜봤다 |
| boot loading / slow | Watched 불러오는 중 / 연결이 느려 아직 불러오는 중 |
| app.notice.label / fallback | 오류 / 문제가 생겼다. |
| app.notice.tryAgain / trying / back | 다시 시도 / 다시 시도 중… / 처음으로 (it goes to the landing; 뒤로 would mean "previous") |
| app.faults.catalog | 궤도 카탈로그를 불러오지 못했다. 연결을 확인하고 다시 시도하면 된다. |
| app.faults.compute | 이 장소의 통과를 계산하다가 문제가 생겼다. 잠시 후 다시 시도하면 된다. |
| app.progress.catalog / done | 궤도 요소 불러오는 중 / 보고서 준비됨 |
| hud.about / home | 작동 방식 / Watched, 처음으로 |
| hud.regionTime / regionCatalog / regionSun | 시각 / 궤도 카탈로그 / 태양 |
| hud.scene / sun / subsolar / gmst | 장면 / 태양 16.2°S 063.0°E / 태양 직하점 / GMST 18:41:50 |
| hud.objects / objectsPending / catalog | 물체 16,893개 / 물체 / 카탈로그 |
| hud.fetched / catalogAge | 수신 2026-11-08 03:34Z / 방금 · 42분 전 · 5시간 전 · 3일 전 · stale: 오래됨, 3일 전 |
| hud.catalogUnavailable / catalogLoading | 카탈로그를 불러오지 못함 / 카탈로그 불러오는 중 |
| globe.noradName / calloutMeta* | NORAD [ID] / NORAD [ID] · [ALT] km (as the English) |
| globe.imaged / imagedAbout | 포착 [TIME] [ZONE] / 포착 ≈ [TIME] [ZONE] |
| globe.acquired / acquiredAbout | 포착 [TIME] [ZONE] · [RES] / 포착 ≈ [TIME] [ZONE] · [RES] |
| globe.resolutionM / resolutionKm | [N] m / [N] km (CSS uppercases the Latin) |
| globe.acquisitionOf / closestApproachOf | 포착 · [SAT] / 최근접 · [SAT] |
| globe.acquiredNow / closestApproachNow | 포착 / 최근접 |
| globe.pin.card / naming / noName | 꽂은 핀 / 이 지점 이름 찾는 중 / 근처에 이름 있는 곳 없음 |
| globe.pin.placeTitle | [NAME], [AREA] |
| globe.pin.searchAria / searchTitle | [PLACE] 상공을 지나간 위성 보기 / 여기서 검색(Enter) |
| globe.pin.removeAria / removeTitle | 핀 빼기 / 핀 빼기(Esc) |
| globe.pin.moveHint | 지구본 아무 곳이나 길게 눌러 옮기기 |
| globe.pin.droppedAt | [COORDS]에 핀을 꽂았다. |
| globe.pin.droppedIn | [PLACE]에 핀을 꽂았다. Enter나 화살표를 누르면 그 상공을 지나간 위성이 보인다. |
| globe.pin.droppedUnnamed | 핀을 꽂았다. Enter나 화살표를 누르면 그 상공을 지나간 위성이 보인다. |
| globe.noGl | 3D 보기 불가 / 이 브라우저에서 WebGL 2가 꺼져 있다 |
| time.* | §6.3 |
| geo.where | [REST], [COUNTRY] (Ontario, 캐나다): the rest is English data written specific-first; never move the country to the front |
| system.close / expandPanel / collapsePanel | 닫기 / 패널 펼치기 / 패널 접기 |
| switcher.title / trigger | 언어 / 언어: 한국어. 변경 |

**`sats` (satellite blurbs)**

One line each, as the English: a noun phrase with a colon (명사형 종결) or one 한다체 sentence. The instrument class
stays 이미저 in blurbs (Copernicus 다중분광 이미저); in prose sentences it is 센서. Numbers grouped as 3,040 km, 1.1 km.

| English | ko |
|---|---|
| multispectral | 다중분광 |
| panchromatic | 전정색 ("50 cm panchromatic pixels" → 전정색 픽셀 50 cm) |
| N bands / spectral bands | 밴드 N개 / 분광 밴드 N개 |
| polar weather satellite | 극궤도 기상위성 |
| sun-synchronous | 태양동기궤도 |
| dawn–dusk orbit | 여명-황혼 궤도 |
| constellation, fleet | 위성군 |
| cubesat | 큐브샛 |
| agile | 자세를 빠르게 바꾸는 |
| tasked to point at targets | 요청에 따라 특정 지점을 찍는 |
| rapid-revisit | 재방문 주기가 짧은 |
| spotlight imagery | 스포트라이트 모드 |
| C-band / X-band / L-band | C 밴드 / X 밴드 / L 밴드 |
| stereo-mapping | 입체 지도 제작용 |
| formation flight | 편대 비행 |
| standby spare | 예비 위성 |
| operational (service) | 현업 운용 (the KMA's word) · not yet: 아직 현업 운용 전 |
| full disk | 지구 전면 |
| images (verb) | 관측한다 |
| has watched | 지켜봐 왔다 |

Examples: sentinel2 Copernicus 다중분광 이미저: 밴드 13개, 픽셀 10 m, 관측 폭 290 km. · noaaViirs VIIRS 이미저가 관측
폭 3,040 km를 훑으며 하루 두 번 지구 전체를 덮는다. · terra MODIS 이미저는 1999년부터 한 번에 2,330 km씩 지구 전체를
지켜봐 왔다. · goesEast GOES-East: 10분마다 아메리카 쪽 지구 전면을 관측한다. ("full disk of X" → X 쪽 지구 전면,
never X의 지구 전면) · goes16 예전의 GOES-East: 지금은 예비 위성으로 궤도에 남아 있다. (never two -로 in a row) ·
fengyun4a 먼저 발사된 중국의 정지궤도 이미저: 주 운용 위성으로는 세지 않는다. ("Older" → 먼저 발사된, never 더 오래된
with nothing to compare to) · skysat 자세를 빠르게 바꾸는 Planet의 이미저로, 픽셀은 약 50 cm이며 요청에 따라 특정 지점을 찍는다.
· sentinel1 모든 이미지를 공개하는 Copernicus C 밴드 레이더: 한쪽 옆으로 관측 폭 250 km, 20 m, 구름을 뚫고 밤낮없이.
· iss 국제우주정거장. 2000년 11월부터 사람이 끊임없이 머물고 있다.

Korean satellites keep the catalog name and add the programme name Korean readers know, once, in parentheses:

- geoKompsat2a: 한국의 기상위성(천리안위성 2A호): 10분마다 지구 전면을 관측한다.
- kompsat3: 한국의 이미저(아리랑 3호): 전정색 픽셀 70 cm.
- kompsat3a: 한국의 이미저(아리랑 3A호): 전정색 픽셀 55 cm, 적외선 채널.
- kompsat5: 한국의 X 밴드 레이더 위성(아리랑 5호): 스포트라이트 모드 1 m.

### 3.8 Curated places (`places`)

Product strings, so they take the standard Korean exonym (국립국어원 외래어 표기, or the form the Korean press uses).
Country names in sublabels are written as `Intl.DisplayNames('ko')` gives them. Sublabels list most specific first,
with commas; "A and B" is A와 B / A과 B by the last sound. Generic geographic words attach to a foreign name per the 2017
외래어 표기법 rule (…산, …강, …해, …섬, …호, …만, …해협, …제도, …반도, …산맥); others (폭포, 운하, 댐, 사막, 광산, 공원)
stay spaced as the press writes them. US states and administrative units take 주, 성, 현, 도 attached (네바다주,
후베이성, 시즈오카현).

| id | chip | label | sublabel |
|---|---|---|---|
| area51 | 51구역 | 51구역 | 그룸 레이크, 네바다주, 미국 |
| centralPark | 센트럴 파크 | 센트럴 파크 | 뉴욕, 미국 |
| giza | 기자 피라미드 | 기자의 피라미드 | 기자, 이집트 |
| uluru | | 울루루 | 노던 준주, 오스트레일리아 |
| palmJumeirah | | 팜 주메이라 | 두바이, 아랍에미리트 |
| worldIslands | | 더 월드 아일랜드 | 두바이, 아랍에미리트 |
| grandCanyon | | 그랜드 캐니언 | 애리조나주, 미국 |
| meteorCrater | | 미티어 크레이터 | 애리조나주, 미국 |
| lowerManhattan | | 로어 맨해튼 | 뉴욕, 미국 |
| lasVegasStrip | | 라스베이거스 스트립 | 네바다주, 미국 |
| hooverDam | | 후버 댐과 미드호 | 네바다주와 애리조나주, 미국 |
| goldenGate | | 금문교 | 샌프란시스코, 미국 |
| kennedySpaceCenter | | 케네디 우주 센터 | 플로리다주, 미국 |
| washingtonDc | | 워싱턴 D.C. | 내셔널 몰, 미국 |
| mountStHelens | | 세인트헬렌스산 | 워싱턴주, 미국 |
| niagaraFalls | | 나이아가라 폭포 | 온타리오주, 캐나다 |
| panamaCanal | | 파나마 운하 | 가툰 갑문, 파나마 |
| rioDeJaneiro | | 리우데자네이루 | 슈가로프산과 코파카바나, 브라질 |
| paris | | 파리 | 일드프랑스, 프랑스 |
| venice | | 베네치아 | 베네토, 이탈리아 |
| vesuvius | | 베수비오산 | 나폴리, 이탈리아 |
| istanbul | | 이스탄불 | 보스포루스해협, 튀르키예 |
| chernobyl | | 체르노빌 | 키이우주, 우크라이나 |
| tableMountain | | 테이블산 | 케이프타운, 남아프리카 |
| kilimanjaro | | 킬리만자로산 | 킬리만자로, 탄자니아 |
| everest | | 에베레스트산 | 네팔과 중국 |
| angkorWat | | 앙코르와트 | 시엠레아프, 캄보디아 |
| singapore | | 싱가포르 | 마리나베이, 싱가포르 |
| hongKong | | 홍콩 | 빅토리아 하버, 홍콩 |
| tokyo | | 도쿄 | 도쿄, 일본 |
| fuji | | 후지산 | 시즈오카현, 일본 |
| sydneyHarbour | | 시드니 항 | 시드니, 오스트레일리아 |
| richat | | 리샤트 구조 | 사하라, 모리타니 |
| greatBlueHole | | 그레이트 블루홀 | 라이트하우스 리프, 벨리즈 |
| boraBora | | 보라보라섬 | 소시에테제도, 프랑스령 폴리네시아 |
| hardyReef | | 하디 리프 | 그레이트배리어리프, 오스트레일리아 |
| male | | 말레 | 북말레 환초, 몰디브 |
| deadSea | | 사해 염전 | 남쪽 분지, 이스라엘과 요르단 |
| binghamCanyon | | 빙엄 캐니언 광산 | 유타주, 미국 |
| mountWhaleback | | 마운트 웨일백 광산 | 필바라, 오스트레일리아 |
| etna | | 에트나산 | 시칠리아, 이탈리아 |
| santorini | | 산토리니 | 키클라데스제도, 그리스 |
| teide | | 테이데산 | 테네리페, 스페인 |
| kilauea | | 킬라우에아 | 하와이주, 미국 |
| craterLake | | 크레이터호 | 오리건주, 미국 |
| glenCanyonDam | | 글렌 캐니언 댐 | 페이지, 애리조나주, 미국 |
| gardenCity | | 가든시티 원형 농지 | 캔자스주, 미국 |
| almeria | | 알메리아 온실 단지 | 안달루시아, 스페인 |
| gibraltar | | 지브롤터 | 지브롤터해협 |
| suezCanal | | 수에즈 운하 | 이스마일리아, 이집트 |
| aswanDam | | 아스완 하이 댐 | 나세르호, 이집트 |
| wadiRum | | 와디 럼 | 아카바, 요르단 |
| sossusvlei | | 소서스플라이 | 나미브 사막, 나미비아 |
| victoriaFalls | | 빅토리아 폭포 | 잠비아와 짐바브웨 |
| threeGorges | | 싼샤 댐 | 후베이성, 중국 |
| shanghai | | 상하이 | 황푸강, 중국 |
| itaipu | | 이타이푸 댐 | 브라질과 파라과이 |

- The chip 기자 alone reads as "journalist": the chip is 기자 피라미드.
- Groom Lake is written as a name (그룸 레이크), as the press does, not translated as 그룸 호수.
- Chernobyl stays 체르노빌: the English keeps the plant's established name, and so does Korean here; the 2022
  committee form 초르노빌 is not used for this chip (a deliberate choice, §8).
- Usage stats, record_lookup and shares keep the English label (`canonicalLabel`), so counts never split by language.

---

## 4. Glossary

"Never" means the form is wrong for this product, even when it is correct Korean elsewhere. Spacing in the ko column is
part of the term: copy it exactly (§6.5).

| English | ko | Notes |
|---|---|---|
| satellite | 위성 | Counter 기. Never 인공위성 in UI chrome (too long), never 새틀라이트, never the counter 개 or 대. |
| unnamed satellite | 이름 미상 (in the [SAT] slot: 이름 미상 위성이) / 이름 미상 위성 (a label alone) | The 신원 미상 pattern of news Korean. Never 미확인 위성 (sounds like a UFO). |
| pass (noun) | 통과 | Counter 회 in readouts and counts; 번 for "N times" in prose. "this pass" → 이번 통과. Never 패스 (pass, password, skip). |
| list row | 개 (counter) | "Show 40 more" → 40개 더 보기. Never 회 for rows: rows are not passes. |
| verdict (aria, About) | 분류 | "Passes by verdict" → 분류별 통과; "of this kind" → 이 분류의. |
| overflight | 상공 통과 | |
| to pass / to cross | 지나가다 → 지나갔다 | "crossed your sky" → 이곳 하늘을 가로질렀다. Never 교차하다. |
| to watch (product verb) | 지켜보다 → 지켜봤다 | Never 감시하다, 촬영하다 (owner: never "photographed"), 엿보다, 내려다보다, 보았다 (write 봤다). |
| to observe, to image (an instrument, in general) | 관측하다 | Blurbs, footnotes, About. Never for this place's verdict. |
| to sweep, to scan | 훑다 | |
| to take (a picture) | 찍다 | Only where the English says took / taken / imaged of a camera. Radar: 담다. |
| to see, to look (one look) | 보다 | The could title, "looking straight down". |
| Watched / Likely watched / Could have pointed here / Passed overhead | 지켜봤다 / 아마 지켜봤다 / 여기를 볼 수도 있었다 / 상공을 지나갔다 | §3.5. |
| something (hero) | 무언가 | Never 누군가 (a person), 뭔가 (casual). |
| photo | 사진 | Only for Sentinel-2 / Landsat optical pictures, where the English means exactly those. Counter 장. |
| image | 이미지 | The default for any picture: photo, composite, radar, full disc; all gallery, viewer and filmstrip chrome. Counter 장. Never 영상 (most readers hear "video"), 화상. |
| public image | 공개 이미지 | |
| made public / published | 공개되다 → 공개됐다 | Never 발행, 출판, 업로드, or 게시 (posting, as in X에 게시). |
| archive | 아카이브 | "the image archives" → 이미지 아카이브. Never 보관소, 저장소. |
| scene | 장면 | One archive item: the whole image the crop is cut from. Counter 개. Never 씬, 신, 영상. |
| crop | 부분 (in prose: 이 부분), 잘라 낸 이미지 | |
| swath | 관측 폭 | "inside its 290 km swath" → 관측 폭 290 km 안. Never 스와스, 촬영 폭. |
| swath ribbon / in swath | 관측 폭 띠 / 관측 폭 안 | |
| off-nadir (label) | 기울기 | Value 5.4°. In prose: 바로 아래에서 5.4° 비스듬히. Never 오프나디르, 천저각, 경사. |
| straight down / nadir | 바로 아래 | Never 천저, 연직 아래. |
| directly overhead | 이곳 바로 위 | Only below 15 km of ground distance. |
| almost straight up (zenith) | 거의 바로 머리 위 | Never 천정 (heard as 천장, ceiling). |
| ground track | 지상 궤적 | |
| orbit | 궤도 | Counter 개 (궤도 412개). |
| altitude | 고도 | The orbit's height. Never 해발, 표고. Never alone for an angle, with one fixed exception: 태양 고도 (sun elevation), the established term. |
| elevation (angle above the horizon) | 고도각 | "54° above your horizon" → 이곳에서 보면 … 지평선 위 54°. |
| horizon | 지평선 | |
| sun elevation | 태양 고도 | Its unit word: 낮 / 박명 / 밤. |
| ground distance / closest (distance) | 지상 거리 / 최근접 거리 | |
| closest approach (time) | 최근접, 최근접 시각 | "Closest · UTC" → 최근접 시각 · UTC. Never for "closest look". |
| ground speed / heading | 지상 속도 / 진행 방향 | Never 헤딩, 제목. |
| ascending / descending | 북행 / 남행 | Never 상승 / 하강 (climbing). |
| in view / field of regard | 시야 안 / 지향 범위 | "In view 4 min 12 s" → 시야 안 4분 12초. |
| cloud cover | 구름양 | Never 운량 (forecaster jargon), 구름 커버. |
| cloud at spot | 지점 구름 | Values 맑음 · 권운 · 구름 · 그림자; gallery status 맑음 · 얇은 권운 · 지점 구름 · 구름 그림자. |
| clear | 맑음 | The Clear button is 지우기, so no clash. |
| clouded over / mostly cloud | 구름에 가림 / 대부분 구름 | Card line: 구름에 가렸다. 구름만 보였다. |
| pixel / resolution | 픽셀 / 해상도 | Labels say 픽셀. "10 m per pixel" → 픽셀당 10 m. 해상도 only where the English says resolution. |
| radar / radar image | 레이더 / 레이더 이미지 | Never 레이더 사진. |
| weather mosaic / daily mosaic | 기상 합성 이미지 / 일일 합성 이미지 | Tag 합성; product line 일일 합성 · 250 m. Never 모자이크: Korean readers hear blurring and censorship (모자이크 처리), the opposite of this product. |
| true colour | 자연색 | Never 트루컬러, 실제 색. |
| geostationary | 정지궤도 | 정지궤도 기상위성. |
| full disc / disk | 지구 전면 | Never 전구 (also "light bulb"), 풀디스크, 원반. |
| scan / scan line | 스캔 / 스캔 선 | to scan: 훑다. |
| imager (prose) / imager (blurb) | 센서 / 이미저 | VIIRS 센서가 … 훑었다 · Copernicus 다중분광 이미저. |
| infrared / visible / colour (bands) | 적외선 · 적외 (chip) / 가시광 / 컬러 | |
| band | 밴드 | Counter 개. |
| time-lapse / frame | 타임랩스 / 프레임 | Frame counter 장. |
| clear look / last clear look / clearest look | 맑은 모습 / 마지막 맑은 모습 / 가장 맑은 모습 | Counter 장. |
| closest look | 가장 자세한 모습 | The most detailed clear image. Never 최근접, 가장 가까운. |
| developing (time-lapse) | 현상 | As a photograph is developed. |
| replay | 다시 보기 | The button and the section; the act of playing is 재생. Never 리플레이. |
| orbit catalog / orbital elements / epoch | 궤도 카탈로그 / 궤도 요소 / 기준 시각 | "TLE EPOCH" → TLE 기준. Never 카다로그. |
| object (catalog) | 물체 | Counter 개: 물체 16,917개. |
| sub-solar point | 태양 직하점 | |
| sunlight / daylight / dark / twilight | 햇빛 / 낮 / 어둠 / 박명 | |
| steerable camera / fixed camera | 방향을 돌릴 수 있는 카메라 / 늘 바로 아래를 보는 카메라 | Never 고정 카메라 (CCTV). |
| private (archive, camera) | 비공개 | |
| operator | 운영사 (company), 운영 기관 (agency) | Never 오퍼레이터, 운영자. |
| commercial | 상업 | 상업 위성, 상업 아카이브. 상용 (商用) is also correct Korean for "commercial" (상용 위성영상), but this product writes 상업 everywhere so there is one form; never mix them. Never 커머셜. |
| crewed / station | 유인 / 우주정거장 | Never 정거장 or 스테이션 alone. |
| weather satellite / imaging satellite | 기상위성 / 관측 위성 | Never 촬영 위성, 영상 위성. |
| military / reconnaissance satellite | 군사 위성 / 정찰위성 | Never 스파이 위성, 첩보 위성. |
| share / link / post (text) | 공유 / 링크 / 게시글 | |
| download image / save | 이미지 저장 / 저장 | Busy: 저장 중…. Never 다운로드 on a button. |
| copy link / copy image / copied | 링크 복사 / 이미지 복사 / 복사됨 | |
| post to X | X에 게시 | |
| video | 동영상 | Never 영상, 비디오. |
| geocoder | 주소 검색 서비스 | "the Photon geocoder" → Photon 주소 검색 서비스. Never 지오코더. |
| search a place / use my location / locating… | 장소 검색 / 내 위치 사용 / 찾는 중…, 위치 찾는 중… | |
| drop a pin / dropped pin / remove the pin | 핀 꽂기 / 꽂은 핀 / 핀 빼기 | |
| surprise me | 아무 곳이나 | Never 랜덤, 무작위 (cold, reads as a setting). |
| how this works | 작동 방식 (link), 이렇게 돌아간다 (About title) | |
| last 7 days / this week / that week | 최근 7일 / 지난 일주일 / 그 일주일 | Never 이번 주 (calendar week), 지난주 (previous calendar week). |
| local time | 현지 시각 | Never 현지 시간 (시간 is a duration). |
| ago / in / just now | 전 / 후 / 방금 | 41시간 전 · 3시간 후. |
| min / h / s / days / years | 분 / 시간 / 초 / 일 / 년 | Attached to the digits. |
| km, m, km/s | km, m, km/s | A space before the unit: 786 km. |
| N / S / E / W | readouts N S E W; prose 북위 / 남위 / 동경 / 서경 | 19.5°S 048.2°E in readouts; 남위 19.5°, 동경 48.2° in prose. |
| compass, 8 points (prose) | 북쪽 · 북동쪽 · 동쪽 · 남동쪽 · 남쪽 · 남서쪽 · 서쪽 · 북서쪽 | Always with 쪽, so particles are fixed. |
| compass, 16 points (readouts) | 북 … 북북서 (§3.7 pass) | Never Latin NNE in a ko readout. |
| acquired / acquiring | 포착 / 포착 중 | Mono readouts only. |
| north up / plan view / geometry | 북쪽 위 / 평면도 / 기하 | |
| back (to the landing) | 처음으로 | 뒤로 only where it means "previous" (About's key list: 뒤로 또는 닫기). |
| try again / trying | 다시 시도 / 다시 시도 중… | |
| fault (notice label) | 오류 | |
| credits (About) | 크레딧 | 출처 means "sources". |
| spot / cell / window / range | 지점 / 구역 / 기간 / 닿는 범위, 보이는 범위 | Never 스팟, 셀, 윈도우, 사정거리 (weapon range). |
| track ("satellites we track") | 추적 중인 | |
| keyboard keys | Enter, Esc, 스페이스, ←, →, /, F, +, − | Enter and Esc as printed on Korean keyboards; the unlabelled space bar is 스페이스. |

---

## 5. Grammar strategies for runtime slots

### 5.1 The particle problem (조사)

Six common particles change with the last syllable of the word before them: 이/가, 은/는, 을/를, 와/과, (으)로 and
the copula 이다/다 (also 이나/나, (이)랑). Code could compute this for Hangul, but not for Latin names, which are most of
what the gazetteer and the catalog return: Paris (파리) takes 를, London (런던) takes 을, and Landsat 9 takes 을 or 를
depending on whether the reader says 나인 or 구.

**The rule:** a varying particle never follows [PLACE], [SAT], [SENSOR], [QUERY] or a list of names directly. Frames use
one of two tools:

1. **An invariant particle** straight after the slot: 의, 에, 에서, 에게, 도, 만, 까지, 부터, 보다, 처럼, 마다, 쯤.
2. **A buffer noun** after the slot that carries a fixed particle: [PLACE] 일대를, [SAT] 위성이.

Never write the double forms 을(를), 이(가), 은(는), 와(과). Never ship a particle-choosing (조사 처리) library: the
frames make it unnecessary, it would add code to every page, and it would still guess wrong on Latin names.

| Slot and role | Frame | Example |
|---|---|---|
| [PLACE] as object | [PLACE] 일대를 | 위성 256기가 Waterloo 일대를 지켜봤다. |
| [PLACE] as subject or topic | [PLACE] 일대가 / 일대는 | Waterloo 일대는 관측 폭 290 km 안에 있었다. |
| [PLACE] seen from below | [PLACE] 상공을 / 상공의 | ISS 위성이 Waterloo 상공을 지나갔다. · Waterloo 상공의 위성 |
| [PLACE] as target or location | [PLACE]에 / [PLACE]에서 | 이번 스캔 선은 07:49 CET쯤 Paris에 닿았다. |
| [PLACE] as possessor | [PLACE]의 | Waterloo의 지난 일주일 공유 |
| [PLACE] ending a phrase | [PLACE] | 해마다 본 Waterloo · Waterloo 타임랩스 |
| [SAT] as subject or topic | [SAT] 위성이 / [SAT] 위성은 | Sentinel-2C 위성이 Waterloo 일대를 지켜봤다. |
| [SAT] as possessor | [SAT] 위성의 | 평면도: Sentinel-2C 위성의 지상 궤적. |
| [SAT] in a label | [SAT] alone | 가장 자세한 모습 · Sentinel-2B · 10 m |
| [SENSOR] | [SENSOR] 센서가 | VIIRS 센서가 Waterloo 일대를 훑었다. |
| [QUERY] | “[QUERY]” + a noun | “Wterloo” 검색 결과가 없다. |
| [TIME], [ZONE], [DATE] | [TIME]에 / [TIME]쯤 / [DATE]부터 | 16:14:21 UTC에 · 07:49 CET쯤 |
| [NUM] | always with its counter or unit | 위성 256기가 · 1,204번 · 786 km에서 |

### 5.2 [PLACE]: bare, then a buffer or an invariant particle

- Insert the label exactly as the gazetteer gives it: Latin, Hangul or any script. No article (English adds "the"
  before seas and deserts in its own file; ko ignores it), no quotes, no translation, no added 시, 도 or 호.
- 일대 ("the area around") is the default buffer: honest (a satellite sees an area) and right for every kind of place:
  a town, a park, an ocean, a country, a coordinate pair (43.47, −80.54 일대를).
- The serif accent covers the name only, never the buffer or the particle.
- A Hangul place name works in the same frames (서울 일대를). Don't special-case it.
- Korean visitors will mostly see romanised Korean towns (Seongnam-si, Gyeonggi-do), because the offline list holds
  GeoNames' romanised names and the network geocoders are asked in English on purpose: 최근 7일 동안, 위성 120기가
  Seongnam-si 일대를 지켜봤다. This is expected and honest; never "fix" it by hand in a catalog (§8).

### 5.3 [SAT] as subject: no gender, no pronoun, a buffer

- [SAT] 위성이 in headlines and posts (new information), [SAT] 위성은 opening a pass paragraph (the topic). 위성 ends in
  ㅇ, so 이 and 은 are always right.
- Later sentences drop the subject. Never 그것, 그, 그녀, or 이 위성은 again and again.
- Korean has no grammatical gender, so nothing else agrees with the satellite.
- The name is never changed: no transliteration (센티넬), no 호 (the press writes 랜드샛 9호; we write Landsat 9), no
  Korean programme name in place of the catalog's (KOMPSAT-3A stays KOMPSAT-3A in every slot; the blurb may add 아리랑
  3A호 once, §3.7 sats).
- Crewed stations keep the buffer (ISS 위성이): unusual but correct, since the product counts the ISS among its
  satellites, and one frame for every pass needs no code that knows the category.
- **Unnamed satellite.** The English catalogs hand a sentence `sat` undefined and let each language say "a satellite"
  its own way; only mono chips and the plan plate's callout print `aSatellite`. In ko every sentence that takes an
  optional name writes 이름 미상 into the [SAT] slot, so the frame stays whole:
  ```ts
  const named = (sat: string | undefined) => sat ?? '이름 미상'
  // `${named(sat)} 위성이 [PLACE] 일대를 지켜봤다.` → 이름 미상 위성이 Waterloo 일대를 지켜봤다.
  ```
  `aSatellite` (a label alone) is 이름 미상 위성: 가장 자세한 모습 · 이름 미상 위성 · 10 m. NORAD 60989 위성이 is
  already fine. No new key and no new code are needed.

### 5.4 [NUM]: plural categories and counters

CLDR plural categories for ko: **`other` only**, cardinal and ordinal. One string per count. Where the English has a
zero sentence, Korean has one too; readout tiles may show 0 with its unit (0회).

| Counted thing | Counter or unit | Example | Note |
|---|---|---|---|
| satellites | 기 | 위성 256기 · 위성 1기 | Never 개, 대. Noun first, then number and counter: 위성 256기, not 256기의 위성. |
| images, photos, composites, frames, clear looks | 장 | 이미지 31장 · 프레임 12장 | |
| passes (counts, readouts, list totals) | 회 | 통과 31회 · 120회 | |
| times (prose) | 번 | 1,204번 · 42번 | 1 is the word 한 번 (not a mono number): 1번 also reads "No. 1". |
| list rows, catalog objects, scenes, orbits, bands | 개 | 40개 더 보기 · 물체 16,917개 · 장면 12개 · 궤도 412개 · 밴드 13개 | |
| search results | 건 | 3건 | |
| days, hours, minutes, seconds, years | 일, 시간, 분, 초, 년 | 7일 · 41시간 · 10분 · 38초 · 2015년 | |
| distance, size, speed | km, m, km/s | 786 km · 10 m · 7.46 km/s | A space before the unit. |
| angle, percent | °, % | 5.4° · 25% | No space. |

**How a counter is written in rich parts (blocker if wrong).** `num(n, u)` renders `u` as a separate, smaller span in
`--bone-3` (`Rich.tsx`) and, in plain text, puts a space before any unit that is not °, %, ′ or ″ (`parts.ts
tightUnit`). So a counter passed as a num unit comes out as "위성 256 기가", with 기 small and grey, in the headline that
carries the product.

- **In sentences, the counter is ordinary text right after the number part:**
  ```ts
  strong('위성 ', num(f.int(n)), '기가')
  ['이미지가 ', num(f.int(k)), '장 공개됐다.']
  ['그래도 기상위성은 적외선으로 이곳을 ', num(f.int(n)), '번 훑었다.']
  ```
- **In stacked readouts and tiles** (`passView.countStack`, the summary tiles, timeline lanes) the counter may be the
  num unit: there it is the readout design, like `786 km`: `num('31', '회')`.
- **Never add Hangul to `tightUnit`.** Its space and dim style are right for readouts.
- The no-break between 256 and 기 comes from `word-break: keep-all` on the root (§6.6), which suppresses the break
  between a digit and a Hangul syllable.

**Other number rules:**

- Arabic numerals always for code numbers. Native Korean numbers only in fixed words: 한 번, 하루, 이틀, 하루이틀 ("a
  day or two"), 이틀쯤 ("a couple of days").
- No plural -들 after a counted noun, ever.
- Ordinals: "Pass 3 of 12" → 12회 중 3번째 · "Photo 3 of 12" → 이미지 12장 중 3번째 · "Frame 3 of 12: …" → 프레임 12장
  중 3번째: … · the mono "3 / 12" stays as it is.
- Particles after a counter or unit are fixed. A counter is Hangul, so it follows its own spelling (위성 256기가, 이미지
  31장이, 통과 12회를). Every unit is read with a final vowel (킬로미터, 미터, 퍼센트, 도, 초), so it takes the vowel
  forms: 786 km를, 7.46 km/s로, 25%가, 5.4°는.

### 5.5 Lists of names

| English | ko |
|---|---|
| A | [A] 위성이 |
| A and B | [A], [B] 위성이 |
| A, B and 7 other radar satellites | [A], [B] 외 레이더 위성 [N]기가 |
| A and 1 other radar satellite | [A] 외 레이더 위성 1기가 (the same frame) |
| a title attribute listing names | [A], [B], [C] |

- The comma joins names; 외 ("besides") adds the rest. Never 와 / 과 / 이랑 after a name.
- Full sentence: 레이더에는 빛이 필요 없다. Umbra-08, Capella-14 외 레이더 위성 7기가 이곳이 보이는 범위를 1,204번
  지나갔다.
- `fmt('ko').list` (`Intl.ListFormat`) returns "A 및 B" and "A, B 및 C". 및 is invariant and correct, but it is the
  register of forms and contracts; ko builds its lists by hand with the comma and 외.

### 5.6 Dates and times inside sentences

- A time or a date takes 에 (invariant): 16:14:21 UTC에 · 11월 1일(일)에 · 현지 시각 11:21에.
- "About" with a time is 쯤, attached: 07:49 CET쯤 (it attaches to the num part's zone). In mono readouts the English ≈
  stays: ≈ 07:49.
- A range in prose: [DATE1]부터 [DATE2]까지.
- "On Sun 1 Nov at 11:21 local" → 현지 시각 11월 1일(일) 11:21에. 현지 시각 comes first and covers both.
- Sentence order puts time before place: [SAT] 위성은 [TIME]에 고도 [ALT]에서 …

### 5.7 Fixed names inside strings, and their particles

The rule in §5.1 is about slots. A name written into a string (Sentinel-2, NASA, Chrome) is fixed, so the translator
picks its particle by how Korean readers say it. Where two readings disagree, use a buffer instead.

| Name | Read as | Ends in | Takes |
|---|---|---|---|
| Watched | 워치드 | vowel | 는, 가, 를, 와, 로 |
| Sentinel-2, Sentinel-2 L2A | 센티널 투 / 이 | vowel | 는, 가, 를, 와, 나, 로 |
| Sentinel-1 | 센티널 원 / 일 | ㄴ or ㄹ | 은, 이, 을, 과 (avoid (으)로) |
| Landsat | 랜드샛 | ㅅ | 은, 이, 을, 과, 으로 |
| Landsat 9 | 랜드샛 나인 / 구 | disagree | buffer: Landsat 9 위성이 |
| NASA, ESA, NOAA | 나사, 에사, 노아 | vowel | 는, 가, 를, 와 |
| NASA GIBS | 나사 깁스 | vowel | 는, 가, 를 |
| EUMETSAT, Meteosat | 유메트샛, 메테오샛 | ㅅ | 은, 이, 을, 과 |
| Copernicus | 코페르니쿠스 | vowel | 는, 가, 를, 와 |
| Planetary Computer | 플래니터리 컴퓨터 | vowel | 는, 가, 를, 와, 에 |
| Earth Search, Element 84 | 어스 서치, 엘리먼트 에이티포 | vowel | 는, 가, 를, 와 |
| CelesTrak | 셀레스트랙 | ㄱ | 은, 이, 을, 과 |
| Photon | 포톤 | ㄴ | 은, 이, 을, 과, 으로 |
| Nominatim | 노미나팀 | ㅁ | 은, 이, 을, 과, 으로 |
| Open-Meteo, GeoNames | 오픈메테오, 지오네임스 | vowel | 는, 가, 를, 와 |
| OpenStreetMap | 오픈스트리트맵 | ㅂ | 은, 이, 을, 과 |
| GOES, Himawari, ISS, VIIRS, MODIS | 고스, 히마와리, 아이에스에스, 비어스, 모디스 | vowel | 는, 가, 를, 와 |
| Chrome | 크롬 | ㅁ | 은, 이, 을, 과 (Chrome과 Firefox에서) |
| Firefox, Safari | 파이어폭스, 사파리 | vowel | 는, 가, 를, 와 |
| X | 엑스 | vowel | X에 게시 |
| WebGL 2 | 웹지엘 투 | vowel | 는, 가 (WebGL 2가 꺼져 있다) |
| JavaScript, SGP4, TLE, UTC, PNG, H.264 | read with a final vowel | vowel | 는, 가, 를, 와, 로 |
| Enter, Esc | 엔터, 이에스시 | vowel | Enter나 화살표를 누르면 |

After a parenthesis or a closing quote, the particle follows the word before it: 이미지 아카이브(…)를 · ‘지켜봤다’로.

---

## 6. Typography and formatting

### 6.1 Punctuation

Korean uses Western punctuation, half-width, with no space before it and one space after.

| Mark | ko | Rule |
|---|---|---|
| Full stop | . | Every sentence, including headlines and the hero's last line. Never after labels, buttons, chips, titles. |
| Comma | , | After a sentence-opening time phrase in headlines (최근 7일 동안,). |
| Quotation marks | “ ” for quotes, ‘ ’ for a term | ‘여기를 볼 수도 있었다’로 분류한다. A query: “Wterloo”. Never 「」 or straight quotes. |
| Apostrophe | (none) | Latin names keep their own ’. |
| Parentheses | ( ), attached to the word before | 이미지 12장(Sentinel-2, Landsat, 10~30 m) · 11월 1일(일) · 닫기(Esc) |
| Colon | : | No space before, one after: 장면 전체 구름양: 25%. |
| Question mark | ? | About's questions and the two share questions only. The OG title's -나 question has none. |
| Exclamation mark | never | |
| Ellipsis | … (U+2026), once | Only after a status line's 중: 계산 중…. Never ..., ……, or a trailing ellipsis for mood. |
| Dash | none in prose | — only as the "unknown value" readout (DESIGN §1). Never ― or – inside Korean sentences. |
| Range | ~ (U+007E), no spaces | The Korean norm (물결표): 10~30 m · 250~375 m · 2~5 km. → stays for directions and spans in mono readouts (16:14 → 16:18, 북 → 남). |
| Middle dot | · (U+00B7) with spaces, the design separator in mono readouts and chips | Never as a list separator in Korean prose (가운뎃점 Umbra·Capella): use a comma, so the dot never means two things. |
| Slash | " / " with spaces | Section labels and counters: 02 / 통과 · 3 / 12. Never in dates (§6.3). |
| Arrow | → | Mono ranges and directions. |
| Note marks | the product's superscripts ¹ ² ³ | Never ※. |
| Spaces | §6.5 | Never a full-width space or full-width punctuation (，。！). |

### 6.2 Numbers and units

- Half-width digits only. Never full-width digits or letters.
- Group thousands with a comma (1,715 · 35,778) and use a decimal point (7.46): `fmt('ko').int / dec`. Never 만 or 억
  (17,000, not 1만 7천). No Hangul numerals for quantities.
- Percent 25%, degree 98.6°, no space. Units 786 km, 10 m, 7.46 km/s, with a space. The minus sign is − (U+2212).
- Never `Intl.NumberFormat` unit output for ko: it gives 786km and 7.46km/s, with no space.
- Coordinates: readouts keep the international form (19.5°S 048.2°E). Prose uses 남위 19.5°, 동경 48.2°; a
  geostationary seat that arrives as "0.2°W" is rewritten by the ko message to 서경 0.2° (§3.7 pass).

### 6.3 Dates and times

The `day` slot is inserted into aria labels too, and Korean speech engines read "11.1" as a decimal, so the product's
one human date is written in words; the dotted form appears only with a year (unambiguous) or in the narrowest
timeline cells.

| Context (`time.*` key) | English | ko |
|---|---|---|
| day (pass rows, captions, HUD scene clock, every `[DAY]` slot) | Sun 1 Nov | 11월 1일(일) |
| dayMonth | 29 Oct | 10월 29일 |
| dayRange | 1 → 8 Nov · 29 Oct → 5 Nov | 11월 1일 → 8일 · 10월 29일 → 11월 5일 |
| daySpoken | Friday 6 November | 11월 6일 금요일 |
| stamp | Sun 1 Nov · 11:21 EST | 11월 1일(일) · 11:21 EST |
| weekdayShort (a weekday standing alone) | Sun | 일요일 (a lone 일 reads as "day") |
| dayCompact (48–92 px ticks) | Su 1 | 1(일) |
| Prose day with year (card description) | Sun 1 Nov 2026 | 2026년 11월 1일(일) |
| Kicker (`landing.windowRange`) | 12 → 19 NOV 2026 UTC | 2026.11.12 → 11.19 UTC |
| Kicker across a year | 29 DEC 2026 → 5 JAN 2027 UTC | 2026.12.29 → 2027.1.5 UTC |
| Card stamp (`card.stamp`) | Sun 1 Nov 2026 · 11:21 EST | 2026.11.1(일) · 11:21 EST |
| Week card stamp (`card.weekTo`) | 7 days to Sun 1 Nov 2026 | 2026.11.1(일)까지 7일 (the year stays, as the English comment requires) |
| Card chip day (`card.lookDay`) | 3 Nov | 11월 3일 |
| Time-lapse frame date / readout | 22 Oct 2015 | 2015.10.22 · 2015.10.22 · Sentinel-2A |
| Time-lapse frame list (`dayMonth`) | 22 Oct | 10월 22일 |
| Time-lapse spoken frame | Frame 3 of 12: 22 Oct 2015 | 프레임 12장 중 3번째: 2015년 10월 22일 |
| HUD clock, ISO stamps | 2026-11-08 03:31:07 UTC | unchanged |

- Weekday short forms are one syllable (일 월 화 수 목 금 토) and only ever sit in parentheses after a date.
- `Intl.DateTimeFormat('ko', …)` puts a space before the weekday ("11월 1일 (일)", "11. 1. (일)") and gives "2026. 11.
  1." for numeric dates. Build the forms above from `formatToParts` (month, day, weekday), with no space before the
  parenthesis. Never use `formatRange` for ko: it writes ranges with ~ ("11월 12일~19일"), and the product's mono spans
  use →.
- **Time:** 24-hour clock, always `hourCycle: 'h23'` (the ko default is 오후 04:14). Never 오전 / 오후. Seconds where
  the English has them.
- **Durations** (`durationSeconds`, `durationMinutes`, `durationHours`): 38초 · 4분 12초 · 4분 5초 · 1시간 2분. No zero
  padding in words. The locating counter (`landing.elapsed`, 05초) keeps its two digits because it is live and must not
  change width.
- **Zones:** the product's abbreviations stay (KST, EST, CET, UTC+9); Korean readers know KST. In prose: 16:14 KST에.
  `time.atSea`: UTC−9 · 해상.

**Relative time (`time.relative`, `relativeSpoken`, `hud.catalogAge`)**

| EN | ko |
|---|---|
| just now (under 45 s) | 방금 |
| 12 min ago | 12분 전 |
| 41 hours ago (hours up to 48, as in English) | 41시간 전 |
| 2 days ago | 2일 전 |
| in 3 h | 3시간 후 |
| HUD: <1 MIN ago · 42 MIN ago · 5 H ago · 3 D ago | 방금 · 42분 전 · 5시간 전 · 3일 전 |
| HUD: Stale, 3 D ago | 오래됨, 3일 전 |

Use `relativeParts(ms, now)`, then 방금 for the unit 'second', else `relativeFormat('ko', 'short', 'always')` (it gives
41시간 전, 3시간 후, correctly spaced; the long style reads the same, so the spoken form is identical). Never
`numeric: 'auto'`: it turns zero minutes into "현재 분" and −2 days into "그저께", with no number to set in mono.

### 6.4 Case, mono caps labels, abbreviations

- **Case.** Hangul has no case. Latin words keep their own case in prose (Sentinel-2, NASA, km). English Title Case and
  sentence case have no Korean counterpart: every title is an ordinary phrase with no full stop (통과를 찾는 방법).
- **Only mono labels are uppercased**, by CSS. Units in prose stay lowercase (7.46 km/s), and so do names (Sentinel-2C).
  Never type capitals into a ko string to imitate the caps style.
- CSS `uppercase` leaves Hangul alone and uppercases the Latin in a label exactly as in English, units aside (고도 786 km,
  포착 11:21:21 EST · 10 m, SENTINEL-2C). Don't add a satellite name to a ko label where the English label
  has none.
- **Mono labels in ko look like:** 02 / 통과 · 최근 7일 · 2026.11.12 → 11.19 UTC · 포착 11:21:21 EST · 10 m · 물체
  16,917개 · TLE 기준 2026-11-08 03:15Z · CELESTRAK · 태양 12.4°S 118.2°E · 최근접 시각 · UTC.
- **Abbreviations.** Korean labels use short nouns, not clipped words. Never clip a Hangul term to fit (고 for 고도).
  Latin abbreviations stay: UTC, NORAD, TLE, GMST, km, m. English clippings become Korean nouns: Asc / Desc → 북행 / 남행
  · min / h / s → 분 / 시간 / 초 · IR → 적외 · Day / Twilight / Night → 낮 / 박명 / 밤.
- **The wordmark** "Watched." is never set in mono caps as a logo, and never in Hangul.
- **Attribution lines** (Contains modified Copernicus Sentinel data 2026, Landsat: USGS / NASA, Himawari: JMA, via NASA
  GIBS…) stay in English, verbatim: they are the licensors' required wording.

### 6.5 Spacing (띄어쓰기)

Korean puts a space between words (어절), and a particle is part of its word. Translators follow 한글 맞춤법 띄어쓰기
and these product decisions:

| Rule | Right | Wrong |
|---|---|---|
| A particle attaches to the word before, including Latin, digits and units | UTC에 · Sentinel-2의 · 786 km에서 · Paris에 | UTC 에 |
| A counter attaches to an Arabic numeral | 256기 · 31장 · 12회 · 7일 · 41시간 | 256 기 |
| An SI unit is spaced | 786 km · 7.46 km/s | 786km |
| A dependent noun is spaced | 볼 수 있다 · 계산 중 · 이동 중이었다 · 7일 동안 · 41시간 전 · 3시간 후 | 볼수있다 · 계산중 |
| An auxiliary verb is spaced | 보여 준다 · 지켜봐 왔다 · 받아 온다 · 잘라 낸 | 보여준다 in one string and 보여 준다 in another |
| 쯤, 마다, 당, 부터, 까지 attach | 07:49쯤 · 10분마다 · 픽셀당 · 11월 5일까지 | 07:49 쯤 |
| Geographic generics attach to a foreign name (2017 rule) | 에베레스트산 · 황푸강 · 보스포루스해협 · 키클라데스제도 · 미드호 | 에베레스트 산 |
| Glossary compounds are copied as written | 기상위성 · 정찰위성 · 정지궤도 · 우주정거장 · 관측 폭 · 관측 위성 · 지상 궤적 · 태양 고도 · 현지 시각 · 다시 보기 · 하루이틀 · 먼바다 · 그다음 · 밤낮없이 | 기상 위성 in one string and 기상위성 in another |
| 지난 일주일 is two words; 지난주 is a different word | 지난 일주일 | 지난일주일 |
| A parenthesis attaches | 11월 1일(일) · 12장(Sentinel-2…) · 닫기(Esc) | 11월 1일 (일) |

Spelling traps reviewers catch first: 돼 / 됐다 (never 되 / 됬다: 공개됐다, 차단돼), 며칠 (never 몇일), 안 / 않 (보지
않았다, 안 보인다), 로서 / 로써, 이뤄진다 / 이루어진다 (either, consistently: this product writes 이뤄진다).

### 6.6 Line breaking

- **One rule on the root, for every surface:**
  ```css
  :root:lang(ko) { word-break: keep-all; overflow-wrap: break-word; }
  ```
  `scripts.css` already sets `keep-all` there; add `overflow-wrap: break-word`. Browsers break Hangul between any two
  syllables by default, which splits words (지켜 / 봤다); keep-all breaks only at spaces, as Korean readers expect, and
  keeps 256 with 기. `break-word` still rescues a long URL or name and does not change an item's min-content size.
  Never `overflow-wrap: anywhere` for ko: it counts its break points in min-content, so inside a flex or grid row (the
  search line, the three share buttons on a 360 px phone, chips) an item shrinks and breaks a word in the middle (다시
  시 / 도). Components that set `anywhere` themselves (the pass name) carry Latin satellite names, not Hangul; leave
  them. It is CSS only: no script, no cost.
- `text-wrap: balance` on the results headline, the sub line and the card's DOM preview (keep-all makes ragged lines;
  a lone 지켜봤다. on the last line is the usual result). Free, and ignored where unsupported.
- Never break between a number and its counter or unit: counters are attached text, units sit inside the num part.
- **The hero** is three explicit lines and never reflows; the About title is two explicit lines.
- Translators insert no manual line breaks, no zero-width spaces and no `<br>`. The only exceptions are the hero, the
  About title and the card headline's parts, which come as separate parts.
- **Verdict titles may wrap at their spaces:** 아마 / 지켜봤다 · 여기를 볼 수도 / 있었다 · 상공을 / 지나갔다.
- A break between [PLACE] and 일대를 is allowed (a word boundary).

### 6.7 Type in Korean (for whoever builds the ko styles)

The values are the CJK tokens in `src/styles/scripts.css` (`:root:lang(ko)` and `:root[data-script='cjk']`), set from
specimens of each script against the English (2026-11-19). This guide does not restate the stacks or the numbers: change
them there, and only after a Korean specimen check.

- **No Korean web font for running text.** A Hangul font is 1–5 MB a weight; even in unicode-range slices it costs dozens
  of requests and delays first paint. System fonts (Apple SD Gothic Neo, Malgun Gothic, Noto Sans KR…), after the brand's
  Latin faces, so digits, units and Latin names stay on brand. Martian Mono has no Hangul: Hangul in labels falls to the
  system sans; digits stay in Martian Mono, tabular.
- **The static accents** (the hero's 당신, About's 돌아간다) come from `--font-accent`: `scripts/build-accent-fonts.py`
  subsets Noto Serif KR (SIL OFL 1.1, weight 500, the CJK constant that matches `--w-serif: 500`) to exactly the glyphs of
  every static `accent('…')` in `src/i18n/ko/*.ts` (today 당, 신, 돌, 아, 간, 다), and embeds it as base64 in the `ko`
  chunk. `src/i18n/accentFont.ts` installs it with the FontFace API before the first render (`startLocale` awaits it),
  so the accent is a real Myeongjo on every device, with no request of its own, and never swaps mid-wipe. A test fails
  when a static accent has glyphs the face lacks: re-run the script after changing one. Never load it from Google
  Fonts, never preload a separate file.
- **The runtime place accent** (a Hangul place name in the headline) uses `--font-serif`: Instrument Serif, then the
  platform Myeongjo (`--cjk-serif`), then the sans. Never the subset: names are unbounded and a Hangul name would mix
  faces inside one word.
- **Upright, never slanted:** Hangul has no italic. `font-synthesis-style: none` is set for CJK (not `font-synthesis:
  none`, which would also stop bold synthesis). Latin place names keep Instrument Serif italic.
- **Display:** Hangul is full-width and cannot be condensed (never scaleX it). `--display-k` 0.8 on desktops and 0.9 on
  phones; leading `0.92 × --lh-k 1.2` ≈ 1.1 (0.92 makes Hangul lines collide); tracking `--track-display` −0.01em (Korean
  headlines are set slightly tight; 0 looks loose at 80–100 px, −0.02em crowds the jamo).
- **Running text:** leading ≈ 1.75 (`--lh-text-k` 1.1667 over the base 1.5).
- **Labels:** 12 px on laptops, 11 px on phones (`--fs-label`) with +0.1em tracking (`--track-label`), set for CJK: Hangul at 10.5 px is a smudge,
  and the wider tracking keeps the Latin caps that share a label (TLE 기준 … · CELESTRAK) from crowding.
- **Weights** (never 501–599: system CJK fonts round them up): display 600, panel heads 500, strong 600, serif 500, body
  400.

### 6.8 Share card rendering for ko (engineering; each item is a constant or a few lines, no cost per view)

1. **Headline parts:** lead / place / tail as three blocks (§3.6). In satori, set `wordBreak: 'keep-all'` on the text
   blocks of a ko card: satori breaks between any two Hangul syllables (UAX #14) and would split 지켜 / 봤다; the canvas
   wrapper already breaks Hangul only at spaces (Hangul is not in `SPACELESS`), and the DOM preview inherits keep-all.
   One style property, and all three renderers agree.
2. **Headline size:** `headlineSize()` counts `lead.length` (for ko the lead and the tail together), so a Hangul syllable
   counts as one condensed Latin character, though it is twice as wide. Weight Hangul syllables (U+AC00–D7A3, jamo) × 2
   in that count, or choose the size by measured width, the largest step at which the lead and the tail each take at
   most two lines and the whole block fits its band. Test with the longest lead, the week card at n = 0 (지난 일주일,
   추적 중인 어떤 위성도 / *place* / 일대를 지켜보지 않았다.), which must fit at 54 px.
3. **Leading:** Hangul text blocks (lead, tail, hero, a Hangul place) at ≥ 1.1 (Latin keeps 0.94 and 0.9): a Hangul
   glyph fills its em, and at 0.94 lines touch.
4. **Accent scale:** the hero's serif is drawn at `size × 1.12` to match Instrument Serif's cap height to the condensed
   sans. Hangul in Myeongjo and Gothic shares the em box, so for Hangul the factor is the web's CJK `--accent-k` (0.96)
   or 1.0, never 1.12 (당신 would come out bigger than its own 을). The same applies to `HEAD.placeScale` for a Hangul
   place.
5. **Upright:** never request italic for Hangul runs in any renderer. The canvas PNG would otherwise draw a synthetic
   slant the DOM preview does not show; draw CJK runs of the accent upright and keep italic for Latin runs.
6. **Fonts on the server (satori):** today every Hangul glyph comes from `fallbackFonts.ts`, which asks Google Fonts for
   Noto Sans KR at weight 400 only, so the display face's 600 comes out Regular, 위성 31기가 loses its weight, and 당신
   is drawn in the sans. For a ko card, load Noto Sans KR at 600 for the display blocks' glyphs and Noto Serif KR (500)
   for the accent's, through the same `text=` subset loader (a few kB, once per card render; the card is then cached per
   link). No bundled font and no glyph list to maintain. This is server-side, so no visitor's browser contacts Google.

---

## 7. Length discipline

**How ko compares with English**

- **Characters:** about 45–55% of the English count (one syllable block holds two or three letters' worth of sound).
- **Width:** a Hangul syllable is about 0.95–1 em. Condensed Instrument Sans averages about 0.45 em a character, body
  text about 0.5 em, Martian Mono about 0.6 em plus tracking. So:
  - prose: about 0.9–1.1 × the English width (typical: 1.0);
  - Sino-Korean labels (고도, 통과, 기울기): 0.4–0.8 ×;
  - transliterated loanwords (타임랩스, 아카이브, 카탈로그): 0.8–1.1 ×;
  - display lines: 1.2–1.4 ×, because the condensed Latin display is so narrow; hence `--display-k`.
- **Height:** Hangul needs more leading, so a paragraph at the same width runs about 5–10% taller.
- **Mono rows:** a Hangul syllable in the fallback sans is about 1.6 Latin mono widths. A 390 px phone row holds about 40
  Latin widths: about 22 syllables plus digits.
- **X posts:** X counts every Hangul character as 2. The post builder already weights it (`links.ts xLength`, a
  256-unit budget with a 120-character place name, then the hook is dropped, then the first paragraph cut): never add a
  second weighting. Keep a post paragraph's fixed words to about 60 syllables.
- **Share card sizing:** §6.8 item 2.

**Strategies**

1. Prefer a two-syllable Sino-Korean noun: 저장 (2), not 다운로드 (4); 고도, not 높이.
2. Buttons are object + action noun (이미지 저장), up to 6 syllables. Mono labels up to 5 syllables plus their data.
   Chips up to 6 syllables (기자 피라미드 is the longest).
3. Drop the subject, the possessive and the pronoun (그것의, 당신의, 이 위성의).
4. Readout-like sentences become a noun and a colon: 장면 전체 구름양: 25%.
5. Don't stack modifiers: split into two sentences.
6. Where a narrow layout drops a strong part, put the droppable words where Korean drops them: the verb at the end
   (`['내 장소', strong(' 찾기')]`), the object at the front (`[strong('이 통과 '), '공유']`).
7. Never truncate or clip a Hangul word to fit. Find a shorter word, or let the line wrap at a space.

| EN | ko | Syllables | Note |
|---|---|---|---|
| SURPRISE ME | 아무 곳이나 | 5 | "Anywhere at all." |
| USE MY LOCATION / LOCATE ME / NEAR ME | 내 위치 사용 / 내 위치 찾기 / 내 위치 | 5 / 5 / 3 | |
| HOW THIS WORKS | 작동 방식 | 4 | |
| LAST 7 DAYS | 최근 7일 | 3 + digit | |
| OR TRY | 이런 곳도 | 4 | |
| CLOSEST LOOK | 가장 자세한 모습 | 7 | The longest chip word; it carries the honest meaning. |
| TIME-LAPSE | 타임랩스 | 4 | Its sub line: 해마다 본 이곳 |
| OFF-NADIR / PIXEL / ALTITUDE | 기울기 / 픽셀 / 고도 | 3 / 2 / 2 | |
| PASSES | 통과 | 2 | Section label; the count unit is 회. |
| SHARE / COPY LINK / POST TO X / SAVE PNG | 공유 / 링크 복사 / X에 게시 / PNG 저장 | 2 / 4 / 3 + X / 2 + PNG | Three share buttons fit a 360 px phone. |
| DOWNLOAD IMAGE | 이미지 저장 | 5 | Busy 저장 중… · fallback 이미지 열어서 저장 |
| REPLAY | 다시 보기 | 4 | Tablet: 이 통과 다시 보기 |
| VIDEO / RENDERING 42% / VIDEO FAILED / SAVE VIDEO | 동영상 / 만드는 중 42% / 만들기 실패 / 동영상 저장 | 3 / 4 + digits / 5 / 5 | One 132 px button through all four. |
| GROUND SPEED / HEADING / FIELD OF REGARD | 지상 속도 / 진행 방향 / 지향 범위 | 4 | |
| ELEVATION FROM YOU | 고도각 | 3 | Its unit carries the 16-point direction: 45.0° 남남서 |
| SUN ELEVATION | 태양 고도 | 4 | Unit 낮 / 박명 / 밤 |
| CLOSEST · UTC | 최근접 시각 · UTC | 5 | |
| SCAN LINE HERE · UTC | 스캔 선 도달 · UTC | 5 | |
| CLOUD AT SPOT | 지점 구름 | 4 | |
| DETAILED / WEATHER / RADAR / ALL | 상세 / 기상 / 레이더 / 전체 | 2–3 | Gallery filter. |
| NEW SEARCH / CANCEL / CLOSE | 새 검색 / 취소 / 닫기 | 3 / 2 / 2 | One shared box. |
| LINK / POST (48 px column) | 링크 / 게시글 | 2 / 3 | |

---

## 8. Sensitive content

**Surveillance and privacy**

- The product verb is 지켜보다, and that is enough. Never 감시, 사찰, 감청, 염탐, 엿보다, 몰래카메라 / 몰카 / 도촬,
  스파이, 감시 사회, 빅브라더.
- Military imaging satellites are 정찰위성 or 군사 위성. Never 스파이 위성, 첩보 위성.
- The privacy section is 개인정보 (the Korean legal term), not 프라이버시.
- Privacy statements say exactly what the English says, no more and no less, and name who keeps what (Watched는 …
  남기지 않는다):
  - "a rough 10 km area" → 약 10 km 크기의 구역 · "a spot rounded to about 1 km" → 약 1 km 단위로 반올림한 지점
  - "No IP addresses, no cookies of our own, nothing that ties one visit to the next" → IP 주소도, 자체 쿠키도, 한
    방문과 다음 방문을 잇는 정보도 남기지 않는다. (a statement of what is kept, not of what is absent)
  - Never add 완전한 익명, 안심하세요, 철저히 보호, 소중히 다룹니다.
- "Can it see me?" stays a factual no (안 보인다 … 당신은 그보다 작다). Never 걱정하지 마세요.

**War zones in the time-lapse** (Gaza Strip, West Bank, Ukraine, Lebanon)

- The time-lapse shows change, and the copy only says when each frame was taken. No words of war or judgment the
  English lacks: never 전쟁 지역, 분쟁 지역, 참상, 폭격, 파괴, 피해, 점령지. The season line stays neutral: 맑은 모습
  12장 · 해마다 여름에 1장.
- If one of these names appears in a Korean string, use the press standard: 가자지구, 요르단강 서안지구, 우크라이나,
  레바논.
- Never caption a year with an event.

**Glaciers**

- 빙하, neutral. "The end of the melt season (mid-August north, mid-February south)" → 녹는 철이 끝날 무렵(북반구 8월
  중순, 남반구 2월 중순). No 사라지는, 녹아내리는, 기후 위기 rhetoric the English doesn't have.

**Place-name politics for ko (strings the translator writes)**

| Place | ko | Note |
|---|---|---|
| Kyiv, Kyiv Oblast | 키이우, 키이우주 | Not 키예프 (government and press switched in 2022). |
| Kharkiv, Lviv, Odesa, Dnipro | 하르키우, 르비우, 오데사, 드니프로 | The 2022 government–press joint committee forms (르비우, not 리비우). |
| Chernobyl (curated chip) | 체르노빌 | Deliberate: the English label keeps the plant's established name, and so does Korean; the committee's 초르노빌 is not used for this chip. |
| Taiwan | 대만 | As `Intl.DisplayNames('ko')` returns it. Never 중국 대만, 대만성. |
| Hong Kong, Macau | as Intl returns them | 홍콩(중국 특별행정구) long, 홍콩 short; use the style the English UI uses. Never hand-edit. |
| Palestinian territories | 팔레스타인 지구 | Intl, long style. |
| Gaza Strip, West Bank | 가자지구, 요르단강 서안지구 | |
| Crimea | 크림반도 | Add no sovereignty the English doesn't state. |
| Türkiye | 튀르키예 | Intl (older engines may say 터키: accepted, country names are never typed by hand). |
| Korea | 대한민국, 북한 | As Intl returns them. Never 남한 or 조선 as country names. |
| East Sea / Dokdo / Mount Paektu / Yellow Sea, when the translator writes them | 동해 / 독도 / 백두산 / 황해 | Never 일본해, 다케시마, 리앙쿠르 암초, 장백산. 서해 is fine in prose. |

- Country names always come from `Intl.DisplayNames('ko', { type: 'region' })`, never typed by hand (the curated
  sublabels copy Intl's forms).
- **Place names that arrive as data are shown as they come** (I18N.md: one town is one stats row whatever the
  language), and translation files never override them. For Korean visitors that rule meets four charged names: the
  offline list has `Paektu-san` with country CN (shown 백두산 nowhere: `Paektu-san · 중국`) and a `Changbai` entry; the
  network geocoders, asked in English, return `Sea of Japan` and `Liancourt Rocks`, so a headline could read 위성 31기가
  Sea of Japan 일대를 지켜봤다. **Decision:** ship a display-only override for ko, keyed on the English label plus a
  bounding box, under 1 kB in the `ko` chunk, that changes the name and nothing else (the where line stays the data's;
  stats, record_lookup and shares keep the English label, as `canonicalLabel` already does for curated places):

  | English data label | Shown in ko |
  |---|---|
  | Sea of Japan / East Sea | 동해 |
  | Liancourt Rocks / Takeshima | 독도 |
  | Paektu-san / Changbai Mountain | 백두산 |
  | Yellow Sea | 황해 |

  It changes I18N.md's "names are data" rule for one language, so it shipped with the owner's sign-off (2026-11-19):
  `src/i18n/ko/exonyms.ts`, keyed on the English label and the country the data gives it rather than a bounding box
  (a sea has no country, so a restaurant called *Sea of Japan* in Tokyo keeps its name), with the spellings the data
  uses (`Dokdo`, `Paektu Mountain`, `Baekdu Mountain`, …). Translators write nothing for it.
- **Romanised Korean towns.** Korean visitors will mostly see Seongnam-si, Seogwipo, Seoraksan with a where line like
  Gyeonggi-do, 대한민국, because the offline list holds GeoNames' romanised names. **Decision for launch:** accept it
  (honest, free). Showing GeoNames' `ko` alternate names for KR rows (display only, stats in English) is an owner
  decision: it adds a column to a few thousand rows (tens of kB across shards) and one rebuild (~10 MB of git history).
  Before ko is listed, test whether a Hangul query (성남) finds the town: if the offline list cannot match Hangul, every
  Korean search would go to the network geocoders (Open-Meteo's free tier is ~10,000 requests a day), and the `ko`
  column becomes the cheaper choice.
- Curated landmark chips are product strings and take the standard Korean exonym (§3.8).

---

## 9. Pitfalls and the reviewer's checklist

### 9.1 False friends and traps

| Trap | Wrong | Right | Why |
|---|---|---|---|
| watched | 감시했다, 촬영했다, 봤다 | 지켜봤다 | Surveillance tone; the owner's "never photographed"; 봤다 is a glance. |
| something | 누군가, 뭔가 | 무언가 | 누군가 puts a person behind it; 뭔가 is casual. |
| this week | 이번 주, 지난주 | 지난 일주일 | Calendar week; the previous calendar week. |
| image | 영상 | 이미지 | Most readers hear "video". |
| video | 영상 | 동영상 | Keep 영상 out of the product entirely. |
| mosaic | 모자이크 | 합성 이미지 | Blurring and censorship to Korean readers. |
| full disc | 전구 | 지구 전면 | 전구 is also "light bulb". |
| fixed camera | 고정 카메라 | 늘 바로 아래를 보는 카메라 | It reads as a CCTV camera. |
| closest look | 최근접, 가장 가까운 모습 | 가장 자세한 모습 | The most detailed clear image, not the closest approach. |
| local time | 현지 시간 | 현지 시각 | 시간 is a duration; 시각 is a moment. |
| elevation | 고도, 해발 | 고도각 | 고도 is the orbit's altitude. |
| straight up | 천정 | 거의 바로 머리 위 | Heard as 천장, the ceiling. |
| pass | 패스 | 통과 | Pass, password, skip. |
| rows | 40회 더 보기 | 40개 더 보기 | Rows are satellites or photos, not passes: 회 would state a false count. |
| once | 1번 | 한 번 | 1번 also reads "number 1". |
| imager (prose) | 이미저가 | 센서가 | Jargon in prose; 이미저 only in blurbs. |
| geocoder | 지오코더 | 주소 검색 서비스 | |
| scene | 씬, 신 | 장면 | |
| operator | 오퍼레이터, 운영자 | 운영사 | 오퍼레이터 is a call-centre agent. |
| commercial | 커머셜, 상업/상용 mixed | 상업 | One form everywhere (상용 is correct Korean, but not this product's). |
| station | 정거장, 스테이션 | 우주정거장 | A bus stop, a petrol station. |
| range | 사정거리 | 닿는 범위, 보이는 범위 | Weapon range. |
| spot | 스팟, [PLACE] 지점 | 이 지점 | [PLACE] 지점 reads as a bank branch. |
| back (to the landing) | 뒤로 | 처음으로 | 뒤로 is "previous". |
| post (the share text) | 포스트 | 게시글 | |
| window (time) / cell | 윈도우 / 셀 | 기간 / 구역 | |
| the actual image | 진짜 이미지 | 실제 이미지 | 진짜 implies the others are fake. |
| imaging satellite | 촬영 위성, 영상 위성 | 관측 위성 | |
| day (sun state) | 일 | 낮 | 일 is a date (1일) and Sunday. |
| light ("radar doesn't need light") | 조명 | 빛 | |
| likely | 아마도 촬영, 추정 촬영 | 아마 지켜봤다 | One vocabulary (§3.5). |
| ascending / descending | 상승 / 하강 | 북행 / 남행 | Climbing and falling. |
| Himawari, Landsat 9 | 히마와리 9호, 랜드샛 9호 | Himawari-9, Landsat 9 | Catalog names are never changed; no 호. |
| [PLACE]를, [SAT]가 | Waterloo를, Sentinel-2C가 | Waterloo 일대를, Sentinel-2C 위성이 | §5. |
| 을(를) | Waterloo을(를) | Waterloo 일대를 | Double forms are never shipped. |
| a counter as a num unit | `num(n, '기')` → 위성 256 기가 | `strong('위성 ', num(n), '기가')` | §5.4. |
| the card tail | `accent(place, ' 일대를 지켜봤다.')` | `accent(place), '일대를 지켜봤다.'` | Serif tail; doubled space in the title. |
| dates | 11/1(일), 11.1 | 11월 1일(일); 2026.11.1(일) with a year | Slash means "of" here; a bare dotted day reads as a decimal. |

### 9.2 Reviewer's checklist (run it on every string)

1. **Register:** 한다체 only. No -ㅂ니다, -요, -세요, -주세요, -시-, 드리다, 저희, 고객님, 죄송합니다. No plain imperative
   (-라). No 반말 (-어, -지?). One register per block.
2. **Product verb:** "watched" is 지켜봤다. 관측하다 only for what an instrument does in general, 찍다 only where the
   English says took / taken / imaged of a camera, 담다 for radar. No 감시, no 촬영.
3. **Hero:** the landing is exactly 지난 일주일, / 무언가 *당신*을 / 지켜봤다.; the default card is 무언가 / *당신*을 /
   지켜봤다.; the accent is 당신 only, upright Myeongjo, never slanted.
4. **당신** appears only in the sanctioned lines (top table), at most once a screen. No 우리, 저희, 너, 여러분. Where the
   actor matters, Watched는 / Watched가 or a passive.
5. **Time words:** "this week" is 지난 일주일 / 그 일주일; numeric windows are 최근 [N]일. No 이번 주, no 지난주.
6. **Particles:** no 이/가, 은/는, 을/를, 와/과, (으)로 or 이다 directly after a slot; a buffer (일대, 상공, 위성, 센서) or an
   invariant particle (의, 에, 에서, 도, 까지, 쯤) instead. No 을(를).
7. **Counters:** 기 satellites, 장 images, 회 passes in counts and readouts, 번 times in prose (1 → 한 번), 개 rows,
   objects, scenes, orbits and bands, 건 results. Counters attached to the digits as plain text after the number part,
   never a num() unit in a sentence; SI units spaced. No 만 / 억, no Hangul numerals for data, no full-width digits.
8. **Plurals:** one `other` string. Zero has its own sentence where the English has one. No "위성 0기" in a sentence. No
   -들 after a counted noun.
9. **[PLACE]:** inserted bare, no article, no quotes, no translation; the accent covers the name only; romanised Korean
   towns left as they come.
10. **[SAT]:** never transliterated, never with 호, never replaced by a pronoun; 위성이 in headlines, 위성은 opening a
    paragraph; undefined → 이름 미상 in the slot.
11. **Verdict words** match §3.5 exactly (titles, lanes, unit 회, definitions, verbs), quoted in ‘ ’ in footnotes.
12. **Card headline:** phrase parts of about 4–8 syllables cut at word boundaries (each is one card line, §3.6), no
    leading space, nothing inside the accent but the place; `cut` keeps the tail and its full stop.
13. **Glossary traps** (§9.1): no 영상, 모자이크, 전구, 고정 카메라, 최근접 for "closest look", 현지 시간, 패스, 지오코더,
    상용 / 상업 mixed.
14. **Punctuation:** Western and half-width. No !. … only after 중. Ranges ~ in prose, → in mono. · only as the mono
    separator. ‘ ’ for terms, “ ” for quotes. No ※. No em dash in prose.
15. **Spacing and spelling:** §6.5; glossary compounds copied exactly; 돼 / 됐다, 며칠, 않다 spelled right.
16. **Dates and times** follow §6.3: 11월 1일(일) for the day slot and prose, dotted only with a year, no space before the
    parenthesis, 24-hour clock, 쯤 for "about", 현지 시각 for "local", 방금 for "just now", no zero padding in duration
    words.
17. **Compass:** 8-point words with 쪽 in prose, 16-point Hangul in readouts. Coordinates N/S/E/W in readouts, 북위 /
    동경 in prose.
18. **Honesty:** every label says exactly what is on screen. 이미지, not 사진, wherever radar or composites can appear.
    이곳 바로 위 only when the code says overhead. Rows counted in 개, never as passes. No claim the English doesn't
    make.
19. **Length:** labels, buttons and chips within §7; droppable strong parts where Korean drops words; no clipped words.
20. **Names left alone:** Watched, www.watched.earth, satellite, sensor and product names, NORAD IDs, UTC, zone
    abbreviations, attribution lines, Enter and Esc.
21. **Read it aloud.** If it sounds like a bank notice, a Toss push notification or a translated manual, it is wrong. It
    should sound like a calm entry in an observation log that happens to be about you.

---

## Decisions log

The critique's 32 numbered items and its 7 "Missing from the guide" groups (39 in all): 30 accepted, 9 partly
accepted, 0 rejected.

| # | Item | Resolution |
|---|---|---|
| 1 | Default card hero overflows the 466 px column | Accepted: `card.hero` is 무언가 / *당신*을 / 지켜봤다. (stamp carries the time); renderer: CJK leading ≥ 1.1, accent scale 0.96–1.0 for Hangul, upright (§3.1, §6.8). |
| 2 | Counters must never be a num() unit | Accepted: counter is text after the number part in sentences; a unit only in stacked readouts; no Hangul in `tightUnit` (§5.4). |
| 3 | Unnamed satellite: zero-code fix | Partly accepted: no new key or code, but via the catalog's own mechanism: sentences get `sat` undefined and write 이름 미상 into the slot (`named()`); `aSatellite` itself is 이름 미상 위성, a label (§5.3). |
| 4 | Rows are not passes (40회 더 보기) | Accepted: sats 위성 [N]기, showAllSats, showAllRows / showMore / left in 개, showFewer 접기 (§3.7 passView). |
| 5 | Card headline parts, cut, keep-all, sizing, n = 0 week | Accepted: tail its own part with no leading space, never in the accent; cut keeps the tail; satori keep-all; Hangul weighted in sizing; week n = 0 frame added, both week frames open 지난 일주일, (§3.6, §6.8). |
| 6 | Server card fonts drawn in Noto Sans KR 400 | Partly accepted: load Noto Sans KR 600 and Noto Serif KR 500 through the existing free subset loader, as for ja; the bundled TTF subset is not adopted (bundle weight and a glyph list to maintain for no visitor-facing gain once cards are cached per link) (§6.8). |
| 7 | Accent subset delivery and flicker | Partly accepted: the existing mechanism already answers it (embedded base64, FontFace before first render, no request, no swap, glyphs read from static accents, 도 gone automatically); weight stays the CJK constant 500, not 600; satori's serif via item 6; stacks point at scripts.css (§6.7). |
| 8 | 지켜본 것 ambiguous; 당신 twice on the share sheet | Accepted: placeTitle 지난 일주일, 무엇이 [PLACE] 일대를 지켜봤나; placeDescription and question 무엇이 당신을 지켜봤을까?; invite 무엇이 나를 지켜봤을까; two rhetorical questions noted (§3.6). |
| 9 | `overflow-wrap: anywhere` undoes keep-all in flex rows | Accepted: `keep-all` + `break-word` on `:root:lang(ko)`; `text-wrap: balance` on headline, sub and preview (§6.6). |
| 10 | About lede switches subject; privacy "we" | Partly accepted: actor named (Watched가) but the conditional kept (고르면) rather than a bare 고른다, which reads as an instruction; privacy says Watched는 … 남기지 않는다 (§3.7 about, §8). |
| 11 | Contested names arrive as data; Lviv, West Bank | Partly accepted: 르비우 and 요르단강 서안지구 corrected; the display-only override (name only, not the where line) is the decision but ships with owner sign-off, since it changes I18N.md's rule; 체르노빌 recorded as deliberate (§8). |
| 12 | Romanised Korean towns | Accepted: stated in §5.2 and §8; launch accepts it; GeoNames `ko` names an owner decision, with the Hangul-search test and the free-tier cost note. |
| 13 | Zero-image explanations, radar line, footnotes missing | Accepted with edits: 이곳이 보이는 범위 for radar, 상공 for 위, 한 번 for 1, why.none reworded around "open" (§3.7 results, engine). |
| 14 | Satellite blurbs: register and terms | Accepted with edits: one line, colon or one sentence; 관측한다 for "images", 지켜봐 왔다; Korean programme names once in parentheses (§3.7 sats). |
| 15 | Sub line repeats 위 | Accepted: 지구 어디든 … 그 상공을 지나간 … (§3.2). |
| 16 | Pass sentence polish (8 points) | Accepted: 이곳 바로 위; offset measured from 이곳; 이동 중이었다; 이곳은 관측 폭 안에; mosaic split; radar 담았다 + 어둠 속이었다; 낮이었으므로; 이곳에서 보면 … 하늘 (§3.4). |
| 17 | 이미저 → 센서; 지오코더 | Accepted: 센서 in prose, 이미저 in blurbs; Photon 주소 검색 서비스 (§4). |
| 18 | Verdict definitions | Accepted: 이곳을 찍은 이미지는 …; place as subject for could; 나머지 모든 위성 (§3.5). |
| 19 | About Q&A and 05 출처 | Accepted: 내가 보일까? / 안 보인다 … 당신은 그보다 작다.; 전부는 아니다.; 05 크레딧 (§3.7 about). |
| 20 | Share hook 머리 위 | Accepted: 지난 일주일, 당신 머리 위로는 무엇이 지나갔을까? (§3.6). |
| 21 | About title 돌아간다 | Accepted: 이렇게 / *돌아간다*.; the subset glyphs follow automatically (§3.7 about, §6.7). |
| 22 | Tab title loses its verb | Accepted: Watched · 무언가 당신을 지켜봤다 for documentTitle and boot title; og keeps the full sentence (§3.1). |
| 23 | Dates: dots not slashes; weekTo year; durations | Partly accepted: no slashes; dotted only with a year (kicker, stamps, time-lapse); the day slot and bare day-months in words (11월 1일(일), 11월 3일), since speech engines read "11.1" as a decimal; weekTo keeps the year; no zero padding in duration words (§6.3). |
| 24 | Tokens as values | Partly accepted: the guide points at the CJK tokens scripts.css set from specimens (12 px labels, +0.1em, −0.01em display); the draft's "tracking 0" withdrawn; 11 px labels, 0.03em and −0.02em not adopted without a ko specimen (§6.7). |
| 25 | Giza chip; US states with 주 | Accepted: 기자 피라미드 / 기자의 피라미드; 네바다주, 애리조나주; 그룸 레이크; full table (§3.8). |
| 26 | 상용 does mean commercial | Partly accepted: the note is corrected (상용 is correct Korean); 상업 stays the one form everywhere (§4). |
| 27 | Buttons and short lines | Accepted: 처음으로, 다시 시도 중…, 연결이 느려 아직 불러오는 중, Watched, 처음으로 (§3.7 app, hud). |
| 28 | "Check your place": Korean drops the verb | Partly accepted: outcome as proposed (full 내 장소 찾기, narrow 내 장소), built with the existing parts by putting the strong part at the end, so no new key (§3.7 results, §7). |
| 29 | The where line join | Accepted: [REST], [COUNTRY] (§3.7 geo). |
| 30 | Key caps | Accepted: 스페이스; Enter and Esc as printed (§3.7 about, results). |
| 31 | -면 된다 in every notice | Accepted: at most one per notice, only for a one-step way out; -ㄹ 수 있다 for what still works (§1.1, §1.2). |
| 32 | Small corrections (xLength, ISS 위성이, 튀르키예/터키, 태양 고도) | Accepted: all four recorded (§7, §5.3, §8, §4). |
| M1 | Computing readout rows | Accepted with edits: in-progress rows in 중 (궤도 412개 계산 중 · 7일); scenes in 개 (§3.7 engine). |
| M2 | Geometry and strip labels | Accepted with edits: band values 적외선 / 가시광 / 컬러; 위 · [DIR16] for "up"; 최근접 시각 (§3.7 passView). |
| M3 | Gallery and viewer | Accepted with edits: filterLabel 표시할 이미지; noun endings for mono readouts (이미지를 받지 못함); 이미지 for "photo" in chrome (§3.7 gallery, lightbox). |
| M4 | Time-lapse | Accepted with edits: 만드는 중 42% to keep the 132 px button; captionShort as a label (이곳의 타임랩스 없음); 가로세로 10 km (§3.7 timelapse). |
| M5 | Share sheet and share page | Accepted with edits: cardAlt says 이미지; defaultAlt quotes the card hero; 링크 생성 중… per the status-line rule; slug fallback noted for engineers (§3.7 share, card). |
| M6 | Globe and HUD | Accepted with edits: 그 상공을 지나간 위성이 보인다; key caps in attached parentheses; catalog age 방금 for under a minute (§3.7 globe, hud). |
| M7 | Agencies | Accepted: Latin acronyms everywhere; on About only, the first mention may carry the Korean name; licence lines stay English (§3.7 about). |
