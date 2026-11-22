# Security policy

## Reporting a vulnerability

Please report security issues **privately** through GitHub's private vulnerability reporting:
open the repository's **Security** tab and choose **Report a vulnerability**
(or go to `/security/advisories/new` on this repository).

Please don't open a public issue or pull request for a vulnerability, and don't test against other people's data.
The live site's database holds real visitors' lookups and shares.

Useful details: the affected file or endpoint, steps to reproduce, and the impact you expect. You'll get an
acknowledgement through the advisory thread, and credit in the fix if you'd like it.

## Scope

In scope: this repository's code, including the handlers in `api/` and the Cloudflare Worker in `worker/`, the
Supabase migrations and RPCs in `supabase/`, the GitHub Actions workflow, and the web app.

Out of scope: third-party services the app reads from (CelesTrak, Planetary Computer, Earth Search, NASA GIBS,
EUMETSAT's map service, Photon), and denial of service by sheer request volume.
