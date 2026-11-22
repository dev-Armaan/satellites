/**
 * The computing readout, as the BODY of the one results panel (decision #10: the panel persists from
 * computing to results; only its contents change). The header (COMPUTING · T+1.84 S / place) is the
 * OverviewHeader in computing mode.
 *
 *   01  CATALOG · 16,912 OBJECTS                0.21 S  OK
 *   02  PROPAGATING ORBITS · 1,203 / 2,410      1.10 S  ▮
 *   03  SENTINEL-2 + LANDSAT ARCHIVES             —
 *   04  MATCH SCENES TO PASSES                    —
 *   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━──────────────  62%
 *
 * Reads `store.progress` (latest event only) through a subscription folded into a ref; a 10 Hz
 * clock repaints. Slow archives get an honest note after a few seconds. A shared link shows the
 * shared picture right away (R15), so the recipient sees it while their own report computes.
 *
 * Words: the 'results' namespace (computing), and the progress lines the engine and the controller write into the
 * store as MessageRefs ('engine.progress.*', 'app.progress.*'). The fold keeps the ref, never its text: each row is
 * worded when it is painted (refText, both namespaces), so a language switch mid-search rewords the rows.
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Rich } from '@/i18n/Rich'
import enApp from '@/i18n/en/app'
import enEngine from '@/i18n/en/engine'
import enResults, { type UtcWhen } from '@/i18n/en/results'
import { refText } from '@/i18n/messageRef'
import { msgs, useLocale, useMsgs } from '@/i18n/runtime'
import { gibsWmsUrl, pcCropUrl } from '@/imagery'
import { northInCropDeg } from '../../../api/_lib/toneRender'
import type { Share } from '@/lib/backend'
import { useApp } from '@/state/store'
import type { MessageRef, ProgressEvent } from '@/types'
import { shareCropUrl } from '@/ui/share'
import { cropSpec, displayUrl } from './lib/captures'
import { cx, fmtUtcTime } from '@/ui/system'
import { PushbroomReveal } from './PushbroomReveal'
import { markSeen } from './once'
import { fmtLocalTime } from './lib/time'
import s from './ComputingReadout.module.css'

type Stage = Exclude<ProgressEvent['stage'], 'done'>
const STAGES: readonly Stage[] = ['catalog', 'propagate', 'archive', 'match']
const ORDER: Record<ProgressEvent['stage'], number> = { catalog: 0, propagate: 1, archive: 2, match: 3, done: 4 }
/** The window the readout computes ahead (the engine's default) */
const WINDOW_DAYS = 7

/** Every namespace a progress line can point into: the controller's lines sit between the engine's. */
const PROGRESS = { app: enApp, engine: enEngine }

interface Line {
  /** The engine's or the controller's line for this step (worded when painted) */
  message?: string | MessageRef
  start?: number
  end?: number
}

/** A step's label before it starts (also what screen readers hear as it starts), in the active language. */
function idleLabel(stage: Stage): string {
  const m = msgs(enResults).computing.stages
  return stage === 'propagate' ? m.propagate.idle(WINDOW_DAYS) : m[stage].idle
}

const pad2 = (n: number) => String(n).padStart(2, '0')
/** A window end under the bar: the instant (its day is worded by the message, at UTC) and its UTC clock, "05:47" */
const utcWhen = (ms: number): UtcWhen => ({ ms, time: fmtUtcTime(ms, false) })
/** The window's words under the bar (the strong part: hidden on narrow phones) */
const WINDOW = { strong: s.windowWord }
/** "1.84 s": a step's duration, and the header's T+ clock (read at call time) */
export const secs = (ms: number) => msgs(enResults).computing.seconds(ms / 1000)

