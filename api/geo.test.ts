import { decode as decodeJpeg, encode as encodeJpeg } from 'jpeg-js'
import { describe, expect, it } from 'vitest'
import { FRAMES_KEY, LIST_DELAY_MS, type FramesDoc, type GeoStore, type StoredFrame } from './_lib/geoFill.js'
import { NO_TILES, TILE_BYTES, tileKey, withTile } from './_lib/geoGrid.js'
import type { GeoServe } from './_lib/geoServe.js'
import { handleGeoFrames } from './geo-frames.js'
import { handleGeo } from './geo.js'

const FCI = 'mtg_fd:rgb_geocolour'
const IR = 'msg_iodc:ir108'
const MIN = 60_000
const NOW = Date.parse('2026-11-17T16:05:00Z')
const AT = '2026-11-17T15:40:00Z'
const PARIS = 'lat=48.85700&lon=2.35200'

/** A cache holding Meteosat-12's 15:40 frame: grey 150 over Europe's tiles (rows 0–3), nothing south of the equator. */
function cache(opts: { readyAt?: number; exp?: number; withCache?: boolean } = {}) {
  const map = new Map<string, string | Uint8Array>()
  const reads: string[] = []
  const store: GeoStore = {
    getText: async (k) => (reads.push(k), (map.get(k) as string | undefined) ?? null),
    getBytes: async (k) => {
      reads.push(k)
      const v = map.get(k)
      return v instanceof Uint8Array ? (v.buffer.slice(v.byteOffset, v.byteOffset + v.byteLength) as ArrayBuffer) : null
    },
    put: async (k, v) => void map.set(k, v),
  }
  const t = Date.parse(AT)
  let tiles = NO_TILES
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 8; c++) {
      tiles = withTile(tiles, r, c)
      map.set(tileKey(FCI, t, r, c), new Uint8Array(TILE_BYTES).fill(150))
    }
  }
  const frame: StoredFrame = { t, tiles, readyAt: opts.readyAt ?? NOW - 10 * MIN, exp: opts.exp ?? NOW + 40 * MIN }
  const older: StoredFrame = { ...frame, t: t - 10 * MIN, readyAt: frame.readyAt - 10 * MIN }
  const doc: FramesDoc = { v: 1, layers: { [FCI]: [frame, older], [IR]: [] } }
  map.set(FRAMES_KEY, JSON.stringify(doc))
  const kept = new Map<string, Response>()
  const deps: GeoServe = {
    store,
    now: () => NOW,
    encode: async (rgba, width, height) => {
      const out = encodeJpeg({ data: rgba, width, height }, 95).data
      return out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength) as ArrayBuffer
    },
    ...(opts.withCache ? { cache: { match: async (k: Request) => kept.get(k.url)?.clone(), put: async (k: Request, r: Response) => void kept.set(k.url, r) } } : {}),
  }
  return { deps, map, reads, kept, doc }
}

const get = (path: string, deps: GeoServe | null) => handleGeo(new Request(`https://www.watched.earth${path}`), deps)
const pixels = async (res: Response) => decodeJpeg(new Uint8Array(await res.arrayBuffer()), { useTArray: true })

