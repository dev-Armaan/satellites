# Watched: Turkish (tr) localisation style guide

Status: final. Every Turkish string the product shows follows this guide: the landing, the results panel, the pass view,
the gallery and photo viewer, the time-lapse, the HUD and globe, the share sheet, share cards, share posts, the share
page, fault notices, the boot screen and the About page. Where this guide says nothing, follow `docs/DESIGN.md` §7 first
and the English catalog (`src/i18n/en/*.ts`, `api/_lib/i18n/card/en.ts`) and its comments second. Where this guide and
DESIGN disagree on anything that is not language, DESIGN wins. The decisions below are rules, not suggestions.

**The voice in one line:** *Sakin, kesin, kısa. Sana söylüyor.* Calm, exact, short, and spoken to one person.

**The two Turkish rules that shape everything else:**

1. **No suffix is ever attached to a runtime value.** Place names, satellite names, numbers, clocks, dates, zone
   abbreviations and years arrive from code, and Turkish case endings follow vowel harmony and pronunciation
   (*Paris’i, Waterloo’yu, Bordeaux’yu, 16:14’te, UTC+9’da, 2016’dan*). Code cannot know how a name or a number is read,
   so every frame keeps the slot bare. Section 5 gives the tools: the passive (the place becomes the subject), invariant
   postpositions (*tarafından, üzerinden, ile, için*), the deictic *burası / burayı / buraya / burada / buradan /
   buranın*, a suffix on a fixed noun after the slot (*2015 yılından, 31 geçişle*), log stamps and datelines.
2. **Uppercase is language-specific.** *i → İ*, *ı → I*. Every Turkish label is uppercased with Turkish rules, names
   inside it included; only wholly English elements (the licence credits) are uppercased with English rules (§6.6).

**Notation.** `[PLACE]` a gazetteer place name (serif in headlines), `[SAT]` a satellite name, `[NUM]` a number set in
mono, `[TIME]` a 24-hour clock with its zone as code writes it (`16:14:21 UTC`, `10:52 EST`), `[DATE]` a date written by
the `time` namespace or `formatDate`, `[YEAR]` a year passed as a number, `[DIR]` an 8-point compass id. `*…*` marks the
serif accent, `**…**` the bold (strong) run.

---

## 0. Decisions at a glance, and what they cost

