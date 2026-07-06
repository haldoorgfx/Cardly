-- 062_staff_attendee_list.sql
-- Staff "limited view": event owner OR an active staff member (user_event_roles)
-- can read the attendee list — name / ticket / check-in status ONLY. Revenue and
-- email are intentionally excluded so the limited view is enforced server-side,
-- not just hidden in the UI. Apply in the Supabase SQL editor.

create or replace function public.list_event_attendees(p_event_id uuid)
returns table (
  id            uuid,
  attendee_name text,
  ticket        text,
  checked_in    boolean,
  checked_in_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_owner uuid;
begin
  if v_uid is null then return; end if;
  select user_id into v_owner from events where id = p_event_id;
  if v_owner is null then return; end if;
  -- Owner, OR an active staff member for this event.
  if v_owner <> v_uid and not exists (
    select 1 from user_event_roles
    where event_id = p_event_id and user_id = v_uid
      and role in ('staff','organizer') and status = 'active'
  ) then
    return;  -- not authorised → empty set
  end if;

  return query
    select r.id,
           r.attendee_name,
           (select t.name from ticket_types t where t.id = r.ticket_type_id),
           (r.status = 'checked_in'),
           r.checked_in_at
    from registrations r
    where r.event_id = p_event_id
      and r.status in ('confirmed', 'checked_in')
    order by r.attendee_name;
end;
$$;

grant execute on function public.list_event_attendees(uuid) to authenticated;
