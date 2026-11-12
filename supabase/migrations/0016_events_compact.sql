-- 0016: the events fit the free plan, the admin stats read rollups, and admin days are US Eastern.
--
-- Measured 2026-11-12, 3.5 days after launch: the database was 316 MB of the free plan's 500 MB. public.events held
-- 711k rows (150-260k a day) in 228 MB, half of it indexes, growing ~65 MB a day towards a planned 90 days. event_days
-- added ~18k rows a day, kept for good, most of them a place or map cell searched once (about 1 GB a year). Raw lookups
-- were never pruned. refresh_admin_stats re-read every raw event in range on each run: 2.5 min a run at :07 and :37 by
-- then, the load that stopped the database on 2026-11-11 (0014).
--
-- What changes
--   * Raw events, tabs (event_sessions) and lookups are kept 48 hours (were 90 days, 90 days, for good). Events and tabs
--     go only once their day and hour are rolled up, so a late cron job never loses a count. Lookups: get_stats reads
--     the last 24 hours and record_lookup the last minute; lookup_cells and lookup_days keep the counts.
--   * Days are US Eastern (America/New_York, so 23 or 25 hours across a DST change), as the admin page's clock already
--     is: event_days, event_rolled and every new daily table, the per-day distinct tab counts in event_aggregates, and
--     the 0015 backfill's day.
--   * Ranges past 24h are whole Eastern days: 7d is today plus the 6 days before it, 30d today plus 29. 24h is unchanged
--     (raw events, to the minute). The JSON gains 'from' (ms): where the range starts.
--   * The rollups those ranges read:
--       - event_hours: searches, shares and active tabs per hour (the 7d chart). Kept for good, 24 rows a day.
--       - event_days: day totals (dim '') as before, kept for good. Each breakdown keeps its top 3000 map cells or top
--         200 of any other list per day; event_days_rest counts the rest, so dimTotals stay whole. Breakdowns are kept
--         32 days (the 30d range).
--       - event_dists: per day, how many results / vitals events had each value, at the admin page's precision (10 ms;
--         INP 1 ms; CLS as sent). Speed percentiles are percentile_cont over those values (hist_pct). Kept 32 days.
--       - event_alltime, event_alltime_rest, event_alltime_dists: the 'all' range, added to as each day is rolled
--         (top 10000 cells / 1000 of any other list).
--     On the rollups of 2026-11-09..11 the daily cut left every top-15 list as it was bar one tie at #15; the map's top
--     3000 cells kept 90% of its cells and 97% of their searches, the difference all in cells with 3-4 searches.
--   * maintain_events (pg_cron, hourly at :17) rolls at most one day and 48 hours per run, so a run stays short when it
--     has catching up to do; the admin ranges read raw events for whatever is not rolled yet.
--
-- Moving to Eastern days. The UTC-day rollups are copied to overflight_private.event_days_utc (drop it when you no longer
-- want it), then event_days and event_rolled are emptied, and the next maintain_events runs rebuild every day from the
-- raw events, one day an hour. That is lossless only while the raw events still cover every rolled day, so this checks
-- first (raw count = the rollup's event total) and raises instead of emptying anything when they don't.
--
-- Not changed: log_events, the event row, public.admin_stats and its cache, get_stats (its 7-day window stays UTC days).
-- 0017 drops the three indexes this leaves unused. reclassify_surprise_searches (0011) edits event_days only, not the
-- new tables: it has done its job and is not to be run again.
-- Idempotent: create table if not exists, create or replace of this project's functions; the move to Eastern days runs
-- once (while overflight_private.event_days_utc does not exist).

-- ── Tables ──────────────────────────────────────────────────────────────────────────────────

create table if not exists public.event_hours (
  hour      timestamptz primary key,
  searches  int not null default 0,
  shares    int not null default 0,
  active    int not null default 0             -- distinct tabs with any event in the hour
);

create table if not exists public.event_days_rest (
  day       date not null,
  type      text not null,
  dim       text not null,
  n         bigint not null default 0,         -- the counts of the values past the day's top N
  primary key (day, type, dim)
);

create table if not exists public.event_dists (
  day       date not null,
  metric    text not null,                     -- 'results.ms', 'results.partial', 'results.archive_failed', 'vitals.lcp', …
  v         numeric not null,
  n         bigint not null default 0,
  primary key (day, metric, v)
);

create table if not exists public.event_alltime (
  type      text not null,
  dim       text not null,
  val       text not null,
  n         bigint not null default 0,
  primary key (type, dim, val)
);

create table if not exists public.event_alltime_rest (
  type      text not null,
  dim       text not null,
  n         bigint not null default 0,
  primary key (type, dim)
);

create table if not exists public.event_alltime_dists (
  metric    text not null,
  v         numeric not null,
  n         bigint not null default 0,
  primary key (metric, v)
);

alter table public.event_hours         enable row level security;
alter table public.event_days_rest     enable row level security;
alter table public.event_dists         enable row level security;
alter table public.event_alltime       enable row level security;
alter table public.event_alltime_rest  enable row level security;
alter table public.event_alltime_dists enable row level security;
revoke all on table public.event_hours, public.event_days_rest, public.event_dists, public.event_alltime,
  public.event_alltime_rest, public.event_alltime_dists from public, anon, authenticated;

-- ── Helpers ─────────────────────────────────────────────────────────────────────────────────

-- The admin clock (src/admin/format.ts ADMIN_TZ): days are this zone's days.
create or replace function overflight_private.admin_tz()
returns text
language sql immutable
set search_path = public
as $$
  select 'America/New_York'::text
$$;

-- How many values of a breakdown are kept: per day (event_days) or all time (event_alltime). The map draws up to 3000
-- cells; every other list shows at most 15.
create or replace function overflight_private.event_keep(p_type text, p_dim text, p_alltime boolean)
returns int
language sql immutable
set search_path = public
as $$
  select case when p_type = 'search' and p_dim = 'cell' then case when p_alltime then 10000 else 3000 end
              else case when p_alltime then 1000 else 200 end end
$$;

-- percentile_cont(p) over a histogram: p_v the distinct values (ascending), p_n how many of each. Same interpolation as
-- percentile_cont over the expanded values; null when there are none.
create or replace function overflight_private.hist_pct(p_v float8[], p_n bigint[], p float8)
returns float8
language sql immutable
set search_path = public
as $$
  with h as (
    select u.v, sum(u.n) over (order by u.v rows between unbounded preceding and current row) as cum
    from unnest(p_v, p_n) as u(v, n) where u.n > 0
  ),
  r as (select p * (max(h.cum) - 1) as pos from h having max(h.cum) > 0)
  select lo.v + (r.pos - floor(r.pos)) * (hi.v - lo.v)
  from r
  cross join lateral (select h.v from h where h.cum > floor(r.pos) order by h.v limit 1) lo
  cross join lateral (select h.v from h where h.cum > ceil(r.pos) order by h.v limit 1) hi
$$;

-- 0008's aggregates, with Eastern days: the day of an event, and the per-day distinct tab counts, are Eastern days.
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
           case when ev.type = 'share_action' then ev.props ->> 'action' end as action
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
  union all select e.day, 'funnel', 'stage', e.type, count(distinct e.sid)
    from e where e.type in ('search', 'results', 'pass_open', 'lightbox_open', 'share_open', 'share_action') group by 1, 4
$function$;

-- Per Eastern day, how many results / vitals events had each value: times in 10 ms steps (the page shows seconds to two
-- decimals), INP in whole ms, CLS as sent (4 decimals), the two result flags as 1 / 0.
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
$$;

-- ── Rollups ─────────────────────────────────────────────────────────────────────────────────

-- Every closed hour after the last one in event_hours (or from the first raw event's hour), at most p_max of them; hours
-- with no events get a row of zeros, so max(hour) is how far the rollup has got. An hour is closed 15 minutes after it
-- ends (events are back-dated by at most 10 minutes). Returns the number of hours written.
create or replace function overflight_private.roll_event_hours(p_max int default 48)
returns int
language plpgsql
set search_path = public
set timezone = 'UTC'
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
  insert into public.event_hours (hour, searches, shares, active)
  select h.h, coalesce(c.searches, 0), coalesce(c.shares, 0), coalesce(c.active, 0)
  from generate_series(v_from, v_to - interval '1 hour', interval '1 hour') as h(h)
  left join (
    select date_trunc('hour', ev.created_at) as hour, count(*) filter (where ev.type = 'search') as searches,
           count(*) filter (where ev.type = 'share_action') as shares, count(distinct ev.sid) as active
    from public.events ev where ev.created_at >= v_from and ev.created_at < v_to group by 1
  ) c on c.hour = h.h
  on conflict (hour) do nothing;
  get diagnostics v_n = row_count;
  return v_n;
end
$$;

-- Each list of the all-time tables cut to its top N; what is cut adds to event_alltime_rest.
create or replace function overflight_private.trim_event_alltime()
returns void
language sql
set search_path = public
as $$
  with r as (
    select a.type, a.dim, a.val, row_number() over (partition by a.type, a.dim order by a.n desc, a.val) as rk
    from public.event_alltime a
  ),
  cut as (
    delete from public.event_alltime t using r
    where t.type = r.type and t.dim = r.dim and t.val = r.val and r.rk > overflight_private.event_keep(r.type, r.dim, true)
    returning t.type, t.dim, t.n
  )
  insert into public.event_alltime_rest as x (type, dim, n)
  select cut.type, cut.dim, sum(cut.n) from cut group by 1, 2
  on conflict (type, dim) do update set n = x.n + excluded.n
$$;

-- One closed Eastern day: day totals and each breakdown's top N into event_days (the rest into event_days_rest), every
-- breakdown value into the all-time tables, the value counts into event_dists. A day already in event_rolled is left
-- alone: the all-time sums must take each day once.
create or replace function overflight_private.roll_event_day(p_day date)
returns void
language plpgsql
set search_path = public
set timezone = 'UTC'
as $$
declare
  v_from timestamptz := p_day::timestamp at time zone overflight_private.admin_tz();
  v_to   timestamptz := (p_day + 1)::timestamp at time zone overflight_private.admin_tz();
begin
  perform pg_advisory_xact_lock(hashtext('overflight.events.maintain'));  -- maintain_events holds it already (re-entrant)
  if exists (select 1 from public.event_rolled where day = p_day) then return; end if;

  with a as materialized (
    select g.day, g.type, g.dim, g.val, g.n from overflight_private.event_aggregates(v_from, v_to) g where g.day = p_day
  ),
  r as (
    select a.*, row_number() over (partition by a.type, a.dim order by a.n desc, a.val) as rk,
           overflight_private.event_keep(a.type, a.dim, false) as lim
    from a where a.dim <> ''
  ),
  kept as (
    insert into public.event_days (day, type, dim, val, n)
    select a.day, a.type, a.dim, a.val, a.n from a where a.dim = ''
    union all select r.day, r.type, r.dim, r.val, r.n from r where r.rk <= r.lim
    on conflict (day, type, dim, val) do nothing
  ),
  rest as (
    insert into public.event_days_rest (day, type, dim, n)
    select p_day, r.type, r.dim, sum(r.n) from r where r.rk > r.lim group by 2, 3
    on conflict (day, type, dim) do nothing
  )
  insert into public.event_alltime as t (type, dim, val, n)
  select r.type, r.dim, r.val, sum(r.n) from r group by 1, 2, 3
  on conflict (type, dim, val) do update set n = t.n + excluded.n;

  insert into public.event_dists (day, metric, v, n)
  select c.day, c.metric, c.v, c.n from overflight_private.event_dist_counts(v_from, v_to) c where c.day = p_day
  on conflict (day, metric, v) do nothing;
  insert into public.event_alltime_dists as t (metric, v, n)
  select d.metric, d.v, d.n from public.event_dists d where d.day = p_day
  on conflict (metric, v) do update set n = t.n + excluded.n;

  insert into public.event_rolled (day) values (p_day);
  perform overflight_private.trim_event_alltime();
end
$$;

-- Raw events and tabs older than this can go: 48 hours, and never a row whose day or hour is not rolled up yet.
create or replace function overflight_private.event_raw_cutoff()
returns timestamptz
language sql
stable
set search_path = public
as $$
  select least(
    now() - interval '48 hours',
    coalesce((select (max(day) + 1)::timestamp at time zone overflight_private.admin_tz() from public.event_rolled), '-infinity'::timestamptz),
    coalesce((select max(hour) + interval '1 hour' from public.event_hours), '-infinity'::timestamptz))
$$;

-- pg_cron, hourly at :17 ('watched-events-maintain', 0005).
create or replace function overflight_private.maintain_events()
returns void
language plpgsql
set search_path = public
set timezone = 'UTC'
as $$
declare
  -- Events can be back-dated by at most 10 minutes (log_events' dt), so a day is closed 15 minutes after midnight.
  v_closed date := ((now() - interval '15 minutes') at time zone overflight_private.admin_tz())::date;
  v_next   date;
  v_keep   timestamptz;
  v_gone   int;
begin
  if not pg_try_advisory_xact_lock(hashtext('overflight.events.maintain')) then return; end if;

  perform overflight_private.roll_event_hours(48);

  -- One day per run, walking forward from the day after the last rolled one (or the first event's day), so event_rolled
  -- stays contiguous. Days are rolled once a day; more than one is only ever catching up.
  select max(day) + 1 into v_next from public.event_rolled;
  if v_next is null then
    select (min(created_at) at time zone overflight_private.admin_tz())::date into v_next from public.events;
  end if;
  if v_next is not null and v_next < v_closed then
    perform overflight_private.roll_event_day(v_next);
  end if;

  -- Breakdowns past the 30d range: their counts are in the all-time tables. Day totals stay.
  delete from public.event_days where dim <> '' and day < v_closed - 31;
  delete from public.event_days_rest where day < v_closed - 31;
  delete from public.event_dists where day < v_closed - 31;

  -- Raw events, tabs and lookups past 48 hours, in batches of 10k (at most 20 batches each a run).
  v_keep := overflight_private.event_raw_cutoff();
  for i in 1 .. 20 loop
    delete from public.events where id in (
      select id from public.events where created_at < v_keep order by created_at limit 10000);
    get diagnostics v_gone = row_count;
    exit when v_gone < 10000;
  end loop;
  -- A tab last seen before the cutoff has every event before it (created_at <= the insert time <= last_at).
  for i in 1 .. 20 loop
    delete from public.event_sessions where sid in (
      select sid from public.event_sessions where first_at < v_keep and last_at < v_keep limit 10000);
    get diagnostics v_gone = row_count;
    exit when v_gone < 10000;
  end loop;
  for i in 1 .. 20 loop
    delete from public.lookups where id in (
      select id from public.lookups where created_at < now() - interval '48 hours' order by created_at limit 10000);
    get diagnostics v_gone = row_count;
    exit when v_gone < 10000;
  end loop;

  update public.event_maint set last_at = now() where id = 1;
end
$$;

-- ── Admin stats ─────────────────────────────────────────────────────────────────────────────
-- 0015's output plus 'from'. 24h reads raw events as before. 7d, 30d and all read the rollups for rolled days and raw
-- events from the end of the last rolled day (the tail, the same for all three, so refresh_admin_stats computes it once
-- per run and each range takes its days).

create or replace function overflight_private.admin_stats_compute(p_range text DEFAULT '7d'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
 SET "TimeZone" TO 'UTC'
AS $function$
declare
  v_tz     text := overflight_private.admin_tz();
  v_now    timestamptz := now();
  v_to     timestamptz := now() + interval '1 minute';
  v_today  date := (now() at time zone overflight_private.admin_tz())::date;
  v_from   timestamptz;  -- where the range starts
  v_day0   date;         -- its first Eastern day (7d, 30d, all)
  v_split  timestamptz;  -- the end of the last rolled day: rollups before it, raw events from it
  v_hours  timestamptz;  -- the end of the last rolled hour
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
  v_day0 := case p_range when '7d' then v_today - 6 when '30d' then v_today - 29 else '-infinity'::date end;
  v_from := case p_range
    when '24h' then v_now - interval '24 hours'
    when 'all' then '-infinity'::timestamptz
    else v_day0::timestamp at time zone v_tz end;

  create temp table if not exists _agg (day date, type text, dim text, val text, n bigint) on commit drop;
  create temp table if not exists _rest (type text, dim text, n bigint) on commit drop;
  create temp table if not exists _dist (metric text, v float8, n bigint) on commit drop;
  truncate _agg, _rest, _dist;

  if p_range = '24h' then
    insert into _agg select * from overflight_private.event_aggregates(v_from, v_to);
  else
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

    -- The tail, once per transaction.
    create temp table if not exists _tail_key (from_at timestamptz, to_at timestamptz) on commit drop;
    create temp table if not exists _tail_agg (day date, type text, dim text, val text, n bigint) on commit drop;
    create temp table if not exists _tail_dist (day date, metric text, v float8, n bigint) on commit drop;
    if not exists (select 1 from _tail_key k where k.from_at = v_split and k.to_at = v_to) then
      truncate _tail_key, _tail_agg, _tail_dist;
      insert into _tail_agg select * from overflight_private.event_aggregates(v_split, v_to);
      insert into _tail_dist select c.day, c.metric, c.v, c.n from overflight_private.event_dist_counts(v_split, v_to) c;
      insert into _tail_key values (v_split, v_to);
    end if;
    insert into _agg select t.day, t.type, t.dim, t.val, t.n from _tail_agg t where t.day >= v_day0;
    insert into _dist select t.metric, t.v, t.n from _tail_dist t where t.day >= v_day0;
  end if;

  -- 0015: hours whose events never reached the database add their reconstructed searches and tabs to the day totals
  -- (and so to the daily series). The same hours are added to the hourly series below; 'recorded' keeps the counts
  -- without them, for the ratios.
  select coalesce(sum(b.searches), 0), coalesce(sum(b.sessions), 0) into v_bf_search, v_bf_session
  from overflight_private.event_backfill b where b.hour >= date_trunc('hour', v_from);
  insert into _agg
    select (b.hour at time zone v_tz)::date, t.type, '', '', sum(t.n)::bigint
    from overflight_private.event_backfill b
    cross join lateral (values ('search', b.searches), ('session', b.sessions)) t(type, n)
    where b.hour >= date_trunc('hour', v_from) and t.n > 0
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
  res as (select (props ->> 'ms')::float8 ms, (props ->> 'partial')::boolean partial, (props ->> 'archive_failed')::boolean af
          from public.events where p_range = '24h' and type = 'results' and created_at >= v_from),
  vit as (select (props ->> 'lcp')::float8 lcp, (props ->> 'inp')::float8 inp, (props ->> 'cls')::float8 cls
          from public.events where p_range = '24h' and type = 'vitals' and created_at >= v_from),
  buckets as (
    select b from generate_series(date_trunc('hour', v_from), v_now, interval '1 hour') b where v_hourly
    union all
    select d::date::timestamp at time zone v_tz
    from generate_series(coalesce((select min(day) from _agg), v_today), v_today, interval '1 day') d
    where not v_hourly
  ),
  hourly as (
    select u.b, sum(u.s) s, sum(u.sh) sh, sum(u.se) se from (
      -- 7d: rolled hours from event_hours, raw events after the last rolled hour; 24h: raw events.
      select h.hour b, h.searches s, h.shares sh, h.active se from public.event_hours h
      where p_range = '7d' and h.hour >= v_from and h.hour < v_hours
      union all
      select date_trunc('hour', created_at) b, count(*) filter (where type = 'search') s,
             count(*) filter (where type = 'share_action') sh, count(distinct sid) se
      from public.events
      where v_hourly and created_at >= case when p_range = '7d' then greatest(v_from, v_hours) else v_from end
      group by 1
      union all
      select f.hour, f.searches, 0, f.active
      from overflight_private.event_backfill f where v_hourly and f.hour >= date_trunc('hour', v_from)
    ) u group by u.b
  ),
  daily as (
    select day::timestamp at time zone v_tz b, sum(n) filter (where type = 'search') s,
           sum(n) filter (where type = 'share_action') sh, sum(n) filter (where type = 'session') se
    from _agg where not v_hourly and dim = '' group by day
  ),
  series as (
    select k.b, coalesce(x.s, 0) s, coalesce(x.sh, 0) sh, coalesce(x.se, 0) se
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
    'series', coalesce((select jsonb_agg(jsonb_build_array((extract(epoch from b) * 1000)::bigint, s, sh, se) order by b) from series), '[]'::jsonb),
    'top', coalesce((
      select jsonb_object_agg(k, rows) from (
        select type || '.' || dim k, jsonb_agg(jsonb_build_array(val, n) order by rk) rows
        from top where rk <= case when dim = 'cell' then 3000 else 15 end group by type, dim
      ) t), '{}'::jsonb),
    'results', case when p_range = '24h' then (select jsonb_build_object(
        'n', count(*),
        'p50Ms', percentile_cont(0.5) within group (order by ms),
        'p90Ms', percentile_cont(0.9) within group (order by ms),
        'partial', count(*) filter (where partial),
        'archiveFailed', count(*) filter (where af)) from res)
      else jsonb_build_object(
        'n', coalesce((select n from tot where type = 'results'), 0),
        'p50Ms', (select overflight_private.hist_pct(vs, ns, 0.5) from dist where metric = 'results.ms'),
        'p90Ms', (select overflight_private.hist_pct(vs, ns, 0.9) from dist where metric = 'results.ms'),
        'partial', coalesce((select sum(n) from _dist where metric = 'results.partial' and v = 1), 0),
        'archiveFailed', coalesce((select sum(n) from _dist where metric = 'results.archive_failed' and v = 1), 0)) end,
    'vitals', case when p_range = '24h' then (select jsonb_build_object(
        'n', count(*),
        'lcp', percentile_cont(0.75) within group (order by lcp),
        'inp', percentile_cont(0.75) within group (order by inp),
        'cls', percentile_cont(0.75) within group (order by cls)) from vit)
      else jsonb_build_object(
        'n', coalesce((select n from tot where type = 'vitals'), 0),
        'lcp', (select overflight_private.hist_pct(vs, ns, 0.75) from dist where metric = 'vitals.lcp'),
        'inp', (select overflight_private.hist_pct(vs, ns, 0.75) from dist where metric = 'vitals.inp'),
        'cls', (select overflight_private.hist_pct(vs, ns, 0.75) from dist where metric = 'vitals.cls')) end,
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

-- ── Grants ──────────────────────────────────────────────────────────────────────────────────

revoke all on all functions in schema overflight_private from public, anon, authenticated;

-- ── Move to Eastern days (once) ─────────────────────────────────────────────────────────────

do $$
declare
  v_end timestamptz;
  v_raw bigint;
  v_rolled bigint;
begin
  if to_regclass('overflight_private.event_days_utc') is not null then return; end if;
  perform pg_advisory_xact_lock(hashtext('overflight.events.maintain'));  -- no maintain_events run in between

  -- Lossless only if the raw events of every rolled day are all still here.
  v_end := (select (max(day) + 1)::timestamp at time zone 'utc' from public.event_rolled);
  if v_end is not null then
    select count(*) into v_raw from public.events where created_at < v_end;
    select coalesce(sum(n), 0) into v_rolled from public.event_days
      where dim = '' and type <> 'session' and day < (v_end at time zone 'utc')::date;
    if v_raw <> v_rolled then
      raise exception '0016: the raw events no longer cover the rolled days (% raw, % in event_days), so the daily totals cannot be rebuilt in Eastern days; nothing was changed', v_raw, v_rolled;
    end if;
  end if;

  create table overflight_private.event_days_utc as select * from public.event_days;
  alter table overflight_private.event_days_utc enable row level security;
  revoke all on table overflight_private.event_days_utc from public, anon, authenticated;
  comment on table overflight_private.event_days_utc is
    '0016: event_days as it was, in UTC days, before the rollups were rebuilt in US Eastern days. Safe to drop.';

  -- delete, not truncate: truncate would wait for (and then block) a stats refresh reading event_days.
  delete from public.event_days;
  delete from public.event_rolled;
  delete from public.event_hours;
  delete from public.event_days_rest;
  delete from public.event_dists;
  delete from public.event_alltime;
  delete from public.event_alltime_rest;
  delete from public.event_alltime_dists;
end
$$;
