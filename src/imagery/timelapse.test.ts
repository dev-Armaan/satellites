import { describe, expect, it, vi } from 'vitest'
import { BLANK, blueFloor, buildTimelapse, commonGeometry, isBlank, MIN_FRAMES, noDataShare, oneGeometry, planTimelapse, probeUrl, rankGeometries, sceneOf, sceneSearchUrl, seasonDayOf, type Scene, type TimelapseDeps, type TimelapseProgress } from './timelapse'

const TORONTO = { lat: 43.653, lon: -79.384 }
const SINGAPORE = { lat: 1.352, lon: 103.82 }
const NOW = Date.parse('2026-11-13T02:00:00Z')

let n = 0
const scene = (date: string, cloud: number, over: Partial<Scene> = {}): Scene => ({ id: `S2_${date}_${n++}`, t: Date.parse(`${date}T16:10:00Z`), cloud, tile: '17TPJ', orbit: 140, platform: 'Sentinel-2B', ...over })

/** Every August 10th and February 10th from 2018 to 2026, clear in August, half-clouded in February. */
const yearly = () => [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026].flatMap((y) => [scene(`${y}-08-10`, 2), scene(`${y}-08-20`, 8), scene(`${y}-02-10`, 30)])

function deps(over: Partial<TimelapseDeps> & { scenes: Scene[] }): Partial<TimelapseDeps> {
  return {
    list: async () => over.scenes,
    clear: async () => 1,
    haze: async () => 0.015,
    frame: async (s) => `blob:${s.id}`,
    ...over,
  }
}

describe('the two searches', () => {
  it('first asks which tiles and orbits saw the place lately, whatever the cloud', () => {
    const probe = new URL(probeUrl(TORONTO, NOW)).searchParams
    expect(probe.get('datetime')).toBe('2026-07-16T02:00:00Z/2026-11-13T02:00:00Z')
    expect(probe.get('query')).toBeNull()
    expect(commonGeometry([{ tile: 'B', orbit: 1 }, { tile: 'A', orbit: 2 }, { tile: 'B', orbit: 1 }, { tile: 'A', orbit: 2 }, { tile: 'C', orbit: 3 }])).toEqual({ tile: 'A', orbit: 2 })
    expect(commonGeometry([])).toBeUndefined()
    expect(rankGeometries([{ tile: 'B', orbit: 1 }, { tile: 'A', orbit: 2 }, { tile: 'B', orbit: 1 }])).toEqual([{ tile: 'B', orbit: 1 }, { tile: 'A', orbit: 2 }])
    // a tile that ends inside the square leaves cells with no data
    expect(noDataShare([0, 5, 5, 5])).toBe(0.25)
    expect(noDataShare([4, 5, 9])).toBe(0)
    expect(noDataShare([])).toBe(1)
  })

  it('then asks for a few fields of every scene of that one geometry, since the archive begins', () => {
    const years = new URL(sceneSearchUrl(TORONTO, NOW, { tile: '17TPJ', orbit: 140 })).searchParams
    expect(years.get('collections')).toBe('sentinel-2-l2a')
    expect(years.get('datetime')).toBe('2015-06-23T00:00:00Z/2026-11-13T02:00:00Z')
    expect(JSON.parse(years.get('intersects')!)).toEqual({ type: 'Point', coordinates: [-79.384, 43.653] })
    expect(JSON.parse(years.get('query')!)).toEqual({ 'eo:cloud_cover': { lt: 50 }, 's2:mgrs_tile': { eq: '17TPJ' }, 'sat:relative_orbit': { eq: 140 } })
    expect(years.get('fields')).toContain('properties.eo:cloud_cover')
    expect(years.get('fields')).toContain('-assets')
    expect(new URL(sceneSearchUrl(TORONTO, NOW)).searchParams.get('query')).toBe('{"eo:cloud_cover":{"lt":50}}')
  })

  it('reads a light item, and drops one it cannot place', () => {
    expect(sceneOf({ id: 'A', properties: { datetime: '2026-08-05T16:10:00Z', 'eo:cloud_cover': 0.9, 's2:mgrs_tile': '17TPJ', 'sat:relative_orbit': 140, platform: 'sentinel-2c' } })).toEqual({
      id: 'A',
      t: Date.parse('2026-08-05T16:10:00Z'),
      cloud: 0.9,
      tile: '17TPJ',
      orbit: 140,
      platform: 'Sentinel-2C',
    })
    expect(sceneOf({ id: 'A', properties: { datetime: '2026-08-05T16:10:00Z', 'eo:cloud_cover': 0.9 } })).toBeNull()
  })
})

