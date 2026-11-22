/**
 * GET /api/og — the 1200×630 share card (JPEG, R2SH4: satori draws a PNG, which is re-encoded as a
 * JPEG under 250 KB, because WhatsApp drops link previews whose image is much over ~300 KB).
 *
 *   /api/og?id=<shareId>          a stored share (read via get_share, without counting a view)
 *   /api/og?place=…&lat=…&…       explicit parameters (see shareFromParams), no database needed
 *   /api/og?kind=place&place=…&lat=…&lon=…   an address-bar link (no pass): the default card
 *   /api/og?kind=summary&q=…&n=…&sv=…&sc=…   a week's summary (SH6, R3-13): N watched, K photos, the closest look
 *   /api/og                       the default card, also baked into public/og-default.png
 *
 * Every card is built from the shared spec (api/_lib/cardSpec.ts), the same one the app's preview and
 * PNG use. The left square is the real archived crop, fetched server-side from Planetary Computer /
 * NASA GIBS and embedded. If the archive is slow or has nothing, the card draws the pass geometry
 * instead and is cached briefly so a later request can pick the image up.
 *
 * Runs on Node (tests and scripts; fonts and the default plate are read from api/_fonts, api/_assets) and in the Cloudflare
 * Worker, which registers its bundled copies of them (api/_lib/bundled.ts).
 *
 * Every card is drawn in the language its URL names (`l=<locale>`, the sharer's: api/s.ts writes it into og:image
 * for any language but English), English otherwise; an English card is byte for byte what it always was.
 *
 * Except a right-to-left language: satori shapes Arabic (HarfBuzz) but has no bidirectional layout, so an Arabic
 * headline came out with its words in reverse order and its numbers misplaced. Those links unfurl with the English
 * card (the share page itself, HTML, is in Arabic; the PNG the app saves is drawn by the browser, which lays Arabic
 * out properly). `cardLocale` (api/_lib/share.ts) is the one place that decides it.
 *
 * A Meteosat frame's picture comes from EUMETSAT's map service, which asked on 2026-11-17 to be spared the site's
 * visitors (CLAUDE.md). So only a STORED share may be drawn with one: create_share's limits bound how many of those
 * there are. A card drawn from its address alone names any layer, place and time it likes, at no cost to the
 * sender, and each one used to be a request to EUMETSAT: such a card is drawn without the picture ("the image is in
 * the app"), as final. A stored share's frame is asked for once per cache entry and never again: an answer that is
 * no picture (EUMETSAT answers 502 for a frame it no longer has) is final too, where every other archive's miss is
 * tried again after five minutes.
 */
import { decode as decodePng } from 'fast-png'
import { encode as encodeJpeg } from 'jpeg-js'
import { CARD_H, CARD_W, PLATE, defaultCard, defaultPlateDataUri, shareCard } from './_lib/card.js'
import * as cardMeasure from './_lib/cardMeasure.js'
import { buildCardSpec, buildSummarySpec, provideCardMeasure, type CardSpec, type Locale } from './_lib/cardSpec.js'
import { displayHost, siteOrigin } from './_lib/env.js'
import { cardFonts } from './_lib/fonts.js'
import { textOf } from './_lib/h.js'
import { DEFAULT_LOCALE } from './_lib/i18n/locales.js'
import { renderCardPng } from './_lib/ogRender.js'
import { asksEumetsat, cropPlan, fetchCropPicture, isMeteosatFrame } from './_lib/imagery.js'
import { SHARE_ID_RE, cardInputFromShare, cardLocale, fetchShare, linkLocale, shareFromParams, shareTimeZone, summaryFromParams, type ShareRecord } from './_lib/share.js'

export { cardLocale }

// The card's headline measure (its width tables), handed to cardSpec up front: the server card has it synchronously.
provideCardMeasure(cardMeasure)

/** PC renders a 630² crop in 1–3 s, occasionally much longer; stay well inside maxDuration. */
const IMAGE_TIMEOUT_MS = 9000

const CACHE = {
  /** Shares are immutable once written: cache hard at the edge. */
  final: 'public, max-age=86400, s-maxage=31536000, stale-while-revalidate=604800',
  /** Rendered without the image (archive slow/down) or share not found: retry soon. */
  degraded: 'public, max-age=300, s-maxage=300',
  default: 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800',
} as const

