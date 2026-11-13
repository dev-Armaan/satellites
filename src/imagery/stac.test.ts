import { afterEach, describe, expect, it, vi } from 'vitest'
import pcS2 from './__fixtures__/pc-s2-waterloo.json'
import pcLandsat from './__fixtures__/pc-landsat-waterloo.json'
import esS2 from './__fixtures__/es-s2-waterloo.json'
import clearS2 from './__fixtures__/pc-clear-sentinel-2-l2a-waterloo.json'
import clearLs from './__fixtures__/pc-clear-landsat-c2-l2-waterloo.json'
import { pcCropUrl } from './pcCrop'
import {
  dedupeCandidates,
  earthSearchItemToCandidate,
  footprintMarginKm,
  isPcS2ItemId,
  normalizePlatform,
  noradForPlatform,
  pcItemIdFromProductUri,
  pcItemToCandidate,
  clearSceneBody,
  _resetSearchTransport,
  searchBody,
  searchClearScenes,
  searchGetUrl,
  searchCapturesDetailed,
  stacIso,
  stacSearchAll,
  type Candidate,
  type StacItem,
  type StacItemCollection,
} from './stac'

const WATERLOO = { lat: 43.4723, lon: -80.5449 }
const s2Items = (pcS2 as unknown as StacItemCollection).features
const lsItems = (pcLandsat as unknown as StacItemCollection).features
const esItems = (esS2 as unknown as StacItemCollection).features
const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x))

/** The search a mocked fetch was asked for, whether it came as a GET's query string or a POST's JSON body. */
function askedFor(url: string, init?: RequestInit): Record<string, any> {
  if (init?.body !== undefined && init.body !== null) return JSON.parse(String(init.body))
  const q = new URL(url).searchParams
  const out: Record<string, any> = {}
  for (const [k, v] of q) out[k] = k === 'collections' ? v.split(',') : k === 'intersects' || k === 'query' ? JSON.parse(v) : k === 'limit' ? Number(v) : v
  return out
}

describe('platforms', () => {
  it('normalizes archive platform names to lowercase ids', () => {
    expect(normalizePlatform('Sentinel-2C')).toBe('sentinel-2c')
    expect(normalizePlatform('Sentinel-2A')).toBe('sentinel-2a')
    expect(normalizePlatform(' sentinel-2b ')).toBe('sentinel-2b')
    expect(normalizePlatform('SENTINEL2B')).toBe('sentinel-2b')
    expect(normalizePlatform('landsat-9')).toBe('landsat-9')
    expect(normalizePlatform('LANDSAT_8')).toBe('landsat-8')
    expect(normalizePlatform('landsat8')).toBe('landsat-8')
  })
  it('maps platforms to NORAD ids', () => {
    expect(noradForPlatform('Sentinel-2A')).toBe(40697)
    expect(noradForPlatform('Sentinel-2B')).toBe(42063)
    expect(noradForPlatform('Sentinel-2C')).toBe(60989)
    expect(noradForPlatform('landsat-8')).toBe(39084)
    expect(noradForPlatform('landsat-9')).toBe(49260)
    expect(noradForPlatform('landsat-7')).toBeUndefined()
  })
})

