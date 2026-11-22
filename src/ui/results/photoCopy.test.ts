/**
 * The English catalogs of the gallery, the photo viewer and the passes (src/i18n/en/gallery.ts, lightbox.ts,
 * passView.ts): each message must print exactly what the components printed before they moved to catalogs (the
 * English baseline), counts must go through plural forms, and every enum the code maps through them must have words.
 */
import { afterEach, describe, expect, it } from 'vitest'
import enGallery from '@/i18n/en/gallery'
import enLightbox from '@/i18n/en/lightbox'
import enPassView from '@/i18n/en/passView'
import enSystem from '@/i18n/en/system'
import { msgs, setBundleForTests } from '@/i18n/runtime'
import { isStrong, plain } from '../../../api/_lib/i18n/parts'

describe('gallery copy (English baseline)', () => {
  const m = enGallery
  it('counts photos the way the counter always has', () => {
    expect(enSystem.counter(3, 27).join('')).toBe('3 / 27')
    expect(m.photosThisWeek(27)).toBe('27 this week')
    expect(m.photosThatWeek(1)).toBe('1 that week')
  })

  it('writes every visual counter as it always has: the gallery, the pass pager, the time-lapse', () => {
    expect(enSystem.counter(1, 40)).toEqual(['1', ' / 40'])
    expect(enSystem.counter(1350, 1362)).toEqual(['1,350', ' / 1,362'])
    expect(enSystem.counter(3, 12, 2)).toEqual(['03', ' / 12'])
    expect(enSystem.counter(12, 12, 2).join('')).toBe('12 / 12')
  })

  it('never writes a Vietnamese counter as a slash, which reads as a date there', async () => {
    const vi = (await import('@/i18n/vi/system')).default
    expect(vi.counter(3, 12, 2)).toEqual(['3', '\u00a0trên\u00a012'])
    expect(vi.counter(1350, 1362).join('')).toBe('1.350\u00a0trên\u00a01.362')
  })

  it('names a slide with its lead and its place among the photos, or without them', () => {
    expect(m.slideLabel('closest', 'Sentinel-2C', 'Sun 1 Nov', '11:14', { k: 1, n: 40 })).toBe('Closest look: Sentinel-2C, Sun 1 Nov 11:14, photo 1 of 40')
    expect(m.slideLabel('lastClear', 'Landsat 9', 'Sat 31 Oct', '11:21')).toBe('Last clear look: Landsat 9, Sat 31 Oct 11:21')
    expect(m.slideLabel(undefined, 'NOAA-20', 'Mon 2 Nov', '13:05', { k: 4, n: 40 })).toBe('NOAA-20, Mon 2 Nov 13:05, photo 4 of 40')
  })

  it('tags the tablet-only rest of the Replay words as the one strong part', () => {
    expect(plain(m.replay)).toBe('Replay this pass')
    expect(plain(m.replay.filter((p) => !isStrong(p)))).toBe('Replay')
    expect(m.replay.filter(isStrong).map((p) => plain(p.strong))).toEqual([' this pass'])
    expect(m.replayLabel('Sentinel-2C', 'Sun 1 Nov', '11:14')).toBe('Replay this pass on the globe: Sentinel-2C, Sun 1 Nov 11:14')
    expect(m.viewLabel.lastClear('Landsat 9', 'Sat 31 Oct', '11:21')).toBe('View the last clear look large: Landsat 9, Sat 31 Oct 11:21')
    expect(m.viewLabel.photo('Landsat 9', 'Sat 31 Oct', '11:21')).toBe('View the photo large: Landsat 9, Sat 31 Oct 11:21')
  })

  it('writes widths, scale bars and cloud as the frames did', () => {
    expect(m.cropKm(240.4)).toBe('240 km')
    expect(m.cropKm(10)).toBe('10.0 km')
    expect(m.cropKm(1234.5)).toBe('1,235 km')
    expect([0.1, 0.2, 0.5, 1, 2, 500].map(m.scaleKm)).toEqual(['0.1 km', '0.2 km', '0.5 km', '1 km', '2 km', '500 km'])
    expect(m.status.cloudedPct(86.4)).toBe('Clouded · 86%')
    expect(m.status.cloudPct(25.5)).toBe('Cloud 26%')
    expect(m.clouded.pct(93)).toBe('Clouded over · 93%')
    expect(m.photoAlt('Sentinel-2C', 'Waterloo')).toBe('Sentinel-2C image of Waterloo. The place is at the centre.')
  })

  it('marks the live scan counter as the one strong part', () => {
    const parts = m.scanLine('0412', '1024')
    expect(plain(parts)).toBe('Line 0412 → 1024')
    expect(parts.filter((p) => typeof p === 'object' && 'strong' in p)).toHaveLength(1)
  })

  it('has words for every filter, every cover lead and both waits', () => {
    for (const f of ['all', 'detailed', 'weather', 'radar'] as const) {
      expect(m.filter[f]).toBeTruthy()
      expect(m.filterTitle[f]).toBeTruthy()
    }
    for (const l of ['closest', 'lastClear', 'clouded'] as const) expect(m.lead[l]).toBeTruthy()
    expect(m.awaiting.pass).toBe('Awaiting pass')
    expect(m.awaiting.scan).toBe('Awaiting scan')
  })
})

