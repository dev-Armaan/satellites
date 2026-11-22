# Watched: zh-Hans localisation style guide

Final. Simplified Chinese for mainland China, Singapore and Malaysia (`zh-Hans`): one variety, mainland standard
vocabulary (视频, 网络, 信息, 链接), which readers in Singapore and Malaysia read without friction. Traditional Chinese
(`zh-Hant`) has its own guide. This guide binds every `zh-Hans` string the product shows, speaks or sends: the app, the
share cards and pages, the post text, alt text, aria labels, the video, About and the loading screen.

Written against `docs/DESIGN.md` §3 and §7, `docs/I18N.md`, `docs/i18n/TRANSLATING.md`, `src/ui/results/lib/copy.ts`,
`src/ui/results/lib/meta.ts`, `api/_lib/i18n/card/en.ts`, the English namespaces in `src/i18n/en/`, and the CJK type
study (2026-11, measured specimens). Where this guide and a translator's habit disagree, this guide wins. Where this
guide and the English disagree on a fact, the English wins, this guide is wrong, and someone should report it.

Notation. `[PLACE]` a place name from the gazetteer, `[SAT]` a satellite name, `[NUM]` a count (a mono span), `[TIME]` a
24-hour clock with its zone (`16:14:21 UTC`, `11:21 EST`), `[CLOCK]` a clock alone (`11:21`), `[DAY]` a day built by
§5.5, `[ALT]` / `[DIST]` / `[SWATH]` a distance with its unit, `[SPEED]` a speed with its unit, `[DEG]` an angle, `[PCT]` a
percentage, `[DIR]` one of the 8 compass words (§4.2). In frames, `*…*` marks the serif accent and `**…**` the bold
count phrase.

---

## 0. Decisions at a glance

| Question | Decision |
|---|---|
| Address | **你** everywhere. Never 您, never 你们. The product speaks as **我们**. **请** only in a sentence asking the reader to do something outside the app (check the connection, change a browser setting). |
| The product verb ("watched") | **注视**. **注视过** everywhere, the hero included. **注视了** only with a named moment (the post). Never 注视着, 监视, 看过, 拍摄. |
| "this week" | **这一周** (and 那一周). Never 本周. |
| "pass" (noun) | **过境**, counted with **次**. |
| "image" / "photo" | **图像** for any image (counted with 张). **照片** only for an optical Sentinel-2 / Landsat photo or a station's camera. |
| "archive" | **图像库**. Never 档案库, 档案馆. |
| "clear" (cloud-free) | **无云**. 清晰 appears only in 最清晰画面 (the closest look: the sharpest clear one). |
| Satellites | Counted with **颗**. Names never translated. An unknown satellite is 一颗卫星. |
| Rows in a list, orbits | Counted with **条**. |
| Verdicts | 注视过 · 很可能注视过 · 能对准这里 · 从上空经过. Lanes: 图像 · 很可能 · 可对准 · 过顶. |
| Numbers | Arabic digits, `1,715`, `7.46`. Never 万 / 亿. |
| Spacing | One space between Han and a Latin letter or digit. None next to full-width punctuation. None inside or around a Han date token (`11月1日`, `自2015年起`). Data slots ([PLACE], [SAT]) get their space from `cjkGap` (§5.1). |
| Punctuation | Full-width in sentences (，。、：；？（）“”). No ！, no ——. |
| Units | `786 km`, `7.46 km/s` with a space. `25%`, `12.3°` attached. Time units in Han (秒, 分钟, 小时, 天). |
| Dates | Built by hand from the date fields (§5.5): `11月1日 周日`, in prose `11月1日（周日）`. ISO digits in strings that scramble and on card stamps. 24-hour clock. |
| Plurals | CLDR has one category for zh, `other`: one form per message. A zero case is its own sentence. |
| Fonts | System Chinese sans. One ≈ 2 kB serif subset (你 运 作) inside the zh-Hans chunk. No other Chinese font is ever downloaded. |

---

## 1. Register and address

### 1.1 The decision: 你, plain written Mandarin, no politeness padding

| Surface | Register | Example | Why |
|---|---|---|---|
| Display headlines (hero, results headline, About title, card headline) | Plain written Mandarin (书面语, not 文言), declarative, 你 when a person is named, ends with 。 | 这一周 / 有东西 / 注视过*你*。 | The headline is the human moment. 你 is close and level; the line lands as a quiet fact, not a greeting. |
| Sentences and prose (pass paragraphs, notes, footnotes) | The same. Complete sentences, 你 for the reader, 我们 for the product. No sentence-final particles (呢、哦、吧、啦、呀). | 这一周，我们追踪的卫星没有一颗注视过 Waterloo。 | The English is an instrument talking. Particles turn an instrument into a chat bot. |
| UI labels and buttons | Verb + object, or a bare noun. No pronoun, no 请, no 您. 2–4 Han. | 搜索地点 · 复制链接 · 重新搜索 | Chinese UI convention, like the English, puts the action first. 请 adds a bow to every button and doubles its length. |
| Mono caps labels (`ALTITUDE`, `02 / PASSES`) | Noun phrases. No verb where a noun exists, no 的, no punctuation except `·` and `/`. | 高度 · 02 / 过境 · 最接近 · UTC | They are readouts on an instrument face. |
| Error notices | What happened, then what still works. No apology (抱歉、对不起、很遗憾), no 哎呀 / 出错啦, no ！. A suggestion takes 你可以; an instruction for something outside the app takes 请, once. | 暂时无法获取你的位置。你可以直接搜索地点。 · 无法加载轨道目录。请检查网络连接后再试一次。 | The English never apologises and never pleads. Stating the fact is calmer and more trustworthy than bowing. A bare command to act outside the app reads like a command line. |
| About page | Conversational written Mandarin: shorter words, 我们 and 你, short answers ("不能。"). Light everyday words (不少、挺) are allowed; no internet slang. | 它能看见我吗？不能。 | The English About is the owner talking plainly. It may be warmer than the results panel, never cuter. |
| Share post text (配文), share page title and description | Same as headlines and prose. | 这一周，也有东西注视过你。 | It is read out of context, in someone else's feed or a chat preview: it must stand as a sentence. |

**The one exception to "no 请".** A sentence that asks the person to do something the app cannot do for them. Today
that is two strings:

- `app` catalog fault: 无法加载轨道目录。请检查网络连接后再试一次。
- `landing.locateErrors.denied`: 位置权限被阻止了。请在浏览器设置里允许，或者直接搜索地点。

Everything else is 请-free, including "Try again" (再试一次: the app does it) and every button.

### 1.2 The rejected alternative: 您

1. **It kills the line.** 这一周，有东西注视过您。 reads like a bank's SMS. The uncanny needs closeness; 您 puts a service
   counter between the reader and the thing watching them.
2. **It is not how Chinese software talks now.** WeChat, Apple, Xiaomi, Bilibili and most mainland and Singaporean apps
   address the user as 你. 您 survives in banking, government portals and customer service scripts, which is exactly
   the tone DESIGN §1 bans ("SaaS landing page").
3. **Mixing is worse than either.** 你 in the headline and 您 in the error notices sounds like two authors. One pronoun,
   everywhere.

### 1.3 Also rejected

- Dropping the pronoun everywhere to dodge the choice. Chinese drops pronouns freely, and so do we where it is natural
  (labels, most prose), but the hero must say 你: it is the accent word.
- 你们. The product always speaks to one person.

---

## 2. Voice

### 2.1 How "declarative, specific, quietly uncanny, second person" sounds in Chinese

