# The Watched promo

A short announcement video (about 20 seconds, 1080 × 1350, 60 fps) made with [Remotion](https://www.remotion.dev):
the post that asked who made the site, the numbers, the press, a flood of real comments, and the app in its new
languages. It lives here, outside the app's build and tests, with its own `package.json`.

## The rules it follows

- **Every number and every word is real.** The numbers are production's (`src/data/stats.ts` says where each was read).
  The comments are verbatim, with their authors (`src/data/comments.ts`). Press is named as each outlet titled it
  (`src/data/press.ts`), in type: no logos, footage or audio of theirs.
- **"Visits", never "users".** A visit is a browser tab; the site cannot count people (docs/PRIVACY.md).
- **It looks like the product.** Same ink, bone and signal orange, same three faces, same bezel at the same pixels as
  the landing page (`src/theme.ts`, `src/components/Frame.tsx`).
- **Hard cuts on a grid of a tenth of a second** (`src/timing.ts`). No fades, no wipes, nothing bounces.
- **The product appears once**, in the last beat, as full-frame captures of the real landing page in each language.

## Run it

```bash
cd video
npm install
```

The last beat needs the product shots, which are generated and not committed. Start the app from a checkout that has
the translations (`npm run dev` at the repository root) and capture them (see the top of the script for what it needs):

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

## Change it

| To change | Edit |
|---|---|
| A number | `src/data/stats.ts` (re-read it from production first) |
| The comments in the flood, the strobe, the opening post | `src/data/comments.ts` |
| The press cards | `src/data/press.ts` |
| The languages and their order | `src/data/languages.ts`, then re-run the capture |
| How long a scene runs | `SCENES` in `src/timing.ts` (in tenths of a second) |
