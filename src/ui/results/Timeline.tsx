/**
 * Timeline (04 / TIMELINE): seven days across, for THIS place.
 *
 *  - Day/night shading from the real sun elevation at the place, sampled every 10 minutes.
 *  - Day labels at local midnights in the place's time zone (DST-correct), 6-hourly ticks; one label
 *    format for every day, picked from the narrowest day.
 *  - Lanes by verdict, with a hierarchy (decision #7): photographs get 40 % of the height and read
 *    first (signal diamonds on stems for detailed captures, bone dots for daily mosaics); weather
 *    'likely' passes and the ~1,500 'could' passes are a quiet density strip, the noise floor.
 *  - A continuous band on top for the geostationary imagers (they never "pass": DESIGN §2).
 *  - Hover: mono tooltip (it also explains the mark forms). Click/tap: select.
 *
 * Static layers are one SVG of batched paths (1,900 marks in ~20 elements, no canvas: U-1); hover, selection and
 * the playhead are DOM.
 * The playhead moves every frame from the scene clock as a transform (R20): replay never re-renders
 * the strip.
 *
 * Words: the 'results' namespace (timeline) and the 'verdicts' vocabulary, read at render, and the day labels written
 * from each midnight's local fields (the model's day marks hold no words), so a language switch rewords the strip.
 * A day label shows only where it fits before the next: a Latin or Cyrillic one is counted in mono cells, any other
 * is measured as drawn (useLabelWidth).
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { fmt } from '../../../api/_lib/i18n/format'
import { LOCALE_INFO, type Locale } from '../../../api/_lib/i18n/locales'
import { Rich, withUnits } from '@/i18n/Rich'
import enResults from '@/i18n/en/results'
import enVerdicts from '@/i18n/en/verdicts'
import { useLocale, useMsgs } from '@/i18n/runtime'
import { sceneClock } from '@/state/sceneClock'
import { useAfterSceneFrame } from './capture'
import { useApp } from '@/state/store'
import type { Pass } from '@/types'
import { Glyph, cx, palette, useReducedMotion } from '@/ui/system'
import { Mark } from './Mark'
import { isDailyMosaic, isRadar } from './lib/captures'
import { glyphForPass, markColorVar, VERDICT_GLYPH, type Verdict } from './lib/meta'
import { daylight, hitTest, SUN_SAMPLE_MS, type DayMark } from './lib/timeline'
import { fmtDayCompact, fmtLocalDay, fmtLocalStamp, fmtLocalTime, localDateKey, localParts, zoneAbbr, zoneHasAbbr } from './lib/time'
import type { ResultsModel } from './model'
import s from './Timeline.module.css'

interface Props {
  model: ResultsModel
  selectedId?: string
  onSelect: (p: Pass) => void
  compact?: boolean
  /** The strip's notch index ("04"; "03" where the summary has no notch of its own) */
  index?: string
  className?: string
}

type Lane = Verdict | 'rest'

interface Layout {
  w: number
  h: number
  geoH: number
  lanes: Lane[]
  tops: number[]
  heights: number[]
  /** y centre of a verdict's lane */
  laneY: (v: Verdict) => number
  laneOf: (y: number) => Lane | undefined
}

/** Lane height shares: photographs read first (decision #7). */
const SHARES_FULL = [0.4, 0.2, 0.2, 0.2]
/** The geostationary lane's word (hidden on narrower screens, as the verdict lanes' words are) */
const LANE_WORD = { strong: s.laneWord }
const SHARES_COMPACT = [0.55, 0.45]

/**
 * The three label lanes' least height (`--lane-min` on the plot, Timeline.module.css): 0 in most scripts. Where a
 * script's marks rise and hang further (Devanagari's ँ over ु, Vietnamese's stacked Ể under a Q's tail), a short strip's
 * 20 % lanes (11.8 px at 1280 × 800) brought one label's ink to its neighbour's; those lanes take the room from the
 * photographs' lane, which never gets smaller than they are, nor than PHOTO_LANE_MIN: in a shorter strip (no desktop
 * has one: it keeps 132 px, results.module.css) they get what that leaves, never less than their share.
 */