describe('URL builders', () => {
  it('builds a geographic Sentinel-2 crop (the globe’s decal) as lon/lat bbox with the encoded render (tone.ts)', () => {
    const url = pcCropUrl('sentinel-2-l2a', 'S2C_MSIL2A_20261101T161421_R140_T17TNJ_20261102T164803', WATERLOO, { halfSizeKm: 3, px: 768, geographic: true })
    expect(url).toBe(
      'https://planetarycomputer.microsoft.com/api/data/v1/item/bbox/-80.582077,43.445320,-80.507723,43.499280/768x768.png' +
        '?collection=sentinel-2-l2a&item=S2C_MSIL2A_20261101T161421_R140_T17TNJ_20261102T164803' +
        '&assets=B04&assets=B03&assets=B02&asset_as_band=true' +
        '&expression=sqrt(where(B04%3E1000%2CB04-1000%2C0))%3Bsqrt(where(B03%3E1000%2CB03-1000%2C0))%3Bsqrt(where(B02%3E1000%2CB02-1000%2C0))' +
        '&rescale=0,100&nodata=0&reproject=lanczos',
    )
  })
  it('builds a Landsat crop from the surface-reflectance bands', () => {
    const url = pcCropUrl('landsat-c2-l2', 'LC09_L2SP_019030_20261022_02_T1', WATERLOO, { halfSizeKm: 3, px: 512, geographic: true })
    const [path, query] = url.split('?')
    expect(path).toBe('https://planetarycomputer.microsoft.com/api/data/v1/item/bbox/-80.582077,43.445320,-80.507723,43.499280/512x512.png')
    expect(query).toBe(
      'collection=landsat-c2-l2&item=LC09_L2SP_019030_20261022_02_T1&assets=red&assets=green&assets=blue&asset_as_band=true' +
        '&expression=sqrt(where(red%3E7272.727%2Cred-7272.727%2C0))%3Bsqrt(where(green%3E7272.727%2Cgreen-7272.727%2C0))%3Bsqrt(where(blue%3E7272.727%2Cblue-7272.727%2C0))' +
        '&rescale=0,190.693&reproject=lanczos',
    )
  })
  it('keeps west < east and south < north, and clamps px', () => {
    const url = pcCropUrl('sentinel-2-l2a', 'x', { lat: -33.86, lon: 151.21 }, { halfSizeKm: 5, px: 99999 })
    const [w, s, e, n] = /bbox\/([^/]+)\//.exec(url)![1].split(',').map(Number)
    expect(w).toBeLessThan(e)
    expect(s).toBeLessThan(n)
    expect(url).toContain('/2048x2048.png')
    expect(pcCropUrl('sentinel-2-l2a', 'x', WATERLOO, { halfSizeKm: 3, px: 1 })).toContain('/8x8.png')
  })
})

