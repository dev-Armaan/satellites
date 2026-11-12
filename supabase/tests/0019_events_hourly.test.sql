-- Checks for 0019_events_hourly.sql. Run as begin; <0019>; <this file>; rollback.  Nothing survives.
-- Row writes only: test tabs and events on an Eastern day in 2001, and the hourly rollups emptied inside the test so
-- they can start at that day. No admin_stats_compute call: with the hourly rollups emptied it would read raw events.
-- Holds the maintenance lock throughout: run it clear of :17.

-- ── Grants and schedule ─────────────────────────────────────────────────────────────────────
do $$
declare r text;
begin
  foreach r in array array['anon', 'authenticated'] loop
    if has_table_privilege(r, 'public.event_tab_days', 'select') or has_table_privilege(r, 'public.event_hour_dims', 'select')
       or has_table_privilege(r, 'public.event_hour_rest', 'select') or has_table_privilege(r, 'public.event_hour_dists', 'select') then
      raise exception 'grants: % can read a new table', r;
    end if;
    if has_function_privilege(r, 'overflight_private.roll_event_hour_dims(int, date)', 'execute')
       or has_function_privilege(r, 'overflight_private.event_recent_into(timestamptz, timestamptz)', 'execute') then
      raise exception 'grants: % can call a rollup function', r;
    end if;
  end loop;
  if not exists (select 1 from cron.job where jobname = 'watched-admin-stats' and schedule = '0 * * * *' and active) then
    raise exception 'cron: watched-admin-stats is not hourly at :00 and on';
  end if;
  if (select count(*) from cron.job where jobname = 'watched-admin-stats') <> 1 then raise exception 'cron: job scheduled twice'; end if;
end
$$;

-- ── A test day: 2001-02-03, Eastern (UTC-5) ─────────────────────────────────────────────────
-- Tab a: searches at 10:10 and 11:10 (one tab, one search stage that day), back at 23:50 and again 00:10 the next day
-- (a tab of both days). Tab b: one search and a share at 11:20. Tab c: results at 12:00 (no search).
delete from public.event_hour_dims;
delete from public.event_hour_rest;
delete from public.event_hour_dists;
insert into public.event_sessions (sid, first_at, last_at, device) values
  ('test19_sid_aaaaaaaaaaaaaa', '2001-02-03 10:10 America/New_York', '2001-02-04 00:10 America/New_York', 'phone'),
  ('test19_sid_bbbbbbbbbbbbbb', '2001-02-03 11:20 America/New_York', '2001-02-03 11:20 America/New_York', 'desktop'),
  ('test19_sid_cccccccccccccc', '2001-02-03 12:00 America/New_York', '2001-02-03 12:00 America/New_York', 'desktop');
insert into public.events (created_at, sid, type, props) values
  ('2001-02-03 10:10 America/New_York', 'test19_sid_aaaaaaaaaaaaaa', 'search', '{"label": "A, Test", "cell": "1.0,1.0", "source": "search"}'),
  ('2001-02-03 11:10 America/New_York', 'test19_sid_aaaaaaaaaaaaaa', 'search', '{"label": "A, Test", "cell": "1.0,1.0", "source": "search"}'),
  ('2001-02-03 11:20 America/New_York', 'test19_sid_bbbbbbbbbbbbbb', 'search', '{"label": "B, Test", "source": "example"}'),
  ('2001-02-03 11:21 America/New_York', 'test19_sid_bbbbbbbbbbbbbb', 'share_action', '{"action": "x", "norad": 25544}'),
  ('2001-02-03 12:00 America/New_York', 'test19_sid_cccccccccccccc', 'results', '{"ms": 1234, "partial": true}'),
  ('2001-02-03 23:50 America/New_York', 'test19_sid_aaaaaaaaaaaaaa', 'pass_open', '{"norad": 25544, "verdict": "imaged"}'),
  ('2001-02-04 00:10 America/New_York', 'test19_sid_aaaaaaaaaaaaaa', 'pass_open', '{"norad": 25544, "verdict": "imaged"}');

do $$
declare
  v_d date := '2001-02-03';
  v_from timestamptz := '2001-02-03 00:00 America/New_York';
begin
  -- 30 hours from the day's midnight: the whole day and the next morning.
  if overflight_private.roll_event_hour_dims(30, v_d) <> 30 then raise exception 'hours: not 30 rolled'; end if;
  if (select min(hour) from public.event_hour_dims) <> v_from then raise exception 'hours: do not start at the Eastern midnight'; end if;

  -- Tab a counts once on the 3rd (10:00), not again at 11:00 or 23:00; again on the 4th (00:00).
  if (select n from public.event_hour_dims where hour = '2001-02-03 10:00 America/New_York' and type = 'session' and dim = '') <> 1
     or (select n from public.event_hour_dims where hour = '2001-02-03 11:00 America/New_York' and type = 'session' and dim = '') <> 1
     or (select n from public.event_hour_dims where hour = '2001-02-03 23:00 America/New_York' and type = 'session' and dim = '') <> 0
     or (select n from public.event_hour_dims where hour = '2001-02-04 00:00 America/New_York' and type = 'session' and dim = '') <> 1 then
    raise exception 'tabs: first-of-day counts wrong (%)', (select jsonb_object_agg(hour::text, n) from public.event_hour_dims where type = 'session' and dim = '' and n > 0);
  end if;
  -- The search stage: tab a at 10:00 only, tab b at 11:00.
  if (select n from public.event_hour_dims where hour = '2001-02-03 11:00 America/New_York' and type = 'funnel' and val = 'search') <> 1
     or (select sum(n) from public.event_hour_dims where hour >= v_from and hour < v_from + interval '1 day' and type = 'funnel' and val = 'search') <> 2 then
    raise exception 'funnel: search stage counted per hour, not once per tab and day';
  end if;
  -- Every hour has its marker row.
  if (select count(*) from public.event_hour_dims where type = 'session' and dim = '' and val = '') <> 30 then raise exception 'hours: a marker row is missing'; end if;

  -- The day from its hours = the day from its raw events.
  perform overflight_private.roll_event_day(v_d);
  if exists (
      (select type, dim, val, n from public.event_days where day = v_d and n > 0
       except select type, dim, val, n from overflight_private.event_aggregates(v_from, v_from + interval '1 day') where day = v_d)
      union all
      (select type, dim, val, n from overflight_private.event_aggregates(v_from, v_from + interval '1 day') where day = v_d
       except select type, dim, val, n from public.event_days where day = v_d and n > 0)) then
    raise exception 'day: the rollup from hours differs from the raw events';
  end if;
  if (select n from public.event_days where day = v_d and type = 'session' and dim = '') <> 3 then raise exception 'day: tabs <> 3'; end if;
  if (select n from public.event_dists where day = v_d and metric = 'results.ms' and v = 1230) <> 1 then raise exception 'day: value counts missing'; end if;

  -- The rollups are behind (the last rolled hour is in 2001), so a refresh keeps the cache.
  if overflight_private.event_rollups_current() then raise exception 'current: rollups in 2001 count as current'; end if;
  if overflight_private.refresh_admin_stats() <> 0 then raise exception 'refresh: ran while the rollups are behind'; end if;

  raise notice '0019 checks passed';
end
$$;
