/**
 * Whether the time-lapse is open, and how it was asked for. A store of its own, outside the time-lapse's chunk: the
 * results screen, the photo viewer and a `?tl=` link all open it, and none of them should load the player (or the
 * frame selection behind it) before someone asks. The player's chunk is fetched when `open` is first set.
 */
import { create } from 'zustand'
import type { TimelapseMode } from '@/imagery/timelapse'

/** Where it was opened from: the results' row, the photo viewer, or a link that carries `tl`. */
export type TimelapseFrom = 'results' | 'viewer' | 'link'

interface TimelapseUi {
  open: { mode: TimelapseMode; from: TimelapseFrom } | null
  /** A `?tl=` link's request, waiting for the report it belongs to */
  pending: TimelapseMode | null
  show: (from: TimelapseFrom, mode?: TimelapseMode) => void
  setMode: (mode: TimelapseMode) => void
  close: () => void
  request: (mode: TimelapseMode | null) => void
}

export const useTimelapseUi = create<TimelapseUi>((set) => ({
  open: null,
  pending: null,
  show: (from, mode = 'years') => set({ open: { mode, from }, pending: null }),
  setMode: (mode) => set((s) => (s.open ? { open: { ...s.open, mode } } : s)),
  close: () => set({ open: null }),
  request: (pending) => set({ pending }),
}))

/** `tl` of a link: `years` (also `1`) or `seasons`; anything else is no request. */
export function timelapseParam(search: string): TimelapseMode | null {
  const v = new URLSearchParams(search).get('tl')
  return v === 'seasons' ? 'seasons' : v === 'years' || v === '1' ? 'years' : null
}
