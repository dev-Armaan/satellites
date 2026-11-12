/**
 * Surface overlays: the swath ribbon (with the pass's ground track as its centre line) and the place reticle,
 * plus screen-space hairlines (nadir line, view line, orbit trail). Strokes are measured in screen pixels with
 * fwidth(), so they stay 1 CSS px wide at any zoom and any obliquity.
 */
import { CLOUD_COVER, COMMON, glsl, OUTPUT } from './chunks'

// ───────────────────────────── swath ribbon ─────────────────────────────

export const ribbonVertex = glsl`
  attribute float aAlong;   // s relative to the pass's tClosest
  attribute float aSide;    // −1 left edge … 0 ground track … +1 right edge
  attribute float aU;       // 0 … 1 along the ribbon
  varying float vAlong;
  varying float vSide;
  varying float vU;
  varying vec3 vPos;        // world (the ribbon mesh has an identity transform; it lies on the surface)
  void main() {
    vAlong = aAlong;
    vSide = aSide;
    vU = aU;
    vPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * viewMatrix * vec4(vPos, 1.0);
  }
`

/**
 * The swath as an OUTLINE with a scan line (owner request C: "not an orange slab"):
 *  - Ahead of the front only the predicted edges show, as faint bone hairlines.
 *  - The front is the SCAN LINE, where the light curtain meets the Earth: a bright signal core (~1.5 px, above the
 *    bloom threshold so it glows a touch) with a short soft halo, mostly trailing; dimmer when no replay is running.
 *  - Right behind it a FRESH-EXPOSURE glow: uFill decaying over ~400 ms of real time (uRate converts sim seconds),
 *    so the ground looks freshly exposed and settles; no persistent fill (the developed image, or nothing, is what
 *    remains). Behind the front the edges turn the verdict colour: the swept corridor reads as a hairline outline.
 *  - Everything thins over cloud and unlit ground and stays modest, so bright cloud never turns salmon.
 * uKind: 0 = fixed swath (solid edges), 1 = field of regard (dashed edges), 2 = track only.
 * The mesh is clipped to ±700 km along-track around the place (swath.ts clipAlongTrack); vU fades its ends.
 * A geostationary scan's mesh is the line itself, limb to limb (swath.ts buildScanRibbon): no edges, no track, and
 * uEndFade thins it toward the limbs.
 */
