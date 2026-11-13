-- Checks for 0021_admin_stats_cached_only.sql. Run as begin; <0021>; <this file>; rollback.  Nothing survives.
-- Row writes only (a test admin, the four cache rows), all rolled back. One range is computed once (the missing-row
-- case): what the hourly job does four times, so run it while the rollups are current.

do $$
begin
  if has_function_privilege('anon', 'public.admin_stats(text)', 'execute') then raise exception 'grants: anon can call admin_stats'; end if;
  if not has_function_privilege('authenticated', 'public.admin_stats(text)', 'execute') then raise exception 'grants: authenticated lost admin_stats'; end if;
  if pg_get_functiondef('public.admin_stats(text)'::regprocedure) ~ '15 minutes' then raise exception 'admin_stats still has the 15-minute rule'; end if;
end
$$;

-- A test-only admin (the real admin's account may exist: a second row with that email would collide).
insert into overflight_private.admins (email) values ('test-admin@watched.invalid');
insert into auth.users (id, email, email_confirmed_at, aud, role, is_anonymous) values
  ('00000000-0000-0000-0000-00000000a001', 'test-admin@watched.invalid', now(), 'authenticated', 'authenticated', false),
  ('00000000-0000-0000-0000-00000000a002', 'someone@example.com',        now(), 'authenticated', 'authenticated', false);

create or replace function pg_temp.as_user(sub text, email text) returns void language sql as $$
  select set_config('request.jwt.claims', jsonb_build_object('role', 'authenticated', 'sub', sub, 'email', email)::text, true)
$$;

-- Every stored row is hours old and marked, so a recomputed answer cannot be mistaken for a stored one.
delete from overflight_private.admin_stats_cache;
insert into overflight_private.admin_stats_cache (range, data, computed_at)
select r, jsonb_build_object('range', r, 'stored', true), now() - interval '5 hours' from unnest(array['7d', '30d', 'all']) r;

-- ── A non-admin is refused ──────────────────────────────────────────────────────────────────
select pg_temp.as_user('00000000-0000-0000-0000-00000000a002', 'someone@example.com');
set local role authenticated;
do $$ begin
  perform public.admin_stats('7d');
  raise exception 'a non-admin got stats';
exception when insufficient_privilege then null; end $$;
reset role;

-- ── The admin gets the stored row, however old; a missing row is computed and stored ────────
select pg_temp.as_user('00000000-0000-0000-0000-00000000a001', 'test-admin@watched.invalid');
set local role authenticated;
do $$
declare
  v jsonb;
  r text;
begin
  foreach r in array array['7d', '30d', 'all'] loop
    v := public.admin_stats(r);
    if not coalesce((v ->> 'stored')::boolean, false) then raise exception 'stored row (%): recomputed although a row is stored', r; end if;
    if (v ->> 'cachedAt')::bigint <> (extract(epoch from now() - interval '5 hours') * 1000)::bigint then raise exception 'stored row (%): cachedAt is not the row''s', r; end if;
  end loop;
  -- an unknown range reads 7d
  if (public.admin_stats('nope') ->> 'range') <> '7d' then raise exception 'unknown range did not read 7d'; end if;

  -- 24h has no row: computed now
  v := public.admin_stats('24h');
  if v ? 'stored' or (v ->> 'range') <> '24h' or not v ? 'totals' then raise exception 'missing row: not computed'; end if;
  if (v ->> 'cachedAt')::bigint <> (extract(epoch from now()) * 1000)::bigint then raise exception 'missing row: cachedAt is not now'; end if;
end
$$;
reset role;

do $$
begin
  if (select count(*) from overflight_private.admin_stats_cache where range = '24h' and computed_at = now()) <> 1 then
    raise exception 'missing row: the computed stats were not stored';
  end if;
  if (select count(*) from overflight_private.admin_stats_cache where data ? 'stored') <> 3 then raise exception 'a stored row was replaced'; end if;
  raise notice '0021 checks passed';
end
$$;
