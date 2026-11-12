/**
 * Cloudflare Worker entry: the whole site, as Vercel serves it from vercel.json and api/.
 *
 * The handlers in api/ already take a Request and return a Response, so the Worker routes to them (router.ts) and
 * hands them the files Node would read from disk: the card fonts, the default plate and the WebAssembly the
 * renderer runs. Those are imported here, which makes wrangler bundle them (fonts and images as bytes, WebAssembly
 * compiled), and registered before the first request (api/_lib/bundled.ts). Static files come from `dist/`
 * through the ASSETS binding (wrangler.jsonc).
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
import { handleEvents } from '../api/e.ts'
import { handleOg } from '../api/og.tsx'
import { handlePan } from '../api/pan.ts'
import { handleSharePage } from '../api/s.ts'
import { route, type Routes } from './router.ts'

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

interface Env {
  ASSETS: Routes['assets']
}

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    return route(request, { assets: env.ASSETS, og: handleOg, share: handleSharePage, events: handleEvents, pan: handlePan })
  },
}
