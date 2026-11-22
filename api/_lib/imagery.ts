/**
 * The real pixels for a share card: a square crop of the archived scene, centred on the place.
 *
 * Sentinel-2 / Landsat crops use the encoded render and the tone every renderer shares (./tone.ts: the same
 * Planetary Computer request recipe, the same curve measured over the same square, the same mask), so the card
 * shows the pixels the app showed. Sentinel-1 radar crops likewise (./radar.ts: the same decibel render, the same
 * per-image stretch). GIBS mirrors src/imagery/endpoints.ts (WMS axis order); it is duplicated, not
 * imported, because api/ is bundled separately from the browser app.
 */
import { decode as decodeJpeg, encode as encodeJpeg } from 'jpeg-js'
import type { ShareCapture } from './share.js'
import { maskFromResponse, pcCropUrlAt, toneCrop, tonePlanForUrl, type ToneMask } from './tone.js'
import { isRadarUrl, radarCropUrlAt, radarPolOfItemId, toneRadar } from './radar.js'
import { frameRedrawFor } from './infrared.js'
import { GEO_HALF_KM, isGeoCollection } from './cardSpec.js'
import { CACHE_LAYERS } from './geoGrid.js'

const GIBS_WMS = 'https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi'
const EUMETSAT_WMS = 'https://view.eumetsat.int/geoserver/wms'
const EARTH_RADIUS_KM = 6371
const DEG = Math.PI / 180

/** GIBS layer per collection, for captures whose itemId doesn't spell it out. */
const GIBS_LAYER: Partial<Record<ShareCapture['collection'], string>> = {
  'gibs-viirs-noaa20': 'VIIRS_NOAA20_CorrectedReflectance_TrueColor',
  'gibs-viirs-noaa21': 'VIIRS_NOAA21_CorrectedReflectance_TrueColor',
  'gibs-viirs-snpp': 'VIIRS_SNPP_CorrectedReflectance_TrueColor',
  'gibs-modis-terra': 'MODIS_Terra_CorrectedReflectance_TrueColor',
  'gibs-modis-aqua': 'MODIS_Aqua_CorrectedReflectance_TrueColor',
  'gibs-goes-east': 'GOES-East_ABI_GeoColor',
  'gibs-goes-west': 'GOES-West_ABI_GeoColor',
  'gibs-himawari': 'Himawari_AHI_Band3_Red_Visible_1km',
}

/**
 * The map layers a geostationary frame may come from, by collection (src/imagery/geoFrames.ts GEO_FRAMES: the
 * daylight product and, where there is one, the infrared band shown at night). The item id names the layer, so a
 * shared frame is the band that was shared; anything else is refused.
 */
const GEO_LAYERS: Partial<Record<ShareCapture['collection'], readonly string[]>> = {
  'gibs-goes-east': ['GOES-East_ABI_GeoColor'],
  'gibs-goes-west': ['GOES-West_ABI_GeoColor'],
  'gibs-himawari': ['Himawari_AHI_Band3_Red_Visible_1km', 'Himawari_AHI_Band13_Clean_Infrared'],
  'eumetsat-meteosat-0deg': ['mtg_fd:rgb_geocolour'],
  'eumetsat-meteosat-iodc': ['msg_iodc:rgb_naturalenhncd', 'msg_iodc:ir108'],
}

/** The crop is EUMETSAT's own render: its map service, which the site must ask as little as it can (CLAUDE.md). */
export const asksEumetsat = (plan: Pick<CropPlan, 'url'>) => plan.url.startsWith(EUMETSAT_WMS)

/**
 * A Meteosat frame's item id ("<layer>@<ISO time>") names a time a frame can have: one of the layers the app shows,
 * on that layer's own cadence, not in the future. Anything else is no frame, so there is nothing to ask for.
 */
export function isMeteosatFrame(itemId: string, now: number): boolean {
  const [layer, at] = itemId.split('@')
  const l = CACHE_LAYERS[layer ?? '']
  const t = Date.parse(at ?? '')
  return !!l && Number.isFinite(t) && t <= now && t % (l.stepMin * 60_000) === 0
}

