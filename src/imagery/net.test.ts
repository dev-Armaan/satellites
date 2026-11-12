import { afterEach, describe, expect, it, vi } from 'vitest'
import { Lru, memoAsync } from './lru'
import { fetchJson, hedge, HttpError, mapLimit, TimeoutError, withRetry } from './net'

describe('Lru', () => {
  it('evicts the least recently used entry', () => {
    const evicted: string[] = []
    const c = new Lru<string, number>(2, (k) => evicted.push(k))
    c.set('a', 1).set('b', 2)
    expect(c.get('a')).toBe(1) // a is now most recent
    c.set('c', 3)
    expect(c.has('b')).toBe(false)
    expect(evicted).toEqual(['b'])
    expect([...c.keys()]).toEqual(['a', 'c'])
    expect(c.peek('a')).toBe(1)
  })

  it('memoAsync shares in-flight loads and forgets failures', async () => {
    const c = new Lru<string, Promise<number>>(4)
    let n = 0
    const load = vi.fn(async () => {
      n++
      if (n === 1) throw new Error('flaky')
      return n
    })
    await expect(memoAsync(c, 'k', load)).rejects.toThrow('flaky')
    await Promise.resolve()
    expect(c.has('k')).toBe(false)
    const [a, b] = await Promise.all([memoAsync(c, 'k', load), memoAsync(c, 'k', load)])
    expect(a).toBe(2)
    expect(b).toBe(2)
    expect(load).toHaveBeenCalledTimes(2)
  })
})

describe('withRetry / fetchJson', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('retries a 503 once and succeeds', async () => {
    const f = vi.fn().mockResolvedValueOnce(new Response('busy', { status: 503 })).mockResolvedValueOnce(Response.json({ ok: 1 }))
    vi.stubGlobal('fetch', f)
    expect(await fetchJson('https://x/y', { retryDelayMs: 1 })).toEqual({ ok: 1 })
    expect(f).toHaveBeenCalledTimes(2)
  })

  it('does not retry a 404', async () => {
    const f = vi.fn(async () => new Response('nope', { status: 404 }))
    vi.stubGlobal('fetch', f)
    const err: unknown = await fetchJson('https://x/y', { retryDelayMs: 1 }).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(HttpError)
    expect((err as HttpError).status).toBe(404)
    expect(f).toHaveBeenCalledTimes(1)
  })

  it('times out each attempt and reports a TimeoutError', async () => {
    const attempt = vi.fn((s: AbortSignal) => new Promise<never>((_, rej) => s.addEventListener('abort', () => rej(new DOMException('aborted', 'AbortError')))))
    const err: unknown = await withRetry(attempt, { timeoutMs: 20, retryDelayMs: 1, label: 'https://slow.example/x' }).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(TimeoutError)
    expect((err as TimeoutError).message).toContain('slow.example')
    expect(attempt).toHaveBeenCalledTimes(2)
  })

  it('stops immediately when the caller aborts', async () => {
    const ctrl = new AbortController()
    const attempt = vi.fn((s: AbortSignal) => new Promise<never>((_, rej) => s.addEventListener('abort', () => rej(new DOMException('aborted', 'AbortError')))))
    const p = withRetry(attempt, { signal: ctrl.signal, retryDelayMs: 1 })
    ctrl.abort()
    await expect(p).rejects.toMatchObject({ name: 'AbortError' })
    expect(attempt).toHaveBeenCalledTimes(1)
  })

  it('mapLimit keeps order and bounds concurrency', async () => {
    let inFlight = 0
    let peak = 0
    const out = await mapLimit([1, 2, 3, 4, 5, 6, 7], 3, async (x) => {
      peak = Math.max(peak, ++inFlight)
      await new Promise((r) => setTimeout(r, 2))
      inFlight--
      return x * 10
    })
    expect(out).toEqual([10, 20, 30, 40, 50, 60, 70])
    expect(peak).toBe(3)
  })
})

describe('hedge', () => {
  /** Never settles until its signal aborts; records that it was aborted. */
  const stall = (log: string[], name: string) => (s: AbortSignal) =>
    new Promise<never>((_, rej) =>
      s.addEventListener('abort', () => {
        log.push(`${name} aborted`)
        rej(new DOMException('aborted', 'AbortError'))
      }),
    )

  it('takes a fast primary and never asks the backup', async () => {
    const backup = vi.fn(async () => 'backup')
    expect(await hedge(async () => 'primary', backup, 20)).toBe('primary')
    await new Promise((r) => setTimeout(r, 40))
    expect(backup).not.toHaveBeenCalled()
  })

  it('asks the backup once the primary is slow, takes its answer and cancels the primary', async () => {
    const log: string[] = []
    const t0 = Date.now()
    expect(await hedge(stall(log, 'primary'), async () => 'backup', 20)).toBe('backup')
    expect(Date.now() - t0).toBeGreaterThanOrEqual(15)
    expect(log).toEqual(['primary aborted'])
  })

  it('asks the backup at once when the primary fails first', async () => {
    const t0 = Date.now()
    const out = await hedge(
      async () => Promise.reject(new TypeError('Failed to fetch')),
      async () => 'backup',
      5_000,
    )
    expect(out).toBe('backup')
    expect(Date.now() - t0).toBeLessThan(1_000)
  })

  it("rejects with the primary's error only when both fail", async () => {
    const err = await hedge(
      async () => Promise.reject(new Error('primary down')),
      async () => Promise.reject(new Error('backup down')),
      5,
    ).catch((e: unknown) => e)
    expect((err as Error).message).toBe('primary down')
  })

  it('a backup failure leaves the primary to answer', async () => {
    const out = await hedge(
      () => new Promise<string>((r) => setTimeout(() => r('primary'), 30)),
      async () => Promise.reject(new Error('backup down')),
      5,
    )
    expect(out).toBe('primary')
  })

  it('rejects at once when the caller aborts, cancelling both', async () => {
    const log: string[] = []
    const ctrl = new AbortController()
    const p = hedge(stall(log, 'primary'), stall(log, 'backup'), 5, ctrl.signal)
    await new Promise((r) => setTimeout(r, 15))
    ctrl.abort()
    await expect(p).rejects.toMatchObject({ name: 'AbortError' })
    expect(log.sort()).toEqual(['backup aborted', 'primary aborted'])
  })
})
