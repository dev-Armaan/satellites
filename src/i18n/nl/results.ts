/**
 * Dutch copy for the results panel (see docs/i18n/nl.md §3.3, §3.5, §3.7 "Results, pass list and pass view" and
 * "Computing readout", §5, §6, §7): the headline and its second line, the reasons behind a zero, the summary's readouts
 * and footnotes, the computing readout, the headers and footers, the timeline, the replay, the plan view, the
 * geostationary list, the pictures' product lines and the time-lapse row.
 *
 * Why it is built this way:
 *  - The headline reads when, the finding, where: `In de afgelopen 7 dagen **keken 256 satellieten** naar *Waterloo*.`
 *    The fronted time phrase sends the verb second, so the bold count phrase is verb + number + noun, and there is no
 *    comma after the time (§3.3). An older week is written in full (`Tussen 29 oktober en 5 november`), a one-day
 *    window says `24 uur`. Nothing at all: `Geen satelliet die we volgen, keek …`, with the comma between two finite
 *    verbs (§2).
 *  - The second line is `[NUM] beelden zijn openbaar gemaakt.`, and `Minstens` is its only hedge: the strong part,
 *    shown while the count can grow, so the sentence reads with and without it. `beeld`, never `foto`: the count holds
 *    radar images, mosaics and full-disc frames (§4.2).
 *  - The place is inserted bare after `naar`, `over`, `van`, `boven` or `bij`, never with an article and never at a
 *    sentence's start; a sentence that means "it" says `er … overheen` (`vloog er overdag 3 keer overheen`), never
 *    `erover` (§5). Prose spells a single time out (`één keer`) where the guide says so; `keer`, `uur` never change.
 *  - Verdict names are never lowercased into a count: spoken summaries give the title, then the number
 *    (`Bekeken 3, Waarschijnlijk bekeken 31`, §5). Readout labels are nouns; buttons are infinitives (`Delen`,
 *    `Afspelen`), the my/your invitation is `Zoek jouw plek` (§1). A button's strong part, dropped on narrow phones,
 *    may sit in front, so what is left still reads (`delen`, `jouw plek`, `Helderste opname`); CSS uppercases them.
 *  - Days come from the nl 'time' namespace (`zo 1 nov`, `29 okt`, `1 → 8 nov`), so this panel and the pass list say a
 *    day the same way; numbers from fmt('nl') (`7,46`, `1.715`); a number never parts from its unit, nor a clock from
 *    its zone (U+00A0). Clocks, zones, coordinates and UTC stamps arrive written and stay international.
 */
import type en from '../en/results'
import type { PlaceWhen, UtcWhen, WindowWhen } from '../en/results'
import { formatDate } from '../../../api/_lib/i18n/dates'
import { fmt } from '../../../api/_lib/i18n/format'
import { accent, num, strong, type Part, type Rich } from '../../../api/_lib/i18n/parts'
import type { Pass, SatCategory } from '@/types'
import { localParts, type DateFields } from '@/ui/results/lib/time'
import nlTime from './time'
import nlVerdicts from './verdicts'

const f = fmt('nl')
type Verdict = Pass['verdict']
const VERDICTS: readonly Verdict[] = ['imaged', 'likely', 'could', 'overhead']

/** "7 dagen", "1 overvlucht": a grouped count and its noun, never parted */
const count = (n: number, one: string, other: string) => `${f.int(n)} ${f.plural(n, { one, other })}`
const days = (n: number) => count(n, 'dag', 'dagen')
const satellites = (n: number) => f.plural(n, { one: 'satelliet', other: 'satellieten' })
const images = (n: number) => f.plural(n, { one: 'beeld', other: 'beelden' })
/** "29 okt" / "zo 1 nov" at a zone, exactly as the 'time' namespace writes them */
const dayMonth = (ms: number, timeZone: string) => nlTime.dayMonth(ms, timeZone, localParts(ms, timeZone))
const day = (ms: number, timeZone: string) => nlTime.day(ms, timeZone, localParts(ms, timeZone))
/** "29 oktober": a day in full, for a sentence (§5) */
const dayInFull = (ms: number, timeZone: string) => formatDate('nl', ms, timeZone, { day: 'numeric', month: 'long' })

