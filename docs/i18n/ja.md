# Watched: Japanese (ja) localisation style guide

Final. Binding for every Japanese string the product shows, speaks or sends: the landing, the computing readout, the
results panel, the pass list and pass view, the gallery and photo viewer, the time-lapse, the globe and HUD, the share
sheet, the share card (DOM preview, PNG, Open Graph unfurl), the share page and post text, alt text and aria labels, the
loading screen and the About page. Written against `docs/DESIGN.md` §7, `docs/I18N.md`, the English catalogs in
`src/i18n/en/`, `api/_lib/i18n/card/en.ts`, `src/ui/results/lib/copy.ts` and `meta.ts` (not yet in a catalog: their
Japanese is given here so it is ready when they move), and the card renderers. Where this guide and a translator's
habit disagree, this guide wins. Where this guide and `docs/DESIGN.md` disagree on anything that is not language,
DESIGN wins. Where this guide and the English disagree on a fact, the English wins and this guide is wrong: report it.

**Notation.** `[PLACE]`, `[SAT]`, `[NUM]`, `[N]`, `[DAYS]`, `[TIME]` (a 24 h clock with its zone, "16:14:21 EST"),
`[ALT]`, `[DIST]`, `[SPEED]`, `[DIR8]`, `[DIR16]`, `[DEG]`, `[PCT]`, `[DAY]` are runtime slots. In frames, `*…*` is
the serif accent and `**…**` the bold count phrase. Japanese examples are written bare (no quotation marks around them),
so that a 「」 you see is part of the copy.

**The voice in one line:** 静かに、事実だけを、短く。 Quiet, facts only, short. Plain form (常体) everywhere. あなた
only in the hero and the few lines that echo it. Real numbers, half-width, set apart in the mono face.

**Cost and speed.** Everything here is static copy in the `ja` chunk, CSS, or a constant in a renderer. Japanese adds
no webfont download for running text (system fonts), no segmenter library, no runtime service, no request on page
load. The only font bytes are a subset of the few glyphs of the two static accents (あなた, 仕組み), a few kB inside
the `ja` chunk the page already loads. Share cards use the free Google Fonts text-subset loader the server already
has, once per link (the card is cached per link).

### Decisions at a glance

| Question | Decision |
|---|---|
| Register | 常体 (plain form) on every surface. No です／ます, no ください, no imperative. Instructions: 〜は〜から。, one 〜できる, or a noun ending. |
| "you" | あなた only in: the hero (and its plain copies), the two post hooks, the card's invitation, About's "Can it see me?" answer. Elsewhere zero subject or この場所 / この地点. |
| "we" | Leave it out (zero subject). 私たち only where a contrast needs it. Never 弊社, 当サイト, 我々. |
| Product verb | 見る → 見ていた. Instruments 観測 / 走査 in general statements; 撮像 only in the globe's mono callout. Never 監視, never 撮影. |
| Hero | 今週、何かが／*あなた*を／見ていた。 (the default share card: four lines, 今週、／何かが／*あなた*を／見ていた。) |
| Verdicts | 見ていた · おそらく見ていた · 向ければ見えた · 上空を通った; lanes 画像 · 推定 · 可能性 · 上空; unit 回 |
| Counters | satellites 基 · images, frames, clear looks 枚 · passes, times 回 · rows, scenes, results 件 · catalog objects 個 (prose) |
| Plural | One CLDR category, `other` (cardinal and ordinal). One string per message; zero gets its own sentence where English has one. |
| Numbers | 1,715 · 7.46 km/s · 25% · 98.6° · 786 km. Half-width digits, comma grouping, never 万 / 億. |
| Dates | Mono: 11/1(日), 2026/11/1(日). Prose: 11月1日（日）, 2026年11月1日（日）. Spoken: 11月1日日曜日. 24 h clock. |
| Ranges | Mono: 10–30 m, kicker 2026/11/12 → 11/19 UTC. Prose: 10〜30 m (U+301C). Never ～ (U+FF5E). |
| Share card headline | Place last, a relative clause with a noun ending: 衛星7基が／見ていた／*Waterloo*。 |
| Type | System gothic and Mincho; Latin and digits stay in the brand faces. Upright accent, never slanted. palt on display. Labels 12 px on laptops, 11 px on phones (scripts.css), nothing under 11 px. |
| Country names | Intl.DisplayNames long style with seven overrides (§8). |

---

## 1. Register and address

### 1.1 One register: plain form (常体), no honorifics

| Surface | Form | Sentence shape | Example (en → ja) |
|---|---|---|---|
| Display headlines (hero, results headline, card headline, About title, time-lapse heads) | 常体 | Past or continuous verb (た / ていた / なかった) or a noun ending. Ends with 。 | Something watched you this week. → 今週、何かがあなたを見ていた。 |
| Sentences and prose (second line, pass paragraphs, footnotes, verdict definitions, notes, post text, tooltips) | 常体 | Ends on a verb (た / ている / ない) or a noun (体言止め). だ at most once per paragraph. Never である. | It was looking straight down. Cloud cover across the scene: 25%. → 真下を見ていた。シーン全体の雲量は25%。 |
| Buttons and links | No conjugation | A noun, or a dictionary-form verb with its object. | Close → 閉じる · Download image → 画像を保存 · Try again → 再試行 |
| Mono caps labels and readouts | No conjugation | A kanji noun of 2–6 glyphs. No verbs; no particle except の. | ALTITUDE → 高度 · CLOUD AT SPOT → 地点の雲 |
| Status lines | No conjugation | In progress: noun + 中… · done: noun + 済み · failed: noun + に失敗 | Creating link… → リンクを作成中… · Copied → コピー済み · Video failed → 作成に失敗 |
| Placeholders and hints | No conjugation, or one possibility statement | Noun phrase; a hint may end in 〜できる. | Search a place → 場所を検索 · Or click the globe to drop a pin → 地球儀をクリックしてピンを立てることもできる |
| Fault and error notices | 常体 | What failed, then where to act (§1.3). No apology. | Location access is blocked. Allow it in your browser settings, or search for a place. → 位置情報へのアクセスがブロックされている。許可はブラウザの設定から。場所の検索もできる。 |
| About page | 常体, a little more conversational | Questions end in ？. Answers are short. だ is allowed. | Can it see me? → 自分の姿は見える？ |
| Accessibility text (aria-label, alt, title) | Same as the visible surface it describes | Use the visible label's words; add only what a sighted reader gets from layout. | 31 passes: Watched → 31回：見ていた |

**Why plain form.** The hero and every headline must be plain to work: 何かがあなたを見ていました is a service
announcement, not a quiet shock. A headline and its second line, and a card headline and its sub line, are read as one
unit, so the body must match the headline or one block mixes two styles (文体の混在, the first thing a Japanese editor
marks). Plain form is also shorter: 〜しました, 〜されています and 〜いただけます add 2–5 glyphs a sentence in a panel
that has none to spare. Japanese readers know this voice from documentary narration, science magazines and field logs:
the register of a precise instrument.

**Rejected: です／ます throughout** (the default of Japanese consumer apps). It cannot be used for the hero and
headlines, so it forces a plain / polite mix inside one block; it adds length; and it moves the voice from instrument to
customer service, which DESIGN forbids. **Also rejected:** である体 (academic, a white paper); plain headlines over polite
body text (the mix above); imperatives (〜しろ, 〜せよ: rude or military); chatty endings (〜だよ, 〜してね, 〜しよう！).

### 1.2 Buttons, hints and the sub line

Japanese has no neutral plain imperative. So:

- **Buttons** use a noun or the dictionary form: 閉じる, 共有, 再試行, 現在地を使う. This is the iOS and Android norm.
- **Hints** state a possibility once: 地球儀をクリックしてピンを立てることもできる.
- **The sub line and About's lede** use a consequence conditional (〜すると), never a command (§3.2).
- **Never** 〜ください, 〜下さい, ご覧ください, お試しください, 〜をお願いします, 〜しましょう.

### 1.3 Fault notices and errors

Say what failed, then where the reader can act, tersely:

1. What failed: a past or negative-potential sentence. 軌道カタログを読み込めなかった。
2. Where to act, **one** of: the UI pattern 〜は〜から。 (許可はブラウザの設定から。); one 〜できる (場所の検索もできる。);
   or a noun ending for the next step (少し待って再試行。). At most one 〜できる per notice (a negative potential that
   describes the failure does not count).
3. Never add meaning the English lacks: no このまま, 引き続き, ご安心, 申し訳, すみません.
4. Never end on a bare dictionary verb for the reader's next step (場所を検索する。): in a notice it reads as the app
   announcing what it will do.

### 1.4 Address: "you" and "we"

