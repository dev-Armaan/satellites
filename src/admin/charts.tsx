/**
 * Hand-rolled SVG charts for the admin page, drawn in the Instrument style (docs/DESIGN.md): hairlines,
 * bone marks, mono labels, signal used only for shares and the places people looked at (the map: WorldMap.tsx).
 */
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import type { Ranked } from './api'
import { browserLanguageName, etParts, fmtBucket, fmtInt, fmtPct, funnelShares, niceMax, type BrowserLangRow, type FunnelStage } from './format'

export function useWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
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

// ── Activity: searches, time-lapse opens (ice), shares (signal) and sessions over time ──
// Lines through one point a bucket (an hour or a day), in every range: bars a day wide read as blocks, not as a
// trend, and the owner wants one look for all ranges. All four are on one scale, so they can be compared directly.

export function ActivityChart({ series, bucket }: { series: [number, number, number, number, number][]; bucket: 'hour' | 'day' }) {
  const [ref, w] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const H = 188
  const top = 22
  const bottom = 22
  const right = 34
  const plotW = Math.max(0, w - right)
  const plotH = H - top - bottom
  const n = series.length
  const max = niceMax(Math.max(1, ...series.map((s) => Math.max(s[1], s[2], s[3], s[4]))))
  // Shown once the range has any (the time-lapse went live on 2026-11-13): before that the readout would be a row of zeros.
  const lapses = series.some((s) => s[4] > 0)
  const bw = n ? plotW / n : 0
  const y = (v: number) => top + plotH - (v / max) * plotH
  const ticks = n ? tickIndexes(series.map((s) => s[0]), bucket, Math.max(2, Math.floor(plotW / 92))) : []
  const sel = hover ?? n - 1
  const cur = series[sel]
  const cx = (i: number) => i * bw + bw / 2
  const through = (k: 1 | 2 | 3 | 4) => series.map((s, i) => `${i ? 'L' : 'M'}${cx(i).toFixed(1)},${y(s[k]).toFixed(1)}`).join('')
  // Every bucket gets its point while there is room for them; the one under the cursor always does.
  const dots = series.map((_, i) => i).filter((i) => bw >= 14 || i === sel)

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
            {lapses ? (
              <span className="a-ice-text">
                <b>{fmtInt(cur[4])}</b> {cur[4] === 1 ? 'TIME-LAPSE' : 'TIME-LAPSES'}
              </span>
            ) : null}
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
          aria-label="Searches, time-lapse opens, shares and sessions over time"
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
          {n > 1 && (
            <>
              <path d={`${through(1)}L${cx(n - 1).toFixed(1)},${y(0)}L${cx(0).toFixed(1)},${y(0)}Z`} className="a-area" />
              <path d={through(3)} className="a-line" />
              <path d={through(1)} className="a-line a-line-main" />
              {lapses && <path d={through(4)} className="a-line a-line-ice" />}
              {series.some((s) => s[2] > 0) && <path d={through(2)} className="a-line a-line-signal" />}
            </>
          )}
          {cur && <line x1={cx(sel)} x2={cx(sel)} y1={top - 6} y2={y(0)} className="a-cursor" />}
          {dots.map((i) => {
            const s = series[i]
            const r = i === sel ? 3 : 2
            return (
              <g key={s[0]}>
                <circle cx={cx(i)} cy={y(s[3])} r={r} className="a-dot a-dot-dim" />
                <circle cx={cx(i)} cy={y(s[1])} r={r} className="a-dot" />
                {s[4] > 0 && <circle cx={cx(i)} cy={y(s[4])} r={r} className="a-dot a-dot-ice" />}
                {s[2] > 0 && <circle cx={cx(i)} cy={y(s[2])} r={r} className="a-dot a-dot-signal" />}
              </g>
            )
          })}
          {ticks.map((i) => {
            const x = cx(i)
            return (
              <g key={i}>
                <line x1={x} x2={x} y1={y(0)} y2={y(0) + 4} className="a-tick" />
                <text x={x} y={H - 6} className="a-axis" textAnchor="middle">
                  {fmtBucket(series[i][0], bucket, true)}
                </text>
              </g>
            )
          })}
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
/** `cols`: the list in two columns, read down then across (a long one in a wide panel). */
/** `onPoint`: told which row the pointer is on (its value) and when it leaves (null): the places list lights its map. */
export function RankList({ rows, total, max = 8, label, empty = 'Nothing yet', accent = false, cols = false, onPoint }: { rows: Ranked | undefined; total?: number; max?: number; label?: (v: string) => ReactNode; empty?: string; accent?: boolean; cols?: boolean; onPoint?: (v: string | null) => void }) {
  const list = (rows ?? []).filter(([v]) => v !== '').slice(0, max)
  if (!list.length) return <p className="a-empty">{empty}</p>
  total = Math.max(total ?? 0, (rows ?? []).reduce((a, r) => a + r[1], 0))
  const top = list[0][1]
  return (
    <ol className={cols ? 'a-rank a-rank-cols' : 'a-rank'}>
      {list.map(([v, n], i) => (
        <li key={v} onPointerEnter={onPoint && (() => onPoint(v))} onPointerLeave={onPoint && (() => onPoint(null))}>
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

// ── Browser languages: tabs, and the share of them that searched ────────────────────────────

const TRANSLATION_TAGS = { none: 'No translation', unlisted: 'Unlisted' } as const

/**
 * Each browser language's tabs, their share of `total`, and the share of them that searched (0028). The line under a
 * row is that searched share of the whole width, and its tick `avg`, the share of all the listed tabs: a language whose
 * visitors leave without searching ends short of it. A language the app has no translation for (or has one not yet
 * listed) says so. Two columns, each with its header, when the list is long.
 */
export function ReachList({ rows, total, avg, max = 24, empty }: { rows: BrowserLangRow[]; total: number; avg: number | null; max?: number; empty: string }) {
  if (!rows.length) return <p className="a-empty">{empty}</p>
  const shown = rows.slice(0, max)
  const rest = rows.slice(max)
  const half = shown.length > 8 ? Math.ceil(shown.length / 2) : shown.length
  const cols = half < shown.length ? [shown.slice(0, half), shown.slice(half)] : [shown]
  const whole = Math.max(total, rows.reduce((a, r) => a + r.tabs, 0))
  const pct = (f: number) => `${Math.max(0, Math.min(1, f)) * 100}%`
  return (
    <>
      <div className="a-reach">
        {cols.map((col, c) => (
          <div key={c} className="a-reach-col">
            <div className="a-reach-head a-label" aria-hidden>
              <span />
              <span>Language</span>
              <span>Tabs</span>
              <span>Share</span>
              <span>Searched</span>
            </div>
            <ol className="a-rank a-reach-list">
              {col.map((r, i) => (
                <li key={r.code}>
                  <span className="a-rank-i">{String(c * half + i + 1).padStart(2, '0')}</span>
                  <span className="a-rank-label a-reach-label">
                    <span>{browserLanguageName(r.code)}</span>
                    {r.translation !== 'listed' && <span className="a-tag">{TRANSLATION_TAGS[r.translation]}</span>}
                  </span>
                  <span className="a-rank-n">{fmtInt(r.tabs)}</span>
                  <span className="a-rank-pct">{fmtPct(r.tabs / whole)}</span>
                  <span className="a-reach-pct" aria-label={`${fmtPct(r.searched / r.tabs)} searched`}>
                    {fmtPct(r.searched / r.tabs)}
                  </span>
                  <span className="a-reach-bar" aria-hidden>
                    <span style={{ width: pct(r.searched / r.tabs) }} />
                    {avg != null && <i style={{ left: pct(avg) }} />}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
      {rest.length > 0 && (
        <p className="a-note">
          And {fmtInt(rest.length)} more {rest.length === 1 ? 'language' : 'languages'}: {fmtInt(rest.reduce((a, r) => a + r.tabs, 0))} tabs (
          {fmtPct(rest.reduce((a, r) => a + r.tabs, 0) / whole)}), {fmtInt(rest.filter((r) => r.translation === 'none').length)} with no translation.
        </p>
      )}
    </>
  )
}

// ── Funnel ──────────────────────────────────────────────────────────────────────────────────

/** Each step's count and its share of `sessions`; a bar's length is that share, so bars and percentages agree. */
export function Funnel({ stages, sessions }: { stages: FunnelStage[]; sessions: number }) {
  return (
    <ol className="a-funnel">
      {funnelShares(stages, sessions).map(({ stage: s, share }, i) => {
        return (
          <li key={s.key}>
            <span className="a-funnel-label">{s.label}</span>
            <span className="a-funnel-track" aria-hidden>
              <span className={i === stages.length - 1 ? 'a-signal-bg' : undefined} style={{ width: share !== null ? `${Math.max(0.4, Math.min(1, share) * 100)}%` : '0%' }} />
            </span>
            <span className="a-funnel-n">{fmtInt(s.n)}</span>
            <span className="a-funnel-pct">{fmtPct(share)}</span>
          </li>
        )
      })}
    </ol>
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
