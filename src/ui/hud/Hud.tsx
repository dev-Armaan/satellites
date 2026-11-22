/**
 * <Hud/>: the instrument chrome, always mounted above the globe (DESIGN §4).
 *
 *   TL  wordmark + version, About link            TR  live UTC clock, 1 Hz signal dot
 *   BL  catalog: objects, source, fetch time      BR  sub-solar point + GMST, every second
 *
 * Stacked layouts (and short landscape phones) would collide the bottom corners with the landing
 * panel and the bottom sheet, so those are hidden and the sun joins the top-right block.
 * When the scene is not showing live time (replay / scrub), the TR block adds the scene time, in the
 * place's own zone like every other time on the pass (the live clock stays UTC; a phone too narrow for both beside
 * the top-left readout shows the scene time in the clock's place, useCrowdedLine).
 *
 * Over a scene (results, a pass) functional ink scrims sit behind the readouts so they stay legible
 * over bright cloud (decision 5); the landing keeps the pure view. The HUD publishes the height it
 * covers at the top (store.uiInsets.top) so the camera frames below it.
 *
 * Only the leaves that show time re-render, and only when their text changes (UtcClock and GmstLine
 * every second, SunValue every ~24 s, CatalogAge every minute); the shell renders when the phase, the
 * catalog or the clock mode changes (and the language: copy is the 'hud' namespace, src/i18n/en/hud.ts).
 */
import { memo, useLayoutEffect, useRef, type RefObject } from 'react'
import enHud from '@/i18n/en/hud'
import { Rich } from '@/i18n/Rich'
import { currentLocale, useLocale, useMsgs } from '@/i18n/runtime'
import { timeZoneAt, tzReady } from '@/imagery'
import { subsolarPoint } from '@/lib/geo'
import { sceneClock, useSceneFrame } from '@/state/sceneClock'
import { useApp } from '@/state/store'
import { Bezel, CornerReadout, Kbd, Reveal, ScrambleOnce, cx, fmtUtcDate, fmtUtcTime, useWallSecondSync, Wordmark } from '@/ui/system'
// The pure time module, never the lazy '@/ui/results' index (that would pull the results chunk in).
import { fmtLocalDay, fmtLocalTime, zoneAbbr } from '@/ui/results/lib/time'
import { useCatalogStatus } from './catalogStatus'
import { LanguageSwitcher } from './LanguageSwitcher'
import { useSecondClock, useSecondDerived } from './clock'
import { fmtCatalogAge, fmtGmst, fmtObjects, fmtSource, fmtStampZ, fmtSun, isStale } from './readouts'
import s from './Hud.module.css'

export const VERSION = 'v0.1'

/** The brand: the top-left group's name, never translated (docs/I18N.md). */
const BRAND = 'Watched'

/** Space kept between the top readouts and what the camera frames below them. */
const TOP_GAP = 8

/**
 * Least clear space between "How this works · language" and the sun or scene line beside it on a phone. Less, and that
 * line makes room (useCrowdedLine): at 320 px the sun overlapped them in English, at 360 px German and Polish left 6 px,
 * Turkish 13; the scene time overlapped them by 4 px in English at 390 px, by 17 at 360.
 */
const MIN_ROW_GAP = 14

/**
 * What every panel beside the HUD adds to the inset it publishes, between its edge and the free rect (results/shell.ts
 * useInsets, the landing's TEXT_CLEAR, ErrorNotice): the panel's own edge is that much inside its inset.
 */
const PANEL_CLEAR = 24

/**
 * Least clear space between the language's name and a panel's edge before the language steps down (useLanguageRoom).
 * English keeps 5 px at 844 × 390, clear of the panel's hairline; it was under it at 812 × 375 (by 6 px).
 */
const PANEL_GAP = 4

/**
 * After boot, the lines start wiping in this long after the loading screen starts to leave (src/app/bootCurtain.ts:
 * its wordmark glides 760 ms onto this one). The version and About lines wait for the logo to land (it passes
 * over their spot on its way in: they start at 780 / 820 ms, after the 760 ms glide, now that the wipes run on CSS
 * time from the curtain's first frame and are never late); the other corners start sooner.
 */
const AFTER_BOOT = 300

