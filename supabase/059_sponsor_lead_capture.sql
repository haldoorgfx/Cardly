-- 059_sponsor_lead_capture.sql
-- Backend prerequisite for the mobile Sponsor/Exhibitor "Lead Retrieval" scanner
-- (design_handoff_role_modes: SPO02/SPO03/SPO04/SPO07). The mobile app talks to
-- Supabase directly, so we add:
--   1. sponsor_members.scan_access  — the per-teammate scanner toggle (SPO07)
--   2. capture_lead(...) RPC         — scan a QR → create a sponsor_lead (SPO03)
--   3. an RLS SELECT policy          — sponsors + booth team can read THEIR leads
--
-- Today `sponsor_leads` is readable only by the event owner (migration 023), which
-- is why the current sponsor screen shows an empty list. This closes that gap
-- without touching the web (which reads via the service-role client).
--
-- Apply in the Supabase SQL editor.

-- 1) Per-teammate scan access (SPO07 toggle). Default true so existing members keep working.
alter table sponsor_members add column if not exists scan_access boolean not null default true;

-- 2) Capture a lead by scanning an attendee's QR token.
--    result jsonb: { result: 'success'|'invalid'|'error', lead?, message }
create or replace function public.capture_lead(
  p_sponsor_id uuid,
  p_qr_token   text,
  p_rating     text default null,
  p_note       text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_email   text;
  v_sponsor sponsors%rowtype;
  v_reg     registrations%rowtype;
  v_lead_id uuid;
begin
  if v_uid is null then
    return jsonb_build_object('result','error','message','Not signed in');
  end if;
  if p_rating is not null and p_rating not in ('hot','warm','cold') then
    return jsonb_build_object('result','error','message','Invalid rating');
  end if;

  select * into v_sponsor from sponsors where id = p_sponsor_id;
  if not found then
    return jsonb_build_object('result','error','message','Sponsor not found');
  end if;
  select lower(email) into v_email from profiles where id = v_uid;

  -- Authorised to scan for this sponsor if: the sponsor's contact email is yours,
  -- OR you're a booth-team member with scan access, OR you own the event.
  if not (
       lower(coalesce(v_sponsor.contact_email,'')) = coalesce(v_email,'')
    or exists (select 1 from sponsor_members m
                 where m.sponsor_id = p_sponsor_id and m.user_id = v_uid
                   and coalesce(m.scan_access,true) = true)
    or exists (select 1 from events e
                 where e.id = v_sponsor.event_id and e.user_id = v_uid)
  ) then
    return jsonb_build_object('result','error','message','Not authorised to scan for this booth');
  end if;

  -- Resolve the scanned QR → a registration for this sponsor's event.
  select * into v_reg from registrations
    where qr_code_token = p_qr_token and event_id = v_sponsor.event_id;
  if not found then
    return jsonb_build_object('result','invalid','message','QR not recognised for this event');
  end if;

  insert into sponsor_leads (sponsor_id, event_id, registration_id, attendee_name, attendee_email, rating, note)
  values (p_sponsor_id, v_sponsor.event_id, v_reg.id, v_reg.attendee_name, v_reg.attendee_email, p_rating, p_note)
  returning id into v_lead_id;

  return jsonb_build_object('result','success', 'lead', jsonb_build_object(
    'id', v_lead_id, 'attendee_name', v_reg.attendee_name,
    'attendee_email', v_reg.attendee_email, 'rating', p_rating, 'note', p_note));
end;
$$;

grant execute on function public.capture_lead(uuid, text, text, text) to authenticated;

-- 3) Sponsors + booth team can read their own leads (SPO04 "My Leads").
--    Event owners keep their existing access via the web service-role client.
alter table sponsor_leads enable row level security;

drop policy if exists sponsor_leads_select_own on sponsor_leads;
create policy sponsor_leads_select_own on sponsor_leads
  for select to authenticated
  using (
    exists (
      select 1 from sponsors s
      where s.id = sponsor_leads.sponsor_id
        and (
             lower(coalesce(s.contact_email,'')) = lower(coalesce((select email from profiles where id = auth.uid()),''))
          or exists (select 1 from sponsor_members m
                       where m.sponsor_id = s.id and m.user_id = auth.uid())
          or exists (select 1 from events e
                       where e.id = s.event_id and e.user_id = auth.uid())
        )
    )
  );