export function ComputingBody({ t0, tz }: { t0: number; tz?: string }) {
  const pending = useApp((st) => st.pendingWindow)
  const shared = useApp((st) => st.shared)
  const [fallbackEnd] = useState(() => Date.now())
  const windowEnd = pending?.[1] ?? fallbackEnd
  const [now, setNow] = useState(() => performance.now())
  const m = useMsgs(enResults)
  // What screen readers hear: the stage that is running, worded when shown ('start' until the engine speaks).
  const [announce, setAnnounce] = useState<Stage | 'start' | 'done'>('start')
  // Progress history lives in a ref, folded from a store subscription. The engine streams events from
  // worker messages (hundreds a second); rendering each one would be wasted work, so the 10 Hz clock
  // below is what repaints the readout.
  const hist = useRef<{ lines: Record<Stage, Line>; current: ProgressEvent['stage']; fraction: number; last?: ProgressEvent }>({
    lines: { catalog: {}, propagate: {}, archive: {}, match: {} },
    current: 'catalog',
    fraction: 0,
  })

  useEffect(() => {
    const fold = (e: ProgressEvent | undefined) => {
      const h = hist.current
      if (!e || e === h.last) return
      h.last = e
      const at = performance.now()
      const idx = ORDER[e.stage]
      h.current = e.stage
      for (const stage of STAGES) {
        const i = ORDER[stage]
        const l = h.lines[stage]
        if (i < idx) {
          l.start ??= at
          l.end ??= at
        } else if (i === idx) {
          l.start ??= at
          l.message = e.message
        }
      }
      if (e.fraction !== undefined) h.fraction = Math.max(h.fraction, e.fraction)
    }
    fold(useApp.getState().progress)
    // Once results land the readout freezes: a 10 Hz urgent re-render here would keep interrupting the
    // (transition) render of the results that replaces it.
    let id = 0
    const unsub = useApp.subscribe((st) => {
      fold(st.progress)
      if (st.phase !== 'computing' && id) {
        window.clearInterval(id)
        id = 0
      }
    })
    if (useApp.getState().phase === 'computing') id = window.setInterval(() => setNow(performance.now()), 100)
    // Screen readers hear the stage, at most once a second (the visual readout repaints at 10 Hz).
    let heard: Stage | 'start' | 'done' = 'start'
    const sayId = window.setInterval(() => {
      const h = hist.current
      const stage = h.current === 'done' ? 'done' : STAGES[Math.min(ORDER[h.current], STAGES.length - 1)]
      if (stage !== heard) {
        heard = stage
        setAnnounce(stage)
      }
    }, 1000)
    return () => {
      unsub()
      window.clearInterval(id)
      window.clearInterval(sayId)
    }
  }, [])

  // A row's height never shrinks while the search runs: its words wrap to a second line where they must (rowText), and
  // a row that flipped between one and two lines as its counter ticked ("· 9 / 403" → "· 288 / 403") or its line
  // changed moved the bar and everything under it. Each row keeps the tallest it has been, for this search and
  // language; a row that never wraps keeps its own height, to the fraction of a pixel.
  const list = useRef<HTMLOListElement>(null)
  const locale = useLocale()
  const tallest = useRef({ key: '', h: [] as number[] })
  useLayoutEffect(() => {
    const rows = list.current?.children
    if (!rows) return
    const key = `${t0}|${locale}`
    if (tallest.current.key !== key) {
      tallest.current = { key, h: [] }
      for (const row of rows) (row as HTMLElement).style.minHeight = ''
    }
    const h = tallest.current.h
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] as HTMLElement
      const now = row.getBoundingClientRect().height
      if (now > (h[i] ?? 0)) {
        h[i] = now
        row.style.minHeight = `${now}px`
      }
    }
  })

  const { lines, current } = hist.current
  const progress = hist.current.last
  const elapsed = now - t0
  const fraction = progress?.stage === 'done' ? 1 : hist.current.fraction
  const curIdx = ORDER[current]
  const slow = elapsed > 7000 && curIdx >= 2
  const verySlow = elapsed > 16000 && curIdx >= 2
  const c = m.computing

  return (
    <div className={s.body} role="status" aria-live="polite">
      <p className="sr-only">{announce === 'start' ? m.computingPasses : announce === 'done' ? c.ready : idleLabel(announce)}</p>
      {shared ? <SharedPicture tz={tz} /> : null}
      <div aria-hidden className={s.readout} data-readout>
        <ol ref={list} className={s.lines}>
          {STAGES.map((stage, i) => {
            const l = lines[stage]
            const state = i < curIdx ? 'done' : i === curIdx ? 'run' : 'idle'
            const dur = l.start !== undefined ? Math.max(0, (l.end ?? now) - l.start) : undefined
            // The engine's line once it has written one (an id no namespace knows reads as the step's own label).
            const written = state === 'idle' ? undefined : refText(l.message, PROGRESS)
            return (
              <li key={stage} className={cx(s.line, s[state])}>
                <span className={s.idx}>{pad2(i + 1)}</span>
                <span className={s.msg}>
                  {rowText(written ?? (state === 'done' ? c.stages[stage].done : idleLabel(stage)))}
                </span>
                <span className={s.dur}>{dur !== undefined && state !== 'idle' ? secs(dur) : '—'}</span>
                <span className={s.status}>{state === 'done' ? c.ok : state === 'run' ? <span className={s.caret} /> : ''}</span>
              </li>
            )
          })}
        </ol>

        <div className={s.bar}>
          <span className={s.fill} style={{ transform: `scaleX(${fraction.toFixed(4)})` }} />
          <span className={s.lead} style={{ transform: `translateX(calc(${(fraction * 100).toFixed(2)}cqw * var(--dir-x)))` }} />
        </div>
        <div className={s.foot}>
          <span>
            <Rich parts={c.window(WINDOW_DAYS, utcWhen(windowEnd - WINDOW_DAYS * 86_400_000), utcWhen(windowEnd))} classes={WINDOW} strongAs="span" />
          </span>
          <span className={s.pct}>{c.percent(Math.round(fraction * 100))}</span>
        </div>
      </div>

      {slow ? (
        <p className={s.note}>{verySlow ? c.verySlow : c.slow}</p>
      ) : null}
    </div>
  )
}