export const ribbonFragment = glsl`
  ${COMMON}
  ${CLOUD_COVER}
  uniform float uNow;         // sim time − tClosest, s
  uniform float uPx;
  uniform int uKind;
  uniform vec3 uColor;        // the verdict's colour (signal / bone / ice)
  uniform vec3 uEdgeColor;    // bone: predicted (unswept) edges
  uniform vec3 uFrontColor;   // the scan line's core (HDR signal)
  uniform float uFill;
  uniform float uTrack;     // 1 = draw the ground track line, 0 = not (a geostationary scan has none)
  uniform float uEndFade;   // 1 = fade the marks out toward |side| = 0.45 (a geostationary scan line, which ends where the disc does), 0 = not
  uniform float uOpacity;
  uniform vec3 uSunDir;
  uniform sampler2D uClouds;
  uniform float uHasClouds;
  uniform float uCloudOffset;
  uniform float uSpeedKmS;    // ground speed, km/s
  uniform float uGlowPx;      // trailing halo length, CSS px
  uniform float uRate;        // sim s per real s right now (0 = not playing)
  uniform float uLive;        // 0..1 the replay / acquisition is running
  uniform float uFreshPx;     // the fresh-exposure glow's screen-space reach (shorter when no image exists)
  varying float vAlong;
  varying float vSide;
  varying float vU;
  varying vec3 vPos;

  float line(float d, float fw, float widthPx) {
    // d in the same units as fw (per-pixel derivative); widthPx in device px
    float px = abs(d) / max(fw, 1e-6);
    return 1.0 - smoothstep(widthPx * 0.5 - 0.5, widthPx * 0.5 + 0.5, px);
  }

  /** Straight-alpha "over". */
  vec4 over(vec4 src, vec4 dst) {
    float a = src.a + dst.a * (1.0 - src.a);
    vec3 c = a > 1e-5 ? (src.rgb * src.a + dst.rgb * dst.a * (1.0 - src.a)) / a : src.rgb;
    return vec4(c, a);
  }

  void main() {
    float fwA = fwidth(vAlong);
    float fwS = fwidth(vSide);
    float lead = uNow - vAlong;                  // > 0: swept (s behind the front)
    float swept = smoothstep(-fwA, fwA, lead);
    float ends = smoothstep(0.0, 0.07, vU) * smoothstep(1.0, 0.93, vU);

    float w = uPx;                                // 1 CSS px
    float edgeD = 1.0 - abs(vSide);
    float edge = line(edgeD, fwS, w) * step(0.5, abs(vSide));
    float track = line(vSide, fwS, w) * uTrack;

    // Dashes for the field of regard: ~6 px on, 5 px off along-track, in screen space.
    float dashPx = vAlong / max(fwA, 1e-6) / max(uPx, 1.0);
    float dash = step(0.45, fract(dashPx / 11.0));

    // Light thins the marks over unlit ground and over cloud.
    float daylight = smoothstep(-0.08, 0.2, dot(normalize(vPos), normalize(uSunDir)));
    float cover = 0.0;
    if (uHasClouds > 0.5) {
      vec3 n = normalize(vPos);
      vec2 uv = vec2(0.5 + atan(-n.z, n.x) / TWO_PI + uCloudOffset, 0.5 + asin(clamp(n.y, -1.0, 1.0)) / PI);
      // A fixed, blurred LOD: no derivative seam at the antimeridian, and modulation wants soft cloud anyway.
      cover = cloudCover(textureLod(uClouds, uv, 3.0).r);
    }

    vec4 acc = vec4(uColor, 0.0);
    if (uKind == 2) {
      acc = vec4(uColor, track * mix(0.3, 0.85, swept));
    } else {
      // ── fresh-exposure glow right behind the front (real-time decay; none when not playing), never wider than a
      // few dozen pixels however close the camera is (the developing image carries the exposure there)
      float realBehind = uRate > 0.001 ? max(lead, 0.0) / uRate : 1e3;
      float leadPx0 = max(lead, 0.0) / max(fwA, 1e-6) / max(uPx, 1.0);
      float fresh = exp(-realBehind / 0.16) * exp(-leadPx0 / max(uFreshPx, 1.0)) * swept;
      float fillA = uFill * 2.2 * fresh * mix(0.5, 1.0, daylight) * (1.0 - 0.6 * cover);
      acc = vec4(uColor, min(1.0, fillA));

      // ── edges: faint bone ahead of the front, the verdict colour behind it (dashed for a field of regard)
      float edgeOn = uKind == 1 ? edge * dash : edge;
      vec3 edgeCol = mix(uEdgeColor, uColor, swept);
      acc = over(vec4(edgeCol, edgeOn * mix(0.16, 0.6, swept)), acc);
      // The ground track is quieter than the edges: the outline already implies it.
      float trackA = track * 0.22 * swept * (uKind == 1 ? 1.0 : dash);
      acc = over(vec4(uColor, trackA), acc);

      // ── the scan line: a bright core and a short soft halo, mostly trailing
      float leadPx = lead / max(fwA, 1e-6) / max(uPx, 1.0);
      float core = line(lead, fwA, w * 1.5);
      float halo = leadPx > 0.0 ? exp(-leadPx / max(uGlowPx, 1.0)) : exp(leadPx / 1.5);
      // Parked (no replay running) the line only marks where the spacecraft is, quietly, without its glow.
      float frontA = max(core, halo * 0.32 * uLive) * mix(0.14, 1.0, uLive) * mix(0.75, 1.0, daylight);
      vec3 frontCol = mix(uColor, uFrontColor, core);
      acc = over(vec4(frontCol, min(1.0, frontA)), acc);
    }
    // A scan line the width of the disc thins out over its last few hundred km: its end is the limb the spacecraft
    // sees, which from a camera down at the place would otherwise be a hard cut across the ground.
    float sides = 1.0 - uEndFade * smoothstep(0.42, 0.45, abs(vSide));
    float a = acc.a * ends * sides * uOpacity;
    if (a < 0.003) discard;
    gl_FragColor = vec4(acc.rgb, a);
    ${OUTPUT}
  }
`

// ───────────────────────────── place reticle ─────────────────────────────

/**
 * A flat quad in the tangent plane at the place, scaled every frame to a constant on-screen size. The
 * fragment shader draws in "reticle pixels" (quad uv × uSizePx): a 1 px ring, four ticks, a centre dot, an
 * ink halo under everything, and the lock-in / flash animations.
 */
