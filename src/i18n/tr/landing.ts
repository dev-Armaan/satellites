/**
 * Turkish copy for the landing (src/ui/landing; see docs/i18n/tr.md §3.1, §3.2, §3.7, §5, §6.4, §7): the hero, the
 * place search, "Use my location", the example chips and the maker's credit.
 *
 * Why it is built this way:
 *  - The hero is the guide's three lines, `Bu hafta` / `bir şey` / `*seni* izledi.`: unmarked Turkish order (time,
 *    subject, object, verb), so *seni* sits in the focus slot before the verb, and it alone is the accent (§3.1). The
 *    share post's hook (*Bu hafta bir şey seni de izledi.*) keeps the same order.
 *  - The sub is the guide's sentence (§3.2): *Seç* covers every way in (typing, chips, a pin, the locate button),
 *    *görüntü* because the pictures include mosaics and radar, the number tied to *günde* by a no-break space. A
 *    one-day window says *son 24 saatte*, as the headline does (§3.3).
 *  - The kicker's dates come from Intl's range parts at UTC (CLDR months, *Kas*, *Eki*), Intl's en dash replaced by
 *    the house arrow and the shared month or year written once (`12 → 19 Kas 2026 UTC`, `29 Ara 2026 → 5 Oca 2027
 *    UTC`, §6.4); `UTC` stays.
 *  - The reader is *sen*: buttons and hints are bare stems (`Konumumu kullan`, `Raptiye bırak`, `Beni şaşırt`), errors
 *    say what happened and then the one action, with no *lütfen* (§1.1). Locating is `Beni bul` / `Yakınımda` /
 *    `Bulunuyor…`, about as wide as the English (§7). A noun after a numeral stays singular (`5 sonuç`) and zero has
 *    its own words (`Sonuç yok`, §5.3).
 *  - What the visitor typed sits in “…” before the invariant *için* (`“Waterloo” için sonuç yok.`), so it never takes
 *    a suffix (§5.1, §6.1). The example coordinates keep their decimal points (*41.01, 28.98*; *43.47, −80.54*
 *    exactly as the English), because the field parses only that form. Fixed names carry their own suffixes with
 *    U+2019 (`Photon’a`, `10 km’lik`, §6.1).
 */
import type en from '../en/landing'
import { dateFormat } from '../../../api/_lib/i18n/dates'
import { fmt } from '../../../api/_lib/i18n/format'
import { accent, type Rich } from '../../../api/_lib/i18n/parts'

const f = fmt('tr')

/** A count as it is set: grouped ("1.715"), a fraction kept with its decimal comma ("1,5"). */
const count = (n: number) => (Number.isInteger(n) ? f.int(n) : f.dec(n, 1))

const UTC_RANGE: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }

/**
 * Intl's range parts joined with the house arrow: "12 → 19 Kas 2026", "29 Eki → 5 Kas 2026", "29 Ara 2026 → 5 Oca
 * 2027". What both ends share (the month, the year) is written once where Intl puts it; the shared separator between
 * the two ends (Intl's en dash, spaced or not) becomes the arrow.
 */
function arrowRange(parts: readonly Intl.DateTimeRangeFormatPart[]): string {
  let head = ''
  let start = ''
  let end = ''
  let tail = ''
  for (const p of parts) {
    if (p.source === 'startRange') start += p.value
    else if (p.source === 'endRange') end += p.value
    else if (!start) head += p.value
    else if (end) tail += p.value
  }
  return start && end ? `${head}${start} → ${end}${tail}` : parts.map((p) => p.value).join('')
}

const SUB_HEAD = 'Yeryüzünde herhangi bir yer seç. Son '
const SUB_TAIL = ' üzerinden geçen bütün uyduları ve çektikleri gerçek görüntüleri gör.'

/** What to try instead when nothing matched, after the query (or after a bare *Sonuç yok.* when it is empty). */
const TRY = 'Bir şehir, simge yapı ya da koordinat dene.'

/** "Bunun yerine bir yer ara.": the one action after a locate error. */
const INSTEAD = 'Bunun yerine bir yer ara.'