describe('planning', () => {
  it('keeps one tile and orbit (the one with the most scenes), one scene a day', () => {
    const all = [scene('2026-08-01', 5), scene('2026-08-01', 2), scene('2026-08-06', 5), scene('2026-08-03', 1, { orbit: 97 })]
    const kept = oneGeometry(all, TORONTO.lon)
    expect(kept.map((s) => s.orbit)).toEqual([140, 140])
    expect(kept.find((s) => s.t === Date.parse('2026-08-01T16:10:00Z'))?.cloud).toBe(2)
  })

  it('aims each year at the next quarter of the calendar, in turn', () => {
    expect([2016, 2017, 2018, 2019, 2020].map(seasonDayOf)).toEqual([15, 105, 196, 288, 15])
  })

  it('asks about the aimed-for quarter first, then the rest of the year, least cloudy first', () => {
    const plan = planTimelapse(yearly(), TORONTO)
    expect(plan.slots.map((s) => s.key)).toEqual(['2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026'])
    const of = (y: string) => plan.slots.find((s) => s.key === y)!
    // 2018 aims at July: both August scenes are within 45 days of it; February waits its turn.
    expect([of('2018').candidates.map((c) => c.cloud), of('2018').inSeason]).toEqual([[2, 8, 30], 2])
    // 2020 aims at January: the February scene leads although it is the cloudiest.
    expect([of('2020').candidates.map((c) => c.cloud), of('2020').inSeason]).toEqual([[30, 2, 8], 1])
    // 2019 aims at October and has nothing near it: any date, least cloudy first.
    expect([of('2019').candidates.map((c) => c.cloud), of('2019').inSeason]).toEqual([[2, 8, 30], 0])
  })

  it('counts December toward the January a year aims at, the short way round New Year', () => {
    const plan = planTimelapse([scene('2020-12-20', 40), scene('2020-06-01', 1)], SINGAPORE)
    expect(plan.slots[0].candidates.map((c) => c.cloud)).toEqual([40, 1])
  })
})

describe('haze', () => {
  it('reads the darkest blue of the encoded render as reflectance', () => {
    const px = new Uint8Array(400 * 4)
    for (let i = 0; i < 400; i++) px[i * 4 + 2] = i < 20 ? 51 : 128 // 5 % at 0.04, the rest at 0.25
    expect(blueFloor(px)).toBeCloseTo(0.04, 3)
    expect(blueFloor([])).toBe(0)
  })
})