/**
 * The scene clock, when the globe isn't on live time (replay / scrub), at the place: the same clock and
 * date style as the pass header ("Scene Sun 1 Nov 11:21:13 EST"; phones drop the day: "Scene 11:21:13 EST", and
 * where even that would crowd the top-left readout it takes the live clock's line, useCrowdedLine). The zone
 * always shows. UTC until the place's zone is known.
 *
 * Written straight into the DOM from the globe's per-frame clock (sceneClock), the one the replay
 * controls read, so its seconds turn on the same frame as theirs; text changes only when a second
 * does, and React never re-renders it for time (no 10 Hz store renders).
 */
function SceneTime() {
  // Re-renders on a language switch: the layout effect below rewrites the day in the new language.
  const m = useMsgs(enHud)
  const dayRef = useRef<HTMLSpanElement>(null)
  const timeRef = useRef<HTMLSpanElement>(null)
  const last = useRef({ sec: NaN, key: '', tz: 'UTC', day: '', time: '' })
  const write = () => {
    const st = useApp.getState()
    const ms = sceneClock.mode === st.timeMode ? sceneClock.simTime : st.simTime
    const L = last.current
    const place = st.place
    const ready = tzReady()
    // The language is part of the key: the day's words change with it.
    const key = `${place ? `${place.lat},${place.lon},${ready ? 1 : 0}` : ''}|${currentLocale()}`
    const sec = Math.floor(ms / 1000)
    if (sec === L.sec && key === L.key) return
    if (key !== L.key) {
      L.key = key
      L.tz = place && ready ? timeZoneAt(place.lat, place.lon) : 'UTC'
    }
    L.sec = sec
    const t = sec * 1000
    const day = `${fmtLocalDay(t, L.tz)} `
    const time = `${fmtLocalTime(t, L.tz, true)} ${zoneAbbr(t, L.tz)}`
    if (day !== L.day && dayRef.current) dayRef.current.textContent = L.day = day
    if (time !== L.time && timeRef.current) timeRef.current.textContent = L.time = time
  }
  // First text before the first paint; then once per frame (a no-op unless the second turned).
  useLayoutEffect(write)
  useSceneFrame(write)
  return (
    <span className={cx(s.line, s.dim, s.sceneLine)}>
      {m.scene}
      <span className={s.sceneValue}>
        <span ref={dayRef} className={s.desk} />
        <span ref={timeRef} />
      </span>
    </span>
  )
}

/** "2026-11-08 03:31:07 UTC" (the date is dropped on phones). */
function UtcClock() {
  const now = useSecondClock()
  return (
    <time dateTime={new Date(now).toISOString()} className={s.clock}>
      <span className={cx(s.dim, s.desk)}>{fmtUtcDate(now)} </span>
      {fmtUtcTime(now)} UTC
    </time>
  )
}

const sunText = (now: number) => fmtSun(subsolarPoint(now))

/** "SUN 16.6°S 007.1°E" (re-renders when the text changes, ~every 24 s); scrambles once when `scramble` is set. */
function SunValue({ scramble }: { scramble?: boolean }) {
  useLocale() // the word before the coordinates follows the language
  const sun = useSecondDerived(sunText)
  return scramble ? <ScrambleOnce text={sun} delay={120} className={s.value} /> : <>{sun}</>
}

function GmstLine() {
  const m = useMsgs(enHud)
  const now = useSecondClock()
  return <>{m.gmst(fmtGmst(now))}</>
}

/** "Fetched 2026-11-08 03:34Z · 4 h ago" (warn-coloured once the catalog is stale; re-renders when the age text changes). */
function CatalogAge({ fetchedAt }: { fetchedAt: string }) {
  const m = useMsgs(enHud) // also re-renders on a language switch, which re-reads the age below in the new language
  const stale = useSecondDerived((now) => isStale(fetchedAt, now))
  const age = useSecondDerived((now) => fmtCatalogAge(Date.parse(fetchedAt), now, isStale(fetchedAt, now)))
  return (
    <span className={stale ? s.warn : undefined}>
      {m.fetched(fmtStampZ(fetchedAt))}
      <span className={s.sep}>·</span>
      {age}
    </span>
  )
}

/**
 * Memoised on whether there is an About action, not on its identity: the app re-renders (and passes a
 * fresh callback) for reasons that change nothing here. The latest callback is always the one called.
 */
export const Hud = memo(HudImpl, (a, b) => !!a.onAbout === !!b.onAbout && !!a.onHome === !!b.onHome)

