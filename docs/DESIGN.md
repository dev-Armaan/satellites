# Watched: design system

**The concept:** a precision instrument for a slightly uncanny question. It should feel like a JPL
mission console that a Swiss poster designer was allowed to art-direct. Every pixel has a job. Every
number is real. The emotion comes from what the data says, not from decoration.

> If a choice makes it look more like a SaaS landing page, a crypto dashboard, or a generic
> "AI-generated" sci-fi UI, it is the wrong choice.

---

## 1. Hard rules (anti-slop)

- **No** gradients used as decoration. No purple, no blue→pink, no neon glow on UI chrome.
- **No** glassmorphism. No `backdrop-filter: blur` panels. Panels are flat ink with hairline borders.
- **No** drop shadows on UI. Depth comes from hairlines, value contrast, and the 3D scene.
- **No** rounded cards. Border radius is `0` everywhere. The only exception is `2px` on tiny inputs, and only when needed.
- **No** emoji. **No** icon-library icons (no Lucide, Heroicons, or similar). All glyphs are custom 1px-stroke SVG drawn for this product (see `src/ui/system/Glyph.tsx`).
- **No** filler copy. No "Unlock insights", no "✨", no "Powered by AI". Copy is terse, declarative, and precise.
- **No** fake numbers. If a value is unknown, show `—`. Never pad with mock data in production paths.
- **No** generic loaders or spinners. Progress is shown as instrument readouts (text + hairline bar).
- **One signal colour.** Sodium orange means "an image of you exists" or "you are here". It is used rarely, so it reads loudly.

## 2. Colour

All colours are CSS variables in `src/styles/tokens.css`. Never hard-code hex values in components; three.js materials import `src/ui/system/palette.ts`.

| token | value | use |
|---|---|---|
| `--ink-0` | `#07080A` | page / space |
| `--ink-1` | `#0C0E11` | panels |
| `--ink-2` | `#14171C` | raised / hover |
| `--bone` | `#ECE8E0` | primary text, primary marks (warm off-white, never pure white) |
| `--bone-2` | `rgb(236 232 224 / .64)` | secondary text |
| `--bone-3` | `rgb(236 232 224 / .52)` | tertiary text, labels (AA on ink) |
| `--bone-3-mark` | `rgb(236 232 224 / .40)` | non-text marks only (ticks, glyph strokes) |
| `--bone-4` | `rgb(236 232 224 / .18)` | hairlines strong |
| `--line` | `rgb(236 232 224 / .10)` | hairlines default |
| `--signal` | `#FF6A1A` | sodium orange: watched (a real image exists) / you-are-here / primary action / live |
| `--signal-2` | `rgb(255 106 26 / .22)` | signal fills, swath ribbons |
| `--ice` | `#A9C7D3` | the ONLY secondary hue: radar + night-capable sensors, used sparingly |
| `--warn` | `#E8C547` | data caveats only (stale catalog, cloud cover) |

**Categories are encoded by mark form first and colour second:**
- `open-optical` with a real image: **signal**, solid filled diamond ◆
- `open-optical` with geometry only (likely): signal outline diamond ◇
- `commercial-optical`: bone outline square □
- `radar`: ice outline square with a centre dot

**Radar images** (Sentinel-1) are not photographs and never look like one: a ramp from `--ink-2` through a mid-grey a
quarter of the way to `--ice` to a cool off-white (`src/imagery/radarTone.ts`), each image stretched to its own
contrast. They never lead the gallery; a radar slide wears an `--ice` "Radar" tag on the summary card. On the globe a
radar image lights itself on the night side (it needs no sun); photos only ever show by day.
- `weather-leo`: bone circle outline ○
- `weather-geo`: bone ring with a tick ◎ (a constant presence, drawn as a band, not as events)
- `crewed`: bone plus ✛
- `other`: 1px bone-3 dot

## 3. Typography

Self-hosted via `@fontsource-variable/*`, imported in `src/styles/fonts.css`.

- **Display:** *Instrument Sans Variable* at `font-stretch: 75%` (condensed), weight 520–600, tracking `-0.02em`, leading `0.92`. Sentence case. Big: `clamp(44px, 7.2vw, 128px)`.
- **Body:** *Instrument Sans Variable* at `font-stretch: 100%`, weight 400, 15px/1.5. Secondary 13px.
- **Mono / data:** *Martian Mono Variable* at `font-stretch: 87.5%`, weight 300–400. Labels are 10.5px uppercase with tracking `+0.08em`. Readouts are 12–13px. Always `font-variant-numeric: tabular-nums`.
- **Serif accent:** *Instrument Serif* italic. At most **one** phrase per screen, for the human moment ("*you*.", "*this week*"). Never for UI.

