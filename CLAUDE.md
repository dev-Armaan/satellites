# Notes for Claude Code sessions

## Commits

- The owner is the **author** of every commit; Claude stays the **committer**. In each fresh clone, before the first
  commit:
  `git config author.name "dev-Armaan"` and `git config author.email "134523744+dev-Armaan@users.noreply.github.com"`.
  Leave `user.name` / `user.email` as the session set them (Claude): the session signs commits with Claude's key, and
  GitHub shows a commit as Verified only when the signing key belongs to the committer. Making the owner the committer
  too turns every commit Unverified (reason `unknown_key`). Claude also goes in a `Co-Authored-By:` trailer.
- Split work into many small commits, one per self-contained change (a fix, a feature's layer, its tests, its docs),
  each building and passing tests on its own, rather than one combined commit. Follow-up fixes get their own commits.
- `integration` is the working branch; a push to `main` deploys production. The catalog bot commits to `main`, so
  merge `origin/main` into `integration` before pushing `main`.

## Quirks that trip agents up

**Checks and style**
- `npm test` covers `src/**` only. The serverless functions in `api/`, the Cloudflare Worker in `worker/` and the
  scripts' tests (`scripts/**/*.test.ts`) have their own suite: `npm run test:backend`.
  Run both, plus `npm run build` (it runs `tsc -b`, two Vite builds: the app and `/admin`, then
  `scripts/build-seo.ts`, which writes the place pages, sitemap and robots.txt into `dist/`).
- There is no Prettier or ESLint config. Never run `npx prettier`: it downloads Prettier and rewrites files in its
  defaults (double quotes, 80 columns). House style: single quotes, no semicolons, ~120 columns, and a doc comment at
  the top of each module saying *why* it works the way it does. Follow `docs/DESIGN.md` for UI: tokens only, no raw
  font sizes or colours.

**Production, data and permissions**
- Cloudflare is the only host (Workers Builds): a push to `main` runs `npm run build` and `wrangler deploy`; a push
  to any other branch runs `npm run build` and `wrangler versions upload`, which gives that branch a preview at
  `https://<branch, non-alphanumerics as ->-watched.<account subdomain>.workers.dev` (the subdomain: Cloudflare API,
  `/accounts/<id>/workers/subdomain`; a build takes about two minutes:
  `/accounts/<id>/builds/workers/<tag>/builds`). Previews are `noindex` and write no events. Vercel no longer builds:
  `vercel.json` is only the switch that tells it not to. Don't delete the Vercel project: it is what redirects the
  launch address (`overflight-psi.vercel.app`) to the site. `wrangler.jsonc` names the KV namespace by id on purpose:
  without one a build takes the binding from the Worker's LAST UPLOADED version, and a branch from before the frame
  cache uploads one that has none, after which every build fails ("a namespace with this account ID and title already
  exists", 2026-11-21), production's too. A build that fails that way: merge `main` into the branch.
- Supabase project `etiebfmgepkcewkkbxwi`: use the Management API
  (`POST https://api.supabase.com/v1/projects/etiebfmgepkcewkkbxwi/database/query`; the session proxy adds the token).
  Do NOT use the Supabase MCP connector: it points at an unrelated project (`xcinlndzgpzjmvmeujor`).
- There is no migration-history table. A migration is applied by running its file, and only after the owner says
  "apply 000N": `scripts/backend-sql.sh etiebfmgepkcewkkbxwi supabase/migrations/000N_*.sql`, after its checks pass with
  `scripts/backend-sql.sh etiebfmgepkcewkkbxwi --rollback <migration> <its test>` (both allowed by
  `.claude/settings.json`, so no prompt). Every production write goes through that script, and only for what the owner
  asked. Never run `supabase/tests/0004_*` against production (its DDL deadlocks against live traffic). Never
  delete real data, and never use a service-role or secret key; only the publishable key, which is public.
- Analytics props are allow-listed in SQL (`overflight_private.event_props`, latest definition in
  `supabase/migrations/0031_*`: 0029 adds `support_click`, the Buy Me a Coffee link's presses by place, 0030
  two more places, and 0031 where a search's wait went: eight numbers on `results`, from a quarter of tabs,
  `searchLegs` in `src/app/telemetry.ts`, on the admin page beside SPEED). A new enum value (a search source, an
  action) is silently stored as null until a migration adds it.
- A migration can be tried without production: PostgreSQL 16 is in cloud containers (`/usr/lib/postgresql/16/bin`,
  run as `postgres`, data outside `/tmp`). Every migration applies in order given roles `anon`, `authenticated`,
  `service_role`, schema `extensions` with pgcrypto, an `auth` schema (`users`, `role()`, `uid()`, `jwt()`) and a
  stand-in `cron` schema (`job`, `schedule`, `unschedule`, `alter_job`); `admin_stats_compute` then hashes the same as
  production's, and the tests run as on production (`begin; <migration>; <test>; rollback`).
- Shares keep a capture only from an allow-list of collections in `create_share` (latest definition in
  `supabase/migrations/0012_*`, which adds Sentinel-1 radar); an unknown collection is dropped and the share made
  without its image. The collection lists in `api/_lib/share.ts` and `src/lib/backend.ts` must match it.
- Admin stats are precomputed hourly at :00 by pg_cron (`admin_stats_cache`, migration 0009; 0019), and the refresh
  skips itself while the rollups are behind. The page reads the stored row whatever its age and never recomputes
  (0021). Every 5 or 30 minutes over raw events overloaded the database twice (2026-11-11, 2026-11-12). Admin times are US Eastern, and so are its days (0016).
- The admin page's sessions, searches and shares are the stored totals plus what was counted since (0023): `log_events`
  adds each batch's searches, shares and tabs to the `event_rate` row it already writes, and `admin_live` sums them since
  the stored stats' `computed_at` (read on every load, Refresh, and every 30 s). Another live number goes there too, as
  one more counter column: never a read of `public.events`. The counters are kept 6 hours. 0025 gives the counts
  hour by hour, with the tabs active in each hour, and the page adds them to the activity chart's bars
  (`src/admin/live.ts`). 0026 counts time-lapse opens the same way.
  A `--rollback` run of one of these migrations with its test holds `event_rate` for the whole run, and `log_events`
  calls that wait over 3 s are lost (two runs took 5–7 s on 2026-11-13): run such a test once, at a quiet time.
- Raw events, tabs and lookups are kept 48 hours (0016). Every admin range reads rollups (0019): hourly ones
  (`roll_event_hour_dims`: `event_hour_dims`, `event_hour_dists`, `event_tab_days` so a tab counts once a day) and daily
  ones (`roll_event_day`: `event_days`, `event_dists`, `event_alltime*`), and raw events only for the hour or so not
  rolled yet. A new number on the admin page must be rolled up there too, never computed over `public.events` (that is
  what overloaded the database). Each hour and day keeps its top 3000 cells / 200 values per breakdown (`event_keep`).
- `log_events` is open to anyone with the public key; its limits (0020) stop a script filling the database: 2000
  events per tab, 120 a minute per tab on average, 6000 events + new tabs a minute overall (counters in
  `overflight_private.event_rate`, constant cost). Over a limit, events are dropped silently. 2026-11-12's viral peak was
  2,555 a minute. Raising the overall limit raises the worst-case storage (48 hours of it) and the prune's work.
- Error events: a fault notice's `msg` is the sentence the visitor read, then the cause in brackets (`errorCause` in
  the store, `phaseErrorMsg`). "Could not load the orbit catalog" is said only for the loader's own failure, after three
  attempts (`CatalogLoadError`). Before blaming the site for a burst of errors, look at who sent them: on 2026-11-18,
  1,400 tabs in two minutes (182 with that notice) were an automated link scanner: Windows desktop Chrome, no referrer,
  data-centre countries, no searches, and `Object Not Found Matching Id` errors next to them. Cloudflare had answered
  every one of its catalog requests with a full 200 (zone analytics: GraphQL `httpRequestsAdaptiveGroups`).
- Ad-hoc queries on production: at most an hour or two of `public.events` at a time. A 12-hour scan on 2026-11-12
  stalled the API on the small machine.
- The orbit catalog bot (`.github/workflows/catalog.yml`, `scripts/fetch-catalog.ts`) asks CelesTrak through
  `scripts/celestrak.ts`: any answer but 200 ends the run's asking (CelesTrak's usage policy; an address that keeps
  asking goes to its firewall, and a runner's address is shared). Only a request with no answer is asked again. The
  retry is the next slot: every 3 hours, skipped while the catalog is under 4 hours old. Never add fast retries.
- `VITE_*` env vars are bundled into the browser. Server secrets (`CDSE_CLIENT_ID` / `CDSE_CLIENT_SECRET`) are only
  read in `api/`. Never print env values.
- Cloud sessions cannot delete GitHub branches, change repo settings or use GitHub GraphQL (`gh` REST only). The
  owner does those.

**Testing against the live site** (www.watched.earth)
- Any probe must block writes so it doesn't pollute analytics: requests matching `rpc/(create_share|record_lookup|log_events)`,
  `/api/e` and `/cdn-cgi/rum` (Cloudflare Web Analytics), plus any non-GET to watched.earth or Supabase. Also add `?noanalytics=1`.
  Planetary Computer's STAC search must NOT be blocked, or no photos load: it is a GET (no CORS preflight, see
  `src/imagery/stac.ts searchPage`) that falls back to a POST if the archive refuses the GET form.
