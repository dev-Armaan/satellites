/**
 * Indonesian copy for the results panel (see src/i18n/en/results.ts; docs/i18n/id.md §3.3, §3.4 and §3.8 give the
 * key lines, and the guide is the authority on words).
 *
 * Why it reads this way: Indonesian nouns do not inflect for number and CLDR `id` has one plural category, so every
 * count is a digit before one noun form (*1 satelit*, *256 satelit*, *1 kali*), and zero is its own sentence. The
 * headline keeps the English shape, *Dalam 7 hari terakhir, **256 satelit mengawasi** \*Waterloo\*.*, so it still lands
 * on the place; the place slot is the bare label (no article before seas, no class noun, no suffix) and never starts a
 * sentence. "Image" is *citra* wherever a radar image, a mosaic or a geostationary frame can appear; "this week" is
 * *minggu ini* in prose and *pekan ini* where a mono label uppercases it (*MINGGU* in caps reads "Sunday"), and a count
 * never stands right before *pekan* or *hari* unless it counts them. Mono labels are sentence case, uppercased by CSS.
 * Days are CLDR `id` from dates.ts (*29 Okt*, *Min, 1 Nov*), written as ./time.ts writes them; clocks, zones,
 * coordinates and UTC stamps arrive written. A number with its unit, and a count with *hari*, are held together by a
 * no-break space in prose.
 */
import type en from '../en/results'
import type { PlaceWhen, UtcWhen, WindowWhen } from '../en/results'
import { formatDate } from '../../../api/_lib/i18n/dates'
import { fmt } from '../../../api/_lib/i18n/format'
import { accent, num, strong, type Part, type Rich } from '../../../api/_lib/i18n/parts'
import type { Pass, SatCategory } from '@/types'
import type { DateFields } from '@/ui/results/lib/time'
import idTime from './time'
import idVerdicts from './verdicts'

const f = fmt('id')
type Verdict = Pass['verdict']

/** "29 Okt" at a zone (CLDR `id`, as ./time.ts dayMonth) */
const dayMonth = (ms: number, timeZone: string) => formatDate('id', ms, timeZone, { day: 'numeric', month: 'short' })
/** "Min, 1 Nov": the weekday keeps its comma (id.md §5.5) */
const day = (ms: number, timeZone: string) => `${formatDate('id', ms, timeZone, { weekday: 'short' })}, ${dayMonth(ms, timeZone)}`
/** "1 → 8 Nov", "29 Okt → 5 Nov": the month written once when both ends share it (as ./time.ts dayRange) */
function dayRange(startMs: number, endMs: number, timeZone: string): string {
  const ym = (ms: number) => formatDate('id', ms, timeZone, { year: 'numeric', month: 'numeric' })
  const start = ym(startMs) === ym(endMs) ? formatDate('id', startMs, timeZone, { day: 'numeric' }) : dayMonth(startMs, timeZone)
  return `${start} → ${dayMonth(endMs, timeZone)}`
}

/** A ground pixel as written ("10 m", "2 km"): never grouped; a fraction (none expected) takes the decimal comma */
const px = (n: number) => String(n).replace('.', ',')

/** "1.234 lintasan dari 250 satelit pencitraan dan berawak diperiksa." */
const checkedId = (passes: number, sats: number) =>
  `${f.int(passes)} lintasan dari ${f.int(sats)} satelit pencitraan dan berawak diperiksa.`

/** The kind of satellite in the timeline's tooltip, with its mark's shape (the glyphs stay as they are) */
const MARK_KIND: Partial<Record<SatCategory, string>> = {
  'open-optical': 'pencitraan terbuka · ◇',
  'commercial-optical': 'komersial · □',
  radar: 'radar · ▣',
  'weather-leo': 'cuaca · ○',
  crewed: 'berawak · ✛',
}

