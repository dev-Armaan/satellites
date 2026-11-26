/**
 * A page as the Worker hands it to a reader (a search engine or an assistant, src/lib/reader.ts): the same file with
 * the app taken out. No loading screen, the page's own text shown, and no script, so nothing has to be fetched or
 * run before the text is there.
 *
 * Why in the Worker, when the app already steps aside for a reader in the browser (src/main.tsx): that only happens
 * once the app's scripts have loaded, 28 files on a place page, and until then the text is `display: none` under the
 * loading screen. Two things went wrong with that in the first week of place pages (Cloudflare's numbers for
 * Googlebot, 2026-11-13 to 26):
 *  - more than half of what Googlebot fetched was the app, not pages (1,722 requests for files under /assets/ against
 *    1,328 for place pages), and each deploy renames those files, so it had 268 different scripts to its name, every
 *    one an address it crawled and will never index, while 1,100 place pages still waited to be crawled;
 *  - a page read before a deploy and rendered after it asks for scripts that are gone (a whole set of 404s on
 *    2026-11-23). What the renderer has then is the loading screen and "Slow connection, still loading".
 * A reader's copy needs neither: the text is in the file every visitor gets, and this only takes away what hides it.
 *
 * What goes: `data-boot` (index.html hides the text while it is set), the loading screen (#boot-static, whose words
 * are not the page's), every script but the page's JSON-LD, and the head's hints to fetch the app's files (module
 * preloads, the globe's textures, the catalog, the archives' hosts). The body gets `doc-page`, as the list of
 * places has: the page scrolls as a document (src/styles/static.css). The head's title, description, canonical
 * link, card and JSON-LD stay as they are, and so do the stylesheets.
 *
 * Pure, and it never throws: a page it does not know (no text under the app, as in a dev build; the list of places;
 * a file whose shape has changed) gives null, and the caller serves the file as it is. scripts/build-seo.ts makes
 * one of each page it writes, so a change to index.html that breaks this fails the build, not the pages.
 */

const HTML_TAG = /<html\b[^>]*>/i
const BODY_TAG = /<body\b([^>]*)>/i
const BOOT_ATTR = /\sdata-boot(?:="[^"]*")?/
/** The text the build wrote under the app (src/seo/pages.ts withRoot). */
const TEXT = /<div id="root">\s*<main class="doc"/
const LOADING_SCREEN = '<div id="boot-static"'
const SCRIPT = /[ \t]*<script\b([^>]*)>[\s\S]*?<\/script>\n?/gi
const KEPT_SCRIPT = /\btype="application\/ld\+json"/i
/** Hints to fetch what only the app uses. */
const FETCH_HINT = /[ \t]*<link\b[^>]*\brel="(?:modulepreload|preload|preconnect)"[^>]*>\n?/gi

/** `html` without the `<div …>` that starts with `open` and everything in it; null when it is not there or never closes. */
function withoutDiv(html: string, open: string): string | null {
  const start = html.indexOf(open)
  if (start < 0) return null
  const tag = /<(\/?)div\b/g
  tag.lastIndex = start
  let depth = 0
  for (let m = tag.exec(html); m; m = tag.exec(html)) {
    depth += m[1] ? -1 : 1
    if (depth > 0) continue
    const end = html.indexOf('>', m.index)
    return end < 0 ? null : html.slice(0, start) + html.slice(end + 1)
  }
  return null
}

/** The page for a reader, or null when `html` is not a page with its text under the app. */
export function readerPage(html: string): string | null {
  const root = HTML_TAG.exec(html)
  if (!root || !BOOT_ATTR.test(root[0]) || !TEXT.test(html) || !BODY_TAG.test(html)) return null
  const bare = html.includes(LOADING_SCREEN) ? withoutDiv(html, LOADING_SCREEN) : html
  if (bare === null) return null
  return bare
    .replace(HTML_TAG, (tag) => tag.replace(BOOT_ATTR, ''))
    .replace(BODY_TAG, (tag, attrs: string) => (/\bclass="/.test(attrs) ? tag.replace(/\bclass="/, 'class="doc-page ') : `<body${attrs} class="doc-page">`))
    .replace(SCRIPT, (script, attrs: string) => (KEPT_SCRIPT.test(attrs) ? script : ''))
    .replace(FETCH_HINT, '')
}

/**
 * Whether `page` is a reader's page as it must be: its text shown, nothing left of the app. The build asks this of
 * what `readerPage` made from the pages it has just written.
 */
export function isReaderPage(page: string | null): page is string {
  if (page === null) return false
  const scripts = [...page.matchAll(SCRIPT)].filter((m) => !KEPT_SCRIPT.test(m[1]))
  return !BOOT_ATTR.test(HTML_TAG.exec(page)?.[0] ?? ' data-boot') && TEXT.test(page) && !page.includes(LOADING_SCREEN) && scripts.length === 0 && page.search(FETCH_HINT) < 0 && /<body\b[^>]*\bclass="[^"]*\bdoc-page\b/.test(page)
}