- Time a search with User Timing marks: `performance.getEntriesByName('overflight:<name>')`, for `engine-run`
  (the engine was started: for a link, before `run-report`), `run-report`,
  `engine-partial`, `engine-final`, `hero-ready`, `set-report` and `results`.
- Results are a rolling 7-day window, so any place or scene picked for a test goes stale within days. Find current
  data first (Planetary Computer STAC). Its Landsat Level-2 archive lags a few days.
- Playwright: Chromium only (no WebKit in cloud containers). Use `--disable-3d-apis` for anything that doesn't need
  the globe. With the globe, use `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader` at about
  1280×800: it runs at 2–3 fps, so animation, drift and timing results there are not representative. For a
  long-press, send `Input.dispatchTouchEvent` over CDP.
- Keep screenshots and scripts in the scratchpad, never in the repo.

**How the app is built** (read before changing these areas)
- Photos: every Sentinel-2 / Landsat crop is toned in the pixels worker (`src/imagery/pixels.ts`) before it is
  shown. Never put a Planetary Computer URL straight into an `<img>`. Photo URLs are canonical cache keys
  (`cardUrl` / `thumbUrl` / `hiResUrl` in `src/ui/results/lib/photos.ts`): a slightly different URL is a second
  download and a second decode. One `<img>` element per view, per photo (`images.ts`). Owner rule: a photo never
  reloads, re-fades or flickers.
