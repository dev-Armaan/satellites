-- Checks for 0028_event_backfill_2026_11_15.sql. Run as begin; <0028>; <this file>; rollback.  Nothing survives.
-- Reads only: the two rows, and that the earlier ones are as they were. How admin_stats adds backfill rows to the
-- totals and the series is 0015's test.

do $$
begin
  if (select count(*) from overflight_private.event_backfill where hour in ('2026-11-15 07:00+00', '2026-11-15 08:00+00')) <> 2 then
    raise exception 'rows: the 2026-11-15 07:00 and 08:00 UTC rows are not both there';
  end if;
  if exists (select 1 from overflight_private.event_backfill
             where hour in ('2026-11-15 07:00+00', '2026-11-15 08:00+00')
               and (searches <= 0 or sessions <= 0 or active <> sessions or basis !~ '^limit ')) then
    raise exception 'rows: a 2026-11-15 row is empty or lacks its basis';
  end if;
  if (select sum(searches) from overflight_private.event_backfill where hour::date = '2026-11-15') <> 14574
     or (select sum(sessions) from overflight_private.event_backfill where hour::date = '2026-11-15') <> 11770 then
    raise exception 'rows: the 2026-11-15 rows are not 14574 searches and 11770 tabs';
  end if;
  -- Both on the Eastern day 2026-11-15, where the admin day totals put them (0016).
  if exists (select 1 from overflight_private.event_backfill
             where hour::date = '2026-11-15' and (hour at time zone 'America/New_York')::date <> '2026-11-15') then
    raise exception 'rows: a row falls on another Eastern day';
  end if;
  -- The earlier rows are untouched.
  if (select sum(searches) from overflight_private.event_backfill where (hour at time zone 'utc')::date = '2026-11-11') <> 1894
     or (select sum(searches) from overflight_private.event_backfill where (hour at time zone 'utc')::date = '2026-11-12') <> 20124 then
    raise exception 'rows: the 2026-11-11 or 2026-11-12 rows changed';
  end if;
  raise notice '0028 checks passed';
end
$$;
