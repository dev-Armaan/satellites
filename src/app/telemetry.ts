/**
 * Derives in-app events from what the app already does, without touching the UI components:
 *  - the zustand store (searches, results, pass opens, the About page, error phases),
 *  - `<html data-overlay>` (the lightbox; DESIGN/ARCHITECTURE "Overlays over the globe"),
 *  - window errors, and a few web vitals sent once when the tab is hidden (from a quarter of tabs: VITALS_SAMPLE).
 *
 * One `results` event per search (when it first shows): the admin page reads it. There is no `results_final` any more
 * (nothing read it, and it doubled the rows of every search; the database's free tier is 500 MB).
 * The share sheet reports its own open and actions (one-line `track` calls in src/ui/share/ShareSheet.tsx),
 * because its desktop dialog doesn't set the overlay attribute.
 *
 * Loaded by src/main.tsx after first paint (idle). Everything that leaves the browser
 * is coarsened in src/lib/telemetry.ts (city-level labels, 0.1° cells, no URLs or coordinates in messages).
 */
import type { AppState } from '@/state/store'
import type { MessageRef, Report } from '@/types'
import { cellOf, flush, regionLabel, scrubMessage, setArrival, setEnricher, setLanguage, startTelemetry, track, type Props } from '@/lib/telemetry'
import type * as Deps from './telemetryDeps'

/** Handed in by src/main.tsx (src/app/telemetryDeps.ts): this chunk imports no app module itself, so adding it
 * leaves the boot chunks exactly as they were (a static import of the store from a lazy chunk re-splits them). */
export type TelemetryDeps = typeof Deps

/** N (distinct satellites with any pass) and K (public images), as the results headline counts them. */
export function reportCounts(r: Pick<Report, 'passes' | 'archiveFailed' | 'partial'>): Props {
  const sats = new Set<number>()
  const photos = new Set<string>()
  let passes = 0
  for (const p of r.passes) {
    // Overflights only, as before geostationary scans were listed: the series stays comparable.
    if (p.geostationary) continue
    passes++
    sats.add(p.norad)
    if (p.verdict === 'imaged' && p.captureId) photos.add(p.captureId)
  }
  return { sats: sats.size, photos: photos.size, passes, partial: !!r.partial, archive_failed: !!r.archiveFailed }
}

/** search source: typed suggestion / example chip / Surprise me / dropped pin / near me / deep link / share link. */
export function searchSource(st: Pick<AppState, 'place' | 'shared'>): string {
  switch (st.place?.source) {
    case 'demo':
      return 'example'
    case 'surprise':
      return 'surprise'
    case 'pin':
      return 'pin'
    case 'geolocation':
      return 'near_me'
    case 'url':
      return st.shared ? 'share_link' : 'deep_link'
    default:
      return 'search'
  }
}

function lastMark(name: string): number | undefined {
  try {
    const m = performance.getEntriesByName(`overflight:${name}`, 'mark')
    return m.length ? m[m.length - 1].startTime : undefined
  } catch {
    return undefined
  }
}

function passProps(st: AppState): Props {
  const pass = st.report?.passes.find((p) => p.id === st.selectedPassId)
  if (!pass) return {}
  const cap = pass.captureId ? st.report?.captures.find((c) => c.id === pass.captureId) : undefined
  return { norad: pass.norad, verdict: pass.verdict, collection: cap?.collection }
}

/**
 * A fault notice as the stats keep it: the sentence the visitor read, in English whatever language they read it in
 * (`english`: telemetryDeps.englishOf; an unknown ref logs its id), then what failed in brackets. The sentence
 * alone could not tell a dropped connection from a server error or a broken file (2026-11-18: 187 tabs said "Could
 * not load the orbit catalog" in two hours, and nothing recorded why).
 */
export function phaseErrorMsg(st: Pick<AppState, 'error' | 'errorCause'>, english: (ref: MessageRef) => string | undefined): string | undefined {
  const said = st.error ? (english(st.error) ?? st.error.id) : 'error'
  // The cause is scrubbed on its own first: a masked URL would otherwise swallow the closing bracket.
  const cause = scrubMessage(st.errorCause)
  return scrubMessage(cause ? `${said} (${cause})` : said)
}

let installed = false

