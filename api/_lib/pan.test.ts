import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { REFUSED_MS, handlePan, resetPanForTests } from '../pan.js'
import { PAN_PX, panCacheQuery, panQuery, parsePanQuery, processBody } from './pan.js'

const NOW = Date.UTC(2026, 10, 10, 20)
const T = Date.UTC(2026, 10, 3, 6, 46)
/** The app's Landsat crop over Palm Jumeirah (EPSG:32640), as pcCropUrlAt cuts it. */
const BOX = [304845, 2771175, 319845, 2786175]

describe('parsePanQuery', () => {
  const q = (s: string) => new URLSearchParams(s)
  it('accepts an app crop', () => {
    expect(parsePanQuery(q(panQuery(BOX, 32640, T)), NOW)).toEqual({ box: BOX, crs: 32640, t: T })
  })
  it('refuses anything else', () => {
    expect(parsePanQuery(q(panQuery([304845, 2771175, 324845, 2791175], 32640, T)), NOW)).toBe('bbox size')
    expect(parsePanQuery(q(panQuery([304846, 2771175, 319846, 2786175], 32640, T)), NOW)).toBe('bbox grid')
    expect(parsePanQuery(q('bbox=1,2,3&crs=32640&t=1'), NOW)).toBe('bbox')
    expect(parsePanQuery(q(panQuery(BOX, 4326, T)), NOW)).toBe('crs')
    expect(parsePanQuery(q(panQuery(BOX, 32640, NOW + 2 * 3_600_000)), NOW)).toBe('t')
    expect(parsePanQuery(q(panQuery(BOX, 32640, NOW - 200 * 86_400_000)), NOW)).toBe('t')
  })
  it('takes one spelling of a crop: no decimals, exponents, blanks or padding (each was a new request to CDSE)', () => {
    const ok = panQuery(BOX, 32640, T)
    for (const [from, to, why] of [
      [`t=${T}`, `t=${T}.25`, 't'],
      [`t=${T}`, `t=${T / 1000}e3`, 't'],
      [`t=${T}`, `t=0${T}`, 't'],
      ['bbox=304845,', 'bbox=304845.0,', 'bbox'],
      ['bbox=304845,', 'bbox=+304845,', 'bbox'],
      ['bbox=304845,', 'bbox=%20304845,', 'bbox'],
      ['crs=32640', 'crs=32640.0', 'crs'],
    ] as const) {
      expect(ok).toContain(from)
      expect(parsePanQuery(q(ok.replace(from, to)), NOW)).toBe(why)
    }
    expect(parsePanQuery(q(`bbox=,,15000,15000&crs=32640&t=${T}`), NOW)).toBe('bbox')
  })
  it('refuses a box no UTM zone holds', () => {
    expect(parsePanQuery(q(panQuery([-900_000_000, 0, -899_985_000, 15_000], 32640, T)), NOW)).toBe('bbox place')
    expect(parsePanQuery(q(panQuery([304845, 90_000_000_000, 319845, 90_000_015_000], 32760, T)), NOW)).toBe('bbox place')
    // A southern scene on its northern zone's grid (negative northings) is a real crop.
    expect(parsePanQuery(q(panQuery([304845, -3_771_180, 319845, -3_756_180], 32640, T)), NOW)).toEqual({ box: [304845, -3_771_180, 319845, -3_756_180], crs: 32640, t: T })
  })
  it('names one cache entry per crop, whatever else the address carries', () => {
    const ok = panQuery(BOX, 32640, T)
    expect(panCacheQuery(q(ok), NOW)).toBe(ok)
    expect(panCacheQuery(q(`x=1&t=${T}&crs=32640&bbox=${BOX.join(',')}&utm_source=y`), NOW)).toBe(ok)
    expect(panCacheQuery(q('bbox=1,2,3&crs=32640&t=1'), NOW)).toBeNull()
  })
  it('asks for B08 of that capture hour only, on the crop grid 1:1', () => {
    const b = processBody({ box: BOX as [number, number, number, number], crs: 32640, t: T })
    expect(b.input.bounds.properties.crs).toBe('http://www.opengis.net/def/crs/EPSG/0/32640')
    expect(b.input.data[0].type).toBe('landsat-ot-l1')
    expect(Date.parse(b.input.data[0].dataFilter.timeRange.to) - Date.parse(b.input.data[0].dataFilter.timeRange.from)).toBe(2 * 3_600_000)
    expect(b.output.width).toBe(PAN_PX)
    expect(b.evalscript).toContain('"B08"')
  })
})

