/**
 * The selected pass (store.report + store.selectedPassId), replay-synced to sim time. Together with the painted image
 * (Imagery.tsx + the Earth shader), the reticle's capture shockwave (PlaceMarker) and the camera's chase
 * (CameraDirector) this is the ACQUISITION SEQUENCE (owner request C, acquisition.ts):
 *  - the spacecraft: a small low-poly model (spacecraft.ts) at its true SGP4 position, placed geodetically
 *    (latLonToWorld(lat, lon, 1 + h/R)) so it sits exactly above its own track, oriented along its velocity with the
 *    instrument looking straight down, lit by the real sun unless it is in Earth's shadow, at a constant on-screen
 *    size; crewed and ambient objects keep their category glyph. A callout labels it;
 *  - behind it a fading orbit-arc trail, and a faint dashed ring of its whole orbit (inertial, turning with GMST);
 *  - the sensor's LIGHT CURTAIN while the replay runs: a translucent fan from the spacecraft to the swath's true
 *    cross-track width on the ground, additive, with bright hairline edges and scan lines streaming down it;
 *  - the swath ribbon on the surface (width = profile swath, or the field-of-regard ground range for agile imagers),
 *    built from real great-circle offsets perpendicular to the heading (swath.ts), clipped to ±700 km along-track
 *    around the place. It is an OUTLINE, not a slab: bone edges ahead, the verdict colour behind, and at its front
 *    the bright SCAN LINE (where the curtain meets the Earth) with a short fresh-exposure glow behind it;
 *  - for pointable imagers, a view line to the place while it is within the field of regard; for crewed passes a
 *    nadir line.
 * Colour follows meaning: signal only where an image exists or is likely; agile "could have" passes are bone
 * (radar: ice) with a dashed field of regard; crewed passes draw the track alone.
 *
 * Entrances and exits are damped (M11): a pass fades in over 500 ms (--ease-out); on deselect, ←/→ or reset the
 * outgoing pass stays mounted, frozen at its last sim time, and fades out over 300 ms (--ease-in-out).
 */
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import { BufferAttribute, BufferGeometry, Matrix4, Mesh, PerspectiveCamera, Vector2, Vector3 } from 'three'
import { DEG, EARTH_RADIUS_KM, gmst, latLonToWorld } from '@/lib/geo'
import { easeInOut, easeOut } from '@/lib/ease'
import { selectSelectedPass, useApp } from '@/state/store'
import type { Pass, SatCategory } from '@/types'
import { palette } from '@/ui/system/palette'
import { damp } from './cameraMath'
import { geoDiveAt } from './acquisition'
import { getSatInfo, groundTrack, propagate, scanAngleAt, scanLine, scanSeatOf } from './data'
import { Hairline } from './hairline'
import { createCurtainMaterial, createRibbonMaterial, createSpacecraftMaterial, lin, type RibbonLook } from './materials'
import { FRAME, useRuntime } from './runtime'
import { SatGlyph, useSatAnchor, type MarkTone, type SatTrackFn } from './SatMarker'
import { buildSpacecraftGeometry, SPACECRAFT_SPAN } from './spacecraft'
import { buildRibbon, buildScanRibbon, fieldModelFor, GEO_SCAN_FIELD } from './swath'

/** Trail length behind the satellite (≈ 2,500 km: enough to read the direction, short of the screen edge), and its sampling. */
const TRAIL_MS = 6 * 60_000
const TRAIL_STEP_S = 20
/** The dashed full-orbit ring: samples per orbit (dash = one sample on, one off). */
const RING_SAMPLES = 220
/** The spacecraft model's wing span on screen (CSS px). */
const CRAFT_PX = { desktop: 54, phone: 40 }
/** Light curtain: columns across the swath; ground lift (matches the ribbon). */
const CURTAIN_COLS = 32
const CURTAIN_LIFT = 1.0006
/** After the capture of an imaged pass the curtain bows out: the developed image speaks. */
const CURTAIN_AFTER_CAPTURE_MS = 900
/**
 * With the camera below the spacecraft (the dive, the settled close view) the curtain is a wall of light standing on
 * the scan line. It fades out as it nears the camera along-track (between these distances, km), so it never sweeps
 * through the lens.
 */
