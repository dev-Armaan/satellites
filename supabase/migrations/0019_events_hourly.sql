-- 0019: every admin range is built from rollups, so a stats refresh costs the same at any traffic; refresh hourly at :00.
--
-- After 0016 the 24h range, and today's part of 7d / 30d / all, were still aggregated from raw events on every refresh,
-- and the midnight rollup read the whole day's raw events at once. On 2026-11-12 a viral spike took traffic from ~900
-- to ~30,000 pageviews an hour: 285k raw events in 24 hours, ~95k more an hour, as much work as the refresh that
-- stopped the API at 15:38 UTC.
--
-- What changes
--   * roll_event_hour_dims rolls each closed hour, at most 8 a maintain_events run: event_hour_dims (event totals, tabs,
--     funnel stages, and each breakdown's top 3000 cells / 200 values, the rest counted in event_hour_rest) and
--     event_hour_dists (value counts, as event_dists). A tab and each funnel stage count once per Eastern day:
--     event_tab_days keeps, per tab, the stages it reached on its latest day, so a day's hours add up to its distinct
--     counts. Hourly rollups start at an Eastern midnight (the first day not rolled yet, or today if later) and are kept
--     for today and yesterday.
--   * roll_event_day sums the day's hours when all of them are rolled, instead of reading the day's raw events (it still
--     does that for a day the hourly rollups do not cover, as in 0016).
--   * admin_stats_compute: 24h starts on the hour (the 24 full hours before this one, and this one so far). It and
--     today's part of the other ranges read the hourly rollups, and raw events only after the last rolled hour (or before
--     the first). The speed percentiles of every range come from the value counts. In 24h a tab counts once per Eastern
--     day, when its first event that day is in the range.
--   * refresh_admin_stats skips a run, keeping the cached rows, while the rollups are behind (the last rolled day older
--     than the day before yesterday, or the last rolled hour more than 2 hours ago), so it never aggregates more than a
--     couple of hours of raw events. pg_cron runs it hourly at :00, and on again: it was paused during the 2026-11-12
--     outage.
-- Idempotent: create table if not exists, create or replace of this project's functions, cron.schedule upserts by name.

-- ── Tables ──────────────────────────────────────────────────────────────────────────────────

create table if not exists public.event_tab_days (
  sid     text primary key,
  day     date not null,                       -- the tab's latest Eastern day in a rolled hour
  stages  int not null                         -- what it did that day (event_stage_bit)
);

create table if not exists public.event_hour_dims (
  hour    timestamptz not null,
  type    text not null,
  dim     text not null,
  val     text not null,
  n       bigint not null default 0,
  primary key (hour, type, dim, val)
);

create table if not exists public.event_hour_rest (
  hour    timestamptz not null,
  type    text not null,
  dim     text not null,
  n       bigint not null default 0,
  primary key (hour, type, dim)
);

create table if not exists public.event_hour_dists (
  hour    timestamptz not null,
  metric  text not null,
  v       numeric not null,
  n       bigint not null default 0,
  primary key (hour, metric, v)
);

alter table public.event_tab_days   enable row level security;
alter table public.event_hour_dims  enable row level security;
alter table public.event_hour_rest  enable row level security;
alter table public.event_hour_dists enable row level security;
revoke all on table public.event_tab_days, public.event_hour_dims, public.event_hour_rest, public.event_hour_dists
  from public, anon, authenticated;

-- ── Hourly rollups ──────────────────────────────────────────────────────────────────────────

-- What an event says a tab did: 1 any event (the tab itself), then one bit per funnel stage.
create or replace function overflight_private.event_stage_bit(p_type text)
returns int
language sql immutable
set search_path = public
as $$
  select 1 | case p_type when 'search' then 2 when 'results' then 4 when 'pass_open' then 8 when 'lightbox_open' then 16
                         when 'share_open' then 32 when 'share_action' then 64 else 0 end
$$;