- **Declarative.** Statements, with 了 / 过 for what happened. No rhetorical questions, no exclamations. Questions only
  where the English asks one (About's Q&A, the share hooks, the share page title).
- **Specific.** The number carries the weight. Put it early, set it as a digit, give it its measure word. "256 颗卫星" is
  the punch; nothing around it needs an adjective.
- **Quietly uncanny.** Understatement. The sentence states the fact and stops; the reader supplies the shiver. Never
  name the feeling: no 竟然、居然、偷偷、悄悄、神秘、惊人、震撼、细思极恐. No 监视 / 监控 (§8).
- **Second person.** 你, sparingly. Chinese does not need a pronoun in every clause; one 你 in a paragraph is plenty.
- **When things happened.** A pass is past. Conditions at its moment take 当时 (当时是白天, 当时天已经黑了). 正 only for
  motion at that moment (正以 7.46 km/s 向南飞行).

### 2.2 Rhythm and length

- Clauses of **4–12 Han**; sentences of **at most about 30**. Split an English sentence at "so", "and", "but" or a comma
  when the Chinese would run past 30.
- **Topic first.** Time and place lead, then who, then what: 过去 7 天里，有 256 颗卫星注视过 Waterloo。
- **One idea per sentence.** English packs relative clauses ("every satellite that passed over it in the last 7 days");
  Chinese front-loads them as long 的 chains. **At most two 的 per clause**; past that, split.
- **End on the noun or the number**, not on an adverb or a particle.

### 2.3 What to avoid

- Marketing tone: 快来、一键、解锁、专属、带你探索、全新、震撼、✨. The product has no "discover".
- Calques: 某物 (for "something"), 关于这个 (sentence-initial "about"), 进行搜索 (use 搜索), 做出判断, 一个 for every "a",
  所有的 for every "all", 它 for every "it", 被 for every English passive, **这样做** for "did so / whether it did" (say what
  it did: 是否真的注视过, 是否真的对准过).
- Literal English structure: the comma splice that becomes a run-on, the attributive clause that stretches a line to 40
  Han, "It was…" opening every sentence as 它当时是….
- Chat particles and softeners: 呢、哦、吧、啦、呀、哈、亲、小伙伴.

### 2.4 Before and after

| English | Before (calque or wrong tone) | After |
|---|---|---|
| Something watched you this week too. | 这周也有某些东西注视了你！ | 这一周，也有东西注视过你。 |
| It was dark here. Weather imagers keep scanning at night in infrared, so it saw your clouds, not your streets. | 这里当时是黑暗的。气象成像仪在夜间以红外线的方式持续进行扫描，因此它看到的是你的云，而不是你的街道。 | 当时这里天已经黑了。气象成像仪夜间也在用红外扫描，所以它看到的是你头顶的云，不是你的街道。 |
| Can it see me? No. At best a pixel here is 10 m across. A car is one pixel. You're not in it. | 它可以看到我吗？不可以。在最好的情况下，这里的一个像素是 10 米宽的。一辆汽车是一个像素。你不在它里面。 | 它能看见我吗？不能。这里最清晰的图像，一个像素也有 10 m 宽。一辆车只占一个像素。画面里认不出你。 |
| Radar doesn't need light. Umbra, Capella and 7 other radar satellites passed within range 1,204 times. | 雷达不需要光。Umbra，Capella 和 7 个其他雷达卫星在范围内通过了 1,204 次。 | 雷达不需要光照。Umbra、Capella 和另外 7 颗雷达卫星在探测范围内经过了 1,204 次。 |
| Could not load the orbit catalog. Check your connection and try again. | 哎呀，出错了！很抱歉，我们无法加载轨道目录，请您检查网络后稍后再试。 | 无法加载轨道目录。请检查网络连接后再试一次。 |
| …it could have watched Waterloo. We can't know whether it did. | …它可以注视 Waterloo。我们不能知道它是否这样做了。 | …它就能注视 Waterloo。它是否真的注视过，我们无从得知。 |

---

## 3. The key lines

### 3.1 The hero

Final (three display lines, one accent, no comma):

```
这一周
有东西
注视过*你*。
```

`landing.hero`: `[['这一周'], ['有东西'], ['注视过', accent('你'), '。']]`

- **Plain text**, wherever the sentence stands alone (the share page title, og / card alt, the default card's
  description): `这一周，有东西注视过你。` The h1's accessible text is the three lines run together,
  `这一周有东西注视过你。`, which is also grammatical.
- **Share hook** (`share.hookWatched`): `这一周，也有东西注视过你。`
- **Line lengths** 3 / 3 / 5 em. The breaks fall at time / subject / verb + object, the three phrases a reader pauses
  on anyway.
- **No comma in the display.** On a Chinese poster the line break is the pause. A comma at the end of line 1 adds
  nothing, and it would not hang outside the measure (`hanging-punctuation` works only in Safari). The plain-text
  sentence keeps its comma.
- **过, not 着.** The English is a past report: "Something watched you this week." The uncanny comes from learning that
  it happened. 注视着 ("is watching you") is the stock horror and surveillance line (有东西在看着你), which §8 rules out,
  and it claims an ongoing gaze the product does not report. With 过, the hero, the results headline, the verdict title
  and the share headline all use one verb form, and the share hook rhymes with the hero.
- **The accent is 你**: the human moment, as in English. It is set in the serif accent face (a Song design, §6.9),
  **upright**, in signal orange. Chinese has no italic: never let the browser slant it.

| Alternate | Why it lost |
|---|---|
| 这一周， / 有东西 / 注视着*你*。 | Present durative: "something is watching you". A horror line, an ongoing-surveillance claim, and a second verb form beside every other 注视过. |
| 有东西 / 这一周 / 注视过*你*。 | Subject before time is the weaker order; line 2 becomes a bare time phrase. |
| 本周， / 有东西在 / 注视*你*。 | 本周 is the register of a supermarket flyer; 在 stranded at the end of line 2 cuts the verb in half. |

### 3.2 The sub line

English: "Enter any place on Earth. See every satellite that passed over it in the last 7 days, and the actual pictures
they took."

Final: **输入地球上的任何地方。你会看到过去 7 天里飞过那里的每一颗卫星，以及它们拍下的真实图像。**

`landing.sub(days)`: `['输入地球上的任何地方。你会看到过去 ', String(days), ' 天里飞过那里的每一颗卫星，以及它们拍下的真实图像。']`

- 你会看到 turns the second imperative into a statement of what happens: second person, declarative. A bare
  one-character 看 imperative reads as a command or an ad ("看！"). The doubled 看看 is a soft, natural invitation and is
  fine (the card footer: 看看是什么注视过你).
- 每一颗 keeps the weight of "every"; 每颗 sounds like a price list.
- 图像, not 照片: the pictures include weather mosaics and radar images (honesty rule).
- 那里, not 它: a place is "there", not "it".
- 飞过那里 keeps the second sentence at 30 Han. 从那里上空经过的 made it 38, with a long 的 chain.
- 拍下 is the English's own "took (pictures)". A sentence about one radar image says 成像 (§3.5).

| Alternate | Why it lost |
|---|---|
| 输入地球上任意一个地点，查看过去 7 天飞越那里的每颗卫星，和它们拍下的真实图像。 | 查看 is form language; one long sentence; 每颗 loses "every". |
| 在地球上任选一处。看看过去 7 天里，有哪些卫星从那里上空经过，又拍下了哪些真实的图像。 | 哪些 turns a statement into a browsing invitation; longer; softer. |

### 3.3 The results headline

The count phrase is **bold**, the place name is the serif accent, and 有 and the time phrase are plain. 。 sits outside
the accent.

| Case | Frame | Example |
|---|---|---|
| N ≥ 1 (CLDR `other`, the only category) | 过去 [NUM] 天里，有 **[NUM] 颗卫星注视过** *[PLACE]*。 | 过去 7 天里，有 **256 颗卫星注视过** *Waterloo*。 |
| N = 1 (the same frame) | 过去 [NUM] 天里，有 **[NUM] 颗卫星注视过** *[PLACE]*。 | 过去 7 天里，有 **1 颗卫星注视过** *北京*。 |
| An older window | [DAY1]至[DAY2]，有 **[NUM] 颗卫星注视过** *[PLACE]*。 | 10月29日至11月5日，有 **31 颗卫星注视过** *Waterloo*。 |
| Zero, this week | 这一周，我们追踪的卫星没有一颗注视过 *[PLACE]*。 | 这一周，我们追踪的卫星没有一颗注视过 *Waterloo*。 |
| Zero, that week | 那一周，我们追踪的卫星没有一颗注视过 *[PLACE]*。 | |

- **Why 有.** A numbered, indefinite subject wants 有 in a full sentence ("有 256 颗卫星…"); without it the line reads
  like a newspaper headline or a definite group. 有 sits outside the bold, and the same rule holds on the share card
  (§3.6).
- **Zero alternate rejected:** 这一周，没有一颗我们追踪的卫星注视过 Waterloo。 (a heavy attributive before the noun).
- **Spacing around the place** comes from `cjkGap` (§5.1): `注视过 Waterloo。` but `注视过北京。`.
- In the DOM, the bold phrase and the place are `white-space: nowrap` (§6.8): otherwise `256 颗卫` / `星` splits.

### 3.4 The second line (images made public)

The number is set in the display face. 至少 is a separate prefix span, so the line settles in place when the count
becomes final.

| Case | Frame | Example |
|---|---|---|
| K ≥ 1 | [NUM] 张图像已公开。 | 31 张图像已公开。 |
| Partial | **至少** [NUM] 张图像已公开。 | 至少 1,715 张图像已公开。 |
| Zero (results) | 这一周没有公开的图像。 / 那一周没有公开的图像。 | |
| Zero (card line) | 没有公开的图像。 | |
| Archives down (results, share page, post) | 图像库没有及时响应，暂时无法统计公开图像。 | |
| Archives down (card, one line) | 图像库没有响应。 | |

One number counts every image (photos, weather mosaics, radar images, full-disc frames), so it is always 图像, never
照片 (owner: "N images were made public").

| Alternate | Why it lost |
|---|---|
| 已公开 [NUM] 张图像。 | 至少 would have to go mid-line (已公开至少 31 张), and the line would reflow when it settles. |
| [NUM] 张图像被公开。 | 被 passive is translationese here. |

### 3.5 Pass sentences (whole messages, every case)

`docs/I18N.md`: whole sentences, never fragments; code never glues translated pieces together. Each row below is one
complete message, a Rich message with `num` parts for every number and the clock. The English that the code builds
today from pieces (`passSentences` in `copy.ts`) is split into these messages when it moves to the catalog; the zh
column is the sentence for each.

**Crossing** (imaged photos, mosaics and radar; every crossing sentence ends the same way)

| Case | zh-Hans |
|---|---|
| Overhead (ground distance < 15 km) | Sentinel-2C 于 16:14:21 UTC 从正上方 786 km 高空经过，正以 7.46 km/s 向南飞行。 |
| Offset | Sentinel-2C 于 11:21:13 EST 从 786 km 高空经过，在这里以西 61 km 处，正以 7.46 km/s 向南飞行。 |
| Offset, diagonal | Sentinel-2C 于 11:21:13 EST 从 786 km 高空经过，在这里西南方向 61 km 处，正以 7.46 km/s 向东北飞行。 |

**Optical photo, after the crossing**

| Case | zh-Hans |
|---|---|
| Looking straight down | 它当时垂直俯视。 |
| Looking off nadir | 它当时的视线偏离垂直方向 12.3°。 |
| Cloud over the scene | 整幅画面的云量：25%。 |

**Daily mosaic and radar, after the crossing**

| Case | zh-Hans |
|---|---|
| Mosaic | 它的 VIIRS 成像仪把 Waterloo 扫入了 NASA 每日真彩色拼接图，每像素 375 m。 |
| Radar | 它的雷达朝侧面偏 23.1°，以每像素 20 m 为 Waterloo 成像。 |
| Radar, in the dark (sun below −6°) | 它的雷达朝侧面偏 23.1°，以每像素 20 m 为 Waterloo 成像，当时天已经黑了。 |

**Geostationary**

| Case | zh-Hans |
|---|---|
| Where it sits | Meteosat-12 从不过境。它悬在西经 0.2° 的赤道上空 35,778 km 处，每 10 分钟把下方的整个地球圆盘扫描一遍。 |
| …longitude unknown | Meteosat-12 从不过境。它悬在赤道上空 35,778 km 处，每 10 分钟把下方的整个地球圆盘扫描一遍。 |
| …cadence unknown | Meteosat-12 从不过境。它悬在西经 0.2° 的赤道上空 35,778 km 处，不停地扫描下方的整个地球圆盘。 |
| The scan line | 这一次，扫描线约在 07:49 CET 扫到 Paris，正向北移动。 |
| Infrared frame | 当时这里天已经黑了，所以这是红外图像：亮度表示云顶温度，越冷越亮。 |

**Likely**

| Case | zh-Hans |
|---|---|
| Crossing, offset, with swath | Landsat 9 于 10:21:07 EST 从 705 km 高空经过，在这里以东 40 km 处。这里在它 185 km 宽的成像带内。 |
| Crossing, overhead, with swath | Landsat 9 于 10:21:07 EST 从正上方 705 km 高空经过。这里在它 185 km 宽的成像带内。 |
| Crossing, no swath known | Landsat 9 于 10:21:07 EST 从 705 km 高空经过，在这里以东 40 km 处。 |
| Daylight, not published yet | 当时是白天，所以它几乎肯定记录下了这里。这次过境的图像还没有公开；图像库可能延迟一天或更久。 |
| Daylight, archive not searchable | 当时是白天，所以它应该记录下了这里。暂时无法检索图像库。 |
| Over 48 h, no scene | 这次过境没有对应的图像。Sentinel-2 只记录陆地和近岸水域，也可能没有安排对这里成像。 |
| Weather imager at night | 当时这里天已经黑了。气象成像仪夜间也在用红外扫描，所以它看到的是你头顶的云，不是你的街道。 |
| Daily mosaic not confirmed | 无法确认 NASA 这次过境的每日拼接图在此处有画面。 |
| Forecast data only | 它的图像用于天气预报，不会公开成我们能展示的画面。 |

**Could**

| Case | zh-Hans |
|---|---|
| Crossing, offset | WorldView Legion 4 于 10:52 EST 经过这里以西 61 km 处，这里在它的可视范围内。 |
| Crossing, overhead | WorldView Legion 4 于 10:52 EST 从正上方经过，这里在它的可视范围内。 |
| Steerable, off nadir | 只要视线偏离垂直方向 12.3°，它就能注视 Waterloo。它是否真的注视过，我们无从得知。 |
| Steerable, straight down | 只要垂直俯视，它就能注视 Waterloo。它是否真的注视过，我们无从得知。 |
| Fixed swath, private | Waterloo 在它 24 km 宽的成像带内。运营方不公开它在哪里成过像，所以我们无从得知它是否注视过。 |
| Radar, open archive | 雷达能穿透云层，也不受黑夜影响。只要朝侧面偏 23.0°，它就能为 Waterloo 成像。我们没有找到这次过境的公开图像。 |
| Radar, private | 雷达能穿透云层，也不受黑夜影响。只要朝侧面偏 23.0°，它就能为 Waterloo 成像。它是否真的成像过，我们无从得知。 |
| Radar, straight down | 雷达能穿透云层，也不受黑夜影响。它能为 Waterloo 成像。（then the open-archive or private sentence） |

**Overhead**

| Case | zh-Hans |
|---|---|
| Passing | ISS (ZARYA) 于 21:14 EST 从 420 km 高空经过，出现在你西南方的天空，高出地平线 62°。 |
| Near the zenith (≥ 80°) | ISS (ZARYA) 于 21:14 EST 从 420 km 高空经过，高出地平线 84°，几乎就在你头顶正上方。 |
| In the dark (sun below −6°) | 当时你那里天已经黑了。如果空间站当时仍在阳光下，它会以一个明亮、不闪烁的光点划过你的天空。 |

**Under the plan view** (`passView.noImage`; a footnote under the drawing, which is **above** it)

| Case | zh-Hans |
|---|---|
| openArchive | Sentinel-2C 这次过境没有此处的图像。上图是这次过境的示意图。 |
| radarPrivate | 没有公开图像：这家雷达运营方的图像库不公开。上图是这次过境的示意图。 |
| commercialPrivate | 没有公开图像：商业图像库不公开。上图是这次过境的示意图。 |
| noneToShow | 这次过境没有可显示的图像。上图是这次过境的示意图。 |
| archiveDown | 暂时无法检索图像库。上图是这次过境的示意图。 |
| noScene | 这次过境没有对应的图像。上图是这次过境的示意图。 |
| notYet | 还没有与这次过境对应的公开图像。Sentinel-2 和 Landsat 的图像通常在一天内出现。 |
| crewed | 载人空间站带有相机，但它们的照片不会按地点和时间公开。 |
| unavailable | 这次过境的图像无法显示。 |

Why these choices:

- **于 + [TIME].** Concise and written; it keeps [SAT] as the subject that opens the paragraph. [TIME] always carries its
  zone (`localClock` prints the zone, or UTC when the place's zone is unknown), so **never write 当地时间 before it**:
  当地时间 16:14:21 UTC is false at sea. 当地时间 appears only where the English says "local" with no zone: the post
  (§3.6) and the `Closest · local` label (最接近 · 当地).
- **俯视** ("look down from above") keeps the English's personified "looking"; 垂直 is the plain word for "straight".
  In a sentence 偏离垂直 needs its noun: 偏离垂直方向.
- **"scene"** is never 场景 (a film or 3D scene) and never 景 (remote-sensing jargon): 整幅画面 in prose, 整幅 as a unit.
- **Offsets name their reference point**: 在这里以西 61 km 处 (以北 / 以东 / 以南 / 以西), 在这里西南方向 61 km 处 for
  the diagonals. 在西侧 61 km 处 has no reference.
- **可视范围** is the field of regard: the place was inside the satellite's reach. Never 视野 (the instantaneous field of
  view, which over-claims), and never 从可视范围内经过 (visible to whom?).
- **Radar is never 拍下**: it 成像 ("forms an image"). 拍下 is photo language.
- **天黑, not 夜里**, for "dark": the code means the sun below the horizon (or −6°), which is 天黑.
- **The plan view is above the note**: 上图, never 以下. **示意图**, not 平面图: it is a drawing, not an image of the place.

| Alternate | Why it lost |
|---|---|
| 16:14:21 UTC，Sentinel-2C 从…经过 | Time first is natural, but the paragraph then opens on a mono number instead of the satellite. |
| 镜头垂直朝下。 | Accurate, but drops the "looking": the uncanny goes. |
| 它正垂直向下看。 | 看 is too plain and collides with the product verb. |

### 3.6 Share card, share page and post

**Card headlines** (`api/_lib/i18n/card/zh-Hans.ts`). A headline is blocks. Each text part is one line in the condensed
display face, never broken inside, so the lead is split into phrases where a typesetter breaks a display headline
(4–7 em each; the card's size is the largest at which every text part fits one line of the 466 px column,
`headlineSizeCjk`). The accent part is the place, in the serif (at most two lines), always last, with 。 inside it
(dropped when the place was cut). Every card leads with the week's count (`headline`); the per-verdict leads are only
for older shares that never stored it.

| Message | Text parts (a line each) | Accent block | Reads |
|---|---|---|---|
| `headline` (N ≥ 1) | `有 [NUM] 颗卫星` · `注视过` | `[PLACE]。` | 有 7 颗卫星注视过 Waterloo。 |
| `headline` (zero) | `我们追踪的卫星` · `没有一颗注视过` | `[PLACE]。` | |
| `headlineWeek` (N ≥ 1) | `这一周，` · `有 [NUM] 颗卫星` · `注视过` | `[PLACE]。` | 这一周，有 31 颗卫星注视过 Waterloo。 |
| `headlineWeek` (zero) | `这一周，` · `我们追踪的卫星` · `没有一颗注视过` | `[PLACE]。` | |
| `headlineBy.imaged` | `[SAT]` · `注视过` | `[PLACE]。` | Sentinel-2C 注视过 Waterloo。 |
| `headlineBy.likely` | `[SAT]` · `扫过` | `[PLACE]。` | Landsat 9 扫过 Waterloo。 |
| `headlineBy.could` | `[SAT]` · `经过时能对准` | `[PLACE]。` | WorldView Legion 4 经过时能对准 Waterloo。 |
| `headlineBy.overhead` | `[SAT]` · `飞越` | `[PLACE]。` | ISS (ZARYA) 飞越 Waterloo。 |

- Each text part ends with the gap to what follows it (`cjkGap`: `Sentinel-2C ` before 注视过, `注视过 ` before
  Waterloo), so the share page title and the post (the parts joined with nothing, `sentenceGap: ''`) read
  `有 7 颗卫星注视过 Waterloo。` and `有 7 颗卫星注视过北京。`. On the card a trailing space is invisible.
- Sizes (measured with `headlineSizeCjk`, Waterloo): `headline` 74 px, `headlineWeek` 72, the zero forms 66, a
  nameless satellite 74, a long name (WorldView Legion 4) 52.
- 飞越 is the established news verb for a station crossing a city (空间站飞越北京上空). A frame with the place in the
  middle (从 [PLACE] 上空经过, [PLACE] 在它的视野内) would leave the lead dangling on 从 and spread the serif over the
  predicate.
- Chinese cannot put "this week" after the object, as English `headlineWeek` does; 这一周， is the first line.

**The rest of the card**

| Key | zh-Hans |
|---|---|
| `photos` | §3.4 (card forms) |
| `cloud.only` | sub 云层遮挡。它只看到了云。 · chip `云层遮挡 · 92%` · post 它只看到了云。 · desc 它只看到了云（92%）。 |
| `cloud.mostly` | sub 大部分是云：占整幅的 81%。 · chip `大部分是云 · 81%` · post / desc 它看到的大多是云（81%）。 |
| `cloud.spot` | sub 此处正好被云遮住。 · chip `此处有云` · post / desc 此处被云遮住了。 |
| `stamp` | `2026-11-01 · 11:21 EST` (ISO day, no weekday: §6.4) |
| `weekTo` | `截至 2026-11-01 的 7 天` |
| `lastWeek` | 过去 7 天 |
| `readout` | 高度 · 仰角 · 速度 · 偏离垂直 · 像素 · 拼接图像素 · 最近距离 |
| `lane` | 图像 · 很可能 · 可对准 · 过顶 |
| `unit` | km · m · km/s |
| `decimal` | `fmt('zh-Hans').dec` |
| `geometry` | 过境几何 · 上北 |
| `note` | imageInApp 图像可在网站中查看 · imageUnavailable 图像暂时无法显示 · commercial 商业图像库，不公开 · inSwath 在成像带内，暂无公开图像 · groundTrack 最接近时的地面轨迹 |
| `acquiring` | 获取中… |
| `noPublicPhoto` / `noPhoto` | 这一周没有公开图像 / 没有可显示的图像 |
| `look` | closest 最清晰画面 · lastClear 最近一次无云画面 · clouded 云层遮挡 · radar 雷达 |
| `lookDay` | `11月3日` |
| `aSatellite` | 一颗卫星 (headline: 一颗卫星注视过 Waterloo。) |
| `invite` | 看看是什么注视过你 |
| `hero` | `[['这一周'], ['有东西'], ['注视过', accent('你'), '。']]` |
| `enterAnyPlace` | 输入地球上的任何地方 |
| `defaultPlace` | 朱美拉棕榈岛 |
| `defaultAlt` | 一张朱美拉棕榈岛（迪拜）的 Sentinel-2 卫星真实照片，旁边写着：这一周，有东西注视过你。输入地球上的任何地方。 |

**The share page** (its `<title>` and description are the whole preview in WeChat, Weibo and 小红书, where most
mainland visitors share; X is not available there, so these must stand alone)

| Key | zh-Hans |
|---|---|
| `page.title` | 这一周，有东西注视过你。 |
| `page.description` | the sub line (§3.2) |
| `page.placeTitle` | 这一周，是什么注视过 [PLACE]？ |
| `page.placeDescription` | 过去 7 天里飞过 [PLACE] 的每一颗卫星，以及它们拍下的真实图像。这一周，是什么注视过你？ |
| `page.opening` | `['正在打开 ', accent('Watched')]` |
| `crossed` (imaged, likely) | Sentinel-2C 于2026年11月1日（周日）11:21 EST 在 795 km 高空飞越 Waterloo，正向南飞行。 |
| `crossed` (overhead) | ISS (ZARYA) 于2026年11月1日（周日）21:14 EST 在 420 km 高空从 Waterloo 上空经过，正向东北飞行。 |
| `crossed`, no altitude | …飞越 Waterloo… / …从 Waterloo 上空经过… |
| `withinView` | WorldView Legion 4 于2026年11月1日（周日）10:52 EST 向西北飞行，Waterloo 在它的可视范围内。 |
| `couldHave` | 它能对准这里。运营方不公开它是否真的对准过。 |
| `straightDown` / `offNadir` | 它当时垂直俯视。 / 它当时的视线偏离垂直方向 12.3°。 |
| `cloudCover` | 云量：25%。 |
| `inSwath` | Waterloo 在它的成像带内。 |
| `bestFrom` | 最清晰画面来自 Sentinel-2B。 / 最近一次无云画面来自 Sentinel-2B。 / 第一张图像来自 Sentinel-2B。 |
| `question` | 这一周，是什么注视过你？ |
| `cardAlt` | 分享卡片，附有这一周最清晰的画面，来自 Sentinel-2B。 / 分享卡片。 |

When a part of `crossed` is missing (no time, no heading), drop its clause and keep the sentence whole.

**The post** (`share.post`; first paragraph, then the hook, then the credit)

| Case | zh-Hans |
|---|---|
| imaged | 当地时间11月1日（周日）11:21，Sentinel-2C 从 786 km 高空注视了 Waterloo。每像素 10 m；这是真实的图像。 |
| imaged, no pixel size | 当地时间11月1日（周日）11:21，Sentinel-2C 从 786 km 高空注视了 Waterloo。这是真实的图像。 |
| clouded | 当地时间11月1日（周日）11:21，Sentinel-2C 从 786 km 高空注视了 Waterloo。它只看到了云。 |
| likely | 当地时间11月1日（周日）10:21，Landsat 9 从 705 km 高空扫过 Waterloo。它的成像带覆盖了这里。 |
| could | 当地时间11月1日（周日）10:52，WorldView Legion 4 经过时，Waterloo 在它的可视范围内。它能对准这里。运营方不公开它是否真的对准过。 |
| overhead | 当地时间11月1日（周日）21:14，ISS (ZARYA) 从 Waterloo 上空 420 km 处经过。 |
| hookWatched | 这一周，也有东西注视过你。 |
| hookPassed | 这一周，有什么从你头顶经过？ |
| credit | `via @armaangupt0` (unchanged: the handle line is the same in every language) |

- 注视了 is right here and only here: the moment is named.
- The pixel size in the post: whole metres, or whole km from 1,000 m (每像素 10 m, 每像素 2 km).
- File names (`pngName`, `fileNamePlace`) stay lowercase ASCII.

### 3.7 The four verdicts (`VERDICT_META`, one vocabulary everywhere)

| Verdict | Title | Lane label (mono) | Count unit | Definition | Verb (aria, lists) |
|---|---|---|---|---|---|
| imaged | 注视过 | 图像 | 次过境 | 公开图像库里有这个地方的真实图像。 | 注视过 |
| likely | 很可能注视过 | 很可能 | 次过境 | 这里在一台固定朝下的相机的成像带内。没有公开的画面。 | 扫过 |
| could | 能对准这里 | 可对准 | 次过境 | 这里在一台可转向相机或私营相机的可视范围内。运营方不公开它是否对准过这里。 | 经过时能对准 |
| overhead | 从上空经过 | 过顶 | 次过境 | 从你头顶经过。空间站，以及其余所有卫星。 | 从上空经过 |

Tiles: `31 次过境` over the title 注视过. Aria: `31 次过境：注视过`. Card verbs: §3.6.

- **图像, not 照片, for the imaged lane**: it holds weather mosaics and radar images too. This is more honest than the
  English "Photo", on purpose.
- **很可能**, not 可能: "likely" is probable (daylight, in the swath: it almost certainly recorded the place). 可能 alone
  means "possibly" and understates it. The three degrees read at a glance: 注视过 (it did), 很可能 (probably), 能对准
  (it could).
- **能对准这里**, not 本可对准这里: 本可 is counterfactual (他本可以赢 means he didn't win) and would claim the camera did not
  look. The English verdict is open, and its definition says so.
- **没有公开的画面**, never 这里的画面没有公开: we do not know that a picture exists. **固定朝下的相机**, not 固定相机
  (a CCTV or a tripod).
- **过顶** is the native term for a satellite crossing your sky (卫星过顶时间, 空间站过顶预报). 上空 as a lane label reads as
  a noun ("airspace").
- About's longer word after each (`about.verdictMore`): imaged 我们展示的就是真实的图像。 · likely
  照片还没有公开，或者因为云太多被丢弃了。 · could 它到底有没有对准过这里，没有办法知道。 When About quotes a verdict:
  我们称之为“能对准这里”。

### 3.8 The About page

| English | zh-Hans |
|---|---|
| How this / *works*. (`about.title`) | 这一切 / 如何*运作*。 `[['这一切'], ['如何', accent('运作'), '。']]` |
| Pick a spot on Earth. We work out which satellites flew over it in the last week, then go find the photos they took. It all runs in your browser, on public data. | 在地球上选一个点。我们算出过去一周有哪些卫星从那里上空飞过，再去找它们拍下的照片。一切都在你的浏览器里运行，用的全是公开数据。 |
| Sections | 简要说明 · 我们如何找出过境 · 标签的含义 · 我们的盲区 · 隐私 · 致谢 · 键盘 |
| Is it live? Not quite. Photos land in the archives a few hours to a couple of days after they're taken, so the newest passes might not have one yet. | 是实时的吗？不完全是。照片拍下后，要过几个小时到一两天才会进入图像库，所以最新的几次过境可能还没有照片。 |
| Can it see me? No. At best a pixel here is 10 m across. A car is one pixel. You're not in it. | 它能看见我吗？不能。这里最清晰的图像，一个像素也有 10 m 宽。一辆车只占一个像素。画面里认不出你。 |
| Is this every satellite? No. Military and spy satellites mostly aren't in public catalogs, and companies don't say where they point their cameras. | 这是全部卫星吗？不是。军用卫星和侦察卫星大多不在公开目录里，商业公司也不会说它们的相机对准了哪里。 |
| Made from public data. We didn't take any of these photos. | 由公开数据制作。这些照片没有一张是我们拍的。 |
| Close · Esc · Space | 关闭 · Esc · 空格 |

- **The title.** 工作原理 is a spec-sheet heading ("operating principle"), and broken across two poster lines it reads as
  two words. The English accent is on the verb that ends the phrase; 这一切 / 如何*运作*。 puts it there, and the clause
  takes its 。 naturally. The HUD and landing link keep 工作原理, where a nav label is right.
- 从那里上空飞过, not 从它上空飞过: a place is 那里 (§3.2).
- 我们的盲区, not 我们看不到的 (a dangling 的 phrase, calqued on "What we can't see").

---

## 4. Glossary

### 4.1 Terms

| English | zh-Hans | Notes |
|---|---|---|
| satellite | 卫星 | Measure 颗. Never 个 / 只, never 卫星们. |
| a satellite (name unknown) | 一颗卫星 | `aSatellite`. A Han [SAT]: see §5.2. |
| pass (noun) | 过境 | 1 次过境, 31 次过境. Never 通过, 通行证, 关. |
| to pass (over) | 经过 / 从…上空经过 | Never 通过. |
| to fly over, overflight | 飞越 / 飞过 | 飞越 is also the card's overhead verb. |
| to watch (product verb) | 注视 | 注视过 (default, hero included) · 注视了 (a moment is named). Never 注视着, 监视, 监控, 盯, 窥视, 观看, 看过, 拍摄. |
| Watched (verdict) | 注视过 | Lane 图像. |
| Likely watched | 很可能注视过 | Lane 很可能. |
| Could have pointed here | 能对准这里 | Lane 可对准. Never 本可. |
| Passed overhead | 从上空经过 | Lane 过顶. |
| swept over | 扫过 | |
| passed within view | 经过时，这里在它的可视范围内 | Card lead 经过时能对准. Never 从可视范围内经过. |
| photo | 照片 | Optical true colour only (Sentinel-2, Landsat), or a station's camera. 张. Radar is never 照片. |
| image | 图像 | 张. Photos, mosaics, radar, full disc. Never 影像, 图片. |
| public image | 公开图像 | Never 公共图像. |
| made public | 公开 / 已公开 | For images. 发布 only for an agency releasing a frame. Never 发表, 出版. |
| picture (what is in it), look | 画面 | Time-lapse frames count 帧. |
| Closest look | 最清晰画面 | The sharpest clear photo of the week. Never 最近 (it means "most recent"). |
| Last clear look | 最近一次无云画面 | Gallery note: 这是最近一次无云画面. Here 最近 does mean "most recent". |
| clear look (time-lapse) | 无云画面 | 12 帧无云画面. |
| archive | 图像库 | "the image archives" 图像库 / 各图像库. Never 档案库, 档案馆 (a personnel dossier, paper archives). |
| public archive / commercial archive | 公开图像库 / 商业图像库 | |
| scene (a satellite image) | 整幅画面 / 整幅 | Never 场景, 景. Counted "scenes" in the engine row: 张图像. |
| scene (the 3D view's time, HUD) | 场景 | HUD `SCENE` → 场景时间. The only place 场景 is right. |
| plan view, pass geometry | 示意图 · 过境几何 | Under it: 上图是这次过境的示意图. |
| swath | 成像带 | |
| swath width (label `SWATH`) | 幅宽 | |
| off-nadir | 偏离垂直 | Label. Prose 视线偏离垂直方向 [DEG]. Never 天底, 侧摆角, 侧视角. |
| straight down | 垂直向下 / 垂直俯视 | |
| ground track | 地面轨迹 | Never 星下点轨迹. |
| orbit | 轨道 | Counted 条. |
| altitude | 高度 | "786 km up" 786 km 高空. Never 海拔. |
| ground speed | 地面速度 | |
| heading | 航向 | |
| ascending / descending (`Asc` / `Desc`) | 升轨 / 降轨 | |
| elevation (in your sky) | 仰角 | "Elevation from you" 此处仰角; "In your sky" 你的天空. |
| sun elevation | 太阳高度角 | |
| azimuth, bearing | 方位 | |
| ground distance | 地面距离 | |
| closest (approach) | 最接近 | `Closest · UTC` 最接近 · UTC; `Closest approach · [SAT]` 最接近 · [SAT]. |
| closest (distance, card readout) | 最近距离 | With 距离 it means "nearest": safe. |
| field of regard | 可视范围 | `±45°`. |
| in swath / in view / window | 在成像带内 / 在可视范围内 / 时间窗 | Never 视野. |
| cloud cover | 云量 | |
| cloud at spot | 此处云况 | Values 无云 · 薄卷云 · 有云 · 云影. |
| clear (cloud-free) | 无云 | Never 晴 (a forecast word), never 清晰 (sharp). |
| thin cirrus / cloud shadow | 薄卷云 / 云影 | |
| clouded over / mostly cloud | 云层遮挡 / 大部分是云 | |
| your spot | 此处 (labels, chips) · 这里 / 这个位置 (prose) | Never 这个点 (colloquially "this late hour"). |
| pixel | 像素 | Label `PIXEL` 像素; "per pixel" 每像素. |
| mosaic pixel | 拼接图像素 | |
| resolution | 分辨率 | Only where the English says resolution. Never for `PIXEL`. |
| panchromatic / multispectral / band | 全色 / 多光谱 / 波段 | "Pan-sharpened with Landsat's 15 m band" 用 Landsat 的 15 m 全色波段锐化. |
| radar, radar image | 雷达, 雷达图像 | A radar 成像, never 拍下. |
| weather mosaic, daily mosaic | 气象拼接图, 每日拼接图 | Never 马赛克 (censorship pixelation), never 镶嵌图. |
| true colour | 真彩色 | |
| geostationary | 静止轨道 | 静止气象卫星 in prose; lane `Geo` 静止轨道. "Above the equator at" 定点经度. |
| full disc | 全圆盘 | |
| scan line | 扫描线 | Gallery `Line 0412 → 1024` 扫描行 0412 → 1024. |
| infrared / visible / colour | 红外 / 可见光 / 彩色 | |
| frame | 帧 | |
| time-lapse | 延时摄影 | Never 延时 alone ("delay"), never 缩时 (Taiwan). |
| replay | 回放 | Never 重播 (a TV rerun). |
| catalog (orbit) | 轨道目录 | Short 目录. |
| objects | 在轨物体 | 16,917 个在轨物体. Never 目标. |
| orbital elements, TLE | 轨道根数, TLE | Keep `TLE` in readouts. |
| epoch | 历元 | |
| sub-solar point | 太阳直射点 | |
| day / twilight / night (readout) | 白天 / 晨昏 / 夜间 | |
| dark (sun down) | 天黑 | |
| steerable camera / fixed camera | 可转向相机 / 固定朝下的相机 | |
| operator | 运营方 | Never 操作员. |
| private operator | 私营公司 | Not 私营运营方 (营 twice). |
| commercial | 商业 | Never 商用. |
| crewed | 载人 | |
| station | 空间站 | Static copy for China's: 中国空间站. Runtime names stay as catalogued. |
| weather satellite / imaging satellite | 气象卫星 / 成像卫星 | |
| open (open-data) imaging satellite | 开放数据的成像卫星 | |
| military / spy satellites | 军用卫星 / 侦察卫星 | Never 间谍卫星. |
| we track | 我们追踪的 | Never 跟踪 (stalking), 监测. |
| imaged (globe callout `IMAGED 11:21:13 EST`) | 成像 | 成像 11:21:13 EST. |
| acquisition (`ACQUISITION · [SAT]`) / acquired / acquiring | 成像 · [SAT] / 已获取 / 获取中 | |
| developing (frames) | 显影 | 正在显影. |
| verdict (aria) | 判定 | |
| share | 分享 | 分享这次过境 · 分享这一周 · 分享这张图像 · 分享这张照片. |
| download, Download image | 下载, 下载图像 | |
| Save PNG / Save video | 保存 PNG / 保存视频 | |
| Copy link / Copy image / Copied | 复制链接 / 复制图像 / 已复制 | |
| link | 链接 | |
| Post (the prefilled text) | 配文 | |
| Shared with you | 有人分享给你 | Not 分享给你 ("I share with you"). |
| video | 视频 | Never 视讯, 影片. |
| Search a place | 搜索地点 | |
| No match / N matches | 没有结果 / [NUM] 个结果 | |
| Use my location / Locate me / Near me | 使用当前位置 / 定位 / 我的位置 | |
| Surprise me | 随机一处 | |
| Drop a pin | 放置标记 | |
| How this works (link) | 工作原理 | About title: §3.8. |
| Last 7 days | 过去 7 天 | |
| this week / that week | 这一周 / 那一周 | Never 本周. |
| New search / Change / Recent / All passes | 重新搜索 / 更换 / 最近搜索 / 全部过境 | |
| Show all / Show more / left / Show fewer | 显示全部 12 条 · 显示全部 31 颗卫星 · 再显示 40 条 · 还有 40 条 · 收起 | Rows are 条. Never 再显示 40 次 ("show it again 40 times"). |
| Cancel / Close / Try again / Back | 取消 / 关闭 / 重试 / 返回 | |
| Fault / Something went wrong. / Trying… | 故障 / 出了点问题。 / 正在重试… | |
| Stale | 已过时 | |
| Now (timeline) | 现在 | |
| local time | 当地时间 | Only where no zone follows (§3.5). |
| UTC | UTC | Never 世界时, 格林尼治时间. Zone abbreviations stay as the code gives them. |
| ago / just now / in 3 h | 前 / 刚刚 / 后 | 41 小时前 · 3 小时后. |
| s / min / h / day | 秒 / 分钟 (分 inside a duration) / 小时 / 天 | |
| km, m, km/s | km, m, km/s | Never 公里, 千米, 公里/秒. |
| country | 国家或地区 | Never 国家 alone (§8). |
| Credits | 致谢 | |
| Agencies | NASA, NOAA stay Latin everywhere. In prose only (blurbs, About paragraphs): 欧空局 (ESA), 美国地质调查局 (USGS), 日本气象厅 (JMA), 欧洲气象卫星组织 (EUMETSAT). Labels, chips, source links and licence credits keep the Latin name. | |

### 4.2 Compass

The code passes a compass index (0 north … 7 northwest) or the satellite's heading; each frame picks its form.

| Index | Word | Heading (向…飞行) | Offset from the place | In your sky |
|---|---|---|---|---|
| 0 | 北 | 向北飞行 | 在这里以北 [DIST] 处 | 你北方的天空 |
| 1 | 东北 | 向东北飞行 | 在这里东北方向 [DIST] 处 | 你东北方的天空 |
| 2 | 东 | 向东飞行 | 在这里以东 [DIST] 处 | 你东方的天空 |
| 3 | 东南 | 向东南飞行 | 在这里东南方向 [DIST] 处 | 你东南方的天空 |
| 4 | 南 | 向南飞行 | 在这里以南 [DIST] 处 | 你南方的天空 |
| 5 | 西南 | 向西南飞行 | 在这里西南方向 [DIST] 处 | 你西南方的天空 |
| 6 | 西 | 向西飞行 | 在这里以西 [DIST] 处 | 你西方的天空 |
| 7 | 西北 | 向西北飞行 | 在这里西北方向 [DIST] 处 | 你西北方的天空 |

Chinese puts east or west first: 东北, never 北东. Scan direction values: 北 → 南 / 南 → 北. Mono readouts keep the
16-point Latin abbreviations (`194.6° SSW`, §6.6).

### 4.3 Curated places (`places` namespace)

Labels use the established Chinese name; sublabels run from large to small with no commas, the way Chinese writes an
address (a comma only between two unlike parts). Chips exist only for the first three.

| id | Chip | Label | Sublabel |
|---|---|---|---|
| area51 | 51区 | 51区 | 美国内华达州格鲁姆湖 |
| centralPark | 中央公园 | 中央公园 | 美国纽约 |
| giza | 吉萨 | 吉萨金字塔群 | 埃及吉萨 |
| uluru | | 乌鲁鲁 | 澳大利亚北领地 |
| palmJumeirah | | 朱美拉棕榈岛 | 阿联酋迪拜 |
| worldIslands | | 世界群岛 | 阿联酋迪拜 |
| grandCanyon | | 科罗拉多大峡谷 | 美国亚利桑那州 |
| meteorCrater | | 巴林杰陨石坑 | 美国亚利桑那州 |
| lowerManhattan | | 曼哈顿下城 | 美国纽约 |
| lasVegasStrip | | 拉斯维加斯大道 | 美国内华达州 |
| hooverDam | | 胡佛水坝和米德湖 | 美国内华达州和亚利桑那州 |
| goldenGate | | 金门大桥 | 美国旧金山 |
| kennedySpaceCenter | | 肯尼迪航天中心 | 美国佛罗里达州 |
| washingtonDc | | 华盛顿特区 | 美国国家广场 |
| mountStHelens | | 圣海伦斯火山 | 美国华盛顿州 |
| niagaraFalls | | 尼亚加拉瀑布 | 加拿大安大略省 |
| panamaCanal | | 巴拿马运河 | 巴拿马加通船闸 |
| rioDeJaneiro | | 里约热内卢 | 巴西，面包山和科帕卡巴纳 |
| paris | | 巴黎 | 法国法兰西岛大区 |
| venice | | 威尼斯 | 意大利威尼托大区 |
| vesuvius | | 维苏威火山 | 意大利那不勒斯 |
| istanbul | | 伊斯坦布尔 | 土耳其博斯普鲁斯海峡 |
| chernobyl | | 切尔诺贝利 | 乌克兰基辅州 |
| tableMountain | | 桌山 | 南非开普敦 |
| kilimanjaro | | 乞力马扎罗山 | 坦桑尼亚乞力马扎罗区 |
| everest | | 珠穆朗玛峰 | 中国和尼泊尔边境 |
| angkorWat | | 吴哥窟 | 柬埔寨暹粒 |
| singapore | | 新加坡 | 新加坡滨海湾 |
| hongKong | | 香港 | 中国香港维多利亚港 |
| tokyo | | 东京 | 日本东京 |
| fuji | | 富士山 | 日本静冈县 |
| sydneyHarbour | | 悉尼港 | 澳大利亚悉尼 |
| richat | | 理查特结构 | 毛里塔尼亚撒哈拉沙漠 |
| greatBlueHole | | 大蓝洞 | 伯利兹灯塔礁 |
| boraBora | | 波拉波拉岛 | 法属波利尼西亚社会群岛 |
| hardyReef | | 哈迪礁 | 澳大利亚大堡礁 |
| male | | 马累 | 马尔代夫北马累环礁 |
| deadSea | | 死海盐田 | 以色列和约旦，死海南部 |
| binghamCanyon | | 宾汉峡谷铜矿 | 美国犹他州 |
| mountWhaleback | | 惠尔巴克山铁矿 | 澳大利亚皮尔巴拉 |
| etna | | 埃特纳火山 | 意大利西西里岛 |
| santorini | | 圣托里尼 | 希腊基克拉泽斯群岛 |
| teide | | 泰德峰 | 西班牙特内里费岛 |
| kilauea | | 基拉韦厄火山 | 美国夏威夷州 |
| craterLake | | 火山口湖 | 美国俄勒冈州 |
| glenCanyonDam | | 格伦峡谷大坝 | 美国亚利桑那州佩奇 |
| gardenCity | | 花园城圆形灌溉农田 | 美国堪萨斯州 |
| almeria | | 阿尔梅里亚温室群 | 西班牙安达卢西亚 |
| gibraltar | | 直布罗陀 | 直布罗陀海峡 |
| suezCanal | | 苏伊士运河 | 埃及伊斯梅利亚 |
| aswanDam | | 阿斯旺高坝 | 埃及纳赛尔湖 |
| wadiRum | | 瓦迪拉姆 | 约旦亚喀巴 |
| sossusvlei | | 索苏斯盐沼 | 纳米比亚纳米布沙漠 |
| victoriaFalls | | 维多利亚瀑布 | 赞比亚和津巴布韦 |
| threeGorges | | 三峡大坝 | 中国湖北 |
| shanghai | | 上海 | 中国上海黄浦江 |
| itaipu | | 伊泰普水电站 | 巴西和巴拉圭 |

Traps: the Garden City "crop circles" are centre-pivot irrigation fields, so never 麦田怪圈 (the UFO hoaxes). Meteor
Crater is 巴林杰陨石坑, not 流星坑. Golden Gate is never bare 金门: in Chinese that is Kinmen island. 51区 is a proper
name, written without a space by established usage. Gazetteer and geocoder names are never translated.

---

## 5. Grammar strategies for runtime slots

### 5.1 [PLACE]: inserted as it comes

- Chinese needs no inflection, article or gender, so every frame works with any name. The English article logic
  (`placeInProse` / `placeParts`: "the Pacific Ocean") is bypassed for zh; never write 这 / 该 / 那个 before [PLACE].
- The name may be Latin (Waterloo), Han (北京) or another script. Frames never add a suffix (市、县、省、地区), a measure
  word or quotation marks.
- **Expect English names.** The geocoders are asked in English and the offline list is English, so most labels come back
  as Beijing, Tokyo, Waterloo. Every frame must read well with an English label; 过去 7 天里，有 256 颗卫星注视过 Beijing。
  is the common case, not 北京.
- Good positions: object of the verb (注视过 [PLACE]), topic at the start of a sentence ([PLACE] 在它…成像带内), with a
  locative (从 [PLACE] 上空经过), possessive ([PLACE] 的).
- **Spacing.** Catalogs write **no** literal space beside [PLACE]. Each message calls `cjkGap(before, after)`
  (`api/_lib/i18n/parts.ts`, Appendix B) at the slot's two edges: it returns one ASCII space where Han meets a character
  of a script written with spaces (a Latin letter, a digit, an ASCII symbol, another alphabet) and nothing otherwise.
  So `注视过 Waterloo。`, `注视过北京。`, `Waterloo 在它…`, `北京在它…`. Because messages are functions of their slot
  values, the result is the same in every renderer (DOM, canvas, satori, plain text). Punctuation and the space sit
  outside the serif span.
- Do not rely on CSS `text-autospace`: canvas and satori do not run it, and where a browser does it would add to the
  literal spaces.
- **Truncation.** A long name is cut with `…` by the code, and the frame's closing 。 is dropped, as in English.
- With no slot, "this place" is 这个地方 or 这里; "your spot" is 此处 in labels and chips, 这里 / 这个位置 in prose.

### 5.2 [SAT] as subject

- Chinese verbs and adjectives carry no gender: nothing in a frame agrees with [SAT]. Refer back with **它**, or better,
  drop the pronoun (zero anaphora) or say 这颗卫星. Never 他 / 她 / 祂.
- Never add 卫星 or 号 to a name (✗ Sentinel-2C 卫星, ✗ Landsat 9 号), never translate it (§9).
- [SAT] is usually Latin (`Sentinel-2C`, `ISS (ZARYA)`, `FENGYUN 4B`, `NORAD 60989`), but `aSatellite` is Han (一颗卫星).
  So [SAT], like [PLACE], gets its spaces from `cjkGap`: `Sentinel-2C 注视过`, `一颗卫星注视过`.
- A sentence may open with [SAT]: Sentinel-2C 于…. Possessive [SAT] 的 is fine.

### 5.3 [NUM] and plural categories

zh has **one** CLDR plural category, `other` (cardinal and ordinal). Every count message has exactly one form; do not
write a `one` branch. Where the English has a separate zero sentence ("No images were made public"), translate that
sentence separately; never print 0 with a measure word.

| Counted thing | Frame |
|---|---|
| satellites | [NUM] 颗卫星 (a satellite row's stack: [NUM] over 颗) |
| passes | [NUM] 次过境 |
| times (occurrences) | [NUM] 次 |
| rows in a list | [NUM] 条 |
| orbits | [NUM] 条轨道 |
| images / photos / mosaics / radar images / full-disc images | [NUM] 张图像 / 张照片 / 张拼接图 / 张雷达图像 / 张全圆盘图像 |
| frames, clear looks | [NUM] 帧 / [NUM] 帧无云画面 |
| objects | [NUM] 个在轨物体 |
| search results | [NUM] 个结果 |
| days / hours / minutes / seconds / years | [NUM] 天 / 小时 / 分钟 / 秒 / 年 |
| ordinal position | 第 [NUM] 张，共 [NUM] 张 · 第 [NUM] 帧，共 [NUM] 帧 |

- Digits always, as a mono span. Where the English spells a word ("once", "a year", "every"), Chinese uses the Han
  word: 一次, 一年一帧, 每一颗.
- **No break between a number and its measure word**: the catalog writes U+00A0 there, as English does with
  `7 days`: `` `${f.int(n)} 颗卫星` ``. Between Han and the number it writes an ordinary space: `有 `.
- Examples: 显示全部 31 次过境 · 显示全部 12 条 · 再显示 40 条 · 还有 40 条 · 收起 · 白天经过这里一次 / 白天经过这里 3 次.

### 5.4 Lists of names

- Items are joined with **、** (no spaces), the last with **和**, and a space where 和 touches Latin or a digit:
  `Umbra、Capella 和另外 7 颗雷达卫星` · `Umbra 和 Capella` · `北京和上海`.
- "and N other …" is 和另外 [NUM] 颗….
- `Intl.ListFormat('zh')` gives `Capella和另外 7 颗雷达卫星` (no space before 和); `fmt('zh-Hans').list` builds the list
  by hand instead (Appendix B).

### 5.5 Dates and times

zh-Hans builds every date, range, relative time and duration **by hand** from the date fields the `time` namespace
passes (`p`: year, month, day, dow with 0 = Sunday). Intl's zh output is not the house style (verified, ICU 78 / CLDR
48): `{month:'numeric', day:'numeric', weekday:'short'}` gives `11/1周日`, `formatRange` gives `11/1 – 11/8`, and
`RelativeTimeFormat` gives `12分钟前` with no space. Building by hand costs nothing. Weekdays: `'日一二三四五六'[p.dow]`.

| Message | Form | Example |
|---|---|---|
| `day` | `${m}月${d}日 周X` | 11月1日 周日 |
| `day` in prose (posts, descriptions) | `${m}月${d}日（周X）` | 11月1日（周日） |
| `weekdayShort` | `周X` | 周六 |
| `dayCompact` (48–92 px) | `${d}日` | 1日 |
| `dayMonth` | `${m}月${d}日` | 10月29日 |
| `dayRange` | same month `${m}月${d1}日 → ${d2}日`, else `${m1}月${d1}日 → ${m2}月${d2}日` | 11月1日 → 8日 · 10月29日 → 11月5日 |
| `daySpoken` | `${m}月${d}日星期X` | 11月6日星期五 |
| `stamp` (mono row) | `${day} · ${time} ${zone}` | 11月1日 周日 · 11:21 EST |
| `relative` / `relativeSpoken` | `刚刚` · `${n} 分钟前` · `${n} 小时前` (up to 48) · `${n} 天前` · `${n} 小时后` | 30 小时前 (never 昨天) |
| `durationSeconds` / `durationMinutes` / `durationHours` | `${s} 秒` · `${min} 分 ${ss} 秒` · `${h} 小时 ${mm} 分` | 38 秒 · 4 分 12 秒 · 1 小时 02 分 |
| `atSea` | `${zone} · 海上` | UTC−9 · 海上 |
| `landing.windowRange` (kicker: mono, scrambles) | ISO; the year once, the end as `MM-DD` when the year is shared | 2026-11-12 → 11-19 UTC · 2026-12-29 → 2027-01-05 UTC |
| `landing.elapsed` | `${ss} 秒` | 04 秒 |
| HUD `catalogAge` | `<1 分钟前` · `42 分钟前` · `5 小时前` · `3 天前`; stale `已过时，3 天前` | |
| HUD `fetched` | `获取于 ${stamp}` | 获取于 2026-11-08 03:34Z · 4 小时前 |
| Card `stamp` / `weekTo` / `lookDay` | §3.6 | 2026-11-01 · 11:21 EST |

In sentences:

- Chinese puts when before what: 当地时间11月1日（周日）11:21，[SAT]…, or mid-sentence with 于: [SAT] 于 [TIME]….
- "at about 07:49 CET" 约在 07:49 CET · "between 29 Oct and 5 Nov" 10月29日至11月5日 · "since 2015" 自2015年起 · "every
  10 minutes" 每 10 分钟 · "in the last 7 days" 过去 7 天里.
- The zone follows the clock as the code gives it. China and Malaysia print `UTC+8`, Singapore `SGT`; never translate
  a zone and never write CST (it also means US Central).

---

## 6. Typography and formatting

### 6.1 Punctuation

- **Full-width** in any Chinese sentence: ，。、：；？（）“”‘’. That includes after a Latin word or a number at the end of
  a clause: `Waterloo。` `25%。`
- **Quotation marks:** “…”, nested ‘…’. Never 「」 (Taiwan, Hong Kong, Japan), never straight quotes. `nothingMatches`:
  没有与“[QUERY]”匹配的结果。可以试试城市、地标或坐标。
- **No space** before or after full-width punctuation, even next to Latin.
- **Exclamation mark:** never.
- **Dashes:** no 破折号 ——; use 。，： instead. Numeric ranges keep the en dash inside the mono span (`10–30 m`); ranges
  in words use 至.
- **Ellipsis:** a single `…` for progress states and truncation (正在下载…), as wide as the English UI's. Prose has no
  ellipsis (the English has none), so the six-dot …… never appears.
- **Middle dot `·`** separates parts of mono readouts and chips, spaced as in English: `最清晰画面 · Sentinel-2B · 10 m`.
  It stays in Martian Mono.
- **Parentheses:** full-width （） in prose, whatever is inside. None in mono readouts.
- “ ” ‘ ’ and … are drawn from the CJK sans, not from Instrument Sans (Appendix B, the punctuation face).

### 6.2 Spaces

- One ASCII space between Han and a Latin letter or a digit: `Sentinel-2C 注视过` · `过去 7 天` · `有 256 颗卫星`.
- **A Han date token** (digits with 年 / 月 / 日, and 周X) behaves like Han: no space inside, no space next to Han, a
  space next to Latin or a clock: `11月1日`, `自2015年起`, `10月29日至11月5日`, `当地时间11月1日（周日）11:21`.
  An ISO date is Latin: `截至 2026-11-01 的 7 天`.
- **Counts with measure words are spaced** (`7 天`, `12 帧`, `31 次过境`), with U+00A0 between the number and the
  measure word (§5.3).
- **In mono rows a label and its value are separated by one space**, whatever they are: `最新 11月1日 周日 · 11:21 EST`,
  `最接近 8.9° · 61 km` (`passView.latest` and `closest` keep their trailing space).
- No space before `%` or `°`; one space before other units: `25%` · `12.3°` · `786 km` · `7.46 km/s`.
- Never two spaces; never a full-width space (U+3000); never a space next to full-width punctuation.

### 6.3 Numbers

- Decimal `.`, grouping `,` (as `Intl.NumberFormat('zh-Hans')` gives): `1,715` · `7.46` · `12,847`. Never 万 / 亿 (not
  1.28 万): the instrument shows the exact count.
- Arabic digits for every count and measurement. Han numerals only in fixed words (一次、一年一帧、每一颗、两侧).
- Negative values and coordinates keep the English minus sign `−`.

### 6.4 Dates

| Use | Format | Example |
|---|---|---|
| Rows, captions, the HUD's scene clock | M月D日 周X | 11月1日 周日 |
| Prose (posts, share page descriptions) | M月D日（周X）, with the year on the share page | 11月1日（周日） · 2026年11月1日（周日） |
| Spoken (screen readers) | M月D日星期X | 11月6日星期五 |
| Strings that scramble (the kicker) | ISO digits | 2026-11-12 → 11-19 UTC |
| Card stamps (top row) | ISO digits, no weekday | 2026-11-01 · 11:21 EST · 截至 2026-11-01 的 7 天 |
| Timeline labels | 周X (first day) · D日 (compact) | 周六 · 1日 |

Weekdays are 周一 … 周日 in compact forms, 星期一 … 星期日 only when spoken. No zero padding in Han dates (11月1日); zero
padding in ISO (11-01).

### 6.5 Time

- 24-hour always: `16:14:21`. Never 上午 / 下午.
- Durations and relative times: §5.5. Hours up to 48, as in English (30 小时前, never 昨天).

### 6.6 Coordinates and compass

- Mono readouts keep the Latin form: `SUN 19.5°S 048.2°E` → `太阳 19.5°S 048.2°E`. 16-point headings stay Latin
  (`194.6° SSW`): Chinese 16-point names (北东北, 东东南…) are unfamiliar to most readers.
- Prose spells the hemisphere in Han, before the number: 西经 0.2°, 北纬 43.47°.
- Prose directions use the 8 Chinese words (§4.2).

### 6.7 Case, mono labels and scrambled strings

- Han has no case. `text-transform: uppercase` on a mono label only touches its Latin parts, units aside, as in English
  (`786 km`, `NORAD · 过境`). Write units and names in normal case; CSS does the rest. Prose is never uppercased, so `km/s` in a
  sentence stays lowercase.
- **Han words are allowed in mono labels and readouts.** They render in the system sans through `--font-mono`'s
  fallback. Labels look like: `02 / 过境` · `过去 7 天` · `高度` · `偏离垂直` · `像素` · `最接近 · UTC` · `NORAD · 过境`.
- **Strings that scramble** on first appearance (`ScrambleOnce`): the landing kicker (`windowRange`), the HUD's sun
  readout (`太阳 19.5°S 048.2°E`) and object count (`16,917 个在轨物体`), the results header's coordinates, NORAD ids.
  Dates and coordinates inside them are digits and Latin. Their Han words settle at once instead of cycling through
  half-width Latin glyphs: that needs the one-condition change to `scrambleFrame` in Appendix B.

### 6.8 Line breaking

- Browsers keep 。，：）at line ends and （“ at line starts (kinsoku). Set `line-break: strict` on prose.
- A number and its measure word never split (U+00A0, §5.3). A Latin name never breaks mid-word.
- The results headline's bold phrase and the place accent are `white-space: nowrap`, and mono numbers with their unit
  are `nowrap` (otherwise `7.46 / km/s`).
- Headlines: `text-wrap: balance`, so no line ends with a single Han character. The hero and the About title are broken
  by hand.
- Never `word-break: keep-all` on Chinese: it stops Chinese from wrapping at all.
- The share PNG wraps Han itself (`src/ui/share/card.ts wrap()`: `Intl.Segmenter` words with kinsoku glue, a character
  at a time without Segmenter), so the saved PNG breaks where the DOM preview and satori do. Check the saved PNG before
  shipping (§9.2).

### 6.9 Type (measured in the CJK type study; zero cost)

The owner's rule for this work is that it must not cost more or slow anyone down. A Simplified Chinese web font is
5–20 MB (a useful subset is still 1–3 MB, and place names cannot be subset in advance). So the Han sans is always the
device's own, and the only Chinese bytes shipped are the hero and About accent glyphs, about 2 kB inside the zh-Hans
chunk the boot script already preloads.

**Font stacks** (`src/styles/scripts.css`, `:root:lang(zh-Hans)`)

- Sans (display, body, labels): `'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans SC', 'Noto Sans CJK SC', 'Source Han Sans SC', sans-serif`.
- Serif accent: the accent subset first (`'Watched Accent SC'`, Appendix B), then `'Songti SC', STSong, 'Noto Serif SC', 'Noto Serif CJK SC', 'Source Han Serif SC'`, then the **sans stack**. No SimSun (a thin 1990s screen Song that looks dated at 44–128 px) and no generic `serif`: where no good Chinese serif is installed (Windows, most Android phones), a Han place name falls to the sans, which still reads.
- **No faux italic.** The serif accent is italic for Latin; Han stays upright (`font-synthesis-style: none`, already set
  for `data-script='cjk'`). Weight synthesis stays on.

**Tokens** (`:root:lang(zh-Hans)`, the values measured for every CJK language)

| What | Latin (app) | zh-Hans | Token |
|---|---|---|---|
| Display size | `clamp(44px, 7.2vw, 128px)` | 0.8 × desktop, 0.9 × phone (≤ 760 px) | `--display-k: .8` / `.9` |
| Display weight | 560 | 600 (PingFang Semibold, YaHei Bold) | |
| Display leading | 0.92 | 1.10 | `--lh-k: 1.2` |
| Display tracking | −0.02em | −0.01em + `font-feature-settings: 'palt'` | `--track-display: -0.01em` |
| Results headline | 34 px, 540 / strong 560 | 27 px, 500 / strong 600, leading about 1.2 | `--fs-panel-h: 27px` |
| Second line | 22 px | 18 px, 500, leading 1.3 | `--fs-panel-sub: 18px` |
| Body | 15 px / 1.5 | 15 px / 1.75 | |
| Mono labels | 10.5 px (phone 11), +0.08em, 400 | 12 px desktop, 11 px phone, +0.10em, 500 | `--fs-label: 12px`, `--track-label: .1em` |
| Accent size | 1.08em (hero), 1.16em (headline) | 1.04em / 1.11em | `--accent-k: .96` |
| Hero accent | Instrument Serif italic | Noto Serif SC 500, upright, signal | the subset |
| Place accent | Instrument Serif italic | Latin: unchanged. Han: the platform serif at 500, else the sans | |

Latin and digits inside a display line stay Instrument at 75 % width. The share card renderers apply label tracking
themselves (`TRACK.label`): give them the same +0.10em for zh.

**Share cards** draw Han from a Noto Sans SC subset of the card's exact characters, fetched by the server per uncached
card (`api/_lib/fallbackFonts.ts`). With the Appendix B fixes that is one family, one weight (500), two requests: zh copy
adds nothing else. Keep card copy short, because every distinct character is part of that one subset request. On the
card the Han accent is sans, in signal: accepted.

**Formatting** comes from built-in `Intl` (numbers, plural rules, country names) and hand-built dates and lists (§5.4,
§5.5). zh needs no plural library: one form.

---

## 7. Length discipline

- **Characters:** zh is typically 35–50 % of the English character count.
- **Width:** Han is full-width and set at 12 px or more in labels, so on screen zh prose runs about **70 %** of the English
  width, and mono labels 70–100 %. Never assume a label will be shorter.
- **Budgets:** buttons and chips 2–4 Han (6 at most); mono labels 2–5 Han; hero lines ≤ 5 em; a results headline
  ≤ 30 Han plus the place; a sentence ≤ about 30 Han. The post's whole text is 256 X units (`POST_MAX`; `xLength`
  counts Han and full-width punctuation as 2, Latin as 1): keep its first paragraph under about 90 Han so the hook
  (26 units) and the credit (17) still fit. Over budget, the code drops the hook first, then cuts the lead.
- **Share card headline** (466 px column; Han and full-width punctuation 1 em, Latin and digits about 0.5 em, a space
  about 0.3 em; the size is chosen by width, Appendix B):

| Size | Lead (≤ 3 lines) | Place block (≤ 2 lines) |
|---|---|---|
| 84 px | ≤ 15 em | ≤ 10 em |
| 72 px | ≤ 18 em | ≤ 12 em |
| 62 px | ≤ 21 em | ≤ 14 em |
| 54 px | ≤ 24 em | ≤ 16 em |

  `有 7 颗卫星注视过` (≈ 8.6 em) fits at 84 px; `这一周，有 31 颗卫星注视过` (≈ 13 em) at 84 px;
  `这一周，我们追踪的卫星没有一颗注视过` (18 em) at 72 px.

Strategies: drop pronouns and articles; prefer established two-character words; noun + noun compounds without 的; verb
+ object of 2 + 2; no 请 / 您 / 进行; never shorten by cutting a word in half (延时摄影 → 延时 means "delay"); if a string
is over budget, rewrite it, never ellipsize it.

| English | zh-Hans | Han | Note |
|---|---|---|---|
| SURPRISE ME | 随机一处 | 4 | Not 给我惊喜 (calque), not 随便看看 ("just browsing"). |
| USE MY LOCATION | 使用当前位置 | 6 | Phones: 定位 (2). The narrowest chip "Near me": 我的位置. |
| HOW THIS WORKS (link) | 工作原理 | 4 | About title: 这一切 / 如何*运作*。 (§3.8). |
| LAST 7 DAYS | 过去 7 天 | 3 + digit | |
| CLOSEST LOOK | 最清晰画面 | 5 | Never 最近 (most recent). |
| LAST CLEAR LOOK | 最近一次无云画面 | 8 | Narrower than the English (≈ 8 em against ≈ 9). |
| TIME-LAPSE | 延时摄影 | 4 | Sub line: 这个地方，一年一帧. |
| OFF-NADIR | 偏离垂直 | 4 | |
| IN VIEW | 在可视范围内 | 6 | Geometry grid, two columns: fits. |
| PIXEL / ALTITUDE / PASSES | 像素 / 高度 / 过境 | 2 | `02 / 过境`. |
| NO MATCH | 没有结果 | 4 | |
| SHARE / REPLAY | 分享 / 回放 | 2 | "Replay this pass" 回放这次过境. |
| DOWNLOAD IMAGE | 下载图像 | 4 | Busy: 正在下载…. |
| COPY LINK | 复制链接 | 4 | Done: 已复制. |

---

## 8. Sensitive content

**Surveillance and privacy.** The product's "watched" is wry, never an accusation. Never 监视, 监控, 窥视, 偷拍, 盯上,
跟踪, 无处可逃, 小心, 警惕: they turn a quiet observation into alarm, read as political in the mainland, and claim what the
product denies (a 10 m pixel cannot show a person). The hero says 注视过, not 注视着, for the same reason (§3.1).
"Military and spy satellites" is 军用卫星和侦察卫星 (the neutral standard term), never 间谍卫星. Privacy statements are
translated exactly: never strengthen them (绝对安全, 百分百匿名), never add claims the English does not make (such as
compliance with 《个人信息保护法》). The locate note names what is kept, no more:
你的位置会发送给 Photon 地理编码服务，用来识别地名。我们只保存你所在的约 10 km 网格单元。

**War zones in the time-lapse** (Gaza Strip, West Bank, Ukraine, Lebanon). The UI only says which season every frame is
from: `12 帧无云画面 · 每年秋季一帧`. Never add 战争、战火、冲突、轰炸、废墟、被摧毁 or any word on why that season was chosen;
the pictures speak. If a region name is shown, use the standard mainland names: 加沙地带, 约旦河西岸, 乌克兰, 黎巴嫩. City
names come from the gazetteer and are not translated; in static copy use Xinhua forms: 基辅 (the Han form is the same for
Kyiv and Kiev, so no political choice arises), 哈尔科夫, 敖德萨, 顿涅茨克, 巴赫穆特, 马里乌波尔, 贝鲁特. 克里米亚 takes no
sovereignty qualifier in copy.

**Glaciers.** 冰川; "end of the melt season" 消融季末. Factual only: never 触目惊心, 末日, 正在消失. Season captions:
每年冬季一帧 · 每年春季一帧 · 每年夏季一帧 · 每年秋季一帧.

**Country and region names** come from `Intl.DisplayNames('zh-Hans', { type: 'region' })` and are never overridden by
hand, with **one exception**: PS. CLDR's long name, 巴勒斯坦领土, is not mainland usage (China recognises the State of
Palestine; Xinhua writes 巴勒斯坦). Take CLDR's own short form instead,
`new Intl.DisplayNames('zh-Hans', { type: 'region', style: 'short' }).of('PS')` → 巴勒斯坦: still CLDR data, not a
hand-written name. Everything else stays long: 台湾, 中国香港特别行政区, 中国澳门特别行政区. Never write 台湾国, 中华民国 or
福尔摩沙. A list or label that can include them says 国家或地区, never 国家. Gazetteer names (disputed islands, borders and
features included) are shown as they come and never "corrected" in copy. Never add a disputed place as a zh example
chip.

**Curated places.** The full table is §4.3. Mount Everest's sublabel is 中国和尼泊尔边境 (mainland convention, accurate:
it sits on the border); Hong Kong's is 中国香港维多利亚港, unremarkable in Singapore and Malaysia too.

