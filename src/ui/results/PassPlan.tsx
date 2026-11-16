/**
 * Plan view of a pass that has no image: the place at the centre, the real ground track, the band the
 * instrument could see (swath, or field of regard for agile imagers, split by a radar's blind strip under its
 * track), the closest-approach line, and the
 * satellite riding the track in sync with replay time. North up, local equirectangular projection.
 * Doubles as the left half of the share card for passes without a picture.
 */
import { useId, useMemo, useRef } from 'react'
import { sceneClock } from '@/state/sceneClock'
import { useAfterSceneFrame } from './capture'
import { useApp } from '@/state/store'
import type { Pass } from '@/types'
import { cx } from '@/ui/system'
import { scaleBarKm } from './lib/captures'
import { fieldAngles, int, trackKm } from './lib/copy'
import type { SatMeta } from './lib/meta'
import { planGeometry, satPosition, type Pt } from './lib/plan'
import s from './PassPlan.module.css'

interface Props {
  pass: Pass
  meta: SatMeta
  lat: number
  lon: number
  /** follow store.simTime with a moving satellite (detail view) */
  live?: boolean
  className?: string
  labels?: boolean
}

export function PassPlan({ pass: p, meta, lat, lon, live = true, className, labels = true }: Props) {
  const clipId = `plan-clip-${useId().replace(/:/g, '')}`
  const g = useMemo(() => planGeometry(p, meta, lat, lon), [p, meta, lat, lon])
  const R = g.extent
  const tick = R * 0.03
  // The satellite rides the track every frame from the scene clock, via attributes (R20): React never
  // re-renders this for time.
  const satRef = useRef<SVGRectElement>(null)
  const lastT = useRef(Number.NaN)
  useAfterSceneFrame(() => {
    const st = useApp.getState()
    const t = st.timeMode === 'live' ? undefined : sceneClock.mode === st.timeMode ? sceneClock.simTime : st.simTime
    if (t === lastT.current || (t === undefined && Number.isNaN(lastT.current))) return
    lastT.current = t ?? Number.NaN
    const q = t !== undefined ? satPosition(p, g, t) : g.sub
    const el = satRef.current
    if (!el) return
    el.setAttribute('x', (q.x - tick).toFixed(2))
    el.setAttribute('y', (q.y - tick).toFixed(2))
    el.setAttribute('transform', `rotate(45 ${q.x.toFixed(2)} ${q.y.toFixed(2)})`)
  }, live)
  const sat = g.sub
  const chev = 0.045 * R
  const bar = scaleBarKm(2 * R)
  const pts = (a: Pt[]) => a.map((q) => `${q.x.toFixed(2)},${q.y.toFixed(2)}`).join(' ')
  const prof = meta.profile

  return (
    <div className={cx(s.plan, className)}>
      <svg
        viewBox={`${-R} ${-R} ${2 * R} ${2 * R}`}
        className={s.svg}
        role="img"
        aria-label={`Plan view: ${meta.name} ground track, ${trackKm(p.groundDistanceKm)} km from the place at closest approach.`}
      >
        <defs>
          <clipPath id={clipId}>
            <rect x={-R} y={-R} width={2 * R} height={2 * R} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          {[-0.5, 0, 0.5].map((f) => (
            <g key={f} className={s.grid}>
              <line x1={-R} x2={R} y1={f * R} y2={f * R} />
              <line y1={-R} y2={R} x1={f * R} x2={f * R} />
            </g>
          ))}
          {g.band ? (
            <>
              <polygon points={pts(g.band)} className={s.band} />
              <line x1={g.band[0].x} y1={g.band[0].y} x2={g.band[1].x} y2={g.band[1].y} className={s.bandEdge} />
              <line x1={g.band[3].x} y1={g.band[3].y} x2={g.band[2].x} y2={g.band[2].y} className={s.bandEdge} />
            </>
          ) : null}
          {g.blind ? (
            <>
              <polygon points={pts(g.blind)} className={s.blind} />
              <line x1={g.blind[0].x} y1={g.blind[0].y} x2={g.blind[1].x} y2={g.blind[1].y} className={s.bandEdge} />
              <line x1={g.blind[3].x} y1={g.blind[3].y} x2={g.blind[2].x} y2={g.blind[2].y} className={s.bandEdge} />
            </>
          ) : null}
          <polyline points={pts(g.track)} className={s.track} />
          <polyline
            points={pts([
              { x: g.sub.x - g.dir.x * chev + g.n.x * chev, y: g.sub.y - g.dir.y * chev + g.n.y * chev },
              g.sub,
              { x: g.sub.x - g.dir.x * chev - g.n.x * chev, y: g.sub.y - g.dir.y * chev - g.n.y * chev },
            ])}
            className={s.track}
          />
          {p.groundDistanceKm > R * 0.04 ? <line x1={0} y1={0} x2={g.sub.x} y2={g.sub.y} className={s.closest} /> : null}
          <g className={s.place}>
            <circle r={R * 0.045} />
            <line x1={0} x2={0} y1={-R * 0.1} y2={-R * 0.06} />
            <line x1={0} x2={0} y1={R * 0.06} y2={R * 0.1} />
            <line y1={0} y2={0} x1={-R * 0.1} x2={-R * 0.06} />
            <line y1={0} y2={0} x1={R * 0.06} x2={R * 0.1} />
          </g>
          <circle r={R * 0.008} className={s.placeDot} />
          <rect ref={satRef} x={sat.x - tick} y={sat.y - tick} width={tick * 2} height={tick * 2} className={s.sat} transform={`rotate(45 ${sat.x} ${sat.y})`} />
        </g>
      </svg>
      {labels ? (
        <>
          <span className={cx(s.label, s.tl)}>Plan · north up</span>
          <span className={cx(s.label, s.tr)}>
            {g.half ? (prof?.maxOffNadirDeg ? `Field of regard ${fieldAngles(prof)}` : `Swath ${int(prof?.swathKm ?? 0)} km`) : 'Ground track'}
          </span>
          <span className={s.scale} style={{ width: `${(bar / (2 * R)) * 100}%` }}>
            <span className={s.bar} />
            <span className={s.scaleText}>{bar >= 1 ? int(bar) : bar} km</span>
          </span>
          <span className={cx(s.label, s.br)}>Closest {trackKm(p.groundDistanceKm)} km</span>
        </>
      ) : null}
    </div>
  )
}
