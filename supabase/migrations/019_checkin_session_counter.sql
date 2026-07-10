-- Idempotent helper: increment check_in_sessions.check_ins_count for today's session
-- Called best-effort from the check-in API.
create or replace function increment_checkin_session_count(p_event_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- Upsert today's session for this event
  insert into check_in_sessions (event_id, operator_id, check_ins_count)
  values (p_event_id, auth.uid(), 1)
  on conflict do nothing;

  -- Increment the most recent session for this event started today
  update check_in_sessions
  set check_ins_count = check_ins_count + 1
  where id = (
    select id from check_in_sessions
    where event_id = p_event_id
      and started_at::date = current_date
    order by started_at desc
    limit 1
  );
end;
$$;
