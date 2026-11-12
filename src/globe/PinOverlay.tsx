/**
 * The dropped pin's card (DOM over the canvas, outside the R3F tree like GlobeOverlay): the spot's name and
 * coordinates, an orange arrow that searches it (the search field's own "go" button), and a close button.
 *
 *   name         reverse geocoding (imagery.reversePlace: Photon, and Nominatim too if Photon is slow), fetched the
 *                moment the pin drops; the coordinates show at once, the name follows (~0.2–0.5 s, about 2 s while
 *                Photon is stalling). Unnamed ground (open sea, ice) says so.
 *   search       the arrow (or Enter) searches the pin: the named place when the name is in, else at most
 *                PIN_NAME_WAIT_MS more for it, else the coordinates.
 *   placement    right of the pin, else left of it, else centred below (or above) it; always inside the bezel and
 *                clear of the panels (store.uiInsets), and hidden while the pin is turned away from the camera.
 *   dismiss      the ×, Esc, a click on space (PinMarker), or any search starting.
 *
 * It also draws the press ring under a finger holding toward a pin (touch: pin.ts HOLD_MS), so the hold reads as an
 * action in progress rather than as nothing happening.
 *
 * Positions are written per frame from the runtime's anchors (no React render per frame), as GlobeOverlay does.
 */
import { useEffect, useRef, useState } from 'react'
import { coordinateLabel, isAbortError, reversePlace } from '@/imagery'
import { isStacked } from '@/lib/layout'
import { useApp, type DroppedPin } from '@/state/store'
import type { Place } from '@/types'
import { Glyph } from '@/ui/system/Glyph'
import { fmtLat, fmtLon } from '@/ui/system/format'
import { safeAreaSides } from '@/ui/system/viewport'
import { HOLD_FEEDBACK_DELAY_MS, HOLD_MS } from './pin'
import { PIN_ANCHOR } from './PinMarker'
import type { GlobeRuntime } from './runtime'
import s from './PinOverlay.module.css'

/** Gap between the pin's centre and its card (CSS px): just outside the ring and its ticks. */
const CARD_GAP = 34
/** How long "Search here" waits for a name still on its way before searching the coordinates. */
const PIN_NAME_WAIT_MS = 600
const edgeFor = (stacked: boolean) => (stacked ? 22 : 28)

type Named = { pinId: number; place: Place | null }

export function PinOverlay({ runtime, onSearch }: { runtime: GlobeRuntime; onSearch?: (place: Place) => void }) {
  const pin = useApp((st) => st.pin)
  return (
    <div className={s.layer}>
      <PressRing runtime={runtime} />
      {pin && onSearch ? <PinCard key={pin.id} runtime={runtime} pin={pin} onSearch={onSearch} /> : null}
    </div>
  )
}

