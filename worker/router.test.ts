/**
 * The Worker answers every path as vercel.json does (api/_lib/api.test.ts walks vercel.json for the same cases),
 * and its bot list and security headers stay equal to vercel.json's while both hosts run.
 */
import { readFile } from 'node:fs/promises'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SECURITY_HEADERS, UNFURLER_UA, route, type Routes } from './router.ts'

const BOT = 'Mozilla/5.0 (compatible; Twitterbot/1.0)'
const IMESSAGE =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/601.2.4 (KHTML, like Gecko) Version/9.0.1 Safari/601.2.4 facebookexternalhit/1.1 Facebot Twitterbot/1.0'
const PERSON =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'

/** Every route answers with where the request ended up: "<route> <path+query>". */
function routes(): Routes {
  const answer = (name: string) => async (r: Request) => {
    const u = new URL(r.url)
    return new Response(`${name} ${u.pathname}${u.search}`, { headers: { 'cache-control': 'public, max-age=0, must-revalidate' } })
  }
  return { assets: { fetch: answer('asset') }, og: answer('og'), share: answer('share'), events: answer('events'), pan: answer('pan') }
}

async function at(path: string, ua = PERSON, init: RequestInit = {}, host = 'https://www.watched.earth') {
  const res = await route(new Request(`${host}${path}`, { ...init, headers: { 'user-agent': ua } }), routes())
  return { res, body: await res.text() }
}

afterEach(() => vi.unstubAllEnvs())

describe('worker routes', () => {
  it('sends link unfurlers of an address-bar link to the place page, and people to the app', async () => {
    expect((await at('/?q=43.472,-80.545&n=Waterloo', BOT)).body).toBe('share /api/s?q=43.472,-80.545&n=Waterloo')
    expect((await at('/?q=43.472,-80.545&n=Waterloo', IMESSAGE)).body).toBe('share /api/s?q=43.472,-80.545&n=Waterloo')
    expect((await at('/?q=43.472,-80.545&n=Waterloo', PERSON)).body).toBe('asset /?q=43.472,-80.545&n=Waterloo')
    expect((await at('/', BOT)).body).toBe('asset /') // the root card: static index.html + og-default.png
  })

  it('opens a short link as its share page, keeping the query', async () => {
    expect((await at('/s/ab3d5f7h')).body).toBe('share /api/s?id=ab3d5f7h')
    expect((await at('/s/ab3d5f7h?utm_source=x')).body).toBe('share /api/s?utm_source=x&id=ab3d5f7h')
    expect((await at('/s/ab3d5f7h/more')).res.status).toBe(404)
  })

  it('hands each function its own requests', async () => {
    expect((await at('/api/og?id=ab3d5f7h')).body).toBe('og /api/og?id=ab3d5f7h')
    expect((await at('/api/s?id=ab3d5f7h')).body).toBe('share /api/s?id=ab3d5f7h')
    expect((await at('/api/e', PERSON, { method: 'POST', body: '{}' })).body).toBe('events /api/e')
    expect((await at('/api/pan?bbox=1')).body).toBe('pan /api/pan?bbox=1')
    expect((await at('/api/nope')).res.status).toBe(404)
  })

  it('falls back to the app for app paths only', async () => {
    expect((await at('/about')).body).toBe('asset /')
    expect((await at('/week/43.47,-80.54')).res.status).toBe(404) // a dot: never the app, as on Vercel
    expect((await at('/missing.png')).res.status).toBe(404)
  })

  it('adds the security headers, and marks hosts outside PRODUCTION_HOSTS noindex', async () => {
    vi.stubEnv('PRODUCTION_HOSTS', 'www.watched.earth,watched.earth')
    const live = (await at('/')).res.headers
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) expect(live.get(name)).toBe(value)
    expect(live.get('cache-control')).toBe('public, max-age=0, must-revalidate') // the route's own headers survive
    expect(live.get('x-robots-tag')).toBeNull()
    expect((await at('/', PERSON, {}, 'https://next.watched.earth')).res.headers.get('x-robots-tag')).toBe('noindex')
  })
})