describe('PC item → capture', () => {
  it('converts a Sentinel-2 item', () => {
    const c = pcItemToCandidate(s2Items[2], WATERLOO)!
    expect(c).toBeDefined()
    const cap = c.capture
    expect(cap.id).toBe('S2C_MSIL2A_20261101T161421_R140_T17TNJ_20261102T164803')
    expect(cap.provider).toBe('planetary-computer')
    expect(cap.collection).toBe('sentinel-2-l2a')
    expect(cap.platform).toBe('sentinel-2c')
    expect(cap.norad).toBe(60989)
    expect(cap.datetime).toBe(Date.parse('2026-11-01T16:14:21.025Z'))
    expect(cap.gsdM).toBe(10)
    expect(cap.cloudCoverPct).toBeCloseTo(25.456536)
    // S2 has no view:sun_elevation on PC: derived from the mean solar zenith
    const zenith = s2Items[2].properties['s2:mean_solar_zenith'] as number
    expect(cap.sunElevationDeg).toBeCloseTo(90 - zenith, 6)
    expect(cap.footprint!.length).toBeGreaterThanOrEqual(4)
    expect(cap.footprint![0]).toHaveLength(2)
    expect(cap.previewUrl).toMatch(/^https:\/\/planetarycomputer\.microsoft\.com\/api\/data\/v1\/item\/preview\.png\?collection=sentinel-2-l2a/)
    expect(cap.sourceUrl).toBe(
      'https://planetarycomputer.microsoft.com/api/stac/v1/collections/sentinel-2-l2a/items/S2C_MSIL2A_20261101T161421_R140_T17TNJ_20261102T164803',
    )
    // The scene's own CRS (STAC proj:epsg): UTM 17N, the zone of the place, so its photo is its own pixels 1:1.
    expect(c.epsg).toBe(32617)
    expect(cap.cropUrl({ halfSizeKm: 3, px: 768 })).toBe(pcCropUrl('sentinel-2-l2a', cap.itemId, WATERLOO, { halfSizeKm: 3, px: 768 }))
    expect(cap.cropUrl({ halfSizeKm: 5, px: 1000 })).toMatch(/\/item\/bbox\/\d+0,\d+0,\d+0,\d+0\/1000x1000\.png\?collection=sentinel-2-l2a&item=S2C_[^&]+&coord_crs=EPSG:32617&dst_crs=EPSG:32617&assets=B04/)
    expect(cap.cropUrl({ halfSizeKm: 5, px: 1000 })).not.toMatch(/resampling/) // native size: copied 1:1
    // The globe's decal asks for lon/lat (its patch on the sphere is linear in lon/lat).
    expect(cap.cropUrl({ halfSizeKm: 40, px: 1024, geographic: true })).toBe(pcCropUrl('sentinel-2-l2a', cap.itemId, WATERLOO, { halfSizeKm: 40, px: 1024, geographic: true }))
    expect(cap.cropUrl({ halfSizeKm: 40, px: 1024, geographic: true })).toMatch(/\/bbox\/-8\d\.\d{6},4\d\.\d{6},-8\d\.\d{6},4\d\.\d{6}\/1024x1024\.png\?.*&reproject=lanczos$/)
    expect(c.tile).toBe('17TNJ')
    expect(c.processing).toBe('05.13|20261102T164803')
  })

  it('converts a Landsat item and uses view:sun_elevation', () => {
    const cap = pcItemToCandidate(lsItems[0], WATERLOO)!.capture
    expect(cap.platform).toBe('landsat-9')
    expect(cap.norad).toBe(49260)
    expect(cap.gsdM).toBe(30)
    expect(cap.sunElevationDeg).toBeCloseTo(30.92594659)
    expect(cap.cloudCoverPct).toBeCloseTo(11.68)
    expect(cap.cropUrl({ halfSizeKm: 3, px: 256 })).toContain('collection=landsat-c2-l2&item=LC09_L2SP_018030_20261031_02_T1&coord_crs=EPSG:32617&dst_crs=EPSG:32617&assets=red')
    // Landsat's pixel corners sit 15 m off the 30 m lattice (proj:transform 455385 / 4898715): so do the place grid's.
    expect(pcItemToCandidate(lsItems[0], WATERLOO)!.epsg).toBe(32617)
    expect(cap.cropUrl({ halfSizeKm: 7.5, px: 1000 })).toMatch(/\/bbox\/\d+5,\d+5,\d+5,\d+5\/1000x1000\.png\?.*&resampling=lanczos$/)
  })

  it('cuts a scene off the place’s grid on that grid all the same (Landsat over Antarctica: EPSG:3031, warped)', () => {
    const polar = clone(lsItems[0])
    polar.properties['proj:epsg'] = 3031
    const c = pcItemToCandidate(polar, WATERLOO)!
    expect(c.epsg).toBeUndefined()
    expect(c.capture.cropUrl({ halfSizeKm: 7.5, px: 1000 })).toBe(pcItemToCandidate(lsItems[0], WATERLOO)!.capture.cropUrl({ halfSizeKm: 7.5, px: 1000 }))
    expect(c.capture.cropUrl({ halfSizeKm: 7.5, px: 1000 })).toContain('coord_crs=EPSG:32617&dst_crs=EPSG:32617&')
    expect(c.capture.cropUrl({ halfSizeKm: 7.5, px: 1000 })).toContain('&reproject=lanczos')
  })

  it('drops Landsat 7', () => {
    const l7 = clone(lsItems[0])
    l7.properties.platform = 'landsat-7'
    expect(pcItemToCandidate(l7, WATERLOO)).toBeUndefined()
  })
})

describe('Earth Search fallback', () => {
  it('rebuilds the PC item id from the ESA product URI (matches the real PC ids)', () => {
    const pcIds = new Set(s2Items.map((i) => i.id))
    for (const it of esItems) {
      const id = pcItemIdFromProductUri(it.properties['s2:product_uri'] as string)
      expect(id && pcIds.has(id)).toBe(true)
      expect(isPcS2ItemId(id!)).toBe(true)
    }
    expect(pcItemIdFromProductUri('garbage')).toBeUndefined()
    expect(isPcS2ItemId('S2B_T17TNJ_20261106T161753_L2A')).toBe(false)
  })

  it('converts items, cropping via PC and previewing via the E84 thumbnail', () => {
    const c = earthSearchItemToCandidate(esItems[0], WATERLOO)!
    expect(c.capture.provider).toBe('earth-search')
    expect(c.capture.platform).toBe('sentinel-2b')
    expect(c.capture.itemId).toBe('S2B_MSIL2A_20261106T161449_R140_T17TNJ_20261106T195148')
    expect(c.capture.cropUrl({ halfSizeKm: 3, px: 64 })).toContain('planetarycomputer.microsoft.com/api/data/v1/item/bbox/')
    expect(c.capture.previewUrl).toMatch(/L2A_PVI\.jpg$/)
    expect(c.capture.sunElevationDeg).toBeCloseTo(29.2934520718594)
    expect(c.tile).toBe('17TNJ')
    expect(c.epsg).toBe(32617)
  })

  it('degrades to the thumbnail when no PC id can be derived', () => {
    const it2 = clone(esItems[0])
    delete it2.properties['s2:product_uri']
    const c = earthSearchItemToCandidate(it2, WATERLOO)!
    expect(c.capture.itemId).toBe(esItems[0].id)
    expect(c.capture.cropUrl({ halfSizeKm: 3, px: 64 })).toBe(c.capture.previewUrl)
  })
})

