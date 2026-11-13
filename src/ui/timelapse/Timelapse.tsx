/**
 * The time-lapse: the same ten kilometres around the place, one clear Sentinel-2 photo a year (or the last twelve
 * months, a few weeks apart), played as a loop. A full-viewport ink layer over the results and the photo viewer,
 * a portal on <body> like them.
 *
 * Why it looks the way it does:
 *
 *  - It is opened on purpose and takes 8–10 s to gather (imagery/timelapse.ts), so the wait is the instrument at
 *    work: what it is doing in words and counts, and the time line's ticks arriving as each frame is chosen and
 *    lighting as its picture lands. No picture shows until all are in and decoded: frames arriving out of order
 *    would be a slideshow of flashes, and a photo never flickers here.
 *  - A step is a dissolve of the new frame OVER the last one (which stays opaque under it), so the picture never
 *    dips toward the ink between two frames. Opacity only, on the compositor.
 *  - The time line is true to scale: each tick sits at its frame's real date, so a year with no clear look is a
 *    visible gap, not a hidden one. The big readout is the frame's own year (or month), with its date and satellite.
 *  - Drag across the picture to scrub (right is later, as on the time line under it), tap to play or pause; the
 *    keys do the same (Space, ← →, Home, End). Reduced motion: nothing plays by itself and steps are cuts.
 *
 * It owns Esc (capture phase, preventDefault) and a back-stack layer, and follows the overlay contract
 * (<html data-overlay="timelapse">) so the globe rests under it.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { FRAME_HALF_KM, type Frame, type Timelapse as TimelapseData, type TimelapseMode } from '@/imagery/timelapse'
import { useBackLayer } from '@/lib/backStack'
import { track } from '@/lib/telemetry'
import type { TimelapseFrom } from '@/state/timelapse'
import { Reticle } from '@/ui/results/Reticle'
import { Button, Glyph, Kbd, cx, useReducedMotion } from '@/ui/system'
import { timelapseLink } from './link'
import { useTimelapseRun, type RunState } from './run'
import s from './Timelapse.module.css'

/** How long a frame is held before the next one starts to dissolve in, ms; the last frame of a loop rests longer. */
const HOLD_MS: Record<TimelapseMode, number> = { years: 1250, seasons: 1000 }
const LAST_HOLD_MS = 2800
/** A press that moves less than this is a tap (play / pause), not a scrub. */
const TAP_SLOP_PX = 8
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const TROPIC_LAT = 23.5

const yearOf = (date: string) => date.slice(0, 4)
const monthOf = (date: string) => MONTHS[Number(date.slice(5, 7)) - 1]
const fmtDate = (date: string) => `${Number(date.slice(8, 10))} ${monthOf(date)} ${yearOf(date)}`
const pad2 = (n: number) => String(n).padStart(2, '0')

export interface TimelapseProps {
  place: { label: string; lat: number; lon: number }
  mode: TimelapseMode
  from: TimelapseFrom
  mobile: boolean
  onMode: (mode: TimelapseMode) => void
  onClose: () => void
}

export function Timelapse(props: TimelapseProps) {
  return createPortal(<Player {...props} />, document.body)
}

