/**
 * The time-lapse: the same ten kilometres around the place, one clear Sentinel-2 photo a year, played as a loop. A full-viewport ink layer over the results and the photo viewer,
 * a portal on <body> like them.
 *
 * Why it looks the way it does:
 *
 *  - It is opened on purpose and takes 8–12 s to gather (imagery/timelapse.ts), so the wait is a screen of its own
 *    (owner, 2026-11-13: not a dead panel): the Watched wordmark with its full stop breathing, as on the boot
 *    screen; a scan line sweeping the frame, the way the sensor reads the ground; what is being done, with its
 *    count; and a strip with a cell for every year, each developing its own small picture the moment it lands.
 *    The big picture waits until all are in and decoded: frames arriving out of order at full size would be a
 *    slideshow of flashes, and a photo never flickers here. Each small one appears once and stays.
 *  - A step is a dissolve of the new frame OVER the last one (which stays opaque under it), so the picture never
 *    dips toward the ink between two frames. Opacity only, on the compositor.
 *  - The time line is true to scale: each tick sits at its frame's real date, so a year with no clear look is a
 *    visible gap, not a hidden one. The big readout is the frame's own year, with its date and satellite.
 *  - The loop can be kept: `Video` renders it to an MP4 in the browser (./video.ts, fetched on that press) and a
 *    second press saves or shares the file.
 *  - Drag across the picture to scrub (right is later, as on the time line under it), tap to play or pause; the
 *    keys do the same (Space, ← →, Home, End). Reduced motion: nothing plays by itself and steps are cuts.
 *
 * It owns Esc (capture phase, preventDefault) and a back-stack layer, and follows the overlay contract
 * (<html data-overlay="timelapse">) so the globe rests under it.
 *
 * Its words are the `timelapse` namespace (src/i18n/en/timelapse.ts), dates passed to it as numbers so each language
 * writes its own; only the Copernicus licence credit stays English here, as the data policy words it.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import enTimelapse from '@/i18n/en/timelapse'
import enSystem from '@/i18n/en/system'
import { msgs, useMsgs } from '@/i18n/runtime'
import { ARCHIVE_START, FRAME_HALF_KM, MIN_FRAMES, type Frame, type Timelapse as TimelapseData } from '@/imagery/timelapse'
import { useBackLayer } from '@/lib/backStack'
import { track } from '@/lib/telemetry'
import type { TimelapseFrom } from '@/state/timelapse'
import { Reticle } from '@/ui/results/Reticle'
import { Button, Glyph, Kbd, cx, useReducedMotion } from '@/ui/system'
import { WORDMARK_BOX, WORDMARK_DOT, WORDMARK_PATH } from '../../../api/_lib/wordmark'
import { timelapseLink } from './link'
import { useTimelapseRun, type RunState } from './run'
import s from './Timelapse.module.css'

/** How long a frame is held before the next one starts to dissolve in, ms; the last frame of a loop rests longer. */
const HOLD_MS = 1250
const LAST_HOLD_MS = 2800
/** A press that moves less than this is a tap (play / pause), not a scrub. */
const TAP_SLOP_PX = 8
/** Two year labels on the time line closer than this share of its width would run into each other. */
const MIN_LABEL_GAP = 0.1
/** The archive's first year, which the copy names ("since 2015"). */
const SINCE = new Date(ARCHIVE_START).getUTCFullYear()

type Msgs = typeof enTimelapse

const yearOf = (date: string) => date.slice(0, 4)
/** A frame's local calendar day ("YYYY-MM-DD") as the catalog takes dates: its UTC midnight, ms (a date-only ISO
 * string parses as UTC). */
const dayMs = (date: string) => Date.parse(date)
/** "2015–2026", or the one year when every frame is from it (the licence credit's years, which stays English). */
const yearSpan = (frames: readonly Frame[]) => {
  const a = yearOf(frames[0].date)
  const b = yearOf(frames[frames.length - 1].date)
  return a === b ? a : `${a}–${b}`
}

