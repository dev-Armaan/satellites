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
  Pick any place on Earth. Watched shows every satellite that passed over it in the last 7 days, and the real images they took.<br>
  Free, no sign-up. The orbit maths runs in your browser.
</p>

<p align="center">
  <a href="https://www.watched.earth"><b>www.watched.earth</b></a>
  <br>
  <sub>Over a million visits in its first week · 500 points on <a href="https://news.ycombinator.com/item?id=50428907">Hacker News</a> · MIT licensed</sub>
</p>

<p align="center">
  <a href="https://www.watched.earth/?q=25.1124,55.139&n=Palm%20Jumeirah">
    <img src="docs/readme/hero.jpg" width="100%" alt="Watched on a laptop. A night-side globe centred on the Gulf, city lights across Arabia and India, an orange reticle on Palm Jumeirah. The panel on the right reads 'In the last 7 days, 262 satellites watched Palm Jumeirah. 1,713 images were made public.' above a Sentinel-2B photo of the island tagged Closest look, a Time-lapse row and four pass counts. A timeline of the week runs along the bottom.">
  </a>
  <br>
  <sub>Palm Jumeirah, Dubai, 14 November 2026. <a href="https://www.watched.earth/?q=25.1124,55.139&n=Palm%20Jumeirah">Open it live</a>.</sub>
</p>

## What it does

- **Finds the passes.** Your browser replays the week's orbits for about 400 imaging, weather, radar and crewed
  satellites and notes every time one could see your spot.
- **Finds the images.** It searches the Sentinel-2, Landsat and Sentinel-1 radar archives and NASA's and EUMETSAT's
  weather imagery, matches each image to the pass that took it, and checks whether your spot was under cloud.
- **Replays a pass.** The satellite flies its real track while its swath sweeps the place, then the photo develops
  line by line in the direction of flight, the way the camera recorded it.
- **Plays a time-lapse.** One clear Sentinel-2 look a year since 2015, the same 10 km square every time, as a loop
  you can save as a video.
- **Shares it.** Every link unfurls into a card made from the real photo.

<p align="center">
  <img src="docs/readme/reveal.webp" width="49%" alt="A pass replay: an orange scan line moves along the satellite's track and uncovers a Sentinel-2C photo of Palm Jumeirah line by line, while a counter runs from LINE 0000 to 1024.">
  <img src="docs/readme/timelapse.webp" width="49%" alt="A time-lapse of Egypt's New Administrative Capital from 2015 to 2026: bare desert with one highway becomes a grid of districts, parks, towers and ring roads, one clear Sentinel-2 frame a year.">
  <br>
  <sub>A pass replay, and eleven years of Egypt's new capital rising out of the desert.</sub>
</p>

<p align="center">
  <img src="docs/readme/phone.jpg" width="39.6%" alt="Two phone screens. Left: results for Palm Jumeirah, the globe at night above a sheet that reads '262 satellites watched Palm Jumeirah. 1,713 images were made public.' with a Share button, gallery filters and the closest-look photo. Right: the time-lapse of Egypt's New Administrative Capital at 2024, with a year slider, Share and Video buttons.">
  <img src="docs/readme/card.jpg" width="59.4%" alt="The share card for a pass: the Sentinel-2B photo of Palm Jumeirah with a reticle and a 1 km scale bar on the left; on the right the date, the headline '260 satellites watched Palm Jumeirah.' and altitude 792 km, off-nadir 5.4° and pixel 10 m.">
  <br>
  <sub>On a phone, and the card a shared pass unfurls into.</sub>
</p>

## What *watched* means

Every pass gets one of four labels. Only the first comes with an image.

| | Label | Means |
|:--|:--|:--|
| ◆ | **Watched** | A real image of this place from this pass is in a public archive. |
| ◇ | **Likely watched** | A camera that is always on (Sentinel-2, Landsat, polar weather) covered the place, but no image of it was published. |
| □ | **Could have pointed here** | A steerable or commercial camera was in range. Its operator doesn't say whether it looked. |
| + | **Passed overhead** | Crossed your sky with no camera known to be recording: the ISS, Tiangong, a pass over open ocean. |

Geostationary weather satellites never pass; they watch all week, so their images are counted but they are not. The
app says *watched*, never *photographed*. The exact rules behind each label and number are in
[`docs/ACCURACY.md`](docs/ACCURACY.md).

**What it can't see.** Photos are 10 m a pixel at best, so no one can be made out in them. Commercial satellites
that see down to 30 cm don't publish where they pointed, and military ones mostly aren't in public catalogs. Public
orbits drift by about a kilometre, so pass times can be off by a few seconds. Archives publish hours to days after
capture, so the newest passes may not have an image yet.

## How it works

