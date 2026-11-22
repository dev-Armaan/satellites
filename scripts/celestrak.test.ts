import { describe, expect, it } from 'vitest'
import { fetchGroup, isFresh, NotElements, Refused, type AskOptions } from './celestrak'

/** A clock that only moves when the code under test sleeps, and a fetch that plays the given answers in turn. */
function rig(answers: (() => Promise<Response>)[], over: Partial<AskOptions> = {}) {
  let t = 0
  const asked: string[] = []
  const slept: number[] = []
  const opts: AskOptions = {
    deadline: 6 * 60_000,
    now: () => t,
    sleep: async (ms) => {
      slept.push(ms)
      t += ms
    },
    log: () => undefined,
    fetch: (async (url: string) => {
      asked.push(url)
      const next = answers.shift()
      if (!next) throw new Error('asked more often than expected')
      return next()
    }) as unknown as typeof fetch,
    ...over,
  }
  return { opts, asked, slept, advance: (ms: number) => (t += ms) }
}

const elements = () => Promise.resolve(new Response(JSON.stringify([{ NORAD_CAT_ID: 25544, OBJECT_NAME: 'ISS (ZARYA)' }]), { status: 200 }))
const status = (code: number, text: string) => () => Promise.resolve(new Response('', { status: code, statusText: text }))
const cut = () => Promise.reject(new TypeError('terminated'))
const timedOut = () => Promise.reject(new DOMException('The operation was aborted due to timeout', 'TimeoutError'))

describe('asking CelesTrak for a group', () => {
  it('returns the elements of a 200, asking once, for the group by name', async () => {
    const r = rig([elements])
    const list = await fetchGroup('active', r.opts)
    expect(list).toHaveLength(1)
    expect(r.asked).toEqual(['https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=json'])
  })

  it('stops at the first answer that is not 200, never asking again (its usage policy)', async () => {
    for (const [code, text] of [
      [403, 'Forbidden'],
      [404, 'Not Found'],
      [503, 'Service Unavailable'],
    ] as const) {
      const r = rig([status(code, text), elements])
      const err = await fetchGroup('active', r.opts).catch((e: unknown) => e)
      expect(err).toBeInstanceOf(Refused)
      expect((err as Refused).status).toBe(code)
      expect(r.asked).toHaveLength(1)
    }
  })

  it('asks again after a pause when there was no answer: the connection cut, or the time limit', async () => {
    const r = rig([cut, timedOut, elements])
    await expect(fetchGroup('active', r.opts)).resolves.toHaveLength(1)
    expect(r.asked).toHaveLength(3)
    expect(r.slept).toEqual([10_000, 30_000])
  })

  it('after a cut download, a 403 still ends the asking (2026-11-20: three more asks within 25 s)', async () => {
    const r = rig([cut, status(403, 'Forbidden'), elements, elements])
    await expect(fetchGroup('active', r.opts)).rejects.toBeInstanceOf(Refused)
    expect(r.asked).toHaveLength(2)
  })

  it('gives up after its tries, with the last failure', async () => {
    const r = rig([cut, cut, timedOut])
    await expect(fetchGroup('active', r.opts)).rejects.toMatchObject({ name: 'TimeoutError' })
    expect(r.asked).toHaveLength(3)
  })

  it('never asks past the run’s deadline, and never sleeps into it', async () => {
    const late = rig([elements], { deadline: 4_000 })
    await expect(fetchGroup('active', late.opts)).rejects.toThrow(/no time left/)
    expect(late.asked).toHaveLength(0)

    const short = rig([cut, elements], { deadline: 12_000 })
    await expect(fetchGroup('active', short.opts)).rejects.toThrow('terminated')
    expect(short.slept).toEqual([])
    expect(short.asked).toHaveLength(1)
  })

  it('limits each request to two minutes, or the time left before the deadline', async () => {
    const limits: number[] = []
    const r = rig([cut, elements], { deadline: 60_000 })
    r.opts.timeout = (ms) => {
      limits.push(ms)
      return new AbortController().signal
    }
    await fetchGroup('active', { ...r.opts, deadline: 6 * 60_000 })
    expect(limits[0]).toBe(120_000)
    const near = rig([elements], { deadline: 30_000 })
    near.opts.timeout = (ms) => {
      limits.push(ms)
      return new AbortController().signal
    }
    await fetchGroup('active', near.opts)
    expect(limits.at(-1)).toBe(30_000)
  })

  it('ends a request at its limit, headers and body alike', async () => {
    const r = rig([], { attempts: 1, timeout: () => AbortSignal.timeout(20) })
    r.opts.fetch = (async (_url: string, init?: RequestInit) =>
      new Promise<Response>((_, reject) => init?.signal?.addEventListener('abort', () => reject(init.signal?.reason)))) as unknown as typeof fetch
    await expect(fetchGroup('active', r.opts)).rejects.toMatchObject({ name: 'TimeoutError' })
  })

  it('does not ask again for a 200 that is not a list of elements', async () => {
    const r = rig([() => Promise.resolve(new Response('No GP data found', { status: 200 })), elements])
    await expect(fetchGroup('activ', r.opts)).rejects.toBeInstanceOf(NotElements)
    expect(r.asked).toHaveLength(1)
  })
})

describe('whether the catalog is fresh enough to leave', () => {
  const now = Date.parse('2026-11-21T22:00:00Z')
  it('is fresh while younger than the hours given', () => {
    expect(isFresh('2026-11-21T19:24:00Z', 4, now)).toBe(true)
    expect(isFresh('2026-11-21T17:59:00Z', 4, now)).toBe(false)
  })
  it('is never fresh with no time, a broken one, or one in the future', () => {
    expect(isFresh(undefined, 4, now)).toBe(false)
    expect(isFresh('yesterday', 4, now)).toBe(false)
    expect(isFresh('2026-11-22T01:00:00Z', 4, now)).toBe(false)
  })
})
