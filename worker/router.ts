/**
 * The Worker's routes: which request goes where on www.watched.earth.
 *
 * wrangler.jsonc runs this for `/`, `/s/*`, `/api/*` and the place pages, and for any request no static file
 * matches; every other file is served by Cloudflare without running it. In order:
 *   - `/?q=…` from a link unfurler → that place's share page (api/s.ts); people get the app;
 *   - `/s/<id>` → the stored share's page; `/api/og`, `/api/s`, `/api/e`, `/api/pan`, `/api/geo` and
 *     `/api/geo-frames` → their handlers;
 *   - `/place` and `/place/<slug>` → the static page the build wrote (scripts/build-seo.ts); a place with no page
 *     → the app, as a 404;
 *   - a path with no dot outside `/api/` and `/s/` → the app's index.html, which routes it itself;
 *   - anything else → 404.
 * A search engine or an assistant gets the landing and the place pages without the app: the same file, its text
 * shown and its scripts gone (`appPage`, src/seo/readerPage.ts).
 * Cards, share pages, pan crops and the Meteosat cuts and frame list are kept in Cloudflare's cache when they say
 * `s-maxage`: Cloudflare caches nothing a Worker builds unless the Worker stores it (`cached`). Static files get
 * their headers from public/_headers, which does not reach responses built here, so this adds the same security
 * headers. Every host outside PRODUCTION_HOSTS (the staging copy, branch previews) is marked noindex, so search
 * engines only ever index the real site.
 *
 * The handlers and the static files are passed in, which keeps this module free of the bundled fonts and
 * WebAssembly, so worker/router.test.ts can run it under Node.
 */
import { isProductionHost } from '../api/_lib/env.js'
import { isPlacePath } from '../src/lib/placePage.ts'
import { isReader } from '../src/lib/reader.ts'
import { readerPage } from '../src/seo/readerPage.ts'

/** Link unfurlers: the fetchers that read a pasted link's Open Graph tags, by user agent. */
export const UNFURLER_UA =
  '.*(Twitterbot|facebookexternalhit|Facebot|Slackbot|Discordbot|LinkedInBot|WhatsApp|TelegramBot|Applebot|redditbot|Bluesky|Mastodon|SkypeUriPreview|Embedly|Pinterestbot|vkShare).*'
const UNFURLER = new RegExp(`^${UNFURLER_UA}$`)

/** The headers every response carries: public/_headers' `/*` rule (worker/headers.test.ts keeps the two equal). */
export const SECURITY_HEADERS: Readonly<Record<string, string>> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(self), camera=(), microphone=(), payment=(), usb=()',
  'Strict-Transport-Security': 'max-age=63072000',
}

/** App paths have no dot and are not under /api/ or /s/. */
const APP_PATH = /^\/(?!api\/|s\/)[^.]*$/
const SHARE_PATH = /^\/s\/([^/]+)$/

export type Handler = (request: Request) => Promise<Response>

/** The parts of Cloudflare's Cache API (`caches.default`) the router uses. */
export interface EdgeCache {
  match(key: Request): Promise<Response | undefined>
  put(key: Request, response: Response): Promise<void>
}

export interface Routes {
  /** The static files (the Worker's ASSETS binding). */
  assets: { fetch(request: Request): Promise<Response> }
  og: Handler
  share: Handler
  events: Handler
  pan: Handler
  /** A place's small Meteosat picture, and the frames there are (api/geo.ts, api/geo-frames.ts) */
  geo: Handler
  geoFrames: Handler
  /** Cloudflare's cache, and the Worker's `ctx.waitUntil` to store into it after answering. None: no caching. */
  cache?: EdgeCache
  waitUntil?: (work: Promise<unknown>) => void
  /**
   * The query a card or a pan crop is cached under (`cached`): only what its handler reads, in one order
   * (api/_lib/share.ts cardCacheQuery, api/_lib/pan.ts panCacheQuery). Null, or no function: the query as it came.
   */
  cardKey?: (query: URLSearchParams) => string | null
  panKey?: (query: URLSearchParams) => string | null
}

