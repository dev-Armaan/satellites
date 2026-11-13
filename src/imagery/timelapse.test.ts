import { describe, expect, it, vi } from 'vitest'
import { blueFloor, buildTimelapse, commonGeometry, MIN_FRAMES, noDataShare, oneGeometry, planTimelapse, probeUrl, rankGeometries, sceneOf, sceneSearchUrl, seasonDay, type Scene, type TimelapseDeps, type TimelapseProgress } from './timelapse'

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

  it('then asks for a few fields of every scene of that one geometry, since the archive begins or for twelve months', () => {
    const years = new URL(sceneSearchUrl(TORONTO, 'years', NOW, { tile: '17TPJ', orbit: 140 })).searchParams
    expect(years.get('collections')).toBe('sentinel-2-l2a')
    expect(years.get('datetime')).toBe('2015-06-23T00:00:00Z/2026-11-13T02:00:00Z')
    expect(JSON.parse(years.get('intersects')!)).toEqual({ type: 'Point', coordinates: [-79.384, 43.653] })
    expect(JSON.parse(years.get('query')!)).toEqual({ 'eo:cloud_cover': { lt: 50 }, 's2:mgrs_tile': { eq: '17TPJ' }, 'sat:relative_orbit': { eq: 140 } })
    expect(years.get('fields')).toContain('properties.eo:cloud_cover')
    expect(years.get('fields')).toContain('-assets')
    expect(new URL(sceneSearchUrl(TORONTO, 'seasons', NOW)).searchParams.get('datetime')).toBe('2025-11-13T02:00:00Z/2026-11-13T02:00:00Z')
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

  it('keeps to the season with a clear scene in the most years, and gives each year its least cloudy scenes first', () => {
    const all = yearly()
    const day = seasonDay(all, TORONTO)!
    expect(day).toBeGreaterThan(180)
    expect(day).toBeLessThan(260)
    const plan = planTimelapse(all, TORONTO, 'years', NOW)
    expect(plan.slots.map((s) => s.key)).toEqual(['2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026'])
    for (const s of plan.slots) expect(s.candidates.map((c) => c.cloud)).toEqual([2, 8]) // February is another season
  })

  it('never picks a season that straddles New Year: a frame’s year is the year it was taken', () => {
    const winters = [2019, 2020, 2021, 2022].flatMap((y) => [scene(`${y}-12-28`, 1), scene(`${y}-01-05`, 1)])
    const day = seasonDay(winters, { lat: 25.2, lon: 55.27 })!
    expect(day - 45).toBeGreaterThanOrEqual(0)
    expect(day + 45).toBeLessThanOrEqual(365)
  })

  it('has no season in the tropics: any day of the year counts', () => {
    const all = [scene('2024-01-05', 20), scene('2024-07-19', 4), scene('2025-10-02', 9)]
    expect(seasonDay(all, SINGAPORE)).toBeUndefined()
    expect(planTimelapse(all, SINGAPORE, 'years', NOW).slots.map((s) => [s.key, s.candidates.map((c) => c.cloud)])).toEqual([
      ['2024', [4, 20]],
      ['2025', [9]],
    ])
  })

  it('cuts the last twelve months into stretches of about twenty days, oldest first', () => {
    const all = [scene('2025-12-01', 3), scene('2026-02-04', 24), scene('2026-02-06', 10), scene('2026-11-01', 4), scene('2024-06-01', 0)]
    const plan = planTimelapse(all, TORONTO, 'seasons', NOW)
    expect(plan.seasonDay).toBeUndefined()
    expect(plan.slots.map((s) => s.candidates.map((c) => c.cloud))).toEqual([[3], [10, 24], [4]])
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
    const cloudy = new Set(scenes.filter((s) => s.cloud === 2 && new Date(s.t).getUTCFullYear() === 2020).map((s) => s.id))
    const asked: string[] = []
    const seen: TimelapseProgress[] = []
    const t = await buildTimelapse(TORONTO, 'years', {
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
    expect(t.frames.map((f) => f.date)).toEqual(['2018-08-10', '2019-08-10', '2020-08-20', '2021-08-10', '2022-08-10', '2023-08-10', '2024-08-10', '2025-08-10', '2026-08-10'])
    expect(t.frames.every((f) => f.src.startsWith('blob:') && f.clear === 0.99)).toBe(true)
    expect(asked).toHaveLength(10) // one question a year, two in 2020
    expect(seen[0]).toEqual({ phase: 'listing' })
    expect(seen.at(-1)).toMatchObject({ phase: 'loading', loaded: 9 })
  })

  it('swaps a milky frame for a cleaner clear scene of the same year', async () => {
    const scenes = yearly()
    const milky = scenes.find((s) => s.cloud === 2 && new Date(s.t).getUTCFullYear() === 2019)!
    const t = await buildTimelapse(TORONTO, 'years', { px: 640, now: NOW, deps: deps({ scenes, haze: async (s) => (s.id === milky.id ? 0.11 : 0.015) }) })
    expect(t.frames.map((f) => f.date)[1]).toBe('2019-08-20')
  })

  it('takes bright ground the archive calls cloud for what it is: the same share in scene after scene', async () => {
    // 2019 has four scenes; the dry lake bed reads as cloud over 18 % of the square in each of them.
    const scenes = [...yearly(), scene('2019-08-25', 12), scene('2019-08-30', 20)]
    const t = await buildTimelapse(TORONTO, 'years', {
      px: 640,
      now: NOW,
      deps: deps({ scenes, clear: async (s) => (new Date(s.t).getUTCFullYear() === 2019 ? 0.82 + (s.cloud > 10 ? 0.01 : 0) : new Date(s.t).getUTCFullYear() === 2020 ? [0.4, 0.7][s.cloud === 2 ? 0 : 1] : 1) }),
    })
    const years = t.frames.map((f) => f.date.slice(0, 4))
    expect(years).toContain('2019')
    expect(t.frames.find((f) => f.date.startsWith('2019'))).toMatchObject({ date: '2019-08-10', clear: 0.82 })
    expect(years).not.toContain('2020') // two scenes that disagree are cloud
  })

  it('leaves a year out when nothing asked about is clear, and plays on when a frame does not come', async () => {
    const scenes = yearly()
    const year = (s: Scene) => new Date(s.t).getUTCFullYear()
    const t = await buildTimelapse(TORONTO, 'years', {
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
    const p = buildTimelapse(TORONTO, 'years', {
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
    await expect(buildTimelapse(TORONTO, 'years', { px: 640, now: NOW, deps: { list: async () => Promise.reject(new Error('down')) } })).rejects.toThrow('down')
  })
})
