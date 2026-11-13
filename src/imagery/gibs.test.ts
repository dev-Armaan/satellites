import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Pass } from '@/types'
import { gibsWmsUrl, worldviewUrl } from './endpoints'
import { GEO_SAFE_LAG_MS, GIBS_LAYERS, dailyProbeUrl, geoFrameCandidates, geoFrames, geoFrameTime, geoImageUrl, gibsTime, latestGibsFrame, parseIsoDuration, parseTimeDomain, utcDate, verifyWeatherCapture, weatherCandidates } from './gibs'
import { measureNoData } from './image'

const WATERLOO = { lat: 43.4723, lon: -80.5449 }
const TOKYO = { lat: 35.6762, lon: 139.6503 }

function pass(over: Partial<Pass>): Pass {
  const t = Date.parse('2026-11-07T18:20:00Z')
  return {
    id: 'p',
    norad: 43013,
    tClosest: t,
    tStart: t - 60_000,
    tEnd: t + 60_000,
    groundDistanceKm: 200,
    offNadirDeg: 15,
    elevationDeg: 70,
    azimuthDeg: 90,
    altitudeKm: 830,
    groundSpeedKmS: 6.6,
    headingDeg: 190,
    node: 'ascending',
    sunElevationDeg: 25,
    inSwath: true,
    inFieldOfRegard: true,
    verdict: 'likely',
    track: [],
    ...over,
  }
}

describe('GIBS WMS URLs', () => {
  it('uses lat,lon axis order in BBOX for EPSG:4326 / WMS 1.3.0', () => {
    const url = new URL(gibsWmsUrl('VIIRS_NOAA20_CorrectedReflectance_TrueColor', '2026-11-07', WATERLOO, { halfSizeKm: 150, px: 512 }))
    const q = url.searchParams
    expect(url.origin + url.pathname).toBe('https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi')
    expect(q.get('SERVICE')).toBe('WMS')
    expect(q.get('REQUEST')).toBe('GetMap')
    expect(q.get('VERSION')).toBe('1.3.0')
    expect(q.get('CRS')).toBe('EPSG:4326')
    expect(q.get('STYLES')).toBe('')
    expect(q.get('FORMAT')).toBe('image/jpeg')
    expect(q.get('WIDTH')).toBe('512')
    expect(q.get('HEIGHT')).toBe('512')
    expect(q.get('TIME')).toBe('2026-11-07')
    const [minLat, minLon, maxLat, maxLon] = q.get('BBOX')!.split(',').map(Number)
    // Values verified against a real request that returned the right region
    expect(minLat).toBeCloseTo(42.12332, 4)
    expect(minLon).toBeCloseTo(-82.40375, 4)
    expect(maxLat).toBeCloseTo(44.82128, 4)
    expect(maxLon).toBeCloseTo(-78.68605, 4)
    expect(minLat).toBeLessThan(maxLat)
    // a km-square box: longitude span is wider by 1/cos(lat)
    expect((maxLon - minLon) / (maxLat - minLat)).toBeCloseTo(1 / Math.cos((WATERLOO.lat * Math.PI) / 180), 3)
  })

  it('clamps latitude at the poles', () => {
    const q = new URL(gibsWmsUrl('L', '2026-11-07', { lat: 89.9, lon: 0 }, { halfSizeKm: 300, px: 64 })).searchParams
    const [, , maxLat] = q.get('BBOX')!.split(',').map(Number)
    expect(maxLat).toBe(90)
  })

  it('links to Worldview with the same layer and day', () => {
    const u = new URL(worldviewUrl('MODIS_Terra_CorrectedReflectance_TrueColor', '2026-11-07', TOKYO))
    expect(u.host).toBe('worldview.earthdata.nasa.gov')
    expect(u.searchParams.get('l')).toBe('MODIS_Terra_CorrectedReflectance_TrueColor,Coastlines_15m')
    expect(u.searchParams.get('t')).toBe('2026-11-07')
    expect(u.searchParams.get('v')!.split(',')).toHaveLength(4)
  })
})

