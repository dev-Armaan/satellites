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
 * Static files get their headers from public/_headers, which does not reach responses built here, so this adds
 * the same security headers. Every host outside PRODUCTION_HOSTS (the staging copy, branch previews) is marked
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

export interface Routes {
  /** The static files (the Worker's ASSETS binding). */
  assets: { fetch(request: Request): Promise<Response> }
  og: Handler
  share: Handler
  events: Handler
  pan: Handler
}

/** The same request at another path on the same host: a rewrite, so the visitor's address does not change. */
function rewrite(request: Request, url: URL): Request {
  return new Request(url, request)
}

const notFound = () => new Response('Not found', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } })

async function dispatch(request: Request, url: URL, routes: Routes): Promise<Response> {
  const path = url.pathname
  if (path === '/') {
    if (url.searchParams.has('q') && UNFURLER.test(request.headers.get('user-agent') ?? '')) {
      return routes.share(rewrite(request, new URL(`/api/s${url.search}`, url)))
    }
    return routes.assets.fetch(request)
  }
  const share = SHARE_PATH.exec(path)
  if (share) {
    // Vercel keeps the visitor's query string on a rewrite and adds the destination's.
    const to = new URL('/api/s', url)
    to.search = url.search
    to.searchParams.set('id', share[1])
    return routes.share(rewrite(request, to))
  }
  switch (path) {
    case '/api/og':
      return routes.og(request)
    case '/api/s':
      return routes.share(request)
    case '/api/e':
      return routes.events(request)
    case '/api/pan':
      return routes.pan(request)
  }
  if (APP_PATH.test(path)) return routes.assets.fetch(rewrite(request, new URL('/', url)))
  return notFound()
}

export async function route(request: Request, routes: Routes): Promise<Response> {
  const url = new URL(request.url)
  const res = await dispatch(request, url, routes)
  const out = new Response(res.body, res) // static-file responses have immutable headers
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) if (!out.headers.has(name)) out.headers.set(name, value)
  if (!isProductionHost(url.hostname)) out.headers.set('X-Robots-Tag', 'noindex')
  return out
}
