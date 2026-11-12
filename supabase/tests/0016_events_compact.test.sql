-- Checks for 0016_events_compact.sql. Run as begin; <0016>; <this file>; rollback.  Nothing survives.
-- Row writes only: test tabs and events on an Eastern day in 2001, a real rollup of yesterday, rollup rows. No DDL on an
-- existing table. maintain_events is not called: its prune would delete the real old events inside the test.
-- Holds the maintenance lock throughout (the :17 cron run skips if it lands meanwhile) and reads yesterday's and today's
-- raw events a few times: run it clear of :07, :17 and :37.

-- ── Grants: nothing new is reachable by anon or authenticated ───────────────────────────────
do $$
declare r text;
begin
  foreach r in array array['anon', 'authenticated'] loop
    if has_table_privilege(r, 'public.event_hours', 'select') or has_table_privilege(r, 'public.event_days_rest', 'select')
       or has_table_privilege(r, 'public.event_dists', 'select') or has_table_privilege(r, 'public.event_alltime', 'select')
       or has_table_privilege(r, 'public.event_alltime_rest', 'select') or has_table_privilege(r, 'public.event_alltime_dists', 'select')
       or has_table_privilege(r, 'overflight_private.event_days_utc', 'select') then
      raise exception 'grants: % can read a new table', r;
    end if;
    if has_function_privilege(r, 'overflight_private.roll_event_day(date)', 'execute')
       or has_function_privilege(r, 'overflight_private.roll_event_hours(int)', 'execute')
       or has_function_privilege(r, 'overflight_private.maintain_events()', 'execute')
       or has_function_privilege(r, 'overflight_private.admin_stats_compute(text)', 'execute') then
      raise exception 'grants: % can call a maintenance function', r;
    end if;
  end loop;
end
$$;

-- ── The move: UTC rollups kept aside, Eastern rollups start empty ───────────────────────────
do $$
begin
  if exists (select 1 from public.events) and not exists (select 1 from overflight_private.event_days_utc) then
    raise exception 'move: event_days_utc is empty';
  end if;
  if exists (select 1 from public.event_days) or exists (select 1 from public.event_rolled)
     or exists (select 1 from public.event_alltime) or exists (select 1 from public.event_hours) then
    raise exception 'move: the rollups were not emptied';
  end if;
end
$$;

-- ── hist_pct = percentile_cont over the expanded values ─────────────────────────────────────
create temp table _h (v float8, n bigint) on commit drop;
do $$
declare
  p float8; a float8; b float8;
begin
  for i in 1 .. 40 loop
    truncate _h;
    insert into _h select round((random() * 50)::numeric, i % 3)::float8, 1 + floor(random() * (1 + i % 5))::bigint
      from generate_series(1, 1 + (i * 7) % 60);
    foreach p in array array[0, 0.25, 0.5, 0.75, 0.9, 1]::float8[] loop
      select overflight_private.hist_pct(array_agg(h.v order by h.v), array_agg(h.n order by h.v), p) into a
        from (select v, sum(n)::bigint n from _h group by v) h;
      select percentile_cont(p) within group (order by h.v) into b from _h h, generate_series(1, h.n);
      if abs(a - b) > 1e-9 then raise exception 'hist_pct(%): % but percentile_cont says % (set %)', p, a, b, i; end if;
    end loop;
  end loop;
  if overflight_private.hist_pct('{}'::float8[], '{}'::bigint[], 0.5) is not null then raise exception 'hist_pct: empty is not null'; end if;
end
$$;

-- ── A test day: 2001-02-03, Eastern (UTC-5) ─────────────────────────────────────────────────
-- Three tabs. 'Top, Test' searched 10 times, 205 other labels once each (the day keeps 200: Top + 199, 6 in the rest).
-- One search at 23:30 Eastern (04:30 UTC the next day: still this Eastern day), one at 00:30 the day after (not this day).
insert into public.event_sessions (sid, first_at, last_at, device, country) values
  ('test16_sid_aaaaaaaaaaaaaa', '2001-02-03 09:00 America/New_York', '2001-02-03 23:59 America/New_York', 'phone', 'ca'),
  ('test16_sid_bbbbbbbbbbbbbb', '2001-02-03 09:00 America/New_York', '2001-02-03 12:00 America/New_York', 'desktop', 'us'),
  ('test16_sid_cccccccccccccc', '2001-02-03 09:00 America/New_York', '2001-02-04 01:00 America/New_York', 'desktop', 'us');