export function initTelemetry({ useApp, getSatInfo, canonicalPlace, cityLevelLabel, englishOf, currentLocale, arrival }: TelemetryDeps): void {
  setArrival(arrival)
  if (installed || !startTelemetry()) return
  installed = true

  // Every batch names the language the app shows when it is sent (a switch included), for the admin page's Languages.
  setLanguage(currentLocale)

  setEnricher((_type, p) => {
    if (typeof p.norad === 'number' && !p.sat) {
      const name = getSatInfo(p.norad)?.name
      if (name) return { ...p, sat: name }
    }
    return p
  })

  track('view', { entry: arrival.entry })

  // ── store ───────────────────────────────────────────────────────────────────────────────
  let search: { place: object; t0?: number; catchUp: boolean; first: boolean } | undefined

  let lastSearchAt = -Infinity
  /** A retry is marked by the controller's retryReport ('overflight:retry') since the previous search started. */
  const onSearch = (st: AppState, t0: number | undefined, catchUp = false) => {
    const place = st.place!
    const retryMark = lastMark('retry')
    const retry = retryMark !== undefined && retryMark >= lastSearchAt
    lastSearchAt = performance.now()
    search = { place, t0, catchUp, first: false }
    track('search', {
      source: retry ? 'retry' : searchSource(st),
      // A curated place (example chip, Surprise me) by its English name, whatever language it was shown in.
      label: regionLabel(canonicalPlace(place), cityLevelLabel, { shared: !!st.shared }),
      cell: cellOf(place.lat, place.lon),
      country: /^[a-z]{2}$/i.test(place.countryCode ?? '') ? place.countryCode!.toLowerCase() : undefined,
    })
  }

  const onReport = (st: AppState) => {
    const r = st.report
    if (!search || !r || st.phase !== 'results') return
    // Loaded after the results were up (a deep link during boot): time them by the controller's marks, not now.
    const since = (mark?: number) => (search!.t0 !== undefined && mark !== undefined && mark >= search!.t0 ? Math.round(mark - search!.t0) : undefined)
    const now = performance.now()
    if (!search.first) {
      search.first = true
      track('results', { ...reportCounts(r), ms: search.catchUp ? since(lastMark('results') ?? now) : since(now) })
    }
  }

  const onChange = (st: AppState, prev: AppState) => {
    if (st.phase === 'computing' && prev.phase !== 'computing' && st.place) onSearch(st, performance.now())
    if (st.report !== prev.report || (st.phase === 'results' && prev.phase !== 'results')) onReport(st)
    // A pass the controller preselects lands with the report (or the phase) in one update: not an "open".
    if (st.selectedPassId && st.selectedPassId !== prev.selectedPassId && st.report === prev.report && st.phase === prev.phase && st.phase === 'results')
      track('pass_open', passProps(st))
    if (st.aboutOpen && !prev.aboutOpen) track('about_open')
    if (st.phase === 'error' && prev.phase !== 'error') track('error', { where: 'phase', msg: phaseErrorMsg(st, englishOf) })
  }

  // Whatever happened before this module loaded (a deep link computes during boot).
  const now = useApp.getState()
  if ((now.phase === 'computing' || now.phase === 'results') && now.place) {
    // Timed by the controller's marks only if the results were already up; a search still computing is timed live.
    onSearch(now, lastMark('run-report'), now.phase === 'results')
    onReport(now)
  } else if (now.phase === 'error') track('error', { where: 'phase', msg: phaseErrorMsg(now, englishOf) })
  useApp.subscribe(onChange)

  // ── overlays: the lightbox ──────────────────────────────────────────────────────────────
  const root = document.documentElement
  let overlay = root.dataset.overlay
  new MutationObserver(() => {
    const next = root.dataset.overlay
    // Only from no overlay: About closing over the lightbox hands 'lightbox' back, which is not a new open.
    if (next === 'lightbox' && overlay === undefined) track('lightbox_open', passProps(useApp.getState()))
    overlay = next
  }).observe(root, { attributes: true, attributeFilter: ['data-overlay'] })

  // ── window errors (at most 5 per tab) ───────────────────────────────────────────────────
  let errors = 0
  const onError = (where: 'window' | 'promise', msg: unknown) => {
    if (errors++ >= 5) return
    const m = scrubMessage(msg)
    if (m) track('error', { where, msg: m })
  }
  addEventListener('error', (e) => onError('window', e.message || (e.error as Error | undefined)?.message))
  addEventListener('unhandledrejection', (e) => {
    const r = e.reason as unknown
    onError('promise', r instanceof Error ? `${r.name}: ${r.message}` : r)
  })

  watchVitals()
}

/**
 * Share of tabs that report web vitals. The admin page shows their 75th percentiles, which a quarter of ~20 000 daily
 * tabs estimates just as well; every tab reporting was ~10% of all rows.
 */
const VITALS_SAMPLE = 0.25

/** LCP, FCP, CLS and the slowest interaction (an INP approximation), sent once when the tab is first hidden. */
function watchVitals(): void {
  if (typeof PerformanceObserver === 'undefined') return
  if (Math.random() >= VITALS_SAMPLE) return
  let lcp: number | undefined
  let fcp: number | undefined
  let cls = 0
  let inp: number | undefined
  const observe = (type: string, cb: (e: PerformanceEntry) => void, extra: Record<string, unknown> = {}) => {
    try {
      new PerformanceObserver((list) => list.getEntries().forEach(cb)).observe({ type, buffered: true, ...extra } as PerformanceObserverInit)
    } catch {
      /* unsupported */
    }
  }
  observe('largest-contentful-paint', (e) => (lcp = e.startTime))
  observe('paint', (e) => {
    if (e.name === 'first-contentful-paint') fcp = e.startTime
  })
  observe('layout-shift', (e) => {
    const s = e as PerformanceEntry & { value: number; hadRecentInput: boolean }
    if (!s.hadRecentInput) cls += s.value
  })
  observe('event', (e) => {
    const ev = e as PerformanceEntry & { interactionId?: number }
    if (ev.interactionId) inp = Math.max(inp ?? 0, e.duration)
  }, { durationThreshold: 40 })
  let sent = false
  addEventListener('visibilitychange', () => {
    if (sent || document.visibilityState !== 'hidden') return
    sent = true
    track('vitals', { lcp: lcp && Math.round(lcp), fcp: fcp && Math.round(fcp), inp: inp && Math.round(inp), cls: Math.round(cls * 1e4) / 1e4 })
    flush(true)
  }, { capture: true })
}
