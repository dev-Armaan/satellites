/**
 * POST /api/e  — the in-app events relay (src/lib/telemetry.ts → here → the `log_events` RPC).
 *
 * Why a relay: the browser sends events with `navigator.sendBeacon` when the tab is hidden, which can only make
 * a same-origin "simple" request (no custom headers, so it cannot carry the Supabase apikey or pass a CORS
 * preflight). This function adds the key server-side (the publishable one: it can only call anon RPCs) and the
 * visitor's country from the edge: Vercel's `x-vercel-ip-country` or Cloudflare's `cf-ipcountry` header.
 *
 * Privacy: the IP address is never read, logged or forwarded; only the two-letter country the edge derives from it.
 * The body is parsed and re-serialised (sid, ctx, events), never forwarded as raw bytes; the database validates
 * every field again against its allow-list.
 *
 * Always answers 204 (fire-and-forget; the browser never retries), except 405 for non-POST and 413 for > 16 KB.
 */
import { isProductionHost, supabaseConfig } from './_lib/env.js'

const MAX_BYTES = 16_384

export function relayBody(raw: string, country: string | null): string | null {
  let v: unknown
  try {
    v = JSON.parse(raw)
  } catch {
    return null
  }
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null
  const { sid, ctx, events } = v as Record<string, unknown>
  if (typeof sid !== 'string' || !/^[A-Za-z0-9_-]{16,32}$/.test(sid) || !Array.isArray(events) || !events.length || events.length > 50) return null
  const c: Record<string, unknown> = ctx && typeof ctx === 'object' && !Array.isArray(ctx) ? { ...(ctx as Record<string, unknown>) } : {}
  delete c.country // only the edge's word for it
  const cc = country?.trim().toLowerCase()
  if (cc && /^[a-z]{2}$/.test(cc) && cc !== 'xx') c.country = cc
  return JSON.stringify({ batch: { sid, ctx: c, events } })
}

export async function handleEvents(request: Request): Promise<Response> {
  if (request.method !== 'POST') return new Response(null, { status: 405, headers: { allow: 'POST' } })
  const done = (status = 204) => new Response(null, { status, headers: { 'cache-control': 'no-store' } })
  // Preview deployments and the staging copy share the production database: only production writes (the client
  // also sends nothing off the production hosts). On Vercel that is VERCEL_ENV; on Cloudflare, where one Worker
  // serves every hostname, it is the request's host (PRODUCTION_HOSTS). With neither set (local checks) the relay
  // works as configured.
  const env = process.env.VERCEL_ENV
  if ((env && env !== 'production') || !isProductionHost(new URL(request.url).hostname)) return done()
  const len = Number(request.headers.get('content-length') ?? 0)
  if (len > MAX_BYTES) return done(413)
  const raw = await request.text().catch(() => '')
  if (!raw || raw.length > MAX_BYTES) return done(raw ? 413 : 204)
  const body = relayBody(raw, request.headers.get('x-vercel-ip-country') ?? request.headers.get('cf-ipcountry'))
  const cfg = supabaseConfig()
  if (!body || !cfg) return done()
  try {
    await fetch(`${cfg.url}/rest/v1/rpc/log_events`, {
      method: 'POST',
      headers: { apikey: cfg.key, authorization: `Bearer ${cfg.key}`, 'content-type': 'application/json' },
      body,
      signal: AbortSignal.timeout(4000),
    })
  } catch {
    /* fire-and-forget */
  }
  return done()
}

export default {
  fetch: handleEvents,
}
