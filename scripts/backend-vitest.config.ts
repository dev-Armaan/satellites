/**
 * Vitest config for the serverless functions in api/, the Cloudflare Worker in worker/ and the scripts in scripts/
 * (the root config only collects src/**).
 *   npx vitest run --config scripts/backend-vitest.config.ts
 */
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  root: fileURLToPath(new URL('..', import.meta.url)),
  test: {
    include: ['api/**/*.test.ts', 'worker/**/*.test.ts', 'scripts/**/*.test.ts'],
    environment: 'node',
    setupFiles: ['scripts/cardMeasure.setup.ts'],
    testTimeout: 30_000,
  },
})
