import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { hasCheckInAccess } from '@/lib/rbac/ownership';
import { orIlikeAcross, ilikePrefixCondition } from '@/lib/search/filter';
import { z } from 'zod';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await hasCheckInAccess(user.id, params.id))) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const admin = createAdminClient();

  // ?feed=1 → live feed + stats (used for auto-refresh)
  if (req.nextUrl.searchParams.get('feed') === '1') {
    const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString();

    const [feedResult, totalResult, perHourResult] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (admin as any)
        .from('registrations')
        .select('id, attendee_name, checked_in_at, ticket_types(name)')
        .eq('event_id', params.id)
        .eq('status', 'checked_in')
        .order('checked_in_at', { ascending: false })
        .limit(15),
      admin.from('registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', params.id)
        .eq('status', 'checked_in'),
      admin.from('registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', params.id)
        .eq('status', 'checked_in')
        .gte('checked_in_at', oneHourAgo),
    ]);

    return NextResponse.json({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      feed: (feedResult.data ?? []).map((r: any) => ({
        id: r.id,
        attendee_name: r.attendee_name,
        ticket_type: r.ticket_types?.name ?? null,
        checked_in_at: r.checked_in_at,
      })),
      totalCheckedIn: totalResult.count ?? 0,
      perHour: perHourResult.count ?? 0,
    });
  }

  // ?q= → search by name, email, phone, or badge-ID prefix (first chars of qr_code_token)
  //
  // ?kiosk=1 narrows the same search for the UNATTENDED lobby kiosk, where the
  // screen is read by whoever is standing in front of it rather than by staff:
  // a longer minimum query, fewer rows, and no raw contact details in the
  // response. Without it, two typed characters returned twenty attendees'
  // names, emails and phone numbers to any passer-by — a guest list scraped
  // one letter at a time.
  const kiosk = req.nextUrl.searchParams.get('kiosk') === '1';
  const minLength = kiosk ? 3 : 2;

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < minLength) return NextResponse.json({ results: [] });

  // Escaping via the shared helpers: `%` and `_` are ILIKE wildcards, so an
  // email like `a_b@x.com` typed literally used to match `aXb@x.com` too, and
  // `,` `.` `(` `)` are the .or() grammar itself.
  const filter = [
    orIlikeAcross(['attendee_name', 'attendee_email', 'attendee_phone'], q),
    ilikePrefixCondition('qr_code_token', q),
  ].filter(Boolean).join(',');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any)
    .from('registrations')
    .select('id, attendee_name, attendee_email, attendee_phone, status, checked_in_at, qr_code_token, amount_paid, currency, ticket_types(name, price)')
    .eq('event_id', params.id)
    .in('status', ['pending', 'confirmed', 'checked_in'])
    .or(filter)
    .order('attendee_name', { ascending: true })
    .limit(kiosk ? 6 : 20);

  if (kiosk) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const masked = ((data ?? []) as any[]).map((r) => ({
      id: r.id,
      attendee_name: r.attendee_name,
      // Enough to tell two same-named guests apart, not enough to harvest.
      attendee_email: maskEmail(r.attendee_email),
      status: r.status,
      qr_code_token: r.qr_code_token,
      ticket_types: r.ticket_types ? { name: r.ticket_types.name } : null,
    }));
    return NextResponse.json({ results: masked });
  }

  return NextResponse.json({ results: data ?? [] });
}

