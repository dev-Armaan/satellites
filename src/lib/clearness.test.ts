import { describe, expect, it } from 'vitest'
import { byCloseness, clarityTier, clearShare, isCloudedOver, pickLead, type Ranked } from './clearness'

const r = (over: Partial<Ranked['capture']> & { t?: number; sunDeg?: number; offNadirDeg?: number; id?: string } = {}) => {
  const { t = 0, sunDeg, offNadirDeg, id = '', ...capture } = over
  return { id, t, sunDeg, offNadirDeg, capture: { gsdM: 10, ...capture } }
}

describe('clarity tiers', () => {
  it('keeps the label rule for clouded over, and splits clear from partly clear by the square', () => {
    expect(isCloudedOver({ spot: 'cloud' })).toBe(true)
    expect(isCloudedOver({ cloudCoverPct: 70 })).toBe(true)
    expect(isCloudedOver({ spot: 'clear', cloudCoverPct: 40 })).toBe(false)
    expect(clarityTier({ spot: 'clear', clearFraction: 0.9 })).toBe(0)
    expect(clarityTier({ spot: 'clear', clearFraction: 0.4 })).toBe(1) // the spot is clear, the picture mostly cloud
    expect(clarityTier({ spot: 'clear' })).toBe(0) // nothing known about the square: the old rule
    // Not measured: the scene's cloud stands in for the square's.
    expect(clarityTier({ cloudCoverPct: 65 })).toBe(1)
    expect(clarityTier({ cloudCoverPct: 30 })).toBe(0)
    expect(clarityTier({ cloudCoverPct: 65, clearFraction: 0.9 })).toBe(0) // the mask wins
    expect(clarityTier({ spot: 'cloud', clearFraction: 0.95 })).toBe(2)
  })
  it('estimates the clear share from scene cloud when the mask was not read', () => {
    expect(clearShare({ clearFraction: 0.3, cloudCoverPct: 5 })).toBe(0.3)
    expect(clearShare({ cloudCoverPct: 25 })).toBe(0.75)
    expect(clearShare({})).toBe(0.5)
  })
})

describe('the lead photo', () => {
  it('is the most zoomed-in photo of the clearest tier present', () => {
    const s2Partly = r({ id: 's2', gsdM: 10, spot: 'clear', clearFraction: 0.45, t: 9 })
    const lsClear = r({ id: 'ls', gsdM: 30, spot: 'clear', clearFraction: 0.95, t: 1 })
    expect(pickLead([s2Partly, lsClear])).toMatchObject({ item: { id: 'ls' }, tier: 0 })
    // With no clear photo, the most zoomed-in partly clear one leads.
    expect(pickLead([s2Partly, r({ id: 'ls2', gsdM: 30, clearFraction: 0.5 })])).toMatchObject({ item: { id: 's2' }, tier: 1 })
    // All clouded: the least cloudy.
    expect(pickLead([r({ id: 'a', spot: 'cloud', clearFraction: 0.1 }), r({ id: 'b', spot: 'cloud', clearFraction: 0.35 })])).toMatchObject({ item: { id: 'b' }, tier: 2 })
    expect(pickLead([])).toBeUndefined()
  })

  it('never lets an unchecked cloudy photo outrank a checked photo that is clear at the spot (CT-2)', () => {
    // A: low scene cloud, spot-checked: clear at the spot, its square 55 % clear. B: 65 % scene cloud, never checked
    // (only the four clearest scenes are). Same zoom; B is newer.
    const a = r({ id: 'a', spot: 'clear', cloudCoverPct: 5, clearFraction: 0.55, t: 1 })
    const b = r({ id: 'b', cloudCoverPct: 65, t: 2 })
    expect(clarityTier(b.capture)).toBe(1)
    expect(pickLead([a, b])).toMatchObject({ item: { id: 'a' }, tier: 1 })
    expect(pickLead([b, a])).toMatchObject({ item: { id: 'a' }, tier: 1 })
    // A clear Landsat photo still beats both.
    expect(pickLead([a, b, r({ id: 'ls', gsdM: 30, spot: 'clear', cloudCoverPct: 10, clearFraction: 0.95 })])).toMatchObject({ item: { id: 'ls' }, tier: 0 })
  })

  it('breaks ties between equally zoomed-in clear photos: spot, square, sun, view, then newest', () => {
    const lead = (...xs: ReturnType<typeof r>[]) => [...xs].sort(byCloseness)[0].id
    expect(lead(r({ id: 'old', spot: 'clear', t: 1 }), r({ id: 'new', spot: 'cirrus', t: 2 }))).toBe('old')
    expect(lead(r({ id: 'old', clearFraction: 0.98, t: 1 }), r({ id: 'new', clearFraction: 0.7, t: 2 }))).toBe('old')
    expect(lead(r({ id: 'old', clearFraction: 0.98, t: 1 }), r({ id: 'new', clearFraction: 1, t: 2 }))).toBe('new') // same 10 % step
    expect(lead(r({ id: 'old', clearFraction: 1, sunDeg: 32, t: 1 }), r({ id: 'new', clearFraction: 1, sunDeg: 21, t: 2 }))).toBe('old')
    expect(lead(r({ id: 'old', clearFraction: 1, sunDeg: 21, offNadirDeg: 1, t: 1 }), r({ id: 'new', clearFraction: 1, sunDeg: 22, offNadirDeg: 11, t: 2 }))).toBe('old')
    expect(lead(r({ id: 'old', clearFraction: 1, sunDeg: 21, offNadirDeg: 1, t: 1 }), r({ id: 'new', clearFraction: 1, sunDeg: 22, offNadirDeg: 3, t: 2 }))).toBe('new')
    // Zoom always comes first among clear photos.
    expect(lead(r({ id: 'ls', gsdM: 30, clearFraction: 1, sunDeg: 60, t: 9 }), r({ id: 's2', gsdM: 10, clearFraction: 0.7, sunDeg: 20, t: 1 }))).toBe('s2')
  })
})
