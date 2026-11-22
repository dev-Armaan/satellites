# Watched: Indonesian (id) localisation style guide

Final, 2026-11-19. Supersedes `id.draft.md`; every decision below is final, and the critique's items are resolved in
the closing "Decisions log". Binding for every `id` string the product shows, speaks or sends: the app, the share
cards and pages, post text, alt text, aria labels, the video, About and the loading screen. Written against
`docs/DESIGN.md` §7, `src/ui/results/lib/copy.ts`, `src/ui/results/lib/meta.ts`, `api/_lib/i18n/card/en.ts` and the
English namespaces in `src/i18n/en/`. Where this guide and a translator's habit disagree, this guide wins. Where this
guide and the English disagree on a fact, the English wins and this guide is wrong: report it.

Notation. Indonesian copy is in *italics*. In frames and code blocks, `*…*` is the serif accent and `**…**` the bold
count phrase; inside an italic example the accent is written \*…\*. `[PLACE]`, `[SAT]`, `[NUM]`, `[TIME]`, `[ALT]`,
`[DIST]`, `[DIR8]`, `[SPEED]`, `[DEG]`, `[PCT]`, `[DAY]`, `[ZONE]` are runtime slots.

## 0. Decisions at a glance

| Question | Decision |
|---|---|
| Address | **kamu / -mu** on every surface, never *Anda*. Standard grammar (*bahasa baku*), never slang. |
| The user's own voice | **-ku** where the English speaks as the user (*Lokasiku*, *Di dekatku*, About's questions). The main locate button is pronoun-free: *Lokasi saat ini*. Never *saya*. |
| The product's "we" | **kami**, never *kita*. |
| The product verb "watched" | **mengawasi** (active), **diawasi** (passive, verdict title). |
| image / photo / picture | **citra** for any image and for every element that can hold a radar image, a mosaic or a geostationary frame; **foto** only where the item is certainly a Sentinel-2 or Landsat photograph; **gambar** for the share card's PNG and plain "picture". |
| pass / swath / scene | **lintasan** / **sapuan** / **citra** (never *adegan*). |
| Verdicts | *Diawasi* · *Kemungkinan besar diawasi* · *Mungkin mengarah ke sini* · *Melintas di atas*; lanes `CITRA` · `TERCAKUP` · `MUNGKIN` · `MELINTAS`. |
| Hero | **Sesuatu / mengawasi *kamu* / minggu ini.** (landing: three lines; the default share card: four, §3.1). |
| Plural | One CLDR category, `other`. One noun form for 1 and 1,000. |
| Numbers | `1.715` · `7,46` · `25%` · `5,4°` · `786 km` · `7,46 km/s` |
| Clocks | `16:14:21` (colon) wherever a clock shows, prose included: *pukul 16:14:21 UTC*. Clocks are international notation and arrive formatted. |
| Coordinates | International, as the app writes them: `16.2°S 063.0°E`, `0.2°W`. Never reformatted. |
| Compass | Prose words *utara … barat laut*; readouts use the 16 Indonesian abbreviations `U … UBL`. |
| Dates | CLDR `id`: *Min, 1 Nov* · *Minggu, 1 November*. A stamp that stands alone drops the weekday: `1 Nov 2026 · 11:21 WIB`. |
| Zones | Arrive formatted; a translator never writes or changes one. |
| Time-lapse | The loan **time-lapse** (upright, hyphenated). |
| Country names | CLDR `id` via `Intl.DisplayNames`, with CLDR's own short names *Palestina*, *Hong Kong*, *Makau* for PS/HK/MO (owner, 2026-11-19, §8; `shownCountryName`, display only). |

---

## 1. Register and address

### 1.1 The decision: *kamu*, standard grammar, everywhere

Every surface that addresses the reader uses **kamu** (free pronoun) or **-mu** (enclitic). The grammar is always
standard Indonesian: full affixes, *tidak* not *nggak*, *sudah* not *udah*. *kamu* is a standard pronoun in KBBI;
choosing it changes the social distance, not the correctness. The voice is a precise science journalist speaking to
one person: not a bank, not a ministry, not a friend on WhatsApp.

| Surface | Address | Form | Example | Why |
|---|---|---|---|---|
| Display headlines (hero, results headline, About title, panel heads) | *kamu*, free form when it is the accent | Short declarative, no particles, sentence case | *Sesuatu mengawasi \*kamu\* minggu ini.* | The hero is the human moment. *kamu* is one-to-one and close, eerie without being official. A free pronoun is a whole word, so it can carry the serif accent. |
| Sentences (results, pass detail, notes, post text) | *kamu* / *-mu*; the product is *kami* | Declarative, standard grammar | *Saat itu di sini gelap. … jadi yang terekam awanmu, bukan jalananmu.* | Second person is the product's voice; *-mu* keeps sentences short. |
| Buttons and links | Pronoun-free where possible; the user's own voice is *-ku* | Base-form imperative (*Bagikan*, *Salin tautan*), never *-lah*, never *Silakan* | *Lokasi saat ini* · *Lokasiku* · *Bagikan* · *Coba lagi* | Buttons are the user's command. Where the English speaks as the user ("me"), Indonesian does too, with *-ku*. |
| Mono caps labels | None | Nouns and short adjectives | `7 HARI TERAKHIR` · `KETINGGIAN` · `MIRING` | Labels name things; a pronoun in a label is noise. |
| Faults and notices | Pronoun-free first; *kamu* when a person must act | What failed, then what to do. No *Maaf*, no *Ups* | *Katalog orbit tidak bisa dimuat. Periksa koneksimu, lalu coba lagi.* | The English never apologises. Indonesian apps habitually open with *Maaf,*: longer and servile. |
| About page | *kamu*, *kami*, and *-ku* in the reader's own questions | Plain conversational standard, short sentences | *Bisakah satelit melihatku?* → *Tidak. Paling tajam, satu piksel di sini selebar 10 m. Mobil pun hanya satu piksel. Kamu tidak akan terlihat.* | The questions are the reader's, so they use *-ku*; the answers are ours. |

### 1.2 Pronoun mechanics

1. **Possessive: always the enclitic.** *lokasimu*, *langitmu*, *titikmu*, *tempatmu*, *posisimu*, *koneksimu*,
   *cakrawalamu*. Never *lokasi kamu* (colloquial), never *lokasi Anda*.
2. **Never attach an enclitic to an English loanword or to a slot.** *browsermu* / *browser-mu* is unsettled
   Indonesian; restructure: *di perangkatmu*, *di browser*. Never *Waterloo-mu*, *Sentinel-2C-nya*.
3. **Fixed Indonesian words may take *-mu*,** compass words included: *di sebelah baratmu*, *di sebelah barat dayamu*,
   *di sebelah timur lautmu* (the enclitic joins the last word of the phrase).
4. **Object: free *kamu* in the hero and in lines that echo it** (the share hook, the tab title, the default card's
   alt). Elsewhere the enclitic: *di atasmu*, *mengawasimu*. Never set "mengawasi" + "mu" with the suffix alone in the
   serif face.
5. **Subject: *kamu*.** *Saat kamu berbagi…*, *Jika kamu berada dalam jangkauan…*
6. **The product is *kami*.** *Kami tidak bisa tahu apakah itu terjadi.* Never *kita* (inclusive "we" makes the reader
   a co-author of the claim). Never *Watched* as a stand-in for "we" inside a sentence.
7. **Satellites get no personal pronoun.** Not *ia*, *dia*, *mereka*, or *itu* as a subject. Use *-nya* on a noun
   (*kameranya*, *radarnya*, *operatornya*, *sapuannya*), *satelit ini*, or the name again. See §5.2.

### 1.3 Rejected: *Anda*

*Anda* is the register of banks, ministries, insurance letters and fraud alerts. *Sesuatu mengawasi Anda minggu ini*
reads like a security warning from a bank: the uncanny must come from the fact, not from authority. Capital-A *Anda*
mid-sentence also looks like a proper noun and competes with the one serif accent. *Anda* would pull buttons toward
*saya* ("Gunakan lokasi saya") and the whole product toward a form-filling register. It lost on voice, on rhythm and
on the hero.

### 1.4 Also rejected

| Option | Why it lost |
|---|---|
| *kau* / *engkau* | Literary and dramatic (songs, scripture). The hero would read as a horror poster, not "quietly". |
| *lo* / *lu* / *gue* | Jakarta slang: regional, generational, wrong for an instrument. |
| Mixing (*Anda* in errors, *kamu* elsewhere) | One persona or none. Translation memory will try to insert *Anda*: reject it in review. |
| Pronoun-free hero (*Sesuatu mengawasi, minggu ini.*) | Removes the human moment the serif accent exists for. |

### 1.5 Standard words, not colloquial

| Use | Never |
|---|---|
| tidak; *tak* in headlines and fixed idioms (*tak berkedip*, *Tak satu pun*) | nggak, gak, enggak, ndak |
| sudah | udah |
| saja | aja |
| sangat, sekali | banget |
| hanya | cuma |
| bagaimana | gimana |
| seperti | kayak |
| sedang (progressive, live states only) | lagi (as progressive) |
| bisa, butuh | dapat, memerlukan (not wrong; pick one: *bisa*, *butuh*) |

Particles **never**: *dong, sih, kok, deh, lho/loh, nih, yuk, ayo, wah, ups, ya*. No exclamation marks. No emoji.

---

## 2. Voice

### 2.1 How "declarative, specific, quietly uncanny, second person" sounds in Indonesian

- **Lead with the fact, subject first.** *Sentinel-2C melintas…*, *256 satelit mengawasi…*. Numbers come early and
  are always digits (they are mono spans).
- **One idea per sentence.** Indonesian words are long, so sentences stay short: aim for 8 to 16 words, never over 20.
  Count a number with its unit (*786 km*) and a clock with its zone (*16:14:21 UTC*) as one word each; the pass
  sentences in §3.5 are written to that count. Where English chains three clauses, split into two sentences.
- **Let the colon and zero copula work.** *Tutupan awan di seluruh citra: 25%.* Not *… adalah 25%.*
- **Active when the satellite acts, passive when nobody in particular did it.** Active: *melintas, mengawasi,
  memindai, merekam*. Agentless passive is natural: *31 citra dipublikasikan*, *titik ini terekam*. Never a passive
  with an *oleh* chain.
- **Anchor the past with *saat itu*.** Indonesian has no tense; the time word carries it. A pass's conditions are
  *Saat itu di sini gelap*, *Saat itu siang*, never *Di sini sedang gelap* (that says "it is dark here now", false for
  a pass three days ago). *sedang* is only for live states: *Sedang memuat…*, *Mencari lokasi…*.
- **The hero may read as ongoing.** *Sesuatu mengawasi kamu minggu ini* reads "something is watching you this week".
  That is right, even stronger. Never "fix" it with *telah*; the results headline's *Dalam 7 hari terakhir* anchors
  the past where it matters.
- **The uncanny comes from precision plus "you".** *jadi yang terekam awanmu, bukan jalananmu.* No horror vocabulary,
  no ellipses for suspense, no rhetorical questions (the one question is the share hook, kept as the English has it).
- **Hedges are exact and few:** *kemungkinan besar* (likely), *mungkin* (the "could" verdict), *bisa saja* (could
  have, in sentences), *sekitar* (about), *setidaknya* (at least), *kami tidak bisa tahu* (we can't know). Never
  *sepertinya*, *kurang lebih*, *mungkin saja sih*.
- **No filler.** No *adalah* where a colon or nothing works, no *merupakan*, no *melakukan* + noun (*melakukan
  pemindaian* → *memindai*), no *sebuah* before every noun (one exception: *Sebuah satelit* for an unnamed satellite,
  §5.2), no *telah* for English past tense, no *yang mana*, no *dimana* as a relative pronoun.
- **Indonesian word order.** Head first: *kamera Sentinel-2C*, *mosaik harian NASA*, *arsip citra*.

### 2.2 What to avoid

- **Marketing:** *Temukan*, *Jelajahi*, *canggih*, *luar biasa*, *fitur*, *solusi*, *pengalaman*, *secara real-time*,
  *hanya dengan satu klik*, *gratis!*.
- **Calques:** *dibuat publik* (made public), *citra aktual* (actual image), *di mana* as a relative, *sebuah* for "a",
  *itu* for "it", *adalah* for every "is", *untuk* for every "to", *memindai … ke dalam mosaik* (swept into a mosaic),
  *dalam inframerah* (in infrared: write *dengan inframerah*).
- **Escalation:** English says "watched". Never *diintai*, *dimata-matai*, *dilacak*, *disadap* about the reader.
- **Over-politeness:** *Silakan*, *Mohon*, *Maaf*, *Terima kasih telah…* on UI chrome.

### 2.3 Before and after

| # | Before (typical first draft) | After | Why |
|---|---|---|---|
| 1 | *Dalam 7 hari terakhir, 256 satelit telah menonton Waterloo.* | *Dalam 7 hari terakhir, **256 satelit mengawasi** \*Waterloo\*.* | *menonton* is watching TV or a match; *telah* marks English tense for no reason. |
| 2 | *Yuk, temukan satelit-satelit canggih yang memantau lokasi Anda secara real-time!* | *Sesuatu mengawasi \*kamu\* minggu ini.* | Particle, marketing, reduplication, *Anda*, an untrue claim (nothing is real-time), an exclamation mark. |
| 3 | *Itu sedang melihat lurus ke bawah. Tutupan awan di seluruh adegan adalah 25%.* | *Kameranya menghadap lurus ke bawah. Tutupan awan di seluruh citra: 25%.* | *itu* as a subject, *adegan* is a film scene, *adalah* is filler. |
| 4 | *Sayangnya, kami tidak dapat mengetahui secara pasti apakah satelit tersebut benar-benar melakukan pengambilan gambar terhadap lokasi ini.* | *Kami tidak bisa tahu apakah itu terjadi.* | Apology, nominalisation, *tersebut* officialese, 23 words for 7. |
| 5 | *Di sini sedang gelap. Satelit cuaca yang merupakan pencitra malam dalam inframerah melihat awan Anda.* | *Saat itu di sini gelap. Satelit cuaca terus memindai dengan inframerah pada malam hari, jadi yang terekam awanmu, bukan jalananmu.* | Present tense for a past pass, *merupakan*, *dalam inframerah*, *Anda*; the after keeps the two-beat ending. |

---

## 3. The key lines

### 3.1 The hero

Landing (`landing.hero`), three lines:

```
Sesuatu
mengawasi *kamu*
minggu ini.
```

- Accent: ***kamu*** alone, serif italic, signal orange. The full stop after *ini* is sans.
- Lines are 7 / 14 / 11 characters (English 9 / 11 / 10). The middle line, which carries the accent, is the longest
  in both languages, so the weight sits where the English puts it.
- *minggu* stays lowercase (week; capital *Minggu* is Sunday, §9).
- The display size follows the viewport (`clamp`, capped by height). Estimated with the card's condensed face, the
  middle line is about 0.44 × the viewport width at full size against a six-column span of 0.5 × width − 60 px: it
  fits on every phone (≈ 220 px of 260 px at 320 px wide) and on screens 1000 px wide or more (≈ 558 px of 580 px at
  1280 × 800), and is too wide on landscape tablets narrower than that. There it wraps at its one space, giving the
  card's four-line form (*Sesuatu / mengawasi / \*kamu\* / minggu ini.*). That is the only break allowed: never
  `nowrap` (the line would run into the globe), never a break inside a word, never a manual break anywhere else.
- Screen readers get one sentence: *Sesuatu mengawasi kamu minggu ini.*
- Tab title and boot title: *Watched · Sesuatu mengawasi kamu minggu ini*. Share page title: *Sesuatu mengawasi kamu
  minggu ini.*

Default share card (`card.hero`), four lines, because the card never re-wraps and its column is 466 px: measured with
the card's own fonts at 88 px, *mengawasi kamu* is 538 px (English *watched you* 384 px). Four lines are about 341 px
tall in a 471 px box.

```
Sesuatu
mengawasi
*kamu*
minggu ini.
```

| Alternate | Why it lost |
|---|---|
| *Ada yang / mengawasi \*kamu\* / minggu ini.* | *ada yang* reads first as "someone" (a person): it misstates the agent and tips quiet unease into a stalker threat. |
| *Sesuatu / mengamati \*kamu\* / minggu ini.* | *mengamati* is the scientist's "observe": correct, cold, without the human feeling (*merasa diawasi*). |
| *Minggu ini, / sesuatu / mengawasi\*mu\*.* | Splits one word across two typefaces, and a sentence that starts *Minggu ini* reads "This Sunday" at first glance. |

### 3.2 The sub line

**Chosen** (`landing.sub`, `card.page.description`): *Pilih tempat mana pun di Bumi. Lihat setiap satelit yang
melintas di atasnya dalam 7 hari terakhir, beserta citra aslinya.*

- No-break space in *7 hari* (the `days` slot and its unit). *mana pun* is two words (PUEBI). *Bumi* is capitalised.
- One *-nya* per referent: *di atasnya* is the place; *citra aslinya* is true whether it reads as the place's or the
  satellites' images. *citra* because the pictures include radar and mosaics; *asli* for "actual" (never *aktual*,
  which means "current, topical").
