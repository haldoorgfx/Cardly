import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: { answers?: unknown; name?: string; email?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { answers, name, email } = body;
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  if (!email?.trim()) return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;

  const { data: event } = await db.from('events').select('id').eq('id', id).single();
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

  // Event-ended guard
  const { data: ep } = await db.from('event_pages').select('ends_at, max_capacity').eq('event_id', id).maybeSingle();
  if (ep?.ends_at && new Date(ep.ends_at) < new Date()) {
    return NextResponse.json({ error: 'Applications are closed — this event has already ended' }, { status: 422 });
  }

  // Capacity check
  if (ep?.max_capacity) {
    const { count: confirmed } = await db.from('registrations').select('id', { count: 'exact', head: true }).eq('event_id', id).in('status', ['confirmed', 'checked_in']);
    if ((confirmed ?? 0) >= ep.max_capacity) {
      return NextResponse.json({ error: 'This event is at full capacity — applications are no longer accepted' }, { status: 409 });
    }
  }

  const { data, error } = await db.from('registrations').insert({
    event_id: id,
    attendee_name: name.trim(),
    attendee_email: email.trim().toLowerCase(),
    attendee_data: { answers },
    status: 'pending_approval',
    source: 'application_form',
  }).select('id').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
