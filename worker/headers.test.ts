/**
 * public/_headers gives every static file its headers, and worker/router.ts gives the same security headers to what
 * the Worker builds itself (the file does not reach those). The rules are read here as Cloudflare reads them: one `*`
 * splat a pattern, every matching rule applied, a header named twice joined with a comma.
 */
import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { SECURITY_HEADERS } from './router.ts'

type Headers = Record<string, string>

async function headersFor(path: string): Promise<Headers> {
  const text = await readFile(new URL('../public/_headers', import.meta.url), 'utf8')
  const out: Headers = {}
  let applies = false
  for (const line of text.split('\n')) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue
    if (!/^\s/.test(line)) {
      const pattern = new RegExp(`^${line.trim().replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace('*', '.*')}$`)
      applies = pattern.test(path)
    } else if (applies) {
      const [name, ...value] = line.trim().split(':')
      const key = name.toLowerCase()
      out[key] = out[key] ? `${out[key]}, ${value.join(':').trim()}` : value.join(':').trim() // Cloudflare joins repeats
    }
  }
  return out
}

const SECURITY = Object.fromEntries(Object.entries(SECURITY_HEADERS).map(([k, v]) => [k.toLowerCase(), v]))
const IMMUTABLE = 'public, max-age=31536000, immutable'
const CATALOG = 'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400'
const ADMIN = { 'x-robots-tag': 'noindex, nofollow', 'x-frame-options': 'DENY', 'cache-control': 'no-cache' }

/** What each kind of file is sent with, beyond the security headers every path gets. */
const EXPECTED: [path: string, headers: Headers][] = [
  ['/', {}],
  ['/index.html', {}],
  ['/favicon.svg', {}],
  // Hashed names and the versioned place list never change under their address.
  ['/assets/index-abc123.js', { 'cache-control': IMMUTABLE }],
  ['/places/20261112/s/sa.txt', { 'cache-control': IMMUTABLE }],
  // The Earth maps keep their names across rebuilds: a day, never immutable.
  ['/textures/earth-day-4k.webp', { 'cache-control': 'public, max-age=86400, stale-while-revalidate=604800' }],
  ['/data/catalog.json', { 'cache-control': CATALOG }],
  ['/data/catalog-names.json', { 'cache-control': CATALOG }],
  ['/og-default.png', { 'cache-control': 'public, max-age=86400, s-maxage=604800' }],
  ['/admin', ADMIN],
  ['/admin.html', ADMIN],
]

describe('public/_headers', () => {
  it.each(EXPECTED)('sends %s its headers', async (path, headers) => {
    expect(await headersFor(path)).toEqual({ ...SECURITY, ...headers })
  })

  it('sends the security headers the Worker adds to its own responses', async () => {
    expect(await headersFor('/anything/at/all.txt')).toEqual(SECURITY)
  })
})
