import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { sendNewMessageEmail } from '@/lib/email';

const SendSchema = z.object({
  sender_id: z.string().uuid(),
  recipient_id: z.string().uuid(),
  content: z.string().min(1).max(2000),
});

const ReadSchema = z.object({
  thread_id: z.string().uuid(),
  registration_id: z.string().uuid(),
});

// GET /api/events/[id]/messages?registration_id=xxx[&thread_id=xxx]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const registrationId = searchParams.get('registration_id');
  const threadId = searchParams.get('thread_id');

  if (!registrationId) {
    return NextResponse.json({ error: 'registration_id required' }, { status: 400 });
  }

  const admin = createAdminClient();

  if (threadId) {
    // Verify the requestor is a participant
    const { data: thread, error: threadErr } = await admin
      .from('message_threads')
      .select('id, participant_a, participant_b')
      .eq('id', threadId)
      .eq('event_id', params.id)
      .single();

    if (threadErr || !thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    const isParticipant =
      thread.participant_a === registrationId || thread.participant_b === registrationId;
    if (!isParticipant) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: msgs, error } = await admin
      .from('messages')
      .select('id, sender_id, content, read_at, created_at')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Mark unread messages from the other side as read
    await admin
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('thread_id', threadId)
      .neq('sender_id', registrationId)
      .is('read_at', null);

    return NextResponse.json({ messages: msgs });
  }

  // Fetch all threads for this registration
  const { data: threads, error } = await admin
    .from('message_threads')
    .select('id, participant_a, participant_b, last_message_at')
    .eq('event_id', params.id)
    .or(`participant_a.eq.${registrationId},participant_b.eq.${registrationId}`)
    .order('last_message_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!threads || threads.length === 0) {
    return NextResponse.json({ threads: [] });
  }

  // Collect partner IDs and load names
  const partnerIds = threads.map(t =>
    t.participant_a === registrationId ? t.participant_b : t.participant_a
  );
  const uniqueIds = Array.from(new Set(partnerIds));

  const { data: regs } = await admin
    .from('registrations')
    .select('id, attendee_name')
    .in('id', uniqueIds.length ? uniqueIds : ['00000000-0000-0000-0000-000000000000']);

  const nameMap = new Map((regs ?? []).map(r => [r.id, r.attendee_name]));

  // Load latest message per thread
  const threadIds = threads.map(t => t.id);
  const { data: latestMsgs } = await admin
    .from('messages')
    .select('thread_id, sender_id, content, created_at')
    .in('thread_id', threadIds)
    .order('created_at', { ascending: false });

  const latestByThread = new Map<string, { sender_id: string; content: string; created_at: string }>();
  for (const m of latestMsgs ?? []) {
    if (!latestByThread.has(m.thread_id)) {
      latestByThread.set(m.thread_id, { sender_id: m.sender_id, content: m.content, created_at: m.created_at });
    }
  }

  const enriched = threads.map(t => {
    const partnerId = t.participant_a === registrationId ? t.participant_b : t.participant_a;
    return {
      thread_id: t.id,
      partner_id: partnerId,
      partner_name: nameMap.get(partnerId) ?? 'Attendee',
      last_message_at: t.last_message_at,
      latest_message: latestByThread.get(t.id) ?? null,
    };
  });

  return NextResponse.json({ threads: enriched });
}

// POST /api/events/[id]/messages — send a message
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  const parsed = SendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { sender_id, recipient_id, content } = parsed.data;
  const admin = createAdminClient();

  // Canonical thread order: lower UUID first (prevents duplicate threads)
  const [a, b] = [sender_id, recipient_id].sort() as [string, string];

  const { data: thread, error: threadErr } = await admin
    .from('message_threads')
    .upsert(
      { event_id: params.id, participant_a: a, participant_b: b },
      { onConflict: 'participant_a,participant_b' }
    )
    .select()
    .single();

  if (threadErr || !thread) {
    return NextResponse.json({ error: threadErr?.message ?? 'Thread error' }, { status: 500 });
  }

  const { data: message, error: msgErr } = await admin
    .from('messages')
    .insert({ thread_id: thread.id, sender_id, content })
    .select()
    .single();

  if (msgErr) return NextResponse.json({ error: msgErr.message }, { status: 500 });

  // Update thread timestamp
  await admin
    .from('message_threads')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', thread.id);

  // Award leaderboard point once per thread (first message only)
  const { count } = await admin
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('thread_id', thread.id);

  const isFirstMessage = (count ?? 0) <= 1;

  if (isFirstMessage) {
    await admin.from('leaderboard_points').insert({
      event_id: params.id,
      registration_id: sender_id,
      action_type: 'message_sent',
      points: 5,
      ref_id: thread.id,
    });

    // Fire-and-forget: notify recipient on the first message in a new thread
    (async () => {
      const [{ data: event }, { data: regs }] = await Promise.all([
        admin.from('events').select('name, slug').eq('id', params.id).single(),
        admin
          .from('registrations')
          .select('id, attendee_name, attendee_email')
          .in('id', [sender_id, recipient_id]),
      ]);
      if (!event || !regs) return;
      const sender = regs.find(r => r.id === sender_id);
      const recipient = regs.find(r => r.id === recipient_id);
      if (!sender || !recipient) return;
      await sendNewMessageEmail({
        to: recipient.attendee_email,
        recipientName: recipient.attendee_name,
        senderName: sender.attendee_name,
        eventName: event.name,
        eventSlug: event.slug,
        registrationId: recipient_id,
        preview: content,
      });
    })().catch(() => {});
  }

  return NextResponse.json({ message, thread_id: thread.id }, { status: 201 });
}

// PATCH — mark all messages in a thread as read
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = ReadSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const { thread_id, registration_id } = parsed.data;
  const admin = createAdminClient();

  await admin
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('thread_id', thread_id)
    .neq('sender_id', registration_id)
    .is('read_at', null);

  return NextResponse.json({ ok: true });
}
