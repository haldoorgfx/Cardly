import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { assertOwnsRegistration } from '@/lib/attendee-identity';
import { z } from 'zod';

const GetSchema = z.object({ registration_id: z.string().uuid(), event_id: z.string().uuid() });
const CreateSchema = z.object({ event_id: z.string().uuid(), sender_id: z.string().uuid(), recipient_id: z.string().uuid(), content: z.string().min(1) });

// GET /api/threads?registration_id=X&event_id=Y
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const parsed = GetSchema.safeParse({ registration_id: searchParams.get('registration_id'), event_id: searchParams.get('event_id') });
  if (!parsed.success) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

  const { registration_id, event_id } = parsed.data;

  // Identity: the caller must own the registration whose threads they're reading.
  const identity = await assertOwnsRegistration(event_id, registration_id);
  if (!identity.ok) return NextResponse.json({ error: identity.error }, { status: identity.status });

  const admin = createAdminClient();

  const { data: threads, error } = await admin
    .from('message_threads')
    .select('*, messages(id, content, sender_id, created_at)')
    .eq('event_id', event_id)
    .or(`participant_a.eq.${registration_id},participant_b.eq.${registration_id}`)
    .order('last_message_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enrich with other participant's name
  const otherIds = (threads ?? []).map(t =>
    t.participant_a === registration_id ? t.participant_b : t.participant_a
  );
  const { data: regs } = await admin
    .from('registrations')
    .select('id, attendee_name')
    .in('id', otherIds.length ? otherIds : ['00000000-0000-0000-0000-000000000000']);

  const nameMap = new Map((regs ?? []).map(r => [r.id, r.attendee_name]));
  const enriched = (threads ?? []).map(t => ({
    ...t,
    other_participant_id: t.participant_a === registration_id ? t.participant_b : t.participant_a,
    other_participant_name: nameMap.get(t.participant_a === registration_id ? t.participant_b : t.participant_a) ?? 'Attendee',
    last_message: Array.isArray(t.messages) && t.messages.length ? t.messages[t.messages.length - 1] : null,
    unread_count: Array.isArray(t.messages)
      ? t.messages.filter((m: { sender_id: string; read_at: string | null }) => m.sender_id !== registration_id && !m.read_at).length
      : 0,
  }));

  return NextResponse.json({ threads: enriched });
}

// POST — create/get thread + send first message
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const { event_id, sender_id, recipient_id, content } = parsed.data;

  // Identity: the caller must own the sender registration they're posting as.
  const identity = await assertOwnsRegistration(event_id, sender_id);
  if (!identity.ok) return NextResponse.json({ error: identity.error }, { status: identity.status });

  const admin = createAdminClient();

  // Normalise participant order (lower UUID first) for unique constraint
  const [pA, pB] = [sender_id, recipient_id].sort();

  let { data: thread } = await admin
    .from('message_threads')
    .select('id')
    .eq('participant_a', pA)
    .eq('participant_b', pB)
    .single();

  if (!thread) {
    const { data: created, error } = await admin
      .from('message_threads')
      .insert({ event_id, participant_a: pA, participant_b: pB })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    thread = created;
  }

  const { data: message, error: msgErr } = await admin
    .from('messages')
    .insert({ thread_id: thread!.id, sender_id, content })
    .select()
    .single();

  if (msgErr) return NextResponse.json({ error: msgErr.message }, { status: 500 });

  await admin.from('message_threads').update({ last_message_at: new Date().toISOString() }).eq('id', thread!.id);

  return NextResponse.json({ thread_id: thread!.id, message }, { status: 201 });
}
