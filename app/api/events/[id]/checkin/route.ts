import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Search registrations by name or email for manual check-in
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  const admin = createAdminClient();

  // Verify event ownership
  const { data: event } = await admin.from('events').select('id').eq('id', params.id).eq('user_id', user.id).single();
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data } = await admin
    .from('registrations')
    .select('id, attendee_name, attendee_email, status, checked_in_at, qr_code_token')
    .eq('event_id', params.id)
    .in('status', ['confirmed', 'checked_in'])
    .or(`attendee_name.ilike.%${q}%,attendee_email.ilike.%${q}%`)
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

  // Verify event belongs to this user
  const { data: event } = await admin
    .from('events')
    .select('id, name')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

  // Look up registration by QR token
  const { data: reg } = await admin
    .from('registrations')
    .select('id, attendee_name, attendee_email, status, checked_in_at, ticket_type_id, karta_card_url')
    .eq('qr_code_token', qr_code_token)
    .eq('event_id', params.id)
    .single();

  if (!reg) {
    return NextResponse.json({ result: 'invalid', message: 'QR code not recognised' }, { status: 200 });
  }

  if (reg.status === 'checked_in') {
    return NextResponse.json({
      result: 'already_checked_in',
      message: 'Already checked in',
      attendee_name: reg.attendee_name,
      checked_in_at: reg.checked_in_at,
    }, { status: 200 });
  }

  if (reg.status === 'cancelled' || reg.status === 'refunded') {
    return NextResponse.json({
      result: 'invalid',
      message: `Registration ${reg.status}`,
    }, { status: 200 });
  }

  // Mark checked in
  const { error } = await admin
    .from('registrations')
    .update({
      status: 'checked_in',
      checked_in_at: new Date().toISOString(),
      checked_in_by: user.id,
    })
    .eq('id', reg.id);

  if (error) return NextResponse.json({ error: 'Failed to check in' }, { status: 500 });

  // Increment session counter (best-effort)
  await admin.rpc('increment_checkin_session_count', { p_event_id: params.id }).maybeSingle();

  return NextResponse.json({
    result: 'success',
    message: 'Checked in',
    attendee_name: reg.attendee_name,
    attendee_email: reg.attendee_email,
    karta_card_url: reg.karta_card_url,
  }, { status: 200 });
}
