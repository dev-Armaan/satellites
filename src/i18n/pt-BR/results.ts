/**
 * Brazilian Portuguese copy for the results panel (see src/i18n/en/results.ts for where each line shows and its slots;
 * docs/i18n/pt-BR.md is the authority on every word here: §3.3 the headline, the second line, the reasons and the
 * footnotes, §3.7 the computing readout, §4 the glossary, §5 the slots, §7 the lengths).
 *
 * Why it reads this way:
 *  - The headline is the guide's: *Nos últimos 7 dias, **256 satélites observaram** Waterloo.* The verb agrees with the
 *    count, so it lives inside the strong part with the number; an older week is *Entre 29 de outubro e 5 de novembro*,
 *    prose dates written long from Intl's parts at the place's zone, the first of the month *1º*, the month said once
 *    when both ends share it (*Entre 1º e 8 de novembro*). Zero is its own sentence (*Nenhum satélite que rastreamos
 *    observou…*). The second line is *Pelo menos 27 imagens foram publicadas.*, and reads whole without *Pelo menos*.
 *  - The place is bare: a direct object (*observaram Waterloo*), after a colon (*Compartilhar esta semana: Waterloo*) or
 *    after a non-contracting preposition (*sobre*); never after *de, em, a, por*, never a subject, and referred back to
 *    with *o local* / *o lugar pesquisado*. A satellite after a preposition comes after *satélite* (*Imagem do satélite
 *    Sentinel-2C*) or a colon (*Traço no solo: ISS (ZARYA)*); a nameless one is *um satélite* in each sentence's form.
 *  - Counts: pt-BR's plural rule puts 0 in `one`, so every count that can be 0 tests for it (`pl`); `many` reads as
 *    `other`. A verdict title never follows a bare number: the readout is *4 passagens: Observou*, the timeline's
 *    summary uses the lane words (*4 passagens com imagem, 12 prováveis, 30 possíveis, 8 sobrevoos*).
 *  - Buttons are infinitives (*Compartilhar*, *Rever*, *Tentar de novo*); status lines are gerunds (*Calculando
 *    passagens*); mono labels are noun phrases in sentence case (CSS uppercases them, accents kept). *Imagem* wherever a
 *    picture may be radar or a mosaic; off-nadir is *fora do nadir* in labels.
 *  - Days come from the 'time' namespace (*dom 1 nov*, *1 → 8 nov*), so headers, rows and the pass list agree. Numbers
 *    go through fmt('pt-BR') (*1.715*, *1,84 s*), a no-break space ties a typed number to its unit; clocks, zones,
 *    coordinates and UTC stamps arrive written and stay as they are.
 */
import type en from '../en/results'
import type { PlaceWhen, UtcWhen, WindowWhen } from '../en/results'
import { fmt } from '../../../api/_lib/i18n/format'
import { dateFormat } from '../../../api/_lib/i18n/dates'
import { num, strong, accent, type Part, type Rich } from '../../../api/_lib/i18n/parts'
import type { Pass, SatCategory } from '@/types'
import { localParts, type DateFields } from '@/ui/results/lib/time'
import ptTime from './time'
import verdicts from './verdicts'

const f = fmt('pt-BR')
type Verdict = Pass['verdict']

/** A form for a count: 0 takes the plural (pt-BR puts it in `one`), `many` reads as `other` */
const pl = (n: number, one: string, other: string) => (n === 0 ? other : f.plural(n, { one, many: other, other }))
/** "7 dias", "1 dia": a span of days, the number tied to its unit */
const days = (n: number) => `${f.int(n)} ${pl(n, 'dia', 'dias')}`
/** "3 vezes", "1 vez" */
const times = (n: number) => pl(n, 'vez', 'vezes')
const images = (n: number) => pl(n, 'imagem', 'imagens')

/** "dom 1 nov": the 'time' namespace's day, from the instant */
const day = (ms: number, timeZone: string) => ptTime.day(ms, timeZone, localParts(ms, timeZone))
/** "1 nov": the 'time' namespace's day and month */
const dayMonth = (ms: number, timeZone: string) => ptTime.dayMonth(ms, timeZone, localParts(ms, timeZone))

/** An instant's day and long month at a zone, from Intl's parts, the first of the month written 1º: { day: '1º', month: 'novembro' } */
function longDayMonth(ms: number, timeZone: string) {
  const parts = dateFormat('pt-BR', timeZone, { day: 'numeric', month: 'long' }).formatToParts(ms)
  const get = (t: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === t)?.value ?? ''
  const d = get('day')
  return { day: d === '1' ? '1º' : d, month: get('month') }
}