- About as long as the English (≈ 114 characters).
- The default card's footer (`card.enterAnyPlace`) has room for less: *Pilih tempat di Bumi* (measured: the full
  *Pilih tempat mana pun di Bumi* plus the host overflows the 466 px row).

| Alternate | Why it lost |
|---|---|
| *Masukkan tempat mana pun di Bumi. …, dan foto asli yang diambilnya.* | *Masukkan* is form-filling and ignores the chips and the globe pin; *foto* overclaims for radar and mosaics. |
| *…, beserta citra asli yang direkamnya.* | Two *-nya* pointing at two things (the place, then the satellite). |
| *Cari tempat mana pun di Bumi. Lihat semua satelit yang lewat di atasnya seminggu terakhir…* | *lewat* is casual; *seminggu* drops the exact number. |

### 3.3 Results headline

Indonesian nouns do not inflect for number, and `Intl.PluralRules('id')` has one category, `other`. Every row uses the
same noun form; zero is its own sentence.

| Case | English | Indonesian | Emphasis |
|---|---|---|---|
| N ≥ 1, live window | In the last 7 days, **256 satellites watched** *Waterloo*. | *Dalam 7 hari terakhir, **256 satelit mengawasi** \*Waterloo\*.* | bold *256 satelit mengawasi* (number mono); serif the place |
| N = 1 | … **1 satellite watched** … | *Dalam 7 hari terakhir, **1 satelit mengawasi** \*Waterloo\*.* | same |
| Other window length | In the last 5 days, … | *Dalam 5 hari terakhir, **[NUM] satelit mengawasi** \*[PLACE]\*.* | same |
| Window that ended | Between 29 Oct and 5 Nov, … | *Antara 29 Okt dan 5 Nov, **256 satelit mengawasi** \*Waterloo\*.* | same |
| N = 0 | No satellite we track watched *Waterloo* this week. | *Tak satu pun satelit yang kami lacak mengawasi \*Waterloo\* minggu ini.* | no bold; serif the place |
| N = 0, window that ended | … that week. | *… mengawasi \*Waterloo\* minggu itu.* | same |
| A water body | … watched the *Pacific Ocean*. | *… **256 satelit mengawasi** \*Pacific Ocean\*.* | no article, ever |

Frame: `Dalam [DAYS] hari terakhir, **[NUM] satelit mengawasi** *[PLACE]*.`

| Alternate | Why it lost |
|---|---|
| *Dalam 7 hari terakhir, Waterloo diawasi 256 satelit.* | The sentence no longer lands on the place, and the bold phrase splits around it. |
| *256 satelit mengawasi Waterloo dalam 7 hari terakhir.* | Ends on the time frame. Used only on the card, whose layout puts "this week" after the place. |
| *Tidak ada satelit lacakan kami yang mengawasi…* (zero) | *lacakan kami* is a clumsy noun; *Tak satu pun* says it with weight and one *yang*. |
| *Tak satu pun satelit terlacak mengawasi…* (zero, shorter) | Drops "we": the honest limit is *our* catalog. The zero card's lead is set at 54 px instead of 62 px; accepted. |

### 3.4 The second line (images made public)

| k | English | Indonesian |
|---|---|---|
| 0, live window | No images were made public this week. | *Tidak ada citra yang dipublikasikan minggu ini.* |
| 0, window that ended | … that week. | *Tidak ada citra yang dipublikasikan minggu itu.* |
| 0, card | No images were made public. | *Tidak ada citra yang dipublikasikan.* |
| 1 | 1 image was made public. | ***1 citra dipublikasikan.*** |
| 31 | 31 images were made public. | ***31 citra dipublikasikan.*** |
| 1,715 | 1,715 images were made public. | ***1.715 citra dipublikasikan.*** |
| partial (k ≥ 1) | At least 31 images were made public. | ***Setidaknya 31 citra dipublikasikan.*** |
| archives down | The image archives didn’t answer, so we can’t count the public images right now. | *Arsip citra tidak merespons, jadi saat ini kami tidak bisa menghitung citra publik.* |
| archives down, card | The image archives didn’t answer. | *Arsip citra tidak merespons.* |

The whole sentence takes the line's weight; the number is a mono span. *Setidaknya* sits outside the number span, so
the number settles in place without the words moving. One count, always *citra* (owner: photos, mosaics, radar and
geostationary frames alike).

| Alternate | Why it lost |
|---|---|
| *31 citra dirilis ke publik.* | *dirilis* is a loan and longer; *ke publik* is padding. |
| *Ada 31 citra yang dipublikasikan.* | Pushes the number off the front. |
| *Minimal 31 citra…* / *Paling sedikit 31 citra…* | Shop talk / long. *Setidaknya* is the neutral standard. |

### 3.5 Pass sentences

**English:** Sentinel-2C crossed 786 km overhead at 16:14:21 UTC, moving south at 7.46 km/s. It was looking straight
down. Cloud cover across the scene: 25%.

**Indonesian:** *Sentinel-2C melintas tepat di atasmu pukul 16:14:21 UTC pada ketinggian 786 km, bergerak ke selatan
dengan kecepatan 7,46 km/s. Kameranya menghadap lurus ke bawah. Tutupan awan di seluruh citra: 25%.*

The order is always: what crossed, when, how high, where from you, how it moved. The time comes before the altitude
so the two mono spans never touch. `[DIR8]mu` means the compass word with *-mu* joined (*baratmu*, *barat dayamu*).

| Verdict / case | Frame |
|---|---|
| imaged, overhead (< 15 km) | `[SAT] melintas tepat di atasmu pukul [TIME] pada ketinggian [ALT], bergerak ke [DIR8] dengan kecepatan [SPEED].` |
| imaged, offset | `[SAT] melintas pukul [TIME] pada ketinggian [ALT], [DIST] di sebelah [DIR8]mu, bergerak ke [DIR8] dengan kecepatan [SPEED].` |
| nadir | `Kameranya menghadap lurus ke bawah.` |
| off-nadir | `Kameranya miring [DEG] dari arah lurus ke bawah.` |
| cloud | `Tutupan awan di seluruh citra: [PCT].` |
| imaged, daily mosaic (2nd) | `Sensor [SENSOR]-nya merekam [PLACE] untuk mosaik harian warna asli NASA, pada [GSD] per piksel.` |
| imaged, radar (2nd) | `Radarnya, yang menghadap [DEG] ke samping, merekam [PLACE] pada [GSD] per piksel.` + dark: `…per piksel, dalam gelap.` |
| imaged, geostationary | `[SAT] tidak melintas. Satelit ini berada [ALT] di atas khatulistiwa pada [LON] dan memindai seluruh sisi Bumi yang menghadapnya setiap [N] menit.` (no seat: drop *pada [LON]*; no cadence: end at *menghadapnya.*) |
| geostationary, line | `Garis pindaian ini mencapai [PLACE] sekitar pukul [TIME], bergerak ke [DIR8].` |
| geostationary, infrared | `Saat itu di sini gelap, jadi ini citra inframerah: puncak awan menurut suhunya, makin dingin makin terang.` |
| likely, overhead | `[SAT] melintas tepat di atasmu pukul [TIME] pada ketinggian [ALT], dan titikmu berada di dalam sapuannya yang selebar [SWATH].` |
| likely, offset | `[SAT] melintas pukul [TIME] pada ketinggian [ALT], [DIST] di sebelah [DIR8]mu, dan titikmu berada di dalam sapuannya yang selebar [SWATH].` (no swath known: end after the place clause with a full stop) |
| could, overhead | `[SAT] melintas dalam jangkauan pukul [TIME], tepat di atasmu.` |
| could, offset | `[SAT] melintas dalam jangkauan pukul [TIME], [DIST] di sebelah [DIR8]mu.` |
| overhead | `[SAT] melintas pukul [TIME] pada ketinggian [ALT], [ELEV] di atas cakrawalamu di sebelah [DIR8].` · ≥ 80°: `…, [ELEV] di atas cakrawalamu, hampir tepat di atasmu.` |

Second sentences:

| English | Indonesian |
|---|---|
| It was daylight, so it would have recorded this spot. The archive could not be searched just now. | *Saat itu siang, jadi titik ini seharusnya terekam. Arsipnya tidak bisa ditelusuri saat ini.* |
| No scene exists for this pass. Sentinel-2 records only land and coastal water, and may not have scheduled this spot. | *Tidak ada citra dari lintasan ini. Sentinel-2 hanya merekam daratan dan perairan pesisir, dan mungkin tidak menjadwalkan titik ini.* |
| It was daylight, so it almost certainly recorded this spot. No scene from this pass has been published yet; archives can lag by a day or more. | *Saat itu siang, jadi titik ini hampir pasti terekam. Belum ada citra dari lintasan ini yang dipublikasikan; arsip bisa terlambat sehari atau lebih.* |
| It was dark here. Weather imagers keep scanning at night in infrared, so it saw your clouds, not your streets. | *Saat itu di sini gelap. Satelit cuaca terus memindai dengan inframerah pada malam hari, jadi yang terekam awanmu, bukan jalananmu.* |
| NASA’s daily mosaic for this pass could not be confirmed at your spot. | *Mosaik harian NASA untuk lintasan ini belum bisa dipastikan di titikmu.* |
| Its images feed weather forecasts; they are not published as pictures we can show. | *Citranya dipakai untuk prakiraan cuaca; citra itu tidak dipublikasikan sebagai gambar yang bisa kami tampilkan.* |
| Waterloo was inside its 290 km swath. Its operator does not publish where it imaged, so we can’t know whether it did. | *Sapuannya yang selebar 290 km mencakup Waterloo. Operatornya tidak memublikasikan tempat yang direkamnya, jadi kami tidak bisa tahu apakah itu terjadi.* |
| Radar sees through cloud and darkness. Pointing 12.3° to the side, it could have mapped Waterloo. We found no published image of it from this pass. | *Radar bisa menembus awan dan gelap. Dengan radar miring 12,3° ke samping, satelit ini bisa saja memetakan Waterloo. Kami tidak menemukan citra yang dipublikasikan dari lintasan ini.* |
| … We can’t know whether it did. (private radar) | *… Kami tidak bisa tahu apakah itu terjadi.* |
| Looking straight down, it could have watched Waterloo. We can’t know whether it did. | *Dengan kamera menghadap lurus ke bawah, satelit ini bisa saja mengawasi Waterloo. Kami tidak bisa tahu apakah itu terjadi.* |
| Pointing 12.3° off straight down, it could have watched Waterloo. … | *Dengan kamera miring 12,3° dari arah lurus ke bawah, satelit ini bisa saja mengawasi Waterloo. …* |
| It was dark where you are. If the station was still in sunlight, it crossed your sky as a bright, steady point. | *Saat itu di tempatmu gelap. Jika masih terkena sinar matahari, stasiun itu melintasi langitmu sebagai titik terang yang tak berkedip.* |

- *tepat di atasmu* is "overhead"; the *-mu* closes the phrase, so *tepat* cannot be misread as "sharp" attached to
  the time (*tepat pukul 16:00* is "at 16:00 sharp").
- *Kameranya* ("its camera") replaces English "It".
- The place in a frame is the raw label (no article, §5.1). A sentence never starts with it: "Waterloo was inside…"
  becomes *Sapuannya … mencakup Waterloo.*

| Alternate | Why it lost |
|---|---|
| *… pada ketinggian 786 km pukul 16:14:21 UTC …* | Two mono spans with one word between. |
| *… 786 km, 61 km di sebelah barat, pukul …* | Three stacked adverbials, and "west of what?". *di sebelah baratmu* answers it. |
| *Pukul 16:14:21 UTC, Sentinel-2C melintas 786 km di atas kepalamu…* | Breaks the satellite-first pattern; *di atas kepalamu* is bodily and too vivid. |
| *Sensor VIIRS-nya memindai Waterloo ke dalam mosaik…* | Calque of "swept into". |

### 3.6 Share card, share page and post

**Every card leads with the week's N** (`card.headline`); the place and its full stop are the serif block.

| Card | Lead (display) | Serif block |
|---|---|---|
| Pass card, N ≥ 1 | `[NUM] satelit mengawasi` | `*[PLACE].*` |
| Week card | `[NUM] satelit mengawasi` | `*[PLACE] minggu ini.*` |
| Week card, N = 0 | `Tak satu pun satelit yang kami lacak mengawasi` (54 px, three lines at most) | `*[PLACE] minggu ini.*` |
| Place cut short (`cut`) | as above | the place with its "…", no full stop |