function HudImpl({ onAbout, onHome }: { onAbout?: () => void; onHome?: () => void }) {
  const m = useMsgs(enHud)
  const aboutRef = useRef(onAbout)
  aboutRef.current = onAbout
  const homeRef = useRef(onHome)
  homeRef.current = onHome
  const live = useApp((st) => st.timeMode === 'live')
  const scene = useApp((st) => (st.selectedPassId ? 'pass' : st.phase === 'computing' || st.phase === 'results' ? 'results' : undefined))
  const catalog = useCatalogStatus()
  // Every blink in the chrome (the live dot, the pending cursor) is on for the first half of each UTC
  // second, the same frame the clock digits change.
  const rootRef = useRef<HTMLDivElement>(null)
  useWallSecondSync(rootRef)
  const topLeft = useRef<HTMLDivElement>(null)
  const topRight = useRef<HTMLDivElement>(null)
  useTopInset(topLeft, topRight)
  useCrowdedLine(topLeft, topRight)
  useLanguageRoom(topLeft)
  // The stacked sun line gives way to the scene time during a replay and comes back after it: its
  // wipe plays with the HUD's first entrance only, never again on its return (one entrance per element).
  // Set during the render that unmounts it, so its `skip` never changes while it is mounted.
  const sunReturns = useRef(false)
  if (!live) sunReturns.current = true
  // Under the loading screen the lines sit settled and unseen; when boot ends they remount (new key) and wipe in
  // while the loading screen's wordmark glides onto this one (bootCurtain), which is hidden until it lands.
  const booting = useApp((st) => st.phase === 'boot')
  const k = booting ? 'boot' : 'live'
  const at = (ms: number) => (booting ? 0 : AFTER_BOOT + ms)

  return (
    <div ref={rootRef} className={s.hud} data-scene={scene}>
      <Bezel />

      <CornerReadout corner="tl" label={BRAND} ref={topLeft}>
        <div className={s.line}>
          <span className={s.mark} data-hud-wordmark>
            {onHome ? (
              // Back to the landing (a real link: a new tab or a copied address opens the home page).
              <a
                href="/"
                className={s.home}
                aria-label={m.home}
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
                  e.preventDefault()
                  homeRef.current?.()
                }}
              >
                <Wordmark height={17} className={s.wordmark} />
              </a>
            ) : (
              <Wordmark height={17} className={s.wordmark} />
            )}
          </span>
        </div>
        <Reveal key={`${k}-about`} skip={booting} axis="x" duration={480} delay={at(520)} as="div" className={cx(s.line, s.aboutLine)}>
          {onAbout ? (
            <button type="button" className={s.about} onClick={() => aboutRef.current?.()} aria-keyshortcuts="?">
              <span className={s.aboutText}>{m.about}</span>
              <Kbd className={s.desk}>?</Kbd>
            </button>
          ) : null}
          <LanguageSwitcher />
        </Reveal>
      </CornerReadout>

      <CornerReadout corner="tr" label={m.regionTime} ref={topRight}>
        <Reveal key={`${k}-clock`} skip={booting} axis="x" duration={480} delay={at(0)} as="div" className={cx(s.line, s.clockLine)}>
          <UtcClock />
        </Reveal>
        {live ? null : <SceneTime />}
        {/* stacked: the sun joins the clock (bottom corners are hidden); a replay's scene time takes its place */}
        {live ? (
          <Reveal key={`${k}-sun`} skip={booting || sunReturns.current} axis="x" duration={480} delay={at(60)} as="div" className={cx(s.line, s.mob, s.sunLine)}>
            <SunValue />
          </Reveal>
        ) : null}
      </CornerReadout>

      <CornerReadout corner="bl" label={m.regionCatalog} className={s.wideOnly}>
        <Reveal key={`${k}-objects`} skip={booting} axis="x" duration={480} delay={at(120)} as="div" className={s.line}>
          {catalog.state === 'ready' ? (
            <>
              <ScrambleOnce text={fmtObjects(catalog.count)} className={s.value} />
              <span className={s.sep}>·</span>
              {fmtSource(catalog.source)}
            </>
          ) : (
            // One span, so the space beside the placeholder stays (a bare text node at the inline-flex line's edge
            // dropped it: "—OBJECTS"); each language puts the placeholder where its count goes ("物体数 —").
            <span>
              <Rich parts={m.objectsPending('—')} classes={{ num: s.value }} />
            </span>
          )}
        </Reveal>
        <Reveal key={`${k}-age`} skip={booting} axis="x" duration={480} delay={at(180)} as="div" className={cx(s.line, s.dim)}>
          {catalog.state === 'ready' ? (
            <CatalogAge fetchedAt={catalog.fetchedAt} />
          ) : catalog.state === 'error' ? (
            <span className={s.warn}>{m.catalogUnavailable}</span>
          ) : (
            <span className={s.pending} data-blink>
              {m.catalogLoading}
            </span>
          )}
        </Reveal>
      </CornerReadout>

      <CornerReadout corner="br" label={m.regionSun} className={s.wideOnly}>
        <Reveal key={`${k}-subsolar`} skip={booting} axis="x" duration={480} delay={at(200)} as="div" className={s.line}>
          <SunValue scramble={!booting} />
        </Reveal>
        <Reveal key={`${k}-gmst`} skip={booting} axis="x" duration={480} delay={at(260)} as="div" className={cx(s.line, s.dim)}>
          {m.subsolar}
          <span className={s.sep}>·</span>
          <GmstLine />
        </Reveal>
      </CornerReadout>
    </div>
  )
}

