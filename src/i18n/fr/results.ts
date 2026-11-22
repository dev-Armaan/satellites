/**
 * French copy for the results panel: the headline and its second line, the reasons no image was made public, the
 * summary's readouts and footnotes, the computing readout, the panel's headers and footer, the timeline, the replay
 * controls, the plan view, the geostationary list, the pictures' product lines and the time-lapse row (see
 * src/i18n/en/results.ts for where each message shows; docs/i18n/fr.md is the authority on every word here).
 *
 * Why it reads this way:
 *  - The headline is fr.md §3.3 word for word: *Ces 7 derniers jours, **256 satellites ont observé** *Waterloo*.* The
 *    plural form carries the verb (*1 satellite a observé*), `many` takes *de*, and an older window is a range in full
 *    months with the month written once and day 1 as *1er* (*Du 29 octobre au 5 novembre*). The second line is the
 *    owner's *ont été rendues publiques*, and *Au moins* is the removable part, so the sentence reads with and without it.
 *  - The agreement trap (§1.3): nothing agrees with the reader, a satellite or the place. The place follows a
 *    transitive verb, *pour*, *sur* or a colon, never *de* or *à* (*Satellites qui ont survolé Waterloo*, *Partager
 *    cette semaine : Waterloo*, *centrée sur Waterloo*), and gets no article; where its name is not needed the copy
 *    says *ce lieu*. A satellite follows *par*, never *de* (*Image prise par Sentinel-2C*), and a nameless one is
 *    *un satellite*, written by the sentence itself (§5.2).
 *  - Counts never part from their noun (U+00A0); 0 is singular in French (*0 passage*), `many` (exact millions) takes
 *    *de* / *d’* (§5.3). Years are never grouped. Decimals take the comma from fmt('fr'); clocks, zones, coordinates and
 *    UTC stamps arrive written and stay international.
 *  - Mono labels are nouns in sentence case, uppercased by CSS with their accents (*Observation continue*, *Nord en
 *    haut*, *Dépointage max.*); buttons are infinitives (*Partager*, *Rejouer*, *Réessayer*, §1.1). Where a box is
 *    shared or narrow (the header's one button, the plan's corners, the 72 px frame square) the word was chosen to fit
 *    it: *Rechercher*, *Nord en haut*, *Image non chargée*.
 *  - Days come from the French 'time' namespace (./time.ts) and dates.ts, never a hand-made month table.
 */
import type en from '../en/results'
import type { WindowWhen, UtcWhen, PlaceWhen } from '../en/results'
import { formatDate } from '../../../api/_lib/i18n/dates'
import { fmt } from '../../../api/_lib/i18n/format'
import { accent, num, strong, type Part, type Rich } from '../../../api/_lib/i18n/parts'
import type { Pass, SatCategory } from '@/types'
import { localParts, type DateFields } from '@/ui/results/lib/time'
import frTime from './time'
import frVerdicts from './verdicts'

const f = fmt('fr')
type Verdict = Pass['verdict']

/** A grouped count and its noun, joined by a no-break space: "7 jours", "1 passage", "1 000 000 de passages" */
const count = (n: number, one: string, other: string, many: string) => `${f.int(n)}\u00a0${f.plural(n, { one, many, other })}`
const dayCount = (n: number) => count(n, 'jour', 'jours', 'de jours')
const passCount = (n: number) => count(n, 'passage', 'passages', 'de passages')
/** The noun after a count already set apart (a num() or strong() part): "\u00a0images", "\u00a0d’images" */
const imagesAfter = (n: number) => f.plural(n, { one: '\u00a0image', many: '\u00a0d’images', other: '\u00a0images' })
/** "\u00a0fois" after a count: invariable, but `many` takes *de* */
const timesAfter = (n: number) => f.plural(n, { one: '\u00a0fois', many: '\u00a0de fois', other: '\u00a0fois' })

/** "29 oct.": the readout day, as the 'time' namespace writes it */
const dayMonth = (ms: number, timeZone: string) => frTime.dayMonth(ms, timeZone, localParts(ms, timeZone))
/** "dim. 1 nov." */
const day = (ms: number, timeZone: string) => frTime.day(ms, timeZone, localParts(ms, timeZone))

