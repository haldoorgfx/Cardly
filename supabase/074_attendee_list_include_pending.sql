-- 074_attendee_list_include_pending.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Fix undercounting in the mobile Organize side.
--
-- WHY: list_event_attendees (070) filtered `status in ('confirmed','checked_in')`,
-- so pending + approval-waiting registrants were invisible. Verified live: an
-- event with 14 real registrations returned 11; an approval-gated event with 3
-- pending returned 0 ("No one has registered yet"). The Attendees tab, the Stats
-- "Registered" number, and the per-event card counts were all wrong, and there
-- was no way to see (let alone approve) people awaiting approval.
--
-- FIX: include pending + pending_approval, and expose a `status` column so the
-- app can distinguish them (and later build an approve/deny action). Cancelled
-- and refunded stay excluded. Access rules unchanged (owner or active staff).
-- Safe + idempotent. Paste into the Supabase SQL editor and run once.
-- ─────────────────────────────────────────────────────────────────────────────

-- Return signature changes (adds `status`), so drop before recreate.
drop function if exists public.list_event_attendees(uuid);

create function public.list_event_attendees(p_event_id uuid)
returns table (
  id            uuid,
  attendee_name text,
  ticket        text,
  status        text,
  checked_in    boolean,
  checked_in_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select r.id,
         r.attendee_name,
         (select t.name from ticket_types t where t.id = r.ticket_type_id),
         r.status,
         (r.status = 'checked_in'),
         r.checked_in_at
  from registrations r
  where r.event_id = p_event_id
    and r.status in ('confirmed', 'checked_in', 'pending', 'pending_approval')
    and exists (
      select 1 from events e
      where e.id = p_event_id
        and (
          e.user_id = auth.uid()
          or exists (
            select 1 from user_event_roles uer
            where uer.event_id = p_event_id
              and uer.user_id = auth.uid()
              and uer.role in ('staff', 'organizer')
              and uer.status = 'active'
          )
        )
    )
  order by r.attendee_name;
$$;

grant execute on function public.list_event_attendees(uuid) to authenticated;