insert into public.events (created_at, sid, type, props)
select '2001-02-03 10:00 America/New_York'::timestamptz + make_interval(secs => g), 'test16_sid_aaaaaaaaaaaaaa', 'search',
       jsonb_build_object('label', 'Top, Test', 'cell', '1.0,2.0', 'source', 'search')
from generate_series(1, 10) g;
insert into public.events (created_at, sid, type, props)
select '2001-02-03 11:00 America/New_York'::timestamptz + make_interval(secs => g), 'test16_sid_bbbbbbbbbbbbbb', 'search',
       jsonb_build_object('label', 'Place ' || chr(65 + g / 26) || chr(65 + g % 26), 'cell', '3.0,4.0', 'source', 'example')
from generate_series(0, 204) g;
insert into public.events (created_at, sid, type, props) values
  ('2001-02-03 23:30 America/New_York', 'test16_sid_aaaaaaaaaaaaaa', 'search', '{"label": "Late, Test", "source": "search"}'),
  ('2001-02-04 00:30 America/New_York', 'test16_sid_cccccccccccccc', 'search', '{"label": "Next, Test", "source": "search"}'),
  ('2001-02-03 12:00 America/New_York', 'test16_sid_cccccccccccccc', 'results', '{"ms": 1234, "partial": true}'),
  ('2001-02-03 12:00 America/New_York', 'test16_sid_cccccccccccccc', 'results', '{"ms": 1235, "partial": false, "archive_failed": true}'),
  ('2001-02-03 12:00 America/New_York', 'test16_sid_cccccccccccccc', 'results', '{"ms": 2001}'),
  ('2001-02-03 12:00 America/New_York', 'test16_sid_cccccccccccccc', 'vitals', '{"lcp": 2504, "inp": 88, "cls": 0.0123}'),
  ('2001-02-03 12:30 America/New_York', 'test16_sid_cccccccccccccc', 'share_action', '{"action": "x", "norad": 25544}');

do $$
declare
  v_d date := '2001-02-03';
  v_n bigint;
