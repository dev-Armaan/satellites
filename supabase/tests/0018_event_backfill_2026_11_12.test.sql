-- Checks for 0018_event_backfill_2026_11_12.sql. Run as begin; <0018>; <this file>; rollback.  Nothing survives.
-- Reads only: the three rows, and the 24h range adding them up. How admin_stats adds backfill rows to the totals and the
-- series is 0015's test.

do $$
declare
  v_s jsonb;
begin
  if (select count(*) from overflight_private.event_backfill
      where hour in ('2026-11-12 15:00+00', '2026-11-12 16:00+00', '2026-11-12 17:00+00')) <> 3 then
    raise exception 'rows: the 2026-11-12 15:00, 16:00 and 17:00 UTC rows are not all there';
  end if;
  if exists (select 1 from overflight_private.event_backfill
             where hour in ('2026-11-12 15:00+00', '2026-11-12 16:00+00', '2026-11-12 17:00+00')
               and (searches <= 0 or sessions <= 0 or active <= 0 or basis !~ '^(outage|slowdown) ')) then
    raise exception 'rows: a 2026-11-12 row is empty or lacks its basis';
  end if;
  if (select sum(searches) from overflight_private.event_backfill where hour::date = '2026-11-12') <> 20124
     or (select sum(sessions) from overflight_private.event_backfill where hour::date = '2026-11-12') <> 31402 then
    raise exception 'rows: the 2026-11-12 rows are not 20124 searches and 31402 tabs';
  end if;
  -- All on the Eastern day 2026-11-12, where the admin day totals put them (0016).
  if exists (select 1 from overflight_private.event_backfill
             where hour::date = '2026-11-12' and (hour at time zone 'America/New_York')::date <> '2026-11-12') then
    raise exception 'rows: a row falls on another Eastern day';
  end if;
  -- 0015's rows are untouched.
  if (select sum(searches) from overflight_private.event_backfill where (hour at time zone 'utc')::date = '2026-11-11') <> 1894 then
    raise exception 'rows: the 2026-11-11 rows changed';
  end if;
  -- 'all' counts them: totals minus recorded is every backfill row (rollups only since 0019, so this is cheap).
  v_s := overflight_private.admin_stats_compute('all');
  if (v_s -> 'totals' ->> 'search')::bigint - (v_s -> 'recorded' ->> 'search')::bigint
       <> (select sum(searches) from overflight_private.event_backfill) then
    raise exception 'all: totals - recorded <> the backfill rows (%, %)', v_s -> 'totals' ->> 'search', v_s -> 'recorded' ->> 'search';
  end if;
  raise notice '0018 checks passed';
end
$$;