**Satellites from China.** Runtime names stay as the catalog spells them (`FENGYUN 4B`, `GAOFEN 7`, `JILIN-1 03`). A
satellite's blurb (static, under its name) may give a Chinese programme's official name once, in a plain sentence, with
no editorial: 风云四号 B 星：中国在业务运行的静止气象卫星，每 15 分钟获取一张全圆盘图像。 · 吉林一号商业星座的一员，搭载
亚米级成像仪。 · 中国空间站，以 2021 年发射的天和核心舱为基础建成。 Never in a sentence frame, a label or a headline. Do not
editorialise any country's satellites.

---

## 9. Pitfalls and the reviewer's checklist

### 9.1 False friends and traps

| Word | Trap | Use |
|---|---|---|
| watched | 看过 (visited someone, seen a film), 观看 (watch TV), 监视 (surveillance), 注视着 (is watching) | 注视过 |
| pass | 通过 (approve, pass an exam), 票 / 通行证 (a pass), 关 (a game level) | 过境 |
| Show 40 more | 再显示 40 次 = show it again 40 times | 再显示 40 条 |
| Could have pointed here | 本可 = could have, but didn't | 能对准这里 |
| archive | 档案 = a personnel dossier (人事档案) | 图像库 |
| scene | 场景 (film or 3D scene), 景 (jargon) | 整幅画面 · 图像 |
| closest look | 最近 = most recent | 最清晰画面 |
| clear | 清晰 = sharp; 晴 = a forecast word | 无云 |
| in view | 视野 = instantaneous field of view | 在可视范围内 |
| plan view, under the note | 以下 = below (nothing is there); 平面图 = a floor plan | 上图是…示意图 |
| your spot | 这个点 = also "at this hour" | 此处 · 这里 |
| mosaic | 马赛克 = censorship pixelation | 拼接图 |
| time-lapse | 延时 = delay | 延时摄影 |
| replay | 重播 = TV rerun | 回放 |
| operator | 操作员 = a person at a machine | 运营方 |
| public archive | 公共 = public utility | 公开图像库 |
| track (verb) | 跟踪 = stalk | 追踪 |
| photo | radar is not a photo | 照片 only for optical; else 图像 |
| radar imaged | 拍下 = photographed | 成像 |
| did it? | 这样做 = calque of "do so" | 是否真的注视过 / 对准过 |
| commercial | 商用 = for business use | 商业 |
| altitude | 海拔 = height of the ground above sea level | 高度 |
| this week | 本周 = retail, admin | 这一周 |
| local time | 当地时间 before a zoned clock = false at sea | [SAT] 于 16:14:21 UTC |
| Golden Gate | 金门 = Kinmen island | 金门大桥 |
| crop circles (Garden City) | 麦田怪圈 = UFO hoaxes | 圆形灌溉农田 |