export interface TimelapseProps {
  /** `label` as shown; `canonicalLabel`: a curated place's English name, which the share link carries */
  place: { label: string; canonicalLabel?: string; lat: number; lon: number }
  from: TimelapseFrom
  mobile: boolean
  onClose: () => void
}

export function Timelapse(props: TimelapseProps) {
  return createPortal(<Player {...props} />, document.body)
}

function Player({ place, from, mobile, onClose }: TimelapseProps) {
  const m = useMsgs(enTimelapse)
  const rootRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const reduced = useReducedMotion()
  const [attempt, setAttempt] = useState(0)
  // Phones play 640 px frames (1.3 MB a loop); a laptop's larger picture takes the scene's own 10 m pixels.
  const run = useTimelapseRun(place, mobile ? 640 : 1000, attempt)
  const data = run.phase === 'ready' ? run.timelapse : undefined
  const frames = data?.frames
  const n = frames?.length ?? 0

  const [at, setAt] = useState({ i: 0, under: -1 })
  const [playing, setPlaying] = useState(!reduced)
  const [scrubbing, setScrubbing] = useState(false)
  const i = Math.min(at.i, Math.max(0, n - 1))

  const go = useCallback((to: number | ((cur: number) => number)) => {
    setAt((cur) => {
      const next = typeof to === 'function' ? to(cur.i) : to
      return next === cur.i ? cur : { i: next, under: cur.i }
    })
  }, [])

  // A new set of frames starts from its first.
  useEffect(() => {
    setAt({ i: 0, under: -1 })
    setPlaying(!reduced)
  }, [data, reduced])

  // The loop: hold, step, and rest on the last frame before starting again.
  useEffect(() => {
    if (!playing || n < 2 || scrubbing) return
    const timer = setTimeout(() => go((cur) => (cur + 1) % n), i === n - 1 ? LAST_HOLD_MS : HOLD_MS)
    return () => clearTimeout(timer)
  }, [playing, scrubbing, i, n, go])

  const step = useCallback(
    (d: number) => {
      setPlaying(false)
      go((cur) => Math.min(Math.max(0, n - 1), Math.max(0, cur + d)))
    },
    [go, n],
  )
  const jump = useCallback(
    (to: number) => {
      setPlaying(false)
      go(to)
    },
    [go],
  )

  useBackLayer('timelapse', true, () => onCloseRef.current())

  useEffect(() => track('timelapse_open', { from }), []) // eslint-disable-line react-hooks/exhaustive-deps

  // The overlay contract: the globe rests while this covers it; a layer that was already up gets its value back.
  useLayoutEffect(() => {
    const root = document.documentElement
    const prev = root.dataset.overlay
    root.dataset.overlay = 'timelapse'
    return () => {
      if (root.dataset.overlay !== 'timelapse') return
      if (prev) root.dataset.overlay = prev
      else delete root.dataset.overlay
    }
  }, [])

  // Focus in on open, back where it was on close.
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    rootRef.current?.focus({ preventScroll: true })
    return () => {
      if (prev && prev.isConnected) prev.focus({ preventScroll: true })
    }
  }, [])

  // A modal owns the keyboard (capture phase, before the viewer and the app under it). Keys held with a modifier
  // are the browser's (find, zoom, back) and pass through untouched.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const root = rootRef.current
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onCloseRef.current()
        return
      }
      e.stopPropagation()
      if (e.key === 'Tab') {
        if (!root) return
        const focusables = [...root.querySelectorAll<HTMLElement>('button:not([disabled]), [tabindex]:not([tabindex="-1"])')].filter((el) => el.offsetParent !== null)
        if (!focusables.length) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && (document.activeElement === first || document.activeElement === root)) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        } else if (!root.contains(document.activeElement)) {
          e.preventDefault()
          first.focus()
        }
        return
      }
      if (n < 2) return
      // Space on a focused button presses that button; anywhere else it plays or pauses.
      const onButton = (e.target as HTMLElement | null)?.closest?.('button')
      if (e.key === ' ' && !onButton) {
        e.preventDefault()
        setPlaying((p) => !p)
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault()
        step(e.key === 'ArrowRight' ? 1 : -1)
      } else if (e.key === 'Home' || e.key === 'End') {
        e.preventDefault()
        jump(e.key === 'Home' ? 0 : n - 1)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [n, step, jump])

  const frame = frames?.[i]

  const tools = (
    <div className={s.tools}>
      <CopyLink place={place} ready={!!data} />
      {frames && canEncodeVideo() ? <VideoButton key={frames[0].src} frames={frames} place={place} mobile={mobile} onStart={() => setPlaying(false)} /> : null}
    </div>
  )
  const note = (
    <p className={s.note}>
      {/* A single-season loop (war zones, glaciers) must not say the years turn through the seasons. */}
      {frame ? <span className={s.noteText}>{data?.season ? m.noteOneSeason(FRAME_HALF_KM * 2) : m.note(FRAME_HALF_KM * 2)}</span> : null}
      {/* The licence credit stays as the Copernicus data policy words it, in English, in every language. */}
      <span className={s.credit} lang={frames?.length ? 'en' : undefined}>
        {frames?.length ? `Contains modified Copernicus Sentinel data ${yearSpan(frames)}` : m.source}
      </span>
    </p>
  )
  return (
    <div ref={rootRef} className={cx(s.overlay, mobile && s.mobile, reduced && s.reduced)} role="dialog" aria-modal="true" aria-label={m.dialog(place.label)} tabIndex={-1}>
      <header className={s.bar}>
        <span className={s.barLabel}>
          {`${m.title} `}
          <span className={s.dim}>/ </span>
          <span className={s.place}>{place.label}</span>
        </span>
        <button type="button" className={s.close} onClick={onClose} aria-label={m.close} aria-keyshortcuts="Escape">
          <span className={s.closeText}>{m.close}</span>
          <Kbd className={s.closeKbd}>{m.escKey}</Kbd>
          <Glyph name="close" size={14} />
        </button>
      </header>

      <div className={s.body}>
        <div className={s.main}>
          <Stage frames={frames} i={i} under={at.under} run={run} scrubbing={scrubbing} onScrub={setScrubbing} onTap={() => n > 1 && setPlaying((p) => !p)} onJump={jump} onRetry={() => setAttempt((a) => a + 1)} />

          <div className={s.controls}>
            <button type="button" className={s.play} onClick={() => setPlaying((p) => !p)} disabled={n < 2} aria-label={playing ? m.pause : m.play} aria-keyshortcuts="Space">
              <Glyph name={playing && n > 1 ? 'pause' : 'play'} size={14} />
            </button>
            <Scrubber run={run} i={i} onJump={jump} onScrub={setScrubbing} />
          </div>

          <p className={s.caption} aria-live="polite">
            {caption(run, data, m)}
          </p>
          {mobile ? tools : null}
          {mobile ? note : null}
        </div>

        {!mobile ? (
          <aside className={s.side}>
            {tools}
            {frames ? (
              <ol className={s.log} aria-label={m.frameList}>
                {frames.map((f, k) => (
                  <li key={f.scene.id}>
                    <button type="button" className={s.logRow} aria-current={k === i || undefined} onClick={() => jump(k)}>
                      <span className={s.logYear}>{yearOf(f.date)}</span>
                      <span className={s.logDate}>{m.dayMonth(dayMs(f.date))}</span>
                      <span className={s.logSat}>{f.scene.platform.replace('Sentinel-', 'S')}</span>
                    </button>
                  </li>
                ))}
              </ol>
            ) : (
              <div className={s.logEmpty} />
            )}
            {note}
          </aside>
        ) : null}
      </div>
    </div>
  )
}

