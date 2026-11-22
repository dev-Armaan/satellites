/**
 * German copy for the results panel (see src/i18n/en/results.ts for where each message shows, its slots and its
 * constraints; docs/i18n/de.md §3.3, §3.6, §3.9 and §5 are the authority on every line here): the headline and its
 * second line, the reasons behind a zero, the summary's readouts and footnotes, the computing readout, the headers and
 * footer, the timeline, the replay, the plan view, the geostationary list, the product lines and the time-lapse row.
 *
 * Why it is built this way:
 *  - The headline keeps the English bold run in one piece, with Präteritum and inversion: the fronted time phrase sends
 *    the verb second, without a comma, and the subject follows it: *In den letzten 7 Tagen **beobachteten 256
 *    Satelliten** *Waterloo*.* The plural verb with the plural count (or *1 Satellit*, *kein uns bekannter Satellit*)
 *    is unmistakably the subject, so the bare place is safely the object (§3.3, §5.1). An older week is *Vom 29.10. bis
 *    05.11.*, a one-day window *Am letzten Tag*. A curated place that German writes with an article gets it from the
 *    one names table (api/_lib/i18n/card/deNames.ts), as plain text before the serif name: *… den *Central Park*.*
 *    Gazetteer labels are never looked up and stay bare; no full stop is added after a name that ends on one (*D.C.*).
 *  - The second line is *[NUM] Bilder wurden veröffentlicht.*, and *Mindestens* is its only hedge: the strong part,
 *    shown while the count can grow, so the sentence reads with and without it. *Bilder*, never *Fotos*: the count
 *    holds radar images, mosaics and full-disc frames. Zero is its own sentence with *keine* (§5.3).
 *  - Body prose never repeats the place's name: it says *den Ort*, *dem Ort* (our noun, whose case we set). Labels and
 *    spoken names take it after a colon (*Überflüge: Waterloo*, *Diese Woche teilen: Waterloo*), and the one object
 *    slot after a satellite's name (*Sentinel-2C beobachtete Waterloo*) is safe because the name comes first (§5.1).
 *  - A nameless satellite is written by each sentence in the case it needs: *Ein Satellit beobachtete*, *Bild eines
 *    Satelliten* (§5.2).
 *  - Code never lowercases a German title: the timeline's spoken summary pairs each verdict's name with its count
 *    (*Beobachtet 12, Vermutlich beobachtet 3*, §3.6).
 *  - Buttons are infinitives (*Teilen*, *Abspielen*, *Ort prüfen*); a button's strong part, dropped on narrow phones,
 *    sits in front, so what is left still reads (*teilen*, *Ort prüfen*); CSS uppercases them. Mono labels are nouns in
 *    sentence case. Log lines (the computing rows) use noun style (§2.5).
 *  - Days come from the German 'time' namespace (*So 01.11.*, *29.10.*, *01.11. → 08.11.*), so this panel, the pass
 *    list and the headers write a day the same way; numbers from fmt('de') (*7,46*, *1.715*); a number never parts from
 *    its unit, nor a clock from its zone (U+00A0); every zone goes through zoneDe (CET → MEZ, §6.3).
 */
import type en from '../en/results'
import type { PlaceWhen, UtcWhen, WindowWhen } from '../en/results'
import { fmt } from '../../../api/_lib/i18n/format'
import { accent, num, strong, type Part, type Rich } from '../../../api/_lib/i18n/parts'
import { zoneDe } from '../../../api/_lib/i18n/card/deZone'
import { accDe } from '../../../api/_lib/i18n/card/deNames'
import type { Pass, SatCategory } from '@/types'
import { localParts, type DateFields } from '@/ui/results/lib/time'
import deTime from './time'
import deVerdicts from './verdicts'

const f = fmt('de')
type Verdict = Pass['verdict']
const VERDICTS: readonly Verdict[] = ['imaged', 'likely', 'could', 'overhead']

/** "7 Tage", "1 Tag" (nominative and accusative), a number and its noun never parted */
const days = (n: number) => f.plural(n, { one: `${f.int(n)} Tag`, other: `${f.int(n)} Tage` })
/** "in 5 Tagen", "in 1 Tag" (dative) */
const inDays = (n: number) => f.plural(n, { one: `in ${f.int(n)} Tag`, other: `in ${f.int(n)} Tagen` })
/** "29.10." / "So 01.11." at a zone, exactly as the 'time' namespace writes them */
const dayMonth = (ms: number, timeZone: string) => deTime.dayMonth(ms, timeZone, localParts(ms, timeZone))
const day = (ms: number, timeZone: string) => deTime.day(ms, timeZone, localParts(ms, timeZone))
/** "10 m", "0,5 km": a pixel or scale size as it arrives (never grouped), with the German decimal comma */
const size = (v: number) => String(v).replace('.', ',')