/** Every progress line puts its counter after its last ' · ' ("PROPAGATING ORBITS · 288 / 403", engine.ts). */
const COUNTER_SEP = ' · '
/** Longer than this, what follows the dot is a phrase ("Abgleich · 120 Szenen mit 2.410 Überflügen"), and it wraps. */
const COUNTER_MAX = 20

/**
 * A row's words, then its counter, unbroken. The words wrap (a second line rather than an ellipsis, which cut the
 * counter first: "VERIFYING NASA WEATHER MOSAICS · 12 / 3…"); the counter never breaks, so the numbers that tick stay
 * whole, and no line starts with its dot: the last word comes down with it. A word joiner after each of the counter's
 * spaces does it in the one text node the row always was (a span of its own moved its glyphs a quarter pixel).
 */
export function rowText(text: string): string {
  const at = text.lastIndexOf(COUNTER_SEP)
  if (at <= 0 || text.length - at > COUNTER_MAX) return text
  return text.slice(0, at) + text.slice(at).replace(/ /g, ' \u2060')
}

/**
 * The shared picture's crop URL: the share package's builder (SH1), or the same crop built here from
 * the share's archive item while that export is still a stub.
 */
function sharedImageUrl(share: Share): string | undefined {
  const fromShare = shareCropUrl(share)
  if (fromShare) return fromShare
  const c = share.capture
  if (!c) return undefined
  const at = { lat: share.lat, lon: share.lon }
  const spec = cropSpec(c.collection)
  if (c.collection === 'sentinel-2-l2a' || c.collection === 'landsat-c2-l2')
    return displayUrl({ cropUrl: (o) => pcCropUrl(c.collection as 'sentinel-2-l2a' | 'landsat-c2-l2', c.itemId, at, o) }, spec)
  const [layer, time] = c.itemId.split('@')
  return layer && time ? gibsWmsUrl(layer, time, at, spec) : undefined
}

/** A shared link's picture, shown at once while the recipient's own report computes. */
function SharedPicture({ tz }: { tz?: string }) {
  const shared = useApp((st) => st.shared)
  const c = useMsgs(enResults).computing
  const itemId = shared?.capture?.itemId
  // PassDetail will not replay the reveal for this capture when the report lands.
  useEffect(() => {
    if (itemId) markSeen(`capture:${itemId}`)
  }, [itemId])
  if (!shared?.capture) return null
  // The pass view's own crop (R3-1: one URL per capture and size): when the recipient's report lands, the pass view
  // shows this very image, decoded already, from the one request.
  const url = sharedImageUrl(shared)
  if (!url) return null
  // No name in the share: the messages say "a satellite" their own way (nothing English is carried).
  const sat = shared.satName
  const t = shared.tClosest
  const when = t !== undefined && tz ? { ms: t, timeZone: tz, time: fmtLocalTime(t, tz) } : undefined
  return (
    <div className={s.shared}>
      <PushbroomReveal
        src={url}
        view="shared"
        headingDeg={(shared.pass?.headingDeg ?? 180) + northInCropDeg(url)}
        lines={cropSpec(shared.capture.collection).px}
        alt={c.sharedAlt(sat, shared.placeLabel)}
        startAt="now"
        frameClassName={s.sharedFrame}
      />
      <p className={s.sharedCaption}>
        <Rich parts={c.sharedCaption(sat, shared.placeLabel, when)} strongAs="b" />
      </p>
    </div>
  )
}
