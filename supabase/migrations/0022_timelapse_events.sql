-- 0022: two new events, for the time-lapse (the place's clear Sentinel-2 looks, year by year, played as a loop).
--
--   timelapse_open   { from: 'results' | 'viewer' | 'link' }   the player was opened
--   timelapse_share  { action: 'link' | 'video' }             its link was shared or copied, or its video saved
--
-- event_props drops an event whose type it does not know (it answers null), so until this is applied the client's
-- two events are simply not recorded; nothing else is affected. They need no rollup of their own: the hourly and
-- daily rollups count every type (the admin page's totals), and neither is a funnel stage or has a breakdown.
--   select type, coalesce(props ->> 'from', props ->> 'action'), count(*) from events where type like 'timelapse%' group by 1, 2;   -- (last 48 h)
--
-- event_props as in 0013, with the two types added; nothing else changes. No data is rewritten.

create or replace function overflight_private.event_props(p_type text, p jsonb)
returns jsonb
language plpgsql immutable
set search_path = public
as $$
declare
  verdicts constant text[] := array['imaged', 'likely', 'could', 'overhead'];
  coll_re  constant text := '^[a-z0-9-]{1,40}$';
  share_from constant text[] := array['headline', 'hero', 'viewer', 'pass'];
  v jsonb;
begin
  if p is null or jsonb_typeof(p) <> 'object' then p := '{}'::jsonb; end if;
  case p_type
    when 'view' then
      v := jsonb_build_object('entry', overflight_private.jenum(p, 'entry', array['landing', 'deep_link', 'share_link']));
    when 'search' then
      v := jsonb_build_object(
        'source',  overflight_private.jenum(p, 'source', array['search', 'example', 'surprise', 'near_me', 'pin', 'deep_link', 'share_link', 'retry']),
        'label',   overflight_private.clean_label(p ->> 'label'),
        'cell',    overflight_private.clean_cell(p ->> 'cell'),
        'country', overflight_private.jmatch(p, 'country', '^[a-z]{2}$', 2));
    when 'results', 'results_final' then
      v := jsonb_build_object(
        'sats',           overflight_private.jint(p, 'sats', 0, 100000),
        'photos',         overflight_private.jint(p, 'photos', 0, 100000),
        'passes',         overflight_private.jint(p, 'passes', 0, 1000000),
        'ms',             overflight_private.jint(p, 'ms', 0, 600000),
        'partial',        overflight_private.jbool(p, 'partial'),
        'archive_failed', overflight_private.jbool(p, 'archive_failed'));
    when 'pass_open', 'lightbox_open', 'share_open', 'share_action' then
      v := jsonb_build_object(
        'norad',      overflight_private.jint(p, 'norad', 1, 999999),
        'sat',        overflight_private.clean_masked(p ->> 'sat', 60),
        'verdict',    overflight_private.jenum(p, 'verdict', verdicts),
        'collection', overflight_private.jmatch(p, 'collection', coll_re, 40));
      if p_type = 'share_open' then
        v := v || jsonb_build_object(
          'kind', overflight_private.jenum(p, 'kind', array['pass', 'summary']),
          'from', overflight_private.jenum(p, 'from', share_from));
      elsif p_type = 'share_action' then
        v := v || jsonb_build_object(
          'action', overflight_private.jenum(p, 'action', array['x', 'copy_link', 'copy_image', 'save_png', 'native']),
          'from',   overflight_private.jenum(p, 'from', share_from));
        if v ->> 'action' is null then return null; end if;
      end if;
    when 'about_open' then
      v := '{}'::jsonb;
    when 'timelapse_open' then
      v := jsonb_build_object('from', overflight_private.jenum(p, 'from', array['results', 'viewer', 'link']));
    when 'timelapse_share' then
      v := jsonb_build_object('action', overflight_private.jenum(p, 'action', array['link', 'video']));
      if v ->> 'action' is null then return null; end if;
    when 'error' then
      v := jsonb_build_object(
        'where', overflight_private.jenum(p, 'where', array['phase', 'window', 'promise']),
        'msg',   overflight_private.clean_msg(p ->> 'msg'));
      if v ->> 'msg' is null then return null; end if;
    when 'vitals' then
      v := jsonb_build_object(
        'lcp', overflight_private.jint(p, 'lcp', 0, 120000),
        'fcp', overflight_private.jint(p, 'fcp', 0, 120000),
        'inp', overflight_private.jint(p, 'inp', 0, 60000),
        'cls', round(overflight_private.num_in(p, 'cls', 0, 100), 4));
    else
      return null;
  end case;
  return jsonb_strip_nulls(v);
end
$$;

revoke all on function overflight_private.event_props(text, jsonb) from public, anon, authenticated;
