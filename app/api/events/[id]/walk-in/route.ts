import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { humanizeError } from '@/lib/errors';
import { upsertEventRole, resolveAccountIdByEmail } from '@/lib/rbac/assign';
import { hasCheckInAccess } from '@/lib/rbac/ownership';
import { canRegisterForEvent } from '@/lib/billing/can';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await hasCheckInAccess(user.id, id))) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const admin = createAdminClient();

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

  const body = await req.json() as {
    name: string; email: string; phone?: string; ticketId?: string;
    payment?: 'card' | 'cash'; clientUuid?: string;
  };
  const { name, email, phone, ticketId, payment, clientUuid } = body;
  if (!name || !email) return NextResponse.json({ error: 'Please enter a name and email.' }, { status: 400 });

  const emailLc = email.toLowerCase().trim();

  // If this email is already registered for the event, check that person in
  // instead of failing on the unique constraint.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (admin as any).from('registrations')
    .select('id, attendee_name, status, payment_status, amount_paid, qr_code_token, checked_in_at')
    .eq('event_id', id)
    .eq('attendee_email', emailLc)
    .maybeSingle();

  if (existing) {
    // Same door policy the scanner and /api/v1/checkin enforce. Without these,
    // the walk-in desk was a clean bypass: a refunded attendee types the email
    // they already used, the "exists but not checked in" branch below flips
    // them straight to checked_in, and they walk in on a ticket they were
    // refunded for — no payment taken, no warning shown to staff.
    if (existing.status === 'cancelled' || existing.status === 'refunded') {
      return NextResponse.json({
        error: `${existing.attendee_name || 'This attendee'} has a ${existing.status} registration for this event. Reinstate it from the Registrations tab before checking them in.`,
      }, { status: 409 });
    }
    if (
      (existing.payment_status === 'pending' || existing.payment_status === 'failed') &&
      Number(existing.amount_paid) > 0
    ) {
      return NextResponse.json({
        error: `${existing.attendee_name || 'This attendee'} has an unpaid ticket. Take payment and mark it paid before checking them in.`,
      }, { status: 409 });
    }
    if (existing.status === 'checked_in') {
      const at = existing.checked_in_at
        ? new Date(existing.checked_in_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
        : null;
      return NextResponse.json({
        error: `${existing.attendee_name || 'This attendee'} is already checked in${at ? ` (at ${at})` : ''}.`,
      }, { status: 409 });
    }
    // Exists but not yet checked in → check them in now.
    // Guarded transition (same idiom as /api/events/[id]/checkin): the status we
    // read is part of the WHERE, so a concurrent scan at the main door can't be
    // silently overwritten by the walk-in desk a moment later.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updErr } = await (admin as any).from('registrations')
      .update({ status: 'checked_in', checked_in_at: new Date().toISOString(), checked_in_by: user.id })
      .eq('id', existing.id)
      .neq('status', 'checked_in');
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

  // Free-tier plan cap (CLAUDE.md: Free = 1 event, 50 registrations) — only
  // applies here, not to the check-in-an-existing-registration branch above.
  if (!(await canRegisterForEvent(id))) {
    return NextResponse.json({
      error: 'This event has reached the registration limit for the organizer\'s current plan.',
    }, { status: 409 });
  }

  // New registration, with a selected ticket type: go through
  // create_walkin_registration (migration 090) so the price is looked up
  // server-side (the client never supplies an amount), the sale is linked to
  // the seller's cash shift, and a repeated/double-tapped submit is
  // idempotent on clientUuid instead of charging twice. This RPC runs under
  // the caller's own session (not the service-role client) since it reads
  // auth.uid() internally.
  if (ticketId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rpcResult, error: rpcError } = await (supabase as any).rpc('create_walkin_registration', {
      p_event_id: id,
      p_ticket_type_id: ticketId,
      p_name: name,
      p_email: emailLc,
      p_phone: phone ?? null,
      p_payment_method: payment === 'card' ? 'card' : 'cash',
      p_client_uuid: clientUuid ?? null,
    });

    if (rpcError) return NextResponse.json({ error: humanizeError(rpcError) }, { status: 500 });
    const result = rpcResult as {
      status: 'ok' | 'already' | 'error';
      message?: string;
      registration_id?: string;
      qr_code_token?: string;
    };
    if (result.status === 'error') {
      return NextResponse.json({ error: result.message ?? 'Registration failed' }, { status: 409 });
    }

    // Roles write-path: new checked-in walk-in → 'attendee' role (best-effort, by email).
    {
      const attendeeAccountId = await resolveAccountIdByEmail(emailLc);
      if (attendeeAccountId) await upsertEventRole({ userId: attendeeAccountId, eventId: id, role: 'attendee' });
    }

    return NextResponse.json({ id: result.registration_id, ticket_number: result.qr_code_token });
  }

  // No ticket type selected (shouldn't happen from the walk-in UI, which
  // requires picking one before payment) — fall back to a free general entry.
  // Matches how qr_code_token is minted everywhere else (crypto.randomUUID,
  // hyphens stripped) and the table's own default, encode(gen_random_bytes(16)).
  //
  // Was `Math.random().toString(36).slice(2, 10).toUpperCase()`: eight base-36
  // characters from a NON-cryptographic PRNG. This token is a bearer credential
  // — it is the ticket, it addresses the registration through `?reg=` links and
  // /api/qr/[token], and it reaches an attendee's own record. Math.random is
  // seeded predictably and was never meant to stand up to guessing, and ~41 bits
  // would be thin even if it were. Everything else on this table already used
  // 122+ bits; this one path did not.
  const qr = crypto.randomUUID().replace(/-/g, '');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reg, error } = await (admin as any).from('registrations').insert({
    event_id: id,
    attendee_name: name,
    attendee_email: emailLc,
    attendee_phone: phone ?? null,
    ticket_type_id: null,
    status: 'checked_in',
    qr_code_token: qr,
    amount_paid: 0,
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
