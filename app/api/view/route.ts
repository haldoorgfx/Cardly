import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// POST /api/view — atomically increment view_count for an event.
// Called client-side after sessionStorage dedup, so we get one
// real increment per browser session per event. Bot filtering is
// handled by the presence check + the sessionStorage guard.
export async function POST(req: NextRequest) {
  let eventId: string;
  try {
    const body = await req.json();
    eventId = typeof body.eventId === 'string' ? body.eventId : '';
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  if (!eventId) return NextResponse.json({ error: 'Missing eventId' }, { status: 400 });

  const admin = createAdminClient();
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).rpc('increment_view_count', { p_event_id: eventId });
  } catch {
    // Silently ignore — view count is best-effort, never block the response
  }

  return NextResponse.json({ ok: true });
}
