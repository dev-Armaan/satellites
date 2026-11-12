/**
 * Build worker/hbThunks.wasm: a tiny WebAssembly module that turns JavaScript callbacks into functions HarfBuzz can
 * call.
 *
 * harfbuzzjs registers JavaScript callbacks in its function table (`addFunction`) as soon as it starts. A table
 * only holds WebAssembly functions, so Emscripten wraps each callback by compiling a one-function module on the spot.
 * Cloudflare Workers refuse to compile WebAssembly at runtime, so that start fails there. This module holds the same
 * wrapper for every signature harfbuzzjs uses, compiled once at deploy time; worker/harfbuzz.ts instantiates it per
 * callback instead. The bytes match Emscripten's own `convertJsFunctionToWasm`, one import and export per signature.
 *
 *   npx tsx scripts/build-hb-thunks.ts           # (re)write worker/hbThunks.wasm
 *
 * worker/harfbuzz.test.ts checks the committed file against `thunkModule()`, and that it covers every signature
 * harfbuzzjs passes to `addFunction`.
 */
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** Emscripten signature strings: return type, then parameters (v void, i i32, j i64, f f32, d f64, p pointer). */
export const HB_SIGNATURES = [
  'vi',
  'iiiii',
  'ippip',
  'ipppp',
  'viiii',
  'ippiip',
  'ippipp',
  'ippiipp',
  'ippipip',
  'ippippp',
  'ipppipp',
  'viiiffi',
  'viiiffffi',
  'viiiffffffi',
] as const

const TYPE: Record<string, number> = { i: 0x7f, p: 0x7f, j: 0x7e, f: 0x7d, d: 0x7c }

function uleb(n: number): number[] {
  const out: number[] = []
  do {
    let b = n & 0x7f
    n >>>= 7
    if (n) b |= 0x80
    out.push(b)
  } while (n)
  return out
}

const vec = (items: number[][]): number[] => [...uleb(items.length), ...items.flat()]
const name = (s: string): number[] => [...uleb(s.length), ...[...s].map((c) => c.charCodeAt(0))]
const section = (id: number, body: number[]): number[] => [id, ...uleb(body.length), ...body]

/** One function type, import `e.<sig>` and export `<sig>` per signature, in HB_SIGNATURES order. */
export function thunkModule(signatures: readonly string[] = HB_SIGNATURES): Uint8Array {
  const types = signatures.map((sig) => {
    const params = [...sig.slice(1)].map((c) => TYPE[c])
    const results = sig[0] === 'v' ? [] : [TYPE[sig[0]]]
    return [0x60, ...uleb(params.length), ...params, ...uleb(results.length), ...results]
  })
  const imports = signatures.map((sig, i) => [...name('e'), ...name(sig), 0x00, ...uleb(i)])
  const exports = signatures.map((sig, i) => [...name(sig), 0x00, ...uleb(i)])
  return Uint8Array.from([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00, ...section(1, vec(types)), ...section(2, vec(imports)), ...section(7, vec(exports))])
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'worker', 'hbThunks.wasm')
  await writeFile(out, thunkModule())
  console.log(`wrote ${path.relative(process.cwd(), out)}`)
}
