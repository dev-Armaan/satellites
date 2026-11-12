-- 0018: the 2026-11-12 outage's and slowdown's searches and tabs count in the admin totals, as 0015 did for 2026-11-11.
--
-- 15:38-16:31 UTC (10:38-11:31 ET) the API was down: a viral spike (~900 pageviews an hour before 13:00 UTC, ~30,000
-- after) met refresh_admin_stats on the free plan's smallest machine, which starved it, and PostgREST stopped answering
-- until the project was restarted. 17:01-17:13 UTC it was degraded again (a long ad-hoc query, then the move to a bigger
-- machine). /api/e drops a batch it cannot deliver, so those events are gone; Vercel Web Analytics kept counting.
-- Each hour is rebuilt as in 0015: (Vercel pageviews that hour) x (per-pageview ratio of a reference hour) minus what the
-- database recorded that hour, taken from the hourly rollups (0019: new tabs are tabs whose first event of the Eastern
-- day fell in the hour, as the admin day totals count them).
--   * Reference: 14:00 UTC, the last whole hour before the outage with the same viral traffic (the morning's hours had
--     ~1.4 searches a pageview, the spike 0.63). The global limit of 3000 events + new tabs a minute was never reached
--     (peak 2,555), so it is complete. Ratios: 0.6280 searches, 0.9585 new tabs, 0.9691 active tabs a pageview.
--   * Rows: 15:00 (recorded until 15:37:57), 16:00 (recorded 16:03-16:06 and from 16:31), 17:00 (degraded 17:01-17:13).
-- Raw events, the rollups and the public get_stats counters are untouched; deleting the rows undoes it.
-- Idempotent: 0015's upsert.

insert into overflight_private.event_backfill (hour, searches, sessions, active, basis) values
  ('2026-11-12 15:00+00', 9002, 13786, 13665, 'outage 15:38-16:31 UTC; Vercel 32006 pageviews; recorded 11097 searches, 16892 new tabs, 17352 active'),
  ('2026-11-12 16:00+00', 8887, 13365, 13646, 'outage 15:38-16:31 UTC; Vercel 29922 pageviews; recorded 9903 searches, 15315 new tabs, 15351 active'),
  ('2026-11-12 17:00+00', 2235,  4251,  4045, 'slowdown 17:01-17:13 UTC; Vercel 23339 pageviews; recorded 12421 searches, 18120 new tabs, 18573 active')
on conflict (hour) do update set searches = excluded.searches, sessions = excluded.sessions, active = excluded.active, basis = excluded.basis;
