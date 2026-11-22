/**
 * GET /api/pan?bbox=…&crs=…&t=…  — Landsat 8/9's 15 m pan band for one app crop (see _lib/pan.ts).
 *
 * The CDSE OAuth client (CDSE_CLIENT_ID / CDSE_CLIENT_SECRET, server-side only) gets a token, kept for its lifetime by
 * the warm instance. A crop is a fixed picture of a past capture, so a success is cached at the edge for a year
 * (repeat views never reach CDSE or count against its free quota). Anything else answers without a body and is not
 * cached for long; the client then keeps the photo it has (photos.ts / pixels.ts fall back to the 30 m layer).
 *
 * A refusal is remembered. When the month's free quota is spent CDSE answers 403 to every request until the month
 * turns (from 2026-11-20 on: 899 failures the next day and not one success), and each photo opened in the viewer
 * asked it again. So after a 403 or a 429 nothing is asked for 15 minutes: this Worker instance remembers, and so
 * does Cloudflare's cache at this data centre (a marker under a path nobody can request), which other instances
 * read. One request then finds out whether CDSE answers again.
 *
 *   200  image/png (8-bit grey, √ encoded; 0 = no data)
 *   400  not an app crop · 404 no Landsat pan at that place and hour (or an all-no-data answer) · 502 CDSE refused
 *        (now, or within the last 15 minutes) or unreachable
 *   503  not configured
 */
import { parsePanQuery, processBody } from './_lib/pan.js'

const TOKEN_URL = 'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token'
const PROCESS_URL = 'https://sh.dataspace.copernicus.eu/api/v1/process'
const TIMEOUT_MS = 12_000
/** Below this many bytes a 1000 px PNG is (nearly) all no data. */
const NO_DATA_BYTES = 16_384

/** How long nothing is asked of CDSE after it refused (403: the quota is spent; 429: too fast). */
export const REFUSED_MS = 15 * 60_000

/** Cloudflare's cache and the Worker's `ctx.waitUntil`, when there is one (worker/index.ts): where a refusal is kept. */
export interface PanDeps {
  cache?: { match(key: Request): Promise<Response | undefined>; put(key: Request, response: Response): Promise<void> }
  waitUntil?: (work: Promise<unknown>) => void
}

let token: { value: string; until: number } | null = null
let refusedUntil = 0

/** The marker's key: under /api/pan/, which the router answers 404 for anything but /api/pan itself. */
const refusedKey = (origin: string) => new Request(`${origin}/api/pan/kept/refused`)

async function refused(deps: PanDeps | undefined, origin: string, now: number): Promise<boolean> {
  if (now < refusedUntil) return true
  if (!deps?.cache) return false
  const hit = await deps.cache.match(refusedKey(origin)).catch(() => undefined)
  // Another instance was refused: the marker says so until it expires; look again in a minute.
  if (hit) refusedUntil = now + 60_000
  return !!hit
}

function rememberRefusal(deps: PanDeps | undefined, origin: string, now: number): void {
  refusedUntil = now + REFUSED_MS
  if (!deps?.cache) return
  const put = deps.cache
    .put(refusedKey(origin), new Response('refused', { headers: { 'cache-control': `public, max-age=${REFUSED_MS / 1000}` } }))
    .catch((err: unknown) => console.error('[pan] cache put failed', err))
  deps.waitUntil?.(put)
}

/** Tests: forget the token and any refusal (module state outlives a test). */
export function resetPanForTests(): void {
  token = null
  refusedUntil = 0
}

async function accessToken(): Promise<string | null> {
  if (token && token.until > Date.now() + 60_000) return token.value
  const id = process.env.CDSE_CLIENT_ID?.trim()
  const secret = process.env.CDSE_CLIENT_SECRET?.trim()
  if (!id || !secret) return null
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: id, client_secret: secret }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!res.ok) throw new Error(`token ${res.status}`)
  const j = (await res.json()) as { access_token?: string; expires_in?: number }
  if (!j.access_token) throw new Error('token')
  token = { value: j.access_token, until: Date.now() + (j.expires_in ?? 300) * 1000 }
  return token.value
}

const empty = (status: number, cache = 'public, max-age=300, s-maxage=300') => new Response(null, { status, headers: { 'cache-control': cache } })

export async function handlePan(req: Request, deps?: PanDeps): Promise<Response> {
  if (req.method !== 'GET') return empty(405, 'no-store')
  const url = new URL(req.url)
  const now = Date.now()
  const parsed = parsePanQuery(url.searchParams, now)
  if (typeof parsed === 'string') return empty(400, 'public, max-age=86400')
  try {
    if (await refused(deps, url.origin, now)) return empty(502)
    const tok = await accessToken()
    if (!tok) return empty(503, 'no-store')
    const res = await fetch(PROCESS_URL, {
      method: 'POST',
      headers: { authorization: `Bearer ${tok}`, 'content-type': 'application/json', accept: 'image/png' },
      body: JSON.stringify(processBody(parsed)),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (res.status === 401) token = null
    if (res.status === 403 || res.status === 429) rememberRefusal(deps, url.origin, now)
    if (!res.ok) return empty(res.status === 400 || res.status === 404 ? 404 : 502)
    const body = await res.arrayBuffer()
    // No Level-1 scene at that place and hour (not published yet, or none): CDSE answers an all-zero picture, which
    // compresses to ~1 KB (a real 1000 px pan band is hundreds). Not cached for long: it may yet be published.
    if (body.byteLength < NO_DATA_BYTES) return empty(404)
    return new Response(body, {
      status: 200,
      headers: {
        'content-type': 'image/png',
        'cache-control': 'public, max-age=604800, s-maxage=31536000, immutable',
      },
    })
  } catch {
    return empty(502, 'no-store')
  }
}
