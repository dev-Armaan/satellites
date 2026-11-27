/**
 * One run of the report engine that can start before anything is on screen to show it.
 *
 * Why: a link (`?q=`, a place page, a share) knows its place while the loading screen is still up, and its search is
 * three waits on the archives in a row (the scene search, the cloud masks, the lead photo: 2–4 s, none of it this
 * site's work). Until 2026-11-27 that only began once the globe had its first light and the sharp map, so a link's
 * visitor waited for the page and THEN for the search. Started at boot, the search overlaps the page's own loading.
 *
 * What it keeps while nobody is listening, so the controller's sequencing (src/app/controller.ts runReport) sees
 * exactly what it would have seen live:
 *  - the newest partial report, handed over at `attach`, unless the final one is already in (then it leads, as it
 *    does when the weather checks finish before any partial);
 *  - the newest report of all (`latest`): the final one, or a background patch that followed it;
 *  - each step's first and last progress line with the time it was said (`history`), so the readout shows how long a
 *    step really took, not 0.00 s for one that ran under the loading screen.
 * After `attach` every event goes straight through. Pure: the engine call is handed in, so a test drives it.
 */
import type { ProgressEvent } from '@/types'

export interface RunCallbacks<R> {
  onProgress: (e: ProgressEvent) => void
  onPartial: (r: R) => void
  onUpdate: (r: R) => void
}

export interface EngineRun<R> {
  /**
   * The engine's own promise: the final report, or its rejection. A rejection nobody awaits yet is not "unhandled"
   * (a quiet handler is attached), and still reaches whoever awaits this later.
   */
  readonly done: Promise<R>
  /** Listen from now on. A partial report kept so far is handed to `onPartial` at once, unless the final one is in. */
  attach(handlers: RunCallbacks<R>): void
  /** The newest non-partial report so far: the final one, or the latest background patch after it. */
  latest(): R | undefined
  /** Progress so far: per step its first line and its newest, each with `at`, in the order they were said. */
  history(): ProgressEvent[]
}

export function engineRun<R>(start: (cb: RunCallbacks<R>) => Promise<R>, clock: () => number = () => performance.now()): EngineRun<R> {
  let handlers: RunCallbacks<R> | undefined
  let partial: R | undefined
  let newest: R | undefined
  let finished = false
  const steps: { first: ProgressEvent; last: ProgressEvent }[] = []

  const done = start({
    onProgress: (e) => {
      if (handlers) return handlers.onProgress(e)
      const timed = { ...e, at: clock() }
      const step = steps[steps.length - 1]
      if (step && step.first.stage === e.stage) step.last = timed
      else steps.push({ first: timed, last: timed })
    },
    onPartial: (r) => {
      if (handlers) handlers.onPartial(r)
      else partial = r
    },
    onUpdate: (r) => {
      newest = r
      handlers?.onUpdate(r)
    },
  }).then((r) => {
    finished = true
    // A patch can only follow the final report; one that is here already is the newer of the two.
    newest ??= r
    return r
  })
  done.catch(() => undefined)

  return {
    done,
    attach(h) {
      handlers = h
      const kept = partial
      partial = undefined
      if (kept !== undefined && !finished) h.onPartial(kept)
    },
    latest: () => newest,
    history: () => steps.flatMap((s) => (s.last === s.first ? [s.first] : [s.first, s.last])),
  }
}
