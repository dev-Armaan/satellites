/**
 * Hand-rolled SVG charts for the admin page, drawn in the Instrument style (docs/DESIGN.md): hairlines,
 * bone marks, mono labels, signal used only for shares and the places people looked at.
 */
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import type { Ranked } from './api'
import { etParts, fmtBucket, fmtInt, fmtPct, niceMax } from './format'
import { dotLevel, dotRadius, GRID_STEP, legendCounts, placeGrid } from './placeGrid'

function useWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = useRef<T>(null)
  const [w, setW] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setW(el.clientWidth)
    const ro = new ResizeObserver(() => setW(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, w]
}

// ── Activity: searches (bars), shares (signal, inside the bars), sessions (step line) ─────────

export function ActivityChart({ series, bucket }: { series: [number, number, number, number][]; bucket: 'hour' | 'day' }) {
  const [ref, w] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const H = 188
  const top = 22
  const bottom = 22
  const right = 34
  const plotW = Math.max(0, w - right)
  const plotH = H - top - bottom
  const n = series.length
  const max = niceMax(Math.max(1, ...series.map((s) => Math.max(s[1], s[2], s[3]))))
  const bw = n ? plotW / n : 0
  const gap = bw > 6 ? 1.5 : bw > 3 ? 1 : 0
  const y = (v: number) => top + plotH - (v / max) * plotH
  const ticks = n ? tickIndexes(series.map((s) => s[0]), bucket, Math.max(2, Math.floor(plotW / 92))) : []
  const sel = hover ?? n - 1
  const cur = series[sel]
  let line = ''
  series.forEach((s, i) => {
    const x0 = i * bw
    line += `${i ? 'L' : 'M'}${x0.toFixed(1)},${y(s[3]).toFixed(1)}H${(x0 + bw).toFixed(1)}`
  })

  return (
    <div ref={ref} className="a-chart">
      <div className="a-chart-readout" aria-live="polite">
        {cur ? (
          <>
            <span className="a-dim">{fmtBucket(cur[0], bucket)}</span>
            <span>
              <b>{fmtInt(cur[1])}</b> {cur[1] === 1 ? 'SEARCH' : 'SEARCHES'}
            </span>
            <span className="a-signal-text">
              <b>{fmtInt(cur[2])}</b> {cur[2] === 1 ? 'SHARE' : 'SHARES'}
            </span>
            <span className="a-dim">
              <b>{fmtInt(cur[3])}</b> {cur[3] === 1 ? 'SESSION' : 'SESSIONS'}
            </span>
          </>
        ) : (
          <span className="a-dim">—</span>
        )}
      </div>
      {w > 0 && (
        <svg
          width={w}
          height={H}
          role="img"
          aria-label="Searches, shares and sessions over time"
          onPointerMove={(e) => {
            const x = e.clientX - e.currentTarget.getBoundingClientRect().left
            setHover(x >= 0 && x < plotW && bw ? Math.min(n - 1, Math.floor(x / bw)) : null)
          }}
          onPointerLeave={() => setHover(null)}
        >
          {[0, 0.5, 1].map((f) => (
            <g key={f}>
              <line x1={0} x2={plotW} y1={y(max * f)} y2={y(max * f)} className="a-grid" />
              <text x={plotW + 6} y={y(max * f) + 3} className="a-axis">
                {fmtInt(max * f)}
              </text>
            </g>
          ))}
          {series.map((s, i) => {
            const x = i * bw + gap / 2
            const bwi = Math.max(0.6, bw - gap)
            return (
              <g key={s[0]}>
                {s[1] > 0 && <rect x={x} y={y(s[1])} width={bwi} height={y(0) - y(s[1])} className={i === sel ? 'a-bar a-bar-on' : 'a-bar'} />}
                {s[2] > 0 && <rect x={x} y={y(s[2])} width={bwi} height={y(0) - y(s[2])} className="a-bar-signal" />}
              </g>
            )
          })}
          <path d={line} className="a-line" />
          {cur && <line x1={sel * bw + bw / 2} x2={sel * bw + bw / 2} y1={top - 6} y2={y(0)} className="a-cursor" />}
          {ticks.map((i) => (
            <g key={i}>
              <line x1={i * bw} x2={i * bw} y1={y(0)} y2={y(0) + 4} className="a-tick" />
              <text x={i * bw} y={H - 6} className="a-axis">
                {fmtBucket(series[i][0], bucket, true)}
              </text>
            </g>
          ))}
        </svg>
      )}
    </div>
  )
}

function tickIndexes(ts: number[], bucket: 'hour' | 'day', want: number): number[] {
  const out: number[] = []
  if (bucket === 'hour') {
    const span = ts.length
    const every = [3, 6, 12, 24, 48, 72].find((h) => span / h <= want) ?? 72
    let midnights = 0
    ts.forEach((t, i) => {
      const h = etParts(t).h
      if (every < 24 ? h % every === 0 : h === 0 && midnights++ % (every / 24) === 0) out.push(i)
    })
  } else {
    const every = Math.max(1, Math.ceil(ts.length / want))
    ts.forEach((_, i) => (ts.length - 1 - i) % every === 0 && out.push(i))
  }
  return out.filter((i) => i > 0 || out.length < 2)
}

// ── Ranked list ─────────────────────────────────────────────────────────────────────────────