<p align="center">
  <picture>
    <source media="(max-width: 544px) and (prefers-color-scheme: dark)" srcset="docs/readme/pipeline-dark-narrow.svg">
    <source media="(max-width: 544px)" srcset="docs/readme/pipeline-light-narrow.svg">
    <source media="(prefers-color-scheme: dark)" srcset="docs/readme/pipeline-dark.svg">
    <img src="docs/readme/pipeline-light.svg" width="100%" alt="Diagram: what runs where, for one lookup. In your browser: 01 place, 02 passes (SGP4 over 7 days, in Web Workers), 03 photos (archive search, matched to passes), 04 pixels (photo toning and cloud at your spot), 05 share. The service beside each step: a built-in GeoNames town list for names, with Photon as a backup; CelesTrak element sets every 6 hours via GitHub Actions; the archives (Planetary Computer, Element 84, NASA GIBS); Planetary Computer rendering each crop and its cloud mask; and Cloudflare, which renders the card, with Supabase storing the link.">
  </picture>
</p>

TypeScript, React 19, three.js through React Three Fiber, zustand and Vite. The pass search and the photo toning run
in Web Workers in your browser. The server side is a few small functions on a Cloudflare Worker, the Worker's
hour-long cache of EUMETSAT's newest Meteosat frames, and an optional Supabase database.

### A pass search that can't miss

Let *θ* be the angle at Earth's centre between the satellite and the place, and *θ*<sub>field</sub> the widest *θ*
at which the place is in view. *θ* can't change faster than the orbit's peak angular rate plus Earth's rotation, so
the search steps by |*θ* − *θ*<sub>field</sub>| / *ω*<sub>max</sub> (5 s to 30 min) and flags every interval where
*θ* could reach the field, so no pass falls between samples. Golden-section search then pins closest approach to
±0.1 s.

Against a one-second brute force over 22 adversarial cases (both poles, the antimeridian, Null Island, 32 km swaths)
it misses nothing, and the worst timing difference is 0.65 s. A week for every profiled satellite takes 1.3 s on
one thread. [`src/engine/passes.ts`](src/engine/passes.ts)

### 17,000 satellites on the GPU

<p align="center">
  <img src="docs/readme/landing.jpg" width="100%" alt="The landing page: the headline 'Something watched you this week.', a search field, Use my location, example places (Area 51, Central Park, Giza, Surprise me) and a hint to click the globe to drop a pin on the left; on the right, the globe over the Pacific wrapped in a halo of about 17,000 active satellites.">
</p>

The globe draws every active object in the catalog. A vertex shader solves Kepler's equation for each one, every
frame, from mean elements with SGP4's own J2 and J4 drift: about 17 km median error in low orbit, a pixel or two at
globe scale. The pass search always uses full SGP4. The sun's direction is computed to about 0.01°, so the
terminator, ocean glint and city lights are where they really are. [`src/engine/elements.ts`](src/engine/elements.ts)

### Archive time is not overpass time

A Sentinel-2 scene's timestamp marks the start of the strip being recorded, up to 7 minutes before the satellite
reached your spot. Images are matched to the pass of the same satellite whose closest approach falls 10 minutes
before to 60 minutes after that time, and the app always shows the predicted pass time.
[`src/engine/match.ts`](src/engine/match.ts)

### Every frame on one grid

Every crop is cut on the place's own UTM grid, in the satellite's whole pixels (10 m for Sentinel, 30 m for
Landsat), so the archive's pixels are copied, not warped, and images of one place line up exactly with no alignment
step. That is what lets the time-lapse play eleven years from a single tile and orbit with no wobble. [`src/imagery/timelapse.ts`](src/imagery/timelapse.ts)

### A backend that can only do four things

Share cards, share pages, the event relay and Landsat's 15 m band. In Supabase, row-level security is on, every
table privilege is revoked, the public key can call only a handful of Postgres functions with built-in rate limits,
and pg_cron rolls up and prunes the usage events every hour.

More in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and, for the visual system, [`docs/DESIGN.md`](docs/DESIGN.md).

## Privacy

- **Coarse by design.** A lookup is stored as a 10 km cell; a share, as a point rounded to about 1 km. No exact
  coordinates, IP addresses or full referrers, ever.
- **Short-lived.** Raw events and visits are deleted after 48 hours, leaving only counts. Visits are tied to a random
  ID that lives as long as the tab.
- **Mostly offline.** Place names come from a list that ships with the site, so most searches never leave your
  browser.

The full account, including which services see a place you look up, is in [`docs/PRIVACY.md`](docs/PRIVACY.md).

## Run it locally

Node 22.12+, 24 or 26+.

```bash
git clone https://github.com/dev-Armaan/satellites.git
cd satellites
npm install
npm run dev
```