describe('photo viewer copy (English baseline)', () => {
  const m = enLightbox
  it('announces the position, lower-casing the lead as before', () => {
    expect(m.spokenPosition(1, 40, 'closest')).toBe('Photo 1 of 40, closest look')
    expect(m.spokenPosition(1, 40, 'clouded')).toBe('Photo 1 of 40, clouded over')
    expect(m.spokenPosition(7, 40)).toBe('Photo 7 of 40')
    expect(m.thumbLabel(12)).toBe('Photo 12')
  })

  it('reads zoom with toFixed rounding, as the readout always has', () => {
    expect(m.zoom(1)).toBe('1.0×')
    expect(m.zoom(2.5)).toBe('2.5×')
    expect(m.zoom(1.6 * 1.6)).toBe((1.6 * 1.6).toFixed(1) + '×')
  })

  it('labels the pan-sharpened Landsat layer and the clouded status', () => {
    expect(m.perPixel('15 m')).toBe('15 m / pixel')
    expect(m.panProduct('15 m')).toBe('Landsat C2 L2 + L1 pan · 15 m')
    expect(m.status.clouded(86)).toBe('Clouded · 86%')
    expect(m.status.clouded(undefined)).toBe('Clouded')
  })
})

describe('pass copy (English baseline)', () => {
  const m = enPassView
  it('pluralises every count', () => {
    expect(m.sats(1)).toBe('1 sat')
    expect(m.sats(3)).toBe('3 sats')
    expect(m.showAllSats(1)).toBe('Show all 1 satellite')
    expect(m.showAllSats(236)).toBe('Show all 236 satellites')
    expect(m.showAllRows(18)).toBe('Show all 18 rows')
    expect(m.showMore(40)).toBe('Show 40 more')
    expect(m.left(1234)).toBe('1,234 left')
    // The unit agrees with the count inside the message (lib/meta verdictUnit in English), never in the caller.
    expect(m.count(31, 'imaged')).toBe('31 passes')
    expect(m.count(1, 'imaged')).toBe('1 pass')
    expect(m.count(1, 'could')).toBe('1 pass')
    expect(m.count(1715, 'overhead')).toBe('1,715 passes')
    expect(m.countStack(1, 'likely')).toEqual({ n: '1', u: 'pass' })
    expect(m.countStack(14, 'overhead')).toEqual({ n: '14', u: 'passes' })
  })

  it("keeps the rows' toFixed rounding for angles", () => {
    // 8.95 is stored just under 8.95: toFixed says 8.9, as the rows always did (Intl would say 9.0).
    expect(m.offNadir(8.95)).toBe(`${(8.95).toFixed(1)}° off-nadir`)
    expect(m.offNadirShort(12.34)).toBe('12.3°')
    expect(m.distanceKm(786.4)).toBe('786 km')
    expect(m.cloudPct(39)).toBe('cloud 39%')
  })

  it('names rows with their facts in order, skipping the absent ones', () => {
    const base = { sat: 'Sentinel-2A', verb: 'watched', day: 'Tuesday 27 October', time: '11:31', zone: 'UTC−5', ago: '6 days ago' }
    expect(m.rowLabel({ ...base, cloudPct: 38.9, clouded: false })).toBe('Sentinel-2A, watched, Tuesday 27 October 11:31 UTC−5, 6 days ago, cloud 39 percent')
    expect(m.rowLabel({ ...base, cloudPct: 93, clouded: true })).toBe('Sentinel-2A, watched, Tuesday 27 October 11:31 UTC−5, 6 days ago, cloud 93 percent, clouded over')
    expect(m.rowLabel({ ...base, clouded: false })).toBe('Sentinel-2A, watched, Tuesday 27 October 11:31 UTC−5, 6 days ago')
    const sat = { sat: 'NOAA-20', passes: 14, verdict: 'overhead' as const, day: 'Monday 2 November', time: '13:05' }
    expect(m.satLabel({ ...sat, operator: 'NOAA' })).toBe('NOAA-20, NOAA, 14 passes, latest Monday 2 November 13:05')
    expect(m.satLabel(sat)).toBe('NOAA-20, 14 passes, latest Monday 2 November 13:05')
    expect(m.satLabel({ ...sat, passes: 1 })).toBe('NOAA-20, 1 pass, latest Monday 2 November 13:05')
  })

  it('writes the footnotes whole, with the cadence in words', () => {
    expect(m.fullDiscNote('2 km', 10)).toBe(
      'A full-disc image: one picture of everything the satellite can see, at 2 km a pixel here. Coarse, but real, and the newest one published; it has taken one like it every 10 minutes all week.',
    )
    expect(m.fullDiscNote('2 km')).toContain('it has taken one like it every few minutes all week.')
    expect(m.fullDiscNote('2 km', 1)).toContain('it has taken one like it every minute all week.')
    expect(m.mosaicNote(250)).toBe('A daily mosaic: NASA stitches each day’s swaths into one picture at 250 m per pixel. Coarse, but real, and from this pass’s day.')
    expect(m.noImage.openArchive('Landsat 9')).toBe('No Landsat 9 image of this spot from this pass. Plan view of the pass.')
    expect(m.radarNote).toBe(
      'A radar image, not a photograph: Sentinel-1 sends out microwaves and records their echo, so cloud and darkness don’t stop it. Brightness is how strongly the ground sends them back: buildings and rough ground are bright, calm water is dark.',
    )
    expect(m.links.viewSource('Planetary Computer')).toBe('View source · Planetary Computer')
  })

  it('writes the readout units', () => {
    expect(m.heading('SSW', false)).toBe('SSW · Desc')
    expect(m.heading('NNE', true)).toBe('NNE · Asc')
    expect(m.upCompass('S')).toBe('up · S')
    expect(m.everyMin(15)).toBe('every 15 min')
    expect(m.timeRange('16:14:02', '16:18:40')).toBe('16:14:02 → 16:18:40')
    for (const v of ['clear', 'cirrus', 'cloud', 'shadow'] as const) expect(m.spotValue[v]).toBeTruthy()
    for (const v of ['checking', 'clear', 'cirrus', 'cloud', 'shadow'] as const) expect(m.spot[v]).toBeTruthy()
  })
})

describe('namespace keys', () => {
  afterEach(() => setBundleForTests('en', null))
  it('each namespace is found in a bundle under its file name', () => {
    setBundleForTests('de', {
      gallery: { ...enGallery, barLabel: 'Fotos' },
      lightbox: { ...enLightbox, share: 'Teilen' },
      passView: { ...enPassView, showFewer: 'Weniger' },
    })
    expect(msgs(enGallery).barLabel).toBe('Fotos')
    expect(msgs(enLightbox).share).toBe('Teilen')
    expect(msgs(enPassView).showFewer).toBe('Weniger')
  })
})