-- event_aggregates' rows for [p_from, p_to), except that a tab, and each funnel stage, counts only when event_tab_days
-- has not seen it on that Eastern day yet. For the hours after the last rolled one, in order.
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
           case when ev.type = 'share_action' then ev.props ->> 'action' end as action
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
  union all select nw.day, 'funnel', 'stage', st.stage, count(*)
    from nw join (values (2, 'search'), (4, 'results'), (8, 'pass_open'), (16, 'lightbox_open'), (32, 'share_open'),
                         (64, 'share_action')) as st(bit, stage) on nw.fresh & st.bit <> 0
    group by 1, 4
$$;

-- Rolls the closed hours after the last one in event_hour_dims, at most p_max of them. When there is none, starts at an
-- Eastern midnight, p_start or else the first day not rolled yet or today, whichever is later. Each hour always gets
-- its ('session', '', '') row, 0 when nobody came, so max(hour) is how far the rollup has got. Returns hours rolled.
create or replace function overflight_private.roll_event_hour_dims(p_max int default 8, p_start date default null)
returns int
language plpgsql
set search_path = public
set timezone = 'UTC'
set work_mem = '16MB'
as $$
declare
  v_tz  text := overflight_private.admin_tz();
  v_h   timestamptz;
  v_end timestamptz := date_trunc('hour', now() - interval '15 minutes');  -- an hour is closed 15 minutes after it ends
  v_n   int := 0;
begin
  perform pg_advisory_xact_lock(hashtext('overflight.events.maintain'));  -- maintain_events holds it already (re-entrant)
  select max(hour) + interval '1 hour' into v_h from public.event_hour_dims;
  if v_h is null then
    v_h := coalesce(p_start, greatest(coalesce((select max(day) + 1 from public.event_rolled), '-infinity'::date),
                                      (now() at time zone v_tz)::date))::timestamp at time zone v_tz;
  end if;
  while v_h < v_end and v_n < p_max loop
    -- 1. The hour's rows, against the tabs' stages before it.
    with a as materialized (
      select g.type, g.dim, g.val, g.n from overflight_private.event_hour_aggregates(v_h, v_h + interval '1 hour') g
    ),
    r as (
      select a.*, row_number() over (partition by a.type, a.dim order by a.n desc, a.val) as rk,
             overflight_private.event_keep(a.type, a.dim, false) as lim
      from a where a.dim <> ''
    ),
    kept as (
      insert into public.event_hour_dims (hour, type, dim, val, n)
      select v_h, a.type, a.dim, a.val, a.n from a where a.dim = ''
      union all select v_h, r.type, r.dim, r.val, r.n from r where r.rk <= r.lim
      on conflict (hour, type, dim, val) do nothing
    )
    insert into public.event_hour_rest (hour, type, dim, n)
    select v_h, r.type, r.dim, sum(r.n) from r where r.rk > r.lim group by 2, 3
    on conflict (hour, type, dim) do nothing;
    insert into public.event_hour_dims (hour, type, dim, val, n) values (v_h, 'session', '', '', 0)
    on conflict (hour, type, dim, val) do nothing;
    insert into public.event_hour_dists (hour, metric, v, n)
    select v_h, c.metric, c.v, sum(c.n) from overflight_private.event_dist_counts(v_h, v_h + interval '1 hour') c group by 2, 3
    on conflict (hour, metric, v) do nothing;
    -- 2. Then the tabs' stages move on.
    insert into public.event_tab_days as d (sid, day, stages)
    select ev.sid, (v_h at time zone v_tz)::date, bit_or(overflight_private.event_stage_bit(ev.type))
    from public.events ev where ev.created_at >= v_h and ev.created_at < v_h + interval '1 hour' group by ev.sid
    on conflict (sid) do update
      set stages = case when d.day = excluded.day then d.stages | excluded.stages else excluded.stages end, day = excluded.day;
    v_h := v_h + interval '1 hour';
    v_n := v_n + 1;
  end loop;
  return v_n;
