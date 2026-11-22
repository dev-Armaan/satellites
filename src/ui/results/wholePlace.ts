/**
 * The headline's place kept on one line where it fits on one: «New York», «São Paulo», «Нью-Йорк», «न्यू यॉर्क» never
 * end one line and start the next.
 *
 * Why a measurement and not a rule on the name: the headline is balanced (`text-wrap: balance`), and at phone widths
 * the balance point fell inside a two- or three-word serif name in every language («… observaron Ciudad / de México.»,
 * «… New / Delhi को»). Whether a name is short is a question of its width against the headline's, not of its letters:
 * «Rio de Janeiro» fits a 390 px phone's headline line but «Saint Petersburg, Russia» in the serif may not, and the
 * same name is narrower in a Latin face than in Devanagari. So where the balance splits the place, the place (with
 * what a no-break space or no space at all ties to it: «.», «\u00a0को», «。») is set `white-space: nowrap`, measured,
 * and let wrap again only where that run is wider than the headline's line: a name that cannot fit one line breaks as
 * before, inside itself, and never overflows. A headline that does not split its place is not touched.
 *
 * Measured before the first paint (a layout effect) and again when the headline's width changes (a zero-height ruler
 * at its end is observed, so this change of the headline's height never re-enters the observer), when the window is
 * resized (a media query can change the headline's size and not its width) or a web font arrives. The flag is a data attribute React does not own, so a re-render never clears it.
 */
import { useLayoutEffect, type RefObject } from 'react'
import { heldAfter, heldBefore } from '@/i18n/Rich'

/** The attribute that sets the place `white-space: nowrap` (results.module.css `.serif[data-whole]`). */
const WHOLE = 'whole'

/** The width of the place and the text tied to it on either side, set on one line. */
function runWidth(place: HTMLElement): number {
  const range = document.createRange()
  range.selectNodeContents(place)
  const prev = place.previousSibling
  const next = place.nextSibling
  if (prev?.nodeType === Node.TEXT_NODE) {
    const t = (prev as Text).data
    const b = heldBefore(t)
    if (b > 0) range.setStart(prev, t.length - b)
  }
  if (next?.nodeType === Node.TEXT_NODE) {
    const a = heldAfter((next as Text).data)
    if (a > 0) range.setEnd(next, a)
  }
  const rects = [...range.getClientRects()].filter((r) => r.width > 0)
  if (!rects.length) return 0
  return Math.max(...rects.map((r) => r.right)) - Math.min(...rects.map((r) => r.left))
}

/** The place's text sits on more than one line. */
function split(place: HTMLElement): boolean {
  const tops = new Set<number>()
  for (const r of place.getClientRects()) if (r.width > 0) tops.add(Math.round(r.top))
  return tops.size > 1
}

/**
 * Keep `place` whole where the balance splits it and it fits the line of `line` (its content box). A place that is not
 * split is left alone: Chrome's balance moves other breaks when a run is set nowrap even where it never broke inside it
 * (English «…watched / Ho Chi Minh City.» became «…satellites / watched Ho Chi Minh City.» at 390 px).
 */
export function fitWholePlace(line: HTMLElement, place: HTMLElement): void {
  delete place.dataset[WHOLE]
  if (!split(place)) return
  place.dataset[WHOLE] = ''
  const cs = getComputedStyle(line)
  const room = line.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
  // Half a pixel for subpixel rounding: a run exactly as wide as the line fits it.
  if (runWidth(place) > room + 0.5) delete place.dataset[WHOLE]
}

/**
 * Keeps the place in `ref`'s headline whole while it fits one line. `ruler`: an empty block at the headline's end
 * (its width is the line's, its height zero). `key`: the headline's text, so a new sentence is measured again.
 */
export function useWholePlace(ref: RefObject<HTMLElement | null>, ruler: RefObject<HTMLElement | null>, placeSelector: string, key: string) {
  useLayoutEffect(() => {
    const line = ref.current
    if (!line) return
    const fit = () => {
      const place = line.querySelector<HTMLElement>(placeSelector)
      if (place) fitWholePlace(line, place)
    }
    fit()
    let width = ruler.current?.getBoundingClientRect().width
    const ro =
      typeof ResizeObserver === 'undefined' || !ruler.current
        ? undefined
        : new ResizeObserver(([e]) => {
            if (e.contentRect.width === width) return
            width = e.contentRect.width
            fit()
          })
    if (ro && ruler.current) ro.observe(ruler.current)
    const fonts = typeof document !== 'undefined' ? document.fonts : undefined
    fonts?.addEventListener?.('loadingdone', fit)
    // The headline's size can change while its width does not (a laptop window crossing 860 px tall: 34 -> 28 px at the
    // same 382 px line), and no observer sees that; the viewport's resize does, before the frame is painted.
    window.addEventListener('resize', fit)
    return () => {
      ro?.disconnect()
      fonts?.removeEventListener?.('loadingdone', fit)
      window.removeEventListener('resize', fit)
    }
  }, [ref, ruler, placeSelector, key])
}
