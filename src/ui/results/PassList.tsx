/**
 * PASSES, grouped by verdict (see lib/groups.ts for the model). Photographs are individual rows with
 * a live thumbnail of the real crop, in the gallery's order (owner B1: the closest look, then newest first);
 * the thumbnail is its own control that opens the photo large (owner B2). Everything else is one row per
 * satellite, expandable to its passes. Long groups show their top rows, then page in 40 at a time.
 *
 * Signal colour only where a detailed image of the place exists (V07): photographed rows carry no tag
 * at all, except the two honest exceptions, 'Mosaic' (coarse daily weather picture) and
 * 'Clouded · 86%' (warn), whose thumbnail is dimmed and hatched instead of a bright white square.
 */
import { memo, useEffect, useLayoutEffect, useRef, useState, type RefCallback, type RefObject } from 'react'
import { useApp } from '@/state/store'
import type { Capture, Pass } from '@/types'
import { Glyph, Tag, cx } from '@/ui/system'
import { msgs, useMsgs } from '@/i18n/runtime'
import enPassView from '@/i18n/en/passView'
import { withUnits } from '@/i18n/Rich'
import { Ago, reportNow } from './Ago'
import { Mark } from './Mark'
import { prefetchPassImage } from './actions'
import { isClouded } from './lib/bestLook'
import { captureFor, isDailyMosaic, isRadar } from './lib/captures'
import { EAGER_THUMBS } from './warm'
import { thumbUrl } from './lib/photos'
import { useGallery } from './gallery'
import { decodedPhoto, hasPhotoElement, loadPhoto } from './images'
import { Img } from './Img'
import { visibleCount, type ListItem, type PassGroup, type PassItem, type SatItem } from './lib/groups'
import { glyphForPass, markColorVar, VERDICT_GLYPH, VERDICT_META, VERDICT_TITLE, type Verdict } from './lib/meta'
import { fmtSpokenDay, spokenRelative } from './lib/time'
import type { ResultsModel } from './model'
import s from './PassList.module.css'

interface Props {
  model: ResultsModel
  selectedId?: string
  onSelect: (p: Pass) => void
}


export function PassList({ model, selectedId, onSelect }: Props) {
  // A row's pointerleave never fires when the list unmounts under the pointer (a click opens the
  // detail), so drop the globe's hover highlight with the list.
  useEffect(() => () => useApp.getState().setHoveredNorad(undefined), [])
  const m = useMsgs(enPassView)
  if (!model.groups.length) return <p className={s.empty}>{m.empty}</p>
  return (
    <div className={s.list}>
      {model.groups.map((g) => (
        <Group key={g.verdict} group={g} model={model} selectedId={selectedId} onSelect={onSelect} />
      ))}
    </div>
  )
}