/** Link previews stay under this (WhatsApp shows none for an og:image much over ~300 KB). */
export const OG_MAX_BYTES = 250_000
const JPEG_QUALITY = [80, 70] as const

/**
 * Satori's PNG as a baseline JPEG: quality 80, or 70 if that is still over OG_MAX_BYTES. The card is
 * flat ink with type and one photograph; at 80 the type's edges stay clean (no visible blocking at
 * 100 %). Measured: Sentinel-2 over a city 208 KB, clouded 133 KB, Landsat 158 KB, MODIS 83 KB, the
 * default card 153 KB; the step adds ~100–150 ms to a render.
 */
export function pngToJpeg(png: ArrayBuffer | Uint8Array): Uint8Array<ArrayBuffer> {
  const img = decodePng(png instanceof Uint8Array ? png : new Uint8Array(png))
  const { width, height } = img
  const px = width * height
  let rgba: Uint8Array
  if (img.palette) {
    // Indexed colour: expand through the palette (satori/resvg don't emit it, but don't trust that).
    const out = new Uint8Array(px * 4)
    const idx = img.data
    for (let i = 0; i < px; i++) {
      const c = img.palette[idx[i]] ?? [0, 0, 0]
      out[i * 4] = c[0]
      out[i * 4 + 1] = c[1]
      out[i * 4 + 2] = c[2]
      out[i * 4 + 3] = 255
    }
    rgba = out
  } else {
    const ch = img.channels
    const shift = img.depth === 16 ? 8 : 0
    const src = img.data
    const out = new Uint8Array(px * 4)
    for (let i = 0; i < px; i++) {
      const o = i * 4
      const j = i * ch
      if (ch >= 3) {
        out[o] = src[j] >> shift
        out[o + 1] = src[j + 1] >> shift
        out[o + 2] = src[j + 2] >> shift
      } else {
        out[o] = out[o + 1] = out[o + 2] = src[j] >> shift // grey (± alpha)
      }
      out[o + 3] = 255 // the card is opaque; JPEG has no alpha
    }
    rgba = out
  }
  let jpeg = encodeJpeg({ data: rgba, width, height }, JPEG_QUALITY[0]).data
  if (jpeg.byteLength >= OG_MAX_BYTES) jpeg = encodeJpeg({ data: rgba, width, height }, JPEG_QUALITY[1]).data
  return new Uint8Array(jpeg.buffer as ArrayBuffer, jpeg.byteOffset, jpeg.byteLength)
}

/**
 * The lossless PNG of a card (the JPEG's source; also what scripts/backend-render-og.ts bakes og-default.png from), in
 * the fonts its language and its words need (a card that prints no Cyrillic reads none of the Cyrillic files).
 */
async function renderPng(element: ReturnType<typeof defaultCard>, locale: Locale): Promise<Uint8Array> {
  return renderCardPng(element, { width: CARD_W, height: CARD_H, fonts: await cardFonts(locale, textOf(element)) })
}

async function render(element: ReturnType<typeof defaultCard>, locale: Locale, cacheControl: string, status = 200): Promise<Response> {
  const jpeg = pngToJpeg(await renderPng(element, locale))
  return new Response(jpeg, {
    status,
    headers: {
      'content-type': 'image/jpeg',
      'cache-control': cacheControl,
      'x-content-type-options': 'nosniff',
    },
  })
}

/**
 * The default (root link) card as a lossless PNG, for baking public/og-default.png (R3-15): the bake starts
 * from satori's own pixels, not from the JPEG /api/og serves.
 */
export async function defaultCardPng(host: string): Promise<Uint8Array> {
  return renderPng(defaultCard({ host, plateDataUri: await defaultPlateDataUri() }), DEFAULT_LOCALE)
}

type CardImage =
  | { kind: 'image'; dataUri: string; complete: boolean } // complete: false = toned without its cloud mask (retry soon)
  | { kind: 'none' } //      not an imaged share: the geometry plate is the design
  | { kind: 'permanent' } // imaged, but no capture or one that can't be cropped here (final)
  | { kind: 'transient' } // the archive was slow or failed just now (retry soon)

