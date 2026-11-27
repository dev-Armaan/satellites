-- 0031: where a search's wait goes (owner, 2026-11-27).
--
-- The results event's `ms` is one number: a search took 2.8 s at the median and 4.0 s at the 90th percentile, and
-- nothing recorded whether that was the archives, the visitor's device, or the pauses the arrival is timed to. From a
-- quarter of tabs the app now sends eight more whole numbers of milliseconds with `results` (src/app/telemetry.ts
-- searchLegs; no place, no text):
--   t_report   until a report was in hand        t_camera   then the readout's dwell and the camera's flight
--   t_settle   then the final report and cover   t_hero     then the lead photo, downloaded, toned and decoded
--   e_catalog, e_passes, e_archive               the engine's own clocks: the orbit catalog, the pass search, the archive
--   ahead      how long before it was on screen a link's search had begun (links only)
-- The four t_ add up to `ms`.
--
-- What changes
--   * search_leg_keys(): the eight names, in one place.
--   * event_props keeps them on `results` (0 to 600 000, as `ms`); 0030's otherwise. Until this is applied they are
--     dropped like any prop it does not know, and the event is stored as before.
--   * event_dist_counts counts them like `ms` ('results.t_report', ...), in 100 ms steps and with everything past
--     30 s counted as 30 s: at most 300 values a leg, where `ms` keeps its 10 ms. The hourly and daily rollups and the
--     all-time table take whatever this function returns (0016, 0019), so the legs are rolled up like the rest and no
--     admin range reads raw events for them.
--   * admin_stats_compute adds results.legs: per leg, how many searches said it, its median and its 90th percentile.
--     Nothing else in it changes (0028's, with those lines added). The page shows them under the search speed.
-- No table changes, nothing backfilled (no leg was recorded before), and log_events is untouched, so this holds no
-- lock a visitor's batch waits for. The cached stats gain the legs at the next hourly refresh; the page says
-- "not recorded yet" until then. Idempotent: create or replace.

-- ── The legs' names ─────────────────────────────────────────────────────────────────────────
create or replace function overflight_private.search_leg_keys()
returns text[]
language sql immutable
set search_path = public
as $$
  select array['t_report', 't_camera', 't_settle', 't_hero', 'e_catalog', 'e_passes', 'e_archive', 'ahead']
$$;

-- ── The props a results event keeps (0030's, with the legs) ─────────────────────────────────
create or replace function overflight_private.event_props(p_type text, p jsonb)
returns jsonb
language plpgsql immutable
set search_path = public
as $$
declare
  verdicts constant text[] := array['imaged', 'likely', 'could', 'overhead'];
  coll_re  constant text := '^[a-z0-9-]{1,40}$';
  share_from constant text[] := array['headline', 'hero', 'viewer', 'pass'];
  v jsonb;
begin
  if p is null or jsonb_typeof(p) <> 'object' then p := '{}'::jsonb; end if;
  case p_type
    when 'view' then
      v := jsonb_build_object('entry', overflight_private.jenum(p, 'entry', array['landing', 'deep_link', 'share_link']));
    when 'search' then
      v := jsonb_build_object(
        'source',  overflight_private.jenum(p, 'source', array['search', 'example', 'surprise', 'near_me', 'pin', 'deep_link', 'share_link', 'retry']),
        'label',   overflight_private.clean_label(p ->> 'label'),
        'cell',    overflight_private.clean_cell(p ->> 'cell'),
        'country', overflight_private.jmatch(p, 'country', '^[a-z]{2}$', 2));
    when 'results', 'results_final' then
      v := jsonb_build_object(
        'sats',           overflight_private.jint(p, 'sats', 0, 100000),
        'photos',         overflight_private.jint(p, 'photos', 0, 100000),
        'passes',         overflight_private.jint(p, 'passes', 0, 1000000),
        'ms',             overflight_private.jint(p, 'ms', 0, 600000),
        'partial',        overflight_private.jbool(p, 'partial'),
        'archive_failed', overflight_private.jbool(p, 'archive_failed'))
        || coalesce((select jsonb_object_agg(k.key, overflight_private.jint(p, k.key, 0, 600000))
                     from unnest(overflight_private.search_leg_keys()) as k(key)), '{}'::jsonb);
    when 'pass_open', 'lightbox_open', 'share_open', 'share_action' then
      v := jsonb_build_object(
        'norad',      overflight_private.jint(p, 'norad', 1, 999999),
        'sat',        overflight_private.clean_masked(p ->> 'sat', 60),
        'verdict',    overflight_private.jenum(p, 'verdict', verdicts),
        'collection', overflight_private.jmatch(p, 'collection', coll_re, 40));
      if p_type = 'share_open' then
        v := v || jsonb_build_object(
          'kind', overflight_private.jenum(p, 'kind', array['pass', 'summary']),
          'from', overflight_private.jenum(p, 'from', share_from));
      elsif p_type = 'share_action' then
        v := v || jsonb_build_object(
          'action', overflight_private.jenum(p, 'action', array['x', 'copy_link', 'copy_image', 'save_png', 'native']),
          'from',   overflight_private.jenum(p, 'from', share_from));
        if v ->> 'action' is null then return null; end if;
      end if;
    when 'about_open' then
      v := '{}'::jsonb;
    when 'timelapse_open' then
      v := jsonb_build_object('from', overflight_private.jenum(p, 'from', array['results', 'viewer', 'link']));
    when 'timelapse_share' then
      v := jsonb_build_object('action', overflight_private.jenum(p, 'action', array['link', 'video']));
      if v ->> 'action' is null then return null; end if;
    when 'support_click' then
      v := jsonb_build_object('from', overflight_private.jenum(p, 'from', array['bar', 'share', 'results', 'about', 'timelapse', 'landing', 'computing', 'about_top']));
      if v ->> 'from' is null then return null; end if;
    when 'error' then
      v := jsonb_build_object(
        'where', overflight_private.jenum(p, 'where', array['phase', 'window', 'promise']),
        'msg',   overflight_private.clean_msg(p ->> 'msg'));
      if v ->> 'msg' is null then return null; end if;
    when 'vitals' then
      v := jsonb_build_object(
        'lcp', overflight_private.jint(p, 'lcp', 0, 120000),
        'fcp', overflight_private.jint(p, 'fcp', 0, 120000),
        'inp', overflight_private.jint(p, 'inp', 0, 60000),
        'cls', round(overflight_private.num_in(p, 'cls', 0, 100), 4));
    else
      return null;
  end case;
  return jsonb_strip_nulls(v);
end
$$;

-- ── Value counts (0016's, with the legs: 100 ms steps, capped at 30 s) ──────────────────────
-- Per Eastern day, how many results / vitals events had each value: times in 10 ms steps (the page shows seconds to two
-- decimals), INP in whole ms, CLS as sent (4 decimals), the two result flags as 1 / 0, a search's legs in 100 ms steps.
create or replace function overflight_private.event_dist_counts(p_from timestamptz, p_to timestamptz)
returns table (day date, metric text, v numeric, n bigint)
language sql
stable
set search_path = public
as $$
  with e as materialized (
    select (ev.created_at at time zone overflight_private.admin_tz())::date as day, ev.type, ev.props
    from public.events ev
    where ev.created_at >= p_from and ev.created_at < p_to and ev.type in ('results', 'vitals')
  )
  select e.day, 'results.ms', round((e.props ->> 'ms')::numeric, -1), count(*) from e where e.type = 'results' and e.props ? 'ms' group by 1, 3
  union all select e.day, 'results.partial', ((e.props ->> 'partial')::boolean)::int::numeric, count(*)
    from e where e.type = 'results' and e.props ? 'partial' group by 1, 3
  union all select e.day, 'results.archive_failed', ((e.props ->> 'archive_failed')::boolean)::int::numeric, count(*)
    from e where e.type = 'results' and e.props ? 'archive_failed' group by 1, 3
  union all select e.day, 'vitals.lcp', round((e.props ->> 'lcp')::numeric, -1), count(*) from e where e.type = 'vitals' and e.props ? 'lcp' group by 1, 3
  union all select e.day, 'vitals.inp', (e.props ->> 'inp')::numeric, count(*) from e where e.type = 'vitals' and e.props ? 'inp' group by 1, 3
  union all select e.day, 'vitals.cls', (e.props ->> 'cls')::numeric, count(*) from e where e.type = 'vitals' and e.props ? 'cls' group by 1, 3
  union all select e.day, 'results.' || k.key, least(round((e.props ->> k.key)::numeric, -2), 30000), count(*)
    from e cross join unnest(overflight_private.search_leg_keys()) as k(key)
    where e.type = 'results' and e.props ? k.key group by 1, 2, 3
$$;

-- ── Admin stats (0028's, with results.legs) ─────────────────────────────────────────────────
create or replace function overflight_private.admin_stats_compute(p_range text DEFAULT '7d'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
 SET "TimeZone" TO 'UTC'
 SET work_mem TO '16MB'
AS $function$
declare
  v_tz     text := overflight_private.admin_tz();
  v_now    timestamptz := now();
  v_to     timestamptz := date_trunc('hour', now()) + interval '1 hour';
  v_today  date := (now() at time zone overflight_private.admin_tz())::date;
  v_from   timestamptz;  -- where the range starts
  v_day0   date;         -- its first Eastern day
  v_split  timestamptz;  -- the end of the last rolled day
  v_recent timestamptz;  -- event_recent_into from here
  v_hours  timestamptz;  -- the end of the last rolled hour (event_hours)
  v_hourly boolean;
  v_out    jsonb;
  v_bf_search  bigint;
  v_bf_session bigint;
begin
  -- No admin check here: only admin_stats_core (checked), public.admin_stats (checked) and the cron refresh call this.
  if p_range is null or p_range not in ('24h', '7d', '30d', 'all') then p_range := '7d'; end if;
  v_hourly := p_range in ('24h', '7d');
  v_split := coalesce((select (max(day) + 1)::timestamp at time zone v_tz from public.event_rolled), '-infinity'::timestamptz);
  v_hours := coalesce((select max(hour) + interval '1 hour' from public.event_hours), '-infinity'::timestamptz);
  v_from := case p_range
    when '24h' then date_trunc('hour', v_now) - interval '24 hours'
    when '7d'  then (v_today - 6)::timestamp at time zone v_tz
    when '30d' then (v_today - 29)::timestamp at time zone v_tz
    else '-infinity'::timestamptz end;
  v_day0 := case when isfinite(v_from) then (v_from at time zone v_tz)::date else '-infinity'::date end;
  v_recent := case when p_range = '24h' then v_from else v_split end;

  create temp table if not exists _agg (day date, type text, dim text, val text, n bigint) on commit drop;
  create temp table if not exists _rest (type text, dim text, n bigint) on commit drop;
  create temp table if not exists _dist (metric text, v float8, n bigint) on commit drop;
  truncate _agg, _rest, _dist;

  if p_range <> '24h' then
    -- Rolled days: day totals from event_days; breakdowns from event_days (7d, 30d) or the all-time tables (all).
    insert into _agg select d.day, d.type, d.dim, d.val, d.n from public.event_days d
      where d.day >= v_day0 and d.day < (v_split at time zone v_tz)::date and (p_range <> 'all' or d.dim = '');
    if p_range = 'all' then
      insert into _agg select null, a.type, a.dim, a.val, a.n from public.event_alltime a;
      insert into _rest select r.type, r.dim, r.n from public.event_alltime_rest r;
      insert into _dist select x.metric, x.v, x.n from public.event_alltime_dists x;
    else
      insert into _rest select r.type, r.dim, r.n from public.event_days_rest r
        where r.day >= v_day0 and r.day < (v_split at time zone v_tz)::date;
      insert into _dist select x.metric, x.v, x.n from public.event_dists x
        where x.day >= v_day0 and x.day < (v_split at time zone v_tz)::date;
    end if;
  end if;

  -- The rest of the range, once per transaction for each start.
  create temp table if not exists _rkey (from_at timestamptz, to_at timestamptz) on commit drop;
  create temp table if not exists _ragg (day date, type text, dim text, val text, n bigint) on commit drop;
  create temp table if not exists _rrest (day date, type text, dim text, n bigint) on commit drop;
  create temp table if not exists _rdist (day date, metric text, v float8, n bigint) on commit drop;
  if not exists (select 1 from _rkey k where k.from_at = v_recent and k.to_at = v_to) then
    truncate _rkey, _ragg, _rrest, _rdist;
    perform overflight_private.event_recent_into(v_recent, v_to);
    insert into _rkey values (v_recent, v_to);
  end if;
  insert into _agg select t.day, t.type, t.dim, t.val, t.n from _ragg t where t.day >= v_day0;
  insert into _rest select t.type, t.dim, t.n from _rrest t where t.day >= v_day0;
  insert into _dist select t.metric, t.v, t.n from _rdist t where t.day >= v_day0;

  -- 0015: hours whose events never reached the database add their reconstructed searches and tabs to the day totals
  -- (and so to the daily series). The same hours are added to the hourly series below; 'recorded' keeps the counts
  -- without them, for the ratios.
  select coalesce(sum(b.searches), 0), coalesce(sum(b.sessions), 0) into v_bf_search, v_bf_session
  from overflight_private.event_backfill b where b.hour >= v_from;
  insert into _agg
    select (b.hour at time zone v_tz)::date, t.type, '', '', sum(t.n)::bigint
    from overflight_private.event_backfill b
    cross join lateral (values ('search', b.searches), ('session', b.sessions)) t(type, n)
    where b.hour >= v_from and t.n > 0
    group by 1, 2;

  with
  tot as (select type, sum(n)::bigint n from _agg where dim = '' group by type),
  top as (
    select type, dim, val, sum(n)::bigint n, row_number() over (partition by type, dim order by sum(n) desc, val) rk
    from _agg where dim <> '' and type <> 'funnel' group by type, dim, val
  ),
  dimtot as (
    select k, sum(n)::bigint n from (
      select type || '.' || dim k, n from _agg where dim <> '' and type <> 'funnel'
      union all select type || '.' || dim, n from _rest where type <> 'funnel'
    ) x group by k
  ),
  dist as (
    select metric, array_agg(v order by v) vs, array_agg(n order by v) ns
    from (select metric, v, sum(n)::bigint n from _dist group by metric, v) h group by metric
  ),
  buckets as (
    select b from generate_series(v_from, v_now, interval '1 hour') b where v_hourly
    union all
    select d::date::timestamp at time zone v_tz
    from generate_series(coalesce((select min(day) from _agg), v_today), v_today, interval '1 day') d
    where not v_hourly
  ),
  hourly as (
    select u.b, sum(u.s) s, sum(u.sh) sh, sum(u.se) se, sum(u.tl) tl from (
      -- Rolled hours from event_hours, raw events after the last rolled hour.
      select h.hour b, h.searches s, h.shares sh, h.active se, h.timelapse tl from public.event_hours h
      where v_hourly and h.hour >= v_from and h.hour < v_hours
      union all
      select date_trunc('hour', created_at) b, count(*) filter (where type = 'search') s,
             count(*) filter (where type = 'share_action') sh, count(distinct sid) se,
             count(*) filter (where type = 'timelapse_open') tl
      from public.events
      where v_hourly and created_at >= greatest(v_from, v_hours)
      group by 1
      union all
      select f.hour, f.searches, 0, f.active, 0
      from overflight_private.event_backfill f where v_hourly and f.hour >= v_from
    ) u group by u.b
  ),
  daily as (
    select day::timestamp at time zone v_tz b, sum(n) filter (where type = 'search') s,
           sum(n) filter (where type = 'share_action') sh, sum(n) filter (where type = 'session') se,
           sum(n) filter (where type = 'timelapse_open') tl
    from _agg where not v_hourly and dim = '' group by day
  ),
  series as (
    select k.b, coalesce(x.s, 0) s, coalesce(x.sh, 0) sh, coalesce(x.se, 0) se, coalesce(x.tl, 0) tl
    from buckets k
    left join (select * from hourly union all select * from daily) x on x.b = k.b
  )
  select jsonb_build_object(
    'range', p_range,
    'generatedAt', (extract(epoch from v_now) * 1000)::bigint,
    'from', (extract(epoch from case when isfinite(v_from) then v_from
                                     else coalesce((select min(day) from _agg), v_today)::timestamp at time zone v_tz end) * 1000)::bigint,
    'bucket', case when v_hourly then 'hour' else 'day' end,
    'totals', coalesce((select jsonb_object_agg(type, n) from tot), '{}'::jsonb),
    'recorded', jsonb_build_object(
      'search', coalesce((select n from tot where type = 'search'), 0) - v_bf_search,
      'session', coalesce((select n from tot where type = 'session'), 0) - v_bf_session),
    'dimTotals', coalesce((select jsonb_object_agg(k, n) from dimtot), '{}'::jsonb),
    'funnel', coalesce((select jsonb_object_agg(val, s) from (select val, sum(n)::bigint s from _agg where type = 'funnel' group by val) f), '{}'::jsonb),
    'series', coalesce((select jsonb_agg(jsonb_build_array((extract(epoch from b) * 1000)::bigint, s, sh, se, tl) order by b) from series), '[]'::jsonb),
    'top', coalesce((
      select jsonb_object_agg(k, rows) from (
        select type || '.' || dim k, jsonb_agg(jsonb_build_array(val, n) order by rk) rows
        from top where rk <= case when dim = 'cell' then 3000 when type = 'session' and dim = 'lang' then 20
                                  when type = 'session' and dim in ('browser_lang', 'browser_lang_searched') then 200
                                  else 15 end group by type, dim
      ) t), '{}'::jsonb),
    'results', jsonb_build_object(
        'n', coalesce((select n from tot where type = 'results'), 0),
        'p50Ms', (select overflight_private.hist_pct(vs, ns, 0.5) from dist where metric = 'results.ms'),
        'p90Ms', (select overflight_private.hist_pct(vs, ns, 0.9) from dist where metric = 'results.ms'),
        'partial', coalesce((select sum(n) from _dist where metric = 'results.partial' and v = 1), 0),
        'archiveFailed', coalesce((select sum(n) from _dist where metric = 'results.archive_failed' and v = 1), 0),
        'legs', coalesce((
          select jsonb_object_agg(k.key, jsonb_build_object(
                   'n', (select sum(x) from unnest(d.ns) as x),
                   'p50', overflight_private.hist_pct(d.vs, d.ns, 0.5),
                   'p90', overflight_private.hist_pct(d.vs, d.ns, 0.9)))
          from unnest(overflight_private.search_leg_keys()) as k(key) join dist d on d.metric = 'results.' || k.key), '{}'::jsonb)),
    'vitals', jsonb_build_object(
        'n', coalesce((select n from tot where type = 'vitals'), 0),
        'lcp', (select overflight_private.hist_pct(vs, ns, 0.75) from dist where metric = 'vitals.lcp'),
        'inp', (select overflight_private.hist_pct(vs, ns, 0.75) from dist where metric = 'vitals.inp'),
        'cls', (select overflight_private.hist_pct(vs, ns, 0.75) from dist where metric = 'vitals.cls')),
    'recentSearches', coalesce((
      select jsonb_agg(jsonb_build_object('t', (extract(epoch from r.created_at) * 1000)::bigint, 'label', r.props ->> 'label',
               'country', r.props ->> 'country', 'source', r.props ->> 'source', 'cell', r.props ->> 'cell', 'device', s.device) order by r.created_at desc, r.id desc)
      from (select * from public.events where type = 'search' and created_at >= v_from order by created_at desc, id desc limit 40) r
      left join public.event_sessions s on s.sid = r.sid), '[]'::jsonb),
    'recentErrors', coalesce((
      select jsonb_agg(jsonb_build_object('t', (extract(epoch from r.created_at) * 1000)::bigint, 'where', r.props ->> 'where', 'msg', r.props ->> 'msg') order by r.created_at desc, r.id desc)
      from (select * from public.events where type = 'error' and created_at >= v_from order by created_at desc, id desc limit 30) r), '[]'::jsonb)
  ) into v_out;
  return v_out;
end
$function$;

-- ── Grants (unchanged surface) ──────────────────────────────────────────────────────────────
revoke all on all functions in schema overflight_private from public, anon, authenticated;
