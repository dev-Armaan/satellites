/**
 * Indonesian copy for the landing (see docs/i18n/id.md §3.1, §3.2, §3.8): the hero, the place search, "Use my
 * location", the example chips and the maker's credit.
 *
 * The hero is the guide's key line, in three display lines: *Sesuatu / mengawasi \*kamu\* / minggu ini.* The free
 * pronoun *kamu* carries the serif accent (never the enclitic *-mu* alone in the serif face), and the middle line, the
 * longest, wraps only at its one space on narrow landscape tablets, giving the card's four-line form.
 *
 * Address is *kamu / -mu*; where the English speaks as the user ("me") the buttons use *-ku* (*Lokasiku*, *Di
 * dekatku*), and the main locate button is pronoun-free (*Lokasi saat ini*). Mono labels are stored in sentence case
 * (CSS uppercases). Dates come from CLDR `id` through dates.ts (*Okt*, *Agu*, *Des*), but the range keeps the
 * product's arrow, so it is assembled here rather than taken from Intl's formatRange (which writes an en dash).
 */
import type en from '../en/landing'
import { formatDate } from '../../../api/_lib/i18n/dates'
import { fmt } from '../../../api/_lib/i18n/format'
import { accent, type Rich } from '../../../api/_lib/i18n/parts'

const f = fmt('id')

/** "1 Nov" / "1 Nov 2026" at UTC, from CLDR `id` */
const dm = (ms: number) => formatDate('id', ms, 'UTC', { day: 'numeric', month: 'short' })
const dmy = (ms: number) => formatDate('id', ms, 'UTC', { day: 'numeric', month: 'short', year: 'numeric' })

const landing: typeof en = {
  // ── Hero ──
  /** "7 HARI TERAKHIR" (the number and its unit kept together) */
  lastDays: (days: number) => f.plural(days, { other: `${f.int(days)} hari terakhir` }),
  /** "1 → 8 Nov 2026 UTC", "29 Okt → 5 Nov 2026 UTC", "29 Des 2026 → 5 Jan 2027 UTC" */
  windowRange: (startMs: number, endMs: number) => {
    const a = new Date(startMs)
    const b = new Date(endMs)
    const start =
      a.getUTCFullYear() !== b.getUTCFullYear()
        ? dmy(startMs)
        : a.getUTCMonth() !== b.getUTCMonth()
          ? dm(startMs)
          : String(a.getUTCDate())
    return `${start} → ${dmy(endMs)} UTC`
  },
  hero: [['Sesuatu'], ['mengawasi ', accent('kamu')], ['minggu ini.']] as Rich[],
  /** §3.2: *mana pun* two words, *Bumi* capitalised, *citra* (the pictures include radar and mosaics), *asli* for "actual" */
  sub: (days: number): Rich => [
    `Pilih tempat mana pun di Bumi. Lihat setiap satelit yang melintas di atasnya dalam ${f.int(days)} hari terakhir, beserta citra aslinya.`,
  ],
  builtBy: (handle: string) => `Dibuat oleh ${handle}`,
  sourceLink: 'Sumber terbuka',
  sourceLinkLabel: 'Sumber terbuka: kodenya di GitHub',

  // ── The place search ──
  searchPlaceholder: 'Cari tempat',
  placeLabel: 'Tempat',
  searching: 'Mencari',
  searchUnavailable: 'Pencarian tidak tersedia',
  /** "6 hasil": one noun form for every count (§5.3) */
  matches: (n: number) => f.plural(n, { other: `${f.int(n)} hasil` }),
  noMatch: 'Tidak ada hasil',
  /**
   * Shorter than §3.8's *Nama, alamat, atau lintang, bujur*, which this slot cuts: right of "01 / TEMPAT", one
   * ellipsised mono line (8 px a character at 11 px). On a 375 px phone the field is 319 px, leaving 214 px: the
   * guide's line is 265 px (its *bujur* lost), *Nama, alamat, atau koordinat* 225 px; this one is 185 px, so it fits
   * down to 360 px like the English. *koordinat* is the plain word (searchDown gives the example).
   */
  searchHint: 'Nama, alamat, koordinat',
  clearSearch: 'Hapus pencarian',
  go: 'Tampilkan apa yang melintas di atas tempat ini',
  /** The example coordinates stay as written (with the true minus): the field parses them */
  searchDown: 'Pencarian tempat tidak merespons. Koordinat seperti 43.47, −80.54 tetap bisa dipakai.',
  nothingMatches: (query: string) => `Tidak ada yang cocok dengan “${query}”. Coba kota, tempat terkenal, atau koordinat.`,
  suggestions: 'Saran tempat',

  // ── Use my location ──
  useMyLocation: 'Lokasi saat ini',
  locateMe: 'Lokasiku',
  nearMe: 'Di dekatku',
  locating: 'Mencari lokasi…',
  cancelSearch: 'Batal',
  cancelLocate: 'Batal',
  cancelLocating: 'Batalkan pencarian lokasi',
  requestingPosition: 'Meminta posisi',
  namingPlace: 'Menamai tempat',
  /** "04 DTK" (mono, uppercased by CSS) */
  elapsed: (seconds: number) => `${seconds.toFixed(0).padStart(2, '0')} dtk`,
  /** "area selebar sekitar 10 km": never *sel* (a prison or a biology cell), never `~` (§8) */
  locatingNote: 'Posisimu dikirim ke geocoder Photon untuk menamai tempat itu. Kami hanya menyimpan area selebar sekitar 10 km.',
  locationLabel: 'Lokasi',
  dismiss: 'Tutup',
  /** No enclitic on the loanword *browser* (§1.2): *di pengaturan browser*, *Browser ini* */
  locateErrors: {
    denied: 'Akses lokasi diblokir. Izinkan di pengaturan browser, atau cari tempat.',
    unavailable: 'Posisimu tidak tersedia saat ini. Cari tempat saja.',
    timeout: 'Posisimu tidak kunjung ditemukan. Coba lagi, atau cari tempat.',
    unsupported: 'Browser ini tidak bisa membagikan lokasinya. Cari tempat saja.',
    insecure: 'Akses lokasi butuh koneksi aman (https). Cari tempat saja.',
    other: 'Posisimu tidak tersedia saat ini. Cari tempat saja.',
  },

  // ── Examples ──
  orTry: 'Atau coba',
  pinHint: 'Atau klik bola dunia untuk menaruh pin',
  examplesLabel: 'Contoh tempat',
  dropPin: 'Taruh pin',
  /** The place's name, then where it is (a chip without a "where" line says its name alone) */
  chipName: (label: string, sublabel: string) => (sublabel ? `${label}, ${sublabel}` : label),
  surprise: 'Pilih acak',
  surpriseName: 'Pilih acak: satu tempat terkenal, dipilihkan untukmu',
}
export default landing
