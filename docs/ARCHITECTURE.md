# Watched: architecture and module contracts

**Product:** enter a place → see every satellite that passed over it in the last 7 days, with the real
images they took. A 3D globe shows the real sun, the real catalog (~17k objects), and each pass replayed.

Stack: Vite 8 + React 19 + TypeScript 7 (`tsc -b`) + three.js 0.187 via @react-three/fiber 9 / drei 10 /
postprocessing. State: zustand (`src/state/store.ts`). Orbits: satellite.js 7 (SGP4). Hosting: Vercel
(static + `api/` functions). DB: Supabase (RPC-only access, publishable key).

Read first: `docs/DESIGN.md` (non-negotiable art direction), `src/types.ts` (shared contracts),
`src/lib/geo.ts` (frame conventions), `src/state/store.ts` (app state), `src/ui/system/*` (primitives).

## Data sources (all verified working, CORS `*`)

| what | endpoint | notes |
|---|---|---|
| Orbit catalog | `/data/catalog.json` (built by `.github/workflows/catalog.yml` from CelesTrak) | `CatalogFile` with `CatalogRow`s, ~16.9k rows, 2.4 MB (0.8 MB gz) |
| Sentinel-2 + Landsat search | `GET https://planetarycomputer.microsoft.com/api/stac/v1/search?…` (the search body as a query string: a GET needs no CORS preflight, which PC never lets the browser remember; POST only if the GET form is refused, `stac.ts searchPage`) | collections `sentinel-2-l2a`, `landsat-c2-l2`; `intersects` Point; `datetime` range; props `platform` (`Sentinel-2A/B/C`, `landsat-8/9`), `eo:cloud_cover`, `view:sun_elevation` |
| Sentinel-1 radar search | the same GET search, collection `sentinel-1-rtc` (`stac.ts searchRadar`) | RTC gamma0 backscatter on a UTM grid, 10 m spacing; props `platform` (`sentinel-1a/c/d`), `sar:polarizations`, `proj:epsg`. Published ~6–12 h after capture. A search of its own, never awaited: `engine/report.ts` matches whatever it has returned when the partial or final report is built (it answers with the Sentinel-2 / Landsat search, ~1.3 s in, long before the 2.5 s budget), else the radar passes stay `could` |
| Radar crops | `…/item/bbox/…?collection=sentinel-1-rtc&item=…&assets=vv&asset_as_band=true&expression=where(vv>0.001,10*log10(vv),-30)&rescale=-32.5,5&resampling=average` (`imagery/radar.ts radarCropUrl`; HH where a scene has no VV) | On the place's grid like Sentinel-2's (10 m lattice); the card is 20 km at 1000 px = 20 m, the radar's own resolution, each pixel the mean of 2 × 2 in linear power (also calms speckle). 8-bit decibels, 0 = no data; never shown as it comes: the pixels worker (`fetchTonedHere` → `radarTone.ts`) stretches each image from its 1st to 99.6th percentile (≥ 16 dB) onto the ink→ice ramp. No sharper layer, no cloud check; never the cover |
| Crops (server-rendered) | `GET https://planetarycomputer.microsoft.com/api/data/v1/item/bbox/{minx},{miny},{maxx},{maxy}/{w}x{h}.{jpg,png}?collection=…&item=…&…` | One recipe for every renderer, `api/_lib/toneRender.ts` `pcRenderQuery`: surface reflectance (S2 `B04/B03/B02`, Landsat `red/green/blue`), `asset_as_band=true&expression=sqrt(where(B04>1000,B04-1000,0));…&rescale=0,100` (square root of reflectance 0…1; S2 offset 1000 from processing baseline 04.00, i.e. products generated from 25 Jan 2022, else 0; Landsat `…>7272.727…&rescale=0,190.693`), Geometry (`api/_lib/toneRender.ts` `pcCropUrlAt`): every Sentinel-2 / Landsat photo of a place is cut on ONE grid, the place's (`placeGrid`: the UTM zone of the place rounded to 0.01°, as MGRS draws it, Norway and Svalbard exceptions included; S2 in 326zz/327zz by hemisphere on the 10 m lattice, Landsat in 326zz on 30 m corners at 15 m, as Collection 2 delivers it): `coord_crs=EPSG:{zone}&dst_crs=` the same, the bbox in grid metres snapped to that lattice (`nativeBox`). It depends on the place only, so app, share card and server build the same URL with nothing to look up, and swiping between photos never turns the ground. The overflight's scene ON that grid is preferred (`stac.ts dedupeCandidates`, when the whole photo lies in it): PC then copies the archive's pixels 1:1 with no warp (`reproject=lanczos` is a no-op there, measured byte-identical): S2 photo 1000 px = 10 km, card 630 px = 6.3 km; Landsat 500 native px shown at 1000 and the card 315 at 630 (`resampling=lanczos`, an exact 2× on the grid; thumbnails 112 px likewise). A scene of the neighbouring zone (a place near a zone edge that only it covers well), or Landsat over Antarctica (EPSG:3031), is warped onto the place's grid with Lanczos. Up is grid north (true north is the meridian convergence away: under 3° in a standard 6° zone, up to 5.4° in south-west Norway's zone 32 and 6.0° in Svalbard's 12°-wide zones, `api/_lib/utm.ts`, Krüger series, checked against PROJ); the place is within ½ native pixel of the centre (≤ ~1 px within metres of a 0.01° line; the lightbox draws its reticle at `placeOffset`). Places beyond 80° S / 84° N and the globe's decals (mapped on the sphere in lon/lat) stay geographic: lon/lat bbox, `reproject=lanczos` (the default nearest warp leaves stair-steps). Never shown as it comes: toned first (see below). Native: ~0.4 s (112 px) … 1.3–1.6 s (1000; the lon/lat Lanczos 1024 was 2.0–2.5 s) |
| Cloud mask (spot, clear share, tone) | `GET …/api/data/v1/item/bbox/{box}/64x64.npy?collection=…&item=…&assets=SCL` (Landsat `assets=qa_pixel`) | `api/_lib/toneRender.ts` `maskUrl`: the photo's square (S2 ±5 km, Landsat ±7.5 km) around the place ROUNDED to 0.01°, always in lon/lat (PC's warp takes each cell's centre class; a read on the scene's own grid decimates without a warp and samples each cell ½ cell north-west, measured against the COG), raw classes + validity band; crops on a UTM grid read it through lat/lon (`tone.ts toMaskCrs`, an 8 × 8 lattice of exact projections, ≤ 0.2 m). SCL 8, 9 = cloud, 10 = thin cirrus, 3 = cloud shadow. One request per capture and place serves the spot check (1 km majority at the exact place), the clear share for the lead ranking and the photo's white point. ~0.5–1 s |
| Fallback S2 search | `GET https://earth-search.aws.element84.com/v1/search?…` (same transport), collection `sentinel-2-c1-l2a` | assets `visual` = 8-bit RGB COG (range requests OK) |
| Weather imagery | NASA GIBS WMS `https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&LAYERS={layer}&STYLES=&FORMAT=image/jpeg&CRS=EPSG:4326&BBOX={minLat},{minLon},{maxLat},{maxLon}&WIDTH=&HEIGHT=&TIME={YYYY-MM-DD or ISO}` | layers: `VIIRS_NOAA20_CorrectedReflectance_TrueColor`, `VIIRS_NOAA21_…`, `VIIRS_SNPP_…`, `MODIS_Terra_…`, `MODIS_Aqua_…` (daily); `GOES-East_ABI_GeoColor`, `GOES-West_ABI_GeoColor` (10 min), `Himawari_AHI_Band3_Red_Visible_1km`, and at night `Himawari_AHI_Band13_Clean_Infrared` (its colour-coded cold tops redrawn in grey, `src/imagery/infrared.ts`). **Note the BBOX axis order for EPSG:4326 in WMS 1.3.0 is lat,lon** |
| Meteosat frames | EUMETSAT EUMETView WMS `https://view.eumetsat.int/geoserver/ows?service=WMS&version=1.3.0&request=GetMap&layers={layer}&styles=&format=image/jpeg&crs=EPSG:4326&bbox={minLat},{minLon},{maxLat},{maxLon}&width=&height=&bgcolor=0x000000&time={ISO}`; frame list from `…/geoserver/{workspace}/{layer}/ows?service=WMS&version=1.3.0&request=GetCapabilities` | layers: `mtg_fd:rgb_geocolour` (Meteosat-12, 10 min), `msg_iodc:rgb_naturalenhncd` and `msg_iodc:ir108` (Meteosat-9, 15 min). A TIME between frames is answered with the nearest one, so only listed times are asked for; no data is asked for in black (`src/imagery/eumetsat.ts`) |
| Geocoding | `https://photon.komoot.io/api/?q=…&limit=6` and `/reverse?lat=&lon=`; reverse only, when Photon has not answered in 1.2 s: `https://nominatim.openstreetmap.org/reverse?…&format=geocodejson&zoom=10` (≤ 1 request/s); search, when Photon has not answered in 1.2 s: `https://geocoding-api.open-meteo.com/v1/search?name=…` (GeoNames; only results whose name matches, never cached) | GeoJSON; properties `name, city, state, country, countrycode, osm_value` (Nominatim's under `properties.geocoding`) |
| Time zone | `@photostructure/tz-lookup` (installed) | `tzlookup(lat, lon)` → IANA tz |

## Module ownership (parallel build: only touch files you own)

| module | owner dirs | key exports |
|---|---|---|
| **engine** | `src/engine/**`, `src/sandbox/engine.tsx` | catalog, profiles, propagation, passes, geostationary, report orchestration, GPU element buffer |
| **imagery** | `src/imagery/**`, `src/sandbox/imagery.tsx` | STAC + GIBS captures, crop URLs, spot cloud check, geocoding, tz |
| **globe** | `src/globe/**`, `src/sandbox/globe.tsx` | `<GlobeCanvas/>` and the whole 3D scene |
| **ui-shell** | `src/ui/hud/**`, `src/ui/landing/**`, `src/ui/pages/**`, `src/ui/system/**` (may ADD components), `src/sandbox/shell.tsx` | bezel, corner readouts, hero, search field, about page (the loading screen is index.html + `src/app/bootCurtain.ts`) |
| **ui-results** | `src/ui/results/**`, `src/ui/share/**`, `src/sandbox/results.tsx` | progress readout, results panel, timeline, pass list and detail, pushbroom reveal, share |
| **backend** | `api/**`, `supabase/**`, `vercel.json`, `src/lib/backend.ts` | DB schema and RPCs, OG share images, share pages, stats |
| integrator | `src/app/**`, `src/main.tsx`, `src/types.ts`, `src/state/**`, `src/lib/geo.ts`, `package.json`, `docs/**` | composition |

Rules for parallel work:
- Do not edit files outside your dirs. If you need a contract change (types, store, a new dependency), **do not make it**. Note it in your final report under "Integration requests" and code against a local adapter in your own dir in the meantime.
- Do not run `npm install`. All dependencies are already installed (see package.json).
- Do not use git (no commit, stash or checkout). The integrator commits.
- Typecheck only your files: `npx tsc -p tsconfig.app.json --noEmit 2>&1 | grep "src/<yourdir>"` (others may be mid-edit).
- Dev server: `npx vite --port <your port> --strictPort` (engine 5181, imagery 5182, globe 5183, ui-shell 5184, ui-results 5185, backend 5186), and view `http://localhost:<port>/?sandbox=<name>`. Screenshots: Playwright is preinstalled (`require('playwright')`, `chromium.launch()` needs no options). WebGL in headless Chromium works with `args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']`.
- Your sandbox file must render your module standalone with realistic data (real API calls are fine), and must never be imported by production code.

## Contracts

### engine → `src/engine/index.ts`
```ts
export interface LoadedCatalog { fetchedAt: string; source: string; sats: SatInfo[]; byNorad: Map<number, SatInfo> }
export function loadCatalog(url?: string): Promise<LoadedCatalog>             // singleton, cached
export function getSatInfo(norad: number): SatInfo | undefined                  // after loadCatalog
export function propagate(norad: number, ms: number): SatState | null          // main-thread SGP4 for a handful of sats
export interface SatState { lat: number; lon: number; altKm: number; ecef: [number, number, number]; velKmS: number }
export function groundTrack(norad: number, t0: number, t1: number, stepS?: number): TrackPoint[]
export const CATEGORY_INDEX: Record<SatCategory, number>                      // stable small ints for GPU
export interface ElementBuffer {
  count: number
  refEpochMs: number            // shader time origin; pass uTime = (simTime - refEpochMs)/1000
  /** stride 12 floats per sat:
   * [0] a (world units, Earth radii)  [1] e  [2] i (rad)  [3] raan0 (rad)  [4] argp0 (rad)  [5] M0 (rad)
   * [6] n (rad/s)  [7] raanDot (rad/s, J2)  [8] argpDot (rad/s, J2)  [9] epochOffset (s, sat epoch − refEpoch)
   * [10] category index  [11] flags (bit0 = featured/interesting) */
  data: Float32Array
  norad: Int32Array
}
export function buildElementBuffer(cat: LoadedCatalog): ElementBuffer
export function computeReport(place: Place, opts?: ReportOptions): Promise<EngineReport>
// ReportOptions: days, now, signal, budgetMs, and the callbacks
//   onProgress(e)    progress events (many per frame: the controller writes one per frame)
//   onArchive(caps)  the Sentinel-2/Landsat scenes, as soon as the archive answers (the controller warms the likely hero)
//   onCover(c)       the clear cover (owner D), as soon as it is found; often before the partial report (R-M1)
//   onPartial(r)     everything but the GIBS mosaic matches; sent once more with its clearCover if that is found
//                    before the final report
//   onUpdate(r)      after the final report: background patches (GIBS stragglers, a late clear cover); counts only go up
// EngineReport = Report + notes, partial, timings, coverPending (the week needs a clear cover and it is still being
// checked: a later report carries it or says there is none) and finalDueAt (partial reports: when the final is due)
// Report.lateChecks (final reports, only with onUpdate): GIBS stragglers still probing whose answer could add a photo;
// the UI reads the photo count as "At least K" with the "Verifying weather mosaics" line while it is > 0, and the patch
// that settles the last straggler (pixels, no data, failure or the 20 s cut) has none: the count is final.
export function profileFor(norad: number): SatProfile | undefined
```
The shader must reproduce: ECI position from Kepler + J2 secular drift, then ECI → ECEF via GMST (`src/lib/geo.ts gmst`), then ECEF → world (`ecefToWorld`).
`computeReport` runs pass prediction in Web Worker(s) and calls the imagery module for captures. It must finish in **under 4 s** on a laptop for a 7-day window, streaming `ProgressEvent`s.
The pass-worker pool (`src/engine/pool.ts`) runs hardwareConcurrency − 1 workers, at most 4 on desktops and 2 on phones,
all from ONE fetch of the worker script (a build shares the self-contained bundle through a blob: URL; constructing N
module workers from the script's URL at once fetches it N times).

### imagery → `src/imagery/index.ts`
```ts
export function searchCaptures(place: LatLon, start: number, end: number, signal?: AbortSignal): Promise<Capture[]>   // S2 + Landsat (STAC)
export function weatherCaptures(place: LatLon, passes: Pass[], signal?: AbortSignal): Promise<Capture[]>             // GIBS daily VIIRS/MODIS for daytime weather-leo passes
export function geoImageUrl(collection: CaptureCollection, place: LatLon, ms: number, opts: { halfSizeKm: number; px: number }): string // GOES/Himawari frame at time
export function latestGeoFrame(source: GeoFrameSource, place: LatLon, opts: { halfSizeKm: number; px: number }, o?: { signal?: AbortSignal }): Promise<GeoFrame | null> // a geostationary watcher's newest frame: GOES / Himawari (GIBS), Meteosat (EUMETSAT); says its band (colour, visible, infrared)
export function geoCapture(source: GeoFrameSource, frame: { time: number; layer: string }, place: LatLon, norad?: number): Capture | undefined // that frame as a capture of the report; geoCaptureFromItem(collection, itemId, place) rebuilds a shared one
export function spotCloud(capture: Capture, place: LatLon, signal?: AbortSignal): Promise<'clear' | 'cloud' | 'shadow' | 'unknown'>
export function searchPlaces(q: string, signal?: AbortSignal): Promise<Place[]>
export function reversePlace(lat: number, lon: number, signal?: AbortSignal): Promise<Place>
export function locateMe(): Promise<LatLon>
export function timeZoneAt(lat: number, lon: number): string
export function preloadImage(url: string): Promise<HTMLImageElement>
```
`preloadImage` decodes off the main thread and caches by URL. A Sentinel-2 / Landsat crop (the encoded render above) is
fetched and TONED in the pixels worker before anything shows it (`api/_lib/tone.ts`, owner rules: global edits only,
disclosed on the About page): one curve per capture and place (black point = the ground's darkest 0.5 % of any channel,
at most 0.06 reflectance; white point = the 99.5th percentile of the luminance each ground pixel needs for its brightest
channel to fit once coloured, with the mask's cloud / cirrus / shadow cells left out; gamma putting the median at ~42 %
grey, 48 % for bright scenes, clamped to [0.55, 0.8]; a frame of cloud is exposed for the cloud, white point ≤ 0.85;
a coarse crop with no shared curve yet widens its span by up to ×1.25), applied the same at every pixel: the curve on
luminance, colour ratios ^0.55 over half the black point, saturation ×1.2, out-of-gamut colour pulled towards grey at
constant luma (blown cloud goes white), the JPEG's 8-px grid smoothed in flat areas (steps ≤ 10 levels between flat
sides), then an unsharp mask on luma (σ ≈ 0.6 native px, amount 0.55, threshold 2/255, capped at 16/255; the server's
card plate on the place's grid is sharpened the same, being the same pixels at the same scale as the app's cut; a
lon/lat plate is not). It is measured over the share card's square around the rounded place (which the server's card
crop IS: on the grid, the same native pixels as that square of the app's photo before JPEG encoding; the two JPEGs
differ by ~4/255 on average), on the first crop near native resolution measured WITH its mask, and
reused by the capture's other sizes, so the photo, the lightbox's sharper layer (`lib/photos hiResUrl`: the photo's very box on the place's grid at 2000 px, Sentinel-2 2×, Landsat 4×, Lanczos on the grid; asked for once per photo, only where the photo is shown larger than 1000 device px — `devicePixelRatio` × side > 1100, e.g. a 3× phone or a Retina laptop — or zoomed past 1.3×, never by the gallery or the hero; it takes the curve the photo was shown with, `pixels.ts` magnified view, and crossfades in over it in register); for Landsat 8 / 9 it is instead the photo itself pan-sharpened with the capture's 15 m band: `imagery/panUrl.ts` names it `pansharp:<t>|<card>|<30 m fallback>`, the pixels worker (`fetchPanSharpHere`) tones the card's crop with its shown curve and applies `panSharpen.ts` (SFIM in linear light: colour × pan / pan at 30 m, gain clamped 0.6–1.7) with B08 from `GET /api/pan` (CDSE Sentinel Hub `landsat-ot-l1`, the card's box on its grid at 1000 px = 15 m, the capture's hour; only app-shaped crops accepted; a success is edge-cached for a year, so the free 10 000-request quota is spent once per crop); any failure loads the 30 m layer instead, and the lightbox labels say 15 m only while the pan layer shows, the DOM
share card, the downloaded PNG and the server's OG card (`api/_lib/imagery.ts fetchCropPicture`, the same module; a plate
toned without its mask is cached briefly, not as final) agree. Thumbnails and globe decals never ask for a mask of their
own (every crop of a capture at a place names the same lon/lat mask URL). The worker runs the
tone in ~12 ms slices (`toneCropAsync`), so cloud masks and GIBS checks are never stuck behind a photo; a transient HTTP
error on a mask is not kept (the spot check retries). The
element's `src` is a blob: URL of the toned bytes (as for GIBS); `tonedImageBlob(url, { fmt })` gives the bytes
(the globe's decal, "Download image" as PNG). Show the element it resolves with (or a clone): for a NASA
GIBS image its `src` is a blob: URL of the bytes the pixels worker fetched and checked for GIBS's all-black "no data"
answer (I-1: no full-size draw or read-back on the main thread), so a fresh `<img src={url}>` would download it again.

### globe → `src/globe/index.ts`
`export function GlobeCanvas(props: { className?: string; onPinSearch?: (place: Place) => void }): JSX.Element`: a full-bleed canvas that reads the store. It renders:
Earth (real sun), clouds, atmosphere, stars, the whole catalog as GPU points, the place reticle, and the selected pass
(ground track, swath ribbon, satellite with callout, replay-synced), plus a camera director for `store.camera` intents.
Dropped pins (`src/globe/pin.ts`, `PinMarker.tsx`, `PinOverlay.tsx`): a click on the planet (mouse) or a finger held still
for 450 ms (touch, pen; a quick tap stays the satellite pick) drops a bone reticle at that spot in `store.pin`, with a card
that names it (Photon reverse geocoding, hedged to Nominatim when Photon is slow) and an orange arrow that calls `onPinSearch` with a `source: 'pin'` place. Pins
exist in `idle`, `results` and `error`; any search starting clears them; while one is down the overview drift holds still.
`store.dropPinAtCentre()` (the landing's touch chip) drops one at the middle of the planet's disc.
Store writes: `globeReady`, `hoveredNorad`, `simTime`, `cameraFlight`, `dayMapSharp`, `pin`, `pinReady`. It sets `globeReady` once first textures are on screen, and
`dayMapSharp` once, when the first day-map upgrade above the boot level (2k on the phone tier, 4k on the desktop tier) has been
fully uploaded and swapped in, or at first light when the tier plan has no such step. `reset()` does not clear `dayMapSharp`.
It must also accept the engine's `ElementBuffer` (loaded internally via `loadCatalog` + `buildElementBuffer`).

### ui-shell → `src/ui/hud/index.ts`, `src/ui/landing/index.ts`, `src/ui/pages/index.ts`
`<Hud/>` (bezel plus corner readouts, always mounted; its lines enter when boot ends), `<Landing onSubmit={(place: Place) => void}/>` (phase `idle` / `locating`), `<AboutPage onClose/>`.

### The loading screen (integrator: `index.html`, `src/app/bootCurtain.ts`, `src/app/Main.tsx`)
The only loading screen is static HTML: `index.html`'s `#boot-static`, the serif wordmark centred on ink with a breathing
full stop, painted before any script runs (DESIGN §10). React never renders a boot screen. Contract:
- `<html data-boot>` is set in index.html and stays until the curtain lands. While it is there the HUD keeps its own
  wordmark (`[data-hud-wordmark]`) hidden (`visibility: hidden`), and its lines sit settled under the ink.
- Main calls `exitBootCurtain()` in the layout effect of the commit where the phase leaves `boot` (landing, computing
  panel, or fault notice), before that commit paints. It measures the HUD's wordmark and glides the centred one onto it
  (transform only, 760 ms), fades the ink (opacity, 120 → 680 ms), then in one task removes `data-boot` and
  `#boot-static`: the HUD's wordmark appears on the very pixels the glide landed on. Reduced motion: a 200 ms fade.
  If the HUD's wordmark can't be measured, it is shown at once and the centred one fades with the ink.
- `dropBootCurtain()` removes it immediately (dev sandboxes). Nothing may set the phase back to `boot` after it has
  left: a retry of the catalog (controller `retryCatalog`) loads it behind the fault notice instead.
- The HUD's other lines and the landing's headline wipe in under the fading ink on CSS time (`<Reveal>` is a CSS
  animation whose delay is set at mount), from the curtain's first frame: a busy main thread can drop frames of them but
  never pushes their start back. The HUD's version and About lines start at 780 / 820 ms, after the 760 ms glide.
- Boot leaves no sooner than 650 ms after navigation start and once the globe's first light and the first faces are
  in, waiting at most 12 s for first light and 4 s more for the faces once the script runs (the script's own download
  comes first: measured on a 40 KB/s link, the wordmark held ~19 s, its "Slow connection" line from 6 s); deep and
  share links wait up to 1.2 s more for the sharp day map (R2K2).

### Overlays over the globe: `<html data-overlay>`
A full-screen overlay that covers the globe sets `document.documentElement.dataset.overlay` to `'lightbox'`, `'about'`
or `'share'` while it is open, and deletes it as soon as its close animation STARTS (so the globe renders a fresh frame
behind the exit). The globe owns the reader (R3-16): while the attribute is set it pauses (or drops to ≤ 2 fps), and it
renders a fresh frame in the same frame the attribute goes, with no stale frame or flash. Writers: the Lightbox, the
About page (it restores an earlier `'lightbox'` value on close), and the share sheet on stacked layouts only (the
desktop and landscape-phone share dialogs leave the globe visible around them, so they don't set it).

### UI entrance → globe frame: `watched:ui-entrance` (`src/lib/uiEvents.ts`)
The results panel's handoff dispatches this window event from its commit's layout effect (with `holdMotion(900)`). On
the phone tier the globe skips its composer render in the next frame (the canvas keeps its last image), so the
browser's style / layout / paint of the new panel and the globe's draw are two tasks, not one long one (U-1).

### Renders read the cached viewport (`src/ui/system/viewport.ts`)
Components never read `window.innerHeight` (or a safe-area inset) during a render: that forces a synchronous layout
of whatever the last commit mounted (114 ms at 4× CPU on a phone). `useViewportHeight()` / `viewportHeight()` and
`safeAreaTop()` / `safeAreaSides()` are cached, updated once per frame on window and visual-viewport resizes.

### ui-results → `src/ui/results/index.ts`, `src/ui/share/index.ts`
`<ComputingReadout/>` (phase `computing`; reads `store.progress`), `<ResultsView/>` (phase `results`; reads `store.report`; drives `selectPass`, `camera`, `timeMode`/`simTime` for replay), `<ShareSheet pass={Pass} report={Report} onClose/>` (`kind="summary"` with no pass: the week; `from`: which Share opened it, recorded with its events). Share is offered at the end of the headline's second line (the week), in the photo viewer and in the pass view; the sheet is mounted on `<body>` so it paints over the viewer.

`prewarmResultsModel(report: Report): void`, exported from `src/ui/results/index.ts`: builds and caches the
`ResultsModel` for that `Report` object. The controller calls it in idle time, and only through a dynamic
`import('@/ui/results')` (never a static import, so the results chunk stays out of the boot bundle).

Phone results arrival: the overview's pass list mounts on the final report (a partial one waits, at most 8 s, with a
"Checking the archives" line under 02 / PASSES), so verified mosaics never re-sort rows under the reader; short
landscape phones (the dock, ≤ 540 px tall) set the summary in two columns, the photo beside the words. The sheet header
keeps its computing form until the overview swaps in (one headline entrance, one sheet glide), and a view change moves
the sheet to the incoming view's snap in the same beat as the outgoing view fades (the last measured snaps of that kind
of view; a pass view's flight snap is estimated the first time). The Sheet draws its body below the overlaid header
from the header's ResizeObserver (no forced layout): a header that grows over the same content glides the body 240 ms;
a swapped view is placed at once.

### backend
- `supabase/migrations/*.sql`: tables `lookups`, `shares`; RLS on, no direct anon table access; `security definer` RPCs `record_lookup`, `create_share`, `get_share`, `get_stats`. `create_share` keeps a capture only from its collection allow-list (latest: 0012, which adds `sentinel-1-rtc`; a radar share's card is the same 12.6 km crop at 20 m, toned on the server with `api/_lib/radar.ts`, the app's tone).
- `src/lib/backend.ts`: browser client wrappers (`recordLookup`, `createShare`, `getShare`, `getStats`) using `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. These must **no-op gracefully** when env vars are missing.
- `api/og.tsx`: 1200×630 share card (`@vercel/og`) in the Instrument style. Runtime cards are returned as `image/jpeg`
  (under 250 KB; PNG decoded with `fast-png`, encoded with `jpeg-js`, both pure JS so `vercel.json` `includeFiles` is
  unchanged). `public/og-default.png` stays PNG. `api/s.ts`: share page HTML with OG tags that boots the app at `/?s=<id>`. `vercel.json`: rewrites `/s/:id` and caching headers.
- **Share fallback deep link** (used when a share row can't be created): `/?q=<lat>,<lon>&n=<label>&p=<passId>`, plus
  optional pass facts `sat`, `norad`, `verdict`, `t` (ms), `alt` (km), `off` (°), `hdg` (°), `collection`, `item`,
  `cloud` (%), `gsd` (m), `spot`. Coordinates are always rounded to 0.01°. `api/s.ts` unfurls it as the pass card.
  `controller.readUrlTarget` re-centres the 7-day window on `t` when `t` is more than 6 days old.

## App flow (integrator)
`boot` (the wordmark; textures, fonts; the catalog loads in parallel) → `idle` (hero + search over the spinning globe) → `locating` → `computing`
(camera flies to place; progress readouts) → `results` (panel + timeline; selecting a pass frames it and replays the
swath sweep; captured images reveal pushbroom-style) → share.
URL state: `/?q=<lat>,<lon>&n=<label>` deep-links straight to results; adding `&p=<passId>` and the optional pass facts
(`sat, norad, verdict, t, alt, off, hdg, collection, item, cloud, gsd, spot`; see the share fallback deep link under backend)
opens that pass; `/?s=<shareId>` opens a shared pass.
