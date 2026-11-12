/**
 * Cloudflare Worker entry (migration spike: share cards only).
 *
 * The handlers in api/ already take a Request and return a Response, so the Worker only has to hand them the files
 * Node would read from disk: the card fonts, the default plate and the WebAssembly the renderer runs. They are
 * imported here, which makes wrangler bundle them (fonts and images as bytes, WebAssembly compiled), and registered
 * before the first request (api/_lib/bundled.ts).
 */
import yoga from '../node_modules/satori/yoga.wasm'
import resvg from '../node_modules/@resvg/resvg-wasm/index_bg.wasm'
import displayLatin from '../api/_fonts/display-latin.ttf'
import displayLatinExt from '../api/_fonts/display-latin-ext.ttf'
import sansLatin from '../api/_fonts/sans-latin.ttf'
import sansLatinExt from '../api/_fonts/sans-latin-ext.ttf'
import monoLatin from '../api/_fonts/mono-latin.ttf'
import monoLatinExt from '../api/_fonts/mono-latin-ext.ttf'
import monoMediumLatin from '../api/_fonts/mono-medium-latin.ttf'
import serifItalicLatin from '../api/_fonts/serif-italic-latin.ttf'
import serifItalicLatinExt from '../api/_fonts/serif-italic-latin-ext.ttf'
import plate from '../api/_assets/og-default-plate.jpg'
import { registerBundled } from '../api/_lib/bundled.js'
import { handleOg } from '../api/og.tsx'

registerBundled({
  'wasm/yoga': yoga,
  'wasm/resvg': resvg,
  '_fonts/display-latin.ttf': displayLatin,
  '_fonts/display-latin-ext.ttf': displayLatinExt,
  '_fonts/sans-latin.ttf': sansLatin,
  '_fonts/sans-latin-ext.ttf': sansLatinExt,
  '_fonts/mono-latin.ttf': monoLatin,
  '_fonts/mono-latin-ext.ttf': monoLatinExt,
  '_fonts/mono-medium-latin.ttf': monoMediumLatin,
  '_fonts/serif-italic-latin.ttf': serifItalicLatin,
  '_fonts/serif-italic-latin-ext.ttf': serifItalicLatinExt,
  '_assets/og-default-plate.jpg': plate,
})

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname === '/api/og') return handleOg(request)
    return new Response('not found', { status: 404 })
  },
}
