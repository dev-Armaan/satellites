/**
 * Module types for what wrangler bundles as data (wrangler.jsonc `rules`): WebAssembly arrives compiled, fonts and
 * images as bytes. harfbuzzjs ships no types.
 */
declare module '*.wasm' {
  const module: WebAssembly.Module
  export default module
}
declare module '*.ttf' {
  const data: ArrayBuffer
  export default data
}
declare module '*.jpg' {
  const data: ArrayBuffer
  export default data
}
declare module '*/harfbuzzjs/hb.js' {
  const createHarfBuzz: (options: Record<string, unknown>) => Promise<unknown>
  export default createHarfBuzz
}
declare module '*/harfbuzzjs/hbjs.js' {
  const hbjs: (module: unknown) => unknown
  export default hbjs
}
