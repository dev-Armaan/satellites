/**
 * Cloudflare Worker entry: the whole site.
 *
 * The handlers in api/ already take a Request and return a Response, so the Worker routes to them (router.ts) and
 * hands them the files Node would read from disk: the card fonts, the default plate and the WebAssembly the
 * renderer runs. Those are imported here, which makes wrangler bundle them (fonts and images as bytes, WebAssembly
 * compiled), and registered before the first request (api/_lib/bundled.ts). Static files come from `dist/`
 * through the ASSETS binding (wrangler.jsonc).
 *
 * The Worker also keeps the Meteosat frame cache: `scheduled`
 * runs the fill once a minute (api/_lib/geoFill.ts), into the GEO_FRAMES KV namespace, and /api/geo and
 * /api/geo-frames read it. Without that binding (a fork that has not deployed yet) the two answer 503 and the fill
 * does nothing.
 */
import yoga from '../node_modules/satori/yoga.wasm'
import resvg from '../node_modules/@resvg/resvg-wasm/index_bg.wasm'
import displayLatin from '../api/_fonts/display-latin.ttf'
import displayLatinExt from '../api/_fonts/display-latin-ext.ttf'
import sansLatin from '../api/_fonts/sans-latin.ttf'
import sansLatinExt from '../api/_fonts/sans-latin-ext.ttf'
import monoLatin from '../api/_fonts/mono-latin.ttf'
import monoLatinExt from '../api/_fonts/mono-latin-ext.ttf'
import monoMediumLatin from '../api/_fonts/mono-medium-latin.ttf'
import serifItalicLatin from '../api/_fonts/serif-italic-latin.ttf'
import serifItalicLatinExt from '../api/_fonts/serif-italic-latin-ext.ttf'
import displayCyrillic from '../api/_fonts/display-cyrillic.ttf'
import sansCyrillic from '../api/_fonts/sans-cyrillic.ttf'
import monoCyrillic from '../api/_fonts/mono-cyrillic.ttf'
import serifItalicCyrillic from '../api/_fonts/serif-italic-cyrillic.ttf'
import displayVietnamese from '../api/_fonts/display-vietnamese.ttf'
import sansVietnamese from '../api/_fonts/sans-vietnamese.ttf'
import monoVietnamese from '../api/_fonts/mono-vietnamese.ttf'
import serifItalicVietnamese from '../api/_fonts/serif-italic-vietnamese.ttf'
import plate from '../api/_assets/og-default-plate.jpg'
import mozjpegDecoder from '../node_modules/@jsquash/jpeg/codec/dec/mozjpeg_dec.wasm'
import mozjpegEncoder from '../node_modules/@jsquash/jpeg/codec/enc/mozjpeg_enc.wasm'
import { registerBundled } from '../api/_lib/bundled.js'
import { runFill, type GeoStore } from '../api/_lib/geoFill.js'
import type { GeoServe } from '../api/_lib/geoServe.js'
import { handleEvents } from '../api/e.ts'
import { handleGeoFrames } from '../api/geo-frames.ts'
import { handleGeo } from '../api/geo.ts'
import { handleOg } from '../api/og.tsx'
import { panCacheQuery } from '../api/_lib/pan.js'
import { cardCacheQuery } from '../api/_lib/share.js'
import { handlePan } from '../api/pan.ts'
import { handleSharePage } from '../api/s.ts'
import { jpegCodec } from './jpegCodec.ts'
import { route, type EdgeCache, type Routes } from './router.ts'

registerBundled({
  'wasm/yoga': yoga,
  'wasm/resvg': resvg,
  '_fonts/display-latin.ttf': displayLatin,
  '_fonts/display-latin-ext.ttf': displayLatinExt,
  '_fonts/sans-latin.ttf': sansLatin,
  '_fonts/sans-latin-ext.ttf': sansLatinExt,
  '_fonts/mono-latin.ttf': monoLatin,
  '_fonts/mono-latin-ext.ttf': monoLatinExt,
  '_fonts/mono-medium-latin.ttf': monoMediumLatin,
  '_fonts/serif-italic-latin.ttf': serifItalicLatin,
  '_fonts/serif-italic-latin-ext.ttf': serifItalicLatinExt,
  '_fonts/display-cyrillic.ttf': displayCyrillic,
  '_fonts/sans-cyrillic.ttf': sansCyrillic,
  '_fonts/mono-cyrillic.ttf': monoCyrillic,
  '_fonts/serif-italic-cyrillic.ttf': serifItalicCyrillic,
  '_fonts/display-vietnamese.ttf': displayVietnamese,
  '_fonts/sans-vietnamese.ttf': sansVietnamese,
  '_fonts/mono-vietnamese.ttf': monoVietnamese,
  '_fonts/serif-italic-vietnamese.ttf': serifItalicVietnamese,
  '_assets/og-default-plate.jpg': plate,
})