| Question | Decision |
|:--|:--|
| Address | **sen** on every surface. Never *siz*. "We" only through the verb ending (*hesaplıyoruz, saklarız, bilemeyiz*); the pronoun *biz* only for contrast (*biz çekmedik*). |
| Second person in body copy | Kept, as in English, through the possessive suffix, never the pronoun: *seçtiğin nokta, noktan* (chips), *ufkunun, tepende, gökyüzün, sokaklarını değil, bulutlarını*. |
| Product verb | *izlemek*. The place is the subject of a passive (*izlendi*); the satellite is the subject of an active verb only where the place is not inserted (*İzledi*, row labels). Never *fotoğrafladı, gözetledi, çekti* for what a satellite did to the place. |
| Hero | `Bu hafta` / `bir şey` / `*seni* izledi.` |
| Results headline | `*[PLACE]* son [N] günde **[N] uydu tarafından izlendi.**` |
| Images line | `**[K] görüntü kamuya açıldı.**` (partial: `En az [K] görüntü kamuya açıldı.`) |
| Verdict titles | *İzledi / Muhtemelen izledi / Buraya bakabilirdi / Tepeden geçti* |
| Lane labels | *GÖRÜNTÜ / MUHTEMEL / MENZİLDE / TEPEDEN* |
| Verdict verbs (row labels) | *izledi / taradı / görüş alanından geçti / tepeden geçti* (active, after the satellite's name) |
| Pass | *geçiş*; *31 geçiş*; heading *GEÇİŞLER* |
| Image / photo | *görüntü* by default (counts, gallery, viewer, cards, radar, mosaics). *fotoğraf* only for Sentinel-2 / Landsat optical pictures. |
| "Closest look" / "clear look" | *En net görüntü* (the most detailed clear photo, `photos.ts`) / *bulutsuz görüntü* |
| A satellite after a place-subject sentence | Named again: *Uydu …*, *uydunun …* (§5.2). |
| Pass paragraph's time | A log stamp first: `16:14:21 UTC. Sentinel-2C, …` (§3.4); elsewhere `saat [TIME] idi`. |
| Numbers | Decimal comma, full-stop grouping, percent sign first: *1.715 · 7,46 km/sn · %25 · 5,3°* |
| Coordinates | International, as code writes them: *41.0186°N 28.9784°E*, *Güneş 16.2°S 063.0°E*, *0.2°W boylamında*. Never retyped. |
| Compass | Prose: full Turkish forms from closed tables (*güneye doğru, buranın 61 km batısından, kuzeybatıdaydı*). Readouts: Turkish 16-point letters (*K … GGB … KKB*). |
| Dates | *1 Kas Paz · 1 Kasım Pazar · 1 Kas 2026 Paz*; ranges with the house arrow: *26 Eki → 1 Kas 2026* (on the share card, Intl's en dash, *26 Eki – 1 Kas 2026*: the card's fonts have no arrow). |
| Plurals | CLDR `one`, `other`. A noun after a numeral is always singular, the verb singular; the two forms are identical unless English says "one/once" as a word. |
| Caps | Turkish rules on the whole Turkish label, names included (*SENTİNEL-2C · MSI · 10 m*). Licence credits stay English and are uppercased with English rules. |
| Seasons (war zones, glaciers) | *her yıl kışın / ilkbaharda / yazın / sonbaharda* |

### What these decisions cost: nothing at runtime, and the Turkish first screen gets faster

The owner's constraint for this work: it must not cost more money and must stay very fast for the visitor. Everything
here is copy and frame design, plus a handful of pure string changes in code that add no request, no service, no
storage, no library and no bytes for anyone who does not read Turkish.

- **No Turkish morphology at runtime.** The frames in §5 make a suffix engine unnecessary. Do not add a vowel-harmony
  library, a pronunciation table or a server call to inflect names: they would add bundle weight and would still be
  wrong for *Bordeaux, Worcester* or *2017*.
- **No new requests.** Turkish copy asks nothing of Planetary Computer, NASA GIBS, EUMETSAT, Photon, Open-Meteo or
  Supabase. Numbers, plurals, lists and dates come from the browser's built-in `Intl` through `api/_lib/i18n`
  (`fmt('tr')`, `formatDate`, `relativeParts`). The Turkish catalog is one static chunk that only Turkish visitors load.
- **Fonts: preload two latin-ext files for `tr`, which makes the hero faster and adds no bytes.** Turkish needs *İ Ş ş
  Ğ ğ* from the `latin-ext` subsets (*ı Ç ç Ö ö Ü ü* are in the `latin` files everyone loads). The Turkish first screen
  always contains them (*bir şey*, *BENİ ŞAŞIRT*), so a Turkish visitor downloads `instrument-sans-latin-ext-standard-normal`
  (18.9 kB) and `martian-mono-latin-ext-standard-normal` (24.7 kB) anyway; today the browser only discovers them when the
  landing mounts, and *ş* swaps in mid-wipe on a slow link. Add a per-locale entry for `tr` beside the per-script one in
  the boot script's `fonts` map (`src/i18n/boot.ts`, built in `vite.config.ts`), so they preload with the latin
  subsets. English and every other locale are untouched. The serif italic latin-ext (12.4 kB) stays lazy: *seni* needs
  none.
- **Share cards need no font fetch.** The card renderer's bundled TTFs include latin-ext, so satori never falls back to
  fetching fonts for Turkish text.
- **No hyphenation dictionaries.** Turkish lines break at spaces; `hyphens: auto` stays off (§6.7).
- **Uppercasing costs nothing:** CSS `text-transform` under `<html lang="tr">` (the boot script already sets `lang`) and
  `toLocaleUpperCase('tr')` in the canvas and satori renderers, which already do this.
- **Small pure code changes this guide relies on** (each a few lines, no cost): the licence credits uppercased with
  English rules (§6.9); `PassDetail.tsx`'s cloud cell (`${f.int(pct)}%`) moved into a message (§6.3); `slug()` in
  `captures.ts` and `slugOf()` in `video.ts` folding *ı → i* before the ASCII filter, reusing `placeKey`'s `SPELLED` table
  (today *Şanlıurfa* becomes `sanl-urfa` in a saved file name); date ranges built from `formatRangeToParts` with the
  house arrow (§6.4).
- **Telemetry stays English.** A fault notice's analytics `msg` is the English sentence of the same ref (`app.ts`), so
  the admin page's error breakdown never splits by language.

---

## 1. Register and address

### 1.1 The decision: sen, everywhere the product addresses the reader

| Surface | Register | Sentence shape | Example (en → tr) |
|:--|:--|:--|:--|
| Display headlines (hero, results headline, card headline, About title, time-lapse heads) | **sen** where the reader is addressed; otherwise third person | Declarative, verb last, full stop. Only the hero (and its echo in the hook) addresses the reader. | Something watched you this week. → *Bu hafta bir şey seni izledi.* |
| Sentences and prose (second line, pass paragraphs, "why" lines, footnotes, definitions, post text, tooltips) | **sen** through possessives where English says "your"; "we" through the verb ending | Past (*-di*), past continuous (*-iyordu*) or aorist (*-ir*). Never *-mektedir*. | Cloud over your spot. → *Seçtiğin noktada bulut var.* |
| Buttons and links | **sen imperative** (bare stem), or a noun | Verb last; the object only when the icon or the field beside it does not show it. | Share → *Paylaş* · Download image → *Görüntüyü indir* · Use my location → *Konumumu kullan* |
| Readout labels (a quantity's name over a value) | No address, no verb | A noun or noun phrase of one to three words. | ALTITUDE → *İRTİFA* · CLOUD AT SPOT → *NOKTADA BULUT* |
| Other mono caps strings (chips, progress rows, status) | Follow the row of what they are: a status line, a button, a chip | | |
| Status lines | Passive present continuous while it runs, passive past when done | *-iliyor…* / *-ildi* | Creating link… → *Bağlantı oluşturuluyor…* · Copied → *Kopyalandı* |
| Placeholders and hints | sen imperative, or a noun phrase | No full stop. | Search a place → *Bir yer ara* |
| Error and fault notices | **sen** | What happened (past, or *-amıyor*), then the one action as an imperative. No apology, no *lütfen*. | Your position isn’t available right now. Search for a place instead. → *Konumuna şu an ulaşılamıyor. Bunun yerine bir yer ara.* |
| About page | **sen**, a little more conversational; *biz* allowed for contrast | FAQ questions end with *mı/mi/mu/mü* and *?*; answers short and plain. | Can it see me? / No. → *Beni görebilir mi? / Hayır.* |
| Share post (published under the sharer's name) | Third person, except the hook, which speaks to the sharer's followers as the English does | | *Bu hafta bir şey seni de izledi.* |
| Accessibility text (aria-label, alt, title) | Same as the visible surface | The visible words, plus only what layout tells a sighted reader. | Share this pass → *Bu geçişi paylaş* |

### 1.2 Why sen

- **The hero only works in sen.** *Bu hafta bir şey seni izledi.* is one person being told something unsettling. *Bu
  hafta bir şey sizi izledi.* reads as an institution's notice or a message to a group: *siz* is also the plural "you",
  and it dilutes the one word the poster exists for.
- **One voice, no mixing.** A Turkish reader notices a sen/siz switch at once. The hero fixes the register, so the whole
  product follows it.
- **Shorter.** *seç / seçin, gör / görün, arayabilirsin / arayabilirsiniz, konumun / konumunuz*: siz adds 1–3 characters
  to every verb and possessive, on buttons and chips that have none to spare.
- **It fits the product.** DESIGN rejects the SaaS and bank-notice voice. Sen is the register of Turkish apps that speak
  like a person (maps, music, messaging) and of a quiet narrator.

**Rejected:** *siz* throughout (Turkish banking, government and older enterprise software: the hero loses its chill and
its singular *you*, every verb gets longer, the voice moves from instrument to institution); impersonal passives for
instructions (*Bir yer seçilir.*: lifeless, and reads as a description); *siz* in errors and *sen* elsewhere (the mix);
*-in/-ın* imperatives on buttons (*Paylaşın*).

### 1.3 Buttons: stem, never a verbal noun

Use the bare stem: *Paylaş, İndir, Kopyala, Kapat, Oynat, Duraklat*. **Never** a *-ma/-me* verbal noun on a button or a
section title: *Paylaşma, Kaydetme, Oynatma* read first as negative imperatives ("Don't share", "Don't play"). Real nouns
are fine in headings (*Paylaşım, Gizlilik*).

### 1.4 "You", "your", "we"

| English | Turkish | Never |
|:--|:--|:--|
| you (the hero, the hooks, the CTA) | *seni* (*Bu hafta bir şey seni izledi*, *seni de*, *Seni neyin izlediğini gör*, *Bu hafta seni ne izledi?*) | *siz, sizi, kullanıcı, değerli kullanıcımız* |
| your spot (prose) | *seçtiğin nokta* (*Seçtiğin noktada bulut var.*): "the spot you picked", exactly what English means by it | *senin noktan*, *bulunduğun yer* (the searched place need not be where the reader stands) |
| your spot (mono chips) | *noktan* (*Noktanda bulut*, *Noktanda hava açık*) | |
| at spot (chips where English has no "your") | *noktada* (*Noktada bulut*) | |
| your horizon / your sky / overhead you | *ufkunun* (*ufkunun 62° üzerinde*), *gökyüzün* / *göğünde* (label), *tepende* (*neredeyse tam tependeydi*), *tependen* (*Bu hafta tependen ne geçti?*) | *senin ufkun* |
| your clouds, not your streets | *sokaklarını değil, bulutlarını* | |
| your position, your browser, your connection | possessive suffix: *konumun, tarayıcın, bağlantın* | the pronoun *senin* (redundant) |
| your place (a share recipient's own search) | *kendi yerin* (*Kendi yerini ara*) | |
| we | the verb ending: *hesaplıyoruz, saklarız, bilemeyiz*; *biz* only to contrast (*Bu fotoğrafların hiçbirini biz çekmedik.*) | *Biz olarak, ekibimiz, şirketimiz* |
| the satellites we track | *takip ettiğimiz uydular* | *izlediğimiz uydular* (*izlemek* is reserved for satellites watching places) |

Turkish drops pronouns. A sentence that starts with *Sen…* or *O…* is almost always a calque.

---

## 2. Voice

### 2.1 What "declarative, specific, quietly uncanny, second person" sounds like in Turkish

- **Declarative.** Turkish is verb-final, so the fact lands last: *…tarafından izlendi. …tam aşağıya bakıyordu.* Hedge
  only where English hedges, with one modal (*olabilir, -ebilirdi*), never a stack (*muhtemelen … olabilir … gibi
  görünüyor*).
- **Specific.** A number and its noun beat any adjective: *256 uydu*, not *birçok uydu*. *Birkaç* only where English
  says "a few".
- **Quietly uncanny.** The watcher stays unnamed: *bir şey*, never *biri* (a person, a spy). No exclamation marks, no
  rhetorical questions outside the hooks and the share page, no intensifiers (*tam* only literally: *tam tepeden, tam
  aşağıya*). The chill comes from a plain statement of an odd fact: *sokaklarını değil, bulutlarını gördü.*
- **Second person, quietly.** The hero's *seni* is the event. Body copy keeps the English "your" as a two-letter
  possessive (*seçtiğin nokta, ufkunun, tepende*), never as a pronoun.
- **The slot before the verb is the focus.** Put the word that matters there: *bir şey **seni** izledi* (it was you),
  *256 uydu tarafından **izlendi*** (it was watched).

### 2.2 Rhythm

- Sentences of 6–14 words. Turkish words are long; a 20-word Turkish sentence is a paragraph.
- One idea per sentence. Split where English chains with commas.
- **Prefer a full stop where the second clause stands alone.** A semicolon in every frame reads academic; use it only
  between two short clauses that share a subject (*…tam tepeden geçti; 7,46 km/sn hızla güneye doğru ilerliyordu.*).
- Past continuous (*bakıyordu, ilerliyordu*) for what the satellite was doing at the instant; simple past (*geçti,
  izlendi*) for the event; aorist (*tarar, durur*) for what a geostationary satellite always does; *-miş olmalı* for an
  inference (*geçmiş olmalı*).
- Verbs over noun + *yapmak/etmek*: *taradı*, not *tarama yaptı*; *görüntüledi*, not *görüntüleme gerçekleştirdi*;
  *renkleri ayarlandı*, not *renk ayarı yapıldı*.

### 2.3 Avoid

| Avoid | Why | Instead |
|:--|:--|:--|
| *-mektedir, -maktadır* | Bureaucratic present, press-release voice. | *geçiyor, var* |
| *-dır/-dir* on plain facts (*Piksel 10 m’dir.*, *…kendisidir.*) | Lecturing; also a suffix on a value. | *Pikseli 10 m.*, *…ta kendisi.* |
| *sahip olmak* for "has" | Calque. | *çözünürlüğü 10 m*, *piksel başına 10 m* |
| *bir* for every "a/an" | Calque; Turkish leaves indefinites bare. | *Radar ışık gerektirmez.* |
| *gerçekleştirmek, sağlamak, olarak* chains | Filler. | A plain verb. |
| *ki* clauses (*Biliyoruz ki…*) | Calque of "that". | Reorder. |
| *Lütfen, Üzgünüz, Maalesef* | Service voice. | The fact and the action. |
| *Keşfet!, Hemen dene, Muhteşem, İnanılmaz* | Marketing. | Nothing. |
| *tarafından* in prose | Officialese outside its job. | Only in headline, share-headline and post frames, at most once a sentence. |
| *Bir şeyler ters gitti* | Chatty, and it echoes the hero's *bir şey*. | *Bir sorun oluştu.* |
| A bare possessive right after a place-subject sentence (*…izlendi. Kamerasının…*) | It attaches to the place (§5.2). | *Uydunun kamerası…* |
| *açık* alone for "public" | It also reads "clear" and "open". | *kamuya açık* |

### 2.4 Before and after

| English | Literal (wrong) | House Turkish | What changed |
|:--|:--|:--|:--|
| In the last 7 days, 256 satellites watched Waterloo. | Son 7 günde, 256 uydu Waterloo’yu izledi. | *Waterloo* son 7 günde **256 uydu tarafından izlendi.** | The literal needs a computed suffix (*’yu*) and copies the comma. The passive makes the place a bare subject. |
| It was looking straight down. | O düz aşağı bakıyordu. | Tam aşağıya bakıyordu. | *O* is a calqued pronoun; *düz* means flat. |
| Its operator doesn’t say whether it looked. | Operatörü baktığını veya bakmadığını söylemez. | Operatörü bakıp bakmadığını söylemiyor. | *-ip -mediğini* is the natural "whether"; present continuous, not a general aorist. |
| Sentinel-2C watched Waterloo from 795 km up. It saw only cloud. | …izlendi. Yalnızca bulut gördü. | …izlendi. Görüntüde yalnızca bulut var. | After a place-subject sentence, *gördü* would say Waterloo saw the cloud. |
| Location access is blocked. Allow it in your browser settings, or search for a place. | Konum erişimi engellenmiştir. Lütfen tarayıcı ayarlarınızdan izin veriniz veya bir yer arayınız. | Konum erişimi engellendi. Tarayıcı ayarlarından izin verebilir ya da bir yer arayabilirsin. | No *-miştir*, no *lütfen*, no siz, the two options as *-abilirsin*. |
| Photos land in the archives a few hours to a couple of days after they’re taken. | …arşivlere iniş yapar. | Fotoğraflar, çekildikten birkaç saat ile iki gün sonra arşive düşer. | *iniş yapmak* is the aircraft calque; *arşive düşmek* is the idiom. |

---

## 3. The key lines

### 3.1 Hero (poster: three lines, one accent)

```
Bu hafta
bir şey
*seni* izledi.
```

- Catalog: `hero: [['Bu hafta'], ['bir şey'], [accent('seni'), ' izledi.']]`; the card's `hero` is the same.
- Accent: ***seni*** only, Instrument Serif italic, signal orange. Not *seni izledi*, not the full stop.
- Sentence case: only *Bu* capitalised. One full stop. No comma.
- Tab title (`documentTitle`, `bootText.title`): *Watched · Bu hafta bir şey seni izledi*. Share page title: *Bu hafta
  bir şey seni izledi.*
- QA: the third line (*seni izledi.*, 12 characters) on the default card at 88 px in the 466 px column.

**Why it wins.** Unmarked Turkish word order (time, subject, object, verb), so it reads as a plain statement. And the
slot before the verb is the focus position: *bir şey **seni** izledi* means "it was **you** that something watched".

| Alternate (rejected) | Why it lost |
|:--|:--|
| Bir şey / *seni* izledi / bu hafta. | Inverted order (*devrik cümle*) is spoken or poetic, and the sentence ends on its weakest part. |
| Bu hafta / *seni* bir şey / izledi. | The focus moves to *bir şey*: the watcher becomes the point, not the reader. |
| Bu hafta / biri / *seni* izledi. | *Biri* is a person, a spy. |
| Bu hafta / bir şey / *sizi* izledi. | §1.2. |

### 3.2 Sub line

**Final:** *Yeryüzünde herhangi bir yer seç. Son 7 günde üzerinden geçen bütün uyduları ve çektikleri gerçek görüntüleri gör.*

- Catalog: `['Yeryüzünde herhangi bir yer seç. Son ', String(days), ' günde üzerinden geçen bütün uyduları ve çektikleri gerçek görüntüleri gör.']`
- The same sentence is `card.page.description`.
- *bütün uyduları … çektikleri*: plural object, plural possessor. *Seç* covers every way in (typing, the chips, *Beni
  şaşırt*, a pin, *Konumumu kullan*). *görüntü*, not *fotoğraf*: the pictures include mosaics and radar images.

| Alternate (rejected) | Why it lost |
|:--|:--|
| …üzerinden geçen her uyduyu ve çektikleri… | Singular object, plural possessor. |
| Dünya’da herhangi bir yer yaz. … | *Yaz* excludes the chips, the pin and the location button. |
| …gerçek görüntüleri görürsün. | A promise; leans toward a pitch. |

### 3.3 Results headline and second line

**Plural categories: `one`, `other`.** A noun after a numeral never takes the plural suffix and the verb stays singular:
*1 uydu, 256 uydu, 256 uydu geçti* (never *uydular*, never *geçtiler*). Both keys are always supplied (the type system
requires them) and are identical unless English uses a word for one.

**Headline, at least one satellite** (`results.headline.watched`):

| Case | Frame | Example |
|:--|:--|:--|
| Current window | `*[PLACE]* son [DAYS] günde **[NUM] uydu tarafından izlendi**.` | *Waterloo* son 7 günde **256 uydu tarafından izlendi**. |
| n = 1 | same | *Waterloo* son 7 günde **1 uydu tarafından izlendi**. |
| A one-day window | `*[PLACE]* son 24 saatte **…**.` | |
| Old window (`from`, `to` from `time.dayMonth`) | `*[PLACE]* [FROM] ile [TO] arasında **[NUM] uydu tarafından izlendi**.` | *Waterloo* 29 Eki ile 5 Kas arasında **12 uydu tarafından izlendi**. |

Parts: `[accent(place), ' son ', '7', ' günde ', strong(num('256'), ' uydu tarafından izlendi'), '.']`.

- **Accent:** the place only. **Strong:** the count and the verb, as in English, the full stop outside it.
- **Order:** the place leads (the Turkish news sentence), and *son 7 günde* keeps names like *Area 51* or *Landsat 9*
  from running into the count.
- No `placeAccent` article logic: the label is used exactly as given.

**Headline, none** (`results.headline.none`), no strong part, the place still the accent:

- current: `*[PLACE]* bu hafta takip ettiğimiz hiçbir uydu tarafından izlenmedi.`
- past: `*[PLACE]* o hafta takip ettiğimiz hiçbir uydu tarafından izlenmedi.`

*Hiçbir … -medi* is the natural negative; never *0 uydu*.

**Second line** (`results.imagesPublic`, `noImages`, `archiveDown`): one count for photos, mosaics, radar and
geostationary frames together.

| Case | Text |
|:--|:--|
| k ≥ 1 | `[strong('En az '), num('31'), ' görüntü kamuya açıldı.']` → **31 görüntü kamuya açıldı.** (*En az* shows while the count can grow) |
| none, this week / that week | *Bu hafta hiçbir görüntü kamuya açılmadı.* / *O hafta hiçbir görüntü kamuya açılmadı.* |
| none, on a card or post (the headline already says the week) | *Hiçbir görüntü kamuya açılmadı.* |
| archives down (long: results, page, post) | *Görüntü arşivleri yanıt vermedi; kamuya açık görüntüleri şu an sayamıyoruz.* |
| archives down (card, one line) | *Görüntü arşivleri yanıt vermedi.* |

- *En az* sits right before the number, so it can fade out in place; the sentence reads with and without it. Never
  *en azından*.
- *kamuya açıldı* is the Turkish phrase for data made public. Rejected: *yayımlandı* (loses "public"), *herkese açık
  hale getirildi* (filler), *Kamuya açılan görüntü: 31.* (a label).

**Why no image (`results.why`)**: whole sentences; the place is *bura-* (it is in the headline):

| Key | Turkish |
|:--|:--|
| sunNeverRose | *Güneş hiç doğmadı; gündüz kameralarının hiçbiri burayı göremedi.* |
| sunBarelyRose | *Güneş neredeyse hiç yükselmedi; gündüz kameralarının hiçbiri burayı göremedi.* |
| infrared | `['Meteoroloji uyduları burayı yine de kızılötesiyle ', num('42'), ' kez taradı.']` |
| radar | `['Radar ışık gerektirmez. ', 'Umbra, Capella ve 7 radar uydusu daha ', num('1.204'), ' kez menzile girdi.']` (list from `fmt('tr').list`; one other: *ve 1 radar uydusu daha*) |
| unpublished | *Sentinel-2 ya da Landsat gündüz buranın üzerinden bir kez geçti, ama henüz hiçbir sahne yayımlanmadı.* / *… 3 kez geçti, …* |
| none | *Arşivi açık hiçbir görüntüleme uydusu gündüz buranın üzerinden geçmedi.* |

### 3.4 Pass sentences

**The pass paragraph (Sentinel-2C):**

> EN: Sentinel-2C crossed 786 km overhead at 16:14:21 UTC, moving south at 7.46 km/s. It was looking straight down.
> Cloud cover across the scene: 25%.
>
> TR: 16:14:21 UTC. Sentinel-2C, 786 km irtifadan tam tepeden geçti; 7,46 km/sn hızla güneye doğru ilerliyordu. Tam
> aşağıya bakıyordu. Sahne genelinde bulut örtüsü: %25.

**Why the log stamp first.** Turkish says *saat 16.14’te*, but the locative would have to harmonise with whatever ends
the slot (*UTC’de, EST’de, UTC+9’da*). Opening with the stamp as its own sentence keeps the slot bare, reads like an
instrument's log, and leaves the satellite as the subject of every sentence that follows, so dropped subjects stay on
it. Inside a sentence, where a time is only a side fact, use `saat [TIME] idi` (*idi* is written apart, so it never
harmonises). Rejected: *16:14:21 UTC’de* (computed suffix), *16:14:21 UTC itibarıyla* (means "as of"), *Saat 16:14:21 UTC
olduğunda…* (long, the same opening on every paragraph).

| Message | Frame |
|:--|:--|
| `pass.crossed`, overhead | `[TIME]. [SAT], [ALT] km irtifadan tam tepeden geçti; [V] km/sn hızla [DIR→dative] doğru ilerliyordu.` |
| `pass.crossed`, offset | `[TIME]. [SAT], [ALT] km irtifadan, buranın [KM] km [DIR→of-here] geçti; [V] km/sn hızla [DIR→dative] doğru ilerliyordu.` → *…, buranın 61 km batısından geçti; …* |
| `pass.lookingDown` | *Tam aşağıya bakıyordu.* |
| `pass.lookingOff` | `['Dikeyden ', num('5,3', '°'), ' eğik bakıyordu.']` |
| `pass.cloudCover` | `['Sahne genelinde bulut örtüsü: ', num('%25'), '.']` |
| `pass.mosaic` | `[SENSOR] görüntüleyicisi burayı taradı ve piksel başına [M] m çözünürlükle NASA’nın günlük gerçek renkli mozaiğine kattı.` |
| `pass.radarImaged` | `Radarı [DEG]° yana bakarak burayı piksel başına [M] m çözünürlükle görüntüledi.` / dark: `… burayı karanlıkta, piksel başına [M] m çözünürlükle görüntüledi.` |
| `pass.likely.crossed` | `[TIME]. [SAT], [ALT] km irtifadan tam tepeden geçti.` + swath: ` Burası, uydunun [W] km’lik tarama şeridi içindeydi.` (offset form as in `crossed`) |
| `likely.archiveFailed` | *Gündüzdü; uydu bu noktayı kaydetmiş olmalı. Arşiv şu an aranamadı.* |
| `likely.noScene` | *Bu geçiş için sahne yok. Sentinel-2 yalnızca karaları ve kıyı sularını kaydeder; bu noktayı planlamamış olabilir.* |
| `likely.notYet` | *Gündüzdü; uydu bu noktayı neredeyse kesinlikle kaydetti. Bu geçişten henüz sahne yayımlanmadı; arşivler bir gün ya da daha fazla gecikebilir.* |
| `likely.dark` | *Burada hava karanlıktı. Meteoroloji görüntüleyicileri geceleri kızılötesiyle taramayı sürdürür; yani uydu sokaklarını değil, bulutlarını gördü.* |
| `likely.mosaicUnconfirmed` | *Bu geçişin NASA günlük mozaiği seçtiğin noktada doğrulanamadı.* |
| `likely.notPublished` | *Uydunun görüntüleri hava tahminlerini besliyor; burada gösterilebilecek biçimde yayımlanmıyor.* |
| `could.withinView`, offset | `[TIME]. [SAT], buranın [KM] km [DIR→of-here] geçti; burası uydunun görüş alanı içindeydi.` |
| `could.withinView`, overhead | `[TIME]. [SAT] tam tepeden geçti; burası uydunun görüş alanı içindeydi.` |
| `could.camera` | `Uydu, kamerasını dikeyden [DEG]° eğseydi burayı izleyebilirdi. İzleyip izlemediğini bilemeyiz.` / straight down: `Uydu, tam aşağıya bakarak burayı izleyebilirdi. İzleyip izlemediğini bilemeyiz.` |
| `could.radar` | `Radar bulutun ve karanlığın içinden görür. Uydu, [DEG]° yana bakarak burayı haritalayabilirdi.` (no angle: `Uydu burayı haritalayabilirdi.`) + open archive: ` Bu geçişten yayımlanmış bir görüntüsünü bulamadık.` / else: ` Bunu yapıp yapmadığını bilemeyiz.` |
| `could.insideSwath` | `[PLACE], uydunun [W] km’lik tarama şeridi içindeydi. Uydunun operatörü nereleri görüntülediğini yayımlamıyor; bu yüzden görüntüleyip görüntülemediğini bilemeyiz.` |
| `pass.overhead` | `[TIME]. [SAT], [ALT] km irtifadan geçti; ufkunun [EL]° üzerinde, [DIR→in-past] .` → *21:14 EST. ISS, 420 km irtifadan geçti; ufkunun 62° üzerinde, kuzeybatıdaydı.* Near the zenith: *…; ufkunun 84° üzerinde, neredeyse tam tependeydi.* |
| `pass.darkStation` | *Burada hava karanlıktı. İstasyon hâlâ güneş ışığındaydıysa gökyüzünden parlak, sabit bir nokta olarak geçmiş olmalı.* (*Burada*, the place's deictic: after *…kuzeybatıdaydı.*, *Orada* would point at where the station was) |
| `pass.geo.sits` | `[SAT] geçip gitmez. Ekvatorun [ALT] km yukarısında, [SEAT] boylamında durur ve altındaki Dünya yüzünü her [N] dakikada bir baştan sona tarar.` → *Meteosat-12 geçip gitmez. Ekvatorun 35.778 km yukarısında, 0.2°W boylamında durur ve altındaki Dünya yüzünü her 10 dakikada bir baştan sona tarar.* (no seat: drop `, [SEAT] boylamında`; no cadence: `… baştan sona tarar.`; *dakikada* is the num part's unit) |
| `pass.geo.reached` | `Bu taramanın çizgisi [DIR→dative] doğru ilerlerken [PLACE] üzerinden geçti; saat yaklaşık [TIME] idi.` |
| `pass.geo.infrared` | *Burada hava karanlıktı, bu yüzden görüntü kızılötesi: bulut tepeleri sıcaklığa göre, soğuk olan daha açık renkte.* |

- `[SEAT]` arrives written in international notation (*0.2°W*), so the frame puts the invariant word *boylamında* after
  it and never spells the hemisphere out. The mix of *35.778 km* and *0.2°W* in one sentence is accepted: the seat is a
  coordinate, and coordinates are international (§6.3).
- *Never *geçmez* alone* for "doesn't pass" (it also means "fails", "won't do"): *geçip gitmez*.
- *km’lik* is allowed: the suffix sits on the fixed unit (*kilometrelik*), not on the number, and goes inside the number
  part's unit (`num('290', 'km’lik')`, like *dakikada* in `geo.sits`), so it is set in the unit's face.
- Every *Uydu* / *uydunun* above is the re-mention rule of §5.2.

### 3.5 Share headlines, cards, posts and the share page

**Card headlines** (`card.headline`, `headlineBy`, `headlineWeek`): blocks in this order; the accent holds the place.

| Message | Blocks | Example |
|:--|:--|:--|
| `headline` (week's N known) | `[accent(place, ','), '[N] uydu tarafından izlendi.']`; cut place: `[accent('Llanfairpwll…'), '7 uydu tarafından izlendi.']` | *Waterloo,* / 7 uydu tarafından izlendi. |
| `headlineBy.imaged` | `[accent(place, ','), '[SAT] tarafından izlendi.']` | *Waterloo,* / Sentinel-2C tarafından izlendi. |
| `headlineBy.likely` | `[accent(place, ','), '[SAT] tarafından tarandı.']` | |
| `headlineBy.could` | `['[SAT] geçerken', accent(place), 'görüş alanındaydı.']` | WorldView Legion 4 geçerken / *Waterloo* / görüş alanındaydı. |
| `headlineBy.overhead` | `['[SAT],', accent(place), 'üzerinden geçti.']` | ISS, / *Waterloo* / üzerinden geçti. |
| `headlineWeek` | `[accent(place, ' bu hafta'), '[N] uydu tarafından izlendi.']`; n = 0: `… 'takip ettiğimiz hiçbir uydu tarafından izlenmedi.'`; cut: the accent loses *bu hafta*, as English drops its tail | *Waterloo bu hafta* / 31 uydu tarafından izlendi. |

- A nameless satellite (`sat` undefined): the frame writes *bir uydu* itself (*bir uydu tarafından izlendi*, *Bir uydu
  geçerken*, *Bir uydu* / *Waterloo* / *üzerinden geçti.*, with no comma after *bir uydu*). Never *bir uydu uydusu*.
- A comma after the first name is required when another name follows (*Waterloo, Sentinel-2C…*); after a cut place
  there is no comma (*…,* reads as a typo).
- Rejected: *Sentinel-2C, Waterloo’yu izledi.* (computed suffix); *Sentinel-2C izledi: Waterloo.* (caption grammar).

**Cloud channels** (`card.cloud`): never a bare *gördü* after the place-subject headline.

| Case | sub (card line) | chip | post | desc |
|:--|:--|:--|:--|:--|
| only (≥ 90 %) | *Tamamen bulutlu. Yalnızca bulut var.* (one line in the 466 px panel) | *Tamamen bulutlu · %92* | *Görüntüde yalnızca bulut var.* | *Görüntüde yalnızca bulut var (%92).* |
| mostly | *Çoğunlukla bulut: sahnede %81.* | *Çoğunlukla bulut · %81* | *Görüntünün çoğu bulut (%81).* | same as post |
| spot | *Noktanın üzeri bulutlu.* | *Noktada bulut* | *Noktanın üzeri bulutluydu.* | same as post |

**The rest of the card** (mono labels stored in sentence case, uppercased by the renderers):

| Key | Turkish |
|:--|:--|
| `photos` | as the second line (§3.3) |
| `stamp` | *1 Kas 2026 Paz · 11:21 EST* |
| `weekTo` | *26 Eki → 1 Kas 2026*: the start is six calendar days before the end at the place (take the end's local year, month and day, build `Date.UTC(y, m − 1, d − 6)` and format both at `UTC`), joined with ` → ` (§6.4). Never *Son 7 gün · …*: on a card opened a month later it reads "the last 7 days from now". |
| `lastWeek` | *Son 7 gün* |
| `readout` | *İrtifa · Ufuktan açı · Hız · Bakış açısı · Piksel · Mozaik pikseli · En yakın* |
| `lane` | *Görüntü · Muhtemel · Menzilde · Tepeden* |
| `unit` | *km · m · km/sn* |
| `geometry` | *Geometri · kuzey yukarıda* (about the English's length: *Geçiş geometrisi · …* ended 6 px from the scale bar beside it) |
| `note` | *Görüntü sitede açılır · Görüntü şu an alınamıyor · Ticari arşiv, kamuya kapalı · Şeritte, henüz kamuya açık görüntü yok · En yakın anda yer izi* |
| `acquiring` | *Alınıyor…* |
| `noPublicPhoto` / `noPhoto` | *Bu hafta kamuya açık görüntü yok* / *Gösterilecek görüntü yok* |
| `look` | *En net görüntü · Son bulutsuz görüntü · Tamamen bulutlu · Radar* |
| `lookDay` | *3 Kas* |
| `aSatellite` | *Bir uydu* (chips and the plan callout only; sentences write their own *bir uydu*) |
| `invite` | *Seni neyin izlediğini gör* (QA at 466 px beside *WWW.WATCHED.EARTH*; if it does not fit, *Seni ne izledi, gör*) |
| `enterAnyPlace` | *Yeryüzünde bir yer seç* |
| `defaultPlace` | *Palm Jumeirah* |
| `defaultAlt` | *Dubai’deki Palm Jumeirah’nın gerçek bir Sentinel-2 uydu fotoğrafı; yanında şu satır: Bu hafta bir şey seni izledi. Yeryüzünde bir yer seç.* |

**Share page** (`card.page`, `crossed`, …): the description opens with a dateline, the Turkish news convention.

| Key | Turkish |
|:--|:--|
| `page.title` | *Bu hafta bir şey seni izledi.* |
| `page.description` | the sub line (§3.2) |
| `page.placeTitle` | *[PLACE] bu hafta neler tarafından izlendi* (no full stop: a heading) |
| `page.placeDescription` | *Son 7 günde [PLACE] üzerinden geçen bütün uydular ve çektikleri gerçek görüntüler. Bu hafta seni ne izledi?* |
| `page.opening` | `[accent('Watched'), ' açılıyor']` |
| `crossed` | `[DATE], [CLOCK] [ZONE]. [SAT], [PLACE] üzerinden [ALT] km irtifadan geçti; kuzeye doğru ilerliyordu.` → *1 Kas 2026 Paz, 11:21 EST. Sentinel-2C, Waterloo üzerinden 795 km irtifadan geçti; kuzeye doğru ilerliyordu.* Missing parts drop cleanly: no `when` → no dateline; no altitude → *Waterloo üzerinden geçti*; no heading → no last clause; no name → *Bir uydu, …* (no comma: *Bir uydu Waterloo üzerinden …*). |
| `withinView` | *1 Kas 2026 Paz, 10:52 EST. WorldView Legion 4 geçerken Waterloo görüş alanındaydı.*; with a heading: *… WorldView Legion 4 kuzeye doğru geçerken Waterloo görüş alanındaydı.* (`couldHave`'s *Uydu* is then the one re-mention) |
| `couldHave` | *Uydu kamerasını buraya çevirmiş olabilir; operatörü çevirip çevirmediğini söylemiyor.* |
| `straightDown` / `offNadir` | *Tam aşağıya bakıyordu.* / *Dikeyden 5,3° eğik bakıyordu.* |
| `cloudCover` | *Bulut örtüsü: %25.* |
| `inSwath` | *[PLACE], uydunun tarama şeridi içindeydi.* |
| `bestFrom` | *En net görüntüyü [SAT] çekti.* · *Son bulutsuz görüntüyü [SAT] çekti.* · *İlk görüntüyü [SAT] çekti.* (no name: *bir uydu çekti*) |
| `question` | *Bu hafta seni ne izledi?* |
| `cardAlt` | *Paylaşım kartı. Haftanın en net görüntüsünü [SAT] çekti.* / *Paylaşım kartı.* |

**Share post** (`share.post`, `hookWatched`, `hookPassed`, `credit`): a dateline first, so the date and the clock never
take a suffix. `[DATE]` is the long form (*1 Kasım Pazar*).

| Key | Turkish |
|:--|:--|
| imaged | `[DATE], yerel saatle [CLOCK]. [PLACE], [ALT] km irtifadan [SAT] tarafından izlendi. Piksel başına [RES]; bu, gerçek görüntünün kendisi.` (no pixel size: `… izlendi. Bu, gerçek görüntünün kendisi.`) |
| clouded | `[DATE], yerel saatle [CLOCK]. [PLACE], [ALT] km irtifadan [SAT] tarafından izlendi. [cloud.post]` |
| likely | `[DATE], yerel saatle [CLOCK]. [PLACE], [ALT] km irtifadan [SAT] tarafından tarandı. Uydunun tarama şeridi bu noktayı kapsadı.` |
| could | `[DATE], yerel saatle [CLOCK]. [SAT] geçerken [PLACE] görüş alanındaydı. Uydu kamerasını buraya çevirmiş olabilir; operatörü çevirip çevirmediğini söylemiyor.` |
| overhead | `[DATE], yerel saatle [CLOCK]. [SAT], [ALT] km irtifadan [PLACE] üzerinden geçti.` |
| week | the plain `headlineWeek`, then the second line: *Waterloo bu hafta 31 uydu tarafından izlendi. 31 görüntü kamuya açıldı.* |
| hookWatched | *Bu hafta bir şey seni de izledi.* (the hero's order; also `results.invite.text`) |
| hookPassed | *Bu hafta tependen ne geçti?* (*tependen* is unambiguous "over you"; *üzerinden* would read "over it") |
| credit | *via @armaangupt0* (*via* is the usual form on Turkish X) |
| file names | `watched-[sat]-[place]-[day].png`, `watched-[place]-hafta-[day].png` |

### 3.6 The four verdicts (one vocabulary everywhere)

Source of truth: `src/i18n/<tr>/verdicts.ts` (read through `VERDICT_META`); the card mirrors it.

| verdict | title | short (lane) | unit | definition | verb (row label, active) |
|:--|:--|:--|:--|:--|:--|
| imaged | İzledi | Görüntü | geçiş | *Bu yerin gerçek bir görüntüsü kamuya açık bir arşivde var.* | izledi |
| likely | Muhtemelen izledi | Muhtemel | geçiş | *Sabit bir kameranın tarama şeridi bu yeri kapsadı. Buranın görüntüsü yayımlanmadı.* | taradı |
| could | Buraya bakabilirdi | Menzilde | geçiş | *Yönlendirilebilir ya da arşivi kapalı bir kamera menzildeydi. Operatörü bakıp bakmadığını söylemiyor.* | görüş alanından geçti |
| overhead | Tepeden geçti | Tepeden | geçiş | *Gökyüzünden geçti. İstasyonlar ve geri kalan her şey.* | tepeden geçti |

- **Titles** are active past forms with the satellite as the implied subject, one voice for all four.
- **`verb` is said alone after the satellite's name** in a row's spoken summary: *Sentinel-2C, izledi, 6 Kasım Cuma
  16:14 EST, 41 saat önce, bulut yüzde 25*. Never the passive (*Sentinel-2C, izlendi* says the satellite was watched).
  No headline is ever built from `verb` (`copy.ts shareHeadline` stays unused for tr).
- **GÖRÜNTÜ, not FOTOĞRAF**: the lane holds radar images and mosaics too. **MUHTEMEL / MENZİLDE**: *muhtemel* and
  *olası* are synonyms (TDK), so the could lane says what its definition says: a camera was in range.
- **Unit:** *geçiş* for every verdict and number (*1 geçiş, 31 geçiş*); a heading without a number: *GEÇİŞLER*.
- Readout's accessible name: *12 geçiş: İzledi*. Timeline summary: *Zaman çizelgesi, 7 gün. İzledi: 12 geçiş. Muhtemelen
  izledi: 4 geçiş. Buraya bakabilirdi: 3 geçiş. Tepeden geçti: 40 geçiş.* (title first, never *12 izledi*).
- When a footnote or About quotes a verdict, it quotes the title in quotation marks: *bu geçiş “İzledi” sayılır*,
  *“Muhtemelen izledi” olarak gösteriliyor*, *buna “Buraya bakabilirdi” diyoruz*.
- **About's longer word** (`verdictMore`): imaged *Gösteriyorsak, o gerçek görüntünün ta kendisi.*; likely *Görüntü
  henüz kamuya açılmadı ya da bulut yüzünden elendi.*; could *Gerçekten bakıp bakmadığını bilmenin yolu yok.*; overhead
  none.

### 3.7 Landing, search and locate

| Key | Turkish |
|:--|:--|
| `lastDays` | *Son 7 gün* (one day: *Son 24 saat*) |
| `windowRange` | *12 → 19 Kas 2026 UTC · 29 Eki → 5 Kas 2026 UTC · 29 Ara 2026 → 5 Oca 2027 UTC* (`formatRangeToParts` at `UTC`, joined with ` → `) |
| `builtBy` | *Yapan: @armaangupt0* |
| `searchPlaceholder` / `placeLabel` | *Bir yer ara* / *Yer* (rule: *01 / Yer*) |
| `searching` / `searchUnavailable` / `matches` / `noMatch` | *Aranıyor* / *Arama kullanılamıyor* / *[N] sonuç* / *Sonuç yok* |
| `searchHint` | *Ad, adres ya da 41.01, 28.98* (the field parses a decimal point only: show the form it accepts) |
| `clearSearch` / `go` / `suggestions` | *Aramayı temizle* / *Bu yerin üzerinden ne geçtiğini göster* / *Yerler* |
| `searchDown` | *Yer araması yanıt vermiyor. 43.47, −80.54 gibi koordinatlar yine de çalışır.* (example kept exactly) |
| `nothingMatches` | *“[QUERY]” için sonuç yok. Bir şehir, simge yapı ya da koordinat dene.* |
| `useMyLocation` / `locateMe` / `nearMe` / `locating` | *Konumumu kullan* / *Beni bul* / *Yakınımda* / *Bulunuyor…* (about as wide as *Yakınımda*) |
| `cancelSearch` / `cancelLocate` / `cancelLocating` | *İptal* / *İptal* / *Konum bulmayı iptal et* |
| `requestingPosition` / `namingPlace` / `elapsed` | *Konum isteniyor* / *Yerin adı bulunuyor* / *04 sn* |
| `locatingNote` | *Yerin adını bulmak için konumun Photon’a gider. Yalnızca yaklaşık 10 km’lik bir alanı saklarız.* |
| `locationLabel` / `dismiss` | *Konum* / *Kapat* |
| `locateErrors.denied` | *Konum erişimi engellendi. Tarayıcı ayarlarından izin verebilir ya da bir yer arayabilirsin.* |
| `locateErrors.unavailable` / `other` | *Konumuna şu an ulaşılamıyor. Bunun yerine bir yer ara.* |
| `locateErrors.timeout` | *Konumunu bulmak çok uzun sürdü. Yeniden dene ya da bir yer ara.* |
| `locateErrors.unsupported` | *Bu tarayıcı konumunu paylaşamıyor. Bunun yerine bir yer ara.* |
| `locateErrors.insecure` | *Konum için güvenli (https) bağlantı gerekir. Bunun yerine bir yer ara.* |
| `orTry` | *Örnekler* (rule *02 / Örnekler*; also the first item of the phone chip row) |
| `pinHint` / `dropPin` / `examplesLabel` | *Ya da küreye tıklayıp raptiye bırak* / *Raptiye bırak* / *Örnek yerler* |
| `surprise` / `surpriseName` | *Beni şaşırt* / *Beni şaşırt: rastgele seçilmiş ünlü bir yer* |

### 3.8 Results panel, pass list and pass view

| Key | Turkish |
|:--|:--|
| `sections` | *Özet · Geçişler · Sürekli izleyenler* (*01 / ÖZET*) |
| `invite.text` / `invite.checkPlace` | *Bu hafta bir şey seni de izledi.* / *Kendi yerini ara* |
| `footer.checkPlace` | `[strong('Kendi '), 'yerini ara']` (phones: *YERİNİ ARA*) |
| `footer.replay` / `replayLabel` / `replayTitle` | *Oynat* (the narrow replay word: *Yeniden oynat* beside *Bu geçişi paylaş* overflows the row on 401–470 px phones) / *Geçişi yeniden oynat* / *Geçişi kürede yeniden oynat* |
| `footer.shareButton` | `[strong('Bu geçişi '), 'paylaş']`, `[strong('Bu görüntüyü '), 'paylaş']` (phones: *PAYLAŞ*) |
| `footer.clearest` / `clearestLabel` | `['En net görüntü']` (no strong part) / *En net görüntüyü gör* |
| `searchAnother` / `allPasses` | *Başka bir yer ara* / *Tüm geçişler* |
| `head.windowSpan` / `verifying` | *7 gün · 1 → 8 Kas* / *Mozaikler doğrulanıyor* |
| `head.cancel` / `newSearch` / `close` / `change` / `computing` / `recent` | *İptal · Yeni arama · Kapat · Değiştir · Hesaplanıyor · Son aramalar* |
| `head.position` | *Bu türde geçiş 3, toplam 31* (on screen *3 / 31*) |
| `head.previous` / `next` / titles | *Bu türden önceki geçiş* / *Bu türden sonraki geçiş* / *Önceki (←)* / *Sonraki (→)* / *Tüm geçişler (Esc)* |
| `head.shared` | *Seninle paylaşıldı · [PLACE], [SAT] tarafından izlendi* |
| `head.passWhen` | *1 Kas Paz · ≈ 16:14 EST* |
| `checkingArchives` / `computingPasses` / `sheetLabel` | *Arşivler kontrol ediliyor* / *Geçişler hesaplanıyor* / *[PLACE] üzerindeki uydular* |
| `shareWeekLabel` | *[PLACE] için bu haftayı paylaş* / *… o haftayı paylaş* |
| `verdictGroup` | *Etikete göre geçişler. Her biri kendi listesine atlar.* |
| `notes.counted` | `[strong('12'), ' ayrıntılı görüntü (Sentinel-2, Landsat, 10–30 m)', ' · ', strong('4'), ' günlük meteoroloji mozaiği (250–375 m)', ' · ', strong('3'), ' radar görüntüsü (Sentinel-1, 20 m)', ' · ', strong('4'), ' tam disk görüntüsü (yerdurağan meteoroloji uyduları, 2–5 km; her birinin en yenisi gösteriliyor)', '. ', checked]` (the noun right after each count, the source in the parentheses) |
| `notes.checked` | *250 görüntüleme ve insanlı uydunun 1.234 geçişi kontrol edildi.* |
| `notes.passTimes` | *Geçiş saati, uydunun buraya en yakın olduğu an; kamuya açık yörünge elemanlarından hesaplandı (indirildi: 2026-11-08 03:31Z). Yerel saatler: America/Toronto.* |
| computing stages (idle / done) | *Yörünge kataloğu / Katalog yüklendi · Yörünge hesabı · 7 gün / Yörüngeler hesaplandı · Sentinel-2 + Landsat arşivleri / Arşivler arandı · Sahne ve geçiş eşleştirmesi / Sahneler eşleştirildi* |
| `computing.ready` / `ok` / `seconds` / `percent` | *Rapor hazır* / *OK* / *1,84 sn* / *%62* |
| `computing.window` | `[strong('7 günlük aralık · '), '1 Kas 05:47 → 8 Kas 05:47 UTC']` |
| `computing.slow` | *Planetary Computer ve NASA, görüntüleri istek üzerine işliyor; bu adım birkaç saniye sürebilir.* (the comma keeps *NASA görüntüleri* from reading as "NASA images") |
| `computing.verySlow` | *Görüntü arşivleri geç yanıt veriyor. Yanıt gelmezse geçişler yine de yörünge geometrisinden gösterilir; bunu da belirtiriz.* |
| `computing.sharedAlt` / `sharedCaption` | *[SAT] görüntüsü: [PLACE]. Seninle paylaşıldı.* / `[strong('Seninle paylaşıldı'), ' · [PLACE], [SAT] tarafından izlendi · 1 Kas Paz, 11:21']` (no name: *Bir uydu görüntüsü*, *bir uydu tarafından*) |
| `geo.none` | *Bu yeri ufkunun 5°’den fazla üzerinden gören, çalışır durumda hiçbir yerdurağan meteoroloji görüntüleyicisi yok.* (5° is fixed text; *ufkunun* says what the angle measures) |
| `geo.facts` | *0.0°E · 41,2° yukarıda · 10 dk’da bir* |
| `geo.images` | `['Bu hafta ', num('412'), ' görüntü']` / `['Son 5 günde ', num('412'), ' görüntü']` |
| `geo.replay` / `replayLabel` | *Oynat* / *[SAT]: en son görüntüsünü oynat* |
| `geo.frame` | *Aranıyor… · Kamuya kapalı · Düşük kalite · Şu an görüntü yok · Kare alınamadı* |
| `geo.frameAlt` / `infraredChip` / `infraredTitle` | *[SAT]: bu yerin çevresinden son kare* (infrared: *son kızılötesi kare*) / *IR* / *Kızılötesi: bulut tepeleri sıcaklığa göre, soğuk olan daha açık renkte* |
| `timeline.title` / `meta` / `daylight` / `now` | *Zaman çizelgesi* / *7 gün · America/Toronto · EST* / *Burada gündüz* / *Şimdi* |
| `timeline.keysHint` | *[summary] Geçişler arasında sol ve sağ ok tuşlarıyla ilerle.* |
| `timeline.geoLane` / `geometry` | `[strong('Yerdurağan · '), '4']` / *dikeyden 5,3° · 61 km* |
| `timeline.mark*` | *Günlük mozaik, 375 m · ● · Radar görüntüsü, 20 m · ◆ · [title] · ◆ · açık görüntüleyici · ◇ · ticari · □ · radar · ▣ · meteoroloji · ○ · insanlı · ✛ · diğer* |
| `replay` (scrubber) | *Tekrar zamanı* · *T−00:42, 16:14:21 UTC* · *Tekrarı oynat* · *Tekrarı duraklat* · *Tekrar hızı* · *Görüş alanında 4 dk 12 sn* · *En yakın* · *Boşluk* · *oynat / duraklat* · *bu türden önceki / sonraki geçiş* |
| `plan` | *Kuşbakışı çizim: [SAT] yer izi, en yakın anda buraya 61 km.* · *Kuşbakışı · kuzey yukarıda* · *Görüş alanı ±45°* · *Şerit 290 km* (≤ 20 characters beside *Kuzey yukarıda*: *Tarama şeridi 3.040 km* is 22) · *Yer izi* · *En yakın 61 km* / *En yakın < 1 km* |
| `product` | *Günlük mozaik · 375 m · Tam disk · 2 km · Kızılötesi · 2 km · Sentinel-2 L2A · 10 m · Landsat C2 L2 · 30 m · Sentinel-1 radar · 20 m* |
| `results.timelapse` | *Zaman atlamalı* / *Bu yer, yıl yıl* |
| `passView.empty` | *Takip ettiğimiz hiçbir uydu bu aralıkta buranın üzerinden geçmedi. Bu ender olur; bir veri kaynağı çalışmadıysa yukarıdaki notlar bunu söyler.* |
| `passView.imagedOrder` | *en net görüntü, sonra en yeniler* |
| `passView.count` / `countStack` / `sats` | *31 geçiş* / `num('31', 'geçiş')` / *12 uydu* |
| `showAllSats` / `showAllRows` / `showMore` / `left` / `showFewer` | *31 uydunun tümünü göster* / *31 satırın tümünü göster* / *40 tane daha göster* / *12 kaldı* / *Daha az göster* |
| `passView.tag` | *Mozaik · Radar · Bulutlu · %86 · Bulutlu · noktada* |
| `passView.rowLabel` | *[SAT], [verb], [daySpoken] [TIME], [ago], bulut yüzde 81, bulutlu* (the row's chip word; *tamamen bulutlu* claimed a full cover beside 81 %) |
| `offNadir` / `offNadirShort` / `distanceKm` / `cloudPct` | *dikeyden 5,3°* / *5,3°* / *61 km* / *bulut %25* |
| `expandLabel` / `expandTitle` | *Fotoğrafı büyüt: [SAT], [DAY] [TIME]* / *Fotoğrafı büyüt* |
| `satLabel` | *[SAT], [OPERATOR], 3 geçiş, sonuncusu 6 Kasım Cuma 16:14* |
| `latest` / `closest` / `cloudChip` | *En son: * / *En yakın: * / *Bulut* (a colon: *En yakın dikeyden 5,3°* reads "from the nearest vertical", *Son 6 Kas* "the last 6") |
| `photosSection` / `planSection` / `geometry` / `replay` | *Görüntüler* / *Kuşbakışı çizim* / *Geometri* / *Tekrar* |
| `fullDiscNote` | *Tam disk görüntüsü: uydunun görebildiği her şeyin tek bir görüntüsü; burada piksel başına 2 km. Kaba ama gerçek ve yayımlanan en yenisi; uydu bütün hafta her 10 dakikada bir buna benzer bir görüntü aldı.* (one minute: *her dakika*; unknown: *birkaç dakikada bir*) |
| `mosaicNote` | *Günlük mozaik: NASA her günün tarama şeritlerini piksel başına 375 m çözünürlüklü tek bir görüntüde birleştirir. Kaba ama gerçek ve bu geçişin gününden.* |
| `radarNote` | *Fotoğraf değil, radar görüntüsü: Sentinel-1 mikrodalga gönderir ve yankısını kaydeder; bulut ve karanlık onu durdurmaz. Parlaklık, yerin dalgaları ne kadar güçlü geri yansıttığını gösterir: binalar ve engebeli arazi parlak, durgun su karanlık görünür.* |
| `noImage.*` | *Bu geçişten bu noktanın [SAT] görüntüsü yok. Geçişin kuşbakışı çizimi.* · *Kamuya açık görüntü yok: bu radar operatörünün arşivi kapalı. Geçişin kuşbakışı çizimi.* · *Kamuya açık görüntü yok: ticari arşivler kapalı. …* · *Bu geçiş için gösterilecek görüntü yok. …* · *Arşiv şu an aranamadı. …* · *Bu geçiş için sahne yok. …* · *Bu geçişle eşleşen yayımlanmış bir sahne henüz yok. Sentinel-2 ve Landsat sahneleri genellikle bir gün içinde çıkar.* · *İnsanlı istasyonlarda kamera var, ama fotoğrafları yere ve zamana göre yayımlanmıyor.* · *Bu geçişin görüntüsü kullanılamıyor.* |
| `links` | *Kaydetmek için görüntüyü aç · İndiriliyor… · Görüntüyü indir · Kaynağı gör · [ARCHIVE]* |
| `spot.*` | *Seçtiğin noktadaki piksel okunuyor…* · *Seçtiğin noktada hava açık.* · *Seçtiğin noktada ince sirrus var; görüntüyü biraz yumuşatabilir.* · *Seçtiğin noktada bulut var.* · *Seçtiğin nokta bulut gölgesindeydi.* |
| `strip.*` | *İrtifa · Ufuktan açı · Dikeyden · Piksel · Bant · Güneş · Bulut · Noktada bulut* (*Dikeyden*, the rows' word: *Bakış açısı* wrapped in the strip's cell at 1280 px and dropped its value below the others) |
| `band.*` / `spotValue.*` | *Kızılötesi · Görünür · Renkli* / *Yok · Sirrus · Var · Gölge* (under *NOKTADA BULUT*, *YOK* means clear) |
| `unit.*` | *km · m · km/sn · yukarıda · mozaik · sahne · gündüz · alacakaranlık · gece* |
| `geo.*` (01 / Geometry) | *En yakın an · UTC · En yakın an · yerel · Yatay uzaklık · Ufkundan açı · Yer hızı · Yön · Güneş açısı · Görüş alanı · Tarama şeridi · Şeritte · Görüş alanında · Zaman aralığı (*ARALIK* alone is also December) · NORAD · geçiş · Tarama çizgisi · UTC · Tarama çizgisi · yerel · Ekvatorun üzerinde · Göğünde · Tarama yönü · Buradaki çizgi hızı · Kapsama · Bu tarama · NORAD · tarama* |
| `northToSouth` / `southToNorth` / `sunPhase` / `fullDisc` / `everyMin` | *Kuzey → güney* / *Güney → kuzey* / *Gündüz · Alacakaranlık · Gece* / *Tam disk* / *10 dk’da bir* |
| `upCompass` / `heading` | *yukarıda · GGB* / *GGB · Yükselen*, *GGB · Alçalan* |

### 3.9 Gallery, photo viewer, time-lapse

| Key | Turkish |
|:--|:--|
| `gallery.barLabel` / `filterLabel` | *Görüntüler* / *Görüntüleri filtrele* |
| `gallery.filter` | *Tümü · Ayrıntılı · Hava · Radar* (22 characters together, the English 23: *Ayrıntılı* is the footnote's word, so one term for "detailed" everywhere) |
| `gallery.filterTitle` | *Tüm görüntüler: en net görüntüden sonra en yeniden eskiye* · *Sentinel-2 ve Landsat, piksel başına 10–30 m* · *Günlük meteoroloji mozaikleri, piksel başına 250 m ve üzeri* · *Sentinel-1 radar görüntüleri, piksel başına 20 m: bulutun içinden, gece gündüz* |
| `system.counter` / `photosThisWeek` / `photosThatWeek` | *3 / 27* / *bu hafta 12* / *o hafta 12* |
| `prevPhoto` / `nextPhoto` / titles | *Önceki görüntü* / *Sonraki görüntü* / *Önceki (←)* / *Sonraki (→)* |
| `carousel` / `slide` / `trackLabel` | *karusel* / *slayt* / *Bu yerin görüntüleri; daha fazlası için kaydır* |
| `lead` | *En net görüntü · Son bulutsuz görüntü · Tamamen bulutlu* |
| `slideLabel` | *En net görüntü: Sentinel-2C, 1 Kas Paz 16:14, görüntü 3, toplam 27* |
| `replay` / `replayLabel` | `[strong('Bu geçişi yeniden '), 'oynat']` (phones and laptops: *OYNAT*, the narrow replay word) / *Bu geçişi kürede yeniden oynat: [SAT], [DAY] [TIME]* |
| `viewLabel` / `view` | *Son bulutsuz görüntüyü büyük aç: …* / *Görüntüyü büyük aç: …* / *Aç* |
| `sharePass` / `radarTag` | *Bu geçişi paylaş* / *Radar* |
| `noteMostlyCloud` / `noteLastClear` | *Bu haftaki geçişlerde çoğunlukla bulut vardı* (a *geçiş* is an event: it does not see) / *İşte son bulutsuz görüntü* |
| `clouded` | *Tamamen bulutlu · %92* · *Tamamen bulutlu · noktanda bulut* · *Noktanda bulut* |
| `status` | *Bulutlu · %86 · Noktada bulut · Bulutsuz · İnce sirrus · Bulut gölgesi · Bulut %25 · Günlük mozaik* |
| `photoAlt` | *[SAT] görüntüsü: [PLACE]. Yer, görüntünün ortasında.* |
| `acquiring` / `noImage` / `retry` | *Alınıyor* / *Görüntü gelmedi* / *Yeniden dene* |
| `north` | *K* |
| `expandLabel` / `expandTitle` | *Görüntüyü büyüt* / *Büyüt (F)* |
| `stillRendering` / `cropMissing` | *Hâlâ işleniyor. Büyük sahneler en az 10 sn sürebilir.* (two lines of ≤ 30) / *Arşiv bu kesiti göndermedi. Yoğun olabilir; görüntünün kendisi yine de var.* |
| `scanLine` / `awaiting` | `['Satır ', strong(line), ' → ' + lines]` / *Geçiş bekleniyor · Tarama bekleniyor* |
| `lightbox.spokenPosition` | *Görüntü 3, toplam 12* / *…, en net görüntü* / *…, tamamen bulutlu* |
| `lightbox.spokenLastClear` | *Son bulutsuz görüntü, bu haftadan önce* |
| `lightbox.timelapse` / `timelapseLabel` | *Zaman atlamalı* / *Bu yerin zaman atlamalı görüntüleri, yıl yıl* |
| `lightbox.zoom*` / `close` | *Yakınlaştır (+) · Uzaklaştır (−) · 2,5×* / *Görüntüleyiciyi kapat*, *Kapat (Esc)* |
| `lightbox.perPixel` / `panTitle` / `panProduct` | *10 m / piksel* / *Landsat’ın 15 m’lik pankromatik bandıyla keskinleştirildi* / *Landsat C2 L2 + L1 pan · 15 m* |
| `lightbox.status` | *Bulutlu · %86* / *Noktanda hava açık* |
| `lightbox.replay` / `share` / `shareLabel` | *Oynat* (the gallery's word without its tablet part) / *Paylaş* / *Bu görüntüyü paylaş* |
| `lightbox.filmstripLabel` / `thumbLabel` | *Tüm görüntüler* / *Görüntü 3* (UI labels say *Tüm/Tümü*, as the filter and *Tüm geçişler*; prose keeps *bütün gezegen*) |
| `timelapse.dialog` / `title` / `slider` / `frameList` | *Zaman atlamalı: [PLACE]* / *Zaman atlamalı* / *Kare* / *Kareler* |
| `timelapse.date` / `dayMonth` / `readout` | *22 Eki 2015* / *22 Eki* / *22 Eki 2015 · Sentinel-2A* |
| `timelapse.frameSpoken` | *Kare 3, toplam 12: 6 Ağustos 2019* |
| `captionYearly` / `captionSeason` | *12 bulutsuz görüntü · yılda bir* / *12 bulutsuz görüntü · her yıl sonbaharda* |
| `captionGathering` | *Yılda bir bulutsuz görüntü · [YEAR] yılından beri* |
| `captionShort` / `captionError` | *Bu yer için zaman atlamalı görüntü yok* / *Arşiv yanıt vermedi* |
| `note` | *Her kare, Sentinel-2’nin aynı 10 × 10 km’lik alandan çektiği bir görüntü; renkleri buradaki bütün fotoğraflar gibi ayarlandı. Her yıl için farklı bir mevsim hedeflenir; bulutsuz görüntüsü olmayan yıl atlanır.* |
| `noteOneSeason` | *Her kare, Sentinel-2’nin aynı 10 × 10 km’lik alandan çektiği bir görüntü; renkleri buradaki bütün fotoğraflar gibi ayarlandı. Her yıl aynı mevsimden; o mevsimde bulutsuz görüntüsü olmayan yıl atlanır.* |
| `source` | *Copernicus Sentinel-2, Planetary Computer üzerinden* |
| `listing` / `choosing` / `developing` | *Arşiv listeleniyor* / *Bulutsuz görüntü seçiliyor* (the generic singular: the plural is clipped on a 280 px picture) / *Kareler işleniyor* |
| `choosingProgress` / `developingProgress` | *Bulutsuz görüntü seçiliyor: 3 tamam, toplam 12* / *Kareler işleniyor: 3 tamam, toplam 12* |
| `tooCloudy` / `tooFew` | *Burası zaman atlamalı görüntüler için fazla bulutlu.* / *[YEAR] yılından beri bulutsuz görüntü yok · 3 gerekli*, *[YEAR] yılından beri 2 bulutsuz görüntü · 3 gerekli* |
| `noAnswer` / `unreachable` / `retry` | *Arşiv yanıt vermedi.* / *Planetary Computer’a ulaşılamadı* / *Yeniden dene* |
| `share` / `linkCopied` / `shareTitle` | *Paylaş* / *Kopyalandı* / *[PLACE], yıl yıl* |
| `video` / `rendering` / `videoFailed` / `saveVideo` | *Video* / *İşleniyor %05* / *Video hatası* / *Kaydet* (one 132 px width; *Videoyu kaydet* is ~159 px, and the button said *Video* a moment before) |
| `noH264` / `fileNamePlace` | *Bu tarayıcıda H.264 kodlayıcı yok: dosya Chrome ve Firefox’ta oynatılır* / *yer* |

### 3.10 HUD, globe, engine, app, share sheet, small namespaces

| Key | Turkish |
|:--|:--|
| `hud.about` / `home` | *Nasıl çalışır* / *Watched, ana sayfa* |
| `hud.regionTime` / `regionCatalog` / `regionSun` | *Zaman* / *Yörünge kataloğu* / *Güneş* |
| `hud.scene` | *Tekrar* (the replay's clock; *Sahne* reads "stage") |
| `hud.sun` / `subsolar` / `gmst` | *Güneş 16.2°S 063.0°E* / *Güneş altı noktası* / *GMST 18:41:50* |
| `hud.objects` / `objectsPending` / `catalog` | *16.893 nesne* / *Nesne* / *Katalog* |
| `hud.fetched` | *İndirildi 2026-11-08 03:34Z* (*Alındı* means "acquired" on the globe) |
| `hud.catalogAge` | *<1 dk önce · 42 dk önce · 5 sa önce · 3 gün önce*; stale: *Eski, 3 gün önce* |
| `hud.catalogUnavailable` / `catalogLoading` | *Katalog yüklenemedi* / *Katalog yükleniyor* |
| `globe.imaged` / `imagedAbout` | *Görüntülendi 11:21:13 EST* / *Görüntülendi ≈ 11:21 EST* |
| `globe.acquired` / `acquiredAbout` / `resolution*` | *Alındı 11:21:13 EST · 10 m* / *Alındı ≈ …* / *10 m*, *2 km* |
| `globe.acquisitionOf` / `closestApproachOf` | *Görüntü alımı · [SAT]* / *En yakın an · [SAT]* |
| `globe.acquiredNow` / `closestApproachNow` | *Alındı* / *En yakın an* |
| `globe.pin` | *Bırakılan raptiye* · *Yer adı bulunuyor* · *Çevrede yer adı yok* · *[name], [area]* · *[PLACE] üzerinden ne geçtiğini göster* · *Burada ara (Enter)* · *Raptiyeyi kaldır* · *Raptiyeyi kaldır (Esc)* · *Taşımak için küreye basılı tut* · *Raptiye bırakıldı: [coords].* · *Raptiye bırakıldı: [PLACE]. Üzerinden ne geçtiğini görmek için Enter’a ya da oka bas.* · *Raptiye bırakıldı. Üzerinden ne geçtiğini görmek için Enter’a ya da oka bas.* |
| `globe.noGl` | *3B görünüm kullanılamıyor* / *Bu tarayıcıda WebGL 2 kapalı* |
| `engine.progress` (≤ 40 characters) | *Yörünge kataloğu yükleniyor* · *Katalog · 16.912 nesne* · *412 yörünge hesaplanıyor · 7 gün* · *Yörüngeler hesaplanıyor · 210 / 412* · *Sentinel-2 + Landsat arşivleri aranıyor* · *42 sahne 31 geçişle eşleştiriliyor* · *NASA mozaikleri doğrulanıyor* · *NASA mozaikleri doğrulanıyor · 12 / 31* · *31 geçiş · 12 görüntü* |
| `engine.note.archiveSlow` / `archiveDown` | *Sentinel-2 ve Landsat arşivleri geç yanıt verdi; geçişler yalnızca yörünge geometrisinden gösteriliyor.* / *Sentinel-2 ve Landsat arşivlerine ulaşılamadı; geçişler yalnızca yörünge geometrisinden gösteriliyor.* |
| `sentinel2Thumbnails` / `sentinel2EarthSearch` | *Sentinel-2 sahneleri Earth Search üzerinden listelendi; bazıları kesit değil, sahnenin tamamının küçük resmi olarak görünüyor.* / *Sentinel-2 sahneleri Earth Search üzerinden listelendi (Planetary Computer araması kullanılamıyor).* |
| `sentinel2Down` / `landsatDown` | *Sentinel-2 arşivine ulaşılamıyor; Sentinel-2 görüntüleri eksik olabilir.* / *Landsat arşivine ulaşılamıyor; Landsat görüntüleri eksik olabilir.* |
| `openOcean` | *Bu nokta Sentinel-2’nin çekim planının dışında (açık deniz).* |
| `elementsOld` / `elementsNewer` | *Yörünge elemanları 5 günlük; geçiş saatleri birkaç dakika kayabilir.* / *Bu geçişler daha yeni yörünge elemanlarıyla yeniden hesaplandı; saatleri birkaç dakika kayabilir.* |
| `gibsUnconfirmed` | one: *NASA GIBS bir VIIRS görüntüsünü doğrulamakta gecikti; VIIRS her gün bütün gezegeni görüntülediği için bu geçiş “İzledi” sayılır.* other: *NASA GIBS, 4 VIIRS görüntüsünü doğrulamakta gecikti; VIIRS her gün bütün gezegeni görüntülediği için bu geçişler “İzledi” sayılır.* (shown only while unconfirmed: never *geç doğruladı*, "confirmed late") |
| `gibsSlowAll` / `gibsDownAll` | *NASA GIBS zamanında yanıt vermedi; meteoroloji uydusu görüntüleri gösterilmiyor.* / *NASA GIBS’e ulaşılamadı; meteoroloji uydusu görüntüleri gösterilmiyor.* |
| `gibsSlowSome` / `gibsDownSome` | *NASA GIBS, 31 meteoroloji uydusu görüntüsünden 4 tanesini zamanında göndermedi; bu geçişler “Muhtemelen izledi” olarak gösteriliyor.* / *… 4 tanesini gönderemedi; …* |
| `app.notice` | label *Arıza* · fallback *Bir sorun oluştu.* · *Yeniden dene* · *Deneniyor…* · *Geri* |
| `app.faults.catalog` | *Yörünge kataloğu yüklenemedi. Bağlantını kontrol edip yeniden dene.* (said only for the loader's own failure) |
| `app.faults.compute` | *Bu yerin geçişleri hesaplanırken bir sorun oluştu. Birazdan yeniden dene.* |
| `app.progress` | *Yörünge elemanları yükleniyor* / *Rapor hazır* |
| `share` sheet titles | *Bu geçişi paylaş · Bu görüntüyü paylaş · Bu haftayı paylaş* · *Kapat* · *Kapat (Esc)* |
| `share` buttons | *Görüntüyü paylaş · Görüntü hazırlanıyor… · Paylaş · Kopyala · Kopyalandı · X’te paylaş · Görüntüyü kopyala · PNG kaydet · Yeniden dene* |
| `share` link and post | `linkLabel` *Adres* · `directLink` *Doğrudan bağlantı: kısa bağlantı şu an oluşturulamadı* · `creatingLink` *Bağlantı oluşturuluyor…* · `linkLater` *Paylaşınca oluşur* · `postLabel` *Metin* · `renderFailed` *Kart burada çizilemedi; bağlantı yine de çalışır.* |
| `system` | *Kapat · Paneli genişlet · Paneli daralt* |
| `switcher` | *Dil* / *Dil: Türkçe. Değiştir* |
| `bootText` | *Watched yükleniyor* / *Bağlantı yavaş, hâlâ yükleniyor* / *Watched · Bu hafta bir şey seni izledi* |
| `time` | §6.4 |

### 3.11 About

| Key | Turkish |
|:--|:--|
| `bar` / `close` / `sectionsLabel` | *Hakkında* / *Kapat* / *Bölümler* |
| `title` | `[['Nasıl'], [accent('çalışır'), '?']]` (the Turkish title form; *Nasıl çalışır.* reads as a broken sentence) |
| `lede` | *Yeryüzünde bir nokta seç. Son bir haftada üzerinden hangi uyduların geçtiğini hesaplıyor, sonra çektikleri fotoğrafları bulup getiriyoruz. Her şey tarayıcında, kamuya açık verilerle çalışıyor.* |
| `sections` | *Kısaca · Geçişleri nasıl buluyoruz · Etiketlerin anlamı · Göremediklerimiz · Gizlilik · Kaynaklar · Klavye* |
| FAQ | *Canlı mı?* / *Tam olarak değil. Fotoğraflar, çekildikten birkaç saat ile iki gün sonra arşive düşer; bu yüzden en yeni geçişlerin henüz fotoğrafı olmayabilir.* · *Beni görebilir mi?* / *Hayır. Buradaki bir piksel en iyi durumda 10 m genişliğinde. Bir araba tek bir piksel. Görüntüde sen yoksun.* · *Bunlar bütün uydular mı?* / *Hayır. Askerî ve casus uyduların çoğu kamuya açık kataloglarda yok; şirketler de kameralarını nereye çevirdiklerini söylemiyor.* |
| method | *Yörüngedeki her nesnenin yolunu tanımlayan, kamuya açık bir sayı kümesi var. [CelesTrak] bunları ABD Uzay Kuvvetleri'nin takibinden yayımlar; biz de her altı saatte bir taze bir kopyasını alırız.* · *SGP4 ile, yani standart yörünge modeliyle, her uydunun son yedi gününü hesaplıyor ve seçtiğin noktanın onun görebildiği alana girdiği her anı not ediyoruz.* · *Tilting cameras* → *Eğilebilen kameralar*: *Birçok ticari uydu kamerasını 30–45 derece eğebilir. Menzilindeysen buna “Buraya bakabilirdi” diyoruz.* |
| `verdictMore` | §3.6 |
| privacy | *Arama sayılarını kasaba ve yaklaşık 10 km’lik bir alan düzeyinde tutarız, tam noktanı asla. Neyin açıldığını ve paylaşıldığını da sayarız. IP adresi yok, bize ait çerez yok, bir ziyareti ötekine bağlayan hiçbir şey yok.* |
| credits | labels *Yapan · Arşivler · Yörüngeler · Yer adları · Dünya dokuları · Yazı tipleri*; *Armaan, X’te [@armaangupt0]*; *Yörüngeler: CelesTrak yörünge elemanları; SGP4 için satellite.js.*; *Yazı tipleri: Instrument Sans ve Serif (Instrument), Martian Mono (Evil Martians), SIL OFL.*; *Map data © OpenStreetMap contributors (ODbL)* stays as OpenStreetMap words it |
| keys | *Bir yer ara · Öneriler arasında gezin · Seç · Geçişler arasında ilerle · Önceki / sonraki görüntü · Görüntüyü büyüt · Yakınlaştır (büyütülmüşken) · Tekrarı oynat ya da duraklat · Geri ya da kapat · Bu sayfa*; key names *Enter · Boşluk · Esc* |
| `builtBy` / `footerNote` | *Yapan: [@armaangupt0]* / *Kamuya açık verilerden yapıldı. Bu fotoğrafların hiçbirini biz çekmedik.* |

### 3.12 Curated places (`places`: copy, not data)

The stats keep the English label; on screen the Turkish reader sees these. Turkish exonyms where Turkish has an
established one, the name as it is otherwise; *ABD* and *BAE* in sublabels (universal in Turkish, as short as English).
Labels stay unique.

| id | label (chip) | sublabel |
|:--|:--|:--|
| area51 | Area 51 | Groom Gölü, Nevada, ABD |
| centralPark | Central Park | New York, ABD |
| giza | Gize Piramitleri (chip *Gize*) | Gize, Mısır |
| uluru | Uluru | Kuzey Bölgesi, Avustralya |
| palmJumeirah | Palm Jumeirah | Dubai, BAE |
| worldIslands | Dünya Adaları | Dubai, BAE |
| grandCanyon | Büyük Kanyon | Arizona, ABD |
| meteorCrater | Meteor Krateri | Arizona, ABD |
| lowerManhattan | Aşağı Manhattan | New York, ABD |
| lasVegasStrip | Las Vegas Strip | Nevada, ABD |
| hooverDam | Hoover Barajı ve Mead Gölü | Nevada ve Arizona, ABD |
| goldenGate | Golden Gate | San Francisco, ABD |
| kennedySpaceCenter | Kennedy Uzay Merkezi | Florida, ABD |
| washingtonDc | Washington, D.C. | National Mall, ABD |
| mountStHelens | St. Helens Dağı | Washington, ABD |
| niagaraFalls | Niagara Şelalesi | Ontario, Kanada |
| panamaCanal | Panama Kanalı | Gatun, Panama |
| rioDeJaneiro | Rio de Janeiro | Pão de Açúcar ve Copacabana, Brezilya |
| paris | Paris | Île-de-France, Fransa |
| venice | Venedik | Veneto, İtalya |
| vesuvius | Vezüv Yanardağı | Napoli, İtalya |
| istanbul | İstanbul | İstanbul Boğazı, Türkiye |
| chernobyl | Çernobil | Kyiv Oblastı, Ukrayna |
| tableMountain | Masa Dağı | Cape Town, Güney Afrika |
| kilimanjaro | Kilimanjaro | Kilimanjaro, Tanzanya |
| everest | Everest Dağı | Nepal ve Çin |
| angkorWat | Angkor Wat | Siem Reap, Kamboçya |
| singapore | Singapur | Marina Bay, Singapur |
| hongKong | Hong Kong | Victoria Limanı, Hong Kong |
| tokyo | Tokyo | Tokyo, Japonya |
| fuji | Fuji Dağı | Shizuoka, Japonya |
| sydneyHarbour | Sidney Limanı | Sidney, Avustralya |
| richat | Richat Yapısı | Sahra, Moritanya |
| greatBlueHole | Büyük Mavi Delik | Lighthouse Resifi, Belize |
| boraBora | Bora Bora | Fransız Polinezyası |
| hardyReef | Hardy Resifi | Büyük Set Resifi, Avustralya |
| male | Malé | Kuzey Malé Atolü, Maldivler |
| deadSea | Lut Gölü tuz havuzları | Güney havzası, İsrail ve Ürdün |
| binghamCanyon | Bingham Canyon Madeni | Utah, ABD |
| mountWhaleback | Mount Whaleback Madeni | Pilbara, Avustralya |
| etna | Etna Yanardağı | Sicilya, İtalya |
| santorini | Santorini | Kiklad Adaları, Yunanistan |
| teide | Teide | Tenerife, İspanya |
| kilauea | Kīlauea | Hawaii, ABD |
| craterLake | Crater Gölü | Oregon, ABD |
| glenCanyonDam | Glen Canyon Barajı | Page, Arizona, ABD |
| gardenCity | Garden City dairesel tarlaları (center-pivot fields; never *ekin çemberleri*, which are crop circles) | Kansas, ABD |
| almeria | Almería seraları | Endülüs, İspanya |
| gibraltar | Cebelitarık | Cebelitarık Boğazı |
| suezCanal | Süveyş Kanalı | İsmailiye, Mısır |
| aswanDam | Asvan Yüksek Barajı | Nasır Gölü, Mısır |
| wadiRum | Wadi Rum | Akabe, Ürdün |
| sossusvlei | Sossusvlei | Namib Çölü, Namibya |
| victoriaFalls | Victoria Şelalesi | Zambiya ve Zimbabve |
| threeGorges | Üç Boğaz Barajı | Hubei, Çin |
| shanghai | Şanghay | Huangpu Nehri, Çin |
| itaipu | Itaipu Barajı | Brezilya ve Paraguay |

### 3.13 Satellite blurbs (`sats`)

One plain sentence under the satellite's name. It follows the pass paragraph, which may end on a place-subject
sentence, so a blurb never opens with a bare possessive: name the instrument (*VIIRS görüntüleyicisi …*) or the
satellite type. Numbers written into the text are fixed copy and may take a suffix (*1999’dan beri*).

- *VIIRS görüntüleyicisi 3.040 km’lik bir şeridi tarar ve bütün gezegeni günde iki kez kapsar.*
- *MODIS görüntüleyicisi 1999’dan beri bütün gezegeni her seferinde 2.330 km’lik bir şeritle izliyor.*
- *Copernicus multispektral görüntüleyicisi: 13 bant, 10 m piksel, 290 km tarama genişliği.*
- *Gün doğumu–gün batımı yörüngesindeki Çin meteoroloji uydusu; düşük ışıkta çalışan bir MERSI görüntüleyicisi taşır.*
- *Japonya’nın meteoroloji uydusu: Asya ve Pasifik’in tam disk görüntüsünü her 10 dakikada bir alır.*

---

## 4. Glossary

"Never" means the form is wrong for this product, even where it is correct Turkish elsewhere. Turkish has no grammatical
gender, so the notes cover case, plural and register.

| English | tr | Notes |
|:--|:--|:--|
| satellite | uydu | Singular after any number. *radar uydusu, meteoroloji uydusu*. Never *satelit*. |
| a satellite (nameless) | bir uydu / Bir uydu | Written by the frame; `aSatellite` = *Bir uydu* in chips only. |
| pass (noun) | geçiş | *31 geçiş*; heading *GEÇİŞLER*. Never *pas, geçit*. |
| to pass, cross | geçmek: *üzerinden geçti, tepeden geçti, buranın 61 km batısından geçti* | Never *kesişmek*. Never bare *geçmez*. |
| to watch (product verb) | izlemek; passive *izlenmek* | Reserved for satellites watching places. Never *gözetlemek, dikizlemek, gözlemlemek, seyretmek, takip etmek* (the app *takip eder*). |
| Watched / Likely watched / Could have pointed here / Passed overhead | İzledi / Muhtemelen izledi / Buraya bakabilirdi / Tepeden geçti | §3.6. Never *Büyük ihtimalle*. |
| verdict (as a concept) | etiket | *Etiketlerin anlamı*, *Etikete göre geçişler* |
| swept over (verb) | taradı / tarandı | |
| passed within view | görüş alanından geçti (verb) / görüş alanındaydı (the place) | |
| in range | menzilde | Lane *MENZİLDE*. |
| field of regard, within view | görüş alanı | Never *görüş mesafesi* (meteorological visibility). |
| something (hero, hook) | bir şey | Never *biri*; never *bir şeyler* in a notice. |
| photo | fotoğraf | Only Sentinel-2 / Landsat optical pictures, where English says photo about them. |
| image | görüntü | The default. Never *resim, imaj, imge*; the one exception is *küçük resim* (thumbnail, the standard UI term). |
| closest look | en net görüntü | The most detailed clear photo (`photos.ts`), never *en yakın geçiş* (that would claim distance). |
| clear look / last clear look | bulutsuz görüntü / son bulutsuz görüntü | Never *bakış* (reads as "gaze"). |
| clear (sky at the spot) | hava açık; value *Yok* under *NOKTADA BULUT*; chip *Bulutsuz* | *açık* only for sky and in *kamuya açık*. |
| public image / made public | kamuya açık görüntü / kamuya açıldı | Never bare *açık* for "public". |
| published | yayımlandı | **Never *yayınlandı*** (broadcast). |
| archive | arşiv | *görüntü arşivi, kamuya açık arşiv, ticari arşiv* |
| scene | sahne | The archive's image tile only, never the 10 km crop; always beside a cue (*sahne genelinde*). |
| crop (of a scene) | kesit | *Arşiv bu kesiti göndermedi.* |
| swath / swath width | tarama şeridi / tarama genişliği | Label *TARAMA ŞERİDİ*; *Şeritte* (in swath). Never *koridor, bant*. |
| off-nadir | bakış açısı (card label) / *DİKEYDEN* (the pass view's readout strip, one line) / *dikeyden 5,3° eğik* (prose) / *dikeyden 5,3°* (row) | Never *eğim* (orbital inclination, terrain slope). Never *nadir* in any sense. |
| straight down | tam aşağı | *Tam aşağıya bakıyordu.* Never *tepeden bakıyordu* (condescending), *düz aşağı*. |
| ground track | yer izi | |
| orbit / orbital elements (TLE) | yörünge / yörünge elemanları (TLE) | Never *eleman setleri*. |
| catalog / object | katalog / nesne | *yörünge kataloğu*, *16.893 nesne* |
| altitude | irtifa | *786 km irtifadan*. Never *rakım* (ground elevation). |
| elevation (angle above the horizon) | ufuktan açı (from the place), ufkundan açı (from you) | Prose *ufkunun 62° üzerinde*. Never *yükseklik*. |
| in your sky | göğünde (label) | |
| ground distance | yatay uzaklık | |
| ground speed / heading | yer hızı / yön | |
| ascending / descending | yükselen / alçalan | Never *çıkan / inen* (stairs, passengers). |
| closest approach | en yakın an | *En yakın an · UTC* |
| cloud cover / cloud at spot | bulut örtüsü / noktada bulut | |
| cirrus / cloud shadow | sirrus / bulut gölgesi | *ince sirrus* |
| clouded over / mostly cloud | tamamen bulutlu / çoğunlukla bulut | |
| pixel / per pixel / resolution | piksel / piksel başına / çözünürlük | Never *10 m çözünürlüğe sahip*. |
| mosaic / daily mosaic / mosaic pixel | mozaik / günlük mozaik / mozaik pikseli | |
| true colour | gerçek renkli | |
| radar / radar image | radar / radar görüntüsü | Never *radar fotoğrafı*. |
| geostationary | yerdurağan | Never *jeostatik*. |
| full disc / scan line / image line | tam disk / tarama çizgisi / satır | |
| infrared / visible | kızılötesi / görünür | One word (TDK). Chip *IR*. |
| band | bant | |
| multispectral / panchromatic | multispektral / pankromatik | |
| time-lapse | zaman atlamalı (label) / zaman atlamalı görüntüler (in a sentence) | An adjective: alone only as a label. The MP4 is *video*. Never *timelapse*. |
| frame / the ground square | kare / alan | *Kare 3 / 12*; *aynı 10 × 10 km’lik alan*. Never *kare* for the square. |
| replay | yeniden oynat (accessible names, wide buttons) / Oynat (narrow buttons: pass footer, gallery card, photo viewer, geostationary row) / Tekrar (section, HUD) | Never *tekrar izle*, never *oynatma*. |
| acquiring / acquired / acquisition | alınıyor / alındı / görüntü alımı | Never bare *alım* (purchase). |
| imaged (instrument verb) | görüntülendi | |
| fetched (a file) | indirildi | |
| plan view | kuşbakışı çizim | |
| touch-ups | rötuş | About: *Hiçbir şey eklenmez ya da çıkarılmaz.* |
| which way is up | Kuzey nerede | |
| sub-solar point | güneş altı noktası | |
| sunlight / daylight / dark | güneş ışığı / gün ışığı / karanlık | |
| day / twilight / night | gündüz / alacakaranlık / gece | Never abbreviate *alacakaranlık*. |
| sun elevation | güneş açısı | |
| dawn–dusk orbit | gün doğumu–gün batımı yörüngesi | |
| steerable camera | yönlendirilebilir kamera | |
| sensor / imager | algılayıcı / görüntüleyici | Product names (MSI, OLI, VIIRS) stay. |
| operator | operatör | *uydu operatörü* is the standard term in Turkish space news. |
| private operator | özel şirket | Never *özel kamera* (*özel* also "special"). |
| commercial | ticari | |
| crewed / station | insanlı / istasyon | *insanlı uzay istasyonu*; never *ISS uydusu*. |
| weather satellite / imaging satellite | meteoroloji uydusu / görüntüleme uydusu | Filter chip *Hava*. |
| military and spy satellites | askerî ve casus uydular | |
| place / spot / your spot | yer / nokta / seçtiğin nokta, noktan (chips) | *bu yer, bu nokta, burası* |
| globe / pin | küre / raptiye | |
| share / download / copy | Paylaş / İndir / Kopyala | *Bağlantıyı kopyala* only where no link field is beside it. Never *Linki kopyala*. |
| link (field label) | Adres | |
| post (field label) | Metin | |
| save PNG / video | PNG kaydet / Video | |
| search a place | Bir yer ara | |
| use my location / locate me / near me / locating | Konumumu kullan / Beni bul / Yakınımda / Bulunuyor… | |
| surprise me | Beni şaşırt | |
| fault (notice label) | Arıza | Never *Hata!* |
| rare | ender | Never *nadir* (echoes the remote-sensing term). |
| last 7 days / this week / that week | son 7 gün / bu hafta / o hafta | |
| local time / UTC | yerel saat / UTC | Never *GMT* for UTC. |
| ago / just now / in 3 h | önce / az önce / 3 sa sonra | Never *şimdi* for "just now". |
| s / min / h / days | sn / dk / sa / gün | Unit symbols, no full stop. |
| km/s | km/sn | |
| try again / cancel / close / back | Yeniden dene / İptal / Kapat / Geri | |
| previous / next | Önceki / Sonraki | |
| zoom in / out, play / pause, expand | Yakınlaştır / Uzaklaştır, Oynat / Duraklat, Büyüt | |
| keys | Boşluk, Enter, Esc | |

**Compass, prose: four closed tables.** Messages receive an 8-point id (`n` … `nw`) or an index, never text, so each
form is written once in the catalog and nothing inserted is inflected.

| id | heading, "moving …" (+ *doğru*) | "N km … of here" (*buranın 61 km …*) | where, past (*…daydı*) | bare word |
|:--|:--|:--|:--|:--|
| n | kuzeye | kuzeyinden | kuzeydeydi | kuzey |
| ne | kuzeydoğuya | kuzeydoğusundan | kuzeydoğudaydı | kuzeydoğu |
| e | doğuya | doğusundan | doğudaydı | doğu |
| se | güneydoğuya | güneydoğusundan | güneydoğudaydı | güneydoğu |
| s | güneye | güneyinden | güneydeydi | güney |
| sw | güneybatıya | güneybatısından | güneybatıdaydı | güneybatı |
| w | batıya | batısından | batıdaydı | batı |
| nw | kuzeybatıya | kuzeybatısından | kuzeybatıdaydı | kuzeybatı |

**Compass, readouts (`pass.compass16`):** K, KKD, KD, DKD, D, DGD, GD, GGD, G, GGB, GB, BGB, B, BKB, KB, KKB, the Turkish
meteorological forms. Every bearing cell reads this table through `compassAbbr`, so no cell can show *SSW* beside *GGB*.
Never mix English letters into a bearing; never use these letters in a coordinate.

---

## 5. Grammar strategies for runtime slots

The general rule, stated once: **a runtime value is never followed by an attached suffix, an apostrophe, or a separate
word that harmonises with it** (*mı/mi/mu/mü, da/de* "also"). A suffix may sit on a fixed word after the slot (*2015
yılından, 31 geçişle, 290 km’lik, 10 dakikada*).

### 5.1 [PLACE]

Gazetteer names come in English, local spelling or local script (*Waterloo, Istanbul, İskenderun, 東京*), and their
pronunciation decides the ending (*Bordeaux’yu* is "bordo-yu").

| Allowed position | Example |
|:--|:--|
| Subject, nominative (the main tool: use a passive) | *Waterloo son 7 günde 256 uydu tarafından izlendi.* |
| Subject of a second clause | *WorldView Legion 4 geçerken Waterloo görüş alanındaydı.* |
| Before an invariant postposition | *Waterloo üzerinden · Waterloo için · Waterloo ile* |
| After a colon, as a label value | *Zaman atlamalı: Waterloo*, *Raptiye bırakıldı: Waterloo.* |
| Before *bu hafta* / *son 7 günde* / a comma | *Waterloo bu hafta …*, *Waterloo, Sentinel-2C tarafından…* |
| In a list with *ve* | *Waterloo ve çevresi* |

**The deictic for every oblique case.** When the name is already on screen (the headline names it), the rest of the
screen says *burası* and its forms, fixed words the translator inflects freely: *burası, burayı, buraya, burada,
buradan, buranın* (*Kamerasını eğseydi burayı izleyebilirdi. Buranın 61 km batısından geçti.*). Also free: *bu yer, bu
nokta, seçtiğin nokta, orası, orada*.

**Never:** *[PLACE]’da, ’yu, ’nın, ’a, ’dan, ’la, ’ki, -lı*; *[PLACE] mı?*, *[PLACE] de*; a generic noun added to carry
the case (*Waterloo bölgesini*), which changes what is named; an article (English's `placeInProse` / `placeParts` logic is
off); re-casing or "fixing" a label (*Istanbul* stays *Istanbul*, §8.5).

**Commas.** When `[PLACE]` is directly followed by a number or another name, put a comma after it (TDK allows a comma
after the subject to prevent ambiguity): *Waterloo, 7 uydu tarafından izlendi.*

### 5.2 [SAT] as subject, and the re-mention rule

Turkish has no grammatical gender (*o* is he, she and it), so a satellite's gender never matters. Its case does.

- **Subject:** *Sentinel-2C, 786 km irtifadan tam tepeden geçti.* The verb ending carries it from then on; never *O* as
  a subject.
- **Agent:** *[PLACE], [SAT] tarafından izlendi.* *tarafından* is written apart and takes a bare noun.
- **Its X:** the possessive on the fixed noun (*Radarı, Kamerasını*), but only while the satellite is the topic.
- **The re-mention rule.** A Turkish sentence without a subject takes the topic of the sentence before it. **After a
  sentence whose subject is `[PLACE]`, *burası*, or an impersonal statement (*Gündüzdü*, *Burada hava karanlıktı*,
  *Saat … idi*), the next sentence about the satellite names it again with the fixed word *uydu*:** *Uydu, kamerasını…*,
  *Uydunun tarama şeridi…*, *uydunun operatörü…*. A bare *gördü*, *Kamerasının…* or *Operatörü…* there would attach to
  the place (*Waterloo … izlendi. Yalnızca bulut gördü.* says Waterloo saw the cloud).
- **Object or possessor of a satellite in a footnote or aria text:** the compound *[SAT] uydusu* takes the suffix on
  *uydu* (*Sentinel-2C uydusunun görüntüsü*). Never for stations: *ISS uydusu* is wrong; use the colon frame (*İstasyon:
  ISS*) or *[SAT] istasyonu* only when the profile says crewed.
- **A nameless satellite** arrives as `undefined`: each frame writes *bir uydu* (mid-sentence) or *Bir uydu*
  (sentence-initial) itself. `aSatellite` (*Bir uydu*) is printed only by the chips and the plan callout.
- **Names that end in a digit or a code** (*Landsat 9, NOAA-21, Sentinel-2C*): a comma after the name when a number
  follows.
- **Two names:** *Umbra ve Capella*, never *Umbra ile Capella’nın*.

### 5.3 [NUM] with plural categories

| Noun | one | other | Notes |
|:--|:--|:--|:--|
| uydu | 1 uydu | 256 uydu | Never *uydular* after a number. |
| geçiş | 1 geçiş | 31 geçiş | |
| görüntü | 1 görüntü | 1.715 görüntü | |
| bulutsuz görüntü | 1 bulutsuz görüntü | 12 bulutsuz görüntü | |
| radar uydusu daha | 1 radar uydusu daha | 7 radar uydusu daha | |
| kez | 1 kez (with a num part) / *bir kez* (where English says "once") | 1.204 kez | |
| kare, nesne, sonuç | 1 kare | 12 kare, 16.893 nesne, 5 sonuç | |
| dakika, saat, gün | 1 dakika | 41 saat, 3 gün | |

- **one ≠ other** only where English says one as a word or the pronoun changes: *bir VIIRS görüntüsünü … bu geçiş* /
  *4 VIIRS görüntüsünü … bu geçişler*.
- **Zero** gets its own sentence wherever English has one: *hiçbir … -medi* or *… yok*. Never *0 görüntü*.
- **Counter words:** *tane* only when the noun is left out (*40 tane daha göster*) or in a partitive (*31 … görüntüsünden 4
  tanesini*). Never *adet*.
- **No suffix on a runtime number** (never *256’sı, 7’de, 2016’dan*), never an ordinal (*3.’sü, 3’üncü*). Position on
  screen: *Kare 3 / 12*; spoken: *Kare 3, toplam 12* (Turkish screen readers read the slash as *bölü*).
- **A runtime year** takes the suffix on *yıl*: *[YEAR] yılından beri*. A year or number written into translator text is
  fixed copy and may take its own suffix (*1999’dan beri*, *5°’den fazla*).
- **A suffix on a fixed unit** is allowed (*290 km’lik, 10 dk’da bir, 10 dakikada bir*); never on *%* or *°*.
- **"At least" and "more":** *En az [NUM] …*; *[NUM] … daha*.
- **Adjacency:** a number never follows a name without a comma or a word between them.

### 5.4 Lists of names

- `fmt('tr').list` (`Intl.ListFormat('tr', { type: 'conjunction' })`) gives *A, B ve C*: no serial comma. Use it as is.
- "A, B and 7 other radar satellites": the last item is *7 radar uydusu daha*: *Umbra, Capella ve 7 radar uydusu daha …*
- A list never takes a group suffix (*A, B ve C’nin*); it is a subject or sits before a postposition.

### 5.5 Dates and times inside sentences

| Need | Frame | Example |
|:--|:--|:--|
| A pass's moment, opening a paragraph | `[TIME]. [SAT], …` | *16:14:21 UTC. Sentinel-2C, …* |
| A moment inside a sentence | `saat [TIME] idi` | *saat yaklaşık 07:49 CET idi* |
| A dateline (posts) | `[DATE], yerel saatle [CLOCK].` | *1 Kasım Pazar, yerel saatle 11:21.* |
| A dateline (share page) | `[DATE], [CLOCK] [ZONE].` | *1 Kas 2026 Paz, 11:21 EST.* |
| A range in prose | `[DATE1] ile [DATE2] arasında` | *29 Eki ile 5 Kas arasında* |
| A range as a label | `[DATE1] → [DATE2]` | *26 Eki → 1 Kas 2026* |
| Since a runtime year | `[YEAR] yılından beri` | *2015 yılından beri* |
| Relative | `[NUM] saat önce`, `[NUM] sa sonra`, `az önce` | *41 saat önce* |

Never *[TIME]’de, [DATE]’de, [DATE]’ten, [DATE]’e kadar*.

### 5.6 Closed sets are written out in full

Compass points, seasons, verdicts, bands, sun phases and months are closed sets passed as ids or indexes. The catalog
writes every case form of each once (§4 compass tables), at no runtime cost, so sentences use natural forms (*güneye
doğru ilerliyordu, buranın 61 km batısından geçti, kuzeybatıdaydı*) instead of a stiff *batı yönünde* workaround.
Seasons: *her yıl kışın / ilkbaharda / yazın / sonbaharda* (a southern glacier's February is still *yazın*).

---

## 6. Typography and formatting

### 6.1 Punctuation

| Mark | Rule | Example |
|:--|:--|:--|
| Quotation marks | “…” outside, ‘…’ inside. Never «…», never straight quotes. | *buna “Buraya bakabilirdi” diyoruz* |
| Apostrophe | U+2019 before a suffix on a proper name, abbreviation or fixed number in **translator text** only. Never on a runtime slot, never on a common noun. | *NASA’nın, Sentinel-2’nin, Photon’a, X’te, Enter’a, 1999’dan* |
| Ellipsis | One character … (U+2026), no space before. Status lines end with it. | *Bağlantı oluşturuluyor…* |
| Dashes | En dash for ranges, no spaces: *2015–2026, 10–30 m*. No em dash. Hyphen only inside names. | |
| Arrow | The house arrow ` → ` for date ranges and "from → to" values. | *26 Eki → 1 Kas 2026* |
| Colon | A full sentence after it starts with a capital (TDK); a phrase or value stays lowercase. | *Bulut örtüsü: %25.* |
| Semicolon | Only between two short clauses with one subject; otherwise a full stop. | |
| Comma after the subject | When the subject is directly followed by a number or another name. | *Waterloo, 7 uydu…* |
| Spaces before punctuation | None. | |
| *mı/mi/mu/mü*, *de/da* | Written apart, after fixed words only. | *Canlı mı?*, *seni de* |
| *ya da* | Over *veya* in prose. | |
| Circumflex | Where meaning depends on it: *hâlâ* (still; *hala* is "aunt"), *askerî*, *kâr*. | |

**Suffixes on fixed names** (translators, by pronunciation): *NASA’nın, ESA’nın, NOAA’nın, EUMETSAT’ın, Copernicus’un,
Landsat’ın, Sentinel-1’in, Sentinel-2’nin, Planetary Computer’ın / ’a, CelesTrak’ın, Photon’a, Nominatim’e,
Open-Meteo’ya, OpenStreetMap’in, GeoNames’in, NASA GIBS’e, UTC’ye, X’te*. Letter-by-letter acronyms take the ending of the
Turkish letter name (*UTC’ye*: ce; *USGS’nin*: se; *TLE’nin*: e). The brand stays a bare subject (*Watched açılıyor*,
*Watched yükleniyor*) or becomes *bu site*.

### 6.2 Numbers

| Item | Format | Example |
|:--|:--|:--|
| Decimal separator | comma | *7,46 · 98,6° · 0,31 m* |
| Grouping | full stop, from 4 digits (CLDR tr, as `Intl` prints) | *1.715 · 12.847 · 35.778 km* |
| Negative | as `fmt('tr').dec` prints it (hyphen-minus) | *-3,2* |
| Digits | Western, always mono | |
| Source | `fmt('tr').int / .dec` only; never `toFixed` + replace | |
| Years | never grouped | *2015* |

### 6.3 Percent, degree, units, coordinates

| Item | Rule | Example |
|:--|:--|:--|
| Percent | **Sign before the number**, no space (TDK, CLDR tr). Plain strings: `` `%${f.int(n)}` ``. Rich parts: `num('%' + f.int(n))` (the sign inside the mono number; `{ n, u: '%' }` always renders after). Spoken: *yüzde 25*. The one hard-coded site, `PassDetail.tsx`'s cloud cell (`${f.int(pct)}%`), goes through a message (or a `fmt(locale).pct` built on `Intl.NumberFormat(…, { style: 'percent' })`, which prints *%25* in tr and *25%* in en). | *%25 · Bulut %25 · Bulutlu · %86 · İşleniyor %05* |
| Degree | Tight after the number. | *5,3° · ±45°* |
| Coordinates | **International, exactly as code writes them**: decimal point, N/S/E/W, no Turkish letters. `fmtLat / fmtLon`, the HUD's `sun`, the geostationary `seat` arrive written; translators never retype them. Prose puts an invariant word after the seat: *0.2°W boylamında*. | *41.0186°N 28.9784°E · Güneş 16.2°S 063.0°E* |
| Distance, speed | No-break space between number and unit. | *786 km · 10 m · 7,46 km/sn* |
| Time units in readouts | *sn, dk, sa, gün*, no full stop, space before. | *38 sn · 4 dk 12 sn · 1 sa 02 dk* |
| Units in mono caps | Never uppercased: the words around them take Turkish capitals (DESIGN §3). | *İRTİFA 786,2 km · 7,46 km/sn · 10 m* |

### 6.4 Dates and times

`Intl.DateTimeFormat('tr')` order: **day, month, weekday**.

| Use | Format | Example |
|:--|:--|:--|
| Prose, with weekday (spoken, posts) | d MMMM EEEE | *1 Kasım Pazar · 6 Kasım Cuma* |
| Day and month | d MMM | *29 Eki* |
| Short (`time.day`: rows, chips) | d MMM EEE | *1 Kas Paz* |
| `time.weekdayShort` / `dayCompact` | EEE / EEE d | *Paz* / *Paz 1* (never two-letter weekdays: Turkish has no standard set) |
| `time.stamp` | d MMM EEE · HH:mm ZONE | *1 Kas Paz · 11:21 EST* |
| Card stamp (with the year) | d MMM y EEE · HH:mm ZONE | *1 Kas 2026 Paz · 11:21 EST* |
| Ranges | `formatRangeToParts`, the shared literal replaced by ` → ` (never `formatRange`'s *29 Eki – 5 Kas*) | *1 → 8 Kas · 29 Eki → 5 Kas · 12 → 19 Kas 2026 UTC* |
| Machine stamps | ISO, unchanged | *2026-11-08 03:31Z* |
| Time of day | 24 h, colon, zero-padded | *16:14:21 · 07:49* |
| Relative (`time.relative`) | built from `relativeParts` by hand, no full stop on units | *az önce · 12 dk önce · 30 sa önce · 3 gün önce · 3 sa sonra* |
| Relative, spoken | `Intl` `long` | *12 dakika önce · 41 saat önce · 3 saat sonra* |
| Durations | | *38 sn · 4 dk 12 sn · 1 sa 02 dk* |
| At sea | | *UTC−9 · denizde* |
| Countdown | unchanged | *T−00:42* |

- Short months *Oca Şub Mar Nis May Haz Tem Ağu Eyl Eki Kas Ara*, weekdays *Pzt Sal Çar Per Cum Cmt Paz*, from `Intl`,
  never a hand table. Month and weekday capitalised inside a date (TDK: *1 Kasım Pazar*).
- **Time uses a colon**, never TDK's full stop (*16.14* would look like a grouped number).
- **Zone abbreviations are unchanged** (*EST, CET, JST, UTC+3*). Istanbul shows *UTC+3*. *TSİ* is rejected: it would need a
  Turkish-only exception in a shared formatter, for one zone.
- `Intl` short relative prints *41 sa. önce*: do not use it; the product prints *41 sa önce*.

### 6.5 Capitalisation

- **Sentence case everywhere**: headlines, buttons, section titles, About headings. Turkish never uses title case.
- Proper nouns keep their capital; common nouns never get one. **Dünya** (the planet) capitalised; **güneş** lowercase in
  phrases (*güneş hiç doğmadı*).
- Code that capitalises a Turkish first letter uses `toLocaleUpperCase('tr')`: *ince sirrus → İnce sirrus*, *ışık →
  Işık*. `toUpperCase()` gives *Ince*, a misspelling.

### 6.6 Uppercase mono labels (dotted and dotless i)

Turkish has four i letters: **i / İ** (dotted) and **ı / I** (dotless). Uppercase *i* is *İ*; lowercase *I* is *ı*.
Getting this wrong is a spelling mistake (*PIKSEL* is not a word).

| Lowercase | Correct caps | Wrong |
|:--|:--|:--|
| piksel | PİKSEL | PIKSEL |
| irtifa | İRTİFA | IRTIFA |
| geçişler | GEÇİŞLER | GEÇIŞLER |
| hız | HIZ | HİZ |
| beni şaşırt | BENİ ŞAŞIRT | BENI ŞAŞIRT |
| eki (October) | EKİ | EKI |

**One rule, no per-name code.**

1. `<html lang="tr">` (the boot script sets it). CSS `text-transform: uppercase` then follows Turkish rules at no cost,
   and the fonts' Turkish `locl` feature switches on (Instrument Sans, Instrument Serif and Martian Mono map *i* to
   *i.loclTRK*), so the *f_i* ligature no longer swallows the dot of *i*.
2. **Turkish rules apply to the whole Turkish label, names included**: *SENTİNEL-2C · MSI · 10 m*, *GÖRÜNTÜ ALIMI ·
   SENTİNEL-2C*, the video's place line *PARİS*. Turkish typesetting caps foreign names this way in every headline and
   ticker (*LİVERPOOL, WİKİLEAKS*), and it is what the card renderers (`api/_lib/card.ts mono()`, `src/ui/share/card.ts`
   `caps`), the video (`video.ts upper`) and the HUD already do with `toLocaleUpperCase('tr')`.
3. **Wholly English elements are uppercased with English rules**: the licence credits. Put `lang="en"` on the gallery's
   `.credit` span (inside `.cap`, which uppercases) and the photo viewer's `.credit` span (inside `.metaText`); on the
   card, uppercase the credit chip with `toLocaleUpperCase('en')` instead of the card's language. Without this a Turkish
   page prints *CONTAİNS MODİFİED COPERNİCUS SENTİNEL DATA 2026*. The video's credit is already written in English
   capitals.
4. **Never lowercase an identifier with Turkish rules**: *ISS* becomes *ıss*.
5. **Never uppercase** the wordmark *Watched.*, the domain, the serif accent, prose.
6. Catalog names that arrive in ASCII capitals (*GOKTURK 2, IMECE, RASAT*) are data: never "fixed" to *Göktürk / İMECE*.

### 6.7 Line breaking

- Keep together (no-break space or a `nowrap` span): a number and its unit, *%* and its number, *En az* and the number,
  `[NUM]` and its noun in headlines, a clock and its zone, *Kare 3 / 12*.
- **No automatic hyphenation**: Turkish words are long and agglutinated, browser support is uneven, and *izlen-di* in a
  display headline reads badly.
- Prefer a break after a comma or before *tarafından*; balance display headlines with `text-wrap: balance` (free).
- Long words to plan for: *yönlendirilebilir* (17), *görüntüleyicisi* (15), *kullanılamıyor* (14), *kızılötesiyle* (13),
  *alacakaranlık* (13), *oluşturuluyor* (13).

### 6.8 Abbreviations

- Unit symbols without a full stop: *km, m, km/sn, sn, dk, sa*. They are symbols, as Turkish apps print them (*3 sa*),
  not abbreviated words.
- Compass readouts: the 16-point Turkish letters (§4). Coordinates: international letters (§6.3).
- No other abbreviated words in labels (*YÜKSELEN / ALÇALAN*, *alacakaranlık* in full). The only abbreviations are
  *ABD, BAE, 3B, IR, OK, TLE* and product codes.

### 6.9 Credits and licence lines

- Licence notices stay **verbatim in English** wherever they appear: *Contains modified Copernicus Sentinel data 2026*,
  *Contains modified EUMETSAT Meteosat data 2026*, *Landsat imagery courtesy of the U.S. Geological Survey and NASA*,
  *Landsat: USGS / NASA*, *NASA GIBS / EOSDIS*, *Himawari: JMA, via NASA GIBS*, *GOES: NOAA / CIRA, via NASA GIBS*, *Map
  data © OpenStreetMap contributors (ODbL)*. They are uppercased with English rules (§6.6 point 3).
- Their About labels are translated, with a colon frame: *Yapan, Arşivler, Yörüngeler, Yer adları, Dünya dokuları, Yazı
  tipleri*.
- The time-lapse's pre-frame source line is Turkish (*Copernicus Sentinel-2, Planetary Computer üzerinden*) and follows
  Turkish caps.

### 6.10 Type checks for whoever builds the tr styles

- Turkish uses the Latin faces as they are: no size or tracking change.
- Check *İ Ğ Ş Ç Ö Ü* in the condensed display face at `line-height: 0.92` and inside the `Reveal` clip-path mask: the dot
  of *İ* and the breve of *Ğ* sit above cap height, the cedilla of *Ş Ç* below the baseline. A headline that starts with
  *İskenderun* must not lose its dot.
- Check the serif italic accent with *ş, ğ, ı* (*Şanlıurfa, Muğla, Iğdır*).

---

## 7. Length discipline

- **Prose:** about the same in characters (−10 % to +15 %), 25–40 % fewer words. *In the last 7 days, 256 satellites
  watched Waterloo.* (52) → *Waterloo son 7 günde 256 uydu tarafından izlendi.* (49).
- **Buttons and labels:** often longer (+20 % to +100 %), because the object takes an accusative ending and verbs are
  long.
- **Words:** the average Turkish word is 7–8 letters; a narrow column fills unevenly.

**Strategies, in order:**

1. **Drop the object when the icon or the field beside it shows it**: *Kopyala* beside the *ADRES* field, *İndir* beside
   the image, *Paylaş* under the photo. The full form goes in `aria-label`.
2. **Nouns in readout labels**, the shortest true one: *YÖN, HIZ, İRTİFA*.
3. **The short native term already standard**: *Yakınımda, İptal, Adres, Metin*.
4. **Never abbreviate a word**, never drop a suffix (*Bağlantı kopyala* is ungrammatical). Rephrase, or use the layout's
   icon-only form.
5. **Never change the fact to save space.** *FOTOĞRAF* for a lane with radar images, *En yakın geçiş* for the most
   detailed photo: wrong labels, not short ones.

| English | tr | en → tr | Note |
|:--|:--|:--|:--|
| SURPRISE ME | BENİ ŞAŞIRT | 11 → 11 | |
| USE MY LOCATION / LOCATE ME / NEAR ME / LOCATING… | KONUMUMU KULLAN / BENİ BUL / YAKINIMDA / BULUNUYOR… | 15 / 9 / 7 / 9 → 15 / 8 / 9 / 10 | |
| OR TRY | ÖRNEKLER | 6 → 8 | |
| HOW THIS WORKS | NASIL ÇALIŞIR | 14 → 13 | |
| LAST 7 DAYS | SON 7 GÜN | 11 → 9 | |
| CLOSEST LOOK / LAST CLEAR LOOK | EN NET GÖRÜNTÜ / SON BULUTSUZ GÖRÜNTÜ | 12 / 15 → 14 / 20 | chip ≤ ~20 |
| TIME-LAPSE | ZAMAN ATLAMALI | 10 → 14 | |
| OFF-NADIR | BAKIŞ AÇISI (card) / DİKEYDEN (pass strip) | 9 → 11 / 8 | |
| ALTITUDE / PIXEL / SPEED | İRTİFA / PİKSEL / HIZ | 8 / 5 / 5 → 6 / 6 / 3 | |
| MOSAIC PIXEL | MOZAİK PİKSELİ | 12 → 14 | QA in the 155 px column |
| PASSES | GEÇİŞLER / GEÇİŞ | 6 → 8 / 5 | |
| PHOTO / LIKELY / COULD / OVERHEAD | GÖRÜNTÜ / MUHTEMEL / MENZİLDE / TEPEDEN | ≤ 8 → ≤ 8 | the week card's 116 px columns |
| LINK / POST | ADRES / METİN | 4 → 5 | the 48 px column |
| COPY LINK | KOPYALA | 9 → 7 | |
| POST TO X / SAVE PNG / SHARE IMAGE | X’TE PAYLAŞ / PNG KAYDET / GÖRÜNTÜYÜ PAYLAŞ | 9 / 8 / 11 → 11 / 10 / 16 | the last is the full-width primary |
| REPLAY | OYNAT (pass footer, gallery card, photo viewer) / TEKRAR (section) | 6 → 5 / 6 | *YENİDEN OYNAT* (13) overflows the pass footer beside the share button |
| CLOUD AT SPOT | NOKTADA BULUT | 13 → 13 | |
| GROUND SPEED / SUN ELEVATION | YER HIZI / GÜNEŞ AÇISI | 12 / 13 → 8 / 11 | |
| VIDEO FAILED / SAVE VIDEO / RENDERING 05% | VİDEO HATASI / KAYDET / İŞLENİYOR %05 | 12 / 10 / 13 → 12 / 6 / 13 | one 132 px button |
| SEE WHAT WATCHED YOU | SENİ NEYİN İZLEDİĞİNİ GÖR | 20 → 25 | QA at 466 px; fallback *SENİ NE İZLEDİ, GÖR* (19) |

**Known tight spots to check in QA:** the readout strip's *DİKEYDEN* and *NOKTADA BULUT* cells on a 360 px phone; the
sun unit *alacakaranlık* (let it wrap under the value); the band value *Kızılötesi* (10, budget ~9) at 21 px; the pin
card's *Çevrede yer adı yok* in 156 px at 13 px; the time-lapse waiting rows on a 280 px picture; the card footer CTA;
*YERDURAĞAN* in the timeline lane (hidden on phones, as in English).

---

## 8. Sensitive content

### 8.1 Surveillance and privacy

- *izlemek* is neutral to uncanny in Turkish (*Biri seni izliyor* is the classic line). Never upgrade it: no
  *gözetlemek, fişlemek* (profiling, loaded in Turkish politics), *dikizlemek, casusluk yapmak, takip altında*, **never
  *gözaltı*** (police custody).
- *Gözetim* only where English says surveillance, which the UI never does.
- Privacy copy states facts and stops: *Yalnızca yaklaşık 10 km’lik bir alanı saklarız. IP adresi yok, bize ait çerez
  yok.* No reassurance formulas (*Verileriniz güvende*), no legal claims (no KVKK unless the English cites a law).
- *çerez, IP adresi, konum*. Never *kişisel verileriniz* where English says "your spot". *hücre* is not used for the
  stored area (it reads as biology or prison): *alan*.
- Military: *askerî ve casus uydular* in About, because the English says it. Elsewhere nothing more.

### 8.2 War zones in the time-lapse (Gaza Strip, West Bank, Ukraine, Lebanon)

- The captions say only what the frames are: *12 bulutsuz görüntü · her yıl yazın*; otherwise *yılda bir*.
- No word the English does not have: no *savaş, yıkım, bombardıman, işgal, katliam, soykırım, terör, şehit*. Turkish media
  use several routinely; the product does not editorialise in any direction.
- If translator text ever names the zones: *Gazze Şeridi, Batı Şeria, Ukrayna, Lübnan*, no qualifiers (*işgal
  altındaki*, *sözde*).
- **Earthquake region.** Turkish readers will open the time-lapse over the 6 February 2023 earthquake zone
  (Kahramanmaraş, Hatay, Adıyaman, Malatya): frames show collapse, demolition and rebuilding. The caption stays the
  generic one: no *afet* label, no dates, no tolls.

### 8.3 Glaciers

*buzul*; the same season caption (*her yıl yazın*). No climate rhetoric (*iklim krizi, yok oluyor, eriyip gidiyor*): the
frames show it.

### 8.4 Country names and disputed places

- Country names come from `Intl.DisplayNames('tr')` (CLDR), never a hand list: *Amerika Birleşik Devletleri, Birleşik Arap
  Emirlikleri, Filistin Bölgeleri, Tayvan, Kıbrıs, Kosova, Ukrayna, Çin Hong Kong ÖİB*. Long ones stay: the "where" line
  ellipsises and never wraps a chip. Hand-written curated sublabels use *ABD* and *BAE*.
- **Taiwan:** *Tayvan*. Never *Çin Cumhuriyeti*, never *Çin’in Tayvan eyaleti*.
- **Cyprus:** *Kıbrıs* for CY. The product never adds *KKTC* or *GKRY*. A gazetteer label for a northern town may be its
  English or Greek form (*Kyrenia*); it stays as given.
- **Ukraine:** translator text writes the gazetteer's forms *Kyiv, Kharkiv, Odesa*, so one city is spelt one way on a
  screen. *Kırım* is part of *Ukrayna* in the product's outlines, as in English.
- **Aegean, Persian Gulf, Kurdish and Armenian names:** whatever the gazetteer says, unchanged. Never swap in Turkish
  exonyms (*Midilli* for Lesbos, *Basra Körfezi*) or remove them.

### 8.5 Place labels are data

The offline list prints GeoNames forms, so a Turkish reader will see *Istanbul* (no dot) next to *İskenderun*. Fixing that
is a data decision (a per-language name table would enlarge every search's download and the place files in git), not a
translation one. Translators never patch a place name inside a string, and code never re-cases one. The curated places
(§3.12) are copy and are spelt the Turkish way (*İstanbul*). Search already folds *İ, I, ı, i, ç, ş, ğ, ö, ü* (`placeKey`),
so typing *İstanbul* or *Iğdır* finds the place.

---

## 9. Pitfalls specific to Turkish, and the reviewer's checklist

### 9.1 False friends and ambiguous words

| Word | The trap | Rule |
|:--|:--|:--|
| izlemek | also "watch TV", "follow"; *izlendi* is a video's view count. | Satellites watching places only. Never *izlendi* next to *kez*. Never on a UI action. |
| geçiş | also "transition", "access". | Fine in context; never *pas*. |
| geçmez | also "fails", "won't do". | *geçip gitmez*. |
| sahne | everyday "stage". | Always with a cue. The HUD's replay clock is *Tekrar*. |
| nadir | astronomy's nadir, everyday "rare". | Never in copy; *tam aşağı, dikeyden, bakış açısı*; "rare" is *ender*. |
| eğim | orbital inclination, terrain slope. | Never for off-nadir. |
| bakış | "gaze". | Only inside *bakış açısı*; a look is *görüntü*. |
| açık | clear, open, light, public. | *kamuya açık* for public; *hava açık* for sky; *bulutsuz* for a clear picture. |
| yakında | "nearby" and "soon". | *Çevrede* for nearby on the pin card. |
| yerine | "instead". | *Kendi yerini ara*, never *Kendi yerine bak*. |
| alım | "purchase", "intake". | *görüntü alımı*. |
| yayınlamak / yayımlamak | broadcast / publish. | Archives *yayımlar*. |
| özel | private, "special". | *özel şirket*, *arşivi kapalı*. |
| kare | frame, square. | *kare* for frames, *alan* for ground. |
| tepeden | overhead, "condescendingly". | *Tepeden geçti*; *Tam aşağıya bakıyordu* for nadir. |
| fotoğraf / görüntü / resim | photo / image / drawing. | *görüntü* by default; *fotoğraf* for optical photos; *resim* only in *küçük resim*. |
| hücre | cell (biology, prison). | *alan*. |
| hala / hâlâ | aunt / still. | *hâlâ*. |
| satelit | satellite state. | *uydu*. |
| rakım | ground elevation. | *irtifa*. |
| *-ma/-me* nouns | *Kaydetme* reads "Don't save". | Never on buttons or section titles. |

### 9.2 Calques to catch

*sahip olmak* (have), *tarafından* outside its frames, *-mektedir*, *-dır* on facts, *bir* for every "a", *O* or *Sen* as a
subject, *olarak* after every noun, *gerçekleştirmek*, *iniş yapmak* for "land", *yapmak* + noun where a verb exists,
English comma placement after an opening adverbial (*Son 7 günde,*), a bare possessive after a place-subject sentence.

### 9.3 Reviewer's checklist (run it on every string)

1. **Register:** sen throughout; no *-iniz, -sınız*, no *Seçin*; no *lütfen*, no apology.
2. **Slots are bare:** no apostrophe or suffix after `[PLACE]`, `[SAT]`, `[NUM]`, `[TIME]`, `[DATE]`, `[YEAR]`, a zone or a
   list; no *mı/mi* or *de/da* after one. A suffix sits on the fixed word after it.
3. **A comma** separates a name from a following number or name.
4. **Oblique cases of the place** use *bura-* when the name is on screen.
5. **Re-mention:** after a place-subject or impersonal sentence, the satellite is named again (*Uydu…*).
6. **Numbers:** nouns and verbs singular after numerals; one = other unless English uses a word; zero has its own
   sentence; *tane* only without a noun or in a partitive.
7. **Number format:** decimal comma, full-stop grouping, *%25* sign first, *5,3°* tight, *786 km* no-break.
8. **Coordinates** exactly as code writes them; **bearings** in Turkish letters; **prose directions** from the closed
   tables.
9. **Dates:** day, month, weekday; colon in times; ranges with ` → `; no zero-padded days.
10. **Uppercase:** every Turkish *i* is *İ* and every *ı* is *I* in caps, names included; licence credits uppercased with
    English rules.
11. **Vocabulary** matches the glossary (*izlemek* for satellites only, *görüntü* by default, *yayımlandı*, *bakış açısı*,
    *irtifa*, *geçiş*, *operatör*, *en net görüntü*, *bulutsuz görüntü*).
12. **Verdict words** from §3.6 only, the same on every surface; `verb` active.
13. **Honesty:** the label says exactly what is on screen (*GÖRÜNTÜ* for a lane with radar, *sahne* for the scene, *En az*
    while the count can grow, *en net görüntü* for the most detailed clear photo).
14. **Accent and bold:** one serif accent per screen (the place, or *seni*); the headline's strong run is **[NUM] uydu
    tarafından izlendi**.
15. **Never-translate list:** *Watched.*, *www.watched.earth*, satellite, sensor, product, agency and programme names,
    NORAD IDs, *UTC*, zone abbreviations, the licence lines, *via* in the post credit.
16. **Buttons:** bare stems or real nouns; no *-ma/-me*; no *izle*.
17. **Length:** fits its slot at the narrowest layout (§7); nothing abbreviated with a full stop; no suffix dropped.
18. **Tone:** no exclamation marks, no marketing words, no *-mektedir*, no *Bir şeyler ters gitti*; 6–14 words.
19. **Spelling:** TDK, including *hâlâ, askerî, kızılötesi, yeryüzü, Dünya* (planet), *ya da* apart.
20. **Neutral names:** CLDR country names; gazetteer labels unchanged; no political qualifiers; war-zone and earthquake
    captions say only the season and the count.
21. **Read it aloud once.** If a native speaker would add a suffix to make it sound right, the frame is wrong: rebuild it
    with a passive, a postposition, the deictic, a fixed noun after the slot, a log stamp or a dateline.

---

## Decisions log

The critique's 53 items: 38 accepted, 15 partly accepted, 0 rejected.

| # | Item | Resolution |
|:--|:--|:--|
| 1 | Dropped subjects attach to the place | Accepted: re-mention rule in §5.2; cloud channels, likely/could posts, `inSwath`, `notPublished`, `could.*` rewritten with *uydu* / *Görüntüde* (§3.4, §3.5). |
| 2 | Coordinate and compass rules contradict the code | Partly accepted: coordinates international everywhere, K/G/D/B coordinate examples removed, seat kept as written with *boylamında* (it arrives pre-formatted, so prose cannot spell it out); 16-point readouts stay Turkish letters, because `compassAbbr` reads the `pass.compass16` catalog for every cell, so *GGB* never sits beside *SSW*. |
| 3 | Verdict `verb` used in the active | Accepted: verbs *izledi / taradı / görüş alanından geçti / tepeden geçti*; headlines never built from `verb` (§3.6). |
| 4 | Second person removed | Accepted: *seçtiğin nokta* in prose, *noktan* in chips, *ufkunun, tepende, sokaklarını değil, bulutlarını* (§1.4, §3.4, §3.8). |
| 5 | MUHTEMEL and OLASI are synonyms | Accepted: lane *MENZİLDE*. |
| 6 | EĞİM collides with inclination | Accepted: label *BAKIŞ AÇISI* (card), *DİKEYDEN* (pass strip, one line), row *dikeyden 5,3°*. |
| 7 | *bakış* reads as "gaze" | Partly accepted: *bakış* out, *bulutsuz görüntü* in; but "Closest look" is the most detailed clear photo (`photos.ts`), so *En net görüntü*, not *En yakın geçiş*, which would claim distance. |
| 8 | Compass words are a closed set | Accepted: four full tables (§4), *irtifadan* chosen over *irtifada*. |
| 9 | `since` is a runtime slot | Accepted: *[YEAR] yılından beri*. |
| 10 | `aSatellite` mid-sentence | Partly accepted: sentences already receive `sat` undefined and write *bir uydu / Bir uydu* themselves; `aSatellite` is *Bir uydu* for chips only, so no comparison code is needed. |
| 11 | `hookPassed` loses "you" | Accepted: *Bu hafta tependen ne geçti?* |
| 12 | Uppercase rule for names | Accepted, extended: Turkish rules for whole labels; `lang="en"` on the gallery and viewer credits, and the card's credit chip uppercased with English rules (it is uppercased in the card's language today). |
| 13 | Percent needs code | Partly accepted: sign inside the num part, `fmt().pct` optional; only `PassDetail.tsx`'s cloud cell is hard-coded, `ComputingBody` already uses `computing.percent`. |
| 14 | Share sheet labels do not fit | Accepted: *Adres, Metin, Kopyala*, and the other sheet strings (§3.10). |
| 15 | latin-ext fonts arrive late | Accepted: per-locale preload of the two files for tr (§0); no added bytes. |
| 16 | "Locating…" changes width | Accepted: *Bulunuyor…*, *Beni bul*. |
| 17 | Slash read as "divided by" | Accepted: *…, toplam …* in every spoken position. |
| 18 | Week stamp loses its year | Accepted: *26 Eki → 1 Kas 2026*, computed from the end day. |
| 19 | *her yaz bir* | Accepted: *her yıl kışın / ilkbaharda / yazın / sonbaharda*. |
| 20 | Comma-decimal coordinates not parsed | Accepted: hint *Ad, adres ya da 41.01, 28.98*; the parser tweak is left to the owner (open question). |
| 21 | Hook out of step with the hero | Accepted: *Bu hafta bir şey seni de izledi.* |
| 22 | Sub line singular/plural | Accepted: *bütün uyduları*. |
| 23 | About lede *Hepsi* | Accepted: *Her şey … çalışıyor.* |
| 24 | Time-lapse note coordination | Partly accepted: rebuilt around *Sentinel-2’nin … çektiği bir görüntü*, but *hedeflenir* (a year falls back to any clear date, so *seçilir* overclaims) and *renkleri ayarlandı* (not noun + *yapmak*). |
| 25 | "still" dropped | Accepted: *Bağlantı yavaş, hâlâ yükleniyor*. |
| 26 | *Kareler oluşuyor* | Accepted: *Kareler işleniyor*. |
| 27 | *menzilden geçti* | Accepted: *menzile girdi*, with *1 kez* where English keeps a num part. |
| 28 | Two terms for "within view" | Accepted: *görüş alanı* only. |
| 29 | *çıkan / inen* | Accepted: *Yükselen / Alçalan*. |
| 30 | Replay | Accepted: *Yeniden oynat* in accessible names, section *Tekrar*; the narrow word *Oynat* on the pass footer, the gallery card, the photo viewer and the geostationary row (*Yeniden oynat* overflowed the pass footer). |
| 31 | *operatör* ban overstated | Accepted: *operatör* throughout. |
| 32 | "Show 40 more" noun, *tane* | Accepted: *40 tane daha göster*, *12 kaldı*; *tane* rule in §5.3. |
| 33 | Time phrases, semicolon | Accepted: the log stamp opens pass paragraphs; semicolon only within one subject. |
| 34 | Minus sign and abbreviation dots | Accepted: minus as `Intl` prints it; *sn, dk, sa* are unit symbols. |
| 35 | About imaged line uses *-dir* | Partly accepted: *ta kendisi*, but *görüntü*, not *fotoğraf* (the verdict covers radar and mosaics). |
| 36 | *nadir* banned too broadly | Accepted: "rare" is *ender*; *nadir* never appears. |
| 37 | Readout labels | Partly accepted: *YATAY UZAKLIK, UFUKTAN AÇI, UFKUNDAN AÇI, GÖĞÜNDE, En yakın an, Tarama çizgisi, yukarıda, Şeritte, Aralık*; "In view" is *Görüş alanında*, not *Görüşte* (not idiomatic). |
| 38 | *hücre* | Accepted: *alan*. |
| 39 | Card headline blocks | Accepted: no comma after a cut place, comma inside the accent, three blocks for could and overhead. |
| 40 | *[SAT] uydusu* for stations | Accepted. |
| 41 | `dayCompact` | Accepted: *Paz 1*. |
| 42 | Card footer CTA length | Accepted: kept with a tested fallback. |
| 43 | Long CLDR country names | Accepted: kept; ellipsis rule; *ABD / BAE* in curated sublabels. |
| 44 | Curated place names missing | Partly accepted: table completed for all 60 ids, with *İstanbul Boğazı* (the strait) instead of *Boğaziçi* (the region) and *dairesel tarlalar* for Garden City. |
| 45 | Share page and card frames missing | Partly accepted: adopted, with *kamuya açık* instead of bare *açık* (it also reads "clear"), *bestFrom* and *cardAlt* as subject-verb sentences, *görüntü* where the card may hold a mosaic. |
| 46 | Fault notice, engine readout, footnotes | Partly accepted: adopted, with *meteoroloji uydusu görüntüsü* instead of *hava durumu görüntüsü*. |
| 47 | Dark-place and zero-reason sentences | Partly accepted: sentences adopted; `results.why.*` are already whole sentences, so the "fragments" claim is outdated. |
| 48 | Search and locate strings | Partly accepted: adopted, but `orTry` is one key shown on phones and wide screens, so *Örnekler*, not *Ya da şunları dene* (18 characters on the phone chip row). |
| 49 | Gallery, globe, HUD strings | Partly accepted: adopted, with *Çevrede yer adı yok* (*Yakında* also means "soon"), *Görüntü alımı · [SAT]* (bare *Alım* reads "purchase"), *Yer adı bulunuyor*. |
| 50 | Video and time-lapse buttons | Partly accepted: adopted, but `linkCopied` is *Kopyalandı*: *Bağlantı kopyalandı* overflows the button in mono caps. |
| 51 | Glossary additions | Partly accepted: adopted, except *yörünge elemanları* (not the calque *eleman setleri*) and *gün doğumu–gün batımı yörüngesi* (*alacakaranlık* already covers dawn). |
| 52 | File names break on *ı* | Accepted: reuse `placeKey`'s `SPELLED` table in `slug()` and `slugOf()`. |
| 53 | Intl range separator | Accepted: `formatRangeToParts` joined with ` → `. |

**Other corrections from checking the code** (not raised by the critique):

- The card's licence credit chip goes through the card language's `caps`, so a Turkish card would print *CONTAİNS
  MODİFİED…*: it is uppercased with English rules (§6.6).
- `compassAbbr` already reads the catalog, and `ComputingBody` already formats its percentage through a message: the
  critique's claims about `PassDetail.tsx:355` and `ComputingBody.tsx:160` are outdated.
- The pass paragraphs open with the log stamp so that the satellite stays the topic of every following sentence (the
  re-mention rule then only applies to `likely`, `could` and post frames).
- The timeline's spoken summary is title-first (*İzledi: 12 geçiş.*), never *12 izledi*.
- A one-day window is *son 24 saatte* / *Son 24 saat*.
- The geostationary frame chip says *Kamuya kapalı*, not *Açık görüntü yok*; the HUD's replay clock label is *Tekrar*,
  not *Sahne*; the gallery's north arrow is *K*.
- The English `searchDown` example *43.47, −80.54* uses U+2212, which `parseCoordinates` rejects when the example is
  pasted; the Turkish string keeps the example exactly (owner question).