/** Native ground sample distance by collection, metres (used when the capture omits it). */
const NATIVE_GSD_M: Record<ShareCapture['collection'], number> = {
  'sentinel-2-l2a': 10,
  'landsat-c2-l2': 30,
  'gibs-viirs-noaa20': 375,
  'gibs-viirs-noaa21': 375,
  'gibs-viirs-snpp': 375,
  'gibs-modis-terra': 250,
  'gibs-modis-aqua': 250,
  'gibs-goes-east': 1000,
  'gibs-goes-west': 1000,
  'gibs-himawari': 1000,
  // Sentinel-1 radar: its resolution (20 × 22 m), the app's 20 m a pixel
  'sentinel-1-rtc': 20,
  // The Meteosats on EUMETSAT's map grid (measured: 1.6 km and 4.6 km)
  'eumetsat-meteosat-0deg': 2000,
  'eumetsat-meteosat-iodc': 5000,
}

/** Square [minLon, minLat, maxLon, maxLat] of half-size km around a point (as src/lib/geo.ts). */
export function bboxAround(lat: number, lon: number, halfKm: number): [number, number, number, number] {
  const dLat = (halfKm / EARTH_RADIUS_KM) * (180 / Math.PI)
  const dLon = dLat / Math.max(0.01, Math.cos(lat * DEG))
  return [lon - dLon, lat - dLat, lon + dLon, lat + dLat]
}

/** True for Planetary Computer Sentinel-2 L2A item ids (Earth Search ids can't be cropped). */
export function isPcS2ItemId(id: string): boolean {
  return /^S2[A-Z]_MSIL2A_\d{8}T\d{6}_R\d{3}_T\d{2}[A-Z]{3}_\d{8}T\d{6}$/.test(id)
}

const LANDSAT_ID_RE = /^L[COTE]0\d_L2S[PR]_\d{6}_\d{8}_\d{2}_[A-Z0-9]{2}$/

export interface CropPlan {
  url: string
  /** Half the side of the square on the ground, km */
  halfSizeKm: number
  /** Metres per output pixel */
  metresPerPx: number
  /** "SENTINEL-2 L2A" */
  source: string
}

/**
 * Plan the crop for a capture at a place, sized as the card's crop (cardSpec cardCrop): one output pixel is one
 * native pixel for Sentinel-2 (a 6.3 km square at 630 px), 15 m for Landsat (an exact 2× of its 30 m). On the
 * place's UTM grid (toneRender placeGrid, from the place alone: nothing to look up): the same URL the app builds for
 * the card (src/ui/share/card.ts cropUrlFor), whose pixels are the app photo's own. Null if the capture can't be
 * cropped.
 */
