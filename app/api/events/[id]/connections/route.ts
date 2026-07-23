import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { assertOwnsRegistration } from '@/lib/attendee-identity';
import { getEventOwnerPlan } from '@/lib/billing/can';
import { isPlatformFeatureEnabled } from '@/lib/features/platform';
import { z } from 'zod';
import {
  sendConnectionRequestEmail,
  sendConnectionAcceptedEmail,
} from '@/lib/email';

const PLAN_RANK: Record<string, number> = { free: 0, pro: 1, studio: 2 };

const RequestSchema = z.object({
  requester_id: z.string().uuid(),
  recipient_id: z.string().uuid(),
  qr_code_token: z.string().optional(),
});

const RespondSchema = z.object({
  connection_id: z.string().uuid(),
  action: z.enum(['accept', 'decline']),
  registration_id: z.string().uuid(),
  qr_code_token: z.string().optional(),
});

// GET /api/events/[id]/connections?reg=<registration_id>
// Returns a shuffled deck of confirmed / checked-in attendees for speed
// networking: excludes the caller and anyone they've already sent a request to
// (or connected with). Directory opt-outs are respected.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isPlatformFeatureEnabled('networking'))) return NextResponse.json({ error: 'Networking is currently unavailable.' }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const regId = searchParams.get('reg');
  const token = searchParams.get('token');

  // This returns every confirmed/checked-in attendee's name + registration id
  // for the event — require the caller to hold a valid registration first,
  // same identity check POST/PATCH already use, instead of handing that list
  // to anyone who calls the route with no `reg` at all.
  const identity = await assertOwnsRegistration(params.id, regId, token);
  if (!identity.ok) {
    return NextResponse.json({ error: identity.error }, { status: identity.status });
  }

  const admin = createAdminClient();

  const { data: people, error } = await admin
    .from('registrations')
    .select('id, user_id, attendee_name, eventera_card_url')
    .eq('event_id', params.id)
    .in('status', ['confirmed', 'checked_in'])
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (people ?? []) as any[];

  // Respect directory opt-outs (profiles.directory_visible === false).
  const userIds = Array.from(
    new Set(rows.map(p => p.user_id).filter((u: string | null): u is string => !!u)),
  );
  const hiddenUserIds = new Set<string>();
  if (userIds.length) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profs } = await (admin as any)
      .from('profiles')
      .select('id, directory_visible')
      .in('id', userIds);
    for (const pr of profs ?? []) {
      if (pr.directory_visible === false) hiddenUserIds.add(pr.id as string);
    }
  }

  // Skip anyone the caller already has a connection row with (any direction).
  const alreadyConnected = new Set<string>();
  if (regId) {
    const { data: conns } = await admin
      .from('attendee_connections')
      .select('requester_id, recipient_id')
      .eq('event_id', params.id)
      .or(`requester_id.eq.${regId},recipient_id.eq.${regId}`);
    for (const c of conns ?? []) {
      alreadyConnected.add(c.requester_id === regId ? c.recipient_id : c.requester_id);
    }
  }

  const deck = rows
    .filter(p => p.id !== regId)
    .filter(p => !(p.user_id && hiddenUserIds.has(p.user_id)))
    .filter(p => !alreadyConnected.has(p.id))
    .map(p => ({
      id: p.id,
      attendee_name: p.attendee_name,
      eventera_card_url: p.eventera_card_url ?? null,
    }));

  // Fisher–Yates shuffle for an unbiased deck order.
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return NextResponse.json({ people: deck });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isPlatformFeatureEnabled('networking'))) return NextResponse.json({ error: 'Networking is currently unavailable.' }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const { requester_id, recipient_id, qr_code_token } = parsed.data;

  // Identity: the requester must be the caller's own registration (guests allowed).
  const identity = await assertOwnsRegistration(params.id, requester_id, qr_code_token);
  if (!identity.ok) {
    return NextResponse.json({ error: identity.error }, { status: identity.status });
  }

  // Networking (connections) is a Pro-plan feature (see app/(app)/events/[id]/page.tsx
  // ACTION_CARDS minPlan and UpgradeSlideOver) — enforce server-side using the EVENT
  // OWNER's plan, since the caller here is an attendee, not the organizer.
  const ownerPlan = await getEventOwnerPlan(params.id);
  if (!ownerPlan || PLAN_RANK[ownerPlan] < PLAN_RANK.pro) {
    return NextResponse.json({ error: 'Networking requires the organizer to be on the Pro plan.' }, { status: 402 });
  }

  const admin = createAdminClient();

  // recipient_id was unchecked — any registration UUID was accepted, so a
  // request (and its email) could be aimed at someone attending a different
  // event entirely. Connections are event-scoped; pin the recipient here.
  const { data: recipientReg } = await admin
    .from('registrations')
    .select('id')
    .eq('id', recipient_id)
    .eq('event_id', params.id)
    .in('status', ['confirmed', 'checked_in'])
    .maybeSingle();
  if (!recipientReg) {
    return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
  }

  // Was this pair already linked? The old code upserted `status: 'pending'`
  // unconditionally, which had two consequences worth naming:
  //
  //  1. DECLINE MEANT NOTHING. A row the recipient had declined flipped
  //     straight back to 'pending' the moment the requester pressed Connect
  //     again — and there is no block feature to fall back on, so "no" was
  //     un-enforceable.
  //  2. EVERY repeat press re-fired sendConnectionRequestEmail at the
  //     recipient. One connection row, unlimited emails into a real person's
  //     inbox, with nothing left behind for an organizer to notice.
  //
  // So: resolve the existing row first and return it untouched. Only a
  // genuinely new link inserts, scores, and emails.
  const { data: priorLink } = await admin
    .from('attendee_connections')
    .select('id, event_id, requester_id, recipient_id, status, created_at, updated_at')
    .eq('requester_id', requester_id)
    .eq('recipient_id', recipient_id)
    .maybeSingle();

  if (priorLink) {
    // Idempotent for pending/accepted; a hard stop for declined. Either way the
    // recipient's inbox stays quiet and their answer stands.
    return NextResponse.json({ connection: priorLink }, { status: 200 });
  }

  const { data, error } = await admin
    .from('attendee_connections')
    .insert({ event_id: params.id, requester_id, recipient_id, status: 'pending' })
    .select()
    .single();

  if (error) {
    // Lost a race with a concurrent identical request — the unique constraint on
    // (requester_id, recipient_id) held. Return the winner rather than 500, and
    // still send no second email.
    if (error.code === '23505') {
      const { data: existing } = await admin
        .from('attendee_connections')
        .select('id, event_id, requester_id, recipient_id, status, created_at, updated_at')
        .eq('requester_id', requester_id)
        .eq('recipient_id', recipient_id)
        .maybeSingle();
      if (existing) return NextResponse.json({ connection: existing }, { status: 200 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Award once per connection. ref_id ties the award to the row so the unique
  // index in migration 113 can reject a duplicate even under a race.
  await admin.from('leaderboard_points').insert({
    event_id: params.id,
    registration_id: requester_id,
    action_type: 'connection_made',
    points: 10,
    ref_id: data.id,
  });

  // Fire-and-forget: notify recipient of connection request
  (async () => {
    const [{ data: event }, { data: regs }] = await Promise.all([
      admin.from('events').select('name, slug').eq('id', params.id).single(),
      admin
        .from('registrations')
        .select('id, attendee_name, attendee_email, qr_code_token')
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
      qrCodeToken: recipient.qr_code_token,
    });
  })().catch(() => {});

  return NextResponse.json({ connection: data }, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isPlatformFeatureEnabled('networking'))) return NextResponse.json({ error: 'Networking is currently unavailable.' }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = RespondSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const { connection_id, action, registration_id, qr_code_token } = parsed.data;

  // Identity: the responder must be the caller's own registration (guests allowed).
  const identity = await assertOwnsRegistration(params.id, registration_id, qr_code_token);
  if (!identity.ok) {
    return NextResponse.json({ error: identity.error }, { status: identity.status });
  }

  const admin = createAdminClient();

  const newStatus = action === 'accept' ? 'accepted' : 'declined';
  // The ownership precondition lives in the WHERE clause, not in a read-then-
  // write: only the RECIPIENT of this connection may answer it, and only within
  // this event. A non-match updates nothing rather than racing.
  const { data, error } = await admin
    .from('attendee_connections')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', connection_id)
    .eq('event_id', params.id)
    .eq('recipient_id', registration_id)
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // Previously .single() turned "that isn't your request to answer" into a 500.
  // It refused correctly, but reported it as our bug rather than their 404.
  if (!data) {
    return NextResponse.json({ error: 'Connection request not found' }, { status: 404 });
  }

  // Fire-and-forget: notify the original requester when accepted
  if (action === 'accept' && data) {
    (async () => {
      const [{ data: event }, { data: regs }] = await Promise.all([
        admin.from('events').select('name, slug').eq('id', params.id).single(),
        admin
          .from('registrations')
          .select('id, attendee_name, attendee_email, qr_code_token')
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
        qrCodeToken: requester.qr_code_token,
      });
    })().catch(() => {});
  }

  return NextResponse.json({ connection: data });
}