That's the whole app at `http://localhost:5173`, with no configuration. Lookups and short share links need a Supabase
project: copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (the
publishable key, never a secret one: `VITE_` variables ship to every browser).

```bash
npm test                  # engine, imagery and UI (Vitest)
npm run test:backend      # the server functions and the Worker
npm run typecheck
npm run build             # the app, /admin and the place pages, into dist/
npm run dev:worker        # after a build: the Cloudflare Worker, locally

npm run data:celestrak    # refresh the orbit catalog (CelesTrak asks for 2 h between downloads)
```

| URL | |
|:--|:--|
| `/?q=lat,lon&n=name` | Open a place. Add `&p=<pass id>` for a pass, or `&tl=1` for its time-lapse. |
| `/place/<slug>` | A well-known place's own page (`/place` lists them). Built files: `npm run dev:worker`, not `npm run dev`. |
| `/?debug=gl` | WebGL diagnostics. |
| `/?sandbox=<name>` | Development pages: `engine`, `backend`, `globe`, `imagery`, `results`, `shell`. |
| `/admin.html?mock=1` | The stats page with fixture data. |

## Self-hosting

A fork runs as is, with no backend: deploy it to Cloudflare Workers and turn on GitHub Actions so the orbit
catalog refreshes. Supabase (lookups, shares, stats) is optional. Step by step:
[`docs/SELF-HOSTING.md`](docs/SELF-HOSTING.md).

<details>
<summary><b>Project layout</b></summary>

```
src/
  engine/       catalog, satellite profiles, SGP4, pass search and worker pool, matching,
                weather, radar and geostationary legs, GPU elements, the report
  imagery/      STAC and GIBS search, crops, the pixels worker, cloud at your spot,
                radar tone, time-lapse, place names
  globe/        the three.js scene: Earth, atmosphere, clouds, satellites, swath, camera
  ui/           design system, landing, results, share, time-lapse, About
  app/          phase controller, boot screen, telemetry wiring
  seo/          the place pages, their list, the sitemap: what search engines read
  admin/        the /admin stats page
api/            share card, share page, events relay, Landsat pan band
worker/         the Cloudflare Worker: the routes, the frame cache's timer
supabase/       migrations and SQL tests
scripts/        catalog, places, place pages, textures, card renders, database helpers
public/         orbit catalog, place list, textures, brand
```

</details>

## Data and credits

| Source | Credit |
|:--|:--|
| Orbits | Element sets from [CelesTrak](https://celestrak.org), based on US Space Force tracking data, refreshed every 6 hours. SGP4 by [satellite.js](https://github.com/shashwatak/satellite-js). |
| Sentinel&#8209;1 and &#8209;2 | Contains modified Copernicus Sentinel data, followed by the year each image was taken. |
| Landsat | Landsat imagery courtesy of the U.S. Geological Survey and NASA. |
| NASA&nbsp;GIBS | Imagery from NASA's GIBS, part of EOSDIS. GOES via NOAA and CIRA, Himawari via JMA. |
| Meteosat | Contains modified EUMETSAT Meteosat data, followed by the year, from [EUMETSAT's map service](https://view.eumetsat.int). |
| Archives | [Microsoft Planetary Computer](https://planetarycomputer.microsoft.com) and [Element 84 Earth Search](https://element84.com/earth-search/); Landsat's 15 m band from the [Copernicus Data Space Ecosystem](https://dataspace.copernicus.eu). |
| Places | The offline place list is built from [GeoNames](https://www.geonames.org) ([CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)). [Open-Meteo](https://open-meteo.com) ([CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)), [Photon](https://photon.komoot.io) by komoot and [Nominatim](https://nominatim.org) answer what the list can't. Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright) (ODbL). |
| Textures | [Solar System Scope](https://www.solarsystemscope.com/textures/) ([CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)), from NASA Blue Marble and Black Marble. Resized and repacked for this project. |
| Fonts | Instrument Sans and Serif by Instrument, Martian Mono by Evil Martians (SIL OFL 1.1). |

The screenshots here and the default share image contain modified Copernicus Sentinel data 2015–2026. Every bundled
asset's license is in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Contributing and license

Issues and pull requests are welcome; [CONTRIBUTING.md](CONTRIBUTING.md) lists the checks to run first. Report
security issues privately, as [SECURITY.md](SECURITY.md) describes.

Code under the [MIT License](LICENSE), © 2026 Armaan Gupta. Imagery, orbital data, textures and fonts keep their own
terms. The Watched name and wordmark identify the official site, so please don't present a fork as it.

<br>

<p align="center">
  <sub>Made by Armaan Gupta · <a href="https://x.com/armaangupt0">@armaangupt0</a> on X</sub>
</p>