export function cropPlan(capture: ShareCapture, lat: number, lon: number, px: number): CropPlan | null {
  const gsd = NATIVE_GSD_M[capture.collection] ?? capture.gsdM ?? 10
  // Landsat's 30 m is soft at 1:1 on a phone; render at 15 m/px (an exact 2×) so the card still reads as detail.
  const metresPerPx = capture.collection === 'landsat-c2-l2' ? 15 : gsd
  const halfSizeKm = Math.max(2, (metresPerPx * px) / 2000)
  const [w, s, e, n] = bboxAround(lat, lon, halfSizeKm)

  if (capture.collection === 'sentinel-2-l2a' || capture.collection === 'landsat-c2-l2') {
    if (capture.collection === 'sentinel-2-l2a' && !isPcS2ItemId(capture.itemId)) return null
    if (capture.collection === 'landsat-c2-l2' && !LANDSAT_ID_RE.test(capture.itemId)) return null
    return {
      // JPEG: the app's photos are JPEG renders too (and it is ~1/7 of the PNG); toned by fetchCropDataUri.
      url: pcCropUrlAt(capture.collection, capture.itemId, lat, lon, halfSizeKm, px, 'jpg'),
      halfSizeKm,
      metresPerPx,
      source: capture.collection === 'sentinel-2-l2a' ? 'SENTINEL-2 L2A' : 'LANDSAT C2 L2',
    }
  }

  if (capture.collection === 'sentinel-1-rtc') {
    const pol = radarPolOfItemId(capture.itemId)
    if (!pol) return null
    // 630 px of 20 m (12.6 km): the app's card is cut at the same scale from its 20 m picture.
    return { url: radarCropUrlAt(capture.itemId, pol, lat, lon, halfSizeKm, px, 'jpg'), halfSizeKm, metresPerPx, source: 'SENTINEL-1 RADAR' }
  }

  // A geostationary frame: "<layer>@<ISO time>", the app's own 800 km square (cardSpec cardCrop), from NASA GIBS or
  // EUMETSAT's map service. Both cut in lon/lat; EUMETSAT is asked for black where it has no data, as the app asks.
  if (isGeoCollection(capture.collection)) {
    const [geoLayer, at] = capture.itemId.split('@')
    if (!GEO_LAYERS[capture.collection]?.includes(geoLayer) || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(at ?? '')) return null
    const [gw, gs, ge, gn] = bboxAround(lat, lon, GEO_HALF_KM)
    const lat5g = (v: number) => Math.max(-90, Math.min(90, v)).toFixed(5)
    const box = `${lat5g(gs)},${gw.toFixed(5)},${lat5g(gn)},${ge.toFixed(5)}`
    const url = capture.collection.startsWith('eumetsat-')
      ? `${EUMETSAT_WMS}?service=WMS&version=1.3.0&request=GetMap&layers=${encodeURIComponent(geoLayer)}&styles=&format=image%2Fjpeg&crs=EPSG:4326` +
        `&bbox=${box}&width=${px}&height=${px}&bgcolor=0x000000&time=${encodeURIComponent(at)}`
      : `${GIBS_WMS}?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&LAYERS=${encodeURIComponent(geoLayer)}&STYLES=` +
        `&FORMAT=image%2Fjpeg&CRS=EPSG:4326&BBOX=${box}&WIDTH=${px}&HEIGHT=${px}&TIME=${encodeURIComponent(at)}`
    return { url, halfSizeKm: GEO_HALF_KM, metresPerPx: (2 * GEO_HALF_KM * 1000) / px, source: capture.collection.startsWith('eumetsat-') ? 'EUMETSAT METEOSAT' : geoLayer.split('_').slice(0, 2).join(' ').toUpperCase() }
  }

  // GIBS: itemId is "<layer>@<YYYY-MM-DD or ISO time>".
  const [layerRaw, time] = capture.itemId.split('@')
  const layer = GIBS_LAYER[capture.collection]
  if (!layer || !time || (layerRaw && layerRaw !== layer) || !/^\d{4}-\d{2}-\d{2}(T[\d:.]+Z?)?$/.test(time)) return null
  const lat5 = (v: number) => Math.max(-90, Math.min(90, v)).toFixed(5)
  return {
    url:
      `${GIBS_WMS}?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&LAYERS=${encodeURIComponent(layer)}&STYLES=` +
      `&FORMAT=image%2Fjpeg&CRS=EPSG:4326&BBOX=${lat5(s)},${w.toFixed(5)},${lat5(n)},${e.toFixed(5)}` +
      `&WIDTH=${px}&HEIGHT=${px}&TIME=${encodeURIComponent(time)}`,
    halfSizeKm,
    metresPerPx,
    source: layer.split('_').slice(0, 2).join(' ').toUpperCase(),
  }
}

/**
 * Fetch an image and return it as a data URI satori can embed. Null on timeout, HTTP error,
 * a non-image response, or a suspiciously tiny body (PC returns a ~100-byte PNG for "no data").
 */
export async function fetchImageDataUri(url: string, timeoutMs: number): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs), headers: { accept: 'image/png,image/jpeg' } })
    if (!res.ok) return null
    const type = (res.headers.get('content-type') ?? '').split(';')[0].trim()
    if (type !== 'image/png' && type !== 'image/jpeg') return null
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.byteLength < 1024 || buf.byteLength > 8_000_000) return null
    return `data:${type};base64,${buf.toString('base64')}`
  } catch {
    return null
  }
}

// ── Toned Sentinel-2 / Landsat plates ─────────────────────────────────────────────────────────

/** Fetch bytes; null on timeout, HTTP error or an unexpected content type. */
async function fetchBytes(url: string, timeoutMs: number, types: string[]): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) })
    if (!res.ok) return null
    const type = (res.headers.get('content-type') ?? '').split(';')[0].trim()
    if (types.length && !types.includes(type)) return null
    return Buffer.from(await res.arrayBuffer())
  } catch {
    return null
  }
}

/** A card plate's picture, and whether it is the final one (its tone could use the capture's cloud mask). */
export interface CropPicture {
  dataUri: string
  /**
   * False when a Sentinel-2 / Landsat crop was toned without its mask (the mask request failed or was slow): its white
   * point then counts cloud and may differ from the app's photo, so the card must not be cached as final.
   */
  complete: boolean
}