**Translated names that must stay Latin.** Chinese media say 哨兵-2 (Sentinel-2), 陆地卫星 9 号 (Landsat 9), 葵花
(Himawari), 欧洲气象卫星 (Meteosat), 微软行星计算机 (Planetary Computer). This product never does: satellite, sensor,
programme and service names are inserted at runtime and must match the static copy. NASA and NOAA stay Latin
everywhere; ESA, USGS, JMA and EUMETSAT take their Chinese names in prose only (§4.1). Licence attribution lines
("Contains modified Copernicus Sentinel data 2026", "Landsat imagery courtesy of the U.S. Geological Survey and NASA")
stay **in English, verbatim**; only their row labels are translated. The one Chinese-name exception is a Chinese
programme in a blurb (§8).

**Wrong measure words.** ✗ 256 个卫星 → 256 颗卫星 · ✗ 31 个图像 → 31 张图像 · ✗ 31 个过境 → 31 次过境 · ✗ 再显示 40 次 →
再显示 40 条 · ✗ 41 个小时前 → 41 小时前.

### 9.2 Reviewer's checklist (run it on every string)

1. 你, never 您 or 你们. No 请 in buttons or labels; 请 only in the two outside-the-app sentences (§1.1). No 抱歉 /
   对不起 anywhere.
