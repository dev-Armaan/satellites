-- 0020: the overall event limit goes from 3000 to 6000 a minute, and every limit check costs the same at any traffic.
--
-- log_events is open to anyone with the public key, so its limits are what stop a script from filling the database,
-- flooding the stats or overloading the machine: 2000 events per tab overall, 120 a minute per tab, and an overall
-- budget for events + new tabs a minute (tab ids are made up by the client, so the per-tab limits alone are easy to
-- get round). On 2026-11-12's viral spike the overall count reached 2,555 of 3000 a minute.
--   * The checks counted the last minute's rows of public.events on every batch (twice since 0017 dropped the per-tab
--     index), so their cost grew with traffic, on top of the batches. Now: per tab, 120 a minute on average since its
--     first batch, from its event_sessions row (read anyway; 120 in its first minute, as before); overall, a sliding
--     minute of overflight_private.event_rate (16 counter rows a minute, by tab, so concurrent batches rarely wait on
--     the same row). Like the old checks they are read before the insert, so a burst can overshoot by a few batches.
--   * The overall budget is 6000 events + new tabs a minute, ~2.3x the peak so far. With raw events kept 48 hours, a
--     spammer at the limit for two days stores ~17 million rows (~4 GB): inside the Pro plan's 8 GB.
--   * maintain_events prunes until it has caught up (at most 60 s for events, 20 s each for tabs and lookups, a run)
--     instead of 0016's 50k rows each a run, which the spike's ~95k events an hour would outrun when they reach 48 hours
--     old; 0006 sized the old budget to what the hourly prune could keep up with, and this keeps that true.
-- Not changed: what a batch may contain, the 2000 per tab, the response (always nothing; over a limit, events are
-- dropped silently, as before).
-- Idempotent: create table if not exists, create or replace of this project's functions.

create table if not exists overflight_private.event_rate (
  minute  timestamptz not null,
  shard   smallint not null check (shard between 0 and 15),
  n       int not null default 0,
  primary key (minute, shard)
);
alter table overflight_private.event_rate enable row level security;
revoke all on table overflight_private.event_rate from public, anon, authenticated;

-- ── log_events ──────────────────────────────────────────────────────────────────────────────