begin
  -- Hours: the first roll starts at the first raw event's hour (the test's, in 2001).
  perform overflight_private.roll_event_hours(48);
  if (select searches from public.event_hours where hour = '2001-02-03 10:00 America/New_York') <> 10
     or (select searches from public.event_hours where hour = '2001-02-03 11:00 America/New_York') <> 205
     or (select active from public.event_hours where hour = '2001-02-03 12:00 America/New_York') <> 1
     or (select shares from public.event_hours where hour = '2001-02-03 12:00 America/New_York') <> 1 then
    raise exception 'hours: wrong counts (%)', (select jsonb_agg(h) from public.event_hours h where searches + shares > 0);
  end if;
  if (select count(*) from public.event_hours) <> 48 then raise exception 'hours: % rows, expected 48 (zeros included)', (select count(*) from public.event_hours); end if;

  perform overflight_private.roll_event_day(v_d);

  -- Day totals, Eastern: 10 + 205 + the 23:30 search, not the 00:30 one; three tabs.
  if (select n from public.event_days where day = v_d and type = 'search' and dim = '') <> 216 then
    raise exception 'day: % searches, expected 216', (select n from public.event_days where day = v_d and type = 'search' and dim = '');
  end if;
  if (select n from public.event_days where day = v_d and type = 'session' and dim = '') <> 3 then raise exception 'day: tabs <> 3'; end if;
  if (select n from public.event_days where day = v_d and type = 'session' and dim = 'device' and val = 'desktop') <> 2 then raise exception 'day: desktop tabs <> 2'; end if;
  if exists (select 1 from public.event_days where day = v_d + 1) then raise exception 'day: the next day was rolled too'; end if;

  -- The cut: 200 labels kept, the rest counted.
  if (select count(*) from public.event_days where day = v_d and type = 'search' and dim = 'label') <> 200 then
    raise exception 'cut: % label rows, expected 200', (select count(*) from public.event_days where day = v_d and type = 'search' and dim = 'label');
  end if;
  if (select n from public.event_days where day = v_d and type = 'search' and dim = 'label' and val = 'Top, Test') <> 10 then raise exception 'cut: Top lost'; end if;
  if (select n from public.event_days_rest where day = v_d and type = 'search' and dim = 'label') <> 7 then
    -- 207 labels (Top, 205 places, Late): 200 kept, 7 counted in the rest
    raise exception 'cut: rest = %, expected 7', (select n from public.event_days_rest where day = v_d and type = 'search' and dim = 'label');
  end if;
  if (select sum(n) from public.event_days where day = v_d and type = 'search' and dim = 'label')
     + (select n from public.event_days_rest where day = v_d and type = 'search' and dim = 'label') <> 216 then
    raise exception 'cut: kept + rest <> every labelled search';
  end if;

  -- All time: every value (well under its top 1000).
  if (select count(*) from public.event_alltime where type = 'search' and dim = 'label') <> 207 then raise exception 'alltime: labels <> 207'; end if;
  if (select n from public.event_alltime where type = 'search' and dim = 'label' and val = 'Top, Test') <> 10 then raise exception 'alltime: Top <> 10'; end if;

  -- Value counts: 1234 -> 1230, 1235 -> 1240, 2001 -> 2000; flags 1 / 0.
  if (select jsonb_object_agg(v::text, n) from public.event_dists where day = v_d and metric = 'results.ms') <> '{"1230": 1, "1240": 1, "2000": 1}'::jsonb then
    raise exception 'dists: results.ms = %', (select jsonb_object_agg(v::text, n) from public.event_dists where day = v_d and metric = 'results.ms');
  end if;
  if (select n from public.event_dists where day = v_d and metric = 'results.partial' and v = 1) <> 1
     or (select n from public.event_dists where day = v_d and metric = 'results.partial' and v = 0) <> 1
     or (select n from public.event_dists where day = v_d and metric = 'results.archive_failed' and v = 1) <> 1
     or (select v from public.event_dists where day = v_d and metric = 'vitals.lcp') <> 2500
     or (select v from public.event_dists where day = v_d and metric = 'vitals.cls') <> 0.0123 then
    raise exception 'dists: flags or vitals wrong (%)', (select jsonb_agg(d) from public.event_dists d where day = v_d);
  end if;
  if (select sum(n) from public.event_alltime_dists where metric = 'results.ms') <> 3 then raise exception 'dists: all-time results.ms <> 3'; end if;

  -- Once per day: a second roll adds nothing.
  perform overflight_private.roll_event_day(v_d);
  if (select n from public.event_alltime where type = 'search' and dim = 'label' and val = 'Top, Test') <> 10
     or (select sum(n) from public.event_alltime_dists where metric = 'results.ms') <> 3 then
    raise exception 'idempotence: rolling the day twice counted it twice';
  end if;
  if not exists (select 1 from public.event_rolled where day = v_d) then raise exception 'rolled: day not marked'; end if;
end
$$;

-- ── Real data: yesterday rolled, today from raw events ──────────────────────────────────────
-- Mark every day from the test day to the day before yesterday as rolled (with no rollup rows), so yesterday is the only
-- real rolled day and the tail is today.
do $$
declare
  v_tz text := overflight_private.admin_tz();
  v_today date := (now() at time zone overflight_private.admin_tz())::date;
  v_y0 timestamptz := ((now() at time zone overflight_private.admin_tz())::date - 1)::timestamp at time zone overflight_private.admin_tz();
  v_s jsonb; v_s30 jsonb; v_all jsonb; v_24 jsonb;
  v_exp bigint; v_got bigint; v_bf bigint; a float8; b float8;
