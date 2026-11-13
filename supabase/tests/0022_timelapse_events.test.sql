-- Checks for 0022_timelapse_events.sql. Run as begin; <0022>; <this file>; rollback.  Nothing survives.
-- Pure function calls only: no rows are written and no DDL touches an existing table.

do $$
declare r text;
begin
  foreach r in array array['anon', 'authenticated'] loop
    if has_function_privilege(r, 'overflight_private.event_props(text, jsonb)', 'execute') then
      raise exception 'grants: % can call event_props', r;
    end if;
  end loop;
  if overflight_private.event_props('timelapse_open', '{"mode": "years", "from": "viewer"}') is distinct from '{"mode": "years", "from": "viewer"}'::jsonb then
    raise exception 'event_props: timelapse_open not kept';
  end if;
  if overflight_private.event_props('timelapse_open', '{"mode": "seasons", "from": "link", "place": "Dubai"}') is distinct from '{"mode": "seasons", "from": "link"}'::jsonb then
    raise exception 'event_props: timelapse_open kept a key it does not list';
  end if;
  if overflight_private.event_props('timelapse_open', '{"mode": "decade", "from": "banner"}') is distinct from '{}'::jsonb then
    raise exception 'event_props: unknown timelapse_open values were kept';
  end if;
  if overflight_private.event_props('timelapse_share', '{"mode": "years", "from": "viewer"}') is distinct from '{"mode": "years"}'::jsonb then
    raise exception 'event_props: timelapse_share is not its mode alone';
  end if;
  -- the events 0013 knew are untouched
  if overflight_private.event_props('share_open', '{"kind": "summary", "from": "headline"}') is distinct from '{"kind": "summary", "from": "headline"}'::jsonb then
    raise exception 'event_props: share_open changed';
  end if;
  if overflight_private.event_props('search', '{"source": "surprise"}') ->> 'source' is distinct from 'surprise' then raise exception 'event_props: search changed'; end if;
  if overflight_private.event_props('about_open', '{}') is distinct from '{}'::jsonb then raise exception 'event_props: about_open changed'; end if;
  if overflight_private.event_props('made_up', '{}') is not null then raise exception 'event_props: an unknown type was kept'; end if;
  raise notice '0022 checks passed';
end
$$;
