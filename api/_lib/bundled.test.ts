/**
 * A host's registered copy of a file wins over the disk: that is how the Worker, which cannot read api/, hands the
 * card its fonts and plate.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

beforeEach(() => vi.resetModules()) // the loaders keep their first answer per module instance

describe('bundled files', () => {
  it('serves the default plate from the registered bytes', async () => {
    const { registerBundled } = await import('./bundled.js')
    registerBundled({ '_assets/og-default-plate.jpg': new Uint8Array([0xff, 0xd8, 0xff, 0xd9]).buffer })
    const { defaultPlateDataUri } = await import('./card.js')
    expect(await defaultPlateDataUri()).toBe('data:image/jpeg;base64,/9j/2Q==')
  })

  it('reads the disk when nothing is registered', async () => {
    const { defaultPlateDataUri } = await import('./card.js')
    expect((await defaultPlateDataUri())?.length).toBeGreaterThan(10_000)
  })
})
