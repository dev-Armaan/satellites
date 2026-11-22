/**
 * Panel headers.
 *
 * OverviewHeader: one header from computing through results (decision #10).
 *
 *   COMPUTING · T+1.84 S                           CANCEL [ESC]       ← computing: two mono rows
 *   WATERLOO · 43.4723°N 80.5449°W · AMERICA/TORONTO
 *
 *   [⌕ Waterloo                                        CHANGE]        ← results: the search bar alone (owner: no
 *                                                                        dates, coordinates or zone), as tall as the
 *                                                                        two rows it replaces, so nothing moves
 *
 * Phones then have the headline and its second line (with the week's Share at its end) under the bar, across the
 * sheet's full width (the peek shows them with the hero).
 *
 * DetailHeader: back crumb, "3 / 31 ‹ ›" stepping within the pass's verdict (chevrons, so stepping never
 * reads as the ← of "back"), name, local time. A pass with a photo drops the stepper (the gallery under it
 * has its own counter and ‹ ›) and its name and time change in place, with a short fade, as you swipe.
 * A share recipient sees a one-line tag above it (R2R10): SHARED WITH YOU · SENTINEL-2C WATCHED WATERLOO.
 *
 * Words: the 'results' namespace (head, and the shared searchAnother / allPasses), read at render. Coordinates, clocks
 * and zone names are international notation; place and satellite names are data, shown as they are.
 */
import { memo, useEffect, useLayoutEffect, useRef, type KeyboardEvent } from 'react'
import enResults from '@/i18n/en/results'
import enSystem from '@/i18n/en/system'
import { msgs, useMsgs } from '@/i18n/runtime'
import { timeZoneAt } from '@/imagery'
import { useApp } from '@/state/store'
import type { Pass, Place } from '@/types'
import { SearchBox } from '@/ui/landing/SearchBox'
import { Glyph, Kbd, LiveDot, ScrambleOnce, cx, fmtLat, fmtLon, useMediaQuery } from '@/ui/system'
import { secs } from './ComputingBody'
import { Mark } from './Mark'
import { useOnce } from './once'
import { ReplayStrip } from './ReplayControls'
import { Headline, MoreLine, countPending } from './Summary'
import { clearPass } from './actions'
import { ONE_LINE_TITLE_QUERY, SHORT_DESK_QUERY } from './shell'
import { glyphForPass, markColorVar } from './lib/meta'
import { stepPass } from './lib/timeline'
import { utcLabel, utcOffsetMin, zoneLabel } from './lib/time'
import type { ResultsModel } from './model'
import { placeName } from './placeName'
import s from './results.module.css'

/** A live dot that renders once: its wall-second sync must not run on every header render. */
const StillLiveDot = memo(function StillLiveDot() {
  return <LiveDot className={s.liveDot} />
})

// ── recent places (this session) ─────────────────────────────────────────────────────────

const recent: Place[] = []
/** Remember a place whose results were shown (newest first, unique, at most 4). */
export function rememberPlace(p: Place) {
  const i = recent.findIndex((r) => Math.abs(r.lat - p.lat) < 1e-4 && Math.abs(r.lon - p.lon) < 1e-4)
  if (i >= 0) recent.splice(i, 1)
  recent.unshift(p)
  recent.length = Math.min(recent.length, 4)
}

// ── overview / computing ─────────────────────────────────────────────────────────────────

interface OverviewHeaderProps {
  place?: Place
  model?: ResultsModel
  computing: boolean
  /** performance.now() when computing started (for T+) */
  t0: number
  mobile: boolean
  enter: boolean
  searching: boolean
  onBack: () => void
  onCancel: () => void
  onOpenSearch?: () => void
  onCloseSearch: () => void
  onSearch?: (p: Place) => void
  onRetry?: () => void
  /** Phones: the headline's Share (the week's summary) */
  onShareWeek?: () => void
}

