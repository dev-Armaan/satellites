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
- `npm test` covers `src/**` only. The serverless functions in `api/` and the Cloudflare Worker in `worker/` have their
  own suite: `npm run test:backend`.
  Run both, plus `npm run build` (it runs `tsc -b` and two Vite builds: the app and `/admin`).
- There is no Prettier or ESLint config. Never run `npx prettier`: it downloads Prettier and rewrites files in its
  defaults (double quotes, 80 columns). House style: single quotes, no semicolons, ~120 columns, and a doc comment at
  the top of each module saying *why* it works the way it does. Follow `docs/DESIGN.md` for UI: tokens only, no raw
  font sizes or colours.

**Production, data and permissions**
- Every branch push gets a Vercel preview deploy, behind Vercel login. To open one, use the Vercel connector's
  `get_access_to_vercel_url` (a share link) and keep its cookie.
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
  `supabase/migrations/0013_*`; 0022, not applied yet, adds the time-lapse's events). A new enum value (a search source, an action) is silently stored as null until a
  migration adds it.
- Shares keep a capture only from an allow-list of collections in `create_share` (latest definition in
  `supabase/migrations/0012_*`, which adds Sentinel-1 radar); an unknown collection is dropped and the share made
  without its image. The collection lists in `api/_lib/share.ts` and `src/lib/backend.ts` must match it.
- Admin stats are precomputed hourly at :00 by pg_cron (`admin_stats_cache`, migration 0009; 0019), and the refresh
  skips itself while the rollups are behind. The page reads the stored row whatever its age and never recomputes
  (0021). Every 5 or 30 minutes over raw events overloaded the database twice (2026-11-11, 2026-11-12). Admin times are US Eastern, and so are its days (0016).
- Raw events, tabs and lookups are kept 48 hours (0016). Every admin range reads rollups (0019): hourly ones
  (`roll_event_hour_dims`: `event_hour_dims`, `event_hour_dists`, `event_tab_days` so a tab counts once a day) and daily
  ones (`roll_event_day`: `event_days`, `event_dists`, `event_alltime*`), and raw events only for the hour or so not
  rolled yet. A new number on the admin page must be rolled up there too, never computed over `public.events` (that is
  what overloaded the database). Each hour and day keeps its top 3000 cells / 200 values per breakdown (`event_keep`).
- `log_events` is open to anyone with the public key; its limits (0020) stop a script filling the database: 2000
  events per tab, 120 a minute per tab on average, 6000 events + new tabs a minute overall (counters in
  `overflight_private.event_rate`, constant cost). Over a limit, events are dropped silently. 2026-11-12's viral peak was
  2,555 a minute. Raising the overall limit raises the worst-case storage (48 hours of it) and the prune's work.
- Ad-hoc queries on production: at most an hour or two of `public.events` at a time. A 12-hour scan on 2026-11-12
  stalled the API on the small machine.
- `VITE_*` env vars are bundled into the browser. Server secrets (`CDSE_CLIENT_ID` / `CDSE_CLIENT_SECRET`) are only
  read in `api/`. Never print env values.
- Cloud sessions cannot delete GitHub branches, change repo settings or use GitHub GraphQL (`gh` REST only). The
  owner does those.

**Testing against the live site** (www.watched.earth)
- Any probe must block writes so it doesn't pollute analytics: requests matching `rpc/(create_share|record_lookup|log_events)`,
  `/api/e`, `/_vercel/insights` and `/cdn-cgi/rum` (Cloudflare Web Analytics), plus any non-GET to watched.earth or Supabase. Also add `?noanalytics=1`.
  Planetary Computer's STAC search must NOT be blocked, or no photos load: it is a GET (no CORS preflight, see
  `src/imagery/stac.ts searchPage`) that falls back to a POST if the archive refuses the GET form.
- Time a search with User Timing marks: `performance.getEntriesByName('overflight:<name>')`, for `run-report`,
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
  lazy and must not import `src/app/*`: pass callbacks in through `GlobeCanvas` props.
- Place names: towns (500+ people), states, countries and ~84,000 notable features (with an English Wikipedia
  article) come first from the offline list in `public/places/<version>/` (`src/imagery/localPlaces.ts`, ≤ 15 kB a
  search, one tile a pin), generated by `npm run data:places <GeoNames dir>` (`scripts/build-places.ts`, usage at its
  top; never edit the files or `localPlaces.gen.ts` by hand). Each rebuild adds ~10 MB to git history, so rebuild
  rarely. Landmarks people search for are curated in `scripts/landmarks.ts` (add one there, with
  checked coordinates, and rebuild). A search asks the network only when the list has < 3 matches and none exact
  (~2% of searches): Open-Meteo first (free tier ~10,000 requests a day), Photon if Open-Meteo is slow or empty;
  later rows only ever join below the offline ones. Pins far from a town ask Photon, then Nominatim.
- Time-lapse (`src/imagery/timelapse.ts`, `src/ui/timelapse/`): the place's clear Sentinel-2 looks, one a year (or the
  last twelve months), as a loop. Nothing of it loads or is asked until someone opens it (its own chunk; the row under
  the photos, the viewer's button, or a `?tl=years|seasons` link), and every request goes from the browser to Planetary
  Computer: keep both true. Frames need no alignment because every crop is on the place's grid, and they come from ONE
  tile and orbit (two light searches: which geometry, then its scenes; all geometries at once overflow the archive's
  1000-scene page over deserts). Its pictures stay out of the photo cache (they are released when it is dropped), and
  no picture shows until all are in. Its events (`timelapse_open`, `timelapse_share`) are recorded only once 0022 is
  applied.
- Back button: layers register with `src/lib/backStack.ts`. Never call `history.pushState` directly.
- Share has three entry points, each tagged `from` in its events: the headline's second line (the week's summary;
  nothing is stored), the photo viewer, and the pass view (plus the laptop lead photo's icon). The sheet and the
  photo viewer are portals on `<body>`: the app root is `position: fixed`, so nothing inside it can paint over them.
- Global keys: Main's Esc handler respects `defaultPrevented`. An overlay that owns Esc listens in the capture phase
  and calls `preventDefault()`.
- iOS: tapping a non-input element blurs the focused field before `click` fires. Choose touch taps on `pointerup`
  (see `SearchBox.tsx`).
- Vercel functions use the fetch-style handler (`export default { fetch }`) and are registered in `vercel.json`
  (`maxDuration`). Vercel passes the query string percent-encoded in `req.url`.
- The site is moving to a Cloudflare Worker (`worker/`, `wrangler.jsonc`) that runs the same handlers. Its routes
  (`worker/router.ts`) and static headers (`public/_headers`) mirror `vercel.json`, and tests keep them equal: change
  both. Workers run only WebAssembly bundled at deploy time, so the card renderer takes its fonts and WebAssembly
  from `api/_lib/bundled.ts` there. After `npm run build`, `npm run dev:worker` runs it locally.
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
