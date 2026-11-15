-- 0028: the searches and tabs the overall limit dropped on 2026-11-15 count in the admin totals, as 0015 and 0018 did
-- for the outages.
--
-- 07:34-08:25 UTC a post on X sent ~1,000 new tabs a minute and events + new tabs sat at 0020's limit of 6000 a
-- minute (41 of those 52 minutes within 200 of it), so log_events dropped batches of real visitors. Nothing was down.
-- 0027 raised the limit to 15000 at 08:33.
-- This time the reference is Cloudflare's per-minute request counts (the site is served by the Worker now), which see
-- every batch whether or not the database kept it:
--   * Events: /api/e requests x 1.637 (events + new tabs counted per request over 07:05-07:30 UTC, the same spike
--     before it reached the limit) minus what was counted, in each minute at the limit: 23,375 dropped in the 07:00
--     hour (13.6 %) and 49,579 in the 08:00 hour (24.4 %). Searches are that many times the searches' share of the
--     counted events in the same minutes (a batch is dropped whole, whatever is in it).
--   * New tabs: requests for / x 0.4276 (new tabs per request over 07:05-07:30) minus the new tabs counted, over each
--     hour's stretch at the limit. Per page load and not per batch, because a tab whose first batch was dropped is
--     still made by its next one. Active tabs are taken as the same number: a tab that was never made was never active.
--   * The ratios are from the minutes before the limit, the lower of the two unlimited stretches (after it: 1.930 and
--     0.502), so these are on the low side. Cloudflare's counts are sampled.
-- Raw events, the rollups, the top lists and the public get_stats counters are untouched; deleting the rows undoes it.
-- Idempotent: 0015's upsert.

insert into overflight_private.event_backfill (hour, searches, sessions, active, basis) values
  ('2026-11-15 07:00+00', 4628, 4774, 4774, 'limit 07:34-07:59 UTC (6000 a minute); Cloudflare 105453 /api/e and 67438 / requests; recorded 29431 searches, 24065 new tabs, 148640 events + tabs'),
  ('2026-11-15 08:00+00', 9946, 6996, 6996, 'limit 08:00-08:25 UTC (6000 a minute); Cloudflare 124841 /api/e and 76964 / requests; recorded 30816 searches, 25917 new tabs, 153607 events + tabs')
on conflict (hour) do update set searches = excluded.searches, sessions = excluded.sessions, active = excluded.active, basis = excluded.basis;
