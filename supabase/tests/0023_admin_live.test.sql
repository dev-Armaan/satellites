-- Checks for 0023_admin_live.sql. Run as begin; <0023>; <this file>; rollback.  Nothing survives.
-- Row writes only (test tabs and their events, counter rows, a test admin, the stored stats' rows), all rolled back.
-- Quick: nothing is computed. The four test tabs share one of this minute's 16 counter rows, so after the first batch
-- the transaction holds that row and the counts can be compared exactly. admin_live is tested on minutes a day ahead,
-- which live traffic never writes.

do $$
declare
  r      text;
  v_min  timestamptz := date_trunc('minute', now());
  v_sid  text[];
  v_sh   int;
  v_a    record;
  v_b    record;
  batch  jsonb := jsonb_build_array(
    jsonb_build_object('type', 'view', 'p', jsonb_build_object('entry', 'landing')),
    jsonb_build_object('type', 'search', 'p', jsonb_build_object('source', 'search')),
    jsonb_build_object('type', 'search', 'p', jsonb_build_object('source', 'pin')),
    jsonb_build_object('type', 'share_action', 'p', jsonb_build_object('action', 'copy_link')),
    jsonb_build_object('type', 'no_such_event'));
begin
  -- ── Grants ────────────────────────────────────────────────────────────────────────────────
  if has_function_privilege('anon', 'public.admin_live(text)', 'execute') then raise exception 'grants: anon can call admin_live'; end if;
  if not has_function_privilege('authenticated', 'public.admin_live(text)', 'execute') then raise exception 'grants: authenticated cannot call admin_live'; end if;
  if not has_function_privilege('anon', 'public.log_events(jsonb)', 'execute') then raise exception 'grants: anon lost log_events'; end if;
  foreach r in array array['anon', 'authenticated'] loop
    if has_table_privilege(r, 'overflight_private.event_rate', 'select') then raise exception 'grants: % can read event_rate', r; end if;
  end loop;

  -- Four test tabs on one counter row.
  select array_agg(s) into v_sid from (
    select s from (select 'test23_sid_' || lpad(g::text, 8, '0') s from generate_series(1, 400) g) x
    where hashtext(s) & 15 = 5 limit 4) y;
  if cardinality(v_sid) <> 4 then raise exception 'test: no four tabs on one counter row'; end if;
  v_sh := 5;

  -- ── A new tab: 2 searches, 1 share, 1 tab; 4 events + 1 tab for the limit ─────────────────
  select coalesce(sum(n), 0) n, coalesce(sum(searches), 0) s, coalesce(sum(shares), 0) sh, coalesce(sum(tabs), 0) t into v_a
  from overflight_private.event_rate where minute = v_min and shard = v_sh;
  perform public.log_events(jsonb_build_object('sid', v_sid[1], 'ctx', jsonb_build_object('device', 'phone'), 'events', batch));
  select n, searches s, shares sh, tabs t into v_b from overflight_private.event_rate where minute = v_min and shard = v_sh;
  if (select count(*) from public.events where sid = v_sid[1]) <> 4 then raise exception 'new tab: not 4 events stored'; end if;
  -- (>=: until this batch, other tabs' batches could still add to the row)
  if v_b.n < v_a.n + 5 or v_b.s < v_a.s + 2 or v_b.sh < v_a.sh + 1 or v_b.t < v_a.t + 1 then
    raise exception 'new tab: counted % events, % searches, % shares, % tabs', v_b.n - v_a.n, v_b.s - v_a.s, v_b.sh - v_a.sh, v_b.t - v_a.t;
  end if;

  -- ── Its next batch: the searches and the share again, no tab ──────────────────────────────
  v_a := v_b;
  perform public.log_events(jsonb_build_object('sid', v_sid[1], 'events', batch));
  select n, searches s, shares sh, tabs t into v_b from overflight_private.event_rate where minute = v_min and shard = v_sh;
  if (v_b.n - v_a.n, v_b.s - v_a.s, v_b.sh - v_a.sh, v_b.t - v_a.t) <> (4, 2, 1, 0) then
    raise exception 'known tab: counted % events, % searches, % shares, % tabs', v_b.n - v_a.n, v_b.s - v_a.s, v_b.sh - v_a.sh, v_b.t - v_a.t;
  end if;

  -- ── A tab last seen on an earlier Eastern day counts again today ──────────────────────────
  v_a := v_b;
  insert into public.event_sessions (sid, first_at, last_at, n) values (v_sid[2], now() - interval '30 hours', now() - interval '30 hours', 3);
  perform public.log_events(jsonb_build_object('sid', v_sid[2], 'events', batch));
  select n, searches s, shares sh, tabs t into v_b from overflight_private.event_rate where minute = v_min and shard = v_sh;
  if (v_b.n - v_a.n, v_b.s - v_a.s, v_b.sh - v_a.sh, v_b.t - v_a.t) <> (4, 2, 1, 1) then
    raise exception 'tab from an earlier day: counted % events, % searches, % shares, % tabs', v_b.n - v_a.n, v_b.s - v_a.s, v_b.sh - v_a.sh, v_b.t - v_a.t;
  end if;

  -- ── A tab over its limit: nothing stored, nothing counted ─────────────────────────────────
  v_a := v_b;
  insert into public.event_sessions (sid, first_at, last_at, n) values (v_sid[3], now() - interval '30 hours', now() - interval '30 hours', 2000);
  perform public.log_events(jsonb_build_object('sid', v_sid[3], 'events', batch));
  select n, searches s, shares sh, tabs t into v_b from overflight_private.event_rate where minute = v_min and shard = v_sh;
  if (v_b.n, v_b.s, v_b.sh, v_b.t) <> (v_a.n, v_a.s, v_a.sh, v_a.t) then raise exception 'over the limit: a dropped batch was counted'; end if;

  -- ── A row the earlier log_events made (nulls) stays "not counted" ─────────────────────────
  update overflight_private.event_rate set searches = null, shares = null, tabs = null where minute = v_min and shard = v_sh;
  perform public.log_events(jsonb_build_object('sid', v_sid[4], 'events', batch));
  select n, searches s, shares sh, tabs t into v_b from overflight_private.event_rate where minute = v_min and shard = v_sh;
  if v_b.n <> v_a.n + 5 or v_b.s is not null or v_b.sh is not null or v_b.t is not null then
    raise exception 'row from before 0023: its nulls were filled in (% % %)', v_b.s, v_b.sh, v_b.t;
  end if;

  -- ── The counters outlive the hour ─────────────────────────────────────────────────────────
  if pg_get_functiondef('overflight_private.maintain_events()'::regprocedure) !~ 'event_rate where minute < now\(\) - interval ''6 hours''' then
    raise exception 'maintain_events does not keep the counters 6 hours';
  end if;
end
$$;

-- ── admin_live ──────────────────────────────────────────────────────────────────────────────

-- A test-only admin (the real admin's account may exist: a second row with that email would collide).
insert into overflight_private.admins (email) values ('test-admin@watched.invalid');
insert into auth.users (id, email, email_confirmed_at, aud, role, is_anonymous) values
  ('00000000-0000-0000-0000-00000000a001', 'test-admin@watched.invalid', now(), 'authenticated', 'authenticated', false),
  ('00000000-0000-0000-0000-00000000a002', 'someone@example.com',        now(), 'authenticated', 'authenticated', false);

create or replace function pg_temp.as_user(sub text, email text) returns void language sql as $$
  select set_config('request.jwt.claims', jsonb_build_object('role', 'authenticated', 'sub', sub, 'email', email)::text, true)
$$;

-- Stored stats a day ahead, 15 s into their minute (7d) and a minute later (all); 30d is over 5 hours old; 24h is
-- missing. Counters: 1000s the minute before (not counted), the stats' own minute (3/4 of it counts) and the next.
delete from overflight_private.admin_stats_cache;
insert into overflight_private.admin_stats_cache (range, data, computed_at) values
  ('7d',  '{"range": "7d"}',  date_trunc('minute', now()) + interval '1 day 15 seconds'),
  ('all', '{"range": "all"}', date_trunc('minute', now()) + interval '1 day 1 minute'),
  ('30d', '{"range": "30d"}', now() - interval '6 hours');
insert into overflight_private.event_rate (minute, shard, n, searches, shares, tabs) values
  (date_trunc('minute', now()) + interval '1 day' - interval '1 minute', 0, 5000, 1000, 1000, 1000),
  (date_trunc('minute', now()) + interval '1 day', 0, 100, 30, 3, 12),
  (date_trunc('minute', now()) + interval '1 day', 9, 100, 10, 1, 8),
  (date_trunc('minute', now()) + interval '1 day 1 minute', 3, 50, 5, 1, 2);

-- ── A non-admin is refused ──────────────────────────────────────────────────────────────────
select pg_temp.as_user('00000000-0000-0000-0000-00000000a002', 'someone@example.com');
set local role authenticated;
do $$ begin
  perform public.admin_live('7d');
  raise exception 'a non-admin got live counts';
exception when insufficient_privilege then null; end $$;
reset role;

-- ── The admin gets the counts since the stored stats, or none when they are not all there ───
select pg_temp.as_user('00000000-0000-0000-0000-00000000a001', 'test-admin@watched.invalid');
set local role authenticated;
do $$
declare
  v jsonb;
  v_since bigint := (extract(epoch from date_trunc('minute', now()) + interval '1 day 15 seconds') * 1000)::bigint;
begin
  v := public.admin_live('7d');
  if (v ->> 'since')::bigint <> v_since or (v ->> 'range') <> '7d' or not v ? 'at' then raise exception '7d: wrong since, range or at: %', v; end if;
  -- 3/4 of (30 + 10, 3 + 1, 12 + 8) + (5, 1, 2)
  if (v -> 'search', v -> 'share_action', v -> 'session') is distinct from ('35'::jsonb, '4'::jsonb, '17'::jsonb) then
    raise exception '7d: counts are %', v;
  end if;
  -- an unknown range reads 7d
  if public.admin_live('nope') - 'at' <> v - 'at' then raise exception 'unknown range did not read 7d'; end if;

  v := public.admin_live('all');
  if (v -> 'search', v -> 'share_action', v -> 'session') is distinct from ('5'::jsonb, '1'::jsonb, '2'::jsonb) then
    raise exception 'all: counts are %', v;
  end if;

  v := public.admin_live('30d');
  if v ? 'search' or v ? 'session' or v ? 'share_action' or v -> 'since' = 'null' then raise exception 'stats over 5 hours old: %', v; end if;
  v := public.admin_live('24h');
  if v ? 'search' or v -> 'since' <> 'null' then raise exception 'no stored stats: %', v; end if;
end
$$;
reset role;

-- A minute the earlier log_events wrote: no counts for stats from before it, counts for stats after it.
update overflight_private.event_rate set searches = null, shares = null, tabs = null
where minute = date_trunc('minute', now()) + interval '1 day' and shard = 9;
set local role authenticated;
do $$
begin
  if public.admin_live('7d') ? 'search' then raise exception 'a minute that was not counted: counts given anyway'; end if;
  if (public.admin_live('all') ->> 'search') <> '5' then raise exception 'a minute before the stats that was not counted: no counts'; end if;
  raise notice '0023 checks passed';
end
$$;
reset role;