**Legacy shares** (stored before N was kept; `card.headlineBy`), one per verdict:

| Verdict | Lead | Serif |
|---|---|---|
| imaged | `[SAT] mengawasi` | `*[PLACE].*` |
| likely | `[SAT] memindai` | `*[PLACE].*` |
| could | `[SAT] mungkin mengarah ke` | `*[PLACE].*` |
| overhead | `[SAT] melintas di atas` | `*[PLACE].*` |

Card words:

| Key | Indonesian |
|---|---|
| `photos` | §3.4 card forms |
| `cloud.only` | sub *Tertutup awan. Yang terlihat hanya awan.* · chip *Tertutup awan · 92%* · post *Yang terlihat hanya awan.* · desc *Yang terlihat hanya awan (92%).* |
| `cloud.mostly` | sub *Sebagian besar awan: 78% dari citra.* · chip *Sebagian besar awan · 78%* · post / desc *Yang terlihat sebagian besar awan (78%).* |
| `cloud.spot` | sub *Awan tepat di atas titik ini.* · chip *Awan di atas titik* · post / desc *Awan menutupi titik ini.* |
| `stamp` | `1 Nov 2026 · 11:21 WIB` (no weekday: in caps *MIN 1 NOV* reads "minus 1", *MINGGU 1 NOV* "week 1") |
| `weekTo` / `lastWeek` | *7 hari hingga 1 Nov 2026* / *7 hari terakhir* |
| `readout` | *Ketinggian* · *Elevasi* · *Kecepatan* · *Miring* · *Piksel* · *Piksel mosaik* · *Jarak terdekat* |
| `lane` | *Citra* · *Tercakup* · *Mungkin* · *Melintas* |
| `unit` | *km* · *m* · *km/s* |
| `geometry` | *Geometri lintasan · utara di atas* |
| `note` | *Citra bisa dibuka di aplikasi* · *Citra tidak tersedia saat ini* · *Arsip komersial, tidak publik* · *Dalam sapuan, belum ada citra publik* · *Jejak permukaan saat terdekat* |
| `acquiring` | *Merekam…* |
| `noPublicPhoto` / `noPhoto` | *Tidak ada citra publik pekan ini* / *Tidak ada citra untuk ditampilkan* |
| `look` | *Paling rinci* · *Cerah terakhir* · *Tertutup awan* · *Radar*; `lookDay` *3 Nov* |
| `aSatellite` | *Sebuah satelit* |
| `invite` | *Lihat apa yang mengawasimu* |
| `enterAnyPlace` | *Pilih tempat di Bumi* |
| `defaultPlace` | *Palm Jumeirah* |
| `defaultAlt` | *Foto satelit Sentinel-2 asli dari Palm Jumeirah, Dubai, di samping kalimat: Sesuatu mengawasi kamu minggu ini. Pilih tempat di Bumi.* |
| `page.title` / `page.description` | *Sesuatu mengawasi kamu minggu ini.* / §3.2 sub line |
| `page.placeTitle` | *Apa yang mengawasi [PLACE] minggu ini* (no full stop) |
| `page.placeDescription` | *Setiap satelit yang melintas di atas [PLACE] dalam 7 hari terakhir, beserta citra aslinya. Apa yang mengawasimu minggu ini?* |
| `page.opening` | *Membuka* + accent *Watched* |
| `crossed` | *[SAT] melintas [ALT] di atas [PLACE] pukul [CLOCK] [ZONE] pada [DAY], bergerak ke [DIR8].* · no altitude: *[SAT] melintas di atas [PLACE] …* ([DAY] = *Minggu, 1 Nov 2026*; each clause only when known) |
| `withinView` | *[SAT] melintas dengan [PLACE] dalam jangkauannya pukul [CLOCK] [ZONE] pada [DAY], bergerak ke [DIR8].* |
| `couldHave` | *Satelit ini bisa saja mengarah ke sini. Operatornya tidak menyebutkan apakah itu terjadi.* |
| `straightDown` / `offNadir` | *Kameranya menghadap lurus ke bawah.* / *Kameranya miring 12,3° dari arah lurus ke bawah.* |
| `cloudCover` / `inSwath` | *Tutupan awan: 25%.* / *Sapuannya mencakup [PLACE].* |
| `bestFrom` | *Citra paling rinci berasal dari [SAT].* · *Citra cerah terakhir berasal dari [SAT].* · *Citra pertama berasal dari [SAT].* |
| `question` | *Apa yang mengawasimu minggu ini?* |
| `cardAlt` | *Kartu Watched, dengan citra paling rinci minggu ini, dari [SAT].* / *Kartu Watched.* |

**Post** (`share.post`; X counts 280; the code drops the hook first, then trims the lead). `[DAY]` is the full
weekday with a short month: *Minggu, 1 Nov*.

| Kind | Indonesian |
|---|---|
| imaged | *[SAT] mengawasi [PLACE] dari ketinggian [ALT] pada [DAY] pukul [CLOCK] waktu setempat. [PIXEL] per piksel; ini citra aslinya.* (no pixel: *… waktu setempat. Ini citra aslinya.*) |
| clouded | *[SAT] mengawasi [PLACE] dari ketinggian [ALT] pada [DAY] pukul [CLOCK] waktu setempat. [CLOUD]* |
| likely | *[SAT] memindai [PLACE] dari ketinggian [ALT] pada [DAY] pukul [CLOCK] waktu setempat. Sapuan kameranya mencakup titik ini.* |
| could | *[SAT] melintas dengan [PLACE] dalam jangkauannya pada [DAY] pukul [CLOCK] waktu setempat. Satelit ini bisa saja mengarah ke sini. Operatornya tidak menyebutkan apakah itu terjadi.* |
| overhead | *[SAT] melintas [ALT] di atas [PLACE] pada [DAY] pukul [CLOCK] waktu setempat.* |
| week | *31 satelit mengawasi Waterloo minggu ini. 12 citra dipublikasikan.* |
| hooks | *Sesuatu mengawasi kamu juga minggu ini.* · *Apa yang melintas di atasmu minggu ini?* |
| credit | *via @armaangupt0* |
| file names | `watched-sentinel-2c-waterloo-2026-11-01.png` · `watched-waterloo-pekan-2026-11-01.png` · video fallback word `tempat` |

**Share sheet:** *Bagikan lintasan ini* · *Bagikan citra ini* · *Bagikan ringkasan pekan ini* (never *Bagikan minggu
ini*: "share it this week") · *Tutup* · *Tutup (Esc)* · *Bagikan gambar* · *Menyiapkan gambar…* · *Bagikan* · *Salin
tautan* · *Disalin* · *Unggah ke X* · *Salin gambar* · *Simpan PNG* · *Coba lagi* · link label *Tautan* · post label
*Teks* (the column is 48 px: *Unggahan* does not fit and reads "upload") · *Tautan langsung: tautan pendek belum bisa
dibuat saat ini* · *Membuat tautan…* · *Dibuat saat kamu berbagi* · *Kartu tidak bisa dibuat di sini; tautannya tetap
berfungsi.*

### 3.7 The four verdicts (one vocabulary, `VERDICT_META`)

The ladder reads image > covered > maybe > passed, in titles and lanes alike.

| Verdict | Title | Lane (mono caps, ≤ 8) | Count unit | Definition | Prose verb | Card lead (legacy) |
|---|---|---|---|---|---|---|
| imaged | **Diawasi** | `CITRA` | lintasan | *Citra asli tempat ini tersimpan di arsip publik.* | **mengawasi** | *mengawasi* |
| likely | **Kemungkinan besar diawasi** | `TERCAKUP` | lintasan | *Sapuan kamera yang arahnya tetap mencakup tempat ini. Tidak ada citra tempat ini yang dipublikasikan.* | **memindai** | *memindai* |
| could | **Mungkin mengarah ke sini** | `MUNGKIN` | lintasan | *Kamera yang bisa diarahkan atau milik swasta berada dalam jangkauan. Operatornya tidak menyebutkan apakah kamera itu melihat ke sini.* | **melintas dalam jangkauan** | *mungkin mengarah ke* |
| overhead | **Melintas di atas** | `MELINTAS` | lintasan | *Melintasi langitmu. Stasiun antariksa dan semua yang lain.* | **melintas di atas** | *melintas di atas* |

- **Count unit:** *1 lintasan*, *31 lintasan*, tile `31 LINTASAN`. Never *lintasan-lintasan*.
- **Lanes** must be 8 characters or fewer (the Timeline's 124 px lane column leaves about 58 px at 9.5 px mono;
  measured, `TERCAKUP` and `MELINTAS` are 55 px, the same as English `OVERHEAD`). The tooltip carries the definition.
