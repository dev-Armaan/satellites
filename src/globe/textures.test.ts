import { afterEach, describe, expect, it, vi } from 'vitest'
import { useApp } from '@/state/store'
import { provisionalTier } from './quality'
import { createRuntime } from './runtime'
import { declineLevel, dprLevels } from './quality'
import {
  askedOnce,
  bitmapsSupportedFor,
  canUpload,
  CLOUD_ZOOM_REST_MS,
  cloudZoomWanted,
  createScheduler,
  criticalSteps,
  decodeImageUrl,
  deepLinkPlace,
  firstDayStep,
  inDarkAt,
  INPUT_QUIET_MS,
  pageInput,
  planBatches,
  restLatch,
  stripCount,
  stripRowsFor,
  STRIP_ROWS_MOBILE,
  uploadBudgetMs,
  upgradePlan,
} from './textures'

describe('upgradePlan (decision 9)', () => {
  it('phones: the 2k day + night pair is the final set, swapped in together; clouds 2k only when zoomed in; never 4k (G-M1)', () => {
    for (const allow4k of [true, false]) {
      const plan = upgradePlan({ ...provisionalTier(true), allow4k, allow8k: false })
      expect(plan.map((s) => `${s.map}-${s.res}-${s.when}`)).toEqual(['day-2k-idle', 'night-2k-idle', 'clouds-2k-zoom'])
      expect(plan.some((s) => s.res === '4k' || s.res === '8k')).toBe(false)
      expect(plan.some((s) => s.map === 'data')).toBe(false)
      // One swap for the pair, then the clouds on their own.
      expect(planBatches(plan).map((b) => b.map((s) => s.map))).toEqual([['day', 'night'], ['clouds']])
    }
  })
  it('desktops get the 4k set at landing idle and 8k only after results', () => {
    const plan = upgradePlan({ ...provisionalTier(false), allow4k: true, allow8k: true })
    expect(plan.filter((s) => s.when === 'idle').map((s) => `${s.map}-${s.res}`)).toEqual(['day-4k', 'night-4k', 'clouds-4k', 'data-4k'])
    expect(plan.at(-1)).toEqual({ map: 'day', res: '8k', when: 'results' })
  })
  it("phones' cloud step waits for a view where a 1k cloud texel (39 km) shows past 10 px, with clouds still showing", () => {
    expect(cloudZoomWanted(39.1 / 5, 9000)).toBe(false) // the regional view at the 2k floor: ~5 px
    expect(cloudZoomWanted(39.1 / 12, 2500)).toBe(true) // zoomed in
    expect(cloudZoomWanted(39.1 / 40, 400)).toBe(false) // so close the cloud layer has faded out
  })
  it("phones' cloud step needs the view to rest there: a settle or re-frame passing through never latches it", () => {
    // The post-capture swing (a ~400 km dive out to the regional range in ~0.6 s at 60 fps) crosses the window.
    const pass = restLatch(CLOUD_ZOOM_REST_MS)
    let t = 0
    for (let alt = 400; alt <= 7500; alt += 120, t += 1000 / 60) {
      const km = (alt / 1000) * 1.0
      expect(pass(cloudZoomWanted(km, alt), t)).toBe(false)
    }
    // A view the camera rests on: latches after the rest time, and stays latched.
    const rest = restLatch(CLOUD_ZOOM_REST_MS)
    expect(rest(true, 0)).toBe(false)
    expect(rest(true, CLOUD_ZOOM_REST_MS - 1)).toBe(false)
    expect(rest(false, CLOUD_ZOOM_REST_MS - 0.5)).toBe(false) // a break restarts the wait
    expect(rest(true, CLOUD_ZOOM_REST_MS)).toBe(false)
    expect(rest(true, 2 * CLOUD_ZOOM_REST_MS)).toBe(true)
    expect(rest(false, 3 * CLOUD_ZOOM_REST_MS)).toBe(true)
  })
  it('desktop steps swap one at a time', () => {
    const plan = upgradePlan({ ...provisionalTier(false), allow4k: true, allow8k: true })
    expect(planBatches(plan).every((b) => b.length === 1)).toBe(true)
  })
  it('slices uploads into 256-row strips (128 on phones: half the work per frame)', () => {
    expect(stripCount('2k')).toBe(4)
    expect(stripCount('4k')).toBe(8)
    expect(stripCount('8k')).toBe(16)
    expect(stripRowsFor({ mobile: true })).toBe(STRIP_ROWS_MOBILE)
    expect(stripCount('2k', stripRowsFor({ mobile: true }))).toBe(8)
    expect(stripRowsFor({ mobile: false })).toBe(256)
  })
})

