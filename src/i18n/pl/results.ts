/**
 * Polish copy for the results panel (see docs/i18n/pl.md §3.3, §3.6, §3.7, §3.9, §5, §6, §7): the headline and its
 * second line, the reasons no image was made public, the footnotes, the computing readout, the headers, the timeline,
 * the replay controls, the plan view, the geostationary rows and the picture captions.
 *
 * Why it is built this way:
 *  - Polish cannot decline an inserted name, so the place stands only where the nominative is grammatical: the
 *    subject of a verbless frame («*Warszawa* **pod okiem 256 satelitów** w ostatnich 7 dniach.», «… poza zasięgiem
 *    znanych nam satelitów…»), before a colon, or in parentheses. Prose points back with «to miejsce», «tu», «je».
 *    The headline starts with the accent, and nothing capitalises it (a label may start in lowercase or a digit), and
 *    the full stop stays even after a place cut with «…»: it ends the text block, not the name.
 *  - After «pod okiem» a count takes the genitive (1 satelity, 3 / 256 satelitów); every plural message writes pl's
 *    four forms, and zero is its own sentence («nie opublikowano żadnych obrazów»).
 *  - «Opublikowano» is impersonal and agrees with nothing, so removing «co najmniej» (the strong part, hidden once the
 *    count is final) changes no other word.
 *  - A satellite follows its classifier («satelity Sentinel-2C», «Satelita radarowy Umbra był…»), so no name is ever
 *    declined, and a nameless one is simply «satelita».
 *  - Days come from the pl 'time' namespace (Intl's forms): «między 29 paź a 5 lis», never «między … i …». Spans keep
 *    the house arrow. Clocks, zones, coordinates and UTC stamps stay as they arrive.
 *  - Mono labels are sentence case (CSS uppercases them). A number is tied to its noun, and a one-letter word to the
 *    next, by a no-break space (§6.3). The plan view's two top corner labels share one row and must not collide, so
 *    together they stay within the English pair's length (see `plan`).
 */
import type en from '../en/results'
import type { PlaceWhen, UtcWhen, WindowWhen } from '../en/results'
import { fmt } from '../../../api/_lib/i18n/format'
import { accent, num, strong, type Part, type Rich } from '../../../api/_lib/i18n/parts'
import type { Pass, SatCategory } from '@/types'
import { localParts, type DateFields } from '@/ui/results/lib/time'
import time from './time'
import verdicts from './verdicts'

const f = fmt('pl')
type Verdict = Pass['verdict']
type Forms = { one: string; few: string; many: string; other: string }

/** A whole count, or a fraction kept (its plural form is `other`) */
const int = (n: number) => (Number.isInteger(n) ? f.int(n) : f.dec(n, 1))
/** «7 dni», «1 przelot»: a count and its noun, tied with a no-break space */
const count = (n: number, forms: Forms) => `${int(n)}\u00a0${f.plural(n, forms)}`

const DAYS: Forms = { one: 'dzień', few: 'dni', many: 'dni', other: 'dnia' }
const TIMES: Forms = { one: 'raz', few: 'razy', many: 'razy', other: 'raza' }
const IMAGES: Forms = { one: 'obraz', few: 'obrazy', many: 'obrazów', other: 'obrazu' }
/** The object of «Sprawdzono»: the accusative */
const PASSES: Forms = { one: 'przelot', few: 'przeloty', many: 'przelotów', other: 'przelotu' }
/** After «pod okiem»: the genitive (1 satelity, 3 / 256 satelitów) */
const SATS_GEN: Forms = { one: 'satelity', few: 'satelitów', many: 'satelitów', other: 'satelity' }
/** After «w ciągu»: the genitive */
const DAYS_GEN: Forms = { one: 'dnia', few: 'dni', many: 'dni', other: 'dnia' }

/** A day's number never parts from its month in a headline: «29 paź» */
const tie = (s: string) => s.replace(/(\d) /g, '$1\u00a0')
/** «29 paź» / «niedz., 1 lis» at a zone: the pl 'time' namespace's forms, from the instant */
const dayMonth = (ms: number, timeZone: string) => time.dayMonth(ms, timeZone, localParts(ms, timeZone))
const day = (ms: number, timeZone: string) => time.day(ms, timeZone, localParts(ms, timeZone))