- *Kemungkinan besar* (most likely) sits clearly above *mungkin* (maybe). The title is 25 characters and the results
  tile holds about 23 at 1280 × 800 (English *COULD HAVE POINTED HERE* fills it), so it wraps to two lines there
  (*KEMUNGKINAN / BESAR DIAWASI*). Accepted: every shorter form loses something (*Kemungkinan diawasi* and *Sangat
  mungkin diawasi* share the could verdict's root, *Hampir pasti* overclaims, *Tampaknya* is a guess, not a measure).
- The could title is written *Mungkin mengarah ke sini*: the no-break space keeps *ke sini* together where the tile
  wraps (phones), so *SINI* never stands alone on a line.
- **Prose keeps *bisa saja*** for "could have" (*Satelit ini bisa saja mengawasi Waterloo.*); *mungkin* is the verdict's
  name, and About quotes it as *“mungkin mengarah ke sini”*.
- **About's second sentences** (`about.verdictMore`): imaged *Jika kami menampilkannya, itulah citra aslinya.* · likely
  *Citranya belum dipublikasikan, atau dibuang karena tertutup awan.* · could *Tidak ada cara untuk tahu apakah kamera
  itu benar-benar melihat ke sini.* · overhead empty.
- **Lowercased titles in running text** (the Timeline's aria summary): *31 diawasi, 12 kemungkinan besar diawasi, 4
  mungkin mengarah ke sini, 7 melintas di atas*.
- **Pass row verbs** (aria): *Sentinel-2C, mengawasi, Jumat, 6 November 16:14 WIB, 41 jam yang lalu, awan 25 persen,
  tertutup awan*.

| Rejected | Why |
|---|---|
| imaged *Terekam* / *Teramati* | A second verb for the product's one word. *Diawasi* keeps "watched" identical everywhere. |
| likely *Kemungkinan diawasi* / lane `MUNGKIN` | Shares its root with the could verdict's *mungkin*: the ladder blurs. |
| likely *Hampir pasti diawasi* | Overclaims (no picture proves it). |
| could *Bisa saja mengarah ke sini* / lane `BISA` | `BISA` alone is a bare modal ("CAN"), in caps also *bisa* "venom", and cannot be ranked against the likely lane. |
| imaged lane `FOTO` | The lane holds radar images, mosaics and geostationary frames: not photographs. |
| likely verb *menyapu* | *badai menyapu kota*, *menyapu bersih*: destructive and military echoes; over Gaza or Ukraine, unacceptable. |
| overhead *Lewat di atas* | Casual. |

### 3.8 Reference lines (translators copy these patterns)

**Landing**

| English | Indonesian |
|---|---|
| Last 7 days · 1 → 8 NOV 2026 UTC | `7 hari terakhir · 1 → 8 Nov 2026 UTC` |
| Search a place / Place / Searching / Search unavailable | *Cari tempat* / *Tempat* / *Mencari* / *Pencarian tidak tersedia* |
| 6 matches / No match / Name, address or lat, lon | *6 hasil* / *Tidak ada hasil* / *Nama, alamat, atau lintang, bujur* |
| The place search isn’t answering. Coordinates such as 43.47, −80.54 still work. | *Pencarian tempat tidak merespons. Koordinat seperti 43.47, −80.54 tetap bisa dipakai.* (keep the example as written: the field parses it) |
| Nothing matches “x”. Try a city, a landmark, or coordinates. | *Tidak ada yang cocok dengan “x”. Coba kota, tempat terkenal, atau koordinat.* |
| Use my location / Locate me / Near me / Locating… | *Lokasi saat ini* / *Lokasiku* / *Di dekatku* / *Mencari lokasi…* |
| Cancel / Cancel locating / Requesting position / Naming the place / 04 S | *Batal* / *Batalkan pencarian lokasi* / *Meminta posisi* / *Menamai tempat* / `04 DTK` |
| Your position goes to the Photon geocoder to name the place. We store only a ~10 km cell. | *Posisimu dikirim ke geocoder Photon untuk menamai tempat itu. Kami hanya menyimpan area selebar sekitar 10 km.* |
| Location access is blocked. Allow it in your browser settings, or search for a place. | *Akses lokasi diblokir. Izinkan di pengaturan browser, atau cari tempat.* |
| Your position isn’t available right now. Search for a place instead. | *Posisimu tidak tersedia saat ini. Cari tempat saja.* |
| Or try / Or click the globe to drop a pin / Drop a pin | *Atau coba* / *Atau klik bola dunia untuk menaruh pin* / *Taruh pin* |
| Surprise me / Surprise me: a famous place picked at random | *Pilih acak* / *Pilih acak: satu tempat terkenal, dipilihkan untukmu* (never *acak* twice) |
| Built by @armaangupt0 | *Dibuat oleh @armaangupt0* |
| Open source / Open source: the code on GitHub | *Sumber terbuka* / *Sumber terbuka: kodenya di GitHub* |

**Results, notes and faults**

| English | Indonesian |
|---|---|
| The sun never rose, so no daylight camera could see it. | *Matahari tidak pernah terbit, jadi tidak ada kamera biasa yang bisa melihat tempat ini.* (barely rose: *nyaris tidak terbit*) |
| Weather satellites still swept it in infrared, 42 times. | *Satelit cuaca tetap memindai tempat ini dengan inframerah, 42 kali.* |
| Radar doesn’t need light. Umbra, Capella and 7 other radar satellites passed within range 1,204 times. | *Radar tidak butuh cahaya. Umbra, Capella, dan 7 satelit radar lainnya melintas dalam jangkauan 1.204 kali.* |
| (zero reason) Sentinel-2 or Landsat crossed it 3 times in daylight, but no scene has been published yet | *Sentinel-2 atau Landsat melintasinya 3 kali pada siang hari, tetapi belum ada citra yang dipublikasikan* (once: *1 kali*) |
| (zero reason) no open imaging satellite crossed it in daylight | *tidak ada satelit pencitraan terbuka yang melintasinya pada siang hari* |
| No satellite we track crossed this place in the window. That is rare; the notes above say if a data source was down. | *Tak satu pun satelit yang kami lacak melintasi tempat ini dalam rentang waktu ini. Itu jarang terjadi; catatan di atas menyebutkan jika ada sumber data yang mati.* |
| The Sentinel-2 and Landsat archives were too slow to answer; passes are shown from orbital geometry only. | *Arsip Sentinel-2 dan Landsat terlalu lambat merespons; lintasan ditampilkan dari geometri orbit saja.* |
| Orbital elements are 3 days old, so pass times may be off by a few minutes. | *Elemen orbit sudah berumur 3 hari, jadi waktu lintasan bisa meleset beberapa menit.* |
| Could not load the orbit catalog. Check your connection and try again. | *Katalog orbit tidak bisa dimuat. Periksa koneksimu, lalu coba lagi.* |
| Something went wrong computing passes for this place. Try again in a moment. | *Ada yang salah saat menghitung lintasan untuk tempat ini. Coba lagi sebentar lagi.* |
| Something went wrong. (the fallback, nothing more is known) | *Ada yang salah.* |
| Fault / Try again / Trying… / Back | `GANGGUAN` / *Coba lagi* / *Mencoba…* / *Kembali* |
| Slow connection, still loading / Loading Watched | *Koneksi lambat, masih memuat* / *Memuat Watched* |
| Loading orbital elements / Report ready | *Memuat elemen orbit* / *Laporan siap* |
| LOADING ORBITAL CATALOG · CATALOG · 16,893 OBJECTS | `MEMUAT KATALOG ORBIT` · `KATALOG · 16.893 OBJEK` |
| PROPAGATING 9,120 ORBITS · 7 DAYS / PROPAGATING ORBITS · 3,000 / 9,120 | `MENGHITUNG 9.120 ORBIT · 7 HARI` / `MENGHITUNG ORBIT · 3.000 / 9.120` (never *propagasi*) |
| SEARCHING SENTINEL-2 + LANDSAT ARCHIVES | `MENELUSURI ARSIP SENTINEL-2 + LANDSAT` |
| MATCHING 12 SCENES TO 31 PASSES | `MENCOCOKKAN 12 CITRA DENGAN 31 LINTASAN` |
| VERIFYING NASA WEATHER MOSAICS · 3 / 12 | `MEMERIKSA MOSAIK CUACA NASA · 3 / 12` |
| 31 PASSES · 12 IMAGES | `31 LINTASAN · 12 CITRA` |

**Pass detail**

| English | Indonesian |
|---|---|
| WorldView Legion 4 passed within view at 10:52 EST. It could have watched Waterloo. We can’t know whether it did. | *WorldView Legion 4 melintas dalam jangkauan pukul 10:52 EST. Satelit ini bisa saja mengawasi Waterloo. Kami tidak bisa tahu apakah itu terjadi.* |
| Meteosat-12 doesn’t pass. It sits 35,778 km above the equator at 0.2°W and scans the whole face of the Earth below it every 10 minutes. This scan’s line reached Paris at about 07:49 CET, moving north. | *Meteosat-12 tidak melintas. Satelit ini berada 35.778 km di atas khatulistiwa pada 0.2°W dan memindai seluruh sisi Bumi yang menghadapnya setiap 10 menit. Garis pindaian ini mencapai Paris sekitar pukul 07:49 CET, bergerak ke utara.* |
| ISS passed 420 km up at 19:02 WIB, 64° above your horizon to the west. | *ISS melintas pukul 19:02 WIB pada ketinggian 420 km, 64° di atas cakrawalamu di sebelah barat.* |
| … 84° above your horizon, almost straight up. | *… 84° di atas cakrawalamu, hampir tepat di atasmu.* |
| Its VIIRS imager swept Waterloo into NASA’s daily true-colour mosaic at 375 m per pixel. | *Sensor VIIRS-nya merekam Waterloo untuk mosaik harian warna asli NASA, pada 375 m per piksel.* |
| Its radar, looking 32.1° to the side, imaged Waterloo at 20 m per pixel, in the dark. | *Radarnya, yang menghadap 32,1° ke samping, merekam Waterloo pada 20 m per piksel, dalam gelap.* |
| No public image: commercial archives are private. Plan view of the pass. | *Tidak ada citra publik: arsip komersial bersifat privat. Tampak atas lintasan.* |
| No published scene matches this pass yet. Sentinel-2 and Landsat scenes usually appear within a day. | *Belum ada citra yang dipublikasikan untuk lintasan ini. Citra Sentinel-2 dan Landsat biasanya muncul dalam sehari.* |
| Crewed stations carry cameras, but their photos are not published by place and time. | *Stasiun berawak membawa kamera, tetapi fotonya tidak dipublikasikan menurut tempat dan waktu.* |
| A radar image, not a photograph: Sentinel-1 sends out microwaves and records their echo, so cloud and darkness don’t stop it. … | *Citra radar, bukan foto: Sentinel-1 memancarkan gelombang mikro dan merekam pantulannya, jadi awan dan gelap tidak menghalanginya. …* |
| Reading the pixel at your spot… / Clear over your spot. / Your spot was in cloud shadow. | *Membaca piksel di titikmu…* / *Cerah di atas titikmu.* / *Titikmu berada dalam bayangan awan.* |
| Thin cirrus flagged over your spot; it may soften the picture. | *Sirus tipis terdeteksi di atas titikmu; citranya bisa sedikit buram.* |
| Download image / Downloading… / Open image to save it / View source · Planetary Computer | *Unduh citra* / *Mengunduh…* / *Buka citra untuk menyimpannya* / *Lihat sumber · Planetary Computer* |
| 01 / Geometry · 02 / Replay | `01 / GEOMETRI` · `02 / PUTAR ULANG` |

**Gallery, viewer, time-lapse**

| English | Indonesian |
|---|---|
| Photos (bar, viewer dialog) / Show photos | *Citra* / *Tampilkan citra* |
| All / Detailed / Weather / Radar | *Semua* / *Rinci* / *Cuaca* / *Radar* |
| Every photo, newest first after the closest look | *Semua citra: yang paling rinci, lalu yang terbaru* (the same order as *paling rinci, lalu terbaru*) |
| Sentinel-2 and Landsat, 10–30 m per pixel | *Sentinel-2 dan Landsat, 10–30 m per piksel* |
| 12 this week / 12 that week | *Pekan ini: 12* / *Pekan itu: 12* (a number before *pekan* reads "12 weeks") |
| Previous photo · Previous (←) / Photo 3 of 11 / All photos | *Citra sebelumnya* · *Sebelumnya (←)* / *Citra 3 dari 11* / *Semua citra* |
| Photos of this place, swipe for more | *Citra tempat ini, geser untuk melihat lainnya* |
| Closest look / Last clear look / Clouded over | *Paling rinci* / *Cerah terakhir* / *Tertutup awan* |
| This week’s passes saw mostly cloud / Here’s the last clear look | *Lintasan pekan ini sebagian besar hanya menangkap awan* / *Ini citra cerah terakhir* |
| Clouded · 25% / Clouded over · 25% / Cloud at your spot | *Berawan · 25%* / *Tertutup awan · 25%* / *Awan di titikmu* |
| Replay / Replay this pass / View / Share this pass | *Putar ulang* / *Putar ulang lintasan ini* / *Lihat* / *Bagikan lintasan ini* |
| Acquiring / No image returned / Retry | *Merekam* / *Citra tidak terkirim* / *Coba lagi* |
| Still rendering. Large scenes can take 10 s or more. | *Masih diproses. Citra besar bisa butuh 10 detik atau lebih.* |
| Line 0412 → 1024 / Awaiting pass / Awaiting scan | `BARIS 0412 → 1024` / *Menunggu lintasan* / *Menunggu pindaian* |
| N (north arrow) | `U` |
| Sentinel-2C image of Waterloo. The place is at the centre. | *Citra Sentinel-2C dari Waterloo. Tempat itu ada di tengah.* |
| 10 m / pixel · Pan-sharpened with Landsat’s 15 m band | *10 m / piksel* · *Dipertajam dengan kanal pankromatik 15 m Landsat* |
| Close the photo viewer · Close (Esc) | *Tutup penampil citra* · *Tutup (Esc)* |
| Time-lapse / Time-lapse of this place, year by year | *Time-lapse* / *Time-lapse tempat ini, dari tahun ke tahun* |
| Time-lapse of Waterloo (dialog) / Waterloo, year by year (share title) | *Time-lapse Waterloo* / *Waterloo, dari tahun ke tahun* |
| 11 clear looks · one a year / · one each autumn | *11 citra cerah · satu per tahun* / *· satu tiap musim gugur* (winter *musim dingin*, spring *musim semi*, summer *musim panas*) |
| One clear look a year · since 2015 | *Satu citra cerah per tahun · sejak 2015* |
| Listing the archive / Choosing clear looks / Developing frames | *Membaca arsip* / *Memilih citra cerah* / *Memproses bingkai* |
| Too cloudy here for a time-lapse. / No clear look since 2015 · 3 needed | *Di sini terlalu berawan untuk time-lapse.* / *Tidak ada citra cerah sejak 2015 · butuh 3* |
| No time-lapse for this place / The archive did not answer. / Planetary Computer could not be reached | *Tidak ada time-lapse untuk tempat ini* / *Arsip tidak merespons.* / *Planetary Computer tidak bisa dihubungi* |
| Each frame is the same 10 km square, taken by Sentinel-2 and toned like every photo here. Each year aims for a different season; a year with no clear look is left out. | *Setiap bingkai menampilkan persegi 10 km yang sama, diambil Sentinel-2 dan diolah warnanya seperti setiap foto di sini. Setiap tahun diusahakan dari musim yang berbeda; tahun tanpa citra cerah dilewati.* |
| Frame 3 of 11: 6 Nov 2018 | *Bingkai 3 dari 11: 6 Nov 2018* |
| Video / Rendering 42% / Video failed / Save video / Link copied | *Video* / *Memproses 42%* / *Video gagal* / *Simpan video* / *Tautan disalin* |
| This browser has no H.264 encoder: the file plays in Chrome and Firefox | *Browser ini tidak punya encoder H.264: berkasnya bisa diputar di Chrome dan Firefox* |

**HUD** (corner lines, mono caps, nowrap)

| English | Indonesian |
|---|---|
| How this works | *Cara kerja* (the corner pair on a 375 px phone stays within a few pixels of the English; *Cara kerjanya* would not) |
| SUN 16.2°S 063.0°E / Sub-solar point · GMST 18:41:50 | `MATAHARI 16.2°S 063.0°E` / *Titik subsolar · GMST 18:41:50* |
| Scene (the replay's clock) | *Saat itu* → `SAAT ITU MIN, 1 NOV 11:21:13 WIB` |
| 16,893 OBJECTS · CELESTRAK GP / — Objects / CATALOG | `16.893 OBJEK · CELESTRAK GP` / *— objek* / `KATALOG` |
| Fetched 2026-11-08 03:34Z · 4 H ago / Stale, 3 D ago | *Diambil 2026-11-08 03:34Z · 4 jam lalu* / *Usang, 3 hari lalu* |
| <1 MIN · 42 MIN · 5 H · 3 D | `<1 MNT` · `42 MNT` · `5 JAM` · `3 HARI` |
| Loading catalog / Catalog unavailable | *Memuat katalog* / *Katalog tidak tersedia* |
| Time / Orbit catalog / Sun (aria) · Watched, home | *Waktu* / *Katalog orbit* / *Matahari* · *Watched, beranda* |
| Language / Language: English. Change | *Bahasa* / *Bahasa: Bahasa Indonesia. Ubah* |

### 3.9 About page

- **Title** (two lines): *Cara* / *\*kerjanya\*.* Bar: *Tentang*. Close: *Tutup*.
- **Lede:** *Pilih satu titik di Bumi. Kami menghitung satelit mana saja yang melintas di atasnya dalam seminggu
  terakhir, lalu mencari citra yang direkamnya. Semuanya berjalan di perangkatmu, dengan data publik.*
- **Sections:** *Versi singkat* · *Cara kami mencari lintasan* · *Arti label* · *Yang tidak bisa kami lihat* ·
  *Privasi* · *Kredit* · *Papan ketik*.
- **Q&A:**
  - *Apakah ini langsung?* → *Tidak sepenuhnya. Foto masuk ke arsip beberapa jam hingga dua hari setelah diambil, jadi
    lintasan terbaru mungkin belum punya foto.*
  - *Bisakah satelit melihatku?* → *Tidak. Paling tajam, satu piksel di sini selebar 10 m. Mobil pun hanya satu piksel.
    Kamu tidak akan terlihat.*
  - *Apakah ini semua satelit?* → *Tidak. Satelit militer dan satelit mata-mata sebagian besar tidak ada di katalog
    publik, dan perusahaan tidak menyebutkan ke mana kamera mereka diarahkan.*
- **Method facts:** *Lurus ke bawah* · *Kamera yang bisa dimiringkan* (*… Jika kamu berada dalam jangkauan, kami
  menyebutnya “mungkin mengarah ke sini”.*) · *Siang hari* (*Kamera biasa butuh sinar matahari. Lintasan dalam gelap
  tidak pernah dihitung sebagai foto.*) · *Radar* · *Satelit cuaca* · *Sentuhan akhir* · *Arah atas* (*… panah U-nya
  menunjukkan arahnya dengan tepat.*).
- **Privacy** (exactly the English, no more, no less):
  - *Tempat berjalannya* → *Perhitungan orbit berjalan di browser, di perangkatmu sendiri.*
  - *Yang kami simpan* → *Kami menghitung pencarian per kota dan per area selebar sekitar 10 km, tidak pernah titik
    persismu, dan mencatat jumlah yang dibuka dan dibagikan. Tanpa alamat IP, tanpa cookie milik kami, tanpa apa pun
    yang menghubungkan satu kunjungan dengan kunjungan berikutnya.*
  - *Siapa lagi yang melihatnya* → *Sebagian besar nama tempat berasal dari daftar yang tertanam di situs ini. Pencarian
    lain dikirim ke Open-Meteo, Photon, atau Nominatim. Citra dimuat langsung dari arsip. Host kami menghitung kunjungan
    halaman dan kecepatan, tanpa cookie, dan mungkin memasang satu cookie keamanan untuk membedakan manusia dari bot.
    Kami tidak pernah membacanya.*
  - *Tautan berbagi* → *Hanya dibuat saat kamu membagikan sesuatu. Siapa pun yang punya tautannya bisa melihat nama
    tempat, titik yang dibulatkan ke sekitar 1 km, dan lintasan yang kamu pilih.*
- **Credits:** *Dibuat oleh* · *Armaan, @armaangupt0 di X*; labels *Arsip*, *Orbit*, *Nama tempat*, *Tekstur Bumi*,
  *Jenis huruf*; *Citra dari GIBS milik NASA, bagian dari EOSDIS. GOES melalui NOAA dan CIRA, Himawari melalui JMA.*
  Product, agency, licence and people's names stay as they are.
- **Keyboard:** *Cari tempat* · *Pindah di antara saran* · *Pilih* · *Telusuri lintasan* · *Citra sebelumnya /
  berikutnya* · *Perbesar citra* · *Perbesar/perkecil di penampil* · *Putar atau jeda tayangan ulang* ·
  *Kembali, atau tutup* · *Halaman ini*. Key caps: *Enter*, *Spasi*, *Esc*.
- **Foot:** *Dibuat oleh @armaangupt0* · *Dibuat dari data publik. Tidak satu pun citra ini kami rekam sendiri.*

---

## 4. Glossary

Indonesian has no grammatical gender and no plural inflection. "Notes" says what never to use.

### 4.1 Terms

| English | Indonesian | Notes |
|---|---|---|
| satellite | satelit | *1 satelit*, *256 satelit*. Never *satelit-satelit* after a number. |
| to watch (the product verb) | mengawasi | Passive *diawasi*. Never *menonton*, *melihat* (too weak), *mengamati* (reserved for "observe"), *memantau*, *mengintai*, *memata-matai*, *memotret*. |
| watched / likely watched | Diawasi / Kemungkinan besar diawasi | Lanes `CITRA`, `TERCAKUP`. |
| could have pointed here | Mungkin mengarah ke sini | Lane `MUNGKIN`. Prose "could have": *bisa saja*. Never *membidik* (aiming a weapon). |
| passed overhead | Melintas di atas | Lane `MELINTAS`. |
| pass, overflight | lintasan | Same form for 1 and 31. Never *perlintasan* (railway crossing), *lulus*, *pas*. |
| to pass, to cross | melintas (intr.), melintasi (tr.) | *melintas di atas Waterloo*; *melintasi langitmu*. |
| to sweep / to scan (likely) | memindai | Never *menyapu*, *menyisir*. |
| scan (n.) / scan line | pindaian / garis pindai | *Garis pindaian ini mencapai Paris…* |
| image | citra | Any image; every container that can hold radar, mosaics or geostationary frames (gallery, viewer, counts, lanes). |
| photo | foto | Only where the item is certainly Sentinel-2 or Landsat (About's daylight, touch-ups, clouds, delays rows; the time-lapse note). Radar is never *foto*. |
| picture | gambar | Plain prose ("pictures we can show"); the share card's PNG (*Bagikan gambar*, *Salin gambar*). |
| public image / public archive | citra publik / arsip publik | Never *arsip umum*. |
| made public / published | dipublikasikan; memublikasikan | Never *dibuat publik*, *dipublikasi*, *mempublikasikan* (KBBI: *memublikasikan*). |
| scene | citra | *Tutupan awan di seluruh citra.* Never *adegan*, *pemandangan*. |
| crop | potongan citra | |
| swath | sapuan | *sapuan selebar 290 km*; label `LEBAR SAPUAN`. |
| off-nadir | miring | Label `MIRING`; prose *miring 5,4° dari arah lurus ke bawah*; row *miring 5,4°*. Never show *off-nadir* or *nadir*. |
| straight down | lurus ke bawah | |
| ground track | jejak permukaan | Never *lintasan* (reserved for pass). |
| plan view | tampak atas lintasan | |
| orbit / orbital elements | orbit / elemen orbit | Never *propagasi* in UI. |
| altitude | ketinggian | Label `KETINGGIAN`; prose *pada ketinggian 786 km*. Not *tinggi*. |
| ground speed / speed | kecepatan darat / kecepatan | Prose *dengan kecepatan 7,46 km/s*. |
| heading | arah gerak | Label `ARAH`; unit *SBD · Turun*. |
| ascending / descending | Naik / Turun | |
| elevation (from you) | elevasi (dari tempatmu) | Label `ELEVASI DARI TEMPATMU`; sun *elevasi matahari*. |
| up (degrees above the horizon) | di atas | Unit `64° DI ATAS · BL`. |
| horizon | cakrawala | |
| almost straight up | hampir tepat di atasmu | Never *tegak lurus di atas kepala*. |
| ground distance / closest distance | jarak permukaan / jarak terdekat | |
| closest (time) | saat terdekat | `SAAT TERDEKAT · UTC`, `SAAT TERDEKAT · SETEMPAT`. |
| field of regard | rentang pandang | `RENTANG PANDANG ±45°`. |
| in swath / in view / window | dalam sapuan / dalam jangkauan / rentang waktu | |
| range | jangkauan | |
| above the equator at / in your sky | posisi di khatulistiwa / di langitmu | Labels `POSISI DI KHATULISTIWA`, `DI LANGITMU`. |
| scan direction / line speed here | arah pindai / kecepatan garis di sini | *Utara → selatan*. |
| scan line here · UTC / local | garis pindai · UTC / setempat | `GARIS PINDAI · SETEMPAT` (with *di sini* it overflows the column). |
| coverage / full disc / this scan | cakupan / cakram penuh / pindaian ini | *setiap 10 mnt*. |
| NORAD · pass / scan | NORAD · lintasan / pindaian | |
| cloud cover / cloud at spot | tutupan awan / awan di titik | |
| clear / thin cirrus / cirrus / cloud / cloud shadow | cerah / sirus tipis / sirus / awan / bayangan awan | KBBI *sirus*. Value *Bayangan*. |
| clouded / clouded over / mostly cloud | berawan / tertutup awan / sebagian besar awan | |
| spot (the exact point) | titik (*titikmu*) | Never *tempat* for the pixel; *tempat* is the searched place. |
| place | tempat | |
| pixel / resolution | piksel / resolusi | Label `PIKSEL`; *10 m per piksel*. Never *pixel*. |
| radar | radar | *citra radar*, *satelit radar*. |
| weather mosaic / daily mosaic | mosaik cuaca / mosaik harian | |
| true colour | warna asli | Never *warna sejati*. |
| geostationary | geostasioner | Lane `GEO`. |
| infrared / visible / colour (band values) | Inframerah / Tampak / Warna | Label `KANAL`. |
| time-lapse | time-lapse | Upright, hyphenated, lowercase in prose; `TIME-LAPSE` in caps. Never *timelapse*, *selang waktu*. |
| frame | bingkai | *Bingkai 3 dari 11*. |
| clear look / last clear look | citra cerah / citra cerah terakhir | Tag *Cerah terakhir*. |
| closest look | paling rinci | Tag *Paling rinci*; prose *citra paling rinci*. Never *terdekat* (nearest). |
| Detailed (filter) | Rinci | Shares the root with *Paling rinci*. |
| replay (button / noun) | putar ulang / tayangan ulang | |
| catalog | katalog | *katalog orbit*. |
| objects (HUD) | objek | Never *obyek*. |
| sub-solar point | titik subsolar | |
| fetched / stale | diambil / usang | |
| sunlight / daylight / dark | sinar matahari / siang hari / gelap | |
| day / twilight / night (readout) | siang / temaram / malam | Never *senja* (evening only) or bare *remang*. |
| the sun never / barely rose | matahari tidak pernah terbit / nyaris tidak terbit | |
| daylight camera / regular camera | kamera biasa | |
| steerable camera | kamera yang bisa diarahkan | |
| fixed camera | kamera yang arahnya tetap | Never *kamera tetap* (*tetap* also "still"), never the coinage *berarah tetap*. |
| private / commercial / operator | swasta / komersial / operator | *operator swasta*. |
| crewed / station | berawak / stasiun antariksa | |
| weather / imaging satellite | satelit cuaca / satelit pencitraan | |
| military and spy satellites | satelit militer dan satelit mata-mata | Factual, allowed. Only the reader is never *dimata-matai*. |
| equator / Earth / sun | khatulistiwa / Bumi / matahari | *Bumi* capitalised as the planet's name; *bumi* in fixed phrases (*belahan bumi utara*). |
| globe | bola dunia | |
| share / share this pass / photo / image / week | Bagikan / Bagikan lintasan ini / Bagikan citra ini / Bagikan citra ini / Bagikan ringkasan pekan ini | |
| download / download image | Unduh / Unduh citra | *Mengunduh…* |
| copy link / copied / link copied | Salin tautan / Disalin / Tautan disalin | |
| copy image / save PNG / share image | Salin gambar / Simpan PNG / Bagikan gambar | The card file is *gambar*. |
| post to X / post (label) / post (prose) | Unggah ke X / Teks / unggahan | Never *postingan*. |
| link | tautan | |
| made when you share | Dibuat saat kamu berbagi | *membagikan* needs an object. |
| use my location / locate me / near me | Lokasi saat ini / Lokasiku / Di dekatku | |
| surprise me / drop a pin / or try | Pilih acak / Taruh pin / Atau coba | Never *Kejutkan aku*. |
| how this works | Cara kerja (links) / Cara kerjanya (About title) | |
| last 7 days / this week / that week | 7 hari terakhir / minggu ini (prose), `PEKAN INI` (caps) / minggu itu, `PEKAN ITU` | |
| local time | waktu setempat | Readout `SETEMPAT`. Never *waktu lokal*. |
| at sea | di laut | *UTC−9 · di laut*. |
| ago / just now / in 3 h | … lalu / baru saja / dalam 3 jam | §6. Never CLDR's *sekarang* for "just now". |
| min / h / d / s (mono) | mnt / jam / hari / dtk | Never *h* (reads *hari*) or *j*. |
| km, m, km/s | km, m, km/s | SI symbols, never translated. Never *km/dtk*. |
| close / cancel / try again / back | Tutup / Batal / Coba lagi / Kembali | |
| previous / next | sebelumnya / berikutnya | |
| play / pause | Putar / Jeda | |
| zoom in / zoom out | Perbesar / Perkecil | Readout `2,5×`. |
| acquiring / acquired | merekam / terekam | `TEREKAM 11:21:21 WIB · 10 m`. |
| line (scan counter) | baris | `BARIS 0000 → 1024`. |
| fault | gangguan | |
| browser | browser | *peramban* is correct but unfamiliar. Never with an enclitic. |
| carousel / slide (aria) | karusel / slide | |
| an unnamed satellite | Sebuah satelit | The one sanctioned *sebuah*. |
| we / you | kami / kamu, -mu | Never *kita*, *Anda*, *kau*, *lo*. |

### 4.2 Compass

**8 points (prose, lowercase):** north *utara* · northeast *timur laut* · east *timur* · southeast *tenggara* · south
*selatan* · southwest *barat daya* · west *barat* · northwest *barat laut*. Patterns: *bergerak ke selatan*, *61 km di
sebelah baratmu*, *64° di atas cakrawalamu di sebelah barat*. *timur laut*, *barat laut*, *barat daya* are directions,
two words, never hyphenated.

**16 points (mono readouts):**

| EN | N | NNE | NE | ENE | E | ESE | SE | SSE | S | SSW | SW | WSW | W | WNW | NW | NNW |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| id | U | UTL | TL | TTL | T | TTG | TG | STG | S | SBD | BD | BBD | B | BBL | BL | UBL |

(UTL utara-timur laut, TTL timur-timur laut, TTG timur-tenggara, STG selatan-tenggara, SBD selatan-barat daya, BBD
barat-barat daya, BBL barat-barat laut, UBL utara-barat laut.) A compass readout never shows English letters:
`ARAH 194,6° SBD · TURUN`. Coordinates are different: they are notation and keep N/S/E/W (§6).

### 4.3 Indonesia's provinces

The offline place list carries GeoNames' English names (*East Java*: about 2,600 Indonesian rows; *West Java* 1,800).
These are Indonesia's official names; our own copy uses them wherever it names a province, and the display override
in the appendix (owner decision) uses this table. Apply it to sublabels and to province rows only, never to a town of
the same name: the city *Yogyakarta* stays *Yogyakarta*.

| GeoNames | id | GeoNames | id |
|---|---|---|---|
| East Java | Jawa Timur | West Kalimantan | Kalimantan Barat |
| West Java | Jawa Barat | Central Kalimantan | Kalimantan Tengah |
| Central Java | Jawa Tengah | South Kalimantan | Kalimantan Selatan |
| East Nusa Tenggara | Nusa Tenggara Timur | East Kalimantan | Kalimantan Timur |
| West Nusa Tenggara | Nusa Tenggara Barat | North Kalimantan | Kalimantan Utara |
| North Sumatra | Sumatera Utara | North Sulawesi | Sulawesi Utara |
| West Sumatra | Sumatera Barat | Central Sulawesi | Sulawesi Tengah |
| South Sumatra | Sumatera Selatan | South Sulawesi | Sulawesi Selatan |
| Riau Islands | Kepulauan Riau | Southeast Sulawesi | Sulawesi Tenggara |
| Bangka–Belitung Islands | Kepulauan Bangka Belitung | West Sulawesi | Sulawesi Barat |
| Yogyakarta (province) | DI Yogyakarta | North Maluku | Maluku Utara |
| Jakarta | Jakarta | West Papua | Papua Barat |
| Central Papua | Papua Tengah | Southwest Papua | Papua Barat Daya |
| South Papua | Papua Selatan | Highland Papua | Papua Pegunungan |

Unchanged: Aceh, Banten, Bali, Riau, Lampung, Papua, Jambi, Maluku, Bengkulu, Gorontalo. Official names write
**Sumatera**, not *Sumatra*. *Jakarta*, not *DKI* / *DKJ* (its status changed in 2024; the bare name avoids the
question). Indonesian geographic features from GeoNames (*Java*, *Borneo*, *Makassar Strait*, *Banda Sea*) stay as
the data gives them: they are data, not copy.

### 4.4 Curated places (`places` namespace)

The curated names are copy: use the established Indonesian name. A class noun (*Gunung*, *Terusan*, *Danau*) is
allowed here because the name is curated; §5.1 rule 3 still holds for runtime slots. Country names follow CLDR `id`.
Each label stays unique.

| English label (sublabel) | Indonesian label (sublabel) |
|---|---|
| Area 51 (Groom Lake, Nevada, United States) | *Area 51* (*Groom Lake, Nevada, Amerika Serikat*) |
| Central Park (New York, United States) | *Central Park* (*New York, Amerika Serikat*) |
| Pyramids of Giza; chip Giza (Giza, Egypt) | *Piramida Giza*; chip *Giza* (*Giza, Mesir*) |
| Uluru (Northern Territory, Australia) | *Uluru* (*Wilayah Utara, Australia*) |
| Palm Jumeirah / The World Islands (Dubai, United Arab Emirates) | *Palm Jumeirah* / *The World Islands* (*Dubai, Uni Emirat Arab*) |
| Grand Canyon / Meteor Crater (Arizona, United States) | *Grand Canyon* / *Kawah Meteor* (*Arizona, Amerika Serikat*) |
| Lower Manhattan / Las Vegas Strip / Golden Gate | *Lower Manhattan* / *Las Vegas Strip* / *Golden Gate* |
| Hoover Dam and Lake Mead (Nevada and Arizona, United States) | *Bendungan Hoover dan Danau Mead* (*Nevada dan Arizona, Amerika Serikat*) |
| Kennedy Space Center (Florida, United States) | *Pusat Antariksa Kennedy* (*Florida, Amerika Serikat*) |
| Washington, D.C. (The National Mall, United States) | *Washington, D.C.* (*National Mall, Amerika Serikat*) |
| Mount St. Helens (Washington, United States) | *Gunung St. Helens* (*Washington, Amerika Serikat*) |
| Niagara Falls (Ontario, Canada) | *Air Terjun Niagara* (*Ontario, Kanada*) |
| Panama Canal (Gatun Locks, Panama) | *Terusan Panama* (*Pintu Air Gatun, Panama*) |
| Rio de Janeiro (Sugarloaf and Copacabana, Brazil) | *Rio de Janeiro* (*Sugarloaf dan Copacabana, Brasil*) |
| Paris (Île-de-France, France) | *Paris* (*Île-de-France, Prancis*) |
| Venice (Veneto, Italy) | *Venesia* (*Veneto, Italia*) |
| Mount Vesuvius (Naples, Italy) / Mount Etna (Sicily, Italy) | *Gunung Vesuvius* (*Napoli, Italia*) / *Gunung Etna* (*Sisilia, Italia*) |
| Istanbul (The Bosphorus, Türkiye) | *Istanbul* (*Selat Bosporus, Turki*) |
| Chernobyl (Kyiv Oblast, Ukraine) | *Chernobyl* (*Oblast Kyiv, Ukraina*) |
| Table Mountain (Cape Town, South Africa) | *Gunung Meja* (*Cape Town, Afrika Selatan*) |
| Kilimanjaro (Kilimanjaro, Tanzania) | *Gunung Kilimanjaro* (*Kilimanjaro, Tanzania*) |
| Mount Everest (Nepal and China) | *Gunung Everest* (*Nepal dan Tiongkok*) |
| Angkor Wat (Siem Reap, Cambodia) | *Angkor Wat* (*Siem Reap, Kamboja*) |
| Singapore (Marina Bay, Singapore) | *Singapura* (*Marina Bay, Singapura*) |
| Hong Kong (Victoria Harbour, Hong Kong) | *Hong Kong* (*Pelabuhan Victoria, Hong Kong*) |
| Tokyo (Tokyo, Japan) / Mount Fuji (Shizuoka, Japan) | *Tokyo* (*Tokyo, Jepang*) / *Gunung Fuji* (*Shizuoka, Jepang*) |
| Sydney Harbour (Sydney, Australia) | *Pelabuhan Sydney* (*Sydney, Australia*) |
| Richat Structure (Sahara, Mauritania) | *Struktur Richat* (*Sahara, Mauritania*) |
| Great Blue Hole (Lighthouse Reef, Belize) | *Great Blue Hole* (*Lighthouse Reef, Belize*) |
| Bora Bora (Society Islands, French Polynesia) | *Bora Bora* (*Kepulauan Society, Polinesia Prancis*) |
| Hardy Reef (Great Barrier Reef, Australia) | *Hardy Reef* (*Karang Penghalang Besar, Australia*) |
| Malé (North Malé Atoll, Maldives) | *Malé* (*Atol Malé Utara, Maladewa*) |
| Dead Sea Salt Ponds (Southern basin, Israel and Jordan) | *Kolam Garam Laut Mati* (*Cekungan selatan, Israel dan Yordania*) |
| Bingham Canyon Mine (Utah) / Mount Whaleback Mine (Pilbara) | *Tambang Bingham Canyon* (*Utah, Amerika Serikat*) / *Tambang Mount Whaleback* (*Pilbara, Australia*) |
| Santorini (Cyclades, Greece) / Teide (Tenerife, Spain) | *Santorini* (*Kiklades, Yunani*) / *Gunung Teide* (*Tenerife, Spanyol*) |
| Kīlauea (Hawaii) / Crater Lake (Oregon) | *Kīlauea* (*Hawaii, Amerika Serikat*) / *Crater Lake* (*Oregon, Amerika Serikat*) |
| Glen Canyon Dam (Page, Arizona, United States) | *Bendungan Glen Canyon* (*Page, Arizona, Amerika Serikat*) |
| Garden City Crop Circles (Kansas, United States) | *Ladang Bundar Garden City* (*Kansas, Amerika Serikat*) |
| Almería Greenhouses (Andalusia, Spain) | *Rumah Kaca Almería* (*Andalusia, Spanyol*) |
| Gibraltar (Strait of Gibraltar) | *Gibraltar* (*Selat Gibraltar*) |
| Suez Canal (Ismailia, Egypt) / Aswan High Dam (Lake Nasser, Egypt) | *Terusan Suez* (*Ismailia, Mesir*) / *Bendungan Tinggi Aswan* (*Danau Nasser, Mesir*) |
| Wadi Rum (Aqaba, Jordan) | *Wadi Rum* (*Aqaba, Yordania*) |
| Sossusvlei (Namib Desert, Namibia) | *Sossusvlei* (*Gurun Namib, Namibia*) |
| Victoria Falls (Zambia and Zimbabwe) | *Air Terjun Victoria* (*Zambia dan Zimbabwe*) |
| Three Gorges Dam (Hubei, China) / Shanghai (The Huangpu River, China) | *Bendungan Tiga Ngarai* (*Hubei, Tiongkok*) / *Shanghai* (*Sungai Huangpu, Tiongkok*) |
| Itaipu Dam (Brazil and Paraguay) | *Bendungan Itaipu* (*Brasil dan Paraguay*) |

---

## 5. Grammar strategies for runtime slots

### 5.1 [PLACE]: inserted as-is, never inflected

Indonesian has no case, gender or article, so a gazetteer name in English or local script is grammatical wherever a
noun can stand.

1. **Prepositions are separate words:** *di [PLACE]*, *ke [PLACE]*, *dari [PLACE]*, *di atas [PLACE]*. Never attach
   anything to the slot: no *-nya*, *-lah*, *-pun*, *-mu*.
2. **No article, ever.** The English adds "the" before oceans, seas, gulfs, bays, straits and deserts (`placeInProse`,
   `placeParts`); the `id` frame takes the raw label: *mengawasi Pacific Ocean*.
3. **No class noun** (*kota*, *wilayah*, *daerah*) in front of the slot: the code cannot know what the place is.
4. **Never start a sentence with the slot.** "[PLACE] was inside its 290 km swath." → *Sapuannya yang selebar 290 km
   mencakup [PLACE].* / *Sapuannya mencakup [PLACE].*
5. **Back-reference with *tempat ini* or *titik ini*,** never with *-nya* on a verb that could point at the satellite.
6. **Prefer the slot at the end of a clause.** It also keeps right-to-left names from scrambling punctuation (the code
   isolates the slot with `<bdi>`).
7. **Sublabels** list most specific first with commas, the country from `Intl.DisplayNames('id')`: *Surabaya · Jawa
   Timur, Indonesia* (with the province table, §4.3).

### 5.2 [SAT] as subject: no gender, no agreement, no pronoun

1. Verbs agree with nothing: *Sentinel-2C melintas*, *Umbra, Capella, dan 7 satelit radar lainnya melintas*.
2. **Never refer back with *ia*, *dia*, *mereka* or *itu*.** In order: *-nya* on a noun (*Kameranya*, *Radarnya*,
   *Operatornya*, *Sapuannya*), *satelit ini*, the name again.
3. **Never attach *-nya* to the name itself** (*Sentinel-2C-nya*). After an acronym in fixed copy, *-nya* takes a
   hyphen: *VIIRS-nya*, *MODIS-nya*.
4. **A station** (ISS, Tiangong): *stasiun itu*, never *dia*.
5. **An unnamed satellite** (`aSatellite`) is *Sebuah satelit*, which fits every subject frame: *Sebuah satelit
   mengawasi Waterloo.*

### 5.3 [NUM]: one plural category

CLDR `id` cardinal and ordinal categories: **`other` only**. `f.plural(n, { other: '…' })`; if a tool demands `one`,
make it identical to `other`.

| n | Frame | Example |
|---|---|---|
| 0 | separate sentence | *Tak satu pun satelit…*, *Tidak ada citra yang dipublikasikan…*, *Tidak ada citra cerah sejak 2015* |
| 1 | `[NUM] satelit` | *1 satelit mengawasi*, *1 citra*, *1 lintasan*, *1 kali* |
| 2 … ∞ | same | *256 satelit*, *1.715 citra*, *31 lintasan*, *42 kali* |

1. **Digits always**, even for 1: *1 satelit*, not *satu satelit*; *1 kali*, not *sekali* (English "once").
2. **No reduplication after a number** (*31 citra-citra*) and **no classifier** (*256 buah satelit*).
3. **The one counter word is *kali*** (times). Measure words are units: *10 menit*, *41 jam*, *3 hari*, *11 tahun*.
4. **A count never stands right before *pekan*, *minggu*, *hari* or *tahun* unless it counts them:** *12 pekan ini*
   reads "these 12 weeks". Put the noun or a label first: *Pekan ini: 12*, *12 citra pekan ini*.
5. "At least" *setidaknya*; "about" *sekitar* (prose) or `≈` (readouts); "of" in positions *dari*: *Citra 3 dari 11*,
   *Bingkai 3 dari 11*. Ordinals (if ever): *ke-3*.

### 5.4 Lists of names

`Intl.ListFormat('id', { type: 'conjunction' })` gives the PUEBI form: *A dan B*; *A, B, dan C* (serial comma).

| Case | Indonesian |
|---|---|
| one | *Umbra melintas dalam jangkauan 12 kali.* |
| two | *Umbra dan Capella melintas dalam jangkauan 31 kali.* |
| two + others | *Umbra, Capella, dan 7 satelit radar lainnya melintas dalam jangkauan 1.204 kali.* |
| two + 1 other | *Umbra, Capella, dan 1 satelit radar lainnya…* |

"other" is *lainnya* after the noun phrase, never *lain-lain*, never *yang lain* in a count.

### 5.5 Dates and times inside sentences

- **Clocks arrive formatted, 24 h with a colon, and are placed as they come:** *pukul 16:14:21 UTC*, *pukul 10:52
  EST*, *sekitar pukul 07:49 CET*, *pukul 11:21 waktu setempat*. Not *pada pukul* (redundant), not *jam 16:14*
  (colloquial). Never rewrite a clock with periods (§6).
- **Zones arrive formatted** (*WIB*, *CET*, *EST*, *UTC+9*) and are never written or changed by a translator. Today
  the product names only Jakarta *WIB*; Pontianak shows *UTC+7*, Bali and Makassar *UTC+8*, Papua *UTC+9*, which is
  correct until the owner adds *WIB / WITA / WIT* (appendix).
- **Days** come from `formatDate` in CLDR `id`:
  - short, with its comma: *Min, 1 Nov* (pass rows, captions, the HUD's replay clock: `MIN, 1 NOV`). The comma marks
    it as a weekday; never *Min 1 Nov*.
  - post text and the share page's prose: full weekday, short month: *pada Minggu, 1 Nov pukul 11:21 waktu setempat*,
    *pada Minggu, 1 Nov 2026*.
  - spoken (aria): *Minggu, 1 November*; *Jumat, 6 November*.
  - a stamp that stands alone (the card's stamp and `weekTo`): no weekday, `1 Nov 2026 · 11:21 WIB`,
    `7 hari hingga 1 Nov 2026`.
  - timeline: weekday *Min*; compact day *Min 1* (in a run of weekdays, unambiguous).
  - day and month: *29 Okt*; time-lapse date: *22 Okt 2015*.
- **Ranges:** mono ranges keep the product's arrow, the month or year written once when both ends share it, days never
  zero-padded: `1 → 8 Nov 2026 UTC`, `29 Okt → 5 Nov 2026 UTC`, `29 Des 2026 → 5 Jan 2027 UTC`, `1 → 8 Nov`. Prose:
  *Antara 29 Okt dan 5 Nov*; *sejak 2015*; years *2015–2026* (en dash, no spaces).
- **Relative time** is written from `relativeParts`, never with Intl's short style (it prints *2 h lalu* for days,
  *h* being *hari*, and *7 j* for hours):

| Unit | Compact (`relative`: meta lines, mono) | Spoken (`relativeSpoken`: aria) | In a sentence |
|---|---|---|---|
| < 45 s | *baru saja* | *baru saja* | *baru saja* |
| minutes | *12 mnt lalu* | *12 menit yang lalu* | *12 menit lalu* |
| hours (to 48) | *5 jam lalu*, *dalam 3 jam* | *41 jam yang lalu*, *dalam 3 jam* | *41 jam lalu* |
| days | *3 hari lalu* | *3 hari yang lalu* | *3 hari lalu* |

- **Durations:** *38 dtk* · *4 mnt 12 dtk* · *1 jam 02 mnt* (mono); in a sentence *10 detik*, *4 menit*.

---

## 6. Typography and formatting

| Topic | Rule | Example |
|---|---|---|
| Quotation marks | Curly double, single inside. Never „“ or «». | “mungkin mengarah ke sini”; ‘…’ nested |
| Apostrophe | Almost never needed. Curly ’ if a name has one. | *Jumat*, not *Jum'at* |
| Ellipsis | One character U+2026, attached | *Mengunduh…*, *Membuat tautan…* |
| Dashes | No em dash (owner rule). This deliberately departs from PUEBI, which prints ranges with the *tanda pisah*: ranges use the en dash, no spaces. `→` in mono ranges. True minus `−`. The `—` that marks an unknown value is a glyph, not punctuation, and stays. Hyphen only for reduplication, *ke-*, *-nya* after acronyms, and *time-lapse*. | *2015–2026*, `1 → 8 NOV`, `−3,2°`, `KETINGGIAN —` |
| Space before punctuation | Never. One space after a colon. | *Tutupan awan: 25%.* |
| Decimal separator | Comma, for every number the app formats with `fmt('id')` | *7,46*, *5,4°*, *0,31 m*, `2,5×` |
| Grouping | Period, from 4 digits; never in a year | *1.204*, *35.778 km*, `12.847 OBJEK`, *sejak 2015* |
| Percent / degree | No space | *25%*, *5,4°*, *64°* |
| Units | SI symbols, never translated; a no-break space after the number | *786 km*, *10 m*, *7,46 km/s*. Never *km/dtk*: write the unit by hand, not with Intl's unit style. |
| Clocks | 24 h with a colon, as the app formats them, in readouts and prose alike: one notation per screen. PUEBI's period clock (*16.14*) is deliberately not used: clocks are international notation here, and in mono a period clock blurs into period-grouped counts (*16.14.21* beside *35.778 km*). | `16:14:21`, *pukul 11:21 WIB*, `T−00:42`, `2026-11-08 03:31:07 UTC`, `03:15Z` |
| Coordinates | International notation, exactly as the app writes them: period decimal, N/S/E/W letters (the form Indonesian readers know from Google Maps and GPS). Never reformatted to *LS/BT* or to a decimal comma, in readouts or prose. The search hint's example stays *43.47, −80.54* (the field parses it). | `16.2°S 063.0°E`, *pada 0.2°W* |
| Day-part words | Never after a 24 h time | *pukul 19:02*, not *pukul 7 malam* |
| Months / weekdays | CLDR `id`. Keep *Agu* (CLDR) even though print often has *Agt* or *Ags*: one source for every date. | Jan Feb Mar Apr Mei Jun Jul Agu Sep Okt Nov Des · Min Sen Sel Rab Kam Jum Sab |
| Capitalisation | Sentence case everywhere, buttons and About headings included; never PUEBI title case for headings. Days and months capitalised; *minggu* (week) lowercase; *Bumi* capitalised as the planet's name, *bumi* in fixed phrases (*belahan bumi*); *matahari*, *khatulistiwa*, compass words lowercase. | *Cara kerja*, *Versi singkat* |
| Italic | Never for loanwords (PUEBI would italicise *browser*, *time-lapse*): italic means the serif accent and nothing else. | |
| Bold | Only the results headline's count phrase. | |
| Mono caps labels | Written in sentence case in the catalog; CSS (or `toLocaleUpperCase('id')` on canvas and satori) uppercases. | `7 HARI TERAKHIR · 1 → 8 NOV 2026 UTC` · `02 / LINTASAN` · `KETINGGIAN 786 km` · `MIRING 5,4°` · `PIKSEL 10 m` · `AWAN DI TITIK · CERAH` · `ARAH 194,6° SBD · TURUN` |
| Never uppercased | The wordmark *Watched.*; *www.watched.earth*; units in prose; satellite names and place names outside mono labels. | |
| North arrow | `U` (*utara*), as on Indonesian maps | |
| Line breaks | No-break space in *7 hari*, number + unit, *pukul* + clock, *ke-* + number. In display lines never end a line on *di, ke, dari, yang, dan, atau*. No automatic hyphenation in headlines. | |
| Abbreviations | Only the sanctioned mono ones (`MNT`, `JAM`, `HARI`, `DTK`, the 16-point compass, `GEO`, `TLE`, `UTC`, `GMST`), no full stops. In prose none except units and acronyms. Never *dll.*, *dsb.*, *yg*, *dgn*, *utk*, *tdk*, *kec.*; never `~` (write *sekitar*; `±` for a range of angles, `≈` in readouts). | |
| Licence notices | Verbatim English everywhere: *Contains modified Copernicus Sentinel data 2026*, *Contains modified EUMETSAT Meteosat data 2026*, *Landsat imagery courtesy of the U.S. Geological Survey and NASA*. Other credits are translated. | |

---

## 7. Length discipline

Indonesian sentences run about **15 to 25% longer** than English (affixes outweigh the missing articles). Single-word
labels grow most (*SHARE* → *BAGIKAN*), some phrases shrink (*DOWNLOAD IMAGE* → *UNDUH CITRA*).

Strategies, in order:

1. **Drop the object when context supplies it:** *Bagikan*, not *Bagikan ini*.
2. **Use the noun, not a verb phrase, in labels:** `KETINGGIAN`, `LOKASIKU`.
3. **No *yang*, *untuk*, *sedang*, *telah*, *akan* in labels or chips.**
4. **Base-form imperatives:** *Pilih*, not *Pilihlah* or *Silakan pilih*.
5. **Use the sanctioned mono abbreviations** (§6) and nothing invented.
6. **Pick the plainer word when two are correct:** *MIRING* over *SUDUT NADIR*; *Teks* over *Teks unggahan*.
7. **If it still does not fit, the layout changes, not the word:** an icon button goes icon-only (with the full aria
   label); otherwise ask design for width. Never truncate or invent an abbreviation.

Widths below were measured with the card's own fonts (harfbuzz), so they compare like with like.

| English | Indonesian | Chars (en → id) | Notes |
|---|---|---|---|
| Something / watched *you* / this week. (card, 88 px) | 4 lines | 384 → 538 px for the middle line | The card's column is 466 px: four lines (§3.1). |
| Enter any place on Earth (card footer) | PILIH TEMPAT DI BUMI | 24 → 20 | The full sub-line wording plus the host overflows the row. |
| No satellite we track watched (zero card lead) | Tak satu pun satelit yang kami lacak mengawasi | 29 → 46 | Set at 54 px instead of 72 px, in at most three lines. Accepted. |
| HOW THIS WORKS + SUN 16.2°S 063.0°E (HUD pair) | CARA KERJA + MATAHARI 16.2°S 063.0°E | 245 → 253 px | *Cara kerjanya* would make it 276 px on a 375 px phone where the two corners nearly touch. |
| USE MY LOCATION / LOCATE ME / NEAR ME | LOKASI SAAT INI / LOKASIKU / DI DEKATKU | 15 → 15 / 9 → 8 / 7 → 10 | |
| SURPRISE ME / HOW THIS WORKS (link) | PILIH ACAK / CARA KERJA | 11 → 10 / 14 → 10 | |
| LAST 7 DAYS | 7 HARI TERAKHIR | 11 → 15 | Never *7 HR*. |
| CLOSEST LOOK / LAST CLEAR LOOK | PALING RINCI / CERAH TERAKHIR | 12 → 12 / 15 → 14 | |
| 12 THIS WEEK | PEKAN INI: 12 | 12 → 13 | §5.3 rule 4. |
| LINK / POST (48 px column) | TAUTAN / TEKS | 4 → 6 / 4 → 4 | *TAUTAN* 46 px, *UNGGAHAN* 61 px (does not fit). |
| SHARE THIS WEEK | BAGIKAN RINGKASAN PEKAN INI | 15 → 27 | One line beside the close button on a 360 px phone. |
| PHOTO / LIKELY / COULD / OVERHEAD (lanes) | CITRA / TERCAKUP / MUNGKIN / MELINTAS | ≤ 8 | 55 px at most, as English *OVERHEAD*. |
| CLOSEST · LOCAL / SCAN LINE HERE · LOCAL | SAAT TERDEKAT · SETEMPAT / GARIS PINDAI · SETEMPAT | 15 → 24 / 22 → 23 | Two-column geometry grid. |
| OFF-NADIR / PIXEL / ALTITUDE / PASSES | MIRING / PIKSEL / KETINGGIAN / LINTASAN | 9 → 6 / 5 → 6 / 8 → 10 / 6 → 8 | |
| SHARE / DOWNLOAD IMAGE / COPY LINK / POST TO X | BAGIKAN / UNDUH CITRA / SALIN TAUTAN / UNGGAH KE X | 5 → 7 / 14 → 11 / 9 → 12 / 9 → 11 | Three equal buttons on a phone: ≤ 12 each. |
| REPLAY | PUTAR ULANG | 6 → 11 | Icon-only where the slot is too narrow; aria *Putar ulang lintasan ini*. |
| Infrared (band value, ≤ ~9) / Shadow (spot value, ≤ ~7) | Inframerah / Bayangan | 8 → 10 / 6 → 8 | One over the guidance each; QA checks the 21 px cells, and the cell gives way, not the word. |
| TIME-LAPSE | TIME-LAPSE | 10 → 10 | |

---

## 8. Sensitive content

**Surveillance and privacy.** The product's subject is being watched; the copy keeps the unease in the hero and lets
the rest be facts. Never escalate: no *diintai*, *dimata-matai*, *disadap*, *dilacak* about the reader. The only thing
"tracked" is satellites (*satelit yang kami lacak*). *satelit militer dan satelit mata-mata* is the factual term and
stays (About). Privacy lines say exactly what the English says, in the plainest words: *area selebar sekitar 10 km*,
never *sel ~10 km* (a *sel* is a prison or a biology cell). Never *sepenuhnya anonim*, *100% aman*, *dijamin*.

**Country names.** They come from `Intl.DisplayNames('id')` (CLDR): *Tiongkok*, *Taiwan*, *Timor Leste*, *Ukraina*,
*Israel*, *Yordania*, *Lebanon*, *Mesir*. Translators never override them. Three CLDR long names misread for
Indonesian readers, and the owner decides before `id` is listed:

- **PS: *Wilayah Palestina* must not ship by default.** Indonesia has recognised the State of Palestine since 1988;
  Kemlu RI and the Indonesian press call it *Palestina*. *Wilayah Palestina* ("Palestinian territories") reads to an
  Indonesian as a downgrade, and is the string most likely to be screenshotted. Recommended override: *Palestina*,
  which is CLDR's own short name for PS, so the product invents nothing.
- **HK, MO:** CLDR's long *Hong Kong DAK Tiongkok* and *Makau DAK Tiongkok* are officialese; recommended: CLDR's short
  *Hong Kong*, *Makau*.

**War zones in the time-lapse (Gaza Strip, West Bank, Ukraine, Lebanon).**
- Names: *Jalur Gaza*, *Tepi Barat*, *Ukraina*, *Lebanon*; Ukrainian cities in Ukrainian transliteration: *Kyiv*,
  *Kharkiv*, *Odesa* (never *Kiev*, *Kharkov*, *Odessa*). Gazetteer names are shown as they arrive.
- Indonesian readers follow Palestine closely (Indonesia has no diplomatic relations with Israel). Our copy takes no
  side: it says what the pictures show (the year, the date, the satellite). Never add *pendudukan*, *agresi*,
  *genosida*, *teroris*, *pembebasan*, *Palestina yang diduduki*, or an Israeli designation. If a line must name why a
  season is fixed, say *wilayah perang*, not the euphemism *zona konflik*.
- Never *menyapu* or any weapon verb (*membidik*, *menembak*, *sasaran*) near these places, or anywhere. *menembus
  awan* (radar sees through cloud) is physics and allowed.

**Place-name politics relevant to Indonesian readers.**
- China is *Tiongkok* (Keppres 12/2014), people and culture *Tionghoa*. Never *Cina*. The adjective in satellite
  blurbs is *Tiongkok* too: *satelit cuaca Tiongkok*, *pemerintah Tiongkok*.
- *Timor Leste*, never *Timor Timur*. Papua: never *Irian Jaya* or *Irian Barat*; never a political qualifier on a
  Papuan place. Provinces in their official names (§4.3), *Papua Pegunungan* included.
- *Taiwan* as CLDR gives it; never *Taiwan, Tiongkok*, *Provinsi Taiwan* or *Republik Tiongkok*.
- Seas: our copy names none. A gazetteer label ("South China Sea") is shown as it is.

**Glaciers.** *gletser* (KBBI); *akhir musim pencairan es*; *belahan bumi utara / selatan*. State the date rule if
asked; never editorialise (*krisis iklim*, *mencair drastis*, *bencana*).

**Disasters.** Indonesians will search volcanoes, earthquake and flood sites (Semeru, Palu, Cianjur). The copy stays
the same factual copy: no condolence formulas (*turut berduka*), no drama, no religious phrases.

---

## 9. Pitfalls specific to Indonesian, and the reviewer checklist

### 9.1 Pitfalls

| Trap | Wrong | Right |
|---|---|---|
| "watch" as viewing | *menonton*, *melihat* | *mengawasi* |
| "pass" as exam or fit | *lulus*, *pas*, *perlintasan* | *lintasan* |
| "scene" as film or view | *adegan*, *pemandangan* | *citra* |
| "actual" | *aktual* (current, topical) | *asli* |
| "closest look" | *citra terdekat* (nearest image) | *Paling rinci* |
| "public archive" | *arsip umum* | *arsip publik* |
| *tetap* = fixed or still | *kamera tetap*, *kamera berarah tetap* | *kamera yang arahnya tetap* |
| *tepat* = directly or sharp | *tepat di atas pukul 16:14* | *tepat di atasmu pukul 16:14* |
| *di atas* = above or more than | *awan di atas 70%* | *awan lebih dari 70%* |
| Present for a past pass | *Di sini sedang gelap.* | *Saat itu di sini gelap.* |
| *minggu* (week) vs *Minggu* (Sunday) | Sentence or caps label starting *Minggu ini* / `MINGGU INI` | *… minggu ini.* mid-sentence; `PEKAN INI` in caps |
| A count before a time noun | *12 pekan ini* ("these 12 weeks") | *Pekan ini: 12* |
| Weekday alone in caps | `MIN 1 NOV 2026` ("minus 1") | `1 NOV 2026 · 11:21 WIB`; with a clock in a row `MIN, 1 NOV` |
| Intl short relative / units | *2 h lalu*, *7 j*, *km/dtk* | *2 hari lalu*, *7 jam*, *km/s* |
| *timur laut*, *barat laut*, *barat daya* | read as seas, hyphenated | compass directions, two words |
| `h` | `5 H` (reads 5 *hari*) | `5 JAM`, `3 HARI`, `42 MNT`, `DTK` |
| English compass letters in a compass readout | `ARAH 194° SSW` | `ARAH 194,6° SBD` |
| "Localising" coordinates | `16,2°LS 063,0°BT`, *0,2° BB* | `16.2°S 063.0°E`, *0.2°W* |
| Period clocks | *pukul 16.14.21* | *pukul 16:14:21* |
| *kita* for the product | *kita tidak bisa tahu* | *kami tidak bisa tahu* |
| *Anda* from translation memory | *lokasi Anda* | *lokasimu* |
| Enclitic on a loanword | *browsermu*, *browser-mu* | *di perangkatmu*, *di browser* |
| Pronouns for satellites | *Ia/Itu menghadap ke bawah* | *Kameranya menghadap ke bawah* |
| *foto* for anything that can be radar | *foto radar*, gallery *Foto*, lane `FOTO` | *citra radar*, *Citra*, `CITRA` |
| Image vs card file | *Salin citra* (the PNG card) | *Salin gambar* |
| *time-lapse* as *selang waktu* | *Terlalu berawan untuk selang waktu* ("for a time interval") | *Di sini terlalu berawan untuk time-lapse.* |
| Plural reduplication / classifiers | *31 satelit-satelit*, *256 buah satelit* | *31 satelit*, *256 satelit* |
| Filler | *adalah*, *merupakan*, *melakukan*, *sebuah*, *tersebut*, *yang mana*, *dimana* | colon, zero copula, the verb itself |
| Spelling (KBBI) | *obyek, pixel, infra merah, analisa, resiko, praktek, kwalitas, Jum'at, satelite, mempublikasikan* | *objek, piksel, inframerah, analisis, risiko, praktik, kualitas, Jumat, satelit, memublikasikan* |
| Joined and split forms (PUEBI) | *manapun, dimana (place), antar lintasan, sub solar, VIIRSnya* | *mana pun, di mana, antarlintasan, subsolar, VIIRS-nya* |
| Title case | *Cara Kerja*, *Versi Singkat* | *Cara kerja*, *Versi singkat* |
| Italic loanwords | *browser*, *time-lapse* in italics | upright |
| Generic errors | *Terjadi kesalahan. Silakan coba lagi.* | *Katalog orbit tidak bisa dimuat.* + *Coba lagi*; the bare fallback *Ada yang salah.* |
| Apologies, particles | *Maaf, …*, *Yuk*, *dong*, *ya* | nothing |
| Marketing | *Temukan*, *canggih*, *real-time*, *fitur* | the fact |
| Destructive and weapon verbs | *menyapu*, *menyisir*, *membidik* | *memindai*, *mengarah ke* |
| Decimal point outside coordinates | *7.46 km/s* | *7,46 km/s* |
| English article on places | *the Pacific Ocean* | *Pacific Ocean* |
| Translating names | *Penjaga-2C*, *Diawasi.* (wordmark), *Badan Antariksa Eropa* in UI | *Sentinel-2C*, *Watched.*, *ESA* |
| `~` shorthand | *~10 km* | *sekitar 10 km* |

### 9.2 Reviewer checklist (run over every string)

1. Is the reader *kamu / -mu* (the user's own voice *-ku*), with no *Anda*, *saya*, *kau*, *lo*, and no enclitic on a
   loanword or a slot?
2. Is "we" *kami*, never *kita*?
3. Is the product verb *mengawasi / diawasi*, and are the four verdict titles and lanes exactly as in §3.7?
4. **Can this element ever show a radar image, a mosaic or a geostationary frame? Then *citra*.** Is *foto* used only
   for certain Sentinel-2 / Landsat photos, and *gambar* for the card file?
5. Is every number a digit, with comma decimals and period grouping (coordinates excepted), one noun form for any
   count, no reduplication, no *buah*, and no count right before *pekan / minggu / hari / tahun*?
6. Units: *km*, *m*, *km/s*, *25%*, *5,4°*, mono *mnt / jam / hari / dtk*; compass from §4.2; coordinates untouched?
7. Clocks with a colon, as they arrive (*pukul 16:14 WIB*); zones untouched; dates CLDR `id` (*Min, 1 Nov* with its
   comma; full weekday in posts; no weekday in a stamp that stands alone)?
8. A past pass described with *saat itu*, never *sedang*?
9. Does [PLACE] stand bare (no article, class noun or suffix) and avoid starting a sentence? Does [SAT] avoid
   back-reference pronouns?
10. Standard grammar, no colloquial words or particles, no filler, no sentence over 20 words (a number with its unit
    and a clock with its zone count as one)?
11. Sentence case, *minggu* lowercase, *Bumi* capitalised as the planet, no italics except the serif accent, no em
    dash, no exclamation mark, no emoji, no `~`?
12. Does a label fit its slot (§7: lanes ≤ 8, the 48 px link column, three buttons ≤ 12 on a phone, the card's 466 px
    column)?
13. Does it say exactly what is on screen (resolution, counts, "watched") and no more, with hedges only where the
    English hedges?
14. Names untouched: *Watched.*, *www.watched.earth*, satellite, sensor, agency and programme names, NORAD IDs, *UTC*,
    zones, coordinates, the English licence notices?
15. Near war zones and disputed places: neutral nouns, CLDR country names (with the PS/HK/MO decision), *Kyiv*,
    *Tiongkok*, *Timor Leste*, official province names, no weapon or sweep verbs?
16. Read it aloud: a precise person speaking to one reader, not a bank, not an ad, not a translation?

---

## Appendix: engineering notes (cost and speed)

Indonesian adds no cost and no load time. Every decision above is static copy or a small table in the `id` chunk;
nothing is translated at runtime, no service is called, nothing new is stored, and an English visitor downloads
exactly what they did before.

- **No new fonts or font requests.** Indonesian is plain ASCII Latin; the curated names' *Île*, *Almería*, *Kīlauea*,
  *Malé* are already in the latin / latin-ext subsets English uses.
- **Formatting is built-in `Intl`** (numbers, plural, dates, lists, country names), verified in Node: `1.715,5`;
  `PluralRules` → `['other']` (cardinal and ordinal); short date `Min, 1 Nov`; long `Minggu, 1 November`; `formatRange`
  `1–8 Nov` (the product writes its arrow instead, §5.5); `ListFormat` `Umbra, Capella, dan 7 satelit radar lainnya`;
  long relative `12 menit yang lalu`, `41 jam yang lalu`. Traps found and avoided: short relative days `2 h lalu`, unit
  `kilometer-per-second` `7,46 km/dtk`, short hour unit `7,46 j`, `numeric: 'auto'` *sekarang*.
- **Clocks, zones and coordinates need no change**: they stay the app's international notation (`fmtLocalTime`,
  `zoneAbbr`, `fmtCoords`), so there is no per-locale clock or coordinate formatter to build or test.
- **`id` tables in the chunk:** 8 compass words and 16 abbreviations; the 28 province names that differ (≈ 0.8 kB);
  the three country overrides if approved. None is a request.
- **`id` frames take the raw place label** (they skip `placeInProse` / `placeParts`).
- **Share cards** are drawn in the sharer's language, carried as `l=id` in the link or the stored share, never
  negotiated from the viewer's `Accept-Language`: one cache entry per link, the CDN cache is not split, and no card is
  rendered twice. The root link's preview stays English (`index.html`'s og/twitter tags, `og-default.png`, its alt):
  per-language root previews would need per-language HTML or edge rewriting and would multiply renders. The default
  card drawn for an `l=id` link (an address-bar place link, a missing share) is Indonesian, with the four-line hero
  (§3.1) and *Pilih tempat di Bumi*, and `card.defaultAlt` describes that Indonesian card.
- **Proposed, owner's call (each free at runtime):**
  1. *Palestina* / *Hong Kong* / *Makau* for PS / HK / MO (CLDR's own short names): **done** (owner, 2026-11-19), in
     `shownCountryName` (`src/imagery/localPlaces.ts`), display only.
  2. `'Asia/Pontianak': 'WIB'`, `'Asia/Makassar': 'WITA'`, `'Asia/Jayapura': 'WIT'` in both `FIXED_ABBR` tables
     (`src/ui/results/lib/time.ts`, `api/_lib/cardSpec.ts`). Zone names are not translated, so this changes English
     output for those zones too (*UTC+8* → *WITA*).
  3. The §4.3 province table as an `id` display override on the offline list's sublabels and province (`r`) rows, no
     rebuild of the place files; and as offline search aliases, so *Jawa Timur* or *Sulawesi Selatan* matches the
     built-in list instead of falling through to Open-Meteo or Photon: faster for the user and lighter on the free
     geocoder quota.
- **Layout checks (QA, no cost):** the landing hero at 320 px, 1280 × 800 and an 800 px landscape tablet (where it
  wraps to four lines, §3.1); `TAUTAN` in the 48 px link column; the 21 px band and spot values (*Inframerah*, *Bayangan*); the HUD
  corner pair at 375 px and at the `wideOnly` breakpoint.
- `<html lang="id">` is set by the boot script, so screen readers use an Indonesian voice and CSS uppercasing follows
  Indonesian rules.

---

## Decisions log

The critique's 40 items: 30 accepted, 10 partly accepted, 0 rejected outright.

| # | Item | Resolution |
|---|---|---|
| 1 | Blocker: CLDR *Wilayah Palestina* | Accepted: owner decision before `id` is listed; recommended *Palestina* (CLDR's own short name), extended to HK / MO (§8, appendix). |
| 2 | *foto* where radar can appear | Accepted: *citra* for the lane, gallery, viewer, counts and filters; *foto* only for certain Sentinel-2 / Landsat items; checklist line added (§0, §3.7, §4.1, §9.2). |
| 3 | Verdict ladder contradicts itself | Accepted: *Kemungkinan besar diawasi* / `TERCAKUP`, *Mungkin mengarah ke sini* / `MUNGKIN`, lane `CITRA`; prose keeps *bisa saja* (§3.7). |
| 4 | *citra terdekat* mistranslates "closest look" | Accepted: *Paling rinci* / *Cerah terakhir*, filter *Rinci* (§4.1). |
| 5 | Present tense for past passes | Accepted: *saat itu* for a pass's conditions, *sedang* only for live states (§2.1, §3.5). |
| 6 | Two clock notations on one screen | Partly accepted: one notation, but the colon, not the period: clocks arrive formatted as international notation and a period clock blurs into period-grouped counts (§5.5, §6). |
| 7 | *km/dtk* | Accepted: *km/s* written by hand; *detik* in sentences, `DTK` in mono (§6). |
| 8 | Card stamp reads "MIN 1 NOV" | Accepted: standalone stamps drop the weekday (`1 Nov 2026 · 11:21 WIB`, *7 hari hingga 1 Nov 2026*, year kept as English has it); rows keep *Min,* with its comma; posts use the full weekday (§5.5). |
| 9 | WIB / WITA / WIT do not come out of the product | Accepted: §5.5 states today's *UTC+7/8/9*; the three `FIXED_ABBR` entries are an owner question (appendix). |
| 10 | Provinces in English | Accepted: official names table (§4.3) applied to sublabels and province rows only, not to the city *Yogyakarta*; display override and search aliases are an owner question. |
| 11 | *selang waktu* reads "time interval" | Accepted: the loan *time-lapse* throughout (§3.8, §4.1). |
| 12 | Geostationary sentence | Partly accepted: *seluruh sisi Bumi yang menghadapnya*, *berada*, *Garis pindaian ini* and the infrared line adopted; the seat stays *0.2°W* (coordinates are international notation), not *0,2° BB*. |
| 13 | Pass frames clunky, offset unanchored, likely missing | Partly accepted: time before altitude, *di sebelah [DIR8]mu*, likely and could frames, mosaic and radar wording adopted; instead of raising the 20-word cap, a number with its unit and a clock with its zone count as one word (§2.1, §3.5). |
| 14 | Privacy *sel ~10 km* | Accepted, wording tuned: *area selebar sekitar 10 km* (no *kasar* in the locate note), no `~` (§3.8, §3.9, §8). |
| 15 | HUD section translates a line that is not there | Accepted: *epok* dropped, the real HUD lines given; the sun's coordinates stay `16.2°S 063.0°E`, and the link becomes *Cara kerja* so the corner pair fits (§3.8, §7). |
| 16 | Share card described as legacy | Partly accepted: §3.6 rewritten (every card leads with N; per-verdict leads are legacy only); the shorter *satelit terlacak* zero lead rejected: it drops "we", and 54 px is acceptable. |
| 17 | Sub line: one *-nya*, two referents | Accepted: *…, beserta citra aslinya.* (§3.2). |
| 18 | "Can it see me?" | Accepted, wording tuned: *Bisakah satelit melihatku?* → *… Mobil pun hanya satu piksel. Kamu tidak akan terlihat.* (§3.9). |
| 19 | *-ku* buttons | Accepted: *Lokasi saat ini* (main), *Lokasiku*, *Di dekatku*; *-ku* kept in About's questions (§3.8). |
| 20 | *kamera siang* | Accepted: *kamera biasa*, matching About (§3.8). |
| 21 | *dalam inframerah* calque | Accepted: *dengan inframerah* (§2.2, §3.8). |
| 22 | *hampir tegak lurus di atas kepala* | Accepted: *hampir tepat di atasmu* (§3.5). |
| 23 | Verdict definitions mix *gambar* / *citra*, coined *berarah tetap* | Partly accepted: definitions and `VERDICT_MORE.imaged` adopted; `VERDICT_MORE.likely` uses *Citranya*, not *Fotonya*, since the likely verdict also covers weather satellites (§3.7). |
| 24 | Archive-down line | Accepted: *Arsip citra tidak merespons, jadi saat ini kami tidak bisa menghitung citra publik.* (§3.4). |
| 25 | *remang* | Accepted: *Siang / Temaram / Malam* (§4.1). |
| 26 | Readout labels | Accepted: *Rentang pandang*, *Saat terdekat*, *Lebar sapuan*, *Posisi di khatulistiwa*, *Di langitmu* and the rest; added *Jarak terdekat* for the card's distance and *Garis pindai · setempat* to fit the column (§4.1, §3.6). |
| 27 | Share sheet wording | Partly accepted: *Dibuat saat kamu berbagi*, the render-failed line and the image buttons adopted; the post label is *Teks*, because *Teks unggahan* cannot fit the 48 px column (§3.6, §7). |
| 28 | The guide breaks its own rules | Accepted: *tak* allowed in fixed idioms, relative times spelled out in sentences and aria (compact forms stay in mono meta lines), *Bumi* / *bumi*, the en dash's departure from PUEBI stated (§1.5, §5.5, §6). |
| 29 | Glaciers wording | Accepted: *belahan bumi utara / selatan* (§8). |
| 30 | Hero layout claim | Partly accepted: the false "steps down" claim is corrected and the ongoing reading noted (§2.1); `nowrap` rejected, because measured against the column the middle line is too wide on landscape tablets under ~1000 px, where it must wrap at its space into the card's four-line form instead of running into the globe (§3.1). |
| 31 | *satelit mata-mata* must stay | Accepted (§4.1, §8). |
| 32 | Enclitics on loanwords | Partly accepted: never *browsermu*; "your" is kept as *di perangkatmu* rather than dropped, since the privacy meaning rests on it (§1.2, §3.9). |
| 33 | Link-preview and cache policy | Partly accepted: the root preview stays English and cards follow the sharer's `l=`, one cache entry per link; but the default card drawn for an `l=id` link is Indonesian and `card.defaultAlt` is translated to describe it (appendix). |
| 34 | Curated place names | Accepted: the full `places` table (§4.4), every curated id covered. |
| 35 | About page | Accepted, with *Cara kerja* for links (§3.9). |
| 36 | Computing, results and geostationary strings | Accepted, with *dipublikasikan* instead of *terbit* for consistency (§3.8). |
| 37 | Card plate notes | Partly accepted: *Citra tidak tersedia saat ini* (not *belum*: the English does not promise it will come) and the glossary's *Jejak permukaan saat terdekat* (§3.6). |
| 38 | Spoken forms | Accepted (§3.7, §5.5). |
| 39 | Boot strings and tab title | Accepted (§3.1, §3.8). |
| 40 | *Agu* | Accepted: CLDR *Agu* kept and stated (§6). |

**Other corrections to the draft, from checking the code and fonts** (not raised by the critique):

- Coordinates stay international (`16.2°S 063.0°E`): the app formats them and never routes them through a catalog; the
  draft's *LU / LS / BT / BB* coordinate rules are removed. Compass readouts stay Indonesian.
- Clocks keep the colon in prose too (the draft's *pukul 16.14.21* is withdrawn): they arrive formatted.
- The default card's hero is four lines and its footer *Pilih tempat di Bumi* (measured overflow at 466 px).
- Intl's short relative style prints *2 h lalu* for days: relative times are written from `relativeParts`.
- *12 pekan ini* reads "12 weeks": the counter is *Pekan ini: 12*.
- The HUD's replay clock label is *Saat itu*; the north arrow is `U`; the fallback fault is *Ada yang salah.*;
  *memublikasikan* is the KBBI form; *Sebuah satelit* names an unnamed satellite.