describe('dedupe', () => {
  const cands = () => s2Items.map((i) => pcItemToCandidate(i, WATERLOO)!).concat(lsItems.map((i) => pcItemToCandidate(i, WATERLOO)!))

  it('keeps every distinct overflight in the real fixture, newest first', () => {
    const out = dedupeCandidates(cands(), WATERLOO)
    expect(out).toHaveLength(s2Items.length + lsItems.length)
    const times = out.map((c) => c.capture.datetime)
    expect([...times].sort((a, b) => b - a)).toEqual(times)
  })

  it('keeps the newest processing of the same datatake + tile', () => {
    const newer = s2Items[2]
    const older: StacItem = clone(newer)
    older.id = newer.id.replace(/_\d{8}T\d{6}$/, '_20261101T235959') // generated earlier… but
    older.properties['s2:processing_baseline'] = '05.11' // …with an older baseline
    const reproc: StacItem = clone(newer)
    reproc.id = newer.id.replace(/_\d{8}T\d{6}$/, '_20261120T101010') // reprocessed later
    const input = [older, newer, reproc].map((i) => pcItemToCandidate(i, WATERLOO)!)
    const out = dedupeCandidates(input, WATERLOO)
    expect(out).toHaveLength(1)
    expect(out[0].capture.itemId).toBe(reproc.id)
  })

  it('keeps one tile per datatake: the one the place sits deepest inside', () => {
    const a = pcItemToCandidate(s2Items[2], WATERLOO)!
    const edge: StacItem = clone(s2Items[2])
    edge.id = edge.id.replace('T17TNJ', 'T17TNH')
    edge.properties['s2:mgrs_tile'] = '17TNH'
    // shift the footprint so the place is ~1 km inside its northern edge
    const ring = (edge.geometry as { coordinates: number[][][] }).coordinates[0]
    const top = Math.max(...ring.map((p) => p[1]))
    const shift = WATERLOO.lat + 0.01 - top
    ;(edge.geometry as { coordinates: number[][][] }).coordinates[0] = ring.map(([x, y]) => [x, y + shift])
    const b = pcItemToCandidate(edge, WATERLOO)!
    expect(footprintMarginKm(b.capture.footprint, WATERLOO)).toBeLessThan(footprintMarginKm(a.capture.footprint, WATERLOO))
    expect(dedupeCandidates([b, a], WATERLOO).map((c) => c.capture.itemId)).toEqual([a.capture.itemId])
  })

  it('keeps the tile on the place’s grid when the whole photo lies in it, else the one the place sits deepest inside', () => {
    // One datatake over a place near a zone edge: a zone-17 tile (the place's) and a zone-16 tile it sits deeper in.
    const at = WATERLOO
    const kx = 111.32 * Math.cos((at.lat * Math.PI) / 180)
    // A footprint the place sits `km` inside of (its west edge), 100 km out on the other sides.
    const ring = (km: number): [number, number][] => {
      const w = at.lon - km / kx
      const e = at.lon + 100 / kx
      const s = at.lat - 1
      const n = at.lat + 1
      return [[w, s], [e, s], [e, n], [w, n], [w, s]]
    }
    const base = pcItemToCandidate(s2Items[2], WATERLOO)!
    const tile = (id: string, epsg: number, km: number): Candidate => ({ ...base, tile: id, epsg, capture: { ...base.capture, id, itemId: id, footprint: ring(km) } })
    const pick = (cs: Candidate[]) => dedupeCandidates(cs, at).map((c) => c.capture.itemId)
    // 9 km in: the 10 km photo's square (half-diagonal 7.1 km) is inside the zone-17 tile: it wins, copied 1:1.
    expect(pick([tile('z16', 32616, 60), tile('z17', 32617, 9)])).toEqual(['z17'])
    expect(pick([tile('z17', 32617, 9), tile('z16', 32616, 60)])).toEqual(['z17'])
    // 5 km in: the photo would run off the zone-17 tile; the deeper zone-16 tile wins (warped onto zone 17's grid).
    expect(pick([tile('z16', 32616, 60), tile('z17', 32617, 5)])).toEqual(['z16'])
    // Both on the place's grid: the deeper one, as before.
    expect(pick([tile('a', 32617, 9), tile('b', 32617, 30)])).toEqual(['b'])
  })

  it('merges adjacent Landsat rows of the same overflight but not different satellites', () => {
    const row30 = pcItemToCandidate(lsItems[0], WATERLOO)!
    const row29: Candidate = { ...row30, tile: '018/029', capture: { ...row30.capture, id: 'r29', itemId: 'r29', datetime: row30.capture.datetime - 24_000, footprint: undefined } }
    const other: Candidate = { ...row30, capture: { ...row30.capture, id: 'l8', itemId: 'l8', platform: 'landsat-8', datetime: row30.capture.datetime + 10_000 } }
    const out = dedupeCandidates([row29, row30, other], WATERLOO)
    expect(out.map((c) => c.capture.itemId).sort()).toEqual([row30.capture.itemId, 'l8'].sort())
  })
})