| Word | Use | Never |
|---|---|---|
| あなた | Only in: the hero and its plain copies (tab title, og:title, the default card and its alt); the post hooks 今週、何かがあなたも見ていた。 and 今週、あなたの頭上を通ったのは？ (also the share page's closing question); the card's invitation あなたを見ていたものを見る; About's answer あなたの姿は写らない。 | 君, お前, 貴方, あなた様, 皆さん, ユーザー, お客様 |
| your spot / your place / where you are | この地点 / この場所 | あなたの地点, あなたの場所 |
| your sky / your horizon | この場所の空 / 地平線 | あなたの空 |
| your browser / your screen | ブラウザ / 画面 | あなたのブラウザ |
| we | Zero subject: 保存するのは約10 km四方の区画だけ。 私たち only for a contrast: その中身を私たちが読むことはない。 | 弊社, 当社, 当サイト, 我々 |
| the satellites we track | 追跡中の衛星 | 私たちが追跡している衛星 |

あなた carries the human moment, and Japanese uses it sparingly: repeated, it sounds distant or accusatory. One あなた on
the landing is an event; ten in the results panel would read as a translation.

---

## 2. Voice

### 2.1 What "declarative, specific, quietly uncanny, second person" sounds like in Japanese

- **Declarative.** End on the fact: 見ていた。通った。25%。 Hedge only where the English hedges, and then with the
  potential or the conditional (見えた, 向ければ見えた, 〜はずだ), never stacked hedges (〜かもしれません).
- **Specific.** A number with its counter beats any adjective: 衛星7基, not 複数の衛星. 数〜 ("a few") only where the
  English says "a few".
- **Quietly uncanny.** The watcher stays unnamed: 何か, never 誰か (誰か puts a person, a spy, behind it). The continuous
  aspect gives duration: 見ていた ("was watching"), not 見た ("saw"). Understatement does the rest. No horror words: 恐怖,
  ゾッと, 不気味, 監視社会, 覗かれる.
- **Second person.** あなた in the sanctioned lines only (§1.4). Everywhere else the place stands in for the person.

### 2.2 Rhythm and how to count length

- **Counting.** A full-width glyph (kana, kanji, 、。「」) counts 1; Latin letters, digits and spaces count ½. Every
  length in this guide uses this count.
- Sentences run 15–40; split anything over about 45. The sub line is a display block, not running prose (§3.2).
- Headlines stay under 30, not counting the place name.
- Never three sentences in a row ending in 〜た. Break the run with a noun ending (雲量は25%。) or 〜ている / 〜ない.
- At most two の in a row: この場所の空 is fine; この場所の上空の衛星の画像 is not.
- Kanji nouns in labels; kana-rich plain verbs in prose.
- Use 、 where a Japanese reader breathes, not one per English comma.
- English participial tails ("…, moving south at 7.46 km/s") become a 連用形 join (通り、…向かっていた), never a second
  clause opened with そして.

### 2.3 Words for what satellites and instruments do

| Meaning | Word | Where |
|---|---|---|
| A satellite watched this place (the product's claim) | 見る → 見ていた | Headlines, verdicts, share lines, post text |
| What an instrument does in general | 観測する, 走査する | Satellite blurbs, engine notes, About, pass sentences about radar and swaths |
| "Imaged" in the globe's mono callout | 撮像 | 撮像 11:21:13 EST only |
| "Acquired" (the moment the picture is taken) | 取得 | Globe readouts, chips |
| "took / taken" where the English says so | 撮る (撮られた, 撮った) | The sub line, About, notes about frames |
| Photographed | never 撮影 | Anywhere |

Example: Himawari-9 blurb → 気象庁の静止気象衛星「ひまわり9号」で、アジアと太平洋の全球を10分ごとに観測する。

### 2.4 Avoid

- **Marketing:** 驚きの, ついに, 今すぐ, 無料で, 簡単に, 〜しよう！, ！, emoji, ★, ※.
- **Bureaucratic padding:** 〜となっております, 〜させていただく, 〜することができる (write 〜できる), 〜について, 〜に関して,
  〜的な, 〜を行う (write 〜する).
- **Calques:** それ / それは for "it"; 彼 / 彼女 for a satellite; 私たちは for "we"; あなたの for "your"; 〜の上に for
  "over" (write 上空を); 〜を通して for "through"; sentence-initial そして; 〜を持っている for "has"; English passives
  copied word for word.
- **Katakana where Japanese has a word:** レゾリューション (解像度), ヘディング (進行方向), オーバーヘッド (上空), ウォッチ (見る),
  インサイト, ソリューション.
- **本物** for "the real / actual image": write 実際の画像 (本物 implies the others are fake).

### 2.5 Before and after

1. **Calque plus polite form.** EN: It was looking straight down.
   ✗ それは真っ直ぐ下を見ていました。 ✓ 真下を見ていた。
   *The subject drops, 真下 is the term, the verb is the product verb in plain form.*
2. **English word order.** EN: No satellite we track watched Waterloo this week.
   ✗ 私たちが追跡している衛星はどれも今週Waterlooを見ませんでした。
   ✓ この1週間、追跡中の衛星はどれもWaterlooを見ていなかった。
   *Time first; "we" becomes 追跡中; a rolling week is この1週間, because 今週 is the calendar week.*
3. **Lists and counters.** EN: Radar doesn’t need light. Umbra, Capella and 7 other radar satellites passed within range 1,204 times.
   ✗ レーダーは光を必要としません。Umbra、Capella、そして他の7つのレーダー衛星が範囲内を1,204回通過しました。
   ✓ レーダーに光はいらない。Umbra、Capellaほかレーダー衛星7基が、この場所を観測できる範囲を計1,204回通った。
4. **Marketing tone.** EN: Can it see me? / No. At best a pixel here is 10 m across. A car is one pixel. You’re not in it.
   ✗ 私の姿も見えるの？／ご安心ください！最高でも10 m解像度なので、プライバシーはしっかり守られます。
   ✓ 自分の姿は見える？／見えない。いちばん細かくても1ピクセルは10 m。車は1ピクセルに収まる。あなたの姿は写らない。
5. **Uncanny, not horror.** EN: It was dark here. Weather imagers keep scanning at night in infrared, so it saw your clouds, not your streets.
   ✗ 恐ろしいことに、気象衛星は夜も赤外線であなたを監視しています。
   ✓ ここは夜だった。気象衛星のカメラは夜も赤外線で走査を続けるので、見えたのは雲で、街並みではない。
6. **Feature-list notice.** EN: Location access is blocked. Allow it in your browser settings, or search for a place.
   ✗ 位置情報へのアクセスがブロックされている。ブラウザの設定で許可できる。場所の検索はこのまま使える。
   ✓ 位置情報へのアクセスがブロックされている。許可はブラウザの設定から。場所の検索もできる。

---

## 3. The key lines

### 3.1 Hero

**Landing (three lines, one accent):**

```
今週、何かが
*あなた*を
見ていた。
```

Catalog: `[['今週、何かが'], [accent('あなた'), 'を'], ['見ていた。']]` (parts touch: no spaces anywhere).

- Each line is one phrase (文節); the three read as a falling cadence. Widths with `palt`: 5.5 / 4.1 / 4.5 em.
- The accent is あなた alone: signal orange, upright Mincho from the accent subset (§6.6). を stays in the sans, as
  "watched" does in English.
- 見ていた, the continuous past: it was watching, and you didn't know. 見た ("saw") is one instant and flat.
- **Plain copies:** og:title, share page title and image alt keep the full stop: 今週、何かがあなたを見ていた。 The tab
  title drops it: `Watched · 今週、何かがあなたを見ていた` (`app.documentTitle` and `bootText` `title`).

**Default share card (four lines).** The card sets the hero nowrap at 88 px in a 466 px column, and satori has no
`palt`, so 今週、何かが (6 em = 528 px) would overflow. The card catalog gives four explicit lines, widest 見ていた。 at
≈ 431 px:

```
今週、
何かが
*あなた*を
見ていた。
```

Catalog: `[['今週、'], ['何かが'], [accent('あなた'), 'を'], ['見ていた。']]`. Same words, same accent; no change to
the renderer's size. (Its leading is a renderer constant, §6.7.)

**Alternates, and why they lost:**

| Alternate | Why it lost |
|---|---|
| 今週、／何かが*あなた*を／見ていた。 | 3 / 7 / 5: the middle line is too long, and at display size it wraps and を lands alone on a line. |
| 何かが／*あなた*を／見ていた。 | The best poster shape, but it drops "this week", which the hero, the post hook and the kicker all rely on. |
| 今週、*あなた*は／何かに／見られていた。 | Makes あなた the topic, but gives up 何か as the opening word, runs 7 / 3 / 7, and 見られる can read as passive, potential or honorific. |

今週 appears only in the brand lines (hero and its copies, the post hooks, the share page question). Wherever data is
stated, "this week" is この1週間 and "that week" その1週間 (§4).

### 3.2 Sub line

EN: Enter any place on Earth. See every satellite that passed over it in the last 7 days, and the actual pictures they took.

**Final:**
地球上の好きな場所を入力すると、過去7日間にその上空を通ったすべての衛星と、実際に撮られた画像が見られる。

- The day count is plain text here (the English pieces are plain, not mono). Keep 7日間 together: the message returns
  `['地球上の好きな場所を入力すると、過去', String(days), '日間にその上空を通ったすべての衛星と、実際に撮られた画像が見られる。']`
  or one piece.
- 〜すると states the consequence; 〜すれば would stress a condition ("only if you enter"). No command, no ください.
- 実際に撮られた画像 has no subject, which avoids the translationese それら ("they"). 撮る is allowed: the English
  says "took".
- It is a 2–3 line display block (`word-break: auto-phrase`, `text-wrap: balance`), so the 45-glyph sentence limit for
  running prose does not apply.
- The share page `description` and the post-free page description use the same sentence.

**Alternates:** 地球上のどんな場所でも、入力すれば… (the object sits outside its verb's clause, and 〜ば is the wrong
conditional) · …入力できる。…見られる。 (two possibility endings read as a feature list) · …入力してください。…ご覧いただけます。
(service register and honorifics, 20 glyphs longer).

### 3.3 Results headline and second line

Japanese has one CLDR plural category, `other`: every count uses one string, 1 included. Zero has its own sentence
wherever the English has one, never "0基" or "0枚".

**Headline**

| Case | Frame | Example |
|---|---|---|
| n ≥ 1, last 7 days | 過去[DAYS]日間、**[NUM]基の衛星が***[PLACE]*を見ていた。 | 過去7日間、**256基の衛星が***Waterloo*を見ていた。 |
| n ≥ 1, another window length | 過去[DAYS]日間、… (same frame) | 過去3日間、**12基の衛星が***Waterloo*を見ていた。 |
| n ≥ 1, an old window (dates) | [DATE1]から[DATE2]まで、**[NUM]基の衛星が***[PLACE]*を見ていた。 | 10月29日から11月5日まで、**12基の衛星が***Waterloo*を見ていた。 |
| n = 0, current window | この1週間、追跡中の衛星はどれも*[PLACE]*を見ていなかった。 | |
| n = 0, old window | その1週間、追跡中の衛星はどれも*[PLACE]*を見ていなかった。 | |

- **Bold:** [NUM]基の衛星が; the number in the display numeral style. **Accent:** the place name only, never its
  particle. **Plain weight:** 過去7日間、 and を見ていた。 The zero headline has no bold run.
- The 、 after 過去7日間 is required. A duration with ていた takes no particle; 過去7日間に would suggest one moment.
- Old-window dates are the prose form without weekday (10月29日).

**Second line**

| Case | Frame |
|---|---|
| k ≥ 1 (1 included) | 公開された画像は[NUM]枚。 |
| partial | 公開された画像は少なくとも[NUM]枚。 |
| k = 0, results | この1週間に公開された画像はない。 / その1週間に公開された画像はない。 |
| k = 0, card (its headline already names the week) | 公開された画像はない。 |
| archives down (results, share page, post) | 画像アーカイブが応答せず、公開画像をいま数えられない。 |
| archives down (card, one line) | 画像アーカイブが応答しなかった。 |

- 少なくとも is the separable "at least" piece; it sits right before the number, so it can fade out in place.
- The line ends on the number, the fact the reader came for, and the zero line keeps the same shape. **Rejected:**
  **31枚**の画像が公開された。 (both lines would then open on a number).

**Why nothing was watched** (the summary's reason line, copy.ts `zeroReason`, `darkSentences`, `radarSentence`):

| EN | ja |
|---|---|
| Sentinel-2 or Landsat crossed it 3 times in daylight, but no scene has been published yet. | Sentinel-2かLandsatが日中にこの場所を3回通ったが、シーンはまだ公開されていない。 (once → 1回) |
| No open imaging satellite crossed it in daylight. | 画像を公開している観測衛星は、日中にこの場所を通らなかった。 |
| The sun never rose, so no daylight camera could see it. | 太陽が一度も昇らず、日光が必要なカメラにはこの場所が見えなかった。 |
| The sun barely rose, so no daylight camera could see it. | 太陽がほとんど昇らず、日光が必要なカメラにはこの場所が見えなかった。 |
| Weather satellites still swept it in infrared, 42 times. | それでも気象衛星は赤外線でこの場所を42回走査した。 |
| Radar doesn’t need light. Umbra, Capella and 7 other radar satellites passed within range 1,204 times. | レーダーに光はいらない。Umbra、Capellaほかレーダー衛星7基が、この場所を観測できる範囲を計1,204回通った。 |
| (two names, no others) | …UmbraとCapellaが、この場所を観測できる範囲を計38回通った。 |
| (one name) | …Umbraが、この場所を観測できる範囲を計5回通った。 |

### 3.4 Pass sentences

Order, as in English: what crossed, when, where, how it moved → what that means for the image → what cannot be known.
The first sentence takes the satellite as topic (は); later sentences drop the subject. `[TIME]` arrives with its zone
("16:14:21 EST") and takes に directly: 16:14:21 ESTに. Units stay in their mono spans (786 km, 7.46 km/s); never 秒速7.46キロ.

**Where it crossed** (`where()`, used by every verdict):

| Case | ja |
|---|---|
| Overhead (< 15 km) | [SAT]は[TIME]に、高度[ALT]で真上を通り、[SPEED]で[DIR8]へ向かっていた。 |
| Offset | [SAT]は[TIME]に、この場所の[DIR8][DIST]、高度[ALT]を通り、[SPEED]で[DIR8]へ向かっていた。 |

Examples: Sentinel-2Cは16:14:21 ESTに、高度786 kmで真上を通り、7.46 km/sで南へ向かっていた。 ·
Sentinel-2Cは16:14:21 ESTに、この場所の西61 km、高度786 kmを通り、7.46 km/sで南へ向かっていた。
(Japanese gives a position as place + direction + distance; one [DIR8] for the position, one for the heading.)

**Watched (imaged)**

| Case | ja |
|---|---|
| Photo, nadir | 真下を見ていた。 |
| Photo, off nadir | 真下から[DEG]傾いた方向を見ていた。 |
| Photo, cloud | シーン全体の雲量は[PCT]。 |
| Daily mosaic | [where]。[SENSOR]イメージャーが[PLACE]を走査し、NASAのトゥルーカラー日別画像に収めた。1ピクセル[M]。 |
| Radar | [where]。レーダーは横に[DEG]向けて[PLACE]を観測した。1ピクセル[M]。 (in the dark: レーダーは横に[DEG]向けて、暗闇のなかで[PLACE]を観測した。) |
| Geostationary | [SAT]は上空を通らない。[LON]の赤道上空[ALT]にとどまり、眼下に見える地球全体を[N]分ごとに走査している。今回の走査線が[PLACE]に達したのは[TIME]ごろ。[DIR8]へ進んでいた。 |
| Geostationary, infrared | ここは夜だったので、これは赤外画像。雲頂を温度で表し、冷たいほど明るい。 |

Geostationary example: Meteosat-12は上空を通らない。西経0.2°の赤道上空35,778 kmにとどまり、眼下に見える地球全体を10分ごとに走査している。今回の走査線がParisに達したのは07:49 CETごろ。北へ進んでいた。
([LON] in prose is 西経0.2° / 東経140.7°; the message takes the longitude as a number. Without a cadence:
…眼下に見える地球全体を走査している。)

**Likely watched**

| Case | ja |
|---|---|
| First sentence, with a swath | [where without the heading]。この場所は[SWATH]の観測幅に入っていた。 → Sentinel-2Aは16:14:21 ESTに、高度786 kmで真上を通った。この場所は290 kmの観測幅に入っていた。 |
| Open camera, archive failed | 日中だったので、この地点を記録していたはずだ。いまはアーカイブを検索できなかった。 |
| Open camera, over 48 h | この通過のシーンは存在しない。Sentinel-2が記録するのは陸地と沿岸の海だけで、この地点を観測計画に入れていなかった可能性がある。 |
| Open camera, recent | 日中だったので、この地点をほぼ確実に記録している。この通過のシーンはまだ公開されていない。アーカイブは1日以上遅れることがある。 |
| Weather, dark | ここは夜だった。気象衛星のカメラは夜も赤外線で走査を続けるので、見えたのは雲で、街並みではない。 |
| Weather, NASA mosaic unconfirmed | この通過のNASA日別画像を、この地点で確認できなかった。 |
| Weather, not published | その画像は天気予報に使われ、表示できる画像としては公開されていない。 |

**Could have pointed here**

| Case | ja |
|---|---|
| First sentence, overhead | [SAT]は[TIME]に真上を通った。 |
| First sentence, offset | [SAT]は[TIME]に、この場所の[DIR8][DIST]を通った。 |
| Fixed commercial swath | [PLACE]は観測幅[SWATH]の内側にあった。運用者はどこを観測したかを公開していないため、記録したかどうかは分からない。 |
| Radar, open archive | レーダーは雲も暗闇も通して見る。横に[DEG]向ければ、[PLACE]を観測できた。この通過の公開画像は見つからなかった。 |
| Radar, private | レーダーは雲も暗闇も通して見る。横に[DEG]向ければ、[PLACE]を観測できた。実際に観測したかどうかは分からない。 |
| Optical, nadir | 真下を向いていれば、[PLACE]が見えた。見たかどうかは分からない。 |
| Optical, off nadir | カメラを真下から[DEG]傾ければ、[PLACE]が見えた。見たかどうかは分からない。 |

(Radar at nadir drops 横に[DEG]向ければ: [PLACE]を観測できた。) The place is plain text in pass prose: the serif accent
belongs to the results headline only.

**Passed overhead**

| Case | ja |
|---|---|
| Elevation < 80° | [SAT]は[TIME]に高度[ALT]を通った。[DIR8]の空、地平線から[DEG]。 |
| Elevation ≥ 80° | [SAT]は[TIME]に高度[ALT]を通った。地平線から[DEG]、ほぼ真上。 |
| Station, in the dark | この場所は夜だった。ステーションにまだ日が当たっていれば、明るく瞬かない光の点として空を横切ったはずだ。 |

**Alternates that lost:** 16:14:21 EST、Sentinel-2Cが…通った。 (a news-bulletin opening; が makes the satellite new
information inside its own paragraph) · …真上を通過した。南へ7.46 km/sで移動していた。 (two sentences where Japanese
wants one, and a run of た endings) · [DIR8]へ[DIST]離れた高度[ALT]の上空を通り (three modifiers stacked before 上空,
へ for a static position, two [DIR8]へ in one sentence).

### 3.5 The four verdicts (one vocabulary everywhere)

| verdict | Title | Lane / card lane (mono) | Unit | Definition | Verb (standalone: aria lists) |
|---|---|---|---|---|---|
| imaged | 見ていた | 画像 | 回 | この場所の実際の画像が、公開アーカイブにある。 | 見ていた |
| likely | おそらく見ていた | 推定 | 回 | 真下を見続けるカメラの観測幅が、この場所を覆った。その画像は公開されていない。 | 観測幅に入った |
| could | 向ければ見えた | 可能性 | 回 | この場所は、向きを変えられるカメラか非公開のカメラの届く範囲に入っていた。実際に見たかどうか、運用者は明かしていない。 | 見える範囲を通った |
| overhead | 上空を通った | 上空 | 回 | この場所の空を横切った。宇宙ステーションも、それ以外も。 | 上空を通った |

**In use:**

- Summary readouts (number, unit, title): 31回 見ていた · 4回 おそらく見ていた · 120回 向ければ見えた · 12回 上空を通った.
  Aria: 31回：見ていた. The group's aria: 判定別の通過。それぞれの一覧へ移動する。
- About's longer words after each definition (`verdictMore`): imaged 表示する画像は、どれも実際の画像。 · likely
  画像がまだ公開されていないか、雲が多くて破棄された。 · could 実際に見たかどうかを知る方法はない。 · overhead (none).
- **Quoting a verdict in prose** (engine notes, About): the exact title in 「」: 「おそらく見ていた」として示している ·
  「向ければ見えた」と呼ぶ.

**Why these words.** The titles hang together on 見る / 見える, except overhead, which makes no claim about seeing.
向ければ見えた ("had it pointed, it would have seen") is the honest counterfactual of "could have pointed here". The
lanes are short kanji nouns for an instrument legend; the imaged lane is 画像, not 写真 ("Photo" in English), because
it also holds radar images, weather mosaics and geostationary frames. **Rejected:** 写真 as the lane (dishonest for
radar); おそらく as a lane (an adverb reads unfinished); 狙えた (targeting with a weapon); 真上を通った for overhead (most
overhead passes are nowhere near the zenith); たぶん見ていた (too casual); 視野に入った for could (claims the place was in
the camera's view; the honest claim is that it was within reach); 撮影 in any form.

### 3.6 Share card, share page and post

**The card headline: the place is always the last block.** Every renderer lays the headline's top-level parts out as
blocks in order, each text part on its own line(s) in the condensed sans and the accent in the serif. A text block after
the place would open a display line with a particle (を見ていた。), which a Japanese editor never lets stand; words put
inside the accent would be set in the serif (and, in the PNG today, slanted). So the card uses a relative clause with a
noun ending (体言止め), a standard Japanese headline form, and the accent holds only the place and 。, exactly like the
English 「Waterloo.」. Give each phrase as its own text part: each part is one line, and a line breaks only between parts
(§6.7).

| Message | Parts (text parts, then the accent) | Plain (share page title) |
|---|---|---|
| `headline(n)` | 「衛星[N]基が」「見ていた」 + accent([PLACE], 。) | 衛星7基が見ていたWaterloo。 |
| `headlineWeek(n ≥ 1)` | 「この1週間、」「衛星[N]基が」「見ていた」 + accent([PLACE], 。) | この1週間、衛星7基が見ていたWaterloo。 |
| `headlineWeek(0)` | 「この1週間、」「追跡中の」「どの衛星も」「見ていなかった」 + accent([PLACE], 。) | この1週間、追跡中のどの衛星も見ていなかったWaterloo。 |
| `headlineBy.imaged` | 「[SAT]が」「見ていた」 + accent | Sentinel-2Cが見ていたWaterloo。 |
| `headlineBy.likely` | 「[SAT]の」「観測幅に入った」 + accent | Sentinel-2Cの観測幅に入ったWaterloo。 |
| `headlineBy.could` | 「[SAT]が」「向ければ見えた」 + accent | WorldView Legion 4が向ければ見えたWaterloo。 |
| `headlineBy.overhead` | 「[SAT]が」「上空を通った」 + accent | ISSが上空を通ったWaterloo。 |

- `sat` undefined: ある衛星が / ある衛星の. `cut` (the place ends in …): drop the 。, as English drops its stop.
- Keep each part within one line of the card's column: 466 px at the 84 px headline size holds about 5.5 full-width
  glyphs, and a longer part wraps inside itself (a 3-digit count with 基の衛星が is ≈ 6.5 em: が fell alone onto the
  next line, in the PNG and the sheet's preview alike). So the count goes first, 衛星[N]基が (≈ 5.4 em with three
  digits), the counter-first order this guide already uses for 衛星7基 in prose. At most four lead parts.
- The results headline and the pass view stay full sentences (§3.3, §3.4): inline rich text handles a particle after
  the accent. The card differs on purpose because the layout forces it.

**Lines under the headline, the stamp and the readouts**

| Key | ja |
|---|---|
| `photos` | 公開された画像は31枚。 / 公開された画像は少なくとも31枚。 / 公開された画像はない。 |
| `archiveDown` / `archiveDownShort` | 画像アーカイブが応答せず、公開画像をいま数えられない。 / 画像アーカイブが応答しなかった。 |
| `cloud.only` sub / chip / post / desc | 雲に覆われ、雲しか見えなかった。 / 雲に覆われた · 95% / 雲しか見えなかった。 / 雲しか見えなかった（95%）。 |
| `cloud.mostly` | ほぼ雲。シーンの81%。 / ほぼ雲 · 81% / ほとんど雲だった（81%）。 / ほとんど雲だった（81%）。 |
| `cloud.spot` | 地点の真上に雲。 / 地点に雲 / この地点は雲に覆われていた。 / この地点は雲に覆われていた。 |
| `stamp` | 2026/11/1(日) · 11:21 EST |
| `weekTo` / `lastWeek` | 2026/11/1(日)までの7日間 / 過去7日間 |
| `readout` | 高度 · 仰角 · 速度 · 傾き · ピクセル · 日別ピクセル · 最短距離 |
| `lane` | 画像 · 推定 · 可能性 · 上空 |
| `unit` | km · m · km/s |
| `geometry` | 通過の位置関係 · 北が上 |
| `note` | 画像はアプリで表示 · 画像をいま取得できない · 商業アーカイブ · 非公開 · 観測幅内 · 公開画像はまだない · 最接近時の地上軌跡 |
| `acquiring` / `noPublicPhoto` / `noPhoto` | 取得中… / この1週間、公開画像なし / 表示できる画像なし |
| `look` | 最も詳細な画像 · 直近の晴天画像 · 雲に覆われた · レーダー |
| `lookDay` | 11/3 |
| `aSatellite` (a label on its own) | 不明な衛星 |
| `invite` | あなたを見ていたものを見る |
| `enterAnyPlace` | 地球上の好きな場所を入力 |
| `defaultPlace` | パーム・ジュメイラ |
| `defaultAlt` | パーム・ジュメイラ（ドバイ）を写した実際のSentinel-2の衛星写真と、「今週、何かがあなたを見ていた。地球上の好きな場所を入力」の一文。 |
| `decimal`, `pixelSize`, `distance`, `scale` | fmt('ja').dec / int: 7.46 · 0.31 m · 10 m · 2 km · 61 km · 500 m |

**The share page**

| Key | ja |
|---|---|
| `page.title` | 今週、何かがあなたを見ていた。 |
| `page.description` | the sub line (§3.2) |
| `page.placeTitle` | この1週間、[PLACE]を見ていたもの |
| `page.placeDescription` | 過去7日間に[PLACE]の上空を通ったすべての衛星と、実際に撮られた画像。今週、あなたの頭上を通ったのは？ |
| `page.opening` | `[accent('Watched'), 'へ移動中…']` → *Watched*へ移動中… |
| `crossed` (imaged, likely) | [SAT]は[DAY][TIME]、[PLACE]の上空[ALT]を通り、[DIR8]へ向かっていた。 → Sentinel-2Cは2026年11月1日（日）11:21 EST、Waterlooの上空795 kmを通り、南へ向かっていた。 |
| `crossed` (overhead, or no altitude) | …[PLACE]の上空を通り、… ; without a heading the sentence ends …を通った。 ; without a time it drops [DAY][TIME]、 |
| `withinView` | [SAT]は[DAY][TIME]、[PLACE]が見える範囲を通り、[DIR8]へ向かっていた。 |
| `couldHave` | ここにカメラを向けることもできた。向けたかどうか、運用者は明かしていない。 |
| `straightDown` / `offNadir` | 真下を見ていた。 / 真下から5.4°傾いた方向を見ていた。 |
| `cloudCover` | 雲量は25%。 |
| `inSwath` | [PLACE]は観測幅に入っていた。 |
| `bestFrom` | 最も詳細な画像は[SAT]によるもの。 · 直近の晴天画像は[SAT]によるもの。 · 最初の画像は[SAT]によるもの。 (no name: ある衛星によるもの) |
| `question` | 今週、あなたの頭上を通ったのは？ |
| `cardAlt` | この1週間で最も詳細な[SAT]の画像を載せた共有カード。 / 共有カード。 |

The day in these prose sentences is 2026年11月1日（日） with full-width parentheses (§6.3).

**The share sheet** (buttons are mono caps on one line; three share a 360 px phone: 8 glyphs at most)

| Key | ja |
|---|---|
| titles | この通過を共有 · この画像を共有 · この1週間を共有 |
| `close` / `closeTitle` | 閉じる / 閉じる(Esc) |
| buttons | 画像を共有 · 画像を準備中… · 共有 · リンクをコピー · コピー済み · Xに投稿 · 画像をコピー · PNGを保存 · 再試行 |
| `linkLabel` / `postLabel` | リンク / 投稿文 (48 px column: 3 glyphs fit) |
| `directLink` | 直接リンク：短縮リンクをいま作れなかった |
| `creatingLink` / `linkLater` | リンクを作成中… / 共有時に作成 |
| `renderFailed` | このブラウザではカードを描画できなかった。リンクは使える。 |
| `credit` | via @armaangupt0 (unchanged) |
| `pngName`, `weekPngName` | unchanged (ASCII slugs) |

**The post** (`[DAY]` is 11月1日（日）; "local" is 現地時間)

| Key | ja |
|---|---|
| `post.imaged` | [SAT]は[DAY]現地時間[CLOCK]、高度[ALT]から[PLACE]を見ていた。1ピクセル[PIXEL]。これが実際の画像。 (no pixel: …を見ていた。これが実際の画像。) |
| `post.clouded` | [SAT]は[DAY]現地時間[CLOCK]、高度[ALT]から[PLACE]を見ていた。[cloud.post] |
| `post.likely` | [SAT]は[DAY]現地時間[CLOCK]、高度[ALT]で[PLACE]の上空を通った。カメラの観測幅がこの地点を覆った。 |
| `post.could` | [SAT]は[DAY]現地時間[CLOCK]、[PLACE]が見える範囲を通った。ここにカメラを向けることもできた。向けたかどうか、運用者は明かしていない。 |
| `post.overhead` | [SAT]は[DAY]現地時間[CLOCK]、高度[ALT]で[PLACE]の上空を通った。 |
| `hookWatched` | 今週、何かがあなたも見ていた。 |
| `hookPassed` | 今週、あなたの頭上を通ったのは？ |

Example: Sentinel-2Cは11月1日（日）現地時間11:21、高度795 kmからWaterlooを見ていた。1ピクセル10 m。これが実際の画像。

`hookWatched` keeps the hero's words and order with も for "too", so the post echoes the landing. 頭上 is the idiom for
"overhead"; あなたの上 would read as something stepping over the reader's body.

### 3.7 Reference lines by namespace

Translators copy these patterns; strings not listed follow the same rules.

**landing**

| Key | ja |
|---|---|
| `lastDays` / `windowRange` | 過去7日間 / 2026/11/12 → 11/19 UTC (across months 2026/10/29 → 11/5 UTC; across years 2026/12/29 → 2027/1/5 UTC) |
| `builtBy` | 制作 @armaangupt0 |
| `searchPlaceholder` / `placeLabel` | 場所を検索 / 場所 (01 / 場所) |
| statuses | 検索中 · 検索不可 · 3件 · 該当なし · 地名、住所、緯度, 経度 |
| `clearSearch` / `go` / `suggestions` | 検索をクリア / この場所の上空を通ったものを表示 / 場所 |
| `searchDown` | 場所の検索が応答していない。43.47, −80.54のような座標なら使える。 (the coordinates exactly as written) |
| `nothingMatches` | 「[query]」に一致するものはない。都市、ランドマーク、座標で検索できる。 |
| `useMyLocation` / `locateMe` / `nearMe` | 現在地を使う / 現在地 / 現在地 |
| `locating` / `cancelSearch` / `cancelLocate` / `cancelLocating` | 取得中… / キャンセル / 中止 / 位置の取得を中止 |
| `requestingPosition` / `namingPlace` / `elapsed` | 位置を取得中 / 地名を確認中 / 05秒 |
| `locatingNote` | 地名を調べるため、現在地をPhoton（地名検索サービス）に送る。保存するのは約10 km四方の区画だけ。 |
| `locationLabel` / `dismiss` | 位置情報 / 閉じる |
| `locateErrors.denied` | 位置情報へのアクセスがブロックされている。許可はブラウザの設定から。場所の検索もできる。 |
| `.unavailable`, `.other` | 現在地をいま取得できない。代わりに場所を検索できる。 |
| `.timeout` | 現在地の取得に時間がかかりすぎた。再試行するか、場所を検索できる。 |
| `.unsupported` | このブラウザは位置情報を共有できない。代わりに場所を検索できる。 |
| `.insecure` | 位置情報には安全な（https）接続が必要。代わりに場所を検索できる。 |
| `orTry` / `pinHint` / `examplesLabel` / `dropPin` | たとえば (02 / たとえば) / 地球儀をクリックしてピンを立てることもできる / 場所の例 / ピンを立てる |
| `chipName` | [label]、[sublabel] |
| `surprise` / `surpriseName` | おまかせ / おまかせ：有名な場所をランダムに選ぶ |

**app, system, switcher, geo, boot**

| Key | ja |
|---|---|
| `documentTitle`, boot `title` | Watched · 今週、何かがあなたを見ていた |
| boot `loading` / `slow` | Watchedを読み込み中 / 回線が遅い · まだ読み込み中 |
| `notice.label` / `fallback` | 障害 / 問題が起きた。 |
| `notice.tryAgain` / `trying` / `back` | 再試行 / 再試行中… / 戻る |
| `faults.catalog` | 軌道カタログを読み込めなかった。接続を確かめてから再試行。 |
| `faults.compute` | この場所の通過を計算中に問題が起きた。少し待って再試行。 |
| `progress.catalog` / `done` | 軌道要素を読み込み中 / レポート完成 |
| system `close` / `expandPanel` / `collapsePanel` | 閉じる / パネルを広げる / パネルをたたむ |
| switcher `title` / `trigger` | 言語 / 言語：日本語。変更 |
| geo `where` | [rest]、[country] (rest untouched; country from Intl, §8) |

`notice.label` is 障害, the instrument word for a failure: not エラー！, not 異常. The stats log the English sentence
of a fault, never this one.

**engine** (the computing readout: one mono line, ≈ 20 full-width glyphs)

| Key | ja |
|---|---|
| `loadingCatalog` / `catalog` | 軌道カタログを読み込み中 / カタログ · 物体数 16,912 |
| `propagateStart` / `propagating` | 衛星400基の軌道を計算中 · 7日間 / 軌道を計算中 · 212 / 400 |
| `searchingArchives` | Sentinel-2とLandsatのアーカイブを検索中 |
| `matching` | シーン12件を通過31回と照合中 |
| `verifyingWeatherStart` / `verifyingWeather` | NASAの気象画像を確認中 / NASAの気象画像を確認中 · 18 / 35 |
| `done` | 通過31回 · 画像29枚 |
| `note.archiveSlow` | Sentinel-2とLandsatのアーカイブの応答が遅すぎたため、通過は軌道計算のみで示している。 |
| `note.archiveDown` | Sentinel-2とLandsatのアーカイブに接続できなかったため、通過は軌道計算のみで示している。 |
| `note.sentinel2Thumbnails` | Sentinel-2はEarth Searchから取得した。一部のシーンは切り抜きではなく、シーン全体の縮小画像で表示している。 |
| `note.sentinel2EarthSearch` | Sentinel-2はEarth Searchから取得した（Planetary Computerの検索が利用できないため）。 |
| `note.sentinel2Down` / `landsatDown` | Sentinel-2のアーカイブに接続できず、Sentinel-2の画像が欠けている可能性がある。 (Landsat likewise) |
| `note.openOcean` | この地点はSentinel-2の観測計画の範囲外（外洋）。 |
| `note.elementsOld` | 軌道要素は3日前のもので、通過時刻は数分ずれることがある。 |
| `note.elementsNewer` | これらの通過は、その後に公開された軌道要素から再構成したもので、時刻が数分ずれることがある。 |
| `note.gibsUnconfirmed` | NASA GIBSはVIIRSの画像[N]枚の確認に時間がかかった。VIIRSは毎日地球全体を観測しているため、該当する通過は「見ていた」に数えている。 |
| `note.gibsSlowAll` / `gibsDownAll` | NASA GIBSが時間内に応答しなかったため、気象衛星の画像は表示していない。 / NASA GIBSに接続できなかったため、… |
| `note.gibsSlowSome` | NASA GIBSは気象衛星の画像35枚のうち12枚を時間内に返さなかった。該当する通過は「おそらく見ていた」として示している。 |
| `note.gibsDownSome` | NASA GIBSは気象衛星の画像35枚のうち12枚を返せなかった。該当する通過は「おそらく見ていた」として示している。 |

"Propagating" is 計算 (軌道伝播 is correct but opaque). 該当する avoids the English one / other split ("that pass" /
"those passes").

**hud**

| Key | ja |
|---|---|
| `about` / `home` | 仕組み / Watched、ホーム |
| regions | 時刻 · 軌道カタログ · 太陽 |
| `scene` | リプレイ (then 11/1(日) 11:21:13 EST) |
| `sun` / `subsolar` / `gmst` | 太陽 16.2°S 063.0°E / 太陽直下点 / GMST 18:41:50 |
| `objects` / `objectsPending` / `catalog` | 物体数 16,893 / 物体数 / カタログ |
| `fetched` | 取得 2026-11-08 03:34Z |
| `catalogAge` | たった今 · 42分前 · 5時間前 · 3日前 · stale: 古い · 3日前 |
| `catalogUnavailable` / `catalogLoading` | カタログ取得不可 / カタログを読み込み中 |

**globe** (mono, aria-hidden except the pin card and the no-3D note)

| Key | ja |
|---|---|
| `calloutMeta` / compact | NORAD 43013 · 786 km / · 786 km |
| `imaged` / `imagedAbout` | 撮像 11:21:13 EST / 撮像 ≈ 11:21 EST (≈ stays in mono; ごろ is for prose) |
| `acquired` / `acquiredAbout` | 取得 11:21:13 EST · 10 m / 取得 ≈ 11:21 EST · 2 km |
| `acquisitionOf` / `closestApproachOf` | 取得 · SENTINEL-2C / 最接近 · ISS (ZARYA) |
| `acquiredNow` / `closestApproachNow` | 取得 / 最接近 |
| pin `card` / `naming` / `noName` | 立てたピン / 地名を確認中 / 近くに地名なし (≤ 7 glyphs: the column is 156 px at 13 px) |
| pin `placeTitle` / `searchAria` / `searchTitle` | [name]、[area] / [place]の上空を通ったものを表示 / ここを検索(Enter) |
| pin `removeAria` / `removeTitle` / `moveHint` | ピンを外す / ピンを外す(Esc) / 地球儀を長押しして移動 |
| pin `droppedAt` / `droppedIn` / `droppedUnnamed` | [coords]にピンを立てた。 / [place]にピンを立てた。Enterか矢印ボタンで、上空を通ったものを表示できる。 / ピンを立てた。Enterか矢印ボタンで、上空を通ったものを表示できる。 |
| `noGl` | 3D表示は利用できない / このブラウザではWebGL 2がオフ |

**passView**

| Key | ja |
|---|---|
| `empty` | 追跡中の衛星で、この期間にこの場所を通ったものはない。まれなことで、データ源が止まっていた場合は上の注記に書いてある。 |
| `imagedOrder` | 最も詳細な画像、以下新しい順 |
| `count` / `countStack` / `sats` | 31回 / 31 over 回 / 12基 |
| `showAllSats` / `showAllRows` / `showMore` / `left` / `showFewer` | 衛星31基をすべて表示 / 31件をすべて表示 / さらに40件を表示 / 残り120件 / 表示を減らす |
| `tag` | 日別 · レーダー · 雲に覆われた · 81% · 地点に雲 |
| `rowLabel` | [sat]、[verb]、[day] [time] [zone]、[ago]、雲量81%、雲に覆われた |
| `offNadir` / `offNadirShort` / `distanceKm` / `cloudPct` | 傾き 8.9° / 8.9° / 61 km / 雲量 23% |
| `expandLabel` / `expandTitle` | 画像を拡大：[sat]、[day] [time] / 画像を拡大 |
| `satLabel` | [sat]、[operator]、通過[n]回、最新 [day] [time] |
| `latest` / `closest` / `cloudChip` | 最新 (with its trailing space) / 最接近 (with its trailing space) / 雲 |
| `photosSection` / `planSection` / `geometry` / `replay` | 画像 / 平面図 / 位置関係 (01 / 位置関係) / リプレイ |
| `fullDiscNote` | 全球画像：衛星から見える範囲すべてを1枚に収めた画像で、この場所では1ピクセル2 km。粗いが実際の画像で、公開されている最新のもの。この1週間、10分ごとに同じような画像を撮り続けている。 (no cadence: 数分ごとに) |
| `mosaicNote` | 日別画像：NASAが1日分の観測幅をつなぎ合わせた1枚の画像。1ピクセル375 m。粗いが実際の画像で、この通過の日のもの。 |
| `radarNote` | 写真ではなくレーダー画像。Sentinel-1はマイクロ波を出してその反射を記録するので、雲も暗さも妨げにならない。明るさは地面がマイクロ波を返す強さを表し、建物や凹凸のある地面は明るく、静かな水面は暗い。 |
| `noImage.openArchive` | この通過で撮られた、この地点の[sat]の画像はない。通過の平面図を示す。 |
| `noImage.radarPrivate` / `commercialPrivate` | 公開画像なし：このレーダー衛星の運用者のアーカイブは非公開。通過の平面図を示す。 / 公開画像なし：商業アーカイブは非公開。通過の平面図を示す。 |
| `noImage.noneToShow` / `archiveDown` / `noScene` | この通過で表示できる画像はない。通過の平面図を示す。 / いまはアーカイブを検索できなかった。通過の平面図を示す。 / この通過のシーンは存在しない。通過の平面図を示す。 |
| `noImage.notYet` | この通過に一致するシーンはまだ公開されていない。Sentinel-2とLandsatのシーンは、ふつう1日以内に公開される。 |
| `noImage.crewed` / `unavailable` | 有人ステーションにもカメラはあるが、その写真は場所と時刻ごとには公開されていない。 / この通過の画像は利用できない。 |
| `links` | 画像を開いて保存 · 保存中… · 画像を保存 · 出典を見る · Planetary Computer |
| `spot` | この地点のピクセルを読み取り中… · この地点は雲なし。 · この地点に薄い巻雲の判定。画像がややぼやける可能性がある。 · この地点に雲。 · この地点は雲の影に入っていた。 |
| `strip` | 高度 · 仰角 · 傾き · ピクセル · バンド · 太陽 · 雲量 · 地点の雲 |
| `band` / `spotValue` | 赤外 · 可視 · カラー / 雲なし · 巻雲 · 雲 · 影 |
| `unit` | km · m · km/s · `up`: '' (仰角 already says it) · 日別 · シーン · 昼 / 薄明 / 夜 |
| `geo` | 最接近 · UTC · 最接近 · 現地 · 地上距離 · 仰角 · 対地速度 · 進行方向 · 太陽高度 · 指向範囲 · 観測幅 · 観測幅内 · 見える範囲 · 時間枠 · NORAD · 通過 · 走査線の到達 · UTC · 走査線の到達 · 現地 · 赤道上空 · この場所の空 · 走査方向 · 走査線の速度 · 範囲 · 今回の走査 · NORAD · 走査 |
| `northToSouth` / `southToNorth` / `timeRange` | 北 → 南 / 南 → 北 / 16:14:21 → 16:18 |
| `sunPhase` / `fullDisc` / `everyMin` | 昼 · 薄明 · 夜 / 全球 / 10分ごと |
| `upCompass` / `heading` | 南南西 / 南南西 · 南下 (ascending: 北上) |

**gallery and lightbox**

| Key | ja |
|---|---|
| `barLabel` / `filterLabel` | 画像 / 画像を絞り込む |
| `filter` | すべて · 詳細画像 · 気象 · レーダー |
| `filterTitle` | すべての画像。最も詳細な画像のあとは新しい順 · Sentinel-2とLandsat。1ピクセル10〜30 m · 日別の気象画像。1ピクセル250 m以上 · Sentinel-1のレーダー画像。1ピクセル20 m。雲を通して、昼も夜も |
| `system.counter` / `photosThisWeek` / `photosThatWeek` | 3 / 27 / この1週間に12枚 / その1週間に12枚 |
| prev / next | 前の画像 · 前へ(←) · 次の画像 · 次へ(→) |
| `carousel` / `slide` / `trackLabel` | カルーセル / スライド / この場所の画像。スワイプで次へ |
| `lead` | 最も詳細な画像 · 直近の晴天画像 · 雲に覆われた |
| `slideLabel` | [lead]：[sat]、[day] [time]、27枚中3枚目 |
| `replay` | `[strong('この通過を'), 'リプレイ']` (phones and laptops: リプレイ; portrait tablets: この通過をリプレイ) |
| `replayLabel` | この通過を地球儀でリプレイ：[sat]、[day] [time] |
| `viewLabel` / `view` | 直近の晴天画像を拡大表示：… · 画像を拡大表示：… / 表示 |
| `sharePass` / `radarTag` | この通過を共有 / レーダー |
| `noteMostlyCloud` / `noteLastClear` | この1週間の通過はほぼ雲だった / これが直近の晴天画像 |
| `clouded` | 雲に覆われた · 81% · 雲に覆われた · 地点にも雲 · 地点に雲 |
| `status` | 雲に覆われた · 81% · 地点に雲 · 雲なし · 薄い巻雲 · 雲の影 · 雲量 23% · 日別画像 |
| `photoAlt` | [sat]による[place]の画像。中央がこの場所。 |
| `acquiring` / `noImage` / `retry` | 取得中 / 画像なし / 再試行 |
| `north` / `expandLabel` / `expandTitle` | N / 画像を拡大 / 拡大(F) |
| `stillRendering` / `cropMissing` | まだ生成中。大きなシーンは10秒以上かかる。 / アーカイブがこの範囲を返さなかった。混んでいるのかもしれない。画像自体は存在する。 |
| `scanLine` | `['ライン ', strong(line), ' → ' + lines]` → ライン 0412 → 1024 (走査線 is reserved for the geostationary scan) |
| `awaiting` | 通過待ち · 走査待ち (then · T−00:00:41) |
| lightbox `dialogLabel` / `spokenPosition` / `spokenLastClear` | 画像 / 27枚中3枚目、最も詳細な画像 / 直近の晴天画像。この1週間より前のもの |
| lightbox time-lapse | この場所のタイムラプス。年ごとの変化 / タイムラプス |
| lightbox zoom | 縮小 · 縮小(−) · 拡大 · 拡大(+) · 2.5× |
| lightbox close | 画像ビューアを閉じる / 閉じる(Esc) |
| `perPixel` / `panTitle` / `panProduct` | 1ピクセル 10 m / Landsatの15 mパンクロマチックバンドでパンシャープン済み / Landsat C2 L2 + L1 pan · 15 m |
| lightbox `status` | 雲に覆われた · 81% / 地点に雲なし |
| lightbox replay, share | この通過を地球儀でリプレイ · リプレイ · この画像を共有 · 共有 |
| `filmstripLabel` / `thumbLabel` | すべての画像 / 3枚目 |

**timelapse**

| Key | ja |
|---|---|
| `dialog` / `title` / `close` / `escKey` | [place]のタイムラプス / タイムラプス / 閉じる / Esc |
| `play` / `pause` / `slider` / `frameList` | 再生 / 一時停止 / フレーム / フレーム一覧 |
| `date` / `dayMonth` / `readout` | 2015/10/22 / 10月22日 / 2015/10/22 · Sentinel-2A (the frame list's day is 月日, never the bare 10/22: beside the badge's 02 / 12 a slash day with no weekday or year made the count read as 2月12日; checked 2026-11-22) |
| `frameSpoken` | 11枚中3枚目：2015年10月22日 |
| `captionYearly` / `captionSeason` | 晴天画像11枚 · 毎年1枚 / 晴天画像11枚 · 毎年秋に1枚 (冬 · 春 · 夏 · 秋) |
| `captionGathering` / `captionShort` / `captionError` | 晴天画像を毎年1枚 · 2015年から / タイムラプスなし / アーカイブが応答しなかった |
| `note` | どのフレームも同じ10 km四方で、Sentinel-2が撮り、このサイトのほかの画像と同じ色調に整えている。年ごとに季節を変えて選び、晴天画像のない年は省く。 |
| `noteOneSeason` | どのフレームも同じ10 km四方で、Sentinel-2が撮り、このサイトのほかの画像と同じ色調に整えている。毎年同じ季節から選び、その季節に晴天画像のない年は省く。 |
| `source` | Copernicus Sentinel-2、Planetary Computer経由 |
| steps | アーカイブを検索中 · 晴天画像を選定中 · フレームを現像中 (count beside: 03 / 12) |
| `choosingProgress` / `developingProgress` | 晴天画像を選定中、12件中3件 / フレームを現像中、11枚中3枚 |
| `tooCloudy` / `tooFew` | ここは雲が多く、タイムラプスを作れない。 / 2015年以降の晴天画像2枚 · 3枚必要 (0: 2015年以降、晴天画像なし · 3枚必要) |
| `noAnswer` / `unreachable` / `retry` | アーカイブが応答しなかった。 / Planetary Computerに接続できない / 再試行 |
| `share` / `linkCopied` / `shareTitle` | 共有 / コピー済み / [place]、年ごとの変化 |
| video | 動画 · 書き出し中 42% · 作成に失敗 · 動画を保存 (132 px: all fit) |
| `noH264` | このブラウザにはH.264エンコーダーがない。ファイルはChromeとFirefoxで再生できる |
| `fileNamePlace` | place |

**Results UI not yet in a catalog** (Headers, Summary, Timeline, ReplayControls, GeoWatchers, TimelapseEntry)

| EN | ja |
|---|---|
| Computing / Computing passes | 計算中 / 通過を計算中 |
| Recent | 最近の検索 |
| Search another place (now Waterloo) | 別の場所を検索（現在：Waterloo） |
| All passes / All passes (Esc) | すべての通過 / すべての通過(Esc) |
| Pass 3 of 12 of this kind | この種類の通過、12回中3回目 |
| Previous / Next pass of this kind | この種類の前の通過 / この種類の次の通過 |
| Play replay / Pause replay / Replay speed | リプレイを再生 / リプレイを一時停止 / リプレイ速度 |
| Space play / pause · ← → previous / next pass of this kind | スペース 再生 / 一時停止 · ← → この種類の前 / 次の通過 |
| Shared with you · Sentinel-2C watched Waterloo | 共有された通過 · Sentinel-2CがWaterlooを見ていた |
| Share this week at Waterloo | Waterlooのこの1週間を共有 |
| Time-lapse / This place, year by year | タイムラプス / この場所の年ごとの変化 |
| Geo · (timeline lane) | 静止 · |
| No operational geostationary weather imager sees this place above 5° elevation. | 仰角5°より上からこの場所を見る、運用中の静止気象衛星はない。 |
| Infrared: cloud tops by temperature, colder is lighter | 赤外：雲頂を温度で表示。冷たいほど明るい |
| [Geo watcher]: replay its latest image | [name]：最新の画像をリプレイ |

**about** (the long-form register: plain, short, a little conversational)

| Key | ja |
|---|---|
| `bar` / `close` / `sectionsLabel` | 概要 / 閉じる / セクション |
| `title` | `[['このサイトの'], [accent('仕組み'), '。']]` → このサイトの／*仕組み*。 |
| `lede` | 地球上の好きな地点を選ぶと、過去1週間にその上空を通った衛星を割り出し、それらが撮った画像を探しに行く。すべてブラウザの中で、公開データだけを使って動いている。 |
| `sections` | 要点 · 通過の求め方 · ラベルの意味 · 見えないもの · プライバシー · クレジット · キーボード |
| `short.live` | リアルタイム？／完全にではない。画像がアーカイブに届くのは撮られてから数時間〜2日後なので、最新の通過にはまだ画像がないことがある。 |
| `short.seeMe` | 自分の姿は見える？／見えない。いちばん細かくても1ピクセルは10 m。車は1ピクセルに収まる。あなたの姿は写らない。 |
| `short.every` | これで全部の衛星？／違う。軍事衛星や偵察衛星の多くは公開カタログに載っていないし、企業はカメラをどこに向けたかを明かさない。 |
| `method.orbits` | 軌道上のすべての物体には、その経路を表す公開の数値がある。[CelesTrak]が米宇宙軍の追跡データから公開していて、6時間ごとに最新のものを取得している。 |
| `method.loaded` | このページは宇宙物体16,893個を読み込んだ（取得 2026-11-08 03:34Z）。 |
| `method.sgp4` | 各衛星を標準の軌道モデルSGP4で過去7日間ぶん計算し、この地点が見える範囲に入った時刻をすべて記録する。 |
| `facts.straightDown` | 真下を見る／Sentinel-2とLandsatは真下の帯状の地面を見る。幅はSentinel-2が約290 km、Landsatが約185 km。この帯の中にいる必要がある。 |
| `facts.tilting` | 傾くカメラ／多くの商業衛星はカメラを30〜45°傾けられる。その届く範囲にいれば、「向ければ見えた」と呼ぶ。 |
| `facts.daylight` | 日中／普通のカメラには太陽が必要。暗いなかの通過は、写真として数えない。 |
| `facts.radar` | レーダー／Sentinel-1に太陽はいらない。マイクロ波を出してその反射を記録するので、雲を通して、夜でも見える。見るのは軌道の片側。画像も公開されているので、グレーで表示する。明るいのは凹凸のある地面や建物、暗いのは静かな水面。 |
| `facts.weather` | 気象衛星／何基かは赤道の上空にとどまり、10分ごとに地球の半分を見ている。地球のその側にいれば、どのフレームにも入っている。 |
| `method.archives` | 次に画像アーカイブ（Microsoft Planetary Computer、Element 84、NASA）を検索し、各画像をそれを撮った通過と照合する。表示する画像はどれも実際の画像で、この地点の周りを切り抜いたもの。 |
| `photoFacts.touchUps` | 補正／Sentinel-2とLandsatの写真は、画面向けに色を整え、ノイズを抑え、軽くシャープにしている。処理は画像全体に同じようにかけ、何も足さず、何も消さない。 |
| `photoFacts.whichWayUp` | 上はどちらか／Sentinel-2とLandsatの写真はアーカイブ自身の地図グリッドを保つので、北が真上から数度ずれることがある。画像を開くと、N矢印が正確な北を示す。 |
| `accuracy` | 正確な位置／公開の軌道データの精度は約1 kmで、日ごとに少しずつずれる。時刻は数秒ずれることがある。 · 秘密の衛星／軌道上で最も高性能なカメラのいくつかは軍のもので、ここには出てこない。 · 雲／雲しか写っていない写真は多い。アーカイブが雲の情報を返すときは、この地点の真上のピクセルを確かめ、そう表示する。 · 遅れ／画像が出てくるまで1〜2日かかることがある。 |
| `privacy.where` | どこで動くか／軌道の計算はブラウザの中で動く。 |
| `privacy.kept` | 保存するもの／検索は町ごと、約10 km四方の区画ごとに数え、正確な地点は記録しない。何が開かれ、共有されたかも集計している。IPアドレスも、独自のCookieも、訪問どうしを結びつけるものも残さない。 |
| `privacy.others` | ほかに見るのは誰か／地名の多くはサイトに組み込んだ一覧から出す。それ以外の検索はOpen-Meteo、Photon、Nominatimに送られる。画像はアーカイブから直接読み込む。ホスティング会社はCookieなしでページビューと速度を数え、人とボットを見分けるためにセキュリティ用のCookieを1つ設定することがある。その中身を私たちが読むことはない。 |
| `privacy.links` | 共有リンク／作られるのは何かを共有したときだけ。リンクを持つ人には、地名、約1 kmに丸めた地点、選んだ通過が見える。 |
| `credits` labels | 制作 · アーカイブ · 軌道 · 地名 · 地球のテクスチャ · 書体 |
| `credits.madeBy` | Armaan、Xの[@armaangupt0] |
| `credits.gibs` | 画像はNASAのGIBS（EOSDISの一部）から。GOESはNOAAとCIRA経由、Himawariは気象庁経由。 |
| `credits` lines | Names stay as written; only joining words are Japanese: Microsoft Planetary Computer、Element 84 Earth Search。Landsatの15 mバンドはCopernicus Data Space Ecosystemから。 · CelesTrakの軌道要素。SGP4はsatellite.js。 · Photon（komoot）。 Map data © OpenStreetMap contributors (ODbL). · Solar System Scope（CC BY 4.0）、NASA Blue MarbleとBlack Marbleから。 · Instrument SansとInstrument Serif（Instrument）、Martian Mono（Evil Martians）、SIL OFL。 |
| `keys` | 場所を検索 · 候補を移動 · 決定 · 通過を順に見る · 前 / 次の画像 · 画像を拡大 · ズーム（拡大表示中） · リプレイの再生 / 一時停止 · 戻る / 閉じる · このページ |
| `keyNames` | Enter · スペース · Esc |
| `builtBy` / `footerNote` | 制作 [@armaangupt0] / 公開データから作った。ここにある画像は、どれも私たちが撮ったものではない。 |

Privacy lines say exactly what the English says, no more and no less: never 完全に匿名, 安心, 守られています.

**sats** (one plain sentence each, no 〜です; units with a space: 3,040 km): bands Cバンド, Xバンド, Lバンド; マルチスペクトル,
パンクロマチック, スポットライトモード, キューブサット; "since" 〜以来 or 〜年から. Examples: sentinel2 Copernicusのマルチスペクトル
イメージャー。13バンド、10 mピクセル、観測幅290 km。 · noaaViirs VIIRSイメージャーが観測幅3,040 kmで走査し、1日2回地球全体を覆う。
· iss 国際宇宙ステーション。2000年11月から人が常駐している。 · The three Japanese missions may add their Japanese name
once, in 「」, after the Latin name the row already shows: himawari9 気象庁の静止気象衛星「ひまわり9号」で、アジアと太平洋の
全球を10分ごとに観測する。 · himawari8 「ひまわり8号」。Himawari-9の予備機。 · alos2 日本のLバンドレーダー衛星「だいち2号」。2014年から観測を続ける。
· alos4 日本のLバンドレーダー衛星「だいち4号」。ALOS-2の後継機。 The name slot itself is never changed (§5.2).

### 3.8 Curated places (`places`)

Japanese exonyms in newspaper spelling (共同通信 style: no ヴ, so ベネチア, ビクトリア). Sublabels keep the catalog's
small → large order, joined with 、, so they read like the geocoder's "where" lines beside them. The "no ザ" rule is for
runtime names; ザ・ワールド is the established name.

| id | label (chip) | sublabel |
|---|---|---|
| area51 | エリア51 (chip: エリア51) | グルーム・レイク、ネバダ州、アメリカ |
| centralPark | セントラルパーク (chip: セントラルパーク) | ニューヨーク、アメリカ |
| giza | ギザの三大ピラミッド (chip: ギザ) | ギザ、エジプト |
| uluru | ウルル | 北部準州、オーストラリア |
| palmJumeirah | パーム・ジュメイラ | ドバイ、アラブ首長国連邦 |
| worldIslands | ザ・ワールド | ドバイ、アラブ首長国連邦 |
| grandCanyon | グランド・キャニオン | アリゾナ州、アメリカ |
| meteorCrater | バリンジャー・クレーター | アリゾナ州、アメリカ |
| lowerManhattan | ロウアー・マンハッタン | ニューヨーク、アメリカ |
| lasVegasStrip | ラスベガス・ストリップ | ネバダ州、アメリカ |
| hooverDam | フーバーダムとミード湖 | ネバダ州とアリゾナ州、アメリカ |
| goldenGate | ゴールデンゲート | サンフランシスコ、アメリカ |
| kennedySpaceCenter | ケネディ宇宙センター | フロリダ州、アメリカ |
| washingtonDc | ワシントンD.C. | ナショナル・モール、アメリカ |
| mountStHelens | セントヘレンズ山 | ワシントン州、アメリカ |
| niagaraFalls | ナイアガラの滝 | オンタリオ州、カナダ |
| panamaCanal | パナマ運河 | ガトゥン閘門、パナマ |
| rioDeJaneiro | リオデジャネイロ | ポン・ジ・アスーカルとコパカバーナ、ブラジル |
| paris | パリ | イル＝ド＝フランス、フランス |
| venice | ベネチア | ベネト州、イタリア |
| vesuvius | ベスビオ山 | ナポリ、イタリア |
| istanbul | イスタンブール | ボスポラス海峡、トルコ |
| chernobyl | チョルノービリ | キーウ州、ウクライナ |
| tableMountain | テーブルマウンテン | ケープタウン、南アフリカ |
| kilimanjaro | キリマンジャロ | キリマンジャロ州、タンザニア |
| everest | エベレスト | ネパールと中国 |
| angkorWat | アンコール・ワット | シェムリアップ、カンボジア |
| singapore | シンガポール | マリーナベイ、シンガポール |
| hongKong | 香港 | ビクトリア・ハーバー、香港 |
| tokyo | 東京 | 東京都、日本 |
| fuji | 富士山 | 静岡県と山梨県、日本 |
| sydneyHarbour | シドニー湾 | シドニー、オーストラリア |
| richat | リシャット構造 | サハラ砂漠、モーリタニア |
| greatBlueHole | グレート・ブルーホール | ライトハウス・リーフ、ベリーズ |
| boraBora | ボラボラ島 | ソシエテ諸島、フランス領ポリネシア |
| hardyReef | ハーディ・リーフ | グレート・バリア・リーフ、オーストラリア |
| male | マレ | 北マレ環礁、モルディブ |
| deadSea | 死海の塩田 | 死海南部、イスラエルとヨルダン |
| binghamCanyon | ビンガム・キャニオン鉱山 | ユタ州、アメリカ |
| mountWhaleback | マウント・ホエールバック鉱山 | ピルバラ、オーストラリア |
| etna | エトナ山 | シチリア、イタリア |
| santorini | サントリーニ島 | キクラデス諸島、ギリシャ |
| teide | テイデ山 | テネリフェ島、スペイン |
| kilauea | キラウエア | ハワイ州、アメリカ |
| craterLake | クレーターレイク | オレゴン州、アメリカ |
| glenCanyonDam | グレンキャニオン・ダム | ペイジ、アリゾナ州、アメリカ |
| gardenCity | ガーデンシティの円形農地 | カンザス州、アメリカ |
| almeria | アルメリアの温室群 | アンダルシア州、スペイン |
| gibraltar | ジブラルタル | ジブラルタル海峡 |
| suezCanal | スエズ運河 | イスマイリア、エジプト |
| aswanDam | アスワン・ハイ・ダム | ナセル湖、エジプト |
| wadiRum | ワディ・ラム | アカバ、ヨルダン |
| sossusvlei | ソーサスフレイ | ナミブ砂漠、ナミビア |
| victoriaFalls | ビクトリアの滝 | ザンビアとジンバブエ |
| threeGorges | 三峡ダム | 湖北省、中国 |
| shanghai | 上海 | 黄浦江、中国 |
| itaipu | イタイプダム | ブラジルとパラグアイ |

Notes: 富士山's summit straddles Shizuoka and Yamanashi, whose boundary is famously undetermined; naming one prefecture
reads as taking a side, so ja names both. Garden City's "crop circles" are centre-pivot fields: ミステリーサークル would
mean a hoax, so the label says what they are (円形農地). Gibraltar keeps the English sublabel's strait, with no country.

---

## 4. Glossary

"Never" means wrong for this product, even where it is correct Japanese elsewhere.

| English | ja | Notes |
|---|---|---|
| satellite | 衛星 | Counter 基 (news usage; JAXA writes 機; keep 基 and do not "correct" it to 機, 個 or 台). 人工衛星 once, in About. Never サテライト. |
| pass (noun) | 通過 | Counter 回. Never パス (path, password, skip, exam pass). |
| to pass / to cross (prose) | 通る (通った) | 通過する only in labels and the noun. Never 交差する. |
| overflight | 上空通過 | |
| to watch (the product verb) | 見る → 見ていた | Never 監視する, 撮影する, 観察する, 見張る, 見つめる, 見下ろす. Instruments: §2.3. |
| Watched / Likely watched / Could have pointed here / Passed overhead | 見ていた / おそらく見ていた / 向ければ見えた / 上空を通った | §3.5. Never 撮影済み, たぶん, 真上を通った (title). |
| something (hero) | 何か | Never 誰か. |
| image | 画像 | Counter 枚. The default for the gallery, viewer, lane, counts, chips. |
| photo | 写真 | Only where the item is certainly a Sentinel-2 / Landsat photograph or the English contrasts photos with radar. |
| public image / made public | 公開画像 / 公開された | Never 公共画像. |
| archive | アーカイブ | Never アーカイヴ, 保管庫. |
| scene | シーン | One archive item. Never 場面. Counter 件. |
| swath | 観測幅 | 290 kmの観測幅に入っていた · 観測幅290 kmの内側. Never スワス, 刈幅, 幅290 kmの観測幅 (redundant). |
| in swath | 観測幅内 | |
| off-nadir (label) | 傾き | The strip, the card, a pass row. Prose: 真下から5.4°傾いた方向を見ていた. The term オフナディア角 appears once, in About, explained. |
| straight down / nadir | 真下 (prose), 直下 (compounds: 太陽直下点) | |
| directly overhead / almost straight up | 真上 / ほぼ真上 | 天頂 stays out of UI copy. |
| ground track | 地上軌跡 | Never トラック, 追跡. |
| orbit / orbital elements (TLE) | 軌道 / 軌道要素（TLE） | |
| catalog / object | 軌道カタログ / 宇宙物体 (prose), 物体数 (readout) | Counter in prose 個. |
| epoch | 元期 | TLE元期 |
| NORAD ID | NORAD番号 | Labels keep NORAD: NORAD · 通過 |
| altitude | 高度 | Never 標高, 海抜. |
| elevation (angle above the horizon) | 仰角 | False friend: never 標高. |
| azimuth / horizon | 方位角 / 地平線 | |
| ground distance / closest (distance) | 地上距離 / 最短距離 | 最接近 is a moment, not a distance. |
| closest approach (time) | 最接近 | 最接近 · UTC |
| ground speed / heading | 対地速度 / 進行方向 | Never 見出し, ヘディング. |
| ascending / descending | 北上 / 南下 | Everyday words (台風が北上). Never 昇交 / 降交, 北行 / 南行. |
| cloud cover / cloud at spot | 雲量 / 地点の雲 | |
| clear (spot) | 雲なし | Never クリア (it reads as the Clear button). |
| clear look / last clear look | 晴天画像 / 直近の晴天画像 | Counter 枚. |
| closest look | 最も詳細な画像 | The most detailed clear image. Never 最接近. |
| clouded over / mostly cloud | 雲に覆われた / ほぼ雲 | |
| cirrus / thin cirrus / cloud shadow | 巻雲 / 薄い巻雲 / 雲の影 | |
| pixel | ピクセル | 1ピクセル10 m. Never 画素数. |
| mosaic pixel (card readout) | 日別ピクセル | |
| resolution | 解像度 | Only where the English says resolution. Never the label for pixel size. |
| daily mosaic | 日別画像 | Tag 日別. Explained as つなぎ合わせた1枚の画像. Never モザイク (censorship pixelation) or 合成画像 (reads as a faked picture). |
| true colour | トゥルーカラー | |
| radar / radar image | レーダー / レーダー画像 | Never レーダ. |
| geostationary | 静止軌道, 静止衛星, 静止気象衛星 | Timeline lane 静止 |
| full disc | 全球画像; value 全球 | |
| scan / scan line | 走査 / 走査線 | 走査線 only for the geostationary scan; the photo reveal counter is ライン. |
| infrared / visible / colour (band) | 赤外 (labels), 赤外線 (prose) / 可視 / カラー | |
| time-lapse / frame | タイムラプス / フレーム | Frame counter 枚. |
| replay / play / pause | リプレイ / 再生 / 一時停止 | The HUD's scene clock label is リプレイ. |
| sub-solar point / sun elevation | 太陽直下点 / 太陽高度 | |
| day / twilight / night (sun state) | 昼 / 薄明 / 夜 | Never 日 for "day" (a date). |
| daylight / dark | 日中 / 夜, 暗いなか, 暗闇のなかで | |
| steerable camera / fixed camera | 向きを変えられるカメラ / 真下を見続けるカメラ | Never 固定カメラ (CCTV). |
| field of view / field of regard | 視野 / 指向範囲 | |
| within range (radar) | 観測できる範囲 | 届く範囲 only with カメラ as its owner. Never 射程. |
| in view (the could window) | 見える範囲 | Not 視野内 (overclaims). |
| private | 非公開 | |
| operator | 運用者 | Never オペレーター. |
| commercial | 商業 | 商業衛星, 商業アーカイブ. Never 商用, コマーシャル. |
| crewed / station | 有人 / 宇宙ステーション | Never 駅, 基地局. |
| weather satellite / imaging satellite | 気象衛星 / 観測衛星 | Never 撮像衛星. |
| military / spy satellite | 軍事衛星 / 偵察衛星 | Never スパイ衛星. |
| plan view / geometry | 平面図 / 位置関係 | 通過の位置関係 · 北が上 |
| the globe | 地球儀 | |
| place / spot | 場所 / 地点 | Never スポット. |
| pin / drop a pin | ピン / ピンを立てる | |
| window (time) | 期間 (prose), 時間枠 (label) | Never ウィンドウ. |
| cell (~10 km) | 区画 | 約10 km四方の区画. Never セル. |
| share / link / post | 共有 / リンク / 投稿文 | Never ポスト. |
| download / save | 保存 | 画像を保存, PNGを保存, 保存中… |
| copy / copied | コピー / コピー済み | |
| try again / trying | 再試行 / 再試行中… | Never もう一度 alone. |
| fault | 障害 | Never エラー！, 異常. |
| failed (status) | 〜に失敗 | 作成に失敗 |
| stale | 古い | 古い · 3日前 |
| video | 動画 | |
| search a place / no match | 場所を検索 / 該当なし | |
| use my location | 現在地を使う / 現在地 | |
| surprise me / or try | おまかせ / たとえば | |
| how this works | 仕組み | |
| last 7 days / this week / that week | 過去7日間 / この1週間 (data), 今週 (brand lines) / その1週間 | 今週 is the calendar week: on a Monday it means one day. |
| local time | 現地時間 (prose), 現地 (label) | |
| UTC | UTC | Never 協定世界時. |
| built by / made by | 制作 | |
| Watched (brand) | Watched | Never translated, transliterated (ウォッチト) or set in mono caps. Particles attach directly: Watchedを読み込み中. |

**Compass**

| Use | ja |
|---|---|
| Prose, 8 points | 北, 北東, 東, 南東, 南, 南西, 西, 北西 (moving south → 南へ向かって) |
| Readouts, 16 points | 北, 北北東, 北東, 東北東, 東, 東南東, 南東, 南南東, 南, 南南西, 南西, 西南西, 西, 西北西, 北西, 北北西 |
| The photo's north arrow | N |

---

## 5. Grammar for runtime slots

### 5.1 [PLACE]: no inflection needed, so keep it bare

- Particles attach straight to the name, no space, no quotes: [PLACE]を, [PLACE]が, [PLACE]の上空, [PLACE]は, [PLACE]に.
  A place may open a sentence as its topic (Waterlooは観測幅に入っていた。).
- **No articles.** The English article logic (`placeInProse`, `placeParts`: "the Pacific Ocean") is off for ja; ja frames
  take the raw label. Never ザ, その or "the".
- **No suffixes.** Never add 市, 県, 町, さん. The gazetteer's label is final.
- **No quotation marks** around a place: the accent already sets it apart, and 「Waterloo」を見ていた looks like a
  correction. (A typed search query is quoted: 「[query]」に一致するものはない。)
- **Any script works:** Latin (Waterlooを), Japanese (東京を), local scripts. Right-to-left names are isolated (`<bdi>`, or
  U+2068…U+2069 in plain text) so the particle is not reordered.
- **Coordinates fallback:** 25.11, 55.14を見ていた。 is acceptable as is.
- The serif accent covers the name only, never its particle; on cards the place comes last (§3.6).

### 5.2 [SAT] as subject: no gender, no pronouns

- No grammatical gender and no pronoun: never 彼, 彼女, それ. After the first mention drop the subject; if a second
  subject is needed, repeat the name or write この衛星.
- **Particle:** が in event lines and card clauses (new information); は as the topic of a pass paragraph and in post
  text.
- Never append 衛星 or 号 to a catalog name (Landsat 9号 is wrong), and never replace one. Himawari-9 stays Himawari-9 in
  every slot, label and sentence the code fills; only a static blurb may add the Japanese name once, in 「」 (§3.7 sats).
- Names with spaces take particles directly: WorldView Legion 4は. Nameless: ある衛星 in sentences, 不明な衛星 as a label.

### 5.3 [NUM]: plural categories and counters

- **CLDR plural categories for ja: `other` only** (cardinal and ordinal). One string per message. Where the English
  has a separate zero sentence, ja has one too.
- No space between a number and a counter (256基, 31枚, 7日間). One space between a number and an SI unit (786 km).
- The number is its own mono span; the counter is ordinary text right after it; the code keeps the two together.
- A number inside a fixed expression is not data and never a mono part: この1週間, 一度も, 一部, 唯一, 一面.

| What | Counter | As subject | In lists and readouts | Example |
|---|---|---|---|---|
| satellites | 基 | [NUM]基の衛星が | 衛星[NUM]基, レーダー衛星[NUM]基 | 256基の衛星が |
| images, photos, frames, clear looks | 枚 | [NUM]枚の画像 | 画像[NUM]枚, …は[NUM]枚 | 公開された画像は31枚 |
| passes, times | 回 | [NUM]回 | 通過[NUM]回, 計[NUM]回 | 計1,204回 |
| rows, scenes, search results | 件 | | [NUM]件 | 3件, シーン12件 |
| catalog objects | 個 (prose) | | 物体数 [NUM] (readout) | 宇宙物体16,893個 |
| days (window) | 日間 | 過去[NUM]日間 | | 過去7日間 |
| ago | 分 / 時間 / 日 + 前 | | | 12分前 · 41時間前 · 2日前 |
| durations | 秒 / 分 / 時間 | | | 38秒 · 4分05秒 · 1時間02分 |
| years | 年 | | | 2015年から |
| "k of n" (aria) | n + counter + 中 + k + counter + 目 | | | 27枚中3枚目 · 12回中3回目 |

- **Quantifiers:** "at least" → 少なくとも, right before the number. "About" before a quantity → 約 (約10 km). "About"
  with a clock → ごろ after it (07:49 CETごろ). "Total" → 計. "Once" → 1回.
- **"k of n" in Japanese order:** total first: 35枚のうち12枚. The messages take named parameters, so order is free.

### 5.4 Lists of names

- Two names: write AとB by hand. Intl.ListFormat('ja') returns 「Umbra、Capella」 for two, which reads as a broken list.
- Three or more: A、B、C (ListFormat's output is right here).
- Named items plus a remainder: A、Bほか[TYPE][N]基 (Umbra、Capellaほかレーダー衛星7基); [N] counts the others, as in English.
- Never および, そして, & or ・ between Latin names.

### 5.5 Dates and times inside sentences

- Large to small: 2026年11月1日（日）11:21 EST.
- The time comes right after the topic: [SAT]は[DAY][TIME]、…
- **Local time** in prose: 現地時間[CLOCK] (現地時間11:21). Zone abbreviations stay Latin: EST, CET, JST, UTC, UTC+9.
- **Approximate:** [TIME]ごろ; never 約 with a clock. In mono, ≈ stays.
- **Ranges** in prose: [DATE1]から[DATE2]まで.
- **Relative** in prose: 41時間前に.

---

## 6. Typography and formatting

### 6.1 Punctuation

| Mark | ja | Rule |
|---|---|---|
| Full stop | 。 | Every sentence, headlines and the hero's last line included. Never after labels, buttons, the tab title or `captionError`. |
| Comma | 、 | Never ， or an ASCII comma in Japanese text. ASCII commas only inside numbers (1,715) and coordinates (43.47, −80.54). |
| Quotation marks | 「」, nested 『』 | Never “ ” or " ", never for emphasis. Verdict quotes: 「向ければ見えた」と呼ぶ |
| Parentheses | （） in prose; () in mono, key hints and dates | 雲しか見えなかった（95%）。 · 拡大(F) · 11/1(日) |
| Colon | ： in prose and aria | おまかせ：有名な場所をランダムに選ぶ. ASCII : only in clocks. |
| Question mark | ？ | About's questions and the hook / question only. |
| Exclamation mark | never | |
| Ellipsis | … (U+2026), once | After 中 in status lines (計算中…, 取得中…, リンクを作成中…) and after a cut place name. Never ..., ・・・, ……, or a trailing ellipsis for mood. |
| Dash | none in prose | — only as the "unknown value" readout. Never ― or ー as a dash. |
| Range | 〜 (U+301C) in prose; – (en dash) in mono; → in the kicker and day ranges | 10〜30 m · 10–30 m · 2026/11/12 → 11/19 UTC. Never ～ (U+FF5E), which formatRange emits. |
| Middle dot | · (U+00B7) between fields in mono and chips; ・ (U+30FB) inside katakana names and fixed noun pairs (昼・夜) | Never ・ as a list separator for Latin names. |
| Slash | " / " with spaces | 02 / 通過 · 3 / 27. Checked against the dates beside the counters (2026-11-22; Vietnamese had to drop its slash, where d/m is a date): a Japanese mono date beside a counter is never bare, always a weekday or a year and no spaces (11/1(日), 2017/12/20; the time-lapse's frame list, which had bare 2/8 beside 02 / 12, now writes 2月8日), and "3 / 27" is the image viewer's count readers know, so the counters (`system.counter`, the time-lapse's 03 / 12 included) keep it. |
| Arrow | → | 北 → 南 · ライン 0412 → 1024 |
| Note marks | the product's superscripts ¹ ² ³ | Never ※ or 注). |
| Spaces | Prose: none typed between Japanese and Latin or digits (CSS spaces them, §6.6); one between a number and an SI unit. Mono readouts: a space separates fields (取得 11:21:21 EST · 10 m, 物体数 16,893, 傾き 8.9°). Never U+3000. |

### 6.2 Numbers and units

- Half-width digits and letters only; never full-width (２５６, Ｓｅｎｔｉｎｅｌ).
- Comma grouping, decimal point: fmt('ja') gives 16,917.5. Never 万 / 億, never kanji numerals for quantities.
- 25% and 98.6° with no space; 786 km, 10 m, 7.46 km/s with a space. Minus is − (U+2212).
- Never Intl.NumberFormat unit output for ja: it gives 7.46 km/秒. Write km/s by hand.
- **Coordinates:** readouts, HUD and slots keep the international form (16.2°S 063.0°E, 0.2°W). Prose that the ja
  message builds from a number writes 南緯19.5°、東経48.2°, 西経0.2°.

### 6.3 Dates and times

| Context | English | ja | Source |
|---|---|---|---|
| Mono day (rows, captions, HUD, `day`) | Sun 1 Nov | 11/1(日) | Intl `{month:'numeric', day:'numeric', weekday:'short'}` |
| Mono day and time (`stamp`) | Sun 1 Nov · 11:21 EST | 11/1(日) · 11:21 EST | as above + the clock and zone |
| Card stamp | Sun 1 Nov 2026 · 11:21 EST | 2026/11/1(日) · 11:21 EST | `{year:'numeric', month:'numeric', day:'numeric', weekday:'short'}` |
| Card week | 7 days to Sun 1 Nov 2026 | 2026/11/1(日)までの7日間 | as above |
| Day and month (`dayMonth`, `lookDay`) | 29 Oct | 10/29 | by hand from the fields |
| Day range (`dayRange`) | 29 Oct → 5 Nov | 10/29 → 11/5 | by hand (not formatRange) |
| Kicker (`windowRange`) | 12 → 19 NOV 2026 UTC | 2026/11/12 → 11/19 UTC; across a year 2026/12/29 → 2027/1/5 UTC | by hand (not formatRange) |
| Weekday alone (`weekdayShort`) | Sun | 日曜 | 日 alone reads as "day" |
| Compact day (`dayCompact`) | Su 1 | 1(日) | |
| Prose day (post, share page) | Sun 1 Nov / Sun 1 Nov 2026 | 11月1日（日） / 2026年11月1日（日） | Intl `{month:'long', day, weekday:'short'}`, parentheses made full-width |
| Prose day, no weekday | 29 Oct | 10月29日 | |
| Spoken (`daySpoken`) | Friday 6 November | 11月6日金曜日 | Intl `{month:'long', day:'numeric', weekday:'long'}` |
| Time-lapse date | 22 Oct 2015 | 2015/10/22; spoken 2015年10月22日 | at time zone UTC |
| At sea (`atSea`) | UTC−9 · at sea | UTC−9 · 洋上 | |
| Clocks, zones, ISO stamps, T−00:42 | | unchanged | |

- Days and months are not zero-padded; clocks are (07:49). 24-hour clock, never 午前 / 午後. Durations stay zero-padded
  in mono: 4分05秒, 1時間02分.
- **Relative time:** `relativeParts`, then たった今 for unit `second`, else
  `relativeFormat('ja', 'narrow', 'always')`: 12分前, 41時間前, 2日前, 3時間後 (no space). Spoken: `'long'`.
  Never the default `'short'` or `'long'` style on screen (they print 41 時間前 with a space), never `numeric: 'auto'`
  (it turns zero into 今 and one day into 昨日).

### 6.4 Case, mono labels, abbreviations

- Japanese has no case. Latin words keep their own case (Sentinel-2, NASA, km); Latin units stay lowercase in mono caps,
  exactly as in English (高度 786 km). Never full-width capitals for emphasis.
- Mono labels in ja: 02 / 通過 · 過去7日間 · 2026/11/12 → 11/19 UTC · 取得 11:21:21 EST · 10 m · 物体数 16,893 ·
  TLE元期 2026-11-08 03:15Z · CELESTRAK.
- **Abbreviations:** short kanji nouns instead. Never invented clippings (最詳), never Latin-style ones (Asc / Desc →
  北上 / 南下; min / h → 分 / 時間). Latin acronyms stay: UTC, NORAD, TLE, GMST, km, m.

### 6.5 Line breaking

- **Kinsoku:** 、。」）？… ー and small kana never start a line; 「（ never end one. `line-break: strict` on `:lang(ja)`.
- **Phrase breaking** (`word-break: auto-phrase` + `text-wrap: balance`): headlines, the sub line, panel heads, chips,
  buttons, verdict titles and the About title. **Not** on body paragraphs (pass sentences, notes, About answers): there
  auto-phrase leaves ragged lines with big gaps in a 420 px panel, so body text breaks between characters with kinsoku
  only. (`scripts.css` currently applies auto-phrase to every `p`: narrow it to the landing sub and headings.) It is CSS
  only: no script, no download. Browsers without it break between characters with kinsoku, which is acceptable.
- Never ship BudouX or any segmenter: phrase parts written by a translator do better where breaks matter (cards, §6.7).
- Never break between a number and its counter or unit (the code keeps them nowrap).
- The hero and the About title are explicit lines and never reflow. Translators insert no manual breaks, no
  zero-width spaces, no `<br>`.
- Verdict titles may wrap at a phrase: おそらく／見ていた, 向ければ／見えた, 上空を／通った.

### 6.6 Type in Japanese (for whoever builds the ja styles)

These match the per-script tokens in `src/styles/scripts.css`; the items marked **add** are not there yet.

- **No Japanese webfont for running text.** A CJK font is megabytes a weight. System fonts, after the brand's Latin
  faces so digits, units and Latin names stay on brand.
- **Sans stack (ja):** 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Watched JA', Meiryo, 'Noto Sans JP',
  'Noto Sans CJK JP', sans-serif. **Add** 'Watched JA', a zero-cost `local()` alias that keeps Windows off the thin
  Yu Gothic Light / Regular, and drop 'Yu Gothic UI', 'Yu Gothic', YuGothic:
  ```css
  @font-face { font-family: 'Watched JA'; src: local('Yu Gothic Medium'), local('YuGothic-Medium'); font-weight: 100 500; }
  @font-face { font-family: 'Watched JA'; src: local('Yu Gothic Bold'), local('YuGothic-Bold'); font-weight: 600 900; }
  ```
- **Punctuation alias (add):** with Instrument Sans and Martian Mono first, U+2026 is drawn as a low Latin "…" after
  計算中. Put a `local()` alias of the system gothic with `unicode-range: U+2025-2026` first in the ja sans and mono
  stacks. 、。「」（）！？ already fall through to the CJK font; · – → stay in the brand faces on purpose (they are the
  design's separators).
- **Serif:** 'Hiragino Mincho ProN', 'Yu Mincho', YuMincho, 'Noto Serif JP', 'Noto Serif CJK JP', then the sans. Many
  Android builds and older Windows set-ups have no Japanese Mincho: a Japanese place name then falls back to gothic and
  is carried by the signal colour. Test on a mid-range Android.
- **The static accents** (the hero's あなた, About's 仕組み) come from `--font-accent`: a subset of just those glyphs
  (Noto Serif JP, weight 500, a few kB) inside the `ja` chunk, so they are Mincho on every device at no extra request.
- **Upright, never slanted:** `font-synthesis-style: none` (already set; not `font-synthesis: none`, which would also
  stop bold synthesis). Latin place names keep Instrument Serif italic.
- **Display:** CJK glyphs cannot be condensed (never scaleX). `--display-k` 0.8 on desktops and 0.9 on phones (as set),
  so the hero is never below about 40 px on a phone; leading `0.92 × --lh-k 1.2` ≈ 1.1; `palt` on display and headings
  (`--feat-display`, `--feat-heading`, set); tracking −0.01em only together with `palt`. Body text, labels and readouts
  stay full-width (no `palt`).
- **Running text:** leading ≈ 1.7 (`--lh-text-k` 1.1667 over the base 1.45). Mono labels ≈ 1.4.
- **Sizes:** labels 12 px with +0.1em tracking (set). **Add:** `--fs-micro` and `--fs-meta` at 11 px for ja (chips,
  tags, footnotes): no Japanese below 11 px anywhere.
- **Weights** (never 501–599: system CJK fonts round them up): display 600, panel heads 500, strong 600, serif 500,
  body 400 (Yu Gothic through the Medium alias).
- **Japanese–Latin spacing (和欧間):** `text-autospace: normal` (set). A small margin on mono number spans only under
  `@supports not (text-autospace: normal)`, never both. Never typed spaces.

### 6.7 Share card rendering for ja (engineering; each item is a constant or a few lines, no cost per view)

1. **Headline:** a ja text part never wraps inside itself; lines break only between parts (each part is its own line,
   as the renderers already set blocks). Choose the headline size by width, not by `lead.length`: the largest step at
   which the widest part fits 466 px (kana and kanji 1 em, digits and Latin ≈ 0.5 em) and the block fits its band.
   In satori, one nowrap element per part; in the canvas, no segmenter split inside a part.
2. **Hero leading:** the CJK hero lines at ≥ 1.05 (Latin keeps 0.94).
3. **PNG (canvas):** for a ja card use the ja family lists (`--cjk-sans` / `--cjk-serif`), set `ctx.lang = 'ja'` where
   supported, and draw CJK runs of the accent upright: italic only for Latin runs. Otherwise the saved PNG shows a
   synthetic slant the DOM preview does not.
4. **Unfurl (satori):** for a ja card, load Noto Sans JP at weight 600 for the lead's glyphs and Noto Serif JP (500) for
   the accent's, through the existing Google Fonts `text=` subset loader (a few kB, once per card, cached per link).
   Today it asks for Noto Sans JP 400 only, so the lead comes out regular and あなた in sans. No bundled font, no glyph
   list to maintain.

---

## 7. Length discipline

**How ja compares with English**

- **Glyphs:** Japanese prose uses about 45–60% of the English character count.
- **Width:** a kana or kanji is 1 em; condensed Instrument Sans averages ≈ 0.45 em a character and Martian Mono ≈ 0.6 em
  plus tracking. So prose is ≈ 0.9–1.2 × the English width, short kanji labels 0.5–1.0 ×, katakana loanwords 1.2–1.5 ×
  (the overflow risk). Height: CJK leading makes a ja paragraph about as tall as the English at the same width.
- **X posts:** X counts a Japanese character as 2. `links.ts xLength` already weights it (256 units with a 120-character
  place, the invitation dropped first). Budget the post's first paragraph at 90 full-width glyphs, names included.

**Budgets** (glyphs by §2.2's count, at the ja label size of 12 px with +0.1em ≈ 13.2 px a glyph)

| Surface | Budget |
|---|---|
| Pass view readout strip (4 cells on a phone, ≈ 70 px each) | 5 glyphs: 高度 · 仰角 · 傾き · ピクセル · 地点の雲 |
| Other mono labels | 6 glyphs, no exceptions |
| Buttons | 7 glyphs (share sheet: 8, three across 360 px); the time-lapse video button 132 px: 動画 · 書き出し中 42% · 作成に失敗 · 動画を保存 |
| Share sheet link / post labels (48 px) | 3 glyphs: リンク · 投稿文 |
| Gallery filter segments | ≈ 4 glyphs each: すべて · 詳細画像 · 気象 · レーダー |
| Gallery status, lightbox status (≈ 14 Latin characters) | ≈ 8 glyphs including the number |
| Example chips | ≈ 8 glyphs: エリア51 · セントラルパーク · ギザ |
| Pin card name lines (156 px at 13 px) | 7 glyphs: 地名を確認中 · 近くに地名なし |
| Computing readout row | ≈ 20 glyphs |
| Card headline parts | ≤ 7 glyphs each, ≤ 4 lead parts |
| Card footer invitation | あなたを見ていたものを見る (13 glyphs) fits beside the host |

**Strategies**

1. A kanji noun before katakana: 保存 (2), not ダウンロード (6).
2. Mono labels drop を; buttons keep it (画像を保存).
3. Drop the subject (zero anaphora) and the obvious object.
4. Noun endings for readout-like sentences (雲量は25%。).
5. Never truncate a word to fit: find a shorter word, or let the line wrap at a phrase.

| EN | ja | Glyphs |
|---|---|---|
| SURPRISE ME | おまかせ | 4 |
| USE MY LOCATION / LOCATE ME / NEAR ME | 現在地を使う / 現在地 / 現在地 | 6 / 3 / 3 |
| HOW THIS WORKS | 仕組み | 3 |
| LAST 7 DAYS | 過去7日間 | 4.5 |
| CLOSEST LOOK | 最も詳細な画像 | 7 (chips, ≤ 20 Latin) |
| TIME-LAPSE | タイムラプス | 6 |
| OFF-NADIR | 傾き | 2 |
| PIXEL / ALTITUDE / PASSES / SHARE | ピクセル / 高度 / 通過 / 共有 | 4 / 2 / 2 / 2 |
| DOWNLOAD IMAGE / COPY LINK / REPLAY | 画像を保存 / リンクをコピー / リプレイ | 5 / 7 / 4 |
| GROUND SPEED / ELEVATION FROM YOU / SUN ELEVATION | 対地速度 / 仰角 / 太陽高度 | 4 / 2 / 4 |
| FIELD OF REGARD / SCAN LINE HERE · UTC | 指向範囲 / 走査線の到達 · UTC | 4 / 6 + UTC |

---

## 8. Sensitive content

**Surveillance and privacy**

- The product verb is 見る, and that is enough. Never 監視, 盗撮, 覗き, スパイ, 監視社会 rhetoric. Military imaging
  satellites are 偵察衛星, never スパイ衛星.
- Privacy statements say exactly what the English says, no more: 約10 km四方の区画 · 約1 kmに丸めた地点 ·
  IPアドレスも、独自のCookieも…残さない. Never 完全に匿名, 安心, 守られています.

**War zones in the time-lapse** (Gaza Strip, West Bank, Ukraine, Lebanon)

- Standard Japanese names where a translator writes one: ガザ地区, ヨルダン川西岸地区, ウクライナ, レバノン, イスラエル,
  パレスチナ.
- Describe what the frames show, never who caused it: 変化, 建物, 農地. Never 破壊された, 虐殺, テロ, 侵略, 侵攻, 戦場
  unless the English says it. Where an area word is needed: 紛争地域.
- The caption names only the season (晴天画像11枚 · 毎年夏に1枚). Never say why that season was chosen.
- **Ukrainian names** use the forms the Japanese government and NHK have used since 2022: キーウ (not キエフ), ハルキウ,
  オデーサ, ミコライウ, チェルニーヒウ, チョルノービリ, ドニプロ. This applies where a translator writes a name; runtime
  labels come from the gazetteer unedited.

**Glaciers:** factual verbs only (後退, 縮小); "end of the melt season" → 融解期の終わり; never 消滅, 危機, 悲鳴 or warming
commentary the English does not make.

**Country names** (the country at the end of a "where" line, from the browser via `countryName`)

- Use Intl.DisplayNames' default long style (what `countryName` already asks for), with these ja overrides, a constant
  table in the code: HK → 香港, MO → マカオ, PS → パレスチナ, US → アメリカ, MM → ミャンマー, CD → コンゴ民主共和国,
  CG → コンゴ共和国. Long style alone gives 中華人民共和国香港特別行政区, パレスチナ自治区, アメリカ合衆国,
  ミャンマー (ビルマ) and the bracketed Congos; the short style mixes アメリカ (katakana, broadcast style) with 英国 (kanji,
  press style). Long plus overrides gives イギリス beside アメリカ: one register.
- Taiwan stays 台湾 (both styles); never qualified (台湾（中国）, 中国台湾省).
- Translators never hand-write country names in runtime lines; the code supplies them. (Curated sublabels in §3.8 are
  copy and are written by hand.)

**Japan's own territorial disputes** (Northern Territories, Takeshima / Dokdo, Senkaku / Diaoyu). Whether a feature
there shows a country line is product behaviour (bounding boxes in code), conflicts with `geo.where`'s "never drop a
part", and other languages will want the opposite. It is an owner decision, to be recorded in `docs/I18N.md`. Until then
translators write nothing about these areas, never use one as a curated example, and the code shows what the gazetteer
gives. Translators never write sovereignty words for any territory. Sea names a translator writes: 日本海, ペルシャ湾.

**Agencies:** keep the Latin acronyms (NASA, ESA, NOAA, EUMETSAT, USGS, Copernicus), except where Japan has the
established name: JMA → 気象庁, US Space Force → 米宇宙軍.

**Attribution lines stay in English** as the data policies word them: "Contains modified Copernicus Sentinel data
2026", "Landsat: USGS / NASA", "Contains modified EUMETSAT Meteosat data 2026", "Map data © OpenStreetMap contributors
(ODbL)". Their labels are translated (制作, 書体, 地名).

---

## 9. Pitfalls and the reviewer's checklist

### 9.1 False friends and traps

| Trap | Wrong | Right | Why |
|---|---|---|---|
| watched | 監視していた, 撮影した, 見た | 見ていた | Surveillance; the owner's "never photographed"; 見た is momentary. |
| something | 誰か | 何か | 誰か puts a person behind it. |
| pass | パス | 通過 | Path, password, skip, exam pass. |
| mosaic | モザイク, 合成画像 | 日別画像 | Censorship pixelation; a faked picture. |
| fixed camera | 固定カメラ | 真下を見続けるカメラ | CCTV. |
| closest look | 最接近 | 最も詳細な画像 | It is the most detailed clear image. |
| closest (distance) | 最接近 | 最短距離 | 最接近 is a moment. |
| elevation / altitude | 標高, 海抜 | 仰角 / 高度 | Heights of terrain. |
| heading | 見出し, ヘディング | 進行方向 | |
| clear | クリア | 雲なし, 晴天 | Collides with the Clear button. |
| pixel (label) | 解像度, 分解能 | ピクセル | It is pixel size, not resolving power. |
| this week (data) | 今週 | この1週間 | 今週 is the calendar week. |
| station / commercial / operator | 駅, 基地局 / コマーシャル, 商用 / オペレーター | 宇宙ステーション / 商業 / 運用者 | |
| range | 射程, 届く範囲 (alone) | 観測できる範囲 | Weapon range; "what reaches?" |
| in view (could) | 視野内, 視野に入った | 見える範囲 | Claims it was in view. |
| over you | あなたの上 | あなたの頭上 | Something stepping over the reader. |
| track / ground track | トラック / 追跡 | 追跡中の / 地上軌跡 | |
| scene / window / cell / spot / post | 場面 / ウィンドウ / セル / スポット / ポスト | シーン / 期間, 時間枠 / 区画 / 地点 / 投稿文 | |
| day (sun state) | 日 | 昼 | A date. |
| weekday alone | 日 | 日曜 | "Day". |
| crossed | 交差した | 通った, 横切った | |
| light (radar) | 軽い | 光 | |
| straight up | 天頂 (UI) | ほぼ真上 | Jargon; 真上 already means it. |
| the actual image | 本物の画像 | 実際の画像 | 本物 implies the rest are fake. |
| imaging satellite | 撮像衛星 | 観測衛星 | Reconnaissance. |
| crop circles | ミステリーサークル | 円形農地 | A hoax. |
| try again | もう一度 | 再試行 | Sounds cut off. |
| Himawari-9, Landsat 9 (in slots) | ひまわり9号, Landsat 9号 | Himawari-9, Landsat 9 | Catalog names never change. |
| Intl defaults | 41 時間前, 7.46 km/秒, 2026/11/12～2026/11/19, Umbra、Capella | 41時間前, 7.46 km/s, 2026/11/12 → 11/19, UmbraとCapella | §5.4, §6.2, §6.3 |

### 9.2 Reviewer's checklist (run it on every string)

1. **Register:** plain form only. No です／ます／ください／ございます／いただく, no imperative, no mix in a block.
2. **Notices:** what failed, then 〜は〜から。 or one 〜できる or a noun ending. No このまま, ご安心, apology.
3. **Product verb:** "watched" is 見ていた. 観測 / 走査 only for instruments in general; 撮像 only in the globe callout;
   撮る only where the English says "took"; never 監視, 撮影.
4. **Hero:** 今週、何かが／*あなた*を／見ていた。 (card: four lines). Accent あなた only, upright Mincho. Tab title without 。.
5. **あなた** only in the sanctioned lines (§1.4). 私たち only for a contrast. No 弊社, 当サイト, お客様.
6. **今週** only in brand lines; data says この1週間 / その1週間 / 過去N日間.
7. **Counters:** 基 satellites, 枚 images, 回 passes, 件 rows and scenes. No space before a counter; one before km / m /
   km/s. No 万 / 億, kanji numerals or full-width digits. Fixed expressions (この1週間) are not mono.
8. **Plurals:** one `other` string; zero has its own sentence where English has one.
9. **[PLACE]:** no article, quotes or suffix; particle attached; accent on the name only; on cards, the place last.
10. **[SAT]:** no 彼 / 彼女 / それ; no 衛星 or 号 appended; が in event lines, は as paragraph topic. Nameless: ある衛星 / 不明な衛星.
11. **Verdict words** match §3.5 exactly (titles, lanes, unit 回, definitions, verbs, quotes in 「」).
12. **Glossary traps** (§9.1): no モザイク, 合成画像, パス, 固定カメラ, 標高 for elevation, 最接近 for closest look,
    クリア, 商用, 視野内 for could.
13. **Punctuation:** 、。「」（）：？ full-width in prose; () in mono, key hints, dates. No ！. … only after 中 or a cut name.
    〜 (U+301C) for prose ranges, – in mono, never ～. · between fields; ・ only in katakana names and fixed pairs. No ※.
    No typed spaces around Latin or digits in prose; one between mono fields. No U+3000.
14. **Dates:** §6.3: 11/1(日) in mono, 11月1日（日） in prose, 11月1日日曜日 spoken; kicker and ranges by hand with →;
    narrow relative times; 24 h; ごろ in prose, ≈ in mono; 現地時間 for "local".
15. **Compass:** 8 points in prose, 16-point kanji in readouts; 北上 / 南下. Coordinates international in readouts.
16. **Honesty:** every label says exactly what is on screen. 画像, not 写真, where radar, mosaics or frames can appear;
    ピクセル, not 解像度; 上空, not 真上, for the overhead verdict; 向ければ見えた and 見える範囲, never a claim it looked.
17. **Length:** strip labels ≤ 5, other labels ≤ 6, buttons ≤ 7 (share sheet 8), card headline parts ≤ 7, post lead ≤ 90.
18. **Rhythm:** no three 〜た endings in a row; at most two の in a row; sentences ≤ about 45 (counting Latin as ½).
19. **Tone:** no marketing words, no horror words, no exclamation marks, no emoji.
20. **Never translated:** brand, domain, satellite, sensor, product and agency names (except 気象庁, 米宇宙軍), NORAD IDs,
    UTC, the handle, attribution lines. Static blurbs may add ひまわり / だいち names once, in 「」.
21. **Sensitive content:** キーウ-style names; neutral war-zone and glacier wording; nothing written about Japan's
    disputed areas; country names from Intl long style with the seven overrides; 富士山 in both prefectures.

---

## Decisions log

The critique's 49 numbered items and 20 "missing" items (69 in all): 53 accepted, 16 partly accepted, 0 rejected.

| # | Item | Resolution |
|---|---|---|
| 1 | Card lead / place / tail split cannot be built | Partly accepted: place last, relative clause, accent = place + 。, phrase parts (§3.6). The claim that the preview and PNG draw text blocks before the place is outdated (all three renderers now set blocks in order); the real reasons are a particle-led line and serif particles. Each part is its own line, not "parts share a line". |
| 2 | ja card text has no line breaks; sizes assume Latin | Partly accepted: width-based size and no wrap inside a part (§6.7); simpler contract than line-sharing, and the canvas already segments (word level, which is why phrase parts are still needed). |
| 3 | Default card hero overflows | Partly accepted: the overflow is real; fixed by a four-line card hero in the catalog at the existing 88 px (no code), not by a 74 px ja size (§3.1). |
| 4 | Display factor 0.65–0.7 too small | Partly accepted: 0.65–0.7 withdrawn; 0.8 desktop / 0.9 phones as `scripts.css` was set from specimens, hero ≥ ≈ 40 px, rather than 0.88 (§6.6). |
| 5 | palt for display only | Accepted (already in `scripts.css`; §6.6). |
| 6 | Micro and meta sizes illegible | Accepted: 11 px for ja micro and meta; nothing below 11 px (§6.6). |
| 7 | Yu Gothic faint on Windows | Accepted: `local()` Medium / Bold alias, Yu Gothic names dropped from the stack (§6.6). |
| 8 | Card fonts in unfurl and PNG | Partly accepted: canvas draws CJK upright with ja families and `ctx.lang`; satori gets Noto Sans JP 600 / Noto Serif JP through the existing free subset loader instead of a bundled subset with a glyph list to maintain (§6.7). |
| 9 | Heaviest pass sentence | Accepted: この場所の[DIR8][DIST]、高度[ALT]を通り; overhead in the same shape; 真下から[DEG]傾いた方向を見ていた (§3.4). |
| 10 | Sub line conditional and length | Accepted: 地球上の好きな場所を入力すると…; the sub is a display block; the "passive" objection to 撮影された dropped (§3.2). |
| 11 | あなたの上 | Accepted: 今週、あなたの頭上を通ったのは？, listed as a sanctioned あなた (§1.4, §3.6). |
| 12 | Notices as feature lists | Accepted: 〜は〜から。, one 〜できる, no added reassurance, no bare dictionary verb (§1.3, §3.7). |
| 13 | 合成画像 reads as doctored | Accepted: 日別画像 / 日別 / 日別ピクセル, explained as つなぎ合わせた (§4). |
| 14 | List keys that do not exist | Accepted: showAllSats / showAllRows / showMore / left / showFewer / sats; 以下新しい順 (§3.7). |
| 15 | オフナディア角 too wide for the strip | Partly accepted: the problem is real, but 6 glyphs do not fit either at the 12 px ja label size; the label is 傾き everywhere, オフナディア角 named once in About (§4, §7). |
| 16 | Disputed areas rule | Accepted: moved to an owner decision in `docs/I18N.md`; translators write nothing; the code shows the gazetteer (§8). |
| 17 | 観測 ban too broad | Accepted: 見る for watching this place; 観測 / 走査 for instruments; 撮像 only in the globe callout (§2.3). |
| 18 | Post hook echo | Accepted: 今週、何かがあなたも見ていた。 (§3.6). |
| 19 | 届く範囲 vague | Accepted: 観測できる範囲 for radar; 届く範囲 only with カメラ (§2.5, §4). |
| 20 | could definition | Partly accepted: いる and こちら fixed, reworded with the place as subject: この場所は、…カメラの届く範囲に入っていた (§3.5). |
| 21 | likely uses two words | Accepted: 観測幅 throughout; card 「[SAT]の」「観測幅に入った」 (§3.5, §3.6). |
| 22 | 幅290 kmの観測幅 | Accepted: 290 kmの観測幅に入っていた / 観測幅290 kmの内側 (§3.4). |
| 23 | Commercial example | Accepted: 真下を向いていれば、Waterlooが見えた。; no accent in pass prose (§3.4). |
| 24 | "Can it see me?" | Accepted: 自分の姿は見える？／…車は1ピクセルに収まる。あなたの姿は写らない。 (§2.5, §3.7). |
| 25 | ほぼ天頂 | Accepted: ほぼ真上; 天頂 out of UI copy (§3.4, §4). |
| 26 | 北行 / 南行 | Accepted: 北上 / 南下 (§4). |
| 27 | Filter 詳細 reads as Details | Partly accepted: 詳細画像, not 高精細 (TV-spec jargon that overclaims for 10–30 m) (§3.7). |
| 28 | ListFormat two items | Accepted (verified: 「Umbra、Capella」): AとB by hand (§5.4). |
| 29 | Dates from Intl | Partly accepted: kicker and ranges by hand with →; Intl's half-width (日) in mono and UI; prose keeps full-width （日）, written in the ja card and share catalogs at no cost; `weekTo` keeps the year (§6.3). |
| 30 | Relative time | Accepted (verified): `narrow`, `numeric: 'always'`, たった今 under 45 s (§6.3). |
| 31 | text-spacing-trim claim | Accepted: widths corrected; `palt` does the display narrowing (§3.1). |
| 32 | 和欧間 twice | Accepted: margin only under `@supports not (text-autospace: normal)` (§6.6). |
| 33 | Ellipsis from the Latin font | Partly accepted: alias for U+2025–2026 only; 、。「」 already fall through, and · – → stay in the brand faces on purpose (§6.6). |
| 34 | font-synthesis vs font-synthesis-style | Accepted (§6.6). |
| 35 | auto-phrase on all prose | Accepted: headings, sub, short UI only; body paragraphs kinsoku only; `scripts.css`'s `p` rule to be narrowed (§6.5). |
| 36 | Leading numbers missing | Partly accepted: display ≈ 1.1, running text ≈ 1.7, mono 1.4, matching the specimen tokens rather than raw sizes (§6.6). |
| 37 | Space rule contradicts examples | Accepted: no typed spaces in prose; a space between mono fields (§6.1). |
| 38 | 中黒 too strict | Accepted: ・ in fixed noun pairs and katakana names; · between fields (§6.1). |
| 39 | Ranges | Accepted: 〜 (U+301C) in prose, – in mono; the guide's 〜 notation removed (§6.1). |
| 40 | Numbers in fixed expressions | Accepted: この1週間 plain text; idioms exempt (§5.3). |
| 41 | Counting characters | Accepted: full-width 1, Latin and digits ½ (§2.2). |
| 42 | Counter and terms | Accepted: 基 kept with its rationale; 商業 over 商用; 宇宙物体 in prose, 物体数 in the HUD (§4). |
| 43 | Country names | Accepted (verified): long style with HK, MO, PS, US, MM, CD, CG overrides (§8). |
| 44 | Status lines conjugate | Accepted: 作成に失敗, 再試行, 再試行中… (§1.1, §4). |
| 45 | "Don't open with the place" | Accepted: rule dropped (§5.1). |
| 46 | Document title | Accepted: tab title without 。; og:title and alt keep it (§3.1). |
| 47 | Mincho not guaranteed | Partly accepted: fallback noted and tested on Android; the static accents come from a subset in the ja chunk so they are Mincho everywhere; weight 500 per the specimens, not 600 (§6.6). |
| 48 | Himawari-9 Japanese name | Accepted as a blurb-only addition in 「」 for ひまわり8号 / 9号, だいち2号 / 4号; slots never change; the owner may veto (§3.7, §5.2). |
| 49 | Stale length note | Accepted (verified `xLength`): "already done; lead budget 90" (§7). |
| M1 | Fault notice | Accepted: 障害, 問題が起きた。, the two faults, 再試行 / 再試行中… / 戻る (§3.7). |
| M2 | Loading screen | Partly accepted: Watchedを読み込み中; slow line 回線が遅い · まだ読み込み中 (まだ for "still") (§3.7). |
| M3 | Computing readout | Accepted, with 物体数 16,912 (§3.7). |
| M4 | Engine footnotes | Accepted, with 該当する for one / other and total-first order (§3.7). |
| M5 | Zero and dark sentences | Accepted, wording tuned (日光が必要なカメラ, 画像を公開している観測衛星) (§3.3). |
| M6 | HUD | Partly accepted: under a minute is たった今, not 1分未満前; the scene clock label is リプレイ, not シーン (the archive's word) (§3.7). |
| M7 | Globe | Accepted (§3.7). |
| M8 | Time words | Accepted: 日曜, 1(日), 洋上, zero-padded durations (§6.3). |
| M9 | Key hints | Accepted: 拡大(F), 閉じる(Esc), スペース (§3.7). |
| M10 | Landing statuses | Accepted: 検索不可, 取得中…, 中止, Photon（地名検索サービス） (§3.7). |
| M11 | Gallery and viewer | Accepted, with その1週間に12枚 for glossary consistency (§3.7). |
| M12 | Share sheet | Partly accepted: buttons and labels as proposed; the could post keeps the English's three sentences (ここにカメラを向けることもできた。向けたかどうか…) (§3.6). |
| M13 | Card catalog keys | Partly accepted: most as proposed; `aSatellite` label 不明な衛星 (ある衛星 only in sentences); could card 「[SAT]が」「向ければ見えた」 instead of 視野に入った (overclaims) (§3.6). |
| M14 | Time-lapse | Accepted, with アーカイブを検索中 for listing and past tense for `captionError` (§3.7). |
| M15 | Curated places | Accepted: full table, press spellings without ヴ, 富士山 in both prefectures, 円形農地 for crop circles (§3.8). |
| M16 | "where" line order | Accepted: small → large, joined with 、 (§3.7, §3.8). |
| M17 | Language switcher | Accepted (§3.7). |
| M18 | Weights per role | Partly accepted: display 600, panel heads 500, strong 600, serif 500, body 400, as the tokens set (§6.6). |
| M19 | Verdict quotes in prose | Accepted (§3.5). |
| M20 | Blurb conventions | Accepted (§3.7). |

**Other corrections to the draft, from checking the code** (not raised by the critique):

- Every pass card now leads with the week's N (`headline`); per-verdict sentences (`headlineBy`) are only for older
  shares. The draft's per-verdict card table was the legacy form.
- The sub line's day count is plain text, not a mono number.
- The imaged lane is "Photo" in English; ja keeps 画像 for honesty (radar, mosaics, frames share the lane).
- `countryName` already uses the long style; the draft's "use short" is replaced by long plus overrides.
- `relativeFormat` defaults to `'short'`, which prints a space in Japanese; ja passes `'narrow'`.
- The could window readout is 見える範囲, not 視野内; `unit.up` is empty because 仰角 already says it.
- About's "Every image you see is the real one" is 実際の画像, not 本物; the open-camera note says 観測計画, never 撮影予定.
- "Shared with you · …" (results headers) is 共有された通過 · [SAT]が[PLACE]を見ていた.
- The draft's notation 〜 ("the word before this ending") is removed: 〜 is now a real range mark in prose.
