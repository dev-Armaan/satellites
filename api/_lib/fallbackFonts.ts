/**
 * Fonts for text the card's own fonts cannot draw: a place named in Japanese, Arabic, Devanagari and so on.
 *
 * satori asks for them while it lays out a card, naming the script (`ja-JP`, `ar-AR`, … or `unknown`) and the
 * exact characters. Google Fonts serves a Noto subset of just those characters, as TTF when asked with an older
 * browser's user agent (satori cannot read WOFF2). The cards relied on @vercel/og's loader for this before; this is
 * the same idea written for our renderer, so it runs on any host with `fetch`. A failure returns no font: satori then
 * draws the missing characters as boxes rather than failing the card.
 */
import type { SatoriFont } from './fonts.js'

/** satori's script codes → Noto families that cover them. */
const NOTO: Record<string, string[]> = {
  'ja-JP': ['Noto Sans JP'],
  'ko-KR': ['Noto Sans KR'],
  'zh-CN': ['Noto Sans SC'],
  'zh-TW': ['Noto Sans TC'],
  'zh-HK': ['Noto Sans HK'],
  'th-TH': ['Noto Sans Thai'],
  'bn-IN': ['Noto Sans Bengali'],
  'ar-AR': ['Noto Sans Arabic'],
  'ta-IN': ['Noto Sans Tamil'],
  'ml-IN': ['Noto Sans Malayalam'],
  'he-IL': ['Noto Sans Hebrew'],
  'te-IN': ['Noto Sans Telugu'],
  devanagari: ['Noto Sans Devanagari'],
  kannada: ['Noto Sans Kannada'],
  symbol: ['Noto Sans Symbols', 'Noto Sans Symbols 2'],
  math: ['Noto Sans Math'],
  unknown: ['Noto Sans'],
}

/** An old Safari: Google Fonts then answers TrueType rather than WOFF2. */
const TTF_USER_AGENT =
  'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1'
const TIMEOUT_MS = 4000

async function notoSubset(family: string, text: string): Promise<ArrayBuffer | null> {
  const css = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}&text=${encodeURIComponent(text)}`
  const sheet = await fetch(css, { headers: { 'user-agent': TTF_USER_AGENT }, signal: AbortSignal.timeout(TIMEOUT_MS) })
  if (!sheet.ok) return null
  const src = /src: url\((.+?)\) format\('(?:opentype|truetype)'\)/.exec(await sheet.text())?.[1]
  if (!src) return null
  const font = await fetch(src, { signal: AbortSignal.timeout(TIMEOUT_MS) })
  return font.ok ? font.arrayBuffer() : null
}

/** Twemoji's file name for an emoji: its code points in hex, dropping U+FE0F unless the sequence has a joiner. */
function twemojiName(emoji: string): string {
  const points = [...(emoji.includes('\u200d') ? emoji : emoji.replace(/\ufe0f/g, ''))].map((c) => c.codePointAt(0)!.toString(16))
  return points.join('-')
}

async function emojiDataUri(emoji: string): Promise<string | SatoriFont[]> {
  const res = await fetch(`https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${twemojiName(emoji)}.svg`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!res.ok) return []
  return `data:image/svg+xml;base64,${btoa(await res.text())}`
}

async function load(code: string, text: string): Promise<string | SatoriFont[]> {
  if (code === 'emoji') return emojiDataUri(text)
  const out: SatoriFont[] = []
  for (const script of code.split('|')) {
    for (const family of NOTO[script] ?? []) {
      const data = await notoSubset(family, text)
      if (data) out.push({ name: `${family} (fallback)`, data, weight: 400, style: 'normal', ...(script === 'unknown' ? {} : { lang: script }) })
    }
  }
  return out
}

const cache = new Map<string, Promise<string | SatoriFont[]>>()

/**
 * satori's `loadAdditionalAsset`: a data URI for an emoji, fonts otherwise (none when nothing could be loaded).
 * Answers are kept per script and text for the life of the instance.
 */
export function loadFallbackAsset(code: string, text: string): Promise<string | SatoriFont[]> {
  const key = `${code}\u0000${text}`
  let hit = cache.get(key)
  if (!hit) {
    hit = load(code, text).catch((err: unknown) => {
      console.error('[og] fallback font failed', code, err)
      cache.delete(key) // a transient failure is retried by the next card
      return []
    })
    cache.set(key, hit)
  }
  return hit
}