function Group({ group, model, selectedId, onSelect }: { group: PassGroup } & Props) {
  const m = useMsgs(enPassView)
  const [pages, setPages] = useState(0)
  const [open, setOpen] = useState<Set<string>>(() => new Set())
  const total = group.items.length
  const shown = visibleCount(total, group.verdict, pages)
  const rest = total - shown
  const sats = group.items.filter((i) => i.kind === 'sat').length
  const showAll = sats === total ? m.showAllSats : m.showAllRows
  // Keep a selected pass visible: if it lives in a collapsed satellite, open that satellite.
  useEffect(() => {
    if (!selectedId) return
    const idx = group.items.findIndex((i) => (i.kind === 'sat' ? i.passes.some((p) => p.id === selectedId) : i.pass.id === selectedId))
    if (idx < 0) return
    const item = group.items[idx]
    if (item.kind === 'sat') setOpen((o) => (o.has(item.key) ? o : new Set(o).add(item.key)))
    // Page far enough that the row is rendered.
    setPages((pg) => {
      let n = pg
      while (visibleCount(total, group.verdict, n) <= idx) n++
      return n
    })
    // Only when the selection changes, so the user can still collapse it afterwards.
  }, [selectedId, group.items])

  const toggle = (key: string) =>
    setOpen((o) => {
      const n = new Set(o)
      if (n.has(key)) n.delete(key)
      else n.add(key)
      return n
    })

  const imaged = group.verdict === 'imaged'
  return (
    <section className={s.group} id={`passes-${group.verdict}`} aria-label={VERDICT_TITLE[group.verdict]}>
      <header className={s.groupHead} title={VERDICT_META[group.verdict].definition} ref={fitHead}>
        <span className={cx(s.groupTitle, imaged && s.signal)}>
          <Glyph name={VERDICT_GLYPH[group.verdict]} size={12} color={imaged ? 'var(--signal)' : undefined} />
          <span className={s.groupName}>{VERDICT_TITLE[group.verdict]}</span>
          {imaged && group.items.some((i) => i.kind === 'pass') ? <span className={s.order}> · {m.imagedOrder}</span> : null}
        </span>
        <span className={s.groupCount}>
          {m.count(group.passCount, group.verdict)}
          <span className={cx(s.dim, s.satCount, imaged && s.satCountImaged)} data-shed="1">
            {' '}
            · {m.sats(group.satCount)}
          </span>
        </span>
      </header>
      <ul className={s.rows}>
        {group.items.slice(0, shown).map((item, i) => (
          <li key={item.key}>
            {item.kind === 'pass' ? (
              <PassRow item={item} model={model} selected={item.pass.id === selectedId} eager={i < EAGER_THUMBS} onSelect={onSelect} />
            ) : (
              <SatRow item={item} verdict={group.verdict} model={model} expanded={open.has(item.key)} onToggle={() => toggle(item.key)} selectedId={selectedId} onSelect={onSelect} />
            )}
          </li>
        ))}
      </ul>
      {rest > 0 || pages > 0 ? (
        <div className={s.more}>
          {rest > 0 ? (
            <button type="button" className={s.moreBtn} onClick={() => setPages((p) => p + 1)}>
              {pages === 0 ? showAll(total) : m.showMore(Math.min(rest, 40))}
              <span className={s.dim}>{pages === 0 ? '' : ` · ${m.left(rest)}`}</span>
              <Glyph name="arrow-right" size={11} className={s.down} />
            </button>
          ) : null}
          {pages > 0 ? (
            <button type="button" className={s.moreBtn} onClick={() => setPages(0)}>
              {m.showFewer}
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

const hover = (p: Pass | undefined) => useApp.getState().setHoveredNorad(p?.norad)

/**
 * "Clouded · 86%" when the picture is mostly cloud, "Mosaic" for a daily weather mosaic, "Radar" for a radar image
 * (read at render time, in the active language).
 */
function exceptionTag(c: Capture | undefined): { text: string; warn: boolean } | null {
  if (!c) return null
  const m = msgs(enPassView).tag
  if (isDailyMosaic(c)) return { text: m.mosaic, warn: false }
  if (isRadar(c)) return { text: m.radar, warn: false }
  if (isClouded(c)) return { text: c.cloudCoverPct !== undefined ? m.cloudedPct(c.cloudCoverPct) : m.cloudedAtSpot, warn: true }
  return null
}

const PassRow = memo(function PassRow({
  item,
  model,
  selected,
  eager,
  onSelect,
}: {
  item: PassItem
  model: ResultsModel
  selected: boolean
  eager: boolean
  onSelect: (p: Pass) => void
}) {
  const m = useMsgs(enPassView)
  const { pass: p, meta } = item
  const capture = captureFor(model.report, p)
  const t = model.times(p)
  const tag = exceptionTag(capture)
  const clouded = !!capture && !isDailyMosaic(capture) && isClouded(capture)
  const prefetch = () => prefetchPassImage(model.report, p)
  const label = m.rowLabel({
    sat: meta.name,
    verb: VERDICT_META[p.verdict].verb,
    day: fmtSpokenDay(p.tClosest, model.tz),
    time: t.time,
    zone: t.zone,
    ago: spokenRelative(p.tClosest, reportNow(model.clock)),
    cloudPct: capture?.cloudCoverPct,
    clouded: !!tag?.warn,
  })
  const photoKey = model.photoByPass.get(p.id)
  const thumb = capture && !isDailyMosaic(capture) ? thumbUrl(capture) : undefined
  return (
    <>
      <button
        type="button"
        className={cx(s.row, selected && s.selected, thumb && s.rowThumb)}
        aria-current={selected || undefined}
        aria-label={label}
        data-pass-row
        onClick={() => onSelect(p)}
        onPointerEnter={() => {
          hover(p)
          prefetch()
        }}
        onPointerDown={prefetch}
        onPointerLeave={() => hover(undefined)}
        onFocus={prefetch}
      >
        <span className={s.glyph}>
          <Mark name={glyphForPass(p.verdict, meta.category)} size={14} color={markColorVar(p.verdict, meta.category)} />
        </span>
        <span className={s.main} ref={fitMeta}>
          <span className={s.nameLine}>
            <span className={s.name}>{meta.name}</span>
            {tag ? <Tag className={cx(s.tag, tag.warn && s.tagWarn)}>{tag.text}</Tag> : null}
          </span>
          <span className={s.metaLine}>
            {t.day} ·{' '}
            {/* One island, so right to left the zone stays after its clock ("11:21 UTC−5"). Narrow phones drop the zone
                (the timeline and the footnote name it) before the age. */}
            <span data-num="">
              {t.time}
              <span className={s.zone} data-shed="1">
                {' '}
                {t.zone}
              </span>
            </span>
            <span className={s.dim} data-shed="3">
              {' · '}
              <Ago t={p.tClosest} base={model.clock} />
            </span>
          </span>
          <span className={s.metaLine}>
            {m.offNadir(p.offNadirDeg)}
            {/* …and the ground distance before the cloud, which is what a photograph is judged by. */}
            <span className={capture?.cloudCoverPct !== undefined ? s.km : undefined} data-shed={capture?.cloudCoverPct !== undefined ? '1' : undefined}>
              {' '}
              · {withUnits(m.distanceKm(p.groundDistanceKm))}
            </span>
            {capture?.cloudCoverPct !== undefined ? <span className={s.dim}> · {m.cloudPct(capture.cloudCoverPct)}</span> : null}
          </span>
        </span>
      </button>
      {thumb && photoKey ? (
        <button
          type="button"
          className={s.thumbBtn}
          aria-label={m.expandLabel(meta.name, fmtSpokenDay(p.tClosest, model.tz), t.time)}
          title={m.expandTitle}
          onClick={(e) => useGallery.getState().openLightbox(photoKey, e.currentTarget)}
          onPointerEnter={prefetch}
        >
          <Thumb url={thumb} eager={eager} clouded={clouded} />
        </button>
      ) : null}
    </>
  )
})

/**
 * The operator beside the name: where all of it does not fit there (the ISS's "NASA / Roscosmos / ESA / JAXA / CSA"),
 * it goes under the name (PassList.module.css) and breaks only after a slash, each agency's name whole. It was cut with
 * an ellipsis, which hid agencies: a label says exactly who operates the satellite. One text node, as before (spans
 * moved the glyphs a quarter pixel): a word joiner after every space but those that follow a slash.
 */
export function operatorText(text: string): string {
  return text.replace(/ /g, (sp, at: number) => (text[at - 1] === '/' ? sp : ' \u2060'))
}

const SatRow = memo(function SatRow({
  item,
  verdict,
  model,
  expanded,
  onToggle,
  selectedId,
  onSelect,
}: {
  item: SatItem
  verdict: Verdict
  model: ResultsModel
  expanded: boolean
  onToggle: () => void
  selectedId?: string
  onSelect: (p: Pass) => void
}) {
  const m = useMsgs(enPassView)
  const { meta, passes, latest, closest } = item
  const containsSelected = !!selectedId && passes.some((p) => p.id === selectedId)
  const listId = `sat-${item.key.replace(/[^a-z0-9-]/gi, '')}`
  const lt = model.times(latest)
  // The count stacked over its unit, the unit in the form the number takes in the active language.
  const count = m.countStack(passes.length, verdict)
  const label = m.satLabel({
    sat: meta.name,
    operator: meta.operator,
    passes: passes.length,
    verdict,
    day: fmtSpokenDay(latest.tClosest, model.tz),
    time: lt.time,
  })
  return (
    <>
      <button
        type="button"
        className={cx(s.row, s.satRow, containsSelected && !expanded && s.selected)}
        aria-expanded={expanded}
        aria-controls={listId}
        aria-label={label}
        onClick={onToggle}
        onPointerEnter={() => hover(latest)}
        onPointerLeave={() => hover(undefined)}
      >
        <span className={s.glyph}>
          <Mark name={glyphForPass(verdict, meta.category)} size={14} color={markColorVar(verdict, meta.category)} />
        </span>
        <span className={s.main} ref={fitMeta}>
          <span className={s.nameLine}>
            <span className={s.name}>{meta.name}</span>
            {meta.operator ? <span className={s.operator}>{operatorText(meta.operator)}</span> : null}
          </span>
          <span className={s.metaLine}>
            <span className={s.giveWay} data-shed="1">
              {m.latest}
            </span>
            {lt.day} · <span data-num="">{lt.time}</span>
            <span className={s.dim} data-shed="3">
              {' · '}
              <Ago t={latest.tClosest} base={model.clock} />
            </span>
          </span>
          <span className={s.metaLine}>
            <span className={s.giveWay} data-shed="1">
              {m.closest}
            </span>
            {m.offNadir(closest.offNadirDeg)}
            <span data-shed="3"> · {withUnits(m.distanceKm(closest.groundDistanceKm))}</span>
          </span>
        </span>
        <span className={s.count}>
          <span className={s.countNum}>{count.n}</span>
          <span className={s.countUnit}>{count.u}</span>
        </span>
        <span className={cx(s.chev, s.flipRtl, expanded && s.chevOpen)} aria-hidden>
          <Glyph name="arrow-right" size={11} />
        </span>
      </button>
      {expanded ? (
        <ul className={s.sub} id={listId}>
          {passes.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className={cx(s.subRow, p.id === selectedId && s.selected)}
                aria-current={p.id === selectedId || undefined}
                data-pass-row
                onClick={() => onSelect(p)}
                onPointerEnter={() => {
                  hover(p)
                  prefetchPassImage(model.report, p)
                }}
                onPointerDown={() => prefetchPassImage(model.report, p)}
                onPointerLeave={() => hover(undefined)}
              >
                <span>
                  {model.times(p).stamp}
                  <span className={s.dim}>
                    {' · '}
                    <Ago t={p.tClosest} base={model.clock} />
                  </span>
                </span>
                <span className={s.subGeo}>
                  {m.offNadirShort(p.offNadirDeg)} · {withUnits(m.distanceKm(p.groundDistanceKm))}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  )
})

/*
 * A row's two mono meta lines fit the row's real width, whatever the language: a container query can only guess from
 * the list's width (English's words), while "OVERVLUCHTEN" in the count column or Polish's "pon., 2 lis" and
 * "6 godz. temu" are wider. So the row measures itself: while a meta line still ends in an ellipsis, it hides one more
 * level (1: the parts marked `data-shed="1"`, the "Latest" / "Closest" words, both lines together so the row reads
 * as one, and the zone or the photo's ground distance; 2: the tracking tightens to none; 3: the `data-shed="3"`
 * parts, the age and the closest pass's distance; 4: the tracking a hair below none), so the day and the clock read
 * whole. A group's header does the same with its satellite count, before its title would wrap. Whatever fits hides
 * nothing: English, whose lines fit, renders as before. It runs again when the box changes, when its text changes (the
 * age ticks) and when a web font arrives.
 */
const fits = new Map<Element, () => void>()
let sizes: ResizeObserver | undefined

function shedRef(levels: number, over: (el: HTMLElement) => boolean): RefCallback<HTMLElement> {
  return (el) => {
    if (!el || typeof ResizeObserver === 'undefined') return
    const fit = () => {
      let level = 0
      delete el.dataset.level
      if (!el.querySelector('[data-shed]')) return
      while (level < levels && over(el)) el.dataset.level = String(++level)
    }
    if (!sizes) {
      sizes = new ResizeObserver((entries) => entries.forEach((e) => fits.get(e.target)?.()))
      document.fonts?.addEventListener('loadingdone', () => fits.forEach((f) => f()))
    }
    // Text only (the level is an attribute on the box itself, so fitting never wakes it again). The box's size comes
    // from the list, never from what it hides, so neither does the ResizeObserver.
    const texts = new MutationObserver(fit)
    texts.observe(el, { subtree: true, characterData: true, childList: true })
    fits.set(el, fit)
    sizes.observe(el)
    fit()
    return () => {
      fits.delete(el)
      sizes?.unobserve(el)
      texts.disconnect()
    }
  }
}

/** Ends in an ellipsis: scrollWidth rounds to whole pixels, so a line over by a fraction is caught by its text's width. */
function cut(el: Element): boolean {
  if (el.scrollWidth > el.clientWidth) return true
  const text = document.createRange()
  text.selectNodeContents(el)
  return text.getBoundingClientRect().width > el.getBoundingClientRect().width + 0.25
}

/** Takes more than one line (a verdict's name wraps rather than be cut). */
function wraps(el: Element): boolean {
  const text = document.createRange()
  text.selectNodeContents(el)
  return new Set(Array.from(text.getClientRects(), (r) => Math.round(r.top))).size > 1
}

const fitMeta = shedRef(4, (el) => Array.from(el.querySelectorAll(`.${s.metaLine}`)).some(cut))
const fitHead = shedRef(1, (el) => Array.from(el.querySelectorAll(`.${s.groupName}`)).some((n) => cut(n) || wraps(n)))

/** Thumbnail URLs already shown this session: a remount (back from a pass) shows them at once, no fade (A2). */
const shownThumbs = new Set<string>()

/** Thumbnail of the real crop: eager for the first rows, else loads when scrolled near. */
/**
 * The cloud chip's word, set tighter when it is wider than the thumb (48 px on small phones: Russian «Облака», Polish
 * «Chmury» were cut at the edge): untracked and narrower, never smaller or ellipsised. English's "Cloud" fits as it is.
 * Measured again when the thumb changes size and when the web fonts arrive.
 */
function useTightChip(ref: RefObject<HTMLSpanElement | null>, on: boolean, word: string) {
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    let alive = true
    const fit = () => {
      if (!alive) return
      el.removeAttribute('data-tight')
      if (el.scrollWidth > el.clientWidth + 0.5) el.setAttribute('data-tight', '')
    }
    fit()
    void document.fonts?.ready.then(fit)
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null
    ro?.observe(el)
    return () => {
      alive = false
      ro?.disconnect()
    }
  }, [ref, on, word])
}

function Thumb({ url, eager, clouded }: { url: string; eager: boolean; clouded: boolean }) {
  const m = useMsgs(enPassView)
  const ref = useRef<HTMLSpanElement>(null)
  const chip = useRef<HTMLSpanElement>(null)
  useTightChip(chip, clouded, m.cloudChip)
  const known = shownThumbs.has(url) || hasPhotoElement('list', url)
  const [visible, setVisible] = useState(eager || known)
  const [state, setState] = useState<'idle' | 'ok' | 'err'>(known || decodedPhoto(url) ? 'ok' : 'idle')
  // The first showing this session fades in once; a remount (back from a pass) shows the same element at once (A2).
  const [fade] = useState(() => !known)
  useEffect(() => {
    if (visible) return
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') return setVisible(true)
    const io = new IntersectionObserver((e) => e.some((x) => x.isIntersecting) && setVisible(true), { rootMargin: '200px' })
    io.observe(el)
    return () => io.disconnect()
  }, [visible])
  // Through the shared loader (one request per URL, R3-1); the lightbox filmstrip asks for the same 112 px crop.
  useEffect(() => {
    if (!visible || state !== 'idle') return
    let alive = true
    loadPhoto(url)
      .then(() => alive && setState('ok'))
      .catch(() => alive && setState('err'))
    return () => {
      alive = false
    }
  }, [visible, state, url])
  return (
    <span ref={ref} className={cx(s.thumb, clouded && s.thumbClouded)} aria-hidden>
      {state === 'ok' ? <Img view="list" url={url} alt="" fadeClass={fade ? s.thumbFade : undefined} onReady={() => shownThumbs.add(url)} /> : null}
      {clouded ? <span className={s.hatch} /> : null}
      <span className={s.thumbMark} />
      {/* The word only: the row's tag carries the number, and "CLOUD 100%" does not fit a 56 px thumb. */}
      {clouded ? (
        <span ref={chip} className={s.cloudChip}>
          {m.cloudChip}
        </span>
      ) : null}
      <span className={s.thumbExpand}>
        <Mark name="expand" size={10} />
      </span>
    </span>
  )
}

export type { ListItem }
