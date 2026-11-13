-- 0023: the time-lapse on the admin page: opens over time (the activity chart's fourth series), and two breakdowns.
--
-- The time-lapse's events (0022) were counted in the totals from the start (every rollup counts every type), but the
-- admin page could not chart them or say where they were opened from, or how they were shared:
--   * event_hours gets a `timelapse` column (opens that hour), written by roll_event_hours with the searches and
--     shares; the hourly series reads it, the raw tail and the daily series count 'timelapse_open' the same way. The
--     series' rows gain a fifth number: [t, searches, shares, sessions, time-lapse opens].
--   * event_aggregates and event_hour_aggregates add two breakdowns, which every rollup after them carries like the
--     others (top N per hour and day, the rest in *_rest): timelapse_open.from (results | viewer | link) and
--     timelapse_share.action (link | video). admin_stats_compute's `top` and `dimTotals` list any breakdown there is.
--   * The hours rolled before this (the feature went live at 07:01 UTC on 2026-11-13) get their opens and breakdowns
--     from the raw events, which are still there (kept 48 hours): at most the hours since then, read once. A no-op on
--     any other database, and when run again (on conflict do nothing; only hours still at 0).
-- The one change to a table is `add column … default 0` on event_hours: no rewrite, and only the hourly jobs (:00 and
-- :17) and the admin page touch that table. lock_timeout makes it give up at once rather than queue behind one of them.
-- Idempotent: add column if not exists, create or replace of this project's functions.

set local lock_timeout = '3s';
alter table public.event_hours add column if not exists timelapse int not null default 0;

-- ── Breakdowns (0016's and 0019's, with the time-lapse's two) ────────────────────────────────
create or replace function overflight_private.event_aggregates(p_from timestamp with time zone, p_to timestamp with time zone)
 returns table(day date, type text, dim text, val text, n bigint)
 language sql
 stable
 set search_path to 'public'
as $function$
  with e as materialized (
    select (ev.created_at at time zone overflight_private.admin_tz())::date as day, ev.type, ev.sid,
           ev.type = 'search' and ev.props ? 'label'   as has_label,   case when ev.type = 'search' then ev.props ->> 'label' end   as label,
           ev.type = 'search' and ev.props ? 'country' as has_country, case when ev.type = 'search' then ev.props ->> 'country' end as s_country,
           ev.type = 'search' and ev.props ? 'source'  as has_source,  case when ev.type = 'search' then ev.props ->> 'source' end  as source,
           ev.type = 'search' and ev.props ? 'cell'    as has_cell,    case when ev.type = 'search' then ev.props ->> 'cell' end    as cell,
           ev.type in ('pass_open', 'share_action') and (ev.props ? 'sat' or ev.props ? 'norad') as has_sat,
           case when ev.type in ('pass_open', 'share_action') then coalesce(ev.props ->> 'sat', 'NORAD ' || (ev.props ->> 'norad')) end as sat,
           ev.type = 'pass_open' and ev.props ? 'verdict' as has_verdict, case when ev.type = 'pass_open' then ev.props ->> 'verdict' end as verdict,
           case when ev.type = 'share_action' then ev.props ->> 'action' end as action,
           case when ev.type = 'timelapse_open' then ev.props ->> 'from' end as tl_from,
           case when ev.type = 'timelapse_share' then ev.props ->> 'action' end as tl_action
    from public.events ev
    where ev.created_at >= p_from and ev.created_at < p_to
  ),
  ses as materialized (
    select d.day, d.sid, coalesce(s.device, '') as device, coalesce(s.country, '') as country,
           coalesce(s.ref_host, '') as ref_host, coalesce(s.utm, '') as utm
    from (select distinct e.day, e.sid from e) d
    left join public.event_sessions s on s.sid = d.sid
  )
  select e.day, e.type, '', '', count(*) from e group by 1, 2
  union all select ses.day, 'session', '', '', count(*) from ses group by 1
  union all select ses.day, 'session', 'device', ses.device, count(*) from ses group by 1, 4
  union all select ses.day, 'session', 'country', ses.country, count(*) from ses group by 1, 4
  union all select ses.day, 'session', 'ref', ses.ref_host, count(*) from ses where ses.ref_host <> '' group by 1, 4
  union all select ses.day, 'session', 'utm', ses.utm, count(*) from ses where ses.utm <> '' group by 1, 4
  union all select e.day, 'search', 'label', e.label, count(*) from e where e.has_label group by 1, 4
  union all select e.day, 'search', 'country', e.s_country, count(*) from e where e.has_country group by 1, 4
  union all select e.day, 'search', 'source', e.source, count(*) from e where e.has_source group by 1, 4
  union all select e.day, 'search', 'cell', e.cell, count(*) from e where e.has_cell group by 1, 4
  union all select e.day, e.type, 'sat', e.sat, count(*) from e where e.has_sat group by 1, 2, 4
  union all select e.day, 'pass_open', 'verdict', e.verdict, count(*) from e where e.has_verdict group by 1, 4
  union all select e.day, 'share_action', 'action', e.action, count(*) from e where e.type = 'share_action' group by 1, 4
  union all select e.day, 'timelapse_open', 'from', e.tl_from, count(*) from e where e.tl_from is not null group by 1, 4
  union all select e.day, 'timelapse_share', 'action', e.tl_action, count(*) from e where e.tl_action is not null group by 1, 4
  union all select e.day, 'funnel', 'stage', e.type, count(distinct e.sid)
    from e where e.type in ('search', 'results', 'pass_open', 'lightbox_open', 'share_open', 'share_action') group by 1, 4
$function$;

create or replace function overflight_private.event_hour_aggregates(p_from timestamptz, p_to timestamptz)
returns table (day date, type text, dim text, val text, n bigint)
language sql
stable
set search_path = public
as $$
  with e as materialized (
    select (ev.created_at at time zone overflight_private.admin_tz())::date as day, ev.type, ev.sid,
           ev.type = 'search' and ev.props ? 'label'   as has_label,   case when ev.type = 'search' then ev.props ->> 'label' end   as label,
           ev.type = 'search' and ev.props ? 'country' as has_country, case when ev.type = 'search' then ev.props ->> 'country' end as s_country,
           ev.type = 'search' and ev.props ? 'source'  as has_source,  case when ev.type = 'search' then ev.props ->> 'source' end  as source,
           ev.type = 'search' and ev.props ? 'cell'    as has_cell,    case when ev.type = 'search' then ev.props ->> 'cell' end    as cell,
           ev.type in ('pass_open', 'share_action') and (ev.props ? 'sat' or ev.props ? 'norad') as has_sat,
           case when ev.type in ('pass_open', 'share_action') then coalesce(ev.props ->> 'sat', 'NORAD ' || (ev.props ->> 'norad')) end as sat,
           ev.type = 'pass_open' and ev.props ? 'verdict' as has_verdict, case when ev.type = 'pass_open' then ev.props ->> 'verdict' end as verdict,
           case when ev.type = 'share_action' then ev.props ->> 'action' end as action,
           case when ev.type = 'timelapse_open' then ev.props ->> 'from' end as tl_from,
           case when ev.type = 'timelapse_share' then ev.props ->> 'action' end as tl_action
    from public.events ev
    where ev.created_at >= p_from and ev.created_at < p_to
  ),
  t as (select e.day, e.sid, bit_or(overflight_private.event_stage_bit(e.type)) as bits from e group by 1, 2),
  nw as materialized (
    select t.day, t.sid, t.bits & ~coalesce(case when d.day = t.day then d.stages end, 0) as fresh
    from t left join public.event_tab_days d on d.sid = t.sid
  ),
  ses as materialized (
    select nw.day, coalesce(s.device, '') as device, coalesce(s.country, '') as country,
           coalesce(s.ref_host, '') as ref_host, coalesce(s.utm, '') as utm
    from nw left join public.event_sessions s on s.sid = nw.sid
    where nw.fresh & 1 = 1
  )
  select e.day, e.type, '', '', count(*) from e group by 1, 2
  union all select ses.day, 'session', '', '', count(*) from ses group by 1
  union all select ses.day, 'session', 'device', ses.device, count(*) from ses group by 1, 4
  union all select ses.day, 'session', 'country', ses.country, count(*) from ses group by 1, 4
  union all select ses.day, 'session', 'ref', ses.ref_host, count(*) from ses where ses.ref_host <> '' group by 1, 4
  union all select ses.day, 'session', 'utm', ses.utm, count(*) from ses where ses.utm <> '' group by 1, 4
  union all select e.day, 'search', 'label', e.label, count(*) from e where e.has_label group by 1, 4
  union all select e.day, 'search', 'country', e.s_country, count(*) from e where e.has_country group by 1, 4
  union all select e.day, 'search', 'source', e.source, count(*) from e where e.has_source group by 1, 4
  union all select e.day, 'search', 'cell', e.cell, count(*) from e where e.has_cell group by 1, 4
  union all select e.day, e.type, 'sat', e.sat, count(*) from e where e.has_sat group by 1, 2, 4
  union all select e.day, 'pass_open', 'verdict', e.verdict, count(*) from e where e.has_verdict group by 1, 4
  union all select e.day, 'share_action', 'action', e.action, count(*) from e where e.type = 'share_action' group by 1, 4
  union all select e.day, 'timelapse_open', 'from', e.tl_from, count(*) from e where e.tl_from is not null group by 1, 4
  union all select e.day, 'timelapse_share', 'action', e.tl_action, count(*) from e where e.tl_action is not null group by 1, 4
  union all select nw.day, 'funnel', 'stage', st.stage, count(*)
    from nw join (values (2, 'search'), (4, 'results'), (8, 'pass_open'), (16, 'lightbox_open'), (32, 'share_open'),
                         (64, 'share_action')) as st(bit, stage) on nw.fresh & st.bit <> 0
    group by 1, 4
$$;

-- ── The hourly chart's rollup (0016's, with the time-lapse's opens) ──────────────────────────
create or replace function overflight_private.roll_event_hours(p_max int default 24)
returns int
language plpgsql
set search_path = public
set timezone = 'UTC'
set work_mem = '16MB'
as $$
declare
  v_from timestamptz;
  v_to   timestamptz;
  v_n    int;
begin
  perform pg_advisory_xact_lock(hashtext('overflight.events.maintain'));  -- maintain_events holds it already (re-entrant)
  select max(hour) + interval '1 hour' into v_from from public.event_hours;
  if v_from is null then select date_trunc('hour', min(created_at)) into v_from from public.events; end if;
  if v_from is null then return 0; end if;
  v_to := least(date_trunc('hour', now() - interval '15 minutes'), v_from + make_interval(hours => p_max));
  if v_to <= v_from then return 0; end if;
  insert into public.event_hours (hour, searches, shares, active, timelapse)
  select h.h, coalesce(c.searches, 0), coalesce(c.shares, 0), coalesce(c.active, 0), coalesce(c.timelapse, 0)
  from generate_series(v_from, v_to - interval '1 hour', interval '1 hour') as h(h)
  left join (
    select date_trunc('hour', ev.created_at) as hour, count(*) filter (where ev.type = 'search') as searches,
           count(*) filter (where ev.type = 'share_action') as shares, count(distinct ev.sid) as active,
           count(*) filter (where ev.type = 'timelapse_open') as timelapse
    from public.events ev where ev.created_at >= v_from and ev.created_at < v_to group by 1
  ) c on c.hour = h.h
  on conflict (hour) do nothing;
  get diagnostics v_n = row_count;
  return v_n;
end
$$;

-- ── Admin stats (0019's, with the series' fifth number) ──────────────────────────────────────
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
        from top where rk <= case when dim = 'cell' then 3000 else 15 end group by type, dim
      ) t), '{}'::jsonb),
    'results', jsonb_build_object(
        'n', coalesce((select n from tot where type = 'results'), 0),
        'p50Ms', (select overflight_private.hist_pct(vs, ns, 0.5) from dist where metric = 'results.ms'),
        'p90Ms', (select overflight_private.hist_pct(vs, ns, 0.9) from dist where metric = 'results.ms'),
        'partial', coalesce((select sum(n) from _dist where metric = 'results.partial' and v = 1), 0),
        'archiveFailed', coalesce((select sum(n) from _dist where metric = 'results.archive_failed' and v = 1), 0)),
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

