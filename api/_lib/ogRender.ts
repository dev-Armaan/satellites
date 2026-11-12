/**
 * Draw a card as a PNG: satori lays the element out and turns its text into outlines (HarfBuzz shapes it), and
 * resvg rasterises that SVG at the card's width.
 *
 * Why not @vercel/og's `ImageResponse`, which did this before: it only runs on Node (its bundled HarfBuzz looks
 * for hb.wasm through `fs` and `__dirname`), and it switches to sharp whenever sharp is installed, so the pixels
 * depended on the host. Calling satori and resvg directly lets a Cloudflare Worker draw the same cards, and resvg
 * draws every card, so the bytes no longer depend on the host. satori and resvg are pinned to the versions
 * @vercel/og 1.0.3 shipped, so the layout of every card stays as it was.
 */
import type { ReactElement } from 'react'
import satori, { init as initSatori } from 'satori/standalone'
import { Resvg, initWasm as initResvg } from '@resvg/resvg-wasm'
import { loadFallbackAsset } from './fallbackFonts.js'
import type { SatoriFont } from './fonts.js'

/** A .wasm file from node_modules; else the copy vercel.json ships (`includeFiles`) where the function runs. */
async function wasm(specifier: string): Promise<Uint8Array> {
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

/** Once per instance, on the first card. */
function init(): Promise<void> {
  ready ??= (async () => {
    const [yoga, resvg] = await Promise.all([wasm('satori/yoga.wasm'), wasm('@resvg/resvg-wasm/index_bg.wasm')])
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

export async function renderCardPng(element: ReactElement, { width, height, fonts }: RenderOptions): Promise<Uint8Array> {
  await init()
  const svg = await satori(element, { width, height, fonts, loadAdditionalAsset: loadFallbackAsset })
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: width } })
  const image = resvg.render()
  try {
    return image.asPng()
  } finally {
    image.free()
    resvg.free()
  }
}
