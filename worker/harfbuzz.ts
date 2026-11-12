/**
 * harfbuzzjs for Cloudflare Workers: what `import hb from 'harfbuzzjs'` gives satori, built without compiling any
 * WebAssembly at runtime.
 *
 * The package's own entry starts Emscripten with no options, which then looks for hb.wasm through `fs` or `fetch`
 * and compiles it, and later compiles a small wrapper module per JavaScript callback (`addFunction`). Workers allow
 * neither: they only run WebAssembly bundled at deploy time. wrangler.jsonc aliases `harfbuzzjs` to this file, which
 * hands Emscripten the bundled hb.wasm (`instantiateWasm`) and replaces `addFunction` with one that instantiates the
 * pre-built wrappers in hbThunks.wasm (scripts/build-hb-thunks.ts). The paths below are relative so the alias does
 * not catch them.
 *
 * The export is a thenable that starts HarfBuzz on the first `await` (satori's first card), not at startup.
 */
import hbWasm from '../node_modules/harfbuzzjs/hb.wasm'
import createHarfBuzz from '../node_modules/harfbuzzjs/hb.js'
import hbjs from '../node_modules/harfbuzzjs/hbjs.js'
import thunks from './hbThunks.wasm'

type Callback = (...args: number[]) => number | void

interface EmscriptenModule {
  wasmExports: Record<string, unknown> & { __indirect_function_table: WebAssembly.Table }
  addFunction?: (fn: Callback, sig: string) => number
  removeFunction?: (index: number) => void
}

const SIGNATURES = WebAssembly.Module.exports(thunks).map((e) => e.name)

/** Table slots for JavaScript callbacks, through the pre-built wrappers. */
function functionTable(table: WebAssembly.Table) {
  const freed: number[] = []
  const refuse = (sig: string) => () => {
    throw new Error(`hb thunk ${sig} called through the wrong signature`)
  }
  return {
    addFunction(fn: Callback, sig: string): number {
      if (!SIGNATURES.includes(sig)) throw new Error(`hbThunks.wasm has no wrapper for '${sig}'; rebuild it (scripts/build-hb-thunks.ts)`)
      const imports = Object.fromEntries(SIGNATURES.map((s) => [s, s === sig ? fn : refuse(s)]))
      const wrapper = new WebAssembly.Instance(thunks, { e: imports }).exports[sig] as unknown as Function
      const index = freed.pop() ?? table.grow(1)
      table.set(index, wrapper)
      return index
    },
    removeFunction(index: number): void {
      table.set(index, null)
      freed.push(index)
    },
  }
}

async function start(): Promise<unknown> {
  // Emscripten takes a Worker for both a Web Worker and (with nodejs_compat) Node, and reads `self.location.href`
  // and `__dirname` for its own location (to find hb.wasm, which we hand it instead). Workers have neither: lend
  // them while it starts, then take them back.
  const g = globalThis as { location?: unknown; __dirname?: unknown }
  const lendLocation = typeof g.location === 'undefined'
  const lendDirname = typeof g.__dirname === 'undefined'
  if (lendLocation) g.location = { href: 'https://harfbuzz.invalid/' }
  if (lendDirname) g.__dirname = '/'
  try {
    const module = (await createHarfBuzz({
      instantiateWasm(imports: WebAssembly.Imports, done: (instance: WebAssembly.Instance) => void) {
        WebAssembly.instantiate(hbWasm, imports).then(done)
        return {}
      },
    })) as EmscriptenModule
    Object.assign(module, functionTable(module.wasmExports.__indirect_function_table))
    return hbjs(module)
  } finally {
    if (lendLocation) delete g.location
    if (lendDirname) delete g.__dirname
  }
}

let started: Promise<unknown> | null = null

export default {
  then<T>(resolve: (hb: unknown) => T, reject?: (err: unknown) => T): Promise<T> {
    started ??= start()
    return started.then(resolve, reject)
  },
}
