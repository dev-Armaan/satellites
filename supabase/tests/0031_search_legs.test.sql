-- Checks for 0031_search_legs.sql. Run as begin; <0031>; <this file>; rollback.  Nothing survives.
-- Row writes only: one test tab and four results events on an Eastern day in 2001 (read back by event_dist_counts
-- alone), and five all-time value counts of one leg. No rollup runs and no rollup table is emptied. One
-- admin_stats_compute('all') call, which reads what the hourly refresh reads for that range.

do $$
declare
  r text;
  v jsonb;
  legs constant jsonb := '{"t_report": 1400, "t_camera": 410, "t_settle": 840, "t_hero": 250, "e_catalog": 0, "e_passes": 513, "e_archive": 930, "ahead": 1800}';
begin
  foreach r in array array['anon', 'authenticated'] loop
    if has_function_privilege(r, 'overflight_private.event_props(text, jsonb)', 'execute')
       or has_function_privilege(r, 'overflight_private.search_leg_keys()', 'execute')
       or has_function_privilege(r, 'overflight_private.event_dist_counts(timestamptz, timestamptz)', 'execute')
       or has_function_privilege(r, 'overflight_private.admin_stats_compute(text)', 'execute') then
      raise exception 'grants: % can call a private function', r;
    end if;
  end loop;

  -- ── event_props: a results event keeps its legs, and only whole numbers in range ─────────
  v := overflight_private.event_props('results', '{"sats": 272, "photos": 31, "passes": 1504, "ms": 2810, "partial": false, "archive_failed": false}'::jsonb || legs);
  if v is distinct from '{"sats": 272, "photos": 31, "passes": 1504, "ms": 2810, "partial": false, "archive_failed": false}'::jsonb || legs then
    raise exception 'event_props: results with legs came back as %', v;
  end if;
  -- as before without them
  if overflight_private.event_props('results', '{"sats": 3, "photos": 1, "passes": 9, "ms": 2000, "partial": true, "archive_failed": false, "place": "Dubai"}')
     is distinct from '{"sats": 3, "photos": 1, "passes": 9, "ms": 2000, "partial": true, "archive_failed": false}'::jsonb then
    raise exception 'event_props: results without legs changed';
  end if;
  -- out of range, not a number, a fraction, a name it does not know
  v := overflight_private.event_props('results', '{"ms": 100, "t_report": 700000, "t_camera": -1, "t_settle": "840", "t_hero": 250.9, "t_other": 5, "ahead": null}');
  if v is distinct from '{"ms": 100, "t_hero": 250}'::jsonb then raise exception 'event_props: bad legs came back as %', v; end if;
  -- the other events are untouched
  if overflight_private.event_props('search', '{"source": "deep_link", "t_report": 5}') is distinct from '{"source": "deep_link"}'::jsonb then
    raise exception 'event_props: search changed';
  end if;
  if overflight_private.event_props('vitals', '{"lcp": 3700, "inp": 184, "cls": 0.0016, "t_hero": 5}') is distinct from '{"lcp": 3700, "inp": 184, "cls": 0.0016}'::jsonb then
    raise exception 'event_props: vitals changed';
  end if;
  if overflight_private.event_props('support_click', '{"from": "computing"}') is distinct from '{"from": "computing"}'::jsonb then
    raise exception 'event_props: support_click changed';
  end if;
  if overflight_private.event_props('about_open', '{}') is distinct from '{}'::jsonb then raise exception 'event_props: about_open changed'; end if;
  if overflight_private.event_props('made_up', '{}') is not null then raise exception 'event_props: an unknown type was kept'; end if;
end
$$;

-- ── event_dist_counts: the legs in 100 ms steps, capped at 30 s; the old metrics as they were ──
insert into public.event_sessions (sid, first_at, last_at, device) values
  ('test31_sid_aaaaaaaaaaaaaa', '2001-03-04 10:00 America/New_York', '2001-03-04 12:00 America/New_York', 'phone');
