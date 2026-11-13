-- Checks for 0023_timelapse_admin.sql. Run as begin; <0023>; <this file>; rollback.  Nothing survives.
-- Row writes only (a test tab and its events), all rolled back; the one table change is 0023's own `add column`.
-- admin_stats_compute runs once, for 24h: what the hourly job does, so run it while the rollups are current.

insert into public.event_sessions (sid, first_at, last_at, device) values ('test23_sid_aaaaaaaaaaaaaa', now(), now(), 'phone');
insert into public.events (created_at, sid, type, props) values
  (now(), 'test23_sid_aaaaaaaaaaaaaa', 'timelapse_open', '{"from": "viewer"}'),
  (now(), 'test23_sid_aaaaaaaaaaaaaa', 'timelapse_open', '{"from": "results"}'),
  (now(), 'test23_sid_aaaaaaaaaaaaaa', 'timelapse_open', '{}'),
  (now(), 'test23_sid_aaaaaaaaaaaaaa', 'timelapse_share', '{"action": "video"}'),
  (now(), 'test23_sid_aaaaaaaaaaaaaa', 'share_action', '{"action": "native"}');

do $$
declare
  r text;
  v jsonb;
  last jsonb;
  f text;
begin
  foreach r in array array['anon', 'authenticated'] loop
    if has_table_privilege(r, 'public.event_hours', 'select') then raise exception 'grants: % can read event_hours', r; end if;
    if has_function_privilege(r, 'overflight_private.admin_stats_compute(text)', 'execute')
       or has_function_privilege(r, 'overflight_private.event_aggregates(timestamptz, timestamptz)', 'execute')
       or has_function_privilege(r, 'overflight_private.event_hour_aggregates(timestamptz, timestamptz)', 'execute') then
      raise exception 'grants: % can call a private stats function', r;
    end if;
  end loop;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'event_hours' and column_name = 'timelapse') then
    raise exception 'event_hours has no timelapse column';
  end if;

  -- ── Both aggregate functions carry the two breakdowns, and only for events that say ──────────
  foreach f in array array['event_aggregates', 'event_hour_aggregates'] loop
    create temp table if not exists _t23 (day date, type text, dim text, val text, n bigint) on commit drop;
    truncate _t23;
    execute format('insert into _t23 select * from overflight_private.%I(now() - interval ''1 second'', now() + interval ''1 second'')', f);
    if (select coalesce(sum(n), 0) from _t23 where type = 'timelapse_open' and dim = 'from' and val = 'viewer') < 1
       or (select coalesce(sum(n), 0) from _t23 where type = 'timelapse_open' and dim = 'from' and val = 'results') < 1 then
      raise exception '%: timelapse_open.from is missing', f;
    end if;
    if exists (select 1 from _t23 where type = 'timelapse_open' and dim = 'from' and val is null) then raise exception '%: an open with no from made a row', f; end if;
    if (select coalesce(sum(n), 0) from _t23 where type = 'timelapse_share' and dim = 'action' and val = 'video') < 1 then
      raise exception '%: timelapse_share.action is missing', f;
    end if;
    if (select coalesce(sum(n), 0) from _t23 where type = 'timelapse_open' and dim = '') < 3 then raise exception '%: the opens'' total lost one', f; end if;
    if (select coalesce(sum(n), 0) from _t23 where type = 'share_action' and dim = 'action' and val = 'native') < 1 then
      raise exception '%: share_action.action changed', f;
    end if;
    if exists (select 1 from _t23 where type = 'share_action' and dim = 'action' and val = 'video') then raise exception '%: a time-lapse share counted as a share', f; end if;
  end loop;

  -- ── The stats: five numbers a point, this hour's opens among them, and the two lists ────────
  v := overflight_private.admin_stats_compute('24h');
  last := v -> 'series' -> (jsonb_array_length(v -> 'series') - 1);
  if exists (select 1 from jsonb_array_elements(v -> 'series') p where jsonb_array_length(p) <> 5) then raise exception 'series: a point is not five numbers'; end if;
  if (last ->> 4)::int < 3 then raise exception 'series: this hour has % time-lapse opens, expected the 3 test ones at least', last ->> 4; end if;
  if (last ->> 2)::int < 1 then raise exception 'series: this hour lost its share'; end if;
  if not (v -> 'top' ? 'timelapse_open.from') or not (v -> 'top' ? 'timelapse_share.action') then raise exception 'top: the time-lapse lists are missing'; end if;
  if (v #>> '{totals,timelapse_open}')::int < 3 then raise exception 'totals: timelapse_open'; end if;
  if (v #>> '{dimTotals,timelapse_share.action}')::int < 1 then raise exception 'dimTotals: timelapse_share.action'; end if;
  if (v -> 'series' -> 0 ->> 0)::bigint is null or v -> 'funnel' is null then raise exception 'the rest of the stats changed shape'; end if;

  -- ── The hourly rollup writes the column (a closed hour of its own, far in the past of the test's events) ──
  if pg_get_functiondef('overflight_private.roll_event_hours(int)'::regprocedure) !~ 'timelapse' then raise exception 'roll_event_hours does not write timelapse'; end if;

  raise notice '0023 checks passed';
end
$$;