Numbers are always mono. Units are smaller and in `--bone-3`: `786.2 KM`, `7.46 KM/S`, `98.6°`.

**Type scale tokens** (desktop / phone). Use only these; no raw font-size px in components.

| token | desktop | phone | use |
|---|---|---|---|
| `--fs-micro` | 9.5px | 10.5px | in-image chips and tags only, never below bone-2 |
| `--fs-meta` | 10px | 11px | secondary mono meta |
| `--fs-label` | 10.5px | 11px | mono labels |
| `--fs-readout` | 12px | 12.5px | mono readouts |
| `--fs-readout-l` | 21px | 21px | large readouts |
| `--fs-panel-h` | 34px | 34px | panel headline (condensed) |
| `--fs-panel-sub` | 22px | 22px | panel sub-headline |

The results headline integer is static: it does not count up. It counts the distinct satellites with any pass in the window (geostationary watchers excluded), which is final as soon as the passes exist, so it never changes while the archives and weather mosaics verify. The public images (Sentinel-2, Landsat, the daily weather mosaics, Sentinel-1's radar images, and every full-disc image the geostationary watchers with a public service took in the window, counted from their cadence: one count, "1,715 images were made public.") are counted on the second line, the only one that can read "At least…" and settle in place: it does while the archives answer (a partial report) and while late weather mosaics are still being checked after the report (`lateChecks`), so a number shown without "At least" never changes.

## 4. Layout

- The viewport is an **instrument bezel**: a hairline frame inset 16px (12px on mobile) with **corner tick marks** (8px L-shapes) and **edge rulers** (tiny ticks every 24px along the top edge, fading out at the centre). The 3D scene sits behind and bleeds past the frame.
- Fixed **corner readouts** in mono 10.5px (they hide on small screens if crowded):
  - TL: the serif wordmark **Watched.** (SVG, full stop in signal; `<Wordmark/>` from src/ui/system, outline in api/_lib/wordmark.ts) (no version tag)
  - TR: live UTC clock `2026-11-08 03:31:07 UTC` with a blinking signal dot (1Hz, 50% duty, no fade)
  - BL: catalog status `12,847 OBJECTS · TLE EPOCH 2026-11-08 03:15Z · CELESTRAK`
  - BR: sub-solar point `SUN 12.4°S 118.2°E` plus scene FOV or camera altitude
- **Stacked layout** (phone-like: bottom sheet, globe above) = width ≤ 760px, or portrait ≤ 1100px wide (portrait tablets). JS uses `src/lib/layout.ts`; CSS copies the query text.
- 12-column grid inside the bezel, 24px gutters, 32px outer margins on desktop. The content column for panels is 4 columns (≈ 420px) and docks right on desktop, as a bottom sheet on mobile.
- Hairline section rules have a **label notch**: a mono label sitting on the line, e.g. `── 02 / PASSES ─────────`.
- Generous negative space. The globe is the hero, so panels never cover more than 40% of the viewport on desktop.

## 5. Motion

- UI easing: `--ease-out: cubic-bezier(.2, 0, 0, 1)`; `--ease-in-out: cubic-bezier(.6, 0, .2, 1)`.
- Durations: `120ms` (hover), `240ms` (small), `480ms` (panels), `900ms` (hero text).
- **No bounce, no spring overshoot, no parallax gimmicks.** Precise and damped.
- Text reveal: line-by-line mask wipe (clip-path), 60ms stagger. Numbers count up with tabular digits over 600–900ms using ease-out.
- Code-like strings (NORAD IDs, coordinates) may do a brief **glyph scramble** (≤ 400ms), only on first appearance. Never on prose.
- Camera: moves take 2.4–3.6s with ease-in-out. **The pass camera frames north-up** (oblique ~35°, track visible); never south-up by default. Always ease the target and distance together, never a straight linear lerp. Respect `prefers-reduced-motion` with cuts and fades.
- **The signature moment, the pushbroom reveal:** when a captured image is shown, it is revealed **line by line in the satellite's along-track direction**, the way a pushbroom sensor actually builds an image. A 2px signal-coloured front with a 1px bone core leads the reveal with a faint trailing glow (8px, 42% to 0, alpha-blended); ahead of it the unread part is a fine raster on ink (lines waiting to be read). Duration ≈ 1.6s. A mono readout on the image counts `LINE 0000 → 1024`. It is compositor-only: the view's own session `<img>` under one transform animation of the raster / glow / front layer (no canvas, no per-frame script). Reduced motion: a 200 ms fade.

## 6. The globe (3D art direction)

- **Photoreal but graded.** Day side slightly desaturated (–12%), cool-neutral. Oceans have a restrained specular glint from the real sun. A thin, accurate atmosphere rim (Rayleigh-ish, pale blue-white) is brighter on the day limb.
- **Night side:** city lights tinted toward sodium amber (`#FFB070`) so they rhyme with the signal colour. A soft warm **terminator band** marks the twilight line.
- **Clouds:** a separate layer at ~1.006R with a subtle shadow on the surface, slowly drifting.
- **Real sun position.** Lighting is computed from the actual date and time (see `src/lib/geo.ts`). The terminator you see is the real one, right now.
- **Stars:** sparse and dim, with a few magnitude classes and no twinkle. They rotate with GMST because they are inertial. No nebulae, no Milky Way skybox.
- **Satellites:**
  - Ambient catalog (~10k+): 1–1.5px points in `bone` at 35–55% alpha, with size attenuation. Starlink shells read as faint latitude bands.
  - Imaging satellites of interest: slightly larger points. Signal-coloured if they imaged the place.
  - The selected satellite has a **callout**: a leader line from the point to a label box drawn in screen space, in instrument style (hairline box, mono text, name plus altitude).
  - Orbits: 1px lines with alpha fading along the trail behind the satellite (no full ellipses by default).
- **Swath:** when a pass is selected, its **swath ribbon** is drawn on the surface as a translucent signal fill (`--signal-2`) with 1px edge lines, and the swath **sweeps** over the place marker in sync with replay time.
- **The place marker:** a signal-coloured crosshair reticle projected on the surface. It has a thin ring, four ticks, a centre dot, and a coordinate label. It locks in when the camera arrives (the ring contracts from 2× to 1× over 500ms).
- **A dropped pin:** the same reticle in `bone`, not signal: a proposal, not a searched place. It drops by closing from 2.2× onto its crosshair (280 ms, ease-out); its card is the callout plate (ink-1, hairline) with the spot's name, its coordinates in mono, and the search field's own orange arrow. On touch, a ring fills under the held finger before it drops.
- **Post:** very subtle film grain (≤ 3%), gentle vignette, mild bloom only on the signal colour and city lights. No chromatic aberration, no lens flare.

## 7. Voice

Declarative, specific, quietly uncanny. Second person. Real numbers.

- Hero: "Something watched *you* this week." (three lines: `Something` / `watched *you*` / `this week.`; the serif *you* in signal orange) Sub: "Enter any place on Earth. See every satellite that passed over it in the last 7 days, and the actual pictures they took."
- Result headline: "In the last 7 days, **256 satellites watched** *Waterloo*." then "**29 photos were made public.**" (N = distinct satellites with any pass; K = real public images in the window; only the photos line can be partial: "At least K photos…"). None: "No satellite we track watched Waterloo this week." One: "1 satellite watched".
- Pass detail: "Sentinel-2C crossed 786 km overhead at 16:14:21 UTC, moving south at 7.46 km/s. It was looking straight down. Cloud cover: 25%." Per-pass headline and share post: "Sentinel-2C watched Waterloo."
- Commercial: "WorldView Legion 4 passed within view at 10:52 local. It could have watched Waterloo. We can't know whether it did."
- Geostationary: "Meteosat-12 doesn’t pass. It sits 35,778 km above the equator at 0.2°W and scans the whole face of the Earth below it every 10 minutes. This scan’s line reached Paris at about 07:49 CET, moving north." (its newest image opened like a pass; rows without a picture say "No public image" or "Poor quality")
- User-facing copy says **watched**, never "photographed" (code comments and identifiers may keep the old word). "{K} photos were made public." stays as the owner wrote it.

Honesty is part of the aesthetic. Uncertainty is stated plainly in `--bone-3` mono footnotes.

### Verdict vocabulary (one set of words everywhere)

Source of truth: `VERDICT_META` in `src/ui/results/lib/meta.ts` (the share cards mirror it in `api/_lib/cardSpec.ts`).

| verdict | name | count unit | lane label | verb |
|---|---|---|---|---|
| imaged | Watched | PASSES | PHOTO | watched |
| likely | Likely watched | PASSES | LIKELY | swept over |
| could | Could have pointed here | PASSES | COULD | passed within view |
| overhead | Passed overhead | PASSES | OVERHEAD | passed overhead |

## 8. Components (src/ui/system)

`Bezel`, `CornerReadout`, `Rule` (with notch label), `Label` (mono caps), `Readout` (label + value + unit), `Num` (tabular, count-up), `Button` (primary = signal fill + ink text, square; secondary = hairline), `Field` (search input: no box, just a baseline hairline that thickens on focus, with a blinking block caret), `Glyph` (custom SVG marks per category), `Scramble`, `Reveal` (mask wipe), `Tag` (mono, hairline box), `Sheet` (responsive panel: right dock on desktop, bottom sheet on mobile).

## 9. Accessibility and performance

- WCAG AA contrast for text (bone on ink passes easily, and bone-3 is used only for ≥ 10.5px mono labels).
- Keyboard: `/` focuses search, `←/→` steps through passes, `Esc` goes back, `Space` plays or pauses replay.
- `prefers-reduced-motion`: no scramble, no camera flights (cut plus 300ms fade), and the reveal becomes a fade.
- 60fps on an M1 Air at 1440p, and ≥ 40fps on a mid-range phone. DPR is capped at 2.
- Earth textures are progressive, and every upgrade is decoded off the main thread (createImageBitmap in a worker) and
  uploaded in strips across frames, never during a camera flight, a sheet drag or the acquisition sequence:
  - **Desktops:** 1k at first light → 4k → 8k.
  - **Phones** (stacked layout or the mobile tier): 1k at first light → the **2k day + night pair in ONE swap**, and 2k is
    final (no 4k / 8k on phones). Clouds stay 1k, and go to 2k only after the camera has rested zoomed in for ~1.5 s.
    At most one visible sharpening, ideally before the landing's entrance ends.
- Overlays that cover the globe (`<html data-overlay="lightbox|about|share">`, see ARCHITECTURE.md) pause or throttle it.

## 10. The loading screen

There is exactly one, and it is the wordmark. `index.html` paints `#boot-static` with the HTML (no JS, no fonts: the
letters are an SVG path): the serif **Watched.** centred on ink, a touch above the middle, its signal full stop
breathing (opacity, on the compositor, so it keeps moving through script parse and texture decode). No checklist, no
progress bar, no second screen. Boot holds it at least 650 ms from navigation start and until the globe's first light
and the first faces are in (at most 12 s for first light and 4 s more for the faces, counted from the moment the app's
script runs; on a very slow link the script itself can take seconds to arrive, and the wordmark holds until it has).
If loading takes over 6 s, one quiet mono line appears under the wordmark: "Slow connection, still loading"; it leaves
with the ink.

The exit (`src/app/bootCurtain.ts`, in the commit that mounts what boot led to: the landing, the computing panel, or
the fault notice): the stop settles to full (240 ms); the wordmark **glides onto the HUD's own wordmark** (760 ms: it
rises and shrinks first, then slides left along the top, so it never crosses the landing's headline) and lands on
the same pixels; the ink fades off the globe (560 ms after 120 ms); in the frame it lands, `html[data-boot]` goes, the
HUD's wordmark shows in its place and the curtain is removed. Transform and opacity only. The HUD's other lines and
the landing wipe in under the fading ink. Reduced motion: one 200 ms fade, nothing moves. Never on screen: two
wordmarks at once, the landing before the logo, the logo after the HUD's wordmark, a white or black flash. The
landing's first headline line starts its wipe 340 ms into the exit (the ink about half gone) and the HUD's version and
About lines after the glide has landed (780 / 820 ms); these wipes run on CSS time from the exit's first frame, so a
busy main thread never makes them late.


## Brand

- Name **Watched**, domain **www.watched.earth** (watched.earth and the old vercel.app host redirect to it).
- Wordmark: serif "Watched." with the full stop in signal. Never set the name in mono caps as a logo.
- The serif *you* in the hero and the wordmark's full stop are the two brand uses of signal outside data marks.

## The pass sequence (signature moment, replaces the flat orange swath)

Wide chase alongside a small spacecraft model (true SGP4 position, nadir-pointing, fading orbit trail) → the
sensor's light curtain sweeps the ground with a bright scan line → ~1 s dive onto the place → the real image
develops onto the globe line by line → capture shockwave at the reticle + "ACQUIRED 11:21:21 EST · 10 M" →
1.2 s settle to a near top-down view where the globe photo and the panel photo line up. Replay is explicit;
gallery swipes only re-frame quietly: no clock runs and no camera chases, but the image never pops. The one on the
ground stays until the next has loaded, then that one develops over it in a single 0.9 s sweep along its pass's
direction. Reduced motion: final painted state.