/** `abdalla@gmail.com` → `ab•••@gmail.com`. Null-safe. */
function maskEmail(email: string | null): string | null {
  if (!email) return null;
  const at = email.indexOf('@');
  if (at < 1) return '•••';
  const local = email.slice(0, at);
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}•••${email.slice(at)}`;
}

const BodySchema = z.object({
  qr_code_token: z.string().min(1),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const { qr_code_token } = parsed.data;
  if (!(await hasCheckInAccess(user.id, params.id))) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

  const admin = createAdminClient();

  const { data: event } = await admin
    .from('events').select('id, name')
    .eq('id', params.id).single();
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

  const { data: epDate } = await admin.from('event_pages').select('starts_at, ends_at').eq('event_id', params.id).maybeSingle();
  if (epDate) {
    const now = Date.now();
    const OPEN_BEFORE_MS  = 4  * 60 * 60 * 1000; // 4 hours before start
    const CLOSE_AFTER_MS  = 24 * 60 * 60 * 1000; // 24 hours after end
    if (epDate.starts_at && now < new Date(epDate.starts_at).getTime() - OPEN_BEFORE_MS) {
      const opensAt = new Date(new Date(epDate.starts_at).getTime() - OPEN_BEFORE_MS);
      return NextResponse.json({ result: 'invalid', message: `Check-in has not opened yet. It opens at ${opensAt.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} (4 hours before the event starts)` });
    }
    if (epDate.ends_at && now > new Date(epDate.ends_at).getTime() + CLOSE_AFTER_MS) {
      return NextResponse.json({ result: 'invalid', message: `Check-in has closed. The event ended on ${new Date(epDate.ends_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reg } = await (admin as any)
    .from('registrations')
    .select('id, attendee_name, attendee_email, attendee_phone, status, payment_status, checked_in_at, eventera_card_url, amount_paid, currency, ticket_types(name)')
    .eq('qr_code_token', qr_code_token)
    .eq('event_id', params.id)
    .single();

  if (!reg) {
    // The lookup above is scoped to THIS event, so a real ticket for a
    // different event lands here looking exactly like a forgery. Organizers
    // running two events in one venue on one day hit this constantly, and
    // "not recognised" sends a legitimate guest away instead of upstairs.
    // Only ever names the other event — no attendee data crosses events.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: elsewhere } = await (admin as any)
      .from('registrations')
      .select('events(name)')
      .eq('qr_code_token', qr_code_token)
      .maybeSingle();

    if (elsewhere) {
      const otherName = elsewhere.events?.name ?? 'another event';
      return NextResponse.json({
        result: 'invalid',
        code: 'wrong_event',
        message: `This ticket is for ${otherName}, not ${event.name}`,
      });
    }

    return NextResponse.json({ result: 'invalid', code: 'not_found', message: 'QR code not recognised — no registration found' });
  }

  if (reg.status === 'checked_in') {
    return NextResponse.json({
      result: 'already_checked_in',
      message: 'Already checked in',
      attendee_name: reg.attendee_name,
      attendee_email: reg.attendee_email,
      ticket_type: reg.ticket_types?.name ?? null,
      checked_in_at: reg.checked_in_at,
    });
  }

  if (reg.status === 'cancelled' || reg.status === 'refunded') {
    // Carry the name + a machine-readable code: at the door, staff need to know
    // WHO is standing in front of them and WHY they were stopped. A bare
    // "invalid" reads identically to an unrecognised QR and is unactionable.
    return NextResponse.json({
      result: 'invalid',
      code: reg.status === 'refunded' ? 'refunded' : 'cancelled',
      attendee_name: reg.attendee_name,
      ticket_type: reg.ticket_types?.name ?? null,
      message: `Registration is ${reg.status} — entry not allowed`,
    });
  }

  // Block check-in for paid tickets that haven't been paid. A ticket is "paid"
  // when amount_paid > 0; free tickets (amount_paid = 0 / payment_status 'free')
  // and successfully paid tickets ('paid') are unaffected.
  if ((reg.payment_status === 'pending' || reg.payment_status === 'failed') && Number(reg.amount_paid) > 0) {
    return NextResponse.json({
      result: 'invalid',
      code: 'payment_required',
      attendee_name: reg.attendee_name,
      ticket_type: reg.ticket_types?.name ?? null,
      message: 'Payment not completed for this ticket',
    });
  }

  const checkedInAt = new Date().toISOString();
  const { data: updated, error } = await admin
    .from('registrations')
    .update({ status: 'checked_in', checked_in_at: checkedInAt, checked_in_by: user.id })
    .eq('id', reg.id)
    .neq('status', 'checked_in') // idempotent: skip if a concurrent request already checked in
    .select('id')
    .maybeSingle();

  // Race lost — another request already checked this person in
  if (!error && !updated) {
    return NextResponse.json({
      result: 'already_checked_in',
      message: 'Already checked in',
      attendee_name: reg.attendee_name,
      attendee_email: reg.attendee_email,
      ticket_type: reg.ticket_types?.name ?? null,
      checked_in_at: reg.checked_in_at,
    });
  }

  if (error) return NextResponse.json({ error: 'Failed to check in' }, { status: 500 });

  // Best-effort session counter
  await admin.rpc('increment_checkin_session_count', { p_event_id: params.id }).maybeSingle();

  return NextResponse.json({
    result: 'success',
    message: 'Checked in successfully',
    attendee_name: reg.attendee_name,
    attendee_email: reg.attendee_email,
    attendee_phone: reg.attendee_phone,
    ticket_type: reg.ticket_types?.name ?? null,
    amount_paid: reg.amount_paid,
    currency: reg.currency,
    checked_in_at: checkedInAt,
    eventera_card_url: reg.eventera_card_url,
  });
}
