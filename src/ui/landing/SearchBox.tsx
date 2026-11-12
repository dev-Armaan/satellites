/**
 * Place search: a combobox over `imagery.searchPlaces` (Photon / OSM, the offline place list and Open-Meteo when
 * Photon is slow; coordinates are accepted too). Offline rows can show before the search is done; later rows only
 * ever join below them.
 *
 *   typing      debounced 220 ms, previous request aborted
 *   ↑ / ↓       move through suggestions (wraps through "none")
 *   Enter       choose the highlighted suggestion, else the first; if results are stale, search now
 *   Esc         close the list, then clear, then leave the field
 *   /           focus the field from anywhere (unless already typing somewhere)
 *
 * States shown in the field's status slot and the list: searching, results, no match, unavailable.
 * ARIA 1.2 combobox pattern: the input owns a listbox via aria-controls / aria-activedescendant.
 *
 * The list shows five rows, capped (in CSS) to the room between where it will sit and the bottom
 * corner readouts, and to the space above the on-screen keyboard (visualViewport), so every option
 * can be scrolled into view while typing on a phone; an overflowing list ends on a fade, never on a
 * cut row. `onBeforeFocus` lets the landing move the field before a touch focuses it (see
 * Landing.tsx: iOS pans to the focused field, so it must already be where it will stay);
 * `onListChange` lets it make room for the list (wide layouts lift the field when it opens).
 */
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { isAbortError, searchPlaces } from '@/imagery'
import type { Place } from '@/types'
import { Field, Glyph, Kbd, cx, fmtLat, fmtLon, useIsMobile } from '@/ui/system'
import { canSubmitQuery, clampActive, enterTarget, isTypingTarget, stepActive } from './listNav'
import s from './SearchBox.module.css'

const DEBOUNCE_MS = 220
const MIN_QUERY = 2

type Status = 'idle' | 'searching' | 'error'