function Player({ place, mode, from, mobile, onMode, onClose }: TimelapseProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const reduced = useReducedMotion()
  const [attempt, setAttempt] = useState(0)
  // Phones play 640 px frames (1.3 MB a loop); a laptop's larger picture takes the scene's own 10 m pixels.
  const run = useTimelapseRun(place, mode, mobile ? 640 : 1000, attempt)
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
    const timer = setTimeout(() => go((cur) => (cur + 1) % n), i === n - 1 ? LAST_HOLD_MS : HOLD_MS[mode])
    return () => clearTimeout(timer)
  }, [playing, scrubbing, i, n, mode, go])

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

  useEffect(() => track('timelapse_open', { mode, from }), []) // eslint-disable-line react-hooks/exhaustive-deps

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
  const seasons = Math.abs(place.lat) >= TROPIC_LAT

  const tools = (
    <div className={s.tools}>
      {seasons ? (
        <span className={s.modes} role="group" aria-label="Which time-lapse">
          <button type="button" className={s.mode} aria-pressed={mode === 'years'} onClick={() => onMode('years')}>
            Years
          </button>
          <button type="button" className={s.mode} aria-pressed={mode === 'seasons'} onClick={() => onMode('seasons')}>
            Seasons
          </button>
        </span>
      ) : null}
      <CopyLink place={place} mode={mode} />
    </div>
  )
  const note = (
    <p className={s.note}>
      {frame ? (
        <>
          Each frame is the same {FRAME_HALF_KM * 2} km square, taken by Sentinel-2 and toned like every photo here.{' '}
          {mode === 'years' ? 'A year with no clear look is left out.' : 'Weeks with no clear look are left out.'}
        </>
      ) : null}
      <span className={s.credit}>{frames?.length ? `Contains modified Copernicus Sentinel data ${yearOf(frames[0].date)}–${yearOf(frames[frames.length - 1].date)}` : 'Copernicus Sentinel-2, via Planetary Computer'}</span>
    </p>
  )
  return (
    <div ref={rootRef} className={cx(s.overlay, mobile && s.mobile, reduced && s.reduced)} role="dialog" aria-modal="true" aria-label={`Time-lapse of ${place.label}`} tabIndex={-1}>
      <header className={s.bar}>
        <span className={s.barLabel}>
          Time-lapse <span className={s.dim}>/ </span>
          <span className={s.place}>{place.label}</span>
        </span>
        <button type="button" className={s.close} onClick={onClose} aria-label="Close" aria-keyshortcuts="Escape">
          <span className={s.closeText}>Close</span>
          <Kbd className={s.closeKbd}>Esc</Kbd>
          <Glyph name="close" size={14} />
        </button>
      </header>

      <div className={s.body}>
        <div className={s.main}>
          <Stage frames={frames} i={i} under={at.under} mode={mode} run={run} scrubbing={scrubbing} onScrub={setScrubbing} onTap={() => n > 1 && setPlaying((p) => !p)} onJump={jump} onRetry={() => setAttempt((a) => a + 1)} />

          <div className={s.controls}>
            <button type="button" className={s.play} onClick={() => setPlaying((p) => !p)} disabled={n < 2} aria-label={playing ? 'Pause' : 'Play'} aria-keyshortcuts="Space">
              <Glyph name={playing && n > 1 ? 'pause' : 'play'} size={14} />
            </button>
            <Scrubber run={run} i={i} mode={mode} onJump={jump} onScrub={setScrubbing} />
          </div>

          <p className={s.caption} aria-live="polite">
            {caption(run, mode, data)}
          </p>
          {mobile ? tools : null}
          {mobile ? note : null}
        </div>

        {!mobile ? (
          <aside className={s.side}>
            {tools}
            {frames ? (
              <ol className={s.log} aria-label="Frames">
                {frames.map((f, k) => (
                  <li key={f.scene.id}>
                    <button type="button" className={s.logRow} aria-current={k === i || undefined} onClick={() => jump(k)}>
                      <span className={s.logYear}>{mode === 'years' ? yearOf(f.date) : monthOf(f.date)}</span>
                      <span className={s.logDate}>{mode === 'years' ? `${Number(f.date.slice(8, 10))} ${monthOf(f.date)}` : `${Number(f.date.slice(8, 10))} ${monthOf(f.date)} ${yearOf(f.date)}`}</span>
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
function caption(run: RunState, mode: TimelapseMode, data: TimelapseData | undefined): string {
  if (data) {
    const n = data.frames.length
    if (mode === 'seasons') return `${n} clear looks · last twelve months`
    return data.seasonDay !== undefined ? `${n} clear looks · one a year · same season` : `${n} clear looks · one a year`
  }
  if (run.phase === 'short') return 'Not enough clear looks for a time-lapse'
  if (run.phase === 'error') return 'The archive did not answer'
  return mode === 'years' ? 'One clear look a year · since 2015' : 'The last twelve months'
}

// ── The picture ────────────────────────────────────────────────────────────────────────────

interface StageProps {
  frames: Frame[] | undefined
  i: number
  under: number
  mode: TimelapseMode
  run: RunState
  scrubbing: boolean
  onScrub: (on: boolean) => void
  onTap: () => void
  onJump: (to: number) => void
  onRetry: () => void
}

function Stage({ frames, i, under, mode, run, scrubbing, onScrub, onTap, onJump, onRetry }: StageProps) {
  const drag = useRef<{ x: number; from: number; moved: boolean; id: number } | null>(null)
  const n = frames?.length ?? 0
  const frame = frames?.[i]

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
            <span className={s.big}>{mode === 'years' ? yearOf(frame.date) : monthOf(frame.date)}</span>
            <span className={s.small}>
              {fmtDate(frame.date)} · {frame.scene.platform}
            </span>
          </div>
          <span className={s.count}>
            <span className={s.countLead}>{pad2(i + 1)}</span> / {pad2(n)}
          </span>
          {/* What a screen reader hears: the frame on view, when it changes by hand (not on every played step). */}
          <span className={s.srOnly} aria-live="polite">
            {scrubbing ? '' : `Frame ${i + 1} of ${n}: ${fmtDate(frame.date)}`}
          </span>
        </>
      ) : (
        <Waiting run={run} mode={mode} onRetry={onRetry} />
      )}
    </div>
  )
}

/** The stage before there is a picture: what is being done, in counts, with a hairline bar; or why there is none. */
function Waiting({ run, mode, onRetry }: { run: RunState; mode: TimelapseMode; onRetry: () => void }) {
  if (run.phase === 'short') {
    return (
      <div className={s.wait}>
        <p className={s.waitHead}>Too cloudy here for a time-lapse.</p>
        <p className={s.waitLine}>
          {run.frames === 0 ? 'No clear look' : run.frames === 1 ? '1 clear look' : `${run.frames} clear looks`} {mode === 'years' ? 'since 2015' : 'in the last twelve months'} · 3 needed
        </p>
      </div>
    )
  }
  if (run.phase === 'error') {
    return (
      <div className={s.wait}>
        <p className={s.waitHead}>The archive did not answer.</p>
        <p className={s.waitLine}>Planetary Computer could not be reached</p>
        <Button size="sm" onClick={onRetry} onPointerDown={(e) => e.stopPropagation()} className={s.retry}>
          Try again
        </Button>
      </div>
    )
  }
  // Three steps; the bar fills across all of them.
  const step = run.phase === 'listing' ? 0 : run.phase === 'choosing' ? 1 : 2
  const part = run.phase === 'choosing' ? run.done / Math.max(1, run.total) : run.phase === 'loading' ? run.loaded / Math.max(1, run.dates.length) : 0
  const lines: [string, string][] = [
    ['Listing the archive', step > 0 ? 'Done' : '…'],
    ['Choosing clear looks', run.phase === 'choosing' ? `${pad2(run.done)} / ${pad2(run.total)}` : step > 1 ? 'Done' : '—'],
    ['Acquiring frames', run.phase === 'loading' ? `${pad2(run.loaded)} / ${pad2(run.dates.length)}` : '—'],
  ]
  return (
    <div className={s.wait} role="status">
      <dl className={s.steps}>
        {lines.map(([label, value], k) => (
          <div key={label} className={cx(s.stepRow, k === step && s.stepNow, k > step && s.stepLater)}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <span className={s.progress} aria-hidden>
        <span className={s.progressFill} style={{ transform: `scaleX(${(step + part) / 3})` }} />
      </span>
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

function Scrubber({ run, i, mode, onJump, onScrub }: { run: RunState; i: number; mode: TimelapseMode; onJump: (to: number) => void; onScrub: (on: boolean) => void }) {
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

  // Years get their two digits under each tick while there is room for them.
  const labelled = mode === 'years' && ticks.length <= 14
  return (
    <div className={s.scrubWrap}>
      <div
        ref={ref}
        className={cx(s.scrub, live && s.scrubLive)}
        role="slider"
        tabIndex={live ? 0 : -1}
        aria-label="Frame"
        aria-valuemin={1}
        aria-valuemax={Math.max(1, ticks.length)}
        aria-valuenow={live ? i + 1 : undefined}
        aria-valuetext={live && ticks[i] ? fmtDate(ticks[i].date) : undefined}
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
            {labelled ? <span className={s.tickLabel}>{tk.date.slice(2, 4)}</span> : null}
          </span>
        ))}
      </div>
      {!labelled && ticks.length > 1 ? (
        <div className={s.ends}>
          <span>{fmtDate(ticks[0].date)}</span>
          <span>{fmtDate(ticks[ticks.length - 1].date)}</span>
        </div>
      ) : null}
    </div>
  )
}

// ── The link ───────────────────────────────────────────────────────────────────────────────

function CopyLink({ place, mode }: { place: TimelapseProps['place']; mode: TimelapseMode }) {
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 1800)
    return () => clearTimeout(timer)
  }, [copied])
  const press = () => {
    const url = timelapseLink(location.origin, place, mode)
    track('timelapse_share', { mode })
    // A phone's own share sheet when it has one (called inside the press, as Safari requires); else the clipboard.
    const coarse = window.matchMedia?.('(pointer: coarse)').matches
    if (coarse && typeof navigator.share === 'function') {
      navigator.share({ title: `${place.label}, year by year`, url }).catch(() => undefined)
      return
    }
    const done = () => setCopied(true)
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(url).then(done, () => undefined)
  }
  return (
    <Button size="sm" onClick={press} aria-live="polite" className={s.copy}>
      <Glyph name="share" size={11} />
      {copied ? 'Link copied' : 'Share'}
    </Button>
  )
}
