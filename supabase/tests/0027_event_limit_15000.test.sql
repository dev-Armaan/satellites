-- Checks for 0027_event_limit_15000.sql. Run as begin; <0027>; <this file>; rollback.  Nothing survives.
-- Row writes only (two test tabs, their events, counter rows), all rolled back. Like 0020's test it raises the count
-- through the PREVIOUS minute's counter row, which live traffic no longer writes, so no live call waits on it. That
-- row counts for the share of the minute still to come (now() is the transaction's start, the same in log_events), so
-- the test sizes its row by that share. It needs live traffic under 7500 a minute and a start outside a minute's last
-- three seconds: outside those it says so and fails, and is run again.

do $$
declare
  v_min  timestamptz := date_trunc('minute', now());
  v_w    numeric := 1 - extract(epoch from now() - v_min) / 60;
  ev5    jsonb := (select jsonb_agg(jsonb_build_object('type', 'view', 'p', jsonb_build_object('entry', 'landing'))) from generate_series(1, 5));
  v_live numeric;
begin
  if not has_function_privilege('anon', 'public.log_events(jsonb)', 'execute') then raise exception 'grants: anon lost log_events'; end if;
  if has_table_privilege('anon', 'overflight_private.event_rate', 'select') then raise exception 'grants: anon can read event_rate'; end if;

  if v_w < 0.05 then raise exception 'started in the last seconds of a minute: run this test again'; end if;
  select coalesce(sum(r.n) filter (where r.minute = v_min), 0) + coalesce(sum(r.n) filter (where r.minute = v_min - interval '1 minute'), 0) * v_w
    into v_live from overflight_private.event_rate r where r.minute >= v_min - interval '1 minute';
  if v_live >= 7500 then raise exception 'live traffic is at % a minute: run this test when it is under 7500', round(v_live); end if;

  -- ── Past the old 6000 and under 15000 (7000 + live): a batch is accepted ─────────────────
  insert into overflight_private.event_rate as x (minute, shard, n) values (v_min - interval '1 minute', 0, ceil(7000 / v_w)::int)
  on conflict (minute, shard) do update set n = x.n + excluded.n;
  perform public.log_events(jsonb_build_object('sid', 'test27_sid_aaaaaaaaaaaaaa', 'events', ev5));
  if (select count(*) from public.events where sid = 'test27_sid_aaaaaaaaaaaaaa') <> 5 then
    raise exception 'under the limit: a batch at % a minute was dropped', round(v_live + 7000);
  end if;

  -- ── Over 15000: a batch is dropped and no tab row is made ────────────────────────────────
  insert into overflight_private.event_rate as x (minute, shard, n) values (v_min - interval '1 minute', 0, ceil(8000 / v_w)::int)
  on conflict (minute, shard) do update set n = x.n + excluded.n;
  perform public.log_events(jsonb_build_object('sid', 'test27_sid_bbbbbbbbbbbbbb', 'events', ev5));
  if exists (select 1 from public.events where sid = 'test27_sid_bbbbbbbbbbbbbb') or exists (select 1 from public.event_sessions where sid = 'test27_sid_bbbbbbbbbbbbbb') then
    raise exception 'over the limit: a batch got through at 15000 a minute';
  end if;

  raise notice '0027 checks passed';
end
$$;
