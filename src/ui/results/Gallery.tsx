/**
 * THE gallery (owner B): one carousel for every place a photo appears in the panel, the summary hero
 * ('hero') and the pass view ('detail'), so you can start swiping from the hero.
 *
 *   phones   full-width cards with the next one peeking ~12 % at the right; native horizontal scroll with
 *            CSS scroll-snap (x mandatory), momentum, overscroll contained (the sheet and page never move).
 *   laptops  one card at the column's width, ‹ › buttons, ← → keys, trackpad horizontal scroll.
 *   both     a filter (All · Detailed · Weather · Radar, the kinds the week has), a counter ("3 / 27"), a slim progress rail, and an expand
 *            control (F) that opens the lightbox.
 *
 * Order: lib/photos.ts (the closest clear look, then newest first). Swiping in the pass view selects the
 * photo's pass QUIETLY, 250 ms after the scroll settles (no replay, no new reveal; rapid swipes never queue
 * camera flights). In the summary a swipe only moves the gallery; "Replay this pass" opens the pass.
 *
 * Cheap while scrolling: the counter and the rail are written through refs from a rAF-throttled scroll
 * listener (no layout reads: the stride comes from a ResizeObserver); React renders only when the photo
 * under the snap changes (which neighbours load) and when it settles.
 */
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import type { Pass } from '@/types'
import { Glyph, cx, prefersReducedMotion } from '@/ui/system'
import { msgs, useMsgs } from '@/i18n/runtime'
import enGallery from '@/i18n/en/gallery'
import enSystem from '@/i18n/en/system'
import { Rich, withUnits } from '@/i18n/Rich'
import { Ago } from './Ago'
import { Mark } from './Mark'
import { PhotoFrame, coordsOf } from './PhotoFrame'
import { isOldWindow } from './Summary'
import { selectQuietly } from './actions'
import { coverPinKey, pinCover, pinnedOrder, useGallery } from './gallery'
import { warmPhoto } from './images'
import { GALLERY_NEAR } from './warm'
import { filterCounts, filterPhotos, cardUrl, cropWidthKm, type Photo, type PhotoFilter } from './lib/photos'
import { isGeoFrame, pixelLabel, productLabel } from './lib/captures'
import { fmtLocalDay, fmtLocalTime, fmtSpokenDay, zoneAbbr } from './lib/time'
import type { ResultsModel } from './model'
import s from './Gallery.module.css'

/** Imperative handle for the keyboard (← → and F) while a gallery is mounted. */
export const galleryCtl: { current: null | { step: (dir: 1 | -1) => boolean; expand: () => boolean; jump: (key: string) => boolean } } = { current: null }

const SETTLE_MS = 140
const SELECT_DEBOUNCE_MS = 250
const NEAR = GALLERY_NEAR
/** Slides this far from the one on screen are mounted (and stay mounted); farther ones are an empty frame. */
const MOUNT_NEAR = 4

export interface GalleryProps {
  model: ResultsModel
  context: 'hero' | 'detail'
  mobile: boolean
  /** The pass the pass view shows (detail): the gallery follows it */
  selectedId?: string
  /** Hero: open the photo's pass with its replay. Detail: replay the current pass. */
  onReplay?: (pass: Pass) => void
  onShare?: (pass: Pass) => void
}

