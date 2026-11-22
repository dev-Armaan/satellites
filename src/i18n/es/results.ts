/**
 * Spanish copy for the results panel (see src/i18n/en/results.ts for where each line shows; docs/i18n/es.md is the
 * authority on every word here: §3.3 the headline and its second line, §5 the slots, §7 the lengths).
 *
 * Why it reads this way:
 *  - The headline keeps the guide's frame: *En los últimos 7 días, **256 satélites observaron** Waterloo.*, *1 satélite
 *    observó*, zero its own sentence (*Ninguno de los satélites que seguimos observó…*), an older week *Del 29 de
 *    octubre al 5 de noviembre, …*. The second line reports a release verb first (*Se publicaron 31 imágenes.*), with
 *    *al menos* right before the number, so the sentence reads with and without it and the verb never moves.
 *  - The place is bare: a direct object with no personal *a*, or after a preposition with no *del/al*; never a subject,
 *    never referred back to with *lo* (*este lugar*, *aquí* instead). The satellite is bare too; a nameless one is
 *    written by each sentence (*un satélite*).
 *  - Counts take Spanish's three plural categories (`many` a copy of `other`) and the verb agrees with them; a no-break
 *    space ties every typed number to its noun or unit. Verdict names are never put after a bare count (*12
 *    observada*): the readouts and the timeline say *Observada: 12 pasadas* (§3.5).
 *  - Buttons are infinitives (*Compartir*, *Reintentar*, *Repetir*); mono labels are noun phrases in sentence case
 *    (CSS uppercases them, accents kept); *imagen*, never *foto*, wherever radar or mosaics may be what is shown.
 *  - Days come from Intl's Spanish parts through the 'time' namespace (*dom 1 nov*, *1 → 8 nov*), so this header and
 *    the pass list agree; prose spells the month out (*29 de octubre*). Clocks, zones, coordinates and UTC stamps
 *    arrive written and are left as they are.
 */
import type en from '../en/results'
import type { PlaceWhen, UtcWhen, WindowWhen } from '../en/results'
import { fmt } from '../../../api/_lib/i18n/format'
import { dateFormat } from '../../../api/_lib/i18n/dates'
import { accent, num, strong, type Part, type Rich } from '../../../api/_lib/i18n/parts'
import type { Pass, SatCategory } from '@/types'
import { localParts, type DateFields } from '@/ui/results/lib/time'
import esTime from './time'

const f = fmt('es')
type Verdict = Pass['verdict']

/** A form for a count: Spanish's `many` (1 000 000…) reads as `other` */
const pl = (n: number, one: string, other: string) => f.plural(n, { one, many: other, other })
/** "7 días", "1 pasada": a grouped count and its noun, never split across lines */
const count = (n: number, one: string, other: string) => `${f.int(n)}\u00a0${pl(n, one, other)}`
const images = (n: number) => pl(n, 'imagen', 'imágenes')
const days = (n: number) => count(n, 'día', 'días')

/** "dom 1 nov": the 'time' namespace's day, from the instant */
const day = (ms: number, timeZone: string) => esTime.day(ms, timeZone, localParts(ms, timeZone))
/** "1 nov": the 'time' namespace's day and month */
const dayMonth = (ms: number, timeZone: string) => esTime.dayMonth(ms, timeZone, localParts(ms, timeZone))

/** An instant's day and long month at a zone, from Intl's parts: { day: '29', month: 'octubre' } */
function longDayMonth(ms: number, timeZone: string) {
  const parts = dateFormat('es', timeZone, { day: 'numeric', month: 'long' }).formatToParts(ms)
  const get = (t: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === t)?.value ?? ''
  return { day: get('day'), month: get('month') }
}

/** "29 de octubre", its day, *de* and month tied by no-break spaces: a headline line never ends on a bare day */
const dayOfMonth = (d: { day: string; month: string }) => `${d.day} de ${d.month}`