- Planetary Computer renders every crop on demand (1–2 s, no cache on its side). The results screen deliberately
  waits for the final report and the hero photo before it appears (R-M1, `controller.ts showFirst`). Don't "speed it
  up" by painting earlier: the headline would change after it is shown.
- NASA GIBS: the ~35 "is there an image of this place that day" checks a search makes read GIBS's pre-cut tiles
  (`src/imagery/gibsTiles.ts`), never WMS. GIBS renders every WMS request on demand with no cache: on 2026-11-12, at
  250 searches a minute, the checks alone were 9,000–17,000 renders a minute, WMS answers went from 0.5 s to 5–45 s
  and a search's weather photos from 32 to 4. WMS is only for pictures that are shown (a few per search). Anything
  new that is asked once per search or more goes to the tiles, and a timed-out request to a public archive is not
  asked again (`retryTimeouts: false`).
- Globe: React Three Fiber with a manual camera (`cameraMath.ts` applies an off-axis lens shift). DOM labels follow
  scene points every frame through `runtime.anchors` and `anchorListeners`, never React state. The globe chunk is
  lazy and must not import `src/app/*`: pass callbacks in through `GlobeCanvas` props. A WebGL context the browser took
  and gave back (a phone's background tab) gets a whole new canvas (`contextLoss.ts`: the sharper maps keep no pixels
  to re-upload, so the Earth came back black); to see it, `WEBGL_lose_context` in the console.
- Lazy chunks of the app shell go through `src/app/chunks.ts` (asked again after a failure, and the last failure
  reported): a results panel that cannot load ends in the fault notice, never a globe with nothing beside it. A render
  exception anywhere shows the same notice (`AppBoundary`).
- A chunk is named after its module, and ad blockers block some names: AdGuard's `/clarity-*.js` (Microsoft Clarity)
  blocked `src/lib/clarity.ts`'s chunk, so every search failed with no globe for visitors with that list on (2026-11-22;
  now `clearness.ts`). The build fails on any name the lists would block (`scripts/blockerNames.ts`, rules from
  `npm run data:blocker-rules <dir>`, usage at the top of `scripts/build-blocker-rules.ts`). Fix it by renaming the
  module. When a visitor reports a broken page and uses a blocker, test the asset names against the real lists.
