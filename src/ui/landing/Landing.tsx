/**
 * <Landing onSubmit enterDelay/>: phases 'idle' and 'locating'. The hero, the place search, "Use my
 * location", curated example places and the maker's credit (on wide screens, a link to the code beside it), laid
 * out so the globe stays the hero:
 *
 *   wide            a text column on the left of the 12-column grid; the globe frames to its right.
 *                   When suggestions open, the copy fades and the field lifts to the headline's place,
 *                   so all five rows fit above the bottom readouts (Esc, blur or clearing puts it back).
 *   stacked         a compact ink panel in the bottom ~47%; the whole globe sits above it (decision 4).
 *                   Focusing the search lifts the field to the top, clear of the keyboard, over a
 *                   dimmed globe.
 *   short landscape copy in the right half, the globe on the left
 *
 * Narrow phones (≤ 400 px) offer "Use my location" as a labelled "Near me" chip at the head of the
 * example row, so the field keeps its full width for "Search a place".
 *
 * It publishes what it covers (store.uiInsets) so the camera frames the globe in what is left.
 *
 * Entrance (once per session): after `enterDelay` (the boot curtain), the window kicker scrambles once,
 * headline lines mask-wipe in on a 60 ms stagger, then the copy, the field and the chips. Later visits
 * (back from results) get one short rise of the whole column. Leaving (the app starts computing) plays
 * on a clone of the last frame, so the next view is live at once.
 *
 * Copy: the 'landing' namespace (src/i18n/en/landing.ts), and the curated places' names from 'places' (./curated.ts).
 */
import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from 'react'
import { flushSync } from 'react-dom'
import { Rich } from '@/i18n/Rich'
import enLanding from '@/i18n/en/landing'
import { useMsgs } from '@/i18n/runtime'
import { DUR, EASE } from '@/lib/ease'
import { SHORT_LANDSCAPE_QUERY, isStacked } from '@/lib/layout'
import { useBackLayer } from '@/lib/backStack'
import { useApp, type Phase } from '@/state/store'
import type { Place } from '@/types'
import {
  Glyph,
  Reveal,
  ScrambleOnce,
  cx,
  fmtLat,
  fmtLon,
  insertFrozenClone,
  animateOut,
  prefersReducedMotion,
  useExitClone,
  useIsMobile,
  useMediaQuery,
  useWallSecondSync,
} from '@/ui/system'
import { useSecondClock, useSecondDerived } from '@/ui/hud/clock'
import { balancePad } from './balance'
import { localizedPlace } from './curated'
import { EXAMPLE_PLACES, surprisePlace, type ExamplePlace } from './places'
import { SearchBox } from './SearchBox'
import { useLocate, type LocateState } from './useLocate'
import { WINDOW_DAYS, windowLabel } from './windowLabel'
import s from './Landing.module.css'

/**
 * The full entrance plays once per session, and only straight out of the boot screen. Every other
 * mount (back from results, an error, or a deep link's first "New search") gets the short rise: someone
 * who pressed Esc wants the field now, not a 1.7 s title sequence.
 */
let seen = false
/** The phase the app was in before the current one (tracked from module load, before any landing mounts). */
let previousPhase: Phase = useApp.getState().phase
useApp.subscribe((st, prev) => {
  if (st.phase !== prev.phase) previousPhase = prev.phase
})

/** Stacked: the ink panel starts this far above the column's first line (Landing.module.css .column::before). */
const PANEL_PAD_TOP = 22
/** Wide: the globe's point cloud keeps this much air from the end of the text. */
const TEXT_CLEAR = 24
/**
 * The chip row's trailing fade reaches back to the last whole chip once that ends further than this from the edge
 * (Landing.module.css `--chips-fade`, 28 px otherwise): past ~64 px the cut chip's words show beyond the 28 px fade.
 */
const FADE_REACH = 64
/** The maker's credit under the example chips. */
const CREDIT_HANDLE = '@armaangupt0'
const CREDIT_URL = 'https://x.com/armaangupt0'
/** Beside the credit on wide screens: the project's code, MIT licensed (README.md). */
const SOURCE_URL = 'https://github.com/dev-Armaan/satellites'

