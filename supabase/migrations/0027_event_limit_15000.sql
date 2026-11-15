-- 0027: the overall event limit goes from 6000 to 15000 a minute (owner, 2026-11-15).
--
-- A post on X sent 40,000 tabs in an hour (07:00 UTC, 2026-11-15): events + new tabs ran at about 5,700 a minute for
-- an hour, flat against 0020's 6000, so the stats were losing events while every visitor was real. 15000 is ~2.6x
-- that hour.
--   * What it costs: the limit bounds storage (48 hours of raw events) and the hourly prune's work. The prune removes
--     up to ~600k events an hour on the Micro machine (maintain_events), which is 10,000 a minute: traffic held ABOVE
--     that for hours would leave the prune behind 48 hours later until it eases. A burst does not.
--   * Each check still costs the same at any traffic (0020's counters).
-- Not changed: everything else in log_events (0026's, to the letter but for the number and its comment), the 2000
-- per tab, the 120 a minute per tab, the response (always nothing; over a limit, events are dropped silently).
-- Idempotent: create or replace.

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
  v_lapses int := 0;
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
  -- minute per tab, on average since its first batch (and 120 in its first minute); 15000 events + new tabs a minute (0027)
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
  if v_recent >= 15000 then return; end if;

  v_ctx := case when jsonb_typeof(batch -> 'ctx') = 'object' then batch -> 'ctx' else '{}'::jsonb end;
  for ev in select value from jsonb_array_elements(v_events) loop
    exit when cardinality(v_type) >= v_room;
    continue when jsonb_typeof(ev) is distinct from 'object' or jsonb_typeof(ev -> 'type') is distinct from 'string';
    v_p := overflight_private.event_props(ev ->> 'type', ev -> 'p');
    continue when v_p is null;
    v_type := array_append(v_type, ev ->> 'type');
    if ev ->> 'type' = 'search' then v_searches := v_searches + 1;
    elsif ev ->> 'type' = 'share_action' then v_shares := v_shares + 1;
    elsif ev ->> 'type' = 'timelapse_open' then v_lapses := v_lapses + 1; end if;
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
  -- the same row. The same row counts the batch's searches, shares and tabs for admin_live (0023), the tabs active
  -- this hour (0025) and the time-lapse opens (0026). A row an earlier log_events made has nulls there, and stays
  -- null: that minute was not counted in full.
  insert into overflight_private.event_rate as r (minute, shard, n, searches, shares, tabs, active, timelapses)
  values (v_minute, hashtext(v_sid) & 15, v_take + case when v_known then 0 else 1 end, v_searches, v_shares, v_tabs, v_active,
          v_lapses)
  on conflict (minute, shard) do update set n = r.n + excluded.n, searches = r.searches + excluded.searches,
    shares = r.shares + excluded.shares, tabs = r.tabs + excluded.tabs, active = r.active + excluded.active,
    timelapses = r.timelapses + excluded.timelapses;
end
$$;

revoke all on function public.log_events(jsonb) from public, anon, authenticated;
grant execute on function public.log_events(jsonb) to anon, authenticated;
