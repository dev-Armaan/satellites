-- Checks for 0025_admin_live_hours.sql. Run as begin; <0025>; <this file>; rollback.  Nothing survives.
-- Row writes only (test tabs and their events, counter rows, a test admin, the stored stats' rows), all rolled back.
-- Quick: nothing is computed. As 0023's test: the test tabs share one of this minute's counter rows, and admin_live is
-- tested on hours a day ahead, which live traffic never writes.

do $$
declare
  v_min  timestamptz := date_trunc('minute', now());
  v_sid  text[];
  v_a    record;
  v_b    record;
  batch  jsonb := jsonb_build_array(
    jsonb_build_object('type', 'view', 'p', jsonb_build_object('entry', 'landing')),
    jsonb_build_object('type', 'search', 'p', jsonb_build_object('source', 'search')));
begin
  select array_agg(s) into v_sid from (
    select s from (select 'test25_sid_' || lpad(g::text, 8, '0') s from generate_series(1, 400) g) x
    where hashtext(s) & 15 = 5 limit 4) y;
  if cardinality(v_sid) <> 4 then raise exception 'test: no four tabs on one counter row'; end if;

  -- ── A new tab is active this hour (and new today) ─────────────────────────────────────────
  select coalesce(sum(tabs), 0) t, coalesce(sum(active), 0) a into v_a from overflight_private.event_rate where minute = v_min and shard = 5;
  perform public.log_events(jsonb_build_object('sid', v_sid[1], 'events', batch));
  select tabs t, active a, searches s into v_b from overflight_private.event_rate where minute = v_min and shard = 5;
  -- (>=: until this batch, other tabs' batches could still add to the row)
  if v_b.t < v_a.t + 1 or v_b.a < v_a.a + 1 then raise exception 'new tab: counted % tabs, % active', v_b.t - v_a.t, v_b.a - v_a.a; end if;

  -- ── Its next batch: neither again ─────────────────────────────────────────────────────────
  v_a := v_b;
  perform public.log_events(jsonb_build_object('sid', v_sid[1], 'events', batch));
  select tabs t, active a, searches s into v_b from overflight_private.event_rate where minute = v_min and shard = 5;
  if (v_b.t - v_a.t, v_b.a - v_a.a, v_b.s - v_a.s) <> (0, 0, 1) then raise exception 'known tab: counted % tabs, % active', v_b.t - v_a.t, v_b.a - v_a.a; end if;

  -- ── A tab last seen before this hour began is active again; new today only if that was an earlier day ──
  v_a := v_b;
  insert into public.event_sessions (sid, first_at, last_at, n) values
    (v_sid[2], now() - interval '30 hours', date_trunc('hour', now()) - interval '1 second', 3),
    (v_sid[3], now() - interval '30 hours', now() - interval '30 hours', 3);
  perform public.log_events(jsonb_build_object('sid', v_sid[2], 'events', batch));
  select tabs t, active a, searches s into v_b from overflight_private.event_rate where minute = v_min and shard = 5;
  -- a second before the hour is the same Eastern day, except in the hour after Eastern midnight
  if v_b.a - v_a.a <> 1
     or v_b.t - v_a.t <> (case when extract(hour from (now() at time zone overflight_private.admin_tz())) = 0 then 1 else 0 end) then
    raise exception 'tab from the hour before: counted % tabs, % active', v_b.t - v_a.t, v_b.a - v_a.a;
  end if;
  v_a := v_b;
  perform public.log_events(jsonb_build_object('sid', v_sid[3], 'events', batch));
  select tabs t, active a, searches s into v_b from overflight_private.event_rate where minute = v_min and shard = 5;
  if (v_b.t - v_a.t, v_b.a - v_a.a) <> (1, 1) then raise exception 'tab from an earlier day: counted % tabs, % active', v_b.t - v_a.t, v_b.a - v_a.a; end if;

  -- ── A row 0023's log_events made (no active count) stays "not counted" there ──────────────
  update overflight_private.event_rate set active = null where minute = v_min and shard = 5;
  perform public.log_events(jsonb_build_object('sid', v_sid[4], 'events', batch));
  select tabs t, active a, searches s into v_a from overflight_private.event_rate where minute = v_min and shard = 5;
  if v_a.a is not null or v_a.t <> v_b.t + 1 or v_a.s <> v_b.s + 1 then raise exception 'row from before 0025: active % tabs % searches %', v_a.a, v_a.t - v_b.t, v_a.s - v_b.s; end if;

  if has_function_privilege('anon', 'public.admin_live(text)', 'execute') then raise exception 'grants: anon can call admin_live'; end if;
  if not has_function_privilege('authenticated', 'public.admin_live(text)', 'execute') then raise exception 'grants: authenticated cannot call admin_live'; end if;
end
$$;

-- ── admin_live ──────────────────────────────────────────────────────────────────────────────

insert into overflight_private.admins (email) values ('test-admin@watched.invalid');
insert into auth.users (id, email, email_confirmed_at, aud, role, is_anonymous) values
  ('00000000-0000-0000-0000-00000000a001', 'test-admin@watched.invalid', now(), 'authenticated', 'authenticated', false);
select set_config('request.jwt.claims', jsonb_build_object('role', 'authenticated', 'sub', '00000000-0000-0000-0000-00000000a001',
  'email', 'test-admin@watched.invalid')::text, true);

-- Stored stats a day ahead, 15 s into the last minute of an hour (7d), and at the top of the next hour (all).
-- Counters: that minute (3/4 of it counts), two minutes of the next hour, one of the hour after.
create temp table _h on commit drop as select date_trunc('hour', now()) + interval '1 day' as h;
grant select on _h to authenticated;
delete from overflight_private.admin_stats_cache;
insert into overflight_private.admin_stats_cache (range, data, computed_at)
select '7d', '{"range": "7d"}'::jsonb, h + interval '59 minutes 15 seconds' from _h
union all select 'all', '{"range": "all"}'::jsonb, h + interval '1 hour' from _h;
insert into overflight_private.event_rate (minute, shard, n, searches, shares, tabs, active)
select h + interval '58 minutes', 0, 5000, 1000, 1000, 1000, 1000 from _h
union all select h + interval '59 minutes', 0, 100, 30, 3, 12, 16 from _h
union all select h + interval '59 minutes', 9, 100, 10, 1, 8, 4 from _h
union all select h + interval '1 hour', 3, 50, 5, 1, 2, 9 from _h
union all select h + interval '1 hour 20 minutes', 4, 50, 6, 0, 1, 1 from _h
union all select h + interval '2 hours 5 minutes', 4, 50, 7, 2, 3, 4 from _h;

set local role authenticated;
do $$
declare
  v  jsonb;
  h0 bigint := (select (extract(epoch from h) * 1000)::bigint from _h);
begin
  v := public.admin_live('7d');
  -- 3/4 of (40, 4, 20, 20) in the first hour, (11, 1, 3, 10) in the second, (7, 2, 3, 4) in the third
  if v -> 'hours' is distinct from jsonb_build_array(
       jsonb_build_array(h0, 30, 3, 15, 15), jsonb_build_array(h0 + 3600000, 11, 1, 3, 10), jsonb_build_array(h0 + 7200000, 7, 2, 3, 4)) then
    raise exception '7d: hours are %', v -> 'hours';
  end if;
  if (v -> 'search', v -> 'share_action', v -> 'session') is distinct from ('48'::jsonb, '6'::jsonb, '21'::jsonb) then
    raise exception '7d: totals are %', v;
  end if;
  v := public.admin_live('all');
  if v -> 'hours' is distinct from jsonb_build_array(jsonb_build_array(h0 + 3600000, 11, 1, 3, 10), jsonb_build_array(h0 + 7200000, 7, 2, 3, 4))
     or (v ->> 'search') <> '18' then
    raise exception 'all: %', v;
  end if;
end
$$;
reset role;

-- A minute 0023's log_events wrote: the totals as before, no hours. With no counter rows at all: zeros and no hours.
update overflight_private.event_rate set active = null where minute = (select h + interval '1 hour 20 minutes' from _h);
update overflight_private.admin_stats_cache set computed_at = (select h + interval '5 hours' from _h) where range = 'all';
set local role authenticated;
do $$
declare v jsonb;
begin
  v := public.admin_live('7d');
  if v ? 'hours' or (v ->> 'search') <> '48' or (v ->> 'session') <> '21' then raise exception 'a minute without active counts: %', v; end if;
  v := public.admin_live('all');
  if v -> 'hours' <> '[]'::jsonb or (v ->> 'search') <> '0' or (v ->> 'session') <> '0' then raise exception 'nothing since the stats: %', v; end if;
  raise notice '0025 checks passed';
end
$$;
reset role;
