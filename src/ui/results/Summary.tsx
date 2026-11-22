/**
 * 01 / SUMMARY pieces: the headline ("In the last 7 days, 256 satellites watched Waterloo."), the second
 * line ("27 images were made public.": photos, weather mosaics and radar images, one count), readouts per verdict
 * (each jumps to its group in the list) and the report's caveats (the footnote breaks the count down). Owner request F: these are the final words; every place that says it uses these helpers.
 *
 * Numbers are honest and stable (A1): the headline integer is final as soon as the passes exist and never
 * counts; only the photos line can be partial ("At least 4 photos…") and it settles in place (a 200 ms
 * crossfade of the changed digits). Readouts count up once per report; coming back from a pass shows final
 * values at once.
 *
 * Every word comes from the 'results' and 'verdicts' namespaces, read at render: the model they describe holds only
 * numbers and kinds, so a language switch rewords the summary without rebuilding it.
 */
import { Fragment, type CSSProperties } from 'react'
import { LOCALE_INFO } from '../../../api/_lib/i18n/locales'
import { isNum, isStrong, plain, type Part } from '../../../api/_lib/i18n/parts'
import enEngine from '@/i18n/en/engine'
import enResults, { type WindowWhen } from '@/i18n/en/results'
import enVerdicts from '@/i18n/en/verdicts'
import { refText } from '@/i18n/messageRef'
import { holdNum, Rich } from '@/i18n/Rich'
import { currentLocale, msgs, useMsgs } from '@/i18n/runtime'
import { Button, Glyph, cx, prefersReducedMotion } from '@/ui/system'
import { Count } from './Count'
import { Paragraph } from './Text'
import { darkSentences, photosLine, radarSentence, zeroSentence, type Sentence } from './lib/copy'
import { VERDICTS, VERDICT_GLYPH, type Verdict } from './lib/meta'
import type { ResultsModel } from './model'
import { placeName } from './placeName'
import s from './results.module.css'

/** A window that ended more than an hour ago is described by its dates, not as "the last 7 days". */
export const isOldWindow = (model: ResultsModel) => model.report.windowEnd < Date.now() - 3_600_000

/**
 * The photo count can still grow: a partial report, or a final one whose weather mosaics are still being checked in
 * the background (PH-02: those patched "23 photos" to 27 and 28 after a definite paint). Reads "At least K" and
 * settles in place.
 */
export const countPending = (report: { partial?: boolean; lateChecks?: number }) => !!report.partial || (report.lateChecks ?? 0) > 0

/** Stagger slot for the handoff entrance (headline 0, hero 1, verdicts 2, notes 3 → 60 ms apart). */
export const enterStyle = (i: number) => ({ '--i': i }) as CSSProperties

/** The week, for the headline: the last N days, or (an older window) between its two days at the place. */
function windowWhen(model: ResultsModel): WindowWhen {
  const { report, windowDays, tz } = model
  if (isOldWindow(model)) return { fromMs: report.windowStart, toMs: report.windowEnd, timeZone: tz }
  return { lastDays: Math.round(windowDays) }
}

/** The namespaces a report note can point into (MessageRefs: src/i18n/messageRef.ts). */
const ENGINE = { engine: enEngine }

/** The headline's looks: its count in the display face's figures, the place in the serif. */
const HEADLINE = { num: s.numDisplay, accent: s.serif }

/** The headline's parts, in the active language (read at call time). */
function headlineParts(model: ResultsModel) {
  const m = msgs(enResults).headline
  const label = placeName(model.report.place)
  return model.head.flewOver === 0 ? m.none(label, isOldWindow(model)) : m.watched(model.head.flewOver, label, windowWhen(model))
}

/**
 * The headline sentence: "In the last 7 days, **256 satellites watched** *Waterloo*." (owner F, latest) `compact` is the phone
 * sheet header style. `enter` plays the line wipe of the results handoff (first appearance per report only).
 */