const WALL_FADE_KM = { near: 70, far: 190 }
/** The ribbon covers this much ground track either side of the place. */
export const RIBBON_CLIP_KM = 700
const FADE_IN_MS = 500
const FADE_OUT_MS = 300

/** Anchor id of a pass's satellite callout (GlobeOverlay reads the same id). */
export const passAnchorId = (passId: string) => `sel:${passId}`

export function PassOverlay() {
  const pass = useApp(selectSelectedPass)
  const place = useApp((s) => s.report?.place ?? s.place)
  const rt = useRuntime()
  useEffect(() => {
    rt.overlayNorad = pass ? pass.norad : -1
    return () => {
      rt.overlayNorad = -1
    }
  }, [rt, pass])

  // Mounted scenes: the selected pass plus any that are still fading out. Derived during render, so a newly
  // selected pass mounts in the same commit; scenes remove themselves once faded.
  const [list, setList] = useState<Pass[]>([])
  let next = list
  if (pass && pass.track.length >= 2) {
    const i = list.findIndex((p) => p.id === pass.id)
    if (i < 0) next = [...list, pass]
    else if (list[i] !== pass) next = list.map((p) => (p.id === pass.id ? pass : p))
  }
  if (next !== list) setList(next)

  return (
    <>
      {next.map((p) => (
        <PassScene key={p.id} pass={p} place={place} onGone={() => setList((l) => l.filter((x) => x.id !== p.id))} />
      ))}
    </>
  )
}

function lookFor(pass: Pass, category: SatCategory, mode: 'swath' | 'regard' | 'none'): RibbonLook & { tone: MarkTone } {
  const kind: RibbonLook['kind'] = mode === 'none' || pass.verdict === 'overhead' ? 2 : mode === 'regard' ? 1 : 0
  // Fill alphas are linear-light values on the day side; the shader halves them over unlit ground and thins
  // them over cloud. 'likely' and 'could' are quieter: no image exists.
  if (pass.verdict === 'imaged') return { tone: 'signal', color: lin(palette.signal), kind, fill: 0.07 }
  if (pass.verdict === 'likely') return { tone: 'signal', color: lin(palette.signal), kind, fill: 0.05 }
  const tone: MarkTone = category === 'radar' ? 'ice' : 'bone'
  return { tone, color: lin(tone === 'ice' ? palette.ice : palette.bone), kind, fill: kind === 1 ? 0.035 : 0.05 }
}

