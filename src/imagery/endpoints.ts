/**
 * Endpoints and pure URL builders for the public archives (see docs/ARCHITECTURE.md, "Data sources").
 * Everything here is synchronous and side-effect free so it can be unit tested exactly. The first screen imports
 * this module (the geocoder's host), so it carries no grid arithmetic: the Sentinel-2 / Landsat crop and mask URLs
 * are ./pcCrop.ts.
 */
import { bboxAround } from '@/lib/geo'
import type { LatLon } from '@/types'

export const PC_STAC_SEARCH = 'https://planetarycomputer.microsoft.com/api/stac/v1/search'
export const PC_DATA = 'https://planetarycomputer.microsoft.com/api/data/v1'
export const ES_STAC_SEARCH = 'https://earth-search.aws.element84.com/v1/search'
export const GIBS_WMS = 'https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi'
export const GIBS_WMTS = 'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/1.0.0'
export const WORLDVIEW = 'https://worldview.earthdata.nasa.gov/'
/** EUMETSAT's public map service (EUMETView), a GeoServer: Meteosat frames (./eumetsat.ts). */
export const EUMETSAT_GEOSERVER = 'https://view.eumetsat.int/geoserver'
export const EUMETSAT_WMS = `${EUMETSAT_GEOSERVER}/ows`
export const PHOTON = 'https://photon.komoot.io'
/** OSM's own geocoder: reverse lookups only, as Photon's backup (./geocode.ts reversePlace). */
export const NOMINATIM = 'https://nominatim.openstreetmap.org'

export type StacCollection = 'sentinel-2-l2a' | 'landsat-c2-l2'

export interface CropOpts {
  /** Half the side of the square crop, km */
  halfSizeKm: number
  /** Output width = height, px */
  px: number
  /** In lon/lat (EPSG:4326), not on the place's UTM grid: the globe's decals */
  geographic?: boolean
}

/** Clamp to what the renderers accept and what's sensible to ask a free service for. */
export function sanitizeCrop({ halfSizeKm, px }: CropOpts): CropOpts {
  const h = Number.isFinite(halfSizeKm) && halfSizeKm > 0 ? halfSizeKm : 3
  const p = Number.isFinite(px) ? Math.round(px) : 512
  return { halfSizeKm: Math.min(h, 2000), px: Math.min(2048, Math.max(8, p)) }
}

/** Human-facing map of one PC item (HTML). */
export function pcItemMapUrl(collection: StacCollection, itemId: string): string {
  return `${PC_DATA}/item/map?collection=${collection}&item=${encodeURIComponent(itemId)}`
}

/**
 * NASA GIBS WMS 1.3.0 GetMap in EPSG:4326. **Axis order for EPSG:4326 in WMS 1.3.0 is lat,lon**,
 * so BBOX is minLat,minLon,maxLat,maxLon. The bbox is square in km, so a px×px image comes back
 * with ground-square pixels (the server stretches longitude for us).
 */
export function gibsWmsUrl(layer: string, time: string, place: LatLon, opts: CropOpts, format: 'image/jpeg' | 'image/png' = 'image/jpeg'): string {
  const { halfSizeKm, px } = sanitizeCrop(opts)
  const [w, s, e, n] = bboxAround(place.lat, place.lon, halfSizeKm)
  const lat = (v: number) => Math.max(-90, Math.min(90, v)).toFixed(5)
  const lon = (v: number) => v.toFixed(5)
  return (
    `${GIBS_WMS}?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&LAYERS=${encodeURIComponent(layer)}&STYLES=` +
    `&FORMAT=${encodeURIComponent(format)}&CRS=EPSG:4326` +
    `&BBOX=${lat(s)},${lon(w)},${lat(n)},${lon(e)}&WIDTH=${px}&HEIGHT=${px}&TIME=${encodeURIComponent(time)}`
  )
}

/**
 * GIBS WMTS DescribeDomains: the exact time domain GIBS publishes for a layer within [start, end],
 * e.g. `2026-11-08T02:50:00Z/2026-11-08T05:20:00Z/PT10M` (comma-separated, gaps left out).
 * CORS `*`, ~0.2 s. The tile matrix set only has to be one GIBS accepts; it doesn't change the
 * answer. Times are ISO instants without milliseconds.
 */
export function gibsDomainsUrl(layer: string, tileMatrixSet: string, startIso: string, endIso: string): string {
  return `${GIBS_WMTS}/${encodeURIComponent(layer)}/default/${encodeURIComponent(tileMatrixSet)}/all/${startIso}--${endIso}.xml`
}

/** NASA Worldview deep link: the same layer, day and region, in a human map viewer. */
export function worldviewUrl(layer: string, date: string, place: LatLon, halfSizeKm = 400): string {
  const [w, s, e, n] = bboxAround(place.lat, place.lon, halfSizeKm)
  const f = (v: number) => v.toFixed(4)
  return `${WORLDVIEW}?v=${f(w)},${f(s)},${f(e)},${f(n)}&l=${encodeURIComponent(layer)},Coastlines_15m&t=${encodeURIComponent(date)}`
}