describe('canUpload (decision 9, R2G1, R2G4)', () => {
  const base = () => {
    const rt = createRuntime(provisionalTier(false), false, Date.now())
    rt.camera.arrivedAt = 0
    rt.phaseEnteredAt = 0
    return rt
  }
  const setStore = (p: Partial<ReturnType<typeof useApp.getState>>) =>
    useApp.setState({ phase: 'idle', timeMode: 'live', motionBusyUntil: 0, ...p })

  it('boot: allowed (the curtain covers the globe)', () => {
    setStore({ phase: 'boot' })
    const rt = base()
    rt.camera.arrivedAt = 9_999
    expect(canUpload(rt, 10_000)).toBe(true)
  })
  it('computing: only at the very start of the flight or once parked for 300 ms', () => {
    setStore({ phase: 'computing' })
    const rt = base()
    rt.phaseEnteredAt = 9_900
    rt.camera.flying = true
    rt.camera.progress = 0.02
    expect(canUpload(rt, 10_000)).toBe(true)
    rt.camera.progress = 0.04
    expect(canUpload(rt, 10_000)).toBe(false)
    rt.camera.progress = 0.9
    expect(canUpload(rt, 10_000)).toBe(false)
    rt.camera.flying = false
    rt.camera.progress = 1
    rt.camera.arrivedAt = 9_800
    expect(canUpload(rt, 10_000)).toBe(false)
    rt.camera.arrivedAt = 9_650
    expect(canUpload(rt, 10_000)).toBe(true)
  })
  it('computing on phones: never mid-flight, even at its very start (G-M1)', () => {
    setStore({ phase: 'computing' })
    const rt = createRuntime(provisionalTier(true), false, Date.now())
    rt.camera.arrivedAt = 0
    rt.camera.flying = true
    rt.camera.progress = 0.01
    expect(canUpload(rt, 10_000)).toBe(false)
    rt.camera.flying = false
    rt.camera.arrivedAt = 9_650
    expect(canUpload(rt, 10_000)).toBe(true)
  })
  it('computing: a hold inherited from the landing does not block; a new one does', () => {
    setStore({ phase: 'computing', motionBusyUntil: 11_000 })
    const rt = base()
    rt.phaseBusyFloor = 11_000
    expect(canUpload(rt, 10_000)).toBe(true)
    useApp.setState({ motionBusyUntil: 11_500 })
    expect(canUpload(rt, 10_000)).toBe(false)
  })
  it('elsewhere: no flight, 600 ms after arrival, 2 s into the phase, past UI holds', () => {
    setStore({ phase: 'results' })
    const rt = base()
    expect(canUpload(rt, 10_000)).toBe(true)
    rt.camera.arrivedAt = 9_500
    expect(canUpload(rt, 10_000)).toBe(false)
    rt.camera.arrivedAt = 0
    rt.phaseEnteredAt = 8_500
    expect(canUpload(rt, 10_000)).toBe(false)
    rt.phaseEnteredAt = 0
    useApp.setState({ motionBusyUntil: 10_100 })
    expect(canUpload(rt, 10_000)).toBe(false)
  })
  it('acquisition: nothing while a sequence is armed, nor for 2.5 s after its capture', () => {
    setStore({ phase: 'results' })
    const rt = base()
    rt.acq.armed = true
    expect(canUpload(rt, 10_000)).toBe(false)
    rt.acq.armed = false
    rt.acq.capturedAt = 8_000
    expect(canUpload(rt, 10_000)).toBe(false)
    expect(canUpload(rt, 10_501)).toBe(true)
  })
  it('input: nothing while a finger is down anywhere (a sheet drag, a swipe) or a scroll just moved', () => {
    setStore({ phase: 'results' })
    const rt = base()
    pageInput.down.add(1)
    pageInput.lastAt = 9_900
    expect(canUpload(rt, 10_000)).toBe(false)
    pageInput.down.clear()
    expect(canUpload(rt, 9_900 + INPUT_QUIET_MS - 1)).toBe(false)
    expect(canUpload(rt, 9_900 + INPUT_QUIET_MS + 1)).toBe(true)
    // A pointer-up that never came expires.
    pageInput.down.add(2)
    expect(canUpload(rt, 9_900 + 8_001)).toBe(true)
    // Boot: the curtain covers the globe, input does not matter.
    pageInput.down.add(3)
    pageInput.lastAt = 9_999
    useApp.setState({ phase: 'boot' })
    expect(canUpload(rt, 10_000)).toBe(true)
    pageInput.down.clear()
    pageInput.lastAt = -Infinity
  })
  it('replay: nothing during the first 10 s of the sweep', () => {
    setStore({ phase: 'results', timeMode: 'replay' })
    const rt = base()
    rt.replayStartedAt = 5_000
    expect(canUpload(rt, 10_000)).toBe(false)
    expect(canUpload(rt, 15_001)).toBe(true)
  })
})