/** One line under the time line: what is on screen, or what the instrument is doing. */
function caption(run: RunState, data: TimelapseData | undefined, m: Msgs): string {
  // A war zone's frames are all of one season (seasonRegions.ts): say which, so the change reads as the war's.
  if (data) return data.season ? m.captionSeason(data.frames.length, data.season) : m.captionYearly(data.frames.length)
  if (run.phase === 'short') return m.captionShort
  if (run.phase === 'error') return m.captionError
  return m.captionGathering(SINCE)
}

// ── The picture ────────────────────────────────────────────────────────────────────────────

interface StageProps {
  frames: Frame[] | undefined
  i: number
  under: number
  run: RunState
  scrubbing: boolean
  onScrub: (on: boolean) => void
  onTap: () => void
  onJump: (to: number) => void
  onRetry: () => void
}

function Stage({ frames, i, under, run, scrubbing, onScrub, onTap, onJump, onRetry }: StageProps) {
  const m = useMsgs(enTimelapse)
  const sys = useMsgs(enSystem)
  const drag = useRef<{ x: number; from: number; moved: boolean; id: number } | null>(null)
  const n = frames?.length ?? 0
  const frame = frames?.[i]
  // The frame badge, "03 / 12" (its lead set brighter); in Vietnamese "3 trên 12", never date-like beside the day.
  const [countLead, countTail] = sys.counter(i + 1, n, 2)

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!n || (e.pointerType === 'mouse' && e.button !== 0)) return
    drag.current = { x: e.clientX, from: i, moved: false, id: e.pointerId }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    const dx = e.clientX - d.x
    if (!d.moved && Math.abs(dx) < TAP_SLOP_PX) return
    if (!d.moved) {
      d.moved = true
      onScrub(true)
    }
    // The whole loop under about two thirds of the picture's width, however many frames it has.
    const per = Math.max(14, (e.currentTarget.clientWidth * 0.66) / Math.max(1, n - 1))
    onJump(Math.min(n - 1, Math.max(0, d.from + Math.round(dx / per))))
  }
  const end = (e: React.PointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    drag.current = null
    if (d.moved) onScrub(false)
    else if (!cancelled) onTap()
  }

  return (
    <div
      className={cx(s.stage, frames && s.live, scrubbing && s.scrubbing)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(e) => end(e, false)}
      onPointerCancel={(e) => end(e, true)}
    >
      {frames?.map((f, k) => (
        <img key={f.scene.id} className={cx(s.frame, k === i && s.on, k === under && s.below)} src={f.src} alt="" draggable={false} decoding="async" />
      ))}
      {frame ? (
        <>
          <Reticle size={34} className={s.reticle} />
          <div className={s.readout} aria-live="off">
            <span className={s.big}>{yearOf(frame.date)}</span>
            <span className={s.small}>{m.readout(dayMs(frame.date), frame.scene.platform)}</span>
          </div>
          <span className={s.count}>
            <span className={s.countLead}>{countLead}</span>
            {countTail}
          </span>
          {/* What a screen reader hears: the frame on view, when it changes by hand (not on every played step). */}
          <span className={s.srOnly} aria-live="polite">
            {scrubbing ? '' : m.frameSpoken(i + 1, n, dayMs(frame.date))}
          </span>
        </>
      ) : (
        <Waiting run={run} onRetry={onRetry} />
      )}
    </div>
  )
}

