import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';

const SessionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  session_type: z.enum(['talk', 'keynote', 'workshop', 'panel', 'fireside', 'lightning', 'break']).default('talk'),
  track_id: z.string().uuid().nullable().optional(),
  starts_at: z.string().min(1, 'Start time is required'),
  ends_at: z.string().min(1, 'End time is required'),
  room: z.string().optional(),
  capacity: z.number().int().positive('Capacity must be at least 1').nullable().optional(),
  is_published: z.boolean().default(true),
  speaker_ids: z.array(z.string().uuid()).optional(),
});

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function validateSessionTimes(
  startsAt: string,
  endsAt: string,
  ep: { starts_at: string; ends_at: string } | null
): string | null {
  const start = new Date(startsAt);
  const end = new Date(endsAt);

  if (isNaN(start.getTime())) return 'Start time is invalid';
  if (isNaN(end.getTime())) return 'End time is invalid';
  if (start >= end) return 'Session start must be before session end';

  if (ep) {
    const evStart = new Date(ep.starts_at);
    const evEnd = new Date(ep.ends_at);

    if (start < evStart) {
      return `Session cannot start before the event begins (${fmtDate(ep.starts_at)})`;
    }
    if (end > evEnd) {
      return `Session cannot end after the event ends (${fmtDate(ep.ends_at)})`;
    }
    if (start > evEnd) {
      return `Session start (${fmtDate(startsAt)}) is after the event has ended (${fmtDate(ep.ends_at)})`;
    }
  }

  return null;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = createAdminClient();
  const { searchParams } = new URL(req.url);
  const published = searchParams.get('published');

  let query = admin
    .from('sessions')
    .select('*, tracks(id, name, color), session_speakers(speaker_id, position, speakers(id, name, photo_url, role, company))')
    .eq('event_id', params.id)
    .order('starts_at', { ascending: true });

  if (published === 'true') query = query.eq('is_published', true);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sessions: data });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = SessionSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
      ?? parsed.error.flatten().formErrors[0]
      ?? 'Invalid session data';
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const admin = createAdminClient();
  const [{ data: event }, { data: ep }] = await Promise.all([
    admin.from('events').select('id').eq('id', params.id).eq('user_id', user.id).single(),
    admin.from('event_pages').select('starts_at, ends_at').eq('event_id', params.id).maybeSingle(),
  ]);
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

  const timeError = validateSessionTimes(parsed.data.starts_at, parsed.data.ends_at, ep ?? null);
  if (timeError) return NextResponse.json({ error: timeError }, { status: 422 });

  const { speaker_ids, ...sessionData } = parsed.data;

  const { data: session, error: dbError } = await admin
    .from('sessions')
    .insert({ event_id: params.id, ...sessionData })
    .select()
    .single();
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  if (speaker_ids?.length) {
    await admin.from('session_speakers').insert(
      speaker_ids.map((sid, i) => ({ session_id: session.id, speaker_id: sid, position: i }))
    );
  }

  return NextResponse.json({ session }, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { sessionId, speaker_ids, ...updates } = await req.json();
  if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 });

  const admin = createAdminClient();

  // Fetch current session + event page for full-context validation
  const [{ data: current }, { data: ep }] = await Promise.all([
    admin.from('sessions').select('starts_at, ends_at').eq('id', sessionId).eq('event_id', params.id).single(),
    admin.from('event_pages').select('starts_at, ends_at').eq('event_id', params.id).maybeSingle(),
  ]);

  // Merge current with updates for validation
  const startsAt: string = updates.starts_at ?? current?.starts_at;
  const endsAt: string = updates.ends_at ?? current?.ends_at;

  if (startsAt && endsAt) {
    const timeError = validateSessionTimes(startsAt, endsAt, ep ?? null);
    if (timeError) return NextResponse.json({ error: timeError }, { status: 422 });
  }

  if (updates.capacity !== undefined && updates.capacity !== null && updates.capacity < 1) {
    return NextResponse.json({ error: 'Capacity must be at least 1' }, { status: 422 });
  }

  const { data: session, error: dbError } = await admin
    .from('sessions')
    .update(updates)
    .eq('id', sessionId)
    .eq('event_id', params.id)
    .select()
    .single();
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  if (Array.isArray(speaker_ids)) {
    await admin.from('session_speakers').delete().eq('session_id', sessionId);
    if (speaker_ids.length) {
      await admin.from('session_speakers').insert(
        speaker_ids.map((sid: string, i: number) => ({ session_id: sessionId, speaker_id: sid, position: i }))
      );
    }
  }

  return NextResponse.json({ session });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');
  if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin
    .from('sessions').delete().eq('id', sessionId).eq('event_id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
