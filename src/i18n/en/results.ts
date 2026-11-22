/**
 * English copy for the results panel (src/ui/results): the headline and its second line, the sentences that say why
 * no image was made public, the summary's readouts and footnotes, the computing readout, the panel's headers and
 * footer, the timeline, the replay controls, the plan view, the "watched continuously" list, the photo captions'
 * product lines and the time-lapse row. One pass's paragraph is in ./pass.ts; the verdict names in ./verdicts.ts.
 *
 * Why these are whole sentences with raw slots: the headline is the product's finding ("In the last 7 days, 256
 * satellites watched Waterloo."), and other languages put its count, its verb and the place in their own order. Where
 * a sentence mixes styles, the message returns rich parts (api/_lib/i18n/parts.ts) and the component maps each kind
 * to its look: num() a number set in the mono face (its unit smaller), strong() emphasis or, where a comment says so,
 * an optional piece that is hidden on some layouts, accent() the serif place name. Code never glues fragments.
 *
 * Slots: counts are numbers (pluralise and group them with fmt(locale)); place labels and satellite names arrive bare
 * and are never inflected (English adds "the" before seas and deserts itself, in ./plain/english.ts); days arrive as
 * instants (epoch ms) with the IANA zone they are shown in, and English writes them with its 'time' namespace ("Sun 1
 * Nov", "29 Oct", "1 → 8 Nov"): write them as your 'time' namespace does (its day, dayMonth, dayRange), or with
 * api/_lib/i18n/dates.ts (formatDate, or formatRange for a span), in the form your sentence needs; clocks
 * ("16:14:21"), zone abbreviations ("EST", "UTC+9"), coordinates and UTC stamps are international notation, already
 * written. Decimals: where English writes one with toFixed (it keeps that rounding, byte for byte), write it with
 * fmt(locale).dec(x, digits), which puts your decimal separator in.
 *
 * Mono labels are stored in sentence case and uppercased by CSS. Proper names stay as they are: Sentinel-1/-2,
 * Landsat, NASA, Planetary Computer, EUMETSAT, Meteosat, the satellites.
 */
import { fmt } from '../../../api/_lib/i18n/format'
import { num, strong, type Part, type Rich } from '../../../api/_lib/i18n/parts'
import { ns } from '../ns'
import type { Pass, SatCategory } from '@/types'
import { localParts, type DateFields } from '@/ui/results/lib/time'
import { placeAccent } from './plain/english'
import enTime from './time'
import enVerdicts from './verdicts'

const en = fmt('en')
type Verdict = Pass['verdict']

/** "7 days", "1 pass": a grouped count and its noun */
const count = (n: number, one: string, other: string) => `${en.int(n)} ${en.plural(n, { one, other })}`
const satellites = (n: number) => en.plural(n, { one: 'satellite', other: 'satellites' })
const images = (n: number) => en.plural(n, { one: 'image', other: 'images' })
/** "29 Oct" / "Sun 1 Nov" at a zone: English's 'time' forms, from the instant */
const dayMonth = (ms: number, timeZone: string) => enTime.dayMonth(ms, timeZone, localParts(ms, timeZone))
const day = (ms: number, timeZone: string) => enTime.day(ms, timeZone, localParts(ms, timeZone))

/**
 * When the week was: the last `lastDays` days (a search made now), or an older window (a shared link's week) from the
 * instant `fromMs` to the instant `toMs`, both shown at the place's zone `timeZone`. English writes each end as its
 * 'time' namespace's dayMonth ("29 Oct"); write them in the form your sentence needs (a range, a case after "between").
 */
export type WindowWhen = { lastDays: number } | { fromMs: number; toMs: number; timeZone: string }

/**
 * An instant shown in UTC: `ms` (write its day, no weekday, at 'UTC': English uses its 'time' namespace's dayMonth,
 * "1 Nov") and `time`, its 24 h clock in UTC ("05:47"), international notation, already written.
 */