const results: typeof en = {
  // ── the headline ─────────────────────────────────────────────────────────────────────────
  headline: {
    /** id.md §3.3: bold *[NUM] satelit mengawasi* (the number inside it), serif the place */
    watched: (n: number, place: string, when: WindowWhen): Rich => [
      'lastDays' in when
        ? `Dalam ${f.int(when.lastDays)} hari terakhir, `
        : `Antara ${dayMonth(when.fromMs, when.timeZone)} dan ${dayMonth(when.toMs, when.timeZone)}, `,
      strong(num(f.int(n)), ' satelit mengawasi'),
      ' ',
      accent(place),
      '.',
    ],
    /** *Tak satu pun …*: zero is its own sentence, with "we" kept (the limit is our catalog) */
    none: (place: string, past: boolean): Rich => [
      'Tak satu pun satelit yang kami lacak mengawasi ',
      accent(place),
      past ? ' minggu itu.' : ' minggu ini.',
    ],
  },

  // ── the second line ──────────────────────────────────────────────────────────────────────
  /** *Setidaknya* is the strong part, outside the number: the sentence reads with and without it (§3.4) */
  imagesPublic: (k: number): Rich => [strong('Setidaknya '), num(f.int(k)), ' citra dipublikasikan.'],
  noImages: { thisWeek: 'Tidak ada citra yang dipublikasikan minggu ini.', thatWeek: 'Tidak ada citra yang dipublikasikan minggu itu.' },
  archiveDown: 'Arsip citra tidak merespons, jadi saat ini kami tidak bisa menghitung citra publik.',
  tryAgain: 'Coba lagi',
  share: 'Bagikan',
  /** The share sheet's own words (*Bagikan ringkasan pekan ini*, §3.6), never *Bagikan minggu ini* ("share it this week") */
  shareWeekLabel: (place: string, past: boolean) => `Bagikan ringkasan ${past ? 'pekan itu' : 'pekan ini'} di ${place}`,

  /** "It" is the searched place: *tempat ini*, or *-nya* on a verb whose subject is the satellite (§3.8) */
  why: {
    sunNeverRose: 'Matahari tidak pernah terbit, jadi tidak ada kamera biasa yang bisa melihat tempat ini.',
    sunBarelyRose: 'Matahari nyaris tidak terbit, jadi tidak ada kamera biasa yang bisa melihat tempat ini.',
    infrared: (n: number): Rich => ['Satelit cuaca tetap memindai tempat ini dengan inframerah, ', num(f.int(n)), ' kali.'],
    /** "Umbra, Capella, dan 7 satelit radar lainnya" (PUEBI's serial comma, from Intl.ListFormat) */
    radar: (names: readonly string[], others: number, passes: number): Rich => {
      const who = f.list(others > 0 ? [...names, `${f.int(others)} satelit radar lainnya`] : names)
      return [`Radar tidak butuh cahaya. ${who} melintas dalam jangkauan `, num(f.int(passes)), ' kali.']
    },
    /** Digits even for one: *1 kali*, never *sekali* (§5.3) */
    unpublished: (n: number) =>
      `Sentinel-2 atau Landsat melintasinya ${f.int(n)} kali pada siang hari, tetapi belum ada citra yang dipublikasikan.`,
    none: 'Tidak ada satelit pencitraan terbuka yang melintasinya pada siang hari.',
  },

  // ── the summary's four readouts ──────────────────────────────────────────────────────────
  /** The verdicts are "labels" on About (*Arti label*) */
  verdictGroup: 'Lintasan menurut label. Masing-masing menuju daftarnya.',
  verdictReadout: (n: number, verdict: Verdict, title: string) => `${f.int(n)} ${idVerdicts[verdict].unit(n)}: ${title}`,

  // ── the footnotes ────────────────────────────────────────────────────────────────────────
  notes: {
    counted: (o: { detailed: number; mosaics: number; radar: number; geo: number; passes: number; satellites: number }): Rich => {
      const out: Part[] = [strong(f.int(o.detailed)), ' citra rinci (Sentinel-2, Landsat, 10–30 m)']
      if (o.mosaics) out.push(' · ', strong(f.int(o.mosaics)), ' mosaik cuaca harian (250–375 m)')
      if (o.radar) out.push(' · ', strong(f.int(o.radar)), ' citra radar (Sentinel-1, 20 m)')
      if (o.geo) {
        out.push(' · ', strong(f.int(o.geo)), ' citra cakram penuh dari satelit cuaca geostasioner (2–5 km; citra terbaru setiap satelit ditampilkan)')
      }
      out.push(`. ${checkedId(o.passes, o.satellites)}`)
      return out
    },
    checked: (passes: number, satellites: number) => checkedId(passes, satellites),
    /** Colons for "are" (§2.1: zero copula, no *adalah*) */
    passTimes: (place: string, fetched: string | undefined, zoneLabel: string) =>
      `Waktu lintasan: saat setiap satelit berada paling dekat dengan ${place}, dihitung dari elemen orbit publik` +
      `${fetched ? ` (diambil ${fetched})` : ''}. Waktu setempat: ${zoneLabel}.`,
  },

  // ── the panel ────────────────────────────────────────────────────────────────────────────
  sheetLabel: (place: string) => `Satelit di atas ${place}`,
  computingPasses: 'Menghitung lintasan',
  sections: { summary: 'Ringkasan', passes: 'Lintasan', watchedContinuously: 'Diawasi terus-menerus' },
  checkingArchives: 'Memeriksa arsip',
  invite: {
    /** The share hook, echoing the hero with the free *kamu* (§1.2 rule 4, §3.6) */
    text: 'Sesuatu mengawasi kamu juga minggu ini.',
    checkPlace: 'Periksa tempatmu',
    dismiss: 'Tutup',
  },
  searchAnother: 'Cari tempat lain',
  allPasses: 'Semua lintasan',

  footer: {
    replay: 'Putar ulang',
    replayLabel: 'Putar ulang lintasan ini',
    replayTitle: 'Putar ulang lintasan ini di bola dunia',
    shareLabel: { pass: 'Bagikan lintasan ini', image: 'Bagikan citra ini' },
    /**
     * *Bagikan* alone at every width (id.md §7, strategy 1: the pass on screen supplies the object): beside *Putar
     * ulang*, *Bagikan lintasan ini* is cut on phones from 401 px and in the 1024 px laptop panel. The accessible
     * name and tooltip (`shareLabel`) keep the object.
     */
    shareButton: { pass: ['Bagikan'] as Rich, image: ['Bagikan'] as Rich },
    /** …*tempatmu* alone */
    checkPlace: [strong('Periksa '), 'tempatmu'] as Rich,
    /** …*citra tercerah* alone. The superlative *tercerah*, not *paling cerah*: beside three icons it fits a 412 px phone */
    clearest: [strong('Lihat '), 'citra tercerah'] as Rich,
    clearestLabel: 'Lihat citra tercerah',
  },

  // ── the headers ──────────────────────────────────────────────────────────────────────────
  head: {
    windowSpan: (days: number, startMs: number, endMs: number, timeZone: string) =>
      `${f.int(days)} hari · ${dayRange(startMs, endMs, timeZone)}`,
    verifying: 'Memeriksa mosaik cuaca',
    cancel: 'Batal',
    newSearch: 'Cari lagi',
    close: 'Tutup',
    escKey: 'Esc',
    searchBarLabel: (place: string) => `Cari tempat lain (saat ini: ${place})`,
    change: 'Ubah',
    computing: 'Menghitung',
    recent: 'Riwayat',
    /** "Of this kind" (the verdict's group) is *sejenis*, after the noun repeated: *dari 31 lintasan sejenis* */
    position: (k: number, n: number) => `Lintasan ${f.int(k)} dari ${f.int(n)} lintasan sejenis`,
    previous: 'Lintasan sejenis sebelumnya',
    next: 'Lintasan sejenis berikutnya',
    previousTitle: 'Sebelumnya (←)',
    nextTitle: 'Berikutnya (→)',
    allPassesTitle: 'Semua lintasan (Esc)',
    shared: (sat: string, place: string) => `Dibagikan kepadamu · ${sat} mengawasi ${place}`,
    /** The day as ./time.ts `stamp` writes it (*Min, 1 Nov · 16:14:21 WIB*), so the header and the pass's row agree */
    passWhen: (ms: number, timeZone: string, p: DateFields, time: string, zone: string, approx: boolean) =>
      `${idTime.day(ms, timeZone, p)} · ${approx ? '≈ ' : ''}${time} ${zone}`,
  },

  // ── the computing readout ────────────────────────────────────────────────────────────────
  computing: {
    /** Idle labels are nouns (what the step is), done labels a passive (what happened); never *propagasi* */
    stages: {
      catalog: { idle: 'Katalog orbit', done: 'Katalog dimuat' },
      propagate: { idle: (days: number) => `Perhitungan orbit · ${f.int(days)} hari`, done: 'Orbit dihitung' },
      archive: { idle: 'Arsip Sentinel-2 + Landsat', done: 'Arsip ditelusuri' },
      match: { idle: 'Pencocokan citra dengan lintasan', done: 'Citra dicocokkan' },
    },
    ready: 'Laporan siap',
    ok: 'OK',
    /**
     * "1,84 s": the SI symbol (§6 units, as in *km/s*), not the mono *dtk*. The row's time sits in a fixed 48 px
     * column on phones (56 px on desktop), which "0,00 dtk" overruns into the status cell; "0,00 s" is six characters,
     * as in English. The same string is the header's "T+1,84 s"
     */
    seconds: (s: number) => `${f.dec(s, 2)} s`,
    /** Phones drop the strong part: the span reads alone */
    window: (days: number, from: UtcWhen, to: UtcWhen): Rich => [
      strong(`Rentang ${f.int(days)} hari · `),
      `${dayMonth(from.ms, 'UTC')} ${from.time} → ${dayMonth(to.ms, 'UTC')} ${to.time} UTC`,
    ],
    percent: (pct: number) => `${f.int(pct)}%`,
    slow: 'Planetary Computer dan NASA memproses citra saat diminta; langkah ini bisa butuh beberapa detik.',
    verySlow:
      'Arsip citra lambat merespons. Jika arsip tidak juga merespons, lintasan tetap ditampilkan dari geometri orbit, dan kami akan menyebutkannya.',
    sharedAlt: (sat: string | undefined, place: string) => `${sat ? `Citra ${sat}` : 'Citra satelit'} dari ${place}, dibagikan kepadamu.`,
    /** "… · Min, 1 Nov 16:14": the day and its clock as a pass row's spoken label sets them */
    sharedCaption: (sat: string | undefined, place: string, when?: PlaceWhen): Rich => [
      strong('Dibagikan kepadamu'),
      ` · ${sat ?? 'Sebuah satelit'} mengawasi ${place}${when ? ` · ${day(when.ms, when.timeZone)} ${when.time}` : ''}`,
    ],
  },

  // ── 03 / DIAWASI TERUS-MENERUS ───────────────────────────────────────────────────────────
  geo: {
    /** "Above 5°" is *lebih dari 5°*: *di atas* also means "more than" (§9.1) */
    none: 'Tidak ada satelit cuaca geostasioner aktif yang melihat tempat ini pada elevasi lebih dari 5°.',
    /** *tiap* (KBBI's synonym of *setiap*): two characters fewer, so the line stays on one line on more phones */
    facts: (lon: string, elevationDeg: number, cadenceMin: number) =>
      `${lon} · ${f.dec(elevationDeg, 1)}° di atas · tiap ${f.int(cadenceMin)} mnt`,
    /** Mono caps: *pekan ini*, the noun before it (*12 citra pekan ini*, never *12 pekan ini*) */
    images: (n: number, days: number): Rich => [num(f.int(n)), days === 7 ? ' citra pekan ini' : ` citra dalam ${f.int(days)} hari`],
    replay: 'Putar ulang',
    replayLabel: (sat: string) => `${sat}: putar ulang citra terbarunya`,
    /** A 72 px square at 9.5 px mono caps: about 11 characters a line, three lines */
    frame: {
      probing: 'Mencari…',
      noPublic: 'Tanpa citra publik',
      poorQuality: 'Kualitas buruk',
      noneNow: 'Tidak ada citra saat ini',
      unavailable: 'Citra gagal dimuat',
    },
    frameAlt: (sat: string, infrared: boolean) => `${sat}: citra ${infrared ? 'inframerah ' : ''}terbaru di sekitar tempat ini`,
    infraredChip: 'IR',
    infraredTitle: 'Inframerah: puncak awan menurut suhunya, makin dingin makin terang',
  },

  // ── 04 / LINIMASA ────────────────────────────────────────────────────────────────────────
  timeline: {
    title: 'Linimasa',
    meta: (days: number, zoneLabel: string, zones?: string) =>
      `${f.int(days)} hari · ${zoneLabel}${zones ? ` · ${zones}` : ''}`,
    zoneChange: (before: string, after: string) => `${before} → ${after}`,
    daylight: 'Siang hari di sini',
    /** *31 diawasi, 12 kemungkinan besar diawasi, …*: the verdicts' own titles, lowercased for running text (§3.7) */
    summary: (days: number, counts: Record<Verdict, number>, titles: Readonly<Record<Verdict, string>>) =>
      `Linimasa, ${f.int(days)} hari: ` +
      (['imaged', 'likely', 'could', 'overhead'] as const).map((v) => `${f.int(counts[v])} ${titles[v].toLocaleLowerCase('id')}`).join(', ') +
      '.',
    /** "Step through passes" is *menelusuri lintasan*, as About's keyboard row (*Telusuri lintasan*) */
    keysHint: (summary: string) => `${summary} Gunakan tombol panah kiri dan kanan untuk menelusuri lintasan.`,
    /** The sanctioned mono abbreviation `GEO` (§6) */
    geoLane: (n: number): Rich => [strong('Geo · '), f.int(n)],
    geoNames: (names: readonly string[]) => names.join(', '),
    now: 'Sekarang',
    geometry: (deg: number, km: number) => `miring ${f.dec(deg, 1)}° · ${f.int(km)} km`,
    markMosaic: (gsdM: number) => `Mosaik harian, ${f.int(gsdM)} m · ●`,
    markRadar: (gsdM: number) => `Citra radar, ${f.int(gsdM)} m · ◆`,
    markImaged: (title: string) => `${title} · ◆`,
    markKind: (title: string, category: SatCategory) => `${title} · ${MARK_KIND[category] ?? 'lainnya'}`,
  },

  // ── 02 / PUTAR ULANG ─────────────────────────────────────────────────────────────────────
  replay: {
    scrubLabel: 'Waktu tayangan ulang dalam lintasan',
    scrubValue: (tMinus: string, utc: string) => `${tMinus}, ${utc}`,
    play: 'Putar tayangan ulang',
    pause: 'Jeda tayangan ulang',
    speed: 'Kecepatan tayangan ulang',
    /**
     * The legend is one nowrap row (start clock, this, the closest tick, end clock): *Terlihat* ("visible"), not the
     * glossary's *dalam jangkauan*, which runs the row about 100 px past the English and off the panel
     */
    inView: (duration: string) => `Terlihat ${duration}`,
    /** The tick on the time scrubber: bare *Terdekat*, as English "Closest"; *Saat terdekat* overflows the row */
    closest: 'Terdekat',
    spaceKey: 'Spasi',
    playPause: 'putar / jeda',
    stepKind: 'lintasan sejenis sebelumnya / berikutnya',
  },

  // ── the plan view ────────────────────────────────────────────────────────────────────────
  plan: {
    label: (sat: string, km: number) =>
      `Tampak atas lintasan: jejak permukaan ${sat}, ${f.int(km)} km dari tempat ini pada saat terdekat.`,
    /** At most 15 characters; the section above already says "plan" (*Tampak atas lintasan*) */
    northUp: 'Utara di atas',
    /** 20 characters with a two-digit angle */
    fieldOfRegard: (deg: number) => `Rentang pandang ±${deg}°`,
    swath: (km: number) => `Sapuan ${f.int(km)} km`,
    groundTrack: 'Jejak permukaan',
    scale: (km: number) => `${km >= 1 ? f.int(km) : f.dec(km, 1)} km`,
    closest: (km: number) => `Terdekat ${km < 1 ? '< 1' : f.int(km)} km`,
  },

  // ── a picture's product line ─────────────────────────────────────────────────────────────
  product: {
    mosaic: (m: number) => `Mosaik harian · ${px(m)} m`,
    fullDisc: (km: number) => `Cakram penuh · ${px(km)} km`,
    infrared: (km: number) => `Inframerah · ${px(km)} km`,
    sentinel2: (m: number) => `Sentinel-2 L2A · ${px(m)} m`,
    landsat: (m: number) => `Landsat C2 L2 · ${px(m)} m`,
    sentinel1: (m: number) => `Radar Sentinel-1 · ${px(m)} m`,
    other: (m: number) => `${px(m)} m`,
  },
  pixel: { m: (m: number) => `${px(m)} m`, km: (km: number) => `${px(km)} km` },

  // ── the time-lapse row ───────────────────────────────────────────────────────────────────
  timelapse: {
    title: 'Time-lapse',
    sub: 'Tempat ini, dari tahun ke tahun',
  },
}
export default results
