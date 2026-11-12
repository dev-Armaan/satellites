/**
 * Static font instances for satori (built by scripts/backend-fonts.py into api/_fonts/).
 *
 * Read from disk next to the function: `new URL('../_fonts/…', import.meta.url)` is what Vercel's
 * file tracer follows, and vercel.json `includeFiles` ships the folder regardless. The cwd-based
 * path is a second chance for runtimes that relocate the compiled module.
 */
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { bundled } from './bundled.js'

export const FONT = {
  display: 'Overflight Display', // Instrument Sans, wdth 75 / wght 560
  sans: 'Overflight Sans', //       Instrument Sans, wdth 100 / wght 400
  mono: 'Overflight Mono', //       Martian Mono, wdth 87.5 / wght 350 (and 500 for the wordmark lockup)
  serif: 'Overflight Serif', //     Instrument Serif italic
} as const

type Weight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900

export interface SatoriFont {
  name: string
  data: ArrayBuffer
  weight: Weight
  style: 'normal' | 'italic'
  /** satori's script code, for a fallback font that draws one script (fallbackFonts.ts). */
  lang?: string
}

const FILES: { stem: string; name: string; weight: Weight; style: 'normal' | 'italic' }[] = [
  { stem: 'display', name: FONT.display, weight: 600, style: 'normal' },
  { stem: 'sans', name: FONT.sans, weight: 400, style: 'normal' },
  { stem: 'mono', name: FONT.mono, weight: 400, style: 'normal' },
  { stem: 'serif-italic', name: FONT.serif, weight: 400, style: 'italic' },
]
const SUBSETS = ['latin', 'latin-ext'] as const
/**
 * Extra single-subset instances: Martian Mono at wght 500 for the OVERFLIGHT lockup (as the HUD
 * wordmark). ASCII only, so latin is enough (built by scratch/polish/fix-share/build-lockup-font.py).
 */
const EXTRA: { file: string; name: string; weight: Weight; style: 'normal' | 'italic' }[] = [
  { file: 'mono-medium-latin.ttf', name: FONT.mono, weight: 500, style: 'normal' },
]

async function readFont(file: string): Promise<ArrayBuffer> {
  const registered = bundled(`_fonts/${file}`) // a Worker's copy (bundled.ts)
  if (registered instanceof ArrayBuffer) return registered
  let buf: Buffer
  try {
    buf = await readFile(fileURLToPath(new URL(`../_fonts/${file}`, import.meta.url)))
  } catch {
    buf = await readFile(path.join(process.cwd(), 'api', '_fonts', file))
  }
  // Hand satori an exact ArrayBuffer (Node may pool small Buffers into a larger one).
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
}

let cached: Promise<SatoriFont[]> | null = null

/** All card fonts, read once per warm instance. Latin first so it wins over latin-ext. */
export function loadFonts(): Promise<SatoriFont[]> {
  cached ??= Promise.all([
    ...SUBSETS.flatMap((subset) =>
      FILES.map(async (f) => ({ name: f.name, weight: f.weight, style: f.style, data: await readFont(`${f.stem}-${subset}.ttf`) })),
    ),
    ...EXTRA.map(async (f) => ({ name: f.name, weight: f.weight, style: f.style, data: await readFont(f.file) })),
  ]).catch((err) => {
    cached = null // don't pin a transient failure for the life of the instance
    throw err
  })
  return cached
}
