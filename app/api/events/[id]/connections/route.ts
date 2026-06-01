import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';
import {
  sendConnectionRequestEmail,
  sendConnectionAcceptedEmail,
} from '@/lib/email';

const RequestSchema = z.object({
  requester_id: z.string().uuid(),
  recipient_id: z.string().uuid(),
});

const RespondSchema = z.object({
  connection_id: z.string().uuid(),
  action: z.enum(['accept', 'decline']),
  registration_id: z.string().uuid(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const { requester_id, recipient_id } = parsed.data;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('attendee_connections')
    .upsert(
      { event_id: params.id, requester_id, recipient_id, status: 'pending' },
      { onConflict: 'requester_id,recipient_id' }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Award leaderboard point for initiating connection
  await admin.from('leaderboard_points').insert({
    event_id: params.id,
    registration_id: requester_id,
    action_type: 'connection_made',
    points: 10,
  });

  // Fire-and-forget: notify recipient of connection request
  (async () => {
    const [{ data: event }, { data: regs }] = await Promise.all([
      admin.from('events').select('name, slug').eq('id', params.id).single(),
      admin
        .from('registrations')
        .select('id, attendee_name, attendee_email')
        .in('id', [requester_id, recipient_id]),
    ]);
    if (!event || !regs) return;
    const requester = regs.find(r => r.id === requester_id);
    const recipient = regs.find(r => r.id === recipient_id);
    if (!requester || !recipient) return;
    await sendConnectionRequestEmail({
      to: recipient.attendee_email,
      recipientName: recipient.attendee_name,
      requesterName: requester.attendee_name,
      eventName: event.name,
      eventSlug: event.slug,
      registrationId: recipient_id,
    });
  })().catch(() => {});

  return NextResponse.json({ connection: data }, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  const parsed = RespondSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const { connection_id, action, registration_id } = parsed.data;
  const admin = createAdminClient();

  const newStatus = action === 'accept' ? 'accepted' : 'declined';
  const { data, error } = await admin
    .from('attendee_connections')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', connection_id)
    .eq('recipient_id', registration_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fire-and-forget: notify the original requester when accepted
  if (action === 'accept' && data) {
    (async () => {
      const [{ data: event }, { data: regs }] = await Promise.all([
        admin.from('events').select('name, slug').eq('id', params.id).single(),
        admin
          .from('registrations')
          .select('id, attendee_name, attendee_email')
          .in('id', [data.requester_id, data.recipient_id]),
      ]);
      if (!event || !regs) return;
      const requester = regs.find(r => r.id === data.requester_id);
      const acceptor = regs.find(r => r.id === data.recipient_id);
      if (!requester || !acceptor) return;
      await sendConnectionAcceptedEmail({
        to: requester.attendee_email,
        requesterName: requester.attendee_name,
        acceptorName: acceptor.attendee_name,
        eventName: event.name,
        eventSlug: event.slug,
        registrationId: data.requester_id,
      });
    })().catch(() => {});
  }

  return NextResponse.json({ connection: data });
}
