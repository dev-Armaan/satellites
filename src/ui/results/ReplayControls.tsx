/**
 * Replay controls for the selected pass: play/pause (Space), rate, and a scrubber bounded to the pass
 * window. Scrubbing puts the clock in 'scrub' (the globe follows the store exactly); play resumes
 * 'replay' at the chosen rate (the globe advances it). The in-field window (when the place was inside
 * the swath / field of regard) is marked on the track, with a tick at closest approach.
 *
 * Every frame (R20): the progress bar, the playhead, the range value and the T± / UTC readouts are
 * written through refs from the scene clock (src/state/sceneClock.ts) as transforms and text. React
 * renders this only when the mode or rate changes, never per tick.
 *
 * <ReplayStrip>: the same controls compacted to one 44px row for the phone pass header, so the sweep
 * can be watched and controlled at the low snap (MOB-16).
 *
 * Words: the 'results' namespace (replay). The clocks (T−00:42, 16:14:21 UTC) and the rates (30×) are international
 * notation, the same in every language.
 */
import { useId, useRef } from 'react'
import enResults from '@/i18n/en/results'
import { msgs, useMsgs } from '@/i18n/runtime'
import { sceneClock } from '@/state/sceneClock'
import { useAfterSceneFrame } from './capture'
import { useApp } from '@/state/store'
import type { Pass } from '@/types'
import { Glyph, Kbd, cx, fmtUtcTime, useIsMobile } from '@/ui/system'
import { seek, togglePlay } from './actions'
import { REPLAY_RATES, replayWindow, windowFraction } from './lib/replay'
import { fmtDuration, fmtTMinus } from './lib/time'
import s from './ReplayControls.module.css'

/** Scene time for UI: the globe's per-frame clock, or the store's while the globe isn't driving it. */
function sceneTime(): number {
  const st = useApp.getState()
  return sceneClock.mode === st.timeMode ? sceneClock.simTime : st.simTime
}

interface FrameRefs {
  progress: React.RefObject<HTMLSpanElement | null>
  head: React.RefObject<HTMLSpanElement | null>
  range: React.RefObject<HTMLInputElement | null>
  tminus: React.RefObject<HTMLSpanElement | null>
  utc: React.RefObject<HTMLSpanElement | null>
}

/** Writes the replay position into the DOM once per frame (only what changed). */
function useReplayFrame(pass: Pass, refs: FrameRefs, dragging: React.RefObject<boolean>) {
  const last = useRef({ f: -1, tm: '', utc: '' })
  useAfterSceneFrame(() => {
    const st = useApp.getState()
    const w = replayWindow(pass)
    const now = sceneTime()
    const inWindow = st.timeMode !== 'live' && now >= w[0] - 1000 && now <= w[1] + 1000
    const t = inWindow ? Math.min(w[1], Math.max(w[0], now)) : w[0]
    const f = windowFraction(t, w)
    const L = last.current
    if (Math.abs(f - L.f) > 1e-5) {
      L.f = f
      if (refs.progress.current) refs.progress.current.style.transform = `scaleX(${f.toFixed(5)})`
      if (refs.head.current) refs.head.current.style.transform = `translateX(${(f * 100).toFixed(4)}%)`
      const r = refs.range.current
      if (r && !dragging.current) r.value = String(Math.round(t / 1000) * 1000)
    }
    const tm = fmtTMinus(t, pass.tClosest)
    if (tm !== L.tm) {
      L.tm = tm
      if (refs.tminus.current) refs.tminus.current.textContent = tm
      const utc = `${fmtUtcTime(t)} UTC`
      if (refs.utc.current) refs.utc.current.textContent = utc
      refs.range.current?.setAttribute('aria-valuetext', msgs(enResults).replay.scrubValue(tm, utc))
    }
  })
}

function Scrubber({ pass, refs, dragging, compact = false }: { pass: Pass; refs: FrameRefs; dragging: React.RefObject<boolean>; compact?: boolean }) {
  const id = useId()
  const w = replayWindow(pass)
  const pct = (x: number) => `${(windowFraction(x, w) * 100).toFixed(3)}%`
  const inField = pass.tEnd > pass.tStart
  const m = useMsgs(enResults).replay
  return (
    <div className={cx(s.scrub, compact && s.scrubCompact)}>
      <div className={s.track} aria-hidden>
        {/* Placed with a transform: a quiet pass change (a gallery swipe) moves the band without a layout shift. */}
        {inField ? (
          <span
            className={s.field}
            style={{ transform: `translateX(${(windowFraction(pass.tStart, w) * 100).toFixed(3)}%) scaleX(${(windowFraction(pass.tEnd, w) - windowFraction(pass.tStart, w)).toFixed(5)})` }}
          />
        ) : null}
        <span className={s.closest} style={{ left: pct(pass.tClosest) }} />
        <span ref={refs.progress} className={s.progress} />
        <span ref={refs.head} className={s.headRail}>
          <span className={s.head} />
        </span>
      </div>
      <label htmlFor={id} className="sr-only">
        {m.scrubLabel}
      </label>
      <input
        id={id}
        ref={refs.range}
        type="range"
        className={s.range}
        min={w[0]}
        max={w[1]}
        step={1000}
        defaultValue={w[0]}
        onPointerDown={() => (dragging.current = true)}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
        onChange={(e) => seek(Number(e.target.value))}
      />
    </div>
  )
}