/** The same request at another path on the same host: a rewrite, so the visitor's address does not change. */
function rewrite(request: Request, url: URL): Request {
  return new Request(url, request)
}

/**
 * Whether the edge cache keeps this response: a 200 or 404 that says `s-maxage` and is not private.
 * Errors and anything without `s-maxage` (the pan band's 400s, a card's 500) always reach the handler again.
 */
export function edgeCacheable(res: Response): boolean {
  const cc = res.headers.get('cache-control') ?? ''
  return (res.status === 200 || res.status === 404) && /\bs-maxage=[1-9]/.test(cc) && !/\b(no-store|private)\b/.test(cc)
}

/**
 * A GET answered from the cache when it holds this URL, else by the handler (then stored, after answering). The key
 * is the URL the handler sees, nothing else: every one of these responses depends on its URL alone.
 *
 * For a card and a pan crop the key is narrower still: `keyQuery` gives the part of the query the handler reads.
 * Keyed on the whole address, `&x=1` (or the same parameters in another order) was a miss, so one address spelled
 * a thousand ways drew a card a thousand times and asked its archive for the picture each time: EUMETSAT's map
 * service for a Meteosat frame, CDSE's monthly quota for a pan crop.
 *
 * A HEAD is the same question as a GET (some unfurlers ask one first): it is answered from the same entry, by the
 * handler as a GET when there is none, and it used to go to the handler uncached every time.
 */
async function cached(request: Request, handler: Handler, routes: Routes, keyQuery?: (query: URLSearchParams) => string | null): Promise<Response> {
  const cache = routes.cache
  const head = request.method === 'HEAD'
  if (!cache || (request.method !== 'GET' && !head)) return handler(request)
  const url = new URL(request.url)
  const query = keyQuery?.(url.searchParams) ?? null
  const key = new Request(query === null ? request.url : `${url.origin}${url.pathname}${query ? `?${query}` : ''}`)
  const hit = await cache.match(key)
  if (hit) return hit
  const res = await handler(head ? new Request(request.url, { method: 'GET', headers: request.headers }) : request)
  if (edgeCacheable(res)) {
    const store = cache.put(key, res.clone()).catch((err: unknown) => console.error('[worker] cache put failed', err))
    if (routes.waitUntil) routes.waitUntil(store)
    else await store
  }
  return res
}

/**
 * A missing file's 404 carries its directory's cache rule. That matters for the two versioned directories: a hashed
 * asset or a place-list file that does not exist never will, and the browser remembers so (localPlaces.ts relies on
 * it, for a typed name with no file).
 */
const IMMUTABLE_DIRS = /^\/(assets|places)\//

const notFound = (path: string) =>
  new Response('Not found', {
    status: 404,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      ...(IMMUTABLE_DIRS.test(path) ? { 'cache-control': 'public, max-age=31536000, immutable' } : {}),
    },
  })

/** What a reader's copy of a page must not carry over from the file: they describe the file's own bytes. */
const FILE_ONLY_HEADERS = ['content-length', 'content-encoding', 'etag', 'last-modified']

/**
 * A page that starts the app (index.html, a place page), as `file` names it among the static files. Everyone gets
 * the file, except a reader (src/lib/reader.ts: search engines and assistants, by the name they give themselves),
 * which gets it with the app taken out: the page's own text, shown, and no script (src/seo/readerPage.ts says why).
 * In the browser the app steps aside for a reader anyway (src/main.tsx), so this changes what a reader has to fetch
 * and wait for, not what it reads.
 *
 * A reader is always sent the whole page: its copy is made here, so the file's validators say nothing about it
 * (and a search engine that held one from before would be answered 304 and keep the page with the app).
 */
async function appPage(request: Request, routes: Routes, file: Request = request): Promise<Response> {
  if (request.method !== 'GET' || !isReader(request.headers.get('user-agent'))) return routes.assets.fetch(file)
  const whole = new Request(file)
  whole.headers.delete('if-none-match')
  whole.headers.delete('if-modified-since')
  const res = await routes.assets.fetch(whole)
  if (res.status !== 200 || !(res.headers.get('content-type') ?? '').includes('text/html')) return res
  const page = readerPage(await res.clone().text())
  if (page === null) return res
  const headers = new Headers(res.headers)
  for (const name of FILE_ONLY_HEADERS) headers.delete(name)
  return new Response(page, { status: 200, headers })
}

