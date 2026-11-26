/**
 * Readers that take a page as text: search engines and the assistants that fetch a page to index or quote it. For
 * them the page is its own text (the `.doc` the build writes into #root: src/seo/pages.ts), and the app never starts.
 *
 * Why not let them run the app, as a visitor does: a place page's results take the browser many seconds (a week of
 * orbits for ~400 satellites, then the archives), and a crawler's renderer does not wait. Google's took its picture
 * of /place/paris at 4.4 s (URL Inspection's live test, 2026-11-21): the computing panel, "PROPAGATING ORBITS ·
 * 173 / 395", with no heading, no sentence about the place and no link to another page. The text under the app has
 * all three, and it is what the same crawler already received in the HTML: this only stops the app replacing it.
 * It also spares the public archives a real search for every page a crawler renders.
 *
 * The text is true of the page whoever reads it (it states no count, and says the page computes the week in the
 * browser), so a reader is shown nothing a visitor is not told. A page with no text of its own (a dev build, a
 * build without scripts/build-seo.ts) starts the app for everyone.
 *
 * On the site the Worker goes one step further and hands a reader the page with the app already taken out
 * (worker/router.ts appPage, src/seo/readerPage.ts): the text then waits for no script. What is here still runs
 * wherever a reader is given the file as it is: `npm run dev`, a host with no Worker in front, a page the Worker
 * could not make a reader's copy of.
 *
 * Page testers (Lighthouse, headless Chrome) are not readers: they measure the app, so they get the app. The usage
 * stats leave both out (src/lib/telemetry.ts CRAWLER_RE).
 */

/**
 * By the name they give themselves. "bot" only before `/`, `;` or `)`, as in "Googlebot/2.1": a phone maker's name
 * ends in those letters. Google's live test names itself Google-InspectionTool, its other fetchers GoogleOther.
 */
export const READER_RE = /bot[/;)]|spider|crawl|slurp|inspectiontool|googleother/i

export const isReader = (userAgent: string | undefined | null): boolean => !!userAgent && READER_RE.test(userAgent)

/** The parts of the document this touches (named here so the rule is tested under Node, without a DOM). */
export interface ReaderDocument {
  documentElement: { removeAttribute(name: string): void }
  body: { classList: { add(name: string): void } }
  querySelector(selector: string): unknown
  getElementById(id: string): { remove(): void } | null
}

/**
 * Whether this load is a reader's: if so, the page's text is now the page (the loading screen is gone, the text
 * shows and the page scrolls as a document, like the list of places), and the caller must not start the app.
 */
export function showTextToReader(userAgent: string | undefined | null, doc: ReaderDocument): boolean {
  if (!isReader(userAgent) || !doc.querySelector('#root > .doc')) return false
  // index.html hides the text while `data-boot` is set and the loading screen is up (it must never be a visitor's
  // first content); a reader has no app to wait for.
  doc.documentElement.removeAttribute('data-boot')
  doc.getElementById('boot-static')?.remove()
  doc.body.classList.add('doc-page')
  return true
}
