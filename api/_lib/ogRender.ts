/**
 * Draw a card as a PNG: satori lays the element out and turns its text into outlines (HarfBuzz shapes it), and
 * resvg rasterises that SVG at the card's width.
 *
 * Why not the `ImageResponse` of @vercel/og, which did this before: it only runs on Node (its bundled HarfBuzz
 * looks for hb.wasm through `fs` and `__dirname`), and it switches to sharp whenever sharp is installed, so the
 * pixels depended on the machine. A Cloudflare Worker may only run WebAssembly it bundled at deploy time, so the
 * WebAssembly comes from `bundled()` when the Worker registered it and from `node_modules` otherwise (tests,
 * scripts), and resvg draws every card: the Worker and a local run produce the same bytes. satori and resvg are
 * pinned to the versions that package shipped at 1.0.3, so the layout of every card stays as it was.
 */
import type { ReactElement } from 'react'
import satori, { init as initSatori } from 'satori/standalone'
import { Resvg, initWasm as initResvg } from '@resvg/resvg-wasm'
import { bundled } from './bundled.js'
import { loadFallbackAsset, mergeShared } from './fallbackFonts.js'
import type { SatoriFont } from './fonts.js'

/**
 * The Worker's registered copy (compiled at deploy time), else the .wasm file from node_modules: resolved from this
 * module, or from the working directory when a test runner has moved the compiled module.
 */
async function wasm(key: string, specifier: string): Promise<WebAssembly.Module | Uint8Array | ArrayBuffer> {
  const registered = bundled(key)
  if (registered) return registered
  const [{ readFile }, { createRequire }, { default: path }] = await Promise.all([import('node:fs/promises'), import('node:module'), import('node:path')])
  let file: string
  try {
    file = createRequire(import.meta.url).resolve(specifier)
  } catch {
    file = path.join(process.cwd(), 'node_modules', specifier)
  }
  return readFile(file)
}

let ready: Promise<void> | null = null

/** Once per instance, on the first card (not at startup: a Worker has one second to start). */
function init(): Promise<void> {
  ready ??= (async () => {
    const [yoga, resvg] = await Promise.all([wasm('wasm/yoga', 'satori/yoga.wasm'), wasm('wasm/resvg', '@resvg/resvg-wasm/index_bg.wasm')])
    await Promise.all([initSatori(yoga), initResvg(resvg)])
  })().catch((err: unknown) => {
    ready = null
    throw err
  })
  return ready
}

export interface RenderOptions {
  width: number
  height: number
  fonts: SatoriFont[]
}

/**
 * satori's SVG of a card. A card its own fonts draw whole is laid out once. A card with characters they lack (a place
 * in Japanese or Arabic, an emoji) is laid out twice: the first pass only learns what is missing, by satori's own
 * script detection (per text node, under the card's `lang`), and the card is then drawn from a font list of its own,
 * its fonts plus the Noto subsets fetched for those characters (fallbackFonts.ts), with any emoji as pictures.
 *
 * Why not hand satori the subsets while it lays the card out (`loadAdditionalAsset` answering with fonts): it adds them
 * to the font loader it keeps for the card's font list, for the life of the instance, and every card shares one of two
 * lists (fonts.ts). Each Chinese, Japanese or Korean card left its subsets there for good, each with a HarfBuzz copy in
 * WebAssembly memory once used; every later card's lookups walked them all, and an English card's Han took the forms
 * of whichever language's card came first. A list of a card's own is let go (satori keeps the loaders of its last 8
 * lists, and the subsets' cache is bounded: fallbackFonts.ts), and a card looks the same whatever was drawn before it.
 * Measured on 1,500 cards that each lacked three new Han characters (stand-in subsets, smaller than Google's): with one
 * shared list the heap grew 50 MB and the layouts slowed from 3 to 6 ms a card; with a list per card it stays near
 * 25 MB and 2 ms. The first pass costs ~15–20 ms beside resvg's ~300 ms.
 */
export async function cardSvg(element: ReactElement, { width, height, fonts }: RenderOptions): Promise<string> {
  await init()
  const missing: { code: string; text: string }[] = []
  const first = await satori(element, {
    width,
    height,
    fonts,
    loadAdditionalAsset: async (code, text) => {
      missing.push({ code, text })
      return [] // nothing is added to the shared list's loader
    },
  })
  if (!missing.length) return first
  const own: SatoriFont[] = []
  const graphemeImages: Record<string, string> = {}
  const asks = mergeShared(missing) // a Hindi card's danda joins its Devanagari
  const assets = await Promise.all(asks.map(({ code, text }) => loadFallbackAsset(code, text)))
  for (const [i, asset] of assets.entries()) {
    if (typeof asset === 'string') graphemeImages[asks[i].text] = asset
    else own.push(...asset)
  }
  if (!own.length && !Object.keys(graphemeImages).length) return first // nothing could be loaded: the boxes stay
  // No loadAdditionalAsset: whatever is still missing (a subset that failed) is drawn as a box, never added to a list.
  return satori(element, { width, height, fonts: [...fonts, ...own], graphemeImages })
}

export async function renderCardPng(element: ReactElement, options: RenderOptions): Promise<Uint8Array> {
  const svg = await cardSvg(element, options)
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: options.width } })
  const image = resvg.render()
  try {
    return image.asPng()
  } finally {
    image.free()
    resvg.free()
  }
}