describe('geostationary frame time', () => {
  afterEach(() => vi.useRealTimers())
  const now = Date.parse('2026-11-08T03:45:00Z')

  it('rounds older instants down to the 10-minute mark', () => {
    expect(geoFrameTime(Date.parse('2026-11-07T18:07:59Z'), now)).toBe(Date.parse('2026-11-07T18:00:00Z'))
    expect(geoFrameTime(Date.parse('2026-11-07T18:10:00Z'), now)).toBe(Date.parse('2026-11-07T18:10:00Z'))
  })

  it('holds recent instants back by the safety lag', () => {
    expect(GEO_SAFE_LAG_MS).toBe(70 * 60_000)
    expect(geoFrameTime(now, now)).toBe(Date.parse('2026-11-08T02:30:00Z'))
    expect(geoFrameTime(now - 10 * 60_000, now)).toBe(Date.parse('2026-11-08T02:30:00Z'))
    expect(geoFrameTime(now + 3_600_000, now)).toBe(Date.parse('2026-11-08T02:30:00Z'))
  })

  it('builds GOES / Himawari URLs with an ISO frame time and daily layers with a date', () => {
    vi.useFakeTimers()
    vi.setSystemTime(now)
    const goes = new URL(geoImageUrl('gibs-goes-east', WATERLOO, Date.parse('2026-11-07T17:03:00Z'), { halfSizeKm: 300, px: 512 })).searchParams
    expect(goes.get('LAYERS')).toBe('GOES-East_ABI_GeoColor')
    expect(goes.get('TIME')).toBe('2026-11-07T17:00:00Z')
    const live = new URL(geoImageUrl('gibs-goes-west', WATERLOO, now, { halfSizeKm: 300, px: 512 })).searchParams
    expect(live.get('TIME')).toBe('2026-11-08T02:30:00Z')
    const hima = new URL(geoImageUrl('gibs-himawari', TOKYO, Date.parse('2026-11-08T01:00:00Z'), { halfSizeKm: 150, px: 256 })).searchParams
    expect(hima.get('LAYERS')).toBe('Himawari_AHI_Band3_Red_Visible_1km')
    expect(hima.get('TIME')).toBe('2026-11-08T01:00:00Z')
    const daily = new URL(geoImageUrl('gibs-viirs-noaa21', TOKYO, Date.parse('2026-11-07T04:30:00Z'), { halfSizeKm: 150, px: 256 })).searchParams
    expect(daily.get('TIME')).toBe('2026-11-07')
    expect(gibsTime('gibs-modis-aqua', Date.parse('2026-11-07T23:59:59Z'), now)).toBe('2026-11-07')
  })

  it('refuses collections GIBS does not serve', () => {
    expect(() => geoImageUrl('sentinel-2-l2a', WATERLOO, 0, { halfSizeKm: 3, px: 64 })).toThrow(TypeError)
  })

  it('formats UTC dates', () => {
    expect(utcDate(Date.parse('2026-01-02T23:59:59Z'))).toBe('2026-01-02')
    expect(utcDate(Date.parse('2026-01-03T00:00:00Z'))).toBe('2026-01-03')
  })
})