describe('search', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('builds search bodies (Point, ISO range without ms, Landsat platform filter)', () => {
    const start = Date.parse('2026-11-01T00:00:00.400Z')
    const end = Date.parse('2026-11-08T03:00:00.200Z')
    const b = searchBody('landsat-c2-l2', WATERLOO, start, end)
    expect(b.intersects).toEqual({ type: 'Point', coordinates: [-80.5449, 43.4723] })
    expect(b.datetime).toBe('2026-11-01T00:00:00Z/2026-11-08T03:00:01Z')
    expect(b.limit).toBe(100)
    expect(b.query).toEqual({ platform: { in: ['landsat-8', 'landsat-9'] } })
    expect(searchBody('sentinel-2-l2a', WATERLOO, start, end).query).toBeUndefined()
    expect(stacIso(Date.parse('2026-11-08T03:45:12.999Z'))).toBe('2026-11-08T03:45:12Z')
  })

  it('follows POST next links with their token body', async () => {
    const calls: { url: string; method: string; body: Record<string, any> }[] = []
    const page1 = { features: s2Items.slice(0, 2), links: [{ rel: 'next', method: 'POST', href: 'https://x/search', body: { token: 'next:2' } }] }
    const page2 = { features: s2Items.slice(2, 3), links: [] }
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init: RequestInit) => {
        const body = askedFor(url, init)
        calls.push({ url, method: init.method ?? 'GET', body })
        return new Response(JSON.stringify(body.token ? page2 : page1), { status: 200, headers: { 'content-type': 'application/json' } })
      }),
    )
    const items = await stacSearchAll('https://x/search', { collections: ['sentinel-2-l2a'] }, undefined)
    expect(items.map((i) => i.id)).toEqual(s2Items.slice(0, 3).map((i) => i.id))
    expect(calls).toHaveLength(2)
    expect(calls[0].method).toBe('GET')
    expect(calls[1].method).toBe('POST')
    expect(calls[1].body).toEqual({ token: 'next:2' }) // merge: false → body replaces
  })

  it('follows GET next links as they are (what a GET search is answered with)', async () => {
    const urls: string[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        urls.push(url)
        const second = url.includes('token=next')
        return Response.json({ features: second ? s2Items.slice(2, 3) : s2Items.slice(0, 2), links: second ? [] : [{ rel: 'next', href: 'https://x/search?collections=sentinel-2-l2a&token=next:2' }] })
      }),
    )
    const items = await stacSearchAll('https://x/search', { collections: ['sentinel-2-l2a'] }, undefined)
    expect(items.map((i) => i.id)).toEqual(s2Items.slice(0, 3).map((i) => i.id))
    expect(urls).toEqual(['https://x/search?collections=sentinel-2-l2a', 'https://x/search?collections=sentinel-2-l2a&token=next:2'])
  })

  it('falls back to Earth Search for Sentinel-2 when PC search fails, and reports it', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init: RequestInit) => {
        const body = askedFor(url, init)
        if (url.includes('planetarycomputer') && body.collections[0] === 'sentinel-2-l2a') return new Response('down', { status: 503 })
        if (url.includes('planetarycomputer')) return Response.json({ features: lsItems, links: [] })
        return Response.json({ features: esItems, links: [] })
      }),
    )
    const r = await searchCapturesDetailed(WATERLOO, Date.parse('2026-10-01T00:00:00Z'), Date.parse('2026-11-08T00:00:00Z'))
    const providers = new Set(r.captures.map((c) => c.provider))
    expect(providers).toEqual(new Set(['earth-search', 'planetary-computer']))
    expect(r.captures.filter((c) => c.collection === 'sentinel-2-l2a')).toHaveLength(esItems.length)
    expect(r.degraded.join(' ')).toMatch(/Earth Search/)
  })

  it('hands Sentinel-2’s scenes over the moment that archive answers, before Landsat’s (the lead photo’s crop starts then)', async () => {
    let releaseLandsat!: () => void
    const landsatHeld = new Promise<void>((r) => (releaseLandsat = r))
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init: RequestInit) => {
        const body = askedFor(_url, init)
        if (body.collections[0] === 'landsat-c2-l2') await landsatHeld
        return Response.json({ features: body.collections[0] === 'landsat-c2-l2' ? lsItems : s2Items, links: [] })
      }),
    )
    const early: string[][] = []
    const done = searchCapturesDetailed(WATERLOO, Date.parse('2026-10-01T00:00:00Z'), Date.parse('2026-11-08T00:00:00Z'), undefined, (caps) =>
      early.push(caps.map((c) => c.collection)),
    )
    await vi.waitFor(() => expect(early).toHaveLength(1))
    expect(new Set(early[0])).toEqual(new Set(['sentinel-2-l2a']))
    releaseLandsat()
    const r = await done
    expect(early).toHaveLength(1)
    expect(r.captures.some((c) => c.collection === 'landsat-c2-l2')).toBe(true)
  })

  /** A request the archive never answers: it ends only when its signal aborts (the timeout, or the caller). */
  const hang = (init: RequestInit) =>
    new Promise<Response>((_, reject) => init.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), { once: true }))

  it('gives a silent Landsat search up after one 8 s attempt and keeps Sentinel-2’s scenes', async () => {
    vi.useFakeTimers()
    try {
      const asked: string[] = []
      vi.stubGlobal(
        'fetch',
        vi.fn(async (url: string, init: RequestInit) => {
          const collection = askedFor(url, init).collections[0]
          asked.push(collection)
          return collection === 'landsat-c2-l2' ? hang(init) : Response.json({ features: s2Items, links: [] })
        }),
      )
      let r: Awaited<ReturnType<typeof searchCapturesDetailed>> | undefined
      void searchCapturesDetailed(WATERLOO, Date.parse('2026-10-01T00:00:00Z'), Date.parse('2026-11-08T00:00:00Z')).then((v) => (r = v))
      await vi.advanceTimersByTimeAsync(7_900)
      expect(r).toBeUndefined()
      await vi.advanceTimersByTimeAsync(200)
      // Well inside the report's 20 s: the scenes that did answer are used, with a note about the other archive.
      expect(r?.captures.length).toBeGreaterThan(0)
      expect(r?.captures.every((c) => c.collection === 'sentinel-2-l2a')).toBe(true)
      expect(r?.degraded.join(' ')).toMatch(/Landsat archive unreachable/)
      expect(asked.filter((c) => c === 'landsat-c2-l2')).toHaveLength(1) // not asked again
    } finally {
      vi.useRealTimers()
    }
  })

  it('asks Earth Search 8 s into a silent Planetary Computer, in time for the report', async () => {
    vi.useFakeTimers()
    try {
      const t0 = Date.now()
      let earthSearchAt = -1
      vi.stubGlobal(
        'fetch',
        vi.fn(async (url: string, init: RequestInit) => {
          if (url.includes('planetarycomputer')) return hang(init)
          earthSearchAt = Date.now() - t0
          return Response.json({ features: esItems, links: [] })
        }),
      )
      let r: Awaited<ReturnType<typeof searchCapturesDetailed>> | undefined
      void searchCapturesDetailed(WATERLOO, Date.parse('2026-10-01T00:00:00Z'), Date.parse('2026-11-08T00:00:00Z')).then((v) => (r = v))
      await vi.advanceTimersByTimeAsync(8_100)
      expect(earthSearchAt).toBeGreaterThanOrEqual(8_000)
      expect(earthSearchAt).toBeLessThan(8_100)
      expect(r?.captures).toHaveLength(esItems.length)
      expect(r?.degraded.join(' ')).toMatch(/Earth Search/)
    } finally {
      vi.useRealTimers()
    }
  })

  it('throws only when every archive fails; aborts propagate', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('down', { status: 503 })))
    await expect(searchCapturesDetailed(WATERLOO, 0, 1e12)).rejects.toThrow(/unreachable/)
    const ctrl = new AbortController()
    ctrl.abort()
    await expect(searchCapturesDetailed(WATERLOO, 0, 1e12, ctrl.signal)).rejects.toMatchObject({ name: 'AbortError' })
  })
})