begin
  insert into public.event_rolled (day) select d::date from generate_series(date '2001-02-04', v_today - 2, interval '1 day') d;
  perform overflight_private.roll_event_day(v_today - 1);
  if (select max(day) from public.event_rolled) <> v_today - 1 then raise exception 'real: yesterday not rolled'; end if;

  -- Yesterday's day totals are its raw counts.
  select count(*) into v_exp from public.events where type = 'search' and created_at >= v_y0 and created_at < v_y0 + interval '1 day';
  if (select n from public.event_days where day = v_today - 1 and type = 'search' and dim = '') is distinct from v_exp then
    raise exception 'real: yesterday % searches rolled, % raw', (select n from public.event_days where day = v_today - 1 and type = 'search' and dim = ''), v_exp;
  end if;
  if (select count(*) from public.event_days where day = v_today - 1 and type = 'search' and dim = 'cell') > 3000
     or exists (select 1 from public.event_days where day = v_today - 1 and dim not in ('', 'cell')
                group by type, dim having count(*) > 200) then
    raise exception 'real: a breakdown kept more than its top N';
  end if;

  v_s := overflight_private.admin_stats_compute('7d');
  v_s30 := overflight_private.admin_stats_compute('30d');
  v_all := overflight_private.admin_stats_compute('all');
  v_24 := overflight_private.admin_stats_compute('24h');

  -- 'from': Eastern midnights for 7d / 30d, now - 24h for 24h.
  if (v_s ->> 'from')::bigint <> (extract(epoch from (v_today - 6)::timestamp at time zone v_tz) * 1000)::bigint
     or (v_s30 ->> 'from')::bigint <> (extract(epoch from (v_today - 29)::timestamp at time zone v_tz) * 1000)::bigint
     or (v_24 ->> 'from')::bigint <> (extract(epoch from now() - interval '24 hours') * 1000)::bigint then
    raise exception 'from: 7d %, 30d %, 24h %', v_s ->> 'from', v_s30 ->> 'from', v_24 ->> 'from';
  end if;

  -- 7d = yesterday's rollup + today's raw events (the fake rolled days have no rows).
  select count(*) into v_exp from public.events where type = 'search' and created_at >= v_y0;
  if (v_s -> 'recorded' ->> 'search')::bigint <> v_exp then
    raise exception '7d: % recorded searches, % raw since yesterday', v_s -> 'recorded' ->> 'search', v_exp;
  end if;
  select count(*) into v_exp from public.events where type = 'results' and created_at >= v_y0;
  if (v_s -> 'results' ->> 'n')::bigint <> v_exp or (v_s -> 'totals' ->> 'results')::bigint <> v_exp then
    raise exception '7d: results n % / total %, % raw', v_s -> 'results' ->> 'n', v_s -> 'totals' ->> 'results', v_exp;
  end if;
  -- Tabs: distinct per Eastern day, summed.
  select count(*) into v_exp from (select distinct (created_at at time zone v_tz)::date, sid from public.events where created_at >= v_y0) x;
  if (v_s -> 'recorded' ->> 'session')::bigint <> v_exp then
    raise exception '7d: % recorded tabs, % raw (per Eastern day)', v_s -> 'recorded' ->> 'session', v_exp;
  end if;
  -- Sources are never cut: the list matches raw exactly.
  if (select jsonb_object_agg(x ->> 0, (x ->> 1)::bigint) from jsonb_array_elements(v_s -> 'top' -> 'search.source') x)
     <> (select jsonb_object_agg(src, n) from (select props ->> 'source' src, count(*) n from public.events
         where type = 'search' and created_at >= v_y0 and props ? 'source' group by 1) s) then
    raise exception '7d: search.source differs from raw';
  end if;
  -- Speed: percentile_cont over the 10 ms values of the raw events.
  select percentile_cont(0.5) within group (order by round((props ->> 'ms')::numeric, -1)::float8) into a
    from public.events where type = 'results' and created_at >= v_y0 and props ? 'ms';
  b := (v_s -> 'results' ->> 'p50Ms')::float8;
  if (a is null) <> (b is null) or abs(a - b) > 1e-6 then raise exception '7d: p50 % from rollups, % from raw', b, a; end if;
  select percentile_cont(0.75) within group (order by (props ->> 'cls')::float8) into a
    from public.events where type = 'vitals' and created_at >= v_y0 and props ? 'cls';
  b := (v_s -> 'vitals' ->> 'cls')::float8;
  if (a is null) <> (b is null) or abs(a - b) > 1e-9 then raise exception '7d: cls p75 % from rollups, % from raw', b, a; end if;
  select count(*) into v_exp from public.events where type = 'results' and created_at >= v_y0 and (props ->> 'partial')::boolean;
  if (v_s -> 'results' ->> 'partial')::bigint <> v_exp then raise exception '7d: partial % vs raw %', v_s -> 'results' ->> 'partial', v_exp; end if;
  -- The hourly chart: every search since the range start (raw: event_hours only holds the test's 2001 hours) + backfill.
  select count(*) into v_exp from public.events where type = 'search' and created_at >= (v_today - 6)::timestamp at time zone v_tz;
  select coalesce(sum(searches), 0) into v_bf from overflight_private.event_backfill where hour >= (v_today - 6)::timestamp at time zone v_tz;
  select sum((x ->> 1)::bigint) into v_got from jsonb_array_elements(v_s -> 'series') x;
  if v_got <> v_exp + v_bf then raise exception '7d series: % searches, expected % + % backfill', v_got, v_exp, v_bf; end if;
  if (select min((x ->> 0)::bigint) from jsonb_array_elements(v_s -> 'series') x) <> (v_s ->> 'from')::bigint then
    raise exception '7d series: first bar is not the range start';
  end if;

  -- 30d: the same days as 7d here; its daily bars start at Eastern midnights.
  if (v_s30 -> 'totals') <> (v_s -> 'totals') then raise exception '30d: totals differ from 7d (% vs %)', v_s30 -> 'totals', v_s -> 'totals'; end if;
  if exists (select 1 from jsonb_array_elements(v_s30 -> 'series') x
             where (to_timestamp((x ->> 0)::bigint / 1000.0) at time zone v_tz)::time <> '00:00') then
    raise exception '30d series: a bar does not start at Eastern midnight';
  end if;

  -- all: the test day too (its 216 searches), and its labels in the all-time list.
  if (v_all -> 'recorded' ->> 'search')::bigint <> (v_s -> 'recorded' ->> 'search')::bigint + 216 then
    raise exception 'all: % recorded searches, expected 7d''s % + 216', v_all -> 'recorded' ->> 'search', v_s -> 'recorded' ->> 'search';
  end if;
  if (v_all -> 'dimTotals' ->> 'search.label')::bigint <> (v_s -> 'dimTotals' ->> 'search.label')::bigint + 216 then
    raise exception 'all: dimTotals search.label % vs 7d % + 216', v_all -> 'dimTotals' ->> 'search.label', v_s -> 'dimTotals' ->> 'search.label';
  end if;

  -- 24h: raw events, as before.
  select count(*) into v_exp from public.events where type = 'results' and created_at >= now() - interval '24 hours';
  if (v_24 -> 'results' ->> 'n')::bigint <> v_exp then raise exception '24h: results n % vs raw %', v_24 -> 'results' ->> 'n', v_exp; end if;

  -- The prune line: 48 hours at most, and never past what is rolled.
  if overflight_private.event_raw_cutoff() > now() - interval '48 hours'
     or overflight_private.event_raw_cutoff() > v_today::timestamp at time zone v_tz
     or overflight_private.event_raw_cutoff() > (select max(hour) + interval '1 hour' from public.event_hours) then
    raise exception 'cutoff: % is past what may go', overflight_private.event_raw_cutoff();
  end if;

  raise notice '0016 checks passed';
end
$$;
