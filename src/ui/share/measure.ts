/**
 * The share card's headline measure in the app: fetched ahead of a press, never by a search that is not shared.
 *
 * Why: the card's size steps down until no word overflows its column, measured in the card's own faces
 * (api/_lib/cardMeasure.ts over cardWidths.gen.ts: per-font widths, Arabic and Devanagari forms, kerning; ~22 kB gzip).
 * Imported with cardSpec it rode in a chunk every first search loads (35.8 kB gzip where it had been 10.6), and
 * only a share needs it. So the measure is its own chunk, handed to cardSpec when it arrives, and the share sheet opens once it is in
 * (ShareSheet.tsx's gate); the server card imports it up front (api/og.tsx).
 *
 * Chosen over making the whole sheet lazy: that also moves the sheet, the card and its renderers out of the first
 * search (~19 kB gzip more), but Rolldown then split every module the sheet shares with the results into chunks of
 * their own (store helpers, the bottom Sheet, the copy, the GIBS and Meteosat endpoints, ...): seven more files on the
 * first search. The measure imports nothing but its tables, so the chunk graph stays as it was.
 *
 * Why the sheet still opens at once: the chunk is fetched a few seconds after the report is final, when the main
 * thread is next idle (the panel's entrance and its first photos come first; not at all on Save-Data or a 2G link,
 * where only intent fetches it), and at the first sign of intent anywhere on the page (a pointerdown, a key, a focus:
 * every Share is pressed with one of those, in the panel, the photo viewer or the pass view), so a press finds it in.
 *
 * A prefetch nobody waits for must not reload the results someone is reading when it fails (a dropped connection is
 * as likely as a new build): src/lib/staleBuild.ts reloads the tab for any failed lazy import, but not, while a
 * prefetch runs, for one that names this chunk (or names no module, as Safari's does). A press never
 * rides on a failed prefetch: its own load asks again, loudly, so a new build reloads the tab as for any other chunk.
 */
import { useEffect } from 'react'
import { hasCardMeasure, provideCardMeasure } from '../../../api/_lib/cardSpec'

let chunk: Promise<void> | undefined
/** The download in flight is a prefetch's (its failure stays quiet). */
let quiet = false
/** When a prefetch last failed: intent stops asking for a while (a press still asks). */
let prefetchFailedAt = -Infinity
const PREFETCH_RETRY_MS = 60_000

/**
 * The measure's chunk (asked for once; a failed download is asked for again next time). `prefetch`: nobody waits
 * for it, so its failure must not reload the page; a press's load (the default) may, and never inherits a
 * prefetch's failure.
 */
export function loadCardMeasure(prefetch = false): Promise<void> {
  if (hasCardMeasure()) return Promise.resolve()
  if (!chunk) {
    setQuiet(prefetch)
    // An import that resolves with nothing failed too: Vite does that when its vite:preloadError was cancelled
    // (staleBuild.ts, as it starts a reload), as src/app/chunks.ts says.
    const q = import('../../../api/_lib/cardMeasure').then((m) => {
      if (!m?.textPx) throw new Error('card measure did not load')
      provideCardMeasure(m)
    })
    chunk = q
    q.then(
      () => setQuiet(false),
      () => {
        if (chunk === q) chunk = undefined
        if (quiet) prefetchFailedAt = Date.now()
        setQuiet(false)
      },
    )
  }
  const p = chunk
  // A press on a prefetch's download asks once more itself if that fails (loudly), never twice.
  return prefetch || !quiet ? p : p.catch(() => loadCardMeasure())
}

/** Pauses before a press asks again for a measure that failed (as src/app/chunks.ts CHUNK_RETRY_MS). */
export const PRESS_RETRY_MS: readonly number[] = [1500, 4000]

/**
 * A press's load: asked again after each of PRESS_RETRY_MS (a dropped connection is usually back within seconds)
 * while `alive()`, rejecting only when none worked.
 */
export async function loadCardMeasureForPress(alive: () => boolean): Promise<void> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await loadCardMeasure()
    } catch (err) {
      if (!alive() || attempt >= PRESS_RETRY_MS.length) throw err
      await new Promise((r) => setTimeout(r, PRESS_RETRY_MS[attempt]))
    }
  }
}

/** Installed: a card can be built now. */
export const cardMeasureReady = hasCardMeasure

/**
 * While a prefetch downloads, src/lib/staleBuild.ts lets its failure through without a reload: it reads the chunk
 * names in this set (Symbol.for, shared without either module importing the other, which would move it to a chunk).
 */
const QUIET = Symbol.for('watched.quietChunks')
/** The built chunk's name starts so (vite.config.ts fails the build if no chunk does). */
const CHUNK = 'cardMeasure-'
function setQuiet(on: boolean) {
  quiet = on
  const g = globalThis as { [QUIET]?: Set<string> }
  const set = (g[QUIET] ??= new Set())
  if (on) set.add(CHUNK)
  else set.delete(CHUNK)
}

const warm = () => {
  if (hasCardMeasure() || Date.now() - prefetchFailedAt < PREFETCH_RETRY_MS) return
  void loadCardMeasure(true).catch(() => undefined)
}

/** After the final report: the panel's entrance and its first photos go first. */
const PREFETCH_DELAY_MS = 4000
/** How long after that the prefetch may wait for an idle main thread. */
const IDLE_TIMEOUT_MS = 3000
const INTENT = ['pointerdown', 'keydown', 'focusin'] as const

/** A connection where nothing is fetched ahead (Save-Data, 2G): only intent fetches the measure. */
function frugal(): boolean {
  const c = (navigator as { connection?: { saveData?: boolean; effectiveType?: string } }).connection
  return !!c && (!!c.saveData || /2g/.test(c.effectiveType ?? ''))
}

/** Fetch the measure once a share is possible (`active`: the final report is on screen): soon at idle, or at intent. */
export function usePrefetchCardMeasure(active: boolean): void {
  useEffect(() => {
    if (!active || hasCardMeasure()) return
    const w = window as {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number
      cancelIdleCallback?: (id: number) => void
    }
    let idle = 0
    const timer = frugal()
      ? 0
      : window.setTimeout(() => {
          if (w.requestIdleCallback) idle = w.requestIdleCallback(warm, { timeout: IDLE_TIMEOUT_MS })
          else warm()
        }, PREFETCH_DELAY_MS)
    // Capture phase on window: a press anywhere (the panel, the photo viewer's portal) is seen before it is handled.
    for (const t of INTENT) window.addEventListener(t, warm, { capture: true, passive: true })
    return () => {
      window.clearTimeout(timer)
      if (idle) w.cancelIdleCallback?.(idle)
      for (const t of INTENT) window.removeEventListener(t, warm, { capture: true })
    }
  }, [active])
}
