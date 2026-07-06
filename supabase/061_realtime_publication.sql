-- 061_realtime_publication.sql
-- Enable Supabase realtime for the live mobile screens (the brief's ≤1s requirement).
-- Nothing streams until a table is in the `supabase_realtime` publication — no table
-- currently is (even the existing notifications screen's realtime is a silent no-op).
-- REPLICA IDENTITY FULL is required so realtime can evaluate eq-filters on non-PK
-- columns (sponsor_id / session_id / event_id) for UPDATE/DELETE events.
-- Apply in the Supabase SQL editor. Safe to re-run.

do $$
begin
  -- sponsor_leads: My Leads live-updates when a booth teammate captures a lead.
  begin execute 'alter publication supabase_realtime add table public.sponsor_leads'; exception when duplicate_object then null; end;
  -- qa_questions: Speaker Q&A live-updates on new questions + upvote changes.
  begin execute 'alter publication supabase_realtime add table public.qa_questions'; exception when duplicate_object then null; end;
  -- registrations: organizer live check-in count as people are scanned in.
  begin execute 'alter publication supabase_realtime add table public.registrations'; exception when duplicate_object then null; end;
  -- notifications: retroactively enable (existing screen expected this).
  begin execute 'alter publication supabase_realtime add table public.notifications'; exception when duplicate_object then null; end;
end $$;

alter table public.sponsor_leads replica identity full;
alter table public.qa_questions  replica identity full;
alter table public.registrations replica identity full;