describe('building', () => {
  it('takes the least cloudy scene that is clear at the place, one a year, oldest first', async () => {
    const scenes = yearly()
    const cloudy = new Set(scenes.filter((s) => s.cloud !== 8 && new Date(s.t).getUTCFullYear() === 2020).map((s) => s.id))
    const asked: string[] = []
    const seen: TimelapseProgress[] = []
    const t = await buildTimelapse(TORONTO, {
      px: 640,
      now: NOW,
      onProgress: (p) => seen.push(p),
      deps: deps({
        scenes,
        clear: async (s) => {
          asked.push(s.id)
          return cloudy.has(s.id) ? 0.4 : 0.99
        },
      }),
    })
    // 2020 and 2024 aim at January and take their February scene; 2020's is cloudy at the place, so August stands in.
    expect(t.frames.map((f) => f.date)).toEqual(['2018-08-10', '2019-08-10', '2020-08-20', '2021-08-10', '2022-08-10', '2023-08-10', '2024-02-10', '2025-08-10', '2026-08-10'])
    expect(t.frames.every((f) => f.src.startsWith('blob:') && f.clear === 0.99)).toBe(true)
    expect(asked).toHaveLength(11) // one question a year, three in 2020
    expect(seen[0]).toEqual({ phase: 'listing' })
    expect(seen.at(-1)).toMatchObject({ phase: 'loading', loaded: 9 })
  })

  it('swaps a milky frame for a cleaner clear scene of the same quarter, never for another season’s', async () => {
    const scenes = yearly()
    const year = (s: Scene) => new Date(s.t).getUTCFullYear()
    // 2018 aims at July and has two August scenes; 2024 aims at January and has one February scene.
    const milky = scenes.find((s) => s.cloud === 2 && year(s) === 2018)!
    const white = scenes.find((s) => s.cloud === 30 && year(s) === 2024)!
    const both = await buildTimelapse(TORONTO, { px: 640, now: NOW, deps: deps({ scenes, haze: async (s) => (s.id === milky.id || s.id === white.id ? 0.11 : 0.015) }) })
    expect(both.frames.map((f) => f.date)[0]).toBe('2018-08-20')
    expect(both.frames.map((f) => f.date)[6]).toBe('2024-02-10') // snow is bright too: it keeps its place
  })

  it('takes bright ground the archive calls cloud for what it is: the same share in scene after scene', async () => {
    // 2019 has four scenes; the dry lake bed reads as cloud over 18 % of the square in each of them.
    const scenes = [...yearly(), scene('2019-08-25', 12), scene('2019-08-30', 20)]
    const t = await buildTimelapse(TORONTO, {
      px: 640,
      now: NOW,
      deps: deps({ scenes, clear: async (s) => (new Date(s.t).getUTCFullYear() === 2019 ? 0.82 + (s.cloud > 10 ? 0.01 : 0) : new Date(s.t).getUTCFullYear() === 2020 ? [0.4, 0.7][s.cloud === 2 ? 0 : 1] : 1) }),
    })
    const years = t.frames.map((f) => f.date.slice(0, 4))
    expect(years).toContain('2019')
    expect(t.frames.find((f) => f.date.startsWith('2019'))).toMatchObject({ date: '2019-08-10', clear: 0.82 })
    expect(years).not.toContain('2020') // two scenes that disagree are cloud
  })

  it('passes over a scene that is listed but holds no picture', async () => {
    const px = (v: number) => Uint8Array.from({ length: 64 * 4 }, (_, i) => (i % 4 === 3 ? 255 : v))
    expect(isBlank(px(4))).toBe(true)
    expect(isBlank(px(60))).toBe(false) // dark water is a picture
    expect(isBlank([])).toBe(true)
    const scenes = yearly()
    const empty = scenes.find((s) => s.cloud === 2 && new Date(s.t).getUTCFullYear() === 2018)!
    const t = await buildTimelapse(TORONTO, { px: 640, now: NOW, deps: deps({ scenes, haze: async (s) => (s.id === empty.id ? BLANK : 0.015) }) })
    expect(t.frames[0].date).toBe('2018-08-20')
    expect(t.frames).toHaveLength(9)
  })

  it('leaves a year out when nothing asked about is clear, and plays on when a frame does not come', async () => {
    const scenes = yearly()
    const year = (s: Scene) => new Date(s.t).getUTCFullYear()
    const t = await buildTimelapse(TORONTO, {
      px: 640,
      now: NOW,
      deps: deps({
        scenes,
        clear: async (s) => (year(s) === 2021 ? 0.2 : 1),
        frame: async (s) => {
          if (year(s) === 2023) throw new Error('render failed')
          return `blob:${s.id}`
        },
      }),
    })
    expect(t.frames.map((f) => f.date.slice(0, 4))).toEqual(['2018', '2019', '2020', '2022', '2024', '2025', '2026'])
    expect(t.slots).toBe(9)
    expect(t.frames.length).toBeGreaterThanOrEqual(MIN_FRAMES)
  })

  it('gives its pictures back when it is aborted, and rejects', async () => {
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    const ctl = new AbortController()
    let made = 0
    const p = buildTimelapse(TORONTO, {
      px: 640,
      now: NOW,
      signal: ctl.signal,
      deps: deps({
        scenes: yearly(),
        frame: async (s) => {
          if (++made === 3) ctl.abort()
          return `blob:${s.id}`
        },
      }),
    })
    await expect(p).rejects.toMatchObject({ name: 'AbortError' })
    expect(revoke.mock.calls.length).toBeGreaterThanOrEqual(3)
    revoke.mockRestore()
  })

  it('rejects when the archive cannot be listed', async () => {
    await expect(buildTimelapse(TORONTO, { px: 640, now: NOW, deps: { list: async () => Promise.reject(new Error('down')) } })).rejects.toThrow('down')
  })
})
