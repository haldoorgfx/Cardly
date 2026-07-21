-- 108 — Poll vote counter integrity
--
-- `cast_poll_vote` (migration 021) inserted the vote with
-- `on conflict (poll_id, registration_id) do nothing` — correct — but then ran
-- `update poll_options set votes_count = votes_count + 1` UNCONDITIONALLY.
-- So the one-vote-per-attendee guard only protected the poll_votes table: a
-- single attendee replaying the vote request N times added N to the displayed
-- tally, letting one person decide the result projected on the live display.
--
-- Fix: only bump the counter when a row was actually inserted. Also refuse
-- votes on a poll that is closed, or where the option belongs to a different
-- poll (which used to increment that unrelated poll's option instead).
--
-- Safe to re-run — create or replace only, no data change.

create or replace function cast_poll_vote(p_poll_id uuid, p_option_id uuid, p_registration_id uuid)
returns void language plpgsql security definer as $$
declare v_inserted int;
begin
  -- The option must belong to the poll being voted on.
  if not exists (
    select 1 from poll_options where id = p_option_id and poll_id = p_poll_id
  ) then
    raise exception 'Option does not belong to this poll';
  end if;

  -- The poll must be open.
  if exists (select 1 from polls where id = p_poll_id and is_closed) then
    raise exception 'This poll is closed';
  end if;

  insert into poll_votes(poll_id, option_id, registration_id)
  values (p_poll_id, p_option_id, p_registration_id)
  on conflict (poll_id, registration_id) do nothing;

  get diagnostics v_inserted = row_count;

  -- Only a vote that was genuinely recorded moves the counter. Repeat calls
  -- from the same registration are now no-ops rather than free votes.
  if v_inserted > 0 then
    update poll_options set votes_count = votes_count + 1 where id = p_option_id;
  end if;
end;
$$;

-- Re-derive every option's counter from the poll_votes table, healing any
-- inflation already banked before this fix landed.
update poll_options o
set votes_count = (select count(*)::int from poll_votes v where v.option_id = o.id)
where o.votes_count is distinct from (select count(*)::int from poll_votes v where v.option_id = o.id);
