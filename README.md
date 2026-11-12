<p align="center">
  <a href="https://www.watched.earth">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="public/brand/wordmark.svg">
      <img src="public/brand/wordmark-ink.svg" alt="Watched." width="200">
    </picture>
  </a>
</p>

<h3 align="center">Something watched you this&nbsp;week.</h3>

<p align="center">
  <b>Watched</b> shows which satellites passed over any place on Earth in the last 7 days, and the real photos they took. It is free, with no sign-up, and the orbit maths runs in your browser.
</p>

<p align="center">
  <a href="https://www.watched.earth"><b>www.watched.earth</b></a>
  <br>
  <a href="#how-it-works">How it works</a> &nbsp;·&nbsp; <a href="#run-it-locally">Run locally</a> &nbsp;·&nbsp; <a href="#self-hosting">Self&#8209;hosting</a>
</p>

<p align="center">
  <a href="https://www.watched.earth/?q=25.1124,55.139&n=Palm%20Jumeirah">
    <img src="docs/readme/hero.jpg" width="100%" alt="Watched results page on desktop. A 3D globe centred on the Persian Gulf shows daylight over the Arabian Peninsula and city lights on the night side to the east, with an orange reticle on Palm Jumeirah, Dubai, labelled 25.1124°N 55.1390°E. The right-hand panel reads 'In the last 7 days, 260 satellites watched Palm Jumeirah. 28 photos were made public.' Below it is a Sentinel-2B satellite photo of the palm-shaped island, tagged Closest look, and four counts: 28 images watched, 167 passes likely watched, 1,088 passes could have pointed here and 51 passed overhead. A timeline of the week's passes runs along the bottom.">
  </a>
  <br>
  <sub>Palm Jumeirah, Dubai, on 9 November 2026. <a href="https://www.watched.earth/?q=25.1124,55.139&n=Palm%20Jumeirah">Open the same place live</a>.</sub>
</p>

## What it does

1. **Pick a place.** Search a city, a landmark or coordinates, use your location, drop a pin on the globe, or start
   from an example: Area 51, Central Park, Giza, or *Surprise me* for a famous place picked at random.
2. **It finds the passes.** While the globe flies there, your browser replays the past week of orbits for nearly 400
   imaging, weather, radar and crewed satellites, and notes every time one's field of view crossed your spot.
3. **It finds the photos.** At the same time it searches the Sentinel-2 and Landsat archives, NASA's weather
   imagery and Sentinel-1's radar images (which see through cloud and at night), matches each image to the pass that
   took it, and checks whether your spot was under cloud. The results open with a summary (*In the last 7 days, 260
   satellites watched Palm Jumeirah. 31 images were made public.*), then the images, a timeline of the week and every
   pass.
4. **Replay a pass.** The satellite flies its real track while the strip of ground its camera sees (its swath)
   sweeps across the place. The photo then develops line by line in the direction of flight, the way the
   satellite's camera recorded it.
5. **Share it.** Post the link anywhere and it shows a preview card made from the real photo, or from the pass's
   geometry when there is no photo.

<p align="center">
  <img src="docs/readme/reveal.webp" width="37.7%" alt="Animation of a pass replay. It opens on a finished Sentinel-2C photo of Palm Jumeirah with an orange reticle on the searched spot, fades to a dark raster, then a thin orange scan line moves diagonally along the satellite's track and uncovers the photo line by line while a counter runs from LINE 0000 to 1024 and the reticle locks on as the line passes it.">
  <img src="docs/readme/landing.jpg" width="60.3%" alt="The desktop landing page: the headline 'Something watched you this week.', a search field and example places (Area 51, Central Park, Giza, Uluru, Palm Jumeirah) on the left, and a globe wrapped in a halo of about 17,000 active satellites on the right.">
  <br>
  <sub>Left: a pass replay, the photo developing line by line as the satellite recorded it. Right: the landing page, with every active satellite in the catalog around the globe.</sub>
</p>