/**
 * On a phone the top right's second line sits beside "How this works" and the language on the left: the sun, or during
 * a replay the scene time. Where the two would come closer than MIN_ROW_GAP (narrow phones, longer languages), that
 * line makes room, never the About link or the language switcher (the left's words are all needed: a language is
 * named in full, never by a code, owner 2026-11-19):
 *  - the sun line is hidden: its readout is the extra one (wide screens show it in its own corner);
 *  - the scene time moves up into the live clock's line, which steps aside until the replay ends. It is the one time
 *    that cannot go: it says what moment the globe shows (honest labelling), and while a replay runs every other time
 *    on screen is the scene's too, so the live UTC clock is what a phone can spare. It cannot go down a line either:
 *    a third line would run under the results sheet at its top snap and past the scrim. The top right then holds one
 *    line, as it already does on such a phone outside a replay (its sun line is hidden there).
 * Both keep their boxes: the sun is hidden, not removed, and the scene time is as wide on either line (the lines are
 * right-aligned in one fixed box), so each is still measured as the screen or the words change, nothing else in the
 * corner moves and nothing flips back and forth (the top left's two lines set the top inset either way). Written to
 * the DOM, not React state: the lines remount after a replay and on boot, which the observers below see. The scene
 * time's move changes the corner's height, so from the observer it waits for the next frame (layoutFlag).
 */
function useCrowdedLine(topLeft: RefObject<HTMLDivElement | null>, topRight: RefObject<HTMLDivElement | null>) {
  const recheck = useRelayoutOnLocale()
  useLayoutEffect(() => {
    const tl = topLeft.current
    const tr = topRight.current
    if (!tl || !tr || typeof ResizeObserver === 'undefined') return
    const flag = layoutFlag()
    const watched = new WeakSet<Element>()
    const watch = (el: Element) => {
      if (watched.has(el)) return
      watched.add(el)
      ro.observe(el)
    }
    const check = (inObserver: boolean) => {
      flag.drop()
      const about = tl.querySelector<HTMLElement>(`.${s.aboutLine}`)
      // One or the other: the scene time takes the sun line's place during a replay.
      const line = tr.querySelector<HTMLElement>(`.${s.sunLine}, .${s.sceneLine}`)
      if (!about || !line) return
      watch(about)
      watch(line)
      const a = about.getBoundingClientRect()
      const b = line.getBoundingClientRect()
      if (!a.width || !b.width) return // the sun line is not shown here (wide screens)
      // Right to left the corners swap: the language line is at the right, the sun or scene at the left.
      const rtl = getComputedStyle(tr).direction === 'rtl'
      // The line's extent at the corner's tracking: while it is tightened (below) it is narrower by its tracking, and
      // both decisions are made on the untightened line, so tightening it never undoes either.
      const tight = line.hasAttribute('data-tight')
      const width = b.width + (tight ? [...line.innerText].length * (parseFloat(getComputedStyle(tr).letterSpacing) || 0) : 0)
      const [start, end] = rtl ? [b.left, b.left + width] : [b.right - width, b.right]
      const crowded = (rtl ? a.left - end : start - a.right) < MIN_ROW_GAP
      flag.set(line, 'data-crowded', crowded, inObserver)
      // Moved up, the scene time is beside the wordmark: on the narrowest phones (320 px) and in the longer languages
      // it came within 4 px of it (Polish, Indonesian: "POWTÓRKA 10:41:54 UTC+5:45"). There it drops its tracking,
      // which keeps every word of it (the label and the zone say what the time is) and clears the wordmark by 7 px.
      const mark = line.matches(`.${s.sceneLine}`) ? tl.querySelector('[data-hud-wordmark]')?.getBoundingClientRect() : undefined
      const nearMark = !!mark && crowded && (rtl ? mark.left - end : start - mark.right) < MIN_ROW_GAP
      flag.set(line, 'data-tight', nearMark, inObserver)
    }
    const now = () => check(false)
    const ro = new ResizeObserver(() => check(true))
    ro.observe(tl)
    ro.observe(tr)
    // A remounted line (the boot entrance, the sun's return after a replay) is a new element.
    const mo = new MutationObserver(now)
    mo.observe(tr, { childList: true })
    mo.observe(tl, { childList: true })
    window.addEventListener('resize', now)
    now()
    recheck.current = now
    return () => {
      recheck.current = undefined
      ro.disconnect()
      mo.disconnect()
      flag.drop()
      window.removeEventListener('resize', now)
    }
  }, [topLeft, topRight])
}

