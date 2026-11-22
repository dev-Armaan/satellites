import { describe, expect, it } from 'vitest'
import { ensureTz } from '@/imagery/geocode'
import { waterlooReport } from './__fixtures__/waterloo'
import { buildResultsModel, getResultsModel, prewarmResultsModel } from './model'

describe('results model (R2R7)', () => {
  it('prewarm, then the render reads the very same object (no rebuild at the handoff)', async () => {
    const report = await waterlooReport({ withTracks: false })
    prewarmResultsModel(report)
    const a = getResultsModel(report)
    prewarmResultsModel(report) // a second prewarm is a no-op
    expect(getResultsModel(report)).toBe(a)
    // A new Report object (the final report replacing the partial one) builds a new model, on the same place/clock.
    const final = { ...report, generatedAt: report.generatedAt + 1000 }
    const b = getResultsModel(final)
    expect(b).not.toBe(a)
    expect(b.clock).toBe(a.clock)
    expect(b.sun).toBe(a.sun)
  })

  it('carries the gallery order: the cover first, every photo once, a photo key for each imaged pass with a capture', async () => {
    const report = await waterlooReport({ withTracks: false })
    const m = buildResultsModel(report)
    const keys = m.photos.map((p) => p.key)
    expect(new Set(keys).size).toBe(keys.length)
    expect(m.cover?.photo.key).toBe(keys[0])
    // The Waterloo fixture's closest clear look is a 10 m Sentinel-2 scene.
    expect(m.cover?.photo.capture.gsdM).toBe(10)
    expect(m.cover?.why).toBe('closest')
    for (const p of report.passes) if (p.verdict === 'imaged' && p.captureId) expect(m.photoByPass.has(p.id)).toBe(true)
    // After the cover: newest first.
    const rest = m.photos.slice(1).map((p) => p.pass!.tClosest)
    expect([...rest].sort((x, y) => y - x)).toEqual(rest)
  })

  it('names the zone as the place row does, everywhere the model is read (footnote, timeline)', async () => {
    await ensureTz()
    const report = await waterlooReport({ withTracks: false })
    const at = (lat: number, lon: number, windowStart = report.windowStart, windowEnd = report.windowEnd) =>
      buildResultsModel({ ...report, place: { ...report.place, lat, lon }, windowStart, windowEnd }).tzLabel
    // Hanoi (tz-lookup: Asia/Bangkok) and Bangkok are named by their offset, never "Asia/Bangkok".
    expect(at(21.03, 105.85)).toBe('UTC+7')
    expect(at(13.75, 100.5)).toBe('UTC+7')
    expect(at(43.46, -80.52)).toBe('America/Toronto')
    expect(at(0, -140)).toBe('UTC−9 · at sea')
    // Santiago has no abbreviation and moves to summer time on 2026-09-06: a window across it names both offsets.
    const sep = Date.UTC(2026, 8, 3)
    expect(at(-33.45, -70.66, sep, sep + 7 * 86_400_000)).toBe('UTC−4 → UTC−3')
    expect(at(-33.45, -70.66, sep + 7 * 86_400_000, sep + 14 * 86_400_000)).toBe('UTC−3')
  })
})
