/**
 * GET /api/geo?layer=…&time=…&lat=…&lon=…&px=…  — a place's small Meteosat picture, cut from the frame cache.
 *
 * The 800 km square around the place at one stored frame, `px` wide (16–176: the watcher list's frame and the list
 * thumbnails), as a JPEG. It is cut from tiles the fill stored (_lib/geoFill.ts, _lib/geoCut.ts): no request goes to
 * EUMETSAT, whatever the traffic, which is what its User Service Helpdesk asked for (2026-11-17). Black where the
 * frame has nothing (off the disc, a daylight product in the dark), as EUMETSAT's own render is, so the app's
 * emptiness check reads both the same way.
 *
 * A cut depends on its URL alone, so it is kept by the browser for a week and in Cloudflare's cache for an hour
 * (worker/router.ts `cached`): a place many people search is cut once per data centre and frame. A cut took about
 * 20 ms on one core of a local Worker, tile reads included (9 ms of it the JPEG encode; 1,500 different places in
 * 30 s without an error, 2026-11-17), and reads one to six tiles, most of them from Cloudflare's cache, which is free.
 *
 *   200  image/jpeg
 *   302  a real frame time the cache does not hold (a frame shared days ago, a tab left open for hours): to
 *        EUMETSAT's own render of the same square, asked by that visitor's browser. Rare: the app asks only for
 *        frames the cache lists (api/geo-frames.ts).
 *   400  not an app picture · 404 a time that is not a frame's · 405
 *   503  the store is missing (local dev without the Worker), unreadable, or lacks a tile it should have.
 *        Never a redirect then: a broken cache must not send every visitor to EUMETSAT.
 */
import { cutSquare, tilesOf } from './_lib/geoCut.js'
import { GEOSERVER, findFrame } from './_lib/geoFill.js'
import { CACHE_LAYERS, CUT_HALF_KM, CUT_MAX_PX, CUT_MIN_PX, hasTile, isoSecond, squareAround, tileKey, windowAround } from './_lib/geoGrid.js'
import { loadFrames, loadTile, plain, type GeoServe } from './_lib/geoServe.js'

const TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00Z$/
const NUMBER = /^-?\d{1,3}(\.\d{1,6})?$/

/** EUMETSAT's own render of the same square: where a frame the cache does not hold is found. */
function eumetsatUrl(layer: string, t: number, lat: number, lon: number, px: number): string {
  const [w, s, e, n] = squareAround(lat, lon, CUT_HALF_KM)
  const la = (v: number) => Math.max(-90, Math.min(90, v)).toFixed(5)
  return (
    `${GEOSERVER}/wms?service=WMS&version=1.3.0&request=GetMap&layers=${encodeURIComponent(layer)}&styles=` +
    `&format=${encodeURIComponent('image/jpeg')}&crs=EPSG:4326&bbox=${la(s)},${w.toFixed(5)},${la(n)},${e.toFixed(5)}` +
    `&width=${px}&height=${px}&bgcolor=0x000000&time=${encodeURIComponent(isoSecond(t))}`
  )
}

export async function handleGeo(req: Request, deps: GeoServe | null): Promise<Response> {
  if (req.method !== 'GET') return plain(405, 'no-store')
  const url = new URL(req.url)
  const q = url.searchParams
  const l = CACHE_LAYERS[q.get('layer') ?? '']
  const time = q.get('time') ?? ''
  const px = Number(q.get('px'))
  const lat = Number(q.get('lat'))
  const lon = Number(q.get('lon'))
  if (!l || !TIME.test(time) || !NUMBER.test(q.get('lat') ?? '') || !NUMBER.test(q.get('lon') ?? '') || !Number.isInteger(px)) return plain(400, 'public, max-age=86400')
  const t = Date.parse(time)
  if (!Number.isFinite(t) || px < CUT_MIN_PX || px > CUT_MAX_PX || Math.abs(lat) > 90 || Math.abs(lon) > 180) return plain(400, 'public, max-age=86400')
  if (!deps) return plain(503, 'no-store')
  const now = (deps.now ?? Date.now)()
  try {
    const frame = findFrame(await loadFrames(deps, url.origin), l.layer, t, now) ?? findFrame(await loadFrames(deps, url.origin, true), l.layer, t, now)
    if (!frame) {
      // Only a time a frame can have: on the layer's own cadence, in the past.
      if (t > now || t % (l.stepMin * 60_000) !== 0) return plain(404, 'public, max-age=300')
      return new Response(null, { status: 302, headers: { location: eumetsatUrl(l.layer, t, lat, lon, px), 'cache-control': 'public, max-age=60' } })
    }
    const win = windowAround(l, lat, lon)
    const have = tilesOf(win, px).filter(([r, c]) => hasTile(frame.tiles, r, c))
    const tiles = new Map<string, Uint8Array>()
    const loaded = await Promise.all(have.map(([r, c]) => loadTile(deps, url.origin, tileKey(l.layer, t, r, c))))
    for (const [i, [r, c]] of have.entries()) {
      const data = loaded[i]
      // Listed, but not (or no longer) in the store: better no picture than one with a black quarter.
      if (!data) return plain(503, 'no-store')
      tiles.set(`${r}_${c}`, data)
    }
    const jpeg = await deps.encode(cutSquare((r, c) => tiles.get(`${r}_${c}`) ?? null, win, px), px, px)
    return new Response(jpeg, { status: 200, headers: { 'content-type': 'image/jpeg', 'cache-control': 'public, max-age=604800, s-maxage=3600, immutable' } })
  } catch (err) {
    console.error('[geo] cut failed', err)
    return plain(503, 'no-store')
  }
}
