-- Atomic view count increment — replaces the read-modify-write in the page.
-- Using an RPC avoids the race condition where two concurrent page loads
-- both read the same value and both write n+1 instead of n+2.
create or replace function increment_view_count(p_event_id uuid)
returns void language sql security definer as $$
  update events
  set view_count = view_count + 1
  where id = p_event_id and status = 'published';
$$;
