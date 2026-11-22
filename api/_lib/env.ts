/**
 * Server-side configuration for the handlers in api/ (run by the Cloudflare Worker, worker/index.ts).
 *
 * The Worker is given the same VITE_-prefixed variables the browser build uses (wrangler.jsonc says where they
 * are set), so one pair of names configures both sides. The publishable key is public by design (it can only call
 * the anon-granted RPCs); no secret key is ever used here.
 */

export interface SupabaseConfig {
  url: string
  key: string
}

function env(name: string): string | undefined {
  const v = process.env[name]?.trim()
  return v ? v : undefined
}

/** Null when the backend isn't configured: callers degrade to the default card / generic page. */
export function supabaseConfig(): SupabaseConfig | null {
  const url = env('SUPABASE_URL') ?? env('VITE_SUPABASE_URL')
  const key = env('SUPABASE_PUBLISHABLE_KEY') ?? env('VITE_SUPABASE_PUBLISHABLE_KEY')
  if (!url || !key || !/^https:\/\//.test(url)) return null
  return { url: url.replace(/\/+$/, ''), key }
}

/**
 * Canonical origin for absolute URLs (og:image, canonical). SITE_URL wins when set (so preview
 * deployments still point crawlers at production); otherwise the request's own origin.
 */
export function siteOrigin(request: Request): string {
  const configured = env('SITE_URL')
  if (configured && /^https?:\/\/[^/]+/.test(configured)) return configured.replace(/\/+$/, '')
  // request.url is absolute with the public host. Deliberately not reading X-Forwarded-Host: these
  // responses are kept in the edge cache, and a forged header must not be able to plant another origin
  // in a cached og:image.
  return new URL(request.url).origin
}

/**
 * Whether a hostname serves the real site: listed in PRODUCTION_HOSTS (comma-separated, e.g.
 * `www.watched.earth,watched.earth`). Unset means every host (local checks). wrangler.jsonc sets it, because one
 * Worker answers production, the staging copy and previews alike.
 */
export function isProductionHost(hostname: string): boolean {
  const hosts = env('PRODUCTION_HOSTS')
    ?.split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean)
  return !hosts?.length || hosts.includes(hostname.toLowerCase())
}

/** Bare host for the card footer ("overflight.app"); empty for local/dev hosts, which are hidden. */
export function displayHost(origin: string): string {
  try {
    const host = new URL(origin).hostname.replace(/^www\./, '')
    return /^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)$/.test(host) ? '' : host
  } catch {
    return ''
  }
}
