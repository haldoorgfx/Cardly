-- 077_lead_consent.sql
-- GDPR: store the attendee's consent captured at lead scan time.
-- The mobile lead scanner now requires a consent tick and passes it through;
-- this adds the columns + a consent-aware capture_lead signature. The `default
-- false` keeps the existing 4-arg call valid, and the client tries this 5-arg
-- signature first, so applying this "just works" with no app change.

alter table sponsor_leads
  add column if not exists consent    boolean not null default false,
  add column if not exists consent_at timestamptz;

-- Recreate capture_lead with an extra consent arg. Body mirrors 059 but the
-- INSERT records consent. Authority stays bound to auth.uid() via the sponsor
-- ownership check; the attendee is resolved from the scanned QR token, never a
-- client-supplied id.
create or replace function public.capture_lead(
  p_sponsor_id uuid,
  p_qr_token   text,
  p_rating     text default null,
  p_note       text default null,
  p_consent    boolean default false
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_uid     uuid := auth.uid();
  v_sponsor sponsors%rowtype;
  v_reg     registrations%rowtype;
  v_lead_id uuid;
begin
  if v_uid is null then
    return jsonb_build_object('result','error','message','Not signed in');
  end if;

  select * into v_sponsor from sponsors where id = p_sponsor_id;
  if not found then
    return jsonb_build_object('result','error','message','Booth not found');
  end if;

  -- Caller must own the event or be a booth member for this sponsor.
  if not exists (select 1 from events e where e.id = v_sponsor.event_id and e.user_id = v_uid)
     and not exists (
       select 1 from sponsor_members sm
        join profiles p on lower(p.email) = lower(sm.contact_email)
       where sm.sponsor_id = p_sponsor_id and p.id = v_uid)
  then
    return jsonb_build_object('result','error','message','Not authorised for this booth');
  end if;

  select * into v_reg from registrations
   where event_id = v_sponsor.event_id and qr_code_token = p_qr_token;
  if not found then
    return jsonb_build_object('result','error','message','Ticket not found for this event');
  end if;

  insert into sponsor_leads
    (sponsor_id, event_id, registration_id, attendee_name, attendee_email,
     rating, note, consent, consent_at)
  values
    (p_sponsor_id, v_sponsor.event_id, v_reg.id, v_reg.attendee_name,
     v_reg.attendee_email, p_rating, p_note,
     coalesce(p_consent, false), case when p_consent then now() end)
  on conflict (sponsor_id, registration_id) do update
    set rating = excluded.rating, note = excluded.note,
        consent = excluded.consent, consent_at = excluded.consent_at
  returning id into v_lead_id;

  return jsonb_build_object('result','success','lead_id', v_lead_id);
end;
$$;
grant execute on function public.capture_lead(uuid, text, text, text, boolean) to authenticated;
