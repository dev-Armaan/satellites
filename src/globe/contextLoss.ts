/**
 * A WebGL context that came back after the browser took it away.
 *
 * Browsers drop a page's GPU context when they need the memory: a phone does it to a tab left in the background,
 * and gives a fresh one back when the tab is shown again. three.js then rebuilds its own state and uploads every
 * texture again from the pixels it still holds. The globe's sharper maps hold none: they are uploaded strip by strip
 * straight from the decoder and the pixels released (textures.ts buildSliced, so an 8k map never sits in memory
 * twice), and the decals are the same. So after a restore the Earth was drawn from empty textures: a black planet
 * inside its atmosphere, until the page was reloaded (seen on the live site with WEBGL_lose_context, 2026-11-21).
 *
 * Nothing here tries to refill a restored context. The canvas is mounted again instead (GlobeCanvas keys its stage
 * on a count this bumps): a new context, the 1k maps first and the sharper ones after them from the browser's cache,
 * the way a page load does it, which is the one path that is exercised on every visit.
 *
 * Only the restore is acted on. A loss that the browser never undoes leaves the last frame on screen, and unmounting
 * a canvas loses its context on purpose (R3F calls forceContextLoss), which must not start anything.
 */

type Listenable = Pick<EventTarget, 'addEventListener' | 'removeEventListener'>

/** Call `restored` each time `canvas` gets its context back. Returns the function that stops listening. */
export function onContextRestored(canvas: Listenable, restored: () => void): () => void {
  const listener = () => restored()
  canvas.addEventListener('webglcontextrestored', listener)
  return () => canvas.removeEventListener('webglcontextrestored', listener)
}
