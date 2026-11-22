import { describe, expect, it } from 'vitest'
import { chunk, requestChunk } from './chunks'

const noWait = () => Promise.resolve()
/** Lets every pending promise callback run. */
const settle = () => new Promise<void>((r) => setTimeout(r, 0))

describe('chunk', () => {
  it('asks once while a load is pending and remembers the module', async () => {
    let calls = 0
    const c = chunk(async () => ({ n: ++calls }))
    const [a, b] = await Promise.all([c(), c()])
    expect(a).toBe(b)
    expect(c.loaded).toEqual({ n: 1 })
    await c()
    expect(calls).toBe(1)
  })

  it('forgets a failed load, so the next call asks again', async () => {
    let calls = 0
    const c = chunk(async () => {
      if (++calls === 1) throw new Error('offline')
      return { ok: true }
    })
    await expect(c()).rejects.toThrow('offline')
    expect(c.loaded).toBeUndefined()
    await expect(c()).resolves.toEqual({ ok: true })
  })

  it('treats an import that resolves with nothing as a failure (a cancelled vite:preloadError)', async () => {
    let calls = 0
    const c = chunk<{ ok: boolean }>(async () => (++calls === 1 ? (undefined as never) : { ok: true }))
    await expect(c()).rejects.toThrow('chunk did not load')
    expect(c.loaded).toBeUndefined()
    await expect(c()).resolves.toEqual({ ok: true })
  })

  it('tells whoever waits when the module arrives through another caller', async () => {
    const c = chunk(async () => ({ ok: true }))
    let told = 0
    c.onLoad(() => told++)
    const stop = c.onLoad(() => told++)
    stop()
    await c()
    expect(told).toBe(1)
  })
})

describe('requestChunk', () => {
  it('asks again after a failure and stays quiet once it loads', async () => {
    let calls = 0
    const c = chunk(async () => {
      if (++calls < 3) throw new Error('offline')
      return { ok: true }
    })
    const failed: unknown[] = []
    requestChunk(c, { onFail: (e) => failed.push(e), retryMs: [1, 1], wait: noWait })
    await settle()
    expect(calls).toBe(3)
    expect(c.loaded).toEqual({ ok: true })
    expect(failed).toEqual([])
  })

  it('reports the last error when every attempt fails', async () => {
    let calls = 0
    const c = chunk<never>(async () => {
      throw new Error(`refused ${++calls}`)
    })
    const failed: unknown[] = []
    requestChunk(c, { onFail: (e) => failed.push(e), retryMs: [1, 1], wait: noWait })
    await settle()
    expect(calls).toBe(3)
    expect(String(failed[0])).toContain('refused 3')
    expect(failed).toHaveLength(1)
  })

  it('gives up when told to: no further attempt and no report', async () => {
    let calls = 0
    const c = chunk<never>(async () => {
      calls++
      throw new Error('offline')
    })
    const failed: unknown[] = []
    let release = () => {}
    const stop = requestChunk(c, { onFail: (e) => failed.push(e), retryMs: [1, 1], wait: () => new Promise<void>((r) => (release = r)) })
    await settle()
    expect(calls).toBe(1)
    stop()
    release()
    await settle()
    expect(calls).toBe(1)
    expect(failed).toEqual([])
  })
})
