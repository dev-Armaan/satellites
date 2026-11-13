-- 0024: the admin page's activity chart is current too: the live counts come hour by hour.
--
-- 0023 gave the page three totals counted since the stored stats. The chart (searches, shares and sessions per hour, or
-- per day in 30d and all) still waited for the hourly refresh, so its last bar stood near zero for most of each hour.
--   * admin_live also answers `hours`: [hour start ms, searches, shares, tabs, active tabs] for each hour since the
--     stored stats. The page adds an hour's searches and shares to the chart's bar for that hour or that Eastern day,
--     and for sessions the measure the bar already has: in the hourly chart the tabs active in the hour
--     (event_hours.active: a tab counts in every hour it does something), in the daily chart the tabs new that day.
--   * So log_events counts one more thing in the row it already writes: `active`, a tab's first batch of an hour.
--   * The three totals are now the sums of the hours' rounded counts, so the tiles and the chart always agree.
--   * `hours` is left out while a minute since the stored stats has no `active` count (written by 0023's log_events):
--     the first hour or so after this migration. The totals are still given, as in 0023.
-- Not changed: the totals' meaning, who may call admin_live, the limits, maintain_events (the counters' 6 hours).
--
-- Apply clear of :17, as 0023 (the new column needs event_rate to itself for a moment, and lock_timeout stops the
-- migration rather than keep log_events calls waiting past their own 3 s statement timeout).
-- Idempotent: add column if not exists, create or replace of this project's functions.

set local lock_timeout = '2s';

-- Nullable, no default: null is "not counted" (a row from before this migration).
alter table overflight_private.event_rate add column if not exists active int;

-- ── log_events ──────────────────────────────────────────────────────────────────────────────
-- 0023's, counting the tabs active this hour as well.

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
  v_active int := 0;
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
    v_active := v_tabs;
  else
    if (v_ses.last_at at time zone overflight_private.admin_tz())::date < (now() at time zone overflight_private.admin_tz())::date then
      v_tabs := 1;  -- a tab counts once a day (0019): its first batch of this Eastern day
    end if;
    if v_ses.last_at < date_trunc('hour', now()) then
      v_active := 1;  -- and once an hour in the hourly chart (event_hours.active): its first batch of this hour
    end if;
  end if;

  for i in 1 .. v_take loop
    insert into public.events (created_at, sid, type, props)
    values (now() - make_interval(secs => v_dts[i] / 1000.0), v_sid, v_type[i], v_props[i]);
  end loop;

  update public.event_sessions set last_at = now(), n = n + v_take where sid = v_sid;

  -- Count them (and a new tab) for the overall limit. 16 rows a minute, by tab, so concurrent batches rarely wait on
  -- the same row. The same row counts the batch's searches, shares and tabs for admin_live (0023), and the tabs active
  -- this hour (0024). A row an earlier log_events made has nulls there, and stays null: that minute was not counted in
  -- full.
  insert into overflight_private.event_rate as r (minute, shard, n, searches, shares, tabs, active)
  values (v_minute, hashtext(v_sid) & 15, v_take + case when v_known then 0 else 1 end, v_searches, v_shares, v_tabs, v_active)
  on conflict (minute, shard) do update set n = r.n + excluded.n, searches = r.searches + excluded.searches,
    shares = r.shares + excluded.shares, tabs = r.tabs + excluded.tabs, active = r.active + excluded.active;
end
$$;

-- ── Live counts ─────────────────────────────────────────────────────────────────────────────

-- 0023's, hour by hour. Searches, shares and tabs that arrived since the range's stored stats were computed, under the
-- keys the stats' totals use, and `hours` (see the top); `since` is that moment. No counts when the counters do not
-- cover the whole time since; no `hours` when only the active tabs are not covered.
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
  v_agap  boolean;
  v_s     numeric;
  v_sh    numeric;
  v_t     numeric;
  v_hours jsonb;
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
  with h as (
    select date_trunc('hour', r.minute) as hour,
           bool_or(r.searches is null or r.shares is null or r.tabs is null) as gap, bool_or(r.active is null) as agap,
           round(sum(r.searches * w.w)) as s, round(sum(r.shares * w.w)) as sh, round(sum(r.tabs * w.w)) as t,
           round(sum(r.active * w.w)) as a
    from overflight_private.event_rate r
    cross join lateral (select case when r.minute = v_min then 1 - extract(epoch from v_at - v_min) / 60 else 1 end as w) w
    where r.minute >= v_min
    group by 1
  )
  select coalesce(bool_or(h.gap), false), coalesce(bool_or(h.agap), false),
         coalesce(sum(h.s), 0), coalesce(sum(h.sh), 0), coalesce(sum(h.t), 0),
         coalesce(jsonb_agg(jsonb_build_array((extract(epoch from h.hour) * 1000)::bigint, h.s, h.sh, h.t, h.a) order by h.hour), '[]'::jsonb)
    into v_gap, v_agap, v_s, v_sh, v_t, v_hours
  from h;
  if v_gap then return v_out; end if;

  v_out := v_out || jsonb_build_object('search', v_s::bigint, 'share_action', v_sh::bigint, 'session', v_t::bigint);
  if not v_agap then v_out := v_out || jsonb_build_object('hours', v_hours); end if;
  return v_out;
end
$$;

-- ── Grants (unchanged surface) ──────────────────────────────────────────────────────────────

revoke all on all functions in schema overflight_private from public, anon, authenticated;
revoke all on function public.log_events(jsonb) from public, anon, authenticated;
grant execute on function public.log_events(jsonb) to anon, authenticated;
revoke all on function public.admin_live(text) from public, anon;
grant execute on function public.admin_live(text) to authenticated;