function PinCard({ runtime, pin, onSearch }: { runtime: GlobeRuntime; pin: DroppedPin; onSearch: (place: Place) => void }) {
  const anchorEl = useRef<HTMLDivElement>(null)
  const card = useRef<HTMLDivElement>(null)
  const [named, setNamed] = useState<Named | null>(null)
  const naming = useRef<Promise<Place | null> | null>(null)
  const [busy, setBusy] = useState(false)
  /** False once this card is gone (the pin removed or replaced, a search started): a waiting search then never runs. */
  const alive = useRef(true)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  // The name, at once.
  useEffect(() => {
    const ctl = new AbortController()
    const p = reversePlace(pin.lat, pin.lon, ctl.signal).then(
      (place) => (place.label.includes('°') ? null : place),
      (err: unknown) => {
        if (isAbortError(err)) throw err
        return null
      },
    )
    naming.current = p.catch(() => null)
    p.then(
      (place) => setNamed({ pinId: pin.id, place }),
      () => undefined,
    )
    return () => ctl.abort()
  }, [pin.id, pin.lat, pin.lon])

  // Enter searches the pin and Esc removes it, from wherever the focus is (a click on the canvas leaves it on the
  // page), except while typing in a field, on another control, or under a dialog. In the capture phase, and marked
  // handled: the app's own Esc (Main.tsx: back out of the results) must not also run for the same key.
  const searchRef = useRef<() => void>(() => undefined)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key !== 'Escape' && e.key !== 'Enter') || e.defaultPrevented || e.isComposing || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return
      const t = e.target as HTMLElement | null
      const own = !!t && !!card.current?.contains(t)
      if (!own && t && t !== document.body && t.closest?.('input, textarea, select, button, a, [contenteditable="true"], [role="dialog"]')) return
      if (e.key === 'Escape') {
        e.preventDefault()
        useApp.getState().setPin(undefined)
      } else if (!own) {
        e.preventDefault()
        searchRef.current()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])

  // Placement, every frame.
  const last = useRef({ x: NaN, y: NaN, vis: '', side: '' })
  useEffect(() => {
    const l = () => {
      const a = runtime.anchors.get(PIN_ANCHOR)
      const el = anchorEl.current
      const c = card.current
      if (!el || !c) return
      const st = last.current
      const vis = a?.visible ? '1' : '0'
      if (vis !== st.vis) {
        st.vis = vis
        el.dataset.visible = vis
      }
      if (!a?.visible) return
      const parent = el.offsetParent as HTMLElement | null
      const W = parent?.clientWidth || window.innerWidth
      const H = parent?.clientHeight || window.innerHeight
      const ins = useApp.getState().uiInsets
      const edge = edgeFor(isStacked(W, H))
      const safe = safeAreaSides()
      const lo = ins.left + edge + safe.left
      const hi = W - ins.right - edge - safe.right
      const top = ins.top + edge
      const bottom = H - ins.bottom - edge
      const w = c.offsetWidth
      const h = c.offsetHeight
      // Right of the pin, else left, else below, else above; the side it already has wins while it still fits, so a
      // globe turned under the card never flips it back and forth.
      const fits = {
        right: a.x + CARD_GAP + w <= hi,
        left: a.x - CARD_GAP - w >= lo,
        below: a.y + CARD_GAP + h <= bottom,
        above: a.y - CARD_GAP - h >= top,
      }
      const order = ['right', 'left', 'below', 'above'] as const
      const side = st.side && fits[st.side as keyof typeof fits] ? st.side : (order.find((k) => fits[k]) ?? 'below')
      let x = side === 'right' ? a.x + CARD_GAP : side === 'left' ? a.x - CARD_GAP - w : a.x - w / 2
      let y = side === 'below' ? a.y + CARD_GAP : side === 'above' ? a.y - CARD_GAP - h : a.y - h / 2
      x = Math.round(Math.max(lo, Math.min(hi - w, x)))
      y = Math.round(Math.max(top, Math.min(bottom - h, y)))
      if (x !== st.x || y !== st.y) {
        st.x = x
        st.y = y
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`
      }
      if (side !== st.side) {
        st.side = side
        el.dataset.side = side
      }
    }
    runtime.anchorListeners.add(l)
    return () => {
      runtime.anchorListeners.delete(l)
    }
  }, [runtime])

  const coords = `${fmtLat(pin.lat, 4)} ${fmtLon(pin.lon, 4)}`
  const name = named?.pinId === pin.id ? named.place : undefined // undefined: still naming; null: no name here
  const title = name ? [name.label, name.sublabel].filter(Boolean).join(', ') : undefined

  const search = async () => {
    if (busy) return
    setBusy(true)
    let place = name
    if (place === undefined && naming.current) {
      place = await Promise.race([naming.current, new Promise<null>((r) => setTimeout(() => r(null), PIN_NAME_WAIT_MS))])
      // Removed (×, Esc, a click on space) or overtaken by another search while the name was awaited: not this one.
      if (!alive.current || useApp.getState().pin?.id !== pin.id) return
    }
    // Searching ends this card (the phase change clears the pin); the place is the pin's spot exactly.
    onSearch(
      place
        ? { ...place, lat: pin.lat, lon: pin.lon, source: 'pin' }
        : { lat: pin.lat, lon: pin.lon, label: coordinateLabel(pin.lat, pin.lon), source: 'pin' },
    )
  }
  searchRef.current = () => void search()

  return (
    <div ref={anchorEl} className={s.anchor} data-visible="0">
      <div ref={card} className={s.block}>
        <div className={s.card} role="group" aria-label="Dropped pin">
          <div className={s.text}>
            <span className={s.coord}>{coords}</span>
            <span className={s.name} data-state={name === undefined ? 'naming' : name ? 'named' : 'none'} title={title}>
              {name === undefined ? 'Naming this spot' : name ? name.label : 'No named place nearby'}
              {name?.sublabel ? <span className={s.sub}> {name.sublabel}</span> : null}
            </span>
          </div>
          <button
            type="button"
            className={s.go}
            onClick={search}
            disabled={busy}
            aria-label={`Show what passed over ${name ? name.label : coords}`}
            title="Search here (Enter)"
          >
            <Glyph name="arrow-right" size={16} />
          </button>
          <button type="button" className={s.close} onClick={() => useApp.getState().setPin(undefined)} aria-label="Remove the pin" title="Remove the pin (Esc)">
            <Glyph name="close" size={11} />
          </button>
        </div>
        {/* Dropped by the landing's chip, in the middle of the globe: how to put it where you want it. */}
        {pin.via === 'chip' ? <p className={s.caption}>Hold the globe anywhere to move it</p> : null}
      </div>
      <p className="sr-only" aria-live="polite">
        {name === undefined ? `Pin dropped at ${coords}.` : `Pin dropped${name ? ` in ${title}` : ''}. Press Enter or the arrow to see what passed over it.`}
      </p>
    </div>
  )
}

/** The ring that fills under a finger held toward a pin (touch / pen). Written per frame, no React render. */
function PressRing({ runtime }: { runtime: GlobeRuntime }) {
  const el = useRef<HTMLDivElement>(null)
  const shown = useRef(false)
  useEffect(() => {
    const l = () => {
      const d = el.current
      if (!d) return
      const p = runtime.pinPress
      const want = p.at >= 0 && performance.now() - p.at >= HOLD_FEEDBACK_DELAY_MS
      if (want === shown.current) return
      shown.current = want
      if (want) {
        d.style.transform = `translate3d(${Math.round(p.x)}px, ${Math.round(p.y)}px, 0)`
        d.style.setProperty('--fill-ms', `${HOLD_MS - HOLD_FEEDBACK_DELAY_MS}ms`)
      }
      d.dataset.on = want ? '1' : '0'
    }
    runtime.anchorListeners.add(l)
    return () => {
      runtime.anchorListeners.delete(l)
    }
  }, [runtime])
  return (
    <div ref={el} className={s.press} data-on="0" aria-hidden>
      <svg width="76" height="76" viewBox="0 0 76 76">
        <circle className={s.pressTrack} cx="38" cy="38" r="34" />
        <circle className={s.pressFill} cx="38" cy="38" r="34" pathLength={100} />
      </svg>
    </div>
  )
}