/**
 * Landscape phones: the results panel docks beside the top-left readout and reaches up to the bezel, and "How this
 * works | language" ran under its edge in the longer languages (at 844 × 390 Dutch and Russian by 10 px, Vietnamese
 * by 16; at 812 × 375 and 800 × 360 English too, by 6 and 10). Where the row would come closer than PANEL_GAP to a panel's edge,
 * the language steps down to a line of its own under "How this works", which stays whole on its line: every word on
 * the left is needed (the language's full name, never a code, owner 2026-11-19), and a third line costs only some globe
 * there (the top inset grows, so the camera frames below it). A portrait phone has no room for a third line (the
 * results sheet's top snap), but nothing beside the row there either: its panels publish only a bottom inset.
 *
 * The panels publish what they cover (store.uiInsets, each PANEL_CLEAR wider than the panel), so this needs no panel's
 * markup. The row's width is the About link's plus the language's as it sits in the row (its hairline included, read
 * while it is in the row), so it is the same on either layout and nothing flips back and forth. Right to left the
 * corners and the dock swap: the row is at the right, a panel's edge is its left inset. Written to the DOM like
 * useCrowdedLine: the line remounts on boot, which the observers see. The step changes the corner's height, so from an
 * observer, or from the insets the panels publish from theirs, it waits for the next frame (layoutFlag).
 */
function useLanguageRoom(topLeft: RefObject<HTMLDivElement | null>) {
  const recheck = useRelayoutOnLocale()
  useLayoutEffect(() => {
    const tl = topLeft.current
    if (!tl || typeof ResizeObserver === 'undefined') return
    const flag = layoutFlag()
    // The switcher's hairline and its margins: in the row, it is what the trigger has beyond the name.
    let rule = 0
    const watched = new WeakSet<Element>()
    const watch = (el: Element) => {
      if (watched.has(el)) return
      watched.add(el)
      ro.observe(el)
    }
    const check = (inObserver: boolean) => {
      flag.drop()
      const row = tl.querySelector<HTMLElement>(`.${s.aboutLine}`)
      const trigger = row?.querySelector<HTMLElement>('[aria-haspopup="menu"]')
      const name = trigger?.querySelector<HTMLElement>('[lang]')
      if (!row || !trigger || !name) return
      watch(row)
      watch(name)
      const about = row.querySelector<HTMLElement>(`.${s.about}`)
      const below = row.hasAttribute('data-lang-below')
      const nameW = name.getBoundingClientRect().width
      if (!below) rule = trigger.getBoundingClientRect().width - nameW
      const need = (about?.getBoundingClientRect().width ?? 0) + rule + nameW
      const r = row.getBoundingClientRect()
      if (!r.width) return
      const { left, right } = useApp.getState().uiInsets
      const rtl = getComputedStyle(tl).direction === 'rtl'
      const fits = rtl
        ? left <= 0 || r.right - need - PANEL_GAP >= left - PANEL_CLEAR
        : right <= 0 || r.left + need + PANEL_GAP <= window.innerWidth - right + PANEL_CLEAR
      flag.set(row, 'data-lang-below', !fits, inObserver)
    }
    const now = () => check(false)
    const ro = new ResizeObserver(() => check(true))
    ro.observe(tl)
    // A panel that arrives, leaves or moves publishes new insets, mostly from its own ResizeObserver (results/shell.ts
    // useInsets): taken as from inside one.
    const unsub = useApp.subscribe((st, prev) => {
      if (st.uiInsets.left !== prev.uiInsets.left || st.uiInsets.right !== prev.uiInsets.right) check(true)
    })
    // A remounted line (the boot entrance) is a new element.
    const mo = new MutationObserver(now)
    mo.observe(tl, { childList: true })
    window.addEventListener('resize', now)
    now()
    recheck.current = now
    return () => {
      recheck.current = undefined
      ro.disconnect()
      mo.disconnect()
      unsub()
      flag.drop()
      window.removeEventListener('resize', now)
    }
  }, [topLeft])
}