2. "watched" is 注视过 (注视了 only with a named moment), never 注视着, 监视, 看过, 拍摄.
3. Every term matches §4: 过境, 图像 / 照片, 图像库, 这一周, 无云, 成像带, 可视范围, 拼接图, 延时摄影, 回放, 条 for rows.
4. Verdicts: 注视过 · 很可能注视过 · 能对准这里 · 从上空经过; lanes 图像 · 很可能 · 可对准 · 过顶.
5. Satellite, sensor, agency and service names untouched (§4.1 for the four agencies in prose); licence credits in
   English.
6. Measure words: 颗 satellites, 张 images, 次 passes and times, 条 rows and orbits, 帧 frames.
7. One plural form; zero cases are their own sentences; never "0 颗".
8. Digits for every count and measurement; Han numerals only in fixed words; U+00A0 between a number and its measure
   word.
9. Full-width punctuation in sentences; no `!`; no ——; quotes are “”; ellipsis is a single `…`.
10. Spacing: one space between Han and Latin or digits; none beside full-width punctuation; none in or beside a Han date
    token; [PLACE] and [SAT] spaced only through `cjkGap`.
11. Units: `km`, `m`, `km/s` with a space; `%` and `°` attached; time units in Han.
12. Dates and times hand-built (§5.5); 24-hour; ISO in the kicker and the card stamps; no 当地时间 before a zoned clock.
13. Whole sentences: no message is a fragment that code glues to another (§3.5).
14. Slots: no suffix, article or quotes around [PLACE]; 它 or nothing for [SAT]; lists use 、 and 和.
15. Clauses ≤ about 12 Han, sentences ≤ about 30, at most two 的 per clause, no 进行, no 这样做; 被 only where Chinese
    itself uses it for something that befell the subject (被云遮住、被丢弃).
