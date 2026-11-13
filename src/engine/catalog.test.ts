import { describe, expect, it, vi } from 'vitest'
import namesRaw from '../../public/data/catalog-names.json?raw'
import { PROFILES, displayNameFor, noradForGibsCollection, noradForPlatform, resolveProfile } from './profiles'
import { compactCatalog, featuredSats, getRow, getSatInfo, ingestCatalog, installCatalog, loadCatalogNames } from './catalog'
import { satrecFor } from './sgp4'
import { buildElementBuffer } from './elements'
import { propagate, groundTrack } from './propagate'
import { catalogFile, loadTestCatalog } from './testing'
import type { CatalogRow } from '@/types'

describe('catalog', () => {
  const cat = loadTestCatalog()

  it('ingests the real CelesTrak catalog', () => {
    const file = catalogFile()
    expect(cat.sats.length + cat.skipped).toBe(file.rows.length)
    expect(cat.sats.length).toBeGreaterThan(15_000)
    expect(cat.byNorad.get(25544)?.displayName).toBe('ISS')
    expect(getSatInfo(60989)?.category).toBe('open-optical')
  })

  it('drops malformed rows and duplicates instead of throwing', () => {
    const good = catalogFile().rows[0]
    const bad: CatalogRow = [...good] as CatalogRow
    bad[0] = 999_999
    bad[5] = 1.5 // eccentricity out of range
    const c = ingestCatalog({ fetchedAt: '2026-11-08T00:00:00Z', source: 'test', count: 3, rows: [good, good, bad] })
    expect(c.sats).toHaveLength(1)
    expect(c.skipped).toBe(2)
    loadTestCatalog() // restore
  })

  it('rebuilds identical rows, SatInfo and element buffers from the transferable columns (worker path)', () => {
    const file = catalogFile()
    const direct = loadTestCatalog()
    const ref = buildElementBuffer(direct)
    const refInfo = new Map([25544, 60989, 43013, 44713, 63000].map((n) => [n, getSatInfo(n)]))
    // What the elements worker posts: the payload without its source rows.
    const { rows: _rows, ...wire } = compactCatalog(file)
    const cat = installCatalog(wire)
    expect(cat.count).toBe(direct.count)
    expect(cat.skipped).toBe(direct.skipped)
    expect(featuredSats(cat).map((s) => s.norad)).toEqual(featuredSats(direct).map((s) => s.norad))
    for (const [n, info] of refInfo) expect(getSatInfo(n)).toEqual(info)
    for (const r of file.rows.slice(0, 500)) {
      const got = getRow(r[0])!
      expect(got.slice(2)).toEqual(r.slice(2))
      expect(got[1]).toBe(r[1].trim())
    }
    const buf = buildElementBuffer(cat)
    expect(buf.count).toBe(ref.count)
    expect(Array.from(buf.norad)).toEqual(Array.from(ref.norad))
    expect(buf.data).toEqual(ref.data)
    // Lazy map semantics: lookups don't need the whole catalog materialised; iteration does.
    expect(cat.byNorad.size).toBe(cat.count)
    expect(cat.byNorad.has(25544)).toBe(true)
    expect([...cat.byNorad.keys()]).toHaveLength(cat.count)
    expect(cat.sats).toHaveLength(cat.count)
    loadTestCatalog() // restore
  })

  it('names off-profile objects from catalog-names.json once it loads (compact v2 catalog)', async () => {
    loadTestCatalog()
    const starlink = catalogFile().rows.find((r) => r[1] === '' )![0]
    expect(getSatInfo(starlink)?.displayName).toBe(`NORAD ${starlink}`)
    const held = getSatInfo(starlink)!
    vi.stubGlobal('fetch', vi.fn(async () => new Response(namesRaw, { headers: { 'content-type': 'application/json' } })))
    try {
      const filled = await loadCatalogNames()
      expect(filled).toBeGreaterThan(16_000)
    } finally {
      vi.unstubAllGlobals()
    }
    expect(getSatInfo(starlink)!.name).not.toBe('')
    expect(held.displayName).toBe(getSatInfo(starlink)!.name) // patched in place
    expect(getRow(starlink)![1]).toBe(held.name)
    expect(await loadCatalogNames()).toBe(0) // nothing left to fill
    loadTestCatalog() // restore
  })

  it('finds objects in an unsorted file too (index falls back from binary search to a map)', () => {
    const rows = [...catalogFile().rows.slice(0, 300)].reverse()
    const c = ingestCatalog({ fetchedAt: '2026-11-08T00:00:00Z', source: 'test', count: rows.length, rows })
    for (const r of rows.slice(0, 50)) expect(c.byNorad.get(r[0])?.norad).toBe(r[0])
    expect(getSatInfo(-1)).toBeUndefined()
    loadTestCatalog() // restore
  })

  it('builds valid SGP4 records for every featured satellite', () => {
    const featured = featuredSats(cat)
    expect(featured.length).toBeGreaterThan(400)
    const t = Date.parse(cat.fetchedAt)
    const failed = featured.filter((s) => !satrecFor(s.norad) || !propagate(s.norad, t))
    expect(failed.map((s) => s.name)).toEqual([])
  })

  it('propagates the ISS to a plausible state', () => {
    const s = propagate(25544, Date.parse(cat.fetchedAt))!
    expect(s.altKm).toBeGreaterThan(380)
    expect(s.altKm).toBeLessThan(460)
    // Its inclination is 51.64°, and that is geocentric: the geodetic latitude at the top of an orbit is 51.8°. A
    // catalog fetched at that moment (2026-11-13) read 51.78° and failed the 51.7 this used to allow.
    expect(Math.abs(s.lat)).toBeLessThanOrEqual(51.9)
    expect(s.velKmS).toBeGreaterThan(7.5)
    expect(s.velKmS).toBeLessThan(7.8)
    expect(Math.hypot(...s.ecef)).toBeCloseTo(6371 + s.altKm, -2)
    const track = groundTrack(25544, Date.parse(cat.fetchedAt), Date.parse(cat.fetchedAt) + 600_000)
    expect(track).toHaveLength(31)
  })
})

