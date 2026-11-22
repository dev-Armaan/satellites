/**
 * Italian copy for the results panel (see src/i18n/en/results.ts; docs/i18n/it.md §3.3, §3.6, §3.7, §4, §5, §6, §7):
 * the headline and its second line, the reasons no image was made public, the summary's readouts and footnotes, the
 * computing readout, the headers and footer, the timeline, the replay controls, the plan view, the geostationary list,
 * the product lines and the time-lapse row.
 *
 * Why it reads this way:
 *  - The headline keeps English's order and ends on the place, bare, as the direct object of an *avere* perfect, so no
 *    preposition, article or gender ever touches it: *Negli ultimi 7 giorni, **256 satelliti hanno osservato**
 *    *Waterloo*.* Zero puts the week first (*Questa settimana nessun satellite che seguiamo ha osservato *Waterloo*.*),
 *    so the serif place stays last. An older week is a prose range whose article comes from the day number (*Dal 29
 *    ottobre al 5 novembre*, *Dall’8 al 15 novembre*, *Dal 1 all’8 novembre*), the month written once, the years only
 *    when the range crosses one.
 *  - Counts take all three CLDR forms; exact millions (`many`) put *di* after the number as plain text
 *    (*1.000.000 di immagini*). The second line is *Sono state pubblicate 40 immagini.*: one line beside Share, as the
 *    English is (*40 immagini sono state rese pubbliche.* wrapped on every screen); it reads with and without
 *    *almeno*, which appears and disappears in place after the verb.
 *  - Sentences under an empty headline resume the place as *questo luogo*, never a pronoun; footnotes say *questo
 *    luogo* where English names the place after a preposition. Labels put a place after a colon (*Condividi questa
 *    settimana: Waterloo*). Satellite names stay bare and agree with nothing (*Sentinel-2C ha osservato…*, *di
 *    Sentinel-2C*).
 *  - Mono labels are nouns in sentence case (CSS sets the capitals), status words are nouns (*Calcolo dei passaggi*,
 *    *Verifica degli archivi*), buttons are tu imperatives (*Condividi*, *Rivedi*, *Riprova*, *Annulla*).
 *  - Days are written as the Italian 'time' namespace writes them (*dom 1 nov*, *1 → 8 nov*), so a header and a row
 *    of the same pass agree; numbers come from fmt('it') (*1,84 s*, *38,0°*, *16.912*), and a number never parts from
 *    its unit (no-break space).
 *  - The timeline's spoken summary can't put a masculine singular title after a plural count (*12 osservato*), so it
 *    names each verdict and gives its count after a colon (*Osservato: 12, probabilmente osservato: 3…*).
 */
import type en from '../en/results'
import type { PlaceWhen, UtcWhen, WindowWhen } from '../en/results'
import { fmt } from '../../../api/_lib/i18n/format'
import { formatDate } from '../../../api/_lib/i18n/dates'
import { accent, num, strong, type Part, type Rich } from '../../../api/_lib/i18n/parts'
import type { Pass, SatCategory } from '@/types'
import { localParts, type DateFields } from '@/ui/results/lib/time'
import itTime from './time'
import itVerdicts from './verdicts'

const f = fmt('it')
type Verdict = Pass['verdict']

/** *7 giorni*, *1 giorno*, *1.000.000 di giorni*: days are a unit, tied to their number */
const days = (n: number) => `${f.int(n)} ${f.plural(n, { one: 'giorno', many: 'di giorni', other: 'giorni' })}`
/** *1 passaggio*, *31 passaggi*, *1.000.000 di passaggi* */
const passes = (n: number) => `${f.int(n)} ${f.plural(n, { one: 'passaggio', many: 'di passaggi', other: 'passaggi' })}`
/** *immagine · immagini · di immagini*: the noun after a count of images, with what follows it */
const images = (n: number, rest = '') =>
  f.plural(n, { one: `immagine${rest}`, many: `di immagini${rest}`, other: `immagini${rest}` })
/** *1 volta*, *42 volte*, *1.000.000 di volte*: the words after a num() count of times, ending the sentence */
const times = (n: number) => f.plural(n, { one: ' volta.', many: ' di volte.', other: ' volte.' })