const landing: typeof en = {
  // ── Hero ──────────────────────────────────────────────────────────────────────────────────
  lastDays: (days: number) => f.plural(days, { one: 'Son 24 saat', other: `Son ${count(days)} gün` }),
  windowRange: (startMs: number, endMs: number) =>
    `${arrowRange(dateFormat('tr', 'UTC', UTC_RANGE).formatRangeToParts(startMs, endMs))} UTC`,
  hero: [['Bu hafta'], ['bir şey'], [accent('seni'), ' izledi.']] as Rich[],
  sub: (days: number): Rich =>
    f.plural<Rich>(days, {
      one: [SUB_HEAD, '24', ` saatte${SUB_TAIL}`],
      other: [SUB_HEAD, count(days), ` günde${SUB_TAIL}`],
    }),
  builtBy: (handle: string) => `Yapan: ${handle}`,
  sourceLink: 'Açık kaynak',
  sourceLinkLabel: 'Açık kaynak: kodu GitHub’da',

  // ── The place search ──────────────────────────────────────────────────────────────────────
  searchPlaceholder: 'Bir yer ara',
  placeLabel: 'Yer',
  searching: 'Aranıyor',
  searchUnavailable: 'Arama kullanılamıyor',
  matches: (n: number) =>
    n === 0 ? 'Sonuç yok' : f.plural(n, { one: `${f.int(n)} sonuç`, other: `${f.int(n)} sonuç` }),
  noMatch: 'Sonuç yok',
  searchHint: 'Ad, adres ya da 41.01, 28.98',
  clearSearch: 'Aramayı temizle',
  go: 'Bu yerin üzerinden ne geçtiğini göster',
  searchDown: 'Yer araması yanıt vermiyor. 43.47, −80.54 gibi koordinatlar yine de çalışır.',
  nothingMatches: (query: string) => (query.trim() ? `“${query}” için sonuç yok. ${TRY}` : `Sonuç yok. ${TRY}`),
  suggestions: 'Yerler',

  // ── Use my location ──────────────────────────────────────────────────────────────────────
  useMyLocation: 'Konumumu kullan',
  locateMe: 'Beni bul',
  nearMe: 'Yakınımda',
  locating: 'Bulunuyor…',
  cancelSearch: 'İptal',
  cancelLocate: 'İptal',
  cancelLocating: 'Konum bulmayı iptal et',
  requestingPosition: 'Konum isteniyor',
  namingPlace: 'Yerin adı bulunuyor',
  elapsed: (seconds: number) => `${String(Math.round(seconds)).padStart(2, '0')} sn`,
  locatingNote: 'Yerin adını bulmak için konumun Photon’a gider. Yalnızca yaklaşık 10 km’lik bir alanı saklarız.',
  locationLabel: 'Konum',
  dismiss: 'Kapat',
  locateErrors: {
    denied: 'Konum erişimi engellendi. Tarayıcı ayarlarından izin verebilir ya da bir yer arayabilirsin.',
    unavailable: `Konumuna şu an ulaşılamıyor. ${INSTEAD}`,
    timeout: 'Konumunu bulmak çok uzun sürdü. Yeniden dene ya da bir yer ara.',
    unsupported: `Bu tarayıcı konumunu paylaşamıyor. ${INSTEAD}`,
    insecure: `Konum için güvenli (https) bağlantı gerekir. ${INSTEAD}`,
    other: `Konumuna şu an ulaşılamıyor. ${INSTEAD}`,
  },

  // ── Examples ──────────────────────────────────────────────────────────────────────────────
  orTry: 'Örnekler',
  pinHint: 'Ya da küreye tıklayıp raptiye bırak',
  examplesLabel: 'Örnek yerler',
  dropPin: 'Raptiye bırak',
  chipName: (label: string, sublabel: string) => (sublabel ? `${label}, ${sublabel}` : label),
  surprise: 'Beni şaşırt',
  surpriseName: 'Beni şaşırt: rastgele seçilmiş ünlü bir yer',
}
export default landing