/** The photographs' lane gives the label lanes room only down to this (its diamond is 10.8 px tall). */
const PHOTO_LANE_MIN = 17

function laneMinOf(el: HTMLElement | null): number {
  return el ? parseFloat(getComputedStyle(el).getPropertyValue('--lane-min')) || 0 : 0
}

export function layoutFor(w: number, h: number, compact: boolean, hasGeo: boolean, laneMin = 0): Layout {
  // Compact (phone body): photographs, then one density strip of everything else.
  const lanes: Lane[] = compact ? ['imaged', 'rest'] : ['imaged', 'likely', 'could', 'overhead']
  const shares = compact ? SHARES_COMPACT : SHARES_FULL
  const geoH = hasGeo ? (compact ? 6 : 10) : 0
  const plotH = h - geoH
  // The shares as they are unless a least height applies (then the label lanes take it, the photographs the rest).
  const room = Math.min(laneMin, plotH / 4, (plotH - PHOTO_LANE_MIN) / 3)
  const small = compact ? 0 : Math.max(plotH * SHARES_FULL[1], room)
  const shared = compact || small === plotH * SHARES_FULL[1]
  const tops: number[] = []
  const heights: number[] = []
  let y = geoH
  for (let i = 0; i < shares.length; i++) {
    const hh = shared ? plotH * shares[i] : i ? small : plotH - 3 * small
    tops.push(y)
    heights.push(hh)
    y += hh
  }
  const indexOf = (v: Verdict) => (compact ? (v === 'imaged' ? 0 : 1) : Math.max(0, lanes.indexOf(v)))
  return {
    w,
    h,
    geoH,
    lanes,
    tops,
    heights,
    laneY: (v) => {
      const i = indexOf(v)
      return tops[i] + heights[i] / 2
    },
    laneOf: (yy) => {
      for (let i = 0; i < lanes.length; i++) if (yy >= tops[i] && yy < tops[i] + heights[i]) return lanes[i]
      return undefined
    },
  }
}

/** Day label format for every day, from the narrowest day's width (no collisions, no mixed formats). */
function dayLabel(d: DayMark, tz: string, dayW: number): string {
  if (dayW >= 92) return fmtLocalDay(d.t, tz, d.p)
  if (dayW >= 48) return fmtDayCompact(d.t, tz, d.p)
  return String(d.day)
}