describe('first day step (the regional zoom floor)', () => {
  it('is day 2k on phones and day 4k on desktops', () => {
    expect(firstDayStep(upgradePlan({ ...provisionalTier(true), allow4k: true }))).toMatchObject({ map: 'day', res: '2k', when: 'idle' })
    expect(firstDayStep(upgradePlan({ ...provisionalTier(false), allow4k: true, allow8k: true }))).toEqual({ map: 'day', res: '4k', when: 'idle' })
  })
})

describe('critical steps (a deep link to a place in darkness waits on the night map too)', () => {
  it('reads the place from ?q=lat,lon only', () => {
    expect(deepLinkPlace('?q=43.4723,-80.5449&n=Waterloo')).toEqual({ lat: 43.4723, lon: -80.5449 })
    expect(deepLinkPlace('?q=Waterloo')).toBeUndefined()
    expect(deepLinkPlace('?s=abc123')).toBeUndefined()
    expect(deepLinkPlace('?q=95,10')).toBeUndefined()
  })

  it('knows day from night at the place', () => {
    // 2026-11-08 22:23 UTC: evening in Waterloo (dark), morning in Tokyo (lit).
    const t = Date.UTC(2026, 10, 8, 22, 23)
    expect(inDarkAt({ lat: 43.4723, lon: -80.5449 }, t)).toBe(true)
    expect(inDarkAt({ lat: 35.68, lon: 139.69 }, t)).toBe(false)
  })

  it('adds the first night step only for a dark target (desktops); phones always take the whole pair', () => {
    const desk = upgradePlan({ ...provisionalTier(false), allow4k: true, allow8k: true })
    expect(criticalSteps(desk, false).map((st) => `${st.map}-${st.res}`)).toEqual(['day-4k'])
    expect(criticalSteps(desk, true).map((st) => `${st.map}-${st.res}`)).toEqual(['day-4k', 'night-4k'])
    const phone = upgradePlan({ ...provisionalTier(true), allow4k: true })
    for (const dark of [false, true]) expect(criticalSteps(phone, dark).map((st) => `${st.map}-${st.res}`)).toEqual(['day-2k', 'night-2k'])
  })
})

describe('upload scheduler (G-M1: ≤ 8 ms of upload work per frame on phones)', () => {
  it('phones: at most 8 ms of uploads in any frame; desktops one job outside boot / computing', () => {
    for (const phase of ['boot', 'idle', 'computing', 'results']) expect(uploadBudgetMs(phase, true)).toBe(8)
    expect(uploadBudgetMs('boot', false)).toBe(24)
    expect(uploadBudgetMs('computing', false)).toBe(12)
    expect(uploadBudgetMs('results', false)).toBe(0)
  })
  it('never starts a job the last one says would overrun the budget', () => {
    const sched = createScheduler()
    let clock = 0
    const real = performance.now
    performance.now = () => clock
    try {
      const ran: number[] = []
      for (let i = 0; i < 6; i++) void sched.upload(() => ((clock += 3), ran.push(i)))
      sched.tick(true, 8) // 3 + 3 = 6, a third would make 9 > 8
      expect(ran).toEqual([0, 1])
      sched.tick(true, 0) // one job only
      expect(ran).toEqual([0, 1, 2])
      sched.tick(false, 8) // gate closed
      expect(ran).toEqual([0, 1, 2])
      expect(sched.queued).toBe(3)
    } finally {
      performance.now = real
    }
  })
})