/** "En los últimos 7 días, " / "En el último día, " / "Del 29 de octubre al 5 de noviembre, " / "Del 1 al 8 de noviembre, " */
function windowLead(when: WindowWhen): string {
  if ('lastDays' in when) return pl(when.lastDays, 'En el último día, ', `En los últimos ${days(when.lastDays)}, `)
  const a = longDayMonth(when.fromMs, when.timeZone)
  const b = longDayMonth(when.toMs, when.timeZone)
  return a.month === b.month ? `Del ${a.day} al ${dayOfMonth(b)}, ` : `Del ${dayOfMonth(a)} al ${dayOfMonth(b)}, `
}

/** "Se revisaron 1234 pasadas de 250 satélites de observación y tripulados." */
const checkedEs = (n: number, sats: number) => {
  const from = count(sats, 'satélite de observación o tripulado', 'satélites de observación y tripulados')
  return `${pl(n, 'Se revisó', 'Se revisaron')} ${count(n, 'pasada', 'pasadas')} de ${from}.`
}

/** What a pass's mark stands for in the timeline's tooltip, by the satellite's category: its kind and the mark's shape */
const MARK_KIND: Partial<Record<SatCategory, string>> = {
  'open-optical': 'datos abiertos · ◇',
  'commercial-optical': 'comercial · □',
  radar: 'radar · ▣',
  'weather-leo': 'meteorológico · ○',
  crewed: 'tripulado · ✛',
}