export const reticleVertex = glsl`
  varying vec2 vP;
  uniform float uSizePx;
  void main() {
    vP = (uv - 0.5) * uSizePx;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const reticleFragment = glsl`
  ${COMMON}
  uniform float uPx;
  uniform float uRing;       // ring radius, CSS px (animates 2× → 1× on lock-in)
  uniform float uRingBase;   // ring radius once locked, CSS px
  uniform float uLock;       // 0 → 1 as the reticle locks in
  uniform float uFlash;      // 1 → 0 after the swath crosses the place
  uniform float uPulse;      // 0 → 1 linear time of the capture shockwave (0 = none)
  uniform vec3 uColor;
  uniform vec3 uInk;
  uniform float uOpacity;
  varying vec2 vP;

  float strokePx(float d, float fw, float w) {
    float px = abs(d) / max(fw, 1e-6);
    return 1.0 - smoothstep(w * 0.5 - 0.5, w * 0.5 + 0.5, px);
  }

  void main() {
    vec2 p = vP;
    float r = length(p);
    float fw = fwidth(r);          // reticle px per device px
    float w = uPx;
    float R = uRing;

    float ring = strokePx(r - R, fw, w);
    // Ticks: 4 short radial strokes outside the ring (N/E/S/W), fixed length so the lock-in reads as the ring
    // closing onto the crosshair.
    float tIn = uRingBase + 4.0;
    float tOut = tIn + 9.0;
    vec2 ap = abs(p);
    float fwx = fwidth(p.x);
    float fwy = fwidth(p.y);
    float tickH = strokePx(p.y, fwy, w) * step(tIn, ap.x) * step(ap.x, tOut);
    float tickV = strokePx(p.x, fwx, w) * step(tIn, ap.y) * step(ap.y, tOut);
    float ticks = max(tickH, tickV) * uLock;
    float dotR = 2.0;
    float dotC = 1.0 - smoothstep(dotR - 0.5 * fw, dotR + 0.5 * fw, r);

    float mark = max(max(ring, ticks), dotC);
    // Ink halo for legibility over bright cloud.
    float halo = max(strokePx(r - R, fw, w * 4.5), max(dotC, 1.0 - smoothstep(dotR + 1.5, dotR + 3.5, r)));
    halo = max(halo, max(tickH, tickV) * uLock);

    // The capture shockwave: one ring runs out to ~6.5× the locked radius (ease-out), thinning and fading, with a
    // faint wash inside its front.
    float k = 1.0 - pow(1.0 - uPulse, 3.0);
    float pulseR = uRingBase * (1.0 + 6.0 * k);
    float fadeP = pow(1.0 - uPulse, 1.6) * step(0.001, uPulse);
    float pulse = strokePx(r - pulseR, fw, w * mix(2.0, 1.0, uPulse)) * fadeP;
    float wash = smoothstep(pulseR - 22.0, pulseR, r) * (1.0 - smoothstep(pulseR, pulseR + 1.0, r)) * 0.22 * fadeP;
    pulse = max(pulse, wash);

    // The halo matters most when the reticle sits inside a signal swath: ink keeps the ring legible.
    float a = max(mark, halo * 0.55) * uOpacity;
    vec3 col = mix(uInk, uColor * (1.0 + 0.8 * uFlash), mark);
    a = max(a, pulse * uOpacity);
    col = mix(col, uColor * 1.6, pulse);
    if (a < 0.003) discard;
    gl_FragColor = vec4(col, a);
    ${OUTPUT}
  }
`

// ───────────────────────────── hairlines ─────────────────────────────

/**
 * Screen-space lines as instanced quads (one instance per segment). Width is in CSS px × uPx. Each segment
 * carries an alpha at both ends, so trails can fade. Endpoints behind the near plane are clipped to it.
 */
export const hairlineVertex = glsl`
  attribute vec3 aStart;
  attribute vec3 aEnd;
  attribute vec2 aAlpha;     // alpha at start, end
  uniform vec2 uResolution;  // drawing buffer, device px
  uniform float uWidth;      // CSS px
  uniform float uPx;
  varying float vAlpha;
  varying float vSide;
  varying float vHalf;

  void main() {
    vec4 s = modelViewMatrix * vec4(aStart, 1.0);
    vec4 e = modelViewMatrix * vec4(aEnd, 1.0);
    // Clip the segment against the near plane (view space z < 0 is in front of the camera).
    float nearZ = projectionMatrix[3][2] / (projectionMatrix[2][2] - 1.0);
    if (s.z > -nearZ && e.z > -nearZ) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
    if (s.z > -nearZ) s = mix(s, e, (s.z + nearZ) / (s.z - e.z));
    if (e.z > -nearZ) e = mix(e, s, (e.z + nearZ) / (e.z - s.z));
    vec4 cs = projectionMatrix * s;
    vec4 ce = projectionMatrix * e;
    vec2 ss = cs.xy / cs.w * uResolution * 0.5;
    vec2 se = ce.xy / ce.w * uResolution * 0.5;
    vec2 dir = se - ss;
    float len = length(dir);
    dir = len > 1e-4 ? dir / len : vec2(1.0, 0.0);
    vec2 nrm = vec2(-dir.y, dir.x);
    float hw = uWidth * uPx * 0.5 + 1.0;            // +1 px for anti-aliasing
    vec4 c = position.x < 0.5 ? cs : ce;
    // Extend half a pixel along the segment so joints overlap instead of gapping.
    vec2 along = dir * (position.x < 0.5 ? -0.5 : 0.5);
    c.xy += (nrm * position.y * hw + along) / (uResolution * 0.5) * c.w;
    gl_Position = c;
    vAlpha = position.x < 0.5 ? aAlpha.x : aAlpha.y;
    vSide = position.y * hw;
    vHalf = uWidth * uPx * 0.5;
  }
`

export const hairlineFragment = glsl`
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;
  varying float vSide;
  varying float vHalf;
  void main() {
    float cov = 1.0 - smoothstep(vHalf - 0.5, vHalf + 0.5, abs(vSide));
    float a = cov * vAlpha * uOpacity;
    if (a < 0.003) discard;
    gl_FragColor = vec4(uColor, a);
    ${OUTPUT}
  }
`