export interface UtcWhen {
  ms: number
  time: string
}

/**
 * A pass's moment at the place: the instant `ms` at the zone `timeZone` (write its day as your 'time' namespace's
 * `day` does: English "Sun 1 Nov") and `time`, its 24 h clock there ("16:14"), international notation, already written.
 */
export interface PlaceWhen {
  ms: number
  timeZone: string
  time: string
}

/** "1,234 passes from 250 imaging and crewed satellites checked." */
const checkedEn = (passes: number, sats: number) =>
  `${count(passes, 'pass', 'passes')} from ${en.int(sats)} imaging and crewed ${satellites(sats)} checked.`

/** "256 satellites watched": the headline's emphasis (and the share card's checks, through lib/copy watchedPhrase). */
export const watchedPhraseEn = (n: number) => `${en.int(n)} ${satellites(n)} watched`

/** What a pass's mark stands for in the timeline's tooltip, by the satellite's category: its kind and the mark's shape */
const MARK_KIND: Partial<Record<SatCategory, string>> = {
  'open-optical': 'open imager · ◇',
  'commercial-optical': 'commercial · □',
  radar: 'radar · ▣',
  'weather-leo': 'weather · ○',
  crewed: 'crewed · ✛',
}

export default ns('results', {
  // ── the headline (01 / SUMMARY, and the phone sheet's header) ─────────────────────────────────
  headline: {
    /**
     * The finding, in the display face: "In the last 7 days, **256 satellites watched** *Waterloo*." The strong part is
     * the count phrase (its number set in the display face's figures), the accent the place (serif). Put both where
     * your sentence needs them; keep exactly one strong part, with the num() inside it, and one accent. `n` counts
     * distinct satellites, 1 or more.
     */
    watched: (n: number, place: string, when: WindowWhen): Rich => [
      `${'lastDays' in when ? `In the last ${count(when.lastDays, 'day', 'days')}` : `Between ${dayMonth(when.fromMs, when.timeZone)} and ${dayMonth(when.toMs, when.timeZone)}`}, `,
      strong(num(en.int(n)), ` ${satellites(n)} watched`),
      ' ',
      ...placeAccent(place),
      '.',
    ],
    /** Nothing we track crossed the place (rare). `past`: an older week ("that week"), else this one. One accent: the place */
    none: (place: string, past: boolean): Rich => ['No satellite we track watched ', ...placeAccent(place), past ? ' that week.' : ' this week.'],
  },

  // ── the second line: how many images were made public ─────────────────────────────────────────
  /**
   * "27 images were made public." (`k` ≥ 1: photos, weather mosaics, radar and full-disc images, one count). The
   * num() part is the count (set in the display face; it changes in place when the count grows). The strong part is
   * NOT emphasis: it is the "at least" words, shown only while the count can still grow and removed once it is final,
   * so the sentence must read with and without it. Keep exactly one strong part and one num(), the num() outside the
   * strong part. Also the share text's line ("At least 4 images…" while partial).
   */
  imagesPublic: (k: number): Rich => [
    strong('At least '),
    num(en.int(k)),
    en.plural(k, { one: ' image was made public.', other: ' images were made public.' }),
  ],
  /** No image at all. `thatWeek` for an older week (a shared link) */
  noImages: { thisWeek: 'No images were made public this week.', thatWeek: 'No images were made public that week.' },
  /** The photo archives did not answer: the second line, with a Try again button beside it. Also the share text's line */
  archiveDown: 'The image archives didn’t answer, so we can’t count the public images right now.',
  tryAgain: 'Try again',
  /** The week's Share button at the end of the second line (and the pass footer's short Share) */
  share: 'Share',
  /** Its accessible name: share this (or that, older) week at the place */
  shareWeekLabel: (place: string, past: boolean) => `Share ${past ? 'that week' : 'this week'} at ${place}`,

  /** Under the second line when no image was made public: one plain reason. "It" is the searched place */
  why: {
    /** Polar night: the sun never rose all week */
    sunNeverRose: 'The sun never rose, so no daylight camera could see it.',
    /** …or barely (never 5° above the horizon) */
    sunBarelyRose: 'The sun barely rose, so no daylight camera could see it.',
    /** After a dark week: weather satellites still crossed it `n` times (a count of passes) */
    infrared: (n: number): Rich => [
      'Weather satellites still swept it in infrared, ',
      num(en.int(n)),
      en.plural(n, { one: ' time.', other: ' times.' }),
    ],
    /**
     * Radar satellites need no light. `names`: the one or two that passed most (as they are); `others`: how many more
     * radar satellites (0 or more); `passes`: their passes in all. English lists them as "Umbra-08, Capella-14 and 7
     * other radar satellites"; use your language's list (fmt(locale).list) and plural forms.
     */
    radar: (names: readonly string[], others: number, passes: number): Rich => {
      const who = en.list(others > 0 ? [...names, `${en.int(others)} other radar ${satellites(others)}`] : names)
      return [`Radar doesn’t need light. ${who} passed within range `, num(en.int(passes)), en.plural(passes, { one: ' time.', other: ' times.' })]
    },
    /** Sentinel-2 or Landsat crossed in daylight `n` times (1 or more: "once") and no scene is published yet */
    unpublished: (n: number) => {
      const times = en.plural(n, { one: 'once', other: `${en.int(n)} times` })
      return `Sentinel-2 or Landsat crossed it ${times} in daylight, but no scene has been published yet.`
    },
    /** Nothing that takes public pictures crossed it in daylight */
    none: 'No open imaging satellite crossed it in daylight.',
  },

  // ── the summary's four readouts (one per verdict) ─────────────────────────────────────────────
  /** The readouts' group (screen readers): each readout scrolls to its group in the pass list */
  verdictGroup: 'Passes by verdict. Each jumps to its list.',
  /** One readout's accessible name: the count with its unit, then the verdict's name (`title`, from 'verdicts') */
  verdictReadout: (n: number, verdict: Verdict, title: string) => `${en.int(n)} ${enVerdicts[verdict].unit(n)}: ${title}`,

  // ── the footnotes that close the overview ─────────────────────────────────────────────────────
  notes: {
    /**
     * What the second line's count is made of, then how much was checked (dim mono body text that wraps). Each count
     * is a strong part (bold); the parenthesised ranges are the pictures' ground resolution. `radar`, `mosaics` and
     * `geo` are left out when 0. `passes` and `satellites` are hundreds.
     */
    counted: (o: { detailed: number; mosaics: number; radar: number; geo: number; passes: number; satellites: number }): Rich => {
      const out: Part[] = [strong(en.int(o.detailed)), ` detailed ${images(o.detailed)} (Sentinel-2, Landsat, 10–30 m)`]
      const mosaics = en.plural(o.mosaics, { one: 'mosaic', other: 'mosaics' })
      if (o.mosaics) out.push(' · ', strong(en.int(o.mosaics)), ` daily weather ${mosaics} (250–375 m)`)
      if (o.radar) out.push(' · ', strong(en.int(o.radar)), ` radar ${images(o.radar)} (Sentinel-1, 20 m)`)
      const geo = ` full-disc ${images(o.geo)} from geostationary weather satellites (2–5 km; the newest of each is shown)`
      if (o.geo) out.push(' · ', strong(en.int(o.geo)), geo)
      out.push(`. ${checkedEn(o.passes, o.satellites)}`)
      return out
    },
    /** …the same footnote when no image was made public */
    checked: (passes: number, satellites: number) => checkedEn(passes, satellites),
    /**
     * The last footnote: how pass times are computed. `fetched`: when the orbital elements were downloaded, an
     * international UTC stamp ("2026-11-08 03:31Z"), absent when unknown; `zoneLabel`: the place's time zone as
     * shown ("America/Toronto", or "UTC−9 · at sea")
     */
    passTimes: (place: string, fetched: string | undefined, zoneLabel: string) =>
      `Pass times are when each satellite was closest to ${place}, computed from public orbital elements` +
      `${fetched ? ` (fetched ${fetched})` : ''}. Local times are ${zoneLabel}.`,
  },

  // ── the panel ─────────────────────────────────────────────────────────────────────────────────
  /** The panel's accessible name with results */
  sheetLabel: (place: string) => `Satellites over ${place}`,
  /** …while computing (also what screen readers hear first in the computing readout) */
  computingPasses: 'Computing passes',
  /** The section rules ("01 / Summary": mono caps) and the sections' accessible names */
  sections: { summary: 'Summary', passes: 'Passes', watchedContinuously: 'Watched continuously' },
  /** Where the pass list will be, while the archives are still being checked (a status line, with a blinking caret after it) */
  checkingArchives: 'Checking the archives',
  /** Someone opened a shared link: a bar over the summary invites them to search their own place */
  invite: {
    text: 'Something watched you this week too.',
    /** Its button (also the pass footer's accessible name for the same action) */
    checkPlace: 'Check your place',
    /** Closes the bar (accessible name of an × button) */
    dismiss: 'Dismiss',
  },
  /** Search another place: the inline search field's placeholder, the phone header's search button (name and tooltip) */
  searchAnother: 'Search another place',
  /** The back button of a pass (to the overview's pass list); also its accessible name on phones */
  allPasses: 'All passes',

  /** The buttons under a pass (mono caps) */
  footer: {
    replay: 'Replay',
    /** Replay's accessible name and tooltip */
    replayLabel: 'Replay the pass',
    replayTitle: 'Replay the pass on the globe',
    /** Share's accessible name and tooltip: a pass, or an image (a geostationary frame is not a pass) */
    shareLabel: { pass: 'Share this pass', image: 'Share this image' },
    /**
     * The primary Share button. The strong part is dropped on narrow phones (≤ 400 px), so the other parts must read
     * alone ("Share") and with it ("Share this pass"). At most one strong part.
     */
    shareButton: { pass: ['Share', strong(' this pass')] as Rich, image: ['Share', strong(' this image')] as Rich },
    /** A share recipient's button to search their own place: the strong part is dropped on narrow phones (≤ 400 px) */
    checkPlace: [strong('Check '), 'your place'] as Rich,
    /** A clouded photo's button to the week's clearest one: the strong part is dropped the same way */
    clearest: [strong('See the '), 'clearest look'] as Rich,
    /** …its accessible name */
    clearestLabel: 'See the clearest look',
  },

  // ── the headers ───────────────────────────────────────────────────────────────────────────────
  head: {
    /**
     * The week, mono caps: `days` long, from the instant `startMs` to `endMs` at the place's zone `timeZone`. English
     * writes the span as its 'time' namespace's dayRange does ("7 days · 1 → 8 Nov"): write it as yours does, or
     * with dates.ts formatRange
     */
    windowSpan: (days: number, startMs: number, endMs: number, timeZone: string) =>
      `${count(days, 'day', 'days')} · ${enTime.dayRange(startMs, endMs, timeZone, localParts(startMs, timeZone), localParts(endMs, timeZone))}`,
    /** While NASA's weather pictures are still checked (mono caps, beside a live dot, same width budget as windowSpan) */
    verifying: 'Verifying weather mosaics',
    /**
     * The header's one button: Cancel (computing), New search (results), Close (the inline search). The three share
     * one box as wide as the longest, so keep them about as long as the English. Mono caps.
     */
    cancel: 'Cancel',
    newSearch: 'New search',
    close: 'Close',
    /** The key cap shown on hover beside those buttons (the Escape key; 'Esc' in most languages) */
    escKey: 'Esc',
    /** The search bar holding the current place (the results' top): its accessible name… */
    searchBarLabel: (place: string) => `Search another place (now ${place})`,
    /** …and its action word at the right end (mono caps, short) */
    change: 'Change',
    /** "Computing · T+1.84 s": the computing header's word (mono caps) */
    computing: 'Computing',
    /** Before the chips of places searched earlier this session (mono caps) */
    recent: 'Recent',
    /** A pass's position among the passes of its verdict, "3 / 31" on screen: the accessible name */
    position: (k: number, n: number) => `Pass ${k} of ${n} of this kind`,
    /** The ‹ › buttons beside it: accessible names */
    previous: 'Previous pass of this kind',
    next: 'Next pass of this kind',
    /**
     * Their tooltips. ← and → name the physical arrow keys, which keep their meaning in every language for now: keep
     * the arrows exactly as they are
     */
    previousTitle: 'Previous (←)',
    nextTitle: 'Next (→)',
    /** The back button's tooltip (Esc is the key) */
    allPassesTitle: 'All passes (Esc)',
    /** A share recipient's tag over the pass (mono caps, one line, after a dot): who watched what */
    shared: (sat: string, place: string) => `Shared with you · ${sat} watched ${place}`,
    /**
     * When the pass was, at the place: "Sun 1 Nov · 16:14:21 EST" (mono, under the satellite's name). The day is the
     * instant's (`ms` at the zone `timeZone`; `p` its local fields there, as the 'time' namespace's messages get
     * them): write it exactly as your 'time' namespace's `stamp` writes a day, so this header and the same pass's row
     * in the pass list agree. `time` is the 24 h clock at the place ("16:14", or "16:14:21") and `zone` its
     * abbreviation ("EST", "UTC+9"): international notation, already written; keep the two together, in that order.
     * `approx`: a geostationary scan's time, known to about a minute ("≈ 16:14"; '≈' means "about")
     */
    passWhen: (ms: number, timeZone: string, p: DateFields, time: string, zone: string, approx: boolean) =>
      `${enTime.day(ms, timeZone, p)} · ${approx ? '≈ ' : ''}${time} ${zone}`,
  },

  // ── the computing readout (between a search and its results) ──────────────────────────────────
  computing: {
    /**
     * The four numbered rows, mono caps, beside the row's number and duration (about 40 characters a line on a 390 px
     * phone; a longer one wraps to a second line, so keep them short): `idle` before the step starts, `done` after
     * (while it runs the engine writes its own line). The idle labels are also what screen readers hear as each step
     * starts
     */
    stages: {
      catalog: { idle: 'Orbital catalog', done: 'Catalog loaded' },
      /** `days`: the window computed ahead (7) */
      propagate: { idle: (days: number) => `Propagate orbits · ${count(days, 'day', 'days')}`, done: 'Orbits propagated' },
      archive: { idle: 'Sentinel-2 + Landsat archives', done: 'Archives searched' },
      match: { idle: 'Match scenes to passes', done: 'Scenes matched' },
    },
    /** Screen readers, when the report is complete */
    ready: 'Report ready',
    /** A finished row's status mark (mono caps, a 2–3 character cell) */
    ok: 'OK',
    /**
     * A duration in seconds with two decimals ("1.84 s"): each row's time, and the header's "T+1.84 s". English keeps
     * toFixed's rounding; a translation writes fmt(locale).dec(s, 2). Keep the unit short
     */
    seconds: (s: number) => `${s.toFixed(2)} s`,
    /**
     * Under the progress bar (mono caps): the window, `days` long, from one instant to another, both shown in UTC
     * ("1 Nov 05:47 → 8 Nov 05:47 UTC": each end's day at 'UTC', then its clock). The strong part ("7-day window · ")
     * is hidden on phones up to 420 px, so the rest must read alone. Keep 'UTC'
     */
    window: (days: number, from: UtcWhen, to: UtcWhen): Rich => [
      strong(`${days}-day window · `),
      `${dayMonth(from.ms, 'UTC')} ${from.time} → ${dayMonth(to.ms, 'UTC')} ${to.time} UTC`,
    ],
    /** The progress bar's percentage (mono) */
    percent: (pct: number) => `${en.int(pct)}%`,
    /** After 7 s on the archive step (body text under the readout) */
    slow: 'Planetary Computer and NASA render on demand; this step can take a few seconds.',
    /** …after 16 s */
    verySlow: 'The image archives are slow to answer. If they don’t, the passes will still be shown from orbital geometry, and we’ll say so.',
    /**
     * A shared link's picture, shown while the recipient's own report computes. `sat` is the satellite's name, absent
     * when the share did not say: write your own words for "a satellite" then
     */
    sharedAlt: (sat: string | undefined, place: string) => `${sat ?? 'A satellite'} image of ${place}, shared with you.`,
    /**
     * …its caption (mono caps): the strong part is bold. `when`: the pass's moment at the place, when known (English
     * writes its day as the 'time' namespace's `day`, then the clock: "Sun 1 Nov, 16:14")
     */
    sharedCaption: (sat: string | undefined, place: string, when?: PlaceWhen): Rich => [
      strong('Shared with you'),
      ` · ${sat ?? 'A satellite'} watched ${place}${when ? ` · ${day(when.ms, when.timeZone)}, ${when.time}` : ''}`,
    ],
  },

  // ── 03 / WATCHED CONTINUOUSLY: geostationary weather satellites ───────────────────────────────
  geo: {
    /** No such satellite sees the place (high latitudes) */
    none: 'No operational geostationary weather imager sees this place above 5° elevation.',
    /**
     * A row's facts (mono caps): where it sits (`lon`, international notation: "0.0°E"), how high it stands in your
     * sky (`elevationDeg`) and how often it takes a picture (`cadenceMin`). English keeps toFixed for the angle; a
     * translation writes fmt(locale).dec(x, 1)
     */
    facts: (lon: string, elevationDeg: number, cadenceMin: number) =>
      `${lon} · ${elevationDeg.toFixed(1)}° up · every ${en.int(cadenceMin)} min`,
    /** How many pictures it took in the window (`days` long, 7 for "this week"): the num() is the count, in mono */
    images: (n: number, days: number): Rich => [
      num(en.int(n)),
      days === 7 ? ` ${images(n)} this week` : ` ${images(n)} in ${count(days, 'day', 'days')}`,
    ],
    /** A row that opens its newest picture: the word (mono caps, beside a play mark) and the row's accessible name */
    replay: 'Replay',
    replayLabel: (sat: string) => `${sat}: replay its latest image`,
    /** In place of a row's small picture (mono caps, in a 64 px square: two short words) */
    frame: {
      /** While the newest picture is looked for */
      probing: 'Probing…',
      /** Its map service carries no pictures of it */
      noPublic: 'No public image',
      /** The place is at the rim of its disc: most of the picture would be off the Earth */
      poorQuality: 'Poor quality',
      /** The service did not answer */
      noneNow: 'No image just now',
      /** The picture would not load */
      unavailable: 'Frame unavailable',
    },
    /** The small picture's alternative text; `infrared` when it shows cloud-top temperature */
    frameAlt: (sat: string, infrared: boolean) => `${sat}: latest ${infrared ? 'infrared ' : ''}frame around the place`,
    /** A night frame's corner chip (mono caps, 2–3 characters; Infrared) and its tooltip */
    infraredChip: 'IR',
    infraredTitle: 'Infrared: cloud tops by temperature, colder is lighter',
  },

  // ── 04 / TIMELINE ─────────────────────────────────────────────────────────────────────────────
  timeline: {
    /** The section rule's word ("04 / Timeline", mono caps) */
    title: 'Timeline',
    /** Beside it: the window, the place's zone name, its abbreviation(s) (`zones`, "EST" or "EDT → EST"; mono caps) */
    meta: (days: number, zoneLabel: string, zones: string) => `${count(days, 'day', 'days')} · ${zoneLabel} · ${zones}`,
    /** A daylight-saving change inside the window: the zone's abbreviation before and after */
    zoneChange: (before: string, after: string) => `${before} → ${after}`,
    /** The legend's key for the shaded day/night band */
    daylight: 'Daylight here',
    /**
     * The strip's accessible summary (screen readers): the window's length and the passes in each verdict, in the
     * verdicts' order (imaged, likely, could, overhead). `titles` are the verdicts' names as your 'verdicts' namespace
     * writes them (verdicts.<id>.title, in the active language), so the timeline can name the verdicts as every other
     * screen does: English puts each after its count, lowercased for running text ("12 watched, 3 likely watched").
     * Use them the same way, in the case your running text needs; only where your grammar cannot put a name after a
     * bare count, word the counts so they stay recognisably those four verdicts (a colon before the name, or the lanes'
     * `short` words), never with new names
     */
    summary: (days: number, counts: Record<Verdict, number>, titles: Readonly<Record<Verdict, string>>) =>
      `Timeline, ${count(days, 'day', 'days')}: ` +
      (['imaged', 'likely', 'could', 'overhead'] as const).map((v) => `${en.int(counts[v])} ${titles[v].toLowerCase()}`).join(', ') +
      '.',
    /** …followed by how to use it from the keyboard (left and right are the physical arrow keys) */
    keysHint: (summary: string) => `${summary} Use the left and right arrow keys to step through passes.`,
    /**
     * The geostationary band's lane label (mono caps): the strong part ("Geo · ") is hidden on screens up to 1180 px
     * wide, where the count stands alone, as the verdict lanes' short words are
     */
    geoLane: (n: number): Rich => [strong('Geo · '), String(n)],
    /** The band's tooltip: the first watchers' names */
    geoNames: (names: readonly string[]) => names.join(', '),
    /** The right end of the axis when the window ends now */
    now: 'Now',
    /**
     * A pass's tooltip (mono): its second line, how far off straight down it looked (`deg`, one decimal: English keeps
     * toFixed; a translation writes fmt(locale).dec(deg, 1)) and how far from the place it passed (`km`, whole)
     */
    geometry: (deg: number, km: number) => `${deg.toFixed(1)}° off-nadir · ${en.int(km)} km`,
    /**
     * Its last line: what its mark means. The glyph after the words is the mark's shape (keep each one as it is):
     * a daily mosaic (●, `gsdM` its pixel), a radar image (◆), any other picture (◆, `title` the verdict's name)
     */
    markMosaic: (gsdM: number) => `Daily mosaic, ${en.int(gsdM)} m · ●`,
    markRadar: (gsdM: number) => `Radar image, ${en.int(gsdM)} m · ◆`,
    markImaged: (title: string) => `${title} · ◆`,
    /**
     * …or a pass with no picture: the verdict's name, then the kind of satellite by `category` with its mark's shape
     * (open imager ◇, commercial □, radar ▣, weather ○, crewed ✛), or "other" without one
     */
    markKind: (title: string, category: SatCategory) => `${title} · ${MARK_KIND[category] ?? 'other'}`,
  },

  // ── 02 / REPLAY under a pass ──────────────────────────────────────────────────────────────────
  replay: {
    /** The scrubber's label (screen readers) */
    scrubLabel: 'Scene time within the pass',
    /** Its spoken value: the countdown to the closest moment ("T−00:42") and the UTC clock ("16:14:21 UTC") */
    scrubValue: (tMinus: string, utc: string) => `${tMinus}, ${utc}`,
    /** The play button's accessible name */
    play: 'Play replay',
    pause: 'Pause replay',
    /** The speed buttons' group (screen readers) */
    speed: 'Replay speed',
    /** The legend under the scrubber (mono caps): how long the place was in the camera's view (`duration`, "4 min 12 s") */
    inView: (duration: string) => `In view ${duration}`,
    /** …and the tick at the closest moment */
    closest: 'Closest',
    /** The keyboard hints (laptops, mono caps): the Space key's cap, then what it does */
    spaceKey: 'Space',
    playPause: 'play / pause',
    /** …after the ← → key caps */
    stepKind: 'previous / next pass of this kind',
  },

  // ── the plan view (a pass with no picture) ────────────────────────────────────────────────────
  plan: {
    /** The drawing's accessible name: `km` from the place at the closest moment */
    label: (sat: string, km: number) => `Plan view: ${sat} ground track, ${en.int(km)} km from the place at closest approach.`,
    /**
     * The corner labels (mono caps, 9.5 px, one line each, never wrapped). This one sits top left and says north is at
     * the top. It shares the plan's top row with the top-right label (fieldOfRegard, swath or groundTrack), and the
     * plan is 240 to 520 px wide (about 340 px on a phone): the English pair already fills most of the narrowest, so
     * keep each no longer than the English (15 characters here, 20 for fieldOfRegard), or the two collide
     */
    northUp: 'Plan · north up',
    /**
     * Top right, on northUp's row (same length limit): what the band is. An agile camera's reach (`deg` either side of
     * straight down, a whole number: 30, 40, 45), a fixed camera's strip (`km` wide, whole), or no band at all
     */
    fieldOfRegard: (deg: number) => `Field of regard ±${deg}°`,
    swath: (km: number) => `Swath ${en.int(km)} km`,
    groundTrack: 'Ground track',
    /**
     * The scale bar's length (bottom left, under the bar): 0.1, 0.2, 0.5, 1, 2, 5 … 500 km. Below 1 km, `km` is 0.1,
     * 0.2 or 0.5 and English prints it as JavaScript does ("0.5 km"): write it with fmt(locale).dec(km, 1)
     */
    scale: (km: number) => `${km >= 1 ? en.int(km) : km} km`,
    /**
     * Bottom right, on the scale bar's row: how close the track came to the place (`km`, whole; under 1 km: "< 1 km").
     * Keep it about as short as the English
     */
    closest: (km: number) => `Closest ${km < 1 ? '< 1' : en.int(km)} km`,
  },

  // ── a picture's product line (captions, the photo viewer) ─────────────────────────────────────
  /**
   * What a picture is and its ground pixel (mono caps): "Sentinel-2 L2A · 10 m". Product names stay as they are;
   * "radar", "Daily mosaic", "Infrared", "Full disc" and the units are yours
   */
  product: {
    /** NASA's daily weather mosaic, `m` metres a pixel */
    mosaic: (m: number) => `Daily mosaic · ${m} m`,
    /** A geostationary full-disc frame, `km` a pixel; at night it is infrared */
    fullDisc: (km: number) => `Full disc · ${km} km`,
    infrared: (km: number) => `Infrared · ${km} km`,
    sentinel2: (m: number) => `Sentinel-2 L2A · ${m} m`,
    landsat: (m: number) => `Landsat C2 L2 · ${m} m`,
    sentinel1: (m: number) => `Sentinel-1 radar · ${m} m`,
    other: (m: number) => `${m} m`,
  },
  /** A picture's ground pixel alone ("10 m", "2 km"): whole numbers, never grouped */
  pixel: { m: (m: number) => `${m} m`, km: (km: number) => `${km} km` },

  // ── the time-lapse's row under the photos ─────────────────────────────────────────────────────
  timelapse: {
    /** Mono caps title */
    title: 'Time-lapse',
    /** Under it: what it shows (the row's accessible name is the two lines together) */
    sub: 'This place, year by year',
  },
})