/** `stored`: the share was read from the database (an id), not built from the address. */
async function cardImage(share: ShareRecord, stored: boolean): Promise<CardImage> {
  if (share.verdict !== 'imaged') return { kind: 'none' }
  // On the place's grid, as the app cut its photo and card (the grid follows from the rounded place alone).
  const plan = share.capture ? cropPlan(share.capture, share.lat, share.lon, PLATE) : null
  if (!plan) return { kind: 'permanent' }
  if (asksEumetsat(plan)) {
    // EUMETSAT is asked only for a stored share's real frame, once (see the top of this file).
    if (!stored || !isMeteosatFrame(share.capture!.itemId, Date.now())) return { kind: 'permanent' }
    const pic = await fetchCropPicture(plan.url, IMAGE_TIMEOUT_MS)
    return pic ? { kind: 'image', ...pic } : { kind: 'permanent' }
  }
  const pic = await fetchCropPicture(plan.url, IMAGE_TIMEOUT_MS)
  return pic ? { kind: 'image', ...pic } : { kind: 'transient' }
}

/** A week's summary: the closest look's crop (when it has one) beside "N satellites watched … K images were made public." */
async function renderSummary(q: URLSearchParams, host: string, locale: Locale): Promise<Response | null> {
  const sum = summaryFromParams(q)
  if (!sum) return null
  const spec = buildSummarySpec({ ...sum, timeZone: shareTimeZone(sum), host }, locale)
  const cap = sum.best?.capture
  // A summary is drawn from its address: never with a picture from EUMETSAT (the app's summaries lead with a
  // Sentinel-2 / Landsat photo or a daily mosaic, so no real one names a Meteosat frame).
  const planned = cap ? cropPlan(cap, sum.lat, sum.lon, PLATE) : null
  const plan = planned && !asksEumetsat(planned) ? planned : null
  const pic = plan ? await fetchCropPicture(plan.url, IMAGE_TIMEOUT_MS) : null
  return render(shareCard({ spec, image: pic ? { dataUri: pic.dataUri } : null }), locale, plan && !pic?.complete ? CACHE.degraded : CACHE.final)
}

async function renderDefault(host: string, cache: string, locale: Locale): Promise<Response> {
  return render(defaultCard({ host, plateDataUri: await defaultPlateDataUri(), locale }), locale, cache)
}

export async function handleOg(request: Request): Promise<Response> {
  // A card is read, never posted to (the router turns a HEAD into the GET it stands for and caches both as one).
  if (request.method !== 'GET') return new Response(null, { status: 405, headers: { allow: 'GET, HEAD', 'cache-control': 'no-store' } })
  const url = new URL(request.url)
  const host = displayHost(siteOrigin(request))
  const locale = cardLocale(linkLocale(url.searchParams))
  try {
    let share: ShareRecord | null = null
    let degraded = false
    const id = url.searchParams.get('id')
    if (id !== null) {
      if (SHARE_ID_RE.test(id)) {
        const r = await fetchShare(id)
        if (r.status === 'found') share = r.share
        else degraded = true
      } else degraded = true
    } else if (url.searchParams.get('kind') === 'summary') {
      const res = await renderSummary(url.searchParams, host, locale)
      if (res) return res
    } else if (url.searchParams.get('kind') !== 'place') {
      share = shareFromParams(url.searchParams)
    }

    // No pass to draw (the root link, an address-bar place link, a missing share): the default card,
    // whose real photograph and invitation suit any place.
    if (!share) return await renderDefault(host, degraded ? CACHE.degraded : CACHE.default, locale)

    const img = await cardImage(share, id !== null)
    const spec: CardSpec = buildCardSpec(cardInputFromShare(share, host, img.kind === 'permanent' ? 'permanent' : undefined), locale)
    // Only a transient archive miss (or a plate toned without its cloud mask) is worth re-rendering soon; everything
    // else is final.
    const cache = degraded || img.kind === 'transient' || (img.kind === 'image' && !img.complete) ? CACHE.degraded : CACHE.final
    return await render(shareCard({ spec, image: img.kind === 'image' ? { dataUri: img.dataUri } : null }), locale, cache)
  } catch (err) {
    console.error('[og] render failed', err)
    try {
      return await renderDefault(host, CACHE.degraded, locale)
    } catch {
      return new Response('card unavailable', { status: 500, headers: { 'cache-control': 'no-store' } })
    }
  }
}