<p align="center">
  <img src="docs/readme/phone.jpg" width="39.2%" alt="Two phone screens side by side, both cropped at the bottom. Left: the mobile landing page, with a small globe inside a halo of satellites above the headline 'Something watched you this week.', a search field and example-place buttons. Right: the mobile results for Palm Jumeirah, with the globe and an orange reticle over the Gulf at the top. Below is a sheet that reads 'In the last 7 days, 260 satellites watched Palm Jumeirah. 29 photos were made public.' and shows the Sentinel-2B closest-look photo of the island.">
  <img src="docs/readme/card.jpg" width="58.8%" alt="The share card for a satellite pass. On the left is the Sentinel-2B photo of Palm Jumeirah with an orange reticle, a 1 km scale bar and the credit 'Contains modified Copernicus Sentinel data 2026'. On the right are the Watched wordmark, the date 'Sun 8 Nov 2026 · 11:02 UTC+4', the headline '260 satellites watched Palm Jumeirah.' and three readouts: altitude 792 km, off-nadir 5.4° and pixel 10 m.">
  <br>
  <sub>The same lookup on a phone, and the preview card for a shared pass.</sub>
</p>

## What *watched* means

Every pass gets one of four labels, and only the first means an image exists. The line in italics is the rule behind
each one.

| Label | What it means |
|:--|:--|
| ◆&nbsp;**Watched** | A real image of this place exists in a public archive.<br>*A Sentinel-2, Landsat or weather photo, or a Sentinel-1 radar image, was matched to the pass. A VIIRS daily mosaic still unchecked after 2.5 s also counts, if the same satellite has a verified mosaic on a later day.* |
| ◇&nbsp;**Likely watched** | A fixed camera's swath covered this place. No photo of it is published.<br>*Sentinel-2 or Landsat in daylight, or a polar weather satellite, with no photo found.* |
| □&nbsp;**Could have pointed here** | A steerable or private camera was in range. Its operator doesn't say whether it looked.<br>*A commercial camera in daylight, or a radar satellite at any hour (for Sentinel-1, whose images are public: none of this pass shows the place).* |
| +&nbsp;**Passed overhead** | Crossed your sky, with no camera known to be recording this place.<br>*The ISS or Tiangong at least 10° above the horizon, or a Sentinel-2 or Landsat pass over open ocean (outside Sentinel-2's acquisition plan).* |

The results headline (*260 satellites watched Palm Jumeirah*) counts every satellite with at least one pass,
whatever its label, so *watched* there is meant broadly; only ◆ passes come with an image. The second line counts the
images that were made public (photos, weather mosaics and radar images alike), and starts with "At least" while
archives are still answering. Geostationary weather
satellites never pass; they sit over the equator all week, so they are listed separately and not counted among the
satellites. Their images are counted, though: every full-disc image that GOES, Himawari or a Meteosat took of the
place's side of the Earth that week (one every 10 or 15 minutes, about a thousand each) is in the second line's
number, and the newest of each is shown. The app says *watched*, never *photographed*.

## Accuracy and limits

- Passes are searched for satellites whose cameras, radars or crews Watched knows about, and the geostationary
  weather satellites that can see the place are listed as watching all week. The rest of the catalog is drawn on the
  globe but not searched. Military and intelligence satellites mostly aren't in public catalogs.
- In the photos Watched shows, a pixel is 10 m across at best, bigger than a car, so you can't be seen in them.
  Commercial cameras in the *could have pointed here* group see down to about 30 cm, but their operators don't
  publish where they pointed or what they saw.
- The public orbit data (element sets) is accurate to about a kilometre when it is issued and drifts after that, so
  pass times can be off by a few seconds.
- Archives publish a few hours to a couple of days after capture, so the newest passes may not have a photo yet.
- Sentinel-2 and Landsat photos are toned the same way across the whole frame: a black point, a white point and a
  brightness curve, a little extra saturation, smoothed compression blocks and light sharpening. Nothing is added or
  removed. Opened full size, a Landsat 8 or 9 photo is sharpened with the same capture's 15 m panchromatic band (real
  detail the satellite recorded, from Landsat Level-1), and its labels then say 15 m.
- Sentinel-1 radar images are shown at 20 m, the radar's own resolution, in grey with a faint ice tint: brightness is
  how strongly the ground echoes the radar (rough ground and buildings bright, calm water dark), not light. Each
  image gets its own contrast. They never lead the photos, and the radar search never delays the results: the
  report takes them if they have answered by the time it is ready (they nearly always have).

