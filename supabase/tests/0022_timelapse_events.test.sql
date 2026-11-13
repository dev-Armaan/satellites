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
  if overflight_private.event_props('timelapse_open', '{"from": "viewer", "place": "Dubai"}') is distinct from '{"from": "viewer"}'::jsonb then
    raise exception 'event_props: timelapse_open is not its from alone';
  end if;
  if overflight_private.event_props('timelapse_open', '{"from": "banner"}') is distinct from '{}'::jsonb then
    raise exception 'event_props: an unknown timelapse_open from was kept';
  end if;
  if overflight_private.event_props('timelapse_share', '{"action": "video", "from": "viewer"}') is distinct from '{"action": "video"}'::jsonb
     or overflight_private.event_props('timelapse_share', '{"action": "link"}') is distinct from '{"action": "link"}'::jsonb then
    raise exception 'event_props: timelapse_share is not its action alone';
  end if;
  if overflight_private.event_props('timelapse_share', '{"action": "gif"}') is not null then
    raise exception 'event_props: a timelapse_share without a known action was kept';
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