/** "Nos últimos 7 dias, " / "No último dia, " / "Entre 29 de outubro e 5 de novembro, " / "Entre 1º e 8 de novembro, " */
function windowLead(when: WindowWhen): string {
  if ('lastDays' in when) return pl(when.lastDays, 'No último dia, ', `Nos últimos ${days(when.lastDays)}, `)
  const a = longDayMonth(when.fromMs, when.timeZone)
  const b = longDayMonth(when.toMs, when.timeZone)
  return a.month === b.month ? `Entre ${a.day} e ${b.day} de ${b.month}, ` : `Entre ${a.day} de ${a.month} e ${b.day} de ${b.month}, `
}

/** "Verificamos 412 passagens de 38 satélites de observação e estações tripuladas." */
const checkedPt = (passes: number, sats: number) => {
  const from = pl(sats, 'satélite de observação ou estação tripulada', 'satélites de observação e estações tripuladas')
  return `Verificamos ${f.int(passes)} ${pl(passes, 'passagem', 'passagens')} de ${f.int(sats)} ${from}.`
}

/** The timeline summary's lane words, after a count (a title never follows a bare number, §3.5) */
const LANE: Record<Verdict, readonly [string, string]> = {
  imaged: ['passagem com imagem', 'passagens com imagem'],
  likely: ['provável', 'prováveis'],
  could: ['possível', 'possíveis'],
  overhead: ['sobrevoo', 'sobrevoos'],
}

/** What a pass's mark stands for in the timeline's tooltip, by the satellite's category: its kind and the mark's shape */
const MARK_KIND: Partial<Record<SatCategory, string>> = {
  'open-optical': 'arquivo aberto · ◇',
  'commercial-optical': 'comercial · □',
  radar: 'radar · ▣',
  'weather-leo': 'meteorológico · ○',
  crewed: 'com tripulação · ✛',
}

