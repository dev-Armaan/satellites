"""
Build src/admin/land.gen.ts: the land, the large lakes and the borders between countries, as three SVG paths for the
admin page's map of searched places (src/admin/WorldMap.tsx).

The map is at most ~1,700 px wide for 360° (4.7 px a degree), so Natural Earth's 1:50m shapes carry far more than it
can show. Each line is thinned (Douglas-Peucker, TOLERANCE degrees: about a third of a pixel), islands and lakes too
small to be seen are dropped, and what is left is written as relative integer moves on a 1/SCALE° lattice: about
40 kB in the admin bundle, which only the owner loads. The app never imports it.

Path units: x = (lon + 180) · SCALE, y = (90 - lat) · SCALE, so the map draws them under one `scale()`.

Source: Natural Earth v5.1.2 (public domain), from
  https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@v5.1.2/geojson/<name>.geojson

Usage (no packages needed):
  python3 scripts/build-admin-land.py ne_50m_land.geojson ne_50m_lakes.geojson ne_50m_admin_0_boundary_lines_land.geojson
"""
import json, sys

SCALE = 10  # lattice steps a degree: 0.1°, about one device pixel at the widest
TOLERANCE = 0.08  # degrees a thinned line may stray from the original
MIN_LAND = 0.35  # square degrees: smaller islands are specks under one pixel
MIN_LAKE = 1.6  # square degrees: the Great Lakes, Victoria, Baikal, the Caspian… not every reservoir
MIN_BORDER = 0.4  # degrees of extent: shorter border pieces (enclaves, causeways) are noise
OUT = 'src/admin/land.gen.ts'


def thin(pts, tol):
    """Douglas-Peucker, iterative. Keeps both ends."""
    if len(pts) < 3:
        return pts
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        a, b = stack.pop()
        (ax, ay), (bx, by) = pts[a], pts[b]
        dx, dy = bx - ax, by - ay
        d2 = dx * dx + dy * dy
        worst, at = 0.0, -1
        for i in range(a + 1, b):
            px, py = pts[i]
            if d2 == 0:
                d = ((px - ax) ** 2 + (py - ay) ** 2) ** 0.5
            else:
                t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / d2))
                d = ((px - ax - t * dx) ** 2 + (py - ay - t * dy) ** 2) ** 0.5
            if d > worst:
                worst, at = d, i
        if worst > tol:
            keep[at] = True
            stack += [(a, at), (at, b)]
    return [p for p, k in zip(pts, keep) if k]


def area(ring):
    return abs(sum(x0 * y1 - x1 * y0 for (x0, y0), (x1, y1) in zip(ring, ring[1:] + ring[:1]))) / 2


def lattice(pts):
    out = []
    for lon, lat in pts:
        q = (round((lon + 180) * SCALE), round((90 - lat) * SCALE))
        if not out or out[-1] != q:
            out.append(q)
    return out


def path(lines, closed):
    """Relative moves: `m` to each line's start (from the last point drawn), then one `l` run."""
    out = []
    cx = cy = 0
    for pts in lines:
        if closed and pts[0] == pts[-1]:
            pts = pts[:-1]
        if len(pts) < (3 if closed else 2):
            continue
        x0, y0 = pts[0]
        d = [f'm{x0 - cx},{y0 - cy}l']
        px, py = x0, y0
        steps = []
        for x, y in pts[1:]:
            steps.append(f'{x - px},{y - py}')
            px, py = x, y
        d.append(' '.join(steps).replace(' -', '-'))
        if closed:
            d.append('z')
            cx, cy = x0, y0  # `z` puts the pen back on the ring's start
        else:
            cx, cy = px, py
        out.append(''.join(d))
    return ''.join(out)


def rings(file, min_area):
    """Outer rings and their holes, thinned; a polygon whose outer ring is too small goes with its holes."""
    out = []
    for f in json.load(open(file))['features']:
        g = f['geometry']
        polys = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
        for poly in polys:
            outer = [(p[0], p[1]) for p in poly[0]]
            if area(outer) < min_area:
                continue
            for i, ring in enumerate(poly):
                pts = [(p[0], p[1]) for p in ring]
                if i and area(pts) < min_area:
                    continue
                pts = lattice(thin(pts, TOLERANCE))
                if len(pts) >= 4:
                    out.append(pts)
    return out


def lines(file):
    out = []
    for f in json.load(open(file))['features']:
        g = f['geometry']
        parts = g['coordinates'] if g['type'] == 'MultiLineString' else [g['coordinates']]
        for part in parts:
            pts = [(p[0], p[1]) for p in part]
            xs, ys = [p[0] for p in pts], [p[1] for p in pts]
            if max(max(xs) - min(xs), max(ys) - min(ys)) < MIN_BORDER:
                continue
            pts = lattice(thin(pts, TOLERANCE))
            if len(pts) >= 2:
                out.append(pts)
    return out


def main():
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    land, lakes, borders = rings(sys.argv[1], MIN_LAND), rings(sys.argv[2], MIN_LAKE), lines(sys.argv[3])
    body = f"""/**
 * GENERATED by scripts/build-admin-land.py from Natural Earth 1:50m v5.1.2 (public domain). Do not edit by hand.
 *
 * The admin map's ground: land, large lakes and the borders between countries as SVG paths, in units of
 * 1/{SCALE}° (x east of 180°W, y south of 90°N). Only the admin bundle imports this.
 */
export const LAND_SCALE = {SCALE}
export const LAND = '{path(land, True)}'
export const LAKES = '{path(lakes, True)}'
export const BORDERS = '{path(borders, False)}'
"""
    open(OUT, 'w').write(body)
    print(f'{OUT}: {len(body) / 1000:.1f} kB · land {len(land)} rings, {sum(map(len, land))} points · lakes {len(lakes)} · borders {len(borders)} lines, {sum(map(len, borders))} points')


main()