16. No sentence-final particles, no exclamations, no marketing words, no named emotions (竟然、偷偷、神秘).
17. Length budget met (§7), card leads included; nothing cut mid-word.
18. Honest labelling: the label says exactly what is on screen (图像 vs 照片, 像素 vs 分辨率, 无云 vs 清晰, 至少 when
    partial, 上图 for the drawing above).
19. Sensitive wording (§8): no surveillance vocabulary, no war commentary, Intl region names untouched except PS,
    国家或地区.
20. Read the string aloud in its slot with an English label for a Chinese city (Beijing), a Latin place (Waterloo), a
    Han place (北京), a long cut place (a 48-character name ending in `…`), and a Han satellite (一颗卫星): it must be
    grammatical and natural in all of them.
21. On screen: check the zero-satellite summary card, and the **saved PNG**, not only the DOM preview.

---

## Appendix A: reference translations of the core strings

**Landing**

| English | zh-Hans |
|---|---|
| Something / watched you / this week. | 这一周 / 有东西 / 注视过*你*。 |
| Enter any place on Earth. See every satellite… | 输入地球上的任何地方。你会看到过去 7 天里飞过那里的每一颗卫星，以及它们拍下的真实图像。 |
| LAST 7 DAYS · 12 → 19 NOV 2026 UTC | 过去 7 天 · 2026-11-12 → 11-19 UTC |
| 01 / PLACE · Search a place | 01 / 地点 · 搜索地点 |
| Name, address or lat, lon | 地名、地址或经纬度 |
| Searching · 3 matches · No match · Search unavailable | 正在搜索 · 3 个结果 · 没有结果 · 搜索不可用 |
| Nothing matches "xyz". Try a city, a landmark, or coordinates. | 没有与“xyz”匹配的结果。可以试试城市、地标或坐标。 |
| 02 / OR TRY · Or click the globe to drop a pin | 02 / 或者试试 · 也可以点击地球放置标记 |
| Use my location · Locate me · Near me · Locating… | 使用当前位置 · 定位 · 我的位置 · 正在定位… |
| Requesting position · Naming the place · 04 S | 正在请求位置 · 正在识别地名 · 04 秒 |
| Your position goes to the Photon geocoder to name the place. We store only a ~10 km cell. | 你的位置会发送给 Photon 地理编码服务，用来识别地名。我们只保存你所在的约 10 km 网格单元。 |
| Location access is blocked. Allow it in your browser settings, or search for a place. | 位置权限被阻止了。请在浏览器设置里允许，或者直接搜索地点。 |
| Your position isn't available right now. Search for a place instead. | 暂时无法获取你的位置。你可以直接搜索地点。 |
| Finding your position took too long. Try again, or search for a place. | 获取位置用时太长。再试一次，或者直接搜索地点。 |
| Location needs a secure (https) connection. Search for a place instead. | 定位需要安全的 https 连接。你可以直接搜索地点。 |
| The place search isn't answering. Coordinates such as 43.47, −80.54 still work. | 地点搜索没有响应。坐标仍然可用，例如 43.47, −80.54。 |
| Surprise me · Drop a pin · Cancel | 随机一处 · 放置标记 · 取消 |
| Built by @armaangupt0 | 由 @armaangupt0 制作 |
| Open source / Open source: the code on GitHub | 开源 / 开源：GitHub 上的源代码 |
| How this works | 工作原理 |
| Slow connection, still loading | 网络较慢，仍在加载 |
| 3D view unavailable · WebGL 2 is off in this browser | 3D 视图不可用 · 此浏览器未开启 WebGL 2 |
| Could not load the orbit catalog. Check your connection and try again. | 无法加载轨道目录。请检查网络连接后再试一次。 |

