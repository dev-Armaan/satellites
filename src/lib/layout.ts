/**
 * One definition of "stacked" (phone-like) layout, shared by JS. CSS can't import these: stylesheets copy the
 * query text by hand (see docs/DESIGN.md §4).
 *   stacked = width ≤ 760px, or portrait up to 1100px wide (portrait tablets)
 */
export const STACKED_QUERY = '(max-width: 760px), (orientation: portrait) and (max-width: 1100px)'
export const WIDE_QUERY = '(min-width: 761px) and (orientation: landscape), (min-width: 1101px)'
export const SHORT_LANDSCAPE_QUERY = '(orientation: landscape) and (max-height: 540px)'
export const isStacked = (w: number, h: number) => w <= 760 || (h > w && w <= 1100)

/**
 * The air every panel beside the globe (the results dock, the error card) and the landing's text leave between their
 * edge and the view they publish as free (store.uiInsets): an inset is this much wider than what it covers. One value,
 * because the HUD reads a panel's edge back from its inset (src/ui/hud/Hud.tsx useLanguageRoom).
 */
export const INSET_CLEAR = 24

/**
 * How long the results panel takes to leave (results/shell.ts useShellExit: it clips away toward its edge). The HUD
 * keeps its stepped-down language until then, so the name never runs under the panel on its way out.
 */
export const PANEL_EXIT_MS = 320