describe('DPR decline (one reallocation for a slow device)', () => {
  const levels = [1, 1.25, 1.5, 2]
  it('steps once for a device just short of the target', () => {
    expect(declineLevel(levels, 2, 36, 40)).toBe(1)
    expect(declineLevel(levels, 3, 35, 40)).toBe(2)
  })
  it('jumps straight to the floor for a device far from it', () => {
    expect(declineLevel(levels, 2, 8, 40)).toBe(0)
    expect(declineLevel(levels, 3, 12, 40)).toBe(0)
    expect(declineLevel(levels, 3, 24, 40)).toBe(2) // 2 × √0.6 = 1.55 → 1.5
    expect(declineLevel(levels, 3, 18, 40)).toBe(1) // 2 × √0.45 = 1.34 → 1.25
  })
  it('stays at the floor', () => {
    expect(declineLevel(levels, 0, 5, 40)).toBe(0)
  })
})

describe('DPR levels (G-M2: never above 2)', () => {
  it('a 3× phone starts at 1.5 and tops out at 2', () => {
    expect(dprLevels(true, 3)).toEqual({ levels: [1, 1.25, 1.5, 2], start: 1.5 })
  })
  it('a 2× laptop starts at 2; a 1× screen stays at 1', () => {
    expect(dprLevels(false, 2)).toEqual({ levels: [1, 1.25, 1.5, 1.75, 2], start: 2 })
    expect(dprLevels(false, 1)).toEqual({ levels: [1], start: 1 })
    expect(Math.max(...dprLevels(false, 4).levels)).toBe(2)
  })
})

describe('bitmapsSupportedFor (which browsers take the sliced, bitmap-decoded upload)', () => {
  const ua = {
    safari18: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
    safari16: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    // In-app WKWebViews carry no Safari or Version token: versioned by the OS.
    instagram18: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22A3354 Instagram 350.0.0.0',
    instagram16: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/20E247 Instagram 300.0.0.0',
    chromeDesktop: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    firefox90: 'Mozilla/5.0 (Windows NT 10.0; rv:90.0) Gecko/20100101 Firefox/90.0',
  }
  it('takes Safari 17+ and desktop Chrome', () => {
    expect(bitmapsSupportedFor(ua.safari18, true)).toBe(true)
    expect(bitmapsSupportedFor(ua.chromeDesktop, true)).toBe(true)
  })
  it('keeps old WebKit (Safari or an in-app WKWebView on iOS < 17) and old Firefox on the whole-image path', () => {
    expect(bitmapsSupportedFor(ua.safari16, true)).toBe(false)
    expect(bitmapsSupportedFor(ua.instagram16, true)).toBe(false)
    expect(bitmapsSupportedFor(ua.firefox90, true)).toBe(false)
  })
  it('recognises an in-app WKWebView on iOS 17+ by its OS version', () => {
    expect(bitmapsSupportedFor(ua.instagram18, true)).toBe(true)
  })
  it('never without createImageBitmap', () => {
    expect(bitmapsSupportedFor(ua.safari18, false)).toBe(false)
  })
})

describe('decodeImageUrl: which archives are asked again', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })
  const failing = () => {
    const asked: string[] = []
    vi.stubGlobal('fetch', async (url: string) => {
      asked.push(url)
      return new Response(null, { status: 502 })
    })
    return asked
  }

  it('asks EUMETSAT once: a failed Meteosat picture stays failed', async () => {
    vi.useFakeTimers()
    const asked = failing()
    const url = 'https://view.eumetsat.int/geoserver/wms?service=WMS&layers=mtg_fd%3Argb_geocolour&width=1024&height=1024'
    expect(askedOnce(url)).toBe(true)
    const load = decodeImageUrl(url).catch((e: Error) => e.message)
    await vi.advanceTimersByTimeAsync(5000)
    expect(await load).toContain('HTTP 502')
    expect(asked).toHaveLength(1)
  })

  it('asks any other archive once more after a pause', async () => {
    vi.useFakeTimers()
    const asked = failing()
    const url = 'https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?LAYERS=BlueMarble_NextGeneration'
    expect(askedOnce(url)).toBe(false)
    const load = decodeImageUrl(url).catch((e: Error) => e.message)
    await vi.advanceTimersByTimeAsync(5000)
    expect(await load).toContain('HTTP 502')
    expect(asked).toHaveLength(2)
  })
})