describe('GET /api/geo', () => {
  it("cuts a place's picture from the stored frame, with no request to anyone", async () => {
    const c = cache()
    const res = await get(`/api/geo?layer=${encodeURIComponent(FCI)}&time=${encodeURIComponent(AT)}&${PARIS}&px=176`, c.deps)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('image/jpeg')
    // The browser keeps it a week (a frame's picture never changes); Cloudflare's cache an hour (router `cached`).
    expect(res.headers.get('cache-control')).toBe('public, max-age=604800, s-maxage=3600, immutable')
    const img = await pixels(res)
    expect([img.width, img.height]).toEqual([176, 176])
    const mid = (88 * 176 + 88) * 4
    expect(Math.abs(img.data[mid] - 150)).toBeLessThanOrEqual(2)
    // Paris's square lies in one row of tiles: the list of frames and two tiles are all that is read.
    expect(c.reads.filter((k) => k.startsWith('t/')).length).toBeLessThanOrEqual(3)
  })

  it('serves the list thumbnail (112 px) from the same frame', async () => {
    const img = await pixels(await get(`/api/geo?layer=${encodeURIComponent(FCI)}&time=${AT}&${PARIS}&px=112`, cache().deps))
    expect([img.width, img.height]).toEqual([112, 112])
  })

  it('is black where the frame has nothing, as EUMETSAT draws it', async () => {
    // Cape Town: south of the equator, where this frame stored no tile.
    const c = cache()
    const res = await get(`/api/geo?layer=${encodeURIComponent(FCI)}&time=${AT}&lat=-33.92000&lon=18.42000&px=176`, c.deps)
    expect(res.status).toBe(200)
    const img = await pixels(res)
    expect(Math.max(...img.data.filter((_, i) => i % 4 !== 3))).toBeLessThanOrEqual(2)
    expect(c.reads.filter((k) => k.startsWith('t/'))).toEqual([]) // and no tile is read for it
  })

  it("keeps the frame list and each tile in Cloudflare's cache: a second picture reads nothing from the store", async () => {
    const c = cache({ withCache: true })
    const path = (lon: string) => `/api/geo?layer=${encodeURIComponent(FCI)}&time=${AT}&lat=48.85700&lon=${lon}&px=176`
    expect((await get(path('2.35200'), c.deps)).status).toBe(200)
    const reads = c.reads.length
    expect(reads).toBeGreaterThan(0)
    expect((await get(path('2.60000'), c.deps)).status).toBe(200)
    expect(c.reads.length).toBe(reads)
    expect([...c.kept.keys()].every((k) => k.startsWith('https://www.watched.earth/api/geo/kept/'))).toBe(true)
  })

  it("sends a frame the cache does not hold to EUMETSAT's own render of the same square, by the visitor's browser", async () => {
    const res = await get(`/api/geo?layer=${encodeURIComponent(FCI)}&time=2026-11-12T09:20:00Z&${PARIS}&px=112`, cache().deps)
    expect(res.status).toBe(302)
    const to = new URL(res.headers.get('location')!)
    expect(to.origin + to.pathname).toBe('https://view.eumetsat.int/geoserver/wms')
    expect(to.searchParams.get('layers')).toBe(FCI)
    expect(to.searchParams.get('time')).toBe('2026-11-12T09:20:00Z')
    expect(to.searchParams.get('width')).toBe('112')
    expect(to.searchParams.get('bgcolor')).toBe('0x000000')
    const [s, w, n, e] = to.searchParams.get('bbox')!.split(',').map(Number)
    expect((s + n) / 2).toBeCloseTo(48.857, 4)
    expect((w + e) / 2).toBeCloseTo(2.352, 4)
    // A frame whose tiles have expired is one the cache does not hold.
    expect((await get(`/api/geo?layer=${encodeURIComponent(FCI)}&time=${AT}&${PARIS}&px=176`, cache({ exp: NOW - 1 }).deps)).status).toBe(302)
  })

  it('never redirects when the cache itself is broken: no store, a store that fails, a listed tile that is gone', async () => {
    const path = `/api/geo?layer=${encodeURIComponent(FCI)}&time=${AT}&${PARIS}&px=176`
    expect((await get(path, null)).status).toBe(503)
    const down = cache()
    down.deps.store.getText = async () => {
      throw new Error('KV is down')
    }
    const res = await get(path, down.deps)
    expect(res.status).toBe(503)
    expect(res.headers.get('cache-control')).toBe('no-store')
    const gone = cache()
    for (const k of [...gone.map.keys()]) if (k.startsWith('t/')) gone.map.delete(k)
    expect((await get(path, gone.deps)).status).toBe(503)
  })

  it('answers only for the pictures the app shows', async () => {
    const c = cache().deps
    const q = (o: Record<string, string>) => `/api/geo?${new URLSearchParams({ layer: FCI, time: AT, lat: '48.85700', lon: '2.35200', px: '176', ...o })}`
    expect((await get(q({ layer: 'msg_fes:rgb_dust' }), c)).status).toBe(400)
    expect((await get(q({ px: '1024' }), c)).status).toBe(400) // the opened picture is not cut from this grid
    expect((await get(q({ px: '8' }), c)).status).toBe(400)
    expect((await get(q({ lat: '91' }), c)).status).toBe(400)
    expect((await get(q({ lon: 'x' }), c)).status).toBe(400)
    expect((await get(q({ time: '2026-11-17T15:40:30Z' }), c)).status).toBe(400)
    expect((await get(q({ time: '2026-11-17T15:43:00Z' }), c)).status).toBe(404) // not on the 10-minute cadence
    expect((await get(q({ time: '2026-11-18T15:40:00Z' }), c)).status).toBe(404) // not yet taken
    expect((await handleGeo(new Request(`https://www.watched.earth${q({})}`, { method: 'POST' }), c)).status).toBe(405)
  })
})

describe('GET /api/geo-frames', () => {
  const frames = (deps: GeoServe | null) => handleGeoFrames(new Request('https://www.watched.earth/api/geo-frames'), deps)

  it("lists each layer's frames that can be cut, newest first, for a minute", async () => {
    const res = await frames(cache().deps)
    expect(res.status).toBe(200)
    expect(res.headers.get('cache-control')).toBe('public, max-age=60, s-maxage=60')
    expect(await res.json()).toEqual({ v: 1, layers: { [FCI]: [Date.parse(AT), Date.parse(AT) - 10 * MIN], 'msg_iodc:rgb_naturalenhncd': [], [IR]: [] } })
  })

  it('does not list a frame until two minutes after it was stored', async () => {
    const res = await frames(cache({ readyAt: NOW - LIST_DELAY_MS + 1000 }).deps)
    expect(((await res.json()) as { layers: Record<string, number[]> }).layers[FCI]).toEqual([Date.parse(AT) - 10 * MIN])
  })

  it('says so when there is no store, rather than list nothing for a minute', async () => {
    expect((await frames(null)).status).toBe(503)
    const down = cache()
    down.deps.store.getText = async () => {
      throw new Error('KV is down')
    }
    const res = await frames(down.deps)
    expect(res.status).toBe(503)
    expect(res.headers.get('cache-control')).toBe('no-store')
  })
})
