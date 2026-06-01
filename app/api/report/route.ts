import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// In-memory rate limit: 3 reports per IP per 10 minutes
const rlMap = new Map<string, { count: number; resetAt: number }>();
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rlMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rlMap.set(ip, { count: 1, resetAt: now + 10 * 60_000 });
    return false;
  }
  if (entry.count >= 3) return true;
  entry.count++;
  return false;
}

// POST /api/report — flag an event for admin review.
// Public endpoint — no auth required (attendees are not logged in).
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many reports. Try again later.' }, { status: 429 });
  }

  let eventId: string;
  try {
    const body = await req.json();
    eventId = typeof body.eventId === 'string' ? body.eventId.trim() : '';
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  if (!eventId) return NextResponse.json({ error: 'eventId is required' }, { status: 400 });

  const admin = createAdminClient();

  // Verify the event exists and is published before flagging
  const { data: event } = await admin
    .from('events')
    .select('id, moderation_status')
    .eq('id', eventId)
    .eq('status', 'published')
    .single();

  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

  // Only flag if not already under stronger action
  if (event.moderation_status !== 'removed') {
    await admin
      .from('events')
      .update({ moderation_status: 'flagged' })
      .eq('id', eventId);
  }

  return NextResponse.json({ ok: true });
}
