/**
 * A tab opened on an earlier build asks the production domain for lazily loaded chunks (results, globe, About, …)
 * whose hashed names that build knew. Without Vercel's Skew Protection, the domain serves only the newest
 * deployment's files, so those imports fail after a deploy. Vite reports each failure as a cancellable
 * `vite:preloadError` event on window.
 *
 * The fix is one reload: the tab picks up the new build, and the address bar already carries the place and pass,
 * so the visitor lands where they were. It is guarded so it can never loop: at most one reload per tab per
 * RELOAD_GUARD_MS, and none at all when sessionStorage is unavailable (no way to remember that we already tried).
 * Workers need nothing here: a worker that fails to load falls back to the main thread (engine/pool.ts,
 * imagery/pixelsClient.ts).
 *
 * A prefetch nobody is waiting for (`quietly`: the share card's measure, fetched at idle once results are final) never
 * reloads: its failure is as likely a dropped connection as a new build, and reloading the results someone is reading
 * for a chunk they may never use would be worse than the press that later asks for it again (and reloads then, if the
 * build is new). Vite's event does not say which import failed, so while one runs no failure reloads; the imports
 * themselves still reject as before.
 */

const KEY = 'watched-stale-build-reload'
export const RELOAD_GUARD_MS = 5 * 60_000

export interface StaleBuildDeps {
  storage: Pick<Storage, 'getItem' | 'setItem'> | null
  reload: () => void
  now: () => number
}

let quiet = 0

/** Run a prefetch that must not reload the page if it fails (see above). */
export function quietly<T>(load: () => Promise<T>): Promise<T> {
  quiet++
  let p: Promise<T>
  try {
    p = load()
  } catch (e) {
    quiet--
    throw e
  }
  p.then(
    () => quiet--,
    () => quiet--,
  )
  return p
}

/** Whether a quiet prefetch is running (a failure now may be its own: no reload). */
export const prefetching = (): boolean => quiet > 0

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
    if (prefetching()) return
    const started = reloadForNewBuild({ storage: sessionStore(), reload: () => window.location.reload(), now: () => Date.now() })
    // Swallow the error only when the page is about to reload; otherwise let the app's own error handling see it.
    if (started) event.preventDefault()
  })
}
