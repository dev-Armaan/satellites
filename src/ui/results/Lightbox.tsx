/**
 * The lightbox (owner B + B2): the same viewer on every device, a full-viewport ink layer over the globe and
 * the panel (below the share sheet).
 *
 *   phones   edge to edge (safe areas respected). Swipe left / right between photos, pinch to zoom (1×–6×) and
 *            pan, double-tap zooms 2.5× at the tap and back, swipe down dismisses with an interactive drag
 *            (the photo follows the finger, the backdrop fades with distance; past a threshold or a flick it
 *            closes, otherwise it eases back). Pointer Events, touch-action none, transforms only.
 *   laptops  the photo up to ~85vh, a metadata strip and a filmstrip. Wheel / trackpad pinch zooms around
 *            the cursor, drag pans, double-click toggles 2.5×, ← → move, + − 0 zoom, Esc / ✕ / F close.
 *
 * Detail when expanded: the decoded card image shows at once (Sentinel-2's own 10 m pixels, cut on the place's grid).
 * Where it is shown larger than its 1000 px in device pixels (a phone at 3×, a Retina laptop) or the first time it is
 * zoomed past 1.3×, the same box at 2000 px (lib/photos hiResUrl, toned with the card's curve) loads once and
 * crossfades in over it (200 ms) when decoded: pixel for pixel on the card, so nothing moves but the sharpness. The
 * resolution ("10 m / pixel") and a live scale bar ride on the frame; the reticle stays on the place at any zoom.
 *
 * Open / close: the photo grows from its exact rect in the panel (FLIP, 360 ms ease-out) and shrinks back to
 * the rect of whichever photo is current on close; the backdrop fades. Reduced motion: a 160 ms fade.
 * role="dialog" aria-modal, focus trapped and returned, the counter announced ("Photo 3 of 27").
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import type { Pass } from '@/types'
import { Button, Glyph, cx, prefersReducedMotion, useMediaQuery } from '@/ui/system'
import { Ago } from './Ago'
import { credit, galleryCtl } from './Gallery'
import { Mark } from './Mark'
import { PushbroomReveal } from './PushbroomReveal'
import { Reticle } from './Reticle'
import { coordsOf, seenKeyOf } from './PhotoFrame'
import { selectQuietly } from './actions'
import { hasTimelapse, loadTimelapse } from './TimelapseEntry'
import { useBackLayer } from '@/lib/backStack'
import { useApp } from '@/state/store'
import { useTimelapseUi } from '@/state/timelapse'
import { coverPinKey, pinnedOrder, useGallery } from './gallery'
import { decodedPhoto, hasPhotoElement, loadPhoto } from './images'
import { Img } from './Img'
import { cardSpec, cardUrl, cropWidthKm, filterPhotos, HIRES_INTENT_ZOOM, hiResHelps, hiResUrl, photoHeadingDeg, placeOffset, thumbUrl, type Photo } from './lib/photos'
import { pixelLabel, productLabel, scaleBarKm, sensorName } from './lib/captures'
import { dec1, int } from './lib/copy'
import { fmtLocalDay, fmtLocalTime, zoneAbbr } from './lib/time'
import type { ResultsModel } from './model'
import { wasSeen } from './once'
import s from './Lightbox.module.css'

const warmTimelapse = () => void loadTimelapse().catch(() => undefined)

const MAX_ZOOM = 6
const DOUBLE_ZOOM = 2.5
const OPEN_MS = 360
const CLOSE_MS = 280
const FADE_MS = 160
const NAV_MS = 260
const GAP = 24
/** Laptops: the photo side from which the metadata strip fits both Replay and the word Share. */
const SHARE_WORD_MIN_SIDE = 660

interface Layout {
  side: number
  left: number
  top: number
}

function computeLayout(mobile: boolean): Layout {
  const W = window.innerWidth
  const H = window.innerHeight
  if (mobile) {
    const topH = 56
    const metaH = 92
    const side = Math.max(160, Math.min(W, H - topH - metaH))
    return { side, left: (W - side) / 2, top: topH + Math.max(0, (H - topH - metaH - side) / 2) }
  }
  // The top bar (56), the metadata strip under the photo (12 above + three rows ≈ 56 + an 8 px breath above the
  // filmstrip, U-5: at 1280×800 it sat flush on it), the filmstrip (48 px thumbs, 24 px off the bottom): the photo takes
  // the rest, up to 85vh (≥ 680 px on a 900 px tall laptop).
  const topH = 56
  const metaH = 12 + 56 + 10
  const filmH = 78
  const side = Math.max(240, Math.min(H - topH - metaH - filmH, W - 2 * 96, Math.round(H * 0.85)))
  return { side, left: (W - side) / 2, top: topH + Math.max(0, (H - topH - metaH - filmH - side) / 2) }
}

/**
 * Short viewports (a phone in landscape, ≤ 520 px tall) take the phone viewer: the laptop one stacks the top bar, the
 * photo, its metadata and the filmstrip, which do not fit there (the metadata ran under the filmstrip, RS-M2).
 */
const SHORT_VIEWER_QUERY = '(max-height: 520px)'

export interface LightboxProps {
  model: ResultsModel
  mobile: boolean
  onReplay?: (p: Pass) => void
  /** Share the photo on view (its pass): the sheet opens over the viewer, which stays where it was. */
  onShare?: (p: Pass) => void
  /** A layer above the viewer is open (the share sheet): the viewer's keys are that layer's meanwhile. */
  covered?: boolean
}

export function Lightbox({ model, mobile, onReplay, onShare, covered = false }: LightboxProps) {
  const lb = useGallery((g) => g.lightbox)
  const short = useMediaQuery(SHORT_VIEWER_QUERY)
  if (!lb) return null
  return createPortal(<Viewer key={lb.id} id={lb.id} model={model} mobile={mobile || short} startKey={lb.key} from={lb.from} onReplay={onReplay} onShare={onShare} covered={covered} />, document.body)
}

