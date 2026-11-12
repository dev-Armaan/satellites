-- Checks for 0015_event_backfill.sql. Run as begin; <0015>; <this file>; rollback.  Nothing survives.
-- Row writes only (two test backfill rows, in hours with real traffic so the series has those buckets); no DDL on an
-- existing table. admin_stats_compute is called directly: it is the unchecked core, as the cron job calls it.

do $$
declare
  r text;
  v_h24 timestamptz := date_trunc('hour', now()) - interval '2 hours';  -- inside 24h
  v_h3d timestamptz := date_trunc('hour', now()) - interval '3 days';   -- inside 7d, outside 24h
  v_s jsonb; v_real bigint; v_bucket jsonb; v_exp_search bigint; v_exp_session bigint;
begin
  -- ── Grants: the table is private ──────────────────────────────────────────────────────────
  foreach r in array array['anon', 'authenticated'] loop
    if has_table_privilege(r, 'overflight_private.event_backfill', 'select')
       or has_table_privilege(r, 'overflight_private.event_backfill', 'insert') then
      raise exception 'grants: % can touch event_backfill', r;
    end if;
    if has_function_privilege(r, 'overflight_private.admin_stats_compute(text)', 'execute') then
      raise exception 'grants: % can call admin_stats_compute', r;
    end if;
  end loop;

  -- ── The outage rows ───────────────────────────────────────────────────────────────────────
  if (select sum(searches) from overflight_private.event_backfill where hour::date = '2026-11-11') <> 1894
     or (select sum(sessions) from overflight_private.event_backfill where hour::date = '2026-11-11') <> 1217
     or (select sum(active) from overflight_private.event_backfill where hour::date = '2026-11-11') <> 1327 then
    raise exception 'rows: the 2026-11-11 backfill is not 1894 searches, 1217 tabs, 1327 active';
  end if;

  -- ── 'all': every row counts, and recorded is totals without them ──────────────────────────
  v_s := overflight_private.admin_stats_compute('all');
  -- (a missing key would make every comparison below null, and a null comparison never raises)
  if jsonb_typeof(v_s -> 'recorded' -> 'search') is distinct from 'number' or jsonb_typeof(v_s -> 'recorded' -> 'session') is distinct from 'number' then
    raise exception 'all: no recorded.search / recorded.session (%)', v_s -> 'recorded';
  end if;
  if (v_s -> 'totals' ->> 'search')::bigint - (v_s -> 'recorded' ->> 'search')::bigint
       <> (select sum(searches) from overflight_private.event_backfill)
     or (v_s -> 'totals' ->> 'session')::bigint - (v_s -> 'recorded' ->> 'session')::bigint
       <> (select sum(sessions) from overflight_private.event_backfill) then
    raise exception 'all: totals - recorded <> backfill (%, %)', v_s -> 'totals', v_s -> 'recorded';
  end if;

  -- ── Range edges: a row 2 h ago counts in 24h; a row 3 days ago only from 7d up ───────────
  insert into overflight_private.event_backfill (hour, searches, sessions, active, basis) values
    (v_h24, 1000003, 500001, 700001, 'test'),
    (v_h3d,    9001,   8001,   7001, 'test');

  -- Expected: the 2-hour-old test row, not the 3-day-old one, plus whichever real rows are still inside 24 hours.
  select 1000003 + coalesce(sum(searches), 0), 500001 + coalesce(sum(sessions), 0) into v_exp_search, v_exp_session
  from overflight_private.event_backfill where basis <> 'test' and hour >= now() - interval '23 hours';
  v_s := overflight_private.admin_stats_compute('24h');
  if (v_s -> 'totals' ->> 'search')::bigint - (v_s -> 'recorded' ->> 'search')::bigint <> v_exp_search
     or (v_s -> 'totals' ->> 'session')::bigint - (v_s -> 'recorded' ->> 'session')::bigint <> v_exp_session then
    raise exception '24h: totals - recorded <> the rows in range (expected % / %, got %, %)', v_exp_search, v_exp_session, v_s -> 'totals', v_s -> 'recorded';
  end if;

  -- The hourly bar for v_h24: recorded searches and tabs in that hour + the row.
  v_bucket := (select x from jsonb_array_elements(v_s -> 'series') x where (x ->> 0)::bigint = (extract(epoch from v_h24) * 1000)::bigint);
  select count(*) filter (where type = 'search') into v_real from public.events where created_at >= v_h24 and created_at < v_h24 + interval '1 hour';
  if v_bucket is null or (v_bucket ->> 1)::bigint <> v_real + 1000003 then
    raise exception '24h series: % searches in the % bar, expected %', v_bucket ->> 1, v_h24, v_real + 1000003;
  end if;
  select count(distinct sid) into v_real from public.events where created_at >= v_h24 and created_at < v_h24 + interval '1 hour';
  if (v_bucket ->> 3)::bigint <> v_real + 700001 then
    raise exception '24h series: % tabs in the % bar, expected % (active, not new)', v_bucket ->> 3, v_h24, v_real + 700001;
  end if;
  if (v_bucket ->> 2)::bigint >= 1000003 then raise exception '24h series: shares picked up the backfill'; end if;

  v_s := overflight_private.admin_stats_compute('7d');
  if (v_s -> 'totals' ->> 'search')::bigint - (v_s -> 'recorded' ->> 'search')::bigint
       <> (select sum(searches) from overflight_private.event_backfill where hour >= date_trunc('hour', now() - interval '7 days')) then
    raise exception '7d: the 3-day-old row is missing from the totals';
  end if;

  -- ── Daily series (30d): the row's tabs land in its UTC day ────────────────────────────────
  v_s := overflight_private.admin_stats_compute('30d');
  v_bucket := (select x from jsonb_array_elements(v_s -> 'series') x
               where (x ->> 0)::bigint = (extract(epoch from date_trunc('day', v_h3d at time zone 'utc') at time zone 'utc') * 1000)::bigint);
  if v_bucket is null or (v_bucket ->> 3)::bigint < 8001 or (v_bucket ->> 1)::bigint < 9001 then
    raise exception '30d series: the % day bar lacks the row (%)', v_h3d::date, v_bucket;
  end if;

  -- ── Nothing else moved: the top lists and funnel are recorded-only ────────────────────────
  if (v_s -> 'funnel' ->> 'search')::bigint >= 500001 then raise exception 'funnel picked up the backfill'; end if;
  if (v_s -> 'dimTotals' ->> 'search.label')::bigint > (v_s -> 'recorded' ->> 'search')::bigint then
    raise exception 'dimTotals picked up the backfill';
  end if;

  raise notice '0015 checks passed';
end
$$;