/** The parts of a Workers KV namespace the frame cache uses. */
interface KvNamespace {
  get(key: string, options: { type: 'text'; cacheTtl?: number }): Promise<string | null>
  get(key: string, options: { type: 'arrayBuffer'; cacheTtl?: number }): Promise<ArrayBuffer | null>
  put(key: string, value: string | ArrayBufferView, options?: { expirationTtl?: number }): Promise<void>
}

interface Env {
  ASSETS: Routes['assets']
  /** The Meteosat frame cache (wrangler.jsonc); absent until a deploy has created it */
  GEO_FRAMES?: KvNamespace
  /** Another GeoServer than EUMETView's, for `wrangler dev` only (.dev.vars) */
  GEO_UPSTREAM?: string
}

interface Context {
  waitUntil(work: Promise<unknown>): void
}

/** Cloudflare's own cache (per data centre); not part of the standard CacheStorage type. */
const edgeCache = (caches as unknown as { default: EdgeCache }).default

const codec = jpegCodec(mozjpegDecoder, mozjpegEncoder)

/**
 * The frame cache's store on KV. The state is read at most 30 seconds old (KV's shortest); a tile never changes, so a
 * data centre keeps the ones it has read for an hour.
 */
const storeOf = (kv: KvNamespace): GeoStore => ({
  getText: (key) => kv.get(key, { type: 'text', cacheTtl: 30 }),
  getBytes: (key) => kv.get(key, { type: 'arrayBuffer', cacheTtl: 3600 }),
  put: (key, value, ttlSeconds) => kv.put(key, value, ttlSeconds ? { expirationTtl: ttlSeconds } : undefined),
})

/** One store object per namespace, so what api/_lib/geoServe.ts remembers per store lasts as long as the Worker runs. */
const stores = new WeakMap<KvNamespace, GeoStore>()
function store(kv: KvNamespace): GeoStore {
  let s = stores.get(kv)
  if (!s) stores.set(kv, (s = storeOf(kv)))
  return s
}

export default {
  fetch(request: Request, env: Env, ctx: Context): Promise<Response> {
    const waitUntil = (work: Promise<unknown>) => ctx.waitUntil(work)
    const geo: GeoServe | null = env.GEO_FRAMES ? { store: store(env.GEO_FRAMES), cache: edgeCache, waitUntil, encode: codec.encode } : null
    return route(request, {
      assets: env.ASSETS,
      og: handleOg,
      share: handleSharePage,
      events: handleEvents,
      pan: (r) => handlePan(r, { cache: edgeCache, waitUntil }),
      geo: (r) => handleGeo(r, geo),
      geoFrames: (r) => handleGeoFrames(r, geo),
      cache: edgeCache,
      waitUntil,
      cardKey: cardCacheQuery,
      panKey: (q) => panCacheQuery(q, Date.now()),
    })
  },

  /** Once a minute (wrangler.jsonc `triggers`): keep the frame cache full. Most minutes there is nothing to do. */
  scheduled(_event: unknown, env: Env, ctx: Context): void {
    if (!env.GEO_FRAMES) return
    const run = runFill({ store: store(env.GEO_FRAMES), fetch: (url, init) => fetch(url, init), decode: codec.decode, geoserver: env.GEO_UPSTREAM || undefined }).then(
      (report) => {
        if (report.ready.length || report.failed.length) console.log('[geo] fill', JSON.stringify(report))
      },
      (err: unknown) => console.error('[geo] fill failed', err),
    )
    ctx.waitUntil(run)
  },
}