-- ── The hours rolled before this ────────────────────────────────────────────────────────────
update public.event_hours h set timelapse = c.n
from (
  select date_trunc('hour', ev.created_at) as hour, count(*)::int as n
  from public.events ev
  where ev.type = 'timelapse_open' and ev.created_at >= timestamptz '2026-11-13 07:00:00+00'
    and ev.created_at < coalesce((select max(hour) + interval '1 hour' from public.event_hours), '-infinity'::timestamptz)
  group by 1
) c
where c.hour = h.hour and h.timelapse = 0;

insert into public.event_hour_dims (hour, type, dim, val, n)
select date_trunc('hour', ev.created_at), ev.type, case ev.type when 'timelapse_open' then 'from' else 'action' end,
       case ev.type when 'timelapse_open' then ev.props ->> 'from' else ev.props ->> 'action' end, count(*)
from public.events ev
where ev.type in ('timelapse_open', 'timelapse_share') and ev.created_at >= timestamptz '2026-11-13 07:00:00+00'
  and ev.created_at < coalesce((select max(hour) + interval '1 hour' from public.event_hour_dims), '-infinity'::timestamptz)
  and case ev.type when 'timelapse_open' then ev.props ->> 'from' else ev.props ->> 'action' end is not null
group by 1, 2, 3, 4
on conflict (hour, type, dim, val) do nothing;

revoke all on all functions in schema overflight_private from public, anon, authenticated;