/** Ends on a full stop or a mark already: *Washington, D.C.* takes no second one */
const closed = (s: string) => /[.…!?]$/u.test(s)
/** The headline's place: a curated article as plain text, the name as the serif accent, then the full stop */
const placeAccent = (place: string): Part[] => {
  const article = accDe(place)
  return [...(article ? [article] : []), accent(place), ...(closed(place) ? [] : ['.'])]
}
/** The place as an accusative object in a tag: "Waterloo", "den Central Park" */
const obj = (place: string) => `${accDe(place)}${place}`

/** The headline's opening: "In den letzten 7 Tagen", "Am letzten Tag", "Vom 29.10. bis 05.11." */
const windowPhrase = (when: WindowWhen) =>
  'lastDays' in when
    ? f.plural(when.lastDays, { one: 'Am letzten Tag', other: `In den letzten ${f.int(when.lastDays)} Tagen` })
    : `Vom ${dayMonth(when.fromMs, when.timeZone)} bis ${dayMonth(when.toMs, when.timeZone)}`

/**
 * "1.234 Überflüge von 250 Erdbeobachtungssatelliten und Raumstationen geprüft." (§3.3). One satellite says what it
 * may be; no pass at all says so rather than "0 Überflüge" (§5.3).
 */
const checkedDe = (passes: number, sats: number) => {
  const from = f.plural(sats, {
    one: `von ${f.int(sats)} Satelliten (Erdbeobachtung oder Raumstation)`,
    other: `von ${f.int(sats)} Erdbeobachtungssatelliten und Raumstationen`,
  })
  if (passes <= 0) return `Kein Überflug ${from} gefunden.`
  return `${f.plural(passes, { one: `${f.int(passes)} Überflug`, other: `${f.int(passes)} Überflüge` })} ${from} geprüft.`
}

/** What a pass's mark stands for in the timeline's tooltip: the kind of satellite and the mark's shape */
const MARK_KIND: Partial<Record<SatCategory, string>> = {
  'open-optical': 'offene Kamera · ◇',
  'commercial-optical': 'kommerziell · □',
  radar: 'Radar · ▣',
  'weather-leo': 'Wetter · ○',
  crewed: 'Raumstation · ✛',
}

