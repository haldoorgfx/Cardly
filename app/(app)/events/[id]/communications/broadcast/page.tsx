export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Broadcast' };

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import { resolveChannelAvailability } from '@/lib/notifications/channels';
import { resolveAudience, dispatchBroadcast, type AudienceSpec, type DispatchResult } from '@/lib/notifications/broadcast';
import { BroadcastClient } from '@/components/communications/BroadcastClient';
import type { TicketOption } from '@/components/communications/BroadcastClient';

interface Props { params: Promise<{ id: string }> }

async function verifyEventOwner(eventId: string): Promise<boolean> {
  const supa = createClient();
  const { data: { user: caller } } = await supa.auth.getUser();
  if (!caller) return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const { data } = await admin.from('events').select('id').eq('id', eventId).eq('user_id', caller.id).maybeSingle();
  return !!data;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function count(db: any, eventId: string, extra: (q: any) => any): Promise<number> {
  let q = db.from('registrations').select('id', { count: 'exact', head: true }).eq('event_id', eventId);
  q = extra(q);
  const { count: c } = await q;
  return c ?? 0;
}

export default async function BroadcastPage({ params }: Props) {
  const { id: _ref } = await params;
  const _ev = await resolveEventRef(_ref);
  if (!_ev) redirect('/dashboard');
  const id = _ev.id;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;
  const { data: event } = await db.from('events').select('id, name, slug').eq('id', id).eq('user_id', user.id).single();
  if (!event) redirect('/dashboard');

  const [{ data: tts }, { data: conns }, allCount, checkedInCount] = await Promise.all([
    db.from('ticket_types').select('id, name').eq('event_id', id).order('position'),
    db.from('whatsapp_connections').select('id').or(`event_id.eq.${id},and(owner_id.eq.${user.id},event_id.is.null)`).eq('status', 'connected').limit(1),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    count(db, id, (q: any) => q.in('status', ['confirmed', 'checked_in'])),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    count(db, id, (q: any) => q.eq('status', 'checked_in')),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ticketRows = ((tts ?? []) as any[]);
  const ticketOptions: TicketOption[] = [];
  for (const t of ticketRows) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = await count(db, id, (q: any) => q.in('status', ['confirmed', 'checked_in']).eq('ticket_type_id', t.id));
    ticketOptions.push({ id: t.id, name: t.name, count: c });
  }

  const availability = resolveChannelAvailability(((conns ?? []) as unknown[]).length > 0);

  // ── Server action: persist a broadcast + dispatch over working channels ───
  async function sendBroadcast(
    audience: AudienceSpec,
    channels: { email: boolean; inapp: boolean; whatsapp: boolean; sms: boolean },
    body: string,
  ): Promise<{ ok?: boolean; error?: string; results?: DispatchResult; recipientCount?: number }> {
    'use server';
    if (!(await verifyEventOwner(id))) return { error: 'You can no longer manage this event.' };
    const text = String(body ?? '').trim();
    if (!text) return { error: 'Message body is required.' };
    if (text.length > 4096) return { error: 'Message is too long (max 4096 characters).' };
    const kind = audience?.kind;
    if (kind !== 'all' && kind !== 'checked_in' && kind !== 'ticket_type') return { error: 'Pick an audience.' };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any;

    // Server-authoritative channel gating: coerce off any channel not configured.
    const { data: liveConn } = await admin.from('whatsapp_connections').select('id').eq('event_id', id).eq('status', 'connected').limit(1);
    const av = resolveChannelAvailability(((liveConn ?? []) as unknown[]).length > 0);
    const safeChannels = {
      email: !!channels.email && av.email.available,
      inapp: !!channels.inapp && av.inapp.available,
      whatsapp: !!channels.whatsapp && av.whatsapp.available,
      sms: !!channels.sms && av.sms.available,
    };
    if (!safeChannels.email && !safeChannels.inapp && !safeChannels.whatsapp && !safeChannels.sms) {
      return { error: 'No working channel selected. Email and in-app are available.' };
    }

    // Validate ticket type belongs to this event.
    let spec: AudienceSpec = { kind };
    if (kind === 'ticket_type') {
      const ttId = audience.ticketTypeId ?? '';
      const { data: owned } = await admin.from('ticket_types').select('id').eq('id', ttId).eq('event_id', id).maybeSingle();
      if (!owned) return { error: 'That ticket type no longer exists.' };
      spec = { kind, ticketTypeId: ttId };
    }

    const recipients = await resolveAudience(admin, id, spec);
    if (recipients.length === 0) return { error: 'No recipients match this audience.' };

    // Persist the broadcast (status 'sending' → final).
    const { data: bRow, error: insErr } = await admin.from('broadcasts').insert({
      event_id: id, body: text, audience: spec, channels: safeChannels, status: 'sending', created_by: user!.id,
    }).select('id').single();
    if (insErr || !bRow) return { error: insErr?.message ?? 'Could not start the broadcast.' };

    const results = await dispatchBroadcast({
      eventId: id, eventName: event.name, subject: `Update from ${event.name}`, body: text, recipients, channels: safeChannels,
    });

    const sentTotal = results.email.sent + results.inapp.sent + results.whatsapp.sent + results.sms.sent;
    const failedTotal = results.email.failed + results.inapp.failed + results.whatsapp.failed + results.sms.failed;
    const status = sentTotal > 0 ? 'sent' : failedTotal > 0 ? 'failed' : 'sent';
    await admin.from('broadcasts').update({ sent_count: sentTotal, status }).eq('id', bRow.id);

    revalidatePath(`/events/${id}/communications/broadcast`);
    return { ok: true, results, recipientCount: recipients.length };
  }

  return (
    <BroadcastClient
      eventSlug={event.slug}
      ticketOptions={ticketOptions}
      allCount={allCount}
      checkedInCount={checkedInCount}
      availability={availability}
      sendBroadcast={sendBroadcast}
    />
  );
}