describe('profiles', () => {
  const cat = loadTestCatalog()

  it('every exact NORAD id exists in the catalog under the expected name', () => {
    const missing: string[] = []
    for (const p of PROFILES) for (const id of p.norad ?? []) if (!cat.byNorad.has(id)) missing.push(`${p.displayName ?? p.namePattern} ${id}`)
    expect(missing).toEqual([])
    expect(cat.byNorad.get(40697)?.name).toBe('SENTINEL-2A')
    expect(cat.byNorad.get(49260)?.name).toBe('LANDSAT 9')
    expect(cat.byNorad.get(43013)?.name).toMatch(/^NOAA 20/)
    expect(cat.byNorad.get(48274)?.name).toBe('CSS (TIANHE)')
  })

  it('every name pattern matches at least one catalog object', () => {
    const unmatched = PROFILES.filter((p) => p.namePattern && !p.norad).filter((p) => {
      const re = new RegExp(p.namePattern!, 'i')
      return !cat.sats.some((s) => re.test(s.name))
    })
    expect(unmatched.map((p) => p.namePattern)).toEqual([])
  })

  it('keeps families apart', () => {
    expect(resolveProfile(0, 'JILIN-1 GAOFEN 03D09')?.operator).toBe('Chang Guang Satellite')
    expect(resolveProfile(0, 'GAOFEN-3 02')?.category).toBe('radar')
    expect(resolveProfile(0, 'GAOFEN-13 01')).toBeUndefined() // geostationary, not an LEO imager
    expect(resolveProfile(0, 'SUPERVIEW NEO-2 01')?.category).toBe('radar')
    expect(resolveProfile(0, 'SUPERVIEW NEO-1 01')?.category).toBe('commercial-optical')
    expect(resolveProfile(0, 'FLOCK 4BE-18')?.swathKm).toBe(32)
    expect(resolveProfile(0, 'ISS (UNITY)')).toBeUndefined()
    expect(resolveProfile(0, 'STARLINK-1234')).toBeUndefined()
  })

  it('maps archive platforms and GIBS collections to NORAD ids', () => {
    expect(noradForPlatform('Sentinel-2C')).toBe(60989)
    expect(noradForPlatform('landsat-8')).toBe(39084)
    expect(noradForGibsCollection('gibs-viirs-noaa21')).toBe(54234)
    expect(noradForGibsCollection('gibs-modis-aqua')).toBe(27424)
  })

  it('makes readable constellation names', () => {
    const p = resolveProfile(0, 'CAPELLA-14 (ACADIA-4)')
    expect(displayNameFor('CAPELLA-14 (ACADIA-4)', p)).toBe('Capella-14')
    expect(displayNameFor('LEGION 3', resolveProfile(60452, 'LEGION 3'))).toBe('WorldView Legion 3')
    expect(displayNameFor('COSMO-SKYMED 2', resolveProfile(0, 'COSMO-SKYMED 2'))).toBe('COSMO-SkyMed 2')
    expect(displayNameFor('STARLINK-1234')).toBe('STARLINK-1234')
  })

  it('has a one-sentence blurb on every profile', () => {
    for (const p of PROFILES) {
      expect(p.blurb.length).toBeGreaterThan(10)
      expect(p.blurb.length).toBeLessThan(120)
      expect(p.blurb.trim().endsWith('.')).toBe(true)
      expect((p.blurb.match(/\. /g) ?? []).length).toBe(0)
    }
  })

  it('logs how many catalog objects each profile matches', () => {
    const rows = PROFILES.map((p) => {
      const n = cat.sats.filter((s) => s.profile === p).length
      return `${(p.displayName ?? p.namePattern ?? '').padEnd(34)} ${p.category.padEnd(18)} ${n}`
    })
    console.log(rows.join('\n'))
    expect(rows.length).toBe(PROFILES.length)
  })
})
