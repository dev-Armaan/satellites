# Watched: Vietnamese (vi) localisation style guide

Final, 2026-11-21, after two independent reviews (see Review at the end). Binding for every `vi` string the product shows, speaks or sends: the app, the share cards and
pages, post text, alt text, aria labels, the video, About and the loading screen. Written against `docs/DESIGN.md` §7,
the English namespaces in `src/i18n/en/` (with the curated places in `src/i18n/en/plain/placeNames.ts`), the share
card's `api/_lib/i18n/card/en.ts` and the verdict table `src/i18n/en/verdicts.ts`. Where this guide and a translator's
habit disagree, this guide wins. Where this guide and the English disagree on a fact, the English wins and this guide
is wrong: report it.

One Vietnamese catalog serves Vietnam and the diaspora. It is written in the standard national language (*tiếng Việt
phổ thông*), neither Northern nor Southern colloquial: where the two regions differ (*ô tô* / *xe hơi*, *vào* /
*dzô*), take the form a national newspaper prints.

Notation. Vietnamese copy is in *italics*. In frames and code blocks, `*…*` is the serif accent and `**…**` the bold
count phrase; inside an italic example the accent is written \*…\*. `[PLACE]`, `[SAT]`, `[NUM]`, `[TIME]`, `[ALT]`,
`[DIST]`, `[DIR]`, `[SPEED]`, `[DEG]`, `[PCT]`, `[DAY]`, `[ZONE]` are runtime slots.

**Every Vietnamese string is NFC.** Write precomposed letters (*ầ* U+1EA7, *ể* U+1EC3, *ợ* U+1EE3, *đ* U+0111), never
a base letter plus combining marks. macOS and some Windows keyboards (Unikey in "Unicode tổ hợp" mode) produce
decomposed text that looks identical on screen and breaks search, uppercasing, width measurement and the share card's
glyph check. Run `node -e` with `s.normalize('NFC') === s` over a file before committing it (§6.1).

## 0. Decisions at a glance

| Question | Decision |
|---|---|
| Address | **bạn** on every surface. Never *anh/chị*, *quý khách*, *cậu*, *em*, *mày*. |
| The user's own voice | **tôi** where the English speaks as the user (*Dùng vị trí của tôi*, *Gần tôi*, About's questions). |
| The product's "we" | **chúng tôi**, never *chúng ta*, *ta*, *mình*. |
| "your" | Dropped wherever the context already says whose it is (*Kiểm tra kết nối*, not *Kiểm tra kết nối của bạn*); kept where the second person is the point (*chỗ của bạn*, *mây của bạn*). |
| The product verb "watched" | **quan sát**: *đã quan sát*, verdict *Đã quan sát*. Never *theo dõi* (follow, track), *giám sát* (surveil), *rình*, *do thám*, *chụp* about the reader. |
| image / photo / picture | **ảnh** for every image, radar, mosaics and full-disc frames included; **bức ảnh** after a count in a display sentence; **ảnh chụp** only where the item is certainly an optical photograph; **hình ảnh** for "pictures" uncounted in prose. |
| pass / swath / scene | **lượt bay qua** (unit after a count: **lượt**) / **dải quét** / **cảnh ảnh** (remote-sensing term) or **ảnh**. |
| Verdicts | *Đã quan sát* · *Nhiều khả năng đã quan sát* · *Có thể đã hướng về đây* · *Bay qua trên đầu*; lanes `ẢNH` · `QUÉT QUA` · `CÓ THỂ` · `BAY QUA`. |
| Hero | **Tuần này, / có thứ gì đó / quan sát *bạn*.** (landing: three lines; the default share card: four, §3.1). The existential *có …* after the fronted *Tuần này* reports a past event without *đã*, as Vietnamese does (*Hôm nay có người tìm bạn*); every other sentence keeps it. |
| Plural | One CLDR category, `other`. One noun form for 1 and 1,000; never *các* / *những* after a number. |
| Numbers | `1.715` · `7,46` · `25%` · `5,4°` · `786 km` · `7,46 km/s` |
| Clocks | `16:14:21` (colon), as they arrive, in prose too: *lúc 16:14:21 UTC*. Never *16h14*. |
| Coordinates | International, as the app writes them: `16.2°S 063.0°E`, `0.2°W`. A translator never reformats them; their N (north) beside the compass's N (*nam*) is an open owner question (§4.2). |
| Compass | Prose words *bắc … tây bắc*; readouts the 16 Vietnamese abbreviations `B … BTB` (§4.2). North is **B**, never N (N is *nam*, south). |
| Dates | Day/month in digits, the Vietnamese way: *CN, 1/11* · *Chủ Nhật, 1/11* · `1 → 8/11/2026`; spoken *Chủ Nhật, ngày 1 tháng 11*. Never CLDR's *thg*. |
| Zones | Arrive formatted; a translator never writes or changes one. |
| Time-lapse | The loan **time-lapse** (upright, hyphenated), as Vietnamese photographers and the press write it. |
| Tone marks | The new placement (*hòa*, *thủy*, *hủy*, *khỏe*), and *y* in *kỹ*, *Mỹ*, *lý* (§6.1). |
| Country names | CLDR `vi` via `Intl.DisplayNames`; owner questions on *Lãnh thổ Palestine* and *Biển Đông* (§8). |

---

## 1. Register and address

### 1.1 The decision: *bạn*, standard written Vietnamese, everywhere

Every surface that addresses the reader uses **bạn**. It is the address every international product uses in Vietnamese
(Google, Apple, Facebook, Wikipedia), it is neutral in age and gender (Vietnamese pronouns otherwise encode both), and
it is singular and plural at once, which a share card read by several people needs. The voice is a precise science
writer speaking to one person: not a bank, not a ministry, not a friend on Zalo.

| Surface | Address | Form | Example | Why |
|---|---|---|---|---|
| Display headlines (hero, results headline, About title, panel heads) | *bạn* when the reader is addressed, last in the line where it is the accent | Short declarative, no particle | *Tuần này, có thứ gì đó quan sát \*bạn\*.* | *bạn* is a free word, so it can carry the serif accent alone; ending on it puts the weight where Vietnamese puts emphasis, at the end. |
| Sentences (results, pass detail, notes, post text) | *bạn*; the product is *chúng tôi* | Declarative, standard grammar | *Lúc đó ở đây trời tối. … nên thứ vệ tinh thấy là mây của bạn, chứ không phải phố của bạn.* | Second person is the product's voice. |
| Buttons and links | No pronoun; the user's own voice is *tôi* | Bare verb (*Chia sẻ*, *Sao chép liên kết*, *Thử lại*), never *Hãy*, *Vui lòng*, *Xin* | *Dùng vị trí của tôi* · *Gần tôi* · *Chia sẻ* · *Thử lại* | A button is the user's own command. Where the English speaks as the user ("my", "me"), Vietnamese does too, with *tôi*. |
| Mono caps labels | None | Nouns and short verb phrases | `7 NGÀY QUA` · `ĐỘ CAO` · `ĐỘ NGHIÊNG` | Labels name things. |
| Faults and notices | No pronoun first; *bạn* when a person must act | What failed, then what to do. No *Rất tiếc*, *Xin lỗi*, *Vui lòng* | *Không tải được danh mục quỹ đạo. Kiểm tra kết nối rồi thử lại.* | The English never apologises. Vietnamese apps habitually open with *Rất tiếc,* and close with *Vui lòng thử lại*: longer and servile. |
| About page | *bạn*, *chúng tôi*, and *tôi* in the reader's own questions | Plain conversational standard, short sentences | *Vệ tinh có thấy tôi không?* → *Không. Rõ nhất thì mỗi điểm ảnh ở đây cũng rộng 10 m. Một chiếc ô tô chỉ là một điểm ảnh. Bạn không hiện lên trong ảnh.* | The questions are the reader's, so they say *tôi*; the answers are ours. |

### 1.2 Pronoun mechanics

1. **Drop the possessive where it is obvious.** Vietnamese marks possession far less than English, and *của bạn* on
   every noun is the surest sign of a translation: *Kiểm tra kết nối* (not *kết nối của bạn*), *trong cài đặt trình
   duyệt*, *trên màn hình*. Keep *của bạn* only where the second person is the point: *chỗ của bạn* (the searched spot,
   made yours, as the English does), *mây của bạn*, *bầu trời của bạn*, *đường chân trời của bạn*.
2. **"Your spot" is *chỗ của bạn*** in sentences (*Trời quang ở chỗ của bạn.*). *chỗ* is the everyday word for a spot;
   *vị trí của bạn* would mean "your (GPS) location", which the searched place usually is not. In labels the spot is
   *điểm* (`MÂY TẠI ĐIỂM`).
3. **The product is *chúng tôi*.** *Chúng tôi không thể biết điều đó có xảy ra hay không.* Never *chúng ta* (inclusive:
   it makes the reader a co-author of the claim), never *mình* (chatty), never *Watched* as a stand-in for "we".
4. **The user's own voice is *tôi*:** *Dùng vị trí của tôi*, *Gần tôi*, About's *Vệ tinh có thấy tôi không?* Never
   *mình*, *em*, *tớ*.
5. **Satellites get no personal pronoun.** *nó* for a satellite is spoken Vietnamese and reads careless in writing;
   *họ* is for people. In order of preference: drop the subject (Vietnamese allows it: *Camera hướng thẳng xuống.*),
   *vệ tinh này*, a noun (*camera*, *radar*, *dải quét*, *nhà vận hành*), the name again. A station is *trạm vũ trụ* on
   first mention (*trạm* alone is also a bus stop or a post), then *trạm*; never *họ* (*ảnh của họ* would be the crews'
   own photos).
   One sanctioned *chúng*: the plural "they" for satellites or archives in a long sentence (*những hình ảnh thật mà
   chúng đã ghi lại*), where Vietnamese prose uses it for things.
6. **A company is *họ*** when its people are meant (*các công ty không cho biết họ hướng camera về đâu*).

### 1.3 Rejected

| Option | Why it lost |
|---|---|
| *anh/chị* | Gendered, age-coded, and the register of banks and call centres (*Kính gửi anh/chị*). *Có thứ gì đó đã quan sát anh/chị* is a form letter. |
| *quý khách* | Customer service. The reader is not our customer, and the hero would read like a hotel notice. |
| *cậu*, *bạn ơi*, *mày* | Youthful, chatty or rude: wrong for an instrument. |
| No pronoun at all in the hero (*Tuần này, có thứ gì đó quan sát.*) | Removes the human moment the serif accent exists for. |
| Mixing (*bạn* in sentences, *quý vị* in About) | One persona or none. Translation memory will try to insert *quý khách* and *Vui lòng*: reject them in review. |

### 1.4 Standard written words, not colloquial or bureaucratic

| Use | Never |
|---|---|
| không | hông, hổng, ko, k |
| được | đc, dc |
| rồi (*Kiểm tra kết nối rồi thử lại*) | *sau đó tiến hành thử lại* |
| ảnh | hình (as "photo"; *hình* is reserved for diagrams: *Hình trên là sơ đồ lượt bay*) |
| ô tô | xe hơi (Southern), oto |
| hiện, hiện tại | hiện nay (bureaucratic in UI) |
| cho biết | thông báo đến quý khách |
| thử lại | vui lòng thử lại, xin thử lại |
| không tải được | tải thất bại, đã xảy ra sự cố trong quá trình tải |

**Particles never:** *ạ, nhé, nha, nhỉ, đấy, đó* (as a final particle), *à, ơi, hả, thôi, mà* (as a final particle),
*cơ*. No exclamation marks. No emoji. *Hãy* is allowed in one place only: an instruction that follows a clause inside a
fault sentence, where a bare verb would read as a label (*Thay vào đó, hãy tìm một địa điểm.*). Never on a button.

---

## 2. Voice

### 2.1 How "declarative, specific, quietly uncanny, second person" sounds in Vietnamese

- **Lead with the fact, subject first.** *Sentinel-2C đã bay qua…*, *256 vệ tinh đã quan sát…*. Numbers come early and
  are always digits (they are mono spans).
- **Mark the past once, with *đã*, then let the time words carry it.** Vietnamese has no tense; *đã* in the first
  clause of a pass paragraph makes it a finished event, and the clock (*lúc 16:14:21 UTC*) anchors it. Later sentences
  about the same pass need no *đã*. A pass's conditions take ***lúc đó*** ("at that time"): *Lúc đó ở đây trời tối*,
  never *Ở đây đang tối* (that says it is dark now, false for a pass three days ago). ***đang*** is only for live
  states: *Đang tải…*, *Đang định vị…*.
- **The hero reports, with the existential *có*.** *Tuần này, có thứ gì đó quan sát bạn*: *có …* + verb after a
  fronted time phrase is how Vietnamese reports something that happened (*Hôm nay có người tìm bạn*, "someone came
  looking for you today"), so the verb stands bare. This is a language choice, not a layout one (Review: kept against
  *đã*). Never *đang quan sát* ("is watching"): stronger, and false, since nothing here is live. A sentence with a
  definite subject keeps *đã*, because without it a count reads as a general fact (*256 vệ tinh đã quan sát Waterloo*),
  and so does a question (*thứ gì đã quan sát bạn?*).
- **A negated past takes no *đã*.** *Không ai đến*, never *Không ai đã đến*: *Không vệ tinh nào trong danh mục của
  chúng tôi quan sát Waterloo tuần này.*
- **One idea per sentence, 10 to 25 words.** Vietnamese words are one syllable each, so word counts run higher than in
  English for the same sentence; count a number with its unit (*786 km*) and a clock with its zone (*16:14:21 UTC*)
  as one word. Where English chains three clauses, split into two sentences.
- **Let the colon do the work of "is".** *Lượng mây của cả cảnh ảnh: 25%.* Not *Lượng mây của cả cảnh ảnh là 25%.*
- **Active when the satellite acts, passive only when nobody in particular did it.** Active: *bay qua, quan sát,
  quét qua, ghi lại*. Agentless passive with *được* is natural for publishing (*31 bức ảnh đã được công bố*); never
  *bị* (the adversative passive: *bị quan sát* says you suffered it, which is the escalation §8 forbids), never a
  passive with a *bởi* chain (*được chụp bởi Sentinel-2C* is a calque: write *do Sentinel-2C ghi lại*).
- **The uncanny comes from precision plus "you".** *nên thứ vệ tinh thấy là mây của bạn, chứ không phải phố của bạn.* No
  horror vocabulary, no ellipses for suspense, no rhetorical questions (the one question is the share hook, kept as the
  English has it).
