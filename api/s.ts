/**
 * GET /s/:id  (worker/router.ts rewrites it to /api/s?id=:id)
 *
 * The URL people paste into X / iMessage / Slack. Unfurlers get real Open Graph tags for the
 * shared pass, with og:image pointing at the /api/og card; people are sent straight on to the
 * app at /?s=<id> (meta refresh + location.replace), which reopens the pass.
 *
 *   found        → 200, specific title/description/card, cached at the edge for a day
 *   not found    → 404, generic tags, people go to the landing page
 *   db unreachable → 200, generic tags but the card URL still names the share, cached briefly
 *
 * Place mode (share SH7): an address-bar link, /?q=43.47,-80.54&n=Waterloo, fetched by a link
 * unfurler (worker/router.ts sends only bot user agents here; people get the app). Title "What
 * watched Waterloo this week", the card at /api/og?kind=place…, coordinates coarsened to 0.01°,
 * and people who land here anyway are handed to the same address in the app.
 *
 * Pass links (share R2SH2): the app's fallback link for a pass (made when no short link exists yet)
 * carries the pass itself (sat, norad, verdict, t, alt, off, hdg, collection, item, cloud, gsd, spot).
 * It unfurls as that pass: its headline, description and card (/api/og with the explicit parameters),
 * with no database row.
 *
 * Summary links (SH6, R3-13): a week at a place, its numbers carried in the link. Title "31 satellites watched
 * Waterloo this week.", description "12 images were made public. …", as the results headline says it.
 *
 * Cards from /api/og are JPEG (og:image:type image/jpeg, R2SH4); the static default card is a PNG.
 *
 * Language (`l=<locale>`, written by the app only when the sharer's language is not English): the page's title,
 * description, image alt and <html lang dir> are in it, and so is every card URL it writes (the card carries the
 * same `l`). An unknown or missing `l` reads English, and an English page is exactly what it always was (the static
 * default card included). The people the page hands on are not given `l`: the app speaks their browser's language.
 */
import { siteOrigin } from './_lib/env.js'
import { sharePageHtml } from './_lib/html.js'
import { cardMessages } from './_lib/i18n/card/index.js'
import { DEFAULT_LOCALE, type Locale } from './_lib/i18n/locales.js'
import {
  CARD_VERSION,
  DEEP_LINK_PASS_KEYS,
  SHARE_ID_RE,
  SUMMARY_KEYS,
  description,
  fetchShare,
  headline,
  linkLocale,
  shareFromDeepLink,
  placeDescription,
  placeFromParams,
  placeTitle,
  summaryAlt,
  summaryDescription,
  summaryFromParams,
  summaryTitle,
} from './_lib/share.js'

/** The card's version, written into every card address (api/_lib/share.ts, where the card's cache key reads it). */
export { CARD_VERSION }

/** `l=<locale>` for a URL this page writes: nothing for English, so English URLs never change. */
function withLocale(p: URLSearchParams, locale: Locale): URLSearchParams {
  if (locale !== DEFAULT_LOCALE) p.set('l', locale)
  return p
}
const localeQuery = (locale: Locale, sep: '?' | '&') => (locale !== DEFAULT_LOCALE ? `${sep}l=${encodeURIComponent(locale)}` : '')

/** The generic page (the root link, a missing share): its words, and the default card in the page's language. */
function generic(origin: string, locale: Locale) {
  const m = cardMessages(locale)
  // English has the default card baked (public/og-default.png); another language renders it (/api/og, cached a week).
  const image =
    locale === DEFAULT_LOCALE
      ? { image: `${origin}/og-default.png`, imageType: 'image/png' as const }
      : { image: `${origin}/api/og?${new URLSearchParams({ v: CARD_VERSION, l: locale }).toString()}`, imageType: 'image/jpeg' as const }
  return { title: m.page.title, description: m.page.description, imageAlt: m.defaultAlt, locale, ...image }
}

/**
 * The card of a place with no pass named. An address-bar link to the place and the place's own page (/place/<slug>,
 * scripts/build-seo.ts) both unfurl into it, so the two share one render in the edge cache. The spot is rounded to
 * 0.01°, as every link's is, and the card speaks the page's language (English names none, so its URL never changes).
 */
export function placeCardUrl(origin: string, place: { label: string; lat: number; lon: number }, locale: Locale = DEFAULT_LOCALE): string {
  const card = withLocale(new URLSearchParams({ kind: 'place', place: place.label, lat: place.lat.toFixed(2), lon: place.lon.toFixed(2), v: CARD_VERSION }), locale)
  return `${origin}/api/og?${card.toString()}`
}

function html(body: string, status: number, cacheControl: string): Response {
  return new Response(body, {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': cacheControl,
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'strict-origin-when-cross-origin',
    },
  })
}