export function Timeline({ model, selectedId, onSelect, compact = false, index = '04', className }: Props) {
  const { report, tz, lanes, sun, days, hours, meta } = model
  const t0 = report.windowStart
  const t1 = report.windowEnd
  const span = t1 - t0
  const reduced = useReducedMotion()
  const m = useMsgs(enResults).timeline
  const vm = useMsgs(enVerdicts)
  const locale = useLocale()
  const int = fmt(locale).int
  const plotRef = useRef<HTMLDivElement>(null)
  const headRef = useRef<HTMLDivElement>(null)
  const axisRef = useRef<HTMLDivElement>(null)
  const labelWidth = useLabelWidth(axisRef, locale)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [hover, setHover] = useState<{ pass: Pass; x: number } | null>(null)
  const replaying = useApp((st) => st.timeMode !== 'live')
  const seeking = useApp((st) => st.timeMode === 'scrub')
  const hasGeo = report.geo.length > 0
  // The script follows the language: read the lanes' least height again when either changes.
  const laneMin = useMemo(() => (size.h ? laneMinOf(plotRef.current) : 0), [size.h, locale])
  const L = useMemo(
    () => layoutFor(size.w, size.h, compact, hasGeo, laneMin),
    [size.w, size.h, compact, hasGeo, laneMin],
  )
  const xOf = useCallback((t: number) => ((t - t0) / span) * size.w, [t0, span, size.w])
  const captureById = useMemo(() => new Map(report.captures.map((c) => [c.id, c])), [report.captures])

  // ── size: the first size (and paint) comes from the observer, no synchronous layout read ──
  useLayoutEffect(() => {
    const el = plotRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver((entries) => {
      const r = entries[entries.length - 1].contentRect
      setSize((sz) => (Math.abs(sz.w - r.width) < 0.5 && Math.abs(sz.h - r.height) < 0.5 ? sz : { w: r.width, h: r.height }))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // ── static layer: one SVG of batched paths (U-1) ───────────────────────────────
  // Not a canvas: a 2D canvas allocates its backing store on its first draw, and on a phone that waits on the GPU
  // process (busy drawing the globe): 30–200 ms of main thread at 4× CPU when the results land. ~20 path elements,
  // rasterized off the main thread, with the same geometry, colours and device-pixel snapping as the canvas had.
  // The verdicts' names come from the one vocabulary ('verdicts'), never from words of the timeline's own.
  const summary = m.summary(
    Math.round(span / 86_400_000),
    { imaged: lanes.imaged.passes.length, likely: lanes.likely.passes.length, could: lanes.could.passes.length, overhead: lanes.overhead.passes.length },
    { imaged: vm.imaged.title, likely: vm.likely.title, could: vm.could.title, overhead: vm.overhead.title },
  )
  const staticLayer = useMemo(() => {
    if (!L.w || !L.h) return null
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const px = 1 / dpr
    const X = (t: number) => ((t - t0) / span) * L.w
    const snap = (x: number) => Math.round(x * dpr) / dpr + px / 2
    const f = (n: number) => +n.toFixed(2)
    const paths: { key: string; d: string; fill?: string; stroke?: string; width?: number; crisp?: boolean }[] = []
    const fills = new Map<string, string[]>()
    const addFill = (color: string, d: string) => {
      const a = fills.get(color)
      if (a) a.push(d)
      else fills.set(color, [d])
    }

    // Day / night: the real sun at this place (alpha quantized to 1/400, merged into one path per level).
    const base = compact ? 0.055 : 0.07
    let runA = -1
    let runFrom = 0
    let runTo = 0
    const flush = () => {
      if (runA > 0) addFill(`rgba(236,232,224,${(runA / 400).toFixed(4)})`, `M${f(runFrom)} 0H${f(runTo + 0.5)}V${f(L.h)}H${f(runFrom)}Z`)
    }
    for (let i = 0; i < sun.length - 1; i++) {
      const a = X(t0 + i * SUN_SAMPLE_MS)
      const b = X(Math.min(t1, t0 + (i + 1) * SUN_SAMPLE_MS))
      const d = daylight((sun[i] + sun[i + 1]) / 2)
      const q = d <= 0.001 ? 0 : Math.max(1, Math.round(base * d * 400))
      if (q === runA && Math.abs(a - runTo) < 0.01) {
        runTo = b
        continue
      }
      flush()
      runA = q
      runFrom = a
      runTo = b
    }
    flush()

    // Local midnights and 6-hourly ticks.
    paths.push({ key: 'mid', d: days.map((d) => `M${f(snap(X(d.t)))} 0V${f(L.h)}`).join(''), stroke: 'rgba(236,232,224,0.16)', width: px, crisp: true })
    paths.push({
      key: 'ticks',
      d: hours.map((hm) => `M${f(snap(X(hm.t)))} ${f(L.h)}V${f(L.h - (hm.hour === 12 ? 5 : 3))}`).join(''),
      stroke: 'rgba(236,232,224,0.14)',
      width: px,
      crisp: true,
    })
    // Lane separators.
    let sep = ''
    for (let i = 1; i < L.lanes.length; i++) sep += `M0 ${f(Math.round(L.tops[i] * dpr) / dpr + px / 2)}H${f(L.w)}`
    paths.push({ key: 'sep', d: sep, stroke: 'rgba(236,232,224,0.05)', width: px, crisp: true })
    // Geostationary: continuous presence, one hairline per watcher.
    if (L.geoH) {
      const n = Math.min(3, report.geo.length)
      for (let g = 0; g < n; g++) {
        const y = Math.round((((g + 1) * L.geoH) / (n + 1)) * dpr) / dpr + px / 2
        paths.push({ key: `geo${g}`, d: `M0 ${f(y)}H${f(L.w)}`, stroke: `rgba(236,232,224,${g === 0 ? 0.42 : 0.2})`, width: px, crisp: true })
      }
    }

    // ── the noise floor: density strips (decision #7) ──
    // One device-pixel column per bin; a 1 × 5 px bone rect whose alpha grows with the count (runs of equal columns merged).
    const cols = Math.ceil(L.w * dpr)
    const strip = (passes: Pass[], y: number) => {
      const n = new Uint16Array(cols)
      const radar = new Uint16Array(cols)
      for (const p of passes) {
        const c = Math.min(cols - 1, Math.max(0, Math.floor(X(p.tClosest) * dpr)))
        n[c]++
        if (meta(p.norad).category === 'radar') radar[c]++
      }
      const top = f(Math.round((y - 2.5) * dpr) / dpr)
      const colorOf = (c: number) => {
        if (!n[c]) return ''
        const a = Math.min(0.3, 0.05 + 0.04 * n[c])
        return radar[c] * 2 >= n[c] ? `rgba(169,199,211,${Math.min(0.35, a + 0.05).toFixed(3)})` : `rgba(236,232,224,${a.toFixed(3)})`
      }
      for (let c = 0; c < cols; ) {
        const color = colorOf(c)
        let e = c + 1
        while (e < cols && colorOf(e) === color) e++
        if (color) addFill(color, `M${f(c / dpr)} ${top}h${f((e - c) / dpr)}v5h${f(-(e - c) / dpr)}Z`)
        c = e
      }
    }
    const isNoise = (p: Pass) => p.verdict === 'could' || (p.verdict === 'likely' && meta(p.norad).category === 'weather-leo')
    if (compact) strip([...lanes.likely.passes, ...lanes.could.passes, ...lanes.overhead.passes], L.laneY('likely'))
    else {
      strip(lanes.likely.passes.filter(isNoise), L.laneY('likely'))
      strip(lanes.could.passes, L.laneY('could'))
    }

    // ── signal-bearing marks: likely open-optical diamonds, crewed crosses ──
    if (!compact) {
      const g = 2.7
      const marks = { bone: '', ice: '' }
      for (const v of ['likely', 'overhead'] as const) {
        const y = L.laneY(v)
        for (const p of lanes[v].passes) {
          if (isNoise(p)) continue
          const x = X(p.tClosest)
          const cat = meta(p.norad).category
          const k = cat === 'radar' ? 'ice' : 'bone'
          switch (glyphForPass(p.verdict, cat)) {
            case 'likely':
              marks[k] += `M${f(x)} ${f(y - g - 0.6)}L${f(x + g + 0.6)} ${f(y)}L${f(x)} ${f(y + g + 0.6)}L${f(x - g - 0.6)} ${f(y)}Z`
              break
            case 'crewed':
              marks[k] += `M${f(x)} ${f(y - g - 0.5)}V${f(y + g + 0.5)}M${f(x - g - 0.5)} ${f(y)}H${f(x + g + 0.5)}`
              break
            case 'weather-leo':
              marks[k] += `M${f(x - g)} ${f(y)}a${g} ${g} 0 1 0 ${2 * g} 0a${g} ${g} 0 1 0 ${-2 * g} 0`
              break
            default:
              marks[k] += `M${f(x - g + 0.5)} ${f(y - g + 0.5)}h${f(2 * g - 1)}v${f(2 * g - 1)}h${f(-(2 * g - 1))}Z`
          }
        }
      }
      paths.push({ key: 'bone', d: marks.bone, stroke: 'rgba(236,232,224,0.62)', width: 1 })
      paths.push({ key: 'ice', d: marks.ice, stroke: 'rgba(169,199,211,0.75)', width: 1 })
    }

    // ── photographs: detailed captures are signal diamonds standing on stems (they read first);
    // daily mosaics are small bone dots (real, but not a picture of YOU) ──
    const iy = L.laneY('imaged')
    let dots = ''
    let stems = ''
    let diamonds = ''
    const dr = compact ? 2.2 : 2.6
    const r = compact ? 4.4 : 5.4
    for (const p of lanes.imaged.passes) {
      const c = p.captureId ? captureById.get(p.captureId) : undefined
      const x = X(p.tClosest)
      if (c && isDailyMosaic(c)) dots += `M${f(x - dr)} ${f(iy)}a${dr} ${dr} 0 1 0 ${2 * dr} 0a${dr} ${dr} 0 1 0 ${-2 * dr} 0`
      else {
        stems += `M${f(snap(x))} ${f(iy + r)}V${f(L.h)}`
        diamonds += `M${f(x)} ${f(iy - r)}L${f(x + r)} ${f(iy)}L${f(x)} ${f(iy + r)}L${f(x - r)} ${f(iy)}Z`
      }
    }
    const fillPaths = [...fills].map(([color, ds], i) => ({ key: `f${i}`, d: ds.join(''), fill: color, crisp: true }))
    const all = [
      ...fillPaths.filter((x) => x.d.includes('V')), // day / night first (under everything)
      ...paths.filter((x) => ['mid', 'ticks', 'sep'].includes(x.key) || x.key.startsWith('geo')),
      ...fillPaths.filter((x) => !x.d.includes('V')), // density strips
      ...paths.filter((x) => x.key === 'bone' || x.key === 'ice'),
      { key: 'dots', d: dots, fill: 'rgba(236,232,224,0.7)' },
      { key: 'stems', d: stems, stroke: 'rgba(255,106,26,0.55)', width: px, crisp: true },
      { key: 'diamonds', d: diamonds, fill: palette.signal },
    ].filter((x) => x.d)
    return (
      <svg className={s.canvas} width={L.w} height={L.h} viewBox={`0 0 ${f(L.w)} ${f(L.h)}`} role="img" aria-label={summary}>
        {all.map((x) => (
          <path
            key={x.key}
            d={x.d}
            fill={'fill' in x && x.fill ? x.fill : 'none'}
            stroke={'stroke' in x && x.stroke ? x.stroke : undefined}
            strokeWidth={'width' in x ? x.width : undefined}
            shapeRendering={'crisp' in x && x.crisp ? 'crispEdges' : undefined}
          />
        ))}
      </svg>
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [L, sun, days, hours, lanes, report.geo.length, t0, t1, span, meta, compact, captureById, summary])

  // ── playhead: every frame, as a transform (R20) ─────────────────────────────────
  const lastX = useRef(-1)
  useAfterSceneFrame(() => {
    const el = headRef.current
    if (!el || !size.w) return
    const st = useApp.getState()
    const t = sceneClock.mode === st.timeMode ? sceneClock.simTime : st.simTime
    const inside = t >= t0 && t <= t1
    const x = Math.round(((t - t0) / span) * size.w * 2) / 2
    if (x === lastX.current && el.dataset.on === String(inside)) return
    lastX.current = x
    el.dataset.on = String(inside)
    el.style.transform = `translateX(${x}px)`
  }, replaying)

  // ── pointer ──────────────────────────────────────────────────────────────────────
  const pick = (clientX: number, clientY: number, tolPx: number): { pass: Pass; x: number } | null => {
    const el = plotRef.current
    if (!el || !size.w) return null
    const r = el.getBoundingClientRect()
    const x = clientX - r.left
    const y = clientY - r.top
    const t = t0 + (x / size.w) * span
    const tol = (tolPx / size.w) * span
    const lane = L.laneOf(y)
    // The compact 'rest' strip mixes verdicts: let the lane order decide.
    const p = hitTest(lanes, t, tol, lane && lane !== 'rest' ? lane : undefined)
    return p ? { pass: p, x: xOf(p.tClosest) } : null
  }
  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    const h = pick(e.clientX, e.clientY, 7)
    setHover((prev) => (prev?.pass.id === h?.pass.id ? prev : h))
    const st = useApp.getState()
    if (st.hoveredNorad !== h?.pass.norad) st.setHoveredNorad(h?.pass.norad)
  }
  const onLeave = () => {
    setHover(null)
    useApp.getState().setHoveredNorad(undefined)
  }
  const onClick = (e: React.MouseEvent) => {
    const h = pick(e.clientX, e.clientY, compact ? 14 : 8)
    if (h) onSelect(h.pass)
  }

  // ── overlay positions ────────────────────────────────────────────────────────────
  const selected = selectedId ? model.passById.get(selectedId) : undefined
  const nowish = Math.abs(Date.now() - t1) < 3_600_000
  const zoneA = zoneAbbr(t0, tz)
  const zoneB = zoneAbbr(t1, tz)
  const zones = zoneA === zoneB ? zoneA : m.zoneChange(zoneA, zoneB)
  const geoNames = report.geo.slice(0, 3).map((g) => g.name)
  const daysN = Math.round(span / 86_400_000)
  // A zone named by its offset ("UTC+7", "UTC−9 · at sea") is named once: its abbreviation would say it again.
  const metaText = zoneHasAbbr(t0, tz) ? m.meta(daysN, model.tzLabel, zones) : m.meta(daysN, model.tzLabel)

  const laneCount = (v: Verdict) => lanes[v].passes.length
  const dayW = (86_400_000 / span) * size.w
  // The window's first (partial) day gets a label at the left edge too, when it fits.
  const startParts = localParts(t0, tz)
  const startDay: DayMark = { t: t0, day: startParts.day, p: startParts }
  const axisDays = days.length && ((days[0].t - t0) / span) * size.w < 40 ? days : [startDay, ...days]
  // An older window (a shared pass) ends on a date, not a clock time (unless the last day label
  // already shows that date: then the time it ends).
  const lastDay = days.length ? days[days.length - 1] : undefined
  const endLabel = nowish
    ? m.now
    : compact
      ? ''
      : lastDay && localDateKey(lastDay.t, tz) === localDateKey(t1, tz)
        ? `${fmtLocalTime(t1, tz)} ${zoneAbbr(t1, tz)}`
        : fmtLocalDay(t1, tz)
  const charW = compact ? 6.2 : 6.6
  const widthOf = (text: string) => labelWidth?.(text) ?? text.length * charW
  const endRoom = endLabel ? widthOf(endLabel) + 14 : 0

  return (
    <div className={cx(s.timeline, compact && s.compact, className)} role="group" aria-label={m.keysHint(summary)}>
      {!compact ? (
        <div className={s.head}>
          <span className={s.title}>
            <span className={s.idx}>{index}</span>
            <span className={s.sep}>/</span>
            {m.title}
            <span className={s.meta}>{metaText}</span>
          </span>
          <span className={s.legend} aria-hidden>
            <span className={s.dayKey}>
              <i /> {m.daylight}
            </span>
          </span>
        </div>
      ) : null}

      <div className={s.body}>
        {!compact ? (
          <div className={s.lanes} aria-hidden>
            {/* U-2: the labels are placed from the plot's measured height, so they appear once it is known (never
                first at 0 and then jumping to their lanes). The column keeps its width meanwhile. */}
            {size.h && L.geoH ? (
              <span className={s.laneLabel} style={{ top: 0, height: L.geoH }} title={m.geoNames(geoNames)}>
                <span className={s.geoLabel}>
                  <Glyph name="weather-geo" size={9} /> <Rich parts={m.geoLane(report.geo.length)} classes={LANE_WORD} strongAs="span" />
                </span>
              </span>
            ) : null}
            {/* Hidden copies of the four labels, in the flow: the column takes the widest one's room ("VERMUTLICH 210",
                "POSSIBILE 1.565" squeezed their glyph to a dot in English's 124 px), and keeps at least that. */}
            <span className={s.laneSizer}>
              {(['imaged', 'likely', 'could', 'overhead'] as const).map((v) => (
                <span key={v} className={s.laneLabel}>
                  <Glyph name={VERDICT_GLYPH[v]} size={10} />
                  <span className={s.laneWord}>{vm[v].short}</span>
                  <span className={s.laneCount}>{int(laneCount(v))}</span>
                </span>
              ))}
            </span>
            {(size.h ? (['imaged', 'likely', 'could', 'overhead'] as const) : []).map((v) => (
              <span
                key={v}
                className={cx(s.laneLabel, laneCount(v) === 0 && s.laneEmpty, v === 'imaged' && s.laneLead)}
                style={{ top: L.laneY(v) - 8, height: 16 }}
                title={vm[v].definition}
              >
                <Glyph name={VERDICT_GLYPH[v]} size={10} color={v === 'imaged' ? 'var(--signal)' : undefined} />
                <span className={s.laneWord}>{vm[v].short}</span>
                <span className={s.laneCount}>{int(laneCount(v))}</span>
              </span>
            ))}
          </div>
        ) : null}

        <div className={s.plotWrap}>
          <div ref={plotRef} className={s.plot} onPointerMove={onMove} onPointerLeave={onLeave} onClick={onClick}>
            {staticLayer}

            {selected ? (
              <div
                className={cx(s.selLine, (seeking || reduced) && s.noAnim)}
                style={{ transform: `translateX(${xOf(selected.tClosest).toFixed(1)}px)` }}
                aria-hidden
              >
                <span className={s.selGlyph} style={{ top: L.laneY(selected.verdict) }}>
                  <Mark name={glyphForPass(selected.verdict, meta(selected.norad).category)} size={compact ? 10 : 12} color="var(--signal)" />
                </span>
              </div>
            ) : null}

            {hover && hover.pass.id !== selectedId ? (
              <div className={s.hoverLine} style={{ transform: `translateX(${hover.x.toFixed(1)}px)` }} aria-hidden>
                <span className={s.hoverGlyph} style={{ top: L.laneY(hover.pass.verdict) }}>
                  <Mark
                    name={glyphForPass(hover.pass.verdict, meta(hover.pass.norad).category)}
                    size={12}
                    color={markColorVar(hover.pass.verdict, meta(hover.pass.norad).category)}
                  />
                </span>
              </div>
            ) : null}

            {replaying ? (
              <div ref={headRef} className={s.playhead} aria-hidden>
                <span className={s.playheadCap} />
              </div>
            ) : null}
          </div>

          {/* Day labels at local midnights: one format for every day */}
          <div ref={axisRef} className={s.axis} aria-hidden>
            {axisDays.map((d, i) => {
              const next = axisDays[i + 1]?.t ?? t1
              const x = ((d.t - t0) / span) * size.w
              const limit = Math.min(((next - t0) / span) * size.w, size.w - endRoom)
              const text = dayLabel(d, tz, dayW)
              const fits = x + widthOf(text) + 8 <= limit
              return (
                <span key={d.t} className={cx(s.day, d.t === t0 && s.dayStart)} style={{ left: `${(((d.t - t0) / span) * 100).toFixed(3)}%` }}>
                  {fits ? text : ''}
                </span>
              )
            })}
            {endLabel ? <span className={s.end}>{endLabel}</span> : null}
          </div>

          {hover ? <Tooltip pass={hover.pass} x={hover.x} w={size.w} model={model} /> : null}
        </div>
      </div>
    </div>
  )
}

/**
 * The width of an axis label as the page draws it, for a script whose letters are not one mono cell each: Devanagari's
 * vowel signs and virama join their consonant (counted as characters, a Hindi day that fits was blanked), CJK's are
 * two cells wide, Arabic's join. null for Latin and Cyrillic, whose mono faces are fixed-width: the cell count is exact
 * enough there, and English is unchanged. Measured again when a web font finishes loading.
 */
function useLabelWidth(ref: RefObject<HTMLDivElement | null>, locale: Locale): ((text: string) => number) | null {
  const script = LOCALE_INFO[locale].script
  const on = script !== 'latin' && script !== 'cyrillic'
  const [fontsLoaded, setFontsLoaded] = useState(0)
  const [measure, setMeasure] = useState<((text: string) => number) | null>(null)
  useEffect(() => {
    const fonts = typeof document !== 'undefined' ? document.fonts : undefined
    if (!on || !fonts) return
    const bump = () => setFontsLoaded((n) => n + 1)
    fonts.addEventListener('loadingdone', bump)
    return () => fonts.removeEventListener('loadingdone', bump)
  }, [on])
  useLayoutEffect(() => {
    const el = ref.current
    const ctx = on && el ? document.createElement('canvas').getContext('2d') : null
    if (!el || !ctx) {
      setMeasure(null)
      return
    }
    const cs = getComputedStyle(el)
    ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
    if (cs.fontStretch === '87.5%') ctx.fontStretch = 'semi-condensed'
    const track = parseFloat(cs.letterSpacing) || 0
    const seg = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter(locale, { granularity: 'grapheme' }) : null
    const cache = new Map<string, number>()
    setMeasure(() => (text: string) => {
      let w = cache.get(text)
      if (w === undefined) {
        const shown = text.toLocaleUpperCase(locale)
        const clusters = seg ? [...seg.segment(shown)].length : Array.from(shown).length
        w = ctx.measureText(shown).width + track * clusters
        cache.set(text, w)
      }
      return w
    })
  }, [ref, on, locale, fontsLoaded])
  return measure
}

/** What the mark form means, in words (the legend lives here now), in the active language. */
function markWords(pass: Pass, model: ResultsModel, m: TimelineMessages, title: string): string {
  const meta = model.meta(pass.norad)
  const capture = pass.captureId ? model.report.captures.find((c) => c.id === pass.captureId) : undefined
  if (pass.verdict === 'imaged')
    return capture && isDailyMosaic(capture) ? m.markMosaic(Math.round(capture.gsdM)) : capture && isRadar(capture) ? m.markRadar(Math.round(capture.gsdM)) : m.markImaged(title)
  return m.markKind(title, meta.category)
}

type TimelineMessages = (typeof enResults)['timeline']

function Tooltip({ pass, x, w, model }: { pass: Pass; x: number; w: number; model: ResultsModel }) {
  const meta = model.meta(pass.norad)
  const m = useMsgs(enResults).timeline
  const title = useMsgs(enVerdicts)[pass.verdict].title
  // Keep the box inside the strip: anchor left/right near the edges.
  const anchor = x < 140 ? 'left' : x > w - 140 ? 'right' : 'center'
  return (
    <div className={cx(s.tip, s[`tip_${anchor}`])} style={{ left: x }} role="tooltip">
      <div className={s.tipName}>
        <Mark name={glyphForPass(pass.verdict, meta.category)} size={11} color={markColorVar(pass.verdict, meta.category)} />
        {meta.name}
      </div>
      <div className={s.tipLine}>{fmtLocalStamp(pass.tClosest, model.tz, true)}</div>
      <div className={s.tipLine}>{withUnits(m.geometry(pass.offNadirDeg, pass.groundDistanceKm))}</div>
      <div className={cx(s.tipLine, pass.verdict === 'imaged' && markColorVar(pass.verdict, meta.category) === 'var(--signal)' && s.signal)}>
        {withUnits(markWords(pass, model, m, title))}
      </div>
    </div>
  )
}