/**
 * A card plate's picture as a data URI satori can embed. Sentinel-2 / Landsat crops are toned as the app tones its
 * photos (./tone.ts: the shared mask, the curve measured over this very square, the same unsharp mask on a crop on
 * the place's grid: see below), then sent as a high-quality JPEG; anything else is embedded as fetched. Null on
 * timeout, HTTP error, a non-image answer or a suspiciously tiny body (PC returns a ~100-byte image for "no data").
 */
export async function fetchCropPicture(url: string, timeoutMs: number): Promise<CropPicture | null> {
  if (isRadarUrl(url)) return fetchRadarPicture(url, timeoutMs)
  const redraw = frameRedrawFor(url)
  if (redraw) return fetchRedrawnPicture(url, timeoutMs, redraw)
  const plan = tonePlanForUrl(url)
  if (!plan) {
    const dataUri = await fetchImageDataUri(url, timeoutMs)
    return dataUri ? { dataUri, complete: true } : null
  }
  const [img, maskBytes] = await Promise.all([
    fetchBytes(url, timeoutMs, ['image/jpeg', 'image/jpg', 'image/png']),
    fetchBytes(plan.maskUrl, Math.min(timeoutMs, 8_000), []),
  ])
  if (!img || img.byteLength < 1024 || img.byteLength > 8_000_000) return null
  let mask: ToneMask | null = null
  try {
    mask = maskBytes ? maskFromResponse(plan.maskUrl, new Uint8Array(maskBytes)) : null
  } catch {
    mask = null // an unreadable mask: the curve uses every pixel
  }
  try {
    const raw = decodeJpeg(img, { useTArray: true, formatAsRGBA: true, maxMemoryUsageInMB: 256 })
    // On the place's grid the app's card is 630 of its photo's own pixels, sharpened as the photo is (an unsharp mask
    // of ~0.6 native px): this crop is the same pixels at the same scale, so it gets the same sharpening, or the
    // shared card is visibly softer than the in-app one (measured, Berlin: Laplacian 48 vs the app's 60; sharpened 60).
    // A lon/lat plate (beyond UTM's latitudes) stays unsharpened: the app resamples its cut from a larger photo there.
    toneCrop(raw.data, raw.width, raw.height, plan, mask, undefined, { sharpen: plan.crs === 4326 ? 0 : 1 })
    const out = encodeJpeg({ data: raw.data, width: raw.width, height: raw.height }, 95)
    return { dataUri: `data:image/jpeg;base64,${Buffer.from(out.data).toString('base64')}`, complete: mask !== null }
  } catch {
    return null
  }
}

/** A radar crop toned as the app tones it (./radar.ts toneRadar), as a JPEG data URI; null without data. */
async function fetchRadarPicture(url: string, timeoutMs: number): Promise<CropPicture | null> {
  const img = await fetchBytes(url, timeoutMs, ['image/jpeg', 'image/jpg', 'image/png'])
  if (!img || img.byteLength < 1024 || img.byteLength > 8_000_000) return null
  try {
    const raw = decodeJpeg(img, { useTArray: true, formatAsRGBA: true, maxMemoryUsageInMB: 256 })
    if (!toneRadar(raw.data, raw.width, raw.height)) return null
    const out = encodeJpeg({ data: raw.data, width: raw.width, height: raw.height }, 95)
    return { dataUri: `data:image/jpeg;base64,${Buffer.from(out.data).toString('base64')}`, complete: true }
  } catch {
    return null
  }
}

/** A weather frame the app redraws before showing (./infrared.ts), redrawn the same way, as a JPEG data URI. */
async function fetchRedrawnPicture(url: string, timeoutMs: number, redraw: (rgba: Uint8Array) => void): Promise<CropPicture | null> {
  const img = await fetchBytes(url, timeoutMs, ['image/jpeg', 'image/jpg'])
  if (!img || img.byteLength < 1024 || img.byteLength > 8_000_000) return null
  try {
    const raw = decodeJpeg(img, { useTArray: true, formatAsRGBA: true, maxMemoryUsageInMB: 256 })
    redraw(raw.data)
    const out = encodeJpeg({ data: raw.data, width: raw.width, height: raw.height }, 92)
    return { dataUri: `data:image/jpeg;base64,${Buffer.from(out.data).toString('base64')}`, complete: true }
  } catch {
    return null
  }
}

/** The plate's picture as a data URI (see fetchCropPicture), or null. */
export async function fetchCropDataUri(url: string, timeoutMs: number): Promise<string | null> {
  return (await fetchCropPicture(url, timeoutMs))?.dataUri ?? null
}