- **Hedges are exact and few:** *nhiều khả năng* (likely, the verdict), *có thể đã* (could have), *khoảng* (about),
  *ít nhất* (at least), *chúng tôi không thể biết* (we can't know). Never *dường như*, *hình như*, *chắc là*, *có lẽ*
  (too close to *có thể* on the verdict ladder, §3.7).
- **No filler.** No *là* where a colon or nothing works; no *việc* + verb (*việc tìm kiếm* → *tìm*); no *tiến hành* +
  verb (*tiến hành quét* → *quét*); no *một* before every noun (English "a" is not Vietnamese *một*: *Camera thường cần
  ánh sáng Mặt Trời*, not *Một camera thường cần một ánh sáng Mặt Trời*); no *các* / *những* where the plural is
  already clear; no *thực hiện* for "do".
- **Vietnamese word order.** Head first: *camera của Sentinel-2C*, *ảnh ghép hằng ngày của NASA*, *kho lưu trữ ảnh*,
  *Địa điểm ví dụ* (never *Ví dụ địa điểm*, "for example: place"). Time and place adverbials go at the start (*Tuần
  này, …*, *Lúc đó …*) or at the end, not between verb and object. Ordinals follow the thing: *Meteosat thứ hai của thế
  hệ thứ ba*, never *thế hệ ba thứ hai*.
- **No English afterthoughts.** A count goes next to its verb (*quét qua nơi này 42 lần bằng hồng ngoại*), never after
  a comma at the end (*…, 42 lần.*); a pixel size is a phrase of its own (*ở độ phân giải 375 m*, *mỗi điểm ảnh rộng
  10 m*), never tacked on (*với 375 m mỗi điểm ảnh*, *, 20 m,*, *ở khoảng 3 m*); an English fragment becomes a clause
  (*Coarse, but real* → *Ảnh thô nhưng là ảnh thật*; *Stations and everything else.* → *Gồm các trạm vũ trụ và mọi thứ
  khác.*). "X, not Y" after *là* is *X, chứ không phải Y*.

### 2.2 What to avoid

- **Marketing:** *Khám phá ngay*, *trải nghiệm*, *tuyệt vời*, *đỉnh cao*, *thời gian thực* (nothing is real time),
  *chỉ với một cú nhấp*, *miễn phí!*.
- **Calques:** *được tạo công khai* (made public: *được công bố*), *ảnh thực tế* (actual image: *ảnh thật*), *bởi*
  for "by", *một* for "a", *nó* for "it", *là* for every "is", *cho* for every "for", *trong khi* for "while" where it
  means "but", *của bạn* on every noun, *khả dụng* for "available" (*không có*, *hiện chưa có*).
- **Escalation:** English says "watched". Never *theo dõi bạn*, *giám sát bạn*, *rình*, *do thám bạn*, *nhắm vào bạn*.
  "Satellites we track" is said as the limit it is, *vệ tinh … trong danh mục của chúng tôi*; *theo dõi* stays only for
  the tracking data itself (*dữ liệu theo dõi của Lực lượng Không gian Hoa Kỳ*).
- **Over-politeness:** *Vui lòng*, *Xin*, *Kính mời*, *Rất tiếc*, *Cảm ơn bạn đã…* on UI chrome.
- **Sino-Vietnamese where a plain word exists** in sentences: *bay qua* not *quá cảnh*, *nhìn thẳng xuống* not *thiên để*
  (天底, nadir),
  *ảnh* not *ảnh viễn thám*. Technical Sino-Vietnamese is right where it is the plain word (*quỹ đạo*, *địa tĩnh*,
  *hồng ngoại*, *xích đạo*).

### 2.3 Before and after

| # | Before (typical first draft) | After | Why |
|---|---|---|---|
| 1 | *Trong 7 ngày qua, 256 vệ tinh đã theo dõi Waterloo.* | *Trong 7 ngày qua, **256 vệ tinh đã quan sát** \*Waterloo\*.* | *theo dõi* is tracking (and Facebook's "Follow"): it overclaims a pass and escalates. |
| 2 | *Hãy khám phá ngay những vệ tinh hiện đại đang giám sát vị trí của quý khách theo thời gian thực!* | *Tuần này, có thứ gì đó quan sát \*bạn\*.* | *Hãy*, marketing, *giám sát*, *quý khách*, a false claim (nothing is real time), an exclamation mark. |
| 3 | *Nó đã nhìn thẳng xuống. Độ che phủ mây trên cảnh là 25%.* | *Camera hướng thẳng xuống. Lượng mây của cả cảnh ảnh: 25%.* | *nó* for a satellite, *cảnh* alone is a film scene, *là* is filler; *lượng mây* is the meteorologist's word; *toàn ảnh* would say the crop on screen is 25% cloud. |
| 4 | *Rất tiếc, chúng tôi không thể xác định một cách chính xác liệu vệ tinh đó có thực hiện việc chụp ảnh địa điểm này hay không.* | *Chúng tôi không thể biết điều đó có xảy ra hay không.* | Apology, *thực hiện việc*, *một cách*, 27 words for 11. |
| 5 | *Ở đây đang tối. Các máy chụp thời tiết tiếp tục quét vào ban đêm trong hồng ngoại, nên nó đã thấy những đám mây của bạn.* | *Lúc đó ở đây trời tối. Vệ tinh khí tượng vẫn quét suốt đêm bằng hồng ngoại, nên thứ vệ tinh thấy là mây của bạn, chứ không phải phố của bạn.* | Present for a past pass, *trong hồng ngoại* (calque of "in infrared": *bằng*), *nó*; the after keeps the two-beat ending. |
| 6 | *Hình ảnh được chụp bởi Sentinel-2C.* | *Ảnh do Sentinel-2C ghi lại.* | *bởi* passive is a calque; *ghi lại* fits radar too. |

---

## 3. The key lines

### 3.1 The hero

Landing (`landing.hero`), three lines:

```
Tuần này,
có thứ gì đó
quan sát *bạn*.
```

- Accent: ***bạn*** alone, serif italic, signal orange. The full stop after it is sans.
- Why this order: Vietnamese puts a sentence's weight at its end, so the reader is the last word, and the accent lands
  where the language stresses. The English puts the time last; a Vietnamese line ending on *tuần này.* would end on the
  least important words. *Tuần này,* opens with its comma, as Vietnamese fronts a time phrase.
- *thứ gì đó* is "some thing": not a person (*ai đó*, "someone", would make it a stalker), and the indefinite *gì đó*
  keeps it unnamed. No *đã*: the existential *có …* after a fronted time phrase reports a past event (*Hôm nay có
  người tìm bạn*; §2.1). Review B asked for *đã* back, reading the bare verb as ongoing or as a horoscope; the native
  review read it as a report, and so does this guide (see Review).
- Lines are 9 / 12 / 13 characters (English 9 / 11 / 10). The last line, which carries the accent, is as long as the
  middle one, where the English puts its weight. Measured at 1280 × 800: the column is 580 px and *quan sát bạn.* sets
  at 578 px, so the hero is three lines there and at 375 px. A 16-character line (*đã quan sát \*bạn\*.*) would wrap
  to a fourth line and push the example chips into the HUD's bottom-left readout: a layout limit for every language
  (Italian's 16-character lines wrap to five lines there today), reported to the landing's owner. Where a display size
  leaves the last line too wide it wraps at its one space before the accent, giving the card's four-line form. That is
  the only break allowed: never `nowrap`, never a manual break elsewhere, never a break inside *quan sát* or *thứ gì
  đó*.
- Screen readers get one sentence: *Tuần này, có thứ gì đó quan sát bạn.*
- Tab title and boot title: *Watched · Tuần này, có thứ gì đó quan sát bạn* (no full stop). Share page title: *Tuần
  này, có thứ gì đó quan sát bạn.* The share hook keeps it, with "too" on the event: *Tuần này, cũng có thứ gì đó quan
  sát bạn.* (*cũng có*, "there was also": *có thứ gì đó cũng quan sát* would put "too" on "something", as if something
  else had watched you as well).

Default share card (`card.hero`), four lines, because the card never re-wraps and its column is 466 px: at 88 px the
condensed face sets about 35 px a character, so *quan sát bạn.* (13) is about 450 px: it would fit, with no margin.
*có thứ gì đó* (12, ≈ 420 px) is the widest of the four, and the reader stands alone on the last line.

```
Tuần này,
có thứ gì đó
quan sát
*bạn*.
```

| Alternate | Why it lost |
|---|---|
| *Tuần này, / có thứ gì đó / đã quan sát \*bạn\*.* | The first version. Correct, but the existential *có …* already reports the past, so *đã* is redundant in a headline; its 16-character last line also wraps on a laptop (above). |
| *Có thứ gì đó / đã quan sát \*bạn\* / tuần này.* | The English order. Grammatical, but it ends on *tuần này*, so the line after the accent deflates it. |
| *Tuần này, / có ai đó / đã quan sát \*bạn\*.* | *ai đó* is a person: a stalker, not a satellite. |
| *Tuần này, / có thứ gì đó / đã theo dõi \*bạn\*.* | *theo dõi* is "followed, tracked": the escalation §8 forbids, and false (a pass does not follow anyone). |
| *Tuần này, / có thứ gì đó / đang quan sát \*bạn\*.* | *đang* says it is happening now. Nothing here is live. |
| *… đã dõi theo \*bạn\*.* | *dõi theo* is "watch over" (a guardian, a lover): tender, not uncanny, and unusable as the product verb (*256 vệ tinh đã dõi theo Waterloo*). |

### 3.2 The sub line

**Chosen** (`landing.sub`, `card.page.description`): *Chọn một nơi bất kỳ trên Trái Đất. Xem mọi vệ tinh đã bay qua
nơi đó trong 7 ngày qua, cùng những hình ảnh thật mà chúng đã ghi lại.*

- No-break space in *7 ngày* (the `days` slot and its unit). *Trái Đất* is capitalised (§6.4).
- *Chọn* (choose), not *Nhập* (type in): the chips and the globe pin are choices too, and *Nhập* is a form.
- *hình ảnh* because the pictures include radar and mosaics; *thật* for "actual" (never *thực tế*, "realistic,
  practical"); *ghi lại* (recorded) because radar does not *chụp* (photograph). *chúng* is the satellites (§1.2 rule 5).
  The relative clause is whole, *mà chúng đã ghi lại*: the clipped *chúng ghi lại* is headline shorthand inside a full
  sentence.
- The default card's footer (`card.enterAnyPlace`) has room for less: *Chọn một nơi trên Trái Đất* (§7).

| Alternate | Why it lost |
|---|---|
| *Nhập bất kỳ địa điểm nào trên Trái Đất. …, và những bức ảnh thực tế mà chúng đã chụp.* | Form-filling; *thực tế* is "practical"; *chụp* overclaims for radar. |
| *…, cùng ảnh thật của nơi đó.* | Drops "they took": the images are the satellites', which is the point. |

### 3.3 Results headline

Vietnamese nouns do not inflect for number, and `Intl.PluralRules('vi')` has one category, `other`. Every row uses the
same noun form; zero is its own sentence.

| Case | English | Vietnamese | Emphasis |
|---|---|---|---|
| N ≥ 1, live window | In the last 7 days, **256 satellites watched** *Waterloo*. | *Trong 7 ngày qua, **256 vệ tinh đã quan sát** \*Waterloo\*.* | bold *256 vệ tinh đã quan sát* (number mono); serif the place |
| N = 1 | … **1 satellite watched** … | *Trong 7 ngày qua, **1 vệ tinh đã quan sát** \*Waterloo\*.* | same |
| Other window length | In the last 5 days, … | *Trong 5 ngày qua, **[NUM] vệ tinh đã quan sát** \*[PLACE]\*.* | same |
| Window that ended | Between 29 Oct and 5 Nov, … | *Từ 29/10 đến 5/11, **256 vệ tinh đã quan sát** \*Waterloo\*.* | same |
| N = 0 | No satellite we track watched *Waterloo* this week. | *Không vệ tinh nào trong danh mục của chúng tôi quan sát \*Waterloo\* tuần này.* | no bold; serif the place |
| N = 0, window that ended | … that week. | *… quan sát \*Waterloo\* tuần đó.* | same |
| A water body | … watched the *Pacific Ocean*. | *… **256 vệ tinh đã quan sát** \*Pacific Ocean\*.* | no class noun, ever |

Frame: `Trong [DAYS] ngày qua, **[NUM] vệ tinh đã quan sát** *[PLACE]*.`

- *vệ tinh* takes no classifier after a number: *256 vệ tinh*, as the press writes it (*chiếc vệ tinh* only for one
  satellite in a story, never in a count).
- The zero sentence says "we track" as the limit it is, *trong danh mục của chúng tôi* ("in our catalog"), and takes
  no *đã*: Vietnamese negates a past event without it (*Không ai đến*, never *Không ai đã đến*). The first version,
  *Không vệ tinh nào mà chúng tôi theo dõi đã quan sát*, needed *mà … đã* only to keep *theo dõi* and *quan sát* apart.

| Alternate | Why it lost |
|---|---|
| *Trong 7 ngày qua, Waterloo đã được 256 vệ tinh quan sát.* | Passive, the place is no longer last, and the bold phrase splits around it. |
| *256 vệ tinh đã quan sát Waterloo trong 7 ngày qua.* | Ends on the time frame. Used only on the card, whose layout puts "this week" after the place. |
| *Tuần này không có vệ tinh nào quan sát Waterloo.* (zero) | Drops "we track": the honest limit is *our* catalog. |

### 3.4 The second line (images made public)

| k | English | Vietnamese |
|---|---|---|
| 0, live window | No images were made public this week. | *Tuần này không có bức ảnh nào được công bố.* |
| 0, window that ended | … that week. | *Tuần đó không có bức ảnh nào được công bố.* |
| 0, card | No images were made public. | *Không có bức ảnh nào được công bố.* |
| 1 | 1 image was made public. | ***1 bức ảnh đã được công bố.*** |
| 31 | 31 images were made public. | ***31 bức ảnh đã được công bố.*** |
| 1,715 | 1,715 images were made public. | ***1.715 bức ảnh đã được công bố.*** |
| partial (k ≥ 1) | At least 31 images were made public. | ***Ít nhất 31 bức ảnh đã được công bố.*** |
| archives down | The image archives didn’t answer, so we can’t count the public images right now. | *Các kho lưu trữ ảnh không phản hồi, nên hiện chúng tôi chưa thể đếm số ảnh công khai.* |
| archives down, card | The image archives didn’t answer. | *Các kho lưu trữ ảnh không phản hồi.* |

- *bức* is the classifier for a picture, and a sentence in the display face reads complete with it; bare *31 ảnh*
  reads like a gallery counter, which is how the mono labels use it (§5.3).
- *công bố* (published, as an agency publishes data) for "made public"; the adjective is *công khai* (*ảnh công khai*,
  *kho lưu trữ công khai*). Never *được công khai hóa*.
- *Ít nhất* sits outside the number span, so the number settles in place without the words moving. The sentence reads
  with and without it.
- One count, always *ảnh* (owner: photos, mosaics, radar and geostationary frames alike).

### 3.5 Pass sentences

**English:** Sentinel-2C crossed 786 km overhead at 16:14:21 UTC, moving south at 7.46 km/s. It was looking straight
down. Cloud cover across the scene: 25%.

**Vietnamese:** *Sentinel-2C đã bay qua ngay trên đầu bạn lúc 16:14:21 UTC ở độ cao 786 km, di chuyển về hướng nam với
tốc độ 7,46 km/s. Camera hướng thẳng xuống. Lượng mây của cả cảnh ảnh: 25%.*

The order is always: what crossed, where from you, when, how high, how it moved. The clock comes before the altitude
so the reader meets the moment first, as Vietnamese narrates (*lúc … ở độ cao …*).

**Two direction words, one table.** Vietnamese says a direction the same way after "moving" and after "to the", but
the product keeps two nouns apart: ***hướng*** for where the satellite moved (*di chuyển về hướng nam*) and ***phía***
for where it was from you (*cách bạn 61 km về phía tây*). The two then never stand side by side as *về phía … về phía*.

| Verdict / case | Frame |
|---|---|
| imaged, overhead (< 15 km) | `[SAT] đã bay qua ngay trên đầu bạn lúc [TIME] ở độ cao [ALT], di chuyển về hướng [DIR] với tốc độ [SPEED].` |
| imaged, offset | `[SAT] đã bay qua lúc [TIME] ở độ cao [ALT], cách bạn [DIST] về phía [DIR], di chuyển về hướng [DIR] với tốc độ [SPEED].` |
| nadir | `Camera hướng thẳng xuống.` |
| off-nadir | `Camera nghiêng [DEG] so với phương thẳng đứng.` |
| cloud | `Lượng mây của cả cảnh ảnh: [PCT].` (the archive's figure for the whole scene, not the crop on screen; the strip's unit is `CẢNH ẢNH`) |
| imaged, daily mosaic (2nd) | `Cảm biến [SENSOR] đã ghi lại [PLACE] cho ảnh ghép màu thực hằng ngày của NASA, ở độ phân giải [GSD].` |
| imaged, radar (2nd) | `Radar của vệ tinh, chếch [DEG] sang một bên, đã ghi lại [PLACE] ở độ phân giải [GSD].` + dark: `…ở độ phân giải [GSD], trong bóng tối.` |
| imaged, geostationary | `[SAT] không bay qua. Vệ tinh này đứng yên ở độ cao [ALT] trên xích đạo tại [LON] và quét cả nửa Trái Đất bên dưới mỗi [N] phút.` (no seat: drop *tại [LON]*; no cadence: end at *bên dưới.*; *toàn bộ mặt Trái Đất* would be the whole surface) |
| geostationary, line | `Đường quét lần này tới [PLACE] vào khoảng [TIME], di chuyển về hướng [DIR].` |
| geostationary, infrared | `Lúc đó ở đây trời tối, nên đây là ảnh hồng ngoại: đỉnh mây theo nhiệt độ, càng lạnh càng sáng.` |
| likely | the imaged clause, then `, và chỗ của bạn nằm trong dải quét rộng [SWATH].` (no swath known: a full stop after the clause) |
| could, overhead | `[SAT] đã bay qua trong tầm nhìn lúc [TIME], ngay trên đầu bạn.` |
| could, offset | `[SAT] đã bay qua trong tầm nhìn lúc [TIME], cách bạn [DIST] về phía [DIR].` |
| overhead | `[SAT] đã bay qua lúc [TIME] ở độ cao [ALT], cao [ELEV] trên đường chân trời của bạn, về phía [DIR].` · ≥ 80°: `…, cao [ELEV] trên đường chân trời của bạn, gần như ngay trên đầu.` |

Second sentences:

| English | Vietnamese |
|---|---|
| It was daylight, so it would have recorded this spot. The archive could not be searched just now. | *Lúc đó trời sáng, nên nhiều khả năng vệ tinh đã ghi lại điểm này. Hiện chưa tra cứu được kho lưu trữ.* (the verdict's own hedge, below the next row's *gần như chắc chắn*; never *hẳn*, "must have") |
| No scene exists for this pass. Sentinel-2 records only land and coastal water, and may not have scheduled this spot. | *Không có cảnh ảnh nào từ lượt bay này. Sentinel-2 chỉ ghi ảnh đất liền và vùng nước ven biển, và có thể đã không lên lịch chụp điểm này.* |
| It was daylight, so it almost certainly recorded this spot. No scene from this pass has been published yet; archives can lag by a day or more. | *Lúc đó trời sáng, nên gần như chắc chắn vệ tinh đã ghi lại điểm này. Chưa có cảnh ảnh nào từ lượt bay này được công bố; các kho lưu trữ có thể chậm một ngày hoặc hơn.* |
| It was dark here. Weather imagers keep scanning at night in infrared, so it saw your clouds, not your streets. | *Lúc đó ở đây trời tối. Vệ tinh khí tượng vẫn quét suốt đêm bằng hồng ngoại, nên thứ vệ tinh thấy là mây của bạn, chứ không phải phố của bạn.* |
| NASA’s daily mosaic for this pass could not be confirmed at your spot. | *Chưa xác nhận được ảnh ghép hằng ngày của NASA cho lượt bay này ở chỗ của bạn.* |
| Its images feed weather forecasts; they are not published as pictures we can show. | *Ảnh của vệ tinh này dùng cho dự báo thời tiết; chúng không được công bố thành hình ảnh mà chúng tôi có thể hiển thị.* |
| Waterloo was inside its 290 km swath. Its operator does not publish where it imaged, so we can’t know whether it did. | *Waterloo nằm trong dải quét rộng 290 km của vệ tinh này. Nhà vận hành không công bố vệ tinh đã chụp những nơi nào, nên chúng tôi không thể biết nơi này có được chụp hay không.* |
| Radar sees through cloud and darkness. Pointing 12.3° to the side, it could have mapped Waterloo. We found no published image of it from this pass. | *Radar nhìn xuyên mây và bóng tối. Nếu chếch 12,3° sang một bên, vệ tinh này có thể đã ghi ảnh Waterloo. Chúng tôi không tìm thấy ảnh nào được công bố từ lượt bay này.* |
| … We can’t know whether it did. (private radar) | *… Chúng tôi không thể biết điều đó có xảy ra hay không.* |
| Looking straight down, it could have watched Waterloo. We can’t know whether it did. | *Nếu nhìn thẳng xuống, vệ tinh này có thể đã quan sát Waterloo. Chúng tôi không thể biết điều đó có xảy ra hay không.* |
| Pointing 12.3° off straight down, it could have watched Waterloo. … | *Nếu nghiêng 12,3° so với phương thẳng đứng, vệ tinh này có thể đã quan sát Waterloo. …* |
| It was dark where you are. If the station was still in sunlight, it crossed your sky as a bright, steady point. | *Lúc đó chỗ bạn trời tối. Nếu khi ấy trạm vũ trụ vẫn còn được Mặt Trời chiếu sáng, thì trạm đã băng qua bầu trời của bạn như một chấm sáng đều, không nhấp nháy.* |

- *ngay trên đầu bạn* is "overhead": the everyday phrase for a plane or a satellite passing straight above, with the
  reader in it. Never *trên thiên đỉnh* in a sentence (a textbook word).
- *Camera* (the loanword every Vietnamese reader uses) replaces English "It"; *máy ảnh* is a consumer camera.
- *Nếu…* ("if") carries the English participle "Pointing 12.3° …, it could have…": a Vietnamese sentence cannot hang a
  participle on a missing subject.
- "Overhead" for altitude angle: *cao 64° trên đường chân trời của bạn*. The readout calls it *góc ngẩng* (§4.1); in a
  sentence *cao … trên đường chân trời* is what a person says.

| Alternate | Why it lost |
|---|---|
| *… ở độ cao 786 km ngay trên đầu lúc 16:14:21 UTC …* | Altitude first buries the moment; *trên đầu* without *bạn* loses the second person. |
| *… 786 km, 61 km về phía tây, lúc …* | Three stacked adverbials, and "west of what?". *cách bạn 61 km về phía tây* answers it. |
| *… di chuyển về phía nam …* after *cách bạn … về phía tây* | *về phía … về phía* twice in one sentence; *hướng* for motion keeps them apart. |
| *Cảm biến VIIRS đã quét Waterloo vào ảnh ghép…* | Calque of "swept into". |

### 3.6 Share card, share page and post

**Every card leads with the week's N** (`card.headline`); the place and its full stop are the serif block.

| Card | Lead (display) | Serif block |
|---|---|---|
| Pass card, N ≥ 1 | `[NUM] vệ tinh đã quan sát` | `*[PLACE].*` |
| Week card | `[NUM] vệ tinh đã quan sát` | `*[PLACE] tuần này.*` |
| Week card, N = 0 | `Không vệ tinh nào trong danh mục của chúng tôi quan sát` (three lines at most) | `*[PLACE] tuần này.*` |
| Place cut short (`cut`) | as above | the place with its "…", no full stop |

**Legacy shares** (stored before N was kept; `card.headlineBy`), one per verdict:

| Verdict | Lead | Serif |
|---|---|---|
| imaged | `[SAT] đã quan sát` | `*[PLACE].*` |
| likely | `[SAT] đã quét qua` | `*[PLACE].*` |
| could | `[SAT] có thể đã hướng về` | `*[PLACE].*` |
| overhead | `[SAT] đã bay qua` | `*[PLACE].*` |

Card words:

| Key | Vietnamese |
|---|---|
| `photos` | §3.4 card forms |
| `cloud.only` | sub *Mây che kín. Chỉ thấy mây.* · chip *Mây che kín · 92%* · post *Chỉ thấy mây.* · desc *Chỉ thấy mây (92%).* |
| `cloud.mostly` | sub *Phần lớn là mây: 78% cảnh ảnh.* · chip *Phần lớn là mây · 78%* · post / desc *Phần lớn chỉ thấy mây (78%).* |
| `cloud.spot` | sub *Mây che ngay điểm này.* · chip *Mây trên điểm này* · post / desc *Mây che đúng điểm đó.* (no spot is on screen in a post: refer back with *đó*) |
| `stamp` | `CN, 1/11/2026 · 11:21 EST` |
| `weekTo` / `lastWeek` | *7 ngày tính đến 1/11/2026* / *7 ngày qua* |
| `readout` | *Độ cao* · *Góc ngẩng* · *Tốc độ* · *Độ nghiêng* · *Điểm ảnh* · *Điểm ảnh ghép* · *Gần nhất* |
| `lane` | *Ảnh* · *Quét qua* · *Có thể* · *Bay qua* |
| `unit` | *km* · *m* · *km/s* |
| `geometry` | *Hình học lượt bay · bắc ở trên* |
| `note` | *Xem ảnh trong ứng dụng* · *Hiện không tải được ảnh* (an image exists; *chưa có ảnh* would say there is none) · *Kho thương mại, không công khai* · *Trong dải quét, chưa có ảnh công khai* · *Vệt quỹ đạo lúc gần nhất* |
| `acquiring` | *Đang thu nhận…* |
| `noPublicPhoto` / `noPhoto` | *Tuần này không có ảnh công khai* / *Không có ảnh để hiển thị* |
| `look` | *Chi tiết nhất* · *Không mây mới nhất* · *Mây che kín* · *Radar*; `lookDay` *3/11* |
| `aSatellite` | *Một vệ tinh* |
| `invite` | *Thứ gì đã quan sát bạn?* |
| `enterAnyPlace` | *Chọn một nơi trên Trái Đất* |
| `defaultPlace` | *Palm Jumeirah* |
| `defaultAlt` | *Ảnh thật của Palm Jumeirah, Dubai, do vệ tinh Sentinel-2 chụp, bên cạnh dòng chữ: Tuần này, có thứ gì đó quan sát bạn. Chọn một nơi trên Trái Đất.* (*thật* right after *ảnh*; an optical photograph, so *chụp*) |
| `page.title` / `page.description` | *Tuần này, có thứ gì đó quan sát bạn.* / §3.2 sub line |
| `page.placeTitle` | *Những gì đã quan sát [PLACE] tuần này* (no full stop: a noun phrase; *Thứ gì …* without "?" is a question cut short) |
| `page.placeDescription` | *Mọi vệ tinh đã bay qua [PLACE] trong 7 ngày qua, cùng những hình ảnh thật mà chúng đã ghi lại. Tuần này, thứ gì đã quan sát bạn?* |
| `page.opening` | *Đang mở* + accent *Watched* |
| `crossed` | *[SAT] đã bay qua [PLACE] ở độ cao [ALT] lúc [CLOCK] [ZONE], [DAY], di chuyển về hướng [DIR].* · no altitude: *[SAT] đã bay qua [PLACE] lúc …* ([DAY] = *Chủ Nhật 1/11/2026*; each clause only when known) |
| `withinView` | *[PLACE] đã nằm trong tầm nhìn của [SAT] lúc [CLOCK] [ZONE], [DAY], khi vệ tinh di chuyển về hướng [DIR].* |
| `couldHave` | *Vệ tinh này có thể đã hướng về đây. Nhà vận hành không cho biết điều đó có xảy ra hay không.* |
| `straightDown` / `offNadir` | *Camera hướng thẳng xuống.* / *Camera nghiêng 12,3° so với phương thẳng đứng.* |
| `cloudCover` / `inSwath` | *Lượng mây: 25%.* / *[PLACE] nằm trong dải quét.* |
| `bestFrom` | *Ảnh chi tiết nhất do [SAT] ghi lại.* · *Ảnh không mây mới nhất do [SAT] ghi lại.* · *Ảnh đầu tiên do [SAT] ghi lại.* |
| `question` | *Tuần này, thứ gì đã quan sát bạn?* |
| `cardAlt` | *Thẻ chia sẻ của Watched, với ảnh chi tiết nhất trong tuần, do [SAT] ghi lại.* / *Thẻ chia sẻ của Watched.* |

- The stamp keeps the weekday: *CN, 1/11/2026* is unambiguous in caps (`CN, 1/11/2026`), unlike Indonesian's *MIN*.
- `withinView` starts with the place, which Vietnamese allows (no case, no capital to lose: a place name starts with
  its own capital), because "[SAT] passed within view of [PLACE]" has no natural Vietnamese verb; a nameless satellite
  is *một vệ tinh* after *của*.
- The question is *thứ gì* ("what thing"), echoing the hero's *thứ gì đó*. It keeps *đã*: a question asks what
  happened, where the hero states it.

**Post** (`share.post`; X counts 280; the code drops the hook first, then trims the lead). `[WHEN]` is *lúc [CLOCK] giờ
địa phương, Chủ Nhật 1/11*: the clock first, as Vietnamese says a moment, then the day.

| Kind | Vietnamese |
|---|---|
| imaged | *[SAT] đã quan sát [PLACE] từ độ cao [ALT] [WHEN]. Mỗi điểm ảnh rộng [PIXEL]; đây là ảnh thật.* (no pixel: *… [WHEN]. Đây là ảnh thật.*) |
| clouded | *[SAT] đã quan sát [PLACE] từ độ cao [ALT] [WHEN]. [CLOUD]* |
| likely | *[SAT] đã quét qua [PLACE] từ độ cao [ALT] [WHEN]. Dải quét của camera đã phủ điểm đó.* |
| could | *[PLACE] đã nằm trong tầm nhìn của [SAT] [WHEN]. Vệ tinh này có thể đã hướng về đây. Nhà vận hành không cho biết điều đó có xảy ra hay không.* |
| overhead | *[SAT] đã bay qua [PLACE] ở độ cao [ALT] [WHEN].* |
| week | *31 vệ tinh đã quan sát Waterloo tuần này. 12 bức ảnh đã được công bố.* |
| hooks | *Tuần này, cũng có thứ gì đó quan sát bạn.* · *Tuần này, thứ gì đã bay qua trên đầu bạn?* |
| credit | *via @armaangupt0* (the X convention; never *qua*) |
| file names | `watched-sentinel-2c-waterloo-2026-11-01.png` · `watched-waterloo-tuan-2026-11-01.png` · video fallback word `dia-diem` |

**Share sheet:** *Chia sẻ lượt bay này* · *Chia sẻ ảnh này* · *Chia sẻ tóm tắt tuần này* (never *Chia sẻ tuần này*,
which reads "share, this week") · *Đóng* · *Đóng (Esc)* · *Chia sẻ ảnh* · *Đang tạo ảnh…* · *Chia sẻ* · *Sao chép liên
kết* · *Đã sao chép* · *Đăng lên X* · *Sao chép ảnh* · *Lưu PNG* · *Thử lại* · link label *Liên kết* · post label *Bài
đăng* · *Liên kết trực tiếp: hiện chưa tạo được liên kết rút gọn* · *Đang tạo liên kết…* · *Tạo khi bạn chia sẻ* ·
*Trình duyệt này không vẽ được thẻ chia sẻ; liên kết vẫn dùng được.* (the English "here" is this browser)

### 3.7 The four verdicts (one vocabulary, `verdicts`)

The ladder reads image > swept over > maybe > passed, in titles and lanes alike.

| Verdict | Title | Lane (mono caps, ≤ 8) | Count unit | Definition | Spoken verb | Card lead (legacy) |
|---|---|---|---|---|---|---|
| imaged | **Đã quan sát** | `ẢNH` | lượt | *Có ảnh thật của nơi này trong một kho lưu trữ công khai.* | **đã quan sát** | *đã quan sát* |
| likely | **Nhiều khả năng đã quan sát** | `QUÉT QUA` | lượt | *Dải quét của một camera hướng cố định đã phủ nơi này. Chưa có ảnh nào của nơi này được công bố.* | **đã quét qua** | *đã quét qua* |
| could | **Có thể đã hướng về đây** | `CÓ THỂ` | lượt | *Nơi này đã nằm trong tầm với của một camera xoay hướng được hoặc của tư nhân. Nhà vận hành không cho biết camera có nhìn về đây hay không.* | **đã bay qua trong tầm nhìn** | *có thể đã hướng về* |
| overhead | **Bay qua trên đầu** | `BAY QUA` | lượt | *Đã băng qua bầu trời của bạn. Gồm các trạm vũ trụ và mọi thứ khác.* | **đã bay qua trên đầu** | *đã bay qua* |

- **Count unit:** *1 lượt*, *31 lượt*, tile `31 LƯỢT`. *lượt* is the Vietnamese count word for occurrences (*lượt xem*,
  *lượt truy cập*) and stands for *lượt bay qua*. Never *lần* for a pass (*lần* is "times": `42 lần`).
- **Titles:** *Nhiều khả năng* ("most likely") is the measured news-register hedge, clearly above *Có thể* ("could").
  The title is 26 characters and wraps to two lines in the results tile (as English *Could have pointed here* does):
  accepted, because every shorter form costs the ladder (*Có lẽ đã quan sát* shares its *có* with the could verdict and
  reads as a guess; *Hẳn đã quan sát* overclaims; *Khả năng cao* is a forecast's phrase).
- **Lanes:** the English lane words come from the titles, but a bare *KHẢ NĂNG* means "ability" as much as
  "likelihood", and *CÓ LẼ / CÓ THỂ* blur. So the likely lane says what happened, the verdict's own verb: `QUÉT QUA`
  ("swept over"). The ladder `ẢNH · QUÉT QUA · CÓ THỂ · BAY QUA` reads in order and stays honest. 8 characters or
  fewer (the Timeline's lane column leaves about 58 px at 9.5 px mono: `QUÉT QUA` and `BAY QUA` measure as English
  `OVERHEAD`).
- **Prose keeps *có thể đã*** for "could have" (*vệ tinh này có thể đã quan sát Waterloo*); About quotes the title as
  *“có thể đã hướng về đây”*.
- **About's second sentences** (`about.verdictMore`): imaged *Nếu chúng tôi hiển thị, đó là ảnh thật.* · likely *Ảnh
  chưa được công khai, hoặc đã bị loại vì nhiều mây.* · could *Không có cách nào biết camera có thật sự làm vậy hay
  không.* · overhead empty.
- **The timeline's spoken summary** cannot put a verdict name after a bare count (*31 đã quan sát* has no noun), so
  each verdict is named, then a colon and its count: *Dòng thời gian 7 ngày. Đã quan sát: 31; Nhiều khả năng đã quan
  sát: 12; Có thể đã hướng về đây: 4; Bay qua trên đầu: 7.*
- **Pass row verbs** (aria): *Sentinel-2C, đã quan sát, Thứ Sáu, ngày 6 tháng 11, 16:14 EST, 41 giờ trước, lượng mây 25
  phần trăm, mây che kín*.

| Rejected | Why |
|---|---|
| imaged *Đã chụp* / lane `ẢNH CHỤP` | Owner: "watched", never "photographed"; and radar is not *chụp* in the strict sense. |
| imaged *Đã theo dõi* | Tracking: escalates and overclaims (§8). |
| likely *Có lẽ đã quan sát* / lane `CÓ LẼ` | Shares *có* with *Có thể*; *có lẽ* is a guess, not a measure. |
| likely lane `KHẢ NĂNG` | Reads "capability" as readily as "likelihood". |
| could *Có thể đã nhắm vào đây* | *nhắm* is aiming a weapon. Over Gaza or Ukraine, unacceptable. |
| could *Có thể đã chĩa về đây* | *chĩa* is pointing a gun or a finger. |
| overhead *Đi qua phía trên* | Flat; *bay qua* is how Vietnamese says it of anything in the sky. |

### 3.8 Reference lines (translators copy these patterns)

**Landing**

| English | Vietnamese |
|---|---|
| Last 7 days · 1 → 8 NOV 2026 UTC | `7 ngày qua · 1 → 8/11/2026 UTC` |
| Search a place / Place / Searching / Search unavailable | *Tìm địa điểm* / *Địa điểm* / *Đang tìm* / *Không tìm kiếm được* (the act of searching failed: *Không tìm được* would say nothing was found, which is *Không có kết quả*) |
| 6 matches / No match / Name, address or lat, lon | *6 kết quả* / *Không có kết quả* / *Tên, địa chỉ hoặc tọa độ* |
| The place search isn’t answering. Coordinates such as 43.47, −80.54 still work. | *Dịch vụ tìm địa điểm không phản hồi. Bạn vẫn có thể nhập tọa độ, chẳng hạn 43.47, −80.54.* (a service answers, an action does not; *chẳng hạn* introduces an example; keep the example as written: the field parses it) |
| Nothing matches “x”. Try a city, a landmark, or coordinates. | *Không có kết quả cho “x”. Thử một thành phố, một địa danh hoặc tọa độ.* |
| Use my location / Locate me / Near me / Locating… | *Dùng vị trí của tôi* / *Định vị* / *Gần tôi* / *Đang định vị…* (a live state; bare *Định vị…* reads as a command; the chip row scrolls, so the chip may grow) |
| Cancel / Cancel locating / Requesting position / Naming the place / 04 S | *Hủy* / *Hủy định vị* / *Đang lấy vị trí* / *Đang tìm tên nơi này* / `04 GIÂY` |
| Your position goes to the Photon geocoder to name the place. We store only a ~10 km cell. | *Vị trí của bạn được gửi tới Photon, một dịch vụ tra tên địa điểm, để biết nơi này tên gì. Chúng tôi chỉ lưu một vùng rộng khoảng 10 km.* |
| Location access is blocked. Allow it in your browser settings, or search for a place. | *Quyền truy cập vị trí đang bị chặn. Bật lại trong cài đặt trình duyệt, hoặc tìm một địa điểm.* |
| Your position isn’t available right now. Search for a place instead. | *Hiện không xác định được vị trí của bạn. Thay vào đó, hãy tìm một địa điểm.* |
| Or try / Or click the globe to drop a pin / Drop a pin / Example places (aria) | *Hoặc thử* / *Hoặc bấm vào quả địa cầu để thả ghim* / *Thả ghim* / *Địa điểm ví dụ* |
| Hold the globe anywhere to move it / No named place nearby | *Nhấn giữ quả địa cầu để dời ghim* (*Nhấn giữ* is press-and-hold; bare *Giữ* is "keep") / *Không có địa danh ở gần* (146 of 156 px; *gần đây* also reads "recently") |
| Surprise me / Surprise me: a famous place picked at random | *Ngẫu nhiên* / *Ngẫu nhiên: một địa danh nổi tiếng bất kỳ* (never *Làm tôi bất ngờ*) |
| Built by @armaangupt0 | *Do @armaangupt0 thực hiện* (never *Được xây dựng bởi*) |

**Results, notes and faults**

| English | Vietnamese |
|---|---|
| The sun never rose, so no daylight camera could see it. | *Mặt Trời không hề mọc, nên không camera thường nào có thể thấy nơi này.* (barely rose: *Mặt Trời gần như không mọc*) |
| Weather satellites still swept it in infrared, 42 times. | *Vệ tinh khí tượng vẫn quét qua nơi này 42 lần bằng hồng ngoại.* (the count by its verb) |
| Radar doesn’t need light. Umbra, Capella and 7 other radar satellites passed within range 1,204 times. | *Radar không cần ánh sáng. Umbra, Capella và 7 vệ tinh radar khác đã bay qua trong tầm nhìn 1.204 lần.* (never a bare *trong tầm*) |
| (zero reason) Sentinel-2 or Landsat crossed it 3 times in daylight, but no scene has been published yet. | *Sentinel-2 hoặc Landsat đã bay qua nơi này 3 lần vào ban ngày, nhưng chưa có cảnh ảnh nào được công bố.* (once: *một lần*, plain prose, §5.3) |
| (zero reason) No open imaging satellite crossed it in daylight. | *Không vệ tinh chụp ảnh công khai nào bay qua nơi này vào ban ngày.* |
| No satellite we track crossed this place in the window. That is rare; the notes above say if a data source was down. | *Trong khoảng thời gian này, không vệ tinh nào trong danh mục của chúng tôi bay qua nơi này. Điều đó hiếm khi xảy ra; ghi chú phía trên sẽ cho biết nếu có nguồn dữ liệu bị gián đoạn.* |
| The Sentinel-2 and Landsat archives were too slow to answer; passes are shown from orbital geometry only. | *Kho lưu trữ Sentinel-2 và Landsat phản hồi quá chậm; các lượt bay chỉ được tính theo hình học quỹ đạo.* |
| Orbital elements are 3 days old, so pass times may be off by a few minutes. | *Tham số quỹ đạo có từ 3 ngày trước, nên giờ bay qua có thể lệch vài phút.* (*đã cũ 3 ngày* copies "3 days old") |
| Sentinel-2 listed via Earth Search (Planetary Computer search unavailable). | *Sentinel-2 được liệt kê qua Earth Search (không tìm kiếm được trên Planetary Computer).* |
| No operational geostationary weather imager sees this place above 5° elevation. | *Từ nơi này, không vệ tinh khí tượng địa tĩnh nào đang hoạt động nằm cao hơn 5° trên đường chân trời.* |
| The image archives are slow to answer. If they don’t, the passes will still be shown from orbital geometry, and we’ll say so. | *Các kho lưu trữ ảnh đang phản hồi chậm. Nếu không có phản hồi, các lượt bay vẫn sẽ được tính theo hình học quỹ đạo, và chúng tôi sẽ ghi rõ điều đó.* |
| Check your place / New search / Share this week at Waterloo | *Xem nơi bạn ở* (never *nơi của bạn*) / *Tìm kiếm mới* / *Chia sẻ tóm tắt tuần này về Waterloo* (a summary is *về* a place) |
| No public image (geostationary cell, 64 px, ~9 capitals a line) | *Không ảnh công khai*, with a no-break space in *công khai* (sets KHÔNG ẢNH / CÔNG KHAI on laptops and phones; *Không có ảnh công khai* split *công / khai*) |
| Play replay / Pause replay / In view 37 s | *Phát* / *Tạm dừng* (never the footer's *Phát lại lượt bay*: two buttons, two names) / `TẦM NHÌN 37 GIÂY` (the legend's noun label: *Trong tầm nhìn 37 giây* pushed the end clock off a 390 px phone; never a bare *Trong tầm*) |
| Could not load the orbit catalog. Check your connection and try again. | *Không tải được danh mục quỹ đạo. Kiểm tra kết nối rồi thử lại.* |
| Something went wrong computing passes for this place. Try again in a moment. | *Đã xảy ra lỗi khi tính các lượt bay qua nơi này. Thử lại sau giây lát.* |
| Something went wrong. (the fallback) | *Đã xảy ra lỗi.* |
| Fault / Try again / Trying… / Back | `SỰ CỐ` / *Thử lại* / *Đang thử…* / *Quay lại* |
| Slow connection, still loading / Loading Watched | *Kết nối chậm, vẫn đang tải* / *Đang tải Watched* |
| Loading orbital elements / Report ready | *Đang tải tham số quỹ đạo* / *Báo cáo đã sẵn sàng* |
| LOADING ORBITAL CATALOG · CATALOG · 16,893 OBJECTS | `ĐANG TẢI DANH MỤC QUỸ ĐẠO` · `DANH MỤC · 16.893 VẬT THỂ` |
| PROPAGATING 9,120 ORBITS · 7 DAYS / PROPAGATING ORBITS · 3,000 / 9,120 | `ĐANG TÍNH 9.120 QUỸ ĐẠO · 7 NGÀY` / `ĐANG TÍNH QUỸ ĐẠO · 3.000 / 9.120` (never *lan truyền*) |
| SEARCHING SENTINEL-2 + LANDSAT ARCHIVES | `ĐANG TRA KHO SENTINEL-2 + LANDSAT` |
| MATCHING 12 SCENES TO 31 PASSES | `ĐANG ĐỐI CHIẾU 12 ẢNH VỚI 31 LƯỢT BAY` |
| VERIFYING NASA WEATHER MOSAICS · 3 / 12 | `ĐANG KIỂM TRA ẢNH THỜI TIẾT NASA · 3 / 12` |
| 31 PASSES · 12 IMAGES | `31 LƯỢT · 12 ẢNH` |

**Pass detail**

| English | Vietnamese |
|---|---|
| WorldView Legion 4 passed within view at 10:52 EST. It could have watched Waterloo. We can’t know whether it did. | *WorldView Legion 4 đã bay qua trong tầm nhìn lúc 10:52 EST, ngay trên đầu bạn. Nếu nhìn thẳng xuống, vệ tinh này có thể đã quan sát Waterloo. Chúng tôi không thể biết điều đó có xảy ra hay không.* |
| Meteosat-12 doesn’t pass. It sits 35,778 km above the equator at 0.2°W and scans the whole face of the Earth below it every 10 minutes. This scan’s line reached Paris at about 07:49 CET, moving north. | *Meteosat-12 không bay qua. Vệ tinh này đứng yên ở độ cao 35.778 km trên xích đạo tại 0.2°W và quét cả nửa Trái Đất bên dưới mỗi 10 phút. Đường quét lần này tới Paris vào khoảng 07:49 CET, di chuyển về hướng bắc.* |
| ISS passed 420 km up at 19:02 WIB, 64° above your horizon to the west. | *ISS đã bay qua lúc 19:02 WIB ở độ cao 420 km, cao 64° trên đường chân trời của bạn, về phía tây.* (the clock first, as every pass sentence) |
| Its VIIRS imager swept Waterloo into NASA’s daily true-colour mosaic at 375 m per pixel. | *Cảm biến VIIRS đã ghi lại Waterloo cho ảnh ghép màu thực hằng ngày của NASA, ở độ phân giải 375 m.* |
| A full-disc image: one picture of everything the satellite can see, at 2 km a pixel here. Coarse, but real, … it has taken one like it every 10 minutes all week. | *Ảnh toàn đĩa: một bức ảnh ghi lại mọi thứ vệ tinh nhìn thấy, mỗi điểm ảnh ở đây rộng 2 km. Ảnh thô nhưng là ảnh thật, và là ảnh mới nhất được công bố; suốt tuần, vệ tinh này cứ 10 phút lại ghi một ảnh như vậy.* (the frame can be infrared: *ghi*, never *chụp*) |
| Crewed stations carry cameras, but their photos are not published by place and time. | *Các trạm vũ trụ có người ở đều mang camera, nhưng ảnh từ các trạm này không được công bố theo địa điểm và thời gian.* |
| No public image: commercial archives are private. Plan view of the pass. | *Không có ảnh công khai: kho lưu trữ thương mại không công khai. Hình trên là sơ đồ lượt bay.* |
| No published scene matches this pass yet. Sentinel-2 and Landsat scenes usually appear within a day. | *Chưa có cảnh ảnh nào được công bố khớp với lượt bay này. Ảnh Sentinel-2 và Landsat thường xuất hiện trong vòng một ngày.* |
| A radar image, not a photograph: Sentinel-1 sends out microwaves and records their echo, … | *Ảnh radar, không phải ảnh chụp: Sentinel-1 phát sóng vi ba và ghi lại sóng phản xạ, …* |
| Reading the pixel at your spot… / Clear over your spot. / Your spot was in cloud shadow. | *Đang đọc điểm ảnh ở chỗ của bạn…* / *Trời quang ở chỗ của bạn.* / *Chỗ của bạn nằm trong bóng mây.* |
| Thin cirrus flagged over your spot; it may soften the picture. | *Có dấu hiệu mây ti mỏng ở chỗ của bạn; ảnh có thể hơi mờ.* |
| Download image / Downloading… / Open image to save it / View source · Planetary Computer | *Tải ảnh xuống* / *Đang tải xuống…* / *Mở ảnh để lưu* / *Xem nguồn · Planetary Computer* |
| 01 / Geometry · 02 / Replay | `01 / HÌNH HỌC` · `02 / PHÁT LẠI` |

**Gallery, viewer, time-lapse**

| English | Vietnamese |
|---|---|
| Photos (bar, viewer dialog) / Show photos | *Ảnh* / *Hiện ảnh* |
| All / Detailed / Weather / Radar | *Tất cả* / *Chi tiết* / *Thời tiết* / *Radar* |
| Every photo, newest first after the closest look | *Mọi ảnh: chi tiết nhất trước, rồi đến mới nhất* |
| 12 this week / 12 that week | *Tuần này: 12* / *Tuần đó: 12* |
| Previous photo · Previous (←) / Photo 3 of 11 / All photos | *Ảnh trước* · *Trước (←)* / *Ảnh 3 trong số 11* / *Tất cả ảnh* |
| Closest look / Last clear look / Clouded over | *Chi tiết nhất* / *Không mây mới nhất* / *Mây che kín* |
| This week’s passes saw mostly cloud / Here’s the last clear look | *Các lượt bay tuần này chủ yếu chỉ thấy mây* / *Đây là ảnh không mây mới nhất* |
| Clear (photo status) / Clear at spot (viewer) / Clear (spot value under *Mây tại điểm*) | *Không mây* / *Điểm không mây* / `QUANG` (≤ 7, and the label says what it is) |
| Clouded · 25% / Clouded over · 25% / Cloud at your spot | *Có mây · 25%* / *Mây che kín · 25%* / *Có mây ở chỗ của bạn* |
| Replay / Replay this pass / View / Share this pass | *Phát lại* / *Phát lại lượt bay này* / *Xem* / *Chia sẻ lượt bay này* |
| Acquiring / No image returned / Retry | *Đang thu nhận* / *Không nhận được ảnh* / *Thử lại* |
| Still rendering. Large scenes can take 10 s or more. | *Vẫn đang tạo ảnh. Cảnh ảnh lớn có thể mất từ 10 giây trở lên.* |
| Line 0412 → 1024 / Awaiting pass / Awaiting scan | `DÒNG 0412 → 1024` / *Chờ lượt bay* / *Chờ lần quét* |
| N (north arrow) | `B` (*bắc*: N would read *nam*, south) |
| Sentinel-2C image of Waterloo. The place is at the centre. | *Ảnh Waterloo do Sentinel-2C ghi lại. Nơi này nằm ở giữa ảnh.* |
| 10 m / pixel · Pan-sharpened with Landsat’s 15 m band | *10 m / điểm ảnh* · *Làm sắc nét bằng kênh toàn sắc 15 m của Landsat* |
| Close the photo viewer · Close (Esc) | *Đóng trình xem ảnh* · *Đóng (Esc)* |
| Time-lapse / Time-lapse of this place, year by year | *Time-lapse* / *Time-lapse của nơi này, qua từng năm* |
| 11 clear looks · one a year / · one each autumn | *11 ảnh không mây · mỗi năm một ảnh* / *· mỗi mùa thu một ảnh* (winter *mùa đông*, spring *mùa xuân*, summer *mùa hè*) |
| One clear look a year · since 2015 | *Mỗi năm một ảnh không mây · từ năm 2015* |
| Listing the archive / Choosing clear looks / Developing frames | *Đang đọc kho lưu trữ* / *Đang chọn ảnh không mây* / *Đang rửa ảnh* |
| Too cloudy here for a time-lapse. / No clear look since 2015 · 3 needed | *Ở đây quá nhiều mây để làm time-lapse.* / *Không có ảnh không mây nào từ năm 2015 · cần 3* |
| Each frame is the same 10 km square, … Each year aims for a different season; … / Every year is from the same season; … | *Mỗi khung hình là cùng một ô vuông 10 km, do Sentinel-2 chụp và được chỉnh màu như mọi ảnh ở đây. Ảnh mỗi năm được chọn vào một mùa khác nhau; …* / *Ảnh mọi năm đều được chọn vào cùng một mùa; …* (never *nhắm tới*: a year cannot aim, and *nhắm* is a weapon's verb, §8) |
| Frame 3 of 11: 6 Nov 2018 | *Khung hình 3 trong số 11: ngày 6 tháng 11 năm 2018* (spoken, so spelled out) |
| Video / Rendering 42% / Video failed / Save video / Link copied | *Video* / *Đang tạo 42%* / *Lỗi video* / *Lưu video* / *Đã sao chép liên kết* |
| This browser has no H.264 encoder: the file plays in Chrome and Firefox | *Trình duyệt này không có bộ mã hóa H.264: tệp phát được trên Chrome và Firefox* (no *chỉ*: the English names two browsers, not the only ones) |

- "Developing" is the photo lab's metaphor, and Vietnamese says it with *rửa ảnh* (*tiệm rửa ảnh*), which every reader
  knows. *tráng* goes with film (*tráng phim*): *tráng khung hình* is no collocation, and younger readers miss it.
- "N of M" is *N trong số M*, never *N/M*: a slash between two small numbers reads as a date here (*3/11* is 3
  November). The gallery's visual counter keeps the spaced `3 / 27`, which no date has.

**HUD** (corner lines, mono caps, nowrap)

| English | Vietnamese |
|---|---|
| How this works | *Cách hoạt động* (14, the English length: the corner pair on a 375 px phone is tight) |
| SUN 16.2°S 063.0°E / Sub-solar point · GMST 18:41:50 | `MẶT TRỜI 16.2°S 063.0°E` / *Điểm Mặt Trời lên thiên đỉnh · GMST 18:41:50* |
| Scene (the replay's clock) | *Lúc đó* → `LÚC ĐÓ CN, 1/11 11:21:13 EST` |
| 16,893 OBJECTS · CELESTRAK GP / — Objects / CATALOG | `16.893 VẬT THỂ · CELESTRAK GP` / *— vật thể* / `DANH MỤC` |
| Fetched 2026-11-08 03:34Z · 4 H ago / Stale, 3 D ago | *Lấy lúc 2026-11-08 03:34Z · 4 giờ trước* / *Cũ, 3 ngày trước* |
| <1 MIN · 42 MIN · 5 H · 3 D | `<1 PHÚT` · `42 PHÚT` · `5 GIỜ` · `3 NGÀY` |
| Loading catalog / Catalog unavailable | *Đang tải danh mục* / *Không tải được danh mục* (*Không có danh mục* would say there is none) |
| Language / Language: English. Change | *Ngôn ngữ* / *Ngôn ngữ: Tiếng Việt. Đổi* |

- The sub-solar point is named as a point, in the textbook's words for the Sun at the zenith (*Mặt Trời lên thiên
  đỉnh*, Địa lí 10): *Điểm Mặt Trời lên thiên đỉnh*. Without *Điểm* the line is a statement ("the Sun is at the
  zenith") under a line that already starts *MẶT TRỜI*. A calque (*điểm cận Mặt Trời*) names nothing a reader knows.
  Wide screens only, so the length is free.

### 3.9 About page

- **Title** (two lines): *Cách* / *\*hoạt động\*.* Bar: *Giới thiệu*. Close: *Đóng*.
- **Lede:** *Chọn một điểm trên Trái Đất. Chúng tôi tính xem những vệ tinh nào đã bay qua đó trong tuần qua, rồi đi tìm
  những hình ảnh mà chúng đã ghi lại. Mọi thứ chạy ngay trong trình duyệt của bạn, trên dữ liệu công khai.* (the
  pictures include radar: *hình ảnh … ghi lại*, as the landing's sub line)
- **Sections:** *Nói ngắn gọn* · *Cách chúng tôi tìm lượt bay* · *Ý nghĩa các nhãn* · *Những gì chúng tôi không thấy* ·
  *Quyền riêng tư* · *Ghi công* · *Bàn phím*.
- **Q&A:**
  - *Có phải trực tiếp không?* → *Không hẳn. Ảnh về tới kho lưu trữ từ vài giờ đến một hai ngày sau khi được chụp,
    nên những lượt bay mới nhất có thể chưa có ảnh.* (the delay before *sau khi*, or it reads as how long the shot took)
  - *Vệ tinh có thấy tôi không?* → *Không. Rõ nhất thì mỗi điểm ảnh ở đây cũng rộng 10 m. Một chiếc ô tô chỉ là một
    điểm ảnh. Bạn không hiện lên trong ảnh.*
  - *Đây có phải là tất cả các vệ tinh không?* → *Không. Vệ tinh quân sự và vệ tinh do thám phần lớn không có trong
    danh mục công khai, và các công ty không cho biết họ hướng camera về đâu.* (a *có phải* question closes with
    *không*, as its two neighbours do; *mọi* cannot stand as the predicate)
- **Method:** *Chúng tôi dùng SGP4, mô hình quỹ đạo tiêu chuẩn, để tính đường bay của từng vệ tinh trong bảy ngày qua,
  …* (one runs a model, not a satellite: never *chạy từng vệ tinh qua SGP4*) · *… và đối chiếu từng bức ảnh với lượt
  bay đã ghi lại ảnh đó.* (*đối chiếu*, the computing readout's word; *ghép* is to stitch, the mosaic's verb)
- **Method facts:** *Nhìn thẳng xuống* · *Camera nghiêng được* (*… Nếu bạn ở trong tầm với, chúng tôi gọi đó là “có thể
  đã hướng về đây”.*) · *Ban ngày* (*Camera thường cần ánh sáng Mặt Trời. Một lượt bay trong bóng tối không bao giờ
  được tính là có ảnh chụp.*: *ánh nắng* is sunshine, which an overcast day lacks) · *Radar* (*… nhìn chếch sang một
  bên đường bay, nên thấy được xuyên mây và cả vào ban đêm. … chúng tôi hiển thị chúng dưới dạng ảnh xám: chỗ sáng là
  …, chỗ tối là …*) · *Vệ tinh khí tượng* · *Chỉnh sửa ảnh* · *Đâu là phía bắc* (*… mũi tên B cho thấy chính xác hướng
  bắc ở đâu.*) · *Mây* (*Khi kho lưu trữ có dữ liệu về mây, chúng tôi kiểm tra đúng điểm ảnh ở chỗ của bạn và cho bạn
  biết.*).
- **Privacy** (exactly the English, no more, no less):
  - *Chạy ở đâu* → *Phần tính toán quỹ đạo diễn ra trong trình duyệt của bạn.*
  - *Chúng tôi lưu gì* → *Chúng tôi đếm lượt tìm kiếm theo thành phố, thị trấn và theo một vùng rộng khoảng 10 km, không
    bao giờ theo đúng chỗ của bạn, và đếm số lần nội dung được mở và chia sẻ. Không địa chỉ IP, không cookie của riêng
    chúng tôi, không có gì nối lần truy cập này với lần sau.*
  - *Ai khác thấy được* → *Phần lớn tên địa điểm lấy từ một danh sách có sẵn trong trang. Các lượt tìm khác được gửi
    tới Open-Meteo, Photon hoặc Nominatim. Ảnh được tải thẳng từ các kho lưu trữ. Dịch vụ lưu trữ web của chúng tôi đếm
    lượt xem trang và tốc độ, không dùng cookie, và có thể đặt một cookie bảo mật để phân biệt người với bot. Chúng tôi
    không bao giờ đọc cookie đó.*
  - *Liên kết chia sẻ* → *Chỉ được tạo khi bạn chia sẻ. Ai có liên kết sẽ thấy tên địa điểm, một điểm được làm tròn đến
    khoảng 1 km, và lượt bay bạn đã chọn.*
- **Credits:** *Thực hiện* · *Armaan, @armaangupt0 trên X*; labels *Kho lưu trữ*, *Quỹ đạo*, *Tên địa điểm*, *Bề mặt
  Trái Đất*, *Phông chữ*; *Ảnh từ GIBS của NASA, thuộc EOSDIS. GOES qua NOAA và CIRA, Himawari qua JMA.* OpenStreetMap's
  own Vietnamese attribution: *© Những người đóng góp OpenStreetMap (ODbL)*. Product, agency, licence and people's names
  stay as they are.
- **Keyboard:** *Tìm một địa điểm* · *Di chuyển giữa các gợi ý* · *Chọn* · *Chuyển giữa các lượt bay* · *Ảnh trước /
  tiếp theo* · *Phóng to ảnh* · *Thu phóng (khi đã phóng to)* · *Phát hoặc tạm dừng phát lại* · *Quay lại, hoặc
  đóng* · *Trang này*. Key caps as Vietnamese keyboards print them (US layout): *Enter*, *Space*, *Esc*.
- **Foot:** *Do @armaangupt0 thực hiện* · *Làm từ dữ liệu công khai. Không bức ảnh nào ở đây do chúng tôi chụp.*

---

## 4. Glossary

Vietnamese has no inflection, no grammatical gender and no plural form. "Notes" says what never to use.

### 4.1 Terms

| English | Vietnamese | Notes |
|---|---|---|
| satellite | vệ tinh | *1 vệ tinh*, *256 vệ tinh*. Never *các vệ tinh* after a number, never *chiếc* in a count. |
| to watch (the product verb) | quan sát | *đã quan sát*. Never *theo dõi*, *giám sát*, *dõi theo*, *nhìn* (too weak), *chụp* (owner: never "photographed"), *rình*, *do thám*. |
| watched / likely watched | Đã quan sát / Nhiều khả năng đã quan sát | Lanes `ẢNH`, `QUÉT QUA`. |
| could have pointed here | Có thể đã hướng về đây | Lane `CÓ THỂ`. Prose "could have": *có thể đã*. Never *nhắm*, *chĩa*. |
| passed overhead | Bay qua trên đầu | Lane `BAY QUA`. |
| pass, overflight | lượt bay qua; unit *lượt* | *31 lượt*, section *Lượt bay*. Never *chuyến bay* (a flight), *lần* (times). |
| to pass, to cross | bay qua; băng qua (the sky) | *bay qua Waterloo*, *băng qua bầu trời của bạn*. |
| to sweep / to scan (likely) | quét qua; quét | *quét* is the scanner's verb (*quét mã QR*). Never *càn quét* (a military sweep). |
| scan (n.) / scan line | lần quét / đường quét | *Đường quét lần này tới Paris…* |
| image | ảnh; bức ảnh (counted, prose); hình ảnh (uncounted, prose) | Any image; every element that can hold radar, mosaics or full-disc frames. |
| photo | ảnh chụp | Only where the item is certainly an optical photograph (radar note: *không phải ảnh chụp*). |
| picture (the share card's PNG) | ảnh | *Chia sẻ ảnh*, *Sao chép ảnh*: in the sheet nothing else is an image. The card itself is *thẻ chia sẻ*. |
| public image / public archive | ảnh công khai / kho lưu trữ công khai | |
| made public / published | được công bố; công bố | Never *được công khai hóa*. |
| scene | cảnh ảnh (remote-sensing term); ảnh | *Không có cảnh ảnh nào*; *Lượng mây của cả cảnh ảnh* (the scene's figure: *toàn ảnh* would be the crop on screen); unit `CẢNH ẢNH`. Never bare *cảnh* (a film scene, a view). |
| crop | phần ảnh cắt | |
| swath | dải quét | *dải quét rộng 290 km*; label `DẢI QUÉT`. |
| off-nadir | độ nghiêng; nghiêng | Label `ĐỘ NGHIÊNG`; prose *nghiêng 5,4° so với phương thẳng đứng*; row *nghiêng 5,4°*. Never *off-nadir*, nor a term built on *thiên để* (天底, nadir; not *thiên đế*, "the Heavenly Emperor"). |
| straight down | thẳng xuống | |
| ground track | vệt quỹ đạo | The orbit's trace on the ground. Never *lượt bay*. |
| plan view | sơ đồ lượt bay | *Hình trên là sơ đồ lượt bay.* |
| orbit / orbital elements | quỹ đạo / tham số quỹ đạo | The textbook *yếu tố quỹ đạo* is accurate but opaque; *tham số* ("parameters") says what they are. Never *lan truyền* (propagate) in UI: *tính quỹ đạo*. |
| catalog | danh mục | *danh mục quỹ đạo*. "Satellites we track" is *vệ tinh … trong danh mục của chúng tôi*. |
| objects (HUD) | vật thể | |
| altitude | độ cao | Label `ĐỘ CAO`; prose *ở độ cao 786 km*. Reserved for kilometres. |
| elevation (an angle above the horizon) | góc ngẩng | Label `GÓC NGẨNG`; *Góc ngẩng tại điểm* (the spot in a label is *điểm*, §1.2), *Góc ngẩng Mặt Trời*. Never *độ cao* (the astronomers' word, but it is the altitude's in this product). In a sentence: *cao 64° trên đường chân trời*. |
| up (unit after degrees) | cao | `64° CAO · TB`. |
| horizon / sky | đường chân trời / bầu trời | |
| almost straight up | gần như ngay trên đầu | |
| ground speed / speed | tốc độ mặt đất / tốc độ | Prose *với tốc độ 7,46 km/s*. |
| heading | hướng bay | Label `HƯỚNG BAY`; unit `NTN · ĐI XUỐNG`. |
| ascending / descending | Đi lên / Đi xuống | |
| ground distance / closest | khoảng cách mặt đất / gần nhất | `GẦN NHẤT · UTC`, `GẦN NHẤT · ĐỊA PHƯƠNG`. |
| latest | mới nhất | Never *gần nhất*, which here means "nearest". |
| closest approach | tiếp cận gần nhất | The globe's countdown label. |
| field of regard | tầm nhìn | `TẦM NHÌN ±45°`. |
| in swath / in view / in range / window | trong dải quét / trong tầm nhìn / trong tầm nhìn (a pass), trong tầm với (a steerable camera's reach: About, the could verdict) / khung thời gian | Never a bare *trong tầm*: it needs its noun (*nhìn*, *với*). |
| above the equator at / in your sky | trên xích đạo tại / trên bầu trời bạn | |
| scan line here · UTC / local | quét qua đây · UTC / địa phương | The moment the scan line was here, in three words. |
| scan direction / line speed here | hướng quét / tốc độ đường quét | *Bắc → nam*. |
| coverage / full disc / this scan | vùng phủ / toàn đĩa / lần quét này | |
| cloud cover / cloud at spot | lượng mây / mây tại điểm | *lượng mây* is the meteorologist's word. |
| clear / thin cirrus / cirrus / cloud / cloud shadow | không mây; quang (*trời quang*) / mây ti mỏng / mây ti / mây / bóng mây | *mây ti* is the Vietnamese meteorological name for cirrus. *quang* does not stand alone (and alone suggests *quang học*): the photo status is *Không mây*, the viewer's *Điểm không mây*; only the spot value under *Mây tại điểm* is `QUANG` (≤ 7). |
| clouded / clouded over / mostly cloud | có mây / mây che kín / phần lớn là mây | |
| spot (the exact point) | chỗ (prose: *chỗ của bạn*), điểm (labels) | *nơi* is the searched place. |
| place | nơi, địa điểm | *nơi này*; *Tìm địa điểm*. |
| landmark | địa danh | |
| pixel / resolution | điểm ảnh / độ phân giải | Label `ĐIỂM ẢNH`; tooltips and blurbs *điểm ảnh 10 m*; sentences *ở độ phân giải 375 m* or *mỗi điểm ảnh rộng 10 m*; readouts `10 m / điểm ảnh`. Never tacked on (*với 375 m mỗi điểm ảnh*, *, 20 m,*). The loan *pixel* is common in speech; the Vietnamese term is clearer in a sentence about ground size. |
| radar / C-band | radar / băng C | *ảnh radar*, *vệ tinh radar*; a radar *ghi ảnh* / *ghi lại*, never *chụp* (blurbs too: *ghi ảnh từ năm 2007*). |
| weather mosaic / daily mosaic | ảnh ghép thời tiết / ảnh ghép hằng ngày | *hằng ngày* (dictionary form), never *hàng ngày*. |
| true colour | màu thực | |
| geostationary | địa tĩnh | Lane `ĐỊA TĨNH`. |
| infrared / visible / colour (band values) | Hồng ngoại / Khả kiến / Màu | Label `KÊNH`. Chip `IR` (never *HN*, which is Hà Nội). |
| panchromatic | toàn sắc | |
| time-lapse | time-lapse | Upright, hyphenated, lowercase in prose; `TIME-LAPSE` in caps. Never *tua nhanh thời gian* (a video effect, not a year-by-year loop). |
| frame | khung hình | *Khung hình 3 trong số 11*. |
| clear look / last clear look | ảnh không mây / ảnh không mây mới nhất | Tag *Không mây mới nhất* (latest: *gần nhất* is "closest" on the same screens). Never *ảnh quang* (*quang* alone is *quang học*, optics). |
| closest look | chi tiết nhất | Tag *Chi tiết nhất*; prose *ảnh chi tiết nhất*. Never *ảnh gần nhất* (nearest, latest). |
| clearest look | ảnh ít mây nhất | The pass footer's button. |
| Detailed (filter) | Chi tiết | Shares its word with *Chi tiết nhất*. |
| replay (button / noun) | phát lại | *Phát lại lượt bay*; section `02 / PHÁT LẠI`. |
| sub-solar point | Điểm Mặt Trời lên thiên đỉnh | §3.8. |
| fetched / stale | lấy lúc / cũ | |
| sunlight / daylight / dark | ánh sáng Mặt Trời, Mặt Trời chiếu sáng / ban ngày, trời sáng / trời tối, bóng tối | *ánh nắng* is sunshine (an overcast day has none): "cameras need the sun" is *ánh sáng Mặt Trời*. |
| day / twilight / night (readout) | ban ngày / chạng vạng / ban đêm | After an angle a bare *ngày* reads as a count of days (*31,1° ngày*). |
| the sun never / barely rose | Mặt Trời không hề mọc / gần như không mọc | |
| daylight camera / regular camera | camera thường | |
| steerable camera / tilting camera | camera xoay hướng được / camera nghiêng được | |
| fixed camera | camera hướng cố định | Never *camera cố định* (a fixed-mount camera, CCTV). |
| private / commercial / operator | tư nhân / thương mại / nhà vận hành | |
| rapid revisit | tần suất chụp lặp lại cao | Never *quay lại nhanh* ("turns back fast"). |
| developing (the time-lapse's frames) | rửa ảnh | *Đang rửa ảnh*; never *tráng khung hình*. |
| press and hold | nhấn giữ | Never a bare *giữ* ("keep"). |
| crewed / station | có người ở / trạm vũ trụ, trạm | *trạm vũ trụ* on first mention, then *trạm*; never *họ*. |
| weather / imaging satellite | vệ tinh khí tượng / vệ tinh chụp ảnh | "open imaging satellite": *vệ tinh chụp ảnh công khai*. |
| military and spy satellites | vệ tinh quân sự và vệ tinh do thám | Factual, allowed. Only the reader is never *bị do thám*. |
| equator / Earth / sun | xích đạo / Trái Đất / Mặt Trời | §6.4. |
| globe | quả địa cầu | |
| share / share this pass / image / week | Chia sẻ / Chia sẻ lượt bay này / Chia sẻ ảnh này / Chia sẻ tóm tắt tuần này | |
| download / download image | Tải xuống / Tải ảnh xuống | *Đang tải xuống…* |
| copy link / copied / link copied | Sao chép liên kết / Đã sao chép / Đã sao chép liên kết | |
| copy image / save PNG / share image | Sao chép ảnh / Lưu PNG / Chia sẻ ảnh | |
| post to X / post (label) | Đăng lên X / Bài đăng | |
| link | liên kết | Never *link*, *đường link* in copy. |
| made when you share | Tạo khi bạn chia sẻ | |
| use my location / locate me / near me / locating | Dùng vị trí của tôi / Định vị / Gần tôi / Đang định vị… | |
| surprise me / drop a pin / or try | Ngẫu nhiên / Thả ghim / Hoặc thử | |
| how this works | Cách hoạt động | |
| last 7 days / this week / that week | 7 ngày qua / tuần này / tuần đó | |
| local time | giờ địa phương | Readout `ĐỊA PHƯƠNG`. |
| at sea | trên biển | *UTC−9 · trên biển*. |
| ago / just now / in 3 h | … trước / vừa xong / … nữa | *12 phút trước*, *3 giờ nữa* (never CLDR's *sau 3 giờ nữa*, which says "after" twice). |
| min / h / d / s | phút / giờ / ngày / giây | Written out, in mono too: each is one short syllable, and Vietnamese has no abbreviations for them. *s* only in the computing readout's `1,84 s` (§7). |
| km, m, km/s | km, m, km/s | SI symbols, never *km/giây*. |
| close / cancel / try again / back | Đóng / Hủy / Thử lại / Quay lại | |
| previous / next | trước / tiếp theo (*Tiếp* in a tooltip) | |
| play / pause | Phát / Tạm dừng | The replay's buttons too: *Phát lại lượt bay* is the footer's Replay, and two buttons never share a name. |
| zoom in / zoom out | Phóng to / Thu nhỏ | Readout `2,5×`. |
| acquiring / acquired | đang thu nhận / thu nhận | *thu nhận ảnh* is the remote-sensing term. `THU NHẬN 11:21:21 EST · 10 m`. |
| imaged (the callout) | ảnh lúc | `ẢNH LÚC 11:21:13 EST`. |
| line (scan counter) | dòng | `DÒNG 0000 → 1024`. |
| fault | sự cố | |
| browser | trình duyệt | |
| carousel / slide (aria) | băng chuyền / trang | |
| an unnamed satellite | Một vệ tinh / một vệ tinh | |
| we / you / I | chúng tôi / bạn / tôi | Never *chúng ta*, *mình*, *quý khách*. |

### 4.2 Compass

**8 points (prose, lowercase):** north *bắc* · northeast *đông bắc* · east *đông* · southeast *đông nam* · south *nam* ·
southwest *tây nam* · west *tây* · northwest *tây bắc*. Vietnamese puts east and west first in the compound
(*đông bắc*, not *bắc đông*). Patterns: *di chuyển về hướng nam*, *cách bạn 61 km về phía tây*, *về phía tây bắc*.

**16 points (mono readouts):** the abbreviations of Vietnamese geography textbooks (*TB–ĐN* for a mountain range
running northwest–southeast), extended to 16 points the way English builds NNE.

| EN | N | NNE | NE | ENE | E | ESE | SE | SSE | S | SSW | SW | WSW | W | WNW | NW | NNW |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| vi | B | BĐB | ĐB | ĐĐB | Đ | ĐĐN | ĐN | NĐN | N | NTN | TN | TTN | T | TTB | TB | BTB |

A compass readout never shows English letters, because **N means *nam* (south) in Vietnamese**: `HƯỚNG BAY 194,6° NTN
· ĐI XUỐNG`. The photo's north arrow is `B`.

**Coordinates and the compass collide (owner question).** Coordinates come from one international formatter
(`fmtLat` / `fmtLon`, every language) and keep N/S/E/W: `43.47°N`, `MẶT TRỜI 23.4°N 063.0°E`, *Trên xích đạo tại
0.2°W*. On the same screens the compass's N is *nam*: the geostationary grid shows *0.2°W* beside `34,5° CAO · N`,
where that N is south. The guide's own reason for B applies to a lone northern latitude too, and Vietnamese textbooks
and vi.wikipedia write coordinates with Vietnamese letters (*21°01′B 105°51′Đ*). A translator can fix neither in the
catalog. Options for the owner: (a) keep both and accept the collision (the coordinates' E/W and the paired value
usually show they are notation); (b) **recommended:** give `vi` display coordinates Vietnamese hemisphere letters
(*43.47°B*, *80.54°T*, *16.2°N* for south), display only, the search field still parsing *43.47, −80.54*; (c) English
letters in the compass too, which makes every compass N read as south to a Vietnamese reader. Until then the
coordinates show as the app writes them (§6.2).

### 4.3 Curated places (`places` namespace)

The curated names are copy: use the name Vietnamese readers know. A class noun (*Núi*, *Kênh đào*, *Đập*, *Thác*) is
allowed here because the place is known; §5.1 rule 2 still holds for runtime slots. Countries follow CLDR `vi`
(*Hoa Kỳ*, *Úc*, *Italy*, *Ai Cập*), Hong Kong its Vietnamese name *Hồng Kông*, Chinese places their Sino-Vietnamese
names where the press uses them (*Thượng Hải*, *Hồ Bắc*, *Tam Hiệp*), Ukrainian places in Ukrainian transliteration
(*Kyiv*, §8).

| English label (sublabel) | Vietnamese label (sublabel) |
|---|---|
| Area 51 (Groom Lake, Nevada, United States); chip Area 51 | *Khu vực 51* (*Hồ Groom, Nevada, Hoa Kỳ*); chip *Khu vực 51* |
| Central Park (New York, United States) | *Central Park* (*New York, Hoa Kỳ*) |
| Pyramids of Giza; chip Giza (Giza, Egypt) | *Kim tự tháp Giza*; chip *Giza* (*Giza, Ai Cập*) |
| Uluru (Northern Territory, Australia) | *Uluru* (*Lãnh thổ Bắc Úc, Úc*) |
| Palm Jumeirah / The World Islands (Dubai, United Arab Emirates) | *Palm Jumeirah* / *Quần đảo Thế giới* (*Dubai, Các Tiểu Vương quốc Ả Rập Thống nhất*) |
| Grand Canyon / Meteor Crater (Arizona, United States) | *Hẻm núi Grand Canyon* / *Hố thiên thạch Meteor* (*Arizona, Hoa Kỳ*) |
| Lower Manhattan / Las Vegas Strip / Golden Gate | *Hạ Manhattan* / *Las Vegas Strip* / *Cầu Cổng Vàng* |
| Hoover Dam and Lake Mead (Nevada and Arizona, United States) | *Đập Hoover và hồ Mead* (*Nevada và Arizona, Hoa Kỳ*) |
| Kennedy Space Center (Florida, United States) | *Trung tâm Vũ trụ Kennedy* (*Florida, Hoa Kỳ*) |
| Washington, D.C. (The National Mall, United States) | *Washington, D.C.* (*National Mall, Hoa Kỳ*) |
| Mount St. Helens (Washington, United States) | *Núi St. Helens* (*Washington, Hoa Kỳ*) |
| Niagara Falls (Ontario, Canada) | *Thác Niagara* (*Ontario, Canada*) |
| Panama Canal (Gatun Locks, Panama) | *Kênh đào Panama* (*Âu tàu Gatun, Panama*) |
| Rio de Janeiro (Sugarloaf and Copacabana, Brazil) | *Rio de Janeiro* (*Núi Sugarloaf và Copacabana, Brazil*) |
| Paris (Île-de-France, France) | *Paris* (*Île-de-France, Pháp*) |
| Venice (Veneto, Italy) | *Venice* (*Veneto, Italy*) |
| Mount Vesuvius (Naples, Italy) / Mount Etna (Sicily, Italy) | *Núi lửa Vesuvius* (*Napoli, Italy*) / *Núi lửa Etna* (*Sicilia, Italy*) |
| Istanbul (The Bosphorus, Türkiye) | *Istanbul* (*Eo biển Bosphorus, Thổ Nhĩ Kỳ*) |
| Chernobyl (Kyiv Oblast, Ukraine) | *Chernobyl* (*Tỉnh Kyiv, Ukraina*) |
| Table Mountain (Cape Town, South Africa) | *Núi Bàn* (*Cape Town, Nam Phi*) |
| Kilimanjaro (Kilimanjaro, Tanzania) | *Núi Kilimanjaro* (*Kilimanjaro, Tanzania*) |
| Mount Everest (Nepal and China) | *Đỉnh Everest* (*Nepal và Trung Quốc*) |
| Angkor Wat (Siem Reap, Cambodia) | *Angkor Wat* (*Siem Reap, Campuchia*) |
| Singapore (Marina Bay, Singapore) | *Singapore* (*Vịnh Marina, Singapore*) |
| Hong Kong (Victoria Harbour, Hong Kong) | *Hồng Kông* (*Cảng Victoria, Hồng Kông*) |
| Tokyo (Tokyo, Japan) / Mount Fuji (Shizuoka, Japan) | *Tokyo* (*Tokyo, Nhật Bản*) / *Núi Phú Sĩ* (*Shizuoka, Nhật Bản*) |
| Sydney Harbour (Sydney, Australia) | *Cảng Sydney* (*Sydney, Úc*) |
| Richat Structure (Sahara, Mauritania) | *Cấu trúc Richat* (*Sahara, Mauritania*) |
| Great Blue Hole (Lighthouse Reef, Belize) | *Hố Xanh Lớn* (*Rạn Lighthouse, Belize*) |
| Bora Bora (Society Islands, French Polynesia) | *Bora Bora* (*Quần đảo Société, Polynesia thuộc Pháp*) |
| Hardy Reef (Great Barrier Reef, Australia) | *Rạn Hardy* (*Rạn san hô Great Barrier, Úc*) |
| Malé (North Malé Atoll, Maldives) | *Malé* (*Đảo san hô vòng Bắc Malé, Maldives*) |
| Dead Sea Salt Ponds (Southern basin, Israel and Jordan) | *Ruộng muối Biển Chết* (*Lòng chảo phía nam, Israel và Jordan*) |
| Bingham Canyon Mine (Utah) / Mount Whaleback Mine (Pilbara) | *Mỏ Bingham Canyon* (*Utah, Hoa Kỳ*) / *Mỏ Mount Whaleback* (*Pilbara, Úc*) |
| Santorini (Cyclades, Greece) / Teide (Tenerife, Spain) | *Santorini* (*Quần đảo Cyclades, Hy Lạp*) / *Núi lửa Teide* (*Tenerife, Tây Ban Nha*) |
| Kīlauea (Hawaii) / Crater Lake (Oregon) | *Núi lửa Kīlauea* (*Hawaii, Hoa Kỳ*) / *Hồ Crater* (*Oregon, Hoa Kỳ*) |
| Glen Canyon Dam (Page, Arizona, United States) | *Đập Glen Canyon* (*Page, Arizona, Hoa Kỳ*) |
| Garden City Crop Circles (Kansas, United States) | *Cánh đồng tròn Garden City* (*Kansas, Hoa Kỳ*) |
| Almería Greenhouses (Andalusia, Spain) | *Nhà kính Almería* (*Andalucía, Tây Ban Nha*) |
| Gibraltar (Strait of Gibraltar) | *Gibraltar* (*Eo biển Gibraltar*) |
| Suez Canal (Ismailia, Egypt) / Aswan High Dam (Lake Nasser, Egypt) | *Kênh đào Suez* (*Ismailia, Ai Cập*) / *Đập cao Aswan* (*Hồ Nasser, Ai Cập*) |
| Wadi Rum (Aqaba, Jordan) | *Wadi Rum* (*Aqaba, Jordan*) |
| Sossusvlei (Namib Desert, Namibia) | *Sossusvlei* (*Sa mạc Namib, Namibia*) |
| Victoria Falls (Zambia and Zimbabwe) | *Thác Victoria* (*Zambia và Zimbabwe*) |
| Three Gorges Dam (Hubei, China) / Shanghai (The Huangpu River, China) | *Đập Tam Hiệp* (*Hồ Bắc, Trung Quốc*) / *Thượng Hải* (*Sông Hoàng Phố, Trung Quốc*) |
| Itaipu Dam (Brazil and Paraguay) | *Đập Itaipu* (*Brazil và Paraguay*) |

---

## 5. Grammar strategies for runtime slots

### 5.1 [PLACE]: inserted as-is, never inflected

Vietnamese has no case, gender, article or inflection, so a gazetteer name in English, Vietnamese or any script is
grammatical wherever a noun can stand.

1. **Prepositions are separate words:** *ở [PLACE]*, *tại [PLACE]*, *qua [PLACE]*, *của [PLACE]*, *tới [PLACE]*.
2. **No class noun or article in front of the slot** (*thành phố*, *tỉnh*, *biển*, *vùng*): the code cannot know what the
   place is. The English adds "the" before oceans and deserts (`placeInProse`); the `vi` frame takes the raw label:
   *đã quan sát Pacific Ocean*.
3. **A sentence may start with the slot** (*Waterloo nằm trong dải quét…*), because Vietnamese has no case to break and
   every gazetteer name starts with its own capital. Prefer it at the end of a clause all the same: it also keeps
   right-to-left names from scrambling punctuation (the code isolates the slot with `<bdi>`).
4. **Back-reference with *nơi này*, *nơi đó* or *điểm này*,** never with *nó*.
5. **Sublabels** list most specific first with commas, the country from `Intl.DisplayNames('vi')`: *Waterloo · Ontario,
   Canada*.

### 5.2 [SAT] as subject: no agreement, no pronoun

1. Verbs agree with nothing: *Sentinel-2C đã bay qua*, *Umbra, Capella và 7 vệ tinh radar khác đã bay qua*.
2. **Never refer back with *nó*, *họ* or *chúng*** (one exception, §1.2 rule 5). In order: drop the subject, *vệ tinh
   này*, a noun (*camera*, *radar*, *dải quét*, *nhà vận hành*), the name again.
3. **A station** (ISS, Tiangong): *trạm*.
4. **An unnamed satellite** (`aSatellite`) is *Một vệ tinh* as a subject and *một vệ tinh* after a preposition (*do một
   vệ tinh ghi lại*, *của một vệ tinh*).
5. **"Its X"** is *X của vệ tinh* or just *X* when the sentence's subject is already the satellite; never *X của nó*.

### 5.3 [NUM]: one plural category, and the count words

CLDR `vi` cardinal plural: **`other` only** (ordinal has `one` for *thứ nhất*, unused here). `f.plural(n, { other:
'…' })`.

| n | Frame | Example |
|---|---|---|
| 0 | separate sentence | *Không vệ tinh nào…*, *Không có bức ảnh nào được công bố…*, *Không có ảnh không mây nào từ năm 2015* |
| 1 | `[NUM] vệ tinh` | *1 vệ tinh đã quan sát*, *1 bức ảnh*, *1 lượt*; in plain prose where English writes "once", *một lần* |
| 2 … ∞ | same | *256 vệ tinh*, *1.715 bức ảnh*, *31 lượt*, *42 lần* |

1. **Digits always**, even for 1, wherever the count is a number part or a label: *1 vệ tinh*, not *một vệ tinh*;
   `1 LƯỢT`. The one exception is a plain-prose sentence where English writes the word "once": *đã bay qua nơi này một
   lần vào ban ngày* (*1 lần* in a sentence reads as a log counter).
2. **Never *các* or *những* after a number** (*31 các vệ tinh* is wrong); after a number the noun is already plural.
   *các* / *những* only where no number stands.
3. **The count words** (classifiers) are fixed:

| Counted | Prose (display sentences, notes) | Mono labels, chips, readouts |
|---|---|---|
| satellites | *256 vệ tinh* (no classifier) | `256 VỆ TINH` |
| images | *31 bức ảnh* | `31 ẢNH` |
| passes | *31 lượt* (*31 lượt bay* where the noun is not in view) | `31 LƯỢT` |
| times | *42 lần* | `42 LẦN` |
| frames | *11 khung hình* | `11 KHUNG HÌNH` |
| objects | *16.893 vật thể* | `16.893 VẬT THỂ` |
| rows | *40 dòng* | |

   *bức* (pictures) in prose, never *tấm* (a print, a sheet: colloquial) or *chiếc*. The mono labels drop *bức*: a
   counter reads as a counter (*31 ẢNH*), as Vietnamese gallery apps print it.
4. **"N of M" is *N trong số M*** in words, never *N/M* (a date, §3.8); "at least" *ít nhất*; "about" *khoảng* (prose) or
   `≈` (readouts); "every N minutes" *mỗi N phút*.
5. **A count never stands bare before *tuần*, *ngày* or *năm* unless it counts them:** *12 tuần này* reads "these 12
   weeks". Put the noun or a label first: *Tuần này: 12*, *12 ảnh tuần này*.

### 5.4 Lists of names

`Intl.ListFormat('vi', { type: 'conjunction' })` gives the Vietnamese form, no serial comma: *A và B*; *A, B và C*.

| Case | Vietnamese |
|---|---|
| one | *Umbra đã bay qua trong tầm nhìn 12 lần.* |
| two | *Umbra và Capella đã bay qua trong tầm nhìn 31 lần.* |
| two + others | *Umbra, Capella và 7 vệ tinh radar khác đã bay qua trong tầm nhìn 1.204 lần.* |
| two + 1 other | *Umbra, Capella và 1 vệ tinh radar khác…* |

"other" is *khác* after the noun phrase, never *còn lại* in a count.

### 5.5 Dates and times inside sentences

- **Clocks arrive formatted, 24 h with a colon, and are placed as they come:** *lúc 16:14:21 UTC*, *lúc 10:52 EST*,
  *vào khoảng 07:49 CET*, *lúc 11:21 giờ địa phương*. Never *16h14* (the press's form, but the app writes the colon
  everywhere), never *vào lúc* (redundant), never a day-part word after a 24 h clock (*16:14 chiều*).
- **Zones arrive formatted** (*ICT* is not in the product: Vietnam shows *UTC+7*) and are never written or changed by a
  translator. An owner question for `Asia/Ho_Chi_Minh` is in the appendix.
- **Days are digits, day before month, the way Vietnamese writes a date** (*1/11*, *29/10/2026*), built by hand from the
  instant's local fields, never CLDR's short month (*1 thg 11*: an abbreviation of *tháng* no Vietnamese writer uses
  outside a phone's calendar), never zero-padded:
  - short, with its comma: *CN, 1/11*, *T6, 6/11* (pass rows, captions, the HUD's replay clock: `CN, 1/11`). Weekdays
    are the calendar's two-letter forms *T2 T3 T4 T5 T6 T7 CN*, which every Vietnamese calendar prints.
  - post text and the share page's prose: the full weekday, CLDR's *Chủ Nhật*, *Thứ Hai* … *Thứ Bảy*, then the date:
    *lúc 11:21 giờ địa phương, Chủ Nhật 1/11*; *lúc 11:21 EST, Chủ Nhật 1/11/2026*.
  - spoken (aria): *Thứ Sáu, ngày 6 tháng 11*: a screen reader reads *6/11* as a fraction and *CN* as two letters.
    Today only the pass rows (`rowLabel`, `satLabel`) receive the spoken day. Four accessible names receive the visual
    short day and say *CN, 1/11*: the gallery's `slideLabel`, `replayLabel` and `viewLabel.*`, and the pass list's
    `expandLabel`. The catalog cannot fix that; the code must pass the spoken day (a new parameter, English unchanged:
    reported, §Appendix).
  - a stamp that stands alone (the card's stamp): `CN, 1/11/2026 · 11:21 EST`; the week's *7 ngày tính đến 1/11/2026*.
  - timeline: weekday *CN*; compact day *CN 1*.
  - day and month: *29/10*; time-lapse date: *22/10/2015*.
- **Ranges:** mono ranges keep the product's arrow, the month and year written once when both ends share them, as
  Vietnamese posters write *1–8/11*: `1 → 8/11/2026 UTC`, `29/10 → 5/11/2026 UTC`, `29/12/2026 → 5/1/2027 UTC`, `1 →
  8/11`. Prose: *Từ 29/10 đến 5/11*; *từ năm 2015*; years *2015–2026* (en dash, no spaces).
- **Relative time** is written from `relativeParts`, never with Intl (it prints *sau 3 giờ nữa*):

| Unit | Compact (`relative`: meta lines) | Spoken (`relativeSpoken`: aria) |
|---|---|---|
| < 45 s | *vừa xong* | *vừa xong* |
| minutes | *12 phút trước* | *12 phút trước* |
| hours (to 48) | *5 giờ trước*, *3 giờ nữa* | *41 giờ trước*, *3 giờ nữa* |
| days | *3 ngày trước* | *3 ngày trước* |

- **Durations:** *38 giây* · *4 phút 12 giây* · *1 giờ 02 phút*.

---

## 6. Typography and formatting

### 6.1 Characters

| Topic | Rule |
|---|---|
| Normalisation | **NFC, always.** One code point per letter: *ể* is U+1EC3, not *e* + U+0302 + U+0309. Check: `node -e "const s=require('fs').readFileSync(f,'utf8'); if (s.normalize('NFC')!==s) throw 1"`. |
| Tone-mark placement | The new style, as Microsoft, Google and the national dictionaries now print it: *hòa*, *hủy*, *thủy*, *khỏe*, *tọa độ*, *xóa*, never *hoà*, *huỷ*, *thuỷ*, *khoẻ*, *toạ*, *xoá*. One style per product. |
| i / y | *y* in the established spellings: *kỹ thuật*, *Mỹ*, *lý do*, *quy định*. |
| đ | Always *đ* (U+0111) / *Đ* (U+0110), never *d* with a bar from another script, never *ð*. |
| Apostrophe | Almost never needed. Curly ’ in a foreign name that has one (*Côte d’Ivoire*). Never U+02BC. |
| Quotation marks | Curly double, single inside: “có thể đã hướng về đây”; ‘…’ nested. Never «» or „“. |
| Ellipsis | One character U+2026, attached: *Đang tải…* |
| Dashes | No em dash (owner rule). En dash for ranges, no spaces (*2015–2026*, *10–30 m*); `→` in mono ranges; true minus `−`. The `—` marking an unknown value is a glyph, not punctuation. Hyphen only in loans (*time-lapse*, *mô-đun*) and names. |
| Space before punctuation | Never. One space after a colon, comma, semicolon. |
| No-break space (U+00A0) | Between a number and its unit or count noun in prose (*7 ngày*, *10 km*), written as `\u00a0` in source, never as an invisible literal. |

### 6.2 Numbers and notation

| Topic | Rule | Example |
|---|---|---|
| Decimal separator | Comma, for every number the app formats with `fmt('vi')` | *7,46*, *5,4°*, *0,31 m*, `2,5×` |
| Grouping | Period, from 4 digits; never in a year, a NORAD id or a clock | *1.204*, *35.778 km*, `16.893 VẬT THỂ`, *từ năm 2015* |
| Percent / degree | No space | *25%*, *5,4°* |
| Units | SI symbols, never translated, a space after the number | *786 km*, *10 m*, *7,46 km/s* (never Intl's *km/giây*) |
| Clocks | 24 h with a colon, as the app formats them | `16:14:21`, *lúc 11:21 EST*, `T−00:42`, `2026-11-08 03:31:07 UTC` |
| Coordinates | International notation, exactly as the app writes them: period decimal, N/S/E/W letters (the form Google Maps shows Vietnamese users). A translator never reformats them; Vietnamese hemisphere letters are an owner question (§4.2). The search hint keeps *43.47, −80.54* (the field parses it). | `16.2°S 063.0°E`, *tại 0.2°W* |
| Dates | Digits, day/month(/year), no padding (§5.5) | *1/11*, *29/10/2026* |

### 6.3 Mono caps and Vietnamese capitals

- Mono labels are written in sentence case in the catalog; CSS (or `toLocaleUpperCase('vi')` on canvas and satori)
  uppercases them. Vietnamese capitals keep every mark: `ĐỘ CAO`, `GÓC NGẨNG`, `QUÉT QUA`. A capital with a stacked
  mark (*Ể*, *Ỗ*, *Ẫ*) is taller than the cap height: the label's line box must not clip it (a font and leading
  question for `scripts.css`, §Appendix).
- **Units stay lowercase** in a caps row, in every language: `786 km`, `10 m`, `7,46 km/s`.
- **Never uppercased:** the wordmark *Watched.*; *www.watched.earth*; units in prose; satellite and place names outside
  mono labels.

### 6.4 Capitalisation

- **Sentence case everywhere**, buttons and About headings included. Never title case (*Cách Chúng Tôi Tìm Lượt Bay*).
- **Celestial bodies** are capitalised as names, as Vietnamese astronomy and geography textbooks write them: *Trái Đất*,
  *Mặt Trời*, *Mặt Trăng*, in every sentence (*Mặt Trời không hề mọc*). *ánh sáng Mặt Trời* for sunlight (*ánh nắng*
  is sunshine). *xích đạo* and compass words lowercase.
- **Vietnamese place names** capitalise every syllable (*Hà Nội*, *Thượng Hải*, *Hồ Bắc*); a class noun before a
  curated name is capitalised as part of the name (*Kênh đào Panama*, *Núi lửa Etna*, *Đập Tam Hiệp*), a following
  generic stays lowercase (*hồ Mead* after *và*).
- **Weekdays** as CLDR writes them in full (*Chủ Nhật*, *Thứ Hai*); short forms *CN*, *T2*.
- **Italic** never for loanwords (*time-lapse*, *camera*): italic means the serif accent and nothing else.
- **Bold** only the results headline's count phrase.

### 6.5 Line breaking and abbreviations

- Vietnamese breaks at spaces between syllables, so a line can break inside a word (*quan / sát*). In display lines
  every break is chosen in the catalog; never let a word's two syllables split there. Lines set by hand (the hero, the
  About title, the default card) choose their own breaks; lines that wrap (the results headline and its second line,
  the card's lead) hold each compound together with U+00A0 (`bind()` in `results.ts` and `card/vi.ts`: *vệ tinh*,
  *đã quan sát* (so no line ends on the aspect marker *đã*), *quan sát*, *bức ảnh*, *công bố*, *chúng tôi*, *danh
  mục*, *tuần này*), a count to its noun (*256 vệ tinh*) and each end of a date span to its preposition (*Từ 26/10*,
  *đến 2/11*).
  Seen before the fix: *256 vệ / tinh đã quan sát Waterloo.* (1280 and 390 px), *Từ 26/10 đến / 2/11, …* (390 px),
  *…, 256 / vệ tinh …* (1280 px); after it, both widths read *Từ 26/10 đến 2/11, / 256 vệ tinh / đã quan sát
  \*Waterloo\*.* In body text, accept the browser's breaks but hold a number to its unit and a count to its
  noun with U+00A0 where the sentence is short enough that a break would strand them.
- Abbreviations: only the 16-point compass (§4.2), `UTC`, `GMST`, `IR`, `TLE`, `CN` and `T2`–`T7`, no full stops. In
  prose none except units and acronyms. Never *v.v.*, *ko*, *đc*, *TP.* in copy; never `~` (write *khoảng*; `±` for a
  range of angles, `≈` in readouts).
- Licence notices stay verbatim English everywhere: *Contains modified Copernicus Sentinel data 2026*, *Contains
  modified EUMETSAT Meteosat data 2026*, *Landsat imagery courtesy of the U.S. Geological Survey and NASA*.

---

## 7. Length discipline

Vietnamese runs about **10 to 30% longer** than English in characters: every syllable is a word with a space, and
English's compact compounds (*off-nadir*, *swath*) become two or three words. A few labels shrink (*Share* → *Chia sẻ*
is the same width; *How this works* → *Cách hoạt động*, the same 14).

Strategies, in order:

1. **Drop the object or possessive when context supplies it:** *Chia sẻ*, not *Chia sẻ cái này*; *Kiểm tra kết nối*.
2. **A noun, not a verb phrase, in labels:** `ĐỘ NGHIÊNG`, `HƯỚNG BAY`.
3. **No *đang*, *đã*, *được*, *các* in labels or chips**, except where the state is the meaning (*Đang tải*,
   *Đã sao chép*).
4. **Pick the plainer word when two are correct:** *Định vị* over *Xác định vị trí của tôi*; *Thử lại* over *Thử lại lần
   nữa*.
5. **Never invent an abbreviation.** Vietnamese readers do not abbreviate *phút*, *giờ*, *giây*; they are short already.
6. **If it still does not fit, the layout changes, not the word:** an icon button goes icon-only (with the full aria
   label), a cell wraps to two lines, or design gives width.

| English | Vietnamese | Chars (en → vi) | Notes |
|---|---|---|---|
| Something / watched *you* / this week. (landing) | Tuần này, / có thứ gì đó / quan sát *bạn*. | 9/11/10 → 9/12/13 | Three lines at 1280 × 800 (578 of the column's 580 px) and 375 px (§3.1). |
| (card, 88 px) | 4 lines | 384 → ≈ 420 px for the widest | The card's column is 466 px. |
| Enter any place on Earth (card footer) | CHỌN MỘT NƠI TRÊN TRÁI ĐẤT | 24 → 26 | *bất kỳ* dropped to fit beside the host. |
| No satellite we track watched (zero card lead) | Không vệ tinh nào trong danh mục của chúng tôi quan sát | 29 → 54 | Three lines at most. Accepted. |
| HOW THIS WORKS + SUN 16.2°S 063.0°E (HUD pair) | CÁCH HOẠT ĐỘNG + MẶT TRỜI 16.2°S 063.0°E | 14 + 18 → 14 + 23 | Checked at 375 px: clear (the sun line steps aside when crowded). The landing during a replay is tight in every language; there the switcher's *TIẾNG VIỆT* (the language's own name, not copy) meets *LÚC ĐÓ 11:21:13 EST* (reported to the HUD's owner). |
| USE MY LOCATION / LOCATE ME / NEAR ME | DÙNG VỊ TRÍ CỦA TÔI / ĐỊNH VỊ / GẦN TÔI | 15 → 19 / 9 → 7 / 7 → 7 | |
| SURPRISE ME / HOW THIS WORKS (link) | NGẪU NHIÊN / CÁCH HOẠT ĐỘNG | 11 → 10 / 14 → 14 | |
| LAST 7 DAYS | 7 NGÀY QUA | 11 → 10 | |
| CLOSEST LOOK / LAST CLEAR LOOK | CHI TIẾT NHẤT / KHÔNG MÂY MỚI NHẤT | 12 → 13 / 15 → 18 | The chip holds ~20. |
| LOCATING… (the near-me chip) | ĐANG ĐỊNH VỊ… | 10 → 13 | The phone's chip row scrolls: the chip grows rather than drop *đang*. |
| No named place nearby (pin card, 156 px at 13 px) | Không có địa danh ở gần | 21 → 23 | 146 px in the bundled sans (*… gần đây* was 160 px and cut). |
| HOLD THE GLOBE ANYWHERE TO MOVE IT (320 px) | NHẤN GIỮ QUẢ ĐỊA CẦU ĐỂ DỜI GHIM | 34 → 32 | |
| NO PUBLIC IMAGE (geo cell, 64 px) | KHÔNG ẢNH / CÔNG KHAI | 15 → 19 | About 9 capitals a line (10.5 px on phones): a no-break space keeps the compound on one. |
| NEW SEARCH (shares a box with CANCEL, CLOSE) | TÌM KIẾM MỚI | 10 → 12 | |
| IN VIEW 37 S (replay legend, nowrap) | TẦM NHÌN 37 GIÂY | 12 → 16 | About 21 characters fit on a 390 px phone. A span of minutes (*TẦM NHÌN 7 PHÚT 15 GIÂY*) still pushes the end clock off the screen, as in French, German, Polish and Ukrainian: a layout fix, reported (§Appendix). |
| 12 THIS WEEK | TUẦN NÀY: 12 | 12 → 12 | §5.3 rule 5. |
| LINK / POST (48 px column) | LIÊN KẾT / BÀI ĐĂNG | 4 → 8 / 4 → 8 | Each wraps to two lines in the column where it must; the column is not nowrap. |
| SHARE THIS WEEK | CHIA SẺ TÓM TẮT TUẦN NÀY | 15 → 24 | One line beside the close button. |
| IMAGE / LIKELY / COULD / OVERHEAD (lanes) | ẢNH / QUÉT QUA / CÓ THỂ / BAY QUA | ≤ 8 | |
| CLOSEST · LOCAL / SCAN LINE HERE · LOCAL | GẦN NHẤT · ĐỊA PHƯƠNG / QUÉT QUA ĐÂY · ĐỊA PHƯƠNG | 15 → 21 / 22 → 25 | Two-column geometry grid: *Quét qua đây* ("scanned past here") says the moment in three words. |
| OFF-NADIR / PIXEL / ALTITUDE / PASSES | ĐỘ NGHIÊNG / ĐIỂM ẢNH / ĐỘ CAO / LƯỢT BAY | 9 → 10 / 5 → 8 / 8 → 6 / 6 → 8 | |
| SHARE / DOWNLOAD IMAGE / COPY LINK / POST TO X | CHIA SẺ / TẢI ẢNH XUỐNG / SAO CHÉP LIÊN KẾT / ĐĂNG LÊN X | 5 → 7 / 14 → 13 / 9 → 17 / 9 → 10 | The share row fits its labels in any language (`useFitRow`): it goes to two rows rather than cut one. |
| REPLAY | PHÁT LẠI | 6 → 8 | |
| Infrared (band value, ≤ ~9) / Shadow (spot value, ≤ ~7) | Hồng ngoại / Bóng mây | 8 → 10 / 6 → 8 | One over each; QA checks the 21 px cells, and the cell gives way, not the word. |
| 1.84 s (computing row, 48 px) | 1,84 s | 6 → 6 | The SI symbol, not *giây*: *0,00 giây* overruns the fixed time column into the status cell. |

---

## 8. Sensitive content

**Surveillance and privacy.** The product's subject is being watched; the copy keeps the unease in the hero and lets the
rest be facts. Never escalate: no *theo dõi bạn*, *giám sát bạn*, *rình*, *do thám bạn*, *bị quan sát*. "Satellites we
track" is said as our catalog (*vệ tinh … trong danh mục của chúng tôi*). *vệ tinh do thám* is the factual term and
stays (About).
Privacy lines say exactly what the English says, in the plainest words: *một vùng rộng khoảng 10 km*, never *ô ~10 km*.
Never *ẩn danh hoàn toàn*, *an toàn 100%*, *cam kết*.

**The East Sea and the islands (the most sensitive point for Vietnamese readers).** Vietnam calls the South China Sea
*Biển Đông* ("the East Sea"), the Paracel Islands *Quần đảo Hoàng Sa* and the Spratly Islands *Quần đảo Trường Sa*, and
Vietnamese readers treat the English and Chinese names in a Vietnamese interface as taking a side (products and films
have been withdrawn from Vietnam over a map). Our copy names none of them. The place data does (GeoNames' *South China
Sea*, OpenStreetMap's *Paracel Islands*), and shows them as they come. **Owner question before `vi` is listed:** a
display-only exonym table for `vi`, as Korean's (`src/i18n/ko/exonyms.ts`), with countryless names *South China Sea =
Biển Đông*, *Paracel Islands = Quần đảo Hoàng Sa*, *Spratly Islands = Quần đảo Trường Sa* (and the data's variants:
*Xisha Islands*, *Nansha Islands*). Usage stats and links keep the English label, as for Korean, so nothing splits.
Until the owner decides, the names show as the data has them.

**Country names.** They come from `Intl.DisplayNames('vi')` (CLDR): *Trung Quốc*, *Đài Loan*, *Ukraina*, *Israel*,
*Jordan*, *Li-băng*, *Ai Cập*, *Timor-Leste*. Translators never override them. Two CLDR long names misread for
Vietnamese readers, and the owner decides before `vi` is listed:

- **PS: *Lãnh thổ Palestine*.** Vietnam has recognised the State of Palestine since 1988 and its press and foreign
  ministry say *Palestine* (*Nhà nước Palestine*). "Palestinian Territory" reads as a downgrade. Recommended: CLDR's
  own short name *Palestine*, by adding `vi` to the PS entry of `SHORT_NAMES` in `src/imagery/localPlaces.ts`, as
  Arabic and Indonesian do. Display only.
- **MM: *Myanmar (Miến Điện)*.** CLDR's parenthesis is odd in a where line; *Myanmar* alone is what the press prints.
  Lower priority.
- HK and MO already show CLDR's short names in every language (*Hồng Kông*, *Macao*).

**War zones in the time-lapse (Gaza Strip, West Bank, Ukraine, Lebanon).**
- Names: *Dải Gaza*, *Bờ Tây*, *Ukraina*, *Li-băng* (CLDR); Ukrainian cities in Ukrainian transliteration: *Kyiv*,
  *Kharkiv*, *Odesa*. Much of the Vietnamese press still writes *Kiev*, *Kharkov*, *Odessa* (from Russian); the product
  follows each city's own name, as it does in every language. Gazetteer names are shown as they arrive.
- Our copy takes no side: it says what the pictures show (the year, the date, the satellite). Never add *chiếm đóng*,
  *xâm lược*, *diệt chủng*, *khủng bố*, *giải phóng*, or either side's designation. If a line must say why a season is
  fixed, say *vùng chiến sự*.
- Never *nhắm*, *chĩa*, *mục tiêu*, *càn quét* or any weapon verb near these places, or anywhere (the time-lapse note
  says a year's look is *được chọn* for a season). *xuyên mây* (radar sees through cloud) is physics and allowed.

**Crimea.** Write *Crimea*, with no qualifier. Places on the peninsula show *…, Ukraina*, by the owner's override
(`src/imagery/geocode.ts`, `CRIMEA` / `inCrimea`), in every language: the place's data, as GeoNames has it. Never
change it to *Nga*, and never add *sáp nhập*, *Cộng hòa Crimea* or *thuộc Nga*. Vietnam abstains on Crimea, so a
Vietnamese reviewer or translation memory may "correct" *Simferopol, Ukraina*: do not.

**Glaciers.** *sông băng*; *cuối mùa băng tan*; *bán cầu bắc / nam*. State the date rule if asked; never editorialise
(*khủng hoảng khí hậu*, *tan chảy kinh hoàng*).

**Disasters.** Vietnamese readers will search typhoon, flood and landslide sites (Yagi's path, Làng Nủ, the Central
coast). The copy stays the same factual copy: no condolence formulas (*xin chia buồn*), no drama.

---

## 9. Pitfalls specific to Vietnamese, and the reviewer checklist

### 9.1 Pitfalls

| Trap | Wrong | Right |
|---|---|---|
| "watch" as track or follow | *theo dõi Waterloo* | *quan sát Waterloo* |
| "pass" as a flight or a turn | *chuyến bay*, *lần bay* | *lượt bay qua*, *31 lượt* |
| "scene" as a film scene | *cảnh*, *khung cảnh* | *cảnh ảnh*, *ảnh* |
| "actual" | *thực tế* (practical) | *thật* |
| "closest look" | *ảnh gần nhất* (nearest, latest) | *Chi tiết nhất* |
| "latest" vs "closest" | *Gần nhất* for both | *Mới nhất* (latest), *Gần nhất* (closest) |
| "elevation" | *độ cao 64°* (altitude) | *góc ngẩng 64°*, *cao 64° trên đường chân trời* |
| "fixed camera" | *camera cố định* (CCTV) | *camera hướng cố định* |
| North in a compass readout | `N` (reads *nam*), `NNE` | `B`, `BĐB` |
| "Localising" coordinates | `16,2°N 063,0°Đ` | `16.2°S 063.0°E` |
| N/M for "N of M" | *Ảnh 3/11* (3 November) | *Ảnh 3 trong số 11* |
| CLDR short months | *1 thg 11* | *1/11* |
| Intl relative | *sau 3 giờ nữa* | *3 giờ nữa* |
| Intl units | *7,46 km/giây* | *7,46 km/s* |
| Present for a past pass | *Ở đây đang tối.* | *Lúc đó ở đây trời tối.* |
| *đang* in the hero | *đang quan sát bạn* (live: false) | *quan sát bạn* after the fronted *Tuần này* |
| Adversative passive | *bạn bị quan sát* | *có thứ gì đó quan sát bạn* |
| *bởi* passive | *được chụp bởi Sentinel-2C* | *do Sentinel-2C ghi lại* |
| *nó* for a satellite | *Nó nhìn thẳng xuống.* | *Camera hướng thẳng xuống.* |
| *của bạn* everywhere | *Kiểm tra kết nối của bạn* | *Kiểm tra kết nối* |
| *chúng ta* for the product | *chúng ta không thể biết* | *chúng tôi không thể biết* |
| *các / những* after a number | *31 các bức ảnh* | *31 bức ảnh* |
| A count before a time noun | *12 tuần này* ("these 12 weeks") | *Tuần này: 12* |
| Number spelled out | *một vệ tinh đã quan sát* (with a count slot) | *1 vệ tinh đã quan sát* |
| Decomposed text | *ể* typed as *e* + U+0302 + U+0309 | NFC *ể* (U+1EC3) |
| Old tone placement | *huỷ*, *hoà*, *toạ độ* | *hủy*, *hòa*, *tọa độ* |
| *hàng ngày* | *ảnh ghép hàng ngày* | *ảnh ghép hằng ngày* |
| *chụp* for radar | *radar đã chụp Waterloo* | *radar đã ghi lại Waterloo* |
| *time-lapse* as *tua nhanh* | *video tua nhanh thời gian* | *time-lapse* |
| *IR* as *HN* | `HN` (Hà Nội) | `IR` |
| Politeness and apology | *Vui lòng thử lại*, *Rất tiếc, …*, *Xin* | *Thử lại* |
| Particles | *nhé*, *ạ*, *nha*, *đấy* | nothing |
| Marketing | *Khám phá ngay*, *thời gian thực*, *trải nghiệm* | the fact |
| Weapon and sweep verbs | *nhắm vào*, *chĩa*, *càn quét*, *mục tiêu* | *hướng về*, *quét qua*, *địa điểm* |
| Decimal point outside coordinates | *7.46 km/s* | *7,46 km/s* |
| English article on places | *the Pacific Ocean* | *Pacific Ocean* |
| Translating names | *Thiên Cung* in a blurb, *Đã quan sát.* (wordmark), *Cơ quan Vũ trụ châu Âu* for ESA in UI | *Tiangong*, *Watched.*, *ESA* |
| `~` shorthand | *~10 km* | *khoảng 10 km* |
| Title case | *Cách Hoạt Động* | *Cách hoạt động* |
| The scene's cloud as the image's | *Lượng mây trên toàn ảnh* (the crop on screen) | *Lượng mây của cả cảnh ảnh*, unit `CẢNH ẢNH` |
| "Search unavailable" as "not found" | *Không tìm được* | *Không tìm kiếm được* |
| A bare *trong tầm* | *đã ở trong tầm*, *Trong tầm 37 giây* | *trong tầm nhìn*, *trong tầm với*; the replay legend's label *Tầm nhìn 37 giây* |
| *đã* after a negation | *Không vệ tinh nào … đã quan sát* | *Không vệ tinh nào … quan sát* |
| *cũng* on the wrong word | *có thứ gì đó cũng quan sát bạn* | *cũng có thứ gì đó quan sát bạn* |
| An English afterthought | *…, 42 lần.*, *với 375 m mỗi điểm ảnh*, *Thô, nhưng là ảnh thật* | *… 42 lần bằng hồng ngoại.*, *ở độ phân giải 375 m*, *Ảnh thô nhưng là ảnh thật* |
| A word that reads twice | *gần đây* ("nearby" and "recently"), *ngày* after an angle, *Giữ* ("keep") | *ở gần*, *ban ngày*, *Nhấn giữ* |
| *quang* alone | `QUANG` beside a product line (*quang học*) | *Không mây* |
| "last" as "closest" | *Không mây gần nhất* | *Không mây mới nhất* |
| "would have" as "must have" | *hẳn vệ tinh đã ghi lại* | *nhiều khả năng vệ tinh đã ghi lại* |
| *họ* or bare *trạm* for a station | *ảnh của họ*, *Nếu …, trạm đã* | *ảnh từ các trạm này*, *trạm vũ trụ* first |
| *ghép* for "match" | *ghép từng bức ảnh với lượt bay* (stitch) | *đối chiếu* |
| "unavailable" as "none" | *Không có danh mục*, *Hiện chưa có ảnh* (an image exists) | *Không tải được danh mục*, *Hiện không tải được ảnh* |
| *nơi của bạn* | *Xem nơi của bạn* | *Xem nơi bạn ở* |
| *tráng* without film | *Đang tráng khung hình* | *Đang rửa ảnh* |

### 9.2 Reviewer checklist (run over every string)

1. Is the reader *bạn* (the user's own voice *tôi*), with no *quý khách*, *anh/chị*, *mình*, and *của bạn* only where
   the second person is the point?
2. Is "we" *chúng tôi*, never *chúng ta*?
3. Is the product verb *quan sát*, and are the four verdict titles and lanes exactly as in §3.7?
4. **Can this element ever show a radar image, a mosaic or a full-disc frame? Then *ảnh* (or *hình ảnh*), and *ghi
   lại*, not *chụp*.** Is *ảnh chụp* used only for certain optical photos?
5. Is every number a digit, with comma decimals and period grouping (coordinates excepted), one noun form, the right
   count word (*bức ảnh* in prose, *ảnh* in labels, *lượt*, *lần*), no *các / những* after it, and no count right
   before *tuần / ngày / năm*?
6. Units: *km*, *m*, *km/s*, *25%*, *5,4°*; *phút / giờ / ngày / giây* written out; compass from §4.2 with **B** for
   north; coordinates untouched?
7. Clocks with a colon, as they arrive (*lúc 16:14 EST*); zones untouched; dates in digits day/month (*CN, 1/11*), the
   full weekday in posts, spelled out in aria (*ngày 6 tháng 11*)?
8. A past pass with *đã* and *lúc đó*, never *đang*?
9. Does [PLACE] stand bare (no class noun, no article)? Does [SAT] avoid *nó*?
10. Standard written Vietnamese, no particles, no *Vui lòng*, no filler (*việc*, *tiến hành*, *thực hiện*, *một cách*),
    no *bởi* passive?
11. NFC, new tone placement, sentence case, *Trái Đất* / *Mặt Trời* capitalised, no italics except the serif accent, no
    em dash, no exclamation mark, no emoji, no `~`?
12. Does a label fit its slot (§7: lanes ≤ 8, the share labels, the card's 466 px column, the HUD pair)?
13. Does it say exactly what is on screen (resolution, counts, "watched") and no more, with hedges only where the
    English hedges?
14. Names untouched: *Watched.*, *www.watched.earth*, satellite, sensor, agency and programme names, NORAD IDs, *UTC*,
    zones, coordinates, the English licence notices?
15. Near war zones and disputed places: neutral nouns, CLDR country names, *Kyiv*, no weapon or sweep verbs; and no
    name for the East Sea or its islands in our own copy (§8)?
16. No English afterthought: is each count by its verb, each pixel size a phrase of its own, each fragment a clause?
17. Does a word read two ways in its slot (*gần đây*, *ngày* after an angle, *trong tầm*, *Không tìm được*)?
18. Read it aloud: a precise person speaking to one reader, not a bank, not an ad, not a translation?

---

## Appendix: engineering notes (cost and speed)

Vietnamese adds no cost and no load time. Every decision above is static copy or a small table in the `vi` chunk;
nothing is translated at runtime, no service is called, nothing new is stored, and an English visitor downloads exactly
what they did before.

- **Fonts.** Vietnamese is Latin with stacked marks, covered by the `vietnamese` unicode-range subsets of Instrument
  Sans, Instrument Serif and Martian Mono (Google Fonts ships one for each); a page in another language never
  downloads them. Another change adds them (not this guide's), and with them the line boxes stacked capitals need: a
  mono caps label with *Ể* or *Ỗ* must not clip, and the share card's satori renderer and `cardGlyphs.test.ts` need the
  same coverage.
- **Formatting is built-in `Intl`** (numbers, plural, lists, country names), verified in Node 22: `1.715,5`;
  `PluralRules('vi')` → `['other']`; `ListFormat` *Umbra, Capella và 7 vệ tinh radar khác*. Traps found and avoided:
  short month *thg 11*, relative *sau 3 giờ nữa*, unit *km/giây*, the long names *Lãnh thổ Palestine* and
  *Đặc khu Hành chính Hồng Kông, Trung Quốc* (already short in the product).
- **Dates are hand-built** from the instant's local fields (`p` in the time namespace): *CN, 1/11* needs no Intl call at
  all, and the weekday names come from a seven-entry table in the chunk (the calendar's *T2 … CN* and CLDR's *Thứ Hai …
  Chủ Nhật*, identical to Intl's long forms).
- **Clocks, zones and coordinates need no change**: they stay the app's international notation.
- **`vi` frames take the raw place label** (they skip `placeInProse` / `placeParts`).
- **Share cards** are drawn in the sharer's language, carried as `l=vi`, never negotiated from the viewer's
  `Accept-Language`: one cache entry per link. The default card drawn for an `l=vi` link is Vietnamese, with the
  four-line hero (§3.1), and `card.defaultAlt` describes it.
- **Owner questions (each free at runtime):**
  1. The East Sea exonym table (§8): `src/i18n/vi/exonyms.ts`, countryless, display only.
  2. `vi` in `SHORT_NAMES.PS` (*Palestine*, §8).
  3. `'Asia/Ho_Chi_Minh': 'ICT'` in the zone abbreviation tables? Vietnamese readers write *GMT+7* or *giờ Việt Nam*
     and rarely *ICT*; *UTC+7*, which the app shows today, is correct and familiar. Recommended: leave it.
  4. Coordinates with Vietnamese hemisphere letters for `vi` (§4.2): display only, in `fmtLat` / `fmtLon` or a `vi`
     wrapper; the search field keeps parsing *43.47, −80.54*. Recommended, so that N means one thing on a screen.
- **Code changes the catalog cannot make (reported by the review):**
  1. The spoken day for four accessible names (§5.5): `Gallery.tsx` (`slideLabel`, `replayLabel`, `viewLabel.*`) and
     `PassList.tsx` (`expandLabel`) pass the visual short day; give them the spoken one (`fmtSpokenDay`, as `rowLabel`
     gets) in a new parameter, so English stays byte-identical. Every language with a numeric short day has the same
     gap.
  2. The replay legend (`ReplayControls.tsx`, one nowrap row) overflows a 390 px phone when the place was in view for
     minutes: *TẦM NHÌN 7 PHÚT 15 GIÂY* pushes the end clock 43 px off the screen, and French, German, Polish and
     Ukrainian do the same. The middle span needs to shrink or wrap.
  3. The landing hero has no fit for long lines: at 1280 × 800 the column is 580 px, and a line over about 13
     characters wraps (Italian's *questa settimana* and *ha osservato te.* set as five lines, pushing the search into
     the bottom-left readout). A fit to the widest line would also free Vietnamese to choose *đã* if it ever wanted
     it.

---

## Decisions log

| # | Question | Resolution |
|---|---|---|
| 1 | Address | *bạn*; *tôi* in the user's own voice; *chúng tôi* for the product (§1). *anh/chị* and *quý khách* rejected on voice and on the hero. |
| 2 | Product verb | *quan sát*: the remote-sensing verb (*vệ tinh quan sát Trái Đất*) and an everyday one, uncanny with *bạn* as its object. *theo dõi* rejected (tracking, Facebook's Follow, an overclaim for a single pass); *dõi theo* rejected (tender). |
| 3 | Hero order | Time first, reader last: Vietnamese puts emphasis at the end, and the accent lands there (§3.1). |
| 4 | Aspect | *đã* in each pass's first clause, every count sentence and every question; the hero's existential *có …* after a fronted *Tuần này* reports the past without it (*Hôm nay có người tìm bạn*), confirmed in review; a negation takes none (*Không vệ tinh nào … quan sát*); *lúc đó* for a pass's conditions; *đang* only for live states (§2.1, §3.1). |
| 5 | Image words | *ảnh* for everything (Vietnamese *ảnh vệ tinh*, *ảnh radar* are standard and honest); *bức ảnh* after a count in prose, bare *ảnh* in labels; *ghi lại* where radar can be the sensor (§0, §5.3). |
| 6 | Pass | *lượt bay qua*, counted *lượt* (*lượt xem*, *lượt truy cập* are the model); *lần* kept for "times" (§4.1). |
| 7 | Verdict ladder | *Đã quan sát* · *Nhiều khả năng đã quan sát* · *Có thể đã hướng về đây* · *Bay qua trên đầu*; the likely lane is its verb *Quét qua*, because *Khả năng* and *Có lẽ* blur the ladder (§3.7). |
| 8 | Dates | Day/month digits (*1/11*), the form every Vietnamese newspaper, form and receipt uses; CLDR's *thg* rejected; *N trong số M* for counts so no slash pair reads as a date (§5.5). |
| 9 | Compass | Vietnamese textbook letters, B for north, because N is *nam*; coordinates stay international until the owner decides on Vietnamese hemisphere letters (§4.2). |
| 10 | Elevation | *góc ngẩng*, so *độ cao* stays the altitude's (§4.1). |
| 11 | Units of time | Written out (*phút*, *giờ*, *giây*), except the computing readout's fixed 48 px time column (*1,84 s*) (§7). |
| 12 | Tone marks | New placement, one style; NFC enforced (§6.1). |
| 13 | Time-lapse | The loan *time-lapse*; *tua nhanh thời gian* is a video speed effect, not a year-by-year loop (§4.1). |
| 14 | Sub-solar point | *Điểm Mặt Trời lên thiên đỉnh*: the point, named in the textbook's words (§3.8; changed in review from *Mặt Trời ở thiên đỉnh*, a statement). |
| 15 | East Sea, Palestine | Owner questions, with exact proposals (§8, appendix). |
| 16 | Scene cloud cover | *Lượng mây của cả cảnh ảnh*, unit `CẢNH ẢNH`: the archive's figure for the scene, never the crop's (§3.5, review). |
| 17 | Last clear look | *Không mây mới nhất*: *gần nhất* stays "closest" (§4.1, review). |
| 18 | "We track" | *trong danh mục của chúng tôi*; *theo dõi* only for tracking data (§3.3, review). |
| 19 | Crimea | *Crimea*, places in it *…, Ukraina* by the owner's override; no qualifier (§8, review). |

---

## Review (2026-11-21)

Two independent reviews read every message against its English: A as a native reader, B for accuracy. Each finding
was judged on its merits; where they disagreed, the choice and its reason are below.

**Changed**

- **The guide:** *thiên đế* corrected to *thiên để* (nadir); the claim that every accessible date is spoken narrowed to
  the pass rows (§5.5); the coordinates' N beside the compass's N made an owner question (§4.2); a Crimea rule (§8);
  new rules for English afterthoughts, negated past, bare *trong tầm* and words that read twice (§2.1, §9).
- **Meaning (honest labelling):** *Không tìm kiếm được* for "search unavailable" (landing status, engine note: *Không
  tìm được* said nothing was found); *Lượng mây của cả cảnh ảnh* and unit *cảnh ảnh* (*toàn ảnh* claimed the crop's
  cloud); the card's *Hiện không tải được ảnh* (*chưa có ảnh* contradicted its verdict); *Không mây mới nhất* for the
  last clear look (*gần nhất* is "closest" on the same screens), in the gallery, viewer and card; *cả nửa Trái Đất bên
  dưới* (one disc, not the whole surface); *nhiều khả năng* for "would have" (*hẳn* overclaimed); *Không tải được danh
  mục*; no *chỉ* in the H.264 tooltip; Jilin-1's and Gaofen-7's sub-metre pixels; BlackSky's revisit rate.
- **The guide's own rules, broken by the copy:** *nhắm tới* in the time-lapse note; *chụp* for four radar blurbs and the
  full-disc note; *họ* and a bare *trạm* for stations; a bare *cảnh*; *ghép* for "match" (About); *Ví dụ địa điểm*
  (head-first: *Địa điểm ví dụ*).
- **Grammar and naturalness:** *cũng có* in the share hook (both reviews); the zero sentences without *đã* and with
  *trong danh mục của chúng tôi* (headline, pass list, card); counts by their verb and pixel sizes as phrases (*42 lần
  bằng hồng ngoại*, *ở độ phân giải 375 m*, *mỗi điểm ảnh rộng 10 m*, in pass sentences, notes, the post, blurbs and
  filter tooltips); English fragments as clauses (*Ảnh thô nhưng là ảnh thật*, *Gồm các trạm vũ trụ …*); *trong tầm
  nhìn* / *trong tầm với*; *chứ không phải*; *Xem nơi bạn ở*; *một lần* for "once"; the overhead sentence with its
  clock first; About's question, delay, SGP4, radar, daylight, clouds and lede; the share page's title (*Những gì …*),
  description (*mà chúng đã ghi lại*, also the landing) and alt text; *điểm đó* in posts; *Đang rửa ảnh*; *Nhấn giữ*;
  *Không có địa danh ở gần* (it also fits: 146 of 156 px); *Không mây* / *Điểm không mây*; *ban ngày* / *ban đêm* after
  an angle; *Điểm Mặt Trời lên thiên đỉnh*; *Đang định vị…*; *Phát* / *Tạm dừng* for the replay (it shared the
  footer's name); *Không ảnh công khai* (no *công / khai* split); and the smaller lines (*Tìm kiếm mới*, *dẫn tới*,
  *về Waterloo*, *theo múi giờ*, *ghi rõ điều đó*, *có từ 3 ngày trước*, the geostationary zero line, the browser in
  *renderFailed*, the Meteosat ordinals, OLCI, RCM, SuperDove, Sentinel-1).

**Rejected, or decided between the two**

- **The hero keeps no *đã*** (B asked for it back, reading the bare verb as ongoing or a horoscope; A confirmed it).
  The existential *có …* after a fronted time phrase is how Vietnamese reports what happened (*Hôm nay có người tìm
  bạn*), so *đã* adds nothing a headline needs; the reason is now the language, not the layout. The hook follows the
  hero (A's *Tuần này, cũng có thứ gì đó quan sát bạn.*, not B's with *đã*). The landing's lack of a fit for long lines
  is reported (Appendix).
- **Developing frames:** *Đang rửa ảnh* (A), not *Đang tráng ảnh* (B): *rửa ảnh* is the everyday phrase, and *tráng*
  goes with film.
- **No named place nearby:** *Không có địa danh ở gần* (A), not *Vùng này không có tên* (B), which says the area has no
  name; open sea and ice often do.
- **Clear:** *Không mây* (A), the glossary's word for a clear look, over *Trời quang* (B); the spot value under *Mây tại
  điểm* keeps `QUANG` (both).
- **The time-lapse note:** A's *Ảnh mỗi năm được chọn vào …* over B's *Mỗi năm lấy ảnh ở …* (a year does not take).
  **BlackSky:** A's shorter *tần suất chụp lặp lại cao*. **Crewed stations:** A's *ảnh từ các trạm này*.
- **The scene's cloud:** *của cả cảnh ảnh*, not B's *trên toàn cảnh ảnh*: *toàn cảnh* is "panorama".
- **The replay legend:** not A's *Trong tầm nhìn 37 giây*, which pushed the end clock off a 390 px phone; the noun label
  *Tầm nhìn 37 giây* is complete and fits (a span of minutes overflows in several languages: reported).
- **No public image:** B's *Không ảnh công khai*, plus a no-break space in *công khai*: on phones (10.5 px) B's form alone
  still set as KHÔNG / ẢNH CÔNG / KHAI.
- **About's question:** *tất cả các vệ tinh không?*, not *tất cả vệ tinh*: *tất cả các* is the collocation.
- **Not applied here:** the spoken day in four accessible names (both reviews; right, but a change to shared components)
  and Vietnamese hemisphere letters in coordinates (both reviews; an owner decision). Both are in the Appendix.
- **Kept as they are:** the geostationary blurbs' *chụp toàn đĩa* (they describe imagers, as the Vietnamese weather press
  does; only radar and the note under a shown frame, which can be infrared, take *ghi*); every point A or B confirmed
  (*Quét qua*, *Nhiều khả năng đã quan sát* on two lines, CLDR's capitalised weekdays, *Kyiv*, *Khu vực 51*).

## Review: phone-first visual pass (2026-11-22)

Every state measured (`scrollWidth` against `clientWidth`, each text node's line boxes against the viewport and its
element) at 360 × 780, 390 × 844, 430 × 932, 844 × 390 and 1280 × 800 against English at the same size, and looked at:
the landing, search suggestions, computing, the results summary, the pass list, a pass view of each verdict with its
replay, the geostationary rows, the photo viewer, both share sheets and every share card (rendered by `/api/og` with
`l=vi`), About, the language menu, the time-lapse (waiting, playing, Video), the fault notice and the zero and empty
results. Every letter is set in the Vietnamese faces (no fallback, no tofu), and no stacked mark is clipped by a line box.

**Changed (copy)**

- **Verdict titles** bind each phrase (*Đã quan sát*, *Có thể đã hướng về đây*,
  *Nhiều khả năng đã quan sát*): the pass list's header set ĐÃ QUAN / SÁT at 360 and 390 px, and the
  could tile ended a line on *đã* (CÓ THỂ ĐÃ / HƯỚNG VỀ ĐÂY); now ĐÃ QUAN SÁT, CÓ THỂ / ĐÃ HƯỚNG VỀ ĐÂY.
- **Geostationary rows:** each fact held whole (*mỗi 10 / phút* at 360 px); *Hiện chưa có ảnh* as HIỆN CHƯA / CÓ ẢNH
  (it took three lines with ẢNH alone).
- **The zero second line:** *Tuần này / Tuần đó không ảnh nào được công bố* (the pattern of *Không vệ tinh nào*), one
  line beside Share from 390 px; *không có bức ảnh nào* left *công bố.* alone on a second line at 390 and 1280 px. The
  card keeps its longer sentence, which has room.
- **The mostly-cloud chip:** *Tuần này hầu như chỉ thấy mây*, the passes as the understood subject; *Các lượt bay tuần
  này chủ yếu chỉ thấy mây* set THẤY MÂY alone on a second line on every phone.
- **Pass view:** *Góc ngẩng tại điểm* (the label form of the spot, as `MÂY TẠI ĐIỂM`; glossary §4.1 updated): *Góc
  ngẩng từ chỗ bạn* took two lines at 390 px. The private-archive captions said *công khai* twice; the archives are
  *không mở cho công chúng*.
- **Lone syllables** at the end of short notes held to their word or unit: *lượt bay*, *gián đoạn*,
  *còn đó*, *vài phút*, *tháng 11 năm 2000*, and the fault notice's compounds (*Kiểm / tra* at 360 px).
  Long body text (About, pass sentences) keeps the browser's breaks, as §6.5 says.

**Kept**

- The computing readout's *Đang kiểm tra ảnh thời tiết NASA · N / M*: its counter is cut on phones in English too (the
  row ellipsises as one string), so the layout is reported; dropping *thời tiết* would have hidden what is checked.
- *LIÊN / KẾT* in the share sheet's 48 px column, *GẦN NHẤT · / ĐỊA PHƯƠNG* at 360 and 390 px, the pass strip's
  two-line labels at 360 px (English wraps OFF- / NADIR there too): clean breaks between words, values aligned.

**Reported, not fixable here:** Vietnamese place names (*Hanoi*, *Da Nang City*: no `vi` exonym table, and a search for
*Hà Nội* finds a hamlet in Ninh Bình, not the capital); the geostationary frame time's live dot shrinking to 0 px when
the relative time (*1 GIỜ TRƯỚC*) is wider than the thumbnail; *Asia/Bangkok* as Hanoi's zone in the computing readout;
slash counters (*03 / 12*) that read as dates beside *20/12/2017*; the landscape headline column.
