/**
 * Whether the time-lapse is open, and how it was asked for. A store of its own, outside the time-lapse's chunk: the
 * results screen, the photo viewer and a `?tl=` link all open it, and none of them should load the player (or the
 * frame selection behind it) before someone asks. The player's chunk is fetched when `open` is first set.
 */
import { create } from 'zustand'
/** Where it was opened from: the results' row, the photo viewer, or a link that carries `tl`. */
export type TimelapseFrom = 'results' | 'viewer' | 'link'

interface TimelapseUi {
  open: { from: TimelapseFrom } | null
  /** A `?tl=` link's request, waiting for the report it belongs to */
  pending: boolean
  show: (from: TimelapseFrom) => void
  close: () => void
  request: (wanted: boolean) => void
}

export const useTimelapseUi = create<TimelapseUi>((set) => ({
  open: null,
  pending: false,
  show: (from) => set({ open: { from }, pending: false }),
  close: () => set({ open: null }),
  request: (pending) => set({ pending }),
}))

/** Does a link ask for the time-lapse? `tl=1` (and `tl=years`, which early links carried). */
export function timelapseParam(search: string): boolean {
  const v = new URLSearchParams(search).get('tl')
  return v === '1' || v === 'years'
}