/** "29 ott", "dom 1 nov" at a zone: the Italian 'time' forms, from the instant */
const dayMonth = (ms: number, timeZone: string) => itTime.dayMonth(ms, timeZone, localParts(ms, timeZone))
const day = (ms: number, timeZone: string) => itTime.day(ms, timeZone, localParts(ms, timeZone))

/** *novembre*: the month of `p`'s civil date, from CLDR (read at noon UTC, whatever zone `p` was read at) */
const monthName = (p: DateFields) => formatDate('it', Date.UTC(p.year, p.month - 1, p.day, 12), 'UTC', { month: 'long' })
/** Among days 1–31 only 8 and 11 take the elided article; 1 is read *primo* and takes *il* (§5.5) */
const elided = (d: number) => d === 8 || d === 11
/**
 * An older week as a prose range, at the start of a sentence: *Dal 29 ottobre al 5 novembre*, *Dall’8 al 15
 * novembre*, *Dal 1 all’8 novembre*, *Dal 29 dicembre 2026 al 5 gennaio 2027*.
 */
function range(fromMs: number, toMs: number, timeZone: string): string {
  const a = localParts(fromMs, timeZone)
  const b = localParts(toMs, timeZone)
  const sameYear = a.year === b.year
  const from = sameYear && a.month === b.month ? `${a.day}` : `${a.day} ${monthName(a)}${sameYear ? '' : ` ${a.year}`}`
  const to = `${b.day} ${monthName(b)}${sameYear ? '' : ` ${b.year}`}`
  return `${elided(a.day) ? 'Dall’' : 'Dal '}${from} ${elided(b.day) ? 'all’' : 'al '}${to}`
}

/** *Abbiamo controllato 1234 passaggi di 250 satelliti di osservazione e con equipaggio.* */
const checkedIt = (n: number, sats: number) =>
  `Abbiamo controllato ${passes(n)} di ${f.int(sats)} ${f.plural(sats, {
    one: 'satellite di osservazione o con equipaggio',
    many: 'di satelliti di osservazione e con equipaggio',
    other: 'satelliti di osservazione e con equipaggio',
  })}.`

/** What a pass's mark stands for in the timeline's tooltip, by the satellite's category: its kind and the mark's shape */
const MARK_KIND: Partial<Record<SatCategory, string>> = {
  // A kind of satellite, as the others are (*con equipaggio*), and the term why.none uses for an open imager
  'open-optical': 'con archivio pubblico · ◇',
  'commercial-optical': 'commerciale · □',
  radar: 'radar · ▣',
  'weather-leo': 'meteo · ○',
  crewed: 'con equipaggio · ✛',
}

const VERDICTS = ['imaged', 'likely', 'could', 'overhead'] as const