interface LandingProps {
  onSubmit: (place: Place) => void
  /** ms to wait before the entrance (after the boot curtain) */
  enterDelay?: number
}

/**
 * Memoised on `enterDelay` only: the app passes a fresh `onSubmit` on every render, and re-rendering
 * the hero for that would re-render every line of it. The latest callback is always the one called.
 */
export const Landing = memo(LandingImpl, (a, b) => a.enterDelay === b.enterDelay)

function LandingImpl({ onSubmit: onSubmitProp, enterDelay = 0 }: LandingProps) {
  const m = useMsgs(enLanding)
  const submitRef = useRef(onSubmitProp)
  submitRef.current = onSubmitProp
  const onSubmit = useCallback((p: Place) => submitRef.current(p), [])
  const phase = useApp((st) => st.phase)
  const stacked = useIsMobile()
  const shortLandscape = useMediaQuery(SHORT_LANDSCAPE_QUERY)
  // Search mode (the field lifted to the top) exists where the on-screen keyboard would cover it.
  const liftable = stacked || shortLandscape
  const [searching, setSearching] = useState(false)
  const searchingRef = useRef(false)
  searchingRef.current = searching
  const [first] = useState(() => !seen && previousPhase === 'boot')
  const [entered, setEntered] = useState(() => !first)
  const delay = prefersReducedMotion() ? 0 : enterDelay
  const rootRef = useRef<HTMLDivElement>(null)
  const columnRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const headlineRef = useRef<HTMLHeadingElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const notesRef = useRef<HTMLDivElement>(null)
  const locate = useLocate(onSubmit)
  const locating = phase === 'locating' && locate.state.kind === 'locating'
  const balance = useBalance(columnRef, contentRef, notesRef, !liftable)

  // Once per session; the UI entrance holds heavy GPU work (texture uploads) until it has played.
  useEffect(() => {
    seen = true
    useApp.getState().holdMotion(delay + (first ? 1600 : DUR.md))
    if (!first) return
    const id = window.setTimeout(() => setEntered(true), delay + 1700)
    return () => window.clearTimeout(id)
    // Mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useInsets(columnRef, contentRef, searchingRef, [stacked, shortLandscape, searching, locate.state.kind])

  /** Set once a place is chosen: the landing is on its way out, so search mode ends without a FLIP. */
  const leavingRef = useRef(false)
  const submit = (p: Place) => {
    leavingRef.current = true
    if (locate.state.kind === 'locating') locate.cancel()
    locate.dismiss()
    onSubmit(p)
  }

  // ── search mode ────────────────────────────────────────────────────────────────────────
  // Stacked (and short landscape): focusing the field lifts it to the top, clear of the keyboard. FLIP:
  // the field glides from where it was to where it goes (320 ms ease-out); entering, the hero copy fades
  // out on a frozen copy (160 ms); leaving, it fades back in.
  // Wide: the suggestion list opening lifts the field to the headline's place with a transform and the
  // copy fades (Landing.module.css), so all five rows fit above the bottom readouts. Esc, focus leaving
  // the search block or an empty field put it back; a list that briefly empties while typing does not.
  const flipFrom = useRef<number | null>(null)
  const liftRef = useRef(0)
  const listOpenRef = useRef(false)
  const enterSearch = () => {
    leavingRef.current = false
    if (!liftable || searchingRef.current) return
    flipFrom.current = searchRef.current?.getBoundingClientRect().top ?? null
    const column = columnRef.current
    if (column && !prefersReducedMotion()) {
      const ghost = insertFrozenClone(column, (c) => {
        c.dataset.ghost = ''
        c.querySelector<HTMLElement>('[data-search-block]')?.style.setProperty('visibility', 'hidden')
      })
      animateOut(ghost, [{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: EASE.inOut })
    }
    setEntered(true)
    searchingRef.current = true
    flushSync(() => setSearching(true))
  }
  /** Wide: how far the field rises (layout offsets: the entrance transforms don't count). */
  const measureLift = () => {
    const column = columnRef.current
    const block = searchRef.current
    const headline = headlineRef.current
    if (!column || !block || !headline) return
    liftRef.current = Math.max(0, block.offsetTop - headline.offsetTop)
    column.style.setProperty('--search-lift', `${liftRef.current}px`)
  }
  const enterWideSearch = () => {
    if (liftable || searchingRef.current) return
    measureLift()
    // Ends the entrance if it is still playing: its rise would hold the field's transform.
    setEntered(true)
    searchingRef.current = true
    setSearching(true)
  }
  const leaveSearch = () => {
    if (!searchingRef.current) return
    // Not when a place was just chosen: the landing is leaving, and the read would force a layout
    // inside the submit.
    if (liftable && !leavingRef.current) flipFrom.current = searchRef.current?.getBoundingClientRect().top ?? null
    searchingRef.current = false
    setSearching(false)
  }
  /** Out of search mode: the field lets go of focus (the keyboard drops) and the hero comes back. */
  const cancelSearch = () => {
    const el = document.activeElement as HTMLElement | null
    if (el && searchRef.current?.contains(el)) el.blur()
    leaveSearch()
  }
  // Phones: the back gesture leaves search mode (the field and the keyboard), not the site (src/lib/backStack.ts). A
  // locate started from search mode is dropped with it: the results must not open (and push) after Back.
  useBackLayer('search', searching && liftable, () => {
    if (locate.state.kind === 'locating') locate.cancel()
    cancelSearch()
  })
  // A layout change mid-search (a tablet rotated): take up the new layout's search mode, or leave it.
  const wasLiftable = useRef(liftable)
  useLayoutEffect(() => {
    if (wasLiftable.current === liftable) return
    wasLiftable.current = liftable
    if (!searchingRef.current) return
    searchingRef.current = false
    setSearching(false)
    if (!liftable && listOpenRef.current) enterWideSearch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liftable])
  // Wide search: the lift follows the viewport (the column's rhythm is in vh).
  useEffect(() => {
    if (!searching || liftable) return
    const onResize = () => measureLift()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searching, liftable])
  useLayoutEffect(() => {
    const from = flipFrom.current
    flipFrom.current = null
    const block = searchRef.current
    if (from === null || !block || prefersReducedMotion()) return
    const dy = from - block.getBoundingClientRect().top
    if (Math.abs(dy) > 1) {
      block.animate([{ transform: `translateY(${dy}px)` }, { transform: 'translateY(0)' }], { duration: 320, easing: EASE.out })
    }
    if (!searching) {
      // Back from search mode: the copy and its panel fade back in around the returning field. The copy
      // waits until the field has nearly landed (ease-out: ~90% of the way at 180 ms) and is still faint
      // as it settles, so the line never glides down through legible words.
      const column = columnRef.current
      column?.querySelectorAll<HTMLElement>('[data-hero-copy]').forEach((el) => {
        el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, delay: 180, easing: EASE.out, fill: 'backwards' })
      })
      try {
        column?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, easing: EASE.out, pseudoElement: '::before' })
      } catch {
        /* pseudo-element animation unsupported: the panel just appears */
      }
    }
  }, [searching])

  // While searching, cancel any pan the browser applied to bring the field into view (iOS): it has
  // already been moved to the top, and a residual pan would push it off-screen.
  useEffect(() => {
    const vv = window.visualViewport
    if (!searching || !vv) return
    const onScroll = () => {
      if (window.scrollY !== 0 || window.scrollX !== 0 || vv.offsetTop > 0) window.scrollTo(0, 0)
    }
    vv.addEventListener('scroll', onScroll)
    return () => vv.removeEventListener('scroll', onScroll)
  }, [searching])

  // Leaving for 'computing': the open suggestion list folds away first, then the hero exits.
  useExitClone(rootRef, {
    keyframes: stacked
      ? [
          { opacity: 1, transform: 'translateY(0)' },
          { opacity: 0, transform: 'translateY(8px)' },
        ]
      : [
          { clipPath: 'inset(0 0 0 0)', opacity: 1 },
          { clipPath: 'inset(0 0 100% 0)', opacity: 0.6 },
        ],
    duration: stacked ? DUR.exit : 360,
    easing: EASE.inOut,
    onStart: (clone, reduced) => {
      if (reduced) return
      clone.querySelector<HTMLElement>('[data-suggestions]')?.animate([{ clipPath: 'inset(0 0 0 0)' }, { clipPath: 'inset(0 0 100% 0)' }], {
        duration: 120,
        easing: EASE.inOut,
        fill: 'forwards',
      })
    },
  })

  const rootStyle = { '--enter-delay': `${delay}ms` } as CSSProperties

  return (
    <div
      ref={rootRef}
      className={s.landing}
      style={rootStyle}
      data-searching={searching ? 'true' : undefined}
      data-note={locate.state.kind !== 'idle' ? 'true' : undefined}
      data-entered={entered ? '' : undefined}
      data-return={first ? undefined : ''}
    >
      <section ref={columnRef} className={s.column} style={balance} aria-labelledby="landing-headline">
        <div ref={contentRef} className={s.content}>
          {/* The kicker wipes in after the headline's lines have started: on laptops it sits on the top row the boot
              curtain's wordmark slides along on its way to the HUD (PH-05: at 1280×800 it crossed the kicker mid-wipe). */}
          <Kicker delay={delay + 260} skip={!first} />

          {/* One sentence as display lines, each its own mask-wipe on a 60 ms stagger (the language decides the lines). */}
          <h1 ref={headlineRef} id="landing-headline" className={s.headline} data-hero-copy>
            {m.hero.map((line, i) => (
              <Reveal key={i} as="span" className={s.hl} delay={delay + 140 + 60 * i} skip={!first}>
                <Rich parts={line} classes={{ accent: s.serif }} accentAs="em" />
              </Reveal>
            ))}
          </h1>

          <Reveal as="p" className={s.sub} delay={delay + 420} duration={720} skip={!first}>
            <span data-hero-copy>
              <Rich parts={m.sub(WINDOW_DAYS)} />
            </span>
          </Reveal>

          <div
            ref={searchRef}
            className={cx(s.searchBlock, s.rise, s.riseSearch)}
            data-search-block
            // Wide search mode ends on Esc, or when focus leaves the search block (not when it moves
            // from the field to its own clear / go buttons).
            onKeyDown={(e) => {
              if (e.key === 'Escape' && !liftable) leaveSearch()
            }}
            onBlur={(e) => {
              if (!liftable && !e.currentTarget.contains(e.relatedTarget as Node | null)) leaveSearch()
            }}
          >
            <SearchBox
              onSubmit={submit}
              metaHidden={liftable && !searching && locate.state.kind === 'idle'}
              onBeforeFocus={liftable ? enterSearch : undefined}
              onFocusChange={(focused) => {
                if (focused) {
                  enterSearch()
                  // Turning to the search is moving on from a location fault.
                  locate.dismiss()
                } else if (liftable) leaveSearch()
              }}
              onListChange={(open) => {
                listOpenRef.current = open
                if (open) enterWideSearch()
              }}
              onQueryChange={(q) => {
                if (!q && !liftable) leaveSearch()
              }}
              liftedBy={() => (searchingRef.current && !liftable ? liftRef.current : 0)}
              statusOverride={locate.state.kind === 'locating' ? <LocatingStatus state={locate.state} /> : undefined}
              idleTrailing={
                searching && liftable && !locating ? (
                  // Phones, search mode with nothing typed: an obvious way back out (the back gesture works too), and
                  // the location button kept as its glyph where the field offers one (hidden ≤ 400 px, as ever).
                  <>
                    <button
                      type="button"
                      className={cx(s.locateInline, s.locateGlyphOnly)}
                      onPointerDown={(e) => e.preventDefault()}
                      onClick={locate.start}
                      aria-label={m.useMyLocation}
                    >
                      <Glyph name="locate" size={14} />
                    </button>
                    <button type="button" className={s.searchCancel} onPointerDown={(e) => e.preventDefault()} onClick={cancelSearch}>
                      {m.cancelSearch}
                    </button>
                  </>
                ) : locating ? (
                  <button
                    type="button"
                    className={s.locateInline}
                    onPointerDown={(e) => e.preventDefault()}
                    onClick={locate.cancel}
                    aria-label={m.cancelLocating}
                  >
                    {m.cancelLocate}
                  </button>
                ) : (
                  // The visible label is the accessible name: "Locate me" on phones; where the button is
                  // icon-only (small landscape phones) the long form is visually hidden but still names
                  // it. At ≤ 400 px it gives way to the "Near me" chip.
                  <button type="button" className={s.locateInline} onPointerDown={(e) => e.preventDefault()} onClick={locate.start}>
                    <Glyph name="locate" size={14} />
                    <span className={s.locateLabel}>{m.useMyLocation}</span>
                    <span className={s.locateLabelShort}>{m.locateMe}</span>
                  </button>
                )
              }
            />
            <div ref={notesRef} className={s.notes}>
              <LocateNotes state={locate.state} onDismiss={locate.dismiss} />
            </div>
          </div>

          <Examples onPick={submit} disabled={locating} locate={locate} />
          {/* Under the chips: the maker's credit, then (wide screens only, Landing.module.css .source) the link to
              the code. It shares the credit's line, so it adds no height to a column that must fit between the
              corner readouts, and phones, where that line is the panel's last and the screen is full, never get it. */}
          <div className={cx(s.foot, s.rise, s.riseExamples)} data-hero-copy>
            <a className={s.credit} href={CREDIT_URL} target="_blank" rel="noreferrer">
              {m.builtBy(CREDIT_HANDLE)}
            </a>
            <span className={s.source}>
              <span className={s.footSep} aria-hidden>
                ·
              </span>
              <a className={cx(s.credit, s.sourceLink)} href={SOURCE_URL} target="_blank" rel="noreferrer" aria-label={m.sourceLinkLabel}>
                {m.sourceLink}
                <Glyph name="arrow-up-right" size={10} />
              </a>
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}

