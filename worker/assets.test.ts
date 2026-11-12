/**
 * What the Cloudflare copy publishes from dist/: Vercel answers 403 for source maps, so wrangler must not upload them
 * (public/.assetsignore, copied into dist/ by Vite and read by wrangler).
 */
import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('public/.assetsignore', () => {
  it('keeps source maps off Cloudflare, as Vercel keeps them from the public', async () => {
    const rules = (await readFile(new URL('../public/.assetsignore', import.meta.url), 'utf8'))
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'))
    expect(rules).toContain('*.map')
  })
})