interface ViewerProps {
  /** This opening (gallery.ts) */
  id: number
  model: ResultsModel
  mobile: boolean
  startKey: string
  from: HTMLElement | null
  onReplay?: (p: Pass) => void
  onShare?: (p: Pass) => void
  covered: boolean
}

function Viewer({ id, model, mobile, startKey, from, onReplay, onShare, covered }: ViewerProps) {
  const coveredRef = useRef(covered)
  coveredRef.current = covered
  const filter = useGallery((g) => g.filter)
  // The gallery's order (R-M1: the cover the hero painted first stays first).
  const items = useMemo(() => {
    const ordered = pinnedOrder(model.photos, coverPinKey(model.report))
    const list = filterPhotos(ordered, filter)
    return list.some((p) => p.key === startKey) ? list : ordered
  }, [model.photos, model.report, filter, startKey])
  const [index, setIndex] = useState(() => Math.max(0, items.findIndex((p) => p.key === startKey)))
  const indexRef = useRef(index)
  indexRef.current = index
  const [layout, setLayout] = useState<Layout>(() => computeLayout(mobile))
  const [opened, setOpened] = useState(false)
  const [closing, setClosing] = useState(false)
  // The photo the viewer opened on reveals (pushbroom) only if it was never shown before.
  const [revealKey] = useState(() => (wasSeen(seenKeyOf(items[index] ?? items[0])) ? '' : startKey))

  const rootRef = useRef<HTMLDivElement>(null)
  const scrimRef = useRef<HTMLDivElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const stripRef = useRef<HTMLDivElement>(null)
  const zoomRef = useRef<HTMLDivElement>(null)
  const reticleRef = useRef<HTMLSpanElement>(null)
  const barRef = useRef<HTMLSpanElement>(null)
  const barTextRef = useRef<HTMLSpanElement>(null)
  const zoomTextRef = useRef<HTMLSpanElement>(null)
  const chromeRef = useRef<HTMLDivElement[]>([])
  const z = useRef({ s: 1, x: 0, y: 0 })
  const anim = useRef(0)
  // Photos zoomed in this opening: their sharper layer loads even where 1× does not ask for it.
  const zoomedRef = useRef(new Set<string>())
  const [zoomedKeys, setZoomedKeys] = useState<ReadonlySet<string>>(zoomedRef.current)
  // Photos whose pan-sharpened 15 m layer is on screen (Landsat 8/9): their labels say 15 m, not the colour's 30 m.
  const [panKeys, setPanKeys] = useState<ReadonlySet<string>>(() => new Set())
  const onPanShown = useCallback((key: string) => setPanKeys((s) => (s.has(key) ? s : new Set(s).add(key))), [])
  const reduced = prefersReducedMotion()
  const photo = items[index]
  const n = items.length
  const place = model.report.place

  // ── zoom / pan ──────────────────────────────────────────────────────────────────────────
  const apply = useCallback(() => {
    const { s: k, x, y } = z.current
    const zl = zoomRef.current
    if (zl) zl.style.transform = k === 1 && !x && !y ? '' : `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${k.toFixed(4)})`
    const p = items[indexRef.current]
    const side = layoutRef.current.side
    // The reticle on the place itself, which zoom magnifies (within a native pixel of the photo's centre).
    const o = p && side ? placeOffset(p.capture, place) : { dx: 0, dy: 0 }
    if (reticleRef.current) reticleRef.current.style.transform = `translate(-50%, -50%) translate(${(x + k * o.dx * side).toFixed(1)}px, ${(y + k * o.dy * side).toFixed(1)}px)`
    if (p && barRef.current && barTextRef.current && side) {
      const visKm = cropWidthKm(p.capture) / k
      const km = scaleBarKm(visKm)
      barRef.current.style.width = `${Math.round((km / visKm) * side)}px`
      const txt = `${km >= 1 ? int(km) : km} km`
      if (barTextRef.current.textContent !== txt) barTextRef.current.textContent = txt
    }
    if (zoomTextRef.current) zoomTextRef.current.textContent = `${k.toFixed(1)}×`
    const box = boxRef.current
    if (box) box.dataset.zoomed = k > 1.001 ? 'true' : 'false'
    // The first zoom intent asks for this photo's sharper layer (one render per photo, not per frame), so it is
    // usually decoded by the time the zoom passes HIRES_ZOOM. Skipped where 1× already asks for it (phones, Retina):
    // a re-render mid-pinch would change nothing.
    if (p && k > HIRES_INTENT_ZOOM && !zoomedRef.current.has(p.key) && !hiResHelps(side, window.devicePixelRatio || 1)) {
      zoomedRef.current = new Set(zoomedRef.current).add(p.key)
      setZoomedKeys(zoomedRef.current)
    }
  }, [items, place])
  const layoutRef = useRef(layout)
  layoutRef.current = layout

  const clampPan = () => {
    const m = ((z.current.s - 1) * layoutRef.current.side) / 2
    z.current.x = Math.max(-m, Math.min(m, z.current.x))
    z.current.y = Math.max(-m, Math.min(m, z.current.y))
  }
  /** Zoom to `k` keeping the content point under (px, py) (box-centre coordinates) where it is. */
  const zoomAt = (k: number, px: number, py: number) => {
    const c = z.current
    const nk = Math.max(1, Math.min(MAX_ZOOM, k))
    c.x = px - (px - c.x) * (nk / c.s)
    c.y = py - (py - c.y) * (nk / c.s)
    c.s = nk
    if (nk === 1) c.x = c.y = 0
    clampPan()
    apply()
  }
  const tweenZoom = (k: number, px = 0, py = 0) => {
    cancelAnimationFrame(anim.current)
    const a = { ...z.current }
    zoomAt(k, px, py)
    const b = { ...z.current }
    if (reduced) return
    z.current = { ...a }
    const t0 = performance.now()
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / 240)
      const e = 1 - Math.pow(1 - t, 3)
      z.current = { s: a.s + (b.s - a.s) * e, x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e }
      apply()
      if (t < 1) anim.current = requestAnimationFrame(step)
    }
    anim.current = requestAnimationFrame(step)
  }
  const resetZoom = (animate = true) => (animate ? tweenZoom(1) : ((z.current = { s: 1, x: 0, y: 0 }), apply()))

  // ── layout ──────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onResize = () => setLayout(computeLayout(mobile))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [mobile])
  useLayoutEffect(() => apply(), [apply, layout, index])

  // ── open: FLIP from the panel's frame ───────────────────────────────────────────────────
  useLayoutEffect(() => {
    const box = boxRef.current
    const scrim = scrimRef.current
    if (!box || !scrim) return
    const chrome = chromeRef.current.filter(Boolean)
    const done = () => setOpened(true)
    // Grow from the photo only when it is on screen (a frame scrolled out of its carousel or the panel fades in instead).
    if (reduced || !from || !from.isConnected || !onScreen(from)) {
      const a = [rootRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: reduced ? FADE_MS : 220, easing: 'linear' })]
      if (a[0]) a[0].onfinish = done
      else done()
      return
    }
    const r = from.getBoundingClientRect()
    const L = layoutRef.current
    const k = r.width / L.side
    const insetY = Math.max(0, (L.side - r.height / k) / 2)
    const dx = r.left + r.width / 2 - (L.left + L.side / 2)
    const dy = r.top + r.height / 2 - (L.top + L.side / 2)
    const a = box.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) scale(${k})`, clipPath: `inset(${insetY}px 0 ${insetY}px 0)` },
        { transform: 'none', clipPath: 'inset(0 0 0 0)' },
      ],
      { duration: OPEN_MS, easing: 'cubic-bezier(.2,0,0,1)' },
    )
    scrim.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, easing: 'linear' })
    for (const el of chrome) el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, delay: 140, easing: 'linear', fill: 'backwards' })
    a.onfinish = done
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── R3-16: the globe under the ink layer throttles its rendering while the viewer covers it ──
  useLayoutEffect(() => {
    setOverlay(true)
    return () => setOverlay(false)
  }, [])

  // ── close: shrink back to whichever photo is current ────────────────────────────────────
  const closingRef = useRef(false)
  /** Gives the viewer's history entry up (set below): as the shrink starts, a Back goes to the layer under it. */
  const releaseBack = useRef<() => void>(() => undefined)
  const close = useCallback(() => {
    if (closingRef.current) return
    closingRef.current = true
    releaseBack.current()
    // The globe renders a fresh frame before the scrim starts fading (no stale frame shows through it).
    setOverlay(false)
    setClosing(true)
    cancelAnimationFrame(anim.current)
    const p = items[indexRef.current]
    // The panel follows: the gallery jumps to this photo (the pass view selects its pass quietly).
    if (p) {
      useGallery.getState().setKey(p.key, true)
      galleryCtl.current?.jump(p.key)
      if (p.pass && document.querySelector('[data-gallery="detail"]')) selectQuietly(p.pass)
    }
    const finish = () => {
      // Only this viewer: a photo opened again while this one was still shrinking away keeps its own viewer.
      if (useGallery.getState().lightbox?.id === id) useGallery.getState().closeLightbox()
      const target = p ? document.querySelector<HTMLElement>(`[data-photo-frame="${CSS.escape(p.key)}"] button`) : null
      ;(target ?? from?.querySelector<HTMLElement>('button') ?? from)?.focus?.({ preventScroll: true })
    }
    const box = boxRef.current
    const scrim = scrimRef.current
    const chrome = chromeRef.current.filter(Boolean)
    // Two frames: the gallery has scrolled to the photo before its rect is read.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const el = p ? document.querySelector<HTMLElement>(`[data-photo-frame="${CSS.escape(p.key)}"]`) : null
        const r = el?.getBoundingClientRect()
        const vis = !!el && onScreen(el)
        if (!box || !scrim || reduced || !vis || !r) {
          const a = rootRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: reduced ? FADE_MS : 200, easing: 'linear', fill: 'forwards' })
          if (a) a.onfinish = finish
          else finish()
          return
        }
        const L = layoutRef.current
        const k = r.width / L.side
        const insetY = Math.max(0, (L.side - r.height / k) / 2)
        const dx = r.left + r.width / 2 - (L.left + L.side / 2)
        const dy = r.top + r.height / 2 - (L.top + L.side / 2)
        // From wherever the photo is now (a dismiss drag may have moved it), zoom easing back to 1×.
        const cur = getComputedStyle(box).transform
        const opts = { duration: CLOSE_MS, easing: 'cubic-bezier(.6,0,.2,1)', fill: 'forwards' as const }
        const a = box.animate(
          [
            { transform: cur === 'none' ? 'none' : cur, clipPath: 'inset(0 0 0 0)' },
            { transform: `translate(${dx}px, ${dy}px) scale(${k})`, clipPath: `inset(${insetY}px 0 ${insetY}px 0)` },
          ],
          opts,
        )
        zoomRef.current?.animate([{ transform: zoomRef.current.style.transform || 'none' }, { transform: 'none' }], opts)
        scrim.animate([{ opacity: Number(getComputedStyle(scrim).opacity) || 1 }, { opacity: 0 }], { ...opts, easing: 'linear' })
        for (const c of chrome) c.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, easing: 'linear', fill: 'forwards' })
        a.onfinish = finish
      }),
    )
  }, [items, from, reduced, id])
  // The back gesture closes the viewer, shrinking back like the × (src/lib/backStack.ts).
  releaseBack.current = useBackLayer('lightbox', true, close)

  // ── navigate ────────────────────────────────────────────────────────────────────────────
  // The index moves at once (the counter, the metadata and the filmstrip follow in the same frame); the strip then
  // glides the new photo in from where it was on screen (a drag's offset, or mid-glide on a fast ← →), so state never
  // waits on an animation event and rapid presses chain smoothly.
  const pendingNav = useRef<{ dir: 1 | -1; from: number } | null>(null)
  const go = useCallback(
    (dir: 1 | -1) => {
      const i = indexRef.current + dir
      if (i < 0 || i >= n) return
      const strip = stripRef.current
      resetZoom(false)
      if (strip && !reduced) pendingNav.current = { dir, from: new DOMMatrixReadOnly(getComputedStyle(strip).transform).m41 || 0 }
      indexRef.current = i
      setIndex(i)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [n, reduced],
  )
  useLayoutEffect(() => {
    const strip = stripRef.current
    if (!strip) return
    for (const a of strip.getAnimations()) a.cancel()
    strip.style.transform = ''
    const nav = pendingNav.current
    pendingNav.current = null
    if (!nav) return
    const start = nav.from + nav.dir * (layoutRef.current.side + GAP)
    strip.animate([{ transform: `translateX(${start.toFixed(1)}px)` }, { transform: 'translateX(0px)' }], { duration: NAV_MS, easing: 'cubic-bezier(.2,0,0,1)' })
  }, [index])
  const goTo = (i: number) => {
    if (i === indexRef.current) return
    resetZoom(false)
    pendingNav.current = null
    setIndex(Math.max(0, Math.min(n - 1, i)))
  }

  // ── keys (capture phase: the app's Esc / ← → never also act) and the focus trap ─────────
  const actions = useRef({ close, go, tweenZoom, resetZoom })
  actions.current = { close, go, tweenZoom, resetZoom }
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    rootRef.current?.focus({ preventScroll: true })
    const onKey = (e: KeyboardEvent) => {
      // About open over the viewer: its keys are About's (an Esc closes About alone).
      // Likewise the share sheet over the viewer (it registered its own capture listener after this one).
      if (useApp.getState().aboutOpen || coveredRef.current) return
      const A = actions.current
      const k = e.key
      let handled = true
      if (k === 'Escape' || k === 'f' || k === 'F') A.close()
      else if (k === 'ArrowLeft') A.go(-1)
      else if (k === 'ArrowRight') A.go(1)
      else if (k === '+' || k === '=') A.tweenZoom(z.current.s * 1.6)
      else if (k === '-' || k === '_') A.tweenZoom(z.current.s / 1.6, 0, 0)
      else if (k === '0') A.resetZoom()
      else if (k === 'Tab') trapFocus(e, rootRef.current)
      else if (k === ' ' && !(e.target as HTMLElement | null)?.closest?.('button')) {
        /* Space: nothing behind the viewer (the replay) reacts while it is open */
      } else handled = false
      if (handled) {
        e.stopPropagation()
        if (k !== 'Tab') e.preventDefault()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      if (!closingRef.current) prev?.focus?.({ preventScroll: true })
    }
  }, [])

  // ── pointers: wheel zoom, drag pan, double tap / click, swipe between photos, swipe down to dismiss ──
  useEffect(() => {
    const box = boxRef.current
    const root = rootRef.current
    if (!box || !root) return
    const local = (cx: number, cy: number) => {
      const L = layoutRef.current
      return { x: cx - (L.left + L.side / 2), y: cy - (L.top + L.side / 2) }
    }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (closingRef.current) return
      cancelAnimationFrame(anim.current)
      const f = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0018))
      const p = local(e.clientX, e.clientY)
      zoomAt(z.current.s * f, p.x, p.y)
    }
    box.addEventListener('wheel', onWheel, { passive: false })

    const pts = new Map<number, { x: number; y: number }>()
    let mode: 'none' | 'pan' | 'swipe' | 'dismiss' | 'pinch' | 'pending' = 'none'
    let start = { x: 0, y: 0, t: 0, zx: 0, zy: 0 }
    let pinch = { d: 1, s: 1, mx: 0, my: 0, x: 0, y: 0 }
    let samples: { t: number; x: number; y: number }[] = []
    let lastTap = { t: 0, x: 0, y: 0 }
    const strip = stripRef.current
    const scrim = scrimRef.current
    const chrome = () => chromeRef.current.filter(Boolean)
    const mid = () => {
      const [a, b] = [...pts.values()]
      return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, d: Math.hypot(a.x - b.x, a.y - b.y) || 1 }
    }
    const down = (e: PointerEvent) => {
      if (closingRef.current || (e.pointerType === 'mouse' && e.button !== 0)) return
      if ((e.target as Element).closest?.('button')) return
      cancelAnimationFrame(anim.current)
      box.setPointerCapture?.(e.pointerId)
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (pts.size === 2) {
        const m = mid()
        const p = local(m.x, m.y)
        pinch = { d: m.d, s: z.current.s, mx: p.x, my: p.y, x: z.current.x, y: z.current.y }
        mode = 'pinch'
        if (strip) strip.style.transform = ''
        return
      }
      start = { x: e.clientX, y: e.clientY, t: e.timeStamp, zx: z.current.x, zy: z.current.y }
      samples = [{ t: e.timeStamp, x: e.clientX, y: e.clientY }]
      mode = z.current.s > 1.001 ? 'pan' : 'pending'
      if (mode === 'pan') box.dataset.grabbing = 'true'
    }
    const move = (e: PointerEvent) => {
      if (!pts.has(e.pointerId)) return
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
      samples.push({ t: e.timeStamp, x: e.clientX, y: e.clientY })
      if (samples.length > 6) samples.shift()
      const dx = e.clientX - start.x
      const dy = e.clientY - start.y
      if (mode === 'pinch' && pts.size >= 2) {
        const m = mid()
        const p = local(m.x, m.y)
        const k = Math.max(1, Math.min(MAX_ZOOM, pinch.s * (m.d / pinch.d)))
        // The content point under the first midpoint follows the fingers.
        z.current.s = k
        z.current.x = p.x - ((pinch.mx - pinch.x) / pinch.s) * k
        z.current.y = p.y - ((pinch.my - pinch.y) / pinch.s) * k
        clampPan()
        apply()
        return
      }
      if (mode === 'pan') {
        z.current.x = start.zx + dx
        z.current.y = start.zy + dy
        clampPan()
        apply()
        return
      }
      if (mode === 'pending') {
        if (Math.hypot(dx, dy) < 8 || e.pointerType === 'mouse') return
        mode = Math.abs(dx) > Math.abs(dy) ? 'swipe' : dy > 0 ? 'dismiss' : 'none'
      }
      if (mode === 'swipe' && strip) {
        const i = indexRef.current
        // Rubber band at the ends.
        const edge = (dx > 0 && i === 0) || (dx < 0 && i === n - 1)
        strip.style.transform = `translateX(${(edge ? dx / 3 : dx).toFixed(1)}px)`
      } else if (mode === 'dismiss') {
        const d = Math.max(0, dy)
        const k = 1 - Math.min(0.25, d / 1600)
        box.style.transform = `translate(${(dx * 0.6).toFixed(1)}px, ${d.toFixed(1)}px) scale(${k.toFixed(4)})`
        const fade = Math.min(1, d / (layoutRef.current.side * 0.9))
        if (scrim) scrim.style.opacity = String(1 - fade * 0.85)
        for (const c of chrome()) c.style.opacity = String(Math.max(0, 1 - fade * 3))
      }
    }
    const up = (e: PointerEvent) => {
      if (!pts.has(e.pointerId)) return
      pts.delete(e.pointerId)
      box.dataset.grabbing = 'false'
      if (mode === 'pinch') {
        if (pts.size === 1) {
          // One finger left: carry on panning from here.
          const [p] = [...pts.values()]
          start = { x: p.x, y: p.y, t: e.timeStamp, zx: z.current.x, zy: z.current.y }
          mode = z.current.s > 1.001 ? 'pan' : 'none'
        } else mode = 'none'
        return
      }
      const dx = e.clientX - start.x
      const dy = e.clientY - start.y
      const first = samples[0]
      const last = samples[samples.length - 1]
      const dt = Math.max(1, last.t - first.t)
      const vx = (last.x - first.x) / dt
      const vy = (last.y - first.y) / dt
      const m = mode
      mode = 'none'
      if (m === 'swipe' && strip) {
        const i = indexRef.current
        const side = layoutRef.current.side
        const dir: 1 | -1 = dx < 0 ? 1 : -1
        const next = i + dir
        if (next >= 0 && next < n && (Math.abs(dx) > side * 0.22 || Math.abs(vx) > 0.45)) {
          actions.current.go(dir)
        } else {
          const cur = new DOMMatrixReadOnly(getComputedStyle(strip).transform).m41 || 0
          strip.animate([{ transform: `translateX(${cur}px)` }, { transform: 'translateX(0px)' }], { duration: 240, easing: 'cubic-bezier(.2,0,0,1)' })
          strip.style.transform = ''
        }
        return
      }
      if (m === 'dismiss') {
        if (dy > 110 || vy > 0.55) {
          actions.current.close()
          return
        }
        const cur = box.style.transform
        box.style.transform = ''
        box.animate([{ transform: cur }, { transform: 'none' }], { duration: 240, easing: 'cubic-bezier(.2,0,0,1)' })
        if (scrim) {
          const o = scrim.style.opacity
          scrim.style.opacity = ''
          scrim.animate([{ opacity: o }, { opacity: 1 }], { duration: 240, easing: 'linear' })
        }
        for (const c of chrome()) c.style.opacity = ''
        return
      }
      // A tap: double-tap (touch) zooms in at the point or back out.
      if (Math.hypot(dx, dy) < 10 && e.timeStamp - start.t < 300 && e.pointerType !== 'mouse') {
        if (e.timeStamp - lastTap.t < 320 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 32) {
          lastTap.t = 0
          const p = local(e.clientX, e.clientY)
          if (z.current.s > 1.001) tweenZoom(1)
          else tweenZoom(DOUBLE_ZOOM, p.x, p.y)
        } else lastTap = { t: e.timeStamp, x: e.clientX, y: e.clientY }
      }
    }
    const onDbl = (e: MouseEvent) => {
      const p = local(e.clientX, e.clientY)
      if (z.current.s > 1.001) tweenZoom(1)
      else tweenZoom(DOUBLE_ZOOM, p.x, p.y)
    }
    box.addEventListener('pointerdown', down)
    box.addEventListener('pointermove', move)
    box.addEventListener('pointerup', up)
    box.addEventListener('pointercancel', up)
    box.addEventListener('dblclick', onDbl)
    return () => {
      box.removeEventListener('wheel', onWheel)
      box.removeEventListener('pointerdown', down)
      box.removeEventListener('pointermove', move)
      box.removeEventListener('pointerup', up)
      box.removeEventListener('pointercancel', up)
      box.removeEventListener('dblclick', onDbl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n])

  // Keep the gallery behind in step (it is under the scrim; the close shrinks into it).
  useEffect(() => {
    const p = items[index]
    if (p && opened) useGallery.getState().setKey(p.key, true)
  }, [index, items, opened])

  if (!photo) return null
  const meta = model.meta(photo.pass?.norad ?? photo.capture.norad ?? 0)
  const windowItems = items.filter((p) => !!p.pass)
  const pos = photo.pass ? windowItems.indexOf(photo) + 1 : 0
  const counter = photo.pass ? `${pos} / ${windowItems.length}` : 'Last clear look'
  // Why the cover leads ("Closest look" / "Clouded over") rides on the counter, where there is room: in the metadata
  // strip it cut the first row short ("… 2 D…") whenever a Replay button and a status shared it.
  const why = model.cover?.photo.key === photo.key ? model.cover.why : undefined
  const lead = photo.pass ? (why === 'closest' ? 'Closest look' : why === 'clouded' ? 'Clouded over' : undefined) : undefined
  const spoken = photo.pass ? `Photo ${pos} of ${windowItems.length}${lead ? `, ${lead.toLowerCase()}` : ''}` : 'The last clear look, from before this week'
  const side = layout.side
  const boxStyle: CSSProperties = { left: layout.left, top: layout.top, width: side, height: side }
  // Shown larger than the card in device pixels already at 1×: every photo viewed gets its sharper layer.
  const hiAt1x = hiResHelps(side, window.devicePixelRatio || 1)
  // A laptop photo under this side has no room for 'Share' beside Replay without cutting the metadata's second row.
  const shareGlyphOnly = !mobile && side < SHARE_WORD_MIN_SIDE
  const setChrome = (i: number) => (el: HTMLDivElement | null) => {
    if (el) chromeRef.current[i] = el
  }

  // The place's time-lapse, from the viewer's bar: where people are already looking at its photos.
  const timelapse = hasTimelapse(model)
  return (
    <div ref={rootRef} className={cx(s.root, mobile && s.mobile, closing && s.closing)} role="dialog" aria-modal="true" aria-label="Photos" tabIndex={-1}>
      <div ref={scrimRef} className={s.scrim} onClick={close} />

      <div ref={setChrome(0)} className={s.top}>
        <span className={s.counter}>
          {lead ? <span className={cx(s.counterLead, why === 'clouded' && s.warn)}>{lead} · </span> : null}
          {counter}
          <span className="sr-only" aria-live="polite">
            {spoken}
          </span>
        </span>
        {timelapse ? (
          <Button size="sm" className={s.lapse} onClick={() => useTimelapseUi.getState().show('viewer')} onPointerEnter={warmTimelapse} onPointerDown={warmTimelapse} aria-label="Time-lapse of this place, year by year">
            Time-lapse
          </Button>
        ) : null}
        {!mobile ? (
          <span className={s.zoomCtl}>
            <button type="button" className={s.ctl} onClick={() => tweenZoom(z.current.s / 1.6)} aria-label="Zoom out" title="Zoom out (−)">
              −
            </button>
            <span ref={zoomTextRef} className={s.zoomText}>
              1.0×
            </span>
            <button type="button" className={s.ctl} onClick={() => tweenZoom(z.current.s * 1.6)} aria-label="Zoom in" title="Zoom in (+)">
              +
            </button>
          </span>
        ) : null}
        <button type="button" className={s.close} onClick={close} aria-label="Close the photo viewer" title="Close (Esc)">
          <Glyph name="close" size={14} />
        </button>
      </div>

      <div ref={boxRef} className={cx(s.box, side < 300 && s.smallBox)} style={boxStyle} data-zoomed="false">
        <div ref={stripRef} className={s.strip}>
          {[-1, 0, 1].map((d) => {
            const p = items[index + d]
            if (!p) return null
            return (
              <div key={p.key} className={s.slide} style={{ transform: `translateX(${d * (side + GAP)}px)` }} aria-hidden={d !== 0 || undefined}>
                <div ref={d === 0 ? zoomRef : undefined} className={s.zoom}>
                  <LbPhoto photo={p} model={model} hires={opened && !closing && d === 0 && (hiAt1x || zoomedKeys.has(p.key))} reveal={p.key === revealKey} onPanShown={onPanShown} />
                </div>
              </div>
            )
          })}
        </div>
        <span ref={reticleRef} className={s.reticle}>
          <Reticle size={mobile ? 44 : 56} />
        </span>
        <span className={cx(s.chip, s.tl)}>
          {meta.name} · {sensorName(photo.capture)}
        </span>
        <span className={cx(s.chip, s.tr)} title={panKeys.has(photo.key) ? "Pan-sharpened with Landsat's 15 m band" : undefined}>
          {panKeys.has(photo.key) ? '15 m' : pixelLabel(photo.capture)} / pixel
        </span>
        <span className={s.scale}>
          <span ref={barRef} className={s.scaleBar} />
          <span ref={barTextRef} className={s.scaleText} />
        </span>
        <span className={cx(s.chip, s.br)} aria-hidden>
          {/* True north, turned from the photo's up (grid north on a native crop) by the meridian convergence. */}
          <svg width="8" height="10" viewBox="0 0 8 10" style={{ transform: `rotate(${photoHeadingDeg(photo.capture, 0).toFixed(1)}deg)` }}>
            <path d="M4 0.5 7.5 9.5 4 7.2 0.5 9.5Z" fill="currentColor" />
          </svg>
          N
        </span>
      </div>

      {!mobile ? (
        <>
          <button
            type="button"
            className={cx(s.arrow, s.prev)}
            onClick={() => go(-1)}
            disabled={index <= 0}
            aria-label="Previous photo"
            ref={(el) => {
              if (el) chromeRef.current[3] = el as unknown as HTMLDivElement
            }}
          >
            <Mark name="chevron-left" size={16} />
          </button>
          <button
            type="button"
            className={cx(s.arrow, s.next)}
            onClick={() => go(1)}
            disabled={index >= n - 1}
            aria-label="Next photo"
            ref={(el) => {
              if (el) chromeRef.current[4] = el as unknown as HTMLDivElement
            }}
          >
            <Mark name="chevron-right" size={16} />
          </button>
        </>
      ) : null}

      <div ref={setChrome(1)} className={s.meta} style={{ top: layout.top + side + 12, left: mobile ? undefined : layout.left, width: mobile ? undefined : side }}>
        <MetaStrip photo={photo} model={model} mobile={mobile} pan={panKeys.has(photo.key)} />
        {/* Replay and Share, where the thumb is on a phone (stacked, so the facts beside them keep their column);
            side by side on a laptop, where Share is its glyph alone under a photo too narrow for both words. */}
        {photo.pass && (onReplay || onShare) ? (
          <div className={s.acts}>
            {onReplay ? (
              <Button
                size="sm"
                onClick={() => {
                  const pass = photo.pass!
                  useGallery.getState().closeLightbox()
                  onReplay(pass)
                }}
                aria-label="Replay this pass on the globe"
                className={s.replay}
              >
                <Glyph name="play" size={11} />
                Replay
              </Button>
            ) : null}
            {onShare ? (
              <Button size="sm" onClick={() => onShare(photo.pass!)} aria-label="Share this photo" title="Share this photo" className={cx(s.replay, shareGlyphOnly && s.actIcon)}>
                <Glyph name="share" size={shareGlyphOnly ? 13 : 11} />
                {shareGlyphOnly ? null : 'Share'}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {!mobile ? (
        <div ref={setChrome(2)} className={s.film} role="listbox" aria-label="All photos" aria-activedescendant={`lb-thumb-${index}`}>
          <Filmstrip items={items} index={index} onPick={goTo} tz={model.tz} />
        </div>
      ) : null}
    </div>
  )
}

/** Sharper layers that failed this session: the photo stays on its card, and nothing asks again. */
const hiFailed = new Set<string>()

/**
 * One photo in the viewer: the decoded card image at once; with `hires`, its sharper layer (lib/photos hiResUrl) loads
 * once the card shows (so the card's curve is the one it is toned with) and crossfades in over it, the same box pixel
 * for pixel. A layer already decoded this session shows in the first frame. A failure leaves the card, silently.
 */
function LbPhoto({
  photo,
  model,
  hires,
  reveal,
  onPanShown,
}: {
  photo: Photo
  model: ResultsModel
  hires: boolean
  reveal: boolean
  /** The photo's pan-sharpened layer (15 m) is the one shown */
  onPanShown?: (key: string) => void
}) {
  const base = cardUrl(photo.capture)
  const hi = hiResUrl(photo.capture)
  const [baseOk, setBaseOk] = useState(() => !!decodedPhoto(base) || hasPhotoElement('lightbox', base))
  const [hiOk, setHiOk] = useState(() => !!(hi && (decodedPhoto(hi) || hasPhotoElement('lightbox-hi', hi))))
  const [hiFade, setHiFade] = useState(false)
  // A photo revealed here (never shown before) takes its sharper layer once the scan is done.
  const [revealed, setRevealed] = useState(false)
  // A 'last clear look' (no pass) is drawn as the plain card even when revealed here: gate on what is drawn.
  const cardShown = reveal && photo.pass ? revealed : baseOk
  useEffect(() => {
    if (baseOk) return
    const ctl = new AbortController()
    loadPhoto(base, ctl.signal)
      .then(() => !ctl.signal.aborted && setBaseOk(true))
      .catch(() => undefined)
    return () => ctl.abort()
  }, [base, baseOk])
  useEffect(() => {
    if (!hires || !hi || hiOk || !cardShown || hiFailed.has(hi)) return
    const ctl = new AbortController()
    loadPhoto(hi, ctl.signal)
      .then(() => {
        if (ctl.signal.aborted) return
        setHiFade(true)
        setHiOk(true)
      })
      .catch(() => {
        // Not when this view stopped waiting (the shared load goes on, and is a cache hit later).
        if (!ctl.signal.aborted) hiFailed.add(hi)
      })
    return () => ctl.abort()
  }, [hires, hi, hiOk, cardShown])
  // The sharper layer on screen is the pan-sharpened one (not its 30 m fallback): the labels say 15 m.
  const hiShown = hiOk && (!reveal || !photo.pass || revealed)
  useEffect(() => {
    if (hiShown && hi && decodedPhoto(hi)?.dataset.pan === '15') onPanShown?.(photo.key)
  }, [hiShown, hi, photo.key, onPanShown])
  const alt = `${model.meta(photo.pass?.norad ?? photo.capture.norad ?? 0).name} image of ${model.report.place.label}. The place is at the centre.`
  const dim = photo.clouded ? ((photo.capture.cloudCoverPct ?? 0) >= 90 ? s.dimOvercast : s.dimCloud) : undefined
  const hiLayer = hiOk && hi ? <Img view="lightbox-hi" url={hi} alt="" ariaHidden className={cx(s.img, dim)} fadeClass={hiFade ? s.hiFade : undefined} /> : null
  if (reveal && photo.pass)
    return (
      <>
        <PushbroomReveal
          src={base}
          view="lightbox"
          headingDeg={photoHeadingDeg(photo.capture, photo.pass.headingDeg)}
          lines={cardSpec(photo.capture).px}
          alt={alt}
          startAt="now"
          seenKey={seenKeyOf(photo)}
          className={s.fill}
          frameClassName={cx(s.fillFrame, dim)}
          onPhase={(ph) => ph === 'done' && setRevealed(true)}
        />
        {revealed ? hiLayer : null}
      </>
    )
  return (
    <>
      {baseOk ? <Img view="lightbox" url={base} alt={alt} className={cx(s.img, dim)} /> : <span className={s.acquiring}>Acquiring</span>}
      {baseOk ? hiLayer : null}
    </>
  )
}

/**
 * Under the photo: who and when, what the picture shows at the place, the product line and the archive's credit. The
 * first row never truncates: the relative time ("· 2 days ago") is dropped whole when the row is too narrow for it
 * (it wraps into a clipped second line), so the satellite, day and time always read in full.
 */
function MetaStrip({ photo, model, mobile, pan }: { photo: Photo; model: ResultsModel; mobile: boolean; pan?: boolean }) {
  const { capture, pass } = photo
  const meta = model.meta(pass?.norad ?? capture.norad ?? 0)
  const tz = model.tz
  const t = pass ? model.times(pass) : { day: fmtLocalDay(capture.datetime, tz), time: fmtLocalTime(capture.datetime, tz), zone: zoneAbbr(capture.datetime, tz) }
  const w = cropWidthKm(capture)
  // A daily mosaic says so once, in the product line ('Daily mosaic · 250 m'), not again as its status (PH-11).
  const status = photo.kind === 'mosaic' ? undefined : photo.clouded ? `Clouded${capture.cloudCoverPct !== undefined ? ` · ${int(capture.cloudCoverPct)}%` : ''}` : capture.spot === 'clear' ? 'Clear at your spot' : capture.spot === 'cirrus' ? 'Thin cirrus' : undefined
  const km = `${w >= 100 ? int(w) : dec1(w)} km`
  const ago = <Ago t={pass?.tClosest ?? capture.datetime} base={model.clock} />
  if (mobile)
    // Phones (PH-11): one fact group per line, never wrapped like prose ('15:24 / EST', '240 / KM', a line opening on
    // a dangling '·'): who and when · how long ago (and the status) · the product · the place · the credit.
    return (
      <div className={s.metaText}>
        <span className={s.metaLine}>
          <b className={s.metaName}>{meta.name}</b> · {t.day} · {t.time} {t.zone}
        </span>
        <span className={cx(s.metaLine, s.dim)}>
          {ago}
          {status ? (
            <>
              {' · '}
              <span className={cx(s.statusInline, photo.clouded && s.warn)}>{status}</span>
            </>
          ) : null}
        </span>
        <span className={s.metaLine}>
          {pan ? 'Landsat C2 L2 + L1 pan · 15 m' : productLabel(capture)} · {km}
        </span>
        <span className={s.metaLine}>{coordsOf(model.report.place.lat, model.report.place.lon)}</span>
        <span className={s.credit}>{credit(capture)}</span>
      </div>
    )
  return (
    <div className={s.metaText}>
      <span className={s.metaRow}>
        <span className={cx(s.metaMain, s.metaFit)}>
          <span className={s.metaKeep}>
            <b>{meta.name}</b> · {t.day} · {t.time} {t.zone}
          </span>
          <span className={cx(s.dim, s.metaOpt)}>
            {'\u00a0· '}
            {ago}
          </span>
        </span>
        {status ? <span className={cx(s.status, photo.clouded && s.warn)}>{status}</span> : null}
      </span>
      <span className={s.metaRow}>
        <span className={s.metaMain}>
          {pan ? 'Landsat C2 L2 + L1 pan · 15 m' : productLabel(capture)} · {km} · <span className={s.nowrap}>{coordsOf(model.report.place.lat, model.report.place.lon)}</span>
        </span>
      </span>
      <span className={s.credit}>{credit(capture)}</span>
    </div>
  )
}

function Filmstrip({ items, index, onPick, tz }: { items: Photo[]; index: number; onPick: (i: number) => void; tz: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current?.children[index] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  }, [index])
  return (
    <div ref={ref} className={s.thumbs}>
      {items.map((p, i) => (
        <button
          key={p.key}
          id={`lb-thumb-${i}`}
          type="button"
          role="option"
          aria-selected={i === index}
          className={cx(s.thumb, i === index && s.thumbOn, p.clouded && s.thumbCloud)}
          onClick={() => onPick(i)}
          aria-label={`Photo ${i + 1}`}
          tabIndex={i === index ? 0 : -1}
        >
          <Thumb url={thumbUrl(p.capture)} near={Math.abs(i - index) <= 12} day={fmtLocalDay(p.capture.datetime, tz)} />
        </button>
      ))}
    </div>
  )
}

/**
 * A filmstrip thumbnail: loads when near the current photo, then stays. Until then the slot is an instrument tag with
 * the photo's local day (LAP-07: a row of empty dark boxes read as unfinished).
 */
function Thumb({ url, near, day }: { url: string; near: boolean; day: string }) {
  const [ok, setOk] = useState(() => !!decodedPhoto(url) || hasPhotoElement('film', url))
  useEffect(() => {
    if (ok || !near) return
    let alive = true
    loadPhoto(url)
      .then(() => alive && setOk(true))
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [url, near, ok])
  if (ok) return <Img view="film" url={url} alt="" />
  // 'Sat 31 Oct' → 'SAT' / '31 OCT'
  const [wd, ...rest] = day.split(' ')
  return (
    <span className={s.thumbPh} aria-hidden>
      <span>{wd}</span>
      <span>{rest.join(' ')}</span>
    </span>
  )
}

/**
 * The overlay contract (R3-16): `document.documentElement.dataset.overlay = 'lightbox'` while the viewer covers the
 * globe; deleted as it starts closing (or unmounts). The globe owns the reader.
 */
function setOverlay(on: boolean) {
  const root = document.documentElement
  if (on) root.dataset.overlay = 'lightbox'
  else if (root.dataset.overlay === 'lightbox') delete root.dataset.overlay
}

/** At least half of `el` is visible: inside the window and inside every clipping ancestor (a carousel, the panel). */
function onScreen(el: HTMLElement): boolean {
  const r = el.getBoundingClientRect()
  if (!r.width || !r.height) return false
  let l = Math.max(0, r.left)
  let t = Math.max(0, r.top)
  let rr = Math.min(window.innerWidth, r.right)
  let b = Math.min(window.innerHeight, r.bottom)
  for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
    const cs = getComputedStyle(p)
    if (cs.overflowX === 'visible' && cs.overflowY === 'visible') continue
    const q = p.getBoundingClientRect()
    l = Math.max(l, q.left)
    t = Math.max(t, q.top)
    rr = Math.min(rr, q.right)
    b = Math.min(b, q.bottom)
  }
  return rr > l && b > t && (rr - l) * (b - t) >= 0.5 * r.width * r.height
}

function trapFocus(e: KeyboardEvent, root: HTMLElement | null) {
  if (!root) return
  const f = [...root.querySelectorAll<HTMLElement>('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')].filter((el) => el.offsetParent !== null)
  if (!f.length) {
    e.preventDefault()
    return
  }
  const first = f[0]
  const last = f[f.length - 1]
  const active = document.activeElement
  if (e.shiftKey && (active === first || active === root)) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && active === last) {
    e.preventDefault()
    first.focus()
  }
}