/** `total`: the whole dimension (the RPC's dimTotals), so a share is of everything, not of the top 15. */
export function RankList({ rows, total, max = 8, label, empty = 'Nothing yet', accent = false }: { rows: Ranked | undefined; total?: number; max?: number; label?: (v: string) => ReactNode; empty?: string; accent?: boolean }) {
  const list = (rows ?? []).filter(([v]) => v !== '').slice(0, max)
  if (!list.length) return <p className="a-empty">{empty}</p>
  total = Math.max(total ?? 0, (rows ?? []).reduce((a, r) => a + r[1], 0))
  const top = list[0][1]
  return (
    <ol className="a-rank">
      {list.map(([v, n], i) => (
        <li key={v}>
          <span className="a-rank-i">{String(i + 1).padStart(2, '0')}</span>
          <span className="a-rank-label">{label ? label(v) : v}</span>
          <span className="a-rank-n">{fmtInt(n)}</span>
          <span className="a-rank-pct">{fmtPct(n / total)}</span>
          <span className="a-rank-bar" aria-hidden>
            <span className={accent && i === 0 ? 'a-signal-bg' : undefined} style={{ width: `${(n / top) * 100}%` }} />
          </span>
        </li>
      ))}
    </ol>
  )
}

// ── Funnel ──────────────────────────────────────────────────────────────────────────────────

export function Funnel({ stages }: { stages: { key: string; label: string; n: number }[] }) {
  const first = stages[0]?.n || 0
  return (
    <ol className="a-funnel">
      {stages.map((s, i) => {
        const prev = i ? stages[i - 1].n : s.n
        return (
          <li key={s.key}>
            <span className="a-funnel-label">{s.label}</span>
            <span className="a-funnel-track" aria-hidden>
              <span className={i === stages.length - 1 ? 'a-signal-bg' : undefined} style={{ width: first ? `${Math.max(0.4, (s.n / first) * 100)}%` : '0%' }} />
            </span>
            <span className="a-funnel-n">{fmtInt(s.n)}</span>
            <span className="a-funnel-pct">{i ? fmtPct(prev ? s.n / prev : 0) : '—'}</span>
          </li>
        )
      })}
    </ol>
  )
}

// ── World map: searched cells on a 2.5° grid, no base map (placeGrid.ts) ────────────────────────

const fmtKey = (n: number) => (n >= 1000 && n % 1000 === 0 ? `${n / 1000}K` : fmtInt(n))

export function WorldMap({ cells }: { cells: Ranked | undefined }) {
  const [ref, w] = useWidth<HTMLDivElement>()
  const g = placeGrid(cells)
  const px = w / 360 // the legend's dots are drawn at the map's own scale
  const keyBox = Math.max(2, Math.ceil(GRID_STEP * px))
  return (
    <div className="a-map" ref={ref}>
      <svg viewBox={`0 ${g.top} 360 ${g.bottom - g.top}`} role="img" aria-label={`Map of ${g.cells} searched cells`}>
        {g.dots.map((d) => (
          <circle key={`${d.x},${d.y}`} cx={d.x} cy={d.y} r={dotRadius(d.n, g.max)} fillOpacity={0.55 + 0.45 * dotLevel(d.n, g.max)} className="a-map-dot">
            <title>{`${fmtInt(d.n)} searches`}</title>
          </circle>
        ))}
      </svg>
      <div className="a-map-legend">
        <span>
          {fmtInt(g.dots.length)} DOTS · {GRID_STEP}° GRID · {fmtInt(g.cells)} CELLS
        </span>
        {g.dots.length > 0 && w > 0 && (
          <span className="a-map-key" aria-label="Dot size by searches, log scale">
            <span>SEARCHES</span>
            {legendCounts(g.max).map((n) => (
              <span key={n} className="a-map-key-i">
                <svg width={keyBox} height={keyBox} viewBox={`0 0 ${GRID_STEP} ${GRID_STEP}`} aria-hidden="true">
                  <circle cx={GRID_STEP / 2} cy={GRID_STEP / 2} r={dotRadius(n, g.max)} fillOpacity={0.55 + 0.45 * dotLevel(n, g.max)} className="a-map-dot" />
                </svg>
                {fmtKey(n)}
              </span>
            ))}
            <span>LOG</span>
          </span>
        )}
      </div>
    </div>
  )
}

// ── Split bar (device classes, share actions) ───────────────────────────────────────────────

export function Split({ rows, names, total: whole }: { rows: Ranked | undefined; names?: Record<string, string>; total?: number }) {
  const list = (rows ?? []).filter(([v]) => v)
  const total = Math.max(whole ?? 0, list.reduce((a, r) => a + r[1], 0))
  if (!list.length || !total) return <p className="a-empty">Nothing yet</p>
  return (
    <div className="a-split">
      <div className="a-split-bar" aria-hidden>
        {list.map(([v, n], i) => (
          <span key={v} className={`a-split-seg a-split-${Math.min(i, 4)}`} style={{ width: `${(n / total) * 100}%` }} />
        ))}
      </div>
      <ul className="a-split-legend">
        {list.map(([v, n], i) => (
          <li key={v}>
            <span className={`a-split-key a-split-${Math.min(i, 4)}`} aria-hidden />
            <span className="a-split-name">{names?.[v] ?? v}</span>
            <span className="a-split-n">{fmtInt(n)}</span>
            <span className="a-split-pct">{fmtPct(n / total)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
