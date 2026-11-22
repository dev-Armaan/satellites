# Watched: zh-Hant localisation style guide

Final. Traditional Chinese for Hong Kong (about 2.6x the traffic, about 72% of this audience) and Taiwan, as ONE
catalog (`zh-Hant`) plus a small Hong Kong overlay (`zh-Hant-HK`, §1.4) that ships with v1. Written standard Chinese
(書面語) throughout: never written Cantonese, never Taiwanese colloquial particles, never mainland vocabulary. This guide
binds every `zh-Hant` string the product shows, speaks or sends: the app, the share cards and pages, the post text, alt
text, aria labels, the video, About and the loading screen.

Written against `docs/DESIGN.md` §3 and §7, `docs/I18N.md`, `docs/i18n/TRANSLATING.md`, `src/ui/results/lib/copy.ts`,
`src/ui/results/lib/meta.ts`, `api/_lib/i18n/card/en.ts`, `api/_lib/cardSpec.ts`, the English namespaces in
`src/i18n/en/`, `src/styles/scripts.css`, and the CJK type study (2026-11, measured specimens). Intl behaviour quoted here
was run on Node 22.23 (its ICU) for `zh-Hant`, `zh-Hant-TW` and `zh-Hant-HK`. Where this guide and a translator's habit
disagree, this guide wins. Where this guide and the English disagree on a fact, the English wins, this guide is wrong,
and someone should report it.

The owner's rule for all of this: it must not cost more money and must stay fast. Every decision below is static copy, a
small table inside the zh-Hant chunk, or a few lines of shared code that leave English byte-identical. Appendix B lists
the code preconditions; none adds a request, a service or a stored byte.

Notation. `[PLACE]` a place name from the gazetteer, `[SAT]` a satellite name, `[NUM]` a count (a mono span), `[TIME]` a
24-hour clock with its zone (`16:14:21 UTC`, `11:21 EST`), `[CLOCK]` a clock alone (`11:21`), `[DAY]` a day built by
§5.5, `[ALT]` / `[DIST]` / `[SWATH]` a distance with its unit, `[SPEED]` a speed with its unit, `[DEG]` an angle, `[PCT]` a
percentage, `[DIR]` one of the 8 compass words (§4.2). In frames, `*…*` marks the serif accent and `**…**` the bold count
phrase. "HK:" marks the overlay's form.

---

## 0. The decisions in one screen

| Question | Decision |
|---|---|
| Address | **你** on every surface, both regions. Never 您, 妳, 閣下. The product speaks as **我們**. **請** only when the reader must act outside the app (a browser setting, their connection). |
| Product verb ("watched") | **注視**. **注視過** by default, the hero and its share hook included. **注視了** only in the post, where the moment is named. Never 監視, 監控, 看見, 拍攝 as the verdict. |
| "this week" / "that week" | **這星期** / **那個星期**. Never 本週, 這一週, 上週. Intl's weekday 週日 stays inside dates. |
| "Last 7 days" | **過去 7 天** (HK: 過去 7 日). |
| "pass" (noun) | **過境**, counted with **次**. |
| image / photo / picture | **影像** any satellite image (counter 張). **照片** an optical photo only. **圖片** a graphic file (the card, the PNG). |
| "clear" (cloud-free) | **無雲**. 清晰 only in 最清晰的一張 (the closest look). |
| Archive | **影像庫**. |
| "in view" | **可視範圍** everywhere. **可轉向範圍** only for "Field of regard". |
| Geostationary | **地球同步** (prose 地球同步氣象衛星, timeline lane 同步軌道). |
| Counters | 顆 satellites, 張 images and frames, 次 passes and times, 個 objects and results, 項 list rows, 條 orbits. |
| Verdicts | 注視過 · 很可能注視過 · 或許曾對準這裡 · 從上空經過. Lanes 影像 · 很可能 · 或許 · 上空. |
| Numbers | Half-width Arabic digits, `1,715`, `.` decimal. Never 萬 / 億, never Chinese numerals for data. |
| Spacing | One half-width space between Han and a Latin letter or digit; none next to full-width punctuation. Data slots get theirs from `cjkGap` (§5.1). A date token is one unit (§6.2). |
| Punctuation | Full-width in sentences: ，。、：；？（）「」. No ！, no dashes, no ellipsis in prose. |
| Units | `786 km`, `7.46 km/s` with a space; `25%`, `12.3°` attached. Time units in Han (秒, 分鐘, 小時, 天). |
| Dates | Built from the date fields, never `month: 'numeric'`, never `formatRange`: `11月1日 週日` in mono rows, `11月1日（週日）` in prose. 24-hour clock. |
| Plurals | CLDR has one category for zh, `other`: one form per message; a zero case is its own sentence. |
| Hong Kong | One overlay of about 40 messages in the same chunk, picked by `<html lang="zh-Hant-HK">`: 日, 甚麼, 私隱, 屏幕, 帖文, 鳴謝, 坐標, 字體, IP 地址, HK exonyms. HK Intl for country names and relative times. Glyph forms stay 衛 / 著 / 裡. |
| Fonts | System Chinese sans (one stack per region). One ≈ 2 kB serif subset (你 運 作) rides inside the zh-Hant chunk (the mechanism is already in the code). No other Chinese font is ever downloaded. |

---

## 1. Register and address

### 1.1 The decision: 你, plain written Chinese, no politeness padding

| Surface | Register | Example | Why |
|---|---|---|---|
| Display headlines (hero, results headline, About title, card headline) | Plain 書面語, declarative, ends with 。 | 這星期，有東西注視過*你*。 | The headline is the human moment. 你 is close and level: the line lands as a quiet fact, not a greeting. |
| Sentences and prose (pass detail, notes, time-lapse note, footnotes) | Plain 書面語, short clauses, 你 / 我們, numbers and names in slots | 當時這裡天黑。氣象成像儀夜間仍以紅外線持續掃描，所以它看到的是你頭上的雲，不是你的街道。 | An instrument talking: exact, unhurried, no hedging adverbs. |
| UI labels and buttons | Verb + object or bare noun; no 請; no 你 (except "my", 我的, where the English has it) | 複製連結, 再試一次, 使用我的位置 | Buttons are commands the person gives. 請 on a button reads like a form at a government counter. |
| Mono caps labels (lanes, readouts, chips, kicker) | Nouns, 2 to 4 characters, no 的, no punctuation | 高度, 側視角, 像素, 過去 7 天 | Instrument legends. A particle or a verb in a legend is noise. |
| Error notices | What happened, then what still works or what to do. No apology, no blame | 影像庫沒有回應，暫時無法計算公開影像的數量。 | The English never apologises. 抱歉 / 很遺憾 sounds like a service desk and makes a routine outage sound like our failure. |
| About page | Same plain register, a shade warmer (the English is casual: "we grab a fresh copy"); short questions and answers | 它看得到我嗎？看不到。 | Plain speech builds trust on a privacy page. Still no particles (喔, 啦, 囉), no slang. |

**請** appears only where the reader must do something the app cannot do for them. Today that is two strings:

- `landing.locateErrors.denied`: `瀏覽器已封鎖定位。請在瀏覽器設定中允許，或直接搜尋地點。`
- `app.faults.catalog`: `無法載入軌道目錄。請檢查連線後再試一次。`

Everything else that suggests a next step says it as a possibility, not a request: `可改為搜尋地點`, `可以稍後再試一次`.

### 1.2 The rejected alternative: 您

您 lost on every surface.

- **The hero dies with it.** 這星期，有東西注視過您。 is a bank notification. The uncanny line needs the intimacy of 你; 您
  puts a counter between the reader and the thing watching them.
- **Hong Kong does not write 您 in everyday copy.** Cantonese has no 您; in Hong Kong it reads Mandarin-imported or stiffly
  official. Hong Kong is the larger audience.
- **Taiwan accepts 你 from products.** Consumer software and devices sold in Taiwan address the reader as 你. 您 belongs to
  banks, telecoms and government forms, the register this product refuses.
- **Mixed address is worse than either.** If the errors used 您 and the hero 你, the product would change voice when
  something breaks.

Also rejected: **妳** (Taiwan writes it for a female "you"; we cannot know who is reading), **閣下** (letters and legal
notices), and **no pronoun in the hero** (有東西注視過。 is not a sentence; the object is the point).

### 1.3 Which written Chinese

The standard written Chinese a Hong Kong newspaper and a Taiwanese magazine both print. Never written Cantonese (佢, 嘅,
咗, 喺, 睇, 冇, 嘢, 㗎), not even in the HK overlay. Never Taiwanese colloquial (超, 很讚, 喔, 囉, 齁). Never mainland
vocabulary (视频, 信息, 默认, 质量, 用户 in its mainland sense, 航天器, 空间站, 搜索, 加载, 延时摄影, 运行 for software).

### 1.4 Hong Kong and Taiwan: one catalog, one overlay

**Rule.** When a word natural in both regions exists, use it. When none exists, write around the concept if the English
allows. Otherwise the base catalog takes the form Hong Kong also reads every day (usually the Taiwanese one, which Hong
Kong sees all over the web), and the overlay carries the Hong Kong word.