- The geostationary weather satellites that watch a place all week are listed with their newest image where a public
  map service carries it: GOES and Himawari from NASA, the two Meteosats from EUMETSAT. That image closes the gallery
  and can be opened, replayed and shared like a pass; the others of the week are counted from the satellite's
  schedule, not fetched. Its replay shows the imager's scan line crossing the place: the time is good to about a
  minute, and the app says "about". At night Himawari and Meteosat-9 are shown in infrared, labelled *IR*: cloud tops
  by temperature, colder is lighter. NASA draws its coldest cloud tops in a colour code; Watched puts them back on
  the grey scale, in the same order. At the rim of a satellite's view an image can be part empty; it is shown small
  in its row, or not at all, and neither counted nor put in the gallery.

Everything uncertain is labelled as such in the app.

## How it works

<p align="center">
  <picture>
    <source media="(max-width: 544px) and (prefers-color-scheme: dark)" srcset="docs/readme/pipeline-dark-narrow.svg">
    <source media="(max-width: 544px)" srcset="docs/readme/pipeline-light-narrow.svg">
    <source media="(prefers-color-scheme: dark)" srcset="docs/readme/pipeline-dark.svg">
    <img src="docs/readme/pipeline-light.svg" width="100%" alt="Diagram: what runs where, for one lookup. In your browser: 01 place (search, your location or an example), 02 passes (SGP4 over 7 days, in Web Workers), 03 photos (archive search, matched to passes), 04 pixels (photo toning and cloud at your spot), 05 share (a link and a card for the pass). The service beside each step: Photon sends place names from OpenStreetMap; CelesTrak element sets arrive every 6 hours via GitHub Actions; the archives (Planetary Computer, Element 84, NASA GIBS) return scenes; Planetary Computer renders each crop and its cloud mask; and the share goes out to Vercel, which renders the card, and Supabase, which stores the link.">
  </picture>
</p>

Built with TypeScript, React 19, three.js through React Three Fiber, zustand and Vite. The pass search (SGP4, the
standard model for public orbit data) and photo toning run in your browser, in Web Workers; the backend is three
Vercel functions and an optional Supabase database.

Four parts are worth a closer look. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) covers the rest, including photo
toning, the cloud check at your spot and the share cards, and [`docs/DESIGN.md`](docs/DESIGN.md) covers the visual
system.

### A pass search with no gaps

Call *θ* the angle, at Earth's centre, between the satellite and the place, and *θ*<sub>field</sub> the largest *θ*
at which the place can be in the camera's view. That angle can change no faster than *ω*<sub>max</sub>, the orbit's
peak angular rate with a 10% margin for perturbations, plus Earth's rotation. So the coarse search steps
by |*θ* − *θ*<sub>field</sub>| / *ω*<sub>max</sub>, clamped between 5 s and 30 min. Between any two samples the
same rate limit gives a lower bound on *θ*, so every interval where *θ* could reach *θ*<sub>field</sub> is flagged,
and no pass falls between samples. Golden-section search then finds closest approach to ±0.1 s, and bisection
finds entry and exit to ±0.5 s.

Against a one-second brute force, 22 adversarial cases (both poles, the antimeridian, Null Island, swaths down to
32 km) show no missed passes; where timing is measured, the worst difference is 0.65 s. A week for all 394 satellites
(1,860 passes in the test case) takes 1.3 s on one thread in Node; the browser splits it across up to four Web
Workers, two on phones. See [`src/engine/passes.ts`](src/engine/passes.ts).

### About 17,000 satellites on the GPU

The globe draws every active satellite in the catalog (16,894 on 9 November 2026). Their element sets become mean
Keplerian elements with SGP4's own J2 and J4 secular rates, and a vertex shader solves Kepler's equation for every
object, every frame. Against full SGP4 over ±24 h, the median error in low orbit is about 17 km, one or two pixels at
globe scale, though one object in twenty is off by more than 100 km. The pass search always uses full SGP4. The globe
itself is Earth-fixed and lit by the sun's true direction, computed to about 0.01°, so the terminator, the ocean
glint and the city lights are where they really are. See [`src/engine/elements.ts`](src/engine/elements.ts).

### Archive time is not overpass time

A Sentinel-2 scene's archive timestamp (the `datetime` in its STAC record, the catalog format these archives share)
marks the start of the strip the satellite was recording, which can begin minutes before it reaches a given spot
(6 min 53 s in one measured case). A photo matches the pass of the same satellite (same NORAD catalog number) whose
closest approach falls between 10 minutes before and 60 minutes after that time, and the app always shows the
predicted pass time. See [`src/engine/match.ts`](src/engine/match.ts).

### A locked-down backend

