-- 0017: drop the three indexes 0016 left unused: 84 MB of the 114 MB of indexes on public.events at 711k events, and
-- the event_sessions index that made every log_events update a non-HOT one.
--   * events_sid_inserted_at_idx (sid, inserted_at): log_events' per-tab limit counts the tab's events of the last
--     minute; events_inserted_at_idx finds the last minute (at most the global 3000 a minute) and the tab is filtered
--     from those.
--   * events_type_created_at_idx (type, created_at): the recent searches and errors read the newest events backwards on
--     events_created_at_idx (a search is about 1 event in 6, an error 1 in 150); the speed numbers past 24h come from
--     event_dists.
--   * event_sessions_last_at_idx: only the prune used it, and 0016 prunes on first_at. last_at changes on every
--     log_events batch, so the index also stopped those updates being HOT.
-- Apply after 0016. Each drop takes its table's exclusive lock for a moment, so lock_timeout is 2 s: the /api/e relay
-- gives up after 4 s, and nothing waits longer than that. If it times out (a stats refresh or the hourly maintenance was
-- reading), nothing changed: run it again a few minutes later, clear of :07, :17 and :37. event_sessions before events:
-- the order log_events takes them in, so no deadlock.
-- Idempotent: drop index if exists.

set local lock_timeout = '2s';
drop index if exists public.event_sessions_last_at_idx;
drop index if exists public.events_sid_inserted_at_idx;
drop index if exists public.events_type_created_at_idx;
