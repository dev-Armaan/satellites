import { defineConfig, loadEnv, minifySync, type IndexHtmlTransformContext, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { LOCALE_INFO } from './api/_lib/i18n/locales.ts'
import { bootLocale, type BootData } from './src/i18n/boot.ts'
import { BOOT_TEXT } from './src/i18n/bootText.ts'
import { PLACE_PREFIX } from './src/lib/placePage.ts'
import { blockerNames } from './scripts/blockerNames.ts'

/**
 * Production origin for the absolute URLs search engines and link previews read (canonical, og:url, og:image, the
 * sitemap): VITE_SITE_ORIGIN, a build variable. Every build says the production origin, a preview's too, so a
 * preview never presents itself as the site. A fork sets its own (docs/SELF-HOSTING.md).
 */
function siteOrigin(env: Record<string, string>): string {
  return (env.VITE_SITE_ORIGIN || 'https://www.watched.earth').replace(/\/+$/, '')
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

/**
 * The i18n core and the few modules the first screen shares with the 15 locale chunks (every catalog formats with
 * them): Rolldown cut each into its own sliver, because the locale chunks import them too, and English's first load
 * went from 17 files to 23. Held in one chunk instead. Only zustand's own entry: its `traditional` one (and
 * use-sync-external-store under it) is React Three Fiber's, and taking it here pulled the globe into the first load.
 * The place-name tables' loader (src/i18n/optionalChunks.ts) too: the table languages' chunks and the imagery code
 * share it, and neither may pull the other in.
 */
const I18N_CORE =
  /src[\\/]i18n[\\/](ns|accentFont|runtime|Rich|optionalChunks)\.tsx?$|api[\\/]_lib[\\/]i18n[\\/](locales|parts|format|units)\.ts$|src[\\/]ui[\\/]system[\\/]format\.ts$|src[\\/]imagery[\\/]placeKey\.ts$|src[\\/]i18n[\\/]en[\\/]time\.ts$|src[\\/]ui[\\/]results[\\/]lib[\\/]time\.ts$|node_modules[\\/]zustand[\\/]esm[\\/](index|vanilla|react)\.mjs$/

/**
 * The verdicts' English names ride with the results' meta (the results panel and About both load it), not in a chunk
 * of their own on the results' path. (The time-lapse's words stay in its chunk because its video module takes them from
 * it: video.ts imports the catalog's type only.)
 */
const RESULTS_META = /src[\\/]ui[\\/]results[\\/]lib[\\/]meta\.ts$|src[\\/]i18n[\\/]en[\\/]verdicts\.ts$/

/** The three faces the first screen paints (latin subsets): preloaded so the static boot frame and the hero never swap fonts late. */
const CRITICAL_FONTS = /^(?:.*\/)?(instrument-sans-latin-standard-normal|martian-mono-latin-standard-normal|instrument-serif-latin-400-italic)-[\w-]+\.woff2$/

/**
 * index.html at build time (K3, K9):
 *  - `__SITE_ORIGIN__` → the production origin (dev: the dev server's own origin is irrelevant for unfurls).
 *  - `__APP_VERSION__` → the build's version (see appVersion below).
 *  - <link rel=preload as=font> for the critical woff2 files (hashed names are only known after bundling).
 *  - <link rel=modulepreload> for the lazily imported globe chunk (three.js + R3F) and its static imports,
 *    so it downloads in parallel with the shell instead of after it evaluates.
 *  - The language: src/i18n/boot.ts inlined right after <meta charset> with the locales and, in a build, each locale's
 *    messages chunk, so the page's lang/dir/script are set before first paint and a non-English visitor's messages
 *    download in parallel with the shell (main.tsx awaits them before the first render); and src/i18n/bootText.ts
 *    inlined after the loading screen, so its few words are in that language too (I18N).
 */
function overflightHtml(): Plugin {
  let origin = ''
  let base = '/'
  return {
    name: 'overflight-html',
    // Two chunks that import each other evaluate one before the other has set its exports: the release of 2026-11-19
    // died on load with "n is not a function" (engine imported the i18n core, which imported a helper Rolldown had put
    // in engine). Fail the build on any cycle instead of shipping it.
    generateBundle(_options, bundle) {
      const imports = new Map<string, string[]>()
      for (const o of Object.values(bundle)) if (o.type === 'chunk') imports.set(o.fileName, o.imports)
      const state = new Map<string, 'open' | 'done'>()
      const visit = (file: string, path: string[]) => {
        if (state.get(file) === 'done') return
        if (state.get(file) === 'open') this.error(`chunk import cycle: ${[...path.slice(path.indexOf(file)), file].join(' → ')}`)
        state.set(file, 'open')
        for (const next of imports.get(file) ?? []) visit(next, [...path, file])
        state.set(file, 'done')
      }
      for (const file of imports.keys()) visit(file, [])
      // A failed prefetch of the card's measure stays quiet only while its chunk is named so (src/ui/share/measure.ts,
      // src/lib/staleBuild.ts): renamed, every such failure would reload the results being read.
      const app = Object.values(bundle).some((o) => o.type === 'chunk' && o.isEntry && /index/.test(o.name))
      if (app && ![...imports.keys()].some((f) => /(^|\/)cardMeasure-[\w-]+\.js$/.test(f)))
        this.error('no cardMeasure-*.js chunk: src/ui/share/measure.ts and src/lib/staleBuild.ts match that name')
    },
    configResolved(config) {
      origin = siteOrigin({ ...process.env, ...loadEnv(config.mode, config.root, '') } as Record<string, string>)
      base = config.base
    },
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        html = html.replaceAll('__SITE_ORIGIN__', origin).replaceAll('__APP_VERSION__', appVersion())
        // The app's page only: the dev server also serves admin.html (?mock=1), which has no boot language or words.
        if (!/(^|[\\/])index\.html$/.test(ctx.filename)) return html
        html = withLocaleBoot(html, ctx.bundle ? localePreloads(ctx.bundle, base) : undefined, ctx.bundle ? scriptFonts(ctx.bundle, base) : undefined)
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

type OutputBundle = NonNullable<IndexHtmlTransformContext['bundle']>

/**
 * Each locale's messages chunk (src/i18n/<locale>/index.ts, a dynamic import of src/i18n/runtime.ts) and the chunks it
 * imports that the entry doesn't already load, as URLs to modulepreload when the boot script picks that locale.
 */
function localePreloads(bundle: OutputBundle, base: string): Record<string, string[]> {
  const entry = Object.values(bundle).find((o) => o.type === 'chunk' && o.isEntry)
  const have = new Set(entry && entry.type === 'chunk' ? [entry.fileName, ...entry.imports] : [])
  const out: Record<string, string[]> = {}
  for (const o of Object.values(bundle)) {
    if (o.type !== 'chunk' || !o.isDynamicEntry || !o.facadeModuleId) continue
    const m = /[\\/]src[\\/]i18n[\\/]([A-Za-z-]+)[\\/]index\.ts$/.exec(o.facadeModuleId)
    if (!m || !(m[1] in LOCALE_INFO)) continue
    out[m[1]] = [o.fileName, ...o.imports.filter((f) => !have.has(f))].map((f) => base + f)
  }
  return out
}

/**
 * A script's faces the first screen paints (src/styles/scripts.css), preloaded by the boot script only for that
 * script, or for that language (a key that is a locale): the hero is the largest paint, and its Cyrillic, Arabic,
 * Vietnamese or Devanagari face would otherwise be discovered late. The Arabic accent (one word) and the brand faces
 * every page preloads (CRITICAL_FONTS) are not on this list. The Devanagari accent is: Hindi's hero opens its last line
 * with it («आपको देखा।»), so a late swap would move the rest of the line.
 */
const LATIN_EXT = /^(?:.*\/)?(instrument-sans-latin-ext-standard-normal|martian-mono-latin-ext-standard-normal|instrument-serif-latin-ext-400-italic)-[\w-]+\.woff2$/
const SCRIPT_FONTS: Record<string, RegExp> = {
  cyrillic: /^(?:.*\/)?(noto-sans-cyrillic-wdth-normal|noto-serif-display-cyrillic-italic-320-62)-[\w-]+\.woff2$/,
  arabic: /^(?:.*\/)?noto-sans-arabic-wght400-700-wdth75-100-[\w-]+\.woff2$/,
  devanagari: /^(?:.*\/)?(noto-sans-devanagari-wght400-700-wdth75-100|noto-serif-devanagari-350-87)-[\w-]+\.woff2$/,
  // Latin languages whose own letters (ł ż ś, ş ğ ı) live in the brand faces' latin-ext files (keyed by locale)
  pl: LATIN_EXT,
  tr: LATIN_EXT,
  // Vietnamese sets every role in faces of its own (scripts.css): their latin and Vietnamese files, the accent's one.
  // Not the Latin Extended-A files, which only a Polish or Czech name asks for.
  vi: /^(?:.*\/)?(noto-sans-latin-wdth-normal|noto-sans-vietnamese-wdth-normal|jetbrains-mono-(latin|vietnamese)-wght300-700|noto-serif-display-vietnamese-italic-320-62)-[\w-]+\.woff2$/,
}
function scriptFonts(bundle: OutputBundle, base: string): Record<string, string[]> {
  const out: Record<string, string[]> = {}
  for (const o of Object.values(bundle))
    for (const [script, re] of Object.entries(SCRIPT_FONTS)) if (o.type === 'asset' && re.test(o.fileName)) (out[script] ??= []).push(base + o.fileName)
  return out
}

/**
 * index.html with the boot language script after <meta charset> and the loading screen's words after it. The script
 * is src/i18n/boot.ts's function itself (serialised), so the build and the tests run the same code.
 */
function withLocaleBoot(html: string, preload: Record<string, string[]> | undefined, fonts: Record<string, string[]> | undefined): string {
  const data: BootData = {
    locales: Object.fromEntries(Object.values(LOCALE_INFO).map((l) => [l.code, [l.script, l.dir, l.listed ? 1 : 0]])),
    ...(preload ? { preload } : {}),
    ...(fonts ? { fonts } : {}),
  }
  const json = (v: unknown) => JSON.stringify(v).replace(/</g, '\\u003c')
  const min = (code: string) => minifySync('boot.js', code, {}).code.trim().replace(/;$/, '')
  const boot = `<script>${min(`(${bootLocale.toString()})(${json(data)})`)}</script>`
  const text = Object.fromEntries(Object.entries(BOOT_TEXT).filter(([k]) => k !== 'en'))
  const words =
    `<script>(function(t){var e=t[document.documentElement.lang];if(!e)return;var b=document.getElementById('boot-static');` +
    `if(b){b.setAttribute('aria-label',e.loading);var n=b.querySelector('.bs-note');if(n)n.textContent=e.slow}` +
    // The title is the landing's: a place page keeps its own until the app names the place (src/app/head.ts).
    `if(location.pathname.indexOf(${json(`${PLACE_PREFIX}/`)})!==0)document.title=e.title})(${json(text)})</script>`
  const charset = /<meta charset="UTF-8" \/>\n/
  if (!charset.test(html) || !html.includes('<!-- boot-text -->')) throw new Error('index.html: missing <meta charset> or <!-- boot-text -->')
  return html.replace(charset, (m) => `${m}    ${boot}\n`).replace('<!-- boot-text -->', words)
}

/**
 * App version for in-app events (src/lib/telemetry.ts): the deployed commit, else the package version. It is written
 * into index.html (<meta name="app-version">), never into a script: a value baked into a chunk renames that chunk
 * and every chunk that imports it, so each deploy (the catalog bot's, every 6 hours) made returning visitors download
 * the shell and the results panel again with not a line of them changed. index.html is revalidated on every visit anyway.
 */
function appVersion(): string {
  // The commit, as Cloudflare Workers Builds names it.
  const sha = process.env.WORKERS_CI_COMMIT_SHA || ''
  const v = process.env.VITE_APP_VERSION || sha.slice(0, 7) || process.env.npm_package_version || 'dev'
  return /^[A-Za-z0-9._-]{1,24}$/.test(v) ? v : 'dev'
}

export default defineConfig({
  plugins: [react(), overflightHtml(), blockerNames()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  // The workers' own bundles (the pixels worker, the engine pool) get the same name check.
  worker: { format: 'es', plugins: () => [blockerNames()] },
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
            // The i18n core with the first screen's shared modules (I18N_CORE), and React with its JSX runtime, which
            // the locale chunks' imports had split apart: English's first screen loads one file more than before
            // translations (this core), not seven.
            { name: 'i18n', test: I18N_CORE, includeDependenciesRecursively: false },
            { name: 'react', test: /node_modules[\\/]react[\\/]/, includeDependenciesRecursively: false },
            { name: 'meta', test: RESULTS_META, includeDependenciesRecursively: false },
          ],
        },
      },
    },
  },
  server: { port: 5173 },
  test: { environment: 'node', include: ['src/**/*.test.ts'], setupFiles: ['scripts/cardMeasure.setup.ts'] },
} as any)