describe('searches go out as GET: no CORS preflight ahead of the archive (a round trip saved on every search)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    _resetSearchTransport()
  })
  const start = Date.parse('2026-11-01T00:00:00Z')
  const end = Date.parse('2026-11-08T00:00:00Z')

  it('writes every body this module builds as a query string that reads back as the same search', () => {
    for (const body of [
      searchBody('sentinel-2-l2a', WATERLOO, start, end),
      searchBody('landsat-c2-l2', WATERLOO, start, end),
      clearSceneBody('sentinel-2-l2a', WATERLOO, start, end),
      clearSceneBody('landsat-c2-l2', WATERLOO, start, end),
      { ...searchBody('sentinel-2-l2a', WATERLOO, start, end), limit: 1 },
    ]) {
      const url = searchGetUrl('https://x/search', body)!
      const { sortby, ...rest } = askedFor(url)
      const { sortby: bodySort, ...bodyRest } = body
      expect(rest).toEqual(bodyRest)
      expect(sortby).toBe(bodySort ? '-datetime' : undefined)
    }
    const q = new URL(searchGetUrl('https://x/search', clearSceneBody('landsat-c2-l2', WATERLOO, start, end))!).searchParams
    expect(q.get('collections')).toBe('landsat-c2-l2')
    expect(q.get('intersects')).toBe('{"type":"Point","coordinates":[-80.5449,43.4723]}')
    expect(q.get('datetime')).toBe('2026-11-01T00:00:00Z/2026-11-08T00:00:00Z')
    expect(q.get('query')).toBe('{"platform":{"in":["landsat-8","landsat-9"]},"eo:cloud_cover":{"lt":20}}')
    // An ascending sort's "+" must survive the query string (a bare "+" reads back as a space).
    expect(searchGetUrl('https://x/search', { sortby: [{ field: 'datetime', direction: 'asc' }] })).toBe('https://x/search?sortby=%2Bdatetime')
  })

  it('keeps the POST for a body it cannot write faithfully', () => {
    expect(searchGetUrl('https://x/search', { collections: ['a'], filter: { op: '=' } })).toBeUndefined()
    expect(searchGetUrl('https://x/search', { collections: ['a,b'] })).toBeUndefined()
    expect(searchGetUrl('https://x/search', { sortby: [{ field: 'datetime' }] })).toBeUndefined()
    expect(searchGetUrl('https://x/search', { limit: 1.5 })).toBeUndefined()
    expect(searchGetUrl('https://x/search', { query: { note: 'x'.repeat(2000) } })).toBeUndefined()
  })

  it('a search is one simple GET: no method, no body, no headers that would need a preflight', async () => {
    const seen: { url: string; init: RequestInit }[] = []
    vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => (seen.push({ url, init }), Response.json({ features: [], links: [] }))))
    await searchCapturesDetailed(WATERLOO, start, end)
    await searchClearScenes(WATERLOO, start, end)
    expect(seen).toHaveLength(4)
    for (const { url, init } of seen) {
      expect(url.startsWith('https://planetarycomputer.microsoft.com/api/stac/v1/search?')).toBe(true)
      expect(init.method ?? 'GET').toBe('GET')
      expect(init.body).toBeUndefined()
      expect(init.headers).toBeUndefined()
    }
  })

  it('an archive that refuses the GET form is asked by POST, and from then on by POST only', async () => {
    const methods: string[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init: RequestInit) => {
        const method = init.method ?? 'GET'
        methods.push(method)
        return method === 'GET' ? new Response('{"code":"BadRequest"}', { status: 400 }) : Response.json({ features: s2Items.slice(0, 1), links: [] })
      }),
    )
    expect(await stacSearchAll('https://x/search', { collections: ['sentinel-2-l2a'] })).toHaveLength(1)
    expect(methods).toEqual(['GET', 'POST'])
    expect(await stacSearchAll('https://x/search', { collections: ['sentinel-2-l2a'] })).toHaveLength(1)
    expect(methods).toEqual(['GET', 'POST', 'POST'])
  })

  it('an archive that is down is not asked a second way: the wait before the fallback stays what it was', async () => {
    const methods: string[] = []
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => (methods.push(init.method ?? 'GET'), new Response('down', { status: 503 }))))
    await expect(stacSearchAll('https://x/search', { collections: ['sentinel-2-l2a'] })).rejects.toMatchObject({ status: 503 })
    expect(methods).toEqual(['GET', 'GET']) // one attempt and its one retry, as the POST had
  })
})