**Computing and app chrome**

| English | zh-Hans |
|---|---|
| LOADING ORBITAL CATALOG · CATALOG · 16,917 OBJECTS | 正在加载轨道目录 · 目录 · 16,917 个在轨物体 |
| PROPAGATING 412 ORBITS · 7 DAYS · PROPAGATING ORBITS · 120 / 412 | 推算 412 条轨道 · 7 天 · 正在推算轨道 · 120 / 412 |
| SEARCHING SENTINEL-2 + LANDSAT ARCHIVES | 正在检索 Sentinel-2 + Landsat 图像库 |
| MATCHING 12 SCENES TO 31 PASSES | 匹配 12 张图像与 31 次过境 |
| VERIFYING NASA WEATHER MOSAICS · 3 / 35 | 正在核对 NASA 气象拼接图 · 3 / 35 |
| 31 PASSES · 12 IMAGES | 31 次过境 · 12 张图像 |
| Fault · Something went wrong. · Trying… · Back | 故障 · 出了点问题。 · 正在重试… · 返回 |
| Something went wrong computing passes for this place. Try again in a moment. | 计算这个地方的过境时出了问题。稍后再试一次。 |
| HUD: 16,893 OBJECTS · CELESTRAK GP · TLE EPOCH · SUN 12.4°S 118.2°E | 16,893 个在轨物体 · CELESTRAK GP · TLE 历元 · 太阳 12.4°S 118.2°E |
| HUD: Fetched 2026-11-08 03:34Z · 4 h ago · Stale, 3 D ago · Catalog unavailable | 获取于 2026-11-08 03:34Z · 4 小时前 · 已过时，3 天前 · 目录不可用 |

**Results**

| English | zh-Hans |
|---|---|
| New search · Change · Recent · All passes | 重新搜索 · 更换 · 最近搜索 · 全部过境 |
| The sun never rose, so no daylight camera could see it. | 太阳一直没有升起，白天工作的相机都看不到这里。 |
| Weather satellites still swept it in infrared, 42 times. | 气象卫星仍用红外扫过这里 42 次。 |
| Sentinel-2 or Landsat crossed it 3 times in daylight, but no scene has been published yet. | Sentinel-2 或 Landsat 白天经过这里 3 次，但还没有公开任何图像。 |
| No open imaging satellite crossed it in daylight. | 白天没有开放数据的成像卫星经过这里。 |
| 12 detailed images (Sentinel-2, Landsat, 10–30 m) · 3 daily weather mosaics (250–375 m) · 2 radar images (Sentinel-1, 20 m) · 1,008 full-disc images from geostationary weather satellites (2–5 km; the newest of each is shown). 1,204 passes from 412 imaging and crewed satellites checked. | 12 张精细图像（Sentinel-2、Landsat，10–30 m）· 3 张每日气象拼接图（250–375 m）· 2 张雷达图像（Sentinel-1，20 m）· 1,008 张静止气象卫星全圆盘图像（2–5 km；每颗只显示最新一张）。已核查 412 颗成像卫星和载人航天器的 1,204 次过境。 |
| Photos · All · Detailed · Weather · Radar | 图像 · 全部 · 精细 · 气象 · 雷达 |
| Closest look · Last clear look · Clouded over · Daily mosaic | 最清晰画面 · 最近一次无云画面 · 云层遮挡 · 每日拼接图 |
| This week's passes saw mostly cloud · Here's the last clear look | 这一周的过境大多只看到了云 · 这是最近一次无云画面 |
| Clear at your spot · Thin cirrus · Cloud shadow · Cloud at your spot | 此处无云 · 薄卷云 · 云影 · 此处有云 |
| Reading the pixel at your spot… · Clear over your spot. · Thin cirrus flagged over your spot; it may soften the picture. · Cloud over your spot. · Your spot was in cloud shadow. | 正在读取此处的像素… · 此处上空无云。 · 此处上空有薄卷云，画面可能略显模糊。 · 此处有云。 · 此处当时在云影里。 |
| Time-lapse · This place, year by year | 延时摄影 · 这个地方，一年一帧 |
| Replay · View · Share | 回放 · 查看 · 分享 |
| Acquiring · ACQUIRED 11:21:21 EST · 10 m | 获取中 · 已获取 11:21:21 EST · 10 m |
| Show all 31 passes · Show all 12 rows · Show 40 more · 40 left · Show fewer | 显示全部 31 次过境 · 显示全部 12 条 · 再显示 40 条 · 还有 40 条 · 收起 |
| closest look, then newest | 最清晰画面在前，其余由新到旧 |
| Latest · Closest · 8.9° off-nadir · cloud 25% · 31 sats | 最新 · 最接近 · 偏离垂直 8.9° · 云量 25% · 31 颗 |
| Shared with you · Sentinel-2C watched Waterloo | 有人分享给你 · Sentinel-2C 注视过 Waterloo |
| Something watched you this week too. (invite) | 这一周，也有东西注视过你。 |
| Photo 3 of 12, closest look | 第 3 张，共 12 张，最清晰画面 |
| Pan-sharpened with Landsat's 15 m band | 用 Landsat 的 15 m 全色波段锐化 |
| Line 0412 → 1024 · Awaiting pass · Awaiting scan · N | 扫描行 0412 → 1024 · 等待过境 · 等待扫描 · N |
| Still rendering. Large scenes can take 10 s or more. | 仍在生成。大幅图像可能需要 10 秒或更久。 |

**Pass detail readouts**

| English | zh-Hans |
|---|---|
| Altitude · Off-nadir · Pixel · Cloud (scene) · Cloud at spot | 高度 · 偏离垂直 · 像素 · 云量（整幅） · 此处云况 |
| Clear · Cirrus · Cloud · Shadow (spot values) | 无云 · 薄卷云 · 有云 · 云影 |
| Closest · UTC / Closest · local | 最接近 · UTC / 最接近 · 当地 |
| Ground distance · Elevation from you · Ground speed · Heading (Asc / Desc) | 地面距离 · 此处仰角 · 地面速度 · 航向（升轨 / 降轨） |
| Sun elevation (Day / Twilight / Night) | 太阳高度角（白天 / 晨昏 / 夜间） |
| Field of regard · Swath · In swath · In view · Window | 可视范围 · 幅宽 · 在成像带内 · 在可视范围内 · 时间窗 |
| Band: Infrared / Visible / Colour | 波段：红外 / 可见光 / 彩色 |
| Scan line here · UTC · Above the equator at · In your sky · Scan direction (North → south) | 扫描线到达 · UTC · 定点经度 · 你的天空 · 扫描方向（北 → 南） |
| Line speed here · Coverage: Full disc, every 10 min · This scan | 扫描线速度 · 覆盖：全圆盘，每 10 分钟 · 本次扫描 |
| NORAD · pass / NORAD · scan | NORAD · 过境 / NORAD · 扫描 |
| Download image · Downloading… · Open image to save it · View source · Planetary Computer | 下载图像 · 正在下载… · 打开图像后保存 · 查看来源 · Planetary Computer |
| Globe callout: IMAGED 11:21:13 EST · ACQUISITION · SENTINEL-2C · ACQUIRED · CLOSEST APPROACH | 成像 11:21:13 EST · 成像 · Sentinel-2C · 已获取 · 最接近 |
| Pin: Naming this spot · No named place nearby · Hold the globe anywhere to move it | 正在识别地名 · 附近没有地名 · 按住地球任意处即可移动 |

**Share sheet**

| English | zh-Hans |
|---|---|
| Share this pass · Share this image · Share this week | 分享这次过境 · 分享这张图像 · 分享这一周 |
| Share · Share image · Preparing image… · Save PNG · Try again | 分享 · 分享图像 · 正在准备图像… · 保存 PNG · 重试 |
| Copy link · Copy image · Copied · Link · Post | 复制链接 · 复制图像 · 已复制 · 链接 · 配文 |
| Creating link… · Made when you share | 正在生成链接… · 分享时生成 |
| Direct link: the short link could not be made right now | 直接链接：暂时无法生成短链接 |
| The card could not be rendered here; the link still works. | 这里无法生成卡片；链接仍然有效。 |

**Time-lapse**

| English | zh-Hans |
|---|---|
| Time-lapse of Waterloo | Waterloo 的延时摄影 |
| One clear look a year · since 2015 | 一年一帧无云画面 · 自2015年起 |
| 12 clear looks · one a year / one each autumn | 12 帧无云画面 · 一年一帧 / 每年秋季一帧 |
| Listing the archive · Choosing clear looks · Developing frames | 正在检索图像库 · 正在挑选无云画面 · 正在显影 |
| Too cloudy here for a time-lapse. · 2 clear looks since 2015 · 3 needed | 这里云太多，做不成延时摄影。 · 自2015年起只有 2 帧无云画面 · 至少需要 3 帧 |
| The archive did not answer. · Planetary Computer could not be reached | 图像库没有响应。 · 无法连接 Planetary Computer |
| No time-lapse for this place | 这个地方没有延时摄影 |
| Each frame is the same 10 km square, taken by Sentinel-2 and toned like every photo here. Each year aims for a different season; a year with no clear look is left out. | 每一帧都是同一块 10 km 见方的区域，由 Sentinel-2 拍摄，和这里的每张照片一样经过调色。每年取一个不同的季节；某一年如果没有无云画面，就略过这一年。 |
| Frame 3 of 12 · Play · Pause | 第 3 帧，共 12 帧 · 播放 · 暂停 |
| Video · Rendering 42% · Save video · Video failed · Link copied | 视频 · 生成中 42% · 保存视频 · 视频生成失败 · 链接已复制 |
| This browser has no H.264 encoder: the file plays in Chrome and Firefox | 此浏览器没有 H.264 编码器：文件只能在 Chrome 和 Firefox 中播放 |

**About**: §3.8.

---

## Appendix B: engineering notes (cost and speed)

zh-Hans adds no cost and no load time. Every decision above is static copy, a small table in the zh-Hans chunk, or a
few lines of shared code that leave English output byte-identical. Nothing is translated at runtime, no service is
called, nothing new is stored, and an English visitor downloads exactly what they did before. These are the
preconditions for listing zh-Hans:

1. **Card headline size by width** (`api/_lib/cardSpec.ts headlineSize`). It counts characters today
   (`lead.length ≤ 24 → 84 px`), tuned for condensed Latin. Measure em-width instead (Han and full-width punctuation 1,
   Latin and digits about 0.5, a space about 0.3) and pick the largest size where the lead takes ≤ 3 lines and the
   place block ≤ 2 (§7). The canvas, satori and DOM renderers already share the function. English sizes do not change
   as long as the Latin weights reproduce today's thresholds (check with the card tests).
2. **satori fetches one Han family, not four.** For a Han run, satori's script detection lists
   `ja-JP`, `zh-CN`, `zh-TW`, `zh-HK` (Japanese first) and moves the element's `lang` to the front; `fallbackFonts.ts load()`
   then fetches every family in that list, one after another: 8 sequential requests, 4 s timeout each, on every uncached
   card, because the cache is keyed by the card's text. With a zh UI that is every zh card: billed function time and a
   real risk that a crawler times out and shows no image, and JP glyph forms (直, 角, 骨) beside SC ones. Fix: put
   `lang="zh-CN"` on the card's root element for zh-Hans (`zh-TW` / `zh-HK` for zh-Hant), and make `load()` fetch only the
   first family when the code names several Han locales. English cards with a Han place name fall from 8 requests to 2
   as well. Ask Google Fonts for one weight, `:wght@500`, so the headline Han is not a thin 400 beside semibold Latin:
   still one stylesheet and one font file.
3. **`cjkGap(before, after)`** in `api/_lib/i18n/parts.ts`: `' '` when one side's edge character is Han (or kana) and
   the other's is a letter, digit or symbol of a script written with spaces; `''` when either edge is a space, Han, kana
   or full-width punctuation. Pure, a few lines, used only by the Chinese (and if wanted Japanese) catalogs at [PLACE]
   and [SAT] boundaries.
4. **`fmt('zh-Hans').list`** (`api/_lib/i18n/format.ts`): join with 、 and the last item with 和, spaced through
   `cjkGap`, instead of `Intl.ListFormat` (which writes `Capella和`). English keeps its en-GB list.
5. **`scrambleFrame`** (`src/ui/system/motion.tsx`): leave Han, kana, Hangul and full-width punctuation as they are, as it
   already leaves spaces; only Latin letters, digits and symbols scramble. One condition; English strings contain none
   of these characters, so English is unchanged.
6. **The accent subset.** Noto Serif SC (OFL) at 500, glyphs 你 运 作, no hinting, no layout features: about 2 kB of
   WOFF2 (你 alone measured 800 B). Embed it as a `data:` URI in the zh-Hans chunk and register it with `FontFace` as
   `'Watched Accent SC'` (`unicode-range: U+4F60, U+8FD0, U+4F5C`) before the first render, which already waits for the
   chunk (`startLocale`). No request, no swap, no `font-display` race on a cold cache; only zh-Hans visitors carry the
   bytes. Its OFL notice goes with the other font notices.
7. **The serif stack** for zh-Hans ends with the sans stack: drop SimSun and the generic `serif` (§6.9).
8. **The punctuation face**, zero bytes: Instrument Sans is first in `--font-sans` and has “ ” ‘ ’ …, so Chinese quotes
   and the ellipsis would come out narrow and on the baseline. Under `:root:lang(zh-Hans)`, put first in the sans stack:
   ```css
   @font-face {
     font-family: 'CJK Punct SC';
     src: local('PingFang SC Regular'), local('PingFangSC-Regular'), local('Microsoft YaHei'),
       local('Noto Sans CJK SC'), local('NotoSansCJKsc-Regular'), local('Noto Sans SC');
     unicode-range: U+2018-2019, U+201C-201D, U+2026;
   }
   ```
   Not U+00B7: the mono separator · stays Martian Mono. Check the `local()` names on macOS, Windows and Android.
9. **Tokens** under `:root:lang(zh-Hans)` (or shared under `data-script='cjk'`): the §6.9 table. The card renderers'
   label tracking for zh: +0.10em.
10. **PS** in `countryName` (`src/imagery/localPlaces.ts`) for zh-Hans: CLDR's short form (§8). One line.
11. **Dates** are hand-built in the zh-Hans `time` namespace and card catalog (§5.5). The card catalog reads the place's
    local year, month and day with `dateFormat(…).formatToParts` and writes ISO.
12. **Share cards** are drawn in the sharer's language (`l=zh-Hans` in the link or the stored share), never negotiated
    from the viewer's `Accept-Language`: one cache entry per link, the CDN cache is not split, no card is rendered twice.
    The root link's preview stays English (`index.html`'s og tags, `og-default.png`).
13. **Han-typed searches miss the offline place list** (the owner's call, not a precondition). `placeKey` / `shardOf`
    file places under two Latin letters, so 北京 or 东京 finds no offline file: every Han-typed search goes to Open-Meteo
    (free tier about 10,000 requests a day) and then Photon, slower than an English search, which needs the network about
    2 % of the time, and the label still comes back in English. The cheap fix, at the next places rebuild (each adds about
    10 MB to git history): Chinese aliases for the largest cities and the curated landmarks in `scripts/landmarks.ts`, the
    one small file every search already reads, and a lookup of that file for a Han query. Nothing new at runtime; zh
    searches stay offline and fast, and the shared quota is spared.

---

## Decisions log

The critique's 50 items: 40 accepted, 9 partly accepted, 1 rejected.

| # | Item | Resolution |
|---|---|---|
| 1 | 再显示 40 次 mistranslates "Show 40 more" | Accepted: 再显示 40 条 / 还有 40 条 / 显示全部 12 条 / 显示全部 31 颗卫星 / 收起; 条 added to §5.3. |
| 2 | 本可对准这里 claims it did not look | Accepted: 能对准这里, lane 可对准; definition rebuilt with the place as topic and 不公开 (§3.7). |
| 3 | 以下是…平面图 points the wrong way | Accepted: 上图 for all `noImage` notes; also 平面图 → 示意图 (a drawing, not an image) (§3.5). |
| 4 | 从可视范围内经过 is muddled; 视野 over-claims | Accepted: 经过…，这里在它的可视范围内; `In view` 在可视范围内; 视野 banned (§3.5, §4.1). |
| 5 | 当地时间 before a zoned [TIME] | Accepted: never before a zoned clock; only where the English says "local" with no zone (§3.5, §3.6). |
| 6 | Likely definition presumes a picture; 固定相机 | Accepted: 这里在一台固定朝下的相机的成像带内。没有公开的画面。 (§3.7). |
| 7 | Radar 拍下; 夜里 for "dark" | Accepted: 为 Waterloo 成像, 天已经黑了; likely uses 记录下了这里 (§3.5). |
| 8 | Privacy "~10 km cell" | Partly accepted: the cell is named (网格单元), but not 见方, which asserts a square the code does not promise (§8). |
| 9 | Hero aspect 注视着 | Accepted: 注视过 in the hero and everywhere; alignment with zh-Hant left as an open question (§3.1). |
| 10 | About title 工作 / *原理*。 | Partly accepted: diagnosis and accent on the verb accepted; the critique's alternate 这一切 / 如何*运作*。 chosen, matching zh-Hant (§3.8). |
| 11 | 档案库 has dossier connotations | Accepted: 图像库 everywhere (§0, §4.1). |
| 12 | Card headlines must end on the place | Accepted: lead / accent block table, 经过时能对准, 飞越 (§3.6). |
| 13 | Summary card blocks | Accepted: 这一周 leads the lead block; accent `[PLACE]。` (§3.6). |
| 14 | Sub line 38 Han | Accepted: 飞过那里 (§3.2). |
| 15 | About lede 它 for a place | Accepted: 从那里上空飞过 (§3.8). |
| 16 | 看看 vs the bare 看 rule | Accepted: §3.2 reworded; footer becomes 看看是什么注视过你 (是 added for clarity). |
| 17 | 上次清晰画面 | Partly accepted: 最近一次 adopted, but 无云 instead of 清晰, which means "sharp": 最近一次无云画面 (§4.1). |
| 18 | 这个点 for "your spot" | Accepted: 此处 in labels and chips, 这里 / 这个位置 in prose (§4.1, Appendix A). |
| 19 | Lane 上空 | Accepted: 过顶; overhead definition rewritten (§3.7). |
| 20 | 整面地球; overhead night line | Accepted: 整个地球圆盘; 以一个明亮、不闪烁的光点划过你的天空 (§3.5). |
| 21 | Offset with no reference point | Accepted: 在这里以西 61 km 处, 西南方向 for diagonals (§3.5, §4.2). |
| 22 | Off-nadir prose; 侧视角 option | Partly accepted: prose 偏离垂直方向; the label stays 偏离垂直 (plain for lay readers, fits the strip); 侧视角 rejected (jargon, and 侧视 is radar's side-looking) (§4.1). |
| 23 | Small appendix items | Accepted: 没有结果, 有人分享给你, 你可以直接搜索地点, 我们展示的就是真实的图像, 51区 (§3.7, §4). |
| 24 | Han never wraps on the share PNG | Rejected: out of date. `wrap()` in the working tree already splits Han with `Intl.Segmenter` and kinsoku glue (a character at a time without it); kept as a saved-PNG check (§6.8, §9.2). |
| 25 | Card sizing counts characters | Accepted: em-width sizing and per-size budgets (§7, Appendix B.1). |
| 26 | Four Noto families fetched in series | Partly accepted: `lang="zh-CN"` and one family adopted; one weight (500) instead of 400 + 600, so the fetch stays one font file (Appendix B.2). |
| 27 | Intl zh dates do not match the guide | Accepted (verified: `11/1周日`, `11/1 – 11/8`, `12分钟前`, `Capella和`): hand-built functions for every message (§5.5), hand-built list (§5.4). |
| 28 | Fragments assembled by code | Accepted: §3.5 rewritten as whole sentences, every case. |
| 29 | Spacing around [PLACE] has no mechanism | Partly accepted: `cjkGap` in `parts.ts`, but called by the catalog messages at slot edges (they hold the slot values), so no renderer changes; also covers [SAT]; literal spaces only, no `text-autospace` (§5.1, Appendix B.3). |
| 30 | Number + measure-word no-break | Accepted: catalogs write U+00A0 (§5.3). |
| 31 | Serif accent varies by device | Partly accepted: micro-subset (你 运 作) and dropping SimSun adopted, with the type study's spec (Noto Serif SC 500); delivered as a `data:` URI in the zh chunk instead of preload + `font-display: optional`, which would show the sans on a cold first visit (§6.9, Appendix B.6). |
| 32 | Token values | Partly accepted: tokens specified, but with the CJK type study's measured values (`--lh-k 1.2`, `--display-k .8 / .9`, `--accent-k .96`, −0.01em + palt, labels 12 px +0.10em 500), not the critique's estimates (§6.9). |
| 33 | "No Han in mono" contradicts the examples | Accepted: Han allowed in mono labels; dates in scrambled strings and card stamps are ISO; card stamp `2026-11-01 · 11:21 EST`, `截至 2026-11-01 的 7 天`; plus the `scrambleFrame` fix (§6.4, §6.7). |
| 34 | One spacing rule for dates | Accepted: Han date tokens touch Han (自2015年起, 10月29日至11月5日); counts are spaced; plus a mono-row label rule (§6.2). |
| 35 | Quotes and ellipsis in the Latin font | Accepted: the `local()` punctuation face, with full and PostScript names (Appendix B.8). |
| 36 | Hero comma does not hang | Accepted: no comma in the display lines; the plain text keeps it (§3.1). |
| 37 | CLDR 巴勒斯坦领土 | Accepted: PS takes CLDR's short form 巴勒斯坦, the one exception (§8, Appendix B.10). |
| 38 | Static Chinese names vs "never translate" | Accepted: runtime names as catalogued; a blurb may give a Chinese programme's official name once (§8). |
| 39 | Agency names in prose | Partly accepted: ESA, USGS, JMA, EUMETSAT take Chinese names in prose only; NOAA stays Latin with NASA (its Chinese name is 13 Han), and labels, links and credits stay Latin (§4.1). |
| 40 | Other terms | Accepted: 在轨物体, 私营公司, 静止轨道, 全色 / 多光谱 / 波段, 成像 for IMAGED and ACQUISITION, 最接近 · [SAT] (§4.1). |
| 41 | Curated places need a full table | Accepted: all 57 places with chips and sublabels; the crop-circle, crater, Everest and Hong Kong traps, plus the Golden Gate / Kinmen trap (§4.3). |
| 42 | 请 in error notices | Accepted: 请 once, only when the reader must act outside the app; the two strings listed (§1.1). |
| 43 | Han searches miss the offline list | Accepted as a documented risk: frames tested with English labels; the alias fix is the owner's call (§5.1, Appendix B.13). |
| 44 | Whole sentences for every results case | Accepted: all cases in §3.5, including `noImage`. |
| 45 | Computing rows | Accepted, with 匹配 12 张图像与 31 次过境 (verb first, like the other rows) (Appendix A). |
| 46 | App chrome | Accepted (Appendix A, §5.5). |
| 47 | Gallery, lightbox, pin, time-lapse strings | Accepted, except `latest` / `closest`, which keep their trailing space as the mono-row label rule wants (§6.2, Appendix A). |
| 48 | Share page and link previews | Accepted with 是什么 (这一周，是什么注视过 Waterloo？); `via @armaangupt0` kept unchanged (§3.6). |
| 49 | Unknown satellite | Accepted: 一颗卫星 (§3.6, §5.2). |
| 50 | Test checklist additions | Accepted: English label for a Chinese city, 48-character cut place, zero-satellite summary card, the saved PNG (§9.2). |

Other changes made while finalising (not in the critique):

- **很可能注视过 / 很可能** for "likely": 可能 alone means "possibly" and understates the verdict (§3.7).
- **无云 for "clear look"** across the gallery and time-lapse; 清晰 kept only for 最清晰画面 (§4.1).
- **有** on the pass card's lead (有 7 颗卫星注视过), as in the results headline (§3.6).
- **我们的盲区** for the About heading "What we can't see" (§3.8).
- **这样做** banned as a calque in the could sentences and About (§2.3).
- The **older-window headline** drops 期间 (10月29日至11月5日，有…) for length (§3.3).
