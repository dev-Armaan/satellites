# The Watched promo

A short announcement video (about 18 seconds, 1920 × 1080, 60 fps, with music and sound effects) made with
[Remotion](https://www.remotion.dev): "Featured in international news", the press, the numbers, a flood of real posts
and comments, and the app in its new languages. It lives here, outside the app's build and tests, with its own `package.json`.

## The rules it follows

- **Proof is shown as screenshots** (owner): the articles, the Show HN thread, each comment, the posts on X and
  Reddit. They are captured from the live pages, or are the owner's own screenshots, and are only ever cropped;
  nothing in a capture is rewritten. The few lines set in the
  video's own type are pulled from those screenshots, verbatim, with their authors (`src/data/comments.ts`).
- **The numbers are the owner's wording**: "1,000,000+ users in under 7 days", "1,000,000+ searches", no exact
  figures (`src/data/stats.ts` records what is behind them: visits, which are browser tabs, and searches), and
  "500+ points" on Hacker News, which stood at 499 on 19 November: check it before posting.
- **It looks like the product.** Same ink, bone and signal orange, same three faces, same bezel at the same pixels as
  the landing page (`src/theme.ts`, `src/components/Frame.tsx`).
- **Hard cuts on the song's beat.** Every scene starts on a beat of the music and moves on its sixteenths
  (`src/timing.ts` says which bar carries what). No fades, no wipes, nothing bounces.
- **The product appears once**, in the last beat, as full-frame captures of the real landing page in each language.
- **The music is one unbroken excerpt** of Queen's "Don't Stop Me Now" (owner's choice), cut by
  `scripts/cut-music.py` from a copy of the song, fading in over half a second: the end of the first chorus into "I am a satellite, I'm out of
  control", which is sung over the globe. Neither the song nor the excerpt is in the repository.
- **Few effects, each for a reason** (owner: none just to have one): a low hit on the million and on the wordmark, a
  pop for each comment as it lands in the flood, and the keys of the address being typed once the music has stopped. All synthesised by
  `scripts/make-sfx.cjs` (committed in `public/sfx/`). Nothing depends on being heard: most people see it muted first.

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

The music, from a copy of the song (without it the video renders with its effects only):

```bash
python3 scripts/cut-music.py path/to/the-song.mp4
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

## Screenshots added by hand

CBC, Reddit and x.com's own post pages (the only place a post's view count shows) refuse cloud addresses, and the
owner's screenshot of the Waterloo article has its photo. Those are cropped by hand into `public/proof/` as PNGs:

- `press-cbc.png` and `press-waterloo.png` (named in `proof.json`'s `byHand`, so the capture never overwrites them;
  without them a card sets the outlet's headline in type).
- A post from X with its view count, or a Reddit comment, in `flood`: `{ "file": "<name>", "author": "@…", "dark": true }`
  (`dark` for a capture of a dark page). The flood lands them in the order they are listed.

After adding a file, re-read the sizes (the flood's layout needs every capture's):

```bash
node scripts/capture-proof.cjs --sizes
```

A post on X that only needs to be in the flood needs no screenshot: `{ "x": "<the post's id>", "author": "@…" }` is
read through X's public embed.

## Change it

| To change | Edit |
|---|---|
| A number, or its wording | `src/data/stats.ts`, `src/scenes/Numbers.tsx` |
| The posts and comments in the flood, the comment under the big sentence | `src/data/proof.json`, then re-run the proof capture |
| The phrases in the strobe, the big sentence | `src/data/comments.ts` |
| The press cards | `src/data/press.ts` |
| The languages and their order | `src/data/languages.ts`, then re-run the product capture |
| How long a scene runs | `BEATS` in `src/timing.ts` (in beats of the song) |
| When an effect plays, or how loud | the scene's `…_CUES` (beside the picture it belongs to); their level under the music is `MASTER` in `src/sound.tsx` |
| Which part of the song plays, how it ends, how loud | `scripts/cut-music.py`, then run it (and `BEAT` in `src/timing.ts` if the tempo differs) |
| What a sound is | `scripts/make-sfx.cjs`, then run it |