/** The headline's opening: "In de afgelopen 7 dagen", "In de afgelopen 24 uur", "Tussen 29 oktober en 5 november" */
const windowPhrase = (when: WindowWhen) =>
  'lastDays' in when
    ? when.lastDays === 1
      ? 'In de afgelopen 24 uur'
      : `In de afgelopen ${days(when.lastDays)}`
    : `Tussen ${dayInFull(when.fromMs, when.timeZone)} en ${dayInFull(when.toMs, when.timeZone)}`

/** "We controleerden 1.234 overvluchten van 250 satellieten die beelden maken of bemand zijn." */
const checked = (passes: number, sats: number) =>
  `We controleerden ${count(passes, 'overvlucht', 'overvluchten')} van ${f.int(sats)} ` +
  f.plural(sats, { one: 'satelliet die beelden maakt of bemand is.', other: 'satellieten die beelden maken of bemand zijn.' })

/** What a pass's mark stands for in the timeline's tooltip: the kind of satellite and the mark's shape */
// Shown only for a pass with no picture, after its verdict: `open data`, not `openbaar archief` (it would echo the
// imaged definition and say an image is there); `weersatelliet`, not `weer` (alone it reads as "again").
const MARK_KIND: Partial<Record<SatCategory, string>> = {
  'open-optical': 'open data · ◇',
  'commercial-optical': 'commercieel · □',
  radar: 'radar · ▣',
  'weather-leo': 'weersatelliet · ○',
  crewed: 'bemand · ✛',
}