const results: typeof en = {
  // ── the headline ─────────────────────────────────────────────────────────────────────────
  headline: {
    // The strong run is verb + number + noun; the num() inside it, one accent: the place.
    watched: (n: number, place: string, when: WindowWhen): Rich => [
      `${windowPhrase(when)} `,
      strong(f.plural(n, { one: 'beobachtete ', other: 'beobachteten ' }), num(f.int(n)), f.plural(n, { one: ' Satellit', other: ' Satelliten' })),
      ' ',
      ...placeAccent(place),
    ],
    // *Kein uns bekannter Satellit*: the one phrase for "no satellite we track" (§3.3). No bold.
    none: (place: string, past: boolean): Rich => [
      past ? 'In der gezeigten Woche beobachtete kein uns bekannter Satellit ' : 'Diese Woche beobachtete kein uns bekannter Satellit ',
      ...placeAccent(place),
    ],
  },

  // ── the second line ──────────────────────────────────────────────────────────────────────
  // Reads whole with and without *Mindestens* (the strong part, hidden once the count is final).
  imagesPublic: (k: number): Rich => [
    strong('Mindestens '),
    num(f.int(k)),
    f.plural(k, { one: ' Bild wurde veröffentlicht.', other: ' Bilder wurden veröffentlicht.' }),
  ],
  noImages: {
    thisWeek: 'Diese Woche wurden keine Bilder veröffentlicht.',
    thatWeek: 'In der gezeigten Woche wurden keine Bilder veröffentlicht.',
  },
  archiveDown: 'Die Bildarchive haben nicht geantwortet, darum können wir die öffentlichen Bilder gerade nicht zählen.',
  tryAgain: 'Erneut versuchen',
  share: 'Teilen',
  // A colon frame: the bare name never follows a preposition (§5.1).
  shareWeekLabel: (place: string, past: boolean) => `${past ? 'Die gezeigte Woche' : 'Diese Woche'} teilen: ${place}`,

  // Each reason is a whole sentence about *den Ort*; *ihn* in the infrared line is the sun line's *den Ort*, which
  // always comes before it (§3.3). The only word numbers are *einmal* and *kein* (§5.3); a mono count takes *-mal*
  // with no space.
  why: {
    sunNeverRose: 'Die Sonne ging nie auf, also konnte keine Tageslichtkamera den Ort sehen.',
    sunBarelyRose: 'Die Sonne stieg kaum über den Horizont, also konnte keine Tageslichtkamera den Ort sehen.',
    infrared: (n: number): Rich =>
      f.plural<Rich>(n, {
        one: ['Wettersatelliten erfassten ihn trotzdem im Infrarot, einmal.'],
        other: ['Wettersatelliten erfassten ihn trotzdem im Infrarot, ', num(f.int(n)), '-mal.'],
      }),
    // The verb follows the whole list: one name alone takes the singular, anything more the plural (§5.4).
    radar: (names: readonly string[], others: number, passes: number): Rich => {
      const rest = f.plural(others, { one: `${f.int(others)} weiterer Radarsatellit`, other: `${f.int(others)} weitere Radarsatelliten` })
      const who = f.list(others > 0 ? [...names, rest] : names)
      const lead = `Radar braucht kein Licht. ${who} ${names.length + Math.max(0, others) === 1 ? 'kam' : 'kamen'} `
      return f.plural<Rich>(passes, {
        one: [`${lead}einmal in Reichweite.`],
        other: [lead, num(f.int(passes)), '-mal in Reichweite.'],
      })
    },
    unpublished: (n: number) => {
      if (n <= 0) return 'Sentinel-2 oder Landsat überflog den Ort bei Tageslicht, aber es ist noch keine Szene veröffentlicht.'
      const times = f.plural(n, { one: 'einmal', other: `${f.int(n)}-mal` })
      return `Sentinel-2 oder Landsat überflog den Ort ${times} bei Tageslicht, aber es ist noch keine Szene veröffentlicht.`
    },
    none: 'Kein Erdbeobachtungssatellit mit offenen Daten überflog den Ort bei Tageslicht.',
  },

  // ── the summary's four readouts ──────────────────────────────────────────────────────────
  verdictGroup: 'Überflüge nach Art. Jede Zahl führt zu ihrer Liste.',
  // Mirrors the readout on screen (*0 ÜBERFLÜGE* under a disabled tile, too).
  verdictReadout: (n: number, verdict: Verdict, title: string) => `${f.int(n)} ${deVerdicts[verdict].unit(n)}: ${title}`,

  // ── the footnotes ────────────────────────────────────────────────────────────────────────
  notes: {
    // Each count bold; strong adjective endings after a number (*1 detailliertes Bild*, *12 detaillierte Bilder*). A
    // breakdown with no detailed image opens on *Keine*, never *0* (§5.3).
    counted: (o: { detailed: number; mosaics: number; radar: number; geo: number; passes: number; satellites: number }): Rich => {
      const out: Part[] =
        o.detailed > 0
          ? [
              strong(f.int(o.detailed)),
              f.plural(o.detailed, { one: ' detailliertes Bild', other: ' detaillierte Bilder' }),
              ' (Sentinel-2, Landsat, 10–30 m)',
            ]
          : [strong('Keine'), ' detaillierten Bilder (Sentinel-2, Landsat, 10–30 m)']
      if (o.mosaics)
        out.push(
          ' · ',
          strong(f.int(o.mosaics)),
          f.plural(o.mosaics, { one: ' tägliches Wettermosaik', other: ' tägliche Wettermosaike' }),
          ' (250–375 m)',
        )
      if (o.radar)
        out.push(' · ', strong(f.int(o.radar)), f.plural(o.radar, { one: ' Radarbild', other: ' Radarbilder' }), ' (Sentinel-1, 20 m)')
      if (o.geo)
        out.push(
          ' · ',
          strong(f.int(o.geo)),
          f.plural(o.geo, {
            one: ' Vollscheibenbild eines geostationären Wettersatelliten (2–5 km)',
            other: ' Vollscheibenbilder geostationärer Wettersatelliten (2–5 km; von jedem wird das neueste gezeigt)',
          }),
        )
      out.push(`. ${checkedDe(o.passes, o.satellites)}`)
      return out
    },
    checked: (passes: number, satellites: number) => checkedDe(passes, satellites),
    // Body prose says *dem Ort*, not the name (§5.1).
    passTimes: (_place: string, fetched: string | undefined, zoneLabel: string) =>
      'Die Überflugzeiten geben an, wann jeder Satellit dem Ort am nächsten war, berechnet aus öffentlichen Bahnelementen' +
      `${fetched ? ` (abgerufen ${fetched})` : ''}. Ortszeit: ${zoneLabel}.`,
  },

  // ── the panel ────────────────────────────────────────────────────────────────────────────
  sheetLabel: (place: string) => `Überflüge: ${place}`,
  computingPasses: 'Überflüge werden berechnet',
  sections: { summary: 'Übersicht', passes: 'Überflüge', watchedContinuously: 'Ständig beobachtet' },
  checkingArchives: 'Archive werden geprüft',
  invite: {
    // Echoes the hero word for word, as the share hook does (§3.5).
    text: 'Etwas hat auch dich diese Woche beobachtet.',
    checkPlace: 'Deinen Ort prüfen',
    dismiss: 'Ausblenden',
  },
  searchAnother: 'Anderen Ort suchen',
  allPasses: 'Alle Überflüge',

  footer: {
    replay: 'Abspielen',
    replayLabel: 'Überflug abspielen',
    replayTitle: 'Überflug auf dem Globus abspielen',
    shareLabel: { pass: 'Überflug teilen', image: 'Bild teilen' },
    // Narrow phones drop the strong part: *teilen* alone.
    shareButton: { pass: [strong('Überflug '), 'teilen'] as Rich, image: [strong('Bild '), 'teilen'] as Rich },
    // Narrow phones: *Ort prüfen*.
    checkPlace: [strong('Deinen '), 'Ort prüfen'] as Rich,
    // No strong part: *Klarster Blick* fits every width as it is (§3.9).
    clearest: ['Klarster Blick'] as Rich,
    clearestLabel: 'Klarsten Blick ansehen',
  },

  // ── the headers ──────────────────────────────────────────────────────────────────────────
  head: {
    windowSpan: (n: number, startMs: number, endMs: number, timeZone: string) =>
      `${days(n)} · ${deTime.dayRange(startMs, endMs, timeZone, localParts(startMs, timeZone), localParts(endMs, timeZone))}`,
    verifying: 'Wettermosaike werden geprüft',
    // *Neue Suche* is as wide as *New search* (79 px), so the shared box keeps its width (§7).
    cancel: 'Abbrechen',
    newSearch: 'Neue Suche',
    close: 'Schließen',
    escKey: 'Esc',
    searchBarLabel: (place: string) => `Anderen Ort suchen (jetzt: ${place})`,
    change: 'Ändern',
    computing: 'Berechnung',
    recent: 'Zuletzt',
    position: (k: number, n: number) => `Überflug ${f.int(k)} von ${f.int(n)} dieser Art`,
    previous: 'Vorheriger Überflug dieser Art',
    next: 'Nächster Überflug dieser Art',
    previousTitle: 'Vorheriger (←)',
    nextTitle: 'Nächster (→)',
    allPassesTitle: 'Alle Überflüge (Esc)',
    // The satellite's name comes first, so the place is safely its object; a tag stays bare like a headline (§5.2).
    shared: (sat: string, place: string) => `Mit dir geteilt · ${sat} beobachtete ${obj(place)}`,
    // Exactly the 'time' namespace's stamp: *So 01.11. · ≈ 16:14 MEZ*.
    passWhen: (ms: number, timeZone: string, p: DateFields, time: string, zone: string, approx: boolean) =>
      `${deTime.day(ms, timeZone, p)} · ${approx ? '≈ ' : ''}${time} ${zoneDe(zone)}`,
  },

  // ── the computing readout ────────────────────────────────────────────────────────────────
  computing: {
    // Log style (§2.5): nouns and participles, one line each.
    stages: {
      catalog: { idle: 'Bahnkatalog', done: 'Katalog geladen' },
      propagate: { idle: (n: number) => `Bahnberechnung · ${days(n)}`, done: 'Bahnen berechnet' },
      archive: { idle: 'Archive Sentinel-2 + Landsat', done: 'Archive durchsucht' },
      match: { idle: 'Szenen zuordnen', done: 'Szenen zugeordnet' },
    },
    ready: 'Bericht fertig',
    ok: 'OK',
    seconds: (s: number) => `${f.dec(s, 2)} s`,
    // Phones up to 420 px hide the strong part; the span reads alone. *7 Tage · *, as the header's window span writes
    // it: with the percentage the line is 353 px in the desktop dock's 382 (English 375–384); *7-Tage-Fenster* made it
    // 414 and cut off *UTC* (§3.9).
    window: (n: number, from: UtcWhen, to: UtcWhen): Rich => [
      strong(`${days(n)} · `),
      `${dayMonth(from.ms, 'UTC')} ${from.time} → ${dayMonth(to.ms, 'UTC')} ${to.time} UTC`,
    ],
    percent: (pct: number) => `${f.int(pct)} %`,
    slow: 'Planetary Computer und die NASA berechnen Bilder auf Anfrage; dieser Schritt kann einige Sekunden dauern.',
    verySlow:
      'Die Bildarchive antworten langsam. Bleibt die Antwort aus, zeigen wir die Überflüge trotzdem aus der Bahngeometrie und sagen das dazu.',
    // A colon frame for the place; a nameless satellite in the genitive.
    sharedAlt: (sat: string | undefined, place: string) =>
      `${sat !== undefined ? `Bild von ${sat}` : 'Bild eines Satelliten'}: ${place}, mit dir geteilt.`,
    sharedCaption: (sat: string | undefined, place: string, when?: PlaceWhen): Rich => [
      strong('Mit dir geteilt'),
      ` · ${sat ?? 'Ein Satellit'} beobachtete ${obj(place)}${when ? ` · ${day(when.ms, when.timeZone)}, ${when.time}` : ''}`,
    ],
  },

  // ── 03 / STÄNDIG BEOBACHTET: geostationary weather satellites ────────────────────────────
  geo: {
    none: 'Kein aktiver geostationärer Wettersatellit sieht diesen Ort mehr als 5° über dem Horizont.',
    facts: (lon: string, elevationDeg: number, cadenceMin: number) =>
      `${lon} · ${f.dec(elevationDeg, 1)}° hoch · ${f.plural(cadenceMin, { one: 'jede Minute', other: `alle ${f.int(cadenceMin)} min` })}`,
    // Nothing in the window says *Keine Bilder*, never *0 Bilder* (§5.3).
    images: (n: number, d: number): Rich => {
      const when = d === 7 ? ' diese Woche' : ` ${inDays(d)}`
      if (n <= 0) return [`Keine Bilder${when}`]
      return [num(f.int(n)), `${f.plural(n, { one: ' Bild', other: ' Bilder' })}${when}`]
    },
    replay: 'Abspielen',
    replayLabel: (sat: string) => `${sat}: neuestes Bild abspielen`,
    // A 72 px square with 4 px padding, mono caps at 9.5 px (10.5 on phones), and a word cannot wrap: measured with the
    // mono cut, *ÖFFENTLICHES* is 80 / 89 px and would be cut on both sides, *ÖFFENTLICH* 67 / 74 px, *VERFÜGBAR* 60 / 67
    // (the English *UNAVAILABLE* is 74 / 81). So the note says *Nicht öffentlich*, the picture being understood.
    frame: {
      probing: 'Suche …',
      noPublic: 'Nicht öffentlich',
      poorQuality: 'Geringe Qualität',
      noneNow: 'Gerade kein Bild',
      unavailable: 'Bild nicht verfügbar',
    },
    frameAlt: (sat: string, infrared: boolean) => `${sat}: neuestes ${infrared ? 'Infrarotbild' : 'Bild'} rund um den Ort`,
    infraredChip: 'IR',
    infraredTitle: 'Infrarot: Wolkenobergrenzen nach Temperatur, je kälter, desto heller',
  },

  // ── 04 / ZEITLEISTE ──────────────────────────────────────────────────────────────────────
  timeline: {
    title: 'Zeitleiste',
    // `zones` is one abbreviation or the zoneChange pair; zoneDe leaves an already German name as it is.
    meta: (n: number, zoneLabel: string, zones?: string) =>
      `${days(n)} · ${zoneLabel}${zones ? ` · ${zones.split(' → ').map(zoneDe).join(' → ')}` : ''}`,
    zoneChange: (before: string, after: string) => `${zoneDe(before)} → ${zoneDe(after)}`,
    daylight: 'Tageslicht hier',
    // Each title, then its count: code never lowercases a German title (§3.6, §6.4).
    summary: (n: number, counts: Record<Verdict, number>, titles: Readonly<Record<Verdict, string>>) =>
      `Zeitleiste, ${days(n)}: ${VERDICTS.map((v) => `${titles[v]} ${f.int(counts[v])}`).join(', ')}.`,
    keysHint: (summary: string) => `${summary} Mit den Pfeiltasten links und rechts gehst du durch die Überflüge.`,
    geoLane: (n: number): Rich => [strong('Geo · '), f.int(n)],
    geoNames: (names: readonly string[]) => names.join(', '),
    now: 'Jetzt',
    geometry: (deg: number, km: number) => `${f.dec(deg, 1)}° Off-Nadir · ${f.int(km)} km`,
    markMosaic: (gsdM: number) => `Tagesmosaik, ${f.int(gsdM)} m · ●`,
    markRadar: (gsdM: number) => `Radarbild, ${f.int(gsdM)} m · ◆`,
    markImaged: (title: string) => `${title} · ◆`,
    markKind: (title: string, category: SatCategory) => `${title} · ${MARK_KIND[category] ?? 'sonstige'}`,
  },

  // ── 02 / WIEDERGABE ──────────────────────────────────────────────────────────────────────
  replay: {
    scrubLabel: 'Szenenzeit im Überflug',
    scrubValue: (tMinus: string, utc: string) => `${tMinus}, ${utc}`,
    play: 'Wiedergabe starten',
    pause: 'Wiedergabe anhalten',
    speed: 'Wiedergabetempo',
    inView: (duration: string) => `In Sicht ${duration}`,
    closest: 'Am nächsten',
    // The laptop key-hint row never wraps (10 px, about 406 px visible, clipped without an ellipsis), and the
    // *LEERTASTE* cap is wider than *SPACE*: *Start / Pause* and, after the ← → caps that already say back and forth,
    // *Überflüge dieser Art* keep the row at 391 px (English 449; *Abspielen / Pause* + *voriger / nächster Überflug
    // dieser Art* was 547).
    spaceKey: 'Leertaste',
    playPause: 'Start / Pause',
    stepKind: 'Überflüge dieser Art',
  },

  // ── the plan view ────────────────────────────────────────────────────────────────────────
  plan: {
    label: (sat: string, km: number) =>
      `Draufsicht, ${sat}: Bodenspur, ${km < 1 ? 'unter 1' : f.int(km)} km vom Ort bei größter Annäherung.`,
    // No longer than the English: it shares the plan's top row with *Schwenkbereich ±45°* (128 px at 9.5 px, English
    // *Field of regard ±45°* 134). *Draufsicht · Norden oben* would be 161 px against *Plan · north up*'s 101 and run
    // into it on a phone; the section rule above already says *Draufsicht*, so the corner names the orientation (74).
    northUp: 'Norden oben',
    fieldOfRegard: (deg: number) => `Schwenkbereich ±${f.int(deg)}°`,
    swath: (km: number) => `Streifen ${f.int(km)} km`,
    groundTrack: 'Bodenspur',
    scale: (km: number) => `${km >= 1 ? f.int(km) : f.dec(km, 1)} km`,
    closest: (km: number) => `Abstand ${km < 1 ? '< 1' : f.int(km)} km`,
  },

  // ── a picture's product line ─────────────────────────────────────────────────────────────
  // Product names stay as they are; *Sentinel-1-Radar* is hyphenated through (§6.1).
  product: {
    mosaic: (m: number) => `Tagesmosaik · ${size(m)} m`,
    fullDisc: (km: number) => `Vollscheibe · ${size(km)} km`,
    infrared: (km: number) => `Infrarot · ${size(km)} km`,
    sentinel2: (m: number) => `Sentinel-2 L2A · ${size(m)} m`,
    landsat: (m: number) => `Landsat C2 L2 · ${size(m)} m`,
    sentinel1: (m: number) => `Sentinel-1-Radar · ${size(m)} m`,
    other: (m: number) => `${size(m)} m`,
  },
  pixel: { m: (m: number) => `${size(m)} m`, km: (km: number) => `${size(km)} km` },

  // ── the time-lapse row ───────────────────────────────────────────────────────────────────
  timelapse: {
    title: 'Zeitraffer',
    sub: 'Dieser Ort, Jahr für Jahr',
  },
}

export default results
