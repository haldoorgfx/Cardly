-- 113 — Stop the same action being scored twice on the leaderboard
--
-- WHY: leaderboard_points had no uniqueness of any kind. Every award path was
-- a check-then-insert in application code, which is a race: two requests that
-- both pass the check both insert. On a leaderboard that gets projected on a
-- screen at the venue, that is a visible, public wrong answer.
--
-- The application fixes (connections award only on a genuinely new link, Q&A
-- caps scored questions per event) close the ordinary cases. This closes the
-- concurrent one, and makes a future award path that forgets to dedup fail
-- loudly instead of silently inflating someone's score.
--
-- Partial, because ref_id is nullable: rows with no reference (legacy
-- connection awards written before ref_id was populated, and any future action
-- that genuinely has no target) are left alone rather than being collapsed
-- into one another.
--
-- NOTE: existing duplicate rows are NOT removed — this only prevents new ones.
-- To see what is already double-counted before deciding whether to clean up:
--
--   select registration_id, action_type, ref_id, count(*)
--   from public.leaderboard_points
--   where ref_id is not null
--   group by 1,2,3 having count(*) > 1
--   order by count(*) desc;
--
-- If that returns rows, the index below will FAIL to create until they are
-- resolved. Deduplicate with:
--
--   delete from public.leaderboard_points p using public.leaderboard_points q
--   where p.ctid > q.ctid
--     and p.registration_id = q.registration_id
--     and p.action_type     = q.action_type
--     and p.ref_id          = q.ref_id
--     and p.ref_id is not null;

create unique index if not exists leaderboard_points_action_ref_uniq
  on public.leaderboard_points (registration_id, action_type, ref_id)
  where ref_id is not null;
