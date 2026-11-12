import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

/**
 * Production origin for absolute link-preview URLs (og:url, og:image): VITE_SITE_ORIGIN, else Vercel's
 * production host, else the current deployment.
 */
function siteOrigin(env: Record<string, string>): string {
  const raw =
    env.VITE_SITE_ORIGIN ||
    (env.VERCEL_PROJECT_PRODUCTION_URL && `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
    (env.VERCEL_URL && `https://${env.VERCEL_URL}`) ||
    'https://www.watched.earth'
  return raw.replace(/\/+$/, '')
}

/** SGP4 and the engine modules over it: needed by the globe and the report engine, never by the first screen. */
const SGP4_MODULES = /node_modules[\\/]satellite\.js[\\/]|src[\\/]engine[\\/](sgp4|propagate|geometry|elements|geostationary)\.ts$/

/**
 * UI primitives that only define components (their one side effect is a CSS-module import). Declaring them
 * side-effect free lets a primitive the first screen never renders (the bottom Sheet) ship with the results
 * chunk instead of the shared one, even though the shell imports the same barrel.
 */
const PURE_UI_MODULES = /src[\\/]ui[\\/]system[\\/](Sheet|sheetMath)\.tsx?$/

/**
 * Imagery modules the landing never calls (it only geocodes) but reaches through the '@/imagery' barrel:
 * functions and constants only, so declaring them side-effect free keeps them with the report engine. pcCrop (and
 * the grid arithmetic under it, api/_lib/toneRender.ts + utm.ts) builds the photos' URLs: the search's, never the
 * first screen's.
 */
const PURE_IMAGERY_MODULES = /src[\\/]imagery[\\/](image|pixels|pixelsClient|gibs|eumetsat|geoFrames|infrared|stac|cloud|pcCrop|radar|radarTone)\.ts$|api[\\/]_lib[\\/](toneRender|utm|radar|infrared)\.ts$/

/** lib/geo's Vector3 helpers (three's math classes): the globe's, never the first screen's (see src/lib/geo.ts). */
const PURE_LIB_MODULES = /src[\\/]lib[\\/]geo3\.ts$/

/** The three faces the first screen paints (latin subsets): preloaded so the static boot frame and the hero never swap fonts late. */
const CRITICAL_FONTS = /^(?:.*\/)?(instrument-sans-latin-standard-normal|martian-mono-latin-standard-normal|instrument-serif-latin-400-italic)-[\w-]+\.woff2$/

/**
 * index.html at build time (K3, K9):
 *  - `__SITE_ORIGIN__` → the production origin (dev: the dev server's own origin is irrelevant for unfurls).
 *  - `__APP_VERSION__` → the build's version (see appVersion below).
 *  - <link rel=preload as=font> for the critical woff2 files (hashed names are only known after bundling).
 *  - <link rel=modulepreload> for the lazily imported globe chunk (three.js + R3F) and its static imports,
 *    so it downloads in parallel with the shell instead of after it evaluates.
 */
function overflightHtml(): Plugin {
  let origin = ''
  let base = '/'
  return {
    name: 'overflight-html',
    configResolved(config) {
      origin = siteOrigin({ ...process.env, ...loadEnv(config.mode, config.root, '') } as Record<string, string>)
      base = config.base
    },
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        html = html.replaceAll('__SITE_ORIGIN__', origin).replaceAll('__APP_VERSION__', appVersion())
        const bundle = ctx.bundle
        if (!bundle) return html
        const tags: { tag: string; attrs: Record<string, string | boolean>; injectTo: 'head' }[] = []
        for (const out of Object.values(bundle)) {
          if (out.type === 'asset' && CRITICAL_FONTS.test(out.fileName))
            tags.push({ tag: 'link', attrs: { rel: 'preload', href: base + out.fileName, as: 'font', type: 'font/woff2', crossorigin: true }, injectTo: 'head' })
        }
        const entry = Object.values(bundle).find((o) => o.type === 'chunk' && o.isEntry)
        const globe = Object.values(bundle).find(
          (o) => o.type === 'chunk' && o.isDynamicEntry && !!o.facadeModuleId && /[\\/]src[\\/]globe[\\/]index\.ts$/.test(o.facadeModuleId),
        )
        if (globe && globe.type === 'chunk') {
          // Vite already modulepreloads the entry's own static imports: only add what the globe adds.
          const have = new Set(entry && entry.type === 'chunk' ? [entry.fileName, ...entry.imports] : [])
          for (const file of [...globe.imports, globe.fileName]) {
            if (have.has(file)) continue
            tags.push({ tag: 'link', attrs: { rel: 'modulepreload', href: base + file, crossorigin: true }, injectTo: 'head' })
          }
        }
        return { html, tags }
      },
    },
  }
}

/**
 * App version for in-app events (src/lib/telemetry.ts): the deployed commit, else the package version. It is written
 * into index.html (<meta name="app-version">), never into a script: a value baked into a chunk renames that chunk
 * and every chunk that imports it, so each deploy (the catalog bot's, every 6 hours) made returning visitors download
 * the shell and the results panel again with not a line of them changed. index.html is revalidated on every visit anyway.
 */
function appVersion(): string {
  // The commit as each host's build names it: Vercel, then Cloudflare Workers Builds.
  const sha = process.env.VERCEL_GIT_COMMIT_SHA || process.env.WORKERS_CI_COMMIT_SHA || ''
  const v = process.env.VITE_APP_VERSION || sha.slice(0, 7) || process.env.npm_package_version || 'dev'
  return /^[A-Za-z0-9._-]{1,24}$/.test(v) ? v : 'dev'
}

export default defineConfig({
  plugins: [react(), overflightHtml()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  worker: { format: 'es' },
  build: {
    target: 'es2022',
    sourcemap: true,
    chunkSizeWarningLimit: 2000,
    rolldownOptions: {
      // These modules only define functions and constants (satellite.js included), so an unused re-export
      // (engine/index.ts re-exports propagate/elements for the globe) needn't load them: the shell, which
      // reads the catalog through the engine's index, then never pulls SGP4 into the first bundle.
      treeshake: { moduleSideEffects: (id: string) => ([SGP4_MODULES, PURE_UI_MODULES, PURE_IMAGERY_MODULES, PURE_LIB_MODULES].some((re) => re.test(id)) ? false : undefined) },
      output: {
        codeSplitting: {
          groups: [
            // SGP4 (satellite.js and the engine modules over it) is needed by the globe and the report engine,
            // never by the first screen: keep it out of the shared chunk the shell loads (K3).
            { name: 'sgp4', test: SGP4_MODULES, includeDependenciesRecursively: false },
            // Image loading, pixel probes and the photos' tone (api/_lib/tone.ts; its URL half, toneRender.ts, is the
            // 'grid' chunk below) run once a search starts: their own chunk, not the landing's.
            { name: 'image', test: /src[\\/]imagery[\\/](image|pixels|pixelsClient|radarTone)\.ts$|api[\\/]_lib[\\/]tone\.ts$/, includeDependenciesRecursively: false },
            // The photos' URLs on the place's UTM grid (src/imagery/pcCrop.ts over api/_lib/toneRender.ts + utm.ts) are
            // built once a search starts: their own chunk, so they never ride with the geocoder's endpoints (CR-1).
            { name: 'grid', test: /src[\\/]imagery[\\/](pcCrop|radar)\.ts$|api[\\/]_lib[\\/](toneRender|utm|radar|infrared)\.ts$/, includeDependenciesRecursively: false },
          ],
        },
      },
    },
  },
  server: { port: 5173 },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
} as any)