/**
 * Publish what the landing covers so the camera frames the globe in the rest (store.uiInsets):
 *   stacked          the ink panel: bottom = from its top edge down
 *   short landscape  the copy column on the right (the left right to left)
 *   wide             the text on the left: left = the end of the longest line + TEXT_CLEAR (right to left the
 *                    text is on the right: right = from the start of the longest line)
 * The side is read from where the column is, never from the language (ErrorNotice.tsx does the same).
 * Not while searching: the camera must not move while you type.
 */
function useInsets(
  columnRef: RefObject<HTMLElement | null>,
  contentRef: RefObject<HTMLElement | null>,
  searchingRef: RefObject<boolean>,
  deps: unknown[],
) {
  useLayoutEffect(() => {
    const column = columnRef.current
    const content = contentRef.current
    if (!column || !content) return
    const set = useApp.getState().setUiInsets
    const shortLandscape = () => window.matchMedia?.(SHORT_LANDSCAPE_QUERY).matches ?? false
    const publish = () => {
      if (searchingRef.current) return
      const W = window.innerWidth
      const H = window.innerHeight
      if (shortLandscape()) {
        // offsetLeft: layout position, ignoring the entrance transforms.
        const left = column.offsetLeft
        const right = left + column.offsetWidth
        if (left + column.offsetWidth / 2 >= W / 2) set({ right: Math.max(0, W - left + TEXT_CLEAR), bottom: 0, left: 0 })
        else set({ left: Math.max(0, right + TEXT_CLEAR), bottom: 0, right: 0 })
      } else if (isStacked(W, H)) {
        set({ bottom: Math.max(0, H - (column.offsetTop - PANEL_PAD_TOP)), left: 0, right: 0 })
      } else {
        // Each block is as wide as its text (align-items: flex-start), so the blocks' outer edge is where the text
        // ends: the rightmost right edge, or right to left (the column on the right) the leftmost left edge.
        const box = column.getBoundingClientRect()
        const onRight = box.left + box.width / 2 > W / 2
        let edge = onRight ? Infinity : 0
        for (const el of content.children) {
          const r = el.getBoundingClientRect()
          if (r.width > 0 && r.height > 0) edge = onRight ? Math.min(edge, r.left) : Math.max(edge, r.right)
        }
        if (onRight) set({ right: Math.max(0, W - (edge < Infinity ? edge : box.left) + TEXT_CLEAR), left: 0, bottom: 0 })
        else set({ left: edge > 0 ? edge + TEXT_CLEAR : box.right + TEXT_CLEAR, right: 0, bottom: 0 })
      }
    }
    if (typeof ResizeObserver === 'undefined') {
      publish()
      return
    }
    // No direct call: the observer's first callback (after this frame's layout, before its paint)
    // publishes, so mounting the landing never forces a layout of its own.
    const ro = new ResizeObserver(publish)
    ro.observe(column)
    ro.observe(content)
    window.addEventListener('resize', publish)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', publish)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

/**
 * Desktop: the column is vertically centred, so a note under the field would move the whole hero by
 * half the height it adds (or, where the note replaces the chips, removes). Padding the column by
 * that difference cancels it — the headline stays put and the change happens below it — as far as
 * the free space allows. The difference is measured against the last note-free height.
 */
function useBalance(
  columnRef: RefObject<HTMLElement | null>,
  contentRef: RefObject<HTMLElement | null>,
  noteRef: RefObject<HTMLElement | null>,
  enabled: boolean,
): CSSProperties | undefined {
  const [pad, setPad] = useState(0)
  const baseH = useRef<number | null>(null)
  useLayoutEffect(() => {
    const column = columnRef.current
    const content = contentRef.current
    const note = noteRef.current
    if (!enabled || !column || !content || !note || typeof ResizeObserver === 'undefined') {
      setPad(0)
      return
    }
    const measure = () => {
      const contentH = content.offsetHeight
      const noteH = note.offsetHeight
      if (noteH === 0) baseH.current = contentH
      setPad(balancePad(column.clientHeight, contentH, baseH.current, noteH))
    }
    // No direct call: the observer's first callback (after this frame's layout, before its paint)
    // measures, so mounting the landing (inside the Esc that leaves results) forces no layout of its own.
    const ro = new ResizeObserver(measure)
    ro.observe(column)
    ro.observe(content)
    ro.observe(note)
    return () => ro.disconnect()
  }, [columnRef, contentRef, noteRef, enabled])
  return pad > 0 ? { paddingTop: pad } : pad < 0 ? { paddingBottom: -pad } : undefined
}

/** "── LAST 7 DAYS · 1 → 8 NOV 2026 UTC" — the exact window "this week" means. */
function Kicker({ delay, skip }: { delay: number; skip: boolean }) {
  // Live: a page left open past midnight UTC shows the window a search would actually use. The label
  // re-renders only when the day changes (or the language), not every second.
  const m = useMsgs(enLanding)
  const label = useSecondDerived(windowLabel)
  return (
    <Reveal axis="x" duration={600} delay={delay} skip={skip} className={s.kicker}>
      <span className={s.kickerRule} aria-hidden />
      <span className={s.kickerIdx}>{m.lastDays(WINDOW_DAYS)}</span>
      <span className={s.kickerSep} aria-hidden>
        ·
      </span>
      {skip ? <span>{label}</span> : <ScrambleOnce text={label} delay={delay + 200} />}
    </Reveal>
  )
}

/** Under the field: what happens to your position while locating, or why it failed. */
function LocateNotes({ state, onDismiss }: { state: LocateState; onDismiss: () => void }) {
  const m = useMsgs(enLanding)
  if (state.kind === 'locating') return <p className={s.footnote}>{m.locatingNote}</p>
  if (state.kind === 'error')
    return (
      <p className={s.error} role="alert">
        <span className={s.errorLabel}>{m.locationLabel}</span>
        <span className={s.errorText}>{m.locateErrors[state.code]}</span>
        <button type="button" className={s.errorClose} onClick={onDismiss} aria-label={m.dismiss}>
          <Glyph name="close" size={12} />
        </button>
      </p>
    )
  return null
}

function LocatingStatus({ state }: { state: Extract<LocateState, { kind: 'locating' }> }) {
  const m = useMsgs(enLanding)
  useSecondClock() // re-render each second for the elapsed readout
  const ref = useRef<HTMLSpanElement>(null)
  useWallSecondSync(ref)
  const secs = Math.max(0, (performance.now() - state.t0) / 1000)
  return (
    <span ref={ref} className={s.locStatus}>
      <span className={s.locDot} aria-hidden data-blink />
      {state.step === 'position' ? m.requestingPosition : m.namingPlace}
      <span className={s.locTime}>{m.elapsed(secs)}</span>
    </span>
  )
}

/** The last "Surprise me" place this visit, in English (the landing remounts after each search): the next one is somewhere else. */
let lastSurprise: Place | undefined

/** Touch screens: a finger can't hover the globe to discover the pin, so a chip drops one (see Examples). */
const TOUCH_QUERY = '(hover: none) and (pointer: coarse)'

function Examples({ onPick, disabled, locate }: { onPick: (p: Place) => void; disabled?: boolean; locate: ReturnType<typeof useLocate> }) {
  // Re-renders on a language switch, which also rewords the places' names (localizedPlace reads them at render).
  const m = useMsgs(enLanding)
  const locating = locate.state.kind === 'locating'
  // The English example: translated where it is shown, so a language switch mid-hover rewords the hint.
  const [hover, setHover] = useState<ExamplePlace | null>(null)
  // A pin dropped on the globe searches too (globe/PinMarker.tsx), once the 3D globe is up: with a mouse, the
  // header's idle hint says so (a click on the planet drops it); on touch, a chip drops one in the middle of the globe.
  const pinReady = useApp((st) => st.pinReady)
  const touch = useMediaQuery(TOUCH_QUERY)
  // Swipeable row (stacked): the edge fade that says "more" lifts once the row is scrolled to its end, and the
  // leading edge fades too once the row has scrolled (a chip is never hard-cut at either edge). The trailing fade
  // reaches back to the last whole chip (`--chips-fade`).
  const listRef = useRef<HTMLUListElement>(null)
  const markEnd = () => {
    const ul = listRef.current
    if (!ul) return
    // Right to left a row scrolls toward negative scrollLeft: the distance travelled is its magnitude.
    const scrolled = Math.abs(ul.scrollLeft)
    const end = ul.scrollWidth - ul.clientWidth - scrolled <= 2
    if (end) ul.dataset.end = ''
    else delete ul.dataset.end
    if (scrolled > 2) ul.dataset.scrolled = ''
    else delete ul.dataset.scrolled
    // The trailing fade starts where the last whole chip ends when the edge would otherwise cut the next chip with
    // more than a letter or two in full ink ("PRÈS DE MO", French at 360 px; English at 320 px showed "NEAR M"): that
    // chip then fades out as a whole. A sliver of the next chip inside the usual 28 px fade says "more" as before.
    const rtl = getComputedStyle(ul).direction === 'rtl'
    const box = ul.getBoundingClientRect()
    // In the order they are seen ("Surprise me" is last in the list and first on screen), skipping any not shown.
    const ends = [...ul.children]
      .map((li) => li.getBoundingClientRect())
      .filter((r) => r.width > 0)
      .map((r) => (rtl ? box.right - r.left : r.right - box.left)) // from the row's start, either direction
      .sort((a, b) => a - b)
    let fade = 0
    for (const e of ends) {
      if (e > box.width + 0.5) break
      fade = box.width - e
    }
    if (!end && fade > FADE_REACH) ul.style.setProperty('--chips-fade', `${Math.round(fade)}px`)
    else ul.style.removeProperty('--chips-fade')
  }
  useLayoutEffect(() => {
    const ul = listRef.current
    if (!ul || typeof ResizeObserver === 'undefined') return
    // The observer's first callback marks it, after layout and before the first paint: no forced layout. The chips
    // are observed too (a language switch or the fonts arriving change their widths, not the row's), and the list
    // (touch adds "Drop a pin" once the globe is ready).
    const ro = new ResizeObserver(markEnd)
    const observe = () => {
      ro.observe(ul)
      for (const li of ul.children) ro.observe(li)
    }
    observe()
    const mo = new MutationObserver(() => {
      observe()
      markEnd()
    })
    mo.observe(ul, { childList: true })
    return () => {
      ro.disconnect()
      mo.disconnect()
    }
  }, [])
  return (
    // A CSS rise (fill: backwards) rather than <Reveal>: the block's delay lives in CSS with the field's.
    <div className={cx(s.examples, s.rise, s.riseExamples)} data-hero-copy>
      {/* Wide: label left, live detail right, the same row structure as the field's "01 / Place" line. */}
      <div className={s.examplesHead}>
        <span>
          <span className={s.exIdx}>02</span> / {m.orTry}
        </span>
        <span className={s.exHint} aria-hidden>
          {hover ? (
            <>
              <span className={s.exCoord}>
                {fmtLat(hover.lat, 4)} {fmtLon(hover.lon, 4)}
              </span>
              <span className={s.exSep}>·</span>
              {localizedPlace(hover).sublabel}
            </>
          ) : pinReady && !touch ? (
            <span className={s.pinHint}>
              <Glyph name="reticle" size={11} />
              {m.pinHint}
            </span>
          ) : null}
        </span>
      </div>
      <ul ref={listRef} className={s.chips} aria-label={m.examplesLabel} onScroll={markEnd} onPointerLeave={() => setHover(null)}>
        {/* Stacked: the label leads the swipeable row instead of taking a line of its own. */}
        <li className={s.chipLead} aria-hidden>
          {m.orTry}
        </li>
        {/* Narrow phones (≤ 400 px, CSS): "Use my location" as the first chip, labelled, in the chips' own
            box and type. Locating, it reads "Locating…" and a second tap cancels. Always in the DOM, so
            the column never changes height after mount. */}
        <li className={s.nearMe}>
          <button
            type="button"
            className={cx(s.chip, s.chipLocate)}
            onClick={locating ? locate.cancel : locate.start}
            aria-label={locating ? m.cancelLocating : m.useMyLocation}
          >
            <Glyph name="locate" size={12} />
            {locating ? m.locating : m.nearMe}
          </button>
        </li>
        {pinReady && touch ? (
          <li>
            <button type="button" className={cx(s.chip, s.chipLocate)} disabled={disabled} onClick={() => useApp.getState().dropPinAtCentre()}>
              <Glyph name="reticle" size={12} />
              {m.dropPin}
            </button>
          </li>
        ) : null}
        {EXAMPLE_PLACES.map((p) => {
          const t = localizedPlace(p)
          return (
            <li key={p.chip}>
              <button
                type="button"
                className={s.chip}
                disabled={disabled}
                onClick={() => onPick(localizedPlace(p))}
                onPointerEnter={(e) => e.pointerType === 'mouse' && setHover(p)}
                onFocus={() => setHover(p)}
                onBlur={() => setHover(null)}
                aria-label={m.chipName(t.label, t.sublabel ?? '')}
              >
                {t.chip}
              </button>
            </li>
          )
        })}
        {/* A famous place picked at random (places.ts SURPRISE_PLACES), never the one it picked last. */}
        <li className={s.surpriseItem}>
          <button
            type="button"
            className={cx(s.chip, s.chipSurprise)}
            disabled={disabled}
            onClick={() => {
              lastSurprise = surprisePlace(lastSurprise)
              onPick(localizedPlace(lastSurprise))
            }}
            aria-label={m.surpriseName}
          >
            {m.surprise}
          </button>
        </li>
      </ul>
    </div>
  )
}