| Concept | Taiwan | Hong Kong | Base `zh-Hant` | `zh-Hant-HK` overlay |
|---|---|---|---|---|
| day count | 7 天, 2 天前 | 7 日, 2 日前 | 天 | **日** (every catalog-built count of days; Intl itself prints `2 日前` and `前日` for HK) |
| what | 什麼 | 甚麼 | 什麼 | **甚麼** |
| privacy | 隱私 | 私隱 | 隱私 | **私隱** |
| screen | 螢幕 | 屏幕 / 熒幕 | 螢幕 (written around where possible) | **屏幕** |
| resolution | 解析度 | 解像度 | avoided: `每像素 10 m` | 解像度, if a string ever needs it |
| social post (noun) | 貼文 | 帖文 | 貼文 | **帖文** |
| credits | 致謝 | 鳴謝 | 致謝 | **鳴謝** |
| coordinates | 座標 | 坐標 | 座標 | **坐標** |
| typeface | 字型 | 字體 | 字型 | **字體** |
| IP address | IP 位址 | IP 地址 | IP 位址 | **IP 地址** |
| Gaza Strip (static copy only) | 加薩走廊 | 加沙地帶 | 加薩走廊 | **加沙地帶** |
| Sydney / Perth (static copy only) | 雪梨 / 伯斯 | 悉尼 / 珀斯 | 雪梨 / 伯斯 | **悉尼 / 珀斯** |
| curated exonyms | §4.3 | §4.3 | the Taiwanese / Intl-TW form | the rows marked HK in §4.3 |
| week | 週 | 周 / 星期 | **星期** in our own copy (這星期, 那個星期); Intl's 週日 in dates | none |
| data | 資料 | 資料 / 數據 | **資料** (公開資料, 軌道資料; both governments' open-data portals say 資料) | none |
| geostationary | 同步衛星 | 地球同步衛星 | **地球同步** (as the Observatory and CWA say) | none |
| Dubai | 杜拜 | 杜拜 | 杜拜 (迪拜 is the mainland form) | none |
| Palm Jumeirah | 朱美拉棕櫚島 | 朱美拉棕櫚島 | 朱美拉棕櫚島 | none |
| publish (a post) | 發布 / 發佈 | 發佈 | 發佈 (X's own zh-Hant UI) | none |
| collapse | 收合 | 收起 | 收起 | none |
| "and" in lists | 和 | 及 / 和 | 和 (template-built, §5.4) | none |
| render | 算繪 / 彩現 | 渲染 | avoided: 產生 / 製作 | none |
| slide (aria-roledescription) | 投影片 | 幻燈片 | avoided: 影像 | none |
| panchromatic | 全色態 | 全色 | avoided: 黑白波段 | none |
| network, internet | 網路 | 網絡 | avoided: 連線, 網速 | 網絡, if a string ever needs it |
| software, robot, remote sensing, metre (word), space bar | 軟體, 機器人, 遙測, 公尺, 空白鍵 | 軟件, 機械人, 遙感, 米, 空格鍵 | avoided: 自動程式, 成像衛星, the symbol `m`, the key cap `Space` | none |
| quality | 品質 | 質素 | avoided: 畫質 | none |
| photo | 照片 | 相片 / 照片 | 照片 (standard in HK writing) | none |
| video | 影片 | 影片 / 視頻 | 影片 | none |
| glacier | 冰河 / 冰川 | 冰川 | 冰川 (冰河 also means a frozen river) | none |
| country names | Intl `zh-Hant-TW` | Intl `zh-Hant-HK` (格魯吉亞, 意大利, 老撾, 也門, 黑山, 沙地阿拉伯, 阿拉伯聯合酋長國) | automatic | automatic, once Appendix B.1 is done |
| glyph forms | 衛, 著, 裡, 線 | 衞, 着, 裏, 綫 (HK standard; 衞生署) | TW forms | none |

**Glyph forms.** Both regions get the Taiwan MOE forms (衛 not 衞, 著 not 着, 裡 not 裏, 線 not 綫). Hong Kong readers see
these on most of the web and read them as standard; the hero (注視過) has none of the split characters, and 衛 in the
results headline is accepted for v1. If the owner ever wants Hong Kong forms, they come from a reviewed word list
applied to the overlay at build time (著 → 着 only as the aspect particle, never in 著名 or 著作), never from a runtime conversion,
which is context-sensitive and makes errors.

**How the overlay works** (zero cost; details in Appendix B.1):

- The boot script sets `<html lang="zh-Hant-HK">` when the matched browser tag carries `hk` or `mo` (`zh-HK`, `zh-MO`,
  `zh-Hant-HK`, `zh-Hant-MO`), and keeps `lang="zh-Hant"` for Taiwan and bare `zh-Hant`. `data-locale` stays `zh-Hant`,
  so the chunk, the catalog code and the links' `l=` stay one. The region also follows the browser's languages when the
  visitor picks 繁體中文 in the switcher or arrives with `?hl=zh-Hant`.
- The overlay is a `Partial` of about 40 messages compiled into the same zh-Hant chunk and merged at startup when the
  lang is `zh-Hant-HK`. No second request; under 1 kB.
- Intl calls (country names, relative times) take `zh-Hant-HK` in Hong Kong and `zh-Hant-TW` otherwise.
- A `:root:lang(zh-Hant-HK)` font rule puts PingFang HK and Noto Sans CJK HK first (§6.10).
- **Share cards and share pages** are rendered from `l=zh-Hant`, so they print the base words (什麼, 天, 隱私) for every
  sharer. Hong Kong reads all of them; one card per link keeps the CDN cache whole. The card copy avoids the split words
  where the English allows (§3.5).

The overlay keys, in full: `landing.lastDays`, `landing.sub`, `landing.searchDown`, `landing.nothingMatches`, the results
headline's window phrase, `hud.catalogAge` (day unit), `engine.progress.propagateStart`, `engine.note.elementsOld`,
`about.lede`, `about.short.live`, `about.accuracy.delays`, `about.sections.privacy`, `about.sections.credits`,
`about.privacy.kept` (term and text), `about.photoFacts.touchUps`, `about.credits.type.who`, `share.postLabel`,
`share.hookPassed`, and the curated places marked HK in §4.3. (The card catalog has no overlay in v1.)

**Not in v1: Cantonese tags.** `yue` and `yue-Hant` fall through to English today. Mapping them to zh-Hant with the HK
overlay is natural for Hong Kong readers, but it is an exception to the owner's rule that a language we don't speak
never picks a neighbour, so it waits for the owner (open question). `yue-Hans` would map to zh-Hans if it is ever done.

---

## 2. Voice

### 2.1 How "declarative, specific, quietly uncanny, second person" sounds in zh-Hant

- **Declarative.** Statements of fact ending in 。. No 吧, 呢, 喔, 啦. No rhetorical questions outside the About FAQ and
  the share page's closing question. No 竟然, 居然: the facts are surprising enough.
- **Specific.** Put the number, the name and the time in the sentence. Chinese reports put time and place BEFORE the
  verb: `Sentinel-2C 於 16:14:21 UTC 從正上方 786 km 高空飛過`. That order is the specificity: when and where, then what
  happened.
- **Quietly uncanny.** The uncanny is in plain words placed exactly: 有東西 (an unnamed "something"), 注視 (a fixed,
  attentive gaze), 你頭上的雲 (your clouds). Never 神秘, 震撼, 驚人, 恐怖, 偷窺. Never stack adjectives.
- **Second person.** 你 is the object of the watching and the owner of the place: 你選的地點, 你的天空, 你頭上. Chinese
  drops subjects freely, so 你 appears where it carries weight, not at the start of every sentence.

### 2.2 Rhythm and length

- One idea per clause; 8 to 20 characters per clause; at most two commas per sentence. Split an English sentence rather
  than chaining 的.
- End on the fact: `…注視過 Waterloo。`, `…原圖整體雲量：25%。`
- Never three 的 in one phrase (`你選的地點的像素的雲量` → `地點上的雲量`).
- Four-character idioms only when they are the plain word (日夜皆可, yes; 一目了然, no).
- Aspect: **過** for "has watched / has crossed" over a period (the default, the hero included); never **著** (the
  durative claims an ongoing gaze the product does not report); **了** only for one completed act at a named moment
  (`取得了 Waterloo 的影像`, the post's `注視了`).
- **No pro-verb.** "We can't know whether it did" never becomes 這樣做: Chinese merges the clauses
  (`…就可能注視過 Waterloo，但我們無從得知。`).

### 2.3 What to avoid

| Avoid | Why | Instead |
|---|---|---|
| 立即探索, 快來看看, 一鍵, 超強, 全新 | The product is an instrument, not a campaign | Say what it does: 搜尋地點 |
| 進行 + verb (進行搜尋, 進行計算) | Bureaucratic calque of "perform" | 搜尋, 計算 |
| 被 passive copied from English (被公開) | Chinese rarely marks the passive | 已有 31 張影像公開。 |
| 一個 / 一顆 before every noun | Calque of "a" | Keep it only for rhythm (輸入地球上任何一個地方) |
| 它 / 它們 in every sentence | Calque of English pronouns | Zero subject after the first mention |
| 這樣做 for "did it" | Calque of the English pro-verb | Merge the clauses: 但我們無從得知 |
| 對於…來說, 作為…, 基於… | Translationese | Restructure |
| 您, 親, 小編, 我們很高興 | Service or social-media voice | none |
| 抱歉, 很遺憾, 不好意思 | The English never apologises | State the fact |
| Exclamation marks, emoji, 「」 for emphasis | DESIGN §1 | none |

### 2.4 Before and after

1. "Something watched you this week."
   - Before: 本週有某物正在監視您！
   - After: 這星期 / 有東西 / 注視過*你*。
   - 本週 is a supermarket flyer, 某物 a calque, 監視 an accusation, 您 a bank, ！ a shout.
2. "No satellite we track watched Waterloo this week."
   - Before: 很遺憾，本週我們所追蹤的衛星中，沒有任何一顆衛星對 Waterloo 進行了注視。
   - After: 這星期，我們追蹤的衛星沒有一顆注視過 *Waterloo*。
   - No apology, no 進行, no repeated 衛星; 沒有一顆 ("not a single one") is the plain emphatic.
3. "It could have watched Waterloo. We can't know whether it did."
   - Before: 它可能曾經注視過 Waterloo。我們無從得知它有沒有這樣做。
   - After: 它可能注視過 Waterloo，但我們無從得知。
   - One sentence, no pro-verb. 無從得知 at the end is the fact, plainly.
4. "Can it see me? No. At best a pixel here is 10 m across. A car is one pixel. You're not in it."
   - Before: 它能否看到我？答案是否定的。在最佳情況下，此處每個像素的寬度為 10 公尺……
   - After: 它看得到我嗎？看不到。這裡的一個像素最細也有 10 m 寬，一輛車只佔一個像素。畫面裡認不出你。
   - Short answer first, then the fact, then the human line. "You're not in it" means you cannot be made out: 認不出你.
5. "The image archives didn't answer, so we can't count the public images right now."
   - Before: 抱歉！影像存檔伺服器發生錯誤，請稍後再試。
   - After: 影像庫沒有回應，暫時無法計算公開影像的數量。
   - Not our error, not the server's fault: the archives did not answer. Say exactly that.

---

## 3. The key lines

### 3.1 The hero

Final (three display lines, one accent, no comma in the display):

```
這星期
有東西
注視過*你*。
```

`landing.hero` and `card.hero`: `[['這星期'], ['有東西'], ['注視過', accent('你'), '。']]`

- **Plain text** wherever the sentence stands alone (`<title>` after the brand, `page.title`, og and card alt, the
  default card's description): `這星期，有東西注視過你。` The h1's accessible text is the three lines run together,
  `這星期有東西注視過你。`, which is also grammatical.
- **Share hook** (`share.hookWatched`), kept in step: `這星期，也有東西注視過你。`
- **Line lengths** 3 / 3 / 5 em. At 102 px every line has the same density; 這一週 made line 1 look gappy (一 is one
  hairline stroke) and reads slightly foreign in Hong Kong, which writes the week as 周 or 星期. 這星期 is the everyday
  written form in both regions and sidesteps the 週 / 周 split.
- **No comma at the line break.** In the team's own specimen the full-width comma at the end of line 1 is a floating
  blob, and it cannot hang (`hanging-punctuation` is Safari-only). On a Chinese poster the break is the pause. The 。 is
  kept: it is the brand's full stop, set in the display face in `--bone`.
- **注視過 in the hero too (lead decision, 2026-11-19).** The draft and its review chose the durative 注視著 here for its
  presence, but the English is a past report ("watched … this week"), the headline and the verdict say 注視過, and the
  Simplified edition says 注视过: the two Chinese editions now read the same, and the hero says what the results say.
  Everywhere else the product reports a past week and says 注視過 too (owner decision: both heroes say the past
  report).
- **The accent is 你**, the human moment, as in English: upright serif (the accent subset, §6.10), signal orange. Chinese
  has no italic; the browser must never slant it.
- Time first is the natural Chinese order. A Chinese line cannot end on "this week"; the human word takes the last
  position instead, which is a stronger close.

| Alternate | Why it lost |
|---|---|
| 這一週， / 有東西 / 注視過*你*。 | 這一週 is Taiwanese written usage, slightly foreign to Hong Kong; line 1 is thin; the line-end comma floats. |
| 這個星期 / 有東西 / 注視過*你*。 | Line 1 grows to 4 em and the cadence goes slack. |
| 這星期 / 有東西 / 注視著*你*。 | The draft's durative: "is watching you", the stock horror line, a claim of an ongoing gaze, and a second verb form beside every other 注視過. |
| 本週， / 有東西在 / 注視*你*。 | 本週 is a promotion; 在 stranded at a line end splits the verb. |
| 這星期 / 有甚麼 / 在看著*你*。 | A ghost-story line, louder than "quietly"; 看著 collides with every 看看 in the UI; 甚麼 / 什麼 splits the regions on the most-seen line. |
| 這星期 / 有東西 / 在監視*你*。 | Surveillance by an authority: an accusation, and politically loaded in both regions. |

### 3.2 The sub line

English: "Enter any place on Earth. See every satellite that passed over it in the last 7 days, and the actual pictures
they took."

**Final:** `輸入地球上任何一個地方，看看過去 7 天從上空飛過的每一顆衛星，以及它們實際拍下的影像。`

`landing.sub(days)`: `['輸入地球上任何一個地方，看看過去 ', String(days), ' 天從上空飛過的每一顆衛星，以及它們實際拍下的影像。']`
(HK: `' 日從上空飛過…'`)

- `7` is a mono-safe digit with a space on each side; the space before 天 never breaks (the number and its unit stay
  together, §6.8).
- 每一顆 keeps "every"; 實際 keeps "actual" (the honesty claim, the same word as the share page's description); 影像
  covers photos, mosaics and radar, as "pictures" does.
- 從上空飛過 needs no pronoun: 上空 is understood as the place's sky. 它 for a place, or 那裡 (a 裡 / 裏 split), is
  weaker.
- 拍下 is right because the English says "pictures they took". It is not the verdict verb.
- 看看 is a soft, natural invitation, not a command.

| Alternate | Why it lost |
|---|---|
| 輸入地球上任何地方。過去 7 天飛過那裡的每一顆衛星，和它們實際拍到的影像，都在這裡。 | 都在這裡 presents the product: a sales close. 拍到 implies luck. |
| 輸入地球上任何一個地方，查看過去 7 天有哪些衛星經過，以及它們拍下的真實影像。 | 查看 is a settings-menu verb; 有哪些 drops "every". |

### 3.3 The results headline and the second line

zh has one plural category, `other`: one form for every count. The zero cases are their own sentences. Bold is **the
number, its counter, the noun and the verb**; 有 and the window phrase stay regular. The serif accent is the place name
alone; 。 sits outside it. The number is in the display face (`numDisplay`), as in English.

| Case | Frame | Example |
|---|---|---|
| N ≥ 1, 7-day window | 過去 [NUM] 天，有 **[NUM] 顆衛星注視過** *[PLACE]*。 | 過去 7 天，有 **256 顆衛星注視過** *Waterloo*。 |
| N = 1 | the same frame | 過去 7 天，有 **1 顆衛星注視過** *九龍*。 |
| Another window length | the same frame | 過去 6 天，有 **241 顆衛星注視過** *Waterloo*。 |
| An older window | [DAY1]至[DAY2]，有 **[NUM] 顆衛星注視過** *[PLACE]*。 | 10月29日至11月5日，有 **256 顆衛星注視過** *Waterloo*。 |
| Zero, this week | 這星期，我們追蹤的衛星沒有一顆注視過 *[PLACE]*。 | 這星期，我們追蹤的衛星沒有一顆注視過 *Waterloo*。 |
| Zero, that week | 那個星期，我們追蹤的衛星沒有一顆注視過 *[PLACE]*。 | |

HK: `過去 7 日，…`.

- **有 is required.** Without it a numbered subject reads definite or like a newspaper headline (256 顆衛星注視過
  Waterloo).
- **Spacing around the place** comes from `cjkGap` (§5.1): `注視過 Waterloo。` but `注視過九龍。`.
- In the DOM, the bold phrase and the place are `white-space: nowrap` (else `256 顆衛 / 星` splits).
- The zero headline's reason follows as its own sentence (§3.4, "Zero reasons").

**The second line** (the only line that may say "At least" and settle in place). One number counts every image, so it is
always 影像, never 照片.

| Case | Frame | Example |
|---|---|---|
| K ≥ 1 | 已有 [NUM] 張影像公開。 | 已有 31 張影像公開。 |
| Partial | **至少**已有 [NUM] 張影像公開。 | 至少已有 1,715 張影像公開。 |
| Zero, results | 這星期沒有影像公開。 / 那個星期沒有影像公開。 | |
| Zero, card line (the headline already says 這星期) | 沒有影像公開。 | |
| Archives down (results, share page, post) | 影像庫沒有回應，暫時無法計算公開影像的數量。 | |
| Archives down, card (one line) | 影像庫沒有回應。 | |

至少 is a separate prefix span: the partial line is `[至少][已有 31 張影像公開。]`, and the settle fades 至少 out leaving
a complete sentence. `已有…公開` was chosen over `31 張影像已公開` because 至少 then stays a clean prefix; a numeral
opening is perfectly good Chinese elsewhere. Rejected: 共有 31 張影像公開 (共 fights 至少), 31 張照片 (radar and
full-disc frames are not photos).

### 3.4 Pass sentences (whole messages, every case)

`docs/I18N.md`: whole sentences, never fragments. Each row is one complete message with named slots; the zh catalog
orders them (time and place before the verb). Distances: `高空` follows the altitude. An offset is **[DIR]方 [DIST] 處**
(北方, 東北方, 東方, 東南方, 南方, 西南方, 西方, 西北方): `西方 61 km 處`. Never 偏西, which means "veering westward".
Movement keeps the bare word: `向南移動`.

**Watched, optical (Sentinel-2, Landsat)**

> Sentinel-2C 於 16:14:21 UTC 從正上方 786 km 高空飛過，以 7.46 km/s 向南移動。它當時直視正下方。原圖整體雲量：25%。

- Not overhead: `Landsat 9 於 10:32:05 EST 在 705 km 高空、西方 61 km 處飛過，以 7.52 km/s 向南移動。`
- Off nadir: `它當時的視線偏離正下方 12.3°。`
- 直視 and 視線 keep the gaze ("it was looking"). 原圖 is the archive's whole image, as opposed to the crop on screen: the
  honest reading of "across the scene".

**Watched, weather mosaic**

> NOAA-21 於 13:42:10 EST 在 824 km 高空、東方 412 km 處飛過，以 6.95 km/s 向北移動。它的 VIIRS 成像儀把 Waterloo 掃進了 NASA 每日真實色彩拼接影像，每像素 375 m。

**Watched, radar**

> Sentinel-1C 於 06:05:44 EST 在 693 km 高空、東方 210 km 處飛過，以 7.08 km/s 向北移動。它的雷達朝側面 32.1° 觀測，取得了 Waterloo 的影像，每像素 20 m。

- In the dark (the English adds "in the dark" only when the sun is below −6°): `…朝側面 32.1° 觀測，在黑暗中取得了 Waterloo 的影像，每像素 20 m。`
- Radar never 拍 (it does not photograph): 取得…的影像.

**Watched, geostationary**

> Meteosat-12 不會過境。它定點在赤道上空 35,778 km、西經 0.2° 處，每 10 分鐘把它看得到的整個地球圓面掃描一次。這次掃描約於 07:49 CET 到達 Paris，掃描線向北移動。

- No longitude: `它定點在赤道上空 35,778 km 處，…`. No cadence: `…處，持續掃描它看得到的整個地球圓面。`
- It scans the disc it sees, never 整面地球 (the whole Earth). One 掃 per clause.
- Infrared frame: `當時這裡天黑，所以這是紅外線影像：以溫度呈現雲頂，越冷越亮。`

**Likely watched**

> Sentinel-2B 於 11:02:47 EST 在 786 km 高空、東方 98 km 處飛過，這個地點在它 290 km 寬的掃描帶內。當時是白天，它幾乎肯定記錄了這個地點。這次過境還沒有任何影像公開；影像庫可能延遲一天以上。

- The place is the subject of 在…掃描帶內, never the satellite (位於它的掃描帶內 put the satellite inside its own swath).
- Old pass: `這次過境沒有影像。Sentinel-2 只記錄陸地和近岸水域，可能沒有排定觀測這個地點。`
- Archive down: `當時是白天，它應該記錄了這個地點。暫時無法搜尋影像庫。`
- Weather, dark: `當時這裡天黑。氣象成像儀夜間仍以紅外線持續掃描，所以它看到的是你頭上的雲，不是你的街道。`
- No GIBS mosaic: `無法確認 NASA 這次過境的每日拼接影像涵蓋你選的地點。`
- Not published: `它的影像用於天氣預報，不會以我們能顯示的形式公開。`
- Never claim an image exists: `還沒有任何影像公開` / `沒有公開的影像`, never `影像還沒有公開` / `影像沒有公開`.

**Could have pointed here**

> WorldView Legion 4 於 10:52 EST 在西方 61 km 處經過，這裡在它的可視範圍內。它只要偏離正下方 12.3°，就可能注視過 Waterloo，但我們無從得知。

- Overhead: `WorldView Legion 4 於 10:52 EST 從正上方經過，這裡在它的可視範圍內。它只要直視正下方，就可能注視過 Waterloo，但我們無從得知。`
- Fixed swath: `…經過，這裡在它的可視範圍內。Waterloo 在它 24 km 寬的掃描帶內。營運商不公開它觀測過哪些地方，所以我們無從得知它有沒有注視過。`
- Radar, open archive: `雷達能穿透雲層和黑暗。它只要朝側面偏 25.0°，就可能測繪過 Waterloo。這次過境找不到它公開的影像。`
  (looking straight down: `雷達能穿透雲層和黑暗。它可能測繪過 Waterloo。這次過境找不到它公開的影像。`)
- Radar, private: `雷達能穿透雲層和黑暗。它只要朝側面偏 25.0°，就可能測繪過 Waterloo，但我們無從得知。`
- DESIGN's commercial line (the English says "local" with no zone): `WorldView Legion 4 於當地時間 10:52 在可視範圍內經過。它可能注視過 Waterloo，但我們無從得知。`
- 當地時間 goes only where the English says "local" with no zone; never before a zoned [TIME].

**Passed overhead**

> ISS 於 19:02 EST 從 418 km 高空經過，位於你西北方天空、仰角 54° 處。

- Near the zenith (80° or more): `ISS 於 19:02 EST 從 418 km 高空經過，仰角 86°，幾乎就在你頭頂。`
- Dark: `當時你那裡天黑。如果太空站仍在陽光下，它就會像一個明亮、穩定的光點劃過你的天空。`

**Zero reasons and the week's other sentences** (each its own message, ending in 。 from the catalog, never a `.` from
code)

| Case | zh-Hant |
|---|---|
| archive | 影像庫沒有及時回應。 |
| the sun never rose | 太陽一直沒有升起。 |
| the sun barely rose | 這裡的太陽幾乎沒有升起。 |
| unpublished | Sentinel-2 或 Landsat 在白天飛越這裡 3 次，但還沒有任何影像公開。 (once: `…飛越這裡 1 次，…`) |
| none | 沒有影像公開的成像衛星在白天飛越這裡。 |
| dark sentences | 太陽一直沒有升起，所以沒有日間相機看得到這裡。 / 太陽幾乎沒有升起，所以沒有日間相機看得到這裡。 |
| infrared sweeps | 氣象衛星仍以紅外線掃過這裡 42 次。 |
| radar list | 雷達不需要光。Umbra、Capella 和另外 7 顆雷達衛星在可視範圍內經過了 1,204 次。 |

一直沒有 is "did not, the whole time"; never 從未 ("never, ever"): the window is a week. None of these adds 這星期: the
window may be an older week.

**The plan view's footnotes** (`passView.noImage`: a footnote UNDER the drawing, so the drawing is above). Every "Plan
view of the pass." becomes `上圖是這次過境的平面圖。`, never 以下是.

| Key | zh-Hant |
|---|---|
| `openArchive` | [SAT] 這次過境沒有這個地點的影像。上圖是這次過境的平面圖。 |
| `radarPrivate` | 沒有公開影像：這家雷達營運商的影像庫不公開。上圖是這次過境的平面圖。 |
| `commercialPrivate` | 沒有公開影像：商業影像庫不公開。上圖是這次過境的平面圖。 |
| `noneToShow` | 這次過境沒有可顯示的影像。上圖是這次過境的平面圖。 |
| `archiveDown` | 暫時無法搜尋影像庫。上圖是這次過境的平面圖。 |
| `noScene` | 這次過境沒有影像。上圖是這次過境的平面圖。 |
| `notYet` | 還沒有公開影像對應這次過境。Sentinel-2 和 Landsat 的影像通常在一天內出現。 |
| `crewed` | 載人太空站上有相機，但照片不會按地點和時間公開。 |
| `unavailable` | 無法取得這次過境的影像。 |

`openArchive` avoids 拍攝: an open archive can be radar (Sentinel-1).

### 3.5 Share card, share page and post

**Card headlines** (`api/_lib/i18n/card/zh-Hant.ts`). A headline is blocks in the order the message returns them. Each
text part is one line in the condensed display face, never broken inside, so the lead is split into phrases where a
typesetter breaks a display headline (4–7 em each; the card's size is the largest at which every text part fits one
line of the 466 px column, `headlineSizeCjk`). The accent part is the place, in the serif (at most two lines). 。 sits
inside the place's block (dropped when the place was cut) when the place is last.

| Message | Blocks (a line each; the place may take two) | Reads |
|---|---|---|
| `headline` (N ≥ 1) | `有 [NUM] 顆衛星` · `注視過` · `[PLACE]。` | 有 7 顆衛星注視過 Waterloo。 |
| `headline` (zero) | `我們追蹤的衛星` · `沒有一顆注視過` · `[PLACE]。` | |
| `headlineWeek` (N ≥ 1) | `這星期，` · `有 [NUM] 顆衛星` · `注視過` · `[PLACE]。` | 這星期，有 31 顆衛星注視過 Waterloo。 |
| `headlineWeek` (zero) | `這星期，` · `我們追蹤的衛星` · `沒有一顆注視過` · `[PLACE]。` | 這星期，我們追蹤的衛星沒有一顆注視過 Waterloo。 |
| `headlineBy.imaged` | `[SAT]` · `注視過` · `[PLACE]。` | Sentinel-2C 注視過 Waterloo。 |
| `headlineBy.likely` | `[SAT]` · `掃過` · `[PLACE]。` | Landsat 9 掃過 Waterloo。 |
| `headlineBy.could` | `[PLACE]` · `曾在` · `[SAT]` · `的可視範圍內。` (place first) | Waterloo 曾在 Capella-14 的可視範圍內。 |
| `headlineBy.overhead` | `[SAT]` · `飛越` · `[PLACE]。` | ISS (ZARYA) 飛越 Waterloo。 |
| nameless satellite | `有一顆衛星` · `注視過` · `[PLACE]。` (and 掃過, 飛越; could: `曾在一顆衛星` · `的可視範圍內。`) | 有一顆衛星注視過 Waterloo。 |

Sizes (measured with `headlineSizeCjk`, Waterloo): `headline` 74 px, `headlineWeek` 72, the zero forms 66, a nameless
satellite 74, a long name (WorldView Legion 4) 52, could 52 (its Latin name on its own line).

- **The gap.** zh joins blocks with nothing (`sentenceGap: ''`), so each text part ends with the gap to what follows it
  (`cjkGap`), and a block after a place starts with `cjkGap(place, next)`. The share page's `<title>`, og:title and the post's first
  sentence then read `Sentinel-2C 注視過 Waterloo。` and `Sentinel-2C 注視過九龍。`. On the card the trailing space is
  invisible.
- **Could, place first.** `經過時可看到 Waterloo` reads like a claim that it saw; the place-first frame states exactly
  what is known. The card supports a place first (the accent block is whichever part is the accent); 。 then ends the text
  block and is never dropped by a cut. In the row's aria the verb is `經過時在可視範圍內`.
- **Overhead uses 飛越**, the established news verb for a station crossing a city; a frame with the place in the middle
  (從 [PLACE] 上空經過) would leave the lead dangling on 從 and put 上空經過 in the serif block.
- **"this week" leads** the summary card's lead block: Chinese cannot put it after the place, as English does.
- **Budgets** (§7): no card lead longer than the zero lead (18 em), and never a word on the card headline that the
  results headline does not have.

**The rest of the card**

| Key | zh-Hant |
|---|---|
| `photos` | 已有 31 張影像公開。 · 至少已有 31 張影像公開。 · 沒有影像公開。 |
| `archiveDown` / `archiveDownShort` | 影像庫沒有回應，暫時無法計算公開影像的數量。 / 影像庫沒有回應。 |
| `cloud.only` | sub 雲層遮蔽，只看到雲。 · chip `雲層遮蔽 · 94%` · post 它只看到雲。 · desc 它只看到雲（94%）。 |
| `cloud.mostly` | sub 大部分是雲：原圖的 81%。 · chip `大部分是雲 · 81%` · post / desc 它看到的大多是雲（81%）。 |
| `cloud.spot` | sub 雲正好蓋住這個地點。 · chip `地點被雲遮蔽` · post / desc 雲蓋住了這個地點。 |
| `stamp` | `2026年11月1日 週日 · 11:21 EST` (the mono chip form: no parentheses) |
| `weekTo` | `截至 2026年11月1日 週日 · 7 天` (keeps the year, as the English does) |
| `lastWeek` | 過去 7 天 |
| `readout` | 高度 · 仰角 · 速度 · 側視角 · 像素 · 拼接像素 · 最近距離 |
| `lane` | 影像 · 很可能 · 或許 · 上空 |
| `unit` | km · m · km/s |
| `decimal` | `fmt('zh-Hant').dec` |
| `pixelSize` / `distance` / `scale` | `10 m`, `0.31 m`, `2 km` / `61 km` / `1 km`, `500 m` |
| `geometry` | 過境幾何 · 北方朝上 |
| `note` | imageInApp 影像可在網站中開啟 · imageUnavailable 暫時無法取得影像 · commercial 商業影像庫，不公開 · inSwath 在掃描帶內，尚無公開影像 · groundTrack 最接近時的地面軌跡 |
| `acquiring` | 接收中… |
| `noPublicPhoto` / `noPhoto` | 這星期沒有公開影像 / 沒有可顯示的影像 |
| `look` | closest 最清晰的一張 · lastClear 最近一張無雲影像 · clouded 雲層遮蔽 · radar 雷達 |
| `lookDay` | `11月3日` |
| `aSatellite` (a label on its own) | 一顆衛星 |
| `invite` | 看看是什麼注視過你 |
| `hero` | §3.1 |
| `enterAnyPlace` | 輸入地球上任何地點 |
| `defaultPlace` | 朱美拉棕櫚島 |
| `defaultAlt` | 一張真實的 Sentinel-2 衛星照片，拍的是杜拜的朱美拉棕櫚島，旁邊寫著：這星期，有東西注視過你。輸入地球上任何地點。 |

`invite` is never 看看誰注視過你: 誰 turns satellites into people, and 看看誰… is the stock line of "see who viewed your
profile", the cheap stalker register §8 rules out. The hero's 有東西 is deliberately not a person; 是什麼 keeps it so.

**The share page**

| Key | zh-Hant |
|---|---|
| `page.title` | 這星期，有東西注視過你。 |
| `page.description` | the sub line (§3.2) |
| `page.placeTitle` | 這星期，是什麼注視過 [PLACE] (a heading: no 。, no ？) |
| `page.placeDescription` | 過去 7 天從 [PLACE] 上空飛過的每一顆衛星，以及它們實際拍下的影像。這星期，是什麼注視過你？ |
| `page.opening` | `['正在開啟 ', accent('Watched')]` |
| `crossed` (imaged, likely) | Sentinel-2C 於 2026年11月1日（週日）11:21 EST 從 Waterloo 上空 795 km 處飛過，向南移動。 |
| `crossed` (overhead) | ISS (ZARYA) 於 2026年11月1日（週日）21:14 EST 從 Waterloo 上空 420 km 處經過，向東北移動。 |
| `crossed`, no altitude | …從 Waterloo 上空飛過… / …從 Waterloo 上空經過… |
| `withinView` | WorldView Legion 4 於 2026年11月1日（週日）10:52 EST 向西北經過，Waterloo 在它的可視範圍內。 |
| `couldHave` | 它可能對準過這裡，但營運商不會透露。 |
| `straightDown` / `offNadir` | 它當時直視正下方。 / 它當時的視線偏離正下方 12.3°。 |
| `cloudCover` | 雲量：25%。 |
| `inSwath` | Waterloo 在它的掃描帶內。 |
| `bestFrom` | 最清晰的一張來自 Sentinel-2B。 · 最近一張無雲影像來自 Sentinel-2B。 · 第一張影像來自 Sentinel-2B。 (nameless: 來自一顆衛星) |
| `question` | 這星期，是什麼注視過你？ |
| `cardAlt` | 分享卡片，附上這星期最清晰的一張照片，來自 Sentinel-2B。 / 分享卡片。 |

When a part of `crossed` or `withinView` is missing (no time, no heading), drop its clause and keep the sentence whole.
The heading always goes with the satellite's verb (`向西北經過`), never after the place, where it would read as the place
moving.

**The post** (`share.post`: first paragraph, then the hook, then the credit). The English says "on Sun 1 Nov at 11:21
local", so the clock carries no zone and 當地時間 leads the time phrase. [DAY] is the prose form `11月1日（週日）`.

| Case | zh-Hant |
|---|---|
| imaged | Sentinel-2C 於當地時間 11月1日（週日）11:21 從 786 km 高空注視了 Waterloo。每像素 10 m，這是真實的影像。 |
| imaged, no pixel size | Sentinel-2C 於當地時間 11月1日（週日）11:21 從 786 km 高空注視了 Waterloo。這是真實的影像。 |
| clouded | Sentinel-2C 於當地時間 11月1日（週日）11:21 從 786 km 高空注視了 Waterloo。它只看到雲。 |
| likely | Landsat 9 於當地時間 11月1日（週日）10:21 從 705 km 高空掃過 Waterloo，這個地點在它的掃描帶內。 |
| could | WorldView Legion 4 於當地時間 11月1日（週日）10:52 經過，Waterloo 在它的可視範圍內。它可能對準過這裡，但營運商不會透露。 |
| overhead | ISS (ZARYA) 於當地時間 11月1日（週日）21:14 從 Waterloo 上空 420 km 處經過。 |
| `hookWatched` | 這星期，也有東西注視過你。 |
| `hookPassed` | 這星期，有什麼從你頭上飛過？ (HK 甚麼: the post is app copy, so the overlay applies) |
| `credit` | `via @armaangupt0` (unchanged: via reads on X in both regions) |

- 注視了 is right here and only here: the moment is named.
- The pixel in the post: whole metres, or whole km from 1,000 m (`每像素 10 m`, `每像素 2 km`).
- **X budget.** X counts every Han character as 2 (`links.ts xLength`) and the post must fit 256 units with a 120-character
  place. Keep the first paragraph to about 45 Han plus names; the code drops the hook first, then cuts the paragraph.
- File names (`pngName`, `weekPngName`, `fileNamePlace`) stay lowercase ASCII.

Note: the post and the share sheet are app copy, so the HK overlay applies to `hookPassed` there; the card and the share
page are server copy from `l=zh-Hant` and use the base 什麼.

### 3.6 The four verdicts (`VERDICT_META`, one vocabulary everywhere)

| verdict | title | lane (mono) | count unit | definition | prose verb |
|---|---|---|---|---|---|
| imaged | 注視過 | 影像 | 次過境 | 公開影像庫中有這個地方的真實影像。 | 注視過 |
| likely | 很可能注視過 | 很可能 | 次過境 | 固定鏡頭的掃描帶涵蓋了這個地方，但沒有公開的影像。 | 掃過 |
| could | 或許曾對準這裡 | 或許 | 次過境 | 可轉向或私營的鏡頭當時在可視範圍內。營運商不透露它有沒有看向這裡。 | 經過時在可視範圍內 |
| overhead | 從上空經過 | 上空 | 次過境 | 從你的天空劃過。太空站和其他衛星都算在內。 | 從上空經過 |

- Tiles: number, then unit, then title under it: `31 次過境` / `注視過`. Aria: `31 次過境：注視過`.
- The three degrees read at a glance: 注視過 (it did), 很可能 (very probably), 或許 (perhaps). 可能 alone is banned in
  lane labels: beside 很可能 the two blur.
- The imaged lane says 影像, not 照片: it holds radar images and weather mosaics too. More honest than the English
  "Photo", and deliberate.
- 但沒有公開的影像 ("there is no published image"), never 但影像沒有公開 ("the image was not released"): we do not know
  an image exists.
- One deixis: 這裡 (never 這邊).
- Summary card lanes: 影像 / 很可能 / 或許 / 上空.

About's longer words after each definition (`about.verdictMore`):

| verdict | zh-Hant |
|---|---|
| imaged | 我們顯示的，就是真實的影像。 |
| likely | 影像還沒公開，或是因為雲太多被捨棄了。 |
| could | 我們無從得知它是否真的看了。 |
| overhead | (empty) |

### 3.7 The About page

- **Title** (`about.title`): `[['這一切'], ['如何', accent('運作'), '。']]`, read `這一切如何運作。`. The English accent is
  on the verb; 如何運作 is a clause, so the 。 is natural; 如何 is neutral in both regions. Never `運作` / `*原理*。`,
  which split a compound across display lines and put a full stop after a noun phrase. The HUD link stays `運作原理`.
  The accent subset carries 你 運 作.
- **Lede:** `在地球上選一個地點。我們算出過去 7 天有哪些衛星飛過那裡，再去找出它們拍下的照片。一切都在你的瀏覽器裡完成，用的都是公開資料。`
  (HK 7 日). 過去 7 天 matches the kicker; 完成 is neutral (運行 for software is mainland and HK flavour, Taiwan says 執行).
- **Sections:** 簡單來說 · 我們如何找出過境 · 標籤的意思 · 我們的盲點 · 隱私 (HK 私隱) · 致謝 (HK 鳴謝) · 鍵盤.
  我們的盲點 (What we can't see) is short for the narrow index column and quietly uncanny; 我們看不到的 ended on a
  dangling 的.
- **The short version:**
  - 是即時的嗎？ / 不完全是。照片在拍攝後幾小時到一兩天才會進入影像庫，所以最新的過境可能還沒有照片。 (HK 一兩日)
  - 它看得到我嗎？ / 看不到。這裡的一個像素最細也有 10 m 寬，一輛車只佔一個像素。畫面裡認不出你。
  - 這是全部的衛星嗎？ / 不是。軍事和偵察衛星大多不在公開目錄裡，商業公司也不會說明鏡頭對準哪裡。
- **Privacy:** §8, translated exactly, promising nothing more or less.
- The rest of the page: Appendix A.

---

## 4. Glossary

### 4.1 Terms

Counters (量詞) are given with each noun. HK forms are in §1.4.

| English | zh-Hant | Notes |
|---|---|---|
| satellite | 衛星 | Counter 顆 (`256 顆衛星`). Never 人造衛星 (long), 枚 (literary). Unknown: 一顆衛星; as a subject 有一顆衛星. |
| pass (noun) | 過境 | Counter 次 (`31 次過境`). At airports 過境 is transit: always in a satellite context. |
| to pass, to cross | 經過, 飛過 | 飛越 for "fly over" in compact copy and the overhead card. |
| to watch (product verb) | 注視 | 注視過 everywhere, the hero and its hook included; 注視了 post only. Never 監視, 監控, 盯, 凝視 (too literary), 看見 (claims success), 拍攝 / 拍下 as the verdict. |
| likely watched | 很可能注視過 | Lane 很可能. |
| could have pointed here | 或許曾對準這裡 | Lane 或許. |
| passed overhead | 從上空經過 | Lane 上空. |
| swept over | 掃過 | Likely's prose verb. |
| passed within view (of) | 經過時在可視範圍內; [PLACE] 在它的可視範圍內 | Could's verb. Never 經過時可看到 (reads as a claim). |
| within view, in range, In view | 可視範圍 (`在可視範圍內`) | The one word. Never 可觀測範圍, 視野. |
| field of regard | 可轉向範圍 | `可轉向範圍 ±45°`. Only this readout. |
| photo | 照片 | Counter 張. An optical photograph only. |
| image | 影像 | Counter 張. Any satellite image: photo, mosaic, radar, full disc. |
| picture (graphic file) | 圖片 | The card, the PNG (複製圖片). Never for satellite data. |
| public image | 公開影像 | |
| made public, published | 公開 | Never 發佈 (posting), 發表 (papers), 出版 (books). |
| archive | 影像庫 | Never 存檔, 檔案庫, 典藏, 資料庫 / 數據庫. |
| scene | 影像; 原圖 against the crop | Never 場景, 景, 景色, 全景. Unit after a scene's cloud cover: 原圖. |
| crop | 裁切 | `以你選的地點為中心裁切`. |
| swath | 掃描帶 | `290 km 寬的掃描帶`. Never 刈幅, 幅寬. |
| off-nadir | 側視角 (label); 偏離正下方 (prose) | `側視角 8.9°`; `它當時的視線偏離正下方 12.3°`. |
| straight down, nadir | 正下方; 天底 | 天底 is for reviewers; never in UI. |
| ground track | 地面軌跡 | Not 星下點軌跡. |
| orbit | 軌道 | Counter 條 (`412 條軌道`). 軌跡 is a track. |
| altitude / elevation | 高度 / 仰角 | Never 高度 for elevation. |
| sun elevation | 太陽仰角 | |
| ground speed / speed | 地面速度 / 速度 | |
| heading | 航向 | |
| ascending / descending | 升軌 / 降軌 | Replace Asc / Desc. |
| ground distance | 地面距離 | |
| closest (distance readout) | 最近距離 | Only as this compound. |
| closest approach (moment) | 最接近 | `最接近 · UTC`, `最接近 · 當地`, `最接近 · SENTINEL-2C`; row prefix `最接近 `. |
| window (time) | 時段 | Never 視窗 / 窗口. |
| cloud cover | 雲量 | `雲量 25%`. |
| clear (cloud-free) | 無雲 | Never 清晰 (sharp, legible) for this sense. |
| clear look (countable) | 無雲影像 | Counter 張 (`11 張無雲影像`). |
| closest look | 最清晰的一張 | The gallery's lead: most detailed AND clear, so 清晰 is honest here. Never 一眼 as a noun. |
| last clear look | 最近一張無雲影像 | From before the week. |
| cirrus / thin cirrus | 卷雲 / 薄卷雲 | |
| cloud shadow | 雲影 | |
| clouded over | 雲層遮蔽 | Not 多雲 (a forecast word). |
| cloud at spot | 地點雲況 (readout label); 地點有雲 (chip) | |
| pixel | 像素 | `每像素 10 m`. Not 畫素. |
| resolution | avoided | Say `每像素 10 m`. |
| radar | 雷達 | Radar image 雷達影像, never 雷達照片. Radar never 拍. |
| weather mosaic | 氣象拼接影像 | Never 馬賽克 (censoring pixelation). |
| daily mosaic | 每日拼接影像; tag 每日拼接 | Readout "Mosaic pixel": 拼接像素. Unit: 拼接. |
| true colour | 真實色彩 | Plain in both regions. HKO writes 真彩, CWA 真實色, computing 真彩色: none of those. |
| geostationary | 地球同步 | `地球同步氣象衛星`; timeline lane 同步軌道. What both the Hong Kong Observatory (地球同步衛星) and CWA (同步衛星) say; every geostationary satellite is geosynchronous, so it is accurate. 地球靜止 may appear once in About as the precise term. |
| full disc | 全圓盤 | The disc the satellite sees: `地球圓面` in prose. CWA labels this view 全景 and HKO 全球; we keep 全圓盤 because 全景 means "panorama" (a phone camera mode) to everyone else. Reviewers: do not "correct" it. |
| scan line | 掃描線 | The pushbroom counter `LINE 0412 → 1024`: `掃描行 0412 → 1024`. |
| infrared / visible / colour (band) | 紅外線 / 可見光 / 彩色 | Label "Band": 波段. |
| pan-sharpened | 以 Landsat 的 15 m 黑白波段銳化 | Avoids 全色態 (TW) / 全色 (HK). |
| render, rendering | 產生, 製作 | `製作中 42%`, `仍在產生影像`. Avoids 算繪 / 渲染. |
| on demand | 收到請求才產生 | Never 即時 (that is "Live"). |
| time-lapse | 縮時影像 | Both regions. Never 延時攝影. One form only. |
| frame (time-lapse) | 張 | `第 3 張，共 11 張`. Not 幀. |
| replay | 重播 | `開始重播` / `暫停重播` (never 播放重播). HUD "Scene" during a replay: 重播. |
| catalog (orbits) | 軌道目錄 | Not 型錄. |
| objects (in the catalog) | 物體 | Counter 個 (`16,893 個物體`). Never 天體. |
| orbital elements | 軌道根數 (readouts, the app's progress row); 軌道資料 (prose) | `軌道資料已是 3 天前的`. |
| TLE / epoch | TLE / 曆元 | `TLE 曆元 2026-11-08 03:15Z`. |
| data | 資料 | 公開資料, 軌道資料. Never 數據 (mainland-leaning in Taiwan). |
| sub-solar point | 太陽直射點 | HUD label 太陽. |
| terminator | 晨昏線 | |
| day / twilight / night (readout) | 日間 / 晨昏 / 夜間 | Prose: 白天, 天黑, 在黑暗中. |
| steerable camera | 可轉向鏡頭 | 鏡頭 for a satellite's viewpoint; 相機 for the device. |
| private / commercial operator | 私人營運商 / 商業公司 | 私營 as an adjective (`私營的鏡頭`). |
| operator | 營運商 | |
| crewed station | 載人太空站 | Never 空間站. |
| weather / imaging satellite | 氣象衛星 / 成像衛星 | |
| military / spy satellite | 軍事衛星 / 偵察衛星 | Never 間諜衛星 (§8). |
| place / your spot | 地點; 你選的地點 (prose), 地點 (labels) | The person searched it; they may not be there. |
| drop a pin / pin | 放置圖釘 / 圖釘 | |
| globe | 地球 | Never 地球儀. `在地球上按一下`. |
| plan view / geometry | 平面圖 / 幾何 | `過境幾何`. |
| report | 結果 | `結果已就緒`. |
| propagate orbits | 推算軌道 | |
| match scenes to passes | 配對影像與過境 | |
| imaged / acquired (globe, capture line) | 成像 / 已成像 | `成像 11:21:13 EST`, `已成像 11:21:21 EST · 10 m`, `成像 · SENTINEL-2C`. Never 擷取 (screen capture in Taiwan). |
| acquiring (a photo loading) | 接收中 | Honest: the image is downloading; still instrument-like. |
| developing (frames) | 顯影 | The darkroom word. |
| share / download | 分享 / 下載 | |
| copy link / copy image | 複製連結 / 複製圖片 | |
| save PNG / save video | 儲存 PNG / 儲存影片 | |
| post (noun) | 貼文 | HK 帖文. |
| post to X | 發佈到 X | |
| link / short link / direct link | 連結 / 短連結 / 直接連結 | |
| card | 卡片 | |
| search a place | 搜尋地點 | Never 搜索. |
| use my location | 使用我的位置; short 我的位置 | |
| locating | 定位中 | |
| surprise me | 隨機地點 | |
| how this works | 運作原理 (HUD) | About title: 這一切如何運作。 |
| last 7 days | 過去 7 天 | HK 過去 7 日. Never 最近 7 天. |
| this week / that week | 這星期 / 那個星期 | |
| local time | 當地時間 | Only where the English says "local" with no zone. |
| UTC | UTC | Never 協調世界時 / 格林威治時間. |
| ago / in | …前 / …後 | `41 小時前`, `3 小時後`. Never 昨天 / 前天. |
| just now | 剛剛 | |
| seconds / minutes / hours / days | 秒 / 分鐘 / 小時 / 天 | HK 日. No Latin abbreviations. |
| km, m, km/s | km, m, km/s | Never 公里 / 公尺 / 米 in a number span. |
| coordinates | 座標 | HK 坐標. Hemisphere letters in readouts; 北緯 / 南緯 / 東經 / 西經 in prose. |
| privacy | 隱私 | HK 私隱. |
| the stored location | 約 10 km 範圍的大致位置 | A 0.1° grid cell: never 見方 (not square in km), never 網格 alone (the whole grid). |
| geocoder | 地理編碼服務 | |
| browser / encoder | 瀏覽器 / 編碼器 | |
| cookie | Cookie | Latin, as both regions' privacy notices write it. Never 小甜餅, 曲奇. |
| bot | 自動程式 | |
| glacier / melt season | 冰川 / 融冰季 | |
| seasons | 春季, 夏季, 秋季, 冬季 | `每年秋季一張`. |
| live | 即時 | Never 直播. |
| stale / fetched | 已過時 / 更新於 | `更新於 2026-11-08 03:34Z · 4 小時前`. |
| fault | 故障 | The notice's label. |
| try again / retry / cancel / close / back | 再試一次 / 重試 / 取消 / 關閉 / 返回 | |
| previous / next | 上一張 / 下一張 (photos); 上一次 / 下一次 (passes) | |
| zoom in / out | 放大 / 縮小 | |
| play / pause | 播放 / 暫停 | |
| collapse / show fewer | 收起 | |
| recent (searches) | 最近搜尋 | 最近 means recency; with "closest" moved to 最清晰 / 最接近 / 最近距離, its two uses (最近搜尋, 最近一張) are both recency. |
| shared with you | 有人分享給你 | |
| Watched (brand) | Watched | Never translated, never 「」-quoted, never glossed. |

### 4.2 Compass

| Use | Words |
|---|---|
| Prose, 8 points | 北, 東北, 東, 東南, 南, 西南, 西, 西北 (east / west first: 東北, never 北東) |
| Movement | `向南移動`, `向東北移動`, `向西北經過` |
| Offset from the place | [DIR]方 [DIST] 處: 北方, 東北方, 東方, 東南方, 南方, 西南方, 西方, 西北方 (`西方 61 km 處`) |
| In your sky | `你西北方天空`, then `仰角 54° 處` |
| Readouts, 16 points | 北, 北北東, 東北, 東北東, 東, 東南東, 東南, 南南東, 南, 南南西, 西南, 西南西, 西, 西北西, 西北, 北北西 |
| Heading readout | `194.6° · 南南西 · 降軌` |
| Elevation readout's unit | the compass word alone (`南南西`): the label already says 仰角 |
| Scan direction | `北 → 南`, `南 → 北` |

Never Latin `SSW` in a Chinese readout: few readers decode it.

### 4.3 Curated places (`places` namespace)

Labels use the established Chinese name; sublabels run from large to small with no commas, the way Chinese writes an
address (a comma only between two unlike parts). Country names match what Intl prints for zh-Hant-TW (base) and
zh-Hant-HK (overlay). Chips exist only for the first three. The English labels stay what usage stats, `record_lookup` and
links keep, so translated labels change only what is shown.

| id | Chip | Label | Sublabel | HK overlay |
|---|---|---|---|---|
| area51 | 51區 | 51區 | 美國內華達州格魯姆湖 | |
| centralPark | 中央公園 | 中央公園 | 美國紐約 | |
| giza | 吉薩 | 吉薩金字塔群 | 埃及吉薩 | |
| uluru | | 烏魯魯 | 澳洲北領地 | |
| palmJumeirah | | 朱美拉棕櫚島 | 阿聯酋杜拜 | |
| worldIslands | | 世界群島 | 阿聯酋杜拜 | |
| grandCanyon | | 大峽谷 | 美國亞利桑那州 | |
| meteorCrater | | 巴林傑隕石坑 | 美國亞利桑那州 | |
| lowerManhattan | | 下曼哈頓 | 美國紐約 | |
| lasVegasStrip | | 拉斯維加斯大道 | 美國內華達州 | |
| hooverDam | | 胡佛水壩和米德湖 | 美國內華達州和亞利桑那州 | |
| goldenGate | | 金門大橋 | 美國舊金山 | |
| kennedySpaceCenter | | 甘迺迪太空中心 | 美國佛羅里達州 | |
| washingtonDc | | 華盛頓特區 | 美國國家廣場 | |
| mountStHelens | | 聖海倫火山 | 美國華盛頓州 | |
| niagaraFalls | | 尼加拉瀑布 | 加拿大安大略省 | 尼亞加拉瀑布 |
| panamaCanal | | 巴拿馬運河 | 巴拿馬加通船閘 | |
| rioDeJaneiro | | 里約熱內盧 | 巴西，麵包山和科帕卡巴納 | |
| paris | | 巴黎 | 法國法蘭西島 | |
| venice | | 威尼斯 | 義大利威尼托 | 意大利威尼托 |
| vesuvius | | 維蘇威火山 | 義大利拿坡里 | 意大利那不勒斯 |
| istanbul | | 伊斯坦堡 | 土耳其博斯普魯斯海峽 | 伊斯坦布爾 |
| chernobyl | | 車諾比 | 烏克蘭基輔州 | 切爾諾貝爾 |
| tableMountain | | 桌山 | 南非開普敦 | |
| kilimanjaro | | 吉力馬札羅山 | 坦尚尼亞吉力馬札羅區 | 乞力馬扎羅山 · 坦桑尼亞乞力馬扎羅區 |
| everest | | 聖母峰 | 尼泊爾和中國邊境 | 珠穆朗瑪峰 |
| angkorWat | | 吳哥窟 | 柬埔寨暹粒 | |
| singapore | | 新加坡 | 新加坡濱海灣 | |
| hongKong | | 香港 | 香港維多利亞港 | |
| tokyo | | 東京 | 日本東京 | |
| fuji | | 富士山 | 日本靜岡縣 | |
| sydneyHarbour | | 雪梨港 | 澳洲雪梨 | 悉尼港 · 澳洲悉尼 |
| richat | | 理查特結構 | 茅利塔尼亞撒哈拉沙漠 | 毛里塔尼亞撒哈拉沙漠 |
| greatBlueHole | | 大藍洞 | 貝里斯燈塔礁 | 伯利茲燈塔礁 |
| boraBora | | 波拉波拉島 | 法屬玻里尼西亞社會群島 | 法屬波利尼西亞社會群島 |
| hardyReef | | 哈迪礁 | 澳洲大堡礁 | |
| male | | 馬列 | 馬爾地夫北馬列環礁 | 馬累 · 馬爾代夫北馬累環礁 |
| deadSea | | 死海鹽田 | 以色列和約旦，死海南部 | |
| binghamCanyon | | 賓漢峽谷銅礦 | 美國猶他州 | |
| mountWhaleback | | 惠爾巴克山鐵礦 | 澳洲皮爾巴拉 | |
| etna | | 埃特納火山 | 義大利西西里島 | 意大利西西里島 |
| santorini | | 聖托里尼 | 希臘基克拉澤斯群島 | |
| teide | | 泰德峰 | 西班牙特內里費島 | |
| kilauea | | 基拉韋亞火山 | 美國夏威夷州 | |
| craterLake | | 火山口湖 | 美國奧勒岡州 | 美國俄勒岡州 |
| glenCanyonDam | | 葛倫峽谷水壩 | 美國亞利桑那州佩吉 | |
| gardenCity | | 花園城圓形灌溉農田 | 美國堪薩斯州 | |
| almeria | | 阿爾梅里亞溫室群 | 西班牙安達魯西亞 | |
| gibraltar | | 直布羅陀 | 直布羅陀海峽 | |
| suezCanal | | 蘇伊士運河 | 埃及伊斯梅利亞 | |
| aswanDam | | 亞斯文高壩 | 埃及納瑟湖 | 阿斯旺高壩 · 埃及納賽爾湖 |
| wadiRum | | 瓦地倫 | 約旦阿卡巴 | |
| sossusvlei | | 索蘇斯鹽沼 | 納米比亞納米布沙漠 | |
| victoriaFalls | | 維多利亞瀑布 | 尚比亞和辛巴威 | 贊比亞和津巴布韋 |
| threeGorges | | 三峽大壩 | 中國湖北 | |
| shanghai | | 上海 | 中國上海黃浦江 | |
| itaipu | | 伊泰普水壩 | 巴西和巴拉圭 | |

Traps:

- **Golden Gate is never bare 金門**: in Taiwan that is Kinmen island. Always 金門大橋.
- **Garden City "crop circles"** are centre-pivot irrigation fields: never 麥田圈 (the UFO hoaxes).
- **Meteor Crater** is 巴林傑隕石坑, not 流星坑.
- **Hong Kong's sublabel** is 香港維多利亞港, with no 中國 prefix and no 特別行政區 (§8).
- **Everest**: 聖母峰 is Taiwan's name, 珠穆朗瑪峰 the name Hong Kong writes; neither is qualified further.
- **UAE** in sublabels is the short form 阿聯酋, which both regions write (Intl's long forms differ: 阿拉伯聯合大公國 /
  阿拉伯聯合酋長國).
- **51區** is a proper name written without a space by established usage: the one exception to the Han–digit space.
- Gazetteer and geocoder names are data and are never translated.

---

## 5. Grammar strategies for runtime slots

### 5.1 [PLACE]: inserted as it comes

Chinese inflects nothing, so a name drops in as a bare noun. The risks are elsewhere.

- **Spacing comes from code, not from the catalog's literal spaces.** Each message calls `cjkGap(before, after)`
  (Appendix B.4) at the slot's edges: `' '` when one side ends in Han and the other starts with a Latin letter, digit or
  symbol; `''` when either side is a space, Han or full-width punctuation. So `注視過 Waterloo。`, `注視過九龍。`,
  `從 Waterloo 上空`, `從九龍上空`. Never a space before 。，、：；？）」.
- **No English article logic.** `placeInProse` / `placeParts` add "the" for oceans and deserts; the zh catalog never calls
  them: `Pacific Ocean` is used bare.
- **No added suffix.** Never append 市, 島, 一帶, 地區: the code cannot know the place type, and 九龍市 is wrong.
- **Positions that work after any name:** subject (`Waterloo 在它 24 km 寬的掃描帶內`), object (`注視過 Waterloo`), the
  locative `[PLACE] 上空` (`從 Waterloo 上空經過`), and the share-title heading (`是什麼注視過 [PLACE]`). Avoid
  `在 [PLACE] 裡` and `[PLACE] 的…` chains.
- **Sentence start.** English code capitalises a place that opens a sentence (`cap()`); harmless for Han and Latin, but
  never rely on it.
- **Truncation.** The card cuts a place at 48 code points with `…` and drops a trailing 。 in the place's block; a frame
  with the place first keeps its 。 in the text block.
- **The "where" line** (`geo.where`): `rest` is opaque English data, small to big ("Ontario", "Paris, Île-de-France");
  only the country is localised. Keep that order: `${rest}，${country}` → `Ontario，加拿大`, `Paris, Île-de-France，法國`.
  Alone: the country. Never reorder `rest`.
- **Curated places** are copy with native sublabels (§4.3).
- **Han-typed searches** (a cost and speed trap, Appendix B.13). The offline list keys places by Latin letters, so a
  search typed in Chinese (台北, 九龍, 旺角, 東京) finds nothing offline and always goes to Open-Meteo, then Photon, which
  are asked in English. The headline then reads `注視過 Taipei` after the person typed 台北. Every frame here must read
  well with an English name after Han text; test with both.

### 5.2 [SAT] as subject

- Chinese verbs do not agree and nouns have no gender: any frame works for any satellite name.
- The pronoun is **它**, never 他 / 她 / 牠. At most once per paragraph; after that, drop the subject.
- No counter before a proper name (`一顆 Sentinel-2C` is wrong). Never 該衛星 (officialese).
- Names stay exactly as the catalog spells them (`ISS (ZARYA)`, not 國際太空站; `Sentinel-2C`, not 哨兵2C), so the
  sentence matches the readouts and the callouts.
- **A nameless satellite** (`sat` undefined): the sentence says it itself, as its position needs: subject 有一顆衛星
  (`有一顆衛星注視過 Waterloo。`), object 一顆衛星 (`來自一顆衛星`). Only the mono chips and the plan plate's callout
  print the label `aSatellite` (一顆衛星).
- **Names with spaces never break** (`WorldView Legion 4`, `ISS (ZARYA)`): in on-screen Rich messages the catalog joins
  a name's words with U+00A0 (`keepName`, Appendix B.11). Hyphen-plus-digit names (`Sentinel-2C`, `NOAA-21`) are already
  safe (UAX #14). Post text and file names keep plain spaces.
- [SAT] gets its spaces from `cjkGap` like [PLACE]: `Sentinel-2C 注視過`, `有一顆衛星注視過`.
- **Blurbs** (`sats.blurb`): nationality as a plain country word (中國的, 俄羅斯的, 日本的, 德國的, 義大利的 (HK 意大利的),
  西班牙的, 阿根廷的, 加拿大的, 印度的), facts only. A Chinese programme may be called by its official Chinese name once
  (天宮, 天和核心艙, 高分); the catalog name in the slot stays Latin.

### 5.3 [NUM] and plural categories

zh has one CLDR category, `other`. Write one form per message. A zero case is its own sentence where the English
sentence changes. Never port English singular / plural branches (`n === 1 ? …`) or `verdictUnit`'s regex.

Every count is `[NUM]` + counter + noun, the number as a mono span:

| Noun | Form |
|---|---|
| satellites | `[NUM] 顆衛星`; mono `12 顆` |
| images, photos, clear looks, frames | `[NUM] 張影像`, `[NUM] 張照片`, `[NUM] 張無雲影像`, `第 [NUM] 張，共 [NUM] 張` |
| passes, times | `[NUM] 次過境`, `[NUM] 次` (`1 次` and `42 次` alike; never 一次 spelled out for data) |
| objects, results | `[NUM] 個物體`, `[NUM] 個結果` |
| list rows | `[NUM] 項` (`顯示全部 31 項`, `再顯示 40 項`, `還有 12 項`) |
| orbits | `[NUM] 條軌道` |
| years | `[NUM] 年` |
| seconds, minutes, hours, days | `[NUM] 秒`, `[NUM] 分鐘`, `[NUM] 小時`, `[NUM] 天` (HK `[NUM] 日`) |

- "At least": 至少 as a prefix span (§3.3).
- Ordinals: `第 [NUM] 次，共 [NUM] 次` (passes), `第 [NUM] 張，共 [NUM] 張` (photos, frames).
- Words like 一兩天 (HK 一兩日) and 幾小時 are fine in prose where no data number is involved.
- Spelled-out English numbers in prose become digits (`每 6 小時`), as every number in the product is.

### 5.4 Lists of names

- Separator 、 between names, Latin or Han, no spaces around it; the last item joins with 和.
- One name: `Umbra`. Two: `Umbra 和 Capella`. Two plus others: `Umbra、Capella 和另外 [NUM] 顆雷達衛星`.
- Built by hand (`fmt('zh-Hant').list`, Appendix B.5), never `Intl.ListFormat`: its zh-Hant output is `Capella和7 顆` (no
  space) and its HK output uses 及.
- No Oxford comma, no 以及 in short lists (以及 joins clauses).

### 5.5 Dates and times

zh-Hant builds every date, range and duration from the date fields the `time` namespace passes (`p`: year, month, day,
dow with 0 = Sunday), or from `formatToParts` at the place's zone in the card catalog. Never `month: 'numeric'` with
Intl: Taiwan prints `11/1（週日）` and Hong Kong `1/11（週日）`, the same string for different days. Never `formatRange`:
it falls back to numeric patterns (`2026/11/1至2026/11/8`, HK `1/11/2026 至 8/11/2026`) for every option set. Weekdays:
`週` + `'日一二三四五六'[p.dow]` (both regions' Intl say 週日 too). No zero padding in Han dates.

| Message | Form | Example |
|---|---|---|
| `time.day` (rows, captions, the HUD's scene clock) | `${m}月${d}日 週X` | 11月1日 週日 |
| `day` in prose (posts, descriptions) | `${m}月${d}日（週X）` | 11月1日（週日） |
| with the year (share page, card) | `${y}年${m}月${d}日（週X）`; chip `${y}年${m}月${d}日 週X` | 2026年11月1日（週日） · 2026年11月1日 週日 |
| `weekdayShort` | `週X` | 週六 |
| `dayCompact` (48–92 px) | `${d}日` | 1日 |
| `dayMonth` | `${m}月${d}日` | 10月29日 |
| `dayRange` | same month `${m}月${d1}日 → ${d2}日`; across months `${m1}月${d1}日 → ${m2}月${d2}日`; across years with both years | 11月1日 → 8日 · 10月29日 → 11月5日 · 2026年12月29日 → 2027年1月5日 |
| `daySpoken` | `${m}月${d}日星期X` | 11月6日星期五 |
| `stamp` (mono row) | `${day} · ${time} ${zone}` | 11月1日 週日 · 11:21 EST |
| `landing.windowRange` (kicker) | `${y}年${m}月${d1}日 → ${d2}日 UTC`; across months `${y}年${m1}月${d1}日 → ${m2}月${d2}日 UTC`; across years both years | 2026年11月1日 → 8日 UTC |
| `relative` / `relativeSpoken` | `剛剛` for unit `'second'` (from the catalog); else `relativeFormat(intlTag, 'short', 'always')` | 剛剛 · 12 分鐘前 · 41 小時前 · 2 天前 (HK 2 日前) · 3 小時後 |
| durations | `${s} 秒` · `${min} 分 ${ss} 秒` · `${h} 小時 ${mm} 分` (padded: these are mono readouts) | 38 秒 · 4 分 12 秒 · 1 小時 02 分 |
| `atSea` | `${zone} · 海上` | UTC−9 · 海上 |
| `timelapse.date` / `dayMonth` | `${y}年${m}月${d}日` / `${m}月${d}日` (UTC) | 2015年10月22日 · 10月22日 |
| `landing.elapsed` | `${ss} 秒` | 04 秒 |

- Never `numeric: 'auto'`: it says 現在, 昨天, 前天 (HK 昨日, 前日). An instrument says `30 小時前`, not "yesterday". Hours
  up to 48, as in English.
- In sentences: time takes 於 before the verb (`於 16:14:21 UTC 從…飛過`); place takes 在 (`在 705 km 高空`). "about
  07:49": `約於 07:49 CET`. "since 2015": `2015 年起`. "between 29 Oct and 5 Nov": `10月29日至11月5日`.
- A zone follows the clock as the code gives it (`EST`, `CET`, `HKT`, `UTC+8`); never translate a zone.

---

## 6. Typography and formatting

### 6.1 Punctuation

| Mark | Use |
|---|---|
| ，。、：；？ | Full-width in every Chinese sentence, even next to Latin (`Waterloo。`). |
| （） | Full-width in Chinese text, even around Latin contents: `（Sentinel-2、Landsat，10–30 m）`. Half-width only inside a Latin name (`ISS (ZARYA)`). |
| 「」 then 『』 | Quotation marks in both regions. Never “ ” or " " in Chinese text. `我們就稱為「或許曾對準這裡」。` |
| … | U+2026, one, only after a verb in a busy state (`下載中…`, `正在建立連結…`): the same mark the English UI shows, from the brand face. Prose never uses an ellipsis (the English has none). Never `...`, `⋯` or `……`. |
| — | Never: neither `——` nor an em dash (the owner's copy has none). Use ： or ，. |
| – | Only between two numbers: `10–30 m`, `2015–2026`. In words: 至 (`30° 至 45°`). Never `～`. |
| ／ | Full-width slash for alternatives in Chinese text (`上一張／下一張`). The section notch keeps its half-width slash with spaces: `02 / 過境`. |
| · | U+00B7 with a space on each side, the design's separator, from the brand faces. No leading space after `）` or `」`: `（Sentinel-1，20 m）· 2 張`. Never `‧`, `・` or `•`. |
| ！ | Never. |
| Apostrophe | None in Chinese: "NASA's" is `NASA 的`. |
| Half-width , . : ; ? inside Chinese text | Never (a common IME slip). Exception: the coordinate examples the search field parses (`43.47, −80.54`, `緯度, 經度`). |

Full-width punctuation sits centred in the em box in both Taiwan and Hong Kong. That depends on the font and the lang: a
TC or HK family, or a pan-CJK font under `lang="zh-Hant*"`, centres the marks; an SC family or `lang="zh-CN"` drops them
bottom left (§6.10).

### 6.2 Spaces

- One half-width space between Han and a Latin letter, and between Han and an Arabic digit: `有 256 顆衛星`,
  `Sentinel-2C 注視過`, `每像素 10 m`.
- None next to full-width punctuation, on either side.
- **A date token is one unit.** Inside it, no spaces (`11月1日`, `2026年11月1日`, and a range `10月29日至11月5日`). Before a
  token that starts with a digit, a space when Han precedes it (`截至 2026年11月1日`, `於當地時間 11月1日（週日）`); after a
  token that ends in 日, no space before Han (`11月5日至`, `10月29日至11月5日，有…`).
- Number and unit: one space for `km`, `m`, `km/s` and Han time units (`10 分鐘`); none for `%` and `°`.
- Mono row prefixes keep a trailing space (`最新 `, `最接近 `): the value after them starts with a digit.
- Never full-width spaces (U+3000). The only hand-typed no-break space is the one joining a satellite name's words
  (§5.2); a number's no-break comes from its span.
- The spaces live in the strings and `cjkGap`. `text-autospace: normal` is set for zh where browsers support it and adds
  nothing where a space already exists; never rely on it.

### 6.3 Numbers and units

- Half-width Arabic digits always. Never full-width digits, never Chinese numerals for data, never 萬 / 億 (no compact
  notation: Intl would print `1.2萬`, and HK `12K`).
- Grouping comma from 1,000 (`1,715`, `35,778`; `fmt('zh-Hant').int`). Decimal point `.` (`fmt('zh-Hant').dec`).
- Percent `25%`. Degrees `12.3°`, `±45°`. Minus sign U+2212 where the English uses it (`T−00:42`, `−80.54`).
- SI symbols in every number span, prose included (`786 km`, `7.46 km/s`, `20 m`), smaller and in `--bone-3`, as in
  English. Intl's unit style (`786 公里`) is not used.
- Approximately: `約` in prose (`約 10 km`), `≈` in readouts (`≈ 07:49`).

### 6.4 Dates

| Use | Format | Example |
|---|---|---|
| Rows, captions, the HUD's scene clock | M月D日 週X | 11月1日 週日 |
| Prose (posts, share page) | M月D日（週X）, with the year on the share page | 11月1日（週日） · 2026年11月1日（週日） |
| Mono chips with the year (card stamp, `weekTo`) | YYYY年M月D日 週X | 2026年11月1日 週日 · 11:21 EST |
| Spoken (screen readers) | M月D日星期X | 11月6日星期五 |
| The kicker (mono, scrambles) | YYYY年M月D日 → D日 UTC | 過去 7 天 · 2026年11月1日 → 8日 UTC |
| HUD and catalog stamps | ISO, unchanged | 2026-11-08 03:15Z |
| Timeline labels | 週X (first day) · D日 (compact) | 週六 · 1日 |

Rules and builders: §5.5. Never a numeric short date: the same string means different days in Taipei and Hong Kong.

### 6.5 Time

- 24-hour always (`hourCycle: 'h23'`): `16:14:21`, `07:49`. Never 上午 / 下午: both regions' Intl default to the 12-hour
  clock (`下午12:00`), so pass the option.
- Relative times and durations: §5.5. Prose writes unpadded minutes (`1 小時 2 分`); the padding stays in mono readouts.

### 6.6 Coordinates and compass

- Readouts keep hemisphere letters and fixed widths: `太陽 12.4°S 118.2°E`, `25.11°N 55.14°E`.
- Prose puts the hemisphere word first: `西經 0.2°`, `北緯 25.1°`.
- Compass words: §4.2.

### 6.7 Case, mono labels and scrambled strings

- Han has no case. `text-transform: uppercase` touches only the Latin inside a label, units aside, as in English: `786 km`,
  `10 m`, `SENTINEL-2C · MSI · 10 m`. Expected. Write units and names in normal case; CSS does the rest.
- **Han is allowed in mono labels and readouts.** It renders in the system sans through `--font-mono`'s fallback. A zh
  mono label looks like: `高度`, `側視角`, `像素`, `02 / 過境`, `最接近 · UTC`, `NORAD · 過境`, `過去 7 天`.
- **Strings that scramble** on first appearance (`ScrambleOnce`): the landing kicker (`windowRange`), the HUD's sun readout
  (`太陽 16.2°S 063.0°E`) and object count (`16,893 個物體`), the results header's coordinates, NORAD ids. Their Han
  settles at once while digits and Latin scramble: that needs the one-condition change to `scrambleFrame`
  (Appendix B.6), a listing precondition. Without it, Han would cycle through half-width Latin glyphs and the line would
  jump in width.
- Never uppercased: `www.watched.earth`, `@armaangupt0`, satellite names in prose, `km/s` in prose. Prose is never in a
  caps style.
- Han is never italic. The English italic accent becomes the upright serif (§6.10).
- Emphasis: bold only where the English bolds. Never 「」, a colour change or italics for emphasis.

### 6.8 Line breaking

- Chinese may break between any two Han characters.
- Kinsoku: never start a line with 。，、：；？）」』 and never end one with （「『. `line-break: strict` is set for zh.
- Never `word-break: keep-all` for zh: it treats a Han run as one word.
- Never break between a number and its unit (the mono span is nowrap), inside a satellite name (U+00A0, §5.2), inside a
  date token, or inside the results headline's bold phrase and place (nowrap).
- Headlines `text-wrap: balance`; paragraphs `text-wrap: pretty`, so no line ends with a lone character.
- The hero's three lines are fixed spans; the browser never re-breaks them.

### 6.9 Abbreviations

- Chinese words are never abbreviated and Chinese text has no abbreviation periods.
- Replacements: Asc / Desc → 升軌 / 降軌; min / h / d → 分鐘 / 小時 / 天; SSW → 南南西; "S" (seconds, locating timer) → 秒;
  "sats" → 顆.
- Kept: UTC, TLE, GMST, NORAD, km, m, km/s, N / S / E / W in coordinates, the photo's north `N`, sensor and product names,
  key caps (`Esc`, `Enter`, `Space`, `F`).

### 6.10 Type (measured in the CJK type study; zero cost)

A Traditional Chinese web font is megabytes even subset, and place names cannot be subset in advance. So the Han sans is
always the device's own, and the only Chinese bytes shipped are the static accent glyphs, about 2 kB inside the zh-Hant
chunk the boot script already modulepreloads. The numbers below are the study's and are already the CJK tokens in
`src/styles/scripts.css`; this guide does not set its own.

**Font stacks** (`src/styles/scripts.css`)

- `:root:lang(zh-Hant)` (Taiwan and the default), as shipped: sans `'PingFang TC', 'PingFang HK', 'Microsoft JhengHei',
  'Noto Sans TC', 'Noto Sans HK', 'Noto Sans CJK TC', 'Source Han Sans TC', sans-serif`; serif `'Songti TC', 'Noto Serif TC',
  'Noto Serif CJK TC', 'Source Han Serif TC'`, then the sans stack.
- `:root:lang(zh-Hant-HK)`, added after it (Appendix B.1): sans `'PingFang HK', 'PingFang TC', 'Microsoft JhengHei',
  'Noto Sans HK', 'Noto Sans CJK HK', 'Source Han Sans HC', 'Noto Sans TC', 'Noto Sans CJK TC', sans-serif`. The browser
  takes the first installed family whatever the lang, so one stack starting with PingFang TC would give Hong Kong the
  Taiwan glyph shapes.
- The serif stack has **no PMingLiU, MingLiU or MingLiU_HKSCS** and no generic `serif`: those are thin 1990s screen Song
  faces that look dated at 44–128 px. Where no good Chinese serif is installed (Windows, most Android phones, iPhones), a
  Han place name falls to the sans.
- Never an SC or JP family before these: their punctuation sits bottom left and some glyph shapes differ.
- `<html lang>` still matters: it drives the generic fallback, the regional forms inside pan-CJK fonts (Noto CJK,
  Source Han) and Intl.

**Tokens** (the values measured for every CJK language; `data-script='cjk'`)

| What | Latin (app) | zh-Hant | Token |
|---|---|---|---|
| Display size | `clamp(44px, 7.2vw, 128px)` | 0.8 × desktop, 0.9 × phone (≤ 760 px) | `--display-k: .8` / `.9` |
| Display weight | 520–600 | 600 (PingFang Semibold, JhengHei Bold) | `--w-display: 600` |
| Display leading | 0.92 | 1.10 | `--lh-k: 1.2` |
| Display tracking | −0.02em | −0.01em + `font-feature-settings: 'palt'` | `--track-display`, `--feat-display` |
| Results headline | 34 px, 540 / strong 560 | 27 px, 500 / strong 600, leading about 1.2 | `--fs-panel-h: 27px` |
| Second line | 22 px | 18 px, 500 | `--fs-panel-sub: 18px` |
| Body | 15 px / 1.5 | 15 px / 1.75 | `--lh-text-k` |
| Mono labels | 10.5 px (phone 11), +0.08em, 400 | 12 px desktop and phone, +0.10em, 500 | `--fs-label: 12px`, `--track-label: .1em` |
| Accent size | 1.08em (hero), 1.16em (headline) | 1.04em / 1.11em | `--accent-k: .96` |
| Hero and About accent | Instrument Serif italic | Noto Serif TC 500 subset (你 運 作), upright, signal | `'Watched Accent'` |
| Place accent | Instrument Serif italic | Latin: unchanged. Han: the platform serif, else the sans, at 400, in `--bone` against the headline's `--bone-2` | `:root:lang(zh-Hant) { --w-serif: 400 }` |

- Never a weight between 501 and 599: system CJK fonts round those up to Semibold or Bold.
- **The place accent's fallback.** On iPhones (no Chinese serif) a Han place such as 九龍 sets in PingFang. At 400 it
  reads lighter than the 600 count phrase and brighter than the `--bone-2` words around it, so it stays marked. 400 changes
  nothing where the serif exists (Songti TC has no Medium, so 500 already drew its Regular), and nothing for the hero,
  whose subset face covers 400–700 with its one 500 file.
- **No faux italic.** `font-synthesis-style: none` is set for `data-script='cjk'`. A slanted 你 looks broken. Weight
  synthesis stays on.
- **The accent subset** is built by `scripts/build-accent-fonts.py` from the `accent('…')` literals in the zh-Hant catalog
  (你, 運, 作), Noto Serif TC (OFL) at 500, no hinting, no layout features: about 2 kB of WOFF2 (你 alone is 824 B). It
  rides as base64 inside the zh-Hant chunk and is installed with `FontFace` before the first render (`startLocale`): no
  request, no swap, no cold-cache race. Cap: 2 kB. Never extend it to place names. Its OFL notice goes with the other
  font notices.
- **Share cards** draw Han from a Noto Sans TC subset of the card's exact characters, fetched by the server per uncached
  card (`api/_lib/fallbackFonts.ts`). With Appendix B.3 that is one family (`lang: 'zh-TW'` on the card root), one weight
  (500): zh copy adds nothing else. Keep card copy short and fixed: every distinct character is part of that request. On
  the card the Han accent is sans, in signal: accepted.
- **Latin and digits** inside a display line stay Instrument at 75% width.
- **The share PNG and the time-lapse video** draw with the active script's faces (canvas: system fonts); Han needs no
  uppercase (`toLocaleUpperCase` leaves it alone).

---

## 7. Length discipline

zh-Hant runs at about 35 to 50% of the English character count. Set in the body face it takes roughly 70 to 90% of the
English width (lengthFactor ≈ 0.8 by width), because each Han character is a full em. Against the mono caps labels
(wide letters plus tracking) Chinese labels are narrower, even at 12 px. What can overflow: display lines beside the
condensed Latin face, the share card's 466 px column, and sentences dominated by long Latin satellite and place names,
which Chinese cannot shorten.

- Labels: 2 to 4 characters, nouns, no 的, no pronoun (使用我的位置 → 我的位置 for the short form).
- Buttons: verb + object, at most 6 characters; drop 一下, 請, 這個.
- Chips: one noun phrase; `·` instead of a clause.
- Never pad a short label to fill the space English used.
- When a phrase is still too long, change the word, not the font size (側視角, not 偏離天底角).

**The share card** (`headlineSize`, once it measures width, Appendix B.2). Han and full-width punctuation are 1 em, Latin
and digits about 0.5 em. At 84 px the 466 px column holds about 5.5 Han a line; at 72 px 6; at 62 px 7; at 54 px 8.

| Lead | em | Size |
|---|---|---|
| `有 7 顆衛星注視過` | ≈ 7.5 | 84 px, 2 lines |
| `這星期，有 31 顆衛星注視過` | ≈ 12.5 | 72 px, 2 lines |
| `這星期，我們追蹤的衛星沒有一顆注視過` (the longest) | 18 | 62 px, 3 lines |
| `WorldView Legion 4 經過時…` | not used: could is place first | |

Rule: no zh card lead longer than 18 em, and never a word on the card that the results headline lacks.

| English | zh-Hant | Chars | Notes |
|---|---|---|---|
| SURPRISE ME | 隨機地點 | 4 | 給我驚喜 is a calque; 碰碰運氣 promises luck. Aria: `隨機地點：隨機挑選一個著名地點`. |
| USE MY LOCATION | 使用我的位置 | 6 | Phone and ≤ 400 px chip: 我的位置. Locating: 定位中…; cancel: 取消. |
| HOW THIS WORKS | 運作原理 | 4 | HUD link. About title: 這一切 / 如何*運作*。 |
| LAST 7 DAYS | 過去 7 天 | 4 + digit | HK 過去 7 日. Never 最近 7 天. |
| CLOSEST LOOK | 最清晰的一張 | 6 | Chip and card: keep the 的. |
| LAST CLEAR LOOK | 最近一張無雲影像 | 8 | Fits the ≤ ~20-character chip. |
| TIME-LAPSE | 縮時影像 | 4 | The row, the viewer button and the overlay title. |
| OFF-NADIR | 側視角 | 3 | Prose: 偏離正下方. |
| PIXEL / MOSAIC PIXEL | 像素 / 拼接像素 | 2 / 4 | |
| ALTITUDE | 高度 | 2 | |
| PASSES | 過境 | 2 | Count unit 次過境; notch `02 / 過境`. |
| SHARE | 分享 | 2 | Sheet titles: 分享這次過境 · 分享這張影像 · 分享這星期的結果. |
| DOWNLOAD IMAGE | 下載影像 | 4 | Busy 下載中…; "Open image to save it" 開啟影像以儲存. |
| COPY LINK | 複製連結 | 4 | Done 已複製. |
| REPLAY | 重播 | 2 | Tablet long form `重播**這次過境**`. |
| VIDEO / RENDERING | 影片 / 製作中 42% | 2 / 3 + digits | The 132 px button: 影片 · 製作中 42% · 影片製作失敗 · 儲存影片. |
| SHOW 40 MORE | 再顯示 40 項 | 4 + digits | Never 再顯示 40 次 ("show it again 40 times"). |

---

## 8. Sensitive content

**The product is about being watched.** Keep the uncanny in 注視 and 有東西; keep the facts plain.

- Never 監視, 監控, 偷窺, 偷拍, 跟蹤 (tracking a person), 國安, 情報, 間諜, 境外, 境外勢力-style phrasing. They turn a
  quiet observation into an accusation and are politically charged in both regions. Since Hong Kong's 2024 Article 23
  law, 間諜, 國安, 情報 and 境外 carry legal weight there.
- "Spy satellites" (About) → 偵察衛星, the accurate and neutral term.
- 追蹤 is fine for what we do with satellites (`我們追蹤的衛星`), never for what anyone does to a person.
- Never rank or compare governments' satellites by country, in any copy. Blurbs state one satellite's facts (§5.2).
- "Can it see me?" answers with the fact (`看不到。…畫面裡認不出你。`), never with a joke or comfort.

**Privacy copy**, translated exactly, promising nothing more or less. No reassurance adjectives (絕對安全, 完全匿名, 放心).
"Cookie" stays Latin. The stored location is a 0.1° grid cell: say 約 10 km 的大致範圍 / 約 10 km 範圍的大致位置, never
見方 (it is not square in km) and never 精確位置 for what we keep.

- `kept`: `我們按城鎮和約 10 km 的大致範圍統計搜尋次數，從不記錄你的精確位置，也會統計哪些內容被開啟和分享。不記錄 IP 位址，沒有我們自己的 Cookie，也沒有任何能把你的兩次造訪連起來的資料。` (HK: IP 地址)
- `others`: `大多數地名來自網站內建的清單。其他搜尋會送到 Open-Meteo、Photon 或 Nominatim。照片直接從影像庫載入。我們的主機服務會統計瀏覽次數和速度，不使用 Cookie，但可能設定一個安全 Cookie 來分辨真人和自動程式。我們從不讀取它。`
- `links`: `只在你分享時才會建立。任何拿到連結的人都會看到地名、取整到約 1 km 的位置，以及你選的那次過境。`
- `where`: `軌道計算在你的瀏覽器裡進行。`
- `locatingNote`: `你的位置會傳送到 Photon 地理編碼服務，用來取得地名。我們只記錄約 10 km 範圍的大致位置。`

**Time-lapse in war zones** (Gaza Strip, West Bank, Ukraine, Lebanon). The UI names no war. The caption states the season
only (`11 張無雲影像 · 每年秋季一張`); the place name is whatever the gazetteer returned.

- Never add 戰爭, 戰區, 戰火, 轟炸, 摧毀, 解放, 佔領, 殖民, 恐怖 to any caption, alt text or note, even where the change in
  the pictures is obvious. The pictures speak; the copy states what the pictures are.
- If static copy ever names these regions: 加薩走廊 (HK 加沙地帶), 約旦河西岸 (never 猶太和撒馬利亞), 烏克蘭, 黎巴嫩.
- Palestine is 巴勒斯坦 (Intl `style: 'short'`): the long forms 巴勒斯坦自治區 (TW) and 巴勒斯坦領土 (HK) each take a
  position.
- Ukrainian places keep their established Chinese names (基輔, 哈爾科夫, 敖德薩). Never coin a new transliteration
  (基伊夫). Crimea is 克里米亞, with no qualifier.

**Glaciers.** 冰川. The caption states the season (`每年夏季一張`, the end of the melt season). Never 消失, 死亡, 暖化危機,
or any interpretation the English does not make.

**Place-name politics for this audience.**

- Taiwan is 台灣 (what Intl returns in every zh-Hant locale). Never 中國台灣, 台灣省, 中華台北 (sport only), 台灣地區.
- Hong Kong is 香港 and Macau 澳門, from Intl with `style: 'short'` (Appendix B.9). The long form 中國香港特別行政區 is
  correct but nine characters and reads like a form field. Never 香港（中國）.
- Korea: 南韓 / 北韓 (Intl's zh-Hant names in both regions). Never 朝鮮 for the North.
- Disputed islands, seas and borders appear only as the gazetteer names them. Static copy never names a disputed
  territory, and translators never "correct" a data name (釣魚台 / 釣魚島, 南海 and the like).
- Runtime country names always come from Intl in the visitor's locale. Hand-written curated sublabels use the same names
  Intl prints (§4.3).

**Military and secret satellites.** Factual and flat: `軍事和偵察衛星大多不在公開目錄裡`. No speculation about who is
watching.

---

## 9. Pitfalls and the reviewer's checklist

### 9.1 False friends, calques and traps

| Trap | Why | Rule |
|---|---|---|
| 這一週, 本週 | 本週 is a flyer; 這一週 reads Taiwanese and thin | 這星期 / 那個星期 |
| 最清晰的一眼, 上次清晰的一眼 | 一眼 as a noun is a literary flourish that reads as a misprint on a chip | 最清晰的一張 / 最近一張無雲影像 |
| 清晰 for "clear" | Means sharp or legible, not cloud-free | 無雲 |
| 最近 for "closest" | Means recent | 最近距離 (distance), 最接近 (moment); 最近 alone only for recency |
| 看看誰注視過你 | Personifies the satellites; the "who viewed your profile" register | 看看是什麼注視過你 |
| 這樣做 | Calque of the English pro-verb | Merge: 但我們無從得知 |
| 以下是過境平面圖 | The drawing is above the footnote | 上圖是這次過境的平面圖 |
| 再顯示 40 次 | "Show it again 40 times" | 再顯示 40 項 |
| 位於它…掃描帶內 | Puts the satellite in its own swath | 這個地點在它…掃描帶內 |
| 偏西 61 km | "Veering westward" | 西方 61 km 處 |
| 整面地球 | It scans the disc it sees | 它看得到的整個地球圓面 |
| 但影像沒有公開, 影像還沒有公開 | Claims an image exists | 但沒有公開的影像 / 還沒有任何影像公開 |
| 從未升起 | "Never, ever" | 一直沒有升起 |
| 即時產生影像 | 即時 is "Live" | 收到請求才產生 |
| 擷取 | Screen capture in Taiwan | 成像 / 已成像 / 接收中 |
| 數據 | Mainland-leaning in Taiwan | 資料 |
| 地球靜止 in UI | Not what HKO or CWA say | 地球同步 |
| 經過時可看到 | Reads as a claim that it saw | 經過時在可視範圍內; [PLACE] 曾在 [SAT] 的可視範圍內 |
| 可觀測範圍, 視野, 在視野內 | Five words for one idea | 可視範圍 |
| 馬賽克 for "mosaic" | Censoring pixelation | 拼接影像 |
| 景 / 場景 for "scene" | Scenery, a film scene | 影像; 原圖 against the crop; HUD "Scene" 重播 |
| 全景 for "full disc" | Panorama | 全圓盤 |
| 拍攝 / 拍下 as the verdict | The owner's rule: watched, never photographed | 注視過; 拍下 only where the English says "took"; radar never 拍 |
| 照片 for every image | Radar and full-disc frames are not photos | 影像 by default |
| 圖片 for satellite data | A graphic | Only for the card and the PNG |
| 發佈 for "made public" | Posting | 公開 |
| 天體, 地球儀, 高度 for elevation | Celestial bodies, a desk globe, altitude | 物體, 地球, 仰角 |
| 北東, 南西 | Japanese order | 東北, 西南 |
| 視窗 for a time window | A software window | 時段 |
| 可能 in two lane labels | Blurs with 很可能 | Could = 或許 |
| 播放重播 | Doubles 播 | 開始重播 |
| 見方 for the privacy cell | Not square in km | 約 10 km 範圍的大致位置 (見方 stays right for the time-lapse's 10 km square) |
| `month: 'numeric'`, `formatRange`, `numeric: 'auto'` | Numeric region-ambiguous dates; 昨天 / 前天 | §5.5 builders |
| `Intl.ListFormat` | `Capella和7 顆`; HK 及 | Hand-built list |
| `……` in prose | Six baseline dots from the brand face | No ellipsis in prose |
| 妳 | Gendered "you" | 你 |
| Code-built English fragments | `placeInProse` ("the"), an appended `.`, `cap()`, `' and '` joins, `n === 1` branches, `toLowerCase()` of tags, `compassWord` | Whole sentences with slots from the zh catalog |
| IME full-width slips | `Sentinel－2C`, `１０ m`, `，` in a number | Half-width for Latin and digits |
| Glyph-variant drift | 衞, 着, 裏 creeping in from an HK IME | 衛, 著, 裡 everywhere |
| Regional words | 網路 / 網絡, 軟體 / 軟件, 品質 / 質素 | §1.4: the chosen form, the overlay, or the avoidance |
| Mainland words | 视频, 信息, 默认, 搜索, 加载, 空间站, 延时摄影, 迪拜 | Never |

### 9.2 Reviewer's checklist (run it on every string)

1. Address is 你 (or no pronoun). No 您, 妳, 閣下. 請 only for the two outside-the-app strings.
2. The product verb is 注視: 注視過 everywhere, the hero and its hook included; 注視了 only in the post. No 監視, 監控, 看見,
   拍攝 as the verdict.
3. "this week" is 這星期, "that week" 那個星期.
4. Every count is `[NUM]` + the right counter + noun: 顆衛星, 張影像, 次過境, 個物體, 項, 條軌道. One form; a zero case only
   where the sentence changes.
5. 影像 / 照片 / 圖片 used honestly; 無雲 for "clear"; 可視範圍 for "in view"; 地球同步 for geostationary.
6. Verdict words exactly as §3.6.
7. Time and place before the verb; the sentence ends on the fact; offsets as `[DIR]方 [DIST] 處`; no 這樣做.
8. Full-width ，。、：；？（）「」 in Chinese text; no ！, no dashes, no prose ellipsis, no half-width marks inside Chinese.
9. One half-width space between Han and Latin or digits, from the string or `cjkGap`; none next to full-width punctuation;
   date tokens as §6.2.
10. Units as SI symbols in number spans; time units in Han. No 公里, 公尺, 米, 萬.
11. Dates from the §5.5 builders: no `month: 'numeric'`, no `formatRange`, no 昨天; 24-hour clock.
12. Compass words in Chinese, 東北 order; hemisphere letters only in coordinates.
13. Names untranslated: satellites, sensors, agencies, programmes, `Watched`, `www.watched.earth`, `UTC`, NORAD ids.
    Attribution lines stay in English, verbatim.
14. No regional or mainland word outside §1.4; base glyph forms. If the string has an HK row in §1.4, the overlay has it.
15. No marketing words, apology, 進行, 被 passive, three 的 in a row, or particles.
16. Mono labels are 2 to 4 character nouns; buttons at most 6 characters; card leads at most 18 em.
17. Sensitive content: no war, surveillance or sovereignty words beyond the English; Taiwan 台灣, Hong Kong 香港.
18. Test the frame with a Latin place (`Waterloo`), a Han place (`九龍`), an English label after a Han search (`Taipei`), a
    48-character cut place, a nameless satellite, and the counts 0, 1, 2, 21, 1,715.
19. Read it aloud as a Hong Kong reader and as a Taiwanese reader. If either would write it differently, the string belongs
    in §1.4.

---

## Appendix A: reference translations of the core strings

HK overlay forms in brackets where they differ.

**Landing and HUD**

| English | zh-Hant |
|---|---|
| Something / watched you / this week. | 這星期 / 有東西 / 注視過*你*。 |
| Enter any place on Earth. See every satellite… | 輸入地球上任何一個地方，看看過去 7 天從上空飛過的每一顆衛星，以及它們實際拍下的影像。 [7 日] |
| LAST 7 DAYS · 1 → 8 NOV 2026 UTC | 過去 7 天 · 2026年11月1日 → 8日 UTC [過去 7 日] |
| Search a place / 01 / Place | 搜尋地點 / 01 / 地點 |
| Searching / Search unavailable / 3 matches / No match | 搜尋中 / 無法搜尋 / 3 個結果 / 沒有結果 |
| Name, address or lat, lon | 地名、地址或「緯度, 經度」 (latitude first: the parser expects lat, lon) |
| Clear search / Show what passed over this place / Places | 清除搜尋 / 顯示從這裡上空經過的衛星 / 地點 |
| The place search isn't answering. Coordinates such as 43.47, −80.54 still work. | 地點搜尋沒有回應。座標（例如 43.47, −80.54）仍可使用。 [坐標] (keep the half-width comma and U+2212: the field parses them) |
| Nothing matches "…". Try a city, a landmark, or coordinates. | 沒有符合「[q]」的地點。試試城市、地標或座標。 [坐標] |
| Use my location / Locate me / Near me / Locating… | 使用我的位置 / 我的位置 / 我的位置 / 定位中… |
| Cancel / Cancel / Cancel locating | 取消 / 取消 / 取消定位 |
| Requesting position / Naming the place / 04 S | 正在取得位置 / 正在查詢地名 / 04 秒 |
| Your position goes to the Photon geocoder… ~10 km cell. | 你的位置會傳送到 Photon 地理編碼服務，用來取得地名。我們只記錄約 10 km 範圍的大致位置。 |
| Location / Dismiss | 定位 / 關閉 |
| Location access is blocked. Allow it in your browser settings, or search for a place. | 瀏覽器已封鎖定位。請在瀏覽器設定中允許，或直接搜尋地點。 |
| Your position isn't available right now. Search for a place instead. | 暫時無法取得你的位置，可改為搜尋地點。 |
| Finding your position took too long. Try again, or search for a place. | 取得位置的時間太長。可以再試一次，或改為搜尋地點。 |
| This browser can't share its location. Search for a place instead. | 這個瀏覽器無法提供位置，可改為搜尋地點。 |
| Location needs a secure (https) connection. Search for a place instead. | 定位需要安全的 https 連線，可改為搜尋地點。 |
| 02 / Or try / Or click the globe to drop a pin / Drop a pin | 02 / 或試試 / 或在地球上按一下，放置圖釘 / 放置圖釘 |
| Example places / Surprise me / Surprise me: a famous place picked at random | 範例地點 / 隨機地點 / 隨機地點：隨機挑選一個著名地點 |
| [label], [sublabel] (chip name) | [label]，[sublabel] |
| Built by @armaangupt0 | 由 @armaangupt0 製作 |
| Open source / Open source: the code on GitHub | 開源 / 開源：GitHub 上的原始碼 (原始碼 reads in both regions) |
| How this works / Watched, home | 運作原理 / Watched，首頁 |
| Time / Orbit catalog / Sun (regions) | 時間 / 軌道目錄 / 太陽 |
| Scene · … (during a replay) | 重播 · 11月1日 週日 11:21:13 EST |
| SUN 16.2°S 063.0°E / Sub-solar point / GMST 18:41:50 | 太陽 16.2°S 063.0°E / 太陽直射點 / GMST 18:41:50 |
| 16,893 OBJECTS · CELESTRAK GP / — Objects / CATALOG | 16,893 個物體 · CELESTRAK GP / — 物體 / 目錄 |
| Fetched 2026-11-08 03:34Z / 42 MIN ago / Stale, 3 D ago | 更新於 2026-11-08 03:34Z / 42 分鐘前 / 已過時，3 天前 [3 日前] |
| <1 MIN / 5 H | <1 分鐘 / 5 小時 |
| Catalog unavailable / Loading catalog | 目錄無法使用 / 正在載入目錄 |
| Language / Language: 繁體中文. Change | 語言 / 語言：繁體中文。更改 |
| Loading Watched / Slow connection, still loading / tab title | 正在載入 Watched / 網速較慢，仍在載入 / Watched · 這星期，有東西注視過你 |

**Globe**

| English | zh-Hant |
|---|---|
| NORAD 60989 / NORAD … · 795 km | NORAD 60989 / NORAD … · 795 km |
| IMAGED 11:21:13 EST / IMAGED ≈ 11:21 EST | 成像 11:21:13 EST / 成像 ≈ 11:21 EST |
| ACQUIRED 11:21:13 EST · 10 m / ACQUIRED | 已成像 11:21:13 EST · 10 m / 已成像 |
| ACQUISITION · SENTINEL-2C / CLOSEST APPROACH · … / CLOSEST APPROACH | 成像 · SENTINEL-2C / 最接近 · SENTINEL-2C / 最接近 |
| Dropped pin / Naming this spot / No named place nearby | 已放置的圖釘 / 正在查詢地名 / 附近沒有已命名的地點 (10 Han: fits 156 px at 13 px) |
| Search here (Enter) / Remove the pin / Remove the pin (Esc) | 搜尋這裡（Enter） / 移除圖釘 / 移除圖釘（Esc） |
| Show what passed over [place] | 顯示從 [place] 上空經過的衛星 |
| Hold the globe anywhere to move it | 按住地球任意位置即可移動 |
| Pin dropped at … / Pin dropped in [place]. Press Enter or the arrow… / Pin dropped. Press Enter… | 圖釘已放在 43.4723°N 80.5449°W。 / 圖釘已放在 [place]。按 Enter 或箭頭，查看從這裡上空經過的衛星。 / 圖釘已放置。按 Enter 或箭頭，查看從這裡上空經過的衛星。 |
| 3D view unavailable / WebGL 2 is off in this browser | 無法顯示 3D 地球 / 這個瀏覽器已關閉 WebGL 2 |

**Computing and the engine**

| English | zh-Hant |
|---|---|
| Loading orbital elements (app) / Report ready | 正在載入軌道根數 / 結果已就緒 |
| LOADING ORBITAL CATALOG / CATALOG · 16,893 OBJECTS | 正在載入軌道目錄 / 目錄 · 16,893 個物體 |
| PROPAGATING 412 ORBITS · 7 DAYS / PROPAGATING ORBITS · 120 / 412 | 推算 412 條軌道 · 7 天 [7 日] / 推算軌道 · 120 / 412 |
| SEARCHING SENTINEL-2 + LANDSAT ARCHIVES | 正在搜尋 Sentinel-2 + Landsat 影像庫 |
| MATCHING 12 SCENES TO 31 PASSES | 配對 12 張影像與 31 次過境 |
| VERIFYING NASA WEATHER MOSAICS · 12 / 35 | 正在核對 NASA 氣象拼接影像 · 12 / 35 |
| 31 PASSES · 12 IMAGES | 31 次過境 · 12 張影像 |
| The Sentinel-2 and Landsat archives were too slow to answer; passes are shown from orbital geometry only. | Sentinel-2 和 Landsat 影像庫回應太慢；過境僅依軌道幾何推算。 |
| …could not be reached; … | 無法連上 Sentinel-2 和 Landsat 影像庫；過境僅依軌道幾何推算。 |
| Sentinel-2 listed via Earth Search; some scenes show a full-scene thumbnail, not a crop. | Sentinel-2 經由 Earth Search 列出；部分影像只能顯示整幅縮圖，無法裁切。 |
| Sentinel-2 listed via Earth Search (Planetary Computer search unavailable). | Sentinel-2 經由 Earth Search 列出（Planetary Computer 搜尋無法使用）。 |
| Sentinel-2 archive unreachable; Sentinel-2 images may be missing. | 無法連上 Sentinel-2 影像庫；可能缺少 Sentinel-2 影像。 (Landsat likewise) |
| This spot is outside Sentinel-2's acquisition plan (open ocean). | 這個地點在 Sentinel-2 的觀測計畫之外（遠洋）。 |
| Orbital elements are 3 days old, so pass times may be off by a few minutes. | 軌道資料已是 3 天前的，過境時間可能有幾分鐘誤差。 [3 日前] |
| These passes are reconstructed from newer orbital elements… | 這些過境是用較新的軌道資料重建的，時間可能有幾分鐘誤差。 |
| NASA GIBS was slow to confirm 2 VIIRS images; VIIRS images the whole globe every day, so those passes count as watched. | NASA GIBS 未能及時確認 2 張 VIIRS 影像；VIIRS 每天拍遍全球，所以相關過境仍算作注視過。 (相關 reads for 1 and for many) |
| NASA GIBS did not answer in time, so weather-satellite images are not shown. | NASA GIBS 沒有及時回應，所以不顯示氣象衛星影像。 |
| NASA GIBS did not return 2 of 35 weather-satellite images in time; those passes are shown as likely. | NASA GIBS 未能及時傳回 35 張氣象衛星影像中的 2 張；相關過境顯示為很可能注視過。 |
| NASA GIBS could not be reached / failed to return 2 of 35… | 無法連上 NASA GIBS，所以不顯示氣象衛星影像。 / NASA GIBS 有 2 張氣象衛星影像（共 35 張）沒有傳回；相關過境顯示為很可能注視過。 |
| Planetary Computer and NASA render on demand; this step can take a few seconds. | Planetary Computer 和 NASA 的影像都是收到請求才產生的，這一步可能需要幾秒。 |
| Fault / Something went wrong. / Try again / Trying… / Back | 故障 / 出了問題。 / 再試一次 / 重試中… / 返回 |
| Could not load the orbit catalog. Check your connection and try again. | 無法載入軌道目錄。請檢查連線後再試一次。 |
| Something went wrong computing passes for this place. Try again in a moment. | 計算這個地點的過境時出了問題。可以稍後再試一次。 |

**Results, pass list and pass view**

| English | zh-Hant |
|---|---|
| Shared with you · Sentinel-2C watched Waterloo | 有人分享給你 · Sentinel-2C 注視過 Waterloo |
| Search another place (now Waterloo) / Recent | 搜尋其他地點（目前：Waterloo） / 最近搜尋 |
| 12 detailed images (Sentinel-2, Landsat, 10–30 m) · 3 daily weather mosaics (250–375 m) · 2 radar images (Sentinel-1, 20 m). 1,234 passes from 412 imaging and crewed satellites checked. | 12 張精細影像（Sentinel-2、Landsat，10–30 m）· 3 張每日氣象拼接影像（250–375 m）· 2 張雷達影像（Sentinel-1，20 m）。已檢查 412 顆成像與載人衛星的 1,234 次過境。 |
| … full-disc images from geostationary weather satellites (2–5 km; the newest of each is shown) | …張地球同步氣象衛星的全圓盤影像（2–5 km；各顯示最新一張） |
| No operational geostationary weather imager sees this place above 5° elevation. | 沒有運作中的地球同步氣象衛星能以 5° 以上的仰角看到這個地點。 |
| No satellite we track crossed this place in the window. That is rare; the notes above say if a data source was down. | 這段期間沒有我們追蹤的衛星飛越這個地點。這很少見；上方的說明會指出是否有資料來源中斷。 |
| closest look, then newest | 最清晰的一張在前，其餘由新到舊 |
| 31 passes / 12 sats | 31 次過境 / 12 顆 |
| Show all 31 satellites / Show all 31 rows / Show 40 more / 12 left / Show fewer | 顯示全部 31 顆衛星 / 顯示全部 31 項 / 再顯示 40 項 / 還有 12 項 / 收起 |
| Mosaic / Radar / Clouded · 81% / Clouded · at spot | 拼接 / 雷達 / 雲層遮蔽 · 81% / 雲層遮蔽 · 地點有雲 |
| 8.9° off-nadir / 61 km / cloud 25% | 側視角 8.9° / 61 km / 雲量 25% |
| Latest / Closest / Cloud (thumbnail chip) | 最新 / 最接近 / 雲 |
| Expand the photo: … | 放大影像：Sentinel-2B，11月1日 週日 11:21 |
| [sat], [operator], 3 passes, latest Friday 6 November 10:52 | Sentinel-2B，ESA，3 次過境，最新一次 11月6日星期五 10:52 |
| [sat], watched, Friday 6 November 10:52 EST, 41 hours ago, cloud 25 percent, clouded over | Sentinel-2B，注視過，11月6日星期五 10:52 EST，41 小時前，雲量 25%，雲層遮蔽 |
| Photos / Plan view / 01 / Geometry / 02 / Replay | 影像 / 平面圖 / 01 / 幾何 / 02 / 重播 |
| A full-disc image: … at 2 km a pixel here. Coarse, but real, and the newest one published; it has taken one like it every 10 minutes all week. | 這是一張全圓盤影像：衛星看得到的整個地球圓面拍成一張，這裡每像素 2 km。雖然粗略，但是真實的，也是最新公開的一張；這星期它每 10 分鐘就拍一張這樣的影像。 (no cadence: 每隔幾分鐘) |
| A daily mosaic: NASA stitches each day's swaths into one picture at 375 m per pixel. Coarse, but real, and from this pass's day. | 這是每日拼接影像：NASA 把每天的掃描帶拼成一張，每像素 375 m。雖然粗略，但是真實的，也來自這次過境的那一天。 |
| A radar image, not a photograph: … | 這是雷達影像，不是照片：Sentinel-1 發出微波並記錄回波，所以不受雲層和黑暗影響。亮度代表地面反射回來的強弱：建築物和粗糙地面較亮，平靜的水面較暗。 |
| Open image to save it / Downloading… / Download image / View source · Planetary Computer | 開啟影像以儲存 / 下載中… / 下載影像 / 查看來源 · Planetary Computer |
| Reading the pixel at your spot… / Clear over your spot. / Cloud over your spot. / Your spot was in cloud shadow. | 正在讀取地點上的像素… / 你選的地點上空無雲。 / 你選的地點上空有雲。 / 你選的地點在雲影中。 |
| Thin cirrus flagged over your spot; it may soften the picture. | 你選的地點上空有薄卷雲，畫面可能稍微模糊。 |
| Altitude / Elevation / Off-nadir / Pixel / Band / Sun / Cloud / Cloud at spot | 高度 / 仰角 / 側視角 / 像素 / 波段 / 太陽 / 雲量 / 地點雲況 |
| Infrared / Visible / Colour · Clear / Cirrus / Cloud / Shadow | 紅外線 / 可見光 / 彩色 · 無雲 / 卷雲 / 有雲 / 雲影 |
| units: km / m / km/s / up / mosaic / scene / day / twilight / night | km / m / km/s / (empty: the label says 仰角) / 拼接 / 原圖 / 日間 / 晨昏 / 夜間 |
| Closest · UTC / Closest · local / Ground distance / Elevation from you / Ground speed / Heading / Sun elevation | 最接近 · UTC / 最接近 · 當地 / 地面距離 / 仰角 / 地面速度 / 航向 / 太陽仰角 |
| Field of regard / Swath / In swath / In view / Window / NORAD · pass | 可轉向範圍 / 掃描帶 / 在掃描帶內 / 在可視範圍內 / 時段 / NORAD · 過境 |
| Scan line here · UTC / · local / Above the equator at / In your sky / Scan direction / Line speed here / Coverage / This scan / NORAD · scan | 掃描線到達 · UTC / 掃描線到達 · 當地 / 赤道上空位置 / 天空位置 / 掃描方向 / 掃描線速度 / 涵蓋範圍 / 這次掃描 / NORAD · 掃描 |
| North → south / South → north / Full disc / every 10 min | 北 → 南 / 南 → 北 / 全圓盤 / 每 10 分鐘 |
| up · SSW / SSW · Desc / Day · Twilight · Night | 南南西 / 南南西 · 降軌 / 日間 · 晨昏 · 夜間 |
| 16:14:21 → 16:18 | 16:14:21 → 16:18 |

**Gallery, photo viewer**

| English | zh-Hant |
|---|---|
| Photos / Show photos / All / Detailed / Weather / Radar | 影像 / 顯示影像 / 全部 / 精細 / 氣象 / 雷達 |
| filter tooltips | 所有影像，最清晰的一張在前，其餘由新到舊 / Sentinel-2 和 Landsat，每像素 10–30 m / 每日氣象拼接影像，每像素 250 m 或更粗 / Sentinel-1 雷達影像，每像素 20 m：可穿透雲層，日夜皆可 |
| 3 / 27 / 12 this week / 12 that week | 3 / 27 / 這星期 12 張 / 那個星期 12 張 |
| Previous photo / Previous (←) / Next photo / Next (→) | 上一張 / 上一張（←） / 下一張 / 下一張（→） |
| carousel / Photos of this place, swipe for more / slide | 輪播 / 這個地點的影像，滑動查看更多 / 影像 |
| Closest look / Last clear look / Clouded over | 最清晰的一張 / 最近一張無雲影像 / 雲層遮蔽 |
| [lead]: [sat], [day] [time], photo 3 of 27 | 最清晰的一張：Sentinel-2B，11月1日 週日 11:21，第 3 張，共 27 張 |
| Replay this pass on the globe: … / Replay [this pass] / View / View the last clear look large: … / View the photo large: … | 在地球上重播這次過境：… / 重播**這次過境** / 查看 / 放大查看最近一張無雲影像：… / 放大查看影像：… |
| Share this pass / Radar | 分享這次過境 / 雷達 |
| This week's passes saw mostly cloud / Here's the last clear look | 這星期的過境大多只看到雲 / 這是最近一張無雲影像 |
| Clouded over · 94% / Clouded over · cloud at your spot / Cloud at your spot | 雲層遮蔽 · 94% / 雲層遮蔽 · 地點有雲 / 地點有雲 |
| Clouded · 81% / Cloud at spot / Clear / Thin cirrus / Cloud shadow / Cloud 25% / Daily mosaic | 雲層遮蔽 · 81% / 地點有雲 / 無雲 / 薄卷雲 / 雲影 / 雲量 25% / 每日拼接 |
| [sat] image of [place]. The place is at the centre. | [sat] 的 [place] 影像。地點在畫面中央。 |
| Acquiring / No image returned / Retry | 接收中 / 影像庫沒有傳回影像 / 重試 |
| N / Expand the photo / Expand (F) | N / 放大影像 / 放大（F） |
| Still rendering. Large scenes can take 10 s or more. | 仍在產生影像。大範圍影像可能需要 10 秒以上。 |
| The archive did not send this crop. It may be busy; the image itself still exists. | 影像庫沒有傳回這張裁切影像，可能正忙碌；影像本身仍然存在。 |
| Line 0412 → 1024 / Awaiting pass / Awaiting scan | 掃描行 **0412** → 1024 / 等待過境 / 等待掃描 |
| Photos (viewer) / Photo 3 of 27, closest look / The last clear look, from before this week | 影像 / 第 3 張，共 27 張，最清晰的一張 / 最近一張無雲影像，來自這星期之前 |
| Time-lapse of this place, year by year / Time-lapse | 這個地點的縮時影像，逐年變化 / 縮時影像 |
| Zoom out (−) / Zoom in (+) / 2.5× / Close the photo viewer / Close (Esc) | 縮小（−） / 放大（+） / 2.5× / 關閉影像檢視器 / 關閉（Esc） |
| 10 m / pixel / Pan-sharpened with Landsat's 15 m band | 每像素 10 m / 以 Landsat 的 15 m 黑白波段銳化 |
| Clouded · 81% / Clear at your spot | 雲層遮蔽 · 81% / 地點無雲 |
| Replay this pass on the globe / Replay / Share this photo / Share / All photos / Photo 3 | 在地球上重播這次過境 / 重播 / 分享這張影像 / 分享 / 所有影像 / 第 3 張 |

**Share sheet**

| English | zh-Hant |
|---|---|
| Share this pass / Share this image / Share this week / Close (Esc) | 分享這次過境 / 分享這張影像 / 分享這星期的結果 / 關閉（Esc） |
| Share image / Preparing image… / Share | 分享圖片 / 正在準備圖片… / 分享 |
| Copy link / Copied / Post to X / Copy image / Save PNG / Try again | 複製連結 / 已複製 / 發佈到 X / 複製圖片 / 儲存 PNG / 再試一次 |
| Link / Direct link: the short link could not be made right now / Creating link… / Made when you share / Post | 連結 / 直接連結：暫時無法建立短連結 / 正在建立連結… / 分享時才會建立 / 貼文 [帖文] |
| The card could not be rendered here; the link still works. | 這裡無法產生卡片，但連結仍然有效。 |

**Time-lapse**

| English | zh-Hant |
|---|---|
| Time-lapse of [place] / Time-lapse / Close / Esc | [place] 的縮時影像 / 縮時影像 / 關閉 / Esc |
| Play / Pause / Frame / Frames | 播放 / 暫停 / 影像 / 影像列表 |
| 22 Oct 2015 / 22 Oct / 22 Oct 2015 · Sentinel-2A | 2015年10月22日 / 10月22日 / 2015年10月22日 · Sentinel-2A |
| Frame 3 of 11: 22 Oct 2015 | 第 3 張，共 11 張：2015年10月22日 |
| 11 clear looks · one a year / · one each autumn (winter, spring, summer) | 11 張無雲影像 · 每年一張 / · 每年秋季一張 (冬季, 春季, 夏季) |
| One clear look a year · since 2015 / No time-lapse for this place / The archive did not answer | 每年一張無雲影像 · 2015 年起 / 這個地點無法製作縮時影像 / 影像庫沒有回應 |
| Each frame is the same 10 km square, taken by Sentinel-2 and toned like every photo here. Each year aims for a different season; a year with no clear look is left out. | 每一張都是同一個 10 km 見方的範圍，由 Sentinel-2 拍攝，調色方式和這裡所有照片相同。每年選取不同的季節；沒有無雲影像的年份會略過。 |
| … Every year is from the same season; a year with no clear look in that season is left out. | …每年都取自同一個季節；那個季節沒有無雲影像的年份會略過。 |
| Copernicus Sentinel-2, via Planetary Computer | Copernicus Sentinel-2，經由 Planetary Computer |
| Listing the archive / Choosing clear looks / Developing frames | 正在列出影像庫 / 正在挑選無雲影像 / 正在顯影 |
| Choosing clear looks, 03 of 12 / Developing frames, 05 of 11 | 正在挑選無雲影像，3 / 12 / 正在顯影，5 / 11 |
| Too cloudy here for a time-lapse. / 1 clear look since 2015 · 3 needed / No clear look since 2015 · 3 needed | 這裡雲太多，無法製作縮時影像。 / 2015 年起只有 1 張無雲影像 · 需要 3 張 / 2015 年起沒有無雲影像 · 需要 3 張 |
| The archive did not answer. / Planetary Computer could not be reached / Try again | 影像庫沒有回應。 / 無法連上 Planetary Computer / 再試一次 |
| Share / Link copied / [place], year by year | 分享 / 連結已複製 / [place]，逐年變化 |
| Video / Rendering 42% / Video failed / Save video | 影片 / 製作中 42% / 影片製作失敗 / 儲存影片 |
| This browser has no H.264 encoder: the file plays in Chrome and Firefox | 這個瀏覽器沒有 H.264 編碼器：檔案可在 Chrome 和 Firefox 播放 |
| place (file name) | place (ASCII; never Han: the file name keeps only a–z) |

**About**

| English | zh-Hant |
|---|---|
| About / Close / Sections | 關於 / 關閉 / 章節 |
| How this / works. | 這一切 / 如何*運作*。 |
| The short version / How we find the passes / What the labels mean / What we can't see / Privacy / Credits / Keyboard | 簡單來說 / 我們如何找出過境 / 標籤的意思 / 我們的盲點 / 隱私 [私隱] / 致謝 [鳴謝] / 鍵盤 |
| Every object in orbit has a public set of numbers that describes its path. CelesTrak publishes them from US Space Force tracking, and we grab a fresh copy every six hours. | 每個在軌道上的物體都有一組描述其路徑的公開數字。[CelesTrak] 根據美國太空軍的追蹤資料公開這些數字，我們每 6 小時取得一份最新的。 |
| This page loaded 16,893 objects, fetched 2026-11-08 03:34Z. | 這個頁面載入了 **16,893** 個物體，目錄更新於 **2026-11-08 03:34Z**。 |
| We run each satellite through SGP4, the standard orbit model, for the past seven days and note every time your spot was inside what it could see. | 我們用標準軌道模型 SGP4 推算每顆衛星過去 7 天的軌道，記下你選的地點每一次進入它可視範圍的時刻。 |
| Straight down / Sentinel-2 and Landsat look straight down at a strip of ground… You have to be in the strip. | 正下方 / Sentinel-2 和 Landsat 直視正下方的一條地面帶，Sentinel-2 約 290 km 寬，Landsat 約 185 km。你必須在這條帶內。 |
| Tilting cameras / Lots of commercial satellites can lean 30 to 45 degrees. If you were in reach, we call it "could have pointed here". | 可傾斜的鏡頭 / 很多商業衛星能傾斜 30° 至 45°。只要你在它的可轉向範圍內，我們就稱為「或許曾對準這裡」。 |
| Daylight / Regular cameras need the sun. A pass in the dark never counts as a photo. | 日光 / 一般相機需要陽光。天黑時的過境不會算作照片。 |
| Radar / Sentinel-1 doesn't need the sun… | 雷達 / Sentinel-1 不需要陽光。它發出微波並記錄回波，所以能穿透雲層、在夜間觀測，視線偏向軌道的一側。它的影像也是公開的，所以我們會以灰階顯示：亮的是粗糙地面和建築物，暗的是平靜的水面。 |
| Weather satellites / A few sit over the equator and watch half the planet every 10 minutes. If you're on their side of Earth, you're in every frame. | 氣象衛星 / 有幾顆定點在赤道上空，每 10 分鐘注視半個地球。只要你在它們那一側，每一張影像都涵蓋你所在的地方。 |
| Then we search the image archives (…) and match each image to the pass that took it. Every image you see is the real one, cropped around your spot. | 接著我們搜尋影像庫（Microsoft Planetary Computer、Element 84 和 NASA），把每張影像配對到拍下它的那次過境。你看到的每一張影像都是真的，以你選的地點為中心裁切。 |
| Touch-ups / … colour-balanced, smoothed and lightly sharpened for your screen… Nothing is added or removed. | 修飾 / Sentinel-2 和 Landsat 的照片經過色彩平衡、平滑和輕微銳化，以適合你的螢幕 [屏幕]，整張照片的處理方式都一樣。沒有添加或移除任何東西。 |
| Which way is up / … north can sit a few degrees off straight up. When you open a photo, its N arrow shows exactly where. | 哪邊朝上 / Sentinel-2 和 Landsat 的照片沿用影像庫為這個地點使用的地圖網格，所以北方可能偏離正上方幾度。打開照片時，它的 N 箭頭會指出確切方向。 |
| Exact positions / Public orbit data is good to about a kilometre and drifts a little each day. Times can be off by a few seconds. | 確切位置 / 公開的軌道資料精確到約 1 km，而且每天會稍微漂移。時間可能有幾秒誤差。 |
| Secret satellites / Some of the best cameras in orbit belong to militaries. They don't show up here. | 秘密衛星 / 軌道上一些最好的相機屬於軍方。它們不會出現在這裡。 |
| Clouds / Plenty of photos are just cloud. When the archive tells us, we check the exact pixel over your spot and say so. | 雲 / 很多照片拍到的只有雲。只要影像庫提供資訊，我們會檢查你選的地點正上方的那個像素，並如實說明。 |
| Delays / Photos can take a day or two to show up. | 延遲 / 照片可能要一兩天才會出現。 [一兩日] |
| Where it runs / What we keep / Who else sees it / Share links | 在哪裡運算 / 我們保留什麼 [甚麼] / 還有誰看得到 / 分享連結 (texts: §8) |
| Made by / Armaan, @armaangupt0 on X | 製作 / Armaan，X 上的 [@armaangupt0] |
| Imagery from NASA's GIBS, part of EOSDIS. GOES via NOAA and CIRA, Himawari via JMA. | 影像來自 NASA 的 GIBS（EOSDIS 的一部分）。GOES 經由 NOAA 和 CIRA，Himawari 經由 JMA。 |
| Archives / … | 影像庫 / Microsoft Planetary Computer 和 Element 84 Earth Search；Landsat 的 15 m 波段來自 Copernicus Data Space Ecosystem。 |
| Orbits / Element sets from CelesTrak. SGP4 by satellite.js. | 軌道 / 軌道根數來自 CelesTrak。SGP4 由 satellite.js 提供。 |
| Place names / Photon by komoot. Map data © OpenStreetMap contributors (ODbL). | 地名 / Photon by komoot。地圖資料 © OpenStreetMap contributors (ODbL)。 (the attribution stays as OSM words it) |
| Earth textures / Solar System Scope (CC BY 4.0), from NASA Blue Marble and Black Marble. | 地球貼圖 / Solar System Scope（CC BY 4.0），來自 NASA Blue Marble 和 Black Marble。 |
| Type / Instrument Sans and Serif by Instrument, Martian Mono by Evil Martians (SIL OFL). | 字型 [字體] / Instrument Sans 和 Serif 由 Instrument 設計，Martian Mono 由 Evil Martians 設計（SIL OFL）。 |
| Keyboard: Search for a place / Move through suggestions / Choose / Step through passes / Previous / next photo / Expand the photo / Zoom (when expanded) / Play or pause the replay / Back, or close / This page | 搜尋地點 / 在建議中移動 / 選擇 / 逐次切換過境 / 上一張／下一張 / 放大影像 / 縮放（放大後） / 開始或暫停重播 / 返回或關閉 / 本頁 |
| Enter / Space / Esc | Enter / Space / Esc |
| Built by @armaangupt0 / Made from public data. We didn't take any of these photos. | 由 @armaangupt0 製作 / 以公開資料製作。這些照片都不是我們拍的。 |
| Close / Expand panel / Collapse panel (system) | 關閉 / 展開面板 / 收起面板 |

---

## Appendix B: engineering preconditions (cost and speed)

zh-Hant adds no cost and no load time. Nothing is translated at runtime, no service is called, nothing new is stored,
and an English visitor downloads exactly what they did before. Items 2 to 6 are shared with zh-Hans (its Appendix B) and
are built once for both. These are the preconditions for listing zh-Hant:

1. **Hong Kong plumbing** (all zero runtime cost):
   - `src/i18n/boot.ts`: when the matched tag carries `hk` or `mo`, set `<html lang="zh-Hant-HK">`; keep
     `lang="zh-Hant"` otherwise. `data-locale` stays `zh-Hant`. The same rule applies after a switcher pick or `?hl=`.
   - One `intlTag()` helper: `zh-Hant-HK` when the lang says so, else `zh-Hant-TW`. `dates.ts`, `format.ts` and
     `countryName` take it for zh-Hant.
   - `scripts.css`: the `:root:lang(zh-Hant-HK)` sans stack (§6.10) after the zh-Hant rule.
   - The overlay: a `Partial` of the zh-Hant messages (§1.4's key list), compiled into the zh-Hant chunk and merged at
     startup when the lang is `zh-Hant-HK`. Under 1 kB, no request.
   - Cards: unchanged (`l=zh-Hant`, base words).
2. **Card headline size by width** (`api/_lib/cardSpec.ts headlineSize`). It counts code points today
   (`lead.length ≤ 24 → 84 px`), tuned for condensed Latin, so a Han lead overflows: the zero lead needs 4 lines at 84 px.
   When the lead or place contains Han or other full-width characters, measure em-width (Han and full-width punctuation
   1, Latin and digits about 0.5, a space about 0.3) and pick the largest size where the lead takes at most 3 lines and
   the place block at most 2. Text without them keeps today's thresholds, so English cards stay byte-identical.
3. **satori fetches one Han family, not four.** Put `lang="zh-TW"` on the card root for zh-Hant, and make
   `fallbackFonts.ts load()` fetch only the first family when the code lists several Han locales, at one weight (500).
   Without it every uncached zh card fetches four CJK families one after another (billed function time, a real risk that
   a crawler times out and shows no image, and Japanese glyph forms).
4. **`cjkGap(before, after)`** in `api/_lib/i18n/parts.ts`: `' '` when one edge is Han and the other a letter, digit or
   symbol of a script written with spaces; `''` when either edge is a space, Han or full-width punctuation. Pure, a few
   lines, called by the Chinese catalogs at [PLACE] and [SAT] boundaries and at card block joins.
5. **`fmt('zh-Hant').list`** (`api/_lib/i18n/format.ts`): join with 、 and the last item with 和, spaced through `cjkGap`,
   instead of `Intl.ListFormat`. English keeps its list.
6. **`scrambleFrame`** (`src/ui/system/motion.tsx`): leave Han, kana, Hangul and full-width punctuation as they are, as it
   already leaves spaces; only Latin letters, digits and symbols scramble. One condition; English strings contain none of
   these characters, so English is unchanged.
7. **The accent subset** (the mechanism is already in the code: `scripts/build-accent-fonts.py`, `src/i18n/accentFont.ts`):
   run the script for zh-Hant once its catalog exists. Noto Serif TC 500, glyphs 你 運 作 taken from the catalog's
   `accent('…')` literals, base64 in the zh-Hant chunk, installed before the first render. Check: the About title's
   accent is `運作`, so the build picks up 運 and 作; the file stays under 2 kB.
8. **`:root:lang(zh-Hant) { --w-serif: 400 }`** (§6.10). One line.
9. **`countryName`** (`src/imagery/localPlaces.ts`) for zh-Hant: `style: 'short'` for HK, MO and PS (香港, 澳門, 巴勒斯坦);
   today it prints 中國香港特別行政區 and 巴勒斯坦自治區 / 巴勒斯坦領土. One condition.
10. **Dates** are built in the zh-Hant `time` namespace, `landing.windowRange` and the card catalog from the date fields
    (§5.5); relative times use `relativeParts` + `relativeFormat(intlTag(), 'short', 'always')`, with 剛剛 from the
    catalog. No new code outside the catalogs beyond `intlTag()`.
11. **`keepName(sat)`**: join a satellite name's words with U+00A0 in on-screen Rich messages (Instrument Sans has U+00A0;
    never U+2011, which it may lack). Post text and file names keep plain spaces. A one-line helper in the zh catalog.
12. **Share cards** are drawn in the sharer's language (`l=zh-Hant` in the link or the stored share), never negotiated from
    the viewer's `Accept-Language`: one cache entry per link, no card rendered twice. The root link's preview stays
    English.
13. **Han-typed searches miss the offline place list** (the owner's call, not a precondition). `searchLocal` returns `[]`
    for a query with no Latin key, so for zh-Hant visitors who type in Chinese (most of them) the network share of
    searches goes from about 2% to nearly 100%: slower (Photon has stalled for tens of seconds) and a real risk to
    Open-Meteo's free tier (about 10,000 requests a day) at Hong Kong's traffic, which would mean failed searches or a
    paid plan. The cheap fix, at the next places rebuild (each adds about 10 MB to git history, so rarely):
    - `build-places.ts` writes a Han alias table from GeoNames `alternateNamesV2` (`zh-Hant`, `zh-TW`, `zh-HK` names of
      countries, first-level regions, places over about 50,000 people, and the curated landmarks in
      `scripts/landmarks.ts`), mapped to the existing place ids;
    - sharded by the first Han character under the same immutable `/places/<version>/` path, so a search reads one small
      static file (a few kB), fetched only on a Han keystroke and cached forever;
    - matched by prefix of the Han string; zh-Hans can share it with Simplified forms.
    That keeps zh searches offline and as fast as English ones, and spares the shared quota. Whether the Chinese alias is
    shown as the label (the stats keep the English name either way) is the owner's call; at minimum it routes the search.
14. **Telemetry stays English** (already the rule): error events and stats read the English namespaces, so one fault is
    one row across languages.

---

## Decisions log

The critique's 49 items: 38 accepted, 11 partly accepted, 0 rejected.

| # | Item | Resolution |
|---|---|---|
| 1 | Date options print numeric, region-ambiguous dates | Accepted (verified: `11/1（週日）` TW, `1/11（週日）` HK): no `month: 'numeric'`; `11月1日（週日）` in prose, `11月1日 週日` in mono; built from the date fields (§5.5, §6.4). |
| 2 | `formatRange` unusable | Accepted (verified `2026/11/1至2026/11/8`, HK `1/11/2026 至 8/11/2026`): ranges and the kicker built by hand (§5.5). |
| 3 | Relative time `numeric: 'auto'`; HK says 日 | Accepted (verified 前天, 2 日前): `relativeParts` + `'always'`, 剛剛 from the catalog, HK 日 from Intl and the overlay (§5.5). |
| 4 | HK overlay, Intl and fonts not built | Partly accepted: boot lang, `intlTag()`, HK font rule and a v1 overlay in the same chunk; cards keep the base words (`l=zh-Hant`, one cache entry per link); `yue` mapping left to the owner because it breaks the "never a neighbour" rule (§1.4, B.1). |
| 5 | Card sizes Han as if Latin | Accepted: em-width `headlineSize`, shared with zh-Hans; 18 em lead cap (§7, B.2). |
| 6 | `sentenceGap: ''` loses the Han–Latin space | Accepted: `cjkGap` at block joins and slot edges; tests with `Waterloo` and `九龍` (§3.5, §5.1, B.4). |
| 7 | Han searches never reach the offline list | Accepted as a documented risk with the alias recommendation, refined to first-character shards so a search reads a few kB (§5.1, B.13). |
| 8 | Type numbers contradict the CJK study | Accepted: §6.10 now cites the study (already the scripts.css tokens); the accent uses the in-chunk subset mechanism already in the code, at 500, capped at 2 kB. |
| 9 | Place accent has no fallback | Accepted: serif stack without PMingLiU / MingLiU (as shipped), place at 400 via `--w-serif` (a token, since no `.placeAccent` class exists), bone on bone-2 (§6.10, B.8). |
| 10 | Ellipsis from Instrument Sans | Accepted: one U+2026 in busy states, no ellipsis in prose, `……` deleted (§6.1). |
| 11 | Names with spaces break | Accepted: U+00A0 between a name's words on screen (`keepName`), never U+2011 (§5.2, §6.8, B.11). |
| 12 | 以下是 points the wrong way | Accepted: 上圖是這次過境的平面圖 for every `noImage` footnote (§3.4). |
| 13 | 再顯示 40 次 / 顯示全部 31 次過境 | Accepted: 項 rows, 顆 satellites, 收起; 項 and 條 added to §5.3. |
| 14 | Likely sentence puts the satellite in its swath | Accepted: 這個地點在它…掃描帶內 (§3.4). |
| 15 | 偏西 61 km | Accepted: [DIR]方 [DIST] 處 for all eight directions; movement keeps 向南 (§3.4, §4.2). |
| 16 | Zero reason claims an image exists | Accepted: 但還沒有任何影像公開, also applied to the likely sentence (§3.4). |
| 17 | 整面地球, doubled 掃 | Accepted: 它看得到的整個地球圓面; 這次掃描約於…到達 (§3.4). |
| 18 | 圖片 for satellite data | Partly accepted: fixed, but 不會以我們能顯示的形式公開 instead of the critique's wording, which repeated 影像 (§3.4). |
| 19 | 太陽從未升起 overstates | Partly accepted: 一直沒有升起 / 幾乎沒有升起, without 這星期, because the window can be an older week (§3.4). |
| 20 | 即時產生影像 | Accepted: 收到請求才產生 (Appendix A). |
| 21 | Hero 這星期, no line-end comma | Accepted: 這星期 / 有東西 / 注視過*你*。; plain text keeps the comma; 那一週 → 那個星期 everywhere (§3.1). |
| 22 | 看看誰注視過你 | Accepted: 看看是什麼注視過你 (§3.5). |
| 23 | Lift the 什麼 / 甚麼 ban | Accepted: base 什麼, HK 甚麼; the four card strings written (§1.4, §3.5). |
| 24 | 這樣做 calque | Accepted: merged 但我們無從得知 in every could line, About and `couldHave` (§2.2, §3.4–3.6). |
| 25 | About title and 我們看不到的 | Accepted: 這一切 / 如何*運作*。; 我們的盲點; subset 你 運 作 (§3.7). |
| 26 | 最清晰的一眼, 清晰 for clear | Accepted: 最清晰的一張, 最近一張無雲影像, 無雲影像 throughout (§4.1). |
| 27 | Five words for "in view" | Accepted: 可視範圍 everywhere, 可轉向範圍 for field of regard; could card place first (§3.5, §4.1). |
| 28 | Definitions and About lines | Partly accepted: all six adopted except the ISS dark line keeps one 當時, not two (§3.4, §3.6, §3.7). |
| 29 | Second line rationale | Accepted: string unchanged, the false "numeral opening" rationale removed (§3.3). |
| 30 | 地球靜止 vs 地球同步 | Accepted: 地球同步 (prose and labels), lane 同步軌道; 地球靜止 once in About at most (§4.1). |
| 31 | 全圓盤 | Partly accepted: kept 全圓盤 (地球圓面 in prose), with the CWA 全景 / HKO 全球 note for reviewers (§4.1). |
| 32 | 真彩色 | Accepted: one word chosen, 真實色彩, with the others noted (§4.1). |
| 33 | 擷取 reads as screen capture | Accepted: 成像 / 已成像 / 接收中 (§4.1, Appendix A). |
| 34 | 數據 → 資料 | Accepted: 公開資料, 軌道資料, no overlay (§1.4). |
| 35 | Pan-sharpening split | Accepted: 以 Landsat 的 15 m 黑白波段銳化 (§4.1). |
| 36 | Render split | Accepted: 製作中 42%, 仍在產生影像 (§4.1). |
| 37 | Dubai in HK is 杜拜 | Accepted: overlay row removed (§1.4). |
| 38 | Days are 日 in HK | Accepted: overlay 日 for every catalog-built day count (§1.4). |
| 39 | Corrected HK / TW table | Accepted: adopted as §1.4, with the glyph-form note and the curated exonyms (§4.3). |
| 40 | Sublabel order impossible | Accepted: `${rest}，${country}` (§5.1). |
| 41 | Date tokens next to Han and digits | Partly accepted: space before a digit-initial token after Han, none after 日; a range `10月29日至11月5日` is one token, as the critique's own example shows (§6.2). |
| 42 | Middle dot after full-width brackets | Accepted: no leading space after ） or 」 (§6.1). |
| 43 | Zero-padded minutes in prose | Accepted: unpadded in prose, padded in mono readouts (§6.5). |
| 44 | Kicker and stamps | Partly accepted: kicker `過去 7 天 · 2026年11月1日 → 8日 UTC` (with B.6); stamp and `weekTo` keep the year but use the chip form `2026年11月1日 週日`, no parentheses (§3.5, §6.4). |
| 45 | Sensitive content additions | Partly accepted: privacy strings, Cookie, 自動程式, Article 23 and the no-ranking rule adopted; 見方 rejected for the stored cell (a 0.1° cell is not square in km), kept for the time-lapse square (§8). |
| 46 | The X post and hooks | Partly accepted: all cases written, but 注視了 for the named moment (the §2.2 aspect rule) and 當地時間 before the day, since the English clock has no zone (§3.5). |
| 47 | Card and share-page strings | Partly accepted: adopted, except `withinView` puts the heading with the satellite's verb (向西北經過), and a nameless subject is 有一顆衛星 (§3.5, §5.2). |
| 48 | Landing, HUD, globe strings | Accepted (Appendix A). |
| 49 | Pass list, notes, gallery, lightbox, time-lapse, engine | Partly accepted: adopted, except `openArchive` drops 拍攝 because an open archive can be radar ([SAT] 這次過境沒有這個地點的影像) (§3.4, Appendix A). |

Other changes made while finalising (not in the critique):

- **The radar sentence's 在黑暗中** is conditional, as in the English (only when the sun is below −6°) (§3.4).
- **注視了** only in the post; the three aspect forms are stated as one rule (§2.2).
- **Could's verdict verb** in aria is 經過時在可視範圍內, matching the could card (§3.6).
- **Overhead card** uses 飛越 instead of a place-in-the-middle frame, which would set 上空經過 in the serif block (§3.5).
- **請 exceptions listed**: only `locateErrors.denied` and `faults.catalog`; `faults.compute` becomes 可以稍後再試一次 (§1.1).
- **Curated places** (§4.3): all 57 entries with TW forms and the HK overlay rows; traps for 金門大橋 (Kinmen), crop
  circles, 51區, the Hong Kong sublabel and Everest.
- **`countryName` short style** for HK, MO, PS added to the preconditions, since the code uses the long style today (B.9).
- **The accent subset** is described as the code already does it (base64 in the chunk via `FontFace`), replacing the
  draft's preload with `font-display: optional` (§6.10, B.7).
- **`photoAlt` and `shareLabel`** avoid 拍攝 and 照片, since the image can be radar (Appendix A).
- **`gibsUnconfirmed`** uses 相關過境 so the one form reads for 1 and for many (Appendix A).
- **Blurb rules** for nationalities and Chinese programme names (§5.2).
