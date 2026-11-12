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
  '/places/20261112/s/sa.txt',
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

interface VercelRoute {
  src?: string
  headers?: Headers
  handle?: string
  has?: unknown[]
}

const vercelRoutes = async () =>
  (JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8')) as { routes: VercelRoute[] }).routes

async function vercelHeaders(path: string): Promise<Headers> {
  const routes = await vercelRoutes()
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

async function expectSameHeaders(path: string) {
  const { 'strict-transport-security': hsts, ...cf } = await cloudflareHeaders(path)
  expect(hsts).toBe('max-age=63072000') // Vercel adds this one on its own
  expect(cf, path).toEqual(await vercelHeaders(path))
}

/** A path each header rule of vercel.json matches: `/places/(.*)` → `/places/x`, `/admin(?:\.html)?/?` → `/admin`. */
const sampleOf = (src: string) =>
  src
    .replace(/\(\.\*\)/g, 'x')
    .replace(/\(\?:[^)]*\)\?/g, '')
    .replace(/\/\?$/, '')
    .replace(/\\\./g, '.')

describe('public/_headers', () => {
  it.each(PATHS)('gives %s the headers vercel.json gives it', expectSameHeaders)

  it('covers every header rule vercel.json has, including ones added later', async () => {
    const routes = await vercelRoutes()
    const samples = routes
      .slice(0, routes.findIndex((r) => r.handle))
      .filter((r) => r.src && r.headers && !r.has)
      .map((r) => sampleOf(r.src!))
    expect(samples).toContain('/places/x')
    for (const path of samples) await expectSameHeaders(path)
  })
})
