import { describe, expect, it } from 'vitest'
import { LAYER_RANK } from '@/lib/backStack'
import { timelapseParam, useTimelapseUi } from '@/state/timelapse'
import { hasTimelapse } from '@/ui/results/TimelapseEntry'
import type { Capture, Report } from '@/types'
import { timelapseLink } from './link'

describe('the time-lapse link', () => {
  it('is the place link plus tl, with the place rounded like every share', () => {
    const url = new URL(timelapseLink('https://www.watched.earth', { label: 'Groom Lake, Nevada', lat: 37.23512, lon: -115.81117 }))
    expect(url.origin + url.pathname).toBe('https://www.watched.earth/')
    expect(Object.fromEntries(url.searchParams)).toEqual({ q: '37.24,-115.81', n: 'Groom Lake, Nevada', tl: '1' })
    expect(timelapseParam(url.search)).toBe(true)
  })

  it('reads tl, and nothing else as a request', () => {
    expect(timelapseParam('?q=1,2&tl=years')).toBe(true) // early links
    expect(timelapseParam('?q=1,2&tl=seasons')).toBe(false)
    expect(timelapseParam('?q=1,2')).toBe(false)
  })
})

describe('where the time-lapse is offered', () => {
  const report = (captures: Partial<Capture>[], clearCover?: Partial<Capture>) => ({ report: { captures, clearCover } as unknown as Report })

  it('needs a Sentinel-2 photo of the place: this week’s, or the last clear look', () => {
    expect(hasTimelapse(report([{ collection: 'gibs-viirs-noaa20' }, { collection: 'sentinel-2-l2a' }]))).toBe(true)
    expect(hasTimelapse(report([{ collection: 'landsat-c2-l2' }], { collection: 'sentinel-2-l2a' }))).toBe(true)
    expect(hasTimelapse(report([{ collection: 'landsat-c2-l2' }, { collection: 'sentinel-1-rtc' }]))).toBe(false) // open ocean, or Landsat only
    expect(hasTimelapse(report([]))).toBe(false)
  })
})

describe('the open state', () => {
  it('opens from a link’s request, and closes', () => {
    const ui = useTimelapseUi.getState()
    ui.request(true)
    expect(useTimelapseUi.getState().pending).toBe(true)
    ui.show('link')
    expect(useTimelapseUi.getState()).toMatchObject({ open: { from: 'link' }, pending: false })
    ui.close()
    expect(useTimelapseUi.getState().open).toBeNull()
  })

  it('is drawn over the photo viewer and under the share sheet', () => {
    expect(LAYER_RANK.timelapse).toBeGreaterThan(LAYER_RANK.lightbox)
    expect(LAYER_RANK.timelapse).toBeLessThan(LAYER_RANK.share)
  })
})
