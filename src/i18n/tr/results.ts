/**
 * Turkish copy for the results panel (see docs/i18n/tr.md §3.3, §3.6, §3.8, §5, §6, §7): the headline and its second
 * line, the reasons behind a zero, the summary's readouts and footnotes, the computing readout, the headers and footers,
 * the timeline, the replay, the plan view, the geostationary list, the pictures' product lines and the time-lapse row.
 *
 * Why it is built this way:
 *  - **The headline makes the place its subject, in the passive**: `*Waterloo* son 7 günde **256 uydu tarafından
 *    izlendi**.` An active sentence would need a case ending computed for the name (*Waterloo’yu*), which code cannot
 *    know (§5.1); the passive keeps it bare, and the Turkish news sentence leads with it. *son 7 günde* keeps names like
 *    *Area 51* from running into the count; an older week (`29 Eki ile 5 Kas arasında`) follows a comma, as every name
 *    directly followed by a number does (§5.1, §6.1). A one-day window says *son 24 saatte*. Nothing at all is the
 *    natural negative *hiçbir … izlenmedi*, never *0 uydu*. The accent is the place only, the strong part the count
 *    and the verb, the full stop outside it.
 *  - **The second line** is `[K] görüntü kamuya açıldı.` (*kamuya açık*: bare *açık* also reads "clear"); *En az*, its
 *    strong part, stands right before the number, so the sentence reads with and without it. *görüntü*, never
 *    *fotoğraf*: the count holds radar images, mosaics and full-disc frames.
 *  - **No suffix on an inserted value**: a suffix sits on the fixed noun after a number (*7 günlük aralık*,
 *    *10 dk’da bir*, *1.234 geçişi*), the place stands before a postposition (*Waterloo üzerindeki uydular*, *Waterloo
 *    için*) or after a colon, and the headline already names it, so the reasons under the second line say *burayı,
 *    buranın*. A noun after a numeral is always singular (*1 uydu, 256 uydu*), so the plural forms are equal except
 *    where the English says "once" as a word (*bir kez*).
 *  - Verdicts are named by their titles from the tr 'verdicts' namespace, title first, then the count (*İzledi: 12
 *    geçiş*), never *12 izledi*; the timeline's spoken summary is built that way.
 *  - Buttons are bare stems (*Paylaş, Oynat*); a button's strong part, dropped on narrow phones, leads, so
 *    what is left still reads (*paylaş*, *yerini ara*). Mono labels are sentence case, uppercased by CSS with Turkish
 *    rules (*GEÇİŞLER, İPTAL*).
 *  - Days come from the tr 'time' namespace (*1 Kas Paz*, *29 Eki*, *1 → 8 Kas*), so this panel and the pass list say a
 *    day the same way; numbers from fmt('tr') (*7,46*, *1.715*, *%62* with the sign first). A number never parts from
 *    its unit or its noun, nor a clock from its zone (U+00A0, §6.7). Clocks, zones, coordinates and UTC stamps arrive
 *    written and stay international.
 */
import type en from '../en/results'
import type { PlaceWhen, UtcWhen, WindowWhen } from '../en/results'
import { fmt } from '../../../api/_lib/i18n/format'
import { accent, num, strong, type Part, type Rich } from '../../../api/_lib/i18n/parts'
import type { Pass, SatCategory } from '@/types'
import { localParts, type DateFields } from '@/ui/results/lib/time'
import trTime from './time'
import trVerdicts from './verdicts'

const f = fmt('tr')
type Verdict = Pass['verdict']
const VERDICTS: readonly Verdict[] = ['imaged', 'likely', 'could', 'overhead']

/** "7 gün": a grouped count and its noun, singular after any number, never parted */
const days = (n: number) => `${f.int(n)} gün`
/** "29 Eki" / "1 Kas Paz" at a zone, exactly as the 'time' namespace writes them */
const dayMonth = (ms: number, timeZone: string) => trTime.dayMonth(ms, timeZone, localParts(ms, timeZone))
const day = (ms: number, timeZone: string) => trTime.day(ms, timeZone, localParts(ms, timeZone))

/** After the place: " son 7 günde ", " son 24 saatte ", ", 29 Eki ile 5 Kas arasında " (a comma before a number) */
const windowPhrase = (when: WindowWhen) =>
  'lastDays' in when
    ? when.lastDays === 1
      ? ' son 24 saatte '
      : ` son ${f.int(when.lastDays)} günde `
    : `, ${dayMonth(when.fromMs, when.timeZone)} ile ${dayMonth(when.toMs, when.timeZone)} arasında `