describe('published time domains', () => {
  afterEach(() => vi.unstubAllGlobals())
  const T = (iso: string) => Date.parse(iso)
  const hm = (ts: number[]) => ts.map((t) => new Date(t).toISOString().slice(11, 16))

  it('parses ISO durations', () => {
    expect(parseIsoDuration('PT10M')).toBe(600_000)
    expect(parseIsoDuration('P1D')).toBe(86_400_000)
    expect(parseIsoDuration('PT1H30M')).toBe(5_400_000)
    expect(parseIsoDuration('P')).toBeUndefined()
    expect(parseIsoDuration('10M')).toBeUndefined()
  })

  it('expands a real Himawari domain, gap included, within the window', () => {
    // Verbatim from GIBS DescribeDomains, 2026-11-08 06:05Z
    const d = '2026-11-08/2026-11-08T02:30:00Z/PT10M,2026-11-08T02:50:00Z/2026-11-08T05:20:00Z/PT10M'
    const frames = parseTimeDomain(d, T('2026-11-08T02:00:00Z'), T('2026-11-08T03:05:00Z'))
    expect(hm(frames)).toEqual(['02:00', '02:10', '02:20', '02:30', '02:50', '03:00'])
    expect(parseTimeDomain('2026-11-08T05:00:00Z', 0, Infinity)).toEqual([T('2026-11-08T05:00:00Z')])
    expect(parseTimeDomain('garbage,2026-11-08/nope/PT10M', 0, Infinity)).toEqual([])
  })

  it('fetches the domain once, then snaps geoImageUrl to listed frames (skipping gaps)', async () => {
    const now = T('2026-11-08T06:05:00Z')
    const xml = "<Domains><DimensionDomain><ows:Identifier>time</ows:Identifier><Domain>2026-11-08T00:00:00Z/2026-11-08T02:30:00Z/PT10M,2026-11-08T02:50:00Z/2026-11-08T05:20:00Z/PT10M</Domain></DimensionDomain></Domains>"
    const f = vi.fn(async () => new Response(xml, { status: 200, headers: { 'content-type': 'text/xml' } }))
    vi.stubGlobal('fetch', f)
    const frames = await geoFrames('gibs-himawari', { now })
    expect(hm(frames.slice(0, 2))).toEqual(['05:20', '05:10'])
    expect(frames).not.toContain(T('2026-11-08T02:40:00Z'))
    await geoFrames('gibs-himawari', { now: now + 60_000 })
    expect(f).toHaveBeenCalledTimes(1)
    const url = String((f.mock.calls[0] as unknown[])[0])
    expect(url).toBe('https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/1.0.0/Himawari_AHI_Band3_Red_Visible_1km/default/1km/all/2026-11-08T00:00:00Z--2026-11-08T07:00:00Z.xml')

    vi.useFakeTimers()
    vi.setSystemTime(now)
    const time = (ms: number) => new URL(geoImageUrl('gibs-himawari', TOKYO, ms, { halfSizeKm: 300, px: 256 })).searchParams.get('TIME')
    expect(time(T('2026-11-08T02:45:00Z'))).toBe('2026-11-08T02:30:00Z') // 02:40 is a gap: never ask for it
    expect(time(T('2026-11-08T03:07:00Z'))).toBe('2026-11-08T03:00:00Z')
    expect(time(now)).toBe('2026-11-08T04:50:00Z') // held back 70 min, then a listed frame
    expect(time(T('2026-11-07T12:00:00Z'))).toBe('2026-11-07T12:00:00Z') // older than the list: unchanged
    vi.useRealTimers()
  })

  it('rejects a layer GIBS has no domain for, and daily layers', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<ExceptionReport/>', { status: 400 })))
    await expect(geoFrames('gibs-goes-west', { now: Date.parse('2026-11-08T06:05:00Z') })).rejects.toThrow()
    await expect(geoFrames('gibs-modis-aqua')).rejects.toThrow(TypeError)
  })

  it('picks candidate frames: listed, ≥ 70 min old, newest first; dark frames skipped for visible-only bands', () => {
    const now = T('2026-11-08T06:05:00Z')
    const listed = [T('2026-11-08T05:20:00Z'), T('2026-11-08T05:00:00Z'), T('2026-11-08T04:50:00Z'), T('2026-11-08T04:30:00Z')]
    expect(hm(geoFrameCandidates('gibs-goes-east', WATERLOO, now, listed))).toEqual(['04:50', '04:30'])
    expect(hm(geoFrameCandidates('gibs-goes-east', WATERLOO, now, null, 3))).toEqual(['04:50', '04:40', '04:30'])
    // Waterloo at ~05:00Z is midnight: GeoColor has a night layer, so it stays…
    expect(geoFrameCandidates('gibs-goes-east', WATERLOO, now, null, 3)).toHaveLength(3)
    // …but Himawari's red visible band over Waterloo at night would be black: nothing to try.
    expect(geoFrameCandidates('gibs-himawari', WATERLOO, now, null, 3)).toEqual([])
    // Tokyo at 14:00 JST: daylight, all kept.
    expect(geoFrameCandidates('gibs-himawari', TOKYO, now, null, 3)).toHaveLength(3)
  })

  it('asks for nothing when a visible-only band has the place in the dark, or the sun too low for the caller', async () => {
    const f = vi.fn()
    vi.stubGlobal('fetch', f)
    const opts = { halfSizeKm: 400, px: 176 }
    // Waterloo around midnight.
    await expect(latestGibsFrame(GIBS_LAYERS['gibs-himawari'], WATERLOO, opts, { now: T('2026-11-08T06:05:00Z') })).resolves.toBeNull()
    // Tokyo, the three frames 70–90 minutes before 08:40Z: the last half hour before sunset (07:40Z), the sun under 6°.
    const dusk = T('2026-11-08T08:40:00Z')
    expect(geoFrameCandidates('gibs-himawari', TOKYO, dusk, null, 3).length).toBeGreaterThan(0)
    await expect(latestGibsFrame({ ...GIBS_LAYERS['gibs-himawari'], minSunDeg: 6 }, TOKYO, opts, { now: dusk, maxSteps: 3 })).resolves.toBeNull()
    expect(f).not.toHaveBeenCalled()
  })
})

