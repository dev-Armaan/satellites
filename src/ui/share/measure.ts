/**
 * The share card's headline measure in the app: fetched ahead of a press, never by a search that is not shared.
 *
 * Why: the card's size steps down until no word overflows its column, measured in the card's own faces
 * (api/_lib/cardMeasure.ts over cardWidths.gen.ts: per-font widths, Arabic and Devanagari forms, kerning; ~22 kB gzip).
 * Imported with cardSpec it rode in a chunk every first search loads (35.8 kB gzip where it had been 10.6), and only
 * a share needs it. So the measure is its own chunk, handed to cardSpec when it arrives, and the share sheet opens once it is in
 * (ShareSheet.tsx's gate); the server card imports it up front (api/og.tsx).
 *
 * Chosen over making the whole sheet lazy: that also moves the sheet, the card and its renderers out of the first
 * search (~19 kB gzip more), but Rolldown then split every module the sheet shares with the results into chunks of
 * their own (store helpers, the bottom Sheet, the copy, the GIBS and Meteosat endpoints, ...): seven more files on the
 * first search. The measure imports nothing but its tables, so the chunk graph stays as it was.
 *
 * Why the sheet still opens at once: the chunk is fetched once the report is final, when the main thread is next idle
 * (the panel's entrance and its photos come first), and at the first sign of intent anywhere on the page (a
 * pointerdown, a key, a focus: every Share is pressed with one of those, in the panel, the photo viewer or the pass
 * view), so a press finds it in.
 */
import { useEffect } from 'react'
import { hasCardMeasure, provideCardMeasure } from '../../../api/_lib/cardSpec'

let chunk: Promise<void> | undefined

/** The measure's chunk (asked for once; a failed download is asked for again next time). */
export function loadCardMeasure(): Promise<void> {
  if (hasCardMeasure()) return Promise.resolve()
  chunk ??= import('../../../api/_lib/cardMeasure').then(provideCardMeasure)
  chunk.catch(() => (chunk = undefined))
  return chunk
}

/** Installed: a card can be built now. */
export const cardMeasureReady = hasCardMeasure

const warm = () => void loadCardMeasure().catch(() => undefined)

/** How long after the final report the prefetch may wait for an idle main thread. */
const IDLE_TIMEOUT_MS = 3000
const INTENT = ['pointerdown', 'keydown', 'focusin'] as const

/** Fetch the measure once a share is possible (`active`: the final report is on screen): at idle, or at intent. */
export function usePrefetchCardMeasure(active: boolean): void {
  useEffect(() => {
    if (!active || hasCardMeasure()) return
    const w = window as {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number
      cancelIdleCallback?: (id: number) => void
    }
    const ric = w.requestIdleCallback
    const id = ric ? ric(warm, { timeout: IDLE_TIMEOUT_MS }) : window.setTimeout(warm, 1500)
    // Capture phase on window: a press anywhere (the panel, the photo viewer's portal) is seen before it is handled.
    for (const t of INTENT) window.addEventListener(t, warm, { capture: true, passive: true })
    return () => {
      if (ric) w.cancelIdleCallback?.(id)
      else window.clearTimeout(id)
      for (const t of INTENT) window.removeEventListener(t, warm, { capture: true })
    }
  }, [active])
}
