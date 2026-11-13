-- Checks for 0026_admin_live_timelapse.sql. Run as begin; <0026>; <this file>; rollback.  Nothing survives.
-- Row writes only (a test tab and its events, counter rows, a test admin, the stored stats' rows), all rolled back.
-- Quick: nothing is computed. As 0025's test: admin_live is tested on hours a day ahead, which live traffic never
-- writes.

do $$
declare
  v_min  timestamptz := date_trunc('minute', now());
  v_sid  text := 'test26_sid_aaaaaaaaaaaaaa';
  v_sh   int := hashtext('test26_sid_aaaaaaaaaaaaaa') & 15;
  v_a    record;
  v_b    record;
  batch  jsonb := jsonb_build_array(
    jsonb_build_object('type', 'search', 'p', jsonb_build_object('source', 'search')),
    jsonb_build_object('type', 'timelapse_open', 'p', jsonb_build_object('from', 'results')),
    jsonb_build_object('type', 'timelapse_open', 'p', jsonb_build_object('from', 'viewer')),
    jsonb_build_object('type', 'timelapse_share', 'p', jsonb_build_object('action', 'video')));
begin
  -- ── A batch's time-lapse opens are counted (not its time-lapse shares) ────────────────────
  select coalesce(sum(timelapses), 0) l into v_a from overflight_private.event_rate where minute = v_min and shard = v_sh;
  perform public.log_events(jsonb_build_object('sid', v_sid, 'events', batch));
  select timelapses l, searches s, active a, tabs t into v_b from overflight_private.event_rate where minute = v_min and shard = v_sh;
  if (select count(*) from public.events where sid = v_sid) <> 4 then raise exception 'not 4 events stored'; end if;
  -- (>=: until this batch, other tabs' batches could still add to the row)
  if v_b.l < v_a.l + 2 or v_b.s is null or v_b.a is null or v_b.t is null then raise exception 'first batch: % opens counted', v_b.l - v_a.l; end if;
  v_a := v_b;
  perform public.log_events(jsonb_build_object('sid', v_sid, 'events', batch));
  select timelapses l, searches s, active a, tabs t into v_b from overflight_private.event_rate where minute = v_min and shard = v_sh;
  if (v_b.l - v_a.l, v_b.s - v_a.s, v_b.a - v_a.a, v_b.t - v_a.t) <> (2, 1, 0, 0) then raise exception 'second batch: % opens, % searches', v_b.l - v_a.l, v_b.s - v_a.s; end if;

  -- ── A row 0025's log_events made (no count of them) stays "not counted" there ─────────────
  update overflight_private.event_rate set timelapses = null where minute = v_min and shard = v_sh;
  perform public.log_events(jsonb_build_object('sid', v_sid, 'events', batch));
  select timelapses l, searches s into v_a from overflight_private.event_rate where minute = v_min and shard = v_sh;
  if v_a.l is not null or v_a.s <> v_b.s + 1 then raise exception 'row from before 0026: opens %, searches +%', v_a.l, v_a.s - v_b.s; end if;

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

-- Stored stats a day ahead, 15 s into the last minute of an hour. Counters: that minute (3/4 of it counts), and a
-- minute of each of the next two hours.
create temp table _h on commit drop as select date_trunc('hour', now()) + interval '1 day' as h;
grant select on _h to authenticated;
delete from overflight_private.admin_stats_cache;
insert into overflight_private.admin_stats_cache (range, data, computed_at)
select '7d', '{"range": "7d"}'::jsonb, h + interval '59 minutes 15 seconds' from _h;
insert into overflight_private.event_rate (minute, shard, n, searches, shares, tabs, active, timelapses)
select h + interval '59 minutes', 0, 100, 40, 4, 20, 20, 8 from _h
union all select h + interval '1 hour 20 minutes', 4, 50, 11, 1, 3, 10, 5 from _h
union all select h + interval '2 hours 5 minutes', 4, 50, 7, 2, 3, 4, 0 from _h;

set local role authenticated;
do $$
declare
  v  jsonb;
  h0 bigint := (select (extract(epoch from h) * 1000)::bigint from _h);
begin
  v := public.admin_live('7d');
  if v -> 'hours' is distinct from jsonb_build_array(
       jsonb_build_array(h0, 30, 3, 15, 15, 6), jsonb_build_array(h0 + 3600000, 11, 1, 3, 10, 5), jsonb_build_array(h0 + 7200000, 7, 2, 3, 4, 0)) then
    raise exception 'hours are %', v -> 'hours';
  end if;
  if (v -> 'search', v -> 'share_action', v -> 'session', v -> 'timelapse_open') is distinct from ('48'::jsonb, '6'::jsonb, '21'::jsonb, '11'::jsonb) then
    raise exception 'totals are %', v;
  end if;
end
$$;
reset role;

-- A minute 0025's log_events wrote: everything else as before, no total of the opens and no sixth number in any hour.
update overflight_private.event_rate set timelapses = null where minute = (select h + interval '1 hour 20 minutes' from _h);
set local role authenticated;
do $$
declare
  v  jsonb;
  h0 bigint := (select (extract(epoch from h) * 1000)::bigint from _h);
begin
  v := public.admin_live('7d');
  if v ? 'timelapse_open' or (v ->> 'search') <> '48' then raise exception 'a minute without the opens: %', v; end if;
  if v -> 'hours' is distinct from jsonb_build_array(
       jsonb_build_array(h0, 30, 3, 15, 15, null), jsonb_build_array(h0 + 3600000, 11, 1, 3, 10, null), jsonb_build_array(h0 + 7200000, 7, 2, 3, 4, null)) then
    raise exception 'a minute without the opens: hours are %', v -> 'hours';
  end if;
  -- no counter rows at all since the stats: zeros
  raise notice '0026 checks passed';
end
$$;
reset role;