const results: typeof en = {
  // ── the headline ─────────────────────────────────────────────────────────────────────────
  headline: {
    watched: (n: number, place: string, when: WindowWhen): Rich => [
      windowLead(when),
      strong(num(f.int(n)), pl(n, '\u00a0satélite observó', '\u00a0satélites observaron')),
      ' ',
      accent(place),
      '.',
    ],
    none: (place: string, past: boolean): Rich => [
      'Ninguno de los satélites que seguimos observó ',
      accent(place),
      past ? ' esa semana.' : ' esta semana.',
    ],
  },

  // ── the second line ──────────────────────────────────────────────────────────────────────
  imagesPublic: (k: number): Rich => [
    pl(k, 'Se publicó ', 'Se publicaron '),
    strong('al menos '),
    num(f.int(k)),
    pl(k, '\u00a0imagen.', '\u00a0imágenes.'),
  ],
  noImages: { thisWeek: 'No se publicó ninguna imagen esta semana.', thatWeek: 'No se publicó ninguna imagen esa semana.' },
  archiveDown: 'Los archivos de imágenes no respondieron, así que por ahora no podemos contar las imágenes públicas.',
  tryAgain: 'Reintentar',
  share: 'Compartir',
  shareWeekLabel: (place: string, past: boolean) => `Compartir los resultados de ${past ? 'esa semana' : 'esta semana'} en ${place}`,

  why: {
    sunNeverRose: 'El sol no llegó a salir, así que ninguna cámara diurna pudo ver este lugar.',
    sunBarelyRose: 'El sol apenas salió, así que ninguna cámara diurna pudo ver este lugar.',
    infrared: (n: number): Rich => [
      'Aun así, los satélites meteorológicos escanearon este lugar en infrarrojo ',
      num(f.int(n)),
      pl(n, '\u00a0vez.', '\u00a0veces.'),
    ],
    radar: (names: readonly string[], others: number, passCount: number): Rich => {
      const rest = pl(others, 'otro satélite de radar', `otros ${f.int(others)}\u00a0satélites de radar`)
      const who = f.list(others > 0 ? [...names, rest] : names)
      // One name alone is a singular subject; a list of two or more takes the plural.
      const verb = names.length + (others > 0 ? 1 : 0) > 1 ? 'tuvieron' : 'tuvo'
      return [`El radar no necesita luz. ${who} ${verb} este lugar a su alcance `, num(f.int(passCount)), pl(passCount, '\u00a0vez.', '\u00a0veces.')]
    },
    unpublished: (n: number) => {
      const crossings = pl(n, 'una pasada diurna', `${f.int(n)}\u00a0pasadas diurnas`)
      return `Hubo ${crossings} de Sentinel-2 o Landsat sobre este lugar, pero aún no se ha publicado ninguna escena.`
    },
    none: 'Ningún satélite con imágenes públicas pasó de día sobre este lugar.',
  },

  // ── the summary's four readouts ──────────────────────────────────────────────────────────
  verdictGroup: 'Pasadas por categoría. Cada una lleva a su lista.',
  verdictReadout: (n: number, _verdict: Verdict, title: string) => `${title}: ${count(n, 'pasada', 'pasadas')}`,

  // ── the footnotes ────────────────────────────────────────────────────────────────────────
  notes: {
    counted: (o: { detailed: number; mosaics: number; radar: number; geo: number; passes: number; satellites: number }): Rich => {
      const detailed = pl(o.detailed, 'imagen detallada', 'imágenes detalladas')
      const out: Part[] = [strong(f.int(o.detailed)), `\u00a0${detailed} (Sentinel-2, Landsat, 10–30\u00a0m)`]
      const mosaics = pl(o.mosaics, 'mosaico meteorológico diario', 'mosaicos meteorológicos diarios')
      if (o.mosaics) out.push(' · ', strong(f.int(o.mosaics)), `\u00a0${mosaics} (250–375\u00a0m)`)
      if (o.radar) out.push(' · ', strong(f.int(o.radar)), `\u00a0${pl(o.radar, 'imagen de radar', 'imágenes de radar')} (Sentinel-1, 20\u00a0m)`)
      if (o.geo)
        out.push(
          ' · ',
          strong(f.int(o.geo)),
          `\u00a0${pl(o.geo, 'imagen', 'imágenes')} de disco completo de satélites meteorológicos geoestacionarios (2–5\u00a0km; se muestra la más reciente de cada uno)`,
        )
      out.push(`. ${checkedEs(o.passes, o.satellites)}`)
      return out
    },
    checked: (n: number, satellites: number) => checkedEs(n, satellites),
    passTimes: (place: string, fetched: string | undefined, zoneLabel: string) =>
      `La hora de cada pasada es el momento en que el satélite estuvo más cerca de ${place}. Se calcula con elementos orbitales públicos` +
      `${fetched ? ` (descargados el ${fetched})` : ''}. Hora local: ${zoneLabel}.`,
  },

  // ── the panel ────────────────────────────────────────────────────────────────────────────
  sheetLabel: (place: string) => `Satélites sobre ${place}`,
  computingPasses: 'Calculando pasadas',
  sections: { summary: 'Resumen', passes: 'Pasadas', watchedContinuously: 'Observación continua' },
  checkingArchives: 'Consultando los archivos',
  invite: {
    text: 'Algo te observó a ti también esta semana.',
    checkPlace: 'Buscar tu lugar',
    dismiss: 'Descartar',
  },
  searchAnother: 'Buscar otro lugar',
  allPasses: 'Todas las pasadas',

  footer: {
    replay: 'Repetir',
    replayLabel: 'Repetir la pasada',
    replayTitle: 'Repetir la pasada en el globo',
    shareLabel: { pass: 'Compartir esta pasada', image: 'Compartir esta imagen' },
    // No article or demonstrative on the button (§7 strategy 1): *Compartir esta pasada* overflows it at 401–441 px.
    shareButton: { pass: ['Compartir', strong(' pasada')] as Rich, image: ['Compartir', strong(' imagen')] as Rich },
    checkPlace: [strong('Buscar '), 'tu lugar'] as Rich,
    // Beside three icons: *la más despejada* (16) fits the 130 px a 360 px phone leaves; *vista más despejada* (19) does not.
    clearest: [strong('Ver '), 'la más despejada'] as Rich,
    clearestLabel: 'Ver la más despejada',
  },

  // ── the headers ──────────────────────────────────────────────────────────────────────────
  head: {
    windowSpan: (n: number, startMs: number, endMs: number, timeZone: string) =>
      `${days(n)} · ${esTime.dayRange(startMs, endMs, timeZone, localParts(startMs, timeZone), localParts(endMs, timeZone))}`,
    verifying: 'Revisando mosaicos',
    cancel: 'Cancelar',
    newSearch: 'Nueva búsqueda',
    close: 'Cerrar',
    escKey: 'Esc',
    searchBarLabel: (place: string) => `Buscar otro lugar (actual: ${place})`,
    change: 'Cambiar',
    computing: 'Calculando',
    recent: 'Recientes',
    position: (k: number, n: number) => `Pasada ${f.int(k)} de ${f.int(n)} de este tipo`,
    previous: 'Pasada anterior de este tipo',
    next: 'Pasada siguiente de este tipo',
    previousTitle: 'Anterior (←)',
    nextTitle: 'Siguiente (→)',
    allPassesTitle: 'Todas las pasadas (Esc)',
    shared: (sat: string, place: string) => `Compartido contigo · ${sat} observó ${place}`,
    // Written as the 'time' namespace's stamp writes a day and a clock, so this header and the pass's row agree.
    passWhen: (ms: number, timeZone: string, p: DateFields, time: string, zone: string, approx: boolean) =>
      `${esTime.day(ms, timeZone, p)} · ${approx ? '≈\u00a0' : ''}${time}\u00a0${zone}`,
  },

  // ── the computing readout ────────────────────────────────────────────────────────────────
  computing: {
    stages: {
      catalog: { idle: 'Catálogo de órbitas', done: 'Catálogo cargado' },
      propagate: { idle: (n: number) => `Propagar órbitas · ${days(n)}`, done: 'Órbitas propagadas' },
      archive: { idle: 'Archivos de Sentinel-2 + Landsat', done: 'Archivos consultados' },
      match: { idle: 'Emparejar escenas con pasadas', done: 'Escenas emparejadas' },
    },
    ready: 'Resultados listos',
    ok: 'OK',
    seconds: (s: number) => `${f.dec(s, 2)}\u00a0s`,
    window: (n: number, from: UtcWhen, to: UtcWhen): Rich => [
      strong(`${days(n)} · `),
      `${dayMonth(from.ms, 'UTC')} ${from.time} → ${dayMonth(to.ms, 'UTC')} ${to.time} UTC`,
    ],
    percent: (pct: number) => `${f.int(pct)}%`,
    slow: 'Planetary Computer y la NASA generan cada imagen cuando se pide; este paso puede tardar unos segundos.',
    verySlow:
      'Los archivos de imágenes tardan en responder. Si no responden, mostraremos igualmente las pasadas a partir de la geometría orbital y lo diremos.',
    sharedAlt: (sat: string | undefined, place: string) => `Imagen de ${place} tomada por ${sat ?? 'un satélite'}, compartida contigo.`,
    sharedCaption: (sat: string | undefined, place: string, when?: PlaceWhen): Rich => [
      strong('Compartido contigo'),
      ` · ${sat ?? 'Un satélite'} observó ${place}${when ? ` · ${day(when.ms, when.timeZone)}, ${when.time}` : ''}`,
    ],
  },

  // ── 03 / Observación continua ────────────────────────────────────────────────────────────
  geo: {
    none: 'Ningún satélite meteorológico geoestacionario en servicio ve este lugar a más de 5° sobre el horizonte.',
    facts: (lon: string, elevationDeg: number, cadenceMin: number) => `${lon} · elevación ${f.dec(elevationDeg, 1)}° · cada ${f.int(cadenceMin)}\u00a0min`,
    images: (n: number, window: number): Rich => [
      num(f.int(n)),
      window === 7 ? `\u00a0${images(n)} esta semana` : `\u00a0${images(n)} en ${days(window)}`,
    ],
    replay: 'Repetir',
    replayLabel: (sat: string) => `${sat}: repetir la captura de su imagen más reciente`,
    frame: {
      probing: 'Buscando…',
      noPublic: 'Sin imagen pública',
      poorQuality: 'Calidad baja',
      noneNow: 'Sin imagen por ahora',
      unavailable: 'Imagen no disponible',
    },
    frameAlt: (sat: string, infrared: boolean) => `${sat}: última imagen${infrared ? ' infrarroja' : ''} de los alrededores del lugar`,
    infraredChip: 'IR',
    infraredTitle: 'Infrarrojo: los topes de las nubes, por temperatura; cuanto más fríos, más claros',
  },

  // ── 04 / Cronología ──────────────────────────────────────────────────────────────────────
  timeline: {
    title: 'Cronología',
    meta: (n: number, zoneLabel: string, zones?: string) =>
      `${days(n)} · ${zoneLabel}${zones ? ` · ${zones}` : ''}`,
    zoneChange: (before: string, after: string) => `${before} → ${after}`,
    daylight: 'Luz del día aquí',
    // Never "12 observada": each verdict's name, then its count of passes (es.md §3.5).
    summary: (n: number, counts: Record<Verdict, number>, titles: Readonly<Record<Verdict, string>>) =>
      `Cronología de ${days(n)}. ` +
      (['imaged', 'likely', 'could', 'overhead'] as const).map((v) => `${titles[v]}: ${count(counts[v], 'pasada', 'pasadas')}`).join('. ') +
      '.',
    keysHint: (summary: string) => `${summary} Usa las flechas izquierda y derecha para recorrer las pasadas.`,
    geoLane: (n: number): Rich => [strong('Geo · '), f.int(n)],
    geoNames: (names: readonly string[]) => names.join(', '),
    now: 'Ahora',
    geometry: (deg: number, km: number) => `${f.dec(deg, 1)}° del nadir · ${f.int(km)}\u00a0km`,
    markMosaic: (gsdM: number) => `Mosaico diario, ${f.int(gsdM)}\u00a0m · ●`,
    markRadar: (gsdM: number) => `Imagen de radar, ${f.int(gsdM)}\u00a0m · ◆`,
    markImaged: (title: string) => `${title} · ◆`,
    markKind: (title: string, category: SatCategory) => `${title} · ${MARK_KIND[category] ?? 'otro'}`,
  },

  // ── 02 / Repetición ──────────────────────────────────────────────────────────────────────
  replay: {
    scrubLabel: 'Momento de la escena dentro de la pasada',
    scrubValue: (tMinus: string, utc: string) => `${tMinus}, ${utc}`,
    play: 'Reproducir la repetición',
    pause: 'Pausar la repetición',
    speed: 'Velocidad de la repetición',
    inView: (duration: string) => `A la vista ${duration}`,
    closest: 'Más cerca',
    spaceKey: 'Espacio',
    playPause: 'reproducir / pausar',
    stepKind: 'pasada anterior / siguiente de este tipo',
  },

  // ── the plan view ────────────────────────────────────────────────────────────────────────
  plan: {
    label: (sat: string, km: number) =>
      `Vista cenital: traza terrestre de ${sat}, a ${f.int(km)}\u00a0km del lugar en la máxima aproximación.`,
    // The drawing is the plan view (its section says so): the corner says only which way is up, to fit beside the band.
    northUp: 'Norte arriba',
    fieldOfRegard: (deg: number) => `Alcance ±${deg}°`,
    swath: (km: number) => `Franja ${f.int(km)}\u00a0km`,
    groundTrack: 'Traza terrestre',
    scale: (km: number) => `${km >= 1 ? f.int(km) : f.dec(km, 1)}\u00a0km`,
    closest: (km: number) => `Más cerca ${km < 1 ? '<\u00a01' : f.int(km)}\u00a0km`,
  },

  // ── a picture's product line ─────────────────────────────────────────────────────────────
  product: {
    mosaic: (m: number) => `Mosaico diario · ${m}\u00a0m`,
    fullDisc: (km: number) => `Disco completo · ${km}\u00a0km`,
    infrared: (km: number) => `Infrarrojo · ${km}\u00a0km`,
    sentinel2: (m: number) => `Sentinel-2 L2A · ${m}\u00a0m`,
    landsat: (m: number) => `Landsat C2 L2 · ${m}\u00a0m`,
    sentinel1: (m: number) => `Radar de Sentinel-1 · ${m}\u00a0m`,
    other: (m: number) => `${m}\u00a0m`,
  },
  pixel: { m: (m: number) => `${m}\u00a0m`, km: (km: number) => `${km}\u00a0km` },

  // ── the time-lapse's row ─────────────────────────────────────────────────────────────────
  timelapse: {
    title: 'Time-lapse',
    sub: 'Este lugar, año a año',
  },
}

export default results
