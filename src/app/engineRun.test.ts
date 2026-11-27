import { describe, expect, it } from 'vitest'
import type { ProgressEvent } from '@/types'
import { engineRun, type RunCallbacks } from './engineRun'

/** An engine a test drives by hand: its callbacks, and the promise's two ends. */
function fakeEngine() {
  let cb!: RunCallbacks<string>
  let resolve!: (r: string) => void
  let reject!: (e: unknown) => void
  let now = 0
  const run = engineRun<string>(
    (c) => {
      cb = c
      return new Promise<string>((res, rej) => {
        resolve = res
        reject = rej
      })
    },
    () => now,
  )
  return { run, cb, resolve, reject, at: (t: number) => (now = t) }
}

function listener() {
  const seen: string[] = []
  const handlers: RunCallbacks<string> = {
    onProgress: (e) => seen.push(`progress:${e.stage}:${String(e.message)}`),
    onPartial: (r) => seen.push(`partial:${r}`),
    onUpdate: (r) => seen.push(`update:${r}`),
  }
  return { seen, handlers }
}

const line = (stage: ProgressEvent['stage'], message: string, fraction?: number): ProgressEvent => ({ stage, message, fraction })

describe('engineRun', () => {
  it('passes every event straight through once someone listens', async () => {
    const { run, cb, resolve } = fakeEngine()
    const { seen, handlers } = listener()
    run.attach(handlers)
    cb.onProgress(line('catalog', 'a'))
    cb.onPartial('p1')
    resolve('final')
    await expect(run.done).resolves.toBe('final')
    cb.onUpdate('patch')
    expect(seen).toEqual(['progress:catalog:a', 'partial:p1', 'update:patch'])
    expect(run.latest()).toBe('patch')
    // Nothing was kept back for a second listener to be handed.
    expect(run.history()).toEqual([])
  })

  it('hands over the newest partial report kept before anyone listened', () => {
    const { run, cb } = fakeEngine()
    cb.onPartial('p1')
    cb.onPartial('p1 with its cover')
    const { seen, handlers } = listener()
    run.attach(handlers)
    expect(seen).toEqual(['partial:p1 with its cover'])
    // …once: a later listener event is the engine's own.
    cb.onPartial('p2')
    expect(seen).toEqual(['partial:p1 with its cover', 'partial:p2'])
    expect(run.latest()).toBeUndefined()
  })

  it('leads with the final report when it is in before anyone listens, not the partial it replaced', async () => {
    const { run, cb, resolve } = fakeEngine()
    cb.onPartial('p1')
    resolve('final')
    await run.done
    const { seen, handlers } = listener()
    run.attach(handlers)
    expect(seen).toEqual([])
    expect(run.latest()).toBe('final')
  })

  it('keeps a background patch that followed the final report as the newest', async () => {
    const { run, cb, resolve } = fakeEngine()
    resolve('final')
    await run.done
    cb.onUpdate('patch 1')
    cb.onUpdate('patch 2')
    const { seen, handlers } = listener()
    run.attach(handlers)
    expect(seen).toEqual([])
    expect(run.latest()).toBe('patch 2')
    cb.onUpdate('patch 3')
    expect(seen).toEqual(['update:patch 3'])
    expect(run.latest()).toBe('patch 3')
  })

  it('a patch that beat the final report to its listener stays the newest', async () => {
    const { run, cb, resolve } = fakeEngine()
    const { handlers } = listener()
    run.attach(handlers)
    resolve('final')
    cb.onUpdate('patch')
    await run.done
    expect(run.latest()).toBe('patch')
  })

  it("keeps each step's first and newest line with the time it was said", () => {
    const { run, cb, at } = fakeEngine()
    at(100)
    cb.onProgress(line('catalog', 'loading', 0.02))
    at(900)
    cb.onProgress(line('propagate', '1 / 394', 0.1))
    at(950)
    cb.onProgress(line('propagate', '200 / 394', 0.3))
    at(1400)
    cb.onProgress(line('propagate', '394 / 394', 0.6))
    at(1500)
    cb.onProgress(line('match', 'matching', 0.86))
    expect(run.history()).toEqual([
      { ...line('catalog', 'loading', 0.02), at: 100 },
      { ...line('propagate', '1 / 394', 0.1), at: 900 },
      { ...line('propagate', '394 / 394', 0.6), at: 1400 },
      { ...line('match', 'matching', 0.86), at: 1500 },
    ])
    // After the hand-over the history stands, and progress goes to the listener.
    const { seen, handlers } = listener()
    run.attach(handlers)
    cb.onProgress(line('match', 'verifying', 0.9))
    expect(seen).toEqual(['progress:match:verifying'])
    expect(run.history()).toHaveLength(4)
  })

  it('a failure nobody awaits yet still reaches whoever awaits it later', async () => {
    const { run, reject } = fakeEngine()
    reject(new Error('catalog'))
    await new Promise((r) => setTimeout(r, 0))
    await expect(run.done).rejects.toThrow('catalog')
    expect(run.latest()).toBeUndefined()
  })
})
