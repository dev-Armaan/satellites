/**
 * The globe owns the frame loop. Every frame, before anything else (FRAME.clock):
 *  - advance simTime per store.timeMode (see clock.ts), keep it in the runtime and in sceneClock (per-frame time
 *    for UI that moves every frame), and write it back to the store at ~10 Hz so React consumers stay calm;
 *  - hold a replay at its start while the camera is still flying, so the sweep begins on arrival (M05);
 *  - compute the sun direction and GMST for that instant (shared uniforms). Across a time jump (a pass selected
 *    or deselected: days of sim time in one frame) the sun GLIDES from where it was, in step with the camera
 *    flight (or over 900 ms without one), so the terminator sweeps instead of the planet flipping night↔day (M04);
 *  - drift the clouds (wall time, very slowly; frozen under prefers-reduced-motion);
 *  - track the app phase and when it was entered (texture / DPR gating), when the replay sweep last started (no
 *    texture uploads during it), and publish the device pixel ratio;
 *  - run the selected pass's acquisition sequence (acquisition.ts, rt.acq): a fresh replay arms it (rewinding the
 *    seeded start when the approach would be too short to read), the replay slows around closest approach on an
 *    imaged pass so the image paints over ~1.6 s, and the crossing of closest approach is the capture moment.
 */
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { Vector3 } from 'three'
import { gmst, sunDirectionWorld } from '@/lib/geo'
import { easeInOut } from '@/lib/ease'
import { sceneClock } from '@/state/sceneClock'
import { selectSelectedPass, useApp } from '@/state/store'
import type { Pass, Report } from '@/types'
import { approachStart, captureOf, DECAL_WAIT_MS, decalSpecFor, imageFocus, scanAt, scanFrame, slowFactor, slowWindowS, type AcqState } from './acquisition'
import { createClock, stepClock } from './clock'
import { FRAME, useRuntime } from './runtime'
import { sweptAcross } from './swath'

/** One full cloud-layer drift every 8 hours of wall time: perceptible only if you stare. */
const CLOUD_DRIFT_PER_S = 1 / (8 * 3600)
/** A sim-time step larger than this in one frame is a jump, not playback. */
export const TIME_JUMP_MS = 5 * 60_000
/** Sun glide across a jump when no camera flight carries it. */
const SUN_GLIDE_MS = 900

/** Spherical interpolation between unit vectors (falls back to a normalised lerp when nearly parallel). */
export function slerpUnit(a: Vector3, b: Vector3, t: number, out: Vector3): Vector3 {
  const dot = Math.max(-1, Math.min(1, a.dot(b)))
  const theta = Math.acos(dot)
  if (theta < 1e-5) return out.copy(a).lerp(b, t).normalize()
  const s = Math.sin(theta)
  const wa = Math.sin((1 - t) * theta) / s
  const wb = Math.sin(t * theta) / s
  return out.set(a.x * wa + b.x * wb, a.y * wa + b.y * wb, a.z * wa + b.z * wb).normalize()
}