const results: typeof en = {
  // ── the headline ──────────────────────────────────────────────────────────────────────────────
  headline: {
    watched: (n: number, place: string, when: WindowWhen): Rich => [
      'lastDays' in when
        ? f.plural(when.lastDays, {
            one: 'Nell’ultimo giorno, ',
            many: `Negli ultimi ${days(when.lastDays)}, `,
            other: `Negli ultimi ${days(when.lastDays)}, `,
          })
        : `${range(when.fromMs, when.toMs, when.timeZone)}, `,
      strong(
        num(f.int(n)),
        f.plural(n, { one: ' satellite ha osservato', many: ' di satelliti hanno osservato', other: ' satelliti hanno osservato' }),
      ),
      ' ',
      accent(place),
      '.',
    ],
    none: (place: string, past: boolean): Rich => [
      past ? 'Quella settimana' : 'Questa settimana',
      ' nessun satellite che seguiamo ha osservato ',
      accent(place),
      '.',
    ],
  },

  // ── the second line ───────────────────────────────────────────────────────────────────────────
  imagesPublic: (k: number): Rich => [
    f.plural(k, { one: 'È stata pubblicata ', many: 'Sono state pubblicate ', other: 'Sono state pubblicate ' }),
    strong('almeno '),
    num(f.int(k)),
    f.plural(k, { one: ' immagine.', many: ' di immagini.', other: ' immagini.' }),
  ],
  noImages: {
    thisWeek: 'Nessuna immagine è stata pubblicata questa settimana.',
    thatWeek: 'Nessuna immagine è stata pubblicata quella settimana.',
  },
  archiveDown: 'Gli archivi delle immagini non hanno risposto: per ora non possiamo contare le immagini pubbliche.',
  tryAgain: 'Riprova',
  share: 'Condividi',
  shareWeekLabel: (place: string, past: boolean) => `Condividi ${past ? 'quella' : 'questa'} settimana: ${place}`,

  why: {
    sunNeverRose: 'Il sole non è mai sorto: nessuna fotocamera diurna poteva vedere questo luogo.',
    sunBarelyRose: 'Il sole è sorto appena: nessuna fotocamera diurna poteva vedere questo luogo.',
    infrared: (n: number): Rich => [
      'I satelliti meteo hanno comunque scandito questo luogo nell’infrarosso, ',
      num(f.int(n)),
      times(n),
    ],
    /**
     * *Umbra-08, Capella-14 e altri 7 satelliti radar sono passati a portata…*: a list of radar satellites only (no
     * station is one), so the masculine plural is safe; one more is *e un altro satellite radar*, never *1 altro*. A
     * single satellite takes the noun before its name (*Il satellite radar Umbra-08 è passato…*), so the participle
     * agrees with *satellite*, never with the name.
     */
    radar: (names: readonly string[], others: number, passes: number): Rich => {
      const lead = 'Il radar non ha bisogno di luce. '
      const after: Part[] = [num(f.int(passes)), times(passes)]
      if (names.length + others === 1) {
        const who = names.length ? `Il satellite radar ${names[0]}` : 'Un satellite radar'
        return [`${lead}${who} è passato a portata `, ...after]
      }
      const more = f.plural(others, {
        one: 'un altro satellite radar',
        many: `altri ${f.int(others)} di satelliti radar`,
        other: `altri ${f.int(others)} satelliti radar`,
      })
      const who = names.length
        ? f.list(others > 0 ? [...names, more] : names)
        : `${f.int(others)} ${f.plural(others, { one: 'satellite radar', many: 'di satelliti radar', other: 'satelliti radar' })}`
      return [`${lead}${who} sono passati a portata `, ...after]
    },
    unpublished: (n: number) => {
      const t = f.plural(n, { one: 'una volta', many: `${f.int(n)} di volte`, other: `${f.int(n)} volte` })
      return `Sentinel-2 o Landsat hanno attraversato questo luogo ${t} di giorno, ma non è ancora stata pubblicata nessuna scena.`
    },
    none: 'Nessun satellite con archivio pubblico ha attraversato questo luogo di giorno.',
  },

  // ── the summary's four readouts ───────────────────────────────────────────────────────────────
  verdictGroup: 'Passaggi per etichetta. Ogni conteggio porta al suo elenco.',
  verdictReadout: (n: number, verdict: Verdict, title: string) => `${f.int(n)} ${itVerdicts[verdict].unit(n)}: ${title}`,

  // ── the footnotes ─────────────────────────────────────────────────────────────────────────────
  notes: {
    counted: (o: { detailed: number; mosaics: number; radar: number; geo: number; passes: number; satellites: number }): Rich => {
      const detailed = f.plural(o.detailed, {
        one: 'immagine dettagliata',
        many: 'di immagini dettagliate',
        other: 'immagini dettagliate',
      })
      const out: Part[] = [strong(f.int(o.detailed)), ` ${detailed} (Sentinel-2, Landsat, 10–30 m)`]
      const mosaics = f.plural(o.mosaics, {
        one: 'mosaico meteo giornaliero',
        many: 'di mosaici meteo giornalieri',
        other: 'mosaici meteo giornalieri',
      })
      if (o.mosaics) out.push(' · ', strong(f.int(o.mosaics)), ` ${mosaics} (250–375 m)`)
      if (o.radar) out.push(' · ', strong(f.int(o.radar)), ` ${images(o.radar, ' radar')} (Sentinel-1, 20 m)`)
      const geo = ` ${images(o.geo, ' a disco intero')} dei satelliti meteo geostazionari (2–5 km; di ognuno mostriamo la più recente)`
      if (o.geo) out.push(' · ', strong(f.int(o.geo)), geo)
      out.push(`. ${checkedIt(o.passes, o.satellites)}`)
      return out
    },
    checked: (n: number, satellites: number) => checkedIt(n, satellites),
    // The place would follow a preposition here (*più vicino a…*), which Italian can't do bare: *questo luogo* (§5.1).
    passTimes: (_place: string, fetched: string | undefined, zoneLabel: string) =>
      'Gli orari dei passaggi sono i momenti in cui ogni satellite era più vicino a questo luogo, calcolati dagli elementi orbitali pubblici' +
      `${fetched ? ` (aggiornati al ${fetched})` : ''}. Ora locale: ${zoneLabel}.`,
  },

  // ── the panel ─────────────────────────────────────────────────────────────────────────────────
  sheetLabel: (place: string) => `Satelliti che hanno sorvolato ${place}`,
  computingPasses: 'Calcolo dei passaggi',
  sections: { summary: 'Riepilogo', passes: 'Passaggi', watchedContinuously: 'Osservazione continua' },
  checkingArchives: 'Verifica degli archivi',
  invite: {
    text: 'Qualcosa, questa settimana, ha osservato anche te.',
    checkPlace: 'Cerca il tuo luogo',
    dismiss: 'Chiudi',
  },
  searchAnother: 'Cerca un altro luogo',
  allPasses: 'Tutti i passaggi',

  footer: {
    replay: 'Rivedi',
    replayLabel: 'Rivedi il passaggio',
    replayTitle: 'Rivedi il passaggio sul globo',
    shareLabel: { pass: 'Condividi questo passaggio', image: 'Condividi questa immagine' },
    // Narrow phones drop the strong part: *Condividi* alone, *Condividi passaggio* with it. No article, as buttons
    // drop it (§7: *Scarica immagine*): *Condividi questo passaggio* (26) ran out of the nowrap button beside Rivedi.
    shareButton: { pass: ['Condividi', strong(' passaggio')] as Rich, image: ['Condividi', strong(' immagine')] as Rich },
    // …*il tuo luogo* alone, *Cerca il tuo luogo* with it.
    checkPlace: [strong('Cerca '), 'il tuo luogo'] as Rich,
    // …*più limpida* alone (as *Più vicina* stands for the closest look, §3.5), *Vedi la più limpida* with it: both
    // fit beside two icon buttons at every width. The accessible name keeps the noun.
    clearest: [strong('Vedi la '), 'più limpida'] as Rich,
    clearestLabel: 'Vedi la ripresa più limpida',
  },

  // ── the headers ───────────────────────────────────────────────────────────────────────────────
  head: {
    /** *7 giorni · 1 → 8 nov* */
    windowSpan: (n: number, startMs: number, endMs: number, timeZone: string) =>
      `${days(n)} · ${itTime.dayRange(startMs, endMs, timeZone, localParts(startMs, timeZone), localParts(endMs, timeZone))}`,
    verifying: 'Verifica dei mosaici meteo',
    cancel: 'Annulla',
    newSearch: 'Nuova ricerca',
    close: 'Chiudi',
    escKey: 'Esc',
    searchBarLabel: (place: string) => `Cerca un altro luogo (ora: ${place})`,
    change: 'Cambia',
    computing: 'Calcolo',
    recent: 'Recenti',
    position: (k: number, n: number) => `Passaggio ${f.int(k)} su ${f.int(n)} di questo tipo`,
    previous: 'Passaggio precedente di questo tipo',
    next: 'Passaggio successivo di questo tipo',
    previousTitle: 'Precedente (←)',
    nextTitle: 'Successivo (→)',
    allPassesTitle: 'Tutti i passaggi (Esc)',
    shared: (sat: string, place: string) => `Condiviso con te · ${sat} ha osservato ${place}`,
    /** *dom 1 nov · 16:14:21 EST*, as the 'time' namespace's `stamp` writes it; *≈ 16:14* for a geostationary scan */
    passWhen: (ms: number, timeZone: string, p: DateFields, time: string, zone: string, approx: boolean) =>
      `${itTime.day(ms, timeZone, p)} · ${approx ? '≈ ' : ''}${time} ${zone}`,
  },

  // ── the computing readout ─────────────────────────────────────────────────────────────────────
  computing: {
    stages: {
      catalog: { idle: 'Catalogo delle orbite', done: 'Catalogo caricato' },
      propagate: { idle: (n: number) => `Propagazione orbite · ${days(n)}`, done: 'Orbite propagate' },
      archive: { idle: 'Archivi Sentinel-2 + Landsat', done: 'Archivi consultati' },
      match: { idle: 'Abbinamento scene e passaggi', done: 'Scene abbinate' },
    },
    ready: 'Risultati pronti',
    ok: 'OK',
    seconds: (s: number) => `${f.dec(s, 2)} s`,
    /**
     * *7 giorni · 1 nov 05:47 → 8 nov 05:47 UTC*, as head.windowSpan says the window; phones up to 420 px drop the
     * strong part. *Finestra di 7 giorni · …* (52) was cut before the end time and UTC in the 432 px panel.
     */
    window: (n: number, from: UtcWhen, to: UtcWhen): Rich => [
      strong(`${days(n)} · `),
      `${dayMonth(from.ms, 'UTC')} ${from.time} → ${dayMonth(to.ms, 'UTC')} ${to.time} UTC`,
    ],
    percent: (pct: number) => `${f.int(pct)}%`,
    slow: 'Planetary Computer e la NASA creano le immagini su richiesta: questa fase può durare qualche secondo.',
    verySlow:
      'Gli archivi delle immagini tardano a rispondere. Se non rispondono, mostreremo comunque i passaggi calcolati dalla geometria orbitale, e lo diremo.',
    sharedAlt: (sat: string | undefined, place: string) => `Immagine di ${sat ?? 'un satellite'}, condivisa con te: ${place}.`,
    sharedCaption: (sat: string | undefined, place: string, when?: PlaceWhen): Rich => [
      strong('Condiviso con te'),
      ` · ${sat ?? 'Un satellite'} ha osservato ${place}${when ? ` · ${day(when.ms, when.timeZone)}, ${when.time}` : ''}`,
    ],
  },

  // ── 03 / OSSERVAZIONE CONTINUA: geostationary weather satellites ─────────────────────────────
  geo: {
    none: 'Nessuno strumento meteo geostazionario in servizio vede questo luogo a più di 5° di elevazione.',
    /** *0.0°E · 38,0° in alto · ogni 10 min* (the longitude arrives in international notation, as it is) */
    facts: (lon: string, elevationDeg: number, cadenceMin: number) =>
      `${lon} · ${f.dec(elevationDeg, 1)}° in alto · ${f.plural(cadenceMin, {
        one: 'ogni minuto',
        many: `ogni ${f.int(cadenceMin)} min`,
        other: `ogni ${f.int(cadenceMin)} min`,
      })}`,
    images: (n: number, d: number): Rich => [num(f.int(n)), d === 7 ? ` ${images(n)} questa settimana` : ` ${images(n)} in ${days(d)}`],
    replay: 'Rivedi',
    replayLabel: (sat: string) => `${sat}: rivedi l’immagine più recente`,
    // In a 64 px square of 9.5 px mono caps (about 8 characters a line): no word longer than *IMMAGINE*.
    frame: {
      probing: 'Ricerca…',
      noPublic: 'Nessuna immagine pubblica',
      poorQuality: 'Qualità scarsa',
      noneNow: 'Nessuna immagine per ora',
      unavailable: 'Immagine non caricata',
    },
    frameAlt: (sat: string, infrared: boolean) => `${sat}: l’ultimo fotogramma${infrared ? ' all’infrarosso' : ''} attorno a questo luogo`,
    infraredChip: 'IR',
    infraredTitle: 'Infrarosso: le cime delle nuvole per temperatura, le più fredde sono le più chiare',
  },

  // ── 04 / LINEA DEL TEMPO ──────────────────────────────────────────────────────────────────────
  timeline: {
    title: 'Linea del tempo',
    meta: (n: number, zoneLabel: string, zones?: string) =>
      `${days(n)} · ${zoneLabel}${zones ? ` · ${zones}` : ''}`,
    zoneChange: (before: string, after: string) => `${before} → ${after}`,
    daylight: 'Luce del giorno qui',
    /** *Linea del tempo, 7 giorni. Osservato: 12, probabilmente osservato: 3, poteva puntare qui: 0, nel tuo cielo: 5.* */
    summary: (n: number, counts: Record<Verdict, number>, titles: Readonly<Record<Verdict, string>>) =>
      `Linea del tempo, ${days(n)}. ` +
      VERDICTS.map((v, i) => `${i ? titles[v].toLocaleLowerCase('it') : titles[v]}: ${f.int(counts[v])}`).join(', ') +
      '.',
    keysHint: (summary: string) => `${summary} Usa le frecce sinistra e destra per scorrere i passaggi.`,
    geoLane: (n: number): Rich => [strong('Geo · '), f.int(n)],
    geoNames: (names: readonly string[]) => names.join(', '),
    now: 'Ora',
    geometry: (deg: number, km: number) => `${f.dec(deg, 1)}° off-nadir · ${f.int(km)} km`,
    markMosaic: (gsdM: number) => `Mosaico giornaliero, ${f.int(gsdM)} m · ●`,
    markRadar: (gsdM: number) => `Immagine radar, ${f.int(gsdM)} m · ◆`,
    markImaged: (title: string) => `${title} · ◆`,
    markKind: (title: string, category: SatCategory) => `${title} · ${MARK_KIND[category] ?? 'altro'}`,
  },

  // ── 02 / RIVEDI ───────────────────────────────────────────────────────────────────────────────
  replay: {
    // Not *scena*: in Italian copy that is only an archive product (§4)
    scrubLabel: 'Momento del passaggio',
    scrubValue: (tMinus: string, utc: string) => `${tMinus}, ${utc}`,
    play: 'Riproduci il passaggio',
    pause: 'Metti in pausa il passaggio',
    speed: 'Velocità di riproduzione',
    // A readout label and its value, as English writes it (*A portata 4 min 12 s*): the legend is one nowrap line
    inView: (duration: string) => `A portata ${duration}`,
    closest: 'Più vicino',
    spaceKey: 'Spazio',
    playPause: 'riproduci / pausa',
    // The nowrap hint row has no room for *di questo tipo* (48 characters against English's 33); the ‹ › stepper's
    // "3 / 31" and its accessible names give the scope.
    stepKind: 'passaggio precedente / successivo',
  },

  // ── the plan view ─────────────────────────────────────────────────────────────────────────────
  plan: {
    label: (sat: string, km: number) =>
      `Vista dall’alto: traccia al suolo di ${sat}, a ${f.int(km)} km dal luogo al massimo avvicinamento.`,
    // Top left and top right share one row of a plan as narrow as 240 px: each no longer than the English.
    northUp: 'Nord in alto',
    fieldOfRegard: (deg: number) => `Puntamento ±${deg}°`,
    swath: (km: number) => `Fascia ${f.int(km)} km`,
    groundTrack: 'Traccia al suolo',
    scale: (km: number) => `${km >= 1 ? f.int(km) : f.dec(km, 1)} km`,
    closest: (km: number) => `Più vicino ${km < 1 ? '< 1' : f.int(km)} km`,
  },

  // ── a picture's product line ──────────────────────────────────────────────────────────────────
  product: {
    mosaic: (m: number) => `Mosaico giornaliero · ${m} m`,
    fullDisc: (km: number) => `Disco intero · ${km} km`,
    infrared: (km: number) => `Infrarosso · ${km} km`,
    sentinel2: (m: number) => `Sentinel-2 L2A · ${m} m`,
    landsat: (m: number) => `Landsat C2 L2 · ${m} m`,
    sentinel1: (m: number) => `Radar Sentinel-1 · ${m} m`,
    other: (m: number) => `${m} m`,
  },
  pixel: { m: (m: number) => `${m} m`, km: (km: number) => `${km} km` },

  // ── the time-lapse's row ──────────────────────────────────────────────────────────────────────
  timelapse: {
    title: 'Time-lapse',
    sub: 'Questo luogo, anno dopo anno',
  },
}
export default results
