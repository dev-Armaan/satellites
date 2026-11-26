/**
 * Where the Worker sends every path, what it caches, and the headers it adds on the way out.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { panCacheQuery, panQuery } from '../api/_lib/pan.js'
import { cardCacheQuery } from '../api/_lib/share.js'
import { SECURITY_HEADERS, route, type Routes } from './router.ts'

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
  return { assets: { fetch: answer('asset') }, og: answer('og'), share: answer('share'), events: answer('events'), pan: answer('pan'), geo: answer('geo'), geoFrames: answer('geoFrames') }
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
    expect((await at('/api/geo?layer=x')).body).toBe('geo /api/geo?layer=x')
    expect((await at('/api/geo-frames')).body).toBe('geoFrames /api/geo-frames')
    expect((await at('/api/nope')).res.status).toBe(404)
  })

  it('falls back to the app for app paths only', async () => {
    expect((await at('/about')).body).toBe('asset /')
    expect((await at('/week/43.47,-80.54')).res.status).toBe(404) // a dot: a file that is not there, never the app
    expect((await at('/missing.png')).res.status).toBe(404)
  })

  it('serves a place page as the file the build wrote, and the app as a 404 where there is none', async () => {
    const pages = new Set(['/place', '/place/paris'])
    const r: Routes = {
      ...routes(),
      assets: {
        fetch: async (req) => {
          const { pathname } = new URL(req.url)
          if (pathname === '/') return new Response('the app', { headers: { 'cache-control': 'public, max-age=0, must-revalidate' } })
          if (pathname === '/place/paris.html') return new Response(null, { status: 307, headers: { location: '/place/paris' } })
          return pages.has(pathname) ? new Response(`page ${pathname}`) : new Response(null, { status: 404 })
        },
      },
    }
    const get = (path: string, host = 'https://www.watched.earth') => route(new Request(`${host}${path}`), r)
    vi.stubEnv('PRODUCTION_HOSTS', 'www.watched.earth')
    expect(await (await get('/place/paris')).text()).toBe('page /place/paris')
    expect(await (await get('/place')).text()).toBe('page /place')
    expect((await get('/place/paris')).headers.get('x-robots-tag')).toBeNull()
    // The spelling Cloudflare redirects stays a redirect.
    const dotted = await get('/place/paris.html')
    expect([dotted.status, dotted.headers.get('location')]).toEqual([307, '/place/paris'])
    // No such place: people can still search; search engines are told there is nothing here.
    for (const path of ['/place/atlantis', '/place/paris/more']) {
      const missing = await get(path)
      expect([missing.status, await missing.text()], path).toEqual([404, 'the app'])
    }
    // A preview serves the same pages, marked so they are never indexed.
    const preview = await get('/place/paris', 'https://abc12345-watched.example.workers.dev')
    expect([preview.status, preview.headers.get('x-robots-tag')]).toEqual([200, 'noindex'])
    // The offline place list's files are not place pages.
    expect((await get('/places/20261112/s/zz.txt')).status).toBe(404)
  })

  it('hands a search engine the landing and a place page without the app, and everyone else the file', async () => {
    const page = (title: string) =>
      `<!doctype html>\n<html lang="en" data-boot>\n<head><title>${title}</title>\n<link rel="modulepreload" href="/assets/react.js">\n<script type="module" src="/assets/index.js"></script>\n</head>\n` +
      `<body>\n<div id="boot-static"><div class="bs-ink"><p>Slow connection, still loading</p></div></div>\n<div id="root"><main class="doc"><h1>${title}</h1></main></div>\n</body>\n</html>\n`
    const files: Record<string, string> = { '/': page('Watched'), '/place/paris': page('Paris'), '/place': '<!doctype html>\n<html lang="en"><body class="doc-page"><main class="doc"><h1>Places</h1></main></body></html>' }
    const asked: { path: string; conditional: boolean }[] = []
    const r: Routes = {
      ...routes(),
      assets: {
        fetch: async (req) => {
          const { pathname } = new URL(req.url)
          asked.push({ path: pathname, conditional: req.headers.has('if-none-match') || req.headers.has('if-modified-since') })
          const html = files[pathname]
          if (html === undefined) return new Response(null, { status: 404 })
          if (req.headers.get('if-none-match') === '"file"') return new Response(null, { status: 304, headers: { etag: '"file"' } })
          return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=0, must-revalidate', etag: '"file"', 'content-length': String(html.length) } })
        },
      },
    }
    const GOOGLEBOT = 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
    const get = (path: string, ua: string, headers: Record<string, string> = {}, method = 'GET') => route(new Request(`https://www.watched.earth${path}`, { method, headers: { 'user-agent': ua, ...headers } }), r)
    vi.stubEnv('PRODUCTION_HOSTS', 'www.watched.earth')

    for (const [path, title] of [['/place/paris', 'Paris'], ['/', 'Watched'], ['/?q=48.85,2.35&n=Paris', 'Watched'], ['/about', 'Watched']] as const) {
      const res = await get(path, GOOGLEBOT)
      const body = await res.text()
      expect(res.status, path).toBe(200)
      expect(body, path).toBe(`<!doctype html>\n<html lang="en">\n<head><title>${title}</title>\n</head>\n<body class="doc-page">\n\n<div id="root"><main class="doc"><h1>${title}</h1></main></div>\n</body>\n</html>\n`)
      // Its own bytes: none of the file's validators or its length, and the file's caching and the site's headers.
      expect([res.headers.get('etag'), res.headers.get('content-length')], path).toEqual([null, null])
      expect(res.headers.get('content-type'), path).toBe('text/html; charset=utf-8')
      expect(res.headers.get('cache-control'), path).toBe('public, max-age=0, must-revalidate')
      expect(res.headers.get('x-content-type-options'), path).toBe('nosniff')
      expect(res.headers.get('x-robots-tag'), path).toBeNull()
    }
    // A reader that holds the file from before is sent its page, not a 304 for the file.
    asked.length = 0
    expect((await get('/place/paris', GOOGLEBOT, { 'if-none-match': '"file"' })).status).toBe(200)
    expect(asked).toEqual([{ path: '/place/paris', conditional: false }])
    // A visitor gets the file as it is, validators and all.
    const person = await get('/place/paris', PERSON)
    expect([await person.text(), person.headers.get('etag')]).toEqual([files['/place/paris'], '"file"'])
    expect((await get('/place/paris', PERSON, { 'if-none-match': '"file"' })).status).toBe(304)
    // The list of places has no app to take out, a place with no page is still a 404, a HEAD still has no body.
    expect(await (await get('/place', GOOGLEBOT)).text()).toBe(files['/place'])
    const missing = await get('/place/atlantis', GOOGLEBOT)
    expect([missing.status, (await missing.text()).includes('<body class="doc-page">')]).toEqual([404, true])
    const head = await get('/place/paris', GOOGLEBOT, {}, 'HEAD')
    expect([head.status, await head.text()]).toEqual([200, ''])
    // A preview's copy is marked like everything else it serves.
    const preview = await route(new Request('https://abc12345-watched.example.workers.dev/place/paris', { headers: { 'user-agent': GOOGLEBOT } }), r)
    expect(preview.headers.get('x-robots-tag')).toBe('noindex')
  })

  it('adds the security headers, and marks hosts outside PRODUCTION_HOSTS noindex', async () => {
    vi.stubEnv('PRODUCTION_HOSTS', 'www.watched.earth,watched.earth')
    const live = (await at('/')).res.headers
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) expect(live.get(name)).toBe(value)
    expect(live.get('cache-control')).toBe('public, max-age=0, must-revalidate') // the static file's own header
    expect(live.get('x-robots-tag')).toBeNull()
    expect((await at('/', PERSON, {}, 'https://next.watched.earth')).res.headers.get('x-robots-tag')).toBe('noindex')
  })
})

describe('cache-control as browsers get it', () => {
  it('drops s-maxage and stale-while-revalidate from what handlers send, and fills in a missing header', async () => {
    const r: Routes = {
      ...routes(),
      og: async () => new Response('x', { headers: { 'cache-control': 'public, max-age=86400, s-maxage=31536000, stale-while-revalidate=604800' } }),
      events: async () => new Response(null, { status: 405 }),
    }
    const get = (path: string) => route(new Request(`https://www.watched.earth${path}`), r)
    expect((await get('/api/og')).headers.get('cache-control')).toBe('public, max-age=86400')
    expect((await get('/api/e')).headers.get('cache-control')).toBe('public, max-age=0, must-revalidate')
    expect((await get('/api/nope')).headers.get('cache-control')).toBe('public, max-age=0, must-revalidate')
  })

  it('remembers a missing file in a versioned directory', async () => {
    const get = async (path: string) => (await route(new Request(`https://www.watched.earth${path}`), routes())).headers.get('cache-control')
    expect(await get('/places/20261112/s/zz.txt')).toBe('public, max-age=31536000, immutable')
    expect(await get('/assets/gone-abc123.js')).toBe('public, max-age=31536000, immutable')
    expect(await get('/missing.png')).toBe('public, max-age=0, must-revalidate')
  })

  it('leaves a static file\'s header as public/_headers set it', async () => {
    const cc = 'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400'
    const r: Routes = { ...routes(), assets: { fetch: async () => new Response('{}', { headers: { 'cache-control': cc } }) } }
    expect((await route(new Request('https://www.watched.earth/about'), r)).headers.get('cache-control')).toBe(cc)
  })
})

describe('edge cache', () => {
  /** A cache keyed by URL, as Cloudflare's is for these requests, counting each handler's calls. */
  function cachedRoutes(answers: Record<string, () => Response>, keys: Pick<Routes, 'cardKey' | 'panKey'> = {}) {
    const store = new Map<string, Response>()
    const calls: string[] = []
    const stored: Promise<unknown>[] = []
    const handler = (name: string) => async (r: Request) => {
      calls.push(`${name} ${new URL(r.url).pathname}${new URL(r.url).search}${method === 'GET' ? '' : ` ${r.method}`}`)
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
      ...keys,
    }
    // The method the visitor used (calls name the handler's own when it differs: a HEAD reaches it as a GET).
    let method = 'GET'
    const get = async (path: string, ua = PERSON, as = 'GET') => {
      method = as
      const res = await route(new Request(`https://www.watched.earth${path}`, { method: as, headers: { 'user-agent': ua } }), r)
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

  it('keeps only a 200 or 404 that says s-maxage, never no-store or an error', async () => {
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

  it('keeps one entry for a card or a pan crop however its address is spelled', async () => {
    const T = Date.now() - 86_400_000
    const crop = panQuery([304845, 2771175, 319845, 2786175], 32640, T)
    const { get, calls, store } = cachedRoutes(
      { og: respond(200, 'public, max-age=86400, s-maxage=31536000'), pan: respond(200, 'public, max-age=604800, s-maxage=31536000') },
      { cardKey: cardCacheQuery, panKey: (q) => panCacheQuery(q, Date.now()) },
    )
    // A stored share's card: its id, its language and the current version are all it is drawn from.
    for (const q of ['id=ab3d5f7h&v=5', 'v=5&id=ab3d5f7h', 'id=ab3d5f7h&v=5&x=1', 'id=ab3d5f7h&v=5&x=2&place=Elsewhere', 'id=ab3d5f7h&v=5&l=xx', 'id=ab3d5f7h&v=5&l=ar']) await get(`/api/og?${q}`)
    expect(calls).toEqual(['og /api/og?id=ab3d5f7h&v=5'])
    // Another language is another card; so is an out-of-date version (one entry for every such `v`).
    await get('/api/og?id=ab3d5f7h&v=5&l=ja')
    await get('/api/og?id=ab3d5f7h&v=4')
    await get('/api/og?id=ab3d5f7h&v=999')
    await get('/api/og?id=ab3d5f7h')
    expect(calls.length).toBe(3)
    // A card drawn from its address: the same parameters in any order, with anything else dropped.
    calls.length = 0
    await get('/api/og?place=Waterloo&lat=43.47&lon=-80.54&verdict=imaged&norad=60989')
    await get('/api/og?norad=60989&verdict=imaged&lon=-80.54&lat=43.47&place=Waterloo&utm_source=x&fbclid=y')
    expect(calls.length).toBe(1)
    // A pan crop: panQuery's own string.
    calls.length = 0
    await get(`/api/pan?${crop}`)
    await get(`/api/pan?x=1&t=${T}&crs=32640&bbox=304845,2771175,319845,2786175`)
    expect(calls.length).toBe(1)
    expect([...store.keys()].filter((k) => k.includes('/api/pan'))).toEqual([`https://www.watched.earth/api/pan?${crop}`])
  })

  it('answers a HEAD from the same entry as a GET, and the handler as a GET when there is none', async () => {
    const seen: string[] = []
    const { get, calls, store } = cachedRoutes({
      og: () => {
        seen.push('og')
        return new Response('card', { headers: { 'cache-control': 'public, max-age=86400, s-maxage=31536000' } })
      },
    })
    const head = await get('/api/og?id=ab3d5f7h', PERSON, 'HEAD')
    expect(head.status).toBe(200)
    expect(await head.text()).toBe('')
    expect((await get('/api/og?id=ab3d5f7h')).status).toBe(200)
    await get('/api/og?id=ab3d5f7h', PERSON, 'HEAD')
    expect(calls).toEqual(['og /api/og?id=ab3d5f7h GET'])
    expect(seen.length).toBe(1)
    expect([...store.keys()]).toEqual(['https://www.watched.earth/api/og?id=ab3d5f7h'])
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
