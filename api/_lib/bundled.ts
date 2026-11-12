/**
 * Files the card needs at render time (fonts, the default plate, WebAssembly), registered by a host that cannot
 * read them from disk.
 *
 * On Node (Vercel, tests, scripts) each module reads its files next to `api/` or from `node_modules` on first use,
 * and nothing is registered here. A Cloudflare Worker has no file system with those files and may only run
 * WebAssembly it bundled at deploy time, so its entry point imports them and registers them before the first
 * request. Keys are paths relative to `api/` (`_fonts/sans-latin.ttf`, `_assets/og-default-plate.jpg`) or
 * `wasm/<name>`.
 */

export type BundledFile = ArrayBuffer | WebAssembly.Module

const files = new Map<string, BundledFile>()

export function registerBundled(entries: Record<string, BundledFile>): void {
  for (const [key, value] of Object.entries(entries)) files.set(key, value)
}

/** The registered copy, or undefined: the caller then reads the file itself (Node). */
export function bundled(key: string): BundledFile | undefined {
  return files.get(key)
}