describe('clear scenes (owner D: the last clear look before a cloudy week)', () => {
  afterEach(() => vi.unstubAllGlobals())
  const start = Date.parse('2026-09-02T00:00:00Z')
  const end = Date.parse('2026-10-25T00:00:00Z')

  it('asks the archive for nearly cloud-free scenes, newest first, one page', () => {
    const s2 = clearSceneBody('sentinel-2-l2a', WATERLOO, start, end)
    expect(s2.query).toEqual({ 'eo:cloud_cover': { lt: 20 } })
    expect(s2.sortby).toEqual([{ field: 'datetime', direction: 'desc' }])
    expect(s2.limit).toBe(12)
    expect(s2.intersects).toEqual({ type: 'Point', coordinates: [-80.5449, 43.4723] })
    // Landsat keeps its platform filter alongside the cloud filter.
    expect(clearSceneBody('landsat-c2-l2', WATERLOO, start, end).query).toEqual({ platform: { in: ['landsat-8', 'landsat-9'] }, 'eo:cloud_cover': { lt: 20 } })
  })

  it('returns both collections as captures, newest first, deduped (recorded PC answers)', async () => {
    const bodies: Record<string, unknown>[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init: RequestInit) => {
        const body = askedFor(_url, init) as { collections: string[] }
        bodies.push(body)
        return Response.json(body.collections[0] === 'sentinel-2-l2a' ? clearS2 : clearLs)
      }),
    )
    const caps = await searchClearScenes(WATERLOO, start, end)
    expect(bodies).toHaveLength(2)
    expect(caps.length).toBe((clearS2 as unknown as StacItemCollection).features.length + (clearLs as unknown as StacItemCollection).features.length)
    expect(caps.map((c) => c.datetime)).toEqual([...caps.map((c) => c.datetime)].sort((a, b) => b - a))
    expect(caps[0].itemId).toBe('S2A_MSIL2A_20261024T161701_R140_T17TNJ_20261024T205201')
    expect(caps.every((c) => (c.cloudCoverPct ?? 100) < 20 && c.provider === 'planetary-computer')).toBe(true)
    expect(caps.find((c) => c.collection === 'landsat-c2-l2')?.gsdM).toBe(30)
    expect(caps[0].cropUrl({ halfSizeKm: 5, px: 1024 })).toMatch(/item\/bbox\/.*1024x1024\.png\?collection=sentinel-2-l2a/)
  })

  it('keeps whichever collection answered, and resolves [] when neither does', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init: RequestInit) => {
        const body = askedFor(_url, init) as { collections: string[] }
        return body.collections[0] === 'sentinel-2-l2a' ? new Response('down', { status: 503 }) : Response.json(clearLs)
      }),
    )
    const caps = await searchClearScenes(WATERLOO, start, end)
    expect(caps.every((c) => c.collection === 'landsat-c2-l2')).toBe(true)
    expect(caps.length).toBeGreaterThan(0)
    vi.stubGlobal('fetch', vi.fn(async () => new Response('down', { status: 503 })))
    await expect(searchClearScenes(WATERLOO, start, end)).resolves.toEqual([])
  })
})
