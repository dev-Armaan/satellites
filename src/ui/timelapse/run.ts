/**
 * One run of the time-lapse for the player: its progress as React state, and the last few finished ones kept.
 *
 * A finished time-lapse is kept while its place is on screen (at most KEEP of them, e.g. the years and the seasons
 * of one place), so closing and reopening it, or switching back to a tab, plays at once with nothing asked again.
 * One that falls out gives its pictures back (releaseTimelapse): they are a dozen decoded photos, and nothing else
 * holds them. Closing the player while a run is still under way aborts it; the engine releases what it had made.
 */
import { useEffect, useState } from 'react'
import { buildTimelapse, MIN_FRAMES, releaseTimelapse, type Frame, type Timelapse, type TimelapseMode } from '@/imagery/timelapse'
import type { LatLon } from '@/types'

const KEEP = 2
const kept = new Map<string, Timelapse>()

const keyOf = (place: LatLon, mode: TimelapseMode, px: number) => `${mode}|${place.lat.toFixed(4)},${place.lon.toFixed(4)}|${px}`

function keep(key: string, t: Timelapse) {
  kept.delete(key)
  kept.set(key, t)
  while (kept.size > KEEP) {
    const [oldest, gone] = kept.entries().next().value as [string, Timelapse]
    kept.delete(oldest)
    releaseTimelapse(gone)
  }
}

/** Test hook, and for a place change: drop every kept time-lapse. */
export function forgetTimelapses(): void {
  for (const t of kept.values()) releaseTimelapse(t)
  kept.clear()
}

export type RunState =
  | { phase: 'listing' }
  | { phase: 'choosing'; done: number; total: number }
  /** `dates`: the frames chosen, oldest first; `loaded` of them have their picture */
  | { phase: 'loading'; dates: { date: string; t: number }[]; loaded: number }
  | { phase: 'ready'; timelapse: Timelapse }
  /** Fewer than MIN_FRAMES clear looks: not a time-lapse */
  | { phase: 'short'; frames: number; slots: number }
  | { phase: 'error' }

/** Decode every frame before the first is shown, so the first loop never waits on one. */
async function decodeAll(frames: readonly Frame[]): Promise<void> {
  await Promise.all(
    frames.map((f) => {
      const img = new Image()
      img.src = f.src
      return img.decode().catch(() => undefined)
    }),
  )
}

export function useTimelapseRun(place: LatLon, mode: TimelapseMode, px: number, attempt: number): RunState {
  const key = keyOf(place, mode, px)
  const [state, setState] = useState<{ key: string; attempt: number; run: RunState }>(() => {
    const t = kept.get(key)
    return { key, attempt, run: t ? { phase: 'ready', timelapse: t } : { phase: 'listing' } }
  })
  useEffect(() => {
    const ready = kept.get(key)
    if (ready) {
      keep(key, ready)
      setState({ key, attempt, run: { phase: 'ready', timelapse: ready } })
      return
    }
    const ctl = new AbortController()
    const set = (run: RunState) => !ctl.signal.aborted && setState({ key, attempt, run })
    set({ phase: 'listing' })
    buildTimelapse(place, mode, {
      px,
      signal: ctl.signal,
      onProgress: (p) => {
        if (p.phase === 'loading') set({ phase: 'loading', dates: p.frames.map((f) => ({ date: f.date, t: f.scene.t })), loaded: p.loaded })
        else set(p)
      },
    })
      .then(async (t) => {
        if (t.frames.length < MIN_FRAMES) {
          releaseTimelapse(t)
          return set({ phase: 'short', frames: t.frames.length, slots: t.slots })
        }
        await decodeAll(t.frames)
        if (ctl.signal.aborted) return releaseTimelapse(t)
        keep(key, t)
        set({ phase: 'ready', timelapse: t })
      })
      .catch((err: unknown) => {
        if (ctl.signal.aborted) return
        console.error(err)
        set({ phase: 'error' })
      })
    return () => ctl.abort()
    // `place` by value: the key holds its coordinates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt])
  // A render between a prop change and its effect still shows the previous run: say "listing" for the new one.
  return state.key === key && state.attempt === attempt ? state.run : (kept.get(key) && { phase: 'ready', timelapse: kept.get(key)! }) || { phase: 'listing' }
}