function PassScene({ pass, place, onGone }: { pass: Pass; place?: { lat: number; lon: number }; onGone: () => void }) {
  const rt = useRuntime()
  const info = getSatInfo(pass.norad)
  const category: SatCategory = info?.category ?? 'other'
  const field = useMemo(() => (pass.geostationary ? GEO_SCAN_FIELD : fieldModelFor(info)), [info, pass.geostationary])
  const look = useMemo(() => ({ ...lookFor(pass, category, field.mode), noTrack: !!pass.geostationary, fadeEnds: !!pass.geostationary }), [pass, category, field.mode])
  const pointable = field.mode === 'regard' || pass.verdict === 'could'
  // Imaging spacecraft get the model and the curtain; crewed / ambient objects keep their glyph and a nadir line.
  const imager = category !== 'crewed' && category !== 'other'
  // A geostationary imager's curtain reaches from where it sits, 35,786 km out, to its scan line on the disc (the
  // camera starts behind it: framing.geoScanPose). Its foot is the line itself, not the ground under the spacecraft.
  const curtainOn = imager && field.mode !== 'none'

  // A geostationary scan's line at a moment: where the plane its mirror sweeps cuts the Earth, the width of the disc
  // (engine geostationary.ts). The ribbon's rows and the curtain's foot are both this line, so they cannot part.
  const scanLineAt = useMemo(() => {
    const seat = pass.geostationary ? scanSeatOf(pass) : undefined
    return seat ? (t: number) => scanLine(seat, scanAngleAt(pass, t)) : undefined
  }, [pass])

  // ── ribbon
  const ribbon = useMemo(() => {
    // The line's last RIBBON_CLIP_KM of travel before the place and the same after, as for a ground track.
    const clipMs = (RIBBON_CLIP_KM / Math.max(1, pass.groundSpeedKmS)) * 1000
    const r = scanLineAt
      ? buildScanRibbon(scanLineAt, {
          tRef: pass.tClosest,
          tFrom: Math.max(pass.tStart, pass.tClosest - clipMs),
          tTo: Math.min(pass.tEnd, pass.tClosest + clipMs),
          dir: pass.node === 'descending' ? -1 : 1,
        })
      : buildRibbon(pass.track, pass.tClosest, field.halfWidthKm, { minHalfWidthKm: 20, clipKm: RIBBON_CLIP_KM, maxStepDeg: 0.25 })
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(r.positions, 3))
    g.setAttribute('aAlong', new BufferAttribute(r.along, 1))
    g.setAttribute('aSide', new BufferAttribute(r.side, 1))
    g.setAttribute('aU', new BufferAttribute(r.u, 1))
    g.setIndex(new BufferAttribute(r.index, 1))
    g.computeBoundingSphere()
    return g
  }, [pass, field, scanLineAt])
  const ribbonMat = useMemo(
    () =>
      createRibbonMaterial(
        { uPx: rt.uniforms.uPx, uSunDir: rt.uniforms.uSunDir, uCloudMap: rt.uniforms.uCloudMap, uCloudOffset: rt.uniforms.uCloudOffset },
        look,
        // An image being exposed glows a little longer behind the line than a sweep that captured nothing.
        { speedKmS: pass.groundSpeedKmS > 0 ? pass.groundSpeedKmS : 6.8, freshPx: pass.verdict === 'imaged' ? 36 : 12 },
      ),
    [rt, look, pass.groundSpeedKmS, pass.verdict],
  )

  // ── hairlines
  const lines = useMemo(() => {
    const trailN = Math.ceil(TRAIL_MS / 1000 / TRAIL_STEP_S) + 2
    return {
      nadir: new Hairline({ capacity: 1, color: lin(palette.bone), opacity: 0.55, uPx: rt.uniforms.uPx }),
      view: new Hairline({ capacity: 1, color: look.color, opacity: 0.75, uPx: rt.uniforms.uPx }),
      trail: new Hairline({ capacity: trailN, color: look.color, opacity: 0.55, uPx: rt.uniforms.uPx }),
      trailPts: Array.from({ length: trailN + 1 }, () => new Vector3()),
      trailAlpha: new Float32Array(trailN + 1),
      ring: new Hairline({ capacity: RING_SAMPLES, color: lin(palette.bone), opacity: 0.16, uPx: rt.uniforms.uPx }),
      edges: new Hairline({ capacity: 2, color: look.color.clone(), opacity: 0.7, uPx: rt.uniforms.uPx }),
      edgePts: [new Vector3(), new Vector3(), new Vector3()],
    }
  }, [rt, look])

  // ── the full orbit, as an inertial ring: sampled positions rotated back by GMST at their own time (the mesh then
  // turns with -GMST every frame, like the stars), so it passes through the spacecraft at any sim time. ~220 SGP4 calls:
  // built in an idle slot after the pass opens (never on the flight's first frame), then it fades in with the scene.
  const ringReady = useRef(false)
  useEffect(() => {
    ringReady.current = false
    const build = () => {
      const periodMs = 2 * Math.PI * Math.sqrt((EARTH_RADIUS_KM + pass.altitudeKm) ** 3 / 398600.4418) * 1000
      const pts: Vector3[] = []
      const alpha = new Float32Array(RING_SAMPLES + 1)
      const Y = new Vector3(0, 1, 0)
      for (let i = 0; i <= RING_SAMPLES; i++) {
        const t = pass.tClosest + (i / RING_SAMPLES - 0.5) * periodMs
        const st = propagate(pass.norad, t)
        if (!st) continue
        pts.push(latLonToWorld(st.lat, st.lon, 1 + st.altKm / EARTH_RADIUS_KM).applyAxisAngle(Y, gmst(t)))
      }
      for (let i = 0; i < pts.length; i++) alpha[i] = i % 4 < 2 ? 1 : 0
      lines.ring.setPoints(pts, alpha)
      ringReady.current = pts.length > 2
    }
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void }
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(build, { timeout: 1200 })
      return () => w.cancelIdleCallback?.(id)
    }
    const id = window.setTimeout(build, 300)
    return () => window.clearTimeout(id)
  }, [pass, lines])
  const ringFade = useRef(0)

  // ── the spacecraft model and the light curtain
  const craft = useMemo(() => ({ geometry: buildSpacecraftGeometry(), material: createSpacecraftMaterial(rt.uniforms.uSunDir) }), [rt])
  const curtain = useMemo(() => {
    const n = CURTAIN_COLS + 2
    const g = new BufferGeometry()
    const pos = new BufferAttribute(new Float32Array(n * 3), 3)
    pos.setUsage(35048) // DynamicDrawUsage
    const v = new Float32Array(n)
    const sAttr = new Float32Array(n)
    for (let j = 0; j <= CURTAIN_COLS; j++) {
      v[j + 1] = 1
      sAttr[j + 1] = (j / CURTAIN_COLS) * 2 - 1
    }
    const index: number[] = []
    for (let j = 0; j < CURTAIN_COLS; j++) index.push(0, j + 1, j + 2)
    g.setAttribute('position', pos)
    g.setAttribute('aV', new BufferAttribute(v, 1))
    g.setAttribute('aS', new BufferAttribute(sAttr, 1))
    g.setIndex(index)
    return { geometry: g, material: createCurtainMaterial(look.color.clone()) }
  }, [look])

  useEffect(
    () => () => {
      ribbon.dispose()
      ribbonMat.dispose()
      lines.nadir.dispose()
      lines.view.dispose()
      lines.trail.dispose()
      lines.ring.dispose()
      lines.edges.dispose()
      craft.geometry.dispose()
      craft.material.dispose()
      curtain.geometry.dispose()
      curtain.material.dispose()
    },
    [ribbon, ribbonMat, lines, craft, curtain],
  )

  // Fade state. `time` is the sim time this scene draws: the clock while selected, frozen once it leaves (the
  // clock jumps back to live time on deselect; the outgoing pass must not visibly teleport while it fades).
  const fade = useRef(0)
  const anim = useRef({ active: true, from: 0, to: 1, start: performance.now(), dur: FADE_IN_MS, time: rt.simTime, gone: false })

  // Satellite state at the scene's time, shared by the model, callout and lines (computed once per frame): position,
  // ground point and the along-track direction (from a second sample 2 s later).
  const sat = useRef({ at: NaN, ok: false, pos: new Vector3(), ground: new Vector3(), ahead: new Vector3(), altKm: 0 })
  const sample = (ms: number) => {
    const s = sat.current
    if (s.at === ms) return s
    s.at = ms
    const st = propagate(pass.norad, ms)
    s.ok = !!st
    if (st) {
      latLonToWorld(st.lat, st.lon, 1 + st.altKm / EARTH_RADIUS_KM, s.pos)
      latLonToWorld(st.lat, st.lon, 1.0004, s.ground)
      s.altKm = st.altKm
      const b = propagate(pass.norad, ms + 2000)
      if (b) latLonToWorld(b.lat, b.lon, 1 + b.altKm / EARTH_RADIUS_KM, s.ahead)
      else s.ahead.copy(s.pos)
    }
    return s
  }
  const track: SatTrackFn = (out) => {
    const s = sample(anim.current.time)
    out.copy(s.pos)
    return s.ok ? s.altKm : null
  }

  const placePos = useMemo(() => (place ? latLonToWorld(place.lat, place.lon, 1.0004) : null), [place])
  const nadirMesh = useRef<Mesh>(null)
  const viewMesh = useRef<Mesh>(null)
  const trailMesh = useRef<Mesh>(null)
  const ringMesh = useRef<Mesh>(null)
  const craftMesh = useRef<Mesh>(null)
  const curtainMesh = useRef<Mesh>(null)
  const edgesMesh = useRef<Mesh>(null)
  const trailCache = useRef({ t0: NaN, pts: [] as Vector3[] })
  const twoPts = useMemo(() => [new Vector3(), new Vector3()], [])
  const tmp = useMemo(() => ({ x: new Vector3(), y: new Vector3(), z: new Vector3(), m: new Matrix4(), g: new Vector3(), right: new Vector3(), q: new Vector3() }), [])
  const live = useRef(0)
  const wall = useRef(0)

  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 0.1)
    const perfNow = performance.now()
    const a = anim.current
    // ── selected or leaving (read every frame, so the frame of the deselect already freezes time)
    const active = useApp.getState().selectedPassId === pass.id
    if (active !== a.active) {
      a.active = active
      a.from = fade.current
      a.to = active ? 1 : 0
      a.start = perfNow
      a.dur = (active ? FADE_IN_MS : FADE_OUT_MS) * (rt.reducedMotion ? 0.4 : 1)
    }
    if (active) a.time = rt.simTime
    const u01 = Math.min(1, (perfNow - a.start) / Math.max(1, a.dur))
    fade.current = a.from + (a.to - a.from) * (active ? easeOut(u01) : easeInOut(u01))
    if (!active && u01 >= 1 && !a.gone) {
      a.gone = true
      onGone()
    }
    const f = fade.current

    const now = a.time
    const u = ribbonMat.uniforms
    u.uNow.value = (now - pass.tClosest) / 1000
    u.uOpacity.value = f
    u.uHasClouds.value = rt.uniforms.uCloudMap.value ? 1 : 0
    const db = state.gl.getDrawingBufferSize(tmpRes)
    lines.nadir.setResolution(db.x, db.y)
    lines.view.setResolution(db.x, db.y)
    lines.trail.setResolution(db.x, db.y)
    lines.nadir.setFade(f)
    lines.view.setFade(f)
    lines.trail.setFade(f)

    const s = sample(now)
    const st = useApp.getState()
    const acq = rt.acq
    const isAcq = acq.passId === pass.id

    // ── the sequence is LIVE while the replay runs (or a live sequence is armed). For an imaged pass the curtain and
    // the scan line's glow bow out shortly after the capture: the developed image speaks.
    let liveWant = active && (st.timeMode === 'replay' || (isAcq && acq.armed)) ? 1 : 0
    if (isAcq && acq.imaged && acq.capturedAt > acq.armedAt && perfNow - acq.capturedAt > CURTAIN_AFTER_CAPTURE_MS) liveWant = 0
    const tau = rt.reducedMotion ? 0.05 : 0.16
    live.current += (liveWant - live.current) * damp(dt, tau)
    // Below the spacecraft the curtain is a wall on the scan line: it leaves before it could reach the camera.
    let wallWant = 1
    if (s.ok && rt.camera.altitudeKm < s.altKm * 1.15) {
      const cam = state.camera.position
      const cl = cam.length()
      const sl = s.pos.length()
      const t0 = acq.t0
      const sepKm =
        isAcq && cl > 0 && sl > 0
          ? Math.abs(Math.asin(Math.max(-1, Math.min(1, s.pos.dot(t0) / sl))) - Math.asin(Math.max(-1, Math.min(1, cam.dot(t0) / cl)))) * EARTH_RADIUS_KM
          : 0
      const x = Math.max(0, Math.min(1, (sepKm - WALL_FADE_KM.near) / (WALL_FADE_KM.far - WALL_FADE_KM.near)))
      wallWant = x * x * (3 - 2 * x)
    }
    // A geostationary scan: the curtain belongs to the opening shot from behind the spacecraft, and bows out as the
    // camera leaves it for the place (the scan line on the surface carries on).
    if (pass.geostationary) wallWant = 1 - geoDiveAt(now, pass.tClosest)
    wall.current += (wallWant - wall.current) * damp(dt, tau)
    const L = live.current * wall.current * f
    u.uRate.value = isAcq ? acq.rate : st.timeMode === 'replay' ? st.replayRate : 0
    u.uLive.value = live.current

    // Nadir line (glyph objects only: the curtain says it for imagers).
    if (nadirMesh.current) nadirMesh.current.visible = !curtainOn && s.ok && f > 0.004
    if (s.ok && !curtainOn) {
      twoPts[0].copy(s.pos)
      twoPts[1].copy(s.ground)
      lines.nadir.setPoints(twoPts)
    }

    // ── spacecraft: along-track X, zenith Z, constant on-screen size, sunlit unless in Earth's shadow.
    const cm = craftMesh.current
    if (cm) {
      cm.visible = imager && s.ok && f > 0.004
      if (cm.visible) {
        const { x, y, z } = tmp
        z.copy(s.pos).normalize()
        x.copy(s.ahead).sub(s.pos)
        x.addScaledVector(z, -x.dot(z))
        // A geostationary spacecraft barely moves over the ground: its drift is no heading to hang a model on. North.
        if (pass.geostationary || x.lengthSq() < 1e-14) x.set(0, 1, 0).addScaledVector(z, -z.y)
        x.normalize()
        y.crossVectors(z, x)
        tmp.m.makeBasis(x, y, z)
        cm.quaternion.setFromRotationMatrix(tmp.m)
        cm.position.copy(s.pos)
        const cam = state.camera as PerspectiveCamera
        const dist = cam.position.distanceTo(s.pos)
        const worldPerPx = (2 * dist * Math.tan((cam.fov * DEG) / 2)) / Math.max(1, state.size.height)
        cm.scale.setScalar(((rt.tier.mobile ? CRAFT_PX.phone : CRAFT_PX.desktop) * worldPerPx) / SPACECRAFT_SPAN)
        // Earth's shadow: a cylinder of radius 1 behind the planet, with a soft penumbra.
        const sd = rt.sunDir
        const along = s.pos.dot(sd)
        const off = tmp.q.copy(s.pos).addScaledVector(sd, -along).length()
        const lit = along >= 0 ? 1 : Math.min(1, Math.max(0, (off - 0.985) / 0.03))
        const cu = craft.material.uniforms
        cu.uLit.value = lit
        cu.uOpacity.value = f
      }
    }

    // ── the light curtain: apex at the spacecraft, foot across the swath through the sub-satellite point.
    const curt = curtainMesh.current
    const curtainVisible = curtainOn && s.ok && L > 0.004
    if (curt) curt.visible = curtainVisible
    if (edgesMesh.current) edgesMesh.current.visible = curtainVisible
    if (curtainVisible) {
      const { g, right, q } = tmp
      const tdir = tmp.x
      const attr = curtain.geometry.attributes.position as BufferAttribute
      const arr = attr.array as Float32Array
      arr[0] = s.pos.x
      arr[1] = s.pos.y
      arr[2] = s.pos.z
      const foot = (j: number) => {
        arr[(j + 1) * 3] = q.x
        arr[(j + 1) * 3 + 1] = q.y
        arr[(j + 1) * 3 + 2] = q.z
        if (j === 0) lines.edgePts[0].copy(q)
        if (j === CURTAIN_COLS) lines.edgePts[2].copy(q)
      }
      if (scanLineAt) {
        // The foot is the scan line where it is now, from one end of the disc to the other: the curtain is the very
        // plane the mirror sweeps, so from behind the spacecraft the line runs straight across the Earth.
        const line = scanLineAt(now)
        for (let j = 0; j <= CURTAIN_COLS; j++) {
          const p = line.at(((j / CURTAIN_COLS) * 2 - 1) * line.reach)
          latLonToWorld(p.lat, p.lon, CURTAIN_LIFT, q)
          foot(j)
        }
      } else {
        const delta = Math.max(20, field.halfWidthKm(s.altKm)) / EARTH_RADIUS_KM
        g.copy(s.pos).normalize()
        tdir.copy(s.ahead).sub(s.pos)
        tdir.addScaledVector(g, -tdir.dot(g)).normalize()
        right.crossVectors(tdir, g).normalize()
        for (let j = 0; j <= CURTAIN_COLS; j++) {
          const a = ((j / CURTAIN_COLS) * 2 - 1) * delta
          q.copy(g).multiplyScalar(Math.cos(a)).addScaledVector(right, Math.sin(a)).multiplyScalar(CURTAIN_LIFT)
          foot(j)
        }
      }
      attr.needsUpdate = true
      const cu = curtain.material.uniforms
      cu.uOpacity.value = L * (field.mode === 'regard' ? 0.5 : 1)
      cu.uTime.value = perfNow / 1000
      lines.edgePts[1].copy(s.pos)
      lines.edges.setPoints(lines.edgePts, EDGE_ALPHA)
      lines.edges.setResolution(tmpRes.x, tmpRes.y)
      lines.edges.setFade(L)
    }

    // ── the full orbit ring (inertial: turns with GMST, as the stars do)
    if (ringReady.current) ringFade.current = Math.min(1, ringFade.current + dt / 0.6)
    if (ringMesh.current) {
      ringMesh.current.visible = ringReady.current && f * ringFade.current > 0.004
      ringMesh.current.rotation.y = -rt.gmst
    }
    lines.ring.setResolution(tmpRes.x, tmpRes.y)
    lines.ring.setFade(f * ringFade.current)

    // View line to the place, for pointable imagers while the place is in their field of regard.
    const viewOn = pointable && s.ok && !!placePos && now >= pass.tStart && now <= pass.tEnd && f > 0.004
    if (viewMesh.current) viewMesh.current.visible = viewOn
    if (viewOn && placePos) {
      twoPts[0].copy(s.pos)
      twoPts[1].copy(placePos)
      lines.view.setPoints(twoPts, VIEW_ALPHA)
    }

    // Orbit trail: SGP4 samples on a fixed time grid (cached), plus the exact head.
    if (s.ok) {
      const t0 = Math.floor((now - TRAIL_MS) / (TRAIL_STEP_S * 1000)) * TRAIL_STEP_S * 1000
      const cache = trailCache.current
      if (cache.t0 !== t0) {
        cache.t0 = t0
        cache.pts = groundTrack(pass.norad, t0 + TRAIL_STEP_S * 1000, now, TRAIL_STEP_S).map((p) =>
          latLonToWorld(p.lat, p.lon, 1 + p.altKm / EARTH_RADIUS_KM),
        )
      }
      const pts = lines.trailPts
      const alpha = lines.trailAlpha
      let n = 0
      for (const p of cache.pts) if (n < pts.length - 1) pts[n++].copy(p)
      pts[n++].copy(s.pos)
      for (let i = 0; i < n; i++) {
        const k = n > 1 ? i / (n - 1) : 1
        alpha[i] = k * k * 0.9
      }
      lines.trail.setPoints(pts, alpha, n)
    }
    if (trailMesh.current) trailMesh.current.visible = s.ok && f > 0.004

  }, FRAME.scene)

  useSatAnchor(passAnchorId(pass.id), track)
  return (
    <>
      <mesh geometry={ribbon} material={ribbonMat} renderOrder={3} />
      <mesh ref={ringMesh} geometry={lines.ring.geometry} material={lines.ring.material} frustumCulled={false} renderOrder={4} />
      <mesh ref={trailMesh} geometry={lines.trail.geometry} material={lines.trail.material} frustumCulled={false} renderOrder={4} />
      <mesh ref={nadirMesh} geometry={lines.nadir.geometry} material={lines.nadir.material} frustumCulled={false} renderOrder={4} />
      <mesh ref={viewMesh} geometry={lines.view.geometry} material={lines.view.material} frustumCulled={false} renderOrder={4} />
      <mesh ref={curtainMesh} geometry={curtain.geometry} material={curtain.material} frustumCulled={false} renderOrder={4} visible={false} />
      <mesh ref={edgesMesh} geometry={lines.edges.geometry} material={lines.edges.material} frustumCulled={false} renderOrder={4} visible={false} />
      {imager ? (
        <mesh ref={craftMesh} geometry={craft.geometry} material={craft.material} frustumCulled={false} renderOrder={6} visible={false} />
      ) : (
        <SatGlyph category={category} imaged={pass.verdict === 'imaged'} tone={look.tone} track={track} fade={fade} />
      )}
    </>
  )
}

const tmpRes = new Vector2()
/** Curtain edge hairlines: bright at the ground, fading toward the spacecraft. */
const EDGE_ALPHA = [0.85, 0.12, 0.85]

/** The view line fades toward the ground so it reads as a line of sight, not a tether. */
const VIEW_ALPHA = [0.9, 0.35]
