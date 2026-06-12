import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { z } from 'zod';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data: event } = await admin.from('events').select('id').eq('id', params.id).eq('user_id', user.id).single();
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

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
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any)
    .from('registrations')
    .select('id, attendee_name, attendee_email, attendee_phone, status, checked_in_at, qr_code_token, amount_paid, currency, ticket_types(name, price)')
    .eq('event_id', params.id)
    .in('status', ['pending', 'confirmed', 'checked_in'])
    .or(`attendee_name.ilike.%${q}%,attendee_email.ilike.%${q}%,attendee_phone.ilike.%${q}%,qr_code_token.ilike.${q}%`)
    .order('attendee_name', { ascending: true })
    .limit(20);

  return NextResponse.json({ results: data ?? [] });
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
  const admin = createAdminClient();

  const { data: event } = await admin
    .from('events').select('id, name')
    .eq('id', params.id).eq('user_id', user.id).single();
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
    .select('id, attendee_name, attendee_email, attendee_phone, status, checked_in_at, karta_card_url, amount_paid, currency, ticket_types(name)')
    .eq('qr_code_token', qr_code_token)
    .eq('event_id', params.id)
    .single();

  if (!reg) {
    return NextResponse.json({ result: 'invalid', message: 'QR code not recognised — no registration found' });
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
    return NextResponse.json({
      result: 'invalid',
      message: `Registration is ${reg.status} — entry not allowed`,
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
    karta_card_url: reg.karta_card_url,
  });
}
