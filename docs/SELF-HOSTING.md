# Self-hosting

How to run your own copy of Watched: a static Vite app on Vercel, three small Vercel functions, an optional
Supabase backend, and a GitHub Action that keeps the orbit catalog fresh.

## What works without a backend

Everything people come for works with **no Supabase project and no env vars**:

- the globe;
- the pass search;
- the archive photo search;
- pass replays.

With the Supabase variables unset:

- lookups, shares and stats switch off quietly;
- share links fall back to self-describing URLs, whose cards render from their own parameters;
- `/s/<id>` short links and the `/admin` page have nothing to read.

## 1. Supabase (optional)

1. Create a Supabase project. Note its **project ref** (the `<ref>` in `https://<ref>.supabase.co`).
2. Apply the migrations, in order. Every migration is idempotent.

   ```bash
   SUPABASE_PROJECT_REF=<ref> SUPABASE_ACCESS_TOKEN=<personal access token> scripts/backend-migrate.sh
   ```

   (Or paste each `supabase/migrations/*.sql` into the SQL editor, in order.)
   - The migrations enable `pgcrypto` and `pg_cron`. pg_cron runs the hourly event rollup and the 48-hour prune.
   - They create the `overflight_private` schema.
   - Browsers can only call RPC functions. No table is readable or writable directly.
3. Make yourself the admin of `/admin`. No admin is seeded by the migrations.

   ```bash
   SUPABASE_PROJECT_REF=<ref> SUPABASE_ACCESS_TOKEN=<token> scripts/backend-set-admin.sh you@example.com
   ```

   - Then sign in once at `https://<your site>/admin` with that address, using the emailed magic link or code.
   - Admin access needs a confirmed, non-anonymous Supabase Auth user whose email is on the list.
   - In Supabase **Authentication → URL Configuration**:
     - set the Site URL to your site;
     - add `https://<your site>/admin` to the redirect URLs.
4. Optional: check your project's SQL (each test runs inside a rolled-back transaction).

   ```bash
   SUPABASE_PROJECT_REF=<ref> scripts/backend-sql-test.sh
   ```

Every `scripts/backend-*.sh` script needs `SUPABASE_PROJECT_REF` and has no default, so none of them can point at
someone else's project by accident.

`scripts/backend-purge-dev.sh` **deletes data**. It also needs `--confirm <ref>`. Never run it against a project
holding real visitors' data.

## 2. Environment variables

Copy `.env.example` to `.env.local` for local development, and set the same names in your Vercel project.

| Variable | Where | What it does |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | build + functions | `https://<ref>.supabase.co`. Unset: the backend is off. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | build + functions | The **publishable** key (`sb_publishable_…`). It ships to every browser, so never use a secret or `service_role` key. Unset: the backend is off. |
| `SITE_URL` | functions | Optional. The canonical origin for share pages and card URLs (`og:image`, canonical). Defaults to the request's own origin. |
| `VITE_SITE_ORIGIN` | build | Optional. The origin written into `index.html`'s link-preview tags. Defaults to Vercel's production URL, then the deployment URL. A build outside Vercel with neither falls back to `https://www.watched.earth`, so set this for any other host. |

The functions also accept `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`, which take precedence over the `VITE_`
names.

## 3. Deploy to Vercel

1. Import the repository in Vercel. `vercel.json` sets:
   - the framework (Vite);
   - the build command (`npm run build`) and output directory (`dist`);
   - the functions and the routes.
2. Set the env vars above for **Production**.
   - Preview deployments share whatever database you give them.
   - `api/e` (the event relay) only writes when `VERCEL_ENV` is `production`.
3. Optional: enable Vercel Web Analytics. The app loads it in production builds; without it, nothing is sent.

### Usage telemetry

In-app usage events are only sent from the hosts listed in `PRODUCTION_HOSTS` in `src/lib/telemetry.ts`, which is
the official site by default. A fork therefore sends no usage events until you put your own domain in that list.

Nothing in the code points at the official site's database: with no env vars, the backend is simply off.

## 4. The orbit catalog Action

`.github/workflows/catalog.yml` refreshes `public/data/catalog.json` and `catalog-names.json` from CelesTrak:

- It runs every 6 hours, and can also be started by hand.
- It commits the result to `main`.
- It uses only the built-in `GITHUB_TOKEN`, with `contents: write`.

GitHub disables scheduled workflows in forks until you enable Actions there. Please keep the schedule at least
2 hours apart: CelesTrak asks for that. To refresh by hand:

```bash
npm run data:celestrak
```

## 5. Textures and fonts

`public/textures` and `api/_fonts` are committed, so you don't need to rebuild them.

To regenerate them:
- `scripts/build-textures.py` needs the source maps listed in its header.
- `scripts/backend-fonts.py` needs `fonttools` and `node_modules`.

Licenses and the attribution each asset needs are listed in [`THIRD_PARTY_NOTICES.md`](../THIRD_PARTY_NOTICES.md).
