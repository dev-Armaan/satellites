/**
 * Vitest config for the serverless functions in api/ and the Cloudflare Worker in worker/ (the root config only
 * collects src/**).
 *   npx vitest run --config scripts/backend-vitest.config.ts
 */
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  root: fileURLToPath(new URL('..', import.meta.url)),
  test: {
    include: ['api/**/*.test.ts', 'worker/**/*.test.ts'],
    environment: 'node',
    testTimeout: 30_000,
  },
})
