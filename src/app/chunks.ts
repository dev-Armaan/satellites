/**
 * The app's code-split chunks (the globe, the results panel, About), asked for by name and remembered once loaded.
 *
 * A component from a chunk renders synchronously in the very commit that needs it. (React.lazy would suspend for a
 * tick even when the chunk is already in, and the Suspense retry runs at a low priority that a stream of store
 * updates — progress, the clock — can starve for seconds: measured 1.8 s of empty screen between boot and the
 * computing panel.)
 *
 * A chunk that fails to load must never fail quietly. One did: with the results panel's chunk refused (and the one
 * reload a tab gets for a missing chunk already spent, src/lib/staleBuild.ts), a search ran to its end and the screen
 * stayed the globe and the HUD, with no panel, no notice and no way to ask again (seen on the live site, 2026-11-21).
 * Three things went wrong together, and each is closed here:
 *  - nobody asked again: `requestChunk` does, after a pause, twice;
 *  - a later success (another caller's: the idle prefetch) changed no state, so nothing rendered it: `onLoad` tells
 *    whoever is waiting;
 *  - the last failure was swallowed: `requestChunk` reports it, and Main turns it into the fault notice, whose
 *    "Try again" asks for the chunk anew.
 * And an import that "succeeds" with nothing counts as a failure: Vite resolves a failed lazy import with
 * `undefined` when its `vite:preloadError` event was cancelled (staleBuild.ts cancels it when it starts a reload),
 * which used to be remembered as the module for good.
 */

export interface Chunk<T> {
  /** Ask for the module (one request at a time; a failed one is forgotten, so the next call asks again). */
  (): Promise<T>
  /** The module, once it has arrived */
  loaded?: T
  /** Call `fn` when the module arrives, whoever asked for it. Returns the function that stops listening. */
  onLoad(fn: () => void): () => void
}

export function chunk<T>(load: () => Promise<T>): Chunk<T> {
  let pending: Promise<T> | undefined
  const waiting = new Set<() => void>()
  const get = (() => {
    pending ??= load().then((m) => {
      if (m === undefined || m === null) throw new Error('chunk did not load')
      get.loaded = m
      for (const fn of [...waiting]) fn()
      waiting.clear()
      return m
    })
    // A failed chunk load (flaky network) must not stick: the next call retries.
    pending.catch(() => (pending = undefined))
    return pending
  }) as Chunk<T>
  get.onLoad = (fn) => {
    waiting.add(fn)
    return () => waiting.delete(fn)
  }
  return get
}

/** Pauses before asking again for a chunk that failed: a dropped connection is usually back within seconds. */
export const CHUNK_RETRY_MS: readonly number[] = [1500, 4000]

/**
 * Ask for `c` until it loads: once, then once more after each of `retryMs`. `onFail` gets the last attempt's error
 * when none of them worked. Returns the function that gives up (no further attempt, no `onFail`).
 */
export function requestChunk<T>(
  c: Chunk<T>,
  opts: { onFail?: (err: unknown) => void; retryMs?: readonly number[]; wait?: (ms: number) => Promise<void> } = {},
): () => void {
  const { onFail, retryMs = CHUNK_RETRY_MS, wait = (ms) => new Promise<void>((r) => setTimeout(r, ms)) } = opts
  let alive = true
  void (async () => {
    for (let attempt = 0; alive; attempt++) {
      try {
        await c()
        return
      } catch (err) {
        if (!alive) return
        if (attempt >= retryMs.length) return onFail?.(err)
        await wait(retryMs[attempt])
      }
    }
  })()
  return () => {
    alive = false
  }
}