end
$$;

-- Appends the aggregates of [p_from, p_to) (both on the hour) to the temp tables _ragg, _rrest and _rdist: the hourly
-- rollups where there are some, raw events before them (plain distinct counts: no rolled hour shares their days) and
-- after them (against event_tab_days).
create or replace function overflight_private.event_recent_into(p_from timestamptz, p_to timestamptz)
returns void
language plpgsql
set search_path = public
set timezone = 'UTC'
set work_mem = '16MB'
as $$
declare
  v_tz text := overflight_private.admin_tz();
  v_ds timestamptz;
  v_de timestamptz;
begin
  select min(hour), max(hour) + interval '1 hour' into v_ds, v_de from public.event_hour_dims;
  if v_ds is null then
    insert into _ragg select * from overflight_private.event_aggregates(p_from, p_to);
    insert into _rdist select c.day, c.metric, c.v, c.n from overflight_private.event_dist_counts(p_from, p_to) c;
    return;
  end if;
  if p_from < v_ds then
    insert into _ragg select * from overflight_private.event_aggregates(p_from, least(p_to, v_ds));
    insert into _rdist select c.day, c.metric, c.v, c.n from overflight_private.event_dist_counts(p_from, least(p_to, v_ds)) c;
  end if;
  insert into _ragg select (h.hour at time zone v_tz)::date, h.type, h.dim, h.val, h.n from public.event_hour_dims h
    where h.hour >= greatest(p_from, v_ds) and h.hour < least(p_to, v_de);
  insert into _rrest select (h.hour at time zone v_tz)::date, h.type, h.dim, h.n from public.event_hour_rest h
    where h.hour >= greatest(p_from, v_ds) and h.hour < least(p_to, v_de);
  insert into _rdist select (h.hour at time zone v_tz)::date, h.metric, h.v, h.n from public.event_hour_dists h
    where h.hour >= greatest(p_from, v_ds) and h.hour < least(p_to, v_de);
  if p_to > v_de then
    insert into _ragg select * from overflight_private.event_hour_aggregates(greatest(p_from, v_de), p_to);
    insert into _rdist select c.day, c.metric, c.v, c.n from overflight_private.event_dist_counts(greatest(p_from, v_de), p_to) c;
  end if;
end
$$;

-- ── Days ────────────────────────────────────────────────────────────────────────────────────

-- 0016's day rollup; from the day's hourly rollups when every hour of the day is rolled.
create or replace function overflight_private.roll_event_day(p_day date)
returns void
language plpgsql
set search_path = public
set timezone = 'UTC'
set work_mem = '16MB'
as $$
declare
  v_from timestamptz := p_day::timestamp at time zone overflight_private.admin_tz();
  v_to   timestamptz := (p_day + 1)::timestamp at time zone overflight_private.admin_tz();
begin
  perform pg_advisory_xact_lock(hashtext('overflight.events.maintain'));  -- maintain_events holds it already (re-entrant)
  if exists (select 1 from public.event_rolled where day = p_day) then return; end if;

  if (select count(*) from public.event_hour_dims where type = 'session' and dim = '' and val = '' and hour >= v_from and hour < v_to)
     = round(extract(epoch from v_to - v_from) / 3600) then
    -- From the hours: day totals and per-day distinct counts are their sums.
    with a as materialized (
      select p_day as day, h.type, h.dim, h.val, sum(h.n)::bigint as n from public.event_hour_dims h
      where h.hour >= v_from and h.hour < v_to group by 2, 3, 4
    ),
    hr as (
      select h.type, h.dim, sum(h.n)::bigint as n from public.event_hour_rest h where h.hour >= v_from and h.hour < v_to group by 1, 2
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
      select p_day, x.type, x.dim, sum(x.n) from (
        select r.type, r.dim, r.n from r where r.rk > r.lim union all select hr.type, hr.dim, hr.n from hr) x
      group by 2, 3
      on conflict (day, type, dim) do nothing
    ),
    allrest as (
      insert into public.event_alltime_rest as x (type, dim, n) select hr.type, hr.dim, hr.n from hr
      on conflict (type, dim) do update set n = x.n + excluded.n
    )
    insert into public.event_alltime as t (type, dim, val, n)
    select r.type, r.dim, r.val, r.n from r
    on conflict (type, dim, val) do update set n = t.n + excluded.n;

    insert into public.event_dists (day, metric, v, n)
    select p_day, h.metric, h.v, sum(h.n) from public.event_hour_dists h where h.hour >= v_from and h.hour < v_to group by 2, 3
    on conflict (day, metric, v) do nothing;
  else
    -- From the raw events (0016).
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
  end if;

  insert into public.event_alltime_dists as t (metric, v, n)
  select d.metric, d.v, d.n from public.event_dists d where d.day = p_day
  on conflict (metric, v) do update set n = t.n + excluded.n;
  insert into public.event_rolled (day) values (p_day);
  perform overflight_private.trim_event_alltime();
