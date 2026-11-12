/**
 * Shared material factories for every overlay the choreography reveals mid-motion: the place reticle, the swath
 * ribbon, screen-space hairlines, the satellite glyph, the acquisition sequence's spacecraft and light curtain, and
 * the reduced-motion fade. The real components AND the
 * boot-time shader warm-up (Scene.tsx <ShaderWarmup/>) build their materials here, so the programs compiled
 * under the boot curtain are exactly the ones used later (three caches programs by shader source + parameters),
 * and nothing links synchronously on frame 1 of the place or pass flight (PERF-02).
 */
import { AdditiveBlending, Color, DoubleSide, ShaderMaterial, Vector2, type Texture, type Vector3 } from 'three'
import { palette } from '@/ui/system/palette'
import { curtainFragment, curtainVertex, spacecraftFragment, spacecraftVertex } from './shaders/acquisition'
import { hairlineFragment, hairlineVertex, reticleFragment, reticleVertex, ribbonFragment, ribbonVertex } from './shaders/overlay'
import { glyphFragment, glyphVertex, satellitesFragment, satellitesVertex } from './shaders/points'

/** Linear-space colour from a palette hex (three converts sRGB hex → linear working space). */
export const lin = (hex: string) => new Color(hex)

type U<T> = { value: T }

/** Place reticle: a flat quad in the tangent plane, drawn after clouds with a polygon offset. */
export function createReticleMaterial(uPx: U<number>, ringPx: number, sizePx: number): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader: reticleVertex,
    fragmentShader: reticleFragment,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4,
    uniforms: {
      uSizePx: { value: sizePx },
      uPx,
      uRing: { value: ringPx * 2 },
      uRingBase: { value: ringPx },
      uLock: { value: 0 },
      uFlash: { value: 0 },
      uPulse: { value: 0 },
      uColor: { value: lin(palette.signal).multiplyScalar(1.15) },
      uInk: { value: lin(palette.ink0) },
      uOpacity: { value: 0 },
    },
  })
}

export interface RibbonLook {
  /** 0 swath, 1 field of regard, 2 track only */
  kind: 0 | 1 | 2
  color: Color
  fill: number
  /** Draw the ground track down the middle (default). Off for a geostationary scan, whose "track" is only the line's path. */
  noTrack?: boolean
  /** Thin the marks out toward the ribbon's sides: a geostationary scan line, whose ends are the limbs of the disc. */
  fadeEnds?: boolean
}

/** Swath ribbon on the surface (shaders/overlay.ts). Shares the scene's sun, cloud map and drift uniforms. */
export function createRibbonMaterial(
  shared: { uPx: U<number>; uSunDir: U<Vector3>; uCloudMap: U<Texture | null>; uCloudOffset: U<number> },
  look: RibbonLook,
  sweep: { speedKmS: number; frontGlowPx?: number; freshPx?: number },
): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader: ribbonVertex,
    fragmentShader: ribbonFragment,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
    uniforms: {
      uNow: { value: -1e9 },
      uPx: shared.uPx,
      uKind: { value: look.kind },
      uColor: { value: look.color },
      uEdgeColor: { value: lin(palette.bone) },
      uFill: { value: look.fill },
      uTrack: { value: look.noTrack ? 0 : 1 },
      uEndFade: { value: look.fadeEnds ? 1 : 0 },
      uOpacity: { value: 0 },
      uSunDir: shared.uSunDir,
      uClouds: shared.uCloudMap,
      uHasClouds: { value: shared.uCloudMap.value ? 1 : 0 },
      uCloudOffset: shared.uCloudOffset,
      uSpeedKmS: { value: sweep.speedKmS },
      uGlowPx: { value: sweep.frontGlowPx ?? 9 },
      uRate: { value: 0 },
      uLive: { value: 0 },
      uFreshPx: { value: sweep.freshPx ?? 36 },
      uFrontColor: { value: look.color.clone().multiplyScalar(1.7) },
    },
  })
}

/** The spacecraft model (shaders/acquisition.ts): lit by the shared sun uniform. */
export function createSpacecraftMaterial(uSunDir: U<Vector3>): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader: spacecraftVertex,
    fragmentShader: spacecraftFragment,
    transparent: true,
    depthWrite: true,
    side: DoubleSide,
    uniforms: {
      uSunDir,
      uLit: { value: 1 },
      uBone: { value: lin(palette.bone) },
      uInk: { value: lin(palette.ink1) },
      uSignal: { value: lin(palette.signal).multiplyScalar(1.2) },
      uOpacity: { value: 0 },
    },
  })
}

/** The sensor's light curtain (shaders/acquisition.ts): additive, very faint. */
export function createCurtainMaterial(color: Color): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader: curtainVertex,
    fragmentShader: curtainFragment,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: AdditiveBlending,
    uniforms: {
      uColor: { value: color },
      uBone: { value: lin(palette.bone) },
      uOpacity: { value: 0 },
      uTime: { value: 0 },
    },
  })
}

/** Screen-space hairline (instanced quads, hairline.ts). */
export function createHairlineMaterial(opts: { color: Color; width?: number; opacity?: number; uPx: U<number>; depthTest?: boolean }): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader: hairlineVertex,
    fragmentShader: hairlineFragment,
    transparent: true,
    depthWrite: false,
    depthTest: opts.depthTest ?? true,
    uniforms: {
      uResolution: { value: new Vector2(1, 1) },
      uWidth: { value: opts.width ?? 1 },
      uPx: opts.uPx,
      uColor: { value: opts.color },
      uOpacity: { value: opts.opacity ?? 1 },
    },
  })
}

/** Category glyph for one emphasised satellite (a single point sprite, SatMarker.tsx). */
export function createGlyphMaterial(uPx: U<number>, opts: { size: number; shape: number; filled: boolean }): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader: glyphVertex,
    fragmentShader: glyphFragment,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uPx,
      uSize: { value: opts.size },
      uShape: { value: opts.shape },
      uFill: { value: opts.filled ? 1 : 0 },
      uColor: { value: new Color() },
      uInk: { value: lin(palette.ink0) },
      uOpacity: { value: 0 },
    },
  })
}

/** The whole catalog as GPU-propagated points (SatelliteField.tsx). */
export function createSatellitesMaterial(uPx: U<number>): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader: satellitesVertex,
    fragmentShader: satellitesFragment,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uGmst: { value: new Vector2(1, 0) },
      uPx,
      uHideA: { value: -1 },
      uHideB: { value: -1 },
      uShowAmbient: { value: 1 },
      uReveal: { value: 0 },
      uCamDist: { value: 5 },
      uEarthPx: { value: 320 },
      uBone: { value: lin(palette.bone) },
      uSignal: { value: lin(palette.signal) },
      uIce: { value: lin(palette.ice) },
    },
  })
}

const fadeVertex = /* glsl */ `void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`
const fadeFragment = /* glsl */ `
  uniform vec3 uColor; uniform float uAlpha;
  void main() { gl_FragColor = vec4(uColor, uAlpha);
  #include <colorspace_fragment>
  }`

/** Full-screen ink fade for reduced-motion camera cuts (CameraDirector). */
export function createFadeMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader: fadeVertex,
    fragmentShader: fadeFragment,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    uniforms: { uColor: { value: lin(palette.ink0) }, uAlpha: { value: 0 } },
  })
}
