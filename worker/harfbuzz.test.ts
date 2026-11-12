/**
 * The pre-built HarfBuzz wrappers (worker/hbThunks.wasm) must match their generator and cover every signature
 * harfbuzzjs registers. A missing one would only fail inside a Worker, on the first card, so it is checked here.
 */
import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { HB_SIGNATURES, thunkModule } from '../scripts/build-hb-thunks.ts'

const committed = async () => new Uint8Array(await readFile(new URL('./hbThunks.wasm', import.meta.url)))

describe('hbThunks.wasm', () => {
  it('is what scripts/build-hb-thunks.ts builds', async () => {
    expect(await committed()).toEqual(thunkModule())
  })

  it('wraps every signature harfbuzzjs passes to addFunction', async () => {
    const hbjs = await readFile(new URL('../node_modules/harfbuzzjs/hbjs.js', import.meta.url), 'utf8')
    // Each call's last argument: walk to its closing parenthesis (the callback in between has its own).
    const used = new Set<string>()
    for (const m of hbjs.matchAll(/\baddFunction\(/g)) {
      let depth = 1
      let i = m.index + m[0].length
      for (; depth > 0 && i < hbjs.length; i++) depth += hbjs[i] === '(' ? 1 : hbjs[i] === ')' ? -1 : 0
      const sig = /'([a-z]+)'\s*\)$/.exec(hbjs.slice(m.index, i))?.[1]
      if (sig) used.add(sig)
    }
    expect(used.size).toBeGreaterThanOrEqual(6)
    expect([...used].filter((sig) => !(HB_SIGNATURES as readonly string[]).includes(sig))).toEqual([])
  })

  it('turns a JavaScript callback into a function a table holds and calls', async () => {
    const module = new WebAssembly.Module(await committed())
    const calls: number[][] = []
    const imports = Object.fromEntries(HB_SIGNATURES.map((sig) => [sig, (...args: number[]) => void calls.push([HB_SIGNATURES.indexOf(sig), ...args])]))
    const instance = new WebAssembly.Instance(module, { e: imports })
    const table = new WebAssembly.Table({ initial: 1, element: 'anyfunc' })
    table.set(0, instance.exports.viiiffi as unknown as Function)
    table.get(0)(1, 2, 3, 1.5, 2.5, 4)
    expect(calls).toEqual([[HB_SIGNATURES.indexOf('viiiffi'), 1, 2, 3, 1.5, 2.5, 4]])
  })
})