end
$$;

-- ── Maintenance ─────────────────────────────────────────────────────────────────────────────

-- 0016's cutoff, and never past the last rolled hour of the hourly rollups.
create or replace function overflight_private.event_raw_cutoff()
returns timestamptz
language sql
stable
set search_path = public
as $$
  select least(
    now() - interval '48 hours',
    coalesce((select (max(day) + 1)::timestamp at time zone overflight_private.admin_tz() from public.event_rolled), '-infinity'::timestamptz),
    coalesce((select max(hour) + interval '1 hour' from public.event_hours), '-infinity'::timestamptz),
    coalesce((select max(hour) + interval '1 hour' from public.event_hour_dims), 'infinity'::timestamptz))
$$;

-- True when the rollups are current: refresh_admin_stats then reads at most a couple of hours of raw events.
create or replace function overflight_private.event_rollups_current()
returns boolean
language sql
stable
set search_path = public
as $$
  select coalesce((select max(day) from public.event_rolled) >= (now() at time zone overflight_private.admin_tz())::date - 2, false)
     and coalesce((select max(hour) from public.event_hour_dims) >= now() - interval '3 hours', false)
$$;

-- pg_cron, hourly at :17 ('watched-events-maintain', 0005).
create or replace function overflight_private.maintain_events()
returns void
language plpgsql
set search_path = public
set timezone = 'UTC'
as $$
declare
  v_tz     text := overflight_private.admin_tz();
  -- Events can be back-dated by at most 10 minutes (log_events' dt), so a day is closed 15 minutes after midnight.
  v_closed date := ((now() - interval '15 minutes') at time zone overflight_private.admin_tz())::date;
  v_next   date;
  v_keep   timestamptz;
  v_gone   int;
begin
  if not pg_try_advisory_xact_lock(hashtext('overflight.events.maintain')) then return; end if;

  perform overflight_private.roll_event_hours(24);
  perform overflight_private.roll_event_hour_dims(8);

  -- One day per run, walking forward from the day after the last rolled one (or the first event's day).
  select max(day) + 1 into v_next from public.event_rolled;
  if v_next is null then
    select (min(created_at) at time zone v_tz)::date into v_next from public.events;
  end if;
  if v_next is not null and v_next < v_closed then
    perform overflight_private.roll_event_day(v_next);
  end if;

  -- Breakdowns past the 30d range: their counts are in the all-time tables. Day totals stay.
  delete from public.event_days where dim <> '' and day < v_closed - 31;
  delete from public.event_days_rest where day < v_closed - 31;
  delete from public.event_dists where day < v_closed - 31;

  -- Hourly rollups: today and yesterday, whole days already rolled (so they still start at a midnight).
  v_keep := least((v_closed - 1)::timestamp at time zone v_tz,
                  coalesce((select (max(day) + 1)::timestamp at time zone v_tz from public.event_rolled), '-infinity'::timestamptz));
  delete from public.event_hour_dims where hour < v_keep;
  delete from public.event_hour_rest where hour < v_keep;
  delete from public.event_hour_dists where hour < v_keep;
  -- The tabs' stages are read again only for the day being rolled.
  delete from public.event_tab_days where day < (select (max(hour) at time zone v_tz)::date from public.event_hour_dims);

  -- Raw events, tabs and lookups past 48 hours, in batches of 10k (at most 5 batches each a run).
  v_keep := overflight_private.event_raw_cutoff();
  for i in 1 .. 5 loop
    delete from public.events where id in (
      select id from public.events where created_at < v_keep order by created_at limit 10000);
    get diagnostics v_gone = row_count;
    exit when v_gone < 10000;
  end loop;
  -- A tab last seen before the cutoff has every event before it (created_at <= the insert time <= last_at).
  for i in 1 .. 5 loop
    delete from public.event_sessions where sid in (
      select sid from public.event_sessions where first_at < v_keep and last_at < v_keep limit 10000);
    get diagnostics v_gone = row_count;
    exit when v_gone < 10000;
  end loop;
  for i in 1 .. 5 loop
    delete from public.lookups where id in (
      select id from public.lookups where created_at < now() - interval '48 hours' order by created_at limit 10000);
    get diagnostics v_gone = row_count;
    exit when v_gone < 10000;
  end loop;

  update public.event_maint set last_at = now() where id = 1;
end
$$;

-- ── Admin stats ─────────────────────────────────────────────────────────────────────────────
-- 0016's output. Rolled days from the day rollups (7d, 30d, all); the rest of the range (all of it for 24h) from
-- event_recent_into, which 7d, 30d and all share within a refresh.

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
    select u.b, sum(u.s) s, sum(u.sh) sh, sum(u.se) se from (
      -- Rolled hours from event_hours, raw events after the last rolled hour.
      select h.hour b, h.searches s, h.shares sh, h.active se from public.event_hours h
      where v_hourly and h.hour >= v_from and h.hour < v_hours
      union all
      select date_trunc('hour', created_at) b, count(*) filter (where type = 'search') s,
             count(*) filter (where type = 'share_action') sh, count(distinct sid) se
      from public.events
      where v_hourly and created_at >= greatest(v_from, v_hours)
      group by 1
      union all
      select f.hour, f.searches, 0, f.active
      from overflight_private.event_backfill f where v_hourly and f.hour >= v_from
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

-- 0009's refresh, skipped while the rollups are behind (the cached rows stay; cachedAt says how old they are).
create or replace function overflight_private.refresh_admin_stats()
returns int
language plpgsql
set search_path = public
set timezone = 'UTC'
as $$
declare
  r text;
  v_done int := 0;
begin
  -- One run at a time: a run that overlaps the next tick skips it.
  if not pg_try_advisory_xact_lock(hashtext('overflight.admin_stats.refresh')) then return 0; end if;
  if not overflight_private.event_rollups_current() then
    raise notice 'refresh_admin_stats: rollups are behind, keeping the cached stats';
    return 0;
  end if;
  foreach r in array array['24h', '7d', '30d', 'all'] loop
    begin
      perform overflight_private.store_admin_stats(r, overflight_private.admin_stats_compute(r), now());
      v_done := v_done + 1;
    exception when query_canceled or others then  -- OTHERS alone does not catch a statement timeout
      raise warning 'refresh_admin_stats(%): %', r, sqlerrm;  -- keep the previous row; the other ranges still refresh
    end;
  end loop;
  return v_done;
end
$$;

-- ── Grants and schedule ─────────────────────────────────────────────────────────────────────

revoke all on all functions in schema overflight_private from public, anon, authenticated;

select cron.schedule('watched-admin-stats', '0 * * * *', 'select overflight_private.refresh_admin_stats()');
select cron.alter_job(jobid, active := true) from cron.job where jobname = 'watched-admin-stats';
