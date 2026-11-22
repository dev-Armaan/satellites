/**
 * Landsat 8/9's 15 m panchromatic band for one of the app's crops (GET /api/pan, api/pan.ts), from the Copernicus
 * Data Space Ecosystem's Sentinel Hub Process API (collection `landsat-ot-l1`, band B08). Planetary Computer's
 * Landsat Collection 2 Level-2 (what every photo is made from) has no pan band; Level-1 has, on the same scene
 * grid, so the pan pixels register exactly over the 30 m colour of the same capture.
 *
 * Only crops the app itself cuts are served (validated here), so the endpoint cannot be used as a general proxy for
 * the free CDSE quota: a 15 km square on the scene's UTM grid (whole 15 m pixels), 1000 px (its 15 m pixels 1:1),
 * within an hour of a capture from the last 120 days. And each crop has ONE spelling, the one `panQuery` writes
 * (whole numbers in plain digits, coordinates a UTM zone can hold): `t=…000.25`, `bbox=534060.0,…` and a box 90,000 km
 * north of the pole were all accepted once, each a new entry in the edge cache and a new request to CDSE for a
 * picture already held. The router caches under `panCacheQuery`, so an added parameter or another order is the same
 * entry too. The answer is an 8-bit grey PNG, square-root encoded
 * (v = 255·√(R / 0.64), R the top-of-atmosphere reflectance), so dark water keeps enough levels for the pan-sharpening
 * ratio; 0 is no data. Pure functions here; the handler (token, fetch, cache headers) is api/pan.ts.
 */

export const PAN_PX = 1000
export const PAN_SIDE_M = 15_000
export const PAN_GSD_M = 15
/** Reflectance at code 255 (√ encoding): bright desert and roofs stay below it; cloud and snow clip, harmlessly. */
export const PAN_TOP_REFL = 0.64
const WINDOW_MS = 60 * 60_000
const MAX_AGE_MS = 120 * 24 * 3_600_000

export interface PanRequest {
  box: [number, number, number, number]
  crs: number
  t: number
}

/** The query of /api/pan for a crop (the client builds it with this too: src/ui/results/lib/photos.ts). */
export function panQuery(box: readonly number[], crs: number, t: number): string {
  return `bbox=${box.map((v) => Math.round(v)).join(',')}&crs=${crs}&t=${Math.round(t)}`
}

const isUtm = (crs: number) => (crs >= 32601 && crs <= 32660) || (crs >= 32701 && crs <= 32760)

/** A whole number as `panQuery` writes it: plain digits, no exponent, no decimal point, no padding. */
const WHOLE = /^-?(0|[1-9]\d{0,14})$/
/**
 * Where a Landsat scene's grid can be, metres: eastings a zone and its overlap with its neighbours hold (a zone is
 * 100–900 km wide of its false easting's 500 km; scenes run past its edge), northings from pole to pole either side
 * of the equator (Landsat keeps a southern scene in the northern zone, at negative northings).
 */
const EASTING = [-200_000, 1_200_000] as const
const NORTHING = [-10_000_000, 10_000_000] as const

/** The request, or why it is refused (an app crop only, in its one spelling; see the header). */
export function parsePanQuery(q: URLSearchParams, now: number): PanRequest | string {
  const parts = (q.get('bbox') ?? '').split(',')
  if (parts.length !== 4 || !parts.every((v) => WHOLE.test(v))) return 'bbox'
  const box = parts.map(Number)
  if (box[2] - box[0] !== PAN_SIDE_M || box[3] - box[1] !== PAN_SIDE_M) return 'bbox size'
  if (box.some((v) => v % PAN_GSD_M !== 0)) return 'bbox grid'
  if (box[0] < EASTING[0] || box[2] > EASTING[1] || box[1] < NORTHING[0] || box[3] > NORTHING[1]) return 'bbox place'
  const crsRaw = q.get('crs') ?? ''
  const crs = Number(crsRaw)
  if (!WHOLE.test(crsRaw) || !isUtm(crs)) return 'crs'
  const tRaw = q.get('t') ?? ''
  const t = Number(tRaw)
  if (!WHOLE.test(tRaw) || t > now + WINDOW_MS || t < now - MAX_AGE_MS) return 't'
  return { box: box as PanRequest['box'], crs, t }
}

/**
 * The query one crop is cached under at the edge (worker/router.ts): `panQuery`'s own string, whatever order the
 * parameters came in and whatever else came with them. Null for a request that is refused (never cached).
 */
export function panCacheQuery(q: URLSearchParams, now: number): string | null {
  const r = parsePanQuery(q, now)
  return typeof r === 'string' ? null : panQuery(r.box, r.crs, r.t)
}

const EVALSCRIPT = `//VERSION=3
function setup() {
  return { input: [{ bands: ["B08", "dataMask"], units: ["REFLECTANCE", "DN"] }], output: { bands: 1, sampleType: "UINT8" } }
}
function evaluatePixel(s) {
  if (!s.dataMask) return [0]
  return [Math.max(1, Math.min(255, Math.round(255 * Math.sqrt(Math.max(0, s.B08) / ${PAN_TOP_REFL}))))]
}`

/** The Process API request for `r`: B08 only, the capture's own hour (no other scene mixed in), nearest-neighbour on the grid. */
export function processBody(r: PanRequest) {
  const iso = (ms: number) => new Date(ms).toISOString()
  return {
    input: {
      bounds: { bbox: r.box, properties: { crs: `http://www.opengis.net/def/crs/EPSG/0/${r.crs}` } },
      data: [
        {
          type: 'landsat-ot-l1',
          dataFilter: { timeRange: { from: iso(r.t - WINDOW_MS), to: iso(r.t + WINDOW_MS) }, mosaickingOrder: 'mostRecent' },
          processing: { upsampling: 'NEAREST', downsampling: 'NEAREST' },
        },
      ],
    },
    output: { width: PAN_PX, height: PAN_PX, responses: [{ identifier: 'default', format: { type: 'image/png' } }] },
    evalscript: EVALSCRIPT,
  }
}