export function OverviewHeader(props: OverviewHeaderProps) {
  const { place, model, computing, mobile, enter, searching } = props
  const m = useMsgs(enResults).head
  const tz = model?.tz ?? (place ? timeZoneAt(place.lat, place.lon) : undefined)
  const partial = !computing && !!model && countPending(model.report)
  // Results: the search bar is the whole top, on every layout (owner). Computing and the open search keep their rows.
  const bar = !computing && !searching && !!place && !!model
  const showPlaceRow = !!place && (!mobile || computing) && !searching && !bar

  return (
    <div className={cx(s.overviewHead, bar && s.overviewHeadBar)}>
      {bar && place ? <SearchBar place={place} desk={!mobile} onOpen={props.onOpenSearch ?? props.onBack} /> : null}
      <div className={cx(s.headTop, bar && s.headTopOff)}>
        <span className={s.headLeft}>
          {computing ? (
            <ComputeClock t0={props.t0} />
          ) : searching ? null /* the open search keeps only its Close (no dates: owner) */ : (
            <>
              <span className={cx(s.headSwap, partial && s.headSwapOff)} aria-hidden={partial}>
                {model ? windowText(model) : null}
              </span>
              <span className={cx(s.headSwap, s.live, !partial && s.headSwapOff)} aria-hidden={!partial}>
                <StillLiveDot />
                {m.verifying}
              </span>
            </>
          )}
        </span>
        <HeadAction
          mode={computing ? 'cancel' : searching ? 'close' : 'search'}
          // Phones: the search bar below is the way to a new search; the corner keeps only Cancel / Close.
          quietSearch={mobile}
          outlined={!mobile}
          onCancel={props.onCancel}
          onClose={props.onCloseSearch}
          onSearch={props.onOpenSearch ?? props.onBack}
        />
      </div>


      {showPlaceRow && place ? <PlaceRow place={place} tz={tz} /> : null}

      {searching ? (
        <InlineSearch onSearch={props.onSearch} onClose={props.onCloseSearch} current={place} />
      ) : mobile && model && !computing ? (
        <div className={s.mHead}>
          <Headline model={model} compact enter={enter} />
          <MoreLine model={model} compact enter={enter} onRetry={props.onRetry} onShare={props.onShareWeek} />
        </div>
      ) : null}
    </div>
  )
}

/**
 * The header's one action: Cancel (computing) · New search (results) · Close (the inline search open). One button
 * whose three labels share a grid cell, so it keeps the width of the longest: switching never moves it, or the row
 * (R3-8: no layout shift at results arrival, New search, a new place).
 */
function HeadAction({
  mode,
  quietSearch = false,
  outlined = false,
  onCancel,
  onClose,
  onSearch,
}: {
  mode: 'cancel' | 'search' | 'close'
  /** Phones: the search mode's label steps aside (the search bar takes that job); the button keeps its box */
  quietSearch?: boolean
  /** Desktop: an outlined button, not a faint label */
  outlined?: boolean
  onCancel: () => void
  onClose: () => void
  onSearch: () => void
}) {
  const label = (which: typeof mode) => cx(s.crumbLabel, mode !== which && s.crumbLabelOff)
  const hidden = quietSearch && mode === 'search'
  const m = useMsgs(enResults).head
  return (
    <button
      type="button"
      className={cx(s.crumb, outlined && s.crumbOutlined, hidden && s.crumbHidden)}
      onClick={mode === 'cancel' ? onCancel : mode === 'close' ? onClose : onSearch}
      aria-keyshortcuts="Escape"
      aria-hidden={hidden || undefined}
      tabIndex={hidden ? -1 : undefined}
    >
      <span className={s.crumbLabels}>
        <span className={label('cancel')} aria-hidden={mode !== 'cancel' || undefined}>
          {m.cancel}
        </span>
        <span className={label('search')} aria-hidden={mode !== 'search' || undefined}>
          <Glyph name="search" size={11} />
          {m.newSearch}
        </span>
        <span className={label('close')} aria-hidden={mode !== 'close' || undefined}>
          <Glyph name="close" size={11} />
          {m.close}
        </span>
      </span>
      <span className={s.kbdHover} aria-hidden>
        <Kbd>{m.escKey}</Kbd>
      </span>
    </button>
  )
}

/**
 * The way to a new search, the whole top of the results: it looks like the landing's search field (the same glyph and
 * mono line) holding the current place, with "Change" at its end; a tap anywhere opens the inline search with the
 * field focused. As tall as the two computing rows it replaces. Laptops (`desk`): the panel header's rule under it,
 * not its own hairline.
 */