/** An address-bar link (`/?q=lat,lon&n=label[&p=passId]`) seen by a link unfurler. */
function placePage(q: URLSearchParams, origin: string): Response {
  const locale = linkLocale(q)
  const place = placeFromParams(q)
  if (!place) {
    return html(
      sharePageHtml({ ...generic(origin, locale), canonical: `${origin}/`, redirect: '/' }),
      200,
      'public, max-age=300, s-maxage=3600',
    )
  }
  const coords = `${place.lat.toFixed(2)},${place.lon.toFixed(2)}`
  const app = new URLSearchParams({ q: coords, n: place.label })
  const pass = q.get('p')
  if (pass && /^[0-9A-Za-z_.:-]{1,40}$/.test(pass)) app.set('p', pass)
  // A week's summary (SH6) rides in the link itself: its card shows the counts and the best look.
  const summary = summaryFromParams(q)
  // A pass's fallback link (R2SH2) carries the pass: unfurl it as that pass.
  const share = summary ? null : shareFromDeepLink(q)
  if (share) {
    const passKeys = DEEP_LINK_PASS_KEYS.flatMap((k) => (q.get(k) !== null ? [[k, q.get(k)!] as [string, string]] : []))
    for (const [k, v] of passKeys) app.set(k, v)
    const card = withLocale(new URLSearchParams([['place', share.placeLabel], ['lat', share.lat.toFixed(2)], ['lon', share.lon.toFixed(2)], ...passKeys, ['v', CARD_VERSION]]), locale)
    const title = headline(share, locale)
    return html(
      sharePageHtml({
        title,
        description: description(share, locale),
        canonical: `${origin}/?${withLocale(new URLSearchParams(app), locale).toString()}`,
        image: `${origin}/api/og?${card.toString()}`,
        imageType: 'image/jpeg',
        imageAlt: title,
        redirect: `/?${app.toString()}`,
        locale,
      }),
      200,
      'public, max-age=300, s-maxage=86400, stale-while-revalidate=604800',
    )
  }
  const card = summary
    ? `${origin}/api/og?${withLocale(new URLSearchParams({ kind: 'summary', q: coords, n: place.label, ...Object.fromEntries(SUMMARY_KEYS.flatMap((k) => (q.get(k) ? [[k, q.get(k)!]] : []))), v: CARD_VERSION }), locale).toString()}`
    : placeCardUrl(origin, place, locale)
  return html(
    sharePageHtml({
      title: summary ? summaryTitle(summary, locale) : placeTitle(place, locale),
      description: summary ? summaryDescription(summary, locale) : placeDescription(place, locale),
      canonical: `${origin}/?${withLocale(new URLSearchParams(app), locale).toString()}`,
      image: card,
      imageType: 'image/jpeg',
      imageAlt: summary ? summaryAlt(summary, locale) : cardMessages(locale).defaultAlt,
      redirect: `/?${app.toString()}`,
      locale,
    }),
    200,
    'public, max-age=300, s-maxage=86400, stale-while-revalidate=604800',
  )
}

export async function handleSharePage(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const origin = siteOrigin(request)
  const raw = url.searchParams.get('id') ?? ''
  const id = raw.trim().toLowerCase()

  if (!raw && url.searchParams.has('q')) return placePage(url.searchParams, origin)

  const locale = linkLocale(url.searchParams)
  if (!SHARE_ID_RE.test(id)) {
    return html(
      sharePageHtml({ ...generic(origin, locale), canonical: `${origin}/`, redirect: '/' }),
      404,
      'public, max-age=300, s-maxage=3600',
    )
  }

  const canonical = `${origin}/s/${id}${localeQuery(locale, '?')}`
  const redirect = `/?s=${id}`
  const card = `${origin}/api/og?id=${id}&v=${CARD_VERSION}${localeQuery(locale, '&')}`
  const r = await fetchShare(id)

  if (r.status === 'found') {
    const title = headline(r.share, locale)
    return html(
      sharePageHtml({ title, description: description(r.share, locale), canonical, image: card, imageType: 'image/jpeg', imageAlt: title, redirect, locale }),
      200,
      'public, max-age=300, s-maxage=86400, stale-while-revalidate=604800',
    )
  }
  if (r.status === 'missing') {
    return html(
      sharePageHtml({ ...generic(origin, locale), canonical: `${origin}/`, redirect: '/' }),
      404,
      'public, max-age=60, s-maxage=600',
    )
  }
  // Couldn't reach the database: don't 404 a link that may well be valid.
  const g = generic(origin, locale)
  return html(
    sharePageHtml({ ...g, canonical, image: card, imageType: 'image/jpeg', imageAlt: g.title, redirect }),
    200,
    'public, max-age=60, s-maxage=60',
  )
}