/** The civil date in `p`, as an instant Intl can name in UTC whatever zone it was read at (as ./time.ts does). */
const civil = (p: DateFields) => Date.UTC(p.year, p.month - 1, p.day, 12)
/** "novembre": the full month, for display headlines (fr.md §3.3: never the readout's *nov.*) */
const monthLong = (p: DateFields) => formatDate('fr', civil(p), 'UTC', { month: 'long' })
/** Day 1 is *1er* in prose (fr.md §5.5) */
const dayNum = (p: DateFields) => (p.day === 1 ? '1er' : String(p.day))

/**
 * An older window in the headline: *Du 29 octobre au 5 novembre*, *Du 1er au 7 novembre* (month once), *Du
 * 29 décembre 2026 au 4 janvier 2027* (across a year). Full months, never *entre … et …* (fr.md §3.3, §5.5).
 */
function windowRange(fromMs: number, toMs: number, timeZone: string): string {
  const a = localParts(fromMs, timeZone)
  const b = localParts(toMs, timeZone)
  const end = `${dayNum(b)}\u00a0${monthLong(b)}`
  if (a.year !== b.year) return `Du ${dayNum(a)}\u00a0${monthLong(a)}\u00a0${a.year} au ${end}\u00a0${b.year}`
  if (a.month !== b.month) return `Du ${dayNum(a)}\u00a0${monthLong(a)} au ${end}`
  return `Du ${dayNum(a)} au ${end}`
}

/** "Ces 7 derniers jours" / "Ces 24 dernières heures" (one day, fr.md §3.3) / the range */
const windowLead = (when: WindowWhen) =>
  'lastDays' in when
    ? f.plural(when.lastDays, {
        one: 'Ces 24\u00a0dernières heures',
        // An adjective sits between the number and the noun: `many` takes the `other` text (fr.md §5.3).
        many: `Ces ${f.int(when.lastDays)}\u00a0derniers jours`,
        other: `Ces ${f.int(when.lastDays)}\u00a0derniers jours`,
      })
    : windowRange(when.fromMs, when.toMs, when.timeZone)

/** "Nous avons vérifié 1 234 passages de 250 satellites d’imagerie ou habités." (the product's *nous*, §1.1) */
const checkedFr = (passes: number, sats: number) =>
  `Nous avons vérifié ${passCount(passes)} de ${count(sats, 'satellite d’imagerie ou habité', 'satellites d’imagerie ou habités', 'de satellites d’imagerie ou habités')}.`

/** What a pass's mark stands for in the timeline's tooltip, by the satellite's category: its kind and the mark's shape */
const MARK_KIND: Partial<Record<SatCategory, string>> = {
  'open-optical': 'imagerie en accès libre · ◇',
  'commercial-optical': 'commercial · □',
  radar: 'radar · ▣',
  'weather-leo': 'météo · ○',
  crewed: 'habité · ✛',
}

