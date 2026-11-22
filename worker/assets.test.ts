/**
 * What is published from dist/: source maps are built for debugging and must not be uploaded
 * (public/.assetsignore, copied into dist/ by Vite and read by wrangler).
 */
import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('public/.assetsignore', () => {
  it('keeps source maps from being published', async () => {
    const rules = (await readFile(new URL('../public/.assetsignore', import.meta.url), 'utf8'))
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'))
    expect(rules).toContain('*.map')
  })
})
