-- 0015: the 2026-11-11 outage's searches and sessions are counted in the admin totals.
--
-- From 13:16 to 15:09 UTC on 2026-11-11 the database stopped answering (refresh_admin_stats overloaded it; 0014), and
-- /api/e drops a batch it cannot deliver, so those hours' events are gone. Vercel Web Analytics never touched the
-- database and kept counting. Each lost hour's searches and tabs are rebuilt from its pageviews:
-- (Vercel pageviews that hour) x (per-pageview ratio over the unaffected full hours 08-12 and 16-20 UTC that day)
-- minus what the database did record that hour. Ratios: 1.6061 searches, 1.1361 new tabs, 1.2226 active tabs.
--   * overflight_private.event_backfill(hour, searches, sessions, active, basis): one row per UTC hour.
--     sessions = tabs whose first event of the day fell in the hour (they add to the day's session total);
--     active = tabs with any event in the hour (they add to that hour's bar in the hourly series).
--   * admin_stats_compute: the rows inside the range add to totals.search, totals.session and the series. A new key,
--     'recorded', gives search and session without them, so ratios (per session, % of searches, device and country
--     shares) divide by counts that have the matching breakdowns. Nothing else changes: top lists, funnel, results,
--     vitals and the recent lists stay recorded-only.
-- Raw events, event_days and the public get_stats counters are untouched; deleting a row undoes it.
-- Idempotent: create table if not exists, upsert of the three rows, create or replace of this project's function.

create table if not exists overflight_private.event_backfill (
  hour      timestamptz primary key check (hour = date_trunc('hour', hour)),
  searches  int not null default 0 check (searches >= 0),
  sessions  int not null default 0 check (sessions >= 0),
  active    int not null default 0 check (active >= 0),
  basis     text not null
);
alter table overflight_private.event_backfill enable row level security;
revoke all on table overflight_private.event_backfill from public, anon, authenticated;

insert into overflight_private.event_backfill (hour, searches, sessions, active, basis) values
  ('2026-11-11 13:00+00',  628, 420, 440, 'outage 13:16-15:09 UTC; Vercel 569 pageviews; recorded 286 searches, 226 new tabs, 256 active'),
  ('2026-11-11 14:00+00', 1092, 771, 829, 'outage 13:16-15:09 UTC; Vercel 680 pageviews; recorded 0 searches, 2 new tabs, 2 active'),
  ('2026-11-11 15:00+00',  174,  26,  58, 'outage 13:16-15:09 UTC; Vercel 554 pageviews; recorded 716 searches, 603 new tabs, 619 active')
on conflict (hour) do update set searches = excluded.searches, sessions = excluded.sessions, active = excluded.active, basis = excluded.basis;

create or replace function overflight_private.admin_stats_compute(p_range text DEFAULT '7d'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
 SET "TimeZone" TO 'UTC'
AS $function$
declare
  v_now   timestamptz := now();
  v_today timestamptz := date_trunc('day', now() at time zone 'utc') at time zone 'utc';
  v_from  timestamptz;
  v_raw_from timestamptz;
  v_split timestamptz;
  v_hourly boolean;
  v_out   jsonb;
  v_bf_search  bigint;
  v_bf_session bigint;
begin
  -- No admin check here: only admin_stats_core (checked), public.admin_stats (checked) and the cron refresh call this.
  if p_range is null or p_range not in ('24h', '7d', '30d', 'all') then p_range := '7d'; end if;

  v_from := case p_range
    when '24h' then v_now - interval '24 hours'
    when '7d'  then v_now - interval '7 days'
    when '30d' then v_now - interval '30 days'
    else '-infinity'::timestamptz end;
  v_hourly := p_range in ('24h', '7d');
  -- The raw-event window for the series, percentiles and recent lists (what 0004's raw CTE covered).
  v_raw_from := greatest(v_from, v_now - interval '90 days');

  create temp table if not exists _agg (day date, type text, dim text, val text, n bigint) on commit drop;
  truncate _agg;
  if p_range = 'all' then
    -- Rolled days from the rollup; every later day (yesterday before the cron got to it, today) from raw events.
    v_split := coalesce((select (max(day) + 1)::timestamp at time zone 'utc' from public.event_rolled), '-infinity'::timestamptz);
    insert into _agg select d.day, d.type, d.dim, d.val, d.n from public.event_days d where d.day < (v_split at time zone 'utc')::date;
    insert into _agg select * from overflight_private.event_aggregates(v_split, v_now + interval '1 minute');
  else
    insert into _agg select * from overflight_private.event_aggregates(v_from, v_now + interval '1 minute');
  end if;

  -- 0015: hours whose events never reached the database add their reconstructed searches and tabs to the day totals
  -- (and so to the daily series). The same hours are added to the hourly series below; 'recorded' keeps the counts
  -- without them, for the ratios.
  select coalesce(sum(b.searches), 0), coalesce(sum(b.sessions), 0) into v_bf_search, v_bf_session
  from overflight_private.event_backfill b where b.hour >= date_trunc('hour', v_from);
  insert into _agg
    select (b.hour at time zone 'utc')::date, t.type, '', '', sum(t.n)::bigint
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
  dimtot as (select type || '.' || dim k, sum(n)::bigint n from _agg where dim <> '' and type <> 'funnel' group by type, dim),
  res as (select (props ->> 'ms')::float8 ms, (props ->> 'partial')::boolean partial, (props ->> 'archive_failed')::boolean af
          from public.events where type = 'results' and created_at >= v_raw_from),
  vit as (select (props ->> 'lcp')::float8 lcp, (props ->> 'inp')::float8 inp, (props ->> 'cls')::float8 cls
          from public.events where type = 'vitals' and created_at >= v_raw_from),
  buckets as (
    select b from generate_series(
      case when v_hourly then date_trunc('hour', greatest(v_from, v_now - interval '7 days'))
           else coalesce((select min(day) from _agg)::timestamp at time zone 'utc', v_today) end,
      v_now,
      case when v_hourly then interval '1 hour' else interval '1 day' end) b
  ),
  hourly as (
    select u.b, sum(u.s) s, sum(u.sh) sh, sum(u.se) se from (
      select date_trunc('hour', created_at) b, count(*) filter (where type = 'search') s,
             count(*) filter (where type = 'share_action') sh, count(distinct sid) se
      from public.events where v_hourly and created_at >= v_raw_from group by 1
      union all
      select f.hour, f.searches, 0, f.active
      from overflight_private.event_backfill f where v_hourly and f.hour >= date_trunc('hour', v_raw_from)
    ) u group by u.b
  ),
  daily as (
    select day::timestamp at time zone 'utc' b, sum(n) filter (where type = 'search') s,
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
    'results', (select jsonb_build_object(
        'n', count(*),
        'p50Ms', percentile_cont(0.5) within group (order by ms),
        'p90Ms', percentile_cont(0.9) within group (order by ms),
        'partial', count(*) filter (where partial),
        'archiveFailed', count(*) filter (where af)) from res),
    'vitals', (select jsonb_build_object(
        'n', count(*),
        'lcp', percentile_cont(0.75) within group (order by lcp),
        'inp', percentile_cont(0.75) within group (order by inp),
        'cls', percentile_cont(0.75) within group (order by cls)) from vit),
    'recentSearches', coalesce((
      select jsonb_agg(jsonb_build_object('t', (extract(epoch from r.created_at) * 1000)::bigint, 'label', r.props ->> 'label',
               'country', r.props ->> 'country', 'source', r.props ->> 'source', 'cell', r.props ->> 'cell', 'device', s.device) order by r.created_at desc, r.id desc)
      from (select * from public.events where type = 'search' and created_at >= v_raw_from order by created_at desc, id desc limit 40) r
      left join public.event_sessions s on s.sid = r.sid), '[]'::jsonb),
    'recentErrors', coalesce((
      select jsonb_agg(jsonb_build_object('t', (extract(epoch from r.created_at) * 1000)::bigint, 'where', r.props ->> 'where', 'msg', r.props ->> 'msg') order by r.created_at desc, r.id desc)
      from (select * from public.events where type = 'error' and created_at >= v_raw_from order by created_at desc, id desc limit 30) r), '[]'::jsonb)
  ) into v_out;
  return v_out;
end
$function$;

revoke all on function overflight_private.admin_stats_compute(text) from public, anon, authenticated;