Vercel serves the static app and three functions: share cards (`/api/og`), share pages (`/s/:id`) and the
usage-event relay (`/api/e`). Supabase holds lookups, shares and usage counts. Row-level security is on, every table
privilege is revoked, clients can only call a handful of Postgres functions, and an hourly pg_cron job rolls up and
prunes the events.

## Privacy

The orbit maths runs in your browser. The site counts how it is used; it does not track people.

| Record | What Watched keeps |
|:--|:--|
| Lookup | A cell about 10 km across (0.1°), and that place's country and town. |
| Share | The town-level place name, a point rounded to about 1 km (0.01°), the pass and its photos, and a view count. |
| Visit | What happened (searches, results, passes and photos opened, shares, errors, page speed), tied to a random ID that lives only as long as the browser tab, with the device class, your country (from Vercel's edge), the referring site, any UTM tags and the app version. |

Raw events, visits and single lookups are deleted after 48 hours. What stays is counts: usage per hour and per day,
and lookups per cell. Shares are kept.

Watched's database never stores exact coordinates, IP addresses, cookies or full referrer URLs, and the event relay
never reads the IP. The app never sends street-level place names. Vercel and Supabase see IP addresses in transit and
in their own request logs, like any host.

Other services see the place too. [Photon](https://photon.komoot.io) sees what you type, or your coordinates if you
use your location. Planetary Computer and NASA GIBS see the point and the area around it, to send the photos, and so
does EUMETSAT where a Meteosat watches the place.
Element 84 sees it only when Planetary Computer is down. Vercel Web Analytics receives the page address, which for a
place link includes its coordinates and name.

Usage events are sent only from watched.earth, and never from a development build, an automated browser or a tab
opened with `?noanalytics=1` (for as long as that tab stays open). The flag doesn't stop lookups and shares being
counted: any build with Supabase configured counts them, development included. Vercel Web Analytics is cookieless
and ignores the flag.

## Run it locally

You need Node 22.12+, 24 or 26+, the versions Vitest supports.

```bash
git clone https://github.com/dev-Armaan/satellites.git
cd satellites
npm install
npm run dev
```

The app runs at `http://localhost:5173` with no configuration. Without a backend nothing is recorded, the
places-checked counter on the landing page is hidden, and share links carry the pass in the URL instead of a short
`/s/` link.

To turn on lookups and shares:

1. Create a Supabase project and apply the migrations, as [`docs/SELF-HOSTING.md`](docs/SELF-HOSTING.md) shows.
2. Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Use the
   publishable key, never a secret key: `VITE_` variables are bundled into the JavaScript that every visitor
   downloads.
3. Run `npm run dev` as before, or `npx vercel dev` to serve the share pages and cards in `api/` as well. Vercel asks
   to link a project the first time.

The places-checked counter appears once a project has 1,000 lookups, 50 of them in the last 24 hours.

### Tests and scripts

```bash
npm test                    # engine, imagery and UI tests (Vitest)
npm run test:backend        # tests for the api/ functions
npm run typecheck           # tsc -b
npm run build               # the app and the /admin page, into dist/

npm run data:celestrak      # refresh the orbit catalog (CelesTrak asks for 2 hours between downloads)
npm run textures -- ./maps  # rebuild public/textures from the source maps in ./maps

# render share cards for sample passes to image files (needs no server or database)
npx tsx scripts/backend-render-og.ts
```

The built textures are committed, so you rarely need `npm run textures`. It needs Python 3 and Pillow, and reads the
source maps listed at the top of `scripts/build-textures.py`.

### Useful URLs

| URL | What it does |
|:--|:--|
| `/?q=lat,lon&n=name` | Opens a place directly. Add `&p=<pass id>` to open a pass. |
| `/?debug=gl` | WebGL diagnostics. |
| `/?sandbox=<name>` | Development pages (dev server only): `engine`, `backend`, `globe`, `imagery`, `results`, `shell`. |
| `/admin.html?mock=1` | The stats page with fixture data (dev server only). |

## Self-hosting

Watched is a static Vite build, three Vercel functions, an optional Supabase project and a GitHub Action that keeps
the orbit catalog fresh. To run your own copy:

1. Fork the repository and import it into Vercel. It works as is, with no backend.
2. Enable GitHub Actions on your fork so the catalog refresh runs. Forks start with scheduled workflows off.
3. For lookups, shares and stats, apply `supabase/migrations` to your own Supabase project (they need pg_cron), set
   `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in Vercel, and make yourself admin with
   `scripts/backend-set-admin.sh`. Every database script needs `SUPABASE_PROJECT_REF` and has no default, so none of
   them can touch someone else's project by accident.
4. For usage events, add your domain to `PRODUCTION_HOSTS` in `src/lib/telemetry.ts`. A fork sends none until you do.

The full guide is [`docs/SELF-HOSTING.md`](docs/SELF-HOSTING.md).

## Project layout

<details>
<summary>Show the directory tree</summary>

```
index.html            app shell and static boot screen
admin.html            /admin stats page (separate build: vite.admin.config.ts)
vercel.json           functions, headers, /s/:id and bot-unfurl routes, SPA fallback
src/
  main.tsx            entry; analytics and in-app events after first paint (production only)
  types.ts            shared contracts
  app/                phase controller, boot curtain, error notice, telemetry wiring
  engine/             catalog, satellite profiles, SGP4, pass search and worker pool, matching,
                      weather and geostationary legs, GPU elements, the report
  imagery/            STAC and GIBS, crop and mask URLs, pixels worker, cloud at your spot, Photon, time zones
  globe/              three.js / React Three Fiber scene: Earth, atmosphere, clouds, stars,
                      GPU satellites, pass sequence, swath, camera
  ui/                 system primitives, HUD, landing, results, share, About
  lib/                geo maths, backend client, telemetry, layout
  state/              zustand store and scene clock
  styles/             tokens, fonts, base
  admin/              /admin page (Supabase Auth)
  sandbox/            development-only ?sandbox= pages
api/                  og.tsx (share card), s.ts (share page), e.ts (events relay), _lib, _fonts, _assets
public/               data/ (orbit catalog), textures/, brand/, og-default.png
supabase/             migrations 0001 to 0007, SQL tests
scripts/              catalog fetch, textures, fonts, card render, migrate, admin, verify, SQL test, purge
docs/                 DESIGN.md, ARCHITECTURE.md, SELF-HOSTING.md
.github/workflows/    catalog.yml (orbit catalog refresh)
```

</details>

## Data and credits

| Source | Credit |
|:--|:--|
| Orbits | Element sets from [CelesTrak](https://celestrak.org), based on US Space Force tracking data, refreshed every 6 hours. SGP4 by [satellite.js](https://github.com/shashwatak/satellite-js). |
| Sentinel&#8209;2 | Contains modified Copernicus Sentinel data, followed by the year each photo was taken. |
| Landsat | Landsat imagery courtesy of the U.S. Geological Survey and NASA. |
| NASA&nbsp;GIBS | Imagery from NASA's GIBS, part of EOSDIS. GOES via NOAA and CIRA, Himawari via JMA. |
| Meteosat | Contains modified EUMETSAT Meteosat data, followed by the year, from [EUMETSAT's map service](https://view.eumetsat.int). |
| Archives | [Microsoft Planetary Computer](https://planetarycomputer.microsoft.com) and [Element 84 Earth Search](https://element84.com/earth-search/); Landsat's 15 m band from the [Copernicus Data Space Ecosystem](https://dataspace.copernicus.eu). |
| Places | [Photon](https://photon.komoot.io) by komoot. Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright) (ODbL). |
| Textures | [Solar System Scope](https://www.solarsystemscope.com/textures/) ([CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)), from NASA Blue Marble and Black Marble, partly by way of the three.js examples. Resized, re-encoded and repacked for this project. |
| Fonts | Instrument Sans and Serif by Instrument, Martian Mono by Evil Martians (SIL OFL 1.1). |

The screenshots in this README and the default share image contain modified Copernicus Sentinel data 2026. Licenses
and attribution for every bundled asset are in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Contributing, security and license

Issues and pull requests are welcome; [CONTRIBUTING.md](CONTRIBUTING.md) lists the checks to run first. Please report
security issues privately, as [SECURITY.md](SECURITY.md) describes, and not in a public issue.

The code is released under the [MIT License](LICENSE), © 2026 Armaan Gupta. Imagery, orbital data, textures and
fonts keep their own terms, listed above. The Watched name and wordmark identify the official site at
www.watched.earth, so please don't present a fork as the official site.

<br>

<p align="center">
  <sub>Made by Armaan Gupta · <a href="https://x.com/armaangupt0">@armaangupt0</a> on X</sub>
</p>
