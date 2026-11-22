/**
 * The admin page's map of where people searched: a mission-control ground map (straight latitude and longitude, the
 * projection every ground-track plot uses) with the searched places as circles on it.
 *
 * What it is made of, and why:
 *  - Ground: land a shade above the sea, lakes and borders cut back out of it in the sea's colour. No coastline is
 *    stroked: every line on the map is then either the 30° lattice or data.
 *  - Data: one circle a spot (placeMap.ts gathers the 0.1° cells of a city into one), its area its searches. Small
 *    spots are solid points, large ones a ring over a faint fill with the busiest cell marked at the centre, so a
 *    large circle never hides the points inside it. Signal is used for nothing else here.
 *  - Names: the page's top places, written beside their circles where there is room. Any spot answers the pointer
 *    with a plate: its name if it has one, where it is, its searches and their share.
 *  - Key: nested circles drawn at the map's own scale with round counts, in the South Pacific, where nothing is.
 *
 * The ground and the circles are drawn once per data and width (memo); the pointer only moves a reticle and a plate.
 */
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import { searchLocal } from '@/imagery/localPlaces'
import type { Ranked } from './api'
import { useWidth } from './charts'
import { fmtInt, fmtPct } from './format'
import { BORDERS, LAKES, LAND, LAND_SCALE } from './land.gen'
import { DUST_RADIUS, REACH, dustCount, fmtLatLon, fmtShort, keyCounts, maxCircles, maxRadius, nameSpots, placeMap, placeTags, spotRadius, type Found, type PlaceMap, type Tag } from './placeMap'

/** A circle under this share of the largest radius is a solid disc; over it, a ring on a faint fill, so the few
 *  largest hide nothing under them (about a fifth of the busiest place's searches and up). */
const RING_FROM = 0.45
/** How many of the page's top places are looked up for a name. */
const NAMED = 15
const NO_NAMES = new Map<number, string>()

interface Mark {
  x: number
  y: number
  /** As drawn: the circle's radius, or the dust dot's */
  r: number
  dust: boolean
}

/** Names for the spots the top places fall in, from the offline place list (a few small cached files, same origin). */
function useSpotNames(map: PlaceMap, labels: Ranked | undefined): Map<number, string> {
  const [got, setGot] = useState<{ map: PlaceMap; names: Map<number, string> } | null>(null)
  useEffect(() => {
    const top = (labels ?? []).filter(([l]) => l).slice(0, NAMED)
    if (!top.length || !map.spots.length) return
    const ac = new AbortController()
    const found = new Map<string, Found[]>()
    void Promise.all(
      [...new Set(top.map(([l]) => l.split(',')[0].trim()))].map(async (name) => {
        // A list that cannot be read leaves that place unnamed: the map does not need it.
        found.set(name, name ? await searchLocal(name, ac.signal, 8).catch(() => []) : [])
      }),
    ).then(() => {
      if (!ac.signal.aborted) setGot({ map, names: nameSpots(map, top, (n) => found.get(n)) })
    })
    return () => ac.abort()
  }, [map, labels])
  return got?.map === map ? got.names : NO_NAMES
}

/** The width of one character of the map's mono text, measured (the tags are laid out before they are drawn). */
function useCharWidth(): [React.RefObject<HTMLSpanElement | null>, number] {
  const ref = useRef<HTMLSpanElement>(null)
  const [cw, setCw] = useState(6.4)
  useLayoutEffect(() => {
    const measure = () => {
      const w = ref.current?.getBoundingClientRect().width
      if (w) setCw(w / 10)
    }
    measure()
    void document.fonts?.ready.then(measure)
    addEventListener('resize', measure)
    return () => removeEventListener('resize', measure)
  }, [])
  return [ref, cw]
}