describe('parity with vercel.json', () => {
  interface Route {
    src?: string
    headers?: Record<string, string>
    has?: { type: string; key: string; value?: string }[]
  }
  const vercel = async () => (JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8')) as { routes: Route[] }).routes

  it('matches the same link unfurlers', async () => {
    const ua = (await vercel()).flatMap((r) => r.has ?? []).find((c) => c.key === 'user-agent')
    expect(ua?.value).toBe(UNFURLER_UA)
  })

  it('sends the same security headers on every path', async () => {
    const all = (await vercel()).find((r) => r.src === '/(.*)')!.headers!
    const { 'Strict-Transport-Security': _hsts, ...rest } = SECURITY_HEADERS // Vercel adds HSTS on its own
    expect(rest).toEqual(all)
  })
})

describe('edge cache', () => {
  /** A cache keyed by URL, as Cloudflare's is for these requests, counting each handler's calls. */
  function cachedRoutes(answers: Record<string, () => Response>) {
    const store = new Map<string, Response>()
    const calls: string[] = []
    const stored: Promise<unknown>[] = []
    const handler = (name: string) => async (r: Request) => {
      calls.push(`${name} ${new URL(r.url).pathname}${new URL(r.url).search}`)
      return answers[name]()
    }
    const r: Routes = {
      ...routes(),
      og: handler('og'),
      share: handler('share'),
      pan: handler('pan'),
      cache: {
        match: async (key) => store.get(key.url)?.clone(),
        put: async (key, res) => void store.set(key.url, res),
      },
      waitUntil: (work) => void stored.push(work),
    }
    const get = async (path: string, ua = PERSON) => {
      const res = await route(new Request(`https://www.watched.earth${path}`, { headers: { 'user-agent': ua } }), r)
      await Promise.all(stored)
      return res
    }
    return { get, calls, store }
  }
  const respond = (status: number, cc: string) => () => new Response('x', { status, headers: { 'cache-control': cc } })

  it('renders a card once, then answers from the cache', async () => {
    const { get, calls } = cachedRoutes({ og: respond(200, 'public, max-age=86400, s-maxage=31536000') })
    expect((await get('/api/og?id=ab3d5f7h')).status).toBe(200)
    const again = await get('/api/og?id=ab3d5f7h')
    expect(again.status).toBe(200)
    expect(again.headers.get('x-content-type-options')).toBe('nosniff') // headers added on the way out, hits too
    expect(calls).toEqual(['og /api/og?id=ab3d5f7h'])
  })

  it('keeps only what Vercel would keep: 200 or 404 with s-maxage, never no-store or an error', async () => {
    const { get, store } = cachedRoutes({
      og: respond(500, 'public, s-maxage=300'),
      pan: respond(400, 'public, max-age=86400'),
      share: respond(404, 'public, max-age=60, s-maxage=600'),
    })
    await get('/api/og?id=x')
    await get('/api/pan?bbox=1')
    await get('/s/missing1')
    expect([...store.keys()]).toEqual(['https://www.watched.earth/api/s?id=missing1'])
  })

  it('keys a rewritten request by the URL its handler sees', async () => {
    const { get, calls, store } = cachedRoutes({ share: respond(200, 'public, max-age=300, s-maxage=86400') })
    await get('/?q=43.47,-80.54&n=Waterloo', BOT)
    await get('/?q=43.47,-80.54&n=Waterloo', BOT)
    await get('/?q=43.47,-80.54&n=Waterloo') // a person: the app, never the cached share page
    expect(calls).toEqual(['share /api/s?q=43.47,-80.54&n=Waterloo'])
    expect([...store.keys()]).toEqual(['https://www.watched.earth/api/s?q=43.47,-80.54&n=Waterloo'])
  })
})
