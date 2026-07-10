import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { humanizeError } from '@/lib/errors';
import { upsertEventRole, resolveAccountIdByEmail } from '@/lib/rbac/assign';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data: event } = await admin.from('events').select('id').eq('id', id).eq('user_id', user.id).single();
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: ep } = await admin.from('event_pages').select('ends_at, max_capacity').eq('event_id', id).maybeSingle();
  if (ep?.ends_at && new Date(ep.ends_at) < new Date()) {
    return NextResponse.json({ error: 'This event has already ended — walk-in registration is not available' }, { status: 422 });
  }
  if (ep?.max_capacity) {
    const { count } = await admin.from('registrations').select('id', { count: 'exact', head: true }).eq('event_id', id).in('status', ['confirmed', 'checked_in']);
    if ((count ?? 0) >= ep.max_capacity) {
      return NextResponse.json({ error: 'This event is at full capacity — walk-in cannot be added' }, { status: 409 });
    }
  }

  const body = await req.json() as { name: string; email: string; phone?: string; ticketId?: string; paymentMethod?: string; clientUuid?: string };
  const { name, email, phone, ticketId, paymentMethod, clientUuid } = body;
  if (!name || !email) return NextResponse.json({ error: 'Please enter a name and email.' }, { status: 400 });

  const emailLc = email.toLowerCase().trim();

  // Server-authoritative ticket price. The client's typed "amount received" is
  // never trusted — amount_paid is always the real ticket price from the DB.
  let ticketPrice = 0;
  if (ticketId) {
    const { data: tt } = await admin
      .from('ticket_types')
      .select('price')
      .eq('id', ticketId)
      .eq('event_id', id)
      .maybeSingle();
    ticketPrice = Number(tt?.price ?? 0);
  }

  // Normalise the door-sale method. Only paid tickets carry a payment_method.
  const allowedMethods = ['cash', 'mobile_money', 'card'];
  const method = ticketPrice > 0 && paymentMethod && allowedMethods.includes(paymentMethod)
    ? paymentMethod
    : null;

  // If this email is already registered for the event, check that person in
  // instead of failing on the unique constraint.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (admin as any).from('registrations')
    .select('id, attendee_name, status, qr_code_token, checked_in_at')
    .eq('event_id', id)
    .eq('attendee_email', emailLc)
    .maybeSingle();

  if (existing) {
    if (existing.status === 'checked_in') {
      const at = existing.checked_in_at
        ? new Date(existing.checked_in_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
        : null;
      return NextResponse.json({
        error: `${existing.attendee_name || 'This attendee'} is already checked in${at ? ` (at ${at})` : ''}.`,
      }, { status: 409 });
    }
    // Exists but not yet checked in → check them in now
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updErr } = await (admin as any).from('registrations')
      .update({ status: 'checked_in', checked_in_at: new Date().toISOString(), checked_in_by: user.id })
      .eq('id', existing.id);
    if (updErr) return NextResponse.json({ error: humanizeError(updErr) }, { status: 500 });
    // Roles write-path: checked-in walk-in → 'attendee' role (best-effort, by email).
    {
      const attendeeAccountId = await resolveAccountIdByEmail(emailLc);
      if (attendeeAccountId) await upsertEventRole({ userId: attendeeAccountId, eventId: id, role: 'attendee' });
    }
    return NextResponse.json({
      id: existing.id,
      ticket_number: existing.qr_code_token,
      already_registered: true,
    });
  }

  // ── PAID door sale ──────────────────────────────────────────────────────────
  // Route paid sales through the server-authoritative RPC (075). It sets
  // payment_status='paid', reads the price from ticket_types itself, opens/reuses
  // the cash shift, and is idempotent on client_uuid. NEVER write amount_paid /
  // payment_status / cash_shift_id from here — that was a trust hole.
  if (method) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sessionDb = supabase as any;
    const { data: rpcRes, error: rpcErr } = await sessionDb.rpc('create_walkin_registration', {
      p_event_id: id,
      p_ticket_type_id: ticketId ?? null,
      p_name: name,
      p_email: emailLc,
      p_phone: phone ?? null,
      p_payment_method: method,
      p_client_uuid: clientUuid ?? null,
    });
    if (rpcErr) {
      if (rpcErr.code === 'P0001' && /NOT_AUTHORISED/.test(rpcErr.message ?? '')) {
        return NextResponse.json({ error: 'You can no longer manage this event.' }, { status: 403 });
      }
      return NextResponse.json({ error: humanizeError(rpcErr) }, { status: 500 });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = rpcRes as any;
    if (!r || r.status === 'error') {
      return NextResponse.json({ error: r?.message ?? 'Could not complete the sale.' }, { status: 422 });
    }
    const attendeeAccountId = await resolveAccountIdByEmail(emailLc);
    if (attendeeAccountId) await upsertEventRole({ userId: attendeeAccountId, eventId: id, role: 'attendee' });
    return NextResponse.json({
      id: r.registration_id,
      ticket_number: r.qr_code_token,
      amount_paid: r.amount_paid,
      already_registered: r.status === 'already',
    });
  }

  // ── FREE walk-in ────────────────────────────────────────────────────────────
  // No money involved → payment_status keeps its 'free' default. No RPC needed.
  const qr = Math.random().toString(36).slice(2, 10).toUpperCase();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reg, error } = await (admin as any).from('registrations').insert({
    event_id: id,
    attendee_name: name,
    attendee_email: emailLc,
    attendee_phone: phone ?? null,
    ticket_type_id: ticketId ?? null,
    status: 'checked_in',
    qr_code_token: qr,
    source: 'walk_in',
    checked_in_at: new Date().toISOString(),
  }).select('id').single();

  if (error) return NextResponse.json({ error: humanizeError(error) }, { status: 500 });

  // Roles write-path: new checked-in walk-in → 'attendee' role (best-effort, by email).
  {
    const attendeeAccountId = await resolveAccountIdByEmail(emailLc);
    if (attendeeAccountId) await upsertEventRole({ userId: attendeeAccountId, eventId: id, role: 'attendee' });
  }

  return NextResponse.json({ id: reg.id, ticket_number: qr });
}
