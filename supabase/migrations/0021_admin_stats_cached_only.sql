-- 0021: the admin page reads the stored stats whatever their age; it no longer recomputes them on a page load.
--
-- 0009's admin_stats computed live when the stored row was older than 15 minutes, which was right while the cron job
-- refreshed every 5 minutes: an old row meant the job was behind. 0019 made the refresh hourly (at :00), so from :15
-- to :59 of every hour each page load and each range switch ran admin_stats_compute in the request, and without the
-- check refresh_admin_stats makes first (event_rollups_current). With the rollups behind, opening the admin page then
-- aggregated every raw event not rolled yet: the read that overloaded the database on 2026-11-11 and 2026-11-12, at
-- the moment it is least able to take it.
--   * A stored row is returned as it is. The page already says how old it is (cachedAt), and the hourly job replaces it.
--   * Only a missing row is computed in the request: a new database, before the job's first run. There is little to
--     read then, and without it the page would show nothing for up to an hour.
-- Not changed: the admin check, the answer's shape (data + cachedAt, maintLastAt, rolledThrough), the cron schedule.
-- Idempotent: create or replace of this project's function.

create or replace function public.admin_stats(p_range text default '7d')
returns jsonb
language plpgsql
security definer
set search_path = public
set timezone = 'UTC'
as $$
declare
  v_last  timestamptz := (select last_at from public.event_maint where id = 1);
  v_data  jsonb;
  v_at    timestamptz;
begin
  if not overflight_private.is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_range is null or p_range not in ('24h', '7d', '30d', 'all') then p_range := '7d'; end if;

  select c.data, c.computed_at into v_data, v_at from overflight_private.admin_stats_cache c where c.range = p_range;
  if v_data is null then
    -- Nothing stored yet (a new database): compute once and store it. An error reaches the page.
    v_data := overflight_private.admin_stats_compute(p_range);
    v_at := now();
    perform overflight_private.store_admin_stats(p_range, v_data, v_at);
  end if;

  return v_data || jsonb_build_object(
    'cachedAt', (extract(epoch from v_at) * 1000)::bigint,
    'maintLastAt', case when isfinite(v_last) then (extract(epoch from v_last) * 1000)::bigint end,
    'rolledThrough', (select max(day)::text from public.event_rolled));
end
$$;

revoke all on function public.admin_stats(text) from public, anon;
grant execute on function public.admin_stats(text) to authenticated;