describe('weather candidates', () => {
  it('keeps daytime, in-swath passes of GIBS-served imagers, one per layer per mosaic day', () => {
    const passes = [
      pass({ id: 'a', norad: 43013, groundDistanceKm: 400 }),
      pass({ id: 'b', norad: 43013, groundDistanceKm: 90, tClosest: Date.parse('2026-11-07T19:58:00Z') }), // same day, nearer nadir
      pass({ id: 'c', norad: 43013, tClosest: Date.parse('2026-11-06T18:40:00Z') }),
      pass({ id: 'night', norad: 54234, sunElevationDeg: -10 }),
      pass({ id: 'dawn', norad: 25994, sunElevationDeg: 4.9 }),
      pass({ id: 'edge', norad: 27424, inSwath: false }),
      pass({ id: 's2', norad: 60989 }),
      pass({ id: 'terra', norad: 25994, sunElevationDeg: 30, tClosest: Date.parse('2026-11-07T16:05:00Z') }),
    ]
    const caps = weatherCandidates(WATERLOO, passes)
    expect(caps.map((c) => c.itemId)).toEqual([
      'VIIRS_NOAA20_CorrectedReflectance_TrueColor@2026-11-07',
      'MODIS_Terra_CorrectedReflectance_TrueColor@2026-11-07',
      'VIIRS_NOAA20_CorrectedReflectance_TrueColor@2026-11-06',
    ])
    const n20 = caps[0]
    expect(n20.provider).toBe('gibs')
    expect(n20.collection).toBe('gibs-viirs-noaa20')
    expect(n20.platform).toBe('noaa-20')
    expect(n20.norad).toBe(43013)
    expect(n20.datetime).toBe(Date.parse('2026-11-07T19:58:00Z')) // the nearer-nadir pass
    expect(n20.gsdM).toBe(375)
    expect(caps[1].gsdM).toBe(250)
    const crop = new URL(n20.cropUrl({ halfSizeKm: 100, px: 640 })).searchParams
    expect(crop.get('TIME')).toBe('2026-11-07')
    expect(crop.get('WIDTH')).toBe('640')
    expect(n20.sourceUrl).toContain('worldview.earthdata.nasa.gov')
  })

  it('dates a mosaic by the day on the ground, not the UTC day of the pass', () => {
    // Terra over Tokyo late on the 12th (UTC) is the morning of the 13th there: NASA files it under the 13th.
    const terra = weatherCandidates(TOKYO, [pass({ norad: 25994, tClosest: Date.parse('2026-11-12T23:27:00Z') })])[0]
    expect(terra.itemId).toBe('MODIS_Terra_CorrectedReflectance_TrueColor@2026-11-13')
    expect(new URL(terra.cropUrl({ halfSizeKm: 100, px: 640 })).searchParams.get('TIME')).toBe('2026-11-13')
    expect(terra.sourceUrl).toContain('2026-11-13')
    // NOAA-20 over Honolulu just after midnight UTC on the 12th is the afternoon of the 11th there.
    const honolulu = { lat: 21.3069, lon: -157.8583 }
    const n20 = weatherCandidates(honolulu, [pass({ tClosest: Date.parse('2026-11-12T00:17:00Z') })])[0]
    expect(n20.itemId).toBe('VIIRS_NOAA20_CorrectedReflectance_TrueColor@2026-11-11')
    // Two passes either side of midnight UTC on one afternoon there are one mosaic, not two.
    const two = weatherCandidates(honolulu, [
      pass({ id: 'a', tClosest: Date.parse('2026-11-11T23:20:00Z'), groundDistanceKm: 900 }),
      pass({ id: 'b', tClosest: Date.parse('2026-11-12T01:00:00Z'), groundDistanceKm: 300 }),
    ])
    expect(two.map((c) => c.itemId)).toEqual(['VIIRS_NOAA20_CorrectedReflectance_TrueColor@2026-11-11'])
    expect(two[0].datetime).toBe(Date.parse('2026-11-12T01:00:00Z'))
  })
})

