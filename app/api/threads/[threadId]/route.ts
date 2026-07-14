import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { assertOwnsRegistration } from '@/lib/attendee-identity';
import { z } from 'zod';

// Load the thread and verify the caller owns a registration that is one of its
// two participants. Without this the route was an open door: anyone could read
// any thread's messages by guessing a thread_id, or inject a message spoofing
// any sender_id. Mirrors the gate on /api/events/[id]/messages.
async function authorizeThread(threadId: string, registrationId: string) {
  const admin = createAdminClient();
  const { data: thread } = await admin
    .from('message_threads')
    .select('id, event_id, participant_a, participant_b')
    .eq('id', threadId)
    .maybeSingle();
  if (!thread) return { ok: false as const, status: 404, error: 'Thread not found' };

  const identity = await assertOwnsRegistration(thread.event_id, registrationId);
  if (!identity.ok) return { ok: false as const, status: identity.status, error: identity.error };

  if (thread.participant_a !== registrationId && thread.participant_b !== registrationId) {
    return { ok: false as const, status: 403, error: 'Forbidden' };
  }
  return { ok: true as const, thread, admin };
}

// GET /api/threads/[threadId]?registration_id=xxx
export async function GET(req: NextRequest, { params }: { params: { threadId: string } }) {
  const registrationId = new URL(req.url).searchParams.get('registration_id');
  if (!registrationId) {
    return NextResponse.json({ error: 'registration_id required' }, { status: 400 });
  }

  const auth = await authorizeThread(params.threadId, registrationId);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data, error } = await auth.admin
    .from('messages')
    .select('id, sender_id, content, read_at, created_at')
    .eq('thread_id', params.threadId)
    .order('created_at', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ messages: data });
}

const PostSchema = z.object({
  sender_id: z.string().uuid(),
  content: z.string().min(1).max(2000),
});

// POST /api/threads/[threadId] — the sender must own the registration AND be a
// participant of this thread; sender_id is verified, never trusted blindly.
export async function POST(req: NextRequest, { params }: { params: { threadId: string } }) {
  const parsed = PostSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'sender_id and content required' }, { status: 400 });
  }
  const { sender_id, content } = parsed.data;

  const auth = await authorizeThread(params.threadId, sender_id);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data, error } = await auth.admin
    .from('messages')
    .insert({ thread_id: params.threadId, sender_id, content })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await auth.admin
    .from('message_threads')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', params.threadId);

  return NextResponse.json({ message: data }, { status: 201 });
}
