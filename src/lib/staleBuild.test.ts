import { describe, expect, it } from 'vitest'
import { RELOAD_GUARD_MS, reloadForNewBuild } from './staleBuild'

function memoryStorage() {
  const m = new Map<string, string>()
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }
}

describe('reloadForNewBuild', () => {
  it('reloads once, then not again inside the guard window', () => {
    const storage = memoryStorage()
    let reloads = 0
    let t = 1_000_000
    const deps = { storage, reload: () => void reloads++, now: () => t }
    expect(reloadForNewBuild(deps)).toBe(true)
    expect(reloads).toBe(1)
    t += 1_000 // the reloaded page fails again (e.g. a broken deploy): no loop
    expect(reloadForNewBuild(deps)).toBe(false)
    expect(reloads).toBe(1)
    t += RELOAD_GUARD_MS // a later deploy, much later in the same tab: one more reload is fine
    expect(reloadForNewBuild(deps)).toBe(true)
    expect(reloads).toBe(2)
  })

  it('never reloads without sessionStorage (it could not remember having tried)', () => {
    let reloads = 0
    expect(reloadForNewBuild({ storage: null, reload: () => void reloads++, now: () => 1 })).toBe(false)
    expect(reloads).toBe(0)
  })

  it('never reloads when storage throws', () => {
    let reloads = 0
    const storage = {
      getItem: () => {
        throw new Error('SecurityError')
      },
      setItem: () => undefined,
    }
    expect(reloadForNewBuild({ storage, reload: () => void reloads++, now: () => 1 })).toBe(false)
    const storage2 = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError')
      },
    }
    expect(reloadForNewBuild({ storage: storage2, reload: () => void reloads++, now: () => 1 })).toBe(false)
    expect(reloads).toBe(0)
  })

  it('treats a clock that went backwards as a fresh start, but still records the attempt', () => {
    const storage = memoryStorage()
    let reloads = 0
    storage.setItem('watched-stale-build-reload', String(5_000_000))
    expect(reloadForNewBuild({ storage, reload: () => void reloads++, now: () => 1_000 })).toBe(true)
    expect(reloadForNewBuild({ storage, reload: () => void reloads++, now: () => 2_000 })).toBe(false)
    expect(reloads).toBe(1)
  })
})

describe('quietly', () => {
  it('marks a prefetch as running until it settles, whether it loads or fails', async () => {
    const { quietly, prefetching } = await import('./staleBuild')
    let fail!: (e: Error) => void
    const failing = quietly(() => new Promise<void>((_, reject) => (fail = reject)))
    const loading = quietly(() => Promise.resolve(1))
    expect(prefetching()).toBe(true)
    await loading
    expect(prefetching()).toBe(true)
    fail(new Error('Failed to fetch dynamically imported module'))
    await failing.catch(() => undefined)
    expect(prefetching()).toBe(false)
  })
})