async function dispatch(request: Request, url: URL, routes: Routes): Promise<Response> {
  const path = url.pathname
  if (path === '/') {
    if (url.searchParams.has('q') && UNFURLER.test(request.headers.get('user-agent') ?? '')) {
      return cached(rewrite(request, new URL(`/api/s${url.search}`, url)), routes.share, routes)
    }
    return appPage(request, routes)
  }
  const share = SHARE_PATH.exec(path)
  if (share) {
    // The visitor's query string is kept on the rewrite, and the share's id added to it.
    const to = new URL('/api/s', url)
    to.search = url.search
    to.searchParams.set('id', share[1])
    return cached(rewrite(request, to), routes.share, routes)
  }
  switch (path) {
    case '/api/og':
      return cached(request, routes.og, routes, routes.cardKey)
    case '/api/s':
      return cached(request, routes.share, routes)
    case '/api/e':
      return routes.events(request)
    case '/api/pan':
      return cached(request, routes.pan, routes, routes.panKey)
    case '/api/geo':
      return cached(request, routes.geo, routes)
    case '/api/geo-frames':
      return cached(request, routes.geoFrames, routes)
  }
  if (isPlacePath(path)) return placePage(request, url, routes)
  if (APP_PATH.test(path)) return appPage(request, routes, rewrite(request, new URL('/', url)))
  return notFound(path)
}

/**
 * A place page or the list of them: the file itself (Cloudflare serves `place/<slug>.html` at `/place/<slug>` and
 * redirects the `.html` and trailing-slash spellings to it). They come through the Worker, though they are static,
 * so that a preview or the staging copy marks them noindex like everything else it serves.
 * A place with no page gets the app, which opens on its landing, but as a 404: a visitor with a mistyped or retired
 * address can still search, and a search engine drops the address instead of filing the landing under it.
 */
async function placePage(request: Request, url: URL, routes: Routes): Promise<Response> {
  const res = await appPage(request, routes)
  if (res.status !== 404) return res
  const app = await appPage(request, routes, rewrite(request, new URL('/', url)))
  return new Response(app.body, { status: 404, headers: app.headers })
}

/** What a response that names no Cache-Control is sent with: revalidate every time. */
const NO_CACHE_CONTROL = 'public, max-age=0, must-revalidate'

/**
 * A handler's Cache-Control as the browser gets it: `s-maxage` and `stale-while-revalidate` are the edge cache's
 * and are removed on the way out, so a browser never serves a card or share page stale.
 * The cache (above) still sees the full header.
 */
export function browserCacheControl(cc: string | null): string {
  const kept = (cc ?? '')
    .split(',')
    .map((d) => d.trim())
    .filter((d) => d && !/^(s-maxage|stale-while-revalidate)=/i.test(d))
  return kept.length ? kept.join(', ') : NO_CACHE_CONTROL
}

export async function route(request: Request, routes: Routes): Promise<Response> {
  const url = new URL(request.url)
  const fromFiles = new WeakSet<Response>()
  const files = {
    async fetch(r: Request): Promise<Response> {
      const res = await routes.assets.fetch(r)
      fromFiles.add(res)
      return res
    },
  }
  const res = await dispatch(request, url, { ...routes, assets: files })
  // static-file responses have immutable headers; a HEAD's answer (a card drawn or found for it) goes without its body
  const out = new Response(request.method === 'HEAD' ? null : res.body, res)
  // Static files keep their headers (public/_headers); everything built here gets the browser's form of its own.
  if (!fromFiles.has(res)) out.headers.set('Cache-Control', browserCacheControl(res.headers.get('cache-control')))
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) if (!out.headers.has(name)) out.headers.set(name, value)
  if (!isProductionHost(url.hostname)) out.headers.set('X-Robots-Tag', 'noindex')
  return out
}
