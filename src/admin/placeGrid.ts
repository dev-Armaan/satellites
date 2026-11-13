/**
 * The admin map's geometry: searched 0.1° cells gathered onto a coarse lat/lon grid, one dot per grid square.
 *
 * Why a grid and no base map: plotted one circle per cell, a busy week is a solid blob over Europe and the US, and the
 * picture underneath it carries nothing the dots do not. On a regular grid every dot has its own square, so sizes can be
 * compared, and the continents draw themselves out of where people looked.
 *
 * A dot's radius grows with the logarithm of its searches (one place has 10,000 while most squares have a handful: by
 * area the handfuls would vanish), and the legend draws that scale with real counts beside it, so the map never claims
 * to be proportional. The largest dot exactly fills its square.
 */
import type { Ranked } from './api'

/** Grid square, degrees. 2.5° is 144 × 72 squares: a dot about 7 px wide on a laptop, small enough to draw coastlines. */
export const GRID_STEP = 2.5

export interface PlaceDot {
  /** Centre in map units: x = degrees east of 180°W, y = degrees south of 90°N */
  x: number
  y: number
  n: number
}

export interface PlaceGrid {
  dots: PlaceDot[]
  /** Searches in the busiest square (at least 1) */
  max: number
  /** Cells that had a readable position */
  cells: number
  /** The band of y the map has to show: the inhabited latitudes, widened to whatever was actually searched */
  top: number
  bottom: number
}

export function placeGrid(cells: Ranked | undefined, step = GRID_STEP): PlaceGrid {
  const cols = Math.round(360 / step)
  const rows = Math.round(180 / step)
  const bins = new Map<number, number>()
  let count = 0
  for (const [c, n] of cells ?? []) {
    const [lat, lon] = c.split(',').map(Number)
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180 || !(n > 0)) continue
    const i = Math.min(cols - 1, Math.floor((lon + 180) / step))
    const j = Math.min(rows - 1, Math.floor((90 - lat) / step))
    bins.set(j * cols + i, (bins.get(j * cols + i) ?? 0) + n)
    count++
  }
  // Largest first, so where two dots meet the smaller one is drawn on top and neither hides.
  const dots = [...bins].map(([k, n]) => ({ x: ((k % cols) + 0.5) * step, y: (Math.floor(k / cols) + 0.5) * step, n })).sort((a, b) => b.n - a.n)
  let top = 10 // 80°N
  let bottom = 150 // 60°S
  for (const d of dots) {
    top = Math.min(top, d.y - step)
    bottom = Math.max(bottom, d.y + step)
  }
  return { dots, max: Math.max(1, ...dots.map((d) => d.n)), cells: count, top: Math.max(0, top), bottom: Math.min(180, bottom) }
}

/** 0–1: where n sits between nothing and the busiest square, on the log scale the legend shows. */
export const dotLevel = (n: number, max: number): number => (max > 1 ? Math.min(1, Math.log1p(Math.max(0, n)) / Math.log1p(max)) : 1)

/** Radius in map units. The busiest square's dot touches its square's edges; one search is still a visible point. */
export function dotRadius(n: number, max: number, step = GRID_STEP): number {
  return step * (0.12 + 0.38 * dotLevel(n, max) ** 1.35)
}

/** Counts worth drawing in the legend: 1, 100, 10,000… below the maximum, then the maximum itself. */
export function legendCounts(max: number): number[] {
  const out: number[] = []
  for (let v = 1; v * 3 < max; v *= 100) out.push(v)
  return [...out, max]
}