function PlayButton({ pass, className }: { pass: Pass; className?: string }) {
  const playing = useApp((st) => st.timeMode === 'replay')
  const m = useMsgs(enResults).replay
  return (
    <button
      type="button"
      className={cx(s.play, playing && s.playing, className)}
      onClick={() => togglePlay(pass)}
      aria-label={playing ? m.pause : m.play}
      aria-keyshortcuts="Space"
      data-space="play"
    >
      <Glyph name={playing ? 'pause' : 'play'} size={12} />
    </button>
  )
}

function useFrameRefs(): FrameRefs {
  return {
    progress: useRef<HTMLSpanElement>(null),
    head: useRef<HTMLSpanElement>(null),
    range: useRef<HTMLInputElement>(null),
    tminus: useRef<HTMLSpanElement>(null),
    utc: useRef<HTMLSpanElement>(null),
  }
}

export function ReplayControls({ pass }: { pass: Pass }) {
  const rate = useApp((st) => st.replayRate)
  const refs = useFrameRefs()
  const dragging = useRef(false)
  useReplayFrame(pass, refs, dragging)
  const w = replayWindow(pass)
  const inField = pass.tEnd > pass.tStart
  const mobile = useIsMobile()
  const m = useMsgs(enResults).replay

  return (
    <div className={s.root}>
      <div className={s.row}>
        <PlayButton pass={pass} />
        <div className={s.rates} role="radiogroup" aria-label={m.speed}>
          {REPLAY_RATES.map((r) => (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={rate === r}
              className={cx(s.rate, rate === r && s.rateOn)}
              onClick={() => useApp.getState().setReplayRate(r)}
            >
              {r}×
            </button>
          ))}
        </div>
        <div className={s.clock} aria-live="off">
          <span ref={refs.tminus} className={s.tminus} />
          <span ref={refs.utc} className={s.utc} />
        </div>
      </div>

      <Scrubber pass={pass} refs={refs} dragging={dragging} />
      <div className={s.legend}>
        <span>{fmtUtcTime(w[0])}</span>
        {/* Each key with its words, as one group: on a narrow phone the middle wraps between the groups, and a group
            wider than the middle on its own wraps its words, never inside its duration (a no-break space for each
            space). The key touches its words: the gap is its margin, a space would widen it. */}
        <span className={s.legendMid}>
          {inField ? (
            <span className={s.legendItem}>
              <i className={s.fieldKey} />
              {m.inView(fmtDuration(pass.tEnd - pass.tStart).replace(/ /g, '\u00a0'))}
            </span>
          ) : null}
          <span className={s.legendItem}>
            <i className={s.closestKey} />
            {m.closest}
          </span>
        </span>
        <span>{fmtUtcTime(w[1])}</span>
      </div>
      {!mobile ? (
        <div className={s.keys}>
          {/* Each key with its words, as one group: the line wraps between the groups, never inside one */}
          <span className={s.keyPair}>
            <Kbd>{m.spaceKey}</Kbd> {m.playPause}
          </span>
          <span className={s.keyPair}>
            <span className={s.arrows}>
              <Kbd>←</Kbd>
              <Kbd>→</Kbd>
            </span>{' '}
            {m.stepKind}
          </span>
        </div>
      ) : null}
    </div>
  )
}

/** One-row replay for the phone pass header: play/pause, scrubber, T± readout. */
export function ReplayStrip({ pass }: { pass: Pass }) {
  const refs = useFrameRefs()
  const dragging = useRef(false)
  useReplayFrame(pass, refs, dragging)
  return (
    <div className={s.strip}>
      <PlayButton pass={pass} className={s.stripPlay} />
      <Scrubber pass={pass} refs={refs} dragging={dragging} compact />
      <span ref={refs.tminus} className={s.stripClock} />
      <span ref={refs.utc} hidden />
    </div>
  )
}