create or replace function public.log_events(batch jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sid    text;
  v_ctx    jsonb;
  v_events jsonb;
  v_n      int;
  v_ses    public.event_sessions;
  v_known  boolean;
  v_room   int;
  v_ref    text;
  ev       jsonb;
  v_type   text[] := '{}';
  v_props  jsonb[] := '{}';
  v_dts    bigint[] := '{}';
  v_p      jsonb;
  v_take   int;
  i        int;
  v_minute timestamptz := date_trunc('minute', now());
  v_recent numeric;
begin
  if batch is null or jsonb_typeof(batch) is distinct from 'object' or octet_length(batch::text) > 16384 then
    raise exception 'invalid batch' using errcode = '22023';
  end if;
  v_sid := batch ->> 'sid';
  if jsonb_typeof(batch -> 'sid') is distinct from 'string' or v_sid !~ '^[A-Za-z0-9_-]{16,32}$' then
    raise exception 'invalid session' using errcode = '22023';
  end if;
  v_events := batch -> 'events';
  if jsonb_typeof(v_events) is distinct from 'array' then raise exception 'invalid events' using errcode = '22023'; end if;
  v_n := jsonb_array_length(v_events);
  if v_n = 0 then return; end if;
  if v_n > 50 then raise exception 'too many events' using errcode = '22023'; end if;

  -- Limits, before any per-event work (0020: constant cost, whatever the traffic): 2000 events per tab overall; 120 a
  -- minute per tab, on average since its first batch (and 120 in its first minute); 6000 events + new tabs a minute
  -- overall, over a sliding minute of the event_rate counters.
  select * into v_ses from public.event_sessions where sid = v_sid;
  v_known := found;
  if v_known and v_ses.n >= 2000 then return; end if;
  v_room := 2000 - coalesce(v_ses.n, 0);
  if v_known then
    v_room := least(v_room, (120 * (1 + floor(extract(epoch from now() - v_ses.first_at) / 60)))::int - v_ses.n);
  end if;
  if v_room <= 0 then return; end if;
  select coalesce(sum(r.n) filter (where r.minute = v_minute), 0)
         + coalesce(sum(r.n) filter (where r.minute = v_minute - interval '1 minute'), 0)
           * (1 - extract(epoch from now() - v_minute) / 60)
    into v_recent
  from overflight_private.event_rate r where r.minute >= v_minute - interval '1 minute';
  if v_recent >= 6000 then return; end if;

  v_ctx := case when jsonb_typeof(batch -> 'ctx') = 'object' then batch -> 'ctx' else '{}'::jsonb end;
  for ev in select value from jsonb_array_elements(v_events) loop
    exit when cardinality(v_type) >= v_room;
    continue when jsonb_typeof(ev) is distinct from 'object' or jsonb_typeof(ev -> 'type') is distinct from 'string';
    v_p := overflight_private.event_props(ev ->> 'type', ev -> 'p');
    continue when v_p is null;
    v_type := array_append(v_type, ev ->> 'type');
    v_props := array_append(v_props, v_p);
    v_dts := array_append(v_dts, coalesce(overflight_private.jint(ev, 'dt', 0, 600000), 0));
  end loop;
  v_take := cardinality(v_type);
  if v_take = 0 then return; end if; -- nothing acceptable: no tab row either

  if not v_known then
    v_ref := lower(v_ctx ->> 'ref');
    if jsonb_typeof(v_ctx -> 'ref') is distinct from 'string' or char_length(v_ref) > 100 or v_ref !~ '^([a-z0-9-]+\.)+[a-z]{2,}$' then
      v_ref := null;
    end if;
    insert into public.event_sessions (sid, device, country, ref_host, utm, app_version)
    values (
      v_sid,
      overflight_private.jenum(v_ctx, 'device', array['phone', 'tablet', 'desktop']),
      overflight_private.jmatch(v_ctx, 'country', '^[a-z]{2}$', 2),
      v_ref,
      nullif(concat_ws(' / ',
        overflight_private.clean_masked(v_ctx ->> 'utm_source', 40),
        overflight_private.clean_masked(v_ctx ->> 'utm_medium', 40),
        overflight_private.clean_masked(v_ctx ->> 'utm_campaign', 60)), ''),
      overflight_private.jmatch(v_ctx, 'v', '^([0-9a-f]{7}|\d{1,4}\.\d{1,4}\.\d{1,4}|dev)$', 24))
    on conflict (sid) do nothing;
  end if;

  for i in 1 .. v_take loop
    insert into public.events (created_at, sid, type, props)
    values (now() - make_interval(secs => v_dts[i] / 1000.0), v_sid, v_type[i], v_props[i]);
  end loop;

  update public.event_sessions set last_at = now(), n = n + v_take where sid = v_sid;

  -- Count them (and a new tab) for the overall limit. 16 rows a minute, by tab, so concurrent batches rarely wait on
  -- the same row.
  insert into overflight_private.event_rate as r (minute, shard, n)
  values (v_minute, hashtext(v_sid) & 15, v_take + case when v_known then 0 else 1 end)
  on conflict (minute, shard) do update set n = r.n + excluded.n;
end
$$;

-- ── Maintenance ─────────────────────────────────────────────────────────────────────────────

-- pg_cron, hourly at :17 ('watched-events-maintain', 0005). 0019's, with 0020's prune.
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
  v_t0     timestamptz;
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

  -- Raw events, tabs and lookups past 48 hours, in batches of 10k until none is left, at most 60 s for events and 20 s
  -- each for tabs and lookups a run: up to ~600k events an hour on the Micro machine, more than the overall limit lets
  -- in (6000 a minute is 360k an hour).
  v_keep := overflight_private.event_raw_cutoff();
  v_t0 := clock_timestamp();
  loop
    delete from public.events where id in (
      select id from public.events where created_at < v_keep order by created_at limit 10000);
    get diagnostics v_gone = row_count;
    exit when v_gone < 10000 or clock_timestamp() - v_t0 > interval '60 seconds';
  end loop;
  -- A tab last seen before the cutoff has every event before it (created_at <= the insert time <= last_at).
  v_t0 := clock_timestamp();
  loop
    delete from public.event_sessions where sid in (
      select sid from public.event_sessions where first_at < v_keep and last_at < v_keep limit 10000);
    get diagnostics v_gone = row_count;
    exit when v_gone < 10000 or clock_timestamp() - v_t0 > interval '20 seconds';
  end loop;
  v_t0 := clock_timestamp();
  loop
    delete from public.lookups where id in (
      select id from public.lookups where created_at < now() - interval '48 hours' order by created_at limit 10000);
    get diagnostics v_gone = row_count;
    exit when v_gone < 10000 or clock_timestamp() - v_t0 > interval '20 seconds';
  end loop;
  delete from overflight_private.event_rate where minute < now() - interval '1 hour';

  update public.event_maint set last_at = now() where id = 1;
end
$$;

-- ── Grants (unchanged surface) ──────────────────────────────────────────────────────────────

revoke all on all functions in schema overflight_private from public, anon, authenticated;
revoke all on function public.log_events(jsonb) from public, anon, authenticated;
grant execute on function public.log_events(jsonb) to anon, authenticated;