export function Headline({ model, compact = false, enter = false }: { model: ResultsModel; compact?: boolean; enter?: boolean }) {
  useMsgs(enResults)
  const cls = cx(compact ? s.mHeadline : s.headline, enter && s.enterWipe)
  return (
    // The overview's one top heading, as the hero is the landing's and the satellite's name a pass's: the three never
    // share the screen, so every view has one <h1> for a screen reader and a search engine to read it by. (Its looks
    // are all the class's.) Announced when it changes (the final report replacing the partial one), not on every render.
    <h1 className={cls} aria-live="polite" style={enterStyle(0)}>
      <Rich parts={headlineParts(model)} classes={HEADLINE} />
    </h1>
  )
}

/**
 * The second line: how many images were made public (owner F; one count: radar images and the geostationary watchers' frames included). When there are none, one plain sentence says
 * why (the sun, the archives' lag). An archive outage says so,
 * with Try again.
 *
 * `onShare`: Share rides at the end of this line (the week's summary: the headline's own numbers and the gallery's
 * first image). It is where the finding is read, on every layout, and takes no row of its own: a hairline button at
 * the summary's right edge, level with the line. Not offered when nothing watched the place, or while the archives
 * are down (Try again is the action then).
 */
export function MoreLine({
  model,
  compact = false,
  enter = false,
  onRetry,
  onShare,
}: {
  model: ResultsModel
  compact?: boolean
  enter?: boolean
  onRetry?: () => void
  onShare?: () => void
}) {
  const { head, report } = model
  const m = useMsgs(enResults)
  const past = isOldWindow(model)
  const share = !!onShare && head.flewOver > 0
  // With Share the row carries the entrance and the line's top margin, so the two enter (and sit) as one.
  const cls = cx(compact ? s.mMore : s.headlineMore, share ? s.moreInRow : enter && s.enter)
  const style = enterStyle(0.5)
  if (model.archiveFailed) {
    return (
      <div className={cx(s.outage, enter && s.enter)} style={style}>
        <p className={cx(compact ? s.mMore : s.headlineMore, s.moreProse)}>{m.archiveDown}</p>
        {onRetry ? (
          <Button variant="primary" onClick={onRetry} className={s.retry}>
            {m.tryAgain}
          </Button>
        ) : null}
      </div>
    )
  }
  const k = head.images
  const sentence = (
    <p className={cls} style={share ? undefined : style}>
      {k > 0 ? <PhotosCount k={k} partial={countPending(report)} /> : past ? m.noImages.thatWeek : m.noImages.thisWeek}
    </p>
  )
  const line = share ? (
    <div className={cx(s.moreRow, compact && s.mMoreRow, enter && s.enter)} style={style}>
      {sentence}
      <button type="button" className={s.weekShare} onClick={onShare} aria-label={m.shareWeekLabel(placeName(report.place), past)}>
        <Glyph name="share" size={12} />
        {m.share}
      </button>
    </div>
  ) : (
    sentence
  )
  if (k > 0) return line
  // No photo: one plain sentence on why (dark → the sun, and the infrared sweeps; else radar / geostationary / the reason).
  let why: Sentence[] | undefined
  if (head.zeroKind === 'dark') why = darkSentences(head)
  else if (head.radar && head.zeroKind !== 'unpublished') why = [radarSentence(head.radar)]
  else {
    const reason = zeroSentence(head)
    if (reason) why = [reason]
  }
  return (
    <>
      {line}
      {why ? <Paragraph sentences={why} className={cx(compact ? s.mWhy : s.why, enter && s.enter)} /> : null}
    </>
  )
}

/**
 * "27 images were made public." with the number set in the display face; partial → final settles in place. The
 * message's strong part is the "at least" words: always in the DOM, hidden once the count is final.
 *
 * <Count> is a box of its own (its crossfade lays the old digits over the new), and a line may break on either side of
 * such a box even against a no-break space: Russian's «Опубликовано 1 037 / снимков.» at 360 px. So the count and the
 * words a catalog ties to it share one nowrap span (holdNum); English ties nothing and renders as it always did.
 */
function PhotosCount({ k, partial }: { k: number; partial: boolean }) {
  const parts = useMsgs(enResults).imagesPublic(k)
  const piece = (p: Part, key: number) =>
    typeof p === 'string' ? (
      <Fragment key={key}>{p}</Fragment>
    ) : isStrong(p) ? (
      <span key={key} className={cx(s.atLeast, !partial && s.atLeastOff)} aria-hidden={!partial}>
        {plain(p.strong)}
      </span>
    ) : isNum(p) ? (
      <Count key={key} value={k} className={s.numDisplay} />
    ) : null
  const at = parts.findIndex(isNum)
  if (at < 0) return <>{parts.map(piece)}</>
  const { before, held, after } = holdNum(parts, at)
  return (
    <>
      {before.map(piece)}
      {held.length > 1 ? <span className={s.held}>{held.map(piece)}</span> : piece(held[0], at)}
      {after.map((p, i) => piece(p, at + 1 + i))}
    </>
  )
}

