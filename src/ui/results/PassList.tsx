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
import { memo, useEffect, useRef, useState } from 'react'
import { useApp } from '@/state/store'
import type { Capture, Pass } from '@/types'
import { Glyph, Tag, cx } from '@/ui/system'
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
import { int, trackKm } from './lib/copy'
import { visibleCount, type ListItem, type PassGroup, type PassItem, type SatItem } from './lib/groups'
import { glyphForPass, markColorVar, VERDICT_GLYPH, VERDICT_META, VERDICT_TITLE, verdictUnit, type Verdict } from './lib/meta'
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
  if (!model.groups.length)
    return <p className={s.empty}>No satellite we track crossed this place in the window. That is rare; the notes above say if a data source was down.</p>
  return (
    <div className={s.list}>
      {model.groups.map((g) => (
        <Group key={g.verdict} group={g} model={model} selectedId={selectedId} onSelect={onSelect} />
      ))}
    </div>
  )
}

function Group({ group, model, selectedId, onSelect }: { group: PassGroup } & Props) {
  const [pages, setPages] = useState(0)
  const [open, setOpen] = useState<Set<string>>(() => new Set())
  const total = group.items.length
  const shown = visibleCount(total, group.verdict, pages)
  const rest = total - shown
  const sats = group.items.filter((i) => i.kind === 'sat').length
  const unit = sats === total ? (total === 1 ? 'satellite' : 'satellites') : 'rows'
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
      <header className={s.groupHead} title={VERDICT_META[group.verdict].definition}>
        <span className={cx(s.groupTitle, imaged && s.signal)}>
          <Glyph name={VERDICT_GLYPH[group.verdict]} size={12} color={imaged ? 'var(--signal)' : undefined} />
          {VERDICT_TITLE[group.verdict]}
          {imaged && group.items.some((i) => i.kind === 'pass') ? <span className={s.order}> · closest look, then newest</span> : null}
        </span>
        <span className={s.groupCount}>
          {int(group.passCount)} {verdictUnit(group.verdict, group.passCount)}
          <span className={cx(s.dim, s.satCount, imaged && s.satCountImaged)}>
            {' '}
            · {int(group.satCount)} {group.satCount === 1 ? 'sat' : 'sats'}
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
              {pages === 0 ? `Show all ${int(total)} ${unit}` : `Show ${int(Math.min(rest, 40))} more`}
              <span className={s.dim}>{pages === 0 ? '' : ` · ${int(rest)} left`}</span>
              <Glyph name="arrow-right" size={11} className={s.down} />
            </button>
          ) : null}
          {pages > 0 ? (
            <button type="button" className={s.moreBtn} onClick={() => setPages(0)}>
              Show fewer
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

const hover = (p: Pass | undefined) => useApp.getState().setHoveredNorad(p?.norad)

/** "Clouded · 86%" when the picture is mostly cloud, "Mosaic" for a daily weather mosaic, "Radar" for a radar image. */
function exceptionTag(c: Capture | undefined): { text: string; warn: boolean } | null {
  if (!c) return null
  if (isDailyMosaic(c)) return { text: 'Mosaic', warn: false }
  if (isRadar(c)) return { text: 'Radar', warn: false }
  if (isClouded(c)) return { text: `Clouded · ${c.cloudCoverPct !== undefined ? `${int(c.cloudCoverPct)}%` : 'at spot'}`, warn: true }
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
  const { pass: p, meta } = item
  const capture = captureFor(model.report, p)
  const t = model.times(p)
  const tag = exceptionTag(capture)
  const clouded = !!capture && !isDailyMosaic(capture) && isClouded(capture)
  const prefetch = () => prefetchPassImage(model.report, p)
  const label = [
    meta.name,
    VERDICT_META[p.verdict].verb,
    `${fmtSpokenDay(p.tClosest, model.tz)} ${t.time} ${t.zone}`,
    spokenRelative(p.tClosest, reportNow(model.clock)),
    capture?.cloudCoverPct !== undefined ? `cloud ${int(capture.cloudCoverPct)} percent` : undefined,
    tag?.warn ? 'clouded over' : undefined,
  ]
    .filter(Boolean)
    .join(', ')
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
        <span className={s.main}>
          <span className={s.nameLine}>
            <span className={s.name}>{meta.name}</span>
            {tag ? <Tag className={cx(s.tag, tag.warn && s.tagWarn)}>{tag.text}</Tag> : null}
          </span>
          <span className={s.metaLine}>
            {t.day} · {t.time}
            {/* Narrow phones drop the zone (the timeline and the footnote name it) before the age. */}
            <span className={s.zone}> {t.zone}</span>
            <span className={s.dim}>
              {' · '}
              <Ago t={p.tClosest} base={model.clock} />
            </span>
          </span>
          <span className={s.metaLine}>
            {p.offNadirDeg.toFixed(1)}° off-nadir
            {/* …and the ground distance before the cloud, which is what a photograph is judged by. */}
            <span className={capture?.cloudCoverPct !== undefined ? s.km : undefined}> · {trackKm(p.groundDistanceKm)} km from track</span>
            {capture?.cloudCoverPct !== undefined ? <span className={s.dim}> · cloud {int(capture.cloudCoverPct)}%</span> : null}
          </span>
        </span>
      </button>
      {thumb && photoKey ? (
        <button
          type="button"
          className={s.thumbBtn}
          aria-label={`Expand the photo: ${meta.name}, ${t.day} ${t.time}`}
          title="Expand the photo"
          onClick={(e) => useGallery.getState().openLightbox(photoKey, e.currentTarget)}
          onPointerEnter={prefetch}
        >
          <Thumb url={thumb} eager={eager} clouded={clouded} />
        </button>
      ) : null}
    </>
  )
})

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
  const { meta, passes, latest, closest } = item
  const containsSelected = !!selectedId && passes.some((p) => p.id === selectedId)
  const listId = `sat-${item.key.replace(/[^a-z0-9-]/gi, '')}`
  const lt = model.times(latest)
  const label = `${meta.name}${meta.operator ? `, ${meta.operator}` : ''}, ${int(passes.length)} ${verdictUnit(verdict, passes.length)}, latest ${fmtSpokenDay(latest.tClosest, model.tz)} ${lt.time}`
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
        <span className={s.main}>
          <span className={s.nameLine}>
            <span className={s.name}>{meta.name}</span>
            {meta.operator ? <span className={s.operator}>{meta.operator}</span> : null}
          </span>
          <span className={s.metaLine}>
            <span className={s.giveWay}>Latest </span>
            {lt.day} · {lt.time}
            <span className={s.dim}>
              {' · '}
              <Ago t={latest.tClosest} base={model.clock} />
            </span>
          </span>
          <span className={s.metaLine}>
            <span className={s.giveWay}>Closest </span>
            {closest.offNadirDeg.toFixed(1)}° off-nadir · {trackKm(closest.groundDistanceKm)} km from track
          </span>
        </span>
        <span className={s.count}>
          <span className={s.countNum}>{int(passes.length)}</span>
          <span className={s.countUnit}>{verdictUnit(verdict, passes.length)}</span>
        </span>
        <span className={cx(s.chev, expanded && s.chevOpen)} aria-hidden>
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
                  {p.offNadirDeg.toFixed(1)}° · {trackKm(p.groundDistanceKm)} km from track
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  )
})

/** Thumbnail URLs already shown this session: a remount (back from a pass) shows them at once, no fade (A2). */
const shownThumbs = new Set<string>()

/** Thumbnail of the real crop: eager for the first rows, else loads when scrolled near. */
function Thumb({ url, eager, clouded }: { url: string; eager: boolean; clouded: boolean }) {
  const ref = useRef<HTMLSpanElement>(null)
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
      {clouded ? <span className={s.cloudChip}>Cloud</span> : null}
      <span className={s.thumbExpand}>
        <Mark name="expand" size={10} />
      </span>
    </span>
  )
}

export type { ListItem }