/**
 * A language switch changes the words both hooks above measure (the language's name, the scene's label), which their
 * ResizeObservers would see only after layout, so the new words would be painted for a frame in the old arrangement
 * (Russian's name under the panel's edge, 26 px of it at 800 × 360) before the step was written. The hook's check
 * runs again in a layout effect when the language changes instead: the DOM already holds the new words, nothing has
 * been painted yet, and it is not an observer's delivery, so the decision is written at once.
 */
function useRelayoutOnLocale() {
  const recheck = useRef<(() => void) | undefined>(undefined)
  const locale = useLocale()
  useLayoutEffect(() => recheck.current?.(), [locale])
  return recheck
}

/**
 * Sets an attribute the two hooks above decide by measuring, only when the decision changes. Either change resizes a
 * top corner, which ResizeObservers watch (useTopInset's, those hooks' own). Made inside an observer's delivery (or a
 * store callback one runs), that resize cannot be delivered in the same frame: the browser ends it on "ResizeObserver
 * loop completed with undelivered notifications", a window error that telemetry sends (src/app/telemetry.ts; it
 * came on the landscape panel's arrival in English at 812 × 375, and on a language switch beside the panel or during
 * a replay). So there the write waits for the next frame, before its layout, which the observers then see like any
 * other change; the frame already laid out is painted as it was, one frame of the old layout (the same rule as
 * Sheet.tsx's footer padding, R3-12). Elsewhere it is written at once: at mount (before the first paint), from the
 * MutationObserver (a line just remounted), on a language switch (useRelayoutOnLocale) and on a window resize (before
 * the frame's layout). A newer check drops a write still waiting: the latest measurement decides.
 */
function layoutFlag() {
  let frame = 0
  // The writes waiting for the next frame, one per attribute (the latest decision for each), made in one frame.
  const pending = new Map<string, () => void>()
  const drop = () => {
    cancelAnimationFrame(frame)
    frame = 0
    pending.clear()
  }
  const set = (el: Element, name: string, on: boolean, inObserver: boolean) => {
    if (el.hasAttribute(name) === on) {
      pending.delete(name)
      return
    }
    const write = () => el.toggleAttribute(name, on)
    if (!inObserver) {
      pending.delete(name)
      write()
      return
    }
    pending.set(name, write)
    if (!frame)
      frame = requestAnimationFrame(() => {
        frame = 0
        const writes = [...pending.values()]
        pending.clear()
        writes.forEach((w) => w())
      })
  }
  return { set, drop }
}

/** Publish store.uiInsets.top = the lower of the two top readouts' bottoms + TOP_GAP. */
function useTopInset(topLeft: RefObject<HTMLDivElement | null>, topRight: RefObject<HTMLDivElement | null>) {
  useLayoutEffect(() => {
    const tl = topLeft.current
    const tr = topRight.current
    const publish = () => {
      const b = Math.max(tl?.getBoundingClientRect().bottom ?? 0, tr?.getBoundingClientRect().bottom ?? 0)
      if (b > 0) useApp.getState().setUiInsets({ top: Math.ceil(b + TOP_GAP) })
    }
    if (typeof ResizeObserver === 'undefined') {
      publish()
      return
    }
    // Seeded here, in the layout effect (one layout read at mount): the observer's first delivery is then a no-op.
    // Published from that first delivery instead, the store write moved other observed UI inside the observer's own
    // loop on a loaded phone ("ResizeObserver loop completed with undelivered notifications" in WebKit, at frames 2–3
    // of a deep-link load). Later corner changes still publish from the observer.
    publish()
    const ro = new ResizeObserver(publish)
    if (tl) ro.observe(tl)
    if (tr) ro.observe(tr)
    window.addEventListener('resize', publish)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', publish)
    }
  }, [topLeft, topRight])
}