/** Summary readouts: one per verdict, with its unit, each jumping to its group in the list. */
export function Verdicts({ model, enter = false }: { model: ResultsModel; enter?: boolean }) {
  const { report } = model
  const m = useMsgs(enResults)
  const vm = useMsgs(enVerdicts)
  const counts = report.counts
  const jump = (v: Verdict) =>
    document.getElementById(`passes-${v}`)?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
  // The outline diamond is Sentinel-2 / Landsat geometry; when none are counted, 'likely' is weather.
  const likelyOptical = model.lanes.likely.passes.some((p) => model.meta(p.norad).category === 'open-optical')
  const glyph = (v: Verdict) => (v === 'likely' && !likelyOptical ? 'weather-leo' : VERDICT_GLYPH[v])
  return (
    <div className={cx(s.verdicts, enter && s.enter)} role="group" aria-label={m.verdictGroup} style={enterStyle(2)}>
      {VERDICTS.map((v, i) => {
        const value = counts[v]
        const words = vm[v]
        const tone = v === 'imaged' && value > 0 ? s.signal : value === 0 ? s.zero : undefined
        const defId = `verdict-def-${v}`
        return (
          <button
            key={v}
            type="button"
            className={s.verdict}
            onClick={() => jump(v)}
            disabled={value === 0}
            title={words.definition}
            aria-label={m.verdictReadout(value, v, words.title)}
            aria-describedby={defId}
          >
            <span className={cx(s.verdictTop, tone)}>
              <Glyph name={glyph(v)} size={12} color={v === 'imaged' && value > 0 ? 'var(--signal)' : undefined} />
              <Count value={value} countKey={`${report.windowEnd}:${v}`} delay={120 + i * 60} className={s.verdictValue} />
              <span className={s.verdictUnit}>{words.unit(value)}</span>
            </span>
            <span className={s.verdictLabel}>{words.title}</span>
            <span id={defId} className="sr-only">
              {words.definition}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/** Caveats in bone-3 mono: what was counted, and the report's own notes (outages etc.). */
export function Notes({ model, enter = false }: { model: ResultsModel; enter?: boolean }) {
  const { report, head } = model
  const m = useMsgs(enResults).notes
  // The report's notes are MessageRefs into 'engine' (or English text, in reports made before they were), worded here.
  useMsgs(enEngine)
  const counts = report.counts
  const notes = report.notes ?? []
  return (
    <div className={cx(s.notes, enter && s.enter)} style={enterStyle(3)}>
      {head.images > 0 ? (
        <p className={s.footnote}>
          <Rich
            parts={m.counted({
              detailed: head.detailed,
              mosaics: head.mosaics,
              radar: head.radarImages,
              geo: head.geoImages,
              passes: counts.passes,
              satellites: counts.satellitesConsidered,
            })}
            strongAs="b"
          />
        </p>
      ) : (
        <p className={s.footnote}>{m.checked(counts.passes, counts.satellitesConsidered)}</p>
      )}
      {notes.length ? (
        <ul className={s.notes}>
          {notes.map((n, i) => (
            <li key={i} className={s.footnote}>
              <span>{superscript(i + 1)}</span>
              <span>{refText(n, ENGINE)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

/** Plain-text headline + second line, for aria labels and share text (mirrors Headline / MoreLine), in the active language. */
export function headlineText(model: ResultsModel): string {
  const { head, report } = model
  const second = model.archiveFailed ? msgs(enResults).archiveDown : photosLine(head.images, { partial: countPending(report), past: isOldWindow(model) })
  return `${plain(headlineParts(model))}${LOCALE_INFO[currentLocale()].sentenceGap}${second}`
}

const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹'
const superscript = (n: number) => String(n).replace(/\d/g, (d) => SUP[Number(d)])
