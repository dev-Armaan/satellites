-- Checks for 0020_event_limits.sql. Run as begin; <0020>; <this file>; rollback.  Nothing survives.
-- Row writes only (test tabs, their events, counter rows), all rolled back. Quick: the accepted test batches lock two of
-- this minute's counter rows for well under a second. The overall limit is tested with the previous minute's rows,
-- which live traffic no longer writes, so it never waits on the test.

do $$
declare
  r text;
  v_min timestamptz := date_trunc('minute', now());
  ev50 jsonb := (select jsonb_agg(jsonb_build_object('type', 'view', 'p', jsonb_build_object('entry', 'landing'))) from generate_series(1, 50));
  ev5  jsonb := (select jsonb_agg(jsonb_build_object('type', 'view', 'p', jsonb_build_object('entry', 'landing'))) from generate_series(1, 5));
  v_before int;
begin
  -- ── Grants: the counters are private ──────────────────────────────────────────────────────
  foreach r in array array['anon', 'authenticated'] loop
    if has_table_privilege(r, 'overflight_private.event_rate', 'select') or has_table_privilege(r, 'overflight_private.event_rate', 'insert') then
      raise exception 'grants: % can touch event_rate', r;
    end if;
  end loop;
  if not has_function_privilege('anon', 'public.log_events(jsonb)', 'execute') then raise exception 'grants: anon lost log_events'; end if;

  -- ── Per tab: 120 in the first minute ──────────────────────────────────────────────────────
  insert into public.event_sessions (sid, first_at, last_at, n) values ('test20_sid_aaaaaaaaaaaaaa', now() - interval '30 seconds', now(), 118);
  perform public.log_events(jsonb_build_object('sid', 'test20_sid_aaaaaaaaaaaaaa', 'events', ev5));
  if (select count(*) from public.events where sid = 'test20_sid_aaaaaaaaaaaaaa') <> 2 then
    raise exception 'per tab: % of 5 accepted at 118 in the first minute, expected 2', (select count(*) from public.events where sid = 'test20_sid_aaaaaaaaaaaaaa');
  end if;
  if (select n from public.event_sessions where sid = 'test20_sid_aaaaaaaaaaaaaa') <> 120 then raise exception 'per tab: n is not 120'; end if;

  -- ── Per tab: 120 a minute on average (3 min 10 s old: 480 allowed) ────────────────────────
  insert into public.event_sessions (sid, first_at, last_at, n) values ('test20_sid_bbbbbbbbbbbbbb', now() - interval '190 seconds', now(), 470);
  perform public.log_events(jsonb_build_object('sid', 'test20_sid_bbbbbbbbbbbbbb', 'events', ev50));
  if (select count(*) from public.events where sid = 'test20_sid_bbbbbbbbbbbbbb') <> 10 then
    raise exception 'per tab: % of 50 accepted at 470 after 3 minutes, expected 10', (select count(*) from public.events where sid = 'test20_sid_bbbbbbbbbbbbbb');
  end if;

  -- ── A new tab: all 50, and the counters take 50 events + 1 tab ────────────────────────────
  select coalesce(sum(n), 0) into v_before from overflight_private.event_rate where minute = v_min and shard = hashtext('test20_sid_cccccccccccccc') & 15;
  perform public.log_events(jsonb_build_object('sid', 'test20_sid_cccccccccccccc', 'ctx', jsonb_build_object('device', 'phone'), 'events', ev50));
  if (select count(*) from public.events where sid = 'test20_sid_cccccccccccccc') <> 50 then raise exception 'new tab: not all 50 accepted'; end if;
  if (select n from overflight_private.event_rate where minute = v_min and shard = hashtext('test20_sid_cccccccccccccc') & 15) < v_before + 51 then
    raise exception 'counters: the new tab''s 50 events + 1 tab were not counted';
  end if;
  if (select n from public.event_sessions where sid = 'test20_sid_cccccccccccccc') <> 50 then raise exception 'new tab: n is not 50'; end if;

  -- ── Overall: over 6000 in the sliding minute, a batch is dropped and no tab row is made ───
  insert into overflight_private.event_rate as x (minute, shard, n) values (v_min - interval '1 minute', 0, 100000000)
  on conflict (minute, shard) do update set n = x.n + excluded.n;
  perform public.log_events(jsonb_build_object('sid', 'test20_sid_dddddddddddddd', 'events', ev5));
  if exists (select 1 from public.events where sid = 'test20_sid_dddddddddddddd') or exists (select 1 from public.event_sessions where sid = 'test20_sid_dddddddddddddd') then
    raise exception 'overall: a batch got through over the limit';
  end if;

  raise notice '0020 checks passed';
end
$$;