/** The stage before there is a picture: what is being done, in counts, with a hairline bar; or why there is none. */
function Waiting({ run, onRetry }: { run: RunState; onRetry: () => void }) {
  const m = useMsgs(enTimelapse)
  const sys = useMsgs(enSystem)
  if (run.phase === 'short') {
    return (
      <div className={s.wait}>
        <div className={s.waitPanel}>
          <p className={s.waitHead}>{m.tooCloudy}</p>
          <p className={s.waitLine}>{m.tooFew(run.frames, SINCE, MIN_FRAMES)}</p>
        </div>
      </div>
    )
  }
  if (run.phase === 'error') {
    return (
      <div className={s.wait}>
        <div className={s.waitPanel}>
          <p className={s.waitHead}>{m.noAnswer}</p>
          <p className={s.waitLine}>{m.unreachable}</p>
          <Button size="sm" onClick={onRetry} onPointerDown={(e) => e.stopPropagation()} className={s.retry}>
            {m.retry}
          </Button>
        </div>
      </div>
    )
  }
  // Three steps; the bar fills across all of them.
  const step = run.phase === 'listing' ? 0 : run.phase === 'choosing' ? 1 : 2
  const part = run.phase === 'choosing' ? run.done / Math.max(1, run.total) : run.phase === 'loading' ? run.loaded / Math.max(1, run.dates.length) : 0
  const status = run.phase === 'listing' ? m.listing : run.phase === 'choosing' ? m.choosing : m.developing
  const progress = run.phase === 'choosing' ? { done: run.done, total: run.total } : run.phase === 'loading' ? { done: run.loaded, total: run.dates.length } : undefined
  const count = progress ? sys.counter(progress.done, progress.total, 2).join('') : ''
  // What a screen reader hears: the step and its count as one sentence per step (each language says it whole).
  const name = !progress ? status : run.phase === 'choosing' ? m.choosingProgress(progress.done, progress.total) : m.developingProgress(progress.done, progress.total)
  // The strip: a cell for every year asked about, then for every frame chosen, each taking its picture as it lands.
  const cells: { key: string; year?: string; src?: string }[] =
    run.phase === 'loading' ? run.dates.map((d) => ({ key: `f${d.t}`, year: d.date.slice(2, 4), src: d.src })) : run.phase === 'choosing' ? Array.from({ length: run.total }, (_, k) => ({ key: `s${k}` })) : []
  return (
    <div className={s.wait} role="status" aria-label={name}>
      <span className={s.scan} aria-hidden />
      <div className={s.mark}>
        <svg className={s.word} viewBox={WORDMARK_BOX.join(' ')} aria-hidden focusable="false">
          <path d={WORDMARK_PATH} fill="currentColor" />
          <circle className={s.wordDot} cx={WORDMARK_DOT.cx} cy={WORDMARK_DOT.cy} r={WORDMARK_DOT.r} />
        </svg>
        <span className={s.status}>
          <span>{status}</span>
          <span className={s.statusCount}>{count}</span>
        </span>
        <span className={s.progress} aria-hidden>
          <span className={s.progressFill} style={{ transform: `scaleX(${(step + part) / 3})` }} />
        </span>
      </div>
      <div className={s.strip} aria-hidden style={{ gridTemplateColumns: `repeat(${Math.max(1, cells.length)}, minmax(0, 1fr))` }}>
        {cells.map((c) => (
          <span key={c.key} className={s.cell}>
            <span className={s.cellBox}>{c.src ? <img className={s.cellImg} src={c.src} alt="" draggable={false} decoding="async" /> : null}</span>
            <span className={cx(s.cellYear, c.src && s.cellYearLit)}>{c.year ?? ''}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

// ── The time line ──────────────────────────────────────────────────────────────────────────

interface Tick {
  key: string
  date: string
  t: number
  lit: boolean
}

function Scrubber({ run, i, onJump, onScrub }: { run: RunState; i: number; onJump: (to: number) => void; onScrub: (on: boolean) => void }) {
  const m = useMsgs(enTimelapse)
  const ref = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const ticks = useMemo<Tick[]>(() => {
    if (run.phase === 'ready') return run.timelapse.frames.map((f) => ({ key: f.scene.id, date: f.date, t: f.scene.t, lit: true }))
    if (run.phase === 'loading') return run.dates.map((d, k) => ({ key: `${d.t}`, date: d.date, t: d.t, lit: k < run.loaded }))
    return []
  }, [run])
  const live = run.phase === 'ready'
  const t0 = ticks[0]?.t ?? 0
  const span = Math.max(1, (ticks[ticks.length - 1]?.t ?? 1) - t0)
  const pos = (t: number) => (ticks.length > 1 ? (t - t0) / span : 0.5)

  const nearest = (clientX: number) => {
    const el = ref.current
    if (!el || !ticks.length) return 0
    const r = el.getBoundingClientRect()
    const f = Math.min(1, Math.max(0, (clientX - r.left) / Math.max(1, r.width)))
    let best = 0
    ticks.forEach((tk, k) => {
      if (Math.abs(pos(tk.t) - f) < Math.abs(pos(ticks[best].t) - f)) best = k
    })
    return best
  }

  // Years get their two digits under each tick. The frames turn through the seasons, so two can sit a few weeks
  // apart across New Year: a year that would run into the one before it goes above the line instead (owner,
  // 2026-11-13: never left out), and only one that fits on neither side is dropped.
  const labelled = ticks.length <= 14
  const side = new Map<number, 'below' | 'above'>()
  let below = -1
  let above = -1
  ticks.forEach((tk, k) => {
    const at = pos(tk.t)
    if (below < 0 || at - below >= MIN_LABEL_GAP) {
      side.set(k, 'below')
      below = at
    } else if (above < 0 || at - above >= MIN_LABEL_GAP) {
      side.set(k, 'above')
      above = at
    }
  })
  return (
    <div className={s.scrubWrap}>
      <div
        ref={ref}
        className={cx(s.scrub, live && s.scrubLive)}
        role="slider"
        tabIndex={live ? 0 : -1}
        aria-label={m.slider}
        aria-valuemin={1}
        aria-valuemax={Math.max(1, ticks.length)}
        aria-valuenow={live ? i + 1 : undefined}
        aria-valuetext={live && ticks[i] ? m.date(dayMs(ticks[i].date)) : undefined}
        aria-disabled={!live || undefined}
        onPointerDown={(e) => {
          if (!live) return
          dragging.current = true
          e.currentTarget.setPointerCapture?.(e.pointerId)
          onScrub(true)
          onJump(nearest(e.clientX))
        }}
        onPointerMove={(e) => dragging.current && onJump(nearest(e.clientX))}
        onPointerUp={() => {
          if (dragging.current) onScrub(false)
          dragging.current = false
        }}
        onPointerCancel={() => {
          if (dragging.current) onScrub(false)
          dragging.current = false
        }}
      >
        <span className={s.rail} />
        {ticks.map((tk, k) => (
          <span key={tk.key} className={cx(s.tick, tk.lit && s.tickLit, live && k === i && s.tickOn)} style={{ left: `${pos(tk.t) * 100}%` }}>
            {labelled && side.has(k) ? <span className={cx(s.tickLabel, side.get(k) === 'above' && s.tickLabelUp)}>{tk.date.slice(2, 4)}</span> : null}
          </span>
        ))}
      </div>
      {!labelled && ticks.length > 1 ? (
        <div className={s.ends}>
          <span>{m.date(dayMs(ticks[0].date))}</span>
          <span>{m.date(dayMs(ticks[ticks.length - 1].date))}</span>
        </div>
      ) : null}
    </div>
  )
}

// ── The link ───────────────────────────────────────────────────────────────────────────────

function CopyLink({ place, ready }: { place: TimelapseProps['place']; ready: boolean }) {
  const m = useMsgs(enTimelapse)
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 1800)
    return () => clearTimeout(timer)
  }, [copied])
  const press = () => {
    const url = timelapseLink(location.origin, place)
    track('timelapse_share', { action: 'link' })
    // A phone's own share sheet when it has one (called inside the press, as Safari requires); else the clipboard.
    const coarse = window.matchMedia?.('(pointer: coarse)').matches
    if (coarse && typeof navigator.share === 'function') {
      navigator.share({ title: m.shareTitle(place.label), url }).catch(() => undefined)
      return
    }
    const done = () => setCopied(true)
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(url).then(done, () => undefined)
  }
  return (
    <Button size="sm" onClick={press} disabled={!ready} aria-live="polite" className={s.copy}>
      <Glyph name="share" size={11} />
      {copied ? m.linkCopied : m.share}
    </Button>
  )
}

// ── The video ──────────────────────────────────────────────────────────────────────────────

/** Is there an encoder to ask? (Which codec it takes is settled when the video is made: ./video.ts.) */
const canEncodeVideo = () => typeof VideoEncoder === 'function' && typeof VideoFrame === 'function'

type VideoState = { phase: 'idle' } | { phase: 'busy'; done: number } | { phase: 'ready'; file: File; everywhere: boolean } | { phase: 'failed' }

/**
 * The loop as a file. Two presses on purpose: the first makes it (a few seconds, with its progress on the button),
 * the second saves or shares it. A browser only lets a page open the share sheet or start a download inside a press,
 * and the press that started the rendering is long over by the time the file exists.
 */
function VideoButton({ frames, place, mobile, onStart }: { frames: Frame[]; place: TimelapseProps['place']; mobile: boolean; onStart: () => void }) {
  const m = useMsgs(enTimelapse)
  const [state, setState] = useState<VideoState>({ phase: 'idle' })
  const abort = useRef<AbortController | null>(null)
  useEffect(() => () => abort.current?.abort(), [])
  useEffect(() => {
    if (state.phase !== 'failed') return
    const timer = setTimeout(() => setState({ phase: 'idle' }), 2400)
    return () => clearTimeout(timer)
  }, [state.phase])

  const make = async () => {
    onStart()
    const ctl = new AbortController()
    abort.current = ctl
    setState({ phase: 'busy', done: 0 })
    try {
      const { renderVideo, videoFileName } = await import('./video')
      // A phone's frames are 640 px: 720 keeps them honest. A laptop's are the scene's own 1000.
      const words = msgs(enTimelapse) // read now, in the language of the press
      const v = await renderVideo(frames, { side: mobile ? 720 : 1080, place: place.label, words, signal: ctl.signal, onProgress: (done) => !ctl.signal.aborted && setState({ phase: 'busy', done }) })
      if (ctl.signal.aborted) return
      setState({ phase: 'ready', file: new File([v.blob], videoFileName(place.label, frames, msgs(enTimelapse).fileNamePlace), { type: 'video/mp4' }), everywhere: v.codec === 'avc' })
    } catch (err) {
      if (ctl.signal.aborted) return
      console.error(err)
      setState({ phase: 'failed' })
    }
  }

  const save = (file: File) => {
    track('timelapse_share', { action: 'video' })
    const coarse = window.matchMedia?.('(pointer: coarse)').matches
    if (coarse && navigator.canShare?.({ files: [file] })) {
      navigator.share({ files: [file], title: m.shareTitle(place.label) }).catch(() => undefined)
      return
    }
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

  if (state.phase === 'ready') {
    return (
      <Button size="sm" variant="primary" onClick={() => save(state.file)} className={s.video} title={state.everywhere ? undefined : m.noH264}>
        <Glyph name="download" size={11} />
        {m.saveVideo}
      </Button>
    )
  }
  const busy = state.phase === 'busy'
  return (
    <Button size="sm" onClick={make} disabled={busy} aria-live="polite" className={cx(s.video, busy && s.videoBusy)} style={busy ? ({ '--done': state.done } as CSSProperties) : undefined}>
      {busy ? (
        <span className={s.videoPct}>{m.rendering(Math.min(99, Math.round(state.done * 100)))}</span>
      ) : (
        <>
          <Glyph name="play" size={10} />
          {state.phase === 'failed' ? m.videoFailed : m.video}
        </>
      )}
    </Button>
  )
}
