# The Watched promo

A short announcement video (about 18 seconds, 1920 × 1080, 60 fps) made with [Remotion](https://www.remotion.dev):
the post that asked who made the site, the numbers, the press, a flood of real comments, and the app in its new
languages. It lives here, outside the app's build and tests, with its own `package.json`.

## The rules it follows

- **Proof is shown as screenshots** (owner): the articles, the Show HN thread, each comment, the posts on X. They are
  captured from the live pages and only ever cropped; nothing in a capture is rewritten. The few lines set in the
  video's own type are pulled from those screenshots, verbatim, with their authors (`src/data/comments.ts`).
- **The numbers are the owner's wording**: "1,000,000+ users in under 7 days", "1,000,000+ searches", no exact
  figures. `src/data/stats.ts` records what is behind them (visits, which are browser tabs, and searches).
- **It looks like the product.** Same ink, bone and signal orange, same three faces, same bezel at the same pixels as
  the landing page (`src/theme.ts`, `src/components/Frame.tsx`).
- **Hard cuts on a grid of a tenth of a second** (`src/timing.ts`). No fades, no wipes, nothing bounces.
- **The product appears once**, in the last beat, as full-frame captures of the real landing page in each language.

## Run it

```bash
cd video
npm install
```

The video needs two sets of captures, both generated and not committed (other people's pages and words, megabytes,
stale as soon as a page changes). Playwright is not a dependency here; each script's header says what it needs.

The proof (articles, thread, comments, posts), listed in `src/data/proof.json`:

```bash
node scripts/capture-proof.cjs
```

The product, from an app that has the translations (`npm run dev` at the repository root):

```bash
node scripts/capture-product.cjs http://127.0.0.1:5173
```

Preview and scrub in the Studio (each scene is also its own composition):

```bash
npm run studio
```

Render:

```bash
npm run render
```

In a cloud session, pass the pre-installed browser to either command:
`--browser-executable=/opt/pw-browsers/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell`.

## Screenshots that cannot be captured

CBC and Reddit refuse cloud addresses. Add those by hand as PNGs in `public/proof/`, then run the proof capture again
(it records every PNG's size, which the flood's layout reads):

- CBC's two pages: `press-cbc.png` and `press-cbc-radio.png`. Until they exist, those two press cards set the
  headline in type.
- A Reddit post or comment: any name, then a line in `src/data/proof.json`'s `flood`, `{ "file": "<name>", "author": "u/…" }`.
- A post on X needs no screenshot: add `{ "x": "<the post's id>", "author": "@…" }` and the capture reads X's public embed.

## Change it

| To change | Edit |
|---|---|
| A number, or its wording | `src/data/stats.ts`, `src/scenes/Numbers.tsx` |
| The comments and posts in the flood, the opening post, the comment under the big sentence | `src/data/proof.json`, then re-run the proof capture |
| The phrases in the strobe, the big sentence, the reply | `src/data/comments.ts` |
| The press cards | `src/data/press.ts` |
| The languages and their order | `src/data/languages.ts`, then re-run the product capture |
| How long a scene runs | `SCENES` in `src/timing.ts` (in tenths of a second) |