/** "250 görüntüleme ve insanlı uydunun 1.234 geçişi kontrol edildi.": the suffixes sit on the nouns, never the numbers */
const checked = (passes: number, sats: number) =>
  `${f.int(sats)} görüntüleme ve insanlı uydunun ${f.int(passes)} geçişi kontrol edildi.`

/** What a pass's mark stands for in the timeline's tooltip: the kind of satellite and the mark's shape */
const MARK_KIND: Partial<Record<SatCategory, string>> = {
  // *arşivi açık*, as `why.none` says it: bare *açık* would read "switched on" or "clear" (§2.3).
  'open-optical': 'arşivi açık görüntüleyici · ◇',
  'commercial-optical': 'ticari · □',
  radar: 'radar · ▣',
  'weather-leo': 'meteoroloji · ○',
  crewed: 'insanlı · ✛',
}

const results: typeof en = {
  // ── the headline ─────────────────────────────────────────────────────────────────────────
  headline: {
    watched: (n: number, place: string, when: WindowWhen): Rich => [
      accent(place),
      windowPhrase(when),
      strong(num(f.int(n)), ' uydu tarafından izlendi'),
      '.',
    ],
    none: (place: string, past: boolean): Rich => [
      accent(place),
      past ? ' o hafta takip ettiğimiz hiçbir uydu tarafından izlenmedi.' : ' bu hafta takip ettiğimiz hiçbir uydu tarafından izlenmedi.',
    ],
  },

  // ── the second line ──────────────────────────────────────────────────────────────────────
  // *En az* is held to the number; without it the sentence opens on the number and still reads.
  imagesPublic: (k: number): Rich => [
    strong('En az '),
    num(f.int(k)),
    f.plural(k, { one: ' görüntü kamuya açıldı.', other: ' görüntü kamuya açıldı.' }),
  ],
  noImages: { thisWeek: 'Bu hafta hiçbir görüntü kamuya açılmadı.', thatWeek: 'O hafta hiçbir görüntü kamuya açılmadı.' },
  archiveDown: 'Görüntü arşivleri yanıt vermedi; kamuya açık görüntüleri şu an sayamıyoruz.',
  tryAgain: 'Yeniden dene',
  share: 'Paylaş',
  shareWeekLabel: (place: string, past: boolean) => `${place} için ${past ? 'o' : 'bu'} haftayı paylaş`,

  // The headline names the place, so these say *burayı, buranın* (§3.3).
  why: {
    sunNeverRose: 'Güneş hiç doğmadı; gündüz kameralarının hiçbiri burayı göremedi.',
    sunBarelyRose: 'Güneş neredeyse hiç yükselmedi; gündüz kameralarının hiçbiri burayı göremedi.',
    // The English keeps a number part for one ("1 time"): *1 kez*.
    infrared: (n: number): Rich => ['Meteoroloji uyduları burayı yine de kızılötesiyle ', num(f.int(n)), ' kez taradı.'],
    // *A, B ve 7 radar uydusu daha* from fmt('tr').list; the subject takes a comma before the count, so a name ending
    // in a digit (*Capella-14*) or *daha* never runs into it (§5.1, §5.2).
    radar: (names: readonly string[], others: number, passes: number): Rich => {
      const who = f.list(others > 0 ? [...names, `${f.int(others)} radar uydusu daha`] : names)
      return [`Radar ışık gerektirmez. ${who}, `, num(f.int(passes)), ' kez menzile girdi.']
    },
    // English says "once" as a word for one: *bir kez*.
    unpublished: (n: number) => {
      const times = f.plural(n, { one: 'bir kez', other: `${f.int(n)} kez` })
      return `Sentinel-2 ya da Landsat gündüz buranın üzerinden ${times} geçti, ama henüz hiçbir sahne yayımlanmadı.`
    },
    none: 'Arşivi açık hiçbir görüntüleme uydusu gündüz buranın üzerinden geçmedi.',
  },

  // ── the summary's four readouts ──────────────────────────────────────────────────────────
  verdictGroup: 'Etikete göre geçişler. Her biri kendi listesine atlar.',
  verdictReadout: (n: number, verdict: Verdict, title: string) => `${f.int(n)} ${trVerdicts[verdict].unit(n)}: ${title}`,

  // ── the footnotes ────────────────────────────────────────────────────────────────────────
  notes: {
    // The mosaic line says *meteoroloji mozaiği (günlük, …)*: after a number, *4 günlük* would read "4-day".
    counted: (o: { detailed: number; mosaics: number; radar: number; geo: number; passes: number; satellites: number }): Rich => {
      const out: Part[] = [strong(f.int(o.detailed)), ' ayrıntılı görüntü (Sentinel-2, Landsat, 10–30 m)']
      if (o.mosaics) out.push(' · ', strong(f.int(o.mosaics)), ' meteoroloji mozaiği (günlük, 250–375 m)')
      if (o.radar) out.push(' · ', strong(f.int(o.radar)), ' radar görüntüsü (Sentinel-1, 20 m)')
      // The noun follows the count, the source goes in the parentheses, as in the items before it: *4 yerdurağan
      // meteoroloji uydularından* would read as a plural noun after a numeral.
      const geo = ' tam disk görüntüsü (yerdurağan meteoroloji uyduları, 2–5 km; her birinin en yenisi gösteriliyor)'
      if (o.geo) out.push(' · ', strong(f.int(o.geo)), geo)
      out.push(`. ${checked(o.passes, o.satellites)}`)
      return out
    },
    checked: (passes: number, satellites: number) => checked(passes, satellites),
    // The headline names the place: *buraya*.
    passTimes: (_place: string, fetched: string | undefined, zoneLabel: string) =>
      'Geçiş saati, uydunun buraya en yakın olduğu an; kamuya açık yörünge elemanlarından hesaplandı' +
      `${fetched ? ` (indirildi: ${fetched})` : ''}. Yerel saatler: ${zoneLabel}.`,
  },

  // ── the panel ────────────────────────────────────────────────────────────────────────────
  sheetLabel: (place: string) => `${place} üzerindeki uydular`,
  computingPasses: 'Geçişler hesaplanıyor',
  sections: { summary: 'Özet', passes: 'Geçişler', watchedContinuously: 'Sürekli izleyenler' },
  checkingArchives: 'Arşivler kontrol ediliyor',
  invite: {
    // The hero's order and its *seni*, with *de* ("you too").
    text: 'Bu hafta bir şey seni de izledi.',
    checkPlace: 'Kendi yerini ara',
    dismiss: 'Kapat',
  },
  searchAnother: 'Başka bir yer ara',
  allPasses: 'Tüm geçişler',

  footer: {
    // The narrow replay word (§4), as on the gallery card and in the photo viewer: *Yeniden oynat* beside *Bu geçişi
    // paylaş* overflows the row on 401–470 px phones and in the 400 px laptop panel. The play glyph is beside it, and
    // the accessible name and tooltip keep *yeniden*.
    replay: 'Oynat',
    replayLabel: 'Geçişi yeniden oynat',
    replayTitle: 'Geçişi kürede yeniden oynat',
    shareLabel: { pass: 'Bu geçişi paylaş', image: 'Bu görüntüyü paylaş' },
    // Narrow phones drop the strong part: *PAYLAŞ*.
    shareButton: { pass: [strong('Bu geçişi '), 'paylaş'] as Rich, image: [strong('Bu görüntüyü '), 'paylaş'] as Rich },
    // Narrow phones: *YERİNİ ARA*.
    checkPlace: [strong('Kendi '), 'yerini ara'] as Rich,
    // No strong part: *En net görüntü* reads alone on every width (§3.8).
    clearest: ['En net görüntü'] as Rich,
    clearestLabel: 'En net görüntüyü gör',
  },

  // ── the headers ──────────────────────────────────────────────────────────────────────────
  head: {
    windowSpan: (n: number, startMs: number, endMs: number, timeZone: string) =>
      `${days(n)} · ${trTime.dayRange(startMs, endMs, timeZone, localParts(startMs, timeZone), localParts(endMs, timeZone))}`,
    verifying: 'Mozaikler doğrulanıyor',
    cancel: 'İptal',
    newSearch: 'Yeni arama',
    close: 'Kapat',
    escKey: 'Esc',
    // The place after a colon, bare.
    searchBarLabel: (place: string) => `Başka bir yer ara (şu an: ${place})`,
    change: 'Değiştir',
    computing: 'Hesaplanıyor',
    recent: 'Son aramalar',
    // *…, toplam …*: screen readers read a slash as *bölü* (§5.3).
    position: (k: number, n: number) => `Bu türde geçiş ${f.int(k)}, toplam ${f.int(n)}`,
    previous: 'Bu türden önceki geçiş',
    next: 'Bu türden sonraki geçiş',
    previousTitle: 'Önceki (←)',
    nextTitle: 'Sonraki (→)',
    allPassesTitle: 'Tüm geçişler (Esc)',
    // The place is the subject of a passive, a comma before the satellite's name.
    shared: (sat: string, place: string) => `Seninle paylaşıldı · ${place}, ${sat} tarafından izlendi`,
    passWhen: (ms: number, timeZone: string, p: DateFields, time: string, zone: string, approx: boolean) =>
      `${trTime.day(ms, timeZone, p)} · ${approx ? '≈ ' : ''}${time} ${zone}`,
  },

  // ── the computing readout ────────────────────────────────────────────────────────────────
  computing: {
    stages: {
      catalog: { idle: 'Yörünge kataloğu', done: 'Katalog yüklendi' },
      propagate: { idle: (n: number) => `Yörünge hesabı · ${days(n)}`, done: 'Yörüngeler hesaplandı' },
      archive: { idle: 'Sentinel-2 + Landsat arşivleri', done: 'Arşivler arandı' },
      match: { idle: 'Sahne ve geçiş eşleştirmesi', done: 'Sahneler eşleştirildi' },
    },
    ready: 'Rapor hazır',
    ok: 'OK',
    seconds: (s: number) => `${f.dec(s, 2)} sn`,
    // Phones up to 420 px hide the strong part; the span reads alone. *7 günlük*: the suffix on the fixed noun.
    window: (n: number, from: UtcWhen, to: UtcWhen): Rich => [
      strong(`${f.int(n)} günlük aralık · `),
      `${dayMonth(from.ms, 'UTC')} ${from.time} → ${dayMonth(to.ms, 'UTC')} ${to.time} UTC`,
    ],
    percent: (pct: number) => `%${f.int(pct)}`,
    // A comma after the subject (§5.1, §6.1), or *NASA görüntüleri* reads first as "NASA images".
    slow: 'Planetary Computer ve NASA, görüntüleri istek üzerine işliyor; bu adım birkaç saniye sürebilir.',
    verySlow:
      'Görüntü arşivleri geç yanıt veriyor. Yanıt gelmezse geçişler yine de yörünge geometrisinden gösterilir; bunu da belirtiriz.',
    // A nameless satellite: the frame writes *Bir uydu* / *bir uydu* itself (§5.2).
    sharedAlt: (sat: string | undefined, place: string) => `${sat ?? 'Bir uydu'} görüntüsü: ${place}. Seninle paylaşıldı.`,
    sharedCaption: (sat: string | undefined, place: string, when?: PlaceWhen): Rich => [
      strong('Seninle paylaşıldı'),
      ` · ${place}, ${sat ?? 'bir uydu'} tarafından izlendi${when ? ` · ${day(when.ms, when.timeZone)}, ${when.time}` : ''}`,
    ],
  },

  // ── 03 / SÜREKLİ İZLEYENLER: geostationary weather satellites ────────────────────────────
  geo: {
    // The angle is above the place's horizon (*ufkunun … üzerinden*, the glossary's elevation). 5° is fixed text, so
    // it may take its suffix. *operasyonel*, the word the sats blurbs use for the same English: the list holds the
    // imagers in operational service, and *çalışır durumda* ("in working order") would also take in the working
    // spares the blurbs say are not counted.
    none: 'Bu yeri ufkunun 5°’den fazla üzerinden gören hiçbir operasyonel yerdurağan meteoroloji görüntüleyicisi yok.',
    // The suffix sits on the unit (*10 dk’da bir*); one minute is *her dakika*.
    facts: (lon: string, elevationDeg: number, cadenceMin: number) =>
      `${lon} · ${f.dec(elevationDeg, 1)}° yukarıda · ${f.plural(cadenceMin, { one: 'her dakika', other: `${f.int(cadenceMin)} dk’da bir` })}`,
    images: (n: number, d: number): Rich => [
      d === 7 ? 'Bu hafta ' : d === 1 ? 'Son 24 saatte ' : `Son ${f.int(d)} günde `,
      num(f.int(n)),
      ' görüntü',
    ],
    replay: 'Oynat',
    replayLabel: (sat: string) => `${sat}: en son görüntüsünü oynat`,
    frame: {
      probing: 'Aranıyor…',
      noPublic: 'Kamuya kapalı',
      poorQuality: 'Düşük kalite',
      noneNow: 'Şu an görüntü yok',
      unavailable: 'Kare alınamadı',
    },
    frameAlt: (sat: string, infrared: boolean) => `${sat}: bu yerin çevresinden son ${infrared ? 'kızılötesi kare' : 'kare'}`,
    infraredChip: 'IR',
    infraredTitle: 'Kızılötesi: bulut tepeleri sıcaklığa göre, soğuk olan daha açık renkte',
  },

  // ── 04 / ZAMAN ÇİZELGESİ ─────────────────────────────────────────────────────────────────
  timeline: {
    title: 'Zaman çizelgesi',
    meta: (n: number, zoneLabel: string, zones?: string) =>
      `${days(n)} · ${zoneLabel}${zones ? ` · ${zones}` : ''}`,
    zoneChange: (before: string, after: string) => `${before} → ${after}`,
    daylight: 'Burada gündüz',
    // Title first, then the count, so no verdict name is ever put after a bare number (§3.6).
    summary: (n: number, counts: Record<Verdict, number>, titles: Readonly<Record<Verdict, string>>) =>
      `Zaman çizelgesi, ${days(n)}. ` +
      VERDICTS.map((v) => `${titles[v]}: ${f.int(counts[v])} ${trVerdicts[v].unit(counts[v])}.`).join(' '),
    keysHint: (summary: string) => `${summary} Geçişler arasında sol ve sağ ok tuşlarıyla ilerle.`,
    geoLane: (n: number): Rich => [strong('Yerdurağan · '), f.int(n)],
    geoNames: (names: readonly string[]) => names.join(', '),
    now: 'Şimdi',
    // *dikeyden*, never *nadir* or *eğim* (§4).
    geometry: (deg: number, km: number) => `dikeyden ${f.dec(deg, 1)}° · ${f.int(km)} km`,
    markMosaic: (gsdM: number) => `Günlük mozaik, ${f.int(gsdM)} m · ●`,
    markRadar: (gsdM: number) => `Radar görüntüsü, ${f.int(gsdM)} m · ◆`,
    markImaged: (title: string) => `${title} · ◆`,
    markKind: (title: string, category: SatCategory) => `${title} · ${MARK_KIND[category] ?? 'diğer'}`,
  },

  // ── 02 / TEKRAR ──────────────────────────────────────────────────────────────────────────
  replay: {
    scrubLabel: 'Tekrar zamanı',
    scrubValue: (tMinus: string, utc: string) => `${tMinus}, ${utc}`,
    play: 'Tekrarı oynat',
    pause: 'Tekrarı duraklat',
    speed: 'Tekrar hızı',
    inView: (duration: string) => `Görüş alanında ${duration}`,
    closest: 'En yakın',
    spaceKey: 'Boşluk',
    playPause: 'oynat / duraklat',
    stepKind: 'bu türden önceki / sonraki geçiş',
  },

  // ── the plan view ────────────────────────────────────────────────────────────────────────
  plan: {
    label: (sat: string, km: number) => `Kuşbakışı çizim: ${sat} yer izi, en yakın anda buraya ${f.int(km)} km.`,
    // At most 15 characters: it shares the top row with the label on the right, on a 240 px plan. The pass view's
    // section is already *Kuşbakışı çizim*, so the corner says only which way is up.
    northUp: 'Kuzey yukarıda',
    fieldOfRegard: (deg: number) => `Görüş alanı ±${f.int(deg)}°`,
    // On northUp's row, at most 20 characters: a weather imager's *Tarama şeridi 3.040 km* is 22, so the bare
    // *Şerit* the pass view's *Şeritte* already uses; the band drawn beside it shows what the strip is.
    swath: (km: number) => `Şerit ${f.int(km)} km`,
    groundTrack: 'Yer izi',
    scale: (km: number) => `${km >= 1 ? f.int(km) : f.dec(km, 1)} km`,
    closest: (km: number) => `En yakın ${km < 1 ? '< 1' : f.int(km)} km`,
  },

  // ── a picture's product line ─────────────────────────────────────────────────────────────
  // Product names stay as they are; pixels are whole numbers, never grouped.
  product: {
    mosaic: (m: number) => `Günlük mozaik · ${m} m`,
    fullDisc: (km: number) => `Tam disk · ${km} km`,
    infrared: (km: number) => `Kızılötesi · ${km} km`,
    sentinel2: (m: number) => `Sentinel-2 L2A · ${m} m`,
    landsat: (m: number) => `Landsat C2 L2 · ${m} m`,
    sentinel1: (m: number) => `Sentinel-1 radar · ${m} m`,
    other: (m: number) => `${m} m`,
  },
  pixel: { m: (m: number) => `${m} m`, km: (km: number) => `${km} km` },

  // ── the time-lapse row ───────────────────────────────────────────────────────────────────
  timelapse: {
    title: 'Zaman atlamalı',
    sub: 'Bu yer, yıl yıl',
  },
}
export default results