insert into public.events (created_at, sid, type, props) values
  ('2001-03-04 10:00 America/New_York', 'test31_sid_aaaaaaaaaaaaaa', 'results', '{"ms": 2814, "partial": false, "archive_failed": false, "t_report": 1449, "t_hero": 251, "ahead": 1800}'),
  ('2001-03-04 10:30 America/New_York', 'test31_sid_aaaaaaaaaaaaaa', 'results', '{"ms": 2816, "partial": false, "archive_failed": false, "t_report": 1380, "t_hero": 45000}'),
  ('2001-03-04 11:00 America/New_York', 'test31_sid_aaaaaaaaaaaaaa', 'results', '{"ms": 3990, "partial": true, "archive_failed": true}'),
  ('2001-03-04 12:00 America/New_York', 'test31_sid_aaaaaaaaaaaaaa', 'vitals', '{"lcp": 3704, "inp": 184, "cls": 0.0016}');

do $$
declare
  got jsonb;
  want constant jsonb := jsonb_build_object(
    'results.ms', jsonb_build_object('2810', 1, '2820', 1, '3990', 1),
    'results.partial', jsonb_build_object('0', 2, '1', 1),
    'results.archive_failed', jsonb_build_object('0', 2, '1', 1),
    'results.t_report', jsonb_build_object('1400', 2),
    'results.t_hero', jsonb_build_object('300', 1, '30000', 1),
    'results.ahead', jsonb_build_object('1800', 1),
    'vitals.lcp', jsonb_build_object('3700', 1),
    'vitals.inp', jsonb_build_object('184', 1),
    'vitals.cls', jsonb_build_object('0.0016', 1));
begin
  select jsonb_object_agg(m.metric, m.vals) into got from (
    select c.metric, jsonb_object_agg(c.v::text, c.n) as vals
    from overflight_private.event_dist_counts('2001-03-04 00:00 America/New_York', '2001-03-05 00:00 America/New_York') c
    where c.day = '2001-03-04' group by c.metric) m;
  if got is distinct from want then raise exception 'event_dist_counts: got %', got; end if;
end
$$;

-- ── admin_stats_compute: results.legs, and everything else it returned before ─────────────
-- Five all-time counts of one leg stand in for a rolled day (the 'all' range reads that table). A leg is new with this
-- migration, so on the day it is applied they are the only ones: 100 ms ×3, 300 ms, 2000 ms.
insert into public.event_alltime_dists as d (metric, v, n) values ('results.t_hero', 100, 3), ('results.t_hero', 300, 1), ('results.t_hero', 2000, 1)
  on conflict (metric, v) do update set n = d.n + excluded.n;

do $$
declare
  s jsonb := overflight_private.admin_stats_compute('all');
  leg jsonb := s -> 'results' -> 'legs' -> 't_hero';
  k text;
begin
  foreach k in array array['top', 'from', 'range', 'bucket', 'funnel', 'series', 'totals', 'vitals', 'results', 'recorded', 'dimTotals', 'generatedAt', 'recentErrors', 'recentSearches'] loop
    if not s ? k then raise exception 'admin_stats_compute: % is gone', k; end if;
  end loop;
  foreach k in array array['n', 'p50Ms', 'p90Ms', 'partial', 'archiveFailed', 'legs'] loop
    if not (s -> 'results') ? k then raise exception 'admin_stats_compute: results.% is missing', k; end if;
  end loop;
  if jsonb_typeof(s -> 'results' -> 'legs') <> 'object' then raise exception 'admin_stats_compute: results.legs is not an object'; end if;
  if leg is null or (leg ->> 'n')::bigint < 5 or (leg ->> 'p50') is null or (leg ->> 'p90') is null then
    raise exception 'admin_stats_compute: results.legs.t_hero is %', leg;
  end if;
  -- With only the five test counts (the day this is applied): median 100, 90th percentile 300 + 0.6 × 1700.
  if (leg ->> 'n')::bigint = 5 and ((leg ->> 'p50')::numeric <> 100 or (leg ->> 'p90')::numeric <> 1320) then
    raise exception 'admin_stats_compute: t_hero percentiles are %', leg;
  end if;
  -- A leg nobody has said is left out, not listed with nulls.
  if (s -> 'results' -> 'legs') ? 'made_up' then raise exception 'admin_stats_compute: an unknown leg is listed'; end if;
  raise notice '0031 checks passed';
end
$$;
