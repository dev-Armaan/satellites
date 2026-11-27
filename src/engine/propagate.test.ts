/**
 * geodeticOf against the library it replaces. The passes' ids, times and tracks all hang on the sub-satellite point,
 * so the faster conversion is held to satellite.js's own answer bit for bit, not to a tolerance.
 */
import { eciToGeodetic, type EciVec3 } from 'satellite.js'
import { describe, expect, it } from 'vitest'
import { getRow } from './catalog'
import { eciAt, geodeticOf } from './propagate'
import { satrecFromRow } from './sgp4'
import { loadTestCatalog } from './testing'

const km = (x: number, y: number, z: number) => ({ x, y, z }) as EciVec3<number>

describe('geodeticOf', () => {
  it('is satellite.js eciToGeodetic to the last bit, over the real catalog', () => {
    const cat = loadTestCatalog()
    const t0 = Date.parse(cat.fetchedAt)
    let compared = 0
    // Every 23rd object: low orbits, Molniyas and geostationary ones alike.
    for (let i = 0; i < cat.sats.length; i += 23) {
      const satrec = satrecFromRow(getRow(cat.sats[i].norad)!)
      if (!satrec) continue
      for (let k = 0; k < 12; k++) {
        const ms = t0 - k * 5_417_000
        const e = eciAt(satrec, ms)
        if (!e) continue
        const theta = 0.731 * k + i * 1e-3
        expect(geodeticOf(e, theta)).toEqual(eciToGeodetic(km(e.x, e.y, e.z), theta))
        compared++
      }
    }
    expect(compared).toBeGreaterThan(5000)
  })

  it('agrees at the poles, on the equator and at the antimeridian', () => {
    const points = [km(0, 0, 7000), km(0, 0, -7000), km(7000, 0, 0), km(-7000, 1e-9, 0), km(-7000, -1e-9, 0), km(1e-12, 0, 6900), km(4000, -4000, 4000), km(42164, 0, 0)]
    for (const p of points) for (const theta of [0, 1, Math.PI, 6.2]) expect(geodeticOf(p, theta)).toEqual(eciToGeodetic(p, theta))
  })
})