export function Gallery({ model, context, mobile, selectedId, onReplay, onShare }: GalleryProps) {
  const filter = useGallery((g) => g.filter)
  const storeKey = useGallery((g) => g.key)
  const touched = useGallery((g) => g.touched)
  const detail = context === 'detail'
  const pinKey = coverPinKey(model.report)
  // R-M1: the cover the hero painted first stays first for this report (gallery.ts pinnedOrder). The pass view only
  // shows photos that have a pass (the clear cover from before the window has none).
  const all = useMemo(() => {
    const ordered = pinnedOrder(model.photos, pinKey)
    return detail ? ordered.filter((p) => !!p.pass) : ordered
  }, [model.photos, detail, pinKey])
  // The hero's first paint chooses the cover, once per report (before the paint: a layout effect).
  useLayoutEffect(() => {
    if (!detail) pinCover(pinKey, all[0]?.key)
  }, [detail, pinKey, all])
  const counts = useMemo(() => filterCounts(all), [all])
  const items = useMemo(() => filterPhotos(all, filter), [all, filter])
  const selectedKey = detail && selectedId ? model.photoByPass.get(selectedId) : undefined

  // A selected photo the filter hides: show everything again.
  useEffect(() => {
    if (selectedKey && !items.some((p) => p.key === selectedKey)) useGallery.setState({ filter: 'all' })
  }, [selectedKey, items])

  // Untouched, the summary shows photo #1 (the cover it painted first, R-M1); once the user has moved it, the photo
  // they left it on.
  const wantKey = selectedKey ?? (touched ? storeKey : undefined) ?? (detail ? model.cover?.photo.key : all[0]?.key)
  const wantIdx = Math.max(0, items.findIndex((p) => p.key === wantKey))
  const [idx, setIdx] = useState(wantIdx)
  /** Slides mounted so far (they stay mounted: a photo shown once never remounts, A2). */
  const mountedSlides = useRef(new Set<string>())
  const idxRef = useRef(idx)
  idxRef.current = idx
  /**
   * The photo on screen, or the one a glide is heading to: the gallery's identity (R3-2). When the list changes under
   * it (partial → final report, a filter, the clear cover arriving) the gallery stays on this photo, wherever it now
   * sits in the list; only the counter changes, in place.
   */
  const curKey = useRef<string | undefined>(items[wantIdx]?.key)
  const itemsRef = useRef(items)

  const trackRef = useRef<HTMLDivElement>(null)
  const counterRef = useRef<HTMLSpanElement>(null)
  const railRef = useRef<HTMLSpanElement>(null)
  const geo = useRef({ stride: 0, railW: 0, ready: false })
  /** A programmatic scroll in flight: settle commits it without a feedback loop */
  const target = useRef<number | null>(null)
  const selectTimer = useRef(0)
  /** The photo this gallery itself last committed to the store (settle): the store echoing it back is not a move to follow */
  const committed = useRef<string | undefined>(undefined)

  const n = items.length
  const windowItems = useMemo(() => items.filter((p) => !!p.pass), [items])
  const oldWindow = isOldWindow(model)
  const m = useMsgs(enGallery)
  const sys = useMsgs(enSystem)
  const counterText = useCallback(
    (i: number) => {
      const p = items[i]
      if (!p) return ''
      // The last clear look from before the window is not one of the window's photos: the counter says how many
      // of those follow it ("27 this week"), never a placeholder.
      if (!p.pass) return windowItems.length ? (oldWindow ? m.photosThatWeek : m.photosThisWeek)(windowItems.length) : ''
      return sys.counter(windowItems.indexOf(p) + 1, windowItems.length).join('')
    },
    [items, windowItems, oldWindow, m, sys],
  )

  const paintChrome = useCallback(
    (pos: number) => {
      const c = counterRef.current
      const i = Math.min(n - 1, Math.max(0, Math.round(pos)))
      const text = counterText(i)
      if (c && c.textContent !== text) c.textContent = text
      const r = railRef.current
      const g = geo.current
      if (r && g.railW && n > 1) {
        const w = Math.max(8, g.railW / n)
        r.style.width = `${w}px`
        r.style.transform = `translateX(${((g.railW - w) * Math.min(1, Math.max(0, pos / (n - 1)))).toFixed(1)}px)`
      }
    },
    [n, counterText],
  )

  // Geometry from a ResizeObserver (after layout: no forced layout in the commit); the first callback also
  // puts the track on the current photo before the first paint.
  useLayoutEffect(() => {
    const track = trackRef.current
    if (!track || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => {
      const a = track.children[0] as HTMLElement | undefined
      const b = track.children[1] as HTMLElement | undefined
      geo.current.stride = a ? (b ? b.offsetLeft - a.offsetLeft : a.offsetWidth) : 0
      geo.current.railW = railRef.current?.parentElement?.clientWidth ?? 0
      const first = !geo.current.ready
      geo.current.ready = true
      if (first || target.current === null) {
        const left = idxRef.current * geo.current.stride
        if (Math.abs(track.scrollLeft - left) > 1) track.scrollLeft = left
      }
      paintChrome(idxRef.current)
    })
    ro.observe(track)
    // The rail can change width on its own (the pass view's square follows the panel height).
    const rail = railRef.current?.parentElement
    if (rail) ro.observe(rail)
    return () => ro.disconnect()
  }, [paintChrome])

  /** performance.now() of the last user input on the gallery (a scroll the browser makes on its own, a re-snap after
   * a layout change, is not the user's: it never selects a pass or marks the gallery touched) */
  const userAt = useRef(-Infinity)
  /** The programmatic scroll in flight was asked for by the user (‹ ›, ← →) */
  const targetUser = useRef(false)
  const goTo = useCallback(
    (i: number, smooth = true, user = true) => {
      const track = trackRef.current
      const k = Math.min(n - 1, Math.max(0, i))
      if (!track || !geo.current.stride) return
      if (user) userAt.current = performance.now()
      targetUser.current = user
      target.current = k
      curKey.current = itemsRef.current[k]?.key
      const left = k * geo.current.stride
      if (Math.abs(track.scrollLeft - left) < 1) return settleRef.current()
      track.scrollTo({ left, behavior: smooth && !prefersReducedMotion() ? 'smooth' : 'auto' })
      if (!smooth) settleRef.current()
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [n],
  )

  /** The scroll came to rest on a photo: commit it (store), and in the pass view select its pass quietly. */
  const settle = () => {
    const track = trackRef.current
    const g = geo.current
    if (!track || !g.stride) return
    const i = Math.min(n - 1, Math.max(0, Math.round(track.scrollLeft / g.stride)))
    // A smooth scroll still travelling to its target (a slow frame let the settle timer fire): wait for it.
    if (target.current !== null && i !== target.current && Math.abs(track.scrollLeft - target.current * g.stride) > 2) return
    const user = (target.current !== null && targetUser.current) || performance.now() - userAt.current < 2500
    target.current = null
    targetUser.current = false
    if (i !== idxRef.current) setIdx(i)
    paintChrome(i)
    const p = items[i]
    if (!p) return
    curKey.current = p.key
    committed.current = p.key
    useGallery.getState().setKey(p.key, user)
    window.clearTimeout(selectTimer.current)
    if (user && detail && p.pass && p.pass.id !== selectedId) {
      const pass = p.pass
      selectTimer.current = window.setTimeout(() => {
        const t = trackRef.current
        // Still there after the debounce: select it (never a queue of flights for a fast flick).
        if (t && Math.round(t.scrollLeft / geo.current.stride) === i) selectQuietly(pass)
      }, SELECT_DEBOUNCE_MS)
    }
  }
  const settleRef = useRef(settle)
  settleRef.current = settle

  // Scroll: chrome per frame (refs), the neighbour window when the photo under the snap changes, settle at rest.
  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    let raf = 0
    let timer = 0
    const onScroll = () => {
      if (!raf)
        raf = requestAnimationFrame(() => {
          raf = 0
          const g = geo.current
          if (!g.stride) return
          const pos = track.scrollLeft / g.stride
          paintChrome(pos)
          const i = Math.round(pos)
          if (i !== idxRef.current && i >= 0 && i < n) {
            // A user's swipe moves the identity with it; a programmatic glide keeps its target's.
            if (target.current === null) curKey.current = itemsRef.current[i]?.key
            setIdx(i)
          }
        })
      window.clearTimeout(timer)
      timer = window.setTimeout(() => settleRef.current(), SETTLE_MS)
    }
    const onEnd = () => {
      window.clearTimeout(timer)
      settleRef.current()
    }
    const onInput = () => {
      // The user takes over: whatever programmatic glide was running is theirs to end.
      userAt.current = performance.now()
      target.current = null
    }
    track.addEventListener('scroll', onScroll, { passive: true })
    track.addEventListener('scrollend', onEnd)
    track.addEventListener('pointerdown', onInput, { passive: true })
    track.addEventListener('touchstart', onInput, { passive: true })
    track.addEventListener('wheel', onInput, { passive: true })
    return () => {
      track.removeEventListener('scroll', onScroll)
      track.removeEventListener('scrollend', onEnd)
      track.removeEventListener('pointerdown', onInput)
      track.removeEventListener('touchstart', onInput)
      track.removeEventListener('wheel', onInput)
      cancelAnimationFrame(raf)
      window.clearTimeout(timer)
      window.clearTimeout(selectTimer.current)
    }
  }, [n, paintChrome])

  // The list changed under the gallery (R3-2): stay on the same photo. Its new index is taken at once (before the
  // paint: the track jumps by whole slides, so the picture on screen does not move) and the counter is rewritten in
  // place. A photo that left the list (filtered out, dropped by the final report): the next one in order still listed.
  useLayoutEffect(() => {
    const prev = itemsRef.current
    itemsRef.current = items
    if (prev === items) return
    const key = curKey.current
    let i = key ? items.findIndex((p) => p.key === key) : -1
    if (i < 0) i = nearestListed(prev, items, key)
    const next = items[i]?.key
    if (i !== idxRef.current || target.current !== null) {
      target.current = null
      idxRef.current = i
      setIdx(i)
      const track = trackRef.current
      if (track && geo.current.stride && Math.abs(track.scrollLeft - i * geo.current.stride) > 1) track.scrollLeft = i * geo.current.stride
    }
    paintChrome(i)
    if (next && next !== key) {
      curKey.current = next
      committed.current = next
      useGallery.getState().setKey(next, false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  // The selection moved elsewhere (timeline, list, header, the lightbox): follow it. A nearby photo glides there,
  // a far one jumps.
  useEffect(() => {
    if (!wantKey || wantKey === curKey.current) return
    // The store echoing this gallery's own settle back (its render can land after the next ← → already started a
    // new glide): following it would pull the track back to the photo it is leaving.
    if (wantKey === committed.current) return
    const i = items.findIndex((p) => p.key === wantKey)
    if (i < 0) return
    curKey.current = wantKey
    if (!geo.current.ready) {
      idxRef.current = i
      setIdx(i)
      return
    }
    const near = Math.abs(i - idxRef.current) <= 3
    setIdx(i)
    goTo(i, near, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantKey, items])

  // A cover that changes after the first paint (the last clear look from a background patch) no longer replaces the
  // picture on screen (R-M1): the pinned order keeps photo #1 where it is and the new cover lands right after it; the
  // identity rule above (R3-2) keeps whatever the gallery shows.

  // Preload ±2 (decoded before they are swiped to).
  useEffect(() => {
    for (let d = -NEAR; d <= NEAR; d++) {
      const p = items[idx + d]
      if (p && d !== 0) warmPhoto(cardUrl(p.capture))
    }
  }, [idx, items])

  const open = useCallback(
    (p: Photo, el: HTMLElement) => useGallery.getState().openLightbox(p.key, el),
    [],
  )

  // Keyboard handle (← → step, F expands).
  useEffect(() => {
    galleryCtl.current = {
      step: (dir) => {
        const i = (target.current ?? idxRef.current) + dir
        if (i < 0 || i >= n) return false
        goTo(i)
        return true
      },
      jump: (key) => {
        const i = items.findIndex((p) => p.key === key)
        const track = trackRef.current
        if (i < 0 || !track || !geo.current.stride) return false
        target.current = null
        track.scrollLeft = i * geo.current.stride
        curKey.current = key
        idxRef.current = i
        setIdx(i)
        paintChrome(i)
        return true
      },
      expand: () => {
        const i = target.current ?? idxRef.current
        const p = items[i]
        const track = trackRef.current
        const el = p ? track?.querySelector<HTMLElement>(`[data-photo-frame="${CSS.escape(p.key)}"]`) : null
        if (!p || !el || !track) return false
        // A glide still on its way (F pressed mid-→): land on its photo first, so the viewer grows from the frame on screen.
        if (target.current !== null && geo.current.stride) {
          target.current = null
          track.scrollLeft = i * geo.current.stride
          setIdx(i)
          paintChrome(i)
        }
        open(p, el)
        return true
      },
    }
    return () => {
      galleryCtl.current = null
    }
  }, [n, items, goTo, open, paintChrome])

  if (!n) return null
  for (let i = Math.max(0, idx - MOUNT_NEAR); i <= Math.min(n - 1, idx + MOUNT_NEAR); i++) mountedSlides.current.add(items[i].key)
  // Only when there is a choice: two kinds of picture or more.
  const showFilter = [counts.detailed, counts.weather, counts.radar].filter((n) => n > 0).length > 1
  // The counter's longest words ("27 this week") are only said on the last clear look, a photo with no pass.
  const hasLastClear = items.some((p) => !p.pass)
  // Hidden copies of the counter's widest forms in this language, in its grid cell: its room is theirs ("12 esta
  // semana", "この1週間に88枚"), and it never changes as the photo or the count does. Two-digit counts, with a few-
  // and a many-form (Polish, Ukrainian); English's all fit the min-width it always had.
  const sizers = [sys.counter(88, 88).join(''), ...(hasLastClear ? [22, 88].map((k) => (oldWindow ? m.photosThatWeek : m.photosThisWeek)(k)) : [])]
  const hero = !detail

  return (
    <div className={cx(s.gallery, hero ? s.hero : s.detail, mobile && s.mobile)} data-gallery={context}>
      <div className={s.bar}>
        {showFilter ? <FilterControl filter={filter} counts={counts} /> : <span className={s.barLabel}>{hero ? m.barLabel : null}</span>}
        <span className={s.nav}>
          <span className={s.counterBox}>
            <span ref={counterRef} className={cx(s.counter, !hasLastClear && s.counterShort)} aria-live="polite" aria-atomic="true">
              {counterText(idx)}
            </span>
            {sizers.map((t, i) => (
              <span key={i} className={cx(s.counter, !hasLastClear && s.counterShort, s.counterSizer)} aria-hidden="true">
                {t}
              </span>
            ))}
          </span>
          {!mobile ? (
            <>
              <button type="button" className={s.navBtn} onClick={() => goTo(idx - 1)} disabled={idx <= 0} aria-label={m.prevPhoto} aria-keyshortcuts="ArrowLeft" title={m.prevTitle}>
                <Mark name="chevron-left" size={12} />
              </button>
              <button type="button" className={s.navBtn} onClick={() => goTo(idx + 1)} disabled={idx >= n - 1} aria-label={m.nextPhoto} aria-keyshortcuts="ArrowRight" title={m.nextTitle}>
                <Mark name="chevron-right" size={12} />
              </button>
            </>
          ) : null}
        </span>
      </div>

      <div className={s.viewport}>
        <div ref={trackRef} className={s.track} role="group" aria-roledescription={m.carousel} aria-label={m.trackLabel}>
          {items.map((p, i) =>
            // PH-06 / U-1: a slide far from the one on screen is an empty frame until it comes within MOUNT_NEAR (then it
            // stays): the results' arrival lays out 5 slides, not all 29 (~30 nodes each), in the frame the panel mounts.
            Math.abs(i - idx) > MOUNT_NEAR && !mountedSlides.current.has(p.key) ? (
              <figure key={p.key} className={s.slide} aria-hidden>
                {/* the same frame box as the photo's (its aspect: the hero's 3:2 / 16:9, the pass view's square), so a
                    far slide never sets the track's height */}
                <div className={s.figure}>
                  <div className={cx(s.frame, detail ? s.square : s.heroFrame)} />
                </div>
              </figure>
            ) : (
            <Slide
              key={p.key}
              photo={p}
              model={model}
              context={context}
              mobile={mobile}
              index={i}
              total={n}
              photoNo={p.pass ? windowItems.indexOf(p) + 1 : 0}
              photoCount={windowItems.length}
              near={Math.abs(i - idx) <= NEAR}
              current={i === idx}
              cover={model.cover?.photo.key === p.key ? model.cover.why : undefined}
              selected={detail && p.pass?.id === selectedId}
              onExpand={open}
              onReplay={hero ? onReplay : undefined}
              onShare={hero ? onShare : undefined}
            />
            ),
          )}
        </div>
        {n > 1 ? (
          <span className={s.rail} aria-hidden>
            <span ref={railRef} className={s.railThumb} />
          </span>
        ) : null}
      </div>

    </div>
  )
}

/** Where a photo that left the list was: the first photo after it (in the old order) that is still listed, else before it. */
function nearestListed(prev: Photo[], items: Photo[], key: string | undefined): number {
  const at = key ? prev.findIndex((p) => p.key === key) : -1
  if (at < 0 || !items.length) return 0
  const where = new Map(items.map((p, i) => [p.key, i]))
  for (let j = at + 1; j < prev.length; j++) {
    const i = where.get(prev[j].key)
    if (i !== undefined) return i
  }
  for (let j = at - 1; j >= 0; j--) {
    const i = where.get(prev[j].key)
    if (i !== undefined) return i
  }
  return 0
}

/** All · Detailed · Weather · Radar: a hairline segmented control (owner B2). Radar only when the week has some. */
function FilterControl({ filter, counts }: { filter: PhotoFilter; counts: Record<PhotoFilter, number> }) {
  const m = useMsgs(enGallery)
  const opts: PhotoFilter[] = ['all', 'detailed', 'weather', ...(counts.radar ? (['radar'] as const) : [])]
  return (
    <span className={s.filter} role="group" aria-label={m.filterLabel}>
      {opts.map((f) => (
        <button
          key={f}
          type="button"
          className={cx(s.seg, filter === f && s.segOn)}
          aria-pressed={filter === f}
          disabled={!counts[f]}
          title={m.filterTitle[f]}
          onClick={() => useGallery.getState().setFilter(f)}
        >
          {m.filter[f]}
        </button>
      ))}
    </span>
  )
}

interface SlideProps {
  photo: Photo
  model: ResultsModel
  context: 'hero' | 'detail'
  mobile: boolean
  index: number
  total: number
  /** This photo's place among the window's photos (photo 3 of 27), 0 for a photo with no pass */
  photoNo: number
  photoCount: number
  near: boolean
  current: boolean
  cover?: 'closest' | 'lastClear' | 'clouded'
  selected: boolean
  onExpand: (p: Photo, el: HTMLElement) => void
  onReplay?: (pass: Pass) => void
  onShare?: (pass: Pass) => void
}

const Slide = memo(function Slide({ photo, model, context, mobile, index, total, photoNo, photoCount, near, current, cover, selected, onExpand, onReplay, onShare }: SlideProps) {
  const m = useMsgs(enGallery)
  const detail = context === 'detail'
  const { capture, pass } = photo
  const meta = model.meta(pass?.norad ?? capture.norad ?? 0)
  const tz = model.tz
  const t = pass ? model.times(pass) : { day: fmtLocalDay(capture.datetime, tz), time: fmtLocalTime(capture.datetime, tz), zone: zoneAbbr(capture.datetime, tz) }
  const when = pass?.tClosest ?? capture.datetime
  const lead = cover ? m.lead[cover] : undefined
  // Accessible names say the day in words ("Sunday 1 November"), as the pass rows' do: a short day can be all digits
  // ("CN, 1/11"), which a screen reader reads as numbers.
  const spokenDay = fmtSpokenDay(pass?.tClosest ?? capture.datetime, tz)
  const label = m.slideLabel(cover, meta.name, spokenDay, t.time, pass && photoNo ? { k: photoNo, n: photoCount } : undefined)
  void total
  const replay = !detail && pass && onReplay ? () => onReplay(pass) : undefined
  const frameRef = useRef<HTMLDivElement>(null)
  const linesRef = useRef<HTMLSpanElement>(null)
  useClockFit(linesRef)
  const onView = () => {
    const el = frameRef.current?.querySelector<HTMLElement>('[data-photo-frame]')
    if (el) onExpand(photo, el)
  }

  let caption: ReactNode
  if (detail) {
    // The pass view's plate, on the image's edges: product · pixel · crop width (and what the picture shows at the
    // place), the place's coordinates, the archive's credit. Narrow frames drop the crop width (the scale bar on the
    // picture says it); phones drop the coordinates row (the globe's place label right above says them).
    const status = detailStatus(photo)
    const km = cropWidthKm(capture)
    caption = (
      <figcaption className={s.cap}>
        <span className={s.capRow}>
          <span className={s.capMain}>
            {withUnits(productLabel(capture))}
            <span className={s.capKm}> · {withUnits(m.cropKm(km))}</span>
          </span>
          {status ? <span className={cx(s.status, photo.clouded && s.warn)}>{status}</span> : null}
        </span>
        <span className={cx(s.capRow, s.capCoords)}>{coordsOf(model.report.place.lat, model.report.place.lon)}</span>
        <span className={s.credit} lang="en">{credit(capture)}</span>
      </figcaption>
    )
  } else {
    // The summary card: the satellite and its local date and time, the pixel size and how long ago, and one tap
    // target (Replay this pass on the globe; the last clear look, which has no pass, opens large instead). Laptops
    // add the time and what the picture shows at the place on the same two lines, and Share. Why a cover leads
    // ("Closest look", "Last clear look") and a clouded picture's honest label ride on the picture as chips, so the
    // caption is the same two lines for every photo and never truncates (no layout shift, A1).
    const status = mobile ? undefined : heroStatus(photo)
    caption = (
      <figcaption className={s.mCap}>
        {/* The time ends the first line when it fits there whole, else it opens the second (useClockFit). */}
        <span ref={linesRef} className={s.mLines}>
          <span className={s.mLine} data-fit-line="">
            <span data-fit="head">
              <b>{meta.name}</b>
              {' · '}
              {t.day}
            </span>
            <span data-fit="clock1">
              {' · '}
              {t.time}
            </span>
          </span>
          <span className={s.mLine} data-fit-line="">
            <span data-fit="clock2">{`${t.time} · `}</span>
            <span data-fit="rest">{withUnits(pixelLabel(capture))}</span>
            <span className={s.dim} data-fit="ago">
              {' · '}
              <Ago t={when} base={model.clock} />
            </span>
            {status ? (
              <span className={s.mStatus} data-fit="status">
                {' · '}
                {status}
              </span>
            ) : null}
          </span>
        </span>
        {replay ? (
          <button type="button" className={s.mReplay} onClick={replay} tabIndex={current ? 0 : -1} aria-label={m.replayLabel(meta.name, spokenDay, t.time)}>
            <Glyph name="play" size={10} />
            <span className={s.mReplayText}>
              {/* The message's strong part is the tablet-only rest of the phrase: "Replay" + <span> this pass</span>. */}
              <Rich parts={m.replay} classes={{ strong: s.tabletOnly }} strongAs="span" />
            </span>
          </button>
        ) : (
          // R3-7: a photo with no pass (the last clear look from before the window) opens large, with its own
          // metadata; it never selects a pass.
          <button
            type="button"
            className={s.mReplay}
            onClick={onView}
            tabIndex={current ? 0 : -1}
            aria-label={(cover === 'lastClear' ? m.viewLabel.lastClear : m.viewLabel.photo)(meta.name, spokenDay, t.time)}
          >
            <Mark name="expand" size={11} />
            <span className={s.mReplayText}>{m.view}</span>
          </button>
        )}
        {!mobile && pass && onShare ? (
          <button type="button" className={s.mShare} onClick={() => onShare(pass)} tabIndex={current ? 0 : -1} aria-label={m.sharePass} title={m.sharePass}>
            <Glyph name="share" size={13} />
          </button>
        ) : null}
      </figcaption>
    )
  }

  return (
    <figure className={s.slide} role="group" aria-roledescription={m.slide} aria-label={label} aria-hidden={!current || undefined} data-current={current || undefined}>
      <div ref={frameRef} className={s.figure} data-image-end={current && detail ? '' : undefined}>
        <PhotoFrame
          photo={photo}
          model={model}
          view={detail ? 'detail' : 'hero'}
          load={near}
          current={current}
          reveal={detail ? (selected ? 'capture' : undefined) : index === 0 && cover ? 'hero' : undefined}
          chips={detail}
          echo={detail && selected}
          reticle={detail ? '26%' : mobile ? 40 : 44}
          gateOnVisible={mobile}
          onExpand={(el) => onExpand(photo, el)}
          className={detail ? s.square : s.heroFrame}
          tag={detail ? undefined : cover === 'closest' || cover === 'lastClear' ? { text: lead! } : photo.kind === 'radar' ? { text: m.radarTag, ice: true } : undefined}
          note={
            detail
              ? undefined
              : cover === 'lastClear'
                ? { text: model.windowPhotos ? m.noteMostlyCloud : m.noteLastClear }
                : photo.clouded
                  ? { text: cloudedWords(photo, cover === 'clouded'), warn: true }
                  : undefined
          }
        />
        {caption}
      </div>
    </figure>
  )
})

/**
 * Where a caption's clock goes, decided by what its lines hold, not by the card's width: a width says nothing of how
 * long the words are, and at widths English fits, "SO 01.11." beside "ABSPIELEN", "DIM. 1 NOV.", Japanese or Korean
 * cut the time to "11:…". The clock ends the first line when it fits there whole; otherwise it opens the second,
 * where the relative age gives way first and then the status, so the time is never cut. A root whose CSS sets
 * `--clock-below: 1` (phones, a narrow card: PH-14) always sets it on the second line. A head may also offer its day
 * with and without the weekday (`day` / `dayShort`): the short form is used only when the head alone would be cut.
 *
 * The pieces are marked `data-fit` and always rendered; one set aside is taken out of flow and hidden by CSS
 * (`[data-below]`, `[data-no-ago]`, `[data-no-status]`, `[data-short-day]` on the root, written here and never by
 * React), so its width can still be read and the decision never feeds back on itself. Measured in a ResizeObserver's callback (after
 * layout, before paint: the first paint is already right, and the commit forces no layout), and again when the words
 * change (a locale, the age ticking) or a font arrives. The lines' root holds two `data-fit-line` lines; a root
 * without them (the viewer's laptop strip, which drops its age whole by itself) is left alone.
 */
export function useClockFit(ref: RefObject<HTMLElement | null>, layout?: unknown) {
  useLayoutEffect(() => {
    const root = ref.current
    if (!root || typeof ResizeObserver === 'undefined') return
    const fit = () => fitClock(root)
    const ro = new ResizeObserver(fit)
    ro.observe(root)
    const mo = new MutationObserver(fit)
    mo.observe(root, { childList: true, characterData: true, subtree: true })
    const fonts = typeof document !== 'undefined' ? document.fonts : undefined
    fonts?.addEventListener?.('loadingdone', fit)
    return () => {
      ro.disconnect()
      mo.disconnect()
      fonts?.removeEventListener?.('loadingdone', fit)
    }
    // `layout`: a caller whose lines' root is another element in another layout (the viewer's phone and laptop forms)
  }, [ref, layout])
}

function fitClock(root: HTMLElement, again = true) {
  const lines = root.querySelectorAll<HTMLElement>('[data-fit-line]')
  if (lines.length < 2) return
  // Rects, not offsetWidth: fractional, and scaled alike while the viewer's open animation transforms the strip.
  const width = (k: string) => {
    let w = 0
    for (const el of root.querySelectorAll<HTMLElement>(`[data-fit="${k}"]`)) w += el.getBoundingClientRect().width
    return w
  }
  const room = (i: number) => lines[i].getBoundingClientRect().width + 0.5
  // A head that offers its day in two forms (the viewer's phone strip: "NIEDZ., 1 LIS" / "1 LIS") holds whichever is in
  // flow: the weekday gives way only when the head alone would be cut, so the date itself never is.
  const day = width('day')
  const dayShort = width('dayShort')
  const headBase = width('head') - (root.hasAttribute('data-short-day') ? dayShort : day)
  const shortDay = dayShort > 0 && headBase + day > room(0)
  const head = headBase + (shortDay ? dayShort : day)
  const below = getComputedStyle(root).getPropertyValue('--clock-below').trim() === '1' || head + width('clock1') > room(0)
  let noAgo = false
  let noStatus = false
  if (below) {
    const line2 = width('clock2') + width('rest')
    const status = width('status')
    noAgo = line2 + width('ago') + status > room(1)
    noStatus = noAgo && line2 + status > room(1)
  }
  const moved = below !== root.hasAttribute('data-below')
  root.toggleAttribute('data-short-day', shortDay)
  root.toggleAttribute('data-below', below)
  root.toggleAttribute('data-no-ago', noAgo)
  root.toggleAttribute('data-no-status', noStatus)
  // A piece can read differently once the clock has moved (the viewer's age gains its leading separator only below
  // the clock), and the line it was measured in no longer exists: measure the new arrangement once more.
  if (moved && again) fitClock(root, false)
}

/** What a picture shows at the place, in the fewest words (honest about cloud, decision #2). Read at render time. */
function shortStatus(p: Photo): string | undefined {
  const m = msgs(enGallery).status
  const c = p.capture
  if (p.clouded) return c.cloudCoverPct !== undefined && c.cloudCoverPct >= 70 ? m.cloudedPct(c.cloudCoverPct) : m.cloudAtSpot
  switch (c.spot) {
    case 'clear':
      return m.clear
    case 'cirrus':
      return m.cirrus
    case 'shadow':
      return m.shadow
    default:
      return c.cloudCoverPct !== undefined ? m.cloudPct(c.cloudCoverPct) : undefined
  }
}

/** Laptops' summary card, second line: a clouded picture says so on the picture itself (a chip), not here. */
function heroStatus(p: Photo): string | undefined {
  if (p.kind === 'mosaic') return msgs(enGallery).status.mosaic
  // A radar image's tag on the picture already says what it is.
  if (p.kind === 'radar') return undefined
  return p.clouded ? undefined : shortStatus(p)
}

/** The pass view's plate: a mosaic's or a radar image's product line already says what it is. */
function detailStatus(p: Photo): string | undefined {
  return p.kind === 'mosaic' || p.kind === 'radar' ? undefined : shortStatus(p)
}

/** A clouded picture's chip: "Clouded over · 86%" / "Cloud at your spot". */
function cloudedWords(p: Photo, cover: boolean): string {
  const m = msgs(enGallery).clouded
  const pct = p.capture.cloudCoverPct
  if (pct !== undefined && pct >= 70) return m.pct(pct)
  return cover ? m.coverAtSpot : m.atSpot
}

/**
 * Copyright / credit line required by each archive. Not copy: legal attributions stay in English in every language
 * (docs/I18N.md), word for word as each licensor asks, like the share card's (api/_lib/cardSpec.ts creditFor). Its
 * element carries lang="en", so the caption's text-transform cases it as English ("CONTAINS", never "CONTAİNS").
 */
export function credit(c: Photo['capture']): string {
  if (c.collection === 'sentinel-2-l2a' || c.collection === 'sentinel-1-rtc') return `Contains modified Copernicus Sentinel data ${new Date(c.datetime || Date.now()).getUTCFullYear()}`
  if (c.collection === 'landsat-c2-l2') return 'Landsat: USGS / NASA'
  // The attribution EUMETSAT's data policy asks for (article 6.3).
  if (c.provider === 'eumetsat') return `Contains modified EUMETSAT Meteosat data ${new Date(c.datetime || Date.now()).getUTCFullYear()}`
  if (c.collection === 'gibs-himawari') return 'Himawari: JMA, via NASA GIBS'
  if (isGeoFrame(c)) return 'GOES: NOAA / CIRA, via NASA GIBS'
  return 'NASA GIBS / EOSDIS'
}
