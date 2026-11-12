/**
 * The Worker's routes: vercel.json's `routes` written as code, so www.watched.earth answers the same from either
 * host while both run.
 *
 * wrangler.jsonc runs this for `/`, `/s/*` and `/api/*`, and for any request no static file matches; every other
 * file is served by Cloudflare without running it. In order, as on Vercel:
 *   - `/?q=…` from a link unfurler → that place's share page (api/s.ts); people get the app;
 *   - `/s/<id>` → the stored share's page; `/api/og`, `/api/s`, `/api/e`, `/api/pan` → their handlers;
 *   - a path with no dot outside `/api/` and `/s/` → the app's index.html, which routes it itself;
 *   - anything else → 404.
 * Cards, share pages and pan crops are kept in Cloudflare's cache when they say `s-maxage`, as Vercel's CDN kept
 * them: Cloudflare caches nothing a Worker builds unless the Worker stores it (`cached`). Static files get their
 * headers from public/_headers, which does not reach responses built here, so this adds the same security headers. Every host outside PRODUCTION_HOSTS (the staging copy, branch previews) is marked
 * noindex, so search engines only ever index the real site.
 *
 * The handlers and the static files are passed in, which keeps this module free of the bundled fonts and
 * WebAssembly, so worker/router.test.ts can run it under Node.
 */
import { isProductionHost } from '../api/_lib/env.js'

/** Link unfurlers, exactly as vercel.json's `has` matches them on an address-bar link (the test keeps them equal). */
export const UNFURLER_UA =
  '.*(Twitterbot|facebookexternalhit|Facebot|Slackbot|Discordbot|LinkedInBot|WhatsApp|TelegramBot|Applebot|redditbot|Bluesky|Mastodon|SkypeUriPreview|Embedly|Pinterestbot|vkShare).*'
const UNFURLER = new RegExp(`^${UNFURLER_UA}$`)

/** vercel.json's headers for every path, plus the HSTS header Vercel adds to its custom domains on its own. */
export const SECURITY_HEADERS: Readonly<Record<string, string>> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(self), camera=(), microphone=(), payment=(), usb=()',
  'Strict-Transport-Security': 'max-age=63072000',
}

/** vercel.json's last route: app paths have no dot and are not under /api/ or /s/. */
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
  /** Cloudflare's cache, and the Worker's `ctx.waitUntil` to store into it after answering. None: no caching. */
  cache?: EdgeCache
  waitUntil?: (work: Promise<unknown>) => void
}

/** The same request at another path on the same host: a rewrite, so the visitor's address does not change. */
function rewrite(request: Request, url: URL): Request {
  return new Request(url, request)
}

/**
 * Whether Vercel's CDN would have kept this response: a 200 or 404 that says `s-maxage` and is not private.
 * Errors and anything without `s-maxage` (the pan band's 400s, a card's 500) always reach the handler again.
 */
export function edgeCacheable(res: Response): boolean {
  const cc = res.headers.get('cache-control') ?? ''
  return (res.status === 200 || res.status === 404) && /\bs-maxage=[1-9]/.test(cc) && !/\b(no-store|private)\b/.test(cc)
}

/**
 * A GET answered from the cache when it holds this URL, else by the handler (then stored, after answering). The key
 * is the URL the handler sees, nothing else: every one of these responses depends on its URL alone.
 */
async function cached(request: Request, handler: Handler, routes: Routes): Promise<Response> {
  const cache = routes.cache
  if (!cache || request.method !== 'GET') return handler(request)
  const key = new Request(request.url)
  const hit = await cache.match(key)
  if (hit) return hit
  const res = await handler(request)
  if (edgeCacheable(res)) {
    const store = cache.put(key, res.clone()).catch((err: unknown) => console.error('[worker] cache put failed', err))
    if (routes.waitUntil) routes.waitUntil(store)
    else await store
  }
  return res
}

/**
 * Vercel applies a path's header rules to its 404 as well. That matters for the two versioned directories: a hashed
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

async function dispatch(request: Request, url: URL, routes: Routes): Promise<Response> {
  const path = url.pathname
  if (path === '/') {
    if (url.searchParams.has('q') && UNFURLER.test(request.headers.get('user-agent') ?? '')) {
      return cached(rewrite(request, new URL(`/api/s${url.search}`, url)), routes.share, routes)
    }
    return routes.assets.fetch(request)
  }
  const share = SHARE_PATH.exec(path)
  if (share) {
    // Vercel keeps the visitor's query string on a rewrite and adds the destination's.
    const to = new URL('/api/s', url)
    to.search = url.search
    to.searchParams.set('id', share[1])
    return cached(rewrite(request, to), routes.share, routes)
  }
  switch (path) {
    case '/api/og':
      return cached(request, routes.og, routes)
    case '/api/s':
      return cached(request, routes.share, routes)
    case '/api/e':
      return routes.events(request)
    case '/api/pan':
      return cached(request, routes.pan, routes)
  }
  if (APP_PATH.test(path)) return routes.assets.fetch(rewrite(request, new URL('/', url)))
  return notFound(path)
}

/** What Vercel sends when a response names no Cache-Control. */
const NO_CACHE_CONTROL = 'public, max-age=0, must-revalidate'

/**
 * A handler's Cache-Control as the browser gets it from Vercel: its CDN keeps `s-maxage` and
 * `stale-while-revalidate` for itself and removes them, so a browser never serves a card or share page stale.
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
  const out = new Response(res.body, res) // static-file responses have immutable headers
  // Static files keep their headers (public/_headers), as on Vercel; everything built here gets Vercel's.
  if (!fromFiles.has(res)) out.headers.set('Cache-Control', browserCacheControl(res.headers.get('cache-control')))
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) if (!out.headers.has(name)) out.headers.set(name, value)
  if (!isProductionHost(url.hostname)) out.headers.set('X-Robots-Tag', 'noindex')
  return out
}