export function Clock() {
  const rt = useRuntime()
  const clock = useRef(createClock(useApp.getState().simTime, useApp.getState().timeMode, Date.now()))
  const replay = useRef({ mode: useApp.getState().timeMode, hold: false })
  const glide = useRef({
    active: false,
    from: new Vector3(),
    to: new Vector3(),
    /** 'pending' until the frame after the jump tells us whether a flight carries it */
    mode: 'pending' as 'pending' | 'flight' | 'wall',
    flightId: -1,
    /** Flight progress when the glide attached to it (a flight may already be under way) */
    p0: 0,
    k: 0,
    wallFrom: 0,
    wallAt: 0,
  })

  // The UI hold standing at the instant the phase changes belongs to the previous phase's UI (exact, not a frame late).
  useEffect(() => {
    rt.phaseBusyFloor = useApp.getState().motionBusyUntil
    return useApp.subscribe((s, prev) => {
      if (s.phase !== prev.phase) rt.phaseBusyFloor = prev.motionBusyUntil
    })
  }, [rt])

  useFrame((state, dt) => {
    const st = useApp.getState()
    const now = Date.now()
    const perfNow = performance.now()

    if (st.phase !== rt.phase) {
      rt.phase = st.phase
      rt.phaseEnteredAt = perfNow
    }

    // Replay waits for the camera: the sweep starts on arrival, not mid-flight; and, briefly, for the pass's image.
    const waitImage =
      rt.acq.armed && rt.acq.imaged && !rt.acq.decalReady && perfNow - rt.camera.arrivedAt < DECAL_WAIT_MS
    let hold = st.timeMode === 'replay' && (rt.camera.flying || waitImage)
    // ── acquisition sequence: which pass, and whether this frame starts a fresh one.
    const acq = rt.acq
    const pass = st.report && st.selectedPassId ? selectSelectedPass(st) : undefined
    const passChanged = (pass?.id ?? '') !== acq.passId
    if (passChanged) resetAcq(acq, pass, st.report, rt.tier.mobile)
    const c = clock.current
    const modeEntered = st.timeMode === 'replay' && c.mode !== 'replay'
    const seeked = st.simTime !== c.lastWritten
    let storeSimTime = st.simTime
    // A fresh replay: entering replay or switching pass with a seeded time, or a re-seed while the clock still waits
    // for the camera (the sequence has not started yet).
    const fresh = modeEntered || passChanged || (acq.armed && hold)
    if (pass && st.timeMode === 'replay' && seeked && fresh && !rt.reducedMotion && st.simTime < acq.tc) {
      // A fresh replay of this pass: arm the sequence, and give the approach room to read.
      storeSimTime = approachStart(st.simTime, acq.tc, acq.halfKm, acq.speedKmS, st.replayRate)
      if (import.meta.env.DEV || import.meta.env.MODE === 'inspect') {
        const w = window as unknown as { __acqLog?: unknown[] }
        ;(w.__acqLog ??= []).push({ t: Math.round(perfNow), arm: pass.id, seeded: (st.simTime - acq.tc) / 1000, start: (storeSimTime - acq.tc) / 1000, modeEntered, passChanged })
      }
      if (storeSimTime !== st.simTime) c.lastWriteAt = -Infinity // the rewound start goes back to the store this frame
      acq.armed = true
      acq.armedAt = perfNow
      hold = true // the camera starts its flight this frame: the approach starts on its arrival, from the very start
      acq.capturedAt = -Infinity
      acq.full = 0
    } else if (acq.armed && (st.timeMode === 'live' || (st.timeMode === 'scrub' && seeked))) {
      acq.armed = false // the user took the clock: the image settles, the camera rests
    }
    const slow =
      pass && st.timeMode === 'replay' && acq.halfKm > 0 && !rt.reducedMotion
        ? slowFactor(c.simTime, acq.tc, acq.halfKm, acq.speedKmS, st.replayRate)
        : 1
    // The sweep (re)starts when replay begins, and again when a hold releases on arrival (a pass picked mid-replay).
    const r = replay.current
    if (st.timeMode === 'replay' && (r.mode !== 'replay' || (r.hold && !hold))) rt.replayStartedAt = perfNow
    r.mode = st.timeMode
    r.hold = hold
    const { write } = stepClock(c, {
      mode: st.timeMode,
      storeSimTime,
      replayRate: st.replayRate,
      dt: hold ? 0 : dt * slow,
      now,
    })
    rt.prevSimTime = rt.simTime
    rt.simTime = c.simTime
    sceneClock.simTime = rt.simTime
    sceneClock.mode = st.timeMode
    if (write !== undefined) st.setSimTime(write)

    // The capture moment: playback carries sim time across closest approach.
    if (pass && st.timeMode === 'replay' && sweptAcross(rt.prevSimTime, rt.simTime, acq.tc)) {
      acq.capturedAt = perfNow
      acq.armed = false
      if (acq.imaged) rt.flashAt = perfNow
    }
    acq.rate = st.timeMode === 'replay' && !hold ? st.replayRate * slow : 0
    acq.scanS = scanAt(rt.simTime, acq.tc, acq.speedKmS)
    // Development: sweep-driven while the sequence is live (and until the scan line has crossed the whole image
    // after the capture), otherwise the image is simply there.
    const painting =
      acq.armed ||
      (st.timeMode === 'replay' && acq.capturedAt > acq.armedAt && acq.armedAt > -Infinity && rt.simTime < acq.tc + slowWindowS(acq.halfKm, acq.speedKmS) * 1000)
    acq.full = painting ? 0 : Math.min(1, acq.full + Math.min(dt, 0.1) / 0.4)

    // ── sun, with a glide across time jumps
    const g = glide.current
    const jumped = Math.abs(rt.simTime - rt.prevSimTime) > TIME_JUMP_MS
    if (jumped) {
      rt.timeJump.id++
      rt.timeJump.at = perfNow
      rt.timeJump.fromSimTime = rt.prevSimTime
    }
    if (jumped && !rt.reducedMotion) {
      // Start from wherever the sun is drawn now (possibly mid-glide).
      g.from.copy(rt.sunDir)
      g.active = true
      g.mode = 'pending'
      g.k = 0
    } else if (jumped) {
      g.active = false // reduced motion: keep the cut (the camera's 300 ms ink fade covers it)
    }
    sunDirectionWorld(rt.simTime, g.to)
    if (g.active) {
      if (g.mode === 'pending' && !jumped) {
        // The camera ran after us on the jump frame: a flight that started then carries the glide.
        if (rt.camera.flying) {
          g.mode = 'flight'
          g.flightId = rt.camera.flightId
          g.p0 = Math.min(0.95, rt.camera.progress)
        } else {
          g.mode = 'wall'
          g.wallFrom = 0
          g.wallAt = perfNow
        }
      }
      if (g.mode === 'flight' && (!rt.camera.flying || rt.camera.flightId !== g.flightId)) {
        // Interrupted (gesture) or retargeted: finish on wall time from where we are.
        g.mode = 'wall'
        g.wallFrom = g.k
        g.wallAt = perfNow
      }
      if (g.mode === 'flight') g.k = Math.max(g.k, (rt.camera.progress - g.p0) / (1 - g.p0))
      else if (g.mode === 'wall') g.k = g.wallFrom + (1 - g.wallFrom) * easeInOut(Math.min(1, (perfNow - g.wallAt) / SUN_GLIDE_MS))
      if (g.k >= 1) {
        g.active = false
        rt.sunDir.copy(g.to)
      } else slerpUnit(g.from, g.to, g.k, rt.sunDir)
    } else {
      rt.sunDir.copy(g.to)
    }

    rt.gmst = gmst(rt.simTime)
    // Sampling at uv + offset with a decreasing offset moves the weather eastward, like the westerlies.
    if (!rt.reducedMotion)
      rt.uniforms.uCloudOffset.value = (rt.uniforms.uCloudOffset.value + 1 - Math.min(dt, 0.1) * CLOUD_DRIFT_PER_S) % 1
    rt.uniforms.uPx.value = state.gl.getPixelRatio()
  }, FRAME.clock)

  return null
}

/** A new selected pass (or none): the sequence starts settled; a fresh replay arms it. */
function resetAcq(acq: AcqState, pass: Pass | undefined, report: Report | undefined, mobile: boolean) {
  acq.passId = pass?.id ?? ''
  acq.armed = false
  acq.armedAt = -Infinity
  acq.capturedAt = -Infinity
  acq.full = 1
  if (!pass) {
    acq.imaged = false
    acq.halfKm = 0
    return
  }
  acq.tc = pass.tClosest
  acq.speedKmS = pass.groundSpeedKmS > 0 ? pass.groundSpeedKmS : 6.8
  const cap = pass.verdict === 'imaged' ? captureOf(report, pass) : undefined
  const spec = cap ? decalSpecFor(cap.collection, mobile) : null
  acq.imaged = !!spec
  acq.halfKm = spec ? spec.halfSizeKm : 0
  const place = report?.place
  const focus = place ? imageFocus(place, acq.halfKm, cap?.footprint) : undefined
  acq.focusOk = !!focus
  acq.focusLat = focus?.lat ?? 0
  acq.focusLon = focus?.lon ?? 0
  scanFrame(pass, acq.p0, acq.t0, place)
}