describe('verifying a daily mosaic', () => {
  afterEach(() => vi.unstubAllGlobals())
  const capture = (date: string) => weatherCandidates(WATERLOO, [pass({ tClosest: Date.parse(`${date}T18:20:00Z`) })])[0]

  it('probes the pre-cut tile that holds the place, and a WMS render only past the tile grid', () => {
    const url = dailyProbeUrl('VIIRS_NOAA20_CorrectedReflectance_TrueColor', '2026-11-07', WATERLOO)
    expect(url).toMatch(/^https:\/\/gibs\.earthdata\.nasa\.gov\/wmts\/epsg3857\/best\/VIIRS_NOAA20_CorrectedReflectance_TrueColor\/default\/2026-11-07\/GoogleMapsCompatible_Level9\/6\/\d+\/\d+\.jpg#win=\d+,\d+,\d+,\d+$/)
    const polar = new URL(dailyProbeUrl('VIIRS_NOAA20_CorrectedReflectance_TrueColor', '2026-11-07', { lat: -89.98, lon: 139.27 }))
    expect(polar.pathname).toBe('/wms/epsg4326/best/wms.cgi')
    expect(polar.searchParams.get('WIDTH')).toBe('24')
  })

  it('takes a day the tile service has no image for (a 404) as an answer: no photo, asked once', async () => {
    const f = vi.fn(async (_url: string) => new Response('<h1>Not Found</h1>', { status: 404, headers: { 'content-type': 'text/html' } }))
    vi.stubGlobal('fetch', f)
    await expect(verifyWeatherCapture(capture('2026-10-03'), WATERLOO)).resolves.toBe(false)
    expect(f).toHaveBeenCalledTimes(1)
    expect(f.mock.calls[0][0]).toContain('/wmts/epsg3857/best/VIIRS_NOAA20_CorrectedReflectance_TrueColor/default/2026-10-03/')
    expect(f.mock.calls[0][0]).not.toContain('#')
  })

  it('drops a mosaic it cannot check, and retries a server error once', async () => {
    const f = vi.fn(async (_url: string) => new Response('busy', { status: 503 }))
    vi.stubGlobal('fetch', f)
    await expect(verifyWeatherCapture(capture('2026-10-04'), WATERLOO)).resolves.toBe(false)
    expect(f).toHaveBeenCalledTimes(2)
  })
})

describe('no-data measurement', () => {
  const px = (...rgba: number[][]) => new Uint8ClampedArray(rgba.flat())
  it('treats pure black and transparent pixels as no data', () => {
    expect(measureNoData(px([0, 0, 0, 255], [0, 0, 0, 255])).noDataFraction).toBe(1)
    expect(measureNoData(px([200, 200, 200, 0])).noDataFraction).toBe(1)
    expect(measureNoData(px([5, 6, 4, 255], [120, 130, 140, 255])).noDataFraction).toBe(0.5)
  })
  it('keeps dark-but-real pixels (night GeoColor, Himawari ocean) as data', () => {
    const r = measureNoData(px([12, 14, 20, 255], [9, 9, 9, 255]))
    expect(r.noDataFraction).toBe(0)
    expect(r.meanLuma).toBeGreaterThan(8)
  })
  it('handles empty input', () => {
    expect(measureNoData(new Uint8ClampedArray(0)).noDataFraction).toBe(1)
  })
})