/** «w ostatnich 7 dniach» (the locative is one form for every count above 1) · «w ostatniej dobie» · «między 29 paź a 5 lis» */
const inWindow = (when: WindowWhen) =>
  'lastDays' in when
    ? f.plural(when.lastDays, {
        one: 'w\u00a0ostatniej dobie',
        few: `w\u00a0ostatnich ${int(when.lastDays)}\u00a0dniach`,
        many: `w\u00a0ostatnich ${int(when.lastDays)}\u00a0dniach`,
        other: `w\u00a0ostatnich ${int(when.lastDays)}\u00a0dnia`,
      })
    : `między ${tie(dayMonth(when.fromMs, when.timeZone))} a\u00a0${tie(dayMonth(when.toMs, when.timeZone))}`

/**
 * «Sprawdzono 812 przelotów (412 satelitów obserwacyjnych i stacji załogowych).»: the parentheses keep the two counts
 * from reading as one number (§5.3); the satellites are "of", the genitive, so few and many share a form.
 */
const checked = (passes: number, sats: number) =>
  `Sprawdzono ${count(passes, PASSES)} (${count(sats, {
    one: 'satelity obserwacyjnego lub stacji załogowej',
    few: 'satelitów obserwacyjnych i\u00a0stacji załogowych',
    many: 'satelitów obserwacyjnych i\u00a0stacji załogowych',
    other: 'satelity obserwacyjnego lub stacji załogowej',
  })}).`

/** The satellite after a genitive frame: «satelity Sentinel-2C» / «satelity» when the share did not name it */
const ofSat = (sat: string | undefined) => (sat !== undefined ? `satelity ${sat}` : 'satelity')

/** What a pass's mark stands for in the timeline's tooltip: the kind of satellite (masculine, for «satelita») and the mark */
const MARK_KIND: Partial<Record<SatCategory, string>> = {
  'open-optical': 'otwarty · ◇',
  'commercial-optical': 'komercyjny · □',
  radar: 'radarowy · ▣',
  'weather-leo': 'pogodowy · ○',
  crewed: 'załogowy · ✛',
}

const VERDICT_ORDER = ['imaged', 'likely', 'could', 'overhead'] as const

