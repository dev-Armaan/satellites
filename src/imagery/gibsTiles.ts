/**
 * NASA GIBS's pre-cut map tiles, for one question: does this daily mosaic have pixels at the place?
 *
 * Why tiles and not a small WMS render (what the probe was until 2026-11-12): GIBS renders every WMS request on
 * demand, and a report asks about 35 mosaics. At 12 searches a minute that was nothing; at the 250 a minute of
 * 2026-11-12 it was 9,000 renders a minute (17,000 with the retries), and WMS answers went from 0.5 s to 5–45 s, for
 * us and for everyone else. A search's weather photos fell from a median of 32 to 4 within the half hour. The tiles
 * are what GIBS is built to serve in bulk (Worldview draws from them): measured that same evening, with WMS still
 * degraded, 640 tiles (16 places, 5 layers, 8 days) all answered, median 0.29 s, slowest 1.1 s, 16 kB each.
 *
 * So the probe reads the one web-mercator tile (256 px) that holds the place, and looks only at the window of it
 * within the probe's half-size of the place (`#win=x,y,w,h` on the URL: a fragment is never sent, so the URL stays the
 * request's canonical key and the pixels worker needs no second message). The window is clipped at the tile's edge
 * rather than read from a neighbour: one request per mosaic, and what is left is still within that distance of the
 * place. The zoom is the coarsest whose pixel is no larger than the WMS probe's was (2.5 km), so the window holds the
 * same ground at the same grain or finer.
 *
 * The tile service says more than WMS did: a day it has no image for (not processed yet, an instrument outage) is a
 * 404, not a black JPEG, and a tile with no data at the place is still black.
 *
 * Web-mercator tiles end at 85.05°: beyond that there is no tile, and the caller keeps the WMS probe.
 */
import type { LatLon } from '@/types'

export const GIBS_TILES = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best'
/** The matrix set of the daily true-colour layers (VIIRS and MODIS, 250 m): zoom 0–9. */
const DAILY_MATRIX_SET = 'GoogleMapsCompatible_Level9'
const MAX_ZOOM = 9
export const TILE_PX = 256
/** Past this latitude the place's tile is the mercator grid's last row or off it. */
export const TILE_MAX_LAT = 85
const EQUATOR_M = 40_075_016.686
const DEG = Math.PI / 180

/** A rectangle of a tile, in its pixels. */
export interface TileWindow {
  x: number
  y: number
  w: number
  h: number
}

export const isGibsTileUrl = (url: string) => url.startsWith(GIBS_TILES)

/**
 * The tile of a daily layer that holds `place` on `date` ("YYYY-MM-DD"), with the window within `halfSizeKm` of the
 * place as its fragment. `maxPixelKm` picks the zoom (the coarsest whose pixel is no larger).
 * Undefined beyond the mercator grid (|lat| > 85°).
 */
export function gibsProbeTileUrl(layer: string, date: string, place: LatLon, halfSizeKm: number, maxPixelKm: number): string | undefined {
  if (!(Math.abs(place.lat) <= TILE_MAX_LAT) || !Number.isFinite(place.lon)) return undefined
  const cos = Math.cos(place.lat * DEG)
  const z = Math.max(0, Math.min(MAX_ZOOM, Math.ceil(Math.log2((EQUATOR_M * cos) / (TILE_PX * maxPixelKm * 1000)))))
  const n = 2 ** z
  const fx = ((((place.lon + 180) % 360) + 360) % 360) / 360 * n
  const fy = ((1 - Math.asinh(Math.tan(place.lat * DEG)) / Math.PI) / 2) * n
  const col = Math.min(n - 1, Math.floor(fx))
  const row = Math.min(n - 1, Math.max(0, Math.floor(fy)))
  // The place inside its tile, and the probe's half-size, in tile pixels.
  const px = (fx - col) * TILE_PX
  const py = (fy - row) * TILE_PX
  const half = (halfSizeKm * 1000) / ((EQUATOR_M * cos) / (n * TILE_PX))
  const x0 = Math.max(0, Math.floor(px - half))
  const y0 = Math.max(0, Math.floor(py - half))
  const x1 = Math.min(TILE_PX, Math.ceil(px + half))
  const y1 = Math.min(TILE_PX, Math.ceil(py + half))
  return `${GIBS_TILES}/${encodeURIComponent(layer)}/default/${date}/${DAILY_MATRIX_SET}/${z}/${row}/${col}.jpg#win=${x0},${y0},${x1 - x0},${y1 - y0}`
}

/** The window a probe tile's URL names, if it names one. */
export function tileWindowOf(url: string): TileWindow | undefined {
  const m = /#win=(\d+),(\d+),(\d+),(\d+)$/.exec(url)
  if (!m) return undefined
  const [x, y, w, h] = m.slice(1).map(Number)
  return w > 0 && h > 0 ? { x, y, w, h } : undefined
}
