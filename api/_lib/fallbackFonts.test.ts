/**
 * The Noto fallback for scripts the card fonts lack: what it asks Google Fonts for, and that a failure costs the
 * card a few glyphs, never the card.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadFallbackAsset } from './fallbackFonts.js'

afterEach(() => vi.unstubAllGlobals())

const TTF = new Uint8Array([0, 1, 0, 0, 9, 9]).buffer

describe('fallback fonts', () => {
  it('asks for a TrueType Noto subset of exactly the missing characters, tagged with its script', async () => {
    const seen: { url: string; ua: string | null }[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        seen.push({ url, ua: new Headers(init?.headers).get('user-agent') })
        return url.startsWith('https://fonts.googleapis.com/')
          ? new Response("@font-face { src: url(https://fonts.gstatic.com/s/notosansjp/x.ttf) format('truetype'); }")
          : new Response(TTF)
      }),
    )
    const fonts = await loadFallbackAsset('ja-JP', '東京')
    expect(fonts).toEqual([{ name: 'Noto Sans JP (fallback)', data: TTF, weight: 400, style: 'normal', lang: 'ja-JP' }])
    expect(seen[0].url).toBe(`https://fonts.googleapis.com/css2?family=Noto+Sans+JP&text=${encodeURIComponent('東京')}`)
    expect(seen[0].ua).toMatch(/Safari\/533/) // an old browser gets TTF, which satori reads (not WOFF2)
    expect(seen[1].url).toBe('https://fonts.gstatic.com/s/notosansjp/x.ttf')
  })

  it('leaves the script untagged for characters satori cannot place', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        url.startsWith('https://fonts.googleapis.com/') ? new Response("src: url(https://f/x.ttf) format('truetype')") : new Response(TTF),
      ),
    )
    expect(await loadFallbackAsset('unknown', 'ŉ')).toEqual([{ name: 'Noto Sans (fallback)', data: TTF, weight: 400, style: 'normal' }])
  })

  it('draws an emoji from Twemoji', async () => {
    const fetch = vi.fn(async (_url: string) => new Response('<svg/>'))
    vi.stubGlobal('fetch', fetch)
    expect(await loadFallbackAsset('emoji', '🛰️')).toBe(`data:image/svg+xml;base64,${btoa('<svg/>')}`)
    expect(String(fetch.mock.calls[0][0])).toMatch(/\/1f6f0\.svg$/)
  })

  it('gives up quietly when Google Fonts is down, and asks again next time', async () => {
    const fetch = vi.fn(async () => Promise.reject(new TypeError('offline')))
    vi.stubGlobal('fetch', fetch)
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(await loadFallbackAsset('ar-AR', 'القاهرة')).toEqual([])
    expect(await loadFallbackAsset('ar-AR', 'القاهرة')).toEqual([])
    expect(fetch).toHaveBeenCalledTimes(2)
  })
})
