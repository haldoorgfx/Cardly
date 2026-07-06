-- 063_speaker_profile_update.sql
-- Lets a speaker edit their OWN profile subset from mobile (direct table updates are
-- blocked by RLS; the web uses the admin client). SECURITY DEFINER, ownership-checked.
-- Apply in the Supabase SQL editor.

create or replace function public.update_speaker_profile(
  p_speaker_id   uuid,
  p_headline     text default null,
  p_bio          text default null,
  p_company      text default null,
  p_linkedin_url text default null,
  p_twitter_url  text default null,
  p_website_url  text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_email text;
  v_sp    speakers%rowtype;
begin
  if v_uid is null then return jsonb_build_object('result','error','message','Not signed in'); end if;
  select * into v_sp from speakers where id = p_speaker_id;
  if not found then return jsonb_build_object('result','error','message','Speaker not found'); end if;
  select lower(email) into v_email from profiles where id = v_uid;
  if not (
       lower(coalesce(v_sp.email,'')) = coalesce(v_email,'')
    or exists (select 1 from user_event_roles
                 where event_id = v_sp.event_id and user_id = v_uid
                   and role = 'speaker' and status = 'active')
  ) then
    return jsonb_build_object('result','error','message','Not your profile');
  end if;

  update speakers set
    headline     = coalesce(p_headline, headline),
    bio          = coalesce(p_bio, bio),
    company      = coalesce(p_company, company),
    linkedin_url = coalesce(p_linkedin_url, linkedin_url),
    twitter_url  = coalesce(p_twitter_url, twitter_url),
    website_url  = coalesce(p_website_url, website_url)
  where id = p_speaker_id;

  return jsonb_build_object('result','success');
end;
$$;

grant execute on function public.update_speaker_profile(uuid,text,text,text,text,text,text) to authenticated;
