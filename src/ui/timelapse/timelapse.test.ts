import { describe, expect, it } from 'vitest'
import { LAYER_RANK } from '@/lib/backStack'
import { timelapseParam, useTimelapseUi } from '@/state/timelapse'
import { hasTimelapse } from '@/ui/results/TimelapseEntry'
import type { Capture, Report } from '@/types'
import { timelapseLink } from './link'

describe('the time-lapse link', () => {
  it('is the place link plus tl, with the place rounded like every share', () => {
    const url = new URL(timelapseLink('https://www.watched.earth', { label: 'Groom Lake, Nevada', lat: 37.23512, lon: -115.81117 }, 'years'))
    expect(url.origin + url.pathname).toBe('https://www.watched.earth/')
    expect(Object.fromEntries(url.searchParams)).toEqual({ q: '37.24,-115.81', n: 'Groom Lake, Nevada', tl: 'years' })
    expect(timelapseParam(url.search)).toBe('years')
    expect(timelapseParam(new URL(timelapseLink('https://x', { label: 'Oslo', lat: 59.9, lon: 10.7 }, 'seasons')).search)).toBe('seasons')
  })

  it('reads tl leniently, and nothing else as a request', () => {
    expect(timelapseParam('?q=1,2&tl=1')).toBe('years')
    expect(timelapseParam('?q=1,2&tl=decade')).toBeNull()
    expect(timelapseParam('?q=1,2')).toBeNull()
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
  it('opens from a link’s request, switches mode in place, and closes', () => {
    const ui = useTimelapseUi.getState()
    ui.request('seasons')
    expect(useTimelapseUi.getState().pending).toBe('seasons')
    ui.show('link', 'seasons')
    expect(useTimelapseUi.getState()).toMatchObject({ open: { mode: 'seasons', from: 'link' }, pending: null })
    ui.setMode('years')
    expect(useTimelapseUi.getState().open).toEqual({ mode: 'years', from: 'link' })
    ui.close()
    expect(useTimelapseUi.getState().open).toBeNull()
    ui.setMode('seasons') // closed: nothing to switch
    expect(useTimelapseUi.getState().open).toBeNull()
  })

  it('is drawn over the photo viewer and under the share sheet', () => {
    expect(LAYER_RANK.timelapse).toBeGreaterThan(LAYER_RANK.lightbox)
    expect(LAYER_RANK.timelapse).toBeLessThan(LAYER_RANK.share)
  })
})