const results: typeof en = {
  // ── the headline ─────────────────────────────────────────────────────────────────────────────
  headline: {
    watched: (n: number, place: string, when: WindowWhen): Rich => [
      `${windowLead(when)}, `,
      strong(
        num(f.int(n)),
        f.plural(n, { one: '\u00a0satellite a observé', many: '\u00a0de satellites ont observé', other: '\u00a0satellites ont observé' }),
      ),
      ' ',
      accent(place),
      '.',
    ],
    none: (place: string, past: boolean): Rich => [
      'Aucun satellite que nous suivons n’a observé ',
      accent(place),
      past ? ' cette semaine-là.' : ' cette semaine.',
    ],
  },

  // ── the second line ──────────────────────────────────────────────────────────────────────────
  imagesPublic: (k: number): Rich => [
    strong('Au moins '),
    num(f.int(k)),
    f.plural(k, {
      one: '\u00a0image a été rendue publique.',
      many: '\u00a0d’images ont été rendues publiques.',
      other: '\u00a0images ont été rendues publiques.',
    }),
  ],
  noImages: {
    thisWeek: 'Aucune image n’a été rendue publique cette semaine.',
    thatWeek: 'Aucune image n’a été rendue publique cette semaine-là.',
  },
  archiveDown: 'Les archives d’images n’ont pas répondu\u00a0: impossible de compter les images publiques pour l’instant.',
  tryAgain: 'Réessayer',
  share: 'Partager',
  // The place after a colon, as a label (fr.md §5.1).
  shareWeekLabel: (place: string, past: boolean) => `Partager ${past ? 'cette semaine-là' : 'cette semaine'}\u00a0: ${place}`,

  why: {
    sunNeverRose: 'Le soleil ne s’est jamais levé\u00a0: aucune caméra de jour ne pouvait voir ce lieu.',
    sunBarelyRose: 'Le soleil s’est à peine levé\u00a0: aucune caméra de jour ne pouvait voir ce lieu.',
    // Always after one of the two lines above: *l’* is their *ce lieu* (masculine), so *balayé* agrees correctly.
    infrared: (n: number): Rich => ['Les satellites météo l’ont tout de même balayé ', num(f.int(n)), `${timesAfter(n)} en infrarouge.`],
    // *ont été à portée* never agrees, whatever the names (fr.md §5.4); the verb is singular for one name alone.
    radar: (names: readonly string[], others: number, passes: number): Rich => {
      let who: string
      let plural: boolean
      if (names.length) {
        const rest = f.plural(others, {
          one: `${f.int(others)}\u00a0autre satellite radar`,
          many: `${f.int(others)}\u00a0d’autres satellites radar`,
          other: `${f.int(others)}\u00a0autres satellites radar`,
        })
        who = f.list(others > 0 ? [...names, rest] : names)
        plural = names.length > 1 || others > 0
      } else if (others > 0) {
        who = count(others, 'satellite radar', 'satellites radar', 'de satellites radar')
        plural = f.category(others) !== 'one'
      } else {
        who = 'Des satellites radar'
        plural = true
      }
      return ['Le radar n’a pas besoin de lumière. ', `${who} ${plural ? 'ont' : 'a'} été à portée `, num(f.int(passes)), `${timesAfter(passes)}.`]
    },
    // *une fois*, as English says "once"; *Sentinel-2 ou Landsat* takes a singular verb (one or the other).
    unpublished: (n: number) => {
      const times = n === 1 ? 'une fois' : count(n, 'fois', 'fois', 'de fois')
      return `Sentinel-2 ou Landsat a survolé ce lieu ${times} de jour, mais aucune scène n’est encore publiée.`
    },
    none: 'Aucun satellite d’imagerie aux données en accès libre n’a survolé ce lieu de jour.',
  },

  // ── the summary's four readouts ──────────────────────────────────────────────────────────────
  verdictGroup: 'Passages par verdict. Chaque compteur renvoie à sa liste.',
  verdictReadout: (n: number, verdict: Verdict, title: string) => `${f.int(n)}\u00a0${frVerdicts[verdict].unit(n)}\u00a0: ${title}`,

  // ── the footnotes ────────────────────────────────────────────────────────────────────────────
  notes: {
    counted: (o: { detailed: number; mosaics: number; radar: number; geo: number; passes: number; satellites: number }): Rich => {
      const out: Part[] = [
        strong(f.int(o.detailed)),
        `${f.plural(o.detailed, { one: '\u00a0image détaillée', many: '\u00a0d’images détaillées', other: '\u00a0images détaillées' })} (Sentinel-2, Landsat, 10–30\u00a0m)`,
      ]
      if (o.mosaics) {
        const mosaics = f.plural(o.mosaics, {
          one: '\u00a0mosaïque météo quotidienne',
          many: '\u00a0de mosaïques météo quotidiennes',
          other: '\u00a0mosaïques météo quotidiennes',
        })
        out.push(' · ', strong(f.int(o.mosaics)), `${mosaics} (250–375\u00a0m)`)
      }
      if (o.radar) {
        const radar = f.plural(o.radar, { one: '\u00a0image radar', many: '\u00a0d’images radar', other: '\u00a0images radar' })
        out.push(' · ', strong(f.int(o.radar)), `${radar} (Sentinel-1, 20\u00a0m)`)
      }
      if (o.geo) {
        const geo = f.plural(o.geo, {
          one: '\u00a0image du disque complet',
          many: '\u00a0d’images du disque complet',
          other: '\u00a0images du disque complet',
        })
        // Where they come from goes in the parentheses, as for the other kinds (no participle to agree).
        out.push(' · ', strong(f.int(o.geo)), `${geo} (satellites météo géostationnaires, 2–5\u00a0km\u202f; la plus récente de chacun est affichée)`)
      }
      out.push(`. ${checkedFr(o.passes, o.satellites)}`)
      return out
    },
    checked: (passes: number, satellites: number) => checkedFr(passes, satellites),
    // Three short sentences; *Pour [PLACE]* keeps the name after a preposition that never contracts (fr.md §5.1).
    passTimes: (place: string, fetched: string | undefined, zoneLabel: string) =>
      `Pour ${place}, l’heure de chaque passage est l’instant où le satellite était au plus près. ` +
      // The times are named again: a plural pronoun after the distributive *chaque* would have no antecedent.
      `Ces heures sont calculées d’après des éléments orbitaux publics${fetched ? ` (récupérés le ${fetched})` : ''}. ` +
      `Heures locales\u00a0: ${zoneLabel}.`,
  },

  // ── the panel ────────────────────────────────────────────────────────────────────────────────
  sheetLabel: (place: string) => `Satellites qui ont survolé ${place}`,
  computingPasses: 'Calcul des passages',
  // A noun, like the other rules; *observation* keeps the product verb (fr.md §1.1).
  sections: { summary: 'Résumé', passes: 'Passages', watchedContinuously: 'Observation continue' },
  checkingArchives: 'Vérification des archives',
  invite: {
    // fr.md §3.5 `hookWatched`: *aussi* alone would read as "also this week".
    text: 'Quelque chose vous observait, vous aussi, cette semaine.',
    checkPlace: 'Voir chez vous',
    dismiss: 'Fermer',
  },
  searchAnother: 'Chercher un autre lieu',
  allPasses: 'Tous les passages',

  footer: {
    replay: 'Rejouer',
    replayLabel: 'Rejouer ce passage',
    replayTitle: 'Rejouer ce passage sur le globe',
    shareLabel: { pass: 'Partager ce passage', image: 'Partager cette image' },
    // Narrow phones drop the strong part: *Partager* alone, *Partager ce passage* with it.
    shareButton: { pass: ['Partager', strong(' ce passage')] as Rich, image: ['Partager', strong(' cette image')] as Rich },
    // *Chez vous* alone on narrow phones, beside the search glyph.
    checkPlace: [strong('Voir '), 'chez vous'] as Rich,
    // *La plus dégagée* alone on narrow phones (15 characters; 20 with *Voir*): the view on screen is the noun, and
    // the nowrap button beside three icons holds no more. The accessible name starts with the visible words.
    clearest: [strong('Voir '), 'la plus dégagée'] as Rich,
    clearestLabel: 'Voir la plus dégagée des vues',
  },

  // ── the headers ──────────────────────────────────────────────────────────────────────────────
  head: {
    windowSpan: (days: number, startMs: number, endMs: number, timeZone: string) =>
      `${dayCount(days)} · ${frTime.dayRange(startMs, endMs, timeZone, localParts(startMs, timeZone), localParts(endMs, timeZone))}`,
    // 28 characters beside a live dot (*Vérification des mosaïques météo* runs 7 past the English).
    verifying: 'Contrôle des mosaïques météo',
    cancel: 'Annuler',
    // The three share one box: *Nouvelle recherche* (18) would widen it by 8 characters; the infinitive says the same.
    newSearch: 'Rechercher',
    close: 'Fermer',
    escKey: 'Échap',
    searchBarLabel: (place: string) => `Chercher un autre lieu (lieu actuel\u00a0: ${place})`,
    change: 'Changer',
    computing: 'Calcul',
    recent: 'Récents',
    position: (k: number, n: number) => `Passage ${f.int(k)} sur ${f.int(n)} de ce type`,
    previous: 'Passage précédent de ce type',
    next: 'Passage suivant de ce type',
    previousTitle: 'Précédent (←)',
    nextTitle: 'Suivant (→)',
    allPassesTitle: 'Tous les passages (Échap)',
    // *Partagé* agrees with the pass shown (masculine), never with *vous*, which is not its object here.
    shared: (sat: string, place: string) => `Partagé avec vous · ${sat} a observé ${place}`,
    // The 'time' namespace's stamp: *dim. 1 nov. · 16:14:21 EST*; the clock never parts from its zone.
    passWhen: (ms: number, timeZone: string, p: DateFields, time: string, zone: string, approx: boolean) =>
      `${frTime.day(ms, timeZone, p)} · ${approx ? '≈\u00a0' : ''}${time}\u00a0${zone}`,
  },

  // ── the computing readout ────────────────────────────────────────────────────────────────────
  computing: {
    stages: {
      catalog: { idle: 'Catalogue d’orbites', done: 'Catalogue chargé' },
      propagate: { idle: (days: number) => `Propagation des orbites · ${dayCount(days)}`, done: 'Orbites propagées' },
      archive: { idle: 'Archives Sentinel-2 + Landsat', done: 'Archives interrogées' },
      // 28 characters at most: the row ellipsises on a 390 px phone.
      match: { idle: 'Association scènes-passages', done: 'Scènes associées' },
    },
    ready: 'Rapport prêt',
    ok: 'OK',
    seconds: (s: number) => `${f.dec(s, 2)}\u00a0s`,
    // Phones up to 420 px hide the strong part; the two ends read alone.
    window: (days: number, from: UtcWhen, to: UtcWhen): Rich => [
      // *7 jours · *: *Fenêtre de* ran the line past its box at 1280 px.
      strong(`${dayCount(days)} · `),
      `${dayMonth(from.ms, 'UTC')} ${from.time} → ${dayMonth(to.ms, 'UTC')} ${to.time}\u00a0UTC`,
    ],
    percent: (pct: number) => `${f.int(pct)}\u00a0%`,
    slow: 'Le Planetary Computer et la NASA produisent chaque image à la demande\u00a0: cette étape peut prendre quelques secondes.',
    verySlow:
      'Les archives d’images tardent à répondre. Faute de réponse, les passages seront tout de même affichés d’après la géométrie orbitale, et nous le signalerons.',
    // Never *image de [PLACE]* or *de [SAT]* (fr.md §5.1, §5.2).
    sharedAlt: (sat: string | undefined, place: string) => `Image prise par ${sat ?? 'un satellite'}, centrée sur ${place}, partagée avec vous.`,
    sharedCaption: (sat: string | undefined, place: string, when?: PlaceWhen): Rich => [
      strong('Partagé avec vous'),
      ` · ${sat ?? 'Un satellite'} a observé ${place}${when ? ` · ${day(when.ms, when.timeZone)} à ${when.time}` : ''}`,
    ],
  },

  // ── 03 / OBSERVATION CONTINUE: geostationary weather satellites ──────────────────────────────
  geo: {
    none: 'Aucun imageur météo géostationnaire en service ne voit ce lieu à plus de 5° d’élévation.',
    // The longitude arrives in international notation (*0.0°E*, fr.md §4.2); the angle takes the comma.
    facts: (lon: string, elevationDeg: number, cadenceMin: number) => {
      const c = Math.round(cadenceMin)
      // A one-minute cadence reads as passView's everyMin does: *toutes les minutes*.
      return `${lon} · ${f.dec(elevationDeg, 1)}° d’élévation · ${c <= 1 ? 'toutes les minutes' : `toutes les ${f.int(c)}\u00a0min`}`
    },
    images: (n: number, days: number): Rich => [num(f.int(n)), `${imagesAfter(n)} ${days === 7 ? 'cette semaine' : `en ${dayCount(days)}`}`],
    replay: 'Rejouer',
    // *sa* agrees with *image*, not with the satellite.
    replayLabel: (sat: string) => `${sat}\u00a0: rejouer sa dernière image`,
    // A 72 px square in mono caps: each word fits a line (*INDISPONIBLE* would not).
    frame: {
      probing: 'En cours…',
      noPublic: 'Aucune image publique',
      poorQuality: 'Qualité médiocre',
      // "just now" is *pour l’instant* everywhere (the archive notes, the card's *Image indisponible pour l’instant*).
      // *Rien*: two lines in the square, as English; *Pas d’image pour l’instant* took four, edge to edge.
      noneNow: 'Rien pour l’instant',
      unavailable: 'Image non chargée',
    },
    frameAlt: (sat: string, infrared: boolean) => `${sat}\u00a0: dernière image${infrared ? ' infrarouge' : ''} autour du lieu`,
    infraredChip: 'IR',
    infraredTitle: 'Infrarouge\u00a0: le sommet des nuages selon sa température, plus clair quand il est plus froid',
  },

  // ── 04 / CHRONOLOGIE ─────────────────────────────────────────────────────────────────────────
  timeline: {
    title: 'Chronologie',
    meta: (days: number, zoneLabel: string, zones?: string) =>
      `${dayCount(days)} · ${zoneLabel}${zones ? ` · ${zones}` : ''}`,
    zoneChange: (before: string, after: string) => `${before} → ${after}`,
    daylight: 'Jour ici',
    // fr.md §3.6: each verdict's name as a label, then its count, so no title is lowercased or agreed.
    summary: (days: number, counts: Record<Verdict, number>, titles: Readonly<Record<Verdict, string>>) =>
      `Chronologie sur ${dayCount(days)}. ` +
      (['imaged', 'likely', 'could', 'overhead'] as const).map((v) => `${titles[v]}, ${passCount(counts[v])}.`).join(' '),
    keysHint: (summary: string) => `${summary} Utilisez les flèches gauche et droite pour parcourir les passages.`,
    geoLane: (n: number): Rich => [strong('Géo · '), f.int(n)],
    geoNames: (names: readonly string[]) => names.join(', '),
    now: 'Maintenant',
    geometry: (deg: number, km: number) => `${f.dec(deg, 1)}° du nadir · ${f.int(km)}\u00a0km`,
    markMosaic: (gsdM: number) => `Mosaïque quotidienne, ${f.int(gsdM)}\u00a0m · ●`,
    markRadar: (gsdM: number) => `Image radar, ${f.int(gsdM)}\u00a0m · ◆`,
    markImaged: (title: string) => `${title} · ◆`,
    markKind: (title: string, category: SatCategory) => `${title} · ${MARK_KIND[category] ?? 'autre'}`,
  },

  // ── 02 / RECONSTITUTION ──────────────────────────────────────────────────────────────────────
  replay: {
    scrubLabel: 'Moment de la scène pendant le passage',
    scrubValue: (tMinus: string, utc: string) => `${tMinus}, ${utc}`,
    play: 'Lire la reconstitution',
    pause: 'Mettre la reconstitution en pause',
    speed: 'Vitesse de la reconstitution',
    inView: (duration: string) => `À portée ${duration}`,
    closest: 'Au plus près',
    spaceKey: 'Espace',
    playPause: 'lecture / pause',
    stepKind: 'passage précédent / suivant de ce type',
  },

  // ── the plan view ────────────────────────────────────────────────────────────────────────────
  plan: {
    // *suivie par [SAT]*, never *de [SAT]* (fr.md §5.2).
    label: (sat: string, km: number) => `Vue en plan\u00a0: trace au sol suivie par ${sat}, à ${f.int(km)}\u00a0km du lieu au plus près.`,
    // No longer than the English's 15 characters: the plan's name is the section's, so the corner keeps the direction.
    northUp: 'Nord en haut',
    fieldOfRegard: (deg: number) => `Dépointage max. ±${f.int(deg)}°`,
    swath: (km: number) => `Fauchée ${f.int(km)}\u00a0km`,
    groundTrack: 'Trace au sol',
    scale: (km: number) => `${km >= 1 ? f.int(km) : f.dec(km, 1)}\u00a0km`,
    closest: (km: number) => `Au plus près ${km < 1 ? '<\u00a01' : f.int(km)}\u00a0km`,
  },

  // ── a picture's product line ─────────────────────────────────────────────────────────────────
  // Whole numbers, never grouped (a pixel is at most a few hundred metres or kilometres).
  product: {
    mosaic: (m: number) => `Mosaïque quotidienne · ${m}\u00a0m`,
    fullDisc: (km: number) => `Disque complet · ${km}\u00a0km`,
    infrared: (km: number) => `Infrarouge · ${km}\u00a0km`,
    sentinel2: (m: number) => `Sentinel-2 L2A · ${m}\u00a0m`,
    landsat: (m: number) => `Landsat C2 L2 · ${m}\u00a0m`,
    sentinel1: (m: number) => `Radar Sentinel-1 · ${m}\u00a0m`,
    other: (m: number) => `${m}\u00a0m`,
  },
  pixel: { m: (m: number) => `${m}\u00a0m`, km: (km: number) => `${km}\u00a0km` },

  // ── the time-lapse's row ─────────────────────────────────────────────────────────────────────
  timelapse: {
    title: 'Au fil des ans',
    sub: 'Ce lieu, année après année',
  },
}
export default results
