-- Fix the "Generak" ticket-type typo (seen on Pan-African Youth Forum 2026).
-- Data fix, not a schema migration. Run in the Supabase SQL editor.

-- 1) Review the affected row(s) first:
select id, event_id, name
from ticket_types
where name ilike 'generak';

-- 2) Apply the fix (change the target to 'General' if you prefer that):
update ticket_types
set name = 'General Admission'
where name ilike 'generak';