const results: typeof en = {
  // ── the headline ─────────────────────────────────────────────────────────────────────────
  headline: {
    watched: (n: number, place: string, when: WindowWhen): Rich => [
      `${windowPhrase(when)} `,
      strong(f.plural(n, { one: 'keek ', other: 'keken ' }), num(f.int(n)), ` ${satellites(n)}`),
      ' naar ',
      accent(place),
      '.',
    ],
    none: (place: string, past: boolean): Rich => [
      past ? 'Geen satelliet die we volgen, keek in die week naar ' : 'Geen satelliet die we volgen, keek deze week naar ',
      accent(place),
      '.',
    ],
  },

  // ── the second line ──────────────────────────────────────────────────────────────────────
  imagesPublic: (k: number): Rich => [
    strong('Minstens '),
    num(f.int(k)),
    f.plural(k, { one: ' beeld is openbaar gemaakt.', other: ' beelden zijn openbaar gemaakt.' }),
  ],
  noImages: { thisWeek: 'Er zijn deze week geen beelden openbaar gemaakt.', thatWeek: 'Er zijn die week geen beelden openbaar gemaakt.' },
  archiveDown: 'De beeldarchieven reageerden niet, dus we kunnen de openbare beelden nu niet tellen.',
  tryAgain: 'Opnieuw proberen',
  share: 'Delen',
  shareWeekLabel: (place: string, past: boolean) => `${past ? 'Die' : 'Deze'} week van ${place} delen`,

  why: {
    sunNeverRose: 'De zon kwam niet op, dus kon geen enkele daglichtcamera de plek zien.',
    sunBarelyRose: 'De zon kwam nauwelijks op, dus kon geen enkele daglichtcamera de plek zien.',
    infrared: (n: number): Rich =>
      f.plural<Rich>(n, {
        one: ['Weersatellieten streken er toch één keer in infrarood overheen.'],
        other: ['Weersatellieten streken er toch ', num(f.int(n)), ' keer in infrarood overheen.'],
      }),
    // The verb follows how many satellites the list holds, not the passes (§5 "Lists of names").
    radar: (names: readonly string[], others: number, passes: number): Rich => {
      const rest = f.plural(others, { one: `${f.int(others)} andere radarsatelliet`, other: `${f.int(others)} andere radarsatellieten` })
      const who = f.list(others > 0 ? [...names, rest] : names)
      const lead = `Radar heeft geen licht nodig. ${who} ${names.length + others === 1 ? 'kwam' : 'kwamen'} `
      return f.plural<Rich>(passes, {
        one: [`${lead}één keer binnen bereik.`],
        other: [lead, num(f.int(passes)), ' keer binnen bereik.'],
      })
    },
    unpublished: (n: number) => {
      const times = f.plural(n, { one: 'één keer', other: `${f.int(n)} keer` })
      return `Sentinel-2 of Landsat vloog er overdag ${times} overheen, maar er is nog geen opname gepubliceerd.`
    },
    none: 'Geen satelliet met een openbaar archief vloog er overdag overheen.',
  },

  // ── the summary's four readouts ──────────────────────────────────────────────────────────
  verdictGroup: 'Overvluchten per soort. Elke knop springt naar zijn lijst.',
  verdictReadout: (n: number, verdict: Verdict, title: string) => `${f.int(n)} ${nlVerdicts[verdict].unit(n)}: ${title}`,

  // ── the footnotes ────────────────────────────────────────────────────────────────────────
  notes: {
    counted: (o: { detailed: number; mosaics: number; radar: number; geo: number; passes: number; satellites: number }): Rich => {
      const detailed = f.plural(o.detailed, { one: 'gedetailleerd beeld', other: 'gedetailleerde beelden' })
      const out: Part[] = [strong(f.int(o.detailed)), ` ${detailed} (Sentinel-2, Landsat, 10–30 m)`]
      const mosaics = f.plural(o.mosaics, { one: 'dagelijks weermozaïek', other: 'dagelijkse weermozaïeken' })
      if (o.mosaics) out.push(' · ', strong(f.int(o.mosaics)), ` ${mosaics} (250–375 m)`)
      const radar = f.plural(o.radar, { one: 'radarbeeld', other: 'radarbeelden' })
      if (o.radar) out.push(' · ', strong(f.int(o.radar)), ` ${radar} (Sentinel-1, 20 m)`)
      const geo = ` ${images(o.geo)} van de hele aardschijf, gemaakt door geostationaire weersatellieten (2–5 km; van elke satelliet wordt het nieuwste getoond)`
      if (o.geo) out.push(' · ', strong(f.int(o.geo)), geo)
      out.push(`. ${checked(o.passes, o.satellites)}`)
      return out
    },
    checked: (passes: number, satellites: number) => checked(passes, satellites),
    passTimes: (place: string, fetched: string | undefined, zoneLabel: string) =>
      `De tijd van een overvlucht is het moment waarop de satelliet het dichtst bij ${place} was, berekend uit openbare ` +
      `baanelementen${fetched ? ` (opgehaald ${fetched})` : ''}. Lokale tijden: ${zoneLabel}.`,
  },

  // ── the panel ────────────────────────────────────────────────────────────────────────────
  sheetLabel: (place: string) => `Satellieten boven ${place}`,
  computingPasses: 'Overvluchten berekenen',
  sections: { summary: 'Samenvatting', passes: 'Overvluchten', watchedContinuously: 'Voortdurend bekeken' },
  checkingArchives: 'Archieven doorzoeken',
  invite: {
    text: 'Iets keek deze week ook naar jou.',
    checkPlace: 'Zoek jouw plek',
    dismiss: 'Sluiten',
  },
  searchAnother: 'Zoek een andere plek',
  allPasses: 'Alle overvluchten',

  footer: {
    replay: 'Afspelen',
    replayLabel: 'Deze overvlucht afspelen',
    replayTitle: 'Deze overvlucht afspelen op de wereldbol',
    shareLabel: { pass: 'Deze overvlucht delen', image: 'Dit beeld delen' },
    // Narrow phones drop the strong part: `delen` alone. No demonstrative: `Deze overvlucht delen` ran past the
    // button's border beside `Afspelen` on 402 px phones; the accessible name above keeps it.
    shareButton: { pass: [strong('Overvlucht '), 'delen'] as Rich, image: [strong('Beeld '), 'delen'] as Rich },
    // Narrow phones: `jouw plek` (§3.7).
    checkPlace: [strong('Zoek '), 'jouw plek'] as Rich,
    // Narrow phones: `Helderste opname`.
    clearest: ['Helderste opname', strong(' tonen')] as Rich,
    clearestLabel: 'De helderste opname tonen',
  },

  // ── the headers ──────────────────────────────────────────────────────────────────────────
  head: {
    windowSpan: (n: number, startMs: number, endMs: number, timeZone: string) =>
      `${days(n)} · ${nlTime.dayRange(startMs, endMs, timeZone, localParts(startMs, timeZone), localParts(endMs, timeZone))}`,
    verifying: 'Weermozaïeken controleren',
    cancel: 'Annuleren',
    newSearch: 'Nieuwe plek',
    close: 'Sluiten',
    escKey: 'Esc',
    searchBarLabel: (place: string) => `Een andere plek zoeken (nu ${place})`,
    change: 'Wijzigen',
    computing: 'Berekenen',
    recent: 'Recent',
    position: (k: number, n: number) => `Overvlucht ${f.int(k)} van ${f.int(n)} van deze soort`,
    previous: 'Vorige overvlucht van deze soort',
    next: 'Volgende overvlucht van deze soort',
    previousTitle: 'Vorige (←)',
    nextTitle: 'Volgende (→)',
    allPassesTitle: 'Alle overvluchten (Esc)',
    shared: (sat: string, place: string) => `Met je gedeeld · ${sat} keek naar ${place}`,
    passWhen: (ms: number, timeZone: string, p: DateFields, time: string, zone: string, approx: boolean) =>
      `${nlTime.day(ms, timeZone, p)} · ${approx ? '≈ ' : ''}${time} ${zone}`,
  },

  // ── the computing readout ────────────────────────────────────────────────────────────────
  computing: {
    stages: {
      catalog: { idle: 'Baancatalogus', done: 'Catalogus geladen' },
      propagate: { idle: (n: number) => `Banen doorrekenen · ${days(n)}`, done: 'Banen doorgerekend' },
      archive: { idle: 'Archieven van Sentinel-2 + Landsat', done: 'Archieven doorzocht' },
      match: { idle: 'Opnamen aan overvluchten koppelen', done: 'Opnamen gekoppeld' },
    },
    ready: 'Rapport klaar',
    ok: 'OK',
    seconds: (s: number) => `${f.dec(s, 2)} s`,
    // Phones up to 420 px hide the strong part; the span reads alone.
    window: (n: number, from: UtcWhen, to: UtcWhen): Rich => [
      strong(`${days(n)} · `),
      `${dayMonth(from.ms, 'UTC')} ${from.time} → ${dayMonth(to.ms, 'UTC')} ${to.time} UTC`,
    ],
    percent: (pct: number) => `${f.int(pct)}%`,
    slow: 'Planetary Computer en NASA maken elk beeld pas op aanvraag; deze stap kan een paar seconden duren.',
    verySlow:
      'De beeldarchieven reageren traag. Blijft hun antwoord uit, dan tonen we de overvluchten toch, berekend uit de baangeometrie, en zeggen we dat erbij.',
    sharedAlt: (sat: string | undefined, place: string) => `Beeld van ${place}, gemaakt door ${sat ?? 'een satelliet'} en met je gedeeld.`,
    sharedCaption: (sat: string | undefined, place: string, when?: PlaceWhen): Rich => [
      strong('Met je gedeeld'),
      ` · ${sat ?? 'Een satelliet'} keek naar ${place}${when ? ` · ${day(when.ms, when.timeZone)}, ${when.time}` : ''}`,
    ],
  },

  // ── 03 / VOORTDUREND BEKEKEN: geostationary weather satellites ───────────────────────────
  geo: {
    // `staat` for a geostationary satellite (§3.4), so the angle is the satellite's; `operationele` as in 'sats'.
    none: 'Geen operationele geostationaire weersatelliet staat hoger dan 5° boven je horizon.',
    facts: (lon: string, elevationDeg: number, cadenceMin: number) =>
      `${lon} · ${f.dec(elevationDeg, 1)}° hoog · ${f.plural(cadenceMin, { one: 'elke minuut', other: `elke ${f.int(cadenceMin)} min` })}`,
    images: (n: number, d: number): Rich => [num(f.int(n)), d === 7 ? ` ${images(n)} deze week` : ` ${images(n)} in ${days(d)}`],
    replay: 'Afspelen',
    replayLabel: (sat: string) => `${sat}: nieuwste beeld afspelen`,
    // A 72 px square in mono caps, 62 px of text: no word longer than 8 letters on a phone (`KWALITEIT` was clipped).
    frame: {
      probing: 'Zoeken…',
      noPublic: 'Geen openbaar beeld',
      poorQuality: 'Slecht beeld',
      noneNow: 'Nu geen beeld',
      unavailable: 'Laden mislukt',
    },
    frameAlt: (sat: string, infrared: boolean) => `${sat}: nieuwste ${infrared ? 'infraroodbeeld' : 'beeld'} rond de plek`,
    infraredChip: 'IR',
    infraredTitle: 'Infrarood: wolkentoppen naar temperatuur, hoe kouder hoe lichter',
  },

  // ── 04 / TIJDLIJN ────────────────────────────────────────────────────────────────────────
  timeline: {
    title: 'Tijdlijn',
    meta: (n: number, zoneLabel: string, zones?: string) =>
      `${days(n)} · ${zoneLabel}${zones ? ` · ${zones}` : ''}`,
    zoneChange: (before: string, after: string) => `${before} → ${after}`,
    daylight: 'Daglicht hier',
    // Title first, then the count, so nothing has to agree (§5).
    summary: (n: number, counts: Record<Verdict, number>, titles: Readonly<Record<Verdict, string>>) =>
      `Tijdlijn, ${days(n)}: ${VERDICTS.map((v) => `${titles[v]} ${f.int(counts[v])}`).join(', ')}.`,
    keysHint: (summary: string) => `${summary} Gebruik de pijltjestoetsen links en rechts om door de overvluchten te gaan.`,
    geoLane: (n: number): Rich => [strong('Geo · '), f.int(n)],
    geoNames: (names: readonly string[]) => names.join(', '),
    now: 'Nu',
    geometry: (deg: number, km: number) => `${f.dec(deg, 1)}° nadirhoek · ${f.int(km)} km`,
    markMosaic: (gsdM: number) => `Dagmozaïek, ${f.int(gsdM)} m · ●`,
    markRadar: (gsdM: number) => `Radarbeeld, ${f.int(gsdM)} m · ◆`,
    markImaged: (title: string) => `${title} · ◆`,
    markKind: (title: string, category: SatCategory) => `${title} · ${MARK_KIND[category] ?? 'overig'}`,
  },

  // ── 02 / HERHALING ───────────────────────────────────────────────────────────────────────
  replay: {
    scrubLabel: 'Tijdstip binnen de overvlucht',
    scrubValue: (tMinus: string, utc: string) => `${tMinus}, ${utc}`,
    play: 'Herhaling afspelen',
    pause: 'Herhaling pauzeren',
    speed: 'Afspeelsnelheid',
    inView: (duration: string) => `In zicht ${duration}`,
    closest: 'Dichtstbij',
    spaceKey: 'Spatie',
    playPause: 'afspelen / pauzeren',
    // One nowrap row on laptops, after `Spatie afspelen / pauzeren`; under a pass's replay, "pass" goes without saying.
    stepKind: 'vorige / volgende van deze soort',
  },

  // ── the plan view ────────────────────────────────────────────────────────────────────────
  plan: {
    label: (sat: string, km: number) =>
      `Bovenaanzicht: grondspoor van ${sat}, bij de dichtste nadering ${f.int(km)} km van de plek.`,
    // At most 15 characters: it shares the top row with the label on the right.
    northUp: 'Noorden boven',
    fieldOfRegard: (deg: number) => `Richtbereik ±${f.int(deg)}°`,
    swath: (km: number) => `Strook ${f.int(km)} km`,
    groundTrack: 'Grondspoor',
    scale: (km: number) => `${km >= 1 ? f.int(km) : f.dec(km, 1)} km`,
    closest: (km: number) => `Dichtstbij ${km < 1 ? '< 1' : f.int(km)} km`,
  },

  // ── a picture's product line ─────────────────────────────────────────────────────────────
  // Product names stay as they are; a satellite name is never compounded (`Sentinel-1 · radar`, not `Sentinel-1-radar`).
  product: {
    mosaic: (m: number) => `Dagmozaïek · ${m} m`,
    fullDisc: (km: number) => `Hele schijf · ${km} km`,
    infrared: (km: number) => `Infrarood · ${km} km`,
    sentinel2: (m: number) => `Sentinel-2 L2A · ${m} m`,
    landsat: (m: number) => `Landsat C2 L2 · ${m} m`,
    sentinel1: (m: number) => `Sentinel-1 · radar · ${m} m`,
    other: (m: number) => `${m} m`,
  },
  pixel: { m: (m: number) => `${m} m`, km: (km: number) => `${km} km` },

  // ── the time-lapse row ───────────────────────────────────────────────────────────────────
  timelapse: {
    title: 'Timelapse',
    sub: 'Deze plek, jaar na jaar',
  },
}
export default results