const Ground = memo(function Ground({ k, north, south, w }: { k: number; north: number; south: number; w: number }) {
  const y = (lat: number) => (north - lat) * k
  const lats = [-60, -30, 0, 30, 60].filter((l) => l < north - 2 && l > south + 2)
  const every = w < 560 ? 60 : 30
  const lons = Array.from({ length: 360 / every - 1 }, (_, i) => -180 + (i + 1) * every)
  const deg = (v: number, pos: string, neg: string) => `${Math.abs(v)}°${v === 0 ? '' : v > 0 ? pos : neg}`
  // On a phone the first parallel's label is on the meridians' row: the last meridians give it the corner.
  const crowded = lats.some((l) => y(l) < 30)
  return (
    <>
      <g transform={`translate(0 ${-(90 - north) * k}) scale(${k / LAND_SCALE})`}>
        <path d={LAND} className="a-map-land" />
        <path d={BORDERS} className="a-map-border" />
        <path d={LAKES} className="a-map-sea" />
      </g>
      {lats.map((l) => (
        <g key={`a${l}`}>
          <line x1={0} x2={w} y1={Math.round(y(l)) + 0.5} y2={Math.round(y(l)) + 0.5} className="a-map-lattice" />
          <text x={w - 6} y={y(l) - 4} textAnchor="end" className="a-axis">
            {deg(l, 'N', 'S')}
          </text>
        </g>
      ))}
      {lons.map((l) => {
        const x = Math.round((l + 180) * k) + 0.5
        return (
          <g key={`o${l}`}>
            <line x1={x} x2={x} y1={0} y2={(north - south) * k} className="a-map-lattice" />
            {(x < w - 76 || !crowded) && (
              <text x={x + 4} y={12} className="a-axis">
                {deg(l, 'E', 'W')}
              </text>
            )}
          </g>
        )
      })}
    </>
  )
})

/** Dust first, then the circles largest first: a circle is never under a larger one, and dust never dirties one. */
const Spots = memo(function Spots({ marks, ringFrom }: { marks: Mark[]; ringFrom: number }) {
  return (
    <>
      {marks.map((m, i) => (m.dust ? <circle key={i} cx={m.x} cy={m.y} r={m.r} className="a-map-dust" /> : null))}
      {marks.map((m, i) =>
        m.dust ? null : m.r < ringFrom ? (
          // The ink outline sits outside the disc, so two that touch stay two and neither loses area to it.
          <circle key={i} cx={m.x} cy={m.y} r={m.r + 0.4} className="a-map-dot a-map-disc" />
        ) : (
          <g key={i}>
            <circle cx={m.x} cy={m.y} r={m.r} className="a-map-ring" />
            <circle cx={m.x} cy={m.y} r={1.25} className="a-map-dot" />
          </g>
        ),
      )}
    </>
  )
})

/** Nested circles at the map's scale, their counts on leaders; under them, what the smallest dot stands for. */
function Key({ max, rMax, dust: floor, x, bottom, narrow }: { max: number; rMax: number; dust: number; x: number; bottom: number; narrow: boolean }) {
  const counts = keyCounts(max, rMax, floor)
  if (!counts.length) return null
  const R = spotRadius(counts[0], max, rMax)
  const base = bottom - (floor >= 1 ? 16 : 0)
  // Each count sits level with its circle's top, or higher where the circles are too close for two lines of text.
  const ys: number[] = []
  for (let i = counts.length - 1; i >= 0; i--) {
    const top = base - 2 * spotRadius(counts[i], max, rMax)
    ys[i] = Math.min(top, (ys[i + 1] ?? Infinity) - 11)
  }
  const tx = x + 2 * R + 12
  return (
    <g className="a-map-key" aria-hidden="true">
      <text x={x} y={ys[0] - 14} className="a-axis">
        SEARCHES
      </text>
      {counts.map((c, i) => {
        const r = spotRadius(c, max, rMax)
        return (
          <g key={c}>
            <circle cx={x + R} cy={base - r} r={r} className="a-map-key-ring" />
            <line x1={x + R} y1={base - 2 * r} x2={tx - 4} y2={ys[i]} className="a-map-leader" />
            <text x={tx} y={ys[i] + 3.5} className="a-axis a-map-key-n">
              {fmtShort(c)}
            </text>
          </g>
        )
      })}
      {floor >= 1 && (
        <>
          <circle cx={x + R} cy={bottom - 4} r={DUST_RADIUS} className="a-map-dust" />
          <text x={tx} y={bottom - 0.5} className="a-axis a-map-key-n">
            {floor > 1 ? (narrow ? `≤ ${fmtShort(floor)}` : `${fmtShort(floor)} OR FEWER`) : '1'}
          </text>
        </>
      )}
    </g>
  )
}