- Place names: towns (500+ people), states, countries and ~84,000 notable features (with an English Wikipedia
  article) come first from the offline list in `public/places/<version>/` (`src/imagery/localPlaces.ts`, ≤ 15 kB a
  search in English, ~20 kB in a language whose names it also looks up, one tile a pin), generated by `npm run data:places <GeoNames dir>` (`scripts/build-places.ts`, usage at its
  top; never edit the files or `localPlaces.gen.ts` by hand). Each rebuild adds ~10 MB to git history, so rebuild
  rarely. Landmarks people search for are curated in `scripts/landmarks.ts` (add one there, with
  checked coordinates, and rebuild). A search asks the network only when the list has < 3 matches and none exact
  (~2% of searches): Open-Meteo first (free tier ~10,000 requests a day), Photon if Open-Meteo is slow or empty;
  later rows only ever join below the offline ones. Pins far from a town ask Photon, then Nominatim. Places stay English
  in the data; on screen they are named in the visitor's language by generated tables (`npm run data:exonyms <GeoNames
  dir>`, `scripts/build-exonyms.ts`; rules and hand fixes in `scripts/exonyms.ts`; never edit `exonyms.gen.ts`), which
  also let a search typed in that language (Москва, Hà Nội) be answered offline. A table over 5 kB is a chunk of its
  own, fetched at idle and awaited before any name shows (a search reads its own offline file meanwhile): a name never
  changes once shown (docs/I18N.md, Place names). Every wait for names (the table, its search, a link's country) is 3 s
  at most, and never twice for one download (a prefetch is no wait: `prefetchExonyms`); a table loads through
  `tableChunk` (`src/i18n/optionalChunks.ts`), so its failure never reloads the page. A country is its code's row of the
  list (kind `c`), whatever the list calls it (Palestinian Territory, The Netherlands), and in a language with names,
  rows of one country that read alike (name and where line) are one row; the < 3 matches rule counts the places before
  they are merged.
- Time-lapse (`src/imagery/timelapse.ts`, `src/ui/timelapse/`): the place's clear Sentinel-2 looks, one a year, as a
  loop. Nothing of it loads or is asked until someone opens it (its own chunk; the row under the photos, the viewer's
  button, or a `?tl=1` link), and every request goes from the browser to Planetary Computer: keep both true. Frames
  need no alignment because every crop is on the place's grid, and they come from ONE tile and orbit that covers the
  whole square (two light searches: which geometry, then its scenes; all geometries at once overflow the archive's
  1000-scene page over deserts). The years turn through the seasons (each aims for the next quarter of the calendar,
  and falls back to any clear date; owner), except in the war zones people search for (`seasonRegions.ts`: Gaza
  Strip, West Bank, Ukraine, Lebanon): there every year is the one season that shows the war's change most, and only
  that season, inside the calendar year (owner, 2026-11-16). Glaciers outside the tropics get the same treatment: every year
  is the end of the melt season (mid-August north, mid-February south), from a 0.1° ice grid built by
  `scripts/build-glaciers.py` into `glaciers.ts` (it ships only in the time-lapse chunk; owner, 2026-11-16). Its pictures stay out of the photo cache (released when it is dropped);
  the waiting screen develops a small one per year, the big picture shows only when all are in. `Video` renders the
  loop to an MP4 in the browser (`video.ts`: WebCodecs + `mp4-muxer`, a chunk fetched on that press; H.264 first), in
  two presses, because a share sheet or a download only opens inside a press. Its events (`timelapse_open`,
  `timelapse_share`) are allow-listed in 0022 and charted on the admin page by 0024 (a fifth number in the series,
  `event_hours.timelapse`, and two breakdowns).
- Search engines (`src/seo/`, `scripts/build-seo.ts`, `src/lib/placePage.ts`; docs/ARCHITECTURE.md has the rules):
  the build writes ~2,100 place pages (`/place/<slug>`: the built index.html with that place's title, canonical,
  card and the place in a JSON script), their list (`/place`), `sitemap.xml` and `robots.txt`. Keep these true: the
  set is closed (`src/seo/places.ts` chooses it from the offline place list; never make a page from a typed address
  or an `n=` label, which would put other people's words in titles here); a slug never changes once given; a place
  page IS the app opened on that place, and its static text states no count; every `?q=` and `?s=` address is
  canonical to `/`; the text under the app stays `display: none` while the loading screen is up, so it is never the
  page's LCP; robots.txt never closes `/api/` (link previews fetch `/api/og`, and X's and Facebook's fetchers obey
  it). index.html's head between the `seo:head` markers is `headTags(homeMeta())`: change the generator, then the
  copy (a test compares them). Search engines and assistants never get the app (`src/lib/reader.ts`, by user
  agent): the text under the app is their page, because a crawler's renderer does not wait for a search (Google's
  live test pictured the computing panel at 4.4 s, 2026-11-21). The Worker hands them the page with the app already
  taken out (`worker/router.ts appPage`, `src/seo/readerPage.ts`: no loading screen, no script, no preloads), so the
  text waits for nothing: left to the browser it showed only after the app's 28 scripts had loaded, over half of
  Googlebot's fetches were those scripts, and Search Console listed each renamed one as "Crawled, currently not
  indexed" (2026-11-26). The build fails if a page's app cannot be taken out. So that text is what gets indexed: keep it true of
  the page for anyone (no counts), and when the app gains something worth finding, say it there too. Page testers
  (Lighthouse, headless Chrome, so Playwright) still get the app; the client sends no events for either
  (`CRAWLER_RE`). To see a page as Google does, load it with a Googlebot user agent. `src/app/head.ts` is the only
  writer of the tab title and the canonical link once the app runs: a place's title is the static page's sentence
  in English (`pageTitle`) and "<place> · Watched" in any other language, and English's `app.documentTitle` must
  stay index.html's title (`HOME_TITLE`; tests hold both). The pages themselves are English only (no `hreflang`:
  a language is a preference, not an address). One page a point: a landmark listed twice at the same coordinates
  gets the first name's page (`NAMED_TODAY` in `src/seo/places.ts` for the exceptions).
- A link's search (`?q=`, a place page, a share) starts under the loading screen, once the globe's code is in
  (`controller.ts startAhead`, `src/app/engineRun.ts`), and `runReport` takes it over when the curtain lifts: the
  archives' waits overlap the globe's start-up. Keep both halves true: nothing of it reaches the store or the screen
  before `runReport`, and it never starts before the globe's code (at 1.6 Mbit/s a search begun at the first moment
  of boot pushed first light from 7.3 s to 10.2 s for no earlier results, 2026-11-27). On a slow connection a link's
  results wait for the orbit catalog (0.5 MB, low priority behind the sharp day map), not for the archives.
- Back button: layers register with `src/lib/backStack.ts`. Never call `history.pushState` directly. The address is
  written through `addressOf` / `homePath` (`src/lib/placePage.ts`): a place page keeps its own path only while its
  place is on screen.
- Share has three entry points, each tagged `from` in its events: the headline's second line (the week's summary;
  nothing is stored), the photo viewer, and the pass view (plus the laptop lead photo's icon). The sheet and the
  photo viewer are portals on `<body>`: the app root is `position: fixed`, so nothing inside it can paint over them.
- Global keys: Main's Esc handler respects `defaultPrevented`. An overlay that owns Esc listens in the capture phase
  and calls `preventDefault()`.
- iOS: tapping a non-input element blurs the focused field before `click` fires. Choose touch taps on `pointerup`
  (see `SearchBox.tsx`).
- The site is one Cloudflare Worker (`worker/`, `wrangler.jsonc`): `worker/router.ts` holds the routes and
  `public/_headers` the static files' headers (a response the Worker builds itself never gets that file's headers:
  the router adds them). The handlers in `api/` take a `Request` and return a `Response`; the Worker imports each by
  name (`handleOg`, `handleSharePage`, …). The edge cache (`router.ts cached`) keeps a card and a pan crop under what
  their handler reads, not the address as it came (`cardCacheQuery` in `api/_lib/share.ts`, `panCacheQuery`): a
  parameter a card starts to read must be added there, or two cards share an entry (a test holds this). `/api/pan`
  remembers a refusal from CDSE (403: the month's quota is spent, as from 2026-11-20; 429) for 15 minutes and asks
  nothing meanwhile. Workers run only WebAssembly bundled at deploy time, so the card renderer
  takes its fonts and WebAssembly from `api/_lib/bundled.ts` there, and reads them from disk under Node (tests,
  scripts). After `npm run build`, `npm run dev:worker` runs it locally.
- Admin map (`src/admin/WorldMap.tsx`, geometry in `placeMap.ts`): the searched 0.1° cells on a ground map. The
  ground (`land.gen.ts`: land, large lakes, borders) is generated by `scripts/build-admin-land.py` from Natural Earth
  (usage at its top; never edit it by hand, and only the admin bundle may import it). Keep these true: a circle's area
  is its searches; signal is only on the circles, and the long tail is grey dust whose count the key states; names
  come from the page's top places looked up in the offline list, never from the town nearest a cell (Central Park's
  cell is nearest North Bergen); the line under the map says what share of all searches the kept cells are. To look at
  it with real numbers, serve the stored stats in place of the fixture (`page.route` on `src/admin/fixture.ts`): the
  fixture is shaped like them but far smaller.
- Honest labelling is a product rule: a label (resolution, "watched", counts) must say exactly what is on screen.
- Sentinel-1 radar images (`sentinel-1-rtc`) are real images but not photos: `isDetailed` is false for them, they
  never lead or get a cloud check, and their crops are toned by `radarTone.ts` (route new radar URLs through
  `isRadarUrl`). The radar search must never be awaited by the report: it is used only if it has already answered.
  The second line counts every image in one number ("N images were made public"; owner).
- Geostationary images: each public watcher's newest frame is a capture plus a pass flagged `geostationary`
  (`engine/geostationary.ts geoScanPass`: its track, heading and speed are the SCAN LINE's, not the satellite's). The
  line is where the plane the mirror sweeps cuts the Earth (`scanLine`: a circle the width of the disc, straight seen
  from the spacecraft), never a great circle around the track: the globe draws it with `swath.ts buildScanRibbon` and
  the curtain's foot, and a place at the disc's edge must be on it (Abidjan from GOES-19 was not, 2026-11-12). It
  can be selected, replayed and shared like a pass, but must stay out of everything that counts passes or satellites
  (filter on `pass.geostationary`). The images line counts the watchers' frames from `report.geo`, never from these
  captures, so the number is final before a frame loads. The engine never waits for a frame. Ask EUMETSAT only for
  listed frame times (`src/imagery/eumetsat.ts`).
- Meteosat frame cache (`api/_lib/geoGrid.ts`, `geoFill.ts`, `geoCut.ts`, `api/geo.ts`, `api/geo-frames.ts`):
  EUMETSAT wrote on 2026-11-17 that the app's visitors were far beyond fair use of its map service (each search asked
  it for a frame list and a 176 px picture per Meteosat: about 1,000 pictures a minute at the peak of 2026-11-15) and
  that it would throttle or block us; its measure is about one request a minute per layer. So the Worker's cron
  fetches each frame ONCE (four 2048 px JPEG pieces a layer), keeps it about an hour as raw 512 px tiles in Workers KV
  (`GEO_FRAMES`) and cuts every small picture (up to 176 px) itself; the app reads `/api/geo-frames` and `/api/geo`.
  Keep all of these true: nothing a visitor does may add a request to EUMETView except opening a frame (its 1024 px
  card, still direct, to `/geoserver/wms`): the globe never fetches a Meteosat frame ahead (`acquisition.ts coverPass`
  leads with a Sentinel-2 / Landsat photo or a daily mosaic, as the panel does; "not from GIBS" let Meteosat through),
  and `/api/og` asks EUMETView only for a STORED share's frame, a card drawn from its address saying "Image opens in
  the app"; the app NEVER falls back to EUMETView when the cache does not answer (a
  broken cache would send everyone there at once), and a Meteosat picture is asked for once, never retried (the panel's loader, the globe's `textures.ts askedOnce`, and the card, for which no picture is final); the fill
  stays under one request a minute per layer (a new layer or a finer grid multiplies it: do the sum first). Pieces
  are JPEG because EUMETView's download speed is the limit (50–165 kB/s; the same piece as PNG is 7 MB). JPEG work
  in the Worker is MozJPEG in WebAssembly (`worker/jpegCodec.ts`): jpeg-js needs ~116 MB to decode a piece, against
  a Worker's 128 MB. KV is eventually consistent (up to a minute), which is why a frame is listed two minutes after
  it is stored and the fill keeps its own state key. The Worker stores no logs (Workers Logs would bill every
  request): what the fill's last 40 working runs saw is in that state, KV key `fill`, field `log` (read it with the
  Cloudflare API: `…/storage/kv/namespaces/<id>/values/fill`). EUMETView publishes a frame 21–29 minutes after it
  is taken, and its cached list can lag minutes more (seen in the log on 2026-11-17), so every second read asks its tile service. `npm run dev` has no cache: the Meteosat rows say
  "No image just now" there; `npx wrangler dev --test-scheduled` has one (start a fill with `/__scheduled`, see
  docs/SELF-HOSTING.md). Cloud containers cannot reach EUMETView from `wrangler dev` (workerd ignores the proxy): set
  `GEO_UPSTREAM` to a local stand-in that serves downloaded pieces.
