import { afterEach, describe, expect, it, vi } from 'vitest'
import { gibsWmsUrl } from './endpoints'
import { ImageTimeoutError, preloadImage } from './image'

describe('loading a weather picture', () => {
  afterEach(() => vi.unstubAllGlobals())
  /** A service that never answers: the request ends only when it is aborted. */
  const hang = () => vi.fn((_url: string, init?: RequestInit) => new Promise<Response>((_, rej) => init?.signal?.addEventListener('abort', () => rej(new DOMException('aborted', 'AbortError')))))
  const url = (day: string) => gibsWmsUrl('VIIRS_NOAA20_CorrectedReflectance_TrueColor', day, { lat: 36.46, lon: -120.09 }, { halfSizeKm: 600, px: 1024 })

  it('does not ask NASA GIBS again for a picture that timed out', async () => {
    const f = hang()
    vi.stubGlobal('fetch', f)
    const err: unknown = await preloadImage(url('2026-11-11'), { timeoutMs: 20 }).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ImageTimeoutError)
    expect((err as Error).message).toBe('Image timed out after 0 s')
    expect(f).toHaveBeenCalledTimes(1)
  })

  it('still asks once more after a failure that is not a timeout', async () => {
    const f = vi.fn(async (_url: string) => new Response('busy', { status: 503 }))
    vi.stubGlobal('fetch', f)
    await expect(preloadImage(url('2026-11-10'), { timeoutMs: 5_000 })).rejects.toThrow('Image failed to load')
    expect(f).toHaveBeenCalledTimes(2)
  })
})