/**
 * `labels`: the page's top places, for the names. `total`: every search in the range, so a share is of all of them and
 * not only of the cells the stats kept. `focus`: a top place's label, to point it out from the list beside the map.
 */
export function WorldMap({ cells, labels, total, focus }: { cells: Ranked | undefined; labels?: Ranked; total?: number; focus?: string | null }) {
  const [ref, w] = useWidth<HTMLDivElement>()
  const [chRef, cw] = useCharWidth()
  const map = useMemo(() => placeMap(cells), [cells])
  // The spot under the pointer, and the data it was a spot of: new stats put other spots at the same index.
  const [over, setOver] = useState<{ map: PlaceMap; i: number } | null>(null)
  const hover = over?.map === map ? over.i : null
  const names = useSpotNames(map, labels)
  const all = Math.max(total ?? 0, map.searches)

  const k = w / 360
  const h = Math.round((map.north - map.south) * k)
  const rMax = maxRadius(w)
  const dust = useMemo(() => dustCount(map.spots, map.max, rMax, maxCircles(w)), [map, rMax, w])
  const marks = useMemo<Mark[]>(
    () => map.spots.map((s) => ({ x: (s.lon + 180) * k, y: (map.north - s.lat) * k, r: s.n <= dust ? DUST_RADIUS : spotRadius(s.n, map.max, rMax), dust: s.n <= dust })),
    [map, k, rMax, dust],
  )
  // The key's corner: above 60°S when the map goes on to Antarctica, so it stays in the open Pacific.
  const keyBottom = Math.min(h, (map.north + 58) * k) - 12
  const tags = useMemo<(Tag & { name: string })[]>(() => {
    if (!w) return []
    // As many names as the width can carry without the map turning into a list.
    const wanted = [...names]
      .sort((a, b) => a[0] - b[0])
      .slice(0, Math.max(4, Math.min(12, Math.round(w / 100))))
      .map(([i, name]) => ({ spot: i, name: name.length > 22 ? `${name.slice(0, 21)}…` : name }))
    const large = marks.map((m, i) => ({ m, i })).filter(({ m }) => !m.dust)
    const avoid = [...large.map(({ m }) => ({ x: m.x - m.r, y: m.y - m.r, w: 2 * m.r, h: 2 * m.r })), { x: 0, y: keyBottom - 4 * rMax - 30, w: 2 * rMax + 110, h: 4 * rMax + 42 }]
    const placed = placeTags(
      wanted.map((t) => ({ spot: t.spot, cx: marks[t.spot].x, cy: marks[t.spot].y, r: Math.max(marks[t.spot].r, 2), w: t.name.length * cw, own: large.findIndex(({ i }) => i === t.spot) })),
      avoid,
      { x: 6, y: 18, w: w - 46, h: h - 22 },
    )
    return placed.map((p) => ({ ...p, name: wanted.find((t) => t.spot === p.spot)!.name }))
  }, [names, marks, cw, w, h, keyBottom, rMax])

  // The list beside the map points a place out by its label; the pointer over the map wins.
  const focused = useMemo(() => {
    const name = focus?.split(',')[0].trim()
    if (!name) return null
    for (const [i, n] of names) if (n === name) return i
    return null
  }, [focus, names])
  const sel = hover ?? focused
  const spot = sel !== null ? map.spots[sel] : undefined
  const mark = sel !== null ? marks[sel] : undefined

  const point = (e: PointerEvent<SVGSVGElement>) => {
    const box = e.currentTarget.getBoundingClientRect()
    const px = e.clientX - box.left
    const py = e.clientY - box.top
    // The nearest centre among the spots the pointer is on or beside: a point inside a large ring can still be picked.
    // On touch the plate stays until the map is touched somewhere else (a finger never leaves).
    let best: number | null = null
    let bestD = Infinity
    for (let i = 0; i < marks.length; i++) {
      const m = marks[i]
      const d = Math.hypot(m.x - px, m.y - py)
      if (d <= Math.max(m.r + 2, 8) && d < bestD) {
        best = i
        bestD = d
      }
    }
    setOver((o) => (best === null ? null : o?.map === map && o.i === best ? o : { map, i: best }))
  }

  const summary = `${map.spots.length ? `${fmtInt(map.searches)} searches in ${fmtInt(map.cells)} cells of 0.1°` : 'No searches yet'}${map.spots.length && all > map.searches ? ` · ${fmtPct(map.searches / all)} of all` : ''}`
  const plateLeft = mark ? mark.x > w * 0.62 : false

  return (
    <div className="a-map">
      <div className="a-map-view" ref={ref}>
        <span ref={chRef} className="a-map-tag a-map-measure" aria-hidden="true">
          0000000000
        </span>
        {w > 0 && (
          <svg
            width={w}
            height={h}
            role="img"
            aria-label={`Map of searched places: ${summary}`}
            onPointerMove={point}
            onPointerDown={point}
            onPointerLeave={(e) => e.pointerType === 'mouse' && setOver(null)}
          >
            <Ground k={k} north={map.north} south={map.south} w={w} />
            <Spots marks={marks} ringFrom={RING_FROM * rMax} />
            {tags.map((t) => (
              <g key={t.spot}>
                {t.leader && <line x1={t.leader[0]} y1={t.leader[1]} x2={t.leader[2]} y2={t.leader[3]} className="a-map-leader" />}
                <text x={t.x} y={t.y + t.h / 2 + 3.5} className="a-map-tag">
                  {t.name}
                </text>
              </g>
            ))}
            {map.spots.length > 0 && <Key max={map.max} rMax={rMax} dust={dust} x={14} bottom={keyBottom} narrow={w < 560} />}
            {mark && (
              <g className="a-map-reticle" transform={`translate(${mark.x} ${mark.y})`}>
                <circle r={mark.r + 4} />
                {[0, 90, 180, 270].map((a) => (
                  <line key={a} x1={mark.r + 4} x2={mark.r + 9} transform={`rotate(${a})`} />
                ))}
              </g>
            )}
          </svg>
        )}
        {spot && mark && (
          <div
            className="a-map-plate"
            // Beside the spot; on a phone, where that would cover a third of the world, in the map's bottom corner.
            style={w < 560 ? { right: 6, bottom: 6 } : { [plateLeft ? 'right' : 'left']: (plateLeft ? w - mark.x : mark.x) + mark.r + 14, top: Math.max(4, Math.min(h - 62, mark.y - 28)) }}
            aria-live="polite"
          >
            {names.get(sel!) && <span className="a-map-plate-name">{names.get(sel!)}</span>}
            <span className="a-dim">
              {fmtLatLon(spot.lat, spot.lon)}
              {spot.cells > 1 ? ` · ${spot.cells} cells` : ''}
            </span>
            <span>
              <b>{fmtInt(spot.n)}</b> {spot.n === 1 ? 'search' : 'searches'}
              {spot.n / all >= 0.0005 && <span className="a-dim"> · {fmtPct(spot.n / all)}</span>}
            </span>
          </div>
        )}
      </div>
      <div className="a-map-legend">
        <span>{summary}</span>
        {map.spots.length > 0 && <span>A circle’s area is its searches · cells within {REACH}° are one circle</span>}
      </div>
    </div>
  )
}
