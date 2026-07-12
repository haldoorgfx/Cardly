-- 068_speaker_qa_moderation.sql
-- Lets an assigned speaker (or event owner / active staff) mark a Q&A question
-- answered / featured / hidden from mobile. Direct writes are blocked by RLS
-- (050); this SECURITY DEFINER function derives authority from auth.uid() and
-- the question's own session — no ids are trusted from the client.
create or replace function public.speaker_set_qa_status(
  p_question_id uuid,
  p_status      text default null,     -- 'pending' | 'answered' | 'hidden'
  p_is_featured boolean default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  v_email text;
  v_q     qa_questions%rowtype;
  v_owner uuid;
  v_ok    boolean := false;
begin
  if v_uid is null then return jsonb_build_object('result','error','message','Not signed in'); end if;
  select * into v_q from qa_questions where id = p_question_id;
  if not found then return jsonb_build_object('result','error','message','Question not found'); end if;

  select user_id into v_owner from events where id = v_q.event_id;
  if v_owner = v_uid then v_ok := true; end if;

  if not v_ok and exists (
    select 1 from user_event_roles
     where event_id = v_q.event_id and user_id = v_uid
       and role in ('staff','organizer') and status = 'active') then
    v_ok := true;
  end if;

  if not v_ok and v_q.session_id is not null then
    select lower(email) into v_email from profiles where id = v_uid;
    if exists (
      select 1 from session_speakers ss
        join speakers s on s.id = ss.speaker_id
       where ss.session_id = v_q.session_id
         and ( lower(coalesce(s.email,'')) = coalesce(v_email,'')
            or exists (select 1 from user_event_roles uer
                        where uer.event_id = v_q.event_id and uer.user_id = v_uid
                          and uer.role = 'speaker' and uer.status = 'active')))
    then v_ok := true; end if;
  end if;

  if not v_ok then return jsonb_build_object('result','error','message','Not authorised'); end if;
  if p_status is not null and p_status not in ('pending','answered','hidden')
    then return jsonb_build_object('result','error','message','Invalid status'); end if;

  update qa_questions set
    status      = coalesce(p_status, status),
    is_featured = coalesce(p_is_featured, is_featured)
  where id = p_question_id;

  return jsonb_build_object('result','success');
end;
$$;
grant execute on function public.speaker_set_qa_status(uuid,text,boolean) to authenticated;
