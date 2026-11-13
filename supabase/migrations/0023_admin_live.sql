-- 0023: the admin page's sessions, searches and shares are current on every refresh, from counters, not raw events.
--
-- The stats are computed hourly at :00 and the page only reads the stored row (0021), because computing them reads
-- every raw event since the last rolled hour: 6 to 12 s of work at 2026-11-13's ~2,800 events a minute. The owner wants
-- the headline totals whenever he looks. They are counted as the events arrive instead:
--   * log_events already adds each batch to one row of overflight_private.event_rate (this minute, 16 rows, 0020). The
--     same row now also counts the batch's searches, its shares (share_action) and its tabs: a tab's first batch of an
--     Eastern day, as the rollups count a tab once a day (0019). No extra write, and no read of public.events.
--   * public.admin_live(range), admins only, sums those counters since the range's stored stats were computed (the
--     first minute by the part of it after that moment). The page adds them to the stored totals. It reads 16 rows for
--     each minute since: ~1,000 after an hour, the same at any traffic.
--   * It answers without counts when the counters do not cover the whole time since the stored stats: a minute written
--     by the log_events before this migration (its row has nulls), or stats over 5 hours old (the counters are kept
--     6 hours, were 1). The page then shows the stored totals alone, never a number that is short.
-- What the counts are: events by arrival, where the stored stats take everything that had arrived when they were
-- computed, so the two do not overlap. A refresh takes several seconds, and events that arrive during it can be in
-- both or neither: a few seconds of traffic, replaced by the exact totals at the next hourly refresh. Events over a
-- limit are dropped before they are counted, as before.
-- Not changed: what a batch may contain, the limits, the hourly stats and their schedule, the rest of maintain_events.
--
-- Apply clear of :17 (maintain_events prunes event_rate, and the new columns need the table to itself for a moment:
-- log_events calls wait, a fraction of a second). lock_timeout stops the migration, changing nothing, rather than keep
-- them waiting past their own 3 s statement timeout, which would lose their events.
-- Idempotent: add column if not exists, create or replace of this project's functions.

set local lock_timeout = '2s';

-- Nullable, no default: null is "not counted" (a row from before this migration), which admin_live must tell from 0.
alter table overflight_private.event_rate
  add column if not exists searches int,
  add column if not exists shares   int,
  add column if not exists tabs     int;

-- ── log_events ──────────────────────────────────────────────────────────────────────────────
-- 0020's, counting the batch's searches, shares and tabs in the row it already writes.

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
  v_searches int := 0;
  v_shares int := 0;
  v_tabs   int := 0;
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
    if ev ->> 'type' = 'search' then v_searches := v_searches + 1;
    elsif ev ->> 'type' = 'share_action' then v_shares := v_shares + 1; end if;
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
    get diagnostics v_tabs = row_count;  -- 0 when another batch of this tab made the row first
  elsif (v_ses.last_at at time zone overflight_private.admin_tz())::date < (now() at time zone overflight_private.admin_tz())::date then
    v_tabs := 1;  -- a tab counts once a day (0019): its first batch of this Eastern day
  end if;

  for i in 1 .. v_take loop
    insert into public.events (created_at, sid, type, props)
    values (now() - make_interval(secs => v_dts[i] / 1000.0), v_sid, v_type[i], v_props[i]);
  end loop;

  update public.event_sessions set last_at = now(), n = n + v_take where sid = v_sid;

  -- Count them (and a new tab) for the overall limit. 16 rows a minute, by tab, so concurrent batches rarely wait on
  -- the same row. The same row counts the batch's searches, shares and tabs for admin_live (0023). A row an earlier
  -- log_events made has nulls there, and stays null: that minute was not counted in full.
  insert into overflight_private.event_rate as r (minute, shard, n, searches, shares, tabs)
  values (v_minute, hashtext(v_sid) & 15, v_take + case when v_known then 0 else 1 end, v_searches, v_shares, v_tabs)
  on conflict (minute, shard) do update set n = r.n + excluded.n, searches = r.searches + excluded.searches,
    shares = r.shares + excluded.shares, tabs = r.tabs + excluded.tabs;
end
$$;

-- ── Live counts ─────────────────────────────────────────────────────────────────────────────

-- Searches, shares and tabs that arrived since the range's stored stats were computed, under the keys the stats'
-- totals use; `since` is that moment (the page adds the counts only to the stats they continue). No counts when the
-- counters do not cover the whole time since (see the top).
create or replace function public.admin_live(p_range text default '7d')
returns jsonb
language plpgsql
stable
security definer
set search_path = public
set timezone = 'UTC'
as $$
declare
  v_at    timestamptz;
  v_min   timestamptz;
  v_out   jsonb;
  v_gap   boolean;
  v_s     numeric;
  v_sh    numeric;
  v_t     numeric;
begin
  if not overflight_private.is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_range is null or p_range not in ('24h', '7d', '30d', 'all') then p_range := '7d'; end if;

  select c.computed_at into v_at from overflight_private.admin_stats_cache c where c.range = p_range;
  v_out := jsonb_build_object(
    'range', p_range,
    'since', (extract(epoch from v_at) * 1000)::bigint,
    'at', (extract(epoch from clock_timestamp()) * 1000)::bigint);
  if v_at is null or v_at < now() - interval '5 hours' then return v_out; end if;

  v_min := date_trunc('minute', v_at);
  select coalesce(bool_or(r.searches is null or r.shares is null or r.tabs is null), false),
         coalesce(sum(r.searches * w.w), 0), coalesce(sum(r.shares * w.w), 0), coalesce(sum(r.tabs * w.w), 0)
    into v_gap, v_s, v_sh, v_t
  from overflight_private.event_rate r
  cross join lateral (select case when r.minute = v_min then 1 - extract(epoch from v_at - v_min) / 60 else 1 end as w) w
  where r.minute >= v_min;
  if v_gap then return v_out; end if;

  return v_out || jsonb_build_object('search', round(v_s)::bigint, 'share_action', round(v_sh)::bigint, 'session', round(v_t)::bigint);
end
$$;

-- ── Maintenance ─────────────────────────────────────────────────────────────────────────────

-- pg_cron, hourly at :17 ('watched-events-maintain', 0005). 0020's, keeping the counters 6 hours.
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
  -- The counters: the limit reads a minute of them, admin_live at most the 5 hours since the stored stats (0023).
  delete from overflight_private.event_rate where minute < now() - interval '6 hours';

  update public.event_maint set last_at = now() where id = 1;
end
$$;

-- ── Grants ──────────────────────────────────────────────────────────────────────────────────

revoke all on all functions in schema overflight_private from public, anon, authenticated;
revoke all on function public.log_events(jsonb) from public, anon, authenticated;
grant execute on function public.log_events(jsonb) to anon, authenticated;
revoke all on function public.admin_live(text) from public, anon;
grant execute on function public.admin_live(text) to authenticated;
