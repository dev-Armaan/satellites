/**
 * GET /api/geo-frames  — the Meteosat frames the cache can cut pictures from: per layer, its newest four frame
 * times (ms), newest first.
 *
 *   { "v": 1, "layers": { "mtg_fd:rgb_geocolour": [1794930000000, …], "msg_iodc:ir108": […], … } }
 *
 * The app asked EUMETSAT for this (one capabilities document per layer, per visitor); now the fill reads those
 * documents on a timer (_lib/geoFill.ts) and every visitor reads this one answer, kept a minute by the browser and by
 * Cloudflare's cache. A frame is listed two minutes after its last tile is stored and stops being listed while it can
 * still be cut for ten minutes more, so a listed frame is always one api/geo.ts can serve. A layer with nothing
 * stored lists nothing: the app then shows no frame for it, and asks nobody else.
 *
 *   200  application/json · 405 · 503 the store is missing (local dev without the Worker) or unreadable
 */
import { listedFrames } from './_lib/geoFill.js'
import { CACHE_LAYERS } from './_lib/geoGrid.js'
import { loadFrames, plain, type GeoServe } from './_lib/geoServe.js'

export async function handleGeoFrames(req: Request, deps: GeoServe | null): Promise<Response> {
  if (req.method !== 'GET') return plain(405, 'no-store')
  if (!deps) return plain(503, 'no-store')
  try {
    const now = (deps.now ?? Date.now)()
    const doc = await loadFrames(deps, new URL(req.url).origin)
    const layers = Object.fromEntries(Object.keys(CACHE_LAYERS).map((layer) => [layer, listedFrames(doc, layer, now)]))
    return new Response(JSON.stringify({ v: 1, layers }), { status: 200, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=60, s-maxage=60' } })
  } catch (err) {
    console.error('[geo] frame list failed', err)
    return plain(503, 'no-store')
  }
}
