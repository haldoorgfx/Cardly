import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';

const SessionSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  session_type: z.enum(['talk', 'keynote', 'workshop', 'panel', 'fireside', 'lightning', 'break']).default('talk'),
  track_id: z.string().uuid().nullable().optional(),
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime(),
  room: z.string().optional(),
  capacity: z.number().int().positive().nullable().optional(),
  is_published: z.boolean().default(true),
  speaker_ids: z.array(z.string().uuid()).optional(),
});

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
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const admin = createAdminClient();
  const { data: event } = await admin.from('events').select('id').eq('id', params.id).eq('user_id', user.id).single();
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { speaker_ids, ...sessionData } = parsed.data;

  const { data: session, error } = await admin
    .from('sessions')
    .insert({ event_id: params.id, ...sessionData })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

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
  const { data: session, error } = await admin
    .from('sessions')
    .update(updates)
    .eq('id', sessionId)
    .eq('event_id', params.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Re-sync speakers if provided
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
  const { error } = await admin.from('sessions').delete().eq('id', sessionId).eq('event_id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
