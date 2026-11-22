/**
 * A tab opened on an earlier build asks the production domain for lazily loaded chunks (results, globe, About, …)
 * whose hashed names that build knew. The domain serves only the newest deployment's files, so those imports
 * fail after a deploy. Vite reports each failure as a cancellable
 * `vite:preloadError` event on window.
 *
 * The fix is one reload: the tab picks up the new build, and the address bar already carries the place and pass,
 * so the visitor lands where they were. It is guarded so it can never loop: at most one reload per tab per
 * RELOAD_GUARD_MS, and none at all when sessionStorage is unavailable (no way to remember that we already tried).
 * Workers need nothing here: a worker that fails to load falls back to the main thread (engine/pool.ts,
 * imagery/pixelsClient.ts).
 *
 * A prefetch nobody waits for (the share card's measure, src/ui/share/measure.ts) does not reload either: its failure
 * is as likely a dropped connection as a new build, and reloading the results someone is reading for a chunk they may
 * never use is worse than letting the press that needs it ask again (and reload then). Such a prefetch puts its chunk's
 * name in QUIET_CHUNKS while it runs; a failure that names it, or names no module (Safari's), is let through. A shared
 * set on globalThis, not an import: either module importing the other would move it into another chunk.
 */

const KEY = 'watched-stale-build-reload'
export const RELOAD_GUARD_MS = 5 * 60_000

export interface StaleBuildDeps {
  storage: Pick<Storage, 'getItem' | 'setItem'> | null
  reload: () => void
  now: () => number
}

/** Chunk names ('cardMeasure-') of the prefetches running now, whose failure must not reload (see above). */
export const QUIET_CHUNKS = Symbol.for('watched.quietChunks')

/** A failed import that may be a running prefetch's own: no reload for it. */
export function isQuietFailure(payload: unknown, quiet: ReadonlySet<string> | undefined): boolean {
  if (!quiet?.size) return false
  const msg = String(payload ?? '')
  if (!/https?:\/\//.test(msg)) return true
  for (const name of quiet) if (msg.includes(`/${name}`)) return true
  return false
}

/** Reload once for a missing chunk. Returns true if a reload was started (the caller then swallows the error). */
export function reloadForNewBuild(deps: StaleBuildDeps): boolean {
  const { storage, reload, now } = deps
  if (!storage) return false
  try {
    const last = Number(storage.getItem(KEY) || 0)
    const t = now()
    if (Number.isFinite(last) && t - last >= 0 && t - last < RELOAD_GUARD_MS) return false
    storage.setItem(KEY, String(t))
  } catch {
    return false
  }
  reload()
  return true
}

function sessionStore(): Storage | null {
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

/** Production only: listen for failed lazy imports and reload once onto the current build. */
export function installStaleBuildReload(): void {
  if (typeof window === 'undefined') return
  window.addEventListener('vite:preloadError', (event) => {
    const quiet = (globalThis as { [QUIET_CHUNKS]?: Set<string> })[QUIET_CHUNKS]
    if (isQuietFailure((event as Event & { payload?: unknown }).payload, quiet)) return
    const started = reloadForNewBuild({ storage: sessionStore(), reload: () => window.location.reload(), now: () => Date.now() })
    // Swallow the error only when the page is about to reload; otherwise let the app's own error handling see it.
    if (started) event.preventDefault()
  })
}
