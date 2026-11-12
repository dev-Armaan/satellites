import { afterEach, describe, expect, it, vi } from 'vitest'
import { GIBS_TILES, TILE_PX, gibsProbeTileUrl, isGibsTileUrl, tileWindowOf } from './gibsTiles'

const LAYER = 'VIIRS_NOAA20_CorrectedReflectance_TrueColor'
const FRESNO = { lat: 36.456, lon: -120.089 }
/** The probe's square (30 km each way) and grain (2.5 km), as gibs.ts asks for it. */
const probe = (place: { lat: number; lon: number }) => gibsProbeTileUrl(LAYER, '2026-11-11', place, 30, 2.5)

describe('GIBS probe tiles', () => {
  it('names the tile that holds the place and the window around it', () => {
    // Tile checked against a real request (2026-11-12): 256 px JPEG of California, 13.7 kB in 0.5 s.
    expect(probe(FRESNO)).toBe(`${GIBS_TILES}/${LAYER}/default/2026-11-11/GoogleMapsCompatible_Level9/6/25/10.jpg#win=151,0,31,24`)
    expect(isGibsTileUrl(probe(FRESNO)!)).toBe(true)
    // Fresno sits 8 px under its tile's top edge: the window is clipped there, not read from the tile above.
    expect(tileWindowOf(probe(FRESNO)!)).toEqual({ x: 151, y: 0, w: 31, h: 24 })
  })

  it('zooms out with latitude, so a pixel stays between 1.25 and 2.5 km', () => {
    const zoomOf = (lat: number) => Number(/Level9\/(\d+)\//.exec(probe({ lat, lon: 10 })!)![1])
    expect(zoomOf(0)).toBe(6)
    expect(zoomOf(45)).toBe(6)
    expect(zoomOf(64.15)).toBe(5)
    expect(zoomOf(-77.85)).toBe(4)
    for (const lat of [0, 20, 45, 59, 61, 70, 80, 85]) {
      const km = (40_075.017 * Math.cos((lat * Math.PI) / 180)) / (2 ** zoomOf(lat) * TILE_PX)
      expect(km).toBeLessThanOrEqual(2.5)
      expect(km).toBeGreaterThan(1.25)
    }
  })

  it('keeps the window on the tile, around the place, wherever the place is', () => {
    let seed = 7
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647
    for (let i = 0; i < 2000; i++) {
      const place = { lat: rnd() * 170 - 85, lon: rnd() * 360 - 180 }
      const url = probe(place)!
      const [, z, row, col] = /Level9\/(\d+)\/(\d+)\/(\d+)\.jpg/.exec(url)!.map(Number)
      const n = 2 ** z
      expect(row).toBeGreaterThanOrEqual(0)
      expect(row).toBeLessThan(n)
      expect(col).toBeGreaterThanOrEqual(0)
      expect(col).toBeLessThan(n)
      const w = tileWindowOf(url)!
      expect(w.x).toBeGreaterThanOrEqual(0)
      expect(w.y).toBeGreaterThanOrEqual(0)
      expect(w.x + w.w).toBeLessThanOrEqual(TILE_PX)
      expect(w.y + w.h).toBeLessThanOrEqual(TILE_PX)
      // At least the half of the square on the place's side of an edge, and never more than the square.
      expect(w.w).toBeGreaterThanOrEqual(12)
      expect(w.h).toBeGreaterThanOrEqual(12)
      expect(w.w).toBeLessThanOrEqual(50)
      expect(w.h).toBeLessThanOrEqual(50)
      // The place itself is inside the window.
      const px = (((place.lon + 180) / 360) * n - col) * TILE_PX
      const py = (((1 - Math.asinh(Math.tan((place.lat * Math.PI) / 180)) / Math.PI) / 2) * n - row) * TILE_PX
      expect(px).toBeGreaterThanOrEqual(w.x)
      expect(px).toBeLessThanOrEqual(w.x + w.w)
      expect(py).toBeGreaterThanOrEqual(w.y)
      expect(py).toBeLessThanOrEqual(w.y + w.h)
    }
  })

  it('wraps longitude at the date line', () => {
    expect(probe({ lat: 0, lon: 180 })).toContain('/6/32/0.jpg')
    expect(probe({ lat: 0, lon: -180 })).toContain('/6/32/0.jpg')
    expect(probe({ lat: 0, lon: 179.999 })).toContain('/6/32/63.jpg')
    expect(probe({ lat: -18.14, lon: 178.44 })).toContain('/6/35/63.jpg')
  })

  it('has no tile past the mercator grid', () => {
    expect(probe({ lat: 85, lon: 0 })).toBeDefined()
    expect(probe({ lat: 85.01, lon: 0 })).toBeUndefined()
    expect(probe({ lat: -89, lon: 0 })).toBeUndefined()
    expect(probe({ lat: Number.NaN, lon: 0 })).toBeUndefined()
  })

  it('reads a window only from a URL that names one', () => {
    expect(tileWindowOf(`${GIBS_TILES}/x/default/2026-11-11/GoogleMapsCompatible_Level9/6/25/10.jpg`)).toBeUndefined()
    expect(tileWindowOf('https://example.test/a.jpg#win=1,2,0,4')).toBeUndefined()
    expect(tileWindowOf('https://example.test/a.jpg#win=1,2,3,4')).toEqual({ x: 1, y: 2, w: 3, h: 4 })
  })
})

describe('reading a probe tile', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('asks for the tile without its fragment and reads back only the window, at 24 px', async () => {
    const drawImage = vi.fn()
    class Canvas {
      constructor(readonly width: number, readonly height: number) {}
      getContext() {
        return { drawImage, getImageData: (_x: number, _y: number, w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) }) }
      }
    }
    const bitmap = { width: 256, height: 256, close: vi.fn() }
    const fetchMock = vi.fn(async (_url: string) => new Response(new Blob(['jpeg']), { status: 200, headers: { 'content-type': 'image/jpeg' } }))
    vi.stubGlobal('OffscreenCanvas', Canvas)
    vi.stubGlobal('createImageBitmap', vi.fn(async () => bitmap))
    vi.stubGlobal('fetch', fetchMock)
    const { fetchPixelsHere } = await import('./pixels')
    const r = await fetchPixelsHere(probe(FRESNO)!)
    expect(fetchMock.mock.calls[0][0]).toBe(`${GIBS_TILES}/${LAYER}/default/2026-11-11/GoogleMapsCompatible_Level9/6/25/10.jpg`)
    expect(drawImage).toHaveBeenCalledWith(bitmap, 151, 0, 31, 24, 0, 0, 24, 24)
    expect(r.pixels).toMatchObject({ width: 24, height: 24 })
    expect(r.pixels!.data).toHaveLength(24 * 24 * 4)
    expect(bitmap.close).toHaveBeenCalled()
  })
})
