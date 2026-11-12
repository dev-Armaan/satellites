/**
 * public/_headers gives every static file on Cloudflare the headers vercel.json gives it on Vercel, path for path.
 * Both files are read as their hosts read them: vercel.json's routes up to `handle: filesystem` (anchored patterns,
 * `continue` routes adding headers), and _headers' rules (one `*` splat, matching rules combined).
 */
import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

const PATHS = [
  '/',
  '/index.html',
  '/assets/index-abc123.js',
  '/textures/earth-day-4k.webp',
  '/data/catalog.json',
  '/data/catalog-names.json',
  '/og-default.png',
  '/favicon.svg',
  '/admin',
  '/admin.html',
]

type Headers = Record<string, string>
const lower = (h: Headers) => Object.fromEntries(Object.entries(h).map(([k, v]) => [k.toLowerCase(), v]))

async function vercelHeaders(path: string): Promise<Headers> {
  const { routes } = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8')) as {
    routes: { src?: string; headers?: Headers; handle?: string; has?: unknown[] }[]
  }
  const out: Headers = {}
  for (const r of routes) {
    if (r.handle) break
    if (!r.src || r.has || !new RegExp(`^${r.src.replace(/^\^/, '').replace(/\$$/, '')}$`).test(path)) continue
    Object.assign(out, lower(r.headers ?? {}))
  }
  return out
}

async function cloudflareHeaders(path: string): Promise<Headers> {
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

describe('public/_headers', () => {
  it.each(PATHS)('gives %s the headers vercel.json gives it', async (path) => {
    const { 'strict-transport-security': hsts, ...cf } = await cloudflareHeaders(path)
    expect(hsts).toBe('max-age=63072000') // Vercel adds this one on its own
    expect(cf).toEqual(await vercelHeaders(path))
  })
})