describe('handlePan', () => {
  const url = (s = panQuery(BOX, 32640, T)) => new Request(`https://www.watched.earth/api/pan?${s}`)
  const png = new Uint8Array(40_000).map((_, i) => i % 251)
  let fetchMock: ReturnType<typeof vi.fn>
  beforeEach(() => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] })
    resetPanForTests()
    process.env.CDSE_CLIENT_ID = 'id'
    process.env.CDSE_CLIENT_SECRET = 'secret'
    fetchMock = vi.fn(async (u: string) =>
      String(u).includes('/token') ? new Response(JSON.stringify({ access_token: 'tok', expires_in: 600 })) : new Response(png, { headers: { 'content-type': 'image/png' } }),
    )
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    delete process.env.CDSE_CLIENT_ID
    delete process.env.CDSE_CLIENT_SECRET
  })

  it('answers the pan PNG, cached at the edge, and reuses its token', async () => {
    const r1 = await handlePan(url())
    expect(r1.status).toBe(200)
    expect(r1.headers.get('cache-control')).toContain('s-maxage=31536000')
    expect(new Uint8Array(await r1.arrayBuffer())).toEqual(png)
    const r2 = await handlePan(url())
    expect(r2.status).toBe(200)
    const tokenCalls = fetchMock.mock.calls.filter(([u]) => String(u).includes('/token')).length
    expect(tokenCalls).toBe(1)
    const [, init] = fetchMock.mock.calls.find(([u]) => String(u).includes('/process'))!
    expect((init as RequestInit).headers).toMatchObject({ authorization: 'Bearer tok' })
  })

  it('refuses a crop the app never cuts, without calling CDSE', async () => {
    const r = await handlePan(url('bbox=0,0,50000,50000&crs=32640&t=1'))
    expect(r.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('says so without a body when CDSE has nothing, refuses, or is not configured', async () => {
    fetchMock.mockImplementation(async (u: string) => (String(u).includes('/token') ? new Response(JSON.stringify({ access_token: 'tok', expires_in: 600 })) : new Response('{}', { status: 400 })))
    expect((await handlePan(url())).status).toBe(404)
    fetchMock.mockImplementation(async (u: string) => (String(u).includes('/token') ? new Response(JSON.stringify({ access_token: 'tok', expires_in: 600 })) : new Response('', { status: 503 })))
    const bad = await handlePan(url())
    expect(bad.status).toBe(502)
    // An all-zero picture (no scene that hour) compresses to ~1 KB: not found, not cached for a year.
    fetchMock.mockImplementation(async (u: string) => (String(u).includes('/token') ? new Response(JSON.stringify({ access_token: 'tok', expires_in: 600 })) : new Response(new Uint8Array(1049))))
    const none = await handlePan(url())
    expect(none.status).toBe(404)
    expect(none.headers.get('cache-control')).toBe('public, max-age=300, s-maxage=300')
    expect(bad.headers.get('cache-control')).toBe('public, max-age=300, s-maxage=300')
  })
  const answering = (status: number) =>
    fetchMock.mockImplementation(async (u: string) =>
      String(u).includes('/token') ? new Response(JSON.stringify({ access_token: 'tok', expires_in: 3600 })) : status === 200 ? new Response(png) : new Response('', { status }),
    )
  const asked = () => fetchMock.mock.calls.filter(([u]) => String(u).includes('/process')).length

  it('remembers a refusal (quota spent, or too fast): CDSE is not asked again for 15 minutes', async () => {
    for (const status of [403, 429]) {
      resetPanForTests()
      fetchMock.mockClear()
      answering(status)
      expect((await handlePan(url())).status).toBe(502)
      expect((await handlePan(url())).status).toBe(502)
      expect((await handlePan(url(panQuery(BOX, 32640, T + 1)))).status).toBe(502)
      expect(asked()).toBe(1)
      // Once the 15 minutes are up, one request finds out whether CDSE answers again.
      vi.setSystemTime(Date.now() + REFUSED_MS + 1)
      answering(200)
      expect((await handlePan(url())).status).toBe(200)
      expect(asked()).toBe(2)
    }
  })

  it('does not hold back after a failure that is not a refusal', async () => {
    answering(503)
    expect((await handlePan(url())).status).toBe(502)
    expect((await handlePan(url())).status).toBe(502)
    expect(asked()).toBe(2)
  })

  it('shares a refusal with the other instances at the data centre, through the cache', async () => {
    const kept = new Map<string, Response>()
    const cache = { match: async (k: Request) => kept.get(k.url)?.clone(), put: async (k: Request, r: Response) => void kept.set(k.url, r) }
    answering(403)
    expect((await handlePan(url(), { cache })).status).toBe(502)
    expect([...kept.keys()]).toEqual(['https://www.watched.earth/api/pan/kept/refused'])
    expect(kept.get('https://www.watched.earth/api/pan/kept/refused')!.headers.get('cache-control')).toBe('public, max-age=900')
    // Another instance: no memory of its own, CDSE answering again, and still nothing is asked.
    resetPanForTests()
    fetchMock.mockClear()
    answering(200)
    expect((await handlePan(url(), { cache })).status).toBe(502)
    expect(fetchMock).not.toHaveBeenCalled()
    // A preview host has its own marker: production's refusal is not its own.
    const preview = new Request(`https://branch-watched.example.workers.dev/api/pan?${panQuery(BOX, 32640, T)}`)
    resetPanForTests()
    expect((await handlePan(preview, { cache })).status).toBe(200)
  })
})