function SearchBar({ place, desk = false, onOpen }: { place: Place; desk?: boolean; onOpen: () => void }) {
  const m = useMsgs(enResults).head
  return (
    <button type="button" className={cx(s.searchBar, desk && s.searchBarDesk)} onClick={onOpen} aria-label={m.searchBarLabel(placeName(place))}>
      <span className={s.searchBarGlyph} aria-hidden>
        <Glyph name="search" size={16} />
      </span>
      <span className={s.searchBarPlace}>{placeName(place)}</span>
      <span className={s.searchBarAction} aria-hidden>
        {m.change}
      </span>
    </button>
  )
}

/**
 * "WATERLOO · 43.46°N 80.52°W · UTC−5 · AT SEA" on one line (R3-8). The zone is the least of the three, and it gives
 * way whole, never cut mid-word: where the full label does not fit, an ocean's zone shows its offset alone ("UTC−5",
 * the same number the label starts with), and where that does not fit either the zone and its separator go. The row
 * measures itself (the words' width depends on the language and its font), again whenever its box or a font changes.
 */
function PlaceRow({ place, tz }: { place: Place; tz?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const now = Date.now()
  const full = tz ? zoneLabel(now, tz) : undefined
  const short = tz?.startsWith('Etc/') ? utcLabel(utcOffsetMin(now, tz)) : undefined
  useLayoutEffect(() => {
    const row = ref.current
    const zone = row?.querySelector<HTMLElement>(`.${s.tzText}`)
    if (!row || !zone) return
    // Cut at all: scrollWidth rounds to whole pixels, so the words' own width catches a fraction too.
    const words = document.createRange()
    const cut = () => {
      words.selectNodeContents(zone)
      return zone.scrollWidth > zone.clientWidth || words.getBoundingClientRect().width > zone.getBoundingClientRect().width + 0.25
    }
    const fit = () => {
      delete row.dataset.zone
      if (!cut()) return
      if (short) {
        row.dataset.zone = 'short'
        if (!cut()) return
      }
      row.dataset.zone = 'none'
    }
    fit()
    if (typeof ResizeObserver === 'undefined') return
    // The row's own box: hiding the zone frees room inside it but never resizes it, so fitting never wakes this again.
    const ro = new ResizeObserver(fit)
    ro.observe(row)
    document.fonts?.addEventListener('loadingdone', fit)
    return () => {
      ro.disconnect()
      document.fonts?.removeEventListener('loadingdone', fit)
    }
  }, [place, full, short])
  return (
    <div ref={ref} className={s.placeRow}>
      <b>{placeName(place)}</b>
      <span className={s.sep}>·</span>
      <Coords lat={place.lat} lon={place.lon} />
      {full ? (
        <>
          <span className={cx(s.sep, s.tzPart)}>·</span>
          <span className={cx(s.tzText, s.tzPart)}>
            <span className={s.tzFull}>{full}</span>
            {short ? <span className={s.tzShort}>{short}</span> : null}
          </span>
        </>
      ) : null}
    </div>
  )
}

/** Coordinates scramble once per place this session, even if the panel is remounted. */
function Coords({ lat, lon }: { lat: number; lon: number }) {
  const text = `${fmtLat(lat)} ${fmtLon(lon)}`
  const first = useOnce(`coords:${text}`)
  return first ? <ScrambleOnce key={text} text={text} className={s.coordsText} /> : <span className={s.coordsText}>{text}</span>
}

/** "7 days · 1 → 8 Nov", in the active language (read at call time) */
function windowText(model: ResultsModel): string {
  const { report, tz, windowDays } = model
  return msgs(enResults).head.windowSpan(Math.round(windowDays), report.windowStart, report.windowEnd, tz)
}

/** "COMPUTING · T+1.84 S", written through a ref at 10 Hz (the header never re-renders for it). */
function ComputeClock({ t0 }: { t0: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const m = useMsgs(enResults).head
  useEffect(() => {
    const tick = () => {
      if (ref.current) ref.current.textContent = `T+${secs(performance.now() - t0)}`
    }
    tick()
    const id = window.setInterval(tick, 100)
    return () => window.clearInterval(id)
  }, [t0])
  return (
    <>
      <span className={s.computingWord}>{m.computing}</span>
      <span className={s.sep}>·</span>
      <span ref={ref} className={s.clock} />
    </>
  )
}

/** R16: a second place in one step. The first Esc closes the field (a second one leaves, as ever). */
function InlineSearch({ onSearch, onClose, current }: { onSearch?: (p: Place) => void; onClose: () => void; current?: Place }) {
  const chips = recent.filter((p) => !current || Math.abs(p.lat - current.lat) > 1e-4 || Math.abs(p.lon - current.lon) > 1e-4).slice(0, 3)
  const m = useMsgs(enResults)
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      onClose()
    }
  }
  const submit = (p: Place) => {
    onSearch?.(p)
    onClose()
  }
  return (
    <div className={s.inlineSearch} onKeyDownCapture={onKey}>
      <SearchBox onSubmit={submit} autoFocus placeholder={m.searchAnother} />
      {chips.length ? (
        <div className={s.recent}>
          <span className={s.recentLabel}>{m.head.recent}</span>
          {chips.map((p) => (
            <button key={`${p.lat},${p.lon}`} type="button" className={s.chip} onClick={() => submit(p)}>
              {placeName(p)}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

// ── pass detail ──────────────────────────────────────────────────────────────────────────

interface DetailHeaderProps {
  model: ResultsModel
  pass: Pass
  mobile: boolean
  onSelect: (p: Pass) => void
  /** Phones: show the compact replay strip (replay/scrub, camera not flying) */
  strip: boolean
  /** A pass with a photo: the gallery steps (no stepper here); the title changes in place */
  photo?: boolean
  /** A shared link is open (R2R10): the tag above the header */
  shared?: { sat: string; place: string }
  /** Phones: a new search in one tap (back to the list with the search open) */
  onSearch?: () => void
}

/** Pass header: back, position within the verdict with ‹ ›, the satellite, its local time. */
export function DetailHeader({ model, pass, mobile, onSelect, strip, photo, shared, onSearch }: DetailHeaderProps) {
  const meta = model.meta(pass.norad)
  const lane = model.lanes[pass.verdict].passes
  const index = lane.findIndex((p) => p.id === pass.id)
  const step = (dir: 1 | -1) => {
    const next = stepPass(model.lanes, pass, dir)
    if (next && next.id !== pass.id) onSelect(next)
  }
  const r = useMsgs(enResults)
  const sys = useMsgs(enSystem)
  const m = r.head
  const t = model.times(pass)
  // Phones and short laptops: the name and the time on one line (R2R1: the pass photo gets the height).
  const oneLine = useMediaQuery(ONE_LINE_TITLE_QUERY) || mobile
  // Laptops up to 860 px tall (1280×800): the back crumb rides on the title's row, so the pass photo reaches the
  // column's full width (R3-6).
  const inline = useMediaQuery(SHORT_DESK_QUERY) && !mobile
  // The strip shows once the camera has arrived and the scene is replaying or held (MOB-16).
  // Once shown in this header, it stays while the scene is in replay time: a quiet selection's short camera
  // move never blinks it off and on (A1).
  const live = useApp((st) => st.timeMode === 'live')
  const flying = useApp((st) => st.cameraFlight.flying)
  const stripSeen = useRef(false)
  if (live) stripSeen.current = false
  else if (!flying) stripSeen.current = true
  const replayOn = !live && (!flying || stripSeen.current)
  // A quiet selection (a swipe) changes the title in place: a 160 ms fade of the words, never the header.
  const firstId = useRef(pass.id)
  const titleKey = photo ? pass.id : 'one'
  const titleCls = photo && pass.id !== firstId.current ? s.titleIn : undefined
  const [posLead, posTail] = sys.counter(index + 1, lane.length)
  const stepper = (
    <span className={cx(s.stepper, photo && s.stepperOff)} aria-hidden={photo || undefined}>
      <span className={s.position} aria-label={m.position(index + 1, lane.length)}>
        {/* The counter as the language writes it, as the gallery's does ("124 / 1,565", "124 / 1.565", "124 trên 1.565"). */}
        {posLead}
        {/* A big lane on a narrow phone (V1: "1350 / 1362" crowded the row): the position alone. */}
        <span className={cx(lane.length >= 1000 && s.positionTotalLong)}>{posTail}</span>
      </span>
      <button type="button" className={s.stepBtn} onClick={() => step(-1)} disabled={index <= 0} aria-label={m.previous} aria-keyshortcuts="ArrowLeft" title={m.previousTitle}>
        <Mark name="chevron-left" size={12} />
      </button>
      <button type="button" className={s.stepBtn} onClick={() => step(1)} disabled={index >= lane.length - 1} aria-label={m.next} aria-keyshortcuts="ArrowRight" title={m.nextTitle}>
        <Mark name="chevron-right" size={12} />
      </button>
    </span>
  )
  if (inline)
    return (
      <div className={s.detailHead}>
        {shared ? (
          <p className={s.sharedTag}>
            <span className={s.sharedDot} aria-hidden />
            <span className={s.sharedText}>{m.shared(shared.sat, shared.place)}</span>
          </p>
        ) : null}
        <div className={cx(s.headTop, s.headInline)}>
          <button type="button" className={cx(s.crumb, s.crumbIcon)} onClick={clearPass} aria-label={r.allPasses} title={m.allPassesTitle} aria-keyshortcuts="Escape">
            <Glyph name="arrow-left" size={12} />
          </button>
          <div key={titleKey} className={cx(s.passTitle, s.passTitleCompact, s.passTitleInline, titleCls)}>
            <Mark name={glyphForPass(pass.verdict, meta.category)} size={14} color={markColorVar(pass.verdict, meta.category)} />
            <h1 className={s.passName}>{meta.name}</h1>
            <span className={s.passWhen}>{m.passWhen(pass.tClosest, model.tz, t.parts, t.time, t.zone, !!pass.geostationary)}</span>
          </div>
          {photo ? null : stepper}
        </div>
      </div>
    )
  return (
    <div className={s.detailHead}>
      {shared ? (
        <p className={s.sharedTag}>
          <span className={s.sharedDot} aria-hidden />
          <span className={s.sharedText}>{m.shared(shared.sat, shared.place)}</span>
        </p>
      ) : null}
      <div className={s.headTop}>
        <button type="button" className={s.crumb} onClick={clearPass} aria-keyshortcuts="Escape">
          <Glyph name="arrow-left" size={11} />
          {r.allPasses}
          <span className={s.kbdHover} aria-hidden>
            <Kbd>{m.escKey}</Kbd>
          </span>
        </button>
        <span className={s.headTopEnd}>
          {stepper}
          {mobile && onSearch ? (
            <button type="button" className={s.searchIcon} onClick={onSearch} aria-label={r.searchAnother} title={r.searchAnother}>
              <Glyph name="search" size={14} />
            </button>
          ) : null}
        </span>
      </div>
      {oneLine ? (
        // Phones: name and time on one line, so the flight snap stays low (≤ 25 % of the screen).
        <div key={titleKey} className={cx(s.passTitle, s.passTitleCompact, titleCls)}>
          <Mark name={glyphForPass(pass.verdict, meta.category)} size={14} color={markColorVar(pass.verdict, meta.category)} />
          <h1 className={s.passName}>{meta.name}</h1>
          <span className={s.passWhen}>{m.passWhen(pass.tClosest, model.tz, t.parts, t.time, t.zone, !!pass.geostationary)}</span>
        </div>
      ) : (
        <div key={titleKey} className={titleCls}>
          <div className={s.passTitle}>
            <Mark name={glyphForPass(pass.verdict, meta.category)} size={18} color={markColorVar(pass.verdict, meta.category)} />
            <h1 className={s.passName}>{meta.name}</h1>
          </div>
          <div className={s.placeSub}>
            <b>
              {/* A geostationary scan's crossing is known to about a minute (engine geostationary.ts). */}
              {m.passWhen(pass.tClosest, model.tz, t.parts, pass.geostationary ? t.time : t.timeS, t.zone, !!pass.geostationary)}
            </b>
            {meta.operator ? <span>{meta.operator}</span> : null}
          </div>
        </div>
      )}
      {/* Phones: the strip's row is reserved from the start (no header height change, so no layout shift, when the
          camera lands); it fades in once the scene is replaying or held there (MOB-16). */}
      {strip ? (
        <div className={cx(s.stripSlot, replayOn && s.stripOn)} inert={!replayOn || undefined}>
          <ReplayStrip pass={pass} />
        </div>
      ) : null}
    </div>
  )
}