export function SearchBox({
  onSubmit,
  onFocusChange,
  disabled,
  autoFocus,
  idleTrailing,
  statusOverride,
  metaHidden,
  onBeforeFocus,
  onListChange,
  onQueryChange,
  liftedBy,
  placeholder = 'Search a place',
}: {
  onSubmit: (place: Place) => void
  /** The empty field's prompt ("Search another place" from results) */
  placeholder?: string
  onFocusChange?: (focused: boolean) => void
  disabled?: boolean
  autoFocus?: boolean
  /** Shown at the end of the line while the field is empty (e.g. "Use my location") */
  idleTrailing?: ReactNode
  /** Replaces the search status above the line (e.g. a locating readout) */
  statusOverride?: ReactNode
  /** Visually hide the label + status row (still read by assistive tech) */
  metaHidden?: boolean
  /**
   * Touch: called on a tap of the unfocused field, before it is focused, so the caller can move it to
   * where it will sit while typing. The field is then focused programmatically.
   */
  onBeforeFocus?: () => void
  /** The suggestion list became visible with at least one option (true), or closed (false). */
  onListChange?: (open: boolean) => void
  /** The text in the field changed (typed, cleared, or set by a choice). */
  onQueryChange?: (query: string) => void
  /**
   * How far (px) the caller has moved the field up with a transform that is still playing when the
   * list opens (wide layouts lift it as the list appears): the list is capped to where it will sit.
   */
  liftedBy?: () => number
}) {
  const mobile = useIsMobile()
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()
  const inputId = useId()
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<{ q: string; places: Place[] } | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [active, setActive] = useState(-1)
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const ctrl = useRef<AbortController | null>(null)
  const timer = useRef(0)
  const queryRef = useRef('')
  queryRef.current = query

  const places = result?.places ?? []
  const fresh = !!result && result.q === query.trim()

  /** Search now. Resolves with the places for `q` (empty when aborted, failed or too short). */
  const run = useCallback((q: string): Promise<Place[]> => {
    ctrl.current?.abort()
    window.clearTimeout(timer.current)
    const trimmed = q.trim()
    if (trimmed.length < MIN_QUERY) {
      setResult(null)
      setStatus('idle')
      setOpen(false)
      return Promise.resolve([])
    }
    const c = new AbortController()
    ctrl.current = c
    setStatus('searching')
    // The offline list's rows, while the network is still out: shown at once (still "searching"); the final answer
    // keeps them in place and only adds below them.
    const early = (found: Place[]) => {
      if (c.signal.aborted) return
      setResult({ q: trimmed, places: found })
      setActive((a) => clampActive(a, found.length))
      setOpen(true)
    }
    return searchPlaces(trimmed, c.signal, early).then(
      (found) => {
        if (c.signal.aborted) return []
        setResult({ q: trimmed, places: found })
        setStatus('idle')
        setActive((a) => clampActive(a, found.length))
        setOpen(true)
        return found
      },
      (err: unknown) => {
        if (c.signal.aborted || isAbortError(err)) return []
        setResult({ q: trimmed, places: [] })
        setStatus('error')
        setOpen(true)
        return []
      },
    )
  }, [])

  useEffect(
    () => () => {
      ctrl.current?.abort()
      window.clearTimeout(timer.current)
    },
    [],
  )

  // "/" focuses the search from anywhere.
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return
      // Not while a modal (About) is open: the field is behind it.
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return
      e.preventDefault()
      inputRef.current?.focus()
      inputRef.current?.select()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const choose = (place: Place) => {
    ctrl.current?.abort()
    window.clearTimeout(timer.current)
    setQuery(place.label)
    setOpen(false)
    setActive(-1)
    // Submit first, then let go of the field: the caller knows it is leaving when the blur arrives,
    // and skips measuring a layout it will never animate.
    onSubmit(place)
    inputRef.current?.blur()
  }

  const submit = () => {
    if (fresh && places.length) {
      choose(places[enterTarget(active, places.length)])
      return
    }
    const q = query
    void run(q).then((found) => {
      // Only act if the user hasn't typed since.
      if (found.length && queryRef.current === q) choose(found[0])
    })
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        if (!places.length) return
        e.preventDefault()
        setOpen(true)
        setActive((a) => stepActive(open ? a : -1, places.length, e.key === 'ArrowDown' ? 1 : -1))
        break
      }
      case 'Enter':
        if (e.nativeEvent.isComposing) return
        e.preventDefault()
        submit()
        break
      case 'Escape':
        if (open) {
          setOpen(false)
          setActive(-1)
        } else if (query) {
          ctrl.current?.abort()
          setQuery('')
          setResult(null)
          setStatus('idle')
        } else {
          inputRef.current?.blur()
        }
        break
      case 'Tab':
        setOpen(false)
        break
    }
  }

  const statusText =
    status === 'searching' ? (
      'Searching'
    ) : status === 'error' && fresh ? (
      'Search unavailable'
    ) : fresh ? (
      places.length ? (
        `${places.length} ${places.length === 1 ? 'match' : 'matches'}`
      ) : (
        'No match'
      )
    ) : focused && !query ? (
      'Name, address or lat, lon'
    ) : undefined

  // A touch tap on a suggestion is chosen when the finger lifts, not on its click: iOS Safari moves focus off the
  // field first (pointerdown's preventDefault doesn't stop that on touch), the blur closes the list, and the click
  // then lands on whatever is under it, so the place was never chosen (the field kept the typed text and waited for
  // the arrow). A lift that moved (a scroll of the list) chooses nothing; the scroll cancels the pointer anyway.
  const optTap = useRef<{ id: number; i: number; x: number; y: number } | null>(null)
  const touchChoseAt = useRef(-Infinity)
  /** The field lost focus during a touch on a suggestion; its blur is reported when the touch ends (releaseBlur). */
  const blurHeld = useRef(false)
  const releaseBlur = () => {
    if (!blurHeld.current) return
    blurHeld.current = false
    if (document.activeElement === inputRef.current) return
    setOpen(false)
    cb.current.onFocusChange?.(false)
  }
  // A finger on a suggestion keeps the list up even if the field has already lost focus (see optTap).
  const [touchingList, setTouchingList] = useState(false)
  const showList = open && (focused || touchingList) && fresh
  const activeId = showList && active >= 0 ? `${listId}-${active}` : undefined

  // Report the list's visibility (with options) to the caller, which may move the field for it.
  const listOpen = showList && places.length > 0
  const cb = useRef({ onListChange, onQueryChange, liftedBy, onFocusChange })
  cb.current = { onListChange, onQueryChange, liftedBy, onFocusChange }
  const reportedOpen = useRef(false)
  useLayoutEffect(() => {
    if (listOpen === reportedOpen.current) return
    reportedOpen.current = listOpen
    cb.current.onListChange?.(listOpen)
  }, [listOpen])
  const firstQuery = useRef(true)
  useEffect(() => {
    if (firstQuery.current) {
      firstQuery.current = false
      return
    }
    cb.current.onQueryChange?.(query)
  }, [query])

  // Keep the list in view. CSS caps it at five rows and at the room between its top (--list-top) and
  // the bottom corner readouts; on phones the space above the on-screen keyboard (the *visual*
  // viewport, which ends at the keyboard's top: innerHeight does not change when iOS / Android open it)
  // caps it too (--kb-max). Its top is read from layout offsets, which ignore the landing's lift
  // animations (a FLIP on phones, the wide lift's transform), so it is where the list will sit, read
  // once per opening; viewport changes re-read it.
  const listRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const list = listRef.current
    if (!showList || !list) return
    let raf = 0
    const measure = () => {
      raf = 0
      let top = 0
      for (let el: HTMLElement | null = list; el; el = el.offsetParent as HTMLElement | null) top += el.offsetTop
      top -= cb.current.liftedBy?.() ?? 0
      list.style.setProperty('--list-top', `${Math.round(top)}px`)
      const vv = window.visualViewport
      if (vv && vv.height < window.innerHeight - 80) {
        // Just clear of the keyboard.
        list.style.setProperty('--kb-max', `${Math.max(120, Math.floor(vv.offsetTop + vv.height - top - 8))}px`)
      } else list.style.removeProperty('--kb-max')
    }
    const later = () => {
      if (!raf) raf = requestAnimationFrame(measure)
    }
    measure()
    window.addEventListener('resize', later)
    window.visualViewport?.addEventListener('resize', later)
    window.visualViewport?.addEventListener('scroll', later)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', later)
      window.visualViewport?.removeEventListener('resize', later)
      window.visualViewport?.removeEventListener('scroll', later)
    }
  }, [showList])

  // An overflowing list fades out at the bottom (until it is scrolled to its end), so it never ends on
  // a cut row. Read after layout (ResizeObserver), when it costs nothing.
  const markOverflow = () => {
    const list = listRef.current
    if (!list) return
    const more = list.scrollHeight - list.clientHeight - list.scrollTop > 2
    if (more) list.dataset.overflow = ''
    else delete list.dataset.overflow
  }
  useLayoutEffect(() => {
    const list = listRef.current
    if (!showList || !list || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(markOverflow)
    ro.observe(list)
    if (list.lastElementChild) ro.observe(list.lastElementChild)
    return () => ro.disconnect()
  }, [showList])

  // Touch tap on the unfocused field: let the caller lift it first, then focus it ourselves. The
  // press's own focus/click are suppressed (the field is no longer under the finger by then).
  const tap = useRef<{ id: number; x: number; y: number } | null>(null)
  const onPointerDown = (e: React.PointerEvent<HTMLInputElement>) => {
    if (!onBeforeFocus || e.pointerType !== 'touch' || focused || disabled) return
    e.preventDefault()
    tap.current = { id: e.pointerId, x: e.clientX, y: e.clientY }
  }
  const onPointerUp = (e: React.PointerEvent<HTMLInputElement>) => {
    const t = tap.current
    tap.current = null
    if (!t || t.id !== e.pointerId || Math.hypot(e.clientX - t.x, e.clientY - t.y) > 12) return
    onBeforeFocus?.()
    inputRef.current?.focus({ preventScroll: true })
    swallowGhostClick(t.x, t.y)
  }
  // The primary action only shows when it can do something: never next to "No match" or "unavailable".
  const canSubmit = canSubmitQuery(query, MIN_QUERY, result && { q: result.q, count: result.places.length })

  return (
    <div className={s.search}>
      <Field
        ref={inputRef}
        id={inputId}
        size="lg"
        className={s.field}
        label={
          <>
            {/* the index is decoration: the accessible name is just "Place" */}
            <span aria-hidden>
              <span className={s.idx}>01</span> /{' '}
            </span>
            Place
          </>
        }
        status={statusOverride ?? statusText}
        metaHidden={metaHidden}
        busy={status === 'searching'}
        invalid={status === 'error' && fresh}
        leading={<Glyph name="search" size={16} />}
        trailing={
          <>
            {/* the "/" shortcut, where a keyboard is likely: gone once you're in the field */}
            {!query && !focused && !mobile ? <Kbd className={s.kbd}>/</Kbd> : null}
            {query && !disabled ? (
              <button
                type="button"
                className={s.clear}
                aria-label="Clear search"
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => {
                  ctrl.current?.abort()
                  setQuery('')
                  setResult(null)
                  setStatus('idle')
                  inputRef.current?.focus()
                }}
              >
                <Glyph name="close" size={12} />
              </button>
            ) : null}
            {canSubmit ? (
              <button
                type="button"
                className={s.go}
                aria-label="Show what passed over this place"
                onPointerDown={(e) => e.preventDefault()}
                onClick={submit}
                disabled={disabled}
              >
                <Glyph name="arrow-right" size={16} />
              </button>
            ) : !query ? (
              idleTrailing
            ) : null}
          </>
        }
        placeholder={placeholder}
        value={query}
        disabled={disabled}
        autoFocus={autoFocus}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={activeId}
        aria-autocomplete="list"
        aria-keyshortcuts="/"
        enterKeyHint="search"
        inputMode="search"
        onChange={(e) => {
          const v = e.target.value
          setQuery(v)
          setActive(-1)
          window.clearTimeout(timer.current)
          if (v.trim().length < MIN_QUERY) {
            ctrl.current?.abort()
            setResult(null)
            setStatus('idle')
            setOpen(false)
            return
          }
          timer.current = window.setTimeout(() => void run(v), DEBOUNCE_MS)
        }}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (tap.current = null)}
        onFocus={() => {
          setFocused(true)
          if (fresh) setOpen(true)
          onFocusChange?.(true)
        }}
        onBlur={() => {
          setFocused(false)
          // A blur from a finger on a suggestion (iOS): the list stays up, and the caller is told only once that tap
          // is chosen or cancelled (the phone landing moves the field back down on a blur, away from the finger).
          if (optTap.current) {
            blurHeld.current = true
            return
          }
          setOpen(false)
          onFocusChange?.(false)
        }}
      />

      <div ref={listRef} className={cx(s.list, showList && s.listOpen)} onScroll={markOverflow} data-suggestions>
        {/* Messages sit outside the listbox: only options belong in it. The field's status announces them. */}
        {showList && status === 'error' ? (
          <p className={s.empty}>The place search isn’t answering. Coordinates such as 43.47, −80.54 still work.</p>
        ) : null}
        {showList && status !== 'error' && !places.length ? (
          <p className={s.empty}>Nothing matches “{result?.q}”. Try a city, a landmark, or coordinates.</p>
        ) : null}
        <div id={listId} role="listbox" aria-label="Places">
          {showList
            ? places.map((p, i) => (
                <div
                  key={`${p.lat},${p.lon},${p.label}`}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  className={cx(s.option, i === active && s.active)}
                  onPointerDown={(e) => {
                    e.preventDefault()
                    // Touch and pen (an Apple Pencil on iOS blurs the field just the same); a mouse chooses on click.
                    optTap.current = e.pointerType !== 'mouse' ? { id: e.pointerId, i, x: e.clientX, y: e.clientY } : null
                    if (optTap.current) setTouchingList(true)
                  }}
                  onPointerMove={() => i !== active && setActive(i)}
                  onPointerUp={(e) => {
                    const t = optTap.current
                    optTap.current = null
                    setTouchingList(false)
                    if (!t || t.id !== e.pointerId || t.i !== i || Math.hypot(e.clientX - t.x, e.clientY - t.y) > 12) return releaseBlur()
                    touchChoseAt.current = performance.now()
                    choose(p)
                    releaseBlur()
                  }}
                  onPointerCancel={() => {
                    optTap.current = null
                    setTouchingList(false)
                    releaseBlur()
                  }}
                  onClick={() => {
                    // A touch tap was already chosen on its pointerup (above): this is its click.
                    if (performance.now() - touchChoseAt.current < 1000) return
                    choose(p)
                  }}
                >
                  <span className={s.optText}>
                    <span className={s.optLabel}>{p.label}</span>
                    {p.sublabel ? <span className={s.optSub}>{p.sublabel}</span> : null}
                  </span>
                  {/* a place named by its own coordinates (open sea, geocoder offline) doesn't repeat them */}
                  {p.label.includes('°') ? null : (
                    <span className={s.optCoord}>
                      {fmtLat(p.lat, 2)} {fmtLon(p.lon, 2)}
                    </span>
                  )}
                </div>
              ))
            : null}
        </div>
      </div>
    </div>
  )
}

/** Swallow the click a touch tap produces after the layout moved under the finger. */
function swallowGhostClick(x: number, y: number) {
  const done = () => {
    document.removeEventListener('click', onClick, true)
    window.clearTimeout(timer)
  }
  const onClick = (e: MouseEvent) => {
    if (Math.hypot(e.clientX - x, e.clientY - y) < 32) {
      e.preventDefault()
      e.stopPropagation()
    }
    done()
  }
  document.addEventListener('click', onClick, true)
  const timer = window.setTimeout(done, 700)
}