const results: typeof en = {
  // ── the headline ─────────────────────────────────────────────────────────────────────────
  headline: {
    watched: (n: number, place: string, when: WindowWhen): Rich => [
      windowLead(when),
      strong(num(f.int(n)), pl(n, ' satélite observou', ' satélites observaram')),
      ' ',
      accent(place),
      '.',
    ],
    none: (place: string, past: boolean): Rich => [
      'Nenhum satélite que rastreamos observou ',
      accent(place),
      past ? ' naquela semana.' : ' esta semana.',
    ],
  },

  // ── the second line ──────────────────────────────────────────────────────────────────────
  imagesPublic: (k: number): Rich => [
    strong('Pelo menos '),
    num(f.int(k)),
    pl(k, ' imagem foi publicada.', ' imagens foram publicadas.'),
  ],
  noImages: { thisWeek: 'Nenhuma imagem foi publicada esta semana.', thatWeek: 'Nenhuma imagem foi publicada naquela semana.' },
  archiveDown: 'Os arquivos de imagens não responderam, por isso não conseguimos contar as imagens públicas agora.',
  tryAgain: 'Tentar de novo',
  share: 'Compartilhar',
  shareWeekLabel: (place: string, past: boolean) => `Compartilhar ${past ? 'aquela semana' : 'esta semana'}: ${place}`,

  why: {
    sunNeverRose: 'O sol não chegou a nascer, por isso nenhuma câmera diurna pôde ver o local.',
    sunBarelyRose: 'O sol mal nasceu, por isso nenhuma câmera diurna pôde ver o local.',
    infrared: (n: number): Rich => [
      'Ainda assim, satélites meteorológicos captaram o local ',
      num(f.int(n)),
      ` ${times(n)} no infravermelho.`,
    ],
    // *mais 7 satélites de radar* never agrees (*outros* would); the verb agrees with the total: one name alone *esteve*.
    radar: (names: readonly string[], others: number, passes: number): Rich => {
      const rest = pl(others, 'satélite de radar', 'satélites de radar')
      const items = others > 0 ? [...names, `${names.length ? 'mais ' : ''}${f.int(others)} ${rest}`] : names
      const verb = names.length + others === 1 ? 'esteve' : 'estiveram'
      return [`O radar não precisa de luz. ${f.list(items)} ${verb} ao alcance `, num(f.int(passes)), ` ${times(passes)}.`]
    },
    unpublished: (n: number) =>
      `O Sentinel-2 ou o Landsat passou sobre o local ${n === 1 ? 'uma vez' : `${f.int(n)} vezes`} durante o dia, mas nenhuma cena foi publicada ainda.`,
    none: 'Nenhum satélite com imagens públicas passou sobre o local durante o dia.',
  },

  // ── the summary's four readouts ──────────────────────────────────────────────────────────
  verdictGroup: 'Passagens por rótulo. Cada contagem leva à lista correspondente.',
  // Never "4 observou": the count with its unit, a colon, then the title (§3.5).
  verdictReadout: (n: number, verdict: Verdict, title: string) => `${f.int(n)} ${verdicts[verdict].unit(n)}: ${title}`,

  // ── the footnotes ────────────────────────────────────────────────────────────────────────
  notes: {
    counted: (o: { detailed: number; mosaics: number; radar: number; geo: number; passes: number; satellites: number }): Rich => {
      const out: Part[] = [
        strong(f.int(o.detailed)),
        ` ${pl(o.detailed, 'imagem detalhada', 'imagens detalhadas')} (Sentinel-2, Landsat, 10–30 m)`,
      ]
      if (o.mosaics)
        out.push(' · ', strong(f.int(o.mosaics)), ` ${pl(o.mosaics, 'mosaico meteorológico diário', 'mosaicos meteorológicos diários')} (250–375 m)`)
      if (o.radar) out.push(' · ', strong(f.int(o.radar)), ` ${pl(o.radar, 'imagem de radar', 'imagens de radar')} (Sentinel-1, 20 m)`)
      if (o.geo)
        out.push(
          ' · ',
          strong(f.int(o.geo)),
          ` ${images(o.geo)} de disco completo de satélites meteorológicos geoestacionários (2–5 km; a mais recente de cada um aparece aqui)`,
        )
      out.push(`. ${checkedPt(o.passes, o.satellites)}`)
      return out
    },
    checked: (passes: number, satellites: number) => checkedPt(passes, satellites),
    // The place is never put after *de* (§5): *mais perto do lugar pesquisado*, so `place` is left unused.
    passTimes: (_place: string, fetched: string | undefined, zoneLabel: string) =>
      'Os horários das passagens são o momento em que cada satélite esteve mais perto do lugar pesquisado, calculados a partir de elementos orbitais públicos' +
      `${fetched ? ` (obtidos em ${fetched})` : ''}. Horários locais: ${zoneLabel}.`,
  },

  // ── the panel ────────────────────────────────────────────────────────────────────────────
  sheetLabel: (place: string) => `Satélites sobre ${place}`,
  computingPasses: 'Calculando passagens',
  sections: { summary: 'Resumo', passes: 'Passagens', watchedContinuously: 'Observação contínua' },
  checkingArchives: 'Consultando os arquivos',
  invite: {
    text: 'Algo observou você também esta semana.',
    checkPlace: 'Ver seu lugar',
    dismiss: 'Fechar',
  },
  searchAnother: 'Buscar outro lugar',
  // The crumb is one mono line beside the stepper and the search icon: *Todas as passagens* pushed the icon off a
  // 390 px phone. *Passagens* is the section it goes back to (*02 / Passagens*); the tooltip keeps the full words.
  allPasses: 'Passagens',

  footer: {
    replay: 'Rever',
    replayLabel: 'Rever a passagem',
    replayTitle: 'Rever a passagem no globo',
    shareLabel: { pass: 'Compartilhar esta passagem', image: 'Compartilhar esta imagem' },
    // The button never wraps, and *Compartilhar esta passagem* (even *Compartilhar passagem*) beside *Rever* is cut on
    // 401–470 px phones and the 400 px laptop panel: the bare infinitive everywhere, the full words in shareLabel.
    shareButton: { pass: ['Compartilhar'] as Rich, image: ['Compartilhar'] as Rich },
    checkPlace: [strong('Ver '), 'seu lugar'] as Rich,
    clearest: [strong('Ver '), 'vista mais limpa'] as Rich,
    clearestLabel: 'Ver vista mais limpa',
  },

  // ── the headers ──────────────────────────────────────────────────────────────────────────
  head: {
    windowSpan: (n: number, startMs: number, endMs: number, timeZone: string) =>
      `${days(n)} · ${ptTime.dayRange(startMs, endMs, timeZone, localParts(startMs, timeZone), localParts(endMs, timeZone))}`,
    verifying: 'Verificando mosaicos',
    cancel: 'Cancelar',
    newSearch: 'Nova busca',
    close: 'Fechar',
    escKey: 'Esc',
    searchBarLabel: (place: string) => `Buscar outro lugar (agora: ${place})`,
    change: 'Trocar',
    computing: 'Calculando',
    recent: 'Recentes',
    position: (k: number, n: number) => `Passagem ${f.int(k)} de ${f.int(n)} deste tipo`,
    previous: 'Passagem anterior deste tipo',
    next: 'Próxima passagem deste tipo',
    previousTitle: 'Anterior (←)',
    nextTitle: 'Próxima (→)',
    allPassesTitle: 'Todas as passagens (Esc)',
    shared: (sat: string, place: string) => `Compartilhado com você · ${sat} observou ${place}`,
    // Written as the 'time' namespace's stamp writes a day and a clock, so this header and the pass's row agree.
    passWhen: (ms: number, timeZone: string, p: DateFields, time: string, zone: string, approx: boolean) =>
      `${ptTime.day(ms, timeZone, p)} · ${approx ? '≈ ' : ''}${time} ${zone}`,
  },

  // ── the computing readout ────────────────────────────────────────────────────────────────
  computing: {
    stages: {
      catalog: { idle: 'Catálogo orbital', done: 'Catálogo carregado' },
      propagate: { idle: (n: number) => `Cálculo das órbitas · ${days(n)}`, done: 'Órbitas calculadas' },
      archive: { idle: 'Arquivos Sentinel-2 + Landsat', done: 'Arquivos consultados' },
      match: { idle: 'Associação de cenas e passagens', done: 'Cenas associadas' },
    },
    ready: 'Relatório pronto',
    ok: 'OK',
    seconds: (s: number) => `${f.dec(s, 2)} s`,
    // One line beside the percentage: *Janela de 7 dias · * cut the UTC off on laptops. *7 dias · * as the header's span.
    window: (n: number, from: UtcWhen, to: UtcWhen): Rich => [
      strong(`${days(n)} · `),
      `${dayMonth(from.ms, 'UTC')} ${from.time} → ${dayMonth(to.ms, 'UTC')} ${to.time} UTC`,
    ],
    percent: (pct: number) => `${f.int(pct)}%`,
    slow: 'O Planetary Computer e a NASA geram as imagens na hora; esta etapa pode levar alguns segundos.',
    verySlow:
      'Os arquivos de imagens estão demorando a responder. Se não responderem, as passagens aparecem mesmo assim, calculadas pela geometria orbital, e avisamos.',
    // *do satélite {sat}*: the noun makes the contraction safe (§5); a shared picture never comes from a station.
    sharedAlt: (sat: string | undefined, place: string) =>
      sat ? `Imagem do satélite ${sat} compartilhada com você: ${place}.` : `Imagem de satélite compartilhada com você: ${place}.`,
    sharedCaption: (sat: string | undefined, place: string, when?: PlaceWhen): Rich => [
      strong('Compartilhado com você'),
      ` · ${sat ?? 'Um satélite'} observou ${place}${when ? ` · ${day(when.ms, when.timeZone)}, ${when.time}` : ''}`,
    ],
  },

  // ── 03 / Observação contínua ─────────────────────────────────────────────────────────────
  geo: {
    none: 'Nenhum satélite meteorológico geoestacionário em operação vê este lugar acima de 5° de elevação.',
    facts: (lon: string, elevationDeg: number, cadenceMin: number) =>
      `${lon} · ${f.dec(elevationDeg, 1)}° acima · a cada ${f.int(cadenceMin)} min`,
    images: (n: number, window: number): Rich => [
      num(f.int(n)),
      window === 7 ? ` ${images(n)} esta semana` : ` ${images(n)} em ${days(window)}`,
    ],
    replay: 'Rever',
    replayLabel: (sat: string) => `${sat}: rever a imagem mais recente`,
    // A 72 px frame, no hyphenation: a word fits up to 9 characters on a phone (*Verificando…*, *Indisponível* were cut).
    frame: {
      probing: 'Buscando…',
      noPublic: 'Sem imagem pública',
      poorQuality: 'Qualidade baixa',
      noneNow: 'Sem imagem no momento',
      unavailable: 'Quadro não carregou',
    },
    frameAlt: (sat: string, infrared: boolean) => `${sat}: quadro${infrared ? ' infravermelho' : ''} mais recente ao redor do lugar`,
    infraredChip: 'IR',
    infraredTitle: 'Infravermelho: o topo das nuvens pela temperatura; quanto mais frio, mais claro',
  },

  // ── 04 / Linha do tempo ──────────────────────────────────────────────────────────────────
  timeline: {
    title: 'Linha do tempo',
    meta: (n: number, zoneLabel: string, zones?: string) => `${days(n)} · ${zoneLabel}${zones ? ` · ${zones}` : ''}`,
    zoneChange: (before: string, after: string) => `${before} → ${after}`,
    daylight: 'Dia aqui',
    // The lane words, never a title after a bare number (*12 observou*): §3.5. The titles are not needed.
    summary: (n: number, counts: Record<Verdict, number>, _titles: Readonly<Record<Verdict, string>>) =>
      `Linha do tempo, ${days(n)}: ` +
      (['imaged', 'likely', 'could', 'overhead'] as const).map((v) => `${f.int(counts[v])} ${pl(counts[v], ...LANE[v])}`).join(', ') +
      '.',
    keysHint: (summary: string) => `${summary} Percorra as passagens com as teclas de seta para a esquerda e para a direita.`,
    geoLane: (n: number): Rich => [strong('Geo · '), f.int(n)],
    geoNames: (names: readonly string[]) => names.join(', '),
    now: 'Agora',
    geometry: (deg: number, km: number) => `${f.dec(deg, 1)}° fora do nadir · ${f.int(km)} km`,
    markMosaic: (gsdM: number) => `Mosaico diário, ${f.int(gsdM)} m · ●`,
    markRadar: (gsdM: number) => `Imagem de radar, ${f.int(gsdM)} m · ◆`,
    markImaged: (title: string) => `${title} · ◆`,
    markKind: (title: string, category: SatCategory) => `${title} · ${MARK_KIND[category] ?? 'outro'}`,
  },

  // ── 02 / Rever ───────────────────────────────────────────────────────────────────────────
  replay: {
    scrubLabel: 'Momento da cena dentro da passagem',
    scrubValue: (tMinus: string, utc: string) => `${tMinus}, ${utc}`,
    play: 'Reproduzir a passagem',
    pause: 'Pausar a passagem',
    speed: 'Velocidade de reprodução',
    // The legend never wraps; *Mais perto* is fixed, so the room comes from here: the noun, as long as *In view*.
    inView: (duration: string) => `Alcance ${duration}`,
    closest: 'Mais perto',
    spaceKey: 'Espaço',
    playPause: 'reproduzir / pausar',
    stepKind: 'anterior / próxima do mesmo tipo',
  },

  // ── the plan view ────────────────────────────────────────────────────────────────────────
  plan: {
    // A satellite (or a station) after a colon, never after *de* (§5).
    label: (sat: string, km: number) => `Vista de cima. Traço no solo: ${sat}, a ${f.int(km)} km do local na máxima aproximação.`,
    // The section is already *Vista de cima*: the corner says which way is up, inside northUp's 15 characters.
    northUp: 'Norte acima',
    fieldOfRegard: (deg: number) => `Inclinação máx. ±${f.int(deg)}°`,
    swath: (km: number) => `Faixa ${f.int(km)} km`,
    groundTrack: 'Traço no solo',
    scale: (km: number) => `${km >= 1 ? f.int(km) : f.dec(km, 1)} km`,
    closest: (km: number) => `Mais perto ${km < 1 ? '< 1' : f.int(km)} km`,
  },

  // ── a picture's product line ─────────────────────────────────────────────────────────────
  product: {
    mosaic: (m: number) => `Mosaico diário · ${m} m`,
    fullDisc: (km: number) => `Disco completo · ${km} km`,
    infrared: (km: number) => `Infravermelho · ${km} km`,
    sentinel2: (m: number) => `Sentinel-2 L2A · ${m} m`,
    landsat: (m: number) => `Landsat C2 L2 · ${m} m`,
    sentinel1: (m: number) => `Radar do Sentinel-1 · ${m} m`,
    other: (m: number) => `${m} m`,
  },
  pixel: { m: (m: number) => `${m} m`, km: (km: number) => `${km} km` },

  // ── the time-lapse's row ─────────────────────────────────────────────────────────────────
  timelapse: {
    title: 'Time-lapse',
    sub: 'Este lugar, ano a ano',
  },
}

export default results
