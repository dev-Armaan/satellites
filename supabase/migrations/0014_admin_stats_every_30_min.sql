-- 0014: the admin stats are refreshed every 30 minutes, not every 5.
--
-- refresh_admin_stats() (0009) reads every raw event: at ~490,000 events it took 37 s to 1.5 min a run on the free
-- plan's smallest machine, every 5 minutes, and on 2026-11-11 from 13:15 UTC its runs stopped finishing and the
-- database stopped answering anything (the admin page, sign-in, shares, events) until the project was restarted.
-- Run twice an hour instead, at :07 and :37 (clear of watched-events-maintain at :17). The admin page's numbers can
-- be up to 30 minutes old. cron.schedule upserts the job by name: nothing else changes.
select cron.schedule('watched-admin-stats', '7,37 * * * *', 'select overflight_private.refresh_admin_stats()');