const results: typeof en = {
  // ── the headline ─────────────────────────────────────────────────────────────────────────
  headline: {
    // One accent (the place, first), one strong part with the num() inside it.
    watched: (n: number, place: string, when: WindowWhen): Rich => [
      accent(place),
      ' ',
      strong('pod okiem ', num(int(n)), `\u00a0${f.plural(n, SATS_GEN)}`),
      ` ${inWindow(when)}.`,
    ],
    // «znanych nam», never «śledzonych» (stalking, §8).
    none: (place: string, past: boolean): Rich => [
      accent(place),
      ` poza zasięgiem znanych nam satelitów ${past ? 'w\u00a0tamtym' : 'w\u00a0tym'} tygodniu.`,
    ],
  },

  // ── the second line ──────────────────────────────────────────────────────────────────────
  // «co najmniej» never parts at a line end (§6.9); the space after it stays ordinary, as it goes with the strong part.
  imagesPublic: (k: number): Rich => ['Opublikowano ', strong('co\u00a0najmniej '), num(int(k)), `\u00a0${f.plural(k, IMAGES)}.`],
  noImages: {
    thisWeek: 'W\u00a0tym tygodniu nie opublikowano żadnych obrazów.',
    thatWeek: 'W\u00a0tamtym tygodniu nie opublikowano żadnych obrazów.',
  },
  archiveDown: 'Archiwa nie odpowiedziały, więc na razie nie możemy policzyć publicznych obrazów.',
  // The outage's button stands alone on its own row, so the full words fit.
  tryAgain: 'Spróbuj ponownie',
  share: 'Udostępnij',
  shareWeekLabel: (place: string, past: boolean) => `Udostępnij ${past ? 'tamten' : 'ten'} tydzień: ${place}`,

  why: {
    sunNeverRose: 'Słońce nie wzeszło ani razu, więc żadna kamera dzienna nie mogła zobaczyć tego miejsca.',
    sunBarelyRose: 'Słońce ledwie wzeszło, więc żadna kamera dzienna nie mogła zobaczyć tego miejsca.',
    // Always follows one of the two above, so «je» is «to miejsce» they have just named.
    infrared: (n: number): Rich => ['Satelity pogodowe i\u00a0tak omiotły je w\u00a0podczerwieni ', num(int(n)), `\u00a0${f.plural(n, TIMES)}.`],
    // The classifier carries the verb's agreement whatever the names: «Satelita radarowy Umbra był…», «Satelity
    // radarowe Umbra, Capella i 7 innych były…». The list is Intl's («A, B i C», no comma before «i»).
    radar: (names: readonly string[], others: number, passes: number): Rich => {
      const rest = f.plural(others, { one: 'jeszcze jeden', few: `${int(others)}\u00a0inne`, many: `${int(others)}\u00a0innych`, other: `${int(others)}\u00a0innych` })
      let subject: string
      if (names.length === 1 && others === 0) subject = `Satelita radarowy ${names[0]} był`
      else if (names.length) subject = `Satelity radarowe ${f.list(others > 0 ? [...names, rest] : names)} były`
      else
        subject = f.plural(others, {
          one: 'Satelita radarowy był',
          few: `${int(others)}\u00a0satelity radarowe były`,
          many: `${int(others)}\u00a0satelitów radarowych było`,
          other: `${int(others)}\u00a0satelity radarowego było`,
        })
      return [`Radar nie potrzebuje światła. ${subject} w\u00a0zasięgu `, num(int(passes)), `\u00a0${f.plural(passes, TIMES)}.`]
    },
    // One pass is one satellite: «Satelita … przeleciał … raz»; more are «Satelity … przeleciały … 3 razy».
    unpublished: (n: number) =>
      f.plural(n, {
        one: 'Satelita Sentinel-2 lub Landsat przeleciał nad tym miejscem za dnia raz, ale nie opublikowano jeszcze żadnej sceny.',
        few: `Satelity Sentinel-2 lub Landsat przeleciały nad tym miejscem za dnia ${count(n, TIMES)}, ale nie opublikowano jeszcze żadnej sceny.`,
        many: `Satelity Sentinel-2 lub Landsat przeleciały nad tym miejscem za dnia ${count(n, TIMES)}, ale nie opublikowano jeszcze żadnej sceny.`,
        other: `Satelity Sentinel-2 lub Landsat przeleciały nad tym miejscem za dnia ${count(n, TIMES)}, ale nie opublikowano jeszcze żadnej sceny.`,
      }),
    none: 'Za dnia nad tym miejscem nie przeleciał żaden satelita obserwacyjny z\u00a0otwartym archiwum.',
  },

  // ── the summary's readouts ───────────────────────────────────────────────────────────────
  // «etykieta» is what About calls a verdict («Co znaczą etykiety»).
  verdictGroup: 'Przeloty według etykiet. Każda liczba prowadzi do swojej listy.',
  verdictReadout: (n: number, verdict: Verdict, title: string) => `${int(n)} ${verdicts[verdict].unit(n)}: ${title}`,

  // ── the footnotes ────────────────────────────────────────────────────────────────────────
  notes: {
    counted: (o: { detailed: number; mosaics: number; radar: number; geo: number; passes: number; satellites: number }): Rich => {
      const detailed = f.plural(o.detailed, { one: 'dokładny obraz', few: 'dokładne obrazy', many: 'dokładnych obrazów', other: 'dokładnego obrazu' })
      const out: Part[] = [strong(int(o.detailed)), `\u00a0${detailed} (Sentinel-2, Landsat, 10–30\u00a0m)`]
      if (o.mosaics) {
        const mosaics = f.plural(o.mosaics, {
          one: 'dzienna mozaika pogodowa',
          few: 'dzienne mozaiki pogodowe',
          many: 'dziennych mozaik pogodowych',
          other: 'dziennej mozaiki pogodowej',
        })
        out.push(' · ', strong(int(o.mosaics)), `\u00a0${mosaics} (250–375\u00a0m)`)
      }
      if (o.radar) {
        const radar = f.plural(o.radar, { one: 'obraz radarowy', few: 'obrazy radarowe', many: 'obrazów radarowych', other: 'obrazu radarowego' })
        out.push(' · ', strong(int(o.radar)), `\u00a0${radar} (Sentinel-1, 20\u00a0m)`)
      }
      if (o.geo) {
        out.push(
          ' · ',
          strong(int(o.geo)),
          `\u00a0${f.plural(o.geo, IMAGES)} pełnej tarczy z\u00a0geostacjonarnych satelitów pogodowych (2–5\u00a0km; pokazujemy najnowszy z\u00a0każdego)`,
        )
      }
      out.push(`. ${checked(o.passes, o.satellites)}`)
      return out
    },
    checked: (passes: number, satellites: number) => checked(passes, satellites),
    // The place cannot follow «do» or «od»: the footnote sits under its results, so «tego miejsca» names it.
    passTimes: (_place: string, fetched: string | undefined, zoneLabel: string) =>
      'Czas przelotu to chwila, w\u00a0której satelita był najbliżej tego miejsca, liczona z\u00a0publicznych elementów orbitalnych' +
      `${fetched ? ` (pobranych ${fetched})` : ''}. Czas lokalny: ${zoneLabel}.`,
  },

  // ── the panel ────────────────────────────────────────────────────────────────────────────
  sheetLabel: (place: string) => `${place}: satelity nad tym miejscem`,
  computingPasses: 'Obliczanie przelotów',
  sections: { summary: 'Podsumowanie', passes: 'Przeloty', watchedContinuously: 'Pod stałym okiem' },
  checkingArchives: 'Sprawdzanie archiwów',
  invite: {
    // «Ciebie też» is "you too", stressed; the hero's own verb.
    text: 'Ciebie też coś obserwowało w\u00a0tym tygodniu.',
    checkPlace: 'Sprawdź swoje miejsce',
    dismiss: 'Zamknij',
  },
  searchAnother: 'Szukaj innego miejsca',
  // The back crumb shares a phone's row with the stepper and the search icon: «← Wszystkie przeloty» (18) ran past
  // the sheet's padding below 400 px. The section's own name («02 / Przeloty») says where it goes; the tooltip keeps
  // «Wszystkie przeloty (Esc)».
  allPasses: 'Przeloty',

  footer: {
    replay: 'Odtwórz',
    replayLabel: 'Odtwórz przelot',
    replayTitle: 'Odtwórz przelot na globusie',
    shareLabel: { pass: 'Udostępnij ten przelot', image: 'Udostępnij ten obraz' },
    // Labels never wrap, and the primary gets the row less the back, Replay and gaps (about the viewport − 210 px on a
    // phone): «Udostępnij ten przelot» (22) and «…ten obraz» (20) were cut on 401–445 px phones. One imperative, no
    // object (§7): the accessible name (shareLabel) says what is shared. No strong part, which the English allows.
    shareButton: { pass: ['Udostępnij'] as Rich, image: ['Udostępnij'] as Rich },
    checkPlace: [strong('Sprawdź '), 'swoje miejsce'] as Rich,
    // Beside three icon buttons: «Najczystsze ujęcie» (18) was cut at 360 px and «Zobacz najczystsze ujęcie» (25) at
    // 401–427 px. The neuter «najczystsze» agrees with the «ujęcie» the clouded photo implies; clearestLabel keeps it.
    clearest: [strong('Zobacz '), 'najczystsze'] as Rich,
    clearestLabel: 'Zobacz najczystsze ujęcie',
  },

  // ── the headers ──────────────────────────────────────────────────────────────────────────
  head: {
    windowSpan: (days: number, startMs: number, endMs: number, timeZone: string) =>
      `${count(days, DAYS)} · ${time.dayRange(startMs, endMs, timeZone, localParts(startMs, timeZone), localParts(endMs, timeZone))}`,
    verifying: 'Weryfikacja mozaik pogodowych',
    // The three share one box: «Szukaj» keeps it about as wide as «Zamknij».
    cancel: 'Anuluj',
    newSearch: 'Szukaj',
    close: 'Zamknij',
    escKey: 'Esc',
    searchBarLabel: (place: string) => `Szukaj innego miejsca (teraz: ${place})`,
    change: 'Zmień',
    computing: 'Obliczanie',
    recent: 'Ostatnie',
    // "Of this kind" is the verdict's group in the pass list.
    position: (k: number, n: number) => `Przelot ${int(k)} z ${int(n)} w tej grupie`,
    previous: 'Poprzedni przelot w tej grupie',
    next: 'Następny przelot w tej grupie',
    previousTitle: 'Poprzedni (←)',
    nextTitle: 'Następny (→)',
    allPassesTitle: 'Wszystkie przeloty (Esc)',
    shared: (sat: string, place: string) => `Udostępniono ci · ${place} pod okiem satelity ${sat}`,
    // As the pl 'time' namespace's `stamp` writes it, so this header and the pass's row agree.
    passWhen: (ms: number, timeZone: string, p: DateFields, clock: string, zone: string, approx: boolean) =>
      `${time.day(ms, timeZone, p)} · ${approx ? '≈\u00a0' : ''}${clock}\u00a0${zone}`,
  },

  // ── the computing readout ────────────────────────────────────────────────────────────────
  computing: {
    stages: {
      catalog: { idle: 'Katalog orbit', done: 'Katalog wczytany' },
      propagate: { idle: (days: number) => `Propagacja orbit · ${count(days, DAYS)}`, done: 'Orbity wyliczone' },
      archive: { idle: 'Archiwa Sentinel-2 + Landsat', done: 'Archiwa przeszukane' },
      match: { idle: 'Dopasowywanie scen do przelotów', done: 'Sceny dopasowane' },
    },
    ready: 'Raport gotowy',
    ok: 'OK',
    seconds: (s: number) => `${f.dec(s, 2)}\u00a0s`,
    // «Okno 7 dni» (the genitive: "a window of 7 days"); one day is «doba», as the headline says it.
    window: (days: number, from: UtcWhen, to: UtcWhen): Rich => [
      strong(`Okno ${f.plural(days, { one: `${int(days)}\u00a0doby`, few: count(days, DAYS_GEN), many: count(days, DAYS_GEN), other: count(days, DAYS_GEN) })} · `),
      `${dayMonth(from.ms, 'UTC')} ${from.time} → ${dayMonth(to.ms, 'UTC')} ${to.time}\u00a0UTC`,
    ],
    percent: (pct: number) => `${f.int(pct)}%`,
    slow: 'Planetary Computer i\u00a0NASA renderują obrazy na żądanie; ten krok może potrwać kilka sekund.',
    verySlow:
      'Archiwa obrazów odpowiadają powoli. Jeśli nie odpowiedzą, pokażemy przeloty z\u00a0samej geometrii orbit i\u00a0powiemy o\u00a0tym.',
    // The place before a colon; «udostępniony» agrees with «obraz».
    sharedAlt: (sat: string | undefined, place: string) => `${place}: obraz z ${ofSat(sat)}, udostępniony ci.`,
    // The day already holds its own comma («niedz., 1 lis»), so the clock follows it with a space, as in the pass list.
    sharedCaption: (sat: string | undefined, place: string, when?: PlaceWhen): Rich => [
      strong('Udostępniono ci'),
      ` · ${place} pod okiem ${ofSat(sat)}${when ? ` · ${day(when.ms, when.timeZone)} ${when.time}` : ''}`,
    ],
  },

  // ── 03 / POD STAŁYM OKIEM: geostationary weather satellites ──────────────────────────────
  geo: {
    none: 'Żaden działający geostacjonarny satelita pogodowy nie widzi tego miejsca wyżej niż 5° nad horyzontem.',
    // «co minutę» for 1, as the pass view says it; «min» never declines.
    facts: (lon: string, elevationDeg: number, cadenceMin: number) =>
      `${lon} · elewacja ${f.dec(elevationDeg, 1)}° · ${cadenceMin === 1 ? 'co minutę' : `co ${int(cadenceMin)}\u00a0min`}`,
    images: (n: number, days: number): Rich => [
      num(int(n)),
      days === 7 ? `\u00a0${f.plural(n, IMAGES)} w\u00a0tym tygodniu` : `\u00a0${f.plural(n, IMAGES)} w\u00a0ciągu ${count(days, DAYS_GEN)}`,
    ],
    replay: 'Odtwórz',
    replayLabel: (sat: string) => `${sat}: odtwórz najnowszy obraz`,
    // Two short words in a 64 px square.
    frame: {
      probing: 'Szukanie…',
      noPublic: 'Brak obrazu',
      poorQuality: 'Słaba jakość',
      noneNow: 'Chwilowo brak',
      unavailable: 'Brak klatki',
    },
    frameAlt: (sat: string, infrared: boolean) => `${sat}: najnowsza klatka z okolic tego miejsca${infrared ? ', w podczerwieni' : ''}`,
    // «IR» is how Polish abbreviates infrared too (promieniowanie IR).
    infraredChip: 'IR',
    infraredTitle: 'Podczerwień: wierzchołki chmur według temperatury, im zimniej, tym jaśniej',
  },

  // ── 04 / OŚ CZASU ────────────────────────────────────────────────────────────────────────
  timeline: {
    title: 'Oś czasu',
    meta: (days: number, zoneLabel: string, zones?: string) => `${count(days, DAYS)} · ${zoneLabel}${zones ? ` · ${zones}` : ''}`,
    zoneChange: (before: string, after: string) => `${before} → ${after}`,
    daylight: 'Dzień tutaj',
    // Label: value pairs: «12 zapewne pod okiem» would read as nonsense (§3.6).
    summary: (days: number, counts: Record<Verdict, number>, titles: Readonly<Record<Verdict, string>>) =>
      `Oś czasu, ${count(days, DAYS)}. ` + VERDICT_ORDER.map((v) => `${titles[v]}: ${int(counts[v])}`).join('. ') + '.',
    keysHint: (summary: string) => `${summary} Użyj klawiszy strzałek w lewo i w prawo, by przechodzić między przelotami.`,
    geoLane: (n: number): Rich => [strong('Geo · '), f.int(n)],
    geoNames: (names: readonly string[]) => names.join(', '),
    now: 'Teraz',
    geometry: (deg: number, km: number) => `${f.dec(deg, 1)}° od pionu · ${f.int(km)}\u00a0km`,
    markMosaic: (gsdM: number) => `Dzienna mozaika, ${f.int(gsdM)}\u00a0m · ●`,
    markRadar: (gsdM: number) => `Obraz radarowy, ${f.int(gsdM)}\u00a0m · ◆`,
    markImaged: (title: string) => `${title} · ◆`,
    markKind: (title: string, category: SatCategory) => `${title} · ${MARK_KIND[category] ?? 'inny'}`,
  },

  // ── 02 / POWTÓRKA ────────────────────────────────────────────────────────────────────────
  replay: {
    scrubLabel: 'Czas powtórki w obrębie przelotu',
    scrubValue: (tMinus: string, utc: string) => `${tMinus}, ${utc}`,
    play: 'Odtwórz powtórkę',
    pause: 'Wstrzymaj powtórkę',
    speed: 'Szybkość odtwarzania',
    inView: (duration: string) => `W\u00a0zasięgu ${duration}`,
    closest: 'Najbliżej',
    spaceKey: 'Spacja',
    playPause: 'odtwórz / wstrzymaj',
    stepKind: 'poprzedni / następny przelot w tej grupie',
  },

  // ── the plan view ────────────────────────────────────────────────────────────────────────
  plan: {
    // A nominal second sentence: «był» would need the satellite's gender (a station is «stacja»).
    label: (sat: string, km: number) =>
      `Widok z góry: ślad orbity satelity ${sat}. Największe zbliżenie: ${f.int(km)} km od tego miejsca.`,
    // The corner labels share one row and never wrap (the English pair is at most 15 + 20 characters). The section
    // rule above already says «Widok z góry», so north alone fits here (13). The field of regard and the swath keep
    // the glossary's «Zasięg wychylenia» and «Pas obrazowania» (22 characters each, the swath with a 3-digit width):
    // beside the 13-character north label the row is no wider than the English pair.
    northUp: 'Północ u\u00a0góry',
    fieldOfRegard: (deg: number) => `Zasięg wychylenia ±${deg}°`,
    swath: (km: number) => `Pas obrazowania ${f.int(km)}\u00a0km`,
    groundTrack: 'Ślad orbity',
    scale: (km: number) => `${km >= 1 ? f.int(km) : f.dec(km, 1)}\u00a0km`,
    closest: (km: number) => `Najbliżej ${km < 1 ? '<\u00a01' : f.int(km)}\u00a0km`,
  },

  // ── a picture's product line ─────────────────────────────────────────────────────────────
  // Whole numbers, never grouped: the pixel arrives rounded.
  product: {
    mosaic: (m: number) => `Dzienna mozaika · ${m}\u00a0m`,
    fullDisc: (km: number) => `Pełna tarcza · ${km}\u00a0km`,
    infrared: (km: number) => `Podczerwień · ${km}\u00a0km`,
    sentinel2: (m: number) => `Sentinel-2 L2A · ${m}\u00a0m`,
    landsat: (m: number) => `Landsat C2 L2 · ${m}\u00a0m`,
    sentinel1: (m: number) => `Radar Sentinel-1 · ${m}\u00a0m`,
    other: (m: number) => `${m}\u00a0m`,
  },
  pixel: { m: (m: number) => `${m}\u00a0m`, km: (km: number) => `${km}\u00a0km` },

  // ── the time-lapse's row ─────────────────────────────────────────────────────────────────
  // «Rok po roku» is the feature's name (§3.8); the second line says the place without repeating it.
  timelapse: {
    title: 'Rok po roku',
    sub: 'To miejsce w\u00a0kolejnych latach',
  },
}
export default results
